# Development State

Last updated: 2026-09-29
Baseline revision: `bc9e20fb489dfdc63acaeeb2e4a8c5111b0cc7fb` (`Add bookmarklet search and metadata sync hardening`)

This file is the current handoff between Codex sessions and surfaces. Keep it concise and replace stale state instead of accumulating a changelog; Git is the history.

## Current focus

Validate the newly implemented bookmarklet/search/system-label UI and Stage 1 metadata-sync hardening in real Edge, then continue the remaining cross-device mutation matrix.

## Implementation status

Implemented in the current baseline:

- Free-text search plus targeted `#tag` and `@category` terms. All whitespace-separated terms must match, case-insensitively by substring.
- Explicitly confirmed `javascript:` bookmarklet saves, with confirmation required on every save whose resulting URL remains executable code. The dashboard never executes bookmarklets.
- Derived read-only system labels: `JS` for bookmarklets and `HTTP` for unencrypted HTTP links. They are not synchronized metadata and do not create stable IDs.
- Stage 1 metadata-sync hardening: content-free sync-key change diagnostics, preservation of locally authored metadata intent in `storage.local` before publication, stronger diagnostics for missing/quarantined/deleted/ambiguous metadata, and preflight rejection of detectable unsafe identity edits.
- Sequential two-way metadata sync has been manually demonstrated in real Edge: fresh B → A creation with tags, followed by A → B and B → A tag edits on the same identity.

Durable design details belong in `docs/architecture.md`; manual sync evidence and the remaining matrix belong in `docs/cross-device-test.md`.

## Automated verification

The repository documents automated coverage for typecheck, lint, unit/service tests, production build/package checks, and deterministic extension identity. The latest feature commit includes corresponding implementation/tests, but this handoff does not independently rerun the local WSL commands.

Before handing off implementation changes, run:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

Or run `npm run check`.

Automated checks do not constitute Edge UI or Microsoft sync verification.

## Browser/UI verification

Status: **PARTIAL — loaded build manually confirmed; open dashboard tab inaccessible through current browser tool (2026-09-29)**

At source revision `9b1a327e310c0817aa3c87b127622266c77fa6e9`, `cua.getState()` successfully returned Edge and its tab inventory. The previous sandbox startup failures are historical tooling incidents. Opening `edge://extensions` through Edge Computer Use was then rejected by the browser URL policy: only HTTP/HTTPS protocols are allowed, and the rejection explicitly prohibits alternate routes to the blocked action. No extension UI was reached, fixtures created, Favorites changed, or sync/storage settings modified. The user subsequently confirmed on 2026-09-29 that the loaded Edge extension uses the latest repository build: the current single-device loaded-build check is manually complete. This is user-reported evidence; an exact installed revision/version string and Edge version were not supplied. Suites A–D remain unrun. No automated checks were rerun for this documentation-only update. See `docs/cross-device-test.md` for the actual tool evidence.

On the user's request to test the already-open dashboard, Edge tab discovery returned `Better Bookmarks` at `edge://newtab/`. Selecting that exact tab with `cua.getTab` returned `about:blank`; a subsequent accessibility observation and tab listing still reported `about:blank`, with no dashboard controls. No navigation, reload, or app input was issued. The cause of this mismatch is unknown; it is tool-access evidence, not an application failure or a passed New Tab test. A–D remain pending.

Already manually validated in real Edge:

- Current loaded extension uses the latest repository build (user confirmation, 2026-09-29).
- Baseline unpacked loading and matching development ID on two independent builds.
- Favorites hierarchy/order and normal dashboard CRUD.
- User-tag add/remove/search.
- Native rename/move propagation and mapped-tag survival.
- Native copy/paste appearing without inheriting the original's user tags.
- Sequential cross-device creation/tag-edit convergence described above.

Still pending for the current feature set:

- Bookmarklet add/edit confirmation behavior, cancellation behavior, exact code preservation, and non-execution by the dashboard.
- Visible `JS` and `HTTP` derived labels and their search behavior.
- `#tag`, `@category`, mixed targeted/plain-text searches, lone `#`/`@`, and embedded URL/text characters in the real UI.
- Stage 1 journal/event/preflight-specific behavior in real Edge.
- Remaining cross-device mutation matrix and investigation of the earlier metadata-loss incident.

Use `docs/cross-device-test.md` for detailed procedures and durable evidence.

## Open findings

- The earlier cross-device metadata-loss incident is documented but its underlying cause remains unresolved.
- Sequential two-way sync works for the tested workflow; broader mutation coverage is still required before claiming full architecture validation.
- Stage 2 automatic recovery is intentionally deferred. Missing sync keys must not be recreated automatically from the local intent journal.
- Exact duplicates and concurrent same-key cross-device writes remain intentionally unresolved/limited as documented in the architecture.

## Recent decisions

- Edge Favorites remain authoritative; system labels are derived from Favorites and never synchronized independently.
- Current targeted search syntax is plain text = all searchable fields, `#` = user tags, `@` = category/folder.
- `JS` and `HTTP` are implemented system labels. Additional system labels and richer targeted-search features remain roadmap items.
- Real browser evidence must remain explicitly separate from mocked/local automated checks.

## Next action

Continue with suite A targeted search, then B–D, manually in Edge using the documented disposable test root, or resume automation once an approved tool configuration supports extension/internal pages. The current loaded-build check is complete by user confirmation; do not request it again. Edge version remains unrecorded. Do not work around the current URL-policy rejection. Record actual results in `docs/cross-device-test.md`, then continue outstanding Stage 1 checks where available. Preserve prior baseline and sequential two-way sync validation; all pending checks remain unvalidated. Leave implementation fixes for the next CLI/WSL session unless a browser-side change is clearly necessary.
