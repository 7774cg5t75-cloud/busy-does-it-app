// Validate the ORIGINAL finite builder_read projection, which has no receipt
// marker. Call only through authenticated readers; shape is not authorisation.
const hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
export function connectedBuilderObservation(value,{ownerId,businessId},kind){
 if(!ownerId||!businessId||value?.actorId!==ownerId||value.businessId!==businessId||!Number.isSafeInteger(value.revision)||value.revision<1||value.operationId||value.ownOperationReceipt===true)return false;
 if(kind==='profile')return Number.isSafeInteger(value.profileRevision)&&value.profileRevision>0&&hash(value.profileHash)&&typeof value.profile?.businessName==='string'&&!!value.profile.businessName.trim();
 if(kind==='website')return hash(value.websiteDraftHash)&&typeof value.websiteDraft?.id==='string'&&Number.isSafeInteger(value.websiteDraft.generation)&&value.websiteDraft.generation>0&&[value.websiteDraft.businessId,value.websiteDraft.business_id].some(x=>x===businessId)&&[value.websiteDraft.businessId,value.websiteDraft.business_id].every(x=>x===undefined||x===businessId);
 return false;
}
