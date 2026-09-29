# Better Bookmarks

Personal Microsoft Edge Manifest V3 New Tab dashboard. TypeScript + React + plain Vite; no backend or separate bookmark database.

- **Edge Favorites are authoritative** for titles, URLs, folder hierarchy and order. Never silently move/restructure Favorites, bulk-delete, call `removeTree`, or perform destructive migrations.
- **Cross-device bookmark IDs are not guaranteed stable.** Never key synchronized tags by a browser bookmark ID. UUID metadata and locator history live in sync storage; local mappings/root selection live in local storage. Ambiguity must remain visible and unresolved.
- Browser APIs belong in `src/browser` and worker event wiring in `src/background.ts`. React sends typed commands. `src/core` contains mockable service/pure matching/search/schema logic.
- One worker queue owns writes. Reconciliation never edits Favorites, creates UUIDs automatically, guesses duplicate identity, or rewrites tags during locator publication.
- Preserve `public/manifest.json`'s public key; development ID must match on both machines. Never commit private signing material, secrets or Favorites diagnostic exports.
- Node 24 LTS. `npm ci`; `npm run typecheck`; `npm run lint`; `npm test`; `npm run build`. `npm run check` runs all checks. Load `dist/` unpacked; `npm run dev` watches builds. `npm run extension:id` prints expected ID.
- At the start of a task, read `docs/development-state.md` for the current handoff. Before ending meaningful implementation or browser-verification work, update it with current status, verification, unresolved findings, and the concrete next action. Keep it a current snapshot, not a changelog; Git is the history.
- `docs/roadmap.md` contains deferred ideas and is not an implementation requirement unless the current task explicitly promotes an item.
- Read `docs/technical-spike.md`, `docs/architecture.md`, and `docs/cross-device-test.md` before changing synchronization. Record durable architecture/test evidence and remaining risks in the appropriate document.
- Local tests or successful storage writes do NOT prove Microsoft sync. User-reported real Edge validation (2026-09-28): fresh B → A creation with tags, then A → B and B → A tag edits on the same identity all converged correctly. Sequential two-way sync is manually validated; the broader mutation matrix and earlier metadata-loss cause remain open. Keep manual evidence distinct from mock/browser-local checks. If browser sync is proven insufficient, stop and document evidence before proposing a backend.
