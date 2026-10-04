import { editToken } from '../core/logic';
import type { Favorite, LinkInput, Snapshot } from '../core/model';

export function favoriteTags(snapshot: Snapshot, id: string): string[] {
  return snapshot.metadata.records.find(record => record.stableId === snapshot.reconciliation.mappings[id]?.stableId)?.tags ?? [];
}
export function favoriteDraft(snapshot: Snapshot, favorite: Favorite) {
  const tags = favoriteTags(snapshot, favorite.id);
  return { id: favorite.id, expected: editToken(favorite, tags), folder: favorite.folderPath.join(' / '),
    input: { title: favorite.title, url: favorite.url, tags, parentId: favorite.parentId! } satisfies LinkInput };
}
export type FavoriteDraft = ReturnType<typeof favoriteDraft>;
/** Early feedback only. The service repeats its full identity/health preflight. */
export function draftConflict(snapshot: Snapshot, draft: FavoriteDraft): string | undefined {
  const favorite = snapshot.favorites.find(item => item.id === draft.id);
  if (!favorite) return 'This Favorite was removed. Your draft is retained, but it cannot be saved. Copy any needed text before closing.';
  if (editToken(favorite, favoriteTags(snapshot, favorite.id)) !== draft.expected) return 'This Favorite, its folder or its tags changed since editing began. Your draft is retained. Copy any needed text, then cancel and reopen to review the latest values.';
  if (favorite.unmodifiable) return 'This Favorite is managed and cannot be edited.';
  const root = snapshot.local.rootId;
  if (root === null || (root !== '*' && !favorite.ancestorIds.includes(root))) return 'Editing is disabled for this Favorite by the mutation scope in Manage. Browse scope does not enable edits.';
  return undefined;
}
