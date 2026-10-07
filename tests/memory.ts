import { BrowserMetadataRepository, type StorageArea } from '../src/browser/metadata';
import type { BookmarksRepository } from '../src/browser/bookmarks';
import type { FavoriteNode } from '../src/core/model';
import { DashboardService } from '../src/core/service';
import { idA, mapping, metadata, tree } from './fixtures';
export class MemoryStorage implements StorageArea {
  data: Record<string, unknown> = {};
  writes = 0;
  fail = false;
  async get(keys?: string | string[] | null) {
    return structuredClone(typeof keys === 'string' ? { [keys]: this.data[keys] } : this.data);
  }
  async set(items: Record<string, unknown>) { if (this.fail) throw new Error('quota failure'); this.writes++; Object.assign(this.data, structuredClone(items)); }
  async remove(keys: string | string[]) { for (const key of typeof keys === 'string' ? [keys] : keys) delete this.data[key]; }
  async getBytesInUse() { return JSON.stringify(this.data).length; }
}
export class MemoryBookmarks implements BookmarksRepository {
  data = tree();
  calls: string[] = [];
  seq = 100;
  all(): FavoriteNode[] { const walk = (nodes: FavoriteNode[]): FavoriteNode[] => nodes.flatMap(n => [n, ...walk(n.children ?? [])]); return walk(this.data); }
  async getTree() { return structuredClone(this.data); }
  async create(input: { parentId: string; title: string; url?: string }) {
    this.calls.push('create'); const node = { ...input, id: String(++this.seq), dateAdded: this.seq, children: input.url ? undefined : [] };
    this.all().find(n => n.id === input.parentId)!.children!.push(node); return node;
  }
  async update(id: string, changes: { title?: string; url?: string }) { this.calls.push('update'); Object.assign(this.all().find(n => n.id === id)!, changes); }
  async move(id: string, parentId: string) {
    this.calls.push('move'); const node = this.all().find(n => n.id === id)!;
    const oldParent = this.all().find(n => n.id === node.parentId)!;
    oldParent.children = oldParent.children!.filter(n => n.id !== id);
    node.parentId = parentId; this.all().find(n => n.id === parentId)!.children!.push(node);
  }
  async removeEmptyFolder(id:string){const n=this.all().find(n=>n.id===id);if(!n||n.children?.length)throw Error('Folder not empty');await this.removeLink(id);}
  async removeLink(id: string) { this.calls.push('delete'); const node = this.all().find(n => n.id === id)!; const p = this.all().find(n => n.id === node.parentId)!; p.children = p.children!.filter(n => n.id !== id); }
}
export function setup(withMetadata = false) {
  const sync = new MemoryStorage(); const local = new MemoryStorage(); const bookmarks = new MemoryBookmarks();
  if (withMetadata) { sync.data = metadata().raw; local.data.state = { schemaVersion: 1, mappings: mapping(), rootId: '1', pendingDeletions: [] }; }
  const repository = new BrowserMetadataRepository(sync, local);
  const service = new DashboardService(bookmarks, repository, { extensionId: 'test', version: '0.1' }, () => idA);
  return { sync, local, bookmarks, repository, service };
}
