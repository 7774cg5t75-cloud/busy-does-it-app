import React from "react";
import {View,Text} from "react-native";
import {Card,Button} from "../components/ui";
import {styles} from "../theme/styles";
import {planWebsiteAppRequestHandoff}
 from "../core/websiteAppHandoffV3214.mjs";
import {websiteEnquiryReadinessV3215}
 from "../core/websiteEnquiryReadinessV3215.mjs";
import {planWebsiteIntakeV3216}
 from "../core/websiteIntakePlanningV3216.mjs";
import {adviseCustomerCapabilityV3216}
 from "../core/customerCapabilityAdviceV3216.mjs";
import {planBusinessJourneyNextStepV3217}
 from "../core/businessJourneyCoachV3217.mjs";
import {adviseVerifiedCustomerJourneyV3219}
 from "../core/customerJourneyActionV3219.mjs";
import {adviseConnectedCustomerJourneyV3220}
 from "../core/connectedJourneyAdviceV3220.mjs";
import {chooseOwnerNextActionV3223}
 from "../core/businessNextActionV3223.mjs";
import {planUniversalCustomerJourneyV3218}
 from "../core/universalCustomerJourneyV3218.mjs";
import {WebsiteFormSpecReviewV3217}
 from "./websiteFormSpecReviewV3217";

