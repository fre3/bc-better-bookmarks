# Roadmap

Deferred ideas and explicitly future work. Items here are **not implementation requirements** unless a current task explicitly promotes them. Keep current work and verification status in `development-state.md`.

## Next session scope

The validated functional baseline is preserved at `mvp-validated-0.1.1`. The UI/UX feature branch has reached the browsing/search correction checkpoint (0.1.10), awaiting visual review before Edit mode/inline CRUD. Preserve behavior, identity rules and accepted bookmarklet handling. Folder tags require a separately authorized metadata-model extension and remain deferred; their intended overlay styling is recorded in `ui-ux-design.md`. Drag/drop is also deferred. Start with `development-state.md` for current status.

## Future catalogue imagery and motion

- Locally cached website thumbnails may later take precedence over favicons.
- Actual website thumbnails should initially use no light-gray backing or frame padding; favicons/placeholders retain the framed treatment.
- Website capture, permissions, cache/storage and fallback policy require a separate implementation decision. No thumbnail infrastructure or thumbnail permissions are part of 0.1.10.
- Delayed automatic preview scrolling was explicitly promoted for 0.1.9, independently switchable in Manage; see `ui-ux-design.md`. Edit mode and drag/drop remain deferred.

## Language-aware title hyphenation

The user accepts current observed English/German behavior as of 0.1.8; no language work is scheduled. Only if later explicitly requested, decide whether users may explicitly assign a local title language per item/folder, with override/inheritance rules and an unknown default. Existing records provide no reliable language; do not infer it from UI locale/domain. If separately authorized, apply reliable `lang` plus browser automatic hyphenation and validate actual Edge dictionaries and filename exclusions. Local storage/identity and UX require a separate decision. No page fetching, synchronized language metadata, new permission or language-detection dependency is authorized by this roadmap item.

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
