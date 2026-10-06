/* global window, document */
import { chromium, expect } from '@playwright/test';
import { editingFixture } from './editing-fixture.mjs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const { output, server, url } = await editingFixture();
const browser = await chromium.launch(); const report=[];
const section=(p,i)=>p.locator(`[id="section-folder:s${i}"]`);
const folderEdit=(p,id)=>p.locator(`[id="edit-folder-${id}"]`);
const title=p=>p.getByLabel('Name',{exact:true});
const tags=p=>p.getByLabel('Tags (comma separated; stored lowercase)',{exact:true});
const save=p=>p.getByRole('button',{name:'Save',exact:true});
const cancel=p=>p.getByRole('button',{name:'Cancel',exact:true});
const modal=p=>p.getByRole('dialog');
const manage=p=>p.getByRole('button',{name:'Manage',exact:true});
const back=p=>p.getByRole('button',{name:'Back to catalogue',exact:true});
async function editFolder(p,id,name,t){await folderEdit(p,id).click();await expect(title(p)).toBeFocused();await expect(p.locator('#favorite-edit-url')).toHaveCount(0);if(name)await title(p).fill(name);await tags(p).fill(t);await p.getByLabel('Archive this folder and its contents',{exact:true}).setChecked(t.toLowerCase().split(',').map(t=>t.trim()).includes('archived'));await save(p).click();await expect(modal(p)).toHaveCount(0);}
try {
 for (const theme of ['light','dark']) {
  const context=await browser.newContext({viewport:{width:1250,height:850},colorScheme:theme,acceptDownloads:true}); const p=await context.newPage();await p.goto(url);await p.getByRole('button',{name:'Edit',exact:true}).click();
  assert.equal(await folderEdit(p,'r1').count(),0); // browser root is never editable
  await editFolder(p,'s0','Design renamed','parent, shared');await expect(folderEdit(p,'s0')).toBeFocused();
  await section(p,0).click();await editFolder(p,'f0','Nested renamed','child, shared');await p.locator('#folder-f0').click();
  await p.locator('#edit-bookmark-n0').click();await expect(p.getByText('Inherited tags (read only). Change these at their source:')).toBeVisible();await expect(tags(p)).toHaveValue('');await expect(modal(p)).toContainText('Design renamed / Nested renamed');await tags(p).fill('own, shared');await save(p).click();await expect(modal(p)).toHaveCount(0);
  await p.locator('#bookmark-n0').hover();await p.screenshot({path:join(output,`${theme}-inherited-annotations.png`)});let a=p.locator('[data-item-id="n0"] .all-annotations');await expect(a.locator('strong')).toHaveCount(3);await expect(a).toContainText('#own');assert.equal(await a.locator('strong').filter({hasText:'#shared'}).count(),1);
  const before=await p.locator('#bookmark-n0').boundingBox();await p.mouse.move(1240,5);await p.getByRole('button',{name:'Search /',exact:true}).focus();await expect(a).toBeHidden();assert.deepEqual(await p.locator('#bookmark-n0').boundingBox(),before);
  await folderEdit(p,'f0').click();await p.waitForTimeout(200);await p.screenshot({path:join(output,`${theme}-folder-editor.png`)});await cancel(p).click();
  // An inherited search match explains itself in bold; direct data stays direct.
  await p.getByRole('button',{name:'Search /',exact:true}).click();const search=p.getByRole('textbox',{name:'Search bookmarks'});await search.fill('#child');await expect(p.locator('#bookmark-n0')).toBeVisible();await expect(p.locator('[data-item-id="n0"] .matched-annotations strong').filter({hasText:'#child'})).toBeVisible();await p.keyboard.press('Escape');
  // Archive a descendant independently, then its source folder. Neither Edit
  // mode nor #archived bypasses the default visibility gate.
  await p.locator('#edit-bookmark-n0').click();await tags(p).fill('own, shared, archived');await save(p).click();await expect(modal(p)).toHaveCount(0);await expect(p.locator('#bookmark-n0')).toHaveCount(0);
  await editFolder(p,'s0',null,'parent, shared, ARCHIVED');await expect(section(p,0)).toHaveCount(0);await expect(p.getByRole('button',{name:'Done',exact:true})).toHaveAttribute('aria-pressed','true');
  await p.getByRole('button',{name:'Search /',exact:true}).click();await search.fill('#archived');await expect(p.locator('.section-slot')).toHaveCount(0);await p.keyboard.press('Escape');
  await manage(p).click();await expect(p.locator('.legacy')).not.toContainText('Design renamed');await expect(p.getByLabel('Show archived',{exact:true})).not.toBeChecked();
  const other=await context.newPage();await other.goto(url);await manage(other).click();
  await p.getByLabel('Show archived',{exact:true}).check();await expect(other.getByLabel('Show archived',{exact:true})).toBeChecked();await other.reload();await manage(other).click();await expect(other.getByLabel('Show archived',{exact:true})).toBeChecked();await other.close();
  await expect(p.locator('.legacy')).toContainText('Design renamed');await p.screenshot({path:join(output,`${theme}-archived-manage.png`)});await back(p).click();await expect(section(p,0)).toBeVisible();
  await editFolder(p,'s0',null,'parent, shared');await manage(p).click();await p.getByLabel('Show archived',{exact:true}).uncheck();await back(p).click();await expect(section(p,0)).toBeVisible();await expect(p.locator('#bookmark-n0')).toHaveCount(0); // independent direct archive remains
  // Partial native rename: retain unsaved tags, review actual values, then retry
  // the remaining write with a fresh token through unchanged service guards.
  await editFolder(p,'s1',null,'baseline');await folderEdit(p,'s1').click();await title(p).fill('Native rename succeeded');await tags(p).fill('remaining');await p.evaluate(()=>window.failTagWrite=true);await save(p).click();await expect(modal(p)).toContainText('Completed native changes: name');await expect(tags(p)).toHaveValue('remaining');
  await p.getByRole('button',{name:'Review current values for recovery'}).click();await expect(modal(p)).toContainText('Current name/title: Native rename succeeded');await p.evaluate(()=>window.failTagWrite=false);await p.getByRole('button',{name:'Keep my input and use these values as the save baseline'}).click();await save(p).click();await expect(modal(p)).toHaveCount(0);
  // Keep section expansion separate from its Edit action and guard dirty drafts.
  await folderEdit(p,'s1').click();await title(p).fill('Draft');await p.keyboard.press('Escape');await expect(p.getByRole('button',{name:'Continue editing'})).toBeFocused();await p.getByRole('button',{name:'Continue editing'}).click();assert.equal((await p.evaluate(()=>window.requestSearch())).status,'blocked');await p.setViewportSize({width:390,height:700});await p.screenshot({path:join(output,`${theme}-folder-narrow.png`)});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);await cancel(p).click();await p.getByRole('button',{name:'Discard changes',exact:true}).click();
  // Deliberate reset only in this isolated fixture, preceded by downloadable
  // full metadata backup/inventory. Native tree and independent UI prefs survive.
  await manage(p).click();await p.getByLabel('Show archived',{exact:true}).check();await p.getByText('Folder identity review and test metadata setup',{exact:true}).click();
  const native=await p.evaluate(async()=>JSON.stringify((await window.service.snapshot('test')).tree));const dl=p.waitForEvent('download');await p.getByRole('button',{name:'Export metadata and review reset inventory'}).click();const download=await dl;await download.saveAs(join(output,`${theme}-synthetic-backup.json`));await expect(p.getByText('Backup download requested.',{exact:false})).toBeVisible();
  await p.getByLabel('I have verified metadata backups for every device and disabled all old clients.').check();await p.getByRole('button',{name:'Reset extension bookmark metadata only',exact:true}).click();await expect(p.getByRole('button',{name:'Reset extension bookmark metadata only',exact:true})).toHaveCount(0);await expect(p.getByLabel('Show archived',{exact:true})).toBeChecked();assert.equal(await p.evaluate(async()=>JSON.stringify((await window.service.snapshot('test')).tree)),native);assert.equal(await p.evaluate(()=>Object.keys(window.sync.data).filter(k=>k.startsWith('meta:')).length),0);
  report.push({theme,passed:'folder/nested editing, source inheritance, bold/deduplicated annotations, no reflow, search, archive gate, independent descendant archive, Manage and cross-tab preference, partial recovery, draft/keyboard isolation, narrow layout, controlled reset export and native-data invariance'});await context.close();
 }
 // A fresh profile exercises consolidated second-device binding and the filtered
 // card collection with actual pointer/wheel input (no live browser storage).
 const c=await browser.newContext({viewport:{width:1250,height:700}});const p=await c.newPage();await p.goto(url);await p.getByRole('button',{name:'Edit',exact:true}).click();
 await editFolder(p,'s0',null,'source');await editFolder(p,'s1',null,'second');
 await p.evaluate(async()=>{window.local.data.state.mappings={};window.local.data.metadataJournal={schemaVersion:1,entries:{}};window.refresh()});
 await manage(p).click();await p.getByText('Folder identity review and test metadata setup',{exact:true}).click();
 const review=p.locator('.metadata-setup');await expect(review.getByText('candidate:',{exact:false})).toHaveCount(2);
 for (const checkbox of await review.locator('li input[type=checkbox]').all()) await checkbox.check();await p.getByRole('button',{name:'Confirm selected original folders'}).click();await expect(review.getByText('candidate:',{exact:false})).toHaveCount(0);
 await back(p).click();
 await section(p,0).click();await p.locator('#edit-bookmark-0-0').click();await tags(p).fill('baseline');await save(p).click();await expect(modal(p)).toHaveCount(0);await p.locator('#edit-bookmark-0-0').click();await p.getByLabel('Title',{exact:true}).fill('Native saved then moved');await tags(p).fill('remaining');await p.evaluate(()=>window.failTagWrite=true);await save(p).click();await expect(modal(p)).toContainText('Completed native changes: title');
 await p.evaluate(()=>window.external('0-0',{parentId:'s2'}));await expect(modal(p).getByRole('alert').first()).toContainText('changed');await p.getByRole('button',{name:'Review current values for recovery'}).click();await expect(modal(p)).toContainText('Parent: Favorites bar / Career 2');await p.evaluate(()=>window.failTagWrite=false);await p.getByRole('button',{name:'Keep my input and use these values as the save baseline'}).click();await save(p).click();await expect(modal(p)).toHaveCount(0);
 assert.equal(await p.evaluate(async()=>(await window.service.snapshot('verify recovery parent')).favorites.find(f=>f.id==='0-0').parentId),'s2');
 await editFolder(p,'s1',null,'archived');await editFolder(p,'s11',null,'archived');
 await expect(section(p,1)).toHaveCount(0);await expect(section(p,11)).toHaveCount(0);
 await section(p,0).click();await p.mouse.move(1245,5);await section(p,0).hover();await p.waitForTimeout(200);await expect(p.locator('.peek-summary')).not.toContainText('Reference 1');
 // Last visible card is now s10, so it must inherit final-card hover behavior.
 await section(p,10).scrollIntoViewIfNeeded();await section(p,10).hover();await p.waitForTimeout(200);
 const last=p.locator('[data-section-id="folder:s10"]');await expect(last).toHaveClass(/is-peeking/);await expect(last.locator('.peek-successor')).toHaveCount(0);
 const box=await section(p,10).boundingBox();await p.mouse.move(100,box.y+100);await p.mouse.wheel(0,70);await p.waitForTimeout(250);await expect(last).toHaveClass(/is-peeking/);
 await p.screenshot({path:join(output,'archive-filtered-final-peek.png')});await p.mouse.move(1245,5);await p.keyboard.press('Home');
 await manage(p).click();await p.getByLabel('Show archived',{exact:true}).check();await back(p).click();await expect(section(p,11)).toHaveCount(1);
 await section(p,10).scrollIntoViewIfNeeded();await section(p,10).hover();await p.waitForTimeout(200);await expect(last.locator('.peek-successor')).toHaveCount(1);
 report.push({passed:'consolidated explicit folder binding; partial-save recovery preserves externally moved parent; archived section omitted from Next summaries; final visible section hover/passthrough geometry recomputed after archive preference changes'});await c.close();
 await writeFile(join(output,'folder-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({output,report},null,2));
} finally {await browser.close();await new Promise(r=>server.close(r))}
