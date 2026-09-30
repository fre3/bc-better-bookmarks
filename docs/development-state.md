# Development State

Last updated: 2026-09-30
Functional/build baseline: `e944b144dacc7f23179eb99931e4d2fdaea85694` (`Build extension 0.1.1`). This identifies the repository artifact; exact installed revisions on both test PCs were not recorded.

## Session closeout and next action

The current implementation is the accepted, validated functional baseline. The development/testing session is complete, with no outstanding functional test failures reported. The next user-started session is UI/UX-focused; no design or application changes have begun. Do not repeat completed tests or start recovery/backend work as part of that handoff.

Use `C:\Git_DEV\bc-better-bookmarks` with native Windows tools only; do not use WSL even if a stale session working directory points there. Read AGENTS.md, this handoff, README.md and architecture.md before work. Durable evidence is in [cross-device-test.md](cross-device-test.md); [next-manual-session.md](next-manual-session.md) is the completed E–G procedure and result ledger, despite its historical filename. [roadmap.md](roadmap.md) contains deferred ideas, not current requirements.

The final documentation/hygiene changes are prepared but remain uncommitted at this handoff. Review and commit them before beginning UI/UX edits to keep a clear baseline boundary. No commit, push, reset, discard or deletion was performed during closeout.

## Completed validation

- A: targeted/plain/mixed search, case/whitespace, URL characters, empty operators and clearing passed.
- B: HTTP label/search, absence of tag metadata/UUID side effects, and HTTPS conversion passed. Corrected Favorites count: **36 before creation → 37 after**; metadata counts stayed unchanged.
- C, explicitly including C.6–C.10: bookmarklet confirmation/cancel/save, exact code preservation, non-execution, JS label/search, repeated confirmation, rename/move identity preservation, copy isolation, URL conversions and unsupported-scheme rejection passed. Runtime unsupported-scheme evidence covers mailto, not every scheme.
- Accepted bookmarklet behavior: title is non-clickable; the label says **“Run this bookmarklet through Edge Favorites.”** Preserve this behavior during UI/UX work.
- D: completed baseline CRUD/tag/search/live-update/order evidence accepted and carried forward. A fresh full post-change D rerun was intentionally not requested; do not represent it as newly executed.
- Stage 1 E1–E4 passed: local journal/latest and empty intent, unrelated-entry isolation, persistence, content-free events, observed missing-key no-replay, and missing-identity preflight rejection with native fields unchanged. Remote receipt without local journal authorship also passed.
- Cross-device F1–F8/G1–G3 passed: Favorite-first arrival, native title/move/folder/URL mutations, subsequent tag edits, worker inactivity/wakeup, unchanged records after two reconciliations, separate-folder identity isolation, observed deletion/tombstones and new-UUID recreation. Physical B authored the original; A received. F6 edited A → B. Earlier sequential two-way tag transport also passed.

All evidence above is user-reported real Edge observation, distinct from mocked/local checks. Edge Computer Use cannot access privileged New Tab/extension pages; the user controls those actions. Do not retry or bypass that policy. Future necessary browser checks should use concrete manual batches; do not repeat existing passes.

## Implementation and UI/UX guardrails

TypeScript + React + plain Vite, Edge MV3, no backend. Favorites own title/URL/hierarchy/order; synchronized UUID metadata owns user tags, with separate locator history/tombstones and profile-local mappings/root selection. One worker queue owns writes. No automatic identity guessing, journal replay, destructive migration, bulk deletion or silent restructuring.

Search uses all whitespace-separated terms, case-insensitive substring matching: plain text across searchable fields, # for user tags and @ for category paths. JS and HTTP are derived labels, never independent synchronized metadata. Bookmarklet confirmation is required on every save resulting in executable code. Preserve these functional contracts while changing presentation.

## Version, artifact and checks

Source, lockfile and source/generated manifests are version **0.1.1**. Public manifest key and development ID must remain unchanged. `dist/` is intentionally tracked as the exact test artifact; consume it without independent rebuilds for baseline testing. Future deliberate implementation changes use Node 24 LTS and `npm run check` in the active Windows checkout, with regenerated dist committed alongside source. Bump patch version when deliberately handing off a materially changed test build, not for documentation edits.

Historical automated results are recorded in cross-device-test.md. This closeout made documentation/hygiene changes only and did not rerun tests or rebuild. Git diff/working-tree review and static manifest/version checks preserve the existing artifact; these checks do not prove Microsoft sync.

## Retained fixtures and deferred risks

- Deleted original U: `b9d0d7c5-0c34-4177-b52e-7353b4da9da0`; both tombstones retained.
- Separate V: `6bd273cd-cb24-4bd1-9288-aa0136fca8a6`, separate-only, B82/A65.
- Recreated W: `6822fc12-ad7b-40e3-8c68-f172ab1a2b9a`, recreated-only, B83/A66, in BB Sync 20260930 / Moved Renamed. Title BB Worker Renamed Again 20260930; URL https://example.com/bb-mutation-20260930-edited.
- Known missing historical records are intentionally retained test cases. The earlier metadata-loss cause remains unresolved; successful tests do not prove repair of those records.
- Fresh exact-duplicate ambiguity, mutations before first mapping, natural metadata-first arrival, extension-disabled evidence loss, same-key concurrent writes and production-store identity remain deferred/limited. New Tab prompt/override handling lacks separate explicit evidence. These are not outstanding failures of the completed session or blockers for UI/UX design.
- Exact installed A/B versions and some timings were not supplied. Timestamp differences across PCs are approximate, with clock alignment unverified.

Keep private raw reports outside Git. The existing `docs/manual-results/` ignore rule excludes the local raw journal report; commit only summarized test evidence. No signing material or diagnostic exports belong in the repository. No further functional test batch or cleanup is scheduled.
