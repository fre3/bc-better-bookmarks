# Development State

Last updated: 2026-10-04
Current branch: `feature/ui-ux-redesign`. Browser-review build: **0.1.15**.
Validated baseline: `1217369dd10638942d80107d5f33d7f61491d075`, unchanged on `master`, `archive/mvp-validated-0.1.1` and annotated tag `mvp-validated-0.1.1`.

## Current checkpoint and next action

**Visual phase accepted by the user on 2026-10-04.** All requested native Edge tests for **0.1.15** passed, including Light/Dark/System appearance, footer and peek behavior. This supersedes the pending-review wording in the implementation evidence below. It is native Edge user evidence, not a new cross-device sync test.

Close and annotate this checkpoint, then start `feature/bookmark-editing` from it. The authorized first increment is catalogue Edit mode plus a title/URL/tags modal reusing existing mutation safeguards. Other editing operations, drag/drop, thumbnails, semantic search and synchronization changes remain deferred. No push; supplied media and validated MVP references remain untouched.

## Appearance implementation

Manage now has an explicitly labelled **Appearance** selector: **System / Light / Dark**, default System. The authoritative value is `ui:appearance` in `chrome.storage.local`, written through the existing worker queue using a separate typed UI command. It never enters synchronized bookmark metadata or the saved mutation scope. `storage.onChanged` updates open dashboards without reload. The preference component is independent of the legacy editor and never saves, resets or replaces a draft.

An external, parser-blocking `theme-init.js` reads the non-authoritative extension-origin `localStorage` key `ui:appearance-cache` before the application; it applies the preference and initial color-scheme hint. Shared CSS supplies the initial canvas. The browser adapter subscribes before reading canonical storage, resolves the authoritative value before mounting React and refreshes the cache. A slow read cannot overwrite a newer change. No timeout/loading-screen delay is introduced. If canonical storage fails, the cache/System remains usable; a failed save is surfaced and leaves the saved theme/draft intact.

