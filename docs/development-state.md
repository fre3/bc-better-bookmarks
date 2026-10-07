# Development State

Last updated: 2026-10-07
Current branch: `feature/bookmark-editing`. Browser-review build: **0.1.22**.
Validated MVP: `1217369dd10638942d80107d5f33d7f61491d075`, unchanged on `master`, `archive/mvp-validated-0.1.1` and annotated `mvp-validated-0.1.1`.
Accepted visual checkpoint: **`ui-validated-0.1.15`** and `feature/ui-ux-redesign` remain at **`0e6a596210b2be2d273eab4a19d2268d9a1407a1`**. No push; supplied media and Windows clone untouched.

## Accepted baseline and current review

The user reports all requested **0.1.21** tests passed and accepts that checkpoint, including the existing single-device creation/move checklist and short two-device checks. No additional test coverage is inferred. All eight supplied screenshots `docs/visual-review/0.1.21-1.png` through `0.1.21-8.png` were visually inspected; none were missing. They show inconsistent navigation sizes, inherited menu typography and insertion marks inside the action group.

**Stop for native Edge review of 0.1.22.** Reload the existing unpacked extension at `edge://extensions`, verify **0.1.22**, then open a fresh dashboard using committed `dist/`. Windows consumes this artifact; all development remains in WSL. No push, live metadata reset, permission change or automatic native bookmark mutation.

## Implemented 0.1.22

- Navigation actions/root labels are consistently **12px** with at least 32px pointer targets. Action labels use title case, roots retain editorial uppercase. **New** replaces Add. Manage is hidden only in Edit mode; Done returns access to settings. The independent folder-review notice remains available.
- Root tabs use their measured full width. When they cannot fit, one current-root selector lists every root in its original order, including All bookmarks. It keeps full accessible names and transfers focus when responsive presentation changes. Very narrow widths use two intentional rows. Alt+Number, search query/selection, root scroll reset and original Escape restoration remain; Alt shortcuts also work with focus on the closed selector. Native dropdowns get their own Escape first.
- Context menus use normal 16px sans-serif/case/spacing and clamp their measured surfaces inside the viewport. They do not inherit navigation casing or tracking.
- Authored modal actions share a separated footer: Cancel is a semantic text-style button at the left, the affirmative action at the far right, alternatives immediately before it. Destructive actions are distinct. Dirty confirmation puts Continue editing before Discard changes; initial focus is safe. Enter preserves focused button/select/widget behavior, otherwise activates the enabled affirmative action. Escape respects open native selects/child popups before handling one dialog layer. IME and duplicate submissions remain guarded. Native browser bookmarklet/legacy Manage confirmations remain native, not reskinned.
- Edit/New favorite URL fields are single-line text inputs, retaining the existing supported-scheme validation. Ordinary URL line breaks follow text-input/URL normalization. Opaque multiline bookmarklet **pastes are explicitly rejected**, never silently flattened. An already stored multiline bookmarklet stays exact when unrelated fields are saved; explanatory text notes that its line breaks are not visible in the single-line field. Preparing a single-line replacement is deliberate, not an automatic code transformation.
- Move placement starts with **Start**, **End**, then nonredundant **Before [item]** options in native order with IDs for duplicates. Unavailable/no-op choices are disabled. Hidden siblings remain in native indexing; Start/End mean the complete native parent order. Search still uses Move rather than positional dragging.
- Full real favorite/folder/section titles initiate pointer dragging in Edit mode after the existing deliberate threshold. Clicks below the threshold still navigate/toggle. Glyphs are inert indicators/pointer surfaces, not buttons or Tab stops. Completed/cancelled drags suppress their following pointer click, without swallowing later keyboard/menu activation. Normal browsing retains native selection/navigation.
- Positional targets are canonical Before-next/End; equivalent After targets are not shown. No-op marks are suppressed. Before marks precede the title's first fragment; End follows the complete item/actions or the section boundary. Hidden trailing siblings are explicitly covered by “native order, including hidden items”. Inside-folder feedback stays distinct. Existing temporary expansion, edge scroll, cancellation, peek suspension and metadata move validation remain.
- **More → Delete…** is available for permitted real favorites/folders/sections. Confirmation shows name/path and all descendant folder/favorite counts, including archive-hidden nodes. It explicitly deletes native Edge Favorites and propagates through browser sync, not archive; no Undo is promised. Safe initial focus is Cancel.
- The existing typed delete service now supports a confirmed subtree token. It checks capability, identity, generation, metadata integrity and the complete native subtree, then removes individual nodes leaf-first. `removeTree` is never called. Changed/new descendants require refreshed confirmation. Every step checks the remaining subtree; native empty-folder removal refuses newly arrived children. Existing `removed`/pending-deletion/tombstone reconciliation handles metadata, without new schemas or guessed identities.
- Partial deletion explicitly reports the count of confirmed native removals. It retains the remaining native items and offers Reconcile metadata. It never recreates deleted items or blindly retries the original subtree. A changed summary must be reviewed again; successful deletion updates ordinary snapshot-derived search/visibility/counts/footer geometry and restores visible focus.

