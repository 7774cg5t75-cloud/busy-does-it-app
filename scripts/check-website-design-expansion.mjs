import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {websiteBuilderTestHarnessV3222} from './lib/website-builder-test-harness-v3222.mjs';
import {originalWebsiteSectionRuntime} from './lib/original-website-section-runtime.mjs';
import {heroFamilies} from '../supabase/functions/busy-website-worker/websiteHeroFamilies.mjs';
import {premiumHeroInner,PREMIUM_HERO_COMPOSITIONS} from '../supabase/functions/busy-website-worker/websitePremiumHero.mjs';
import {premiumWebsiteDirections} from '../src/core/premiumWebsiteDirections.mjs';
import {planBusyGoal} from '../src/core/busyGoalPlan.mjs';
import {publicBusinessContent} from '../src/core/businessContentRecords.mjs';
const api=websiteBuilderTestHarnessV3222(['buildWebsiteDraft','renderWebsiteHtml','applyWebsiteLayoutChange','applyStructuredWebsiteEdit','rebuildPrivateWebsiteDraft']),worker=originalWebsiteSectionRuntime(),deps={fieldEdit:api.applyStructuredWebsiteEdit,layoutEdit:api.applyWebsiteLayoutChange,renderPage:api.renderWebsiteHtml,rebuild:api.rebuildPrivateWebsiteDraft};
const out='.test-artifacts/website-expansion';mkdirSync(out,{recursive:true});
// Five same-industry identities with different actual structures; not a numeric
// production limit. All inputs below are fictional reviewed test facts.
const cases=[
 ['Meadow & Moss','Gardening','asymmetric-split','airy','refined','rows',['Garden design','Planting plans'],'gallery','A design-led approach for small urban gardens.'],
 ['Groundwork Gardens','Gardening','service-led','compact','confident','outlines',['Ground preparation','Garden maintenance'],'services','Practical outdoor care for local households.'],
 ['Quiet Plot','Gardening','typography-first','airy','editorial','rows',['Seasonal advice','Planting support'],'about','Calm, thoughtful support for first-time gardeners.'],
 ['Wild Corner','Gardening','editorial-collage','signature','friendly','cards',['Planting design','Habitat gardens'],'gallery','Creative planting for natural outdoor spaces.'],
 ['Estate Garden Care','Gardening','cinematic-full-bleed','signature','compact','outlines',['Seasonal maintenance','Garden care'],'services','Clear service information for property owners.'],
 ['Ember Festival Kitchen','Festival catering','story-spread','signature','editorial','rows',['Festival food','Private catering'],'products','Owner supplied food and catering information.'],
 ['Stone & Seed','Independent retail','product-showcase','compact','confident','cards',['Garden accessories','Product information'],'products','Browse a small collection of outdoor materials.'],
 ['Stillwater Wellness','Beauty and wellness','quiet-portrait','airy','refined','cards',['Relaxation consultation','Treatment information'],'about','A calm approach for people seeking time to unwind.']
];
const images=['grass','gravel','coffee'];const result=[];
for(const [i,[name,type,family,variation,typography,cards,services,emphasis,description]] of cases.entries()){
 const businessId='aaaaaaaa-aaaa-4aaa-8aaa-'+String(i).padStart(12,'0');
 const photoNames=i===2?[]:i<5?['grass','gravel','brick']:i===5?['coffee','gravel','grass']:['gravel','grass','coffee'];
 const photos=photoNames.map((n,j)=>({uri:'https://assets.example.invalid/'+n+'.png',storagePath:'licensed/'+n+'-'+j+'.png',approved:true,...(j===1?{appearance:{photoCrop:'top'}}:j===2?{appearance:{photoFit:'contain'}}:{}),alt:(n==='coffee'?'CC0 coffee cup study':n==='grass'?'CC0 grass texture study':n==='brick'?'CC0 brick texture study':'CC0 gravel texture study')+' — licensed demonstration, not this business’s work'}));
 const brief={businessName:name,businessType:type,description,about:description+' Contact the fictional business to discuss your needs. Demonstration photographs are licensed studies, not evidence of completed work.',serviceArea:'Fictional local area',email:'example@example.invalid',phone:'',heroAsset:photos[0],photos,services:services.map((name,j)=>({id:'s'+j,name,description:'Owner supplied scope for '+name+'. Please enquire for details.'}))};
 let draft=api.buildWebsiteDraft({businessId,brandBrain:{websiteBrief:brief}});
 if(emphasis==='products'){
 const feed=publicBusinessContent([{id:'product_example_001',kind:'product',business_id:businessId,revision:1,published_revision:1,published:{name:i===5?'Festival bowl':'Decorative gravel sample',description:'Fictional owner-approved collection information.',category:i===5?'Food':'Materials',status:'active',amountMinor:800,currency:'GBP',availability:'not_tracked',image:null}}],businessId);
 const r=api.applyStructuredWebsiteEdit(draft,{action:'content-section',sectionId:'products',title:i===5?'Food collection':'Our collection',layout:i===5?'rows':'cards',previewFeed:feed});assert.equal(r.applied,true,r.reason);draft=r.draft;
 }
 const initialSuggestion=premiumWebsiteDirections(draft)[0]?.id;assert.equal(initialSuggestion,family,name+' should use its own approved context, not an industry-wide default');
 const before=api.renderWebsiteHtml(draft);const changes=[['heroComposition',family],['heroVariation',variation],['typography',typography],['cardLayout',cards]];
 for(const [field,value]of changes){if(draft.theme[field]===value)continue;const c=api.applyWebsiteLayoutChange(draft,{action:'style',field,value});assert.equal(c.applied,true,c.reason);draft=c.draft;}
 // Real section-order authority, independent of hero styling. No facts invented.
 const active=draft.sections.filter(s=>s.enabled!==false).map(s=>s.id),wanted=[active.find(x=>x==='hero'),emphasis,...active.filter(x=>!['hero',emphasis].includes(x))].filter(Boolean);
 if(active.includes(emphasis)&&emphasis!=='hero'){
 const beforeOrder=[...new Set([...(draft.designPlan.sectionOrder||[]).filter(id=>active.includes(id)),...active])],proposed=['hero',emphasis,...beforeOrder.filter(id=>!['hero',emphasis].includes(id))];
 if(JSON.stringify(beforeOrder)!==JSON.stringify(proposed)){
  const r=api.applyWebsiteLayoutChange(draft,{action:'apply-reviewed-composition',websiteId:draft.id,expectedGeneration:draft.generation,expectedBusinessId:businessId,before:beforeOrder,proposed});assert.equal(r.applied,true,r.reason);draft=r.draft;
 }
 assert.equal((draft.theme.sectionOrder||draft.designPlan.sectionOrder)[1],emphasis);
 }
 writeFileSync(out+'/'+i+'-reviewed.json',JSON.stringify(draft));
 const html=api.renderWebsiteHtml(draft),hero=draft.sections.find(s=>s.type==='hero'),urls=Object.fromEntries(photos.map(p=>[p.storagePath,p.uri]));
 assert.match(html,new RegExp('premium-'+family));const workerHtml=worker(draft,hero,urls,true,'#contact');assert.match(workerHtml,new RegExp('premium-'+family));if(family==='editorial-collage'){assert.ok(html.includes('hero-image owner-image-crop-top'));assert.ok(workerHtml.includes('hero-image owner-image-crop-top'));assert.ok(html.includes('hero-image owner-image-fit-contain'));assert.ok(workerHtml.includes('hero-image owner-image-fit-contain'));}
 assert.ok(html.includes(name.replaceAll('&','&amp;')));assert.equal(draft.publish.enabled,false);
 for(const variation of ['signature','airy','compact']){const h=premiumHeroInner(family,{copy:'<h1>Reviewed copy</h1>',services:'<p>Reviewed scope</p>',image:'<img alt="Approved fixture">',hasImage:true,variation});assert.ok(h.includes('premium-'+family));assert.equal(/undefined|NaN/.test(h),false);}
 const locked={...draft,theme:{...draft.theme,lockedSections:['hero']}};assert.equal(api.applyWebsiteLayoutChange(locked,{action:'style',field:'heroVariation',value:'compact'}).applied,false);
 assert.equal(api.applyWebsiteLayoutChange(draft,{action:'style',field:'heroComposition',value:'unknown-executable'}).applied,false);assert.equal(api.applyWebsiteLayoutChange(draft,{action:'style',field:'heroVariation',value:'url(javascript:alert(1))'}).applied,false);
 const corrected=api.applyStructuredWebsiteEdit(draft,{sectionId:'hero',field:'body',value:'Exact owner wording for '+name});assert.equal(corrected.applied,true);const rebuilt=api.buildWebsiteDraft({businessId,previousDraft:corrected.draft,brandBrain:{websiteBrief:brief}});assert.ok(api.renderWebsiteHtml(rebuilt).includes('Exact owner wording for '+name.replaceAll('&','&amp;')));
 const directions=premiumWebsiteDirections(draft);assert.equal(directions.some(d=>d.id===family),false);if(directions[0])assert.equal(premiumWebsiteDirections(draft,{rejected:[directions[0].id]}).some(d=>d.id===directions[0].id),false);
 const goal=planBusyGoal({request:'Try a completely different design',surface:'website',website:draft,businessId},deps);assert.equal(goal.ready,true,goal.question);assert.notEqual(goal.prepared.candidateHtml,html);assert.equal(goal.mayExecute,false);assert.equal(planBusyGoal({request:'Try a completely different design',surface:'website',website:draft,businessId:'foreign'},deps).ready,false);
 writeFileSync(out+'/'+i+'-before.html',before);writeFileSync(out+'/'+i+'-after.html',html);
 result.push({id:i,business:name,industry:type,initialSuggestion,family,variation,typography,cards,emphasis,sectionOrder:draft.theme.sectionOrder||draft.designPlan.sectionOrder,originalRenderer:'src/domain/websiteBuilder.js:renderWebsiteHtml',before:i+'-before.html',after:i+'-after.html',htmlSha256:createHash('sha256').update(html).digest('hex'),photos:photos.map(p=>p.uri)});
}
assert.equal(new Set(result.slice(0,5).map(x=>x.family)).size,5);assert.equal(new Set(result.slice(0,5).map(x=>x.typography+'|'+x.cards+'|'+x.emphasis)).size,5);for(const f of heroFamilies)assert.ok(result.some(r=>r.family===f.id),'Every current family must have actual original-renderer evidence: '+f.id);
assert.equal(premiumHeroInner('unknown',{copy:'bad'}),'');assert.equal(PREMIUM_HERO_COMPOSITIONS.length,heroFamilies.length); // registry agreement, not a permanent count ceiling
const noMedia={sections:[{type:'hero',body:'Owner description'}]};assert.equal(premiumWebsiteDirections(noMedia)[0].id,'typography-first');assert.equal(premiumWebsiteDirections(noMedia).some(x=>x.id==='cinematic-full-bleed'),false);
writeFileSync(out+'/scenarios.json',JSON.stringify({scenarios:result,registryIds:PREMIUM_HERO_COMPOSITIONS,permanentFamilyCeiling:null,syntheticBusinesses:true,photographsAreBusinessEvidence:false,publicActivation:false},null,2));console.log('PASS expandable registry, every reviewed family, five distinct same-industry/three additional industry fixtures, actual original renderer/worker, finite variations, source/lock/unknown-field denial and original goal proposals. Rendered quality is a separate browser stage.');
