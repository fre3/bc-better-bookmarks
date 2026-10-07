import { useState, type ReactNode } from 'react';
import type { Command, Snapshot } from '../core/model';
import { browserLabel } from '../browser/platform';
import { folderBindings } from './folder-bindings';
import { FolderBindingReview } from './FolderBindingReview';
import { LegacyManagement, ManagementDiagnostics } from './LegacyManagement';
import { MetadataSetup } from './MetadataSetup';
import './management.css';

type Area = 'Settings' | 'Bookmarks' | 'Diagnostics';
export function Management({snapshot,content,busy,execute,settings,onClose,onReview}:{snapshot:Snapshot;content:Snapshot;busy:boolean;execute:(c:Command)=>Promise<boolean>;settings:ReactNode;onClose:()=>void;onReview:()=>void}) {
 const [area,setArea]=useState<Area>('Settings');
 const [draft,setDraft]=useState(false);
 const [diagnosticsOpened,setDiagnosticsOpened]=useState(false);
 const pending=folderBindings(snapshot).length;
 return <section className="manage" aria-label="Manage Indexfold">
  <header className="manage-header"><div><h1 id="manage-title" tabIndex={-1}>Indexfold</h1><p>Your bookmarks, beautifully within reach.</p></div><button className="back-dashboard" onClick={onClose}>Back to dashboard</button></header>
  <p className="manage-description">A typography-first bookmark dashboard with instant search and keyboard navigation. Built for Chrome and Edge.</p>
  <nav className="manage-navigation" aria-label="Manage areas">{(['Settings','Bookmarks','Diagnostics'] as const).map(name=><button key={name} aria-current={area===name?'page':undefined} onClick={()=>{setArea(name);if(name==='Diagnostics')setDiagnosticsOpened(true);}}>{name}{name==='Bookmarks'&&pending>0?` · ${pending} to review`:''}</button>)}</nav>
  {draft&&area!=='Bookmarks'&&<p className="manage-draft">Your bookmark draft is retained. <button onClick={()=>setArea('Bookmarks')}>Return to draft</button></p>}
  {pending>0&&<p className="manage-review">Folder tags need review — {pending} received record{pending===1?'':'s'}. <button onClick={onReview}>Review</button></p>}
  <section hidden={area!=='Settings'} aria-labelledby="manage-settings"><h2 id="manage-settings">Settings</h2><p>Preferences apply on this device.</p>{settings}</section>
  <section hidden={area!=='Bookmarks'} aria-labelledby="manage-bookmarks"><h2 id="manage-bookmarks">Bookmarks</h2>
   <details id="folder-binding-review"><summary>Folder binding review{pending?` (${pending})`:''}</summary><FolderBindingReview snapshot={snapshot} execute={async c=>await execute(c)?undefined:{error:'Confirmation failed. Review refreshed candidates and Diagnostics.'}} /></details>
   <LegacyManagement s={content} tagSnapshot={snapshot} busy={busy} execute={execute} onDraftChange={setDraft}/>
  </section>
  <section hidden={area!=='Diagnostics'} aria-labelledby="manage-diagnostics"><h2 id="manage-diagnostics">Diagnostics</h2><p>Indexfold {snapshot.version} · pre-release · {browserLabel()}</p>
   {diagnosticsOpened&&<><ManagementDiagnostics s={snapshot} busy={busy} execute={execute}/>
   <MetadataSetup onReset={()=>void execute({type:'snapshot'})}/></>}
  </section>
 </section>;
}
