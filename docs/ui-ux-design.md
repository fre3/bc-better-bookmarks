# Typographic catalogue — browsing/search checkpoint

Status: **0.1.6 leading/peek-boundary correction**, awaiting Edge visual review. The user accepted the overall 0.1.5 styling and peek-animation timing. The user manually reviewed 0.1.2 using real bookmarks, screenshots, keyboard testing and a recording; search, roots, scope handling, runtime stability and most keyboard behavior were reported working well. No new Edit mode, inline CRUD redesign, drag/drop, or folder-tag persistence. The validated 0.1.1 baseline remains at `1217369dd10638942d80107d5f33d7f61491d075` on `master`, `archive/mvp-validated-0.1.1`, and annotated tag `mvp-validated-0.1.1`.

## Implemented presentation

- White typographic catalogue; Georgia / Times fallback, `clamp(42px, 3.3vw, 69px)`, tracking `-.01em`, line height `calc(1em + 14px)` at both main and nested sizes. Navigation uses regular 16px Helvetica / Arial, uppercase presentation and `.15em` tracking; the active root remains underlined. Section names use bold 17.6px Helvetica / Arial, with regular-weight gray provenance. No downloaded fonts or runtime dependencies added.
- Ordinary bookmarks remain inline prose: `Bookmark title [framed favicon];` followed by normal whitespace. Images are `.8em` high with automatic width/aspect ratio; `.1em` frame padding makes the outer height approximately `1em`. Frames use `#eee`, `vertical-align: -.01em` and `.12em` right margin before the semicolon. Failed/absent icons use a dimensionally equivalent `.8em` placeholder. Native links underline and icons become color on own hover/focus. The final word is an inline block bounded by the available width; oversized words can wrap. Its final grapheme (including combined emoji) stays with the icon/semicolon, preventing detached punctuation. The rest of the title wraps normally. This is purely presentation; native URLs and bookmarklet non-navigation/safety behavior remain unchanged.
- Textual folders use bold italic titles ending in `/`, a normal 16px direct-child item count, and `.2em` count spacing. Counts include direct subfolders and bookmarks, not a recursive total.
- Browse expansion is a single ordered ancestor path: opening a sibling replaces the old sibling and all its descendants; collapsing an open folder truncates the path there. Required ancestors remain open. Search continues to show all matching ancestry as context without changing the stored browse path. Expanded children begin inline wherever they fit and stay at exactly 85% of the main catalogue size at every depth. Inline margins provide `.6em` separation; cloned inline padding gives continuation fragments a subtle hanging inset. Its visual quality needs Edge review.
- `EXPANSION_END` in `src/ui/Catalogue.tsx` selects `'inline'` (current) or `'break'`. The latter adds a break after expanded folders directly inside a section. Nested expansions remain inline. For a temporary visual comparison, change the catalogue element's `data-expansion-end` attribute in DevTools without modifying source.
- All bookmark annotations are hidden in resting browse state. The HTTP text seen in the 0.1.3 Edge screenshot came from derived URL-status labels in a separate always-visible `essential-info` path, not bookmark tags. That path now uses `status-annotation` and the same item-local reveal rules. Only the bookmark’s own hover/focus reveals its tags, status, unsafe-link instructions and ambiguity notice. Search automatically reveals relevant tag explanations without exposing unrelated status labels. Annotations are absolute, single-line, 10px/10px sans, 2px below the item box; the existing annotation size is unchanged in this checkpoint. No wrapping or layout reflow; long annotations clip at the viewport without a horizontal page scrollbar. Non-navigating bookmarklets retain their keyboard focus and associated safety explanation.
- **Accepted annotation limitation:** limited overlap with a following-line favicon/frame is allowed. The absolute annotation paints above the frame and must remain readable, avoid actual bookmark text and cause no reflow. No further global-leading increase, font shrinking or collision-avoidance machinery is introduced to eliminate this accepted overlap.
- Folder-tag styling remains part of the intended design: the same hidden/hover/focus overlay, aligned to the folder title rather than its count. **Folder tags are deferred** because the validated metadata model supports only bookmark tags. This checkpoint adds no storage for them.

## Cards and interaction

- Each first-level folder becomes a full-bleed white sheet. The outer stack cancels the main gutter using negative margins, not `100vw`; inner wrappers restore the gutter for labels and catalogue text. Navigation remains guttered. Headers have an 85px minimum height, growing naturally when labels wrap. Shared heading styles apply to closed, peek, open and inert copied labels. Measured desktop labels span 27.5–49.48px, leaving 15.52px before the following shadow box. Heading hover has no underline; keyboard focus retains its outline. Header-only hover or keyboard focus exposes **2.5 fluid catalogue line boxes**. The reveal body is absolutely positioned and adds no document height; the actual header stays in flow so wrapped labels reserve the right height.
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

In the intended Windows Edge profile, open `edge://extensions`. For an existing extension whose loaded path is this WSL `dist/`, click **Reload**, then open a fresh New Tab. If the existing extension points to a Windows clone, use **Load unpacked** with the Windows path printed above; verify that the extension's Details now show that path and version **0.1.6** before testing. Do not remove/uninstall the existing extension merely to change paths; uninstalling can discard profile-local metadata. If Edge does not permit switching the loaded path, stop and report that loading issue rather than resetting the profile. Expected ID: `nfhbegeoeafnpejpjdljhgagefbpafal`.

Privileged New Tab/extension pages are for user-controlled Edge review. No automated Edge visual or Microsoft sync validation is claimed.

## Focused Edge review checklist (0.1.6)

