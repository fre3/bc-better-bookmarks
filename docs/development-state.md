# Development State

Last updated: 2026-10-07
Current branch: `feature/bookmark-editing`. Browser-review build: **0.1.26**, ready for native review.
Validated MVP: `1217369dd10638942d80107d5f33d7f61491d075`, unchanged on `master`, `archive/mvp-validated-0.1.1` and annotated `mvp-validated-0.1.1`.
Accepted visual checkpoint: `ui-validated-0.1.15` and `feature/ui-ux-redesign` remain at `0e6a596210b2be2d273eab4a19d2268d9a1407a1`. No push; supplied media and Windows clone untouched.

## Review status

The user accepted **0.1.25 Edge tests**, including changes and tag synchronization between PC A and PC B. Successful Chrome use was also reported; no full Chrome regression or cross-browser synchronization is inferred. **0.1.26 is ready for targeted native review, not yet accepted.**

The 0.1.23 duplicate-bookmark binding fix remains preserved. The historical native-title-change report remains unexplained; this checkpoint neither claims its cause nor repairs live data. No reset, guessed identity repair, merge, recreation or live bookmark mutation was performed. Supplied screenshots `0.1.25_readonly-fields.png`, `0.1.25_context-menu-items.png` and `0.1.25_management.png` were all opened with the image viewer before implementation.

## Current behavior — Indexfold 0.1.26

- Ordinary bookmarks/subtrees can move **between Edge Workspace containers**, using the existing native move command and full parent/order verification. Direct tags/IDs/bindings remain; inherited tags, archive state and paths follow the actual destination. Rejected, unchanged and uncertain outcomes remain explicit errors with refreshed state and no automatic retry. The old silent-success reporting gap was fixed in 0.1.25; the native cause of the user's original failed boundary operation was not established.
- Workspace root/container lifecycle protection remains. No creation/receiving directly beneath the root. Workspace ↔ ordinary-root moves remain restricted. Root identification now requires positive Edge browser evidence plus the documented structural assumption; arbitrary unknown Chrome roots are never classified as Workspaces. No active-Workspace filter. [Current capability limits](workspace-capabilities.md).
- Protected names use a selectable subdued read-only surface and a Read-only label. Tags/archive remain editable; initial focus uses the first editable input. Native IDs and lifecycle details move to optional Diagnostic details. Unambiguous destination paths omit IDs; identical full paths retain an ID suffix for deliberate selection.
- Menus highlight actionable hover/keyboard rows, wrap within viewport bounds and omit container Move/Delete/drag plus lifecycle prose. Metadata/ambiguity diagnostics remain available where needed.
- Manage is **Settings / Bookmarks / Diagnostics**, with Back to dashboard. Panels stay mounted: drafts, queries and selections survive navigation and theme changes. An existing management draft cannot be overwritten by opening another. Binding review stays proactive and complete, including archived/excluded records. Diagnostics uses the full snapshot. Settings shows actual command assignment and browser-specific manual shortcut-settings instructions.
- Test-folder defaults/experimental setup messages are removed from normal presentation. Genuine metadata recovery remains under Diagnostics → Advanced with export, inventory and confirmation. No reset ran. Diagnostic copy/export warns about private data; native fields/URLs are not sent to an external service.
- Display branding is **Indexfold**, tagline **Your bookmarks, beautifully within reach.**, and footer **Indexfold.** Existing footer URLs and `source=bcbb` remain. Native names such as Favorites bar stay unchanged; application wording uses bookmarks. Manifest key/ID, storage/schema/namespaces, preferences and repository identifiers are unchanged. Historical evidence retains its original branding.

## Verification

`npm run check`: **253 tests / 23 files**, typecheck, lint, build and stable ID validation passed; tracked `dist/` is **0.1.26**, ID `nfhbegeoeafnpejpjdljhgagefbpafal`.

- Workspace unit tests cover cross-container bookmarks/subtrees, identity/direct-tag preservation, destination archive inheritance and removal of old sources, root/container restrictions and Edge/Chrome classification. Existing outcome tests cover no-op, wrong parent/order, response/read uncertainty, rejection and legacy partial outcomes.
- `check-026.mjs` uses real pointer/keyboard input: cross-container subtree Move and bookmark drag, resolved cross-container no-op/error without retry, source identity/native values/direct tags, inheritance, Manage panel/draft/focus retention, browser-specific instructions, menu focus/hover/resize, selectable protected fields, both themes and forced colors.
- Existing `check-workspace-policy`, `check-023`, `check-editor-highlights`, `check-editing`, `check-create-move`, `check-binding-review`, `check-archive-editor`, `check-appearance`, `check-022`, and `check-peek-scroll` passed. Label/tab-stop selectors were adjusted for intentional wording, optional diagnostic details and Manage panels; test fixture records/titles remain native data. Actual pointer/wheel footer cycles and duplicate identity moves remain covered.
- [Captures, reports and changed-file inventory](visual-review/generated/0.1.26-review.md). Rendered light/dark control/menu/Manage captures were visually inspected, including narrow Settings. This is isolated Chromium evidence, not native Edge Workspace API acceptance or new transport verification.

## Next action: native review

Reload **Indexfold 0.1.26** at `edge://extensions` or `chrome://extensions` using committed `dist/`, then open a fresh dashboard. Nothing pushed; Windows consumes the WSL-built artifact.

1. Move disposable bookmarks/subfolders between Workspace containers; compare native destination/order, retained direct tags and destination inheritance.
2. Check PC B receives moves/tags, confirming bindings if required. This is the new targeted two-device check, not a repeat of the entire accepted suite.
3. Containers/root remain protected; names visibly read-only, tags/archive editable.
4. Menus highlight hover/focus, fit narrow widths and offer only relevant actions.
5. Settings / Bookmarks / Diagnostics preserve drafts; pending bindings and private diagnostic export remain accessible.
6. Indexfold branding, native root names and Chrome/Edge-specific instructions are correct.
7. Brief search/Escape, modal, theme and final-section/footer checks.

No live repair or metadata reset. Native extension API may still reject a cross-container operation; report the actual error/state rather than retrying blindly. Active-Workspace filtering, Workspace ↔ ordinary-root support, copying, bulk operations, website thumbnails and semantic search remain deferred.

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
