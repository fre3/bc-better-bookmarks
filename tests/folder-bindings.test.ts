import { describe, it, expect } from 'vitest';
import { folderBindings } from '../src/ui/folder-bindings';
import type { Snapshot } from '../src/core/model';
function snapshot(): Snapshot {
  return { folders: [{ id: 'folder', renamable: true }], metadata: { invalid: [], records: [{ stableId: 'one', tags: ['work'], initialLocator: { kind: 'folder' } }] }, local: { mappings: {} }, reconciliation: { matches: [{stableId:'one',status:'unresolved',candidateIds:['folder']}] } } as unknown as Snapshot;
}
describe('folder binding review presentation', () => {
 it('distinguishes received actionable tags from ambiguity without attaching anything', () => {
  const s=snapshot(), before=structuredClone(s);
  expect(folderBindings(s,false)[0]).toMatchObject({available:true,ambiguous:false});expect(s).toEqual(before);
  s.reconciliation.matches[0].status='ambiguous';expect(folderBindings(s,false)[0]).toMatchObject({available:false,ambiguous:true});
  s.reconciliation.matches[0].status='local-mapping';expect(folderBindings(s,false)).toEqual([]);
 });
 it('does not offer competing, managed, invalid or already-bound candidates for confirmation', () => {
  for(const state of ['competing','managed','invalid','bound'] as const) {
   const s=snapshot();
   if(state==='competing')s.reconciliation.matches.push({stableId:'other',status:'unresolved',candidateIds:['folder']});
   if(state==='managed')s.folders[0].renamable=false;
   if(state==='invalid')s.metadata.invalid.push('invalid');
   if(state==='bound')s.local.mappings.folder={stableId:'another'} as never;
   expect(folderBindings(s,true)[0].available).toBe(false);
  }
 });
 it('respects archive visibility and does not count missing candidates as actionable',()=>{
  const s=snapshot();s.metadata.records[0].tags=['archived'];expect(folderBindings(s,false)).toEqual([]);expect(folderBindings(s,true)).toHaveLength(1);
  s.reconciliation.matches[0].candidateIds=[];expect(folderBindings(s,true)[0].available).toBe(false);
 });
});
