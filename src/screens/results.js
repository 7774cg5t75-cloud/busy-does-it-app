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


function Results({ s }) {
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const actions = Object.entries(s.replyActions || {});
  const quoteActions = actions.filter(([, action]) => action?.type === "quote" && action?.done);
  const bookingActions = actions.filter(([, action]) => action?.type === "booking" && action?.done);
  const quotePrepared = quoteActions.filter(([, action]) => (action.details?.quoteStatus || "Prepared") === "Prepared").length;
  const quoteSent = quoteActions.filter(([, action]) => action.details?.quoteStatus === "Sent").length;
  const quoteAccepted = quoteActions.filter(([, action]) => action.details?.quoteStatus === "Accepted").length;
  const confirmedBookings = bookingActions.filter(([, action]) => (action.details?.bookingStatus || "Confirmed") === "Confirmed").length;
  const completedJobs = s.customers.reduce(
    (total, customer) =>
      total +
      (Array.isArray(customer.history)
        ? customer.history.filter((item) => item.kind === "job").length
        : 0),
    0
  );

  return (
    <Shell
      s={s}
      noBack
      title="Your results"
      subtitle="See the work you've completed, the jobs you've booked and anything that needs following up."
    >
      <Card eyebrow="YOUR BUSINESS AT A GLANCE"
        title="How things are going"
        body="Based on your saved records, not estimated earnings."
        tone="blue"
      >
        <MetricRow left="Completed work recorded" right={`£${s.completedJobValue}`} strong={s.completedJobValue > 0} />
        <MetricRow left="Confirmed bookings" right={String(confirmedBookings)} strong={confirmedBookings > 0} />
        <MetricRow left="Value of booked jobs" right={`£${s.bookedWorkValue}`} />
        <MetricRow left="Enquiries to follow up" right={String(s.staleEnquiryEntries.length)} strong={s.staleEnquiryEntries.length > 0} />
      </Card>
      <Button label="Customers & enquiries" primary onPress={() => s.go("workPipeline")} />
      <Button label="Social Media" onPress={s.openSocialCentre} />
      <Button
        label={showDetailedResults ? "Hide detailed reports" : "Show detailed reports"}
        onPress={() => setShowDetailedResults((value) => !value)}
      />
      {showDetailedResults ? (
        <>
      <Card
        eyebrow="Value we can trace"
        title="Business value saved in separate, traceable buckets"
        body="A quote and a booking can relate to the same job, so BUSY shows their values separately rather than adding them together. Links to marketing only appear when supported by saved results."
        tone="green"
      >
        <MetricRow left="Completed work recorded" right={`£${s.completedJobValue}`} strong={s.completedJobValue > 0} />
        <MetricRow left="Value of quotes and booked jobs" right={`£${s.pipelineWorkValue}`} strong={s.pipelineWorkValue > 0} />
        <MetricRow left="Completed value from prototype reactivation flow" right={`£${s.reactivationCompletedValue}`} />
        <MetricRow left="Post-attributed booking value" right={`£${s.postAttributedValue}`} strong={s.postAttributedValue > 0} />
        <MetricRow left="Finished-job posts approved" right={String(s.publishedPhotoPostCount)} />
        <MetricRow left="Post outcomes recorded" right={String(s.postOutcomeRecordedCount)} />
        <MetricRow left="Post outcomes marked booking" right={String(s.postBookingOutcomeCount)} />
      </Card>

      <Card
        eyebrow="BUSY Inbox"
        title={`${s.inboxPendingItems.length} incoming item${s.inboxPendingItems.length === 1 ? "" : "s"} waiting for review`}
        body={
          s.recordFilingMode === "safe"
            ? "Safe Autopilot can remove repetitive filing only when every strict trust rule passes. Exceptions remain visible for owner review."
            : "BUSY is triaging incoming information, but automatic record filing is currently off."
        }
        tone={s.inboxNeedsAttentionItems.length ? "amber" : "green"}
      >
        <MetricRow left="Automatic filing mode" right={s.recordFilingMode === "safe" ? "Safe items only" : "Review everything"} />
        <MetricRow left="Needs attention" right={String(s.inboxNeedsAttentionItems.length)} strong={s.inboxNeedsAttentionItems.length > 0} />
        <MetricRow left="Ready to review" right={String(s.inboxReadyItems.length)} />
        <MetricRow left="Auto-filed safely" right={String(s.inboxAutoFiledCount)} strong={s.inboxAutoFiledCount > 0} />
        <MetricRow left="Filed after owner review" right={String(s.inboxOwnerFiledCount)} />
        <MetricRow left="Dismissed without filing" right={String(s.inboxDismissedCount)} />
        <Button label="Open BUSY Inbox" onPress={s.openBusyInbox} />
      </Card>

      <Card
        eyebrow="Less manual entry"
        title={`${s.intakeLog.length} item${s.intakeLog.length === 1 ? "" : "s"} captured through the intake layer`}
        body="Quick capture turns pasted business information into reviewed records. Matching phone/email/name data can merge into an existing customer instead of creating a duplicate."
        tone="green"
      >
        <MetricRow left="New customer records created" right={String(s.intakeCreatedCount)} />
        <MetricRow left="Merged into existing customers" right={String(s.intakeMergedCount)} strong={s.intakeMergedCount > 0} />
        <MetricRow left="Enquiries captured" right={String(s.intakeStageCounts["Enquiry"] || 0)} />
        <MetricRow left="Sent quotes captured" right={String(s.intakeStageCounts["Quote sent"] || 0)} />
        <MetricRow left="Bookings captured" right={String(s.intakeStageCounts["Booking"] || 0)} />
        <MetricRow left="Completed jobs captured" right={String(s.intakeStageCounts["Completed job"] || 0)} />
        <Button label="Open intake history" onPress={() => s.go("intakeHistory")} />
      </Card>

      <Card
        eyebrow="Admin BUSY handled underneath"
        title={`${s.backgroundReadyCount} next step${s.backgroundReadyCount === 1 ? "" : "s"} ready • ${s.lifecycleWatchCount} timeline${s.lifecycleWatchCount === 1 ? "" : "s"} being watched`}
        body="These counts come from automatic lifecycle dates and drafts stored against the real customer, quote and job records. Nothing customer-facing is sent without approval."
        tone="green"
      >
        <MetricRow left="Review requests pre-drafted" right={String(s.automaticReviewDraftCount)} />
        <MetricRow left="Finished-job posts pre-drafted" right={String(s.automaticPostDraftCount)} />
        <MetricRow left="Repeat-service dates tracked" right={String(s.repeatTimingTrackedCount)} />
        <MetricRow left="Quiet enquiries ready" right={String(s.staleEnquiryEntries.length)} />
        <MetricRow left="Quote follow-ups ready" right={String(s.dueQuoteEntries.length)} />
      </Card>

      <Card
        eyebrow="Why BUSY makes these suggestions"
        title="Recorded outcomes now influence ranking and audience size"
        body="BUSY prefers service-specific evidence once the sample is usable. Small samples stay low-confidence and fall back to cautious planning assumptions rather than swinging recommendations aggressively."
        tone="blue"
      >
        <MetricRow left="Previous-customer sample" right={String(s.reactivationEvidence?.sample || 0)} />
        <MetricRow left="Previous-customer bookings" right={String(s.reactivationEvidence?.successes || 0)} />
        <MetricRow left="Reactivation planning rate" right={formatPercent(s.reactivationEvidence?.rate)} />
        <MetricRow left="Reactivation confidence" right={s.reactivationEvidence?.confidence || "No evidence yet"} strong={s.reactivationEvidence?.evidenceReady} />
        <MetricRow left="Quiet-enquiry outcomes" right={String(s.enquiryFollowUpEvidence?.sample || 0)} />
        <MetricRow left="Still-interested rate" right={formatPercent(s.enquiryFollowUpEvidence?.rate)} />
        <MetricRow left="Quote follow-up outcomes" right={String(s.quoteFollowUpEvidence?.sample || 0)} />
        <MetricRow left="Quote acceptance planning rate" right={formatPercent(s.quoteFollowUpEvidence?.rate)} />
        <MetricRow left="Finished-job post outcomes" right={String(s.postEvidence?.sample || 0)} />
        <MetricRow left="Post-to-booking planning rate" right={formatPercent(s.postEvidence?.rate)} />
        <MetricRow left="Offer outcomes" right={String(s.offerEvidence?.sample || 0)} />
        <MetricRow left="Previous-customer completed value" right={`£${s.reactivationCompletedValue}`} />
      </Card>

      <Card
        eyebrow="How BUSY learns from your business"
        title="Business-specific evidence now changes recommendations"
        body="Sample size, evidence freshness, owner feedback and hard owner rules are applied before marketing opportunities are ranked. Live customer obligations remain outside those marketing blocks."
        tone="green"
      >
        <MetricRow left="Evidence patterns tracked" right={String(s.businessBrainPatterns?.length || 0)} />
        <MetricRow
          left="Patterns with usable evidence"
          right={String((s.businessBrainPatterns || []).filter((item) => item.evidence?.evidenceReady).length)}
        />
        <MetricRow left="Owner rules" right={String(s.businessBrainRules?.length || 0)} />
        <MetricRow left="Recommendation feedback records" right={String(s.businessBrainFeedback?.length || 0)} />
        <Button label="How BUSY learns" onPress={() => s.go("businessBrain")} />
      </Card>

      <Card
        eyebrow="Customers & enquiries"
        title={`£${s.pipelineWorkValue} in active quotes and booked jobs`}
        body="This combines active quote value and confirmed booked-work value saved locally in the prototype."
        tone="green"
      >
        <MetricRow left="New enquiries (<7 days)" right={String(s.freshEnquiryEntries.length)} />
        <MetricRow left="Quiet enquiries (7+ days)" right={String(s.staleEnquiryEntries.length)} strong={s.staleEnquiryEntries.length > 0} />
        <MetricRow left="Enquiry follow-ups awaiting outcome" right={String(s.enquiryFollowUpSentCount - s.enquiryFollowUpOutcomeCount)} />
        <MetricRow left="Quotes prepared" right={String(quotePrepared)} />
        <MetricRow left="Quotes marked sent" right={String(quoteSent)} />
        <MetricRow left="Quotes accepted" right={String(quoteAccepted)} />
        <MetricRow left="Confirmed bookings" right={String(confirmedBookings)} />
        <MetricRow left="Booked work value" right={`£${s.bookedWorkValue}`} strong={s.bookedWorkValue > 0} />
        <MetricRow left="Completed jobs" right={String(completedJobs)} />
        <MetricRow left="Completed job value" right={`£${s.completedJobValue}`} strong={s.completedJobValue > 0} />
        <MetricRow left="Job photos attached" right={String(s.attachedJobPhotoCount)} />
        <MetricRow left="Photos reusable with permission" right={String(s.reusableJobPhotoCount)} strong={s.reusableJobPhotoCount > 0} />
        <MetricRow left="Finished-job post drafts" right={String(s.preparedPhotoPostCount)} />
        <MetricRow left="Finished-job posts approved" right={String(s.publishedPhotoPostCount)} />
        <MetricRow left="Post outcomes recorded" right={String(s.postOutcomeRecordedCount)} />
        <MetricRow left="Follow-ups due" right={String(s.dueReminderEntries.length)} />
        <MetricRow left="Quote follow-ups due" right={String(s.dueQuoteEntries.length)} />
        <MetricRow left="Actions still to do" right={String(s.pendingReplyActionCount)} />
      </Card>

      {Object.entries(s.replyActions)
        .filter(([, action]) => action?.done && action?.details?.summary)
        .sort(([, a], [, b]) => String(b.completedAt || "").localeCompare(String(a.completedAt || "")))
        .slice(0, 5)
        .map(([id, action]) => {
          const customer =
            s.lastSimulatedRecipients.find((item) => item.id === id) ||
            s.customers.find((item) => item.id === id);
          if (!customer) return null;
          return (
            <Pressable
              key={id}
              onPress={() => s.openSavedReplyAction(id)}
              style={styles.resultActionRow}
            >
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.resultActionName}>{customer.name}</Text>
                <Text style={styles.resultActionService}>{customer.service}</Text>
                <Text style={styles.resultActionOpen}>Tap to view / edit</Text>
              </View>
              <Text style={styles.resultActionSummary}>{action.details.summary}</Text>
            </Pressable>
          );
        })}

      <Button label="How BUSY learns" onPress={() => s.go("businessBrain")} />
      {s.completedBookingCount ? <Button label="Open work diary" onPress={() => s.go("bookings")} /> : null}
      {Object.keys(s.replyActions || {}).length ? (
        <Button label="View all customer activity" onPress={() => s.go("customerActivity")} />
      ) : null}
        </>
      ) : null}
    </Shell>
  );
}

