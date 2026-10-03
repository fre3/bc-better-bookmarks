import { useLayoutEffect, useRef } from 'react';

function firstTextFragment(link: Element) {
  const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const text = walker.currentNode as Text;
    if (!text.parentElement?.closest('.bookmark-text')) continue;
    const start = text.data.search(/\S/u);
    if (start < 0) continue;
    const range = document.createRange();
    range.setStart(text, start);
    range.setEnd(text, text.length);
    const fragment = [...range.getClientRects()].find(rect => rect.width > 0 && rect.height > 0);
    if (fragment) return fragment;
  }
}

/** One observer per rendered section; measure only revealed annotations. */
export function useCatalogueAnnotations() {
  const flow = useRef<HTMLDivElement>(null);
  // Reconnect after rendering too: an expansion/search can move a first fragment
  // without changing the section's overall size.
  useLayoutEffect(() => {
    const container = flow.current;
    if (!container) return;
    let connected = true;
    const update = () => {
      if (!connected) return;
      const origin = container.getBoundingClientRect();
      for (const item of container.querySelectorAll('.bookmark-item:hover, .bookmark-item:focus-within, .bookmark-item.tag-match')) {
        const annotation = item.querySelector<HTMLElement>('.item-annotation');
        const link = item.querySelector('.bookmark-title');
        if (!annotation || !link) continue;
        const fragment = firstTextFragment(link);
        if (!fragment) continue;
        annotation.style.left = `${fragment.left - origin.left}px`;
        annotation.style.top = `${fragment.bottom - origin.top + 2}px`;
      }
    };
    const observer = new ResizeObserver(update);
    observer.observe(container);
    container.addEventListener('pointerover', update);
    container.addEventListener('focusin', update);
    container.addEventListener('load', update, true);
    document.fonts.addEventListener('loadingdone', update);
    void document.fonts.ready.then(update);
    update();
    return () => {
      connected = false;
      observer.disconnect();
      container.removeEventListener('pointerover', update);
      container.removeEventListener('focusin', update);
      container.removeEventListener('load', update, true);
      document.fonts.removeEventListener('loadingdone', update);
    };
  });
  return flow;
}
