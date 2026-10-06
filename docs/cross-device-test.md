# Two-device Windows Edge validation

**Status: baseline single-device behavior and sequential two-way metadata synchronization MANUALLY VALIDATED IN EDGE.** The completed session validates A–C (including C.6–C.10), accepted prior D baseline, Stage 1 E1–E4, and cross-device F1–F8/G1–G3. No outstanding functional test failures were reported in this session. The user confirmed matching development IDs on two independently built machines. The earlier incident remains recorded below; full architecture validation still excludes explicitly deferred ambiguity/delivery cases. Historical failures below are retained evidence, not new failures of the accepted baseline. Equal local bookmark IDs are neither necessary nor sufficient.

Historical sections preserve observations and instructions as they stood at the time. Their pending/unrun wording is superseded by the dated results and final ledger; do not restart completed tests. The next session is UI/UX-focused; see [development-state.md](development-state.md).

## Evidence already reported

Recorded 2026-09-27 from the user's manual results (execution dates, Edge/Windows versions and private diagnostic exports were not supplied):

- Unpacked extension loads; both independent builds have ID `nfhbegeoeafnpejpjdljhgagefbpafal`.
- Complete Favorites/folder structure loads correctly; native Edge Favorites ordering is respected.
- Dashboard add creates a real Favorite; title and URL edits update Edge immediately; moves between folders work; dashboard deletion removes the real Favorite.
- Adding/removing user tags and tag search work.
- Native Edge rename/move changes update the open dashboard live without reopening; mapped Favorite tags survive rename/move.
- Native copy/paste of a tagged Favorite creates a new Favorite that appears immediately and does not inherit the original's tags. This is expected behavior.

The single-device observations alone do not establish Microsoft account metadata transport. Separately, on 2026-09-28 the user reported that A's existing tags had already arrived and associated correctly on B before subsequent testing. New feature checks below are **PARTIALLY VALIDATED** in Edge: suites A–C passed on 2026-09-29; D baseline evidence is carried forward without a fresh complete rerun. Stage 1 E1–E4 and planned cross-device F1–F8/G1–G3 subsequently passed; see their evidence below. Automated tests use pure logic and mocked/in-memory repositories; no Edge UI automation is assumed or performed.

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

### Browser verification attempt — 2026-09-29 (historical tooling incident; no extension evidence)

- Source checkout: `5109ce0acb8a2940a7c80cca0b2083c733c37c4f`. Installed extension build, Edge version, profile and runtime state were not observed.
- Codex Desktop's Edge/browser entry point `cua.getState()` failed before returning any tabs: `windows sandbox failed: helper_unknown_error: setup refresh had errors` (`kernel_status=exited(code=1)`, `reason=stdout_eof`). Resetting the JavaScript session and retrying failed identically. The separate Node runtime also failed during sandbox startup.
- No browser actions, fixture creation, UI observations or sync observations occurred. Suites A–D and outstanding Stage 1 journal/event/preflight checks remain **NOT YET VALIDATED**. This is an environment blocker, not an application test failure or Microsoft sync evidence.
- No automated checks were rerun. Historical automated results and user-reported Edge results retain their original scope.
- Subsequent user report: the tooling incident was resolved; Edge Computer Use successfully opened example.com in a fresh Codex chat, the built-in browser works, and `codex doctor` reports no problems. This is user-reported tooling evidence, not extension UI or Microsoft sync evidence.
- Resume attempt in this chat: after `js_reset`, `cua.getState()` still failed before returning any browser state with the same sandbox startup error (`kernel_pid=34476`, `kernel_status=exited(code=1)`, `reason=stdout_eof`). No extension actions occurred. The cause of the difference between chats is unknown; do not infer a global browser outage or application failure.
- Next action: continue the pending A–D suites in the verified working fresh chat (or this chat once Edge discovery works), first recording installed build/version. Preserve prior baseline/sync results. Do not reset Edge sync or clear extension storage for this tooling issue.

### Browser verification resume — 2026-09-29 (discovery restored; URL-policy blocker)

