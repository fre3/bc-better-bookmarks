# Development State

Last updated: 2026-10-06
Current branch: `feature/bookmark-editing`. Browser-review build: **0.1.17**.
Validated MVP: `1217369dd10638942d80107d5f33d7f61491d075`, unchanged on `master`, `archive/mvp-validated-0.1.1` and annotated `mvp-validated-0.1.1`.
Accepted visual checkpoint: annotated **`ui-validated-0.1.15`** targets **`0e6a596210b2be2d273eab4a19d2268d9a1407a1`**; `feature/ui-ux-redesign` remains there. No push; supplied media and Windows clone untouched.

## Current checkpoint and next action

**Stop for native Edge review of 0.1.17.** Reload the existing unpacked extension at `edge://extensions`, verify **0.1.17**, then open a fresh dashboard. Use committed `dist/`; development/build/testing stays WSL `/home/dev/projects/bc-better-bookmarks`. Do not run a live metadata reset casually: read [the coordinated export/setup procedure](metadata-setup.md) first.

The user confirmed all requested native Edge checks for 0.1.15, including appearance/footer/peek. The user reports Favorite editing works in 0.1.16; this is not comprehensive acceptance of its untested cases. No new native Edge or Microsoft synchronization acceptance is claimed for 0.1.17.

## Implemented increment

- Shared modal now edits real folders/subfolders, including first-level section folders: Name, direct Tags, read-only parent and inherited sources. No URL field. Separate small Edit actions keep section/folder opening available; synthetic Bookmarks sections, browser-owned roots and managed nodes are not editable folders. Restrictions derive from existing capabilities and mutation scope.
- Favorite title/URL/direct-tag editing remains. The same field normalization/limits, bookmarklet confirmation, token checks, metadata health, journal, queue and synchronization paths serve both editors. Only direct tags are submitted. Background commands/shortcuts, dirty Cancel/Escape, focus trap/return and memory-only draft policy remain.
- Schema2 metadata/history handles Favorite and folder UUIDs. No browser-local ID or mutable path is a synchronized identity key. Existing Favorite UUIDs remain until a deliberate reset; unchanged records are not rewritten. Folder locators are candidate evidence only. Known local bindings retain rename/move history; unbound devices need consolidated explicit confirmation in Manage, even for one matching folder. Ambiguous/missing/competing records stay unresolved; copies never auto-bind. Inheritance cannot safely apply before binding.
- Direct/inherited/effective tag projection keeps all source paths. Ancestor tags apply to folders and Favorites, recomputing on snapshots/external moves with no descendant writes. Plain and #tag search use effective tags and can match user folders; original AND/root/@ semantics remain. Search counts include matching folders and Favorites, excluding nonmatching ancestry displayed only as context.
- Favorite inherited tags are bold; favorite-only direct tags regular; folder tags all bold; duplicates display once. Hover/focus and explanatory search visibility, first-line/no-reflow anchoring, accepted limited favicon-frame overlap and existing leading remain. Editors explain sources and that deleting a direct assignment cannot negate inheritance.
- Effective normalized `archived` excludes a node/subtree everywhere: browse/search/Edit/Manage lists, counts, previews, Next summaries and final-visible-section geometry. `hidden` and `nosearch` have no behavior. Device-local **Show archived**, default off, updates open tabs and is the sole override. Shown archived nodes have a restrained indicator; editors warn before Save. Archiving does not alter native Favorites. Query/scope and original Escape snapshot remain; current archive visibility still applies on restore.
- Precise late-failure reporting lists completed native title/name, URL or location changes and says tag persistence is unconfirmed. Draft input remains. Explicit review shows current values, then allows adopting a fresh save baseline before retry; safeguards still block missing/quarantined/deleted identities. Recovery adopts the reviewed current parent, so an external move is not silently reversed. Native and metadata stores are **not atomic**. No rollback, silent rebase or automatic recreation.
- Deliberate test metadata setup replaces a complex tag-preservation migration, as authorized. Export raw owned metadata plus local identity/journal backup and inspect key inventory on every device before reset. Reset touches only meta/loc/dead, setup generation, mappings/pending deletions/journal; preserves native tree, appearance/archive/peek preferences and mutation scope. New generations invalidate stale caches/mappings and ignore late old metadata; old clients must stay disabled until upgraded. No live reset was performed. See [workflow, inventory and identity limitations](metadata-setup.md).

## Verification

`npm run check`: typecheck/lint, **205 tests / 16 files**, build/version check and unchanged extension ID **`nfhbegeoeafnpejpjdljhgagefbpafal`**. Package/lock/public manifest and tracked `dist/` are **0.1.17**. No permissions/dependencies added.

