// Controlled comparison of the original Mission16 and current Website Builder.
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
import {prepareWholeWebsite} from '../src/core/wholeWebsitePlan.mjs';
import {stableJson} from '../src/core/stableJson.mjs';
import {mission16Fixture,mission16Assets} from './lib/mission16-site-fixtures.mjs';
const BASE='1f7feadb3bccbf87084da1813bea8655641ee616',baselineRoot=process.env.BUSY_MISSION17_BASELINE_ROOT;
assert.ok(baselineRoot,'Provide the genuine pinned Mission16 archive root.');
const hash=x=>createHash('sha256').update(x).digest('hex'),git=async(...a)=>(await promisify(execFile)('git',a,{encoding:'utf8'})).stdout.trim();
assert.equal(hash(readFileSync(resolve(baselineRoot,'scripts/lib/mission16-site-fixtures.mjs'))),hash(readFileSync('scripts/lib/mission16-site-fixtures.mjs')),'Approved facts/assets/preferences fixture must remain unchanged. New source richness needs a separate comparison.');
const oldApi=await import(pathToFileURL(resolve(baselineRoot,'src/domain/websiteBuilder.js')).href),oldPlanner=await import(pathToFileURL(resolve(baselineRoot,'src/core/wholeWebsitePlan.mjs')).href),oldFixtures=await import(pathToFileURL(resolve(baselineRoot,'scripts/lib/mission16-site-fixtures.mjs')).href);
const folder='.test-artifacts/mission17-sites';mkdirSync(folder,{recursive:true});
const assets=mission16Assets().map(x=>({url:x.url,file:x.file,sha256:x.sha256,mimeType:x.mimeType,outputPath:'assets/mission16-'+(x.name==='patio'?'patio.jpg':x.name),provenance:{license:x.license||'CC0',source:x.descriptionUrl||x.licenseEvidence,credit:x.credit||null,usage:'Licensed illustration only; never actual products, premises or completed work of the fictional business.'}}));
for(const file of ['scripts/fixtures/website-art-direction/assets.json','scripts/fixtures/guided-websites/assets.json',...assets.map(a=>a.file)])assert.equal(hash(readFileSync(resolve(baselineRoot,file))),hash(readFileSync(file)),'Original Mission16 licensed fixture/provenance changed: '+file);
function approved(c){return {scope:{ownerId:c.ownerId,businessId:c.businessId,profileRevision:c.profileRevision},profile:c.profile,contentRecords:c.website.sections.filter(s=>['products','events'].includes(s.type)).map(s=>({sectionId:s.id,source:s.contentSource,feed:s.previewFeed})),photos:c.sourcePhotos.map(x=>({file:x.file,sha256:x.sha256,width:x.width,height:x.height})),customerAction:c.website.sections.find(s=>s.type==='hero')?.cta,brand:{family:c.website.theme.heroComposition,direction:c.website.theme.pageDirection,variation:c.website.theme.heroVariation}};}
function requiredText(draft,page){return page.sectionIds.flatMap(id=>{const section=draft.sections.find(s=>s.id===id);return ['products','events'].includes(section?.type)?section.previewFeed.records.filter(r=>r.kind===(section.type==='products'?'product':'event')&&['active','scheduled'].includes(r.data.status)).map(r=>r.data.name):section?.type==='services'?section.items.map(i=>i.title):section?.body?(page.sourceServiceId||page.id==='about'?section.body.split(/\n\s*\n/).filter(Boolean):[section.body.split(/\n\s*\n/)[0].slice(0,50)]):[];});}
const sites=[];
for(let i=0;i<3;i++)for(const sparse of [false,true]){
 const current=mission16Fixture(i,{sparse}),prior=oldFixtures.mission16Fixture(i,{sparse}),facts=approved(current);
 assert.equal(stableJson(approved(prior)),stableJson(facts),'Before and after must receive identical approved synthetic business facts, assets and owner style preferences.');
 const a=oldPlanner.prepareWholeWebsite(prior,{pageEdit:oldApi.applyWebsitePageChange,renderPage:oldApi.renderWebsiteHtml}),b=prepareWholeWebsite(current,{pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml});assert.ok(a.ok,a.reason);assert.ok(b.ok,b.reason);
 const id=['moor-meadow','ember','quiet-light'][i]+(sparse?'-sparse':'-rich'),assetFiles=Object.fromEntries(current.sourcePhotos.map(x=>['approved/mission16/'+x.name,'assets/mission16-'+(x.name==='patio'?'patio.jpg':x.name)])),pages=[];
 const beforeRoutes=a.candidate.pages.map(p=>[p.id,p.path,p.outputPath]),afterRoutes=b.candidate.pages.map(p=>[p.id,p.path,p.outputPath]);assert.deepEqual(afterRoutes,beforeRoutes,'Route removal/addition needs separately labelled evidence, not an invented before page.');
 writeFileSync(folder+'/'+id+'-approved-source.json',JSON.stringify({...facts,sourceMode:'Unchanged Mission16 explicitly supplied fictional owner-reviewed fixture; no live account or independent copyright claim.'},null,2)+'\n');
 writeFileSync(folder+'/'+id+'-before-model.json',JSON.stringify(a.candidate,null,2)+'\n');writeFileSync(folder+'/'+id+'-after-model.json',JSON.stringify(b.candidate,null,2)+'\n');
 for(const p of b.candidate.pages){const beforePage=a.candidate.pages.find(x=>x.id===p.id),before=id+'-'+p.id+'-before.html',after=id+'-'+p.id+'-after.html';writeFileSync(folder+'/'+before,oldApi.renderWebsiteHtml(a.candidate,p.id,{standalone:true,assetFiles}));writeFileSync(folder+'/'+after,renderWebsiteHtml(b.candidate,p.id,{standalone:true,assetFiles}));
  pages.push({id:p.id,title:p.title,path:p.path,outputPath:p.outputPath,before,after,requiredTextBefore:requiredText(a.candidate,beforePage),requiredTextAfter:requiredText(b.candidate,p),important:p.sourceServiceId==='service-0'||['about','contact','products'].includes(p.id),reviewPack:p.path==='/'||p.sourceServiceId==='service-0'||['services','about','contact','products'].includes(p.id)});
 }
 // A second comparison keeps the FINAL model fixed to expose pure renderer
 // differences. It is distinct from the main before/after planning journey.
 const rendererOnly=[];for(const p of b.candidate.pages.filter(p=>p.path==='/'||p.sourceServiceId==='service-0'||p.id==='about')){const name=id+'-'+p.id+'-same-model-before.html';writeFileSync(folder+'/'+name,oldApi.renderWebsiteHtml(b.candidate,p.id,{standalone:true,assetFiles}));rendererOnly.push({page:p.id,before:name,after:pages.find(x=>x.id===p.id).after,comparison:'Identical final model/facts/assets; only the original renderer version differs.'});}
 sites.push({id,businessName:current.website.businessName,brandLabel:current.website.brandLabel,pages,sourceRichness:sparse?'sparse':'rich',expectedServiceGroup:b.candidate.sitePresentation==='purposeful-v1'&&b.candidate.customPages.filter(p=>p.sourceServiceId).length>1,comparisonKind:'Identical approved Mission16 facts/assets/preferences; original Mission16 planner+renderer versus current original planner+renderer. Models/compositions may change; not a CSS-only comparison.',approvedInputDigest:hash(stableJson(facts)),beforeSource:{commit:BASE},beforeModelDigest:hash(stableJson(a.candidate)),afterModelDigest:hash(stableJson(b.candidate)),resources:{before:a.stats,after:b.stats},rendererOnly,actualGeneration:'Original buildWebsiteDraft → finite whole-site planner → original finite page editor → original renderWebsiteHtml. Fixture prose and brand preferences supplied manually; no live AI or hosted save.',portfolioEvidenceSupplied:false});
}
const source={commit:await git('rev-parse','HEAD'),tree:await git('rev-parse','HEAD^{tree}'),workingTreeDirty:!!await git('status','--porcelain'),before:BASE};
writeFileSync(folder+'/scenarios.json',JSON.stringify({version:1,mission:17,source,generatedBy:'Genuine original Website Builder; fixed Mission16 fictional approved-source fixtures',comparisonProvenance:'Source-controlled implementation comparison and separately labelled identical-model renderer controls.',assets,sites,providerCalls:0,accountSaveClaimed:false,goldStandardsApproved:0,reviewPack:{phoneWidth:390,format:'Offline evidence viewer and screenshot comparisons, not a business website or publication.'}},null,2)+'\n');
console.log('Prepared Mission17: '+sites.length+' same-source original-renderer sites, '+sites.reduce((n,s)=>n+s.pages.length,0)+' pages. Zero model/provider/hosted actions.');
