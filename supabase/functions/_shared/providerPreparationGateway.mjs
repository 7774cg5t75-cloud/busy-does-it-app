import {createOfflineProviderConnections} from './offlineProviderConnections.mjs';
const ROOT='https://pnjdlogwegnqbsfpcofw.supabase.co';
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(x);
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join('|')===[...keys].sort().join('|');
const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}});
// Original Edge transport supplies all dependencies. No provider URL, key or
// exchange/complete/claim writer can be selected through this boundary.
export function createProviderPreparationGateway(deps){return async request=>{
 if(deps.enabled!=='reviewed-metadata-only'||deps.projectUrl!==ROOT)return reply(503,{error:'Provider preparation is not activated.'});
 if(request.method!=='POST')return reply(405,{error:'Use a private preparation request.'});
 let owner;
 try{
  const token=request.headers.get('authorization')||'';if(!/^Bearer [^\s]{20,4096}$/.test(token))return reply(401,{error:'Sign in again before checking connections.'});
  owner=await deps.authenticate(token.slice(7));if(!uuid(owner?.id)||owner.isAnonymous)return reply(401,{error:'Your identity could not be verified.'});
  const body=await deps.readJson(request,4096);
  if(!body||!uuid(body.businessId))return reply(400,{error:'Choose your current business.'});
  const scope=body.businessId;
  const allowed=new Set(['busy_provider_status_v1','busy_provider_begin_v1']);
  const rpc=async(name,args)=>{if(!allowed.has(name))throw Error('Unsupported provider preparation');return deps.rpc(name,args);};
  if(body.action==='status'&&exact(body,['action','businessId'])){
   const entries=await Promise.all(['meta','google_business'].map(async p=>{
    const value=await rpc('busy_provider_status_v1',[owner.id,scope,p,null]);
    if(!value||!Number.isSafeInteger(value.revision)||value.revision<0||!['not_connected','connected','disconnected'].includes(value.state))throw Error('Invalid metadata');
    return [p,{provider:p,status:value.state==='not_connected'?'not_connected':'preparation_only',recordState:value.state,revision:value.revision,liveActionsEnabled:false}];
   }));
   return reply(200,{owner:{authenticated:true,userId:owner.id,businessId:scope,role:'owner'},connections:Object.fromEntries(entries),credentials:{livePublishingEnabled:false},queueAvailable:false,preparationOnly:true});
  }
  if(body.action==='prepare'&&exact(body,['action','businessId','provider','expectedRevision','ownerReviewed'])&&body.ownerReviewed===true&&['meta','google_business'].includes(body.provider)){
   const current=await rpc('busy_provider_status_v1',[owner.id,scope,body.provider,null]);
   if(current.revision!==body.expectedRevision)return reply(409,{error:'Your connection changed. Review its current version.'});
   const session=createOfflineProviderConnections({simulation:true,authenticate:async()=>owner,rpc,exchangeOffline:async()=>{throw Error('No exchange adapter');}});
   const intent=await session.begin(scope,body.provider,body.expectedRevision);
   return reply(200,{owner:{userId:owner.id,businessId:scope},intent,expectedRevision:body.expectedRevision,pkcePersistenceAvailable:false,providerExchangeEnabled:false,requiresFurtherReview:true});
  }
  if(body.action==='inspect'&&exact(body,['action','businessId','provider','state'])&&['meta','google_business'].includes(body.provider)&&typeof body.state==='string'&&/^[0-9a-f]{64}$/.test(body.state)){
   const session=createOfflineProviderConnections({simulation:true,authenticate:async()=>owner,rpc,exchangeOffline:async()=>{throw Error('No exchange adapter');}});
   const record=await session.inspect(scope,body.provider,body.state);
   return reply(200,{owner:{userId:owner.id,businessId:scope},record,providerExchangeEnabled:false});
  }
  return reply(400,{error:'That provider action is not available.'});
 }catch(error){if(error&&[400,408,413].includes(error.status))return reply(error.status,{error:'This preparation request could not be read safely.'});return reply(owner?409:401,{error:'Your access or connection changed, or preparation is unavailable. No provider was contacted.'});}
};}
