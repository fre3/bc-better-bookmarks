# Typographic catalogue — browsing/search checkpoint

Status: **0.1.5 heading/favicon/motion checkpoint**, awaiting renewed Edge visual review. The user manually reviewed 0.1.2 using real bookmarks, screenshots, keyboard testing and a recording; search, roots, scope handling, runtime stability and most keyboard behavior were reported working well. No new Edit mode, inline CRUD redesign, drag/drop, or folder-tag persistence. The validated 0.1.1 baseline remains at `1217369dd10638942d80107d5f33d7f61491d075` on `master`, `archive/mvp-validated-0.1.1`, and annotated tag `mvp-validated-0.1.1`.

## Implemented presentation

- White typographic catalogue; Georgia / Times fallback, `clamp(42px, 3.3vw, 69px)`, tracking `-.01em`, line height `1em + 9px`. Navigation uses regular 16px Helvetica / Arial, uppercase presentation and `.15em` tracking; the active root remains underlined. Section names use bold 17.6px Helvetica / Arial, with regular-weight gray provenance. No downloaded fonts or runtime dependencies added.
- Ordinary bookmarks remain inline prose: `Bookmark title [framed favicon];` followed by normal whitespace. Images are `.8em` high with automatic width/aspect ratio; `.1em` frame padding makes the outer height approximately `1em`. Frames use provisional `#eee`, `vertical-align: -.01em` and `.12em` right margin before the semicolon. Failed/absent icons use a dimensionally equivalent `.8em` placeholder. Native links underline and icons become color on own hover/focus. The final word is an inline block bounded by the available width; oversized words can wrap. Its final grapheme (including combined emoji) stays with the icon/semicolon, preventing detached punctuation. The rest of the title wraps normally. This is purely presentation; native URLs and bookmarklet non-navigation/safety behavior remain unchanged.
- Textual folders use bold italic titles ending in `/`, a normal 16px direct-child item count, and `.2em` count spacing. Counts include direct subfolders and bookmarks, not a recursive total.
- Browse expansion is a single ordered ancestor path: opening a sibling replaces the old sibling and all its descendants; collapsing an open folder truncates the path there. Required ancestors remain open. Search continues to show all matching ancestry as context without changing the stored browse path. Expanded children begin inline wherever they fit and stay at exactly 85% of the main catalogue size at every depth. Inline margins provide `.6em` separation; cloned inline padding gives continuation fragments a subtle hanging inset. Its visual quality needs Edge review.
- `EXPANSION_END` in `src/ui/Catalogue.tsx` selects `'inline'` (current) or `'break'`. The latter adds a break after expanded folders directly inside a section. Nested expansions remain inline. For a temporary visual comparison, change the catalogue element's `data-expansion-end` attribute in DevTools without modifying source.
- All bookmark annotations are hidden in resting browse state. The HTTP text seen in the 0.1.3 Edge screenshot came from derived URL-status labels in a separate always-visible `essential-info` path, not bookmark tags. That path now uses `status-annotation` and the same item-local reveal rules. Only the bookmark’s own hover/focus reveals its tags, status, unsafe-link instructions and ambiguity notice. Search automatically reveals relevant tag explanations without exposing unrelated status labels. Annotations are absolute, single-line, 10px/10px sans, 2px below the item box; the smaller size is intentional to fit the interline space without changing catalogue leading. No wrapping or layout reflow; long annotations clip at the viewport without a horizontal page scrollbar. Non-navigating bookmarklets retain their keyboard focus and associated safety explanation.
- Folder-tag styling remains part of the intended design: the same hidden/hover/focus overlay, aligned to the folder title rather than its count. **Folder tags are deferred** because the validated metadata model supports only bookmark tags. This checkpoint adds no storage for them.

## Cards and interaction

