import { alignMetadataEpoch, setupEpoch, SETUP_KEY } from './metadata-setup';
import type { CreationReceipt, LocalState, LogEntry, MetadataJournal, MetadataState } from '../core/model';
import { parseJournal, parseMetadata } from '../core/schema';
export interface StorageArea {
  remove?(keys: string | string[]): Promise<void>;
  get(keys?: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  getBytesInUse(keys?: string | string[] | null): Promise<number>;
}
export interface MetadataRepository {
  readCreation(id: string): Promise<CreationReceipt | undefined>;
  saveCreation(id: string, receipt: CreationReceipt): Promise<void>;
  read(): Promise<MetadataState>;
  write(changes: Record<string, unknown>, authoredLocalState?: LocalState): Promise<void>;
  readLocal(): Promise<LocalState>;
  saveLocal(local: LocalState): Promise<void>;
  bytes(): Promise<number>;
  readLogs(): Promise<LogEntry[]>;
  saveLogs(logs: LogEntry[]): Promise<void>;
  readJournal(): Promise<MetadataJournal>;
}
export const JOURNAL_KEY = 'metadataJournal';
export const JOURNAL_LIMITS = { entries: 512, bytes: 1024 * 1024 };
export const QUOTAS = { bytes: 102400, perItem: 8192, items: 512, writesPerMinute: 120, writesPerHour: 1800 };
export function checkQuota(raw: Record<string, unknown>, patch: Record<string, unknown>, quotas = QUOTAS) {
  const next = { ...raw, ...patch };
  if (Object.keys(next).length > quotas.items) throw new Error('storage.sync item quota exceeded. No metadata was written.');
  let total = 0;
  for (const [key, value] of Object.entries(next)) {
    const bytes = new TextEncoder().encode(key + JSON.stringify(value)).length;
    if (bytes > quotas.perItem) throw new Error(`storage.sync item too large: ${key}. No metadata was written.`);
    total += bytes;
  }
  if (total > quotas.bytes) throw new Error('storage.sync total byte quota exceeded. No metadata was written.');
}
export class BrowserMetadataRepository implements MetadataRepository {
  constructor(private readonly sync: StorageArea = chrome.storage.sync, private readonly local: StorageArea = chrome.storage.local,
    private readonly journalLimits = JOURNAL_LIMITS, private readonly now: () => string = () => new Date().toISOString()) {}
  async readCreation(id: string): Promise<CreationReceipt | undefined> {
    const raw=(await this.local.get(`creation:${id}`))[`creation:${id}`];
    if(raw===undefined)return undefined;
    if(!raw || typeof raw!=='object')throw new Error('Invalid creation receipt; this request is blocked, never repeated.');
    const r=raw as CreationReceipt;
    if(typeof r.request!=='string' || typeof r.stableId!=='string' || !/^[0-9a-f-]{36}$/i.test(r.stableId) || r.generation!==undefined&&typeof r.generation!=='string' || r.id!==undefined&&typeof r.id!=='string' || r.native!==undefined&&typeof r.native!=='string' || r.complete!==undefined&&typeof r.complete!=='boolean' || r.complete&&(!r.id||!r.native) || r.record&&parseMetadata({[`meta:${r.stableId}`]:r.record}).invalid.length)throw new Error('Invalid creation receipt; inspect local diagnostics before retrying.');
    return r;
  }
  async saveCreation(id: string, receipt: CreationReceipt) { await this.local.set({ [`creation:${id}`]: receipt }); }
  async read() { return parseMetadata(await this.sync.get(null)); }
  async write(changes: Record<string, unknown>, authoredLocalState?: LocalState) {
    const raw = await this.sync.get(null);
    const patch = Object.fromEntries(Object.entries(changes).filter(([key, value]) => JSON.stringify(raw[key]) !== JSON.stringify(value)));
    if (!Object.keys(patch).length) return;
    const epoch = setupEpoch(raw[SETUP_KEY]);
    if (epoch && (epoch.phase !== 'ready' || Object.entries(patch).some(([key, value]) => /^(meta|loc|dead):/.test(key) && (!value || typeof value !== 'object' || !('generation' in value) || value.generation !== epoch.generation)))) throw new Error('Metadata generation changed before publication. Reopen the editor; old metadata was not written.');
    const invalid = parseMetadata(raw).invalid;
    if (Object.keys(patch).some(key => invalid.some(issue => issue.startsWith(`${key}: `)))) throw new Error('Refusing to overwrite an invalid or future-schema sync record.');
    checkQuota(raw, patch);
    const authored = Object.fromEntries(Object.entries(patch).filter(([key]) => key.startsWith('meta:')));
    if (Object.keys(authored).length) {
      const parsed = parseMetadata(authored);
      if (parsed.invalid.length) throw new Error('Refusing to publish invalid metadata.');
      const journal = await this.readJournal();
      for (const record of parsed.records) journal.entries[record.stableId] = { metadata: record, locallyWrittenAt: this.now() };
      if (Object.keys(journal.entries).length > this.journalLimits.entries || new TextEncoder().encode(JOURNAL_KEY + JSON.stringify(journal)).length > this.journalLimits.bytes) {
        throw new Error('Local metadata preservation capacity reached. No records were evicted and metadata was not published.');
      }
      // Keep explicit identity evidence with the intent even if sync publication fails.
      try { await this.local.set({ [JOURNAL_KEY]: journal, ...(authoredLocalState ? { state: authoredLocalState } : {}) }); }
      catch { throw new Error('Local metadata preservation failed. Metadata was not published; inspect local storage capacity.'); }
    }
    await this.sync.set(patch); // Browser enforces actual quotas/rate limits; rejection is shown to the user.
  }
  async readJournal() { return parseJournal((await this.local.get(JOURNAL_KEY))[JOURNAL_KEY]); }
  async readLocal() { return alignMetadataEpoch(this.sync, this.local); }
  async saveLocal(state: LocalState) {
    const current = (await this.local.get('state')).state;
    if (JSON.stringify(current) !== JSON.stringify(state)) await this.local.set({ state });
  }
  async bytes() { return this.sync.getBytesInUse(null); }
  async readLogs() { return ((await this.local.get('logs')).logs ?? []) as LogEntry[]; }
  async saveLogs(logs: LogEntry[]) { await this.local.set({ logs: logs.slice(-60) }); }
}