- Unit/service tests: empty/nested folders; root/stale/missing metadata guards; rename/move/copy, distinct-device candidate confirmation, ambiguity/deletion; unchanged Favorite records; multi-source dedup/removal and real subtree moves; ordinary hidden/nosearch; effective-tag search/archive gate; native partial progress/retry; bounded metadata reset/native-data invariance/preference retention/second-device cache invalidation; interrupted reset/stale drafts; old parser quarantine and late-generation suppression. Existing functional suite retained.
- `node scripts/check-folders.mjs`: isolated real App/service/repository on synthetic browser ports. Light/dark desktop/narrow: folder and nested editors, direct-only saves, inherited sources/bold/dedup, item-local/no-reflow annotations, effective search, direct/ancestor archive with independent descendant preservation, Edit/Manage filtering, cross-tab/persisted Show archived, partial recovery, dirty/keyboard/modal command isolation. Private backup download and deliberate reset verified only against synthetic stores, comparing full native tree JSON. Consolidated binding review, archived-name exclusion from Next, last-visible-section hover and recomputation after preference changes pass.
- `node scripts/check-editing.mjs` passes both themes after sharing the isolated fixture: activation, modal focus/restoration, background isolation, validation, failed/duplicate/success saves, dirty protection, external conflicts, scope/metadata guards, matching/disappearing search edits and Escape restoration, narrow layouts/transient mode.
- `node scripts/check-appearance.mjs` passes appearance/state/draft regressions. Existing `scripts/check-peek-scroll.mjs` passes light and dark actual pointer/wheel repeated cycles, final-surface retention and callback cleanup (including reduced motion/narrow views). No footer lifecycle algorithm changed. These are automated Chromium observations, not native Edge or two-device sync evidence.
- Captures/reports: `docs/visual-review/generated/0.1.17-*`. Light/dark folder modal, inherited annotations, narrow modal and filtered final peek were inspected with the image viewer. Private/synthetic metadata backups are not committed.

## Limitations and decisions

Mutation scope remains separate from browse scope. Set a writable root in Manage when needed; the new modal does not broaden authority. No new permissions, native create/move/delete UI, automatic metadata recovery or metadata import are introduced. Ambiguous folder bindings need evidence/manual review; an unbound copy matching a bound record must first be distinguished through Edge Favorites before tagging; the current UI cannot safely repair unknown identity. Local ID/date evidence and locator history do not guarantee identity after unobserved recreation. Mixed-version writers are unsupported: upgrade all devices and follow setup sequencing. Synchronization has no cross-device transaction/acknowledgement; sequential native validation is still required.

Long annotations can clip at the viewport; all inherited sources remain readable in the editor. Limited annotation/frame overlap is accepted; title overlap is not. Metadata backups/debug diagnostics can include archived/private records and are not a privacy boundary. Drafts are not guaranteed after reload/closure. Settings changes do not save/discard drafts. No comprehensive Edge acceptance is inferred from Chromium fixtures.

## Edge review

1. Confirm 0.1.17. In Edit mode, open real section/nested-folder editors via separate Edit controls; opening/expansion still works. Roots and synthetic Bookmarks groups have no folder editor. Test Favorite title/URL/tags and folder Name/direct tags in both themes/narrow views.
2. Add overlapping tags at multiple ancestor levels. Verify direct-only editor values, source paths, bold inherited/no-duplicate annotations, hidden at rest, and plain/#tag/mixed search including folders. Move a test subtree through Edge Favorites and inspect updated inheritance.
3. Archive a test folder and an independent descendant. With Show archived off, check browse/search/Edit/Manage, counts/Next/previews and footer. Enable it, restore the ancestor, disable again: the independently archived descendant stays excluded. #archived does not bypass the setting. Check local persistence and two dashboard tabs.
4. Verify Save, unchanged/dirty Cancel/Escape, focus return, preserved query/root/expansion and original Escape restoration after results disappear. Ctrl+Shift+B cannot replace a draft. External native changes/deletion should retain input and reject stale saves. If a real safe failure occurs, review precise partial-save feedback/current values; do not corrupt storage just to induce one.
5. Exercise final visible section hover/wheel, pointer traversal, safe footer cleanup, auto-scroll toggle/reduced motion and themes. The accepted address-bar Ctrl+F6 fallback and Windows Alt+numpad behavior remain.

Perform the **separate [native two-device checklist](metadata-setup.md#native-two-device-review-pending)** for controlled reset, folder binding/transport, inheritance and independent Show archived preferences. Do not report it passed from local tests.

Semantic search, thumbnails, new move/delete/create UI, bulk operations, drag/drop, Manage reorganization and recovery/import remain deferred. Stop for review; do not create another branch or push.

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
