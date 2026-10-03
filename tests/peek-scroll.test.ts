import { afterEach, describe, expect, it, vi } from 'vitest';
import { startPeekScroll } from '../src/ui/peek-scroll';
import { AUTO_SCROLL_PEEK_KEY, peekPreference, readPeekPreference, savePeekPreference, setPeekPreference, onPeekPreference } from '../src/browser/ui-preferences';

function fixture(maximum = 300) {
  const frames = new Map<number, (time: number) => void>(), delays = new Map<number, () => void>();
  let token = 0, lineHeight = 55, offset = 0;
  const paint = vi.fn((value: number) => { offset = value; });
  const scroll = startPeekScroll({
    measure: () => ({ maximum, lineHeight }), paint,
    delay: (callback, ms) => { expect(ms).toBe(1500); delays.set(++token, callback); return token; },
    clearDelay: id => { delays.delete(id); },
    frame: callback => { frames.set(++token, callback); return token; }, cancelFrame: id => { frames.delete(id); },
  });
  return { scroll, paint, frames, delays, offset: () => offset,
    start() { for (const [id, callback] of delays) { delays.delete(id); callback(); } },
    frame(time: number) { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(time)); },
    resize(max: number, line = lineHeight) { maximum = max; lineHeight = line; scroll.resize(); },
  };
}

describe('delayed preview content animation', () => {
  it('waits, moves one measured line per 2.75 seconds, and stops at the end', () => {
    const f = fixture(110);
    expect(f.frames.size).toBe(0); expect(f.offset()).toBe(0);
    f.start(); f.frame(1500); f.frame(4250); expect(f.offset()).toBe(55);
    f.frame(7000); expect(f.offset()).toBe(110); expect(f.frames.size).toBe(0);
  });
  it('does no frame work for short content, and responds to size changes without a time jump', () => {
    const f = fixture(-20); f.start(); expect(f.frames.size).toBe(0);
    f.resize(50); f.frame(9000); expect(f.offset()).toBe(0);
    f.frame(11750); expect(f.offset()).toBe(50); expect(f.frames.size).toBe(0);
    f.resize(200, 66); f.frame(20000); expect(f.offset()).toBe(50);
    f.frame(22750); expect(f.offset()).toBe(116);
    f.resize(20); expect(f.offset()).toBe(20); f.frame(23000); expect(f.frames.size).toBe(0);
  });
  it('cancels both pending and active work, resets, and ignores even a stale callback/resize', () => {
    const pending = fixture(), lateDelay = [...pending.delays.values()][0];
    pending.scroll.cancel(); lateDelay(); expect(pending.frames.size).toBe(0);
    const active = fixture(); active.start(); active.frame(1500); active.frame(2000);
    const lateFrame = [...active.frames.values()][0]; expect(active.offset()).toBeGreaterThan(0);
    active.scroll.cancel(); lateFrame(50000); active.resize(500);
    expect(active.offset()).toBe(0); expect(active.frames.size).toBe(0); expect(active.delays.size).toBe(0);
    const fresh = fixture(); expect(fresh.frames.size).toBe(0); expect(fresh.delays.size).toBe(1);
  });
});
afterEach(() => vi.unstubAllGlobals());
describe('device-local preview preference', () => {
  it('defaults on only when unspecified and preserves an explicit opt-out', async () => {
    expect(peekPreference(undefined)).toBe(true); expect(peekPreference(false)).toBe(false);
    const local = { get: vi.fn(async () => ({ [AUTO_SCROLL_PEEK_KEY]: false })), set: vi.fn(async () => undefined) };
    vi.stubGlobal('chrome', { storage: { local } });
    expect(await readPeekPreference()).toBe(false);
    await savePeekPreference(true);
    expect(local.set).toHaveBeenCalledExactlyOnceWith({ [AUTO_SCROLL_PEEK_KEY]: true });
  });
  it('sends a typed worker request and surfaces failed saves', async () => {
    const sendMessage = vi.fn().mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({ ok: false, error: 'full' });
    vi.stubGlobal('chrome', { runtime: { sendMessage } });
    await setPeekPreference(false);
    expect(sendMessage).toHaveBeenCalledWith({ event: 'set-peek-preference', enabled: false });
    await expect(setPeekPreference(true)).rejects.toThrow('full');
  });
  it('observes only its own local key, including removal, and unsubscribes', () => {
    const addListener = vi.fn(), removeListener = vi.fn(), changed = vi.fn();
    vi.stubGlobal('chrome', { storage: { onChanged: { addListener, removeListener } } });
    const remove = onPeekPreference(changed), listener = addListener.mock.calls[0][0];
    listener({ [AUTO_SCROLL_PEEK_KEY]: { newValue: false } }, 'sync');
    listener({ state: { newValue: {} } }, 'local'); expect(changed).not.toHaveBeenCalled();
    listener({ [AUTO_SCROLL_PEEK_KEY]: { newValue: false } }, 'local'); expect(changed).toHaveBeenLastCalledWith(false);
    listener({ [AUTO_SCROLL_PEEK_KEY]: {} }, 'local'); expect(changed).toHaveBeenLastCalledWith(true);
    remove(); expect(removeListener).toHaveBeenCalledWith(listener);
  });
});
