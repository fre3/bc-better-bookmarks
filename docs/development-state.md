# Development State

Last updated: 2026-10-03
Current branch: `feature/ui-ux-redesign`. Current browser-review build: **0.1.7**, source/artifact commit `915ef61` (inline title wrapping, first-fragment annotations and keyboard focus).
Validated functional baseline: `1217369dd10638942d80107d5f33d7f61491d075` (0.1.1), preserved unchanged by `master`, `archive/mvp-validated-0.1.1`, and annotated tag `mvp-validated-0.1.1`.

## Current checkpoint and next action

The user accepted 0.1.6's main/nested `calc(1em + 14px)` leading, measured continuous peek coverage and 220ms full-open reveal. These remain unchanged, alongside 140ms/90ms peek timing, pointer passthrough and immediate card-switch context preservation.

0.1.7 anchors revealed annotations to the first actual rendered title fragment, restores underlining across all title text, permits filename breaks after underscores, removes the atomic whole-final-word wrapper and corrects section/bookmark focus geometry. Only the final grapheme stays with the icon/semicolon; ordinary prose retains normal word wrapping, while oversized tokens can break without inserted hyphens. Stored title text, native links, accessible names and selected title text remain intact.

All seven supplied 0.1.6 reference images (four wrapped-annotation examples, closed/open section focus and first-line bookmark focus) were opened and visually inspected before implementation. They remain untouched/untracked with the other supplied review media.

**Next action: user-controlled Edge visual review of 0.1.7**, using [ui-ux-design.md](ui-ux-design.md). Stop before further refinement or Edit mode. Limited annotation/frame overlap remains an **accepted visual limitation**, provided the annotation paints above the frame, remains readable, avoids actual bookmark text and causes no reflow. No collision-avoidance system or further leading change was added.

Reliable bookmark language is unavailable: the English document language describes UI, and existing bookmark/metadata records contain no content-language field. Title links now declare unknown language instead of inheriting English. Automatic mixed-language hyphenation is **not solved**; see the separately deferred language-assignment proposal in the roadmap. No fetching, language detection dependency, language metadata or permissions were introduced.

The browsing/search foundation remains the only implementation scope. Dynamic roots, source ordering, filtered search, single-branch expansion and bookmarklet safety are retained. Browse scope stays separate from saved mutation scope. Existing MVP management/diagnostics remain behind Manage. Folder tags, Edit mode, drag/drop, auto-scrolling, thumbnails and sync changes remain deferred.

Development uses **WSL `/home/dev/projects/bc-better-bookmarks`**. No Windows clone was modified. `dist/` is the committed loadable artifact. No push was made; the validated references were not advanced.

## Current verification and artifact

`npm run check` passes in WSL: typecheck, lint, **139 tests across 8 files**, production build/version verification and extension identity check. Package/lockfile/source/generated manifest versions are **0.1.7**. Expected ID remains `nfhbegeoeafnpejpjdljhgagefbpafal`. Dependencies, manifest key, permissions, supplied SVG, worker/core/search/metadata and mutation behavior are unchanged. Existing functional tests remain intact.

Focused local Chromium suites pass for:

- First-fragment annotation X and Y (2px below its text box), including mid-line starts, nested 85% type, resize, search and actual asynchronous local font loading. Only visible annotations are measured, with one observer per mounted section; hidden items have no per-item observers.
- Zero resting annotations, item-local hover/focus, deliberate tag-match explanations, unchanged settled item rectangles/stack height on annotation reveal and unchanged geometry when keyboard focus moves.
- Single-word/multiword underlines, exact filename text/selection, underscore break opportunities, long-token wrapping, one semantic link and one Tab stop per bookmark.
- Compact section focus rectangles inside closed/peek/open/sticky headers. Open content reserves 6px above its first line so the opaque sticky header cannot cover its focus outline. Peek depth/leading are unaffected. Native multiline bookmark contours use one consistent inset, avoiding the former detached inline-block outline geometry.
- Rapid peek reversal/downward traversal, mid-transition clicks, 220ms open reveal without height animation, long-card switching, reduced motion and unchanged transparent shadow ownership.
- Desktop/narrow widths (320/390px), wide favicons/fallbacks, and 80/100/125/150/200% zoom-equivalent layouts. Full-sheet horizontal clipping contains cloned inline margin overflow and long annotations without clipping vertical focus contours.

Final coverage measurements contain **109 entry/exit samples**: zero boundary/seam gaps, no partially exposed covered labels, opaque surfaces and inert/non-focusable copies. Main font/leading at 1406px remain 46.398/60.398px; nested remain 39.438/53.438px. Peek remains 2.5 declared main line boxes. Seven sampled title cases have no annotation/text-ink intersection using local font metrics. One representative annotation/frame intersection is retained and hit-testing confirms the annotation paints above it. This does not claim all overlap is eliminated.

Captures and measurements: `docs/visual-review/generated/0.1.7-*`. Temporary synthetic fixtures/checks remain under `/tmp/bb-catalogue-browser-check`. A local test-only font load exercises re-anchoring; production still uses only system fonts. The fixtures use synthetic bookmarks and a local public Wikipedia favicon, not private Favorites or installed Edge APIs.

**These are automated/local Chromium results, not Edge visual acceptance or new Microsoft sync evidence.** Native Windows fonts, native Edge zoom, wrapped focus contours and real-data annotation placement need the user's review. The completed functional session below remains accepted.

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
