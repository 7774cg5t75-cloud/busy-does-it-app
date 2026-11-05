import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {stableJson} from '../src/core/stableJson.mjs';
import {createDesignCandidate,DESIGN_REVIEW_VERSION} from '../src/core/websiteDesignAcceptance.mjs';
process.env.BUSY_CREATIVE_IMPORTED='1';const {creativeFixture}=await import('./check-website-creative-comparison.mjs');delete process.env.BUSY_CREATIVE_IMPORTED;
const hash=v=>createHash('sha256').update(v).digest('hex'),root='.test-artifacts/website-creative',browser=JSON.parse(readFileSync(root+'/browser-results.json')),quality=JSON.parse(readFileSync(root+'/measured-quality.json'));
assert.equal(browser.failures.length,0);assert.equal(browser.sandboxRequired,true);const now=Date.now(),records=[];
for(const id of ['1','3','5']){
 const context=creativeFixture((Number(id)-1)/2,true);
 const model=JSON.parse(readFileSync(root+'/'+id+'-approved.json')),images=browser.results.filter(r=>r.filename.startsWith(id+'-after-'));
 assert.ok([320,390,1440].every(w=>images.some(r=>r.viewport.width===w)));const q=quality.find(r=>r.business===images[0].business);assert.equal(q.technical.passed,true);assert.equal(q.technical.evidenceComplete,true);
 for(const r of images){assert.equal(hash(readFileSync(root+'/'+r.filename)),r.sha256);assert.equal(r.blockedRequests,0);}
 const evidence={version:DESIGN_REVIEW_VERSION,id:['ember-candidate','clearleaf-candidate','quiet-light-candidate'][Number(id)/2-.5],classification:'fictional-licensed',commit:browser.source.commit,tree:browser.source.tree,sourceDigest:hash(stableJson(model)),assetManifestDigest:hash(stableJson(browser.assetManifest)),scope:{ownerId:context.ownerId,businessId:model.businessId,projectId:model.id,sourceRevision:model.generation,profileRevision:context.profileRevision},renderer:browser.renderer,browser:browser.browser,captures:images.map(r=>({width:r.viewport.width,dpr:r.label==='retina'?2:1,fullPage:true,sha256:r.sha256,filename:r.filename})),technical:{content:q.content.issues.length===0,privacy:true,responsive:true,safeActions:true,sourceCurrent:true},permission:{internalReview:true,revisionDigest:hash(stableJson(browser.assetManifest)),expiresAt:now+7*86400000,withdrawn:false}};
 const created=createDesignCandidate(evidence,now);assert.equal(created.ok,true,created.reason);assert.equal(created.record.state,'candidate');records.push(created.record);
}
mkdirSync('.test-artifacts/design-acceptance',{recursive:true});writeFileSync('.test-artifacts/design-acceptance/candidates.json',JSON.stringify({records,approvedCount:0,privacy:'Non-sensitive fictional/licensed metadata only. Private working catalogue is retained separately outside Git.',rights:'Fixture licence/provenance is not independent verification of a customer upload.',ownerAcceptance:'Not supplied; no current design approved.',releaseReady:false,starterPackage:'Separate package not found; reconcile when supplied.'},null,2));
console.log('PASS three genuine-render candidate manifests; exact original PNG/source/asset hashes; zero approved gold standards; owner/founder acceptance and release remain separate.');
