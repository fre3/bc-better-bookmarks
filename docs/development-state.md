# Development State

Last updated: 2026-10-03
Current branch: `feature/ui-ux-redesign`. Browser-review build: **0.1.12**.
Validated baseline: `1217369dd10638942d80107d5f33d7f61491d075`, unchanged on `master`, `archive/mvp-validated-0.1.1` and annotated tag `mvp-validated-0.1.1`.

## Current checkpoint and next action

**Next action: user Edge review of 0.1.12's complete footer-adjacent peeks and clarified Next summaries. Stop here.** No push was made. Authoritative development/tooling remains **WSL `/home/dev/projects/bc-better-bookmarks`**; no Windows clone changed. Reload the tracked `dist/` at `edge://extensions`, verify **0.1.12**, and open a fresh New Tab. Exact load path/instructions: [ui-ux-design.md](ui-ux-design.md#build-and-load-in-edge).

The visual phase is **not accepted** yet. Only after user acceptance, close visual work and start `feature/bookmark-editing` from the accepted commit. That branch has not been created. Semantic search, editing, drag/drop, website thumbnails, folder-tag persistence and sync changes remain deferred/outside this checkpoint.

Accepted behavior remains: **1000ms** preview-scroll delay, one line/2750ms speed, local preference/cancellation/end stopping, static keyboard-only peek and reduced motion; 140ms/90ms peek and 220ms open reveal; temporary All bookmarks search with the original Escape snapshot; **top-number-row Alt+1–9**; accepted Windows Alt+numpad character entry without suppression. Dashboard command remains **Ctrl+Shift+B**, with native reassignment respected. The accepted address-bar focus limitation and Ctrl+F6 fallback remain; ordinary Ctrl+T is unchanged.

## Inspected references and implemented decisions

Visually inspected all three supplied files: `release 0.1.11 - Peek summaries.png`, `release 0.1.11 - Peek Footer 1.png`, `release 0.1.11 - Peek Footer 2.png`. None were missing. The cramped bars and footer-clipped copied header are visible in those references. Supplied media remains untouched/untracked.

**Footer movement explicitly supersedes the 0.1.11 suppression rule.** Resting layout still has no permanent preview reservation; the final collapsed header remains 85px. During peek, a temporary flow spacer after the section stack reserves only the furthest active/exiting overlay extent beyond the stable stack bottom. Existing natural short-page flex space is consumed first. The moving footer is never the measurement baseline, preventing feedback or accumulation. Actual section/header positions stay unchanged. Full normal 2.5-line previews are no longer shortened or suppressed near the footer. The footer/links stay below the complete preview and bounded summary where present.

The final section has **no empty copied successor row or shadow**. Its preview meets the real footer's dither when extra room is required, producing one lower boundary. Exit geometry contracts the temporary space with the existing animation; switching uses the maximum of entering/exiting footprints, not a sum. Opening, root/search changes and unmounting clear it. Auto-scroll moves only prose, not the summary or reserved geometry. No automatic scroll-to-preview/footer was added. Resting and fully opened footer spacing, exact labels/URLs/new-tab attributes and keyboard styles are unchanged.

**Scroll behavior:** catalogue scroll anchoring is disabled so footer movement does not shift the hovered header. If the user manually scrolls into temporary space, contraction can unavoidably clamp scroll to the new document bottom. Geometry-only pointer entries following that clamp cannot restart a preview until physical pointer movement. Ordinary downward traversal remains available; no hover delay or keyboard suppression is added. Native Edge scroll anchoring/clamping still requires user review.

**Summary:** every nonempty row begins with regular **Next:** in #666 and a .4em gap. Names remain bold 17.6px, explicitly colored **#111**, **#666**, then **#767676** globally across roots. Provenance is regular #666. Within a stable root-ID group, #999 bars have .5em spacing on each side; between groups there is a 1.25em gap without a bar. Each group retains its own provenance exactly once, even when root display names match. The requested gutter, vertical placement and bounded header area are unchanged.

