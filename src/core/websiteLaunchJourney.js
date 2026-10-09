/**
 * V3.77 customer-facing website launch journey.
 * Read-only derived state: never infers successful public delivery merely
 * because a draft or deployment row exists.
 */
const count=n=>Number.isSafeInteger(n)&&n>=0?n:0;
const readyText=n=>n===1?"1 missing business detail":n+" missing business details";
function buildWebsiteLaunchJourney({brand=null,draft=null,publishing=null}={}){
 const b=brand||{},p=publishing||{};
 const missing=Array.isArray(b.completeness?.coreMissing)?
   b.completeness.coreMissing.filter(x=>typeof x==="string"&&x.trim()).slice(0,8):[];
 const businessReady=b.websiteReady===true&&missing.length===0;
 const prepared=!!(p.previewDeployment?.id||p.liveDeployment?.id);
 const editorReady=!!draft;
 const live=!!p.liveDeployment?.id;
 const healthStatus=String(p.healthStatus||"");
 const verifiedLive=live&&healthStatus==="healthy"&&
   !!(p.website?.last_health_check_at)&&
   !!(p.website?.current_live_deployment_id)&&
   p.website.current_live_deployment_id===p.liveDeployment.id;
 const active=!!p.activeJob&&["queued","processing","retry_wait"].includes(p.activeJob.status);
 const previewFresh=!!p.previewDeployment?.id&&!p.draftChangedSinceHosted;
 const stages=[
   {id:"details",title:"Tell BUSY about your business",state:businessReady?"complete":missing.length?"needs_details":"review",
     detail:businessReady?"Core business details are recorded":
       missing.length?readyText(missing.length)+" need your review":"Check your business name, services and contact information"},
   {id:"draft",title:"Build your website draft",state:editorReady?"complete":"ready",
     detail:editorReady?"A private draft is available":"BUSY will draft from your saved business information"},
   {id:"edit",title:"Preview and edit the wording",state:editorReady?"ready":"waiting",
     detail:editorReady?"Review wording, photos, services and contact details":"Start by generating a draft"},
   {id:"hosted",title:"Prepare the exact hosted preview",state:previewFresh||live?"complete":active?"working":editorReady?"ready":"waiting",
     detail:previewFresh?"A hosted version is ready for review":
       live?"A website version has already been published":
       active?"A publishing job is still running":
       "A phone preview is not the same as a hosted version"},
   {id:"approve",title:"Review and approve Go Live",state:live?"complete":previewFresh&&p.canPublish?"ready":active?"working":"waiting",
     detail:live?"A public deployment has been recorded":
       previewFresh&&p.canPublish?"Open the exact hosted version before approving":
       "Publishing needs a ready hosted preview and explicit approval"},
   {id:"verify",title:"Verify the live website",state:verifiedLive?"complete":live?"ready":"waiting",
     detail:verifiedLive?"A matching live deployment passed BUSY's health check":
       live?"Open the public address and run a live health check":
       "A deployment is not verified until the public site is checked"}
 ];
 let nextAction="brand";
 if(!editorReady)nextAction=businessReady?"build":"brand";
 else if(!prepared||p.draftChangedSinceHosted)nextAction="prepare";
 else if(!live)nextAction="review";
 else if(!verifiedLive)nextAction="verify";
 else nextAction="maintain";
 return {
   stages,nextAction,
   completedStages:stages.filter(x=>x.state==="complete").length,
   totalStages:stages.length,
   missingCoreFacts:missing,
   currentStatus:!editorReady?"needs_draft":!prepared?"needs_hosted_preview":
     !live?"awaiting_customer_approval":verifiedLive?"live_verified":"live_unverified",
   isPublic:live,
   isVerified:verifiedLive,
   canClaimPublished:verifiedLive,
   subscription:{status:"unverified",billingEnforced:false,suspensionEnabled:false,
     note:"Website hosting and subscription entitlement are not yet linked to a verified billing ledger. BUSY will not claim an active paid plan or apply automatic suspension."},
   customerControl:{
     explicitGoLiveApprovalRequired:true,
     rollbackAvailable:count(p.deployments?.length)>0||live,
     domainOwnership:"Customers should retain control of domains they own. Domain transfer and website export policy require separate implementation and release review."
   }
 };
}
export {buildWebsiteLaunchJourney};
