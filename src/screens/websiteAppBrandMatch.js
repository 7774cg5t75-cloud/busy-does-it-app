import {reviewedPairIsCurrent} from '../core/ownerBuilderDraftGuardV3195.mjs';
import React from "react";
import {View,Text} from "react-native";
import {Card,Button} from "../components/ui";
import {styles} from "../theme/styles";
import {planMatchAppBrandToWebsite} from "../core/ownerBuilderBrandBridgeV3193.mjs";
import {nativePalette,LABELS} from "../core/nativePalette.mjs";

/** Separate, optional review: does not publish or synchronise two builders. */
function WebsiteAppBrandMatch({website,app,businessId,onApply}){
 const [review,setReview]=React.useState(null);
 const live=React.useRef(null);live.current={website,app,businessId};
 const plan=planMatchAppBrandToWebsite(website,app,{businessId});
 if(!plan.ok&&!review)return null;
 if(review&&!reviewedPairIsCurrent(website,app,businessId,review))return <Card title="Review updated builder drafts" body="The brand source or website changed. No old proposal was applied."><Button label="Review current brand choices" onPress={()=>setReview(null)}/></Card>;
 const chosen=review||plan;
 const colours=nativePalette(chosen.paletteName,
  app?.draft_config?.presentation?.brandAccent);
 return <Card eyebrow="Coordinate your branding"
   title="Match the website colour to your Business App"
   body="Keep separate layouts and content, but use a coordinated brand colour on both. Busy adjusts website button contrast automatically."
   tone="blue">
   <View style={{backgroundColor:colours.bg,padding:14,borderRadius:10,marginBottom:8}}>
     <Text style={{color:colours.text,fontWeight:"700"}}>
       {LABELS[chosen.paletteName]||"Your own brand colour"}
     </Text>
     <View style={{backgroundColor:colours.accent,padding:11,
       borderRadius:8,marginTop:9}}>
       <Text style={{color:colours.bg,fontWeight:"700"}}>Selected colour: {chosen.targetColour}</Text>
     </View>
   </View>
   {review?(
     <>
      <Text style={styles.cardBody}>
       This changes only the private website colour. It leaves existing
       wording, photos, page layouts and the Business App itself untouched.
       You can use website Undo afterwards.
      </Text>
      <Button primary label="Apply this colour to my PRIVATE website"
       onPress={()=>{if(live.current.website!==website||live.current.app!==app||live.current.businessId!==businessId)return;if(onApply?.(review)===true)setReview(null);}}/>
      <Button label="Cancel colour change" onPress={()=>setReview(null)}/>
     </>
   ):(
     <Button label="Review matching website colour"
      onPress={()=>setReview({...plan})}/>
   )}
 </Card>;
}
export {WebsiteAppBrandMatch};
