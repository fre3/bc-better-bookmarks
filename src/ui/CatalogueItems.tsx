import { Fragment } from 'react';
import { faviconUrl } from '../browser/favicon';
import { isBookmarklet, safeHref } from '../core/logic';
import { matchingTags } from './catalogue-model';
import type { CatalogueItem } from './catalogue-model';

interface Props {
  items: CatalogueItem[];
  expanded: string[];
  onToggle: (id: string) => void;
  query: string | null;
  depth?: number;
}

export function CatalogueItems({ items, expanded, onToggle, query, depth = 0 }: Props) {
  return <>{items.map(item => {
    if (item.kind === 'folder') {
      const { folder, children } = item;
      const open = query !== null || expanded.includes(folder.id);
      const title = <><span className="folder-title">{folder.title || '(untitled)'}/</span><span className="folder-count">{folder.children?.length ?? children.length}<span className="sr-only"> items</span></span></>;
      return <Fragment key={folder.id}>
        <span className="catalogue-item folder-item" data-item-id={folder.id}>
          {query !== null ? <span>{title}</span> : <button id={`folder-${folder.id}`} className="folder-trigger" aria-expanded={open} aria-controls={`children-${folder.id}`} onClick={() => onToggle(folder.id)}>{title}</button>}
        </span>
        {open && <span id={`children-${folder.id}`} className={`folder-children${depth === 0 ? ' first-expansion' : ''}`}>
          {children.length ? <CatalogueItems items={children} expanded={expanded} onToggle={onToggle} query={query} depth={depth + 1} /> : <span className="empty-folder">Empty folder</span>}
        </span>}
        {open && depth === 0 && <br className="expansion-break" />}{' '}
      </Fragment>;
    }
    const { favorite, tags, ambiguous } = item;
    const href = safeHref(favorite.url);
    const icon = faviconUrl(favorite.url);
    const revealed = query !== null ? matchingTags(favorite, tags, query) : [];
    const explanation = !href ? (isBookmarklet(favorite.url) ? 'Run this bookmarklet through Edge Favorites.' : "Open this Favorite using Edge's Favorites UI.") : '';
    // URL status is derived from the Favorite, not a user tag. It uses the same
    // item-local reveal rules rather than a permanently visible annotation path.
    const statusText = [...favorite.systemLabels, explanation, ambiguous ? 'Ambiguous metadata — inspect diagnostics in Manage' : ''].filter(Boolean).join(' · ');
    const annotations = tags.length > 0 || Boolean(statusText);
    const label = <>{favorite.title || '(untitled)'}{icon ? <> <span className="bookmark-ending"><img className="favicon" src={icon} alt="" width="32" height="32" loading="lazy" decoding="async" onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />;</span></> : ';'}</>;
    return <Fragment key={favorite.id}><span className={`catalogue-item bookmark-item${revealed.length ? ' tag-match' : ''}${ambiguous ? ' ambiguous' : ''}`} data-item-id={favorite.id}>
      {href ? <a id={`bookmark-${favorite.id}`} className="bookmark-title" href={href} aria-describedby={annotations ? `annotation-${favorite.id}` : undefined}>{label}</a> : <span id={`bookmark-${favorite.id}`} className="bookmark-title non-navigating" tabIndex={0} aria-describedby={`annotation-${favorite.id}`}>{label}</span>}
      {annotations && <span id={`annotation-${favorite.id}`} className="item-annotation">
        {tags.length > 0 && <span className="bookmark-tags all-annotations">{tags.map(tag => `#${tag}`).join(' · ')}</span>}
        {revealed.length > 0 && <span className="bookmark-tags matched-annotations" aria-hidden="true">{revealed.map(tag => `#${tag}`).join(' · ')}</span>}
        {statusText && <span className="status-annotation">{statusText}</span>}
      </span>}
    </span>{' '}</Fragment>;
  })}</>;
}
