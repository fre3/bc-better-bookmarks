# Two-device Windows Edge validation

**Status: baseline single-device behavior and sequential two-way metadata synchronization MANUALLY VALIDATED IN EDGE.** The latest user-reported test passed fresh B → A creation with tags and subsequent A → B and B → A tag edits on the same identity. The user confirmed matching development IDs on two independently built machines. The earlier incident remains recorded below; full architecture validation still includes the remaining mutation matrix and feature-specific checks. Equal local bookmark IDs are neither necessary nor sufficient.

## Evidence already reported

Recorded 2026-09-27 from the user's manual results (execution dates, Edge/Windows versions and private diagnostic exports were not supplied):

- Unpacked extension loads; both independent builds have ID `nfhbegeoeafnpejpjdljhgagefbpafal`.
- Complete Favorites/folder structure loads correctly; native Edge Favorites ordering is respected.
- Dashboard add creates a real Favorite; title and URL edits update Edge immediately; moves between folders work; dashboard deletion removes the real Favorite.
- Adding/removing user tags and tag search work.
- Native Edge rename/move changes update the open dashboard live without reopening; mapped Favorite tags survive rename/move.
- Native copy/paste of a tagged Favorite creates a new Favorite that appears immediately and does not inherit the original's tags. This is expected behavior.

The single-device observations alone do not establish Microsoft account metadata transport. Separately, on 2026-09-28 the user reported that A's existing tags had already arrived and associated correctly on B before subsequent testing. New feature checks below are **NOT YET VALIDATED** in Edge. Automated tests use pure logic and mocked/in-memory repositories; no Edge UI automation is assumed or performed.

### Cross-device incident reported 2026-09-28

On B, a newly tagged Favorite had browser ID `63` and UUID `ead34bb4-4adf-4585-86c8-fb82210aead1`. A received the Favorite as browser ID `45` without metadata. B logged the UUID as mapped at `08:58:59.004Z`, a storage-change snapshot at `08:59:00.784Z`, then lacked the metadata match at `08:59:01.028Z`, while retaining its explicit local mapping. Tag edits were blocked. A showed 6 sync keys / 3 metadata records, none for that UUID. This is a failed B → A observation, not proof that all metadata transport is unavailable. Exact changed-key evidence and the initiating deletion source were not recorded by the old build.

### Successful sequential two-way test — recorded 2026-09-28

Source: user-reported manual testing in real Microsoft Edge, following the earlier incident and Stage 1 implementation.

| Step | Result |
| --- | --- |
| Create a fresh Favorite with tags on B → receive on A | PASS — creation and tags synchronized successfully |
| Edit tags on A → receive on B | PASS — converged correctly on the same identity |
| Edit tags on B → receive on A | PASS — converged correctly on that same identity |

Conclusion: cross-device metadata sync is generally working reliably for the tested sequential creation/tag-edit workflow, including both directions and identity preservation. This is actual manual transport/association evidence, separate from automated tests or local storage acknowledgements. Exact execution times, latency, build revision, Edge versions, UUID and diagnostic exports were not supplied for this run; no values are inferred. The result does not identify the cause of the earlier loss, demonstrate recovery of that lost record, or mark unperformed mutation/journal/preflight tests as passed. Stage 2 automatic recovery remains deferred.

### Browser verification attempt — 2026-09-29 (BLOCKED; no browser evidence)

- Source checkout: `5109ce0acb8a2940a7c80cca0b2083c733c37c4f`. Installed extension build, Edge version, profile and runtime state were not observed.
- Codex Desktop's Edge/browser entry point `cua.getState()` failed before returning any tabs: `windows sandbox failed: helper_unknown_error: setup refresh had errors` (`kernel_status=exited(code=1)`, `reason=stdout_eof`). Resetting the JavaScript session and retrying failed identically. The separate Node runtime also failed during sandbox startup.
- No browser actions, fixture creation, UI observations or sync observations occurred. Suites A–D and outstanding Stage 1 journal/event/preflight checks remain **NOT YET VALIDATED**. This is an environment blocker, not an application test failure or Microsoft sync evidence.
- No automated checks were rerun. Historical automated results and user-reported Edge results retain their original scope.
- Next action: restore the Codex Desktop sandbox/browser runtime, retry Edge discovery, verify the installed build/version, then execute the disposable-root procedures below. Do not reset Edge sync or clear extension storage to address this tooling failure.

