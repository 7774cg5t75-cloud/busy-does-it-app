import {stableJson} from './stableJson.mjs';
// Private review ledger only. Never consumed by public rendering or publication.
export const DESIGN_ACCEPTANCE_STAGES=Object.freeze(['source-and-technical-integrity','genuine-full-page-visual-review','diagnose-improve-and-rerender','owner-acceptance-and-exact-continuation']);
export const DESIGN_REVIEW_VERSION='busy.design-acceptance.v1';
export const DESIGN_CRITERIA=['business-fit','originality','art-direction','composition','customer-journey','accessibility-performance'];
const sha=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v),git=v=>typeof v==='string'&&/^[a-f0-9]{40}$/.test(v),text=v=>typeof v==='string'&&v.trim().length>0&&v.length<=1200&&!/[<>\u0000-\u001f]/.test(v);
const deny=reason=>({ok:false,reason,publicationAuthorised:false});
export function validateDesignEvidence(e){
 if(!e||new TextEncoder().encode(stableJson(e)).length>65536||e.version!==DESIGN_REVIEW_VERSION||!text(e.id)||!git(e.commit)||!git(e.tree)||!sha(e.sourceDigest)||!sha(e.assetManifestDigest)||!text(e.renderer)||!text(e.browser)||!['fictional-licensed','authorised-private'].includes(e.classification))return deny('Exact source, asset provenance and renderer evidence are required.');
 if(!e.scope||!['ownerId','businessId','projectId'].every(k=>text(e.scope[k]))||!['sourceRevision','profileRevision'].every(k=>Number.isSafeInteger(e.scope[k])&&e.scope[k]>0))return deny('Exact original owner, business, project and source revisions are required.');
 if(!Array.isArray(e.captures)||e.captures.length>12||[320,390,1440].some(w=>!e.captures.some(c=>c.width===w&&c.fullPage===true&&sha(c.sha256)&&Number.isSafeInteger(c.dpr)&&c.dpr>=1&&c.dpr<=3)))return deny('Genuine full-page mobile and desktop captures are required.');
 if(!e.technical||Object.keys(e.technical).sort().join(',')!=='content,privacy,responsive,safeActions,sourceCurrent'||Object.values(e.technical).some(v=>v!==true))return deny('Source, technical, factual, privacy and action checks must pass independently.');
 if(!e.permission||e.permission.internalReview!==true||!sha(e.permission.revisionDigest)||!Number.isSafeInteger(e.permission.expiresAt)||e.permission.withdrawn!==false)return deny('Current purpose-specific internal review permission is required.');
 return {ok:true,publicationAuthorised:false};
}
export function createDesignCandidate(e,now){
 const v=validateDesignEvidence(e);if(!v.ok)return v;if(!Number.isSafeInteger(now)||e.permission.expiresAt<=now)return deny('Reference permission has expired.');
 return {ok:true,record:{version:DESIGN_REVIEW_VERSION,id:e.id,revision:1,state:'candidate',evidence:structuredClone(e),review:null,ownerAcceptance:null,history:[],permittedUse:'internal-principles-only'},publicationAuthorised:false};
}
// Authenticated private-process callbacks must verify the reviewer and owner receipt.
// A caller-supplied boolean, name or email is never an approval authority.
export async function reviewDesignCandidate(record,command,{now,currentEvidence,verifyReviewer,verifyOwnerAcceptance,integrity}={}){
 if(!record||record.version!==DESIGN_REVIEW_VERSION||!command||command.expectedRevision!==record.revision||!text(command.operationId)||record.history?.some(h=>h.operationId===command.operationId)||record.history?.length>=256)return deny('Stale, duplicate or exhausted review. Reopen the exact private reference.');
 if(!Number.isSafeInteger(now)||!currentEvidence||currentEvidence.id!==record.id)return deny('Reopen the current source and permission.');
 const action=command.action;
 if(!['begin-review','needs-improvement','block','approve','retire','withdraw'].includes(action)||!text(command.reason)||typeof verifyReviewer!=='function')return deny('An explicit supported review decision is required.');
 const reviewer=await verifyReviewer(command.reviewerReceipt,{id:record.id,revision:record.revision,action,scope:record.evidence.scope});if(reviewer?.authenticated!==true||!text(reviewer.id))return deny('Current authorised private reviewer required.');
 const next=structuredClone(record),stale=stableJson(record.evidence)!==stableJson(currentEvidence),valid=validateDesignEvidence(currentEvidence),expired=currentEvidence.permission?.expiresAt<=now;
 if(!['withdraw','retire','block'].includes(action)&&(stale||!valid.ok||expired))return deny('Source or permission changed. Retire or withdraw this evidence and create a fresh candidate.');
 if(['retired','withdrawn'].includes(record.state))return deny('Historical references cannot be reactivated. Create a separately reviewed candidate.');
 if(action==='begin-review'){if(record.state!=='candidate'&&record.state!=='needs-improvement')return deny('Open a candidate for review first.');next.state='in-review';}
 else if(action==='approve'){
  const r=command.professionalReview;if(record.state!=='in-review'||!r||r.exceptional!==true||!text(r.rationale)||!Array.isArray(r.criteria)||r.criteria.length!==6||DESIGN_CRITERIA.some(k=>r.criteria.filter(c=>c.criterion===k&&c.passed===true&&text(c.evidence)).length!==1))return deny('Positive complete-page professional review is required; no numerical score grants approval.');
  if(typeof verifyOwnerAcceptance!=='function'||typeof integrity?.sha256!=='function')return deny('Explicit founder acceptance of this exact evidence is missing.');
  const evidenceDigest=await integrity.sha256(stableJson({evidence:currentEvidence,review:r}));if(!sha(evidenceDigest)||command.evidenceDigest!==evidenceDigest)return deny('Acceptance must bind the exact evidence and professional review.');
  const owner=await verifyOwnerAcceptance(command.ownerReceipt,{id:record.id,revision:record.revision,scope:record.evidence.scope,evidence:structuredClone(currentEvidence),review:structuredClone(r)});
  if(owner?.authenticated!==true||owner?.founder!==true||!text(owner.id)||owner.evidenceDigest!==evidenceDigest||!sha(command.evidenceDigest))return deny('Verified exact-evidence founder receipt required.');
  next.state='approved';next.review=structuredClone(r);next.ownerAcceptance={reviewerId:owner.id,evidenceDigest:owner.evidenceDigest,at:now};
 }else next.state=({'needs-improvement':'needs-improvement',block:'blocked',retire:'retired',withdraw:'withdrawn'})[action];
 next.revision++;next.history.push({operationId:command.operationId,from:record.state,to:next.state,reviewerId:reviewer.id,at:now,reason:command.reason,evidenceSource:record.evidence.sourceDigest});
 return {ok:true,record:next,publicationAuthorised:false,releaseReady:false};
}
export function designReferenceAvailability(record,currentEvidence,now){
 const valid=validateDesignEvidence(currentEvidence);return {usableForInternalPrinciples:record?.state==='approved'&&valid.ok&&currentEvidence.permission.expiresAt>now&&stableJson(record.evidence)===stableJson(currentEvidence),requiresFreshReview:!!record&&stableJson(record.evidence)!==stableJson(currentEvidence),publicReuse:false,cloneable:false,releaseReady:false};
}
