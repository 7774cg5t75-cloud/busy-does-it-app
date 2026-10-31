// Server-owned, ephemeral least-privilege capability. NOT a JWT, API key or
// client-supplied mode flag. No HTTP route/remote AI integration is enabled.
// Trusted adapters must re-read current authentication/role and exact project;
// neither adapter nor a mutation/provider executor can come from a request.
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const same=(a,b)=>a&&b&&['ownerId','businessId','kind','projectId','revision','sourceHash'].every(k=>a[k]===b[k]);
const valid=s=>s&&s.authorised===true&&uuid.test(s.ownerId)&&uuid.test(s.businessId)&&(s.kind==='app'?uuid.test(s.projectId):typeof s.projectId==='string'&&/^[a-zA-Z0-9_-]{1,160}$/.test(s.projectId))&&['app','website'].includes(s.kind)&&Number.isSafeInteger(s.revision)&&s.revision>0&&/^[a-f0-9]{64}$/.test(s.sourceHash);
function createBuilderExploreCapabilityBoundary({readCurrentScope,readApprovedSummary,now=Date.now}={}){
 if(typeof readCurrentScope!=='function'||typeof readApprovedSummary!=='function'||typeof now!=='function')throw new TypeError('Trusted read adapters are required.');
 const sessions=new WeakMap();
 const denied=(code)=>({ok:false,code,audit:{decision:'denied',mode:'explore',code}});
 return Object.freeze({
  async open(authContext){
   const scope=await readCurrentScope(authContext);
   if(!valid(scope))return denied('EXPLORE_SCOPE_DENIED');
   const time=now();if(!Number.isFinite(time))return denied('EXPLORE_CLOCK');
   const handle=Object.freeze(Object.create(null));sessions.set(handle,{scope:{...scope},created:time,expires:time+300000,authContext,calls:0,closed:false});
   return {ok:true,handle,expiresAt:time+300000};
  },
  close(handle){const session=sessions.get(handle);if(session)session.closed=true;},
  async inspect(handle,request){
   const session=sessions.get(handle),time=now();
   if(!session||session.closed||!Number.isFinite(time)||time<session.created||time>=session.expires||session.calls>=32)return denied('EXPLORE_SESSION_INVALID');
   if(!request||Object.keys(request).length!==1||request.action!=='inspect_project')return denied('EXPLORE_READ_ONLY');
   session.calls++;
   const current=await readCurrentScope(session.authContext);
   if(!valid(current)||!same(session.scope,current)){session.closed=true;return denied('EXPLORE_SCOPE_CHANGED');}
   const summary=await readApprovedSummary(current);
   // Recheck AFTER awaited IO: logout/revocation, concurrent close, expiry or
   // source change while reading cannot disclose the previous scope's output.
   const fresh=await readCurrentScope(session.authContext),finished=now();
   if(!Number.isFinite(finished)||session.closed||!valid(fresh)||!same(current,fresh)||finished>=session.expires||finished<session.created){session.closed=true;return denied('EXPLORE_SCOPE_CHANGED');}
   // Closed output projection; no source blobs, customer records, secrets,
   // arbitrary URLs, instructions, provider tools or write credentials escape.
   const text=x=>typeof x==='string'?x.replace(/[\u0000-\u001f<>]/g,' ').trim().slice(0,160):'';
   if(!summary||summary.projectId!==current.projectId||summary.businessId!==current.businessId||summary.revision!==current.revision||summary.sourceHash!==current.sourceHash)return denied('EXPLORE_SOURCE_CHANGED');
   return {ok:true,context:{kind:current.kind,projectId:current.projectId,revision:current.revision,title:text(summary.title),sectionNames:Array.isArray(summary.sectionNames)?summary.sectionNames.slice(0,20).map(text):[]},permissions:Object.freeze(['inspect_project']),noProviderCalls:true};
  }
 });
}
export {createBuilderExploreCapabilityBoundary};
