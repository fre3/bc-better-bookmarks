# Completed manual Edge session

Prepared: 2026-09-30. Updated: 2026-09-30. Status: COMPLETE — planned E1–E4, F1–F8 and G1–G3 passed within recorded scope. Conditional/deferred cases remain untested; see the result ledger and cross-device-test.md.

The user controls real Edge New Tab, Favorites, extension settings and worker DevTools. Codex supplies batches, evaluates reports, and updates this file's results, cross-device-test.md and development-state.md after each report. Computer Use cannot access the privileged extension New Tab; do not retry or bypass that restriction. User requested larger batches. Complete independent local checks together, but stop at each cross-device convergence gate before issuing another mutation.

A–C passed on 2026-09-29; D uses prior baseline evidence, not a fresh full rerun. Matching extension IDs and sequential two-way tag transport already passed. Do not repeat those acceptance tests. Tag changes below exercise new journal or post-locator behavior. Record any changed environment (device A/B, actual date/time/timezone, Edge/build revision if available); do not infer an installed build from checkout HEAD or require reinstallation. Earlier build was reported only as latest. Keep backups/diagnostic exports private and outside Git. Use only disposable test Favorites; never clear/reset sync, remove storage keys, copy profile-local state, or delete folders.

## Evidence and stopping rules

For every case report: case ID; device; action/observation timestamps; expected vs actual; Favorite title/URL/path; local browser ID and stableId where relevant; tags; metadata health/raw-key/preservation status; exact error if any. IDs may differ across devices. For cross-device cases also report recipient arrival time, UUID agreement and metadata count changes. Full private exports are unnecessary: report only relevant test rows, bounded event summaries and private export filenames if saved.

Use PASS only for observed expectations; use PARTIAL for incomplete observations, PENDING for still-awaited transport, NOT EXERCISED for unavailable prerequisites, FAIL for observed incorrect behavior. A setup failure is not an application failure. At a mismatch stop dependent steps, inspect the actual Favorite before any retry, and preserve evidence. Capture relevant logs promptly: the log ring holds only 60 entries. Key events/local writes do not prove Microsoft transport, and event origin is unknown.

Cross-device gate G: after each mutation, leave both Edges online and observe the recipient immediately and around 1, 5 and 15 minutes if needed. Stop waiting once the expected state arrives. Record actual elapsed time. At 15 minutes without convergence, stop dependent mutations and report PENDING transport with the missing Favorite/metadata/history detail; this is not proof that a backend is needed. Force reconciliation/reload runs local logic only. Never advance deletion/recreation before both sides have the required evidence.

## Read-only worker inspection helper

User opens edge://extensions, finds Indexfold, then opens its service-worker Inspect link and Console. This keeps the worker awake: close it for persistence/wakeup tests. If the link/console is unavailable, report that and leave those checks unverified. Do not paste scripts into an ordinary website console. All API calls below are reads; replace UUID placeholders only with the intended disposable test identity. Run the definition again after restarting DevTools if needed.

```js
var bbInspect = async function (id) {
  var local = await chrome.storage.local.get('metadataJournal');
  var keys = ['meta:' + id, 'loc:' + id, 'dead:' + id, 'metadataJournal'];
  var sync = await chrome.storage.sync.get(keys);
  return {
    stableId: id,
    journalSchema: local.metadataJournal?.schemaVersion ?? null,
    journalEntry: local.metadataJournal?.entries?.[id] ?? null,
    meta: sync['meta:' + id] ?? null,
    history: sync['loc:' + id] ?? null,
    tombstone: sync['dead:' + id] ?? null,
    journalKeyInSync: Object.hasOwn(sync, 'metadataJournal')
  };
};
```

Invoke with `await bbInspect('UUID_FROM_DIAGNOSTICS')`. Inspect locally; do not send unrelated private record contents. An absent journal is valid before local authorship. A preserved entry can be older than current remote metadata: it records this device's intent, not a global latest version.

