/* global chrome, document, window */
// Runs the actual production extension in a NEW disposable profile. Never pass
// a user profile: bookmarks below are deliberately synthetic screenshot data.
import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
const artifact = resolve(process.argv[2] ?? 'dist');
const capture = process.argv.includes('--capture');
const profile = await mkdtemp(join(tmpdir(), 'indexfold-release-profile-'));
const context = await chromium.launchPersistentContext(profile, { channel: 'chromium', headless: true, ignoreDefaultArgs: ['--disable-extensions'],
  viewport: { width: 1280, height: 900 }, colorScheme: 'light',
  args: ['--enable-unsafe-extension-debugging'] });
const errors = [];
try {
  const cdp = await context.browser().newBrowserCDPSession();
  const { id } = await cdp.send('Extensions.loadUnpacked', { path: artifact });
  assert.equal(id, 'nfhbegeoeafnpejpjdljhgagefbpafal');
  const page = await context.newPage();
  await page.addInitScript(() => { globalThis.releaseErrors = []; window.addEventListener('error', e => globalThis.releaseErrors.push(e.message)); });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`chrome-extension://${id}/index.html`);
  const nodes = await page.evaluate(async () => {
    const tree = await chrome.bookmarks.getTree();
    const root = tree[0].children.find(n => n.folderType === 'bookmarks-bar') ?? tree[0].children[0];
    const folder = (parentId, title) => chrome.bookmarks.create({ parentId, title });
    const bookmark = (parentId, title, url) => chrome.bookmarks.create({ parentId, title, url });
    const reading = await folder(root.id, 'Reading');
    const first = await bookmark(reading.id, 'Notes on clear writing', 'https://example.org/clear-writing');
    await bookmark(reading.id, 'A field guide to curiosity', 'https://example.org/curiosity');
    const design = await folder(reading.id, 'Design');
    await bookmark(design.id, 'Practical typography', 'https://example.org/typography');
    await bookmark(design.id, 'Designing for everyone', 'https://example.org/accessibility');
    const archived = await bookmark(reading.id, 'Old reading list', 'https://example.org/archive');
    const projects = await folder(root.id, 'Projects');
    await bookmark(projects.id, 'Weekend workshop', 'https://example.org/workshop');
    await bookmark(projects.id, 'Garden journal', 'https://example.org/garden');
    const learning = await folder(root.id, 'Learning');
    await bookmark(learning.id, 'TypeScript Handbook', 'https://www.typescriptlang.org/docs/handbook/intro.html');
    await bookmark(learning.id, 'Web accessibility essentials', 'https://www.w3.org/WAI/fundamentals/');
    return { reading: reading.id, first: first.id, design: design.id, archived: archived.id };
  });
  await page.reload();
  await page.locator('#catalogue-edit').click();
  await page.locator(`#edit-folder-${nodes.reading}`).click();
  await page.locator('#favorite-edit-tags').fill('reading');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('dialog')).toHaveCount(0);
  await page.locator(`[id="section-folder:${nodes.reading}"]`).click();
  await page.locator(`#edit-bookmark-${nodes.first}`).click();
  await page.locator('#favorite-edit-tags').fill('reference, writing');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('dialog')).toHaveCount(0);
  await page.locator(`#edit-bookmark-${nodes.archived}`).click();
  await page.getByLabel('Archive this bookmark', { exact: true }).check();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(page.locator(`#bookmark-${nodes.archived}`)).toHaveCount(0);
  await page.locator(`#folder-${nodes.design}`).click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  const settled = () => page.evaluate(() => Promise.all(document.getAnimations().map(a => a.finished.catch(() => {}))));
  const screenshot = async name => { await settled(); if (capture) { await mkdir('docs/images', { recursive: true }); await page.screenshot({ path: `docs/images/${name}.png` }); } };
  await page.mouse.move(1278, 899);
  await screenshot('dashboard-light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.getByRole('button', { name: 'Search /', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search bookmarks' }).fill('#reading');
  await expect(page.locator(`#bookmark-${nodes.first}`)).toBeVisible();
  await expect(page.locator(`#bookmark-${nodes.archived}`)).toHaveCount(0);
  await screenshot('search-dark');
  await page.keyboard.press('Escape');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.locator('#catalogue-edit').click();
  await page.locator(`#edit-bookmark-${nodes.first}`).click();
  await expect(page.locator('dialog')).toContainText('reading');
  await expect(page.locator('#favorite-edit-tags')).toHaveValue('reference,writing');
  await screenshot('edit-bookmark');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Manage', exact: true }).click();
  const help = page.getByRole('link', { name: 'User guide', exact: true });
  const url = 'https://github.com/fre3/indexfold/blob/v1.0.0/docs/user-guide.md';
  await expect(help).toHaveAttribute('href', url);
  await expect(help).toHaveAttribute('target', '_blank');
  await expect(help).toHaveAttribute('rel', /noopener/);
  await page.locator('.manage-navigation').getByRole('button', { name: 'Bookmarks', exact: true }).click();
  await page.locator('.legacy article').filter({ has: page.getByRole('link', { name: 'Notes on clear writing', exact: true }) }).getByRole('button', { name: 'Edit', exact: true }).click();
  const draft = page.locator('.legacy .editor').getByLabel('Title', { exact: true });
  await draft.fill('A retained help draft');
  // The version-pinned page is not published yet. Intercept only this request;
  // confirm the real link opens a new page and does not discard the editor.
  await context.route(url, route => route.fulfill({ contentType: 'text/html', body: '<title>User guide destination</title>' }));
  for (const panel of ['Bookmarks', 'Settings', 'Diagnostics']) {
    await page.locator('.manage-navigation').getByRole('button', { name: panel, exact: true }).click();
    await help.focus();
    const popupEvent = context.waitForEvent('page');
    await page.keyboard.press('Enter');
    const popup = await popupEvent; await popup.waitForLoadState();
    assert.equal(popup.url(), url); await popup.close();
  }
  await page.locator('.manage-navigation').getByRole('button', { name: 'Bookmarks', exact: true }).click();
  await expect(draft).toHaveValue('A retained help draft');
  const native = await page.evaluate(async id => (await chrome.bookmarks.get(id))[0].title, nodes.first);
  assert.equal(native, 'Notes on clear writing');
  const newTab = await context.newPage();
  await newTab.goto('chrome://newtab/');
  await expect(newTab.locator('#catalogue-manage')).toBeVisible();
  await expect(newTab).toHaveTitle('Indexfold');
  await newTab.close();
  const manifest = await page.evaluate(() => chrome.runtime.getManifest());
  assert.equal(manifest.version, '1.0.0');
  assert.deepEqual(manifest.permissions, ['bookmarks', 'storage', 'favicon', 'tabs']);
  assert.equal(manifest.host_permissions, undefined); assert.equal(manifest.content_scripts, undefined);
  const windowErrors = await page.evaluate(() => globalThis.releaseErrors);
  assert.deepEqual(windowErrors, []); assert.deepEqual(errors, []);
  await writeFile(join(profile, 'release-check.json'), JSON.stringify({ version: manifest.version, id, browser: context.browser()?.version(), artifact, windowErrors, errors, guideDraftPreserved: true, syntheticOnly: true }, null, 2));
  console.log(`PASS real packaged extension, tags/archive/search, screenshots and guide draft preservation: ${profile}`);
} finally { await context.close(); }
