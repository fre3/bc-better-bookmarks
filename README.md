# Better Bookmarks — Edge technical MVP

A Manifest V3 New Tab dashboard over your **real Microsoft Edge Favorites**. Favorites own titles, URLs, folders, hierarchy and ordering. The extension stores only tags and identity/reconciliation metadata; there is no separate bookmark database or backend.

**Baseline single-device behavior and sequential two-way metadata synchronization are manually validated in real Edge.** On 2026-09-28 the user reported successful fresh B → A creation with tags, followed by A → B and B → A tag edits on the same identity, all converging correctly. Cross-device sync is generally working reliably for this tested workflow. The earlier metadata-loss incident remains documented with its cause unresolved; broader mutation-matrix and feature-specific checks remain pending. The development ID matches on two independently built machines. A local `storage.sync.set()` success alone is still not remote acknowledgement. See [the manual test results](docs/cross-device-test.md).

## Build

Install Node.js **24 LTS** (includes npm). In this repository, using PowerShell, bash, or a terminal:

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run extension:id
```

`npm run check` runs all four checks. `dist/` is the complete installable unpacked extension. No server is required. The lockfile pins dependencies; React/React DOM are the only runtime dependencies.

## Load in Windows Microsoft Edge

1. Build as above.
2. Open `edge://extensions` in the intended Microsoft account profile.
3. Enable **Developer mode**.
4. Select **Load unpacked**, then select this repository's **dist** folder (the folder containing `manifest.json`).
5. Verify the extension is enabled and its ID is **`nfhbegeoeafnpejpjdljhgagefbpafal`**. It must match on both machines, independent of the checkout path.
6. Open a new tab. Accept/keep the extension's New Tab change if Edge asks. Disable a competing New Tab extension if necessary.
7. Leave the initial read-only mode until test setup is ready. Under **Category management / test folder setup**, choose a writable parent (such as Favorites bar), create a uniquely named `Dashboard Test YYYY-MM-DD` folder. The new folder becomes this device's dashboard root. Existing Favorites are not moved.
8. Add a test link. Verify it also exists in Edge's native Favorites UI (`Ctrl+Shift+O`).

Existing Favorite folders can also be selected as the root. Root selection is device-local; select the corresponding synchronized folder independently on B. **All Favorites — enable edits** deliberately allows broader modifications. Missing/deleted roots do not silently fall back to writable all-Favorites mode.

To update a build, run `npm run build`, click **Reload** for the extension at `edge://extensions`, then open a fresh new tab. `npm run dev` builds in watch/development mode; still load `dist`, reload the extension, and reopen the tab after changes. Do not load the repository root or use a localhost preview to test browser APIs. No hot-reload extension plugin is required.

## What works

- Full Favorites tree reading, folder/category grouping, immediate search across title, URL, path, user tags and derived system labels. `#tag` targets user tags; `@category` targets folder paths. All whitespace-separated terms must match, case-insensitively by substring. For example, `microsoft @dev #important`. Lone `#` and `@` are ignored; embedded characters in URLs/text remain ordinary text.
- Add/edit/move/delete individual Favorites; create/rename normal folders. Delete requires confirmation. No folder deletion or bulk deletion.
- Comma-separated tags; trim, Unicode NFC normalization, lowercase, deduplicate, sort. `Azure` and `azure` are one tag. Removing all tags preserves the identity record.
- Background reconciliation on startup, bookmark events and sync-storage events, including when dashboard tabs are closed.
- Diagnostics with local browser IDs, application IDs, mapping method, browser sync fields when exposed, unresolved/ambiguous records, bytes/quotas, recent event logs, reload/reconcile controls, sanitized console dump and JSON export.
- Browser-owned/managed folders are protected. New/edited links accept only HTTP, HTTPS, or explicitly confirmed `javascript:` bookmarklets. Every save whose resulting URL is a bookmarklet requires an executable-code warning, including title/tag-only edits; merely viewing one never prompts. Cancel leaves the editor open and sends no save command. Bookmarklet code is passed unchanged to the browser API. The dashboard never executes it; run bookmarklets through Edge Favorites. Other existing schemes remain visible but cannot be saved through this editor.
- Read-only system labels: `JS` for `javascript:`, `HTTP` for `http:`, none for HTTPS. These are derived in the view/search model, separate from user tags, with no independent synchronization, stableId creation or persisted label array. A native copy gets its own derived label but does not inherit the mapped original's user tags.

Browser APIs live behind repositories. UI commands go through one service worker queue. Logic tests use in-memory repositories, including simulated different local IDs and both arrival orders; they do **not** test Microsoft account sync.

