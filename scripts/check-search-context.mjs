/* global document */
import { chromium, expect } from '@playwright/test';
import { editingFixture } from './editing-fixture.mjs';
import { join } from 'node:path';

const fixture = await editingFixture({ workspace: true });
const browser = await chromium.launch();
try {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: 1200, height: 850 }, colorScheme: theme });
    const page = await context.newPage();
    await page.goto(fixture.url);
    await page.getByRole('button', { name: 'Search /', exact: true }).click();
    const input = page.getByRole('textbox', { name: 'Search bookmarks' });
    // Match the ancestor path rather than the bookmark title: matching stays
    // intact even though repeated path suffixes no longer appear in the flow.
    await input.fill('@Notes');
    const section = page.locator('[data-section-id="folder:ws-container"]');
    await expect(section.locator('.section-heading-text')).toHaveText('Projet · Espaces de travail');
    await expect(section.locator('.folder-title')).toHaveText('Notes/');
    await expect(page.locator('#bookmark-ws-link')).toContainText('Workspace favorite');
    await expect(section).not.toContainText('Espaces de travail /');
    await expect(page.locator('.search-item-path')).toHaveCount(0);
    for (const width of [1200, 390]) {
      await page.setViewportSize({ width, height: 850 });
      await expect(page.locator('#bookmark-ws-link')).toBeVisible();
      await page.evaluate(() => Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {}))));
      await page.screenshot({ path: join(fixture.output, `${theme}-${width}-search.png`) });
    }
    await page.setViewportSize({ width: 1200, height: 850 });
    await page.keyboard.press('Alt+4');
    await expect(input).toHaveValue('@Notes');
    await expect(section.locator('.section-heading-text')).toHaveText('Projet');
    await expect(section.locator('.folder-title')).toHaveText('Notes/');
    await expect(page.locator('#bookmark-ws-link')).toBeVisible();
    await input.fill('Loose item');
    await expect(page.locator('[data-section-id="loose:ws"] .section-heading-text')).toHaveText('Bookmarks');
    await expect(page.locator('#bookmark-ws-loose')).toBeVisible();
    await expect(page.locator('.search-item-path')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'All bookmarks', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-section-id="loose:ws"]')).toHaveCount(0);
    await context.close();
  }
  console.log(`Search hierarchy, path matching, loose results and scope restoration passed: ${fixture.output}`);
} finally {
  await browser.close();
  fixture.server.close();
}
