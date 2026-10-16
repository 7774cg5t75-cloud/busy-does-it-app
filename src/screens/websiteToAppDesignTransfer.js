import {proposeCoordinatedAppChanges} from "../core/appCoordinatedStudio.mjs";
import {bindPrivateAppProposal} from "../core/privateAppEditSession.mjs";
import React from "react";
import {View,Text} from "react-native";
import {Card,Button} from "../components/ui";
import {styles} from "../theme/styles";
import {planWebsiteToAppDesign,confirmWebsiteToAppDesign}
 from "../core/websiteToAppBrandTransferV3196.mjs";

/** A source-bound proposal for the EXISTING encrypted App Studio lifecycle. */
function WebsiteToAppDesignTransfer({website,app,businessId,onPreview,busy}){
 const [open,setOpen]=React.useState(false);
 const [mode,setMode]=React.useState("adapt");
 const [includeDesign,setIncludeDesign]=React.useState(true);
 const [includeServices,setIncludeServices]=React.useState(false);
 const [includeContacts,setIncludeContacts]=React.useState(false);
 const [includePublicInformation,setIncludePublicInformation]=React.useState(false);
 const [fillDescriptions,setFillDescriptions]=React.useState(false);
 const live=React.useRef(null),alive=React.useRef(true);live.current={website,app,businessId};
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const [review,setReview]=React.useState(null);
 const [notice,setNotice]=React.useState("");
 React.useEffect(()=>{setReview(null);setNotice("");},[
  website?.id,website?.generation,app?.id,app?.draft_revision,businessId]);
 if(!website?.id||!app?.id||!businessId)return null;
 const preview=planWebsiteToAppDesign({
  website,app,businessId,mode,includeServices,fillDescriptions,includeDesign,includeContacts,includePublicInformation
 });
 return <Card eyebrow="Build faster with your existing website"
   title="Use my website's design for this app"
   body="Busy can adapt the website you already designed. Your Business App stays independent; you choose what changes."
   tone="blue">
   <Button label={open?"Hide design transfer":"See how Busy could reuse my website"}
    onPress={()=>{setOpen(v=>!v);setReview(null);setNotice("");}}/>
   {open?<View>
    <Button label={(includeDesign?"":"✓ ")+"Only reuse website services — keep my app design"}
      disabled={!!busy} onPress={()=>{setIncludeDesign(x=>!x);setIncludeServices(true);setMode("adapt");setReview(null);setNotice("");}}/>
    {includeDesign?<><Text style={styles.sectionLabel}>How closely should Busy match?</Text>
    <View style={{marginTop:8,gap:8}}>
     {[
      ["match","Match my website closely"],
      ["adapt","Keep my brand, adapt for an app"],
      ["new","Start fresh — keep this app independent"]
     ].map(([key,label])=><Button key={key}
       label={(mode===key?"✓ ":"")+label}
       onPress={()=>{setMode(key);setReview(null);setNotice("");}}/>)}
    </View>
    </>:<Text style={styles.cardBody}>Your app colours, typography, layout and navigation will stay exactly as they are.</Text>}
    {includeDesign&&mode!=="new"?<Button
     label={(includeServices?"✓ ":"")+"Also copy missing website services"}
     onPress={()=>{setIncludeServices(v=>!v);setReview(null);setNotice("");}}/>:null}
    {mode!=="new"?<Button label={(includeContacts?"✓ ":"")+"Fill missing app contact details from my website"}
      onPress={()=>{setIncludeContacts(x=>!x);setReview(null);setNotice("");}}/>:null}
    {mode!=="new"?<Button label={(includePublicInformation?'✓ ':'')+'Fill missing app FAQs and testimonials from my website'}
      disabled={!!busy} onPress={()=>{setIncludePublicInformation(x=>!x);setReview(null);setNotice('');}}/>:null}
    {includeServices?<Button label={(fillDescriptions?"✓ ":"")+"Fill only empty descriptions of matching services"}
      onPress={()=>{setFillDescriptions(x=>!x);setReview(null);}}/>:null}
    {mode==="new"?<Text style={styles.cardBody}>
      No changes are necessary. Continue designing this app however you like.
    </Text>:preview.ok?<View>
      <Text style={styles.cardBody}>
       {preview.changes.length+" proposed private changes. "+
        "Busy never changes your public website, published app, bookings or payments."}
      </Text>
      <Button label="Review my website-to-app design"
       onPress={()=>{setReview({...preview});setNotice("");}}/>
    </View>:<Text style={styles.cardBody}>{preview.reason}</Text>}
    {review?<View style={{marginTop:10}}>
      <Text style={styles.sectionLabel}>Review each change before approving</Text>
      {review.changes.map((change,index)=>
       <Text key={index} style={styles.cardBody}>{(index+1)+". "+change}</Text>)}
      {review.explanations?.map((description,index)=>
       <Text key={index} style={styles.cardBody}>{"Why: "+description}</Text>)}
      {review.skipped?.map((reason,index)=>
       <Text key={index} style={styles.cardBody}>{"Kept as-is: "+reason}</Text>)}
      <Text style={styles.cardBody}>
       This prepares an exact app comparison in Studio. Review, approve and undo there.
       Existing public versions remain unchanged.
      </Text>
      <Button primary disabled={!!busy}
       label={"Preview "+review.operations.length+" changes in App Studio"}
       onPress={()=>{
        if(!alive.current||live.current.website!==website||live.current.app!==app||live.current.businessId!==businessId){setNotice("The builders changed. Review their latest versions.");return;}
        const verified=confirmWebsiteToAppDesign({website,app,businessId,evidence:review});
        if(!verified.ok){setNotice(verified.reason);setReview(null);return;}
        const proposal=bindPrivateAppProposal(proposeCoordinatedAppChanges(app.draft_config,verified.operations),{businessId,app});
        if(proposal?.ok&&onPreview?.(proposal)){setNotice("Prepared in App Studio. Compare, then approve or discard. Nothing was saved.");setReview(null);}
        else setNotice("The current app could not prepare those changes. Review it again.");
       }}/>
      <Button label="Cancel — don't change my app"
       onPress={()=>{setReview(null);setNotice("Nothing was changed.");}}/>
    </View>:null}
    {notice?<Text style={styles.cardBody}>{notice}</Text>:null}
   </View>:null}
 </Card>;
}
export {WebsiteToAppDesignTransfer};
