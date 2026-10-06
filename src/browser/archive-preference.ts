export const SHOW_ARCHIVED_KEY = 'ui:show-archived';
export async function readArchivePreference(): Promise<boolean> { return (await chrome.storage.local.get(SHOW_ARCHIVED_KEY))[SHOW_ARCHIVED_KEY] === true; }
export async function saveArchivePreference(enabled: boolean) { await chrome.storage.local.set({ [SHOW_ARCHIVED_KEY]: enabled }); }
export async function setArchivePreference(enabled: boolean) {
  const response = await chrome.runtime.sendMessage({ event: 'set-archive-preference', enabled });
  if (!response?.ok) throw new Error(response?.error ?? 'Could not save archive visibility.');
}
export function onArchivePreference(callback: (enabled: boolean) => void) {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && SHOW_ARCHIVED_KEY in changes) callback(changes[SHOW_ARCHIVED_KEY].newValue === true);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
