import { nativeIssue } from '../core/capabilities';
import type { Snapshot } from '../core/model';
import { createContext, useContext, useRef } from 'react';
export interface Actions { snapshot:Snapshot; create:(folder:boolean,parentId:string)=>void;move:(id:string)=>void;remove?:(id:string)=>void;searching:boolean; }
export const ActionsContext=createContext<Actions|undefined>(undefined);
export function AddMenu({parentId='',id,title='New'}:{parentId?:string;id?:string;title?:string}) {
 const actions=useContext(ActionsContext),ref=useRef<HTMLDivElement>(null);
 if(!actions)return null;
 const node=[...actions.snapshot.folders,...actions.snapshot.favorites].find(n=>n.id===id);
 const parent=actions.snapshot.folders.find(n=>n.id===parentId);
 const issue=id ? nativeIssue(node) || (node?.url===undefined && !actions.snapshot.folders.find(n=>n.id===id)?.renamable ? 'This browser folder is managed in Edge.' : undefined) : parentId ? nativeIssue(parent) : undefined;
 const canCreate=Boolean(parent?.writable);
 return <span className="item-actions"><button type="button" aria-label={id?`More actions for ${title}`:'New'} aria-haspopup="menu" onClick={e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect(),p=ref.current!;p.style.left=`${Math.max(8,Math.min(r.left,window.innerWidth-240))}px`;p.style.top=`${Math.max(8,Math.min(r.bottom+4,window.innerHeight-180))}px`;p.showPopover();const size=p.getBoundingClientRect();p.style.left=`${Math.max(8,Math.min(r.left,window.innerWidth-size.width-8))}px`;p.style.top=`${Math.max(8,Math.min(r.bottom+4,window.innerHeight-size.height-8))}px`;(p.querySelector<HTMLElement>('button:not(:disabled)')??p).focus();}}>{id?'More':'New'}</button>
 <div ref={ref} tabIndex={-1} popover="auto" className="item-menu" role="menu" onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();ref.current?.hidePopover();(ref.current?.previousElementSibling as HTMLElement)?.focus();}if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const items=[...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')],at=items.indexOf(document.activeElement as HTMLButtonElement);items[e.key==='Home'?0:e.key==='End'?items.length-1:(at+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();}}}>
 {parentId&&canCreate&&<><button role="menuitem" onClick={()=>{ref.current?.hidePopover();actions.create(false,parentId);}}>New favorite</button><button role="menuitem" onClick={()=>{ref.current?.hidePopover();actions.create(true,parentId);}}>New folder</button></>}
 {!id&&!parentId&&<><button role="menuitem" onClick={()=>{ref.current?.hidePopover();actions.create(false,'');}}>New favorite</button><button role="menuitem" onClick={()=>{ref.current?.hidePopover();actions.create(true,'');}}>New folder</button></>}
 {id&&!issue&&<><button role="menuitem" onClick={()=>{ref.current?.hidePopover();actions.move(id);}}>Move…</button><button role="menuitem" onClick={()=>{ref.current?.hidePopover();actions.remove?.(id);}}>Delete…</button>{actions.searching&&<small>Use Move in search results; positional dragging is unavailable.</small>}</>}
 {issue&&node?.workspaceRole!=='container'&&<p className="editor-context">{issue}</p>}
 </div></span>;
}
export function ExtraActions({id,title,folder}:{id:string;title:string;folder:boolean}) {
 const actions=useContext(ActionsContext);if(!actions)return null;
 const node=[...actions.snapshot.folders,...actions.snapshot.favorites].find(n=>n.id===id);
 const draggable=!nativeIssue(node)&&(!folder||actions.snapshot.folders.some(n=>n.id===id&&n.renamable));
 return <span className="extra-actions"><AddMenu id={id} title={title} parentId={folder?id:undefined}/>{!actions.searching&&draggable&&<span className="drag-handle" data-drag-id={id} aria-hidden="true" title="Drag title to move · More → Move for keyboard">⠿</span>}</span>;
}
