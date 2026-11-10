// Original private-result crypto and Website Builder, composed for LOCAL review.
// No network, provider, Auth, hosted write, key generation or publication port.
import {createHash} from 'node:crypto';
import {inflateRawSync} from 'node:zlib';
import {stableJson} from '../../src/core/stableJson.mjs';
import {applyWebsitePageChange,renderWebsiteHtml} from '../../src/domain/websiteBuilder.js';
import {prepareWebsiteCreativeDocument,parseWebsiteCreativeDocumentResponse,reviewSettledWebsiteCreativeDocumentProposal} from '../../src/core/websiteCreativeDocumentReview.mjs';
import {projectWebsiteCreativeDocumentProviderRequest,WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION} from '../../supabase/functions/busy-builder-proposals/websiteIntelligenceProviderProjection.mjs';
import {CREATIVE_DOCUMENT_REVISED_PROFILE} from '../../supabase/functions/busy-builder-proposals/creativeDocumentPilotProfiles.mjs';
import {hostedCreativeContext,HOSTED_CREATIVE_PROPOSED_INTENT} from './hosted-creative-pilot.mjs';
import {openSolPrivateResult,verifySolResultRecipient} from './sol-private-result.mjs';
import {solDesignApprovalComment} from './ai-lab-sol-design-handoff.mjs';

export const SOL_RESULT_RECOVERY_VERSION='busy.sol-private-result-recovery.v1';
export const SOL_RESULT_PREVIEW_VERSION='busy.sol-private-rendered-proposal.v1';
const names=['intent.json','outcome.encrypted.json','receipt.json'];
const need=(v,id)=>{if(!v)throw Error('SOL_RESULT_RECOVERY_'+id);};
const plain=v=>v&&Object.getPrototypeOf(v)===Object.prototype;
const sha=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
export const solRecoveryHash=v=>createHash('sha256').update(typeof v==='string'||v instanceof Uint8Array?v:stableJson(v)).digest('hex');
const exact=(v,k)=>plain(v)&&Object.keys(v).sort().join(',')===[...k].sort().join(',');
const bytesText=b=>new TextDecoder('utf-8',{fatal:true}).decode(b);
const parse=b=>JSON.parse(bytesText(b));
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const crc32=bytes=>{let n=0xffffffff;for(const b of bytes)n=crcTable[(n^b)&255]^(n>>>8);return (n^0xffffffff)>>>0;};

/** Strict bounded in-memory ZIP parser. No extraction or executable archive
 * member is permitted. The archive must be the unchanged native GitHub ZIP. */
