import React from "react";
import {View,Text} from "react-native";
import {Card,Button} from "../components/ui";
import {styles} from "../theme/styles";
import {planWebsiteToAppDesign,confirmWebsiteToAppDesign}
 from "../core/websiteToAppBrandTransferV3196.mjs";

/** A real approved atomic save using the EXISTING trusted App Builder action. */
function WebsiteToAppDesignTransfer({website,app,businessId,onSave,busy}){
 const [open,setOpen]=React.useState(false);
 const [mode,setMode]=React.useState("adapt");
 const [includeServices,setIncludeServices]=React.useState(false);
 const [review,setReview]=React.useState(null);
 const [notice,setNotice]=React.useState("");
 React.useEffect(()=>{setReview(null);setNotice("");},[
  website?.id,website?.generation,app?.id,app?.draft_revision,businessId]);
 if(!website?.id||!app?.id||!businessId)return null;
 const preview=planWebsiteToAppDesign({
  website,app,businessId,mode,includeServices
 });
 return <Card eyebrow="Build faster with your existing website"
   title="Use my website's design for this app"
   body="Busy can adapt the website you already designed. Your Business App stays independent; you choose what changes."
   tone="blue">
   <Button label={open?"Hide design transfer":"See how Busy could reuse my website"}
    onPress={()=>{setOpen(v=>!v);setReview(null);setNotice("");}}/>
   {open?<View>
    <Text style={styles.sectionLabel}>How closely should Busy match?</Text>
    <View style={{marginTop:8,gap:8}}>
     {[
      ["match","Match my website closely"],
      ["adapt","Keep my brand, adapt for an app"],
      ["new","Start fresh — keep this app independent"]
     ].map(([key,label])=><Button key={key}
       label={(mode===key?"✓ ":"")+label}
       onPress={()=>{setMode(key);setReview(null);setNotice("");}}/>)}
    </View>
    {mode!=="new"?<Button
     label={(includeServices?"✓ ":"")+"Also copy missing website services"}
     onPress={()=>{setIncludeServices(v=>!v);setReview(null);setNotice("");}}/>:null}
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
       This only saves the private app draft in one server-verified revision.
       Existing public versions remain unchanged.
      </Text>
      <Button primary disabled={!!busy}
       label={"Approve "+review.operations.length+" private app changes"}
       onPress={async()=>{
        const verified=confirmWebsiteToAppDesign({website,app,businessId,evidence:review});
        if(!verified.ok){setNotice(verified.reason);setReview(null);return;}
        const result=await onSave?.({operations:verified.operations,
          appId:app.id,expectedRevision:app.draft_revision});
        if(result?.ok){setNotice("Applied to your private app. Review its new preview before publishing.");setReview(null);}
        else setNotice("The server could not verify the changes. Reopen the latest app and try again.");
       }}/>
      <Button label="Cancel — don't change my app"
       onPress={()=>{setReview(null);setNotice("Nothing was changed.");}}/>
    </View>:null}
    {notice?<Text style={styles.cardBody}>{notice}</Text>:null}
   </View>:null}
 </Card>;
}
export {WebsiteToAppDesignTransfer};
