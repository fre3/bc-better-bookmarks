export interface CoveredSheet {
  top: number;
  bottom: number;
  headerBottom: number;
  shadowTop: number;
  open: boolean;
}

/** Extend over partial collapsed headers, but never across an open catalogue
 * merely to find its next boundary. All coordinates are viewport-relative. */
export function peekCoverBottom(top: number, headerHeight: number, sheets: readonly CoveredSheet[]): number {
  const minimumBottom = top + headerHeight;
  let bottom = minimumBottom;
  for (const sheet of sheets) {
    if (sheet.top >= minimumBottom) return Math.max(top, sheet.shadowTop);
    if (sheet.open && sheet.bottom > minimumBottom) {
      // Finish the copied header. If it ends inside the real open header,
      // cover that header too; otherwise reveal the open content immediately.
      return Math.max(minimumBottom, sheet.headerBottom);
    }
    bottom = Math.max(bottom, sheet.headerBottom);
  }
  return bottom;
}
