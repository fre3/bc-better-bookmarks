import { useLayoutEffect, type RefObject } from 'react';
import { startPeekScroll } from './peek-scroll';

/** The opaque reveal and copied lip stay still; only the inert flow translates. */
export function usePeekScroll(active: boolean, flow: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const content = flow.current, viewport = content?.parentElement;
    if (!active || !content || !viewport) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches || document.visibilityState !== 'visible') return;
    const scroll = startPeekScroll({
      measure: () => ({ maximum: content.offsetHeight - viewport.clientHeight, lineHeight: parseFloat(getComputedStyle(content).lineHeight) }),
      paint: offset => { content.style.transform = offset ? `translateY(${-offset}px)` : ''; },
      delay: (callback, ms) => window.setTimeout(callback, ms), clearDelay: id => window.clearTimeout(id),
      frame: callback => requestAnimationFrame(time => {
        // Check at paint time too: media/visibility change events may be queued
        // behind an already requested frame.
        if (motion.matches || document.visibilityState !== 'visible') scroll.cancel();
        else callback(time);
      }), cancelFrame: id => cancelAnimationFrame(id),
    });
    const observer = new ResizeObserver(scroll.resize);
    observer.observe(content); observer.observe(viewport);
    // Hiding cancels this hover session, rather than resuming using elapsed
    // background time. A fresh hover gets a new full delay.
    const hide = () => { if (document.visibilityState !== 'visible') scroll.cancel(); };
    const reduce = () => { if (motion.matches) scroll.cancel(); };
    document.addEventListener('visibilitychange', hide);
    motion.addEventListener('change', reduce);
    return () => {
      scroll.cancel(); observer.disconnect();
      document.removeEventListener('visibilitychange', hide); motion.removeEventListener('change', reduce);
    };
  }, [active, flow]);
}