function ResultDetails({ s }) {
  return (
    <Shell s={s} title="Demo result details" subtitle="Illustrative marketing figures only. The local customer-action card on Results is the part currently driven by your prototype activity.">
      <Card eyebrow="Previous customers" title="£1.20 spent" body="4 replies • 2 interested • 1 booking" footer="Won value: £260" tone="green" />
      <Card eyebrow="Old enquiries" title="£0 spent" body="3 followed up • 1 reply • 0 bookings" footer="No paid spend" />
      <Card eyebrow="Local advert" title="£46.80 spent" body="3 genuine enquiries • 1 booking" footer="Won value: £360" tone="amber" />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function UpdateOutcome({ s }) {
  const opts = ["Not suitable", "Quoted", "Won", "Lost"];
  return (
    <Shell s={s} title="Update what happened" subtitle="One tap is enough when we can’t tell automatically.">
      {opts.map((x) => (
        <Choice key={x} label={x} selected={s.outcome === x} onPress={() => s.setOutcome(x)} />
      ))}
      {s.outcome === "Won" ? (
        <Field label="Job value (optional)" value={s.wonValue} onChangeText={s.setWonValue} keyboardType="number-pad" prefix="£" />
      ) : null}
      <Button label="Save result" primary onPress={() => s.jump("results", "Results")} />
    </Shell>
  );
}



export {
  Results,
  ResultDetails,
  UpdateOutcome
};
