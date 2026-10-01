import { useState } from 'react';
import type { CatalogueSection } from './catalogue-model';
import { CatalogueItems } from './CatalogueItems';

interface Props {
  section: CatalogueSection;
  stackIndex: number;
  stackSize: number;
  allRoots: boolean;
  open: boolean;
  query: string | null;
  expanded: string[];
  peekEpoch: number;
  onToggle: () => void;
  onFolder: (id: string) => void;
}

export function SectionCard({ section, stackIndex, stackSize, allRoots, open, query, expanded, peekEpoch, onToggle, onFolder }: Props) {
  const [pointerPeek, setPointerPeek] = useState(-1);
  const [focusPeek, setFocusPeek] = useState(-1);
  const peek = !open && (pointerPeek === peekEpoch || focusPeek === peekEpoch);
  const contentId = `section-content-${section.id}`;
  return <section id={`card-${section.id}`} className={`section-slot${open ? ' is-open' : ''}${peek ? ' is-peeking' : ''}`} data-section-id={section.id}
    style={{ zIndex: peek ? stackSize : stackIndex }}>
    <div className="section-sheet">
      <div className="section-header" onPointerEnter={e => { if (e.pointerType !== 'touch') setPointerPeek(peekEpoch); }} onPointerLeave={() => setPointerPeek(-1)}>
        <h2 className="section-inner">
        {query !== null ? <span className="section-label"><span>{section.title || '(untitled)'}{allRoots && <span className="root-provenance"> · {section.rootTitle}</span>}</span></span> :
          <button id={`section-${section.id}`} aria-expanded={open} aria-controls={contentId}
            onFocus={e => { if (e.currentTarget.matches(':focus-visible')) setFocusPeek(peekEpoch); }} onBlur={() => setFocusPeek(-1)}
            onClick={() => { setPointerPeek(-1); setFocusPeek(-1); onToggle(); }}>
            {section.title || '(untitled)'}{allRoots && <span className="root-provenance"> · {section.rootTitle}</span>}
          </button>}
        </h2>
      </div>
      <div id={contentId} className="section-content" inert={!open} aria-hidden={!open}>
        {(open || peek) && <div className="section-inner catalogue-flow">
          {section.children.length ? <CatalogueItems items={section.children} expanded={expanded} onToggle={onFolder} query={query} /> : <span className="empty-folder">Empty folder</span>}
        </div>}
      </div>
    </div>
  </section>;
}
