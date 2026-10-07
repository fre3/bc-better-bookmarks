# Indexfold

**Your bookmarks, beautifully within reach.**

A typography-first bookmark dashboard with instant search and keyboard navigation. Built for Chrome and Edge.

Indexfold is a Manifest V3 New Tab extension, currently **pre-release 0.1.26**. Native browser bookmarks own titles, URLs, hierarchy and order. The extension stores direct tags and conservative identity/reconciliation metadata; inheritance is computed. There is no backend or separate bookmark database.

The user accepted the 0.1.25 Edge checks, including changes and tag synchronization between PC A and PC B, and reported successful Chrome use. That does not establish a full Chrome regression or cross-browser synchronization test. New 0.1.26 behavior is awaiting native review; see [the handoff](docs/development-state.md).

## Browse and search

All bookmarks is the default scope. Browser root names, such as Favorites bar, remain unchanged. Click a section to open it; folders expand inline. Mouse hover peeks immediately, then optionally scrolls after 1,000ms. Keyboard-only peeks and reduced motion remain static.

Type to search, or press `/`. Combine plain text, `#tag` and `@folder`; Escape restores the original browse context. Alt+top-row 1–9 selects roots in navigation order. Windows Alt+numpad character entry remains ordinary platform behavior.

**Ctrl+Shift+B** is the suggested Windows dashboard command, not a guaranteed assignment. Manage → Settings displays the actual configured shortcut. Open `edge://extensions/shortcuts` in Edge or `chrome://extensions/shortcuts` in Chrome to assign, change or remove it. The extension never overwrites your choice.

From another tab, the command searches All bookmarks temporarily. Within the dashboard it keeps the current scope. Existing queries are selected for replacement. Open editors and Manage pause the command to preserve drafts. Ordinary Ctrl+T retains address-bar focus. In the user-tested Edge already-open-dashboard case, Ctrl+F6 may still be needed to transfer focus. This limitation has not been independently established in Chrome. [Keyboard details](docs/keyboard-search.md).

## Edit and organize

Choose Edit, then click a bookmark title or its Edit button. Folder and section titles still expand; their Edit buttons open editors. Native link context menus and deliberate modifier/middle clicks remain available. Save changes title/URL/direct tags; Cancel and Escape protect dirty drafts. Escape at the discard question returns to editing.

New bookmark/New folder are available globally and inside permitted folders. Choose a real destination in All bookmarks. Drag titles to move, or use More → Move for keyboard operation and search results. More → Delete explicitly confirms native deletion, including folder descendants. No guaranteed Undo is provided.

Tags entered on folders apply to descendants without copying assignments. Editors distinguish direct and inherited tags with source paths. The archive checkbox represents only direct `archived`; effective archiving hides a subtree from browsing, search and Edit. Manage → Settings → Show archived is a local visibility override. Archiving never deletes or hides native browser bookmarks.

Received folder tags may need explicit local binding confirmation. A persistent Review notice leads to the same consolidated workflow available under Manage → Bookmarks, regardless of archive visibility. Matching names/paths alone do not prove identity. Metadata-health restrictions must not be bypassed.

Native writes and extension metadata writes are not atomic. Editors report partial outcomes and retain input. Creation retries complete the same recorded item rather than creating duplicates. Moves verify native parent/order before reporting success; uncertain outcomes require inspection, not automatic retry. Draft retention is in-page only, not a promise of recovery after closing/reloading.

## Edge Workspaces

Indexfold protects the Workspaces root and its immediate folder containers. Their native names and lifecycle stay in Edge; confirmed extension tags/archive remain editable. Ordinary descendants support creation/edit/deletion and within/between-container moves, subject to native outcome verification and existing integrity safeguards. Moves between a Workspace and an ordinary root remain restricted. Never create a Workspace through New folder.

All containers remain discoverable regardless of the active Workspace. Direct loose entries beneath the Workspaces root are omitted from browsing but remain in search (with full paths), Manage and diagnostics. [Capability assumptions and limitations](docs/workspace-capabilities.md) describe the Edge-only structural root identification; unknown Chrome roots are never inferred to be Workspaces.

## Manage

- **Settings:** System/Light/Dark appearance, Show archived, auto-scroll previews and actual keyboard shortcut. Preferences are device-local and update other dashboard tabs.
- **Bookmarks:** management/search, folder operations, complete binding review and entries excluded from dashboard browsing. Switching panels retains form drafts, query and selection.
- **Diagnostics:** version/browser, metadata health, reconciliation/events and redacted diagnostic export. Exports can contain private titles, URLs, tags and mappings; review before sharing. Advanced metadata reset requires export, inventory and explicit confirmation. It is recovery, not routine setup.

No test-data generator, automatic reset or experimental setup is required. [Coordinated recovery procedure](docs/metadata-setup.md). Reset never modifies native bookmarks or unrelated preferences.

## Build and load

The authoritative development checkout is WSL at `/home/dev/projects/bc-better-bookmarks`, with Node 24 LTS:

```sh
npm ci
npm run check
npm run extension:id
```

`npm run check` runs typecheck, lint, tests and production build. `npm run dev` watches builds. Tracked `dist/` is the exact loadable review artifact; Windows testing consumes it without rebuilding.

1. Open `edge://extensions` or `chrome://extensions` in the intended browser profile.
2. Enable Developer mode, choose Load unpacked and select `dist/`.
3. Confirm Indexfold's development ID: `nfhbegeoeafnpejpjdljhgagefbpafal`.
4. Open a fresh New Tab; keep its override if prompted. For updates, reload the extension and reopen the dashboard.
5. Use disposable content for native review. Do not reset metadata or restructure existing bookmarks as setup.

Browser sync handles native bookmarks; extension metadata uses browser-provided sync storage. Local tests and storage writes do not prove transport or compatibility between different browser vendors.

## Identity and retained technical names

Indexfold is a display rebrand of Better Bookmarks. The repository path/remote, npm identifier `bc-better-bookmarks`, manifest public key, extension ID, storage keys, metadata schemas and footer `source=bcbb` parameter remain unchanged. No data migration is needed. Historical documents and release captures retain their original names.

The validated functional baseline `mvp-validated-0.1.1`, visual checkpoint `ui-validated-0.1.15` and their branches remain intact. [Architecture](docs/architecture.md), [design](docs/ui-ux-design.md), [roadmap](docs/roadmap.md) and [native evidence](docs/cross-device-test.md) distinguish implementation checks from user-reported browser validation.
