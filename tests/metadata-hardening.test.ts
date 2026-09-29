import { describe, expect, it, vi } from 'vitest';
import { BrowserMetadataRepository, JOURNAL_KEY, type StorageArea } from '../src/browser/metadata';
import type { BookmarksRepository } from '../src/browser/bookmarks';
import { DashboardService } from '../src/core/service';
import { metadataHealth, storageChangeLogs } from '../src/core/metadata-diagnostics';
import { editToken } from '../src/core/logic';
import { parseLocal, parseMetadata } from '../src/core/schema';
import { reconcile } from '../src/core/reconcile';
import { diagnosticExport } from '../src/core/export';
import { favorite, idA, idB, mapping, metadata, record, tree } from './fixtures';

class MemoryArea implements StorageArea {
  data: Record<string, unknown> = {};
  writes: Record<string, unknown>[] = [];
  failKey = '';
  onSet?: (items: Record<string, unknown>) => void;
  async get(key?: string | string[] | null) { return structuredClone(typeof key === 'string' ? { [key]: this.data[key] } : this.data); }
  async set(items: Record<string, unknown>) {
    if (Object.hasOwn(items, this.failKey)) throw new Error('simulated quota failure');
    this.onSet?.(items);
    this.writes.push(structuredClone(items)); Object.assign(this.data, structuredClone(items));
  }
  async getBytesInUse() { return JSON.stringify(this.data).length; }
}
function setup(known = true) {
  const sync = new MemoryArea(), local = new MemoryArea(), data = tree();
  const repository = new BrowserMetadataRepository(sync, local);
  const node = data[0].children![0].children![0].children![0];
  const bookmarks: BookmarksRepository = {
    getTree: vi.fn(async () => structuredClone(data)),
    create: vi.fn(async input => { const f = { ...input, id: 'new', dateAdded: 2 }; data[0].children![0].children![0].children!.push(f); return f; }),
    update: vi.fn(async (_id, changes) => { Object.assign(node, changes); }),
    move: vi.fn(async () => undefined), removeLink: vi.fn(async () => undefined),
  };
  local.data.state = { schemaVersion: 1, mappings: known ? mapping() : {}, rootId: '1', pendingDeletions: [] };
  if (known) sync.data = metadata().raw;
  const uuid = vi.fn(() => idB);
  const service = new DashboardService(bookmarks, repository, { extensionId: 'test', version: 'test' }, uuid);
  return { sync, local, repository, bookmarks, uuid, service };
}

describe('content-free key-level diagnostics', () => {
  it.each([
    ['meta', undefined, record(), 'added'], ['meta', record(), { ...record(), tags: ['private'] }, 'updated'],
    ['meta', record(), undefined, 'removed'],
    ['loc', undefined, { schemaVersion: 1, stableId: idA, locators: [favorite().locator] }, 'added'],
    ['dead', undefined, { schemaVersion: 1, stableId: idA, deletedAt: '2026-09-28T08:59:00Z' }, 'added'],
  ])('classifies %s %s → %s as %s', (kind, oldValue, newValue, operation) => {
    const [log] = storageChangeLogs({ [`${kind}:${idA}`]: { oldValue, newValue } }, 'receipt-time');
    expect(log.time).toBe('receipt-time');
    expect(log.message).toContain(`key=${kind}:${idA}`);
    expect(log.message).toContain(`type=${kind}`);
    expect(log.message).toContain(`stableId=${idA}`);
    expect(log.message).toContain(`operation=${operation}`);
    expect(log.message).toContain(`oldPresent=${oldValue !== undefined}`);
    expect(log.message).toContain(`newPresent=${newValue !== undefined}`);
    expect(log.message).toContain(newValue === undefined ? 'new=absent' : 'new=valid');
    for (const content of ['Azure', 'azure.com', 'Dashboard', 'development', 'private']) expect(log.message).not.toContain(content);
  });
  it('reports invalid records without values and redacts unknown keys', () => {
    const logs = storageChangeLogs({ [`meta:${idA}`]: { newValue: { private: 'SECRET' } }, 'meta:private-title': { newValue: 'SECRET' }, 'private-url': { newValue: 'SECRET' } }, 'now');
    expect(logs[0].message).toContain('new=invalid/quarantined');
    expect(JSON.stringify(logs)).not.toMatch(/SECRET|private-title|private-url/);
    expect(logs[2].message).toContain('type=other');
  });
  it('logs payloads durably, remains bounded, and never republishes missing metadata', async () => {
    const { service, sync, repository, local, bookmarks } = setup();
    delete sync.data[`meta:${idA}`];
    const logs = storageChangeLogs({ [`meta:${idA}`]: { oldValue: record() } }, '2026-09-28T08:59:00Z');
    let s = await service.syncChanged(logs);
    expect(s.logs).toContainEqual(logs[0]); expect(s.metadataHealth[idA].status).toBe('missing');
    const restart = new DashboardService(bookmarks, new BrowserMetadataRepository(sync, local), { extensionId: 'test', version: 'test' });
    s = await restart.snapshot('restart'); expect(s.logs).toContainEqual(logs[0]);
    for (let i = 0; i < 35; i++) await service.syncChanged(logs);
    expect((await repository.readLogs()).length).toBeLessThanOrEqual(60);
    expect(sync.writes).toEqual([]); expect(sync.data).toEqual({});
  });
});

