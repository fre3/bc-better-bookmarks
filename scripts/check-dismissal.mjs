/* global document, window */
import {chromium, expect} from '@playwright/test';
import {editingFixture} from './editing-fixture.mjs';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const f=await editingFixture(), b=await chromium.launch(), report=[];
try {for(const theme of ['light','dark']) {
 const p=await b.newPage({colorScheme:theme});await p.goto(f.url);await p.locator('#catalogue-edit').click();await p.locator('[id="section-folder:s0"]').click();
 await p.evaluate(()=>{window.nativeClose=[];document.addEventListener('close',()=>window.nativeClose.push('close'),true)});
 for(let cycle=0;cycle<3;cycle++)for(const folder of [false,true]){
  const target=folder?p.locator('#edit-folder-f0'):p.locator('#edit-bookmark-0-0');
  // This also runs on the modal-only fix before explicit bookmark controls land.
  await (await target.count()?target:p.locator('#bookmark-0-0')).click();
  const title=p.getByLabel(folder?'Name':'Title',{exact:true});await title.fill('Retained '+cycle);
  for(let n=0;n<4;n++){await p.keyboard.press('Escape');await expect(p.getByRole('button',{name:'Continue editing'})).toBeFocused();await p.keyboard.press('Escape');await expect(title).toBeFocused();await expect(title).toHaveValue('Retained '+cycle);assert.equal(await p.locator('dialog').evaluate(d=>d.open),true)}
  await p.getByRole('button',{name:'Save',exact:true}).click();await expect(p.locator('dialog')).toHaveCount(0);
  await (await target.count()?target:p.locator('#bookmark-0-0')).click();await title.fill('Discard me');await p.keyboard.press('Escape');await p.getByRole('button',{name:'Discard changes',exact:true}).click();await expect(p.locator('dialog')).toHaveCount(0);
  await (await target.count()?target:p.locator('#bookmark-0-0')).click();await expect(title).toHaveValue('Retained '+cycle);await p.keyboard.press('Escape');await expect(p.locator('dialog')).toHaveCount(0);
  assert.equal(await p.evaluate(()=>document.documentElement.style.overflow),'');
 }
 await p.locator('#catalogue-edit').click();await p.keyboard.type('probe');await expect(p.getByRole('textbox',{name:'Search bookmarks'})).toHaveValue('probe');await p.keyboard.press('Escape');await p.locator('#catalogue-edit').click();
 await (await p.locator('#edit-bookmark-0-1').count()?p.locator('#edit-bookmark-0-1'):p.locator('#bookmark-0-1')).click();await expect(p.getByLabel('Title',{exact:true})).toBeFocused();await p.keyboard.press('Escape');await expect(p.locator('dialog')).toHaveCount(0);
 report.push({theme,cycles:6,escapePairs:24,result:'intact drafts, Save, explicit discard, unchanged dismissal, repeated favorite/folder reopening, mode and background search recovery'});await p.close();
}await writeFile(join(f.output,'dismissal-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({output:f.output,report},null,2));}finally{await b.close();await new Promise(r=>f.server.close(r))}
