import assert from 'node:assert/strict';
import {buildWebsiteDraft,applyStructuredWebsiteEdit,renderWebsiteHtml} from '../src/domain/websiteBuilder.js';
const businessId='16161616-1616-4161-8161-000000000001';
const brief={businessName:'Fictional Garden Studio',businessType:'Landscaping',description:'Owner-approved garden care introduction.',email:'garden@example.invalid',services:[{id:'garden-care',name:'Garden care',description:'Garden care discussed around the space, the people using it and the work they need.'}]};
const build=(source=brief,previousDraft=null,scope=businessId)=>buildWebsiteDraft({businessId:scope,brandBrain:{websiteBrief:source},previousDraft});
const edit=(draft,field,value)=>{const r=applyStructuredWebsiteEdit(draft,{sectionId:'hero',field,value});assert.equal(r.applied,true,r.reason);return r.draft;};
const hero=draft=>draft.sections.find(s=>s.id==='hero');
let passed=0;
function check(name,fn){fn();passed++;console.log('PASS '+name);}
check('finite CTA edits mark and preserve the exact reviewed label/local destination together',()=>{
 let d=build();d=edit(d,'cta','Discuss your garden');d=edit(d,'ctaHref','#services');d=edit(d,'title','An exact owner headline');assert.ok(hero(d).ownerEditedFields.includes('cta'));assert.ok(hero(d).ownerEditedFields.includes('ctaHref'));
 const original=JSON.stringify(d),next=build({...brief,description:'A newly approved introduction.',phone:'+44 1234 567890'},d);assert.equal(hero(next).cta,'Discuss your garden');assert.equal(hero(next).ctaHref,'#services');assert.equal(hero(next).title,'An exact owner headline');assert.equal(JSON.stringify(d),original);assert.match(renderWebsiteHtml(next),/href="#services"[^>]*>Discuss your garden<\/a>/);
});
check('unmodified default CTA still follows current approved facts',()=>{
 const next=build({...brief,phone:'+44 1234 567890'},build());assert.equal(hero(next).cta,'Call us');assert.equal(hero(next).ctaHref,'#contact');
});
check('removed local target disables the owner action without a guessed redirect',()=>{
 let d=edit(build(),'ctaHref','#services');d=edit(d,'cta','Explore our garden care');const next=build({...brief,services:[]},d);assert.equal(hero(next).cta,'Explore our garden care');assert.equal(hero(next).ctaHref,'');assert.ok(!renderWebsiteHtml(next).includes('>Explore our garden care</a>'));const again=build(brief,next);assert.equal(hero(again).ctaHref,'','Returning facts cannot silently reactivate a disabled approved destination');
});
check('lost contact route disables an enquiry; deliberately retained contact copy stays authoritative',()=>{
 const d=edit(build(),'cta','Discuss a garden enquiry'),next=build({...brief,email:'',serviceArea:'Devon'},d);assert.equal(hero(next).cta,'Discuss a garden enquiry');assert.equal(hero(next).ctaHref,'');
 const contactEdit=applyStructuredWebsiteEdit(d,{sectionId:'contact',field:'email',value:'owner-reviewed@example.invalid'});assert.equal(contactEdit.applied,true);const kept=build({...brief,email:'',serviceArea:'Devon'},contactEdit.draft);assert.equal(hero(kept).ctaHref,'#contact');assert.match(renderWebsiteHtml(kept),/mailto:owner-reviewed@example.invalid/);
});
check('foreign business scope and unmarked values do not acquire owner-copy permission',()=>{
 const d=edit(build(),'cta','Exact original owner label');const foreign=build({...brief,businessName:'Different fictional owner'},d,'16161616-1616-4161-8161-000000000099');assert.notEqual(hero(foreign).cta,'Exact original owner label');
 const unmarked=build();hero(unmarked).cta='Unreviewed mutated label';assert.notEqual(hero(build(brief,unmarked)).cta,'Unreviewed mutated label');
});
check('unsupported external, malformed and missing targets never survive as an active action',()=>{
 assert.equal(applyStructuredWebsiteEdit(build(),{sectionId:'hero',field:'ctaHref',value:'https://unreviewed.example.invalid/'}).applied,false);
 for(const value of ['javascript:alert(1)','https://unreviewed.example.invalid/','#missing-section']){const d=edit(build(),'cta','Owner reviewed words');hero(d).ctaHref=value;const next=build(brief,d);assert.equal(hero(next).ctaHref,'');assert.ok(!renderWebsiteHtml(next).includes(value));}
});
console.log('PASS '+passed+' owner CTA refresh cases; zero failures. Original finite edits and renderer only; no customer actions, providers, publication or hosted writes.');
