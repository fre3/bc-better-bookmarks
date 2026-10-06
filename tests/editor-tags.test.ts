import { describe, expect, it } from 'vitest';
import { splitArchiveTag, editorTags } from '../src/ui/editor-tags';
describe('archive checkbox UI mapping', () => {
 it('separates an existing case-insensitive direct tag without altering other typing', () => {
  expect(splitArchiveTag(['Work ', ' ARCHIVED ', 'archived', 'reference'])).toEqual({ archived: true, tags: ['Work ', 'reference'] });
 });
 it('serializes only direct input and restores existing normalization/deduplication', () => {
  expect(editorTags([' Work ', 'work', 'Archived'], true)).toEqual(['archived', 'work']);
  expect(editorTags(['work'], false)).toEqual(['work']);
  expect(editorTags([], false)).toEqual([]); // inherited status is never input
 });
 it('does not treat a partial or distinct tag as archived', () => {
  expect(splitArchiveTag(['archiv', 'archived-old'])).toEqual({ archived:false,tags:['archiv','archived-old'] });
 });
});
