import React from "react";
import {Text} from "react-native";
import {Shell,Card,Button,MetricRow} from "../components/ui";
import {styles} from "../theme/styles";
import {loadVerifiedActivity} from "../domain/verifiedBusinessActivityCloud.mjs";
import {buildVerifiedActivity,resultBrief} from "../domain/verifiedBusinessActivity.mjs";

const NAMES={website:"Website hosting",business_app:"Customer Business App",social:"Social media"};
const TYPES={provider_recorded:"Provider-recorded result",unverified:"Unverified",failed:"Needs attention",
  prepared:"Private preview",scheduled:"Scheduled, not published"};
function BusinessActivityCentre({s}){
  const userId=s.ownerSession?.userId||"";
  const businessId=s.cloudWorkspace?.businessId||"";
  const scope=userId+":"+businessId;
  const [state,setState]=React.useState({scope:"",busy:false,results:{},error:"",checkedAt:""});
  const nonce=React.useRef(0);
  const currentScope=React.useRef(scope);
  const argsRef=React.useRef(s.growthProjectCloudArgs);
  currentScope.current=scope;
  argsRef.current=s.growthProjectCloudArgs;
  const refresh=React.useCallback(async()=>{
    const request=++nonce.current;
    if(!userId||!businessId){
      setState({scope,busy:false,results:{},error:"Sign in first.",checkedAt:""});
      return;
    }
    setState({scope,busy:true,results:{},error:"",checkedAt:""});
    try{
      const args=await argsRef.current();
      if(currentScope.current!==scope||nonce.current!==request||
        args.userId!==userId||args.businessId!==businessId)return;
      const results=await loadVerifiedActivity(args);
      if(currentScope.current!==scope||nonce.current!==request)return;
      setState({scope,busy:false,results,checkedAt:new Date().toISOString(),error:""});
    }catch(error){
      if(currentScope.current!==scope||nonce.current!==request)return;
      setState({scope,busy:false,results:{},checkedAt:"",error:"Could not authenticate private reporting: "+String(error?.message||"Unavailable")});
    }
  },[scope,userId,businessId]);
  React.useEffect(()=>{
    setState({scope:"",busy:false,results:{},error:"",checkedAt:""});
    refresh();
    return ()=>{nonce.current+=1;};
  },[refresh]);
  const scoped=state.scope===scope&&!state.busy;
  const activity=buildVerifiedActivity({businessId,userId,
    results:scoped?state.results:{},asOf:scoped?state.checkedAt:""});
  const openSource=source=>{
    if(source==="website")s.openWebsitePublishing();
    else if(source==="business_app")s.openMiniAppBuilder();
    else s.openSocialCentre();
  };
  return <Shell s={s} title="BUSY Verified Business Activity"
      subtitle="One read-only place to see what each publishing system actually recorded."
      brandCue="V3.67 • no publishing, no invented successes, no automatic retries">
    <Card eyebrow="What BUSY could verify"
      title={state.busy?"Checking existing systems…":activity.state==="checked"?"Three reporting systems checked":
        activity.state==="partial"?"Some results available":"Verification unavailable"}
      body={state.error||resultBrief(activity)}
      footer={"Last checked: "+(scoped&&state.checkedAt?new Date(state.checkedAt).toLocaleString("en-GB"):"Not yet")+
        ". No independent public URL checks were made."}
      tone={activity.failed||activity.state!=="checked"?"amber":"blue"}>
      <MetricRow left="Provider-recorded publication/live results" right={String(scoped?activity.verified:0)}/>
      <MetricRow left="Recorded failures needing attention" right={String(scoped?activity.failed:0)}/>
      <Button label={state.busy?"Checking…":"Refresh verified activity"}
        disabled={state.busy||!userId||!businessId} primary onPress={refresh}/>
    </Card>
    <Card eyebrow="Connected reporting systems"
      title="Know what has and hasn't been checked"
      body="Each source is checked separately. A missing or failed request does not prove a website, app or social post succeeded or failed."
      tone="blue">
      {Object.keys(NAMES).map(source=><MetricRow key={source}
        left={NAMES[source]} right={scoped&&activity.availability[source]==="checked"?"Response received":"Not verified"}/>)}
    </Card>
    <Card eyebrow="Business activity timeline"
      title={activity.events.length+" recorded event"+(activity.events.length===1?"":"s")}
      body="Business-wide source records; these events are not automatically linked to any specific service-growth project."
      footer="Social successes require a destination-specific provider identifier plus a publication timestamp. A queued or scheduled item alone is not published."
      tone="blue">
      {scoped && activity.events.length?activity.events.slice(0,25).map((event,index)=>
        <Card key={event.id+":"+index}
          eyebrow={NAMES[event.source]+" • "+TYPES[event.kind]}
          title={event.title}
          body={event.description}
          footer={(event.occurredAt?new Date(event.occurredAt).toLocaleString("en-GB"):"Date not recorded")+
            (event.evidence?" • "+event.evidence:"")}
          tone={event.kind==="failed"?"amber":event.kind==="provider_recorded"?"green":"blue"}>
          <Button label={"Inspect in "+NAMES[event.source]} onPress={()=>openSource(event.source)}/>
        </Card>
      ):<Text style={styles.sectionLabel}>{state.busy?"Checking source records…":
        "No qualifying activity was recorded in the available responses. This does not mean nothing has happened."}</Text>}
    </Card>
    <Card eyebrow="Low-maintenance operations"
      title="Let BUSY triage your exceptions"
      body="View read-only health checks, guided recovery and source-specific failures. BUSY groups repeated issues and keeps uncertain reporting separate from confirmed outages."
      tone="blue">
      <Button label="Open Operations & Reliability" onPress={()=>s.go("selfRunningOperations")}/>
    </Card>
    <Card eyebrow="Safe recovery"
      title="Failed destinations remain separate"
      body="If Facebook succeeds but Instagram fails, the timeline keeps both outcomes distinct. Open the original social item and use its existing retry-only-failed-channels controls after owner review."
      footer="BUSY never retries failed posts automatically from this screen."
      tone="blue">
      <Button label="Open Social Media Centre" onPress={s.openSocialCentre}/>
      <Button label="Open Website Publishing" onPress={s.openWebsitePublishing}/>
      <Button label="Open Business App" onPress={s.openMiniAppBuilder}/>
    </Card>
  </Shell>;
}
export {BusinessActivityCentre};
