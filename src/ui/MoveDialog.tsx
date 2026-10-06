import { useState, useRef } from 'react';
import type { Command, Snapshot } from '../core/model';
import type { SaveFailure } from '../core/edit-failure';
import { nodeById, sourceToken, childrenOf, planMove, placementToken, type Placement } from '../core/operations';
import { visibleSnapshot, nodeTags } from '../core/node-tags';
import { OperationDialog } from './OperationDialog';
export function MoveDialog({id,snapshot,showArchived,execute,onClose,onReview}:{id:string;snapshot:Snapshot;showArchived:boolean;execute:(c:Command)=>Promise<SaveFailure|undefined>;onClose:()=>void;onReview:()=>void}){
 const [expected]=useState(()=>sourceToken(snapshot,id)),[generation]=useState(snapshot.metadata.setup?.generation),source=nodeById(snapshot,id);
 const [placement,setPlacement]=useState<Placement>({parentId:source?.parentId??'',side:'end'}),[destination,setDestination]=useState(()=>placementToken(snapshot,placement));
 const [error,setError]=useState(''),[saving,setSaving]=useState(false),active=useRef(false);
 const folders=visibleSnapshot(snapshot,showArchived).folders.filter(f=>f.writable&&f.id!==id&&!f.ancestorIds.includes(id));
 const visible=visibleSnapshot(snapshot,showArchived),allowed=new Set([...visible.favorites,...visible.folders].map(n=>n.id));
 const siblings=childrenOf(snapshot,placement.parentId).filter(n=>n.id!==id&&allowed.has(n.id));
 const change=(p:Placement)=>{setPlacement(p);setDestination(placementToken(snapshot,p));setError('');};
 let invalid='';try{if(!folders.some(f=>f.id===placement.parentId))throw Error('Choose a currently available destination.');planMove(snapshot,id,placement);}catch(e){invalid=String(e).replace(/^Error: /,'');}
 const stale=expected!==sourceToken(snapshot,id)||destination!==placementToken(snapshot,placement);
 async function save(){if(active.current||stale||invalid)return;active.current=true;setSaving(true);try{const failure=await execute({type:'move',id,expected,placement,destinationExpected:destination,generation});if(failure)setError(failure.error);else onClose();}finally{active.current=false;setSaving(false);}}
 return <OperationDialog title={`Move ${source?.title??'removed item'}`} dirty={false} busy={saving} onClose={onClose}>
 <p>Current path: {source?.url===undefined?(source as Snapshot['folders'][number])?.path.join(' / '):(source as Snapshot['favorites'][number]).folderPath.join(' / ')}. Direct tags stay with this item. Inheritance follows the destination.</p>
 <label htmlFor="move-parent">Destination folder</label><select id="move-parent" value={placement.parentId} disabled={saving} onChange={e=>change({parentId:e.target.value,side:'end'})}>{folders.map(f=><option key={f.id} value={f.id}>{f.path.join(' / ')} [ID {f.id}]</option>)}</select>
 <label htmlFor="move-position">Placement</label><select id="move-position" value={placement.side==='end'?'end':`${placement.side}:${placement.anchorId}`} disabled={saving} onChange={e=>{const [side,...id]=e.target.value.split(':');change({parentId:placement.parentId,side:side as Placement['side'],anchorId:id.join(':')||undefined});}}><option value="end">At the end</option>{siblings.flatMap(n=>['before','after'].map(side=><option key={side+n.id} value={`${side}:${n.id}`}>{side==='before'?'Before':'After'} {n.title} [ID {n.id}]</option>))}</select>
 <p>Archived destinations/items are listed only with Show archived in Manage. Cancel to change that setting.</p>
 {nodeTags(snapshot).get(placement.parentId)?.archived&&<p>This destination archives the item through inheritance.</p>}
 {stale&&<p role="alert">Source, destination or order changed. Cancel and reopen to review the current location.</p>}{invalid&&<p>{invalid}</p>}{error&&<p role="alert">{error}</p>}
 <div className="editor-actions"><button disabled={saving||stale||Boolean(invalid)} onClick={()=>void save()}>{saving?'Moving…':'Move'}</button>{error.includes('binding')&&<button onClick={onReview}>Review folder bindings</button>}</div>
 </OperationDialog>;
}
