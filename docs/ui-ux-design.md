# Typographic catalogue — browsing/search checkpoint

Status: **0.1.8 command/slash-wrapping checkpoint**, awaiting Edge review. See [keyboard-search.md](keyboard-search.md) for the command and native-focus limitations; prior 0.1.7 visual evidence remains below. The user accepted 0.1.6's 14px additional leading, measured peek coverage and 220ms full-open reveal; these are preserved. The user manually reviewed 0.1.2 using real bookmarks, screenshots, keyboard testing and a recording; search, roots, scope handling, runtime stability and most keyboard behavior were reported working well. No new Edit mode, inline CRUD redesign, drag/drop, or folder-tag persistence. The validated 0.1.1 baseline remains at `1217369dd10638942d80107d5f33d7f61491d075` on `master`, `archive/mvp-validated-0.1.1`, and annotated tag `mvp-validated-0.1.1`.

## Implemented presentation

- White typographic catalogue; Georgia / Times fallback, `clamp(42px, 3.3vw, 69px)`, tracking `-.01em`, line height `calc(1em + 14px)` at both main and nested sizes. Navigation uses regular 16px Helvetica / Arial, uppercase presentation and `.15em` tracking; the active root remains underlined. Section names use bold 17.6px Helvetica / Arial, with regular-weight gray provenance. No downloaded fonts or runtime dependencies added.
- Ordinary bookmarks remain inline prose: `Bookmark title [framed favicon];` followed by normal whitespace. Images are `.8em` high with automatic width/aspect ratio; `.1em` frame padding makes the outer height approximately `1em`. Frames use `#eee`, `vertical-align: -.01em` and `.12em` right margin before the semicolon. Failed/absent icons use a dimensionally equivalent `.8em` placeholder. Native links underline and icons become color on own hover/focus. The whole-final-word inline block is removed: all title text remains inline, with explicit underlines on each text span. Only the final grapheme (including combined emoji) stays with the icon/semicolon. Ordinary words wrap at natural boundaries; oversized tokens use emergency wrapping. Invisible `<wbr>` opportunities after underscores and forward slashes allow filenames/paths to break at their separators without adding characters or visible hyphens. Stored titles, accessible names and copied title text are unchanged; each bookmark still has one link and one keyboard stop. This is purely presentation; native URLs and bookmarklet non-navigation/safety behavior remain unchanged.
- Textual folders use bold italic titles ending in `/`, a normal 16px direct-child item count, and `.2em` count spacing. Counts include direct subfolders and bookmarks, not a recursive total.
- Browse expansion is a single ordered ancestor path: opening a sibling replaces the old sibling and all its descendants; collapsing an open folder truncates the path there. Required ancestors remain open. Search continues to show all matching ancestry as context without changing the stored browse path. Expanded children begin inline wherever they fit and stay at exactly 85% of the main catalogue size at every depth. Inline margins provide `.6em` separation; cloned inline padding gives continuation fragments a subtle hanging inset. Its visual quality needs Edge review.
- `EXPANSION_END` in `src/ui/Catalogue.tsx` selects `'inline'` (current) or `'break'`. The latter adds a break after expanded folders directly inside a section. Nested expansions remain inline. For a temporary visual comparison, change the catalogue element's `data-expansion-end` attribute in DevTools without modifying source.
- All bookmark annotations are hidden in resting browse state. The HTTP text seen in the 0.1.3 Edge screenshot came from derived URL-status labels in a separate always-visible `essential-info` path, not bookmark tags. That path now uses `status-annotation` and the same item-local reveal rules. Only the bookmark’s own hover/focus reveals its tags, status, unsafe-link instructions and ambiguity notice. Search automatically reveals relevant tag explanations without exposing unrelated status labels. Annotations are absolute, single-line, 10px/10px sans, 2px below the **first rendered text fragment**, at that fragment’s starting X; the existing annotation size is unchanged in this checkpoint. No wrapping or layout reflow; long annotations clip at the viewport without a horizontal page scrollbar. Non-navigating bookmarklets retain their keyboard focus and associated safety explanation. `useCatalogueAnnotations` measures a DOM Range over title text, not the whole wrapped link rectangle. One section observer plus render, hover/focus, image-load and font-load updates re-anchor only revealed annotations. The full-width flow clips horizontal overflow at the viewport edge; vertical focus contours stay visible. `useCatalogueAnnotations` measures a DOM Range over title text, not the whole wrapped link rectangle. One section observer plus render, hover/focus, image-load and font-load updates re-anchor only revealed annotations. The full-width flow clips horizontal overflow at the viewport edge; vertical focus contours stay visible.
- **Accepted annotation limitation:** limited overlap with a following-line favicon/frame is allowed. The absolute annotation paints above the frame and must remain readable, avoid actual bookmark text and cause no reflow. No further global-leading increase, font shrinking or collision-avoidance machinery is introduced to eliminate this accepted overlap.
- Folder-tag styling remains part of the intended design: the same hidden/hover/focus overlay, aligned to the folder title rather than its count. **Folder tags are deferred** because the validated metadata model supports only bookmark tags. This checkpoint adds no storage for them.

