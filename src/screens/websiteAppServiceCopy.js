import React from "react";
import {Text,View} from "react-native";
import {Card,Button} from "../components/ui";
import {styles} from "../theme/styles";
import {planCopyMissingAppServices} from "../core/ownerBuilderServiceBridgeV3192.mjs";

/**
 * V3.192 — deliberately separate from the huge WebsiteBuilder screen.
 * The owner sees exactly which service names/descriptions will be added.
 * We retain that reviewed snapshot until owner approval or cancellation.
 */
function WebsiteAppServiceCopy({website,app,businessId,onApply}){
 const [fillDescriptions,setFillDescriptions]=React.useState(false);
 const [review,setReview]=React.useState(null);
 const plan=planCopyMissingAppServices(website,app,{businessId,fillDescriptions});
 const available=plan.ok&&(plan.addedCount>0||plan.filledCount>0);
 if(!website?.id||!app?.id)return null;
 return <Card eyebrow="Keep your website and app consistent"
  title="Copy services you've written in your Business App"
  body="Copy only services missing from this website. Existing wording stays unchanged; you can explicitly include empty descriptions below. No AI credits or automatic publication."
  tone="blue">
  <Button label={(fillDescriptions?"✓ ":"")+"Also fill empty descriptions for matching services"} onPress={()=>{setFillDescriptions(x=>!x);setReview(null);}}/>
  {!available&&!review?<Text style={styles.cardBody}>{plan.reason}</Text>:null}
  {!review&&available?(
   <>
    <Text style={styles.cardBody}>
      {plan.addedCount+" missing services and "+plan.filledCount+" empty descriptions ready to review. "+
       plan.skippedExisting.length+" existing website service names will be retained."}
    </Text>
    <Button label="Review missing services" onPress={()=>setReview({
      businessId:plan.businessId,sourceAppId:plan.sourceAppId,
      sourceAppRevision:plan.sourceAppRevision,
      targetWebsiteId:plan.targetWebsiteId,
      targetWebsiteGeneration:plan.targetWebsiteGeneration,
      fillDescriptions,filledDescriptions:plan.filledDescriptions.map(x=>({...x})),
      added:plan.added.map(x=>({...x})),
      skippedExisting:[...plan.skippedExisting]
    })}/>
   </>
  ):review?(
   <View>
    <Text style={styles.sectionLabel}>Review these exact additions and empty-field updates</Text>
    {review.filledDescriptions.map((row,index)=><Text key={"filled-"+index} style={styles.cardBody}>{"Fill empty description for "+row.name+": "+row.description}</Text>)}
    {review.added.map((service,index)=>(
      <View key={index} style={{marginBottom:9}}>
       <Text style={styles.sectionLabel}>{service.title}</Text>
       <Text style={styles.cardBody}>{service.body||"No description supplied by the owner."}</Text>
      </View>
    ))}
    <Text style={styles.cardBody}>
      {"Already on the website (only selected empty descriptions may change): "+
       (review.skippedExisting.join(", ")||"none")+". "}
      The website remains private. Undo is available after applying.
    </Text>
    <Button primary label="Copy these services into my PRIVATE website"
     onPress={()=>{
      const accepted=onApply?.(review);
      if(accepted===true)setReview(null);
     }}/>
    <Button label="Cancel — do not copy" onPress={()=>setReview(null)}/>
   </View>
  ):null}
 </Card>;
}
export {WebsiteAppServiceCopy};
