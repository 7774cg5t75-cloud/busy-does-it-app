/**
 * V3.68 — bounded recovery of READ-ONLY health reporting.
 * Read actions only; POST is the providers' existing status API transport.
 * No retries of publish/schedule/delete/rollback/create/edit actions.
 */
import {checkScope} from "./growthProjectCloud.mjs";
import {readOne,PROVIDERS} from "./verifiedBusinessActivityCloud.mjs";
const isTransientReadError=e=>{
  const status=Number(e?.status||0);
  return status===408 || status===502 ||
    status===503 || status===504 || (status===0 && /network|fetch failed|timeout|timed out/i.test(String(e?.message||"")));
};
async function readOnlyStatusWithRecovery(args,source,{pause=ms=>new Promise(resolve=>setTimeout(resolve,ms)),onAttempt}={}){
  checkScope(args);
  if(!Object.prototype.hasOwnProperty.call(PROVIDERS,source))
    throw Error("Only known reporting status sources can be queried.");
  let attempts=0;
  while(attempts<2){
    attempts+=1;
    try{
      const data=await readOne(args,source);
      if(onAttempt)onAttempt({source,attempts,success:true});
      return {ok:true,data,attempts,recoveredRead:attempts===2};
    }catch(error){
      if(onAttempt)onAttempt({source,attempts,success:false});
      const retry=attempts===1 && isTransientReadError(error);
      if(!retry)return {ok:false,attempts,error:"Status could not be verified ("+(Number(error?.status)||"network")+").",recoveredRead:false};
      // Bounded wait to prevent hammering services and causing needless bills.
      await pause(250);
    }
  }
  return {ok:false,attempts:2,error:"Status remains unavailable.",recoveredRead:false};
}
async function checkAllReadOnlySources(args,options={}){
  checkScope(args);
  const results={};
  await Promise.all(Object.keys(PROVIDERS).map(async source=>{
    results[source]=await readOnlyStatusWithRecovery(args,source,options);
  }));
  return results;
}
export {isTransientReadError,readOnlyStatusWithRecovery,checkAllReadOnlySources};
