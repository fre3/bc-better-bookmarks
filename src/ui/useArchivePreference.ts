import { useEffect, useState } from 'react';
import { onArchivePreference, readArchivePreference, setArchivePreference } from '../browser/archive-preference';

export function useArchivePreference() {
  // Default to exclusion while loading. Subscribe before reading so a late read
  // cannot overwrite a newer cross-tab preference change.
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let disposed = false, changed = false;
    const remove = onArchivePreference(value => { changed = true; setEnabled(value); setReady(true); });
    void readArchivePreference().then(value => {
      if (!disposed) { if (!changed) setEnabled(value); setReady(true); }
    }).catch(e => { if (!disposed) setError(String(e)); });
    return () => { disposed = true; remove(); };
  }, []);
  async function update(value: boolean) {
    const previous = enabled;
    setEnabled(value); setSaving(true); setError('');
    try { await setArchivePreference(value); }
    catch (e) { setEnabled(previous); setError(String(e)); }
    finally { setSaving(false); }
  }
  return { enabled, ready, saving, error, update };
}
