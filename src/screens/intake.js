import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  StatusBar,
  Switch,
  Image,
  Alert,
  Share,
  Linking,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";

import * as Core from "../core/runtime";
const {
  APP_VERSION,
  PROTOTYPE_BADGE,
  BUSY_AI_URL,
  BUSY_AI_TOKEN,
  BUSY_SOCIAL_URL,
  BUSY_SOCIAL_PUBLISH_URL,
  BUSY_SUPABASE_URL,
  OWNER_SESSION_KEY,
  DEFAULT_OWNER_EMAIL,
  CLOUD_SCHEMA_VERSION,
  busyRequestId,
  fetchWithTimeout,
  busyDataRequest,
  busyAuthRequest,
  ownerSessionFromPayload,
  C,
  VERTICAL_PACKS,
  getVerticalPack,
  servicesSeed,
  planningDurationHours,
  formatDurationHours,
  slotPlanningHours,
  rateEvidence,
  formatPercent,
  chooseRateEvidence,
  busyPhotoToDataUrl,
  socialStoryLabel,
  customerSeed,
  monthsSince,
  repeatMonthsForCustomer,
  isEligibleCustomer,
  nextRepeatDueDate,
  eligibilityRuleText,
  formatMonthsAgo,
  dateFromISO,
  dateToISO,
  formatUKDate,
  daysSinceTimestamp,
  businessBrainFreshness,
  businessBrainRuleScope,
  businessBrainOpportunityFamily,
  businessBrainFamilyLabel,
  businessBrainFeedbackPenalty,
  businessBrainFeedbackEffect,
  manualRuleTargetFamilies,
  enquiryAgeLabel,
  addDaysISO,
  addDaysFromISO,
  nextDateForSlot,
  timeOptionsForSlot,
  defaultTimeForSlot,
  slotWeekdayIndex,
  dateMatchesSlotWeekday,
  timeMatchesSlotPart,
  suggestSpareSlots,
  buildMultiSlotCapacityPlan,
  bookingMatchesWorkGoal,
  normalizePhone,
  normalizeEmail,
  findCustomerMatch,
  extractISODateFromText,
  extractTimeFromText,
  inferCaptureStage,
  inferCaptureService,
  inferCaptureName,
  inferCaptureAddress,
  captureStageStrength,
  customerActionStrength,
  currentJourneyStage,
  assessJourneyReconciliation,
  MAX_CAPTURE_SCREENSHOTS,
  screenshotFileSequence,
  inferCaptureScreenshotOrder,
  normaliseConfidence,
  fieldConfidenceFromParsed,
  criticalIntakeFieldsSafe,
  localIntakeBrainAnalysis,
  normaliseLiveIntakeAnalysis,
  parseQuickCapture,
  triageInboxCandidate,
  captureFingerprint,
  evaluateSafeAutoFile,
  inboxStageTone,
  groupCustomersByService,
  buildSimulatedReply,
  replyActionForStatus,
  customerActionStatus,
  isActiveCustomerAction,
  customerPipelineLabel,
  previousCustomerGroups,
  LEGACY_STORAGE_KEY,
  USER_CACHE_PREFIX,
  storageKeyForUser,
  connectionSeed,
  intakeConnectionKeys,
  connectionRows,
  campaignSteps
} = Core;

import { styles } from "../theme/styles";
import {
  BusyAppMark,
  BusyAssistantMark,
  BusyBrandLockup,
  Shell,
  BottomNav,
  Card,
  Button,
  SmallLink,
  Field,
  DatePickerField,
  Choice,
  ToggleRow,
  MetricRow,
  StatusChip,
  InlineExplanation,
  OpportunityCard,
  ProgressStrip
} from "../components/ui";


