# Typographic catalogue — browsing/search checkpoint

Status: **0.1.4 sheet/annotation correction pass**, awaiting renewed Edge visual review. The user manually reviewed 0.1.2 using real bookmarks, screenshots, keyboard testing and a recording; search, roots, scope handling, runtime stability and most keyboard behavior were reported working well. No new Edit mode, inline CRUD redesign, drag/drop, or folder-tag persistence. The validated 0.1.1 baseline remains at `1217369dd10638942d80107d5f33d7f61491d075` on `master`, `archive/mvp-validated-0.1.1`, and annotated tag `mvp-validated-0.1.1`.

## Implemented presentation

- White typographic catalogue; Georgia / Times fallback, `clamp(42px, 3.3vw, 69px)`, tracking `-.01em`, line height `1em + 9px`. Structural labels use Helvetica / Arial at 16px. No downloaded fonts or runtime dependencies added.
- Ordinary bookmarks are true inline text, including natural wrapping within long titles: `Bookmark title [favicon];` followed by normal whitespace. The trailing favicon is `.75em` high/wide with `-.06em` vertical alignment; the icon and semicolon stay together. No bookmark wrapper forces a row. Native HTTP(S) links underline on hover/focus; favicons remain grayscale until hover/focus. Failed icons retain their reserved space without a broken-image glyph. Existing unsupported URLs remain non-navigating and keyboard focusable. Bookmarklets retain “Run this bookmarklet through Edge Favorites.”
- Textual folders use bold italic titles ending in `/`, a normal 16px direct-child item count, and `.2em` count spacing. Counts include direct subfolders and bookmarks, not a recursive total.
- Browse expansion is a single ordered ancestor path: opening a sibling replaces the old sibling and all its descendants; collapsing an open folder truncates the path there. Required ancestors remain open. Search continues to show all matching ancestry as context without changing the stored browse path. Expanded children begin inline wherever they fit and stay at exactly 85% of the main catalogue size at every depth. Inline margins provide `.6em` separation; cloned inline padding gives continuation fragments a subtle hanging inset. Its visual quality needs Edge review.
- `EXPANSION_END` in `src/ui/Catalogue.tsx` selects `'inline'` (current) or `'break'`. The latter adds a break after expanded folders directly inside a section. Nested expansions remain inline. For a temporary visual comparison, change the catalogue element's `data-expansion-end` attribute in DevTools without modifying source.
- All bookmark annotations are hidden in resting browse state. The HTTP text seen in the 0.1.3 Edge screenshot came from derived URL-status labels in a separate always-visible `essential-info` path, not bookmark tags. That path now uses `status-annotation` and the same item-local reveal rules. Only the bookmark’s own hover/focus reveals its tags, status, unsafe-link instructions and ambiguity notice. Search automatically reveals relevant tag explanations without exposing unrelated status labels. Annotations are absolute, single-line, 10px/10px sans, 2px below the item box; the smaller size is intentional to fit the interline space without changing catalogue leading. No wrapping or layout reflow; long annotations clip at the viewport without a horizontal page scrollbar. Non-navigating bookmarklets retain their keyboard focus and associated safety explanation.
- Folder-tag styling remains part of the intended design: the same hidden/hover/focus overlay, aligned to the folder title rather than its count. **Folder tags are deferred** because the validated metadata model supports only bookmark tags. This checkpoint adds no storage for them.

## Cards and interaction

- Each first-level folder becomes a full-bleed white sheet. The outer stack cancels the main gutter using negative margins, not `100vw`; inner wrappers restore the gutter for labels and catalogue text. Navigation remains guttered. Collapsed headers remain 70px with 16px labels. Removing the previous 20px top padding centers the text at 26–44px in the measured header, with 6px remaining before the following shadow’s 20px box. This accounts for the visible exposed surface rather than pushing the label toward the next dither. Header-only hover or keyboard focus exposes **2.5 fluid catalogue line boxes**. Peek is absolutely positioned and adds no document height.
- The peek surface ends with an opaque presentation of the following sheet’s header/lip. Its own transparent top shadow overlays the partial last preview line, so the concealment belongs to a sheet rather than a bare text-container crop; white covers underlying seams. This decorative following label is inert and `aria-hidden`, with no button. Real following headers retain their original document positions and pointer hit targets. The visual label and its actual hit target can therefore differ during peek; review this compromise in Edge. On the last section the cap is blank, without a fictitious following label or shadow.
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

In the intended Windows Edge profile, open `edge://extensions`. For an existing extension whose loaded path is this WSL `dist/`, click **Reload**, then open a fresh New Tab. If the existing extension points to a Windows clone, use **Load unpacked** with the Windows path printed above; verify that the extension's Details now show that path and version **0.1.4** before testing. Do not remove/uninstall the existing extension merely to change paths; uninstalling can discard profile-local metadata. If Edge does not permit switching the loaded path, stop and report that loading issue rather than resetting the profile. Expected ID: `nfhbegeoeafnpejpjdljhgagefbpafal`.

