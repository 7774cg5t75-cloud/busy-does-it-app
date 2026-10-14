import React from "react";
import {Text,View} from "react-native";
import {Card,Button,Field} from "../components/ui";
import {styles} from "../theme/styles";
import {planUniversalBuilderRequest}
 from "../core/universalBuilderPlanV3210.mjs";
import {planUniversalAppNavigation,confirmUniversalAppNavigation}
 from "../core/universalAppNavigationV3211.mjs";
import {reviewUniversalBuilderNextStepV3236}
 from "../core/sharedBuilderNextStepV3236.mjs";
import {reviewSharedBuilderDesignDirectionsV3236}
 from "../core/sharedBuilderDesignDirectionsV3236.mjs";
import {reviewSharedBuilderDesignDecisionV3237}
 from "../core/sharedBuilderDesignDecisionV3237.mjs";

/**
 * One simple opt-in planning entry point in BOTH builders.
 * The typed requirement stays in this screen's local state; no provider calls,
 * draft mutations, tenant data sharing or chargeable AI request.
 */
const friendlyStatus={
 present_in_private_draft:"Present in private draft — not live verified",
 supported_section_not_present:"Supported website section — owner setup required",
 available_module_needs_owner_setup:"Available app module — owner setup required",
 runtime_module_not_verified_available:"App module not verified as available",
 requires_service_verification:"Needs a guarded service and real verification",
 requires_new_implementation:"Needs additional development",
 unknown_not_verified:"Not verified"
};
const initial=value=>typeof value==="string"?
 value.trim().slice(0,1400):"";
