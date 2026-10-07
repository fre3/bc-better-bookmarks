import { ORDINARY_ROOT_TYPES, UNKNOWN_LOCATION, workspaceRoot, WORKSPACE_ROOT, WORKSPACE_CONTAINER } from './capabilities';
import type { Favorite, FavoriteNode, Folder, FolderPart, LinkInput, Locator, SystemLabel } from './model';

// Inspect only the scheme; bookmarklet code is opaque and never parsed or rewritten.
export function urlScheme(url: string): string | undefined {
  return /^\s*([a-z][a-z0-9+.-]*):/i.exec(url)?.[1].toLowerCase();
}
export function isBookmarklet(url: string): boolean { return urlScheme(url) === 'javascript'; }
export function systemLabelsFor(url: string): SystemLabel[] {
  const scheme = urlScheme(url);
  return scheme === 'javascript' ? ['JS'] : scheme === 'http' ? ['HTTP'] : [];
}
export const BOOKMARKLET_WARNING = 'Executable bookmarklet\n\nThis Bookmark contains JavaScript code that can execute in the context of a web page. Only save bookmarklets whose code you trust.';
export function confirmLinkInput(input: LinkInput, confirm: (message: string) => boolean): LinkInput | undefined {
  if (!isBookmarklet(input.url)) return { ...input, bookmarkletConfirmed: false };
  if (!confirm(BOOKMARKLET_WARNING)) return undefined;
  return { ...input, bookmarkletConfirmed: true };
}

export function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map(tag => tag.normalize('NFC').trim().toLowerCase()).filter(Boolean))].sort();
}
export function fingerprint(locator: Locator): string {
  // Structured serialization avoids delimiter collisions. Exact URL and title are intentional.
  return JSON.stringify([...(locator.kind === 'folder' ? ['folder'] : []), locator.url, locator.title, locator.folderPath.map(p => [p.kind, p.value])]);
}
export function flattenTree(tree: FavoriteNode[]): { favorites: Favorite[]; folders: Folder[] } {
  const favorites: Favorite[] = [];
  const folders: Folder[] = [];
  const workspaceRootId = workspaceRoot(tree);
  const walk = (node: FavoriteNode, path: string[], parts: FolderPart[], ids: string[], managed: boolean, inheritedRestriction?: string, parentWorkspaceId?: string) => {
    const blocked = managed || Boolean(node.unmodifiable) || node.folderType === 'managed';
    const unknownRoot = ids.length === 1 && !ORDINARY_ROOT_TYPES.has(node.folderType ?? '');
    const unknownType = Boolean(node.folderType && !ORDINARY_ROOT_TYPES.has(node.folderType) && node.folderType !== 'managed');
    const workspaceRole = node.id === workspaceRootId ? 'root' : workspaceRootId && node.parentId === workspaceRootId ? node.url === undefined ? 'container' : 'loose' : parentWorkspaceId ? 'content' : undefined;
    const workspaceId = workspaceRole === 'container' ? node.id : parentWorkspaceId;
    const domainRestriction = inheritedRestriction || (unknownType || unknownRoot && workspaceRole !== 'root' ? UNKNOWN_LOCATION : undefined);
    const restriction = domainRestriction || (workspaceRole === 'root' || workspaceRole === 'loose' ? WORKSPACE_ROOT : workspaceRole === 'container' ? WORKSPACE_CONTAINER : undefined);
    if (node.url !== undefined) {
      favorites.push({ ...node, nativeRestriction: restriction, workspaceRole, workspaceId, unmodifiable: blocked ? 'managed' : undefined, url: node.url, systemLabels: systemLabelsFor(node.url), folderPath: path, ancestorIds: ids,
        locator: { url: node.url, title: node.title, folderPath: parts } });
      return;
    }
    const isRoot = node.parentId === undefined;
    const nextPath = isRoot ? path : [...path, node.title];
    const nextParts = isRoot ? parts : [...parts, { kind: node.folderType ? 'browser' as const : 'title' as const, value: node.folderType ?? node.title }];
    folders.push({ ...node, nativeRestriction: restriction, workspaceRole, workspaceId, unmodifiable: blocked ? 'managed' : node.unmodifiable, path: nextPath, ancestorIds: ids, writable: !blocked && !isRoot && (!restriction || workspaceRole === 'container' && !domainRestriction),
      renamable: !blocked && !restriction && !isRoot && ids.length > 1 && !node.folderType });
    for (const child of node.children ?? []) walk(child, nextPath, nextParts, [...ids, node.id], blocked, domainRestriction, workspaceId);
  };
  for (const root of tree) walk(root, [], [], [], false);
  return { favorites, folders };
}
export interface SearchTerm { field: 'all' | 'tag' | 'category'; value: string }
export function parseSearch(query: string): SearchTerm[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean).flatMap(token => {
    const field = token[0] === '#' ? 'tag' : token[0] === '@' ? 'category' : 'all';
    const value = field === 'all' ? token : token.slice(1);
    return value ? [{ field, value }] : [];
  });
}
export function searchFavorites(favorites: Favorite[], query: string, tagsFor: (id: string) => string[]): Favorite[] {
  const terms = parseSearch(query);
  return favorites.filter(f => {
    const tags = tagsFor(f.id).join('\n').toLowerCase();
    const category = f.folderPath.join('\n').toLowerCase();
    const all = [f.title, f.url, category, tags, ...f.systemLabels].join('\n').toLowerCase();
    return terms.every(term => ({ all, tag: tags, category })[term.field].includes(term.value));
  });
}
export function validateUrl(input: string, bookmarkletConfirmed = false): string {
  if (isBookmarklet(input)) {
    if (!bookmarkletConfirmed) throw new Error('Executable bookmarklet requires explicit confirmation before saving.');
    return input;
  }
  const url = new URL(input.trim());
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('New or edited URLs must use http:, https:, or a confirmed javascript: bookmarklet.');
  if (url.username || url.password) throw new Error('URLs containing credentials are not supported.');
  return url.href;
}
export function safeHref(url: string): string | undefined {
  try { return validateUrl(url); } catch { return undefined; }
}
export function editToken(f: Favorite, tags: string[]): string {
  return JSON.stringify([f.parentId, fingerprint(f.locator), tags]);
}
