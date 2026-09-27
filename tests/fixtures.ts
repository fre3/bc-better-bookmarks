import type { BookmarkMetadata, Favorite, FavoriteNode, LocalMapping, MetadataState } from '../src/core/model';
import { flattenTree } from '../src/core/logic';
import { parseMetadata } from '../src/core/schema';
export const idA = '00000000-0000-4000-8000-000000000001';
export const idB = '00000000-0000-4000-8000-000000000002';
export function tree(): FavoriteNode[] { return [{ id: '0', title: '', children: [{ id: '1', parentId: '0', title: 'Favorites bar', folderType: 'bookmarks-bar', children: [
  { id: '10', parentId: '1', title: 'Dashboard', children: [{ id: '20', parentId: '10', title: 'Azure', url: 'https://azure.com/', dateAdded: 1, index: 0 }] },
  { id: '11', parentId: '1', title: 'Other', children: [] },
] }] }]; }
export function favorite(overrides: Partial<Favorite> = {}): Favorite { return { ...flattenTree(tree()).favorites[0], ...overrides }; }
export function record(f = favorite(), stableId = idA): BookmarkMetadata { return { schemaVersion: 1, stableId, tags: ['azure', 'development'], initialLocator: f.locator, updatedAt: '2026-09-24T12:00:00Z' }; }
export function metadata(records = [record()]): MetadataState { return parseMetadata(Object.fromEntries(records.map(r => [`meta:${r.stableId}`, r]))); }
export function mapping(f = favorite(), stableId = idA): Record<string, LocalMapping> { return { [f.id]: { stableId, lastLocator: f.locator, dateAdded: f.dateAdded, method: 'explicit' } }; }
