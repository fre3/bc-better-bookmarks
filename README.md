# Better Bookmarks — Edge technical MVP

A Manifest V3 New Tab dashboard over your **real Microsoft Edge Favorites**. Favorites own titles, URLs, folders, hierarchy and ordering. The extension stores only tags and identity/reconciliation metadata; there is no separate bookmark database or backend.

**Implementation and local automated checks are complete. Cross-device synchronization is NOT technically validated yet.** A local `storage.sync.set()` success does not prove Microsoft transport or correct matching on another device. Start with [the two-device test](docs/cross-device-test.md).

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

- Full Favorites tree reading, folder/category grouping, immediate search across title, URL, path, tags.
- Add/edit/move/delete individual Favorites; create/rename normal folders. Delete requires confirmation. No folder deletion or bulk deletion.
- Comma-separated tags; trim, Unicode NFC normalization, lowercase, deduplicate, sort. `Azure` and `azure` are one tag. Removing all tags preserves the identity record.
- Background reconciliation on startup, bookmark events and sync-storage events, including when dashboard tabs are closed.
- Diagnostics with local browser IDs, application IDs, mapping method, browser sync fields when exposed, unresolved/ambiguous records, bytes/quotas, recent event logs, reload/reconcile controls, sanitized console dump and JSON export.
- Browser-owned/managed folders are protected. New/edited links are HTTP(S) only; existing non-web Favorites remain visible and can be opened through Edge's native Favorites UI.

Browser APIs live behind repositories. UI commands go through one service worker queue. Logic tests use in-memory repositories, including simulated different local IDs and both arrival orders; they do **not** test Microsoft account sync.

## Development identity

`public/manifest.json` includes a fixed public `key`, copied unchanged into `dist`. The key was generated once using Node's RSA key-pair generator; only the public SPKI DER bytes were written. Private material was never saved. **Do not regenerate this key** or remove it for A/B tests. `npm run extension:id` derives the expected ID from the public key. Never commit a signing key, PEM, CRX, account credentials, or diagnostic exports containing private Favorites.

The manifest `key` mechanism is [officially documented](https://developer.chrome.com/docs/extensions/reference/manifest/key). Edge Add-ons production distribution has a store identity and update process; do not assume it inherits this development ID or its sync namespace. No production migration/publishing has been implemented.

## Read before broad testing

Use only the dedicated test folder initially, and export a Favorites HTML backup from Edge's native Favorites manager. Diagnostic JSON is a sanitized debugging artifact, not a restorable backup. It contains Favorites and tag data (no visited-history fields); review before sharing. URLs with credentials and common secret parameter names are redacted, but arbitrary private information in titles, tags, paths or ordinary URL parameters cannot be automatically identified.

Known limitations: unpacked Edge transport is unverified; exact duplicates on a fresh device remain ambiguous; unknown rename/move history remains unresolved; missed deletion events can make recreation indistinguishable; concurrent cross-device writes to the same storage key can lose edits. Small sync quotas limit tagged Favorites/history. There is no automatic cleanup, conflict merge, or import.

- [Technical spike and official references](docs/technical-spike.md)
- [Architecture, storage schema and failure behavior](docs/architecture.md)
- [Exact Windows two-device test and result worksheet](docs/cross-device-test.md)

Local check results and live-test status are recorded in the test worksheet. If transport fails on both machines, collect evidence and stop before introducing any backend.
