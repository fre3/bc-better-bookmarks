import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { confirmLinkInput, isBookmarklet, normalizeTags } from '../core/logic';
import { linkInputErrors, type LinkErrors } from '../core/link-input';
import type { Command, Snapshot } from '../core/model';
import type { SaveFailure } from '../core/edit-failure';
import { nodeTags } from '../core/node-tags';
import { favoriteDraft, draftConflict, type FavoriteDraft } from './favorite-editor';
import './favorite-editor.css';

interface Props {
  draft: FavoriteDraft;
  snapshot: Snapshot;
  execute: (command: Command) => Promise<SaveFailure | undefined>;
  onClose: (saved: boolean) => void;
}
export function FavoriteEditor({ draft, snapshot, execute, onClose }: Props) {
  const [input, setInput] = useState(draft.input);
  const [errors, setErrors] = useState<LinkErrors>({});
  const [failure, setFailure] = useState<SaveFailure>();
  const [review, setReview] = useState(false);
  const [expected, setExpected] = useState(draft.expected);
  const [folderContext, setFolderContext] = useState(draft.folder);
  const [discard, setDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLInputElement>(null);
  const continueEditing = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const dirty = JSON.stringify(input) !== JSON.stringify(draft.input);
  const conflict = draftConflict(snapshot, { ...draft, expected });
  const tags = useMemo(() => nodeTags(snapshot).get(draft.id), [snapshot, draft.id]);
  const current = draft.isFolder ? snapshot.folders.find(f => f.id === draft.id) : snapshot.favorites.find(f => f.id === draft.id);
  const candidate = draft.isFolder && !snapshot.local.mappings[draft.id] ? snapshot.reconciliation.matches.find(m => m.candidateIds.includes(draft.id)) : undefined;
  const candidateRecord = snapshot.metadata.records.find(r => r.stableId === candidate?.stableId);
  const willArchive = normalizeTags(input.tags).includes('archived') || tags?.inherited.includes('archived');
  useLayoutEffect(() => {
    const element = dialog.current!;
    element.showModal(); title.current?.focus({ preventScroll: true });
    // Preserve scrollbar geometry and scroll offset while the native top-layer
    // dialog makes the background inert. No fixed-body scroll restoration hack.
    const root = document.documentElement;
    const previous = { overflow: root.style.overflow, gutter: root.style.scrollbarGutter };
    if (window.innerWidth > root.clientWidth) root.style.scrollbarGutter = 'stable';
    root.style.overflow = 'hidden';
    return () => { root.style.overflow = previous.overflow; root.style.scrollbarGutter = previous.gutter; element.close(); };
  }, []);
  useEffect(() => { if (discard) continueEditing.current?.focus(); }, [discard]);
  function resumeEditing() {
    setDiscard(false);
    requestAnimationFrame(() => title.current?.focus({ preventScroll: true }));
  }
  function requestClose() {
    if (submitting.current) return;
    if (dirty) setDiscard(true); else onClose(false);
  }
  async function save() {
    if (submitting.current || conflict || discard) return;
    // Validate opaque bookmarklet syntax without skipping its explicit save-time
    // confirmation (the transient permission is never kept in the draft).
    const nextErrors = linkInputErrors({ ...input, bookmarkletConfirmed: isBookmarklet(input.url) });
    if (draft.isFolder) { delete nextErrors.url; if (nextErrors.title) nextErrors.title = 'A name is required.'; }
    setErrors(nextErrors); setFailure(undefined);
    if (Object.keys(nextErrors).length) {
      const field = nextErrors.title ? 'title' : nextErrors.url ? 'url' : 'tags';
      document.getElementById(`favorite-edit-${field}`)?.focus(); return;
    }
    const confirmed = draft.isFolder ? input : confirmLinkInput(input, message => window.confirm(message));
    if (!confirmed) return;
    submitting.current = true; setSaving(true); title.current?.focus({ preventScroll: true });
    try {
      const error = await execute(draft.isFolder ? { type: 'edit-folder', generation: draft.generation, id: draft.id, expected, title: input.title, tags: input.tags } : { type: 'edit', generation: draft.generation, id: draft.id, expected, input: confirmed });
      if (error !== undefined) setFailure(error); else onClose(true);
    } catch (error) { setFailure({ error: String(error) }); }
    finally { submitting.current = false; setSaving(false); }
  }
  return <dialog ref={dialog} className="favorite-editor" aria-labelledby="favorite-editor-heading" aria-describedby="favorite-edit-folder" onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const stops = [...event.currentTarget.querySelectorAll<HTMLElement>('input, textarea, button:not(:disabled)')];
      const first = stops[0], last = stops.at(-1);
      if (!stops.includes(document.activeElement as HTMLElement)) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }} onCancel={event => { event.preventDefault(); if (discard) resumeEditing(); else requestClose(); }}>
    <h2 id="favorite-editor-heading">{draft.isFolder ? 'Edit Folder' : 'Edit Favorite'}</h2>
    <p id="favorite-edit-folder" className="editor-context">{draft.isFolder ? 'Parent' : 'Folder'}: {folderContext || '(root)'}</p>
    <form noValidate onSubmit={event => { event.preventDefault(); void save(); }} aria-busy={saving}>
      <label htmlFor="favorite-edit-title">{draft.isFolder ? 'Name' : 'Title'}</label>
      <input ref={title} id="favorite-edit-title" value={input.title} readOnly={saving} required aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'favorite-title-error' : undefined} onChange={e => setInput({ ...input, title: e.target.value })} />
      {errors.title && <p id="favorite-title-error" className="editor-error">{errors.title}</p>}
      {!draft.isFolder && <><label htmlFor="favorite-edit-url">URL (HTTP, HTTPS, or bookmarklet)</label>
      <textarea id="favorite-edit-url" rows={3} spellCheck={false} value={input.url} readOnly={saving} required aria-invalid={Boolean(errors.url)} aria-describedby={errors.url ? 'favorite-url-error' : undefined} onChange={e => setInput({ ...input, url: e.target.value })} />
      {errors.url && <p id="favorite-url-error" className="editor-error">{errors.url}</p>}</>}
      <label htmlFor="favorite-edit-tags">Tags (comma separated; stored lowercase)</label>
      <input id="favorite-edit-tags" value={input.tags.join(',')} readOnly={saving} aria-invalid={Boolean(errors.tags)} aria-describedby={errors.tags ? 'favorite-tags-error' : undefined} onChange={e => setInput({ ...input, tags: e.target.value.split(',') })} />
      {errors.tags && <p id="favorite-tags-error" className="editor-error">{errors.tags}</p>}
      <p className="editor-context">Enter direct tags without #. The tag archived hides this item and, for folders, its descendants from the dashboard and search unless Show archived is enabled.</p>
      {tags && tags.sources.length > 0 && <div className="editor-inheritance"><p>Inherited tags (read only). Change these at their source:</p><ul>{tags.sources.map(source => <li key={source.id}><strong>{source.tags.map(tag => `#${tag}`).join(' · ')}</strong> — {source.path.join(' / ')} [folder {source.id}]</li>)}</ul><p>Removing a direct tag leaves any inherited assignment in effect.</p></div>}
      {willArchive && <p role="note">#archived excludes this item{draft.isFolder ? ' and its entire subtree' : ''} from the dashboard and search unless Show archived is enabled. Edge Favorites are unchanged.{tags?.inherited.includes('archived') ? ' Archive status is inherited from the source folder(s) above and cannot be removed here.' : ' Archive status is directly assigned here.'}</p>}
      {draft.isFolder && <p className="editor-context">Folder tags require version 0.1.17 or later on every device.</p>}
      {candidateRecord && <p>{candidate?.bookmarkId ? 'This location also matches metadata already bound to another folder. A copy does not receive that identity. Give the copy a distinct name or location through Edge Favorites before first tagging it.' : 'Existing folder metadata is unresolved for this device. Cancel and use Manage → Folder identity review to confirm original folders together. Matching names and paths do not prove identity.'}</p>}
      {conflict && <p className="editor-error" role="alert">{conflict}</p>}
      {failure && <div role="alert"><p className="editor-error">{failure.error}</p>{failure.progress && <><p>Completed native changes: {[failure.progress.title && (draft.isFolder ? 'name' : 'title'), failure.progress.url && 'URL', failure.progress.location && 'location'].filter(Boolean).join(', ') || 'none confirmed'}. Tag persistence was not confirmed. Your input is retained.</p>
        {current && <button type="button" onClick={() => setReview(true)}>Review current values for recovery</button>}
        {review && current && <div><p>Current name/title: {current.title}</p>{current.url !== undefined && <p>Current URL: {current.url}</p>}<p>Current direct tags: {tags?.direct.join(', ') || '(none)'}</p><p>Parent: {favoriteDraft(snapshot, current).folder}</p><button type="button" onClick={() => { const reviewed = favoriteDraft(snapshot, current); setExpected(reviewed.expected); setFolderContext(reviewed.folder); setInput(value => ({ ...value, parentId: reviewed.input.parentId })); setReview(false); setFailure(undefined); }}>Keep my input and use these values as the save baseline</button><p>Save will recheck all guards. Missing metadata cannot be recreated by retrying; keep needed text and inspect Manage diagnostics.</p></div>}</>}</div>}
      {discard ? <div className="discard-confirmation" role="group" aria-labelledby="discard-question">
        <p id="discard-question">Discard your unsaved changes?</p>
        <div className="editor-actions"><button type="button" onClick={() => onClose(false)}>Discard changes</button><button ref={continueEditing} type="button" onClick={resumeEditing}>Continue editing</button></div>
      </div> : <div className="editor-actions"><button type="submit" disabled={saving || Boolean(conflict)}>{saving ? 'Saving…' : 'Save'}</button><button ref={cancel} type="button" disabled={saving} onClick={requestClose}>Cancel</button></div>}
    </form>
  </dialog>;
}
