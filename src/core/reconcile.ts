import { fingerprint } from './logic';
import type { Favorite, LocalMapping, Locator, MetadataState, Reconciliation } from './model';

export function uniqueLocators(locators: Locator[]): Locator[] {
  return [...new Map(locators.map(l => [fingerprint(l), l])).entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, l]) => l);
}
/** Pure, conservative reconciler. Never creates an identity or writes Favorites. */
export function reconcile(favorites: Favorite[], metadata: MetadataState, old: Record<string, LocalMapping>, pendingDeletions: string[] = []): Reconciliation {
  const result: Reconciliation = { mappings: {}, matches: [], historyWrites: {}, warnings: [] };
  const dead = new Set([...Object.keys(metadata.tombstones), ...pendingDeletions]);
  const candidates = new Map<string, Favorite[]>();
  const known = new Map<string, Favorite[]>();
  for (const record of metadata.records) {
    const locators = uniqueLocators([record.initialLocator, ...(metadata.histories[record.stableId]?.locators ?? [])]);
    const keys = new Set(locators.map(fingerprint));
    candidates.set(record.stableId, favorites.filter(f => keys.has(fingerprint(f.locator))));
    known.set(record.stableId, favorites.filter(f => f.locator.kind === record.initialLocator.kind && old[f.id]?.stableId === record.stableId && old[f.id]?.dateAdded === f.dateAdded));
  }
  // Evaluate globally, never greedily consume candidates according to input order.
  for (const record of [...metadata.records].sort((a, b) => a.stableId.localeCompare(b.stableId))) {
    const id = record.stableId;
    if (dead.has(id)) { result.matches.push({ stableId: id, status: 'deleted', candidateIds: [], reason: 'Confirmed deletion evidence excludes this identity' }); continue; }
    const previous = known.get(id)!;
    const possible = candidates.get(id)!;
    const choice = previous.length === 1 ? previous[0] : record.initialLocator.kind !== 'folder' && possible.length === 1 ? possible[0] : undefined;
    const competitors = choice && metadata.records.some(other => other.stableId !== id && !dead.has(other.stableId) && (
      // A unique surviving local binding is stronger evidence than a shared
      // locator. A record bound to a DIFFERENT native node cannot compete
      // for this node just because a move brings identical locators together.
      // Unbound or multiply-bound records still require conservative review.
      (known.get(other.stableId)!.length === 1 ? known.get(other.stableId)! : [...candidates.get(other.stableId)!, ...known.get(other.stableId)!]).some(f => f.id === choice.id)
    ));
    const reused = choice && old[choice.id] && (old[choice.id].stableId !== id || old[choice.id].dateAdded !== choice.dateAdded);
    if (!choice || previous.length > 1 || competitors || reused) {
      result.matches.push({ stableId: id, status: possible.length > (record.initialLocator.kind === 'folder' ? 1 : 0) || previous.length || competitors ? 'ambiguous' : 'unresolved', candidateIds: [...new Set([...possible, ...previous].map(f => f.id))], reason: previous.length > 1 ? 'Multiple surviving native nodes claim this local identity' : reused ? 'Native ID reuse or conflicting retained local identity' : competitors ? 'Competing identity has no distinct validated local binding' : possible.length > 1 ? 'Multiple exact locator candidates without a unique local binding' : record.initialLocator.kind === 'folder' && possible.length === 1 ? 'Folder candidate requires explicit confirmation' : 'No surviving local binding or unique exact locator candidate' });
      continue;
    }
    const mapping: LocalMapping = { stableId: id, lastLocator: choice.locator, dateAdded: choice.dateAdded, method: previous.length ? old[choice.id].method : 'exact-locator' };
    // Publish only a change to an already mapped local Favorite; remote storage alone cannot churn histories.
    if (previous.length && fingerprint(old[choice.id].lastLocator) !== fingerprint(choice.locator)) {
      const locators = uniqueLocators([record.initialLocator, ...(metadata.histories[id]?.locators ?? []), old[choice.id].lastLocator, choice.locator]);
      if (locators.length > 12) {
        result.warnings.push(`${id}: locator history limit reached; publication blocked`);
        mapping.lastLocator = old[choice.id].lastLocator;
      } else if (JSON.stringify(locators) !== JSON.stringify(metadata.histories[id]?.locators)) {
        result.historyWrites[`loc:${id}`] = { ...(record.generation ? { generation: record.generation } : {}), schemaVersion: record.schemaVersion, stableId: id, locators };
      }
    }
    result.mappings[choice.id] = mapping;
    result.matches.push({ stableId: id, status: previous.length ? 'local-mapping' : 'exact-locator', bookmarkId: choice.id, candidateIds: possible.map(f => f.id), reason: previous.length ? 'Retained native ID, kind and creation timestamp validate the local binding' : 'Unique exact locator with no competing identity' });
  }
  return result;
}
