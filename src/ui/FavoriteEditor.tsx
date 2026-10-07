import { itemIdentityDetails, itemMetadataIssue } from '../core/item-metadata-health';
import { singleLineUrlPaste } from './url-entry';
import { dialogKeyboard } from './dialog-keyboard';
import { folderNeedsReview } from './folder-bindings';
import { errorText } from '../core/edit-failure';
import { editorTags, splitArchiveTag } from './editor-tags';
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
  onReviewBinding?: () => void;
}
export function FavoriteEditor({ draft, snapshot, execute, onClose, onReviewBinding }: Props) {
  const [input, setInput] = useState(() => ({ ...draft.input, tags: splitArchiveTag(draft.input.tags).tags }));
  const [archived, setArchived] = useState(() => splitArchiveTag(draft.input.tags).archived);
  const [errors, setErrors] = useState<LinkErrors>({});
  const [failure, setFailure] = useState<SaveFailure>();
  const [review, setReview] = useState(false);
  const [expected, setExpected] = useState(draft.expected);
  const [folderContext, setFolderContext] = useState(draft.folder);
  const [discard, setDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const focusFrame = useRef(0);
  // Tag blur can check the box between pointerdown and native click. Preserve
  // the user's intended toggle, rather than toggling the newly normalized value.
  const archivePointerIntent = useRef<boolean | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLInputElement>(null);
  const continueEditing = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const submitted = { ...input, tags: editorTags(input.tags, archived) };
  const dirty = JSON.stringify(submitted) !== JSON.stringify({ ...draft.input, tags: normalizeTags(draft.input.tags) });
  const metadataIssue = itemMetadataIssue(snapshot, draft.id);
  const unresolved = draft.isFolder && folderNeedsReview(snapshot, draft.id);
  const initiallyBlocked = useRef(Boolean(unresolved || metadataIssue));
  // Latch the interruption even if a background confirmation subsequently
  // resolves it. Only explicit review can rebase a retained draft.
  const [identityInterrupted, setIdentityInterrupted] = useState(false);
  useLayoutEffect(() => { if (unresolved || metadataIssue) setIdentityInterrupted(true); }, [unresolved, metadataIssue]);
  const identityBlocked = Boolean(metadataIssue) || unresolved || identityInterrupted;
  const conflict = draftConflict(snapshot, { ...draft, expected });
  const tags = useMemo(() => nodeTags(snapshot).get(draft.id), [snapshot, draft.id]);
  const current = draft.isFolder ? snapshot.folders.find(f => f.id === draft.id) : snapshot.favorites.find(f => f.id === draft.id);
  const nativeReadOnly = Boolean(current?.nativeRestriction || draft.isFolder && current?.folderType);
  const archiveSources = tags?.sources.filter(source => source.tags.includes('archived')) ?? [];
  function finishTagEntry() {
    const split = splitArchiveTag(input.tags);
    if (split.archived) { setArchived(true); setInput(value => ({ ...value, tags: split.tags })); }
  }
  useLayoutEffect(() => {
    const element = dialog.current!;
    element.showModal(); title.current?.focus({ preventScroll: true });
    // Preserve scrollbar geometry and scroll offset while the native top-layer
    // dialog makes the background inert. No fixed-body scroll restoration hack.
    const root = document.documentElement;
    const previous = { overflow: root.style.overflow, gutter: root.style.scrollbarGutter };
    if (window.innerWidth > root.clientWidth) root.style.scrollbarGutter = 'stable';
    root.style.overflow = 'hidden';
    return () => { cancelAnimationFrame(focusFrame.current); root.style.overflow = previous.overflow; root.style.scrollbarGutter = previous.gutter; element.close(); };
  }, []);
  useEffect(() => { if (discard) continueEditing.current?.focus(); }, [discard]);
  function resumeEditing() {
    setDiscard(false);
    cancelAnimationFrame(focusFrame.current);
    focusFrame.current = requestAnimationFrame(() => title.current?.focus({ preventScroll: true }));
  }
  function requestClose() {
    if (submitting.current) return;
    if (dirty) setDiscard(true); else onClose(false);
  }
  async function save() {
    if (submitting.current || conflict || identityBlocked || discard) return;
    finishTagEntry();
    // Validate opaque bookmarklet syntax without skipping its explicit save-time
    // confirmation (the transient permission is never kept in the draft).
    const nextErrors = linkInputErrors({ ...submitted, bookmarkletConfirmed: isBookmarklet(input.url) });
    if (draft.isFolder) { delete nextErrors.url; if (nextErrors.title) nextErrors.title = 'A name is required.'; }
    setErrors(nextErrors); setFailure(undefined);
    if (Object.keys(nextErrors).length) {
      const field = nextErrors.title ? 'title' : nextErrors.url ? 'url' : 'tags';
      document.getElementById(`favorite-edit-${field}`)?.focus(); return;
    }
    const confirmed = draft.isFolder ? submitted : confirmLinkInput(submitted, message => window.confirm(message));
    if (!confirmed) return;
    submitting.current = true; setSaving(true); title.current?.focus({ preventScroll: true });
    try {
      const error = await execute(draft.isFolder ? { type: 'edit-folder', generation: draft.generation, id: draft.id, expected, title: submitted.title, tags: submitted.tags } : { type: 'edit', generation: draft.generation, id: draft.id, expected, input: confirmed });
      if (error !== undefined) setFailure(error); else onClose(true);
    } catch (error) { setFailure({ error: errorText(error) }); }
    finally { submitting.current = false; setSaving(false); }
  }
  return <dialog ref={dialog} className="favorite-editor" aria-labelledby="favorite-editor-heading" aria-describedby="favorite-edit-folder" onKeyDownCapture={event => {
      dialogKeyboard(event, () => { if(discard)resumeEditing();else requestClose(); });
      if (event.key !== 'Tab') return;
      const stops = [...event.currentTarget.querySelectorAll<HTMLElement>('input:not(:disabled), textarea:not(:disabled), button:not(:disabled), summary')].filter(n=>!n.closest('[inert]'));
      const first = stops[0], last = stops.at(-1);
      if (!stops.includes(document.activeElement as HTMLElement)) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }} onCancel={event => { event.preventDefault(); event.stopPropagation(); if (discard) resumeEditing(); else requestClose(); }}>
    <h2 id="favorite-editor-heading">{draft.isFolder ? 'Edit Folder' : 'Edit Favorite'}</h2>
    <p id="favorite-edit-folder" className="editor-context">{draft.isFolder ? 'Parent' : 'Folder'}: {folderContext || '(root)'}</p>
    <p className="editor-context">Native item ID: {draft.id}</p>
    <form noValidate onSubmit={event => { event.preventDefault(); void save(); }} aria-busy={saving}>
      <div inert={discard}>
      {metadataIssue && <div className="editor-error" role="alert" id="favorite-metadata-status"><strong>Metadata unavailable for safe editing</strong><p>{metadataIssue}</p><p>Direct tags are unresolved, not an empty assignment. Fields and Save are blocked; any existing draft is retained. Do not copy this diagnostic into tags.</p></div>}
      {(identityBlocked || metadataIssue) && <details className="identity-details"><summary>Inspect metadata diagnostics for this item</summary><pre>{JSON.stringify(itemIdentityDetails(snapshot, draft.id), null, 2)}</pre><p>This is read-only evidence. For the full export, cancel safely and open Manage → Export diagnostics. Do not reset metadata or guess a matching duplicate.</p></details>}
      {nativeReadOnly && <p id="native-readonly" className="editor-context">{current?.nativeRestriction ?? 'Native naming is managed in Edge.'} Native fields are read-only; Save changes extension tags only.</p>}
      <label htmlFor="favorite-edit-title">{draft.isFolder ? 'Name' : 'Title'}</label>
      <input ref={title} id="favorite-edit-title" value={input.title} readOnly={saving || identityBlocked || nativeReadOnly} required aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'favorite-title-error' : undefined} onChange={e => setInput({ ...input, title: e.target.value })} />
      {errors.title && <p id="favorite-title-error" className="editor-error">{errors.title}</p>}
      {!draft.isFolder && <><label htmlFor="favorite-edit-url">URL (HTTP, HTTPS, or bookmarklet)</label>
      <input type="text" onPaste={e=>singleLineUrlPaste(e,message=>setErrors(value=>({...value,url:message})))} id="favorite-edit-url" spellCheck={false} value={input.url} readOnly={saving || identityBlocked || nativeReadOnly} required aria-invalid={Boolean(errors.url)} aria-describedby={errors.url ? 'favorite-url-error' : undefined} onChange={e => setInput({ ...input, url: e.target.value })} />
      {/[\r\n]/.test(input.url)&&<p>Existing multiline bookmarklet code is retained unchanged unless you edit the URL. This single-line field does not display its line breaks.</p>}
      {errors.url && <p id="favorite-url-error" className="editor-error">{errors.url}</p>}</>}
      <label htmlFor="favorite-edit-tags">Tags (comma separated; stored lowercase)</label>
      <input id="favorite-edit-tags" value={input.tags.join(',')} readOnly={saving || identityBlocked} aria-invalid={Boolean(errors.tags)} aria-describedby={metadataIssue ? 'favorite-metadata-status' : errors.tags ? 'favorite-tags-error' : undefined} onBlur={finishTagEntry} onChange={e => setInput({ ...input, tags: e.target.value.split(',') })} />
      {errors.tags && <p id="favorite-tags-error" className="editor-error">{errors.tags}</p>}
      <p className="editor-context">Enter direct tags without #.</p>
      {tags && tags.sources.length > 0 && <div className="editor-inheritance"><p>Inherited tags (read only). Change these at their source:</p><ul>{tags.sources.map(source => <li key={source.id}><strong>{source.tags.map(tag => `#${tag}`).join(' · ')}</strong> — {source.path.join(' / ')} [folder {source.id}]</li>)}</ul><p>Removing a direct tag leaves any inherited assignment in effect.</p></div>}
      <label className="archive-choice"><input type="checkbox" checked={archived} onPointerDown={() => { archivePointerIntent.current = !archived; }} onPointerCancel={() => { archivePointerIntent.current = null; }} onKeyDown={() => { archivePointerIntent.current = null; }} onBlur={() => { archivePointerIntent.current = null; }} disabled={saving || identityBlocked} aria-describedby="archive-help archive-inheritance" onChange={event => { setArchived(archivePointerIntent.current ?? event.target.checked); archivePointerIntent.current = null; setInput(value => ({ ...value, tags: splitArchiveTag(value.tags).tags })); }} /> {draft.isFolder ? 'Archive this folder and its contents' : 'Archive this favorite'}</label>
      <p id="archive-help" className="editor-context">Hidden from the dashboard and search unless Show archived is enabled.</p>
      <p id="archive-inheritance" hidden={!archiveSources.length}>{archived ? 'Unchecking here does not remove inherited archiving.' : 'This item is archived by its source folders; restore them to restore visibility.'} Sources: {archiveSources.map(source => `${source.path.join(' / ')} [folder ${source.id}]`).join('; ')}. Any remaining ancestor assignment can keep this item archived.</p>
      {draft.isFolder && <p className="editor-context">Folder tags require version 0.1.17 or later on every device.</p>}
      {identityBlocked && <div role="alert"><p>Item identity needs review. Your draft is retained and saving is blocked; no input will be saved automatically.</p>
        {unresolved ? <button type="button" onClick={onReviewBinding}>Review folder binding</button> : !metadataIssue && current && (initiallyBlocked.current ? <p>Identity is available again. Close and reopen the editor to load its confirmed direct tags before editing.</p> : <><p>Identity refreshed. Current name: {current.title}. Current direct tags: {tags?.direct.map(tag => `#${tag}`).join(' · ') || '(none)'}. Review these values before keeping your unsaved input.</p><button type="button" onClick={() => { const fresh = favoriteDraft(snapshot, current); setExpected(fresh.expected); setFolderContext(fresh.folder); setInput(value => ({ ...value, parentId: fresh.input.parentId })); setIdentityInterrupted(false); }}>Keep my input and use the reviewed binding</button></>)}
      </div>}
      {conflict && <p className="editor-error" role="alert">{conflict}</p>}
      {failure && <div role="alert"><p className="editor-error">{errorText(failure.error)}</p>{failure.progress && <><p>Completed native changes: {[failure.progress.title && (draft.isFolder ? 'name' : 'title'), failure.progress.url && 'URL', failure.progress.location && 'location'].filter(Boolean).join(', ') || 'none confirmed'}. Tag persistence was not confirmed. Your input is retained.</p>
        {current && <button type="button" onClick={() => setReview(true)}>Review current values for recovery</button>}
        {review && current && <div><p>Current name/title: {current.title}</p>{current.url !== undefined && <p>Current URL: {current.url}</p>}<p>Current direct tags: {tags?.direct.join(', ') || '(none)'}</p><p>Parent: {favoriteDraft(snapshot, current).folder}</p><button type="button" onClick={() => { const reviewed = favoriteDraft(snapshot, current); setExpected(reviewed.expected); setFolderContext(reviewed.folder); setInput(value => ({ ...value, parentId: reviewed.input.parentId })); setReview(false); setFailure(undefined); }}>Keep my input and use these values as the save baseline</button><p>Save will recheck all guards. Missing metadata cannot be recreated by retrying; keep needed text and inspect Manage diagnostics.</p></div>}</>}</div>}
      </div>{discard ? <div className="discard-confirmation" role="group" aria-labelledby="discard-question">
        <p id="discard-question">Discard your unsaved changes?</p>
        <div className="editor-actions"><button ref={continueEditing} type="button" onClick={resumeEditing}>Continue editing</button><button type="button" className="destructive" data-affirmative onClick={() => onClose(false)}>Discard changes</button></div>
      </div> : <div className="editor-actions"><button ref={cancel} className="dialog-cancel" type="button" disabled={saving} onClick={requestClose}>Cancel</button><button data-affirmative type="submit" disabled={saving || Boolean(conflict) || identityBlocked}>{saving ? 'Saving…' : 'Save'}</button></div>}
    </form>
  </dialog>;
}