Privileged New Tab/extension pages are for user-controlled Edge review. No automated Edge visual or Microsoft sync validation is claimed.

## Focused visual regression checklist (0.1.4)

1. **Collapsed composition:** compare with `visual-review/mockup-sections-closed-approved.png`. Labels should have breathing room above the next sheet’s upward dither; spacing stays about 70px and surfaces remain full-bleed. Check wide/narrow windows.
2. **Annotation isolation:** open an HTTP-heavy section. Put pointer outside the catalogue and keyboard focus on Search: no annotations should show. Hover or Tab-focus one bookmark: only its annotation appears, in the interline space without touching either line or moving content. Search a tag match, then Escape: explanation appears during search and disappears afterward. Check wrapped titles and nested-size text with actual Windows fonts.
3. **Peek construction:** compare with `visual-review/mockup-section-peek-approved.png`. The raised white surface covers underlying seams; the final partial line is concealed by the following sheet’s upward dither/white lip. Inspect the 2.5-line preview, copied following label, and blank cap on the last section.
4. **Peek interaction:** move down successive actual 70px headers, then repeat with keyboard focus. Peek must not reflow or block underlying headers. The decorative following label is not an extra control; click the real header to open the card.
5. **Open/context regression:** compare label/content spacing and revealed annotation placement with `visual-review/mockup-section-fully-open-approved.png`. Scroll a long open card and switch sections: the new header stays visible. Briefly check sticky headers, inline prose/nesting, `/`, mixed search, scope switching and Escape.

No Edit mode, drag/drop, folder-tag persistence or sync changes. The mockup’s annotations illustrate placement, not permanent visibility. User-controlled Edge visual acceptance is still required.

## Rendered evidence (WSL Chromium, synthetic data)

All three supplied approved mockups and the Edge HTTP screenshot were opened and visually inspected. Original 0.1.3 renders of collapsed, peek and open states were inspected before source changes. Final renders were inspected after the corrections. The local Linux font fallback is not evidence of exact Windows Georgia appearance.

`npm run check` passes typecheck, lint, **137 tests across 8 files**, build and extension identity verification. The temporary Chromium harness and focused failure-case suite pass; no browser page errors were reported. Preserved checks include inline wrapping, icon placement/filter, folder-branch state, full-bleed geometry, natural/peek stacking, no-reflow pointer passthrough, search restoration and card-switch header visibility. The focused suite checks overflow at 390, 1280 and 1920px.

Measured results from the 1406px capture:

| State / geometry | Observed result |
| --- | --- |
| 103 HTTP annotations, pointer outside and focus on Search | 0 visible |
| Own bookmark hover / keyboard focus | 1 visible in either case |
| Focus moved elsewhere | 0 visible |
| Tag-match search | 1 relevant tag annotation; no HTTP status |
| Escape from search | 0 visible |
| Revealed annotation | 10px high; 2px above and about 4.4px below using local text/font metrics |
| Collapsed sheet / label | 70px; text at 26–44px; 6px before next shadow box |
| Peek body | 138.48px = 2.5 × 55.398px line height |
| Following-sheet lip | Opaque white, meets body boundary, pointer-transparent; transparent shadow at −20px |

Captures: [collapsed](visual-review/generated/0.1.4-collapsed.png), [peek](visual-review/generated/0.1.4-peek.png), [open, no annotations](visual-review/generated/0.1.4-open.png), [one hovered annotation](visual-review/generated/0.1.4-annotation.png), [raw measurements](visual-review/generated/0.1.4-measurements.json). These contain synthetic bookmarks and local placeholder icons only. The supplied reference images and Edge media are preserved locally, not staged for publication.

Temporary rerun commands, while the `/tmp` files remain available:

```sh
cd /home/dev/projects/bc-better-bookmarks
node /tmp/bb-catalogue-browser-check/build-fixture.mjs
PLAYWRIGHT_BROWSERS_PATH=/tmp/bb-catalogue-browsers node /tmp/bb-catalogue-browser-check/check.mjs
PLAYWRIGHT_BROWSERS_PATH=/tmp/bb-catalogue-browsers node /tmp/bb-catalogue-browser-check/failure-cases.mjs
```

The fixture imports current catalogue source/styles, uses synthetic HTTP bookmarks/icons and runs in a separate headless profile. No private Favorites or privileged Edge pages are accessed. Chromium must run outside the agent’s process sandbox. No project dependency was added.

## Files changed in this correction pass

- UI: `src/ui/Catalogue.tsx`, `CatalogueItems.tsx`, `SectionCard.tsx`, `style.css`.
- Regression test: `tests/catalogue-markup.test.tsx` (separate URL-status annotation path and associated description).
- Version/artifact: package/lockfile, source/generated manifests, `dist/index.html`, `dist/index.js` and replacement hashed CSS. No dependency, permission, manifest-key, SVG, worker, browser-adapter, core/search or persistence changes.
- Documentation: this design/checklist, current handoff, README/roadmap status and synthetic captures/measurements.
