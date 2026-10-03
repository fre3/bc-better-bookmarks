# Development State

Last updated: 2026-10-03
Current branch: `feature/ui-ux-redesign`. Browser-review build: **0.1.12** (footer geometry implemented; summary presentation follows).
Validated baseline: `1217369dd10638942d80107d5f33d7f61491d075`, unchanged on `master`, `archive/mvp-validated-0.1.1` and annotated tag `mvp-validated-0.1.1`.

## Current checkpoint and next action

**Next action: user Edge review of 0.1.11's compact footer boundary and covered-section summary. Stop here.** No push was made. Authoritative checkout/tooling remains **WSL `/home/dev/projects/bc-better-bookmarks`**; no Windows clone changed. Reload the tracked `dist/` at `edge://extensions`, verify **0.1.11**, and open a fresh New Tab. Exact path/load instructions are in [ui-ux-design.md](ui-ux-design.md#build-and-load-in-edge).

After the user accepts this visual checkpoint, close visual work and start **`feature/bookmark-editing` from that accepted commit**. That branch has **not** been created; visual acceptance has **not** been declared. Editing, drag/drop, website thumbnails, folder-tag persistence and sync changes remain outside this checkpoint. Optional local multilingual semantic search is recorded as deferred in the roadmap, not implemented.

Accepted behavior remains: **1000ms** preview-scroll delay; temporary All bookmarks search/Escape restoration; **top-number-row Alt+1–9**; Windows Alt+numpad character entry as a documented platform interaction; and the previously documented address-bar focus limitation. No symbol suppression added. Dashboard search remains **Ctrl+Shift+B**, with native user reassignment respected. Ctrl+F6 remains the accepted focus-transfer fallback; ordinary Ctrl+T is unchanged.

## Revised footer decision — 0.1.12

The user explicitly superseded the stationary-footer/suppressed-preview rule. All normal previews now retain 2.5 lines. A temporary spacer after the unchanged section stack makes room for the furthest active or exiting preview/cover; natural short-page flex space is consumed first. Measurement uses the stable stack bottom, never the moving footer. The final preview has no copied header/lip: the real footer supplies its sole lower dither edge. Exit measurements remove the temporary space with the existing reveal animation. No automatic scroll is introduced.

Scroll anchoring is disabled within the catalogue so moving the footer does not reposition real headers. If a user manually scrolls into temporary space, removing it may clamp to the new document bottom. Resulting geometry-only pointer entries cannot restart peek until actual pointer movement; no delay or hover suppression during ordinary traversal. Resting and expanded footer spacing are unchanged.

Inspected all three supplied `release 0.1.11 - Peek summaries.png`, `release 0.1.11 - Peek Footer 1.png`, `release 0.1.11 - Peek Footer 2.png`. No reference was missing. Initial check passes 182 tests / 13 files plus typecheck, lint and 0.1.12 build. Rendered desktop/narrow/final/preceding previews retain full depth, stable header positions, minimal non-accumulating extension and cleanup, including manual bottom clamping. Final evidence/handoff follows the summary presentation commit.

## Implemented corrections

Visually inspected all five supplied references: `release 0.1.10 - footer - open.png`, `release 0.1.10 - footer - collapsed.png`, `release 0.1.10 - peek-1.png`, `release 0.1.10 - peek-2.png`, and `release 0.1.10 - peek-3.png`. None were missing. Supplied images/videos remain untouched and untracked.

**Previous 0.1.11 footer boundary (superseded by 0.1.12):** removed the permanent 2.5-line preview reservation. On long pages the final collapsed 85px header is followed immediately by the footer's upward dither. Short pages retain only their natural flex space above the viewport-bottom footer. A final-section preview uses that existing room, up to 2.5 lines. If fewer than one complete readable line remains after the footer's upward shadow, preview is suppressed; click/keyboard opening still works. No upward preview, copied footer links, hover-induced reflow, scrolling or footer movement. Expanded-content spacing and all footer link behavior are unchanged. This is the deliberate final-section boundary behavior, not a missing preview bug.

**Covered-section summary:** the existing bounded opaque lip now shows every section label intersected by the preview plus cover, including partial labels. Fully readable labels below it are excluded. Membership comes from rendered heading bounds, recomputed with animated geometry, resizing, fonts and scrolling. Catalogue order is preserved. At the representative desktop size MB30 shows `Baustoffe | FRE3 | Career · Favorites bar`; Baustoffe shows `FRE3 | Career | Crypto · Favorites bar`. Wider/larger type can cover four labels; the count is not hard-coded.

