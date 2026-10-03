# Development State

Last updated: 2026-10-03
Current branch: `feature/ui-ux-redesign`. Current browser-review build: **0.1.6**, source/artifact commit `9ad280f` (leading, continuous peek coverage and full-open reveal).
Validated functional baseline: `1217369dd10638942d80107d5f33d7f61491d075` (0.1.1 source/artifact plus completed handoff), preserved by `master`, `archive/mvp-validated-0.1.1`, and annotated tag `mvp-validated-0.1.1`. None of those references are advanced by the redesign.

## Current checkpoint and next action

The user has accepted the overall 0.1.5 styling and the 140ms entry/90ms exit peek timing, alongside earlier search/root/scope behavior and card-switch context preservation. This small correction sets main and nested leading to `calc(1em + 14px)`, extends the inert peek copy’s opaque coverage to the next measured intact shadow boundary, and changes full-open content reveal to 220ms ease-out. Final layout/scroll placement remain immediate.

The newly available `top-section-with-shadow.png`, the 9px/12px/14px annotation comparisons, the 14px favicon-overlap example and the peek-bottom artefact were visually inspected before implementation. All supplied images/videos were discovered under `docs/visual-review/` and remain untouched/untracked. The previous missing-reference limitation is resolved.

**Next action: user-controlled Edge visual review of 0.1.6**, using `ui-ux-design.md`. Stop before further refinement or Edit mode. Limited annotation/frame overlap is now an **accepted visual limitation**, provided the annotation is above the frame, readable, does not obscure bookmark text and causes no reflow. Do not increase leading further, shrink annotations or add collision avoidance to remove it.

The browsing/search foundation remains the only implementation scope; **stop for user visual review before implementing Edit mode/inline CRUD**. The catalogue has dynamic All bookmarks/root navigation, ordered folder/loose-bookmark sections, typographic items, inline nested expansion, hover/focus tags, collapsed/peek/open cards, the supplied dither shadow, and keyboard-first filtered search. Browse scope remains separate from the saved mutation scope. Existing MVP management/diagnostics remain available behind Manage. Folder tags and drag/drop are deferred; sync, metadata, search and persistence architecture are unchanged.

The authoritative development checkout is **WSL `/home/dev/projects/bc-better-bookmarks`**. Dependencies, builds, automated tests and repository changes run there. A Windows checkout is only a clone and must not be assumed to contain the toolchain. This supersedes the prior native-Windows-only handoff. Windows Edge loads the generated artifact; no Windows clone was modified.

See [ui-ux-design.md](ui-ux-design.md) for implementation decisions, favicon documentation, exact load instructions and the manual visual checklist. The first-level expansion ending defaults to inline and remains a one-setting/DOM-attribute comparison. No Edit-mode redesign is authorized until this checkpoint's visual review. No push has been made.

## Current verification and artifact

Node 24 in WSL; `npm ci` completed. `npm run check` passes: typecheck, lint, **138 tests across 8 files**, production build and deterministic extension identity check. New automated coverage exercises root/loose-section ordering, mixed-query filtering/ancestry, tag explanations, browse/search state, keyboard-key classification, markup semantics, inert collapsed content and safe favicon URL construction. Existing functional tests remain unchanged.

Versions in package, lockfile and source/generated manifests are **0.1.6**. `dist/` is regenerated and tracked with source. Public manifest key/development ID remain unchanged: `nfhbegeoeafnpejpjdljhgagefbpafal`. The existing `favicon` permission remains unchanged in this correction pass; no external favicon service or host permissions. SVG artwork is byte-identical to the supplied file, now in `src/ui/assets/shadow.svg`.

These are local automated checks, **not Edge visual acceptance or Microsoft sync evidence**. The final WSL Chromium suites pass for main/nested leading, annotation visibility/stacking/no reflow, 2.5-line peeks, continuous opaque coverage through entry/exit, narrow/wrapped headers, rapid pointer traversal, mid-transition clicks, sticky/long-card switching and reduced motion. Existing real-favicon/fallback, title-wrapping and scope/search checks also pass. No browser page errors were reported.

At 1406px, main font/leading measure 46.398/60.398px and nested 39.438/53.438px, retaining the fixed 85% nested scale. Peek measures 150.98px (2.5 main line boxes). The cover now ends at the next real shadow start rather than through a label; its top dither remains transparent. A ResizeObserver runs only while preview content is retained and updates coverage before paint as the body animates or stack geometry changes. The real header targets stay in flow; the visual copy remains inert and pointer-transparent.

Coverage checks sampled **111 entry/exit frames** across desktop, 320/390px widths and zoom-equivalent layouts at 80%, 100%, 125%, 150% and 200%. All sampled boundary gaps were zero, surfaces were opaque, and no partially exposed underlying label remained. Zoom was emulated with CSS viewport size and device scale factor, not the native Edge zoom UI. Windows fonts/native zoom still need user review.

Annotation font remains 10px/10px; zero visible at rest, item-local hover/focus and search explanations preserved. The sampled nested annotation still overlaps one favicon frame, with hit-testing confirming it paints above that frame; settled bookmark rectangles and stack height do not move on reveal. Sampled main/nested/long-title font-metric checks found no annotation/text-ink overlap. This accepts limited frame overlap; it does not claim all overlap is eliminated. The full-open layout is already in flow during the 220ms opacity/3px reveal; no height animation. Reduced motion disables both transition and reveal animation.

Captures and summarized measurements are in `docs/visual-review/generated/0.1.6-*`. Temporary synthetic fixtures/checks remain under `/tmp/bb-catalogue-browser-check`; these use a local Wikipedia favicon, not installed Edge APIs or private Favorites. SVG artwork, dependencies, permissions, worker/core/search/metadata and mutation behavior are unchanged. Auto-scrolling, website thumbnails, Edit mode and drag/drop remain deferred. The completed functional/sync session below remains accepted.

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
