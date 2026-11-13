// One-purpose protected-run caller composition. No default transport, env,
// credential storage, source write, OpenAI key or direct provider endpoint.
import {createHash} from 'node:crypto';
import {stableJson} from '../../src/core/stableJson.mjs';
import {sealSolPrivateResult,verifySolResultRecipient} from './sol-private-result.mjs';
import {SOL_TIMING_POLICY_CANDIDATE} from './sol-development-policy.mjs';

// Exact-run authority stays <=1h even when conditional artifact authority is4h.
// Four post-intent native reviews (3x10s), Auth10s+User10s+Function150s =290s;
// the additional10s margin is admitted BEFORE consuming the one-use intent.
const reviewGroupMs=SOL_TIMING_POLICY_CANDIDATE.nativeMetadataRequestTimeoutMs*SOL_TIMING_POLICY_CANDIDATE.nativeReviewRequestsPerStage;
export const SOL_PRIVATE_CALL_TIMING=Object.freeze({maximumExactRunMs:SOL_TIMING_POLICY_CANDIDATE.exactRunMaxAgeMs,minimumIntentHeadroomMs:SOL_TIMING_POLICY_CANDIDATE.exactRunMinimumRemainingMs,minimumCredentialHeadroomMs:SOL_TIMING_POLICY_CANDIDATE.exactRunMinimumRemainingMs-reviewGroupMs,minimumSignInHeadroomMs:SOL_TIMING_POLICY_CANDIDATE.exactRunMinimumRemainingMs-reviewGroupMs*2,minimumUserHeadroomMs:SOL_TIMING_POLICY_CANDIDATE.exactRunMinimumRemainingMs-reviewGroupMs*3-SOL_TIMING_POLICY_CANDIDATE.nativeAuthRequestTimeoutMs,minimumFunctionHeadroomMs:SOL_TIMING_POLICY_CANDIDATE.functionDispatchMinimumRemainingMs,nativeReviewTimeoutMs:SOL_TIMING_POLICY_CANDIDATE.nativeMetadataRequestTimeoutMs,nativeAuthTimeoutMs:SOL_TIMING_POLICY_CANDIDATE.nativeAuthRequestTimeoutMs,functionTimeoutMs:SOL_TIMING_POLICY_CANDIDATE.functionRequestTimeoutMs});
export function reviewSolPrivateCallHeadroom(expiresAt,now,stage='intent'){
 const stages={intent:SOL_PRIVATE_CALL_TIMING.minimumIntentHeadroomMs,credentials:SOL_PRIVATE_CALL_TIMING.minimumCredentialHeadroomMs,'native-sign-in':SOL_PRIVATE_CALL_TIMING.minimumSignInHeadroomMs,'native-user':SOL_PRIVATE_CALL_TIMING.minimumUserHeadroomMs,function:SOL_PRIVATE_CALL_TIMING.minimumFunctionHeadroomMs};
 if(typeof stage!=='string'||!Object.hasOwn(stages,stage))return {ok:false,failedPredicate:'EXACT_RUN_HEADROOM_INVALID_STAGE',checkedAt:Number.isSafeInteger(now)?now:null,expiresAt:Number.isSafeInteger(expiresAt)?expiresAt:null,requiredRemainingMs:null,remainingMs:null};
 const required=stages[stage],ok=Number.isSafeInteger(now)&&Number.isSafeInteger(expiresAt)&&Number.isSafeInteger(required)&&required>0&&expiresAt>now&&expiresAt-now<=SOL_PRIVATE_CALL_TIMING.maximumExactRunMs&&expiresAt-now>=required;
 return {ok,failedPredicate:ok?null:'EXACT_RUN_'+stage.toUpperCase().replaceAll('-','_')+'_HEADROOM',checkedAt:Number.isSafeInteger(now)?now:null,expiresAt:Number.isSafeInteger(expiresAt)?expiresAt:null,requiredRemainingMs:required??null,remainingMs:Number.isSafeInteger(expiresAt)&&Number.isSafeInteger(now)?expiresAt-now:null};
}

const LAB='https://sbvkrvksnruiclcvclbd.supabase.co',FUNCTION=LAB+'/functions/v1/busy-creative-document-pilot',EMAIL='quiet-light-owner@busy-ai-lab.invalid';
const hash=x=>createHash('sha256').update(x).digest('hex'),uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(x),need=x=>{if(!x)throw Error('sol_call_refused');};
const nativeOwner=(u,id)=>u&&u.id===id&&u.email===EMAIL&&u.role==='authenticated'&&u.aud==='authenticated'&&u.is_anonymous===false&&typeof u.email_confirmed_at==='string'&&Number.isFinite(Date.parse(u.email_confirmed_at))&&u.deleted_at==null&&u.banned_until==null&&u.is_super_admin!==true&&u.is_sso_user!==true&&Array.isArray(u.identities)&&u.identities.length===1&&u.identities[0]?.provider==='email'&&u.identities[0]?.user_id===id;

