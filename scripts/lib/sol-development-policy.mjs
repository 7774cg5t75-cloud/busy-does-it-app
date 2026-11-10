// Read-only LOCAL development audit. No storage, clock issuance,
// credentials, execution adapter, claim or transport. This does not authorise
// an operation or replace the original compiler/controller/caller gates.
import {SOL_TIMING_POLICY_VERSION,SOL_TIMING_POLICY_CANDIDATE,SOL_TIMING_POLICY_DIGEST,reviewSolTimingPolicyApproval} from '../../supabase/functions/busy-builder-proposals/creativeComparisonAdmission.mjs';
export {SOL_TIMING_POLICY_VERSION,SOL_TIMING_POLICY_CANDIDATE,SOL_TIMING_POLICY_DIGEST,reviewSolTimingPolicyApproval};
export const SOL_DEVELOPMENT_POLICY_VERSION='busy.sol-development-policy.v1';
export const SOL_DEVELOPMENT_POLICY_V2_VERSION='busy.sol-development-policy.v2';
export const SOL_DEVELOPMENT_PHASES=Object.freeze(['prepare','verify','approve','execute','independently-verify']);
export const SOL_DEVELOPMENT_LIMITS=Object.freeze({preparationMaxAgeMs:86400000,financialWindowMs:172800000,operationalMaxAgeMs:3600000,nativeFreshnessMs:300000,minimumSequenceMs:2280000,protectedReadbackFreshnessMs:900000});
// Historical defaults remain unchanged. New exact-owner policy receipts opt
// into this candidate; neither importing it nor running an audit activates it.
export const SOL_TIMING_GENERAL_OBSERVATIONS=SOL_TIMING_POLICY_CANDIDATE.generalKinds;
export const SOL_TIMING_CRITICAL_OBSERVATIONS=SOL_TIMING_POLICY_CANDIDATE.criticalKinds;
export const SOL_TIMING_POST_CONSENT_OBSERVATIONS=SOL_TIMING_POLICY_CANDIDATE.postConsentKinds;
export const SOL_TIMING_OBSERVATION_MAX_AGE_MS=Object.freeze(Object.fromEntries([
 ...SOL_TIMING_GENERAL_OBSERVATIONS.map(kind=>[kind,SOL_TIMING_POLICY_CANDIDATE.generalFreshnessMs]),
 ...SOL_TIMING_CRITICAL_OBSERVATIONS.map(kind=>[kind,SOL_TIMING_POLICY_CANDIDATE.criticalFreshnessMs])
]));
export const SOL_PREPARATION_STEPS=Object.freeze(['sourceAndArtifactFrozen','toolchainVerified','submissionAndReadbackPrepared','privatePayloadRoundtripVerified','diagnosticsAndNonReplayPrepared','protectedWorkflowPrepared','encryptedResultRoutePrepared']);
const integer=Number.isSafeInteger,sha=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const plain=value=>value&&Object.getPrototypeOf(value)===Object.prototype&&Object.getOwnPropertySymbols(value).length===0&&Object.values(Object.getOwnPropertyDescriptors(value)).every(d=>Object.hasOwn(d,'value'));
const keys=(value,names)=>plain(value)&&Object.keys(value).sort().join(',')===[...names].sort().join(',');
const need=(condition,code)=>{if(!condition)throw Error(code);};
function ceiling(issuedAt,supportingDeadlines,maximumAgeMs){
 need(integer(issuedAt)&&issuedAt>0&&integer(issuedAt+maximumAgeMs),'INVALID_ORIGINAL_TIME');
 need(Array.isArray(supportingDeadlines)&&supportingDeadlines.length>0&&supportingDeadlines.every(value=>integer(value)&&value>0),'INVALID_ORIGINAL_DEADLINES');
 return Math.min(issuedAt+maximumAgeMs,...supportingDeadlines);
}
// Calculations only: no issued record, refreshed evidence or extended lease.
export function solPreparationEvidenceCeiling({issuedAt,supportingDeadlines}){return ceiling(issuedAt,supportingDeadlines,SOL_DEVELOPMENT_LIMITS.preparationMaxAgeMs);}
export function solOperationalEvidenceCeiling({issuedAt,supportingDeadlines,timingPolicyApproval,bindings}){
 if(timingPolicyApproval!==undefined)return solConditionalEvidenceCeiling({issuedAt,supportingDeadlines,timingPolicyApproval,bindings});
 return ceiling(issuedAt,supportingDeadlines,SOL_DEVELOPMENT_LIMITS.operationalMaxAgeMs);
}
export function solConditionalEvidenceCeiling({issuedAt,supportingDeadlines,timingPolicyApproval,bindings}){
 const accepted=reviewSolTimingPolicyApproval(timingPolicyApproval,{now:issuedAt,bindings});
 need(accepted.ok,'EXACT_OWNER_TIMING_POLICY_REQUIRED');
 return Math.min(ceiling(issuedAt,supportingDeadlines,SOL_TIMING_POLICY_CANDIDATE.conditionalDMaxAgeMs),accepted.supportingEvidenceUntil);
}
/** Headroom is an admission calculation, not a fabricated observation time.
 * The historical full host phase is the lower measurement floor. A larger
 * independently measured roundtrip can only increase the required margin.
 */
