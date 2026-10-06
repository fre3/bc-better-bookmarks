import type { LocalState } from '../core/model';
import { object, parseLocal, UUID } from '../core/schema';
import type { StorageArea } from './metadata';
export const SETUP_KEY = 'setup:epoch';
export interface SetupEpoch { generation: string; phase: 'resetting' | 'ready' }
export function setupEpoch(value: unknown): SetupEpoch | undefined {
  if (value === undefined) return;
  if (!object(value) || typeof value.generation !== 'string' || !UUID.test(value.generation) || !['resetting', 'ready'].includes(String(value.phase))) throw new Error('Invalid metadata setup marker; preserved for review.');
  return value as unknown as SetupEpoch;
}
export interface MetadataBackup { exportedAt: string; sync: Record<string, unknown>; local: Record<string, unknown>; affectedSyncKeys: string[]; affectedLocalKeys: string[]; expected: string }
const owned = (raw: Record<string, unknown>) => Object.fromEntries(Object.entries(raw).filter(([key]) => /^(meta|loc|dead):/.test(key) || key === SETUP_KEY));
const token = (raw: Record<string, unknown>) => JSON.stringify(Object.entries(raw).sort(([a], [b]) => a.localeCompare(b)));
export async function prepareMetadataReset(sync: StorageArea, local: StorageArea): Promise<MetadataBackup> {
  const data = owned(await sync.get(null));
  const localData = await local.get(null);
  return { exportedAt: new Date().toISOString(), sync: data, local: { state: localData.state, metadataJournal: localData.metadataJournal }, affectedSyncKeys: Object.keys(data), affectedLocalKeys: ['state.mappings', 'state.pendingDeletions', 'state.metadataEpoch', 'metadataJournal'], expected: token(data) };
}
export async function alignMetadataEpoch(sync: StorageArea, local: StorageArea): Promise<LocalState> {
  const epoch = setupEpoch((await sync.get(SETUP_KEY))[SETUP_KEY]);
  if (epoch?.phase === 'resetting') throw new Error('Metadata reset is in progress. Finish setup; bookmark writes are paused.');
  const state = parseLocal((await local.get('state')).state);
  if (epoch && state.metadataEpoch !== epoch.generation) {
    if (!local.remove) throw new Error('Local metadata cleanup is unavailable.');
    // This is metadata only. Keep mutation scope and every unrelated UI preference.
    await local.remove('metadataJournal');
    const next = { ...state, mappings: {}, pendingDeletions: [], metadataEpoch: epoch.generation };
    await local.set({ state: next }); return next;
  }
  return state;
}
export async function resetMetadata(sync: StorageArea, local: StorageArea, expected: string) {
  const current = owned(await sync.get(null));
  if (token(current) !== expected) throw new Error('Metadata changed after export. Export and review a fresh inventory before resetting.');
  if (!sync.remove || !local.remove) throw new Error('Metadata cleanup is unavailable.');
  const generation = crypto.randomUUID();
  await sync.set({ [SETUP_KEY]: { generation, phase: 'resetting' } });
  await sync.remove(Object.keys(current).filter(key => key !== SETUP_KEY));
  await sync.set({ [SETUP_KEY]: { generation, phase: 'ready' } });
  await alignMetadataEpoch(sync, local);
}
export async function requestMetadataBackup(): Promise<MetadataBackup> {
  const response = await chrome.runtime.sendMessage({ event: 'prepare-metadata-reset' });
  if (!response?.ok) throw new Error(response?.error ?? 'Could not export metadata.');
  return response.backup;
}
export async function requestMetadataReset(expected: string) {
  const response = await chrome.runtime.sendMessage({ event: 'reset-metadata', expected });
  if (!response?.ok) throw new Error(response?.error ?? 'Could not reset metadata.');
}
