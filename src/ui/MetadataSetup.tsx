import { folderBindings } from './folder-bindings';
import { useRef, useState } from 'react';
import { requestMetadataBackup, requestMetadataReset, type MetadataBackup } from '../browser/metadata-setup';
import { folderEditToken } from '../core/node-tags';
import type { Command, Snapshot } from '../core/model';

export function MetadataSetup({ snapshot, execute, onReset, showArchived = false }: { snapshot?: Snapshot; showArchived?: boolean; execute?: (command: Command) => Promise<boolean>; onReset: () => void }) {
  const [backup, setBackup] = useState<MetadataBackup>();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const active = useRef(false);
  const [selected, setSelected] = useState<string[]>([]);
  const reviews = snapshot ? folderBindings(snapshot, showArchived) : [];
  const unresolved = reviews.map(review => review.match);
  async function run(work: () => Promise<void>) {
    if (active.current) return;
    active.current = true; setBusy(true); setError('');
    try { await work(); } catch (e) { setError(String(e)); }
    finally { active.current = false; setBusy(false); }
  }
  return <details id="folder-binding-review" className="metadata-setup"><summary>Folder identity review and test metadata setup</summary>
    <p>Folder matches require confirmation on each unbound device. Matching names and paths do not prove identity. Confirm only the original folder, never a copy. Ambiguous or missing candidates stay unresolved; they are not untagged folders.</p>
    {unresolved.length ? <><ul>{reviews.map(({ match, record, folder, available, ambiguous }) => {
      return <li key={match.stableId}><label><input type="checkbox" disabled={!available || busy} checked={selected.includes(match.stableId)} onChange={e => setSelected(e.target.checked ? [...selected, match.stableId] : selected.filter(id => id !== match.stableId))} /> {record.initialLocator.folderPath.map(p => p.value).concat(record.initialLocator.title).join(' / ')} — {record.tags.map(t => `#${t}`).join(' · ') || '(empty direct tags)'} — {available ? `candidate: ${folder!.path.join(' / ')} [folder ${folder!.id}]` : ambiguous ? 'ambiguous — review in Edge Favorites' : 'unresolved — no unique available folder'}</label></li>;
    })}</ul><button disabled={busy || !selected.length} onClick={() => void run(async () => {
      for (const id of selected) {
        const match = unresolved.find(m => m.stableId === id), folder = snapshot?.folders.find(f => f.id === match?.candidateIds[0]);
        if (!folder || !snapshot || !execute || !await execute({ type: 'attach-folder', id: folder.id, stableId: id, expected: folderEditToken(snapshot, folder), generation: snapshot.metadata.setup?.generation })) throw new Error('A folder could not be attached. Already confirmed bindings remain; review the current list.');
      }
      setSelected([]);
    })}>Confirm selected original folders</button></> : <p>No visible unresolved folder metadata. Enable Show archived to include archived entries.</p>}
    <h3>Controlled test metadata reset</h3>
    <p>This discards extension tags, identities, locator history, tombstones, local mappings and the preservation journal. It never modifies Edge Favorites or folders. Appearance, Show archived and preview preferences remain. Disable old clients on every device first; upgrade all devices before re-enabling. Close editing drafts and stop metadata writes during setup.</p>
    <button disabled={busy} onClick={() => void run(async () => {
      const value = await requestMetadataBackup();
      const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = `better-bookmarks-metadata-backup-${Date.now()}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000); setBackup(value); setConfirmed(false);
    })}>Export metadata and review reset inventory</button>
    {backup && <><p>Backup download requested. Verify that you have the file; it contains private titles, URLs and tags. Inventory:</p><pre>{JSON.stringify({ synchronized: backup.affectedSyncKeys, local: backup.affectedLocalKeys, setupMarker: 'setup:epoch (replaced)' }, null, 2)}</pre><label><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /> I have verified metadata backups for every device and disabled all old clients.</label><button disabled={!confirmed || busy} onClick={() => void run(async () => { await requestMetadataReset(backup.expected); setBackup(undefined); setConfirmed(false); onReset(); })}>Reset extension bookmark metadata only</button></>}
    {error && <p role="alert">{error}</p>}
  </details>;
}
