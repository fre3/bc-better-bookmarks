# Development State

Last updated: 2026-10-06
Current branch: `feature/bookmark-editing`. Browser-review build: **0.1.21**.
Validated MVP: `1217369dd10638942d80107d5f33d7f61491d075`, unchanged on `master`, `archive/mvp-validated-0.1.1` and annotated `mvp-validated-0.1.1`.
Accepted visual checkpoint: **`ui-validated-0.1.15`** and `feature/ui-ux-redesign` remain at **`0e6a596210b2be2d273eab4a19d2268d9a1407a1`**. No push; supplied media and Windows clone untouched.

## Current checkpoint and next action

**Stop for native Edge review of 0.1.21 using disposable items.** The user confirms all requested native 0.1.20 tests and updates passed, accepting the proactive binding review, stable sticky navigation and gutter alignment. New creation/moving behavior has automated evidence only; no new native or cross-device success is claimed.

Use committed `dist/` from this checkpoint. In `edge://extensions`, reload the existing unpacked extension, verify **0.1.21**, and open a fresh dashboard. Windows testing consumes the artifact; build tooling remains in WSL. No reset, permission change or automatic native bookmark mutation occurs on upgrade.

## Implemented creation and moving

- Edit-mode navigation **Add** opens New favorite/New folder. Real folder/section **More** offers creation inside it and Move; synthetic loose-item sections offer Add to their actual root. Ordinary browsing has no new controls. All bookmarks requires an explicit destination; a scoped actual root defaults to that root.
- Native modals reuse existing field validation, direct-tag/archive normalization, bookmarklet confirmation, dirty Escape/discard behavior and worker commands. Writable destinations display full paths and local IDs to disambiguate equal names. Inherited tags/archive effects are read-only. Destination lists respect Show archived and explain where to change it. Changed/unavailable destinations require review, never silent redirection.
- Creation uses a durable local request receipt before the native operation. Native success followed by metadata failure reports the created ID/location and retains locked submitted input for **Retry completion**. Retry completes the same item/UUID; uncertain native outcomes, damaged receipts, external changes and conflicts block duplicate creation. Cancel does not delete an already-created item. Manage's existing create forms now also retain request IDs.
- Explicit six-dot handles start pointer moving after a small deliberate movement; titles still navigate/expand and Edit still edits. Favorite, nested folder and real section handles support inside/before/after targets and actual root navigation targets. Cues distinguish insertion, inside and invalid intent without reflow. Wrapped-line rectangles are combined so cues do not split a title ending from its favicon.
- Shared `move` validates real native IDs, full sibling order including hidden entries, source/destination tokens, capability, identity, generation and metadata health. It rejects roots/managed sources, cycles, no-ops, stale/deleted targets and unresolved metadata. It rereads native geometry before the single native move. Direct records/UUIDs remain; reconciliation updates paths, inherited tags, archive/search visibility, counts and sections.
- **More → Move…** gives keyboard destination and end/before/after placement. Search results use this dialog only; no positional handles in filtered results. This limitation is explained in the menu. Source and destination changes block submission until current state is reviewed by reopening.
- Dragging pauses normal hover peeks and preview auto-scroll. Valid folder/section hover for 650ms opens a temporary destination; edge scrolling is bounded. Escape, pointer cancellation, outside drop, hidden document and window blur cancel/clean up. Temporary expansion returns to the saved browse state. Native/external/cross-tab/copy drops are not supported and cannot navigate/mutate through the dashboard.
- Success stays in Edit mode and preserves scope/query/pre-search restoration. Creation reveals/focuses a matching visible item when possible; otherwise success announces its location. Moving may remove the source from the current view; focus falls back visibly without forcing scope or Show archived. Modals protect input from background shortcuts and binding review uses the existing conservative workflow.

## Verification

`npm run check`: typecheck/lint, **222 tests / 18 files**, build/version/extension-ID checks passed. Tracked artifact is 0.1.21; ID remains `nfhbegeoeafnpejpjdljhgagefbpafal`.

- Service regressions cover duplicate-free creation completion after repository/worker reconstruction, corrupt and uncertain receipts, changed destinations/created items, full hidden-sibling insertion order, source/destination staleness, no-op/cycle/root/managed rejection, subtree UUID/direct-tag preservation, inherited archive recomputation and unresolved identity blocks.
- `node scripts/check-create-move.mjs`: both themes, root/nested creation, explicit/default/contextual destination, inherited/direct tags, partial metadata retry with exactly one native item, duplicate submission, dirty Escape pair and focus, changed destination/draft preservation, keyboard Move/search and real pointer inside/reorder/cancel operations.
- `node scripts/check-drag-lifecycle.mjs`: both themes, actual pointer-driven section/root and nested moves, deliberate destination expansion/reset, no normal peeks, bounded edge scroll, stable cancellation frame samples, wrapped/narrow title targets and no horizontal overflow.
- Existing `check-navigation-followup`, `check-dismissal`, `check-editing`, `check-binding-review`, `check-folders`, `check-archive-editor`, `check-appearance` and light/dark `check-peek-scroll` suites pass. These include actual wheel/pointer footer cycles, search/Escape restoration, sticky boundary frames, repeated modal dismissal, preference/draft preservation, narrow layouts, zoom and forced colors.
- Light/dark/narrow captures were visually inspected. Committed synthetic screenshots/reports and commands are in [0.1.21 evidence](visual-review/generated/0.1.21-review.md). Browser fixtures use the real UI/service with isolated browser API/storage doubles; they do **not** prove native Edge moving, installed-extension operation or Microsoft sync. Attempted isolated Chromium extension loading was blocked (`ERR_BLOCKED_BY_CLIENT`); no live profile was touched.

