import { DeleteDialog } from './DeleteDialog';
import { CreateDialog, type CreateRequest } from './CreateDialog';
import { MoveDialog } from './MoveDialog';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { onDashboardChanged, sendCommand } from '../browser/client';
import type { Command, Snapshot } from '../core/model';
import { folderBindings, folderNeedsReview } from './folder-bindings';
import { FolderBindingDialog } from './FolderBindingDialog';
import { Catalogue } from './Catalogue';
import { LegacyManagement } from './LegacyManagement';
import { onDashboardSearch, dashboardShortcut, openShortcutSettings } from '../browser/dashboard-launch';
import type { SearchIntent } from '../core/dashboard-launch';
import { useArchivePreference } from './useArchivePreference';
import { visibleSnapshot } from '../core/node-tags';
import { usePeekPreference } from './usePeekPreference';
import './legacy.css';
import { EditFailure, errorText, type SaveFailure } from '../core/edit-failure';
import { MetadataSetup } from './MetadataSetup';
import { FavoriteEditor } from './FavoriteEditor';
import { favoriteDraft, type FavoriteDraft } from './favorite-editor';
import { AppearanceSetting } from './AppearanceSetting';

export function App() {
  useEffect(()=>{const prevent=(e:DragEvent)=>e.preventDefault();window.addEventListener('drop',prevent);window.addEventListener('dragover',prevent);return()=>{window.removeEventListener('drop',prevent);window.removeEventListener('dragover',prevent);};},[]);
  const [reveal,setReveal]=useState<{id:string;sequence:number}>();
  const [creating,setCreating]=useState<CreateRequest>();
  const [deleting,setDeleting]=useState<string>();
  const [moving,setMoving]=useState<string>();
  const operationReturn=useRef<HTMLElement|null>(null);
  const [bindingReview, setBindingReview] = useState<{ folderId?: string }>();
  const bindingReturn = useRef<HTMLElement | null>(null);
  const restoreBinding = useRef(false);
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
    if (managing || busy || draft || bindingReview || creating || moving || deleting) {
      setNotice('Search shortcut paused while an editor, Manage or a save is active. Finish editing, return to the catalogue, then invoke it again.');
      return 'blocked';
    }
    setSearchRequest(id);
    return 'accepted';
  }), [snapshot, managing, busy, draft, bindingReview, creating, moving, deleting]);
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
    const refresh = () => { void sendCommand({ type: 'snapshot' }).then(value => { if (!disposed) setSnapshot(value); }).catch(e => { if (!disposed) setError(errorText(e)); }); };
    refresh();
    const remove = onDashboardChanged(() => { clearTimeout(timer); timer = setTimeout(refresh, 150); });
    return () => { disposed = true; clearTimeout(timer); remove(); };
  }, []);
  async function execute(command: Command, onError?: (failure: SaveFailure) => void) {
    setBusy(true); setError(''); setNotice('');
    try {
      const result=await sendCommand(command);setSnapshot(result);
      if(result.mutation){if(command.type==='create'||command.type==='create-folder')setReveal({id:result.mutation.id,sequence:Date.now()});restoreFavorite.current=result.mutation.id;const path=result.folders.find(f=>f.id===result.mutation!.parentId)?.path.join(' / ');setNotice(`${command.type==='delete'?'Deleted':command.type==='move'?'Moved':'Created'} in ${path}. The current scope and query are unchanged; archived or nonmatching items may not be visible.`);}
      if (!result.mutation && !['snapshot', 'reconcile'].includes(command.type)) setNotice(command.type === 'attach-folder' ? 'Folder binding confirmed. Received tags applied on this device.' : 'Saved in this browser.');
      return true;
    } catch (e) {
      if (onError) onError({ error: errorText(e), ...(e instanceof EditFailure ? { progress: e.progress } : {}) }); else setError(e instanceof EditFailure ? `${errorText(e)} Completed native changes: ${[e.progress.title && 'title/name', e.progress.url && 'URL', e.progress.location && 'location'].filter(Boolean).join(', ') || 'none confirmed'}. Tag persistence was not confirmed. Keep needed input and reopen to review current values before retrying.` : errorText(e));
      try { setSnapshot(await sendCommand({ type: 'snapshot' })); } catch { /* Original error is more useful. */ }
      return false;
    } finally { setBusy(false); }
  }
  useLayoutEffect(() => {
    if (draft || bindingReview || creating || moving || deleting || !restoreFavorite.current) return;
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
  }, [draft, bindingReview, creating, moving, deleting, snapshot]);
  function openBindingReview(folderId?: string) {
    bindingReturn.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setBindingReview({ folderId });
  }
  function closeBindingReview() { restoreBinding.current = true; setBindingReview(undefined); }
  useLayoutEffect(() => {
    if (bindingReview || !restoreBinding.current) return;
    restoreBinding.current = false;
    const previous = bindingReturn.current;
    const target = previous?.isConnected && !previous.closest('[hidden], [inert]') ? previous : document.querySelector<HTMLElement>('.favorite-editor button, .search-mode input, #catalogue-review, #catalogue-edit');
    target?.focus({ preventScroll: true });
  }, [bindingReview]);
  async function executeReviewed(command: Command) {
    let failure: SaveFailure | undefined;
    const saved = await execute(command, value => { failure = value; });
    return saved ? undefined : failure ?? { error: 'Could not complete this action. Your input is retained.' };
  }
  if (!snapshot) return <main><h1>Better Bookmarks</h1><p role="status">{error || 'Reading Edge Favorites…'}</p><button onClick={() => void execute({ type: 'snapshot' })}>Retry</button><MetadataSetup onReset={() => void execute({ type: 'snapshot' })} /></main>;
  return <main className={managing ? undefined : 'catalogue-page'}>
    {error && <p className="status-error" role="alert">{error}</p>}
    <p className={managing ? undefined : 'sr-only'} hidden={managing && !notice} role="status" aria-atomic="true">{notice}</p>
    {snapshot.errors.length > 0 && <details className="status-error"><summary>{snapshot.errors.length} diagnostic warnings/errors</summary><ul>{snapshot.errors.map((message, i) => <li key={i}>{message}</li>)}</ul></details>}
    <Catalogue bindingReviews={folderBindings(snapshot)} onReviewBindings={() => openBindingReview()} snapshot={snapshot} showArchived={archivePreference.enabled} selectedId={draft?.id} modalOpen={Boolean(draft || bindingReview || creating || moving || deleting)} reveal={reveal} onDropMove={async command=>{const failure=await executeReviewed(command);if(failure){setError(failure.error);if(failure.error.includes('binding'))openBindingReview();}}} onDelete={id=>{operationReturn.current=document.activeElement as HTMLElement;if(folderNeedsReview(snapshot,id))openBindingReview(id);else setDeleting(id);}} onCreate={(folder,parentId)=>{const active=document.activeElement as HTMLElement;operationReturn.current=(active.closest('[popover]')?.previousElementSibling as HTMLElement)??active;setCreating({folder,parentId});}} onMove={id=>{const active=document.activeElement as HTMLElement;operationReturn.current=(active.closest('[popover]')?.previousElementSibling as HTMLElement)??active;if(folderNeedsReview(snapshot,id))openBindingReview(id);else setMoving(id);}} onEdit={id => { const favorite = [...snapshot.favorites, ...snapshot.folders].find(item => item.id === id); if (favorite) { setNotice(''); if (favorite.url === undefined && folderNeedsReview(snapshot, id)) openBindingReview(id); else setDraft(favoriteDraft(snapshot, favorite)); } }} suspended={managing} autoScrollPeek={peekPreference.enabled} searchRequest={searchRequest} onManage={() => { setManaging(true); setNotice(''); }} />
    {deleting && <DeleteDialog id={deleting} snapshot={snapshot} execute={executeReviewed} onReview={()=>openBindingReview()} onClose={()=>{restoreFavorite.current=deleting;setDeleting(undefined);}} />}
    {creating && <CreateDialog request={creating} snapshot={snapshot} showArchived={archivePreference.enabled} execute={executeReviewed} onClose={()=>{setCreating(undefined);operationReturn.current?.focus({preventScroll:true});}} />}
    {moving && <MoveDialog id={moving} snapshot={snapshot} showArchived={archivePreference.enabled} execute={executeReviewed} onReview={()=>openBindingReview()} onClose={()=>{setMoving(undefined);operationReturn.current?.focus({preventScroll:true});}} />}
    {draft && <FavoriteEditor draft={draft} snapshot={snapshot} onReviewBinding={() => openBindingReview(draft.id)} execute={executeReviewed} onClose={saved => {
      restoreFavorite.current = draft.id;
      setDraft(undefined);
      if (saved) setNotice(draft.isFolder ? 'Folder saved in this browser.' : 'Favorite saved in this browser.');
    }} />}
    {bindingReview && <FolderBindingDialog snapshot={snapshot} folderId={bindingReview.folderId} execute={executeReviewed} onClose={closeBindingReview} onComplete={archived => {
      closeBindingReview();
      setNotice(`Folder binding confirmed. Received tags applied on this device.${archived && !archivePreference.enabled ? ' Archived folders are now hidden; enable Show archived in Manage to view them.' : ''}`);
    }} />}
    <div hidden={!managing}>
      <div className="management-heading"><span>Management and settings</span><button onClick={() => { setManaging(false); setNotice(''); }}>Back to catalogue</button></div>
      <AppearanceSetting />
      <p><label><input type="checkbox" checked={archivePreference.enabled} disabled={!archivePreference.ready || archivePreference.saving} onChange={e => void archivePreference.update(e.target.checked)} /> Show archived</label> <small>Include archived favorites and folders in the dashboard and search.</small></p>
      {archivePreference.error && <p role="alert">{archivePreference.error}</p>}
      <p>Dashboard search shortcut: {shortcut === undefined ? 'assignment unavailable' : shortcut || 'unassigned'}. <button onClick={openShortcutSettings}>Keyboard shortcut settings</button>. New Tab fallback: Ctrl+F6, then type.</p>
      <p><label><input type="checkbox" checked={peekPreference.enabled} disabled={!peekPreference.ready || peekPreference.saving} onChange={e => void peekPreference.update(e.target.checked)} /> Auto-scroll peek previews</label> <small>On this device · starts after 1 second · disabled by reduced motion</small></p>
      {peekPreference.error && <p role="alert">{peekPreference.error}</p>}
      <MetadataSetup snapshot={snapshot} execute={execute} onReset={() => void execute({ type: 'snapshot' })} />
      <LegacyManagement s={managementSnapshot!} tagSnapshot={snapshot} busy={busy} execute={execute} />
    </div>
  </main>;
}
