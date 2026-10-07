# Browser-location capabilities — 0.1.26

## Evidence and limits

User review: other requested 0.1.23 checks pass; Workspace compatibility and editor highlighting remain outstanding. The duplicate-binding defect fixed in 0.1.23 is distinct from the historical native-title-change report. No cause of that historical title change has been established.

Inspected all five supplied 0.1.23 images with the image viewer: workspace-folder, bookmarks-highlighting, edit-hl-1, edit-hl-2, edit-hl-3. The first shows Edge rejecting a move with “Can't modify workspace folder”. This does not prove all cross-Workspace moves are prohibited or establish which tree nodes represent Workspace objects.

The user supplied a read-only `getTree` property inventory during implementation. Favorites bar and Other favorites expose `folderType: bookmarks-bar` and `other`. The Workspaces root and both immediate folders expose neither `folderType` nor `unmodifiable`; their property sets contain ordinary tree/date/sync fields and no Workspace identifier. The native IDs are device-local evidence, **not classification constants**. Raw personal diagnostics are not committed.

[Chromium's bookmarks contract](https://developer.chrome.com/docs/extensions/reference/api/bookmarks) documents browser-owned folder types (`bookmarks-bar`, `other`, `mobile`, `managed`) and managed-node restrictions. [Microsoft's API support list](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/api-support) lists bookmarks support. Neither establishes a public Workspace-container discriminator. [Microsoft's Workspace guide](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-workspaces) documents the product, not a bookmarks extension capability contract. These documents do not certify that modifying a native Favorites tree entry updates Workspace lifecycle state.

## Accepted application policy — supersedes 0.1.24 blanket restriction

The user reports creation/editing inside real Workspaces worked, including editing Personal while Development was active. 0.1.24's blanket native restriction was rejected as too restrictive. Whether dashboard-created direct folders were recognized by Edge as actual Workspaces remains a hypothesis. The reported silent boundary move and native Favorites UI support do not establish the extension API's behavior.

Root identification uses the strongest supplied **structural assumption**: under the virtual root, documented `bookmarks-bar` and `other` roots coexist with exactly one additional non-managed, untyped root. Other unknown types or multiple unknown roots prevent identification. This matches the supplied native inventory. It uses no root/container names, fixed IDs, ordering or active tab state. A different browser-specific root with the same structure is indistinguishable; this is not a universal Edge-provided identifier. Unmatched shapes retain conservative unclassified restrictions. No manual classification/setup is added.

Once that root is established, **every immediate folder is treated as a Workspace container by user-accepted application policy**, including an accidentally created ordinary folder. No claim of an API-provided child discriminator is made.

- Root: browse/search, no native mutation, ordinary creation or receiving moves. Create new Workspaces in Edge.
- Immediate containers: protected native name/order/parent/deletion; extension tags/archive and explicit conservative metadata binding remain available. Their contents are writable.
- Descendant favorites and nested folders: ordinary native CRUD and within-container moving/reordering, with unchanged independent managed/identity/staleness/integrity checks. No active/inactive distinction.
- Crossing into/out of/between Workspace containers: temporarily blocked by application policy because extension-API support is unverified. Use native Edge Favorites. No claim that Edge prohibits it; no copy/delete fallback or automatic retry.
- Missing/unknown browser domains and managed subtrees remain protected. Source, destination, protected descendants and anchors are checked in the shared planner and again against the worker's current tree. Metadata-only container saves never update the native name.

Browsing hides direct loose favorites and their synthetic Bookmarks group under Workspaces, including All bookmarks. Search still includes eligible loose items with full paths. Manage listings expose them with an explanation; archive filtering still applies normally. Binding review and diagnostics remain complete. No hidden entry or its metadata is mutated by this projection. Root New is absent in Workspace scope; container New remains available.

The existing durable creation receipt may complete metadata for an already-created item without another native create, even if later policy restricts its location. No schema, transport, permissions, stable identity algorithm or live data reset changes.

## Native move outcome verification

Confirmed source gap in 0.1.24: the browser adapter discarded the result of `bookmarks.move`, and the worker refreshed without verifying the resulting parent/order before reporting success. An isolated resolved-no-op fixture demonstrates that path. This is a reporting defect; it does not prove the cause of the reported live cross-Workspace failure or establish an Edge extension API prohibition.

0.1.25 retains the returned native node and reads a fresh native tree after the API attempt. The shared outcome checker compares source ID/parent/title/URL/creation stamp, complete destination order and (for cross-parent moves) source-parent order. Same-parent forward insertion accounts for source removal. API response IDs/parent/index must agree with the tree. A final reconciled snapshot is checked again before returning successful Move state. Manage's older edit-and-move path uses the same native outcome verification and preserves its partial-save reporting.

A resolved unchanged result, unexpected parent/order, conflicting response or rejected API call produces an explicit error and refreshed observed state where readable. Rejection after an observed move is not described as an ordinary success. Read failure remains unverified. No automatic retry, copy/delete fallback, recreation or metadata reassignment occurs. Concurrent external order changes can deliberately produce an uncertain-result error; the user must inspect actual state before retrying. This is not a transaction with browser sync or a guarantee against changes after the final read.

Within-container CRUD/reorder/movement passes simulated worker and real pointer/keyboard UI checks. Native Edge verification remains pending. Cross-boundary operations are blocked before the native call until separately established, including Workspace ↔ ordinary root and container ↔ container. Direct-root receiving is always prohibited by this checkpoint's policy.

## Active Workspace — deferred

The public [tabs type](https://developer.chrome.com/docs/extensions/reference/api/tabs#type-Tab) exposes tab/window/group identifiers, not a documented Workspace identity. [Window types](https://developer.chrome.com/docs/extensions/reference/api/windows#type-WindowType) distinguish browser window kinds, not Workspaces. Existing dashboard launching uses tab/window identity for routing only. The supplied bookmark diagnostics expose no active signal. All containers remain visible; no inferred active filter or new selector.

Optional read-only comparison in dashboard DevTools in each Workspace (only IDs/types/key names; no browsing URLs/titles):

```js
Promise.all([chrome.tabs.getCurrent(), chrome.windows.getCurrent()]).then(([t, w]) =>
  console.log(JSON.stringify({
    tab: t && { id: t.id, windowId: t.windowId, groupId: t.groupId, keys: Object.keys(t) },
    window: { id: w.id, type: w.type, keys: Object.keys(w) }
  }, null, 2))
);
```

Different window/group IDs alone do not prove Workspace identity. No private API, profile-file access or new permission is used. Automatic current-Workspace filtering remains deferred.

## Focused read-only follow-up

In dashboard DevTools, this inventories only root/immediate-folder fields (no URLs/tags):

```js
chrome.bookmarks.getTree().then(tree => console.log(JSON.stringify(tree.map(root => ({
  id: root.id, children: root.children?.map(node => ({
    id: node.id, parentId: node.parentId, title: node.title,
    folderType: node.folderType, unmodifiable: node.unmodifiable, keys: Object.keys(node),
    children: node.children?.filter(child => !child.url).map(child => ({
      id: child.id, parentId: child.parentId, title: child.title,
      folderType: child.folderType, unmodifiable: child.unmodifiable, keys: Object.keys(child)
    }))
  }))
})), null, 2)));
```

Keep diagnostics private; inspect locally before sharing. Manage's existing browser-folder diagnostic view now also shows the derived restriction, writable and renamable fields. No native capability was probed by mutation. The accepted immediate-child policy replaces per-container proof; stronger root identification still requires supported evidence. Matching display names/paths is insufficient. Never repair existing Workspace entries by guessing.

Native review uses disposable ordinary content in an Edge-created Workspace; Workspace creation/rename/deletion stays in Edge. Simulated Chromium fixtures do not establish native Workspace compatibility.

## 0.1.26 policy update

The user accepted 0.1.25 native Edge checks and two-device changes/tag synchronization, plus reported successful Chrome use (not a full Chrome or cross-browser sync test). Ordinary bookmarks and subtrees may now move between Workspace containers. Workspace ↔ ordinary-root moves remain restricted; direct Workspaces-root receiving and container lifecycle mutations remain prohibited. Native outcome verification from 0.1.25 remains mandatory. No active-Workspace state controls permission.

The structural root assumption now requires positive Edge user-agent evidence from the browser adapter. A Chrome/unknown browser with the same root shape is not classified as Workspaces. Untyped/unknown special roots remain conservatively native-restricted; documented ordinary Chrome roots and descendants retain normal operations. This local derived signal is neither synchronized nor used in metadata identity.

Isolated tests cover cross-container bookmarks/subtrees, direct identity/tag preservation, inherited archive changes, root/container protection and Chrome name/shape independence. Native extension API success for this newly enabled boundary still needs review. No live data was moved; the historical title-change cause is not claimed solved.