1. **Leading and annotations:** inspect main and nested text with the new `1em + 14px` leading. Nothing shows at rest; hover/focus or explanatory search reveals annotations without movement. Limited overlap with frames is accepted, with annotations above them; obscured bookmark text is not.
2. **Peek boundary:** reproduce the former strip beneath the copied following-sheet label. No covered label/text fragments should remain before the next intact dither. Repeat during entry/exit, with long wrapped headings, narrow windows and native Edge zoom at 80/100/125/150/200%.
3. **Interaction/motion:** peek timing should feel unchanged. Move down headers, reverse, click mid-transition and switch away from a long open section. Check the softer 220ms full-open reveal, immediate context placement, sticky headers, keyboard/Escape and instantaneous reduced motion. Visual copies remain noninteractive.

No auto-scrolling, website thumbnails, Edit mode, drag/drop, sync work or new permissions. Stop for user review before another refinement.

## Reference inspection and rendered evidence

These exact images were opened and visually inspected before source changes (the spelling `collission` is from the supplied filenames):

- `docs/visual-review/top-section-with-shadow.png`
- `docs/visual-review/release 0.1.5 - annotation collission-9px.png`
- `docs/visual-review/release 0.1.5 - annotation collission-12px.png`
- `docs/visual-review/release 0.1.5 - annotation collission-14px.png`
- `docs/visual-review/release 0.1.5 - annotation collission-14px-favicon.png`
- `docs/visual-review/release 0.1.5 - peek bottom artefact.png`

The latest styling reference is now available; the former missing-reference limitation is resolved. The state mockups continue to supply composition guidance. All supplied review media remain untouched and untracked.

`npm run check` passes typecheck, lint, **138 tests across 8 files**, build/version checks and extension identity verification. Focused Chromium suites retain root/search, icon/fallback and wrapping checks and exercise the changed geometry and motion. No page errors were reported. The new coverage check observes animation frames after the application’s ResizeObserver in the same pre-paint cycle, avoiding intermediate style reads before coverage is updated. Annotation no-reflow comparison waits for fixture icons to decode, separating image loading from annotation reveal.

| Measurement at 1406px | Result |
| --- | --- |
| Main font / leading | 46.398px / 60.398px |
| Nested font / leading | 39.438px / 53.438px; fixed 85% scale |
| Peek body | 150.98px = 2.5 declared main line boxes |
| Copied sheet coverage | Ends exactly at the next intact shadow start; width remains full-bleed |
| Annotations at rest / own hover or focus | 0 / 1; search tag explanations retained |
| Annotation/frame intersection | 1 in nested fixture, above the frame; accepted limitation |
| Annotation/text-ink intersection | 0 in sampled main/nested/long-title cases using local font metrics |
| Annotation-induced movement | 0; settled item rectangles and stack height unchanged |
| Full-open reveal | 220ms, opacity/transform only; full document layout already applied |
| Reduced motion | 0s transition; open animation disabled |

Coverage samples span **111 frames** across desktop, 320/390px narrow layouts and 80/100/125/150/200% zoom-equivalent layouts: zero boundary gap, zero partially exposed underlying labels, opaque surfaces throughout. Zoom uses corresponding CSS viewport dimensions and device scale factors; it is not a native Edge zoom test. Native Windows fonts, browser zoom and final visual acceptance remain for user review. Frame overlap is accepted, not a failed check or a claim that all overlap has been eliminated.

Captures: [corrected peek boundary](visual-review/generated/0.1.6-peek-boundary.png), [narrow peek](visual-review/generated/0.1.6-peek-narrow.png), [annotation above frame](visual-review/generated/0.1.6-annotation.png), [open catalogue](visual-review/generated/0.1.6-open.png), [measurements](visual-review/generated/0.1.6-measurements.json). They contain synthetic bookmarks and a local public Wikipedia favicon, not private Favorites or privileged Edge pages. Final captures were visually inspected.

Temporary rerun commands, while `/tmp` files remain available:

```sh
cd /home/dev/projects/bc-better-bookmarks
node /tmp/bb-catalogue-browser-check/build-016.mjs
PLAYWRIGHT_BROWSERS_PATH=/tmp/bb-catalogue-browsers node /tmp/bb-catalogue-browser-check/refinement-016.mjs
PLAYWRIGHT_BROWSERS_PATH=/tmp/bb-catalogue-browsers node /tmp/bb-catalogue-browser-check/coverage-016.mjs
```

Chromium must run outside the agent process sandbox. No project dependency was added. The installed Edge favicon API and Microsoft sync are not exercised by these fixtures.

## Deferred imagery direction

Locally cached website thumbnails may later take precedence over favicons. Actual website thumbnails should initially have **no light-gray backing or frame padding**; favicons/placeholders retain the framed treatment. Capture, permissions, caching/storage and fallback policy require a separate implementation decision. This checkpoint adds no thumbnail infrastructure or permissions. Delayed automatic preview scrolling, Edit mode and drag/drop also remain deferred.

## Files changed in this checkpoint

- UI: `src/ui/SectionCard.tsx`, `style.css`, new `usePeekCoverage.ts` for active-preview geometry only.
- Version/artifact: package/lockfile root versions, source/generated manifests, `dist/index.html`, `dist/index.js` and replacement hashed CSS. Existing tests retained; meaningful new checks are rendered geometry/interaction checks, not assertions of CSS constants.
- Documentation: this design/checklist, current handoff, README/roadmap version references and synthetic captures/measurements.
- No dependency, permission, manifest-key, SVG, worker, browser-adapter, core/search, metadata or persistence changes.
