import {reviewedPairIsCurrent} from '../core/ownerBuilderDraftGuardV3195.mjs';
import React from "react";
import {View,Text} from "react-native";
import {Card,Button} from "../components/ui";
import {styles} from "../theme/styles";
import {planAppToWebsiteDesign,confirmAppToWebsiteDesign}
 from "../core/appToWebsiteBrandTransferV3196.mjs";

function AppToWebsiteDesignTransfer({website,app,businessId,onApply}){
 const [open,setOpen]=React.useState(false);
 const [mode,setMode]=React.useState("adapt");
 const [withServices,setWithServices]=React.useState(false);
 const [includeDesign,setIncludeDesign]=React.useState(true),[includePublicInformation,setIncludePublicInformation]=React.useState(false);
 const [includeMissingAnswers,setIncludeMissingAnswers]=React.useState(false);
 const [review,setReview]=React.useState(null);
 const [notice,setNotice]=React.useState("");
 const live=React.useRef(null);live.current={website,app,businessId};
 React.useEffect(()=>{setReview(null);setNotice("");},
  [website?.id,website?.generation,app?.id,app?.draft_revision,businessId]);
 if(!website?.id||!app?.id||!businessId)return null;
 if(review&&!reviewedPairIsCurrent(website,app,businessId,review,{appId:'sourceAppId',appRevision:'sourceAppRevision',websiteId:'targetWebsiteId',websiteRevision:'targetWebsiteGeneration'}))return <Card title="Review updated builder drafts" body="The source or destination changed. No old proposal was applied."><Button label="Review current design choices" onPress={()=>setReview(null)}/></Card>;
 const plan=planAppToWebsiteDesign({website,app,businessId,
  mode,includeServices:withServices,includeDesign,includePublicInformation,includeMissingAnswers});
 return <Card eyebrow="Make your website feel like your app"
  title="Reuse my Business App's design"
  body="Carry across selected design choices as one private website edit. Never automatically overwrite your existing website or publish changes."
  tone="blue">
  <Button label={open?"Hide design choices":"Explore app-to-website transfer"}
   onPress={()=>{setOpen(v=>!v);setReview(null);}}/>
  {open?<View style={{gap:7}}>
    {[
     ["match","Match the app's style closely"],
     ["adapt","Keep my brand, adapt for a website"],
     ["new","Keep a completely different website design"]
    ].map(([key,label])=><Button key={key}
      label={(mode===key?"✓ ":"")+label}
      onPress={()=>{setMode(key);setReview(null);setNotice("");}}/>)}
    {mode!=="new"?<>
     <Button label={(includeDesign?'':'✓ ')+'Reuse content only — keep my website design'} onPress={()=>{setIncludeDesign(x=>!x);setReview(null);}}/>
     <Button label={(includePublicInformation?'✓ ':'')+'Create missing FAQ and testimonial sections from my app'} onPress={()=>{setIncludePublicInformation(x=>!x);setReview(null);}}/>
    </>:null}
    {mode!=="new"?<Button
     label={(withServices?"✓ ":"")+"Also add missing app services"}
     onPress={()=>{setWithServices(x=>!x);setReview(null);setNotice("");}}/>:null}
    {mode==="new"?<Text style={styles.cardBody}>
     Your website and Business App can have completely different designs.
     Nothing needs changing.
    </Text>:plan.ok?<Button label="Review exact website changes"
     onPress={()=>{setReview({...plan});setNotice("");}}/>:
     <Text style={styles.cardBody}>{plan.reason}</Text>}
    {includePublicInformation&&mode!=="new"?<Button label={(includeMissingAnswers?'✓ ':'')+'Also add missing answers to an existing FAQ — keep my wording'} onPress={()=>{setIncludeMissingAnswers(x=>!x);setReview(null);setNotice('');}}/>:null}
    {review?<View style={{gap:5}}>
     <Text style={styles.sectionLabel}>Everything that will change</Text>
     {review.changes.map((line,i)=><Text key={i} style={styles.cardBody}>
       {(i+1)+". "+line}
     </Text>)}
     {review.explanations?.map((line,i)=><Text key={i} style={styles.cardBody}>
       {"Why: "+line}
     </Text>)}
     {review.skipped?.map((line,i)=><Text key={i} style={styles.cardBody}>
       {"Left unchanged: "+line}
     </Text>)}
     <Text style={styles.cardBody}>
      Existing website wording and customer records will be preserved.
      The new website draft stays private and can be undone.
     </Text>
     <Button primary label="Approve this PRIVATE website change"
      onPress={()=>{
       if(live.current.website!==website||live.current.app!==app||live.current.businessId!==businessId){setReview(null);return;}
       const check=confirmAppToWebsiteDesign({website,app,businessId,evidence:review});
       if(!check.ok){setNotice(check.reason);setReview(null);return;}
       const applied=onApply?.(review);
       if(applied===true){setNotice("Website draft updated. Nothing was published.");setReview(null);}
       else {setNotice("Website has changed. Review the latest draft.");setReview(null);}
      }}/>
     <Button label="Cancel — leave my website unchanged"
      onPress={()=>{setReview(null);setNotice("No change was applied.");}}/>
    </View>:null}
    {notice?<Text style={styles.cardBody}>{notice}</Text>:null}
  </View>:null}
 </Card>;
}
export {AppToWebsiteDesignTransfer};
