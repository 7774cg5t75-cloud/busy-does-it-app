import React from "react";
import {Text} from "react-native";
import {Shell,Card,Button,MetricRow} from "../components/ui";
import {styles} from "../theme/styles";
import {FounderServiceCosts} from "./founderServiceCosts";
import {founderOperationalPriorities} from "../core/founderOperationalPriorities.mjs";
import {websiteReleaseReadiness} from "../core/websiteReleaseReadiness.mjs";
import {websitePilotReadiness} from "../core/websitePilotReadiness.mjs";
import {websiteStagingReadiness} from "../core/websiteStagingReadiness.mjs";
import {founderNextSafeAction} from "../core/founderNextSafeAction.mjs";
import {founderRehearsalGuidance} from "../core/founderRehearsalGuidance.mjs";
import {founderRecoveryReview} from "../core/founderRecoveryReview.mjs";
import {founderSafeAutomationSummary} from "../core/founderSafeAutomationSummary.mjs";
import {founderPrioritySummary} from "../core/founderPrioritySummary.mjs";

/** V3.69: no platform metrics are read except from server-authorised aggregates. */
const show=n=>Number.isSafeInteger(n)&&n>=0?n.toLocaleString("en-GB"):"Not measured";
function FounderOperations({s}){
  const owner=s.ownerSession?.userId||"";
  const [state,setState]=React.useState({owner:"",status:"idle",report:null,message:""});
  const [ackBusy,setAckBusy]=React.useState("");
  const [showOperatingEvidence,setShowOperatingEvidence]=React.useState(false);
  const [ackError,setAckError]=React.useState("");
  const [reality,setReality]=React.useState({owner:"",status:"idle",data:null});
  const realityNonce=React.useRef(0);
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
  React.useEffect(()=>{
    setAckBusy("");setAckError("");
  },[owner]);
  React.useEffect(()=>{
    realityNonce.current+=1;
    setReality({owner,status:"idle",data:null});
  },[owner]);
  const acknowledge=async item=>{
    if(!owner||ackBusy||item.status!=="open"||item.acknowledgedAt)return;
    const requestedOwner=owner;
    setAckError("");setAckBusy(item.key);
    try{
      await s.acknowledgeFounderAlert(item.key,item.transition);
      if(current.current===requestedOwner)await refresh();
    }catch(e){
      if(current.current===requestedOwner)
        setAckError(e?.message||"Could not confirm acknowledgement. Refresh and retry.");
    }finally{
      if(current.current===requestedOwner)setAckBusy("");
    }
  };
  const verifyExternal=async()=>{
    if(!owner||reality.status==="loading")return;
    const requestedOwner=owner,nonce=++realityNonce.current;
    setReality({owner,status:"loading",data:null});
    try{
      const data=await s.fetchExternalReality();
      if(current.current!==requestedOwner||realityNonce.current!==nonce)return;
      if(data?.scope!=="founder_aggregate_sample"||data?.automaticRetryAllowed!==false)
        throw Error("Invalid external verification evidence");
      setReality({owner,status:"ready",data});
    }catch(e){
      if(current.current===requestedOwner&&realityNonce.current===nonce)
        setReality({owner,status:e?.status===429?"rate_limited":"unavailable",data:null});
    }
  };
  const report=state.owner===owner&&state.status==="ready"?state.report:null;
  const operational=founderOperationalPriorities(report,{nowISO:new Date().toISOString()});
  const safeAction=founderNextSafeAction(operational);
  const release=websiteReleaseReadiness();
  const pilot=websitePilotReadiness();
  const staged=websiteStagingReadiness();
  const rehearsal=founderRehearsalGuidance({priorities:operational,pilot,release});
  const incidentReview=founderRecoveryReview({priorities:operational,rehearsal});
  const safeAutomation=founderSafeAutomationSummary({priorities:operational});
  const nextPriority=founderPrioritySummary({priorities:operational,
    incidentReview,safeAutomation});

  return <Shell s={s} title="Founder Operations"
    subtitle="Platform-wide aggregate status, restricted to a verified founder account."
    brandCue="V3.81 • founder subscriptions • usage & renewal control">
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

        <Card eyebrow="Operational priorities"
          title={operational.headline}
          body="BUSY highlights verifiable problem counts and gaps in monitoring. These are on-demand founder checks, not automatically delivered alerts or repairs."
          tone={operational.highPriorityCount>0?"amber":"blue"}>
          <MetricRow left="Recorded problem categories"
            right={show(nextPriority.count)}/>
          <Text style={styles.sectionLabel}>{nextPriority.title}</Text>
          <Text style={styles.cardBody}>{nextPriority.explanation}</Text>
          <Button label={showOperatingEvidence?"Hide why BUSY suggests this":"Why is this my next priority?"}
            onPress={()=>setShowOperatingEvidence(v=>!v)}/>
          {showOperatingEvidence?(
            <>
              {operational.items.slice(0,4).map(item=>(
                <React.Fragment key={item.key}>
                  <MetricRow left={item.title}
                    right={item.count===null?"Unknown":show(item.count)}/>
                  <Text style={styles.sectionLabel}>{item.next}</Text>
                </React.Fragment>
              ))}
              <Text style={styles.sectionLabel}>
                {"Alternative next check: "+safeAction.title+". "+safeAction.message}
              </Text>
              <Text style={styles.sectionLabel}>{"Recovery evidence: "+incidentReview.next}</Text>
              <Text style={styles.sectionLabel}>{safeAutomation.next}</Text>
            </>
          ):null}
          <MetricRow left="Automatic repairs" right="Disabled"/>
        </Card>
        <Card eyebrow="Safe pilot preparation"
          title="Closed test — checks needed"
          body="Before BUSY touches real customer information, we need an isolated sandbox, owner approval, tested tenant isolation, fictional data, rollback and a dry run with no paid or live actions."
          footer="This is a readiness plan. No sandbox or real test has been launched."
          tone="blue">
          <MetricRow left="Verified pilot safety checks"
            right={show(pilot.passed)+" of "+show(pilot.total)}/>
          <Text style={styles.sectionLabel}>{"Next verification: "+pilot.next}</Text>
          <Text style={styles.sectionLabel}>
            {"Recommended preparation: "+rehearsal.next}
          </Text>
          <MetricRow left="Automatic customer pilot" right="Disabled"/>
        </Card>
        <Card eyebrow="Controlled cloud rehearsal"
          title="Real Supabase staging — not yet verified"
          body="Before trying a genuine cloud customer journey, BUSY needs an isolated project, separate fictional owners, tested database access rules, rollback and founder approval. Browser simulations do not satisfy these checks."
          tone="blue">
          <MetricRow left="Independently verified staging checks"
            right={show(staged.passed)+" of "+show(staged.total)}/>
          <Text style={styles.sectionLabel}>{"Next: "+staged.next}</Text>
          <MetricRow left="Production credentials or writes" right="Not authorised"/>
        </Card>
        <Card eyebrow="Pre-release audit"
          title="Release readiness needs independent checks"
          body="The master release checklist requires verified security, customer journeys, regional foundations and manual approval. A passing source-code build is not a production readiness certificate."
          tone="blue">
          <MetricRow left="Verified release gates"
            right={show(release.passed)+" of "+show(release.total)}/>
          <Text style={styles.sectionLabel}>{release.message}</Text>
          <MetricRow left="Automatic production deployment" right="Disabled"/>
        </Card>
        <FounderServiceCosts s={s} owner={owner} enabled={!!report}/>
        <Card eyebrow="V3.72 • Operational confidence"
          title={report.reliability?.headline||"Monitoring evidence unavailable"}
          body={report.reliability?.note||
            "No verified monitor or alert information is available. BUSY will not assume that the platform is healthy."}
          tone={report.reliability?.status==="monitoring"?"blue":"amber"}>
          <MetricRow left="Incident-monitor evidence"
            right={report.reliability?.monitoringIsVerified?"Current":"Needs review"}/>
          <MetricRow left="Private alert inbox"
            right={report.reliability?.alertInboxIsVerified?"Verified":"Not verified"}/>
          <MetricRow left="Automatic external repairs" right="Disabled"/>
          <MetricRow left="Automatic push/email alerts" right="Disabled"/>
        </Card>
        <Card eyebrow="V3.76 • Evidence & Intelligence"
          title={report.evidenceHistory?.status==="available"?
            "Historical verification trends":"Historical evidence unavailable"}
          body="BUSY retains only aggregated checks for up to 30 days, and compares recent samples without storing customers' website addresses, posts or personal information. Repeated observations may reflect the same underlying record."
          tone={report.evidenceHistory?.status==="available"?"blue":"amber"}>
          <MetricRow left="Verification snapshots (last 7 days)"
            right={show(report.evidenceHistory?.snapshots7d)}/>
          <MetricRow left="Latest snapshot"
            right={report.evidenceHistory?.latestAt?
              new Date(report.evidenceHistory.latestAt).toLocaleString("en-GB"):
              "Not yet recorded"}/>
          <MetricRow left="Recent sample trend"
            right={(report.evidenceHistory?.trend||"unverified").replace(/_/g," ")}/>
          <MetricRow left="Observed issues across samples (7 days)"
            right={show(report.evidenceHistory?.sampledIssueObservations7d)}/>
          <MetricRow left="Minimum time between external checks"
            right={report.evidenceHistory?.budget?
              report.evidenceHistory.budget.minimumMinutesBetweenChecks+" minutes":"Not verified"}/>
          <MetricRow left="Unattended external checks" right="Disabled"/>
          {(report.evidenceHistory?.diagnoses||[]).slice(0,3).map((item,i)=>
            <Text key={item.kind+"-"+i} style={styles.sectionLabel}>
              {item.note}
            </Text>)}
          <Text style={styles.sectionLabel}>
            {report.evidenceHistory?.note||"No reliable evidence history has been retrieved."}
          </Text>
        </Card>
        <Card eyebrow="V3.75 • Reality Check Engine"
          title="Verify recorded results against external evidence"
          body="On request, BUSY tests a small sample of its own published website hosts by HTTPS, inspects real social-provider submission receipts, and compares Business App deployment version records. This cannot guarantee visual correctness, public social visibility or every customer's uptime."
          tone="blue">
          <Button label={reality.status==="loading"?"Checking real evidence…":"Check external evidence now"}
            primary disabled={reality.status==="loading"||!owner} onPress={verifyExternal}/>
          {reality.status==="unavailable"?(
            <Text style={styles.sectionLabel}>Verification is currently unavailable. No outcome has been assumed.</Text>
          ):null}
          {reality.status==="rate_limited"?(
            <Text style={styles.sectionLabel}>
              An external check has already been claimed in this 30-minute period. BUSY will not repeat it. Refresh the founder snapshot to see saved history.
            </Text>
          ):null}
          {reality.status==="ready"&&reality.data?.historyPersisted===false?(
            <Text style={styles.sectionLabel}>
              This verification was displayed but could not be saved in history. No stored result is being claimed.
            </Text>
          ):null}
          {reality.owner===owner&&reality.status==="ready"&&reality.data?(
            <>
              <MetricRow left="Published website hosts sampled"
                right={show(reality.data.website?.sampled)}/>
              <MetricRow left="Website deployment responses verified"
                right={show(reality.data.website?.outcomes?.deployment_responding)}/>
              <MetricRow left="Website mismatch or unreachable"
                right={reality.data.website?.outcomes?
                  show(reality.data.website.outcomes.mismatch+reality.data.website.outcomes.unreachable):
                  "Not measured"}/>
              <MetricRow left="Social post records sampled"
                right={show(reality.data.social?.sampledPosts)}/>
              <MetricRow left="Provider-accepted social destinations"
                right={show(reality.data.social?.channels?.providerAccepted)}/>
              <MetricRow left="Social receipts failed or unverified"
                right={reality.data.social?.channels?
                  show(reality.data.social.channels.failed+reality.data.social.channels.unverified):
                  "Not measured"}/>
              <MetricRow left="Live Business App records sampled"
                right={show(reality.data.apps?.sampled)}/>
              <MetricRow left="Business App deployments recorded"
                right={show(reality.data.apps?.outcomes?.deployment_recorded)}/>
              <Text style={styles.sectionLabel}>
                {reality.data.website?.note||"Website evidence unavailable."}
              </Text>
              <Text style={styles.sectionLabel}>
                {reality.data.social?.note||"Social evidence unavailable."}
              </Text>
              <Text style={styles.sectionLabel}>
                {reality.data.apps?.note||"Business App evidence unavailable."}
              </Text>
            </>
          ):null}
        </Card>
        <Card eyebrow="V3.74 • Verified recovery reviews"
          title={report.recovery?.status==="available"?
            "Automatic rechecks with a private audit trail":
            "Recovery evidence needs inspection"}
          body={report.recovery?.note||
            "BUSY has not verified the private recovery audit. No external repair is assumed."}
          tone={report.recovery?.status==="available"?"blue":"amber"}>
          <MetricRow left="Recorded issues needing review"
            right={show(report.recovery?.reviewCount)}/>
          <MetricRow left="Waiting for a second clean scan"
            right={show(report.recovery?.confirmingCount)}/>
          <MetricRow left="Signals cleared after repeat checks"
            right={show(report.recovery?.signalClearedCount)}/>
          <MetricRow left="Unknown recovery evidence"
            right={show(report.recovery?.unknownCount)}/>
          <MetricRow left="Automatic publishing or job retries" right="Disabled"/>
          {(report.recovery?.items||[]).slice(0,6).map(item=>
            <MetricRow key={item.key+"-"+item.transition}
              left={item.key.replace(/_/g," ")+" • "+item.assessment.replace(/_/g," ")}
              right={item.monitoringVerified?"Scan verified":"Unverified"}/>)}
        </Card>
        <Card eyebrow="V3.73 • Phone alert readiness"
          title={report.notificationReadiness?.status==="no_registered_device"?
            "Register your founder phone before enabling alerts":
            report.notificationReadiness?.status==="unknown"?
              "Phone notification registration unverified":
              "Notification delivery still requires verification"}
          body={report.notificationReadiness?.action||
            "Founder push is not ready. No external delivery has been enabled."}
          tone="blue">
          <MetricRow left="Your active registered devices"
            right={show(report.notificationReadiness?.registeredFounderDevices)}/>
          <MetricRow left="Verified phone delivery"
            right={report.notificationReadiness?.verifiedDelivery?"Yes":"Not verified"}/>
          <MetricRow left="Automatic founder alerts" right="Not enabled"/>
          <Button label="Open production push setup" onPress={()=>s.go("productionBridge")}/>
        </Card>
        <Card eyebrow="V3.70 • Platform Autopilot"
          title={report.autopilot?.status==="monitoring"?
            "Background incident checks running":
            report.autopilot?.status==="partial"?"Some monitoring sources unavailable":
            report.autopilot?.status==="stale"?"Background monitor needs inspection":
            "Monitoring has not been verified"}
          body="BUSY scans four aggregate problem categories every 15 minutes, even when your phone is off. Past failures are not automatically treated as a live outage."
          tone={report.autopilot?.status==="monitoring"?"blue":"amber"}>
          <MetricRow left="Last verified background scan" right={
            report.autopilot?.checkedAt?
              new Date(report.autopilot.checkedAt).toLocaleString("en-GB"):"Not verified"}/>
          <MetricRow left="Sources checked" right={
            report.autopilot?.sourcesChecked===null||
            report.autopilot?.sourcesChecked===undefined?
              "Not verified":report.autopilot.sourcesChecked+" / 4"}/>
          <MetricRow left="Open grouped incidents" right={show(report.autopilot?.openIncidents)}/>
          <MetricRow left="Priority incidents" right={show(report.autopilot?.highPriorityIncidents)}/>
          {Array.isArray(report.autopilot?.incidents)&&
            report.autopilot.incidents.length?(
            <Text style={styles.sectionLabel}>Recent platform incident history:</Text>
          ):null}
          {(report.autopilot?.incidents||[]).slice(0,6).map(item=>
            <MetricRow key={item.key}
              left={item.title+" • "+(item.status==="open"?"Open":"Resolved")}
              right={show(item.count)}/>)}
          <Text style={styles.sectionLabel}>{report.autopilot?.alerts?.note||
            "Notifications are not yet enabled."}</Text>
          <Text style={styles.sectionLabel}>{report.autopilot?.recovery?.note||
            "No automatic public or destructive recovery actions are allowed."}</Text>
        </Card>
        <Card eyebrow="V3.71 • Private founder alert inbox"
          title={report.alertInbox?.status==="available"?
            "Platform alerts, awaiting your review":"Alert inbox unavailable"}
          body="These are grouped aggregate system alerts, visible only inside this authenticated founder screen. Acknowledging one does not fix it or clear the underlying incident. Automatic external push/email delivery is not enabled."
          tone={report.alertInbox?.unread>0?"amber":"blue"}>
          <MetricRow left="Unacknowledged open alerts"
            right={show(report.alertInbox?.unread)}/>
          <MetricRow left="Persistent or urgent recorded incidents"
            right={show(report.alertInbox?.escalated)}/>
          {(report.alertInbox?.items||[]).map(item=>
            <React.Fragment key={item.key}>
              <MetricRow left={item.key.replace(/_/g," ")+" • "+item.status+
                (item.acknowledgedAt?" • acknowledged":"")}
                right={show(item.count)}/>
              {item.status==="open"?(
                <MetricRow left="Triage level • based on recorded failure age"
                  right={item.escalation?.level||"unverified"}/>
              ):null}
              {item.status==="open"&&item.reviewGuidance?(
                <Text style={styles.sectionLabel}>{item.reviewGuidance}</Text>
              ):null}
              {item.status==="open"&&!item.acknowledgedAt&&item.transition?(
                <Button label={ackBusy===item.key?"Acknowledging…":"Acknowledge "+item.key.replace(/_/g," ")}
                  disabled={!!ackBusy} onPress={()=>acknowledge(item)}/>
              ):null}
            </React.Fragment>)}
          {ackError?<Text style={styles.sectionLabel}>{ackError}</Text>:null}
          {report.alertInbox?.status==="available"&&!report.alertInbox?.items?.length?
            <Text style={styles.sectionLabel}>No recorded alerts yet. The live monitor may still be running normally.</Text>:null}
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
        <Card eyebrow="Operations autonomy" title="Automatic detection active; delivery remains protected"
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
