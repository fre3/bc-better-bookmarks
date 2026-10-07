import { describe, it, expect } from 'vitest';
import { setup } from './memory';
import { editToken } from '../src/core/logic';
import { placementToken, sourceToken, type Placement } from '../src/core/operations';
import { moveOutcome } from '../src/core/move-outcome';
import { directTags } from '../src/core/node-tags';

describe('native move outcome verification',()=>{
 it('rejects a resolved no-op, keeps identity/tags and never retries or updates native fields',async()=>{
  const {service,bookmarks}=setup(true);const before=await service.snapshot('before'),native=structuredClone(bookmarks.data);
  bookmarks.move=async()=>{bookmarks.calls.push('no-op move');};const placement:Placement={parentId:'11',side:'end'};
  await expect(service.command({type:'move',id:'20',expected:sourceToken(before,'20'),placement,destinationExpected:placementToken(before,placement)})).rejects.toThrow('native position is unchanged');
  const after=await service.snapshot('after');expect(bookmarks.data).toEqual(native);expect(bookmarks.calls).toEqual(['no-op move']);expect(after.reconciliation.mappings['20']).toEqual(before.reconciliation.mappings['20']);expect(directTags(after,'20')).toEqual(directTags(before,'20'));
 });
 it('detects a wrong destination/order and reports the observed parent, without fallback',async()=>{
  const {service,bookmarks}=setup();const s=await service.snapshot('before');const move=bookmarks.move.bind(bookmarks);
  bookmarks.move=async(id)=>{await move(id,'1');};const placement:Placement={parentId:'11',side:'end'};
  await expect(service.command({type:'move',id:'20',expected:sourceToken(s,'20'),placement,destinationExpected:placementToken(s,placement)})).rejects.toThrow(/Current native parent: Favorites bar \[1\]/);
  expect(bookmarks.calls).toEqual(['move']);expect(bookmarks.all().find(n=>n.id==='20')?.parentId).toBe('1');
 });
 it('does not call API rejection success even when a move took effect',async()=>{
  const {service,bookmarks}=setup();const s=await service.snapshot('before');const move=bookmarks.move.bind(bookmarks);
  bookmarks.move=async(id,parent)=>{await move(id,parent);throw Error('lost response');};const placement:Placement={parentId:'11',side:'end'};
  await expect(service.command({type:'move',id:'20',expected:sourceToken(s,'20'),placement,destinationExpected:placementToken(s,placement)})).rejects.toThrow('position was observed, but Edge returned an error');expect(bookmarks.calls).toEqual(['move']);
 });
 it('rejects conflicting API reply and post-API read failure without claiming a confirmed result',async()=>{
  for(const kind of ['reply','read']){
   const {service,bookmarks}=setup();const s=await service.snapshot('before');const move=bookmarks.move.bind(bookmarks);
   bookmarks.move=async(id,parent)=>{await move(id,parent);if(kind==='read')bookmarks.getTree=async()=>{throw Error('offline');};return {id:'other-id',parentId:parent,title:'wrong'};};const placement:Placement={parentId:'11',side:'end'};
   await expect(service.command({type:'move',id:'20',expected:sourceToken(s,'20'),placement,destinationExpected:placementToken(s,placement)})).rejects.toThrow(kind==='reply'?'response disagrees':'could not be read');expect(bookmarks.calls).toEqual(['move']);
  }
 });
 it('verifies same-parent forward/backward indices and hidden sibling order; detects concurrent reorder',async()=>{
  const {service,bookmarks}=setup();bookmarks.all().find(n=>n.id==='10')!.children!.push({id:'hidden',parentId:'10',title:'Hidden',url:'https://hidden.test/'},{id:'22',parentId:'10',title:'Last',url:'https://last.test/'});
  const before=await service.snapshot('before');let after=structuredClone(before);after.folders.find(n=>n.id==='10')!.children!.push(after.folders.find(n=>n.id==='10')!.children!.shift()!);
  expect(moveOutcome(before,after,'20','10',3)).toBeUndefined();expect(moveOutcome(after,before,'20','10',0)).toBeUndefined();
  after=structuredClone(before);after.folders.find(n=>n.id==='10')!.children!.reverse();expect(moveOutcome(before,after,'20','10',3)).toContain('differs');
 });
 it('covers legacy Manage editing moves and retains partial-save reporting on a no-op',async()=>{
  const {service,bookmarks}=setup();const s=await service.snapshot('before'),f=s.favorites[0];bookmarks.move=async()=>{bookmarks.calls.push('no-op move');};
  await expect(service.command({type:'edit',id:f.id,expected:editToken(f,[]),input:{title:f.title,url:f.url,parentId:'11',tags:[]}})).rejects.toMatchObject({progress:{location:false,tags:'not-confirmed'},message:expect.stringContaining('native position is unchanged')});expect(bookmarks.calls).toEqual(['no-op move']);
 });
});