/** Optional two-step private owner handoff review; no new web form. */
function WebsiteAppHandoffReview({businessId="",website=null,app=null,
 liveVersion=null,catalog=[],endpoint="",onApply=null,
 publishing=null,deliveryProof=null,businessType="",description=""}){
 const [open,setOpen]=React.useState(false);
 const [kind,setKind]=React.useState("enquiry");
 const [notice,setNotice]=React.useState("");
 const [reviewed,setReviewed]=React.useState(false);
 const [showFormReadiness,setShowFormReadiness]=React.useState(false);
 const [showConnectedPlan,setShowConnectedPlan]=React.useState(false);
 React.useEffect(()=>{
  setOpen(false);setReviewed(false);setNotice("");
  setShowFormReadiness(false);setShowConnectedPlan(false);
 },[businessId,website?.id,website?.generation,app?.id,
  app?.current_live_version_id,liveVersion?.id]);
 const latest=planWebsiteAppRequestHandoff({
  businessId,website,app,liveVersion,catalog,endpoint,kind});
 const linked=website?.theme?.appRequestLinks?.[kind]||null;
 const nativeForm=websiteEnquiryReadinessV3215({
  businessId,website,app,liveVersion,catalog,endpoint,
  publishing,deliveryProof
 });
 const nativePlan=planWebsiteIntakeV3216({businessId,website,app,
  liveVersion,catalog,endpoint,publishing,deliveryProof,kind});
 const advice=adviseCustomerCapabilityV3216({businessType,description,
  catalog,publishedModules:liveVersion?.config?.modules,
  businessId,app,liveVersion});
 const journeyCoach=planBusinessJourneyNextStepV3217({
   businessType,description,businessId,website,app,liveVersion,catalog
 });
 const connectedPlan=planUniversalCustomerJourneyV3218({
   businessId,website,app,liveVersion,catalog,endpoint,
   businessType,description,publishing,deliveryProof
 });
 const evidenceAction=adviseVerifiedCustomerJourneyV3219({
   businessId,website,app,liveVersion,catalog,endpoint,
   businessType,description
 });
 const primaryAdvice=adviseConnectedCustomerJourneyV3220({
  businessId,website,app,liveVersion,catalog,endpoint,
  businessType,description,publishing,deliveryProof
 });
 const nextDecision=chooseOwnerNextActionV3223({
   businessId,website,app,liveVersion,catalog,endpoint,
   businessType,description,publishing,deliveryProof
 });
 const current=latest.ok&&linked?.ownerApproved===true&&
  linked.url===latest.url&&linked.appId===latest.appId&&
  linked.liveVersionId===latest.appLiveVersionId;
 const approve=()=>{
  if(!reviewed||!latest.ok||typeof onApply!=="function")return;
  const refreshed=planWebsiteAppRequestHandoff({
   businessId,website,app,liveVersion,catalog,endpoint,kind});
  if(!refreshed.ok||
     refreshed.websiteId!==latest.websiteId||
     refreshed.websiteGeneration!==latest.websiteGeneration||
     refreshed.appLiveVersionId!==latest.appLiveVersionId||
     refreshed.url!==latest.url){
    setReviewed(false);setNotice("The linked Business App or website changed. Review again.");
    return;
  }
  const success=onApply({
   action:"connect-app-request",websiteId:refreshed.websiteId,
   expectedGeneration:refreshed.websiteGeneration,
   expectedBusinessId:refreshed.businessId,intent:kind,
   appId:refreshed.appId,liveVersionId:refreshed.appLiveVersionId,
   slug:app.public_slug,url:refreshed.url
  });
  setReviewed(false);
  setNotice(success===true?
   "Saved to your private website. Visitors will see it only after you separately approve website publication. The public Business App checks the live action when a visitor clicks.":
   "The connection was not accepted. Recheck the current published app and website.");
 };
 const disconnect=()=>{
  if(!linked||!website?.id||!Number.isSafeInteger(website.generation)||
     typeof onApply!=="function")return;
  const success=onApply({
   action:"disconnect-app-request",websiteId:website.id,
   expectedGeneration:website.generation,
   expectedBusinessId:businessId,intent:kind
  });
  setReviewed(false);
  setNotice(success===true?
   "Removed the link from the private website draft. Undo is available. An already published website is unchanged.":
   "Could not remove the draft link. Review the latest private website.");
 };
 return <View>
   <Button label={open?"Hide website and Business App handoff":
      "Connect my website to customer requests in BUSY"}
     onPress={()=>{setOpen(v=>!v);setReviewed(false);setNotice("");}}/>
   {open?<Card eyebrow="V3.214 • Website + Business App"
     title="Use a real, published Business App request"
     body="Visitors can follow a link from your website to an already-live BUSY Business App. A website contact section by itself cannot save a request."
     tone="blue"
     footer="No website form, booking, notification, charge or public edit is created here.">
     <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>
       <Button label={(kind==="enquiry"?"✓ ":"")+"Enquiries"}
         onPress={()=>{setKind("enquiry");setReviewed(false);setNotice("");}}/>
       <Button label={(kind==="booking_request"?"✓ ":"")+"Booking requests"}
         onPress={()=>{setKind("booking_request");setReviewed(false);setNotice("");}}/>
     </View>
     {latest.ok?<View>
       <Text style={styles.cardBody}>{latest.explanation}</Text>
       <Text style={styles.cardBody}>
         {"Available live Business App version: "+latest.appLiveVersionId.slice(0,8)+
         "… • Website draft version: "+latest.websiteGeneration}
       </Text>
       {current?<Text style={styles.cardBody}>
         This action is already linked in your private website draft.
       </Text>:null}
       {!current&&typeof onApply==="function"?<View>
         <Button label={reviewed?"Cancel this handoff review":
           "Review this live-app link before adding it"}
           onPress={()=>setReviewed(v=>!v)}/>
         {reviewed?<View>
           <Text selectable style={styles.cardBody}>{latest.url}</Text>
           <Text style={styles.cardBody}>
             Owner approval will add a link to the existing Contact section.
             Existing content is preserved and Undo can reverse the private edit.
             Publishing remains a separate owner action.
           </Text>
           <Button primary label="Approve connection to my private website"
             onPress={approve}/>
         </View>:null}
       </View>:null}
     </View>:<Text style={styles.cardBody}>
       {"Not ready to link: "+latest.reason}
     </Text>}
     {nextDecision.ok?<Text style={styles.cardBody}>
       {"BUSY recommends: "+nextDecision.title+". "+nextDecision.reason}
     </Text>:primaryAdvice.ok?<Text style={styles.cardBody}>
       {"BUSY recommends: "+primaryAdvice.headline+". "+primaryAdvice.detail}
     </Text>:null}
     <Button label={showConnectedPlan?
        "Hide connected customer journey":"How would BUSY connect my website and app?"}
       onPress={()=>setShowConnectedPlan(v=>!v)}/>
     {showConnectedPlan&&connectedPlan.ok?<View>
       <Text style={styles.cardBody}>{connectedPlan.summary}</Text>
       <Text style={styles.cardBody}>
         {"BUSY suggestion: "+advice.goal+". "+advice.explanation}
       </Text>
       <Text style={styles.cardBody}>
         {"Suggested next step: "+journeyCoach.title+". "+journeyCoach.reason}
       </Text>
       {evidenceAction.ok?<Text style={styles.cardBody}>
         {"BUSY's suggested action: "+evidenceAction.title+". "+evidenceAction.reason}
       </Text>:null}
       {connectedPlan.steps.map(step=><View key={step.id}>
         <Text style={styles.sectionLabel}>{step.title}</Text>
         <Text style={styles.cardBody}>{step.reason}</Text>
       </View>)}
       <Text style={styles.cardBody}>
         Nothing is published or sent. Website forms still require a tested
         server transaction and explicit owner approval.
       </Text>
     </View>:null}
     <Button label={showFormReadiness?
        "Hide built-in website form readiness":
        "What would my own website enquiry form need?"}
       onPress={()=>setShowFormReadiness(v=>!v)}/>
     {showFormReadiness?<View>
       <Text style={styles.cardBody}>{nativeForm.safeExplanation}</Text>
       <Text style={styles.cardBody}>
         {"Requirements with source evidence: "+nativeForm.verifiedPrerequisites+
         " of "+nativeForm.totalPrerequisites+
         ". A built-in website form is not enabled."}
       </Text>
       {nativeForm.requirements.filter(check=>!check.ready).slice(0,5).map(check=>
         <Text key={check.id} style={styles.cardBody}>
           {"To develop or verify: "+check.title+". "+check.detail}
         </Text>)}
       <Text style={styles.sectionLabel}>
         Proposed customer form (not live)
       </Text>
       {nativePlan.proposedFields?.map(field=><Text key={field.key}
         style={styles.cardBody}>{"• "+field.label}</Text>)}
       <Text style={styles.cardBody}>
         Customers must provide a name, either email or phone, and an enquiry
         message or requested service. BUSY will require an owner-reviewed
         privacy notice and explicit visitor agreement before any submission.
       </Text>
       <Text style={styles.cardBody}>
         {"V3.216 preparation: "+nativePlan.completedSourceChecks+
          " of "+nativePlan.stages.length+" source checks, with zero live browser tests. "+
          nativePlan.mobileGuidance}
       </Text>
       {nativePlan.stages?.filter(step=>!step.ready).slice(0,3).map(step=><Text
          key={step.id} style={styles.cardBody}>{"Still to verify: "+step.name}</Text>)}
       <WebsiteFormSpecReviewV3217 businessId={businessId}
         website={website} publishing={publishing} kind={kind}/>
       <Text style={styles.cardBody}>
         For now, the approved Business App handoff is the supported path.
         The public link rechecks its exact app and version when clicked.
       </Text>
     </View>:null}
     {linked?<View>
       <Text style={styles.cardBody}>
         {current?"The private draft links to the current live app.":
           "The stored link no longer matches the current published app evidence. Visitors using the old link may be asked to contact the business. Review and approve a new version, then separately republish the website."}
       </Text>
       <Button label="Remove this handoff from my private website" onPress={disconnect}/>
     </View>:null}
     {notice?<Text style={styles.cardBody}>{notice}</Text>:null}
   </Card>:null}
 </View>;
}
export {WebsiteAppHandoffReview};