- Source checkout: `9b1a327e310c0817aa3c87b127622266c77fa6e9`; installed build/revision and Edge version remain unverified.
- Actual Computer Use observation: `cua.getState()` succeeded and returned Edge with a tab inventory. No dashboard or extension-management tab appeared in that inventory. Private unrelated tab contents/URLs are not reproduced here.
- `cua.createBrowserTab('edge', 'edge://extensions', ...)` was rejected before extension inspection: `The browser URL policy blocks this action` and `Allowed protocols: "http:", "https:"`. The tool explicitly prohibited workarounds, indirect execution, raw CDP/browser commands and alternate browser surfaces for the blocked action. No workaround was attempted.
- This is a tooling-policy limitation, separate from the historical sandbox startup errors and from application behavior. No fixtures were created, no Favorites or extension storage were changed, and no suite A–D assertion was exercised. No new Microsoft sync evidence or automated test result was obtained. All prior reported validation retains its original scope.
- Subsequent user confirmation (2026-09-29): the loaded extension in Edge uses the latest repository build. Mark the current single-device loaded-build check **MANUALLY COMPLETED — PASS (user-reported)**. No exact installed revision/version string or Edge version was supplied; do not infer those values or extend this confirmation to both devices, journal durability, or suites A–D.
- Next action: suite A targeted search, then B–D, manually or through an approved tool configuration supporting extension/internal pages. The current loaded-build check does not need repeating. Record actual observations before changing any suite status; do not reset sync or clear storage for this tooling limitation.

### Already-open dashboard attempt — 2026-09-29

- At the user's request, `cua.listTabs({browser:'edge'})` returned a tab titled `Better Bookmarks` at `edge://newtab/` (tab `844604392`). This establishes tab-inventory visibility only.
- Selecting that exact existing tab with `cua.getTab('844604392', {browser:'2'})` returned title/URL `about:blank` and accessibility content `AXWebArea about:blank`. A subsequent `getAXState()` and tab listing also showed `about:blank`. No dashboard controls were exposed.
- No navigation, reload, dashboard input, or Favorite/storage mutation was issued. The reason the selected tab differs from the initial inventory is unknown; do not attribute it to the extension. No alternate access route was attempted.
- The loaded-build prerequisite remains manually complete by user confirmation. Suites A–D remain unrun; this observation does not validate New Tab rendering or change any previous application/sync result.

### Interactive manual session — 2026-09-29

- The user established that Edge Computer Use cannot access the extension New Tab UI because of its privileged URL policy. This supersedes the earlier plan to resume automated access in a fresh chat; it is a tooling restriction, not an extension failure.
- Proceed through suites A–D using user-performed actions in the real Better Bookmarks New Tab. User now requests larger batches for remaining suites. Preserve prior passes and reuse evidence instead of repeating validated checks.
- Environment: user reports latest build; exact installed revision/version was not supplied. Evidence is user-reported manual Edge behavior, separate from automated checks and Microsoft sync evidence.
- Suite A fixture setup: PASS — user reports all three links appeared after the requested setup. This does not yet validate search queries.
- Suite A.3–A.4 targeted tag search: PASS — user reports both #azure and #azu returned Microsoft Azure Guide and Invoice, excluding Microsoft Notes.
- Suite A.5–A.6 category search: PASS — user reports both @development and @dev returned Microsoft Azure Guide and Microsoft Notes, excluding Invoice.
- Suite A.7, A.8 and A.11 combined search: PASS — user reports microsoft #azure, microsoft @development #important, and #azure #important each returned Microsoft Azure Guide only.
- Suite A.9–A.10 unmatched tags and empty operators: PASS — user confirms all expected results: #does-not-exist returned none; lone # and lone @ each returned all three fixtures; microsoft # @ returned Microsoft Azure Guide and Microsoft Notes. No errors were reported.
- Suite A.2 and A.12 URL text and case/whitespace: PASS — user reports azure-guide#intro and the supplied uppercase/extra-whitespace mixed query each returned Microsoft Azure Guide only.
- Suite A.1 and A.13: PASS — user confirms Guide and microsoft azure each returned Microsoft Azure Guide only, and clearing search restored all three fixtures. Native-order coverage reuses prior baseline evidence; it was not retested in this session.
- Suite A complete: all requested query checks passed.
- Suite B: PASS — user reports all HTTP-label checks passed, including no executable-code warning, immediate read-only label, empty user tags, absent stableId, ordinary http search and label removal after HTTPS edit. Reported sync usage at all three checkpoints: 4,762 / 102,400 bytes; 10 / 512 keys; 7 metadata records. These local observations do not prove Microsoft sync.
- Favorites-count correction: user clarified the HTTP-test total was 36 before creation and 37 afterwards; the earlier unchanged total was a recording typo. Discrepancy resolved (the user called this suite A, but the referenced count belongs to suite B).
- Suite C.1–C.5: PASS — user reports all steps passed: warning/cancellation without creation, confirmed creation of one Favorite, exact native URL fidelity, JS label/search, empty tags and absent stableId/unchanged metadata counts before tagging, then original-only tag assignment with renewed warning and a stableId. UUID value was not supplied.
- Accepted C.3 interaction: bookmarklet title is not clickable; an info label reads "Run this bookmarklet through Edge Favorites." User explicitly accepts this. Dashboard non-execution is covered by the disabled title; no clickable-title action is claimed.
- Suite C.6–C.10: PASS — user reports all remaining steps succeeded: native rename/move updated the dashboard and preserved JS/original-only/stableId; copy retained JS without user tags, stableId or additional metadata; HTTPS conversion removed JS without a warning; cancelling conversion back to javascript preserved the native HTTPS URL; confirming restored the bookmarklet/JS without user metadata; mailto:test@example.com was rejected without changing the Favorite. Unsupported-scheme runtime evidence covers mailto only, not file or data.
- Suite D disposition: prior manual baseline CRUD, tag add/remove/search, native updates, ordering and deletion evidence is carried forward under the user instruction not to repeat validated checks. Current-session A–C observations provide additional overlap, but a fresh complete post-change D run was not performed or claimed.
- Session complete: suites A–C passed; D baseline coverage reused. No automated checks were rerun and no new Microsoft transport evidence was produced. Remaining Stage 1 journal/event/preflight checks and the cross-device mutation matrix are outside this completed A–D session.

