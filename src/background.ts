import { BrowserBookmarksRepository } from './browser/bookmarks';
import { BrowserMetadataRepository } from './browser/metadata';
import { DashboardService } from './core/service';
import type { Command } from './core/model';

const service = new DashboardService(new BrowserBookmarksRepository(), new BrowserMetadataRepository(), {
  extensionId: chrome.runtime.id, version: chrome.runtime.getManifest().version,
  quotas: { bytes: chrome.storage.sync.QUOTA_BYTES, perItem: chrome.storage.sync.QUOTA_BYTES_PER_ITEM, items: chrome.storage.sync.MAX_ITEMS, writesPerMinute: chrome.storage.sync.MAX_WRITE_OPERATIONS_PER_MINUTE, writesPerHour: chrome.storage.sync.MAX_WRITE_OPERATIONS_PER_HOUR },
});
// One writer for all New Tab pages in this profile; rejected work never poisons the queue.
let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const next = queue.then(work);
  queue = next.catch(() => undefined);
  return next;
}
function notify() { void chrome.runtime.sendMessage({ event: 'dashboard-changed' }).catch(() => undefined); }
function refresh(reason: string) {
  void enqueue(() => service.snapshot(reason)).then(notify).catch(error => { console.error(reason, error); notify(); });
}
// Register synchronously at module evaluation, before any async initialization.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !message?.command) return false;
  void enqueue(() => service.command(message.command as Command)).then(
    snapshot => { sendResponse({ ok: true, snapshot }); if (message.command.type !== 'snapshot') notify(); },
    error => { sendResponse({ ok: false, error: String(error) }); notify(); },
  );
  return true;
});
chrome.bookmarks.onCreated.addListener(() => refresh('bookmarks.created'));
chrome.bookmarks.onChanged.addListener(() => refresh('bookmarks.changed'));
chrome.bookmarks.onMoved.addListener(() => refresh('bookmarks.moved'));
chrome.bookmarks.onChildrenReordered.addListener(() => refresh('bookmarks.reordered'));
chrome.bookmarks.onImportBegan.addListener(() => refresh('bookmarks.import-began'));
chrome.bookmarks.onImportEnded.addListener(() => refresh('bookmarks.import-ended'));
chrome.bookmarks.onRemoved.addListener((id, info) => {
  const ids: string[] = [id];
  const collect = (node: chrome.bookmarks.BookmarkTreeNode) => {
    ids.push(node.id);
    for (const child of node.children ?? []) collect(child);
  };
  collect(info.node);
  void enqueue(() => service.removed(ids)).then(notify).catch(error => { console.error('Removal reconciliation failed', error); notify(); });
});
chrome.storage.onChanged.addListener((_changes, area) => { if (area === 'sync') refresh('storage.sync.changed (origin unknown)'); });
chrome.runtime.onStartup.addListener(() => refresh('browser startup'));
chrome.runtime.onInstalled.addListener(() => refresh('extension installed/updated'));
