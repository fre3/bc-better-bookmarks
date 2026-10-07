/* global window */
import { chromium, expect } from '@playwright/test';
import { editingFixture } from './editing-fixture.mjs';
import assert from 'node:assert/strict';
const fixture = await editingFixture(), browser = await chromium.launch();
try {
 for (const theme of ['light', 'dark']) {
  const p = await browser.newPage({colorScheme:theme,viewport:{width:1200,height:850}});
  const prompts=[], errors=[];let accept=false;
  p.on('dialog',async d=>{prompts.push(d.message());if(accept)await d.accept();else await d.dismiss();});
  p.on('pageerror',e=>errors.push(e.message));await p.goto(fixture.url);
  await p.getByRole('button',{name:'Manage',exact:true}).click();
  const area=name=>p.locator('.manage-navigation').getByRole('button',{name,exact:true});
  await area('Bookmarks').click();
  const row=p.locator('.legacy article').filter({has:p.getByRole('link',{name:'Unique target 0',exact:true})});
  const open=()=>row.getByRole('button',{name:'Edit',exact:true}).click();
  const form=p.locator('.legacy .editor'),title=form.getByLabel('Title',{exact:true}),tags=form.getByLabel('Tags (comma separated; stored lowercase)');
  const cancel=()=>form.getByRole('button',{name:'Cancel',exact:true}).click();
  // Fail on the former unconditional Cancel confirmation, even when accepted.
  for(let i=0;i<3;i++){
   await open();if(i%2){await title.focus();await p.keyboard.press('Escape');}else await cancel();
   assert.equal(prompts.length,0,'Unchanged editor must not ask to discard');await expect(form).toHaveCount(0);await expect(row.getByRole('button',{name:'Edit',exact:true})).toBeFocused();
  }
  await open();await title.fill('Dirty');await cancel();assert.equal(prompts.length,1);await expect(title).toHaveValue('Dirty');
  await title.focus();await p.keyboard.press('Escape');assert.equal(prompts.length,2);await expect(title).toHaveValue('Dirty');
  await title.fill('Unique target 0');await tags.fill(' , , ');await cancel();assert.equal(prompts.length,2);await expect(form).toHaveCount(0);
  await open();const originalUrl=await form.getByLabel('URL (HTTP, HTTPS, or bookmarklet)').inputValue();await form.getByLabel('URL (HTTP, HTTPS, or bookmarklet)').fill('https://changed.test/');await form.getByLabel('URL (HTTP, HTTPS, or bookmarklet)').fill(originalUrl);
  await area('Settings').click();await expect(p.locator('.manage-draft')).toHaveCount(0);await p.getByRole('button',{name:'Back to dashboard'}).click();await p.getByRole('button',{name:'Manage',exact:true}).click();await area('Bookmarks').click();await cancel();assert.equal(prompts.length,2);
  await p.getByRole('button',{name:'New bookmark',exact:true}).click();await cancel();assert.equal(prompts.length,2);
  // Non-destructive navigation retains genuine drafts and shows the notice.
  await open();await tags.fill('archived, Work');await area('Diagnostics').click();await expect(p.locator('.manage-draft')).toBeVisible();await area('Bookmarks').click();await expect(tags).toHaveValue('archived, Work');accept=true;await cancel();accept=false;assert.equal(prompts.length,3);
  // Background updates never replace the opening baseline or expected token.
  await open();await title.fill('Local draft');await p.evaluate(()=>window.external('0-0',{title:'External update'}));await form.getByRole('button',{name:'Save bookmark'}).click();await expect(title).toHaveValue('Local draft');await expect.poll(()=>p.evaluate(()=>window.commands.filter(c=>c.type==='edit').length)).toBe(1);await cancel();assert.equal(prompts.length,4);await title.fill('Unique target 0');await cancel();assert.equal(prompts.length,4);await expect(form).toHaveCount(0);
  // New opens snapshot the new native value, not the preceding editor's state.
  await p.locator('.legacy article').filter({has:p.getByRole('link',{name:'External update',exact:true})}).getByRole('button',{name:'Edit',exact:true}).click();await expect(title).toHaveValue('External update');await cancel();assert.equal(prompts.length,4);
  // Shared catalogue modal remains clean/dirty/revert-safe for bookmarks/folders.
  await p.getByRole('button',{name:'Back to dashboard'}).click();await p.locator('#catalogue-edit').click();await p.locator('[id="section-folder:s0"]').click();
  for(const id of ['edit-bookmark-0-0','edit-folder-f0']){
   const trigger=p.locator('#'+id);await trigger.click();const input=p.locator('#favorite-edit-title'),original=await input.inputValue();await p.keyboard.press('Escape');await expect(p.locator('dialog')).toHaveCount(0);
   await trigger.click();await input.fill('Changed draft');await p.keyboard.press('Escape');await expect(p.getByRole('button',{name:'Continue editing'})).toBeVisible();await p.keyboard.press('Escape');await expect(input).toHaveValue('Changed draft');await input.fill(original);const box=p.getByRole('checkbox',{name:/Archive this/});const checked=await box.isChecked();await box.setChecked(!checked);await box.setChecked(checked);await p.keyboard.press('Escape');await expect(p.locator('dialog')).toHaveCount(0);await expect(trigger).toBeFocused();
  }
  assert.deepEqual(errors,[]);await p.close();console.log(`${theme}: unchanged/dirty/reverted/repeated dismissal, navigation retention, external conflict, bookmark/folder modal Escape passed`);
 }
} finally { await browser.close();fixture.server.close(); }