## Completed manual session — 2026-09-30

[Exact manual runbook](next-manual-session.md): batches E–G provide user actions, expected observations, read-only journal inspection, convergence gates and a result ledger. All planned E1–E4, F1–F8 and G1–G3 cases passed within recorded scope. Deferred ambiguity/pre-mapping and delivery cases remain separately identified. The user performs privileged Edge/New Tab actions; Codex evaluates reports and updates evidence/state. Prior A–C, carried-forward D and sequential two-way sync results remain unchanged. The result ledger records supplied manual evidence; the procedure alone is not evidence.

## Journal evidence — user report recorded 2026-09-30

Source: user-supplied Batch E1–E3 — journal preservation.txt, kept outside the repository. Seven read-only snapshots were compared; raw report/diagnostic contents are not committed. Device A/B designation and exact installed build/Edge version were not supplied with this report. Source checkout version does not prove installed version.

- E1 PASS: Guide UUID df93464e-a78e-477c-bb30-b8816e3d51f1 and Notes UUID a757570a-4a76-4d0c-bf56-ca85820ff8ba each have schema-1 journal entries. Guide initially preserved azure/important at 2026-09-30T10:16:58.619Z; Notes preserved notes at 2026-09-30T10:17:17.590Z. All supplied snapshots report journalKeyInSync=false.
- E2 journal behavior PASS: Guide preserved azure/important/journal-check at 2026-09-30T10:33:58.094Z, then [] at 2026-09-30T10:37:01.019Z. UUID and initialLocator remain unchanged. Current meta equals preserved metadata in all four Guide snapshots. Notes' journal entry is structurally identical across all three snapshots, including tags, initialLocator and timestamp. These after-save reads do not independently establish the internal write-before-publication ordering.
- E2 event summaries PASS: user supplied meta:df93464e-a78e-477c-bb30-b8816e3d51f1 updated events at 2026-09-30T10:33:58.095Z and 2026-09-30T10:37:01.020Z. Both show oldPresent=true/newPresent=true and old=valid/new=valid, without tag/title/URL/path contents. Both explicitly state origin/remote acknowledgement unknown. Surrounding logs report Guide local-mapping(51), Notes local-mapping(52), and 39 Favorites; these IDs/count apply only to that source profile.
- E3 reload persistence PASS based on the report's persistence section: Guide retains its empty tags and exact journal entry/timestamp after the requested reload; Notes remains unchanged. No fresh worker-suspension or Microsoft transport claim follows.
- E3 missing-key no-replay PASS for the observed reload: later E4 feedback shows the historical identity and five other identities missing/raw absent before and after reload. Two of the other identities are marked locally preserved. Scope and completed E4 observations are recorded below.
- Device B environment change: user reinstalled the extension after moving dist. On launching, B showed Guide with the same UUID df93464e-a78e-477c-bb30-b8816e3d51f1 and all tag changes applied. This is user-reported recipient convergence after reinstall; intermediate delivery sequence, latency, mapping method and journal contents were not supplied. Do not infer preservation of B local state or recovery of the historical missing UUID ead34bb4-4adf-4585-86c8-fb82210aead1 from Guide convergence.
- Remote-receipt journal check PASS (Guide): B returned null for Guide UUID df93464e-a78e-477c-bb30-b8816e3d51f1 in metadataJournal; user confirms no changes on B since reinstalling. Together with matching UUID/applied tags, this supports receipt without local authorship creating a journal entry. Controlled Favorite-first delivery and subsequent B-local journal creation remain untested.
- E4 prerequisite CONFIRMED: current B diagnostics show historical UUID ead34bb4-4adf-4585-86c8-fb82210aead1 on local Favorite 63 (parent 61), explicit mapping, no active match, Metadata: missing, raw meta: absent, locally preserved: false. Corresponding A Favorite 45 (parent 38) is unmapped with no assigned metadata. Both reported syncing=true, managed=no and dateAdded=1790585703570. Equal dateAdded does not establish portable identity. No raw client title/URL is copied into this evidence summary. The explicit mapping is currently present despite the reported reinstall; the reinstall mechanism and broader local-state continuity remain unknown.
- E4 feedback recorded 2026-09-30 from the user-provided pasted-text attachment; raw attachment is not committed. Both nonempty-tag and empty-tag edit attempts returned the same displayed error: "Error: Error: Known identity has missing synchronized metadata. Identity retained; automatic recovery is disabled. Inspect diagnostics and local preservation status." E4 PASS: subsequent explicit user confirmation establishes original native title, URL and folder remained unchanged after both rejected saves and reload.
- Before-edit log groups occur at 12:07:34.496Z and 12:09:13.410Z. Historical ead34bb4 remains missing/raw absent/preserved false throughout. At extension installed/updated 12:10:42.915Z and subsequent snapshot health 12:10:51.473Z, that state persists. Count stays 39 Favorites, but equal count does not prove unchanged title/URL/folder or absence of additional UUIDs elsewhere.
- Additional missing-state evidence: prefixes 373422c2, 93fac314, 61844834 and ead34bb4 show locally preserved false; 05f04626 and 60fc3291 show locally preserved true. All six remain missing/raw absent before and after reload. This supports no automatic recreation during the observed reload, including two identities with local preservation. Full UUIDs and journal contents of the two preserved identities were not supplied. The user subsequently confirmed the other missing entries were already known and intentionally retained as test cases. This is not a newly reported loss incident. The logs do not identify their original loss cause or establish whether preserved contents would be safe to recover. No automatic replay or manual storage repair is authorized by this evidence.
- E4 complete; missing records remain retained test cases. Subsequent completed F1 evidence and confirmations are recorded below. No storage repair or journal replay is part of this session.

