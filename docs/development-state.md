# Development State

Last updated: 2026-10-07
Current branch: `feature/bookmark-editing`. Browser-review build: **0.1.27**, ready for focused Manage dismissal review.
Validated MVP: `1217369dd10638942d80107d5f33d7f61491d075`, unchanged on `master`, `archive/mvp-validated-0.1.1` and annotated `mvp-validated-0.1.1`.
Accepted visual checkpoint: `ui-validated-0.1.15` and `feature/ui-ux-redesign` remain at `0e6a596210b2be2d273eab4a19d2268d9a1407a1`. No push; supplied media and Windows clone untouched.

## Review status

The user accepted **0.1.25 Edge tests**, including changes and tag synchronization between PC A and PC B. Successful Chrome use was also reported; no full Chrome regression or cross-browser synchronization is inferred. The user now confirms **0.1.26 native cross-Workspace moves and synchronization between PCs passed**. This is specific native evidence; no additional scenarios or full-release acceptance are inferred. The remaining reported Manage unchanged-editor dismissal defect is corrected in 0.1.27, pending native review.

The 0.1.23 duplicate-bookmark binding fix remains preserved. The historical native-title-change report remains unexplained; this checkpoint neither claims its cause nor repairs live data. No live reset, guessed identity repair, merge, recreation or live bookmark mutation was performed. Supplied screenshots `0.1.25_readonly-fields.png`, `0.1.25_context-menu-items.png` and `0.1.25_management.png` were all opened with the image viewer before implementation.

## Current behavior — Indexfold 0.1.27

- Ordinary bookmarks/subtrees can move **between Edge Workspace containers**, using the existing native move command and full parent/order verification. Direct tags/IDs/bindings remain; inherited tags, archive state and paths follow the actual destination. Rejected, unchanged and uncertain outcomes remain explicit errors with refreshed state and no automatic retry. The old silent-success reporting gap was fixed in 0.1.25; the native cause of the user's original failed boundary operation was not established.
- Workspace root/container lifecycle protection remains. No creation/receiving directly beneath the root. Workspace ↔ ordinary-root moves remain restricted. Root identification now requires positive Edge browser evidence plus the documented structural assumption; arbitrary unknown Chrome roots are never classified as Workspaces. No active-Workspace filter. [Current capability limits](workspace-capabilities.md).
- Protected names use a selectable subdued read-only surface and a Read-only label. Tags/archive remain editable; initial focus uses the first editable input. Native IDs and lifecycle details move to optional Diagnostic details. Unambiguous destination paths omit IDs; identical full paths retain an ID suffix for deliberate selection.
- Menus highlight actionable hover/keyboard rows, wrap within viewport bounds and omit container Move/Delete/drag plus lifecycle prose. Metadata/ambiguity diagnostics remain available where needed.
- Manage dismissal now compares against an immutable opening snapshot. Previously Cancel unconditionally asked to discard, and the draft notice equated an open form with a changed form. Unchanged or reverted inputs close through Cancel/Escape without confirmation; genuine edits still prompt, and declining retains input. Tag comparison uses existing normalization (including `archived`); native titles/URLs stay exact, with no URL/code rewriting. Busy saves cannot be dismissed. External refreshes and failed/partial saves never reset the baseline or stale-edit token. Focus returns to the opening control. Non-destructive Manage/dashboard navigation continues retaining forms, with a draft notice only for actual changes. Catalogue bookmark/folder modal semantics are unchanged.
- Manage is **Settings / Bookmarks / Diagnostics**, with Back to dashboard. Panels stay mounted: drafts, queries and selections survive navigation and theme changes. An existing management draft cannot be overwritten by opening another. Binding review stays proactive and complete, including archived/excluded records. Diagnostics uses the full snapshot. Settings shows actual command assignment and browser-specific manual shortcut-settings instructions.
- Test-folder defaults/experimental setup messages are removed from normal presentation. Genuine metadata recovery remains under Diagnostics → Advanced with export, inventory and confirmation. No reset ran. Diagnostic copy/export warns about private data; native fields/URLs are not sent to an external service.
- Display branding is **Indexfold**, tagline **Your bookmarks, beautifully within reach.**, and footer **Indexfold.** Existing footer URLs and `source=bcbb` remain. Native names such as Favorites bar stay unchanged; application wording uses bookmarks. Manifest key/ID, storage/schema/namespaces, preferences and repository identifiers are unchanged. Historical evidence retains its original branding.

## Verification

`npm run check`: **257 tests / 24 files**, typecheck, lint, build and stable ID validation passed; tracked `dist/` is **0.1.27**, ID `nfhbegeoeafnpejpjdljhgagefbpafal`.

- `check-management-dismissal.mjs` fails against 0.1.26 at its first unchanged Cancel (one unexpected prompt) and passes with the fix in light/dark isolated Chromium. Actual pointer/keyboard checks cover clean/dirty/reverted forms, repeated open/close, Escape and rejected/accepted discard, retained navigation, external-update conflict, focus restoration and unchanged/dirty/reverted bookmark/folder catalogue modals including archive checkbox reversal.
- Unit tests cover exact native values, normalized tag equivalence, archive representation and opening-baseline independence. The service, synchronization, metadata schema and native write paths are unchanged.
- Existing `check-editing.mjs`, `check-folders.mjs` and `check-appearance.mjs` passed, including repeated Escape, failed/duplicate saves, external conflicts, bookmark/folder partial-save recovery, inherited archive filtering, final-visible-section hover and theme/draft retention. The folder script’s obsolete pre-0.1.26 setup/review selectors were updated to the current Manage panels; recovery runs only in disposable fixtures. Prior 0.1.26 rendered evidence remains at [the review record](visual-review/generated/0.1.26-review.md); the new build adds no visual design changes.
- Tests use isolated profiles/fixtures, not live bookmark data. Chromium results do not establish native Edge acceptance. The reported two-device move result above comes from the user.

## Next action: focused native review

Reload **Indexfold 0.1.27** at `edge://extensions` or `chrome://extensions` using committed `dist/`, then open a fresh dashboard. Nothing pushed; Windows consumes the WSL-built artifact.

1. Manage → Bookmarks: open an existing editor, then Cancel or Escape without changes; no discard prompt. Repeat with a new blank editor.
2. Change a field: Cancel/Escape must ask before discarding; decline and verify input remains. Revert all changes to their original values and dismiss without a prompt.
3. Navigate among Manage panels and back to the dashboard; inputs remain available on return. Only changed drafts display the retained-draft notice.
4. Briefly check bookmark/folder catalogue modal Cancel and repeated Escape, including archive changes. No repeat of the passed cross-Workspace/two-device suite is requested for this UI-only correction.

No live repair or metadata reset. Active-Workspace filtering, Workspace ↔ ordinary-root support, copying, bulk operations, website thumbnails and semantic search remain deferred. The historical native-title-change cause is still unestablished.

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
