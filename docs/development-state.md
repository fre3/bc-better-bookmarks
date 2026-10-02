# Development State

Last updated: 2026-10-02
Current branch: `feature/ui-ux-redesign`. Current browser-review build: **0.1.4**, source/artifact commit `94f6a2f` (sheet composition and annotation correction pass).
Validated functional baseline: `1217369dd10638942d80107d5f33d7f61491d075` (0.1.1 source/artifact plus completed handoff), preserved by `master`, `archive/mvp-validated-0.1.1`, and annotated tag `mvp-validated-0.1.1`. None of those references are advanced by the redesign.

## Current checkpoint and next action

The user accepted search, root/scope behavior and runtime stability in the 0.1.2 Edge review, then accepted downward pointer traversal and card-switch context preservation in 0.1.3. The focused 0.1.4 pass corrects collapsed-label position, hides the separate derived HTTP/status annotation path at rest, and finishes peek with an opaque presentation of the following sheet and its transparent upward shadow. All three approved mockups and corresponding current renders were visually inspected before source changes; the supplied Edge screenshot identified the HTTP failure. Catalogue flow, typography/leading, expansion state, search and accepted interactions are retained.

**Next action: user-controlled Edge visual review of 0.1.4**, comparing collapsed, peek and open states to the supplied references. Use the focused checklist in `ui-ux-design.md`. No Edit-mode work until that review. Synthetic captures and measured results are in `docs/visual-review/generated/`; the supplied reference images/Edge media remain local and untracked.

The browsing/search foundation remains the only implementation scope; **stop for user visual review before implementing Edit mode/inline CRUD**. The catalogue has dynamic All bookmarks/root navigation, ordered folder/loose-bookmark sections, typographic items, inline nested expansion, hover/focus tags, collapsed/peek/open cards, the supplied dither shadow, and keyboard-first filtered search. Browse scope remains separate from the saved mutation scope. Existing MVP management/diagnostics remain available behind Manage. Folder tags and drag/drop are deferred; sync, metadata, search and persistence architecture are unchanged.

The authoritative development checkout is **WSL `/home/dev/projects/bc-better-bookmarks`**. Dependencies, builds, automated tests and repository changes run there. A Windows checkout is only a clone and must not be assumed to contain the toolchain. This supersedes the prior native-Windows-only handoff. Windows Edge loads the generated artifact; no Windows clone was modified.

See [ui-ux-design.md](ui-ux-design.md) for implementation decisions, favicon documentation, exact load instructions and the manual visual checklist. The first-level expansion ending defaults to inline and remains a one-setting/DOM-attribute comparison. No Edit-mode redesign is authorized until this checkpoint's visual review. No push has been made.

## Current verification and artifact

Node 24 in WSL; `npm ci` completed. `npm run check` passes: typecheck, lint, **137 tests across 8 files**, production build and deterministic extension identity check. New automated coverage exercises root/loose-section ordering, mixed-query filtering/ancestry, tag explanations, browse/search state, keyboard-key classification, markup semantics, inert collapsed content and safe favicon URL construction. Existing functional tests remain unchanged.

Versions in package, lockfile and source/generated manifests are **0.1.4**. `dist/` is regenerated and tracked with source. Public manifest key/development ID remain unchanged: `nfhbegeoeafnpejpjdljhgagefbpafal`. The existing `favicon` permission remains unchanged in this correction pass; no external favicon service or host permissions. SVG artwork is byte-identical to the supplied file, now in `src/ui/assets/shadow.svg`.

These are local automated checks, **not Edge visual acceptance or Microsoft sync evidence**. The WSL synthetic Chromium harness and focused failure-case checks pass. In the HTTP-heavy fixture (103 status annotations), pointer outside the catalogue and focus on Search produced **0 visible annotations**; own hover/focus each produced **1**; blur produced **0**; a tag query exposed **1 relevant tag explanation** without HTTP; Escape restored **0**. The overlay is a single 10px line (intentional reduction from the original approximate 12px target). At the captured Linux font metrics it has 2px clearance above and about 4.4px below without changing catalogue leading. Actual Windows font rendering still needs review.

Collapsed sheets measure 70px; label text spans 26–44px, leaving 6px before the following shadow's 20px box. Peek retains 2.5 line boxes, no reflow and pointer passthrough; the opaque following-sheet lip meets the preview boundary and owns a transparent upward shadow. Its repeated label is inert/aria-hidden visual composition, not a second interactive header; actual header hit targets remain at their original flow positions. The last section uses a blank opaque cap with no invented following label/shadow. This appearance and hit-target compromise needs Edge review. The SVG is unchanged.

The broader rendered checks retain inline flow, icon grayscale/color, sibling branch replacement, search restoration, natural/peek stacking and card-switch visibility. Focused checks also cover 390/1280/1920px horizontal overflow. No page errors were reported. Final collapsed/peek/open/annotation captures were inspected and saved with measurements; temporary runnable fixtures remain under `/tmp/bb-catalogue-browser-check`. No project dependency was added. The completed real Edge functional/sync session below remains accepted and has not been reopened.

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
