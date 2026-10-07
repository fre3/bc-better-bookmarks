/* global window, document */
// Real App + real DashboardService/metadata repository over synthetic browser
// ports. This exercises existing safeguards, not a second save implementation.
import { chromium, expect } from '@playwright/test';
import { editingFixture } from './editing-fixture.mjs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const { output, server, url } = await editingFixture();
const browser=await chromium.launch();const report=[];
const section=(page,i)=>page.locator(`[id="section-folder:s${i}"]`);
const bookmark=(page,id)=>page.locator(`[id="bookmark-${id}"]`);
const edit=(page,id)=>page.locator(`[id="edit-bookmark-${id}"]`);
const title=page=>page.getByLabel('Title',{exact:true});
const save=page=>page.getByRole('button',{name:'Save',exact:true});
const cancel=page=>page.getByRole('button',{name:'Cancel',exact:true});
const dialog=page=>page.getByRole('dialog',{name:'Edit bookmark'});
async function closeDirty(page){await cancel(page).click();await page.getByRole('button',{name:'Discard changes',exact:true}).click();await expect(dialog(page)).toHaveCount(0)}
async function open(page,id='0-0'){await edit(page,id).click();await expect(title(page)).toBeFocused()}
try {
 for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width:1250,height:800},colorScheme:theme});const page=await context.newPage();
  const uncaught=[];page.on('pageerror',e=>uncaught.push(e.message));await page.goto(url);
  await section(page,0).click();await expect(bookmark(page,'0-0')).toHaveAttribute('href','https://example.test/0/0');
  await page.getByRole('button',{name:'Edit',exact:true}).click();await expect(bookmark(page,'0-0')).toHaveAttribute('href','https://example.test/0/0');
  // Edit controls never navigate; title links keep native activation semantics.
  await page.waitForTimeout(240);
  const beforeModal=await page.evaluate(()=>({y:window.scrollY,width:document.querySelector('.catalogue-flow').getBoundingClientRect().width,height:Math.round(document.querySelector('.catalogue-flow').getBoundingClientRect().height*100)/100}));
  const editBox=await edit(page,'0-0').boundingBox();await page.keyboard.down('Control');await page.mouse.click(editBox.x+editBox.width/2,editBox.y+editBox.height/2);await page.keyboard.up('Control');await expect(title(page)).toBeFocused();assert.equal(context.pages().length,1);
  assert.deepEqual(await page.evaluate(()=>({y:window.scrollY,width:document.querySelector('.catalogue-flow').getBoundingClientRect().width,height:Math.round(document.querySelector('.catalogue-flow').getBoundingClientRect().height*100)/100})),beforeModal);
  const geometry=await page.evaluate(()=>({y:window.scrollY,x:document.querySelector('.section-stack').getBoundingClientRect().x}));
  await page.keyboard.press('Shift+Tab');await expect(page.getByText('Diagnostic details',{exact:true})).toBeFocused();await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Save');
  await page.keyboard.press('Tab');await expect(page.getByText('Diagnostic details',{exact:true})).toBeFocused();await page.keyboard.press('Tab');await expect(title(page)).toBeFocused();
  const rootBefore=await page.locator('.catalogue [aria-current="page"]').textContent();
  await page.keyboard.press('Alt+3');assert.equal(await page.locator('.catalogue [aria-current="page"]').textContent(),rootBefore);
  assert.equal((await page.evaluate(()=>window.requestSearch())).status,'blocked');await expect(title(page)).toBeFocused();
  await page.mouse.click(4,4);await expect(dialog(page)).toBeVisible();
  await page.mouse.wheel(0,450);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.scrollY),geometry.y);
  await page.screenshot({path:join(output,`${theme}-modal.png`)});
  await page.keyboard.press('Escape');await expect(dialog(page)).toHaveCount(0);await expect(edit(page,'0-0')).toBeFocused();
  assert.deepEqual(await page.evaluate(()=>({y:window.scrollY,x:document.querySelector('.section-stack').getBoundingClientRect().x})),geometry);
  await bookmark(page,'0-0').click({button:'middle'});await expect(dialog(page)).toHaveCount(0);await expect.poll(()=>context.pages().length).toBe(2);await context.pages()[1].close();
  await edit(page,'0-0').focus();await page.keyboard.press('Space');await expect(title(page)).toBeFocused();
  await title(page).fill('Draft retained');await page.evaluate(theme=>window.chrome.runtime.sendMessage({event:'set-appearance',appearance:theme==='light'?'dark':'light'}),theme);await expect(title(page)).toHaveValue('Draft retained');await expect(title(page)).toBeFocused();await page.evaluate(theme=>window.chrome.runtime.sendMessage({event:'set-appearance',appearance:theme}),theme);await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Continue editing'})).toBeFocused();
  await page.getByRole('button',{name:'Continue editing'}).click();await expect(title(page)).toBeFocused();await expect(title(page)).toHaveValue('Draft retained');
  await cancel(page).click();await page.keyboard.press('Escape');await expect(dialog(page)).toBeVisible();await expect(title(page)).toHaveValue('Draft retained');
  // Error locations + no invalid worker commands.
  await title(page).fill(' ');await page.getByLabel('URL (HTTP, HTTPS, or bookmarklet)',{exact:true}).fill('mailto:invalid@example.test');await page.getByLabel('Tags (comma separated; stored lowercase)').fill('x'.repeat(81));
  await save(page).click();await expect(title(page)).toHaveAttribute('aria-invalid','true');await expect(page.locator('#favorite-url-error')).toBeVisible();await expect(page.locator('#favorite-tags-error')).toBeVisible();
  assert.equal(await page.evaluate(()=>window.commands.filter(c=>c.type==='edit').length),0);
  await title(page).fill('Saved title');await page.getByLabel('URL (HTTP, HTTPS, or bookmarklet)',{exact:true}).fill('https://example.test/changed');await page.getByLabel('Tags (comma separated; stored lowercase)').fill('Work, work, Reference');
  await page.evaluate(()=>window.failSave=true);await save(page).click();await expect(dialog(page).getByRole('alert')).toContainText('Synthetic browser write failure');await expect(title(page)).toHaveValue('Saved title');
  await page.evaluate(()=>{window.failSave=false;window.holdSave=true});await save(page).click();await expect(page.getByRole('button',{name:'Saving…'})).toBeDisabled();
  await page.locator('dialog form').evaluate(form=>{form.requestSubmit();form.requestSubmit()});await page.keyboard.press('Escape');await expect(dialog(page)).toBeVisible();
  assert.equal(await page.evaluate(()=>window.commands.filter(c=>c.type==='edit').length),2);
  await page.evaluate(()=>{window.holdSave=false;window.releaseSave()});await expect(dialog(page)).toHaveCount(0);await expect(edit(page,'0-0')).toBeFocused();await expect(bookmark(page,'0-0')).toContainText('Saved title');
  const saved=await page.evaluate(async()=>{const s=await window.service.snapshot('check');return {favorite:s.favorites.find(f=>f.id==='0-0'),tags:s.metadata.records[0].tags}});assert.equal(saved.favorite.url,'https://example.test/changed');assert.deepEqual(saved.tags,['reference','work']);assert.equal(saved.favorite.parentId,'s0');
  await expect(page.getByRole('button',{name:'Done',exact:true})).toHaveAttribute('aria-pressed','true');
  // Every bookmarklet save retains the existing explicit browser confirmation.
  await open(page,'0-5');const code='javascript:alert(1); /* exact opaque code */';await page.locator('#favorite-edit-url').fill(code);
  const prior=await page.evaluate(()=>window.commands.filter(c=>c.type==='edit').length);page.once('dialog',d=>d.dismiss());await save(page).click();await expect(dialog(page)).toBeVisible();assert.equal(await page.evaluate(()=>window.commands.filter(c=>c.type==='edit').length),prior);
  page.once('dialog',d=>d.accept());await save(page).click();await expect(dialog(page)).toHaveCount(0);assert.equal(await page.evaluate(async()=>(await window.service.snapshot('check')).favorites.find(f=>f.id==='0-5').url),code);
  // Existing opaque multiline code survives an unrelated title edit unchanged.
  const multiline='javascript:alert(1)\n// retained code';await page.evaluate(async url=>window.external('0-5',{url}),multiline);await page.waitForTimeout(200);await open(page,'0-5');await title(page).fill('Opaque multiline retained');page.once('dialog',d=>d.accept());await save(page).click();await expect(dialog(page)).toHaveCount(0);assert.equal(await page.evaluate(async()=>(await window.service.snapshot('check')).favorites.find(f=>f.id==='0-5').url),multiline);
  // External changes/moves/deletions preserve typed draft and reject stale writes.
  for(const [id,change] of [['0-1',{title:'External title'}],['0-2',{parentId:'s1'}],['0-3','delete']]){
   await open(page,id);await title(page).fill('Recoverable draft');await page.evaluate(async({id,change})=>window.external(id,change),{id,change});
   await expect(dialog(page).getByRole('alert')).toContainText(change==='delete'?'removed':'changed');await expect(save(page)).toBeDisabled();await expect(title(page)).toHaveValue('Recoverable draft');await closeDirty(page);
  }
  // Existing worker metadata-health guards and ignored legacy scope preferences remain authoritative.
  await page.evaluate(()=>{const key=Object.keys(window.sync.data).find(k=>k.startsWith('meta:'));delete window.sync.data[key];window.refresh()});await page.waitForTimeout(250);await open(page);await expect(title(page)).not.toBeEditable();await expect(save(page)).toBeDisabled();await expect(page.locator('#favorite-metadata-status')).toContainText('missing synchronized metadata');await expect(title(page)).toHaveValue('Saved title');await cancel(page).click();
  assert.equal(await page.evaluate(async()=>(await window.service.snapshot('check')).favorites.find(f=>f.id==='0-0').title),'Saved title');
  await page.evaluate(()=>{window.local.data.state.rootId=null;window.refresh()});await page.waitForTimeout(220);await open(page,'0-4');await expect(save(page)).toBeEnabled();await cancel(page).click();
  // Search edits remove results only after save; query/scope and original Escape
  // snapshot survive, with an accessible nearby focus fallback.
  await page.getByRole('button',{name:'Favorites bar',exact:true}).click();await section(page,0).click();await page.locator('#folder-f0').click();
  await page.getByRole('button',{name:'Search /',exact:true}).click();const search=page.getByRole('textbox',{name:'Search bookmarks'});await search.fill('"no match"');await search.fill('Ordinary favorite 4');await open(page,'0-4');await page.locator('#favorite-edit-tags').fill('retained-result');await save(page).click();await expect(dialog(page)).toHaveCount(0);await expect(edit(page,'0-4')).toBeFocused();await expect(search).toHaveValue('Ordinary favorite 4');await search.fill('Unique target 1');
  await open(page,'1-0');await title(page).fill('Renamed search result');await save(page).click();await expect(dialog(page)).toHaveCount(0);await expect(search).toBeFocused();await expect(search).toHaveValue('Unique target 1');await expect(bookmark(page,'1-0')).toHaveCount(0);await expect(page.getByRole('status').filter({hasText:'Bookmark saved'})).toHaveCount(1);
  await page.keyboard.press('Escape');await expect(page.locator('.catalogue [aria-current="page"]')).toHaveText('Favorites bar');await expect(section(page,0)).toHaveAttribute('aria-expanded','true');await expect(page.locator('#folder-f0')).toHaveAttribute('aria-expanded','true');
  await section(page,1).hover();await page.waitForTimeout(1250);await expect(page.locator('.is-peeking')).toHaveCount(1);
  const beforePeekModal=await page.evaluate(()=>window.scrollY);await edit(page,'n0').evaluate(n=>n.focus({preventScroll:true}));await page.keyboard.press('Enter');await expect(title(page)).toBeFocused();await expect(page.locator('.is-peeking, .is-leaving')).toHaveCount(0);assert.equal(await page.evaluate(()=>window.scrollY),beforePeekModal);
  await page.setViewportSize({width:390,height:700});await expect(title(page)).toBeFocused();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);assert.equal(await dialog(page).evaluate(d=>d.scrollWidth<=d.clientWidth),true);await page.screenshot({path:join(output,`${theme}-narrow.png`)});await cancel(page).click();
  await page.getByRole('button',{name:'Done',exact:true}).click();await expect(bookmark(page,'n0')).toHaveAttribute('href');
  await page.reload();await expect(page.getByRole('button',{name:'Edit',exact:true})).toHaveAttribute('aria-pressed','false');
  assert.deepEqual(uncaught,[]);report.push({theme,checks:'activation, focus trap/restoration, modal isolation, validation, failed/duplicate/success saves, dirty protection, external conflicts, metadata guards and ignored legacy scope, search removal/Escape, narrow layout, transient mode'});await context.close();
 }
 await writeFile(join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({output,report},null,2));
} finally {await browser.close();await new Promise(resolve=>server.close(resolve))}
