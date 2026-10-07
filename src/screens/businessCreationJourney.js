import React from "react";
import { Text } from "react-native";

import { styles } from "../theme/styles";
import { Shell, Card, Button, Field, MetricRow } from "../components/ui";
import { miniAppModuleLabel } from "../domain/miniApps";

function BusinessCreationJourney({ s }) {
  const journey = s.businessCreationJourney || {};
  const steps = Array.isArray(journey.steps) ? journey.steps : [];
  const appModules = Array.isArray(journey.recommendedAppModules)
    ? journey.recommendedAppModules
    : [];
  const websiteSections = Array.isArray(journey.recommendedWebsiteSections)
    ? journey.recommendedWebsiteSections
    : [];

  return (
    <Shell
      s={s}
      title="Build my business with BUSY"
      subtitle="Describe the business once. BUSY turns the same approved facts into a coordinated website, Business App and social starting point."
      brandCue="V3.57 • one conversation • one shared business profile • coordinated private drafts • owner approval before publishing."
    >
      <Card
        eyebrow="Business Creation Journey"
        title={journey.headline || "Tell BUSY what this business should become"}
        body="Use normal language. BUSY will reuse facts it already knows, ask only for genuinely missing details, and prepare private work across the business-building tools."
        footer="Nothing is published from this screen."
        tone="green"
      >
        <Field
          label="Tell BUSY about the business and what you want"
          value={s.businessCreationBrief}
          onChangeText={s.setBusinessCreationBrief}
          placeholder="e.g. We are a mobile dog groomer covering Exeter. I want a simple website, an app where customers can see services and request appointments, and social content that feels friendly and local."
          multiline
        />
        <Button
          label={
            s.businessCreationAction === "prepare"
              ? "Preparing business launch pack…"
              : "Prepare everything"
          }
          primary
          disabled={
            !String(s.businessCreationBrief || "").trim() ||
            !!s.businessCreationAction
          }
          onPress={s.prepareBusinessCreationJourney}
        />
        <Button
          label="Describe it by voice"
          disabled={!!s.businessCreationAction}
          onPress={s.describeBusinessCreationByVoice}
        />
      </Card>

      <Card
        eyebrow="One guided journey"
        title={`${Number(journey.readyCount || 0)} of ${Number(
          journey.totalSteps || steps.length || 0
        )} stages prepared`}
        body="The underlying builders stay separate and safe, but the owner no longer has to think about them as separate products."
        tone="blue"
      >
        {steps.map((step) => (
          <MetricRow
            key={step.id}
            left={step.label}
            right={
              step.status === "complete"
                ? "Ready"
                : step.status === "working"
                ? "In progress"
                : step.status === "ready"
                ? "Ready to prepare"
                : "Waiting"
            }
            strong={step.status === "complete"}
          />
        ))}
      </Card>

      <Card
        eyebrow="BUSY's starting plan"
        title="Shared recommendations"
        body="These suggestions come from the same approved business profile used by the Website Builder and Business App Builder."
        footer="Recommendations never create a price, offer, service, reward or public claim that the owner has not supplied."
      >
        <Text style={styles.sectionLabel}>Business App</Text>
        {appModules.slice(0, 8).map((key) => (
          <MetricRow
            key={`app-${key}`}
            left={miniAppModuleLabel(key)}
            right="Suggested"
          />
        ))}
        <Text style={styles.sectionLabel}>Website</Text>
        {websiteSections.slice(0, 8).map((key) => (
          <MetricRow
            key={`web-${key}`}
            left={String(key || "").replaceAll("_", " ")}
            right="Suggested"
          />
        ))}
      </Card>

      {s.businessCreationNotice ? (
        <Card
          eyebrow="BUSY"
          title="Launch pack updated"
          body={s.businessCreationNotice}
          tone="green"
        />
      ) : null}

      {s.businessCreationError ? (
        <Card
          eyebrow="Needs attention"
          title="BUSY could not finish part of the preparation"
          body={s.businessCreationError}
          tone="amber"
        />
      ) : null}

      {s.websiteDraft ? (
        <Button label="Review website draft" onPress={() => s.go("websitePreview")} />
      ) : null}
      {s.miniAppsView?.builderPlan || s.miniAppsView?.hasDraft ? (
        <Button label="Review Business App plan" onPress={s.openMiniAppBuilder} />
      ) : null}
      {String(s.socialBrief || "").trim() ? (
        <Button label="Open Social Media Creator" onPress={() => s.go("socialCreator")} />
      ) : null}
      <Button label="Back to Home" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

export { BusinessCreationJourney };
