# Development State

Last updated: 2026-10-06
Current branch: `feature/bookmark-editing`. Browser-review build: **0.1.20**.
Validated MVP: `1217369dd10638942d80107d5f33d7f61491d075`, unchanged on `master`, `archive/mvp-validated-0.1.1` and annotated `mvp-validated-0.1.1`.
Accepted visual checkpoint: **`ui-validated-0.1.15`** and `feature/ui-ux-redesign` remain at **`0e6a596210b2be2d273eab4a19d2268d9a1407a1`**. No push; supplied media and Windows clone untouched.

## Current checkpoint and next action

**Stop for targeted native Edge review of 0.1.20.** Reload the existing unpacked extension at `edge://extensions`, verify **0.1.20**, then open a fresh dashboard. Use committed `dist/`; no metadata reset or native bookmark mutation is part of this upgrade. Development remains WSL; no push.

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

## Implemented 0.1.20

- Administrative identity review and counts include archived, ambiguous and missing-candidate records independently of Show archived, root, query and Edit mode. Ordinary catalogue/search/Manage listings remain filtered.
- Persistent compact “Folder tags need review (N) — Review” notice updates through existing startup/snapshot notification paths. Background arrival never opens a modal, steals focus or discards drafts. Unchanged counts retain the same status text.
- Dashboard Review and affected-folder Edit open the same native modal binding workflow that Manage embeds. It shows local paths, proposed read-only tags/archive state, candidates and full identity details. Nothing is preselected. Ambiguous/competing/missing/restricted cases cannot be confirmed by guessing. The unchanged worker command retains generation/token/integrity/uniqueness checks.
- Confirmation only writes the local association, reconciles received metadata, updates inherited/archive visibility and counts, closes the dialog and announces success. Archived proposals explain Show archived before confirmation. A hidden/removed return target falls back to visible navigation. Failure retains selected associations; changed candidates require explicit reselection. Repeated error prefixes are stripped for display.
- An already-open editor losing identity keeps its draft, locks fields/save, and can open review above it. After resolution it requires explicit review of refreshed name/tags and acknowledgement before keeping unsaved input. There is no automatic save, reset or guaranteed draft recovery after browser closure.
- Native sticky geometry replaces scroll-triggered height switches/reservations. Stable controls and heading rows keep their dimensions; surrounding whitespace scrolls away naturally in both directions. JavaScript observes actual sizes only. Desktop combined rows are about 96.4px in browse/Edit; search, review notices and narrow layouts grow as necessary. No scroll forcing or new animation.
- Chevrons occupy the left gutter; titles align with navigation/catalogue text, including wrapped headings. Ordinary single-line collapsed sheets and hit areas remain 85px. Title tags, Edit spacing, expansion semantics and footer lifecycle remain.
- No worker persistence, sync transport/schema, permission or live metadata changes. No separately proven mapping-persistence defect; isolated confirmation survived repository reconstruction and dashboard reload.

## Verification

`npm run check`: typecheck/lint, **215 tests / 18 files**, build/version/extension-ID checks passed. Tracked artifact is 0.1.20; ID remains `nfhbegeoeafnpejpjdljhgagefbpafal`.

- `check-binding-review.mjs`: proactive startup/metadata-arrival notice with archived record while Show archived is off; same read-only review from Edit; explicit selection, cancellation, failed confirmation/retry, deleted/stale candidates; immediate archive/count updates; retained dirty editor, blocked Save and explicit rebase; preserved Manage draft; local association across reload/repository reconstruction. No live profile used.
- Shared helper tests distinguish unresolved/ambiguous/competing/missing/restricted/already-bound states and genuinely untagged folders. Existing service tests continue to validate worker attachment safeguards.
- `check-navigation-followup.mjs`: real wheel/pointer/keyboard input, light/dark, browse/Edit/search, root reset and original Escape scroll/query selection, sticky frame sampling across attachment/detachment, stationary-pointer stability, unchanged section document positions, gutter alignment, narrow/125% CSS zoom, tags and forced-colors emulation. No frame moves navigation/headings farther than actual scroll travel.
- Existing favorite editing, folder/inheritance/archive, archive-checkbox, repeated-Escape and appearance browser regressions pass. Existing actual wheel/pointer footer regression passes in both themes with repeated delay/active-scroll/leave/reenter/search/keyboard/reduced-motion cycles.
- Generated screenshots/frame reports are synthetic Chromium evidence. Light/dark review, narrow missing-candidate state and compact layouts were visually inspected. This is **not native Edge/Windows acceptance**, fresh Microsoft sync verification or proof of every browser zoom configuration.

## Limits and targeted Edge review

Ambiguous associations remain unresolved rather than guessed. Missing native candidates require reviewing/waiting for Edge Favorites; the modal offers details, not a weaker attachment path. Native edits/tag writes remain non-atomic with existing partial-save recovery. The notice adds a small measured row when review is needed. Narrow layouts may require taller sticky rows. Accepted long-tag clipping/favicon-frame overlap and one-time safe footer-space clamping remain as documented; repeated jitter is not accepted.

1. With a real pending folder record, leave Show archived off: notice and review must still include it. Check startup/reload and later received metadata without interrupted focus/drafts. Do not damage mappings to manufacture a case.
2. Review from the notice, affected folder Edit and Manage. Confirm only a recognized unique association; inspect disabled ambiguous/missing cases. Confirmed tags/inheritance/archive visibility and notice count update without reload. Reopen to edit afterward.
3. Cancel review and reopen. If identity changes during an existing draft, verify retained input, blocked Save and explicit refreshed-state review. Check ordinary Save/Cancel/repeated Escape still works.
4. Wheel slowly through navigation/open-heading attachment and reverse repeatedly in browse/Edit/search. Check stationary pointer, narrow/zoomed layouts, Editing/Done, gutter chevrons and title tags in both themes.
5. Briefly check final-section peek/footer retention, root shortcuts and Escape restoration. No repeat of the entire passed two-device suite is requested: no new transport/schema risk was introduced.

Broader Manage cleanup, create/move/delete UI, bulk operations, drag/drop, semantic search and website thumbnails remain deferred. Native test-subtree deletion propagation remains unconfirmed.

Implementation commits: `fd4db64` (shared folder review) and `386f253` (stable sticky/gutter geometry). Review evidence and final handoff are committed separately.
