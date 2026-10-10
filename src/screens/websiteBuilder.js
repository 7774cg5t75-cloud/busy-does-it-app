import React from "react";
import { Image, Text, View } from "react-native";

import { styles } from "../theme/styles";
import { Shell, Card, Button, Field, MetricRow, StatusChip } from "../components/ui";
import { buildWebsiteLaunchJourney } from "../core/websiteLaunchJourney";
import { buildWebsiteLaunchProof } from "../core/websiteLaunchProof.mjs";
import { websiteQualityGuidance } from "../core/websiteQualityGuidance.mjs";

function WebsiteBuilder({ s }) {
  const draft = s.websiteDraft;
  const brand = s.brandBrain || {};
  const [instruction, setInstruction] = React.useState("");
  const [showWebsiteDetails, setShowWebsiteDetails] = React.useState(false);
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
  const nextStep=()=>{
    switch(journey.nextAction){
      case "brand":return s.openBrandIdentity();
      case "build":return s.buildWebsiteFromBrandBrain();
      case "prepare":return s.openWebsitePublishing();
      case "review":return hostedPreview?.id
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
    prepare:"Prepare the hosted version",
    review:"View hosted website preview",
    verify:"Check my live website",
    maintain:"Manage my live website"
  }[journey.nextAction]||"Continue website setup";

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
        <MetricRow left="Public website" right={journey.isVerified ? "Verified" :
          s.websitePublishingView?.liveDeployment ? "Checking connection" : "Not published"} />
        <Button label={nextLabel} primary onPress={nextStep} />
        <Button label={draft ? "Make changes by talking to BUSY" : "Build it by talking to BUSY"}
          onPress={draft ? s.askBusyToEditWebsite : s.askBusyToBuildWebsite} />
        {draft ? (
          <Button label="Preview my website draft" onPress={() => s.go("websitePreview")} />
        ) : null}
        {hostedPreview?.id && journey.nextAction !== "review" ? (
          <Button label="View my hosted website again"
            primary={!hostedPreviewOutdated && journey.nextAction !== "brand"}
            onPress={() => s.openHostedWebsitePreview(hostedPreview.id)} />
        ) : null}
        {hostedPreviewOutdated ? (
          <Text style={styles.cardBody}>
            Your saved hosted preview is an earlier version. Prepare a new preview after your edits when you're ready.
          </Text>
        ) : null}
      </Card>
      {!qualityGuide.complete ? (
        <Card
          eyebrow="Make your website stronger"
          title="A few details make a big difference"
          body="BUSY will use what you've already told her. These are ideas to help improve the result, not compulsory steps."
          tone="blue"
        >
          {qualityGuide.priority.map((item) => (
            <View key={item.id} style={{ marginTop: 8 }}>
              <Text style={[styles.cardTitle, { fontSize: 15 }]}>{item.title}</Text>
              <Text style={styles.cardBody}>{item.detail}</Text>
            </View>
          ))}
          {qualityGuide.remaining > 0 ? (
            <Text style={[styles.cardBody, { marginTop: 9 }]}>
              {"Plus " + qualityGuide.remaining + " more suggestion" + (qualityGuide.remaining === 1 ? "" : "s") + " in your business details."}
            </Text>
          ) : null}
          <Button label="Improve my business details" onPress={s.openBrandIdentity} />
          <Button label={draft ? "Or just edit my website with BUSY" : "Or start talking to BUSY"}
            onPress={draft ? s.askBusyToEditWebsite : s.askBusyToBuildWebsite} />
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
          <Text style={styles.sectionLabel}>Make changes</Text>
          <Card
            eyebrow="Your changes"
            title="Tell BUSY what you would like changed"
            body="Ask for different wording, services, photos or colours. BUSY will use your saved business details rather than make up facts."
            footer="Examples: “change the headline to…”, “update my opening hours to…”, “add gutter cleaning”, “put roof cleaning first”, or “make the main photo bigger”."
            tone="blue"
          >
            <Field
              label="Website change"
              value={instruction}
              onChangeText={setInstruction}
              placeholder="e.g. Change the headline to Proper local service"
            />
            <Button label="Apply change" primary onPress={applyInstruction} />
            <Button label="Tell BUSY by voice" onPress={s.askBusyToEditWebsite} />
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
  const hero = (draft.sections || []).find((section) => section.id === "hero");
  const visible = (draft.sections || []).filter((section) => section.enabled !== false);

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
        eyebrow={draft.businessName || "Business"}
        title={hero?.title || draft.businessName || "Website"}
        body={hero?.body || ""}
        footer={hero?.cta || ""}
        tone="green"
      >
        {hero?.asset?.uri ? (
          <Image
            source={{ uri: hero.asset.uri }}
            style={{ width: "100%", height: draft.theme?.heroSize === "extra-large" ? 280 : 190, borderRadius: 16, marginVertical: 10 }}
            resizeMode="cover"
          />
        ) : null}
      </Card>

      {visible
        .filter((section) => section.id !== "hero")
        .map((section) => (
          <Card
            key={section.id}
            eyebrow={section.type}
            title={section.title}
            body={section.body || ""}
            tone="blue"
          >
            {(section.items || []).slice(0, 8).map((item, index) => (
              <View key={item.id || item.key || `${section.id}-${index}`} style={{ marginBottom: 12 }}>
                {item.uri ? (
                  <Image
                    source={{ uri: item.uri }}
                    style={{ width: "100%", height: 150, borderRadius: 14, marginBottom: 8 }}
                    resizeMode="cover"
                  />
                ) : null}
                {item.title ? <Text style={styles.cardTitle}>{item.title}</Text> : null}
                {item.body ? <Text style={styles.cardBody}>{item.body}</Text> : null}
              </View>
            ))}
            {section.type === "contact" ? (
              <>
                {section.phone ? <MetricRow left="Phone" right={section.phone} /> : null}
                {section.email ? <MetricRow left="Email" right={section.email} /> : null}
                {section.openingHours ? <MetricRow left="Hours" right={section.openingHours} /> : null}
              </>
            ) : null}
          </Card>
        ))}

      <Button label={hosted ? "View hosted website again" : "Prepare private hosted preview"}
        primary onPress={openHosted} />
      <Button label="Edit my website" onPress={() => s.go("websiteBuilder")} />
      <Button label="Website Management & Go Live" onPress={s.openWebsitePublishing} />
      <Button label="Back to Home" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

export { WebsiteBuilder, WebsitePreview };
