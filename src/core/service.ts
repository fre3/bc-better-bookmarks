import type { BookmarksRepository } from '../browser/bookmarks';
import { QUOTAS, type MetadataRepository } from '../browser/metadata';
import { editToken, flattenTree, normalizeTags } from './logic';
import type { Command, Favorite, LinkInput, LocalState, LogEntry, Snapshot } from './model';
import { folderNode, folderEditToken } from './node-tags';
import { EditFailure, type EditProgress } from './edit-failure';
import { reconcile } from './reconcile';
import { validateLinkInput } from './link-input';
import { metadataHealth } from './metadata-diagnostics';

export class DashboardService {
  private logs: LogEntry[] | undefined;
  constructor(private readonly bookmarks: BookmarksRepository, private readonly metadata: MetadataRepository,
    private readonly identity: { extensionId: string; version: string; quotas?: typeof QUOTAS },
    private readonly uuid: () => string = () => crypto.randomUUID(),
    private readonly now: () => string = () => new Date().toISOString()) {}
  private async log(message: string) {
    await this.appendLogs([{ time: this.now(), message }]);
    if (import.meta.env.DEV) console.debug('[reconciliation]', message);
  }
  private async appendLogs(entries: LogEntry[]) {
    this.logs ??= await this.metadata.readLogs();
    this.logs = [...this.logs, ...entries].slice(-60);
    await this.metadata.saveLogs(this.logs);
  }
  async syncChanged(entries: LogEntry[]) {
    try { await this.appendLogs(entries); }
    catch { console.warn('Could not persist sync change diagnostics.'); }
    return this.snapshot('storage.sync.changed (origin unknown)');
  }
  async snapshot(reason: string): Promise<Snapshot> {
    const [tree, metadata, local] = await Promise.all([this.bookmarks.getTree(), this.metadata.read(), this.metadata.readLocal()]);
    if (metadata.setup?.phase === 'resetting' || metadata.setup?.generation !== local.metadataEpoch) throw new Error('Metadata setup changed; reload the snapshot before writing.');
    const { favorites, folders } = flattenTree(tree);
    const nodes = [...favorites, ...folders.filter(f => f.renamable).map(f => folderNode(f, folders))];
    const result = reconcile(nodes, metadata, local.mappings, local.pendingDeletions);
    const errors = [...metadata.invalid, ...result.warnings, ...(metadata.ignored?.length ? [`${metadata.ignored.length} old-generation metadata keys ignored after setup reset; no tags were restored.`] : [])];
    const patch: Record<string, unknown> = { ...result.historyWrites };
    for (const id of local.pendingDeletions) if (!metadata.tombstones[id]) patch[`dead:${id}`] = { ...(metadata.setup ? { generation: metadata.setup.generation } : {}), schemaVersion: 1, stableId: id, deletedAt: this.now() };
    let saved = true;
    try { await this.metadata.write(patch); } catch (error) { saved = false; errors.push(String(error)); }
    if (saved) {
      local.mappings = { ...local.mappings, ...result.mappings };
      local.pendingDeletions = [];
      await this.metadata.saveLocal(local);
    }
    const finalMetadata = saved && Object.keys(patch).length ? await this.metadata.read() : metadata;
    const finalResult = reconcile(nodes, finalMetadata, local.mappings, local.pendingDeletions);
    const preservation: Snapshot['preservation'] = { available: true, stableIds: [] };
    try { preservation.stableIds = Object.keys((await this.metadata.readJournal()).entries); }
    catch { preservation.available = false; errors.push('Local metadata journal unreadable or unsupported; metadata publication is blocked.'); }
    const health = metadataHealth(finalMetadata, local, finalResult, preservation.stableIds);
    const problems = Object.entries(health).filter(([, h]) => h.status !== 'valid').map(([id, h]) => `${id.slice(0, 8)}=${h.status} (raw meta ${h.rawMeta}, locally preserved ${h.preservedLocally})`);
    if (problems.length) await this.log(`Metadata health: ${problems.join('; ')}`);
    await this.log(`${reason}: ${favorites.length} Favorites; ${finalResult.matches.map(m => `${m.stableId.slice(0, 8)}=${m.status}${m.bookmarkId ? `(${m.bookmarkId})` : ''}`).join(', ') || 'no metadata'}${errors.length ? `; ${errors.length} errors/warnings` : ''}`);
    return { schemaVersion: 1, ...this.identity, tree, favorites, folders, metadata: finalMetadata, local,
      reconciliation: finalResult, metadataHealth: health, preservation, syncBytes: await this.metadata.bytes(), quotas: this.identity.quotas ?? QUOTAS,
      lastReconciliation: this.now(), logs: this.logs ?? [], errors };
  }
  async removed(ids: string[]) {
    const local = await this.metadata.readLocal();
    const deleted = ids.map(id => local.mappings[id]?.stableId).filter((id): id is string => Boolean(id));
    local.pendingDeletions = [...new Set([...local.pendingDeletions, ...deleted])];
    await this.metadata.saveLocal(local);
    return this.snapshot('bookmarks.removed');
  }
  private inScope(node: { id: string; ancestorIds: string[] }, local: LocalState) {
    return local.rootId !== null && (local.rootId === '*' || node.id === local.rootId || node.ancestorIds.includes(local.rootId));
  }
  private folder(snapshot: Snapshot, id: string, allowSetup = false) {
    const f = snapshot.folders.find(f => f.id === id);
    if (!f?.writable || (!allowSetup && !this.inScope(f, snapshot.local))) throw new Error('Choose a writable folder inside the configured dashboard root.');
    return f;
  }
  private favorite(snapshot: Snapshot, id: string, expected: string) {
    const f = snapshot.favorites.find(f => f.id === id);
    if (!f || f.unmodifiable || !this.inScope(f, snapshot.local)) throw new Error('Favorite is missing, managed, or outside the dashboard root.');
    if (editToken(f, this.tags(snapshot, id)) !== expected) throw new Error('This Favorite or its tags changed since editing began. Cancel and reopen the editor.');
    return f;
  }
  private tags(snapshot: Snapshot, id: string) {
    const mapping = snapshot.reconciliation.mappings[id];
    return snapshot.metadata.records.find(r => r.stableId === mapping?.stableId)?.tags ?? [];
  }
  private validate(input: LinkInput): LinkInput {
    return validateLinkInput(input);
  }
  private preflightTags(state: Snapshot, favorite: Favorite, tags: string[]) {
    if (state.metadata.invalid.length) throw new Error('Unsupported synchronized data is present. Tag writes are blocked until reviewed in diagnostics.');
    if (state.reconciliation.matches.some(m => m.status === 'ambiguous' && m.candidateIds.includes(favorite.id))) throw new Error('Ambiguous metadata match. Tags were not written.');
    const previousId = state.local.mappings[favorite.id]?.stableId;
    if (previousId && (state.metadata.tombstones[previousId] || state.local.pendingDeletions.includes(previousId))) throw new Error('Deletion evidence exists for this Favorite. Editing its metadata is blocked; inspect diagnostics.');
    const mapping = state.reconciliation.mappings[favorite.id];
    const existing = state.metadata.records.find(r => r.stableId === mapping?.stableId);
    if (previousId && mapping && mapping.stableId !== previousId) throw new Error('Conflicting local identity. Editing is blocked; inspect diagnostics.');
    if (!existing && previousId) {
      if (state.metadataHealth[previousId]?.rawMeta === 'absent') throw new Error('Known identity has missing synchronized metadata. Identity retained; automatic recovery is disabled. Inspect diagnostics and local preservation status.');
      throw new Error('Existing local identity has no usable metadata. Editing is blocked; inspect diagnostics.');
    }
    const willWrite = existing ? JSON.stringify(existing.tags) !== JSON.stringify(tags) : tags.length > 0;
    if (willWrite && !state.preservation.available) throw new Error('Local metadata journal is unavailable. Metadata publication is blocked; inspect diagnostics.');
    return existing;
  }
  private async setTags(favorite: Favorite, tags: string[]) {
    const state = await this.snapshot('before tag write');
    const existing = this.preflightTags(state, favorite, tags);
    const mapping = state.reconciliation.mappings[favorite.id];
    if (existing && JSON.stringify(existing.tags) === JSON.stringify(tags)) return;
    if (!existing && !tags.length) return;
    const stableId = existing?.stableId ?? this.uuid();
    const record = { ...(state.metadata.setup ? { generation: state.metadata.setup.generation } : {}), schemaVersion: 2 as const, stableId, initialLocator: existing?.initialLocator ?? favorite.locator, tags, updatedAt: this.now() };
    const local = await this.metadata.readLocal();
    local.mappings[favorite.id] = { stableId, lastLocator: favorite.locator, dateAdded: favorite.dateAdded, method: mapping?.method ?? 'explicit' };
    await this.metadata.write({ [`meta:${stableId}`]: record }, local);
  }
  async command(command: Command): Promise<Snapshot> {
    if (command.type === 'snapshot' || command.type === 'reconcile') return this.snapshot(command.type);
    const s = await this.snapshot(`before ${command.type}`);
    if (['create', 'edit', 'edit-folder', 'attach-folder'].includes(command.type) && command.generation !== s.metadata.setup?.generation) throw new Error('Metadata was reset since this draft opened. Copy needed input, cancel and reopen.');
    if (command.type === 'set-root') {
      if (command.rootId !== null && command.rootId !== '*') this.folder(s, command.rootId, true);
      await this.metadata.saveLocal({ ...s.local, rootId: command.rootId });
    } else if (command.type === 'create-folder') {
      this.folder(s, command.parentId, s.local.rootId === null);
      if (!command.title.trim()) throw new Error('Folder name is required.');
      const folder = await this.bookmarks.create({ parentId: command.parentId, title: command.title.trim() });
      if (s.local.rootId === null) await this.metadata.saveLocal({ ...s.local, rootId: folder.id });
    } else if (command.type === 'attach-folder') {
      const folder = this.folder(s, command.id);
      if (!folder.renamable || folderEditToken(s, folder) !== command.expected) throw new Error('Folder changed or is restricted. Reopen its editor.');
      const match = s.reconciliation.matches.find(m => m.stableId === command.stableId);
      const record = s.metadata.records.find(r => r.stableId === command.stableId && r.initialLocator.kind === 'folder');
      if (!record || !match || match.status !== 'unresolved' || match.candidateIds.length !== 1 || match.candidateIds[0] !== folder.id || s.metadata.invalid.length || s.local.mappings[folder.id] || s.local.pendingDeletions.includes(record.stableId)) throw new Error('Folder identity is ambiguous, missing or already bound. No attachment was made.');
      if (s.reconciliation.matches.some(m => m.stableId !== record.stableId && m.candidateIds.includes(folder.id))) throw new Error('Competing folder identities; attachment blocked.');
      s.local.mappings[folder.id] = { stableId: record.stableId, lastLocator: folderNode(folder, s.folders).locator, dateAdded: folder.dateAdded, method: 'explicit' };
      await this.metadata.saveLocal(s.local);
    } else if (command.type === 'edit-folder') {
      const folder = this.folder(s, command.id);
      if (!folder.renamable) throw new Error('Browser-owned or managed folders cannot be edited.');
      if (folderEditToken(s, folder) !== command.expected) throw new Error('Folder or direct tags changed. Reopen the editor.');
      if (!command.title.trim()) throw new Error('A name is required.');
      const tags = normalizeTags(command.tags);
      if (tags.length > 30 || tags.some(t => t.length > 80)) throw new Error('Use at most 30 tags of 80 characters each.');
      const node = folderNode(folder, s.folders);
      this.preflightTags(s, node, tags);
      if (!s.reconciliation.mappings[folder.id] && s.reconciliation.matches.some(m => m.candidateIds.includes(folder.id))) throw new Error('Review the existing folder metadata before assigning tags; no identity was guessed.');
      const progress: EditProgress = { title: false, url: false, location: false, tags: 'not-confirmed' };
      try {
        if (folder.title !== command.title.trim()) { await this.bookmarks.update(folder.id, { title: command.title.trim() }); progress.title = true; }
        const fresh = flattenTree(await this.bookmarks.getTree()).folders;
        const current = fresh.find(f => f.id === folder.id);
        if (!current) throw new Error('Folder disappeared during edit.');
        await this.setTags(folderNode(current, fresh), tags);
      } catch (error) { throw new EditFailure(`Folder save did not complete. ${String(error)}`, progress); }
    } else if (command.type === 'rename-folder') {
      const folder = this.folder(s, command.id);
      if (!folder.renamable) throw new Error('Browser-owned root folders cannot be renamed.');
      if (folder.title !== command.expectedTitle) throw new Error('Folder changed. Reopen the editor.');
      if (!command.title.trim()) throw new Error('Folder name is required.');
      await this.bookmarks.update(command.id, { title: command.title.trim() });
    } else if (command.type === 'delete') {
      this.favorite(s, command.id, command.expected);
      await this.bookmarks.removeLink(command.id);
      await this.removed([command.id]);
    } else if (command.type === 'create') {
      const input = this.validate(command.input);
      this.folder(s, input.parentId);
      const node = await this.bookmarks.create({ parentId: input.parentId, title: input.title, url: input.url });
      try {
        const fresh = flattenTree(await this.bookmarks.getTree()).favorites.find(f => f.id === node.id);
        if (!fresh) throw new Error('Created Favorite is no longer present.');
        await this.setTags(fresh, input.tags);
      } catch (error) { throw new Error(`Favorite ${node.id} was CREATED, but tags could not be saved. Edit that Favorite; do not repeat Add. ${String(error)}`, { cause: error }); }
    } else if (command.type === 'edit') {
      const f = this.favorite(s, command.id, command.expected);
      const input = this.validate(command.input);
      this.folder(s, input.parentId);
      this.preflightTags(s, f, input.tags);
      const progress: EditProgress = { title: false, url: false, location: false, tags: 'not-confirmed' };
      try {
        if (f.title !== input.title || f.url !== input.url) { await this.bookmarks.update(f.id, { title: input.title, url: input.url }); progress.title = f.title !== input.title; progress.url = f.url !== input.url; }
        if (f.parentId !== input.parentId) { await this.bookmarks.move(f.id, input.parentId); progress.location = true; }
        const fresh = flattenTree(await this.bookmarks.getTree()).favorites.find(n => n.id === f.id);
        if (!fresh) throw new Error('Favorite disappeared during edit.');
        await this.setTags(fresh, input.tags);
      } catch (error) { throw new EditFailure(`Edit may be partially applied to Edge Favorites. ${String(error)}`, progress); }
    }
    return this.snapshot(`after ${command.type}`);
  }
}
