/** Measured from the unchanged stack bottom, never from the moving footer.
 * Natural flex space absorbs this minimum before the document needs to grow. */
export function peekFooterSpace(stackBottom: number, overlayBottoms: readonly number[]) {
  return Math.max(0, ...overlayBottoms.map(bottom => bottom - stackBottom));
}

/** Do not clamp a wheel-selected viewport when a preview contracts. Retain
 * only the part of an existing reservation still supporting that viewport.
 * Upward scrolling releases it; it can neither accumulate nor create a gap
 * without a previous preview. Round up for fractional layout/scroll pixels. */
export function retainedPeekSpace(required: number, previous: number, scroll: number, viewport: number, naturalBottom: number) {
  const supporting = Math.max(0, Math.ceil(scroll + viewport - naturalBottom));
  return Math.max(required, Math.min(previous, supporting));
}
