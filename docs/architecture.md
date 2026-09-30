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

`Favorite.systemLabels` is derived by `flattenTree` from the URL scheme: `javascript:` → `JS`, `http:` → `HTTP`, HTTPS → none. User tags remain in the existing metadata `tags` array. Labels never enter that array, allocate UUIDs or cause storage writes. The persisted schema and reconciliation algorithm are unchanged. A URL edit of an already mapped Favorite can still publish locator history under the existing rules; that write is for identity, never for a label.

Pure `parseSearch`/`searchFavorites` logic splits whitespace-separated tokens, recognizes `#` (user tags) or `@` (folder path) only at token starts, and ANDs case-insensitive substring matches. Ordinary tokens search title, URL, path, user tags and system labels. Empty operators are ignored. No quoted values, label-specific syntax or autocomplete are implemented.

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

### Stage 1 local metadata preservation (2026-09-28)

An additive `storage.local` key, `metadataJournal`, stores `{ schemaVersion: 1, entries: { [stableId]: { metadata, locallyWrittenAt } } }`. Each entry is the latest valid metadata value authored or intended for publication on this device, including the original `initialLocator`; it is not a Favorite tree copy. `BrowserMetadataRepository.write` validates the outgoing metadata and saves this journal **before** calling `storage.sync.set`. The service's explicit local mapping is included in that local write, so a failed first publication cannot cause a retry to allocate a replacement UUID. Failed journal writes/capacity checks block sync publication. A failed subsequent sync write leaves the intended metadata and identity evidence preserved; editing then reports missing metadata without replaying it. Local preservation is not proof of successful publication or remote receipt.

The journal is limited to 512 identities and 1 MiB (UTF-8 serialized key + value). It never automatically evicts any identity, mapped or otherwise. At capacity, metadata writes that exceed the limit fail explicitly; existing entries remain intact. Updating an existing entry is allowed within the limits. There is no automatic cleanup. Invalid/future journal schemas remain untouched and block metadata publication. Actual storage.local quota failures also block publication. The existing local `state` schema and all sync schemas remain v1 and unchanged; an absent journal is treated as empty and created on the next changed metadata publication. No startup backfill or migration is performed.

Only locally authored `meta:` changes enter the journal. Remote observations, `loc:` writes, tombstones and read-only snapshots do not populate it. Later local edits replace that UUID's preserved intent; this is not a version history and must not be treated as the latest globally accepted value. Deletions do not erase preserved entries or grant permission to revive them. Uninstalling/clearing extension local storage loses this local preservation. The journal has no reader that republishes its contents: automatic recovery/replay is deferred to Stage 2.

Snapshots expose only journal availability/UUIDs plus `metadataHealth` per identity: `valid`, `missing`, `quarantined`, `deleted`, or `ambiguous`; a separate `rawMeta` field says `absent`, `valid`, or `invalid`. This distinguishes a valid raw meta record blocked by invalid history from an absent meta key. `preservedLocally` indicates a candidate for future review, never proof that recovery is safe. Journal contents are not added to diagnostic exports. Existing reconciliation matching and identity allocation rules are unchanged.

The edit flow runs the same identity/schema/deletion checks before browser update/move and again before the actual tag write. Known identity + missing metadata rejects even when the editor submits an empty tag list. An unreadable journal also blocks edits that require tag publication before browser mutation. Errors do not promise that waiting will repair the condition. Actual storage failures, quota limits discovered at publication, and remote changes after preflight can still cause partial edits; this is not a cross-service transaction.

### Sync event evidence

The worker now consumes `storage.onChanged` payloads at receipt time, before joining the existing queue. For recognized `meta:<UUID>`, `loc:<UUID>` and `dead:<UUID>` keys, it records receipt timestamp, key/type/UUID, added/updated/removed operation, old/new presence and individual-value validity. Absent old/new values are explicit; an event with neither is marked unchanged. Unknown/malformed keys are redacted because key text itself may contain private data. Titles, URLs, tags, paths and values are not included in these event summaries.

Summaries use the existing local 60-entry log ring; large events retain at most the last 60 changed-key summaries and subsequent activity can roll older entries out. Capture diagnostics promptly. Event logging itself writes only local logs; the normal queued reconciliation still runs and may publish legitimate locator/deletion work. Diagnostic persistence failure is reported without deliberately skipping reconciliation. Event origin is unknown, and neither an event nor successful `storage.sync.set()` is a remote acknowledgement. Stage 1 observes a missing key but does not recreate it.

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

Only `bookmarks` and `storage` permissions; no host/scripting permissions, content scripts, telemetry, external scripts, favicons or fetches. Bundled MV3 CSP. Dashboard anchors remain restricted to credential-free HTTP(S). New/edited URLs accept HTTP(S) without credentials or confirmed `javascript:` bookmarklets; other schemes are rejected. `confirmLinkInput` calls the UI confirmation before a bookmarklet save, and the service requires the transient `bookmarkletConfirmed === true` command flag before mutation. This flag is never persisted. Every bookmarklet save prompts, including title/tag-only edits; viewing does not. Cancel sends no save command. Bookmarklet content is opaque: only its scheme is inspected and the original string is passed to the browser repository without URL parsing/normalization or JavaScript evaluation. A textarea avoids the single-line URL input's newline stripping. Edge may canonicalize stored URLs; exact browser behavior needs manual verification. React escapes the displayed code, and the UI directs users to Edge Favorites for execution.

Export includes the selected dashboard subtree plus full-tree diagnostic projections, supported synchronized records, mappings, reconciliation, schema and recent logs. It omits browsing-history fields, arbitrary unknown raw data and raw error text. Credential URL components/common secret query and fragment names are redacted. Favorites themselves may contain private text/URLs; inspect exports before sharing. JSON is not a restorable Favorites backup.

Bookmarklet URLs are preserved verbatim in diagnostics rather than interpreting or rewriting JavaScript as URL parameters. Their code may contain private data and is not automatically redacted; review before sharing.

## Validation boundaries

Unit tests cover normalization/search, tree behavior, exact fingerprints, identity changes/history, ambiguity and competing identities, out-of-order arrivals, orphan records, deletion/recreation, schema handling, quota failures, stale edits, scope restrictions, partial operations, worker service logic, sanitized exports and mockable browser wrappers. Simulated A/B services use different IDs and exercise round-trip tags. Build checks verify the MV3 package and expected identity.

The user reports successful real Edge baseline loading, Favorites CRUD/hierarchy/order, user tags/search, live native rename/move updates, mapped tag retention and copies without inherited tags; two independent builds have the same development ID. On 2026-09-28 the user also reported successful fresh B → A creation with tags, followed by A → B and B → A tag edits on the same identity, all converging correctly. This manually validates sequential two-way metadata transport and identity preservation. These observations are distinct from automated mocked checks. On 2026-09-29 the user manually passed suites A–C for bookmarklet/label/search UI behavior; D carries earlier baseline evidence without a fresh full rerun. The earlier metadata-loss cause, Stage 1 journal/event/preflight-specific checks, worker suspension/wakeup and remaining cross-device mutation matrix remain open in the [validation procedure](cross-device-test.md). The [next manual session](next-manual-session.md) provides prepared, not yet executed, cases. No live-browser automation was used for this iteration and no backend has been introduced.
