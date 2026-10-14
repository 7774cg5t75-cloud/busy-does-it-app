import React from "react";
import {Text,TextInput,View} from "react-native";
import {Card,Button,Field} from "../components/ui";
import {styles} from "../theme/styles";
import {planPrivateWebsiteFormApprovalV3217,
 comparePrivateApprovalReviewV3217}
 from "../core/websiteFormApprovalV3217.mjs";
import {reviewCustomerFormResponsiveV3217}
 from "../core/customerFormResponsiveV3217.mjs";

/** Optional private proposal only. Explicitly does NOT save or approve a form. */
function WebsiteFormSpecReviewV3217({businessId="",website=null,
 publishing=null,kind="enquiry"}){
 const [open,setOpen]=React.useState(false);
 const [notice,setNotice]=React.useState("");
 const [purpose,setPurpose]=React.useState("");
 const [days,setDays]=React.useState("90");
 const [snapshot,setSnapshot]=React.useState(null);
 const [noticeMessage,setNoticeMessage]=React.useState("");
 React.useEffect(()=>{
  setOpen(false);setNotice("");setPurpose("");setDays("90");
  setSnapshot(null);setNoticeMessage("");
 },[businessId,website?.id,website?.generation,kind]);
 const args={businessId,website,publishing,kind,notice,purpose,
  retentionDays:/^\d{1,3}$/.test(days)?Number(days):null,
  services:kind==="booking_request"?
   (website?.sections||[]).filter(x=>x?.id==="services")
    .flatMap(x=>Array.isArray(x.items)?x.items:[])
    .map(x=>String(x?.title||"").trim()).filter(Boolean).slice(0,50):[]};
 const current=planPrivateWebsiteFormApprovalV3217(args);
 const responsive=reviewCustomerFormResponsiveV3217({form:current});
 const matching=snapshot?comparePrivateApprovalReviewV3217({
  prepared:snapshot,current}):null;
 const update=(setter)=>(value)=>{
  setter(value);setSnapshot(null);setNoticeMessage("");
 };
 return <View>
  <Button label={open?"Hide private form specification":
    "Prepare my own website form (not live)"}
   onPress={()=>{setOpen(x=>!x);setSnapshot(null);setNoticeMessage("");}}/>
  {open?<Card eyebrow="V3.217 • Private preparation"
   title="Plan an enquiry form for your website"
   body="BUSY can help define a future form. This does not collect customer information, save a privacy agreement or activate a public form."
   footer="No form or privacy notice is published. Owner and legal review remain required."
   tone="blue">
    <Field label="Why will you use customer information?"
     placeholder="For example: Respond to customer enquiries about our services"
     value={purpose} onChangeText={update(setPurpose)}/>
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>
        Your proposed privacy notice (review before using)
      </Text>
      <View style={styles.fieldBox}>
        <TextInput value={notice} onChangeText={update(setNotice)}
          placeholder="Explain how you will use and keep enquiry details"
          placeholderTextColor="#9AA3B2" multiline
          accessibilityLabel="Proposed privacy notice"
          style={[styles.fieldInput,{minHeight:96,textAlignVertical:"top"}]}/>
      </View>
    </View>
    <Field label="Proposed retention (days, 1–730)"
     placeholder="90"
     value={days} keyboardType="number-pad" autoCapitalize="none"
     onChangeText={update(setDays)}/>
    <Text style={styles.cardBody}>
      {"Fields: "+(current.fieldKeys||[]).join(", ")+
       ". Customers must provide a contact method; unneeded fields should be removed before approval."}
    </Text>
    <Text style={styles.cardBody}>
      {"Prerequisites remaining: "+(current.additionalPrerequisites||[]).join(", ")}
    </Text>
    {responsive.ok?<Text style={styles.cardBody}>
      {"Estimated layouts: "+responsive.layouts.map(x=>x.id+
        " "+x.columns+" column"+(x.columns===1?"":"s")).join(" • ")+
       ". Each input needs a visible label, keyboard access and a "+
       responsive.minimumTouchTarget+"px tap area. Screenshots and accessibility tests are still required."}
    </Text>:null}
    <Button label="Review this private form proposal"
     onPress={()=>{setSnapshot(current.ok?current:null);
      setNoticeMessage(current.ok?"Review prepared locally. Nothing has been stored or approved.":current.reason);}}/>
    {snapshot?<View>
      <Text style={styles.cardBody}>{snapshot.explanation}</Text>
      <Text style={styles.cardBody}>
        {"Revision "+snapshot.websiteGeneration+
         (snapshot.liveDeploymentCandidateId?
           " • exact live deployment recorded in current owner view":
           " • current live deployment not verified")}
      </Text>
      <Button label="Check that my proposal is still unchanged"
        onPress={()=>setNoticeMessage(matching?.ok?
         "Proposal unchanged locally. A future server-side approval and staging test are still required.":
         "Business, website or proposed fields changed. Review the latest proposal again.")}/>
    </View>:null}
    {noticeMessage?<Text style={styles.cardBody}>{noticeMessage}</Text>:null}
  </Card>:null}
 </View>;
}
export {WebsiteFormSpecReviewV3217};
