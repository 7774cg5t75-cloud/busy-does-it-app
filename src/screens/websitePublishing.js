import React from "react";
import { Keyboard, Text } from "react-native";

import { styles } from "../theme/styles";
import { Shell, Card, Button, Field, MetricRow } from "../components/ui";
import { buildWebsiteLaunchJourney } from "../core/websiteLaunchJourney";
import { buildWebsiteLaunchProof } from "../core/websiteLaunchProof.mjs";
import { domainDnsGuide } from "../core/websiteDomainGuide.mjs";
import { websiteAddressChoices } from "../core/websiteAddressChoices.mjs";
import { localDomainIdeas } from "../core/websiteDomainShopping.mjs";
import { websiteDomainResponsibilities } from "../core/websiteDomainResponsibilities.mjs";
import { websiteDomainLaunchGuide } from "../core/websiteDomainLaunchGuide.mjs";
import { websiteDomainSwitchSafety } from "../core/websiteDomainSwitchSafety.mjs";
import { websitePublishApprovalGuide } from "../core/websitePublishApprovalGuide.mjs";
import { websiteRecoveryCoach } from "../core/websiteRecoveryCoach.mjs";

function readableSeconds(value) {
  const seconds = Number(value || 0);
  if (!seconds) return "Just now";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function readableDate(value, fallback = "Not yet") {
  if (!value) return fallback;
  try {
    return new Date(value).toLocaleString("en-GB");
  } catch {
    return fallback;
  }
}
function readableBytes(value) {
  const bytes = Math.max(0, Number(value || 0));
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}


function WebsitePublishing({ s }) {
  const view = s.websitePublishingView || {};
  const [showTechnicalDetails, setShowTechnicalDetails] = React.useState(false);
  const [showDomainSetup, setShowDomainSetup] = React.useState(false);
  const [addressChoice,setAddressChoice]=React.useState("busy");
  const [domainIdeaInput,setDomainIdeaInput]=React.useState("");
  const [showDomainIdeas,setShowDomainIdeas]=React.useState(false);
  const [registrarStatus,setRegistrarStatus]=React.useState({domain:"",status:"idle",message:""});
  const [dnsInspection,setDnsInspection]=React.useState({domainId:"",status:"idle",result:null,error:""});
  const [showEnquiries, setShowEnquiries] = React.useState(false);
  const [showNewEnquiry, setShowNewEnquiry] = React.useState(false);
  const toggleSection = (setter) => { Keyboard.dismiss(); setter(previous => !previous); };
  const website = view.website || null;
  const preview = view.previewDeployment || null;
  const live = view.liveDeployment || null;
  const domain = view.domainState?.latest || null;
  const addresses=websiteAddressChoices({mode:addressChoice,publishing:view});
  const responsibility=websiteDomainResponsibilities({mode:addressChoice,connectedDomain:domain});
  const launchGuide=websiteDomainLaunchGuide({choice:addressChoice,publishing:view});
  const domainIdeaPreview=localDomainIdeas(domainIdeaInput);
  const firstDomainIdea=domainIdeaPreview.ideas[0]?.domain||"";
  const registrarRequestRef=React.useRef("");registrarRequestRef.current=firstDomainIdea;
  const checkRegistrar=async()=>{
    if(!firstDomainIdea||registrarStatus.status==="loading")return;
    const domainToCheck=firstDomainIdea;
    setRegistrarStatus({domain:domainToCheck,status:"loading",message:""});
    try{
      const answer=await s.checkWebsiteRegistrarSearch(domainToCheck);
      if(registrarRequestRef.current!==domainToCheck)return;
      setRegistrarStatus({domain:domainToCheck,status:answer?.status||"not-connected",
        message:answer?.message||"Registrar search is not available."});
    }catch(error){
      if(registrarRequestRef.current===domainToCheck)
        setRegistrarStatus({domain:domainToCheck,status:"error",
          message:error?.message||"BUSY could not check the registrar connection."});
    }
  };
  const selectAddress=(mode)=>{
    Keyboard.dismiss();
    setAddressChoice(mode);
    setShowDomainSetup(mode==="existing");
    setShowDomainIdeas(false);
    setRegistrarStatus({domain:"",status:"idle",message:""});
  };
  const domainGuide=domainDnsGuide({domain,stage:view.domainState?.journey?.stage,
    records:view.domainState?.recordsToAdd});
  const dnsInspectionRef=React.useRef("");dnsInspectionRef.current=domain?.id||"";
  React.useEffect(()=>setDnsInspection({domainId:domain?.id||"",status:"idle",result:null,error:""}),[domain?.id]);
  const checkDns=async()=>{
    const selected=domain?.id;
    if(!selected||dnsInspection.status==="loading")return;
    setDnsInspection({domainId:selected,status:"loading",result:null,error:""});
    try{
      const result=await s.inspectWebsiteDomainDns(selected);
      if(dnsInspectionRef.current===selected)
        setDnsInspection({domainId:selected,status:"done",result,error:""});
    }catch(error){
      if(dnsInspectionRef.current===selected)
        setDnsInspection({domainId:selected,status:"error",result:null,error:error?.message||"DNS check unavailable."});
    }
  };
  const activeJob = view.activeJob || null;
  const recoveryCoach=websiteRecoveryCoach(view);
  const changes = view.changeSummary?.items || [];
  // V3.78 private lead follow-up, not an open website form.
  const leadScope=(s.ownerSession?.userId||"")+":"+(s.cloudWorkspace?.businessId||"");
  const leadScopeRef=React.useRef(leadScope);leadScopeRef.current=leadScope;
  const [leads,setLeads]=React.useState({scope:"",status:"idle",result:null,error:""});
  const [leadName,setLeadName]=React.useState("");
  const [leadContact,setLeadContact]=React.useState("");
  const [leadService,setLeadService]=React.useState("");
  const [leadMethod,setLeadMethod]=React.useState("email");
  const [leadPermission,setLeadPermission]=React.useState(false);
  const [leadBusy,setLeadBusy]=React.useState("");
  const [leadMessage,setLeadMessage]=React.useState("");
  const leadRequestKey=React.useRef("");
  const loadLeads=async()=>{
    const requestedScope=leadScope;
    if(!s.ownerSession?.userId||!s.cloudWorkspace?.businessId)return;
    setLeads({scope:requestedScope,status:"loading",result:null,error:""});
    try{
      const result=await s.listWebsiteLeads();
      if(leadScopeRef.current!==requestedScope)return;
      setLeads({scope:requestedScope,status:"ready",result,error:""});
    }catch(e){
      if(leadScopeRef.current===requestedScope)
        setLeads({scope:requestedScope,status:"unavailable",result:null,
          error:e?.message||"Private enquiries could not be loaded."});
    }
  };
  React.useEffect(()=>{
    leadRequestKey.current="";
    setLeadName("");setLeadContact("");setLeadService("");
    setLeadPermission(false);setLeadBusy("");setLeadMessage("");
    if(s.ownerSession?.userId&&s.cloudWorkspace?.businessId)loadLeads();
    else setLeads({scope:leadScope,status:"idle",result:null,error:""});
  },[leadScope]);
  const saveLead=async()=>{
    if(leadBusy||!leadPermission||!leadName.trim()||!leadContact.trim())return;
    const scope=leadScope;
    if(!leadRequestKey.current)
      leadRequestKey.current="lead-"+Date.now()+"-"+Math.random().toString(36).slice(2,12);
    setLeadBusy("saving");setLeadMessage("");
    try{
      const result=await s.createWebsiteLead({
        idempotencyKey:leadRequestKey.current,
        name:leadName,contactMethod:leadMethod,contactValue:leadContact,
        service:leadService,notes:"",contactPermissionConfirmed:true
      });
      if(leadScopeRef.current!==scope)return;
      setLeadMessage(result?.reused?
        "An earlier save of this enquiry was found. No duplicate was created.":
        "Enquiry recorded privately. Nothing was sent to the customer.");
      leadRequestKey.current="";
      setLeadName("");setLeadContact("");setLeadService("");setLeadPermission(false);
      await loadLeads();
    }catch(e){
      if(leadScopeRef.current===scope)
        setLeadMessage(e?.message||"The enquiry could not be saved. Retry safely.");
    }finally{if(leadScopeRef.current===scope)setLeadBusy("");}
  };
  const advanceLead=async(item,nextStatus)=>{
    if(leadBusy||!item?.id)return;
    const scope=leadScope;
    setLeadBusy(item.id);setLeadMessage("");
    try{
      await s.changeWebsiteLeadStatus(item.id,item.status,nextStatus);
      if(leadScopeRef.current!==scope)return;
      setLeadMessage("Progress updated. No customer message was sent.");
      await loadLeads();
    }catch(e){
      if(leadScopeRef.current===scope)
        setLeadMessage(e?.message||"Progress changed elsewhere. Refresh the list.");
    }finally{if(leadScopeRef.current===scope)setLeadBusy("");}
  };

  const seoChecks = view.seoAudit?.checks || [];
  const launchProof=buildWebsiteLaunchProof({...view,websiteDraftPresent:!!s.websiteDraft});
  const domainSwitch=websiteDomainSwitchSafety(view,launchProof);
  const journey=buildWebsiteLaunchJourney({
    brand:s.brandBrain,draft:s.websiteDraft,publishing:view,deliveryProof:launchProof
  });
  const missingDeliveryCheck=launchProof.checks.find(check=>!check.ready);
  // The native hosted viewer is a separate screen. Its successful opening
  // must survive navigation back here before the owner can confirm review.
  const openedHostedPreview=s.websitePreviewOpenedId===preview?.id?preview.id:"";
  const [reviewedHostedPreview,setReviewedHostedPreview]=React.useState("");
  React.useEffect(()=>{
    setReviewedHostedPreview("");
  },[preview?.id,preview?.content_hash,view.draftChangedSinceHosted]);
  const approvalGuide=websitePublishApprovalGuide({preview,live,view,
    openedId:openedHostedPreview,reviewedId:reviewedHostedPreview});
  const inspectHostedPreview=async()=>{
    if(!preview?.id)return false;
    return !!(await s.openHostedWebsitePreview(preview.id));
  };

  return (
    <Shell
      s={s}
      title="Website Management"
      subtitle="Prepare your website, check the preview and choose when to publish."
      brandCue="BUSY DOES IT • Websites"
    >
      <Card
        eyebrow="Your website"
        title={launchProof.verified
          ? "Your website is live and verified"
          : live
          ? "Published • website connection still being checked"
          : activeJob
          ? "BUSY is working on your website"
          : preview
          ? "Your website is ready for review"
          : s.websiteDraft
          ? "Your website draft is ready"
          : "Let's build your website"}
        body={launchProof.verified
          ? "BUSY has verified the approved version on your public website. You can make changes without affecting the live version until you approve them."
          : live
          ? "BUSY has recorded publication but has not yet verified the public website connection. Your website is not marked as verified until the real checks pass."
          : preview
          ? "Open the exact hosted preview and check the wording, photos, services and contact details. Nothing is public until you approve it."
          : activeJob
          ? "BUSY is preparing your website securely. You can refresh the status to see what happens next."
          : s.websiteDraft
          ? "Your draft is private. Prepare a hosted preview before deciding whether to publish."
          : "Start with your business details. BUSY will prepare a website for you to review before anything goes public."}
        footer={launchProof.verified
          ? "Live website verified • changes always require your approval"
          : "Nothing is published automatically"}
        tone={launchProof.verified ? "green" : live && !launchProof.verified ? "amber" : "blue"}
      >
        {journey.missingCoreFacts.length ? (
          <Button label="Complete my business details" onPress={s.openBrandIdentity} />
        ) : null}
        {view.canPrepare ? (
          <Button
            label={s.websitePublishingAction === "prepare" ? "Preparing preview…" :
              preview && view.draftChangedSinceHosted ? "Prepare updated website preview" : "Prepare website preview"}
            primary={!preview || !!view.draftChangedSinceHosted}
            disabled={!!s.websitePublishingAction}
            onPress={s.prepareHostedWebsite}
          />
        ) : null}
        {preview ? (
          <Button label="Open my hosted website preview"
            primary={!live && !view.draftChangedSinceHosted}
            disabled={!!s.websitePublishingAction}
            onPress={inspectHostedPreview} />
        ) : null}
        {launchProof.verified && view.defaultAddressState?.address?.url ? (
          <Button label="Open my live website" primary onPress={s.openDefaultWebsiteAddress} />
        ) : null}
        {live && !launchProof.verified ? (
          <Text style={styles.sectionLabel}>
            {"Next website connection check: " + (missingDeliveryCheck?.label || "Public delivery") +
              ". BUSY will not label the website as verified without real evidence."}
          </Text>
        ) : null}
        <Button label={s.websitePublishingLoading ? "Refreshing…" : "Refresh website status"}
          disabled={s.websitePublishingLoading} onPress={s.refreshWebsitePublishingStatus} />
        <Button label="Edit my website" onPress={() => s.go("websiteBuilder")} />
        <Button label="Choose or check my website address"
          onPress={() => selectAddress(domain?"existing":"busy")} />
      </Card>
      <Text style={styles.sectionLabel}>Your website address</Text>
      <Card
        eyebrow="Choose your address"
        title="How would you like people to find your website?"
        body="You can review and improve your website before deciding. A custom domain is optional. Your choice never publishes anything, and an existing BUSY address remains safe when connecting your own domain."
        footer="No technical experience or separate domain purchase is needed to begin."
        tone="blue"
      >
        {addresses.options.map((option)=>(
          <Button key={option.id}
            label={(addressChoice===option.id?"✓ ":"")+option.title}
            primary={addressChoice===option.id}
            onPress={()=>selectAddress(option.id)} />
        ))}
        <Text style={styles.sectionLabel}>{addresses.active.description}</Text>
        <Text style={styles.cardBody}>{addresses.active.note}</Text>
        <Text style={styles.cardBody}>{responsibility.message}</Text>
        <Text style={styles.cardBody}>{"Next address step: "+launchGuide.next}</Text>
        {addressChoice==="existing" ? (
          <Text style={styles.cardBody}>{domainSwitch.message}</Text>
        ) : null}
        {addresses.active.hostname ? (
          <MetricRow left={addressChoice==="busy"?"BUSY address":"Your domain"}
            right={addresses.active.hostname} strong />
        ) : null}
        {addressChoice==="busy" ? (
          <Text style={styles.cardBody}>
            Your BUSY address is confirmed only when BUSY has actually assigned one.
            You can connect your own domain later without rebuilding the website.
            A live address still requires publishing approval and independent delivery checks.
          </Text>
        ) : null}
        {addressChoice==="new" ? (
          <>
            <Text style={styles.cardBody}>
              Searching, buying and renewing domains inside BUSY is planned but not active.
              Domain ideas below are generated on your device only: they have not been searched,
              checked for availability or priced. You can continue with a BUSY address for now.
            </Text>
            <Field label="Business name or domain idea"
              value={domainIdeaInput} onChangeText={(value)=>{
                setDomainIdeaInput(value);setShowDomainIdeas(false);
                setRegistrarStatus({domain:"",status:"idle",message:""});
              }} autoCapitalize="none" placeholder="e.g. Jenny's Hair Salon" />
            <Button label={showDomainIdeas?"Hide name ideas":"Show possible names (not availability)"}
              onPress={()=>setShowDomainIdeas(previous=>!previous)}
              disabled={!domainIdeaInput.trim()} />
            {showDomainIdeas ? (
              <>
                <Text style={styles.cardBody}>{domainIdeaPreview.message}</Text>
                {domainIdeaPreview.ideas.map(idea=>(
                  <React.Fragment key={idea.domain}>
                    <MetricRow left="Domain idea — not checked" right={idea.domain} />
                    <Text style={styles.cardBody}>{idea.claim}</Text>
                  </React.Fragment>
                ))}
                {firstDomainIdea ? (
                  <Button
                    label={registrarStatus.status==="loading"
                      ?"Checking registrar connection…"
                      :"Check if live domain search is connected"}
                    onPress={checkRegistrar}
                    disabled={registrarStatus.status==="loading"||!!s.websitePublishingAction}
                  />
                ) : null}
                {registrarStatus.domain===firstDomainIdea&&
                  registrarStatus.status!=="idle"&&
                  registrarStatus.status!=="loading" ? (
                  <Text style={styles.cardBody}>{registrarStatus.message}</Text>
                ) : null}
                <Text style={styles.cardBody}>
                  Before future domain purchases, BUSY must confirm genuine availability,
                  the full first charge, renewal costs, ownership terms and your explicit
                  payment approval. Searching here cannot register or buy a domain.
                </Text>
              </>
            ) : null}
          </>
        ) : null}
      </Card>
      {addressChoice==="existing"&&showDomainSetup ? (
        <>
      <Text style={styles.sectionLabel}>Connect a domain you own</Text>
      <Card
        eyebrow="Your own domain • one ownership check"
        title={view.domainState?.journey?.label || "Connect a domain you already own"}
        body={
          !domain
            ? "Enter the domain you want customers to use. BUSY first proves ownership with one TXT record; after that it prepares the Cloudflare hostname, SSL and route automatically."
            : view.domainState?.journey?.complete
            ? "BUSY has proved ownership, Cloudflare routing, HTTPS and the exact live website through this customer-owned domain."
            : view.domainState?.journey?.needsAttention
            ? "Your approved BUSY website remains safe. The custom-domain setup has been isolated to the stage shown below, and BUSY will keep the default BUSY address separate."
            : domain.status === "pending_verification"
            ? "Add the ownership TXT record below, then check ownership once. BUSY takes over the provider setup after that."
            : "Ownership is complete. BUSY is handling the Cloudflare hostname and SSL automatically; only the DNS records shown below still need to be added at the domain's DNS provider."
        }
        footer={
          view.domainState?.journey?.complete
            ? "Your existing domain has passed the required website connection checks."
            : "You can keep your current registrar and email service. BUSY never treats ownership, SSL, routing or live-site health as the same thing."
        }
        tone={
          view.domainState?.journey?.complete
            ? "green"
            : view.domainState?.journey?.needsAttention
            ? "amber"
            : "blue"
        }
      >
        <Text style={styles.sectionLabel}>{domainGuide.nextAction}</Text>
        {(view.domainState?.journey?.steps || []).map((step) => (
          <MetricRow
            key={step.id}
            left={step.label}
            right={
              step.status === "complete"
                ? "Done"
                : step.status === "working"
                ? "Checking…"
                : step.status === "error"
                ? "Needs attention"
                : "Waiting"
            }
            strong={step.status === "complete"}
          />
        ))}

        {!domain ? (
          <>
            <Field
              label="Domain"
              value={s.websiteDomainDraft}
              onChangeText={s.setWebsiteDomainDraft}
              autoCapitalize="none"
              placeholder="www.example.co.uk"
            />
            <Text style={styles.cardBody}>{domainGuide.explanation} Enter exactly the address customers should use. For example, www.example.co.uk and example.co.uk are separate hostnames.</Text>
            <Button
              label={s.websitePublishingAction === "domain" ? "Creating verification…" : "Connect my domain"}
              disabled={!s.websiteDomainDraft.trim() || !!s.websitePublishingAction}
              onPress={s.requestWebsiteDomain}
            />
          </>
        ) : (
          <>
            <MetricRow left="Domain" right={domain.hostname} strong />
            {domainGuide.records.map((record,index)=>(
              <React.Fragment key={record.type+":"+record.name+":"+index}>
                <Text style={styles.sectionLabel}>{record.label}</Text>
                <MetricRow left="Record type" right={record.type} />
                <MetricRow left="Record name" right={record.name} />
                <MetricRow left="Record value" right={record.value} />
              </React.Fragment>
            ))}
            {domainGuide.records.length>0 ? (
              <Text style={styles.cardBody}>{domainGuide.explanation}</Text>
            ) : null}
            {domain.status === "pending_verification" ? (
              <Button
                label={s.websitePublishingAction === `verify-domain:${domain.id}` ? "Checking ownership…" : "I've added the TXT record • check now"}
                disabled={!!s.websitePublishingAction}
                onPress={() => s.verifyWebsiteDomain(domain.id)}
              />
            ) : null}

            {domainGuide.records.length>0 ? (
              <Button label={dnsInspection.status==="loading"?"Checking public DNS…":"Check my DNS records (no changes)"}
                disabled={dnsInspection.status==="loading"||!!s.websitePublishingAction}
                onPress={checkDns} />
            ) : null}
            {dnsInspection.domainId===domain.id&&dnsInspection.status==="error" ? (
              <Text style={styles.cardBody}>{dnsInspection.error}</Text>
            ) : null}
            {dnsInspection.domainId===domain.id&&dnsInspection.status==="done" ? (
              <>
                <Text style={styles.sectionLabel}>{dnsInspection.result?.summary?.message||"DNS checked."}</Text>
                {(dnsInspection.result?.checks||[]).map((item,i)=>(
                  <Text key={item.type+":"+item.name+":"+i} style={styles.cardBody}>
                    {item.type+" "+item.name+": "+(item.status==="matching"?"Found":
                      item.status==="different"?"Different value":
                      item.status==="not-visible"?"Waiting":"Unable to check")+". "+item.message}
                  </Text>
                ))}
                <Text style={styles.cardBody}>Checking DNS does not activate hosting, prove HTTPS, or publish your website.</Text>
              </>
            ) : null}
            {domain.status !== "pending_verification" && !view.domainState?.journey?.complete ? (
              <Button
                label={
                  s.websitePublishingAction === `provision-domain:${domain.id}`
                    ? "Checking domain setup…"
                    : "Check domain setup now"
                }
                disabled={!!s.websitePublishingAction}
                onPress={() => s.provisionWebsiteDomain(domain.id)}
              />
            ) : null}

            {view.domainState?.journey?.lastError ? (
              <MetricRow left="Latest provider message" right={view.domainState.journey.lastError} />
            ) : null}

            {view.canOpenCustomDomain ? (
              <Button
                label="Open customer-owned website"
                primary
                onPress={s.openCustomWebsiteDomain}
              />
            ) : null}
          </>
        )}
      </Card>
        </>
      ) : null}
      {s.websitePublishingError ? (
        <Card
          eyebrow="Needs attention"
          title="Nothing unsafe was applied"
          body={s.websitePublishingError}
          tone="amber"
        />
      ) : null}

      {s.websitePublishingNotice ? (
        <Card
          eyebrow="Latest update"
          title={view.publicStatus || "Website management"}
          body={s.websitePublishingNotice}
          tone="blue"
        />
      ) : null}
      <Text style={styles.sectionLabel}>Preview and publish</Text>
      {preview && preview.id !== live?.id ? (
        <Card
          eyebrow="Go Live gate"
          title={`Publish v${preview.version_no}?`}
          body="This is the only public approval. BUSY will publish exactly the immutable hosted version you previewed, then automatically allocate/verify the BUSY address, Cloudflare route and live deployment health."
          footer="The current public version is retained as a rollback target. Infrastructure checks do not require another approval."
          tone="amber"
        >
          <MetricRow left="Change summary" right={preview.change_label || "Website update"} strong />
          <MetricRow left="Prepared" right={readableDate(preview.prepared_at, "Ready")} />
          <MetricRow left="Pages" right={String(preview.page_count || 1)} />
          <Text style={styles.sectionLabel}>{"Go Live safety: "+approvalGuide.next}</Text>
          <Text style={styles.sectionLabel}>
            Please open the exact hosted preview and confirm the business name,
            services, photographs, contact details and wording before approving.
            Viewing the editable phone preview alone is not enough.
          </Text>
          <Button
            label={openedHostedPreview===preview.id?
              "Hosted preview opened":"Open the exact hosted preview"}
            disabled={!!s.websitePublishingAction}
            onPress={inspectHostedPreview}
          />
          <Button
            label={reviewedHostedPreview===preview.id?
              "I've reviewed this exact preview ✓":"Confirm I reviewed this exact hosted preview"}
            disabled={openedHostedPreview!==preview.id||
              reviewedHostedPreview===preview.id||!!s.websitePublishingAction}
            onPress={()=>setReviewedHostedPreview(preview.id)}
          />
          <Button
            label={s.websitePublishingAction==="publish"?"Publishing…":
              s.websitePublishingAction==="preflight"?"Verifying hosted version…":
              "Review & approve Go Live"}
            primary
            disabled={!view.canPublish||!!s.websitePublishingAction||
              reviewedHostedPreview!==preview.id||!approvalGuide.readyForOwnerClick}
            onPress={() => s.confirmPublishHostedWebsite(preview.id)}
          />
        </Card>
      ) : null}
      {live ? (
        <>
          <Text style={styles.sectionLabel}>Live website health</Text>
          <Card
            eyebrow={`Live v${live.version_no}`}
            title={view.healthLabel || "Not checked yet"}
            body={
              view.healthStatus === "healthy"
                ? "BUSY reached the public site and confirmed it is serving the expected immutable deployment."
                : view.healthStatus === "degraded"
                ? "The site responded, but BUSY could not confirm that it is serving the expected deployment."
                : view.healthStatus === "down"
                ? "BUSY could not verify a healthy public response. The previous deployment records remain intact."
                : "The scheduled health worker will check the public site automatically. You can also run a check now."
            }
            footer={`Last checked: ${readableDate(website?.last_health_check_at)}`}
            tone={view.healthStatus === "healthy" ? "green" : view.healthStatus === "down" || view.healthStatus === "degraded" ? "amber" : "blue"}
          >
            <MetricRow left="Expected deployment" right={`v${live.version_no}`} strong />
            <MetricRow left="Last healthy" right={readableDate(website?.last_healthy_at)} />
            {view.latestHealth ? (
              <>
                <MetricRow left="HTTP" right={String(view.latestHealth.http_status || "No response")} />
                <MetricRow left="Response" right={`${Number(view.latestHealth.response_ms || 0)}ms`} />
              </>
            ) : null}
            <Button
              label={s.websitePublishingAction === "health" ? "Checking live site…" : "Check live site now"}
              disabled={!view.canCheckHealth || !!s.websitePublishingAction}
              onPress={s.runWebsiteHealthCheck}
            />
            <Button label="Open live website" primary onPress={s.openLiveWebsite} />
          </Card>
        </>
      ) : null}
      <Button
        label={showEnquiries ? "Hide customer enquiries" : "Customer enquiries"}
        onPress={() => toggleSection(setShowEnquiries)}
      />
      {showEnquiries ? (
        <>
      <Card eyebrow="V3.79 • Lead Capture & Follow-up"
        title="Turn real conversations into organised opportunities"
        body="This secure inbox distinguishes owner-entered contacts from verified website form submissions. Website analytics clicks are not named leads, and a manually marked booked label is not proof of payment or completed work. Public forms remain disabled until the security and hosting gates are explicitly activated."
        footer="Only an authorised business owner or admin can access this contact information."
        tone="blue">
        <MetricRow left="Website-attributed enquiry events"
          right={view.enquiryView?.count==null?"Not measured":
            String(view.enquiryView.count)+" events (not verified contacts)"}/>
        <MetricRow left="Recent leads (owner and website)"
          right={leads.scope===leadScope&&leads.result?
            String(leads.result.sampled)+" of up to 25":"Not measured"}/>
        <MetricRow left="Challenge-verified website contacts"
          right={leads.scope===leadScope&&leads.result?
            String(leads.result.trackedWebsiteContacts??0)+" recent sample":"Not measured"}/>
        <MetricRow left="Public contact form activation"
          right={website?.public_form_enabled===true?
            "Site opted in; platform readiness unverified":"Disabled"}/>
        <MetricRow left="New leads awaiting review"
          right={leads.scope===leadScope&&leads.result?
            String(leads.result.counts?.new??0):"Not measured"}/>
        <MetricRow left="Manually marked quoted"
          right={leads.scope===leadScope&&leads.result?
            String(leads.result.counts?.quoted??0):"Not measured"}/>
        <MetricRow left="Manually marked booked"
          right={leads.scope===leadScope&&leads.result?
            String(leads.result.counts?.booked??0):"Not measured"}/>
        <Button label={leads.status==="loading"?"Loading…":"Refresh private enquiries"}
          disabled={leads.status==="loading"||!!leadBusy} onPress={loadLeads}/>
        {leads.scope===leadScope&&leads.error?(
          <Text style={styles.sectionLabel}>{leads.error}</Text>
        ):null}
        {leads.scope===leadScope&&(leads.result?.recent||[]).slice(0,8).map(item=>(
          <Card key={item.id} eyebrow={"Enquiry • "+item.status}
            title={item.name||"Customer enquiry"} body={item.service||"Service not specified"}
            footer={item.nextStep} tone="blue">
            <MetricRow left="Recorded from"
              right={item.source==="website_form"?"Verified website form":"Entered by business"}/>
            <MetricRow left="Preferred contact" right={item.contactMethod}/>
            <MetricRow left="Contact details" right={item.contactValue}/>
            <MetricRow left="Message sent by BUSY" right="No"/>
            {item.replyDraft?.draft?(
              <Text style={styles.sectionLabel}>
                Suggested reply, NOT sent: {item.replyDraft.draft}
              </Text>
            ):null}
            {item.status==="new"?(
              <Button label="Mark as reviewing"
                disabled={!!leadBusy} onPress={()=>advanceLead(item,"reviewing")}/>
            ):item.status==="reviewing"?(
              <Button label="Mark as quoted (only after quoting)"
                disabled={!!leadBusy} onPress={()=>advanceLead(item,"quoted")}/>
            ):item.status==="quoted"?(
              <Button label="Mark as booked (only after confirmation)"
                disabled={!!leadBusy} onPress={()=>advanceLead(item,"booked")}/>
            ):null}
            {item.status!=="closed"?(
              <Button label="Close this enquiry"
                disabled={!!leadBusy} onPress={()=>advanceLead(item,"closed")}/>
            ):null}
          </Card>
        ))}
      </Card>
          <Button label={showNewEnquiry ? "Close new enquiry form" : "Record a customer enquiry"}
            onPress={() => toggleSection(setShowNewEnquiry)} />
          {showNewEnquiry ? (
            <>
      <Card eyebrow="V3.78 • Record a customer enquiry"
        title="Save an enquiry you have permission to follow up"
        body="Use this for an enquiry you have received through a legitimate business channel. Contact details remain private to your authorised workspace. BUSY won't send an automatic email or text."
        tone="blue">
        <Field label="Customer name" value={leadName} onChangeText={setLeadName}
          placeholder="Customer's name"/>
        <Button label={leadMethod==="email"?"Contact by email • switch to phone":"Contact by phone • switch to email"}
          onPress={()=>{setLeadMethod(leadMethod==="email"?"phone":"email");setLeadContact("");}}/>
        <Field label={leadMethod==="email"?"Email address":"Phone number"}
          value={leadContact} onChangeText={setLeadContact}
          autoCapitalize="none"
          keyboardType={leadMethod==="email"?"email-address":"phone-pad"}
          placeholder={leadMethod==="email"?"customer@example.co.uk":"07…"} />
        <Field label="Service requested (optional)" value={leadService}
          onChangeText={setLeadService} placeholder="e.g. gutter cleaning"/>
        <Button label={leadPermission?
          "✓ I confirm I have permission to contact this person":
          "Confirm permission to contact this person"}
          onPress={()=>setLeadPermission(!leadPermission)}/>
        <Button label={leadBusy==="saving"?"Saving privately…":"Save enquiry without sending"}
          primary disabled={!leadPermission||!leadName.trim()||
            !leadContact.trim()||!!leadBusy||!s.ownerSession?.userId||
            !s.cloudWorkspace?.businessId} onPress={saveLead}/>
        {leadMessage?(
          <Text style={styles.sectionLabel}>{leadMessage}</Text>
        ):null}
      </Card>
            </>
          ) : null}
        </>
      ) : null}
      <Button
        label={showTechnicalDetails ? "Hide advanced website details" : "Advanced hosting and technical details"}
        onPress={() => toggleSection(setShowTechnicalDetails)}
      />
      {showTechnicalDetails ? (
        <>
      <Card
        eyebrow="V3.77 • Website launch assistant"
        title={journey.isVerified?"BUSY has verified your live deployment":"Your launch journey"}
        body="BUSY helps you prepare an accurate draft, view its exact hosted version, approve publication and verify the result. You decide when anything becomes public."
        footer={journey.completedStages+" of "+journey.totalStages+
          " milestones complete • Your website is never automatically published"}
        tone={journey.isVerified?"green":"blue"}
      >
        {journey.stages.map(item=>(
          <MetricRow key={item.id} left={item.title}
            right={item.state==="complete"?"Done":
              item.state==="ready"?"Next":
              item.state==="needs_details"?"Needs facts":
              item.state==="working"?"Processing":"Pending"}/>
        ))}
        {journey.missingCoreFacts.length?(
          <Button label={"Review "+journey.missingCoreFacts.length+
            " missing business details"} onPress={s.openBrandIdentity}/>
        ):null}
      </Card>
      <Card eyebrow="V3.80 • Real-world launch proof"
        title={launchProof.verified?
          "The approved website passed delivery verification":
          "Publication still needs real-world verification"}
        body="These are actual deployment and hosting signals for this business, not a simulated website launch. Preparing a draft or hosted preview does not make it public."
        footer={launchProof.passed+" of "+launchProof.total+
          " launch checks supported by evidence • No automatic Go Live"}
        tone={launchProof.verified?"green":"blue"}>
        {launchProof.checks.map(check=>(
          <MetricRow key={check.id} left={check.label}
            right={check.ready?"Verified":"Not yet verified"}
            strong={check.ready}/>
        ))}
        <MetricRow left="Allocated BUSY hostname"
          right={launchProof.hostname||"Not allocated"}/>
        {!launchProof.verified&&missingDeliveryCheck?(
          <Text style={styles.sectionLabel}>
            {"Next missing check: "+missingDeliveryCheck.label+". "+missingDeliveryCheck.detail}
          </Text>
        ):null}
        <Text style={styles.sectionLabel}>{launchProof.note}</Text>
      </Card>
      <Card
        eyebrow="Website lifecycle"
        title={view.publicStatus || "Website status"}
        body={
          live
            ? view.draftChangedSinceHosted
              ? "Your public website is unchanged. BUSY has newer draft changes that can be prepared as a separate hosted version."
              : "The current approved version is live. Editing remains separate until another version is prepared and approved."
            : preview
            ? "A private hosted version is ready. Review exactly what changed before making anything public."
            : activeJob
            ? "BUSY is processing this website safely in the background."
            : "Build or edit the draft, then prepare a hosted preview."
        }
        footer="A draft edit never silently alters the live website."
        tone={website?.last_error ? "amber" : live ? "green" : "blue"}
      >
        <MetricRow left="Editor draft" right={s.websiteDraft ? `Generation ${s.websiteDraft.generation || 1}` : "None"} />
        <MetricRow left="Hosted preview" right={preview ? `v${preview.version_no}` : "None"} />
        <MetricRow left="Live version" right={live ? `v${live.version_no}` : "Not live"} strong={!!live} />
        <MetricRow left="Pages" right={String(view.pageCount || s.websiteDraft?.pages?.length || 1)} />
        {activeJob ? (
          <MetricRow left="Background work" right={`${activeJob.action} • ${activeJob.status}`} strong />
        ) : null}
        <Button
          label={s.websitePublishingAction === "prepare" ? "Preparing…" : preview && view.draftChangedSinceHosted ? "Prepare updated hosted preview" : "Prepare hosted preview"}
          primary={!!view.canPrepare}
          disabled={!view.canPrepare || !!s.websitePublishingAction}
          onPress={s.prepareHostedWebsite}
        />
        {preview ? (
          <Button
            label="Open exact hosted preview"
            disabled={!!s.websitePublishingAction}
            onPress={inspectHostedPreview}
          />
        ) : null}
        <Button
          label={s.websitePublishingLoading ? "Refreshing…" : "Refresh website status"}
          disabled={s.websitePublishingLoading}
          onPress={s.refreshWebsitePublishingStatus}
        />
      </Card>

      {live || !view.recoveryState?.healthy ? (
        <>
          <Text style={styles.sectionLabel}>Hosting intelligence & recovery</Text>
          <Card
            eyebrow={
              view.recoveryState?.ownerActionRequired
                ? "One owner action required"
                : view.recoveryState?.automatic
                ? "BUSY is handling this automatically"
                : "Continuous delivery protection"
            }
            title={view.recoveryState?.title || "Hosting status"}
            body={
              view.recoveryState?.message ||
              "BUSY monitors publishing, Cloudflare routing, SSL and the live website independently."
            }
            footer={
              view.recoveryState?.ownerActionRequired
                ? "Only the DNS change shown below needs you. BUSY continues the rest automatically."
                : view.recoveryState?.automatic
                ? "Retries are bounded and tenant-scoped so one business cannot create a retry storm for others."
                : "One failed check never takes a previously proven website offline."
            }
            tone={
              view.recoveryState?.healthy
                ? "green"
                : view.recoveryState?.ownerActionRequired
                ? "amber"
                : "blue"
            }
          >
            <MetricRow
              left="Affected area"
              right={
                view.recoveryState?.area === "publishing"
                  ? "Publishing"
                  : view.recoveryState?.area === "origin"
                  ? "Hosted live version"
                  : view.recoveryState?.area === "busy_domain"
                  ? "BUSY website address"
                  : view.recoveryState?.area === "custom_domain"
                  ? "Customer-owned domain"
                  : view.recoveryState?.area === "cloudflare"
                  ? "Cloudflare connection"
                  : "None"
              }
              strong={!view.recoveryState?.healthy}
            />
            <MetricRow
              left="Automatic recovery"
              right={
                view.recoveryState?.automatic
                  ? "Running"
                  : view.recoveryState?.ownerActionRequired
                  ? "Waiting for your DNS change"
                  : "Standing by"
              }
            />
            {view.recoveryState?.lastAttemptAt ? (
              <MetricRow
                left="Last recovery check"
                right={readableDate(view.recoveryState.lastAttemptAt)}
              />
            ) : null}
            {view.recoveryState?.nextRetryAt && view.recoveryState?.automatic ? (
              <MetricRow
                left="Next automatic retry"
                right={readableDate(view.recoveryState.nextRetryAt)}
              />
            ) : null}
            {view.recoveryState?.lastKnownGoodDeployment ? (
              <MetricRow
                left="Rollback safety"
                right={`v${view.recoveryState.lastKnownGoodDeployment.version_no} retained`}
                strong
              />
            ) : null}
            <Text style={styles.sectionLabel}>{recoveryCoach.message}</Text>
            {view.canRetrySafeRecovery ? (
              <Button
                label={
                  s.websitePublishingAction === "recover"
                    ? "Running safe recovery…"
                    : "Run safe recovery now"
                }
                disabled={!!s.websitePublishingAction||!recoveryCoach.retryAvailable}
                onPress={s.retryWebsiteRecovery}
              />
            ) : null}
          </Card>
        </>
      ) : null}

      <Text style={styles.sectionLabel}>Go Live journey</Text>
      <Card
        eyebrow="One approval • automatic delivery checks"
        title={view.goLiveJourney?.label || "Website delivery"}
        body={
          view.goLiveJourney?.complete
            ? "BUSY has proved the approved website version is public, the tenant-safe BUSY address reaches it through Cloudflare, and the exact immutable deployment is healthy."
            : view.goLiveJourney?.needsAttention
            ? "The approved website data remains safe. BUSY has isolated the stage that needs attention instead of treating every Go Live problem as the same error."
            : preview && !live
            ? "Review the hosted preview once. After owner approval, BUSY handles publication, address allocation, Cloudflare routing and health proof automatically."
            : live
            ? "The approved version is public. BUSY is completing the remaining delivery checks automatically and will only call the BUSY address live after real route proof."
            : "Prepare a hosted preview first. Nothing becomes public until you approve the exact immutable version."
        }
        footer={
          view.goLiveJourney?.complete
            ? "No Cloudflare dashboard work is required for the default BUSY address."
            : "Draft, preview, public version, routing and health remain separate facts."
        }
        tone={
          view.goLiveJourney?.complete
            ? "green"
            : view.goLiveJourney?.needsAttention
            ? "amber"
            : "blue"
        }
      >
        {(view.goLiveJourney?.steps || []).map((step) => (
          <MetricRow
            key={step.id}
            left={step.label}
            right={
              step.status === "complete"
                ? "Done"
                : step.status === "working"
                ? "Checking…"
                : step.status === "error"
                ? "Needs attention"
                : step.status === "ready"
                ? "Ready"
                : "Waiting"
            }
            strong={step.status === "complete"}
          />
        ))}
        {view.goLiveJourney?.complete && view.defaultAddressState?.address?.url ? (
          <Button label="Open public BUSY website" primary onPress={s.openDefaultWebsiteAddress} />
        ) : null}
      </Card>

      {preview ? (
        <>
          <Text style={styles.sectionLabel}>What changed in this version</Text>
          <Card
            eyebrow={`Hosted preview v${preview.version_no}`}
            title={preview.change_label || view.changeSummary?.headline || "Website update"}
            body={
              changes.length
                ? "BUSY stores this change summary with the immutable deployment, so version history remains understandable later."
                : "This deployment either predates stored change summaries or contains no material detected public-facing change."
            }
            footer={`${preview.page_count || 1} page${Number(preview.page_count || 1) === 1 ? "" : "s"} • source generation ${preview.source_generation || 1}`}
            tone="blue"
          >
            {changes.slice(0, 8).map((item, index) => (
              <MetricRow
                key={`${item.label || "change"}-${index}`}
                left={item.label || "Website change"}
                right={item.type === "added" ? "Added" : item.type === "removed" ? "Removed" : "Changed"}
              />
            ))}
          </Card>
        </>
      ) : null}


      <Text style={styles.sectionLabel}>SEO basics & page structure</Text>
      <Card
        eyebrow="Evidence-led SEO"
        title={view.seoAudit?.label || "SEO basics"}
        body="BUSY checks practical on-page basics using approved business information. It does not invent locations, services or keyword claims just to make an SEO score look better."
        footer={`${s.websiteDraft?.pages?.length || 1} structured page${Number(s.websiteDraft?.pages?.length || 1) === 1 ? "" : "s"} • LocalBusiness structured-data foundation`}
        tone={view.seoAudit?.passed === view.seoAudit?.total ? "green" : "blue"}
      >
        {seoChecks.map((check) => (
          <MetricRow
            key={check.id}
            left={check.label}
            right={check.pass ? "Ready" : "Needs information"}
            strong={check.pass}
          />
        ))}
      </Card>

      <Text style={styles.sectionLabel}>Shared public business profile</Text>
      <Card
        eyebrow="Website + future BUSY Apps"
        title={view.publicProfile ? `Public profile revision ${view.publicProfile.revision || 1}` : "Created when a hosted version is prepared"}
        body="Approved public facts are projected into one server-owned profile so BUSY websites and the future BUSY Mini-App marketplace can reuse the same services, contact details, branding and public assets."
        footer="The public profile is not the private Business Brain and is not exposed directly through the database API."
        tone={view.publicProfile?.status === "live" ? "green" : "blue"}
      >
        <MetricRow left="Profile state" right={view.publicProfile?.status || "Not prepared"} />
        <MetricRow left="Source" right={view.publicProfile?.source_deployment_id ? "Immutable website deployment" : "No hosted deployment"} />
      </Card>

      {(view.previouslyPublished || []).length ? (
        <>
          <Text style={styles.sectionLabel}>Version history & rollback</Text>
          {(view.previouslyPublished || []).slice(0, 8).map((deployment) => (
            <Card
              key={deployment.id}
              eyebrow={`Previously published • v${deployment.version_no}`}
              title={deployment.change_label || "Website version"}
              body={
                deployment.change_summary?.items?.length
                  ? deployment.change_summary.items
                      .slice(0, 3)
                      .map((item) => item.label)
                      .join(" • ")
                  : "Immutable previously published version retained for rollback."
              }
              footer={`${readableDate(deployment.published_at, "Published previously")} • ${deployment.page_count || 1} page${Number(deployment.page_count || 1) === 1 ? "" : "s"}`}
              tone="blue"
            >
              <Button
                label={s.websitePublishingAction === `rollback:${deployment.id}` ? "Restoring…" : `Restore v${deployment.version_no}`}
                disabled={!view.canRollback || !!s.websitePublishingAction}
                onPress={() => s.confirmRollbackWebsite(deployment.id, deployment.version_no)}
              />
            </Card>
          ))}
        </>
      ) : null}

      <Text style={styles.sectionLabel}>Real website signals</Text>
      <Card
        eyebrow="External traffic • last 30 days"
        title={
          view.analyticsView?.collecting
            ? "Real delivery signals are being collected"
            : view.providerState?.configured
            ? "Cloudflare connected • waiting for routed traffic"
            : "BUSY collector ready • Cloudflare connection required"
        }
        body={
          view.analyticsView?.collecting
            ? "These figures come from the external delivery/analytics provider and are aggregated into BUSY by tenant. They are not generated estimates."
            : view.providerState?.configured
            ? "BUSY can read provider traffic, but no active BUSY-routed hostname has produced a provider rollup yet."
            : "The traffic collector and database rollups are live, but Cloudflare credentials/zone setup are still the external account gate. BUSY records zero rather than inventing traffic."
        }
        footer={`Last provider sync: ${readableDate(view.analyticsView?.lastSyncAt)}`}
        tone={view.analyticsView?.collecting ? "green" : "blue"}
      >
        <MetricRow left="HTTP requests" right={String(view.analyticsView?.requests || 0)} />
        <MetricRow left="Visits" right={String(view.analyticsView?.visits || 0)} />
        <MetricRow left="Edge transfer" right={readableBytes(view.analyticsView?.edgeBytes || 0)} />
        <MetricRow
          left="Attributed enquiries"
          right={String(view.enquiryView?.count || 0)}
          strong={Number(view.enquiryView?.count || 0) > 0}
        />
        <Button
          label={s.websitePublishingAction === "signals" ? "Refreshing signals…" : "Refresh real signals"}
          disabled={!!s.websitePublishingAction}
          onPress={s.refreshWebsiteSignals}
        />
      </Card>

      <Text style={styles.sectionLabel}>BUSY platform activation</Text>
      <Card
        eyebrow="busydoesit.co.uk • live DNS preflight"
        title={
          view.providerState?.activationReady
            ? "Cloudflare production routing active"
            : view.providerState?.activationApplied
            ? "Cloudflare routing configured • activation finishing"
            : view.providerState?.rootOnCloudflare
            ? view.providerState?.configured
              ? "Cloudflare connected • BUSY is activating production routing"
              : "Cloudflare nameservers active • account connection required"
            : "Waiting for the new nameservers to propagate"
        }
        body={
          view.providerState?.activationReady
            ? "BUSY has independently confirmed the production DNS target, fallback origin, routing Worker and Worker routes. Customer domains and SSL still keep their own separate verification states."
            : view.providerState?.activationApplied
            ? "BUSY has applied the production routing configuration and Cloudflare is finishing activation. The scheduled provider reconciler will keep checking without recreating working infrastructure."
            : view.providerState?.rootOnCloudflare && view.providerState?.configured
            ? "The restricted Cloudflare credentials are connected. BUSY now activates the routing DNS, fallback origin and Worker automatically through the scheduled provider reconciler."
            : view.providerState?.rootOnCloudflare
            ? "BUSY can see the platform domain on Cloudflare, but the restricted server credentials are not complete yet."
            : "BUSY independently checks the public nameservers before it attempts any production routing change; no customer website is declared live from configuration alone."
        }
        footer={`Last DNS preflight: ${readableDate(view.providerState?.checkedAt)}`}
        tone={view.providerState?.rootOnCloudflare ? "green" : "blue"}
      >
        <MetricRow
          left="Automatic activation"
          right={
            view.providerState?.activationReady
              ? "Active"
              : view.providerState?.activationApplied
              ? "Applied • Cloudflare finishing"
              : view.providerState?.activationStatus === "credentials_required"
              ? "Waiting for credentials"
              : view.providerState?.activationStatus === "waiting_for_nameservers"
              ? "Waiting for nameservers"
              : "Ready to reconcile"
          }
          strong={view.providerState?.activationReady}
        />
        <MetricRow
          left="Root domain"
          right={view.providerState?.rootDomain || "busydoesit.co.uk"}
          strong
        />
        <MetricRow
          left="Cloudflare nameservers"
          right={view.providerState?.rootOnCloudflare ? "Active" : "Propagating"}
          strong={view.providerState?.rootOnCloudflare}
        />
        <MetricRow
          left="BUSY site suffix"
          right={view.providerState?.baseDomain || "busydoesit.co.uk"}
        />
        <MetricRow
          left="SaaS CNAME target"
          right={view.providerState?.cnameHost || "sites.busydoesit.co.uk"}
        />
        <MetricRow
          left="Routing target DNS"
          right={view.providerState?.baseDomainRoutable ? "Resolving" : "Not routed yet"}
          strong={view.providerState?.baseDomainRoutable}
        />
        <MetricRow
          left="Cloudflare for SaaS"
          right={view.providerState?.configured ? "Server configuration ready" : "Account connection still required"}
          strong={view.providerState?.configured}
        />
        <MetricRow
          left="Fallback origin"
          right={
            view.providerState?.fallbackOriginStatus === "active"
              ? "Active"
              : view.providerState?.fallbackOriginStatus === "not_connected"
              ? "Not connected"
              : view.providerState?.fallbackOriginStatus || "Not configured"
          }
          strong={view.providerState?.fallbackOriginStatus === "active"}
        />
        <MetricRow
          left="Routing Worker"
          right={
            view.providerState?.routerScriptReady && view.providerState?.routerRouteReady
              ? "Deployed & routed"
              : view.providerState?.routerScriptReady
              ? "Deployed • route pending"
              : "Not deployed yet"
          }
          strong={view.providerState?.routerScriptReady && view.providerState?.routerRouteReady}
        />
        <MetricRow
          left="BUSY root / www"
          right={view.providerState?.rootRoutesExcluded ? "Excluded from SaaS router" : "Exclusions pending"}
          strong={view.providerState?.rootRoutesExcluded}
        />
      </Card>

      <Text style={styles.sectionLabel}>Delivery provider</Text>
      <Card
        eyebrow="Provider-neutral BUSY layer"
        title={view.providerState?.label || "External delivery not configured"}
        body={
          view.providerState?.configured
            ? "BUSY has the restricted server-side Cloudflare configuration and V3.47 now reconciles the production routing layer automatically. Customer hostname activation, certificate state and real-route health remain independently verified."
            : "The V3.47 adapter independently preflights the platform DNS and waits safely until the restricted Cloudflare server credentials are complete. No secret belongs in the app or GitHub."
        }
        footer="Cloudflare is the first adapter, not the BUSY data model. Another delivery provider can be added behind the same states later."
        tone={view.providerState?.configured ? "green" : "blue"}
      >
        <MetricRow left="API token" right={view.providerState?.tokenReady ? "Server secret ready" : "Not connected"} />
        <MetricRow left="SaaS zone" right={view.providerState?.zoneReady ? "Ready" : "Not connected"} />
        <MetricRow left="Cloudflare account" right={view.providerState?.accountReady ? "Server value ready" : "Not connected"} />
        <MetricRow
          left="Platform bootstrap"
          right={
            view.providerState?.activationReady
              ? "Production routing active"
              : view.providerState?.activationApplied
              ? "Applied • activation pending"
              : view.providerState?.bootstrapReady
              ? "Automatic reconciler ready"
              : "Waiting for account credentials"
          }
          strong={view.providerState?.activationReady}
        />
        <MetricRow left="Routing target" right={view.providerState?.targetReady ? "Ready" : "Not connected"} />
        <MetricRow left="BUSY web domain" right={view.providerState?.baseDomainConfigured ? view.providerState.baseDomain : "Not configured"} />
      </Card>

      <Text style={styles.sectionLabel}>Default BUSY website address</Text>
      <Card
        eyebrow="Automatic tenant address"
        title={view.defaultAddressState?.address?.hostname || view.defaultAddressState?.status || "Not reserved yet"}
        body={
          view.defaultAddressState?.address?.live
            ? "BUSY has independently proved this tenant-safe address is serving the exact approved live deployment through Cloudflare."
            : view.defaultAddressState?.address
            ? live
              ? "The address is reserved and BUSY is automatically checking the real Cloudflare route. It is not labelled live until the deployment marker is observed through this hostname."
              : "BUSY has reserved the address now so it is ready for route verification as soon as the owner publishes a website version."
            : "V3.48 automatically reserves a tenant-safe first-level BUSY address and moves it through route proof after publication. No business can become live merely because a hostname was allocated."
        }
        footer="Two businesses with the same trading name still receive different tenant-safe hostnames."
        tone={view.defaultAddressState?.address?.live ? "green" : view.defaultAddressState?.status?.includes("attention") ? "amber" : "blue"}
      >
        <MetricRow left="Address state" right={view.defaultAddressState?.status || "Not configured"} strong={view.defaultAddressState?.address?.live} />
        {view.defaultAddressState?.address?.live ? (
          <Button label="Open BUSY website address" primary onPress={s.openDefaultWebsiteAddress} />
        ) : null}
      </Card>

      <Text style={styles.sectionLabel}>Website usage & cost signals</Text>
      <Card
        eyebrow="Last 30 days • per business"
        title="Usage is measurable before scale arrives"
        body="BUSY now rolls up deployment work, generated artifact bytes, provider requests/visits/egress, health checks and active custom domains per tenant. This is the foundation for evidence-based fair-use limits and pricing."
        footer="Growth should mean increasing capacity and predictable variable cost, not rebuilding the platform."
        tone="blue"
      >
        <MetricRow left="Deployments created" right={String(view.usageView?.deployments || 0)} />
        <MetricRow left="Versions published" right={String(view.usageView?.publishedVersions || 0)} />
        <MetricRow left="Generated artifacts" right={readableBytes(view.usageView?.artifactBytes || 0)} />
        <MetricRow left="Provider egress" right={readableBytes(view.usageView?.edgeBytes || 0)} />
        <MetricRow left="Health checks" right={String(view.usageView?.healthChecks || 0)} />
        <MetricRow left="Active custom domains" right={String(view.usageView?.activeCustomDomains || 0)} />
      </Card>

      <Text style={styles.sectionLabel}>Enquiry attribution</Text>
      <Card
        eyebrow="Only genuine events count"
        title={
          view.enquiryView?.hasRealAttribution
            ? `${view.enquiryView.count} attributed website enquir${view.enquiryView.count === 1 ? "y" : "ies"}`
            : "Attribution pipeline ready • no events recorded"
        }
        body={
          view.enquiryView?.hasRealAttribution
            ? "BUSY has real website enquiry-attribution events for this tenant. These can later be joined to customer journeys without treating clicks or visits as enquiries."
            : "V3.47 has the tenant-safe attribution store ready, but the current static website does not silently add a public enquiry form or tracking event. BUSY will only count a real enquiry when an approved public enquiry module/provider emits one."
        }
        footer="Traffic, visits and enquiries remain separate evidence."
        tone={view.enquiryView?.hasRealAttribution ? "green" : "blue"}
      />


      <Text style={styles.sectionLabel}>Publishing infrastructure</Text>
      <Card
        eyebrow="Tenant-fair production queue"
        title={view.queueHealth?.status || "Queue not checked"}
        body="Publishing remains durable server-side work. V3.52 leases each job atomically, allows only one active website operation at a time and spreads worker capacity fairly across businesses."
        footer="Duplicate taps, stale workers and one unusually busy tenant cannot silently create concurrent website changes."
        tone={view.queueHealth?.status === "Backlog needs attention" ? "amber" : "green"}
      >
        <MetricRow left="Waiting jobs" right={String(view.queueHealth?.length || 0)} />
        <MetricRow left="Oldest waiting" right={view.queueHealth?.oldestSeconds == null ? "None" : readableSeconds(view.queueHealth.oldestSeconds)} />
        <MetricRow left="Tenant fairness" right={view.queueHealth?.tenantFair ? "Active" : "Not checked"} strong={!!view.queueHealth?.tenantFair} />
        <MetricRow left="Concurrent website changes" right={view.queueHealth?.oneOperationPerWebsite ? "Blocked" : "Not checked"} strong={!!view.queueHealth?.oneOperationPerWebsite} />
        {view.queueHealth?.activeLeaseUntil ? (
          <MetricRow left="Current worker lease" right={readableDate(view.queueHealth.activeLeaseUntil)} />
        ) : null}
        <MetricRow left="Jobs seen" right={String(view.queueHealth?.totalMessages || 0)} />
      </Card>

      <Card
        eyebrow="Hosting, subscriptions & cancellation"
        title="Your website and your subscription are different things"
        body="BUSY can prepare a website and set up a hosted preview without claiming payment has been taken. A verified subscription billing and entitlement system is not connected here yet. Therefore website access is not automatically suspended when a subscription ends."
        footer="Customers should keep ownership of domains they own. Export, cancellation notices, grace periods and hosting access rules need to be finalised before paid launch."
        tone="blue">
        <MetricRow left="Verified paid subscription" right="Not yet connected"/>
        <MetricRow left="Automatic cancellation suspension" right="Disabled"/>
        <MetricRow left="Live website updates" right="Always require approval"/>
      </Card>

        </>
      ) : null}
      <Button label="Website Builder" onPress={() => s.go("websiteBuilder")} />
      <Button label="Back to Home" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

export { WebsitePublishing };
