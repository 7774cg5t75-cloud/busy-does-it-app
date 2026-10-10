import React from "react";
import { Image, Text, View } from "react-native";

import { styles } from "../theme/styles";
import { Shell, Card, Button, Field, MetricRow, StatusChip } from "../components/ui";
import { buildWebsiteLaunchJourney } from "../core/websiteLaunchJourney";
import { buildWebsiteLaunchProof } from "../core/websiteLaunchProof.mjs";

function WebsiteBuilder({ s }) {
  const draft = s.websiteDraft;
  const brand = s.brandBrain || {};
  const [instruction, setInstruction] = React.useState("");
  const deliveryProof=buildWebsiteLaunchProof({
    ...(s.websitePublishingView||{}),websiteDraftPresent:!!draft
  });
  const journey=buildWebsiteLaunchJourney({
    brand, draft, publishing:s.websitePublishingView,deliveryProof
  });
  const missingDeliveryCheck=deliveryProof.checks.find(check=>!check.ready);
  const nextStep=()=>{
    switch(journey.nextAction){
      case "brand":return s.openBrandIdentity();
      case "build":return s.buildWebsiteFromBrandBrain();
      case "prepare":
      case "review":
      case "verify":
      case "maintain":return s.openWebsitePublishing();
      default:return s.openBrandIdentity();
    }
  };
  const nextLabel={
    brand:"Complete business details",
    build:"Build my first draft",
    prepare:"Prepare the hosted version",
    review:"Review the hosted preview",
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
      subtitle="Build from the Brand Brain instead of starting from a blank page."
      brandCue="V3.77 • guided website launch • clear approval and verification"
    >
      <Card
        eyebrow="V3.77 • Your website launch plan"
        title={journey.isVerified?"Your published website has passed its deployment check":
          "Your next step: "+nextLabel}
        body="BUSY guides you from recording your business details to reviewing a private draft, approving the exact hosted version and checking the public site. You stay in control of Go Live."
        footer={journey.completedStages+" of "+journey.totalStages+
          " launch milestones complete • No automatic publishing"}
        tone={journey.isVerified?"green":"blue"}
      >
        {journey.stages.map(item=>(
          <MetricRow key={item.id}
            left={item.title}
            right={item.state==="complete"?"Done":
              item.state==="needs_details"?"Add details":
              item.state==="working"?"In progress":
              item.state==="ready"?"Ready":"Next"}/>
        ))}
        <Button label={nextLabel} primary onPress={nextStep}/>
      </Card>
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
      <Card
        eyebrow="Website generation"
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
            <MetricRow left="Status" right={draft.status} />
            <MetricRow left="Public status" right={draft.publicStatus} strong />
            <MetricRow left="Theme" right={draft.theme?.mood || "clean"} />
            <MetricRow left="Sections" right={String((draft.sections || []).filter((item) => item.enabled !== false).length)} />
            <MetricRow left="Pages" right={String(draft.pages?.length || 1)} strong={(draft.pages?.length || 1) > 1} />
            <MetricRow left="SEO basics" right={s.websitePublishingView?.seoAudit?.label || "Not checked"} />
            <MetricRow left="HTML source" right={draft.html ? "Generated" : "Not generated"} />
            <Button label="Preview website" primary onPress={() => s.go("websitePreview")} />
          </Card>

          <Text style={styles.sectionLabel}>Talk-style edits</Text>
          <Card
            eyebrow="Conversational website editing"
            title="Tell BUSY what you want changed"
            body="The editor now safely handles exact public wording/contact changes, adding or removing named services, changing service emphasis, section visibility and visual style. Vague claims are still not invented."
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
            eyebrow="V3.38 • Website delivery & real-world signals"
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

  const hero = (draft.sections || []).find((section) => section.id === "hero");
  const visible = (draft.sections || []).filter((section) => section.enabled !== false);

  return (
    <Shell
      s={s}
      title="Website preview"
      subtitle="A mobile preview of the editable website model."
      brandCue="Editor preview • hosted preview, delivery and public Go Live remain separate V3.38 states."
    >
      <View style={{ alignItems: "flex-start", marginBottom: 10 }}>
        <StatusChip label={draft.publicStatus} tone="blue" />
      </View>

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

      <Card
        eyebrow="Source"
        title="Static website source is generated"
        body="V3.38 packages this multi-page draft into an immutable hosted deployment while delivery/provider state remains separate. Approved images are copied into deployment-specific website assets before anything goes public."
        footer={`${draft.html?.length || 0} source characters • editor source`}
        tone="green"
      />

      <Button label="Prepare / publish website" primary onPress={s.openWebsitePublishing} />
      <Button label="Edit website" onPress={() => s.go("websiteBuilder")} />
      <Button label="Back to Home" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

export { WebsiteBuilder, WebsitePreview };
