# Development State

Last updated: 2026-10-07
Current branch: `feature/bookmark-editing`. Browser-review build: **0.1.24**.
Validated MVP: `1217369dd10638942d80107d5f33d7f61491d075`, unchanged on `master`, `archive/mvp-validated-0.1.1` and annotated `mvp-validated-0.1.1`.
Accepted visual checkpoint: `ui-validated-0.1.15` and `feature/ui-ux-redesign` remain at `0e6a596210b2be2d273eab4a19d2268d9a1407a1`. No push; supplied media and Windows clone untouched.

## Review status

The user reports the other requested **0.1.23** tests pass; Workspace compatibility and source-highlighting discrepancies are the outstanding issues addressed for this review. **Stop for native Edge review of 0.1.24.** Do not declare Workspace compatibility or comprehensive acceptance from Chromium fixtures.

The duplicate-bookmark binding defect fixed in 0.1.23 remains fixed. The historical native-title-change report remains unexplained. Native duplicate titles were established, but a title overwrite during dragging was neither established nor ruled out. No reset, merge, guessed repair, rename, delete, recreation or Workspace mutation was performed on live data. See [identity investigation](move-identity-0.1.23.md) for retained evidence and minimal read-only diagnostics.

## Workspace safeguards

Visually inspected all five supplied 0.1.23 references; none missing. The user also supplied read-only native root/immediate-folder properties. Favorites bar and Other favorites expose documented ordinary `folderType` values; the Workspaces root and both direct folders expose no type/protection discriminator. Names, IDs and matching property sets do not prove which direct child is an actual Workspace.

[Evidence, shared policy and read-only follow-up](workspace-capabilities.md): documented ordinary domains retain native operations. Unclassified roots/types and their descendants remain visible/searchable, but native create, rename, URL change, move/reorder and delete are blocked. Managed restrictions remain independent. UI actions, destinations, drag planning, Manage and fresh worker preflight share that boundary, including protected descendants and insertion anchors. Browser rejection never falls back to copy/delete/recreation.

**Limitation:** native operations on ordinary-looking content inside the unclassified Workspace branch are also restricted. A safe distinction is not exposed by the supplied data; do not infer one by depth, title or local ID. Use Edge for those native changes until a supported signal or separately reviewed explicit association workflow exists. This does not assert that all cross-Workspace moves are prohibited by Edge. Browsers lacking ordinary root types will likewise be conservative.

Tags/archive metadata remain separately editable for real non-managed nodes below roots when identity and metadata health permit. Native names/URLs are read-only in those editors; unchanged fields cause no native update/move. Root/synthetic metadata remains prohibited. Existing bindings remain reconciliation participants; no synchronization schema/transport/permission change, automatic identity repair or metadata reset.

## Active-editor highlighting

Confirmed synthetic-heading cause: absent `movingId` compared equal to absent `section.folder.id`, incorrectly assigning drag-source styling to every loose Bookmarks section. Require a real source and real folder before setting that attribute. Keyboard focus remains independent.

Real section titles now receive explicit selected-ID styling matching favorites/subfolders, including search and sticky headers. Only the title is highlighted, excluding provenance/chevron/actions/header. Dirty confirmation and failed Save retain the state; Save/Cancel/discard clear it. Duplicate names do not share state; a removed source has no remaining highlight. No layout, expansion or scroll change is introduced to reveal selection.

## Verification

`npm run check`: **240 tests / 21 files**, typecheck, lint, production build and stable extension-ID validation passed. Tracked `dist/` is **0.1.24**, ID `nfhbegeoeafnpejpjdljhgagefbpafal`.

- New capability regressions: type/structure classification independent of names, unknown/managed restrictions, all worker native paths, protected subtrees/anchors, metadata-only exact native-field preservation, mapping retention across a new snapshot, rejection without fallback, fresh-tree capability changes, and duplicate-free metadata completion for an existing creation receipt after a location becomes restricted.
- New isolated Chromium scripts: `check-workspace-policy.mjs` (both themes, read-only native fields, successful tag-only save/no native writes, blocked menu actions/destinations and real pointer-invalid-target feedback); `check-editor-highlights.mjs` (both themes, three synthetic groups, sections/favorites/nested/wrapped titles, no geometry shift, repeated Escape, failed/success Save, Cancel/discard, duplicate names/search/sticky states and source deletion).
- Existing `check-023`, `check-editing`, `check-create-move`, `check-binding-review`, `check-archive-editor`, and `check-peek-scroll` passed. Duplicate moves preserve IDs/titles/URLs/direct metadata; creation recovery remains duplicate-free; binding/metadata guards, query/Escape restoration, archive semantics and repeated wheel/pointer footer cleanup remain covered.
- [Review captures and reports](visual-review/generated/0.1.24-review.md) are synthetic, isolated Chromium evidence. Rendered images were visually inspected. They do not prove native Edge Workspace operations or new two-device sync. User-reported earlier native evidence remains scoped below.

## Concrete next action: native Edge review

Use the committed `dist/` from this WSL build. In `edge://extensions`, reload Better Bookmarks, verify **0.1.24**, and open a fresh dashboard. Windows is an artifact-consuming clone, not the build environment. Nothing pushed.

1. Inspect restrictions/explanations on the Workspace root and unclassified containers; do not rename/delete actual Workspaces through the dashboard.
2. Use disposable ordinary content under typed ordinary roots to check creation/edit/move. Workspace lifecycle and native changes in its unclassified branch stay in Edge.
3. Confirm unsupported destinations/drop targets are unavailable before a write; normal browse/search still shows those locations.
4. Save tags on a confirmed protected folder and verify its native name stays unchanged. Do not bypass pending/ambiguous identity review.
5. Check normal synthetic headings and matching favorite/subfolder/section highlights in both themes, including search and sticky headings.
6. Check dirty Escape twice, failed Save/Cancel/discard cleanup, real keyboard focus, drag-source feedback and a brief search/footer traversal.

No destructive live Workspace probes or repeat of the full passed two-device suite is required. Bulk operations, copying, external/cross-tab drops, thumbnails, semantic search and broader Manage cleanup remain deferred.

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
