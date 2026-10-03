import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BookmarkLabel } from '../src/ui/BookmarkLabel';
import { CatalogueItems } from '../src/ui/CatalogueItems';
import { SectionCard } from '../src/ui/SectionCard';
import { faviconUrl } from '../src/browser/favicon';
import { favorite } from './fixtures';

afterEach(() => vi.unstubAllGlobals());
describe('catalogue safety and semantics', () => {
  it('uses only the extension-local favicon endpoint for safe web URLs', () => {
    vi.stubGlobal('chrome', { runtime: { id: 'test', getURL: (path: string) => `chrome-extension://test${path}` } });
    const url = new URL(faviconUrl('https://example.com/a?q=hello&x=1')!);
    expect(url.host).toBe('test');
    expect(url.protocol).toBe('chrome-extension:');
    expect(url.pathname).toBe('/_favicon/');
    expect(url.searchParams.get('pageUrl')).toBe('https://example.com/a?q=hello&x=1');
    for (const unsafe of ['javascript:alert(1)', 'mailto:test@example.com', 'https://user:secret@example.com']) expect(faviconUrl(unsafe)).toBeUndefined();
  });
  it('renders bookmarklets as focusable, non-navigating text with the accepted execution instruction', () => {
    const markup = renderToStaticMarkup(<CatalogueItems items={[{ kind: 'bookmark', favorite: favorite({ url: 'javascript:alert(1)', systemLabels: ['JS'] }), tags: ['work'], ambiguous: false }]} expanded={[]} onToggle={() => undefined} query={null} />);
    expect(markup).not.toContain('<a ');
    expect(markup).not.toContain('<img');
    expect(markup).toContain('tabindex="0"');
    expect(markup).toContain('Run this bookmarklet through Edge Favorites.');
    expect(markup).toContain('#work');
  });
  it('renders title then trailing favicon and semicolon, with distinct supplementary tags', () => {
    vi.stubGlobal('chrome', { runtime: { id: 'test', getURL: (path: string) => `chrome-extension://test${path}` } });
    const item = { kind: 'bookmark' as const, favorite: favorite(), tags: ['work'], ambiguous: false };
    const browse = renderToStaticMarkup(<CatalogueItems items={[item, { ...item, favorite: favorite({ id: '21', title: 'Second' }) }]} expanded={[]} onToggle={() => undefined} query={null} />);
    expect(browse).toContain('<span class="bookmark-text">Azur</span><span class="bookmark-ending"><span class="bookmark-text">e</span> ');
    expect(browse).not.toContain('bookmark-tail');
    expect(browse).toContain('class="bookmark-tags all-annotations"');
    expect(browse).not.toContain('tag-match');
    expect(browse).not.toContain('<br');
    const search = renderToStaticMarkup(<CatalogueItems items={[item]} expanded={[]} onToggle={() => undefined} query="#work" />);
    expect(search).toContain('tag-match');
    expect(search).toContain('bookmark-tags matched-annotations');
  });
  it('preserves filename text while adding separator break opportunities and a minimal ending', () => {
    const title = 'disaster_recovery_planning_template_revised.pdf';
    const label = renderToStaticMarkup(<BookmarkLabel title={title} icon="icon.png" />);
    expect(label.replace(/<[^>]*>/g, '')).toBe(`${title} ;`);
    expect(label).toContain('disaster_<wbr/>recovery_<wbr/>');
    expect(label).not.toContain('bookmark-tail');
    expect(label).not.toContain('\u00ad');
    expect(renderToStaticMarkup(<BookmarkLabel title="   " />)).toContain('(untitled');
    expect(renderToStaticMarkup(<BookmarkLabel title="Title 👩‍💻" />)).toContain('bookmark-text">👩‍💻</span>');
    expect(renderToStaticMarkup(<BookmarkLabel title="Fallback" />)).toContain('favicon-placeholder');
  });
  it('keeps one semantic link and unknown title language without changing stored text', () => {
    const title = 'UB Unternehmensberatung für Personalmanagement';
    const markup = renderToStaticMarkup(<CatalogueItems items={[{ kind: 'bookmark', favorite: favorite({ title }), tags: [], ambiguous: false }]} expanded={[]} onToggle={() => undefined} query={null} />);
    expect(markup.match(/<a /g)).toHaveLength(1);
    expect(markup).toContain('lang=""');
    expect(markup).not.toContain('tabindex');
    expect(markup.replace(/<[^>]*>/g, '')).toContain(title);
  });
  it('keeps URL-status labels on the item annotation path, separate from tags', () => {
    const markup = renderToStaticMarkup(<CatalogueItems items={[{ kind: 'bookmark', favorite: favorite({ url: 'http://example.com/', systemLabels: ['HTTP'] }), tags: [], ambiguous: false }]} expanded={[]} onToggle={() => undefined} query={null} />);
    expect(markup).toContain('<span class="status-annotation">HTTP</span>');
    expect(markup).not.toContain('bookmark-tags');
    expect(markup).not.toContain('essential-info');
    expect(markup).toContain('aria-describedby="annotation-20"');
  });
  it('retains native links and associated annotations, and makes collapsed content inert', () => {
    const section = { id: 'loose:r', title: 'Bookmarks', rootId: 'r', rootTitle: 'Workspaces', parentId: 'r', children: [{ kind: 'bookmark' as const, favorite: favorite(), tags: ['work'], ambiguous: false }] };
    const props = { section, stackIndex: 1, stackSize: 3, allRoots: true, query: null, expanded: [], peekEpoch: 0, onToggle: () => undefined, onFolder: () => undefined };
    const collapsed = renderToStaticMarkup(<SectionCard {...props} open={false} />);
    expect(collapsed).toContain('aria-expanded="false"');
    expect(collapsed).toContain('inert=""');
    expect(collapsed).toContain('style="z-index:1"');
    expect(collapsed).not.toContain('href=');
    const open = renderToStaticMarkup(<SectionCard {...props} open />);
    expect(open).toContain('href="https://azure.com/"');
    expect(open).toContain('aria-describedby="annotation-20"');
    expect(open).toContain(' · Workspaces');
    expect(open).not.toContain('inert=""');
  });
});