## Cards and interaction

- Each first-level folder becomes a full-bleed white sheet. The outer stack cancels the main gutter using negative margins, not `100vw`; inner wrappers restore the gutter for labels and catalogue text. Navigation remains guttered. Headers have an 85px minimum height, growing naturally when labels wrap. Shared heading styles apply to closed, peek, open and inert copied labels. Measured desktop labels span 27.5–49.48px, leaving 15.52px before the following shadow box. Heading hover has no underline; keyboard focus outlines only the compact name/provenance span with 4px breathing room, inside the white header. The full button remains the click target. Open content has 6px top clearance so the sticky white header cannot cover the first bookmark outline; this is not extra catalogue leading and does not alter peek depth. Bookmark focus uses one native multiline contour with a consistent 1px inset, keeping its line edges out of annotation space. Header-only hover or keyboard focus exposes **2.5 fluid catalogue line boxes**. The reveal body is absolutely positioned and adds no document height; the actual header stays in flow so wrapped labels reserve the right height.
- The peek surface ends with an opaque presentation of the following sheet’s header/lip. Its own transparent top shadow overlays the partial last preview line, so the concealment belongs to a sheet rather than a bare text-container crop; white covers underlying seams. This decorative following label is inert and `aria-hidden`, with no button. Real following headers retain their original document positions and pointer hit targets. The visual label and its actual hit target can therefore differ during peek; review this compromise in Edge. On the last section the cap is blank, without a fictitious following label or shadow. `usePeekCoverage` measures the copy’s natural header height and following real sheet boundaries; coverage ends at the next intact upward-shadow start, accounting for the overlapped 20px header strip. A pre-paint ResizeObserver follows entry/exit body height and responsive stack changes. The copy clips only its bottom excess while preserving its own upward dither. This removes exposed fragments beneath the copy without a fixed extra-pixel patch or document reflow.
- Peek content is inert and excluded from assistive navigation until the header opens the card. The peeking sheet and preview body have `pointer-events: none`, with pointer events restored only on its header; underlying headers remain reachable through the visual preview. Enter/Space on the header opens it; only one browse card is open at a time. Open cards participate in normal flow and have a small sticky header. Clicking the open header collapses it. Escape unwinds nested expansion, then the open card, and dismisses peek. Pointer and keyboard-focus peeks are tracked separately. When switching fully open cards, a layout effect calls instant `scrollIntoView` on the new section with a 12px scroll margin, preserving header visibility after the preceding card collapses. Position is constrained by the remaining document height; no smooth animation is used.
- The physical order increases downward: catalogue navigation is the backmost surface, the first section is above it, and each later section is above its predecessor. Every displayed section, including the first after root changes or search filtering, owns one transparent **top-edge** `::before` shadow at `top: -20px`, cast onto the preceding card. There is no bottom shadow or white-backed separator. The supplied SVG is byte-for-byte unchanged at `src/ui/assets/shadow.svg`, used as a 7×20px repeating horizontal tile; its dense lower edge already faces the foreground sheet, so it is not flipped. Its clear areas reveal the preceding sheet. During peek only, that card receives a z-index above every resting card; it returns to its natural order afterward. Fully open cards keep their natural z-order and flow height, so the following card casts its top-edge shadow onto their lower boundary. Vite may inline this small file in the built CSS. No blurred shadows or animation libraries. Peek body height transitions over 140ms ease-out on entry and 90ms on exit, moving the opaque following-sheet lip/shadow coherently. A new active peek layers above a leaving one; CSS reverses interrupted transitions directly, with no activation delay or animation queue. Inert content remains mounted for at most 100ms to finish exit, then is released. Full-open layout and context scrolling happen immediately, with a 220ms ease-out opacity/3px content reveal inside the opaque sheet; enormous card heights are never animated. Reduced motion disables transitions and animation.
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

