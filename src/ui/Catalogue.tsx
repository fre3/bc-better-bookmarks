import { useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { Snapshot } from '../core/model';
import { buildCatalogue, filterCatalogue } from './catalogue-model';
import { catalogueReducer, initialCatalogueState, rootShortcut, searchKey } from './catalogue-state';
import { usePeekFooter } from './usePeekFooter';
import { CatalogueFooter } from './CatalogueFooter';
import { SectionCard } from './SectionCard';
import { moveToSearchPage, takeSearchHandoff } from '../browser/dashboard-launch';
import type { SearchIntent } from '../core/dashboard-launch';
import { catalogueHandoff } from './catalogue-handoff';

// Change to 'break' to compare the first-level expansion ending in Edge.
// Nested expansions always remain inline.
const EXPANSION_END: 'inline' | 'break' = 'inline';

export function Catalogue({ snapshot, suspended, searchRequest, autoScrollPeek = true, showArchived = false, modalOpen = false, selectedId, onEdit, onManage }: { snapshot: Snapshot; suspended: boolean; searchRequest?: SearchIntent; autoScrollPeek?: boolean; onManage: () => void; modalOpen?: boolean; showArchived?: boolean; selectedId?: string; onEdit?: (id: string) => void }) {
  const [handoff] = useState(() => typeof location === 'undefined' ? undefined : catalogueHandoff(takeSearchHandoff()));
  const [state, dispatch] = useReducer(catalogueReducer, handoff?.state ?? initialCatalogueState);
  const [editing, setEditing] = useState(false);
  const [navStuck, setNavStuck] = useState(false);
  const [launchError, setLaunchError] = useState('');
  const peekFooter = usePeekFooter(state.peekEpoch, suspended);
  const lastFocused = useRef<HTMLElement | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const scrollToSection = useRef<string | null>(null);
  const browsePosition = useRef({ scroll: handoff?.browseScroll ?? 0, focus: null as HTMLElement | null, focusId: handoff?.browseFocusId ?? null as string | null });
  const consumedSearchRequest = useRef(handoff?.requestId ?? '');
  const selectRequested = useRef(Boolean(handoff));
  const restoreScroll = useRef(handoff?.scroll);
  const model = useMemo(() => buildCatalogue(snapshot, showArchived), [snapshot, showArchived]);
  // A removed browser root must not leave an invisible, stale scope selected.
  const scope = model.roots.some(root => root.id === state.scope) ? state.scope : '*';
  const searching = state.query !== null;
  const visible = useMemo(() => filterCatalogue(model, snapshot.favorites, scope, state.query ?? '', searching), [model, snapshot.favorites, scope, state.query, searching]);

  useLayoutEffect(() => {
    if (!modalOpen && !suspended && lastFocused.current && !lastFocused.current.isConnected && document.activeElement === document.body) {
      (input.current ?? searchButton.current)?.focus({ preventScroll: true });
    }
  }, [visible, modalOpen, suspended]);
  useLayoutEffect(() => {
    const nav = navigation.current;
    if (!nav) return;
    const update = () => nav.parentElement?.style.setProperty('--editing-nav-height', editing ? `${nav.getBoundingClientRect().height}px` : '0px');
    const position = () => setNavStuck(editing && (nav.parentElement?.getBoundingClientRect().top ?? 0) < 0);
    const observer = new ResizeObserver(update); observer.observe(nav); update(); position();
    window.addEventListener('scroll', position, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener('scroll', position); };
  }, [editing]);
  const roots = [{ id: '*', title: 'All bookmarks' }, ...model.roots];
  function switchScope(id: string) {
    dispatch({ type: 'scope', id });
    if (searching) input.current?.focus({ preventScroll: true });
  }
  function startSearch(value = '', allBookmarks = false) {
    if (!searching) browsePosition.current = { scroll: window.scrollY, focus: document.activeElement instanceof HTMLElement ? document.activeElement : null, focusId: document.activeElement?.id ?? null };
    dispatch({ type: 'query', value, allBookmarks });
  }
  function exitSearch() {
    dispatch({ type: 'escape' });
    requestAnimationFrame(() => {
      const target = browsePosition.current.focus;
      const id = target?.id || browsePosition.current.focusId;
      const restored = target?.isConnected ? target : id ? document.getElementById(id) : null;
      (restored ?? searchButton.current)?.focus({ preventScroll: true });
      window.scrollTo({ top: browsePosition.current.scroll, behavior: 'instant' });
    });
  }
  useEffect(() => { if (searching && !suspended && !modalOpen) input.current?.focus(); }, [searching, suspended]);
  useLayoutEffect(() => {
    if (suspended || modalOpen) return;
    if (searchRequest && consumedSearchRequest.current !== searchRequest.id) {
      consumedSearchRequest.current = searchRequest.id;
      selectRequested.current = true;
      // Do not overwrite the existing query or Escape's browse position.
      if (!searching || searchRequest.allBookmarks) { startSearch(state.query ?? '', searchRequest.allBookmarks); return; }
    }
    if (searching && selectRequested.current && input.current) {
      selectRequested.current = false;
      try {
        if (restoreScroll.current === undefined && moveToSearchPage({ state, requestId: consumedSearchRequest.current, browseScroll: browsePosition.current.scroll, browseFocusId: browsePosition.current.focus?.id || browsePosition.current.focusId, scroll: window.scrollY })) return;
      } catch {
        setLaunchError('Could not preserve this catalogue for search launch. Press Ctrl+F6 to move focus into the page, then type.');
      }
      const restoring = restoreScroll.current !== undefined;
      if (restoring) {
        window.scrollTo({ top: restoreScroll.current, behavior: 'instant' });
        restoreScroll.current = undefined;
      }
      // Navigation already transferred browser focus. Never re-activate a page
      // the user left while its restored snapshot was loading.
      if (!restoring && document.visibilityState === 'visible') window.focus();
      input.current.focus();
      input.current.select();
    }
  });
  useLayoutEffect(() => {
    if (scrollToSection.current && scrollToSection.current === state.openSection) {
      document.getElementById(`card-${state.openSection}`)?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    scrollToSection.current = null;
  }, [state.openSection]);
  useEffect(() => {
    if (suspended || modalOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      const target = event.target instanceof Element ? event.target : null;
      const editingText = Boolean(target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]'));
      const excluded = Boolean(target?.closest('dialog, [role="dialog"]')) || (editingText && target !== input.current);
      if (target?.closest('dialog, [role="dialog"]')) return;
      const root = rootShortcut(event, roots, excluded);
      if (root !== undefined) { event.preventDefault(); switchScope(root); return; }
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
      const value = searchKey(event, editingText);
      if (value !== undefined) { event.preventDefault(); startSearch(value); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return <div onFocusCapture={event => { lastFocused.current = event.target; }} className={`catalogue${editing ? ' is-editing' : ''}`} data-expansion-end={EXPANSION_END} hidden={suspended}>
    <header ref={navigation} data-stuck={navStuck} className="catalogue-navigation">
      {editing && <div className="editing-indicator"><span className="editing-badge">Editing</span><span className="editing-help">Click Edit beside a favorite or folder to make changes.</span></div>}
      <nav aria-label="Bookmark roots">
        {roots.map((root, index) => <button key={root.id} aria-current={scope === root.id ? 'page' : undefined}
          title={index < 9 ? `${root.title} · Alt+${index + 1}` : root.title}
          aria-keyshortcuts={index < 9 ? `Alt+${index + 1}` : undefined}
          aria-description={index < 9 ? `Switch root with Alt+${index + 1}` : undefined}
          onClick={() => switchScope(root.id)}>{root.title || '(untitled root)'}</button>)}
      </nav>
      <div className="navigation-actions">
        <button ref={searchButton} onClick={() => searching ? input.current?.focus() : startSearch()}>Search /</button>
        {onEdit && <button id="catalogue-edit" aria-pressed={editing} onClick={() => setEditing(!editing)}><span className="mode-button-size"><span aria-hidden={editing} style={{ visibility: editing ? 'hidden' : 'visible' }}>Edit</span><span aria-hidden={!editing} style={{ visibility: editing ? 'visible' : 'hidden' }}>Done</span></span></button>}
        <button onClick={onManage}>Manage</button>
      </div>
    </header>
    {launchError && <p role="alert">{launchError}</p>}
    {searching && <section className="search-mode" aria-label="Search catalogue">
      <input ref={input} type="text" aria-label="Search bookmarks" aria-describedby="search-syntax" value={state.query ?? ''} onChange={e => dispatch({ type: 'query', value: e.target.value })} autoComplete="off" spellCheck={false} placeholder="Search bookmarks" />
      <div className="search-caption"><span role="status">{visible.count} {visible.count === 1 ? 'result' : 'results'}</span><span id="search-syntax">plain text · #tag · @folder</span><button onClick={exitSearch}>Close search · Esc</button></div>
    </section>}
    <div className="section-stack" aria-label="Bookmark catalogue">
      {visible.sections.map((section, index) => <SectionCard key={section.id} blocked={modalOpen} selectedId={selectedId} onEdit={editing ? onEdit : undefined} section={section} nextSection={visible.sections[index + 1]} sections={visible.sections} stackIndex={index} stackSize={visible.sections.length} allRoots={scope === '*'} open={searching || state.openSection === section.id} query={state.query} expanded={state.expanded} peekEpoch={state.peekEpoch} autoScrollPeek={autoScrollPeek && !suspended} onToggle={() => {
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
    <div ref={peekFooter} className="peek-footer-space" aria-hidden="true" />
    <CatalogueFooter />
  </div>;
}
