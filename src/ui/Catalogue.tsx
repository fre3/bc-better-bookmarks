import { RootNavigation } from './RootNavigation';
import { nodeTags } from '../core/node-tags';
import { useCatalogueDrag } from './useCatalogueDrag';
import type { Command } from '../core/model';
import { ActionsContext, AddMenu } from './ItemActions';
import { useCatalogueChrome } from './useCatalogueChrome';
import type { folderBindings } from './folder-bindings';
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

export function Catalogue({ snapshot, suspended, searchRequest, autoScrollPeek = true, showArchived = false, modalOpen = false, selectedId, onEdit, onManage, bindingReviews = [], onReviewBindings, onCreate, onMove, onDelete, onDropMove, reveal }: { reveal?: {id:string;sequence:number}; onDropMove?: (c:Command)=>Promise<unknown>; onCreate?: (folder:boolean,parentId:string)=>void; onMove?: (id:string)=>void; onDelete?: (id:string)=>void; bindingReviews?: ReturnType<typeof folderBindings>; onReviewBindings?: () => void; snapshot: Snapshot; suspended: boolean; searchRequest?: SearchIntent; autoScrollPeek?: boolean; onManage: () => void; modalOpen?: boolean; showArchived?: boolean; selectedId?: string; onEdit?: (id: string) => void }) {
  const [handoff] = useState(() => typeof location === 'undefined' ? undefined : catalogueHandoff(takeSearchHandoff()));
  const [state, dispatch] = useReducer(catalogueReducer, handoff?.state ?? initialCatalogueState);
  const [editing, setEditing] = useState(false);
  const drag=useCatalogueDrag(snapshot,state,editing&&!modalOpen&&!suspended&&state.query===null,dispatch,onDropMove,onReviewBindings);
  const revealed=useRef(0);
  useEffect(()=>{if(!reveal||revealed.current===reveal.sequence||modalOpen)return;revealed.current=reveal.sequence;const node=[...snapshot.favorites,...snapshot.folders].find(n=>n.id===reveal.id);if(!node)return;const info=nodeTags(snapshot).get(node.id);if(!showArchived&&info?.archived||state.scope!=='*'&&!node.ancestorIds.includes(state.scope))return;
   if(state.query===null){const section=node.ancestorIds[2];if(section)dispatch({type:'view',openSection:`folder:${section}`,expanded:node.ancestorIds.slice(3)});else if(node.url!==undefined)dispatch({type:'view',openSection:`loose:${node.parentId}`,expanded:[]});}
   const frame=requestAnimationFrame(()=>{const target=document.getElementById(`edit-bookmark-${node.id}`)??document.getElementById(`edit-folder-${node.id}`);if(target){target.focus({preventScroll:true});target.scrollIntoView({block:'nearest',behavior:'instant'});}});return()=>cancelAnimationFrame(frame);
  },[reveal,modalOpen,snapshot]);
  const { chrome } = useCatalogueChrome();
  const [launchError, setLaunchError] = useState('');
  const peekFooter = usePeekFooter(state.peekEpoch, suspended);
  const lastFocused = useRef<HTMLElement | null>(null);
  const input = useRef<HTMLInputElement>(null);

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
  const roots = [{ id: '*', title: 'All bookmarks' }, ...model.roots];
  function switchScope(id: string) {
    const selection = input.current ? [input.current.selectionStart, input.current.selectionEnd, input.current.selectionDirection] as const : undefined;
    dispatch({ type: 'scope', id });
    requestAnimationFrame(() => {
      if (searching && input.current) {
        input.current.focus({ preventScroll: true });
        if (selection) input.current.setSelectionRange(selection[0], selection[1], selection[2] ?? undefined);
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
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
      const available = restored && !restored.closest('[inert], [hidden]') && restored.getClientRects().length ? restored : restored?.closest('.root-tabs') ? chrome.current?.querySelector<HTMLElement>('.root-selector:not([hidden])') : undefined;
      (available ?? searchButton.current)?.focus({ preventScroll: true });
      window.scrollTo({ top: browsePosition.current.scroll, behavior: 'instant' });
    });
  }
  useEffect(() => { if (searching && !suspended && !modalOpen) input.current?.focus(); }, [searching, suspended]);
  useLayoutEffect(() => {
    if (suspended || modalOpen || drag.active) return;
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
    if (suspended || modalOpen || drag.active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      const target = event.target instanceof Element ? event.target : null;
      const editingText = Boolean(target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]'));
      const excluded = Boolean(target?.closest('dialog, [role="dialog"]')) || (editingText && target !== input.current && !target?.matches('.root-selector'));
      if (target?.closest('dialog, [role="dialog"]')) return;
      const root = rootShortcut(event, roots, excluded);
      if (root !== undefined) { event.preventDefault(); switchScope(root); return; }
      if (event.key === 'Escape' && target?.closest('select:open')) return;
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

  return <ActionsContext.Provider value={editing && onCreate && onMove ? {snapshot,create:onCreate,move:onMove,remove:onDelete,searching} : undefined}><div onFocusCapture={event => { lastFocused.current = event.target; }} className={`catalogue${editing ? ' is-editing' : ''}`} data-dragging={drag.active} data-expansion-end={EXPANSION_END} hidden={suspended}>
    <div ref={chrome} className="catalogue-chrome">
    <header className="catalogue-navigation">
      {editing && <div className="editing-help">Click a favorite to edit it, or use Edit beside a folder. Drag titles to move.</div>}
      <RootNavigation roots={roots} scope={scope} onChange={switchScope} />
      <div className="navigation-actions">
        {editing && <span className="editing-badge">Editing</span>}
        <button ref={searchButton} onClick={() => searching ? input.current?.focus() : startSearch()}>Search /</button>
        {onEdit && <button id="catalogue-edit" aria-pressed={editing} onClick={() => setEditing(!editing)}><span className="mode-button-size"><span aria-hidden={editing} style={{ visibility: editing ? 'hidden' : 'visible' }}>Edit</span><span aria-hidden={!editing} style={{ visibility: editing ? 'visible' : 'hidden' }}>Done</span></span></button>}
        {editing && <AddMenu parentId={scope === '*' ? '' : scope} />}
        {!editing && <button onClick={onManage}>Manage</button>}
      </div>
    </header>

    {bindingReviews.length > 0 && <div className="binding-notice">
      <span role="status" aria-atomic="true">Folder tags need review ({bindingReviews.length})</span>{' — '}
      <button id="catalogue-review" onClick={onReviewBindings} aria-describedby="binding-notice-help">Review</button>
      <span id="binding-notice-help" className="sr-only">Received folder metadata needs confirmation before it can be applied on this device.</span>
    </div>}
    {searching && <section className="search-mode" aria-label="Search catalogue">
      <input ref={input} type="text" aria-label="Search bookmarks" aria-describedby="search-syntax" value={state.query ?? ''} onChange={e => dispatch({ type: 'query', value: e.target.value })} autoComplete="off" spellCheck={false} placeholder="Search bookmarks" />
      <div className="search-caption"><span role="status">{visible.count} {visible.count === 1 ? 'result' : 'results'}</span><span id="search-syntax">plain text · #tag · @folder</span><button onClick={exitSearch}>Close search · Esc</button></div>
    </section>}
    </div>
    <div className="chrome-rest-space" aria-hidden="true" />
    {launchError && <p role="alert">{launchError}</p>}
    {drag.preview && <div className="drag-preview" aria-hidden="true" style={{left:drag.preview.x,top:drag.preview.y}}><strong>Moving {drag.preview.title}</strong><span>{drag.feedback?.invalid ? 'Not allowed' : drag.feedback ? drag.feedback.label : 'Choose a destination'}</span></div>}
    {drag.feedback && <><div aria-hidden="true" className={`drag-cue${drag.feedback.invalid?' invalid':''}`} style={drag.feedback.rect}/><p className="drag-status" role="status">{drag.feedback.label}</p></>}
    <div className="section-stack" aria-label="Bookmark catalogue">
      {visible.sections.map((section, index) => <SectionCard key={section.id} blocked={modalOpen || drag.active} selectedId={selectedId} movingId={drag.preview?.id} onEdit={editing ? onEdit : undefined} section={section} nextSection={visible.sections[index + 1]} sections={visible.sections} stackIndex={index} stackSize={visible.sections.length} allRoots={scope === '*'} open={searching || state.openSection === section.id} query={state.query} expanded={state.expanded} peekEpoch={state.peekEpoch} autoScrollPeek={autoScrollPeek && !suspended && !drag.active} onToggle={() => {
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
  </div></ActionsContext.Provider>;
}
