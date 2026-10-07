import { itemMetadataIssue } from '../core/item-metadata-health';
import { useEffect, useRef, useState, type Dispatch } from 'react';
import type { Command, Snapshot } from '../core/model';
import { childrenOf, nodeById, planMove, sourceToken, placementToken, type Placement } from '../core/operations';
import type { CatalogueAction, CatalogueState } from './catalogue-state';
import { folderNeedsReview } from './folder-bindings';
interface Drop {placement:Placement;token:string;label:string;rect:{left:number;top:number;width:number;height:number};invalid?:string}
export function useCatalogueDrag(snapshot:Snapshot,state:CatalogueState,enabled:boolean,dispatch:Dispatch<CatalogueAction>,execute?:(c:Command)=>Promise<unknown>,review?:(id?:string)=>void){
 const [preview,setPreview]=useState<{id:string;title:string;x:number;y:number}>();
 const [active,setActive]=useState(false),[feedback,setFeedback]=useState<Drop>(),latest=useRef({snapshot,state,execute,review});latest.current={snapshot,state,execute,review};
 useEffect(()=>{if(!enabled)return;
 let captured:number|undefined; let suppressClick=false;
 let source:string|undefined,expected='',generation:string|undefined,saved:CatalogueState|undefined,drop:Drop|undefined,hover:string|undefined,timer=0,frame=0,y=0,x=0,last=0;
 const clearHover=()=>{clearTimeout(timer);timer=0;hover=undefined;};
 const finish=()=>{if(captured!==undefined){if(document.documentElement.hasPointerCapture(captured))document.documentElement.releasePointerCapture(captured);captured=undefined;}if(!source)return;source=undefined;drop=undefined;clearHover();cancelAnimationFrame(frame);setActive(false);setPreview(undefined);setFeedback(undefined);if(saved)dispatch({type:'view',openSection:saved.openSection,expanded:saved.expanded});saved=undefined;};
 const over=(element:Element|null)=>{
  if(!source)return;const {snapshot:s}=latest.current;
  if(!element || element.closest('[inert],.item-actions,.item-edit-action,.drag-handle,dialog')){drop=undefined;setFeedback(undefined);clearHover();return;}
  const target=element.closest<HTMLElement>('[data-root-id],.catalogue-item,.section-header');
  const id=target?.dataset.rootId??target?.dataset.itemId??target?.closest<HTMLElement>('[data-section-id]')?.dataset.sectionId?.replace(/^(folder|loose):/,'');
  if(!id||!target){drop=undefined;setFeedback(undefined);clearHover();return;}
  const node=nodeById(s,id);if(!node)return;
  const label=target.matches('.catalogue-item')?target.querySelector('.bookmark-title,.folder-trigger,.folder-title'):target.querySelector('.section-heading-text')??target;
  const rects=label?[...label.getClientRects()]:[target.getBoundingClientRect()];
  const hit=rects.find(r=>r.width>0&&y>=r.top&&y<=r.bottom)??rects.find(r=>r.width>0);if(!hit)return;
  // Inline title endings and wbr segments can create several rectangles on one
  // line. Treat that rendered line as one unit, including favicon/semicolon.
  const line=rects.filter(r=>r.width>0&&Math.abs(r.top-hit.top)<2);const left=Math.min(...line.map(r=>r.left)),right=Math.max(...line.map(r=>r.right)),top=Math.min(...line.map(r=>r.top)),bottom=Math.max(...line.map(r=>r.bottom));
  const rect={left,right,top,bottom,width:right-left,height:bottom-top};
  const fraction=(x-rect.left)/Math.max(1,rect.width),folder=node.url===undefined;
  const inside=Boolean(target.dataset.rootId)||folder&&fraction>.25&&fraction<.75;
  const lookup=(nodeId:string)=>[...document.querySelectorAll<HTMLElement>('.catalogue-item,.section-slot')].find(el=>!el.closest('[inert]')&&(el.dataset.itemId===nodeId||el.dataset.sectionId===`folder:${nodeId}`));
  const siblings=childrenOf(s,node.parentId??'');
  const next=siblings.slice(siblings.findIndex(n=>n.id===id)+1).find(n=>n.id!==source&&lookup(n.id));
  const placement:Placement=inside?{parentId:id,side:'end'}:fraction<.5?{parentId:node.parentId!,anchorId:id,side:'before'}:next?{parentId:node.parentId!,anchorId:next.id,side:'before'}:{parentId:node.parentId!,side:'end'};
  let marker={left:rect.left,top:rect.top,width:inside?rect.width:2,height:rect.height};
  if(!inside&&placement.side==='before'){
   const at=lookup(placement.anchorId!),title=at?.querySelector('.bookmark-title,.folder-trigger,.section-heading-text'),first=title&&[...title.getClientRects()].find(r=>r.width>0);
   if(at?.matches('.section-slot')){const r=at.getBoundingClientRect();const gutter=Math.max(0,first?.left??rect.left);marker={left:gutter,top:r.top,width:Math.max(20,r.width-2*gutter),height:2};}
   else if(first)marker={left:first.left-4,top:first.top,width:2,height:first.height};
  }else if(!inside){
   const at=lookup(id);
   if(at?.matches('.section-slot')){const r=at.getBoundingClientRect();marker={left:rect.left,top:r.bottom-2,width:Math.max(20,r.width-2*rect.left),height:2};}
   else {const expanded=at?.nextElementSibling?.matches('.folder-children')?at.nextElementSibling:undefined;const ending=expanded??at?.querySelector('.extra-actions')??label;const r=ending&&[...ending.getClientRects()].filter(r=>r.width>0).at(-1);if(r)marker={left:r.right+4,top:r.bottom-rect.height,width:2,height:rect.height};}
  }
  if(!inside&&placement.anchorId===source){drop=undefined;setFeedback(undefined);clearHover();return;}
  const token=placementToken(s,placement),same=drop&&JSON.stringify(drop.placement)===JSON.stringify(placement);
  let invalid:string|undefined;
  try{const issue=itemMetadataIssue(s,source);if(issue)throw Error(issue);planMove(s,source,placement);}catch(e){invalid=String(e).replace(/^Error: /,'');}
  if(invalid?.includes('already in that position')){drop=undefined;setFeedback(undefined);clearHover();return;}
  const destinationName=placement.side==='before'?nodeById(s,placement.anchorId!)?.title:nodeById(s,placement.parentId)?.title;
  drop={placement,token:same?drop!.token:token,label:invalid?`Cannot move: ${invalid}`:inside?`Move inside ${node.title}`:placement.side==='before'?`Insert before ${destinationName} in ${s.folders.find(f=>f.id===placement.parentId)?.path.join(' / ')}`:`End of ${destinationName} (native order, including hidden items)`,invalid,rect:marker};
  setFeedback(drop);
  if(folder&&inside&&!invalid&&hover!==id){clearHover();hover=id;timer=window.setTimeout(()=>{if(!source||hover!==id)return;const current=latest.current.snapshot.folders.find(f=>f.id===id);if(!current)return;const section=current.ancestorIds.length===2?current.id:current.ancestorIds[2];if(!section)return;dispatch({type:'view',openSection:`folder:${section}`,expanded:current.id===section?[]:[...current.ancestorIds.slice(3),current.id]});},650);}
  else if(!folder||!inside||invalid)clearHover();
 };
 const tick=(time:number)=>{if(!source)return;const elapsed=Math.min(32,time-(last||time));last=time;const nav=document.querySelector('.catalogue-chrome')?.getBoundingClientRect().bottom??0;const edge=55;const speed=y>window.innerHeight-edge?Math.min(1,(y-window.innerHeight+edge)/edge):y<nav+edge?-Math.min(1,(nav+edge-y)/edge):0;if(speed){window.scrollBy(0,speed*elapsed*.45);over(document.elementFromPoint(x,y));}frame=requestAnimationFrame(tick);};
 let pending:{id:string;x:number;y:number;pointer:number;snapshot:Snapshot}|undefined;
 const down=(e:PointerEvent)=>{suppressClick=false;const element=e.target instanceof Element?e.target:null;const handle=element?.closest<HTMLElement>('[data-drag-id],[data-drag-title]');if(!handle||element?.closest('.item-actions,.item-edit-action,dialog')||e.button!==0||e.ctrlKey||e.metaKey||e.altKey||!latest.current.execute)return;
 const bounds=handle.querySelector('.section-heading-text')??handle;if(![...bounds.getClientRects()].some(r=>e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom))return;
 suppressClick=false;if(handle.dataset.dragId)e.preventDefault();pending={id:handle.dataset.dragId??handle.dataset.dragTitle!,x:e.clientX,y:e.clientY,pointer:e.pointerId,snapshot:latest.current.snapshot};};
 const motion=(e:PointerEvent)=>{if(!pending||e.pointerId!==pending.pointer)return;if(!(e.buttons&1)){finish();pending=undefined;return;}x=e.clientX;y=e.clientY;
 if(!source){if(Math.hypot(x-pending.x,y-pending.y)<6)return;const s=pending.snapshot,id=pending.id;if(folderNeedsReview(s,id)){pending=undefined;latest.current.review?.(id);return;}captured=e.pointerId;document.documentElement.setPointerCapture(e.pointerId);suppressClick=true;window.getSelection()?.removeAllRanges();source=id;expected=sourceToken(s,id);generation=s.metadata.setup?.generation;saved=latest.current.state;setActive(true);frame=requestAnimationFrame(tick);}
 setPreview({id:source!,title:nodeById(pending.snapshot,source!)?.title||'(untitled)',x:Math.max(8,Math.min(x+16,window.innerWidth-Math.min(300,window.innerWidth-16)-8)),y:Math.max(8,Math.min(y+20,window.innerHeight-84))});
 e.preventDefault();if(e.ctrlKey||e.metaKey||e.altKey){drop=undefined;setFeedback(undefined);clearHover();return;}over(document.elementFromPoint(x,y));};
 const up=(e:PointerEvent)=>{if(!pending||e.pointerId!==pending.pointer)return;x=e.clientX;y=e.clientY;over(document.elementFromPoint(x,y));const id=source,intent=e.ctrlKey||e.metaKey||e.altKey?undefined:drop,token=expected,epoch=generation;pending=undefined;finish();if(!id||!intent||intent.invalid)return;void latest.current.execute?.({type:'move',id,expected:token,placement:intent.placement,destinationExpected:intent.token,generation:epoch});};
 const cancel=()=>{pending=undefined;finish();};
 const key=(e:KeyboardEvent)=>{if(pending&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();cancel();}};
 const click=(e:MouseEvent)=>{if(suppressClick&&e.detail>0){suppressClick=false;e.preventDefault();e.stopImmediatePropagation();}};
 const preventNative=(e:DragEvent)=>e.preventDefault();
 const hidden=()=>{if(document.hidden)cancel();};
 document.addEventListener('click',click,true);document.addEventListener('pointerdown',down);document.addEventListener('pointermove',motion,{passive:false});document.addEventListener('pointerup',up);document.addEventListener('pointercancel',cancel);document.addEventListener('dragstart',preventNative);document.addEventListener('keydown',key,true);document.addEventListener('visibilitychange',hidden);window.addEventListener('blur',cancel);
 return()=>{cancel();document.removeEventListener('click',click,true);document.removeEventListener('pointerdown',down);document.removeEventListener('pointermove',motion);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',cancel);document.removeEventListener('dragstart',preventNative);document.removeEventListener('keydown',key,true);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('blur',cancel);};
 },[enabled,dispatch]);
 return {active,feedback,preview};
}
