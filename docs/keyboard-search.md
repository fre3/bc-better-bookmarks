# Dashboard search and preview controls — 0.1.15 Edge checkpoint

The browser-scoped command is `open-dashboard-search`, described as **Open dashboard in search mode**, with **Ctrl+Shift+B suggested on Windows**. It is not an OS-global shortcut. The user confirmed this default; Ctrl+B is only an optional user reassignment. Alt+Shift+F is not used.

## Assignment and use

Open `edge://extensions/shortcuts`, find Better Bookmarks, and inspect the actual assignment. Suggestions can conflict with browser/extension shortcuts; do not assume Ctrl+Shift+B was assigned. Set or change it there if desired. Removing it is respected: the extension never writes or restores assignments.

**Manage → Dashboard search shortcut** displays the actual value returned by `chrome.commands.getAll()`, including “unassigned”, and provides a shortcut-settings action. It refreshes when Manage opens or regains focus. In the extension worker console, the same read-only check is:

```js
await chrome.commands.getAll()
```

Normal `Ctrl+T` continues to leave focus in Edge's address bar. The user-confirmed fallback remains **Ctrl+T → Ctrl+F6 → type**. If the command prepares search but typing stays in browser chrome, use **Ctrl+F6**, then type. No simulated keystrokes or delay-based focus loops are implemented.

Reload the existing WSL `dist/` extension at `edge://extensions`, retain the existing `tabs` permission (none added in 0.1.9), verify **0.1.15**, and open a fresh New Tab. The artifact is already built:

```text
\\wsl.localhost\Ubuntu-24.04\home\dev\projects\bc-better-bookmarks\dist
```

No push was made; a remote Windows clone will not receive this checkpoint by pulling yet. Do not rebuild in Windows or uninstall the extension to change its loaded path.

## Routing, state and safeguards

- Prefer the current dashboard; otherwise reuse one in the invoking window, in browser tab order. Create an active `search.html` tab in that same window only when no identifiable dashboard exists there. The website tab is not navigated or closed. Other windows' dashboards are not selected.
- A serialized UI routing queue coalesces overlapping invocations. A session-only request keyed by tab ID survives service-worker suspension. The page registers its listener before announcing readiness; snapshot loading returns “not ready” until the catalogue mounts. Accepted/blocked requests are removed, so readiness notifications do not repeatedly steal focus.
- Leaving the target tab/window, closing it or navigating away cancels pending focus work. Readiness does not reactivate a tab the user left. The browser adapter validates own extension pages and sender identity. No website content script is involved.
- The originating tab is captured before activation. Commands from another tab temporarily select **All bookmarks**. Dashboard-origin commands, typing, `/` and Search retain the current scope. An existing query is selected for replacement. A single pre-search snapshot restores the original root, section, expanded branch and scroll/focus on Escape; repeated commands or root changes do not replace it. A new dashboard starts at All bookmarks with empty search.
- When browser chrome has focus, an explicit renderer navigation to `search.html?launch=<random token>` is attempted. Before navigation, a one-shot **tab-local sessionStorage handoff** preserves catalogue state, query and Escape's scroll/focus target. This is transient UI state, not bookmark/metadata persistence or sync. It is consumed once after the new page's snapshot is ready. A page already focused can use the existing input without navigation. Ordinary New Tab never initiates this route.
- **Manage or an active save blocks the command**, showing a notice. It does not unmount Manage, discard a draft, navigate away, bypass mutation guards, or queue a surprise focus change after editing. Finish editing, return to the catalogue and invoke again.
- If the transient handoff cannot be stored, navigation is refused and a Ctrl+F6 fallback message appears; existing catalogue state is retained.

`document.hasFocus()` is used only to decide whether to attempt the explicit route; neither it nor `activeElement` is treated as evidence that native keyboard focus transferred. Query selection and DOM focus alone are insufficient verification.

## Permissions and API evidence

The permission added in 0.1.8 was **`tabs`**; 0.1.9 adds none. It permits inspection of `url`/`pendingUrl` to identify explicit dashboard tabs before their renderer is ready or after discard, avoiding duplicate creation. Discovery is limited to the invoking window. `runtime.getContexts` identifies our live New Tab behind Edge's virtual New Tab URL; an unrelated New Tab provider is not assumed to be ours. A discarded virtual New Tab without an identifiable live context cannot safely be distinguished from another provider; an explicit `search.html` tab remains identifiable by URL.

The permission also grants access to tab titles/favicon URLs at browser level, but the router does not store website URLs/titles, inspect website contents or inject scripts. No `activeTab`, host, scripting, history, webNavigation or global-shortcut permissions were added. Existing manifest key/extension identity are unchanged. Metadata writes remain in the existing worker service queue; the UI routing queue only owns transient launch requests in session storage.

