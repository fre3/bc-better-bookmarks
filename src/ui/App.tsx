import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { onDashboardChanged, sendCommand } from '../browser/client';
import type { Command, Snapshot } from '../core/model';
import { Catalogue } from './Catalogue';
import { LegacyManagement } from './LegacyManagement';
import { onDashboardSearch, dashboardShortcut, openShortcutSettings } from '../browser/dashboard-launch';
import type { SearchIntent } from '../core/dashboard-launch';
import { useArchivePreference } from './useArchivePreference';
import { visibleSnapshot } from '../core/node-tags';
import { usePeekPreference } from './usePeekPreference';
import './legacy.css';
import { EditFailure, type SaveFailure } from '../core/edit-failure';
import { MetadataSetup } from './MetadataSetup';
import { FavoriteEditor } from './FavoriteEditor';
import { favoriteDraft, type FavoriteDraft } from './favorite-editor';
import { AppearanceSetting } from './AppearanceSetting';

export function App() {
  const restoreFavorite = useRef<string | null>(null);
  const archivePreference = useArchivePreference();
  const peekPreference = usePeekPreference();
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const managementSnapshot = useMemo(() => snapshot ? visibleSnapshot(snapshot, archivePreference.enabled) : undefined, [snapshot, archivePreference.enabled]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<FavoriteDraft>();
  const [managing, setManaging] = useState(false);
  const [searchRequest, setSearchRequest] = useState<SearchIntent>();
  const [shortcut, setShortcut] = useState<string>();
  useEffect(() => onDashboardSearch(id => {
    if (!snapshot) return 'not-ready';
    if (managing || busy || draft) {
      setNotice('Search shortcut paused while an editor, Manage or a save is active. Finish editing, return to the catalogue, then invoke it again.');
      return 'blocked';
    }
    setSearchRequest(id);
    return 'accepted';
  }), [snapshot, managing, busy, draft]);
  useEffect(() => {
    if (!managing) return;
    let disposed = false;
    const read = () => { void dashboardShortcut().then(value => { if (!disposed) setShortcut(value); }).catch(() => { if (!disposed) setShortcut(undefined); }); };
    read(); window.addEventListener('focus', read);
    return () => { disposed = true; window.removeEventListener('focus', read); };
  }, [managing]);
  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => { void sendCommand({ type: 'snapshot' }).then(value => { if (!disposed) setSnapshot(value); }).catch(e => { if (!disposed) setError(String(e)); }); };
    refresh();
    const remove = onDashboardChanged(() => { clearTimeout(timer); timer = setTimeout(refresh, 150); });
    return () => { disposed = true; clearTimeout(timer); remove(); };
  }, []);
  async function execute(command: Command, onError?: (failure: SaveFailure) => void) {
    setBusy(true); setError(''); setNotice('');
    try {
      setSnapshot(await sendCommand(command));
      if (!['snapshot', 'reconcile'].includes(command.type)) setNotice('Saved in this browser.');
      return true;
    } catch (e) {
      if (onError) onError({ error: String(e), ...(e instanceof EditFailure ? { progress: e.progress } : {}) }); else setError(e instanceof EditFailure ? `${String(e)} Completed native changes: ${[e.progress.title && 'title/name', e.progress.url && 'URL', e.progress.location && 'location'].filter(Boolean).join(', ') || 'none confirmed'}. Tag persistence was not confirmed. Keep needed input and reopen to review current values before retrying.` : String(e));
      try { setSnapshot(await sendCommand({ type: 'snapshot' })); } catch { /* Original error is more useful. */ }
      return false;
    } finally { setBusy(false); }
  }
  useLayoutEffect(() => {
    if (draft || !restoreFavorite.current) return;
    const favorite = document.getElementById(`edit-folder-${restoreFavorite.current}`) ?? document.getElementById(`edit-bookmark-${restoreFavorite.current}`);
    const nearby = [...document.querySelectorAll<HTMLElement>('.section-header .section-toggle')].find(element => {
      const rect = element.getBoundingClientRect(); return !element.closest('[inert]') && rect.bottom > 0 && rect.top < window.innerHeight;
    });
    const retained = favorite && !favorite.closest('[inert], [hidden]');
    const target = retained ? favorite : document.querySelector<HTMLInputElement>('.search-mode input') ?? nearby ?? document.getElementById('catalogue-edit');
    target?.focus({ preventScroll: true });
    if (!retained && target) {
      const rect = target.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) target.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }
    restoreFavorite.current = null;
  }, [draft, snapshot]);
  if (!snapshot) return <main><h1>Better Bookmarks</h1><p role="status">{error || 'Reading Edge Favorites…'}</p><button onClick={() => void execute({ type: 'snapshot' })}>Retry</button><MetadataSetup onReset={() => void execute({ type: 'snapshot' })} /></main>;
  return <main className={managing ? undefined : 'catalogue-page'}>
    {error && <p className="status-error" role="alert">{error}</p>}
    <p className={managing ? undefined : 'sr-only'} hidden={managing && !notice} role="status" aria-atomic="true">{notice}</p>
    {snapshot.errors.length > 0 && <details className="status-error"><summary>{snapshot.errors.length} diagnostic warnings/errors</summary><ul>{snapshot.errors.map((message, i) => <li key={i}>{message}</li>)}</ul></details>}
    <Catalogue snapshot={snapshot} showArchived={archivePreference.enabled} selectedId={draft?.id} modalOpen={Boolean(draft)} onEdit={id => { const favorite = [...snapshot.favorites, ...snapshot.folders].find(item => item.id === id); if (favorite) { setNotice(''); setDraft(favoriteDraft(snapshot, favorite)); } }} suspended={managing} autoScrollPeek={peekPreference.enabled} searchRequest={searchRequest} onManage={() => { setManaging(true); setNotice(''); }} />
    {draft && <FavoriteEditor draft={draft} snapshot={snapshot} execute={async command => {
      let failure: SaveFailure | undefined;
      const saved = await execute(command, message => { failure = message; });
      return saved ? undefined : failure ?? { error: 'Could not save this item. Your draft is retained.' };
    }} onClose={saved => {
      restoreFavorite.current = draft.id;
      setDraft(undefined);
      if (saved) setNotice(draft.isFolder ? 'Folder saved in this browser.' : 'Favorite saved in this browser.');
    }} />}
    {managing && <>
      <div className="management-heading"><span>Management and settings</span><button onClick={() => { setManaging(false); setNotice(''); }}>Back to catalogue</button></div>
      <AppearanceSetting />
      <p><label><input type="checkbox" checked={archivePreference.enabled} disabled={!archivePreference.ready || archivePreference.saving} onChange={e => void archivePreference.update(e.target.checked)} /> Show archived</label> <small>Include archived favorites and folders in the dashboard and search.</small></p>
      {archivePreference.error && <p role="alert">{archivePreference.error}</p>}
      <p>Dashboard search shortcut: {shortcut === undefined ? 'assignment unavailable' : shortcut || 'unassigned'}. <button onClick={openShortcutSettings}>Keyboard shortcut settings</button>. New Tab fallback: Ctrl+F6, then type.</p>
      <p><label><input type="checkbox" checked={peekPreference.enabled} disabled={!peekPreference.ready || peekPreference.saving} onChange={e => void peekPreference.update(e.target.checked)} /> Auto-scroll peek previews</label> <small>On this device · starts after 1 second · disabled by reduced motion</small></p>
      {peekPreference.error && <p role="alert">{peekPreference.error}</p>}
      <MetadataSetup snapshot={managementSnapshot} showArchived={archivePreference.enabled} execute={execute} onReset={() => void execute({ type: 'snapshot' })} />
      <LegacyManagement s={managementSnapshot!} tagSnapshot={snapshot} busy={busy} execute={execute} />
    </>}
  </main>;
}
