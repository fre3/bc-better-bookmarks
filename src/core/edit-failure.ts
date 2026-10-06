export interface EditProgress { title: boolean; url: boolean; location: boolean; tags: 'not-confirmed' }
export class EditFailure extends Error {
  constructor(message: string, readonly progress: EditProgress) { super(message); }
}
export interface SaveFailure { error: string; progress?: EditProgress }

/** Browser errors can cross more than one Error/message boundary. */
export function errorText(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).replace(/^(?:Error:\s*)+/u, '');
}
