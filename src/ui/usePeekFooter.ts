import { useLayoutEffect, useRef } from 'react';
import { peekFooterSpace } from './peek-footer';

/** Only this flow spacer moves the footer. Real section targets never move.
 * Retained exit previews stay measured until their reveal has finished. */
export function usePeekFooter() {
  const spacer = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = spacer.current;
    const catalogue = element?.closest<HTMLElement>('.catalogue');
    const stack = catalogue?.querySelector<HTMLElement>('.section-stack');
    if (!element || !catalogue || !stack) return;
    const update = () => {
      const bottoms = [...stack.querySelectorAll('.is-peeking, .is-leaving')].map(section => {
        const cover = section.querySelector('.peek-successor');
        const content = section.querySelector('.section-content')!;
        return (cover ?? content).getBoundingClientRect().bottom;
      });
      const height = peekFooterSpace(stack.getBoundingClientRect().bottom, bottoms);
      const previous = element.getBoundingClientRect().height;
      if (Math.abs(height - previous) < .02) return;
      const scroll = window.scrollY;
      element.style.height = `${height}px`;
      // Shrinking a document below a manually chosen scroll position must
      // clamp. Ignore resulting synthetic header entries until real motion.
      if (height < previous && scroll > document.documentElement.scrollHeight - window.innerHeight) catalogue.dataset.peekClamped = 'true';
    };
    const observer = new ResizeObserver(update);
    const observe = () => {
      observer.disconnect(); observer.observe(stack);
      stack.querySelectorAll('.section-content, .peek-successor').forEach(node => observer.observe(node));
      update();
    };
    const mutations = new MutationObserver(observe);
    mutations.observe(stack, { childList: true, subtree: true });
    window.addEventListener('resize', update);
    document.fonts.addEventListener('loadingdone', update);
    observe();
    return () => { observer.disconnect(); mutations.disconnect(); window.removeEventListener('resize', update); document.fonts.removeEventListener('loadingdone', update); };
  }, []);
  return spacer;
}