Primary references: [Commands API](https://developer.chrome.com/docs/extensions/reference/api/commands) describes suggested assignments, `getAll`, conflicts and browser/global scope; [Tabs API permissions](https://developer.chrome.com/docs/extensions/reference/api/tabs#permissions) distinguishes URL access from basic tab activation/creation; [Runtime contexts](https://developer.chrome.com/docs/extensions/reference/api/runtime#method-getContexts) provides own extension context discovery. Microsoft lists [supported Edge APIs](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/api-support). These documents establish API support, not successful native Edge focus transfer.

Chromium's [tab-update implementation](https://chromium.googlesource.com/chromium/src/+/4848e47a0e2bcfd75994cc21b8b31ea457a1395c/chrome/browser/extensions/api/tabs/tabs_api.cc) skips activation for an already active tab and marks API navigation to retain omnibox focus. Local probes also found that `window.focus()`/input focus and same-document hash/history changes did not reliably move native typing out of browser chrome. The implementation therefore uses renderer navigation with a state handoff when needed, not a `tabs.update(url)` or synthetic Ctrl+F6 workaround.

## Accepted baseline and current verification

The user validated **0.1.8 main Ctrl+Shift+B workflows and shortcut configurability in Edge**. The existing limitation from an already-open dashboard's address bar is accepted: search may open/select its query while actual typing remains in the address bar. **Ctrl+F6** transfers focus when needed. This limitation was not reinvestigated in 0.1.9; ordinary Ctrl+T is unchanged. No new permission is required.

0.1.15 passes `npm run check`: typecheck, lint, 190 tests across 14 files, build/version verification and unchanged extension identity. Unit coverage includes command origin before activation, loading/cold readiness, coalescing, original Escape restoration and root shortcut exclusions, plus scroll/preference behavior. Synthetic DOM checks exercise query/focus/selection, scroll/branch restoration and modifier exclusions. These alone do not establish native shortcut behavior.

An isolated WSL Chromium profile additionally used **native X11 input with German XKB layout**: external command switched to All bookmarks; Alt+1/2 retained input selection; AltGr+2 typed `²`; Ctrl+Arrow retained word editing; Escape restored the original root/branch. Local setting reload and Manage draft protection passed without preference sync writes. The temporary copy used Linux Ctrl+Shift+Y only; the shipped command continues suggesting Windows Ctrl+Shift+B. The user subsequently accepted temporary All bookmarks/Escape restoration, top-row Alt+1–9, the 1000ms delay, Windows Alt+numpad character entry and the address-bar limitation. The actual shortcut assignment remains user-controlled.

Earlier 0.1.8 isolated Chromium evidence (fresh launch typing, cold worker, repeated invocation, website preservation) remains in `visual-review/generated/0.1.8-command-results.json`; it is not a new test claim. Current reports are `visual-review/generated/0.1.9-*`. No completed manual sync tests were reopened.

## Local root shortcuts and preview preference

The user accepts top-number-row Alt+1–9 and Windows Alt+numpad character entry as platform behavior. No numpad symbol filtering/suppression is applied. The accepted delay is now **1000ms**; temporary All bookmarks/Escape restoration and the address-bar/Ctrl+F6 limitation are also accepted.

**Alt+1** selects All bookmarks; **Alt+2** selects the first actual displayed root, continuing through **Alt+9** when available. Hover a root for its shortcut; accessible descriptions expose it too. Search keeps its query, focus and caret/selection. Missing numbers do nothing. Ctrl/Meta/Shift/AltGr/composition, Manage, other editable controls and dialogs are excluded. Plain numbers still search, and browser navigation/text-editing shortcuts remain available.

**Manage → Auto-scroll peek previews** is local to this device, defaults on when unset, and can be disabled independently. Mouse hover shows the normal static preview immediately, then waits **1 second** before scrolling overflowing content at **one computed line every 2.75 seconds**. It stops at the end. The final displayed section retains mouse hover across its header and white preview surface to the footer; crossing that internal boundary does not restart the delay. Earlier sections retain hover only on their headers. Leaving the applicable hover area, switching, opening, search/root changes, disabling, page hiding or reduced motion cancel/reset. Keyboard-only previews remain static. A hidden-page return needs a fresh hover, so background time causes no jump. The sheet edge and real header targets never scroll; existing pointer passthrough and no-reflow behavior remain.

## Accepted keyboard behavior and future regression checklist

1. Leave the dashboard on Favorites bar with a section/folder open; invoke **Ctrl+Shift+B from another website**. Search uses All bookmarks; Escape restores the original view and scroll.
2. During search, use **Alt+1/2/3**. Query and input focus/selection remain; Escape still restores the original view. Repeat the command and change roots before Escape.
3. Verify plain-number searches, Ctrl+Arrow editing, **German AltGr input** and unaffected Manage fields. Check root tooltips/keyboard help and missing root numbers.
4. Hover a long section: static preview, then delayed slow scrolling, stopping at the end. Short sections should not scroll.
5. Leave/re-enter, switch headers and click during scrolling: preview resets and normal opening begins at the top. Switching away from a long open card keeps the new header visible.
6. Confirm static keyboard peek, reduced motion, the disable toggle (including reload), stationary header targets (footer/document bottom may extend temporarily near the end), and no reappearing coverage gaps at narrow widths/zoom.

The accepted already-open-address-bar case may still need Ctrl+F6; no new investigation is requested. Stop for user Edge review. Website thumbnails, Edit-mode redesign, drag/drop and synchronization changes remain deferred.

For the current appearance/footer regression review, use [the 0.1.15 focused checklist](development-state.md#files-and-edge-review). The keyboard behaviors above are accepted baseline evidence, not an outstanding request to repeat the entire shortcut investigation.