## Development identity

`public/manifest.json` includes a fixed public `key`, copied unchanged into `dist`. The key was generated once using Node's RSA key-pair generator; only the public SPKI DER bytes were written. Private material was never saved. **Do not regenerate this key** or remove it for A/B tests. `npm run extension:id` derives the expected ID from the public key. Never commit a signing key, PEM, CRX, account credentials, or diagnostic exports containing private Favorites.

The manifest `key` mechanism is [officially documented](https://developer.chrome.com/docs/extensions/reference/manifest/key). Edge Add-ons production distribution has a store identity and update process; do not assume it inherits this development ID or its sync namespace. No production migration/publishing has been implemented.

## Read before broad testing

Use only the dedicated test folder initially, and export a Favorites HTML backup from Edge's native Favorites manager. Diagnostic JSON is a sanitized debugging artifact, not a restorable backup. It contains Favorites and tag data (no visited-history fields); review before sharing. Web URLs with credentials and common secret parameter names are redacted, but arbitrary private information in titles, tags, paths or ordinary URL parameters cannot be automatically identified. Bookmarklet code is exported verbatim without interpretation or redaction and may contain private data.

Known limitations: the earlier metadata-loss cause remains unresolved despite the successful two-way retest; exact duplicates on a fresh device remain ambiguous; unknown rename/move history remains unresolved; missed deletion events can make recreation indistinguishable; concurrent cross-device writes to the same storage key can lose edits. Small sync quotas limit tagged Favorites/history. There is no automatic cleanup, conflict merge, or import.

Stage 1 hardening records content-free key additions/updates/removals in bounded diagnostics and preserves each locally authored metadata intent in `storage.local` before publishing it. Preservation is capped at 512 identities / 1 MiB without automatic eviction; failure blocks publication. Diagnostics distinguish missing, quarantined, deleted and ambiguous metadata. Unsafe identity edits are rejected before Favorite mutation when already detectable. Automatic recovery is deferred to Stage 2: missing sync keys are never recreated from the journal on startup or events. See [the architecture notes](docs/architecture.md) for compatibility and remaining limits.

- [Technical spike and official references](docs/technical-spike.md)
- [Architecture, storage schema and failure behavior](docs/architecture.md)
- [Exact Windows two-device test and result worksheet](docs/cross-device-test.md)

Local check results and live-test status are recorded in the test worksheet. If transport fails on both machines, collect evidence and stop before introducing any backend.

## Validation status

- **AUTOMATED TESTED:** pure logic and mocked/in-memory repository/service tests, typecheck, lint, production package and deterministic ID checks. These do not prove browser UI or Microsoft transport; exact results are in the worksheet.
- **MANUALLY VALIDATED IN EDGE:** user-reported baseline unpacked loading, same ID on two independent builds, complete Favorites hierarchy/order, dashboard creation/title/URL edits/moves/deletion, user-tag add/remove/search, native rename/move updating the open dashboard, mapped tags surviving rename/move, and native copy/paste appearing immediately without inheriting user tags. Exact versions/times and private exports were not supplied.
- **MANUALLY VALIDATED IN EDGE (cross-device):** initial A → B tags were loaded on B. Following the recorded failure, fresh B → A creation with tags succeeded, then A → B and B → A tag edits converged on the same identity (user report recorded 2026-09-28).
- **NOT YET VALIDATED:** new bookmarklet confirmation/preservation in Edge, derived labels and targeted-search UI; Stage 1 journal/event/preflight-specific checks in Edge, the remaining cross-device mutation matrix, and full architecture validation beyond the successful sequential creation/tag-edit workflow.

## Roadmap (not implemented)

System labels are always derived from the Favorite itself, not user metadata. They are immediately reproducible, never synchronized independently, and must not create stableIds.

| Label | Meaning | Status |
| --- | --- | --- |
| JS | `javascript:` bookmarklet | Implemented; new UI validation pending |
| HTTP | Unencrypted `http://` URL | Implemented; new UI validation pending |
| LOCAL | Localhost / loopback destination | Future |
| IP | Direct IP address destination | Future |
| PDF | URL clearly targets a PDF resource | Future |
| MAIL | `mailto:` link | Future; does not expand today's save policy |

Future search possibilities: targeted system-label search (perhaps `!js`, syntax undecided), tag autocomplete after `#`, category autocomplete after `@`, quoted multi-word targeted values, and richer filters/advanced search UI. None is implemented in this MVP.
