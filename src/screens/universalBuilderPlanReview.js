import React from "react";
import {Text,View} from "react-native";
import {Card,Button,Field} from "../components/ui";
import {styles} from "../theme/styles";
import {planUniversalBuilderRequest}
 from "../core/universalBuilderPlanV3210.mjs";

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
 surface="website",initialGoal=""
}){
 const [open,setOpen]=React.useState(false);
 const [goal,setGoal]=React.useState("");
 const [report,setReport]=React.useState(null);
 const [showDependencies,setShowDependencies]=React.useState(false);
 const [notice,setNotice]=React.useState("");
 const siteId=website?.id||"",siteRevision=website?.generation||0;
 const appId=app?.id||"",appRevision=app?.draft_revision||0;
 React.useEffect(()=>{
  setReport(null);setNotice("");setShowDependencies(false);
 },[businessId,businessType,siteId,siteRevision,appId,appRevision]);
 React.useEffect(()=>{setGoal("");setOpen(false);},
  [businessId]);
 const review=()=>{
  const source=goal.trim()||initial(initialGoal);
  const next=planUniversalBuilderRequest({
   request:source,businessId,businessType,website,app,catalog
  });
  setReport(next.ok?next:null);
  setNotice(next.ok?"":next.reason);
  setShowDependencies(false);
 };
 const matching=report?.ok&&report.businessId===(businessId||null)&&
  report.source.websiteId===(siteId||null)&&
  report.source.websiteRevision===(siteRevision||null)&&
  report.source.appId===(appId||null)&&
  report.source.appRevision===(appRevision||null);
 const requested=matching?
  report.capabilities.filter(x=>x.explicitlyRequested):[];
 const supporting=matching?
  report.capabilities.filter(x=>x.dependencyOnly):[];
 return <View>
   <Button label={open?"Hide my website and app requirements":
     "What else can BUSY build for my business?"}
     onPress={()=>{setOpen(x=>!x);setReport(null);setNotice("");}}/>
   {open?<Card eyebrow="Universal Builder • private preparation"
     title="Describe what customers should be able to do"
     body="Busy can break down a new idea, reuse existing building blocks and tell you which parts still need building. Every legitimate business can start here."
     footer="Free offline design planning • no new code executed • nothing enabled or published"
     tone="blue">
     <Field label="What should your website or app do?"
       placeholder="e.g. Customers book pitches, pay deposits, get a confirmation"
       value={goal} onChangeText={setGoal}/>
     {initial(initialGoal)&&!goal.trim()?
       <Text style={styles.cardBody}>
         {"BUSY can use your current business brief if you leave this blank."}
       </Text>:null}
     <Button primary label="Plan the requirements (no AI credits)"
       onPress={review}/>
     {notice?<Text style={styles.cardBody}>{notice}</Text>:null}
     {matching?<View>
       <Text style={styles.cardBody}>{report.summary}</Text>
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
         {report.sectionPlan.changesSuggested?
          <Text style={styles.cardBody}>
           {"Private suggested order: "+report.sectionPlan.proposed.join(" → ")+
            ". Nothing has been changed. Use the existing section arrangement controls to approve changes one by one."}
          </Text>:null}
       </View>:null}
       <Text style={styles.cardBody}>
         BUSY has only prepared a plan. Screens and server integrations still
         need separate implementation and testing. No booking, payment,
         customer message, public website or downloadable app was created.
       </Text>
     </View>:null}
   </Card>:null}
 </View>;
}
export {UniversalBuilderPlanReview};
