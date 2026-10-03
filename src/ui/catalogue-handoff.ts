import type { CatalogueState } from './catalogue-state';
export interface CatalogueHandoff {
  state: CatalogueState;
  requestId: string;
  browseScroll: number;
  browseFocusId: string | null;
  scroll: number;
}
export function catalogueHandoff(value: unknown): CatalogueHandoff | undefined {
  if (!value || typeof value !== 'object') return;
  const handoff = value as Partial<CatalogueHandoff>, s = handoff.state;
  if (!s || typeof s.scope !== 'string' || typeof s.query !== 'string' ||
    !(s.openSection === null || typeof s.openSection === 'string') ||
    !Array.isArray(s.expanded) || !s.expanded.every(id => typeof id === 'string') ||
    !Number.isSafeInteger(s.peekEpoch) || typeof handoff.requestId !== 'string' ||
    typeof handoff.browseScroll !== 'number' || !Number.isFinite(handoff.browseScroll) ||
    typeof handoff.scroll !== 'number' || !Number.isFinite(handoff.scroll) ||
    !(handoff.browseFocusId === null || typeof handoff.browseFocusId === 'string')) return;
  if (s.browseReturn && (typeof s.browseReturn.scope !== 'string' ||
    !(s.browseReturn.openSection === null || typeof s.browseReturn.openSection === 'string') ||
    !Array.isArray(s.browseReturn.expanded) || !s.browseReturn.expanded.every(id => typeof id === 'string'))) return;
  return handoff as CatalogueHandoff;
}
