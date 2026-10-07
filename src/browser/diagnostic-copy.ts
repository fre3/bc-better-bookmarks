/** Explicit user-gesture copy only. Reports may contain private bookmark data. */
export async function copyDiagnosticReport(value: unknown): Promise<void> {
  await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
}
