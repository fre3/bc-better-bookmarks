# Typographic catalogue — browsing/search checkpoint

Status: **0.1.15 accepted in native Edge**, preserved at `ui-validated-0.1.15`. The user reports Favorite editing works in 0.1.16; untested cases are not marked accepted. The user reports 0.1.17 tag changes/inheritance work well; **Later acceptance is recorded in the current handoff; 0.1.24 is pending native Edge review.** The user supplied specific passed 0.1.18 two-device folder/tag/archive scenarios (see cross-device-test.md); this does not mark all editing UI cases accepted. Prior checkpoint notes below describe the accepted catalogue behavior; current additions are in the final section. Validated MVP references remain unchanged.

## Implemented presentation

- White typographic catalogue; Georgia / Times fallback, `clamp(42px, 3.3vw, 69px)`, tracking `-.01em`, line height `calc(1em + 14px)` at both main and nested sizes. Navigation uses regular 16px Helvetica / Arial, uppercase presentation and `.15em` tracking; the active root remains underlined. Section names use bold 17.6px Helvetica / Arial, with regular-weight gray provenance. No downloaded fonts or runtime dependencies added.
- Ordinary bookmarks remain inline prose: `Bookmark title [framed favicon];` followed by normal whitespace. Images are `.8em` high with automatic width/aspect ratio; `.1em` frame padding makes the outer height approximately `1em`. Frames use `#eee`, `vertical-align: -.01em` and `.12em` right margin before the semicolon. Failed/absent icons use a dimensionally equivalent `.8em` placeholder. Native links underline and icons become color on own hover/focus. The whole-final-word inline block is removed: all title text remains inline, with explicit underlines on each text span. Only the final grapheme (including combined emoji) stays with the icon/semicolon. Ordinary words wrap at natural boundaries; oversized tokens use emergency wrapping. Invisible `<wbr>` opportunities after underscores and forward slashes allow filenames/paths to break at their separators without adding characters or visible hyphens. Stored titles, accessible names and copied title text are unchanged; each bookmark still has one link and one keyboard stop. This is purely presentation; native URLs and bookmarklet non-navigation/safety behavior remain unchanged.
- Textual folders use bold italic titles ending in `/`, a normal 16px direct-child item count, and `.2em` count spacing. Counts include direct subfolders and bookmarks, not a recursive total.
- Browse expansion is a single ordered ancestor path: opening a sibling replaces the old sibling and all its descendants; collapsing an open folder truncates the path there. Required ancestors remain open. Search continues to show all matching ancestry as context without changing the stored browse path. Expanded children begin inline wherever they fit and stay at exactly 85% of the main catalogue size at every depth. Inline margins provide `.6em` separation; cloned inline padding gives continuation fragments a subtle hanging inset. Its visual quality needs Edge review.
- `EXPANSION_END` in `src/ui/Catalogue.tsx` selects `'inline'` (current) or `'break'`. The latter adds a break after expanded folders directly inside a section. Nested expansions remain inline. For a temporary visual comparison, change the catalogue element's `data-expansion-end` attribute in DevTools without modifying source.
- All bookmark annotations are hidden in resting browse state. The HTTP text seen in the 0.1.3 Edge screenshot came from derived URL-status labels in a separate always-visible `essential-info` path, not bookmark tags. That path now uses `status-annotation` and the same item-local reveal rules. Only the bookmark’s own hover/focus reveals its tags, status, unsafe-link instructions and ambiguity notice. Search automatically reveals relevant tag explanations without exposing unrelated status labels. Annotations are absolute, single-line, 10px/10px sans, 2px below the **first rendered text fragment**, at that fragment’s starting X; the existing annotation size is unchanged in this checkpoint. No wrapping or layout reflow; long annotations clip at the viewport without a horizontal page scrollbar. Non-navigating bookmarklets retain their keyboard focus and associated safety explanation. `useCatalogueAnnotations` measures a DOM Range over title text, not the whole wrapped link rectangle. One section observer plus render, hover/focus, image-load and font-load updates re-anchor only revealed annotations. The full-width flow clips horizontal overflow at the viewport edge; vertical focus contours stay visible. `useCatalogueAnnotations` measures a DOM Range over title text, not the whole wrapped link rectangle. One section observer plus render, hover/focus, image-load and font-load updates re-anchor only revealed annotations. The full-width flow clips horizontal overflow at the viewport edge; vertical focus contours stay visible.
- **Accepted annotation limitation:** limited overlap with a following-line favicon/frame is allowed. The absolute annotation paints above the frame and must remain readable, avoid actual bookmark text and cause no reflow. No further global-leading increase, font shrinking or collision-avoidance machinery is introduced to eliminate this accepted overlap.
- Folder-tag styling uses the same hidden/hover/focus overlay, aligned to the folder title rather than its count. Persistence and inheritance were explicitly authorized for 0.1.17; see the current increment below.

## Cards and interaction

- Each first-level folder becomes a full-bleed white sheet. The outer stack cancels the main gutter using negative margins, not `100vw`; inner wrappers restore the gutter for labels and catalogue text. Navigation remains guttered. Headers have an 85px minimum height, growing naturally when labels wrap. Shared heading styles apply to closed, peek, open and inert copied labels. Measured desktop labels span 27.5–49.48px, leaving 15.52px before the following shadow box. Heading hover has no underline; keyboard focus outlines only the compact name/provenance span with 4px breathing room, inside the white header. The full button remains the click target. Open content has 6px top clearance so the sticky white header cannot cover the first bookmark outline; this is not extra catalogue leading and does not alter peek depth. Bookmark focus uses one native multiline contour with a consistent 1px inset, keeping its line edges out of annotation space. Header-triggered hover or keyboard focus exposes **2.5 fluid catalogue line boxes**. The reveal body is absolutely positioned; the actual header stays in flow so wrapped labels reserve the right height. Since 0.1.12 a separate temporary spacer can extend only the document bottom/footer near the catalogue end, keeping real header positions unchanged.
- Since 0.1.14, the final displayed section retains an active mouse peek across its header and white preview surface to the real footer top. Header entry is still required to activate it; earlier sections retain header-only hover. Geometry is rechecked during scroll/resize even with a stationary pointer. Crossing between header and surface does not restart auto-scroll, and entering the footer ends mouse retention without intercepting its links. Keyboard-only peeks stay static and preview contents stay inert.
- The peek surface ends with an opaque presentation of the following sheet’s header/lip. Its own transparent top shadow overlays the partial last preview line, so the concealment belongs to a sheet rather than a bare text-container crop; white covers underlying seams. Since 0.1.11 this lip contains a compact summary of all concealed real labels rather than only the next label; it is inert and `aria-hidden`, with no button. Real following headers retain their original document positions and pointer hit targets. The visual label and its actual hit target can therefore differ during peek; review this compromise in Edge. Since 0.1.12 the final section has no copied cap or summary; the real footer supplies its lower dither boundary. `usePeekCoverage` measures the copy’s natural header height and following real sheet boundaries. Across collapsed headers it ends at the next intact upward-shadow start, accounting for the overlapped 20px header strip. Since 0.1.10, reaching open content instead bounds coverage to the copied header plus only an intersected header/text fragment; it never scans across that open body to a distant boundary. A pre-paint ResizeObserver follows entry/exit body height and responsive stack changes. The copy clips only its bottom excess while preserving its own upward dither. This removes exposed fragments beneath the copy without a fixed extra-pixel patch or document reflow.
- Peek content is inert and excluded from assistive navigation until the header opens the card. The peeking sheet and preview body have `pointer-events: none`, with pointer events restored only on its header; underlying headers remain reachable through the visual preview. Enter/Space on the header opens it; only one browse card is open at a time. Open cards participate in normal flow and have a small sticky header. Clicking the open header collapses it. Escape unwinds nested expansion, then the open card, and dismisses peek. Pointer and keyboard-focus peeks are tracked separately. When switching fully open cards, a layout effect calls instant `scrollIntoView` on the new section with a 12px scroll margin, preserving header visibility after the preceding card collapses. Position is constrained by the remaining document height; no smooth animation is used.
- The physical order increases downward: catalogue navigation is the backmost surface, the first section is above it, and each later section is above its predecessor. Every displayed section, including the first after root changes or search filtering, owns one transparent **top-edge** `::before` shadow at `top: -20px`, cast onto the preceding card. There is no bottom shadow or white-backed separator. The supplied SVG is byte-for-byte unchanged at `src/ui/assets/shadow.svg`, used as a 7×20px repeating horizontal tile; its dense lower edge already faces the foreground sheet, so it is not flipped. Its clear areas reveal the preceding sheet. During peek only, that card receives a z-index above every resting card; it returns to its natural order afterward. Fully open cards keep their natural z-order and flow height, so the following card casts its top-edge shadow onto their lower boundary. Vite may inline this small file in the built CSS. No blurred shadows or animation libraries. Peek body height transitions over 140ms ease-out on entry and 90ms on exit, moving the opaque following-sheet lip/shadow coherently. A new active peek layers above a leaving one; CSS reverses interrupted transitions directly, with no activation delay or animation queue. Inert content remains mounted for at most 100ms to finish exit, then is released. Full-open layout and context scrolling happen immediately, with a 220ms ease-out opacity/3px content reveal inside the opaque sheet; enormous card heights are never animated. Reduced motion disables transitions and animation.
- The renderer exposes section/item IDs and separates catalogue projection, browse state, section cards, and item rendering. This provides boundaries for later Edit-mode drag targets without implementing dragging, insertion markers, or a second data model.

