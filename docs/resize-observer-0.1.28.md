# ResizeObserver investigation — 0.1.28

## Evidence and established cause

Opened and visually inspected the supplied `docs/visual-review/0.1.27_ext-error.png`. Edge reports `ResizeObserver loop completed with undelivered notifications.` from its New Tab page, without a useful application stack. The screenshot alone does not identify a callback.

Reproduced that exact **window ErrorEvent** against the accepted 0.1.27 source in the isolated App/service Chromium fixture using real pointer hover and wheel input. One instrumented run produced 13 warnings: five during an ordinary peek and eight during exit/final-section wheel/peek transitions. Startup, the tested window widths, section/folder opening, theme switching and Manage transitions did not emit warnings in that run. No live bookmarks or metadata were accessed.

Tracing before/after geometry across all observed elements established two paths:

1. `usePeekCoverage` observes the animated `.section-content`. During resize delivery it changes its sibling `.peek-successor` height, also observed by `usePeekFooter`. Example: the cover changes from 65px to 123.46875px in the callback while the content is 26.53125px high.
2. `usePeekFooter` reacts to the animated body/cover and writes spacer height. This resizes the catalogue and spacer observed by `usePeekHoverRetention` at shallower depths. Example: the catalogue grows from 1758px to 1784.53125px as the spacer changes from 0 to 26.53125px.

These dependencies produce notifications that cannot all be delivered in that rendering pass. The browser's warning does not itself prove an infinite JavaScript loop: the [ResizeObserver processing model](https://drafts.csswg.org/resize-observer/#deliver-resize-loop-error) sends a window error when observations are skipped by its depth-limited delivery algorithm. In this reproduction the writes repeat with the reveal animation. They are application geometry feedback, not an error to filter out.

## Complete observer audit

| Owner | Callback effects and observed dependencies | Decision |
| --- | --- | --- |
| `usePeekCoverage` | Writes cover height/summary label height; updates covered IDs only when changed. Its output is observed by the footer hook. | Coalesced frame task, before footer; guard unchanged height/style writes. |
| `usePeekFooter` | Writes spacer; changes ancestor catalogue bounds watched by retention. Reobserved all targets after every descendant child mutation. | Dependent frame task; retain unchanged observation targets, observe/unobserve only actual additions/removals. Keep safe viewport-supporting retention. |
| `usePeekHoverRetention` | Reads header/footer bounds, may end a hover session and start exit geometry. Observes catalogue, stack, spacer, footer and active slot. | Retained, including stationary-pointer scroll checks; no reproduced warning after producer correction. |
| `usePeekScroll` | Reads flow/viewport size, clamps offset and paints a transform; schedules at most one scroll frame. Transform does not change the observed layout boxes. | Retained. Verify active scrolling does not sustain resize measurements. |
| `useCatalogueChrome` | Writes sticky/scroll-offset variables from stable navigation/header dimensions; these do not change those dimensions. | Retained. Startup, responsive layout, theme and editor/Manage checks. |
| `useCatalogueAnnotations` | Positions absolute tags from the first text fragment; does not change observed flow/header size. Font-ready callback is guarded after cleanup. | Retained; existing tag/focus regressions. |
| `RootNavigation` | Changes tab/selector mode only when intrinsic tab width exceeds available width; keeps tabs measurable when compact. | Retained; repeated width changes settle. No reproduced warning from this path. |
| `PeekSummary` | Fits absolute summary content to measured width, compares parts before state updates. Does not grow the measured cover. | Retained; summary mutations no longer restart all footer observations. |

## Correction and lifecycle

`layout-task.ts` coalesces invalidations in one pending animation frame, with coverage before the dependent footer reservation. Notifications read current geometry when the task runs; obsolete measurements are not replayed. A disposed task cannot run or schedule again, including if cleanup occurs during a frame batch. The last cancellation cancels the browser callback. All observers, font/scroll listeners and scheduled work are cleaned up with their owning effect.

Initial layout is still measured immediately. Reveal-phase changes arm the first coverage frame. While a real CSS body-height transition is running, coverage/footer tasks sample each frame; they stop when that transition finishes (or is cancelled/removed). This bounded sampling is necessary: simply deferring resize delivery left the first exit cover or first growing final preview one frame behind. The committed regression checks those transition boundaries, not only endpoint geometry. Reduced motion needs no transition loop. There is no permanent frame polling and no change to animation durations, auto-scroll delay/speed, clipping, tag layout, pointer targets or footer retention rules.

No global error listener/filter is installed in production, and necessary observation targets remain observed. Only test instrumentation captures window errors; it does not prevent or suppress them. No metadata, native bookmark, synchronization, permission or identity changes.

## Verification and native review

The committed regression fails on `editing-validated-0.1.27` with five peek-entry window errors and passes on 0.1.28 with zero errors in all three configurations. Settled states have no pending frames or continuing measurement/style writes. [Before/after measurements](visual-review/generated/0.1.28-observer-results.json) and the current [handoff](development-state.md) retain the results. `npm run check` passed 261 tests in 25 files plus typecheck, lint and build. Existing editing, archive and navigation follow-up regressions also passed. `check-resize-observer.mjs` captures window errors and verifies stable geometry/callback/style-write counts after workflows settle. It covers fresh load/reload, fonts, section/folder opening, animated entry/exit, full final previews, wheel/leave/upward cleanup, resizing, themes, Manage/editor transitions, search restoration and active auto-scroll, with narrow/dark and reduced-motion variants. `check-peek-scroll.mjs` also captures window errors during the existing repeated wheel/pointer lifecycle regression.

Chromium evidence is not native Edge acceptance. In Edge, reload the committed 0.1.28 artifact, clear the *old extension error list* (not storage/metadata), then:

1. Open fresh tabs; resize narrow/wide and switch themes. Check no new ResizeObserver entry appears.
2. Open a section/subfolder; traverse header peeks, including quick entry/exit. Check tags, summaries, dither coverage and pointer targets.
3. Peek the final section, wait for auto-scroll, wheel down to the footer, leave/re-enter, then wheel upward. Repeat without reload; no jitter, clipped preview or retained work after exit.
4. Enter/leave Manage and bookmark/folder editors, including Cancel/Escape; briefly search and restore browsing. Recheck the extension error list. Reduced-motion previews should remain static.

If a different warning remains, report its workflow, viewport/zoom, theme and motion preference before assuming it has the same producer. The historical title-change investigation remains closed.
