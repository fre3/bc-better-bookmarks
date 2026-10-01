import { useEffect, useState } from 'react';
import { onDashboardChanged, sendCommand } from '../browser/client';
import type { Command, Snapshot } from '../core/model';
import { Catalogue } from './Catalogue';
import { LegacyManagement } from './LegacyManagement';
import './legacy.css';

export function App() {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [managing, setManaging] = useState(false);
  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => { void sendCommand({ type: 'snapshot' }).then(value => { if (!disposed) setSnapshot(value); }).catch(e => { if (!disposed) setError(String(e)); }); };
    refresh();
    const remove = onDashboardChanged(() => { clearTimeout(timer); timer = setTimeout(refresh, 150); });
    return () => { disposed = true; clearTimeout(timer); remove(); };
  }, []);
  async function execute(command: Command) {
    setBusy(true); setError(''); setNotice('');
    try {
      setSnapshot(await sendCommand(command));
      if (!['snapshot', 'reconcile'].includes(command.type)) setNotice('Saved in this browser.');
      return true;
    } catch (e) {
      setError(String(e));
      try { setSnapshot(await sendCommand({ type: 'snapshot' })); } catch { /* Original error is more useful. */ }
      return false;
    } finally { setBusy(false); }
  }
  if (!snapshot) return <main><h1>Better Bookmarks</h1><p role="status">{error || 'Reading Edge Favorites…'}</p><button onClick={() => void execute({ type: 'snapshot' })}>Retry</button></main>;
  return <main>
    {error && <p className="status-error" role="alert">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {snapshot.errors.length > 0 && <details className="status-error"><summary>{snapshot.errors.length} diagnostic warnings/errors</summary><ul>{snapshot.errors.map((message, i) => <li key={i}>{message}</li>)}</ul></details>}
    <Catalogue snapshot={snapshot} suspended={managing} onManage={() => { setManaging(true); setNotice(''); }} />
    {managing && <>
      <div className="management-heading"><span>Existing management controls · editing redesign follows visual review</span><button onClick={() => { setManaging(false); setNotice(''); }}>Back to catalogue</button></div>
      <LegacyManagement s={snapshot} busy={busy} execute={execute} />
    </>}
  </main>;
}
