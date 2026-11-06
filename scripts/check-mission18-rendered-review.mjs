// Actual sandboxed original-renderer PNGs enter the existing visual-review
// boundary. This does not invent aesthetic observations or execute model vision.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {prepareWebsiteVisualReview,reviewWebsiteVisualRecommendations} from '../src/core/websiteDesignIntelligence.mjs';
import {wholeWebsiteSource} from '../src/core/wholeWebsitePlan.mjs';
import {stableJson} from '../src/core/stableJson.mjs';
import {mission16Fixture} from './lib/mission16-site-fixtures.mjs';
import {chromium} from 'playwright';

const folder=resolve(process.argv[2]||'.test-artifacts/mission18-sites'),read=name=>JSON.parse(readFileSync(resolve(folder,name),'utf8'));
const manifest=read('scenarios.json'),browser=read('browser-results.json'),hash=bytes=>createHash('sha256').update(bytes).digest('hex'),copy=value=>JSON.parse(JSON.stringify(value));
assert.equal(manifest.mission,18);assert.equal(browser.sandboxRequired,true);assert.deepEqual(browser.failures,[]);assert.equal(browser.providerCalls,0);
assert.equal(browser.source.commit,manifest.source.commit);assert.equal(browser.source.tree,manifest.source.tree);assert.equal(browser.source.workingTreeChanged,false);
const results=[],receipts=[],ownerSpacingReceipts=[];
const chromiumVerifier=await chromium.launch({headless:true,chromiumSandbox:true});
async function verifyDecodedScreenshot(png){
 const context=await chromiumVerifier.newContext({javaScriptEnabled:false,serviceWorkers:'block'}),page=await context.newPage();
 await page.route('**/*',route=>route.abort('blockedbyclient'));
 try{
  await page.setContent('<img alt="Original screenshot decode verification" src="data:image/png;base64,'+Buffer.from(png).toString('base64')+'">',{waitUntil:'load'});
  await page.locator('img').evaluate(image=>image.decode());
  const actual=await page.locator('img').evaluate(image=>({width:image.naturalWidth,height:image.naturalHeight}));
  return {decoded:true,sha256:hash(png),...actual};
 }finally{await context.close();}
}
const check=(site,name,result,expected)=>{assert.equal(result.ok,expected,site+': '+name);results.push({site,name,passed:true,expectedOutcome:expected?'bound-read-only-review':'denied'});};
try{for(const [index,site] of manifest.sites.filter(site=>site.sourceRichness==='rich').entries()){
 const fixture=mission16Fixture(index),website=read(site.id+'-after-model.json'),context={...fixture,website};
 const before=stableJson(website),rows=browser.results.filter(row=>row.site===site.id&&row.stage==='after'&&((row.page==='home'&&row.label==='mobile')||(row.page==='about'&&row.label==='desktop')||(row.page===site.pages.find(page=>page.id.startsWith('page-'))?.id&&row.label==='desktop'))).slice(0,3);
 assert.ok(rows.length>=2,'Actual Home and internal-page screenshots required');
 const imageBytes=new Map(rows.map(row=>[row.filename,new Uint8Array(readFileSync(resolve(folder,row.filename)))]));
 for(const row of rows)assert.equal(hash(imageBytes.get(row.filename)),row.sha256,'Read the exact original PNG, never a compact JPEG or generated concept');
 const evidence={version:'busy.website-rendered-evidence.v1',sourceCommit:manifest.source.commit,sourceTree:manifest.source.tree,websiteSourceDigest:site.websiteSourceDigest,captures:rows.map(row=>({id:row.filename,pageId:row.page,sha256:row.sha256,browser:{name:'Chromium',version:browser.browser},viewport:{...row.viewport,dpr:row.dpr},assetManifestSha256:hash(stableJson(manifest.assets)),kind:'actual-original-renderer'}))};
 const pipelineReceipts=new Map(evidence.captures.map(capture=>[capture.id,{version:'busy.website-capture-receipt.v1',sourceCommit:browser.source.commit,sourceTree:browser.source.tree,websiteSourceDigest:site.websiteSourceDigest,capture:copy(capture)}]));
 assert.equal(hash(wholeWebsiteSource(context)),site.websiteSourceDigest,'Original built model and independently retained capture source must agree');
 const options={readScreenshot:id=>({bytes:imageBytes.get(id),receipt:pipelineReceipts.get(id)}),verifyDecodedScreenshot},prepared=await prepareWebsiteVisualReview(context,evidence,options);check(site.id,'actual original PNG/source/browser receipt accepted',prepared,true);
 assert.equal(prepared.visionExecuted,false);assert.equal(prepared.pixelsSentToModel,false);assert.equal(prepared.providerCalls,0);assert.equal(prepared.mayExecute,false);
 receipts.push({site:site.id,sourceDigest:prepared.sourceDigest,evidence:prepared.evidence,visionExecuted:false,pixelsSentToModel:false,modelQualityProven:false,aestheticDecision:null});
 const changedBytes=new Map(imageBytes);const first=evidence.captures[0].id,altered=new Uint8Array(changedBytes.get(first));altered[altered.length-1]^=1;changedBytes.set(first,altered);
 check(site.id,'changed original PNG bytes denied',await prepareWebsiteVisualReview(context,evidence,{...options,readScreenshot:id=>({bytes:changedBytes.get(id),receipt:pipelineReceipts.get(id)})}),false);
 const truncated=imageBytes.get(first).slice(0,33),truncatedEvidence=copy(evidence);truncatedEvidence.captures=[{...truncatedEvidence.captures[0],sha256:hash(truncated)}];
 check(site.id,'hash-matching PNG header without decodable pixels denied',await prepareWebsiteVisualReview(context,truncatedEvidence,{...options,readScreenshot:()=>({bytes:truncated,receipt:{...pipelineReceipts.get(first),capture:truncatedEvidence.captures[0]}})}),false);
 check(site.id,'absent independent actual decoder denied',await prepareWebsiteVisualReview(context,evidence,{readScreenshot:options.readScreenshot}),false);
 check(site.id,'forged decode dimensions denied',await prepareWebsiteVisualReview(context,evidence,{...options,verifyDecodedScreenshot:(png,expected)=>({decoded:true,sha256:hash(png),width:expected.width+1,height:expected.height})}),false);

 const wrongPage=copy(evidence);wrongPage.captures[0].pageId='foreign-business-page';check(site.id,'foreign page screenshot denied',await prepareWebsiteVisualReview(context,wrongPage,options),false);
 const relabelled=copy(evidence);relabelled.captures[0].pageId=website.pages.find(page=>page.id!==relabelled.captures[0].pageId).id;check(site.id,'actual PNG relabelled as another current page denied',await prepareWebsiteVisualReview(context,relabelled,options),false);
 const falseBrowser=copy(evidence);falseBrowser.captures[0].browser.version+='-forged';check(site.id,'forged browser provenance denied',await prepareWebsiteVisualReview(context,falseBrowser,options),false);
 check(site.id,'unreceipted raw PNG bytes denied',await prepareWebsiteVisualReview(context,evidence,{...options,readScreenshot:id=>imageBytes.get(id)}),false);
 const wrongDigest={...evidence,websiteSourceDigest:'0'.repeat(64)};check(site.id,'incorrect website source digest denied',await prepareWebsiteVisualReview(context,wrongDigest,options),false);
 const stale={...context,website:{...website,generation:website.generation+1}};check(site.id,'stale current source denied',await prepareWebsiteVisualReview(stale,evidence,options),false);
 const inventedOrigin={version:'busy.website-visual-review.v1',origin:'real-model',sourceDigest:prepared.sourceDigest,findings:[],specification:website.creativeSpecification};
 check(site.id,'offline evidence cannot invent real model review',reviewWebsiteVisualRecommendations(prepared,inventedOrigin,context,{}),false);
 check(site.id,'empty aesthetic findings grant no edit authority',reviewWebsiteVisualRecommendations(prepared,{...inventedOrigin,origin:'deterministic-offline-fixture'},context,{}),false);
 assert.equal(stableJson(website),before,'Screenshot review preparation must not change or save the business website');
}
assert.equal(manifest.ownerSpacingControls.length,2,'Exercise original Home and service-page owner spacing');
for(const control of manifest.ownerSpacingControls)for(const width of [390,1440]){
 const values=[];
 for(const stage of ['before','after']){
  const context=await chromiumVerifier.newContext({viewport:{width,height:1000},javaScriptEnabled:false,serviceWorkers:'block'}),page=await context.newPage();await page.route('**/*',route=>route.abort('blockedbyclient'));
  try{
   assert.ok(/^owner-spacing-[-a-z0-9]+-(?:plain|directed)\.html$/.test(control[stage]));await page.setContent(readFileSync(resolve(folder,control[stage]),'utf8'),{waitUntil:'load'});
   const value=await page.locator(control.selector).first().evaluate(element=>{const css=getComputedStyle(element);return {paddingTop:css.paddingTop,paddingBottom:css.paddingBottom,creativeSite:document.body.classList.contains('creative-site'),automaticOpeningSpace:document.body.classList.contains('creative-auto-opening-space')};});
   assert.equal(value.creativeSite,stage==='after','Compare a real directed page, not two unstyled controls');assert.equal(value.automaticOpeningSpace,false,'Explicit owner spacing must suppress automatic opening padding');values.push({stage,...value});
  }finally{await context.close();}
 }
 assert.deepEqual([values[1].paddingTop,values[1].paddingBottom],[values[0].paddingTop,values[0].paddingBottom],'Creative direction must preserve exact computed original owner spacing at '+width+'px on '+control.pageId);
 ownerSpacingReceipts.push({site:control.site,pageId:control.pageId,width,selector:control.selector,ownerAppearance:control.ownerAppearance,values,passed:true});
 results.push({site:control.site,name:'original explicit owner '+control.pageId+' spacing retained at '+width+'px',passed:true,expectedOutcome:'owner-spacing-preserved'});
}
}finally{await chromiumVerifier.close();}
const report={source:browser.source,browser:browser.browser,passed:results.length,failed:0,positiveReadOnlyBindings:results.filter(row=>row.expectedOutcome==='bound-read-only-review').length,negativeDenials:results.filter(row=>row.expectedOutcome==='denied').length,ownerSpacingChecks:ownerSpacingReceipts.length,results,receipts,ownerSpacingReceipts,actualOriginalPngs:true,actualPngDecodeVerified:true,visionExecuted:false,pixelsSentToModel:false,providerCalls:0,accountSaveClaimed:false,professionalAcceptance:false,limitations:['Actual PNG bytes and provenance are validated; no real AI vision request was made.','No invented aesthetic findings or model-generated improvement is claimed.','Human pixel review and explicit owner acceptance remain separate.']};
writeFileSync(resolve(folder,'actual-rendered-review-contract.json'),JSON.stringify(report,null,2)+'\n');
console.log('BUSY_M18_RENDERED_REVIEW '+JSON.stringify({...report,results:undefined,receipts:undefined}));
