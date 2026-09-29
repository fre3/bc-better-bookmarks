import type { LocalState, LogEntry, MetadataHealth, MetadataState, Reconciliation } from './model';
import { parseMetadata, UUID } from './schema';

export interface StorageChange { oldValue?: unknown; newValue?: unknown }
// Summarize at receipt time; never retain values in the queued diagnostic payload.
export function storageChangeLogs(changes: Record<string, StorageChange>, receivedAt: string): LogEntry[] {
  return Object.entries(changes).slice(-60).map(([key, change]) => {
    const [kind, id] = key.split(':');
    const known = ['meta', 'loc', 'dead'].includes(kind);
    const safe = known && UUID.test(id ?? '') && key === `${kind}:${id}`;
    const oldPresent = change.oldValue !== undefined;
    const newPresent = change.newValue !== undefined;
    const validation = (present: boolean, value: unknown) => !present ? 'absent'
      : !safe ? 'unsupported-key' : parseMetadata({ [key]: value }).invalid.length ? 'invalid/quarantined' : 'valid';
    // Unknown/malformed keys can themselves contain private user text. Do not log them verbatim.
    return { time: receivedAt, message: `storage.sync key=${safe ? key : '[unrecognized key redacted]'} type=${known ? kind : 'other'} stableId=${safe ? id : 'unknown'} operation=${newPresent ? oldPresent ? 'updated' : 'added' : oldPresent ? 'removed' : 'unchanged'} oldPresent=${oldPresent} newPresent=${newPresent} old=${validation(oldPresent, change.oldValue)} new=${validation(newPresent, change.newValue)}; origin/remote acknowledgement unknown` };
  });
}

export function metadataHealth(metadata: MetadataState, local: LocalState, reconciliation: Reconciliation, preservedIds: string[]): Record<string, MetadataHealth> {
  const ids = new Set([...Object.values(local.mappings).map(m => m.stableId), ...local.pendingDeletions,
    ...Object.keys(metadata.raw).map(key => key.split(':')[1]).filter(id => UUID.test(id ?? ''))]);
  return Object.fromEntries([...ids].map(id => {
    const key = `meta:${id}`;
    const rawMeta = !Object.hasOwn(metadata.raw, key) ? 'absent'
      : parseMetadata({ [key]: metadata.raw[key] }).records.length ? 'valid' : 'invalid';
    const quarantined = metadata.invalid.some(issue => ['meta', 'loc', 'dead'].some(kind => issue.startsWith(`${kind}:${id}:`)));
    const status = metadata.tombstones[id] || local.pendingDeletions.includes(id) ? 'deleted'
      : quarantined ? 'quarantined'
      : reconciliation.matches.some(m => m.stableId === id && m.status === 'ambiguous') ? 'ambiguous'
      : rawMeta === 'absent' ? 'missing' : 'valid';
    return [id, { status, rawMeta, preservedLocally: preservedIds.includes(id) }];
  }));
}
