import { useLayoutEffect, useRef, useState } from 'react';
import { fitPeekSummary, summaryGap, type CoveredLabel, type SummaryPart } from './peek-summary';

/** This duplicate visual explanation is inert/aria-hidden at its parent. Its
 * absolute box never participates in the copied header's coverage measurement. */
export function PeekSummary({ items, allRoots }: { items: readonly CoveredLabel[]; allRoots: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [parts, setParts] = useState<SummaryPart[]>([]);
  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const context = document.createElement('canvas').getContext('2d');
    if (!context) return;
    const update = () => {
      const style = getComputedStyle(element);
      const width = element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const cache = new Map<string, number>();
      const next = fitPeekSummary(items, allRoots, width, (text, bold) => {
        const key = `${bold}:${text}`;
        if (!cache.has(key)) {
          context.font = `${bold ? 700 : 400} ${style.fontSize} ${style.fontFamily}`;
          cache.set(key, context.measureText(text).width);
        }
        return cache.get(key)!;
      }, parseFloat(style.fontSize));
      setParts(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    const observer = new ResizeObserver(update); observer.observe(element);
    document.fonts.addEventListener('loadingdone', update); update();
    return () => { observer.disconnect(); document.fonts.removeEventListener('loadingdone', update); };
  }, [items, allRoots]);
  return <div ref={box} className="peek-summary section-inner">
    <span className="peek-summary-line">{parts.map((part, index) => {
      const [start, end] = summaryGap(part.kind);
      return <span key={index} className={`peek-summary-${part.kind}`} style={{
        marginInlineStart: `${start}em`, marginInlineEnd: `${end}em`,
        color: part.kind === 'name' ? part.index === 0 ? 'var(--summary-first)' : part.index === 1 ? 'var(--summary-second)' : 'var(--summary-later)' : undefined,
      }}>{part.text}</span>;
    })}</span>
  </div>;
}
