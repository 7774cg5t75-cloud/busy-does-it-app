import {createHash,randomUUID} from 'node:crypto';
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {stableJson} from '../../src/core/stableJson.mjs';
import {AI_LAB_B3_SOURCE_PLAN,AI_LAB_B3_SOURCE_PLAN_DIGEST} from './ai-lab-b3-source.mjs';

export const B3_TARGET=Object.freeze({projectId:'sbvkrvksnruiclcvclbd',organizationId:'wrjfgasxtlznzfzmfrif',region:'eu-west-1'});
export const B3_REPOSITORY='7774cg5t75-cloud/busy-does-it-app';
export const B3_REF='refs/heads/codex/builder-mission15-design-advancement';
export const B3_ENVIRONMENT='busy-ai-lab-b3-source';
export const B3_WORKFLOW='.github/workflows/ai-lab-b3-source.yml';
export const B3_MARKER='.github/ai-lab-b3-execution-request.json';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const sha=/^[0-9a-f]{64}$/;
const commit=/^[0-9a-f]{40}$/;
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join('|')===[...keys].sort().join('|');
export const b3Digest=value=>createHash('sha256').update(typeof value==='string'?value:stableJson(value)).digest('hex');
const need=(condition,code)=>{if(!condition)throw Error(code);};
const copy=value=>JSON.parse(JSON.stringify(value));

// Capture the complete local import closure, including the original handler,
// renderer, facts and session. No npm installation, transport or credential read.
export function b3CodeFiles(root){
 const base=realpathSync(root),seen=new Set();
 function visit(path){
  const abs=resolve(base,path),rel=relative(base,abs);
  need(!rel.startsWith('..')&&!lstatSync(abs).isSymbolicLink()&&realpathSync(abs)===abs,'unsafe_code_path');
  if(seen.has(rel))return;seen.add(rel);
  const source=readFileSync(abs,'utf8');
  if(!/\.(?:mjs|js)$/.test(rel))return;
  const imports=[
   ...source.matchAll(/^\s*(?:import|export)\b[^\n]*?\bfrom\s*['"]([^'"]+)['"]/gm),
   ...source.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gm),
   ...source.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)
  ].map(m=>m[1]);
  for(const specifier of imports){
   if(specifier.startsWith('node:'))continue;
   need(specifier.startsWith('.'),'external_code_dependency');
   visit(relative(base,resolve(dirname(abs),specifier)));
  }
 }
 for(const entry of ['scripts/run-ai-lab-b3.mjs','scripts/lib/ai-lab-b3-runtime.mjs',B3_WORKFLOW])visit(entry);
 return Object.fromEntries([...seen].sort().map(path=>[path,b3Digest(readFileSync(resolve(base,path),'utf8'))]));
}

export function prepareB3Manifest({root,verifiedB2,sourceCommit,sourceTree,createdAt=new Date().toISOString(),executionId=randomUUID(),requestNonce=randomUUID()}={}){
 need(exact(verifiedB2,['projectId','organizationId','region','ownerId','businessId','ownerEmail','businessName','b2Version','b2Name','b2StatementSha256','evidenceSha256']),'exact_private_b2_binding_required');
 need(Object.entries(B3_TARGET).every(([k,v])=>verifiedB2[k]===v),'wrong_lab_target');
 need(uuid.test(verifiedB2.ownerId)&&uuid.test(verifiedB2.businessId)&&verifiedB2.ownerId!==verifiedB2.businessId&&verifiedB2.ownerEmail==='quiet-light-owner@busy-ai-lab.invalid'&&verifiedB2.businessName==='Quiet Light Studio','wrong_native_business_identity');
 need(verifiedB2.b2Version==='20261107000304'&&verifiedB2.b2Name==='ai_lab_quiet_light_owner_setup_v1'&&verifiedB2.b2StatementSha256==='865e2acdb036691a0e907bcdfbc0737b5bb403005880cd9c218ceafc047e77bc'&&sha.test(verifiedB2.evidenceSha256),'exact_b2_receipt_required');
 need(commit.test(sourceCommit)&&commit.test(sourceTree)&&Number.isFinite(Date.parse(createdAt))&&uuid.test(executionId)&&uuid.test(requestNonce),'invalid_source_identity');
 return {version:'busy.ai-lab-b3-manifest.v1',status:'prepared-not-authorized',target:copy(B3_TARGET),binding:{ownerId:verifiedB2.ownerId,businessId:verifiedB2.businessId,executionId,requestNonce,sourcePlanDigest:AI_LAB_B3_SOURCE_PLAN_DIGEST},nativeOwnerEmail:verifiedB2.ownerEmail,businessName:verifiedB2.businessName,b2:{version:verifiedB2.b2Version,name:verifiedB2.b2Name,statementSha256:verifiedB2.b2StatementSha256,evidenceSha256:verifiedB2.evidenceSha256},sourcePlan:copy(AI_LAB_B3_SOURCE_PLAN),code:{sourceCommit,sourceTree,files:b3CodeFiles(root)},createdAt,limits:{nativeSignIns:1,sourceWrites:6,providerCalls:0,spendingGbp:0,automaticRetries:0,publication:false},execution:{repository:B3_REPOSITORY,ref:B3_REF,environment:B3_ENVIRONMENT,workflow:B3_WORKFLOW,marker:B3_MARKER,runAttempt:1}};
}

