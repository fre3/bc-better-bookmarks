import { Fragment, useState } from 'react';

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

// Break opportunities add no characters to the title, selection or accessible name.
function filenameBreaks(text: string) {
  return text.split(/(?<=_)/u).map((part, index, parts) => <Fragment key={index}>{part}{index < parts.length - 1 && <wbr />}</Fragment>);
}

/** Inline text keeps ordinary words intact; only the final grapheme/icon is protected. */
export function BookmarkLabel({ title, icon }: { title: string; icon?: string }) {
  const [failedIcon, setFailedIcon] = useState<string>();
  const parts = /^(.*?)(\S+)(\s*)$/s.exec(title.trim() ? title : '(untitled)')!;
  const final = [...graphemes.segment(parts[2])].at(-1)!;
  const prefix = parts[1] + parts[2].slice(0, final.index);
  const showIcon = icon && failedIcon !== icon;
  return <>{prefix && <span className="bookmark-text">{filenameBreaks(prefix)}</span>}<span className="bookmark-ending"><span className="bookmark-text">{final.segment}{parts[3]}</span>{' '}<span className="favicon-frame" aria-hidden="true">
    {showIcon ? <img className="favicon" src={icon} alt="" loading="lazy" decoding="async" onError={() => setFailedIcon(icon)} /> : <span className="favicon favicon-placeholder" />}
  </span>;</span></>;
}
