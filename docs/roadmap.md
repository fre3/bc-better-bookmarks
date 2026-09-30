# Roadmap

Deferred ideas and explicitly future work. Items here are **not implementation requirements** unless a current task explicitly promotes them. Keep current work and verification status in `development-state.md`.

## Next session scope

The current implementation is the validated functional baseline. The next user-started session focuses on UI/UX; no UI/UX changes have begun. Preserve behavior, identity rules and accepted bookmarklet handling. Deferred items below are not blockers for design work. Start with `development-state.md` for the handoff.

## System labels

System labels are derived from the Favorite itself, not user metadata. They must be reproducible locally, never synchronized independently, and must not create stable IDs.

| Label | Meaning | Status |
| --- | --- | --- |
| `JS` | `javascript:` bookmarklet | Implemented; real Edge UI validation passed 2026-09-29 |
| `HTTP` | Unencrypted `http://` URL | Implemented; real Edge UI validation passed 2026-09-29 |
| `LOCAL` | Localhost / loopback destination | Future |
| `IP` | Direct IP address destination | Future |
| `PDF` | URL clearly targets a PDF resource | Future |
| `MAIL` | `mailto:` link | Future; does not expand the current save policy |

Possible future system-label targeting syntax such as `!js` remains undecided.

## Search enhancements

Current implemented MVP syntax:

- plain text searches all searchable fields;
- `#term` targets user tags;
- `@term` targets category/folder paths;
- all whitespace-separated terms must match;
- matching is case-insensitive substring matching.

Deferred possibilities:

- tag autocomplete after `#`;
- category autocomplete after `@`;
- quoted multi-word targeted values;
- targeted system-label search;
- richer filters or an advanced-search UI.

Do not complicate the current parser merely to reserve syntax for these ideas.

## Metadata sync and recovery

Stage 1 hardening preserves local metadata intent and improves diagnostics but deliberately does not perform automatic recovery.

Potential Stage 2 work must be evidence-driven and should only be promoted when deferred identity/delivery investigations and the earlier metadata-loss investigation provide a clear recovery requirement; the planned E–G session has passed. Any recovery design must preserve the existing rules against guessing duplicate identity, silently rewriting Favorites, or treating local browser IDs as portable identity.

## Distribution

Before production publication through Edge Add-ons:

- establish the production/store extension identity;
- retest metadata synchronization under the store-installed extension;
- design an explicit migration only if development and production namespaces differ and migration is actually required.

Do not assume the development manifest key determines the production store identity.
