import type { Favorite, FavoriteNode, Folder, FolderPart, Locator } from './model';

export function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map(tag => tag.normalize('NFC').trim().toLowerCase()).filter(Boolean))].sort();
}
export function fingerprint(locator: Locator): string {
  // Structured serialization avoids delimiter collisions. Exact URL and title are intentional.
  return JSON.stringify([locator.url, locator.title, locator.folderPath.map(p => [p.kind, p.value])]);
}
export function flattenTree(tree: FavoriteNode[]): { favorites: Favorite[]; folders: Folder[] } {
  const favorites: Favorite[] = [];
  const folders: Folder[] = [];
  const walk = (node: FavoriteNode, path: string[], parts: FolderPart[], ids: string[], managed: boolean) => {
    const blocked = managed || Boolean(node.unmodifiable);
    if (node.url !== undefined) {
      favorites.push({ ...node, unmodifiable: blocked ? 'managed' : undefined, url: node.url, folderPath: path, ancestorIds: ids,
        locator: { url: node.url, title: node.title, folderPath: parts } });
      return;
    }
    const isRoot = node.parentId === undefined;
    const nextPath = isRoot ? path : [...path, node.title];
    const nextParts = isRoot ? parts : [...parts, { kind: node.folderType ? 'browser' as const : 'title' as const, value: node.folderType ?? node.title }];
    folders.push({ ...node, path: nextPath, ancestorIds: ids, writable: !blocked && !isRoot,
      renamable: !blocked && !isRoot && ids.length > 1 && !node.folderType });
    for (const child of node.children ?? []) walk(child, nextPath, nextParts, [...ids, node.id], blocked);
  };
  for (const root of tree) walk(root, [], [], [], false);
  return { favorites, folders };
}
export function searchFavorites(favorites: Favorite[], query: string, tagsFor: (id: string) => string[]): Favorite[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return favorites.filter(f => {
    const haystack = [f.title, f.url, ...f.folderPath, ...tagsFor(f.id)].join('\n').toLowerCase();
    return terms.every(term => haystack.includes(term));
  });
}
export function validateUrl(input: string): string {
  const url = new URL(input.trim());
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('New or edited URLs must use http:// or https://.');
  if (url.username || url.password) throw new Error('URLs containing credentials are not supported.');
  return url.href;
}
export function safeHref(url: string): string | undefined {
  try { return validateUrl(url); } catch { return undefined; }
}
export function editToken(f: Favorite, tags: string[]): string {
  return JSON.stringify([f.parentId, fingerprint(f.locator), tags]);
}
