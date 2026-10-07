# Development State

Last updated: 2026-10-07
Current branch: `feature/bookmark-editing`. Browser-review build: **0.1.23**.
Validated MVP: `1217369dd10638942d80107d5f33d7f61491d075`, unchanged on `master`, `archive/mvp-validated-0.1.1` and annotated `mvp-validated-0.1.1`.
Accepted visual checkpoint: **`ui-validated-0.1.15`** and `feature/ui-ux-redesign` remain at **`0e6a596210b2be2d273eab4a19d2268d9a1407a1`**. No push; supplied media and Windows clone untouched.

## Current checkpoint

**0.1.21 is accepted within the user's existing checklist; 0.1.22 is NOT accepted. Stop for native Edge review of 0.1.23.** The current priority is the duplicate-move identity defect. No live metadata reset, native repair, merge, rename, deletion or recreation was performed.

Inspected all five supplied images: `0.1.22_duplicate_1.png` through `_4.png` and `0.1.22_moving-design-section.png`. The native Edge image confirms two same-title favorites, not whether their URLs are identical or a move changed a title. `Pasted markdown.md` was not found by filename/content searches in accessible project/temp files. User-reported logs show `6822fc12…` moving from local-mapping(66) to ambiguous at 12:05:09 on 2026-10-07 with 41 favorites retained; the earlier deleted `b9d0d7c5…` is separate. No historical native title overwrite is established.

## Confirmed cause and focused fix

A regression against 0.1.22 reproduces **local-mapping → ambiguous** when moving one tagged favorite beside a same-title/same-URL favorite with its own valid local identity. The competitor check incorrectly allowed the other record's locator to compete with a known native node despite that record's distinct surviving binding. Native fields did not change; the only native write was `move`.

Reconciliation now gives a uniquely validated existing local binding precedence over that record's locator candidates. It retains type/timestamp, deletion, ID-reuse and global conflict checks. Unbound/multiply-bound identities and fresh-device duplicates remain conservative; no metadata is guessed, merged, copied or recreated. Existing local mappings were retained during the ambiguity, so valid surviving evidence can be recognized after update. This does not prove that every affected profile has sufficient evidence or repair missing historical titles.

The shared `itemMetadataIssue` check now serves worker preflight, catalogue warnings and editors. A healthy current mapping is not assigned another ambiguous record's warning merely because its native ID appears among historical candidates. Editors show native ID, explicit status and read-only diagnostic details separately from tags. Unsafe inputs/Save are blocked; existing drafts remain intact. Resolution requires explicit review; an editor opened initially blocked must close/reopen to load confirmed direct tags before editing.

Detailed cause, evidence limits, and **minimal read-only native ID/title/URL/mapping diagnostics**: [move investigation](move-identity-0.1.23.md). Preserve both affected items and inspect native values before further saves/moves; no speculative repair is authorized.

## Interaction follow-up

- A compact pointer-following **Moving …** preview appears immediately after the existing threshold, including over empty/invalid space. Source-only highlighting leaves layout/destination readability intact. Valid/invalid/no-target wording is explicit. The preview is inert/pointer-transparent; source ID/title remain captured through rerenders, scrolling and target expansion. Drop/cancel/failure cleanup retains existing safeguards.
- Section Before/End boundaries use gutter-aligned horizontal lines. Flowing favorites/subfolders retain vertical carets; inside-folder intent remains separate. Root/parent context is explicit, native hidden-sibling order and canonical/no-op rules retained.
- **Favorite primary click/Enter opens its editor in Edit mode**, superseding the 0.1.18–0.1.22 explicit-button-only rule. Edit buttons remain. Real href, native context menus and deliberate modifier/middle-click navigation remain. Folder/section titles still expand/collapse. A completed/cancelled drag must not trigger an editor afterward.
- Help now reads: “Click a favorite to edit it, or use Edit beside a folder. Drag titles to move.” Ordinary browsing navigation is unchanged. No broader visual redesign, schema/permission/transport change or new mutation pathway.

Implementation commits: `23b51c3` (identity/editor health) and `d87ab41` (drag/title interactions).

## Verification

`npm run check`: **232 tests / 20 files**, typecheck, lint, production build and stable extension-ID verification passed. Tracked `dist/` is 0.1.23, ID `nfhbegeoeafnpejpjdljhgagefbpafal`.

- New pure/service regressions fail against 0.1.22 and pass after the identity fix; cover record/node order, competing UUIDs, fresh-profile ambiguity, unchanged native values/direct records, repeated reconciliation and per-item diagnostics.
- `check-023.mjs`: actual pointer and keyboard input in both themes; ten successful moves per theme across duplicate/reorder/other-URL cases, rerender during dragging, before/after native/identity/tag/source evidence, no `update` calls, interrupted/initially blocked drafts, healthy duplicate isolation, click/Enter, unprevented right-click/Shift+F10, native modifier/middle-click destination requests, failure/cancel cleanup, section lines, narrow layouts. External test destinations are intercepted; headless native OS menu contents require Edge review.
- Existing `check-create-move`, `check-editing`, `check-archive-editor`, `check-drag-lifecycle` and `check-peek-scroll` pass. Creation recovery remains duplicate-free; search/Escape and repeated draft cancellation remain covered. The metadata-health fixture now includes the production snapshot fields instead of treating them as optional. Existing missing-metadata editor regression now expects blocking **before input**, not after Save.
- [Rendered captures and reports](visual-review/generated/0.1.23-review.md) use isolated Chromium fixtures/browser doubles, not live Edge or fresh Microsoft sync acceptance. Final native title values/history on the affected profile remain unverified. Previous accepted two-device evidence below remains valid within its recorded scope.

## Edge next action

Reload the unpacked extension at `edge://extensions`, verify **0.1.23**, and open a new dashboard using the committed `dist/`. Windows consumes this artifact; development/tooling remains WSL.

1. Capture affected native IDs/current titles/URLs read-only first; compare mappings and direct tags after update. Keep ambiguous items untouched if evidence remains insufficient.
2. With disposable duplicates only, move together/apart and reorder; verify title/URL/ID/direct tags unchanged and inheritance follows the destination.
3. Check click/Enter editing, explicit Edit, right-click/Shift+F10 and modifier/middle navigation; no post-drag activation.
4. Check immediate preview, invalid feedback, section lines/inline carets, receiving-root context, narrow/light/dark, edge scroll/cancel and footer stability.
5. If a naturally blocked item exists, verify clear non-tag status, disabled Save, readable diagnostics and intact draft. Do not damage mappings to induce ambiguity.

A targeted two-device check of **already confirmed disposable duplicate identities** is appropriate for the changed reconciliation case, not a repeat of the full accepted suite. Fresh unbound duplicates must remain unresolved. No new native synchronization outcome is claimed.

## Remaining limits

Native title overwrite is not established or ruled out for the reported historical incident. No live title repair is proposed. Identical items without surviving local identity evidence cannot be attached by guessing; copied/local-state resets and unobserved recreation retain the existing limitations. Native and metadata writes remain non-atomic. 0.1.22 deletion-sync verification remains pending separately; no deletion was involved in this reproduction. Draft recovery across browser closure/reload remains unpromised.

Bulk operations, copying, external/cross-tab drops, thumbnails, semantic search and broader Manage cleanup remain deferred.

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
