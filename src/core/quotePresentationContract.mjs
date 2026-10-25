// Finite formatting/intent validation only. No authentication or disclosure authority.
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const hash=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
export function isQuotePresentationProjection(v,id,referenceId){return !!v&&v.engagementId===id&&v.referenceId===referenceId&&v.status==='Prepared'&&v.presented===false&&hash(v.termsHash)&&Number.isSafeInteger(v.quoteRevision)&&v.quoteRevision>0&&typeof v.wording==='string'&&typeof v.amount==='string'&&typeof v.plannedQuoteDate==='string'&&Object.keys(v).sort().join('|')===['engagementId','referenceId','quoteRevision','termsHash','amount','plannedQuoteDate','wording','status','presented'].sort().join('|');}
// Candidate action names, NOT an approved acceptance policy. The server must later
// obtain actor/session, grant, source, quote/version and idempotency independently.
export function createUntrustedQuoteResponseIntent({claimedConsumerId,appId,requestId,engagementId,referenceId,bindingId,bindingRevision,quoteRevision,termsHash,action,question='',idempotencyKey}={}){
 if(![claimedConsumerId,appId,requestId,engagementId,referenceId,bindingId].every(uuid)||!Number.isSafeInteger(bindingRevision)||bindingRevision<1||!Number.isSafeInteger(quoteRevision)||quoteRevision<1||!hash(termsHash)||!['accept','decline','question'].includes(action)||typeof question!=='string'||question.length>3000||action==='question'&&!question.trim()||action!=='question'&&question!==''||typeof idempotencyKey!=='string'||!/^[A-Za-z0-9_-]{8,120}$/.test(idempotencyKey))return null;
 const proposedContext=Object.freeze({claimedConsumerId,appId,requestId,engagementId,referenceId,bindingId,bindingRevision,quoteRevision,termsHash});
 return Object.freeze({schemaVersion:1,kind:'untrusted_local_response_intent',proposedContext,action,question,idempotencyKey,notAReceipt:true,authenticated:false,consumerAccessAuthorised:false,executionAuthorised:false});
}