## Roots and search

- Actual root IDs and labels come from the browser tree container's children, including browser-specific and managed roots. All bookmarks is a synthetic default scope. Navigation is transient per page and **filters browsing/search only; mutation scope was removed in 0.1.19**.
- Section identity is based on browser-local tree IDs solely for this disposable UI. These IDs do not become synchronized metadata keys. All bookmarks labels are `Section · Source root`; root-specific labels omit provenance.
- Each root's loose bookmarks form its own `Bookmarks` section. The section is placed at the first loose bookmark's position; remaining loose bookmarks retain their relative order within it. Interleaved loose bookmarks necessarily gather there, while folder and root order remain unchanged. Empty folders stay visible in browsing.
- Printable keys start search when the document has focus; `/` starts an empty query. Space retains native button activation/page scrolling. Text fields, modifier shortcuts, and active composition are not intercepted. A browser-focused address bar receives its own typing; click the page or Search / to focus the catalogue first.
- Search reuses `searchFavorites` unchanged, including mixed `plain #tag @folder` matching, case/whitespace behavior, URL text and system labels. Matching bookmarks and folders plus their ancestry are shown in source order; matching sections/ancestors open as context. Since 0.1.17 effective tags participate and empty matching folders remain. The existing matcher also handles folder projections; no second search algorithm is introduced.
- Escape from search restores the preceding browse expansions, focus where available, and scroll position. Changing roots retains the active query and the original pre-search restoration snapshot. Repeated search commands never replace that snapshot. Search renders a small result count and syntax hint, with no token pills.

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

In the intended Windows Edge profile, open `edge://extensions`. For an existing extension whose loaded path is this WSL `dist/`, click **Reload**, then open a fresh New Tab. If the existing extension points to a Windows clone, use **Load unpacked** with the Windows path printed above; verify that the extension's Details now show that path and version **0.1.15** before testing. Do not remove/uninstall the existing extension merely to change paths; uninstalling can discard profile-local metadata. If Edge does not permit switching the loaded path, stop and report that loading issue rather than resetting the profile. Expected ID: `nfhbegeoeafnpejpjdljhgagefbpafal`.

Privileged New Tab/extension pages are for user-controlled Edge review. No automated Edge visual or Microsoft sync validation is claimed.

## Focused Edge review checklist (0.1.7)

1. **Wrapped annotations:** hover/focus the reported mid-line examples at main and nested sizes. Annotation X follows the first text fragment and Y sits immediately below its first line. Resize, expand folders and search `#tag`; no reflow or bookmark-text overlap. Frame overlap remains accepted if readable and above the frame.
2. **Titles:** hover the text and favicon of single-word and multiword bookmarks. Every title word underlines. Check `disaster_recovery_planning_template_revised.pdf`, long final words and narrow windows: underscores stay visible, no added hyphens, no excessive indivisible ending or horizontal scrolling. Copy the title to confirm unchanged text.
3. **Keyboard focus:** Tab through closed/peek/open and sticky section headers; each label gets a complete compact rectangle within white. Open a section, then Tab to its first link and a wrapped link: one stop per item, complete visible contour and no movement. Review Windows font-specific contour spacing.
4. **Retained interactions:** traverse headers downward, reverse peeks, click mid-transition and switch away from a long open section. Check opaque peek coverage during entry/exit, unchanged timing/depth, immediate card-switch position, Escape/search/root behavior and reduced motion. Repeat narrow and native Edge zoom checks.

Natural-language automatic hyphenation is not enabled for unknown-language titles. Delayed auto-scrolling is implemented in 0.1.9 as specified below. No thumbnails, Edit mode, drag/drop, sync work or new permissions. Stop for user review before another refinement.

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

Locally cached website thumbnails may later take precedence over favicons. Actual website thumbnails should initially have **no light-gray backing or frame padding**; favicons/placeholders retain the framed treatment. Capture, permissions, caching/storage and fallback policy require a separate implementation decision. This checkpoint adds no thumbnail infrastructure or permissions. Delayed automatic preview scrolling was promoted in 0.1.9; Edit mode and drag/drop remain deferred.

## Files changed in the 0.1.7 layout checkpoint

- UI: `BookmarkLabel.tsx`, `CatalogueItems.tsx`, `SectionCard.tsx`, `style.css`, new `useCatalogueAnnotations.ts`.
- Tests: `tests/catalogue-markup.test.tsx` preserves text/selection semantics, one link, unknown language and separator breaks; rendered checks cover actual geometry rather than CSS constants.
- Version/artifact: package/lockfile, source/generated manifest, `dist/index.html`, `dist/index.js` and replacement hashed CSS.
- Documentation: this design/checklist, current handoff, README, roadmap and synthetic captures/measurements.
- No dependency, permission, manifest-key, SVG, worker, browser-adapter, core/search, metadata or persistence changes.

0.1.8 additionally changes command/browser routing, the App/Catalogue handoff, build entry points/manifests, wrapping and related tests; see [the keyboard handoff](keyboard-search.md) and current `development-state.md`.

## 0.1.9 temporary scope, root shortcuts and preview scrolling

Commands capture origin before tab activation. An external-tab command temporarily switches search to All bookmarks, while dashboard-origin search retains its current scope. Navigation reflects the temporary scope. One original snapshot (root, open section, expanded path, scroll/focus) survives repeated commands, query edits and root changes until Escape. This snapshot is included in the existing one-shot explicit-search navigation handoff. It is disposable UI state, not mutation scope or synchronized metadata.

