# Roadmap

Deferred ideas and explicitly future work. Items here are **not implementation requirements** unless a current task explicitly promotes them. Keep current work and verification status in `development-state.md`.

## Next session scope

Validated references remain at `mvp-validated-0.1.1` and `ui-validated-0.1.15`; **Indexfold 0.1.27 is accepted in native Edge**, checkpointed as `editing-validated-0.1.27`. Cross-Workspace moves and synchronization between PCs also passed. Successful Chrome use is reported, without implying a full Chrome regression or cross-browser sync suite. The historical title-change investigation is closed following user-reported nonrecurrence across several releases; its original cause is unconfirmed, with evidence retained in [the investigation record](move-identity-0.1.23.md). It is not an active issue or review task. Await the next explicitly requested scope; no deferred feature or live repair is authorized by this checkpoint.

## Future catalogue imagery and motion

- Locally cached website thumbnails may later take precedence over favicons.
- Actual website thumbnails should initially use no light-gray backing or frame padding; favicons/placeholders retain the framed treatment.
- Website capture, permissions, cache/storage and fallback policy require a separate implementation decision. No thumbnail infrastructure or thumbnail permissions are part of 0.1.15.
- Delayed automatic preview scrolling was explicitly promoted for 0.1.9, independently switchable in Manage; see `ui-ux-design.md`. The first catalogue Edit mode/modal is implemented in 0.1.16; creation and internal single-item pointer moving were promoted for 0.1.21. Confirmed single-subtree deletion was promoted for 0.1.22. Copying, bulk operations and cross-tab/external drops remain deferred.

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

Current search syntax:

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

## Optional local semantic search — deferred

Evaluate optional multilingual semantic search over bookmark titles, URLs, folder paths and tags. Retain ordinary search and its existing syntax. Any derived index should be stored locally, outside synchronized bookmark metadata; do not fetch website content initially. Evaluate relevance (including mixed languages) and resource use (model/download size, index size, memory, CPU and latency) before choosing an implementation. No model, indexing infrastructure, fetching or new permissions are authorized by this roadmap note.

## Metadata sync and recovery

Stage 1 hardening preserves local metadata intent and improves diagnostics but deliberately does not perform automatic recovery.

Potential Stage 2 work must be evidence-driven and should only be promoted when deferred identity/delivery investigations and the earlier metadata-loss investigation provide a clear recovery requirement; the planned E–G session has passed. Any recovery design must preserve the existing rules against guessing duplicate identity, silently rewriting Favorites, or treating local browser IDs as portable identity.

## Distribution

Before production publication through Edge Add-ons:

- establish the production/store extension identity;
- retest metadata synchronization under the store-installed extension;
- design an explicit migration only if development and production namespaces differ and migration is actually required.

Do not assume the development manifest key determines the production store identity.


## Manage organization — implemented for 0.1.26 review

Settings / Bookmarks / Diagnostics now separate everyday preferences, bookmark management and technical tools. Further metadata import/recovery needs an explicit evidence-driven design; private reset exports are not one-click restoration. See the current handoff before extending this interface.

## Local creation receipt housekeeping

A future explicit recovery/housekeeping view may expose local creation receipts and safely compact completed entries. Do not automatically prune uncertain requests or recreate their items. This is separate from synced metadata restoration and must not promise durable UI draft recovery.

## Current Workspace filtering — deferred

No supported active-Workspace identity is established in public tab/window/bookmark fields. Keep all containers visible. Revisit only with a supported signal; no manual selector, private API or profile-file access. Container-to-container moving is now enabled with outcome verification; Workspace ↔ ordinary-root moving still requires separate support evidence.

## 0.1.26 scope update

Manage's Settings / Bookmarks / Diagnostics organization and Indexfold display branding are implemented for review. Broad future management improvements can build on these panels; no test setup is required. Container-to-container native moves are enabled with verified outcomes and await targeted Edge/two-device review. Only Workspace ↔ ordinary-root boundary support remains deferred pending evidence. Automatic active-Workspace filtering, semantic search, thumbnails, copying and bulk operations remain deferred.
