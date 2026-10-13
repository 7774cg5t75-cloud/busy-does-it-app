import React from "react";
import {Text,View} from "react-native";
import {Card,Button} from "../components/ui";
import {styles} from "../theme/styles";
import {buildBusinessBrandDnaSnapshot,planBrandDnaContentBrief}
 from "../core/businessBrandDnaV3195.mjs";
import {SUPPORTED,prepareBrandedCopyPreview}
 from "../core/brandedContentDraftV3198.mjs";
import {reviewCrossChannelBrandContent} from "../core/brandCampaignReviewV3200.mjs";
import {reviewBuilderJourneyContinuity} from "../core/builderJourneyContinuityV3209.mjs";
import {reviewSharedRequestJourney} from "../core/sharedRequestJourneyV3212.mjs";

/**
 * A REAL owner-facing, zero-provider preview of reuse opportunities.
 * Never stores, publishes or silently changes a customer's work.
 */
function BusinessBrandDnaPreview({website,app,businessId,catalog=[]}){
 const [open,setOpen]=React.useState(false);
 const [channel,setChannel]=React.useState("social");
 const [copyDraft,setCopyDraft]=React.useState(null);
 const [campaignReview,setCampaignReview]=React.useState(null);
 const [showJourney,setShowJourney]=React.useState(false);
 const [showRequestReview,setShowRequestReview]=React.useState(false);
 const [requestKind,setRequestKind]=React.useState("enquiry");
 React.useEffect(()=>{
  setCopyDraft(null);setCampaignReview(null);setShowJourney(false);
  setShowRequestReview(false);
 },[businessId,website?.id,website?.generation,app?.id,app?.draft_revision,channel]);
 const journey=reviewBuilderJourneyContinuity({website,app,businessId});
 const requestReport=showRequestReview?reviewSharedRequestJourney({
  businessId,website,app,catalog,kind:requestKind
 }):null;
 const dna=buildBusinessBrandDnaSnapshot({website,app,businessId});
 if(!dna.ok)return null;
 const brief=planBrandDnaContentBrief(dna,{channel,
  goal:"Prepare owner-reviewed material using existing business branding"});
 return <Card eyebrow="Your business identity, reused"
  title="Business Brand DNA"
  body="Busy can use your existing website and Business App choices as a consistent starting point for future content, without making you explain your branding again."
  tone="blue">
   <Button label={open?"Hide my Brand DNA preview":"Preview what Busy knows about my brand"}
    onPress={()=>setOpen(v=>!v)}/>
   {open?<View>
    <Text style={styles.sectionLabel}>{dna.identity.name}</Text>
    {dna.identity.tagline?<Text style={styles.cardBody}>{dna.identity.tagline}</Text>:null}
    <Text style={styles.cardBody}>
     {"Colours: "+(dna.design.primaryColour||"not specified")+
      " • App typography: "+dna.design.appTypography+
      " • Website typography: "+(dna.design.websiteTypography||"not selected")}
    </Text>
    <Text style={styles.cardBody}>
     {"Known services: "+dna.services.length+
      " • Approved gallery photos: "+dna.assets.photos.length+
      " • Tone of voice: "+(dna.voice.ownerChosenTone||"not chosen yet")}
    </Text>
    {dna.conflicts.map((item,i)=><Text key={i} style={styles.cardBody}>
      {"Needs review: "+item}
    </Text>)}
    {journey.ok?<View>
       <Button label={showJourney?"Hide website and app journey review":
         "Check how my website and app work together"}
         onPress={()=>setShowJourney(value=>!value)}/>
       {showJourney?<View>
         <Text style={styles.cardBody}>{journey.summary}</Text>
         {journey.recommendations.map(item=>
           <Text key={item.id} style={styles.cardBody}>
             {"Review: "+item.text}
           </Text>)}
         <Button label={showRequestReview?
           "Hide customer request checks":"Check enquiry and booking journeys"}
           onPress={()=>setShowRequestReview(v=>!v)}/>
         {showRequestReview?<View>
           <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>
             <Button label={(requestKind==="enquiry"?"✓ ":"")+"Enquiries"}
               onPress={()=>setRequestKind("enquiry")}/>
             <Button label={(requestKind==="booking_request"?"✓ ":"")+"Booking requests"}
               onPress={()=>setRequestKind("booking_request")}/>
           </View>
           {requestReport?.ok?<View>
             <Text style={styles.cardBody}>{requestReport.summary}</Text>
             <Text style={styles.cardBody}>
               {"Website: "+requestReport.customerActions.website.replaceAll("_"," ")+
                " • App: "+requestReport.customerActions.app.replaceAll("_"," ")}
             </Text>
             {requestReport.gaps.slice(0,5).map(gap=>
               <Text key={gap} style={styles.cardBody}>
                 {"To verify: "+gap.replaceAll("_"," ")}
               </Text>)}
             {requestReport.gaps.length>5?<Text style={styles.cardBody}>
               {"Plus "+(requestReport.gaps.length-5)+" further release checks."}
             </Text>:null}
             {requestReport.responsive.appWidths.length?<Text style={styles.cardBody}>
               {"Static app layout rules checked at "+
                requestReport.responsive.appWidths.map(r=>r.logicalWidth+"pt").join(", ")+
                "; not real screenshots or device tests."}
             </Text>:null}
             <Text style={styles.cardBody}>
               A website Contact section is not a verified enquiry form.
               An app booking request is not a confirmed diary appointment.
             </Text>
           </View>:<Text style={styles.cardBody}>
             {requestReport?.reason||"Current private drafts and a verified module list are required."}
           </Text>}
         </View>:null}
         <Text style={styles.cardBody}>
           These are private draft checks, not proof of a real customer journey.
           Nothing is transferred, published, booked or sent.
         </Text>
       </View>:null}
     </View>:null}
     <Text style={styles.sectionLabel}>
     Prepare a consistent business identity across content
    </Text>
    <Button label="Review three branded content drafts together"
      onPress={()=>setCampaignReview(reviewCrossChannelBrandContent({
        businessId,website,app
      }))}/>
    {campaignReview?<View>
      {!campaignReview.ok?
        <Text style={styles.cardBody}>{campaignReview.reason}</Text>:
        <View>
          <Text style={styles.cardBody}>
            {"Prepared "+campaignReview.channelCount+
             " private drafts for "+campaignReview.businessName+
             ". Nothing has been posted or paid for."}
          </Text>
          {campaignReview.drafts.map(p=><View key={p.channel}>
            <Text style={styles.sectionLabel}>{p.channel.toUpperCase()+" — private copy"}</Text>
            <Text selectable style={styles.cardBody}>{p.text}</Text>
          </View>)}
          {campaignReview.checklist.filter(p=>p.status!=="static_pass").map(c=>
            <Text key={c.id} style={styles.cardBody}>
              {"Still to check: "+c.label}
            </Text>)}
          <Text style={styles.cardBody}>
            These are text drafts only. Check accuracy, images, rights and
            permission before creating or publishing a finished campaign.
          </Text>
        </View>}
    </View>:null}
    <Text style={styles.sectionLabel}>
     Example reuse briefs — previews only
    </Text>
    <View style={{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:8}}>
      {[["social","Social post"],["advert","Advert"],["poster","Poster"],
        ["video","Video"],["app","App"],["website","Website"]].map(([key,label])=>
         <Button key={key} label={(channel===key?"✓ ":"")+label}
           onPress={()=>setChannel(key)}/>
      )}
    </View>
    {brief.ok?<View>
     <Text style={styles.cardBody}>
      {"Selected format: "+brief.channel+
       " • Uses existing brand colour and "+brief.services.length+
       " owner-entered service(s), without adding unsupported facts."}
     </Text>
     {SUPPORTED.includes(channel)?<View>
      <Button label="Prepare a branded text draft for review"
       onPress={()=>setCopyDraft(prepareBrandedCopyPreview(
        buildBusinessBrandDnaSnapshot({website,app,businessId}),{channel}))}/>
      {copyDraft?<View>
       {copyDraft.ok?<View>
        <Text style={styles.sectionLabel}>Private branded draft — not posted</Text>
        <Text selectable style={styles.cardBody}>{copyDraft.copy}</Text>
        <Text style={styles.cardBody}>
         This uses your current approved draft facts. Check wording, accuracy,
         rights and advertising rules before using it anywhere.
        </Text>
       </View>:<Text style={styles.cardBody}>{copyDraft.reason}</Text>}
      </View>:null}
     </View>:<Text style={styles.cardBody}>
      This format has a brand brief only. No image, video or website has been
      created, and no provider has been contacted.
     </Text>}
     <Text style={styles.cardBody}>
      Nothing has been published. The business owner makes the final decision,
      and previously published material stays unchanged.
     </Text>
    </View>:null}
   </View>:null}
  </Card>;
}
export {BusinessBrandDnaPreview};
