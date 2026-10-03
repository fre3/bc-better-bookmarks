import { describe, expect, it } from 'vitest';
import { flattenTree } from '../src/core/logic';
import type { FavoriteNode, Snapshot } from '../src/core/model';
import { buildCatalogue, filterCatalogue, matchingTags } from '../src/ui/catalogue-model';
import { catalogueReducer, initialCatalogueState, rootShortcut, searchKey } from '../src/ui/catalogue-state';
import { favorite, record } from './fixtures';

function fixture() {
  const tree: FavoriteNode[] = [{ id: 'virtual', title: '', children: [
    { id: 'work', parentId: 'virtual', title: 'Workspaces', children: [
      { id: 'dev', parentId: 'work', title: 'Development', children: [
        { id: 'deep', parentId: 'dev', title: 'Nested', children: [
          { id: 'a', parentId: 'deep', title: 'Azure', url: 'https://azure.com' },
          { id: 'b', parentId: 'deep', title: 'Other', url: 'https://example.com' },
        ] },
      ] },
      { id: 'loose1', parentId: 'work', title: 'First loose', url: 'https://example.org' },
      { id: 'empty', parentId: 'work', title: 'Empty', children: [] },
      { id: 'loose2', parentId: 'work', title: 'Second loose', url: 'https://example.net' },
    ] },
    { id: 'bar', parentId: 'virtual', title: 'Favorites bar', children: [
      { id: 'otherdev', parentId: 'bar', title: 'Development', children: [] },
      { id: 'loose3', parentId: 'bar', title: 'Another root', url: 'https://example.edu' },
    ] },
    { id: 'managed', parentId: 'virtual', title: 'Organization', unmodifiable: 'managed', children: [] },
  ] }];
  const meta = record(favorite(), 'identity'); meta.tags = ['ai', 'reference'];
  // Only fields consumed by the UI projection are needed for this fixture.
  const snapshot = { tree, ...flattenTree(tree), metadata: { records: [meta] }, reconciliation: { mappings: { a: { stableId: 'identity' } }, matches: [{ status: 'ambiguous', candidateIds: ['b'] }] } } as unknown as Snapshot;
  return { snapshot, model: buildCatalogue(snapshot) };
}

describe('catalogue projection over the browser tree', () => {
  it('discovers arbitrary roots and preserves folder/loose section ordering and duplicate names', () => {
    const { model } = fixture();
    expect(model.roots.map(r => r.title)).toEqual(['Workspaces', 'Favorites bar', 'Organization']);
    expect(model.sections.map(s => [s.id, s.title, s.rootTitle])).toEqual([
      ['folder:dev', 'Development', 'Workspaces'], ['loose:work', 'Bookmarks', 'Workspaces'],
      ['folder:empty', 'Empty', 'Workspaces'], ['folder:otherdev', 'Development', 'Favorites bar'],
      ['loose:bar', 'Bookmarks', 'Favorites bar'],
    ]);
    expect(model.sections[1].children.map(item => item.kind === 'bookmark' && item.favorite.id)).toEqual(['loose1', 'loose2']);
  });
  it('filters via the existing mixed-query matcher and retains only ancestry of matches', () => {
    const { model, snapshot } = fixture();
    const result = filterCatalogue(model, snapshot.favorites, '*', 'azure #ai @development', true);
    expect(result.count).toBe(1);
    expect(result.sections.map(s => s.id)).toEqual(['folder:dev']);
    const folder = result.sections[0].children[0];
    expect(folder.kind).toBe('folder');
    if (folder.kind === 'folder') expect(folder.children.map(item => item.kind === 'bookmark' && item.favorite.id)).toEqual(['a']);
    expect(filterCatalogue(model, snapshot.favorites, 'bar', '#ai', true).count).toBe(0);
    expect(filterCatalogue(model, snapshot.favorites, 'bar', '', false).sections.map(s => s.id)).toEqual(['folder:otherdev', 'loose:bar']);
  });
  it('keeps untagged and ambiguous bookmarks visible without inventing folder tags', () => {
    const { model, snapshot } = fixture();
    expect(model.tags.get('a')).toEqual(['ai', 'reference']);
    expect(model.tags.get('b')).toEqual([]);
    expect(model.tags.has('deep')).toBe(false);
    const result = filterCatalogue(model, snapshot.favorites, '*', 'other', true);
    const nested = result.sections[0].children[0];
    if (nested.kind !== 'folder') throw new Error('Missing context');
    expect(nested.children[0]).toMatchObject({ kind: 'bookmark', ambiguous: true });
    expect(filterCatalogue(model, snapshot.favorites, '*', '', false).sections).toHaveLength(5);
  });
  it('explains targeted and otherwise-hidden tag matches only', () => {
    const f = favorite({ title: 'Azure', url: 'https://azure.com', folderPath: ['Development'] });
    expect(matchingTags(f, ['azure', 'ai', 'reference'], 'azure #ai')).toEqual(['ai']);
    expect(matchingTags(f, ['reference'], 'ref')).toEqual(['reference']);
    expect(matchingTags(f, ['development'], '@development')).toEqual([]);
  });
});

