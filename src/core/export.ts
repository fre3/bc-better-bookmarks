import type { Snapshot } from './model';
import { isBookmarklet } from './logic';
function redactUrl(value: string): string {
  if (isBookmarklet(value)) return value;
  try {
    const url = new URL(value);
    url.username = ''; url.password = '';
    // Keep ordinary Favorite locators useful; remove common credential query parameters.
    for (const key of [...url.searchParams.keys()]) if (/token|secret|password|credential|auth|signature|api.?key|^code$/i.test(key)) url.searchParams.set(key, '[REDACTED]');
    if (/token|secret|password|credential|auth|signature|api.?key|code=/i.test(url.hash)) url.hash = '[REDACTED]';
    return url.href;
  } catch { return '[nonstandard URL omitted]'; }
}
function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, key === 'url' && typeof v === 'string' ? redactUrl(v) : sanitize(v)]));
  return value;
}
export function diagnosticExport(snapshot: Snapshot) {
  return sanitize({
    schemaVersion: 1, exportedAt: new Date().toISOString(),
    note: 'Bookmarks data, not browsing history. Credentials and common secret URL parameters redacted. Review before sharing; titles, tags and ordinary URLs may be private. Not an importable backup.',
    extensionId: snapshot.extensionId, version: snapshot.version,
    dashboardTree: snapshot.tree,
    favorites: snapshot.favorites, folders: snapshot.folders,
    synchronizedMetadata: { records: snapshot.metadata.records, histories: snapshot.metadata.histories, tombstones: snapshot.metadata.tombstones, invalidKeys: snapshot.metadata.invalid },
    local: snapshot.local, reconciliation: snapshot.reconciliation, metadataHealth: snapshot.metadataHealth,
    // Preserve the journal privately in storage.local; exports contain only availability and IDs.
    preservation: snapshot.preservation,
    syncBytes: snapshot.syncBytes, quotas: snapshot.quotas, lastReconciliation: snapshot.lastReconciliation, logs: snapshot.logs,
    // Error strings may contain browser-supplied data; export counts, inspect detailed errors locally.
    errorCount: snapshot.errors.length,
  });
}