describe('durable local metadata preservation', () => {
  it('preserves new tags before sync publication, and updates only the edited UUID', async () => {
    const { service, sync, local, repository } = setup(false);
    sync.onSet = patch => {
      const journal = local.data[JOURNAL_KEY] as { entries: Record<string, { metadata: unknown }> };
      for (const [key, value] of Object.entries(patch)) if (key.startsWith('meta:')) expect(journal.entries[key.slice(5)].metadata).toEqual(value);
    };
    await repository.write({ [`meta:${idA}`]: record() });
    const previous = (await repository.readJournal()).entries[idA];
    let s = await service.command({ type: 'create', input: { title: 'Other', url: 'https://other.example/', parentId: '10', tags: ['first'] } });
    expect((await repository.readJournal()).entries[idB].metadata.tags).toEqual(['first']);
    // Use the existing mapped fixture for a normal metadata edit.
    const f = s.favorites.find(f => f.id === '20')!;
    s = await service.command({ type: 'edit', id: f.id, expected: editToken(f, ['azure', 'development']), input: { title: f.title, url: f.url, parentId: f.parentId!, tags: ['edited'] } });
    const journal = await repository.readJournal();
    expect(journal.entries[idA].metadata.tags).toEqual(['edited']);
    expect(journal.entries[idA].metadata.initialLocator).toEqual(previous.metadata.initialLocator);
    expect(journal.entries[idB].metadata.tags).toEqual(['first']);
    expect(s.metadata.records).toHaveLength(2);
    const restarted = new BrowserMetadataRepository(sync, local);
    expect(await restarted.readJournal()).toEqual(journal);
    const exported = diagnosticExport(s);
    expect(exported).toHaveProperty('preservation.stableIds');
    expect(exported).not.toHaveProperty('metadataJournal');
  });
  it('stops sync publication if local preservation fails', async () => {
    const { repository, local, sync } = setup(false); local.failKey = JOURNAL_KEY;
    await expect(repository.write({ [`meta:${idA}`]: record() })).rejects.toThrow('preservation failed');
    expect(sync.writes).toEqual([]); expect(sync.data).toEqual({});
  });
  it('retains intended metadata after sync failure and does not replay it on restart', async () => {
    const { repository, local, sync, bookmarks } = setup(false); sync.failKey = `meta:${idA}`;
    await expect(repository.write({ [`meta:${idA}`]: record() })).rejects.toThrow('quota');
    expect((await repository.readJournal()).entries[idA].metadata).toEqual(record());
    sync.failKey = '';
    const restart = new DashboardService(bookmarks, new BrowserMetadataRepository(sync, local), { extensionId: 'test', version: 'test' });
    await restart.snapshot('restart'); await restart.syncChanged([]);
    expect(sync.data).toEqual({}); expect(sync.writes).toEqual([]);
  });
  it('retains first-assignment identity alongside the journal when publication fails, never allocating a replacement', async () => {
    const { service, repository, sync, local, bookmarks, uuid } = setup(false);
    sync.failKey = `meta:${idB}`;
    await expect(service.command({ type: 'create', input: { title: 'New', url: 'https://new.example/', parentId: '10', tags: ['intent'] } })).rejects.toThrow('was CREATED');
    expect((await repository.readJournal()).entries[idB].metadata.tags).toEqual(['intent']);
    expect((await repository.readLocal()).mappings.new.stableId).toBe(idB);
    expect(uuid).toHaveBeenCalledTimes(1);
    sync.failKey = '';
    const restart = new DashboardService(bookmarks, new BrowserMetadataRepository(sync, local), { extensionId: 'test', version: 'test' }, uuid);
    const s = await restart.snapshot('restart'); const f = s.favorites.find(f => f.id === 'new')!;
    expect(s.metadataHealth[idB]).toEqual({ status: 'missing', rawMeta: 'absent', preservedLocally: true });
    await expect(restart.command({ type: 'edit', id: f.id, expected: editToken(f, []), input: { title: f.title, url: f.url, parentId: '10', tags: ['retry'] } })).rejects.toThrow('missing synchronized metadata');
    expect(uuid).toHaveBeenCalledTimes(1); expect(sync.data).toEqual({}); expect(bookmarks.create).toHaveBeenCalledTimes(1);
  });
  it.each([{ entries: 1, bytes: 100000 }, { entries: 512, bytes: 1 }])('refuses capacity overflow without eviction: %j', async limits => {
    const { repository, local, sync } = setup();
    await repository.write({ [`meta:${idA}`]: { ...record(), tags: ['preserve-me'] } });
    const before = structuredClone(local.data[JOURNAL_KEY]); const writes = sync.writes.length;
    const limited = new BrowserMetadataRepository(sync, local, limits);
    await expect(limited.write({ [`meta:${idB}`]: record(favorite(), idB) })).rejects.toThrow('capacity');
    expect(local.data[JOURNAL_KEY]).toEqual(before); expect(sync.writes).toHaveLength(writes);
  });
  it('refuses unknown journal schema without changing stored data', async () => {
    const { repository, sync, local } = setup(false);
    local.data[JOURNAL_KEY] = { schemaVersion: 2, future: true };
    await expect(repository.write({ [`meta:${idA}`]: record() })).rejects.toThrow('unsupported');
    expect(local.data[JOURNAL_KEY]).toEqual({ schemaVersion: 2, future: true }); expect(sync.writes).toEqual([]);
  });
});

