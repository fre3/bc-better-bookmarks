# Typographic catalogue — browsing/search checkpoint

Status: implemented for visual review in **0.1.2**, 2026-10-01. No new Edit mode, inline CRUD redesign, drag/drop, or folder-tag persistence. The validated 0.1.1 baseline remains at `1217369dd10638942d80107d5f33d7f61491d075` on `master`, `archive/mvp-validated-0.1.1`, and annotated tag `mvp-validated-0.1.1`.

## Implemented presentation

- White typographic catalogue; Georgia / Times fallback, `clamp(42px, 3.3vw, 69px)`, tracking `-.01em`, line height `1em + 9px`. Structural labels use Helvetica / Arial at 16px. No downloaded fonts or runtime dependencies added.
- Native HTTP(S) links underline on hover/focus. Browser favicons are inline, grayscale until hover/focus. Failed icons retain their small reserved space without a broken-image glyph. Existing unsupported URLs remain non-navigating and keyboard focusable. Bookmarklets retain “Run this bookmarklet through Edge Favorites.”
- Textual folders use bold italic titles ending in `/`, a normal 16px direct-child item count, and `.2em` count spacing. Counts include direct subfolders and bookmarks, not a recursive total.
- Expanded children stay in prose flow at exactly 85% of the main catalogue size at every depth. Inline margins provide `.6em` separation; cloned inline padding gives continuation fragments a subtle hanging inset. Its visual quality needs Edge review.
- `EXPANSION_END` in `src/ui/Catalogue.tsx` selects `'inline'` (current) or `'break'`. The latter adds a break after expanded folders directly inside a section. Nested expansions remain inline. For a temporary visual comparison, change the catalogue element's `data-expansion-end` attribute in DevTools without modifying source.
- Bookmark tags appear as `#tag · #tag` in a 12px overlay, without changing layout. Hover and keyboard focus show all tags; search automatically shows tags that explain a targeted or otherwise-hidden tag match. Long annotations clip at the viewport without a horizontal page scrollbar. Derived JS/HTTP labels, unsafe-link instructions, and ambiguous-metadata notices remain visible as small annotations; they are not user tags.
- Folder-tag styling remains part of the intended design: the same hidden/hover/focus overlay, aligned to the folder title rather than its count. **Folder tags are deferred** because the validated metadata model supports only bookmark tags. This checkpoint adds no storage for them.

## Cards and interaction

- Each first-level folder becomes a section. Collapsed headers are 70px high, showing only identity. Hover or header focus exposes three fluid catalogue line boxes plus a small clipped edge. Peek is absolutely positioned and overlays following cards; it adds no document height.
- Peek content is inert and excluded from assistive navigation until the header opens the card. Enter/Space on the header opens it; only one browse card is open at a time. Open cards participate in normal flow and have a small sticky header. Clicking the open header collapses it. Escape unwinds nested expansion, then the open card, and dismisses peek. Pointer and focus peeks are tracked separately.
- The supplied SVG is byte-for-byte unchanged at `src/ui/assets/shadow.svg`, used as a 7×20px repeating horizontal tile. Vite may inline this small file in the built CSS. No blurred shadows or animation libraries. There is no transition motion to suppress.
- The renderer exposes section/item IDs and separates catalogue projection, browse state, section cards, and item rendering. This provides boundaries for later Edit-mode drag targets without implementing dragging, insertion markers, or a second data model.

## Roots and search

- Actual root IDs and labels come from the browser tree container's children, including browser-specific and managed roots. All bookmarks is a synthetic default scope. Navigation is transient per page and **does not change the saved mutation scope**.
- Section identity is based on browser-local tree IDs solely for this disposable UI. These IDs do not become synchronized metadata keys. All bookmarks labels are `Section · Source root`; root-specific labels omit provenance.
- Each root's loose bookmarks form its own `Bookmarks` section. The section is placed at the first loose bookmark's position; remaining loose bookmarks retain their relative order within it. Interleaved loose bookmarks necessarily gather there, while folder and root order remain unchanged. Empty folders stay visible in browsing.
- Printable keys start search when the document has focus; `/` starts an empty query. Space retains native button activation/page scrolling. Text fields, modifier shortcuts, and active composition are not intercepted. A browser-focused address bar receives its own typing; click the page or Search / to focus the catalogue first.
- Search reuses `searchFavorites` unchanged, including mixed `plain #tag @folder` matching, case/whitespace behavior, URL text and system labels. Only matching bookmarks and their ancestor folders are shown, in source order; all matching sections/ancestors are open as context. Empty/no-match sections are hidden. Folder titles themselves do not introduce a second search algorithm.
- Escape from search restores the preceding browse expansions, focus where available, and scroll position. Changing roots retains the active query but resets stored browse expansion/scroll return state. Search renders a small result count and syntax hint, with no token pills.

## Existing management and safety

The temporary **Manage** action opens the existing MVP management interface, clearly separate from the catalogue. It retains the saved edit-scope selector, bookmark CRUD/movement, folder creation/rename, bookmarklet save confirmation, metadata diagnostics, reconcile/reload and export. No new Edit-mode item semantics or inline editors are implemented. Failed saves now retain the legacy editor instead of closing it, so its error and entered values remain reviewable.

Core service, matching, search, metadata, persistence, bookmark repositories and worker source are unchanged. Browse actions send no mutation or set-root commands. Nonempty-folder deletion, folder deletion generally, and folder movement remain unavailable as in the MVP. No completed real Edge sync tests were reopened.

## Favicon integration evidence and limit

