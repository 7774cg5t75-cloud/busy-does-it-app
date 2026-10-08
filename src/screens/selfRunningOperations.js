import React from "react";
import {Text} from "react-native";
import {Shell,Card,Button,MetricRow} from "../components/ui";
import {styles} from "../theme/styles";
import {checkAllReadOnlySources} from "../domain/readOnlyStatusRecovery.mjs";
import {buildVerifiedActivity} from "../domain/verifiedBusinessActivity.mjs";
import {buildSelfRunningOperations,nextRecoveryStep} from "../domain/selfRunningOperations.mjs";

const NAMES={website:"Website",business_app:"Customer App",social:"Social"};
function SelfRunningOperations({s}){
  const userId=s.ownerSession?.userId||"";
  const businessId=s.cloudWorkspace?.businessId||"";
  const scope=userId+":"+businessId;
  const [checks,setChecks]=React.useState({scope:"",busy:false,results:{},checkedAt:"",failures:{}});
  const argsRef=React.useRef(s.growthProjectCloudArgs);
  argsRef.current=s.growthProjectCloudArgs;
  const scopeRef=React.useRef(scope);
  scopeRef.current=scope;
  const nonce=React.useRef(0);
  const refresh=React.useCallback(async()=>{
    const request=++nonce.current;
    if(!userId||!businessId){
      setChecks({scope,busy:false,results:{},checkedAt:"",failures:{}});
      return;
    }
    setChecks(prev=>({scope,busy:true,results:{},checkedAt:"",failures:prev.scope===scope?prev.failures:{}}));
    try{
      const args=await argsRef.current();
      if(nonce.current!==request||scopeRef.current!==scope||
        args.userId!==userId||args.businessId!==businessId)return;
      // READ-ONLY status calls only. A transient error may be retried once.
      const results=await checkAllReadOnlySources(args);
      if(nonce.current!==request||scopeRef.current!==scope)return;
      setChecks(prev=>{
        const failures={};
        for(const source of Object.keys(NAMES))failures[source]=results[source]?.ok?0:
          Math.min(3,(prev.scope===scope?Number(prev.failures[source]||0):0)+1);
        return {scope,busy:false,results,checkedAt:new Date().toISOString(),failures};
      });
    }catch(_){
      if(nonce.current!==request||scopeRef.current!==scope)return;
      setChecks(prev=>({
        scope,busy:false,checkedAt:new Date().toISOString(),
        results:{},failures:Object.fromEntries(Object.keys(NAMES).map(source=>[
          source,Math.min(3,(prev.scope===scope?Number(prev.failures[source]||0):0)+1)
        ])),
      }));
    }
  },[scope,userId,businessId]);
  React.useEffect(()=>{
    setChecks({scope:"",busy:true,results:{},checkedAt:"",failures:{}});
    refresh();
    return ()=>{nonce.current+=1;};
  },[refresh]);
  const ready=checks.scope===scope&&!checks.busy&&!!checks.checkedAt;
  const activity=buildVerifiedActivity({
    userId,businessId,results:ready?checks.results:{},asOf:ready?checks.checkedAt:""
  });
  const operations=buildSelfRunningOperations({
    ownerId:userId,businessId,
    continuity:ready?s.operationalContinuity:{},
    releaseCoreHealth:ready?s.releaseCoreHealth:{},
    activity,
    websitePublishingStatus:ready&&checks.results.website?.ok?
      {...checks.results.website.data,loaded:true}:{loaded:false},
    miniAppsStatus:ready&&checks.results.business_app?.ok?
      {...checks.results.business_app.data,loaded:true}:{loaded:false},
    productionWatchStatus:ready?s.productionWatchStatus:{},
    cloudConflict:ready?s.cloudConflict:null,
    nowISO:checks.checkedAt,
    consecutiveReadFailures:ready?checks.failures:{},
  });
  const open=issue=>{
    const route=nextRecoveryStep(issue).route||issue.route;
    if(!route)return;
    s.go(route);
  };
  const cost=operations.costs||{};
  const usage=cost.websiteUsage||{};
  return <Shell s={s}
    title="BUSY Operations & Reliability"
    subtitle="Keep your business running with fewer interruptions: source checks, exception priorities and guided recovery."
    brandCue="V3.68 • owner-scoped health • no automatic public actions">
    <Card eyebrow="Your business • exceptions only"
      title={checks.busy?"Checking connected services…":operations.headline}
      body={ready?operations.truth:"BUSY is checking current authenticated status reports. Results from another business are never shown."}
      tone={ready&&operations.counts?.critical?"amber":"blue"}>
      <MetricRow left="Needs human review" right={ready?String(operations.counts.human):"Checking"}/>
      <MetricRow left="Other actionable exceptions" right={ready?String(operations.counts.action-operations.counts.critical):"Checking"}/>
      <MetricRow left="Connected status systems checked" right={ready?operations.metrics.monitored+" / 3":"Checking"}/>
      <Button label={checks.busy?"Checking…":"Refresh read-only health checks"}
        primary disabled={checks.busy||!userId||!businessId} onPress={refresh}/>
      <Text style={styles.sectionLabel}>Refresh checks cannot publish, delete or overwrite anything. A temporary reporting failure gets at most one safe automatic retry.</Text>
    </Card>
    {ready&&operations.humanRequired.length?(
      <Card eyebrow="You need to decide" title="Human intervention"
        body="BUSY will not silently resolve conflicting cloud data, change ownership or approve external actions."
        tone="amber">
        {operations.humanRequired.slice(0,5).map(issue=>
          <Card key={issue.id} title={issue.title} body={issue.description} tone="amber">
            <Button label={nextRecoveryStep(issue).label} onPress={()=>open(issue)}/>
          </Card>)}
      </Card>
    ):null}
    <Card eyebrow="Auto-triaged issues"
      title={ready?operations.attention.length+" current issues":"Checking exceptions"}
      body="Identical reports are grouped so they don't flood your day. Routine issues lead to the existing self-service screen, never a hidden publishing action."
      tone="blue">
      {ready&&operations.attention.length?operations.attention.slice(0,8).map(issue=>
        <Card key={issue.id} eyebrow={issue.source+" • "+issue.severity}
          title={issue.title} body={issue.description} tone={issue.severity==="critical"?"amber":"blue"}>
          {issue.route?<Button label={nextRecoveryStep(issue).label}
            onPress={()=>open(issue)}/>:null}
        </Card>
      ):<Text style={styles.sectionLabel}>{checks.busy?"Checking service records…":
        "No confirmed actionable exceptions in checked sources. Unavailable sources are still listed below."}</Text>}
    </Card>
    <Card eyebrow="Monitoring and incomplete checks"
      title={ready?operations.watch.length+" items being watched":"Checks in progress"}
      body="One unsuccessful check is not an outage. BUSY only escalates repeated reporting failures; an unavailable provider's state remains unknown."
      tone="blue">
      {Object.keys(NAMES).map(source=><MetricRow key={source} left={NAMES[source]}
        right={ready?(checks.results[source]?.ok?
          (checks.results[source].recoveredRead?"Recovered read":"Responding"):
          "Not verified"):"Checking"}/>)}
      {ready?operations.watch.slice(0,5).map(issue=>
        <Text key={issue.id} style={styles.sectionLabel}>{issue.title}: {issue.description}</Text>):null}
    </Card>
    <Card eyebrow="Measured usage, not made-up costs"
      title={cost.state==="usage_only"?"Website usage information available":"Billing telemetry not connected"}
      body={cost.note||"AI costs, subscriptions and profit are not currently measured here."}
      footer="£50/month is a product-value goal, not an activated subscription charge."
      tone="blue">
      <MetricRow left="Website requests" right={ready&&usage.requests!==undefined?String(usage.requests):"Not measured"}/>
      <MetricRow left="Recorded website deployments" right={ready&&usage.deployments!==undefined?String(usage.deployments):"Not measured"}/>
      <MetricRow left="AI spend" right="Not integrated"/>
      <MetricRow left="Subscription revenue / margins" right="Not integrated"/>
    </Card>
    <Card eyebrow="Founder oversight"
      title="Platform-wide automation is a separate security layer"
      body="This is the current signed-in business's operations, not a global subscriber or platform-admin dashboard. Platform-wide costs, subscription billing, cross-tenant incidents and alerting will need a separately authenticated backend. They cannot safely be inferred from customer account data."
      tone="blue"/>
    <Button label="Open production readiness" onPress={()=>s.go("productionBridge")}/>
    <Button label="Open verified business activity" onPress={()=>s.go("businessActivityCentre")}/>
    <Button label="Back to Home" onPress={()=>s.jump("home","Home")}/>
  </Shell>;
}
export {SelfRunningOperations};
