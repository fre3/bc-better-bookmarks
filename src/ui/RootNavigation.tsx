import { useLayoutEffect, useRef, useState } from 'react';
export function RootNavigation({roots,scope,onChange}:{roots:{id:string;title:string}[];scope:string;onChange:(id:string)=>void}) {
 const restoreFocus=useRef(false),mode=useRef(false);
 const host=useRef<HTMLElement>(null),tabs=useRef<HTMLDivElement>(null),select=useRef<HTMLSelectElement>(null),[compact,setCompact]=useState(false);
 useLayoutEffect(()=>{const node=host.current!,row=tabs.current!;const measure=()=>{const next=row.scrollWidth>node.clientWidth;if(next!==mode.current){restoreFocus.current=row.contains(document.activeElement)||document.activeElement===select.current;mode.current=next;setCompact(next);}};const observer=new ResizeObserver(measure);observer.observe(node);observer.observe(row);measure();return()=>observer.disconnect();},[]);
 useLayoutEffect(()=>{if(!restoreFocus.current)return;restoreFocus.current=false;if(compact)select.current?.focus({preventScroll:true});else tabs.current?.querySelector<HTMLElement>('[aria-current]')?.focus({preventScroll:true});},[compact]);
 return <nav ref={host} className={`root-navigation${compact?' compact-roots':''}`} aria-label="Bookmark roots">
 <div ref={tabs} className="root-tabs" inert={compact} aria-hidden={compact}>{roots.map((root,index)=><button key={root.id} data-root-id={root.id==='*'?undefined:root.id} aria-current={scope===root.id?'page':undefined} title={`${root.title}${index<9?` · Alt+${index+1}`:''}`} aria-keyshortcuts={index<9?`Alt+${index+1}`:undefined} onClick={()=>onChange(root.id)}>{root.title||'(untitled root)'}</button>)}</div>
 <select ref={select} className="root-selector" hidden={!compact} aria-label={`Current root: ${roots.find(r=>r.id===scope)?.title}. Select bookmark root`} title={`${roots.find(r=>r.id===scope)?.title} · Alt+1–9 follows the root order`} value={scope} onChange={e=>onChange(e.target.value)}>{roots.map(root=><option key={root.id} value={root.id}>{root.title||'(untitled root)'}</option>)}</select>
 </nav>;
}
