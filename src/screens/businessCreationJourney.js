import React from "react";
import { Alert, Text } from "react-native";

import { styles } from "../theme/styles";
import { Shell, Card, Button, Field, MetricRow } from "../components/ui";
import { miniAppModuleLabel } from "../domain/miniApps";
import { reviewConversation } from "../domain/conversationUnderstanding.mjs";
import { assessBusinessCreationReadiness } from "../domain/businessCreationReadiness.mjs";
import { confirmedServices, buildCoordinatedGrowthPlan } from "../domain/coordinatedGrowthPlan.mjs";
import { prepareCoordinatedGrowthDrafts, isCurrentGrowthDraftPack, editGrowthDraft } from "../domain/coordinatedGrowthDrafts.mjs";
import { applyCoordinatedWebsiteCopy } from "../domain/websiteBuilder";
import {keyOf,createGrowthProject,workspaceProgress,editGrowthProject,reviewGrowthProject,markGrowthHandedOff,reconcileGrowthProject,rebaseGrowthProject} from "../domain/growthProjectWorkspace.mjs";
import {listGrowthProjects,loadGrowthProject,saveGrowthProject} from "../domain/growthProjectCloud.mjs";

function BusinessCreationJourney({ s }) {
  const [growthServiceFocus, setGrowthServiceFocus] = React.useState("");
  const [growthDraftPack, setGrowthDraftPack] = React.useState(null);
  const [growthDraftNotice, setGrowthDraftNotice] = React.useState("");
  const [growthProject, setGrowthProject] = React.useState(null);
  const [growthProjectScope, setGrowthProjectScope] = React.useState("");
  const [growthCloudRevision, setGrowthCloudRevision] = React.useState(null);
  const [growthCloudBusy, setGrowthCloudBusy] = React.useState(false);
  const [growthCloudNotice, setGrowthCloudNotice] = React.useState("");
  const [savedGrowthProjects, setSavedGrowthProjects] = React.useState([]);
  const journey = s.businessCreationJourney || {};
  const conversationReview = reviewConversation({
    turns: [s.businessCreationBrief],
    approved: s.businessCreationIntelligence?.sharedProfile || {},
  });
  const proposedFacts = Object.entries(conversationReview.draft);
  const approvedProfile = s.businessCreationIntelligence?.sharedProfile || {};
  const growthServices = confirmedServices(approvedProfile);
  const growthPlan = buildCoordinatedGrowthPlan({approved:approvedProfile,focusService:growthServiceFocus});
  const candidateDraftPack = prepareCoordinatedGrowthDrafts({
    approved: approvedProfile,
    focusService: growthServiceFocus,
    ownerId: s.ownerSession?.userId || "",
    businessId: s.cloudWorkspace?.businessId || "",
  });
  const isDraftPackCurrent = isCurrentGrowthDraftPack(growthDraftPack, candidateDraftPack);

  const growthScope=[s.ownerSession?.userId||"",s.cloudWorkspace?.businessId||"",keyOf(growthServiceFocus)].join("|");
  const currentGrowthScopeRef=React.useRef(growthScope);
  currentGrowthScopeRef.current=growthScope;
  React.useEffect(()=>{
    setGrowthProject(null);setGrowthProjectScope("");setGrowthDraftPack(null);
    setGrowthCloudRevision(null);setSavedGrowthProjects([]);setGrowthCloudNotice("");
  },[growthScope]);
  const activeProject=growthProjectScope===growthScope?growthProject:null;
  const growthReconciliation=activeProject?reconcileGrowthProject(activeProject,candidateDraftPack):null;
  const projectedGrowth=growthReconciliation?.project||null;
  const projectProgress=workspaceProgress(projectedGrowth);
  const projectStale=!!growthReconciliation?.stale;
  const canManageCloud=!!candidateDraftPack.valid && !!s.cloudWorkspace?.businessId && !growthCloudBusy;

  const prepareGrowthWorkspace=()=>{
    if(!candidateDraftPack.valid)return;
    setGrowthDraftPack(candidateDraftPack);
    setGrowthProject(createGrowthProject(candidateDraftPack));
    setGrowthProjectScope(growthScope);
    setGrowthCloudRevision(null);
    setGrowthDraftNotice("Review each draft, mark it reviewed, then hand it to a private editor. Saving to cloud is separate.");
  };
  const editWorkspaceCopy=(target,text)=>{
    setGrowthDraftPack(current=>editGrowthDraft(current,target,text));
    setGrowthProject(current=>editGrowthProject(current,target,text));
  };
  const prepareLoadedProject=(project,revision,scope)=>{
    if(currentGrowthScopeRef.current!==scope)return;
    const result=reconcileGrowthProject(project,candidateDraftPack);
    if(!result.valid||result.needsNewSelection){
      setGrowthCloudNotice("Saved project does not match this confirmed service. No local draft replaced.");
      return;
    }
    const adjusted=result.project;
    setGrowthProject(adjusted);setGrowthProjectScope(scope);setGrowthCloudRevision(revision);
    setGrowthDraftPack({...candidateDraftPack,items:candidateDraftPack.items.map(item=>({
      ...item,text:adjusted.items.find(saved=>saved.target===item.target)?.text||"",ownerEdited:true,
    }))});
    setGrowthCloudNotice(result.stale
      ?"Project loaded. Approved facts changed; acknowledge latest facts and review each channel again."
      :"Private project loaded. Separate publication approval is still required.");
  };
  const loadGrowthWorkspace=async()=>{
    if(!canManageCloud)return;
    const scope=growthScope;setGrowthCloudBusy(true);
    try{
      const args=await s.growthProjectCloudArgs();
      if(scope!==currentGrowthScopeRef.current||args.userId!==s.ownerSession?.userId||args.businessId!==s.cloudWorkspace?.businessId)return;
      const record=await loadGrowthProject(args,growthServiceFocus);
      if(scope!==currentGrowthScopeRef.current)return;
      if(!record){setGrowthCloudNotice("No saved project for this service. Local edits remain untouched.");return;}
      if(activeProject){
        Alert.alert("Replace local growth project?",
          "Cloud loading replaces unsaved changes on this device. Continue?",[
          {text:"Keep local edits",style:"cancel"},
          {text:"Load cloud project",onPress:()=>prepareLoadedProject(record.project,record.revision,scope)},
        ]);
      }else prepareLoadedProject(record.project,record.revision,scope);
    }catch(e){if(scope===currentGrowthScopeRef.current)setGrowthCloudNotice("Could not load project. Device edits remain untouched.");}
    finally{if(scope===currentGrowthScopeRef.current)setGrowthCloudBusy(false);}
  };
  const saveGrowthWorkspace=async()=>{
    if(!canManageCloud||!activeProject||projectStale)return;
    const scope=growthScope;setGrowthCloudBusy(true);
    try{
      const args=await s.growthProjectCloudArgs();
      if(scope!==currentGrowthScopeRef.current||args.userId!==s.ownerSession?.userId||args.businessId!==s.cloudWorkspace?.businessId)return;
      const result=await saveGrowthProject(args,activeProject,growthCloudRevision);
      if(scope!==currentGrowthScopeRef.current)return;
      if(result.saved){setGrowthCloudRevision(result.revision);setGrowthCloudNotice("Private project saved to BUSY cloud. Load it on another signed-in device.");}
      else setGrowthCloudNotice(result.reason||"Save rejected. Load newer project first.");
    }catch(e){if(scope===currentGrowthScopeRef.current)setGrowthCloudNotice("Could not save to cloud. Device edits remain untouched.");}
    finally{if(scope===currentGrowthScopeRef.current)setGrowthCloudBusy(false);}
  };
  const browseGrowthWorkspaces=async()=>{
    if(!s.ownerSession?.userId||!s.cloudWorkspace?.businessId||growthCloudBusy)return;
    const scope=growthScope;setGrowthCloudBusy(true);
    try{
      const args=await s.growthProjectCloudArgs();
      if(scope!==currentGrowthScopeRef.current)return;
      const rows=await listGrowthProjects(args);
      if(scope===currentGrowthScopeRef.current){
        setSavedGrowthProjects(rows);
        setGrowthCloudNotice(rows.length?"Select a saved service, then load its project.":"No saved growth projects yet.");
      }
    }catch(e){if(scope===currentGrowthScopeRef.current)setGrowthCloudNotice("Could not list cloud projects. No changes made.");}
    finally{if(scope===currentGrowthScopeRef.current)setGrowthCloudBusy(false);}
  };
  const markWorkspaceReviewed=target=>{
    if(!activeProject||projectStale)return;
    const updated=reviewGrowthProject(activeProject,target,candidateDraftPack);
    if(updated){setGrowthProject(updated);setGrowthCloudNotice("Marked reviewed locally. Save privately to keep this status across devices.");}
  };
  const acceptUpdatedGrowthFacts=()=>{
    if(!activeProject||!candidateDraftPack.valid)return;
    const updated=rebaseGrowthProject(activeProject,candidateDraftPack);
    if(!updated)return;
    setGrowthProject(updated);
    setGrowthDraftPack({...candidateDraftPack,items:candidateDraftPack.items.map(item=>({
      ...item,text:updated.items.find(i=>i.target===item.target)?.text||"",
    }))});
    setGrowthCloudNotice("Latest confirmed facts acknowledged. Wording preserved; each channel needs a new review.");
  };


  const handOffGrowthCopy = async (target) => {
    if(growthCloudBusy)return;
    if(!isCurrentGrowthDraftPack(growthDraftPack,candidateDraftPack) || projectStale){
      setGrowthDraftNotice("Confirmed facts changed. Review the current project again before handing off.");
      return;
    }
    const item=growthDraftPack.items.find(entry=>entry.target===target);
    const updated=activeProject && markGrowthHandedOff(activeProject,target,candidateDraftPack);
    if(!updated || !item || item.status!=="editable_draft" || !String(item.text||"").trim() ||
       activeProject.items.find(i=>i.target===target)?.text!==item.text){
      setGrowthDraftNotice("Mark this exact current wording Reviewed before handing it to a private editor.");
      return;
    }
    // Check that the existing private website editor can accept the change
    // *before* writing a 'handed_off' cloud checkpoint.
    const websiteResult=target==="website" ? applyCoordinatedWebsiteCopy({
      draft:s.websiteDraft,approved:approvedProfile,
      serviceName:growthDraftPack.serviceName,text:item.text,
    }) : null;
    if(websiteResult && !websiteResult.applied){
      setGrowthDraftNotice(websiteResult.reason);
      return;
    }
    const scope=growthScope;
    setGrowthCloudBusy(true);
    try{
      const args=await s.growthProjectCloudArgs();
      if(scope!==currentGrowthScopeRef.current ||
         args.userId!==s.ownerSession?.userId || args.businessId!==s.cloudWorkspace?.businessId)return;
      const result=await saveGrowthProject(args,updated,growthCloudRevision);
      if(scope!==currentGrowthScopeRef.current)return;
      if(!result.saved){
        setGrowthDraftNotice(result.reason||"Private checkpoint was not saved. No handoff occurred.");
        return;
      }
      setGrowthCloudRevision(result.revision);
      setGrowthProject(updated);
      setGrowthDraftPack(current=>current ? {
        ...current,items:current.items.map(entry=>entry.target===target?{...entry,handedOff:true}:entry),
      }:current);
      if(target==="website"){
        s.setWebsiteDraft(websiteResult.draft);
        setGrowthDraftNotice("Private website draft updated, and progress saved. Check the preview; nothing is public.");
      }else if(target==="business_app"){
        s.setMiniAppBuildBrief(item.text);
        s.openMiniAppBuilder();
      }else if(target==="social"){
        s.startSocialFromPhone();
        s.setSocialBrief(item.text);
      }
      setGrowthCloudNotice("Private handoff progress saved. No channel has been published.");
    }catch(e){
      if(scope===currentGrowthScopeRef.current)
        setGrowthDraftNotice("Cloud checkpoint unavailable. No handoff performed; device edits remain intact.");
    }finally{
      if(scope===currentGrowthScopeRef.current)setGrowthCloudBusy(false);
    }
  };
  const readiness = assessBusinessCreationReadiness({approved:s.businessCreationIntelligence?.sharedProfile || {},ai:s.conversationAiDraft || {}});
  const steps = Array.isArray(journey.steps) ? journey.steps : [];
  const appModules = Array.isArray(journey.recommendedAppModules) ? journey.recommendedAppModules : [];
  const websiteSections = Array.isArray(journey.recommendedWebsiteSections) ? journey.recommendedWebsiteSections : [];
  const dependencies = Array.isArray(journey.dependencies) ? journey.dependencies : [];
  const nextQuestion = journey.nextQuestion || null;
  const launchPack = journey.launchPack || {};
  const propagationTargets = Array.isArray(journey.propagation?.targets) ? journey.propagation.targets : [];

  return (
    <Shell
      s={s}
      title="Build my business with BUSY"
      subtitle="One guided conversation now coordinates the website, Business App and social setup, asks only the next useful question, and parks anything blocked without stopping the rest."
      brandCue="V3.64 • cloud growth projects • safe reviews • independent publishing approvals."
    >
      <Card
        eyebrow="V3.61 • confirmed information only"
        title={readiness.ready + " of " + readiness.total + " business essentials confirmed"}
        body={readiness.next ? "Next to confirm: " + readiness.next + ". AI suggestions do not count until you approve them." : "Core profile details are confirmed. Publishing still needs separate approval."}
        tone="blue"
      >
        <MetricRow left="Confirmed readiness" right={readiness.percent + "%"} />
        <Text style={styles.sectionLabel}>Suggested next action: {readiness.nextAction.guidance}</Text>
        {readiness.nextAction.action === "describe_business" ? (
          <Button label="Describe the missing detail by voice" onPress={s.describeBusinessCreationByVoice} />
        ) : null}
        {readiness.checks.map(check => <MetricRow key={check.id} left={check.label} right={check.ready ? "Confirmed" : "Needs review"} />)}
      </Card>
      <Card
        eyebrow="V3.62 • coordinated growth planner"
        title="One confirmed service, three coordinated improvements"
        body="Select a service from your confirmed business profile. BUSY prepares a separate website, customer-app and marketing plan without changing anything or posting online."
        footer="Preview only. Each customer-facing change must be reviewed and approved separately."
        tone="blue"
      >
        {growthServices.length ? (
          <>
            <Text style={styles.sectionLabel}>Choose a confirmed service:</Text>
            {growthServices.slice(0, 8).map(service => (
              <Button
                key={"growth-select-" + service.name}
                label={(growthPlan.valid && growthPlan.service.name === service.name ? "Selected: " : "Plan updates for: ") + service.name.slice(0, 65)}
                onPress={() => setGrowthServiceFocus(service.name)}
              />
            ))}
            {growthServices.length > 8 ? (
              <Text style={styles.sectionLabel}>Showing the first 8 confirmed services. Additional services remain in your business profile.</Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.sectionLabel}>First confirm at least one customer-facing service in your shared business profile. Unverified AI suggestions do not count.</Text>
        )}
        {growthPlan.valid ? (
          <>
            <MetricRow left="Service being reviewed" right={growthPlan.service.name} />
            <MetricRow left="Actions ready for review" right={String(growthPlan.reviewable) + " of " + String(growthPlan.actions.length)} />
            {growthPlan.nextBlockers.map(blocker => (
              <MetricRow
                key={"growth-blocker-" + blocker.key}
                left={"Confirm next: " + blocker.label}
                right={"Unblocks " + blocker.impactedCount + " area" + (blocker.impactedCount === 1 ? "" : "s")}
              />
            ))}
            {growthPlan.actions.map(action => (
              <React.Fragment key={action.id}>
                <MetricRow left={action.label} right={action.status === "blocked" ? "Missing details" : "Ready to review"} />
                <Text style={styles.sectionLabel}>{action.task}</Text>
                <Text style={styles.sectionLabel}>{action.note}</Text>
                {action.blockedBy.length ? (
                  <Text style={styles.sectionLabel}>Needs confirmed: {action.blockedBy.join(", ").replace(/_/g, " ")}</Text>
                ) : null}
              </React.Fragment>
            ))}
            {(s.businessCreationIntelligence?.alignment || []).map(item => (
              <Text key={"growth-alignment-" + item.id} style={styles.sectionLabel}>
                Existing draft mismatch to review: {item.message}
              </Text>
            ))}
            <Text style={styles.sectionLabel}>{growthPlan.notice}</Text>
          </>
        ) : null}
      </Card>
      <Card
        eyebrow="V3.64 • private growth project workspace"
        title="Prepare once, edit each customer-facing draft"
        body="BUSY prepares factual copy from a confirmed service. Review and edit each draft, then choose where to send it. Nothing here automatically posts, enables app features or changes a public website."
        footer="Use Save to keep reviewed wording in your private cloud project. No progress status here means a website, app or social post was published."
        tone="blue"
      >
        <Button
          label={isDraftPackCurrent ? "Start fresh drafts" : "Prepare growth project"}
          disabled={!candidateDraftPack.valid}
          onPress={() => {
            if(activeProject) Alert.alert("Start fresh local project?",
              "This replaces unsaved local wording. Your cloud checkpoint is left unchanged until you save.",[
                {text:"Keep current",style:"cancel"},{text:"Start fresh",onPress:prepareGrowthWorkspace},
              ]);
            else prepareGrowthWorkspace();
          }}
        />
        <MetricRow left="Private drafts reviewed" right={projectProgress.reviewed+" of "+projectProgress.total} />
        <MetricRow left="Passed to private editors" right={String(projectProgress.handedOff)} />
        <MetricRow left="Needs fact review" right={String(projectProgress.needsReview)} />
        <Button label={growthCloudBusy?"Cloud working…":"Show saved growth projects"} disabled={growthCloudBusy||!s.cloudWorkspace?.businessId} onPress={browseGrowthWorkspaces} />
        {savedGrowthProjects.map(saved=><Button key={"growth-saved-"+saved.service_key}
          label={"Saved: "+saved.service_name+" (revision "+saved.revision+")"}
          onPress={()=>setGrowthServiceFocus(saved.service_name)} />)}
        <Button label="Load this service's private cloud project" disabled={!canManageCloud} onPress={loadGrowthWorkspace} />
        <Button label="Save growth project to BUSY cloud" disabled={!canManageCloud||!activeProject||projectStale} onPress={saveGrowthWorkspace} />
        {growthCloudRevision!=null?<MetricRow left="Loaded cloud revision" right={String(growthCloudRevision)} />:null}
        {growthCloudNotice?<Text style={styles.sectionLabel}>{growthCloudNotice}</Text>:null}
        {projectStale?(
          <>
            <Text style={styles.sectionLabel}>Confirmed facts changed. Existing wording is preserved, but old reviews are no longer valid.</Text>
            <Button label="Accept latest confirmed facts; re-review each draft" disabled={!candidateDraftPack.valid} onPress={acceptUpdatedGrowthFacts} />
          </>
        ):null}
        {!candidateDraftPack.valid ? (
          <Text style={styles.sectionLabel}>{candidateDraftPack.notice}</Text>
        ) : null}
        {growthDraftPack && !isDraftPackCurrent ? (
          <Text style={styles.sectionLabel}>Business details, account or selected service changed. Older drafts are hidden. Regenerate to work from approved information.</Text>
        ) : null}
        {isDraftPackCurrent && activeProject ? growthDraftPack.items.map(item => (
          <React.Fragment key={"growth-copy-" + item.target}>
            <MetricRow
              left={item.label}
              right={projectedGrowth?.items.find(i=>i.target===item.target)?.status?.replace(/_/g," ") || "Editable draft"}
            />
            {item.status === "blocked" ? (
              <Text style={styles.sectionLabel}>Confirm first: {item.blockedBy.join(", ").replace(/_/g, " ")}</Text>
            ) : (
              <>
                <Field
                  label={item.label + " wording"}
                  value={item.text}
                  onChangeText={text => {if(!growthCloudBusy)editWorkspaceCopy(item.target,text);}}
                  multiline
                />
                <Button
                  label={projectedGrowth?.items.find(i=>i.target===item.target)?.status==="reviewed"?"Reviewed • edit to revise":"Mark this wording reviewed"}
                  disabled={projectStale || !String(item.text||"").trim() ||
                    ["blocked","needs_review"].includes(projectedGrowth?.items.find(i=>i.target===item.target)?.status)}
                  onPress={()=>markWorkspaceReviewed(item.target)}
                />
                {item.target === "website" ? (
                  <Button
                    label={s.websiteDraft ? "Apply to private website draft" : "Open Website Builder to create a draft first"}
                    disabled={!String(item.text || "").trim()}
                    onPress={() => s.websiteDraft ? handOffGrowthCopy("website") : s.openWebsiteBuilder()}
                  />
                ) : item.target === "business_app" ? (
                  <Button label="Review in Business App planner" disabled={!String(item.text || "").trim()} onPress={() => handOffGrowthCopy("business_app")} />
                ) : (
                  <Button label="Review in Social Media Creator" disabled={!String(item.text || "").trim()} onPress={() => handOffGrowthCopy("social")} />
                )}
              </>
            )}
          </React.Fragment>
        )) : null}
        {growthDraftNotice && candidateDraftPack.valid ? (
          <Text style={styles.sectionLabel}>{growthDraftNotice}</Text>
        ) : null}
      </Card>
      <Card
        eyebrow="Business Creation Orchestrator"
        title={journey.headline || "Tell BUSY what this business should become"}
        body="Describe the outcome once. BUSY prepares what it safely can, identifies the next missing decision, and keeps public actions behind their existing approval gates."
        footer="Nothing is published from this journey."
        tone="green"
      >
        {s.conversationResumeNotice ? (
          <Text style={styles.sectionLabel}>{s.conversationResumeNotice}</Text>
        ) : null}
        <Field
          label="What are you building?"
          value={s.businessCreationBrief}
          onChangeText={s.setBusinessCreationBrief}
          placeholder="e.g. Build a friendly local website, a customer app for service and booking requests, and a social presence that matches the business."
          multiline
        />
        <Button
          label={s.businessCreationAction === "prepare" ? "Preparing launch pack…" : "Prepare everything"}
          primary
          disabled={!String(s.businessCreationBrief || "").trim() || !!s.businessCreationAction}
          onPress={s.prepareBusinessCreationJourney}
        />
        <Button label="Describe it by voice" disabled={!!s.businessCreationAction} onPress={s.describeBusinessCreationByVoice} />
        {s.businessCreationConversationActive ? <Button label="Finish business voice conversation" onPress={() => s.setBusinessCreationConversationActive(false)} /> : null}
        <Text style={styles.sectionLabel}>AI review sends your business description to the AI service to suggest unconfirmed details. Nothing is published. Limit: 20 reviews per business owner per day.</Text>
        <Button label={s.conversationAiBusy ? "BUSY is reading your description…" : "Suggest details with AI"} disabled={!!s.conversationAiBusy || !String(s.businessCreationBrief || "").trim()} onPress={s.suggestBusinessFactsWithAi} />
        {s.conversationAiNotice ? <Text style={styles.sectionLabel}>{s.conversationAiNotice}</Text> : null}
        {(s.conversationAiDraft?.transcript === String(s.businessCreationBrief || "").trim().slice(0, 3000) ? (s.conversationAiDraft?.services || []) : []).map((item, index) => (
          <React.Fragment key={"ai-service-" + index}>
            <MetricRow left="Possible service (unconfirmed)" right={item.name} />
            <Text style={styles.sectionLabel}>Evidence: {item.evidence}. Review your public services separately before adding.</Text>
          </React.Fragment>
        ))}
        {Object.entries(s.conversationAiDraft?.transcript === String(s.businessCreationBrief || "").trim().slice(0, 3000) ? (s.conversationAiDraft?.fields || {}) : {}).map(([key, item]) => (
          <React.Fragment key={"ai-" + key}>
            <MetricRow left={"AI suggests: " + key} right={item.value} />
            <Text style={styles.sectionLabel}>From: {item.evidence}</Text>
            {["businessName","serviceArea","email","phone"].includes(key) ? (
              <Button label={"Confirm AI suggestion: " + key} onPress={() => s.confirmConversationFact(key, item.value)} />
            ) : null}
          </React.Fragment>
        ))}

        <Text style={styles.sectionLabel}>Private cloud drafts support up to 6,000 characters. On-device recovery currently retains only the first 1,000; use Save private cloud draft for longer descriptions. AI reviews the first 3,000 characters.</Text>
        <Text style={styles.sectionLabel}>Cloud draft sync (private account; manual load/save)</Text>
        <Button label="Load private cloud draft" disabled={!!s.conversationCloudBusy} onPress={s.loadConversationFromCloud} />
        <Button label="Save private cloud draft" disabled={!!s.conversationCloudBusy || !String(s.businessCreationBrief || "").trim()} onPress={s.saveConversationToCloud} />
        <Button label="Delete saved cloud draft" disabled={!!s.conversationCloudBusy} onPress={s.deleteConversationFromCloud} />

      </Card>

      {String(s.businessCreationBrief || "").trim() ? (
        <Card
          eyebrow="V3.60 • conversation understanding (preview)"
          title="What BUSY heard from your description"
          body="These are unconfirmed suggestions only. Nothing here changes the shared business profile or publishes anything. Confirm important details through the existing questions below."
          tone="blue"
        >
          {proposedFacts.map(([key, item]) => (
            <React.Fragment key={key}>
              <MetricRow left={key} right={String(item.value || "").slice(0, 72)} />
              {["businessName", "serviceArea", "email", "phone"].includes(key) ? (
                <Button label={`Confirm ${key}`} onPress={() => s.confirmConversationFact(key, item.value)} />
              ) : null}
            </React.Fragment>
          ))}
          {conversationReview.suggestions.map((item) => (
            <MetricRow key={item.value} left="Possible industry (unconfirmed)" right={item.value} />
          ))}
          {conversationReview.nextQuestion ? (
            <Text style={styles.sectionLabel}>Suggested next question: {conversationReview.nextQuestion.question}</Text>
          ) : null}
        </Card>
      ) : null}

      {nextQuestion ? (
        <Card
          eyebrow="BUSY asks one thing at a time"
          title={nextQuestion.question}
          body={nextQuestion.helper}
          footer="Answering this updates the shared business profile, so the same fact can flow into every builder."
          tone="amber"
        >
          {nextQuestion.answerType === "navigate_services" ? (
            <Button label="Review public services" primary onPress={s.answerBusinessCreationQuestion} />
          ) : (
            <>
              <Field
                label="Your answer"
                value={s.businessCreationAnswer}
                onChangeText={s.setBusinessCreationAnswer}
                multiline={nextQuestion.answerType === "multiline"}
                placeholder="Type the answer BUSY should remember"
              />
              <Button label="Save and continue" primary onPress={s.answerBusinessCreationQuestion} />
            </>
          )}
        </Card>
      ) : (
        <Card
          eyebrow="Next question"
          title="No important setup question is blocking BUSY"
          body="BUSY has enough approved business information to keep preparing the launch pack."
          tone="green"
        />
      )}

      <Card
        eyebrow="Launch-pack review"
        title={`${Number(journey.readyCount || 0)} of ${Number(journey.totalSteps || steps.length || 0)} stages prepared`}
        body="This is the single review point for the business-building journey. Each customer-facing surface still has its own final approval."
        tone="blue"
      >
        {steps.map((step) => (
          <MetricRow
            key={step.id}
            left={step.label}
            right={step.status === "complete" ? "Ready" : step.status === "working" ? "In progress" : step.status === "ready" ? "Ready to prepare" : "Waiting"}
            strong={step.status === "complete"}
          />
        ))}
        <Text style={styles.sectionLabel}>Prepared surfaces</Text>
        <MetricRow left="Website" right={launchPack.website?.status || "Not prepared"} strong={!!launchPack.website?.prepared} />
        <MetricRow left="Business App" right={launchPack.businessApp?.status || "Not prepared"} strong={!!launchPack.businessApp?.prepared} />
        <MetricRow left="Social" right={launchPack.social?.status || "Not prepared"} strong={!!launchPack.social?.prepared} />
      </Card>

      <Card
        eyebrow="Dependencies"
        title={journey.blockedDependencies?.length ? `${journey.blockedDependencies.length} item${journey.blockedDependencies.length === 1 ? "" : "s"} parked for later` : "No external blockers"}
        body="A missing connection no longer stops BUSY preparing the rest of the business. It only blocks the action that genuinely depends on it."
        tone={journey.blockedDependencies?.length ? "amber" : "green"}
      >
        {dependencies.map((item) => (
          <MetricRow
            key={item.id}
            left={item.label}
            right={item.blocked ? `Parked • ${item.requiredFor}` : "Ready"}
            strong={!item.blocked}
          />
        ))}
      </Card>

      <Card
        eyebrow="Keep everything consistent"
        title={journey.propagation?.needsPropagation ? "BUSY found shared-profile changes to carry across" : "Current drafts are aligned"}
        body="When core business facts change, BUSY checks which private surfaces were built from older information before preparing coordinated updates."
        tone={journey.propagation?.needsPropagation ? "amber" : "green"}
      >
        {propagationTargets.map((item) => (
          <MetricRow key={item.id} left={item.label} right={item.needsRefresh ? "Refresh recommended" : "Aligned"} strong={!item.needsRefresh} />
        ))}
        {journey.propagation?.needsPropagation ? (
          <Button label="Prepare coordinated updates" primary onPress={s.propagateBusinessCreationChanges} />
        ) : null}
      </Card>

      <Card
        eyebrow="BUSY's starting plan"
        title="Shared recommendations"
        body="These recommendations are based on approved business facts. They guide preparation but never override the owner."
      >
        <Text style={styles.sectionLabel}>Business App</Text>
        {appModules.slice(0, 8).map((key) => (
          <MetricRow key={`app-${key}`} left={miniAppModuleLabel(key)} right="Suggested" />
        ))}
        <Text style={styles.sectionLabel}>Website</Text>
        {websiteSections.slice(0, 8).map((key) => (
          <MetricRow key={`web-${key}`} left={String(key || "").replaceAll("_", " ")} right="Suggested" />
        ))}
      </Card>

      {s.businessCreationNotice ? (
        <Card eyebrow="BUSY" title="Launch pack updated" body={s.businessCreationNotice} tone="green" />
      ) : null}
      {s.businessCreationError ? (
        <Card eyebrow="Needs attention" title="BUSY could not finish that step" body={s.businessCreationError} tone="amber" />
      ) : null}

      {s.websiteDraft ? <Button label="Review website draft" onPress={() => s.go("websitePreview")} /> : null}
      {s.miniAppsView?.builderPlan || s.miniAppsView?.hasDraft ? <Button label="Review Business App plan" onPress={s.openMiniAppBuilder} /> : null}
      {String(s.socialBrief || "").trim() ? <Button label="Open Social Media Creator" onPress={() => s.go("socialCreator")} /> : null}
      <Button label="Back to Home" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

export { BusinessCreationJourney };