describe('identity health and edit preflight', () => {
  it.each(['missing', 'quarantined', 'deleted', 'ambiguous', 'journal-invalid'] as const)('rejects %s before all Favorite mutations', async condition => {
    const { service, sync, local, bookmarks, uuid } = setup();
    if (condition === 'missing') delete sync.data[`meta:${idA}`];
    if (condition === 'quarantined') sync.data[`loc:${idA}`] = { schemaVersion: 2, stableId: idA };
    if (condition === 'deleted') sync.data[`dead:${idA}`] = { schemaVersion: 1, stableId: idA, deletedAt: '2026-09-28T00:00:00Z' };
    if (condition === 'ambiguous') sync.data[`meta:${idB}`] = record(favorite(), idB);
    if (condition === 'journal-invalid') local.data[JOURNAL_KEY] = { schemaVersion: 2 };
    const s = await service.snapshot('preflight fixture');
    expect(s.metadataHealth[idA].status).toBe(condition === 'journal-invalid' ? 'valid' : condition);
    expect(s.metadataHealth[idA].rawMeta).toBe(condition === 'missing' ? 'absent' : 'valid');
    const f = s.favorites[0];
    const visibleTags = condition === 'journal-invalid' ? ['azure', 'development'] : [];
    await expect(service.command({ type: 'edit', id: f.id, expected: editToken(f, visibleTags), input: { title: 'New title', url: 'https://new.example/', parentId: '11', tags: ['new-tag'] } })).rejects.toThrow();
    expect(bookmarks.update).not.toHaveBeenCalled(); expect(bookmarks.move).not.toHaveBeenCalled();
    expect(bookmarks.create).not.toHaveBeenCalled(); expect(bookmarks.removeLink).not.toHaveBeenCalled();
    expect(uuid).not.toHaveBeenCalled(); expect(sync.writes).toEqual([]);
    expect((local.data.state as { mappings: ReturnType<typeof mapping> }).mappings['20'].stableId).toBe(idA);
  });
  it('does not silently accept empty tags for an identity with missing metadata', async () => {
    const { service, sync, bookmarks, uuid } = setup(); delete sync.data[`meta:${idA}`];
    const s = await service.snapshot('missing'); const f = s.favorites[0];
    await expect(service.command({ type: 'edit', id: f.id, expected: editToken(f, []), input: { title: 'new', url: f.url, parentId: f.parentId!, tags: [] } })).rejects.toThrow('missing synchronized metadata');
    expect(bookmarks.update).not.toHaveBeenCalled(); expect(uuid).not.toHaveBeenCalled();
  });
  it('reports a present invalid meta key separately from an absent one', () => {
    const state = parseMetadata({ [`meta:${idA}`]: null });
    const local = { ...parseLocal(undefined), mappings: mapping() };
    expect(metadataHealth(state, local, reconcile([favorite()], state, local.mappings), [idA])[idA]).toEqual({ status: 'quarantined', rawMeta: 'invalid', preservedLocally: true });
  });
  it('preserves the same identity through external loss and later arrival without replay', async () => {
    const { service, sync, repository, uuid } = setup();
    await repository.write({ [`meta:${idA}`]: { ...record(), tags: ['authored-here'] } });
    const saved = structuredClone(sync.data[`meta:${idA}`]); delete sync.data[`meta:${idA}`];
    const writes = sync.writes.length;
    let s = await service.syncChanged(storageChangeLogs({ [`meta:${idA}`]: { oldValue: saved } }, 'now'));
    expect(s.metadataHealth[idA]).toEqual({ status: 'missing', rawMeta: 'absent', preservedLocally: true });
    expect(s.local.mappings['20'].stableId).toBe(idA); expect(s.reconciliation.mappings['20']).toBeUndefined();
    sync.data[`meta:${idA}`] = saved;
    s = await service.syncChanged(storageChangeLogs({ [`meta:${idA}`]: { newValue: saved } }, 'later'));
    expect(s.metadataHealth[idA].status).toBe('valid'); expect(s.reconciliation.mappings['20'].stableId).toBe(idA);
    expect(sync.writes).toHaveLength(writes); expect(uuid).not.toHaveBeenCalled();
  });
  it('keeps two UUID writes independent even with a stale read between devices', async () => {
    const sync = new MemoryArea(), localA = new MemoryArea(), localB = new MemoryArea();
    const a = new BrowserMetadataRepository(sync, localA), b = new BrowserMetadataRepository(sync, localB);
    await a.write({ [`meta:${idA}`]: record() });
    const staleA = await a.read();
    await b.write({ [`meta:${idB}`]: record(favorite({ locator: { ...favorite().locator, title: 'Other' } }), idB) });
    await a.write({ [`meta:${idA}`]: { ...staleA.records[0], tags: ['edited'] } });
    expect(Object.keys(sync.data).sort()).toEqual([`meta:${idA}`, `meta:${idB}`]);
    expect(sync.writes.every(patch => Object.keys(patch).length === 1)).toBe(true);
    expect(Object.keys((await a.readJournal()).entries)).toEqual([idA]);
    expect(Object.keys((await b.readJournal()).entries)).toEqual([idB]);
  });
});
