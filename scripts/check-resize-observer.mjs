/* global window, document, getComputedStyle, MutationObserver, FontFace */
// Capture window ErrorEvents: resize-loop delivery errors need not be pageerror
// exceptions. No preventDefault, filtering or production observer replacement.
import { chromium, expect } from '@playwright/test';
import { editingFixture } from './editing-fixture.mjs';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const f=await editingFixture(), browser=await chromium.launch(), reports=[];
try {
 for(const [theme,width,reduced] of [['light',1200,false],['dark',390,false],['light',1200,true]]){
  const p=await browser.newPage({colorScheme:theme,viewport:{width,height:800},reducedMotion:reduced?'reduce':'no-preference'});
  await p.addInitScript(()=>{
   window.resizeEvidence={errors:[],phase:'startup',callbacks:0,frames:0,pending:0,writes:0};
   const evidence=window.resizeEvidence, RO=window.ResizeObserver;
   window.addEventListener('error',e=>evidence.errors.push({message:e.message,phase:evidence.phase}));
   window.ResizeObserver=class extends RO {constructor(fn){super((...args)=>{evidence.callbacks++;fn(...args);});}};
   const raf=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window),pending=new Set();
   window.requestAnimationFrame=fn=>{const id=raf(t=>{pending.delete(id);evidence.pending=pending.size;evidence.frames++;fn(t);});pending.add(id);evidence.pending=pending.size;return id;};
   window.cancelAnimationFrame=id=>{pending.delete(id);evidence.pending=pending.size;cancel(id);};
   window.captureTransition=()=>new Promise(resolve=>{
    const samples=[];let remaining=24;
    const tick=()=>raf(()=>{window.setTimeout(()=>{
     for(const section of document.querySelectorAll('.is-peeking,.is-leaving')){
      const content=section.querySelector('.section-content').getBoundingClientRect(),cover=section.querySelector('.peek-successor')?.getBoundingClientRect();
      const boundaries=[];let openBelow=false;
      for(let next=section.nextElementSibling;next;next=next.nextElementSibling){const sheet=next.querySelector('.section-sheet');if(sheet)boundaries.push(sheet.getBoundingClientRect().top+parseFloat(getComputedStyle(sheet,'::before').top));if(next.classList.contains('is-open'))openBelow=true;}
      samples.push({id:section.id,content:content.height,bottom:content.bottom,coverBottom:cover?.bottom,boundaries,openBelow,footer:document.querySelector('.catalogue-footer').getBoundingClientRect().top});
     }
     if(--remaining)tick();else resolve(samples);
    },0);});tick();
   });
   new MutationObserver(entries=>{evidence.writes+=entries.length;}).observe(document,{attributes:true,attributeFilter:['style'],subtree:true});
  });
  await p.goto(f.url);await expect(p.locator('.catalogue')).toBeVisible();
  const phase=name=>p.evaluate(n=>window.resizeEvidence.phase=n,name);
  const read=()=>p.evaluate(()=>{const {callbacks,frames,pending,writes}=window.resizeEvidence;return {callbacks,frames,pending,writes,scroll:window.scrollY,height:document.documentElement.scrollHeight};});
  async function settled(name){await phase(name);await p.waitForTimeout(400);const first=await read();await p.waitForTimeout(400);assert.deepEqual(await read(),first,`layout/observer work must settle: ${name}`);assert.equal(first.pending,0,name);assert.deepEqual(await p.evaluate(()=>window.resizeEvidence.errors),[],name);}
  async function transition(action){
   await p.evaluate(()=>{window.transitionResult=window.captureTransition();});await action();const samples=await p.evaluate(()=>window.transitionResult);
   assert(samples.length>0,'capture painted transition geometry');
   for(const sample of samples){
    assert(sample.footer>=sample.bottom-.1,`footer must remain below preview through transition: ${JSON.stringify({theme,width,reduced,sample})}`);
    if(sample.coverBottom!==undefined&&!sample.openBelow)assert(sample.boundaries.some(boundary=>Math.abs(boundary-sample.coverBottom)<.1)||sample.coverBottom>=sample.boundaries.at(-1)+20,`cover must meet an intact sheet boundary, not expose a strip: ${JSON.stringify({theme,width,reduced,sample})}`);
   }
   reports.push({theme,width,reduced,transition:samples});
  }
  const section=i=>p.locator(`[id="section-folder:s${i}"]`);
  await settled('fresh-tab');await p.reload();await settled('reload');
  await p.getByRole('button',{name:'Manage',exact:true}).click();await p.getByLabel('Auto-scroll peek previews',{exact:true}).uncheck();await p.getByRole('button',{name:'Back to dashboard'}).click();
  for(const w of [700,390,1100,width]){await phase(`resize-${w}`);await p.setViewportSize({width:w,height:800});await settled(`resize-settled-${w}`);}
  await phase('open-and-nest');await section(0).click();await p.locator('#folder-f0').click();await settled('open');
  // Real pointer activation of the reproduced same-depth cover resize.
  await phase('peek-entry');await transition(()=>section(1).hover());await settled('peek-settled');
  await expect(p.locator('[data-section-id="folder:s1"]')).toHaveClass(/is-peeking/);
  await p.screenshot({path:join(f.output,`${theme}-${reduced}-peek.png`)});
  // FontFaceSet notifications plus actual local font resolution/reflow.
  await phase('font-loading');await p.evaluate(async()=>{const face=new FontFace('ObserverFixture','local("Arial"), local("Liberation Sans")');document.fonts.add(face);await face.load();await document.fonts.ready;});await settled('fonts-ready');
  await phase('theme-during-peek');await p.evaluate(()=>window.chrome.runtime.sendMessage({event:'set-appearance',appearance:'dark'}));await settled('theme-settled');
  await phase('peek-exit');await transition(()=>p.mouse.move(width-2,2));await settled('exit-settled');
  for(let cycle=0;cycle<2;cycle++){
   await phase(`footer-${cycle}`);await p.mouse.wheel(0,100000);await p.waitForTimeout(300);await transition(()=>section(11).hover());await p.waitForTimeout(300);
   const slot=p.locator('[data-section-id="folder:s11"]');await expect(slot).toHaveClass(/is-peeking/);
   const geometry=await slot.evaluate(n=>{const content=n.querySelector('.section-content').getBoundingClientRect();return {bottom:content.bottom,depth:content.height/parseFloat(getComputedStyle(n.querySelector('.catalogue-flow')).lineHeight),footer:document.querySelector('.catalogue-footer').getBoundingClientRect().top};});assert(Math.abs(geometry.depth-2.5)<.02);assert(geometry.footer>=geometry.bottom-.1,'footer cannot clip final preview');
   await p.mouse.wheel(0,150);await p.waitForTimeout(200);await settled(`footer-held-${cycle}`);
   await p.locator('.catalogue-footer a').first().hover();await settled(`footer-exit-${cycle}`);
   await p.mouse.move(width-2,2);await p.mouse.wheel(0,-100000);await settled(`scroll-up-${cycle}`);assert.equal(await p.locator('.peek-footer-space').evaluate(n=>n.getBoundingClientRect().height),0);
  }
  await phase('search');await p.getByRole('button',{name:'Search /',exact:true}).click();await p.getByRole('textbox',{name:'Search bookmarks'}).fill('reference');await settled('search-settled');await p.keyboard.press('Escape');await settled('search-restore');
  await p.locator('#catalogue-edit').click();await p.locator('#edit-folder-s0').click();await settled('editor');await p.keyboard.press('Escape');await settled('editor-close');await p.getByRole('button',{name:'Done',exact:true}).click();
  await p.getByRole('button',{name:'Manage',exact:true}).click();await settled('manage');await p.getByLabel('Appearance',{exact:true}).selectOption('light');await p.getByLabel('Auto-scroll peek previews',{exact:true}).check();await p.getByRole('button',{name:'Back to dashboard'}).click();
  await phase('active-auto-scroll');await section(1).hover();await p.waitForTimeout(1600);
  const before=await p.evaluate(()=>window.resizeEvidence.callbacks);await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>window.resizeEvidence.callbacks),before,'transform scrolling must not sustain measurement feedback');
  await p.mouse.move(width-2,2);await settled('auto-scroll-cancelled');
  const result=await p.evaluate(()=>window.resizeEvidence);assert.deepEqual(result.errors,[],`${theme} window errors`);reports.push({theme,width,reduced,...result});await p.close();
 }
 await writeFile(join(f.output,'resize-observer-report.json'),JSON.stringify(reports,null,2));console.log(`PASS ResizeObserver workflows, window errors and settled geometry: ${f.output}`);
} finally {await browser.close();f.server.close();}
