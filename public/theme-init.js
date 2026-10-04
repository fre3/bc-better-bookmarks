/* global localStorage, document */
/* Synchronous first-paint cache only. chrome.storage.local is authoritative;
   src/browser/appearance.ts reconciles it before mounting the dashboard. */
try {
  const appearance = localStorage.getItem('ui:appearance-cache');
  const value = appearance === 'light' || appearance === 'dark' ? appearance : 'system';
  document.documentElement.dataset.appearance = value;
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', value === 'system' ? 'light dark' : value);
} catch { /* The stylesheet follows the system when the cache is unavailable. */ }
