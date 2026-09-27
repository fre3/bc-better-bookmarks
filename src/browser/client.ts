import type { Command, Snapshot } from '../core/model';
export async function sendCommand(command: Command): Promise<Snapshot> {
  if (!globalThis.chrome?.runtime?.id) throw new Error('Load the dist folder as an unpacked Edge extension, then open a New Tab. Browser APIs are unavailable on a normal website.');
  const response = await chrome.runtime.sendMessage({ command });
  if (!response?.ok) throw new Error(response?.error ?? 'No response from the extension worker. Reload the extension.');
  return response.snapshot as Snapshot;
}
export function onDashboardChanged(callback: () => void): () => void {
  if (!globalThis.chrome?.runtime?.onMessage) return () => undefined;
  const listener = (message: { event?: string }) => { if (message.event === 'dashboard-changed') callback(); };
  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}
