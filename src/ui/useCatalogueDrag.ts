import { useEffect, useRef, useState, type Dispatch } from 'react';
import type { Command, Snapshot } from '../core/model';
import { nodeById, planMove, sourceToken, placementToken, type Placement } from '../core/operations';
import type { CatalogueAction, CatalogueState } from './catalogue-state';
import { folderNeedsReview } from './folder-bindings';
interface Drop {placement:Placement;token:string;label:string;rect:{left:number;top:number;width:number;height:number};invalid?:string}
export function useCatalogueDrag(snapshot:Snapshot,state:CatalogueState,enabled:boolean,dispatch:Dispatch<CatalogueAction>,execute?:(c:Command)=>Promise<unknown>,review?:(id?:string)=>void){
 const [active,setActive]=useState(false),[feedback,setFeedback]=useState<Drop>(),latest=useRef({snapshot,state,execute,review});latest.current={snapshot,state,execute,review};
 useEffect(()=>{if(!enabled)return;
 let captured:number|undefined;
 let source:string|undefined,expected='',generation:string|undefined,saved:CatalogueState|undefined,drop:Drop|undefined,hover:string|undefined,timer=0,frame=0,y=0,x=0,last=0;
 const clearHover=()=>{clearTimeout(timer);timer=0;hover=undefined;};
 const finish=()=>{if(captured!==undefined){if(document.documentElement.hasPointerCapture(captured))document.documentElement.releasePointerCapture(captured);captured=undefined;}if(!source)return;source=undefined;drop=undefined;clearHover();cancelAnimationFrame(frame);setActive(false);setFeedback(undefined);if(saved)dispatch({type:'view',openSection:saved.openSection,expanded:saved.expanded});saved=undefined;};
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
  const side=target.dataset.rootId?'end':folder&&fraction>.25&&fraction<.75?'end':fraction<.5?'before':'after';
  const placement:Placement=side==='end'?{parentId:id,side}:{parentId:node.parentId!,anchorId:id,side};
  const token=placementToken(s,placement),same=drop&&JSON.stringify(drop.placement)===JSON.stringify(placement);
  let invalid:string|undefined;
  try{planMove(s,source,placement);}catch(e){invalid=String(e).replace(/^Error: /,'');}
  drop={placement,token:same?drop!.token:token,label:invalid?`Cannot move: ${invalid}`:side==='end'?`Move inside ${node.title}`:`Insert ${side} ${node.title}`,invalid,rect:{left:side==='after'?rect.right:rect.left,top:rect.top,width:side==='end'?rect.width:2,height:rect.height}};
  setFeedback(drop);
  if(folder&&side==='end'&&!invalid&&hover!==id){clearHover();hover=id;timer=window.setTimeout(()=>{if(!source||hover!==id)return;const current=latest.current.snapshot.folders.find(f=>f.id===id);if(!current)return;const section=current.ancestorIds.length===2?current.id:current.ancestorIds[2];if(!section)return;dispatch({type:'view',openSection:`folder:${section}`,expanded:current.id===section?[]:[...current.ancestorIds.slice(3),current.id]});},650);}
  else if(!folder||side!=='end'||invalid)clearHover();
 };
 const tick=(time:number)=>{if(!source)return;const elapsed=Math.min(32,time-(last||time));last=time;const nav=document.querySelector('.catalogue-chrome')?.getBoundingClientRect().bottom??0;const edge=55;const speed=y>window.innerHeight-edge?Math.min(1,(y-window.innerHeight+edge)/edge):y<nav+edge?-Math.min(1,(nav+edge-y)/edge):0;if(speed){window.scrollBy(0,speed*elapsed*.45);over(document.elementFromPoint(x,y));}frame=requestAnimationFrame(tick);};
 let pending:{id:string;x:number;y:number;pointer:number;snapshot:Snapshot}|undefined;
 const down=(e:PointerEvent)=>{const handle=e.target instanceof Element?e.target.closest<HTMLElement>('[data-drag-id]'):null;if(!handle||e.button!==0||e.ctrlKey||e.metaKey||e.altKey||!latest.current.execute)return;e.preventDefault();captured=e.pointerId;document.documentElement.setPointerCapture(e.pointerId);pending={id:handle.dataset.dragId!,x:e.clientX,y:e.clientY,pointer:e.pointerId,snapshot:latest.current.snapshot};};
 const motion=(e:PointerEvent)=>{if(!pending||e.pointerId!==pending.pointer)return;if(!(e.buttons&1)){finish();pending=undefined;return;}x=e.clientX;y=e.clientY;
 if(!source){if(Math.hypot(x-pending.x,y-pending.y)<6)return;const s=pending.snapshot,id=pending.id;if(folderNeedsReview(s,id)){pending=undefined;latest.current.review?.(id);return;}source=id;expected=sourceToken(s,id);generation=s.metadata.setup?.generation;saved=latest.current.state;setActive(true);frame=requestAnimationFrame(tick);}
 e.preventDefault();if(e.ctrlKey||e.metaKey||e.altKey){drop=undefined;setFeedback(undefined);clearHover();return;}over(document.elementFromPoint(x,y));};
 const up=(e:PointerEvent)=>{if(!pending||e.pointerId!==pending.pointer)return;x=e.clientX;y=e.clientY;over(document.elementFromPoint(x,y));const id=source,intent=e.ctrlKey||e.metaKey||e.altKey?undefined:drop,token=expected,epoch=generation;pending=undefined;finish();if(!id||!intent||intent.invalid)return;void latest.current.execute?.({type:'move',id,expected:token,placement:intent.placement,destinationExpected:intent.token,generation:epoch});};
 const cancel=()=>{pending=undefined;finish();};
 const key=(e:KeyboardEvent)=>{if(pending&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();cancel();}};
 const preventNative=(e:DragEvent)=>e.preventDefault();
 const hidden=()=>{if(document.hidden)cancel();};
 document.addEventListener('pointerdown',down);document.addEventListener('pointermove',motion,{passive:false});document.addEventListener('pointerup',up);document.addEventListener('pointercancel',cancel);document.addEventListener('dragstart',preventNative);document.addEventListener('keydown',key,true);document.addEventListener('visibilitychange',hidden);window.addEventListener('blur',cancel);
 return()=>{cancel();document.removeEventListener('pointerdown',down);document.removeEventListener('pointermove',motion);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',cancel);document.removeEventListener('dragstart',preventNative);document.removeEventListener('keydown',key,true);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('blur',cancel);};
 },[enabled,dispatch]);
 return {active,feedback};
}