## Stage 1 hardening — manual A/B checks (transport sequence passed; other checks pending)

These steps are for the user after installing the same new build on both machines. Automated tests do not execute Edge UI or prove Microsoft transport. Keep existing incident evidence and do not clear storage, uninstall, or try to repair the missing UUID yet.

1. Verify both installed IDs remain `nfhbegeoeafnpejpjdljhgagefbpafal`. Reload the extension and open a fresh dashboard. Existing schema-v1 state should load without migration. Record build/revision and Edge versions.
2. On B, inspect the already affected Favorite. If its raw meta key is still absent, Diagnostics should show its original UUID, `Metadata: missing`, `raw meta: absent`, and its local preservation status. A record lost before Stage 1 will ordinarily show `locally preserved: false`; the journal cannot recover history it never captured.
3. Try an edit combining title/URL/folder and nonempty tags on that missing identity, then an edit with empty tags. Both must reject before any Favorite mutation. Verify the original title/URL/folder in native Edge. No new UUID or meta key should appear, and the error must not promise that waiting guarantees repair.
4. In the dedicated disposable test root, create a new tagged HTTPS Favorite. Inspect `storage.local.metadataJournal` read-only in worker DevTools: its same UUID should have the intended metadata and `locallyWrittenAt`. Treat this as private data. There should be no journal key in `storage.sync`, and the sync record remains `meta:<UUID>`.
5. Change its tags, including removing all tags. The preserved entry should reflect the latest local intent under the same UUID; another UUID's entry must remain unchanged. Inspect logs for `type=meta`, added/updated operation, old/new presence and validation, without actual tags/URL/title. These events do not indicate remote acknowledgement.
6. Close worker DevTools, reload/restart Edge and reopen the dashboard. Local preservation should remain. Existing missing metadata must remain missing: no startup replay/recovery occurs.
7. Observe A naturally receiving the new Favorite/metadata and record the actual result, including different local IDs and same stableId if matched. A receiving metadata alone must not create a local journal entry: only local authorship does. Then edit tags on A; A should preserve its own intended write before normal sync publication. Inspect B and record whether the return arrives.
8. If a disappearance recurs, promptly capture the bounded log before it rolls over. Look for the exact `meta:<UUID>` key with `operation=removed`, `oldPresent=true`, `newPresent=false`, receipt timestamp and old/new validation. Inspect `loc:`/`dead:` events too. Record raw-key presence, health status and preservation status independently; do not automatically attribute the removal to the other PC. Invalid related records should show quarantine; valid tombstones should show deleted rather than missing.
9. Confirm normal HTTPS/bookmarklet edits, user-tag search, native rename/move updates, ordering and copied-tag isolation still behave as before. No journal entry should be created solely by a derived system label.

Capacity/quota failures and event removals are covered in mocked tests; do not fill or remove real sync storage merely to exercise these checks. A journal failure blocks metadata publication without evicting existing entries, but runtime failures after a browser mutation can still report partial success. Local writes and events are not remote acknowledgements. Stage 2 recovery requires a separate review and explicit authorization.

| Stage 1 manual check | Result |
| --- | --- |
| A/B build identity, compatibility, journal durability and content-free events | NOT YET VALIDATED |
| Missing identity rejected before mutation; no automatic recreation | NOT YET VALIDATED |
| Fresh B → A creation with tags, A → B edit, then B → A edit | MANUALLY VALIDATED IN EDGE — PASS, all converged on the same identity; recorded 2026-09-28 |
| Existing behavior regression after hardening | NOT YET VALIDATED |

## SINGLE-DEVICE UI TESTING — new features (NOT YET VALIDATED)

Build with the README commands, verify the expected ID, reload the unpacked extension at `edge://extensions`, and open a fresh New Tab. Back up Favorites and use a disposable, uniquely named dashboard test root. These are steps for the user to execute manually after the build. Record version/revision, results and any errors; automated passes do not mark these steps PASS.

### A. Targeted search