Names remain bold 17.6px, colored explicitly **#222**, **#555**, then **#737373** across the entire sequence. Regular provenance appears once per consecutive root-ID group, including distinct groups with identical root display names. A measured single-row fit keeps the existing header area/gutters, truncates long names and uses an accurate **+N** for an omitted trailing suffix. Extremely long root provenance is compacted too; an exceptionally tiny available width falls back to the section count. Original titles and real accessible header names are unchanged.

The summary is absolute, inert, hidden from assistive technology and has no controls or pointer interception. It is independent of the scrolling prose. A hidden natural-header measure retains the pre-existing lip geometry, so summary text cannot enlarge coverage. The 0.1.10 open-sheet bound and no-strip transition behavior remain. Real header targets stay in place: the summary is an explanation, not relocated navigation.

Typography, annotation visibility/anchoring and accepted frame overlap, wrapping, focus contours, 140ms/90ms peek and 220ms open reveal, one-line/2750ms scrolling, preference/cancellation/static keyboard/reduced-motion behavior, state/scroll restoration, Manage drafts and mutation guards are preserved. No core/search, bookmark, metadata, command, persistence or synchronization implementation changed.

## Verification and artifact

`npm run check` passes: typecheck, lint, **181 tests across 13 files**, production build/version verification and unchanged extension ID `nfhbegeoeafnpejpjdljhgagefbpafal`. Package/lockfile/source/generated manifest versions are **0.1.11**. Tracked `dist/` is regenerated. No new dependencies, permissions, public-key or SVG artwork changes.

New regressions cover meaningful-room suppression/constraining and summary intersection, order, root identity grouping, width fitting and omitted counts. Focused rendered Chromium checks passed:

- Six final-footer geometries: zero room, insufficient 67px, constrained 110px, full peek in natural spare space, and narrow sizes. Hover left document/footer geometry unchanged; footer links stayed hittable. Opening retained the measured 53px last-link clearance on content-filled pages.
- 24 summary cases across six viewport/name/root combinations (320–1920px): exact examples, three/four covered labels, partial label bounds, duplicate root names with different IDs, global colors, long-name truncation and accurate omitted counts. Summary stayed stationary while prose scrolled; no overflow or added focus stops.
- Fifteen adjacent/distant peek cases above short/tall open sections, including narrow/wrapped headers, transition frames, auto-scroll, pointer traversal and preserved open/expanded state and document scroll. Coverage stayed bounded by local header/text geometry.
- The previous exposed-strip/annotation suite at 320/390px and 80/125/150/200% zoom-equivalent layouts; opaque continuous coverage and accepted annotation/frame stacking/no reflow remained passing.
- Mid-transition click, keyboard-only and reduced-motion peek, live resize, root/search cleanup, empty-search footer and original search scope/Escape snapshot regression checks passed.

Synthetic captures and measurements are in `docs/visual-review/generated/0.1.11-*`; representative collapsed/open footer, both requested summaries, cross-root and narrow captures were visually inspected. **Automated Chromium evidence does not establish native Edge visual acceptance or native zoom/shortcut behavior.** Completed functional/cross-device manual testing was not reopened.

## Files and Edge review

Footer commit: `6aaec42` (`Remove footer preview reservation and bound final-section peek`). The second logical commit contains the covered-section summary and final review handoff.

Changed implementation: `Catalogue.tsx`, `SectionCard.tsx`, `style.css`, `usePeekCoverage.ts`; new `usePeekRoom.ts`, `PeekSummary.tsx`, `peek-summary.ts`; new `tests/peek-room.test.ts`, `tests/peek-summary.test.ts`. Also package/lockfile/manifests, regenerated `dist/`, README, design/keyboard/roadmap/handoff docs and synthetic review evidence. No supplied media is staged.

1. Collapse the last section: normal header directly above the footer on a long page. Hover it: no footer movement/obstruction; if there is insufficient natural room, click/Enter still opens it. Check retained open-content spacing.
2. Hover MB30 and Baustoffe: verify the ordered summaries against the real covered labels. Move down through underlying headers; no interception or stale summary.
3. Try narrow/zoomed widths and a root boundary: check restrained colors, grouped provenance, truncation and accurate +N; fully readable labels below the lip should not be repeated.
4. Open Crypto with a nested folder, then peek earlier sections. Confirm bounded coverage, no thin exposed strips, no lost state/scroll, and stationary summary after the 1000ms delay.
5. Briefly check keyboard-only/reduced-motion peek, footer links/focus, Ctrl+Shift+B, Alt+top-row root changes and Escape restoration. Accepted numpad and address-bar/Ctrl+F6 behavior remains unchanged.

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
