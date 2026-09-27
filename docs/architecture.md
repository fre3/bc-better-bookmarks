# Architecture

## Ownership and components

```
React New Tab → typed runtime commands → single MV3 worker queue
                                            ↓
                                  DashboardService
                               ↙                  ↘
           BrowserBookmarksRepository        MetadataRepository
                  ↓                          ↙              ↘
          Edge bookmarks API          storage.sync      storage.local
                                            ↑
                              BookmarkMetadataReconciler
                              (pure reconcile function)
```

- `src/browser/bookmarks.ts`: mockable Favorites CRUD, and allowlisted projection of browser nodes. Never invokes `removeTree`; checks that the one node being deleted is a link.
- `src/browser/metadata.ts`: mockable storage, compare-before-write, quota preflight, invalid-record overwrite protection, local settings and logs.
- `src/core/reconcile.ts`: `reconcile` is the BookmarkMetadataReconciler. Pure global candidate analysis with explicit proposed locator writes; no API calls.
- `src/core/logic.ts`: tree flattening, exact structured fingerprints, tag normalization, and `searchFavorites` (the small SearchService function). No search library or unnecessary class layer.
- `src/core/service.ts`: application operations, root guards, stale-edit checks, snapshots, recording locator observations and deletion intentions.
- `src/background.ts`: synchronous event registration and one mutation queue per profile. Multiple dashboard tabs do not independently write metadata. All state needed after worker suspension is persisted.
- `src/browser/client.ts`: message transport and dashboard refresh subscription. React never directly uses bookmarks/storage APIs.
- `src/core/export.ts`: allowlisted diagnostic export with URL credential redaction. Browser `dateLastUsed` is never read into application models.

React's view model includes full display paths and local ancestry IDs. Grouping uses actual folder IDs to distinguish equally named folders. The full ordered browser tree remains the source. No snapshot of bookmarks is persisted as an alternative database. Root selection restricts UI mutations, while reconciliation and diagnostics intentionally inspect the complete tree so a move outside the dashboard can still preserve identity.

## Storage schema v1

Sync keys (no key contains a browser-local bookmark ID):

```ts
// meta:<UUID>: created only on explicit first nonempty tag assignment
{
  schemaVersion: 1,
  stableId: UUID,
  tags: string[],
  initialLocator: { url, title, folderPath: [{ kind: 'title' | 'browser', value }] },
  updatedAt: ISODate
}
// loc:<same UUID>: written only when a known local Favorite changes locator
{ schemaVersion: 1, stableId: UUID, locators: Locator[] }
// dead:<same UUID>: immutable evidence of observed deletion of a mapped Favorite
{ schemaVersion: 1, stableId: UUID, deletedAt: ISODate }
```

The initial locator is immutable in the tag record. The optional locator history holds a deduplicated deterministic set (maximum 12, including the initial locator when history is first written). Tags and histories use separate keys so rename traffic cannot overwrite tag edits. History is not a global authoritative title/folder: those fields still come only from Favorites. History stores observations for identity, never commands to rewrite bookmarks. Root types use `folderType` when exposed; ordinary folder components preserve exact titles. Fallback to a literal browser folder title may fail across different languages/versions, deliberately unresolved rather than guessed.

Local `state`:

```ts
{
  schemaVersion: 1,
  rootId: null | '*' | browserFolderId,
  mappings: { [browserBookmarkId]: {
    stableId, lastLocator, dateAdded?, method: 'explicit' | 'exact-locator'
  } },
  pendingDeletions: UUID[]
}
```

`null` means setup/read-only; `*` explicitly enables edits across writable Favorites. Mappings retain last-observed creation timestamps to reject obvious ID reuse. These timestamps are local safeguards, not cross-device matching requirements. Missing mappings are retained as evidence, not used to manufacture deletions. Bounded recent logs live under a separate local key; normal reloads may write diagnostics locally, but never churn sync data.

Only recognized schema-v1 shapes participate in matching. Invalid/future records are quarantined and raw storage is preserved. A bad record for a UUID blocks that UUID, including an unknown tombstone. Explicit tag writes stop when unknown sync data exists. No automatic migration, import, compaction, cleanup, or record deletion. Unknown raw values are omitted from export.

## Matching and event ordering

1. Read the full Favorites tree, synchronized records and local state. These reads are not a cross-service atomic transaction; repeat on subsequent events.
2. Ignore tombstoned/pending-deletion identities for attachment.
3. Validate a previously known local mapping (including creation timestamp). It can survive title, URL, folder, or hierarchy changes.
4. For unmapped identities, compare complete structured locators against the initial and historical locators. Require exactly one candidate across the entire tree, with no competing metadata identity. Never resolve by URL alone, order, first match, or nearest similarity.
5. Competing records or identical Favorites on an unmapped device remain ambiguous. A locally explicit duplicate mapping can remain known on its originating device, but cannot be exported as an assumption about B.
6. A known local locator change proposes a union of the old/new/history locators. Write only differences, then advance local `lastLocator`. Failed publication retains the previous value so a later event/manual reconciliation retries. Overflow leaves a warning and does not truncate.
7. Save new confident mappings locally. Retain unresolved records and prior evidence. Render tags only through confident current mappings.

