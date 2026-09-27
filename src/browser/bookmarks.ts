import type { FavoriteNode } from '../core/model';

export interface BookmarksRepository {
  getTree(): Promise<FavoriteNode[]>;
  create(input: { parentId: string; title: string; url?: string }): Promise<FavoriteNode>;
  update(id: string, changes: { title?: string; url?: string }): Promise<void>;
  move(id: string, parentId: string): Promise<void>;
  removeLink(id: string): Promise<void>;
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
  async getTree() { return (await this.api.getTree()).map(project); }
  async create(input: { parentId: string; title: string; url?: string }) { return project(await this.api.create(input)); }
  async update(id: string, changes: { title?: string; url?: string }) { await this.api.update(id, changes); }
  async move(id: string, parentId: string) { await this.api.move(id, { parentId }); }
  async removeLink(id: string) {
    const [node] = await this.api.get(id);
    if (node.url === undefined) throw new Error('Deletion is restricted to a single Favorite, never a folder.');
    await this.api.remove(id);
  }
}
