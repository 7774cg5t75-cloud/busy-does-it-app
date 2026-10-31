// Trusted-server dependency boundary; not a deployed route or live provider adapter.
// Uses original private social records through finite service-only transactions.
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const callback=p=>'https://pnjdlogwegnqbsfpcofw.supabase.co/functions/v1/busy-social-publish/callback/'+p;
const validProvider=p=>['meta','google_business'].includes(p);
const digest=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),x=>x.toString(16).padStart(2,'0')).join('');
const metadata=v=>v&&UUID.test(v.id)&&Number.isSafeInteger(v.revision)&&v.revision>0&&typeof v.subject==='string'&&v.subject.length>0;
export function createOfflineProviderConnections(deps){
 if(deps.simulation!==true)throw Error('Only offline provider simulation is implemented');
 async function actor(b,p){const user=await deps.authenticate();if(!UUID.test(user?.id)||!UUID.test(b)||!validProvider(p))throw Error('Verified owner scope required');return user.id;}
 return {
  async begin(b,p,revision){
   const a=await actor(b,p);if(!Number.isSafeInteger(revision)||revision<0)throw Error('Current connection revision required');
   const bytes=crypto.getRandomValues(new Uint8Array(32));const state=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
   await deps.rpc('busy_provider_begin_v1',[a,b,p,await digest(state),revision,callback(p)]);
   return {state,callback:callback(p),simulation:true,providerContacted:false};
  },
  async callback(b,p,state,code,redirect){
   const a=await actor(b,p);if(typeof state!=='string'||!/^[0-9a-f]{64}$/.test(state)||typeof code!=='string'||code.length<1||code.length>2048||redirect!==callback(p))throw Error('Callback does not match the reviewed connection');
   const h=await digest(state),nonce=crypto.randomUUID();
   // Claim acknowledgement loss MUST NOT trigger a token exchange. SQL has
   // already consumed the state; inspect the existing operation instead.
   try{await deps.rpc('busy_provider_claim_v1',[a,b,p,h,redirect,nonce]);}catch{return {state:'unconfirmed',simulation:true,mayRetryExchange:false};}
   try{
    const value=await deps.exchangeOffline({provider:p,code,redirect});
    if(!value||value.simulation!==true||typeof value.subject!=='string'||value.subject.length<1||value.subject.length>200||typeof value.accessToken!=='string'||value.accessToken.length<1||value.accessToken.length>16384||(value.refreshToken!=null&&(typeof value.refreshToken!=='string'||value.refreshToken.length<1||value.refreshToken.length>16384))||!Number.isFinite(Date.parse(value.expiresAt)))throw Error('Invalid offline provider result');
    const proof=await digest(JSON.stringify([value.subject,value.accessToken,value.refreshToken??null,value.expiresAt]));
    await deps.rpc('busy_provider_complete_v1',[a,b,p,h,nonce,value.subject,value.accessToken,value.refreshToken??null,value.expiresAt,proof]);
    const checked=await deps.rpc('busy_provider_status_v1',[a,b,p,h]);
    if(checked.state!=='committed'||checked.current!==true||!metadata(checked)||checked.subject!==value.subject)throw Error('Connection readback is unconfirmed');
    return {state:'private_connection_prepared',id:checked.id,revision:checked.revision,subject:checked.subject,simulation:true,liveConnected:false,mayRetryExchange:false};
   }catch{return {state:'unconfirmed',simulation:true,mayRetryExchange:false};}
  },
  async inspect(b,p,state){const a=await actor(b,p);if(typeof state!=='string'||!/^[0-9a-f]{64}$/.test(state))throw Error('Exact state required');const v=await deps.rpc('busy_provider_status_v1',[a,b,p,await digest(state)]);return {state:v.state,id:v.id,revision:v.revision,subject:v.subject,current:v.current===true,simulation:true,mayRetryExchange:false};},
  async disconnect(b,p,connection){const a=await actor(b,p);if(!metadata(connection))throw Error('Exact current connection required');try{const r=await deps.rpc('busy_provider_disconnect_v1',[a,b,p,connection.id,connection.revision,connection.subject]);const v=await deps.rpc('busy_provider_status_v1',[a,b,p,null]);if(v.state!=='disconnected'||v.id!==connection.id||v.revision!==r.revision)throw Error('Unconfirmed');return {state:'disconnected_locally',revision:v.revision,simulation:true,providerRevoked:false};}catch{return {state:'unconfirmed',simulation:true,providerRevoked:false};}}
 };
}
