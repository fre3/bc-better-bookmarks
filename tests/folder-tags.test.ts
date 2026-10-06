import { describe, expect, it } from 'vitest';
import { setup, MemoryBookmarks, MemoryStorage } from './memory';
import { DashboardService } from '../src/core/service';
import { BrowserMetadataRepository } from '../src/browser/metadata';
import { folderEditToken, nodeTags, visibleSnapshot } from '../src/core/node-tags';
import { editToken } from '../src/core/logic';
import { parseMetadata } from '../src/core/schema';
import { buildCatalogue, filterCatalogue } from '../src/ui/catalogue-model';
import { alignMetadataEpoch, prepareMetadataReset, resetMetadata, SETUP_KEY } from '../src/browser/metadata-setup';
import { EditFailure } from '../src/core/edit-failure';
import type { Snapshot } from '../src/core/model';
import { idA } from './fixtures';
const idC = '00000000-0000-4000-8000-000000000003';
async function folderSave(service: DashboardService, id: string, tags: string[], title?: string) {
  const s = await service.snapshot('test'), f = s.folders.find(f => f.id === id)!;
  return service.command({ type: 'edit-folder', id, title: title ?? f.title, tags, expected: folderEditToken(s, f), generation: s.metadata.setup?.generation });
}
describe('folder identity and shared save safeguards', () => {
  it('tags empty and nested folders without modifying children; retains identity through rename/move; copies never auto-bind', async () => {
    const { service, bookmarks, sync } = setup(); await service.command({ type: 'set-root', rootId: '*' });
    let s = await folderSave(service, '11', [' Work ', 'WORK']);
    expect(s.metadata.records[0]).toMatchObject({ schemaVersion: 2, tags: ['work'], initialLocator: { kind: 'folder', url: '' } });
    expect(bookmarks.calls).toEqual([]);
    s = await folderSave(service, '11', ['work'], 'Renamed'); expect(s.reconciliation.mappings['11'].stableId).toBe(idA);
    await bookmarks.move('11', '10'); s = await service.snapshot('external move'); expect(s.reconciliation.mappings['11'].stableId).toBe(idA);
    expect(s.metadata.histories[idA].locators).toHaveLength(3);
    await bookmarks.create({ parentId: '10', title: 'Renamed' }); s = await service.snapshot('copy');
    expect(s.reconciliation.mappings['101']).toBeUndefined(); expect(nodeTags(s).get('101')?.direct).toEqual([]);
    await expect(folderSave(service, '101', ['copy-only'])).rejects.toThrow('Review the existing folder metadata');
    // A second device has different native IDs and must explicitly bind even a
    // unique path; a matching folder is not proven to be the original.
    const b = new MemoryBookmarks(); b.data = structuredClone(bookmarks.data); b.all().forEach(n => { n.id = 'b'+n.id; if (n.parentId) n.parentId = 'b'+n.parentId; });
    const local = new MemoryStorage(); local.data.state = { schemaVersion: 1, rootId: '*', mappings: {}, pendingDeletions: [] };
    const recipient = new DashboardService(b, new BrowserMetadataRepository(sync, local), { extensionId: 'b', version: 'test' });
    let bs = await recipient.snapshot('arrival'); expect(bs.reconciliation.matches[0].status).toBe('ambiguous');
    await expect(recipient.command({ type: 'attach-folder', id: 'b11', stableId: idA, expected: folderEditToken(bs, bs.folders.find(f => f.id === 'b11')!) })).rejects.toThrow('ambiguous');
    b.all().find(n => n.id === 'b101')!.title = 'Known copy'; bs = await recipient.snapshot('disambiguated');
    expect(bs.reconciliation.matches[0].status).toBe('unresolved'); expect(bs.reconciliation.mappings.b11).toBeUndefined();
    bs = await recipient.command({ type: 'attach-folder', id: 'b11', stableId: idA, expected: folderEditToken(bs, bs.folders.find(f => f.id === 'b11')!) });
    expect(nodeTags(bs).get('b11')?.direct).toEqual(['work']);
    await service.removed(['11']); bs = await recipient.snapshot('tombstone'); expect(bs.reconciliation.mappings.b11).toBeUndefined();
  });
  it('does not rewrite favorite records and blocks roots, stale folders and missing folder metadata before rename', async () => {
    const { service, sync, bookmarks } = setup(true); const original = structuredClone(sync.data);
    await expect(folderSave(service, '1', ['tag'])).rejects.toThrow('Browser-owned');
    const s = await service.snapshot('draft'), folder = s.folders.find(f => f.id === '10')!;
    await bookmarks.move('10', '11');
    await expect(service.command({ type: 'edit-folder', id: '10', title: 'Stale', tags: [], expected: folderEditToken(s, folder) })).rejects.toThrow('changed');
    expect(sync.data[`meta:${idA}`]).toEqual(original[`meta:${idA}`]);
    const fresh = setup(); await fresh.service.command({ type: 'set-root', rootId: '*' }); await folderSave(fresh.service, '10', ['tag']); delete fresh.sync.data[`meta:${idA}`];
    await expect(folderSave(fresh.service, '10', [], 'Blocked')).rejects.toThrow('missing synchronized metadata'); expect(fresh.bookmarks.all().find(n => n.id === '10')!.title).toBe('Dashboard');
  });
  it('reports precisely the native changes completed before a publication failure and safely retries with a reviewed token', async () => {
    const { service, sync, bookmarks } = setup(true); let s = await service.snapshot('draft');
    sync.fail = true;
    try { await service.command({ type: 'edit', id: '20', expected: editToken(s.favorites[0], s.metadata.records[0].tags), input: { title: 'Saved name', url: s.favorites[0].url, parentId: '10', tags: ['new'] } }); expect.fail('must fail'); }
    catch (error) { expect(error).toBeInstanceOf(EditFailure); expect((error as EditFailure).progress).toEqual({ title: true, url: false, location: false, tags: 'not-confirmed' }); }
    expect(bookmarks.all().find(f => f.id === '20')?.title).toBe('Saved name');
    sync.fail = false; s = await service.snapshot('review current values');
    await service.command({ type: 'edit', id: '20', expected: editToken(s.favorites[0], s.metadata.records[0].tags), input: { title: 'Saved name', url: s.favorites[0].url, parentId: '10', tags: ['new'] } });
    expect(bookmarks.calls.filter(c => c === 'update')).toHaveLength(1);
  });
});
function taggedSnapshot(s: Snapshot) {
  const folder = s.folders.find(f => f.id === '10')!;
  s.metadata.records.push({ schemaVersion: 2, stableId: idC, tags: ['archived', 'azure'], updatedAt: new Date().toISOString(), initialLocator: { kind: 'folder', url: '', title: folder.title, folderPath: [] } });
  s.reconciliation.mappings[folder.id] = { stableId: idC, lastLocator: s.metadata.records.at(-1)!.initialLocator, method: 'explicit' };
  return s;
}
describe('computed inheritance and one archive gate', () => {
  it('deduplicates sources, never copies tags, and filters browse/search/Manage before matching', async () => {
    const { service } = setup(true); const s = taggedSnapshot(await service.snapshot('test')); const before = structuredClone(s.metadata.raw);
    const tags = nodeTags(s).get('20')!; expect(tags.direct).toEqual(['azure', 'development']); expect(tags.inherited).toEqual(['archived', 'azure']); expect(tags.effective).toEqual(['archived', 'azure', 'development']); expect(tags.sources[0].path).toEqual(['Favorites bar', 'Dashboard']);
    let model = buildCatalogue(s); expect(model.sections.map(s => s.title)).toEqual(['Other']); expect(filterCatalogue(model, s.favorites, '*', '#archived', true).count).toBe(0); expect(visibleSnapshot(s, false).favorites).toHaveLength(0);
    model = buildCatalogue(s, true); expect(filterCatalogue(model, s.favorites, '*', '#archived @dashboard', true).count).toBe(2); expect(filterCatalogue(model, s.favorites, '*', 'archived', true).count).toBe(2); expect(visibleSnapshot(s, true).favorites).toHaveLength(1); expect(s.metadata.raw).toEqual(before);
    s.metadata.records.find(r => r.stableId === idC)!.tags = []; expect(nodeTags(s).get('20')?.effective).toEqual(['azure', 'development']);
    s.metadata.records[0].tags.push('archived'); expect(buildCatalogue(s).sections.find(x => x.title === 'Dashboard')?.children).toHaveLength(0);
  });
  it('recomputes inherited sources after a real subtree move without persisting descendant tags', async () => {
    const { bookmarks, repository, sync } = setup();
    const service = new DashboardService(bookmarks, repository, { extensionId: 'test', version: 'test' });
    await service.command({ type: 'set-root', rootId: '*' });
    await folderSave(service, '10', ['first']); await folderSave(service, '11', ['second']);
    const nested = await bookmarks.create({ parentId: '10', title: 'Subtree' });
    await bookmarks.move('20', nested.id); await folderSave(service, nested.id, ['shared']);
    let s = await service.snapshot('before subtree move');
    const identity = s.reconciliation.mappings[nested.id].stableId;
    expect(nodeTags(s).get('20')?.effective).toEqual(['first', 'shared']);
    await bookmarks.move(nested.id, '11'); s = await service.snapshot('after subtree move');
    expect(s.reconciliation.mappings[nested.id].stableId).toBe(identity);
    expect(nodeTags(s).get('20')?.effective).toEqual(['second', 'shared']);
    expect(nodeTags(s).get('20')?.sources.map(source => source.path)).toEqual([['Favorites bar', 'Other'], ['Favorites bar', 'Other', 'Subtree']]);
    expect(s.reconciliation.mappings['20']).toBeUndefined();
    expect(Object.keys(sync.data).filter(key => key.startsWith('meta:'))).toHaveLength(3);
  });
  it('keeps hidden and nosearch as ordinary tags, including effective-tag search', async () => {
    const { service } = setup(); await service.command({ type: 'set-root', rootId: '*' });
    const s = await folderSave(service, '10', ['hidden', 'nosearch']);
    const model = buildCatalogue(s);
    expect(model.sections.some(section => section.title === 'Dashboard')).toBe(true);
    expect(filterCatalogue(model, s.favorites, '*', '#hidden nosearch', true).count).toBe(2);
  });
  it('updates multiple ancestry sources after whole-subtree moves and source removal', async () => {
    const { service, bookmarks } = setup(true); await bookmarks.create({ parentId: '10', title: 'Nested' }); await bookmarks.move('20', '101'); const s = taggedSnapshot(await service.snapshot('test'));
    s.metadata.records.push({ schemaVersion: 2, stableId: '00000000-0000-4000-8000-000000000004', tags: ['azure','nested'], initialLocator: {kind:'folder',url:'',title:'Nested',folderPath:[]}, updatedAt:new Date().toISOString() });
    s.reconciliation.mappings['101']={stableId:s.metadata.records.at(-1)!.stableId,lastLocator:s.metadata.records.at(-1)!.initialLocator,method:'explicit'};
    expect(nodeTags(s).get('20')?.sources).toHaveLength(2);
    s.metadata.records.find(r=>r.stableId===idC)!.tags=[];expect(nodeTags(s).get('20')?.inherited).toEqual(['azure','nested']);
    s.favorites[0].ancestorIds=['0','1','11','101'];expect(nodeTags(s).get('20')?.sources).toHaveLength(1);
  });
});
describe('controlled metadata setup', () => {
  it('exports a bounded inventory, resets only metadata, invalidates another device, and rejects stale drafts', async () => {
    const { service, sync, local, bookmarks } = setup(true); local.data['ui:appearance']='dark'; local.data['ui:show-archived']=true; local.data['ui:auto-scroll-peek']=false;
    const s = await service.snapshot('before'); const native = structuredClone(bookmarks.data);
    const backup = await prepareMetadataReset(sync, local); expect(backup.affectedSyncKeys).toContain(`meta:${idA}`); expect(backup.local.state).toBeDefined();
    const b = new MemoryStorage(); b.data = structuredClone(local.data); b.data.metadataJournal={schemaVersion:1,entries:{}};
    await resetMetadata(sync, local, backup.expected);
    expect(Object.keys(sync.data)).toEqual([SETUP_KEY]); expect(local.data['ui:appearance']).toBe('dark'); expect(local.data['ui:show-archived']).toBe(true); expect(local.data['ui:auto-scroll-peek']).toBe(false);
    const bs = await alignMetadataEpoch(sync,b);expect(bs.mappings).toEqual({});expect(bs.pendingDeletions).toEqual([]);expect(bs.rootId).toBe('1');expect(b.data.metadataJournal).toBeUndefined();
    await expect(service.command({type:'edit',id:'20',expected:editToken(s.favorites[0],s.metadata.records[0].tags),input:{title:'Old cached draft',url:s.favorites[0].url,parentId:'10',tags:['old']}})).rejects.toThrow('reset');
    expect(bookmarks.data).toEqual(native);expect(bookmarks.calls).toEqual([]);
    const ready=await service.snapshot('after');expect(ready.metadata.records).toEqual([]);expect(parseMetadata(sync.data).invalid).toEqual([]);
  });
  it('blocks changed exports and pauses writes during an interrupted reset', async () => {
    const { sync, local, service } = setup(true); const backup = await prepareMetadataReset(sync, local); sync.data[`meta:${idA}`]={...sync.data[`meta:${idA}`] as object,tags:['changed']};
    await expect(resetMetadata(sync,local,backup.expected)).rejects.toThrow('changed after export');
    sync.data[SETUP_KEY]={generation:idC,phase:'resetting'};await expect(service.snapshot('interrupted')).rejects.toThrow('in progress');
  });
});

