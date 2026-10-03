import { afterEach, describe, expect, it, vi } from 'vitest';
import { DashboardLauncher } from '../src/core/dashboard-launch';
import type { DashboardLaunchBrowser, DashboardTab, SearchDelivery, SearchRequest } from '../src/core/dashboard-launch';
import { dashboardLaunchBrowser, dashboardShortcut, dashboardUrl } from '../src/browser/dashboard-launch';

function fixture(initial: DashboardTab[] = []) {
  const tabs = [...initial], pending = new Map<number, SearchRequest>();
  let outcome: SearchDelivery = 'accepted', focused = true, nextId = 20, token = 0;
  const browser: DashboardLaunchBrowser = {
    tabs: vi.fn(async windowId => tabs.filter(tab => tab.windowId === windowId)),
    create: vi.fn(async windowId => {
      tabs.filter(tab => tab.windowId === windowId).forEach(tab => { tab.active = false; });
      tabs.push({ id: nextId++, windowId, active: true, dashboard: true });
      return nextId - 1;
    }),
    activate: vi.fn(async id => {
      const target = tabs.find(tab => tab.id === id)!;
      tabs.filter(tab => tab.windowId === target.windowId).forEach(tab => { tab.active = tab === target; });
    }),
    focused: vi.fn(async () => focused),
    pending: vi.fn(async () => [...pending.values()]),
    save: vi.fn(async request => { pending.set(request.tabId, request); }),
    remove: vi.fn(async id => { pending.delete(id); }),
    deliver: vi.fn(async () => outcome),
  };
  const make = () => new DashboardLauncher(browser, () => `request-${++token}`);
  return { browser, tabs, pending, launcher: make(), make, outcome: (value: SearchDelivery) => { outcome = value; }, focused: (value: boolean) => { focused = value; } };
}
const tab = (id: number, windowId = 1, active = false, dashboard = true): DashboardTab => ({ id, windowId, active, dashboard });
afterEach(() => vi.unstubAllGlobals());

describe('dashboard command routing and readiness', () => {
  it('prefers the current dashboard, without creating or navigating', async () => {
    const f = fixture([tab(1), tab(2, 1, true)]);
    await f.launcher.open(1);
    expect(f.browser.activate).toHaveBeenCalledWith(2);
    expect(f.browser.create).not.toHaveBeenCalled();
    expect(f.browser.deliver).toHaveBeenCalledWith({ id: 'request-1', tabId: 2, windowId: 1 });
    expect(f.pending.size).toBe(0);
  });
  it('reuses a same-window dashboard and leaves the original site intact', async () => {
    const f = fixture([tab(1, 1, true, false), tab(2), tab(3, 2)]);
    await f.launcher.open(1);
    expect(f.tabs[0]).toEqual(tab(1, 1, false, false));
    expect(f.browser.activate).toHaveBeenCalledWith(2);
    expect(f.browser.create).not.toHaveBeenCalled();
  });
  it('creates in the invoking window rather than switching to another window', async () => {
    const f = fixture([tab(1, 1, true, false), tab(2, 2)]);
    await f.launcher.open(1);
    expect(f.browser.create).toHaveBeenCalledExactlyOnceWith(1);
    expect(f.tabs.find(item => item.id === 2)).toEqual(tab(2, 2));
  });
  it('coalesces rapid invocations and reuses the still-loading tab on later requests', async () => {
    const f = fixture(); f.outcome('not-ready');
    await Promise.all(Array.from({ length: 20 }, () => f.launcher.open(1)));
    expect(f.browser.create).toHaveBeenCalledTimes(1);
    expect(f.browser.deliver).toHaveBeenCalledTimes(1);
    await f.launcher.open(1);
    expect(f.browser.create).toHaveBeenCalledTimes(1);
    expect(f.pending.size).toBe(1);
  });
  it('keeps a pending request until UI readiness, including worker restart', async () => {
    const f = fixture(); f.outcome('not-ready');
    await f.launcher.open(1); expect(f.pending.size).toBe(1);
    const coldWorker = f.make(); f.outcome('accepted');
    await coldWorker.ready(20); await coldWorker.ready(20);
    expect(f.browser.deliver).toHaveBeenCalledTimes(2); // one not-ready, one accepted
    expect(f.pending.size).toBe(0);
  });
  it('serializes an early readiness handshake behind tab creation and request storage', async () => {
    const f = fixture();
    await Promise.all([f.launcher.open(1), f.launcher.ready(20)]);
    expect(f.browser.deliver).toHaveBeenCalledTimes(1);
  });
  it('consumes Manage-blocked requests without retrying or discarding edits', async () => {
    const f = fixture([tab(1, 1, true)]); f.outcome('blocked');
    await f.launcher.open(1); await f.launcher.ready(1);
    expect(f.browser.deliver).toHaveBeenCalledTimes(1);
    expect(f.pending.size).toBe(0);
  });
  it.each(['tab', 'window', 'navigation', 'close'] as const)('cancels stale focus after leaving via %s', async how => {
    const f = fixture([tab(1, 1, true), tab(2)]); f.outcome('not-ready');
    await f.launcher.open(1);
    if (how === 'tab') await f.launcher.activated(2, 1);
    if (how === 'window') f.focused(false);
    if (how === 'navigation') f.tabs[0].dashboard = false;
    if (how === 'close') await f.launcher.cancel(1);
    await f.launcher.ready(1);
    expect(f.browser.deliver).toHaveBeenCalledTimes(1);
    expect(f.pending.size).toBe(0);
  });
  it('does not let a rejected launch poison later invocations', async () => {
    const f = fixture(); vi.mocked(f.browser.create).mockRejectedValueOnce(new Error('window closed'));
    await expect(f.launcher.open(1)).rejects.toThrow('window closed');
    await f.launcher.open(1); expect(f.browser.deliver).toHaveBeenCalledTimes(1);
  });
});

