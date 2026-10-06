import { FolderBindingReview } from './FolderBindingReview';
import { useRef, useState } from 'react';
import { requestMetadataBackup, requestMetadataReset, type MetadataBackup } from '../browser/metadata-setup';
import type { Command, Snapshot } from '../core/model';

export function MetadataSetup({ snapshot, execute, onReset }: { snapshot?: Snapshot; execute?: (command: Command) => Promise<boolean>; onReset: () => void }) {
  const [backup, setBackup] = useState<MetadataBackup>();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const active = useRef(false);
  async function run(work: () => Promise<void>) {
    if (active.current) return;
    active.current = true; setBusy(true); setError('');
    try { await work(); } catch (e) { setError(String(e)); }
    finally { active.current = false; setBusy(false); }
  }
  return <details id="folder-binding-review" className="metadata-setup"><summary>Folder identity review and test metadata setup</summary>
    {snapshot && execute && <FolderBindingReview snapshot={snapshot} execute={async command => await execute(command) ? undefined : { error: 'The folder could not be confirmed. Review the refreshed candidates and diagnostics.' }} />}
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
