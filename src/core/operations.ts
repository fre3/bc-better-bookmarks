import { assertNative, destinationIssue, moveBoundaryIssue } from './capabilities';
import type { FavoriteNode, Snapshot } from './model';
import { directTags, folderNode } from './node-tags';
import { editToken } from './logic';
export function nodeById(s: Snapshot, id: string) { return s.favorites.find(n => n.id === id) ?? s.folders.find(n => n.id === id); }
export function nativeToken(n: FavoriteNode) { return JSON.stringify([n.id,n.parentId,n.title,n.url,n.dateAdded,n.unmodifiable,n.folderType]); }
export function destinationToken(s: Snapshot, id: string) {
 const f=s.folders.find(f=>f.id===id);return f ? JSON.stringify([nativeToken(f),f.path,f.writable]) : '';
}
export function sourceToken(s: Snapshot,id:string) {
 const n=nodeById(s,id);if(!n)return '';
 return JSON.stringify([editToken(n.url===undefined?folderNode(n as Snapshot['folders'][number],s.folders):n as Snapshot['favorites'][number],directTags(s,id)),n.dateAdded,n.index,s.local.mappings[id]?.stableId]);
}
export function childrenOf(s: Snapshot,id:string): FavoriteNode[] { return s.folders.find(f=>f.id===id)?.children ?? []; }
export type Placement = { parentId:string; anchorId?:string; side:'start'|'before'|'after'|'end' };
export function placementToken(s:Snapshot,p:Placement) { return JSON.stringify([destinationToken(s,p.parentId),childrenOf(s,p.parentId).map(n=>[n.id,nativeToken(n)])]); }
/** Full native sibling order, including filtered/archived nodes. Chrome's index
 * addresses the insertion gap BEFORE removing the source from its old parent. */
export function planMove(s:Snapshot,id:string,p:Placement) {
 if(!['start','before','after','end'].includes(p.side))throw Error('Unsupported placement.');
 const n=nodeById(s,id),parent=s.folders.find(f=>f.id===p.parentId);
 assertNative(n);
 const destinationProblem=destinationIssue(parent) || moveBoundaryIssue(n,parent);if(destinationProblem)throw Error(destinationProblem);
 if(!n || n.unmodifiable || n.url===undefined && !(n as Snapshot['folders'][number]).renamable)throw Error('This item is missing, managed or browser-owned.');
 if(!parent?.writable)throw Error('Choose a writable destination.');
 for(const child of [...s.folders,...s.favorites].filter(child=>child.ancestorIds.includes(id))) { assertNative(child); if(child.url===undefined&&!s.folders.find(f=>f.id===child.id)?.renamable)throw Error('This subtree contains a browser-owned folder and cannot be moved.'); }
 if(p.anchorId) assertNative(nodeById(s,p.anchorId));
 if(parent.id===id || parent.ancestorIds.includes(id))throw Error('A folder cannot be moved into itself or its descendants.');
 const siblings=childrenOf(s,parent.id);let index=p.side==='start'?0:siblings.length;
 if(p.side!=='end'&&p.side!=='start'){const at=siblings.findIndex(n=>n.id===p.anchorId);if(at<0 || p.anchorId===id)throw Error('Choose another current sibling.');index=at+(p.side==='after'?1:0);}
 const old=siblings.findIndex(n=>n.id===id), finalIndex=old>=0 && old<index?index-1:index;
 if(old===finalIndex)throw Error('The item is already in that position.');
 return {parentId:parent.id,index};
}

/** Includes archived descendants; confirmation is about the native subtree. */
export function deletionNodes(s:Snapshot,id:string) {
 return [...s.folders,...s.favorites].filter(n=>n.id===id||n.ancestorIds.includes(id));
}
export function deletionToken(s:Snapshot,id:string,omitted:readonly string[]=[]) {
 return JSON.stringify(deletionNodes(s,id).filter(n=>!omitted.includes(n.id)).map(n=>[nativeToken(n),n.ancestorIds,directTags(s,n.id),s.local.mappings[n.id]?.stableId,(n.children??[]).filter(c=>!omitted.includes(c.id)).map(c=>c.id)]));
}
