# Development State

Last updated: 2026-10-04
Current branch: `feature/bookmark-editing`. Browser-review build: **0.1.16**.
Validated MVP: `1217369dd10638942d80107d5f33d7f61491d075`, unchanged on `master`, `archive/mvp-validated-0.1.1` and annotated tag `mvp-validated-0.1.1`.
Accepted visual checkpoint: annotated **`ui-validated-0.1.15`**, targeting **`0e6a596210b2be2d273eab4a19d2268d9a1407a1`**. `feature/ui-ux-redesign` remains at that checkpoint; editing branched directly from it. No push.

## Current checkpoint and next action

**Next action: native Edge review of the first catalogue editing increment, 0.1.16. Stop here.** Reload the existing unpacked extension at `edge://extensions`, verify **0.1.16**, then open a fresh New Tab. Use tracked `dist/`; development/build/testing remains WSL `/home/dev/projects/bc-better-bookmarks`. Supplied media and the Windows clone are untouched.

The user confirmed **all requested native Edge checks passed for 0.1.15**, including Light/Dark/System appearance and footer/peek behavior. The visual phase is closed. This is user-reported native evidence, not new cross-device synchronization evidence. The 0.1.13 safe temporary-space cleanup and 0.1.14 final-section hover retention remain intact.

## Implemented editing increment

- Quiet **Edit** navigation control becomes **Editing · Done**. Mode is transient; a fresh dashboard starts browsing. Real Favorites in open sections, expanded folders and search results become single keyboard targets for editing; destinations are absent in this mode, including modifier/middle-click paths. Folder/section/root/search navigation remains available. Peek contents remain inert.
- Native modal with visible Title, URL and comma-separated Tags labels, read-only folder path and Save/Cancel. Title initially focused; explicit Tab wrapping supplements native background inertness. No backdrop dismissal. Dirty Cancel/Escape offers **Discard changes / Continue editing**; unchanged forms close immediately. Background shortcuts and dashboard-search commands are blocked without consuming/replacing the draft. Background peeks cancel, while safe footer-space support remains available.
- Modal does not rewrap the catalogue or move document scroll. Existing scrollbar space is preserved only when present; overlay-scrollbar platforms do not gain a new gutter. Selected Favorite has a subtle theme-aware highlight. Both accepted themes and narrow layouts supported.
- Shared field validation comes from `src/core/link-input.ts`, extracted unchanged from the service rules: required trimmed title, existing URL policy and tag normalization/limits. URL remains a textarea, preserving bookmarklet code. Every bookmarklet save still calls `confirmLinkInput`; no persisted confirmation. Manage reuses the same confident-mapping tag lookup.
- The editor sends the existing typed **edit** command with the captured `editToken` and original parent. The worker queue, stable identity, health/preflight/journal/sync path and all permissions/schemas remain unchanged. Browse scope never grants write access: select an editable mutation scope in **Manage** if needed. Managed/out-of-scope Favorites cannot be saved.
- Save is guarded against duplicate submissions. Errors retain the modal/draft. Live external title/URL/folder/tag changes and deletion are detected against the original token; stale drafts are never automatically rebased or recreated. The service independently rechecks before mutations. After confirmed success the existing snapshot refresh updates the catalogue, Edit mode remains active, and focus returns after dialog teardown. If the item no longer matches search, focus returns to its unchanged query; a polite status announces success. Scope, expansion and original pre-search Escape snapshot survive.

## Verification

`npm run check` passes typecheck/lint, **194 tests / 15 files**, build/version consistency and unchanged extension ID **`nfhbegeoeafnpejpjdljhgagefbpafal`**. Package/lockfile, public manifest and tracked `dist/` are **0.1.16**.

- New unit checks cover browse/edit semantics, one non-navigating selection target, original-parent/token capture, title/URL/folder/tag/deletion conflicts, mutation scope/managed restrictions, shared validation, normalized tags and explicit bookmarklet confirmation. Existing service metadata-health, stale-edit, identity, partial-write and synchronization tests still pass.
- `node scripts/check-editing.mjs`: real App plus real `DashboardService` and metadata repository over isolated synthetic browser ports. Chromium light/dark: modifier/middle/keyboard activation, Tab wrap, initial/return focus, backdrop and wheel isolation, no modal-induced reflow, dirty confirmation, blocked dashboard-search command/root shortcuts, validation errors, failed save, duplicate submission prevention, title/URL/tags save, unchanged parent, bookmarklet cancel/confirm, external rename/move/deletion, missing-metadata and scope guards, theme changes with a draft, matching/disappearing search results, original Escape/root/folder restoration, active-preview cancellation, narrow layouts and transient mode on reload. No real Favorites are touched.
- Existing `scripts/check-appearance.mjs` passes, including Manage draft protection and search restoration. Existing `scripts/check-peek-scroll.mjs` passes actual wheel/pointer repeated-cycle checks (light and dark), including final hover, safe space cleanup and search/Escape. These are Chromium fixtures, not native Edge acceptance.
- Light/dark desktop and narrow modal captures under `docs/visual-review/generated/0.1.16-*`; representative renders were inspected with the image viewer. Prior supplied and generated review media are preserved.

## Limits and reuse decisions

This authorized modal supersedes the earlier preference for inline editing **for this first increment only**. No suitable existing custom dialog was available; native dialog supplies top-layer/background isolation, supplemented with explicit focus wrapping. No UI framework or dependencies added.

The existing mutation-root setup remains required and independent of browse scope. Metadata-health errors may only become known on the service preflight; their full errors appear in the retained modal. Browser and metadata writes are still separate operations: a late storage/remote failure can partially save native fields. The draft remains, but a resulting stale token blocks blind retry; copy needed text, cancel and reopen to review current values. No new recovery or overwrite facility is introduced. Drafts are memory-only; no recovery across tab closure/reload is promised. Externally changed/deleted drafts can be copied but are not auto-merged. No new native Edge or cross-device sync verification is claimed for 0.1.16.

## Edge review

1. Confirm 0.1.16. Normal Favorite clicks still navigate; Edit → click/Enter/Space opens the modal. Modifier/middle activation must not open destinations. Done restores browsing. Expand folders and change roots in Edit mode.
2. Edit title, URL and comma-separated tags; Save updates the catalogue and stays in Edit mode. Check the real Favorite and tags. Invalid fields show nearby messages. If blocked by scope, configure the existing mutation scope in Manage.
3. Cancel/Escape unchanged closes; dirty offers discard/continue. Backdrop clicks, Tab/Shift+Tab and Ctrl+Shift+B must retain the draft and modal. Verify title focus, background isolation, return focus, stable scroll and no rewrapping.
4. Edit a search result so it still matches, then one so it disappears. Query/scope remain; Escape after closing the modal restores the original root, section/folder and scroll state.
5. While editing, change/move/delete the Favorite in Edge Favorites or another dashboard. Expect a retained draft and conflict, no silent overwrite/recreation. Check failed-save text if an existing safe blocked-metadata test case is available; do not damage metadata to manufacture a failure.
6. Inspect Light/Dark and narrow views, selected-item highlight, keyboard focus, normal footer/peek interaction and long-card context. Manage remains available. Accepted address-bar/Ctrl+F6 and Alt+numpad behavior are unchanged.

Folder editing, move/delete UI, bulk selection, drag/drop, thumbnails, semantic search, folder tags and synchronization changes remain deferred. Do not start another increment before review.

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
