// Trusted LOCAL management-runner preparation. No default transport, provider,
// credentials, CLI or deployed endpoint. Original execution authorities remain
// separate. Candidate source is hashed as data and is never imported.
import {createHash} from 'node:crypto';
import {stableJson} from '../../src/core/stableJson.mjs';
import {reviewSolC2ManagementReadback,reviewSolC2ReadbackPreparation} from './sol-c2-management-readback.mjs';
import {solOperationalEvidenceCeiling} from './sol-development-policy.mjs';

export const C2_SUBMISSION_REVIEW_VERSION='busy.sol-C2-submission-review.v1';
export const C2_TIMING_LIMITS=Object.freeze({freshnessMs:300000,minimumRemainingMs:2280000,maximumDLeaseMs:3600000,protectedReadbackFreshnessMs:900000});
export const C2_OBSERVATION_KINDS=Object.freeze(['financial','preservation','project','organization','function','source','publicSource','verification','independent']);
const boundFileNames=['claim-C2-submission-once.review.mjs','exact-upload.coordinator-roundtrip.private.json','fresh-functions.private.json','fresh-functions.raw-tool.private.json','fresh-native-financial.private.json','fresh-native-financial.raw-tool.private.json','fresh-organization.private.json','fresh-organization.raw-tool.private.json','fresh-preparation-evidence.UNSIGNED.private.json','fresh-preparation-verification.private.json','fresh-preservation.private.json','fresh-preservation.raw-tool.private.json','fresh-project.private.json','fresh-project.raw-tool.private.json','fresh-public-commit.raw-tool.private.json','fresh-public-ref.raw-tool.private.json','fresh-public-source-verification.private.json','fresh-source-tools.private.json','owner-exact-C2-approval.private.json','verify-read-only-preflight.mjs'];
const diagnosticPredicates=new Set(['CLOCK_VALID','TIMING_SCHEMA','TIMING_INTEGER_VALUES','OWNER_APPROVAL_WINDOW','D_VALID_UNEXTENDED_60_MINUTES','ORIGINAL_SUPPORTING_DEADLINES','OBSERVATION_SET','REMAINING_SEQUENCE_38_MINUTES','INPUT_SCHEMA','INPUT_VERSION','EXPECTED_HASH_SET','EXACT_REVIEWED_RAW_HASHES','EXACT_ONE_USE_OWNER_APPROVAL','EXACT_LAB_TARGET','CURRENT_OWNER_ATTESTATION_NOT_API_PROOF','OWNER_EXCLUDED_ACTIONS','EXACT_MANAGED_ARGUMENTS','EXACT_117_FILE_SET','EXACT_117_SOURCE_BYTES','EXACT_RUNTIME_AND_INPUT_INVENTORIES','EXACT_MANIFEST_D_BINDING','ONE_SOL_TARIFF_TWO_MANIFEST','ORIGINAL_MODEL_TOKEN_FINANCIAL_LIMITS','EXACT_ACTUAL_CLOCK_BINDINGS','NO_UPGRADED_CREDENTIAL_CASH_OR_ABSENCE_PROOF','ORIGINAL_SOURCE_SECURITY_PREFLIGHT','ACTUAL_BOUND_INPUT_FILE_HASHES','ORIGINAL_NATIVE_C1_ID_VERSION_JWT_BUNDLE','UNUSED_OPERATION_ZERO_LIABILITY','UNEXPECTED_LOCAL_INPUT_OR_RUNTIME_ERROR','PROCEDURE_INSTANCE_ALREADY_USED','TRUSTED_MANAGEMENT_PORT_SET','READBACK_PREPARATION_READY','READBACK_PREPARATION_EXACT_APPROVAL_BINDINGS','EXCLUSIVE_DURABLE_INTENT_ACKNOWLEDGED','MANAGED_ACKNOWLEDGEMENT_KNOWN','MANAGEMENT_READBACK_NOT_VERIFIED','UNEXPECTED_TRUSTED_PORT_ERROR','DIAGNOSTIC_PERSISTENCE_FAILED',...['OWNER','PACKET','UPLOAD','ARTIFACT','MANIFEST','D'].flatMap(label=>['RAW_'+label+'_TYPE','RAW_'+label+'_JSON']),...C2_OBSERVATION_KINDS.flatMap(kind=>['OBSERVATION_POST_CONSENT_'+kind.toUpperCase(),'OBSERVATION_FRESH_'+kind.toUpperCase()])]);
const TARGET=Object.freeze({projectId:'sbvkrvksnruiclcvclbd',organisationId:'wrjfgasxtlznzfzmfrif',region:'eu-west-1',plan:'free',functionName:'busy-creative-document-pilot'});
const states=new Set(['preflight','pre-intent','post-intent','submit','readback','complete']);
const sha=x=>createHash('sha256').update(typeof x==='string'||x instanceof Uint8Array?x:stableJson(x)).digest('hex');
const isSha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x),integer=Number.isSafeInteger;
const plain=x=>x&&Object.getPrototypeOf(x)===Object.prototype&&Object.getOwnPropertySymbols(x).length===0&&Object.values(Object.getOwnPropertyDescriptors(x)).every(d=>Object.hasOwn(d,'value'));
const same=(a,b)=>stableJson(a)===stableJson(b),keys=(x,names)=>plain(x)&&same(Object.keys(x).sort(),[...names].sort());
const iso=x=>integer(x)&&x>0&&x<=8640000000000000?new Date(x).toISOString():null;
class Predicate extends Error{constructor(id){super('C2_REVIEW_REFUSED');this.id=id;}}
const need=(condition,id)=>{if(!condition)throw new Predicate(id);};
diagnosticPredicates.add('COMPLETE_NAMED_INPUT_FILE_HASHES');diagnosticPredicates.add('EVIDENCE_VALUES_AND_TIMES_MATCH_BOUND_FILES');diagnosticPredicates.add('DATA_ONLY_INPUTS');
diagnosticPredicates.add('LIVE_PAID_MARKER_ABSENT');diagnosticPredicates.add('LIVE_PAID_MARKER_READ_KNOWN');
diagnosticPredicates.add('RETAINED_READBACK_RESULT_ACKNOWLEDGED');
function dataOnly(value,seen=new Set()){
 if(value===null||['string','number','boolean'].includes(typeof value))return;
 need(Array.isArray(value)||plain(value),'DATA_ONLY_INPUTS');need(!seen.has(value),'DATA_ONLY_INPUTS');seen.add(value);
 need(Object.getOwnPropertySymbols(value).length===0&&Object.values(Object.getOwnPropertyDescriptors(value)).every(d=>Object.hasOwn(d,'value')),'DATA_ONLY_INPUTS');
 for(const child of Object.values(value))dataOnly(child,seen);seen.delete(value);
}
function parseRaw(value,label){need(typeof value==='string','RAW_'+label+'_TYPE');try{return JSON.parse(value);}catch{throw new Predicate('RAW_'+label+'_JSON');}}
/** Fixed, recursively rebuilt diagnostic leaves. No caller text is copied. */
export function sanitiseSolC2Diagnostic(report){
 need(plain(report)&&report.version===C2_SUBMISSION_REVIEW_VERSION&&typeof report.ok==='boolean','INPUT_SCHEMA');
 need(['validated-inputs-only','stopped-local-review','stopped-inspect-only','management-readback-verified'].includes(report.status)&&states.has(report.phase),'INPUT_SCHEMA');
 need(report.failedPredicate===null||diagnosticPredicates.has(report.failedPredicate),'INPUT_SCHEMA');
 const safe={version:C2_SUBMISSION_REVIEW_VERSION,ok:report.ok,status:report.status,phase:report.phase,failedPredicate:report.failedPredicate};
 for(const key of ['startedAt','checkedAt','recordedAt','approvalRecordedAt','dIssuedAt','dExpiresAt','freshnessInclusiveDeadline','remainingWindowInclusiveDeadline','originalSupportingDeadline'])if(Object.hasOwn(report,key)){const value=report[key];need(value===null||typeof value==='string'&&iso(Date.parse(value))===value,'INPUT_SCHEMA');safe[key]=value;}
 if(Object.hasOwn(report,'observations')){need(plain(report.observations),'INPUT_SCHEMA');safe.observations={};for(const kind of C2_OBSERVATION_KINDS)if(Object.hasOwn(report.observations,kind)){const value=report.observations[kind];need(value===null||typeof value==='string'&&iso(Date.parse(value))===value,'INPUT_SCHEMA');safe.observations[kind]=value;}}
 if(Object.hasOwn(report,'limits')){need(same(report.limits,C2_TIMING_LIMITS),'INPUT_SCHEMA');safe.limits={...C2_TIMING_LIMITS};}
 for(const key of ['mayRetry','mayRepair','mayRollback','mayInfer','mayBindCredentials'])if(Object.hasOwn(report,key)){need(report[key]===false,'INPUT_SCHEMA');safe[key]=false;}
 return safe;
}
function timeline(input,now){
 const timing=plain(input?.timing)?input.timing:{},o=plain(timing.observations)?timing.observations:{};
 const times=Object.fromEntries(C2_OBSERVATION_KINDS.map(k=>[k,iso(o[k])]));
 const validTimes=C2_OBSERVATION_KINDS.map(k=>o[k]).filter(integer);
 return {checkedAt:iso(now),approvalRecordedAt:iso(timing.approvalRecordedAt),dIssuedAt:iso(timing.dIssuedAt),dExpiresAt:iso(timing.dExpiresAt),observations:times,freshnessInclusiveDeadline:validTimes.length===C2_OBSERVATION_KINDS.length?iso(Math.min(...validTimes)+C2_TIMING_LIMITS.freshnessMs):null,remainingWindowInclusiveDeadline:integer(timing.dExpiresAt)?iso(timing.dExpiresAt-C2_TIMING_LIMITS.minimumRemainingMs):null,originalSupportingDeadline:Array.isArray(timing.supportingDeadlines)&&timing.supportingDeadlines.length&&timing.supportingDeadlines.every(integer)?iso(Math.min(...timing.supportingDeadlines)):null};
}
function timingPredicates(input,now){
 const t=input.timing;
 need(integer(now)&&now>0,'CLOCK_VALID');
 need(keys(t,['approvalRecordedAt','approvalExpiresAt','dIssuedAt','dExpiresAt','supportingDeadlines','observations']),'TIMING_SCHEMA');
 need([t.approvalRecordedAt,t.approvalExpiresAt,t.dIssuedAt,t.dExpiresAt].every(integer),'TIMING_INTEGER_VALUES');
 need(t.approvalRecordedAt<=now&&t.approvalExpiresAt===t.dExpiresAt,'OWNER_APPROVAL_WINDOW');
 need(t.dIssuedAt<=now&&t.dExpiresAt>now&&t.dExpiresAt>t.dIssuedAt&&t.dExpiresAt-t.dIssuedAt<=C2_TIMING_LIMITS.maximumDLeaseMs,'D_VALID_UNEXTENDED_60_MINUTES');
 let supportingCeiling;
 try{supportingCeiling=solOperationalEvidenceCeiling({issuedAt:t.dIssuedAt,supportingDeadlines:t.supportingDeadlines});}catch{throw new Predicate('ORIGINAL_SUPPORTING_DEADLINES');}
 need(Array.isArray(t.supportingDeadlines)&&t.supportingDeadlines.length>0&&t.supportingDeadlines.every(integer)&&t.dExpiresAt<=supportingCeiling,'ORIGINAL_SUPPORTING_DEADLINES');
 need(keys(t.observations,C2_OBSERVATION_KINDS),'OBSERVATION_SET');
 for(const kind of C2_OBSERVATION_KINDS){const at=t.observations[kind];need(integer(at)&&at>=t.approvalRecordedAt&&at<=now,'OBSERVATION_POST_CONSENT_'+kind.toUpperCase());need(now-at<=C2_TIMING_LIMITS.freshnessMs,'OBSERVATION_FRESH_'+kind.toUpperCase());}
 need(t.dExpiresAt-now>=C2_TIMING_LIMITS.minimumRemainingMs,'REMAINING_SEQUENCE_38_MINUTES');
}
function payloadPredicates(input){
 need(keys(input,['version','ownerRaw','packetRaw','uploadRaw','artifactReviewRaw','manifestRaw','dRaw','expectedHashes','preflight','independent','fileProofs','currentFunction','financial','timing']),'INPUT_SCHEMA');
 need(input.version===C2_SUBMISSION_REVIEW_VERSION,'INPUT_VERSION');
 const owner=parseRaw(input.ownerRaw,'OWNER'),p=parseRaw(input.packetRaw,'PACKET'),args=parseRaw(input.uploadRaw,'UPLOAD'),r=parseRaw(input.artifactReviewRaw,'ARTIFACT'),manifest=parseRaw(input.manifestRaw,'MANIFEST'),D=parseRaw(input.dRaw,'D'),h=input.expectedHashes;
 need(keys(h,['packet','upload','artifactReview','manifest','d'])&&Object.values(h).every(isSha),'EXPECTED_HASH_SET');
 need(sha(input.packetRaw)===h.packet&&sha(input.uploadRaw)===h.upload&&sha(input.artifactReviewRaw)===h.artifactReview&&sha(input.manifestRaw)===h.manifest&&sha(input.dRaw)===h.d,'EXACT_REVIEWED_RAW_HASHES');
 need(owner.status==='EXPLICITLY_APPROVED_ONE_MANAGED_REPLACEMENT_ONLY_NOT_SUBMITTED'&&owner.maximumSubmissions===1&&owner.maximumAdditionalPaidDeploymentGBP===0&&owner.proposalRawSha256===h.packet&&owner.uploadRawSha256===h.upload,'EXACT_ONE_USE_OWNER_APPROVAL');
 need(same(owner.target,{...TARGET,expectedExistingVersion:1,expectedNewVersion:2})&&same(p.target,{entrypoint:'supabase/functions/busy-creative-document-pilot/index.ts',...TARGET,verifyJwt:true}),'EXACT_LAB_TARGET');
 need(owner.independentCurrentSecretListVerified===false&&typeof owner.ownerCurrentSecretAbsenceAttestation==='string'&&owner.ownerCurrentSecretAbsenceAttestation.length>40,'CURRENT_OWNER_ATTESTATION_NOT_API_PROOF');
 need(['mayBindCredentials','mayInvokeHTTP','maySignIn','mayReserve','mayDispatch','mayQueueOrRelease','maySpend','mayWriteWebsite','mayPublish','automaticRetry','automaticRepair','automaticRollback'].every(k=>owner[k]===false),'OWNER_EXCLUDED_ACTIONS');
 need(keys(args,['entrypoint_path','files','link_id','name','project_id','verify_jwt'])&&args.project_id===TARGET.projectId&&args.link_id==='link_6aed1b5652708191b2539b445a601d48'&&args.name===TARGET.functionName&&args.verify_jwt===true&&args.entrypoint_path==='supabase/functions/busy-creative-document-pilot/index.ts','EXACT_MANAGED_ARGUMENTS');
 need(Array.isArray(args.files)&&args.files.length===117&&new Set(args.files.map(f=>f.name)).size===117&&plain(r.fileHashes)&&Object.keys(r.fileHashes).length===117,'EXACT_117_FILE_SET');
 for(const f of args.files)need(keys(f,['name','content'])&&typeof f.content==='string'&&Object.hasOwn(r.fileHashes,f.name)&&sha(f.content)===r.fileHashes[f.name],'EXACT_117_SOURCE_BYTES');
 need(sha(r.fileHashes)===r.filesDigest&&r.filesDigest===p.activeSubmittedFilesDigest&&sha(r.runtimeFiles)===r.runtimeFilesDigest&&r.runtimeFilesDigest===p.activeRuntimeFilesDigest&&Object.keys(r.runtimeFiles).length===115,'EXACT_RUNTIME_AND_INPUT_INVENTORIES');
 need(p.activeFileRawSha256['artifact-review.private.json']===h.artifactReview&&p.activeFileRawSha256['execution-manifest.private.json']===h.manifest&&p.issuedDRawSha256===h.d&&sha(manifest)===p.activeManifestDigest&&sha(manifest)===r.manifestDigest,'EXACT_MANIFEST_D_BINDING');
 need(manifest.version===2&&manifest.enabled===true&&manifest.executionEnabled===true&&manifest.execution?.model==='gpt-6.1-sol'&&String(manifest.execution.tariff?.revision)==='2','ONE_SOL_TARIFF_TWO_MANIFEST');
 const a=manifest.execution.approval;
 need(a?.inputTokenLimit===8000&&a.totalOutputTokenLimit===12000&&a.spendingCeilingGBP===1&&manifest.execution.tokenEvidence?.tokens===2649&&D.fullBoundReservationMicroGBP===246400&&D.maximumUsageAccountingGBP===1&&D.concurrentLimit===1&&D.astraAllocationMicroGBP===0,'ORIGINAL_MODEL_TOKEN_FINANCIAL_LIMITS');
 need(D.expiresAt===a.expiresAt&&D.expiresAt===input.timing.dExpiresAt&&D.issuedAt===input.timing.dIssuedAt&&owner.expiresAt===D.expiresAt&&owner.recordedAt===input.timing.approvalRecordedAt,'EXACT_ACTUAL_CLOCK_BINDINGS');
 need(D.actualCashCostGuaranteed===false&&D.credentialEvidence?.providerAccessVerified===false&&D.labSecretAbsenceEvidence?.continuingAbsenceProven===false,'NO_UPGRADED_CREDENTIAL_CASH_OR_ABSENCE_PROOF');
 need(input.preflight?.checksPassed===32&&input.preflight.checksFailed===0&&input.preflight.bindingsDigest==='9c30d8303acc66582757c0df8a1cc1b5c5a3d299ff8071e1297361e114f39717'&&input.independent?.status==='pass-ready-for-one-reviewed-C2-deployment'&&input.independent.checksFailed===0,'ORIGINAL_SOURCE_SECURITY_PREFLIGHT');
 need(Array.isArray(input.fileProofs)&&input.fileProofs.length>0&&input.fileProofs.length<=100&&input.fileProofs.every(f=>keys(f,['name','expected','raw'])&&typeof f.name==='string'&&/^[a-zA-Z0-9._-]+$/.test(f.name)&&!f.name.includes('..')&&typeof f.raw==='string'&&isSha(f.expected)&&f.expected===sha(f.raw)),'ACTUAL_BOUND_INPUT_FILE_HASHES');
 const bound=Object.fromEntries(input.fileProofs.map(f=>[f.name,f]));
 need(Object.keys(bound).length===input.fileProofs.length&&same(Object.keys(bound).sort(),[...boundFileNames].sort())&&plain(input.independent.fileDigests)&&same(Object.fromEntries(input.fileProofs.map(f=>[f.name,f.expected])),input.independent.fileDigests)&&input.independent.procedureSha256===bound['claim-C2-submission-once.review.mjs']?.expected,'COMPLETE_NAMED_INPUT_FILE_HASHES');
 const get=name=>JSON.parse(bound[name].raw),t=input.timing;
 const financial=get('fresh-native-financial.private.json'),observations={financial:financial.checkedAt,preservation:Date.parse(get('fresh-preservation.private.json').observedAt),project:get('fresh-project.raw-tool.private.json').checkedAt,organization:get('fresh-organization.raw-tool.private.json').checkedAt,function:get('fresh-functions.raw-tool.private.json').checkedAt,source:get('fresh-source-tools.private.json').checkedAt,publicSource:get('fresh-public-source-verification.private.json').checkedAt,verification:input.preflight.checkedAt,independent:input.independent.checkedAt};
 need(same(t.observations,observations)&&same(input.preflight,get('fresh-preparation-verification.private.json'))&&same(input.currentFunction,get('fresh-functions.private.json').functions[0])&&get('fresh-functions.private.json').functions.length===1&&same(input.financial,{operations:financial.counts.operations,events:financial.counts.events,reserved:financial.liability.reserved,spent:financial.liability.spent})&&bound['owner-exact-C2-approval.private.json'].raw===input.ownerRaw&&bound['exact-upload.coordinator-roundtrip.private.json'].raw===input.uploadRaw&&input.independent.ownerApprovalRawSha256===sha(input.ownerRaw),'EVIDENCE_VALUES_AND_TIMES_MATCH_BOUND_FILES');
 const fn=input.currentFunction;
 need(fn?.id==='434c07a2-b755-4a9a-bf4d-78691cf9deb7'&&fn.version===1&&fn.verify_jwt===true&&fn.ezbr_sha256==='3f591808c69d14bc04a97a4d193e9c3b4fd4249cc1b78d56860b257affc47808','ORIGINAL_NATIVE_C1_ID_VERSION_JWT_BUNDLE');
 need(input.financial?.operations===0&&input.financial.events===0&&input.financial.reserved===0&&input.financial.spent===0,'UNUSED_OPERATION_ZERO_LIABILITY');
}
/** Safe return values contain fixed predicate IDs and UTC numbers only.
 * A failed actual run is never reconstructed from a later clock. */