Root shortcuts use displayed order and root IDs: Alt+1 is All bookmarks, Alt+2 the first actual root, through Alt+9 if available. Search input focus/query/selection are retained. Tooltips, `aria-keyshortcuts` and descriptions provide help without new visible chrome. Exact Alt+number only: exclude Ctrl/Meta/Shift/AltGraph/composition, dialogs and non-search editing controls. Manage suspends catalogue key handling.

Manage exposes **Auto-scroll peek previews**, default enabled when absent, persisted solely to `chrome.storage.local` under `ui:auto-scroll-peek` through the existing worker queue. It does not share the sync metadata model. Opt-out is respected before motion starts on a new page; changes propagate to other open dashboards. Save errors are visible in Manage. The user can compare scrolling independently of search improvements.

Mouse-hover preview starts static. After **1000ms** of continuous hover on the same real header, only overflowing inert content translates upward at **one computed catalogue line / 2750ms**. A single cancellable RAF loop stops at the content end; ResizeObserver remeasures content/viewport and speed on size changes. It never expands folders or announces content. Heading, opaque sheet/lip, transparent dither, real header targets and page geometry do not move. Annotations share the content's coordinate space and move with it; preview annotations remain hidden under existing visibility rules.

Leave/switch/open/collapse/search/root change, disabling, hiding or reduced motion cancels and resets. Keyboard-only previews never scroll. Hidden-page return and a change back from reduced motion do not resume an old hover; fresh hover starts a full delay. Each frame also checks visibility/reduced motion before painting, covering queued event delivery. Cleanup removes timers, frames, listeners and observers; no state updates happen per animation frame. The existing 140ms/90ms sheet transition and 220ms full-open reveal are untouched. Normal opening begins at offset zero and retains prompt layout/context scrolling.

Evidence: [static peek](visual-review/generated/0.1.9-static-peek.png), [scrolling peek](visual-review/generated/0.1.9-scrolling-peek.png), [navigation](visual-review/generated/0.1.9-navigation.json), [scroll lifecycle](visual-review/generated/0.1.9-scroll.json), [coverage](visual-review/generated/0.1.9-coverage.json), [isolated extension/German layout](visual-review/generated/0.1.9-extension.json). These are synthetic/local Chromium evidence, not native Edge visual acceptance. See the six-point review checklist in [keyboard-search.md](keyboard-search.md).

## 0.1.10 overlap correction

Inspected `release 0.1.9 - section overlap -1.png`, `-2.png`, `-3.png`, representative frames from `release 0.1.9 - section overlap.mp4`, and `footer.png`. The latter is the black FRE3/GitHub strip; the implementation uses the explicitly requested **BC Better Bookmarks by FRE3** wording rather than the shorter reference label.

The open-sheet hypothesis was confirmed in a synthetic reproduction: hovering Career/FRE3 above open Crypto extended the 85px inert copied header to **875/960px**, ending at Stack's top shadow. The calculation searched for a later section boundary without distinguishing an open catalogue body from collapsed header spacing. The correction stops at the copied header's natural extent when it reaches open content, completing an overlapped real header or text fragment only as necessary to avoid slivers. It never extends across the open body to its distant next boundary. Collapsed stacks retain the measured intact-shadow rule that fixed the earlier exposed strip. Measurements use header flow extent, not displaced sticky position, and stop scanning after finding the relevant sheet. The open state, expanded branch, document scroll, peek body depth, transitions, auto-scrolling and pointer targets are preserved.

The user accepts **1000ms** delayed scrolling, temporary All bookmarks/Escape restoration, and **top-number-row Alt+1–9**. Windows Alt+numpad character entry is accepted platform behavior; no symbol filtering or keyboard suppression is introduced. Dashboard search remains **Ctrl+Shift+B**, including the accepted address-bar/Ctrl+F6 limitation. Scrolling still advances one computed line per 2750ms.

## Footer and 0.1.10 review evidence

The footer is a separate semantic component after the section collection, never part of root discovery, filtering or peek target state. It is full-width black with regular white 16px system sans labels, existing gutters and a 70px minimum height. Flex wrapping increases height when needed. Both exact requested URLs/labels are rendered as semantic links with `target="_blank" rel="noopener"`; hover/focus underlines and white keyboard outlines provide feedback. It owns the same unchanged transparent upward dither as the sheets above it.

The catalogue page uses a minimum viewport height and flex layout, with the footer's auto top margin filling short pages. Long pages place it after content. Manage keeps its existing layout and hides the catalogue/footer. The full-width catalogue clip prevents preview overflow from creating scrollable space below the footer, while retaining all top shadows and sticky header behavior.

Historical **0.1.11** behavior (the preview suppression/footer immobility below is superseded by 0.1.12): the permanent final-preview reservation is removed. Long pages end with the normal 85px collapsed header immediately before the footer's top edge. Natural spare space on short pages can host a final peek, limited to that room and at most 2.5 catalogue lines. Less than one readable line after the footer's 20px shadow suppresses preview; opening remains normal. Geometry is remeasured on stack/header/footer/viewport changes and font loading. No hover-induced layout, scrolling, footer movement, upward preview or hidden footer links. Expanded footer spacing is preserved.

`npm run check`: 175 tests / 11 files plus typecheck, lint, build/version and identity verification. Focused rendered checks cover bounded adjacent/distant open-sheet overlap, old collapsed strip, animated/scrolling/keyboard peek, pointer traversal and state/scroll preservation. Footer checks cover 20 viewport/content combinations, including narrow and zoom-equivalent sizes, empty/search-empty catalogues, exact links and keyboard feedback, and last-section peek. Actual native Edge visuals/zoom remain user review.