export function readSolResultZip(input){
 const b=Buffer.from(input);need(b.length>=22&&b.length<=8388608,'ZIP_SIZE');
 let end=-1;
 for(let p=b.length-22;p>=Math.max(0,b.length-65557);p--)if(b.readUInt32LE(p)===0x06054b50&&p+22+b.readUInt16LE(p+20)===b.length){end=p;break;}
 need(end>=0&&b.readUInt16LE(end+4)===0&&b.readUInt16LE(end+6)===0&&b.readUInt16LE(end+8)===3&&b.readUInt16LE(end+10)===3,'ZIP_DIRECTORY');
 const size=b.readUInt32LE(end+12),start=b.readUInt32LE(end+16);need(start+size===end&&start<end,'ZIP_DIRECTORY');
 let p=start,total=0;const entries={},ranges=[];
 for(let i=0;i<3;i++){
  need(p+46<=end&&b.readUInt32LE(p)===0x02014b50,'ZIP_ENTRY');
  const flags=b.readUInt16LE(p+8),method=b.readUInt16LE(p+10),crc=b.readUInt32LE(p+16),compressed=b.readUInt32LE(p+20),length=b.readUInt32LE(p+24),nl=b.readUInt16LE(p+28),el=b.readUInt16LE(p+30),cl=b.readUInt16LE(p+32),offset=b.readUInt32LE(p+42),unixMode=b.readUInt32LE(p+38)>>>16;
  need((flags&~0x080e)===0&&(method===0||method===8)&&b.readUInt16LE(p+34)===0&&compressed<=6000000&&length<=6000000&&(total+=length)<=8000000&&p+46+nl+el+cl<=end,'ZIP_ENTRY_BOUNDS');
  need((unixMode&0xf000)!==0xa000&&(unixMode&0xf000)!==0x4000,'ZIP_NOT_REGULAR');
  const name=bytesText(b.subarray(p+46,p+46+nl));need(names.includes(name)&&!Object.hasOwn(entries,name),'ZIP_MEMBER_SET');
  for(let e=p+46+nl;e<p+46+nl+el;){need(e+4<=p+46+nl+el,'ZIP_EXTRA');const kind=b.readUInt16LE(e),n=b.readUInt16LE(e+2);need(kind!==1&&e+4+n<=p+46+nl+el,'ZIP64_OR_EXTRA');e+=4+n;}
  need(offset+30<=start&&b.readUInt32LE(offset)===0x04034b50&&b.readUInt16LE(offset+6)===flags&&b.readUInt16LE(offset+8)===method,'ZIP_LOCAL_HEADER');
  const ln=b.readUInt16LE(offset+26),le=b.readUInt16LE(offset+28),data=offset+30+ln+le;need(data+compressed<=start&&bytesText(b.subarray(offset+30,offset+30+ln))===name,'ZIP_LOCAL_MEMBER');
  if(!(flags&8))need(b.readUInt32LE(offset+14)===crc&&b.readUInt32LE(offset+18)===compressed&&b.readUInt32LE(offset+22)===length,'ZIP_LOCAL_SIZES');
  let finish=data+compressed;
  if(flags&8){need(finish+12<=start,'ZIP_DESCRIPTOR');if(b.readUInt32LE(finish)===0x08074b50)finish+=4;need(finish+12<=start&&b.readUInt32LE(finish)===crc&&b.readUInt32LE(finish+4)===compressed&&b.readUInt32LE(finish+8)===length,'ZIP_DESCRIPTOR');finish+=12;}
  const raw=b.subarray(data,data+compressed),value=method===0?Buffer.from(raw):inflateRawSync(raw,{maxOutputLength:6000000});need(value.length===length&&crc32(value)===crc,'ZIP_CRC_OR_LENGTH');
  entries[name]=value;ranges.push([offset,finish]);p+=46+nl+el+cl;
 }
 need(p===end&&Object.keys(entries).sort().join(',')===names.join(','),'ZIP_MEMBER_SET');ranges.sort((a,b)=>a[0]-b[0]);need(ranges[0][0]===0&&ranges[2][1]===start&&ranges.every((x,i)=>i===0||ranges[i-1][1]===x[0]),'ZIP_OVERLAP_OR_PADDING');
 return {zipSha256:solRecoveryHash(b),members:entries,memberSha256:Object.fromEntries(Object.entries(entries).map(([n,v])=>[n,solRecoveryHash(v)]))};
}

export function solRecoveryBinding(grant){
 return {version:'busy.sol-private-result-binding.v1',projectId:'sbvkrvksnruiclcvclbd',runId:grant.runId,attempt:1,eventSha:grant.eventSha,operationDigest:solRecoveryHash(stableJson({operationId:grant.operationId,requestNonce:grant.requestNonce})),requestDigest:grant.requestDigest,manifestDigest:grant.manifestDigest,functionId:grant.functionId,functionVersion:grant.functionVersion};
}

/** Native evidence is collected independently through the original read-only
 * GitHub connector. This function never claims its JSON is cryptographically
 * attested. Its exact raw file hash belongs in the owner-private recovery job. */
