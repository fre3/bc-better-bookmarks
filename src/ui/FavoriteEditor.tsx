import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { confirmLinkInput, isBookmarklet } from '../core/logic';
import { linkInputErrors, type LinkErrors } from '../core/link-input';
import type { Command, Snapshot } from '../core/model';
import { draftConflict, type FavoriteDraft } from './favorite-editor';
import './favorite-editor.css';

interface Props {
  draft: FavoriteDraft;
  snapshot: Snapshot;
  execute: (command: Command) => Promise<string | undefined>;
  onClose: (saved: boolean) => void;
}
export function FavoriteEditor({ draft, snapshot, execute, onClose }: Props) {
  const [input, setInput] = useState(draft.input);
  const [errors, setErrors] = useState<LinkErrors>({});
  const [failure, setFailure] = useState('');
  const [discard, setDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLInputElement>(null);
  const continueEditing = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const dirty = JSON.stringify(input) !== JSON.stringify(draft.input);
  const conflict = draftConflict(snapshot, draft);
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
    setErrors(nextErrors); setFailure('');
    if (Object.keys(nextErrors).length) {
      const field = nextErrors.title ? 'title' : nextErrors.url ? 'url' : 'tags';
      document.getElementById(`favorite-edit-${field}`)?.focus(); return;
    }
    const confirmed = confirmLinkInput(input, message => window.confirm(message));
    if (!confirmed) return;
    submitting.current = true; setSaving(true); title.current?.focus({ preventScroll: true });
    try {
      const error = await execute({ type: 'edit', id: draft.id, expected: draft.expected, input: confirmed });
      if (error !== undefined) setFailure(error); else onClose(true);
    } catch (error) { setFailure(String(error)); }
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
    <h2 id="favorite-editor-heading">Edit Favorite</h2>
    <p id="favorite-edit-folder" className="editor-context">Folder: {draft.folder || '(root)'}</p>
    <form noValidate onSubmit={event => { event.preventDefault(); void save(); }} aria-busy={saving}>
      <label htmlFor="favorite-edit-title">Title</label>
      <input ref={title} id="favorite-edit-title" value={input.title} readOnly={saving} required aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'favorite-title-error' : undefined} onChange={e => setInput({ ...input, title: e.target.value })} />
      {errors.title && <p id="favorite-title-error" className="editor-error">{errors.title}</p>}
      <label htmlFor="favorite-edit-url">URL (HTTP, HTTPS, or bookmarklet)</label>
      <textarea id="favorite-edit-url" rows={3} spellCheck={false} value={input.url} readOnly={saving} required aria-invalid={Boolean(errors.url)} aria-describedby={errors.url ? 'favorite-url-error' : undefined} onChange={e => setInput({ ...input, url: e.target.value })} />
      {errors.url && <p id="favorite-url-error" className="editor-error">{errors.url}</p>}
      <label htmlFor="favorite-edit-tags">Tags (comma separated; stored lowercase)</label>
      <input id="favorite-edit-tags" value={input.tags.join(',')} readOnly={saving} aria-invalid={Boolean(errors.tags)} aria-describedby={errors.tags ? 'favorite-tags-error' : undefined} onChange={e => setInput({ ...input, tags: e.target.value.split(',') })} />
      {errors.tags && <p id="favorite-tags-error" className="editor-error">{errors.tags}</p>}
      {conflict && <p className="editor-error" role="alert">{conflict}</p>}
      {failure && <p className="editor-error" role="alert">{failure}</p>}
      {discard ? <div className="discard-confirmation" role="group" aria-labelledby="discard-question">
        <p id="discard-question">Discard your unsaved changes?</p>
        <div className="editor-actions"><button type="button" onClick={() => onClose(false)}>Discard changes</button><button ref={continueEditing} type="button" onClick={resumeEditing}>Continue editing</button></div>
      </div> : <div className="editor-actions"><button type="submit" disabled={saving || Boolean(conflict)}>{saving ? 'Saving…' : 'Save'}</button><button ref={cancel} type="button" disabled={saving} onClick={requestClose}>Cancel</button></div>}
    </form>
  </dialog>;
}
