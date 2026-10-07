import { build } from 'esbuild';
import { mkdtemp, readFile, writeFile, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';

export async function editingFixture({ deep = false, duplicates = false } = {}) {
const output = await mkdtemp(join(tmpdir(), 'bb-editing-'));
await build({ stdin: { contents: `
import {prepareMetadataReset,resetMetadata} from './src/browser/metadata-setup';
import { flattenTree } from './src/core/logic';
import { folderNode, nodeTags } from './src/core/node-tags';
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
window.nativeWrites=[];
let created=0;const bookmarks={getTree:async()=>{nodes().forEach(n=>n.children?.forEach((c,i)=>c.index=i));return structuredClone(tree)},update:async(id,value)=>{if(window.failSave)throw Error('Synthetic browser write failure');window.nativeWrites.push({operation:'update',id,value,before:structuredClone(nodes().find(n=>n.id===id))});Object.assign(nodes().find(n=>n.id===id),value)},move:async(id,parentId,index)=>{if(window.failMove)throw Error('Synthetic move failure');window.nativeWrites.push({operation:'move',id,parentId,index,before:structuredClone(nodes().find(n=>n.id===id))});const n=nodes().find(n=>n.id===id),old=nodes().find(p=>p.id===n.parentId),parent=nodes().find(p=>p.id===parentId);let at=index??parent.children.length;if(old===parent&&old.children.indexOf(n)<at)at--;old.children=old.children.filter(c=>c.id!==id);n.parentId=parentId;parent.children.splice(at,0,n)},create:async(input)=>{if(window.holdCreate)await new Promise(r=>window.releaseCreate=r);const n={...input,id:'created-'+(++created),dateAdded:Date.now(),...(input.url===undefined?{children:[]}:{})};nodes().find(p=>p.id===input.parentId).children.push(n);return structuredClone(n)},removeLink:async(id)=>{if(window.failDelete)throw Error('Synthetic deletion failure');const n=nodes().find(n=>n.id===id);if(!n||n.children?.length)throw Error('Missing or nonempty node');const p=nodes().find(p=>p.id===n.parentId);p.children=p.children.filter(c=>c.id!==id)},removeEmptyFolder:async(id)=>bookmarks.removeLink(id)};
const local=new Storage();local.data.state={schemaVersion:1,rootId:'*',mappings:{},pendingDeletions:[]};const sync=new Storage();
if (${duplicates}) {
 const title='Duplicate wrapping favorite title with a_long_filename_segment.pdf';
 sections[0].children=[{id:'source-folder',parentId:'s0',title:'Source',dateAdded:10,children:[{id:'dup-a',parentId:'source-folder',title,url:'https://example.test/duplicate',dateAdded:101}]},{id:'destination-folder',parentId:'s0',title:'Destination',dateAdded:11,children:[{id:'dup-b',parentId:'destination-folder',title,url:'https://example.test/duplicate',dateAdded:102},{id:'dup-c',parentId:'destination-folder',title,url:'https://example.test/different',dateAdded:103}]},{id:'distinct',parentId:'s0',title:'Distinct favorite',url:'https://example.test/distinct',dateAdded:104}];
 const flat=flattenTree(tree);const list=[flat.favorites.find(n=>n.id==='dup-a'),flat.favorites.find(n=>n.id==='dup-b'),flat.favorites.find(n=>n.id==='dup-c'),folderNode(flat.folders.find(n=>n.id==='source-folder'),flat.folders),folderNode(flat.folders.find(n=>n.id==='destination-folder'),flat.folders)];
 list.forEach((n,i)=>{const stableId='00000000-0000-4000-8000-'+String(i+1).padStart(12,'0');sync.data['meta:'+stableId]={schemaVersion:2,stableId,initialLocator:n.locator,tags:[['a-only','b-only','c-only','source-inherited','destination-inherited'][i]],updatedAt:'2026-10-07T12:00:00Z'};local.data.state.mappings[n.id]={stableId,lastLocator:n.locator,dateAdded:n.dateAdded,method:'explicit'}});
}
const restored=sessionStorage.getItem('binding-fixture');if(restored){const saved=JSON.parse(restored);local.data=saved.local;sync.data=saved.sync;}
window.persistFixture=()=>sessionStorage.setItem('binding-fixture',JSON.stringify({local:local.data,sync:sync.data}));
const service=new DashboardService(bookmarks,new BrowserMetadataRepository(sync,local),{extensionId:'fixture',version:'0.1.23'});
const listeners=new Set(),storageListeners=new Set();let queue=Promise.resolve();
local.data['ui:show-archived']=localStorage.getItem('ui:show-archived')==='true';
window.addEventListener('storage',e=>{if(e.key==='ui:show-archived'){local.data[e.key]=e.newValue==='true';storageListeners.forEach(f=>f({[e.key]:{newValue:e.newValue==='true'}},'local'))}});
window.commands=[];window.peekWrites=[];
window.external=async(id,change)=>{const n=nodes().find(n=>n.id===id);if(change==='delete'){const p=nodes().find(p=>p.id===n.parentId);p.children=p.children.filter(x=>x.id!==id)}else if(change.parentId){const p=nodes().find(p=>p.id===n.parentId);p.children=p.children.filter(x=>x.id!==id);Object.assign(n,change);nodes().find(p=>p.id===n.parentId).children.push(n)}else Object.assign(n,change);listeners.forEach(f=>f({event:'dashboard-changed'},{id:'fixture'},()=>{}))};
window.tagEvidence=s=>Object.fromEntries(nodeTags(s));window.local=local;window.sync=sync;window.service=service;
window.requestSearch=()=>{let result;listeners.forEach(f=>f({event:'dashboard-search',tabId:1,id:crypto.randomUUID(),allBookmarks:true},{id:'fixture'},r=>{result=r}));return result};
window.refresh=()=>listeners.forEach(f=>f({event:'dashboard-changed'},{id:'fixture'},()=>{}));
window.chrome={runtime:{id:'fixture',getURL:path=>location.origin+'/'+path.replace(/^\\//,''),onMessage:{addListener:f=>listeners.add(f),removeListener:f=>listeners.delete(f)},sendMessage:async message=>{
 if(message.command){window.commands.push(message.command);const result=queue.then(async()=>{if(message.command.type==='attach-folder'&&window.failBinding)throw Error('Error: Synthetic binding failure');if(message.command.type==='edit'&&window.holdSave)await new Promise(r=>window.releaseSave=r);return service.command(message.command)});queue=result.catch(()=>{});try{return {ok:true,snapshot:await result}}catch(e){return {ok:false,error:String(e),progress:e.progress}}}
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