- Each first-level folder becomes a full-bleed white sheet. The outer stack cancels the main gutter using negative margins, not `100vw`; inner wrappers restore the gutter for labels and catalogue text. Navigation remains guttered. Headers have an 85px minimum height, growing naturally when labels wrap. Shared heading styles apply to closed, peek, open and inert copied labels. Measured desktop labels span 27.5–49.48px, leaving 15.52px before the following shadow box. Heading hover has no underline; keyboard focus retains its outline. Header-only hover or keyboard focus exposes **2.5 fluid catalogue line boxes**. The reveal body is absolutely positioned and adds no document height; the actual header stays in flow so wrapped labels reserve the right height.
- The peek surface ends with an opaque presentation of the following sheet’s header/lip. Its own transparent top shadow overlays the partial last preview line, so the concealment belongs to a sheet rather than a bare text-container crop; white covers underlying seams. This decorative following label is inert and `aria-hidden`, with no button. Real following headers retain their original document positions and pointer hit targets. The visual label and its actual hit target can therefore differ during peek; review this compromise in Edge. On the last section the cap is blank, without a fictitious following label or shadow.
- Peek content is inert and excluded from assistive navigation until the header opens the card. The peeking sheet and preview body have `pointer-events: none`, with pointer events restored only on its header; underlying headers remain reachable through the visual preview. Enter/Space on the header opens it; only one browse card is open at a time. Open cards participate in normal flow and have a small sticky header. Clicking the open header collapses it. Escape unwinds nested expansion, then the open card, and dismisses peek. Pointer and keyboard-focus peeks are tracked separately. When switching fully open cards, a layout effect calls instant `scrollIntoView` on the new section with a 12px scroll margin, preserving header visibility after the preceding card collapses. Position is constrained by the remaining document height; no smooth animation is used.
- The physical order increases downward: catalogue navigation is the backmost surface, the first section is above it, and each later section is above its predecessor. Every displayed section, including the first after root changes or search filtering, owns one transparent **top-edge** `::before` shadow at `top: -20px`, cast onto the preceding card. There is no bottom shadow or white-backed separator. The supplied SVG is byte-for-byte unchanged at `src/ui/assets/shadow.svg`, used as a 7×20px repeating horizontal tile; its dense lower edge already faces the foreground sheet, so it is not flipped. Its clear areas reveal the preceding sheet. During peek only, that card receives a z-index above every resting card; it returns to its natural order afterward. Fully open cards keep their natural z-order and flow height, so the following card casts its top-edge shadow onto their lower boundary. Vite may inline this small file in the built CSS. No blurred shadows or animation libraries. Peek body height transitions over 140ms ease-out on entry and 90ms on exit, moving the opaque following-sheet lip/shadow coherently. A new active peek layers above a leaving one; CSS reverses interrupted transitions directly, with no activation delay or animation queue. Inert content remains mounted for at most 100ms to finish exit, then is released. Full-open layout and context scrolling happen immediately, with a 170ms opacity/3px content reveal inside the opaque sheet; enormous card heights are never animated. Reduced motion disables transitions and animation.
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

In the intended Windows Edge profile, open `edge://extensions`. For an existing extension whose loaded path is this WSL `dist/`, click **Reload**, then open a fresh New Tab. If the existing extension points to a Windows clone, use **Load unpacked** with the Windows path printed above; verify that the extension's Details now show that path and version **0.1.5** before testing. Do not remove/uninstall the existing extension merely to change paths; uninstalling can discard profile-local metadata. If Edge does not permit switching the loaded path, stop and report that loading issue rather than resetting the profile. Expected ID: `nfhbegeoeafnpejpjdljhgagefbpafal`.

Privileged New Tab/extension pages are for user-controlled Edge review. No automated Edge visual or Microsoft sync validation is claimed.

## Focused Edge review checklist (0.1.5)

1. **Headings/navigation:** check 85px desktop spacing, bold 17.6px names, lighter provenance, no heading hover underline, visible keyboard focus, uppercase tracked navigation and wrapped narrow labels.
2. **First edge:** the first sheet casts its transparent upward dither onto navigation. Switch roots and search so a different section becomes first; check for a single full-width edge.
3. **Framed icons/flow:** check real icons, missing icons and nested sizes. Titles wrap naturally; the final word and framed favicon/semicolon stay together where practical. Try long unbroken titles and narrow windows.
4. **Annotations/line boxes:** nothing shows at rest; own hover/focus and deliberate search explanations still work. Inspect the recorded nested annotation/frame overlap and other dense/wrapped cases with Windows fonts. Global leading remains unchanged.
5. **Motion/interactions:** rapidly move down headers, reverse direction and click mid-peek. No reflow, pointer blocking, stale previews or wrong-card opening. Check reduced motion, keyboard focus/Escape, sticky headers and switching away from a long open section. The next-sheet visual copy remains noninteractive.

