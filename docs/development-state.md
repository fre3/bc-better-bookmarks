# Development State

Last updated: 2026-10-03
Current branch: `feature/ui-ux-redesign`. Browser-review build: **0.1.11** (footer boundary implemented; covered-label summary follows in a separate commit).
Validated baseline: `1217369dd10638942d80107d5f33d7f61491d075`, unchanged on `master`, `archive/mvp-validated-0.1.1` and annotated tag `mvp-validated-0.1.1`.

## Current checkpoint and next action

**Next action: user Edge review of 0.1.10 overlap correction and footer. Stop before further refinement or Edit mode.** No push was made. Authoritative checkout/tooling remains **WSL `/home/dev/projects/bc-better-bookmarks`**; no Windows clone changed. Load/reload the tracked `dist/` artifact and verify 0.1.10.

Accepted behavior: **1000ms** preview-scroll delay; temporary All bookmarks search/Escape restoration; **top-number-row Alt+1–9**; Windows Alt+numpad character entry as a documented platform interaction; and the previously documented address-bar focus limitation. No symbol filtering or keyboard suppression added. Search remains **Ctrl+Shift+B** (native assignment still user-controlled). Ctrl+F6 remains the accepted focus-transfer fallback. Ordinary Ctrl+T is unchanged. The accepted delay, matching test expectation, Manage wording and artifact are now committed with the overlap fix (`3aaced5`).

## Implemented corrections

Inspected the three `release 0.1.9 - section overlap -1/-2/-3.png` images, sampled the supplied MP4 at approximately 3/8/13 seconds, and inspected `footer.png`. The footer reference is the black FRE3/GitHub strip. Supplied media are untouched/untracked.

**Overlap cause confirmed:** Career/FRE3's 85px inert copied header grew to **875/960px** in the synthetic reproduction because coverage scanned past open Crypto to Stack's boundary. Coverage now stops at the copied header's natural extent when it reaches open content, completing only an overlapped real header or partially concealed text line. Final representative covers were **114/87px** with expanded nested content, independent of Crypto's full height. The rest of open Crypto stays visible; its state, expanded path and scroll are preserved. Collapsed stacks retain the intact-shadow boundary rule that prevents the earlier exposed strip. Sticky headers are measured by their flow extent.

**Footer:** full-width black surface with regular white 16px system sans labels, 70px minimum height (grows if wrapping), normal gutters, and the unchanged transparent top-edge dither. Exact links are `BC Better Bookmarks by FRE3` → `https://www.fre3.eu/?source=bcbb` and `GitHub` → `https://github.com/fre3`, both `target="_blank" rel="noopener"`, with underline/focus feedback. It is outside the card collection in browse/search, including empty results, and hidden with the catalogue in Manage. Flex layout places it at the viewport bottom on short pages and after content on long ones.

**Final-section boundary (0.1.11):** the permanent 2.5-line reservation is removed. The normal collapsed 85px header is followed directly by the footer on long pages. Short pages retain natural flex space above the viewport-bottom footer. Final peek uses only that existing room, up to 2.5 lines; if fewer than one whole readable line remains after the footer's upward dither, preview is suppressed. Click/keyboard opening remains available. Footer geometry and expanded-content spacing are unchanged by hover; no upward-opening preview or copied footer links.

Typography, annotation visibility/anchoring, accepted annotation-frame overlap, wrapping, focus contours, 140ms/90ms peek and 220ms open animation, delayed-scroll speed (one line/2750ms), pointer passthrough and reduced-motion behavior remain. No bookmark, metadata, mutation or sync architecture changes. Thumbnails, folder tags, Edit-mode redesign and drag/drop remain deferred.

## Verification and artifact

`npm run check` passes: typecheck, lint, **175 tests across 11 files**, production build/version verification and unchanged extension ID `nfhbegeoeafnpejpjdljhgagefbpafal`. Package/lockfile/source and generated manifest versions are **0.1.10**. Tracked `dist/` is regenerated. No new dependencies/permissions, public-key changes or SVG artwork changes.

Five new geometry regressions cover tall open sheets, partial open headers, short open sheets, wrapped headers and the old collapsed-stack strip. The delay test matches 1000ms. Focused rendered checks cover Career/FRE3 and more distant peeks above short/tall open Crypto, transition frames, active scrolling, keyboard peek, rapid traversal, preserved expanded state/document scroll, and narrow widths. The previous exposed-strip/annotation suite passes at 320/390px and 80/125/150/200% zoom-equivalent layouts. Accepted search/root restoration checks remain passing.

Footer rendered checks cover 20 combinations of short/long/empty/search-empty catalogues and desktop/narrow/zoom-equivalent sizes: exact labels/URLs/new-tab attributes, white focus outline/underline, full-width surfaces, responsive height, viewport/document-bottom placement, no horizontal overflow, footer link hit-testing during final peek, and final bookmark clearance. Representative overlap/footer captures were visually inspected. Reports/captures are under `docs/visual-review/generated/0.1.10-*`; all use synthetic bookmarks. These checks do not establish native Edge visual acceptance or native Edge zoom behavior. No completed functional or cross-device manual session was reopened.

## Files and Edge review

Changed: `src/ui/usePeekCoverage.ts`, new `peek-coverage.ts`, `peek-scroll.ts`, `App.tsx`, `Catalogue.tsx`, new `CatalogueFooter.tsx`, `style.css`; new `tests/peek-coverage.test.ts` and updated `tests/peek-scroll.test.ts`; package/lockfile/manifests and regenerated `dist/`; README, design/keyboard/roadmap/handoff docs and generated captures/reports.

1. Open Crypto (including a nested folder), then hover Career/FRE3 and a more distant header. Only the normal preview/header footprint overlaps; Crypto remains visible below it, without loss of state or scroll.
2. Let scrolling start after 1000ms; leave/re-enter, move down across headers, reverse transitions and use keyboard-only peek. Check the old thin-strip case and narrower/zoomed layouts.
3. Review the black footer on short, long and empty/search-empty pages. It stays in flow, reaches both edges and never covers the final bookmarks.
4. Peek the final section, including while another card is open. Footer links remain visible and reachable; no page movement or broken dither boundary.
5. Tab/hover both footer links; confirm exact destinations and new tabs. Recheck top-row Alt+1–9 and Ctrl+Shift+B as a brief regression, retaining the accepted numpad/address-bar behavior.

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
