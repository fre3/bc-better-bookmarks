import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { onDashboardChanged, sendCommand } from '../browser/client';
import type { Command, Snapshot } from '../core/model';
import { Catalogue } from './Catalogue';
import { LegacyManagement } from './LegacyManagement';
import { onDashboardSearch, dashboardShortcut, openShortcutSettings } from '../browser/dashboard-launch';
import type { SearchIntent } from '../core/dashboard-launch';
import { usePeekPreference } from './usePeekPreference';
import './legacy.css';
import { FavoriteEditor } from './FavoriteEditor';
import { favoriteDraft, type FavoriteDraft } from './favorite-editor';
import { AppearanceSetting } from './AppearanceSetting';

export function App() {
  const restoreFavorite = useRef<string | null>(null);
  const peekPreference = usePeekPreference();
  const [snapshot, setSnapshot] = useState<Snapshot>();
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
  async function execute(command: Command, onError?: (message: string) => void) {
    setBusy(true); setError(''); setNotice('');
    try {
      setSnapshot(await sendCommand(command));
      if (!['snapshot', 'reconcile'].includes(command.type)) setNotice('Saved in this browser.');
      return true;
    } catch (e) {
      if (onError) onError(String(e)); else setError(String(e));
      try { setSnapshot(await sendCommand({ type: 'snapshot' })); } catch { /* Original error is more useful. */ }
      return false;
    } finally { setBusy(false); }
  }
  useLayoutEffect(() => {
    if (draft || !restoreFavorite.current) return;
    const favorite = document.getElementById(`bookmark-${restoreFavorite.current}`);
    const target = favorite && !favorite.closest('[inert], [hidden]') ? favorite : document.querySelector<HTMLInputElement>('.search-mode input') ?? document.getElementById('catalogue-edit');
    target?.focus({ preventScroll: true });
    restoreFavorite.current = null;
  }, [draft, snapshot]);
  if (!snapshot) return <main><h1>Better Bookmarks</h1><p role="status">{error || 'Reading Edge Favorites…'}</p><button onClick={() => void execute({ type: 'snapshot' })}>Retry</button></main>;
  return <main className={managing ? undefined : 'catalogue-page'}>
    {error && <p className="status-error" role="alert">{error}</p>}
    <p className={managing ? undefined : 'sr-only'} hidden={managing && !notice} role="status" aria-atomic="true">{notice}</p>
    {snapshot.errors.length > 0 && <details className="status-error"><summary>{snapshot.errors.length} diagnostic warnings/errors</summary><ul>{snapshot.errors.map((message, i) => <li key={i}>{message}</li>)}</ul></details>}
    <Catalogue snapshot={snapshot} selectedId={draft?.id} modalOpen={Boolean(draft)} onEdit={id => { const favorite = snapshot.favorites.find(item => item.id === id); if (favorite) { setNotice(''); setDraft(favoriteDraft(snapshot, favorite)); } }} suspended={managing} autoScrollPeek={peekPreference.enabled} searchRequest={searchRequest} onManage={() => { setManaging(true); setNotice(''); }} />
    {draft && <FavoriteEditor draft={draft} snapshot={snapshot} execute={async command => {
      let failure: string | undefined;
      const saved = await execute(command, message => { failure = message; });
      return saved ? undefined : failure ?? 'Could not save this Favorite. Your draft is retained.';
    }} onClose={saved => {
      restoreFavorite.current = draft.id;
      setDraft(undefined);
      if (saved) setNotice('Favorite saved in this browser.');
    }} />}
    {managing && <>
      <div className="management-heading"><span>Management and settings</span><button onClick={() => { setManaging(false); setNotice(''); }}>Back to catalogue</button></div>
      <AppearanceSetting />
      <p>Dashboard search shortcut: {shortcut === undefined ? 'assignment unavailable' : shortcut || 'unassigned'}. <button onClick={openShortcutSettings}>Keyboard shortcut settings</button>. New Tab fallback: Ctrl+F6, then type.</p>
      <p><label><input type="checkbox" checked={peekPreference.enabled} disabled={!peekPreference.ready || peekPreference.saving} onChange={e => void peekPreference.update(e.target.checked)} /> Auto-scroll peek previews</label> <small>On this device · starts after 1 second · disabled by reduced motion</small></p>
      {peekPreference.error && <p role="alert">{peekPreference.error}</p>}
      <LegacyManagement s={snapshot} busy={busy} execute={execute} />
    </>}
  </main>;
}