function UniversalBuilderPlanReview({
 businessId="",businessType="",website=null,app=null,catalog=[],
 surface="website",initialGoal="",
 onApplyWebsiteComposition=null,onSaveAppChanges=null,busy=false
}){
 const [open,setOpen]=React.useState(false);
 const [goal,setGoal]=React.useState("");
 const [report,setReport]=React.useState(null);
 const [showDependencies,setShowDependencies]=React.useState(false);
 const [showDesignDirections,setShowDesignDirections]=React.useState(false);
 const [notice,setNotice]=React.useState("");
 const [reviewedGoal,setReviewedGoal]=React.useState("");
 const [navigationReview,setNavigationReview]=React.useState(null);
 const [working,setWorking]=React.useState(false);
 const siteId=website?.id||"",siteRevision=website?.generation||0;
 const appId=app?.id||"",appRevision=app?.draft_revision||0;
 React.useEffect(()=>{
  setReport(null);setNotice("");setShowDependencies(false);
  setReviewedGoal("");setNavigationReview(null);setShowDesignDirections(false);
 },[businessId,businessType,siteId,siteRevision,appId,appRevision]);
 React.useEffect(()=>{setGoal("");setOpen(false);},
  [businessId]);
 const review=()=>{
  const source=goal.trim()||initial(initialGoal);
  const next=planUniversalBuilderRequest({
   request:source,businessId,businessType,website,app,catalog
  });
  setReport(next.ok?next:null);
  setReviewedGoal(next.ok?source:"");
  setNavigationReview(null);
  setNotice(next.ok?"":next.reason);
  setShowDependencies(false);setShowDesignDirections(false);
 };
 const matching=report?.ok&&report.businessId===(businessId||null)&&
  report.businessType===String(businessType||"").trim()&&
  report.source.websiteId===(siteId||null)&&
  report.source.websiteRevision===(siteRevision||null)&&
  report.source.appId===(appId||null)&&
  report.source.appRevision===(appRevision||null);
 const proposeWebsiteChange=()=>{
  if(!matching||surface!=="website"||!website?.id||
    !report.sectionPlan?.changesSuggested||working)return;
  const fresh=planUniversalBuilderRequest({request:reviewedGoal,businessId,
   businessType,website,app,catalog});
  if(!fresh.ok||fresh.source.websiteId!==report.source.websiteId||
    fresh.source.websiteRevision!==report.source.websiteRevision||
    fresh.source.appRevision!==report.source.appRevision||
    JSON.stringify(fresh.detectedGoals)!==JSON.stringify(report.detectedGoals)||
    JSON.stringify(fresh.sectionPlan?.before)!==
      JSON.stringify(report.sectionPlan.before)||
    JSON.stringify(fresh.sectionPlan?.proposed)!==
      JSON.stringify(report.sectionPlan.proposed)){
    setReport(null);
    setNotice("The website or approved requirements changed. Review the current plan again.");
    return;
  }
  const applied=onApplyWebsiteComposition?.({
   action:"apply-reviewed-composition",websiteId:website.id,
   expectedGeneration:website.generation,expectedBusinessId:businessId,
   before:[...fresh.sectionPlan.before],
   proposed:[...fresh.sectionPlan.proposed]
  });
  setReport(null);setNavigationReview(null);
  setNotice(applied===true?
    "Saved the reviewed order to your private website draft. Your live website was not changed. Use Undo to reverse it.":
    "The website change was not verified. No new layout was accepted. Recheck the latest private draft.");
 };
 const prepareAppOrder=()=>{
  if(!matching||surface!=="app"||working)return;
  const next=planUniversalAppNavigation({request:reviewedGoal,businessId,
   app,website,catalog});
  setNavigationReview(next.ok?next:null);
  setNotice(next.ok?(next.preview?"":next.reason):next.reason);
 };
 const approveAppOrder=async()=>{
  if(!matching||!navigationReview?.preview||working||busy)return;
  const fresh=confirmUniversalAppNavigation({businessId,request:reviewedGoal,
   app,website,catalog,review:navigationReview});
  if(!fresh.ok){
   setNavigationReview(null);setNotice(fresh.reason);return;
  }
  setWorking(true);
  try{
   const result=await onSaveAppChanges?.({
    operations:fresh.preview.operations,appId:fresh.appId,
    expectedRevision:fresh.appRevision
   });
   setReport(null);setNavigationReview(null);
   setNotice(result?.ok===true?
    "Saved one new private app revision. Real customers and published apps are unchanged.":
    "The app change was not verified. Refresh the latest private draft before another attempt.");
  }catch{
   setReport(null);setNavigationReview(null);
   setNotice("The app save result is uncertain. Refresh the current app before retrying.");
  }finally{setWorking(false);}
 };
 const guidance=matching?reviewUniversalBuilderNextStepV3236({
  plan:report,businessId,website,app,surface
 }):null;
 const design=matching?reviewSharedBuilderDesignDirectionsV3236({
  plan:report,businessId,website,app,surface
 }):null;
 const designDecision=matching?reviewSharedBuilderDesignDecisionV3237({
  plan:report,businessId,website,app,surface
 }):null;
 const requested=matching?
  report.capabilities.filter(x=>x.explicitlyRequested):[];
 const supporting=matching?
  report.capabilities.filter(x=>x.dependencyOnly):[];
 return <View>
   <Button label={open?"Hide my website and app requirements":
     "What else can BUSY build for my business?"}
     onPress={()=>{setOpen(x=>!x);setReport(null);
       setReviewedGoal("");setNavigationReview(null);setNotice("");setShowDesignDirections(false);}}/>
   {open?<Card eyebrow="Universal Builder • private preparation"
     title="Describe what customers should be able to do"
     body="Busy can break down a new idea, reuse existing building blocks and tell you which parts still need building. Every legitimate business can start here."
     footer="Free offline design planning • no new code executed • nothing enabled or published"
     tone="blue">
     <Field label="What should your website or app do?"
       placeholder="e.g. Customers book pitches, pay deposits, get a confirmation"
       value={goal} onChangeText={next=>{
         setGoal(next);setReport(null);setReviewedGoal("");
         setNavigationReview(null);setNotice("");setShowDesignDirections(false);
       }}/>
     {initial(initialGoal)&&!goal.trim()?
       <Text style={styles.cardBody}>
         {"BUSY can use your current business brief if you leave this blank."}
       </Text>:null}
     <Button primary label="Plan the requirements (no AI credits)"
       disabled={working||!!busy} onPress={review}/>
     {notice?<Text style={styles.cardBody}>{notice}</Text>:null}
     {matching?<View>
       <Text style={styles.cardBody}>{report.summary}</Text>
       {guidance?.ok&&guidance.recommended?<View>
         <Text style={styles.sectionLabel}>BUSY's suggested next step</Text>
         <Text style={styles.cardBody}>{guidance.recommended.title}</Text>
         <Text style={styles.cardBody}>{guidance.recommended.reason}</Text>
         <Text style={styles.cardBody}>{guidance.recommended.next}</Text>
         <Text style={styles.cardBody}>
           Nothing has been changed. A private draft is not proof that customers can complete this task.
         </Text>
       </View>:null}
       {design?.ok&&design.optionCount===2?<View>
         <Button label={showDesignDirections?
           "Hide design approaches":"Compare two design approaches"}
           onPress={()=>setShowDesignDirections(x=>!x)}/>
         {showDesignDirections?<View>
           {designDecision?.ok&&designDecision.recommendedDirection?<View>
             <Text style={styles.sectionLabel}>BUSY would review this approach first</Text>
             <Text style={styles.cardBody}>{designDecision.options.find(x=>x.id===designDecision.recommendedDirection)?.title}</Text>
             <Text style={styles.cardBody}>{designDecision.reason}</Text>
           </View>:null}
           {design.directions.map(choice=><View key={choice.id}>
             <Text style={styles.sectionLabel}>{choice.title}</Text>
             <Text style={styles.cardBody}>{choice.focus}</Text>
             <Text style={styles.cardBody}>{choice.decisionTradeoff}</Text>
             {designDecision?.options.find(x=>x.id===choice.id)?.why.map((why,i)=><Text key={choice.id+"-why-"+i} style={styles.cardBody}>{why}</Text>)}
             {designDecision?.options.find(x=>x.id===choice.id)?.blockers.map((warning,i)=><Text key={choice.id+"-limit-"+i} style={styles.cardBody}>{"Check first: "+warning}</Text>)}
           </View>)}
           {designDecision?.alignment.length?<View>
             <Text style={styles.sectionLabel}>Website and app differences to check</Text>
             {designDecision.alignment.slice(0,3).map(item=><Text key={item.capabilityId} style={styles.cardBody}>{item.note}</Text>)}
           </View>:null}
           {designDecision?.brandEvidence?<Text style={styles.cardBody}>{designDecision.brandEvidence.note}</Text>:null}
           <Text style={styles.cardBody}>Neither approach has been rendered or measured here. The preferred direction is a task-planning choice, not a visual quality score.</Text>
           <Text style={styles.cardBody}>
             These are planning ideas, not rendered designs. BUSY must compare real phone, tablet and desktop previews before recommending a visual change. You approve all edits.
           </Text>
         </View>:null}
       </View>:null}
       {requested.map(item=><View key={item.id}>
         <Text style={styles.sectionLabel}>{item.title}</Text>
         <Text style={styles.cardBody}>
           {"Website: "+(friendlyStatus[item.website.status]||"Not verified")}
         </Text>
         <Text style={styles.cardBody}>
           {"Business App: "+(friendlyStatus[item.app.status]||"Not verified")}
         </Text>
         {item.requiresExternalProvider?<Text style={styles.cardBody}>
           External provider, permissions and separate costs may be needed.
         </Text>:null}
         {item.authoritativeReceiptRequired?<Text style={styles.cardBody}>
           A visible request screen is not evidence of a saved customer request,
           owner follow-up or delivered reply.
           {item.independentDiaryConfirmationRequired?
             " Booking requests also need independently confirmed availability and a diary receipt.":""}
         </Text>:null}
       </View>)}
       {supporting.length?<View>
         <Button label={showDependencies?
           "Hide supporting requirements":
           "Show the foundations BUSY would also need"}
           onPress={()=>setShowDependencies(x=>!x)}/>
         {showDependencies?supporting.map(item=>
           <Text key={item.id} style={styles.cardBody}>
             {"• "+item.title+" — website: "+
              (friendlyStatus[item.website.status]||"Not verified")+
              "; app: "+(friendlyStatus[item.app.status]||"Not verified")}
           </Text>):null}
       </View>:null}
       {surface==="website"&&report.sectionPlan?.ok?<View>
         <Text style={styles.sectionLabel}>Existing website section priorities</Text>
         <Text style={styles.cardBody}>{report.sectionPlan.reason}</Text>
         {report.sectionPlan.contentNotYetReady?.length?
          <Text style={styles.cardBody}>
           {"Before featuring these sections more prominently, add approved content: "+
            report.sectionPlan.contentNotYetReady.join(", ")+". No empty sections will be promoted."}
          </Text>:null}
         {report.sectionPlan.changesSuggested?
          <Text style={styles.cardBody}>
           {"Private suggested order: "+report.sectionPlan.proposed.join(" → ")+
            ". Nothing has been changed until you explicitly approve."}
          </Text>:null}
         {report.sectionPlan.changesSuggested&&typeof onApplyWebsiteComposition==="function"?(
           <Button primary label="Approve this private website section order"
             disabled={working||!!busy} onPress={proposeWebsiteChange}/>
         ):null}
       </View>:null}
       {surface==="app"&&app?.id&&typeof onSaveAppChanges==="function"?<View>
         <Button label="Review app navigation for these requirements"
           disabled={working||!!busy} onPress={prepareAppOrder}/>
         {navigationReview?.preview?<View>
           <Text style={styles.sectionLabel}>Before — current private app</Text>
           <Text style={styles.cardBody}>{navigationReview.preview.before.join(" → ").replaceAll("_"," ")}</Text>
           <Text style={styles.sectionLabel}>After — proposed private app</Text>
           <Text style={styles.cardBody}>{navigationReview.preview.after.join(" → ").replaceAll("_"," ")}</Text>
           <Button primary label={working?"Saving…":"Approve one private app navigation change"}
             disabled={working||!!busy} onPress={approveAppOrder}/>
           <Button label="Keep the original app navigation"
             onPress={()=>{setNavigationReview(null);setNotice("Nothing was changed.");}}/>
         </View>:null}
       </View>:null}
       <Text style={styles.cardBody}>
         BUSY has prepared a private plan and, if you approve, can reorder only existing sections. New capabilities and server integrations still need separate implementation and testing. No booking, payment, message or public site was created.
       </Text>
     </View>:null}
   </Card>:null}
 </View>;
}
export {UniversalBuilderPlanReview};
