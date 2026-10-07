import { EditFailure } from '../core/edit-failure';
import type { Command, Snapshot } from '../core/model';
export async function sendCommand(command: Command): Promise<Snapshot> {
  if (!globalThis.chrome?.runtime?.id) throw new Error('Load the dist folder as an unpacked extension in Chrome or Edge, then open a New Tab. Browser APIs are unavailable on a normal website.');
  const response = await chrome.runtime.sendMessage({ command });
  if (!response?.ok) {
    const message = response?.error ?? 'No response from the extension worker. Reload the extension.';
    if (response?.progress) throw new EditFailure(message, response.progress);
    throw new Error(message);
  }
  return response.snapshot as Snapshot;
}
export function onDashboardChanged(callback: () => void): () => void {
  if (!globalThis.chrome?.runtime?.onMessage) return () => undefined;
  const listener = (message: { event?: string }) => { if (message.event === 'dashboard-changed') callback(); };
  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}
