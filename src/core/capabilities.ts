import type { FavoriteNode, Folder } from './model';

/** Only documented browser folder types establish an ordinary bookmark domain.
 * Unknown roots/types are NOT identified as Workspaces by their display names.
 * Edge exposes no documented Workspace-container signal in bookmarks API. */
export const ORDINARY_ROOT_TYPES = new Set(['bookmarks-bar', 'other', 'mobile']);
export const UNKNOWN_LOCATION = 'Native changes are unavailable in this unclassified browser location. Manage Workspace names and lifecycle in Edge.';
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
