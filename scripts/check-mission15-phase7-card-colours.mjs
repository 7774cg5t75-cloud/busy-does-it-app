import assert from 'node:assert/strict';
import {websiteBuilderTestHarnessV3222} from './lib/website-builder-test-harness-v3222.mjs';
import {originalWebsiteSectionRuntime} from './lib/original-website-section-runtime.mjs';
import {designForWebsite,designCss,PALETTES} from '../supabase/functions/busy-website-worker/designSystem.mjs';
import {textContrast,readableAccent} from '../supabase/functions/busy-website-worker/websiteTextColours.mjs';
import {textTypographyFields} from '../supabase/functions/busy-website-worker/websiteTextTypography.mjs';
import {planSelectedWebsiteChanges,prepareSelectedWebsiteTransaction} from '../src/core/websiteContextPlan.mjs';
const {buildWebsiteDraft,applyWebsiteLayoutChange,applyStructuredWebsiteEdit,renderWebsiteHtml}=websiteBuilderTestHarnessV3222(['buildWebsiteDraft','applyWebsiteLayoutChange','applyStructuredWebsiteEdit','renderWebsiteHtml']);
const first=buildWebsiteDraft({brandBrain:{websiteReady:true,websiteBrief:{businessName:'Fictional Garden',services:[{id:'survey',name:'Survey',description:'Ask about scope.'},{id:'repair',name:'Repair',description:'Ask about repairs.'}]}}});
const id=first.sections.find(s=>s.id==='services').items[0].id,render=originalWebsiteSectionRuntime();
for(const [field,values]of Object.entries(textTypographyFields))for(const value of values.filter(v=>v!=='brand')){
 const r=applyWebsiteLayoutChange(first,{action:'item-style',sectionId:'services',itemId:id,field,value});assert.ok(r.applied,field+value);
 const s=r.draft.sections.find(s=>s.id==='services'),html=renderWebsiteHtml(r.draft,'home'),hosted=render(r.draft,s,{},false),token='owner-text-'+field+'-'+value;
 assert.ok(html.includes('<article class="'+token+'">'));assert.ok(hosted.includes('<article class="'+token+'">'));assert.ok(!s.items[1].appearance,'Only exact selected item changes');
 assert.deepEqual(r.draft.theme,first.theme,'Brand DNA unchanged');
 const reset=applyWebsiteLayoutChange(r.draft,{action:'item-style',sectionId:'services',itemId:id,field,value:'brand'});assert.ok(reset.applied);assert.equal(reset.draft.sections.find(s=>s.id==='services').items[0].appearance,undefined);
}
const selection={draftId:first.id,generation:first.generation,pageId:'home',sectionId:'services',itemId:id,field:'title'};
const plan=planSelectedWebsiteChanges(first,'home',selection,'set this heading font to serif; set this heading colour to accent; make this heading bigger');assert.ok(plan.ok);
const r=prepareSelectedWebsiteTransaction(first,plan,{fieldEdit:applyStructuredWebsiteEdit,layoutEdit:applyWebsiteLayoutChange});assert.ok(r.applied);
const resetSize=applyWebsiteLayoutChange(r.draft,{action:'item-style',sectionId:'services',itemId:id,field:'headingScale',value:'normal'});assert.ok(resetSize.applied);
assert.equal(resetSize.draft.sections.find(s=>s.id==='services').items[0].appearance.titleFont,'serif','Size reset preserves other typography');
const locked={...first,theme:{...first.theme,lockedSections:['services']}};assert.equal(applyWebsiteLayoutChange(locked,{action:'item-style',sectionId:'services',itemId:id,field:'titleColour',value:'accent'}).applied,false);
for(const op of [{field:'__proto__',value:'bad'},{field:'constructor',value:'bad'},{field:'bodyFont',value:'url(https://bad.test)'},{field:'bodyColour',value:'#fff'},{field:'titleWeight',value:'1;display:none'}])assert.equal(applyWebsiteLayoutChange(first,{action:'item-style',sectionId:'services',itemId:id,...op}).applied,false);
// Genuine calculated solid-colour contrast, not screenshot or WCAG certification.
const businessTypes={nature:'garden',hospitality:'restaurant',wellness:'spa',professional:'accountant',trades:'plumber',creative:'artist',retail:'gift shop',learning:'tutor',events:'wedding planner',neutral:'other'};
const visited=new Set();
for(const sector of Object.keys(PALETTES))for(const mood of ['clean','warm','premium','bold'])for(const paletteVariant of ['a','b','c'])for(const primary of ['#ffffff','#000000','#ffd700','#aaccff']){
 const d=designForWebsite({businessType:businessTypes[sector],theme:{mood,primary},plan:{visualIdentity:{paletteVariant}}});
 visited.add(d.sector);
 const backgrounds=[d.paper,d.soft,'#ffffff'],dark=readableAccent(d.accent,backgrounds),darkBackgrounds=[d.ink,'#264D61','#285647','#402B2A'],light=readableAccent(d.accent,darkBackgrounds,true);
 for(const bg of backgrounds)assert.ok(textContrast(dark,bg)>=4.5);
 for(const bg of darkBackgrounds)assert.ok(textContrast(light,bg)>=4.5);
 const css=designCss(d);assert.ok(css.includes('--owner-dark-text-accent:'+dark));assert.ok(css.includes('.family-editorial section.hero,.family-boutique section.hero'));
}
assert.equal(visited.size,Object.keys(PALETTES).length,'Every canonical palette sector is exercised');
console.log('PASS exact card typography/colour and reset preservation, local/hosted render parity, locks/finite inputs, selected compound edit and calculated 4.5:1 accent contrast on supported canonical backgrounds. No screenshot/aesthetic claim.');
