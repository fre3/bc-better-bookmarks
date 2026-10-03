import { useLayoutEffect, useRef } from 'react';

/** Finish the copied sheet at an intact stack boundary, not through a real label. */
export function usePeekCoverage(active: boolean) {
  const slot = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const section = slot.current;
    if (!active || !section) return;
    const content = section.querySelector<HTMLElement>('.section-content')!;
    const cover = section.querySelector<HTMLElement>('.peek-successor')!;
    const label = cover.querySelector<HTMLElement>('.section-header');
    const update = () => {
      const top = cover.getBoundingClientRect().top;
      const minimum = label?.getBoundingClientRect().height ?? parseFloat(getComputedStyle(cover).getPropertyValue('--header-height'));
      const minimumBottom = top + minimum;
      let bottom = minimumBottom;
      for (let sibling = section.nextElementSibling; sibling; sibling = sibling.nextElementSibling) {
        if (!(sibling instanceof HTMLElement) || !sibling.matches('.section-slot')) continue;
        const sheet = sibling.querySelector<HTMLElement>('.section-sheet')!;
        const shadow = getComputedStyle(sheet, '::before');
        const boundary = sheet.getBoundingClientRect().top;
        // A real header's final shadow-height strip is overlapped by the next
        // sheet. The copy needs the same exposed area, not another full header.
        if (boundary >= minimumBottom) {
          bottom = boundary + parseFloat(shadow.top);
          break;
        }
        // If there is no later boundary, finish covering the final real header.
        const header = sheet.querySelector<HTMLElement>('.section-header')!;
        bottom = Math.max(bottom, header.getBoundingClientRect().bottom);
      }
      cover.style.height = `${bottom - top}px`;
    };
    // The animated body's ResizeObserver runs before paint on entry and exit.
    // Measure the copy's label, never its extended height, to avoid feedback.
    const observer = new ResizeObserver(update);
    observer.observe(content);
    if (label) observer.observe(label);
    if (section.parentElement) observer.observe(section.parentElement);
    update();
    return () => observer.disconnect();
  }, [active]);
  return slot;
}
