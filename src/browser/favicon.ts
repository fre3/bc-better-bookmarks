import { safeHref } from '../core/logic';

// Browser-local MV3 endpoint; never send Favorites to an external icon service.
export function faviconUrl(pageUrl: string): string | undefined {
  const href = safeHref(pageUrl);
  if (!href || !globalThis.chrome?.runtime?.id) return undefined;
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', href);
  url.searchParams.set('size', '32');
  return url.href;
}
