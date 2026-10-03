# Development State

Last updated: 2026-10-03
Current branch: `feature/ui-ux-redesign`. Browser-review build: **0.1.9**. Search/navigation commit `48be68c`; scrolling/source artifact commit `57836fc`.
Validated baseline: `1217369dd10638942d80107d5f33d7f61491d075`, unchanged on `master`, `archive/mvp-validated-0.1.1` and annotated tag `mvp-validated-0.1.1`.

## Current checkpoint and next action

**Next action: user Edge review of 0.1.9**, using the six-point checklist in [keyboard-search.md](keyboard-search.md). Stop before further refinement or Edit mode. No push was made. Authoritative checkout/tooling remains **WSL `/home/dev/projects/bc-better-bookmarks`**; no Windows clone changed.

The user has accepted **0.1.8's main Ctrl+Shift+B workflows and shortcut configurability in Edge**. The already-open dashboard/address-bar limitation is accepted: the command can prepare search while Ctrl+F6 is still needed to transfer real typing focus. This checkpoint does not reinvestigate it. Ordinary Ctrl+T retains address-bar focus; the fallback remains **Ctrl+T → Ctrl+F6 → type**. The Windows suggestion stays Ctrl+Shift+B, with actual assignment/removal controlled by Edge's native shortcut settings.

0.1.9 adds:

- Commands capture the originating tab before activating/creating a dashboard. Launch from another tab temporarily searches **All bookmarks**. Launch from the dashboard retains its current scope. Query selection remains intact. One pre-search snapshot preserves root, open section, expanded branch, scroll and focus through repeated commands and search-scope changes; Escape restores it. Pending external scope intent survives loading/repeated requests. Manage and save guards still protect drafts.
- Dashboard-local **Alt+1–9** selects displayed roots by identity (All bookmarks first). Query, focus and selection survive search scope changes. Tooltips and accessible shortcut descriptions expose the mapping. Missing numbers, extra modifiers, AltGr/composition, dialogs, other text controls and Manage are excluded; plain digits and Ctrl+Arrow retain their behavior.
- **Manage → Auto-scroll peek previews** is independently switchable, local-only (`ui:auto-scroll-peek`), enabled by default if absent. Existing explicit opt-out is read before motion is enabled. Worker-queued preference writes do not touch synchronized metadata. After 1.5 seconds of continuous mouse-header hover, overflowing inert preview content moves one computed line per 2.75 seconds and stops at its end. Geometry, dither, header targets and document scroll remain stationary. Leaving, opening, search/root changes, disabling, reduced motion or hiding cancel/reset. Keyboard-only peeks stay static. Returning from a hidden page requires a new hover; no elapsed-time jump.

Accepted 0.1.6–0.1.8 typography, 14px leading, fixed nested scale, slash/underscore/hyphen wrapping, first-fragment annotations, focus contours, measured opaque coverage, 140ms/90ms peek and 220ms open reveal remain unchanged. Limited readable annotation/frame overlap is accepted; bookmark-text overlap is not. Current observed English/German hyphenation is accepted without new language assignments/detection. Folder tags, website thumbnails, Edit-mode redesign, drag/drop and sync changes remain deferred.

## Verification and artifact

`npm run check` passes: typecheck, lint, **170 tests across 10 files**, production build/version verification and unchanged extension ID `nfhbegeoeafnpejpjdljhgagefbpafal`. Package, lockfile and source/generated manifest versions are **0.1.9**. Tracked `dist/` is regenerated. No new dependencies, permissions, public-key changes, SVG or catalogue CSS changes. Core bookmark/search/sync/mutation architecture is retained.

Unit tests cover captured origin, retained launch intent through cold readiness, immutable Escape snapshots, dynamic shortcut mapping/exclusions, scroll delay/speed/end/cancellation/resize, and local preference defaults, persistence, errors and subscriptions. Existing functional tests are retained; completed manual sync testing was not reopened.

Focused rendered checks cover scope/query/selection/scroll restoration, modifier exclusions, Manage isolation, real-time scrolling speed, reset/cancellation/end stopping, reduced motion, keyboard-only peek, size changes, pointer traversal, mid-transition clicks and long-card context. Coverage/annotation regressions pass at 320/390px and 80/125/150/200% zoom-equivalent layouts; native Edge zoom is still user review. Synthetic captures/reports are under `docs/visual-review/generated/0.1.9-*`. Static and scrolling preview captures were visually inspected; they are not Edge visual acceptance.

An isolated WSL Chromium extension profile using a **German XKB keyboard layout and native X11 input** passed external-command All bookmarks/Escape restoration, Alt+1/2 with selection retained, AltGr+2 producing `²`, Ctrl+Arrow, local preference reload persistence and Manage draft preservation (including an external command while editing). Only its temporary test copy used Linux Ctrl+Shift+Y; the shipped Windows suggestion remains Ctrl+Shift+B. No user Edge assignment was changed or observed. The accepted address-bar limitation was not reinvestigated. New 0.1.9 native Edge checks remain pending.

Supplied review media remain untouched/untracked. Read [ui-ux-design.md](ui-ux-design.md) for durable design decisions and [keyboard-search.md](keyboard-search.md) for reload/shortcut instructions. Local browser evidence does not establish Microsoft sync or user visual acceptance.

## Changed files in this checkpoint

- Routing/state/navigation: `src/background.ts`, `src/core/dashboard-launch.ts`, `src/browser/dashboard-launch.ts`, `src/ui/App.tsx`, `src/ui/Catalogue.tsx`, `src/ui/catalogue-state.ts`, `src/ui/catalogue-handoff.ts`.
- Preview/settings: `src/ui/SectionCard.tsx`, new `src/ui/peek-scroll.ts`, `src/ui/usePeekScroll.ts`, `src/ui/usePeekPreference.ts`, `src/browser/ui-preferences.ts`.
- Tests: `tests/catalogue.test.ts`, `tests/dashboard-launch.test.ts`, new `tests/peek-scroll.test.ts`.
- Version/artifact: `package.json`, `package-lock.json`, `public/manifest.json`, generated `dist/manifest.json`, `dist/background.js`, `dist/index.html`, `dist/search.html` and hashed JS bundles (old bundles removed).
- Documentation/evidence: `README.md`, this handoff, `docs/keyboard-search.md`, `docs/ui-ux-design.md`, `docs/roadmap.md`; six `docs/visual-review/generated/0.1.9-*` captures/reports. Supplied media are unchanged.

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
