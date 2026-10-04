/* global window, document */
// Real App + real DashboardService/metadata repository over synthetic browser
// ports. This exercises existing safeguards, not a second save implementation.
import { chromium, expect } from '@playwright/test';
import { build } from 'esbuild';
import { mkdtemp, readFile, writeFile, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import assert from 'node:assert/strict';
const output = await mkdtemp(join(tmpdir(), 'bb-editing-'));
await build({ stdin: { contents: `
import { DashboardService } from './src/core/service';
import { BrowserMetadataRepository } from './src/browser/metadata';
class Storage {
 data={}; async get(key) {return structuredClone(typeof key==='string'?{[key]:this.data[key]}:this.data)}
 async set(value){Object.assign(this.data,structuredClone(value))} async getBytesInUse(){return JSON.stringify(this.data).length}
}
const sections=Array.from({length:12},(_,i)=>({id:'s'+i,parentId:i<6?'r1':'r2',title:['Design','Reference','Career','Crypto','Personal','Development'][i%6]+' '+i,children:[{id:'f'+i,parentId:'s'+i,title:'Nested folder',children:[{id:'n'+i,parentId:'f'+i,title:'Nested favorite',url:'https://example.test/nested'}]},...Array.from({length:20},(_,j)=>({id:i+'-'+j,parentId:'s'+i,title:j===0?'Unique target '+i:'Ordinary favorite '+j,url:'https://example.test/'+i+'/'+j}))]}));
const tree=[{id:'0',title:'',children:[{id:'r1',parentId:'0',title:'Favorites bar',children:sections.slice(0,6)},{id:'r2',parentId:'0',title:'Workspaces',children:sections.slice(6)}]}];
const nodes=()=>{const walk=items=>items.flatMap(n=>[n,...walk(n.children??[])]);return walk(tree)};
const bookmarks={getTree:async()=>structuredClone(tree),update:async(id,value)=>{if(window.failSave)throw Error('Synthetic browser write failure');Object.assign(nodes().find(n=>n.id===id),value)},move:async()=>{throw Error('Unexpected move')},create:async()=>{throw Error('Unexpected create')},removeLink:async()=>{throw Error('Unexpected deletion')}};
const local=new Storage();local.data.state={schemaVersion:1,rootId:'*',mappings:{},pendingDeletions:[]};const sync=new Storage();
const service=new DashboardService(bookmarks,new BrowserMetadataRepository(sync,local),{extensionId:'fixture',version:'0.1.16'});
const listeners=new Set(),storageListeners=new Set();let queue=Promise.resolve();
window.commands=[];window.peekWrites=[];
window.external=async(id,change)=>{const n=nodes().find(n=>n.id===id);if(change==='delete'){const p=nodes().find(p=>p.id===n.parentId);p.children=p.children.filter(x=>x.id!==id)}else if(change.parentId){const p=nodes().find(p=>p.id===n.parentId);p.children=p.children.filter(x=>x.id!==id);Object.assign(n,change);nodes().find(p=>p.id===n.parentId).children.push(n)}else Object.assign(n,change);listeners.forEach(f=>f({event:'dashboard-changed'},{id:'fixture'},()=>{}))};
window.local=local;window.sync=sync;window.service=service;
window.requestSearch=()=>{let result;listeners.forEach(f=>f({event:'dashboard-search',tabId:1,id:crypto.randomUUID(),allBookmarks:true},{id:'fixture'},r=>{result=r}));return result};
window.refresh=()=>listeners.forEach(f=>f({event:'dashboard-changed'},{id:'fixture'},()=>{}));
window.chrome={runtime:{id:'fixture',getURL:path=>location.origin+'/'+path.replace(/^\\//,''),onMessage:{addListener:f=>listeners.add(f),removeListener:f=>listeners.delete(f)},sendMessage:async message=>{
 if(message.command){window.commands.push(message.command);const result=queue.then(async()=>{if(message.command.type==='edit'&&window.holdSave)await new Promise(r=>window.releaseSave=r);return service.command(message.command)});queue=result.catch(()=>{});try{return {ok:true,snapshot:await result}}catch(e){return {ok:false,error:String(e)}}}
 if(message.event==='set-appearance'){const oldValue=local.data['ui:appearance'];local.data['ui:appearance']=message.appearance;storageListeners.forEach(f=>f({'ui:appearance':{oldValue,newValue:message.appearance}},'local'))}
 return {ok:true};
}},storage:{local,onChanged:{addListener:f=>storageListeners.add(f),removeListener:f=>storageListeners.delete(f)}},commands:{getAll:async()=>[{name:'open-dashboard-search',shortcut:'Ctrl+Shift+B'}]},tabs:{getCurrent:async()=>({id:1})}};
void import('./src/main');`, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, define: {'import.meta.env.DEV':'false'}, jsx: 'automatic', target: 'es2022', outfile: join(output,'fixture.js'), loader: {'.svg':'dataurl'} });
await copyFile('public/theme-init.js',join(output,'theme-init.js'));
await writeFile(join(output,'index.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="theme-init.js"></script><link rel="stylesheet" href="fixture.css"></head><body><div id="root"></div><script src="fixture.js"></script></body></html>');
const server=createServer(async(req,res)=>{try{const path=req.url.split('?')[0].slice(1)||'index.html';const data=await readFile(join(output,path));res.writeHead(200,{'content-type':path.endsWith('js')?'text/javascript':path.endsWith('css')?'text/css':'text/html'});res.end(data)}catch{res.writeHead(404);res.end()}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch();const report=[];
const url=`http://127.0.0.1:${server.address().port}/`;
const section=(page,i)=>page.locator(`[id="section-folder:s${i}"]`);
const bookmark=(page,id)=>page.locator(`[id="bookmark-${id}"]`);
const title=page=>page.getByLabel('Title',{exact:true});
const save=page=>page.getByRole('button',{name:'Save',exact:true});
const cancel=page=>page.getByRole('button',{name:'Cancel',exact:true});
const dialog=page=>page.getByRole('dialog',{name:'Edit Favorite'});
async function closeDirty(page){await cancel(page).click();await page.getByRole('button',{name:'Discard changes',exact:true}).click();await expect(dialog(page)).toHaveCount(0)}
async function open(page,id='0-0'){await bookmark(page,id).click();await expect(title(page)).toBeFocused()}
try {
 for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width:1250,height:800},colorScheme:theme});const page=await context.newPage();
  const uncaught=[];page.on('pageerror',e=>uncaught.push(e.message));await page.goto(url);
  await section(page,0).click();await expect(bookmark(page,'0-0')).toHaveAttribute('href','https://example.test/0/0');
  await page.getByRole('button',{name:'Edit',exact:true}).click();await expect(bookmark(page,'0-0')).not.toHaveAttribute('href');
  // Ctrl/middle activation cannot open a destination. A single semantic target
  // preserves natural inline text layout (no button-shaped inline block).
  const beforeModal=await page.evaluate(()=>({y:window.scrollY,width:document.querySelector('.catalogue-flow').getBoundingClientRect().width,height:Math.round(document.querySelector('.catalogue-flow').getBoundingClientRect().height*100)/100}));
  await bookmark(page,'0-0').click({modifiers:['Control']});await expect(title(page)).toBeFocused();assert.equal(context.pages().length,1);
  assert.deepEqual(await page.evaluate(()=>({y:window.scrollY,width:document.querySelector('.catalogue-flow').getBoundingClientRect().width,height:Math.round(document.querySelector('.catalogue-flow').getBoundingClientRect().height*100)/100})),beforeModal);
  const geometry=await page.evaluate(()=>({y:window.scrollY,x:document.querySelector('.section-stack').getBoundingClientRect().x}));
  await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Cancel');
  await page.keyboard.press('Tab');await expect(title(page)).toBeFocused();
  const rootBefore=await page.locator('[aria-current="page"]').textContent();
  await page.keyboard.press('Alt+3');assert.equal(await page.locator('[aria-current="page"]').textContent(),rootBefore);
  assert.equal((await page.evaluate(()=>window.requestSearch())).status,'blocked');await expect(title(page)).toBeFocused();
  await page.mouse.click(4,4);await expect(dialog(page)).toBeVisible();
  await page.mouse.wheel(0,450);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.scrollY),geometry.y);
  await page.screenshot({path:join(output,`${theme}-modal.png`)});
  await page.keyboard.press('Escape');await expect(dialog(page)).toHaveCount(0);await expect(bookmark(page,'0-0')).toBeFocused();
  assert.deepEqual(await page.evaluate(()=>({y:window.scrollY,x:document.querySelector('.section-stack').getBoundingClientRect().x})),geometry);
  await bookmark(page,'0-0').click({button:'middle'});await expect(dialog(page)).toBeVisible();assert.equal(context.pages().length,1);await cancel(page).click();
  await bookmark(page,'0-0').focus();await page.keyboard.press('Space');await expect(title(page)).toBeFocused();
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
  await page.evaluate(()=>{window.holdSave=false;window.releaseSave()});await expect(dialog(page)).toHaveCount(0);await expect(bookmark(page,'0-0')).toBeFocused();await expect(bookmark(page,'0-0')).toContainText('Saved title');
  const saved=await page.evaluate(async()=>{const s=await window.service.snapshot('check');return {favorite:s.favorites.find(f=>f.id==='0-0'),tags:s.metadata.records[0].tags}});assert.equal(saved.favorite.url,'https://example.test/changed');assert.deepEqual(saved.tags,['reference','work']);assert.equal(saved.favorite.parentId,'s0');
  await expect(page.getByRole('button',{name:'Editing · Done'})).toHaveAttribute('aria-pressed','true');
  // Every bookmarklet save retains the existing explicit browser confirmation.
  await open(page,'0-5');const code='javascript:alert(1)\n// exact opaque code';await page.locator('#favorite-edit-url').fill(code);
  const prior=await page.evaluate(()=>window.commands.filter(c=>c.type==='edit').length);page.once('dialog',d=>d.dismiss());await save(page).click();await expect(dialog(page)).toBeVisible();assert.equal(await page.evaluate(()=>window.commands.filter(c=>c.type==='edit').length),prior);
  page.once('dialog',d=>d.accept());await save(page).click();await expect(dialog(page)).toHaveCount(0);assert.equal(await page.evaluate(async()=>(await window.service.snapshot('check')).favorites.find(f=>f.id==='0-5').url),code);
  // External changes/moves/deletions preserve typed draft and reject stale writes.
  for(const [id,change] of [['0-1',{title:'External title'}],['0-2',{parentId:'s1'}],['0-3','delete']]){
   await open(page,id);await title(page).fill('Recoverable draft');await page.evaluate(async({id,change})=>window.external(id,change),{id,change});
   await expect(dialog(page).getByRole('alert')).toContainText(change==='delete'?'removed':'changed');await expect(save(page)).toBeDisabled();await expect(title(page)).toHaveValue('Recoverable draft');await closeDirty(page);
  }
  // Existing worker metadata-health and mutation-scope guards remain authoritative.
  await page.evaluate(()=>{const key=Object.keys(window.sync.data).find(k=>k.startsWith('meta:'));delete window.sync.data[key];window.refresh()});await page.waitForTimeout(250);await open(page);await title(page).fill('Blocked identity update');
  await save(page).click();await expect(dialog(page).getByRole('alert')).toContainText('missing synchronized metadata');await expect(title(page)).toHaveValue('Blocked identity update');await closeDirty(page);
  assert.equal(await page.evaluate(async()=>(await window.service.snapshot('check')).favorites.find(f=>f.id==='0-0').title),'Saved title');
  await page.evaluate(async()=>{await window.service.command({type:'set-root',rootId:null});window.refresh()});await page.waitForTimeout(220);await open(page,'0-4');await expect(save(page)).toBeDisabled();await expect(dialog(page).getByRole('alert')).toContainText('mutation scope');await cancel(page).click();
  await page.evaluate(async()=>{await window.service.command({type:'set-root',rootId:'*'});window.refresh()});await page.waitForTimeout(220);
  // Search edits remove results only after save; query/scope and original Escape
  // snapshot survive, with an accessible nearby focus fallback.
  await page.getByRole('button',{name:'Favorites bar',exact:true}).click();await section(page,0).click();await page.locator('#folder-f0').click();
  await page.getByRole('button',{name:'Search /',exact:true}).click();const search=page.getByRole('textbox',{name:'Search bookmarks'});await search.fill('"no match"');await search.fill('Ordinary favorite 4');await open(page,'0-4');await page.locator('#favorite-edit-tags').fill('retained-result');await save(page).click();await expect(dialog(page)).toHaveCount(0);await expect(bookmark(page,'0-4')).toBeFocused();await expect(search).toHaveValue('Ordinary favorite 4');await search.fill('Unique target 1');
  await open(page,'1-0');await title(page).fill('Renamed search result');await save(page).click();await expect(dialog(page)).toHaveCount(0);await expect(search).toBeFocused();await expect(search).toHaveValue('Unique target 1');await expect(bookmark(page,'1-0')).toHaveCount(0);await expect(page.getByRole('status').filter({hasText:'Favorite saved'})).toHaveCount(1);
  await page.keyboard.press('Escape');await expect(page.locator('[aria-current="page"]')).toHaveText('Favorites bar');await expect(section(page,0)).toHaveAttribute('aria-expanded','true');await expect(page.locator('#folder-f0')).toHaveAttribute('aria-expanded','true');
  await section(page,1).hover();await page.waitForTimeout(1250);await expect(page.locator('.is-peeking')).toHaveCount(1);
  const beforePeekModal=await page.evaluate(()=>window.scrollY);await bookmark(page,'n0').evaluate(n=>n.focus({preventScroll:true}));await page.keyboard.press('Enter');await expect(title(page)).toBeFocused();await expect(page.locator('.is-peeking, .is-leaving')).toHaveCount(0);assert.equal(await page.evaluate(()=>window.scrollY),beforePeekModal);
  await page.setViewportSize({width:390,height:700});await expect(title(page)).toBeFocused();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);assert.equal(await dialog(page).evaluate(d=>d.scrollWidth<=d.clientWidth),true);await page.screenshot({path:join(output,`${theme}-narrow.png`)});await cancel(page).click();
  await page.getByRole('button',{name:'Editing · Done'}).click();await expect(bookmark(page,'n0')).toHaveAttribute('href');
  await page.reload();await expect(page.getByRole('button',{name:'Edit',exact:true})).toHaveAttribute('aria-pressed','false');
  assert.deepEqual(uncaught,[]);report.push({theme,checks:'activation, focus trap/restoration, modal isolation, validation, failed/duplicate/success saves, dirty protection, external conflicts, metadata/scope guards, search removal/Escape, narrow layout, transient mode'});await context.close();
 }
 await writeFile(join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({output,report},null,2));
} finally {await browser.close();await new Promise(resolve=>server.close(resolve))}
