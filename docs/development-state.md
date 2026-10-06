# Development State

Last updated: 2026-10-06
Current branch: `feature/bookmark-editing`. Browser-review build: **0.1.18**.
Validated MVP: `1217369dd10638942d80107d5f33d7f61491d075`, unchanged on `master`, `archive/mvp-validated-0.1.1` and annotated `mvp-validated-0.1.1`.
Accepted visual checkpoint: **`ui-validated-0.1.15`** and `feature/ui-ux-redesign` remain at **`0e6a596210b2be2d273eab4a19d2268d9a1407a1`**. No push; supplied media and Windows clone untouched.

## Current checkpoint and next action

**Stop for native Edge review of 0.1.18.** At `edge://extensions`, reload the existing unpacked extension, verify **0.1.18**, and open a fresh dashboard. Use tracked `dist/`; development remains WSL `/home/dev/projects/bc-better-bookmarks`. **No metadata reset is needed or performed for this UI upgrade.**

The user reports **tag changes and inheritance work well in 0.1.17**. This specific acceptance does not establish comprehensive editing acceptance or fresh two-device synchronization. The two screenshot reports were treated as one dismissal bug and one consolidated editing/tag/archive presentation update. All nine requested `0.1.17_*.png` references (editing; folder-tags_1/2/3; section-tags_1; archived_normal-mode, normal-mode_hover, edit-mode and edit_modal) were found and visually inspected. None were missing.

## Implemented follow-up

- **Confirmed repeated-Escape cause:** real Chromium keyboard input eventually produced a non-cancelable native dialog `cancel`, followed by `close`. In the isolated reproduction this happened on the third Escape; the user observed the second. The native dialog closed while React still retained its draft/modal state and root scroll lock. It looked discarded and blocked reopening, though the input remained in the hidden DOM. Relying only on cancel.preventDefault was insufficient.
- Escape is now handled in the dialog's keydown capture phase, preventing the native close request and propagation. Unchanged closes; dirty opens confirmation; Escape there means Continue editing and restores the title focus. Only explicit Discard changes discards dirty input. Key repeats do not dismiss another layer. Pending focus callbacks are canceled on unmount. Native modal/background isolation and fallback cancel handling remain. This applies to both editors and checkbox-only changes.
- **Only explicit Edit buttons open editors.** Favorites keep ordinary HTTP(S) links and keyboard/modifier/middle activation even in Edit mode. Existing non-navigating bookmarklet/unsupported-link safety remains. Shared small baseline-aligned buttons sit beside Favorite, folder and real section labels; restrictions/synthetic sections are unchanged. Edit is not nested inside a link/toggle. Inline button-role expansion targets preserve Enter/Space and the full section header hit area while allowing text to fragment naturally. Title-ending space plus a zero-advance sibling Edit control prevents detached controls without adding copied title characters. Preview copies stay inert and contain no functional Edit actions. Edit-only dotted underlines and permanent Archived labels are removed, including legacy Manage labels.
- **Mode indication:** Editing badge, accent Done, exact help text when width permits, and a thin viewport-top line. The existing navigation is sticky only in Edit mode, with one Done control; measured navigation height offsets sticky section headers and scroll targets. Its flow height is unchanged on mode entry. Narrow layouts omit the help, retain words/controls, and wrap navigation. Opaque background is applied only when stuck and spans the gutters; resting first-sheet dither is not masked. Accent is `#855216` light / `#e9ba7a` dark, or system Highlight in forced colors. No card-wide tint/border and no duplicate controls.
- **Tag positioning:** folder tags were measured from the flow but positioned against their own relative folder wrapper, doubling offsets. Measurement now uses the actual positioning parent and first title-text fragment, excluding counts/Edit/provenance. Section tags use the first section-name fragment instead of header bottom positioning. Zoom scale is accounted for. Resize/font/content updates retain the existing observer lifecycle. Leading/header height, tag typography, effective-tag deduplication, bold inherited tags, hover/focus/search visibility and no-reflow behavior remain. Accepted limited favicon-frame overlap remains; title overlap is not accepted.
- **Archive checkboxes:** Archive this favorite / Archive this folder and its contents represents direct `archived` only. The ordinary Tags input contains other direct tags; typing archived is converted at blur or Save, with no per-keystroke rewriting/caret changes. Case-insensitive normalization/deduplication is unchanged. Pointer intent is retained if tag blur checks the box during a click. Checkbox changes participate in dirty protection, original-token conflicts and partial-save recovery. Save reconstructs the existing direct tags array; no stored boolean/schema change. Inherited-only and direct-plus-inherited status stays read-only with source paths and the explanation that remaining ancestors still apply.
- Catalogue archive status is now shown only through #archived under existing tag reveal/search rules. Show archived remains the sole device-local override, never Edit mode. Save may remove a result; success/focus fallback and original query/scope/Escape state remain. No permissions, synchronization, identity/reset or core mutation code changed.

