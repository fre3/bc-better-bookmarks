import type { LocalState, LogEntry, MetadataState } from '../core/model';
import { parseLocal, parseMetadata } from '../core/schema';
export interface StorageArea {
  get(keys?: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  getBytesInUse(keys?: string | string[] | null): Promise<number>;
}
export interface MetadataRepository {
  read(): Promise<MetadataState>;
  write(changes: Record<string, unknown>): Promise<void>;
  readLocal(): Promise<LocalState>;
  saveLocal(local: LocalState): Promise<void>;
  bytes(): Promise<number>;
  readLogs(): Promise<LogEntry[]>;
  saveLogs(logs: LogEntry[]): Promise<void>;
}
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
  constructor(private readonly sync: StorageArea = chrome.storage.sync, private readonly local: StorageArea = chrome.storage.local) {}
  async read() { return parseMetadata(await this.sync.get(null)); }
  async write(changes: Record<string, unknown>) {
    const raw = await this.sync.get(null);
    const patch = Object.fromEntries(Object.entries(changes).filter(([key, value]) => JSON.stringify(raw[key]) !== JSON.stringify(value)));
    if (!Object.keys(patch).length) return;
    const invalid = parseMetadata(raw).invalid;
    if (Object.keys(patch).some(key => invalid.some(issue => issue.startsWith(`${key}: `)))) throw new Error('Refusing to overwrite an invalid or future-schema sync record.');
    checkQuota(raw, patch);
    await this.sync.set(patch); // Browser enforces actual quotas/rate limits; rejection is shown to the user.
  }
  async readLocal() { return parseLocal((await this.local.get('state')).state); }
  async saveLocal(state: LocalState) {
    const current = (await this.local.get('state')).state;
    if (JSON.stringify(current) !== JSON.stringify(state)) await this.local.set({ state });
  }
  async bytes() { return this.sync.getBytesInUse(null); }
  async readLogs() { return ((await this.local.get('logs')).logs ?? []) as LogEntry[]; }
  async saveLogs(logs: LogEntry[]) { await this.local.set({ logs: logs.slice(-60) }); }
}
