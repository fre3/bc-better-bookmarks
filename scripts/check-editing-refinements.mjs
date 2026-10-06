/* global window, document, getComputedStyle */
import { chromium, expect } from '@playwright/test';
import {editingFixture} from './editing-fixture.mjs';
import {writeFile} from 'node:fs/promises';import {join} from 'node:path';import assert from 'node:assert/strict';
const f=await editingFixture(),b=await chromium.launch(),report=[];
async function anchor(p,item,title,tag){return p.locator(item).evaluate((node,{title,tag})=>{const text=node.querySelector(title);const range=document.createRange();range.selectNodeContents(text.firstChild);const first=range.getClientRects()[0],a=node.querySelector(tag).getBoundingClientRect();return {dx:a.left-first.left,gap:a.top-first.bottom,visible:getComputedStyle(node.querySelector(tag)).visibility};},{title,tag})}
try {for(const theme of ['light','dark']) {
 const context=await b.newContext({viewport:{width:1250,height:850},colorScheme:theme});const p=await context.newPage();await p.goto(f.url);
 const navBefore=await p.locator('.catalogue-navigation').boundingBox();await p.locator('#catalogue-edit').click();assert.deepEqual(await p.locator('.catalogue-navigation').boundingBox(),navBefore);
 await expect(p.getByRole('button',{name:'Done',exact:true})).toBeVisible();await expect(p.getByText('Click Edit beside a favorite or folder to make changes.',{exact:true})).toBeVisible();
 for(const id of ['s0','f0']){if(id==='f0')await p.locator('[id="section-folder:s0"]').click();await p.locator('#edit-folder-'+id).click();await p.locator('#favorite-edit-tags').fill(id==='s0'?'parent':'child');await p.getByRole('button',{name:'Save',exact:true}).click();await expect(p.locator('dialog')).toHaveCount(0)}
 await p.locator('#folder-f0').hover();await p.waitForTimeout(240);
 let a=await anchor(p,'[data-item-id="f0"]','.folder-title','.item-annotation');assert(Math.abs(a.dx)<1&&a.gap>=1&&a.gap<=3,JSON.stringify(a));
 await p.locator('[id="section-folder:s0"]').hover();a=await anchor(p,'[data-section-id="folder:s0"] h2','.section-title-text','.section-tag-annotation');assert(Math.abs(a.dx)<1&&a.gap>=1&&a.gap<=3,JSON.stringify(a));
 await p.locator('#folder-f0').click();await p.locator('#bookmark-n0').hover();await p.waitForTimeout(150);await p.screenshot({path:join(f.output,`${theme}-editing-tags.png`)});
 await p.locator('#edit-bookmark-n0').click();await p.screenshot({path:join(f.output,`${theme}-editor.png`)});await p.getByRole('button',{name:'Cancel',exact:true}).click();await expect(p.locator('#edit-bookmark-n0')).toBeFocused();
 // Native title navigation and modifiers keep their own action; Edit stays a button.
 await expect(p.locator('#bookmark-n0')).toHaveAttribute('href','https://example.test/nested');const popup=context.waitForEvent('page');await p.locator('#bookmark-n0').click({modifiers:['Control']});const opened=await popup;await opened.close();await expect(p.locator('dialog')).toHaveCount(0);
 await p.locator('[id="section-folder:s5"]').scrollIntoViewIfNeeded();await expect(p.getByRole('button',{name:'Done',exact:true})).toBeInViewport();const nav=await p.locator('.catalogue-navigation').boundingBox();const head=await p.locator('[id="section-folder:s5"]').boundingBox();assert(head.y>=nav.y+nav.height-1);
 await p.setViewportSize({width:390,height:700});await p.locator('[id="section-folder:s0"]').scrollIntoViewIfNeeded();await p.locator('#folder-f0').hover();await p.waitForTimeout(200);a=await anchor(p,'[data-item-id="f0"]','.folder-title','.item-annotation');assert(Math.abs(a.dx)<1&&a.gap>=1&&a.gap<=3);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));await p.screenshot({path:join(f.output,`${theme}-narrow.png`)});
 await p.emulateMedia({forcedColors:'active'});await p.screenshot({path:join(f.output,`${theme}-forced-colors.png`)});await expect(p.getByRole('button',{name:'Done',exact:true})).toBeInViewport();
 report.push({theme,result:'explicit controls, unchanged navigation geometry, native modifier navigation, first-text-fragment section/folder tag anchors, sticky Done and unobstructed header targets, narrow and forced-colors rendering'});await context.close();
}await writeFile(join(f.output,'refinements-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({output:f.output,report},null,2));}finally{await b.close();await new Promise(r=>f.server.close(r))}
