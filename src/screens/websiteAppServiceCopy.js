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
 const [review,setReview]=React.useState(null);
 const plan=planCopyMissingAppServices(website,app,{businessId});
 const available=plan.ok&&plan.addedCount>0;
 if(!available&&!review)return null;
 return <Card eyebrow="Keep your website and app consistent"
  title="Copy services you've written in your Business App"
  body="Copy only services missing from this website. Existing website services and descriptions are kept exactly as they are. No AI credits or automatic publication."
  tone="blue">
  {!review?(
   <>
    <Text style={styles.cardBody}>
      {plan.addedCount+" missing services ready to review. "+
       plan.skippedExisting.length+" existing website services will be left alone."}
    </Text>
    <Button label="Review missing services" onPress={()=>setReview({
      businessId:plan.businessId,sourceAppId:plan.sourceAppId,
      sourceAppRevision:plan.sourceAppRevision,
      targetWebsiteId:plan.targetWebsiteId,
      targetWebsiteGeneration:plan.targetWebsiteGeneration,
      added:plan.added.map(x=>({...x})),
      skippedExisting:[...plan.skippedExisting]
    })}/>
   </>
  ):(
   <View>
    <Text style={styles.sectionLabel}>Only these exact services will be added</Text>
    {review.added.map((service,index)=>(
      <View key={index} style={{marginBottom:9}}>
       <Text style={styles.sectionLabel}>{service.title}</Text>
       <Text style={styles.cardBody}>{service.body||"No description supplied by the owner."}</Text>
      </View>
    ))}
    <Text style={styles.cardBody}>
      {"Already on the website and kept unchanged: "+
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
  )}
 </Card>;
}
export {WebsiteAppServiceCopy};
