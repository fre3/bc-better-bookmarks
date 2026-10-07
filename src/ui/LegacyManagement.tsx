import { nodeTags } from '../core/node-tags';
import { favoriteTags as tagsFor } from './favorite-editor';
import { useMemo, useRef, useState } from 'react';
import { diagnosticExport } from '../core/export';
import { confirmLinkInput, editToken, isBookmarklet, safeHref, searchFavorites } from '../core/logic';
import type { Command, Favorite, LinkInput, Snapshot } from '../core/model';

type Editor = { requestId?: string; generation?: string; id?: string; expected?: string; input: LinkInput };
interface Props {
  s: Snapshot;
  tagSnapshot?: Snapshot;
  busy: boolean;
  execute: (command: Command) => Promise<boolean>;
}
// Temporary access to the validated MVP controls until the editing checkpoint.
export function LegacyManagement({ s, tagSnapshot = s, busy, execute }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [diagnostics, setDiagnostics] = useState(false);
  const [editor, setEditor] = useState<Editor>();
  const folderRequest=useRef(crypto.randomUUID());
  const [folderName, setFolderName] = useState('Dashboard Test');
  const [parentId, setParentId] = useState('');

  const effective = useMemo(() => nodeTags(tagSnapshot), [tagSnapshot]);
  const displayFolders = s.folders.filter(f => f.parentId !== undefined);
  const folders = displayFolders.filter(f => f.writable);
  const favorites = s.favorites;
  const results = searchFavorites(favorites.filter(f => !category || f.ancestorIds.includes(category)), query, id => effective.get(id)?.effective ?? []);
  const selectedParent = folders.some(f => f.id === parentId) ? parentId : folders[0]?.id ?? '';
  function edit(f: Favorite) {
    setEditor({ generation: s.metadata.setup?.generation, id: f.id, expected: editToken(f, tagsFor(s!, f.id)), input: { title: f.title, url: f.url, parentId: f.parentId!, tags: tagsFor(s!, f.id) } });
  }
  function exportJson() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(diagnosticExport(s!), null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `better-bookmarks-${Date.now()}.diagnostics.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const nativeReadOnly = Boolean(editor?.id && s.favorites.find(f=>f.id===editor.id)?.nativeRestriction);
  return <div className="legacy">
    <header><div><h1>Better Bookmarks <small>Technical MVP</small></h1><p>Real Edge Favorites · experimental synchronized tags</p></div><button onClick={() => setDiagnostics(!diagnostics)}>{diagnostics ? 'Close diagnostics' : 'Diagnostics'}</button></header>
    <p>Changes modify your real Edge Favorites.</p>
    <div className="toolbar"><input type="search" aria-label="Search Favorites" placeholder="Search links, or use #tag and @category" title="Plain text searches everything; # targets user tags; @ targets category. All terms must match. Lone # and @ are ignored." value={query} onChange={e => setQuery(e.target.value)} />
      <button disabled={busy || !selectedParent} onClick={() => setEditor({ requestId:crypto.randomUUID(), generation: s.metadata.setup?.generation, input: { title: '', url: 'https://', parentId: selectedParent, tags: [] } })}>Add link</button></div>
    {editor && <section className="editor"><h2>{editor.id ? 'Edit Favorite' : 'Add real Edge Favorite'}</h2>
      <form onSubmit={e => { e.preventDefault(); const input = confirmLinkInput(editor.input, message => window.confirm(message)); if (!input) return; const command: Command = editor.id ? { type: 'edit', id: editor.id, expected: editor.expected!, input } : { type: 'create', input, requestId: editor.requestId }; void execute({ ...command, generation: editor.generation }).then(saved => { if (saved) setEditor(undefined); }); }}>
        {nativeReadOnly&&<p>Native fields are read-only in this unclassified browser location. Edit extension tags separately; manage Workspace naming and lifecycle in Edge.</p>}<label>Title<input readOnly={nativeReadOnly} required value={editor.input.title} onChange={e => setEditor({ ...editor, input: { ...editor.input, title: e.target.value } })} /></label>
        <label>URL (HTTP, HTTPS, or bookmarklet)<textarea readOnly={nativeReadOnly} required rows={3} spellCheck={false} value={editor.input.url} onChange={e => setEditor({ ...editor, input: { ...editor.input, url: e.target.value } })} /></label>
        <label>Category<select disabled={nativeReadOnly} value={editor.input.parentId} onChange={e => setEditor({ ...editor, input: { ...editor.input, parentId: e.target.value } })}>{folders.map(f => <option key={f.id} value={f.id}>{f.path.join(' / ')} [ID {f.id}]</option>)}</select></label>
        <label>Tags (comma separated; stored lowercase)<input value={editor.input.tags.join(',')} onChange={e => setEditor({ ...editor, input: { ...editor.input, tags: e.target.value.split(',') } })} placeholder="development, azure, important" /></label>
        <div className="actions"><button disabled={busy} type="submit">Save Favorite</button><button disabled={busy} type="button" onClick={() => setEditor(undefined)}>Cancel</button></div>
      </form></section>}
    <div className="layout"><nav aria-label="Categories"><button className={!category ? 'selected' : ''} onClick={() => setCategory('')}>All in dashboard ({favorites.length})</button>
      {displayFolders.map(f => <button key={f.id} className={category === f.id ? 'selected' : ''} onClick={() => setCategory(f.id)}>{f.path.join(' / ')} <small>({favorites.filter(b => b.ancestorIds.includes(f.id)).length})</small></button>)}
    </nav><section aria-label="Favorites"><p>{results.length} Favorites · browser folder order</p>
      {!results.length && <p>No matching Favorites. Add a test link or adjust the search/category.</p>}
      {displayFolders.filter(folder => results.some(f => f.parentId === folder.id)).map(folder => <section key={folder.id} className="group"><h2>{folder.path.join(' / ')}</h2>
        {results.filter(f => f.parentId === folder.id).map(f => <article key={f.id}>
          <div className="link"><a href={safeHref(f.url)}>{f.title || '(untitled)'}</a><span className="url">{f.url}</span><small>{f.folderPath.join(' / ')}</small>
            <div>{f.systemLabels.map(label => <span className="tag system-label" title="System label derived from URL (read only)" key={`system-${label}`}>{label}</span>)}{tagsFor(s, f.id).map(tag => <span className="tag" key={tag}>{tag}</span>)}{s.reconciliation.matches.some(m => m.status === 'ambiguous' && m.candidateIds.includes(f.id)) && <span className="warning">Ambiguous metadata — inspect diagnostics</span>}</div>
            {!safeHref(f.url) && <small>{isBookmarklet(f.url) ? 'Run this bookmarklet through Edge Favorites.' : "Open this non-HTTP(S) Favorite using Edge's Favorites UI."}</small>}
          </div><div className="actions"><button disabled={busy || Boolean(f.unmodifiable)} onClick={() => edit(f)}>Edit</button><button disabled={busy || Boolean(f.unmodifiable || f.nativeRestriction)} title={f.nativeRestriction} onClick={() => { if (window.confirm(`Delete the real Edge Favorite “${f.title}”? This also affects synchronized devices.`)) void execute({ type: 'delete', generation: s.metadata.setup?.generation, id: f.id, expected: editToken(f, tagsFor(s, f.id)) }); }}>Delete</button></div>
        </article>)}
      </section>)}
      {/* Defensive fallback for unexpected nodes outside any reported folder. */}
      {results.filter(f => !displayFolders.some(folder => folder.id === f.parentId)).map(f => <article key={f.id}><div className="link"><a href={safeHref(f.url)}>{f.title}</a><span className="url">{f.url}</span><small>{f.folderPath.join(' / ')}</small><div>{f.systemLabels.map(label => <span className="tag system-label" title="System label derived from URL (read only)" key={`system-${label}`}>{label}</span>)}{tagsFor(s, f.id).map(t => <span className="tag" key={t}>{t}</span>)}</div>{!safeHref(f.url) && <small>{isBookmarklet(f.url) ? 'Run this bookmarklet through Edge Favorites.' : "Open this Favorite using Edge's Favorites UI."}</small>}</div><span>Read only</span></article>)}
    </section></div>
    <details className="settings"><summary>Category management / test folder setup</summary>
      <form onSubmit={e => { e.preventDefault(); void execute({ type: 'create-folder', parentId: selectedParent, title: folderName, requestId:folderRequest.current,generation:s.metadata.setup?.generation }).then(saved=>{if(saved)folderRequest.current=crypto.randomUUID();}); }}>
        <label>Parent folder<select value={selectedParent} onChange={e => setParentId(e.target.value)}>{folders.map(f => <option key={f.id} value={f.id}>{f.path.join(' / ')} [ID {f.id}]</option>)}</select></label>
        <label>New folder name<input required value={folderName} onChange={e => setFolderName(e.target.value)} /></label>
        <button disabled={busy || !selectedParent}>Create folder</button>
      </form>
      <label>Rename category<select defaultValue="" disabled={busy} onChange={e => {
        const folder = folders.find(f => f.id === e.target.value); e.target.value = '';
        if (!folder) return; const title = window.prompt('New name for this real Edge Favorites folder:', folder.title);
        if (title !== null) void execute({ type: 'rename-folder', id: folder.id, title, expectedTitle: folder.title });
      }}><option value="">Choose folder to rename…</option>{folders.filter(f => f.renamable).map(f => <option key={f.id} value={f.id}>{f.path.join(' / ')} [ID {f.id}]</option>)}</select></label>
    </details>
    {diagnostics && <section className="diagnostics"><h2>Synchronization & identity diagnostics</h2>
      <p>Extension ID: <code>{s.extensionId}</code> · version {s.version}</p>
      <p>{s.syncBytes.toLocaleString()} / {s.quotas.bytes.toLocaleString()} sync bytes · {Object.keys(s.metadata.raw).length} / {s.quotas.items} keys · {s.metadata.records.length} metadata records · {s.favorites.length} Favorites (entire tree)</p>
      <p>Unresolved: {s.reconciliation.matches.filter(m => m.status === 'unresolved').length} · ambiguous: {s.reconciliation.matches.filter(m => m.status === 'ambiguous').length} · deleted: {Object.keys(s.metadata.tombstones).length} · quarantined: {s.metadata.invalid.length}</p>
      <p>Last reconciliation: {s.lastReconciliation}. Transport status: unknown; no remote acknowledgement API.</p>
      <p>Local metadata preservation: {s.preservation.available ? `${s.preservation.stableIds.length} identities` : 'unavailable — publication blocked'}. Automatic recovery is disabled.</p>
      <div className="actions"><button disabled={busy} onClick={() => void execute({ type: 'snapshot' })}>Force Favorites reload</button><button disabled={busy} onClick={() => void execute({ type: 'reconcile' })}>Force reconciliation</button><button onClick={() => console.info('Sanitized Favorites diagnostics', diagnosticExport(s))}>Dump sanitized state to console</button><button onClick={exportJson}>Export diagnostic JSON</button></div>
      <p>Export includes Favorites, folder hierarchy, tags and mappings. Common URL secrets are redacted; review before sharing.</p>
      <div className="table-scroll"><table><thead><tr>{['ID / parent / order', 'Title / URL', 'Full folder path', 'Browser fields', 'stableId / tags', 'Local mapping / reconciliation'].map(t => <th key={t}>{t}</th>)}</tr></thead><tbody>{s.favorites.map(f => {
        const map = s.local.mappings[f.id]; const match = s.reconciliation.matches.find(m => m.bookmarkId === f.id || m.candidateIds.includes(f.id) || m.stableId === map?.stableId);
        const health = s.metadataHealth[map?.stableId ?? match?.stableId ?? ''];
        return <tr key={f.id}><td>{f.id} / {f.parentId} / {f.index}</td><td>{f.title}<br/>{f.url}</td><td>{f.folderPath.join(' / ')}</td><td>syncing: {String(f.syncing ?? 'not exposed')}<br/>managed: {f.unmodifiable ?? 'no'}<br/>dateAdded: {f.dateAdded ?? 'not exposed'}</td><td>{map?.stableId ?? 'none'}<br/>{tagsFor(s, f.id).join(', ')}</td><td>{map?.method ?? 'unmapped'}<br/>{match?.status ?? (health ? 'no active match' : 'no assigned metadata')}<br/>{health && <span>Metadata: {health.status} · raw meta: {health.rawMeta} · locally preserved: {String(health.preservedLocally)}</span>}</td></tr>;
      })}</tbody></table></div>
      <details><summary>Record matches, orphaned histories, and browser folder fields</summary><pre>{JSON.stringify({ matches: s.reconciliation.matches, folders: s.folders.map(f => ({ id: f.id, parentId: f.parentId, path: f.path, folderType: f.folderType, syncing: f.syncing, unmodifiable: f.unmodifiable, nativeRestriction: f.nativeRestriction, writable: f.writable, renamable: f.renamable })), orphanHistories: Object.keys(s.metadata.histories).filter(id => !s.metadata.records.some(r => r.stableId === id)), pendingDeletions: s.local.pendingDeletions, quotas: s.quotas }, null, 2)}</pre></details>
      <h3>Recent events / decisions (origin of storage events is not exposed)</h3><ol className="logs">{s.logs.slice().reverse().map((l, i) => <li key={i}><time>{l.time}</time> {l.message}</li>)}</ol>
    </section>}
    <footer>Favorites are authoritative. No bookmark database, backend, telemetry, or automatic destructive migrations.</footer>
  </div>;
}
