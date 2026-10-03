import { useLayoutEffect, useRef, type RefObject } from 'react';

interface Point { clientX: number; clientY: number }

/** The preview stays pointer-transparent. Only a real header entry can start a
 * peek; these listeners retain an existing mouse session, never activate one. */
export function usePeekHoverRetention(active: boolean, final: boolean, slot: RefObject<HTMLElement | null>, end: () => void) {
  const point = useRef<Point | null>(null);
  const remember = (event: Point) => { point.current = { clientX: event.clientX, clientY: event.clientY }; };
  const contains = () => {
    const element = slot.current;
    const header = element?.querySelector('.section-header')?.getBoundingClientRect();
    const footer = element?.closest('.catalogue')?.querySelector('.catalogue-footer')?.getBoundingClientRect();
    const position = point.current;
    if (!header || !position) return false;
    const bottom = final && footer ? footer.top : header.bottom;
    return position.clientX >= Math.max(0, header.left) && position.clientX < Math.min(window.innerWidth, header.right)
      && position.clientY >= Math.max(0, header.top) && position.clientY < Math.min(window.innerHeight, bottom);
  };
  useLayoutEffect(() => {
    if (!active) return;
    if (!final) { if (!contains()) end(); return; }
    const check = () => { if (!contains()) end(); };
    const move = (event: PointerEvent) => { if (event.pointerType === 'mouse') { remember(event); check(); } };
    const leaveWindow = (event: PointerEvent) => { if (event.pointerType === 'mouse' && !event.relatedTarget) end(); };
    const hidden = () => { if (document.hidden) end(); };
    // Scroll can move the footer/header under a stationary pointer. Spacer and
    // content resize observations also cover reveal transitions and font reflow.
    const observer = new ResizeObserver(check);
    const catalogue = slot.current?.closest('.catalogue');
    if (catalogue) {
      observer.observe(catalogue);
      catalogue.querySelectorAll('.section-stack, .peek-footer-space, .catalogue-footer').forEach(node => observer.observe(node));
    }
    if (slot.current) observer.observe(slot.current);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerout', leaveWindow);
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    window.addEventListener('blur', end);
    document.addEventListener('visibilitychange', hidden);
    check();
    return () => {
      observer.disconnect();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerout', leaveWindow);
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
      window.removeEventListener('blur', end);
      document.removeEventListener('visibilitychange', hidden);
    };
    // Geometry helpers read refs; the session follows these explicit identities.
  }, [active, final, slot, end]);
  return {
    remember,
    retainOnLeave: (event: Point) => { remember(event); return active && final && contains(); },
  };
}
