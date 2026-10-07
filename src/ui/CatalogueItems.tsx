import { metadataEditable } from '../core/capabilities';
import { EditAction } from './EditAction';
import { TagText } from './TagAnnotation';
import { Fragment, type MouseEvent } from 'react';
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
  movingId?: string;
}

export function CatalogueItems({ items, expanded, onToggle, query, depth = 0, onEdit, selectedId, movingId }: Props) {
  return <>{items.map(item => {
    if (item.kind === 'folder') {
      const { folder, children, tagInfo } = item;
      const folderTags = tagInfo?.effective ?? [];
      const tagMatch = query !== null && matchingTags({ title: folder.title, url: '', folderPath: folder.path, systemLabels: [] }, folderTags, query).length > 0;
      const open = query !== null || expanded.includes(folder.id);
      const title = <><span className="folder-title">{folder.title || '(untitled)'}/</span><span className="folder-count">{children.length}<span className="sr-only"> items</span></span></>;
      return <Fragment key={folder.id}>
        <span className={`catalogue-item folder-item${tagMatch ? ' tag-match' : ''}${selectedId === folder.id ? ' is-selected' : ''}`} data-moving={movingId === folder.id || undefined} data-item-id={folder.id}>
          {query !== null ? <span>{title}</span> : <a role="button" tabIndex={0} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.click(); } }} id={`folder-${folder.id}`} data-drag-title={onEdit&&query===null&&folder.renamable?folder.id:undefined} className="folder-trigger" aria-expanded={open} aria-controls={`children-${folder.id}`} onClick={() => onToggle(folder.id)}>{title}</a>}
          {onEdit && metadataEditable(folder) && <EditAction id={folder.id} title={folder.title} folder onEdit={onEdit} />}
          {query !== null && <span className="search-item-path">{folder.path.join(' / ')}</span>}
          {folderTags.length > 0 && <span className="item-annotation"><span className="all-annotations"><TagText tags={folderTags} info={tagInfo} folder /></span>{tagMatch && <span className="matched-annotations" aria-hidden="true"><TagText tags={folderTags} info={tagInfo} folder /></span>}</span>}
        </span>
        {open && <span id={`children-${folder.id}`} className={`folder-children${depth === 0 ? ' first-expansion' : ''}`}>
          {children.length ? <CatalogueItems onEdit={onEdit} selectedId={selectedId} movingId={movingId} items={children} expanded={expanded} onToggle={onToggle} query={query} depth={depth + 1} /> : <span className="empty-folder">Empty folder</span>}
        </span>}
        {open && depth === 0 && <br className="expansion-break" />}{' '}
      </Fragment>;
    }
    const { favorite, tags, tagInfo, ambiguous, metadataIssue } = item;
    const editable = Boolean(onEdit && !favorite.unmodifiable);
    const editDescription = favorite.nativeRestriction ? 'Click or press Enter to edit extension tags. Native fields are read-only in this browser location. Modifier and middle clicks open the link.' : 'Click or press Enter to edit this favorite. Drag its title to move. Modifier and middle clicks open the link.';
    const activate = (event: MouseEvent<HTMLElement>) => { if (editable && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onEdit?.(favorite.id); } };
    const href = safeHref(favorite.url);
    const icon = faviconUrl(favorite.url);
    const revealed = query !== null ? matchingTags(favorite, tags, query) : [];
    const explanation = !href ? (isBookmarklet(favorite.url) ? 'Run this bookmarklet through Edge Favorites.' : "Open this Favorite using Edge's Favorites UI.") : '';
    // URL status is derived from the Favorite, not a user tag. It uses the same
    // item-local reveal rules rather than a permanently visible annotation path.
    const statusText = [...favorite.systemLabels, explanation, metadataIssue || (ambiguous ? 'Ambiguous metadata — inspect diagnostics in Manage' : '')].filter(Boolean).join(' · ');
    const annotations = tags.length > 0 || Boolean(statusText);
    const label = <BookmarkLabel title={favorite.title} icon={icon} />;
    return <Fragment key={favorite.id}><span className={`catalogue-item bookmark-item${revealed.length ? ' tag-match' : ''}${ambiguous ? ' ambiguous' : ''}${selectedId === favorite.id ? ' is-selected' : ''}`} data-moving={movingId === favorite.id || undefined} data-item-id={favorite.id}>
      {href ? <a id={`bookmark-${favorite.id}`} data-drag-title={onEdit&&query===null&&!favorite.unmodifiable&&!favorite.nativeRestriction?favorite.id:undefined} className="bookmark-title" lang="" href={href} onClick={activate} aria-description={editable ? editDescription : undefined} aria-describedby={annotations ? `annotation-${favorite.id}` : undefined}>{label}</a> : <span id={`bookmark-${favorite.id}`} data-drag-title={onEdit&&query===null&&!favorite.unmodifiable&&!favorite.nativeRestriction?favorite.id:undefined} className="bookmark-title non-navigating" lang="" tabIndex={0} onClick={activate} onKeyDown={event => { if (editable && event.key === 'Enter') { event.preventDefault(); event.currentTarget.click(); } }} aria-description={editable ? editDescription : undefined} aria-describedby={`annotation-${favorite.id}`}>{label}</span>}
      {onEdit && !favorite.unmodifiable && <EditAction id={favorite.id} title={favorite.title} onEdit={onEdit} />}
      {query !== null && <span className="search-item-path">{favorite.folderPath.join(' / ')}</span>}
      {annotations && <span id={`annotation-${favorite.id}`} className="item-annotation">
        {tags.length > 0 && <span className="bookmark-tags all-annotations">{<TagText tags={tags} info={tagInfo} />}</span>}
        {revealed.length > 0 && <span className="bookmark-tags matched-annotations" aria-hidden="true">{<TagText tags={revealed} info={tagInfo} />}</span>}
        {statusText && <span className="status-annotation">{statusText}</span>}
      </span>}
    </span>{' '}</Fragment>;
  })}</>;
}