export function verifySolRecoveryArchive(zipBytes,{grant,native,markerRaw,expectedRecipientSha256}){
 need(plain(grant)&&grant.version==='busy.sol-private-call-grant.v2'&&grant.attempt===1&&grant.actor==='7774cg5t75-cloud'&&grant.maximumGBP===1&&grant.maximumSignIns===1&&grant.maximumFunctionRequests===1&&grant.automaticRetry===false&&grant.maySave===false&&grant.mayPublish===false&&Number.isSafeInteger(grant.functionVersion)&&grant.functionVersion>=2&&Number.isSafeInteger(grant.issuedAt)&&Number.isSafeInteger(grant.expiresAt)&&grant.issuedAt>0&&grant.expiresAt>grant.issuedAt&&grant.expiresAt-grant.issuedAt<=3600000,'GRANT');
 const binding=solRecoveryBinding(grant),recipient=verifySolResultRecipient(grant.recipientPublicKey,binding),grantDigest=solRecoveryHash(grant),zip=readSolResultZip(zipBytes);
 need(sha(expectedRecipientSha256)&&recipient.recipientSha256===expectedRecipientSha256&&grant.recipientSha256===recipient.recipientSha256,'RECIPIENT');
 need(native?.version==='busy.sol-result-native-artifact-evidence.v1'&&native.independentlyVerified===true&&plain(native.run)&&plain(native.artifact)&&plain(native.job)&&Array.isArray(native.reviews),'NATIVE_EVIDENCE');
 const {run,artifact,job}=native;
 need(run.id===Number(grant.runId)&&run.run_attempt===1&&run.head_sha===grant.eventSha&&run.path==='.github/workflows/ai-lab-sol-design-request.yml'&&run.event==='push'&&run.head_branch==='codex/builder-mission15-design-advancement'&&run.actor?.login===grant.actor&&run.triggering_actor?.login===grant.actor&&run.repository?.full_name==='7774cg5t75-cloud/busy-does-it-app'&&run.repository.private===false&&run.status==='completed'&&['success','failure','cancelled','timed_out'].includes(run.conclusion),'NATIVE_RUN');
 need(job.run_id===run.id&&job.head_sha===grant.eventSha&&(job.run_attempt===undefined||job.run_attempt===1)&&job.name==='exact-private-sol-design-request'&&job.status==='completed'&&['success','failure','cancelled','timed_out'].includes(job.conclusion)&&Number.isFinite(Date.parse(job.started_at))&&Date.parse(job.started_at)<grant.expiresAt,'NATIVE_JOB');
 need(artifact.name==='sol-private-design-'+grant.runId&&typeof artifact.expired==='boolean'&&Number.isSafeInteger(artifact.id)&&artifact.id>0&&artifact.workflow_run?.id===run.id&&artifact.workflow_run?.head_sha===grant.eventSha&&artifact.digest==='sha256:'+zip.zipSha256,'NATIVE_ARCHIVE_DIGEST');
 const review=native.reviews.filter(r=>r?.environments?.some(e=>e.id===26548866516||e.name==='busy-ai-lab-b3-source'));
 const comment=solDesignApprovalComment({runId:grant.runId,eventSha:grant.eventSha,grantDigest,expiresAt:new Date(grant.expiresAt).toISOString().replace('.000Z','Z')});
 need(review.length===1&&review[0].state==='approved'&&review[0].user?.login===grant.actor&&review[0].environments.length===1&&review[0].environments[0].id===26548866516&&review[0].environments[0].name==='busy-ai-lab-b3-source'&&review[0].environments[0].can_admins_bypass===false&&review[0].comment===comment,'NATIVE_REVIEW');
 need(markerRaw instanceof Uint8Array&&markerRaw.byteLength<=65536&&native.markerCommit===run.head_sha&&native.marker?.type==='file'&&native.marker.path==='.github/ai-lab-sol-design-request.json'&&native.marker.encoding==='base64'&&typeof native.marker.content==='string','NATIVE_MARKER');
 const markerBase64=native.marker.content.replace(/\r?\n/g,''),markerBytes=Buffer.from(markerBase64,'base64');need(markerBytes.toString('base64')===markerBase64&&markerBytes.equals(Buffer.from(markerRaw))&&createHash('sha1').update(Buffer.concat([Buffer.from('blob '+markerBytes.length+'\0'),markerBytes])).digest('hex')===native.marker.sha,'NATIVE_MARKER_BYTES');
 const marker=parse(markerRaw);need(marker?.version==='busy.ai-lab-sol-design-handoff.v1'&&stableJson(marker.target)===stableJson({projectId:'sbvkrvksnruiclcvclbd',organisationId:'wrjfgasxtlznzfzmfrif',region:'eu-west-1',functionName:'busy-creative-document-pilot'})&&marker.maximumGBP===1&&marker.maximumSignIns===1&&marker.maximumFunctionRequests===1&&marker.automaticRetry===false&&marker.maySave===false&&marker.mayPublish===false&&marker.request?.model==='gpt-6.1-sol'&&marker.request.wireDigest===grant.requestDigest&&marker.request.manifestDigest===grant.manifestDigest&&marker.request.recipientSha256===grant.recipientSha256&&marker.deployment?.functionId===grant.functionId&&marker.deployment.functionVersion===grant.functionVersion&&sha(marker.source?.filesDigest)&&sha(marker.deployment.readbackEvidenceSha256),'EXACT_REVIEWED_MARKER');
 need(plain(marker.source.files)&&Object.keys(marker.source.files).length<=170&&Object.entries(marker.source.files).every(([name,digest])=>typeof name==='string'&&!name.startsWith('/')&&!name.split('/').includes('..')&&sha(digest))&&solRecoveryHash(marker.source.files)===marker.source.filesDigest&&['.github/workflows/ai-lab-sol-design-request.yml','scripts/run-ai-lab-sol-design-request.mjs','scripts/lib/sol-private-call.mjs','scripts/lib/sol-private-result.mjs'].every(name=>Object.hasOwn(marker.source.files,name)),'REVIEWED_SOURCE_INVENTORY');
 const intent=parse(zip.members['intent.json']),receipt=parse(zip.members['receipt.json']),envelope=parse(zip.members['outcome.encrypted.json']);
 for(const v of [intent,receipt])need(plain(v)&&v.version==='busy.ai-lab-sol-design-handoff.v1'&&v.runId===grant.runId&&v.eventSha===grant.eventSha&&v.grantDigest===grantDigest&&v.wireDigest===grant.requestDigest&&v.manifestDigest===grant.manifestDigest&&v.recipientSha256===recipient.recipientSha256&&v.mayReplay===false,'RUN_RECEIPT_BINDING');
 need(intent.executionId===receipt.executionId&&intent.executionId===marker.executionId&&typeof intent.executionId==='string'&&intent.filesDigest===marker.source.filesDigest&&receipt.filesDigest===marker.source.filesDigest&&intent.readbackEvidenceSha256===marker.deployment.readbackEvidenceSha256&&receipt.readbackEvidenceSha256===marker.deployment.readbackEvidenceSha256&&intent.maximumGBP===1&&intent.maximumSignIns===1&&intent.maximumFunctionRequests===1,'INTENT');
 need(['private-response-retained','stopped-inspect-only','encrypted-outcome-unconfirmed'].includes(receipt.status)&&[0,1].includes(receipt.nativeSignIns)&&[0,1].includes(receipt.nativeUserReads)&&[0,1].includes(receipt.functionRequestsAttempted)&&receipt.directProviderCalls===0&&(receipt.encryptedOutcomeStored===true||receipt.status==='encrypted-outcome-unconfirmed'&&receipt.encryptedOutcomeStored===false)&&receipt.websiteWrites===0&&receipt.publication===false&&receipt.requiresIndependentOriginalReceiptReadback===(receipt.functionRequestsAttempted===1),'RECEIPT');
 need(envelope.recipientSha256===recipient.recipientSha256&&stableJson(envelope.binding)===stableJson(binding)&&(receipt.bindingDigest===recipient.bindingDigest||receipt.status==='encrypted-outcome-unconfirmed'&&receipt.bindingDigest===undefined),'ENCRYPTED_BINDING');
 return {version:SOL_RESULT_RECOVERY_VERSION,binding,grantDigest,grantIssuedAt:grant.issuedAt,grantExpiresAt:grant.expiresAt,recipientSha256:recipient.recipientSha256,zipSha256:zip.zipSha256,memberSha256:zip.memberSha256,receipt,envelope,nativeArtifactId:artifact.id,nativeRunSucceeded:run.conclusion==='success'&&job.conclusion==='success',nativeRunConclusion:run.conclusion,nativeJobConclusion:job.conclusion,providerCallOrCostProven:false,websiteWrites:0,mayReplay:false};
}

