# Better Bookmarks — Edge technical MVP

A Manifest V3 New Tab dashboard over your **real Microsoft Edge Favorites**. Favorites own titles, URLs, folders, hierarchy and ordering. The extension stores only tags and identity/reconciliation metadata; there is no separate bookmark database or backend.

**Baseline single-device behavior and sequential two-way metadata synchronization are manually validated in real Edge.** On 2026-09-28 the user reported successful fresh B → A creation with tags, followed by A → B and B → A tag edits on the same identity, all converging correctly. Cross-device sync is generally working reliably for this tested workflow. The earlier metadata-loss incident remains documented with its cause unresolved; the planned A–G session is complete within recorded scope, with D using accepted prior baseline evidence; deferred ambiguity/delivery cases remain outside that scope. The development ID matches on two independently built machines. A local `storage.sync.set()` success alone is still not remote acknowledgement. See [the manual test results](docs/cross-device-test.md).

## Accepted visual checkpoint

The user accepted **0.1.15** in native Edge, including appearance, footer and peek behavior. Annotated tag `ui-validated-0.1.15` and `feature/ui-ux-redesign` preserve that checkpoint. The current **0.1.19** editing presentation review is on `feature/bookmark-editing`.

All bookmarks is the default browsing scope; typing on the focused page or `/` starts search, and Escape returns to browsing. Manage retains existing MVP operations, settings and diagnostics. Browse/search roots filter presentation only; there is no mutation-scope setting. Folder tags, computed inheritance and archive visibility have passed the specific 0.1.18 two-device scenarios recorded in the handoff. [Design and load instructions](docs/ui-ux-design.md). The separate validated functional baseline remains at `mvp-validated-0.1.1`.

## Keyboard search command

At `edge://extensions/shortcuts`, inspect **Open dashboard in search mode** and assign/reassign it if needed. **Ctrl+Shift+B** is the Windows suggestion, not a guaranteed assignment. Manage displays the actual assignment read from the browser. Removing it is respected.

The command reuses a dashboard in the current window or opens one there. From another tab, it temporarily searches All bookmarks; Escape restores the original browse scope and view. Dashboard-origin search keeps its scope. An open catalogue editor, Manage and active saves pause it to preserve edits. Ordinary Ctrl+T still focuses the address bar; the user-confirmed fallback is **Ctrl+T → Ctrl+F6 → type**. The accepted already-open dashboard/address-bar limitation can leave typing in the address bar; use Ctrl+F6. This checkpoint preserves it.

**Top-row Alt+1–9** selects roots in displayed order, preserving query/selection during search. **Manage → Auto-scroll peek previews** toggles device-local scrolling (default on): mouse-header hover waits 1 second, then scrolls slowly to the end. Keyboard-only peek and reduced motion stay static. Windows Alt+numpad symbol entry remains accepted platform behavior.

See [command behavior, added tabs permission, focus limitations and Edge checklist](docs/keyboard-search.md). Slash wrapping is also included in 0.1.8; current observed English/German behavior is accepted without language-model changes.

## Catalogue editing — 0.1.19 review

The accepted visual checkpoint is `ui-validated-0.1.15`. Choose **Edit** in navigation, then the small **Edit** button beside a Favorite to change title, URL and direct tags. Titles remain normal links, including keyboard, modifier and middle-click navigation. Real folders/section headings have a separate **Edit** action for their name and direct tags; their labels still expand/open normally. **Done** returns to browsing; the Editing badge and sticky navigation show the active mode. Editing is available across browser roots, subject to managed-node, identity and metadata-health safeguards. Old mutation-scope preferences are ignored.

Folder tags apply to the folder and all descendants without copying metadata. Editors show inherited tags and source folders read-only. Enter tags without `#`; inherited Favorite annotations are bold. The editor archive checkbox adds/removes only the direct `archived` tag; other direct tags stay in the Tags field. Inherited archive status names its sources. Effective `archived` hides an item/subtree from the dashboard and search, including Edit mode. **Manage → Show archived** includes it locally; changing the setting does not change tags. `#archived` search does not bypass it. Native Edge Favorites remain visible and unchanged by archiving.