## Batch E — local preservation and conditional preflight

### E1. Existing local intent and unrelated-entry baseline

On the machine used for A–C, use the disposable Microsoft Azure Guide (tags azure, important) and Microsoft Notes (tag notes); identify their stableIds in Diagnostics. If renamed/removed, use equivalent existing disposable locally tagged fixtures and record their exact starting values. Do not recreate previously passed UI tests.

Run bbInspect for both UUIDs. Record Guide's UUID, preserved metadata.tags, initialLocator and locallyWrittenAt. Save a private snapshot of Notes' journal entry for comparison. Expected: schema 1; each locally authored identity has a preserved entry and timestamp; no metadataJournal key in sync. If either was authored only remotely, absence is expected; select a locally authored guard or report guard coverage unavailable. If a post-Stage-1 locally authored entry is unexpectedly missing, stop and report rather than backfilling it.

### E2. Latest intent, empty tags and content-free events

On Guide, add tag journal-check in the dashboard, save, then inspect its journal and recent Diagnostics sync-key events immediately. Expected: same UUID, tags azure/important/journal-check in its preserved metadata, unchanged initialLocator, locallyWrittenAt representing this write, and meta:<UUID> updated. Event summary should contain type=meta, operation=updated, receipt timestamp, oldPresent=true/newPresent=true and valid old/new values, without tags/title/URL/path contents. This content restriction applies to key-change summaries, not all diagnostics. If the entry was already changed, use its recorded initial tags plus journal-check.

Remove ALL Guide tags, save and inspect again. Expected: same UUID with metadata.tags=[] in both current meta and the preserved entry, a timestamp for this later write, and another valid updated event. Compare Notes' preserved entry: it must remain byte-for-byte unchanged. No new UUID should appear. Report field comparisons; do not send private full snapshots. Keep Guide empty until E3 completes.

### E3. Persistence across reload and no startup replay

If a naturally missing identity is available on this device, first record its raw meta absence and preservation status before reload for the no-replay comparison. Close worker DevTools, reload Indexfold from edge://extensions, and open a fresh New Tab. Inspect Guide again using the helper. Expected: same UUID, journal entry and empty metadata tags survive; opening/reloading did not rewrite the journal timestamp. Notes' entry remains unchanged. Existing unrelated missing metadata, if any, must not be recreated. This validates reload persistence, not actual worker suspension or Microsoft transport. If no missing record exists, the no-replay-on-missing observation remains NOT EXERCISED.

### E4. Conditional missing-identity rejection

Only if the earlier affected Favorite still exists on its original device B with UUID ead34bb4-4adf-4585-86c8-fb82210aead1, inspect it and record its ORIGINAL title, URL, folder, metadata health, raw-key presence and preservation status. Do not use historic browser ID 63 as identity. Proceed only if the original mapping remains and raw meta is absent. Otherwise mark NOT EXERCISED with the observed reason; do not manufacture missing data.

Expected missing state: original UUID, Metadata: missing, raw meta: absent. A loss before Stage 1 normally has no local preservation; record actual status rather than assuming it.

Attempt a combined edit to title Missing preflight probe, URL https://example.com/bb-preflight-20260930, and another disposable folder, with tag preflight-check. Expected: save rejects before ANY title/URL/folder change. Verify native values still equal the originals. Repeat with the Tags field empty: same rejection and unchanged native values. No replacement UUID/meta key should appear. Error must not promise waiting will repair the identity. If the first attempt mutates anything, stop; do not proceed with the empty-tag attempt. Report partial changes before any repair. Do not create or remove raw metadata to exercise this case.

## Batch E report

Report E1–E4 individually, including unavailable prerequisites. Once Codex records the evidence, continue to batch F. Restoring Guide's original tags is optional explicit cleanup after evidence capture, not another acceptance test.

## Batch F — controlled arrival and mutation matrix