export function decryptVerifiedSolArchive(verified,privatePem){
 need(verified?.version===SOL_RESULT_RECOVERY_VERSION&&plain(verified.envelope),'VERIFIED_ARCHIVE');
 const bytes=openSolPrivateResult(verified.envelope,verified.binding,privatePem),outcome=parse(bytes);
 if(outcome?.version==='busy.sol-private-http-outcome.v1'&&outcome.status==='unconfirmed'){
  need(exact(outcome,['version','status','nativeSignInAttempted','functionRequestAttempted','inspectOriginalReceipt'])&&['nativeSignInAttempted','functionRequestAttempted','inspectOriginalReceipt'].every(k=>typeof outcome[k]==='boolean'),'PRIVATE_UNKNOWN_OUTCOME');
  return {verified,outcome,outcomeBytes:bytes,body:null,bodyJSON:null,renderEligible:false,inspectOriginalReceipt:true};
 }
 need(exact(outcome,['version','status','receivedAt','httpStatus','contentType','rawBodySha256','rawBodyBase64','complete'])&&outcome.version==='busy.sol-private-http-outcome.v1'&&outcome.status==='complete-http-response'&&outcome.complete===true&&Number.isSafeInteger(outcome.httpStatus)&&outcome.httpStatus>=100&&outcome.httpStatus<=599&&typeof outcome.contentType==='string'&&outcome.contentType.length<=256&&Number.isSafeInteger(outcome.receivedAt)&&outcome.receivedAt>=verified.grantIssuedAt&&sha(outcome.rawBodySha256)&&typeof outcome.rawBodyBase64==='string'&&outcome.rawBodyBase64.length<=2800000,'PRIVATE_HTTP_OUTCOME');
 const body=Buffer.from(outcome.rawBodyBase64,'base64');need(body.toString('base64')===outcome.rawBodyBase64&&body.length<=2000000&&solRecoveryHash(body)===outcome.rawBodySha256,'PRIVATE_BODY_HASH');
 // Overall native-run success is not a prerequisite for preserving a complete,
 // authorised function response. A later job/upload failure does not permit a
 // paid replay or erase usable output. All source/response checks below remain
 // mandatory, and the preview must retain the native failure qualification.
 const renderEligible=verified.receipt.status==='private-response-retained'&&verified.receipt.nativeSignIns===1&&verified.receipt.nativeUserReads===1&&verified.receipt.functionRequestsAttempted===1&&outcome.httpStatus===200&&/^application\/json(?:;|$)/i.test(outcome.contentType);
 let bodyJSON=null;if(renderEligible)try{bodyJSON=parse(body);}catch{}
 return {verified,outcome,outcomeBytes:bytes,body,bodyJSON,renderEligible:renderEligible&&bodyJSON!==null,inspectOriginalReceipt:!renderEligible||bodyJSON===null};
}

