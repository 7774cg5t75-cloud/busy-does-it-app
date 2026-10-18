// Explore currently runs locally with no remote capability. Any mode-tagged
// remote request is rejected, before provider/queue/database mutations.
// Existing owner credentials outside this mode retain their original scope;
// this does not mint or claim a new server-side restricted OAuth session.
function builderExploreRemoteGuard(body){
 if(body&&Object.hasOwn(body,'interactionMode')&&body.interactionMode!=='edit')return {allowed:false,code:'EXPLORE_READ_ONLY',audit:{decision:'denied',mode:'explore',action:typeof body.action==='string'&&/^[a-z_]{1,80}$/.test(body.action)?body.action:'invalid'}};
 return {allowed:true};
}
export {builderExploreRemoteGuard};