Chromium documents the extension-local `/_favicon/?pageUrl=...&size=32` endpoint and the `favicon` permission in [Fetching favicons](https://developer.chrome.com/docs/extensions/how-to/ui/favicons). Microsoft documents compatible Chromium extension APIs/manifest keys in [Port a Chrome extension to Microsoft Edge](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/port-chrome-extension); its [API list](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/api-support) does not separately enumerate this resource endpoint. Using it in Edge is based on that compatibility guidance; the installed Edge version still needs the manual check below.

The only added permission is `favicon`. URL construction stays in `src/browser/favicon.ts` and accepts only existing safe, credential-free HTTP(S) targets. No host, tabs, history, scripting, or web-accessible-resource permissions were added, and no external icon service is used. The manifest key is unchanged. Edge may show a permission prompt on reload; review it before enabling the updated extension.

## Build and load in Edge

All development commands run in the authoritative **WSL** checkout:

```sh
cd /home/dev/projects/bc-better-bookmarks
npm ci
npm run check
npm run extension:id
wslpath -w /home/dev/projects/bc-better-bookmarks/dist
```

On this machine the Windows-visible path is `\\wsl.localhost\Ubuntu-24.04\home\dev\projects\bc-better-bookmarks\dist`.

The committed `dist/` is already built; rebuilding is unnecessary merely to review this checkpoint. `wslpath -w` prints the exact Windows-visible folder to select in Edge. Do not build or install dependencies in a Windows clone. This feature branch has not been pushed, so pulling the remote Windows clone will not obtain this checkpoint yet.

In the intended Windows Edge profile, open `edge://extensions`. For an existing extension whose loaded path is this WSL `dist/`, click **Reload**, then open a fresh New Tab. If the existing extension points to a Windows clone, use **Load unpacked** with the Windows path printed above; verify that the extension's Details now show that path and version **0.1.2** before testing. Do not remove/uninstall the existing extension merely to change paths; uninstalling can discard profile-local metadata. If Edge does not permit switching the loaded path, stop and report that loading issue rather than resetting the profile. Expected ID: `nfhbegeoeafnpejpjdljhgagefbpafal`.

Privileged New Tab/extension pages are for user-controlled Edge review. No automated Edge visual or Microsoft sync validation is claimed.

## Manual visual review checklist

1. **Initial catalogue:** All bookmarks selected; real root labels/order; section names precede provenance. Loose bookmarks stay in one Bookmarks section per root. Specific-root navigation removes provenance and resets open cards. Check an empty root/folder and duplicate folder names.
2. **Card stack:** compare collapsed 70px headers, pointer peek and Tab-focus peek. Following headers must not move during peek. Enter/Space/click opens the full card and pushes later cards down; opening another closes the first. Click again/Escape collapses without immediately re-peeking. Scroll a long open card to inspect the sticky header and tiled dither edge.
3. **Typography/items:** confirm system serif rendering at wide/narrow widths and browser zoom. Bookmark links underline and cached favicons change grayscale → color on pointer/keyboard focus. Folders have no icon, use bold italic `/`, and have a normal top-aligned count.
4. **Nested flow:** open folders at two or more depths. Children should remain at one 85% scale, with inline gaps and subtle continuation indentation. Compare `data-expansion-end="inline"` versus `"break"` in DevTools; only the first expanded level should gain an end break.
5. **Tags and annotations:** pointer-hover and keyboard-focus tagged items. Tags must appear beneath the title without moving anything. Inspect long titles/tags at narrow widths: clipping is acceptable, a horizontal page scrollbar is not. JS/HTTP labels, bookmarklet execution guidance and ambiguity notices remain readable.
6. **Search:** type a printable character on the focused page, use `/`, and click Search /. Try plain text, `#tag`, `@folder`, a mixed query, no matches, and clearing the query. Only matching bookmarks plus folder context remain, in source order. Tag-only matches explain themselves. Switch roots while searching; Escape restores the preceding browse state (or clean state after changing scope).
7. **Keyboard/layout:** Tab through roots, search, headers, open folders and links. Clipped peek links must not receive focus. Space/Enter still operate buttons; Ctrl/Cmd shortcuts are not captured. Escape steps back. Check narrow viewport, 200% zoom, a long card, and reduced-motion preference.
8. **Checkpoint boundary:** Manage opens the familiar controls and Back to catalogue returns to browsing. Confirm the edit-scope selection is unchanged by browse root changes. No new inline editor or drag/drop should appear. This is a presentation/access check, not a repeat of the completed CRUD/sync test programme.

Record visual findings before authorizing the editing checkpoint. Outstanding: installed-Edge favicon/permission behavior, actual clipping/line metrics, dither overlap, hanging-indent quality, and preferred first-level expansion ending.

## Changed files

- UI: `src/ui/App.tsx`, `Catalogue.tsx`, `CatalogueItems.tsx`, `SectionCard.tsx`, `catalogue-model.ts`, `catalogue-state.ts`, `LegacyManagement.tsx`, `style.css`, `legacy.css`, and `assets/shadow.svg`.
- Browser/build: `src/browser/favicon.ts`, `public/manifest.json`, `scripts/check-build.mjs`, `package.json`, and `package-lock.json` (version only, no dependency additions).
- New tests: `tests/catalogue.test.ts`, `tests/catalogue-markup.test.tsx`; existing tests unchanged.
- Generated artifact: `dist/index.html`, `dist/index.js`, `dist/background.js`, `dist/manifest.json`, and hashed CSS/shared-logic assets. The worker's generated import hash changes because shared UI/worker code is rebundled; worker source is unchanged.
- Documentation: `AGENTS.md`, `README.md`, `docs/development-state.md`, `docs/architecture.md`, `docs/roadmap.md`, and this design/checklist document.
