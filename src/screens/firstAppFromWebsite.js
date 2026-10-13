import React from "react";
import {Text,View} from "react-native";
import {Card,Button} from "../components/ui";
import {styles} from "../theme/styles";
import {prepareFirstAppFromWebsite,confirmFirstAppFromWebsite}
 from "../core/firstAppFromWebsiteV3197.mjs";
import {recommendOwnerBusinessApp} from "../core/ownerAppOpportunityV3197.mjs";

/** No app required up front. An explicit approval creates only a private
 * draft through the existing authenticated Edge build_draft action. */
function FirstAppFromWebsite({website,app,businessId,businessType,
 services=[],onCreate,onCheckBenefit,busy}){
 const [open,setOpen]=React.useState(false);
 const [mode,setMode]=React.useState("adapt");
 const [review,setReview]=React.useState(null);
 const [working,setWorking]=React.useState(false);
 const [notice,setNotice]=React.useState("");
 const [benefit,setBenefit]=React.useState(null);
 const [checking,setChecking]=React.useState(false);
 React.useEffect(()=>{
  setReview(null);setNotice("");setBenefit(null);setOpen(false);
 },[businessId,website?.id,website?.generation,app?.id]);
 if(!website?.id||app||!businessId)return null;
 const plan=prepareFirstAppFromWebsite({website,app,businessId,mode});
 const opportunity=recommendOwnerBusinessApp({businessId,website,app,
  businessType,services,entitlement:benefit});
 return <Card eyebrow="Reuse your existing website"
  title="Create my first Business App from this website"
  body="Busy can prepare a real private app using your website's reviewed business facts. Choose how closely to match its design before anything is saved."
  tone="blue">
  {opportunity.show?<Text style={styles.cardBody}>
   {"Why this might help: "+opportunity.reason}
  </Text>:null}
  <Button label={open?"Hide my app preparation":"Prepare an app from my website"}
   onPress={()=>{setOpen(v=>!v);setReview(null);setNotice("");}}/>
  {open?<View>
   {[
    ["adapt","Keep my brand, adapt for an app"],
    ["match","Keep the website design as closely as possible"],
    ["new","Start a completely different design"]
   ].map(([key,label])=><Button key={key}
    label={(mode===key?"✓ ":"")+label}
    onPress={()=>{setMode(key);setReview(null);setNotice("");}}/>)}
   {plan.ok&&mode!=="new"?<View>
    <Text style={styles.cardBody}>
     {"Private preview: "+plan.changes.length+" proposed preparation steps. "+
       plan.serviceCount+" website services can be reused."}
    </Text>
    <Button label="Review what Busy will reuse"
      disabled={working||!!busy}
      onPress={()=>{setReview({...plan});setNotice("");}}/>
   </View>:<Text style={styles.cardBody}>
     {mode==="new"?
      "Continue with the normal Business App builder for a fresh design.":
      plan.reason}
   </Text>}
   {review?<View>
    <Text style={styles.sectionLabel}>Review before creating anything</Text>
    {review.changes.map((item,i)=><Text key={i} style={styles.cardBody}>
      {(i+1)+". "+item}
    </Text>)}
    <Text style={styles.cardBody}>
     {"Business: "+review.profileDraft.businessName}
    </Text>
    {review.profileDraft.services.map((item,i)=><Text key={i}
      style={styles.cardBody}>{item.name+" — "+item.description}</Text>)}
    <Text style={styles.cardBody}>
     No website images, private contacts or customers are copied. A
     standalone downloadable app is a separate process; no app is published
     and no provider charge is authorised here.
    </Text>
    <Button primary disabled={!!busy||working}
      label={working?"Preparing private app…":"Approve and create my PRIVATE app draft"}
      onPress={async()=>{
       const current=confirmFirstAppFromWebsite({
        website,app,businessId,evidence:review});
       if(!current.ok){setReview(null);setNotice(current.reason);return;}
       setWorking(true);
       try{
        const result=await onCreate?.(current);
        if(result?.ok===true){
          setReview(null);
          setNotice(result.appearanceApplied===false?
           "Your private app draft was created, but not every design change was saved. Check the current app before publishing.":
           "Your private Business App is ready for review. Nothing was published.");
        }else{
          setReview(null);
          setNotice(result?.reason||
            "Busy could not verify the first app draft. Check its latest status before retrying.");
        }
       }catch{setNotice("Please check the latest private app status before trying again.");setReview(null);}
       finally{setWorking(false);}
      }}/>
    <Button label="Cancel, keep the website only"
      onPress={()=>{setReview(null);setNotice("");}}/>
   </View>:null}
   <Text style={styles.cardBody}>
    {opportunity.entitlementText}
   </Text>
   <Button label={checking?"Checking provider benefit…":"Check if a standalone app is included"}
    disabled={checking||working}
    onPress={async()=>{
      setChecking(true);
      try{
       const result=await onCheckBenefit?.();
       setBenefit(result?.businessId===businessId?result:null);
       if(!result?.verified)setNotice("No verified included standalone benefit was found. This doesn't stop you creating a private app draft.");
       else setNotice("Subscription benefit checked. Any store and distribution costs still need separate approval.");
      }catch{setNotice("Subscription verification is unavailable. No included benefit has been assumed.");}
      finally{setChecking(false);}
    }}/>
   {benefit?.verified===true&&benefit?.eligible===true?
    <Text style={styles.cardBody}>
      A provider-verified creation allowance is available for this business
      this period. App-store accounts and distribution may cost extra.
    </Text>:null}
  </View>:null}
  {!!notice?<Text style={styles.cardBody}>{notice}</Text>:null}
 </Card>;
}
export {FirstAppFromWebsite};
