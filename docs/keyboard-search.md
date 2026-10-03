# Dashboard search command — 0.1.8 Edge checkpoint

The browser-scoped command is `open-dashboard-search`, described as **Open dashboard in search mode**, with **Ctrl+Shift+B suggested on Windows**. It is not an OS-global shortcut. The user confirmed this default; Ctrl+B is only an optional user reassignment. Alt+Shift+F is not used.

## Assignment and use

Open `edge://extensions/shortcuts`, find Better Bookmarks, and inspect the actual assignment. Suggestions can conflict with browser/extension shortcuts; do not assume Ctrl+Shift+B was assigned. Set or change it there if desired. Removing it is respected: the extension never writes or restores assignments.

**Manage → Dashboard search shortcut** displays the actual value returned by `chrome.commands.getAll()`, including “unassigned”, and provides a shortcut-settings action. It refreshes when Manage opens or regains focus. In the extension worker console, the same read-only check is:

```js
await chrome.commands.getAll()
```

Normal `Ctrl+T` continues to leave focus in Edge's address bar. The user-confirmed fallback remains **Ctrl+T → Ctrl+F6 → type**. If the command prepares search but typing stays in browser chrome, use **Ctrl+F6**, then type. No simulated keystrokes or delay-based focus loops are implemented.

Reload the existing WSL `dist/` extension at `edge://extensions`, review the added `tabs` permission, verify **0.1.8**, and open a fresh New Tab. The artifact is already built:

```text
\\wsl.localhost\Ubuntu-24.04\home\dev\projects\bc-better-bookmarks\dist
```

No push was made; a remote Windows clone will not receive this checkpoint by pulling yet. Do not rebuild in Windows or uninstall the extension to change its loaded path.

## Routing, state and safeguards

- Prefer the current dashboard; otherwise reuse one in the invoking window, in browser tab order. Create an active `search.html` tab in that same window only when no identifiable dashboard exists there. The website tab is not navigated or closed. Other windows' dashboards are not selected.
- A serialized UI routing queue coalesces overlapping invocations. A session-only request keyed by tab ID survives service-worker suspension. The page registers its listener before announcing readiness; snapshot loading returns “not ready” until the catalogue mounts. Accepted/blocked requests are removed, so readiness notifications do not repeatedly steal focus.
- Leaving the target tab/window, closing it or navigating away cancels pending focus work. Readiness does not reactivate a tab the user left. The browser adapter validates own extension pages and sender identity. No website content script is involved.
- Existing root, query, open section and expanded branch are retained; an existing query is selected for replacement. Escape uses the existing catalogue reducer and restores its browse position. A new dashboard starts at All bookmarks with empty search.
- When browser chrome has focus, an explicit renderer navigation to `search.html?launch=<random token>` is attempted. Before navigation, a one-shot **tab-local sessionStorage handoff** preserves catalogue state, query and Escape's scroll/focus target. This is transient UI state, not bookmark/metadata persistence or sync. It is consumed once after the new page's snapshot is ready. A page already focused can use the existing input without navigation. Ordinary New Tab never initiates this route.
- **Manage or an active save blocks the command**, showing a notice. It does not unmount Manage, discard a draft, navigate away, bypass mutation guards, or queue a surprise focus change after editing. Finish editing, return to the catalogue and invoke again.
- If the transient handoff cannot be stored, navigation is refused and a Ctrl+F6 fallback message appears; existing catalogue state is retained.

`document.hasFocus()` is used only to decide whether to attempt the explicit route; neither it nor `activeElement` is treated as evidence that native keyboard focus transferred. Query selection and DOM focus alone are insufficient verification.

## Permissions and API evidence

The single added permission is **`tabs`**. It permits inspection of `url`/`pendingUrl` to identify explicit dashboard tabs before their renderer is ready or after discard, avoiding duplicate creation. Discovery is limited to the invoking window. `runtime.getContexts` identifies our live New Tab behind Edge's virtual New Tab URL; an unrelated New Tab provider is not assumed to be ours. A discarded virtual New Tab without an identifiable live context cannot safely be distinguished from another provider; an explicit `search.html` tab remains identifiable by URL.

The permission also grants access to tab titles/favicon URLs at browser level, but the router does not store website URLs/titles, inspect website contents or inject scripts. No `activeTab`, host, scripting, history, webNavigation or global-shortcut permissions were added. Existing manifest key/extension identity are unchanged. Metadata writes remain in the existing worker service queue; the UI routing queue only owns transient launch requests in session storage.

