import React from "react";
import {Text} from "react-native";
import {Card,Button,Field,MetricRow} from "../components/ui";
import {styles} from "../theme/styles";
import {founderUsageEvidence} from "../core/founderUsageEvidence.mjs";

/** V3.81: secure founder-only subscription/usage register.
 * Provider invoices are not automatically connected; saved snapshots remain
 * clearly labelled as one-off observations, not a live meter.
 */
const STATES=["unknown","free","trial","paid","inactive"];
const CADENCES=["unknown","monthly","annual","usage_based","none"];
const fnum=n=>Number.isSafeInteger(n)&&n>=0?n.toLocaleString("en-GB"):"Not measured";
const cost=n=>Number.isSafeInteger(n)&&n>=0?
  "£"+(n/100).toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2}):
  "Not recorded";
const nextOf=(options,current)=>options[(Math.max(0,options.indexOf(current))+1)%options.length];
function initialForm(){
  return {planName:"",usage:"",allowance:"",costGbp:"",renewal:"",note:"",
    billingStatus:"unknown",billingCadence:"unknown"};
}
function parseWhole(s){
  const v=String(s).trim();
  return v===""?null:/^\d{1,12}$/.test(v)?Number(v):NaN;
}
function parseGbp(s){
  const v=String(s).trim();
  return v===""?null:/^\d{1,7}(?:\.\d{1,2})?$/.test(v)?
    Math.round(Number(v)*100):NaN;
}
function FounderServiceCosts({s,owner,enabled}){
  const [data,setData]=React.useState({owner:"",status:"idle",report:null,error:""});
  const [staging,setStaging]=React.useState({owner:"",status:"idle",data:null});
  const [providerSync,setProviderSync]=React.useState({status:"idle",message:""});
  const [selected,setSelected]=React.useState("supabase");
  const [form,setForm]=React.useState(initialForm);
  const [saving,setSaving]=React.useState(false);
  const [message,setMessage]=React.useState("");
  const scope=React.useRef(owner);
  const nonce=React.useRef(0);
  const stagingNonce=React.useRef(0);
  const serviceLoader=React.useRef(s.fetchFounderServices);
  const stagingLoader=React.useRef(s.fetchFounderDemoLaunch);
  serviceLoader.current=s.fetchFounderServices;
  stagingLoader.current=s.fetchFounderDemoLaunch;
  const key=React.useRef("");
  scope.current=owner;
  const update=(name,value)=>{
    key.current="";
    setMessage("");
    setForm(previous=>({...previous,[name]:value}));
  };
  const refresh=React.useCallback(async()=>{
    const request=++nonce.current;
    if(!owner||!enabled){
      setData({owner,status:"idle",report:null,error:""});
      return;
    }
    setData({owner,status:"loading",report:null,error:""});
    try{
      const report=await serviceLoader.current();
      if(scope.current!==owner||request!==nonce.current)return;
      if(report?.scope!=="founder_service_register"||report?.privacy!=="founder_only"||
         !Array.isArray(report.services))throw Error("Invalid register response.");
      setData({owner,status:"ready",report,error:""});
    }catch(e){
      if(scope.current!==owner||request!==nonce.current)return;
      setData({owner,status:e?.status===403?"denied":"unavailable",
        report:null,error:"Private provider records are unavailable. Costs have not been estimated."});
    }
  },[owner,enabled]);
  React.useEffect(()=>{
    if(enabled)refresh();
    return()=>{nonce.current++;};
  },[refresh,enabled]);
  React.useEffect(()=>{
    setSelected("supabase");setForm(initialForm());
    setSaving(false);setMessage("");key.current="";
    setProviderSync({status:"idle",message:""});
  },[owner]);
  const loadStaging=React.useCallback(async()=>{
    const requestedOwner=owner,request=++stagingNonce.current;
    if(!enabled||!owner){
      setStaging({owner,status:"idle",data:null});
      return;
    }
    setStaging({owner,status:"loading",data:null});
    try{
      const data=await stagingLoader.current();
      if(scope.current!==requestedOwner||request!==stagingNonce.current)return;
      if(data?.scope!=="founder_demo_staging"||
         data?.explicitGoLiveApprovalStillRequired!==true)
        throw Error("Invalid staging evidence");
      setStaging({owner,status:"ready",data});
    }catch{
      if(scope.current===requestedOwner&&request===stagingNonce.current)
        setStaging({owner,status:"unavailable",data:null});
    }
  },[owner,enabled]);
  React.useEffect(()=>{
    loadStaging();
    return ()=>{stagingNonce.current+=1;};
  },[loadStaging]);
  const syncProviders=async()=>{
    if(!enabled||!owner||providerSync.status==="loading")return;
    const account=owner;
    setProviderSync({status:"loading",message:""});
    try{
      const outcome=await s.syncFounderConnectedProviders();
      if(scope.current!==account)return;
      const successful=outcome.results?.filter(x=>x.status==="saved").length||0;
      setProviderSync({status:"ready",message:
        outcome.status==="no_authorised_connections"?
        "No provider billing/analytics credentials are authorised yet. BUSY has not queried external accounts.":
        outcome.status==="rate_limited"?
        "Provider usage was checked recently. Try again after the 30-minute cooldown.":
        outcome.status==="cooldown_unavailable"?
        "Refresh limit could not be verified. No provider API request was made.":
        successful>0?
        successful+" read-only provider observation(s) recorded. This is not a GBP invoice.":
        "No verified provider readings were saved. Check supplier account permissions."
      });
      if(successful>0)await refresh();
    }catch(e){
      if(scope.current===account)
        setProviderSync({status:"unavailable",message:
          "Provider usage could not be verified. Nothing has been charged or changed."});
    }
  };
  const save=async()=>{
    if(saving||!enabled||!owner)return;
    const usage=parseWhole(form.usage),allowance=parseWhole(form.allowance),
      amount=parseGbp(form.costGbp);
    if(Number.isNaN(usage)||Number.isNaN(allowance)||Number.isNaN(amount)||
       (allowance!==null&&usage===null)){
      setMessage("Use whole numbers for usage and allowance, pounds for cost, and enter usage when specifying an allowance.");
      return;
    }
    if(!key.current)
      key.current="founder-"+Date.now()+"-"+Math.random().toString(36).slice(2,11);
    setSaving(true);setMessage("");
    const requestedOwner=owner;
    try{
      const outcome=await s.recordFounderService({
        serviceKey:selected,requestKey:key.current,
        planName:form.planName,billingStatus:form.billingStatus,
        billingCadence:form.billingCadence,
        usageValue:usage,allowanceValue:allowance,
        amountGbpPence:amount,renewalOn:form.renewal,note:form.note
      });
      if(scope.current!==requestedOwner)return;
      setMessage(outcome.duplicate?
        "That snapshot was already recorded. No duplicate was created.":
        "Founder-entered snapshot saved. It is NOT an invoice or live provider feed.");
      key.current="";setForm(initialForm());
      await refresh();
    }catch(e){
      if(scope.current===requestedOwner)
        setMessage(e?.message||"Could not confirm the snapshot. Retry safely.");
    }finally{if(scope.current===requestedOwner)setSaving(false);}
  };
  const current=data.owner===owner&&data.status==="ready"?data.report:null;
  const services=Array.isArray(current?.services)?current.services:[];
  const evidence=founderUsageEvidence(current);
  const chosen=services.find(item=>item.key===selected);
  return <>
    <Card eyebrow="V3.82 • Founder Financial Autopilot"
      title="Subscriptions, cloud usage and operating costs"
      body="This is your private inventory of BUSY's operating dependencies. The dashboard separates independently counted app activity from manually entered costs and historical provider observations. It does not connect billing accounts or create charges."
      footer="Founder-only, on demand. This screen is not an automatic bill monitor."
      tone="blue">
      <MetricRow left="Listed technology and operating services"
        right={current?fnum(services.length):"Unavailable"}/>
      <MetricRow left="Recent read-only provider observations"
        right={evidence.status==="available"?fnum(evidence.readOnlyRecent):"Not verified"}/>
      <MetricRow left="Services without a saved reading"
        right={evidence.status==="available"?fnum(evidence.providersMissing):"Not verified"}/>
      <Text style={styles.sectionLabel}>{evidence.message}</Text>
      <MetricRow left="Provider invoices automatically verified" right="None connected"/>
      <MetricRow left="Total actual running cost" right="Not verified"/>
      <MetricRow left="Actual renewal payments due" right="Check individual records"/>
      <Button label={data.status==="loading"?"Loading private records…":"Refresh service register"}
        disabled={!enabled||data.status==="loading"} onPress={refresh}/>
      {data.error?<Text style={styles.sectionLabel}>{data.error}</Text>:null}
      {current?<Text style={styles.sectionLabel}>
        {current.note} Every number below shows its source and observation date.
      </Text>:null}
    </Card>
    <Card eyebrow="V3.82 • Automatic monitoring"
      title="BUSY activity — updated by a server schedule"
      body="These counters are collected from BUSY's own private database every hour even when your phone is off. They are NOT official Supabase Edge Function usage, Cloudflare invoices, model tokens, paying customers or billable provider traffic."
      footer="Independent supplier billing connections require separate read-only account authorisation. Missing measurements never count as zero."
      tone="blue">
      <MetricRow left="Automatic collection cadence" right={current?.automaticUsage?.scheduledInterval||"Not verified"}/>
      {(current?.automaticUsage?.metrics||[]).map(item=>(
        <React.Fragment key={item.key}>
          <MetricRow left={item.name}
            right={item.value===null?"Not measured":fnum(item.value)+" "+item.unit}/>
          <Text style={styles.sectionLabel}>
            {item.status==="recent"?"Recent internal observation":item.status==="stale"?
              "Older internal observation":"No verified observation"} • {item.detail}
          </Text>
        </React.Fragment>
      ))}
      {current?.automaticUsage?.note?
        <Text style={styles.sectionLabel}>{current.automaticUsage.note}</Text>:null}
    </Card>
    <Card eyebrow="Provider billing connections"
      title="Actual supplier usage and invoices"
      body="Automatic BUSY activity counts are working, but we won't show guessed provider balances. The connections below require explicit authorisation to read each supplier's account, and no charges or plan changes are permitted."
      tone="blue">
      <MetricRow left="Supabase official monthly invocations" right="Provider billing not connected"/>
      <MetricRow left="GitHub Actions billed usage"
        right={current?.providerConnections?.github?.status==="credentials_configured_unverified"?
          "Read-only credentials set; verify now":"Provider billing not connected"}/>
      <MetricRow left="Cloudflare Workers activity"
        right={current?.providerConnections?.cloudflare?.status==="credentials_configured_unverified"?
          "Read-only credentials set; verify now":"Provider analytics not connected"}/>
      <MetricRow left="AI provider credits and invoice" right="Provider billing not connected"/>
      <MetricRow left="Automatic purchases, upgrades or renewals" right="Disabled"/>
      <Text style={styles.sectionLabel}>
        Existing GitHub source-control access is not the same as billing authorisation.
        Provider usage connections will be read-only and account-scoped.
      </Text>
      <Button label={providerSync.status==="loading"?"Checking read-only provider feeds…":
        "Verify configured provider feeds now"} primary
        disabled={!enabled||providerSync.status==="loading"} onPress={syncProviders}/>
      {providerSync.message?<Text style={styles.sectionLabel}>
        {providerSync.message}
      </Text>:null}
    </Card>
    <Card eyebrow="V3.81 • First live website milestone"
      title="demo.busydoesit.co.uk — controlled staging"
      body="This checks for an actual website record and private hosted preview. The code-generated fictional demo is not a hosted customer website. Nothing will go publicly live without your approval of the exact preview."
      footer="Read-only evidence, not a publish button. Your main busydoesit.co.uk website is also still a development draft."
      tone="blue">
      <MetricRow left="Staging website created"
        right={staging.status==="ready"?
          staging.data?.siteRecordAllocated?"Recorded":"Not recorded":"Not verified"}/>
      <MetricRow left="Private hosted preview"
        right={staging.status==="ready"?
          staging.data?.privateHostedPreviewRecorded?"Recorded":"Not yet":"Not verified"}/>
      <MetricRow left="Public publication"
        right={staging.status==="ready"?
          staging.data?.publicationRecorded?"Recorded (not externally checked)":"Not published":"Not verified"}/>
      <MetricRow left="External HTTPS proof" right="Not verified in this report"/>
      <MetricRow left="Approval before Go Live" right="Always required"/>
      <Button label="Refresh demonstration staging status"
        disabled={staging.status==="loading"||!enabled} onPress={loadStaging}/>
      <Button label="Open current business Website Management"
        disabled={!enabled} onPress={s.openWebsitePublishing}/>
    </Card>
    {services.map(item=>{
      const row=item.latest,subscription=item.subscription;
      return <Card key={item.key} eyebrow={item.name}
        title={item.purpose}
        body={item.caveat}
        footer={item.scope+" • "+(row?.measurementType||"No observation yet")}
        tone={item.alert?"amber":"blue"}>
        <MetricRow left="Plan" right={subscription?.planName||"Not verified"}/>
        <MetricRow left="Subscription status" right={subscription?.billingStatus||"Unknown"}/>
        <MetricRow left={"Usage • "+item.unit}
          right={row?.usageValue!=null?
            fnum(row.usageValue)+(row.allowanceValue!=null?
              " / "+fnum(row.allowanceValue):""):"Not measured"}/>
        {row?.percentOfAllowance!=null?
          <MetricRow left="Share of recorded allowance"
            right={row.percentOfAllowance+"% (historical)"} />:null}
        <MetricRow left="Recorded cost" right={cost(subscription?.amountGbpPence)}/>
        <MetricRow left="Billing cadence" right={subscription?.billingCadence||"Not verified"}/>
        <MetricRow left="Renewal date" right={subscription?.renewalOn||"Not recorded"}/>
        {item.renewalReview==="past_review_date"||item.renewalReview==="review_within_30_days"?(
          <MetricRow left="Renewal review reminder"
            right={item.renewalReview==="past_review_date"?
              "Entered review date has passed":"Review within 30 days"}/>
        ):null}
        <MetricRow left="Last observation"
          right={row?.observedAt?
            new Date(row.observedAt).toLocaleString("en-GB"):"None"}/>
        <MetricRow left="Measurement source" right={row?.measurementType||"None"}/>
        <MetricRow left="Plan/renewal information source"
          right={subscription?.measurementType||"Not verified"}/>
        {row?.note?<Text style={styles.sectionLabel}>{row.note}</Text>:null}
        {item.alert?<Text style={styles.sectionLabel}>{item.alert}</Text>:null}
        <Button label={selected===item.key?"Selected for update":"Record "+item.name+" details"}
          disabled={!!saving} onPress={()=>{setSelected(item.key);setForm(initialForm());
          key.current="";setMessage("");}}/>
      </Card>;
    })}
    {chosen?<Card eyebrow="Founder-entered update"
      title={"Record "+chosen.name+" subscription or usage"}
      body="Enter only information you have checked with the provider. Leave blank if unknown. This is a historical note, not a provider connection. Never enter credentials, access tokens, full card numbers or customer data."
      tone="blue">
      <Field label="Plan name (optional)" value={form.planName}
        onChangeText={v=>update("planName",v)} placeholder="e.g. Free"/>
      <Button label={"Subscription: "+form.billingStatus+" (change)"}
        disabled={saving} onPress={()=>update("billingStatus",nextOf(STATES,form.billingStatus))}/>
      <Button label={"Billing: "+form.billingCadence+" (change)"}
        disabled={saving} onPress={()=>update("billingCadence",nextOf(CADENCES,form.billingCadence))}/>
      <Field label={"Usage count • "+chosen.unit} value={form.usage}
        onChangeText={v=>update("usage",v)} placeholder="Leave blank if unknown" keyboardType="numeric"/>
      <Field label="Included allowance (optional)" value={form.allowance}
        onChangeText={v=>update("allowance",v)} placeholder="e.g. 500000" keyboardType="numeric"/>
      <Field label="Recorded charge (£ GBP, optional)" value={form.costGbp}
        onChangeText={v=>update("costGbp",v)} placeholder="e.g. 0.00" keyboardType="decimal-pad"/>
      <Field label="Renewal or review date (YYYY-MM-DD, optional)" value={form.renewal}
        onChangeText={v=>update("renewal",v)} placeholder="2026-11-09" autoCapitalize="none"/>
      <Field label="Evidence or notes (optional, max 500 characters)" value={form.note}
        onChangeText={v=>update("note",v)} placeholder="Source and what period was checked"/>
      <Button label={saving?"Saving…":"Save snapshot (no charges or renewals)"}
        primary disabled={!enabled||saving} onPress={save}/>
      {message?<Text style={styles.sectionLabel}>{message}</Text>:null}
    </Card>:null}
  </>;
}
export {FounderServiceCosts,parseWhole,parseGbp};