No Edit mode, drag/drop, delayed preview scrolling, website capture or folder-tag persistence was implemented. User-controlled Edge review remains required before further refinement.

## Reference inspection and rendered evidence

The approved closed, peek and open mockups were opened with the image-viewing tool before source changes. **The latest styling reference is missing at `docs/visual-review/top-section-with-shadow.png`.** No comparison against it is claimed; explicit user values were followed, with `#eee` as a provisional light-gray frame. Local Linux fonts also differ from Windows Georgia.

`npm run check` passes typecheck, lint, **138 tests across 8 files**, build/version checks and extension identity verification. Focused Chromium interaction/geometry assertions pass at 320/390/1280/1920px, with no page errors. They exercise re-entry/rapid switching, mid-transition clicks, reduced motion, first shadows after scope/filter changes, pointer passthrough, immediate card-switch context, real favicon decoding, aspect ratio, fallback, nested sizing, long-word wrapping and protected final punctuation. These do not establish visual acceptance.

| Measurement at 1406px | Result |
| --- | --- |
| Header / label bounds | 85px / 27.5–49.48px; 15.52px before next shadow box |
| Heading / provenance weights | 700 / 400 at 17.6px |
| Main font / image / outer frame | 46.398px / 37.11px / 46.36px |
| Nested font / outer frame | 39.438px / 39.42px |
| Peek body | 138.48px = 2.5 declared line boxes |
| Annotations at rest / own hover or focus | 0 / 1; tag matches remain deliberate explanations |
| Reduced-motion transition duration | 0s; open animation disabled |

**Flagged collision, not silently fixed by increasing leading:** the main tail’s actual box is 58.30px against declared 55.398px leading, and the nested box is 50.47px against 48.438px. A revealed nested annotation overlaps a following-line favicon frame in the stress fixture. The sampled main/nested/long-title cases showed no annotation/text-ink overlap using local font metrics; that is not a guarantee across Windows fonts, text and widths. Inspect the nested capture before accepting this checkpoint.

Captures: [closed](visual-review/generated/0.1.5-closed.png), [peek](visual-review/generated/0.1.5-peek.png), [open](visual-review/generated/0.1.5-open.png), [annotation](visual-review/generated/0.1.5-annotation.png), [nested collision](visual-review/generated/0.1.5-nested.png), [narrow](visual-review/generated/0.1.5-narrow.png), [measurements](visual-review/generated/0.1.5-measurements.json). These use synthetic bookmarks and a public [Wikipedia favicon](https://www.wikipedia.org/static/favicon/wikipedia.ico), plus a failed-image placeholder and synthetic non-square image. The real icon is decoded from a temporary local fixture, not obtained through an installed Edge extension; Edge’s favicon endpoint remains a manual check. Supplied Edge media/mockups remain untouched and untracked.

Temporary rerun commands, while `/tmp` files remain available:

```sh
cd /home/dev/projects/bc-better-bookmarks
node /tmp/bb-catalogue-browser-check/build-015.mjs
PLAYWRIGHT_BROWSERS_PATH=/tmp/bb-catalogue-browsers node /tmp/bb-catalogue-browser-check/refinement-015.mjs
```

The fixture imports current catalogue source/styles and runs in a separate headless profile. Chromium must run outside the agent process sandbox. No project dependency was added.

## Deferred imagery direction

Locally cached website thumbnails may later take precedence over favicons. Actual website thumbnails should initially have **no light-gray backing or frame padding**; favicons/placeholders retain the framed treatment. Capture, permissions, caching/storage and fallback policy require a separate implementation decision. This checkpoint adds no thumbnail infrastructure or permissions. Delayed automatic preview scrolling, Edit mode and drag/drop also remain deferred.

## Files changed in this checkpoint

- UI: new `src/ui/BookmarkLabel.tsx`, plus `CatalogueItems.tsx`, `SectionCard.tsx` and `style.css`.
- Tests: `tests/catalogue-markup.test.tsx` covers title/punctuation grouping, blank-title fallback and grapheme preservation alongside existing safety tests.
- Version/artifact: package/lockfile root versions, source/generated manifests, `dist/index.html`, `dist/index.js` and replacement hashed CSS. No dependency, permission, manifest-key, SVG, worker, browser-adapter, core/search or persistence changes.
- Documentation: this design/checklist, current handoff, README/roadmap status and synthetic captures/measurements.