Primary references: [Commands API](https://developer.chrome.com/docs/extensions/reference/api/commands) describes suggested assignments, `getAll`, conflicts and browser/global scope; [Tabs API permissions](https://developer.chrome.com/docs/extensions/reference/api/tabs#permissions) distinguishes URL access from basic tab activation/creation; [Runtime contexts](https://developer.chrome.com/docs/extensions/reference/api/runtime#method-getContexts) provides own extension context discovery. Microsoft lists [supported Edge APIs](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/api-support). These documents establish API support, not successful native Edge focus transfer.

Chromium's [tab-update implementation](https://chromium.googlesource.com/chromium/src/+/4848e47a0e2bcfd75994cc21b8b31ea457a1395c/chrome/browser/extensions/api/tabs/tabs_api.cc) skips activation for an already active tab and marks API navigation to retain omnibox focus. Local probes also found that `window.focus()`/input focus and same-document hash/history changes did not reliably move native typing out of browser chrome. The implementation therefore uses renderer navigation with a state handoff when needed, not a `tabs.update(url)` or synthetic Ctrl+F6 workaround.

## Verification and known focus limitation

`npm run check` passes: typecheck, lint, **159 tests across 9 files**, production build/version verification and unchanged extension identity. Unit checks cover current/same-window selection, other-window isolation, coalesced requests, loading readiness, worker restart with a pending request, cancellation, blocked Manage requests, failure recovery, actual/unassigned shortcut reporting and validated one-shot state handoff.

An isolated **WSL Chromium** extension profile with native X11 keyboard input passed:

- Fresh New Tab command → actual `azure` characters in search after explicit-route navigation.
- Website → new explicit dashboard → actual `test` characters in search.
- Existing query selection/replacement; root scope and expanded branch restored by Escape.
- Unsaved Manage draft and website editor content unchanged.
- Same-window dashboard reuse; eight rapid invocations without additional tabs.
- Command-triggered service-worker restart with no pending request left behind.

Those runs used a **temporary copy** with Linux Ctrl+Shift+Y to exercise the command. The shipped manifest only suggests Ctrl+Shift+B on Windows. A separate Linux probe of Ctrl+Shift+B returned an empty assignment, reinforcing that registration must be inspected. The actual assignment in the user's Windows Edge profile is **not observable here** and remains pending verification. No assignment was changed in that profile.

**Remaining limitation:** in the isolated Chromium probe, invoking again from the address bar of an already-open explicit search page could leave native typing in the address bar, even though the query was selected and the explicit route was attempted. Use Ctrl+F6 in that case. Fresh New Tab and website launch passed locally, but no native Edge success is claimed for any focus case. This is not masked by arbitrary waits, repeated focus attempts or OS keystroke simulation in the extension. Native X11 events were test inputs only. Playwright focus emulation was explicitly disabled for address-bar investigation; actual typed input, rather than DOM focus alone, determined results.

All eight native Edge checks below remain pending. Local extension/profile tests do not constitute Microsoft sync evidence. Temporary rerun scripts are in `/tmp/bb-catalogue-browser-check/command-extension.mjs` and `command-state-018.mjs`; summarized synthetic evidence is in `visual-review/generated/0.1.8-command-results.json`.

## Native Edge checklist

1. Confirm **Open dashboard in search mode** and its actual assignment at `edge://extensions/shortcuts`; compare the read-only assignment shown in Manage.
2. `Ctrl+T → type` still types in the address bar.
3. `Ctrl+T → Ctrl+Shift+B → type` enters dashboard search. Judge actual characters, not a visible caret alone. If it fails, record the result and use the confirmed Ctrl+F6 fallback.
4. From another website, **Ctrl+Shift+B** opens/reuses a dashboard in that window and typing reaches search. The original website remains intact. Ctrl+B applies only if manually reassigned; the confirmed default is Ctrl+Shift+B.
5. Existing query is selected for replacement; Escape restores scope, expansion and browse position. Also try the explicit dashboard with the address bar focused and report whether the known Chromium limitation reproduces.
6. Rapid repeated invocation creates no duplicate tabs; another window's dashboard is not selected. Try a fresh/cold worker and a loading dashboard.
7. Reassigning works; removing the assignment is respected after reload/restart. Restore the preferred assignment manually if desired.
8. Test while focused in a website text editor. If deliberately reassigned to Ctrl+B, check interaction with the editor's Bold command; do not assume Edge gives the extension precedence. Verify the editor content remains intact. In Manage, an unsaved draft must remain open and the shortcut must report that it is paused.

Stop for user-controlled Edge review. Auto-scrolling, thumbnails, Edit-mode redesign, drag/drop and sync changes remain deferred.
