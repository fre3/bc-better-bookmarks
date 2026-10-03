export interface CoveredLabel { id: string; title: string; rootId: string; rootTitle: string }
export interface SummaryPart { text: string; kind: 'prefix' | 'name' | 'provenance' | 'separator' | 'group-gap' | 'omitted'; index?: number }
export type MeasureText = (text: string, bold: boolean) => number;
export function labelIsCovered(top: number, bottom: number, overlayTop: number, overlayBottom: number) {
  return bottom > overlayTop && top < overlayBottom;
}
/** Horizontal spacing is shared by fitting and rendering (in font ems). */
export function summaryGap(kind: SummaryPart['kind']): [number, number] {
  if (kind === 'prefix') return [0, .4];
  if (kind === 'separator') return [.5, .5];
  if (kind === 'group-gap') return [.625, .625];
  return [0, 0];
}
export function summaryWidth(segments: readonly SummaryPart[], measure: MeasureText, em: number) {
  return segments.reduce((sum, part) => sum + measure(part.text, part.kind === 'name') + summaryGap(part.kind).reduce((a, b) => a + b, 0) * em, 0);
}
function parts(items: readonly CoveredLabel[], allRoots: boolean, omitted: number): SummaryPart[] {
  const result: SummaryPart[] = [{ text: 'Next:', kind: 'prefix' }];
  items.forEach((item, index) => {
    if (index) result.push(allRoots && item.rootId !== items[index - 1].rootId ? { text: '', kind: 'group-gap' } : { text: '|', kind: 'separator' });
    result.push({ text: item.title || '(untitled)', kind: 'name', index });
    // Root identity, not display name, ends a consecutive provenance group.
    if (allRoots && item.rootId !== items[index + 1]?.rootId) result.push({ text: ` · ${item.rootTitle || '(untitled root)'}`, kind: 'provenance' });
  });
  if (omitted) {
    if (items.length) result.push({ text: '', kind: 'group-gap' });
    result.push({ text: `+${omitted}`, kind: 'omitted' });
  }
  return result;
}
function shorten(text: string, width: number, measure: (value: string) => number) {
  if (measure(text) <= width) return text;
  const characters = Array.from(text);
  let low = 0, high = characters.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (measure(characters.slice(0, middle).join('') + '…') <= width) low = middle;
    else high = middle - 1;
  }
  return characters.slice(0, low).join('') + '…';
}

/** Compact provenance first, then cap long names before dropping a trailing
 * suffix. Omitted count always refers to sections, never roots or text tokens. */
export function fitPeekSummary(items: readonly CoveredLabel[], allRoots: boolean, width: number, measure: MeasureText, em = 17.6): SummaryPart[] {
  if (!items.length) return [];
  const natural = items.map(item => ({ ...item, title: item.title || '(untitled)' }));
  const widthOf = (segments: SummaryPart[]) => summaryWidth(segments, measure, em);
  if (widthOf(parts(natural, allRoots, 0)) <= width) return parts(natural, allRoots, 0);
  for (let count = natural.length; count > 0; count--) {
    const shown = natural.slice(0, count), omitted = natural.length - count;
    const minimum = shown.map(item => {
      const chars = Array.from(item.title);
      return chars.length > 4 ? chars.slice(0, 4).join('') + '…' : item.title;
    });
    const fixed = parts(shown, allRoots, omitted).filter(part => part.kind !== 'name');
    const available = width - widthOf(fixed);
    if (minimum.reduce((sum, text) => sum + measure(text, true), 0) > available) continue;
    const minimumWidths = minimum.map(text => measure(text, true));
    let low = 0, high = Math.max(...shown.map(item => measure(item.title, true)));
    // Find a shared cap, preserving short names and balancing longer ones.
    for (let step = 0; step < 24; step++) {
      const cap = (low + high) / 2;
      const used = shown.reduce((sum, item, i) => sum + measure(shorten(item.title, Math.max(minimumWidths[i], cap), s => measure(s, true)), true), 0);
      if (used <= available) low = cap; else high = cap;
    }
    const fitted = parts(shown.map((item, i) => ({ ...item, title: shorten(item.title, Math.max(minimumWidths[i], low), s => measure(s, true)) })), allRoots, omitted);
    if (widthOf(fitted) <= width) return fitted;
  }
  // A very long root can itself exceed the row. Keep one named section with a
  // compact provenance, then +N; if even that is impossible, show the count.
  if (allRoots) {
    const first = natural[0], omitted = natural.length - 1;
    const fixed = widthOf(parts([{ ...first, title: '', rootTitle: '' }], true, omitted).filter(part => part.kind !== 'name' && part.kind !== 'provenance')) + measure(' · ', false);
    const space = width - fixed;
    if (space > measure('…', true) + measure('…', false)) {
      const fitted = parts([{ ...first, title: shorten(first.title, space * .55, s => measure(s, true)), rootTitle: shorten(first.rootTitle || '(untitled root)', space * .45, s => measure(s, false)) }], true, omitted);
      if (widthOf(fitted) <= width) return fitted;
    }
  }
  return [{ text: 'Next:', kind: 'prefix' }, { text: `+${items.length}`, kind: 'omitted' }];
}
