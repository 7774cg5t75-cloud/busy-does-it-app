// Preserve the original nested-control target/review boundary. This is not
// server authorisation; original SQL membership, draft equality and CAS remain.
export function privateWebsiteDesignScope(draft,businessId,options={}){
 if(!draft||draft.businessId!==businessId||!options||typeof options!=='object'||Array.isArray(options)||Object.keys(options).some(k=>!['expectedWebsiteId','expectedGeneration','expectedBusinessId'].includes(k)))return false;
 if(Object.keys(options).length===0)return true;
 return options.expectedWebsiteId===draft.id&&Number.isSafeInteger(options.expectedGeneration)&&options.expectedGeneration===draft.generation&&options.expectedBusinessId===businessId;
}
