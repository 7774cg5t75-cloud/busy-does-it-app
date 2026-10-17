import {BusinessContentEditor} from './businessContentEditor';
import {coordinatedWebsiteAlternatives} from "../core/websiteCoordinatedAlternatives.mjs";
import {beginWebsiteMeasurementAttempt,currentWebsiteMeasurementAttempt} from "../core/websiteMeasurementAttempt.mjs";
import {currentWebsiteDesignCandidate,privateWebsiteReviewProgress} from "../core/privateWebsiteReviewProgress.mjs";
import React from "react";
import { Text, TextInput, View, Alert } from "react-native";
import { WebView } from "react-native-webview";

import { styles } from "../theme/styles";
import { Shell, Card, Button, Field, MetricRow, StatusChip } from "../components/ui";
import { buildWebsiteLaunchJourney } from "../core/websiteLaunchJourney";
import { buildWebsiteLaunchProof } from "../core/websiteLaunchProof.mjs";
import { websiteQualityGuidance } from "../core/websiteQualityGuidance.mjs";
import {GOALS as SHARED_GOALS,reviewSharedCustomerGoal} from "../core/sharedCustomerExperience.mjs";
import {websiteEvidenceSummary} from "../core/crossBuilderEvidence.mjs";
import {reviewBusinessInformation,reviewEnquiryContentGaps} from "../core/businessInfoClarity.mjs";
import {compareMeasuredWebsiteCandidates}
  from "../core/designEvidencePriorities.mjs";
import {prepareDeviceReview}
  from "../core/deviceReviewEvidence.mjs";
import {prepareOwnerImprovementPlan}
  from "../core/ownerImprovementPlan.mjs";
import {prepareBusinessBrainWork}
  from "../core/businessBrainWorkQueue.mjs";
import {currentPreparedWebsiteRevision} from "../core/websiteBrainChoiceContract.mjs";
import { websiteDesignAlternative } from "../core/websiteDesignAlternatives.mjs";
import { websiteCustomerJourney } from "../core/websiteCustomerJourney.mjs";
import { websiteOutcomeGuidance } from "../core/websiteOutcomeGuidance.mjs";
import { websiteJourneyAssurance } from "../core/websiteJourneyAssurance.mjs";
import { websiteOnboardingCoach } from "../core/websiteOnboardingCoach.mjs";
import { websiteBrainCoaching } from "../core/websiteBrainCoaching.mjs";
import { websiteRegionalReadiness } from "../core/websiteRegionalReadiness.mjs";
import { websiteDecisionEvidence } from "../core/websiteDecisionEvidence.mjs";
import { renderWebsiteHtml,applyWebsiteLayoutChange } from "../domain/websiteBuilder";
import {recommendMeasuredWebsiteChange,compareWebsiteVisualReports,ownerDesignPreference,describeWebsiteDesignComparison} from "../core/websiteMeasuredDesignCoach.mjs";
import {WebsiteContentEditor} from "./websiteContentEditor";
import {WebsiteAppServiceCopy} from "./websiteAppServiceCopy";
import {WebsiteAppBrandMatch} from "./websiteAppBrandMatch";
import {WebsiteAppTypographyMatch} from "./websiteAppTypographyMatch";
import {BusinessBrandDnaPreview} from "./businessBrandDnaPreview";
import {WebsiteAppHandoffReview} from "./websiteAppHandoffReview";
import {UniversalBuilderPlanReview} from "./universalBuilderPlanReview";
import {AppToWebsiteDesignTransfer} from "./appToWebsiteDesignTransfer";
import {WebsiteLayoutControls} from "./websiteLayoutControls";
import {WebsitePagesEditor} from "./websitePagesEditor";
import {WebsiteTapEditor} from "./websiteTapEditor";
import {WebsiteSelectedVoice} from "./websiteSelectedVoice";
import {beginWebsiteConversation,addWebsiteConversationTurn,websiteConversationContext} from "../core/websiteDesignConversation.mjs";
import {makeTapToEditHtml,resolveTapToolbarAction} from "../core/websiteTapToEdit.mjs";
import {classifyWidth,recordWebsiteViewportEvidence,summarizeWebsiteViewportEvidence,reviewWebsiteViewportPortfolio} from "../core/websiteViewportEvidence.mjs";
import {withWebsitePreviewViewport,websitePreviewWidthNote} from "../core/websiteResponsivePreview.mjs";
import {makeWebsiteVisualCheckHtml,reviewWebsiteVisualCheck,CHANNEL as VISUAL_CHECK_CHANNEL} from "../core/websiteVisualCheck.mjs";
import {recordPrivateWebsiteCandidateWidthV3239,reviewPrivateWebsiteCandidateWidthsV3239}
 from "../core/privateWebsiteCandidateWidthV3239.mjs";
import {inspectCurrentWebsiteCandidateV3240}
 from "../core/websiteCurrentCandidateV3240.mjs";