Core service, matching, search, metadata, persistence, bookmark repositories and the worker mutation pipeline are unchanged. 0.1.8 adds command/readiness event wiring alongside that pipeline. Browse actions send no mutation or set-root commands. Nonempty-folder deletion, folder deletion generally, and folder movement remain unavailable as in the MVP. No completed real Edge sync tests were reopened.

## Favicon integration evidence and limit

Chromium documents the extension-local `/_favicon/?pageUrl=...&size=32` endpoint and the `favicon` permission in [Fetching favicons](https://developer.chrome.com/docs/extensions/how-to/ui/favicons). Microsoft documents compatible Chromium extension APIs/manifest keys in [Port a Chrome extension to Microsoft Edge](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/port-chrome-extension); its [API list](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/api-support) does not separately enumerate this resource endpoint. Using it in Edge is based on that compatibility guidance; the installed Edge version still needs the manual check below.

The favicon integration originally added only `favicon`; 0.1.8 additionally uses `tabs` for the [search command](keyboard-search.md). URL construction stays in `src/browser/favicon.ts` and accepts only existing safe, credential-free HTTP(S) targets. No host, history, scripting, or web-accessible-resource permissions were added, and no external icon service is used. The manifest key is unchanged. Edge may show a permission prompt on reload; review it before enabling the updated extension.

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

In the intended Windows Edge profile, open `edge://extensions`. For an existing extension whose loaded path is this WSL `dist/`, click **Reload**, then open a fresh New Tab. If the existing extension points to a Windows clone, use **Load unpacked** with the Windows path printed above; verify that the extension's Details now show that path and version **0.1.8** before testing. Do not remove/uninstall the existing extension merely to change paths; uninstalling can discard profile-local metadata. If Edge does not permit switching the loaded path, stop and report that loading issue rather than resetting the profile. Expected ID: `nfhbegeoeafnpejpjdljhgagefbpafal`.

Privileged New Tab/extension pages are for user-controlled Edge review. No automated Edge visual or Microsoft sync validation is claimed.

## Focused Edge review checklist (0.1.7)

1. **Wrapped annotations:** hover/focus the reported mid-line examples at main and nested sizes. Annotation X follows the first text fragment and Y sits immediately below its first line. Resize, expand folders and search `#tag`; no reflow or bookmark-text overlap. Frame overlap remains accepted if readable and above the frame.
2. **Titles:** hover the text and favicon of single-word and multiword bookmarks. Every title word underlines. Check `disaster_recovery_planning_template_revised.pdf`, long final words and narrow windows: underscores stay visible, no added hyphens, no excessive indivisible ending or horizontal scrolling. Copy the title to confirm unchanged text.
3. **Keyboard focus:** Tab through closed/peek/open and sticky section headers; each label gets a complete compact rectangle within white. Open a section, then Tab to its first link and a wrapped link: one stop per item, complete visible contour and no movement. Review Windows font-specific contour spacing.
4. **Retained interactions:** traverse headers downward, reverse peeks, click mid-transition and switch away from a long open section. Check opaque peek coverage during entry/exit, unchanged timing/depth, immediate card-switch position, Escape/search/root behavior and reduced motion. Repeat narrow and native Edge zoom checks.

Natural-language automatic hyphenation is not enabled for unknown-language titles. No auto-scrolling, thumbnails, Edit mode, drag/drop, sync work or new permissions. Stop for user review before another refinement.

## Reference inspection and rendered evidence (0.1.7)

These exact images were opened and visually inspected before source changes:

- `docs/visual-review/release 0.1.6 - annotation wrapped favorites - 1.png`
- `docs/visual-review/release 0.1.6 - annotation wrapped favorites - 2.png`
- `docs/visual-review/release 0.1.6 - annotation wrapped favorites - 3.png`
- `docs/visual-review/release 0.1.6 - annotation wrapped favorites - 4.png`
- `docs/visual-review/release 0.1.6 - section title keyboard focus.png`
- `docs/visual-review/release 0.1.6 - section title keyboard focus - opened.png`
- `docs/visual-review/release 0.1.6 - first line favorite title keyboard focus.png`

All supplied review media remain untouched/untracked. Diagnosis against the rendered 0.1.6 markup found: annotations anchored to the entire relative inline item; the atomic final-word block prevented underline propagation and constrained wrapping; full-width header outlines extended into adjacent surfaces; the first bookmark outline was **covered by the opaque sticky header**, rather than clipped by open-content overflow. The fix keeps peek clipping intact.

`npm run check` passes typecheck, lint, **139 tests across 8 files**, production build/version checks and extension identity verification. Focused Chromium checks pass with no page errors, including exact first-fragment alignment after resizing and actual local font loading, no focus/annotation reflow, correct title selection and keyboard traversal, filename/long-token wrapping, compact header focus in all states, favicon/fallback behavior, rapid switching/clicks/reduced motion and long-card scroll context.

| Measurement | Result |
| --- | --- |
| First-fragment annotation placement | X delta 0; Y 2px below first text-fragment box, main and nested |
| Main / nested leading at 1406px | 60.398px / 53.438px, still font size + 14px |
| Resting / own hover or focus annotations | 0 / 1; deliberate search explanations preserved |
| Annotation and keyboard-focus induced movement | 0 in settled fixture geometry |
| Annotation/text-ink intersections | 0 across seven sampled titles, using local font metrics |
| Accepted annotation/frame intersection | 1 representative example; hit-testing confirms annotation above frame |
| Peek coverage | 109 entry/exit samples, zero seam/boundary gaps or partial covered labels |
| Peek depth / full-open reveal | 2.5 declared line boxes / 220ms, unchanged |
| Reduced motion | Instant transitions; open animation disabled |

Coverage spans desktop, 320/390px widths and 80/100/125/150/200% zoom-equivalent layouts. Zoom is emulated with CSS viewport and device scale factor, not native Edge controls. Synthetic checks do not establish visual acceptance; Windows fonts, real bookmarks and Edge zoom remain for review.

Captures: [wrapped annotation](visual-review/generated/0.1.7-wrapped-annotation.png), [nested annotation](visual-review/generated/0.1.7-nested-annotation.png), [accepted frame overlap](visual-review/generated/0.1.7-accepted-frame-overlap.png), [filename wrapping](visual-review/generated/0.1.7-filename-narrow.png), [first-link focus](visual-review/generated/0.1.7-first-focus.png), [wrapped-link focus](visual-review/generated/0.1.7-wrapped-focus.png), [closed header focus](visual-review/generated/0.1.7-heading-closed.png), [peek header focus](visual-review/generated/0.1.7-heading-peek.png), [open header focus](visual-review/generated/0.1.7-heading-open.png), [sticky header focus](visual-review/generated/0.1.7-heading-sticky.png), [peek boundary](visual-review/generated/0.1.7-peek-boundary.png), [measurements](visual-review/generated/0.1.7-measurements.json). These contain synthetic bookmarks, not private Favorites. Representative final captures were visually inspected.

Temporary rerun commands, while `/tmp` files remain available:

```sh
cd /home/dev/projects/bc-better-bookmarks
node /tmp/bb-catalogue-browser-check/build-017.mjs
PLAYWRIGHT_BROWSERS_PATH=/tmp/bb-catalogue-browsers node /tmp/bb-catalogue-browser-check/refinement-017.mjs
PLAYWRIGHT_BROWSERS_PATH=/tmp/bb-catalogue-browsers node /tmp/bb-catalogue-browser-check/inline-017.mjs
PLAYWRIGHT_BROWSERS_PATH=/tmp/bb-catalogue-browsers node /tmp/bb-catalogue-browser-check/coverage-017.mjs
PLAYWRIGHT_BROWSERS_PATH=/tmp/bb-catalogue-browsers node /tmp/bb-catalogue-browser-check/layout-updates-017.mjs
PLAYWRIGHT_BROWSERS_PATH=/tmp/bb-catalogue-browsers node /tmp/bb-catalogue-browser-check/frame-017.mjs
```

Chromium runs outside the agent process sandbox. No project dependency or production font was added. Fixtures do not exercise the installed Edge favicon API or Microsoft sync.

## 0.1.8 slash-wrapping follow-up

Visually inspected both supplied `release 0.1.7 - symbol hypenation 1.png` and `release 0.1.7 - symbol hypenation 2.png`. Bookmark-title slash separators now receive an invisible optional break after the slash. The preceding line retains `/`; no forced break or character is added. Scheme delimiters such as `https://` have an inline nowrap span, including scheme-only endings. Destination URLs and exact stored/copied text are unchanged. The final-grapheme protection does not enclose the preceding path segments. Decorative folder slashes are unaffected.

Focused Chromium checks exercised actual wrapping at five widths (320–1500px), protected scheme geometry, title selection, unchanged href, full underlines and overflow. [Capture](visual-review/generated/0.1.8-slash-wrapping.png) and [measurements](visual-review/generated/0.1.8-wrapping-results.json) are synthetic evidence, not Edge acceptance. Brief Edge check: inspect the reported URL/repository titles at wide/narrow widths, verify optional breaks with visible trailing slashes, copy titles, and hover/Tab to check annotations/underlines/focus.

The user accepts current observed English/German hyphenation behavior. No language detection, language assignments or additional hyphenation work is implemented or scheduled in this checkpoint.

## Language-aware hyphenation finding

`index.html` declares English for the UI. `FavoriteNode`, `Favorite` and existing metadata provide no reliable per-bookmark title language. A bookmark's browser/UI locale or URL domain is not evidence of its title language. Title links therefore use `lang=""` (unknown), preserving mixed-language content rather than inheriting English.

The previous atomic ending also isolated the final word from the surrounding inline text. Removing it restores ordinary line-breaking opportunities, but does not supply a language or a hyphenation dictionary. [CSS Text's hyphenation rules](https://drafts.csswg.org/css-text-3/#hyphenation) require known language and an available language-appropriate hyphenation resource for automatic hyphenation. Setting `hyphens: auto` alone would not solve this catalogue's mixed-language case, so no such claim or global language assignment is made.

Concrete follow-up: separately decide whether users should explicitly assign a **local title language** per item or folder (with clear override/inheritance and unknown default). If authorized, apply reliable `lang` values and `hyphens: auto`, then verify actual Edge dictionaries and filename exclusions. The UX and local persistence/identity policy need their own decision; no fetching, language detection dependency, new permissions or synchronized language metadata was added now.

## Deferred imagery direction

Locally cached website thumbnails may later take precedence over favicons. Actual website thumbnails should initially have **no light-gray backing or frame padding**; favicons/placeholders retain the framed treatment. Capture, permissions, caching/storage and fallback policy require a separate implementation decision. This checkpoint adds no thumbnail infrastructure or permissions. Delayed automatic preview scrolling, Edit mode and drag/drop also remain deferred.

## Files changed in the 0.1.7 layout checkpoint

- UI: `BookmarkLabel.tsx`, `CatalogueItems.tsx`, `SectionCard.tsx`, `style.css`, new `useCatalogueAnnotations.ts`.
- Tests: `tests/catalogue-markup.test.tsx` preserves text/selection semantics, one link, unknown language and separator breaks; rendered checks cover actual geometry rather than CSS constants.
- Version/artifact: package/lockfile, source/generated manifest, `dist/index.html`, `dist/index.js` and replacement hashed CSS.
- Documentation: this design/checklist, current handoff, README, roadmap and synthetic captures/measurements.
- No dependency, permission, manifest-key, SVG, worker, browser-adapter, core/search, metadata or persistence changes.

0.1.8 additionally changes command/browser routing, the App/Catalogue handoff, build entry points/manifests, wrapping and related tests; see [the keyboard handoff](keyboard-search.md) and current `development-state.md`.
