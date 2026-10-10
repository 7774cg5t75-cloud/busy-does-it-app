/**
 * Human-friendly site journey. Read-only from existing private draft,
 * hosted preview and independently verified public delivery proof.
 */
function websiteJourneyAssurance({journey=null,publishing=null,proof=null,hasDraft=false}={}){
 const j=journey||{},p=publishing||{};
 const currentPreview=!!p.previewDeployment?.id&&p.draftChangedSinceHosted!==true;
 const published=!!p.liveDeployment?.id;
 const verified=published&&j.isVerified===true&&proof?.verified===true;
 const processing=!!p.activeJob&&["queued","processing","retry_wait"].includes(p.activeJob.status);
 const steps=Array.isArray(j.stages)?j.stages.filter(x=>x&&typeof x.state==="string"):[];
 const progress={completed:steps.filter(x=>x.state==="complete").length,total:steps.length};
 let action="brand",title="Check your business information",
   detail="Confirm your real business name, services and contact information.";
 if(j.nextAction==="brand"){}
 else if(!hasDraft||j.nextAction==="build"){
  action="build";title="Create a private website";detail="BUSY will use your approved business details.";
 }else if(processing){
  action="wait";title="Website preparation in progress";
  detail="Wait for the current job before starting another publication.";
 }else if(p.draftChangedSinceHosted===true||(!currentPreview&&!published)){
  action="prepare";title="Prepare a fresh hosted preview";
  detail="Your phone draft differs from the hosted version. Your public website remains unchanged.";
 }else if(j.nextAction==="review"&&!published){
  action="review";title="Review the exact hosted website";
  detail="Inspect the hosted preview, then give separate Go Live approval.";
 }else if(published&&!verified){
  action="verify";title="Check the real public website";
  detail="Publishing is recorded, but matching public HTTPS delivery has not been proved.";
 }else if(j.nextAction==="maintain"&&verified){
  action="maintain";title="Your published website is verified";
  detail="Your next changes stay private until you explicitly approve another publication.";
 }else{
  action="review";title="Review your latest hosted preview";
  detail="A current approved version and independent delivery evidence are still required.";
 }
 return {action,title,detail,progress,hostedPreviewReady:currentPreview,
  publicDeploymentRecorded:published,publicWebsiteVerified:verified,
  automaticPublication:false,automaticDomainPurchase:false,
  explicitOwnerGoLiveRequired:true};
}
export {websiteJourneyAssurance};
