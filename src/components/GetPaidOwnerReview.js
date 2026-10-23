import React,{useEffect,useState} from "react";
import {Text,View} from "react-native";
import {Card,Field,Button} from "./ui";
import {styles} from "../theme/styles";
import {
  prepareGetPaidQuoteDraft,reviewGetPaidNextStep
} from "../core/getPaidIntelligenceV3183.mjs";

/**
 * Extracted from the large Work screen: one private, approval-only Get Paid
 * assistant. No network calls, autonomous sends, invoices or payment requests.
 */
export default function GetPaidOwnerReview({s,customer,saved,type,bookingStatus="",todayISO=""}){
  const [quoteBrief,setQuoteBrief]=useState("");
  useEffect(()=>{setQuoteBrief("");},[customer?.id]);
  const businessId=s.cloudWorkspace?.businessId||"";
  const owned=!!businessId&&Array.isArray(s.customers)&&
    s.customers.some(item=>item?.id===customer?.id&&
      (!item.business_id||item.business_id===businessId));
  if(type!=="quote"&&type!=="booking")return null;
  const outcome=reviewGetPaidNextStep({
    businessId,customer,action:{...saved,type},
    todayISO,
    ownerCustomerVerified:owned
  });
  const draft=type==="quote"&&quoteBrief.trim()?prepareGetPaidQuoteDraft({
    businessId,customer,brief:quoteBrief,
    currentAmount:s.actionQuoteAmount,
    ownerCustomerVerified:owned
  }):null;
  if(!owned)return <Card
    eyebrow="Get Paid • private review"
    title="Open a saved business customer"
    body="Busy needs a customer record in this business before preparing financial suggestions."
    tone="blue"/>;
  return <>
    {type==="quote"?<>
      <Card eyebrow="Get Paid • draft only"
        title="Ask Busy to prepare a quote"
        body="Type or use the keyboard microphone to describe the agreed job and price. Busy prepares an editable suggestion; she won't send it or take payment."
        tone="blue"/>
      <View style={styles.workspacePanel}>
      <Text accessibilityRole="header" style={styles.workspacePanelTitle}>Your job and price</Text>
      <Field label="Describe the quote (private)"
        value={quoteBrief} onChangeText={setQuoteBrief}
        multiline
        placeholder="e.g. Repair a tap for £125, materials included"/>
      </View>
      {quoteBrief.trim()?(draft?.ok?<>
        <Card eyebrow="Owner review • not sent"
          title={"Proposed quote: £"+draft.amountDisplay}
          body={draft.message}
          footer={draft.vatNote+" • "+draft.reviewChecks.join(" ")}
          tone="blue"/>
        <Button primary label="Use this editable quote" onPress={()=>{
          s.setActionQuoteAmount(draft.amountDisplay);
          s.setActionQuoteMessage(draft.message);
          setQuoteBrief("");
        }}/>
      </>:<Text style={styles.cardBody}>{draft?.reason||"Check the quote."}</Text>):null}
    </>:null}
    {outcome.ok&&saved.done&&
      (type==="quote"||(type==="booking"&&bookingStatus==="Completed"))?
      <Card eyebrow={type==="quote"?"Busy's next suggestion":"Get Paid • after the job"}
        title={outcome.next} body={outcome.why}
        footer="Owner review only • no invoice or payment verified"
        tone="blue"/>:null}
  </>;
}
