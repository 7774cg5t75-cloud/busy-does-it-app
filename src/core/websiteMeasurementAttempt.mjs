const MEASUREMENT_TIMEOUT_MS=12000;
function beginWebsiteMeasurementAttempt({sourceKey,mode,variant,key,now=Date.now()}={}){
 if(typeof sourceKey!=='string'||!sourceKey||!['full','phone','tablet','desktop'].includes(mode)||
    !['original','candidate'].includes(variant)||typeof key!=='string'||
    !/^[a-zA-Z0-9._:-]{1,160}$/.test(key)||!Number.isSafeInteger(now)||now<0)return null;
 return {sourceKey,mode,variant,key,startedAt:now,expiresAt:now+MEASUREMENT_TIMEOUT_MS};
}
function currentWebsiteMeasurementAttempt(attempt,{sourceKey,mode,variant,key}={},now=Date.now()){
 return !!attempt&&attempt.sourceKey===sourceKey&&attempt.mode===mode&&attempt.variant===variant&&
  attempt.key===key&&Number.isSafeInteger(now)&&now>=attempt.startedAt&&now<attempt.expiresAt;
}
export {MEASUREMENT_TIMEOUT_MS,beginWebsiteMeasurementAttempt,currentWebsiteMeasurementAttempt};
