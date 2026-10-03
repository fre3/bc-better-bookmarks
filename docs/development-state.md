# Development State

Last updated: 2026-10-03
Current branch: `feature/ui-ux-redesign`. Browser-review build: **0.1.14**.
Validated baseline: `1217369dd10638942d80107d5f33d7f61491d075`, unchanged on `master`, `archive/mvp-validated-0.1.1` and annotated tag `mvp-validated-0.1.1`.

## Current checkpoint and next action

**Next action: native Edge review of final-section hover retention in 0.1.14. Stop here.** No push. Development/tooling remains WSL `/home/dev/projects/bc-better-bookmarks`; supplied media and the Windows clone are untouched. Reload tracked `dist/` at `edge://extensions`, verify **0.1.14**, and open a fresh New Tab. [Load instructions](ui-ux-design.md#build-and-load-in-edge).

Visual work is not accepted. Do not create `feature/bookmark-editing` until user acceptance; it should then start from the accepted commit. Semantic search, editing, drag/drop, thumbnails, folder tags and sync changes remain deferred.

## Recording and focused correction

Found the exact supplied `release 0.1.13 - last-section-before-footer-whitespace.mp4` (11.53 seconds). Visually inspected decoded frames at approximately 3, 7 and 11 seconds, including the final-section white area. Supplied media remains untracked and unchanged; private-bookmark frames are not committed.

The section header's unconditional pointer-leave handler ended the final mouse peek on crossing into its own preview. This happened even though no following header needed pointer access. The 0.1.13 safe footer reservation then correctly supported the viewport, leaving blank space where that preview had disappeared.

`usePeekHoverRetention` now retains an **already active final-section mouse session** from the header's top through the white preview area to the real footer's top boundary. Only header entry activates it. The final displayed section is identified by the absence of a following section in the current projection, so root changes need no special names/IDs. Header → preview → header leaves the same auto-scroll session running with no repeated delay.

Pointer position is checked against current geometry on mouse movement, scroll, resize and observed catalogue/stack/spacer/footer changes. A stationary pointer can therefore retain the preview during wheel scrolling, or end retention when the footer moves underneath it. Footer entry, leaving the combined area/window, losing window focus or hiding the document ends the mouse session. Listeners/observers disconnect on cancellation. There is no extra pointer-catching layer, animation loop, simulated input or scroll call. Earlier headers retain their normal header-only behavior. Preview content stays inert, pointer-transparent and hidden from assistive technology; keyboard-only peek remains independent/static, and headers still open normally.

## Preserved safe temporary-space lifecycle

The 0.1.13 spacer implementation is unchanged. Active/exiting previews retain complete geometry; after a genuine pointer exit, only existing space needed to support the wheel-selected viewport can remain. Upward scrolling releases it progressively; explicit opening/root/search/Escape/Manage transitions clear the old geometry lifecycle. There is no immediate unsafe contraction, continuous scroll forcing, pointer suppression, accumulating reservation or permanent resting gap.

**Intentional remaining behavior:** after genuinely leaving the preview, a viewport-supporting blank area may remain until upward scrolling or explicit navigation/open/search releases it. This is different from the corrected disappearance while still hovering the final preview. Explicit navigation to shorter content may naturally clamp. Native Edge wheel/trackpad behavior remains user verification.

Unchanged: 2.5-line depth, Next summaries, 1000ms auto-scroll delay and one-line/2750ms speed, local preference, reduced motion, 140/90ms peek and 220ms opening, coverage, annotations/wrapping/focus, search snapshot, Ctrl+Shift+B, Alt+top-row shortcuts, accepted Alt+numpad and address-bar/Ctrl+F6 limitations. Manage drafts, mutation and sync architecture are untouched. No dependencies, permissions, manifest key, CSS or SVG changes.

## Verification and artifact

`npm run check` passes: typecheck, lint, **185 tests / 13 files**, production build/version and unchanged extension ID `nfhbegeoeafnpejpjdljhgagefbpafal`. Package/lockfile/source/generated manifest are **0.1.14**; tracked `dist/` is regenerated.

Expanded **`scripts/check-peek-scroll.mjs`** uses browser-delivered pointer and wheel input (no scroll assignments or dispatched mouseenter). Twelve cycles without per-cycle reloads span desktop, narrow, fluid sizing and reduced motion. Checks include continuous header/preview traversal, initial-delay and active-scroll retention, stationary pointer, earlier-header traversal, footer hit targets, dynamic final identity after root switching, cancellation/settled callbacks, safe upward release, opening and search/Escape. Short-page checks cover white flex space through the footer, header-only activation, resize with a stationary pointer and static keyboard-only peek. Frame/event traces assert continuous final peek during surface movement and no viewport oscillation. The new surface-retention assertion **fails against the original 0.1.13 SectionCard**, where the preview closes; current code passes.

```sh
cd /home/dev/projects/bc-better-bookmarks
npm run check
PLAYWRIGHT_BROWSERS_PATH=/tmp/bb-catalogue-browsers node scripts/check-peek-scroll.mjs
```

Omit the browser path override when using Playwright's normal installation. The script prints a temporary fixture/frame-trace directory. Durable synthetic evidence is in `docs/visual-review/generated/0.1.14-*`. **Chromium evidence is not native Edge acceptance or Microsoft sync validation.** Completed functional/cross-device testing was not reopened.

## Files and Edge review

Changed: `src/ui/SectionCard.tsx`, new `usePeekHoverRetention.ts`; expanded `scripts/check-peek-scroll.mjs`; version/manifest and tracked `dist/`; handoff/design/keyboard/roadmap/README and synthetic evidence.

1. Final header → preview → header: keep one continuous peek and auto-scroll session, including the white area above the footer.
2. Wheel down while the pointer remains over the preview; hold it still. Peek stays visible without viewport jitter. Enter the footer: peek ends and both links work.
3. Repeat, traverse earlier headers, leave the catalogue and scroll upward. Safe retained space clears normally; browsing needs no refresh.
4. Change root and repeat with its new last section. Check short/narrow layouts, resize, keyboard-only peek, reduced motion, opening and search/Escape.

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