Cancel/Escape protects modified drafts; Escape again at the discard question means Continue editing, preserving input; Ctrl+Shift+B cannot replace a modal draft. Late save failures can leave native changes applied while tag persistence is unconfirmed. Input remains; review the displayed current values before explicitly refreshing the save baseline/retrying. No atomic transaction or recovery after closing/reloading is promised. Existing Manage operations remain available.

**Upgrade every device before using folder tags.** Unbound folder metadata requires consolidated explicit confirmation in Manage; a matching path is not proven identity. Disposable test metadata may be reset only through the deliberate export/inventory/setup workflow, preserving all native Favorites and unrelated preferences. No automatic reset occurs. Read [the coordinated reset and two-device procedure](docs/metadata-setup.md) before performing a real reset. The user confirmed folder binding, inheritance/search, two-way tag edits, parent rename/move and independent archive visibility on two 0.1.18 devices; test-subtree deletion was not confirmed. No metadata reset is needed for 0.1.19. Native Edge 0.1.19 review is pending; [checklist and current evidence](docs/development-state.md).

## Build

Development runs in the authoritative **WSL** checkout `/home/dev/projects/bc-better-bookmarks` with Node.js **24 LTS**. Run dependency installation, builds and automated tests there; a Windows clone is not the development toolchain:

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

1. For the validated test baseline, use the committed `dist/` without rebuilding. For deliberate implementation changes, build as above and commit source and generated artifact together.
2. Open `edge://extensions` in the intended Microsoft account profile.
3. Enable **Developer mode**.
4. Select **Load unpacked**, then select this repository's **dist** folder (the folder containing `manifest.json`).
5. Verify the extension is enabled and its ID is **`nfhbegeoeafnpejpjdljhgagefbpafal`**. It must match on both machines, independent of the checkout path.
6. Open a new tab. Accept/keep the extension's New Tab change if Edge asks. Disable a competing New Tab extension if necessary.
7. Open **Manage** to access the existing controls. Leave the initial read-only edit scope until test setup is ready. Under **Category management / test folder setup**, choose a writable parent (such as Favorites bar), create a uniquely named `Dashboard Test YYYY-MM-DD` folder. The new folder becomes this device's dashboard root. Existing Favorites are not moved.
8. Add a test link. Verify it also exists in Edge's native Favorites UI (`Ctrl+Shift+O`).

Existing Favorite folders can also be selected as the root. Root selection is device-local; select the corresponding synchronized folder independently on B. **All Favorites — enable edits** deliberately allows broader modifications. Missing/deleted roots do not silently fall back to writable all-Favorites mode.

To test a committed build, pull the intended revision and reload its committed `dist/`. After deliberate implementation changes, run `npm run build`, click **Reload** for the extension at `edge://extensions`, then open a fresh new tab. `npm run dev` builds in watch/development mode; still load `dist`, reload the extension, and reopen the tab after changes. Do not load the repository root or use a localhost preview to test browser APIs. No hot-reload extension plugin is required.

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
- **MANUALLY VALIDATED IN EDGE (2026-09-29–30):** A–C including C.6–C.10; D accepted prior baseline; Stage 1 journal/event/preflight E1–E4; cross-device F1–F8/G1–G3 including worker wakeup, isolation, deletion and recreation. No outstanding functional test failures in the completed session. Bookmarklet titles are intentionally non-clickable with “Run this bookmarklet through Edge Favorites.” The HTTP fixture count correction is 36 → 37.
- **DEFERRED COVERAGE:** fresh duplicate ambiguity, mutations before first mapping, natural metadata-first receipt, extension-disabled evidence loss and production identity testing. These are not failed checks or prerequisites for the next UI/UX session; historical metadata-loss cause remains unresolved.

## Roadmap

Deferred system labels, search enhancements, metadata-recovery work and distribution considerations are tracked in [the roadmap](docs/roadmap.md). Roadmap items are not implementation requirements unless explicitly promoted into current work; see [the current development handoff](docs/development-state.md) for active status and next actions.

0.1.19 adds compact sticky navigation in both modes, an open/collapsed section chevron (not shown on static search headings), explicit-root scroll-to-top and a compact notice for pending folder-binding review. Folder tags already received on another device require explicit confirmation in Manage before applying; the notice never attaches them automatically. Pointer-retained focus no longer keeps tags visible after leaving an item; keyboard focus and search explanations still reveal them.
