import type { LocalMapping, LocalState, Locator, MetadataJournal, MetadataState } from './model';
import { normalizeTags } from './logic';
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const object = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
export function isLocator(v: unknown): v is Locator {
  return object(v) && typeof v.url === 'string' && typeof v.title === 'string' && Array.isArray(v.folderPath) && v.folderPath.every(p => object(p) && ['title', 'browser'].includes(String(p.kind)) && typeof p.value === 'string');
}
function cleanLocator(value: Locator): Locator {
  return { url: value.url, title: value.title, folderPath: value.folderPath.map(p => ({ kind: p.kind, value: p.value })) };
}
const time = (v: unknown): v is string => typeof v === 'string' && Number.isFinite(Date.parse(v));
export function parseMetadata(raw: Record<string, unknown>): MetadataState {
  const state: MetadataState = { records: [], histories: {}, tombstones: {}, invalid: [], raw };
  const blocked = new Set<string>();
  for (const [key, value] of Object.entries(raw)) {
    const [kind, id] = key.split(':');
    if (!['meta', 'loc', 'dead'].includes(kind)) { state.invalid.push(`${key}: unknown storage key (preserved)`); continue; }
    const base = object(value) && value.schemaVersion === 1 && value.stableId === id && UUID.test(id) && key === `${kind}:${id}`;
    if (base && kind === 'meta' && Array.isArray(value.tags) && value.tags.every(t => typeof t === 'string') && isLocator(value.initialLocator) && time(value.updatedAt)) {
      state.records.push({ schemaVersion: 1, stableId: id, tags: normalizeTags(value.tags as string[]), initialLocator: cleanLocator(value.initialLocator), updatedAt: value.updatedAt });
    } else if (base && kind === 'loc' && Array.isArray(value.locators) && value.locators.length <= 12 && value.locators.every(isLocator)) {
      state.histories[id] = { schemaVersion: 1, stableId: id, locators: value.locators.map(cleanLocator) };
    } else if (base && kind === 'dead' && time(value.deletedAt)) {
      state.tombstones[id] = { schemaVersion: 1, stableId: id, deletedAt: value.deletedAt };
    } else {
      state.invalid.push(`${key}: invalid or unsupported schema (preserved)`);
      blocked.add(id);
    }
  }
  // A future-schema tombstone must not allow an older client to attach the record.
  state.records = state.records.filter(r => !blocked.has(r.stableId));
  return state;
}
export function parseLocal(raw: unknown): LocalState {
  if (raw === undefined) return { schemaVersion: 1, mappings: {}, rootId: null, pendingDeletions: [] };
  if (!object(raw) || raw.schemaVersion !== 1 || !object(raw.mappings) || !(raw.rootId === null || typeof raw.rootId === 'string') || !Array.isArray(raw.pendingDeletions) || !raw.pendingDeletions.every(x => typeof x === 'string' && UUID.test(x))) throw new Error('Unsupported local schema. Export data before any manual recovery; no migration was performed.');
  for (const mapping of Object.values(raw.mappings)) {
    if (!object(mapping) || typeof mapping.stableId !== 'string' || !UUID.test(mapping.stableId) || !isLocator(mapping.lastLocator) || !['explicit', 'exact-locator'].includes(String(mapping.method)) || !(mapping.dateAdded === undefined || typeof mapping.dateAdded === 'number')) throw new Error('Invalid local mapping; refusing to overwrite local state.');
  }
  return { schemaVersion: 1, rootId: raw.rootId, pendingDeletions: raw.pendingDeletions as string[], mappings: Object.fromEntries(Object.entries(raw.mappings).map(([id, value]) => {
    const m = value as LocalMapping;
    return [id, { stableId: m.stableId, dateAdded: m.dateAdded, lastLocator: cleanLocator(m.lastLocator), method: m.method }];
  })) };
}

export function parseJournal(raw: unknown): MetadataJournal {
  if (raw === undefined) return { schemaVersion: 1, entries: {} };
  if (!object(raw) || raw.schemaVersion !== 1 || !object(raw.entries)) throw new Error('Invalid or unsupported local metadata journal; preserved unchanged. Publication blocked.');
  const entries: MetadataJournal['entries'] = {};
  for (const [id, entry] of Object.entries(raw.entries)) {
    if (!UUID.test(id) || !object(entry) || !time(entry.locallyWrittenAt)) throw new Error('Invalid local metadata journal entry; publication blocked.');
    const parsed = parseMetadata({ [`meta:${id}`]: entry.metadata });
    if (parsed.invalid.length || !parsed.records.length) throw new Error('Invalid preserved metadata; publication blocked.');
    entries[id] = { metadata: parsed.records[0], locallyWrittenAt: entry.locallyWrittenAt };
  }
  return { schemaVersion: 1, entries };
}
