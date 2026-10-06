import React from "react";
import { Image, Text, View } from "react-native";

import { styles } from "../theme/styles";
import { Shell, Card, Button, Field, MetricRow, StatusChip } from "../components/ui";

function WebsiteBuilder({ s }) {
  const draft = s.websiteDraft;
  const brand = s.brandBrain || {};
  const [instruction, setInstruction] = React.useState("");

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
      brandCue="V3.35 • Voice-first draft creation • nothing publishes without a later explicit publishing step."
    >
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

      {draft ? (
        <>
          <Card
            eyebrow="Website status"
            title={draft.businessName || "Business website"}
            body={draft.seo?.description || "No public description has been recorded yet."}
            footer="Internal draft only — not live on the internet."
            tone="blue"
          >
            <MetricRow left="Status" right={draft.status} />
            <MetricRow left="Public status" right={draft.publicStatus} strong />
            <MetricRow left="Theme" right={draft.theme?.mood || "clean"} />
            <MetricRow left="Sections" right={String((draft.sections || []).filter((item) => item.enabled !== false).length)} />
            <MetricRow left="HTML source" right={draft.html ? "Generated" : "Not generated"} />
            <Button label="Preview website" primary onPress={() => s.go("websitePreview")} />
          </Card>

          <Text style={styles.sectionLabel}>Talk-style edits</Text>
          <Card
            eyebrow="Conversational website editing"
            title="Tell BUSY what you want changed"
            body="V3.35 safely handles layout/style requests such as “make it more premium”, “make the main photo bigger”, “hide the testimonials”, or “bring the gallery back”."
            footer="Unsupported wording changes are not guessed. BUSY keeps them as a future editing request instead."
            tone="blue"
          >
            <Field
              label="Website change"
              value={instruction}
              onChangeText={setInstruction}
              placeholder="e.g. Make the main photo more prominent"
            />
            <Button label="Apply change" primary onPress={applyInstruction} />
            <Button label="Tell BUSY by voice" onPress={s.askBusyToEditWebsite} />
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
            eyebrow="Publishing boundary"
            title="This website is not live"
            body="V3.35 generates and edits the internal site model and HTML source. It does not buy a domain, alter DNS, upload hosting files or publish anything publicly."
            footer="Those actions can be introduced behind an explicit owner-controlled publishing flow in the next sweep."
            tone="amber"
          />
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
      subtitle="A mobile preview of the internal V3.35 website model."
      brandCue="Preview only • not public • generated from recorded Brand Brain facts."
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
        title="Static website source is already generated"
        body="The draft includes semantic HTML and layout/theme information ready for the later publishing/hosting layer."
        footer={`${draft.html?.length || 0} source characters • internal only`}
        tone="green"
      />

      <Button label="Edit website" primary onPress={() => s.go("websiteBuilder")} />
      <Button label="Back to Home" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

export { WebsiteBuilder, WebsitePreview };
