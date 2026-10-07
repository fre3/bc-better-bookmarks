import { useRef, useState } from 'react';
import type { Command, Snapshot } from '../core/model';
import type { SaveFailure } from '../core/edit-failure';
import { deletionNodes, deletionToken, nodeById, sourceToken } from '../core/operations';
import { OperationDialog } from './OperationDialog';
export function DeleteDialog({id,snapshot,execute,onClose,onReview}:{id:string;snapshot:Snapshot;execute:(c:Command)=>Promise<SaveFailure|undefined>;onClose:()=>void;onReview:()=>void}) {
 const [expected,setExpected]=useState(()=>sourceToken(snapshot,id)),[token,setToken]=useState(()=>deletionToken(snapshot,id)),[generation]=useState(snapshot.metadata.setup?.generation);
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),active=useRef(false);
 const node=nodeById(snapshot,id),nodes=deletionNodes(snapshot,id),stale=expected!==sourceToken(snapshot,id)||token!==deletionToken(snapshot,id);
 const folders=nodes.filter(n=>n.id!==id&&n.url===undefined).length,favorites=nodes.filter(n=>n.id!==id&&n.url!==undefined).length;
 const path=node?.url===undefined?(node as Snapshot['folders'][number])?.path:(node as Snapshot['favorites'][number]).folderPath;
 async function remove(){if(active.current||stale||!node)return;active.current=true;setBusy(true);try{const failure=await execute({type:'delete',id,expected,subtreeExpected:token,generation});if(failure)setError(failure.error);else onClose();}finally{active.current=false;setBusy(false);}}
 return <OperationDialog title={`Delete ${node?.title??'removed item'}?`} dirty={false} busy={busy} safeFocus onClose={onClose} actions={<button data-affirmative className="destructive" disabled={busy||stale||!node} onClick={()=>void remove()}>{busy?'Deleting…':'Delete'}</button>}>
 <p>Path: {path?.join(' / ')||'(no longer available)'}</p>
 {node?.url===undefined&&<p>This includes {folders} descendant folders and {favorites} favorites, including archived descendants.</p>}
 <p>This permanently deletes native Edge Favorites and propagates through browser sync. It is not archiving. No Undo is provided.</p>
 {stale&&node&&<p role="alert">The item or its subtree changed. Review the updated name, path and counts before confirming again. <button disabled={busy} onClick={()=>{setExpected(sourceToken(snapshot,id));setToken(deletionToken(snapshot,id));setError('');}}>Review updated summary</button></p>}
 {!node&&<p>The native item is no longer present. Do not repeat deletion.</p>}
 {error&&<div role="alert"><p>{error}</p>{error.includes('binding')&&<button onClick={onReview}>Review folder bindings</button>}<button disabled={busy} onClick={async()=>{setBusy(true);try{const failure=await execute({type:'reconcile'});if(failure)setError(failure.error);else onClose();}finally{setBusy(false);}}}>Reconcile metadata</button></div>}
 </OperationDialog>;
}
