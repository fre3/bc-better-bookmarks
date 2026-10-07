# Indexfold metadata recovery and device setup

Current entry points (0.1.26): ordinary binding review is in **Manage → Bookmarks**, including archived and excluded records. Destructive metadata reset is in **Manage → Diagnostics → Advanced: reset extension metadata**. It is optional recovery, never routine startup/setup. Export and inventory confirmation remain required. Existing native bookmarks and unrelated preferences must stay unchanged. No reset is required for the Indexfold rebrand.

The original test-data/schema-transition authorization and coordinated procedure below remain historical context and safety requirements, not an instruction to reset working metadata.

## Recovery semantics (introduced in 0.1.17)

This is an explicit destructive recovery operation, never an automatic migration. During the 0.1.17 transition the user authorized discarding test metadata. That historical permission does not make current tags disposable or authorize an unattended reset. **Edge Favorites and folders remain authoritative and unchanged.** No reset is performed by startup, installation, build or tests against a live profile.

## What is discarded and preserved

Manage → **Folder identity review and test metadata setup** exports a private JSON backup and shows the exact synchronized key inventory before enabling reset. Verify the downloaded file before proceeding. The backup includes raw owned metadata and this device's mappings/journal; it can contain private titles, URLs and tags. Keep it outside Git and do not share it publicly. Export on every device: local journals may contain different unsynchronized intent.

| Storage | Reset effect |
| --- | --- |
| sync `meta:<UUID>` | Delete direct test tags and identities, both legacy and current records |
| sync `loc:<UUID>` | Delete locator history |
| sync `dead:<UUID>` | Delete identity tombstones |
| sync `setup:epoch` | Replace with a fresh UUID generation, first `resetting`, then `ready` |
| local `state.mappings`, `state.pendingDeletions` | Empty when adopting the new generation |
| local `state.metadataEpoch` | Set to the new generation |
| local `metadataJournal` | Remove old preservation entries |
| local `state.rootId` | Retain legacy envelope field; ignored since 0.1.19 |
| appearance, Show archived, peek preference, other unrelated keys/logs | Preserve |
| native Edge Favorites tree | No API calls; no rename, URL change, move, reorder, recreation or deletion |

This is not a full extension-storage clear. Export is for controlled recovery; there is no automatic/one-click import. Do not restore an old local state or raw backup over a new generation. If recovery is needed, retain all backups and review the records before designing a restore; blindly restoring old mappings can bind the wrong objects.

## Coordinated setup on every device

1. Stop editing and close/copy unsaved drafts. Identify **every** profile/device sharing this extension ID, including temporarily offline devices. Keep old clients disabled until upgraded. A client predating 0.1.17 cannot participate safely.
2. With writes paused, upgrade each device to the same current committed release `dist/` (0.1.17 introduced the folder schema). Enable only as needed to export via Manage, verify each private backup and its inventory, then disable again. Do not reset yet. Upgrading alone does not wipe tags.
3. Keep all other clients disabled. On one designated device, open Manage, export a fresh backup, verify it, confirm the backups/old-client checkbox, and choose **Reset extension bookmark metadata only**. If synchronized metadata changed after export, reset refuses; export/review again. Native Favorites are not touched.
4. Check that reset completed and `setup:epoch` is `ready`. If interrupted, writes remain blocked while it is `resetting`; the setup panel remains available even when the snapshot cannot load. Export the remaining state and deliberately retry the reset after checking the other devices. Do not bypass it by clearing storage.
5. Enable each **upgraded** device in turn with no tag edits until it sees the same ready generation. Its stale mappings, pending deletion state and journal are invalidated automatically when that marker is adopted. Do not copy `storage.local` from another device. Settings stay local and unchanged.
6. Verify on every device that old metadata is absent or reported as **old-generation keys ignored**. Delayed old keys cannot reattach tags in updated clients: every new record/history/tombstone carries the current generation. An unknown/outdated client can still write old data or have cached state; it must remain disabled. Microsoft sync has no cross-device transaction/acknowledgement, so check convergence before starting fresh tags.
7. Start new tagging on one device first, wait for delivery, then perform the folder-binding review on the second device before editing those tags there. Do not independently first-tag the same folder on both devices.

