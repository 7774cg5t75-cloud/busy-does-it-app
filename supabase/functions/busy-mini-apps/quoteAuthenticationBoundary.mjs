// Existing getUser authentication proves account identity, not recent reauthentication.
// No route, quote lookup, session mint, activation, response or service-role RPC here.
export function quotationAccountReadiness({verifiedUserId,request}={}){
 const exact=typeof verifiedUserId==='string'&&!!verifiedUserId&&request?.consumer_user_id===verifiedUserId&&request?.request_origin!=='guest_web';
 return Object.freeze({available:false,status:'release_disabled',accountIdentity:exact?'verified_by_original_service':'unavailable',recentAuthentication:'not_established',viewingSession:'not_established',presentationEntitlement:'not_established',consumerAccessAuthorised:false,responseAuthorised:false,bindingAcceptanceAuthorised:false});
}
