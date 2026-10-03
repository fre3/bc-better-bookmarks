import { useLayoutEffect, useState, type RefObject } from 'react';

/** The footer's upward dither can conceal part of the final line. Require at
 * least one full readable line; the remaining room must never cause reflow. */
export function finalPeekHeight(available: number, line: number, shadow: number): number {
  if (available - shadow < line) return 0;
  return Math.min(2.5 * line, available);
}
export function usePeekRoom(slot: RefObject<HTMLElement | null>, active: boolean, final: boolean) {
  const [height, setHeight] = useState<number>();
  useLayoutEffect(() => {
    const section = slot.current;
    const footer = section?.closest('.catalogue')?.querySelector<HTMLElement>('.catalogue-footer');
    const flow = section?.querySelector<HTMLElement>('.catalogue-flow');
    if (!active || !final || !section || !footer || !flow) return;
    const header = section.querySelector<HTMLElement>('.section-sheet > .section-header')!;
    const update = () => {
      const line = parseFloat(getComputedStyle(flow).lineHeight);
      const shadow = Math.abs(parseFloat(getComputedStyle(footer, '::before').top));
      const room = footer.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
      const next = finalPeekHeight(room, line, shadow);
      setHeight(previous => previous === next ? previous : next);
    };
    const observer = new ResizeObserver(update);
    observer.observe(section.closest('.catalogue')!); observer.observe(section.parentElement!);
    observer.observe(header); observer.observe(footer);
    document.fonts.addEventListener('loadingdone', update);
    update();
    return () => { observer.disconnect(); document.fonts.removeEventListener('loadingdone', update); };
  }, [active, final, slot]);
  return final ? height : undefined;
}