## F1 controlled arrival evidence — 2026-09-30

Source: user-supplied pasted F1 report; raw attachment is not committed. User confirmed roles were swapped: creation/tagging occurred on physical PC B, receipt on physical PC A. The initial pasted report followed the prompt headings A/B, which were reversed for this execution; corrected physical labels are used below.

- Favorite-first ordering PASS: source creation at 12:21:09.501Z; recipient creation at 12:21:12.173Z. Recipient diagnostic row shows local Favorite 62 / parent 61, no stableId, unmapped/no assigned metadata, under the disposable BB Sync 20260930 root, before source tagging.
- Source physical PC B (initial report heading A): Favorite 79 / parent 78; UUID b9d0d7c5-0c34-4177-b52e-7353b4da9da0; tags keep/probe; explicit/local-mapping; valid raw metadata and locally preserved true. Source meta-added event at 12:25:55.844Z has oldPresent=false/newPresent=true, old=absent/new=valid and no content values.
- Recipient physical PC A (initial report heading B): matching meta-added event at 12:25:56.765Z; mapping for that UUID to the same preexisting local Favorite 62 in subsequent snapshots, latest 12:25:57.589Z. Reported Favorite count remains 40. This confirms receipt and same-identity attachment to the existing node. User confirmed recipient displays keep/probe and exactly one test Favorite, then clarified creation was on PC B with roles swapped. F1 PASS: physical B to A, Favorite-first arrival, same UUID, tags attached to the existing single Favorite.
- Timestamp differences: creation events 2.672 seconds apart; meta-added events 0.921 seconds apart; source meta-added to supplied final recipient snapshot 1.745 seconds. These are cross-device clock differences, not calibrated transport latency; clock alignment was not verified.
- Device roles RESOLVED by user: physical B is source probe 79/parent 78 (Guide 75, Notes 74); physical A is recipient probe 62/parent 61 (Guide 51, Notes 52). These agree with the earlier journal-profile assignments. Retain earlier evidence labels; F1 ran B to A. Keep physical labels fixed for subsequent mutations: B performs locator changes, A receives and later authors reviewed-on-b as the existing test tag literal (the tag name is not a device identifier).
- F2–F5 subsequently passed with snapshot evidence and explicit UI confirmation recorded below. Current next checkpoint is F6 on A, received on B; do not repeat F1–F5.

