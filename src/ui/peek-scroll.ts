/** One cancellable animation per mouse-hover session. Geometry and clock are
 * injected so delay/end/cancellation can be verified without a browser. */
export interface PeekScrollHost {
  measure(): { maximum: number; lineHeight: number };
  paint(offset: number): void;
  delay(callback: () => void, milliseconds: number): number;
  clearDelay(id: number): void;
  frame(callback: (time: number) => void): number;
  cancelFrame(id: number): void;
}
export function startPeekScroll(host: PeekScrollHost) {
  let offset = 0, maximum = 0, speed = 0, started = false, cancelled = false;
  let frame: number | undefined, previous: number | undefined;
  function schedule() { if (frame === undefined && started && !cancelled && offset < maximum && speed > 0) frame = host.frame(tick); }
  function tick(time: number) {
    frame = undefined;
    if (cancelled) return;
    if (previous !== undefined) offset = Math.min(maximum, offset + Math.max(0, time - previous) * speed);
    previous = time;
    host.paint(offset);
    schedule();
  }
  function resize() {
    if (cancelled) return;
    const measured = host.measure();
    maximum = Math.max(0, measured.maximum); speed = measured.lineHeight / 2750;
    offset = Math.min(offset, maximum);
    host.paint(offset);
    if (frame === undefined) previous = undefined; // no elapsed time accumulated while stopped
    schedule();
  }
  resize();
  const delay = host.delay(() => { if (!cancelled) { started = true; resize(); } }, 1000);
  return {
    resize,
    cancel() {
      cancelled = true; host.clearDelay(delay);
      if (frame !== undefined) host.cancelFrame(frame);
      frame = undefined; offset = 0; host.paint(0);
    },
  };
}