describe('older-client record protection', () => {
  it('v1 readers quarantine v2 records and cannot read a journal containing them', async () => {
    const legacy = await import('./legacy-v1-schema');
    const { service, sync, local } = setup(); await service.command({ type: 'set-root', rootId: '*' });
    await folderSave(service, '10', ['tag']);
    const raw=structuredClone(sync.data), parsed=legacy.parseMetadata(raw);
    expect(parsed.records).toEqual([]); expect(parsed.invalid).toHaveLength(1); expect(parsed.raw).toEqual(raw);
    expect(()=>legacy.parseJournal(local.data.metadataJournal)).toThrow('Invalid preserved');
    const backup=await prepareMetadataReset(sync,local);await resetMetadata(sync,local,backup.expected);
    expect(legacy.parseMetadata(sync.data).invalid[0]).toContain('unknown storage key');
    expect(parseMetadata(sync.data).invalid).toEqual([]);
  });
});

describe('reset arrival ordering', () => {
  it('never reattaches late old-generation metadata and refuses its republication', async () => {
    const { sync,local,service,repository }=setup(true);const old=structuredClone(sync.data);const backup=await prepareMetadataReset(sync,local);await resetMetadata(sync,local,backup.expected);
    Object.assign(sync.data,old);const s=await service.snapshot('late old metadata');expect(s.metadata.records).toEqual([]);expect(s.reconciliation.mappings).toEqual({});expect(s.metadata.ignored).toContain(`meta:${idA}`);
    await expect(repository.write(old)).resolves.toBeUndefined(); // identical values require no write
    await expect(repository.write({[`meta:${idA}`]:{...old[`meta:${idA}`] as object,tags:['resurrect']}})).rejects.toThrow('generation');
    const current=await service.command({type:'edit',generation:s.metadata.setup!.generation,id:'20',expected:editToken(s.favorites[0],[]),input:{title:s.favorites[0].title,url:s.favorites[0].url,parentId:'10',tags:['fresh']}});
    expect(current.metadata.records[0].generation).toBe(s.metadata.setup!.generation);expect(current.metadata.records[0].tags).toEqual(['fresh']);
  });
});
