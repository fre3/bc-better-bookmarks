import { normalizeTags, validateUrl } from './logic';
import type { LinkInput } from './model';

export type LinkErrors = Partial<Record<'title' | 'url' | 'tags', string>>;
/** Shared field rules; the worker remains authoritative for all mutations. */
export function linkInputErrors(input: LinkInput): LinkErrors {
  const errors: LinkErrors = {};
  if (!input.title.trim()) errors.title = 'A title is required.';
  const tags = normalizeTags(input.tags);
  if (tags.length > 30 || tags.some(t => t.length > 80)) errors.tags = 'Use at most 30 tags of 80 characters each.';
  try { validateUrl(input.url, input.bookmarkletConfirmed === true); }
  catch (error) { errors.url = error instanceof Error ? error.message : String(error); }
  return errors;
}
export function validateLinkInput(input: LinkInput): LinkInput {
  const errors = linkInputErrors(input);
  const error = errors.title || errors.tags || errors.url;
  if (error) throw new Error(error);
  return { ...input, title: input.title.trim(), url: validateUrl(input.url, input.bookmarkletConfirmed === true), tags: normalizeTags(input.tags) };
}
