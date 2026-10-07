import { useRef, useState } from 'react';
import { requestMetadataBackup, requestMetadataReset, type MetadataBackup } from '../browser/metadata-setup';

export function MetadataSetup({ onReset }: { onReset: () => void }) {
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
  return <details id="advanced-metadata-recovery" className="metadata-setup"><summary>Advanced: reset extension metadata</summary>
    <h3>Destructive metadata recovery</h3>
    <p>This discards extension tags, identities, locator history, tombstones, local mappings and the preservation journal. It never modifies browser bookmarks or folders. Appearance, Show archived and preview preferences remain. Disable old clients on every device first; upgrade all devices before re-enabling. Close editing drafts and stop metadata writes during recovery.</p>
    <button disabled={busy} onClick={() => void run(async () => {
      const value = await requestMetadataBackup();
      const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = `indexfold-metadata-backup-${Date.now()}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000); setBackup(value); setConfirmed(false);
    })}>Export metadata and review reset inventory</button>
    {backup && <><p>Backup download requested. Verify that you have the file; it contains private titles, URLs and tags. Inventory:</p><pre>{JSON.stringify({ synchronized: backup.affectedSyncKeys, local: backup.affectedLocalKeys, setupMarker: 'setup:epoch (replaced)' }, null, 2)}</pre><label><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /> I have verified metadata backups for every device and disabled all old clients.</label><button disabled={!confirmed || busy} onClick={() => void run(async () => { await requestMetadataReset(backup.expected); setBackup(undefined); setConfirmed(false); onReset(); })}>Reset extension bookmark metadata only</button></>}
    {error && <p role="alert">{error}</p>}
  </details>;
}
