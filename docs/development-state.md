# Development State

Last updated: 2026-10-08
Current branch: `feature/bookmark-editing`. Review build: **0.1.28**, ResizeObserver correction awaiting native Edge review. Accepted `editing-validated-0.1.27` remains at `bd87c83232eebce4afca1e86c9bcc6c2c436fcb7`.
Validated MVP: `1217369dd10638942d80107d5f33d7f61491d075`, unchanged on `master`, `archive/mvp-validated-0.1.1` and annotated `mvp-validated-0.1.1`.
Accepted visual checkpoint: `ui-validated-0.1.15` and `feature/ui-ux-redesign` remain at `0e6a596210b2be2d273eab4a19d2268d9a1407a1`. No push; supplied media and Windows clone untouched.

## Review status

The user accepted **0.1.25 Edge tests**, including changes and tag synchronization between PC A and PC B. Successful Chrome use was also reported; no full Chrome regression or cross-browser synchronization is inferred. The user now confirms **0.1.26 native cross-Workspace moves and synchronization between PCs passed**. This is specific native evidence; no additional scenarios or full-release acceptance are inferred. The user has now accepted **Indexfold 0.1.27 in native Edge**, including the focused Manage dismissal correction.

The 0.1.23 duplicate-bookmark binding fix remains preserved. The historical native-title-change investigation is **closed** on 2026-10-08 because the user reports no recurrence across several subsequent releases. Its original cause remains unconfirmed; this is not evidence of a proven title-overwrite fix. It is no longer an active issue or review requirement. [Historical evidence and closure](move-identity-0.1.23.md) remain available, separately from the demonstrated duplicate-binding fix. No live reset, guessed identity repair, merge, recreation or live bookmark mutation was performed. Supplied screenshots `0.1.25_readonly-fields.png`, `0.1.25_context-menu-items.png` and `0.1.25_management.png` were all opened with the image viewer before implementation.

## Current behavior — Indexfold 0.1.28

- Ordinary bookmarks/subtrees can move **between Edge Workspace containers**, using the existing native move command and full parent/order verification. Direct tags/IDs/bindings remain; inherited tags, archive state and paths follow the actual destination. Rejected, unchanged and uncertain outcomes remain explicit errors with refreshed state and no automatic retry. The old silent-success reporting gap was fixed in 0.1.25; the native cause of the user's original failed boundary operation was not established.
- Workspace root/container lifecycle protection remains. No creation/receiving directly beneath the root. Workspace ↔ ordinary-root moves remain restricted. Root identification now requires positive Edge browser evidence plus the documented structural assumption; arbitrary unknown Chrome roots are never classified as Workspaces. No active-Workspace filter. [Current capability limits](workspace-capabilities.md).
- Protected names use a selectable subdued read-only surface and a Read-only label. Tags/archive remain editable; initial focus uses the first editable input. Native IDs and lifecycle details move to optional Diagnostic details. Unambiguous destination paths omit IDs; identical full paths retain an ID suffix for deliberate selection.
- Menus highlight actionable hover/keyboard rows, wrap within viewport bounds and omit container Move/Delete/drag plus lifecycle prose. Metadata/ambiguity diagnostics remain available where needed.
- Manage dismissal now compares against an immutable opening snapshot. Previously Cancel unconditionally asked to discard, and the draft notice equated an open form with a changed form. Unchanged or reverted inputs close through Cancel/Escape without confirmation; genuine edits still prompt, and declining retains input. Tag comparison uses existing normalization (including `archived`); native titles/URLs stay exact, with no URL/code rewriting. Busy saves cannot be dismissed. External refreshes and failed/partial saves never reset the baseline or stale-edit token. Focus returns to the opening control. Non-destructive Manage/dashboard navigation continues retaining forms, with a draft notice only for actual changes. Catalogue bookmark/folder modal semantics are unchanged.
- Manage is **Settings / Bookmarks / Diagnostics**, with Back to dashboard. Panels stay mounted: drafts, queries and selections survive navigation and theme changes. An existing management draft cannot be overwritten by opening another. Binding review stays proactive and complete, including archived/excluded records. Diagnostics uses the full snapshot. Settings shows actual command assignment and browser-specific manual shortcut-settings instructions.
- Test-folder defaults/experimental setup messages are removed from normal presentation. Genuine metadata recovery remains under Diagnostics → Advanced with export, inventory and confirmation. No reset ran. Diagnostic copy/export warns about private data; native fields/URLs are not sent to an external service.
- Display branding is **Indexfold**, tagline **Your bookmarks, beautifully within reach.**, and footer **Indexfold.** Existing footer URLs and `source=bcbb` remain. Native names such as Favorites bar stay unchanged; application wording uses bookmarks. Manifest key/ID, storage/schema/namespaces, preferences and repository identifiers are unchanged. Historical evidence retains its original branding.

