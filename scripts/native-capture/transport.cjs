// Screenshot-only inert transport, injected into a disposable native build.
// Original AppController/auth/state/screens are not replaced or patched.
const OWNER='11111111-1111-4111-8111-111111111111';
const BUSINESS='22222222-2222-4222-8222-222222222222';
function createFixture(){
 let row={business_id:BUSINESS,schema_version:1,revision:1,updated_at:'2026-10-23T09:41:00Z',payload:{onboardingComplete:true,businessName:'Fictional Studio · screenshot fixture',trade:'Fictional local services',verticalId:'exterior-cleaning',postcode:'EX1',radius:'10',customers:[],services:[],connectedAccounts:{},socialDrafts:[],inboxItems:[],intakeLog:[],brandProfile:{},websiteDraft:null,proactiveNotificationsEnabled:false}};
 const response=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data,text:async()=>JSON.stringify(data)});
 return async(input,options={})=>{
  const url=new URL(typeof input==='string'?input:input.url),method=(options.method||'GET').toUpperCase();
  // Never call native fetch, never forward headers, never contact this host.
  if(url.protocol!=='https:'||url.hostname!=='qgkmuiipicazmcxxmoxv.supabase.co')throw Error('Screenshot fixture blocks external networking');
  const path=url.pathname;
  if(path==='/auth/v1/token'&&method==='POST'){
   const data=JSON.parse(options.body||'{}');
   if(data.email!=='capture@example.invalid'||data.password!=='FictionalOnly123!')return response({message:'Use the fictional capture identity'},403);
   return response({access_token:'synthetic-capture-not-a-jwt',refresh_token:'',expires_in:86400,user:{id:OWNER,email:'capture@example.invalid'}});
  }
  if(path==='/rest/v1/rpc/busy_ensure_business'&&method==='POST')return response([{business_id:BUSINESS,business_name:row.payload.businessName,member_role:'owner'}]);
  if(path==='/rest/v1/busy_business_snapshots'&&url.searchParams.get('business_id')==='eq.'+BUSINESS){
   if(method==='GET')return response([row]);
   if(method==='PATCH'&&url.searchParams.get('revision')==='eq.'+row.revision){
    const value=JSON.parse(options.body||'{}');
    if(value.revision!==row.revision+1||value.schema_version!==1)return response({message:'Fictional revision conflict'},409);
    row={...row,...value,business_id:BUSINESS};return response([row]);
   }
   return response({message:'Fictional write denied'},409);
  }
  // Optional overview reads are intentionally unsupported, never fake success.
  return response({message:'Unavailable in offline screenshot fixture',code:'CAPTURE_OFFLINE'},403);
 };
}
function install(){
 global.fetch=createFixture();
 const blocked=function(){throw Error('Native capture blocks external I/O');};
 global.XMLHttpRequest=blocked;global.WebSocket=blocked;
}
module.exports={createFixture,install,OWNER,BUSINESS};
