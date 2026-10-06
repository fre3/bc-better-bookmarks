import { useRef, useState } from 'react';
import type { Command, Snapshot } from '../core/model';
import type { SaveFailure } from '../core/edit-failure';
import { errorText } from '../core/edit-failure';
import { folderEditToken } from '../core/node-tags';
import { folderBindings } from './folder-bindings';

type Execute = (command: Command) => Promise<SaveFailure | undefined>;
export interface BindingReviewProps { snapshot: Snapshot; execute: Execute; folderId?: string; onComplete?: (archived: boolean) => void }
export function FolderBindingReview({ snapshot, execute, folderId, onComplete }: BindingReviewProps) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const active = useRef(false);
  const reviews = folderBindings(snapshot);
  const localFolder = snapshot.folders.find(folder => folder.id === folderId);
  const relevant = folderId ? snapshot.reconciliation.matches.filter(match => match.candidateIds.includes(folderId)) : [];
  const fingerprint = (id: string) => {
    const row = reviews.find(row => row.match.stableId === id);
    return row?.available && row.folder ? JSON.stringify([snapshot.metadata.setup?.generation, row.record, row.match, folderEditToken(snapshot, row.folder)]) : '';
  };
  const stale = Object.entries(selected).some(([id, value]) => value !== fingerprint(id));
  const validIds = Object.keys(selected).filter(id => selected[id] === fingerprint(id) && fingerprint(id));
  async function confirm() {
    if (active.current || stale || !validIds.length) return;
    active.current = true; setSaving(true); setError('');
    let completed = 0, archived = false;
    try {
      for (const id of validIds) {
        const row = reviews.find(row => row.match.stableId === id)!;
        const failure = await execute({ type: 'attach-folder', id: row.folder!.id, stableId: id, expected: folderEditToken(snapshot, row.folder!), generation: snapshot.metadata.setup?.generation });
        if (failure) throw new Error(failure.error);
        completed++; archived ||= row.record.tags.includes('archived');
        setSelected(value => { const next = { ...value }; delete next[id]; return next; });
      }
      onComplete?.(archived);
    } catch (failure) { setError(`${errorText(failure)}${completed ? ` ${completed} earlier association(s) were confirmed; review the remaining entries.` : ''}`); }
    finally { active.current = false; setSaving(false); }
  }
  return <div className="folder-binding-workflow" aria-busy={saving}>
    {folderId && <p>Local folder: <strong>{localFolder?.path.join(' / ') ?? 'Removed or no longer available'}</strong></p>}
    <p>Received folder metadata needs confirmation before it can be applied on this device. Matching names or paths do not prove identity. Select only associations you recognize as the original folders, never copies.</p>
    <p>Tags and archive status below belong to proposed records, not yet-confirmed local assignments. Confirming applies already-received metadata; it does not edit Edge Favorites.</p>
    {stale && <p role="alert">Candidates or proposed metadata changed. Review the current details and select again before confirming. <button type="button" disabled={saving} onClick={() => setSelected({})}>Clear changed selection</button></p>}
    {reviews.length ? <ul className="binding-records">{reviews.map(row => <li key={row.match.stableId} data-binding-id={row.match.stableId} className={row.match.candidateIds.includes(folderId ?? '') ? 'binding-relevant' : undefined}>
      <label><input type="checkbox" disabled={!row.available || saving} checked={Boolean(selected[row.match.stableId]) && selected[row.match.stableId] === fingerprint(row.match.stableId)} onChange={event => setSelected(value => { const next = { ...value }; if (event.target.checked) next[row.match.stableId] = fingerprint(row.match.stableId); else delete next[row.match.stableId]; return next; })} /> Proposed record: <strong>{row.record.initialLocator.folderPath.map(part => part.value).concat(row.record.initialLocator.title).join(' / ')}</strong></label>
      <p>Received direct tags (read only): {row.record.tags.map(tag => `#${tag}`).join(' · ') || '(none)'}. Proposed archive status: {row.record.tags.includes('archived') ? 'archived' : 'not directly archived'}.</p>
      <p>{row.available ? 'Pending confirmation' : row.ambiguous ? 'Ambiguous or competing identities — no safe confirmation is available' : !row.folder ? 'Missing candidate — wait for the native folder or review it in Edge Favorites' : 'Unavailable — this candidate is restricted, already bound, or metadata integrity prevents confirmation'}.</p>
      {row.record.tags.includes('archived') && <p>After confirmation, this folder and its contents are hidden unless Show archived is enabled in Manage.</p>}
      <p>Local candidates: {row.match.candidateIds.length ? row.match.candidateIds.map(id => `${snapshot.folders.find(folder => folder.id === id)?.path.join(' / ') ?? 'Missing folder'} [folder ${id}]`).join('; ') : '(none)'}</p>
      <details><summary>Full identity details</summary><p>Identity: {row.record.stableId}<br />Reconciliation: {row.match.status}</p></details>
    </li>)}</ul> : <p>No pending folder bindings.</p>}
    {folderId && snapshot.local.mappings[folderId] && !snapshot.reconciliation.mappings[folderId] && <p>Existing local identity cannot currently be resolved. Metadata health: {snapshot.metadataHealth[snapshot.local.mappings[folderId].stableId]?.status ?? 'unresolved'}. Review Manage diagnostics; missing metadata is never recreated by this dialog.</p>}
    {folderId && !reviews.some(row => row.match.candidateIds.includes(folderId)) && relevant.length > 0 && <p>This location also matches metadata bound to another folder. Copies do not receive the original identity. Review the folders in Edge Favorites; no association can be confirmed here.</p>}
    {error && <p className="editor-error" role="alert">{error}</p>}
    <button type="button" disabled={saving || stale || !validIds.length} onClick={() => void confirm()}>{saving ? 'Confirming…' : 'Confirm binding'}</button>
  </div>;
}
