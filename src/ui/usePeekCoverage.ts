import { useLayoutEffect, useRef, useState } from 'react';
import { labelIsCovered } from './peek-summary';
import { peekCoverBottom, type CoveredSheet } from './peek-coverage';
import { layoutTask } from './layout-task';

/** Cover partial headers without extending the lip across an open sheet. */
export function usePeekCoverage(active: boolean, revealing: boolean) {
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
      // Keep the first changing frame covered even if the transition's initial
      // zero-height frame produced no new resize notification. Stops with CSS.
      if (content.getAnimations().some(animation => animation.playState === 'running')) task.schedule();
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
      if (Math.abs(cover.getBoundingClientRect().height - (bottom - top)) >= .02) cover.style.height = `${bottom - top}px`;
      const labelHeight = `${minimum}px`;
      if (cover.style.getPropertyValue('--peek-label-height') !== labelHeight) cover.style.setProperty('--peek-label-height', labelHeight);
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
    // Changing the lip here synchronously would resize a sibling observed by
    // usePeekFooter at an already delivered depth. Measure current animation
    // geometry in the next frame, before the dependent footer reservation.
    const task = layoutTask(update);
    const observer = new ResizeObserver(task.schedule);
    observer.observe(content);
    if (label) observer.observe(label);
    if (section.parentElement) observer.observe(section.parentElement);
    document.fonts.addEventListener('loadingdone', task.schedule);
    window.addEventListener('scroll', task.schedule, { passive: true });
    update();
    // The first exit frame changes the CSS height before its first resize
    // delivery. Arm that frame when the reveal phase changes, not afterward.
    task.schedule();
    return () => { task.dispose(); observer.disconnect(); document.fonts.removeEventListener('loadingdone', task.schedule); window.removeEventListener('scroll', task.schedule); };
  }, [active, revealing]);
  return { slot, coveredIds };
}
