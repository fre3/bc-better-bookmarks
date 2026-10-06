# Development State

Last updated: 2026-10-06
Current branch: `feature/bookmark-editing`. Browser-review build: **0.1.19**.
Validated MVP: `1217369dd10638942d80107d5f33d7f61491d075`, unchanged on `master`, `archive/mvp-validated-0.1.1` and annotated `mvp-validated-0.1.1`.
Accepted visual checkpoint: **`ui-validated-0.1.15`** and `feature/ui-ux-redesign` remain at **`0e6a596210b2be2d273eab4a19d2268d9a1407a1`**. No push; supplied media and Windows clone untouched.

## Current checkpoint and next action

**Stop for targeted native Edge review of 0.1.19.** Reload the existing unpacked extension at `edge://extensions`, verify **0.1.19**, then open a fresh dashboard. Use committed `dist/`; development remains WSL `/home/dev/projects/bc-better-bookmarks`. No metadata reset or native bookmark mutation is part of this upgrade.

Both requested references were found and inspected with the image viewer: `0.1.18_edit-button-overlap-in-search-mode.png` and `0.1.18_sticky-headers-in-edit.png`. The additional “searh” filename and other supplied media remain untouched.

## Newly supplied native evidence — 0.1.18

The user completed these scenarios on two devices with 0.1.18 and the same Edge profile:

- Native test folder/subfolder/favorite structure synchronized.
- After explicit folder-binding confirmation on B, direct folder tags appeared; descendant favorites inherited correct tags and source paths, and #tag search found them.
- Tags added on B synchronized to A.
- Parent rename/move on A retained tags and updated inherited source paths on B without another review.
- Archiving on A hid its subtree from browse/search/Edit there; B retained visibility with independent Show archived enabled.
- Unarchiving on B restored the subtree on A with ordinary tags intact.

These scenarios are **passed user-reported native tests**, not inferred from automation. Test-subtree deletion/propagation was **not explicitly confirmed**. The original missing-tag report was resolved by confirming a pending folder binding in Manage: diagnostics already showed received valid metadata, changing from unresolved to local-mapping after confirmation. This was **not a sync-transport defect**. No redesign or repeat of the complete passed suite is requested. Other untested editing/UI cases are not declared accepted.

## Implemented 0.1.19

- Removed the MVP mutation-root control, command, Manage filtering and UI/worker enforcement. Existing `local.state.rootId` stays readable/retained only for envelope compatibility and is ignored. No reset, migration or bookmark changes on startup. Diagnostic export no longer filters its hierarchy through the obsolete preference. Capability restrictions, explicit identity confirmation, missing/inconsistent metadata protection, stale tokens, generation checks, validation, duplicate-submit prevention, destructive confirmations and partial-save recovery remain.
- Compact dashboard notice for received folder tags awaiting confirmation. Unique actionable candidates and ambiguous/competing identities are distinguished. The action opens/focuses the consolidated Manage review; it never attaches automatically. Notice updates after reconciliation. Archive filtering applies to review names. Manage remains mounted while hidden, retaining its drafts through the notice transition; modal background remains inert.
- Section Edit controls use actual inline title/provenance flow and a consistent gap in browse/search. The confirmed overlap was a negative-margin button relying on reserved space present only on browse toggles. Removed that section-specific rule. No nested controls; titles/expansion/native link behavior is preserved.
- Tags use item-local hover or keyboard-visible focus, plus existing search explanations. Pointer clicks retained DOM focus under the former focus-within selector; this caused persistent tags. No indiscriminate blur or expansion-based reveal is used. Structural tag anchors update when compact headings resize.
- Collapsed/peek sections show a small right chevron; fully open sections show down. Its footprint is fixed, it belongs to the existing toggle and is aria-hidden. Search headings have no misleading indicator/action.
- Mouse and Alt+Number root changes share instant scroll-to-top behavior, including All bookmarks. Search query, selection/focus and original pre-search restoration snapshot survive; Escape restores the original root, expansion and scroll. Invalid root shortcuts remain no-ops.
- Sticky navigation in both modes. Spacious at rest; compact padding while scrolled, shorter open-section header, Editing badge/Done retained, longer help hidden. Actual chrome/heading heights determine sticky/focus offsets. Padding removed from the painted chrome is reserved in document flow; normal header targets do not move. Wrapped open headings keep their flow extent. Desktop combined height ~96px browsing / ~108px Editing; narrow/zoomed navigation grows as necessary.
- Wrapped section headings gained enough structural interline clearance for first-line tags (33.6px line boxes); balanced padding preserves single-line optical placement and 85px sheets. Main/nested catalogue leading is unchanged. This was prompted by visual inspection of a narrow zoomed capture, not just computed-color assertions.
- Footer, 1,000ms peek scrolling, final-surface hover retention, 0.1.13 safe cleanup, modal dismissal, archive-checkbox semantics, search algorithms, sync schema/transport and permissions are unchanged.

