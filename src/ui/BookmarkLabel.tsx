import { useState } from 'react';

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/** Keep the final word with its punctuation when it fits; oversized words may wrap. */
export function BookmarkLabel({ title, icon }: { title: string; icon?: string }) {
  const [failedIcon, setFailedIcon] = useState<string>();
  const parts = /^(.*?)(\S+)\s*$/s.exec(title.trimEnd() || '(untitled)')!;
  const final = [...graphemes.segment(parts[2])].at(-1)!;
  const showIcon = icon && failedIcon !== icon;
  return <>{parts[1]}<span className="bookmark-tail">{parts[2].slice(0, final.index)}<span className="bookmark-ending">{final.segment}{' '}<span className="favicon-frame" aria-hidden="true">
    {showIcon ? <img className="favicon" src={icon} alt="" loading="lazy" decoding="async" onError={() => setFailedIcon(icon)} /> : <span className="favicon favicon-placeholder" />}
  </span>;</span></span></>;
}
