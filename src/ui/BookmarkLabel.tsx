import { Fragment, useState } from 'react';

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

// Break opportunities add no characters to the title, selection or accessible name.
function titleBreaks(text: string) {
  return text.split(/([a-z][a-z0-9+.-]*:\/\/)/giu).map((part, index) => index % 2
    ? <span className="bookmark-scheme" key={index}>{part}</span>
    : <Fragment key={index}>{part.split(/(?<=[_/])/u).map((segment, i, segments) => <Fragment key={i}>{segment}{i < segments.length - 1 && <wbr />}</Fragment>)}</Fragment>);
}

/** Inline text keeps ordinary words intact; only the final grapheme/icon is protected. */
export function BookmarkLabel({ title, icon }: { title: string; icon?: string }) {
  const [failedIcon, setFailedIcon] = useState<string>();
  const parts = /^(.*?)(\S+)(\s*)$/s.exec(title.trim() ? title : '(untitled)')!;
  const final = /^[a-z][a-z0-9+.-]*:\/\/$/iu.test(parts[2]) ? { index: 0, segment: parts[2] } : [...graphemes.segment(parts[2])].at(-1)!;
  const prefix = parts[1] + parts[2].slice(0, final.index);
  const showIcon = icon && failedIcon !== icon;
  return <>{prefix && <span className="bookmark-text">{titleBreaks(prefix)}</span>}<span className="bookmark-ending"><span className="bookmark-text">{final.segment}{parts[3]}</span>{' '}<span className="favicon-frame" aria-hidden="true">
    {showIcon ? <img className="favicon" src={icon} alt="" loading="lazy" decoding="async" onError={() => setFailedIcon(icon)} /> : <span className="favicon favicon-placeholder" />}
  </span>;</span></>;
}