## F2–F5 snapshot evidence — 2026-09-30

Ten supplied JSON snapshots (A/B baselines plus A/B after each action) were compared structurally. Raw attachment remains outside Git. Physical B performs changes; A receives. UUID is b9d0d7c5-0c34-4177-b52e-7353b4da9da0.

| Case | Storage assertions | Remaining observation |
| --- | --- | --- |
| F2 rename | PASS: matching A/B history with original and renamed title, 2 locators | PASS — user confirmed expected changes on both PCs, same mapped UUID/tags and no duplicate/new identity |
| F3 move | PASS: matching A/B history retains root and Moved path, 3 locators | PASS — same complete UI/identity assertions explicitly confirmed by user |
| F4 folder rename | PASS: matching A/B history retains Moved and Moved Renamed paths, 4 locators | PASS — same complete UI/identity assertions explicitly confirmed by user |
| F5 URL edit | PASS: matching A/B history retains old URL and edited URL under Moved Renamed, 5 locators | PASS — same complete UI/identity assertions explicitly confirmed by user |

For every pair, raw meta is structurally identical to baseline, including keep/probe, immutable initialLocator, same UUID and updatedAt 2026-09-30T12:25:55.842Z. B journal is structurally identical to baseline, including locallyWrittenAt 2026-09-30T12:25:55.843Z; A journal remains null. Thus observed locator publication/transport did not rewrite tags or either journal. History records alone do not prove recipient native Favorites changed or that no additional identities exist outside the queried keys. No delay measurements were supplied; do not infer them from unchanged metadata timestamps.

F2–F5 PASS: user explicitly confirmed that after each step both PCs showed the expected title/folder/URL change, retained the same mapped UUID and tags, and had no duplicate Favorite or new identity. Arrival delays remain unrecorded. Next: F6 on A, first local tag authorship after remote receipt, while B retains its older locally authored journal entry. No repeat mutations are needed.

## F6 recipient-local authorship — PASS, 2026-09-30

Physical A (probe 62) added reviewed-on-b; physical B (probe 79) received it. User explicitly confirmed both PCs retain current title/folder/URL/UUID with no duplicate. Snapshots were compared against F5; raw attachments remain outside Git.

- A/B meta identical: UUID b9d0d7c5-0c34-4177-b52e-7353b4da9da0, tags keep/probe/reviewed-on-b, updatedAt 2026-09-30T13:29:40.438Z. Immutable initialLocator unchanged.
- A journal was null in F5 and now contains this same metadata, locallyWrittenAt 13:29:40.439Z. This is observed first local authorship after remote receipt.
- B journal remains structurally identical to F5: keep/probe only, metadata updatedAt 12:25:55.842Z, locallyWrittenAt 12:25:55.843Z. Remote receipt did not overwrite B's local intent.
- Both histories remain structurally identical to their F5 five-locator snapshots. No locator rollback, new identity or duplicate reported.
- Source meta-updated event 13:29:40.439Z; recipient event 13:29:41.362Z: 0.923-second timestamp difference. Recipient snapshot 13:29:41.580Z: 1.141 seconds after source event. Cross-device clock alignment unverified; intervals are not calibrated latency. Content-free events show old/new present and valid. B import-began/ended logs alone do not imply user import or explain transport origin; no such inference is made.
- Next: F7 closed-dashboard/worker wakeup, then F8 unchanged-tree reconciliation, on B with observations on A. Capture B logs before F8 can rotate them.

## F7–F8 evidence — 2026-09-30

