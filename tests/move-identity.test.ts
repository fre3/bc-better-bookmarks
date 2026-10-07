import { describe, expect, it } from 'vitest';
import { reconcile } from '../src/core/reconcile';
import { editToken, flattenTree } from '../src/core/logic';
import { mapping, metadata, record, idA, idB } from './fixtures';
import { setup } from './memory';
import { placementToken, sourceToken } from '../src/core/operations';
import { nodeTags } from '../src/core/node-tags';

describe('mapped duplicate move identity', () => {
  it('keeps two proven local associations when a move makes their locators identical', async () => {
    const {bookmarks,sync,local,service}=setup();
    bookmarks.all().find(n=>n.id==='11')!.children!.push({id:'21',parentId:'11',title:'Azure',url:'https://azure.com/',dateAdded:2});
    const [a,b]=flattenTree(bookmarks.data).favorites;
    sync.data=metadata([{...record(a,idA),tags:['a-only']},{...record(b,idB),tags:['b-only']}]).raw;
    local.data.state={schemaVersion:1,mappings:{...mapping(a,idA),...mapping(b,idB)},pendingDeletions:[],rootId:'*'};
    const initial=await service.snapshot('before');
    const placement={parentId:'11',side:'end' as const};
    const after=await service.command({type:'move',id:'20',expected:sourceToken(initial,'20'),placement,destinationExpected:placementToken(initial,placement)});
    expect(after.reconciliation.matches.map(m=>m.status)).toEqual(['local-mapping','local-mapping']);
    expect(after.reconciliation.mappings['20'].stableId).toBe(idA);
    expect(after.reconciliation.mappings['21'].stableId).toBe(idB);
    expect(nodeTags(after).get('20')?.direct).toEqual(['a-only']);
    expect(nodeTags(after).get('21')?.direct).toEqual(['b-only']);
    expect(bookmarks.calls).toEqual(['move']);
    expect(after.favorites.map(f=>[f.id,f.title,f.url]).sort()).toEqual(initial.favorites.map(f=>[f.id,f.title,f.url]).sort());
    expect(after.metadata.records).toEqual(initial.metadata.records);
    for(const reason of ['bookmarks.moved','storage.sync.changed','reload']) {
      const again=await service.snapshot(reason);
      expect(again.reconciliation.mappings).toEqual(after.reconciliation.mappings);
    }
    // A fresh profile has no evidence to distinguish these native duplicates.
    expect(reconcile(after.favorites,after.metadata,{}).mappings).toEqual({});
  });
  it('is independent of record/node ordering and retains genuine conflicting evidence', () => {
    const {bookmarks}=setup();
    bookmarks.all().find(n=>n.id==='10')!.children!.push({id:'21',parentId:'10',title:'Azure',url:'https://azure.com/',dateAdded:2});
    const [a,b]=flattenTree(bookmarks.data).favorites;
    const data=metadata([record(a,idA),record(b,idB)]);
    for(const favorites of [[a,b],[b,a]])for(const records of [data.records,[...data.records].reverse()]) {
      const r=reconcile(favorites,{...data,records},{...mapping(a,idA),...mapping(b,idB)});
      expect(r.mappings['20']?.stableId).toBe(idA);expect(r.mappings['21']?.stableId).toBe(idB);
      expect(reconcile(favorites,{...data,records},mapping(a,idA)).matches.every(m=>m.status==='ambiguous')).toBe(true);
      expect(reconcile(favorites,{...data,records},{...mapping(a,idA),...mapping(b,idA)}).mappings).toEqual({});
    }
  });
});

// The editor and catalogue consume exactly the worker's preflight diagnostic.
import { itemMetadataIssue, itemIdentityDetails } from '../src/core/item-metadata-health';
import { buildCatalogue } from '../src/ui/catalogue-model';
it('keeps diagnostic status out of direct tags and associates it by native ID', async () => {
  const {bookmarks,sync,service,local}=setup(true);
  bookmarks.all().find(n=>n.id==='11')!.children!.push({id:'21',parentId:'11',title:'Azure',url:'https://other.test/',dateAdded:2});
  const initial=await service.snapshot('healthy');
  expect(itemMetadataIssue(initial,'20')).toBeUndefined();
  sync.data[`meta:${idB}`]=record(initial.favorites[0],idB);
  const s=await service.snapshot('competing record');
  expect(itemMetadataIssue(s,'20')).toContain('Ambiguous');
  expect(itemMetadataIssue(s,'21')).toBeUndefined();
  const projected=buildCatalogue(s).sections.flatMap(section=>section.children);
  expect(projected.find(item=>item.kind==='bookmark'&&item.favorite.id==='20')).toMatchObject({tags:[],metadataIssue:itemMetadataIssue(s,'20')});
  expect(itemIdentityDetails(s,'20').nativeId).toBe('20');
  const old=JSON.stringify(sync.data);
  await expect(service.command({type:'edit',id:'20',expected:editToken(s.favorites.find(f=>f.id==='20')!,[]),input:{title:'unsafe',url:'https://changed.test/',parentId:'10',tags:[]}})).rejects.toThrow('Ambiguous metadata');
  expect(JSON.stringify(sync.data)).toBe(old);expect(bookmarks.calls).toEqual([]);
  expect((local.data.state as {mappings:Record<string,unknown>}).mappings['20']).toBeDefined();
});
