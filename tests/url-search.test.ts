import { describe, expect, it, vi } from 'vitest';
import { BOOKMARKLET_WARNING, confirmLinkInput, flattenTree, isBookmarklet, parseSearch, safeHref, searchFavorites, systemLabelsFor, validateUrl } from '../src/core/logic';
import type { Favorite, LinkInput } from '../src/core/model';

describe('URL policy and confirmation (no live browser)', () => {
  const code = " JaVaScRiPt:(() => {\n  const text = '%20 & # ?'; alert(text);\n})();  ";
  const input: LinkInput = { title: 'Test', url: code, parentId: '1', tags: [] };
  it.each(['http://example.com/', 'https://example.com/'])('accepts %s without confirmation', url => {
    const confirm = vi.fn();
    expect(validateUrl(url)).toBe(url);
    expect(confirmLinkInput({ ...input, url }, confirm)?.bookmarkletConfirmed).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
  });
  it('requires confirmation and preserves opaque JavaScript exactly', () => {
    expect(isBookmarklet(code)).toBe(true);
    expect(() => validateUrl(code)).toThrow('confirmation');
    const confirm = vi.fn(() => true);
    const accepted = confirmLinkInput(input, confirm)!;
    expect(confirm).toHaveBeenCalledWith(BOOKMARKLET_WARNING);
    expect(validateUrl(accepted.url, accepted.bookmarkletConfirmed)).toBe(code);
    expect(input.bookmarkletConfirmed).toBeUndefined();
    expect(safeHref(code)).toBeUndefined();
  });
  it('cancel returns no save input, even if an earlier input was confirmed', () => {
    expect(confirmLinkInput({ ...input, bookmarkletConfirmed: true }, () => false)).toBeUndefined();
  });
  it.each(['data:text/html,test', 'file:///tmp/test', 'ftp://example.com', 'mailto:test@example.com', 'vbscript:msgbox(1)', 'java\tscript:alert(1)'])('rejects unsupported scheme %s even with confirmation', url => {
    expect(() => validateUrl(url, true)).toThrow();
    expect(safeHref(url)).toBeUndefined();
  });
  it.each([
    ['javascript:alert(1)', ['JS']], ['JAVASCRIPT:alert(1)', ['JS']],
    ['http://example.com', ['HTTP']], ['https://example.com', []],
    ['https://example.com/javascript:alert(1)', []], ['mailto:test@example.com', []],
  ])('derives labels from scheme only: %s', (url, labels) => {
    expect(systemLabelsFor(url)).toEqual(labels);
    expect(isBookmarklet(url)).toBe(labels.includes('JS'));
  });
});

describe('targeted freeform search', () => {
  const favorites: Favorite[] = flattenTree([{ id: '0', title: '', children: [
    { id: '1', parentId: '0', title: 'Development', children: [
      { id: 'a', parentId: '1', title: 'Microsoft Azure', url: 'https://example.com/docs#intro' },
      { id: 'b', parentId: '1', title: 'Other', url: 'https://azure.example.com/' },
      { id: 'js', parentId: '1', title: 'Tool', url: 'javascript:alert(1)' },
      { id: 'http', parentId: '1', title: 'Legacy', url: 'http://example.com/' },
    ] },
    { id: '2', parentId: '0', title: 'Azure Work', children: [
      { id: 'c', parentId: '2', title: 'Invoice', url: 'https://example.org' },
      { id: 'd', parentId: '2', title: 'Microsoft', url: 'https://example.net' },
    ] },
  ] }]).favorites;
  const tags: Record<string, string[]> = { a: ['azure', 'important'], b: ['important'], d: ['azure'] };
  const search = (query: string) => searchFavorites(favorites, query, id => tags[id] ?? []).map(f => f.id);
  it.each([
    ['azure', ['a', 'b', 'c', 'd']], ['#azure', ['a', 'd']], ['#azu', ['a', 'd']],
    ['@development', ['a', 'b', 'js', 'http']], ['@dev', ['a', 'b', 'js', 'http']],
    ['microsoft #azure', ['a', 'd']], ['microsoft @development #important', ['a']],
    ['#azure #important', ['a']], ['@work #azure microsoft', ['d']],
    ['microsoft azure', ['a', 'd']], ['#does-not-exist', []],
    ['js', ['js']], ['http', ['a', 'b', 'http', 'c', 'd']],
    ['  MICROSOFT\t@DeV\n#IMPORTANT  ', ['a']],
    ['https://example.com/docs#intro', ['a']], ['docs#intro', ['a']],
    ['#JS', []], ['!js', []], ['type:js', []], ['system:js', []],
  ])('%s matches only the requested fields and requires every token', (query, ids) => {
    expect(search(query)).toEqual(ids);
  });
  it.each(['', '  \t\n', '#', '@', '# @'])('ignores empty query/operators: %s', query => {
    expect(search(query)).toEqual(favorites.map(f => f.id));
  });
  it('ignores empty operators alongside meaningful terms', () => {
    expect(search('# microsoft @')).toEqual(['a', 'd']);
  });
  it('recognizes operators only at token starts', () => {
    expect(parseSearch('https://host/#azure user@example.com #azu @dev # @')).toEqual([
      { field: 'all', value: 'https://host/#azure' }, { field: 'all', value: 'user@example.com' },
      { field: 'tag', value: 'azu' }, { field: 'category', value: 'dev' },
    ]);
  });
  it('includes labels in ordinary search independently of URL/title and excludes them from tag search', () => {
    // Isolate the searchable view field: HTTP normally also occurs in the URL.
    const view = { ...favorites[0], title: 'Tool', url: 'opaque', folderPath: [], systemLabels: ['HTTP', 'JS'] as Favorite['systemLabels'] };
    expect(searchFavorites([view], 'http js', () => [])).toEqual([view]);
    expect(searchFavorites([view], '#http', () => [])).toEqual([]);
  });
});