Under the test root, create folders `Development` and `Work`. Select **All in dashboard** so the category sidebar does not independently filter the test. Create these fixtures:

| Title | URL | Folder | User tags |
| --- | --- | --- | --- |
| Microsoft Azure Guide | `https://example.com/azure-guide#intro` | Development | azure, important |
| Microsoft Notes | `https://example.com/notes` | Development | notes |
| Invoice | `https://example.com/invoice` | Work | azure |

Run each query in the existing search field:

1. `Guide`: guide found by title.
2. `azure-guide#intro`: guide found by URL; embedded `#` is ordinary text.
3. `#azure`: guide and invoice only; notes excluded despite its title.
4. `#azu`: same partial-tag matches.
5. `@development`: guide and notes only, based on folder path.
6. `@dev`: same partial-folder matches.
7. `microsoft #azure`: guide only; both conditions required.
8. `microsoft @development #important`: guide only; all three required.
9. `#does-not-exist`: no results.
10. `#`, then `@`: all three fixtures remain visible, no crash/error. Empty operators are ignored, including alongside other terms.
11. `#azure #important`: guide only; both tag substrings required.
12. `  MICROSOFT   @DEV   #IMPORTANT  `: guide only; case and extra whitespace do not matter.
13. Clear the field: all fixtures return in native folder order. `microsoft azure` finds the guide using AND semantics.

### B. HTTP system label

1. Clear search, create a disposable Favorite titled `HTTP label test` with URL `http://example.com` and no tags. It saves normally, without an executable-code warning.
2. Verify `HTTP` appears immediately as a read-only system label. Open Edit: the user Tags field is empty. In Diagnostics the Favorite has no stableId; metadata record/key counts do not increase solely for classification. Capture counts before/after in a quiet test tree.
3. Search `http`: the Favorite appears through ordinary search. This query can also match HTTPS URLs; it is not an exclusive HTTP filter.
4. Clear search and edit the untagged Favorite to `https://example.com`. `HTTP` disappears immediately, user tags remain empty, and no stableId/sync metadata is created. No label migration/write is required. For an already mapped/tagged Favorite, existing locator-history publication on URL edits is still expected.

### C. Bookmarklet system label and confirmation

1. Create a disposable Favorite titled `Bookmarklet label test`, with no tags, using exactly `javascript:alert('Better Bookmarks test')`. Click Save: an **Executable bookmarklet** warning explains that it can execute code in a web page and only trusted code should be saved.
2. Cancel the warning: the editor remains open and no Favorite is created. Save again and explicitly confirm: exactly one real Favorite is created.
3. Inspect its URL in native Edge Favorites. It is `javascript:` with the supplied code. Record any browser canonicalization. The dashboard must never execute the code when viewing or clicking its title; it says to run it through Edge Favorites. Merely opening/viewing the existing bookmarklet must not prompt.
4. Verify the dashboard shows `JS`, Edit's user Tags field is empty, and Diagnostics has no stableId or new synchronized metadata for this untagged Favorite.
5. Search `js`: it appears. Clear search. Add user tag `original-only`, confirm the warning again, and save. This explicit user-tag assignment now creates the ordinary metadata identity; `JS` remains separate.
6. Rename it and move it between test folders through Edge Favorites. The open dashboard updates live, `JS` remains, and `original-only` remains with the same stableId.
7. Copy/paste it through native Edge Favorites. The copy appears immediately with `JS`, no user tags and no new stableId/synchronized metadata. The mapped original retains `original-only` and its existing stableId. Verify both rows in Diagnostics.
8. Edit the copied Favorite to `https://example.com/copied-bookmarklet`: no executable-code warning, `JS` disappears immediately, and the copy remains without user metadata.
9. Edit that HTTPS copy back to the example `javascript:` URL. Cancel the warning: native URL remains HTTPS. Repeat and confirm: native URL becomes the bookmarklet and `JS` returns with no user metadata. This checks the edit path independently of creation.
10. In a disposable editor try `mailto:test@example.com`, `file:///test` or `data:text/plain,test`. Saving must report unsupported scheme and leave Favorites unchanged. HTTP/HTTPS must still save normally.