F7 worker wakeup/closed-dashboard event handling PASS from reported sequence: user accidentally renamed with B dashboard open first (BB Worker Renamed 20260930), then closed all B dashboards/worker DevTools, explicitly observed service worker (Inactive), and performed a distinct native rename to BB Worker Renamed Again 20260930. The earlier rename is setup history, not wakeup evidence. B logged loc:<probe UUID> updated at 13:43:53.534Z and bookmarks.changed at 13:43:53.538Z, before the reported reopening step after A observation. A logged matching locator update at 13:43:54.457Z and bookmarks.changed at 13:43:54.468Z. Source-to-recipient locator-event timestamp difference is 0.923 seconds, not clock-calibrated latency. Exact B reopening instant was not separately stated; sequence places it after A observation and the source event, with later B snapshots at 13:44:30.766Z and 13:44:31.242Z.

A/B histories are structurally identical with seven locators, including both worker-test titles and all prior locators. Probe remains mapped to B 79/A 62 under UUID b9d0d7c5-0c34-4177-b52e-7353b4da9da0, three current tags unchanged. A journal remains the F6 three-tag entry; B remains the older two-tag entry. Active probe title for subsequent tests is BB Worker Renamed Again 20260930, path BB Sync 20260930 / Moved Renamed, URL https://example.com/bb-mutation-20260930-edited.

F8 PASS: sync usage/count assertions PASS at all three checkpoints: 2,881 bytes, 4 keys, 3 metadata records, 40 Favorites; local preservation count 3; unresolved/ambiguous/deleted/quarantined 0. Reconciliation timestamps: 13:44:31.242Z baseline, 13:54:56.926Z first forced pass, 13:55:29.052Z second. One baseline raw snapshot contains valid meta and seven-locator history, no dead key. User subsequently explicitly confirmed probe meta, loc and absent dead records were unchanged after each of the two forced reconciliations. Together with stable usage/counts, this passes the observed idempotence case. Scope is reported counts and queried probe records, not a captured whole-storage byte comparison.

F8 complete; subsequent G1–G3 evidence is recorded below. Known missing test records remain untouched.

## G1 path isolation — PASS, 2026-09-30

User explicitly confirmed both phases on physical B (author) and A (recipient). The new native Favorite under BB Sync 20260930 / Separate used the same title BB Worker Renamed Again 20260930 and URL https://example.com/bb-mutation-20260930-edited as the original under Moved Renamed. Both dashboards first showed Separate with no tags/stableId, while the original retained UUID b9d0d7c5-0c34-4177-b52e-7353b4da9da0 and keep/probe/reviewed-on-b. After B explicitly assigned separate-only, both PCs showed new UUID 6bd273cd-cb24-4bd1-9288-aa0136fca8a6 on Separate, distinct from the original. Original identity/tags unchanged; one test Favorite per folder; no tag crossover. Arrival timestamps not supplied.

G2–G3 subsequently passed with both deletion/tombstone convergence gates; see below.

## G2–G3 deletion and recreation — PASS, 2026-09-30

User performed native actions on physical B, receiving on A. Raw diagnostic exports remain outside Git.

- G2 PASS: original U=b9d0d7c5-0c34-4177-b52e-7353b4da9da0 disappeared on both PCs. Both reads contain identical schema-1 tombstones (deletedAt 2026-09-30T14:23:22.949Z) and retained metadata with keep/probe/reviewed-on-b and unchanged updatedAt 13:29:40.438Z. Both diagnostics classify U as deleted, raw meta valid, locally preserved true. Separate retained its identity/tag.
- Tombstone-added events: B 14:23:22.950Z, A 14:23:24.112Z; timestamp difference 1.162 s. Cross-device clock alignment is unverified, so this is approximate, not calibrated transport latency. Storage events alone do not identify origin or remote acknowledgement.
- G3 PASS: after confirming deletion/tombstones on both, B recreated BB Worker Renamed Again 20260930 at https://example.com/bb-mutation-20260930-edited under BB Sync 20260930 / Moved Renamed. User explicitly confirmed the intermediate untagged/no-stableId state on both and continued tombstoning of U.
- Explicit recreated-only tagging allocated W=6822fc12-ad7b-40e3-8c68-f172ab1a2b9a on both, distinct from U and Separate V=6bd273cd-cb24-4bd1-9288-aa0136fca8a6. User confirmed no old-tag inheritance and Separate retaining separate-only. Final reconciliation maps W to B83/A66 and V to B82/A65; U remains deleted with no candidates. Both reports have empty orphanHistories and pendingDeletions. Recreation arrival timing was not supplied.

The planned E1–E4, F1–F8 and G1–G3 session is complete within recorded scope. Fresh duplicate ambiguity, changes before first mapping, metadata-first delivery and the earlier metadata-loss cause remain open. Known missing test cases remain untouched.