describe('browser adapter scope and assignment', () => {
  it('recognizes our NTP context and loading explicit route, not an unrelated New Tab provider', async () => {
    vi.stubGlobal('chrome', {
      runtime: { getURL: (path: string) => `chrome-extension://ours/${path}`, getContexts: vi.fn(async () => [{ tabId: 1, documentUrl: 'chrome-extension://ours/index.html' }]) },
      tabs: { query: vi.fn(async () => [
        { id: 1, windowId: 5, active: true, url: 'edge://newtab/' },
        { id: 2, windowId: 5, active: false, pendingUrl: 'chrome-extension://ours/search.html' },
        { id: 3, windowId: 5, active: false, url: 'edge://newtab/' },
        { id: 4, windowId: 5, active: false, url: 'https://site.test/' },
      ]) },
    });
    expect((await dashboardLaunchBrowser.tabs(5)).map(item => item.dashboard)).toEqual([true, true, false, false]);
    expect(chrome.tabs.query).toHaveBeenCalledWith({ windowId: 5 });
    expect(dashboardUrl('chrome-extension://ours/index.html?x=1')).toBe(true);
    expect(dashboardUrl('https://ours/index.html')).toBe(false);
  });
  it.each(['Ctrl+Shift+B', 'Ctrl+B', ''])('reports actual assignment %j without attempting to alter it', async shortcut => {
    vi.stubGlobal('chrome', { commands: { getAll: vi.fn(async () => [{ name: 'open-dashboard-search', shortcut }]) } });
    expect(await dashboardShortcut()).toBe(shortcut);
    expect(chrome.commands.getAll).toHaveBeenCalledTimes(1);
  });
});

describe('catalogue route handoff validation', () => {
  it('retains the query, root, expanded branch and Escape position, rejecting malformed data', async () => {
    const { catalogueHandoff } = await import('../src/ui/catalogue-handoff');
    const value = { state: { scope: 'root-work', query: 'azure #ai', openSection: 'folder-dev', expanded: ['A', 'A1'], peekEpoch: 2 }, requestId: 'r', browseScroll: 650, browseFocusId: 'folder-A1', scroll: 20 };
    expect(catalogueHandoff(JSON.parse(JSON.stringify(value)))).toEqual(value);
    for (const bad of [null, {}, { ...value, state: { ...value.state, query: null } }, { ...value, scroll: Infinity }, { ...value, state: { ...value.state, expanded: ['A', 4] } }]) expect(catalogueHandoff(bad)).toBeUndefined();
  });
});

describe('explicit search focus route', () => {
  it('keeps an already focused dashboard in place and uses a one-shot handoff when browser chrome has focus', async () => {
    const { moveToSearchPage, takeSearchHandoff } = await import('../src/browser/dashboard-launch');
    const storage = new Map<string, string>(), replace = vi.fn();
    const focus = vi.fn(() => true);
    vi.stubGlobal('document', { hasFocus: focus });
    vi.stubGlobal('location', { protocol: 'chrome-extension:', pathname: '/index.html', replace });
    vi.stubGlobal('chrome', { runtime: { getURL: (path: string) => `chrome-extension://ours/${path}` } });
    vi.stubGlobal('sessionStorage', { setItem: (key: string, value: string) => storage.set(key, value), getItem: (key: string) => storage.get(key), removeItem: (key: string) => storage.delete(key) });
    expect(moveToSearchPage({ query: 'kept' })).toBe(false);
    expect(replace).not.toHaveBeenCalled();
    focus.mockReturnValue(false);
    expect(moveToSearchPage({ query: 'kept' })).toBe(true);
    expect(replace).toHaveBeenCalledWith(expect.stringMatching(/^chrome-extension:\/\/ours\/search.html\?launch=/));
    expect(takeSearchHandoff()).toBeUndefined(); // ordinary New Tab never consumes/starts search
    vi.stubGlobal('location', { protocol: 'chrome-extension:', pathname: '/search.html' });
    expect(takeSearchHandoff()).toEqual({ query: 'kept' });
    expect(takeSearchHandoff()).toBeUndefined();
  });
  it('does not navigate if the transient catalogue state cannot be preserved', async () => {
    const { moveToSearchPage } = await import('../src/browser/dashboard-launch');
    const replace = vi.fn();
    vi.stubGlobal('document', { hasFocus: () => false });
    vi.stubGlobal('location', { protocol: 'chrome-extension:', pathname: '/index.html', replace });
    vi.stubGlobal('sessionStorage', { setItem: () => { throw new Error('unavailable'); } });
    expect(() => moveToSearchPage({})).toThrow('unavailable');
    expect(replace).not.toHaveBeenCalled();
  });
});
