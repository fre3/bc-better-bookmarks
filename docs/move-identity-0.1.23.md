# 0.1.23 move identity investigation

## Closure — 2026-10-08

The user accepts Indexfold 0.1.27 in native Edge and reports no recurrence of the historical title-change behavior across several subsequent releases. The **title-change investigation is closed**, removed from active issues and review checklists. The original cause remains **unconfirmed**; closure does not establish a title-overwrite fix. The independently reproduced duplicate-bookmark binding defect and its 0.1.23 fix remain distinct.

The evidence, diagnostic procedure and original review checklist below are retained as a **historical record**, not current testing or diagnostic requests. No live bookmark repair or data mutation accompanies closure.

## Evidence and limits

All supplied images were visually inspected: `0.1.22_duplicate_1.png` through `0.1.22_duplicate_4.png`, and `0.1.22_moving-design-section.png`. The fourth image establishes two separate native Edge favorites with the same displayed title in Workspaces / BB Sync 20260930 / Separate. It does not establish their URLs, previous titles/parents, or which write produced that condition. The editor image has no native ID, so it cannot conclusively identify which duplicate was opened.

`Pasted markdown.md` was not found by filename variations or the supplied timestamp/identity contents in accessible project and temporary files. Accordingly, the following is **user-reported diagnostic evidence**, not an independently inspected attachment: at 2026-10-07T12:05:09.669Z identity `6822fc12…` was local-mapping(66), becoming ambiguous at .678Z after move; Favorite count stayed 41; earlier moves retained the binding. The separately deleted `b9d0d7c5…` identity predates this transition and is not the moved/recreated identity. The historical 0.1.22 native title overwrite report remains unproven, not dismissed as cosmetic.

## Confirmed code defect and reproduction

A new isolated regression fails against the 0.1.22 reconciler: A and B are separate tagged identities, each with a retained local mapping, initially in different folders. Their titles and URLs are identical. Moving A into B's parent makes A's current locator equal B's locator. The original competitor test considered both B's locator candidates and B's known local node. It incorrectly let B's locator claim A even though B already had a distinct validated native binding. A became ambiguous while B initially stayed local-mapping: the reported transition is reproduced without a title/URL update.

The fix evaluates a competitor's unique surviving local binding before its weaker locator candidates. Node kind, retained native ID and stored creation timestamp checks still apply. A uniquely bound record competes only for its actual local node. Records without a unique local binding still use the full conservative candidate analysis. New devices with indistinguishable duplicates remain ambiguous; genuinely competing UUIDs, multiply-bound records, tombstones and reused native IDs remain blocked. No first-match/order/path guess, UUID allocation, tag copy, merge or deletion is introduced.

The service retains old local mappings even when current reconciliation is ambiguous. Thus a valid retained association can be recognized again after update; this is use of existing evidence, not a guessed repair. If the evidence is absent, contradictory or fails timestamp/type checks, it cannot be repaired automatically by this change.

A related UI/worker diagnostic defect used *any* ambiguous record's candidate list to warn/block a bookmark, even if that bookmark retained a confident current association to a different identity. The shared item-health preflight now respects the authoritative current mapping. A historical candidate is not itself an assignment. Catalogue, editor and worker consume the same per-native-ID result.

## Native writes, rendering and event sequence

The pointer gesture captures source native ID and source token at threshold; rendered items use native IDs as React keys. Destination intent uses node IDs/full native sibling order, not visible indices. Editor selection uses the clicked native ID. Movement reaches the typed `move` command, then the existing single worker queue. The only native operation in that branch is `bookmarks.move(id, {parentId,index})`. Reconciliation writes local bindings/locator history; it does not call native update.

The focused Chromium regression captures before/after native ID/title/URL/parent/index, submitted move source/destination IDs, actual repository calls, metadata records, retained/current associations, candidate sets/reasons, direct/effective tags and inherited sources. Repeated actual pointer moves/reorders, rerenders during dragging and reconciliation after native/sync-style events preserve native title/URL/IDs and direct records. Inheritance changes only with destination. Same-title/different-URL nodes stay separate too. These isolated results establish the code defect and fix, **not the historical native title values on the affected profile**.

Reconciliation results now include a diagnostic reason, not a persisted schema field. No sync schema, transport, permission or metadata reset changes.

## Editor and drag behavior

