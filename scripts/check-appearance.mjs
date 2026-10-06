/* global window, document, getComputedStyle, localStorage, requestAnimationFrame, performance */
// Render the real App against synthetic Favorites and a shared local-storage API
// bridge. No native Edge/system-theme acceptance is implied by these checks.
import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import { mkdtemp, readFile, writeFile, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import assert from 'node:assert/strict';
const output = await mkdtemp(join(tmpdir(),'bb-appearance-'));
await build({stdin:{contents:`
import {flattenTree} from './src/core/logic';
const names=['Design','Reference','Career','Crypto','Personal','Development'];
const sections=names.map((title,i)=>({id:'s'+i,parentId:i<3?'r1':'r2',title,children:[{id:'f'+i,parentId:'s'+i,title:'Nested references',children:[{id:'n'+i,parentId:'f'+i,title:'Nested illustration',url:'https://example.test/1'}]},...Array.from({length:24},(_,j)=>({id:i+'-'+j,parentId:'s'+i,title:['Transparent dark logo','White-backed icon','Color illustration','Missing icon','disaster_recovery/revised_template.pdf'][j%5],url:(j===0?'http':'https')+'://example.test/'+j}))]}));
const tree=[{id:'0',title:'',children:[{id:'r1',parentId:'0',title:'Favorites bar',children:sections.slice(0,3)},{id:'r2',parentId:'0',title:'Workspaces',children:sections.slice(3)}]}];
const mappings=Object.fromEntries(sections.map((s,i)=>[i+'-0',{stableId:'tag'+i}]));
window.fixture={tree,...flattenTree(tree),schemaVersion:1,extensionId:'fixture',version:'0.1.19',errors:[],logs:[],metadata:{records:sections.map((s,i)=>({stableId:'tag'+i,tags:['reference','design']})),raw:{},tombstones:{},invalid:[],histories:{}},reconciliation:{mappings,matches:[]},local:{rootId:'*',mappings,pendingDeletions:[]},metadataHealth:{},preservation:{available:true,stableIds:[]},syncBytes:0,quotas:{bytes:102400,items:512},lastReconciliation:'fixture'};
import './src/main';`,loader:'tsx',resolveDir:process.cwd()},bundle:true,jsx:'automatic',target:'es2022',outfile:join(output,'fixture.js'),loader:{'.svg':'dataurl'}});
await copyFile('public/theme-init.js',join(output,'theme-init.js'));
await writeFile(join(output,'index.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><script src="theme-init.js"></script><link rel="stylesheet" href="fixture.css"></head><body><div id="root"></div><script src="fixture.js"></script></body></html>');
const server=createServer(async(req,res)=>{
  if(req.url.startsWith('/_favicon/')) {
    const pageUrl=new URL(req.url,'http://fixture').searchParams.get('pageUrl'), i=Number(new URL(pageUrl).pathname.slice(1))%5;
    if(i===3){res.writeHead(404);res.end();return;}
    const artwork=i===0?'<path d="M5 27V5h6l7 12 7-12h3v22h-6V17l-4 7-7-12v15Z" fill="#111"/>':i===1?'<rect width="32" height="32" fill="white"/><circle cx="16" cy="16" r="12" fill="#185c9b"/>':'<circle cx="16" cy="16" r="15" fill="#e69127"/><path d="M7 23 16 5 25 23Z" fill="#157f4c"/>';
    res.writeHead(200,{'content-type':'image/svg+xml'});res.end('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">'+artwork+'</svg>');return;
  }
  const name=req.url.split('?')[0].slice(1)||'index.html';
  try { const data=await readFile(join(output,name));res.writeHead(200,{'content-type':name.endsWith('css')?'text/css':name.endsWith('js')?'text/javascript':'text/html'});res.end(data); }
  catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch(); const report={configurations:[],state:[],contrast:[]};
async function environment(system='light',stored,cache=stored) {
  const context=await browser.newContext({viewport:{width:1250,height:800},colorScheme:system});
  const values={'ui:auto-scroll-peek':true,...(stored?{'ui:appearance':stored}:{})};
  await context.exposeBinding('localBridge',async(source,op,key,value)=>{
    if(op==='get')return {[key]:values[key]};
    const oldValue=values[key];values[key]=value;
    await Promise.all(context.pages().map(p=>p.evaluate(change=>window.localChanged?.(change),{[key]:{oldValue,newValue:value}})));
    return {ok:true};
  });
  await context.addInitScript(({url,cache})=>{
    // Seed only once: reload must consume the cache written by the actual adapter.
    if(cache && !localStorage.getItem('seeded')){localStorage.setItem('ui:appearance-cache',cache);localStorage.setItem('seeded','yes');}
    const listeners=new Set();window.localChanged=change=>{for(const f of listeners)f(change,'local');};
    window.chrome={runtime:{id:'fixture',getURL:path=>url+path.replace(/^\//,''),onMessage:{addListener(){},removeListener(){}},sendMessage:async m=>{
      if(m.command){if(m.command.type!=='snapshot')throw Error('Unexpected bookmark mutation');return {ok:true,snapshot:window.fixture};}
      if(m.event==='set-appearance' && window.failAppearance)return {ok:false,error:'Synthetic local preference write failure'};
      if(m.event==='set-appearance')return window.localBridge('set','ui:appearance',m.appearance);
      if(m.event==='set-peek-preference')return window.localBridge('set','ui:auto-scroll-peek',m.enabled);
      return {ok:true};
    }},storage:{local:{get:key=>window.localBridge('get',key)},onChanged:{addListener:f=>listeners.add(f),removeListener:f=>listeners.delete(f)}},commands:{getAll:async()=>[{name:'open-dashboard-search',shortcut:'Ctrl+Shift+B'}]},tabs:{getCurrent:async()=>({id:1}),create:async()=>({})}};
    window.startup=[];const sample=()=>{window.startup.push({time:performance.now(),background:getComputedStyle(document.documentElement).backgroundColor,scheme:getComputedStyle(document.documentElement).colorScheme}); if(window.startup.length<90)requestAnimationFrame(sample);};requestAnimationFrame(sample);
  },{url,cache});
  const page=await context.newPage();await page.goto(url);await page.getByRole('button',{name:'Manage',exact:true}).waitFor();
  return {context,page};
}
const surface=p=>p.evaluate(()=>getComputedStyle(document.documentElement).backgroundColor);
const change=(p,value)=>p.evaluate(value=>window.chrome.runtime.sendMessage({event:'set-appearance',appearance:value}),value);
const section=(p,i)=>p.locator(`[id="section-folder:s${i}"]`);
async function contrast(p,theme,selectors){
  const samples=await p.evaluate(selectors=>selectors.flatMap(selector=>[...document.querySelectorAll(selector)].slice(0,4).map(n=>{
    let parent=n,bg='rgba(0, 0, 0, 0)';while(parent && bg==='rgba(0, 0, 0, 0)'){bg=getComputedStyle(parent).backgroundColor;parent=parent.parentElement;}
    return {selector,foreground:getComputedStyle(n).color,background:bg};
  })),selectors);
  const luminance=color=>{const parts=color.match(/[\d.]+/g).slice(0,3).map(n=>Number(n)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return parts[0]*.2126+parts[1]*.7152+parts[2]*.0722;};
  for(const sample of samples){const a=luminance(sample.foreground),b=luminance(sample.background);const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert(ratio>=4.5,`${theme} ${sample.selector} contrast ${ratio}`);report.contrast.push({theme,...sample,ratio:Number(ratio.toFixed(2))});}
}
try {
  for(const [system,stored,expected] of [['light',undefined,'rgb(255, 255, 255)'],['dark',undefined,'rgb(40, 40, 40)'],['light','dark','rgb(40, 40, 40)'],['dark','light','rgb(255, 255, 255)']]) {
    const {context,page}=await environment(system,stored);
    assert.equal(await surface(page),expected);
    const startup=await page.evaluate(()=>window.startup);
    assert(startup.every(s=>s.background===expected || s.background==='rgba(0, 0, 0, 0)'), 'wrong authored startup palette');
    await page.emulateMedia({colorScheme:system==='light'?'dark':'light'});
    assert.equal(await surface(page),stored?expected:expected.includes('255')?'rgb(40, 40, 40)':'rgb(255, 255, 255)');
    report.configurations.push({system,stored:stored??'system',initial:expected,startupFrames:startup.length,liveSystem:true});await context.close();
  }
  const {context,page}=await environment();const other=await context.newPage();await other.goto(url);await other.getByRole('button',{name:'Manage',exact:true}).waitFor();
  await other.getByRole('button',{name:'Manage',exact:true}).click();const appearance=other.getByLabel('Appearance',{exact:true});
  for(const theme of ['light','dark']) {
    await appearance.selectOption(theme);assert.equal(await surface(page),theme==='light'?'rgb(255, 255, 255)':'rgb(40, 40, 40)');
    await page.bringToFront(); await page.waitForTimeout(100);
    await page.mouse.move(1200,15);const closed=await page.screenshot({path:join(output,`${theme}-closed.png`)});
    if(theme==='light'){
      // 0.1.19 intentionally adds state chevrons and compact chrome. Compare
      // explicit Light with System/light at the same current layout instead of
      // asserting the superseded 0.1.14 markup is pixel-identical.
      await change(page,'system');await page.waitForTimeout(100);
      const systemLight=await page.screenshot({path:join(output,'system-light-closed.png')});
      assert(closed.equals(systemLight),'explicit Light and System/light must render identically');report.lightPixelComparison=true;
      await change(page,'light');
    }
    await section(page,0).hover();await page.waitForTimeout(250);await contrast(page,theme,['.root-provenance','.peek-summary-name','.peek-summary-prefix','.peek-summary-provenance','.catalogue-footer a']);await page.screenshot({path:join(output,`${theme}-peek.png`)});
    await section(page,0).click();await page.waitForTimeout(250);
    await page.getByRole('button',{name:'Nested references/ 1'}).click();
    await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
    await page.locator('[id="bookmark-0-0"]').focus();
    assert.equal(await page.locator('[id="bookmark-0-0"]').evaluate(n=>getComputedStyle(n).outlineStyle),'solid');await page.waitForTimeout(250);await page.screenshot({path:join(output,`${theme}-open.png`)});
    await contrast(page,theme,['.bookmark-title','.item-annotation']);
    const icon=page.locator('[id="bookmark-0-2"] img');
    assert.equal(await icon.evaluate(n=>getComputedStyle(n).filter),'grayscale(1)');
    await page.locator('[id="bookmark-0-2"]').hover();assert.equal(await icon.evaluate(n=>getComputedStyle(n).filter),'grayscale(0)');
    assert.equal(await page.locator('html').evaluate(n=>getComputedStyle(n).filter),'none');
    await page.screenshot({path:join(output,`${theme}-icons.png`)});
    const annotation=page.locator('.item-annotation').first();
    assert.equal(await annotation.evaluate(n=>getComputedStyle(n).visibility),'visible');
    await page.keyboard.press('/');await page.getByRole('textbox',{name:'Search bookmarks'}).fill('#reference');await page.waitForTimeout(250);await page.screenshot({path:join(output,`${theme}-search.png`)});
    await page.getByRole('textbox',{name:'Search bookmarks'}).fill('no-such-favorite');await page.waitForTimeout(250);
    await page.screenshot({path:join(output,`${theme}-empty.png`)});
    assert.equal(await page.locator('.section-slot').count(),0);
    await page.keyboard.press('Escape');
    await section(page,0).click();
    // Manage draft survives a live change originating in another dashboard.
    await other.getByRole('button',{name:'Add link',exact:true}).click();await other.getByLabel('Title',{exact:true}).fill('Unsaved draft');
    await other.bringToFront();await other.waitForTimeout(100);await other.screenshot({path:join(output,`${theme}-manage.png`)});
    await contrast(other,theme,['.appearance-setting small','.legacy small','.legacy .url','.legacy a','.legacy input']);
    await change(page,theme==='dark'?'light':'dark');assert.equal(await other.getByLabel('Title',{exact:true}).inputValue(),'Unsaved draft');
    await change(page,theme);
    await other.evaluate(()=>{window.failAppearance=true;});await appearance.selectOption(theme==='light'?'dark':'light');
    await other.getByRole('alert').waitFor();await contrast(other,theme,['.status-error']);
    assert.equal(await appearance.inputValue(),theme);assert.equal(await other.getByLabel('Title',{exact:true}).inputValue(),'Unsaved draft');
    await other.screenshot({path:join(output,`${theme}-error.png`)});
    await other.evaluate(()=>{window.failAppearance=false;});await appearance.selectOption(theme);
    await other.getByRole('button',{name:'Cancel',exact:true}).click();
  }
  // Search scope, caret, focus and original Escape snapshot survive external updates.
  await page.getByRole('button',{name:'Favorites bar',exact:true}).click();await section(page,0).click();
  await page.getByRole('button',{name:'Nested references/ 1'}).click();await page.keyboard.press('/');
  const query=page.getByRole('textbox',{name:'Search bookmarks'});await query.fill('reference');await query.evaluate(n=>n.setSelectionRange(2,6));
  await appearance.selectOption('light');
  assert.deepEqual(await query.evaluate(n=>[n.value,n.selectionStart,n.selectionEnd,document.activeElement===n]),['reference',2,6,true]);
  await page.keyboard.press('Escape');assert.equal(await section(page,0).getAttribute('aria-expanded'),'true');assert.equal(await page.getByRole('button',{name:'Favorites bar',exact:true}).getAttribute('aria-current'),'page');
  assert.equal(await page.locator('.folder-children').count(),1);
  await page.bringToFront();await page.mouse.wheel(0,240);await page.waitForTimeout(100);const scroll=await page.evaluate(()=>window.scrollY);
  await change(other,'dark');assert.equal(await page.evaluate(()=>window.scrollY),scroll,'theme change must not move document scroll');
  await section(page,0).click();await page.getByRole('button',{name:'All bookmarks',exact:true}).click();
  await section(page,0).hover();await page.waitForTimeout(1400);
  const flow=page.locator('[id="card-folder:s0"] .catalogue-flow');const before=await flow.evaluate(n=>n.style.transform);
  await change(other,'dark');await page.waitForTimeout(100);
  assert.equal(await page.locator('.is-peeking').count(),1);assert.notEqual(await flow.evaluate(n=>n.style.transform),before);
  await page.mouse.move(1200,10);await page.waitForTimeout(150);
  // Persisted override and synchronous cache agree on a fresh document.
  await page.reload();await page.getByRole('button',{name:'Manage',exact:true}).waitFor();assert.equal(await surface(page),'rgb(40, 40, 40)');
  await page.setViewportSize({width:390,height:700});await section(page,0).click();await page.waitForTimeout(250);await page.screenshot({path:join(output,'dark-narrow.png')});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  await page.emulateMedia({reducedMotion:'reduce'});await section(page,0).click();await page.mouse.move(380,10);await section(page,0).hover();await page.waitForTimeout(1200);assert.equal(await flow.evaluate(n=>n.style.transform),'');
  await page.emulateMedia({forcedColors:'active'});await page.screenshot({path:join(output,'forced-colors.png')});
  assert.equal(await page.locator('.section-sheet').first().evaluate(n=>getComputedStyle(n).forcedColorAdjust),'auto');
  await other.setViewportSize({width:390,height:700});await other.bringToFront();await other.screenshot({path:join(output,'dark-manage-narrow.png')});
  const overflow=await other.evaluate(()=>({width:window.innerWidth,scroll:document.documentElement.scrollWidth,nodes:[...document.querySelectorAll('body *')].filter(n=>n.getBoundingClientRect().right>window.innerWidth).map(n=>({tag:n.tagName,cls:n.className,right:n.getBoundingClientRect().right})).slice(0,12)}));
  assert(overflow.scroll<=overflow.width,JSON.stringify(overflow));
  report.state=['scroll preservation','save failure retains theme/draft','favicon colors','cross-tab preference','unsaved Manage draft','query selection/focus','root/folder/Escape restoration','active peek progress','reload persistence','narrow overflow','reduced motion','forced colors'];
  await context.close();
  await writeFile(join(output,'results.json'),JSON.stringify(report,null,2));console.log(`PASS appearance checks. Evidence: ${output}`);
} finally {await browser.close();server.close();}
