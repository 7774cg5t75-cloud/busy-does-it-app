// Controlled original Mission17 baseline versus reviewed OFFLINE synthetic creative fixture.
// No real model response, provider receipt, account save or model-superiority claim.
// Facts, assets and supplied brand preferences are held fixed; planner/model and
// renderer changes are deliberately labelled rather than called CSS-only gains.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {applyWebsitePageChange,renderWebsiteHtml} from '../src/domain/websiteBuilder.js';
import {prepareWholeWebsite,keepWholeWebsite,wholeWebsiteSource} from '../src/core/wholeWebsitePlan.mjs';
import {prepareWebsiteDesignIntelligence,createOfflineWebsiteDesignIntelligence} from '../src/core/websiteDesignIntelligence.mjs';
import {deterministicWebsiteCreativeSpecification} from '../supabase/functions/busy-website-worker/websiteCreativeSpecification.mjs';
import {stableJson} from '../src/core/stableJson.mjs';
import {websiteRequestContent} from '../src/core/websiteRequestPlan.mjs';
import {mission16Fixture,mission16Assets} from './lib/mission16-site-fixtures.mjs';
const BASE='1cf94b61010f8061e3333c3aaf7ccfbabce5c6ea',baselineRoot=process.env.BUSY_MISSION18_BASELINE_ROOT;
assert.ok(baselineRoot,'Provide the genuine pinned Mission17 archive root.');
const hash=x=>createHash('sha256').update(x).digest('hex'),git=async(...a)=>(await promisify(execFile)('git',a,{encoding:'utf8'})).stdout.trim();
assert.equal(hash(readFileSync(resolve(baselineRoot,'scripts/lib/mission16-site-fixtures.mjs'))),hash(readFileSync('scripts/lib/mission16-site-fixtures.mjs')),'Approved facts/assets/preferences fixture must remain unchanged. New source richness needs a separate comparison.');
assert.equal(hash(readFileSync('scripts/lib/mission16-site-fixtures.mjs')),'ab8f48985f3312a15de929882db6706cab48c5e81b41e7dceef1ae1808f17cbc','Exact original approved synthetic fixture authority required.');
const oldApi=await import(pathToFileURL(resolve(baselineRoot,'src/domain/websiteBuilder.js')).href),oldPlanner=await import(pathToFileURL(resolve(baselineRoot,'src/core/wholeWebsitePlan.mjs')).href),oldFixtures=await import(pathToFileURL(resolve(baselineRoot,'scripts/lib/mission16-site-fixtures.mjs')).href);
const folder='.test-artifacts/mission18-sites';mkdirSync(folder,{recursive:true});
const assets=mission16Assets().map(x=>({url:x.url,file:x.file,sha256:x.sha256,mimeType:x.mimeType,outputPath:'assets/mission16-'+(x.name==='patio'?'patio.jpg':x.name),provenance:{license:x.license||'CC0',source:x.descriptionUrl||x.licenseEvidence,credit:x.credit||null,usage:'Licensed illustration only; never actual products, premises or completed work of the fictional business.'}}));
for(const file of ['scripts/fixtures/website-art-direction/assets.json','scripts/fixtures/guided-websites/assets.json',...assets.map(a=>a.file)])assert.equal(hash(readFileSync(resolve(baselineRoot,file))),hash(readFileSync(file)),'Original Mission16 licensed fixture/provenance changed: '+file);
function approved(c){return {scope:{ownerId:c.ownerId,businessId:c.businessId,profileRevision:c.profileRevision},profile:c.profile,contentRecords:c.website.sections.filter(s=>['products','events'].includes(s.type)).map(s=>({sectionId:s.id,source:s.contentSource,feed:s.previewFeed})),photos:c.sourcePhotos.map(x=>({file:x.file,sha256:x.sha256,width:x.width,height:x.height})),customerAction:c.website.sections.find(s=>s.type==='hero')?.cta,brand:{family:c.website.theme.heroComposition,direction:c.website.theme.pageDirection,variation:c.website.theme.heroVariation}};}
function requiredText(draft,page){return page.sectionIds.flatMap(id=>{const section=draft.sections.find(s=>s.id===id);return ['products','events'].includes(section?.type)?section.previewFeed.records.filter(r=>r.kind===(section.type==='products'?'product':'event')&&['active','scheduled'].includes(r.data.status)).map(r=>r.data.name):section?.type==='services'?section.items.map(i=>i.title):section?.body?(page.sourceServiceId||page.id==='about'?section.body.split(/\n\s*\n/).filter(Boolean):[section.body.split(/\n\s*\n/)[0].slice(0,50)]):[];});}
const deps={pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml};
async function keepInOriginalSession(review,context){
 let current=context,dispatches=0;
 const result=await keepWholeWebsite(review,{getContext:()=>current,apply:operation=>{
  dispatches++;const edited=applyWebsitePageChange(current.website,operation);assert.ok(edited.applied,edited.reason);
  const independentSessionReadback=JSON.parse(JSON.stringify(edited.draft));current={...current,website:edited.draft};
  return {applied:true,localPrivateReadback:{websiteDraft:independentSessionReadback}};
 }});
 assert.ok(result.ok,result.reason);assert.equal(result.accountSaved,false);assert.equal(dispatches,1);
 const repeated=await keepWholeWebsite(review,{getContext:()=>current,apply:()=>{throw Error('Duplicate fixture callback must not execute');}});assert.equal(repeated.ok,false);assert.equal(dispatches,1);
 return {context:current,receipt:{...result,source:'Original Keep → original finite page editor → exact detached local session readback; NOT hosted account persistence.',dispatches,duplicateCallbackDenied:true}};
}
const sites=[],ownerSpacingControls=[];
for(let i=0;i<3;i++)for(const sparse of [false,true]){
 const current=mission16Fixture(i,{sparse}),prior=oldFixtures.mission16Fixture(i,{sparse}),facts=approved(current);
 assert.equal(stableJson(approved(prior)),stableJson(facts),'Before and after must receive identical approved synthetic business facts, assets and owner style preferences.');
 const a=oldPlanner.prepareWholeWebsite(prior,{pageEdit:oldApi.applyWebsitePageChange,renderPage:oldApi.renderWebsiteHtml}),initial=prepareWholeWebsite(current,deps);assert.ok(a.ok,a.reason);assert.ok(initial.ok,initial.reason);
 const prepared=await keepInOriginalSession(initial,current),sourceContext=prepared.context;
 const seed=deterministicWebsiteCreativeSpecification(sourceContext.website,'Keep my words but redesign the whole website');assert.ok(seed.ok,seed.reason);
 // Explicitly authored deterministic response fixture. It exercises the proposed
 // creative contract; it is never represented as a genuine AI design decision.
 const specification=JSON.parse(JSON.stringify(seed.specification));
 for(const choice of specification.pages){
  const page=sourceContext.website.pages.find(p=>p.id===choice.pageId);
  if(i===0){choice.rhythm=page.id==='contact'?'compact':'balanced';choice.measure=page.sourceServiceId?'focused':'wide';choice.alignment=page.sourceServiceId?'start':choice.alignment;}
  if(i===1){choice.opening=['products','services','contact'].includes(page.id)?'compact':'split';choice.measure='wide';choice.rhythm=page.id==='contact'?'compact':'balanced';choice.alignment='start';choice.emphasis=page.id==='products'||page.id==='contact'?'contrast':'quiet';}
  if(i===2){choice.opening=['services','contact'].includes(page.id)?'compact':'display';choice.measure='focused';choice.alignment=page.id==='contact'?'start':'offset';choice.rhythm=page.id==='about'?'generous':page.id==='contact'?'compact':'balanced';choice.emphasis=page.sourceServiceId||page.id==='contact'?'contrast':'quiet';}
 }
 const creativeInput=await prepareWebsiteDesignIntelligence(sourceContext,{goal:'Keep my words but redesign the whole website'});assert.ok(creativeInput.ok,creativeInput.reason);
 let offlineResponses=0;const offline=createOfflineWebsiteDesignIntelligence(input=>{offlineResponses++;return {origin:'deterministic-offline-fixture',proposal:{version:'busy.website-design-intelligence.v1',scope:input.scope,explanation:'Manually supplied offline synthetic creative-response fixture for same-source rendering. No model was called and no design superiority is established.',specification}};});
 const intelligence=await offline.review(creativeInput,()=>sourceContext,deps);assert.ok(intelligence.ok,intelligence.reason);assert.equal(intelligence.providerCalls,0);assert.equal(intelligence.modelQualityProven,false);assert.equal(offlineResponses,1);
 const repeatedResponse=await offline.review(creativeInput,()=>sourceContext,deps);assert.equal(repeatedResponse.ok,false);assert.equal(offlineResponses,1,'A consumed offline comparison must not replay or disguise duplicate dispatch.');
 const b=intelligence.review;
 assert.equal(stableJson(b.candidate.sections),stableJson(initial.candidate.sections),'Creative fixture must preserve every exact owner word, original source, photograph, crop and supported destination.');
 const creativeKept=await keepInOriginalSession(b,sourceContext);assert.equal(websiteRequestContent(creativeKept.context.website),websiteRequestContent(b.candidate),'Original independently read-back request content must match exactly, excluding transient timestamps/render cache as in original Keep authority.');
 const id=['moor-meadow','ember','quiet-light'][i]+(sparse?'-sparse':'-rich'),assetFiles=Object.fromEntries(current.sourcePhotos.map(x=>['approved/mission16/'+x.name,'assets/mission16-'+(x.name==='patio'?'patio.jpg':x.name)])),pages=[];
 if(i===2&&!sparse){
  // Regression controls are extra original-renderer pages, never demonstration
  // websites or an AI result. The same explicit owner spacing must prevail
  // with and without a reviewed creative specification.
  for(const page of [b.candidate.pages.find(p=>p.id==='home'),b.candidate.pages.find(p=>p.sourceServiceId)].filter(Boolean)){
   const styled=JSON.parse(JSON.stringify(b.candidate)),sectionId=page.id==='home'?styled.sections.find(s=>s.type==='hero')?.id:page.sectionIds[0];
   const section=styled.sections.find(s=>s.id===sectionId);assert.ok(section);
   section.appearance={...(section.appearance||{}),sectionSpacing:'generous',mobileSectionSpacing:'generous',desktopSectionSpacing:'compact'};
   const plain=JSON.parse(JSON.stringify(styled));delete plain.creativeSpecification;
   const before='owner-spacing-'+page.id+'-plain.html',after='owner-spacing-'+page.id+'-directed.html';
   writeFileSync(folder+'/'+before,renderWebsiteHtml(plain,page.id,{standalone:true,assetFiles}));writeFileSync(folder+'/'+after,renderWebsiteHtml(styled,page.id,{standalone:true,assetFiles}));
   ownerSpacingControls.push({site:id,pageId:page.id,sectionId,before,after,selector:page.id==='home'?'.hero>.wrap':'.purpose-service-opening',ownerAppearance:section.appearance,generatedBy:'Original renderWebsiteHtml with identical explicit owner-spacing fixture; only creative specification presence differs.'});
  }
 }
 const beforeRoutes=a.candidate.pages.map(p=>[p.id,p.path,p.outputPath]),afterRoutes=b.candidate.pages.map(p=>[p.id,p.path,p.outputPath]);assert.deepEqual(afterRoutes,beforeRoutes,'Route removal/addition needs separately labelled evidence, not an invented before page.');
 writeFileSync(folder+'/'+id+'-approved-source.json',JSON.stringify({...facts,sourceMode:'Unchanged Mission16 explicitly supplied fictional owner-reviewed fixture; no live account or independent copyright claim.'},null,2)+'\n');
 writeFileSync(folder+'/'+id+'-offline-review.json',JSON.stringify({origin:'deterministic-offline-fixture',genuineModelResult:false,providerReceipt:null,inputDigest:creativeInput.inputDigest,inputScope:creativeInput.scope,inputBytes:Buffer.byteLength(stableJson(creativeInput.input)),schema:creativeInput.schema,offlineResponses,specification,originalSiteKeep:prepared.receipt,creativeKeep:creativeKept.receipt},null,2)+'\n');
 writeFileSync(folder+'/'+id+'-before-model.json',JSON.stringify(a.candidate,null,2)+'\n');writeFileSync(folder+'/'+id+'-after-model.json',JSON.stringify(b.candidate,null,2)+'\n');
 for(const p of b.candidate.pages){const beforePage=a.candidate.pages.find(x=>x.id===p.id),before=id+'-'+p.id+'-before.html',after=id+'-'+p.id+'-after.html';writeFileSync(folder+'/'+before,oldApi.renderWebsiteHtml(a.candidate,p.id,{standalone:true,assetFiles}));writeFileSync(folder+'/'+after,renderWebsiteHtml(b.candidate,p.id,{standalone:true,assetFiles}));
  pages.push({id:p.id,title:p.title,path:p.path,outputPath:p.outputPath,before,after,requiredTextBefore:requiredText(a.candidate,beforePage),requiredTextAfter:requiredText(b.candidate,p),important:p.sourceServiceId==='service-0'||['about','contact','products'].includes(p.id),reviewPack:p.path==='/'||p.sourceServiceId==='service-0'||['services','about','contact','products'].includes(p.id)});
 }
 // A second comparison keeps the FINAL model fixed to expose pure renderer
 // differences. It is distinct from the main before/after planning journey.
 const rendererOnly=[];for(const p of b.candidate.pages.filter(p=>p.path==='/'||p.sourceServiceId==='service-0'||p.id==='about')){const name=id+'-'+p.id+'-same-model-before.html';writeFileSync(folder+'/'+name,oldApi.renderWebsiteHtml(b.candidate,p.id,{standalone:true,assetFiles}));rendererOnly.push({page:p.id,before:name,after:pages.find(x=>x.id===p.id).after,comparison:'Identical final model/facts/assets; only the original renderer version differs.'});}
 sites.push({id,businessName:current.website.businessName,brandLabel:current.website.brandLabel,pages,sourceRichness:sparse?'sparse':'rich',expectedServiceGroup:b.candidate.sitePresentation==='purposeful-v1'&&b.candidate.customPages.filter(p=>p.sourceServiceId).length>1,comparisonKind:'Identical approved Mission16 facts/assets/preferences; original Mission17 deterministic planner+renderer versus current original builder with reviewed OFFLINE synthetic creative specification. Models/compositions may change; not a CSS-only comparison.',approvedInputDigest:hash(stableJson(facts)),websiteSourceDigest:hash(wholeWebsiteSource({...current,website:b.candidate})),beforeSource:{commit:BASE},beforeModelDigest:hash(stableJson(a.candidate)),afterModelDigest:hash(stableJson(b.candidate)),resources:{before:a.stats,after:b.stats},creativeOrigin:'deterministic-offline-fixture',genuineModelResult:false,sessionKeepEvidence:creativeKept.receipt,rendererOnly,actualGeneration:'Original buildWebsiteDraft → finite whole-site planner → original Keep/local readback → reviewed OFFLINE synthetic creative-response fixture → original Keep/local readback → original renderWebsiteHtml. No real model output or hosted save.',portfolioEvidenceSupplied:false});
}
const source={commit:await git('rev-parse','HEAD'),tree:await git('rev-parse','HEAD^{tree}'),workingTreeDirty:!!await git('status','--porcelain'),before:BASE};
writeFileSync(folder+'/scenarios.json',JSON.stringify({version:1,mission:18,source,generatedBy:'Genuine original Website Builder; fixed Mission16 fictional approved-source fixtures',comparisonProvenance:'Identical approved facts/assets/preferences. Original Mission17 deterministic baseline versus original renderer with a reviewed OFFLINE synthetic-response fixture. No real model or superiority claim. Separate identical-final-model renderer controls are also retained.',assets,sites,ownerSpacingControls,providerCalls:0,accountSaveClaimed:false,goldStandardsApproved:0,reviewPack:{phoneWidth:390,format:'Offline evidence viewer and screenshot comparisons, not a business website or publication.'}},null,2)+'\n');
console.log('Prepared Mission18: '+sites.length+' same-source original-renderer sites, '+sites.reduce((n,s)=>n+s.pages.length,0)+' pages. Zero model/provider/hosted actions.');
