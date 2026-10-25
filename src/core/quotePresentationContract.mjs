// Finite formatting/intent validation only. No authentication or disclosure authority.
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const hash=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
export function isQuotePresentationProjection(v,id,referenceId){return !!v&&v.engagementId===id&&v.referenceId===referenceId&&v.status==='Prepared'&&v.presented===false&&hash(v.termsHash)&&Number.isSafeInteger(v.quoteRevision)&&v.quoteRevision>0&&typeof v.wording==='string'&&typeof v.amount==='string'&&typeof v.plannedQuoteDate==='string'&&Object.keys(v).sort().join('|')===['engagementId','referenceId','quoteRevision','termsHash','amount','plannedQuoteDate','wording','status','presented'].sort().join('|');}
// Candidate action names, NOT an approved acceptance policy. The server must later
// obtain actor/session, grant, source, quote/version and idempotency independently.
export function createUntrustedQuoteResponseIntent({claimedConsumerId,appId,requestId,engagementId,referenceId,bindingId,bindingRevision,quoteRevision,termsHash,action,question='',idempotencyKey,grantId=null,grantRevision=null,generation=null}={}){
 if(![claimedConsumerId,appId,requestId,engagementId,referenceId,bindingId].every(uuid)||!Number.isSafeInteger(bindingRevision)||bindingRevision<1||!Number.isSafeInteger(quoteRevision)||quoteRevision<1||!hash(termsHash)||!['accept','decline','question'].includes(action)||typeof question!=='string'||question.length>3000||action==='question'&&!question.trim()||action!=='question'&&question!==''||typeof idempotencyKey!=='string'||!/^[A-Za-z0-9_-]{8,120}$/.test(idempotencyKey))return null;
 if(grantId!==null||grantRevision!==null||generation!==null){if(!uuid(grantId)||grantRevision!==1||!Number.isSafeInteger(generation)||generation<1)return null;}
 try{if(encodeURIComponent(question).replace(/%[A-F0-9]{2}/g,'x').length>10000)return null;}catch{return null;}
 const proposedContext=Object.freeze({claimedConsumerId,appId,requestId,engagementId,referenceId,bindingId,bindingRevision,quoteRevision,termsHash});
 return Object.freeze({schemaVersion:1,kind:'untrusted_local_response_intent',proposedContext,proposedGrant:grantId===null?null:Object.freeze({grantId,grantRevision,generation}),action,question,idempotencyKey,notAReceipt:true,authenticated:false,consumerAccessAuthorised:false,executionAuthorised:false});
}

export function isQuoteGrantProjection(v,referenceId){return !!v&&v.quoteReference===referenceId&&Number.isSafeInteger(v.quoteRevision)&&v.quoteRevision>0&&hash(v.termsHash)&&typeof v.businessAppSlug==='string'&&typeof v.businessDisplayName==='string'&&typeof v.amount==='string'&&typeof v.wording==='string'&&v.status==='Prepared'&&v.appointmentConfirmed===false&&Object.keys(v).sort().join('|')===['quoteReference','quoteRevision','termsHash','businessAppSlug','businessDisplayName','amount','wording','status','appointmentConfirmed'].sort().join('|');}
