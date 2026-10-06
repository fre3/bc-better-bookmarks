import { Fragment } from 'react';
import type { NodeTags } from '../core/node-tags';

export function TagText({ tags, info, folder = false }: { tags: string[]; info?: NodeTags; folder?: boolean }) {
  return <>{tags.map((tag, index) => {
    const sources = info?.sources.filter(source => source.tags.includes(tag));
    const inherited = Boolean(sources?.length);
    const explanation = inherited ? `Inherited from ${sources!.map(s => `${s.path.join(' / ')} [folder ${s.id}]`).join('; ')}${info?.direct.includes(tag) ? '; also directly assigned' : ''}` : 'Direct tag';
    return <Fragment key={tag}>{index > 0 && ' · '}{folder || inherited ? <strong title={explanation}>#{tag}<span className="sr-only"> ({explanation})</span></strong> : <span>#{tag}</span>}</Fragment>;
  })}</>;
}
