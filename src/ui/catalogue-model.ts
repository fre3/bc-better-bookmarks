import { parseSearch, searchFavorites } from '../core/logic';
import type { Favorite, FavoriteNode, Folder, Snapshot } from '../core/model';

export type CatalogueItem =
  | { kind: 'bookmark'; favorite: Favorite; tags: string[]; ambiguous: boolean }
  | { kind: 'folder'; folder: Folder; children: CatalogueItem[] };
export interface CatalogueSection {
  id: string;
  title: string;
  rootId: string;
  rootTitle: string;
  parentId: string;
  children: CatalogueItem[];
}
export interface CatalogueModel {
  roots: FavoriteNode[];
  sections: CatalogueSection[];
  tags: Map<string, string[]>;
}

// A disposable projection of the authoritative ordered tree, never persisted.
export function buildCatalogue(s: Snapshot): CatalogueModel {
  const favorites = new Map(s.favorites.map(f => [f.id, f]));
  const folders = new Map(s.folders.map(f => [f.id, f]));
  const metadata = new Map(s.metadata.records.map(r => [r.stableId, r.tags]));
  const tags = new Map(s.favorites.map(f => [f.id, metadata.get(s.reconciliation.mappings[f.id]?.stableId) ?? []]));
  const ambiguous = new Set(s.reconciliation.matches.filter(m => m.status === 'ambiguous').flatMap(m => m.candidateIds));
  const project = (nodes: FavoriteNode[]): CatalogueItem[] => nodes.flatMap((node): CatalogueItem[] => {
    if (node.url !== undefined) {
      const favorite = favorites.get(node.id);
      return favorite ? [{ kind: 'bookmark', favorite, tags: tags.get(node.id) ?? [], ambiguous: ambiguous.has(node.id) }] : [];
    }
    const folder = folders.get(node.id);
    return folder ? [{ kind: 'folder', folder, children: project(node.children ?? []) }] : [];
  });
  // The API returns a virtual tree container; its folder children are the actual
  // browser roots, including managed or browser-specific roots when present.
  const roots = s.tree.flatMap(container => container.children ?? []).filter(node => node.url === undefined);
  const sections = roots.flatMap(root => {
    const result: CatalogueSection[] = [];
    let loose: CatalogueSection | undefined;
    for (const node of root.children ?? []) {
      if (node.url !== undefined) {
        if (!loose) {
          loose = { id: `loose:${root.id}`, title: 'Bookmarks', rootId: root.id, rootTitle: root.title, parentId: root.id, children: [] };
          result.push(loose);
        }
        loose.children.push(...project([node]));
      } else {
        result.push({ id: `folder:${node.id}`, title: node.title, rootId: root.id, rootTitle: root.title, parentId: node.id, children: project(node.children ?? []) });
      }
    }
    return result;
  });
  return { roots, sections, tags };
}

export function filterCatalogue(model: CatalogueModel, favorites: Favorite[], scope: string, query: string, searching: boolean) {
  const sections = model.sections.filter(section => scope === '*' || section.rootId === scope);
  const matches = searchFavorites(favorites.filter(f => scope === '*' || f.ancestorIds.includes(scope)), query, id => model.tags.get(id) ?? []);
  if (!searching) return { sections, count: matches.length };
  const ids = new Set(matches.map(f => f.id));
  const filter = (items: CatalogueItem[]): CatalogueItem[] => items.flatMap((item): CatalogueItem[] => {
    if (item.kind === 'bookmark') return ids.has(item.favorite.id) ? [item] : [];
    const children = filter(item.children);
    return children.length ? [{ ...item, children }] : [];
  });
  return { sections: sections.map(section => ({ ...section, children: filter(section.children) })).filter(section => section.children.length), count: matches.length };
}

// Explain tag-only matches without changing the existing matching semantics.
export function matchingTags(favorite: Favorite, tags: string[], query: string): string[] {
  const other = [favorite.title, favorite.url, ...favorite.folderPath, ...favorite.systemLabels].join('\n').toLowerCase();
  return tags.filter(tag => parseSearch(query).some(term =>
    term.field !== 'category' && tag.toLowerCase().includes(term.value) &&
    (term.field === 'tag' || !other.includes(term.value))));
}
