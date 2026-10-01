# Typographic catalogue — browsing/search checkpoint

Status: **0.1.3 browsing correction pass**, awaiting renewed Edge visual review. The user manually reviewed 0.1.2 using real bookmarks, screenshots, keyboard testing and a recording; search, roots, scope handling, runtime stability and most keyboard behavior were reported working well. No new Edit mode, inline CRUD redesign, drag/drop, or folder-tag persistence. The validated 0.1.1 baseline remains at `1217369dd10638942d80107d5f33d7f61491d075` on `master`, `archive/mvp-validated-0.1.1`, and annotated tag `mvp-validated-0.1.1`.

## Implemented presentation

- White typographic catalogue; Georgia / Times fallback, `clamp(42px, 3.3vw, 69px)`, tracking `-.01em`, line height `1em + 9px`. Structural labels use Helvetica / Arial at 16px. No downloaded fonts or runtime dependencies added.
- Ordinary bookmarks are true inline text, including natural wrapping within long titles: `Bookmark title [favicon];` followed by normal whitespace. The trailing favicon is `.75em` high/wide with `-.06em` vertical alignment; the icon and semicolon stay together. No bookmark wrapper forces a row. Native HTTP(S) links underline on hover/focus; favicons remain grayscale until hover/focus. Failed icons retain their reserved space without a broken-image glyph. Existing unsupported URLs remain non-navigating and keyboard focusable. Bookmarklets retain “Run this bookmarklet through Edge Favorites.”
- Textual folders use bold italic titles ending in `/`, a normal 16px direct-child item count, and `.2em` count spacing. Counts include direct subfolders and bookmarks, not a recursive total.
- Browse expansion is a single ordered ancestor path: opening a sibling replaces the old sibling and all its descendants; collapsing an open folder truncates the path there. Required ancestors remain open. Search continues to show all matching ancestry as context without changing the stored browse path. Expanded children begin inline wherever they fit and stay at exactly 85% of the main catalogue size at every depth. Inline margins provide `.6em` separation; cloned inline padding gives continuation fragments a subtle hanging inset. Its visual quality needs Edge review.
- `EXPANSION_END` in `src/ui/Catalogue.tsx` selects `'inline'` (current) or `'break'`. The latter adds a break after expanded folders directly inside a section. Nested expansions remain inline. For a temporary visual comparison, change the catalogue element's `data-expansion-end` attribute in DevTools without modifying source.
- Bookmark tags are explicitly hidden in resting browse state (both display and visibility rules). They appear as `#tag · #tag` in an absolutely positioned 12px overlay, without changing layout. Item hover and keyboard focus show all tags; search automatically shows tags that explain a targeted or otherwise-hidden tag match. Long annotations clip at the viewport without a horizontal page scrollbar. Derived JS/HTTP labels, unsafe-link instructions, and ambiguous-metadata notices remain visible as small annotations; they are not user tags.
- Folder-tag styling remains part of the intended design: the same hidden/hover/focus overlay, aligned to the folder title rather than its count. **Folder tags are deferred** because the validated metadata model supports only bookmark tags. This checkpoint adds no storage for them.

## Cards and interaction

- Each first-level folder becomes a full-bleed white sheet. The outer stack cancels the main gutter using negative margins, not `100vw`; inner wrappers restore the gutter for labels and catalogue text. Navigation remains guttered. Collapsed headers remain 70px with 16px labels; 20px top padding in the label control shifts the label lower for more breathing room. Header-only hover or keyboard focus exposes **2.5 fluid catalogue line boxes**. Peek is absolutely positioned and adds no document height.
- Peek content is inert and excluded from assistive navigation until the header opens the card. The peeking sheet and preview body have `pointer-events: none`, with pointer events restored only on its header; underlying headers remain reachable through the visual preview. Enter/Space on the header opens it; only one browse card is open at a time. Open cards participate in normal flow and have a small sticky header. Clicking the open header collapses it. Escape unwinds nested expansion, then the open card, and dismisses peek. Pointer and keyboard-focus peeks are tracked separately. When switching fully open cards, a layout effect calls instant `scrollIntoView` on the new section with a 12px scroll margin, preserving header visibility after the preceding card collapses. Position is constrained by the remaining document height; no smooth animation is used.
- The physical order increases downward: the first section is the back card, and each later section is above it. Every section except the first owns a transparent **top-edge** `::before` shadow at `top: -20px`, cast onto the preceding card. There is no bottom shadow or white-backed separator. The supplied SVG is byte-for-byte unchanged at `src/ui/assets/shadow.svg`, used as a 7×20px repeating horizontal tile; its dense lower edge already faces the foreground sheet, so it is not flipped. Its clear areas reveal the preceding sheet. During peek only, that card receives a z-index above every resting card; it returns to its natural order afterward. Fully open cards keep their natural z-order and flow height, so the following card casts its top-edge shadow onto their lower boundary. Vite may inline this small file in the built CSS. No blurred shadows or animation libraries. There is no transition motion to suppress.
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