/** Reconstruct only an unsaved LOCAL preview through ORIGINAL validators,
 * page action and renderer. Financially confirmed results still use the
 * untouched original settled Studio-review gate. A separately permitted
 * unknown-finance preview creates no Studio review or financial success. */
export async function prepareRecoveredSolPreview(recovered,{sourceEnvelope,grant,independentSettlement,allowFinanciallyUnconfirmedPreview=false}){
 need(recovered?.renderEligible===true,'RENDER_REQUIRES_CONFIRMED_SUCCESS');
 const before=stableJson(sourceEnvelope),context=hostedCreativeContext(sourceEnvelope),prepared=await prepareWebsiteCreativeDocument(context,{goal:context.goal,approvedIntent:HOSTED_CREATIVE_PROPOSED_INTENT,digestBytes:async b=>solRecoveryHash(b)});
 need(prepared.ok,'ORIGINAL_SOURCE_PREPARATION');
 const projection=await projectWebsiteCreativeDocumentProviderRequest(prepared,context,{model:'gpt-6.1-sol',budgetProfile:CREATIVE_DOCUMENT_REVISED_PROFILE,digestBytes:async b=>solRecoveryHash(b)});
 need(projection.ok&&projection.requestDigest===grant.requestDigest&&projection.requestDigest===recovered.verified.binding.requestDigest,'EXACT_ORIGINAL_REQUEST');
 const result=recovered.bodyJSON,r=independentSettlement?.receipt;
 need(result?.ok===true&&result.code==='review_required'&&result.protocol===WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION&&result.origin==='real-model'&&result.maySave===false&&result.mayPublish===false&&result.mayRetry===false&&result.originalStudioApprovalRequired===true&&result.sourceInputDigest===projection.inputDigest&&result.requestDigest===projection.requestDigest,'ORIGINAL_FUNCTION_RESULT');
 const scope={ownerId:context.ownerId,businessId:context.businessId,projectId:context.website.id,sourceRevision:context.website.generation,profileRevision:context.profileRevision,surface:'website',pageId:'home'};
 need(grant.ownerId===context.ownerId,'ORIGINAL_OWNER');
 let candidate,financialStatus,settlement,studioReviewPrepared=false;
 if(independentSettlement?.version==='busy.sol-original-settlement-readback.v1'){
  need(independentSettlement.independentlyVerified===true&&stableJson(result.receipt)===stableJson(r)&&r.status==='settled'&&r.operationId===grant.operationId&&r.model==='gpt-6.1-sol'&&r.budgetProfile===CREATIVE_DOCUMENT_REVISED_PROFILE&&String(r.tariffRevision)==='2'&&r.admittedGBP===0.2464,'INDEPENDENT_SETTLEMENT');
  const expected={operationId:grant.operationId,scope,sourceStamp:prepared.sourceStamp,inputDigest:projection.envelopeDigest,requestDigest:projection.requestDigest,model:'gpt-6.1-sol',budgetProfile:CREATIVE_DOCUMENT_REVISED_PROFILE,providerReceipt:r.providerReceipt,inputTokens:r.inputTokens,outputTokens:r.outputTokens};
  const reviewed=await reviewSettledWebsiteCreativeDocumentProposal(prepared,stableJson(result.proposal),context,{pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml},{expected,readReceipt:async()=>r});
  need(reviewed.ok&&reviewed.origin==='real-model'&&reviewed.review.accountSaved===false&&reviewed.review.neverPublishes===true,'ORIGINAL_SETTLED_REVIEW');
  candidate=reviewed.review.candidate;financialStatus='independently-settled';studioReviewPrepared=true;
  settlement={status:'independently-settled',providerReceipt:r.providerReceipt,inputTokens:r.inputTokens,totalOutputTokens:r.outputTokens,actualUsageAccountingGBP:r.actualGBP,actualCashCostGuaranteed:false};
 }else{
  // This is an explicit UNKNOWN assessment, never a fallback for a failed or
  // contradictory settled-receipt check. No caller-supplied cost is promoted.
  const u=independentSettlement;
  need(allowFinanciallyUnconfirmedPreview===true&&u?.version==='busy.sol-financial-status-unknown.v1'&&u.status==='unknown-inspect-original-ledger'&&u.operationId===grant.operationId&&u.requestDigest===grant.requestDigest&&u.sourceInputDigest===projection.inputDigest&&u.model==='gpt-6.1-sol'&&String(u.tariffRevision)==='2'&&u.actualCostVerified===false&&u.liabilityMustRemainReserved===true&&u.mayReplay===false,'EXPLICIT_UNKNOWN_FINANCIAL_PREVIEW');
  const claimed=result.receipt;
  need(plain(claimed)&&claimed.operationId===grant.operationId&&claimed.requestDigest===projection.requestDigest&&claimed.inputDigest===projection.envelopeDigest&&stableJson(claimed.scope)===stableJson(scope)&&claimed.model==='gpt-6.1-sol'&&claimed.budgetProfile===CREATIVE_DOCUMENT_REVISED_PROFILE&&String(claimed.tariffRevision)==='2'&&claimed.admittedGBP===0.2464,'UNCONFIRMED_RESPONSE_SCOPE');
  const parsed=parseWebsiteCreativeDocumentResponse(stableJson(result.proposal),prepared,context);need(parsed.ok,'ORIGINAL_SOURCE_DOCUMENT_VALIDATION');
  // Use the original pure page action, but create no one-use Studio review
  // acceptance and never mislabel this result as a deterministic fixture.
  const edited=applyWebsitePageChange(context.website,{action:'apply-site-creative-document',expectedWebsiteId:context.website.id,expectedGeneration:context.website.generation,expectedBusinessId:context.businessId,expectedProfileRevision:context.profileRevision,document:parsed.proposal.document,approvedIntent:prepared.approvedIntent});
  need(edited.applied===true&&edited.draft?.id===context.website.id&&edited.draft.businessId===context.businessId&&edited.draft.generation===context.website.generation+1,'ORIGINAL_PURE_PAGE_ACTION');
  candidate=structuredClone(edited.draft);financialStatus='unknown';
  settlement={status:'unknown',actualUsageAccountingGBP:null,actualCostVerified:false,liabilityReadbackVerified:false,liabilityMustRemainReserved:true,requiresOriginalLedgerReadback:true,mayReplay:false,actualCashCostGuaranteed:false};
 }
 need(candidate.status==='Draft'&&candidate.publicStatus==='Not published'&&candidate.pages.map(p=>p.id).join(',')==='home,services,contact','PRIVATE_THREE_PAGE_CANDIDATE');
 const privateValues=[context.ownerId,context.businessId,grant.operationId,grant.requestNonce,sourceEnvelope.approvedBinding.executionId,sourceEnvelope.approvedBinding.requestNonce].filter(Boolean);
 const pages=candidate.pages.map(p=>{const html=renderWebsiteHtml(candidate,p.id,{standalone:true,privatePagePreview:true});need(typeof html==='string'&&html.startsWith('<!doctype html>')&&!/<script\b|data-busy-edit-section/i.test(html)&&privateValues.every(v=>!html.includes(v)),'SAFE_ORIGINAL_RENDER');return {id:p.id,title:p.title,path:p.path,outputPath:p.outputPath,html,htmlSha256:solRecoveryHash(html),bytes:Buffer.byteLength(html)};});
 need(stableJson(sourceEnvelope)===before,'SOURCE_UNCHANGED');
 return {version:SOL_RESULT_PREVIEW_VERSION,origin:financialStatus==='independently-settled'?'independently-settled-real-Sol-unsaved-private-proposal':'real-Sol-local-preview-financial-status-UNKNOWN',genuineModelResult:true,financialStatus,studioReviewPrepared,nativeRunSucceeded:recovered.verified.nativeRunSucceeded,nativeRunConclusion:recovered.verified.nativeRunConclusion,nativeJobConclusion:recovered.verified.nativeJobConclusion,postStepFailure:recovered.verified.nativeRunSucceeded===false,nativeCompletionStatus:recovered.verified.nativeRunSucceeded?'native-run-completed-successfully':'native-poststep-failure-qualified-preview',finishedWebsiteClaim:false,sourceEnvelopeSha256:solRecoveryHash(before),sourceObservedAt:sourceEnvelope.observedAt,sourceSnapshotRevision:5,currentHostedStateVerifiedByRecovery:false,requestDigest:projection.requestDigest,manifestDigest:grant.manifestDigest,zipSha256:recovered.verified.zipSha256,recipientSha256:recovered.verified.recipientSha256,settlement,pages,candidate,hostedSaved:false,websiteWrites:0,publication:false,providerCallsByRecovery:0,professionalAcceptance:false,requiresOwnerVisualReview:true,requiresIndependentFinancialCompletion:financialStatus==='unknown',mayReplay:false};
}
