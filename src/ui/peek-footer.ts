/** Measured from the unchanged stack bottom, never from the moving footer.
 * Natural flex space absorbs this minimum before the document needs to grow. */
export function peekFooterSpace(stackBottom: number, overlayBottoms: readonly number[]) {
  return Math.max(0, ...overlayBottoms.map(bottom => bottom - stackBottom));
}
