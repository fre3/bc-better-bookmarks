import { describe, it, expect } from 'vitest';
import { setup } from './memory';
import { workspaceRoot } from '../src/core/capabilities';
import { editToken } from '../src/core/logic';
import { sourceToken, placementToken, deletionToken, planMove } from '../src/core/operations';
import { directTags, folderEditToken, nodeTags } from '../src/core/node-tags';
import { buildCatalogue, filterCatalogue } from '../src/ui/catalogue-model';
export function workspaceFixture() {
 const env=setup();env.bookmarks.data[0].children!.push(
  {id:'ordinary',parentId:'0',folderType:'other',title:'Autres',children:[]},
  {id:'spaces',parentId:'0',title:'Arbeitsbereiche',children:[
   {id:'alpha',parentId:'spaces',title:'Alpha',children:[{id:'sub',parentId:'alpha',title:'Workspaces',children:[{id:'a',parentId:'sub',title:'One',url:'https://one.test/',dateAdded:1},{id:'b',parentId:'sub',title:'Two',url:'https://two.test/',dateAdded:2}]}]},
   {id:'beta',parentId:'spaces',title:'Beta',children:[]},
   {id:'loose',parentId:'spaces',title:'Outside',url:'https://outside.test/'}
  ]});return env;
}
describe('accepted Workspace structural policy',()=>{
 it('recognizes only the supplied structural shape, without names/IDs; ambiguity stays unknown',async()=>{
  const {bookmarks,service}=workspaceFixture();expect(workspaceRoot(bookmarks.data)).toBe('spaces');
  let s=await service.snapshot('capabilities');
  expect(s.folders.find(f=>f.id==='spaces')).toMatchObject({workspaceRole:'root',writable:false,renamable:false});
  for(const id of ['alpha','beta'])expect(s.folders.find(f=>f.id===id)).toMatchObject({workspaceRole:'container',workspaceId:id,writable:true,renamable:false});
  expect(s.folders.find(f=>f.id==='sub')).toMatchObject({workspaceRole:'content',workspaceId:'alpha',writable:true,renamable:true});
  bookmarks.data[0].children!.push({id:'unknown2',parentId:'0',title:'Elsewhere',children:[]});expect(workspaceRoot(bookmarks.data)).toBeUndefined();
  s=await service.snapshot('ambiguous roots');expect(s.folders.find(f=>f.id==='sub')?.writable).toBe(false);
 });
 it('blocks root creation/receiving and all container lifecycle operations, but permits metadata only',async()=>{
  const {service,bookmarks}=workspaceFixture();let s=await service.snapshot('test');
  await expect(service.command({type:'create-folder',parentId:'spaces',title:'Not a workspace'})).rejects.toThrow(/through Edge/);
  for(const id of ['spaces','alpha','beta']){
   const folder=s.folders.find(f=>f.id===id)!;
   await expect(service.command({type:'rename-folder',id,title:'No',expectedTitle:folder.title})).rejects.toThrow();
   await expect(service.command({type:'delete',id,expected:sourceToken(s,id),subtreeExpected:deletionToken(s,id)})).rejects.toThrow();
   expect(()=>planMove(s,id,{parentId:'1',side:'end'})).toThrow();
  }
  expect(()=>planMove(s,'a',{parentId:'spaces',side:'end'})).toThrow(/through Edge/);
  s=await service.command({type:'edit-folder',id:'alpha',title:'Alpha',tags:['work'],expected:folderEditToken(s,s.folders.find(f=>f.id==='alpha')!)});
  expect(bookmarks.calls).toEqual([]);expect(directTags(s,'alpha')).toEqual(['work']);expect(nodeTags(s).get('a')?.inherited).toEqual(['work']);
 });
 it('allows ordinary creation/edit/deletion in either Workspace independent of view/active state',async()=>{
  const {service,bookmarks}=workspaceFixture();let s=await service.command({type:'create-folder',parentId:'beta',title:'Disposable'});const created=s.mutation!.id;
  s=await service.command({type:'edit-folder',id:created,title:'Renamed',tags:[],expected:folderEditToken(s,s.folders.find(f=>f.id===created)!)});
  s=await service.command({type:'create',input:{parentId:created,title:'Test',url:'https://example.test/',tags:[]}});const link=s.favorites.find(f=>f.id===s.mutation!.id)!;
  s=await service.command({type:'edit',id:link.id,expected:editToken(link,[]),input:{parentId:created,title:'Updated',url:'https://changed.test/',tags:[]}});
  s=await service.command({type:'delete',id:created,expected:sourceToken(s,created),subtreeExpected:deletionToken(s,created)});
  expect(s.folders.some(f=>f.id===created)).toBe(false);expect(bookmarks.calls).toEqual(['create','update','create','update','delete','delete']);
 });
 it('allows within-container placement, blocks cross-container/ordinary-root boundaries including legacy Edit moves',async()=>{
  const {service,bookmarks}=workspaceFixture();const s=await service.snapshot('test');
  expect(planMove(s,'a',{parentId:'alpha',side:'end'})).toEqual({parentId:'alpha',index:1});
  for(const [id,parentId] of [['a','beta'],['a','1'],['20','sub']]){
   const placement={parentId,side:'end' as const};
   await expect(service.command({type:'move',id,expected:sourceToken(s,id),placement,destinationExpected:placementToken(s,placement)})).rejects.toThrow(/boundary/);
  }
  const f=s.favorites.find(f=>f.id==='a')!;
  await expect(service.command({type:'edit',id:f.id,expected:editToken(f,[]),input:{title:'Must not save',url:f.url,parentId:'beta',tags:[]}})).rejects.toThrow(/boundary/);
  expect(bookmarks.calls).toEqual([]);
 });
 it('hides loose root items in browse only; retains search, Manage data, tags and archive rules',async()=>{
  const {service}=workspaceFixture();let s=await service.snapshot('projection');const model=buildCatalogue(s);
  for(const scope of ['*','spaces']) {
   expect(filterCatalogue(model,s.favorites,scope,'',false).sections.some(n=>n.id==='loose:spaces')).toBe(false);
   const result=filterCatalogue(model,s.favorites,scope,'Outside',true);expect(result.count).toBe(1);expect(result.sections[0].id).toBe('loose:spaces');
  }
  expect(s.favorites.some(f=>f.id==='loose')).toBe(true);
  const f=s.favorites.find(f=>f.id==='loose')!;s=await service.command({type:'edit',id:f.id,expected:editToken(f,[]),input:{title:f.title,url:f.url,parentId:f.parentId!,tags:['archived']}});
  expect(filterCatalogue(buildCatalogue(s),s.favorites,'*','Outside',true).count).toBe(0);
  expect(filterCatalogue(buildCatalogue(s,true),s.favorites,'*','Outside',true).count).toBe(1);
 });
});
