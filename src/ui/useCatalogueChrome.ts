import { useLayoutEffect, useRef } from 'react';

/** Compact only the painted chrome; reserve its removed padding in flow.
 * Scroll thresholds are independent of the shrinking chrome's geometry. */
export function useCatalogueChrome() {
  const chrome = useRef<HTMLDivElement>(null);
  const reservation = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = chrome.current, space = reservation.current;
    if (!element || !space) return;
    const catalogue = element.parentElement!;
    const nav = element.querySelector<HTMLElement>('.catalogue-navigation')!;
    const search = element.querySelector<HTMLElement>('.search-mode');
    catalogue.querySelectorAll<HTMLElement>('.section-slot:not(.is-open) > .section-sheet > .section-header').forEach(header => { delete header.dataset.stuck; header.style.minHeight = ''; });
    const measure = () => {
      const compact = element.dataset.compact === 'true';
      const style = getComputedStyle(nav);
      const removed = compact ? Math.max(0, 2 * parseFloat(style.getPropertyValue('--navigation-rest-padding')) - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)) + (search ? 22 : 0) : 0;
      space.style.height = `${removed}px`;
      catalogue.style.setProperty('--navigation-height', `${getComputedStyle(element).height}`);
      for (const section of catalogue.querySelectorAll<HTMLElement>('.section-slot.is-open')) {
        const header = section.querySelector<HTMLElement>('.section-sheet > .section-header')!;
        const stuck = section.getBoundingClientRect().top < element.getBoundingClientRect().bottom - 1;
        header.dataset.stuck = String(stuck);
        const heading = header.querySelector('h2')!;
        const headingStyle = getComputedStyle(heading);
        section.style.setProperty('--sticky-heading-height', headingStyle.height);
        const removedPadding = parseFloat(headingStyle.getPropertyValue('--section-padding-start')) + parseFloat(headingStyle.getPropertyValue('--section-padding-end')) - parseFloat(headingStyle.paddingTop) - parseFloat(headingStyle.paddingBottom);
        header.style.minHeight = stuck ? `${Math.max(parseFloat(headingStyle.getPropertyValue('--header-height')), parseFloat(headingStyle.height) + removedPadding)}px` : '';

      }
    };
    const position = () => {
      // A fixed document threshold plus hysteresis avoids a compact/expanded
      // feedback loop. Neither chrome padding nor footer height determines it.
      const top = catalogue.getBoundingClientRect().top;
      const before = element.dataset.compact === 'true';
      element.dataset.compact = String(before ? top < -1 : top < -32);
      measure();
    };
    const observer = new ResizeObserver(position);
    observer.observe(element);
    catalogue.querySelectorAll('.is-open .section-header h2').forEach(heading => observer.observe(heading));
    position();
    window.addEventListener('scroll', position, { passive: true });
    window.addEventListener('resize', position);
    return () => { observer.disconnect(); window.removeEventListener('scroll', position); window.removeEventListener('resize', position); };
  });
  return { chrome, reservation };
}
