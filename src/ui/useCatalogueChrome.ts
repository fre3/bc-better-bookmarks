import { useLayoutEffect, useRef } from 'react';

/** Measure stable rows only. Native sticky positioning consumes the surrounding
 * whitespace; scroll never changes padding, height, state or document position. */
export function useCatalogueChrome() {
  const chrome = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = chrome.current;
    if (!element) return;
    let connected = true;
    const catalogue = element.parentElement!;
    const measure = () => {
      if (!connected) return;
      const css = getComputedStyle(element);
      catalogue.style.setProperty('--navigation-height', `${parseFloat(css.height) - parseFloat(css.paddingTop)}px`);
      for (const section of catalogue.querySelectorAll<HTMLElement>('.section-slot.is-open')) {
        const heading = section.querySelector<HTMLElement>('.section-header h2')!;
        section.style.setProperty('--sticky-heading-height', getComputedStyle(heading).height);
      }
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    catalogue.querySelectorAll('.is-open .section-header h2').forEach(heading => observer.observe(heading));
    measure();
    return () => { connected = false; observer.disconnect(); };
  });
  return { chrome };
}
