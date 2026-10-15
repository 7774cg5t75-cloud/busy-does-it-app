// Original hosted operations, guarded by the existing Website async gate.
// This adapter does not run providers, create a retry queue or grant approval.
function createWebsiteLiveActions({websitePublishingView,websiteBeginTask,websiteTaskAwait,websiteTaskCurrent,websiteTaskSourceCurrent,websiteAsyncGateRef,websitePublishingRequest,refreshWebsitePublishingStatus,followWebsiteGoLive,rollbackWebsite,Alert,setWebsitePublishingAction,setWebsitePublishingError,setWebsitePublishingNotice}){
 function confirmRollbackWebsite(deploymentId){
  const task=websiteBeginTask('hosting',{liveBound:true});if(!task)return false;
  try{
   const deployment=websitePublishingView?.deployments?.find(x=>x.id===deploymentId);
   if(!deployment||deployment.business_id&&deployment.business_id!==task.context.businessId)return false;
   let consumed=false;
   Alert.alert('Restore this previous website?',`This will make website v${deployment.version_no||'?'} public again. The current version stays in deployment history.`,[
    {text:'Cancel',style:'cancel'},
    {text:'Approve rollback',onPress:()=>{if(consumed||!websiteTaskSourceCurrent(task))return false;consumed=true;return rollbackWebsite(deployment.id);}}
   ]);return true;
  }finally{websiteAsyncGateRef.current.finish(task);}
 }
 async function run(kind){
  const task=websiteBeginTask('hosting',{deploymentBound:false,liveBound:true});if(!task)return false;
  try{
   if(!websitePublishingView?.liveDeployment){setWebsitePublishingError('Publish a website version before checking its live delivery.');return false;}
   setWebsitePublishingAction(kind==='health_check'?'health':'recover');setWebsitePublishingError('');setWebsitePublishingNotice('');
   const result=await websiteTaskAwait(task,()=>websitePublishingRequest(kind));let confirmed=false;
   if(kind==='health_check'){
    confirmed=result?.ok===true&&result.health?.ok===true&&Number.isSafeInteger(result.health.checked)&&result.health.checked>0;
    setWebsitePublishingNotice(confirmed?'The health check finished. Review the recorded deployment and delivery findings below.':'No live-site check was confirmed. Successful public delivery is not verified.');
   }else{
    const actions=result?.recovery?.actions;
    confirmed=result?.ok===true&&result.recovery?.ok===true&&Array.isArray(actions)&&actions.length>0&&actions.every(x=>x?.ok===true);
    setWebsitePublishingNotice(confirmed?'The recovery checks finished. Review the recorded delivery findings; this alone is not proof the site is healthy.':'Some recovery checks are incomplete or failed. Your approved content has not been replaced by this request.');
   }
   await websiteTaskAwait(task,()=>refreshWebsitePublishingStatus({quiet:true}));
   if(kind==='recover')followWebsiteGoLive(task);
   return confirmed;
  }catch(error){if(websiteTaskCurrent(task))setWebsitePublishingError(error?.message||'The website check could not be confirmed.');return false;}
  finally{if(websiteAsyncGateRef.current.owns(task))setWebsitePublishingAction('');websiteAsyncGateRef.current.finish(task);}
 }
 return {confirmRollbackWebsite,runWebsiteHealthCheck:()=>run('health_check'),retryWebsiteRecovery:()=>run('recover')};
}
export {createWebsiteLiveActions};
