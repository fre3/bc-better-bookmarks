export interface EditProgress { title: boolean; url: boolean; location: boolean; tags: 'not-confirmed' }
export class EditFailure extends Error {
  constructor(message: string, readonly progress: EditProgress) { super(message); }
}
export interface SaveFailure { error: string; progress?: EditProgress }
