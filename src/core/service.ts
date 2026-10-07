import type { BookmarksRepository } from '../browser/bookmarks';
import { QUOTAS, type MetadataRepository } from '../browser/metadata';
import { editToken, flattenTree, normalizeTags } from './logic';
import type { Command, Favorite, LinkInput, LogEntry, Snapshot } from './model';
import { folderNode, folderEditToken } from './node-tags';
import { EditFailure, type EditProgress } from './edit-failure';
import { reconcile } from './reconcile';
import { validateLinkInput } from './link-input';
import { deletionNodes, deletionToken, destinationToken, nativeToken, nodeById, sourceToken, placementToken, planMove } from './operations';
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
  private folder(snapshot: Snapshot, id: string) {
    const f = snapshot.folders.find(f => f.id === id);
    if (!f?.writable) throw new Error('Choose a writable, unmanaged folder.');
    return f;
  }
  private favorite(snapshot: Snapshot, id: string, expected: string) {
    const f = snapshot.favorites.find(f => f.id === id);
    if (!f || f.unmodifiable) throw new Error('Favorite is missing or managed.');
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
  private async createItem(s: Snapshot, command: Extract<Command, {type:'create'|'create-folder'}>): Promise<Snapshot> {
    const isFolder=command.type==='create-folder';
    const input=isFolder?this.validate({title:command.title,url:'https://folder.invalid/',parentId:command.parentId,tags:command.tags??[]}):this.validate(command.input);
    const parent=this.folder(s,input.parentId);
    const requestId=command.requestId??crypto.randomUUID();
    if(!/^[\w-]{8,80}$/.test(requestId))throw Error('Invalid creation request.');
    const request=JSON.stringify([isFolder,input.title,input.url,input.parentId,input.tags]);
    let receipt=await this.metadata.readCreation(requestId);
    if(receipt && (receipt.request!==request || receipt.generation!==s.metadata.setup?.generation))throw Error('This creation request has different input or belongs to an older metadata setup. No item was added.');
    if(receipt?.complete) return {...s,mutation:{id:receipt.id!,parentId:input.parentId}};
    if(!receipt && command.destinationExpected!==undefined && destinationToken(s,parent.id)!==command.destinationExpected)throw Error('Destination changed. Review and select it again before creating.');
    if(s.metadata.invalid.length || !s.preservation.available)throw Error('Metadata integrity prevents creation. Review Manage diagnostics.');
    if(!receipt){
      const freshTree=await this.bookmarks.getTree();const fresh={...s,tree:freshTree,...flattenTree(freshTree)};
      if(destinationToken(fresh,parent.id)!==destinationToken(s,parent.id))throw Error('Destination changed before creation. Nothing was created.');
      receipt={request,generation:s.metadata.setup?.generation,stableId:this.uuid()};
      await this.metadata.saveCreation(requestId,receipt); // durable intent before native creation
      try {
        const node=await this.bookmarks.create({parentId:parent.id,title:input.title,...(isFolder?{}:{url:input.url})});
        receipt.id=node.id;receipt.native=nativeToken(node);
        await this.metadata.saveCreation(requestId,receipt);
      } catch(error){throw Error(`Creation may have reached Edge. Retry only this request; do not start another creation request. ${String(error)}`, {cause:error});}
    }
    if(!receipt.id)throw Error('Creation outcome is uncertain. No second item will be created. Inspect Edge Favorites before starting a new creation request.');
    try {
      const current=await this.snapshot('complete creation');
      const n=nodeById(current,receipt.id);
      if(!n || nativeToken(n)!==receipt.native)throw Error('Created item changed or disappeared. Review that item in Edge; it will not be recreated or overwritten.');
      if(input.tags.length){
        const f=n.url===undefined?folderNode(n as Snapshot['folders'][number],current.folders):n as Favorite;
        receipt.record??={schemaVersion:2,stableId:receipt.stableId,...(receipt.generation?{generation:receipt.generation}:{}),initialLocator:f.locator,tags:input.tags,updatedAt:this.now()};
        await this.metadata.saveCreation(requestId,receipt);
        const existing=current.metadata.records.find(r=>r.stableId===receipt!.stableId);
        if(current.metadata.tombstones[receipt.stableId] || existing && JSON.stringify(existing)!==JSON.stringify(receipt.record))throw Error('Created metadata changed externally. Review the item instead of overwriting it.');
        const local=await this.metadata.readLocal();
        const assigned=local.mappings[n.id];
        if(assigned && assigned.stableId!==receipt.stableId)throw Error('Created item has a conflicting identity. Review diagnostics.');
        local.mappings[n.id]={stableId:receipt.stableId,lastLocator:f.locator,dateAdded:n.dateAdded,method:'explicit'};
        await this.metadata.write({[`meta:${receipt.stableId}`]:receipt.record},local);
        await this.metadata.saveLocal(local);
      }
      receipt.complete=true;await this.metadata.saveCreation(requestId,receipt);
      return {...await this.snapshot('created item'),mutation:{id:receipt.id,parentId:input.parentId}};
    } catch(error){throw Error(`Item ${receipt.id} was CREATED in ${parent.path.join(' / ')}. Metadata completion is not confirmed. Retry completion for this item; it will not create another. ${String(error)}`, {cause:error});}
  }
  async command(command: Command): Promise<Snapshot> {
    if (command.type === 'snapshot' || command.type === 'reconcile') return this.snapshot(command.type);
    const s = await this.snapshot(`before ${command.type}`);
    if (['create', 'create-folder', 'move', 'delete', 'edit', 'edit-folder', 'attach-folder'].includes(command.type) && command.generation !== s.metadata.setup?.generation) throw new Error('Metadata was reset since this draft opened. Copy needed input, cancel and reopen.');
    if (command.type === 'create-folder' || command.type === 'create') {
      return this.createItem(s, command);
    } else if (command.type === 'move') {
      if(sourceToken(s,command.id)!==command.expected || placementToken(s,command.placement)!==command.destinationExpected)throw Error('Source, destination or sibling order changed. Review the move again.');
      const target=planMove(s,command.id,command.placement);
      const moving=nodeById(s,command.id)!;
      const nodes=[...s.favorites,...s.folders.filter(f=>f.renamable).map(f=>folderNode(f,s.folders))].filter(n=>n.id===moving.id || n.ancestorIds.includes(moving.id) || n.id===target.parentId || s.folders.find(f=>f.id===target.parentId)?.ancestorIds.includes(n.id));
      for(const n of nodes){this.preflightTags(s,n,this.tags(s,n.id));if(!s.reconciliation.mappings[n.id] && s.reconciliation.matches.some(m=>m.candidateIds.includes(n.id)))throw Error('Folder or favorite metadata needs binding review before moving.');}
      const freshTree=await this.bookmarks.getTree();
      const fresh={...s,tree:freshTree,...flattenTree(freshTree)};
      if(sourceToken(fresh,command.id)!==command.expected || placementToken(fresh,command.placement)!==command.destinationExpected)throw Error('Native source or destination changed before the move. Nothing was moved.');
      planMove(fresh,command.id,command.placement);
      await this.bookmarks.move(command.id,target.parentId,target.index);
      try { return {...await this.snapshot('after move'),mutation:{id:command.id,parentId:target.parentId}}; } catch(error) {throw Error(`Item ${command.id} was MOVED, but refreshing metadata did not complete. Inspect its current location before retrying. ${String(error)}`,{cause:error});}
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
      if(command.subtreeExpected!==undefined && (command.generation!==s.metadata.setup?.generation || command.expected!==sourceToken(s,command.id) || command.subtreeExpected!==deletionToken(s,command.id)))throw Error('Deletion target or subtree changed. Review the refreshed summary and confirm again.');
      if(command.subtreeExpected===undefined)this.favorite(s,command.id,command.expected); // Manage's existing single-Favorite confirmation.
      const nodes=deletionNodes(s,command.id);
      if(!nodes.length)throw Error('The deletion target no longer exists.');
      for(const n of nodes){
        if(n.unmodifiable || n.url===undefined && !(n as Snapshot['folders'][number]).renamable)throw Error('Browser-owned or managed items cannot be deleted.');
        const f=n.url===undefined?folderNode(n as Snapshot['folders'][number],s.folders):n as Favorite;
        this.preflightTags(s,f,this.tags(s,n.id));
        if(!s.reconciliation.mappings[n.id]&&s.reconciliation.matches.some(m=>m.candidateIds.includes(n.id)))throw Error('Metadata needs binding review before deletion.');
      }
      if(!s.preservation.available)throw Error('Metadata journal unavailable; deletion is blocked.');
      const removed:string[]=[];
      try {
        for(const n of [...nodes].sort((a,b)=>b.ancestorIds.length-a.ancestorIds.length)){
          const fresh=await this.snapshot('before individual deletion');
          if(fresh.metadata.invalid.length||!fresh.preservation.available)throw Error('Metadata integrity changed; deletion stopped.');
          const current=nodeById(fresh,n.id);
          if(current)this.preflightTags(fresh,current.url===undefined?folderNode(current as Snapshot['folders'][number],fresh.folders):current as Favorite,this.tags(fresh,n.id));
          if(deletionToken(fresh,command.id)!==deletionToken(s,command.id,removed))throw Error('Remaining subtree changed; review before deleting anything further.');
          // Single-node remove rejects nonempty folders, including a child added
          // in the final native-call race. Never recursively remove unknown data.
          if(n.url===undefined)await this.bookmarks.removeEmptyFolder(n.id);else await this.bookmarks.removeLink(n.id);
          removed.push(n.id);
          const result=await this.removed([n.id]);
          const stable=s.local.mappings[n.id]?.stableId;
          if(stable&&result.local.pendingDeletions.includes(stable))throw Error('Metadata cleanup is pending. Use Reconcile; do not repeat deletion.');
        }
        return {...await this.snapshot('after confirmed deletion'),mutation:{id:command.id,parentId:nodes.find(n=>n.id===command.id)!.parentId!}};
      }catch(error){throw Error(`${removed.length} native item(s) DELETED. Deletion/metadata cleanup did not fully complete. Inspect the remaining items and reconcile; deleted items will not be recreated. ${String(error)}`,{cause:error});}
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
