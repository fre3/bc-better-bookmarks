# Development State

Last updated: 2026-09-30
Baseline revision: `bc9e20fb489dfdc63acaeeb2e4a8c5111b0cc7fb` (`Add bookmarklet search and metadata sync hardening`)

This file is the current handoff between Codex sessions and surfaces. Keep it concise and replace stale state instead of accumulating a changelog; Git is the history.

## Current focus

Single-device feature suites A–C passed via user-performed real Edge testing on 2026-09-29. Suite D baseline evidence is carried forward without repeated tests. Remaining work is Stage 1 journal/event/preflight validation and the cross-device mutation matrix. The exact user-operated runbook is prepared in [next-manual-session.md](next-manual-session.md); preparation is not execution evidence.

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

## Build artifact handoff

`dist/` is intentionally version-controlled so the native Windows Codex Desktop/Edge checkout can test the exact artifact produced by the WSL/CLI development checkout. Implementation work should regenerate `dist/` with `npm run build` (normally through `npm run check`) and commit resulting artifact changes together with the source. The Windows testing checkout should pull and load the committed `dist/` without rebuilding it independently.

At the time this policy was introduced, `dist/` was still absent from Git because it had previously been ignored. The next WSL/CLI build must add the actual generated `dist/` contents; do not synthesize or rebuild them from another environment merely to populate Git.

## Browser/UI verification

Status: **A–C PASSED — manual Edge evidence; D baseline evidence carried forward (2026-09-29)**

Edge Computer Use cannot access the extension New Tab UI because of its privileged URL policy. The user performed suites A–C manually in real Edge and reported all checks passed on the latest build; exact revision/version was not supplied. Bookmarklet titles are non-clickable with an instruction to run through Edge Favorites, explicitly accepted by the user. The HTTP-test Favorites count was corrected from a recording typo to 36 before creation and 37 afterwards. Suite D baseline checks remain validated from earlier evidence and were not repeated at the user's request; no fresh complete post-change D run is claimed. Detailed evidence is in docs/cross-device-test.md.

Already manually validated in real Edge:

- Current loaded extension uses the latest repository build (user confirmation, 2026-09-29); exact installed revision/version and Edge version were not supplied.
- Baseline unpacked loading and matching development ID on two independent builds.
- Favorites hierarchy/order and normal dashboard CRUD.
- User-tag add/remove/search.
- Native rename/move propagation and mapped-tag survival.
- Native copy/paste appearing without inheriting the original's user tags.
- Sequential cross-device creation/tag-edit convergence described above.

Current feature validation:

- Suite A: targeted/plain/mixed search, embedded URL characters, case/whitespace, empty operators and clearing passed.
- Suite B: HTTP label/search, empty tags and absent stableId, unchanged metadata counts, and label removal on HTTPS conversion passed.
- Suite C: bookmarklet warning/cancel/save, code fidelity, non-execution, JS label/search, repeated confirmation on tag edits, rename/move identity preservation, copied-tag isolation, URL conversions and unsupported-scheme rejection passed.
- Suite D: existing CRUD/tag/search/live-update/order baseline evidence carried forward; no duplicate test requests or fresh full regression claim.
- Still pending: Stage 1 journal/event/preflight-specific real Edge checks, remaining cross-device mutation matrix, and the earlier metadata-loss investigation.

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

Resume [next-manual-session.md](next-manual-session.md) at batch E (E1 journal baselines). User controls privileged Edge/New Tab/Favorites/worker DevTools actions; Codex provides larger batches, evaluates reports and updates the runbook ledger, cross-device-test.md and this handoff after each report. E covers local preservation/events/reload and conditional missing-identity preflight; F covers Favorite-first delivery, remote journal absence and sequential mutations; G covers path isolation/deletion/recreation with convergence gates. Missing-identity checks require the naturally affected record; fresh duplicate/pre-mapping cases remain deferred with explicit prerequisites. No next-session tests have run, no automation is scheduled, and no code or automated checks changed in this preparation. Preserve all earlier manual passes without repeating them.
