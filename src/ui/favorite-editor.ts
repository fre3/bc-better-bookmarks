import { editToken } from '../core/logic';
import { directTags, folderNode } from '../core/node-tags';
import type { Favorite, Folder, LinkInput, Snapshot } from '../core/model';

export const favoriteTags = directTags;
export function favoriteDraft(snapshot: Snapshot, favorite: Favorite | Folder) {
  const isFolder = favorite.url === undefined;
  const node = isFolder ? folderNode(favorite as Folder, snapshot.folders) : favorite as Favorite;
  const tags = directTags(snapshot, node.id);
  return { generation: snapshot.metadata.setup?.generation, id: node.id, isFolder, expected: editToken(node, tags), folder: node.folderPath.join(' / '),
    input: { title: node.title, url: node.url, tags, parentId: node.parentId! } satisfies LinkInput };
}
export type FavoriteDraft = ReturnType<typeof favoriteDraft>;
/** Early feedback only. The service repeats its full identity/health preflight. */
export function draftConflict(snapshot: Snapshot, draft: FavoriteDraft): string | undefined {
  if (snapshot.metadata.setup?.generation !== draft.generation) return 'Metadata was reset since editing began. Copy needed input, then cancel and reopen.';
  const favorite = draft.isFolder ? snapshot.folders.find(item => item.id === draft.id) : snapshot.favorites.find(item => item.id === draft.id);
  if (!favorite) return 'This item was removed. Your draft is retained, but it cannot be saved. Copy any needed text before closing.';
  if (favoriteDraft(snapshot, favorite).expected !== draft.expected) return 'This item, its folder or its direct tags changed since editing began. Your draft is retained. Copy any needed text, then cancel and reopen to review the latest values.';
  if (favorite.unmodifiable || draft.isFolder && !(favorite as Folder).renamable) return 'This item is managed or browser-owned and cannot be edited.';
  return undefined;
}
