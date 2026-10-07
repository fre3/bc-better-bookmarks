import {expect,it} from 'vitest';
import {setup} from './memory';
import {deletionToken,sourceToken} from '../src/core/operations';
import {idA} from './fixtures';
import type {Command,Snapshot} from '../src/core/model';
const command=(s:Snapshot,id='10'):Command=>({type:'delete',id,expected:sourceToken(s,id),subtreeExpected:deletionToken(s,id),generation:s.metadata.setup?.generation});
it('deletes only a confirmed native subtree leaf first and publishes established tombstones',async()=>{
 const {service,bookmarks,sync}=setup(true);await bookmarks.create({parentId:'10',title:'Empty'});const s=await service.snapshot('confirm');
 const result=await service.command(command(s));expect(result.folders.some(f=>f.id==='10')).toBe(false);expect(result.favorites).toHaveLength(0);expect(result.folders.some(f=>f.id==='11')).toBe(true);expect(sync.data[`dead:${idA}`]).toBeDefined();
 await expect(service.command(command(s))).rejects.toThrow('changed');expect(bookmarks.calls.filter(c=>c==='delete')).toHaveLength(3);
});
it('requires a new confirmation after added, moved or modified descendants',async()=>{
 const {service,bookmarks}=setup();const s=await service.snapshot('confirm');await bookmarks.create({parentId:'10',title:'Unexpected'});await expect(service.command(command(s))).rejects.toThrow('changed');expect(bookmarks.calls).toEqual(['create']);
});
it('rejects root/managed/unresolved deletion and retains independent integrity guards',async()=>{
 const {service,bookmarks,sync}=setup(true);let s=await service.snapshot('confirm');await expect(service.command(command(s,'1'))).rejects.toThrow('Browser-owned');bookmarks.all().find(n=>n.id==='20')!.unmodifiable='managed';s=await service.snapshot('confirm');await expect(service.command(command(s))).rejects.toThrow('managed');delete sync.data[`meta:${idA}`];s=await service.snapshot('confirm');await expect(service.command(command(s))).rejects.toThrow();expect(bookmarks.calls).toEqual([]);
});
it('reports native success separately from pending cleanup and reconciles without deleting again',async()=>{
 const {service,bookmarks,sync,local}=setup(true);const s=await service.snapshot('confirm');const remove=bookmarks.removeLink.bind(bookmarks);bookmarks.removeLink=async id=>{await remove(id);sync.fail=true;};
 await expect(service.command(command(s))).rejects.toThrow('1 native item(s) DELETED');expect(bookmarks.all().some(n=>n.id==='20')).toBe(false);expect(bookmarks.all().some(n=>n.id==='10')).toBe(true);expect((local.data.state as {pendingDeletions:string[]}).pendingDeletions).toContain(idA);
 sync.fail=false;await service.command({type:'reconcile'});expect(sync.data[`dead:${idA}`]).toBeDefined();expect(bookmarks.calls).toEqual(['delete']);
});
it('stops a partial subtree removal if an external child arrives between native operations',async()=>{
 const {service,bookmarks}=setup();const s=await service.snapshot('confirm');const remove=bookmarks.removeLink.bind(bookmarks);bookmarks.removeLink=async id=>{await remove(id);await bookmarks.create({parentId:'10',title:'New external item'});};
 await expect(service.command(command(s))).rejects.toThrow('Remaining subtree changed');expect(bookmarks.all().some(n=>n.title==='New external item')).toBe(true);expect(bookmarks.all().some(n=>n.id==='10')).toBe(true);
});
it('includes archived metadata in deletion and aborts when metadata integrity changes mid-subtree',async()=>{
 const {service,bookmarks,sync}=setup(true);(sync.data[`meta:${idA}`] as {tags:string[]}).tags=['archived'];const s=await service.snapshot('confirm');expect(deletionToken(s,'10')).toContain('archived');const remove=bookmarks.removeLink.bind(bookmarks);bookmarks.removeLink=async id=>{await remove(id);sync.data['meta:invalid']='damaged';};
 await expect(service.command(command(s))).rejects.toThrow('Metadata integrity changed');expect(bookmarks.all().some(n=>n.id==='10')).toBe(true);
});
