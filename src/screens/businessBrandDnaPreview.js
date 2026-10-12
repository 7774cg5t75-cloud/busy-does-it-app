import React from "react";
import {Text,View} from "react-native";
import {Card,Button} from "../components/ui";
import {styles} from "../theme/styles";
import {buildBusinessBrandDnaSnapshot,planBrandDnaContentBrief}
 from "../core/businessBrandDnaV3195.mjs";

/**
 * A REAL owner-facing, zero-provider preview of reuse opportunities.
 * Never stores, publishes or silently changes a customer's work.
 */
function BusinessBrandDnaPreview({website,app,businessId}){
 const [open,setOpen]=React.useState(false);
 const [channel,setChannel]=React.useState("social");
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
     <Text style={styles.cardBody}>
      No content has been generated or published. Owner approval is required
      before any output is reused. Previously published material stays unchanged.
     </Text>
    </View>:null}
   </View>:null}
  </Card>;
}
export {BusinessBrandDnaPreview};
