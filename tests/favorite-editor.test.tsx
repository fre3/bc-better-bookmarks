import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { linkInputErrors, validateLinkInput } from '../src/core/link-input';
import { confirmLinkInput } from '../src/core/logic';
import { favoriteDraft, draftConflict } from '../src/ui/favorite-editor';
import { CatalogueItems } from '../src/ui/CatalogueItems';
import type { Snapshot } from '../src/core/model';
import { favorite, mapping, metadata } from './fixtures';
function snapshot(): Snapshot {
  return { favorites: [favorite()], metadata: metadata(), reconciliation: { mappings: mapping() }, local: { rootId: '*' } } as Snapshot;
}
describe('catalogue editor integration', () => {
  it('keeps normal links but gives editing one non-navigating keyboard target', () => {
    const props = { items: [{ kind: 'bookmark' as const, favorite: favorite(), tags: [], ambiguous: false }], expanded: [], onToggle: () => undefined, query: null };
    const browse = renderToStaticMarkup(<CatalogueItems {...props} />);
    const editing = renderToStaticMarkup(<CatalogueItems {...props} onEdit={() => undefined} selectedId="20" />);
    expect(browse).toContain('href="https://azure.com/"');
    expect(editing).not.toContain('href=');
    expect(editing.match(/tabindex="0"/g)).toHaveLength(1);
    expect(editing).toContain('role="button"'); expect(editing).toContain('aria-haspopup="dialog"'); expect(editing).toContain('is-selected');
  });
  it('captures original identity token and parent, rejecting external title, URL, folder and tag changes', () => {
    for (const mutation of ['title', 'url', 'parent', 'tags', 'removed'] as const) {
      const s = snapshot(); const draft = favoriteDraft(s, s.favorites[0]);
      expect(draftConflict(s, draft)).toBeUndefined();
      if (mutation === 'removed') s.favorites = [];
      else if (mutation === 'tags') s.metadata.records[0].tags = ['remote'];
      else if (mutation === 'parent') s.favorites[0].parentId = '11';
      else s.favorites[0].locator[mutation] = 'remote';
      expect(draftConflict(s, draft)).toMatch(/changed|removed/);
      expect(draft.input.parentId).toBe('10'); expect(draft.input.title).toBe('Azure');
    }
  });
  it('does not let browse scope grant mutation permission or managed writes', () => {
    const s = snapshot(); const draft = favoriteDraft(s, s.favorites[0]);
    s.local.rootId = null; expect(draftConflict(s, draft)).toContain('mutation scope');
    s.local.rootId = '11'; expect(draftConflict(s, draft)).toContain('mutation scope');
    s.local.rootId = '1'; expect(draftConflict(s, draft)).toBeUndefined();
    s.favorites[0].unmodifiable = 'managed'; expect(draftConflict(s, draft)).toContain('managed');
  });
  it('shares worker validation and normalization without implicitly confirming bookmarklets', () => {
    const input = { title: ' New title ', url: ' https://example.org ', tags: ['ONE', ' one ', '', 'two'], parentId: '10' };
    expect(validateLinkInput(input)).toMatchObject({ title: 'New title', url: 'https://example.org/', tags: ['one', 'two'] });
    expect(linkInputErrors({ ...input, title: ' ', url: 'mailto:a@b', tags: ['a'.repeat(81)] })).toEqual({ title: expect.any(String), url: expect.any(String), tags: expect.any(String) });
    expect(linkInputErrors({ ...input, url: 'https://user:pass@example.org' }).url).toContain('credentials');
    const bookmarklet = { ...input, url: 'javascript:alert(1)\n// exact' };
    expect(() => validateLinkInput(bookmarklet)).toThrow('confirmation');
    expect(confirmLinkInput(bookmarklet, () => false)).toBeUndefined();
    expect(validateLinkInput(confirmLinkInput(bookmarklet, () => true)! ).url).toBe(bookmarklet.url);
  });
});
