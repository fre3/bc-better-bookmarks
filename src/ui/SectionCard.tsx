import { useEffect, useMemo, useState } from 'react';
import type { CatalogueSection } from './catalogue-model';
import { CatalogueItems } from './CatalogueItems';
import { useCatalogueAnnotations } from './useCatalogueAnnotations';
import { usePeekScroll } from './usePeekScroll';
import { PeekSummary } from './PeekSummary';
import { usePeekCoverage } from './usePeekCoverage';

interface Props {
  section: CatalogueSection;
  nextSection?: CatalogueSection;
  sections?: readonly CatalogueSection[];
  stackIndex: number;
  stackSize: number;
  allRoots: boolean;
  open: boolean;
  query: string | null;
  expanded: string[];
  peekEpoch: number;
  autoScrollPeek?: boolean;
  onToggle: () => void;
  onFolder: (id: string) => void;
}

export function SectionCard({ section, nextSection, sections, stackIndex, stackSize, allRoots, open, query, expanded, peekEpoch, autoScrollPeek = true, onToggle, onFolder }: Props) {
  const [mouseHover, setMouseHover] = useState(false);
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
  const { slot, coveredIds } = usePeekCoverage(preview);
  const covered = useMemo(() => {
    const ids = new Set(coveredIds);
    return (sections ?? (nextSection ? [nextSection] : [])).filter(item => ids.has(item.id));
  }, [sections, nextSection, coveredIds]);
  const flow = useCatalogueAnnotations();
  const showingPeek = peek;
  usePeekScroll(autoScrollPeek && mouseHover && pointerPeek === peekEpoch && showingPeek && query === null, flow);
  const contentId = `section-content-${section.id}`;
  return <section ref={slot} id={`card-${section.id}`} className={`section-slot${open ? ' is-open' : ''}${showingPeek ? ' is-peeking' : ''}${preview && !peek ? ' is-leaving' : ''}`} data-section-id={section.id}
    style={{ zIndex: showingPeek ? stackSize + 1 : preview ? stackSize : stackIndex }}>
    <div className="section-sheet has-top-shadow">
      <div className="section-header" onPointerEnter={e => { setMouseHover(e.pointerType === 'mouse'); if (e.pointerType !== 'touch') setPointerPeek(peekEpoch); }} onPointerLeave={() => { setMouseHover(false); setPointerPeek(-1); }}>
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
        {(open || preview) && <div ref={flow} className="section-inner catalogue-flow">
          {section.children.length ? <CatalogueItems items={section.children} expanded={expanded} onToggle={onFolder} query={query} /> : <span className="empty-folder">Empty folder</span>}
        </div>}
      </div>
      {preview && nextSection && <div className={`peek-successor${nextSection ? ' has-top-shadow' : ''}`} data-sheet-owner={nextSection?.id} aria-hidden="true" inert>
        {/* Presentation of the following sheet's lip, not a second interactive
            header. Real headers retain their flow positions and hit targets. */}
        {nextSection && <div className="section-header peek-header-measure"><div className="section-inner section-label"><span className="section-heading-text">{nextSection.title || '(untitled)'}{allRoots && <span className="root-provenance"> · {nextSection.rootTitle}</span>}</span></div></div>}
        {covered.length > 0 && <PeekSummary items={covered} allRoots={allRoots} />}
      </div>}
      </div>
    </div>
  </section>;
}
