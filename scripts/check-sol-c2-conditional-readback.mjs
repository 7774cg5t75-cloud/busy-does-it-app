// Synthetic native metadata + exact local source strings. No deployment,
// actual D, approval issuance, provider, owner key or credential capability.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSolC2SyntheticReadbackFixture} from './fixtures/sol-c2-readback-synthetic.mjs';
import {creativeDocumentDeploymentFiles} from './lib/creative-document-deployment-packet.mjs';
import {stableJson} from '../src/core/stableJson.mjs';
import {SOL_TIMING_POLICY_VERSION,SOL_TIMING_POLICY_DIGEST} from './lib/sol-development-policy.mjs';
import {reviewSolC2ReadbackPreparation,reviewSolC2ManagementReadback,solC2ReadbackDigest as hash} from './lib/sol-c2-management-readback.mjs';

const root=process.cwd(),now=Date.parse('2026-11-09T22:00:00Z'),entry='supabase/functions/busy-creative-document-pilot/index.ts';
const inventory=creativeDocumentDeploymentFiles(root);
function fixture(){
 const f=createSolC2SyntheticReadbackFixture({root,now}),m=structuredClone(f.manifest),issuedAt=now-60000,expiresAt=issuedAt+14400000,supportingEvidenceUntil=expiresAt+3600000;
 const proof={version:'busy.sol-timing-policy-acceptance.v2',status:'owner-approved',policyVersion:SOL_TIMING_POLICY_VERSION,policyDigest:SOL_TIMING_POLICY_DIGEST,proposalSha256:'9'.repeat(64),recordedAt:issuedAt-60000,supportingEvidenceUntil,bindings:{targetProject:'sbvkrvksnruiclcvclbd',model:'gpt-6.1-sol',wireDigest:m.execution.wireDigest,sourceInventoryDigest:inventory.filesDigest,runtimeInventoryDigest:inventory.runtimeFilesDigest,rendererDigest:inventory.rendererFilesDigest,compilerSha256:hash(readFileSync(root+'/scripts/lib/sol-active-artifact.mjs'))}};
 m.execution.model='gpt-6.1-sol';m.execution.approval={issuedAt,expiresAt,timingPolicy:proof};
 const previous='const approvedExecutionManifest=Object.freeze('+stableJson(f.manifest)+');',next='const approvedExecutionManifest=Object.freeze('+stableJson(m)+');';
 const source=f.input.expected.files[entry].replace(previous,next);assert.notEqual(source,f.input.expected.files[entry]);
 f.input.expected.files[entry]=source;f.input.expected.runtimeFiles[entry]=hash(source);f.input.expected.entrypointSha256=hash(source);f.input.expected.manifestDigest=hash(m);
 f.input.expected.filesDigest=hash(Object.fromEntries(Object.keys(f.input.expected.files).sort().map(n=>[n,hash(f.input.expected.files[n])])));
 f.input.getter.files.find(x=>x.name===entry).content=source;
 f.input.expected.conditionalD={issuedAt,expiresAt,supportingEvidenceUntil,timingPolicyDigest:SOL_TIMING_POLICY_DIGEST};
 return f.input;
}
let passed=0;const test=(name,run)=>{run();passed++;console.log('PASS '+name);};
test('future four-hour source is fully preflighted without acknowledgement or authority',()=>{const x=fixture(),p=reviewSolC2ReadbackPreparation(x.expected,x.beforeDatabase);assert.equal(p.ok,true);assert.equal(p.audit.runtimeFiles,115);assert.equal(p.audit.rendererFiles,43);assert.equal(p.receipt,null);assert.equal(p.effects.networkRequests,0);});
test('exact115-module readback produces a newv2 receipt with original D/support deadlines',()=>{const x=fixture(),r=reviewSolC2ManagementReadback(x);assert.equal(r.ok,true);assert.equal(r.receipt.version,'busy.sol-c2-independent-readback.v2');assert.equal(r.receipt.conditionalDIssuedAt,x.expected.conditionalD.issuedAt);assert.equal(r.receipt.conditionalDExpiresAt,x.expected.conditionalD.expiresAt);assert.equal(r.receipt.supportingEvidenceUntil,x.expected.conditionalD.supportingEvidenceUntil);assert.equal(r.receipt.timingPolicyDigest,SOL_TIMING_POLICY_DIGEST);assert.equal(r.receipt.readbackValidUntil,x.observation.catalogueAt+900000);assert.equal(r.receipt.checkedAt,x.observation.catalogueAt);assert.equal(r.audit.lockConsumptionVerified,false);});
for(const[name,edit,reason]of[
 ['missing conditional proof',x=>delete x.expected.conditionalD,'CONDITIONAL_D_EXPECTATION_REQUIRED'],
 ['extra conditional identity',x=>x.expected.conditionalD.extra=true,'INVALID_CONDITIONAL_D_EXPECTATION'],
 ['D issuance mismatch',x=>x.expected.conditionalD.issuedAt--,'CONDITIONAL_D_MANIFEST_MISMATCH'],
 ['D expiry mismatch',x=>x.expected.conditionalD.expiresAt--,'CONDITIONAL_D_MANIFEST_MISMATCH'],
 ['unapproved policy digest',x=>x.expected.conditionalD.timingPolicyDigest='0'.repeat(64),'CONDITIONAL_D_MANIFEST_MISMATCH'],
 ['inflated original support',x=>x.expected.conditionalD.supportingEvidenceUntil++,'CONDITIONAL_D_POLICY_NOT_ACCEPTED'],
 ['D exceeds original support',x=>x.expected.conditionalD.supportingEvidenceUntil=x.expected.conditionalD.expiresAt-1,'CONDITIONAL_D_MANIFEST_MISMATCH']
])test(name+' never downgrades new source to old readback authority',()=>{const x=fixture();edit(x);const r=reviewSolC2ManagementReadback(x);assert.equal(r.ok,false);assert.equal(r.reason,reason);assert.equal(r.receipt,null);assert.equal(r.effects.networkRequests,0);});
test('expired D blocks new binding readiness but never edits original observation time',()=>{const x=fixture();x.now=x.expected.conditionalD.expiresAt;x.observation={catalogueAt:x.now-1000,getterAt:x.now-500};x.catalogue.checkedAt=x.observation.catalogueAt;x.getter.checkedAt=x.observation.getterAt;const r=reviewSolC2ManagementReadback(x);assert.equal(r.ok,false);assert.equal(r.reason,'CONDITIONAL_D_EXPIRED_AT_READBACK');assert.equal(r.receipt,null);});
test('conditional D never changes protected15-minute source readback freshness',()=>{const x=fixture();x.now+=900001;const r=reviewSolC2ManagementReadback(x);assert.equal(r.ok,false);assert.equal(r.reason,'STALE_COLLECTION');assert.equal(r.receipt,null);});
test('legacy engineering source stays explicitv1 instead of acquiring four-hour metadata',()=>{const f=createSolC2SyntheticReadbackFixture({root,now}),r=reviewSolC2ManagementReadback(f.input);assert.equal(r.ok,true);assert.equal(r.receipt.version,'busy.sol-c2-independent-readback.v1');assert.equal(Object.hasOwn(r.receipt,'conditionalDExpiresAt'),false);});
console.log(JSON.stringify({passed,failed:0,sourceBasis:'CURRENT_LOCAL_SOURCE_AND_SYNTHETIC_MANIFEST_METADATA',realNativeReadbacks:0,actualDIssuances:0,compilerCalls:0,providerCalls:0,ownerKeyOrCredentialReads:0,hostedWrites:0}));
