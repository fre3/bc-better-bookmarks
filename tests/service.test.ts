import { describe, expect, it } from 'vitest';
import { BrowserMetadataRepository, checkQuota, type StorageArea } from '../src/browser/metadata';
import type { BookmarksRepository } from '../src/browser/bookmarks';
import type { FavoriteNode } from '../src/core/model';
import { DashboardService } from '../src/core/service';
import { confirmLinkInput, editToken } from '../src/core/logic';
import { diagnosticExport } from '../src/core/export';
import { idA, mapping, metadata, tree } from './fixtures';
class MemoryStorage implements StorageArea {
  data: Record<string, unknown> = {};
  writes = 0;
  fail = false;
  async get(keys?: string | string[] | null) {
    return structuredClone(typeof keys === 'string' ? { [keys]: this.data[keys] } : this.data);
  }
  async set(items: Record<string, unknown>) { if (this.fail) throw new Error('quota failure'); this.writes++; Object.assign(this.data, structuredClone(items)); }
  async getBytesInUse() { return JSON.stringify(this.data).length; }
}
class MemoryBookmarks implements BookmarksRepository {
  data = tree();
  calls: string[] = [];
  seq = 100;
  all(): FavoriteNode[] { const walk = (nodes: FavoriteNode[]): FavoriteNode[] => nodes.flatMap(n => [n, ...walk(n.children ?? [])]); return walk(this.data); }
  async getTree() { return structuredClone(this.data); }
  async create(input: { parentId: string; title: string; url?: string }) {
    this.calls.push('create'); const node = { ...input, id: String(++this.seq), dateAdded: this.seq, children: input.url ? undefined : [] };
    this.all().find(n => n.id === input.parentId)!.children!.push(node); return node;
  }
  async update(id: string, changes: { title?: string; url?: string }) { this.calls.push('update'); Object.assign(this.all().find(n => n.id === id)!, changes); }
  async move(id: string, parentId: string) {
    this.calls.push('move'); const node = this.all().find(n => n.id === id)!;
    const oldParent = this.all().find(n => n.id === node.parentId)!;
    oldParent.children = oldParent.children!.filter(n => n.id !== id);
    node.parentId = parentId; this.all().find(n => n.id === parentId)!.children!.push(node);
  }
  async removeLink(id: string) { this.calls.push('delete'); const node = this.all().find(n => n.id === id)!; const p = this.all().find(n => n.id === node.parentId)!; p.children = p.children!.filter(n => n.id !== id); }
}
function setup(withMetadata = false) {
  const sync = new MemoryStorage(); const local = new MemoryStorage(); const bookmarks = new MemoryBookmarks();
  if (withMetadata) { sync.data = metadata().raw; local.data.state = { schemaVersion: 1, mappings: mapping(), rootId: '1', pendingDeletions: [] }; }
  const repository = new BrowserMetadataRepository(sync, local);
  const service = new DashboardService(bookmarks, repository, { extensionId: 'test', version: '0.1' }, () => idA);
  return { sync, local, bookmarks, repository, service };
}
describe('repository', () => {
  it('compares before writing and leaves other records intact', async () => {
    const { sync, repository } = setup(true);
    await repository.write(metadata().raw); expect(sync.writes).toBe(0);
    await repository.write({ another: 'value' }); expect(sync.writes).toBe(1); expect(sync.data[`meta:${idA}`]).toBeDefined();
  });
  it('checks byte and key limits before writing', () => {
    expect(() => checkQuota({}, { long: 'x'.repeat(8192) })).toThrow('item too large');
    expect(() => checkQuota(Object.fromEntries(Array.from({ length: 512 }, (_, i) => [`${i}`, 1])), { extra: 1 })).toThrow('item quota');
    expect(() => checkQuota({}, Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`${i}`, 'x'.repeat(6000)])))).toThrow('total byte');
  });
});
describe('application service', () => {
  it('requires confirmation for bookmarklet create/edit before Favorite mutation and preserves code', async () => {
    const { service, bookmarks, sync } = setup();
    let s = await service.command({ type: 'set-root', rootId: '1' });
    const code = "javascript:(() => {\n alert('%20 ? # &');\n})();  ";
    const input = { title: 'Tool', url: code, parentId: '10', tags: [] };
    await expect(service.command({ type: 'create', input })).rejects.toThrow('confirmation');
    const f = s.favorites[0];
    await expect(service.command({ type: 'edit', id: f.id, expected: editToken(f, []), input })).rejects.toThrow('confirmation');
    expect(bookmarks.calls).toEqual([]);
    expect(confirmLinkInput(input, () => false)).toBeUndefined();
    s = await service.command({ type: 'create', input: confirmLinkInput(input, () => true)! });
    expect(s.favorites.find(f => f.id === '101')).toMatchObject({ url: code, systemLabels: ['JS'] });
    s = await service.command({ type: 'edit', id: f.id, expected: editToken(f, []), input: confirmLinkInput(input, () => true)! });
    expect(s.favorites.find(node => node.id === f.id)?.url).toBe(code);
    expect(bookmarks.calls).toEqual(['create', 'update']);
    expect(sync.writes).toBe(0);
    expect(s.metadata.records).toEqual([]);
  });
  it('derives imported/synced bookmarklet labels without identities or sync writes, including URL changes', async () => {
    const { service, bookmarks, sync } = setup();
    await bookmarks.update('20', { url: 'javascript:alert(1)' });
    let s = await service.snapshot('native or synced bookmarklet');
    expect(s.favorites[0].systemLabels).toEqual(['JS']);
    expect(s.local.mappings).toEqual({});
    await service.command({ type: 'set-root', rootId: '1' });
    for (const [url, labels] of [['http://example.com/', ['HTTP']], ['https://example.com/', []]] as const) {
      const f = s.favorites[0];
      s = await service.command({ type: 'edit', id: f.id, expected: editToken(f, []), input: { title: f.title, url, parentId: f.parentId!, tags: [] } });
      expect(s.favorites[0].systemLabels).toEqual(labels);
      expect(s.metadata.records).toEqual([]);
      expect(s.local.mappings).toEqual({});
    }
    expect(sync.data).toEqual({}); expect(sync.writes).toBe(0);
  });
  it('keeps a copied bookmarklet untagged while both show JS and preserves original identity through rename/move', async () => {
    const { service, bookmarks, sync } = setup();
    await service.command({ type: 'set-root', rootId: '1' });
    const input = { title: 'Tool', url: "javascript:alert('test')", parentId: '10', tags: ['owned'] };
    await service.command({ type: 'create', input: confirmLinkInput(input, () => true)! });
    const before = structuredClone(sync.data); const writes = sync.writes;
    const copy = await bookmarks.create({ title: input.title, url: input.url, parentId: input.parentId });
    let s = await service.snapshot('native paste');
    expect(s.favorites.filter(f => f.systemLabels.includes('JS'))).toHaveLength(2);
    expect(s.reconciliation.mappings['101'].stableId).toBe(idA);
    expect(s.reconciliation.mappings[copy.id]).toBeUndefined();
    expect(s.metadata.records).toHaveLength(1); expect(s.metadata.records[0].tags).toEqual(['owned']);
    expect(sync.data).toEqual(before); expect(sync.writes).toBe(writes);
    await bookmarks.update('101', { title: 'Renamed' }); await bookmarks.move('101', '11');
    s = await service.snapshot('native rename/move');
    expect(s.favorites.find(f => f.id === '101')?.systemLabels).toEqual(['JS']);
    expect(s.reconciliation.mappings['101'].stableId).toBe(idA);
    expect(s.reconciliation.mappings[copy.id]).toBeUndefined();
    expect(s.metadata.records[0].tags).toEqual(['owned']);
    expect(sync.data[`meta:${idA}`]).toEqual(before[`meta:${idA}`]);
  });
  it.each(['http://example.com/', 'https://example.com/'])('creates %s without derived-label metadata', async url => {
    const { service, sync } = setup(); await service.command({ type: 'set-root', rootId: '1' });
    const s = await service.command({ type: 'create', input: { title: 'Web', url, parentId: '10', tags: [] } });
    expect(s.favorites.find(f => f.id === '101')?.systemLabels).toEqual(url.startsWith('http:') ? ['HTTP'] : []);
    expect(s.metadata.records).toEqual([]); expect(sync.writes).toBe(0);
  });
  it('starts read only and never mutates Favorites during reconciliation', async () => {
    const { service, bookmarks } = setup();
    await service.snapshot('startup'); await service.snapshot('sync'); expect(bookmarks.calls).toEqual([]);
    await expect(service.command({ type: 'create', input: { title: 'Test', url: 'https://example.com', parentId: '10', tags: [] } })).rejects.toThrow('configured dashboard root');
  });
  it('creates a setup folder and selects it without moving anything', async () => {
    const { service, bookmarks } = setup();
    const s = await service.command({ type: 'create-folder', title: 'Test', parentId: '1' });
    expect(s.local.rootId).toBe('101'); expect(bookmarks.calls).toEqual(['create']);
  });
  it('creates one real Favorite and one metadata identity, and can edit/move it', async () => {
    const { service, bookmarks } = setup(); await service.command({ type: 'set-root', rootId: '1' });
    let s = await service.command({ type: 'create', input: { title: 'Example', url: 'https://example.com', parentId: '10', tags: ['Azure', ' azure '] } });
    expect(s.metadata.records).toHaveLength(1); expect(s.metadata.records[0].tags).toEqual(['azure']);
    const f = s.favorites.find(f => f.id === '101')!;
    s = await service.command({ type: 'edit', id: f.id, expected: editToken(f, ['azure']), input: { title: 'New name', url: 'https://example.com/edited', parentId: '11', tags: ['important'] } });
    expect(bookmarks.calls).toEqual(['create', 'update', 'move']); expect(s.metadata.records).toHaveLength(1);
    expect(s.metadata.records[0].tags).toEqual(['important']); expect(s.reconciliation.mappings[f.id].stableId).toBe(idA);
    expect(s.metadata.histories[idA].locators).toHaveLength(2);
  });
  it('protects against stale tabs and out-of-scope moves', async () => {
    const { service, bookmarks } = setup(true);
    const s = await service.snapshot('test'); const f = s.favorites[0];
    await expect(service.command({ type: 'delete', id: f.id, expected: 'stale' })).rejects.toThrow('changed');
    await service.command({ type: 'set-root', rootId: '10' });
    await expect(service.command({ type: 'edit', id: f.id, expected: editToken(f, ['azure', 'development']), input: { title: f.title, url: f.url, parentId: '11', tags: [] } })).rejects.toThrow('configured dashboard root');
    expect(bookmarks.calls).toEqual([]);
  });
  it('does not lose a pending locator publication after a storage failure', async () => {
    const { service, sync, bookmarks, repository } = setup(true);
    await bookmarks.update('20', { title: 'Changed externally' }); sync.fail = true;
    const failed = await service.snapshot('bookmarks.changed'); expect(failed.errors.length).toBeGreaterThan(0);
    expect((await repository.readLocal()).mappings['20'].lastLocator.title).toBe('Azure');
    sync.fail = false; await service.snapshot('retry'); const writes = sync.writes;
    await service.snapshot('idempotence'); expect(sync.writes).toBe(writes);
    expect((await repository.readLocal()).mappings['20'].lastLocator.title).toBe('Changed externally');
  });
  it('persists pending deletion before quota failure and retries without touching Favorites', async () => {
    const { service, sync, repository, bookmarks } = setup(true);
    await bookmarks.removeLink('20'); sync.fail = true;
    await service.removed(['20']); expect((await repository.readLocal()).pendingDeletions).toEqual([idA]);
    sync.fail = false; const s = await service.snapshot('retry');
    expect(s.metadata.tombstones[idA]).toBeDefined(); expect(s.local.pendingDeletions).toEqual([]); expect(bookmarks.calls).toEqual(['delete']);
  });
  it('reports partial create accurately without automatically creating a duplicate or rolling back', async () => {
    const { service, sync, bookmarks } = setup(); await service.command({ type: 'set-root', rootId: '10' }); sync.fail = true;
    await expect(service.command({ type: 'create', input: { title: 'Test', url: 'https://example.com', parentId: '10', tags: ['tag'] } })).rejects.toThrow('was CREATED');
    expect(bookmarks.calls).toEqual(['create']); expect(bookmarks.all().filter(n => n.url)).toHaveLength(2);
  });
  it('tag changes from another device do not cause sync writes or duplicate Favorites', async () => {
    const { service, sync, bookmarks } = setup(true);
    await service.snapshot('initial'); const before = sync.writes;
    const rec = sync.data[`meta:${idA}`] as { tags: string[] }; rec.tags = ['remote'];
    const s = await service.snapshot('storage.sync.changed'); expect(s.metadata.records[0].tags).toEqual(['remote']);
    expect(sync.writes).toBe(before); expect(bookmarks.calls).toEqual([]);
  });
  it('exports selected hierarchy and allowlisted diagnostics with URL secrets removed', async () => {
    const { service, bookmarks } = setup(true);
    await bookmarks.update('20', { url: 'https://user:secret@example.com/?token=secret&ordinary=ok' });
    const s = await service.command({ type: 'set-root', rootId: '10' });
    const exported = diagnosticExport(s); const json = JSON.stringify(exported);
    expect(json).not.toContain('user:secret'); expect(json).not.toContain('token=secret'); expect(json).toContain('ordinary=ok');
    expect(exported).toHaveProperty('dashboardTree.0.id', '10'); expect(json).not.toContain('dateLastUsed');
  });
});

