import { useState } from 'react';
import type { CatalogueSection } from './catalogue-model';
import { CatalogueItems } from './CatalogueItems';

interface Props {
  section: CatalogueSection;
  allRoots: boolean;
  open: boolean;
  query: string | null;
  expanded: string[];
  peekEpoch: number;
  onToggle: () => void;
  onFolder: (id: string) => void;
}

export function SectionCard({ section, allRoots, open, query, expanded, peekEpoch, onToggle, onFolder }: Props) {
  const [pointerPeek, setPointerPeek] = useState(-1);
  const [focusPeek, setFocusPeek] = useState(-1);
  const peek = !open && (pointerPeek === peekEpoch || focusPeek === peekEpoch);
  const contentId = `section-content-${section.id}`;
  return <section className={`section-slot${open ? ' is-open' : ''}${peek ? ' is-peeking' : ''}`} data-section-id={section.id}
    onPointerEnter={e => { if (e.pointerType !== 'touch') setPointerPeek(peekEpoch); }} onPointerLeave={() => setPointerPeek(-1)}
    onFocusCapture={() => setFocusPeek(peekEpoch)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) setFocusPeek(-1); }}>
    <div className="section-sheet">
      <h2 className="section-header">
        {query !== null ? <span>{section.title || '(untitled)'}{allRoots && <span className="root-provenance"> · {section.rootTitle}</span>}</span> :
          <button id={`section-${section.id}`} aria-expanded={open} aria-controls={contentId} onClick={() => { setPointerPeek(-1); setFocusPeek(-1); onToggle(); }}>
            {section.title || '(untitled)'}{allRoots && <span className="root-provenance"> · {section.rootTitle}</span>}
          </button>}
      </h2>
      <div id={contentId} className="section-content" inert={!open} aria-hidden={!open}>
        {(open || peek) && <div className="catalogue-flow">
          {section.children.length ? <CatalogueItems items={section.children} expanded={expanded} onToggle={onFolder} query={query} /> : <span className="empty-folder">Empty folder</span>}
        </div>}
      </div>
    </div>
  </section>;
}
