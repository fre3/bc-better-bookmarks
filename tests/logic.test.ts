import { describe, expect, it } from 'vitest';
import { editToken, fingerprint, flattenTree, normalizeTags, safeHref, searchFavorites, validateUrl } from '../src/core/logic';
import { parseLocal, parseMetadata } from '../src/core/schema';
import { reconcile } from '../src/core/reconcile';
import { favorite, idA, idB, mapping, metadata, record, tree } from './fixtures';

describe('tags and search', () => {
  it('trims, NFC-normalizes, folds case, deduplicates, sorts and removes empty tags', () => {
    expect(normalizeTags([' Azure ', 'azure', '', 'Development', 'e\u0301', 'é'])).toEqual(['azure', 'development', 'é']);
  });
  it.each(['AZURE', 'azure.com', 'DASHBOARD', 'important', 'azure IMPORTANT'])('searches every requested field: %s', query => {
    expect(searchFavorites([favorite()], query, () => ['important'])).toHaveLength(1);
  });
  it('requires all query terms and preserves ordering', () => {
    const f = favorite(); expect(searchFavorites([f], 'azure missing', () => [])).toEqual([]);
    expect(searchFavorites([f, { ...f, id: '99' }], ' ', () => []).map(f => f.id)).toEqual(['20', '99']);
  });
  it('refuses executable or credential URLs', () => {
    expect(safeHref('javascript:alert(1)')).toBeUndefined();
    expect(() => validateUrl('https://user:password@example.com/')).toThrow();
    expect(validateUrl(' https://EXAMPLE.com ')).toBe('https://example.com/');
  });
  it('edit token changes with tags, folder, or content', () => {
    expect(editToken(favorite(), ['a'])).not.toBe(editToken(favorite(), ['b']));
    expect(editToken(favorite(), [])).not.toBe(editToken(favorite({ parentId: '11' }), []));
  });
});
describe('tree and identity', () => {
  it('retains hierarchy, IDs and ordering but uses semantic browser root names', () => {
    const { favorites, folders } = flattenTree(tree());
    expect(favorites[0].folderPath).toEqual(['Favorites bar', 'Dashboard']);
    expect(favorites[0].locator.folderPath[0]).toEqual({ kind: 'browser', value: 'bookmarks-bar' });
    expect(folders.find(f => f.id === '1')?.renamable).toBe(false);
    expect(folders.find(f => f.id === '10')?.renamable).toBe(true);
  });
  it('propagates managed status down the hierarchy', () => {
    const t = tree(); t[0].children![0].unmodifiable = 'managed';
    expect(flattenTree(t).favorites[0].unmodifiable).toBe('managed');
    expect(flattenTree(t).folders.some(f => f.writable)).toBe(false);
  });
  it('fingerprints do not depend on local IDs and cannot collide through path delimiters', () => {
    const a = favorite().locator;
    expect(fingerprint(a)).toBe(fingerprint(favorite({ id: '999' }).locator));
    expect(fingerprint({ ...a, folderPath: [{ kind: 'title', value: 'a/b' }] })).not.toBe(fingerprint({ ...a, folderPath: [{ kind: 'title', value: 'a' }, { kind: 'title', value: 'b' }] }));
    expect(fingerprint({ ...a, url: `${a.url}?x=1` })).not.toBe(fingerprint(a));
  });
});
describe('reconciliation', () => {
  it('matches across different device-local IDs by exact locator', () => {
    const r = reconcile([favorite({ id: '999' })], metadata(), {});
    expect(r.matches[0]).toMatchObject({ status: 'exact-locator', bookmarkId: '999' });
    expect(r.mappings['999'].stableId).toBe(idA);
    expect(r.historyWrites).toEqual({});
  });
  it.each(['title', 'url', 'folderPath'] as const)('preserves a local identity when %s changes and publishes its history', field => {
    const f = favorite();
    const locator = { ...f.locator, [field]: field === 'folderPath' ? [{ kind: 'title' as const, value: 'Moved' }] : 'changed' };
    const changed = { ...f, locator };
    const r = reconcile([changed], metadata(), mapping());
    expect(r.matches[0].status).toBe('local-mapping');
    const history = r.historyWrites[`loc:${idA}`]; expect(history.locators).toHaveLength(2);
    const received = parseMetadata({ ...metadata().raw, [`loc:${idA}`]: history });
    expect(reconcile([{ ...changed, id: 'remote' }], received, {}).matches[0].status).toBe('exact-locator');
    expect(reconcile([changed], received, r.mappings).historyWrites).toEqual({});
  });
  it('folder rename updates every descendant locator using known mappings', () => {
    const t = tree(); t[0].children![0].children![0].title = 'Renamed';
    const r = reconcile(flattenTree(t).favorites, metadata(), mapping());
    expect(r.historyWrites[`loc:${idA}`].locators.some(l => l.folderPath.at(-1)?.value === 'Renamed')).toBe(true);
  });
  it('does not guess URL-only matches for a new device after an unknown move', () => {
    const f = favorite(); f.locator = { ...f.locator, folderPath: [] };
    expect(reconcile([f], metadata(), {}).matches[0].status).toBe('unresolved');
  });
  it('distinguishes the same URL in different folders', () => {
    const other = favorite({ id: '21', locator: { ...favorite().locator, folderPath: [{ kind: 'title', value: 'Elsewhere' }] } });
    expect(reconcile([other, favorite()], metadata(), {}).matches[0].bookmarkId).toBe('20');
  });
  it('never assigns identical duplicates arbitrarily', () => {
    const favorites = [favorite(), favorite({ id: '21' })];
    for (const list of [favorites, [...favorites].reverse()]) {
      const r = reconcile(list, metadata(), {});
      expect(r.matches[0].status).toBe('ambiguous'); expect(r.mappings).toEqual({});
    }
  });
  it('preserves an explicitly known duplicate locally without using that mapping remotely', () => {
    const favorites = [favorite(), favorite({ id: '21' })];
    expect(reconcile(favorites, metadata(), mapping()).matches[0].bookmarkId).toBe('20');
    expect(reconcile(favorites, metadata(), {}).matches[0].status).toBe('ambiguous');
  });
  it('surfaces competing UUIDs instead of merging or hiding conflicts behind an old mapping', () => {
    const m = metadata([record(), record(favorite(), idB)]);
    for (const records of [m.records, [...m.records].reverse()]) {
      const r = reconcile([favorite()], { ...m, records }, mapping());
      expect(r.matches.map(m => m.status)).toEqual(['ambiguous', 'ambiguous']); expect(r.mappings).toEqual({});
    }
  });
  it('converges with either arrival order; ordinary reloads are idempotent', () => {
    expect(reconcile([], metadata(), {}).matches[0].status).toBe('unresolved');
    expect(reconcile([favorite()], metadata([]), {}).mappings).toEqual({});
    const a = reconcile([favorite()], metadata(), {});
    const b = reconcile([favorite()], metadata(), a.mappings);
    expect(b.mappings).toEqual(a.mappings); expect(b.historyWrites).toEqual({});
  });
  it('retains orphaned metadata as unresolved and does not manufacture deletion', () => {
    const r = reconcile([], metadata(), mapping()); expect(r.matches[0].status).toBe('unresolved'); expect(r.historyWrites).toEqual({});
  });
  it('does not resurrect tags after a confirmed deletion or while deletion is pending', () => {
    const m = parseMetadata({ ...metadata().raw, [`dead:${idA}`]: { schemaVersion: 1, stableId: idA, deletedAt: '2026-09-24T12:00:00Z' } });
    expect(reconcile([favorite({ id: '999' })], m, {}).matches[0].status).toBe('deleted');
    expect(reconcile([favorite()], metadata(), mapping(), [idA]).mappings).toEqual({});
  });
  it('does not trust a reused local ID with a different creation timestamp', () => {
    expect(reconcile([favorite({ dateAdded: 999 })], metadata(), mapping()).matches[0].status).toBe('ambiguous');
  });
  it('does not write stale locators in response to newer remote history', () => {
    const f = favorite();
    const m = parseMetadata({ ...metadata().raw, [`loc:${idA}`]: { schemaVersion: 1, stableId: idA, locators: [f.locator, { ...f.locator, title: 'Remote renamed' }] } });
    expect(reconcile([f], m, mapping()).historyWrites).toEqual({});
  });
  it('supports historical matches when metadata arrives before the Favorite update', () => {
    const f = favorite(); const changed = { ...f, locator: { ...f.locator, title: 'New' } };
    const history = reconcile([changed], metadata(), mapping()).historyWrites;
    const m = parseMetadata({ ...metadata().raw, ...history });
    expect(reconcile([f], m, {}).matches[0].status).toBe('exact-locator');
    expect(reconcile([changed], m, {}).matches[0].status).toBe('exact-locator');
  });
  it('stops rather than discarding old identity evidence at the history cap', () => {
    const f = favorite();
    const m = parseMetadata({ ...metadata().raw, [`loc:${idA}`]: { schemaVersion: 1, stableId: idA, locators: Array.from({ length: 12 }, (_, i) => ({ ...f.locator, title: `history ${i}` })) } });
    const r = reconcile([{ ...f, locator: { ...f.locator, title: 'changed' } }], m, mapping());
    expect(r.historyWrites).toEqual({}); expect(r.warnings).toHaveLength(1); expect(r.mappings[f.id].lastLocator).toEqual(f.locator);
  });
});
describe('schemas', () => {
  it('quarantines future/invalid records and preserves raw data', () => {
    const raw = { [`meta:${idA}`]: { ...record(), schemaVersion: 99 } };
    const state = parseMetadata(raw); expect(state.invalid).toHaveLength(1); expect(state.records).toEqual([]); expect(state.raw).toEqual(raw);
  });
  it('a future tombstone blocks matching rather than reviving old data', () => {
    const m = parseMetadata({ ...metadata().raw, [`dead:${idA}`]: { schemaVersion: 2, stableId: idA } });
    expect(m.records).toEqual([]); expect(m.invalid).toHaveLength(1);
  });
  it('validates record identity and locator shape', () => {
    expect(parseMetadata({ [`meta:${idB}`]: record() }).records).toEqual([]);
    expect(parseMetadata({ [`meta:${idA}`]: { ...record(), initialLocator: { url: 1 } } }).records).toEqual([]);
  });
  it('does not migrate unsupported local state', () => {
    expect(parseLocal(undefined).rootId).toBeNull();
    expect(() => parseLocal({ schemaVersion: 2 })).toThrow('Unsupported local schema');
  });
});
