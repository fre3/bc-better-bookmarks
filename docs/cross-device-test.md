# Two-device Windows Edge validation

**Status: NOT RUN on real devices.** Do not mark this MVP technically validated until metadata reaches the other Edge installation AND is associated with the correct Favorite there. Equal local bookmark IDs are neither necessary nor sufficient.

## Preparation

Use two Windows computers, Device A and Device B, with current desktop Microsoft Edge. Use the same Microsoft account signed into the intended Edge profile (not just Windows). Use matching Edge versions/language initially; record actual versions from `edge://version`. Personal accounts are simplest; managed accounts can have sync policies/licensing constraints.

1. Back up existing Favorites through Edge's native Favorites manager (`Ctrl+Shift+O` → menu → Export favorites). Keep this HTML file private. The extension does not implement restoration/import.
2. Choose a unique test folder name, e.g. `Dashboard Test 2026-09-24`. Do not use valuable Favorites for these tests.
3. Get the same repository revision on both computers. Do not edit/regenerate `public/manifest.json`'s public key. Deliberately use **different checkout paths** on A and B to verify path independence.
4. Install Node.js 24 LTS on both. In each repository terminal:

   ```powershell
   npm ci
   npm run typecheck
   npm run lint
   npm test
   npm run build
   npm run extension:id
   ```

5. The last command must print `nfhbegeoeafnpejpjdljhgagefbpafal`. The installed ID must also match this value. Do not proceed with different IDs: different extension namespaces cannot prove tag transport.
6. In each intended Edge profile, open `edge://settings/profiles/sync` (or Settings → Profiles → Sync if the URL redirects). Verify signed-in account, **Sync on**, **Favorites on**, **Extensions on**, **Settings on**. If paused, complete sign-in. Record the exact available toggles; the specific extension-settings dependency is an empirical question. Do not assume toggles prove transport.
7. Optionally inspect `edge://sync-internals` for overall status/errors and the extension-settings datatype if exposed. This internal page varies by Edge version. Record only status/type information, never account identifiers, tokens, or full internal dumps. Enterprise policy may prevent sync; record that as a blocker, not an application result.

Unpacked extensions must be installed manually on BOTH computers; syncing an extension's installation is distinct from syncing its data. No private signing key is needed. Neither an extension ID nor successful local storage writes establish remote sync eligibility.

## Device A — create the source data

1. Open `edge://extensions`, enable **Developer mode**, click **Load unpacked**, select `<checkout-A>\dist`.
2. Verify ID `nfhbegeoeafnpejpjdljhgagefbpafal`, version `0.1.0`, enabled, no extension errors.
3. Open a new tab. Accept/keep the New Tab override if Edge prompts. If another extension owns New Tab, disable that competing override for testing. A direct `chrome-extension://nfhbegeoeafnpejpjdljhgagefbpafal/index.html` visit can diagnose loading, but does not pass the New Tab requirement.
4. Confirm existing Favorites appear without importing. Compare a nested folder and link ordering against Edge's native Favorites manager.
5. In **Category management / test folder setup**, choose **Favorites bar** as parent and create `Dashboard Test 2026-09-24`. This selects the new local dashboard root. Confirm the real folder in native Edge Favorites. Do not create a second equivalent folder on B.
6. Click **Add link** and enter:

   | Field | Value |
   | --- | --- |
   | Title | `Sync Spike — Azure` |
   | URL | `https://learn.microsoft.com/en-us/azure/?bb-spike=20260924` |
   | Category | the new test folder |
   | Tags | `development, azure, important` |

7. Save; verify exactly one real Favorite in native Edge Favorites. Search `IMPORTANT`, `azure`, the test folder name, and `bb-spike`; the result should appear.
8. Open **Diagnostics**. Record extension ID, browser bookmark ID/parent ID, path, `syncing` if exposed, `stableId`, tags, mapping method/status, sync bytes, metadata/key counts and time. The method should be `explicit`; subsequent passes usually say `local-mapping`.
9. Click **Export diagnostic JSON**. Name it `A-created.diagnostics.json`. Keep private: it contains Favorites. The export excludes browsing history and redacts common URL secrets; arbitrary private Favorite content still requires review.
10. Record the start time. Leave Edge running and online. Optionally close all dashboard tabs: the worker must still observe changes. Do not uninstall/reinstall or reset sync during this run.

## Device B — receive and reconcile

