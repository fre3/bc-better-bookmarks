import { useEffect, useState } from 'react';
import { onPeekPreference, readPeekPreference, setPeekPreference } from '../browser/ui-preferences';

export function usePeekPreference() {
  // Wait for the stored value before enabling motion; never briefly override a
  // saved opt-out while a New Tab is loading.
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let disposed = false, changed = false;
    const remove = onPeekPreference(value => { changed = true; setEnabled(value); setReady(true); });
    void readPeekPreference().then(value => {
      if (!disposed) { if (!changed) setEnabled(value); setReady(true); }
    }).catch(e => { if (!disposed) setError(String(e)); });
    return () => { disposed = true; remove(); };
  }, []);
  async function update(value: boolean) {
    const previous = enabled;
    setEnabled(value); setSaving(true); setError('');
    try { await setPeekPreference(value); }
    catch (e) { setEnabled(previous); setError(String(e)); }
    finally { setSaving(false); }
  }
  return { enabled, ready, saving, error, update };
}
