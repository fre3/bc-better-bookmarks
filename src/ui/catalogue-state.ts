export interface BrowseReturn { scope: string; openSection: string | null; expanded: string[] }
export interface CatalogueState {
  browseReturn?: BrowseReturn;
  scope: string;
  query: string | null;
  openSection: string | null;
  expanded: string[];
  peekEpoch: number;
}
export const initialCatalogueState: CatalogueState = { scope: '*', query: null, openSection: null, expanded: [], peekEpoch: 0 };
export type CatalogueAction =
  | { type: 'scope'; id: string }
  | { type: 'query'; value: string; allBookmarks?: boolean }
  | { type: 'section'; id: string }
  | { type: 'folder'; id: string; ancestors: string[] }
  | { type: 'escape' };

export function catalogueReducer(state: CatalogueState, action: CatalogueAction): CatalogueState {
  switch (action.type) {
    case 'scope': return { ...state, scope: action.id, openSection: null, expanded: [], peekEpoch: state.peekEpoch + 1 };
    case 'query': return {
      ...state, query: action.value, scope: action.allBookmarks ? '*' : state.scope,
      // Capture once, before any temporary scope; updates and repeated commands
      // retain the original browse snapshot for Escape.
      browseReturn: state.query === null ? { scope: state.scope, openSection: state.openSection, expanded: state.expanded } : state.browseReturn,
      peekEpoch: state.query === null ? state.peekEpoch + 1 : state.peekEpoch,
    };
    case 'section': return { ...state, openSection: state.openSection === action.id ? null : action.id, expanded: [], peekEpoch: state.peekEpoch + 1 };
    case 'folder': {
      const index = state.expanded.indexOf(action.id);
      // The ordered path contains only folders within the open section. Opening
      // a sibling replaces the rest of the branch, never its required ancestors.
      return { ...state, expanded: index >= 0 ? state.expanded.slice(0, index) : [...action.ancestors, action.id] };
    }
    case 'escape':
      if (state.query !== null) return { ...state, ...state.browseReturn, browseReturn: undefined, query: null, peekEpoch: state.peekEpoch + 1 };
      if (state.expanded.length) return { ...state, expanded: state.expanded.slice(0, -1), peekEpoch: state.peekEpoch + 1 };
      return { ...state, openSection: null, peekEpoch: state.peekEpoch + 1 };
  }
}

export function searchKey(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'isComposing'>, editingText: boolean): string | undefined {
  if (editingText || event.ctrlKey || event.metaKey || event.altKey || event.isComposing || event.key.length !== 1 || event.key === ' ') return undefined;
  return event.key === '/' ? '' : event.key;
}

/** Number keys, not physical codes: excludes AltGr characters on German layouts. */
export function rootShortcut(event: Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'isComposing' | 'getModifierState'>, roots: readonly { id: string }[], excluded: boolean): string | undefined {
  if (excluded || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing || event.getModifierState('AltGraph') || !/^[1-9]$/u.test(event.key)) return;
  return roots[Number(event.key) - 1]?.id;
}
