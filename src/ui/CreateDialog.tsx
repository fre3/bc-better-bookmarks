import { singleLineUrlPaste } from './url-entry';
import { useRef, useState } from 'react';
import type { Command, Snapshot } from '../core/model';
import type { SaveFailure } from '../core/edit-failure';
import { destinationToken } from '../core/operations';
import { nodeTags, visibleSnapshot } from '../core/node-tags';
import { confirmLinkInput, isBookmarklet } from '../core/logic';
import { linkInputErrors } from '../core/link-input';
import { editorTags, splitArchiveTag } from './editor-tags';
import { OperationDialog } from './OperationDialog';
export interface CreateRequest {folder:boolean;parentId:string}
export function CreateDialog({request,snapshot,showArchived,execute,onClose}:{request:CreateRequest;snapshot:Snapshot;showArchived:boolean;execute:(c:Command)=>Promise<SaveFailure|undefined>;onClose:()=>void}) {
 const [input,setInput]=useState({title:'',url:'https://',tags:[] as string[],parentId:request.parentId});
 const [destination,setDestination]=useState(()=>destinationToken(snapshot,request.parentId));
 const archiveIntent=useRef<boolean|null>(null);
 const [archived,setArchived]=useState(false),[error,setError]=useState(''),[errors,setErrors]=useState<ReturnType<typeof linkInputErrors>>({}),[saving,setSaving]=useState(false);
 const [attempt,setAttempt]=useState<Command>(),active=useRef(false),[id]=useState(()=>crypto.randomUUID()),[generation]=useState(snapshot.metadata.setup?.generation);
 const folders=visibleSnapshot(snapshot,showArchived).folders.filter(f=>f.writable),info=nodeTags(snapshot).get(input.parentId);
 const available=folders.some(f=>f.id===input.parentId);
 const changed=destination!==destinationToken(snapshot,input.parentId);
 const dirty=Boolean(input.title || input.url!=='https://' || input.tags.join('') || archived || input.parentId!==request.parentId);
 async function save(){if(active.current)return;
 let command=attempt;
 if(!command){const value={...input,tags:editorTags(input.tags,archived)};const e=linkInputErrors({...value,bookmarkletConfirmed:isBookmarklet(value.url)});if(request.folder)delete e.url;setErrors(e);if(Object.keys(e).length || !input.parentId || !available || changed)return;
 const confirmed=request.folder?value:confirmLinkInput(value,text=>window.confirm(text));if(!confirmed)return;
 command=request.folder?{type:'create-folder',parentId:input.parentId,title:input.title,tags:value.tags,requestId:id,destinationExpected:destination,generation}:{type:'create',input:confirmed,requestId:id,destinationExpected:destination,generation};setAttempt(command);}
 active.current=true;setSaving(true);setError('');try{const failure=await execute(command);if(failure)setError(failure.error);else onClose();}finally{active.current=false;setSaving(false);}}
 return <OperationDialog title={request.folder?'New folder':'New favorite'} dirty={dirty||Boolean(attempt)} busy={saving} onClose={onClose} actions={<button data-affirmative type="submit" form="create-form" disabled={saving||!input.parentId||!attempt&&(!available||changed)}>{saving?'Creating…':attempt?'Retry completion':'Create'}</button>}>
 <form id="create-form" noValidate onSubmit={e=>{e.preventDefault();void save();}}>
 <label htmlFor="create-title">{request.folder?'Name':'Title'}</label><input id="create-title" required readOnly={Boolean(attempt)} value={input.title} onChange={e=>setInput({...input,title:e.target.value})}/>{errors.title&&<p role="alert">{errors.title}</p>}
 {!request.folder&&<><label htmlFor="create-url">URL</label><input type="text" onPaste={e=>singleLineUrlPaste(e,message=>setErrors(value=>({...value,url:message})))} id="create-url" required readOnly={Boolean(attempt)} value={input.url} onChange={e=>setInput({...input,url:e.target.value})}/>{errors.url&&<p role="alert">{errors.url}</p>}</>}
 <label htmlFor="create-tags">Tags (comma separated; stored lowercase)</label><input id="create-tags" readOnly={Boolean(attempt)} value={input.tags.join(',')} onChange={e=>setInput({...input,tags:e.target.value.split(',')})} onBlur={()=>{const split=splitArchiveTag(input.tags);if(split.archived){setArchived(true);setInput({...input,tags:split.tags});}}}/>{errors.tags&&<p role="alert">{errors.tags}</p>}
 <label className="archive-choice"><input type="checkbox" disabled={Boolean(attempt)} checked={archived} onPointerDown={()=>{archiveIntent.current=!archived;}} onPointerCancel={()=>{archiveIntent.current=null;}} onKeyDown={()=>{archiveIntent.current=null;}} onChange={e=>{setArchived(archiveIntent.current??e.target.checked);archiveIntent.current=null;setInput(value=>({...value,tags:splitArchiveTag(value.tags).tags}));}}/>{request.folder?'Archive this folder and its contents':'Archive this favorite'}</label><p>Hidden from the dashboard and search unless Show archived is enabled.</p>
 <label htmlFor="create-parent">Destination {request.folder?'parent':'folder'}</label><select id="create-parent" required disabled={Boolean(attempt)} value={input.parentId} onChange={e=>{setInput({...input,parentId:e.target.value});setDestination(destinationToken(snapshot,e.target.value));}}><option value="">Choose a destination…</option>{folders.map(f=><option key={f.id} value={f.id}>{f.path.join(' / ')} [ID {f.id}]</option>)}</select>
 <p>Selected path: {snapshot.folders.find(f=>f.id===input.parentId)?.path.join(' / ')||'(choose a destination)'}</p>
 <p>Choose an ordinary folder or a Workspace container for its contents. Create new Workspaces themselves through Edge. Unclassified browser locations are excluded.</p>
 <p>Archived destinations are available with Show archived in Manage. Cancel this form to change that setting.</p>
 {changed&&!attempt&&<p role="alert">Destination moved, changed or disappeared. Select a current destination again. <button type="button" disabled={!available} onClick={()=>setDestination(destinationToken(snapshot,input.parentId))}>Use the current destination path</button></p>}
 <p>Inherited tags (read only): {info?.effective.map(t=>`#${t}`).join(' · ')||'(none)'}</p>{info?.archived&&<p>This destination archives the new item through inheritance. It will be hidden unless Show archived is enabled.</p>}
 {error&&<p className="editor-error" role="alert">{error}</p>}{attempt&&error&&<p>The submitted input is retained and locked for safe retry. Retry completes this same request. Cancelling never deletes an item that Edge already created.</p>}

 </form></OperationDialog>;
}
