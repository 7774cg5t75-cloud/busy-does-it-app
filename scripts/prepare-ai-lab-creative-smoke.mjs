import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {buildSmokeHandoffReview,SMOKE_HANDOFF_MARKER} from './lib/ai-lab-creative-smoke-handoff.mjs';
if(process.argv.slice(2).length||existsSync(resolve(process.cwd(),SMOKE_HANDOFF_MARKER)))throw Error('Review preparation only; no execution arguments or existing marker permitted');
const review=buildSmokeHandoffReview(process.cwd()),folder='.test-artifacts/ai-lab-creative-smoke-review';mkdirSync(folder,{recursive:true});writeFileSync(folder+'/review-only.json',JSON.stringify(review,null,2)+'\n');
console.log(JSON.stringify({status:review.status,inventoryDigest:review.inventory.filesDigest,deploymentFilesDigest:review.deploymentFilesDigest,smokeExecution:false,markerCreated:false,credentialReads:0,providerCalls:0,spendingGBP:0}));
