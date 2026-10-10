import React from "react";
import { Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { styles } from "../theme/styles";
import { Shell, Card, Button, Field, MetricRow, StatusChip } from "../components/ui";
import { buildWebsiteLaunchJourney } from "../core/websiteLaunchJourney";
import { buildWebsiteLaunchProof } from "../core/websiteLaunchProof.mjs";
import { websiteQualityGuidance } from "../core/websiteQualityGuidance.mjs";
import { websiteDesignAlternative } from "../core/websiteDesignAlternatives.mjs";
import { websiteCustomerJourney } from "../core/websiteCustomerJourney.mjs";
import { websiteOutcomeGuidance } from "../core/websiteOutcomeGuidance.mjs";
import { websiteJourneyAssurance } from "../core/websiteJourneyAssurance.mjs";
import { websiteOnboardingCoach } from "../core/websiteOnboardingCoach.mjs";
import { websiteBrainCoaching } from "../core/websiteBrainCoaching.mjs";
import { renderWebsiteHtml } from "../domain/websiteBuilder";

function WebsiteBuilder({ s }) {
  const draft = s.websiteDraft;
  const brand = s.brandBrain || {};
  const [instruction, setInstruction] = React.useState("");
  const [showWebsiteDetails, setShowWebsiteDetails] = React.useState(false);
  const [showQualityIdeas, setShowQualityIdeas] = React.useState(false);
  const [showDesignReview, setShowDesignReview] = React.useState(false);
  const [designOptionIndex,setDesignOptionIndex]=React.useState(0);
  const [showCustomization, setShowCustomization] = React.useState(false);
  const [showVisualAi, setShowVisualAi] = React.useState(false);
  const [showOutcomeFeedback,setShowOutcomeFeedback]=React.useState(false);
  const [feedbackState,setFeedbackState]=React.useState({status:"idle",message:""});
  const [savedStylePreferences,setSavedStylePreferences]=React.useState(null);
  const feedbackBusy=React.useRef(false);
  const hostedPreview = s.websitePublishingView?.previewDeployment || null;
  const hostedPreviewOutdated = !!s.websitePublishingView?.draftChangedSinceHosted;
  const deliveryProof=buildWebsiteLaunchProof({
    ...(s.websitePublishingView||{}),websiteDraftPresent:!!draft
  });
  const journey=buildWebsiteLaunchJourney({
    brand, draft, publishing:s.websitePublishingView,deliveryProof
  });
  const missingDeliveryCheck=deliveryProof.checks.find(check=>!check.ready);
  const qualityGuide = websiteQualityGuidance({ brandBrain: brand, draft });
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
  },[draft?.id,s.cloudWorkspace?.businessId]);
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
    feedbackBusy.current=true;
    setFeedbackState({status:"saving",message:""});
    try{
      await s.recordWebsiteDesignFeedback(choice);
      const updated=await s.readWebsiteDesignFeedback().catch(()=>null);
      if(updated?.scope==="current_business_only")
        setSavedStylePreferences(updated);
      setFeedbackState({status:"saved",
        message:"Saved privately for this business. BUSY can use your preferences in future improvements; it has not retrained any AI model."});
    }catch{
      setFeedbackState({status:"unavailable",
        message:"BUSY could not save your preference to the business workspace yet. Nothing has been shared."});
    }finally{feedbackBusy.current=false;}
  };
  const clearPreferences=async()=>{
    if(feedbackBusy.current)return;
    feedbackBusy.current=true;
    setFeedbackState({status:"saving",message:""});
    try{
      await s.clearWebsiteDesignFeedback();
      setSavedStylePreferences(null);
      setFeedbackState({status:"cleared",message:"Private style preferences cleared for this business."});
    }catch{
      setFeedbackState({status:"unavailable",message:"BUSY could not confirm preferences were cleared. No shared learning was enabled."});
    }finally{feedbackBusy.current=false;}
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
        {hostedPreview?.id && journey.nextAction !== "review" ? (
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
                {brainCoach.explanation}
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
                </>
              ) : null}
              {s.websiteVisualReviewStatus?.enabled &&
               Number(s.websiteVisualReviewStatus?.remaining||0)>0 ? (
                <Button label="Use 1 review credit on my hosted website"
                  onPress={s.requestWebsiteVisualReview} />
              ) : null}
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
                    <Button label="Approve design changes in my PRIVATE draft"
                      onPress={s.approveWebsiteVisualSuggestions} />
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
            footer="Examples: “change services heading to Our work”, “move about before services”, “use a minimal design”, or “make the main photo bigger”."
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
        </>
      ) : null}
      <Button label={showWebsiteDetails ? "Hide extra website settings" : "More website settings"}
        onPress={() => setShowWebsiteDetails(!showWebsiteDetails)} />
      {showWebsiteDetails ? (
        <>
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
  const liveConceptHtml = draft ? renderWebsiteHtml(draft) : "";
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

      <Card
        eyebrow="Your design"
        title="This is how your website is taking shape"
        body="See the real colours, typography and layout below. This editable design view is private; prepare a hosted preview to check the exact version before publishing."
        tone="blue"
      >
        <View style={{
          marginTop: 12, borderRadius: 16, overflow: "hidden",
          borderWidth: 1, borderColor: "#344157",
          backgroundColor: "#fff", height: 610,
        }}>
          <WebView
            key={String(draft?.generation || 1) + ":" + String(draft?.updatedAt || "")}
            source={{ html: liveConceptHtml, baseUrl: "about:blank" }}
            style={{ flex: 1, backgroundColor: "#fff" }}
            originWhitelist={["*"]}
            javaScriptEnabled={false}
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
          Scroll inside the preview to explore the design. You can change your wording, style or services before preparing a new hosted version.
        </Text>
      </Card>

      {s.canUndoWebsite ? <Button label="Undo last website change" onPress={s.undoWebsiteChange} /> : null}
      <Button label={hosted ? "View hosted website again" : "Prepare private hosted preview"}
        primary onPress={openHosted} />
      <Button label="Edit my website" onPress={() => s.go("websiteBuilder")} />
      <Button label="Website Management & Go Live" onPress={s.openWebsitePublishing} />
      <Button label="Back to Home" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

export { WebsiteBuilder, WebsitePreview };
