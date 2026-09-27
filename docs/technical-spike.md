# Technical spike — 2026-09-24

Status: documentation investigation completed before implementation. Local automated checks are separate from live Edge validation. **Two-device Windows Edge validation is NOT yet performed.** No backend is required by the evidence currently available.

## Assumptions and findings

| Question | Finding / decision | Evidence |
| --- | --- | --- |
| MV3 New Tab replacement | `chrome_url_overrides: { newtab: "index.html" }` points to a bundled extension page. Test Edge's enable/keep-change prompt; another New Tab extension may compete. | [Override pages](https://developer.chrome.com/docs/extensions/reference/manifest/chrome-url-overrides) |
| Read / CRUD / folders | `getTree()` reads the full ordered hierarchy. `create` with URL creates a Favorite; without URL creates a folder. `update` changes title/URL; folder rename uses title. `move` changes parent/index. `remove` deletes one node. Never use recursive deletion. | [Bookmarks API](https://developer.chrome.com/docs/extensions/reference/api/bookmarks) |
| Observe changes | Subscribe to created, changed, moved, removed, children-reordered and import events. Reload snapshots after events. Browser-owned root folders cannot be renamed; managed nodes cannot be edited. | Bookmarks API |
| Edge API support | Microsoft lists bookmarks and storage for MV3 desktop. New Chromium fields may be absent in Edge: inspect optional `syncing`, `folderType`, `unmodifiable`, rather than requiring them. | [Microsoft API support](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/api-support) |
| `storage.sync` | Browser-managed extension key/value storage. Chromium documents asynchronous replication with browser sync enabled, local behavior when disabled, and offline buffering. A successful `set` or `onChanged` is NOT a remote acknowledgement. | [Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage) |
| Same Microsoft account, two Edge installations | Microsoft documents profile sync including Favorites, Extensions and Settings. This supports investigating extension metadata sync, but does not certify the precise unpacked-extension scenario. Enable all three categories on both devices, then measure transport and matching independently. | [Microsoft sync settings](https://support.microsoft.com/en-us/edge/change-and-customize-sync-settings-in-microsoft-edge), [Enterprise sync](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-enterprise-sync) |
| Sync quotas | Chromium contract: 102,400 bytes total, 8,192 per item (key + serialized value), 512 items, 120 write operations/minute and 1,800/hour. Quota failures reject promises. No unlimited-storage exemption for sync. Runtime constants and bytes used appear in diagnostics. | [Storage quota constants](https://developer.chrome.com/docs/extensions/reference/api/storage#property-sync) |
| Unpacked sync across machines | No explicit current Microsoft guarantee found. Unpacked installation and sync data transport are different capabilities. Install manually on BOTH computers; identical ID is necessary, not proof of transport. The manual spike is a release gate. | [Microsoft sideloading](https://learn.microsoft.com/en-us/microsoft-edge/extensions/getting-started/extension-sideloading), Microsoft API support |
| Same extension ID | Required for the same extension storage namespace. Chromium settings transport keys data by extension ID and setting key. Edge-specific remote behavior still requires testing. | [Chromium sync backend](https://github.com/chromium/chromium/blob/main/chrome/browser/extensions/api/storage/sync_storage_backend.cc) |
| Deterministic development ID | Commit a base64 DER public key in manifest `key`; never regenerate per build or per machine. Official docs support `key` for stable unpacked IDs. Generate an RSA public key once; discard private material in memory. Different paths are deliberately tested. | [Manifest key](https://developer.chrome.com/docs/extensions/reference/manifest/key), [Chromium ID derivation](https://github.com/chromium/chromium/blob/main/components/crx_file/id_util.cc) |
| Bookmark IDs cross-device | NOT guaranteed. Documentation limits uniqueness/persistence to the current profile. Never use browser IDs as synchronized identity. Measure on A/B even if they happen to be equal. | Bookmarks API |

## Tooling investigation

Reviewed [WXT](https://wxt.dev/guide/resources/upgrading) (actively documented Vite extension framework) and [CRXJS](https://crxjs.dev/) (Vite extension plugin with extension HMR). Both provide useful extension-specific tooling; no need to infer maintenance from outdated comparison tables. This MVP has one HTML entry and one module worker, no content scripts or cross-browser packaging. Choose ordinary [Vite production build](https://vite.dev/guide/build) with explicit entries and a static manifest. React/React DOM are the only runtime dependencies. No extension framework, remote scripts or development server inside the installed extension. Build/watch and reload are sufficient.

## Identity and reconciliation decision (before implementation)

Use UUIDs for application metadata, exact structured locators (`URL`, title, array of folder components), and profile-local ID mappings. Do not normalize away URL query/hash, title case, or folder spelling. Represent supported browser root types semantically when exposed; fall back to exact titles, never guessed localized names. Index/order is deliberately not identity.

Keep tag records and locator histories under separate sync keys so a bookmark rename cannot overwrite a concurrent tag edit. The tag record contains its initial locator, allowing matching even if the history record arrives later. History is a set of observed locators, capped at 12; overflow stops publication and surfaces an error instead of discarding evidence. A previously mapped local node can publish a changed locator, but a storage event alone must not republish a stale device's locator as authoritative. Automatic reconciliation never edits Favorites or creates metadata identities. UUID creation occurs only on explicit first tag assignment.

Matching requires a unique exact match to a current/historical locator across the complete tree AND no competing metadata record. No URL-only or title-only guessing. A known local mapping preserves identity through rename/move/URL edits. A fresh device with only the new bookmark and only old metadata waits unresolved until a mapped device publishes the new locator. Indistinguishable duplicates remain ambiguous. This favors leaving tags unresolved over attaching them incorrectly.

Confirmed removal events for mapped nodes publish a separate tombstone (no Favorite mutation). Orphaned metadata is retained; absence alone does not prove deletion. Tombstones cannot be undone automatically. A recreated URL does not inherit a known-deleted identity. Deletion while the extension is disabled, uninstall/reinstall, reset sync, or profile recovery can lose evidence; exact recreated bookmarks can then be indistinguishable. This is an explicit unresolved limitation, not a safe identity guarantee.

## Remaining questions / risks

- Does this Edge version/account actually replicate unpacked extension data? Which sync setting governs extension settings? Inspect A/B results and `edge://sync-internals`; no API exposes a reliable remote sync-complete flag.
- Favorites and extension settings are independently replicated. Metadata may arrive first, and individual storage keys may arrive separately. Retain unresolved records and reconcile again.
- No exposed globally portable Favorite GUID. Perfect identity for identical duplicates, deletion/recreation without observed events, or changes on every device before first mapping is impossible with locators alone.
- Simultaneous first tagging before either device receives metadata can create two UUIDs. Surface conflict rather than merge silently. Do not tag on B until the first round trip has completed.
- Concurrent edits to the SAME tag/history key depend on browser conflict resolution; timestamps are diagnostic, not a CRDT or conflict ordering guarantee. Sequential two-way changes are the MVP contract. Locators use read/union/write but cannot guarantee union under a cross-device race.
- Storage is small: roughly two keys per tagged Favorite, plus deletion markers, with bytes likely limiting first. Unknown schemas are quarantined; no destructive migration or automatic garbage collection.
- Browser writes and metadata writes are not one transaction. A partial operation must be reported accurately; never automatically repeat Favorite creation or roll back/delete a real Favorite.
- Local mappings belong to this installed profile. Root selection is local and must be selected independently on B. Default is all Favorites for reading, with mutations locked until a root is explicitly chosen.
- Production Edge Add-ons installation uses the store-assigned identity and distribution. Do not assume the development key determines the store ID or transports existing dev metadata to it; retest, and plan an explicit migration before publishing. [Publishing](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension)

No official source or local test proves the target A/B scenario. If controlled tests establish that browser sync cannot satisfy it, stop and document the evidence before considering any backend.

## Implementation / local verification outcome

Implemented the decisions above using plain Vite, an MV3 module service worker, isolated browser repositories, pure matching/search logic, and a simple React dashboard. Development ID: `nfhbegeoeafnpejpjdljhgagefbpafal`. Only the public key exists on disk. Build verification rejects unintended identity rotation.

Local checks on 2026-09-24: typecheck, lint, 49 unit/service tests and production package passed. Simulated A/B repositories use different bookmark IDs and both arrival orders; these tests validate our code, not Microsoft's transport. Dependency audit reports zero vulnerabilities after updating test/lint tools. Actual Edge loading, account sync, bookmark-ID comparison and two-device mapping remain NOT RUN. Record actual evidence in the cross-device worksheet before claiming architecture validation.
