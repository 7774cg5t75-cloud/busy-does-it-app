/**
 * Manual V3.203 staging tenant Auth verification.
 * Default invocation: offline no-op, zero network calls.
 * Real invocation requires --verify-owners-read-only plus explicitly
 * provisioned credentials in temporary env vars. Never place credentials
 * in the repository, chat, URLs or output logs.
 */
import {pathToFileURL} from "node:url";
import {runTenantReadProbe} from "../src/core/stagingTwoTenantAppProbeV3203.mjs";
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 runTenantReadProbe().then(x=>{
  const safe=x?.kind==="tenant_read_config_v3203"?
    {ok:false,reason:"Configuration cannot be displayed."}:x;
  console.log(JSON.stringify(safe,null,2));
  if(!safe.ok)process.exitCode=1;
 }).catch(()=>{
  // Do not print error objects, URL, response bodies, JWT or profile records.
  console.error("Isolated staging owner test could not complete; no customer action was attempted.");
  process.exitCode=1;
 });
}
export {runTenantReadProbe};
