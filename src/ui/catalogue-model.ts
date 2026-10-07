import { metadataEditable } from '../core/capabilities';
import { itemMetadataIssue } from '../core/item-metadata-health';
import { nodeTags, folderNode, type NodeTags } from '../core/node-tags';
import { parseSearch, searchFavorites } from '../core/logic';
import type { Favorite, FavoriteNode, Folder, Snapshot } from '../core/model';

export type CatalogueItem =
  | { kind: 'bookmark'; favorite: Favorite; tags: string[]; tagInfo?: NodeTags; ambiguous: boolean; metadataIssue?: string }
  | { kind: 'folder'; folder: Folder; tagInfo?: NodeTags; children: CatalogueItem[] };
export interface CatalogueSection {
  id: string;
  title: string;
  rootId: string;
  rootTitle: string;
  parentId: string;
  children: CatalogueItem[];
  folder?: Folder;
  tagInfo?: NodeTags;
}
export interface CatalogueModel {
  roots: FavoriteNode[];
  sections: CatalogueSection[];
  tags: Map<string, string[]>;
  folderNodes?: Favorite[];
}

// A disposable projection of the authoritative ordered tree, never persisted.
export function buildCatalogue(s: Snapshot, showArchived = false): CatalogueModel {
  const favorites = new Map(s.favorites.map(f => [f.id, f]));
  const folders = new Map(s.folders.map(f => [f.id, f]));
  const info = nodeTags(s);
  const tags = new Map([...info].map(([id, value]) => [id, value.effective]));
  const allowed = (id: string) => showArchived || !info.get(id)?.archived;
  const project = (nodes: FavoriteNode[]): CatalogueItem[] => nodes.flatMap((node): CatalogueItem[] => {
    if (!allowed(node.id)) return [];
    if (node.url !== undefined) {
      const favorite = favorites.get(node.id);
      return favorite ? [{ kind: 'bookmark', favorite, tagInfo: info.get(node.id), tags: tags.get(node.id) ?? [], ambiguous: itemMetadataIssue(s, node.id)?.startsWith('Ambiguous') ?? false, metadataIssue: itemMetadataIssue(s, node.id) }] : [];
    }
    const folder = folders.get(node.id);
    return folder ? [{ kind: 'folder', folder, tagInfo: info.get(node.id), children: project(node.children ?? []) }] : [];
  });
  // The API returns a virtual tree container; its folder children are the actual
  // browser roots, including managed or browser-specific roots when present.
  const roots = s.tree.flatMap(container => container.children ?? []).filter(node => node.url === undefined);
  const sections = roots.flatMap(root => {
    const result: CatalogueSection[] = [];
    let loose: CatalogueSection | undefined;
    for (const node of root.children ?? []) {
      if (!allowed(node.id)) continue;
      if (node.url !== undefined) {
        if (!loose) {
          loose = { id: `loose:${root.id}`, title: 'Bookmarks', rootId: root.id, rootTitle: root.title, parentId: root.id, children: [] };
          result.push(loose);
        }
        loose.children.push(...project([node]));
      } else {
        result.push({ id: `folder:${node.id}`, title: node.title, rootId: root.id, rootTitle: root.title, parentId: node.id, folder: folders.get(node.id), tagInfo: info.get(node.id), children: project(node.children ?? []) });
      }
    }
    return result;
  });
  return { roots, sections, tags, folderNodes: s.folders.filter(f => metadataEditable(f) && allowed(f.id)).map(f => ({ ...folderNode(f, s.folders), folderPath: f.path })) };
}

export function filterCatalogue(model: CatalogueModel, favorites: Favorite[], scope: string, query: string, searching: boolean) {
  const sections = model.sections.filter(section => scope === '*' || section.rootId === scope);
  const visibleIds = new Set<string>();
  const collect = (items: CatalogueItem[]) => items.forEach(item => { if (item.kind === 'bookmark') visibleIds.add(item.favorite.id); else collect(item.children); });
  sections.forEach(section => collect(section.children));
  const matches = searchFavorites(favorites.filter(f => visibleIds.has(f.id)).filter(f => scope === '*' || f.ancestorIds.includes(scope)), query, id => model.tags.get(id) ?? []);
  if (!searching) return { sections, count: matches.length };
  const folderMatches = searchFavorites((model.folderNodes ?? []).filter(f => scope === '*' || f.ancestorIds.includes(scope)), query, id => model.tags.get(id) ?? []);
  const folderIds = new Set(folderMatches.map(f => f.id));
  const ids = new Set(matches.map(f => f.id));
  const filter = (items: CatalogueItem[]): CatalogueItem[] => items.flatMap((item): CatalogueItem[] => {
    if (item.kind === 'bookmark') return ids.has(item.favorite.id) ? [item] : [];
    const children = filter(item.children);
    return children.length || folderIds.has(item.folder.id) ? [{ ...item, children }] : [];
  });
  return { sections: sections.map(section => ({ ...section, children: filter(section.children) })).filter(section => section.children.length || section.folder && folderIds.has(section.folder.id)), count: matches.length + folderMatches.length };
}

// Explain tag-only matches without changing the existing matching semantics.
export function matchingTags(favorite: Pick<Favorite, 'title' | 'url' | 'folderPath' | 'systemLabels'>, tags: string[], query: string): string[] {
  const other = [favorite.title, favorite.url, ...favorite.folderPath, ...favorite.systemLabels].join('\n').toLowerCase();
  return tags.filter(tag => parseSearch(query).some(term =>
    term.field !== 'category' && tag.toLowerCase().includes(term.value) &&
    (term.field === 'tag' || !other.includes(term.value))));
}