- Ambiguous/missing/inconsistent metadata is an explicit status, never a user tag. Name/title, URL, tags and archive controls are read-only/disabled as appropriate; Save is disabled. The editor displays the native ID and offers read-only item diagnostics.
- A draft interrupted by a health change stays intact. Resolution does not automatically save or rebase it. An editor initially opened blocked must close/reopen after resolution to load confirmed direct tags; its initially empty unavailable tags cannot silently overwrite restored tags.
- Ordinary primary click/Enter on a Favorite title opens the editor in Edit mode; explicit Edit remains. Real href/context-menu/modifier/middle-click behavior is retained. Folder/section title activation still expands. Normal browse navigation is unchanged.
- After the deliberate threshold, a compact pointer-transparent “Moving …” preview and source-only highlight appear even without a target. Invalid/valid/no-target text is distinct; there is no copy operation. Preview cleanup follows drop, cancellation, failure and loss of interaction.
- Section Before/End targets use gutter-aligned horizontal lines; flowing favorites/subfolders retain vertical carets. Inside-folder intent stays distinct. Before text identifies the receiving parent/root. Canonical/native-order/no-op rules remain.

## Minimal live read-only evidence

Before further saves or moves of the affected items, compare both titles and URLs in Edge's Favorites manager **without editing them**. Preserve both items. To distinguish them precisely, run this in the extension service-worker console. It only reads the native tree and extension storage; it does not call reconciliation, write metadata or change Favorites. Review private URLs before sharing output; do not commit diagnostic exports.

```js
const [tree, local, sync] = await Promise.all([
  chrome.bookmarks.getTree(),
  chrome.storage.local.get('state'),
  chrome.storage.sync.get(null),
]);
const walk = (nodes, path = []) => nodes.flatMap(n => [
  { ...n, children: undefined, path },
  ...walk(n.children || [], [...path, n.title]),
]);
const nodes = walk(tree);
const mappings = local.state?.mappings || {};
const selected = nodes.filter(n => n.url !== undefined && (
  n.id === '66' ||
  n.title === 'BB Worker Renamed Again 20260930' ||
  mappings[n.id]?.stableId?.startsWith('6822fc12')
));
const ids = new Set(selected.map(n => mappings[n.id]?.stableId).filter(Boolean));
Object.keys(sync).forEach(key => {
  if (key.startsWith('meta:6822fc12')) ids.add(key.slice(5));
});
console.log(JSON.stringify({
  capturedAt: new Date().toISOString(),
  favorites: selected.map(n => ({
    id: n.id, title: n.title, url: n.url, parentId: n.parentId,
    index: n.index, dateAdded: n.dateAdded, path: n.path,
    retainedMapping: mappings[n.id],
  })),
  metadata: Object.fromEntries([...ids].flatMap(id =>
    ['meta:', 'loc:', 'dead:'].map(prefix => [prefix + id, sync[prefix + id]])
  )),
}, null, 2));
```

Capture once before update if practical, then compare after reloading 0.1.23. Read current editor item diagnostics if still blocked. A present-day read cannot recover missing historical title/URL snapshots. If ambiguity persists, supply only these relevant IDs/associations and current candidate reasons, plus the missing original attachment if available. No reset, speculative rename or duplicate merge is requested.

## Targeted Edge review

1. Verify 0.1.23 and inspect the affected native IDs/read-only values first. Confirm retained mapping/tag health after reload; stop editing that item if uncertainty remains. Do not infer native repair from a disappearing warning.
2. Use disposable duplicates for actual dragging: same-title/same-URL and same-title/different-URL; move together, reorder and move apart. Confirm IDs/native titles/URLs/direct tags stay distinct; inherited tags follow the parent.
3. Click/Enter opens the intended Favorite editor in Edit mode. Native right-click/Shift+F10 link actions and deliberate modifier/middle-click navigation remain available. Drag completion/cancellation must not open an editor afterward.
4. Check immediate preview/highlight in empty/invalid space, section horizontal lines versus inline carets, receiving root, narrow widths and both themes. Exercise edge scrolling/cancel and ordinary footer peeks afterward.
5. If metadata is genuinely blocked, verify clear status, unavailable direct tags, disabled Save and intact existing draft. Do not corrupt live mappings to manufacture this case.

Native Edge acceptance is pending. 0.1.22 is **not accepted** by this handoff. Previous accepted 0.1.21 creation/move scenarios remain recorded, but do not establish duplicate-convergence safety. A targeted two-device duplicate move check is appropriate after the single-device checks: use previously confirmed disposable identities on both devices, move them together/apart on A, inspect B's native values, mappings and tags; a fresh unbound device must remain ambiguous rather than guess. No broad destructive retest is requested.
