import type { DashboardLaunchBrowser, SearchDelivery, SearchIntent, SearchRequest } from '../core/dashboard-launch';
import { DASHBOARD_SEARCH_COMMAND } from '../core/dashboard-launch';

const PREFIX = 'dashboard-search:';
export function dashboardUrl(url?: string): boolean {
  if (!url) return false;
  const base = url.split(/[?#]/u)[0];
  return base === chrome.runtime.getURL('index.html') || base === chrome.runtime.getURL('search.html');
}
export const dashboardLaunchBrowser: DashboardLaunchBrowser = {
  async tabs(windowId) {
    const [tabs, contexts] = await Promise.all([
      chrome.tabs.query({ windowId }),
      chrome.runtime.getContexts({ contextTypes: ['TAB'], windowIds: [windowId], frameIds: [0] }),
    ]);
    const own = new Set(contexts.filter(context => dashboardUrl(context.documentUrl)).map(context => context.tabId));
    return tabs.filter(tab => tab.id !== undefined).map(tab => ({
      id: tab.id!, windowId: tab.windowId, active: tab.active,
      // Contexts recognize our New Tab behind Edge's virtual edge://newtab URL;
      // URL/pendingUrl also recognize explicit pages while loading/discarded.
      dashboard: dashboardUrl(tab.pendingUrl ?? tab.url) || (!tab.pendingUrl && own.has(tab.id!)),
    }));
  },
  async create(windowId) {
    const tab = await chrome.tabs.create({ windowId, active: true, url: chrome.runtime.getURL('search.html') });
    if (tab.id === undefined) throw new Error('Dashboard tab creation returned no tab ID.');
    return tab.id;
  },
  async activate(tabId) { await chrome.tabs.update(tabId, { active: true }); },
  async focused(windowId) { return (await chrome.windows.get(windowId)).focused; },
  async pending() {
    const values = await chrome.storage.session.get(null);
    return Object.entries(values).filter(([key]) => key.startsWith(PREFIX)).map(([, value]) => value as SearchRequest);
  },
  async save(request) { await chrome.storage.session.set({ [`${PREFIX}${request.tabId}`]: request }); },
  async remove(tabId) { await chrome.storage.session.remove(`${PREFIX}${tabId}`); },
  async deliver(request) {
    try {
      const response = await chrome.runtime.sendMessage({ event: 'dashboard-search', ...request });
      return response?.status === 'accepted' || response?.status === 'blocked' ? response.status : 'not-ready';
    } catch { return 'not-ready'; } // The mounted page's ready handshake will retry.
  },
};

/** Read only: never restore a shortcut the user removed or override conflicts. */
export async function dashboardShortcut(): Promise<string | undefined> {
  return (await chrome.commands.getAll()).find(command => command.name === DASHBOARD_SEARCH_COMMAND)?.shortcut;
}
export function openShortcutSettings() { void chrome.tabs.create({ url: 'edge://extensions/shortcuts' }); }

/** Register before announcing readiness, so requests cannot fall in a load gap. */
export function onDashboardSearch(callback: (request: SearchIntent) => SearchDelivery): () => void {
  if (!globalThis.chrome?.runtime?.id) return () => undefined;
  let disposed = false;
  let tabId: number | undefined;
  const listener = (message: { event?: string; tabId?: number; id?: string; allBookmarks?: boolean }, sender: chrome.runtime.MessageSender, respond: (value: unknown) => void) => {
    if (sender.id !== chrome.runtime.id || message.event !== 'dashboard-search' || tabId === undefined || message.tabId !== tabId || typeof message.id !== 'string') return false;
    respond({ status: callback({ id: message.id, allBookmarks: message.allBookmarks === true }) });
    return false;
  };
  chrome.runtime.onMessage.addListener(listener);
  void chrome.tabs.getCurrent().then(tab => {
    if (disposed || tab?.id === undefined) return;
    tabId = tab.id;
    return chrome.runtime.sendMessage({ event: 'dashboard-search-ready' });
  }).catch(() => undefined);
  return () => { disposed = true; chrome.runtime.onMessage.removeListener(listener); };
}

const HANDOFF = 'dashboard-search-handoff';
/** Renderer navigation, only after an explicit command; ordinary New Tab is untouched. */
export function moveToSearchPage(state: unknown): boolean {
  if (location.protocol !== 'chrome-extension:' || document.hasFocus()) return false;
  // If storage fails, do not navigate and lose the existing catalogue state.
  sessionStorage.setItem(HANDOFF, JSON.stringify(state));
  // A distinct document navigation transfers browser focus; a hash/history-only
  // change or tabs.update(active: true) on an already active tab does not.
  try { location.replace(`${chrome.runtime.getURL('search.html')}?launch=${crypto.randomUUID()}`); }
  catch (error) { sessionStorage.removeItem(HANDOFF); throw error; }
  return true;
}
export function takeSearchHandoff(): unknown {
  if (location.protocol !== 'chrome-extension:' || location.pathname !== '/search.html') return;
  try {
    const saved = sessionStorage.getItem(HANDOFF);
    sessionStorage.removeItem(HANDOFF);
    return saved ? JSON.parse(saved) : undefined;
  } catch { return undefined; }
}
