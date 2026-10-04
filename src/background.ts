import { saveAppearance } from './browser/appearance';
import { savePeekPreference } from './browser/ui-preferences';
import { BrowserBookmarksRepository } from './browser/bookmarks';
import { BrowserMetadataRepository } from './browser/metadata';
import { DashboardService } from './core/service';
import type { Command } from './core/model';
import { storageChangeLogs } from './core/metadata-diagnostics';
import { DashboardLauncher, DASHBOARD_SEARCH_COMMAND } from './core/dashboard-launch';
import { dashboardLaunchBrowser, dashboardUrl } from './browser/dashboard-launch';

const dashboardLauncher = new DashboardLauncher(dashboardLaunchBrowser);
const launchError = (error: unknown) => console.error('Dashboard search command failed', error);
chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== DASHBOARD_SEARCH_COMMAND) return;
  // Capture the invocation's window before entering the routing queue.
  void (tab ? Promise.resolve(tab) : chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(tabs => tabs[0]))
    .then(current => { if (current && !current.incognito) return dashboardLauncher.open(current.windowId, current.id); }).catch(launchError);
});
chrome.tabs.onActivated.addListener(({ tabId, windowId }) => { void dashboardLauncher.activated(tabId, windowId).catch(launchError); });
chrome.tabs.onRemoved.addListener(tabId => { void dashboardLauncher.cancel(tabId).catch(launchError); });
chrome.tabs.onUpdated.addListener((tabId, change) => {
  if (change.url && !dashboardUrl(change.url)) void dashboardLauncher.cancel(tabId).catch(launchError);
});

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
  if (sender.id === chrome.runtime.id && message?.event === 'dashboard-search-ready' && sender.tab?.id !== undefined && sender.frameId === 0 && dashboardUrl(sender.url)) {
    void dashboardLauncher.ready(sender.tab.id).then(() => sendResponse({ ok: true }), error => sendResponse({ ok: false, error: String(error) }));
    return true;
  }
  if (sender.id === chrome.runtime.id && message?.event === 'set-peek-preference' && typeof message.enabled === 'boolean') {
    void enqueue(() => savePeekPreference(message.enabled)).then(
      () => sendResponse({ ok: true }), error => sendResponse({ ok: false, error: String(error) }),
    );
    return true;
  }
  if (sender.id === chrome.runtime.id && message?.event === 'set-appearance' && ['system', 'light', 'dark'].includes(message.appearance)) {
    void enqueue(() => saveAppearance(message.appearance)).then(
      () => sendResponse({ ok: true }), error => sendResponse({ ok: false, error: String(error) }),
    );
    return true;
  }
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
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  const entries = storageChangeLogs(changes, new Date().toISOString());
  void enqueue(() => service.syncChanged(entries)).then(notify).catch(error => { console.error('Sync change reconciliation failed', error); notify(); });
});
chrome.runtime.onStartup.addListener(() => refresh('browser startup'));
chrome.runtime.onInstalled.addListener(() => refresh('extension installed/updated'));
