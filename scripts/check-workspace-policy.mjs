/* global window */
import {chromium,expect} from '@playwright/test';
import {editingFixture} from './editing-fixture.mjs';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const fixture=await editingFixture({workspace:true}),browser=await chromium.launch(),report=[];
try {for(const theme of ['light','dark']) {
 const context=await browser.newContext({viewport:{width:1200,height:950},colorScheme:theme}),page=await context.newPage();
 await page.goto(fixture.url);await page.locator('#catalogue-edit').click();
 await expect(page.locator('[data-drag-title="ws-container"]')).toHaveCount(0);
 await page.locator('#edit-folder-ws-container').click();
 await expect(page.locator('#favorite-edit-title')).toHaveAttribute('readonly','');
 await expect(page.locator('dialog')).toContainText('unclassified browser location');
 await expect(page.locator('#favorite-edit-tags')).toBeEditable();
 await page.locator('#favorite-edit-tags').fill('workspace-tag');await page.getByRole('button',{name:'Save',exact:true}).click();
 await expect(page.locator('dialog')).toHaveCount(0);
 const evidence=await page.evaluate(async()=>{const s=await window.service.snapshot('read-only metadata evidence');return {writes:window.nativeWrites,tags:window.tagEvidence(s)['ws-container'],name:s.folders.find(n=>n.id==='ws-container').title};});
 assert.equal(evidence.name,'Projet');assert.equal(evidence.writes.length,0);assert.deepEqual(evidence.tags.direct,['workspace-tag']);
 await page.getByRole('button',{name:'More actions for Projet',exact:true}).click();
 await expect(page.locator('[popover]:popover-open')).toContainText('Native changes are unavailable');
 await expect(page.locator('[popover]:popover-open button')).toHaveCount(0);await page.keyboard.press('Escape');
 // Supported source must never produce a valid destination cue over unknown root.
 const source=page.locator('[data-drag-title="s0"]');await source.scrollIntoViewIfNeeded();const r=await source.boundingBox();
 await page.mouse.move(r.x+55,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+70,r.y+r.height/2,{steps:3});
 await expect(page.locator('.drag-preview')).toBeVisible();
 const root=page.locator('[data-root-id="ws"]');const t=await root.boundingBox();await page.mouse.move(t.x+t.width/2,t.y+t.height/2,{steps:10});
 await expect(page.locator('.drag-status')).toContainText('Cannot move');await page.keyboard.press('Escape');await page.mouse.up();
 await page.getByRole('button',{name:'New',exact:true}).first().click();await page.getByRole('menuitem',{name:'New favorite',exact:true}).click();
 await expect(page.locator('#create-parent option[value="ws"]')).toHaveCount(0);await expect(page.locator('#create-parent option[value="ws-folder"]')).toHaveCount(0);await expect(page.locator('#create-parent option[value="r1"]')).toHaveCount(1);
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.locator('#edit-folder-ws-container').click();await page.screenshot({path:join(fixture.output,`${theme}-workspace-metadata.png`)});await page.keyboard.press('Escape');
 report.push({theme,...evidence});await context.close();
}await writeFile(join(fixture.output,'workspace-report.json'),JSON.stringify(report,null,2));console.log(fixture.output);}finally{await browser.close();fixture.server.close();}
