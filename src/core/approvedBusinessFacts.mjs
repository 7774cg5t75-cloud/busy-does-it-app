// Finite read-only allowlist over the original approved profile, never action authority.
function approvedText(profile,businessId,key,max){
 const value=profile?.[key];
 return businessId&&typeof profile?.fingerprint==='string'&&profile.fingerprint&&(!profile.businessId||profile.businessId===businessId)&&typeof value==='string'&&value.length<=max&&!/[<>\u0000-\u001f\u007f]/.test(value)?value.trim():'';
}
export const approvedBusinessArea=(profile,businessId)=>approvedText(profile,businessId,'serviceArea',240);
export function approvedBusinessEmail(profile,businessId){
 const value=approvedText(profile,businessId,'email',240);
 return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(value)?value:'';
}
