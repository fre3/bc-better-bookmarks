import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
/** Same native modality and single-layer Escape semantics as the item editor. */
export function OperationDialog({title,dirty,busy,onClose,children}:{title:string;dirty:boolean;busy:boolean;onClose:()=>void;children:ReactNode}) {
 const resume=useRef<HTMLElement|null>(null);
 const ref=useRef<HTMLDialogElement>(null),[discard,setDiscard]=useState(false);
 useLayoutEffect(()=>{const d=ref.current!,root=document.documentElement,old=root.style.overflow,gutter=root.style.scrollbarGutter;
 if(window.innerWidth>root.clientWidth)root.style.scrollbarGutter='stable';root.style.overflow='hidden';d.showModal();d.querySelector<HTMLElement>('input,select,button')?.focus({preventScroll:true});
 return()=>{d.close();root.style.overflow=old;root.style.scrollbarGutter=gutter;};},[]);
 const close=()=>{if(busy)return;if(dirty){resume.current=document.activeElement as HTMLElement;setDiscard(true);}else onClose();};
 useLayoutEffect(()=>{if(discard)ref.current?.querySelector<HTMLElement>('[data-continue]')?.focus();else if(resume.current){resume.current.focus({preventScroll:true});resume.current=null;}},[discard]);
 return <dialog ref={ref} className="favorite-editor operation-dialog" aria-labelledby="operation-title" onCancel={e=>{e.preventDefault();e.stopPropagation();if(discard)setDiscard(false);else close();}} onKeyDownCapture={e=>{
 if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(e.repeat)return;if(discard){setDiscard(false);ref.current?.querySelector<HTMLElement>('input,select')?.focus();}else close();}
 if(e.key==='Tab'){const stops=[...e.currentTarget.querySelectorAll<HTMLElement>('input:not(:disabled),textarea:not(:disabled),select:not(:disabled),button:not(:disabled)')].filter(n=>!n.closest('[inert]'));const first=stops[0],last=stops.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
 }}><h2 id="operation-title">{title}</h2><div inert={discard}>{children}<div className="editor-actions"><button type="button" disabled={busy} onClick={close}>Cancel</button></div></div>
 {discard&&<div role="alertdialog" aria-label="Discard changes?"><p>Discard these unsaved changes?</p><button type="button" onClick={onClose}>Discard changes</button>{' · '}<button type="button" data-continue onClick={()=>{setDiscard(false);ref.current?.querySelector<HTMLElement>('input,select')?.focus();}}>Continue editing</button></div>}
 </dialog>;
}
