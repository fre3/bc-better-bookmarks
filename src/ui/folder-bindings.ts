import type { Snapshot } from '../core/model';

/** Presentation of existing reconciliation decisions; never grants a binding. */
export function folderBindings(snapshot: Snapshot, showArchived: boolean) {
  return snapshot.reconciliation.matches.flatMap(match => {
    const record = snapshot.metadata.records.find(record => record.stableId === match.stableId && record.initialLocator.kind === 'folder');
    if (!record || !['unresolved', 'ambiguous'].includes(match.status)) return [];
    if (!showArchived && (record.tags.includes('archived') || match.candidateIds.some(id => !snapshot.folders.some(folder => folder.id === id)))) return [];
    const folder = snapshot.folders.find(folder => folder.id === match.candidateIds[0]);
    const competing = match.candidateIds.some(id => snapshot.reconciliation.matches.some(other => other.stableId !== match.stableId && other.candidateIds.includes(id)));
    const ambiguous = match.status === 'ambiguous' || competing;
    const available = !ambiguous && match.candidateIds.length === 1 && Boolean(folder?.renamable) && !snapshot.local.mappings[folder!.id] && !snapshot.metadata.invalid.length;
    return [{ match, record, folder, available, ambiguous }];
  });
}