/** Trusted caller must verify native protected exact-run approval and actual
 * C2 readback before claimApprovedCall succeeds. This port is NOT that gate.
 * It reuses B3's fixed native password/sign-in contract, never its consumed
 * source approval, source writer, admin key, refresh or onboarding runtime.
 */
export function createPrivateSolCallPort(server={}){
 let used=false;
 return async grant=>{
  const receipt={version:'busy.sol-private-call-receipt.v1',status:'denied',mayReplay:false,failedPredicate:null,timingChecks:{},intentClaimAttempted:false,nativeSignIns:0,nativeUserReads:0,functionRequestsAttempted:0,directProviderCalls:0,actualProviderCalls:null,actualPaidCostGBP:null,websiteWrites:0,publication:false};
  if(used)return {receipt,encryptedOutcome:null};used=true;
  let binding,recipient,claimed=false,keys=null,password=null,knownPassword=null,token=null,encryptedOutcome=null,privateOutcome={version:'busy.sol-private-http-outcome.v1',status:'not-attempted'},wholeAbort;
  const now=()=>server.clock?.()??Date.now();
  const current=(stage)=>{const at=now(),valid=Number.isSafeInteger(at)&&Number.isSafeInteger(grant.issuedAt)&&grant.issuedAt<=at&&grant.expiresAt>at&&grant.expiresAt>grant.issuedAt&&grant.expiresAt-grant.issuedAt<=SOL_PRIVATE_CALL_TIMING.maximumExactRunMs;if(!valid){receipt.failedPredicate='EXACT_RUN_ISSUANCE_OR_EXPIRY';throw Error('sol_call_refused');}if(stage){const review=reviewSolPrivateCallHeadroom(grant.expiresAt,at,stage);receipt.timingChecks[stage]=review;if(!review.ok){receipt.failedPredicate=review.failedPredicate;throw Error('sol_call_refused');}}};
  const beforeRequest=async stage=>{if(server.beforeRequest!==undefined){need(typeof server.beforeRequest==='function');await server.beforeRequest(stage);}current(stage);};
  const read=async(url,options,timeout,maxBytes)=>{
   const controller=new AbortController();let timer,reader;wholeAbort=controller;
   const task=async()=>{
    const response=await server.transport(url,{...options,redirect:'error',cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal});
    need(response&&Number.isSafeInteger(response.status)&&response.status>=100&&response.status<=599&&response.redirected!==true&&(!response.url||response.url===url));
    const length=response.headers?.get('content-length');need(length===null||length===undefined||/^\d+$/.test(length)&&Number(length)<=maxBytes);
    reader=response.body?.getReader();if(!reader){need(length==null||Number(length)===0);return {status:response.status,contentType:response.headers?.get('content-type')||'',bytes:Buffer.alloc(0)};}let size=0;const chunks=[];
    for(;;){const p=await reader.read();if(p.done)break;need(p.value instanceof Uint8Array&&(size+=p.value.length)<=maxBytes);chunks.push(p.value);}
    const bytes=Buffer.concat(chunks.map(x=>Buffer.from(x)));return {status:response.status,contentType:response.headers?.get('content-type')||'',bytes};
   };
   try{return await Promise.race([task(),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('deadline'));},Math.min(timeout,Math.max(1,grant.expiresAt-now())));})]);}
   finally{clearTimeout(timer);controller.abort();try{void reader?.cancel()?.catch(()=>{});}catch{}try{reader?.releaseLock();}catch{}}
  };
  try{
   need(['claimApprovedCall','readNativeCredentials','transport','writeEncryptedOutcome'].every(k=>typeof server[k]==='function'));
   need(grant&&Object.getPrototypeOf(grant)===Object.prototype&&Object.keys(grant).sort().join(',')===['version','ownerId','operationId','requestNonce','requestDigest','manifestDigest','runId','attempt','actor','eventSha','functionId','functionVersion','issuedAt','expiresAt','maximumGBP','maximumSignIns','maximumFunctionRequests','automaticRetry','maySave','mayPublish','recipientPublicKey','recipientSha256'].sort().join(','));
   need(Object.getOwnPropertySymbols(grant).length===0&&Object.values(Object.getOwnPropertyDescriptors(grant)).every(x=>Object.hasOwn(x,'value')&&['string','number','boolean'].includes(typeof x.value)));
   grant=Object.freeze({...grant});
   need(grant.version==='busy.sol-private-call-grant.v2'&&[grant.ownerId,grant.operationId,grant.requestNonce].every(uuid)&&grant.operationId!==grant.requestNonce&&grant.actor==='7774cg5t75-cloud'&&grant.attempt===1&&grant.maximumGBP===1&&grant.maximumSignIns===1&&grant.maximumFunctionRequests===1&&grant.automaticRetry===false&&grant.maySave===false&&grant.mayPublish===false&&Number.isSafeInteger(grant.expiresAt));current();
   binding={version:'busy.sol-private-result-binding.v1',projectId:'sbvkrvksnruiclcvclbd',runId:grant.runId,attempt:1,eventSha:grant.eventSha,operationDigest:hash(stableJson({operationId:grant.operationId,requestNonce:grant.requestNonce})),requestDigest:grant.requestDigest,manifestDigest:grant.manifestDigest,functionId:grant.functionId,functionVersion:grant.functionVersion};
   recipient=verifySolResultRecipient(grant.recipientPublicKey,binding);need(recipient.recipientSha256===grant.recipientSha256);
   const identity={grantDigest:hash(stableJson(grant)),...binding,recipientSha256:recipient.recipientSha256};
   if(server.prepareClaim!==undefined){need(typeof server.prepareClaim==='function');await server.prepareClaim(identity);}
   current('intent');receipt.intentClaimAttempted=true;need(await server.claimApprovedCall(identity)===true);claimed=true;current('credentials');
   const supplied=await server.readNativeCredentials();need(supplied&&Object.getPrototypeOf(supplied)===Object.prototype&&Object.keys(supplied).sort().join(',')==='ownerPassword,publishableKey'&&Object.getOwnPropertySymbols(supplied).length===0&&Object.values(Object.getOwnPropertyDescriptors(supplied)).every(x=>Object.hasOwn(x,'value'))&&typeof supplied.publishableKey==='string'&&/^sb_publishable_[A-Za-z0-9_-]{16,512}$/.test(supplied.publishableKey)&&typeof supplied.ownerPassword==='string'&&supplied.ownerPassword.length>=8&&supplied.ownerPassword.length<=1024);
   keys={publishableKey:supplied.publishableKey};password=supplied.ownerPassword;knownPassword=password;current();await beforeRequest('native-sign-in');receipt.nativeSignIns=1;
   let auth;try{auth=await read(LAB+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:keys.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({email:EMAIL,password})},SOL_PRIVATE_CALL_TIMING.nativeAuthTimeoutMs,32768);}finally{password=null;}
   need(auth.status===200&&/^application\/json(?:;|$)/i.test(auth.contentType));const session=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(auth.bytes));auth=null;
   need(typeof session.access_token==='string'&&session.access_token.length>=20&&session.access_token.length<=4096&&/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(session.access_token)&&String(session.token_type).toLowerCase()==='bearer'&&Number.isSafeInteger(session.expires_in)&&session.expires_in>=1&&session.expires_in<=86400&&nativeOwner(session.user,grant.ownerId));
   token=session.access_token;const sessionUntil=now()+session.expires_in*1000;current();need(sessionUntil>now());await beforeRequest('native-user');receipt.nativeUserReads=1;
   const owner=await read(LAB+'/auth/v1/user',{method:'GET',headers:{apikey:keys.publishableKey,Authorization:'Bearer '+token}},SOL_PRIVATE_CALL_TIMING.nativeAuthTimeoutMs,32768);
   need(owner.status===200&&/^application\/json(?:;|$)/i.test(owner.contentType)&&nativeOwner(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(owner.bytes)),grant.ownerId));
   current();need(sessionUntil>now());await beforeRequest('function');receipt.functionRequestsAttempted=1;
   const result=await read(FUNCTION,{method:'POST',headers:{apikey:keys.publishableKey,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:stableJson({version:2,operationId:grant.operationId})},SOL_PRIVATE_CALL_TIMING.functionTimeoutMs,2000000);
   const rawText=result.bytes.toString('utf8');need(result.contentType.length<=256&&![keys.publishableKey,token,knownPassword].some(x=>rawText.includes(x)||result.contentType.includes(x)));
   privateOutcome={version:'busy.sol-private-http-outcome.v1',status:'complete-http-response',receivedAt:now(),httpStatus:result.status,contentType:result.contentType,rawBodySha256:hash(result.bytes),rawBodyBase64:result.bytes.toString('base64'),complete:true};
   receipt.status='private-response-retained';receipt.httpStatus=result.status;
  }catch{receipt.status=claimed||receipt.intentClaimAttempted?'stopped-inspect-only':'denied';privateOutcome={version:'busy.sol-private-http-outcome.v1',status:'unconfirmed',nativeSignInAttempted:receipt.nativeSignIns===1,functionRequestAttempted:receipt.functionRequestsAttempted===1,inspectOriginalReceipt:receipt.functionRequestsAttempted===1};}
  finally{wholeAbort?.abort();password=null;knownPassword=null;token=null;keys=null;}
  if(claimed){
   try{encryptedOutcome=sealSolPrivateResult(Buffer.from(stableJson(privateOutcome)),binding,grant.recipientPublicKey);await server.writeEncryptedOutcome(encryptedOutcome);receipt.encryptedOutcomeStored=true;receipt.recipientSha256=recipient.recipientSha256;receipt.bindingDigest=recipient.bindingDigest;}
   catch{receipt.status='encrypted-outcome-unconfirmed';receipt.encryptedOutcomeStored=false;}
  }
  receipt.requiresIndependentOriginalReceiptReadback=receipt.functionRequestsAttempted===1;
  return {receipt,encryptedOutcome};
 };
}
