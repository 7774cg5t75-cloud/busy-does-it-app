import assert from 'node:assert/strict';
import {selectRecordedWebsiteDeployment as select} from '../src/core/websiteDeploymentSelection.mjs';
import {planWebsitePageInstructions as plan,prepareWebsitePageInstructionPreview as preview} from '../src/core/websitePageInstructions.mjs';
import {applyWebsiteLayoutOperation as layout} from '../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs';
const live={id:'version-1',state:'live'};
assert.equal(select({website:{current_preview_deployment_id:live.id,current_live_deployment_id:live.id},deployments:[live]}),live);
assert.equal(select({website:{current_preview_deployment_id:live.id,current_live_deployment_id:'other'},deployments:[live]}),null);
assert.equal(select({deployments:[live]}),null);
assert.equal(select({website:{current_preview_deployment_id:live.id,current_live_deployment_id:live.id},deployments:[live,live]}),null);
const d={id:'draft',generation:3,businessId:'business',theme:{},pages:[{id:'home',sectionIds:['hero','services','about','contact']}],sections:[
{id:'hero',type:'hero',title:'Welcome'},{id:'services',type:'services',title:'Services'},
{id:'about',type:'about',title:'About'},{id:'contact',type:'contact',title:'Contact'}]};
const req=instruction=>({draftId:d.id,generation:3,pageId:'home',instruction});
const apply=(draft,op)=>{const out=layout(draft,op);return out.applied?{...out,draft:{...out.draft,generation:draft.generation+1}}:out;};
const renderPage=draft=>'<!doctype html><html><body>'+JSON.stringify(draft.theme)+JSON.stringify(draft.sections)+'</body></html>';
for(const instruction of ['move the about section above the services section','move the services section below the contact form','make the about section look more premium','make the whole page easier to read']){
 const before=JSON.stringify(d),p=plan(d,req(instruction));assert.equal(p.ok,true,p.reason);
 const out=preview(d,req(instruction),{layoutEdit:apply,renderPage});assert.equal(out.ok,true,out.reason);assert.notEqual(out.originalHtml,out.candidateHtml);assert.equal(JSON.stringify(d),before);
}
const op=plan(d,req('move the about section above the services section')).steps[0].change;
assert.deepEqual(layout(d,op).draft.theme.sectionOrder,['hero','about','services','contact']);
for(const bad of [{...op,pageId:'foreign'},{...op,targetSectionId:'hero'},{...op,targetSectionId:'missing'},{...op,sectionId:'hero'}])assert.equal(layout(d,bad).applied,false);
assert.equal(layout({...d,theme:{lockedSections:['services']}},op).applied,false,'Cannot shift a locked neighbour');
assert.equal(preview({...d,theme:{lockedSections:['about']}},req('make the about section more premium'),{layoutEdit:apply,renderPage}).ok,false);
assert.equal(plan(d,req('make the about section more premium; give the about section more space')).ok,false);
assert.equal(plan(d,{...req('move the about section above the services section'),generation:2}).ok,false);
assert.equal(plan(d,req('make the whole page easier to read; publish website')).ok,false);
console.log('Mission15: canonical promoted preview, relative section navigation, grouped private edits, stale/lock/overlap safety PASS');

assert.equal(plan(d,req('make the whole page easier to read only on phones')).ok,false,'Global theme cannot masquerade as phone-only text changes');

const rendered={...d,designPlan:{sectionOrder:['hero','about','services','contact']}};
const relative={action:'move-relative',sectionId:'contact',targetSectionId:'about',position:'before',pageId:'home'};
assert.deepEqual(layout(rendered,relative).draft.theme.sectionOrder,['hero','contact','about','services']);
assert.equal(layout({...rendered,theme:{lockedSections:['about']}},relative).applied,false,'Protect the actual rendered lock position, not raw storage order');