Implementation commits: `5456f35` (navigation/modal), `f360308` (title dragging/canonical positions), `e29875e` (deletion/recovery/regressions).

## Verification and evidence

`npm run check` passed **229 tests / 19 files**, TypeScript, lint, production build/version/public-ID verification. Tracked `dist/` is 0.1.22; extension ID remains `nfhbegeoeafnpejpjdljhgagefbpafal`.

- New service/browser tests cover full confirmed subtree deletion, archived descendants, root/managed/integrity restrictions, changed descendants, mid-operation arrivals, pending cleanup/reconciliation, and single-node empty-folder guards with no `removeTree` calls.
- `check-022.mjs` uses actual pointer/keyboard/clipboard input in both themes: computed navigation sizes, menu isolation, responsive focus/root/query restoration, native select Escape and focused Cancel Enter, single-line URL/paste handling, placements, title dragging/click suppression, End markers, safe Delete focus, stale summaries, failed deletion retry, and descendant removal in disposable fixture trees.
- Existing creation/move, drag lifecycle, navigation, repeated-Escape, editing, binding review, folder/inheritance/archive, appearance and footer scripts pass. Tests were updated only where the specification changes access (Done before Manage), action order (Save is now last), single-line entry or responsive root selection. Desktop combined sticky rows measure **98px** in ordinary browse/Edit; wrapping/search/notices grow as needed.
- Captures were visually inspected in light/dark and narrow layouts. See [0.1.22 evidence and changed files](visual-review/generated/0.1.22-review.md). These are isolated Chromium fixtures using the real UI/service plus browser/storage doubles, **not new native Edge acceptance or fresh Microsoft deletion-sync evidence**. No unrelated live Favorites or profiles were used.

## Limits

Native deletion and metadata cleanup are not atomic. Large subtrees entail individual removals and existing storage writes; quota/failure or concurrent changes can stop after a partial result. Read the reported count, reconcile, then review remaining content explicitly. Tokens and per-step checks reject detected races, but Edge APIs provide no compare-and-swap transaction with external changes between the last read and native call. Empty-folder removal will not recursively remove a newly added child. Existing draft/creation-receipt recovery limits remain; no guaranteed draft recovery after closure/reload and no silent rollback.

Native OS popup rendering, browser zoom and real Edge drag behavior still require the targeted review. Native bookmarklet and legacy Manage confirmations retain browser-controlled presentation. Creation receipts, metadata schema, sync transport, preferences, permissions and public key are unchanged. Bulk operations, copying, cross-tab/external drops, thumbnails, semantic search and broader Manage cleanup remain deferred.

## Edge review checklist — disposable items only

1. Confirm 12px navigation and normal-case menus. Resize/zoom through tabs → root selector and back; test full names, All bookmarks, Alt+Number, focus, Search/Done/New and Review. Leave Edit to reach Manage.
2. Edit/Create/Move/Review: check footer action order, Enter in fields versus focused Cancel/select, dropdown Escape, dirty Escape → Continue editing, and single-line URL editing/bookmarklet confirmation. Check light/dark and narrow layouts.
3. Drag long/wrapped favorite titles, folder titles and real section titles. Check ordinary clicks, no navigation after drag/cancel, Before/End markers outside all actions, hidden siblings, inside-folder intent and keyboard Move Start/End. Briefly exercise edge scroll and final-section peeks afterward.
4. More → Delete on disposable favorite/subfolder/section: Cancel/Enter must be safe; verify descendant counts (including archived descendants), clear native deletion warning, visible focus/context after success. If a test item changes while confirmation is open, require a new summary review. Do not corrupt live metadata to induce failures.
5. Use the [short two-device deletion check](cross-device-test.md). Earlier creation/move sync checks are accepted and need not be repeated wholesale. New deletion propagation is pending.

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
