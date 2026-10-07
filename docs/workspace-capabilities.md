# Browser-location capabilities — 0.1.24

## Evidence and limits

User review: other requested 0.1.23 checks pass; Workspace compatibility and editor highlighting remain outstanding. The duplicate-binding defect fixed in 0.1.23 is distinct from the historical native-title-change report. No cause of that historical title change has been established.

Inspected all five supplied 0.1.23 images with the image viewer: workspace-folder, bookmarks-highlighting, edit-hl-1, edit-hl-2, edit-hl-3. The first shows Edge rejecting a move with “Can't modify workspace folder”. This does not prove all cross-Workspace moves are prohibited or establish which tree nodes represent Workspace objects.

The user supplied a read-only `getTree` property inventory during implementation. Favorites bar and Other favorites expose `folderType: bookmarks-bar` and `other`. The Workspaces root and both immediate folders expose neither `folderType` nor `unmodifiable`; their property sets contain ordinary tree/date/sync fields and no Workspace identifier. The native IDs are device-local evidence, **not classification constants**. Raw personal diagnostics are not committed.

[Chromium's bookmarks contract](https://developer.chrome.com/docs/extensions/reference/api/bookmarks) documents browser-owned folder types (`bookmarks-bar`, `other`, `mobile`, `managed`) and managed-node restrictions. [Microsoft's API support list](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/api-support) lists bookmarks support. Neither establishes a public Workspace-container discriminator. [Microsoft's Workspace guide](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-workspaces) documents the product, not a bookmarks extension capability contract. These documents do not certify that modifying a native Favorites tree entry updates Workspace lifecycle state.

## Conservative application policy

`core/capabilities.ts` and `flattenTree` separate native writes from extension metadata:

- A documented ordinary root type establishes the ordinary bookmark domain. Root nodes themselves cannot be renamed/moved/deleted. Managed flags/types propagate restrictions to descendants.
- A top-level folder without a documented ordinary type, or an unknown browser folder type at any depth, marks that domain **unclassified**. It and its descendants stay browsable/searchable. Native creation, rename/URL changes, move/reorder and deletion are blocked there. This is a conservative application policy, **not a claim that each child is a Workspace container**.
- Names, positions, native IDs, `syncing`, timestamps and missing protection flags do not establish Workspace identity. An ordinary user folder named Workspaces under a typed ordinary root remains ordinary.
- No active-Workspace filtering, guessed special type strings, probing mutations, fallback copy/delete, identity repair, or reversal of prior changes.
- Current limitation: ordinary folders/favorites beneath an unclassified Workspace domain also have native fields read-only. Their supported native capabilities cannot yet be distinguished safely. Use Edge for native changes there. A browser that omits type information even for ordinary roots will conservatively restrict those domains too; it needs read-only evidence, not a guessed allowlist.

The UI uses derived writable/renamable/native-restriction state for menus, destinations and drag surfaces; `planMove` shares source/destination checks with the worker. Worker command preflight and fresh native-tree checks enforce the policy independently. API rejection surfaces without fallback writes. Edge remains the final authority, and a race between the final read and API call is not an atomic transaction.

Tags/archive are separate: non-managed real folders below roots and favorites remain eligible for metadata editing and conservative identity binding, even when native fields are protected. Names/URLs are read-only in those editors. Saving unchanged native fields issues no `bookmarks.update` or move. Browser roots and synthetic groups do not receive metadata. Existing folder identities remain reconciliation participants after native restrictions are applied; no schema/reset/transport change or automatic UUID allocation is introduced.

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

Keep diagnostics private; inspect locally before sharing. Manage's existing browser-folder diagnostic view now also shows the derived restriction, writable and renamable fields. No native capability was probed by mutation. Before relaxing Workspace restrictions, obtain a supported discriminator or a separately reviewed device-local association workflow with explicit evidence; matching display names/paths is insufficient. Never repair existing Workspace entries by guessing.

Native review uses disposable ordinary content in an Edge-created Workspace; Workspace creation/rename/deletion stays in Edge. Simulated Chromium fixtures do not establish native Workspace compatibility.