## Verification

`npm run check` passes typecheck, lint, **208 tests / 17 files**, build/version check and unchanged extension ID **`nfhbegeoeafnpejpjdljhgagefbpafal`**. Package/lock/public manifest/tracked `dist/` are **0.1.18**.

- `scripts/check-dismissal.mjs`: committed real-keyboard regression, 24 Escape pairs per theme across six Favorite/folder cycles without reload, Save, explicit discard, unchanged close, reopening, mode exit/reentry and background search recovery.
- `scripts/check-archive-editor.mjs`: direct/inherited/both, multiple sources, checkbox-only repeated Escape/discard, typed archived conversion at blur, existing-value initialization, direct-only persistence, no permanent catalogue label, filtered-result removal/focus; light/dark captures.
- `scripts/check-editing-refinements.mjs`: actual title mouse/keyboard/modifier navigation, explicit Edit buttons, stable navigation height, sticky Done/header clearance, first-text-fragment section/folder/nested wrapped tag anchors, keyboard expansion, no detached Favorite Edit controls, 390px layout, 125% CSS zoom and forced-colors renders. CSS zoom/emulation is not native Edge zoom acceptance.
- Existing `check-editing.mjs`, `check-folders.mjs`, `check-appearance.mjs` pass: validation, duplicate/failed/success saves, scope/metadata guards, conflicts, partial recovery, modal focus/background isolation, inheritance/archive/Manage/cross-tab preferences, search and original Escape restoration. The reset regression remains isolated to synthetic stores; no real-profile metadata was touched.
- Existing `check-peek-scroll.mjs` passes light and dark actual pointer/wheel repeated cycles, including final-surface retention, safe-space/callback cleanup, narrow views and reduced motion. No footer lifecycle algorithm changed.
- Representative desktop/narrow/zoom/forced-colors tags, mode controls and archive modal captures were inspected with the image viewer. Synthetic reports and captures: `docs/visual-review/generated/0.1.18-*`. This is Chromium evidence, **not native Edge or fresh two-device sync verification**.

## Limits and preserved architecture

Mutation scope remains separate from browse scope. Direct tags alone reach existing worker commands; inherited tags are never persisted. Folder identity confirmation, copy/ambiguity limitations, generation handling and the deliberate setup procedure remain as documented in [metadata setup](metadata-setup.md). Do not reset live test metadata merely to review 0.1.18.

Native changes and tag publication are still non-atomic. Failures list confirmed native fields, keep unsaved input and require explicit current-value review before retry; missing/ambiguous/deleted metadata guards are unchanged. Recovery keeps an externally moved item's reviewed parent. Drafts are memory-only, not promised after tab/browser closure or reload. Long tag lines can clip at the viewport; sources remain readable in the editor. Sticky editing navigation takes viewport space when zoomed/narrow; native Edge review should assess it alongside sticky headers.

## Edge review

1. Favorite and folder: change a field or checkbox → Escape → Escape. Verify the intact editor, Save, explicit Discard, then open another item. Repeat without refresh and leave/reenter Edit mode.
2. Verify only Edit controls open editors; title click/Enter/Ctrl-click/middle-click still navigate safely, folder/header Enter/Space expand, footer links behave normally and peek copies remain inert.
3. Check Editing/Done/help/top line, sticky availability, header targets, keyboard outlines and context at desktop, narrow width and browser zoom; both themes and Windows contrast mode if used.
4. Hover/focus section, folder, nested/wrapped folder and Favorite titles. Tags start beneath their first text fragment; no layout movement, centering or title overlap. Check Edit baseline/gaps and wrapping.
5. Enable Show archived. No permanent Archived labels; #archived appears through normal tags/search. Check direct/inherited/both checkbox states, typed ARCHIVED conversion, multiple-source explanations, Cancel/Escape and result disappearance after Save.
6. Confirm existing search scope/Escape restoration, Ctrl+Shift+B modal protection, Manage drafts, final-section hover/wheel, preview scrolling and safe footer cleanup.

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