function WebsiteBuilder({ s }) {
  const draft = s.websiteDraft;
  const brand = s.brandBrain || {};
  const [instruction, setInstruction] = React.useState("");
  const [showWebsiteDetails, setShowWebsiteDetails] = React.useState(false);
  const [showJourneyIdeas,setShowJourneyIdeas]=React.useState(false);
  const [sharedJourneyGoal,setSharedJourneyGoal]=React.useState("enquire");
  const [webBrainHistory,setWebBrainHistory]=React.useState(null);
  const [webBrainNotice,setWebBrainNotice]=React.useState("");
  const [webBrainSaving,setWebBrainSaving]=React.useState(false);
  const [showQualityIdeas, setShowQualityIdeas] = React.useState(false);
  const [showDesignReview, setShowDesignReview] = React.useState(false);
  const [designOptionIndex,setDesignOptionIndex]=React.useState(0);
  const [showCustomization, setShowCustomization] = React.useState(false);
  const [showVisualAi, setShowVisualAi] = React.useState(false);
  const [aiStudio,setAiStudio]=React.useState(null);
  const [aiStudioChoice,setAiStudioChoice]=React.useState(0);
  const [aiStudioShowOriginal,setAiStudioShowOriginal]=React.useState(false);
  const [aiStudioWidth,setAiStudioWidth]=React.useState("phone");
  const [designPasses,setDesignPasses]=React.useState(2);
  const [aiStudioNotice,setAiStudioNotice]=React.useState("");
  const [showOutcomeFeedback,setShowOutcomeFeedback]=React.useState(false);
  const [feedbackState,setFeedbackState]=React.useState({status:"idle",message:""});
  const [savedStylePreferences,setSavedStylePreferences]=React.useState(null);
  const feedbackBusy=React.useRef(null),feedbackScopeRef=React.useRef(null),feedbackAlive=React.useRef(true);
  const feedbackKey=[s.ownerSession?.userId,s.cloudWorkspace?.businessId,draft?.id,draft?.generation].join(":");
  if(feedbackScopeRef.current?.key!==feedbackKey){feedbackScopeRef.current={key:feedbackKey};feedbackBusy.current=null;}
  const feedbackScope=feedbackScopeRef.current;
  React.useEffect(()=>{feedbackAlive.current=true;return()=>{feedbackAlive.current=false;};},[]);
  React.useEffect(()=>{
    setAiStudio(null);setAiStudioNotice("");setAiStudioShowOriginal(false);
  },[draft?.id,draft?.generation,s.websiteVisualReview?.reviewId]);
  const hostedPreview = s.websitePublishingView?.previewDeployment || null;
  const hostedPreviewOutdated = !!s.websitePublishingView?.draftChangedSinceHosted;
  const webBrainRevision=currentPreparedWebsiteRevision({
    draft,hostedPreview,draftChangedSinceHosted:hostedPreviewOutdated
  });
  React.useEffect(()=>{
    let active=true;
    setWebBrainHistory(null);setWebBrainNotice("");
    if(showJourneyIdeas&&webBrainRevision.ok&&
       typeof s.getWebsiteBrainOwnerDecisions==="function"){
      s.getWebsiteBrainOwnerDecisions().then(response=>{
        if(!active)return;
        if(response?.ok&&response.deploymentId===hostedPreview?.id&&
           response.draftId===draft?.id&&
           response.revision===draft?.generation&&
           response.businessId===s.cloudWorkspace?.businessId)
          setWebBrainHistory(response);
        else setWebBrainNotice(response?.reason||
          "Website preference storage is not yet available.");
      }).catch(error=>{
        if(active)setWebBrainNotice(String(error?.message||
          "Could not load saved website decisions.").slice(0,180));
      });
    }
    return ()=>{active=false;};
  },[showJourneyIdeas,draft?.id,draft?.generation,
     hostedPreview?.id,s.cloudWorkspace?.businessId,hostedPreviewOutdated]);
  const deliveryProof=buildWebsiteLaunchProof({
    ...(s.websitePublishingView||{}),websiteDraftPresent:!!draft
  });
  const journey=buildWebsiteLaunchJourney({
    brand, draft, publishing:s.websitePublishingView,deliveryProof
  });
  const missingDeliveryCheck=deliveryProof.checks.find(check=>!check.ready);
  const qualityGuide = websiteQualityGuidance({ brandBrain: brand, draft });
  const sharedJourneyReport=draft?reviewSharedCustomerGoal({
    goal:sharedJourneyGoal,websiteDraft:draft,brandBrain:brand,
    websiteJourney:journey,websitePublishing:s.websitePublishingView,
    websiteProof:deliveryProof
  }):null;
  const websiteClarity=draft?reviewBusinessInformation({
    websiteDraft:draft,brandBrain:brand
  }):null;
  const ownerImprovementPlan=draft?prepareOwnerImprovementPlan({
    goal:sharedJourneyGoal,websiteDraft:draft,brandBrain:brand,
    websiteRevision:draft.generation||0
  }):null;
  const businessBrainQueue=draft?prepareBusinessBrainWork({
    businessId:s.cloudWorkspace?.businessId||"",
    goal:sharedJourneyGoal,websiteDraft:draft,brandBrain:brand,
    websiteRevision:draft.generation||0,
    ownerDecisions:webBrainHistory?.businessId===s.cloudWorkspace?.businessId&&
      webBrainHistory?.deploymentId===hostedPreview?.id&&
      webBrainHistory?.draftId===draft?.id&&
      webBrainHistory?.revision===draft?.generation?
        webBrainHistory.records:[]
  }):null;
  const websiteDevicePlan=draft?prepareDeviceReview({
    businessId:s.cloudWorkspace?.businessId||"",
    surface:"website",draftId:draft.id||"",
    revision:draft.generation||0
  }):null;
  const regional=websiteRegionalReadiness({
    locale:brand?.websiteBrief?.locale||"",
    currency:brand?.websiteBrief?.currency||"",
    timeZone:brand?.websiteBrief?.timeZone||"",
    countryCode:brand?.websiteBrief?.countryCode||""
  });
  const designAlternative=websiteDesignAlternative(draft,{
    likedFamilies:savedStylePreferences?.likedFamilies||[],
    rejectedFamilies:savedStylePreferences?.rejectedFamilies||[]
  });
  React.useEffect(()=>{
    let active=true;
    setSavedStylePreferences(null);
    if(draft?.id&&typeof s.readWebsiteDesignFeedback==="function"){
      s.readWebsiteDesignFeedback().then(value=>{
        if(active&&value?.scope==="current_business_only")
          setSavedStylePreferences(value);
      }).catch(()=>{if(active)setSavedStylePreferences(null);});
    }
    return()=>{active=false;};
  },[draft?.id,s.cloudWorkspace?.businessId,s.ownerSession?.userId]);
  const outcomeGuidance=websiteOutcomeGuidance(savedStylePreferences,{
    currentFamily:draft?.theme?.designFamily||draft?.designPlan?.family||"",
    currentRevision:String(draft?.generation||1)
  });
  const designChoices=designAlternative.options||[];
  const selectedStyle=designChoices.length?designChoices[designOptionIndex%designChoices.length]:null;
  const brainCoach=websiteBrainCoaching({
    summary:savedStylePreferences,
    alternative:{suggested:selectedStyle},quality:qualityGuide
  });
  const decisionEvidence=websiteDecisionEvidence({
    summary:savedStylePreferences,option:selectedStyle,quality:qualityGuide,
    currentBusinessId:s.cloudWorkspace?.businessId||"",
    authorizedBusinessId:s.cloudWorkspace?.businessId||""
  });
  React.useEffect(()=>setDesignOptionIndex(0),
    [draft?.id,draft?.theme?.designFamily,draft?.designPlan?.family]);
  const customerJourney=websiteCustomerJourney({
    journey,publishing:s.websitePublishingView,proof:deliveryProof,hasDraft:!!draft
  });
  const assurance=websiteJourneyAssurance({
    journey,publishing:s.websitePublishingView,proof:deliveryProof,hasDraft:!!draft
  });
  const onboarding=websiteOnboardingCoach({brand,journey,draft});
  const nextStep=()=>{
    // Use the SAME evidence-backed decision as the visible next-step text.
    // A newer private draft must not lead customers straight to the old live site.
    switch(assurance.action){
      case "brand":return s.openBrandIdentity();
      case "build":return s.buildWebsiteFromBrandBrain();
      case "wait":
      case "prepare":return s.openWebsitePublishing();
      case "review":return assurance.hostedPreviewReady&&hostedPreview?.id
        ? s.openHostedWebsitePreview(hostedPreview.id)
        : s.openWebsitePublishing();
      case "verify":
      case "maintain":return s.openWebsitePublishing();
      default:return s.openBrandIdentity();
    }
  };
  const nextLabel={
    brand:"Complete business details",
    build:"Build my first draft",
    wait:"Check website preparation",
    prepare:"Prepare the hosted version",
    review:"Review my hosted website",
    verify:"Check my live website",
    maintain:"Manage my live website"
  }[assurance.action]||"Continue website setup";

  const sendDesignPreference=async(choice)=>{
    if(feedbackBusy.current||!draft?.id)return;
    if(feedbackScopeRef.current!==feedbackScope||!feedbackAlive.current)return;
    const task={};feedbackBusy.current=task;
    const current=()=>feedbackAlive.current&&feedbackScopeRef.current===feedbackScope;
    setFeedbackState({status:"saving",message:""});
    try{
      const receipt=await s.recordWebsiteDesignFeedback(choice);
      if(!current())return;
      if(receipt?.ok!==true)throw Error("Private feedback was not confirmed.");
      const updated=await s.readWebsiteDesignFeedback().catch(()=>null);
      if(!current())return;
      if(updated?.scope==="current_business_only")
        setSavedStylePreferences(updated);
      setFeedbackState({status:"saved",
        message:"Saved privately for this business. BUSY can use your preferences in future improvements; it has not retrained any AI model."});
    }catch{
      if(!current())return;
      setFeedbackState({status:"unavailable",
        message:"BUSY could not save your preference to the business workspace yet. Nothing has been shared."});
    }finally{if(feedbackBusy.current===task)feedbackBusy.current=null;}
  };
  const clearPreferences=async()=>{
    if(feedbackBusy.current)return;
    if(feedbackScopeRef.current!==feedbackScope||!feedbackAlive.current)return;
    const task={};feedbackBusy.current=task;
    const current=()=>feedbackAlive.current&&feedbackScopeRef.current===feedbackScope;
    setFeedbackState({status:"saving",message:""});
    try{
      const receipt=await s.clearWebsiteDesignFeedback();
      if(!current())return;
      if(receipt?.ok!==true||receipt.cleared!==true)throw Error("Private feedback clearing was not confirmed.");
      setSavedStylePreferences(null);
      setFeedbackState({status:"cleared",message:"Private style preferences cleared for this business."});
    }catch{
      if(!current())return;
      setFeedbackState({status:"unavailable",message:"BUSY could not confirm preferences were cleared. No shared learning was enabled."});
    }finally{if(feedbackBusy.current===task)feedbackBusy.current=null;}
  };
  const applyInstruction = () => {
    const text = instruction.trim();
    if (!text) return;
    const applied = s.applyWebsiteChange(text);
    if (applied) setInstruction("");
  };

  return (
    <Shell
      s={s}
      title="Website Builder"
      subtitle="Tell BUSY about your business, preview your website and make it your own."
      brandCue="BUSY DOES IT • Website Builder"
    >
      <BusinessContentEditor key={['records',s.ownerSession?.userId,s.cloudWorkspace?.businessId].join(':')}
        businessId={s.cloudWorkspace?.businessId} request={s.businessContentRequest}
        onCompose={(_,choice)=>s.applyWebsiteFieldChange(choice.remove?{action:'remove-content-section',sectionId:choice.kind==='product'?'products':'events'}:{action:'content-section',sectionId:choice.kind==='product'?'products':'events',title:choice.kind==='product'?'Products':'Upcoming events',layout:choice.layout,featuredId:choice.featuredId,previewFeed:choice.previewFeed})}/>
      <Card eyebrow="Your website"
        title={journey.isVerified ? "Your website is live and verified" :
          s.websitePublishingView?.liveDeployment ? "Website published • connection being verified" :
          draft ? "Your website is ready to edit" : "Let's create your website"}
        body={draft
          ? "Ask BUSY to make changes, check the preview, then choose whether to publish. Your current live website stays unchanged until you approve a new version."
          : "BUSY uses your real business information to create a draft. You can review and change everything before anything is made public."}
        footer="You always approve before anything goes public"
        tone={journey.isVerified ? "green" : "blue"}>
        <MetricRow left="Business information"
          right={brand.websiteReady ? "Ready" : "Needs a quick check"} />
        <MetricRow left="Website draft" right={draft ? "Ready" : "Not built yet"} />
        {draft?.designPlan ? (
          <Text style={[styles.cardBody, { marginTop: 8 }]}>
            {draft.designPlan.explanation}
          </Text>
        ) : null}
        <MetricRow left="Public website" right={journey.isVerified ? "Verified" :
          s.websitePublishingView?.liveDeployment ? "Checking connection" : "Not published"} />
        <Text style={styles.cardBody}>
          {"Next: "+assurance.title+". "+assurance.detail}
        </Text>
        <MetricRow left="Website journey"
          right={assurance.progress.completed+" / "+assurance.progress.total+" steps complete"}/>
        <Text style={styles.cardBody}>{customerJourney.message}</Text>
        {!draft||brand.websiteReady!==true?(
          <Text style={styles.cardBody}>{onboarding.message}</Text>
        ):null}
        <Button label={nextLabel} primary onPress={nextStep} />
        <Button label="Choose a website address (optional)" onPress={s.openWebsitePublishing} />
        <Button label={draft ? "Make changes by talking to BUSY" : "Build it by talking to BUSY"}
          onPress={draft ? s.askBusyToEditWebsite : s.askBusyToBuildWebsite} />
        {draft ? (
          <Button label="Preview my website draft" onPress={() => s.go("websitePreview")} />
        ) : null}
        {hostedPreview?.id ? (
          <Button label={hostedPreviewOutdated?
            "View previous hosted version (not latest)":"View my hosted website again"}
            primary={!hostedPreviewOutdated && journey.nextAction !== "brand"}
            onPress={() => s.openHostedWebsitePreview(hostedPreview.id)} />
        ) : null}
        {hostedPreviewOutdated ? (
          <Text style={styles.cardBody}>
            Your saved hosted preview is an earlier version. Prepare a new preview after your edits when you're ready.
          </Text>
        ) : null}
      </Card>
      <UniversalBuilderPlanReview surface="website"
        businessId={s.cloudWorkspace?.businessId||""}
        businessType={draft?.businessType||brand?.websiteBrief?.businessType||s.trade||""}
        website={draft} app={s.miniAppsView?.app}
        catalog={s.miniAppsView?.catalog||s.miniAppsStatus?.catalog||[]}
        initialGoal={brand?.websiteBrief?.description||""}
        onApplyWebsiteComposition={s.applyWebsiteLayoutAction}/>
      {draft?(
        <Card eyebrow="V3.172 • Customer experience"
          title="Make it easier for customers"
          body="BUSY reviews what a visitor needs to do. These are private suggestions, not proof that forms or bookings work."
          footer="You remain in control of changes and publication."
          tone="blue">
          <Button label={showJourneyIdeas?
              "Hide customer experience ideas":"What should my website help customers do?"}
            onPress={()=>setShowJourneyIdeas(x=>!x)}/>
          {showJourneyIdeas?(
            <>
              {SHARED_GOALS.map(goal=>(
                <Button key={"web-goal-"+goal}
                  label={(sharedJourneyGoal===goal?"✓ ":"")+({
                    book:"Request bookings",enquire:"Send enquiries",
                    services:"Understand services",photos:"View photos",
                    offers:"Find offers",rewards:"See loyalty rewards"
                  }[goal])}
                  onPress={()=>setSharedJourneyGoal(goal)}/>
              ))}
              {sharedJourneyReport?.ok?(
                <>
                  <Text style={styles.cardBody}>
                    {sharedJourneyReport.websiteAction.instruction}
                  </Text>
                  {sharedJourneyReport.findings.map(item=>(
                    <View key={"web-finding-"+item.id}>
                      <MetricRow left={item.title}
                        right={item.priority==="important"?"Needs checking":"Suggestion"}/>
                      <Text style={styles.cardBody}>{item.ownerAction}</Text>
                    </View>
                  ))}
                  {websiteClarity?.ok&&["services","book"].includes(sharedJourneyGoal)?(
                    <>
                      <Text style={styles.sectionLabel}>V3.173 • Service information</Text>
                      <MetricRow left="Clearly described services"
                        right={websiteClarity.websiteCompleteDescriptions+
                          " of "+websiteClarity.websiteServiceCount}/>
                      {websiteClarity.issues.filter(x=>x.surface==="website")
                        .slice(0,4).map((issue,i)=>(
                        <Text key={"website-info-"+i} style={styles.cardBody}>
                          {issue.title+
                            (issue.position?" (service "+issue.position+")":"")+
                            ". "+issue.ownerAction}
                        </Text>
                      ))}
                    </>
                  ):null}
                  {businessBrainQueue?.ok?(
                    <>
                      <Text style={styles.sectionLabel}>
                        V3.177 • Business Brain website preferences
                      </Text>
                      <Text style={styles.cardBody}>
                        BUSY can remember decisions only for a server-prepared
                        current website revision. Nothing is changed or published
                        by remembering a preference.
                      </Text>
                      {!webBrainRevision.ok?(
                        <Text style={styles.cardBody}>{webBrainRevision.reason}</Text>
                      ):null}
                      {webBrainNotice?(
                        <Text style={styles.cardBody}>{webBrainNotice}</Text>
                      ):null}
                      {businessBrainQueue.items.map(item=>(
                        <View key={"web-brain-next-"+item.id}>
                          <MetricRow left={item.title} right="For your review"/>
                          <Text style={styles.cardBody}>{item.reason}</Text>
                          <Text style={styles.cardBody}>{item.nextStep}</Text>
                          {webBrainHistory&&webBrainRevision.ok&&
                           !webBrainSaving&&
                           typeof s.recordWebsiteBrainOwnerDecision==="function"?(
                            <Button label="Not useful — remember this"
                              onPress={async()=>{
                                setWebBrainSaving(true);
                                try{
                                  const response=await s.recordWebsiteBrainOwnerDecision({
                                    goal:sharedJourneyGoal,actionId:item.id,
                                    decision:"rejected"
                                  });
                                  if(!response?.ok)throw Error(response?.reason||"Save failed");
                                  const current=await s.getWebsiteBrainOwnerDecisions();
                                  if(!current?.ok)throw Error(current?.reason||
                                    "Saved, but preferences couldn't be reloaded.");
                                  setWebBrainHistory(current);
                                  setWebBrainNotice("Your choice is saved privately.");
                                }catch(error){
                                  setWebBrainNotice(String(error?.message||
                                    "Couldn't save this choice.").slice(0,180));
                                }finally{setWebBrainSaving(false);}
                              }}/>
                          ):null}
                        </View>
                      ))}
                      {webBrainHistory&&webBrainRevision.ok&&
                       typeof s.clearWebsiteBrainOwnerDecisions==="function"?(
                        <Button label="Clear saved website decisions"
                          onPress={()=>{
                            Alert.alert("Clear website decisions?",
                              "This will erase private choices without changing your live website.",[
                              {text:"Cancel",style:"cancel"},
                              {text:"Clear",style:"destructive",onPress:async()=>{
                                setWebBrainSaving(true);
                                try{
                                  const result=await s.clearWebsiteBrainOwnerDecisions();
                                  if(!result?.ok)throw Error(result?.reason||"Clear failed");
                                  setWebBrainHistory(null);
                                  setWebBrainNotice("Private website decisions cleared.");
                                }catch(error){
                                  setWebBrainNotice(String(error?.message||
                                    "Couldn't clear your choices.").slice(0,180));
                                }finally{setWebBrainSaving(false);}
                              }}]);
                          }}/>
                       ):null}
                      <Text style={styles.cardBody}>
                        No public changes, provider calls or spending are
                        authorised by these suggestions.
                      </Text>
                    </>
                  ):ownerImprovementPlan?.ok?(
                    <Text style={styles.cardBody}>
                      BUSY can prepare review ideas. Owner preferences need
                      a signed-in business and server-prepared website version.
                    </Text>
                  ):null}
                  {websiteDevicePlan?.ok?(
                    <Text style={styles.cardBody}>
                      {"Device checks prepared: "+websiteDevicePlan.checks.length+
                        " for this exact private website revision. "+
                        "No phone, tablet or screen reader has been verified yet."}
                    </Text>
                  ):null}
                  <Text style={styles.cardBody}>
                    Website content improvements use your real business details.
                    A visible contact button is not evidence that an enquiry
                    is delivered. No website is published automatically.
                  </Text>
                </>
              ):null}
            </>
          ):null}
        </Card>
      ):null}
      {draft?.designReview ? (
        <Card
          eyebrow="Your website's individual design"
          title={draft.designReview.status === "ready-for-visual-review"
            ? "BUSY checked your design foundation"
            : "BUSY has a few design suggestions"}
          body={draft.designReview.summary}
          footer="These are automatic design checks, not an AI screenshot review. Your website still needs visual inspection and your approval."
          tone="blue"
        >
          <Button label={showDesignReview ? "Hide design feedback" : "View design feedback"}
            onPress={() => setShowDesignReview(!showDesignReview)} />
          {showDesignReview ? (
            <>
              <MetricRow left="Design foundation checks"
                right={draft.designReview.score + " / 100"} />
              <Text style={styles.cardBody}>
                {"Chosen layout: " + String(draft.designPlan?.family || "custom") +
                 " • " + String(draft.designPlan?.architecture || "landing page")}
              </Text>
              {draft.designReview.suggestions.slice(0, 3).map((item) => (
                <View key={item.id} style={{ marginTop: 9 }}>
                  <Text style={[styles.cardTitle, { fontSize: 15 }]}>{item.message}</Text>
                  <Text style={styles.cardBody}>{item.detail}</Text>
                </View>
              ))}
            </>
          ) : null}
          {selectedStyle ? (
            <>
              <Text style={styles.cardBody}>
                {"Suggested look: "+selectedStyle.title+". "+selectedStyle.detail}
              </Text>
              <Text style={styles.cardBody}>
                {decisionEvidence.explanation}
              </Text>
              {brainCoach.warning?(
                <Text style={styles.cardBody}>{brainCoach.warning}</Text>
              ):null}
              <Button label={"Try "+selectedStyle.title+" (private draft)"}
                onPress={()=>s.applyWebsiteChange(selectedStyle.instruction)} />
              {designChoices.length>1 ? (
                <Button label="Show me another design style"
                  onPress={()=>setDesignOptionIndex(current=>
                    (current+1)%designChoices.length)} />
              ) : null}
              <Text style={styles.cardBody}>
                Only the private design changes. Your business information, photos and
                published website stay as they are; you can undo the change in the editor.
              </Text>
            </>
          ) : null}
          <Button label="Preview this design" onPress={() => s.go("websitePreview")} />
          <Text style={styles.cardBody}>
            Help BUSY remember your current private website style for this business. This saves
            a simple choice, not your photos or website text. It does not share
            your preferences with other businesses.
          </Text>
          <Button label="I like my current website style"
            disabled={feedbackState.status==="saving"}
            onPress={()=>sendDesignPreference("liked")}/>
          <Button label="My current website style isn't for me"
            disabled={feedbackState.status==="saving"}
            onPress={()=>sendDesignPreference("rejected")}/>
          <Button label={showOutcomeFeedback?
            "Hide feedback about my changes":"Did this website style work for you?"}
            onPress={()=>setShowOutcomeFeedback(v=>!v)}/>
          {showOutcomeFeedback?(
            <>
              <Text style={styles.cardBody}>
                Tell BUSY what you decided after trying this style.
                These are your own choices, not measured visits, enquiries or sales.
              </Text>
              <Button label="I kept this style"
                disabled={feedbackState.status==="saving"}
                onPress={()=>sendDesignPreference("kept")}/>
              <Button label="I changed back to another style"
                disabled={feedbackState.status==="saving"}
                onPress={()=>sendDesignPreference("reverted")}/>
            </>
          ):null}
          {savedStylePreferences?.eventCount>0?(
            <Text style={styles.cardBody}>{outcomeGuidance.message}</Text>
          ):null}
          {savedStylePreferences?.eventCount>0?(
            <Button label="Clear my saved style preferences"
              disabled={feedbackState.status==="saving"} onPress={clearPreferences}/>
          ):null}
          {feedbackState.message?(
            <Text style={styles.cardBody}>{feedbackState.message}</Text>
          ):null}
        </Card>
      ) : null}
      {!qualityGuide.complete ? (
        <Card
          eyebrow="Make your website stronger"
          title={qualityGuide.priority[0]?.title || "A few details can help"}
          body={qualityGuide.priority[0]?.detail || "BUSY will use the facts you've already saved."}
          footer="These are optional improvements, not reasons to prevent a preview."
          tone="blue"
        >
          <Button label="Improve my business details" onPress={s.openBrandIdentity} />
          {qualityGuide.suggestions.length > 1 ? (
            <Button label={showQualityIdeas ? "Hide website tips" : "See more website tips"}
              onPress={() => setShowQualityIdeas(!showQualityIdeas)} />
          ) : null}
          {showQualityIdeas ? (
            <>
              {qualityGuide.suggestions.slice(1, 4).map((item) => (
                <View key={item.id} style={{ marginTop: 8 }}>
                  <Text style={[styles.cardTitle, { fontSize: 15 }]}>{item.title}</Text>
                  <Text style={styles.cardBody}>{item.detail}</Text>
                </View>
              ))}
              <Button label={draft ? "Continue editing with BUSY" : "Start talking to BUSY"}
                onPress={draft ? s.askBusyToEditWebsite : s.askBusyToBuildWebsite} />
            </>
          ) : null}
        </Card>
      ) : null}
      {s.websitePublishingView?.liveDeployment&&!deliveryProof.verified?(
        <Card eyebrow="Public delivery check"
          title="Website version recorded — public address not verified yet"
          body={"BUSY has a published version recorded, but has not proved its real HTTPS address is serving that exact version. Next missing evidence: "+
            (missingDeliveryCheck?.label||"public delivery status")+
            ". An old healthy flag is not enough."}
          footer={deliveryProof.passed+" of "+deliveryProof.total+
            " independent checks supported by evidence"}
          tone="amber">
          <Button label="See delivery checks and recovery" onPress={s.openWebsitePublishing}/>
        </Card>
      ):null}
      {s.websiteBuilderNotice ? (
        <Card
          eyebrow="BUSY website update"
          title="Latest builder message"
          body={s.websiteBuilderNotice}
          tone="blue"
        />
      ) : null}
      {draft ? (
        <>
          <Card
            eyebrow="Website status"
            title={draft.businessName || "Business website"}
            body={draft.seo?.description || "No public description has been recorded yet."}
            footer={s.websitePublishingView?.liveDeployment ? "A separate approved version is currently live." : "This editor draft is not public until an exact hosted version is approved."}
            tone="blue"
          >
            <MetricRow left="Pages" right={String(draft.pages?.length || 1)} />
            <Button label="Preview website" primary onPress={() => s.go("websitePreview")} />
          </Card>
          <Button label={showVisualAi ? "Hide visual AI review" : "Review how my website looks"}
            onPress={() => setShowVisualAi(!showVisualAi)} />
          {showVisualAi ? (
            <Card eyebrow="BUSY visual design reviewer"
              title="Check mobile and desktop design"
              body="When enabled, BUSY privately examines screenshots of your exact hosted preview and suggests design-only improvements. You choose whether to apply them."
              footer="A review may use one AI allowance, even if it fails. Nothing is published or edited automatically."
              tone="blue">
              <Button label="Check visual AI availability (free)"
                onPress={s.checkWebsiteVisualReview} />
              {s.websiteVisualReviewStatus ? (
                <>
                  <MetricRow left="Visual AI available"
                    right={s.websiteVisualReviewStatus.enabled ? "Yes" : "Not enabled yet"} />
                  <MetricRow left="Reviews remaining this month"
                    right={String(s.websiteVisualReviewStatus.remaining||0)} />
                  <MetricRow left="Autonomous screenshot studio"
                    right={s.websiteVisualReviewStatus.studioReady?"Available":"Not enabled"} />
                </>
              ) : null}
              {s.websiteVisualReviewStatus?.enabled &&
               Number(s.websiteVisualReviewStatus?.remaining||0)>0 ? (
                <Button label="Use 1 review credit on my hosted website"
                  onPress={s.requestWebsiteVisualReview} />
              ) : null}
              {s.websiteVisualReviewStatus?.studioReady ? (
                <View style={{marginTop:12}}>
                  <Text style={styles.sectionLabel}>Autonomous private design review</Text>
                  <Text style={styles.cardBody}>
                    BUSY can examine the original hosted website, create a safe
                    design variant, capture NEW phone and desktop screenshots and
                    have AI independently compare them. It stops if the result
                    is worse, unclear or fails a safety check. It NEVER publishes.
                  </Text>
                  {[1,2,3].map(n=>(
                    <Button key={String(n)}
                      label={(designPasses===n?"✓ ":"")+n+" design pass"+(n===1?"":"es")+
                        " — up to "+(n+1)+" AI review credits"}
                      onPress={()=>setDesignPasses(n)}/>
                  ))}
                  <Button label={"Run up to "+designPasses+" private design passes"}
                    disabled={s.websiteVisualReviewBusy||
                      Number(s.websiteVisualReviewStatus.remaining||0)<designPasses+1}
                    onPress={()=>s.requestWebsiteAutonomousDesign?.(designPasses)}/>
                  <Text style={styles.cardBody}>
                    Each attempted model review counts towards your monthly allowance,
                    even if it fails. You explicitly start each run. Provider readiness
                    and credits must be confirmed beforehand.
                  </Text>
                </View>
              ):null}
              {s.websiteVisualReviewBusy ? (
                <Text style={styles.cardBody}>BUSY is checking your website review request…</Text>
              ) : null}
              {s.websiteVisualReviewNotice ? (
                <Text style={styles.cardBody}>{s.websiteVisualReviewNotice}</Text>
              ) : null}
              {s.websiteVisualReview?.report ? (
                <>
                  <Text style={styles.cardBody}>
                    {s.websiteVisualReview.report.modelSummary || "Visual inspection complete."}
                  </Text>
                  {s.websiteVisualReview.report.proposals?.map((item,i)=>(
                    <View key={item.path+":"+i} style={{marginTop:8}}>
                      <Text style={styles.cardBody}>{item.reason || item.path+" → "+item.value}</Text>
                    </View>
                  ))}
                  {s.websiteVisualReview.report.proposals?.length ? (
                    <>
                      <Button label="Have BUSY prepare private design alternatives"
                        onPress={()=>{
                          const preview=s.previewWebsiteVisualAlternatives?.({pageId:"home"});
                          setAiStudio(preview?.ok?preview:null);
                          setAiStudioChoice(0);
                          setAiStudioShowOriginal(false);
                          setAiStudioNotice(preview?.message||preview?.reason||"No private alternatives are ready.");
                        }}/>
                      {aiStudioNotice?<Text style={styles.cardBody}>{aiStudioNotice}</Text>:null}
                      {aiStudio?.ok&&aiStudio.draftId===draft.id&&
                       aiStudio.generation===draft.generation&&
                       aiStudio.deploymentId===s.websiteVisualReview.deploymentId?(
                        <View style={{marginVertical:12}}>
                          <Text style={styles.sectionLabel}>BUSY's private design studio</Text>
                          <Text style={styles.cardBody}>
                            BUSY has prepared safe variations from its actual screenshot-based AI critique.
                            {s.websiteVisualReview?.bestChanges
                              ?"BUSY compared temporary hosted candidates using NEW mobile and desktop AI screenshots. The examples below are local previews of those safe changes; please check your actual hosted site again after accepting."
                              :"These alternatives have NOT been re-examined by the AI. They must be checked on real layouts before publishing."}
                          </Text>
                          {aiStudio.candidates.map((candidate,i)=>(
                            <Button key={String(i)}
                              label={(aiStudioChoice===i?"✓ ":"")+"Alternative "+candidate.count+
                                " — "+candidate.description.length+" design idea(s)"}
                              onPress={()=>{setAiStudioChoice(i);setAiStudioShowOriginal(false);}}/>
                          ))}
                          <Button label={aiStudioShowOriginal?"Show BUSY's proposed design":"Show my original design"}
                            onPress={()=>setAiStudioShowOriginal(x=>!x)}/>
                          <Button label={(aiStudioWidth==="phone"?"✓ ":"")+"Preview phone"}
                            onPress={()=>setAiStudioWidth("phone")}/>
                          <Button label={(aiStudioWidth==="tablet"?"✓ ":"")+"Preview tablet"}
                            onPress={()=>setAiStudioWidth("tablet")}/>
                          <Button label={(aiStudioWidth==="desktop"?"✓ ":"")+"Preview desktop"}
                            onPress={()=>setAiStudioWidth("desktop")}/>
                          <View style={{height:330,borderRadius:12,overflow:"hidden",
                            borderColor:"#4A5D78",borderWidth:1}}>
                            <WebView
                              key={aiStudioChoice+":"+aiStudioWidth+":"+String(aiStudioShowOriginal)}
                              source={{html:withWebsitePreviewViewport(aiStudioShowOriginal
                                ?aiStudio.originalHtml:aiStudio.candidates[aiStudioChoice].html,
                                aiStudioWidth),baseUrl:"about:blank"}}
                              style={{flex:1,backgroundColor:"#fff"}}
                              javaScriptEnabled={false} domStorageEnabled={false} incognito
                              javaScriptCanOpenWindowsAutomatically={false}
                              allowFileAccess={false} mixedContentMode="never"
                              onShouldStartLoadWithRequest={req=>
                                req?.url==="about:blank"||
                                String(req?.url||"").startsWith("about:blank#")}/>
                          </View>
                          <Text style={styles.cardBody}>
                            Tablet is a responsive preview, not a separate AI-reviewed screenshot. Always inspect the actual hosted design on all devices before going live.
                          </Text>
                          <Text style={styles.cardBody}>
                            Nothing has been saved. The selected alternative is based on verified
                            AI suggestions, not a guaranteed improvement. You decide.
                          </Text>
                          <Button label="Keep this reviewed alternative in my private draft"
                            onPress={()=>{
                              const selected=aiStudio.candidates[aiStudioChoice];
                              const kept=s.approveWebsiteVisualSuggestionCount?.(selected?.count);
                              if(kept)setAiStudio(null);
                              else setAiStudioNotice("This review may be stale. Check the latest design before keeping it.");
                            }}/>
                          <Button label="Discard alternatives and keep original"
                            onPress={()=>{setAiStudio(null);setAiStudioNotice("No changes made.");}}/>
                        </View>
                       ):null}
                      <Button label="Approve design changes in my PRIVATE draft"
                        onPress={s.approveWebsiteVisualSuggestions}/>
                    </>
                  ) : (
                    <Text style={styles.cardBody}>No safe visual changes suggested. Your website remains unchanged.</Text>
                  )}
                </>
              ) : null}
              <Button label="Open private hosted website preview"
                onPress={s.openWebsitePublishing} />
            </Card>
          ) : null}
          <Text style={styles.sectionLabel}>Make changes</Text>
          <Card
            eyebrow="Your changes"
            title="Tell BUSY what you would like changed"
            body="Change headings, your supplied text, service descriptions, colours, overall design and the order of website sections. For photos, select approved images. BUSY will not invent business facts."
            footer="Try: “make the website more premium; move about before services; make the contact button stand out”. Separate changes with a semicolon."
            tone="blue"
          >
            <Field
              label="Website change"
              value={instruction}
              onChangeText={setInstruction}
              placeholder="e.g. Change the headline to Proper local service"
            />
            <Button label="Apply change" primary onPress={applyInstruction} />
            {s.canUndoWebsite || s.canRedoWebsite ? (
              <View>
                {s.canUndoWebsite ? <Button label="Undo last change" onPress={s.undoWebsiteChange} /> : null}
                {s.canRedoWebsite ? <Button label="Redo change" onPress={s.redoWebsiteChange} /> : null}
              </View>
            ) : null}

            <Button label="Tell BUSY by voice" onPress={s.askBusyToEditWebsite} />
            <Button label={showCustomization ? "Hide quick design choices" : "Explore quick design choices"}
              onPress={() => setShowCustomization(!showCustomization)} />
            {showCustomization ? (
              <>
                <Text style={styles.cardBody}>Choose a look, then adjust it whenever you like.</Text>
                <Button label="Try a minimalist design" onPress={() => s.applyWebsiteChange("use a minimal design")} />
                <Button label="Try an editorial design" onPress={() => s.applyWebsiteChange("use an editorial design")} />
                <Button label="Show services as rows" onPress={() => s.applyWebsiteChange("use service cards rows")} />
                <Button label="Centre the main headline" onPress={() => s.applyWebsiteChange("center the main headline")} />
              </>
            ) : null}
          </Card>
          <AppToWebsiteDesignTransfer key={[s.ownerSession?.userId,s.cloudWorkspace?.businessId,draft.id,s.miniAppsView?.app?.id].join(':')} website={draft}
            app={s.miniAppsView?.app} businessId={s.cloudWorkspace?.businessId}
            onApply={s.applyAppDesignToWebsite}/>
          <BusinessBrandDnaPreview key={[s.ownerSession?.userId,s.cloudWorkspace?.businessId,draft.id,s.miniAppsView?.app?.id].join(':')} website={draft}
            app={s.miniAppsView?.app}
            businessId={s.cloudWorkspace?.businessId}
            catalog={s.miniAppsView?.catalog||s.miniAppsStatus?.catalog||[]}
            onApplyWebsiteLayout={s.applyWebsiteLayoutAction}/>
          <WebsiteAppHandoffReview businessId={s.cloudWorkspace?.businessId||""}
            website={draft} app={s.miniAppsView?.app}
            liveVersion={s.miniAppsView?.liveVersion}
            catalog={s.miniAppsView?.catalog||[]}
            endpoint={s.websiteAppHandoffEndpoint||""}
            onApply={s.applyWebsiteLayoutAction}
            publishing={s.websitePublishingView}
            deliveryProof={deliveryProof}
            businessType={draft?.businessType||brand?.websiteBrief?.businessType||s.trade||""}
            description={brand?.websiteBrief?.description||""}/>
          <WebsiteAppTypographyMatch key={[s.ownerSession?.userId,s.cloudWorkspace?.businessId,draft.id,s.miniAppsView?.app?.id].join(':')} website={draft}
            app={s.miniAppsView?.app}
            businessId={s.cloudWorkspace?.businessId}
            onApply={s.applyBusinessAppTypographyToWebsite}/>
          <WebsiteAppBrandMatch key={[s.ownerSession?.userId,s.cloudWorkspace?.businessId,draft.id,s.miniAppsView?.app?.id].join(':')} website={draft}
            app={s.miniAppsView?.app}
            businessId={s.cloudWorkspace?.businessId}
            onApply={s.applyBusinessAppBrandToWebsite}/>
          <WebsiteAppServiceCopy key={[s.ownerSession?.userId,s.cloudWorkspace?.businessId,draft.id,s.miniAppsView?.app?.id].join(':')} website={draft}
            app={s.miniAppsView?.app}
            businessId={s.cloudWorkspace?.businessId}
            onApply={s.applyMissingAppServicesToWebsite}/>
          <WebsiteContentEditor key={[s.ownerSession?.userId,draft.businessId,draft.id].join(':')} draft={draft} onApply={s.applyWebsiteFieldChange}
            suggestions={draft.businessId===s.cloudWorkspace?.businessId&&s.miniAppsView?.app?.business_id===draft.businessId?
              reviewEnquiryContentGaps({businessId:draft.businessId,appId:s.miniAppsView.app.id,requests:s.miniAppsView.requests||[],config:{publicProfile:{faqs:(draft.sections||[]).filter(section=>section.type==='faq').flatMap(section=>(section.items||[]).map(item=>({question:item.title})))}}}).suggestions:[]}/>
          <WebsiteLayoutControls draft={draft} onApply={s.applyWebsiteLayoutAction}/>
          <WebsitePagesEditor key={[s.ownerSession?.userId,s.cloudWorkspace?.businessId,draft?.id].join(":")} draft={draft} onApply={s.applyWebsitePageAction} onShare={s.shareWebsiteContent} onShareZip={s.shareStandaloneWebsiteZip} onBackup={s.backupWebsiteOriginals}/>
        </>
      ) : null}
      <Button label={showWebsiteDetails ? "Hide extra website settings" : "More website settings"}
        onPress={() => setShowWebsiteDetails(!showWebsiteDetails)} />
      {showWebsiteDetails ? (
        <>
      <Card
        eyebrow="Global-Ready foundation"
        title="Regional website settings are reviewed separately"
        body="Languages, currencies, time zones and country rules must be explicitly confirmed before international launch. Phone location does not change billing or where customer data is stored."
        tone="blue">
        <MetricRow left="Display context checks"
          right={regional.passed+" of "+regional.total}/>
        <Text style={styles.cardBody}>
          {"Regional status: "+(regional.status==="display-context-reviewed"?
            "Display settings reviewed — legal and provider checks still needed":
            "Not confirmed for international release")}
        </Text>
      </Card>
      <Card
        eyebrow="Website settings"
        title={draft ? "Your website draft exists" : "BUSY is ready to build the first draft"}
        body={
          draft
            ? "The website is a saved internal draft generated from recorded business identity, services, approved imagery, FAQs and testimonials."
            : brand.websiteReady
            ? "Brand Brain says the core website foundation is ready."
            : "BUSY can still create a truthful partial draft, but missing core business facts will stay visibly missing rather than being invented."
        }
        footer={draft ? `Generation ${draft.generation} • ${draft.publicStatus}` : brand.websiteReadinessLabel}
        tone={draft ? "green" : brand.websiteReady ? "green" : "amber"}
      >
        <MetricRow left="Brand identity completeness" right={`${Number(brand.completeness?.score || 0)}%`} />
        <MetricRow left="Core missing items" right={String(brand.completeness?.coreMissing?.length || 0)} strong={(brand.completeness?.coreMissing?.length || 0) > 0} />
        <MetricRow left="Approved photos" right={String(brand.summary?.photoCount || 0)} />
        <MetricRow left="Services" right={String(brand.summary?.serviceCount || 0)} />
        <Button
          label={draft ? "Rebuild from Brand Brain" : "Build my website"}
          primary
          onPress={s.buildWebsiteFromBrandBrain}
        />
        <Button
          label="Build it by talking to BUSY"
          onPress={s.askBusyToBuildWebsite}
        />
      </Card>
          {draft ? (
            <>
          <Text style={styles.sectionLabel}>Page structure</Text>
          <Card
            eyebrow="Multi-page foundation"
            title={`${draft.pages?.length || 1} structured page${Number(draft.pages?.length || 1) === 1 ? "" : "s"}`}
            body="BUSY keeps pages inside the same controlled website model, so editing, SEO, preview, versioning and publishing stay connected."
            footer="Home remains the complete overview; dedicated pages are generated from the same approved sections."
            tone="blue"
          >
            {(draft.pages || []).map((page) => (
              <MetricRow key={page.id} left={page.title || page.id} right={page.path || "/"} />
            ))}
          </Card>

          <Text style={styles.sectionLabel}>Draft structure</Text>
          {(draft.sections || []).map((section) => (
            <Card
              key={section.id}
              eyebrow={section.enabled === false ? "Hidden section" : "Website section"}
              title={section.title || section.id}
              body={section.body || (section.items?.length ? `${section.items.length} item${section.items.length === 1 ? "" : "s"}` : "No supporting text recorded")}
              tone={section.enabled === false ? "blue" : "green"}
            >
              <MetricRow left="Section" right={section.id} />
              <MetricRow left="Visible" right={section.enabled === false ? "No" : "Yes"} />
              {section.id !== "hero" && section.id !== "contact" ? (
                <Button
                  label={section.enabled === false ? "Show section" : "Hide section"}
                  onPress={() =>
                    s.applyWebsiteChange(
                      section.enabled === false
                        ? `show ${section.id}`
                        : `hide ${section.id}`
                    )
                  }
                />
              ) : null}
            </Card>
          ))}

          <Card
            eyebrow="Hosting and publication details"
            title={s.websitePublishingView?.publicStatus || "Draft only"}
            body="BUSY turns the editor draft into a private immutable multi-page preview, stores a plain-English change summary, and keeps the current live site untouched until you approve the exact version."
            footer="Normal public page views are served as static CDN files rather than running the BUSY app or AI."
            tone={s.websitePublishingView?.liveDeployment ? "green" : "blue"}
          >
            <MetricRow
              left="Hosted preview"
              right={s.websitePublishingView?.previewDeployment ? `v${s.websitePublishingView.previewDeployment.version_no}` : "Not prepared"}
            />
            <MetricRow
              left="Live version"
              right={s.websitePublishingView?.liveDeployment ? `v${s.websitePublishingView.liveDeployment.version_no}` : "Not live"}
              strong={!!s.websitePublishingView?.liveDeployment}
            />
            <Button
              label="Publishing & hosting"
              primary
              onPress={s.openWebsitePublishing}
            />
          </Card>
            </>
          ) : null}
        </>
      ) : null}
      <Button label="Brand & Business Identity" onPress={s.openBrandIdentity} />
      <Button label="Back to Home" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function WebsitePreview({ s }) {
  const draft = s.websiteDraft;
  const [selectedPageId,setSelectedPageId] = React.useState("home");
  const [tapEditMode,setTapEditMode]=React.useState(false);
  const [previewSize,setPreviewSize]=React.useState("full");
  const [selectedEdit,setSelectedEdit]=React.useState(null);
  const [visualCheckOn,setVisualCheckOn]=React.useState(false);
  const [visualCheckResult,setVisualCheckResult]=React.useState(null);
  const [viewportEvidence,setViewportEvidence]=React.useState(null);
  const [designCandidate,setDesignCandidate]=React.useState(null);
  const [candidateCheckOn,setCandidateCheckOn]=React.useState(false);
  const [candidateCheckResult,setCandidateCheckResult]=React.useState(null);
  const [captureSequence,setCaptureSequence]=React.useState({original:0,candidate:0});
  const [requestedReview,setRequestedReview]=React.useState(null);
  const [activeCapture,setActiveCapture]=React.useState(null);
  const activeCaptureRef=React.useRef(null);
  activeCaptureRef.current=activeCapture;
  const captureEpoch=React.useRef(Date.now().toString(36));
  const [privateWidthEvidence,setPrivateWidthEvidence]=React.useState(null);
  const [designCandidateNotice,setDesignCandidateNotice]=React.useState("");
  const [showOriginalComparison,setShowOriginalComparison]=React.useState(false);
  const [pageInstruction,setPageInstruction]=React.useState("");
  const [pagePlanPreview,setPagePlanPreview]=React.useState(null);
  const [showPagePlanOriginal,setShowPagePlanOriginal]=React.useState(false);
  const [pagePlanNotice,setPagePlanNotice]=React.useState("");
  const [pageVoiceExpanded,setPageVoiceExpanded]=React.useState(false);
  const [pageInterpretBusy,setPageInterpretBusy]=React.useState(false);
  const [pageConversation,setPageConversation]=React.useState(null);
  const [showRecoveryTools,setShowRecoveryTools]=React.useState(false);
  const [confirmRecoveryRestore,setConfirmRecoveryRestore]=React.useState(false);
  React.useEffect(()=>{
    setSelectedEdit(null);setVisualCheckResult(null);setVisualCheckOn(false);
    setRequestedReview(null);activeCaptureRef.current=null;setActiveCapture(null);
    setDesignCandidate(null);setCandidateCheckOn(false);
    setCandidateCheckResult(null);setPrivateWidthEvidence(null);setDesignCandidateNotice("");
    setShowOriginalComparison(false);
  },[selectedPageId,draft?.id,draft?.generation,s.cloudWorkspace?.businessId,s.ownerSession?.userId]);
  React.useEffect(()=>{
    activeCaptureRef.current=null;setActiveCapture(null);
    // Keep the SAME private design candidate when switching screen width;
    // old single-width measurements must never be reused at another width.
    setVisualCheckOn(false);setVisualCheckResult(null);
    setCandidateCheckOn(false);setCandidateCheckResult(null);
    setShowOriginalComparison(false);
  },[previewSize]);
  React.useEffect(()=>setViewportEvidence(null),[selectedPageId,draft?.id,draft?.generation]);
  React.useEffect(()=>setConfirmRecoveryRestore(false),[draft?.id,draft?.generation]);
  React.useEffect(()=>{setPagePlanPreview(null);setPagePlanNotice("");setPageInstruction("");
    setPageConversation(null);setShowPagePlanOriginal(false);},[selectedPageId,draft?.id,draft?.generation,s.cloudWorkspace?.businessId]);
  const activePage=draft?.pages?.find(page=>page.id===selectedPageId)||
    draft?.pages?.find(page=>page.id==="home");
  const liveConceptHtml = draft ? renderWebsiteHtml(draft,activePage?.id||"home") : "";
  const sourceKey=[s.ownerSession?.userId,s.cloudWorkspace?.businessId,draft?.id,
    draft?.generation,activePage?.id||"home"].join(":");
  const candidateIsCurrent=currentWebsiteDesignCandidate(designCandidate,{
    businessId:s.cloudWorkspace?.businessId,website:draft,pageId:activePage?.id||"home",ownerId:s.ownerSession?.userId||""});
  const inspectionKey=["review",captureEpoch.current,"original",captureSequence.original].join(":");
  const candidateKey=designCandidate?
    ["review",captureEpoch.current,"candidate",captureSequence.candidate].join(":"):"";
  const startCapture=variant=>{
    const sequence=captureSequence[variant]+1;
    const key=["review",captureEpoch.current,variant,sequence].join(":");
    const attempt=beginWebsiteMeasurementAttempt({sourceKey,mode:previewSize,variant,key});
    activeCaptureRef.current=attempt;setActiveCapture(attempt);
    setCaptureSequence(previous=>({...previous,[variant]:sequence}));
  };
  const stopCapture=message=>{
    activeCaptureRef.current=null;setActiveCapture(null);
    setVisualCheckOn(false);setCandidateCheckOn(false);setRequestedReview(null);
    if(message)setDesignCandidateNotice(message);
  };
  React.useEffect(()=>{
    if(!activeCapture||(!visualCheckOn&&!candidateCheckOn))return;
    const timer=setTimeout(()=>{
      if(activeCaptureRef.current?.key!==activeCapture.key)return;
      stopCapture("The layout check did not finish. Your draft is unchanged. Retry this width when the preview is ready.");
    },Math.max(0,activeCapture.expiresAt-Date.now()));
    return ()=>clearTimeout(timer);
  },[activeCapture,visualCheckOn,candidateCheckOn]);
  const requestReview=(mode,variant)=>{
    setRequestedReview({mode,variant,sourceKey});
    setPreviewSize(mode);
  };
  React.useEffect(()=>{
    if(!requestedReview)return;
    if(requestedReview.sourceKey!==sourceKey){setRequestedReview(null);return;}
    if(requestedReview.mode!==previewSize)return;
    if(requestedReview.variant==="candidate"&&!candidateIsCurrent){setRequestedReview(null);return;}
    const variant=requestedReview.variant;
    startCapture(variant);
    setSelectedEdit(null);setTapEditMode(false);
    setShowOriginalComparison(variant==="original"&&candidateIsCurrent);
    setVisualCheckOn(variant==="original");setCandidateCheckOn(variant==="candidate");
    if(variant==="original")setVisualCheckResult(null);else setCandidateCheckResult(null);
    setRequestedReview(null);
  },[requestedReview,previewSize,sourceKey,candidateIsCurrent]);
  const candidateHtml=candidateIsCurrent&&designCandidate?.draft
    ?renderWebsiteHtml(designCandidate.draft,activePage?.id||"home"):"";
  const unscaledInteractiveHtml=draft&&candidateIsCurrent
    ?showOriginalComparison?(visualCheckOn?
      makeWebsiteVisualCheckHtml(liveConceptHtml,inspectionKey):liveConceptHtml):
      candidateCheckOn?makeWebsiteVisualCheckHtml(candidateHtml,candidateKey):candidateHtml
    :draft&&visualCheckOn
    ?makeWebsiteVisualCheckHtml(liveConceptHtml,inspectionKey)
    :draft&&tapEditMode
    ?makeTapToEditHtml(renderWebsiteHtml(draft,activePage?.id||"home",{editablePreview:true}))
    :liveConceptHtml;
  const interactiveHtml=unscaledInteractiveHtml
    ?withWebsitePreviewViewport(unscaledInteractiveHtml,previewSize):"";
  const receiveTap=event=>{
    if(!draft||designCandidate&&!candidateIsCurrent)return;
    try{
      const raw=JSON.parse(String(event?.nativeEvent?.data||""));
      if(raw?.channel===VISUAL_CHECK_CHANNEL){
        if(!currentWebsiteMeasurementAttempt(activeCaptureRef.current,{sourceKey,mode:previewSize,
          variant:candidateCheckOn?"candidate":"original",key:raw.key}))return;
        if(candidateCheckOn&&designCandidate){
          const report=reviewWebsiteVisualCheck(raw,candidateKey);
          if(!report){stopCapture("This measurement was incomplete. Retry the private preview; nothing was saved.");return;}
          if(report){
            activeCaptureRef.current=null;setActiveCapture(null);
            setCandidateCheckResult({...report,reviewSourceKey:sourceKey,reviewMode:previewSize,candidateId:designCandidate.id});setCandidateCheckOn(false);
            setPrivateWidthEvidence(previous=>{
              const updated=recordPrivateWebsiteCandidateWidthV3239(previous,{
                businessId:s.cloudWorkspace?.businessId,website:draft,
                pageId:activePage?.id||"home",candidateId:designCandidate.id,
                baseGeneration:designCandidate.baseGeneration,
                mode:previewSize,variant:"candidate",report
              });
              return updated.ok?updated.state:previous;
            });
          }
        }else if(visualCheckOn){
          const report=reviewWebsiteVisualCheck(raw,inspectionKey);
          if(!report){stopCapture("This measurement was incomplete. Retry the private preview; nothing was saved.");return;}
          if(report){
            activeCaptureRef.current=null;setActiveCapture(null);
            setVisualCheckResult({...report,reviewSourceKey:sourceKey,reviewMode:previewSize});setVisualCheckOn(false);
            if(designCandidate)setPrivateWidthEvidence(previous=>{
              const updated=recordPrivateWebsiteCandidateWidthV3239(previous,{
                businessId:s.cloudWorkspace?.businessId,website:draft,
                pageId:activePage?.id||"home",candidateId:designCandidate.id,
                baseGeneration:designCandidate.baseGeneration,
                mode:previewSize,variant:"original",report
              });
              return updated.ok?updated.state:previous;
            });
            setViewportEvidence(previous=>recordWebsiteViewportEvidence(previous,{
              draftId:draft.id,generation:draft.generation,
              pageId:activePage?.id||"home",report
            }));
          }
        }
        return;
      }
      if(!tapEditMode||visualCheckOn||designCandidate)return;
      // Selection alone never opens a large editing modal. The context
      // toolbar is the single obvious action surface; every message is
      // revalidated against the exact enabled website page and element.
      const resolved=resolveTapToolbarAction(draft,activePage?.id||"home",raw);
      if(resolved)setSelectedEdit({...resolved.selection,
        initialMode:resolved.action,draftId:draft.id,
        pageId:activePage?.id||"home",generation:draft.generation});
    }catch{ /* Untrusted or stale page messages never modify a website. */ }
  };
  const pageReviewCoverage=summarizeWebsiteViewportEvidence(viewportEvidence,{
    draftId:draft?.id,generation:draft?.generation,pageId:activePage?.id||"home"
  });
  const crossScreenEvidence=reviewWebsiteViewportPortfolio(viewportEvidence,{
    draftId:draft?.id,generation:draft?.generation,pageId:activePage?.id||"home"
  });
  const evidenceSummary=draft?websiteEvidenceSummary({
    viewportState:viewportEvidence,draftId:draft.id,
    generation:draft.generation,pageId:activePage?.id||"home"
  }):null;
  const originalReportIsCurrent=visualCheckResult?.reviewSourceKey===sourceKey&&visualCheckResult?.reviewMode===previewSize;
  const candidateReportIsCurrent=candidateCheckResult?.reviewSourceKey===sourceKey&&candidateCheckResult?.reviewMode===previewSize&&candidateCheckResult?.candidateId===designCandidate?.id;
  const layoutAdvice=originalReportIsCurrent&&!designCandidate
    ?recommendMeasuredWebsiteChange({draft,pageId:activePage?.id,report:visualCheckResult}):null;
  const currentCandidateEvidence=designCandidate&&privateWidthEvidence&&
    ["phone","tablet","desktop"].includes(previewSize)?
    inspectCurrentWebsiteCandidateV3240(privateWidthEvidence,{
      businessId:s.cloudWorkspace?.businessId,website:draft,
      pageId:activePage?.id||"home",candidateId:designCandidate.id,
      baseGeneration:designCandidate.baseGeneration,mode:previewSize
    }):null;
  const designReviewProgress=privateWebsiteReviewProgress(privateWidthEvidence,{
    businessId:s.cloudWorkspace?.businessId,website:draft,pageId:activePage?.id||"home",
    candidate:designCandidate,mode:previewSize,ownerId:s.ownerSession?.userId||""});
  const candidateComparison=candidateIsCurrent&&candidateReportIsCurrent&&originalReportIsCurrent
    ?compareWebsiteVisualReports(visualCheckResult,candidateCheckResult):
    currentCandidateEvidence?.ok?currentCandidateEvidence.comparison:null;
  const comparisonWords=candidateComparison
    ?describeWebsiteDesignComparison(candidateComparison):null;
  const privateWidthReview=designCandidate&&privateWidthEvidence?
    reviewPrivateWebsiteCandidateWidthsV3239(privateWidthEvidence,{
      businessId:s.cloudWorkspace?.businessId,website:draft,
      pageId:activePage?.id||"home",candidateId:designCandidate.id,
      baseGeneration:designCandidate.baseGeneration
    }):null;
  const measuredPriority=designCandidate&&candidateComparison&&
    draft?.id&&visualCheckResult&&candidateCheckResult?
    compareMeasuredWebsiteCandidates({
      draftId:draft.id,generation:draft.generation,
      pageId:activePage?.id||"home",
      checks:[{draftId:draft.id,generation:designCandidate.baseGeneration,
        pageId:designCandidate.pageId||"home",
        widthGroup:classifyWidth(visualCheckResult.counts.viewport),
        captureSource:"current_private_webview_dom",
        original:visualCheckResult,candidate:candidateCheckResult}]
    }):null;
  const coordinatedAdvice=coordinatedWebsiteAlternatives(draft,activePage?.id,visualCheckResult);
  const tryCandidate=(advice=layoutAdvice)=>{
    if(!advice||!draft)return;
    const result=applyWebsiteLayoutChange(draft,advice.operation);
    if(!result?.applied){
      setDesignCandidateNotice(result?.reason||"That layout alternative could not be prepared.");
      return;
    }
    // Don't modify the owner's real draft. Recheck the entire rendered private
    // candidate on the SAME page and viewport, then offer an explicit Keep.
    setDesignCandidate({...advice,draft:result.draft,pageId:activePage?.id,
      businessId:s.cloudWorkspace?.businessId,websiteId:draft.id,ownerId:s.ownerSession?.userId||"",
      baseGeneration:draft.generation});
    const baseline=recordPrivateWebsiteCandidateWidthV3239(null,{
      businessId:s.cloudWorkspace?.businessId,website:draft,pageId:activePage?.id||"home",
      candidateId:advice.id,baseGeneration:draft.generation,
      mode:previewSize,variant:"original",report:visualCheckResult});
    setPrivateWidthEvidence(baseline.ok?baseline.state:null);
    startCapture("candidate");
    setCandidateCheckResult(null);setCandidateCheckOn(true);
    setShowOriginalComparison(false);
    setTapEditMode(false);setVisualCheckOn(false);setSelectedEdit(null);
    setDesignCandidateNotice("Testing an alternative in a private preview. Your original design is unchanged.");
  };
  const discardCandidate=()=>{
    stopCapture();
    setShowOriginalComparison(false);
    if(designCandidate&&draft&&s.recordMeasuredWebsiteFeedback)
      s.recordMeasuredWebsiteFeedback({draftId:draft.id,pageId:activePage?.id,
        changeId:designCandidate.id,choice:"disliked"});
    setDesignCandidate(null);setCandidateCheckOn(false);
    setCandidateCheckResult(null);setPrivateWidthEvidence(null);
    setDesignCandidateNotice("Original design restored. Your preference stays with this draft only.");
  };
  const keepCandidate=()=>{
    if(visualCheckOn||candidateCheckOn||requestedReview||!candidateIsCurrent||!designReviewProgress.mayKeep||
       !candidateComparison?.valid||!candidateComparison.noNewMeasuredProblems||
       privateWidthReview?.hasRegressions===true||
       currentCandidateEvidence?.ok===true&&
        currentCandidateEvidence.safeForPrivateApproval!==true||
       designCandidate?.baseGeneration!==draft?.generation)return;
    const saved=s.applyWebsiteLayoutAction(designCandidate.operation,{
      baseGeneration:designCandidate.baseGeneration,
      expectedBusinessId:designCandidate.businessId,expectedWebsiteId:designCandidate.websiteId,
      expectedGeneration:designCandidate.baseGeneration,
      ownerFeedback:{draftId:draft.id,pageId:activePage?.id,
        changeId:designCandidate.id,choice:"liked"}
    });
    if(saved){setDesignCandidate(null);setCandidateCheckResult(null);
      setPrivateWidthEvidence(null);
      setDesignCandidateNotice("Saved in your private draft. Undo remains available. Recheck other screen sizes before publishing.");}
  };
  if (!draft) {
    return (
      <Shell s={s} title="Website preview" subtitle="Build a website draft first.">
        <Button label="Open Website Builder" primary onPress={() => s.go("websiteBuilder")} />
      </Shell>
    );
  }

  const hosted = s.websitePublishingView?.previewDeployment || null;
  const draftChangedSinceHosted = !!s.websitePublishingView?.draftChangedSinceHosted;
  const openHosted = () => hosted?.id
    ? s.openHostedWebsitePreview(hosted.id)
    : s.openWebsitePublishing();

  return (
    <Shell
      s={s}
      title="Website preview"
      subtitle="Check your design, open the hosted website and make changes whenever you like."
      brandCue="BUSY DOES IT • Your website preview"
    >
      <View style={{ alignItems: "flex-start", marginBottom: 10 }}>
        <StatusChip label={draft.publicStatus} tone="blue" />
      </View>

      <Card
        eyebrow="Your private preview"
        title={hosted ? "View your hosted website again" : "See your website in the browser"}
        body={hosted
          ? draftChangedSinceHosted
            ? "You can still reopen the previous hosted version. Your recent draft changes will only appear after you prepare an updated hosted preview."
            : "Open the real hosted version and browse its pages whenever you like. You do not have to publish your website."
          : "This is an editable draft, not the finished hosted website. Prepare a private hosted preview to see its real pages before deciding whether to publish."}
        footer="Previewing does not publish your website"
        tone="blue"
      >
        <Button label={hosted ? "View hosted website again" : "Prepare private hosted preview"}
          primary onPress={openHosted} />
        {hosted && draftChangedSinceHosted ? (
          <Button label="Prepare preview with my latest changes" onPress={s.openWebsitePublishing} />
        ) : null}
      </Card>

      <Card eyebrow="Select a page" title="Preview the actual page content"
        body="Choose a page below. BUSY uses your saved page sections, headings and page-specific SEO in the private design preview."
        tone="blue">
        {(draft.pages||[]).map(page=>(
          <Button key={page.id} label={(activePage?.id===page.id?"✓ ":"")+
            (page.title||page.id)+" • "+(page.path||"/")}
            onPress={()=>setSelectedPageId(page.id)}/>
        ))}
      </Card>

      <Card eyebrow="Edit by tapping" title="Tap anything you want to change"
        body="Start editing, tap the exact picture or words, then use the small floating toolbar to edit, talk to BUSY or see more options. Everything stays private."
        tone="blue">
        <Button primary label={tapEditMode?"Finish tapping — view normally":"Start editing by tapping"}
          onPress={()=>{setSelectedEdit(null);setVisualCheckOn(false);setTapEditMode(x=>!x);}}/>
        {tapEditMode?<Text style={styles.cardBody}>Tap any picture or words. A subtle outline and three small controls appear beside your selection. Nothing is published automatically.</Text>:null}
      </Card>

      <Card eyebrow="Change several parts together"
        title="Tell BUSY which sections to adjust"
        body="Use the section names visible on this page. BUSY checks each instruction, shows the original beside the proposed result and asks you to approve before saving. Unsupported or unclear instructions change nothing."
        tone="blue">
        <Text style={styles.cardBody}>Try: Change the hero heading to "Welcome to our workshop"; move the about section above services. Or add question "Do you travel?" answer "Ask us about your location." For phone reading: make the whole page easier to read only on phones. Shared theme changes affect all pages; always preview first.</Text>
        <TextInput value={pageInstruction}
          onChangeText={value=>{setPageInstruction(value);setPagePlanPreview(null);setPagePlanNotice("");}}
          multiline maxLength={400}
          accessibilityLabel="Describe up to five named website page changes"
          placeholder="Move the services section up; make the hero heading smaller on phones"
          placeholderTextColor="#97A7BD"
          style={{minHeight:95,padding:12,borderRadius:12,backgroundColor:"#202D40",color:"#F4F7FE",textAlignVertical:"top"}}/>
        <Button label={pageVoiceExpanded?"Hide page microphone":"🎙 Talk to BUSY about this whole page"}
          onPress={()=>setPageVoiceExpanded(value=>!value)}/>
        {pageVoiceExpanded?(
          <WebsiteSelectedVoice
            key={draft.id+":"+draft.generation+":"+(activePage?.id||"home")}
            contextLabel="page"
            selection={{draftId:draft.id,generation:draft.generation,pageId:activePage?.id||"home"}}
            onTranscribe={s.transcribeWebsitePageAudio}
            onTranscript={words=>{
              setPageInstruction(String(words||"").slice(0,400));
              setPagePlanPreview(null);
              setPagePlanNotice("Please read the transcript, then preview the proposed edits. No website changes were made.");
            }}/>
        ):null}
        <Button label={pageInterpretBusy?"BUSY is interpreting…":
           "Ask BUSY to understand my words (uses 1 daily AI request)"}
          disabled={pageInterpretBusy||!pageInstruction.trim()}
          onPress={async()=>{
            if(pageInterpretBusy)return;
            setPageInterpretBusy(true);setPagePlanPreview(null);
            setPagePlanNotice("Checking what you meant. No website changes are being made.");
            try{
              const scope={draftId:draft.id,pageId:activePage?.id||"home",
                generation:draft.generation,workspaceId:s.cloudWorkspace?.businessId||""};
              const started=pageConversation?.ok?pageConversation:beginWebsiteConversation(scope);
              const asked=addWebsiteConversationTurn(started,scope,{role:"owner",text:pageInstruction});
              if(!asked.ok){
                setPagePlanNotice(asked.reason||"Please select a current page.");
                return;
              }
              setPageConversation(asked);
              const context=websiteConversationContext(asked,scope);
              const result=await s.interpretWebsitePageLanguage?.({
                pageId:scope.pageId,generation:scope.generation,
                instruction:pageInstruction,conversationContext:context
              });
              if(result?.ok){
                setPageInstruction(result.canonical);
                setPageConversation(addWebsiteConversationTurn(asked,scope,{
                  role:"busy",text:"Here is a safe draft plan to preview. Shall we try this design?"
                }));
                setPagePlanNotice(result.reason);
              }else{
                const response=result?.clarification||result?.reason||
                  "Interpretation unavailable. You can still use exact editing controls.";
                setPageConversation(addWebsiteConversationTurn(asked,scope,{
                  role:"busy",text:response
                }));
                setPagePlanNotice(response);
                // Keep the response visible. The next typed or spoken
                // message becomes a follow-up with this scoped context.
                if(result?.clarification)setPageInstruction("");
              }
            }finally{setPageInterpretBusy(false);}
          }}/>
        {pageConversation?.ok&&pageConversation.scope.draftId===draft.id&&
         pageConversation.scope.generation===draft.generation&&
         pageConversation.scope.pageId===(activePage?.id||"home")?(
          <View style={{marginVertical:8}}>
            {pageConversation.turns.slice(-4).map((turn,i)=>(
              <Text key={String(i)} style={styles.cardBody}>
                {(turn.role==="busy"?"BUSY: ":"You: ")+turn.text}
              </Text>
            ))}
            {(pageConversation.keepColours||pageConversation.keepPhotos)?(
              <Text style={styles.cardBody}>
                {"Keeping your "+[pageConversation.keepColours?"colours":null,
                  pageConversation.keepPhotos?"photographs":null].filter(Boolean).join(" and ")+
                  " unchanged throughout this conversation."}
              </Text>
            ):null}
            <Button label="Start a fresh website conversation" onPress={()=>{
              setPageConversation(null);setPagePlanNotice("");
            }}/>
          </View>
        ):null}
        <Text style={styles.cardBody}>This optional AI interpretation needs an enabled provider and consumes one shared daily website voice/AI request. Typed exact instructions and private previews do not use AI credits. You always approve changes yourself.</Text>
        <Button label="Preview changes — do not save"
          onPress={()=>{
            setSelectedEdit(null);setTapEditMode(false);setVisualCheckOn(false);
            const result=s.previewWebsitePageInstruction?.({
              pageId:activePage?.id||"home",generation:draft.generation,
              instruction:pageInstruction
            });
            setPagePlanPreview(result?.ok?result:null);
            setPagePlanNotice(result?.ok?"Original unchanged — review below.":result?.reason||"This request could not be previewed.");
            setShowPagePlanOriginal(false);
          }}/>
        {pagePlanPreview?.ok&&pagePlanPreview.draftId===draft.id&&
         pagePlanPreview.generation===draft.generation&&
         pagePlanPreview.pageId===(activePage?.id||"home")?(
          <View style={{marginVertical:10}}>
           <Text style={styles.cardBody}>{pagePlanPreview.summary}</Text>
           {pagePlanPreview.steps.map((step,i)=>(
             <Text key={String(i)} style={styles.cardBody}>{(i+1)+". "+step}</Text>
           ))}
           <Button label={showPagePlanOriginal?"Show proposed design":"Show original design"}
            onPress={()=>setShowPagePlanOriginal(x=>!x)}/>
           <View style={{height:325,borderRadius:12,overflow:"hidden",borderColor:"#4A5D78",borderWidth:1}}>
            <WebView
             key={String(pagePlanPreview.generation)+":"+previewSize+":"+String(showPagePlanOriginal)}
             source={{html:withWebsitePreviewViewport(showPagePlanOriginal
               ?pagePlanPreview.originalHtml:pagePlanPreview.candidateHtml,previewSize),baseUrl:"about:blank"}}
             style={{flex:1,backgroundColor:"#fff"}}
             javaScriptEnabled={false} domStorageEnabled={false} incognito
             javaScriptCanOpenWindowsAutomatically={false}
             allowFileAccess={false} mixedContentMode="never"
             onShouldStartLoadWithRequest={req=>req?.url==="about:blank"||
              String(req?.url||"").startsWith("about:blank#")}/>
           </View>
           <Text style={styles.cardBody}>Previewing does not save, consume AI credits or publish. Use the screen-size choices below to compare phone and desktop layouts.</Text>
           <Button primary label={"Apply "+pagePlanPreview.steps.length+" reviewed changes together"}
             onPress={()=>{
              const result=s.applyWebsitePageInstruction?.({
               pageId:pagePlanPreview.pageId,generation:pagePlanPreview.generation,
               instruction:pageInstruction
              });
              setPagePlanNotice(result?.reason||"No changes were saved.");
              setPagePlanPreview(null);
             }}/>
           <Button label="Discard — keep original" onPress={()=>{
             setPagePlanPreview(null);setPagePlanNotice("No changes made.");
           }}/>
          </View>
        ):null}
        {pagePlanNotice?<Text style={styles.cardBody} accessibilityRole="alert">{pagePlanNotice}</Text>:null}
      </Card>

      <Card
        eyebrow="Your design"
        title="This is how your website is taking shape"
        body="See the real colours, typography and layout below. This editable design view is private; prepare a hosted preview to check the exact version before publishing."
        tone="blue"
      >
        <Text style={styles.sectionLabel}>Preview screen size</Text>
        <Button label={(previewSize==="full"?"✓ ":"")+"Use this device's screen width"}
          onPress={()=>{setSelectedEdit(null);setPreviewSize("full");}}/>
        <Button label={(previewSize==="phone"?"✓ ":"")+"Show phone-width layout"}
          onPress={()=>{setSelectedEdit(null);setPreviewSize("phone");}}/>
        <Button label={(previewSize==="tablet"?"✓ ":"")+"Show tablet-width layout"}
          onPress={()=>{setSelectedEdit(null);setPreviewSize("tablet");}}/>
        <Button label={(previewSize==="desktop"?"✓ ":"")+"Show desktop-width layout"}
          onPress={()=>{setSelectedEdit(null);setPreviewSize("desktop");}}/>
        <Text style={styles.cardBody}>One website adapts to all screens. Tablet and desktop layouts are scaled down on a phone. Use this device view for easier tapping and editing.</Text>
        <Button label={visualCheckOn?"Checking this rendered page…":designCandidate?
          "Check original at this width":"Check this page for layout problems"}
          disabled={visualCheckOn||candidateCheckOn}
          onPress={()=>requestReview(previewSize,"original")}/>
        {visualCheckOn||candidateCheckOn?(
          <Button label="Stop this layout check" onPress={()=>stopCapture("Layout check stopped. Your draft is unchanged.")}/>
        ):null}
        {pageReviewCoverage.checked.length?(
         <Text style={styles.cardBody}>{pageReviewCoverage.message}</Text>
        ):null}
        {pageReviewCoverage.checked.length?(
          <Text style={styles.cardBody}>{crossScreenEvidence.message}</Text>
        ):null}
        {evidenceSummary?.ok?(
          <Text style={styles.cardBody}>
            {"V3.172 • Current-page evidence: "+
              evidenceSummary.checked.length+" of 3 preview width groups checked. "+
              evidenceSummary.nextAction+
              " These measurements do not prove conversions or real-device accessibility."}
          </Text>
        ):null}
        {visualCheckResult?(
          <View style={{marginVertical:10}}>
           <Text style={styles.cardBody}>{visualCheckResult.message}</Text>
           {visualCheckResult.issues.map(item=>(
            <Text key={item.id} style={styles.cardBody}>
             {"• "+item.label+". "+item.detail}
            </Text>
           ))}
           <Text style={styles.cardBody}>
            {"Checked at "+visualCheckResult.counts.viewport+"px. "+websitePreviewWidthNote(previewSize,visualCheckResult.counts.viewport)+" These checks are not design-quality approval. Always inspect the hosted site on a real device before publishing."}
           </Text>
           {layoutAdvice?(
            <>
             <Text style={styles.sectionLabel}>Optional safe design alternative</Text>
             <Text style={styles.cardBody}>{layoutAdvice.explanation}</Text>
             {layoutAdvice.tradeoff?<Text style={styles.cardBody}>{layoutAdvice.tradeoff}</Text>:null}
             {ownerDesignPreference(draft,layoutAdvice.id)==="disliked"?
              <Text style={styles.cardBody}>You previously rejected this look. BUSY won't recommend it as a preferred choice.</Text>:null}
             <Button label={layoutAdvice.label+" — preview first"}
              onPress={()=>tryCandidate()}/>
            </>
           ):null}
          </View>
        ):null}
        {visualCheckResult&&!designCandidate&&!visualCheckOn?coordinatedAdvice.map(advice=>(
          <View key={advice.id} style={{marginVertical:8}}>
            <Text style={styles.sectionLabel}>{advice.label}</Text>
            <Text style={styles.cardBody}>{advice.explanation+" "+advice.tradeoff+" This is a design hypothesis; measure both versions before keeping it."}</Text>
            <Button label="Compare this coordinated look" onPress={()=>tryCandidate(advice)}/>
          </View>
        )):null}
        {designCandidate?(
         <View style={{marginVertical:12}}>
          <Text style={styles.sectionLabel}>Testing a private alternative</Text>
          <Text style={styles.cardBody}>
           {candidateCheckOn?"BUSY is measuring the alternative at the same width…":
            comparisonWords?.headline||"Preparing a new comparison…"}
          </Text>
          <Text style={styles.cardBody}>{comparisonWords?.description||
            "Your original is unchanged until you choose Keep."}</Text>
          {measuredPriority?.ok?(
            <Text style={styles.cardBody}>
              {"V3.173 • Evidence review: "+
                measuredPriority.checkedWidthGroups.length+
                " of 3 widths have a comparable current-revision report. "+
                measuredPriority.recommendation.replaceAll("_"," ")+
                ". A single width cannot establish that the design improved on every screen."}
            </Text>
          ):null}
          <Text style={styles.sectionLabel}>Measured across screen sizes</Text>
          {designReviewProgress.ok?<Text style={styles.cardBody}>{designReviewProgress.nextLabel}</Text>:null}
          {designReviewProgress.ok&&designReviewProgress.next&&!designReviewProgress.hasRegressions?(
            <Button label={designReviewProgress.nextLabel}
              disabled={visualCheckOn||candidateCheckOn}
              onPress={()=>requestReview(designReviewProgress.next.mode,designReviewProgress.next.variant)}/>
          ):null}
          <Text style={styles.cardBody}>{privateWidthReview?.ok?
            privateWidthReview.summary:
            "You can compare this same private alternative on phone, tablet and desktop. Check the original and alternative at each width. These are WebView layout measurements, not independent screenshots."}</Text>
          {privateWidthReview?.ok&&privateWidthReview.checked.map(check=>(
            <Text key={check.device} style={styles.cardBody}>
              {check.device+": "+check.originalWarnings+" original warnings, "+
               check.candidateWarnings+" alternative warnings"+
               (check.newMeasuredProblems.length?" — regression found":"")}
            </Text>
          ))}
          <Button label={candidateCheckOn?"Checking alternative…":"Check alternative at this width"}
            disabled={candidateCheckOn||visualCheckOn}
            onPress={()=>requestReview(previewSize,"candidate")}/>
          {comparisonWords?.facts.map((fact,i)=>(
            <Text key={String(i)} style={styles.cardBody}>{fact}</Text>
          ))}
          <Button label={showOriginalComparison?"See proposed alternative":"See my original design"}
           disabled={candidateCheckOn}
           onPress={()=>setShowOriginalComparison(x=>!x)}/>
          {candidateIsCurrent&&designReviewProgress.mayKeep&&candidateComparison?.valid&&
           candidateComparison.noNewMeasuredProblems&&privateWidthReview?.hasRegressions!==true?(
            <Button label="Keep this design in my private draft"
             disabled={visualCheckOn||candidateCheckOn||!!requestedReview}
             onPress={keepCandidate}/>
          ):null}
          <Button label="Return to my original design" onPress={discardCandidate}/>
          <Text style={styles.cardBody}>Checking one width allows a private, undoable change, not a claim of full responsive quality. Check on real devices before calling this a visual improvement. No customer website has been independently screenshot-tested here.</Text>
         </View>
        ):null}
        {designCandidateNotice?<Text style={styles.cardBody}>{designCandidateNotice}</Text>:null}
        <View style={{
          marginTop: 12, borderRadius: 16, overflow: "hidden",
          borderWidth: 1, borderColor: "#344157", alignSelf:"center",
          width:"100%",maxWidth:previewSize==="phone"?390:undefined,
          backgroundColor: "#fff", height: 610,
        }}>
          <WebView
            key={String(draft?.generation || 1) + ":" + String(activePage?.id||"home") + ":" + String(draft?.updatedAt || "") + ":" + String(tapEditMode) + ":" + previewSize + ":" + String(visualCheckOn) + ":" + candidateKey + ":" + String(candidateCheckOn) + ":" + String(showOriginalComparison)}
            source={{ html: interactiveHtml, baseUrl: "about:blank" }}
            style={{ flex: 1, backgroundColor: "#fff" }}
            originWhitelist={["*"]}
            javaScriptEnabled={tapEditMode||visualCheckOn||candidateCheckOn}
            javaScriptCanOpenWindowsAutomatically={false}
            onMessage={receiveTap}
            onError={()=>stopCapture("The preview could not load. Your draft is unchanged. Reload the preview before checking again.")}
            onContentProcessDidTerminate={()=>stopCapture("The preview stopped. Your draft is unchanged; reload before checking again.")}
            domStorageEnabled={false}
            incognito
            mixedContentMode="never"
            allowFileAccess={false}
            allowFileAccessFromFileURLs={false}
            allowUniversalAccessFromFileURLs={false}
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={request=>{
              const href=request?.url || "";
              // Permit in-page anchor scrolling only; no arbitrary links
              // or external-site navigation from the editable concept.
              return href==="about:blank"||href.startsWith("about:blank#");
            }}
          />
        </View>
        <Text style={[styles.cardBody, { marginTop: 10 }]}>
          {candidateCheckOn ? "Reviewing the private alternative at this width…" : showOriginalComparison ? "Your unchanged original design is shown." : visualCheckOn ? "Checking the rendered layout at this width. This may take a moment." : tapEditMode ? "Tap what you want to change. Then choose Edit, the microphone, or More. All changes have Undo." : "Scroll inside the preview to explore the design. You can change wording, style or services before preparing a hosted version."}
        </Text>
      </Card>

      <WebsiteTapEditor draft={draft} selection={selectedEdit}
        initialMode={selectedEdit?.initialMode||"edit"}
        onClose={()=>setSelectedEdit(null)}
        onTextChange={s.applyWebsiteFieldChange}
        onLayoutChange={s.applyWebsiteLayoutAction}
        onApplyInstruction={s.applySelectedWebsiteInstruction}
        onPreviewInstruction={s.previewSelectedWebsiteInstruction}
        onTranscribe={s.transcribeSelectedWebsiteAudio}/>
      {s.websiteBuilderNotice?<Text style={styles.cardBody}>{s.websiteBuilderNotice}</Text>:null}
      {s.canUndoWebsite ? <Button label="Undo last website change" onPress={s.undoWebsiteChange} /> : null}
      {s.canRedoWebsite ? <Button label="Redo website change" onPress={s.redoWebsiteChange} /> : null}
      <Button label={showRecoveryTools?"Hide recovery options":"Protect or restore my website draft"}
       onPress={()=>setShowRecoveryTools(x=>!x)}/>
      {showRecoveryTools?(
       <Card eyebrow="Private recovery point"
         title="A safe place to come back to"
         body="Keep a private design checkpoint and recent Undo/Redo in encrypted device storage where available. Recovery requires this exact business and draft revision; expired, changed or oversized histories cannot be restored. Your live website is never rolled back."
         tone="blue">
         <Text style={styles.cardBody}>{s.websiteRecoveryNotice||"Device recovery is being checked. Keep this app open until saving is confirmed."}</Text>
         <Button label="Save this design as my recovery point"
          onPress={()=>{setConfirmRecoveryRestore(false);s.saveWebsiteRecoveryPoint?.();}}/>
         {s.websiteRecoveryPointAvailable?(
           confirmRecoveryRestore?(
            <>
             <Text style={styles.cardBody}>Restore the saved design as a new PRIVATE draft? This can be undone and will not change a published website.</Text>
             <Button label="Yes, restore my saved design" onPress={()=>{
               s.restoreWebsiteRecoveryPoint?.();setConfirmRecoveryRestore(false);
             }}/>
             <Button label="Cancel restoration" onPress={()=>setConfirmRecoveryRestore(false)}/>
            </>
           ):<Button label="Restore saved design" onPress={()=>setConfirmRecoveryRestore(true)}/>
         ):null}
       </Card>
      ):null}
      <Button label={hosted ? "View hosted website again" : "Prepare private hosted preview"}
        primary onPress={openHosted} />
      <Button label="Edit my website" onPress={() => s.go("websiteBuilder")} />
      <Button label="Website Management & Go Live" onPress={s.openWebsitePublishing} />
      <Button label="Back to Home" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

export { WebsiteBuilder, WebsitePreview };
