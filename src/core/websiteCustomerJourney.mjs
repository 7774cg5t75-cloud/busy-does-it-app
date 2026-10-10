/**
 * V3.114 four-step website journey (read-only view of existing evidence).
 * Selecting an address does not create one, delay publication, or prove delivery.
 */
function websiteCustomerJourney({journey={},publishing={},proof=null,hasDraft=false}={}){
 const facts=Array.isArray(journey.missingCoreFacts)?journey.missingCoreFacts:[];
 const readyBusiness=facts.length===0&&journey.nextAction!=="brand";
 const draftReady=!!hasDraft;
 const hosted=publishing.previewDeployment||null;
 const hostedReady=!!hosted?.id&&!publishing.draftChangedSinceHosted;
 const hasPublished=!!publishing.liveDeployment?.id;
 const isVerified=proof?.verified===true;
 const steps=[
  {id:"describe",title:"Tell BUSY about your business",complete:readyBusiness},
  {id:"design",title:"Review and personalise your design",complete:draftReady},
  {id:"address",title:"Choose your address",complete:false,optional:true},
  {id:"launch",title:"Approve and check Go Live",complete:isVerified}
 ];
 let next="describe";
 if(readyBusiness&&!draftReady)next="design";
 else if(readyBusiness&&draftReady&&!hostedReady)next="prepare";
 else if(readyBusiness&&hostedReady&&!hasPublished)next="approve";
 else if(hasPublished&&!isVerified)next="check-live";
 else if(isVerified)next="maintain";
 const messages={
  describe:"Check your business details. BUSY will use them to create your website.",
  design:"Your next step is to see BUSY's design and ask for any changes you want.",
  prepare:"Your private draft is ready. Prepare a fresh hosted preview to review before publishing.",
  approve:"Review the exact hosted preview and give explicit Go Live approval when you're happy.",
  "check-live":"Publication is recorded, but the live website still needs verification.",
  maintain:"Your current public website passed the matching delivery checks. You can keep improving your private draft."
 };
 return {steps,next,message:messages[next],
  addressOptional:true,domainPurchaseRequired:false,
  previewVerified:hostedReady,liveVerified:isVerified,
  nextActionTarget:next==="describe"?"brand":next==="design"?"builder":"publishing"};
}
export {websiteCustomerJourney};
