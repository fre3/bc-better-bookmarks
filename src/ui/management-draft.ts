import { normalizeTags } from '../core/logic';
import type { LinkInput } from '../core/model';

/** Comparison only; never rewrite the input or the worker's stale-edit token. */
export function managementDraftState(input: LinkInput): string {
  // Native titles/URLs (especially opaque bookmarklets) stay exact. Tag order,
  // case, whitespace and duplicate assignments have no persistence meaning.
  return JSON.stringify([input.title, input.url, input.parentId, normalizeTags(input.tags)]);
}
