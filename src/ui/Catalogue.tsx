import { useEffect, useLayoutEffect, useMemo, useReducer, useRef } from 'react';
import type { Snapshot } from '../core/model';
import { buildCatalogue, filterCatalogue } from './catalogue-model';
import { catalogueReducer, initialCatalogueState, searchKey } from './catalogue-state';
import { SectionCard } from './SectionCard';

// Change to 'break' to compare the first-level expansion ending in Edge.
// Nested expansions always remain inline.
const EXPANSION_END: 'inline' | 'break' = 'inline';

export function Catalogue({ snapshot, suspended, onManage }: { snapshot: Snapshot; suspended: boolean; onManage: () => void }) {
  const [state, dispatch] = useReducer(catalogueReducer, initialCatalogueState);
  const input = useRef<HTMLInputElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const scrollToSection = useRef<string | null>(null);
  const browsePosition = useRef({ scroll: 0, focus: null as HTMLElement | null });
  const model = useMemo(() => buildCatalogue(snapshot), [snapshot]);
  // A removed browser root must not leave an invisible, stale scope selected.
  const scope = model.roots.some(root => root.id === state.scope) ? state.scope : '*';
  const searching = state.query !== null;
  const visible = useMemo(() => filterCatalogue(model, snapshot.favorites, scope, state.query ?? '', searching), [model, snapshot.favorites, scope, state.query, searching]);

  function startSearch(value = '') {
    browsePosition.current = { scroll: window.scrollY, focus: document.activeElement instanceof HTMLElement ? document.activeElement : null };
    dispatch({ type: 'query', value });
  }
  function exitSearch() {
    dispatch({ type: 'escape' });
    requestAnimationFrame(() => {
      const target = browsePosition.current.focus;
      const restored = target?.isConnected ? target : target?.id ? document.getElementById(target.id) : null;
      (restored ?? searchButton.current)?.focus({ preventScroll: true });
      window.scrollTo({ top: browsePosition.current.scroll, behavior: 'instant' });
    });
  }
  useEffect(() => { if (searching && !suspended) input.current?.focus(); }, [searching, suspended]);
  useLayoutEffect(() => {
    if (scrollToSection.current && scrollToSection.current === state.openSection) {
      document.getElementById(`card-${state.openSection}`)?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    scrollToSection.current = null;
  }, [state.openSection]);
  useEffect(() => {
    if (suspended) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (searching) exitSearch();
        else {
          const lastFolder = state.expanded.at(-1);
          const target = lastFolder ? `folder-${lastFolder}` : state.openSection ? `section-${state.openSection}` : '';
          document.getElementById(target)?.focus({ preventScroll: true });
          dispatch({ type: 'escape' });
        }
        return;
      }
      if (searching) return;
      const target = event.target instanceof Element ? event.target : null;
      const editingText = Boolean(target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'));
      const value = searchKey(event, editingText);
      if (value !== undefined) { event.preventDefault(); startSearch(value); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return <div className="catalogue" data-expansion-end={EXPANSION_END} hidden={suspended}>
    <header className="catalogue-navigation">
      <nav aria-label="Bookmark roots">
        {[{ id: '*', title: 'All bookmarks' }, ...model.roots].map(root => <button key={root.id} aria-current={scope === root.id ? 'page' : undefined} onClick={() => {
          dispatch({ type: 'scope', id: root.id });
          if (searching) browsePosition.current = { scroll: 0, focus: searchButton.current };
        }}>{root.title || '(untitled root)'}</button>)}
      </nav>
      <div className="navigation-actions">
        <button ref={searchButton} onClick={() => searching ? input.current?.focus() : startSearch()}>Search /</button>
        <button onClick={onManage}>Manage</button>
      </div>
    </header>
    {searching && <section className="search-mode" aria-label="Search catalogue">
      <input ref={input} type="text" aria-label="Search bookmarks" aria-describedby="search-syntax" value={state.query ?? ''} onChange={e => dispatch({ type: 'query', value: e.target.value })} autoComplete="off" spellCheck={false} placeholder="Search bookmarks" />
      <div className="search-caption"><span role="status">{visible.count} {visible.count === 1 ? 'result' : 'results'}</span><span id="search-syntax">plain text · #tag · @folder</span><button onClick={exitSearch}>Close search · Esc</button></div>
    </section>}
    <div className="section-stack" aria-label="Bookmark catalogue">
      {visible.sections.map((section, index) => <SectionCard key={section.id} section={section} stackIndex={index} stackSize={visible.sections.length} allRoots={scope === '*'} open={searching || state.openSection === section.id} query={state.query} expanded={state.expanded} peekEpoch={state.peekEpoch} onToggle={() => {
        if (state.openSection && state.openSection !== section.id) scrollToSection.current = section.id;
        dispatch({ type: 'section', id: section.id });
      }} onFolder={id => {
        const folder = snapshot.folders.find(candidate => candidate.id === id);
        if (!folder) return;
        const parentIndex = folder.ancestorIds.indexOf(section.parentId);
        if (parentIndex >= 0) dispatch({ type: 'folder', id, ancestors: folder.ancestorIds.slice(parentIndex + 1) });
      }} />)}
      {!visible.sections.length && <p className="empty-catalogue">{searching ? 'No matching bookmarks in this scope.' : 'No bookmarks or folders in this scope.'}</p>}
    </div>
  </div>;
}