Every save whose resulting URL is `javascript:` prompts, including title/tag-only edits; confirmation is not remembered. Code is not evaluated or rewritten by the application. The browser API and textarea may apply their own text handling, so browser fidelity is a manual observation.

### D. Regression

1. Add a normal HTTPS Favorite and verify it in Edge Favorites.
2. Add, edit, then remove an ordinary user tag; verify search after each change.
3. Move the Favorite through the dashboard, then rename it through native Edge UI; verify real-time dashboard updates.
4. Compare folder/link ordering with Edge Favorites; it must still match.
5. Delete the disposable Favorite through the dashboard; verify real deletion in Edge.
6. Record A–D below. Do not mark cross-device rows PASS from these checks.

| New manual UI suite | Result |
| --- | --- |
| A: targeted search | NOT YET VALIDATED |
| B: HTTP system label and metadata absence | NOT YET VALIDATED |
| C: bookmarklet warning/cancel/save, code fidelity, JS/copy behavior | NOT YET VALIDATED |
| D: post-change regression | NOT YET VALIDATED |

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
| Extension ID | User confirmed `nfhbegeoeafnpejpjdljhgagefbpafal` | Same ID, independently built; user confirmed |
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
| Local typecheck / lint / unit tests / production package | AUTOMATED TESTED — PASS (2026-09-28): typecheck, lint, 124 tests across 6 files, production build and manifest/identity checks; Node 24.21.0 |
| Stage 1 key-level events, local preservation/failure/capacity, metadata health and preflight | AUTOMATED TESTED — 26 added regression cases, including real worker listener wiring against mocked Chrome APIs and first-publication failure retaining its UUID; no live Edge automation |
| Bookmarklet confirmation logic/preservation, scheme policy, JS/HTTP labels, targeted parsing/matching, no label metadata writes and copy isolation | AUTOMATED TESTED — pure logic and mocked/in-memory service/repository tests only; does not validate Edge mutation acceptance, warning rendering or Microsoft transport |
| Baseline Edge unpacked load / Favorites CRUD, structure/order, user tags/search, live rename/move and copied-tag isolation | MANUALLY VALIDATED IN EDGE — user report above |
| Same development ID on independently built machines | MANUALLY VALIDATED IN EDGE — `nfhbegeoeafnpejpjdljhgagefbpafal` on both |
| New bookmarklet/system-label/targeted-search UI and post-change regression | NOT YET VALIDATED — 2026-09-29 attempt blocked before browser observation; execute A–D after tooling recovery |
| New Tab prompt/override handling and worker suspension/wakeup | NOT YET VALIDATED explicitly |
| Initial A → B tag transport/association | MANUALLY VALIDATED IN EDGE — user confirmed before the 2026-09-28 incident; full environment worksheet not supplied |
| B → A new Favorite metadata transport | MANUALLY VALIDATED IN EDGE — PASS on fresh retest recorded 2026-09-28; earlier failed observation retained above |
| Sequential A → B and B → A tag edits on the same identity | MANUALLY VALIDATED IN EDGE — PASS, both edits converged correctly after fresh B → A creation |
| Mutation matrix | NOT RUN |
| Real metadata-first delivery observation | NOT RUN |
| Full architecture validation on two Windows devices | **PARTIAL — sequential creation/tag-edit sync passed; remaining mutation matrix and feature-specific checks pending** |

## Production difference

For Edge Add-ons distribution, the store provides installation/update and store identity. Do not assume it matches this development namespace. Establish the production ID and retest synchronization before designing an explicit metadata migration. Do not upload private signing material or use store publication merely to mask a failed unpacked experiment.

Official references and uncertainty classification: [technical spike](technical-spike.md). Sideloading follows [Microsoft's instructions](https://learn.microsoft.com/en-us/microsoft-edge/extensions/getting-started/extension-sideloading); sync setup follows [Microsoft's sync settings guidance](https://support.microsoft.com/en-us/edge/change-and-customize-sync-settings-in-microsoft-edge).

Historical local dependency audit after upgrading Vitest/ESLint: 0 reported vulnerabilities (2026-09-24; not a fresh audit). Build checks are not browser execution evidence. Manual baseline results came from the user; this development iteration uses no live Edge automation.
