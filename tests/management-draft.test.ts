import { describe, expect, it } from 'vitest';
import { managementDraftState } from '../src/ui/management-draft';
import { editorTags, splitArchiveTag } from '../src/ui/editor-tags';
import type { LinkInput } from '../src/core/model';

const input: LinkInput = { title: 'Original', url: 'https://example.test/a?q=1#part', parentId: 'parent', tags: ['Work', 'archived'] };
describe('Manage initial draft comparison', () => {
  it('is clean initially and after reverting every editable field', () => {
    const initial = managementDraftState(input);
    for (const change of [{ title: 'Changed' }, { url: 'https://example.test/b' }, { parentId: 'other' }, { tags: ['work'] }]) {
      expect(managementDraftState({ ...input, ...change })).not.toBe(initial);
      expect(managementDraftState({ ...input })).toBe(initial);
    }
  });
  it('compares normalized tag assignments including archived without mutating input', () => {
    const before = structuredClone(input);
    expect(managementDraftState({ ...input, tags: [' ARCHIVED ', 'work', '', 'WORK'] })).toBe(managementDraftState(input));
    const { tags, archived } = splitArchiveTag(input.tags);
    expect(managementDraftState({ ...input, tags: editorTags(tags, archived) })).toBe(managementDraftState(input));
    expect(input).toEqual(before);
  });
  it('retains exact native values and opaque code, without URL canonicalization', () => {
    const opaque = { ...input, title: ' Original ', url: 'javascript:alert(1)\n// code' };
    const initial = managementDraftState(opaque);
    expect(managementDraftState(structuredClone(opaque))).toBe(initial);
    expect(managementDraftState({ ...opaque, url: opaque.url.replace('\n', '') })).not.toBe(initial);
    expect(managementDraftState({ ...input, url: 'https://example.test/a?q=2#part' })).not.toBe(managementDraftState(input));
  });
  it('keeps the opening baseline independent of refreshed native values', () => {
    const initial = managementDraftState(input);
    const refreshed = { ...input, title: 'External update' };
    expect(managementDraftState(refreshed)).not.toBe(initial);
    expect(managementDraftState(input)).toBe(initial);
  });
});
