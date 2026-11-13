import {reviewedPairIsCurrent} from '../core/ownerBuilderDraftGuardV3195.mjs';
import React from "react";
import {Text,View} from "react-native";
import {Card,Button} from "../components/ui";
import {styles} from "../theme/styles";
import {planMatchAppTypeToWebsite} from "../core/ownerBuilderTypographyBridgeV3194.mjs";
import {appVisualPresentation,TYPE_LABELS} from "../core/appVisualPresentationV3194.mjs";

/** Preview then tap; no background or automatic site publication. */
function WebsiteAppTypographyMatch({website,app,businessId,onApply}){
 const [review,setReview]=React.useState(null);
 const live=React.useRef(null);live.current={website,app,businessId};
 const plan=planMatchAppTypeToWebsite(website,app,{businessId});
 if(!plan.ok&&!review)return null;
 if(review&&!reviewedPairIsCurrent(website,app,businessId,review))return <Card title="Review updated builder drafts" body="The brand source or website changed. No old proposal was applied."><Button label="Review current brand choices" onPress={()=>setReview(null)}/></Card>;
 const chosen=review||plan;
 const visual=appVisualPresentation({typeStyle:chosen.typeStyle});
 return <Card eyebrow="Coordinate your look"
  title="Match the website's typography to your Business App"
  body="Choose a compatible heading style without forcing both designs to look the same. All website changes stay private until you approve publication."
  tone="blue">
   <View style={{marginVertical:10,padding:12,borderRadius:10,
     backgroundColor:"#243044"}}>
     <Text style={{fontSize:visual.type.titleSize,
       fontWeight:visual.type.titleWeight,
       letterSpacing:visual.type.titleSpacing,color:"#FFFFFF"}}>
       {app?.draft_config?.display?.name||"Your business"}
     </Text>
     <Text style={{marginTop:8,color:"#D9E2EF"}}>
       {TYPE_LABELS[chosen.typeStyle]||"Balanced and clear"}
     </Text>
     <Text style={{marginTop:8,color:"#D9E2EF",fontSize:13}}>
       The website uses its own responsive type rules. This is a style guide, not a pixel-identical screenshot.
     </Text>
   </View>
   {review?(
    <View>
     <Text style={styles.cardBody}>
       Only the website heading style changes. Its wording, photos, pages,
       contact actions and published site are unaffected. Undo remains available.
     </Text>
     <Button primary label="Apply typography to my PRIVATE website"
      onPress={()=>{if(live.current.website!==website||live.current.app!==app||live.current.businessId!==businessId)return;if(onApply?.(review)===true)setReview(null);}}/>
     <Button label="Cancel — keep my website as it is"
      onPress={()=>setReview(null)}/>
    </View>
   ):<Button label="Review matching typography"
     onPress={()=>setReview({...plan})}/>}
  </Card>;
}
export {WebsiteAppTypographyMatch};
