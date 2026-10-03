/** Device-local UI preference; deliberately separate from bookmark metadata. */
export const AUTO_SCROLL_PEEK_KEY = 'ui:auto-scroll-peek';
export interface PeekPreferenceCommand { event: 'set-peek-preference'; enabled: boolean }
export function peekPreference(value: unknown): boolean { return typeof value === 'boolean' ? value : true; }
export async function readPeekPreference(): Promise<boolean> {
  return peekPreference((await chrome.storage.local.get(AUTO_SCROLL_PEEK_KEY))[AUTO_SCROLL_PEEK_KEY]);
}
export async function savePeekPreference(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({ [AUTO_SCROLL_PEEK_KEY]: enabled });
}
export async function setPeekPreference(enabled: boolean): Promise<void> {
  const command: PeekPreferenceCommand = { event: 'set-peek-preference', enabled };
  const response = await chrome.runtime.sendMessage(command);
  if (!response?.ok) throw new Error(response?.error ?? 'Could not save preview preference.');
}
export function onPeekPreference(callback: (enabled: boolean) => void): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && AUTO_SCROLL_PEEK_KEY in changes) callback(peekPreference(changes[AUTO_SCROLL_PEEK_KEY].newValue));
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
