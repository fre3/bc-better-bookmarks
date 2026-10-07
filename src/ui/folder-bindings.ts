import { metadataEditable } from '../core/capabilities';
import type { Snapshot } from '../core/model';

/** Administrative review is intentionally independent of catalogue visibility. */
export function folderBindings(snapshot: Snapshot) {
  return snapshot.reconciliation.matches.flatMap(match => {
    const record = snapshot.metadata.records.find(record => record.stableId === match.stableId && record.initialLocator.kind === 'folder');
    if (!record || !['unresolved', 'ambiguous'].includes(match.status)) return [];
    const folder = snapshot.folders.find(folder => folder.id === match.candidateIds[0]);
    const competing = match.candidateIds.some(id => snapshot.reconciliation.matches.some(other => other.stableId !== match.stableId && other.candidateIds.includes(id)));
    const ambiguous = match.status === 'ambiguous' || competing;
    const available = !ambiguous && match.candidateIds.length === 1 && metadataEditable(folder) && !snapshot.local.mappings[folder!.id] && !snapshot.metadata.invalid.length && !snapshot.local.pendingDeletions?.includes(record.stableId);
    return [{ match, record, folder, available, ambiguous }];
  });
}
export type FolderBinding = ReturnType<typeof folderBindings>[number];
/** Mirrors the existing edit-folder guard, including identities bound elsewhere. */
export function folderNeedsReview(snapshot: Snapshot, id: string) {
  return !snapshot.reconciliation.mappings[id] && (Boolean(snapshot.local.mappings[id]) || snapshot.reconciliation.matches.some(match => match.candidateIds.includes(id) && snapshot.metadata.records.some(record => record.stableId === match.stableId && record.initialLocator.kind === 'folder')));
}