describe('two profile simulation (not Microsoft transport validation)', () => {
  it.each(['metadata-first', 'favorite-first'])('converges for %s and preserves the same UUID on tag round trip', async order => {
    const a = setup(); const b = setup();
    await a.service.command({ type: 'set-root', rootId: '1' });
    const created = await a.service.command({ type: 'create', input: { title: 'Sync Test', url: 'https://example.com/sync-test', parentId: '10', tags: ['development', 'azure', 'important'] } });
    const copyFavorites = () => {
      b.bookmarks.data = structuredClone(a.bookmarks.data);
      for (const node of b.bookmarks.all()) { node.id = `b-${node.id}`; if (node.parentId) node.parentId = `b-${node.parentId}`; }
    };
    if (order === 'metadata-first') {
      b.sync.data = structuredClone(a.sync.data);
      const first = await b.service.snapshot('metadata first'); expect(first.reconciliation.matches[0].status).toBe('unresolved');
      copyFavorites();
    } else {
      copyFavorites();
      const first = await b.service.snapshot('Favorite first'); expect(first.reconciliation.matches).toEqual([]);
      b.sync.data = structuredClone(a.sync.data);
    }
    let received = await b.service.command({ type: 'set-root', rootId: 'b-1' });
    const f = received.favorites.find(f => f.id === 'b-101')!;
    expect(received.reconciliation.mappings[f.id].stableId).toBe(created.metadata.records[0].stableId);
    expect(received.local.mappings[f.id].method).toBe('exact-locator');
    received = await b.service.command({ type: 'edit', id: f.id, expected: editToken(f, ['azure', 'development', 'important']), input: { title: f.title, url: f.url, parentId: f.parentId!, tags: ['azure', 'from-b'] } });
    a.sync.data = structuredClone(b.sync.data);
    const returned = await a.service.snapshot('metadata returned');
    expect(returned.metadata.records).toHaveLength(1); expect(returned.metadata.records[0].tags).toEqual(['azure', 'from-b']);
    expect(returned.reconciliation.mappings['101'].stableId).toBe(idA);
    expect(received.metadata.records).toHaveLength(1); expect(b.bookmarks.calls).toEqual([]); expect(a.bookmarks.calls).toEqual(['create']);
  });
  it('preserves unsupported deletion records even with pending local deletion', async () => {
    const { service, sync, bookmarks, repository } = setup(true);
    sync.data[`dead:${idA}`] = { schemaVersion: 2, stableId: idA, future: true };
    await bookmarks.removeLink('20');
    const s = await service.removed(['20']);
    expect(s.errors.some(e => e.includes('future-schema'))).toBe(true);
    expect(sync.data[`dead:${idA}`]).toEqual({ schemaVersion: 2, stableId: idA, future: true });
    expect((await repository.readLocal()).pendingDeletions).toEqual([idA]);
  });
  it('keeps tag records independent from external rename publication', async () => {
    const { service, sync, bookmarks } = setup(true);
    (sync.data[`meta:${idA}`] as { tags: string[] }).tags = ['remote-tag'];
    await bookmarks.update('20', { title: 'Remote rename' });
    const s = await service.snapshot('two independent changes');
    expect(s.metadata.records[0].tags).toEqual(['remote-tag']); expect(s.metadata.histories[idA].locators).toHaveLength(2);
  });
});