function BusyInbox({ s }) {
  const pending = s.inboxPendingItems || [];
  const attention = s.inboxNeedsAttentionItems || [];
  const ready = s.inboxReadyItems || [];
  const processed = [...(s.inboxItems || [])]
    .filter((item) => item.status !== "Pending")
    .sort((a, b) => String(b.reviewedAt || b.queuedAt || "").localeCompare(String(a.reviewedAt || a.queuedAt || "")))
    .slice(0, 6);

  const ItemCard = ({ item }) => {
    const parsed = item.parsed || {};
    const triage = item.triage || {};
    const title = parsed.name || "Customer not identified";
    const service = parsed.service || "Service not detected";
    const contact = parsed.phone || parsed.email || "Contact detail missing";
    return (
      <View key={item.id} style={styles.activityCard}>
        <View style={styles.activityTopRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.customerTimelineLabel}>{String(parsed.stage || "Incoming").toUpperCase()}</Text>
            <Text style={styles.activityName}>{title}</Text>
            <Text style={styles.activityService}>{service} • {item.source}</Text>
          </View>
          <StatusChip
            label={
              triage.reconciliation?.progression
                ? "Continue"
                : triage.lane === "Needs attention"
                ? "Check"
                : "Ready"
            }
            tone={
              triage.reconciliation?.progression
                ? "green"
                : triage.lane === "Needs attention"
                ? "amber"
                : inboxStageTone(parsed.stage)
            }
          />
        </View>
        <Text style={styles.activitySummary}>{contact}</Text>
        {item.screenshots?.length ? (
          <Text style={styles.customerHistoryPhotoMeta}>
            {item.screenshots.length} screenshot{item.screenshots.length === 1 ? "" : "s"} attached • order {String(item.screenshotOrderConfidence || "check").toLowerCase()}
          </Text>
        ) : null}
        {item.aiThreadCount > 1 ? (
          <Text style={styles.customerHistoryPhotoMeta}>
            AI Intake Brain split this batch into {item.aiThreadCount} conversations • this is {item.aiThreadIndex}/{item.aiThreadCount}
          </Text>
        ) : item.aiAnalysis?.mode === "live-vision" ? (
          <Text style={styles.customerHistoryPhotoMeta}>
            AI Intake Brain analysed screenshot content before triage
          </Text>
        ) : null}
        <Text style={styles.activitySummary}>{triage.reason || "Ready for review"}</Text>
        {triage.reconciliation?.progression ? (
          <Text style={styles.customerHistoryPhotoMeta}>
            Same journey detected: {triage.reconciliation.currentStage} → {parsed.stage}
          </Text>
        ) : triage.matchCustomerId ? (
          <Text style={styles.customerHistoryPhotoMeta}>Possible existing customer match detected</Text>
        ) : null}
        {item.autoEvaluation?.safe ? (
          <Text style={styles.customerHistoryPhotoMeta}>
            Passes Safe Autopilot rules — {s.recordFilingMode === "safe" ? "eligible to be handled automatically" : "automatic filing is currently off"}
          </Text>
        ) : s.recordFilingMode === "safe" && item.autoEvaluation?.reason ? (
          <Text style={styles.customerHistoryPhotoMeta}>
            Safe Autopilot stopped: {item.autoEvaluation.reason}
          </Text>
        ) : null}
        {s.recordFilingMode === "safe" && item.autoEvaluation?.safe ? (
          <Button
            label="Let BUSY file this safely"
            onPress={() => {
              const filed = s.fileSafeInboxItem(item, item.autoEvaluation);
              if (filed) s.go("autopilotFiled");
            }}
          />
        ) : null}
        <View style={styles.customerActionsRow}>
          <Pressable onPress={() => s.openInboxItem(item.id)} style={styles.customerOpenWrap}>
            <Text style={styles.customerOpenText}>Review & file</Text>
          </Pressable>
          <Pressable onPress={() => s.dismissInboxItem(item.id)} style={styles.customerEditWrap}>
            <Text style={styles.customerEditText}>Dismiss</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <Shell
      s={s}
      title="BUSY Inbox"
      subtitle="Incoming information is triaged first. Only strict, low-risk record updates can be filed automatically."
      brandCue="BUSY handles the obvious admin. You handle exceptions and approvals."
    >
      <Card
        eyebrow="Inbox triage"
        title={
          pending.length
            ? `${pending.length} item${pending.length === 1 ? "" : "s"} waiting`
            : "Inbox clear"
        }
        body={
          s.recordFilingMode === "safe"
            ? "Safe Autopilot is on. BUSY may file only high-confidence information into an exact existing-customer phone/email match when every trust rule passes. Everything else waits here."
            : "Automatic record filing is off. BUSY can triage and prepare every item, but you review every file."
        }
        footer={s.recordFilingMode === "safe" ? "Safe Autopilot: ON" : "Safe Autopilot: OFF"}
        tone={attention.length ? "amber" : "green"}
      >
        <MetricRow left="Needs attention" right={String(attention.length)} strong={attention.length > 0} />
        <MetricRow left="Ready to review" right={String(ready.length)} />
        <MetricRow left="Would pass Safe Autopilot now" right={String(s.inboxSafeReadyItems.length)} />
        <MetricRow left="Auto-filed safely" right={String(s.inboxAutoFiledCount)} strong={s.inboxAutoFiledCount > 0} />
        <MetricRow left="Filed after owner review" right={String(s.inboxOwnerFiledCount)} />
        <MetricRow left="Dismissed" right={String(s.inboxDismissedCount)} />
      </Card>

      <Card
        eyebrow="What triage means"
        title="Not every incoming item deserves the same interruption"
        body="Missing service/contact details, low-confidence extraction, name-only matches, duplicate stages and backwards lifecycle changes are pushed into Needs attention. Exact, high-confidence forward progress — such as Quote sent → Booking — can stay on the same customer journey when every Safe Autopilot rule passes."
        tone="blue"
      />
      <Button label="Automatic record filing settings" onPress={() => s.go("recordFilingSettings")} />

      {attention.length ? <Text style={styles.sectionLabel}>Needs attention</Text> : null}
      {attention.map((item) => <ItemCard key={item.id} item={item} />)}

      {ready.length ? <Text style={styles.sectionLabel}>Ready to review</Text> : null}
      {ready.map((item) => <ItemCard key={item.id} item={item} />)}

      {!pending.length ? (
        <Card
          eyebrow="Nothing waiting"
          title="No incoming information needs you"
          body="BUSY is not creating Inbox work just to make the screen look active."
          footer="You can still Quick Capture something new"
          tone="green"
        />
      ) : null}

      <Button label="Quick capture something new" primary onPress={s.startQuickCapture} />
      <Button label="Test one customer across 4 connected sources" onPress={s.queueCrossSourceJourneyDemo} />
      <Text style={styles.helper}>
        Load Email → CRM quote → Calendar booking → Invoicing completion for one existing customer. File them top-to-bottom to test V3.1 reconciliation.
      </Text>
      <Button label="Test Safe Autopilot with an existing customer" onPress={s.queueSafeAutopilotExample} />
      <Text style={styles.helper}>
        This test deliberately uses an existing prototype customer. With Safe Autopilot on, it will file the record automatically only if every trust rule passes.
      </Text>
      <Button label="Load 4 ordinary test Inbox items" onPress={s.queueInboxTestBatch} />
      <Text style={styles.helper}>The ordinary Inbox examples are test-only and are designed to exercise the review/exception lanes.</Text>

      {processed.length ? (
        <>
          <Text style={styles.sectionLabel}>Recently processed</Text>
          {processed.map((item) => (
            <View key={item.id} style={styles.activityCard}>
              <View style={styles.activityTopRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.activityName}>{item.parsed?.name || "Incoming item"}</Text>
                  <Text style={styles.activityService}>{item.parsed?.stage || "Incoming"} • {item.source}</Text>
                </View>
                <StatusChip
                  label={item.autoFiled ? "Auto-filed" : item.status}
                  tone={item.status === "Filed" ? "green" : "blue"}
                />
              </View>
              {item.autoFiled ? (
                <>
                  <Text style={styles.activitySummary}>{item.autoFileReason || "Passed Safe Autopilot rules"}</Text>
                  <Pressable onPress={() => s.openCustomer(item.filedCustomerId)} style={styles.customerOpenWrap}>
                    <Text style={styles.customerOpenText}>Open filed customer →</Text>
                  </Pressable>
                </>
              ) : null}
              {item.status === "Dismissed" ? (
                <Pressable onPress={() => s.reopenInboxItem(item.id)} style={styles.customerEditWrap}>
                  <Text style={styles.customerEditText}>Put back in Inbox</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </>
      ) : null}

      <Button label="Back to Work" onPress={() => s.jump("workHub", "Work")} />
    </Shell>
  );
}

function AutopilotFiled({ s }) {
  const item = s.lastAutoFiledInboxItem;
  const customer = item?.filedCustomerId
    ? s.customers.find((candidate) => candidate.id === item.filedCustomerId)
    : null;

  if (!item || !customer) {
    return (
      <Shell
        s={s}
        title="Safe Autopilot"
        subtitle="The automatically filed item could not be reopened."
      >
        <Button label="Open BUSY Inbox" primary onPress={s.openBusyInbox} />
      </Shell>
    );
  }

  return (
    <Shell
      s={s}
      title="BUSY filed it automatically"
      subtitle="This record passed every Safe Autopilot rule. No customer-facing action was taken."
      brandCue="Boring admin handled. Important actions still need you."
    >
      <Card
        eyebrow="Safe Autopilot receipt"
        title={customer.name}
        body={`${item.filedStage || item.parsed?.stage || "Record update"} • ${customer.service}`}
        footer="Filed into an existing customer record"
        tone="green"
      >
        <MetricRow left="Customer match" right="Exact phone / email" strong />
        <MetricRow left="Extraction confidence" right={item.parsed?.confidence || "High"} />
        <MetricRow left="Conflict check" right="Passed" />
        <MetricRow left="Customer message sent" right="No" />
        <MetricRow left="Public post made" right="No" />
        <MetricRow left="Money spent" right="£0" />
      </Card>

      <Card
        eyebrow="Why BUSY was allowed to do this"
        title="All trust rules passed"
        body={item.autoFileReason || "Exact existing-customer match, high-confidence complete data and no active-work conflict."}
        footer="Recorded in Inbox + Intake History"
        tone="blue"
      />

      <Button label="Open customer record" primary onPress={() => s.openCustomer(customer.id)} />
      <Button label="Back to BUSY Inbox" onPress={s.openBusyInbox} />
      <Button label="Automatic filing settings" onPress={() => s.go("recordFilingSettings")} />
    </Shell>
  );
}

function QuickCapture({ s }) {
  const screenshotCount = s.captureScreenshots?.length || 0;
  const canAnalyse = !!s.captureRawText.trim() || screenshotCount > 0;
  const brain = s.captureBrainAnalysis;
  const analysing = s.captureBrainStatus === "analysing";
  const brainReady = s.captureBrainStatus === "ready";
  const needsConnection = s.captureBrainStatus === "needs_connection";

  return (
    <Shell
      s={s}
      title="Quick capture"
      subtitle="Give BUSY the messy input. The AI Intake Brain turns it into structured business information before it reaches the Inbox."
      brandCue="Screenshots, messages and notes in. Clean business admin out."
    >
      <Card
        eyebrow="V3.2 • AI Intake Brain"
        title="Understand the conversation before filing anything"
        body="BUSY now treats the whole batch as one intake problem: conversation order, duplicate overlap, separate customer threads, structured fields and confidence all sit in one analysis contract."
        footer="AI extraction is evidence, not automatically fact"
        tone="green"
      />

      <Text style={styles.sectionLabel}>Where did it come from?</Text>
      {["Customer message", "Email / quote note", "Phone note", "Calendar / booking note", "Invoice / job note"].map((source) => (
        <Choice
          key={source}
          label={source}
          selected={s.captureSource === source}
          onPress={() => s.setCaptureSource(source)}
        />
      ))}

      <Text style={styles.fieldLabel}>Add the message, note or screenshots</Text>
      <TextInput
        multiline
        value={s.captureRawText}
        onChangeText={s.setCaptureRawText}
        placeholder={"Optional text:\nSophie Green\nCould I get a quote for driveway cleaning?\n07700 900111"}
        placeholderTextColor="#9AA3B2"
        style={styles.messageInput}
      />

      <Button
        label={screenshotCount ? `Add more screenshots • ${screenshotCount}/${MAX_CAPTURE_SCREENSHOTS}` : "Add screenshots"}
        primary={!s.captureRawText.trim() && !screenshotCount}
        disabled={screenshotCount >= MAX_CAPTURE_SCREENSHOTS || analysing}
        onPress={s.chooseCaptureScreenshots}
      />

      {screenshotCount ? (
        <>
          <Card
            eyebrow="Screenshot batch"
            title={`${screenshotCount} screenshot${screenshotCount === 1 ? "" : "s"} selected`}
            body={s.captureScreenshotOrderReason || "BUSY keeps these together until the Intake Brain has reconstructed the conversation."}
            footer={`Pre-analysis order: ${s.captureScreenshotOrderConfidence}`}
            tone={s.captureScreenshotOrderConfidence === "Check order" ? "amber" : "blue"}
          />
          <View style={styles.captureScreenshotGrid}>
            {s.captureScreenshots.map((shot, index) => (
              <View key={shot.id || shot.uri} style={styles.captureScreenshotTile}>
                <View style={styles.captureScreenshotImageWrap}>
                  <Image source={{ uri: shot.uri }} style={styles.captureScreenshotImage} />
                  <View style={styles.captureScreenshotBadge}>
                    <Text style={styles.captureScreenshotBadgeText}>{index + 1}</Text>
                  </View>
                </View>
                <Text numberOfLines={1} style={styles.captureScreenshotName}>
                  {shot.fileName || `Screenshot ${index + 1}`}
                </Text>
                <View style={styles.captureScreenshotControls}>
                  <Pressable
                    disabled={index === 0 || analysing}
                    onPress={() => s.moveCaptureScreenshot(shot.id, -1)}
                    style={[styles.captureScreenshotMove, (index === 0 || analysing) && styles.captureScreenshotMoveDisabled]}
                  >
                    <Text style={styles.captureScreenshotMoveText}>‹</Text>
                  </Pressable>
                  <Pressable
                    disabled={analysing}
                    onPress={() => s.removeCaptureScreenshot(shot.id)}
                    style={styles.captureScreenshotRemove}
                  >
                    <Text style={styles.captureScreenshotRemoveText}>Remove</Text>
                  </Pressable>
                  <Pressable
                    disabled={index === screenshotCount - 1 || analysing}
                    onPress={() => s.moveCaptureScreenshot(shot.id, 1)}
                    style={[
                      styles.captureScreenshotMove,
                      (index === screenshotCount - 1 || analysing) && styles.captureScreenshotMoveDisabled,
                    ]}
                  >
                    <Text style={styles.captureScreenshotMoveText}>›</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Button
        label={analysing ? "BUSY is analysing…" : brainReady ? "Analyse again" : "Analyse with BUSY"}
        primary
        disabled={!canAnalyse || analysing}
        onPress={s.runIntakeBrain}
      />

      {s.captureBrainStatus === "error" ? (
        <Card
          eyebrow="AI Intake Brain"
          title="Analysis did not complete"
          body={s.captureBrainError || "BUSY could not analyse this batch."}
          footer="Nothing has been filed"
          tone="amber"
        />
      ) : null}

      {needsConnection ? (
        <Card
          eyebrow="Secure vision connection"
          title="The batch is ready, but BUSY has not read the screenshots"
          body="The V3.2 app-side intelligence and safety flow are in place, but this preview still needs both its BUSY AI endpoint and prototype access token configured. Screenshot-only batches stay unresolved instead of pretending the images were read."
          footer="The OpenAI API key stays server-side"
          tone="amber"
        />
      ) : null}

      {brainReady && brain ? (
        <Card
          eyebrow="BUSY understood"
          title={brain.summary || "Intake analysis ready"}
          body={
            brain.threadCount > 1
              ? `BUSY detected ${brain.threadCount} separate conversations and will keep them as separate Inbox records.`
              : brain.mode === "live-vision"
              ? "The screenshot batch has been analysed as one conversation before entering the normal reconciliation pipeline."
              : "The supplied text has been structured and the screenshots remain attached as source evidence."
          }
          footer={
            brain.mode === "live-vision"
              ? `Order: ${brain.order?.confidence || "Unknown"} • overlaps removed: ${brain.overlapCount || 0}`
              : "Ready for the normal BUSY Inbox trust checks"
          }
          tone={brain.warnings?.length ? "amber" : "green"}
        >
          {brain.threads?.slice(0, 3).map((thread) => (
            <MetricRow
              key={thread.id}
              left={thread.label || "Conversation"}
              right={thread.parsed?.stage || "Incoming"}
            />
          ))}
        </Card>
      ) : null}

      <Button
        label={screenshotCount ? "Add analysed batch to BUSY Inbox" : "Add to BUSY Inbox & triage"}
        disabled={!canAnalyse || analysing}
        onPress={s.queueCaptureToInbox}
      />
      <Button
        label="Review extracted fields manually"
        disabled={!canAnalyse || analysing}
        onPress={s.analyseQuickCapture}
      />

      <Text style={styles.helper}>
        If the live vision service is unavailable, BUSY keeps screenshot-only batches waiting for review. Safe Autopilot never treats unread or low-confidence AI output as fact.
      </Text>

      <Text style={styles.sectionLabel}>Try a text test</Text>
      <Button label="Example enquiry" onPress={() => s.loadQuickCaptureExample("enquiry")} />
      <Button label="Example sent quote" onPress={() => s.loadQuickCaptureExample("quote")} />
      <Button label="Example booking" onPress={() => s.loadQuickCaptureExample("booking")} />
      <Button label="Example completed job" onPress={() => s.loadQuickCaptureExample("completed")} />
    </Shell>
  );
}
function QuickCaptureReview({ s }) {
  const match = s.captureMatch;
  const brainThread =
    s.captureBrainAnalysis?.thread ||
    s.captureBrainAnalysis?.threads?.[0] ||
    null;
  const fieldConfidence =
    brainThread?.fieldConfidence ||
    fieldConfidenceFromParsed({
      name: s.captureName,
      phone: s.capturePhone,
      email: s.captureEmail,
      address: s.captureAddress,
      service: s.captureService,
      stage: s.captureStage,
      date: s.captureDate,
      time: s.captureTime,
      value: s.captureValue,
    });
  const activeAction = match?.customer ? s.replyActions?.[match.customer.id] : null;
  const strongerActiveWork =
    !!activeAction &&
    customerActionStrength(activeAction) > captureStageStrength(s.captureStage);
  const canSave =
    !!s.captureName.trim() &&
    !!s.captureService.trim() &&
    !!(s.capturePhone.trim() || s.captureEmail.trim());
  const fields = s.captureExtractedFields || [];

  return (
    <Shell
      s={s}
      title="Review what BUSY understood"
      subtitle="Nothing changes until you approve this screen."
      brandCue="Extraction is a draft, not a fact."
    >
      {s.selectedInboxItemId ? (
        <Card
          eyebrow="From BUSY Inbox"
          title="BUSY has already triaged this item"
          body="You are now doing the human review. Saving files the Inbox item into the correct customer/work record; going back leaves it pending."
          footer="No record change yet"
          tone="blue"
        />
      ) : null}

      {s.captureScreenshots?.length ? (
        <>
          <Card
            eyebrow="Screenshot source evidence"
            title={`${s.captureScreenshots.length} screenshot${s.captureScreenshots.length === 1 ? "" : "s"} kept together`}
            body={
              s.captureRawText.trim()
                ? "The screenshots stay attached as source evidence alongside the pasted text."
                : "The screenshot batch is attached, but live AI vision is not connected in this prototype. Check or enter the important fields before saving."
            }
            footer={`Order: ${s.captureScreenshotOrderConfidence}`}
            tone={!s.captureRawText.trim() ? "amber" : "blue"}
          />
          <View style={styles.captureReviewStrip}>
            {s.captureScreenshots.map((shot, index) => (
              <View key={shot.id || shot.uri} style={styles.captureReviewThumbWrap}>
                <Image source={{ uri: shot.uri }} style={styles.captureReviewThumb} />
                <View style={styles.captureReviewBadge}>
                  <Text style={styles.captureReviewBadgeText}>{index + 1}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {brainThread ? (
        <Card
          eyebrow="Field-by-field confidence"
          title="BUSY shows where it is sure — and where it is not"
          body="High confidence can support automation only when the other trust rules pass. Medium or low confidence stays visible for owner review."
          tone="blue"
        >
          <MetricRow left="Customer name" right={fieldConfidence.name || "Low"} />
          <MetricRow left="Phone / email" right={fieldConfidence.contact || "Low"} />
          <MetricRow left="Service" right={fieldConfidence.service || "Low"} />
          <MetricRow left="Address" right={fieldConfidence.address || "Low"} />
          <MetricRow left="Date" right={fieldConfidence.date || "Low"} />
          {s.captureStage !== "Enquiry" ? (
            <MetricRow left="Value" right={fieldConfidence.value || "Low"} />
          ) : null}
        </Card>
      ) : null}

      <Card
        eyebrow="Overall extraction confidence"
        title={s.captureConfidence}
        body={
          fields.length
            ? `BUSY found: ${fields.join(", ")}. Check every important field before saving.`
            : "Very little structure was detected. Fill in the fields below before saving."
        }
        footer="Owner review required"
        tone={s.captureConfidence === "High" ? "green" : s.captureConfidence === "Medium" ? "blue" : "amber"}
      />

      {match ? (
        <Card
          eyebrow="Possible existing customer"
          title={match.customer.name}
          body={`${match.reason} • match confidence: ${match.confidence}. BUSY will update this customer instead of creating a duplicate.`}
          footer="Duplicate prevention"
          tone="green"
        >
          <Button label="This is a different customer" onPress={() => s.setCaptureForceNew(true)} />
        </Card>
      ) : (
        <Card
          eyebrow="No matching customer found"
          title="This would create a new customer record"
          body={
            s.captureForceNew
              ? "You chose to keep this as a separate customer even though BUSY had found a possible match."
              : "BUSY checked the saved phone number, email address and full name before deciding."
          }
          tone="blue"
        >
          {s.captureForceNew ? (
            <Button label="Check for an existing match again" onPress={() => s.setCaptureForceNew(false)} />
          ) : null}
        </Card>
      )}

      {strongerActiveWork ? (
        <Card
          eyebrow="Conflict prevented"
          title="Existing active work wins"
          body="This customer already has a stronger active quote, booking or follow-up. The pasted enquiry will be attached as context instead of resetting the customer backwards in the pipeline."
          tone="amber"
        />
      ) : null}

      <Text style={styles.sectionLabel}>What kind of record is this?</Text>
      {["Enquiry", "Quote sent", "Booking", "Completed job"].map((stage) => (
        <Choice
          key={stage}
          label={stage}
          selected={s.captureStage === stage}
          onPress={() => s.setCaptureStage(stage)}
        />
      ))}

      <Field label="Customer name" value={s.captureName} onChangeText={s.setCaptureName} placeholder="Required" />
      <Field label="Phone" value={s.capturePhone} onChangeText={s.setCapturePhone} placeholder="Phone or email required" keyboardType="phone-pad" />
      <Field label="Email" value={s.captureEmail} onChangeText={s.setCaptureEmail} placeholder="Optional if phone is present" keyboardType="email-address" />
      <Field label="Address / job location" value={s.captureAddress} onChangeText={s.setCaptureAddress} placeholder="Optional" />
      <Field
        label="Service"
        value={s.captureService}
        onChangeText={s.setCaptureService}
        placeholder="Service not detected — choose or type one"
      />
      {!s.captureService.trim() ? (
        <Card
          eyebrow="Needs your confirmation"
          title="Service not detected"
          body="BUSY has deliberately left this blank rather than guessing from your current business defaults."
          footer="Choose or type the correct service before saving"
          tone="amber"
        />
      ) : null}
      <DatePickerField label={s.captureStage === "Booking" ? "Booking date" : s.captureStage === "Completed job" ? "Job date" : s.captureStage === "Quote sent" ? "Quote sent date" : "Enquiry received"} value={s.captureDate} onChange={s.setCaptureDate} allowFuture={s.captureStage === "Booking"} />

      {s.captureStage === "Booking" ? (
        <Field label="Booking time" value={s.captureTime} onChangeText={s.setCaptureTime} placeholder="14:00" />
      ) : null}

      {s.captureStage !== "Enquiry" ? (
        <Field
          label={s.captureStage === "Quote sent" ? "Quote value" : s.captureStage === "Booking" ? "Expected job value" : "Job value"}
          value={s.captureValue}
          onChangeText={s.setCaptureValue}
          keyboardType="number-pad"
          prefix="£"
          placeholder="Optional"
        />
      ) : null}

      <Text style={styles.fieldLabel}>Source note</Text>
      <TextInput
        multiline
        value={s.captureNote}
        onChangeText={s.setCaptureNote}
        style={styles.messageInput}
        placeholder="Original message / note"
        placeholderTextColor="#9AA3B2"
      />

      <Card
        eyebrow="What Save will do"
        title={match ? "Merge into the existing customer" : "Create one customer record"}
        body={
          s.captureStage === "Enquiry"
            ? "Save the enquiry date and start the normal 7-day lifecycle watch."
            : s.captureStage === "Quote sent"
            ? "Create/update the customer and save a sent quote with its automatic follow-up date."
            : s.captureStage === "Booking"
            ? "Create/update the customer and place the confirmed booking into Work."
            : "Create/update the customer, save completed work, calculate sensible repeat timing and prepare the post-job review admin."
        }
        footer="No customer message is sent"
        tone="green"
      />

      <Button label={match ? "Approve merge into customer" : "Approve & create record"} primary disabled={!canSave} onPress={s.saveQuickCapture} />
      <Button label="Back to pasted text" onPress={s.back} />
    </Shell>
  );
}

function QuickCaptureSaved({ s }) {
  const customer = s.selectedCustomer;
  const latest = s.intakeLog?.[s.intakeLog.length - 1] || null;
  if (!customer || !latest) {
    return (
      <Shell s={s} title="Capture saved" subtitle="The intake record was saved, but the customer could not be reopened.">
        <Button label="Work" primary onPress={() => s.jump("workHub", "Work")} />
      </Shell>
    );
  }

  return (
    <Shell
      s={s}
      title="BUSY filed it"
      subtitle="The pasted information has been turned into structured business data."
      brandCue="Less retyping. Same approval control."
    >
      <Card
        eyebrow={latest.matchedExisting ? "Merged without a duplicate" : "New record created"}
        title={customer.name}
        body={`${latest.stage} • ${customer.service} • source: ${latest.source}`}
        footer={latest.matchedExisting ? latest.matchReason : "New customer"}
        tone="green"
      />
      <Card
        eyebrow="What happens next"
        title={
          latest.stage === "Enquiry"
            ? "BUSY will watch the enquiry lifecycle"
            : latest.stage === "Quote sent"
            ? "BUSY will watch the quote follow-up date"
            : latest.stage === "Booking"
            ? "The booking is now part of Work"
            : "Post-job admin is prepared underneath"
        }
        body="The normal Opportunity Engine uses this record from here. Quick capture is only the way the information got into BUSY."
        tone="blue"
      />
      {s.inboxPendingItems.length ? (
        <Button
          label={`Review next Inbox item • ${s.inboxPendingItems.length} waiting`}
          primary
          onPress={() => s.openInboxItem(s.inboxPendingItems[0].id)}
        />
      ) : null}
      <Button label="Open customer" primary={!s.inboxPendingItems.length} onPress={() => s.openCustomer(customer.id)} />
      <Button label="Capture another" onPress={s.startQuickCapture} />
      <Button label="View intake history" onPress={() => s.go("intakeHistory")} />
      <Button label="Back to Work" onPress={() => s.jump("workHub", "Work")} />
    </Shell>
  );
}

function IntakeHistory({ s }) {
  const items = [...(s.intakeLog || [])].reverse();
  return (
    <Shell
      s={s}
      title="Intake history"
      subtitle="A simple audit trail of information BUSY turned into customer/work records."
      brandCue="Know what came in, whether it was merged, and whether you or Safe Autopilot filed it."
    >
      <Card
        eyebrow="Quick capture"
        title={`${items.length} item${items.length === 1 ? "" : "s"} processed`}
        body="This is local prototype history. Future email, calendar, CRM or invoicing connectors can use the same intake path while keeping the filing authority visible."
        tone="green"
      >
        <MetricRow left="New customer records created" right={String(s.intakeCreatedCount)} />
        <MetricRow left="Merged into existing customers" right={String(s.intakeMergedCount)} />
        <MetricRow left="Filed by Safe Autopilot" right={String(s.inboxAutoFiledCount)} strong={s.inboxAutoFiledCount > 0} />
      </Card>

      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => s.openCustomer(item.customerId)}
          style={styles.activityCard}
        >
          <View style={styles.activityTopRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.activityName}>{item.customerName}</Text>
              <Text style={styles.activityService}>{item.stage} • {item.source}</Text>
            </View>
            <StatusChip
              label={item.autoFiled ? "Auto-filed" : item.matchedExisting ? "Merged" : "Created"}
              tone={item.matchedExisting ? "green" : "blue"}
            />
          </View>
          <Text style={styles.activitySummary}>
            {formatUKDate(item.eventDate)} • extraction {String(item.confidence || "unknown").toLowerCase()} confidence
          </Text>
          <Text style={styles.activityOpen}>Open customer →</Text>
        </Pressable>
      ))}

      {!items.length ? (
        <Card
          eyebrow="Nothing captured yet"
          title="Paste your first customer message or work note"
          body="Quick capture will keep the original source label and show whether it created or merged a customer."
          tone="blue"
        />
      ) : null}

      <Button label="Quick capture" primary onPress={s.startQuickCapture} />
      <Button label="Back to Work" onPress={() => s.jump("workHub", "Work")} />
    </Shell>
  );
}


export {
  BusyInbox,
  AutopilotFiled,
  QuickCapture,
  QuickCaptureReview,
  QuickCaptureSaved,
  IntakeHistory
};
