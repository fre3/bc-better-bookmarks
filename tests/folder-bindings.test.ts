import { describe, it, expect } from 'vitest';
import { folderBindings, folderNeedsReview } from '../src/ui/folder-bindings';
import type { Snapshot } from '../src/core/model';
function snapshot(): Snapshot {
  return { folders: [{ id: 'folder', renamable: true, ancestorIds: ['0','root'] }], metadata: { invalid: [], records: [{ stableId: 'one', tags: ['work'], initialLocator: { kind: 'folder' } }] }, local: { mappings: {} }, reconciliation: { mappings: {}, matches: [{stableId:'one',status:'unresolved',candidateIds:['folder']}] } } as unknown as Snapshot;
}
describe('folder binding review presentation', () => {
 it('blocks unresolved edit paths but permits resolved and genuinely new folders', () => {
  const s=snapshot();expect(folderNeedsReview(s,'folder')).toBe(true);expect(folderNeedsReview(s,'new')).toBe(false);
  s.reconciliation.mappings.folder={stableId:'one'} as never;expect(folderNeedsReview(s,'folder')).toBe(false);
  delete s.reconciliation.mappings.folder;s.reconciliation.matches=[];s.local.mappings.folder={stableId:'missing'} as never;
  expect(folderNeedsReview(s,'folder')).toBe(true);
 });
 it('distinguishes received actionable tags from ambiguity without attaching anything', () => {
  const s=snapshot(), before=structuredClone(s);
  expect(folderBindings(s)[0]).toMatchObject({available:true,ambiguous:false});expect(s).toEqual(before);
  s.reconciliation.matches[0].status='ambiguous';expect(folderBindings(s)[0]).toMatchObject({available:false,ambiguous:true});
  s.reconciliation.matches[0].status='local-mapping';expect(folderBindings(s)).toEqual([]);
 });
 it('does not offer competing, managed, invalid or already-bound candidates for confirmation', () => {
  for(const state of ['competing','managed','invalid','bound'] as const) {
   const s=snapshot();
   if(state==='competing')s.reconciliation.matches.push({stableId:'other',status:'unresolved',candidateIds:['folder']});
   if(state==='managed')s.folders[0].unmodifiable='managed';
   if(state==='invalid')s.metadata.invalid.push('invalid');
   if(state==='bound')s.local.mappings.folder={stableId:'another'} as never;
   expect(folderBindings(s)[0].available).toBe(false);
  }
 });
 it('includes archived and missing records for administrative review',()=>{
  const s=snapshot();s.metadata.records[0].tags=['archived'];expect(folderBindings(s)).toHaveLength(1);
  s.reconciliation.matches[0].candidateIds=[];expect(folderBindings(s)[0].available).toBe(false);
 });
});
