import { useLayoutEffect, useRef } from 'react';
import { peekFooterSpace, retainedPeekSpace } from './peek-footer';

/** Only this flow spacer moves the footer. Real section targets never move.
 * Retained exit previews stay measured until their reveal has finished. */
export function usePeekFooter(epoch: number, suspended: boolean) {
  const spacer = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = spacer.current;
    const catalogue = element?.closest<HTMLElement>('.catalogue');
    const stack = catalogue?.querySelector<HTMLElement>('.section-stack');
    const footer = catalogue?.querySelector<HTMLElement>('.catalogue-footer');
    if (!element || !catalogue || !stack || !footer) return;
    // Explicit navigation/opening/search starts a new geometry lifecycle.
    element.style.height = '0px';
    if (suspended) return;
    const retired = new Set(stack.querySelectorAll('.is-leaving'));
    const update = () => {
      const bottoms = [...stack.querySelectorAll('.is-peeking, .is-leaving')].filter(section => {
        if (section.classList.contains('is-peeking')) retired.delete(section);
        return !retired.has(section);
      }).map(section => {
        const cover = section.querySelector('.peek-successor');
        const content = section.querySelector('.section-content')!;
        return (cover ?? content).getBoundingClientRect().bottom;
      });
      const stackBottom = stack.getBoundingClientRect().bottom;
      const required = peekFooterSpace(stackBottom, bottoms);
      const previous = element.getBoundingClientRect().height;
      // No moving-footer baseline: both the flow stack and footer height are
      // independent of the spacer. Short-page flex room is absorbed naturally.
      const naturalBottom = Math.max(window.innerHeight, stackBottom + window.scrollY + footer.getBoundingClientRect().height);
      const height = retainedPeekSpace(required, previous, window.scrollY, window.innerHeight, naturalBottom);
      if (Math.abs(height - previous) < .02) return;
      element.style.height = `${height}px`;
    };
    const observer = new ResizeObserver(update);
    const observe = () => {
      observer.disconnect(); observer.observe(stack); observer.observe(footer);
      stack.querySelectorAll('.section-content, .peek-successor').forEach(node => observer.observe(node));
      update();
    };
    const mutations = new MutationObserver(observe);
    mutations.observe(stack, { childList: true, subtree: true });
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });
    document.fonts.addEventListener('loadingdone', update);
    observe();
    return () => { observer.disconnect(); mutations.disconnect(); window.removeEventListener('resize', update); window.removeEventListener('scroll', update); document.fonts.removeEventListener('loadingdone', update); };
  }, [epoch, suspended]);
  return spacer;
}
