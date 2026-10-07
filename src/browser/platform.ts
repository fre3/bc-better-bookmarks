/** Browser identity only; no Workspace/active-window inference. */
export function browserFamily(userAgent = globalThis.navigator?.userAgent ?? ''): 'edge' | 'chrome' | 'unknown' {
  return /Edg\//.test(userAgent) ? 'edge' : /Chrome\//.test(userAgent) ? 'chrome' : 'unknown';
}
export function shortcutSettingsAddress() { return `${browserFamily() === 'edge' ? 'edge' : 'chrome'}://extensions/shortcuts`; }
export function browserLabel() { return browserFamily() === 'edge' ? 'Microsoft Edge' : browserFamily() === 'chrome' ? 'Chrome / Chromium' : 'Chromium-compatible browser'; }