## Stage 1 hardening — completed manual journal/event/preflight checks

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
| Journal durability and content-free events | PASS — E1–E3 baselines, latest/empty intent, isolation, persistence and content-free update events (2026-09-30) |
| Exact A/B installed build versions | NOT RECORDED — matching development IDs previously confirmed; do not infer installed revisions from checkout HEAD |
| Missing identity rejected before mutation; no automatic recreation | MANUALLY VALIDATED IN EDGE — PASS (2026-09-30): both nonempty/empty-tag saves rejected; user confirms native title/URL/folder unchanged after both and reload. Missing records were not recreated, including two locally preserved test cases |
| Fresh B → A creation with tags, A → B edit, then B → A edit | MANUALLY VALIDATED IN EDGE — PASS, all converged on the same identity; recorded 2026-09-28 |
| Existing behavior regression after hardening | A–C passed including C.6–C.10; D accepted prior baseline without a fresh full rerun; planned F/G mutation checks passed |

## SINGLE-DEVICE UI TESTING — new features (A–C PASSED; D baseline evidence carried forward)

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
3. Inspect its URL in native Edge Favorites. It is `javascript:` with the supplied code. Record any browser canonicalization. The dashboard must never execute the code when viewing the bookmarklet. Its title is non-clickable and it says to run it through Edge Favorites; this interaction was explicitly accepted during manual testing. Merely opening/viewing the existing bookmarklet must not prompt.
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
| Prerequisite: current loaded extension uses latest repository build | MANUALLY COMPLETED — PASS, user confirmation 2026-09-29; exact installed version/revision and Edge version not supplied |
| A: targeted search | MANUALLY VALIDATED IN EDGE — PASS (2026-09-29); all query checks and clearing passed, native-order coverage reused from baseline |
| B: HTTP system label and metadata absence | MANUALLY VALIDATED IN EDGE — PASS (2026-09-29), all checks reported passed; Favorites-count typo corrected to 36 before creation and 37 afterwards |
| C: bookmarklet warning/cancel/save, code fidelity, JS/copy behavior | MANUALLY VALIDATED IN EDGE — PASS (2026-09-29); non-clickable title with Edge Favorites instruction accepted; unsupported-scheme check used mailto |
| D: post-change regression | PRIOR BASELINE EVIDENCE CARRIED FORWARD — validated checks not repeated per user request; A–C provide overlapping current-build evidence, not a fresh complete D run |

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
| Rename Favorite on A using Edge Favorites UI | A's known local mapping survives; locator history published. B eventually sees native title and same tags/UUID. No new metadata identity. | MANUALLY VALIDATED IN EDGE — PASS (2026-09-30), executed B to A as F2–F5 with disposable probe; matching history, unchanged metadata/journals and full UI/identity/no-duplicate assertions confirmed; delays unrecorded |
| Create child folder `Moved` on A, then move Favorite there with Edge UI | Real move, old/new path history retained. B converges with same UUID/tags. Root remains the parent test folder. | MANUALLY VALIDATED IN EDGE — PASS (2026-09-30), executed B to A as F2–F5 with disposable probe; matching history, unchanged metadata/journals and full UI/identity/no-duplicate assertions confirmed; delays unrecorded |
| Rename `Moved` folder in Edge UI | Descendant full path changes; known mapping publishes locator; B keeps correct association. | MANUALLY VALIDATED IN EDGE — PASS (2026-09-30), executed B to A as F2–F5 with disposable probe; matching history, unchanged metadata/journals and full UI/identity/no-duplicate assertions confirmed; delays unrecorded |
| Edit URL through A dashboard to `https://learn.microsoft.com/en-us/azure/?bb-spike=20260924-edited` | Real URL updates; old/new locators retained; same UUID, B eventually converges. | MANUALLY VALIDATED IN EDGE — PASS (2026-09-30), executed B to A as F2–F5 with disposable probe; matching history, unchanged metadata/journals and full UI/identity/no-duplicate assertions confirmed; delays unrecorded |
| Add tag `reviewed-on-b` through B | A receives tag without locator rollback, second identity or second Favorite. | MANUALLY VALIDATED IN EDGE — PASS as F6, physical A to B (2026-09-30); same UUID/history, A first journal entry and unchanged B journal; see F6 evidence |
| Close all dashboard tabs, rename link in native A Edge UI, reopen | Worker observes event (or startup compares surviving mapping); dashboard reloads correct title/tags. Repeat with worker inspection closed so it can suspend normally. | MANUALLY VALIDATED IN EDGE — PASS F7 on physical B, received A: prior worker inactivity observed, source bookmark/locator events before dashboard reopening; see 2026-09-30 evidence |
| Delete Favorite using native Edge UI on A | No Favorite on either device after Favorites sync. A observes deletion of mapped ID and publishes tombstone. Tags cannot attach to other links; metadata retained as `deleted`, no auto-pruning. | MANUALLY VALIDATED IN EDGE — PASS G2, physical B to A (2026-09-30); both absent, matching tombstones, retained metadata classified deleted, Separate unaffected |
| Recreate same URL/title/path through native Edge UI AFTER both devices received deletion | New Favorite starts untagged. Old metadata remains tombstoned. First explicit new tags create a NEW UUID. If any old tags attach, fail and preserve evidence. | MANUALLY VALIDATED IN EDGE — PASS G3, physical B to A (2026-09-30); untagged/no-ID intermediate state on both, new UUID 6822fc12-ad7b-40e3-8c68-f172ab1a2b9a with recreated-only; original tombstoned, Separate isolated |
| Save same URL/title in another category through Edge UI | Different full path distinguishes it; it starts untagged. Adding separate tags there creates separate metadata; no tags jump between categories. | MANUALLY VALIDATED IN EDGE — PASS G1 B to A (2026-09-30); Separate first untagged then UUID 6bd273cd-cb24-4bd1-9288-aa0136fca8a6 with separate-only; original identity/tags unchanged, no crossover |
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

