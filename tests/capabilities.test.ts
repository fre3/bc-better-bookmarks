import { describe, it, expect } from 'vitest';
import { setup } from './memory';
import { flattenTree, editToken } from '../src/core/logic';
import { metadataEditable } from '../src/core/capabilities';
import { folderEditToken, directTags } from '../src/core/node-tags';
import { sourceToken, placementToken, deletionToken } from '../src/core/operations';

function fixture() {
 const env=setup();
 env.bookmarks.data[0].children!.push({id:'special',parentId:'0',title:'Espaces',children:[{id:'container',parentId:'special',title:'Projet',children:[{id:'inside',parentId:'container',title:'Ordinary',children:[{id:'link',parentId:'inside',title:'Example',url:'https://example.test/',dateAdded:9}]}]}]});
 return env;
}
describe('conservative browser-location policy',()=>{
 it('uses types/structure, never translated names or absence of unmodifiable',()=>{
  const {bookmarks}=fixture();bookmarks.all().find(n=>n.id==='10')!.title='Workspaces';
  const s=flattenTree(bookmarks.data);
  expect(s.folders.find(n=>n.id==='10')?.renamable).toBe(true);
  for(const id of ['special','container','inside'])expect(s.folders.find(n=>n.id===id)).toMatchObject({writable:false,renamable:false,nativeRestriction:expect.stringContaining('unclassified')});
  expect(metadataEditable(s.folders.find(n=>n.id==='container'))).toBe(true);
  expect(metadataEditable(s.folders.find(n=>n.id==='special'))).toBe(false);
  bookmarks.all().find(n=>n.id==='special')!.folderType='future-browser-type';
  expect(flattenTree(bookmarks.data).favorites.find(n=>n.id==='link')?.nativeRestriction).toBeDefined();
 });
 it('rejects all uncertain native command paths without native or tag writes',async()=>{
  const {service,bookmarks,sync}=fixture();const s=await service.snapshot('policy');
  const f=s.favorites.find(n=>n.id==='link')!,folder=s.folders.find(n=>n.id==='container')!;
  const commands=[
   {type:'rename-folder' as const,id:folder.id,title:'No',expectedTitle:folder.title},
   {type:'edit-folder' as const,id:folder.id,title:'No',tags:['no'],expected:folderEditToken(s,folder)},
   {type:'edit' as const,id:f.id,input:{title:'No',url:f.url,parentId:f.parentId!,tags:['no']},expected:editToken(f,[])},
   {type:'create-folder' as const,parentId:'special',title:'No'},
   {type:'create' as const,input:{title:'No',url:f.url,parentId:'inside',tags:[]}},
   {type:'delete' as const,id:folder.id,expected:sourceToken(s,folder.id),subtreeExpected:deletionToken(s,folder.id)},
   {type:'delete' as const,id:f.id,expected:editToken(f,[])},
  ];
  for(const c of commands)await expect(service.command(c)).rejects.toThrow(/unclassified/);
  for(const [id,parentId] of [['20','inside'],['container','1'],['link','11']]){
   const placement={parentId,side:'end' as const};
   await expect(service.command({type:'move',id,expected:sourceToken(s,id),placement,destinationExpected:placementToken(s,placement)})).rejects.toThrow(/unclassified/);
  }
  expect(bookmarks.calls).toEqual([]);expect(sync.writes).toBe(0);
 });
 it('saves protected folder metadata without native rename and retains identity after reload',async()=>{
  const {service,bookmarks}=fixture();let s=await service.snapshot('metadata');const before=structuredClone(bookmarks.data);
  const folder=s.folders.find(n=>n.id==='container')!;
  s=await service.command({type:'edit-folder',id:folder.id,title:folder.title,tags:['work'],expected:folderEditToken(s,folder)});
  const uuid=s.reconciliation.mappings[folder.id].stableId;
  s=await service.snapshot('reload');expect(s.reconciliation.mappings[folder.id].stableId).toBe(uuid);expect(directTags(s,folder.id)).toEqual(['work']);
  expect(bookmarks.data).toEqual(before);expect(bookmarks.calls).toEqual([]);
 });
 it('preserves exact favorite fields on metadata-only saves, including unnormalized native values',async()=>{
  const {service,bookmarks}=fixture();const node=bookmarks.all().find(n=>n.id==='link')!;node.title='  Untouched  ';node.url='https://example.test';
  let s=await service.snapshot('tags only');const f=s.favorites.find(n=>n.id===node.id)!;const before=structuredClone(bookmarks.data);
  s=await service.command({type:'edit',id:f.id,expected:editToken(f,[]),input:{title:f.title,url:f.url,parentId:f.parentId!,tags:['local']}});
  expect(directTags(s,f.id)).toEqual(['local']);expect(bookmarks.calls).toEqual([]);expect(bookmarks.data).toEqual(before);
 });
 it('allows ordinary operations, and preserves state on Edge rejection with no fallback',async()=>{
  const {service,bookmarks}=fixture();let s=await service.snapshot('ordinary');
  s=await service.command({type:'edit-folder',id:'10',title:'Renamed',tags:[],expected:folderEditToken(s,s.folders.find(n=>n.id==='10')!)});
  const before=structuredClone(bookmarks.data);bookmarks.calls=[];
  bookmarks.move=async()=>{bookmarks.calls.push('rejected move');throw Error("Can't modify workspace folder");};
  const placement={parentId:'11',side:'end' as const};
  await expect(service.command({type:'move',id:'20',expected:sourceToken(s,'20'),placement,destinationExpected:placementToken(s,placement)})).rejects.toThrow("Can't modify workspace folder");
  expect(bookmarks.data).toEqual(before);expect(bookmarks.calls).toEqual(['rejected move']);
 });
 it('rechecks changed capability before the native write',async()=>{
  const {service,bookmarks}=fixture();const s=await service.snapshot('open');
  const get=bookmarks.getTree.bind(bookmarks);let reads=0;
  bookmarks.getTree=async()=>{if(++reads===2)delete bookmarks.all().find(n=>n.id==='1')!.folderType;return get();};
  await expect(service.command({type:'edit-folder',id:'10',title:'No',tags:[],expected:folderEditToken(s,s.folders.find(n=>n.id==='10')!)})).rejects.toThrow(/unclassified/);
  expect(bookmarks.calls).toEqual([]);
 });
});
