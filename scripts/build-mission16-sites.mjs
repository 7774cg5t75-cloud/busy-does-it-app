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
const baselineRoot=process.env.BUSY_MISSION16_BASELINE_ROOT;if(!baselineRoot)throw Error('Provide the pinned baseline archive root for honest same-model comparisons.');
const before=await import(pathToFileURL(resolve(baselineRoot,'src/domain/websiteBuilder.js')).href),folder='.test-artifacts/mission16-sites';mkdirSync(folder,{recursive:true});
const hash=x=>createHash('sha256').update(x).digest('hex'),sites=[],assets=mission16Assets().map(x=>({url:x.url,file:x.file,sha256:x.sha256,mimeType:x.mimeType,outputPath:'assets/mission16-'+(x.name==='patio'?'patio.jpg':x.name),provenance:{license:x.license||'CC0',source:x.descriptionUrl||x.licenseEvidence,usage:x.usage||'Licensed illustration only, not actual business work'}}));
for(let i=0;i<3;i++)for(const sparse of [false,true]){
 const c=mission16Fixture(i,{sparse}),review=prepareWholeWebsite(c,{pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml});if(!review.ok)throw Error(review.reason);
 const assetFiles=Object.fromEntries(c.sourcePhotos.map(x=>['approved/mission16/'+x.name,'assets/mission16-'+(x.name==='patio'?'patio.jpg':x.name)]));
 const id=['moor-meadow','ember','quiet-light'][i]+(sparse?'-sparse':'-rich'),pages=[];
 writeFileSync(folder+'/'+id+'-approved-source.json',JSON.stringify({profile:c.profile,sourceMode:'Explicit fictional fixture approved for this isolated test only',images:c.sourcePhotos.map(x=>({file:x.file,sha256:x.sha256,usage:x.usage||'Licensed illustration, not business work'}))},null,2));
 writeFileSync(folder+'/'+id+'-model.json',JSON.stringify(review.candidate,null,2));
 for(const p of review.candidate.pages){const a=id+'-'+p.id+'-before.html',b=id+'-'+p.id+'-after.html';writeFileSync(folder+'/'+a,before.renderWebsiteHtml(review.candidate,p.id,{standalone:true,assetFiles}));writeFileSync(folder+'/'+b,renderWebsiteHtml(review.candidate,p.id,{standalone:true,assetFiles}));pages.push({id:p.id,path:p.path,outputPath:p.outputPath,before:a,after:b,important:p.sourceServiceId==='service-0'||p.id==='contact'});}
 sites.push({id,businessName:c.website.businessName,brandLabel:c.website.brandLabel,pages,comparisonKind:'Same final approved model, facts and assets; pinned before renderer versus current original renderer',sourceRichness:sparse?'sparse':'rich',approvedInputDigest:hash(stableJson(c.profile)),modelDigest:hash(stableJson(review.candidate)),resources:review.stats,actualGeneration:'Original buildWebsiteDraft → finite prepareWholeWebsite → original applyWebsitePageChange → original renderWebsiteHtml. Fixture facts and brand preferences are explicitly supplied; no model request or hosted save.',portfolioEvidenceSupplied:false});
}
const git=async(...args)=>(await promisify(execFile)('git',args,{encoding:'utf8'})).stdout.trim();writeFileSync(folder+'/scenarios.json',JSON.stringify({version:1,source:{commit:await git('rev-parse','HEAD'),tree:await git('rev-parse','HEAD^{tree}'),workingTreeDirty:!!(await git('status','--porcelain')),before:'dbb4ab1af0bbe34b2fcd7f41bf27432e8c2eb174'},generatedBy:'Original Busy Website Builder and finite whole-site planner; synthetic owner-reviewed fixture inputs',assets,sites,providerCalls:0,accountSaveClaimed:false,goldStandardsApproved:0},null,2)+'\n');
console.log('Prepared '+sites.length+' original whole-site examples, '+sites.reduce((n,s)=>n+s.pages.length,0)+' pages, same-model baseline comparisons; no provider or hosted action.');