export function solRequiredHandoffHeadroomMs(measuredHandoffMs=39178){
 need(integer(measuredHandoffMs)&&measuredHandoffMs>=39178,'INVALID_HANDOFF_MEASUREMENT');
 const rounded=Math.ceil((measuredHandoffMs*2+30000)/30000)*30000;
 need(integer(rounded),'INVALID_HANDOFF_MEASUREMENT');
 return Math.max(SOL_TIMING_POLICY_CANDIDATE.minimumHandoffHeadroomMs,rounded);
}
export function solMinimumPhaseRemainingMs(phase){
 const budgets={deployment:SOL_TIMING_POLICY_CANDIDATE.deploymentMinimumRemainingMs,'exact-run':SOL_TIMING_POLICY_CANDIDATE.exactRunMinimumRemainingMs,'function-dispatch':SOL_TIMING_POLICY_CANDIDATE.functionDispatchMinimumRemainingMs};
 need(Object.hasOwn(budgets,phase),'UNKNOWN_EXECUTION_PHASE');return budgets[phase];
}
/** Complete typed observation review before a durable submission intent.
 * Static source and expensive DB checks may predate exact C2 consent, while
 * target/project/function/credential absence must follow it. All ages remain
 * genuine and are rechecked immediately before the external mutation.
 */
export function reviewSolEvidenceHeadroom(input){
 let reason=null,minimumEvidenceDeadline=null,requiredHeadroomMs=null,now=null,failedObservationKind=null,remainingFreshnessMs=null,earliestObservationKinds=[];
 const check=(condition,code)=>{if(!condition){reason=code;throw null;}};
 try{
  check(plain(input)&&Object.keys(input).every(key=>['observations','approvalFirstObservedAt','approvalRecordedAt','now','measuredHandoffMs'].includes(key))&&['observations','approvalFirstObservedAt','approvalRecordedAt'].every(key=>Object.hasOwn(input,key)),'INVALID_TYPED_HEADROOM_INPUT');
  const {observations,approvalFirstObservedAt,approvalRecordedAt,measuredHandoffMs=39178}=input;
  now=input.now??Date.now();
  check(integer(now)&&now>0&&integer(now+SOL_TIMING_POLICY_CANDIDATE.generalFreshnessMs)&&integer(approvalFirstObservedAt)&&approvalFirstObservedAt>0&&integer(approvalRecordedAt)&&approvalRecordedAt>=approvalFirstObservedAt&&approvalRecordedAt<=now,'INVALID_ACTUAL_HANDOFF_CLOCK');
  check(keys(observations,Object.keys(SOL_TIMING_OBSERVATION_MAX_AGE_MS)),'COMPLETE_TYPED_OBSERVATIONS_REQUIRED');
  check(integer(measuredHandoffMs)&&measuredHandoffMs>=39178&&measuredHandoffMs<Number.MAX_SAFE_INTEGER/4,'INVALID_HANDOFF_MEASUREMENT');
  requiredHeadroomMs=solRequiredHandoffHeadroomMs(measuredHandoffMs);
  const deadlines=[];
  for(const [kind,age]of Object.entries(SOL_TIMING_OBSERVATION_MAX_AGE_MS)){
   failedObservationKind=kind;
   const at=observations[kind];check(integer(at)&&at>0&&at<=now&&integer(at+age),'OBSERVATION_ACTUAL_TIME_REQUIRED');
   minimumEvidenceDeadline=at+age;remainingFreshnessMs=minimumEvidenceDeadline-now;
   check(!SOL_TIMING_POST_CONSENT_OBSERVATIONS.includes(kind)||at>=approvalFirstObservedAt,'CRITICAL_OBSERVATION_AFTER_CONSENT_REQUIRED');
   check(now-at<=age,'TYPED_OBSERVATION_EXPIRED');deadlines.push({kind,until:at+age});
  }
  failedObservationKind='credentialAbsence';
  check(observations.credentialAbsence===approvalFirstObservedAt,'GENUINE_OWNER_ATTESTATION_TIME_REQUIRED');
  minimumEvidenceDeadline=Math.min(...deadlines.map(row=>row.until));remainingFreshnessMs=minimumEvidenceDeadline-now;
  earliestObservationKinds=deadlines.filter(row=>row.until===minimumEvidenceDeadline).map(row=>row.kind);
  failedObservationKind=earliestObservationKinds[0]??null;
  check(minimumEvidenceDeadline-now>=requiredHeadroomMs,'INSUFFICIENT_PRE_INTENT_FRESHNESS_HEADROOM');
  failedObservationKind=null;
 }catch{reason??='INVALID_HANDOFF_EVIDENCE';}
 return {version:SOL_TIMING_POLICY_VERSION,status:'typed-headroom-audit-only',ok:reason===null,blockingReason:reason,failedObservationKind,earliestObservationKinds,checkedAt:now,minimumEvidenceDeadline,remainingFreshnessMs,requiredHeadroomMs,mayClaimIntent:false,mayDeploy:false,mayDispatch:false,automaticRetry:false};
}
export function reviewSolArtifactAcceptance(value){
 let matches=false,ownerAcceptanceRecorded=false;
 try{const valid=keys(value,['approvedArtifactDigest','currentArtifactDigest','approvedConditionsDigest','currentConditionsDigest','ownerAccepted'])&&['approvedArtifactDigest','currentArtifactDigest','approvedConditionsDigest','currentConditionsDigest'].every(key=>sha(value[key]))&&typeof value.ownerAccepted==='boolean';matches=!!(valid&&value.approvedArtifactDigest===value.currentArtifactDigest&&value.approvedConditionsDigest===value.currentConditionsDigest);ownerAcceptanceRecorded=!!(matches&&value.ownerAccepted);}catch{}
 return {status:'artifact-binding-audit-only',matches,ownerAcceptanceRecorded,operationalAuthorisation:false,mayIssueD:false,mayExecute:false};
}
/** The caller supplies facts from retained, independent original receipts.
 * Binding digests cover the COMPLETE original solPreparationBindings contract,
 * including the plan/operation, never a reduced caller-selected fingerprint.
 * This audit cannot establish their provenance and never creates approval.
 * It prepares a review request BEFORE the short-lived operational clock.
 */