describe('browse and temporary search state', () => {
  it('opens one section, restores browse expansions after search, and resets scope cleanly', () => {
    let state = catalogueReducer(initialCatalogueState, { type: 'section', id: 'one' });
    state = catalogueReducer(state, { type: 'folder', id: 'nested', ancestors: [] });
    state = catalogueReducer(state, { type: 'query', value: '#ai' });
    expect(state.openSection).toBe('one');
    state = catalogueReducer(state, { type: 'escape' });
    expect(state).toMatchObject({ query: null, openSection: 'one', expanded: ['nested'] });
    state = catalogueReducer(state, { type: 'section', id: 'two' });
    expect(state).toMatchObject({ openSection: 'two', expanded: [] });
    state = catalogueReducer(state, { type: 'query', value: 'azure' });
    state = catalogueReducer(state, { type: 'scope', id: 'bar' });
    expect(state).toMatchObject({ scope: 'bar', query: 'azure', openSection: null, expanded: [] });
  });
  it('Escape unwinds nested expansion, section, and peek without changing mutations', () => {
    let state: typeof initialCatalogueState = { ...initialCatalogueState, openSection: 'one', expanded: ['parent', 'child'] };
    state = catalogueReducer(state, { type: 'escape' });
    expect(state.expanded).toEqual(['parent']);
    state = catalogueReducer(state, { type: 'escape' });
    state = catalogueReducer(state, { type: 'escape' });
    expect(state.openSection).toBeNull();
    expect(state.peekEpoch).toBe(3);
  });
  it('maintains one ancestor path through sibling switches, collapse and Escape', () => {
    let state = catalogueReducer(initialCatalogueState, { type: 'folder', id: 'A', ancestors: [] });
    state = catalogueReducer(state, { type: 'folder', id: 'A1', ancestors: ['A'] });
    state = catalogueReducer(state, { type: 'folder', id: 'deep', ancestors: ['A', 'A1'] });
    expect(state.expanded).toEqual(['A', 'A1', 'deep']);
    state = catalogueReducer(state, { type: 'folder', id: 'A2', ancestors: ['A'] });
    expect(state.expanded).toEqual(['A', 'A2']);
    state = catalogueReducer(state, { type: 'folder', id: 'A2', ancestors: ['A'] });
    expect(state.expanded).toEqual(['A']);
    state = catalogueReducer(state, { type: 'folder', id: 'A1', ancestors: ['A'] });
    state = catalogueReducer(state, { type: 'folder', id: 'B', ancestors: [] });
    expect(state.expanded).toEqual(['B']);
    state = catalogueReducer(state, { type: 'folder', id: 'B1', ancestors: ['B'] });
    state = catalogueReducer(state, { type: 'escape' });
    expect(state.expanded).toEqual(['B']);
    state = catalogueReducer(state, { type: 'folder', id: 'B', ancestors: [] });
    expect(state.expanded).toEqual([]);
  });
  it('starts search for printable keys and slash without stealing text editing, composition, shortcuts, or Space activation', () => {
    const key = { key: 'a', ctrlKey: false, metaKey: false, altKey: false, isComposing: false };
    expect(searchKey(key, false)).toBe('a');
    expect(searchKey({ ...key, key: '/' }, false)).toBe('');
    expect(searchKey(key, true)).toBeUndefined();
    for (const override of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, { key: ' ' }, { key: 'Enter' }]) expect(searchKey({ ...key, ...override }, false)).toBeUndefined();
  });
});

describe('temporary scope and local root shortcuts', () => {
  it('restores the original branch after external commands, queries and root changes', () => {
    const browse = { ...initialCatalogueState, scope: 'work', openSection: 'dev', expanded: ['A', 'A1'] };
    let state = catalogueReducer(browse, { type: 'query', value: '', allBookmarks: true });
    expect(state.scope).toBe('*');
    state = catalogueReducer(state, { type: 'query', value: 'azure' });
    state = catalogueReducer(state, { type: 'scope', id: 'bar' });
    state = catalogueReducer(state, { type: 'query', value: state.query!, allBookmarks: true });
    expect(state.query).toBe('azure');
    state = catalogueReducer(state, { type: 'escape' });
    expect(state).toMatchObject({ scope: 'work', openSection: 'dev', expanded: ['A', 'A1'], query: null, browseReturn: undefined });
    state = catalogueReducer(state, { type: 'scope', id: 'bar' });
    state = catalogueReducer(state, { type: 'query', value: '/' });
    expect(state.scope).toBe('bar');
    expect(state.browseReturn?.scope).toBe('bar');
  });
  const roots = [{ id: '*' }, { id: 'arbitrary-root' }, { id: 'other' }];
  const event = { key: '2', altKey: true, ctrlKey: false, metaKey: false, shiftKey: false, isComposing: false, getModifierState: () => false };
  it('maps displayed order, tolerating fewer or reordered roots', () => {
    expect(rootShortcut(event, roots, false)).toBe('arbitrary-root');
    expect(rootShortcut(event, [roots[0], roots[2], roots[1]], false)).toBe('other');
    expect(rootShortcut({ ...event, key: '1' }, roots, false)).toBe('*');
    expect(rootShortcut({ ...event, key: '9' }, roots, false)).toBeUndefined();
  });
  it('excludes editing, composition, extra modifiers, German AltGr and browser navigation', () => {
    expect(rootShortcut(event, roots, true)).toBeUndefined();
    for (const override of [{ altKey: false }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { isComposing: true }, { key: '²', ctrlKey: true }, { key: '³', getModifierState: () => true }, { getModifierState: () => true }, { key: 'ArrowLeft' }, { key: 'ArrowRight' }]) {
      expect(rootShortcut({ ...event, ...override }, roots, false)).toBeUndefined();
    }
    expect(searchKey({ ...event, altKey: false }, false)).toBe('2');
  });
});