export function pendingB3Approval(manifest){
 return {version:'busy.ai-lab-b3-owner-approval.v1',status:'not-authorized',manifestDigest:b3Digest(manifest),executionId:manifest.binding.executionId,requestNonce:manifest.binding.requestNonce,runId:null,eventSha:null,actor:null,expiresAt:null,maxExecutionCount:1,environmentProtectionIndependentlyReviewed:false,standardRunnerZeroCostConfirmed:false};
}

export function validateB3Execution({root,manifest,approval,marker,environment,now=Date.now()}={}){
 need(exact(manifest,['version','status','target','binding','nativeOwnerEmail','businessName','b2','sourcePlan','code','createdAt','limits','execution']),'invalid_manifest_structure');
 need(manifest.version==='busy.ai-lab-b3-manifest.v1'&&manifest.status==='prepared-not-authorized'&&stableJson(manifest.target)===stableJson(B3_TARGET),'wrong_lab_manifest');
 need(exact(manifest.binding,['ownerId','businessId','executionId','requestNonce','sourcePlanDigest'])&&['ownerId','businessId','executionId','requestNonce'].every(k=>uuid.test(manifest.binding[k]))&&new Set(Object.values(manifest.binding)).size===5&&manifest.binding.sourcePlanDigest===AI_LAB_B3_SOURCE_PLAN_DIGEST,'invalid_bound_source');
 need(manifest.nativeOwnerEmail==='quiet-light-owner@busy-ai-lab.invalid'&&manifest.businessName==='Quiet Light Studio'&&stableJson(manifest.sourcePlan)===stableJson(AI_LAB_B3_SOURCE_PLAN),'source_plan_changed');
 need(exact(manifest.b2,['version','name','statementSha256','evidenceSha256'])&&manifest.b2.version==='20261107000304'&&manifest.b2.name==='ai_lab_quiet_light_owner_setup_v1'&&manifest.b2.statementSha256==='865e2acdb036691a0e907bcdfbc0737b5bb403005880cd9c218ceafc047e77bc'&&sha.test(manifest.b2.evidenceSha256),'wrong_b2_receipt');
 need(exact(manifest.code,['sourceCommit','sourceTree','files'])&&commit.test(manifest.code.sourceCommit)&&commit.test(manifest.code.sourceTree)&&stableJson(manifest.code.files)===stableJson(b3CodeFiles(root)),'reviewed_code_changed');
 need(stableJson(manifest.limits)===stableJson({nativeSignIns:1,sourceWrites:6,providerCalls:0,spendingGbp:0,automaticRetries:0,publication:false}),'execution_limits_changed');
 need(stableJson(manifest.execution)===stableJson({repository:B3_REPOSITORY,ref:B3_REF,environment:B3_ENVIRONMENT,workflow:B3_WORKFLOW,marker:B3_MARKER,runAttempt:1}),'execution_target_changed');
 need(exact(approval,['version','status','manifestDigest','executionId','requestNonce','runId','eventSha','actor','expiresAt','maxExecutionCount','environmentProtectionIndependentlyReviewed','standardRunnerZeroCostConfirmed']),'invalid_approval_structure');
 need(approval.version==='busy.ai-lab-b3-owner-approval.v1'&&approval.status==='owner-approved'&&approval.manifestDigest===b3Digest(manifest)&&approval.executionId===manifest.binding.executionId&&approval.requestNonce===manifest.binding.requestNonce&&approval.maxExecutionCount===1,'missing_exact_owner_approval');
 need(Number.isFinite(Date.parse(approval.expiresAt))&&Date.parse(approval.expiresAt)>now&&Date.parse(approval.expiresAt)<=now+60*60*1000,'approval_expired_or_unbounded');
 need(approval.environmentProtectionIndependentlyReviewed===true&&approval.standardRunnerZeroCostConfirmed===true,'owner_runtime_prerequisites_unverified');
 need(environment?.GITHUB_ACTIONS==='true'&&environment.GITHUB_EVENT_NAME==='push'&&environment.GITHUB_REPOSITORY===B3_REPOSITORY&&environment.GITHUB_REF===B3_REF&&environment.GITHUB_RUN_ATTEMPT==='1'&&/^[1-9][0-9]{0,24}$/.test(approval.runId)&&environment.GITHUB_RUN_ID===approval.runId&&commit.test(approval.eventSha)&&environment.GITHUB_SHA===approval.eventSha&&typeof approval.actor==='string'&&/^[A-Za-z0-9_-]+(?:\[bot\])?$/.test(approval.actor)&&environment.GITHUB_ACTOR===approval.actor,'wrong_or_replayed_github_run');
 need(environment.GITHUB_WORKFLOW_REF===B3_REPOSITORY+'/'+B3_WORKFLOW+'@'+B3_REF,'wrong_workflow');
 need(exact(marker,['version','manifestDigest','executionId'])&&marker.version==='busy.ai-lab-b3-execution-request.v1'&&marker.manifestDigest===approval.manifestDigest&&marker.executionId===approval.executionId,'wrong_execution_marker');
 // None of these public fields activates a provider. The private, separately
 // reviewed owner approval is bound to ONE existing protected job/run attempt.
 return {...copy(B3_TARGET),version:'busy.ai-lab-b3-runtime.v1',...copy(manifest.binding),approval:{status:'owner-approved',manifestDigest:approval.manifestDigest,expiresAt:approval.expiresAt}};
}