## ResizeObserver follow-up

Inspected `0.1.27_ext-error.png`. Reproduced the exact window error in isolated Chromium on 0.1.27: peek coverage writes resize the sibling lip observed by the footer, and footer writes resize ancestors observed by final-hover retention during ResizeObserver delivery. A traced run captured 13 warnings. Geometry tasks now coalesce outside resize delivery, ordered cover-before-footer; unchanged observations/writes are retained/skipped. Mount-time measurement remains before paint. Actual CSS reveal transitions receive bounded per-frame measurement, including their first changing frame; work stops at transition completion and is cancelled on cleanup. No error filter, observer removal workaround, animation timing change or synchronization change. [Full audit of all eight observers, reproduction and correction](resize-observer-0.1.28.md).

## Verification

User-reported native Edge acceptance: **0.1.27 passed**, recorded 2026-10-08. The new observer correction is not yet accepted in Edge.

`npm run check`: **261 tests / 25 files**, typecheck, lint, build and stable ID validation passed for 0.1.28. The tracked loadable artifact retains extension ID `nfhbegeoeafnpejpjdljhgagefbpafal`.

- New scheduler unit tests cover coalescing, current-geometry/dependency order, cancellation and no stale callback after disposal.
- `check-resize-observer.mjs` fails against `editing-validated-0.1.27` with five peek-entry window errors and passes on the corrected source with **zero window errors**, settled geometry and no pending frames in all three variants. It captures window ErrorEvents (not just console/page exceptions), verifies stable geometry/callback/style-write counts and checks painted entry/exit/footer boundaries. Workflows include startup/reload, fonts, open/nested/peek, resizing, theme, Manage/editor, search restoration and auto-scroll. Light desktop, dark narrow and reduced motion are included.
- Existing `check-peek-scroll.mjs` now also captures window errors during repeated real wheel/pointer final-section cycles and short-page/reduced-motion coverage. It checks settled measurement counts, pending callbacks, pointer retention and absence of oscillation.
- Existing editing, archive/tag and navigation follow-up regressions passed, covering modal focus/drafts, search restoration, inherited annotations, compact sticky geometry and mouse/keyboard tag visibility. No change to native mutations, identity, metadata, archive or theme semantics.
- [Committed before/after measurements](visual-review/generated/0.1.28-observer-results.json) summarize the captured errors, callback counts and transition samples. Rendered dark/narrow peek and short-page final preview captures were inspected.
- Browser evidence is from disposable Chromium fixtures, not native Edge. No live bookmark/profile data was accessed. The original screenshot identifies the warning but lacks a callback stack; the established cause is backed by the matching local reproduction and geometry trace.

## Next action: targeted native Edge review

Reload committed **Indexfold 0.1.28** at `edge://extensions`, clear the old extension error list (not storage), then open a fresh dashboard.

1. Resize narrow/wide, switch themes, open sections/subfolders and traverse peeks. Check tags, summaries, dither coverage and pointer targets.
2. Hover the final section, wait for auto-scroll, wheel to the footer, leave/re-enter and scroll upward. Repeat without reload; check stability and full preview coverage.
3. Enter/leave Manage and bookmark/folder editors, Cancel/Escape and search/Escape; repeat with reduced motion. Confirm no new ResizeObserver warnings in the extension error list.

No push or live repair. Accepted references and supplied media are unchanged. The title-change investigation remains closed; its cause is unconfirmed, with historical evidence retained. Deferred features remain outside this checkpoint.

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
