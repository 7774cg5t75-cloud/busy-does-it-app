import React from "react";
import {Text,View} from "react-native";
import {Card,Button} from "../components/ui";
import {styles} from "../theme/styles";
import {planIndustryFirstExperience,confirmIndustryFirstExperience}
 from "../core/industryFirstExperienceV3200.mjs";

/** Review one useful industry-specific customer action in the existing
 * PRIVATE Business App. No unsupported modules, automatic publish or spend. */
function IndustryFirstExperienceReview({
 businessId,app,catalog=[],onSave,onRefresh,busy
}){
 const [open,setOpen]=React.useState(false);
 const [review,setReview]=React.useState(null);
 const [working,setWorking]=React.useState(false);
 const [notice,setNotice]=React.useState("");
 React.useEffect(()=>{
  setOpen(false);setReview(null);setNotice("");
 },[businessId,app?.id,app?.draft_revision]);
 if(!app?.id||!businessId)return null;
 const plan=planIndustryFirstExperience({businessId,app,catalog});
 return <Card eyebrow="Busy checks the customer journey"
  title="Make the app useful for your customers"
  body="Busy can explain which real customer action suits this business, check supported features, and prepare one private navigation improvement. You decide whether to save it."
  tone="blue">
  <Button label={open?"Hide customer journey review":"Review my customer's first action"}
   onPress={()=>{setOpen(v=>!v);setReview(null);setNotice("");}}/>
  {open?<View>
   {!plan.ok?<View>
     <Text style={styles.cardBody}>{plan.reason}</Text>
     <Button label="Refresh the verified app and feature list"
      onPress={()=>onRefresh?.()} disabled={working||!!busy}/>
   </View>:<View>
     <Text style={styles.sectionLabel}>
       {plan.actionLabel||"Customer action needs setup"}
     </Text>
     <Text style={styles.cardBody}>{plan.why}</Text>
     {plan.missingSetup.map((s,i)=>
       <Text key={i} style={styles.cardBody}>{"Needs review: "+s}</Text>)}
     {plan.checks.map(x=><Text key={x.id} style={styles.cardBody}>
       {x.label+": "+x.result.replaceAll("_"," ")}
     </Text>)}
     <Text style={styles.cardBody}>
       These checks cannot prove live submissions, device accessibility or
       booking confirmations. They do not publish or turn on anything.
     </Text>
     {plan.preview?<View>
       <Button label="Review Busy's suggested section order"
        disabled={working||!!busy}
        onPress={()=>{setReview(plan);setNotice("");}}/>
       {review?<View>
         <Text style={styles.sectionLabel}>Before</Text>
         <Text style={styles.cardBody}>{review.preview.before.join(" → ").replaceAll("_"," ")}</Text>
         <Text style={styles.sectionLabel}>After — private preview only</Text>
         <Text style={styles.cardBody}>{review.preview.after.join(" → ").replaceAll("_"," ")}</Text>
         <Button primary
          label={working?"Saving private change…":"Approve my private app navigation"}
          disabled={working||!!busy}
          onPress={async()=>{
           const verified=confirmIndustryFirstExperience({
            businessId,app,catalog,evidence:review});
           if(!verified.ok){setReview(null);setNotice(verified.reason);return;}
           setWorking(true);
           try{
            const result=await onSave?.({operations:verified.preview.operations,
              appId:verified.appId,expectedRevision:verified.appRevision});
            setReview(null);
            setNotice(result?.ok?
             "Saved as a new private app revision. Check the customer preview and test live request delivery separately.":
             "The app change could not be verified. Refresh the current private draft before trying again.");
           }catch{
            setReview(null);
            setNotice("The save result is uncertain. Refresh the app status before trying again.");
           }finally{setWorking(false);}
          }}/>
         <Button label="Keep the original app"
          onPress={()=>{setReview(null);setNotice("Nothing was changed.");}}/>
       </View>:null}
     </View>:<Text style={styles.cardBody}>
       No safe section reorder is needed. The existing ordering is preserved.
     </Text>}
   </View>}
   {notice?<Text style={styles.cardBody}>{notice}</Text>:null}
  </View>:null}
 </Card>;
}
export {IndustryFirstExperienceReview};
