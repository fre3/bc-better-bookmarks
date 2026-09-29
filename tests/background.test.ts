import { afterEach, describe, expect, it, vi } from 'vitest';
import { JOURNAL_KEY, QUOTAS } from '../src/browser/metadata';
import type { LogEntry } from '../src/core/model';
import { idA, mapping, record, tree } from './fixtures';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); vi.resetModules(); });

describe('real worker wiring with mocked chrome APIs', () => {
  it.each(['added', 'updated', 'removed'] as const)('consumes the %s payload at receipt time and does not write sync', async operation => {
    vi.resetModules(); vi.useFakeTimers({ toFake: ['Date'] });
    const receivedAt = '2026-09-28T08:59:00.784Z'; vi.setSystemTime(new Date(receivedAt));
    const listeners = new Map<string, (...args: unknown[]) => unknown>();
    const event = (name: string) => ({ addListener: vi.fn((listener: (...args: unknown[]) => unknown) => listeners.set(name, listener)) });
    const before = record(), after = { ...record(), tags: ['sensitive-user-tag'] };
    const syncData: Record<string, unknown> = operation === 'removed' ? {} : { [`meta:${idA}`]: after };
    const localData: Record<string, unknown> = {
      state: { schemaVersion: 1, mappings: mapping(), rootId: '1', pendingDeletions: [] },
      [JOURNAL_KEY]: { schemaVersion: 1, entries: { [idA]: { metadata: before, locallyWrittenAt: receivedAt } } },
    };
    const area = (data: Record<string, unknown>) => ({
      get: vi.fn(async (key?: string | null) => structuredClone(typeof key === 'string' ? { [key]: data[key] } : data)),
      set: vi.fn(async (items: Record<string, unknown>) => { Object.assign(data, structuredClone(items)); }),
      getBytesInUse: vi.fn(async () => JSON.stringify(data).length),
    });
    const sync = { ...area(syncData), QUOTA_BYTES: QUOTAS.bytes, QUOTA_BYTES_PER_ITEM: QUOTAS.perItem, MAX_ITEMS: QUOTAS.items, MAX_WRITE_OPERATIONS_PER_MINUTE: QUOTAS.writesPerMinute, MAX_WRITE_OPERATIONS_PER_HOUR: QUOTAS.writesPerHour };
    const notify = vi.fn(async () => undefined);
    vi.stubGlobal('chrome', {
      bookmarks: { getTree: vi.fn(async () => tree()), ...Object.fromEntries(['onCreated', 'onChanged', 'onMoved', 'onChildrenReordered', 'onImportBegan', 'onImportEnded', 'onRemoved'].map(name => [name, event(`bookmarks.${name}`)])) },
      storage: { sync, local: area(localData), onChanged: event('storage') },
      runtime: { id: 'test', getManifest: () => ({ version: 'test' }), sendMessage: notify, onMessage: event('message'), onStartup: event('startup'), onInstalled: event('installed') },
    });
    await import('../src/background');
    const listener = listeners.get('storage')!;
    listener({ state: { newValue: localData.state } }, 'local');
    expect(notify).not.toHaveBeenCalled();
    listener({ [`meta:${idA}`]: { oldValue: operation === 'added' ? undefined : before, newValue: operation === 'removed' ? undefined : after } }, 'sync');
    vi.setSystemTime(new Date('2026-09-28T09:00:00Z'));
    await vi.waitFor(() => expect(notify).toHaveBeenCalled());
    const logs = localData.logs as LogEntry[];
    const change = logs.find(log => log.message.includes(`operation=${operation}`));
    expect(change?.time).toBe(receivedAt); expect(change?.message).toContain(`meta:${idA}`);
    expect(change?.message).not.toMatch(/sensitive-user-tag|azure.com|Dashboard/);
    expect(logs.some(log => log.message.startsWith('storage.sync.changed'))).toBe(true);
    expect(sync.set).not.toHaveBeenCalled();
    if (operation === 'removed') expect(syncData).toEqual({});
  });
});
