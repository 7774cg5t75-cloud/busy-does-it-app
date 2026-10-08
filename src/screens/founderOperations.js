import React from "react";
import {Text} from "react-native";
import {Shell,Card,Button,MetricRow} from "../components/ui";
import {styles} from "../theme/styles";

/** V3.69: no platform metrics are read except from server-authorised aggregates. */
const show=n=>Number.isSafeInteger(n)&&n>=0?n.toLocaleString("en-GB"):"Not measured";
function FounderOperations({s}){
  const owner=s.ownerSession?.userId||"";
  const [state,setState]=React.useState({owner:"",status:"idle",report:null,message:""});
  const nonce=React.useRef(0), current=React.useRef(owner),loader=React.useRef(s.fetchFounderOperations);
  current.current=owner;loader.current=s.fetchFounderOperations;
  const refresh=React.useCallback(async()=>{
    const id=++nonce.current;
    if(!owner){setState({owner,status:"signed_out",report:null,message:"Sign in first."});return;}
    setState({owner,status:"loading",report:null,message:""});
    try{
      const report=await loader.current();
      if(id!==nonce.current||current.current!==owner)return;
      if(report?.scope!=="platform_aggregate"||report?.privacy!=="aggregate_only")
        throw Error("Invalid aggregate response");
      setState({owner,status:"ready",report,message:""});
    }catch(e){
      if(id!==nonce.current||current.current!==owner)return;
      const denied=e?.status===403;
      setState({owner,status:denied?"denied":"unavailable",report:null,
        message:denied?"Founder access has not been enabled for this account. A verified administrator must grant the server-side role. No cross-business data was returned.":
        "Private reporting is unavailable. No figures have been guessed."});
    }
  },[owner]);
  React.useEffect(()=>{
    refresh();
    return ()=>{nonce.current+=1;};
  },[refresh]);
  const report=state.owner===owner&&state.status==="ready"?state.report:null;
  return <Shell s={s} title="Founder Operations"
    subtitle="Platform-wide aggregate status, restricted to a verified founder account."
    brandCue="V3.69 • server-authorised • read-only • no customer details">
    {!report?(
      <Card eyebrow="Founder access" title={state.status==="loading"?"Checking access…":
        state.status==="denied"?"Founder role not yet enabled":"Restricted dashboard"}
        body={state.message||"Only the server can approve platform-wide reporting. Ordinary BUSY customers cannot see this data."}
        tone={state.status==="denied"?"amber":"blue"}>
        <Button label="Verify founder access" primary
          disabled={state.status==="loading"||!owner} onPress={refresh}/>
      </Card>
    ):(
      <>
        <Card eyebrow="Platform workspace overview" title="BUSY operations"
          body="All numbers come from aggregated database counts; not one business's account. No other customer's records or personal details are displayed."
          footer={"Checked "+(report.checkedAt?new Date(report.checkedAt).toLocaleString("en-GB"):"Unknown")+". On-demand snapshot, not a live incident alert."}
          tone="blue">
          <MetricRow left="Workspaces (not paying subscribers)" right={show(report.metrics?.businessWorkspaces)}/>
          <MetricRow left="Business memberships" right={show(report.metrics?.businessMemberships)}/>
          <MetricRow left="Workspaces with updated snapshots (7d)" right={show(report.metrics?.activeWorkspaces7d)}/>
          <Button label="Refresh platform snapshot" onPress={refresh}/>
        </Card>
        <Card eyebrow="Incidents requiring oversight" title="Recorded failures and pending jobs"
          body="Counts are across the platform. They are not distinct customer incidents or proof that every affected system is offline."
          tone="blue">
          {(report.incidents||[]).map(row=><MetricRow key={row.key}
            left={row.title} right={show(row.count)}/>)}
        </Card>
        <Card eyebrow="Measured volumes" title="How much activity is recorded"
          body={report.usage?.note||"Usage counters are not invoices."}
          tone="blue">
          <MetricRow left="AI conversation request records, 30 days" right={show(report.usage?.aiRequestEvents30d)}/>
          <MetricRow left="Hosted website requests, 30 days" right={show(report.usage?.websiteRequests30d)}/>
          <Text style={styles.sectionLabel}>Incomplete source coverage is shown as unmeasured, never as zero.</Text>
        </Card>
        <Card eyebrow="£50/month commercial objective" title="Revenue and cost figures need real billing connections"
          body={report.commercial?.reason||"Subscription billing has not been connected."} tone="blue">
          <MetricRow left="Paying subscribers" right="Not connected"/>
          <MetricRow left="Monthly recurring revenue" right="Not connected"/>
          <MetricRow left="AI and cloud bills" right="Not connected"/>
          <MetricRow left="Profit or margin" right="Not connected"/>
        </Card>
        <Card eyebrow="Operations autonomy" title="Unattended monitoring remains separate"
          body={report.automation?.note||"No automatic platform-wide incident handling is active."} tone="blue"/>
        {(report.notes||[]).length?(
          <Card eyebrow="Reporting limitations" title="Coverage notes" body={report.notes.join(" ")} tone="blue"/>
        ):null}
      </>
    )}
    <Button label="Current business operations" onPress={()=>s.go("selfRunningOperations")}/>
    <Button label="Back to Production Bridge" onPress={()=>s.go("productionBridge")}/>
  </Shell>;
}
export {FounderOperations};
