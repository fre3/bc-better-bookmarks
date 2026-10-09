# Development State

Last updated: 2026-10-09
Release: **Indexfold 1.0.0**. Prepared on `release/1.0.0` from the actual local 0.1.29 implementation (`4d238f2`), with production source/build/documentation published through stable `master` and annotated `v1.0.0`.

Production commit: **`v1.0.0^{commit}`**, available at the [immutable release source](https://github.com/fre3/indexfold/tree/v1.0.0); resolve its full SHA with `git rev-parse 'v1.0.0^{commit}'`. [GitHub release and runtime assets](https://github.com/fre3/indexfold/releases/tag/v1.0.0). The release workflow verifies/builds/packages the tagged source and publishes a normal release; publication checks and full SHA are reported at handoff.

## Preserved references and identity

- `mvp-validated-0.1.1` and `archive/mvp-validated-0.1.1`: `1217369dd10638942d80107d5f33d7f61491d075`.
- `ui-validated-0.1.15` and `feature/ui-ux-redesign`: `0e6a596210b2be2d273eab4a19d2268d9a1407a1`.
- `editing-validated-0.1.27`: `bd87c83232eebce4afca1e86c9bcc6c2c436fcb7`.
- `feature/bookmark-editing` remains at `4d238f2`; release work has its own branch. Master advances by fast-forward from the old baseline under explicit release authorization; archive/validation refs are not moved.
- SSH origin: `git@github.com:fre3/indexfold.git`. WSL checkout remains `/home/dev/projects/bc-better-bookmarks`. Windows clone, supplied untracked media and live bookmarks are untouched.
- Public manifest key/extension ID **`nfhbegeoeafnpejpjdljhgagefbpafal`**, storage namespaces, sync schema, metadata generation and preferences are unchanged. No reset or migration.

## Changes since accepted editing checkpoint

**0.1.28 (`06c171d`)** reproduced the exact ResizeObserver window warning on the prior source. Coverage writes resized a sibling observed by footer measurement; footer spacer writes resized shallower observed ancestors. Coalesced ordered frame tasks and guarded writes correct the feedback without suppressing errors. Initial and animated geometry remain accurate; work stops when transitions settle. The committed regression fails against 0.1.27 with five peek-entry window errors and passes afterward with zero errors, bounded callback counts and painted-boundary checks. [Full audit/evidence](resize-observer-0.1.28.md).

**0.1.29 (`2de0e76`, `4d238f2`)** removes search-only full-path suffixes after bookmarks/folders/sections. Root provenance and ancestor hierarchy still provide context; path matching and full paths in Manage/dialogs remain. The footer referral parameter is now `source=indexfold`.

**1.0.0** integrates prepared documentation commit `7b94a8096bc9ec83d01a42d4b7ede25fda7954f7` (cherry-picked as `7122d3a`), real synthetic-data screenshots and a persistent User guide link in Manage. Current presentation loses pre-release wording. Release versions match across package, lock and manifests.

Real Linux Chromium loading exposed a missing default shortcut declaration: the Windows-only suggestion made the manifest invalid on Linux. Added default Ctrl+Shift+B alongside unchanged Windows Ctrl+Shift+B. Actual assignments remain configurable/removable; no new permission. A compatible transitive build dependency patch (`source-map-js` 1.2.1 → 1.2.2) clears the npm audit. No synchronization or mutation architecture change.

## Verification

- `npm ci`: locked install succeeded; dependency audit reports zero vulnerabilities after the narrow patch.
- `npm run check`: **261 tests / 25 files**, typecheck, lint, production build, version and stable extension-ID verification passed.
- Rendered regressions passed: `check-resize-observer`, `check-peek-scroll`, `check-navigation-followup`, `check-023`, `check-026`, `check-management-dismissal`, `check-search-context`, `check-editing`, `check-appearance`.
- ResizeObserver regression: zero window ErrorEvents, settled geometry and no pending measurement work, including light desktop, dark narrow, reduced motion and repeated wheel/pointer footer cycles.
- Actual 1.0.0 extension loaded in a new Chromium 153.0.8010.12 Linux profile: native synthetic creation, direct/inherited tags, archive exclusion, search/Escape, themes, and guide keyboard activation from all Manage panels with the draft retained. Documentation captures are from this production UI, not a mockup. All three images visually inspected.
- ZIP extraction matches tracked dist byte-for-byte. The same real-extension check is run against the extracted ZIP. No development endpoints, test fixture globals, content scripts, host permissions or private signing/diagnostic files in the runtime asset.
- `scripts/package-release.py` emits a deterministic ZIP with manifest at root and SHA-256 sidecar. ZIP SHA-256: `22e98351b6de7835b663ee5e8beabb11225bdbe1b418f0977b96ee52ad426dc4`.
- Outgoing tracked files and added-file history were inspected for private media, diagnostic exports and credential signatures. Supplied screenshots/videos remain untracked. Older tracked generated review evidence is synthetic fixture output and remains historical.

These are automated Linux Chromium results, **not fresh native Windows Edge, macOS or browser-store testing**. No new two-device sync run was performed for v1.0.0.

## Native evidence and closed investigation

The user accepted 0.1.27 in native Edge and reported cross-Workspace movement and synchronization between PCs passed. Earlier reported 0.1.18 two-device scenarios passed: native subtree sync, explicit folder binding, inheritance/search, bidirectional tag edits, rename/move with retained associations/source paths, and independent archive visibility. Test-subtree deletion propagation was not explicitly confirmed. The earlier missing-tag report was resolved by folder-binding confirmation, not a transport redesign.

Specific later reports already supplied in this conversation: the user reported all 0.1.28 requested checks passed with no further extension errors, while identifying a separate redundant-path presentation issue; subsequently reported the 0.1.29 correction passed. These are recorded as the user's reports, not extrapolated into fresh v1.0.0 or unperformed Chrome/cross-browser acceptance. Successful Chrome use was reported earlier, without a comprehensive Chrome regression claim.

The historical native-title-change investigation remains **closed** following nonrecurrence across several releases; the original cause is unconfirmed. This is not a proven title-overwrite fix. Preserve its [historical evidence](move-identity-0.1.23.md), separately from the proven duplicate-binding correction in 0.1.23. No guessed repair, merge, reset or recreation was performed.

## Limits and release readiness

No reproduced release-blocking defect remains in the tested workflows. Native bookmarks remain authoritative; native mutations and metadata are not atomic. Preserve partial-success recovery, dirty drafts and conservative unresolved identities. Folder associations may require explicit review on a second device. Concurrent tag edits/browser-sync timing and quotas remain limitations, not guaranteed seamless synchronization.

Workspace containers/root remain protected; ordinary descendant and cross-container moves work through verified native outcomes. Workspace-to-ordinary-root moves remain restricted. No reliable active-Workspace signal/filter. See [capability policy](workspace-capabilities.md).

Edge may retain address-bar focus on an already-open dashboard; Ctrl+F6 remains the accepted workaround. Alt+top-row digits work; Windows Alt+numpad character entry is not suppressed. Store identities/distribution are outside this GitHub release. A future store identity requires separate sync/migration review.

Deletion has no Undo. Diagnostics may contain private titles, URLs, tags or bookmarklet code. Drafts are not guaranteed to survive closing/reloading the browser. No page-content fetching, analytics/search backend, new broad permissions or deferred feature work was introduced.

## Install/update and next action

Download `indexfold-1.0.0-unpacked.zip` and its `.sha256` from the release. Extract into a permanent directory, then use Developer mode → Load unpacked in `chrome://extensions` or `edge://extensions`. For an existing unpacked installation, replace files in its existing directory and Reload; do not uninstall solely to update. Open a fresh tab. This is not a browser-store listing. Full instructions: [README](../README.md); everyday usage: [User guide](user-guide.md).

Post-release smoke: install/update; open New Tab; focus page and try typing, #tag and Escape; edit/move one disposable bookmark; switch appearance; open Manage → User guide and confirm the draft remains. On Edge, retain Ctrl+F6 fallback and existing sync setup. No broad repeat of the passed two-device suite is required by this documentation/link release.

Wait for post-release feedback. Semantic search, thumbnails, copying/bulk actions, cross-tab/external drops and deeper recovery remain deferred in the [roadmap](roadmap.md).