export function reviewSolC2Submission(input,{now,clock=Date.now,phase='preflight',timingOnly=false,startedAt}={}){
 let at=now,error=null;
 // Hash/shape work precedes the ACTUAL timing sample. A supplied now is only
 // a deterministic pure-test clock, never a timestamp reconstructed as fact.
 try{if(!timingOnly)payloadPredicates(input);if(at===undefined)at=clock();timingPredicates(input,at);}catch(caught){error=caught;if(at===undefined)try{at=clock();}catch{at=null;}}
 let times;try{times=timeline(input,at);}catch{times={checkedAt:iso(at),approvalRecordedAt:null,dIssuedAt:null,dExpiresAt:null,observations:{},freshnessInclusiveDeadline:null,remainingWindowInclusiveDeadline:null,originalSupportingDeadline:null};}
 return {version:C2_SUBMISSION_REVIEW_VERSION,ok:error===null,status:error===null?'validated-inputs-only':'stopped-local-review',phase:states.has(phase)?phase:'preflight',failedPredicate:error===null?null:error instanceof Predicate?error.id:'UNEXPECTED_LOCAL_INPUT_OR_RUNTIME_ERROR',startedAt:iso(startedAt??at),recordedAt:iso(Date.now()),...times,limits:{...C2_TIMING_LIMITS},mayRetry:false,mayRepair:false,mayRollback:false,mayInfer:false,mayBindCredentials:false};
}

