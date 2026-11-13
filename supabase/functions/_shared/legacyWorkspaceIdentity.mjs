// Scope-neutral helper only: caller must first obtain the user through server
// getUser. Email, editable metadata and publishable keys never grant ownership.
// A legacy single-workspace provider is not a multi-tenant business authority.
export function matchesConfiguredPrototypeOwner(verifiedUser,configuredOwnerId){
 const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(x);
 return uuid(verifiedUser?.id)&&uuid(configuredOwnerId)&&verifiedUser.id.toLowerCase()===configuredOwnerId.toLowerCase();
}
// The callback must verify the provider MAC before using this subject check.
export function matchesConfiguredProviderSubject(payload,configuredSubject){
 return typeof configuredSubject==='string'&&/^[0-9]{3,100}$/.test(configuredSubject)&&payload?.algorithm==='HMAC-SHA256'&&String(payload.user_id||'')===configuredSubject;
}
export function providerEventAppliesToConnection(payload,configuredSubject,connection,now=Date.now()){
 const issued=payload?.issued_at;
 return matchesConfiguredProviderSubject(payload,configuredSubject)&&connection?.provider_subject_id===configuredSubject&&Number.isSafeInteger(issued)&&issued>0&&issued*1000<=now+300000&&Number.isFinite(Date.parse(connection?.connected_at))&&Date.parse(connection.connected_at)<=issued*1000&&typeof connection?.id==='string'&&Number.isFinite(Date.parse(connection?.updated_at));
}
