import { useLayoutEffect, useRef } from 'react';
import { peekFooterSpace, retainedPeekSpace } from './peek-footer';
import { layoutTask } from './layout-task';

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
      // Only sample continuously while a real reveal transition is running.
      // Its initial unchanged frame need not deliver another resize event;
      // waiting for the next delivery would clip the first growing frame.
      if ([...stack.querySelectorAll('.is-peeking .section-content, .is-leaving .section-content')]
        .some(node => node.getAnimations().some(animation => animation.playState === 'running'))) task.schedule();
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
    // Reservation changes resize the catalogue/spacer watched by final-hover
    // retention. Never make those writes inside ResizeObserver delivery.
    const task = layoutTask(update, 1);
    const observer = new ResizeObserver(task.schedule);
    const targets = new Set<Element>();
    const observe = () => {
      const next = new Set<Element>([stack, footer, ...stack.querySelectorAll('.section-content, .peek-successor')]);
      for (const node of targets) if (!next.has(node)) { observer.unobserve(node); targets.delete(node); }
      for (const node of next) if (!targets.has(node)) { observer.observe(node); targets.add(node); }
      // React has just mounted/removed preview content. Reserve its initial
      // geometry before paint (especially instantaneous reduced-motion peeks).
      // Resize deliveries themselves always use the deferred task above.
      update();
      task.schedule();
    };
    const mutations = new MutationObserver(observe);
    mutations.observe(stack, { childList: true, subtree: true });
    window.addEventListener('resize', task.schedule);
    window.addEventListener('scroll', task.schedule, { passive: true });
    document.fonts.addEventListener('loadingdone', task.schedule);
    observe();
    return () => { task.dispose(); observer.disconnect(); mutations.disconnect(); window.removeEventListener('resize', task.schedule); window.removeEventListener('scroll', task.schedule); document.fonts.removeEventListener('loadingdone', task.schedule); };
  }, [epoch, suspended]);
  return spacer;
}
