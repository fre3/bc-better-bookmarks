/** Disposable UI routing only; no bookmark, metadata or mutation commands. */
export const DASHBOARD_SEARCH_COMMAND = 'open-dashboard-search';
export interface DashboardTab { id: number; windowId: number; active: boolean; dashboard: boolean }
export interface SearchIntent { id: string; allBookmarks: boolean }
export interface SearchRequest extends SearchIntent { tabId: number; windowId: number }
export type SearchDelivery = 'accepted' | 'blocked' | 'not-ready';
export interface DashboardLaunchBrowser {
  tabs(windowId: number): Promise<DashboardTab[]>;
  create(windowId: number): Promise<number>;
  activate(tabId: number): Promise<void>;
  focused(windowId: number): Promise<boolean>;
  pending(): Promise<SearchRequest[]>;
  save(request: SearchRequest): Promise<void>;
  remove(tabId: number): Promise<void>;
  deliver(request: SearchRequest): Promise<SearchDelivery>;
}

export class DashboardLauncher {
  private queue: Promise<unknown> = Promise.resolve();
  private opening = new Map<number, Promise<void>>();
  constructor(private browser: DashboardLaunchBrowser, private token: () => string = () => crypto.randomUUID()) {}
  private enqueue(work: () => Promise<void>) {
    const next = this.queue.then(work);
    this.queue = next.catch(() => undefined);
    return next;
  }
  open(windowId: number, originTabId?: number): Promise<void> {
    const running = this.opening.get(windowId);
    if (running) return running;
    const work = this.enqueue(async () => {
      const tabs = await this.browser.tabs(windowId);
      const origin = originTabId ?? tabs.find(tab => tab.active)?.id;
      const existing = tabs.find(tab => tab.id === origin && tab.dashboard) ?? tabs.find(tab => tab.dashboard);
      const tabId = existing?.id ?? await this.browser.create(windowId);
      // The launch is tied to the invoking window, never the most recent window
      // at some later point in readiness handling.
      if (existing) await this.browser.activate(tabId);
      const pending = (await this.browser.pending()).find(request => request.tabId === tabId);
      await this.browser.save({ id: this.token(), tabId, windowId, allBookmarks: origin !== tabId || pending?.allBookmarks === true });
      await this.deliver(tabId);
    });
    this.opening.set(windowId, work);
    void work.finally(() => this.opening.delete(windowId)).catch(() => undefined);
    return work;
  }
  ready(tabId: number) { return this.enqueue(() => this.deliver(tabId)); }
  cancel(tabId: number) { return this.enqueue(() => this.browser.remove(tabId)); }
  activated(tabId: number, windowId: number) {
    return this.enqueue(async () => {
      for (const request of await this.browser.pending()) {
        if (request.windowId === windowId && request.tabId !== tabId) await this.browser.remove(request.tabId);
      }
    });
  }
  private async deliver(tabId: number) {
    const request = (await this.browser.pending()).find(item => item.tabId === tabId);
    if (!request) return;
    const tab = (await this.browser.tabs(request.windowId)).find(item => item.id === tabId);
    // If the user left while loading, cancel rather than stealing focus later.
    if (!tab?.dashboard || !tab.active || !await this.browser.focused(request.windowId)) {
      await this.browser.remove(tabId); return;
    }
    const result = await this.browser.deliver(request);
    if (result !== 'not-ready') await this.browser.remove(tabId);
  }
}