Implementation commits: `72714c7` (creation receipts), `cd01cb2` (shared safe native moving), `3192c8e` (creation/Move UI and pointer interaction). Final evidence/documentation are committed separately. The [review evidence](visual-review/generated/0.1.21-review.md) includes the changed-file inventory.

## Limits and recovery

Native Favorites and synchronized metadata are separate stores, not atomic. A native-call race with external actions cannot be eliminated by API tokens; last-read validation rejects detected changes. A completed move followed by refresh failure explicitly says MOVED and requires inspecting current state before another attempt. Creation can similarly succeed natively before metadata completion; never repeat it as a new form without checking the reported item.

Local `creation:<requestId>` receipts contain submitted bookmark data and are deliberately retained (no silent pruning). A generation mismatch prevents old receipts publishing after a deliberate setup reset; unrelated preferences are untouched. The modal draft is memory-only; there is no new across-reload draft/receipt recovery browser. After an uncertain outcome or closed/reloaded partial form, inspect the known item in Edge/Manage before creating again. A first attempted submission locks its submitted input for replay, including when a preflight failure prevents creation; cancel/reopen to change that request after reading the error. Receipt/storage capacity failures block conservatively.

Pointer capture is used instead of native HTML drag: rendered testing exposed browser-owned native drag edge scrolling continuing after cancellation. Explicit pointer capture gives this dashboard one cancellable scrolling lifecycle. New drag gestures/edge behavior still require native Edge review. Search moving intentionally uses the keyboard-accessible dialog. Long labels can wrap the compact More/handle group in Edit mode. Accepted long-tag clipping/favicon-frame overlap and safe one-time footer clamping remain; repeated jitter is not accepted.

## Targeted single-device Edge review

1. Reload 0.1.21; use disposable items. Enter Edit: Add in All requires a destination; scoped-root Add defaults correctly. Create a section folder, nested folder and favorite with direct tags. Check full paths, inherited tags, archive checkbox, validation and Cancel/repeated Escape. Check normal titles/links still navigate/expand.
2. Create within a tagged/archived test parent (Show archived as needed). Confirm direct versus inherited tags, visibility and current query/root preservation. Create a nonmatching search item: success reports its location without changing the query. Do not induce live storage corruption to test recovery; if an actual partial failure occurs, use Retry completion and check that there is only one native item.
3. Drag disposable favorites, nested folders and section folders. Test inside, before/after, cross-root targets, hidden siblings, invalid self/descendant target and outside/Escape cancellation. Hold over a destination to expand; test top/bottom edge scroll and subsequent ordinary footer peeks.
4. Use More → Move with keyboard and in search; reorder and change parent. Check tags/identity, archive inheritance, focus and original Escape restoration. Pending identity review must remain explicit; do not damage mappings to manufacture a case.
5. Check both themes and a narrow/zoomed window: cues, menus, modal focus/draft protection, sticky controls and final-section/footer behavior. Native acceptance remains pending until reported.

The short new two-device checklist is in [cross-device-test.md](cross-device-test.md) (section “0.1.21 creation and moving”). Do not repeat the whole passed suite. Deletion UI, copying, bulk operations, cross-tab/external drops, semantic search, thumbnails and broader Manage redesign remain deferred.

## Corrected diagnosis and inspected evidence

Inspected `docs/visual-review/0.1.19_rebind-error.png` with the image viewer, and decoded/viewed representative frames from `0.1.19_top-nav-movement.mp4` in isolated Chromium. The screenshot shows editable Work fields despite unresolved identity, plus duplicated error prefixes. The recording shows abrupt navigation/header compaction and reversal.

`Pasted text.txt` (including filename variations) was not found in the checkout or available diagnostic paths. Therefore these identity details are **user-supplied**, not independently read from a log: Work (`4d29ce79-d3f0-4c00-8dd5-d9eb18f1106d`, candidate 1227) was unresolved already in 0.1.18; successfully tested Folder Sync Test (`e7697eb9-249f-4b65-8fd0-ce640c24af83`) remains mapped to 1306. The user confirmed Show archived exposed the pending reviews. These are different identities, with no evidence that the update lost a confirmed binding or that transport failed.

## Newly supplied native evidence — 0.1.18

The user completed these scenarios on two devices with 0.1.18 and the same Edge profile:

- Native test folder/subfolder/favorite structure synchronized.
- After explicit folder-binding confirmation on B, direct folder tags appeared; descendant favorites inherited correct tags and source paths, and #tag search found them.
- Tags added on B synchronized to A.
- Parent rename/move on A retained tags and updated inherited source paths on B without another review.
- Archiving on A hid its subtree from browse/search/Edit there; B retained visibility with independent Show archived enabled.
- Unarchiving on B restored the subtree on A with ordinary tags intact.

These scenarios are **passed user-reported native tests**, not inferred from automation. Test-subtree deletion/propagation was **not explicitly confirmed**. The original missing-tag report was resolved by confirming a pending folder binding in Manage: diagnostics already showed received valid metadata, changing from unresolved to local-mapping after confirmation. This was **not a sync-transport defect**. No redesign or repeat of the complete passed suite is requested. Other untested editing/UI cases are not declared accepted.
