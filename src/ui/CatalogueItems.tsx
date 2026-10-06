import { TagText } from './TagAnnotation';
import { Fragment } from 'react';
import { BookmarkLabel } from './BookmarkLabel';
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
  onEdit?: (id: string) => void;
  selectedId?: string;
}

export function CatalogueItems({ items, expanded, onToggle, query, depth = 0, onEdit, selectedId }: Props) {
  return <>{items.map(item => {
    if (item.kind === 'folder') {
      const { folder, children, tagInfo } = item;
      const folderTags = tagInfo?.effective ?? [];
      const tagMatch = query !== null && matchingTags({ title: folder.title, url: '', folderPath: folder.path, systemLabels: [] }, folderTags, query).length > 0;
      const open = query !== null || expanded.includes(folder.id);
      const title = <><span className="folder-title">{folder.title || '(untitled)'}/</span><span className="folder-count">{children.length}<span className="sr-only"> items</span></span></>;
      return <Fragment key={folder.id}>
        <span className={`catalogue-item folder-item${tagMatch ? ' tag-match' : ''}${selectedId === folder.id ? ' is-selected' : ''}`} data-item-id={folder.id}>
          {query !== null ? <span>{title}</span> : <button id={`folder-${folder.id}`} className="folder-trigger" aria-expanded={open} aria-controls={`children-${folder.id}`} onClick={() => onToggle(folder.id)}>{title}</button>}
          {onEdit && folder.renamable && <button id={`edit-folder-${folder.id}`} className="folder-edit-action" aria-label={`Edit folder ${folder.title}`} aria-haspopup="dialog" onClick={() => onEdit(folder.id)}>Edit</button>}
          {tagInfo?.archived && <span className="archive-indicator">Archived</span>}
          {folderTags.length > 0 && <span className="item-annotation"><span className="all-annotations"><TagText tags={folderTags} info={tagInfo} folder /></span>{tagMatch && <span className="matched-annotations" aria-hidden="true"><TagText tags={folderTags} info={tagInfo} folder /></span>}</span>}
        </span>
        {open && <span id={`children-${folder.id}`} className={`folder-children${depth === 0 ? ' first-expansion' : ''}`}>
          {children.length ? <CatalogueItems onEdit={onEdit} selectedId={selectedId} items={children} expanded={expanded} onToggle={onToggle} query={query} depth={depth + 1} /> : <span className="empty-folder">Empty folder</span>}
        </span>}
        {open && depth === 0 && <br className="expansion-break" />}{' '}
      </Fragment>;
    }
    const { favorite, tags, tagInfo, ambiguous } = item;
    const href = safeHref(favorite.url);
    const icon = faviconUrl(favorite.url);
    const revealed = query !== null ? matchingTags(favorite, tags, query) : [];
    const explanation = !href ? (isBookmarklet(favorite.url) ? 'Run this bookmarklet through Edge Favorites.' : "Open this Favorite using Edge's Favorites UI.") : '';
    // URL status is derived from the Favorite, not a user tag. It uses the same
    // item-local reveal rules rather than a permanently visible annotation path.
    const statusText = [...favorite.systemLabels, explanation, ambiguous ? 'Ambiguous metadata — inspect diagnostics in Manage' : ''].filter(Boolean).join(' · ');
    const annotations = tags.length > 0 || Boolean(statusText);
    const label = <BookmarkLabel title={favorite.title} icon={icon} />;
    return <Fragment key={favorite.id}><span className={`catalogue-item bookmark-item${revealed.length ? ' tag-match' : ''}${ambiguous ? ' ambiguous' : ''}${selectedId === favorite.id ? ' is-selected' : ''}`} data-item-id={favorite.id}>
      {onEdit ? <a id={`bookmark-${favorite.id}`} className="bookmark-title" lang="" role="button" tabIndex={0} aria-label={`Edit ${favorite.title || '(untitled)'}`} aria-haspopup="dialog" aria-describedby={annotations ? `annotation-${favorite.id}` : undefined}
        onClick={event => { event.preventDefault(); onEdit(favorite.id); }}
        onAuxClick={event => { event.preventDefault(); if (event.button === 1) onEdit(favorite.id); }}
        onMouseDown={event => { if (event.button === 1) event.preventDefault(); }}
        onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onEdit(favorite.id); } }}>{label}</a> : href ? <a id={`bookmark-${favorite.id}`} className="bookmark-title" lang="" href={href} aria-describedby={annotations ? `annotation-${favorite.id}` : undefined}>{label}</a> : <span id={`bookmark-${favorite.id}`} className="bookmark-title non-navigating" lang="" tabIndex={0} aria-describedby={`annotation-${favorite.id}`}>{label}</span>}
      {tagInfo?.archived && <span className="archive-indicator">Archived</span>}
      {annotations && <span id={`annotation-${favorite.id}`} className="item-annotation">
        {tags.length > 0 && <span className="bookmark-tags all-annotations">{<TagText tags={tags} info={tagInfo} />}</span>}
        {revealed.length > 0 && <span className="bookmark-tags matched-annotations" aria-hidden="true">{<TagText tags={revealed} info={tagInfo} />}</span>}
        {statusText && <span className="status-annotation">{statusText}</span>}
      </span>}
    </span>{' '}</Fragment>;
  })}</>;
}
