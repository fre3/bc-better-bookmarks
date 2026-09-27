import { expect, it, vi } from 'vitest';
import { BrowserBookmarksRepository } from '../src/browser/bookmarks';
it('browser wrapper projects only Favorites fields and rejects folder deletion', async () => {
  const remove = vi.fn();
  const api = { getTree: vi.fn(async () => [{ id: '0', title: '', children: [{ id: '1', title: 'Managed', dateLastUsed: 123, folderType: 'managed', syncing: false, unmodifiable: 'managed' }] }]), get: vi.fn(async () => [{ id: '1', title: 'Folder' }]), remove } as unknown as typeof chrome.bookmarks;
  const repository = new BrowserBookmarksRepository(api);
  const nodes = await repository.getTree();
  expect(nodes[0].children![0]).not.toHaveProperty('dateLastUsed');
  expect(nodes[0].children![0].syncing).toBe(false);
  await expect(repository.removeLink('1')).rejects.toThrow('never a folder'); expect(remove).not.toHaveBeenCalled();
});
