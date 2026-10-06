import { editToken, normalizeTags } from './logic';
import type { Favorite, Folder, Snapshot } from './model';

const folderIndexes = new WeakMap<Folder[], Map<string, Folder>>();

/** Folder projection for the existing reconciler. The discriminant prevents
 * collisions with link locators; no fake URL is stored on browser Favorites. */
export function folderNode(folder: Folder, folders: Folder[]): Favorite {
  let index = folderIndexes.get(folders);
  if (!index) { index = new Map(folders.map(f => [f.id, f])); folderIndexes.set(folders, index); }
  const ancestors = folder.ancestorIds.map(id => index.get(id)).filter((f): f is Folder => Boolean(f && f.parentId !== undefined));
  return { ...folder, url: '', systemLabels: [], folderPath: folder.path.slice(0, -1), locator: { kind: 'folder', url: '', title: folder.title,
    folderPath: ancestors.map(f => ({ kind: f.folderType ? 'browser' : 'title', value: f.folderType ?? f.title })) } };
}
export function directTags(s: Snapshot, id: string): string[] {
  return s.metadata.records.find(r => r.stableId === s.reconciliation.mappings[id]?.stableId)?.tags ?? [];
}
export interface TagSource { id: string; path: string[]; tags: string[] }
export interface NodeTags { direct: string[]; inherited: string[]; effective: string[]; sources: TagSource[]; archived: boolean }
export function nodeTags(s: Snapshot): Map<string, NodeTags> {
  const folders = new Map(s.folders.map(f => [f.id, f]));
  const records = new Map(s.metadata.records.map(r => [r.stableId, r.tags]));
  const direct = new Map([...s.folders, ...s.favorites].map(f => [f.id, records.get(s.reconciliation.mappings[f.id]?.stableId) ?? []]));
  return new Map([...s.folders, ...s.favorites].map(f => {
    const sources = f.ancestorIds.flatMap(id => { const folder = folders.get(id), tags = direct.get(id) ?? []; return folder && tags.length ? [{ id, path: folder.path, tags }] : []; });
    const inherited = normalizeTags(sources.flatMap(source => source.tags));
    const own = direct.get(f.id) ?? [], effective = normalizeTags([...own, ...inherited]);
    return [f.id, { direct: own, inherited, effective, sources, archived: effective.includes('archived') }];
  }));
}
export function folderEditToken(s: Snapshot, folder: Folder) { return editToken(folderNode(folder, s.folders), directTags(s, folder.id)); }

/** Same archive gate for catalogue and Manage; metadata remains unmodified. */
export function visibleSnapshot(s: Snapshot, showArchived: boolean): Snapshot {
  if (showArchived) return s;
  const tags = nodeTags(s);
  return { ...s, favorites: s.favorites.filter(f => !tags.get(f.id)?.archived), folders: s.folders.filter(f => !tags.get(f.id)?.archived) };
}
