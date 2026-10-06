/* global window, document, scrollY, getComputedStyle, requestAnimationFrame */
import { chromium, expect } from '@playwright/test';
import { editingFixture } from './editing-fixture.mjs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const fixture = await editingFixture({deep:true}), browser = await chromium.launch(), report=[];
const section = (p,id='s0') => p.locator(`[id="section-folder:${id}"]`);
try { for (const theme of ['light','dark']) {
 const context=await browser.newContext({viewport:{width:1250,height:850},colorScheme:theme}), p=await context.newPage(), errors=[];
 p.on('pageerror',e=>errors.push(String(e)));await p.goto(fixture.url);await expect(section(p)).toBeVisible();
 await p.evaluate(()=>{window.local.data.state.rootId='nonexistent-old-scope';window.refresh()});
 await p.locator('#catalogue-edit').click();
 for(const id of ['s0','f0']) { if(id==='f0')await section(p).click();await p.locator('#edit-folder-'+id).click();await p.locator('#favorite-edit-tags').fill(id==='s0'?'parent':'child');await p.getByRole('button',{name:'Save',exact:true}).click();await expect(p.locator('dialog')).toHaveCount(0); }
 // Pointer-retained focus is not keyboard focus. No blur workaround.
 await section(p).click();await section(p).click();await p.mouse.move(1230,15);await expect(section(p)).toBeFocused();
 await expect(p.locator('[data-section-id="folder:s0"] .section-tag-annotation')).toHaveCSS('visibility','hidden');
 await p.keyboard.press('Tab');await expect(p.locator('#edit-folder-s0')).toBeFocused();await expect(p.locator('[data-section-id="folder:s0"] .section-tag-annotation')).toHaveCSS('visibility','visible');
 await p.locator('#folder-f0').click();await p.locator('#folder-f0').click();await p.mouse.move(1230,15);await expect(p.locator('[data-item-id="f0"] .item-annotation')).toHaveCSS('visibility','hidden');await p.keyboard.press('Tab');await expect(p.locator('[data-item-id="f0"] .item-annotation')).toHaveCSS('visibility','visible');
 await expect(section(p)).toHaveAttribute('aria-expanded','true');await expect(section(p).locator('.section-state')).toHaveText('▾');
 await section(p,'s1').hover();await expect(section(p,'s1').locator('.section-state')).toHaveText('▸');await p.mouse.move(1245,840);
 const original=await p.locator('[id="card-folder:s1"]').evaluate(n=>n.getBoundingClientRect().top+scrollY);
 await p.mouse.wheel(0,450);await p.waitForTimeout(220);
 const geometry=await p.evaluate(()=>{const c=document.querySelector('.catalogue-chrome').getBoundingClientRect(),h=document.querySelector('.is-open .section-header h2').getBoundingClientRect();return {nav:c.bottom,heading:h.height,top:h.top,scroll:scrollY};});
 assert(geometry.nav+geometry.heading<=112&&geometry.top>=geometry.nav-1,JSON.stringify(geometry));
 assert(Math.abs(await p.locator('[id="card-folder:s1"]').evaluate(n=>n.getBoundingClientRect().top+scrollY)-original)<1,'compact chrome cannot move section document positions');
 await expect(p.getByRole('button',{name:'Done',exact:true})).toBeInViewport();await p.screenshot({path:join(fixture.output,`${theme}-compact-edit.png`)});
 // Original search restoration snapshot survives explicit root navigation.
 const saved=await p.evaluate(()=>scrollY);await p.getByRole('button',{name:'Search /',exact:true}).click();const input=p.getByRole('textbox',{name:'Search bookmarks',exact:true});await input.fill('ordinary');await input.evaluate(n=>n.setSelectionRange(2,5));await p.keyboard.press('Alt+3');await expect(input).toBeFocused();assert.deepEqual(await input.evaluate(n=>[n.selectionStart,n.selectionEnd]),[2,5]);assert.equal(await p.evaluate(()=>scrollY),0);await expect(input).toHaveValue('ordinary');
 await p.keyboard.press('Escape');await expect(section(p)).toHaveAttribute('aria-expanded','true');assert(Math.abs(await p.evaluate(()=>scrollY)-saved)<1,'Escape restores original scroll');
 await p.getByRole('button',{name:'Favorites bar',exact:true}).click();await expect.poll(()=>p.evaluate(()=>scrollY)).toBe(0);await section(p).click();await p.mouse.move(1240,800);await p.mouse.wheel(0,360);await p.waitForTimeout(150);await p.keyboard.press('Alt+1');await expect.poll(()=>p.evaluate(()=>scrollY)).toBe(0);
 // Search labels have no expansion icon. Check actual rendered text fragments,
 // not a width constant, at narrow width and scale with missing provenance.
 await p.getByRole('button',{name:'Favorites bar',exact:true}).click();await p.getByRole('button',{name:'Search /',exact:true}).click();await input.fill('nested');
 await p.evaluate(()=>window.external('s0',{title:'Long section name wrapping across the available narrow search heading'}));await p.waitForTimeout(250);
 for(const [width,zoom] of [[1250,1],[390,1],[390,1.25]]) {await p.setViewportSize({width,height:850});await p.evaluate(z=>document.documentElement.style.zoom=String(z),zoom);await p.waitForTimeout(130);
 await expect(p.locator('.section-stack .section-state')).toHaveCount(0);
 const overlap=await p.locator('.section-header h2.has-folder-editor').evaluateAll(headings=>headings.some(h=>{const edit=h.querySelector('.item-edit-action').getBoundingClientRect(),range=document.createRange();range.selectNodeContents(h.querySelector('.section-heading-text'));return [...range.getClientRects()].some(r=>Math.min(r.right,edit.right)-Math.max(r.left,edit.left)>.5&&Math.min(r.bottom,edit.bottom)-Math.max(r.top,edit.top)>.5)}));assert.equal(overlap,false,'section Edit overlaps search text');assert(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
 }
 await p.screenshot({path:join(fixture.output,`${theme}-narrow-search.png`)});await p.evaluate(()=>document.documentElement.style.zoom='1');await p.setViewportSize({width:1250,height:850});await p.keyboard.press('Escape');
 // Compact navigation stays reachable outside Edit mode, too.
 await p.getByRole('button',{name:'Done',exact:true}).click();await section(p).click();await p.mouse.move(1240,800);await p.mouse.wheel(0,400);await p.waitForTimeout(200);await expect(p.getByRole('button',{name:'Edit',exact:true})).toBeInViewport();
 const normal=await p.evaluate(()=>document.querySelector('.catalogue-chrome').getBoundingClientRect().bottom+document.querySelector('.is-open .section-header h2').getBoundingClientRect().height);assert(normal>=85&&normal<=101,normal);await p.screenshot({path:join(fixture.output,`${theme}-compact-browse.png`)});
 // Real wheel cycles through the compaction boundary with a stationary pointer.
 const samples=[];for(let i=0;i<3;i++){await p.mouse.wheel(0,-10000);await p.waitForTimeout(160);await p.mouse.wheel(0,45);await p.waitForTimeout(160);const start=await p.evaluate(()=>scrollY);await p.waitForTimeout(400);const end=await p.evaluate(()=>scrollY);assert.equal(start,end);samples.push(end)}
 // Sample every animation frame across native sticky attachment in both
 // directions. Document coordinates cannot jump, and each title moves only
 // with the wheel delta until its native sticky clamp is reached.
 await p.mouse.wheel(0,-10000);await p.waitForTimeout(200);
 await p.evaluate(()=>{window.stickyFrames=[];window.stickyRecording=true;const sample=()=>{if(!window.stickyRecording)return;const nav=document.querySelector('.catalogue-navigation').getBoundingClientRect(),title=document.querySelector('.is-open h2').getBoundingClientRect(),next=document.querySelector('[id="card-folder:s1"]').getBoundingClientRect();window.stickyFrames.push({y:scrollY,nav:nav.top,title:title.top,doc:next.top+scrollY});requestAnimationFrame(sample)};sample()});
 for(const delta of [15,15,15,15,15,15,15,15,-15,-15,-15,-15,-15,-15,-15,-15]){await p.mouse.wheel(0,delta);await p.waitForTimeout(45)}
 await p.waitForTimeout(180);const frames=await p.evaluate(()=>{window.stickyRecording=false;return window.stickyFrames});
 for(let i=1;i<frames.length;i++){const a=frames[i-1],b=frames[i],travel=Math.abs(b.y-a.y);assert(Math.abs(b.doc-a.doc)<1,'sticky changes document flow');assert(Math.abs(b.nav-a.nav)<=travel+1,'navigation jumps beyond wheel travel');assert(Math.abs(b.title-a.title)<=travel+1,'heading jumps beyond wheel travel')}
 assert(frames.length>30);await writeFile(join(fixture.output,`${theme}-sticky-frames.json`),JSON.stringify(frames));
 const alignment=await p.evaluate(()=>{const title=document.querySelector('.is-open .section-title-text').getBoundingClientRect(),nav=document.querySelector('.catalogue-navigation nav').getBoundingClientRect(),icon=document.querySelector('.is-open .section-state').getBoundingClientRect();return {title:title.left,nav:nav.left,icon:icon.right}});assert(Math.abs(alignment.title-alignment.nav)<1);assert(alignment.icon<alignment.title);
 // Wrapped open headings retain their full flow footprint when compacted,
 // including CSS zoom; sticky offsets use CSS dimensions, not scaled pixels.
 await p.setViewportSize({width:390,height:850});await p.evaluate(()=>document.documentElement.style.zoom='1.25');await p.mouse.move(389,849);await p.mouse.wheel(0,-10000);await p.waitForTimeout(180);
 const narrowStart=await p.locator('[id="card-folder:s1"]').evaluate(n=>n.getBoundingClientRect().top+scrollY);await p.mouse.wheel(0,450);await p.waitForTimeout(250);
 assert(Math.abs(await p.locator('[id="card-folder:s1"]').evaluate(n=>n.getBoundingClientRect().top+scrollY)-narrowStart)<1,'wrapped compact header must not move following sections');
 const clearance=await p.evaluate(()=>{const chrome=document.querySelector('.catalogue-chrome').getBoundingClientRect(),h=document.querySelector('.is-open .section-header h2').getBoundingClientRect();return h.top-chrome.bottom});assert(Math.abs(clearance)<1,'zoomed sticky offset must align with actual chrome');
 await section(p).hover();await p.waitForTimeout(100);const gap=await p.locator('[id="card-folder:s0"] h2').evaluate(h=>{const r=document.createRange();r.selectNodeContents(h.querySelector('.section-title-text').firstChild);return h.querySelector('.section-tag-annotation').getBoundingClientRect().top-r.getClientRects()[0].bottom});assert(gap>=1&&gap<=3,'compaction must update tag anchor');
 const collision=await p.locator('[id="card-folder:s0"] h2').evaluate(h=>{const r=document.createRange();r.selectNodeContents(h.querySelector('.section-title-text').firstChild);const tag=h.querySelector('.section-tag-annotation').getBoundingClientRect();return [...r.getClientRects()].slice(1).some(line=>Math.min(tag.bottom,line.bottom)>Math.max(tag.top,line.top)&&Math.min(tag.right,line.right)>Math.max(tag.left,line.left))});assert.equal(collision,false,'tags must not overlap a wrapped heading text line');
 await p.screenshot({path:join(fixture.output,`${theme}-compact-narrow.png`)});await p.emulateMedia({forcedColors:'active'});await expect(p.getByRole('button',{name:'Edit',exact:true})).toBeInViewport();await p.screenshot({path:join(fixture.output,`${theme}-forced-colors.png`)});
 assert(await section(p).locator('.section-state').evaluate(n=>getComputedStyle(n).visibility==='visible'));
 assert.deepEqual(errors,[]);report.push({theme,geometry,normalCombinedHeight:normal,boundarySamples:samples,result:'passed scope removal, pointer/keyboard tags, indicators, search Edit geometry, root scroll/query/selection/Escape, compact navigation'});await context.close();
 } await writeFile(join(fixture.output,'navigation-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({output:fixture.output,report},null,2));
} finally {await browser.close();await new Promise(r=>fixture.server.close(r));}