No real-profile reset was executed during implementation. Tests use isolated mock stores and Chromium fixtures.

## Folder identity and second-device review

UUIDs are generated only by explicit first nonempty direct-tag saves. Merely browsing, reconciling, inheriting tags or displaying an empty folder does not create metadata. Synchronized keys never use browser-local IDs. Folder locators include a folder kind, original title and structured ancestor path; these are **candidate hints, not identity proof**.

On a device with an established binding, the local ID/date-added evidence retains identity through supported native rename/move operations, including subtree moves. Locator history is published through the existing bounded path. On an unbound device, even a single exact folder candidate stays unresolved. Manage lists candidates together; select only originals you can positively identify and use **Confirm selected original folders**. The service rechecks each binding. Successful earlier confirmations survive a later failure; review the refreshed list before retrying.

Duplicate names/paths, competing UUIDs and missing candidates cannot be confirmed by guessing. Ambiguous rows are disabled; no arbitrary picker overrides that guard. Resolve the real situation outside this increment or leave metadata unresolved. Administrative identity review always includes archived records, independently of Show archived. Ordinary content listings remain filtered. Dashboard “Folder tags need review — Review”, affected folder Edit, and Manage share the same explicit review workflow. Unresolved folder metadata is distinct from an untagged folder: it is reported in the review/diagnostics and blocks candidate tag assignment. Until binding is confirmed, its inheritance/archive rules cannot safely be applied to any guessed subtree.

An unbound copy whose locator also matches a bound record cannot receive new tags yet. Give the copy a distinct name/location through Edge Favorites first; this conservative restriction avoids creating competing identities, and the modal explains it. Empty folders work like populated folders. Copies do not automatically receive the original UUID. An already bound original retains its binding when a copy appears; on a fresh device both matching copies stay ambiguous. A uniquely matching copy after an unobserved deletion still cannot be proved original, so it needs review and must not be confirmed as the original. Observed deletions tombstone known identities; recreation gets no inherited direct metadata. Browser ID/date evidence is local, not a guaranteed cross-device identifier. Changes before first binding, indistinguishable copies and history-limit cases can remain unresolved; synchronization is not claimed seamless.

## Native two-device review (pending)

Use disposable test folders; do not repeat destructive scenarios on valuable Favorites.

1. Follow the coordinated export/reset procedure above if starting fresh. Compare native titles, URLs, order and hierarchy before/after on A and B; verify all unrelated local preferences remain. Verify both ready generations and no old-tag resurrection after reload/offline-device return.
2. On A, tag an empty folder and a nested folder. On B, observe unresolved candidates with no guessed tags; confirm originals together. Verify same UUIDs, direct tags and inherited sources after confirmation.
3. Edit folder tags A → B, then B → A sequentially. Verify a Favorite with no direct tags matches inherited plain and `#tag` search. Overlap direct/ancestor tags and remove one source; remaining sources still apply without descendant metadata writes.
4. Rename/move a bound folder/subtree through Edge Favorites. Verify each device's existing bindings survive and descendant inherited tags/sources recompute. Test a duplicate/copy separately: it must not acquire the source UUID automatically. Verify ambiguous fresh-device candidates remain blocked; observed deletion/recreation never recreates the old identity.
5. Archive an ancestor and independently archive a descendant. A: Show archived off. B: on. Visibility differs locally, while synchronized direct tags agree. Unarchive the ancestor; the independently archived descendant remains excluded on A. `#archived` never bypasses the setting.
6. Open a draft on A and modify/move/delete its item on B. Check retained input and conflict handling, no silent overwrite/recreation. Simultaneous writes are not conflict-free transactions; do not interpret sequential success as that guarantee.

Record native results separately from automated storage/Chromium evidence.
