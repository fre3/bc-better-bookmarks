# Development State

Last updated: 2026-10-03
Current branch: `feature/ui-ux-redesign`. Browser-review build: **0.1.13**.
Validated baseline: `1217369dd10638942d80107d5f33d7f61491d075`, unchanged on `master`, `archive/mvp-validated-0.1.1` and annotated tag `mvp-validated-0.1.1`.

## Current checkpoint and next action

**Next action: native Edge review of the 0.1.13 peek/scroll jitter correction. Stop here.** No push was made. Development/tooling remains WSL `/home/dev/projects/bc-better-bookmarks`; supplied media and the Windows clone are untouched. Reload tracked `dist/` at `edge://extensions`, verify **0.1.13**, and open a fresh New Tab. [Load instructions](ui-ux-design.md#build-and-load-in-edge).

Visual work is not accepted. Do not create `feature/bookmark-editing` until user acceptance; it should then start from the accepted commit. Semantic search, editing, drag/drop, thumbnails, folder tags and sync changes remain deferred.

## Recording, reproduction and confirmed cause

Found the exact supplied `release 0.1.12 - last-section-before-footer-scroll.mp4` (22.7 seconds). Decoded and visually inspected representative frames at approximately 2, 6, 9, 14, 18 and 22 seconds. Supplied media remains untracked and unchanged; no extracted private-bookmark frames are committed.

Reproduced the full sequence with Playwright's browser-delivered **wheel and pointer input**, including repeated cycles without reloading. No direct scroll assignments or dispatched mouseenter events were used in the reproduction/regression. Traced scroll/document height, extension, actual header positions, peek state, pointer/wheel/scroll events, pending animation frames/timers and ResizeObserver callbacks.

**Cause:** immediate spacer contraction shortened the document below the wheel-selected viewport. The browser clamped scroll; subsequent preview growth restored the earlier wheel offset and shifted the header targets again. The 0.1.12 pointer-entry suppression flag could not prevent that recurring clamp/restore behavior during later pointer traversal. In the compact reproduction, later traversal repeatedly moved between **343px and roughly 423px**, without another wheel event. Four cycles reproduced the behavior. This was not an acceptable one-time clamp. No endlessly queued animation/timer was needed to explain it.

The pre-fix Chromium harness settled when the pointer stopped; the user's stronger persistent native Edge behavior is recorded rather than contradicted. The confirmed recurring viewport oscillation is reproduced and fixed locally. Native Edge must still validate the reported full failure sequence.

## Fix and temporary-space lifecycle

The spacer still covers complete entering/exiting previews and bounded summaries. Its measurement uses the stable section stack and footer height, never the moving footer position. **Before shrinking, retain only the existing space still needed to support the current viewport.** This avoids triggering a browser clamp in the first place. It is capped by the previous reservation and combined with current preview need using a maximum, never a sum.

- Normal exit without scrolling into added space removes it with the existing animation.
- After scrolling into added space, pointer exit closes the preview and stops all preview work; only the minimum viewport-supporting space remains. A representative case retains 60px, not the entire 140px preview.
- Normal upward wheel scrolling releases that retained minimum progressively, reaching zero as soon as the natural document can support the viewport. No scroll position is continuously forced or restored by this hook; it calls no scroll API.
- Opening/collapsing a section, Escape/root/search navigation or Manage suspension starts a new geometry lifecycle and clears the old reservation. Old retiring previews cannot restore a cancelled lifecycle. Observers and listeners are disconnected on replacement/unmount.
- There is no timeout that later collapses space underneath an idle user, no permanent resting reservation, no accumulated gap and no disabled subsequent peeks. The old global `peekClamped` flag and pointer-motion bypass are removed.

**Intentional remaining behavior:** if the user stays at a viewport position that depends on the extension, a small blank area can remain after the preview closes. It is transient UI state, not persisted; upward scrolling or an explicit navigation/open/search action releases it. Explicit transitions to a shorter document may naturally clamp, and Escape cannot restore a scroll offset beyond the resulting normal document. The follow-up peek remains stable in the rendered search regression. Native Edge wheel/trackpad behavior still needs acceptance.

Preserved: compact 85px resting final header, complete 2.5-line final previews and sole footer edge, approved Next typography/grouping, real header targets, bounded open-sheet coverage, 1000ms auto-scroll delay and one-line/2750ms speed, cancellation/end stopping/preference, static keyboard-only peek, reduced motion, 140/90ms peek and 220ms open reveal, annotations/wrapping/focus, original search snapshot, Ctrl+Shift+B, Alt+top-row roots, accepted Alt+numpad and address-bar/Ctrl+F6 behavior. Manage drafts, mutation and sync logic are unchanged. No dependencies, permissions, manifest key or SVG changes.

## Verification and artifact

`npm run check` passes: typecheck, lint, **185 tests / 13 files**, production build/version and unchanged extension ID `nfhbegeoeafnpejpjdljhgagefbpafal`. Package/lockfile/source/generated manifest are **0.1.13**; tracked `dist/` is regenerated.

New pure regressions cover viewport-supported retention, shrinking requirements, repeated peaks without accumulation, fractional pixels, upward release and natural-document growth. The committed **`scripts/check-peek-scroll.mjs`** builds a synthetic fixture and drives the complete wheel/pointer sequence. It runs 3 cycles per configuration at 1250×600, 390×700, 1490×950 and reduced motion: **12 cycles without per-cycle reloads**. It checks scrolling during the initial delay and active auto-scroll, complete preview depth, stationary waits, earlier/final traversal, pointer exit, upward wheel release, opening, and search/Escape both from retained space and an open section.

Frame/event assertions verify no viewport oscillation during pointer-only traversal or stationary periods. After pointer exit, preview animation frames/timers drain to zero and measurement callbacks settle. The exact new regression was also run with the original 0.1.12 components read from `aeeb47a`; it **fails on viewport oscillation**, while current components pass. Same-sequence before/after traces show the later traversal range reduced from about 80px to **0px**. The existing search snapshot/selection/modifier checks, bounded open-sheet overlap, keyboard peek and exposed-strip/annotation/zoom-equivalent suites pass.

Rerun in WSL (Chromium must already be installed):

```sh
cd /home/dev/projects/bc-better-bookmarks
npm run check
PLAYWRIGHT_BROWSERS_PATH=/tmp/bb-catalogue-browsers node scripts/check-peek-scroll.mjs
```

Omit the environment override when using Playwright's normal browser installation. The script prints a temporary directory with full frame/event traces and fixture; durable summarized evidence and synthetic captures are in `docs/visual-review/generated/0.1.13-*`. Captures were inspected. **Chromium evidence does not establish native Edge acceptance, wheel/trackpad equivalence or Microsoft sync validation.** Completed functional/cross-device testing was not reopened.

## Files and Edge review

Changed: `src/ui/usePeekFooter.ts`, `peek-footer.ts`, `SectionCard.tsx`, `Catalogue.tsx`; `tests/peek-footer.test.ts`; new `scripts/check-peek-scroll.mjs`; version/manifest files and tracked `dist/`; handoff/design/keyboard/roadmap/README and synthetic evidence. The commit contains the fix and reproducible regression together.

1. Repeat the recording sequence several times without refreshing: final peek → wheel down to footer → traverse earlier/final headers. Try both before and after auto-scroll starts.
2. Hold the pointer still, then move away. No repeated opening/closing or viewport oscillation; browsing must remain responsive.
3. Scroll upward: retained space should disappear. Open a section and enter/exit search; peeks should continue working afterward.
4. Briefly check keyboard/reduced-motion peek, Next summaries, footer links and peeks above an open section. Do not treat temporary viewport-supporting retention as a permanent reserved gap.

## Completed validation

- A: targeted/plain/mixed search, case/whitespace, URL characters, empty operators and clearing passed.
- B: HTTP label/search, absence of tag metadata/UUID side effects, and HTTPS conversion passed. Corrected Favorites count: **36 before creation → 37 after**; metadata counts stayed unchanged.
- C, explicitly including C.6–C.10: bookmarklet confirmation/cancel/save, exact code preservation, non-execution, JS label/search, repeated confirmation, rename/move identity preservation, copy isolation, URL conversions and unsupported-scheme rejection passed. Runtime unsupported-scheme evidence covers mailto, not every scheme.
- Accepted bookmarklet behavior: title is non-clickable; the label says **“Run this bookmarklet through Edge Favorites.”** Preserve this behavior during UI/UX work.
- D: completed baseline CRUD/tag/search/live-update/order evidence accepted and carried forward. A fresh full post-change D rerun was intentionally not requested; do not represent it as newly executed.
- Stage 1 E1–E4 passed: local journal/latest and empty intent, unrelated-entry isolation, persistence, content-free events, observed missing-key no-replay, and missing-identity preflight rejection with native fields unchanged. Remote receipt without local journal authorship also passed.
- Cross-device F1–F8/G1–G3 passed: Favorite-first arrival, native title/move/folder/URL mutations, subsequent tag edits, worker inactivity/wakeup, unchanged records after two reconciliations, separate-folder identity isolation, observed deletion/tombstones and new-UUID recreation. Physical B authored the original; A received. F6 edited A → B. Earlier sequential two-way tag transport also passed.

All evidence above is user-reported real Edge observation, distinct from mocked/local checks. Edge Computer Use cannot access privileged New Tab/extension pages; the user controls those actions. Do not retry or bypass that policy. Future necessary browser checks should use concrete manual batches; do not repeat existing passes.

## Retained fixtures and deferred risks

- Deleted original U: `b9d0d7c5-0c34-4177-b52e-7353b4da9da0`; both tombstones retained.
- Separate V: `6bd273cd-cb24-4bd1-9288-aa0136fca8a6`, separate-only, B82/A65.
- Recreated W: `6822fc12-ad7b-40e3-8c68-f172ab1a2b9a`, recreated-only, B83/A66, in BB Sync 20260930 / Moved Renamed. Title BB Worker Renamed Again 20260930; URL https://example.com/bb-mutation-20260930-edited.
- Known missing historical records are intentionally retained test cases. The earlier metadata-loss cause remains unresolved; successful tests do not prove repair of those records.
- Fresh exact-duplicate ambiguity, mutations before first mapping, natural metadata-first arrival, extension-disabled evidence loss, same-key concurrent writes and production-store identity remain deferred/limited. New Tab prompt/override handling lacks separate explicit evidence. These are not outstanding failures of the completed session or blockers for UI/UX design.
- Exact installed A/B versions and some timings were not supplied. Timestamp differences across PCs are approximate, with clock alignment unverified.

Keep private raw reports outside Git. The existing `docs/manual-results/` ignore rule excludes the local raw journal report; commit only summarized test evidence. No signing material or diagnostic exports belong in the repository. No further functional test batch or cleanup is scheduled.