export function reviewSolDevelopmentPreparation(input,{now=Date.now()}={}){
 let reason=null,effectiveEvidenceDeadline=null,maximumPossibleDExpiry=null,artifact=null;
 const check=(condition,code)=>{if(!condition){reason=code;throw null;}};
 try{
  check(integer(now)&&now>0&&integer(now+SOL_DEVELOPMENT_LIMITS.operationalMaxAgeMs),'INVALID_REVIEW_CLOCK');
  check(keys(input,['version','preparedSteps','approvedBindingsDigest','currentBindingsDigest','artifactAcceptance','originalEvidenceDeadlines','lastNativeObservationAt','oneUseState']),'INVALID_PREPARATION_AUDIT');
  check(input.version===SOL_DEVELOPMENT_POLICY_VERSION,'INVALID_POLICY_VERSION');
  check(keys(input.preparedSteps,SOL_PREPARATION_STEPS)&&SOL_PREPARATION_STEPS.every(step=>keys(input.preparedSteps[step],['verified','receiptSha256'])&&input.preparedSteps[step].verified===true&&sha(input.preparedSteps[step].receiptSha256)),'PREPARATION_INCOMPLETE');
  check(sha(input.approvedBindingsDigest)&&input.approvedBindingsDigest===input.currentBindingsDigest,'MATERIAL_BINDINGS_CHANGED');
  artifact=reviewSolArtifactAcceptance(input.artifactAcceptance);check(artifact.matches,'ARTIFACT_OR_CONDITIONS_CHANGED');
  check(input.oneUseState==='unclaimed','ONE_USE_OR_OUTCOME_REQUIRES_INVESTIGATION');
  const d=input.originalEvidenceDeadlines;
  check(keys(d,['preparation','count','rate','tariff','financial','periodEnd'])&&Object.values(d).every(value=>integer(value)&&value>0),'INVALID_ORIGINAL_DEADLINES');
  effectiveEvidenceDeadline=Math.min(...Object.values(d));
  check(effectiveEvidenceDeadline>now,'ORIGINAL_SUPPORTING_EVIDENCE_EXPIRED');
  maximumPossibleDExpiry=solOperationalEvidenceCeiling({issuedAt:now,supportingDeadlines:Object.values(d)});
  check(maximumPossibleDExpiry-now>=SOL_DEVELOPMENT_LIMITS.minimumSequenceMs,'SUPPORTING_EVIDENCE_CANNOT_FIT_SEQUENCE');
  check(integer(input.lastNativeObservationAt)&&input.lastNativeObservationAt<=now&&now-input.lastNativeObservationAt<=SOL_DEVELOPMENT_LIMITS.nativeFreshnessMs,'FRESH_NATIVE_OBSERVATION_REQUIRED');
 }catch{
  // No exception object/property is inspected. Even hostile accessor/proxy
  // exceptions cannot copy private text or execute another message getter.
  reason??='INVALID_PREPARATION_AUDIT';
 }
 return {version:SOL_DEVELOPMENT_POLICY_VERSION,status:'preparation-audit-only',readyForOwnerReview:reason===null,blockingReason:reason,effectiveEvidenceDeadline,maximumPossibleDExpiry,artifactAcceptance:artifact,mayIssueD:false,mayDeploy:false,mayReadCredentials:false,mayReserve:false,mayDispatch:false,mayWriteWebsite:false,mayPublish:false,automaticRetry:false};
}