## Verification

`npm run check`: typecheck, lint, **214 tests / 18 files**, build/version check pass; tracked `dist/` is 0.1.19 with unchanged extension ID `nfhbegeoeafnpejpjdljhgagefbpafal`.

- New `check-navigation-followup.mjs` uses real pointer/keyboard/wheel input in both themes: old restrictive preference ignored, explicit binding review/notice clearing, retained Manage draft, pointer click/leave versus keyboard tag visibility, state chevrons, search heading/Edit intersection measurements, mouse/Alt root reset, selection and original Escape scroll, compact geometry, repeated boundary cycles, narrow/125% CSS zoom, wrapped-heading tag clearance and forced colors.
- Added service regressions for null/missing/restrictive old preferences with independent managed/root/stale/metadata guards retained. Added shared review presentation tests for actionable, ambiguous/competing, unavailable, archive-hidden and already-bound candidates.
- Existing editing, folder/inheritance/archive, archive-checkbox, repeated-Escape and appearance regressions pass. Appearance's obsolete pixel-identity assertion against 0.1.14 was replaced by explicit-Light versus System/light pixel equivalence; this checkpoint intentionally changes heading indicators. Existing live-system/cross-tab/persistence/draft/contrast checks remain.
- Light/dark actual wheel/pointer footer regression passes repeated delay/scroll/leave/reenter/keyboard/reduced-motion/search cycles. During implementation it caught an 8px narrow-layout drift: a compact row-gap change was not reserved, causing a stale bottom scroll target after search restoration. Keeping row gaps unchanged removed that feedback; no scroll forcing or pointer suppression was added.
- Captures and synthetic reports: `docs/visual-review/generated/0.1.19-*`. Rendered desktop, narrow/zoomed, dark/light and forced-colors examples were visually inspected. This is **Chromium evidence**, not new native Edge acceptance. CSS zoom/forced colors emulation does not establish Windows behavior.

## Limits and next review

No new architectural limitation or sync risk requiring the whole passed two-device suite. Folder ambiguity/copy/pre-binding limitations remain conservative. Native updates and tag publication remain non-atomic: precise partial progress, retained input and explicit baseline review still apply. Drafts are memory-only and not guaranteed after closure/reload. Long tag lines may clip; accepted limited favicon-frame overlap remains distinct from title overlap. Narrow/high-zoom sticky controls need more height; fonts are not shrunk or clipped to force the desktop target. Temporary-footer-space removal can still clamp at the new document bottom, but subsequent peeks must settle normally.

1. Edit a favorite/folder outside any former mutation root; confirm Manage has no scope setting. Check normal modal Save/Cancel/Escape and independent restricted-node handling.
2. If a pending binding exists, verify its compact notice opens the consolidated review, distinguishes ambiguity and clears after explicit confirmation. Do not reset tags merely to manufacture this case.
3. Search while Editing: section Edit controls follow long headings with/without provenance, including narrow width/zoom. Titles still navigate; labels still expand.
4. Click folders/sections then move away: tags hide. Tab to their controls: tags show. Inspect first-line tag placement on wrapped/compact labels in both themes.
5. Check right/down state chevrons on short final-section peek versus open; no chevrons on static search headings.
6. Scroll through browse/Edit/search: compact controls stay reachable, sticky headers/tag/focus clearance remain readable. Click roots and use Alt+1/2/3; top resets, query/selection stays, Escape returns to the saved browse scroll.
7. Briefly check final-section peek/wheel/footer stability and repeated modal Escape. No complete two-device rerun is requested without a new concrete sync finding.

Broader Manage cleanup, new create/move/delete UI, bulk operations, drag/drop, semantic search and website thumbnails remain deferred. Stop for Edge review; no push.

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