Theme selection changes the root attribute only. CSS `color-scheme` and `light-dark()` follow live system changes or pin an explicit override without remounting the catalogue. Geometry, selection, focus, scroll, query/snapshot, expansion and valid running peek animations are preserved. No broad color transitions. [Palette and detailed decisions](ui-ux-design.md#015-appearance-checkpoint).

Charcoal sheets `#282828`, off-white text `#f0f0ed`, readable gray provenance/Next levels, black footer and black dither are proposed for review. The unchanged 7×20 SVG supplies an alpha mask, preserving its pattern/transparency/direction while exposing a semantic shadow color. Light closed rendering compares pixel-identically with 0.1.14. A neutral light-gray favicon frame keeps transparent dark logos visible; images retain their own colors and existing grayscale interaction. Dark annotations use a crisp charcoal text outline to remain legible over frames. The accepted limited annotation/frame overlap remains; no change to leading or type size.

Native controls/caret/selection, Manage panels/status/errors, empty states and focus use shared tokens. Windows forced-colors keeps UA adjustments enabled and uses system colors plus a thin sheet boundary instead of authored dither. Native browser-owned confirm/prompt dialogs remain browser/OS styled. A small grid/min-width correction prevents long Manage root options from widening narrow layouts; editing semantics are unchanged.

## Preserved footer and catalogue behavior

The 0.1.13 safe temporary-space cleanup and 0.1.14 final-hover implementation are untouched. Final mouse peeks retain the header/white surface through footer top; earlier sections remain header-only. Genuine exit may retain only space required to support the viewport, released by upward scrolling or explicit navigation. No forced scrolling, unsafe contraction, permanent reservation or new pointer layer.

Unchanged: 2.5-line depth, Next grouping, 1000ms delay and one-line/2750ms scrolling, preference/reduced motion, 140/90ms peek and 220ms opening, wrapping/annotations, original Escape snapshot, Ctrl+Shift+B, Alt+top-row shortcuts, accepted Alt+numpad and address-bar/Ctrl+F6 limitations. No dependencies, permissions, manifest key or SVG artwork changes.

## Verification and limitations

`npm run check` passes typecheck/lint, **190 tests / 14 files**, build/version and unchanged extension ID `nfhbegeoeafnpejpjdljhgagefbpafal`. Tracked `dist/`, package/lockfile and manifests are **0.1.15**.

- New unit coverage: defaults/overrides, local-only storage, worker save/error path, event filtering/removal, read/change race and unavailable storage/cache.
- `scripts/check-appearance.mjs`: real App over synthetic Favorites/shared API bridge. System/overrides/live changes, startup-frame palette, persistence, two-tab propagation, unsaved drafts/save errors, query/caret/focus/Escape/root/folder/scroll preservation, active peek progress, grayscale/color icons, readable text, narrow layouts, reduced motion and forced colors. Resting light catalogue is pixel-identical to the 0.1.14 stylesheet in the same fixture. Sampled text contrast: minimum **4.54:1 light / 6.42:1 dark** (including later summary names); frame-overlap readability also depends on the dark text outline and was inspected visually.
- `scripts/check-peek-scroll.mjs`: **12 repeated wheel/pointer cycles per palette (24 total)**, including final-surface retention, footer entry/links, stationary waits, viewport stability, safe cleanup, root changes and search/Escape. Existing geometry algorithms were not modified.
- Comparable closed/peek/open/search/Manage, icon/annotation, error, narrow and forced-colors captures are under `docs/visual-review/generated/0.1.15-*`; representative renders were visually inspected. All use synthetic bookmarks.

**Native limitations:** two isolated Chromium extension-loading attempts did not register the unpacked extension or expose its worker (profile registry contained only the built-in PDF extension). Thus actual storage/worker delivery in a loaded extension remains Edge review; adapter logic and synthetic cross-tab delivery passed. No claim of native Edge, Windows contrast-theme or sync acceptance. First authored-frame samples passed with System and cached overrides opposite the OS; browser-owned pre-document paint and the rare missing/stale startup-cache reconciliation still require fresh-tab Edge inspection. No artificial delay hides this case. The user subsequently accepted the palette and requested native Edge checks; the automated evidence above remains separately attributed.

```sh
cd /home/dev/projects/bc-better-bookmarks
npm run check
node scripts/check-appearance.mjs
node scripts/check-peek-scroll.mjs
CATALOGUE_COLOR_SCHEME=dark node scripts/check-peek-scroll.mjs
```

Use `PLAYWRIGHT_BROWSERS_PATH` only if needed for a non-default installed Chromium. Scripts print temporary fixture/trace locations; committed reports contain summarized synthetic evidence. Completed functional/cross-device tests were not reopened.

## Files and Edge review

Changed: new browser appearance adapter, startup script, theme tokens and Appearance setting; small worker/main/App integration; catalogue/legacy CSS and summary colors; entry HTML/build guard, unit/browser regressions, version files, regenerated `dist/`, docs/evidence. Footer/hover/coverage implementations and bookmark/sync services are untouched.

1. Manage → Appearance: System/Light/Dark; reload and open another dashboard. Change the setting and confirm both tabs update. With System, change Windows appearance while open.
2. Fresh New Tabs with saved Light on a dark system and saved Dark on a light system: check flashes. Ordinary Ctrl+T address-bar focus is unchanged.
3. Compare closed/peek/open sheets, first/cover/footer shadows, mixed-root Next text, tags/HTTP annotations and transparent/white/color icons. Check keyboard focus and Windows contrast themes.
4. Keep an unsaved Manage draft and a second tab with scoped search/open folders; change appearance. Draft, query/selection, original Escape restoration and viewport should survive.
5. Final peek → preview → wheel toward footer → footer links, then earlier headers: no jitter. Check narrow/reduced-motion views and safe cleanup after leaving.

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
