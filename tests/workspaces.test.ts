import { DashboardService } from '../src/core/service';
import { browserFamily } from '../src/browser/platform';
import { describe, it, expect } from 'vitest';
import { setup } from './memory';
import { workspaceRoot } from '../src/core/capabilities';
import { editToken } from '../src/core/logic';
import { sourceToken, placementToken, deletionToken, planMove } from '../src/core/operations';
import { directTags, folderEditToken, nodeTags } from '../src/core/node-tags';
import { buildCatalogue, filterCatalogue } from '../src/ui/catalogue-model';
export function workspaceFixture() {
 const env=setup();env.bookmarks.data[0].browserFamily='edge';env.bookmarks.data[0].children!.push(
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
 it('allows within-container placement, blocks Workspace/ordinary-root boundaries including legacy Edit moves',async()=>{
  const {service,bookmarks}=workspaceFixture();const s=await service.snapshot('test');
  expect(planMove(s,'a',{parentId:'beta',side:'end'})).toEqual({parentId:'beta',index:0});
  expect(planMove(s,'a',{parentId:'alpha',side:'end'})).toEqual({parentId:'alpha',index:1});
  for(const [id,parentId] of [['a','1'],['20','sub']]){
   const placement={parentId,side:'end' as const};
   await expect(service.command({type:'move',id,expected:sourceToken(s,id),placement,destinationExpected:placementToken(s,placement)})).rejects.toThrow(/ordinary bookmark root/);
  }
  const f=s.favorites.find(f=>f.id==='a')!;
  await expect(service.command({type:'edit',id:f.id,expected:editToken(f,[]),input:{title:'Must not save',url:f.url,parentId:'1',tags:[]}})).rejects.toThrow(/ordinary bookmark root/);
  expect(bookmarks.calls).toEqual([]);
 });
 it('moves a tagged subtree between containers, preserves native values and derives destination archive inheritance',async()=>{
  const {bookmarks,repository}=workspaceFixture();
  const service=new DashboardService(bookmarks,repository,{extensionId:'test',version:'test'},()=>crypto.randomUUID());
  let s=await service.snapshot('before');
  for(const [id,tags] of [['alpha',['old-source']],['beta',['new-source','archived']],['sub',['sub-direct']]] as const) {
   s=await service.command({type:'edit-folder',id,title:s.folders.find(n=>n.id===id)!.title,tags:[...tags],expected:folderEditToken(s,s.folders.find(n=>n.id===id)!)});
  }
  const item=s.favorites.find(n=>n.id==='a')!;
  s=await service.command({type:'edit',id:'a',expected:editToken(item,[]),input:{title:item.title,url:item.url,parentId:item.parentId!,tags:['own']}});
  const ids=Object.fromEntries(['sub','a'].map(id=>[id,s.reconciliation.mappings[id].stableId]));
  const native=bookmarks.all().filter(n=>['sub','a','b'].includes(n.id)).map(n=>[n.id,n.title,n.url]);
  const placement={parentId:'beta',side:'end' as const};
  s=await service.command({type:'move',id:'sub',expected:sourceToken(s,'sub'),placement,destinationExpected:placementToken(s,placement)});
  expect(s.mutation?.parentId).toBe('beta');expect(s.folders.find(n=>n.id==='sub')?.parentId).toBe('beta');
  expect(bookmarks.all().filter(n=>['sub','a','b'].includes(n.id)).map(n=>[n.id,n.title,n.url])).toEqual(native);
  expect(Object.fromEntries(['sub','a'].map(id=>[id,s.reconciliation.mappings[id].stableId]))).toEqual(ids);
  expect(directTags(s,'a')).toEqual(['own']);expect(directTags(s,'sub')).toEqual(['sub-direct']);
  expect(nodeTags(s).get('a')?.effective).toEqual(['archived','new-source','own','sub-direct']);
  expect(filterCatalogue(buildCatalogue(s),s.favorites,'*','One',true).count).toBe(0);
  const back={parentId:'alpha',side:'end' as const};
  s=await service.command({type:'move',id:'a',expected:sourceToken(s,'a'),placement:back,destinationExpected:placementToken(s,back)});
  expect(nodeTags(s).get('a')?.effective).toEqual(['old-source','own']);expect(directTags(s,'a')).toEqual(['own']);
 });
 it('requires Edge browser evidence before applying the Workspace assumption to an unknown root',async()=>{
  const {bookmarks,service}=workspaceFixture();
  expect(browserFamily('Chrome/142 Safari/537 Edg/142')).toBe('edge');expect(browserFamily('Chrome/142 Safari/537')).toBe('chrome');
  bookmarks.data[0].browserFamily='chrome';expect(workspaceRoot(bookmarks.data)).toBeUndefined();
  const s=await service.snapshot('Chrome');expect(s.folders.find(n=>n.id==='alpha')?.workspaceRole).toBeUndefined();
  expect(s.folders.find(n=>n.id==='10')?.writable).toBe(true);expect(s.folders.find(n=>n.id==='ordinary')?.writable).toBe(true);
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
