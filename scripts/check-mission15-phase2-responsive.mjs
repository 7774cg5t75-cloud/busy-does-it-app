import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {websiteBuilderTestHarnessV3222} from './lib/website-builder-test-harness-v3222.mjs';
import {planWebsitePageInstructions} from '../src/core/websitePageInstructions.mjs';
import {interpretSelectedWebsiteRequest} from '../src/core/websiteContextualEdit.mjs';
import {sectionAppearanceClasses} from '../supabase/functions/busy-website-worker/websiteAppearanceClasses.mjs';
import {applyWebsiteLayoutOperation} from '../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs';
const {buildWebsiteDraft,applyWebsiteLayoutChange,renderWebsiteHtml}=websiteBuilderTestHarnessV3222(['buildWebsiteDraft','applyWebsiteLayoutChange','renderWebsiteHtml']);
const d=buildWebsiteDraft({businessId:'business-a',brandBrain:{websiteReady:true,websiteBrief:{businessName:'Example repair',businessType:'Repair',description:'Owner supplied words',services:[{name:'Survey',description:'Discuss first'}],email:'hello@example.test'}}});
const req={draftId:d.id,pageId:'home',generation:d.generation,instruction:'make the whole page easier to read only on phones'};
const p=planWebsitePageInstructions(d,req);assert.equal(p.ok,true,p.reason);const before=JSON.stringify(d),out=applyWebsiteLayoutChange(d,p.steps[0].change);assert.equal(out.applied,true,out.reason);assert.equal(JSON.stringify(d),before);
assert.deepEqual(out.draft.theme,d.theme);assert.ok(out.draft.sections.some(s=>s.appearance?.mobileBodyScale==='large'));assert.ok(out.draft.sections.every(s=>!s.appearance?.desktopBodyScale));
for(const old of d.sections){const next=out.draft.sections.find(s=>s.id===old.id);const {appearance,...same}=next;const {appearance:prior,...original}=old;assert.deepEqual(same,original);}
const html=renderWebsiteHtml(out.draft,'home');assert.ok(html.includes('owner-mobile-body-large'));assert.equal(sectionAppearanceClasses({appearance:{mobileBodyScale:'large',bodyScale:'evil'} }),'owner-mobile-body-large');
const op={action:'page-reading',pageId:'home',device:'mobile'};assert.equal(applyWebsiteLayoutOperation(d,{...op,device:'arbitrary'}).applied,false);assert.equal(applyWebsiteLayoutOperation(d,{...op,pageId:'foreign'}).applied,false);
assert.equal(applyWebsiteLayoutOperation({...d,theme:{...d.theme,lockedSections:['hero']}},op).applied,false,'No partial update past a lock');assert.equal(JSON.stringify(d),before);
assert.equal(applyWebsiteLayoutOperation(out.draft,op).applied,false,'No redundant changes');
const section=d.sections.find(s=>s.id==='hero'),selection={pageId:'home',generation:d.generation,sectionId:section.id,field:'body'};
assert.equal(interpretSelectedWebsiteRequest(d,'home',selection,'make this paragraph easier to read on phones').change.field,'mobileBodyScale');
assert.equal(interpretSelectedWebsiteRequest(d,'home',{...selection,field:'title'},'make this paragraph easier to read on phones').ok,false);
for(const path of ['src/domain/websiteBuilder.js','supabase/functions/busy-website-worker/index.ts'])assert.ok(readFileSync(path,'utf8').includes('import {sectionAppearanceClasses}'),'Both renderers use the same finite class generator');
// Inspect each real media block rather than assuming the last phone block is
// the original reading rule; selected paragraph controls legitimately add more.
const mediaBlocks=[];
for(const match of html.matchAll(/@media\(([^)]+)\)\{/g)){
 let depth=1,end=match.index+match[0].length;
 for(;end<html.length&&depth;end++){if(html[end]==='{')depth++;else if(html[end]==='}')depth--;}
 assert.equal(depth,0,'Media block must close');
 mediaBlocks.push({query:match[1],css:html.slice(match.index+match[0].length,end-1)});
}
const readingBlocks=mediaBlocks.filter(block=>block.css.includes('section.owner-mobile-body-large'));
assert.equal(readingBlocks.length,1);assert.equal(readingBlocks[0].query,'max-width:600px');
assert.ok(!readingBlocks[0].css.includes('owner-desktop-body-large'));
assert.ok(mediaBlocks.some(block=>block.query==='min-width:960px'&&block.css.includes('owner-desktop-body-large')));
console.log('PASS scoped phone reading through actual builder HTML, immutable content/theme, shared hosted/export classes, locks and no-op guards. CSS/source evidence, not browser measurement.');