/** There is deliberately no CLI/default management implementation. Tests use
 * synthetic ports; a future reviewed runner must bind original managed tools,
 * fsynced diagnostics and the existing exclusive intent authority explicitly. */
export function createSolC2ManagementProcedure(ports={}){
 // Capture function references rather than retain a caller-mutable port map.
 // No property accessor is invoked while creating the procedure.
 ports=plain(ports)?Object.fromEntries(Object.entries(ports)):{};
 let used=false;
 return async function run(input,readbackExpected,beforeDatabase){
  const safeClock=()=>{try{return typeof ports.clock==='function'?ports.clock():null;}catch{return null;}},startedAt=safeClock();let phase='preflight',claimed=false,attempted=false,diagnostics=0;
  const effects={intentClaimsAttempted:0,managedSubmissions:0,managementCatalogueReads:0,managementSourceReads:0,managementDatabaseReads:0,providerCalls:0,functionHTTPRequests:0,credentialReads:0,reservations:0,spendingGBP:0,WebsiteWrites:0};
  const finish=(report,extra={})=>({report,effects:{...effects},diagnosticsWritten:diagnostics,claimed,submissionAttempted:attempted,mayRetry:false,mayRepair:false,mayRollback:false,...extra});
  const clock=safeClock,persist=async report=>{await ports.writeDiagnostic(structuredClone(report));diagnostics++;};
  if(used)return finish({version:C2_SUBMISSION_REVIEW_VERSION,ok:false,status:'stopped-local-review',phase,failedPredicate:'PROCEDURE_INSTANCE_ALREADY_USED',startedAt:iso(startedAt),checkedAt:iso(startedAt),mayRetry:false});used=true;
  try{
   need(keys(ports,['clock','writeDiagnostic','claimDurableIntent','verifyPaidMarkerAbsent','submitManaged','readCatalogue','readFunction','readDatabase','retainReadbackResult'])&&Object.values(ports).every(f=>typeof f==='function'),'TRUSTED_MANAGEMENT_PORT_SET');
   // Snapshot local data before the first await; later port callbacks cannot
   // switch the reviewed upload, evidence, hashes or readback expectation.
   dataOnly({input,readbackExpected,beforeDatabase});input=structuredClone(input);readbackExpected=structuredClone(readbackExpected);beforeDatabase=structuredClone(beforeDatabase);
   let report=reviewSolC2Submission(input,{clock,startedAt,phase});await persist(report);if(!report.ok)return finish(report);
   const managedArguments=JSON.parse(input.uploadRaw);
   const preparation=reviewSolC2ReadbackPreparation(readbackExpected,beforeDatabase);
   need(preparation.ok,'READBACK_PREPARATION_READY');
   const packet=JSON.parse(input.packetRaw);
   need(preparation.audit.filesDigest===packet.activeSubmittedFilesDigest&&preparation.audit.runtimeFilesDigest===packet.activeRuntimeFilesDigest&&preparation.audit.manifestDigest===packet.activeManifestDigest&&readbackExpected.expectedFunctionId===input.currentFunction.id&&readbackExpected.existingNativeBundleSha256===input.currentFunction.ezbr_sha256&&readbackExpected.target.projectId===TARGET.projectId&&readbackExpected.target.organisationId===TARGET.organisationId&&readbackExpected.target.region===TARGET.region&&readbackExpected.target.functionName===TARGET.functionName,'READBACK_PREPARATION_EXACT_APPROVAL_BINDINGS');
   phase='pre-intent';report=reviewSolC2Submission(input,{clock,startedAt,phase});await persist(report);if(!report.ok)return finish(report);
   // Diagnostic fsync may itself take time. Recheck after it, with no await
   // between this check and attempting the original exclusive intent.
   report=reviewSolC2Submission(input,{clock,startedAt,phase,timingOnly:true});if(!report.ok){await persist(report);return finish(report);}
   const intentBytes=JSON.stringify({version:'busy.sol-C2-once-managed-submission-intent.v1',status:'CLAIMED_NONREPLAY_SUBMISSION_ALLOWANCE_NOT_ACKNOWLEDGED',claimedAt:Date.parse(report.checkedAt),expiresAt:input.timing.dExpiresAt,proposalRawSha256:input.expectedHashes.packet,uploadRawSha256:input.expectedHashes.upload,ownerApprovalRawSha256:sha(input.ownerRaw),independentPreflightCanonicalSha256:sha(input.independent),target:JSON.parse(input.ownerRaw).target,maximumSubmissions:1,verifyJwt:true,minimumRemainingSequenceBudgetMs:C2_TIMING_LIMITS.minimumRemainingMs,maximumPaidDeploymentGBP:0,automaticRetry:false,automaticRepair:false,automaticRollback:false,noHTTPOrInference:true})+'\n';
   effects.intentClaimsAttempted++;const claim=await ports.claimDurableIntent(intentBytes);
   need(claim?.claimed===true&&claim.fileSynced===true&&claim.directorySynced===true&&claim.intentSha256===sha(intentBytes),'EXCLUSIVE_DURABLE_INTENT_ACKNOWLEDGED');claimed=true;
   phase='post-intent';report=reviewSolC2Submission(input,{clock,startedAt,phase});await persist(report);if(!report.ok)return finish(report);
   need((await ports.verifyPaidMarkerAbsent())?.absent===true,'LIVE_PAID_MARKER_ABSENT');
   // A final timing-only check follows durable diagnostics. Nothing async is
   // inserted before invoking the single trusted managed-submission port.
   report=reviewSolC2Submission(input,{clock,startedAt,phase,timingOnly:true});if(!report.ok){await persist(report);return finish(report);}
   phase='submit';attempted=true;effects.managedSubmissions++;
   const acknowledgement=await ports.submitManaged(managedArguments);
   need(acknowledgement?.outcome==='acknowledged','MANAGED_ACKNOWLEDGEMENT_KNOWN');
   phase='readback';effects.managementCatalogueReads++;effects.managementSourceReads++;effects.managementDatabaseReads++;
   const [catalogue,getter,afterDatabase]=await Promise.all([ports.readCatalogue(),ports.readFunction(),ports.readDatabase()]);
   const reviewed=reviewSolC2ManagementReadback({expected:readbackExpected,acknowledgement,catalogue,getter,beforeDatabase,afterDatabase,observation:{catalogueAt:catalogue.checkedAt,getterAt:getter.checkedAt},now:clock()});
   const readbackSnapshot=structuredClone(reviewed),retainedBytes=stableJson(readbackSnapshot)+'\n';
   let retained;try{retained=await ports.retainReadbackResult(readbackSnapshot);}catch{throw new Predicate('RETAINED_READBACK_RESULT_ACKNOWLEDGED');}
   need(retained?.retained===true&&retained.fileSynced===true&&retained.directorySynced===true&&retained.sha256===sha(retainedBytes),'RETAINED_READBACK_RESULT_ACKNOWLEDGED');
   const completed={version:C2_SUBMISSION_REVIEW_VERSION,ok:reviewed.ok,status:reviewed.ok?'management-readback-verified':'stopped-inspect-only',phase:reviewed.ok?'complete':phase,failedPredicate:reviewed.ok?null:'MANAGEMENT_READBACK_NOT_VERIFIED',startedAt:iso(startedAt),checkedAt:iso(clock()),mayRetry:false,mayRepair:false,mayRollback:false};await persist(completed);return finish(completed,{readback:reviewed});
  }catch(error){
   const failed={version:C2_SUBMISSION_REVIEW_VERSION,ok:false,status:attempted||effects.intentClaimsAttempted?'stopped-inspect-only':'stopped-local-review',phase,failedPredicate:error instanceof Predicate?error.id:error?.code==='C2_LOCAL_MARKER_PRESENT'?'LIVE_PAID_MARKER_ABSENT':error?.code==='C2_LOCAL_MARKER_READ_UNCERTAIN'?'LIVE_PAID_MARKER_READ_KNOWN':'UNEXPECTED_TRUSTED_PORT_ERROR',startedAt:iso(startedAt),checkedAt:iso(clock()),recordedAt:iso(Date.now()),mayRetry:false,mayRepair:false,mayRollback:false};
   try{await persist(failed);}catch{return finish({...failed,failedPredicate:'DIAGNOSTIC_PERSISTENCE_FAILED',diagnosticPersistenceUnconfirmed:true});}
   return finish(failed);
  }
 };
}
