import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { layoutTask } from '../src/ui/layout-task';

let frames: Map<number, FrameRequestCallback>, next: number;
const tasks: ReturnType<typeof layoutTask>[] = [];
function task(measure: () => void, order = 0) { const value = layoutTask(measure, order); tasks.push(value); return value; }
function tick() { const batch = [...frames.values()]; frames.clear(); for (const frame of batch) frame(0); }
beforeEach(() => {
  frames = new Map(); next = 0;
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => { frames.set(++next, fn); return next; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
});
afterEach(() => { tasks.splice(0).forEach(value => value.dispose()); vi.unstubAllGlobals(); });

describe('coalesced layout invalidations', () => {
  it('batches repeated notifications and reads fresh geometry before dependent work', () => {
    const calls: number[] = []; let geometry = 1;
    const footer = task(() => calls.push(geometry), 1), cover = task(() => { geometry = 20; });
    footer.schedule(); cover.schedule(); footer.schedule(); cover.schedule();
    expect(frames.size).toBe(1); expect(calls).toEqual([]);
    tick(); expect(calls).toEqual([20]); expect(frames.size).toBe(0);
    tick(); expect(calls).toEqual([20]); // no polling or self-sustaining loop
  });
  it('cancels obsolete work on cleanup without cancelling another live task', () => {
    const calls: string[] = [];
    const old = task(() => calls.push('old')), live = task(() => calls.push('live'));
    old.schedule(); live.schedule(); old.dispose(); old.schedule(); tick();
    expect(calls).toEqual(['live']); expect(frames.size).toBe(0);
  });
  it('cancels the browser callback when the last queued task is disposed', () => {
    const measure = vi.fn(), value = task(measure); value.schedule(); value.dispose();
    expect(frames.size).toBe(0); tick(); expect(measure).not.toHaveBeenCalled();
  });
  it('skips a disposed task even if it was already in the frame batch', () => {
    const measure = vi.fn(), later = task(measure, 1);
    task(() => later.dispose()).schedule(); later.schedule(); tick();
    expect(measure).not.toHaveBeenCalled(); expect(frames.size).toBe(0);
  });
});