Favorite-first: there is nothing to match until metadata arrives; no identity is automatically created. Metadata-first: keep unresolved until the Favorite arrives. History-first without its tag record: retain an orphan history; match once the record arrives. If old and new bookmarks coexist during sync, history can produce multiple candidates; leave ambiguity until the data becomes unambiguous. Exact matching cannot distinguish an unobserved deletion/recreation from the original; do not overstate this guarantee.

Reconciliation is idempotent in mappings and writes. A first exact match changes to `local-mapping` status on later passes, with original matching `method` retained for diagnostics. Neither status causes a sync write. A storage update alone cannot publish stale local locators: `lastLocator` must differ from the actual local Favorite. Reconciliation never mutates Favorites, which prevents bookmark↔metadata feedback loops.

Synchronous worker listeners cover `onCreated`, `onChanged`, `onMoved`, `onRemoved`, `onChildrenReordered`, import begin/end, browser startup, extension installation/update, and sync `onChanged`. Opening the New Tab requests a fresh reconciliation. Removal callbacks collect descendants when Edge reports removal of a folder, tombstoning only known metadata identities; the extension itself never deletes a folder. Worker reload/startup catches missed locator changes for surviving mappings, but cannot prove missing-node deletion.

## Consistency and failure limits

- No API reports remote acknowledgement, source device of a storage event, or an atomic Favorites+metadata transaction. Diagnostics always say transport is unknown.
- Automatic reconciliation never allocates UUIDs. Tagging A then waiting for B avoids two independent identities. Simultaneous first tagging can create conflicting UUIDs; stop and inspect instead of automatically merging.
- Same-key concurrent tag writes rely on browser conflict resolution. `updatedAt` is diagnostic only; clocks do not choose a winner. A history union can lose a concurrent update because storage has no compare-and-swap. Sequential tests are supported; conflict-free collaboration is out of scope.
- One local queue prevents local-tab races; an edit token rejects a form stale relative to the latest snapshot. Remote changes racing between checking and writing still cannot be made transactional.
- Title/URL update, move, and metadata save are separate operations. A failure reports possible partial success. A successful Favorite creation followed by tag failure explicitly tells the user to edit the created Favorite, never automatically retries creation, and never rolls it back by deleting it.
- Deletion intentions are saved locally before publishing tombstones. Sync quota failure keeps pending evidence and suppresses attachment locally until retry. Mere disappearance during a snapshot does not create a tombstone.
- Browser/profile reset, uninstall, extension disabled during deletion, copied local state, or recreated objects with indistinguishable exposed fields can invalidate evidence. Do not copy `storage.local` between profiles. Keep test data isolated; exact identity is not mathematically provable with these APIs.
- Quota preflight uses conservative UTF-8 key+JSON sizes; the browser enforces real byte and write-rate limits. One batch per reconciliation, only changed keys, no automatic retry storm. Retry using Force reconciliation after addressing quota/rate errors. No fallback to unsynchronized local tags.
- Tombstones/history intentionally consume quota until an explicit future cleanup design. Expect substantially fewer than 512 tagged records when histories/bytes grow. Diagnostics show runtime limits and bytes, not a promised capacity.

## Security and diagnostics

Only `bookmarks` and `storage` permissions; no host permissions, content scripts, telemetry, external scripts, favicons or fetches. Bundled MV3 CSP. Existing executable/non-HTTP links are shown as text with directions to use Edge Favorites; new/edited links must be HTTP(S) and contain no credentials. React escapes text.

Export includes the selected dashboard subtree plus full-tree diagnostic projections, supported synchronized records, mappings, reconciliation, schema and recent logs. It omits browsing-history fields, arbitrary unknown raw data and raw error text. Credential URL components/common secret query and fragment names are redacted. Favorites themselves may contain private text/URLs; inspect exports before sharing. JSON is not a restorable Favorites backup.

## Validation boundaries

Unit tests cover normalization/search, tree behavior, exact fingerprints, identity changes/history, ambiguity and competing identities, out-of-order arrivals, orphan records, deletion/recreation, schema handling, quota failures, stale edits, scope restrictions, partial operations, worker service logic, sanitized exports and mockable browser wrappers. Simulated A/B services use different IDs and exercise round-trip tags. Build checks verify the MV3 package and expected identity.

There is no Windows Edge instance or signed-in Microsoft profile in the development environment. Loading, New Tab prompts, service-worker suspension/wakeup and actual Microsoft replication require the manual [cross-device procedure](cross-device-test.md). No backend has been introduced.
