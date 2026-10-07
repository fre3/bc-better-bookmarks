import type { Snapshot } from './model';

/** Shared preflight for catalogue/editor diagnostics and worker writes. Never tags. */
export function itemMetadataIssue(state: Snapshot, id: string): string | undefined {
  if (state.metadata.invalid.length) return 'Unsupported synchronized data is present. Tag writes are blocked until reviewed in diagnostics.';
  if (!state.reconciliation.mappings[id] && state.reconciliation.matches.some(m => m.status === 'ambiguous' && m.candidateIds.includes(id))) return 'Ambiguous metadata match. Tags were not written.';
  const previousId = state.local.mappings[id]?.stableId;
  if (previousId && (state.metadata.tombstones[previousId] || state.local.pendingDeletions.includes(previousId))) return 'Deletion evidence exists for this Favorite. Editing its metadata is blocked; inspect diagnostics.';
  const mapping = state.reconciliation.mappings[id];
  const existing = state.metadata.records.find(r => r.stableId === mapping?.stableId);
  if (previousId && mapping && mapping.stableId !== previousId) return 'Conflicting local identity. Editing is blocked; inspect diagnostics.';
  if (!existing && previousId) {
    if (state.metadataHealth[previousId]?.rawMeta === 'absent') return 'Known identity has missing synchronized metadata. Identity retained; automatic recovery is disabled. Inspect diagnostics and local preservation status.';
    return 'Existing local identity has no usable metadata. Editing is blocked; inspect diagnostics.';
  }
}

/** Read-only, item-specific evidence, keyed by native ID rather than display title. */
export function itemIdentityDetails(state: Snapshot, id: string) {
  const previous = state.local.mappings[id];
  return {
    nativeId: id,
    retainedLocalMapping: previous,
    currentMapping: state.reconciliation.mappings[id],
    matches: state.reconciliation.matches.filter(m => m.bookmarkId === id || m.candidateIds.includes(id) || m.stableId === previous?.stableId)
      .map(m => ({ ...m, health: state.metadataHealth[m.stableId] })),
  };
}
