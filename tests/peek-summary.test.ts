import { describe, expect, it } from 'vitest';
import { fitPeekSummary, labelIsCovered, type CoveredLabel } from '../src/ui/peek-summary';
const label = (title: string, rootId = 'r', rootTitle = 'Favorites bar'): CoveredLabel => ({ id: title, title, rootId, rootTitle });
const measure = (text: string) => Array.from(text).length * 8;
const text = (items: CoveredLabel[], width = 1200, allRoots = true) => fitPeekSummary(items, allRoots, width, measure).map(p => p.text).join('');
describe('covered-section summary', () => {
  it('includes partial intersections but excludes fully readable labels below the lip', () => {
    expect(labelIsCovered(278, 300, 260, 290)).toBe(true);
    expect(labelIsCovered(278, 300, 280, 500)).toBe(true);
    expect(labelIsCovered(500, 522, 260, 500)).toBe(false);
    expect(labelIsCovered(230, 260, 260, 500)).toBe(false);
  });
  it('compacts consecutive root provenance without changing catalogue order', () => {
    expect(text(['Baustoffe', 'FRE3', 'Career'].map(s => label(s)))).toBe('Baustoffe | FRE3 | Career · Favorites bar');
    expect(text(['FRE3', 'Career', 'Crypto'].map(s => label(s)))).toBe('FRE3 | Career | Crypto · Favorites bar');
    expect(text([label('A'), label('B')], 1200, false)).toBe('A | B');
  });
  it('groups by root identity, even when labels coincide, and retains global name indices', () => {
    const items = [label('A'), label('B'), label('C', 'r2', 'Favorites bar'), label('D', 'r2', 'Favorites bar'), label('E', 'r3', 'Workspaces')];
    const fitted = fitPeekSummary(items, true, 1600, measure);
    expect(fitted.map(p => p.text).join('')).toBe('A | B · Favorites bar | C | D · Favorites bar | E · Workspaces');
    expect(fitted.filter(p => p.kind === 'name').map(p => p.index)).toEqual([0, 1, 2, 3, 4]);
  });
  it('truncates long names before omitting a trailing suffix, with an accurate count', () => {
    const items = ['Long catalogue collection alpha', 'Long catalogue collection beta', 'Long catalogue collection gamma', 'Fourth', 'Fifth'].map(s => label(s));
    const fitted = fitPeekSummary(items, true, 280, measure);
    expect(fitted.reduce((sum, p) => sum + measure(p.text), 0)).toBeLessThanOrEqual(280);
    const shown = fitted.filter(p => p.kind === 'name');
    expect(shown.length).toBeGreaterThan(0);
    expect(fitted.find(p => p.kind === 'omitted')?.text).toBe(`+${items.length - shown.length}`);
    expect(shown[0].text.startsWith('Long')).toBe(true);
    expect(shown[0].text.endsWith('…')).toBe(true);
    expect(items[0].title).toBe('Long catalogue collection alpha');
  });
  it('keeps one compact provenance when even the first root is wider than the row', () => {
    const fitted = fitPeekSummary([label('First title', 'r', 'Very long root name '.repeat(8)), label('Next')], true, 200, measure);
    expect(fitted.some(p => p.kind === 'provenance')).toBe(true);
    expect(fitted.find(p => p.kind === 'omitted')?.text).toBe('+1');
    expect(fitted.reduce((sum, p) => sum + measure(p.text), 0)).toBeLessThanOrEqual(200);
  });
});