Actual covered-label geometry still controls membership: ordered, including partially concealed labels, excluding fully readable ones below the cover. Measured fitting includes prefix and gap widths; it truncates names and uses an accurate +N for an omitted trailing suffix. The first name remains identifiable in tested 320px layouts. Long provenance may compact with its own group. No tooltip dependency, controls, tab stops or pointer interception. Duplicate presentation is inert/aria-hidden; real header names remain intact. Empty summaries are omitted. Summaries stay stationary during prose scrolling.

All catalogue typography, annotations/accepted favicon-frame overlap, wrapping, underlines/focus, open-sheet coverage bounds and exposed-strip correction remain. No command, core search, sync, metadata, browser permissions or Manage/mutation logic changed.

## Verification and artifact

`npm run check` passes: typecheck, lint, **183 tests across 13 files**, production build/version verification and unchanged extension ID `nfhbegeoeafnpejpjdljhgagefbpafal`. Package/lockfile/source/generated manifest versions are **0.1.12**. Tracked `dist/` is regenerated. No new dependencies, permissions, key or SVG changes.

Focused rendered Chromium checks passed:

- Final and two preceding peeks at four viewport sizes (320–1920px), preserving full depth, stable header/scroll coordinates, stationary auto-scroll geometry, bounded temporary space and complete cleanup. At 1250px the final preview adds exactly 140px; no empty copied row or duplicate edge.
- Rapid bottom-header switching, click/open cleanup, and manual scrolling into added space with a stationary pointer: no reopening/reset loop. Scroll clamp is distinguished from unsolicited scrolling.
- Six additional footer transition/natural-space/reduced-motion cases pass with pre-paint observer measurements: the footer stays below the changing preview on entry/exit, short-page flex room is consumed first, resizing clears correctly, fully open bookmark clearance remains at least 53px, and exact link attributes/focus styles are retained.
- 24 summary cases across six viewport/name/root combinations: Next prefix, colors, actual gap widths, membership, three/four labels, identical root names with distinct IDs, long-name truncation and accurate +N; no horizontal overflow or new focusable nodes.
- Previous bounded open-sheet overlap checks (15 adjacent/distant/short/tall/narrow cases), keyboard-only peek and state/scroll preservation. The exposed-strip/annotation suite passes at 320/390px and 80/125/150/200% zoom-equivalent layouts.
- Keyboard/reduced-motion previews, mid-transition clicking, live resize, root/search summary and spacer cleanup, empty-result footer, long-card switch header positioning, temporary global scope, original Escape snapshot, query/selection and modifier exclusions pass.

Review captures/measurements are under `docs/visual-review/generated/0.1.12-*`. Representative final/preceding previews, desktop/cross-root/narrow summaries were visually inspected. **Chromium synthetic evidence is not native Edge visual acceptance or native zoom/keyboard verification.** No completed functional/cross-device manual session was reopened.

## Files and Edge review

Footer geometry commit: `52730bc` (`Make temporary room for complete footer-adjacent peeks`). The separate summary commit contains presentation/fitting tests, regenerated artifact and final handoff.

Changed UI: `Catalogue.tsx`, `SectionCard.tsx`, `style.css`, `usePeekCoverage.ts`, `PeekSummary.tsx`, `peek-summary.ts`; new `usePeekFooter.ts` / `peek-footer.ts` replace `usePeekRoom.ts`. Tests replace the obsolete suppression regression with spacer geometry checks and extend summary fitting/grouping coverage. Also package/lockfile/manifests, tracked `dist/`, README/design/keyboard/roadmap/handoff docs and synthetic captures/reports. Supplied media is not staged.

1. Check the compact resting footer and unchanged fully open spacing. Hover the final and preceding sections: complete previews, footer below them, no cramped row or duplicate final edge.
2. At document bottom, enter/leave/switch headers rapidly. Real targets should stay put; temporary space should disappear. Manually scroll into added space and verify predictable clamping without a hover loop.
3. Inspect Next prefix, spaced bars, color progression, cross-root gaps/provenance and narrow/zoomed truncation/+N. Confirm membership against the concealed labels.
4. Open Crypto with a nested folder and peek earlier sections: bounded cover, no exposed strips, preserved state/scroll. Wait for auto-scroll: summary stays fixed.
5. Briefly check static keyboard/reduced-motion peek, footer links/focus, Ctrl+Shift+B, Alt+top-row roots and Escape restoration. Accepted numpad/address-bar behavior remains unchanged.

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
