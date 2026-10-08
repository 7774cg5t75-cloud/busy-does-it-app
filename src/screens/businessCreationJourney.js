import React from "react";
import { Text } from "react-native";

import { styles } from "../theme/styles";
import { Shell, Card, Button, Field, MetricRow } from "../components/ui";
import { miniAppModuleLabel } from "../domain/miniApps";
import { reviewConversation } from "../domain/conversationUnderstanding.mjs";

function BusinessCreationJourney({ s }) {
  const journey = s.businessCreationJourney || {};
  const conversationReview = reviewConversation({
    turns: [s.businessCreationBrief],
    approved: s.businessCreationIntelligence?.sharedProfile || {},
  });
  const proposedFacts = Object.entries(conversationReview.draft);
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
      brandCue="V3.60 • confirm conversational facts • dependency handling • coordinated updates • one launch-pack review."
    >
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
