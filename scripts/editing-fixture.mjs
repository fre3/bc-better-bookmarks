import { build } from 'esbuild';
import { mkdtemp, readFile, writeFile, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';

export async function editingFixture({ deep = false } = {}) {
const output = await mkdtemp(join(tmpdir(), 'bb-editing-'));
await build({ stdin: { contents: `
import {prepareMetadataReset,resetMetadata} from './src/browser/metadata-setup';
import { DashboardService } from './src/core/service';
import { BrowserMetadataRepository } from './src/browser/metadata';
class Storage {
 data={}; async get(key) {return structuredClone(typeof key==='string'?{[key]:this.data[key]}:this.data)}
 async set(value){if(this===sync&&window.failTagWrite&&Object.keys(value).some(k=>k.startsWith('meta:')))throw Error('Synthetic tag persistence failure');Object.assign(this.data,structuredClone(value))} async remove(keys){for(const key of typeof keys==='string'?[keys]:keys)delete this.data[key]} async getBytesInUse(){return JSON.stringify(this.data).length}
}
const sections=Array.from({length:12},(_,i)=>({id:'s'+i,parentId:i<6?'r1':'r2',title:['Design','Reference','Career','Crypto','Personal','Development'][i%6]+' '+i,children:[{id:'f'+i,parentId:'s'+i,title:'Nested folder',children:[{id:'n'+i,parentId:'f'+i,title:'Nested favorite',url:'https://example.test/nested'}]},...Array.from({length:20},(_,j)=>({id:i+'-'+j,parentId:'s'+i,title:j===0?'Unique target '+i:'Ordinary favorite '+j,url:'https://example.test/'+i+'/'+j}))]}));
if (${deep}) sections[0].children[0].children.push({id:'deep',parentId:'f0',title:'A long nested folder title for wrapping across available lines',children:[{id:'deep-link',parentId:'deep',title:'Deep favorite',url:'https://example.test/deep'}]});
const tree=[{id:'0',title:'',children:[{id:'r1',parentId:'0',title:'Favorites bar',children:sections.slice(0,6)},{id:'r2',parentId:'0',title:'Workspaces',children:sections.slice(6)}]}];
const nodes=()=>{const walk=items=>items.flatMap(n=>[n,...walk(n.children??[])]);return walk(tree)};
const bookmarks={getTree:async()=>structuredClone(tree),update:async(id,value)=>{if(window.failSave)throw Error('Synthetic browser write failure');Object.assign(nodes().find(n=>n.id===id),value)},move:async()=>{throw Error('Unexpected move')},create:async()=>{throw Error('Unexpected create')},removeLink:async()=>{throw Error('Unexpected deletion')}};
const local=new Storage();local.data.state={schemaVersion:1,rootId:'*',mappings:{},pendingDeletions:[]};const sync=new Storage();
const service=new DashboardService(bookmarks,new BrowserMetadataRepository(sync,local),{extensionId:'fixture',version:'0.1.19'});
const listeners=new Set(),storageListeners=new Set();let queue=Promise.resolve();
local.data['ui:show-archived']=localStorage.getItem('ui:show-archived')==='true';
window.addEventListener('storage',e=>{if(e.key==='ui:show-archived'){local.data[e.key]=e.newValue==='true';storageListeners.forEach(f=>f({[e.key]:{newValue:e.newValue==='true'}},'local'))}});
window.commands=[];window.peekWrites=[];
window.external=async(id,change)=>{const n=nodes().find(n=>n.id===id);if(change==='delete'){const p=nodes().find(p=>p.id===n.parentId);p.children=p.children.filter(x=>x.id!==id)}else if(change.parentId){const p=nodes().find(p=>p.id===n.parentId);p.children=p.children.filter(x=>x.id!==id);Object.assign(n,change);nodes().find(p=>p.id===n.parentId).children.push(n)}else Object.assign(n,change);listeners.forEach(f=>f({event:'dashboard-changed'},{id:'fixture'},()=>{}))};
window.local=local;window.sync=sync;window.service=service;
window.requestSearch=()=>{let result;listeners.forEach(f=>f({event:'dashboard-search',tabId:1,id:crypto.randomUUID(),allBookmarks:true},{id:'fixture'},r=>{result=r}));return result};
window.refresh=()=>listeners.forEach(f=>f({event:'dashboard-changed'},{id:'fixture'},()=>{}));
window.chrome={runtime:{id:'fixture',getURL:path=>location.origin+'/'+path.replace(/^\\//,''),onMessage:{addListener:f=>listeners.add(f),removeListener:f=>listeners.delete(f)},sendMessage:async message=>{
 if(message.command){window.commands.push(message.command);const result=queue.then(async()=>{if(message.command.type==='edit'&&window.holdSave)await new Promise(r=>window.releaseSave=r);return service.command(message.command)});queue=result.catch(()=>{});try{return {ok:true,snapshot:await result}}catch(e){return {ok:false,error:String(e),progress:e.progress}}}
 if(message.event==='prepare-metadata-reset')return {ok:true,backup:await prepareMetadataReset(sync,local)};
 if(message.event==='reset-metadata'){try{await resetMetadata(sync,local,message.expected);window.refresh();return {ok:true}}catch(e){return {ok:false,error:String(e)}}}
 if(message.event==='set-archive-preference'){const key='ui:show-archived',oldValue=local.data[key];local.data[key]=message.enabled;localStorage.setItem(key,JSON.stringify(message.enabled));storageListeners.forEach(f=>f({[key]:{oldValue,newValue:message.enabled}},'local'))}
 if(message.event==='set-appearance'){const oldValue=local.data['ui:appearance'];local.data['ui:appearance']=message.appearance;storageListeners.forEach(f=>f({'ui:appearance':{oldValue,newValue:message.appearance}},'local'))}
 return {ok:true};
}},storage:{local,onChanged:{addListener:f=>storageListeners.add(f),removeListener:f=>storageListeners.delete(f)}},commands:{getAll:async()=>[{name:'open-dashboard-search',shortcut:'Ctrl+Shift+B'}]},tabs:{getCurrent:async()=>({id:1})}};
void import('./src/main');`, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, define: {'import.meta.env.DEV':'false'}, jsx: 'automatic', target: 'es2022', outfile: join(output,'fixture.js'), loader: {'.svg':'dataurl'} });
await copyFile('public/theme-init.js',join(output,'theme-init.js'));
await writeFile(join(output,'index.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="theme-init.js"></script><link rel="stylesheet" href="fixture.css"></head><body><div id="root"></div><script src="fixture.js"></script></body></html>');
const server=createServer(async(req,res)=>{try{const path=req.url.split('?')[0].slice(1)||'index.html';const data=await readFile(join(output,path));res.writeHead(200,{'content-type':path.endsWith('js')?'text/javascript':path.endsWith('css')?'text/css':'text/html'});res.end(data)}catch{res.writeHead(404);res.end()}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
return { output, server, url: `http://127.0.0.1:${server.address().port}/` };
}
