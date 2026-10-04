import { useEffect, useState } from 'react';
import { appearancePreference, onAppearance, readAppearance, setAppearance, type Appearance } from '../browser/appearance';

export function AppearanceSetting() {
  const [value, setValue] = useState<Appearance>(() => appearancePreference(document.documentElement.dataset.appearance));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let disposed = false, changed = false;
    const remove = onAppearance(next => { changed = true; setValue(next); });
    void readAppearance().then(next => { if (!disposed && !changed) setValue(next); }).catch(e => { if (!disposed) setError(String(e)); });
    return () => { disposed = true; remove(); };
  }, []);
  async function update(next: Appearance) {
    setSaving(true); setError('');
    try { await setAppearance(next); }
    catch (e) { setError(String(e)); }
    finally { setSaving(false); }
  }
  return <div className="appearance-setting">
    <label htmlFor="appearance">Appearance</label>{' '}<select id="appearance" aria-describedby="appearance-help" value={value} aria-busy={saving} onChange={e => void update(appearancePreference(e.target.value))}>
      <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
    </select> <small id="appearance-help">On this device · System follows your device appearance</small>
    {error && <p className="status-error" role="alert">{error}</p>}
  </div>;
}
