import type { FavoriteNode, Folder } from './model';

/** Derived policy, not an Edge-provided Workspace discriminator. */
export const ORDINARY_ROOT_TYPES = new Set(['bookmarks-bar', 'other', 'mobile']);
export const UNKNOWN_LOCATION = 'Native changes are unavailable in this unclassified browser location. Inspect this browser location before making native changes.';
export function metadataEditable(node: FavoriteNode | undefined): boolean {
  return Boolean(node && !node.unmodifiable && (node.url !== undefined || (node as Folder).ancestorIds?.length > 1));
}
export function nativeIssue(node: FavoriteNode | undefined): string | undefined {
  if (!node) return 'This item no longer exists.';
  if (node.unmodifiable) return 'This item is managed or protected by the browser.';
  return node.nativeRestriction;
}
export function assertNative(node: FavoriteNode | undefined) {
  const issue = nativeIssue(node); if (issue) throw Error(issue);
}

export const WORKSPACE_ROOT = 'Create and manage Workspaces through Edge. The Workspaces root cannot receive ordinary folders or moved items.';
export const WORKSPACE_CONTAINER = 'Workspace naming and lifecycle are managed in Edge. Only extension tags may be edited on this container.';
export const WORKSPACE_BOUNDARY = 'Moves between a Workspace and an ordinary bookmark root remain unavailable in this dashboard. Use the browser bookmark manager, then review the refreshed state. No automatic retry is performed.';
/** Observed profile shape: documented bar + other, exactly one additional bare
 * root, no other unknown types. No labels, IDs, active tabs or per-folder setup.
 * A different browser root with this same shape is indistinguishable: see docs. */
export function workspaceRoot(tree: FavoriteNode[]): string | undefined {
  if (!tree.some(n => n.browserFamily === 'edge')) return;
  const roots = tree.flatMap(n => n.children ?? []).filter(n => n.url === undefined);
  if (!roots.some(n => n.folderType === 'bookmarks-bar') || !roots.some(n => n.folderType === 'other')) return;
  const unknown = roots.filter(n => !n.unmodifiable && n.folderType !== 'managed' && !ORDINARY_ROOT_TYPES.has(n.folderType ?? ''));
  return unknown.length === 1 && !unknown[0].folderType ? unknown[0].id : undefined;
}
export function destinationIssue(folder: Folder | undefined): string | undefined {
  if (!folder?.writable) return nativeIssue(folder) ?? 'Choose a writable destination.';
}
export function moveBoundaryIssue(source: FavoriteNode | undefined, destination: FavoriteNode | undefined): string | undefined {
  if (Boolean(source?.workspaceId) !== Boolean(destination?.workspaceId)) return WORKSPACE_BOUNDARY;
}
