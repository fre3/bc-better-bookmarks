/** Authoritative device-local preference. The Web Storage copy is only a
 * synchronous first-paint cache; bookmark metadata never contains appearance. */
export const APPEARANCE_KEY = 'ui:appearance';
export const APPEARANCE_CACHE = 'ui:appearance-cache';
export type Appearance = 'system' | 'light' | 'dark';
export interface AppearanceCommand { event: 'set-appearance'; appearance: Appearance }
export function appearancePreference(value: unknown): Appearance {
  return value === 'light' || value === 'dark' ? value : 'system';
}
export function applyAppearance(value: Appearance) {
  document.documentElement.dataset.appearance = value;
  try { localStorage.setItem(APPEARANCE_CACHE, value); } catch { /* CSS/system fallback remains usable without the cache. */ }
}
export async function readAppearance(): Promise<Appearance> {
  return appearancePreference((await chrome.storage.local.get(APPEARANCE_KEY))[APPEARANCE_KEY]);
}
export async function saveAppearance(value: Appearance): Promise<void> {
  await chrome.storage.local.set({ [APPEARANCE_KEY]: value });
}
export async function setAppearance(value: Appearance): Promise<void> {
  const message: AppearanceCommand = { event: 'set-appearance', appearance: value };
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) throw new Error(response?.error ?? 'Could not save appearance.');
}
export function onAppearance(callback: (value: Appearance) => void): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && APPEARANCE_KEY in changes) callback(appearancePreference(changes[APPEARANCE_KEY].newValue));
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
/** Subscribe before reading so a slow initial read cannot replace a newer
 * cross-tab selection. Resolves before React mounts, with no artificial delay. */
export async function initializeAppearance(): Promise<void> {
  let changed = false;
  onAppearance(value => { changed = true; applyAppearance(value); });
  try { const value = await readAppearance(); if (!changed) applyAppearance(value); }
  catch { /* Keep the startup cache/system palette if local storage is unavailable. */ }
}