The original environment template below is not a list of failed or pending acceptance tests. Missing environment details were not supplied; dated evidence above is authoritative for completed observations.

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
| New bookmarklet/system-label/targeted-search UI and post-change regression | A–C MANUALLY PASSED (2026-09-29); D prior baseline evidence carried forward without a fresh complete post-change rerun |
| New Tab prompt/override handling and worker suspension/wakeup | PARTIAL — F7 worker inactivity/wakeup manually passed (2026-09-30); New Tab prompt/override handling remains unverified |
| Initial A → B tag transport/association | MANUALLY VALIDATED IN EDGE — user confirmed before the 2026-09-28 incident; full environment worksheet not supplied |
| B → A new Favorite metadata transport | MANUALLY VALIDATED IN EDGE — PASS on fresh retest recorded 2026-09-28; earlier failed observation retained above |
| Sequential A → B and B → A tag edits on the same identity | MANUALLY VALIDATED IN EDGE — PASS, both edits converged correctly after fresh B → A creation |
| Mutation matrix | PARTIAL — planned F1–F8/G1–G3 passed (2026-09-30); fresh duplicate ambiguity and pre-mapping mutations deferred |
| Real metadata-first delivery observation | NOT RUN |
| Full architecture validation on two Windows devices | **PARTIAL — sequential sync and planned E–G checks passed within recorded scope; deferred ambiguity/delivery cases, environment details and earlier loss cause remain open** |

## Production difference

For Edge Add-ons distribution, the store provides installation/update and store identity. Do not assume it matches this development namespace. Establish the production ID and retest synchronization before designing an explicit metadata migration. Do not upload private signing material or use store publication merely to mask a failed unpacked experiment.

Official references and uncertainty classification: [technical spike](technical-spike.md). Sideloading follows [Microsoft's instructions](https://learn.microsoft.com/en-us/microsoft-edge/extensions/getting-started/extension-sideloading); sync setup follows [Microsoft's sync settings guidance](https://support.microsoft.com/en-us/edge/change-and-customize-sync-settings-in-microsoft-edge).

Historical local dependency audit after upgrading Vitest/ESLint: 0 reported vulnerabilities (2026-09-24; not a fresh audit). Build checks are not browser execution evidence. Manual baseline results came from the user; this development iteration uses no live Edge automation.


## 0.1.17 folder metadata and clean setup — pending native evidence

Folder metadata/inheritance/archive behavior is new and is not covered by the completed Favorite-only baseline above. The user authorized discarding test extension metadata through a deliberate bounded reset, not native Favorites changes. All devices must upgrade together; old clients remain disabled. Before resetting, export each device's private metadata/journal and inspect affected keys. See [metadata setup and the separate native two-device checklist](metadata-setup.md). Reset generation handling, unbound folder confirmation, copies/ambiguity, inheritance and device-local Show archived have isolated service/Chromium evidence only. No Microsoft sync or real-profile reset was performed during 0.1.17 implementation.
