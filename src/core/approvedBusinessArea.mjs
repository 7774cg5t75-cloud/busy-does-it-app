// Read one existing owner-editable profile fact. Not a booking/coverage decision.
export function approvedBusinessArea(profile,businessId){
 const value=profile?.serviceArea;
 return businessId&&typeof profile?.fingerprint==='string'&&profile.fingerprint&&(!profile.businessId||profile.businessId===businessId)&&typeof value==='string'&&value.length<=240&&!/[<>\u0000-\u001f\u007f]/.test(value)?value.trim():'';
}