Captures: [Career above open Crypto](visual-review/generated/0.1.10-overlap-career.png), [FRE3 above open Crypto](visual-review/generated/0.1.10-overlap-fre3.png), [open final card/footer](visual-review/generated/0.1.10-footer-open.png), [final peek/footer focus](visual-review/generated/0.1.10-footer-last-peek.png), [empty search](visual-review/generated/0.1.10-footer-empty.png), [narrow footer](visual-review/generated/0.1.10-footer-narrow.png). Measurements: [overlap](visual-review/generated/0.1.10-overlap-results.json), [footer](visual-review/generated/0.1.10-footer-results.json). These synthetic captures were inspected; native Edge acceptance is pending. The focused checklist is in [development-state.md](development-state.md#files-and-edge-review).


## 0.1.11 compact footer and covered-section summary (historical; footer rule superseded below)

All five supplied 0.1.10 footer/peek images were visually inspected. The footer gap was an explicit 2.5-line reservation, now removed. The expanded layout is untouched. Final preview is limited to natural space before the footer; at least one readable line plus the upward-shadow depth is required, otherwise preview is suppressed while click/keyboard opening remains normal. No reserved whitespace, upward preview, reflow or footer motion is introduced.

The inert lip now summarizes all real labels intersecting the preview/cover rectangle, including partially concealed labels. Fully readable labels below the cover are excluded. Actual rendered bounds drive membership, following animated geometry, responsive size, fonts and scroll. The existing bounded lip calculation is unchanged; a hidden original-header measure preserves its height independently of the absolute summary. Summary fitting never extends coverage over an open sheet.

Names use the existing 17.6px bold heading face and gutter, with explicit sequence colors #222, #555 and #737373 thereafter. Regular provenance is shared once per consecutive stable root-ID group, never by matching root display names. Vertical bars separate names/groups. A canvas measurement with the actual system font fits a single stationary row: compact provenance, truncate long names, then omit a trailing suffix with an accurate +N. Very long provenance can also truncate; extremely small space can show only the count. Colors continue across groups. No opacity fading, tooltip dependency, links, tab stops, pointer interception or accessible duplicate labels. The real header names and targets remain unchanged.

Examples at 1250px: MB30 → `Baustoffe | FRE3 | Career · Favorites bar`; Baustoffe → `FRE3 | Career | Crypto · Favorites bar`. At 1920px the larger line height covers four names in some cases. At 320px with long labels, a first truncated name/provenance plus +2 remains inside the original header area. The summary is separate from auto-scrolling content and does not move with it.

`npm run check` passes 181 tests / 13 files, typecheck, lint, build/version and extension identity. Focused Chromium checks cover footer boundary/suppression, geometry-derived membership, cross-root groups, long/narrow names and counts, static keyboard/reduced-motion peek, resizing, rapid opening, search/root cleanup, auto-scroll stationarity, pointer passthrough, bounded open-sheet coverage and animated no-strip/zoom-equivalent regression. Native Edge acceptance remains pending.

Captures: [compact collapsed footer](visual-review/generated/0.1.11-footer-collapsed.png), [expanded footer](visual-review/generated/0.1.11-footer-open.png), [MB30](visual-review/generated/0.1.11-summary-mb30.png), [Baustoffe](visual-review/generated/0.1.11-summary-baustoffe.png), [cross-root](visual-review/generated/0.1.11-summary-cross-root.png), [narrow long names](visual-review/generated/0.1.11-summary-narrow.png), [peek above open Crypto](visual-review/generated/0.1.11-open-coverage.png). Reports: [footer](visual-review/generated/0.1.11-footer-results.json), [summary](visual-review/generated/0.1.11-summary-results.json), [interaction](visual-review/generated/0.1.11-interaction-results.json), [open coverage](visual-review/generated/0.1.11-overlap-results.json), [transition coverage](visual-review/generated/0.1.11-coverage-results.json), [search restoration](visual-review/generated/0.1.11-navigation.json). Synthetic fixtures only; no private Favorites exports.

After user acceptance of this checkpoint, close visual work and start `feature/bookmark-editing` from the accepted commit. No editing branch is created yet and no acceptance is assumed. Optional local multilingual semantic search remains separately deferred in the roadmap.


## 0.1.12 revised footer geometry (cleanup superseded by 0.1.13)

This explicitly supersedes 0.1.11's stationary-footer/suppression rule. Resting layout remains compact, but full 2.5-line peeks may temporarily move the footer and document bottom downward. Only a spacer after the real stack grows: headers and their hit targets keep their positions. Required space is the furthest active/exiting overlay bottom relative to the stable stack bottom, independent of moving-footer measurements. Natural flex space absorbs the reservation before the footer needs to move. The spacer follows exit geometry and is removed on cancellation; concurrent entering/leaving previews use a maximum rather than additive heights.

The final section has no empty copied successor row or duplicate shadow. Its preview ends at the real footer boundary when extra space is needed; the footer owns that dither. There is no automatic scrolling. Scroll anchoring within the catalogue is disabled. Manual scrolling into temporary space can clamp as the space contracts; geometry-only header entries are ignored until physical pointer motion to prevent a hover/reset loop. Fully opened layout and card-switch context adjustment remain unchanged.


## 0.1.12 Next summary and review evidence

Visually inspected all three supplied 0.1.11 references. Nonempty inert summaries now start with regular `Next:` in #666, followed by .4em space. Section names retain 17.6px bold with global sequence colors #111 / #666 / #767676. Regular #666 provenance stays attached to each consecutive stable root-ID group. Light #999 bars have .5em on each side within groups; root groups are separated by 1.25em without another bar. The prefix/gaps are included in measured width fitting. Name truncation, compact provenance and accurate +N remain inside the original summary box, preserving the first name in tested narrow layouts. No row is rendered when membership is empty. Geometry-driven membership and inert/pointer-passthrough semantics are unchanged.

`npm run check` passes 183 tests / 13 files, typecheck, lint, build/version and identity checks. Rendered checks cover complete footer-adjacent previews, stable real targets/scroll, minimal temporary extent and cleanup, bottom clamping without restart loops, summary grouping/spacing/width, stationary auto-scroll, keyboard/reduced motion, open-section coverage, no-strip transitions, zoom-equivalent sizes and search/Escape preservation. Native Edge acceptance remains pending.

Captures: [final peek and sole footer edge](visual-review/generated/0.1.12-footer-last.png), [preceding peek with full summary](visual-review/generated/0.1.12-footer-jobs.png), [Next summary](visual-review/generated/0.1.12-summary-mb30.png), [cross-root gaps](visual-review/generated/0.1.12-summary-cross-root.png), [narrow truncation](visual-review/generated/0.1.12-summary-narrow.png), [resting footer](visual-review/generated/0.1.12-footer-rest.png), [open footer](visual-review/generated/0.1.12-footer-open.png). Reports: [footer](visual-review/generated/0.1.12-footer-results.json), [footer transitions](visual-review/generated/0.1.12-footer-frames.json), [summary](visual-review/generated/0.1.12-summary-results.json), [interaction](visual-review/generated/0.1.12-interaction-results.json), [coverage](visual-review/generated/0.1.12-coverage-results.json), [search](visual-review/generated/0.1.12-navigation.json). All are synthetic/local Chromium evidence. The footer may move down without being scrolled into view; if a user manually scrolls into temporary space, normal bottom clamping can occur on exit. This is documented behavior, not a promise of stationary document height.

The user must accept this checkpoint before visual work closes or `feature/bookmark-editing` is created. Semantic search and other roadmap work remain deferred.


## 0.1.13 wheel/peek stability correction

The supplied 22.7-second recording was inspected at six representative times. Actual Chromium wheel/pointer input confirmed a recurring clamp/restore cycle: shrinking temporary space below a wheel-selected viewport clamped scroll, then later peeks restored the prior wheel offset and shifted header targets. The old pointer-entry guard did not fix this state. Four repeated cycles moved between roughly 343px and 423px during pointer-only traversal. The pre-fix harness settled under a completely stationary pointer; native Edge's stronger reported persistence remains part of the manual review.

Cleanup now retains only the portion of the existing reservation needed to support the current viewport. Current preview need and retained minimum combine by maximum; retention is capped by prior space, with fractional-pixel protection. Stable stack position and footer height provide the natural document boundary. Upward scrolling releases the minimum progressively to zero. Explicit section/root/search/Escape/Manage changes cancel the old geometry lifecycle, and stale retiring previews cannot restore it. The hook never calls a scroll API or adds an expiration delay. The global `peekClamped` guard is removed; normal header interaction remains available.

A user who remains scrolled into temporary space may see a small retained blank area after closing a preview. This is deliberate safe cleanup, not a permanent reservation: moving the pointer away stops preview work, while scrolling upward or navigating/opening/searching releases the space. Explicit transitions to shorter content may naturally clamp. No continuous scroll forcing, longer hover delay, disabled peeks or restored permanent gap.

All 0.1.12 Next styling, complete previews/sole final edge and accepted motion are unchanged. `npm run check` passes 185 tests / 13 files plus typecheck/lint/build. `scripts/check-peek-scroll.mjs` supplies a reproducible real-wheel regression: twelve cycles across desktop, narrow, fluid and reduced-motion configurations, initial-delay/active-scroll timing, stationary waits, traversal, exit, upward scrolling, open/search/Escape and pending-work cleanup. The regression fails on viewport oscillation with original 0.1.12 components and passes with this correction. Existing coverage/search regression suites pass.

Evidence: [before/after event summary](visual-review/generated/0.1.13-before-after.json), [wheel/frame results](visual-review/generated/0.1.13-wheel-results.json), [complete final peek](visual-review/generated/0.1.13-final-peek.png), [minimum retained space](visual-review/generated/0.1.13-retained-viewport.png), [released compact layout](visual-review/generated/0.1.13-released-space.png). Synthetic Chromium evidence only; native Edge acceptance is pending. No supplied recording frames with real bookmarks are committed.

## 0.1.14 final-section hover retention

The supplied 11.53-second recording was decoded; representative frames including the white-space state were visually inspected. The prior unconditional header-leave handler closed the last preview despite the pointer remaining inside that sheet. A narrowly scoped geometry hook now retains only an already active final-section mouse session, from header top to footer top. It observes pointer, scroll and size changes without altering pointer hit targets. Footer/window exit, blur, hiding or explicit navigation cancels it; returning to white space alone cannot activate a new peek. Root changes dynamically select the final section. Existing auto-scroll continues across header/surface traversal without resetting its delay.

The 0.1.13 spacer/safe-cleanup code is untouched. Genuine exit can still leave the minimum space supporting the current viewport; ordinary upward scrolling or explicit navigation releases it. No unsafe contraction, scroll forcing, permanent gap or pointer-suppression workaround is added. Earlier sections, inert previews, keyboard focus, reduced motion, Next presentation and all accepted timing remain unchanged.

`npm run check` passes 185 tests / 13 files, typecheck/lint/build/identity verification. The expanded real-pointer/wheel regression covers twelve repeated cycles, continuity and scrolling during delay/active motion, footer access and scroll-driven exit, dynamic last-section identity, safe cleanup and search restoration. Additional short-page/resize/keyboard checks cover white space beyond the preview content. The original 0.1.13 component fails the new retention assertion. [Rendered results](visual-review/generated/0.1.14-wheel-results.json), [desktop retention](visual-review/generated/0.1.14-retained-preview.png), [narrow retention](visual-review/generated/0.1.14-retained-preview-narrow.png), [short-page white surface](visual-review/generated/0.1.14-white-surface.png) use synthetic bookmarks only; Chromium evidence is not native Edge acceptance.

## 0.1.15 appearance checkpoint

User review of 0.1.14: the footer problem is largely resolved; final peek remains across its white surface through footer top, and hovering the footer dismisses it. This specific observation does not certify all cases. The 0.1.13 safe spacer and 0.1.14 hover code remain unchanged.

Manage → Appearance offers System (default), Light and Dark. `chrome.storage.local['ui:appearance']` is authoritative, with a typed command through the existing worker queue. Local change events update each open dashboard. The synchronous `localStorage['ui:appearance-cache']` copy is solely a first-paint aid, read by the CSP-compatible external classic `theme-init.js` before the application. Canonical storage is reconciled before React mounts; event/read races cannot restore stale values. Neither store is synchronized bookmark metadata. No permission or dependency additions.

CSS `color-scheme` pins explicit overrides; System tracks device changes natively via `light-dark()` without React rendering. This also themes native controls and scrollbars. See [MDN color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color-scheme) and [Chrome storage documentation](https://developer.chrome.com/docs/extensions/reference/api/storage). Dark/light switching changes colors only, retaining draft/query/focus/selection/scroll and valid animation state. Browser-owned confirm/prompt dialogs remain under browser/Windows control.

### Proposed palette

All values live in `src/ui/theme.css`; light catalogue colors preserve the existing palette.

| Role | Light | Dark proposal |
| --- | --- | --- |
| Sheets/page/peek/temporary area | `#fff` | `#282828` |
| Primary text/focus | `#191919` | `#f0f0ed` |
| Provenance/secondary | `#686868` | `#bdbdbd` |
| Next names 1 / 2 / later | `#111 / #666 / #767676` | `#f0f0ed / #c4c4c4 / #ababab` |
| Next prefix/provenance | `#666` | `#bdbdbd` |
| Decorative separators | `#999` | `#9b9b9b` |
| Annotations | `#515151` | `#f0f0ed`, crisp `#282828` outline |
| Favicon frame / placeholder | `#eee / #d0d0d0` | `#bdbdbd / #929292` |
| Control surface / border | `#fff / #aeb9c7` | `#303030 / #858585` |
| Control hover / panel border | `#eef3fb / #d9e0e9` | `#3b4552 / #656565` |
| Manage link and focus | `#164dab / #2563eb` | `#a6c8ff` |
| Manage metadata | `#536176` | `#bac6d7` |
| Selected control / border | `#e5edff / #4775c3` | `#334763 / #8ab4f8` |
| Tag background | `#eef2f7` | `#3b414a` |
| Warning background / text | `#fff6db / #8a4d00` | `#443b24 / #f1ce8c` |
| Error / panel background | `#852929 / #ffeded` | `#ffbdbd / #48282b` |
| Selection background / text | `#b7d5ff / #191919` | `#526b89 / #fff` |
| Footer background / text | `#000 / #fff` | `#000 / #fff` |
| Dither | `#000` | `#000` |

The original transparent 7×20 SVG is unchanged and supplies a repeating alpha mask in both themes. This makes shadow color semantic without introducing an inverted white glow. Pattern, direction, opaque covers and footer boundary remain intact; the closed light fixture is pixel-identical to the 0.1.14 stylesheet. Black against charcoal is deliberately subtle and needs Edge review.

Favicon image pixels are never inverted. Light-gray dark-mode frames make transparent black logos readable, while existing white-backed images stay white-backed. Grayscale-at-rest/color-on-item-hover/focus is preserved. Annotations retain 10px/10px typography, item-local/search visibility and out-of-flow placement. A crisp one-pixel charcoal text outline maintains readability over light frames; accepted limited frame overlap remains. No leading/spacing changes or collision machinery.

Forced colors is handled separately: UA adjustment remains enabled, system text/surface/focus colors take precedence, and sheet shadows become thin system-color boundaries. No global `forced-color-adjust: none`. Native Windows dialogs, color themes and browser-owned startup paint need manual verification. The cache covers ordinary saved overrides; if it is unavailable/stale, asynchronous canonical reconciliation can still correct the initial palette. No loading delay disguises that limit.

### Verification and review

190 tests / 14 files and full `npm run check` pass. Browser checks cover System/overrides/live changes, early authored frames, two-tab updates over a synthetic API bridge, draft/query/selection/focus/scroll/Escape preservation, running peeks, error handling, icons, narrow views, reduced motion and forced colors. A narrow Manage grid fix prevents long native select options from forcing overflow; it changes no editing semantics. Minimum sampled text contrasts are 4.54:1 light and 6.42:1 dark. These are sampled rendered colors, not a claim of complete accessibility certification.

The repeated real-pointer/wheel regression passes twelve cycles in each palette, with safe cleanup/retention intact. Isolated native Chromium sideload attempts did not register the extension, so actual extension storage/worker propagation remains an Edge check. Synthetic checks do not establish native Edge/Windows acceptance.

Comparable captures: [light closed](visual-review/generated/0.1.15-light-closed.png), [dark closed](visual-review/generated/0.1.15-dark-closed.png), [light peek](visual-review/generated/0.1.15-light-peek.png), [dark peek](visual-review/generated/0.1.15-dark-peek.png), [light open](visual-review/generated/0.1.15-light-open.png), [dark open](visual-review/generated/0.1.15-dark-open.png), [light search](visual-review/generated/0.1.15-light-search.png), [dark search](visual-review/generated/0.1.15-dark-search.png), [light Manage](visual-review/generated/0.1.15-light-manage.png), [dark Manage](visual-review/generated/0.1.15-dark-manage.png). Additional icon/error/narrow/forced-color captures and JSON reports use the same prefix. All are synthetic data. Stop for Edge review; semantic search, thumbnails, editing redesign, drag/drop and synchronization changes remain deferred.

## Visual phase acceptance — 0.1.15

On 2026-10-04 the user confirmed all requested native Edge tests passed for 0.1.15, including appearance and footer/peek behavior. The visual checkpoint is accepted. Preserve its geometry, themes and interactions during the separately authorized first catalogue editing increment. This acceptance does not constitute new cross-device synchronization evidence.

## 0.1.16 — first catalogue editor

Visual phase accepted at `ui-validated-0.1.15`; native Edge acceptance applies to that version. The separately authorized editing branch adds **Edit / Editing · Done** in editorial navigation. Active mode keeps typography/prose flow and uses dotted hover/focus title underlining. Favorite destinations are removed while selecting for editing; folders and sections continue normal navigation. No permanent item controls.

For this increment the user explicitly selected a modal instead of the earlier proposed inline editor. Theme-token surfaces, a restrained backdrop, visible 16px form labels/fields, read-only folder context and textual Save/Cancel maintain the accepted visual language. Selected Favorites receive a quiet highlight without geometry changes. Native background inertness plus explicit Tab wrapping protects keyboard interaction; title receives initial focus, and unchanged/dirty Cancel/Escape follow immediate-close/discard-choice semantics. A live draft blocks application navigation and search commands. No backdrop dismissal, move, deletion, folder editor or drag/drop.

Existing 1000ms auto-scroll, motion, summary, footer support, final-surface hover, search snapshot and themes are unchanged outside modal activity. Opening a modal cancels active peeks; safe supporting footer space may remain under the established cleanup policy. Root scrolling is locked while the dialog is open without adding a scrollbar gutter on overlay-scrollbar platforms. The form can scroll within a narrow/short viewport. Source and generated 0.1.16 captures use synthetic data; Edge editing acceptance is pending. See the current handoff for checks and scope/partial-save limits.


## Folder editing and effective tags — 0.1.17 review

Real section and nested-folder labels retain their existing open/expand action. In Edit mode a separate small **Edit** action opens the shared modal; synthetic Bookmarks sections and browser-owned/managed roots have none. The modal has Name, direct Tags, read-only parent and inherited source paths. There is no new create/move/delete UI. Source folders include path context and a local ID to distinguish identical paths; these IDs are explanatory, never synchronized identity.

Favorite annotations show folder-derived tags in bold and favorite-only direct tags in regular weight. A direct/inherited duplicate appears once, bold. Folder annotations are all bold. Nested overlays retain first-text-fragment anchoring, 10px annotation typography and no reflow; section tags occupy the header's existing bottom space. Item-local hover/focus and explanatory tag search remain the only reveal rules. Existing leading and accepted limited frame overlap are unchanged; overlap with title text is still a defect. Long lines may clip at the viewport, while editors show all sources and explain where inherited tags must be changed.

Effective `#archived` excludes nodes/subtrees consistently from browse/search/Edit/Manage, counts, previews, Next summaries and final-visible-section geometry. Manage's **Show archived** is the sole local visibility override, default off; its help reads “Include archived favorites and folders in the dashboard and search.” Shown archived nodes get a small readable **Archived** marker. The editor explains direct/inherited archive status and the impending visibility effect before Save. Equivalent inherited tags cannot be negated here. Search includes effective tags and matching folders; result counts include matching user folders as well as Favorites, not ancestry displayed only for context.

Existing modal draft/keyboard protections apply to folders and Favorites. Late failures list completed native fields and unconfirmed tag persistence, retain input and require explicit current-value review before retry. No transaction or reload recovery is promised. Manage stays available, with a consolidated identity review and deliberate export/reset setup rather than repeated folder prompts. [Setup and limits](metadata-setup.md).

No changes to light/dark geometry, 1,000ms auto-scroll delay, peek/open timing, footer safe-space cleanup, final-surface hover, shortcuts or Escape snapshot semantics were intended. Synthetic Chromium captures and regressions accompany 0.1.17; they do not establish Edge or Microsoft sync acceptance.


## Editing follow-up — 0.1.18

This section supersedes earlier title-to-edit activation, dotted edit underlines and permanent Archived indicators. Only small, contextual **Edit** buttons open a modal; ordinary Favorite links keep native navigation, and folder/section titles keep expansion. Section actions are beside the heading/provenance, at its baseline. Edit is a sibling real button. Inline expansion targets use button semantics and Enter/Space; the full section header remains a click target. A reserved ending and zero-advance sibling button keep Edit beside the last fragment without inserting characters into title text. Peek copies remain inert.

The Editing badge, prominent Done and viewport-top accent line use `#855216` in light / `#e9ba7a` in dark; forced colors uses Highlight. The exact help is “Click Edit beside a favorite or folder to make changes.” It is omitted at narrow widths. Existing navigation becomes sticky only while editing; its original flow geometry stays, and its measured height offsets sticky section headers/scroll targets. One Done control serves both resting/scrolling states. Modal background inertness includes it. Its background spans the gutters only when stuck so it does not mask the resting first-card shadow. No card tint/dashed treatment.

Tags are measured from their actual positioning parent, anchored to the first rendered title text fragment (including section names), with the same optical gap as Favorite tags. Counts, Edit, provenance and container line boxes are excluded. This corrects the double offset caused by flow-relative coordinates on relative folder wrappers. Resize, font/content changes and CSS zoom are handled without reflow or leading/header-height changes. Existing bold inheritance/source and reveal semantics remain.

Archive is presented as a checkbox for direct assignment, backed only by the synchronized archived tag. Other direct tags occupy the Tags input. Typed archived converts on blur/Save; partial typing/caret is not rewritten. Existing archived initializes the checkbox. Inherited archive remains separately explained with responsible source paths; unchecking direct status cannot negate those sources. The concise help is “Hidden from the dashboard and search unless Show archived is enabled.” Permanent catalogue/Manage Archived labels and their spacing are removed; #archived uses the existing hover/focus/search tag display. Show archived and recursive exclusion are unchanged.

Escape is consumed at keydown capture before native dialog cancellation: unchanged closes; dirty asks; Escape while asking means Continue editing. Only explicit Discard changes discards a dirty draft. The repeated native cancel path can become non-cancelable and had closed the DOM while leaving React's modal state/scroll lock intact. Real-keyboard Chromium reproductions and regressions are documented in the handoff; native Edge acceptance remains pending.

## Navigation, binding review and state visibility (0.1.19)

This supersedes earlier mutation-scope and header-only styling statements where applicable. Old mutation-root values are ignored; browse root selection remains transient. A compact, non-sticky status explains received folder tags awaiting explicit confirmation, counts straightforward versus ambiguous/competing reviews, and opens the existing consolidated Manage area. It never auto-confirms. Manage stays mounted while hidden to preserve drafts.

Section Edit buttons follow real rendered title/provenance width in normal inline flow, with a .7em gap and their own baseline/focus target. The previous negative-margin trick applied to a browse toggle but not a search label and therefore overlapped search titles. It is removed for sections. Favorite titles still navigate; expansion and editing are separate.

Tags appear on own hover, own controls' `:focus-visible` keyboard focus, or deliberate search explanations. Pointer-retained DOM focus is not a reveal condition; expanding/collapsing stores no tag reveal state and no blur workaround is used. First-fragment positioning observes structural heading size changes, too. Wrapped section headings use 33.6px structural leading to clear their 10px tags; subtracting half the extra leading from top/bottom padding preserves the single-line label's optical position and normal 85px sheet height. Main/nested catalogue leading stays calc(1em + 14px).

A reserved-width, subordinate ▸/▾ inside the existing section toggle distinguishes collapsed/peeking from fully open. It is aria-hidden and has no extra stop; aria-expanded remains authoritative. Static search headings have no chevron or invented toggle.

Both browse and Edit mode now have sticky navigation. At rest the spacious composition remains; after scrolling its padding compacts, editing help hides and Editing/Done remains. Query and search controls stay visible in their own row. Actual rendered chrome height determines section offsets; actual heading height determines item focus clearance, including zoom and wrapped labels. The compact desktop chrome plus open header measured ~96px normally and ~108px with the Editing badge. Narrow/root-heavy/zoomed layouts grow rather than clipping labels or shrinking fonts.

The chrome reserves exactly its removed padding in normal flow; it does not leave that space in the sticky painted surface. Wrapped row gaps stay unchanged. Open section headers retain their full flow extent while only the opaque sticky label surface compacts, so subsequent real header targets do not move. Collapsed sections retain 85px targets (or additional height for wrapped labels). A fixed scroll threshold with a small return hysteresis avoids geometry feedback. No smooth scrolling or content-height animation is added. Footer peek retention/space cleanup is unchanged. Regression traces caught and removed an 8px wrapped-nav gap change that otherwise recreated a stale bottom scroll target after search exit.

Explicit mouse/Alt+Number root selection uses one behavior: retain query/selection, switch root, then instant scroll to dashboard top with preventScroll focus. It never overwrites the original pre-search snapshot. Escape restores that snapshot and its scroll; incidental data/theme updates do not reset it. At a document bottom that no longer has temporary peek space, normal browser clamping remains possible, but later hover must not resume an old target.

## Binding review and continuous sticky geometry — 0.1.20

This supersedes 0.1.19's archive-filtered review and scroll-threshold compaction. A compact persistent “Folder tags need review (N) — Review” notice lives with navigation, including for archived/missing candidates. It opens an accessible binding dialog; folder Edit uses the same dialog when identity prevents saving. Proposed tags/archive state remain read-only and explicitly unconfirmed. Manage embeds the same review, with conservative disabled ambiguous/missing associations. It never interrupts an open draft automatically. A dirty editor losing resolution retains its input, blocks saving, and requires explicit refreshed-state review after confirmation.

Navigation uses a stable control row with 31px introductory whitespace and a separate 31px resting space below. Native sticky positioning consumes the introductory whitespace naturally; JavaScript only observes sizes. There is no scroll threshold, height-state change, compensating scroll or dynamic reservation. Editing/Done stays in the row; the longer help scrolls away above it. The open heading is likewise a stable 50px minimum row surrounded by 14px introductory / 21px trailing whitespace, preserving the ordinary 85px single-line sheet height. Native sticky placement brings that row directly beneath the measured navigation. Wrapped controls/labels grow normally. Desktop combined rows measure about 96.4px in browse and Edit without a notice; search/review and narrow layouts need their actual extra height.

Chevrons occupy a 12px footprint in the left gutter, leaving title, provenance and Edit aligned to catalogue/navigation text. Title tags stay anchored to actual text. Collapsed sheet hit areas remain 85px, with existing peek timers, full-open reveal, transparent dither and final-section/footer lifecycle unchanged. See 0.1.20 generated captures and frame traces for isolated Chromium evidence; native Edge acceptance is pending.

## Creation and moving — 0.1.21

0.1.20 is accepted by the user after all requested native Edge checks. Edit mode now offers a quiet navigation **Add** menu and **More** beside real item labels. More provides New favorite/New folder for folder context and Move for real items. Synthetic loose-item sections only offer Add into their actual root; synthetic groups are never metadata entities. Existing explicit Edit controls, native favorite navigation and folder expansion are unchanged.

Creation uses the accepted modal language: title/name, URL for favorites, direct tags, direct archive checkbox, and destination. Contextual Add selects the actual folder; global Add selects an actual scoped root. All bookmarks requires a deliberate destination. Writable destination paths include local IDs to distinguish duplicates. Show archived controls the list, and the form explains how to access hidden destinations through Manage. Inherited destination tags are read-only; inherited archive effects are explained. Cancel before Create changes nothing. Dirty Escape opens confirmation; a second Escape continues with the draft intact. Partial success retains submitted input and retries the same native item's metadata, never another Add. The current root/query stay unchanged; a visible new item is revealed/focused, otherwise success/location is announced with a visible focus fallback.

**Move…** is the keyboard mechanism and the only moving UI inside search results. It shows source context, destination and end/before/after placement. It uses the same native order and safeguards as dragging. It does not alter the query or original Escape snapshot. Moving recomputes inherited tags and archive effects; disappearing from view is a successful move, not a failure.

Small explicit six-dot handles are present only for real movable items in Edit browsing. They use pointer capture with a 6px movement threshold; keyboard activation opens Move. Pointer drags cannot start from titles, selected text or Edit controls. Native/external drops are suppressed; Ctrl/Meta/Alt copying intent is rejected. Into-folder feedback outlines the rendered title line; before/after uses a caret/rule and a textual intent. Wrapped inline fragments on one line are combined so the title ending/favicon/semicolon stay together. Invalid/no-op targets have a dashed cue and explanatory status. Cues never change layout and remain pointer-transparent.

During dragging ordinary peek and preview scrolling pause. A valid inside-folder hover opens after 650ms; this temporary view is restored at completion/cancellation without overwriting normal search restoration. Edge scrolling has one cancellable requestAnimationFrame loop, a 55px edge zone below measured sticky navigation / above viewport bottom, capped at 0.45px/ms. No independent native HTML drag auto-scroll is used: rendered testing found native scrolling could outlive the app gesture. Escape, pointer cancellation, outside/invalid release, window blur, hidden document, disabled Edit/search/modal state and unmount clean up capture, timers, cues and scrolling. Footer-safe retained whitespace remains governed by the existing lifecycle, not force-contracted.

Presentation remains proposed for 0.1.21 native Edge review. More/handle may wrap together on narrow prose lines; the original title and favicon wrapping is unchanged. Long drag descriptions wrap inside a bounded overlay. No new permissions, thumbnails, copying, deletion UI, bulk operations or synchronization schema.

## Navigation, modal actions, title dragging and deletion — 0.1.22

The user accepted the complete requested 0.1.21 checklist. This section supersedes its Add/handle-only/After-position presentation. Navigation now uses 12px labels with 32px minimum targets, measured full-root tabs or a full-name current-root selector; <=480px deliberately uses two rows. Root typography stays uppercase; action and popover typography does not. New favorite/New folder are consistent, Manage is absent in Edit, and direct binding Review remains discoverable. Stable chrome geometry is retained: 48px navigation plus 50px open heading in ordinary desktop browse/Edit. Native selector widgets keep keyboard popup semantics and full root order.

Authored dialogs share labeled forms, single-line URL inputs, help/errors and one separated action footer. Cancel sits left as a real link-styled button, alternatives before the right-aligned primary; Delete/Discard are destructive. Focused controls retain normal Enter behavior. Other Enter submission activates the enabled affirmative action, excluding IME. Escape first closes child popups; dirty Escape never discards. Existing opaque multiline bookmarklet data is not normalized on unrelated saves, and multiline executable paste is rejected with guidance rather than flattened. Browser-native warning dialogs remain native.

In Edit browsing a full real title is a pointer drag surface; the glyph is an inert indicator, absent from Tab order. Selection/native URL dragging are suppressed only for these internal title gestures. A plain click still navigates/toggles, and drag completion/cancellation cannot replay that click. Edit/More controls are excluded. Canonical Before-next/End targets use full native ordering: Before is at the first title fragment, End after the entire item's favicon/punctuation/actions (or the section's boundary). No-op markers vanish, inside-folder targets remain separate. Keyboard Move starts with Start/End and then Before options; redundant first-sibling/no-op positions are not alternate active choices. Search remains Move-dialog-only.

Delete confirmation describes a single native subtree, includes hidden descendants in counts and emphasizes deletion versus archiving. Cancel has initial focus. Changes require explicit refreshed-summary review. Partial outcomes are reported accurately with metadata reconciliation and no Undo/rollback promise. Both themes use existing semantic control/error colors. Review evidence remains Chromium-only until the user accepts the targeted Edge checks.

## 0.1.23 editing/drag clarification

Favorite titles retain real href/native context menus, but primary click/Enter opens their editor in Edit mode; deliberate modifier/middle-click navigation remains. This supersedes the explicit-Edit-only Favorite activation rule. Folder/section titles still expand; Edit controls remain. Help: “Click a favorite to edit it, or use Edit beside a folder. Drag titles to move.” A threshold-crossed drag suppresses subsequent pointer click activation.

Pointer-transparent compact “Moving …” feedback begins at threshold and stays visible without a valid target; source-only highlighting leaves item geometry unchanged. Valid/invalid/no-target wording is independent of color. Section Before/End positions use gutter-aligned horizontal lines; inline item positions use carets; inside-folder feedback is separate. Target text identifies receiving parent/root. Cleanup, hover expansion, edge scrolling, canonical positions and hidden native sibling semantics are unchanged.

Unresolved metadata is a diagnostic status, never a user tag. Catalogue/editor/worker share per-native-ID health. The modal exposes ID and read-only matching details, disables unsafe input/Save and retains interrupted drafts. A resolved initially blocked form must reopen before editing its confirmed direct tags. Both themes and native keyboard/context-menu behavior remain subject to the targeted Edge review; 0.1.22 is not declared accepted.


## 0.1.24 — capabilities and source highlighting

[Workspace policy](workspace-capabilities.md) separates native permissions from extension tags. Unknown browser domains remain discoverable; native actions/destinations/drag sources are restricted, and metadata-only editors explicitly mark protected fields read-only. Their explanatory menu uses ordinary UI typography. No name-based Workspace classification or inactive-content filtering.

Editor highlight is explicit native-item ID state. Favorites and nested folders keep their existing selected treatment; real section titles now use the same theme selection color and cloned inline background. Provenance, chevron and controls are excluded. Save/Cancel/discard clear the state, nested confirmation and failed saves retain it, and source removal removes its rendered indication. No auto-scroll or expansion to reveal a source. Synthetic groups cannot acquire drag or editor state from undefined-ID equality; their keyboard focus styling remains intact.

User reports the other 0.1.23 checks passed; historical native-title-change causation is still unresolved. Native Workspace acceptance remains pending. Evidence and manual checks: [0.1.24 review](visual-review/generated/0.1.24-review.md).

## 0.1.25 — useful Workspace contents, protected containers

The accepted immediate-child policy replaces 0.1.24's blanket native restriction beneath the identified Workspaces root. Containers retain metadata-only editors and New favorite/New folder actions for their contents; root-scoped New is absent. Ordinary descendants regain native editing, deletion and within-container moving with existing identity safeguards. No presumed active-container filter is added.

Direct loose favorites beneath Workspaces and their synthetic group are omitted from browsing (also in All bookmarks). They remain searchable with a visible full path and inspectable in Manage with an explanation that they are outside displayed containers. This is not an archive or search exclusion. Binding review remains complete. No synthetic group, native entry or metadata is rewritten.

Cross-boundary move destinations are temporarily unavailable with an explanation. A native move that leaves order unchanged or has an unexpected result now remains an error in the dialog and refreshes observed state, without automatic retry. Container read-only naming, tags/archive, source highlighting, section geometry, search restoration and footer lifecycle remain unchanged. [0.1.25 captures and checks](visual-review/generated/0.1.25-review.md) are Chromium evidence, pending Edge acceptance.

## Indexfold 0.1.26

Current product name: **Indexfold**. Tagline: **Your bookmarks, beautifully within reach.** Description: **A typography-first bookmark dashboard with instant search and keyboard navigation. Built for Chrome and Edge.** Catalogue footer displays **Indexfold.**, retaining FRE3/GitHub URLs, `source=bcbb`, new-tab attributes and geometry. Native root names remain untouched. This supersedes previous display branding only; old captures/records remain historical.

Manage presents Settings / Bookmarks / Diagnostics with a shared introduction and Back to dashboard action. Panels retain drafts and list state while hidden. Pending folder reviews remain visible and exempt from archive filtering. Diagnostics contains version/browser/health/event evidence, private-data export/copy and separated advanced recovery. Ordinary editors show native IDs under optional Diagnostic details. Protected names have a small Read-only label, subdued selectable surface and dashed boundary; tags/archive stay editable. Initial focus goes to the first editable field. Disabled controls are separately styled, with forced-colors semantics retained.

Menu rows highlight hover and keyboard focus in both themes; text wraps within viewport bounds. Workspace-container menus offer creation within the container and omit Move/Delete, drag glyph and lifecycle prose. Ordinary subtrees/bookmarks can move between containers using the existing verified native path. Workspace ↔ ordinary-root movement remains restricted. No theme/typography/peek/footer geometry changes accompany branding.

## Indexfold 0.1.27 — Manage dismissal

Opening Manage's bookmark editor captures the baseline without marking a draft dirty. Cancel/Escape compare native title, URL and destination plus normalized direct tags; unchanged and reverted forms close immediately, while real edits still use the existing discard confirmation. A declined confirmation retains input. The opening comparison state and worker conflict token are independent of background updates and failed/partial saves. No automatic URL rewriting or archive state is introduced. Manage's folder rename prompt and the separate catalogue bookmark/folder modals keep their existing behavior; modal archive checkbox round-trips remain clean.

Settings/Bookmarks/Diagnostics and Back to dashboard remain non-destructive navigation: forms survive rather than being discarded. Only actual changes show the retained-draft notice. Escape observes native child-popup semantics and does not propagate to background catalogue/search handlers; focus returns to the opening control on dismissal.