Physical device roles confirmed for this run: B is source (probe 79, Guide 75/Notes 74); A is recipient (probe 62, Guide 51/Notes 52). F1 was executed B to A despite the initial report headings. Remaining F/G actions below use these corrected physical roles. The literal tag reviewed-on-b is retained for continuity even though A will author it; its spelling does not identify the acting device.

Use one new disposable root BB Sync 20260930 on B; if that exact name already exists, choose a unique suffix and record it. Select the same naturally synchronized folder as A's local root when it arrives; never create an equivalent second folder on A. B/A labels refer to the same devices throughout this batch. No need to reinstall or re-prove matching IDs. If either installation/account changed since validation, record it before interpreting transport. Each row has gate G: one mutation, convergence, evidence, then next row. Do not execute the entire table without checking between rows.

### F1. Favorite-first arrival plus remote-only journal absence

On B create an UNTAGGED Favorite in this root: title BB Mutation Probe 20260930; URL https://example.com/bb-mutation-20260930. Wait at G until A sees it. Expected: one untagged Favorite on each side, no stableId/metadata identity for it. Capture this intermediate state: it proves Favorite-first arrival rather than inferred arrival order.

Only then add tags probe, keep on B. Record its newly assigned UUID U and B's journal entry. Wait at G for A to attach those tags to its existing Favorite under U. On A verify received meta/tags and the same UUID before any local edit. The no-journal-on-remote-receipt assertion already passed using Guide; do not request another absence check solely to repeat it. B's entry should contain probe/keep. Browser-local IDs may differ; record actual values. This case fills pending arrival-order and remote-journal coverage, not a repeat of the already passed basic round trip. If A has locally authored U unexpectedly, stop and inspect evidence rather than deleting its journal.

### F2–F6. Locator changes, then A-authored metadata

Before each action note U, tags, current title/URL/path, and the raw meta updatedAt/tags. Read history with bbInspect on both sides after convergence. Rename/move/URL changes may add loc:<U>; key/byte growth is legitimate. No second meta identity should be created. Locator-only actions must leave raw meta (including updatedAt) and the local journal unchanged. Record intermediate recipient states if history/Favorites arrive separately; transient unresolved is not a permanent failure.

| Case | Exact action | Expected after gate G |
| --- | --- | --- |
| F2 | Native Edge on B: rename probe to BB Mutation Renamed 20260930. | Both show renamed title, same U and probe/keep. History retains old/new title locators. No stale title rollback or tag reset. |
| F3 | Native Edge on B: create child folder Moved in the test root; move probe into it. | Both show the new path, same U/tags. History retains old/new path. Keep dashboard root at the parent test root. |
| F4 | Native Edge on B: rename Moved to Moved Renamed. | Both show changed descendant path, same U/tags, with both path locators retained. |
| F5 | Dashboard on B: change URL to https://example.com/bb-mutation-20260930-edited. | Native URLs on both sides match the edit; same U/tags. History retains old/new URLs; meta/journal are not rewritten by this locator-only edit. |
| F6 | Dashboard on A: add reviewed-on-b, leaving other fields/tags unchanged. | A now has its first local journal entry for U with probe/keep/reviewed-on-b. B receives those tags under U without changing Favorite location or allocating another identity. B's own journal remains its earlier locally authored probe/keep entry; remote receipt must not overwrite it. |

### F7. Closed dashboards and worker wakeup

On B close all New Tabs/dashboards and worker DevTools; keep Edge running. If edge://extensions shows the worker inactive, record that before the action; do not reopen Inspect. Native Favorites on B: rename probe to BB Worker Renamed 20260930. With B's dashboard still closed, use A to observe gate G and inspect new-title locator history and unchanged U/tags. Then reopen B's dashboard: correct title/U/tags should load. If the worker was not observably inactive, mark closed-dashboard behavior separately from actual suspension/wakeup, which remains unproven. After reopening B, inspect its bounded local logs for event/locator-publication evidence timestamped before reopening. A can publish locator history itself, so A's received title/history alone does not prove B's worker woke. Claim B wakeup only with observed prior inactivity plus B-side evidence predating reopening; otherwise record closed-dashboard convergence only. If B evidence appears only after its dashboard opens, record startup recovery rather than claiming background event delivery.

