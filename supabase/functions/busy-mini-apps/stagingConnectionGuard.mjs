/**
 * V3.176 read-only staging probe must stay disabled on production.
 * It inspects only server-owned environment variables. Caller-supplied
 * body.projectRef/mode are intentionally never involved.
 */
function isolatedStagingGuard({mode="",projectRef="",supabaseUrl=""}={}){
 if(mode!=="isolated"||typeof projectRef!=="string"||
    !/^[a-z0-9]{16,32}$/.test(projectRef))
  return {ok:false,reason:"Isolated staging is not enabled on this server."};
 let ref="";
 try{
  const parsed=new URL(supabaseUrl);
  const host=parsed.hostname;
  if(parsed.protocol!=="https:"||parsed.username||parsed.password||
     parsed.port||!host.endsWith(".supabase.co")||
     host.split(".").length!==3)return {ok:false,
      reason:"This server is not connected to a supported staging project."};
  ref=host.split(".")[0];
 }catch{
  return {ok:false,reason:"Staging server URL is invalid."};
 }
 if(ref!==projectRef)return {ok:false,
  reason:"This project's identity does not match the isolated staging allowlist."};
 return {ok:true,isolatedOnly:true,neverTouchesProduction:true,
  acceptsCallerSuppliedEnvironment:false,
  permissionsStillRequireAuthenticatedOwner:true};
}
export {isolatedStagingGuard};
