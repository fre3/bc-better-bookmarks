import { browserFamily } from './platform';
import type { FavoriteNode } from '../core/model';

export interface BookmarksRepository {
  getTree(): Promise<FavoriteNode[]>;
  create(input: { parentId: string; title: string; url?: string }): Promise<FavoriteNode>;
  update(id: string, changes: { title?: string; url?: string }): Promise<void>;
  move(id: string, parentId: string, index?: number): Promise<FavoriteNode | void>;
  removeLink(id: string): Promise<void>;
  removeEmptyFolder(id: string): Promise<void>;
}
function project(node: chrome.bookmarks.BookmarkTreeNode): FavoriteNode {
  const extra = node as chrome.bookmarks.BookmarkTreeNode & { syncing?: boolean; folderType?: string };
  // Allowlist: deliberately exclude dateLastUsed / browsing history.
  return { id: node.id, parentId: node.parentId, title: node.title, url: node.url, index: node.index,
    dateAdded: node.dateAdded, syncing: extra.syncing, folderType: extra.folderType, unmodifiable: node.unmodifiable,
    children: node.children?.map(project) };
}
export class BrowserBookmarksRepository implements BookmarksRepository {
  constructor(private readonly api: typeof chrome.bookmarks = chrome.bookmarks) {}
  async getTree() { return (await this.api.getTree()).map(node => ({...project(node), browserFamily: browserFamily()})); }
  async create(input: { parentId: string; title: string; url?: string }) { return project(await this.api.create(input)); }
  async update(id: string, changes: { title?: string; url?: string }) { await this.api.update(id, changes); }
  async move(id: string, parentId: string, index?: number) { return project(await this.api.move(id, { parentId, ...(index === undefined ? {} : { index }) })); }
  async removeEmptyFolder(id: string) {
    const [node] = await this.api.getSubTree(id);
    if (!node || node.url !== undefined || node.unmodifiable || (node as chrome.bookmarks.BookmarkTreeNode & { folderType?: string }).folderType || !node.parentId || node.children?.length) throw new Error('Only a confirmed empty user folder can be removed.');
    await this.api.remove(id);
  }
  async removeLink(id: string) {
    const [node] = await this.api.get(id);
    if (node.url === undefined) throw new Error('Deletion is restricted to a single Favorite, never a folder.');
    await this.api.remove(id);
  }
}
