/**
 * V3.131: deliberately narrow real staging Supabase Auth and RLS client.
 * For a separately signed internal staging build ONLY.
 *
 * Private passwords and access/refresh tokens never leave this closure except
 * in the exact expected HTTPS Supabase Auth/REST requests. This service does
 * NOT persist sessions or output any token, email or user ID in its results.
 * It does NOT sign up customers, write business rows or call production.
 */
import {busyRuntimeCloudConfig} from "../core/stagingRuntimeIsolation.mjs";

const STAGING="pnjdlogwegnqbsfpcofw";
const LIVE="qgkmuiipicazmcxxmoxv";
const OTHER_PROTECTED="rtqqnqbrqpjondvcyann";
const FIXTURES={
  a:{email:"bdi-stage-owner-a@example.invalid",
     row:"20f9279e-0dcf-4b1b-aad0-4952c4aab332",name:"Hillside Gardens"},
  b:{email:"bdi-stage-owner-b@example.invalid",
     row:"0aa3150d-8e85-4ca3-bda2-f8f3dd6c9bcf",name:"Fire & Table Catering"}
};
const CONFIG=busyRuntimeCloudConfig({
  environment:"isolated-staging",
  productionSupabaseUrl:"https://"+LIVE+".supabase.co",
  otherProtectedSupabaseRef:OTHER_PROTECTED,
  expectedStagingSupabaseRef:STAGING,
  stagingSupabaseUrl:"https://"+STAGING+".supabase.co",
  stagingPublishableKey:"" // Clients must explicitly provide the build's key.
});
function validateStagingAuthConfig(p={}){
  const resolved=busyRuntimeCloudConfig({
    environment:p.environment,
    productionSupabaseUrl:"https://"+LIVE+".supabase.co",
    otherProtectedSupabaseRef:OTHER_PROTECTED,
    expectedStagingSupabaseRef:STAGING,
    stagingSupabaseUrl:p.baseUrl,
    stagingPublishableKey:p.publishableKey
  });
  return resolved.environment==="isolated-staging"&&resolved.configured&&
    p.environment==="isolated-staging"&&
    p.baseUrl==="https://"+STAGING+".supabase.co";
}
function accountKey(email=""){
  const normalized=String(email||"").trim().toLowerCase();
  return Object.keys(FIXTURES).find(key=>FIXTURES[key].email===normalized)||null;
}
function createStagingAuthInspector({config={},fetchImpl=fetch}={}){
  const enabled=validateStagingAuthConfig(config);
  let token="";
  let verifiedKey=null;
  let verifiedUser="";
  let generation=0;
  const clear=()=>{
    generation++;
    const old=token;
    token="";verifiedKey=null;verifiedUser="";
    return old;
  };
  function assertConfigured(){
    if(!enabled)throw new Error("staging-not-configured");
  }
  async function call(path,{method="GET",bearer="",body=null}={}){
    const headers={
      apikey:config.publishableKey,
      Accept:"application/json",
      ...(body!==null?{"Content-Type":"application/json"}:{}),
      ...(bearer?{Authorization:"Bearer "+bearer}:{})
    };
    let response;
    try{
      response=await fetchImpl(config.baseUrl+path,{
        method,headers,redirect:"error",cache:"no-store",
        ...(body!==null?{body:JSON.stringify(body)}:{})
      });
    }catch{throw new Error("staging-network-unavailable");}
    if(!response||!Number.isInteger(response.status))
      throw new Error("staging-network-unavailable");
    let json=null;
    try{json=await response.json();}catch{}
    return {status:response.status,json};
  }
  async function checkIdentity(accessToken,email){
    const user=await call("/auth/v1/user",{bearer:accessToken});
    const id=user.json?.id;
    if(user.status!==200||
       !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id||"")||
       typeof user.json?.email!=="string"||
       user.json.email.toLowerCase()!==email)
      throw new Error("staging-identity-unverified");
    return id;
  }
  async function checkIsolation(accessToken,userId,key){
    const own=FIXTURES[key],foreign=FIXTURES[key==="a"?"b":"a"];
    const query=row=>"/rest/v1/busy_staging_rls_canary?select=id,owner_id,marker&id=eq."+row;
    const ownResponse=await call(query(own.row),{bearer:accessToken});
    const ownRows=ownResponse.json;
    if(ownResponse.status!==200||!Array.isArray(ownRows)||
       ownRows.length!==1||ownRows[0]?.id!==own.row||
       ownRows[0]?.owner_id!==userId||
       typeof ownRows[0]?.marker!=="string")
      throw new Error("staging-own-row-failed");
    const foreignResponse=await call(query(foreign.row),{bearer:accessToken});
    if(foreignResponse.status!==200||!Array.isArray(foreignResponse.json)||
       foreignResponse.json.length!==0)
      throw new Error("staging-cross-owner-denial-failed");
    const anonResponse=await call(query(own.row));
    if(!([401,403].includes(anonResponse.status)||
      (anonResponse.status===200&&Array.isArray(anonResponse.json)&&
       anonResponse.json.length===0)))
      throw new Error("staging-anonymous-denial-failed");
    return {ownRowVisible:true,foreignRowHidden:true,anonymousDenied:true,
      business:own.name};
  }
  return {
    get configured(){return enabled;},
    get signedIn(){return !!token&&!!verifiedKey;},
    async signIn(email,password){
      assertConfigured();
      // Clear previous account, including on failed attempts.
      const requestGeneration=generation+1;
      clear();
      const key=accountKey(email);
      if(!key||typeof password!=="string"||password.length<1)
        throw new Error("staging-test-account-required");
      const login=await call("/auth/v1/token?grant_type=password",{
        method:"POST",body:{email:FIXTURES[key].email,password}
      });
      if(login.status!==200||typeof login.json?.access_token!=="string"||
         login.json.access_token.length<30){
        throw new Error("staging-sign-in-failed");
      }
      // Keep access token private in memory only. Refresh token is discarded.
      const accessToken=login.json.access_token;
      try{
        const id=await checkIdentity(accessToken,FIXTURES[key].email);
        const result=await checkIsolation(accessToken,id,key);
        if(generation!==requestGeneration)
          throw new Error("staging-session-cancelled");
        token=accessToken;
        verifiedKey=key;
        verifiedUser=id;
        return {status:"genuine-staging-auth-and-rls-verified",
          account:key==="a"?"Owner A":"Owner B",
          ...result,storedOnDevice:false,hostedPreviewVerified:false};
      }catch(error){
        clear();
        throw error;
      }
    },
    async recheck(){
      assertConfigured();
      if(!token||!verifiedKey)throw new Error("staging-no-session");
      const activeGeneration=generation,auth=token,key=verifiedKey;
      try{
        const id=await checkIdentity(auth,FIXTURES[key].email);
        if(id!==verifiedUser)throw new Error("staging-account-changed");
        const result=await checkIsolation(auth,id,key);
        if(activeGeneration!==generation)throw new Error("staging-session-cancelled");
        return {status:"genuine-staging-auth-and-rls-verified",
          account:key==="a"?"Owner A":"Owner B",
          ...result,storedOnDevice:false,hostedPreviewVerified:false};
      }catch(error){clear();throw error;}
    },
    async signOut(){
      // Local access always ends immediately even if Supabase logout fails.
      const old=clear();
      if(!enabled||!old)return {localSessionCleared:true,remoteLogoutVerified:false};
      let remote=false;
      try{
        const response=await call("/auth/v1/logout",{method:"POST",bearer:old});
        remote=response.status===200||response.status===204;
      }catch{}
      return {localSessionCleared:true,remoteLogoutVerified:remote,
        accessJwtMayRemainValidUntilExpiry:true};
    },
    clearLocal(){clear();return {localSessionCleared:true};}
  };
}
export {FIXTURES,validateStagingAuthConfig,createStagingAuthInspector,accountKey};
