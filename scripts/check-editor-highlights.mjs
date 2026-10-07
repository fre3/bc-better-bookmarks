/* global window, document, getComputedStyle */
import {chromium,expect} from '@playwright/test';
import {editingFixture} from './editing-fixture.mjs';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const fixture=await editingFixture({workspace:true,deep:true}),browser=await chromium.launch(),report=[];
const selected='.section-title-text[data-editing],.catalogue-item.is-selected';
try {for(const theme of ['light','dark']) {
 const context=await browser.newContext({viewport:{width:1250,height:950},colorScheme:theme}),p=await context.newPage();await p.goto(fixture.url);
 await expect(p.locator('[data-section-id^="loose:"]')).toHaveCount(3);await expect(p.locator('[data-moving]')).toHaveCount(0);await expect(p.locator(selected)).toHaveCount(0);
 await p.locator('#catalogue-edit').click();await expect(p.locator('[data-moving]')).toHaveCount(0);
 const section=p.locator('[data-section-id="folder:s0"]'),title=section.locator('.section-title-text').first();
 const before=await title.boundingBox();await p.locator('#edit-folder-s0').click();
 await expect(p.locator(selected)).toHaveCount(1);await expect(title).toHaveAttribute('data-editing','true');await expect(p.locator('[data-moving]')).toHaveCount(0);
 const after=await title.boundingBox();assert.deepEqual(after,before);
 assert.equal(await title.evaluate(n=>getComputedStyle(n).backgroundColor),await title.evaluate(n=>{const marker=document.createElement('span');marker.style.background='var(--selected)';n.append(marker);const color=getComputedStyle(marker).backgroundColor;marker.remove();return color;}));
 assert.equal(await section.locator('.root-provenance').first().evaluate(n=>getComputedStyle(n).backgroundColor),'rgba(0, 0, 0, 0)');
 await p.locator('#favorite-edit-title').fill('Edited section');await p.keyboard.press('Escape');await expect(p.getByText('Discard your unsaved changes?',{exact:true})).toBeVisible();await expect(p.locator(selected)).toHaveCount(1);
 await p.keyboard.press('Escape');await expect(p.locator('#favorite-edit-title')).toHaveValue('Edited section');await expect(p.locator(selected)).toHaveCount(1);
 await p.evaluate(()=>window.failSave=true);await p.getByRole('button',{name:'Save',exact:true}).click();await expect(p.locator('dialog')).toContainText('Synthetic browser write failure');await expect(p.locator(selected)).toHaveCount(1);
 await expect(p.locator('.is-peeking,.is-leaving')).toHaveCount(0);await p.screenshot({path:join(fixture.output,`${theme}-section-failed-save.png`)});
 await p.evaluate(()=>window.failSave=false);await p.getByRole('button',{name:'Save',exact:true}).click();await expect(p.locator('dialog')).toHaveCount(0);await expect(p.locator(selected)).toHaveCount(0);
 await p.locator('[id="section-folder:s0"]').click();await p.locator('#edit-folder-f0').click();await expect(p.locator('.folder-item.is-selected')).toHaveAttribute('data-item-id','f0');await expect(p.locator(selected)).toHaveCount(1);await p.keyboard.press('Escape');await expect(p.locator(selected)).toHaveCount(0);
 await p.locator('#bookmark-0-0').click();await expect(p.locator('.bookmark-item.is-selected')).toHaveAttribute('data-item-id','0-0');await expect(p.locator(selected)).toHaveCount(1);await expect(p.locator('.is-peeking,.is-leaving')).toHaveCount(0);await p.screenshot({path:join(fixture.output,`${theme}-favorite.png`)});await p.locator('#favorite-edit-tags').fill('unsaved');await p.keyboard.press('Escape');await p.getByRole('button',{name:'Discard changes',exact:true}).click();await expect(p.locator(selected)).toHaveCount(0);
 await p.mouse.move(1100,700);await p.mouse.wheel(0,260);await p.waitForTimeout(200);await p.locator('#edit-folder-s0').click();await expect(title).toHaveAttribute('data-editing','true');await expect(p.locator('.is-peeking,.is-leaving')).toHaveCount(0);await p.screenshot({path:join(fixture.output,`${theme}-sticky-section.png`)});await p.keyboard.press('Escape');
 // Same-title sections and nested folders must not share selection. Search/sticky heading uses same title-only state.
 await p.evaluate(()=>window.external('s1',{title:'Edited section'}));await p.getByRole('button',{name:'Search /',exact:true}).click();await p.getByRole('textbox',{name:'Search bookmarks'}).fill('@Edited');
 await p.locator('#edit-folder-s0').click();await expect(p.locator(selected)).toHaveCount(1);await expect(title).toHaveAttribute('data-editing','true');await expect(p.locator('[data-section-id="folder:s1"] [data-editing]')).toHaveCount(0);await p.keyboard.press('Escape');await p.getByRole('textbox',{name:'Search bookmarks'}).focus();await p.keyboard.press('Escape');
 await p.locator('#folder-f0').click();await p.locator('#edit-folder-deep').click();await p.setViewportSize({width:390,height:700});await expect(p.locator('.folder-item.is-selected')).toHaveAttribute('data-item-id','deep');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);await expect(p.locator('.is-peeking,.is-leaving')).toHaveCount(0);await p.screenshot({path:join(fixture.output,`${theme}-wrapped-folder.png`)});await p.keyboard.press('Escape');
 await p.setViewportSize({width:1250,height:950});await p.locator('#edit-bookmark-n0').click();await p.evaluate(()=>window.external('n0','delete'));await expect(p.locator('dialog')).toContainText('This item was removed');await expect(p.locator(selected)).toHaveCount(0);await p.keyboard.press('Escape');
 await expect(p.locator('[data-moving]')).toHaveCount(0);
 await p.locator('[id="section-folder:s0"]').click();await p.mouse.move(1240,5);await expect(p.locator('.is-peeking,.is-leaving')).toHaveCount(0);await expect(p.locator('.is-peeking,.is-leaving')).toHaveCount(0);await p.screenshot({path:join(fixture.output,`${theme}-clean-synthetic.png`),fullPage:true});
 report.push({theme,checks:'three synthetic groups; title-only section highlight; no geometry shift; dirty Escape twice; failed/successful Save; Cancel/discard; favorites/nested/wrapped folders; duplicate titles/search; source removal cleanup'});await context.close();
}await writeFile(join(fixture.output,'highlights-report.json'),JSON.stringify(report,null,2));console.log(fixture.output);}finally{await browser.close();fixture.server.close();}
