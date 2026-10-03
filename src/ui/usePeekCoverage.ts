import { useLayoutEffect, useRef, useState } from 'react';
import { labelIsCovered } from './peek-summary';
import { peekCoverBottom, type CoveredSheet } from './peek-coverage';

/** Cover partial headers without extending the lip across an open sheet. */
export function usePeekCoverage(active: boolean) {
  const slot = useRef<HTMLElement>(null);
  const [coveredIds, setCoveredIds] = useState<string[]>([]);
  useLayoutEffect(() => {
    const section = slot.current;
    if (!active || !section) return;
    const content = section.querySelector<HTMLElement>('.section-content')!;
    const cover = section.querySelector<HTMLElement>('.peek-successor');
    if (!cover) return; // Final preview ends directly at the real footer edge.
    const label = cover.querySelector<HTMLElement>('.section-header');
    const update = () => {
      const top = cover.getBoundingClientRect().top;
      const minimum = label?.getBoundingClientRect().height ?? parseFloat(getComputedStyle(cover).getPropertyValue('--header-height'));
      const sheets: CoveredSheet[] = [];
      let openFlow: HTMLElement | null = null;
      for (let sibling = section.nextElementSibling; sibling; sibling = sibling.nextElementSibling) {
        if (!(sibling instanceof HTMLElement) || !sibling.matches('.section-slot')) continue;
        const sheet = sibling.querySelector<HTMLElement>('.section-sheet')!;
        const bounds = sheet.getBoundingClientRect();
        const header = sheet.querySelector<HTMLElement>('.section-header')!;
        const open = sibling.classList.contains('is-open');
        sheets.push({
          top: bounds.top, bottom: bounds.bottom,
          // Use the header's flow extent, not its displaced sticky position.
          headerBottom: bounds.top + header.getBoundingClientRect().height,
          shadowTop: bounds.top + parseFloat(getComputedStyle(sheet, '::before').top),
          open,
        });
        if (open && bounds.top < top + minimum && bounds.bottom > top + minimum) {
          openFlow = sheet.querySelector<HTMLElement>('.catalogue-flow');
        }
        if (bounds.top >= top + minimum || (open && bounds.bottom > top + minimum)) break;
      }
      let bottom = peekCoverBottom(top, minimum, sheets);
      // When the lip ends in open prose, finish only an intersected text line.
      // Otherwise a few pixels of its descenders can leak below the opaque lip.
      // Inline fragments are in flow order: stop before the next complete line,
      // rather than measuring the rest of a potentially enormous open card.
      if (openFlow) {
        fragments: for (const text of openFlow.querySelectorAll('.bookmark-text, .folder-title')) {
          for (const fragment of text.getClientRects()) {
            if (fragment.top >= bottom) break fragments;
            if (fragment.bottom > bottom) bottom = fragment.bottom;
          }
        }
      }
      cover.style.height = `${bottom - top}px`;
      cover.style.setProperty('--peek-label-height', `${minimum}px`);
      const overlayTop = content.getBoundingClientRect().top;
      const covered: string[] = [];
      for (let sibling = section.nextElementSibling; sibling; sibling = sibling.nextElementSibling) {
        if (!(sibling instanceof HTMLElement) || !sibling.matches('.section-slot')) continue;
        const heading = sibling.querySelector('.section-sheet > .section-header .section-heading-text');
        if (!heading) continue;
        const bounds = heading.getBoundingClientRect();
        if (bounds.top >= bottom) break;
        if (labelIsCovered(bounds.top, bounds.bottom, overlayTop, bottom) && sibling.dataset.sectionId) covered.push(sibling.dataset.sectionId);
      }
      setCoveredIds(previous => previous.length === covered.length && previous.every((id, i) => id === covered[i]) ? previous : covered);
    };
    // The animated body's ResizeObserver runs before paint on entry and exit.
    // Measure the copy's label, never its extended height, to avoid feedback.
    const observer = new ResizeObserver(update);
    observer.observe(content);
    if (label) observer.observe(label);
    if (section.parentElement) observer.observe(section.parentElement);
    document.fonts.addEventListener('loadingdone', update);
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => { observer.disconnect(); document.fonts.removeEventListener('loadingdone', update); window.removeEventListener('scroll', update); };
  }, [active]);
  return { slot, coveredIds };
}
