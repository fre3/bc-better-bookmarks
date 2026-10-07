import type { FavoriteNode, Snapshot } from './model';
import { childrenOf, nodeById } from './operations';

/** Compare the full native order, never filtered catalogue indices. A different
 * result can be a rejected/no-op API write or a concurrent native change; do not
 * infer a cause or repeat the operation. */
export function moveOutcome(before: Snapshot, after: Snapshot, id: string, parentId: string, index: number, reply?: FavoriteNode | void): string | undefined {
  const original=nodeById(before,id),actual=nodeById(after,id);
  if(!original || !actual)return 'Move outcome is unverified: the source is no longer present.';
  const oldOrder=childrenOf(before,original.parentId!).map(n=>n.id);
  const destination=childrenOf(before,parentId).map(n=>n.id),old=destination.indexOf(id);
  const expected=destination.filter(n=>n!==id),position=old>=0&&old<index?index-1:index;
  expected.splice(position,0,id);
  const observed=childrenOf(after,parentId).map(n=>n.id);
  const actualOrder=childrenOf(after,actual.parentId!).map(n=>n.id);
  const where=`Current native parent: ${after.folders.find(f=>f.id===actual.parentId)?.path.join(' / ')??actual.parentId} [${actual.parentId}], position ${actualOrder.indexOf(id)+1}.`;
  if(actual.parentId!==parentId || JSON.stringify(observed)!==JSON.stringify(expected) || original.parentId!==parentId && JSON.stringify(childrenOf(after,original.parentId!).map(n=>n.id))!==JSON.stringify(oldOrder.filter(n=>n!==id))) {
    const unchanged=actual.parentId===original.parentId && JSON.stringify(actualOrder)===JSON.stringify(oldOrder);
    return `${unchanged?'Move was not applied: native position is unchanged.':'Move outcome differs from the requested parent/order; an intervening native change is possible.'} ${where}`;
  }
  if(actual.title!==original.title || actual.url!==original.url || actual.dateAdded!==original.dateAdded)return `Move position was observed, but the source's native values changed unexpectedly. ${where}`;
  if(reply && (reply.id!==id || reply.parentId!==parentId || reply.index!==undefined && reply.index!==observed.indexOf(id)))return `Native tree shows the requested position, but the move API response disagrees. ${where}`;
}