### F8. Idempotent reconciliation

After both sides settle, on B record sync bytes/key count and the U meta/history/tombstone values. Force reconciliation twice without other edits, recording after each. Expected: unchanged sync bytes, keys and records; local logs/timestamps may change. If unrelated remote events occur, label the count comparison inconclusive and inspect per-U records; do not treat global count changes alone as a defect.

## Batch G — path isolation, observed deletion and recreation

Start only after F converges. This batch deletes only the disposable probe, not a folder. Record U and its current exact title, URL and path before proceeding. Retain evidence; no bulk cleanup.

### G1. Same title/URL in a different category

Native Edge on B: create child folder Separate under the root and add a Favorite with the probe's current exact title and URL there. Gate G: expect the Separate Favorite untagged on both devices with no stableId; original remains tagged under U in Moved Renamed. On B tag Separate with separate-only; record its new UUID V, distinct from U. Gate G: A should match V only to Separate, original remains U with probe/keep/reviewed-on-b. No tags jump between paths. Leave Separate in place as the isolation control for deletion.

### G2. Observed deletion and tombstone

Keep the extension enabled on both devices. Native Edge on B: delete ONLY the original probe in Moved Renamed. Capture B's removal evidence promptly. Gate G: original Favorite absent on both; dead:<U> is present/valid on both, retained meta:<U> is treated as deleted and cannot attach to Separate (V). No automatic pruning. Journal U remains preserved on its authoring devices; its presence must not restore the deleted Favorite or metadata identity.

If no tombstone arrives, absence alone does not pass confirmed deletion: report unresolved/pending and stop before recreation. Inspect pending deletion/error evidence; do not insert a tombstone manually. Capture dead event summaries without inferring their source from storage events alone.

### G3. Recreate identical locator after both tombstones

Only after both devices confirm deletion AND dead:<U>: native Edge on B, add the exact recorded title/URL under Moved Renamed again. Gate G: recreated Favorite appears on both without old tags or a stableId; U remains tombstoned. On B assign tag recreated-only: expect new UUID W, different from U and V. Gate G: A attaches recreated-only under W. Separate retains separate-only under V. If any old U tags attach before new tagging, stop immediately and preserve evidence.

## Conditional / deferred cases

- E4 unavailable: retain NOT EXERCISED. Never remove raw keys to fabricate the historical loss.
- Metadata-first receipt: observe opportunistically during F/G. Record intermediate raw meta present + Favorite absent, followed by unique match; do not claim it from final convergence alone or force delivery ordering with storage writes.
- Fresh same-folder duplicate ambiguity and changes before first mapping: deferred to a separate controlled session. Existing B mappings cannot test fresh matching. Microsoft arrival order can briefly expose a unique candidate, so a naive duplicate test may not establish the desired prerequisite. Do not clear mappings or pause/reset account sync as part of this runbook. This deferral does not mark either matrix row passed.
- Extension-disabled deletion/recreation: remains a documented unsupported evidence-loss scenario; not performed in this session.
- Quota/capacity/storage-write failures remain mock-only coverage; do not exhaust real sync storage.
- If metadata disappears naturally: capture key-level removed events promptly (key/type/UUID, timestamp, old/new presence and validity), raw meta/loc/dead presence, health and local preservation on both devices. Preserve incident evidence, do not replay the journal, and do not attribute the removal to a device without evidence.

## Result ledger — update only from reported observations