In the intended Windows Edge profile, open `edge://extensions`. For an existing extension whose loaded path is this WSL `dist/`, click **Reload**, then open a fresh New Tab. If the existing extension points to a Windows clone, use **Load unpacked** with the Windows path printed above; verify that the extension's Details now show that path and version **0.1.3** before testing. Do not remove/uninstall the existing extension merely to change paths; uninstalling can discard profile-local metadata. If Edge does not permit switching the loaded path, stop and report that loading issue rather than resetting the profile. Expected ID: `nfhbegeoeafnpejpjdljhgagefbpafal`.

Privileged New Tab/extension pages are for user-controlled Edge review. No automated Edge visual or Microsoft sync validation is claimed.

## Focused visual regression checklist (0.1.3)

1. **Continuous flow:** verify multiple bookmarks share lines, long titles wrap naturally, and every item reads title → enlarged trailing favicon → semicolon → whitespace. Check wide and narrow windows; hover/keyboard focus should still color the icon. No horizontal page scrollbar.
2. **Tags:** with pointer and focus elsewhere, tags must be hidden. Hover or Tab-focus one bookmark to reveal its tags without reflow. Search a tag-only match to reveal its explanation; Escape must restore normal hidden-tag behavior. JS/HTTP and safety/ambiguity notices remain separate from user tags.
3. **One browse branch:** open A → A1, then A2: A stays open and A1 closes. Open sibling B: all of A closes. Clicking an open folder closes it and its descendants. Children can start inline and stay at one nested size with the existing hanging inset. Keep the inline ending for this pass.
4. **Sheets and dither:** verify opaque white surfaces and shadow edges reach both viewport sides while text stays guttered. Later/lower cards must lie above earlier ones; their transparent top-edge shadows extend upward onto the previous card. The first card has no preceding shadow. Inspect the increased space above labels and the boundary following a fully open card.
5. **Peek traversal:** move down successive collapsed headers. Each peek should expose about 2.5 lines, overlay subsequent cards without moving them, and allow the next header to receive hover/click through the preview. The preview's contents are not interactive. Tab-focus provides equivalent peek; opening makes content interactive. Ending peek restores natural stack order.
6. **Viewport context and smoke check:** open a very large card, scroll to another section, then open it; its header must remain clearly visible. Check sticky open headers and Escape. Briefly confirm `/`, typing, mixed search, root switching/provenance and search restoration still behave as in the accepted 0.1.2 review.

No Edit mode, drag/drop or folder tags were added. Automated type/logic/markup/build checks are not visual acceptance. After the user installed the Chromium dependencies in WSL, the temporary synthetic-data harness passed checks of full-bleed geometry, transparent upward shadows, natural/peek stacking, line-relative peek height with no reflow, pointer passthrough, inline wrapping, favicon size/filter, tag visibility states, sibling branch replacement, card-switch header visibility, search restoration and narrow viewport overflow. No page errors were reported. Synthetic screenshots at 1280px and 390px were inspected. The test assertion was corrected to derive expected dimensions from the fluid font size; no application fix or rebuild was needed. This is a local Chromium fixture result, not installed-Edge visual acceptance or Microsoft sync evidence. The corrected appearance still awaits user-controlled Edge review. No project dependency was added.

The temporary check can be rerun in WSL while its `/tmp` files remain available:

```sh
cd /home/dev/projects/bc-better-bookmarks
node /tmp/bb-catalogue-browser-check/build-fixture.mjs
PLAYWRIGHT_BROWSERS_PATH=/tmp/bb-catalogue-browsers node /tmp/bb-catalogue-browser-check/check.mjs
```

The fixture imports current catalogue source and styles, uses synthetic bookmarks/icons, and runs in a separate headless browser profile. Screenshots are `/tmp/bb-catalogue-browser-check/wide.png` and `narrow.png`. No private Favorites or privileged Edge pages are accessed. Chromium must run outside the agent's process sandbox.

## Files changed in this correction pass

- UI: `src/ui/Catalogue.tsx`, `CatalogueItems.tsx`, `SectionCard.tsx`, `catalogue-state.ts`, and `style.css`.
- Regression tests: `tests/catalogue.test.ts` and `tests/catalogue-markup.test.tsx` (branch transitions, title/icon/punctuation order, annotations and natural stacking).
- Version/artifact: `package.json`, `package-lock.json`, `public/manifest.json`, `dist/manifest.json`, `dist/index.html`, `dist/index.js`, and replacement hashed CSS. No dependency, permission, manifest-key, worker, browser-adapter, core/search or persistence changes.
- Documentation: this design/checklist, `docs/development-state.md`, and current-version/status references in README and roadmap.