1. Open `edge://extensions`, enable Developer mode, load `<different-checkout-B>\dist` unpacked.
2. Verify the installed ID equals A and the expected ID above. Verify same source/build and intended Microsoft account/profile.
3. Confirm Favorites/Extensions/Settings sync enabled as in Preparation.
4. Wait for normal Edge synchronization, then open a new tab. No manual import or copy of profile storage is allowed.
5. Initially the dashboard is read-only and displays all Favorites. Once A's test folder appears, select it as the local **Dashboard root**. Do not create it again.
6. Inspect the link and diagnostics. The folder/Favorite and metadata can arrive in either order. Use **Force Favorites reload** or **Force reconciliation** to rerun local logic; these do NOT force Microsoft cloud synchronization.
7. Capture results at approximately 0, 1, 5 and 15 minutes (these are observation checkpoints, not a promised service SLA). After 15 minutes without arrival, record a pending/failed observation with timestamps, versions, ID checks, toggle states and non-sensitive sync errors. Do not turn a timeout into proof that a backend is necessary.

Pass expectations:

- One Favorite, correct title/URL/category, no import, no duplicate creation.
- Tags `azure`, `development`, `important` display on that Favorite.
- Same application `stableId` on A and B. Browser IDs may differ; record both.
- B's local mapping method is `exact-locator`; status can already read `local-mapping` because opening/reloading runs multiple passes. Original method is retained.
- One synchronized metadata record for this test link, no unresolved/ambiguous match for it. Other preexisting test records, if any, must be counted separately.
- `storage.sync` bytes/keys alone are not a pass. Inspect actual metadata and the mapped Favorite.

Export `B-received.diagnostics.json`. If the Favorite exists but metadata record is absent, investigate **transport**. If metadata exists but cannot attach, investigate **reconciliation** (exact URL/title/path, root field availability, duplicates/history). Do not edit tags on B before the initial record has arrived and mapped.

## Round trip B → A

1. On B, Edit the received Favorite. Add `from-b`, remove `important`, keeping other fields unchanged. Save.
2. Verify the same stableId and unchanged metadata-record count on B. No second Favorite should exist.
3. On A, wait for normal sync. Expect `azure, development, from-b`, same stableId and one Favorite. Export `A-roundtrip.diagnostics.json` and `B-roundtrip.diagnostics.json`.
4. Query `FROM-B` on A. It must find the Favorite. Record elapsed time and exact counts. Open two New Tabs on A; edit in one, verify the other refreshes. A stale edit form should report a conflict instead of silently overwriting newer visible data.

## Mutation matrix

Perform these **sequentially**; wait for both devices to converge and export diagnostics after each. Use native Edge Favorites where specified. Keep the extension enabled on both computers.

| Action | Expected result | Actual result / times / evidence |
| --- | --- | --- |
| Rename Favorite on A using Edge Favorites UI | A's known local mapping survives; locator history published. B eventually sees native title and same tags/UUID. No new metadata identity. | NOT RUN |
| Create child folder `Moved` on A, then move Favorite there with Edge UI | Real move, old/new path history retained. B converges with same UUID/tags. Root remains the parent test folder. | NOT RUN |
| Rename `Moved` folder in Edge UI | Descendant full path changes; known mapping publishes locator; B keeps correct association. | NOT RUN |
| Edit URL through A dashboard to `https://learn.microsoft.com/en-us/azure/?bb-spike=20260924-edited` | Real URL updates; old/new locators retained; same UUID, B eventually converges. | NOT RUN |
| Add tag `reviewed-on-b` through B | A receives tag without locator rollback, second identity or second Favorite. | NOT RUN |
| Close all dashboard tabs, rename link in native A Edge UI, reopen | Worker observes event (or startup compares surviving mapping); dashboard reloads correct title/tags. Repeat with worker inspection closed so it can suspend normally. | NOT RUN |
| Delete Favorite using native Edge UI on A | No Favorite on either device after Favorites sync. A observes deletion of mapped ID and publishes tombstone. Tags cannot attach to other links; metadata retained as `deleted`, no auto-pruning. | NOT RUN |
| Recreate same URL/title/path through native Edge UI AFTER both devices received deletion | New Favorite starts untagged. Old metadata remains tombstoned. First explicit new tags create a NEW UUID. If any old tags attach, fail and preserve evidence. | NOT RUN |
| Save same URL/title in another category through Edge UI | Different full path distinguishes it; it starts untagged. Adding separate tags there creates separate metadata; no tags jump between categories. | NOT RUN |
| Create identical title+URL in SAME folder before B's first mapping | Fresh B must show ambiguity and attach no tags arbitrarily. A may retain an explicit known local mapping. To exercise fresh matching use a new unique test title/URL, pause B's sync before A's creation, create/tag on A then duplicate in native UI, resume B. Record actual arrival ordering; transient unique observations are a separate limitation. | NOT RUN |
| Change title+URL/path on a device without an established local mapping | May remain unresolved; no URL-only guessing. A device with a known surviving mapping/history is needed. | NOT RUN |
| Temporarily disable extension during deletion/recreation (disposable extra test) | Document as unsupported evidence-loss case; no reliable identity guarantee. Do not call any apparent success proof of safety. | NOT RUN |

