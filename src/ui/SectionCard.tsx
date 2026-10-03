import { useEffect, useState } from 'react';
import type { CatalogueSection } from './catalogue-model';
import { CatalogueItems } from './CatalogueItems';
import { usePeekCoverage } from './usePeekCoverage';

interface Props {
  section: CatalogueSection;
  nextSection?: CatalogueSection;
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

export function SectionCard({ section, nextSection, stackIndex, stackSize, allRoots, open, query, expanded, peekEpoch, onToggle, onFolder }: Props) {
  const [pointerPeek, setPointerPeek] = useState(-1);
  const [focusPeek, setFocusPeek] = useState(-1);
  const peek = !open && (pointerPeek === peekEpoch || focusPeek === peekEpoch);
  // Retain the inert preview only long enough for CSS to finish the short exit.
  // Cleanup cancels the pending removal when a header is re-entered.
  const [retainedPreview, setRetainedPreview] = useState(false);
  useEffect(() => {
    if (peek) { setRetainedPreview(true); return; }
    if (!retainedPreview) return;
    const timeout = window.setTimeout(() => setRetainedPreview(false), 100);
    return () => window.clearTimeout(timeout);
  }, [peek, retainedPreview]);
  const preview = !open && (peek || retainedPreview);
  const slot = usePeekCoverage(preview);
  const contentId = `section-content-${section.id}`;
  return <section ref={slot} id={`card-${section.id}`} className={`section-slot${open ? ' is-open' : ''}${peek ? ' is-peeking' : ''}${preview && !peek ? ' is-leaving' : ''}`} data-section-id={section.id}
    style={{ zIndex: peek ? stackSize + 1 : preview ? stackSize : stackIndex }}>
    <div className="section-sheet has-top-shadow">
      <div className="section-header" onPointerEnter={e => { if (e.pointerType !== 'touch') setPointerPeek(peekEpoch); }} onPointerLeave={() => setPointerPeek(-1)}>
        <h2 className="section-inner">
        {query !== null ? <span className="section-label"><span className="section-heading-text">{section.title || '(untitled)'}{allRoots && <span className="root-provenance"> · {section.rootTitle}</span>}</span></span> :
          <button id={`section-${section.id}`} aria-expanded={open} aria-controls={contentId}
            onFocus={e => { if (e.currentTarget.matches(':focus-visible')) setFocusPeek(peekEpoch); }} onBlur={() => setFocusPeek(-1)}
            onClick={() => { setPointerPeek(-1); setFocusPeek(-1); onToggle(); }}>
            <span className="section-heading-text">{section.title || '(untitled)'}{allRoots && <span className="root-provenance"> · {section.rootTitle}</span>}</span>
          </button>}
        </h2>
      </div>
      <div className="section-reveal">
      <div id={contentId} className="section-content" inert={!open} aria-hidden={!open}>
        {(open || preview) && <div className="section-inner catalogue-flow">
          {section.children.length ? <CatalogueItems items={section.children} expanded={expanded} onToggle={onFolder} query={query} /> : <span className="empty-folder">Empty folder</span>}
        </div>}
      </div>
      {preview && <div className={`peek-successor${nextSection ? ' has-top-shadow' : ''}`} data-sheet-owner={nextSection?.id} aria-hidden="true" inert>
        {/* Presentation of the following sheet's lip, not a second interactive
            header. Real headers retain their flow positions and hit targets. */}
        {nextSection && <div className="section-header"><div className="section-inner section-label"><span className="section-heading-text">{nextSection.title || '(untitled)'}{allRoots && <span className="root-provenance"> · {nextSection.rootTitle}</span>}</span></div></div>}
      </div>}
      </div>
    </div>
  </section>;
}
