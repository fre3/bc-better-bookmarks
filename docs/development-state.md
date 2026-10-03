# Development State

Last updated: 2026-10-03
Current branch: `feature/ui-ux-redesign`. Browser-review build: **0.1.8**, command/source/artifact commit `a100a46`; slash-wrapping commit `79cd44f`.
Validated baseline: `1217369dd10638942d80107d5f33d7f61491d075`, unchanged on `master`, `archive/mvp-validated-0.1.1` and annotated tag `mvp-validated-0.1.1`.

## Current checkpoint and next action

**Next action: user Edge review of 0.1.8.** Use [keyboard-search.md](keyboard-search.md) for assignment, exact load instructions, focus limitations and the eight native checks; use [ui-ux-design.md](ui-ux-design.md) for catalogue decisions. Stop before more refinement or Edit mode. No push was made.

This checkpoint adds the browser-scoped `open-dashboard-search` command, description “Open dashboard in search mode”, suggested **Ctrl+Shift+B on Windows** (confirmed by the user). The actual assignment is read via `commands.getAll()` and displayed in Manage; unassigned shortcuts are never restored. Native Edge assignment is not observable here. The confirmed fallback is **Ctrl+T → Ctrl+F6 → type**; ordinary Ctrl+T is unchanged.

The router prefers the current dashboard, then another in the invoking window, then creates an active explicit search page in that window. It preserves the website, coalesces overlapping commands and uses a page-ready handshake plus session-only pending request to survive worker suspension/loading. Leaving the target cancels pending focus. Manage/active saves block the shortcut with a notice, preserving drafts. Existing query selection, root and catalogue state use the existing search/reducer semantics.

A small explicit renderer-navigation route handles New Tab's browser-owned focus. A one-shot tab-local sessionStorage handoff preserves query/root/expansion and Escape scroll/focus state when navigation is needed; ordinary New Tab never starts this route. This is transient UI state only. No bookmark, metadata, sync or mutation architecture was replaced.

**Known limitation:** isolated Chromium still sometimes retained address-bar typing when the command was invoked again from the address bar of an already-open explicit search page, despite query selection and route navigation. Ctrl+F6 remains the fallback. Fresh New Tab command and website launch accepted actual native typing in the local test. None of these local results establishes native Edge success; all eight Edge checks remain pending.

Slash wrapping: visually inspected `release 0.1.7 - symbol hypenation 1.png` and `release 0.1.7 - symbol hypenation 2.png` before editing. Bookmark titles now offer breaks immediately after `/`, retaining the slash on the preceding line; scheme delimiters such as `https://` are kept together. Breaks are optional and preserve exact stored/copied title text and destination URL. Folder-label decorative slashes are untouched. Underscore/hyphen behavior, annotations, underlines and focus are retained. The user **accepts the current observed English/German hyphenation behavior**; no language detection/assignment work is scheduled.

Accepted 0.1.6 decisions remain: main/nested font + 14px leading, fixed nested 85% scale, measured opaque peek coverage, 140ms/90ms peek and 220ms open reveal. Limited readable annotation/frame overlap remains accepted, but bookmark-text overlap does not. Folder tags, auto-scrolling, thumbnails, Edit-mode redesign, drag/drop and sync changes remain deferred. Existing management stays behind Manage.

## Verification and artifact

Authoritative checkout/tooling: **WSL `/home/dev/projects/bc-better-bookmarks`**. No Windows clone changed. `npm run check` passes: typecheck, lint, **159 tests across 9 files**, production build/version checks and unchanged extension ID `nfhbegeoeafnpejpjdljhgagefbpafal`. Package, lockfile and source/generated manifest versions are **0.1.8**. `dist/` is regenerated/tracked, now with shared Vite chunks for index/search pages. Dependencies, public key, supplied SVG and bookmark/metadata/search/mutation logic are unchanged.

The single added permission is **tabs**, for current-window URL/pendingUrl identification of loading/discarded explicit dashboards. Own live New Tab contexts are recognized through `runtime.getContexts`. No website scripts, host access, activeTab, history or global-shortcut permissions. See keyboard-search.md for the discarded virtual-New-Tab identification constraint.

Unit coverage tests routing, duplicate prevention, new-tab readiness, cold worker requests, cancellation, Manage-blocked requests, error recovery, actual/unassigned assignment reporting and transient handoff validation. Existing functional tests are retained.

Isolated WSL Chromium with native X11 keyboard input passed fresh New Tab typing, explicit new-dashboard typing from a website, query replacement, root/expanded-branch Escape restoration, Manage draft preservation, website preservation, reuse, rapid invocation and command-driven cold-worker restart. The temporary test copy assigned Linux Ctrl+Shift+Y; the shipped Windows suggestion remains Ctrl+Shift+B. No native Edge assignment or success is claimed. A separate Linux Ctrl+Shift+B probe returned unassigned.

Rendered slash checks pass at 320/390/700/1100/1500px: actual optional breaks after slash, scheme unit intact, exact selected title/destination URL, full underlining and no horizontal page overflow. A representative capture and synthetic reports are in `docs/visual-review/generated/0.1.8-*`. Supplied screenshots/videos remain untouched/untracked. Temporary scripts are under `/tmp/bb-catalogue-browser-check`.

Earlier 0.1.7 layout evidence remains in the design document and generated captures. Native Windows fonts/zoom and real-data catalogue appearance remain user-controlled visual evidence. This session did not reopen completed functional or cross-device testing.

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