/** V2 admission review after the separately approved timing policy exists.
 * The v1 audit above intentionally remains the historical60m/38m contract.
 * This typed v2 path is the only new operational-review preparation path; its
 * result is still not approval, D issuance, a claim or an execution capability.
 */
export function reviewSolDevelopmentPreparationV2(input,options={}){
 let reason=null,now=null,effectiveEvidenceDeadline=null,maximumPossibleDExpiry=null,artifact=null,headroom=null;
 const check=(condition,code)=>{if(!condition){reason=code;throw null;}};
 try{
  check(keys(options,[])||keys(options,['now']),'INVALID_REVIEW_OPTIONS');now=options.now??Date.now();
  check(integer(now)&&now>0&&integer(now+SOL_TIMING_POLICY_CANDIDATE.conditionalDMaxAgeMs),'INVALID_REVIEW_CLOCK');
  check(keys(input,['version','preparedSteps','approvedBindingsDigest','currentBindingsDigest','artifactAcceptance','originalEvidenceDeadlines','oneUseState','timingPolicyApproval','timingBindings','observations','approvalFirstObservedAt','approvalRecordedAt']),'INVALID_V2_PREPARATION_AUDIT');
  check(input.version===SOL_DEVELOPMENT_POLICY_V2_VERSION,'INVALID_POLICY_VERSION');
  check(keys(input.preparedSteps,SOL_PREPARATION_STEPS)&&SOL_PREPARATION_STEPS.every(step=>keys(input.preparedSteps[step],['verified','receiptSha256'])&&input.preparedSteps[step].verified===true&&sha(input.preparedSteps[step].receiptSha256)),'PREPARATION_INCOMPLETE');
  check(sha(input.approvedBindingsDigest)&&input.approvedBindingsDigest===input.currentBindingsDigest,'MATERIAL_BINDINGS_CHANGED');
  artifact=reviewSolArtifactAcceptance(input.artifactAcceptance);check(artifact.matches,'ARTIFACT_OR_CONDITIONS_CHANGED');
  check(input.oneUseState==='unclaimed','ONE_USE_OR_OUTCOME_REQUIRES_INVESTIGATION');
  const policy=reviewSolTimingPolicyApproval(input.timingPolicyApproval,{now,bindings:input.timingBindings});check(policy.ok,'EXACT_OWNER_TIMING_POLICY_REQUIRED');
  const d=input.originalEvidenceDeadlines;check(keys(d,['preparation','count','rate','tariff','financial','periodEnd'])&&Object.values(d).every(value=>integer(value)&&value>0),'INVALID_ORIGINAL_DEADLINES');
  effectiveEvidenceDeadline=Math.min(...Object.values(d),policy.supportingEvidenceUntil);check(effectiveEvidenceDeadline>now,'ORIGINAL_SUPPORTING_EVIDENCE_EXPIRED');
  maximumPossibleDExpiry=solConditionalEvidenceCeiling({issuedAt:now,supportingDeadlines:Object.values(d),timingPolicyApproval:input.timingPolicyApproval,bindings:input.timingBindings});
  check(maximumPossibleDExpiry-now>=SOL_TIMING_POLICY_CANDIDATE.deploymentMinimumRemainingMs,'SUPPORTING_EVIDENCE_CANNOT_FIT_DEPLOYMENT_PHASE');
  headroom=reviewSolEvidenceHeadroom({observations:input.observations,approvalFirstObservedAt:input.approvalFirstObservedAt,approvalRecordedAt:input.approvalRecordedAt,now});check(headroom.ok,'TYPED_EVIDENCE_ADMISSION_REQUIRED');
 }catch{reason??='INVALID_V2_PREPARATION_AUDIT';}
 return {version:SOL_DEVELOPMENT_POLICY_V2_VERSION,status:'v2-preparation-audit-only',readyForOwnerReview:reason===null,blockingReason:reason,effectiveEvidenceDeadline,maximumPossibleDExpiry,artifactAcceptance:artifact,evidenceHeadroom:headroom,timingPolicyVersion:SOL_TIMING_POLICY_VERSION,timingPolicyDigest:SOL_TIMING_POLICY_DIGEST,mayIssueD:false,mayDeploy:false,mayReadCredentials:false,mayReserve:false,mayDispatch:false,mayWriteWebsite:false,mayPublish:false,automaticRetry:false};
}
