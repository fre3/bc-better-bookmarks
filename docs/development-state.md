# Development State

Last updated: 2026-10-07
Current branch: `feature/bookmark-editing`. Browser-review build: **0.1.26**, implementation and verification in progress.
Validated MVP: `1217369dd10638942d80107d5f33d7f61491d075`, unchanged on `master`, `archive/mvp-validated-0.1.1` and annotated `mvp-validated-0.1.1`.
Accepted visual checkpoint: `ui-validated-0.1.15` and `feature/ui-ux-redesign` remain at `0e6a596210b2be2d273eab4a19d2268d9a1407a1`. No push; supplied media and Windows clone untouched.

## Review status

The user reports all requested **0.1.25 Edge tests passed**, including changes and tag synchronization between PC A and PC B. Successful Chrome use was also reported; this is not a complete Chrome regression or cross-browser sync test. The earlier reports that the other requested **0.1.23** tests pass remain recorded. 0.1.24's blanket Workspace native restriction was rejected as too restrictive. 0.1.26 is the next review target. Its restored Workspace operations are verified in isolated Chromium fixtures, not yet native Edge. The 0.1.24 source-highlighting corrections are preserved; no additional native acceptance is inferred.

The duplicate-bookmark binding defect fixed in 0.1.23 remains fixed. The historical native-title-change report remains unexplained. Native duplicate titles were established, but a title overwrite during dragging was neither established nor ruled out. No reset, merge, guessed repair, rename, delete, recreation or Workspace mutation was performed on live data. See [identity investigation](move-identity-0.1.23.md) for retained evidence and minimal read-only diagnostics.

## Workspace safeguards — 0.1.25

0.1.24 was judged too restrictive. The user accepts immediate folders beneath the established Workspaces root as protected containers, including ordinary folders accidentally created there. Native operations inside either active or inactive containers were reported working previously. Direct-root folder recognition by Edge remains a hypothesis; silent cross-Workspace movement is under investigation.

[Current policy and exact root assumption](workspace-capabilities.md): a typed bar + other plus one untyped non-managed root matches the supplied structure. No names/IDs are hard-coded. Containers stay native-protected but their contents regain creation/edit/delete and within-container moves. Cross-boundary moves remain temporarily blocked, not declared prohibited by Edge. Loose direct-root entries disappear from browse only; search/full paths, Manage and administrative review retain access. 0.1.24 highlighting remains intact. No live mutation/reset or new permissions.

Move investigation found a concrete reporting gap: the adapter discarded the move API result, and the service reported success after a refresh without comparing the actual parent/order to the requested result. A resolved no-op reproduces silent success in the old path. This does **not** establish why the user's cross-Workspace operation did not move. The service now checks the response and fresh full native sibling order, including same-parent index adjustment and source values, and rechecks after reconciliation. Unchanged/unexpected/rejected/unreadable outcomes are explicit, with no automatic retry or fallback mutation. Legacy Manage moves use the same verification. An external change after verification remains possible; no browser API transaction is claimed.

Root recognition remains a bounded structural assumption, not a reliable public Workspace discriminator. Multiple unknown roots or unsupported shapes remain conservatively restricted. Every immediate folder under the assumed root is protected by accepted policy, even if accidentally created there. No supported active-Workspace identifier was found; all containers remain visible. See the capability document for a short optional read-only tab/window comparison. No native IDs, translated names or active tab state determine these permissions.

## Active-editor highlighting

Confirmed synthetic-heading cause: absent `movingId` compared equal to absent `section.folder.id`, incorrectly assigning drag-source styling to every loose Bookmarks section. Require a real source and real folder before setting that attribute. Keyboard focus remains independent.

Real section titles now receive explicit selected-ID styling matching favorites/subfolders, including search and sticky headers. Only the title is highlighted, excluding provenance/chevron/actions/header. Dirty confirmation and failed Save retain the state; Save/Cancel/discard clear it. Duplicate names do not share state; a removed source has no remaining highlight. No layout, expansion or scroll change is introduced to reveal selection.

## Verification

`npm run check`: **251 tests / 23 files**, typecheck, lint, production build and stable extension-ID validation passed. Tracked `dist/` is **0.1.25**, ID `nfhbegeoeafnpejpjdljhgagefbpafal`.

- Unit tests: structural root ambiguity/name independence, protected root/container worker paths, metadata-only saves without native updates, descendant CRUD, boundary guards including legacy Manage, browse-only loose exclusion and archive/search behavior. Move outcomes cover resolved no-op, wrong parent/order, rejection after a move, inconsistent API reply, post-write read failure, forward/backward indices, concurrent order changes and partial-save reporting.
- `check-workspace-policy.mjs`: both themes, container tags/no native update, descendant create/edit/delete in two containers, forbidden destinations, real Move-dialog no-op reporting, native sibling reorder, actual pointer move with identity/direct tags retained, loose search/full paths and Manage explanation.
- `check-editor-highlights`, `check-023`, `check-editing`, `check-create-move`, `check-binding-review`, `check-archive-editor`, and `check-peek-scroll` passed. These cover source highlighting, ten duplicate moves per theme, draft/health safeguards, creation recovery, query/Escape restoration, binding persistence, archive editing, and repeated actual wheel/pointer footer cycles and cleanup.
- [Review captures and reports](visual-review/generated/0.1.25-review.md) are isolated Chromium evidence. Light/dark container editors and settled loose search results were visually inspected. Fixtures simulate browser behavior; they do not establish native Edge Workspace API support, active-Workspace signals or fresh two-device sync.

## Concrete next action: native Edge review

Use committed `dist/` from WSL. In `edge://extensions`, reload Better Bookmarks, verify **0.1.25**, and open a fresh dashboard. Windows is an artifact-consuming clone, not the build environment. Nothing pushed.

1. Confirm Workspace containers remain visible/protected; browse has no loose Bookmarks group or Workspace-root New action.
2. Inside an Edge-created disposable test Workspace, create/edit/delete a favorite and nested folder. Do not rename/delete the Workspace container through the dashboard.
3. From Development, repeat ordinary-content operations inside Personal; permissions should be identical.
4. Reorder/move disposable items within one Workspace; compare native position and retained direct/inherited tags.
5. Confirm cross-boundary destinations are unavailable with the temporary-policy explanation. Unexpected/no-op API results must report uncertainty/failure, not silent success; do not blindly retry.
6. Save container tags without native renaming; check matching source highlights, Manage visibility for loose entries, search paths/Escape and a brief final-section/footer traversal.

No destructive live Workspace probes or repeat of the full passed two-device suite is required. Automatic current-Workspace filtering and boundary API verification remain deferred. Bulk operations, copying, external/cross-tab drops, thumbnails, semantic search and broader Manage cleanup remain deferred.

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