| Cases | Status | Evidence |
| --- | --- | --- |
| E1 journal baseline | PASS — manual report 2026-09-30 | Both schema-1 entries present; journalKeyInSync=false |
| E2 latest/empty intent and unrelated-entry isolation | PASS — manual snapshots | Same Guide UUID/locator; tags updated then cleared; Notes entry unchanged |
| E2 content-free sync events | PASS — user-provided logs | Valid updated meta events at 10:33:58.095Z and 10:37:01.020Z; no content or remote acknowledgement claimed |
| E3 reload persistence | PASS — report persistence section | Guide empty tags and journal timestamp unchanged; Notes unchanged |
| E3 missing-key no-replay | PASS — observed B reload | Six identities remain missing/raw absent; two marked locally preserved before/after reload. Cause and recovery suitability not established |
| E4 missing-identity preflight | PASS — explicit user confirmation | Nonempty/empty-tag saves rejected; native title/URL/folder unchanged after both and reload |
| Remote receipt without local journal authorship | PASS — Guide on B | Matching UUID/applied tags; journal entry null; no local edits since reinstall |
| F1 controlled Favorite-first arrival | PASS — B to A, roles clarified by user | Source physical B 79/78; recipient physical A 62/61; UUID b9d0d7c5-0c34-4177-b52e-7353b4da9da0, keep/probe, exactly one recipient Favorite |
| F2 rename | PASS — snapshots and explicit UI confirmation | A/B history 2 locators; meta/journals unchanged; UI/identity/no-duplicate assertions confirmed; delays unrecorded |
| F3 move | PASS — snapshots and explicit UI confirmation | A/B history 3 locators; meta/journals unchanged; UI/identity/no-duplicate assertions confirmed; delays unrecorded |
| F4 folder rename | PASS — snapshots and explicit UI confirmation | A/B history 4 locators; meta/journals unchanged; UI/identity/no-duplicate assertions confirmed; delays unrecorded |
| F5 URL edit | PASS — snapshots and explicit UI confirmation | A/B history 5 locators; meta/journals unchanged; UI/identity/no-duplicate assertions confirmed; delays unrecorded |
| F6 recipient-local tag edit | PASS — A to B | Three-tag meta converged; A first journal at 13:29:40.439Z; B two-tag journal unchanged at 12:25:55.843Z; history/UI/UUID/no duplicate confirmed |
| F7 closed dashboards and worker wakeup | PASS — observed inactivity and source events | B inactive before rename to BB Worker Renamed Again 20260930; bookmark/locator events before reopening, A receipt; seven history locators |
| F8 reconciliation idempotence | PASS — counts and explicit record-equality confirmation | 2,881 bytes / 4 keys / 3 metadata / 40 Favorites throughout; probe meta/loc and absent dead unchanged after both forced reconciliations |
| G1 path isolation | PASS — explicit B/A phase confirmations | Separate UUID 6bd273cd-cb24-4bd1-9288-aa0136fca8a6, separate-only; original UUID/tags unchanged; one per folder, no crossover |
| G2 deletion/tombstone | PASS — B to A | Original absent on both; identical tombstones at 14:23:22.949Z, retained meta classified deleted, locally preserved true; Separate unchanged |
| G3 identical-locator recreation | PASS — intermediate/final confirmations | Initially untagged/no UUID on both; recreated-only allocated 6822fc12-ad7b-40e3-8c68-f172ab1a2b9a (B83/A66); old UUID deleted, Separate unchanged; no pending deletions/orphan histories |

Split grouped rows into per-case outcomes as results arrive. After each report Codex updates matching original matrix rows in cross-device-test.md and the current checkpoint in development-state.md. Do not mark an entire batch passed when individual prerequisites or observations were unavailable. Current checkpoint: planned session complete. Preserve original tombstone U=b9d0d7c5-0c34-4177-b52e-7353b4da9da0, Separate V=6bd273cd-cb24-4bd1-9288-aa0136fca8a6, recreated W=6822fc12-ad7b-40e3-8c68-f172ab1a2b9a, and known missing fixtures. Next user-started session is UI/UX-focused; no further functional testing is scheduled. Deferred validation requires separately scoped prerequisites, without repeating passed checks or clearing mappings.