After deletion, absence without a confirmed event can remain `unresolved` instead of `deleted`; this is conservative and must be recorded. The implementation does not infer deletions from missing data alone.

## Deliberate arrival-order tests

The unit suite simulates metadata-first/Favorite-first with different browser IDs and verifies the same final association. Real Microsoft delivery cannot be scheduled precisely:

- **Favorite first:** create an untagged test Favorite on A, wait until it appears on B, then assign tags on A. B must later attach the metadata without creating a new Favorite/UUID. Do not tag it on B while waiting.
- **Metadata first:** record it if naturally observed (B has unresolved metadata and no Favorite, then matches once Favorites arrive). Toggling Favorites sync alone may not guarantee an order. Do not claim this case manually tested unless evidence captures the intermediate state.
- **New/old locators:** open B before the rename arrives and again after it arrives. No stale-locator write loop or tag reset should occur.
- Force reconciliation twice on an unchanged tree. Sync bytes, key count and records must remain unchanged; local diagnostic timestamps/logs may change.

Optional transport-only probe: in the extension worker DevTools, inspect `chrome.storage.sync.get(null)` read-only. Compare the `meta:<stableId>` record on both devices. Do not paste raw storage or account information into public reports. The extension has no command to force a sync upload/download.

## Failure handling

- Different ID: compare built `manifest.json` key and source revision; rebuild/reload both. Do not rely on identical disk paths.
- Missing Favorites and missing metadata: check profile/account/sync/policy/connectivity before debugging the matcher.
- Favorite present, metadata absent: verify extension namespace, settings/extension sync and service status; record version and timing. This is a transport failure, not a locator failure.
- Metadata present, Favorite unmatched: inspect exact locators, duplicates, browser-root field presence/language, histories and quarantined schemas. Keep unresolved rather than manually copying browser IDs into sync.
- Quota/partial-operation error: inspect real Favorites before retrying. If Add says it already CREATED a Favorite, edit that object; do not repeat Add. Force reconciliation can retry retained locator/deletion work after quota/rate conditions clear.
- Unsupported unpacked sync after controlled repeated checks: record exact evidence, investigate official support/store-installed testing next. Stop before introducing a backend. A single timeout does not establish API impossibility.
- Do not uninstall, clear sync data, reset Edge sync, or mass-delete to make the test pass. Cleanup of real test Favorites is manual through Edge UI after exports; tombstones deliberately remain in sync storage.

## Results worksheet

| Environment / measure | A | B |
| --- | --- | --- |
| Date/time/timezone | NOT RUN | NOT RUN |
| Windows / Edge version | NOT RUN | NOT RUN |
| Source revision / build | NOT RUN | NOT RUN |
| Extension ID | NOT RUN | NOT RUN |
| Same intended account confirmed (yes/no only) | NOT RUN | NOT RUN |
| Favorites / Extensions / Settings toggles | NOT RUN | NOT RUN |
| Initial Favorite ID / parent ID | NOT RUN | NOT RUN |
| Application stableId / mapping method | NOT RUN | NOT RUN |
| Root `folderType` / Favorite `syncing` fields | NOT RUN | NOT RUN |
| Bytes / keys / metadata count | NOT RUN | NOT RUN |
| First arrival / round-trip latency | NOT RUN | NOT RUN |
| Export filenames / non-sensitive errors | NOT RUN | NOT RUN |

| Validation | Result |
| --- | --- |
| Local typecheck / lint / unit tests / production package | PASS (2026-09-24): typecheck, lint, 49 tests, production build and manifest/identity checks |
| Actual Edge unpacked load / New Tab / CRUD | NOT RUN — no browser installed in development environment |
| A → B transport and correct identity | NOT RUN |
| B → A tag round trip without duplication | NOT RUN |
| Mutation matrix | NOT RUN |
| Real metadata-first delivery observation | NOT RUN |
| Architecture technically validated on two Windows devices | **NO — pending above evidence** |

## Production difference

For Edge Add-ons distribution, the store provides installation/update and store identity. Do not assume it matches this development namespace. Establish the production ID and retest synchronization before designing an explicit metadata migration. Do not upload private signing material or use store publication merely to mask a failed unpacked experiment.

Official references and uncertainty classification: [technical spike](technical-spike.md). Sideloading follows [Microsoft's instructions](https://learn.microsoft.com/en-us/microsoft-edge/extensions/getting-started/extension-sideloading); sync setup follows [Microsoft's sync settings guidance](https://support.microsoft.com/en-us/edge/change-and-customize-sync-settings-in-microsoft-edge).

Local dependency audit after upgrading Vitest/ESLint: 0 reported vulnerabilities. No real Edge browser was available; build checks are not browser execution evidence.
