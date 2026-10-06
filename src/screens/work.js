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


function WorkHub({ s }) {
  const todayISO = dateToISO(new Date());
  const freshEnquiries = (s.freshEnquiryEntries || []).map((entry) => entry.customer);
  const actionEntries = Object.entries(s.replyActions || {});
  const activeQuotes = actionEntries
    .filter(([, action]) =>
      action?.type === "quote" &&
      action?.done &&
      ["Prepared", "Sent", "Accepted"].includes(action.details?.quoteStatus || "Prepared")
    )
    .map(([id, action]) => ({
      id,
      action,
      customer: s.customers.find((item) => item.id === id) || s.lastSimulatedRecipients.find((item) => item.id === id),
    }))
    .filter((item) => item.customer);
  const bookings = actionEntries
    .filter(([, action]) =>
      action?.type === "booking" &&
      action?.done &&
      !["Cancelled", "Completed"].includes(action.details?.bookingStatus || "Confirmed")
    )
    .map(([id, action]) => ({
      id,
      action,
      customer: s.customers.find((item) => item.id === id) || s.lastSimulatedRecipients.find((item) => item.id === id),
    }))
    .filter((item) => item.customer && item.action.details?.bookingDate)
    .sort((a, b) =>
      `${a.action.details.bookingDate}T${a.action.details.bookingTime || "00:00"}`.localeCompare(
        `${b.action.details.bookingDate}T${b.action.details.bookingTime || "00:00"}`
      )
    );
  const overdueBookings = bookings.filter((item) => item.action.details.bookingDate < todayISO);
  const todayBookings = bookings.filter((item) => item.action.details.bookingDate === todayISO);
  const upcomingBookings = bookings.filter((item) => item.action.details.bookingDate > todayISO);
  const sevenDayEndISO = addDaysISO(7);
  const nextSevenDayBookings = bookings.filter(
    (item) =>
      item.action.details.bookingDate >= todayISO &&
      item.action.details.bookingDate <= sevenDayEndISO
  );
  const nextSevenDayValue = nextSevenDayBookings.reduce(
    (total, item) =>
      total +
      (Number(item.action.details?.jobValue) ||
        Number(item.action.details?.sourceQuoteAmount) ||
        0),
    0
  );
  const nextQuote = activeQuotes[0] || null;
  const nextBooking = todayBookings[0] || upcomingBookings[0] || null;

  const weekEndISO = addDaysFromISO(todayISO, 6);
  const weekBookings = bookings.filter(
    (item) =>
      item.action.details.bookingDate >= todayISO &&
      item.action.details.bookingDate <= weekEndISO
  );
  const weekBookedValue = weekBookings.reduce(
    (total, item) =>
      total +
      (Number(item.action.details?.jobValue) ||
        Number(item.action.details?.sourceQuoteAmount) ||
        0),
    0
  );
  const weekBookedDayCount = new Set(
    weekBookings.map((item) => item.action.details.bookingDate)
  ).size;
  const weekClearDayCount = Math.max(0, 7 - weekBookedDayCount);
  const weeklyOperationalCount =
    overdueBookings.length +
    (s.inboxNeedsAttentionItems?.length || 0) +
    (s.dueReminderEntries?.length || 0) +
    (s.dueQuoteEntries?.length || 0) +
    freshEnquiries.length;
  const calendarWeekRows = Array.from({ length: 7 }, (_, offset) => {
    const date = addDaysFromISO(todayISO, offset);
    return (
      s.workCalendarIntelligence?.byDate?.[date] || {
        date,
        state: "Open",
        attention: [],
        externalEvents: [],
        conflictCount: 0,
      }
    );
  });
  const calendarWeekOpenLight = calendarWeekRows.filter((day) =>
    ["Open", "Light"].includes(day.state)
  ).length;
  const calendarWeekAttention = calendarWeekRows.reduce(
    (total, day) => total + Number(day.attention?.length || 0),
    0
  );
  const calendarWeekExternal = calendarWeekRows.reduce(
    (total, day) => total + Number(day.externalEvents?.length || 0),
    0
  );
  const calendarWeekConflicts = calendarWeekRows.reduce(
    (total, day) => total + Number(day.conflictCount || 0),
    0
  );

  const weeklyPlanCandidates = [];
  if (overdueBookings.length) {
    weeklyPlanCandidates.push({
      key: "overdue-booking",
      eyebrow: "Protect booked work",
      title: `Close out ${overdueBookings[0].customer.name}'s past booking`,
      body: `${overdueBookings[0].customer.service} was booked for ${formatUKDate(overdueBookings[0].action.details.bookingDate)}. Complete, move or cancel it before creating more demand.`,
      label: "Open booking",
      tone: "amber",
      action: () => s.openSavedReplyAction(overdueBookings[0].id),
    });
  }
  if (s.inboxNeedsAttentionItems?.length) {
    weeklyPlanCandidates.push({
      key: "inbox-attention",
      eyebrow: "Incoming information",
      title: `${s.inboxNeedsAttentionItems.length} BUSY Inbox item${s.inboxNeedsAttentionItems.length === 1 ? "" : "s"} need a check`,
      body: "Resolve uncertain or conflicting incoming information before it changes customer records or the work pipeline.",
      label: "Open BUSY Inbox",
      tone: "amber",
      action: s.openBusyInbox,
    });
  }
  if (s.dueReminderEntries?.length) {
    weeklyPlanCandidates.push({
      key: "due-reminder",
      eyebrow: "Promised follow-up",
      title: `Follow up with ${s.dueReminderEntries[0].customer.name}`,
      body: `${s.dueReminderEntries[0].customer.service} has a due reminder. Keep the promise already made before starting new marketing.`,
      label: "Open follow-up",
      tone: "amber",
      action: () => s.openSavedReplyAction(s.dueReminderEntries[0].id),
    });
  }
  if (s.dueQuoteEntries?.length) {
    weeklyPlanCandidates.push({
      key: "due-quote",
      eyebrow: "Existing opportunity",
      title: `Chase ${s.dueQuoteEntries[0].customer.name}'s quote`,
      body: `${s.dueQuoteEntries[0].customer.service} has been waiting ${s.dueQuoteEntries[0].age} days. Existing intent outranks generating colder demand.`,
      label: "Open quote",
      tone: "amber",
      action: () => s.openSavedReplyAction(s.dueQuoteEntries[0].id),
    });
  }
  if (freshEnquiries.length) {
    weeklyPlanCandidates.push({
      key: "fresh-enquiry",
      eyebrow: "Customer waiting",
      title: `Reply to ${freshEnquiries[0].name}`,
      body: `${freshEnquiries[0].service}${freshEnquiries[0].address ? ` • ${freshEnquiries[0].address}` : ""}. This is live demand already in the business.`,
      label: "Open enquiry",
      tone: "green",
      action: () => s.openCustomer(freshEnquiries[0].id),
    });
  }
  if (s.staleEnquiryEntries?.length) {
    weeklyPlanCandidates.push({
      key: "quiet-enquiry",
      eyebrow: "Recover warm demand",
      title: `Revisit ${s.staleEnquiryEntries[0].customer.name}`,
      body: `${s.staleEnquiryEntries[0].customer.service} has gone quiet for ${s.staleEnquiryEntries[0].age} days. BUSY already has a low-cost follow-up route.`,
      label: "Prepare follow-up",
      tone: "blue",
      action: () => s.prepareEnquiryFollowUp(s.staleEnquiryEntries[0].customer.id),
    });
  }
  if (s.postJobBundleOpportunity) {
    weeklyPlanCandidates.push({
      key: "completed-job-bundle",
      eyebrow: "Use work already completed",
      title: `Turn ${s.postJobBundleOpportunity.customerName}'s finished job into the sensible follow-ons`,
      body: "BUSY can prepare the review request, finished-job content and repeat timing from the same saved job record instead of making you enter the details again.",
      label: "Review completed-job bundle",
      tone: "green",
      action: () =>
        s.openPostJobBundle(
          s.postJobBundleOpportunity.customerId,
          s.postJobBundleOpportunity.jobId
        ),
    });
  }
  if (s.socialOutcomeReminders?.length) {
    const { customer, job } = s.socialOutcomeReminders[0];
    weeklyPlanCandidates.push({
      key: "social-outcome",
      eyebrow: "Teach the Business Brain",
      title: "Record what happened after a published post",
      body: `${job.service || customer.service} was published through BUSY. Record whether it produced an enquiry or booking so future recommendations improve.`,
      label: "Record outcome",
      tone: "blue",
      action: () => s.openJobPostOutcome(customer.id, job.id),
    });
  }
  if (s.quoteFollowUpOutcomeOpportunity) {
    weeklyPlanCandidates.push({
      key: "quote-outcome",
      eyebrow: "Close the learning loop",
      title: `Record ${s.quoteFollowUpOutcomeOpportunity.customerName}'s quote outcome`,
      body: "BUSY should learn from the real result rather than treating a sent follow-up as success.",
      label: "Record quote outcome",
      tone: "blue",
      action: () =>
        s.openQuoteFollowUpOutcome(s.quoteFollowUpOutcomeOpportunity.customerId),
    });
  }
  if (s.enquiryFollowUpOutcomeOpportunity) {
    weeklyPlanCandidates.push({
      key: "enquiry-outcome",
      eyebrow: "Close the learning loop",
      title: `Record ${s.enquiryFollowUpOutcomeOpportunity.customerName}'s enquiry outcome`,
      body: "This tells BUSY whether quiet-enquiry follow-ups actually bring useful work back.",
      label: "Record enquiry outcome",
      tone: "blue",
      action: () =>
        s.openEnquiryFollowUpOutcome(s.enquiryFollowUpOutcomeOpportunity.customerId),
    });
  }
  if (s.activeWorkGoal && !s.workGoalFilled) {
    weeklyPlanCandidates.push({
      key: "work-goal",
      eyebrow: "Capacity plan",
      title: `${s.workGoalRemainingJobs} booking${s.workGoalRemainingJobs === 1 ? "" : "s"} still needed for ${s.activeWorkGoal.label}`,
      body: "Continue the existing work-filling plan instead of starting a second campaign for the same capacity gap.",
      label: "Open best next move",
      tone: "blue",
      action: () => s.go("bestMove"),
    });
  }
  if (s.backgroundReadyCount > 0) {
    weeklyPlanCandidates.push({
      key: "background-ready",
      eyebrow: "Prepared by BUSY",
      title: `${s.backgroundReadyCount} background next step${s.backgroundReadyCount === 1 ? "" : "s"} ready`,
      body: "Review work BUSY has prepared before creating another task from scratch.",
      label: "Review prepared work",
      tone: "green",
      action: () => s.go("backgroundWork"),
    });
  }
  const weeklyPlan = weeklyPlanCandidates.slice(0, 3);
  const weeklyStatusTitle =
    overdueBookings.length || s.inboxNeedsAttentionItems?.length
      ? `${weeklyOperationalCount} operational item${weeklyOperationalCount === 1 ? "" : "s"} need attention this week`
      : weeklyPlan.length
      ? `BUSY has ${weeklyPlan.length} sensible next step${weeklyPlan.length === 1 ? "" : "s"} lined up`
      : weekBookings.length
      ? "The week is under control"
      : "The diary is clear — decide whether you want to fill it";
  const weeklyStatusTone =
    overdueBookings.length || s.inboxNeedsAttentionItems?.length
      ? "amber"
      : weekBookings.length
      ? "green"
      : "blue";

  const lookAheadEndISO = addDaysFromISO(todayISO, 13);
  const followingWeekStartISO = addDaysFromISO(todayISO, 7);
  const followingWeekEndISO = addDaysFromISO(todayISO, 13);
  const followingWeekBookings = bookings.filter(
    (item) =>
      item.action.details.bookingDate >= followingWeekStartISO &&
      item.action.details.bookingDate <= followingWeekEndISO
  );
  const followingWeekBookedValue = followingWeekBookings.reduce(
    (total, item) =>
      total +
      (Number(item.action.details?.jobValue) ||
        Number(item.action.details?.sourceQuoteAmount) ||
        0),
    0
  );
  const followingWeekBookedDays = new Set(
    followingWeekBookings.map((item) => item.action.details.bookingDate)
  ).size;
  const repeatDueSoon = (s.repeatTimingTrackedEntries || []).filter(
    ({ customer, dueDate }) =>
      customer?.contactOk !== false &&
      dueDate >= todayISO &&
      dueDate <= lookAheadEndISO
  );
  const quotesDueSoon = actionEntries
    .map(([id, action]) => {
      if (
        action?.type !== "quote" ||
        !action?.done ||
        action.details?.quoteStatus !== "Sent" ||
        action.details?.followUpSentAt
      ) return null;
      const sentAt = action.details?.quoteSentAt || action.completedAt;
      const dueDate =
        action.details?.followUpDueDate ||
        (sentAt ? addDaysFromISO(String(sentAt).slice(0, 10), 7) : null);
      if (!dueDate || dueDate <= todayISO || dueDate > lookAheadEndISO) return null;
      const customer =
        s.customers.find((item) => item.id === id) ||
        s.lastSimulatedRecipients.find((item) => item.id === id);
      return customer ? { id, action, customer, dueDate } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const enquiriesNearingCold = (s.freshEnquiryEntries || [])
    .filter((entry) => Number(entry.age || 0) >= 4)
    .sort((a, b) => Number(b.age || 0) - Number(a.age || 0));
  const lookAheadSignals = [];
  if (!followingWeekBookings.length) {
    lookAheadSignals.push("Days 8–14 currently have no booked jobs saved in BUSY.");
  } else if (followingWeekBookings.length === 1) {
    lookAheadSignals.push("Only one booked job is currently saved for days 8–14.");
  }
  if (repeatDueSoon.length) {
    lookAheadSignals.push(
      `${repeatDueSoon.length} repeat-customer timing window${repeatDueSoon.length === 1 ? "" : "s"} fall within the next 14 days.`
    );
  }
  if (quotesDueSoon.length) {
    lookAheadSignals.push(
      `${quotesDueSoon.length} sent quote${quotesDueSoon.length === 1 ? "" : "s"} become due for follow-up within 14 days.`
    );
  }
  if (enquiriesNearingCold.length) {
    lookAheadSignals.push(
      `${enquiriesNearingCold.length} live enquir${enquiriesNearingCold.length === 1 ? "y is" : "ies are"} approaching the seven-day quiet-enquiry threshold.`
    );
  }
  if (!lookAheadSignals.length) {
    lookAheadSignals.push(
      "No obvious diary, quote, repeat-customer or enquiry pressure signal is visible in the next 14 days."
    );
  }

  const currentWeeklyBriefSnapshot = {
    weekBookings: weekBookings.length,
    weekBookedValue,
    freshEnquiries: freshEnquiries.length,
    dueQuotes: s.dueQuoteEntries?.length || 0,
    inboxAttention: s.inboxNeedsAttentionItems?.length || 0,
    backgroundReady: s.backgroundReadyCount || 0,
    socialOutcomes: s.socialOutcomeReminders?.length || 0,
    workGoalRemaining:
      s.activeWorkGoal && !s.workGoalFilled ? Number(s.workGoalRemainingJobs || 0) : 0,
    workGoalFilled: !!s.workGoalFilled,
  };
  const [weeklyBrief, setWeeklyBrief] = useState({
    loaded: false,
    hasPrevious: false,
    changes: [],
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const key = "@busy-does-it-weekly-brief-v39";
      let previous = null;
      try {
        const raw = await AsyncStorage.getItem(key);
        previous = raw ? JSON.parse(raw) : null;
      } catch (e) {
        previous = null;
      }
      const changes = [];
      if (previous) {
        if (previous.weekBookings !== currentWeeklyBriefSnapshot.weekBookings) {
          changes.push(
            `Booked jobs this week changed from ${previous.weekBookings || 0} to ${currentWeeklyBriefSnapshot.weekBookings}.`
          );
        }
        if (previous.weekBookedValue !== currentWeeklyBriefSnapshot.weekBookedValue) {
          changes.push(
            `Booked value this week changed from £${previous.weekBookedValue || 0} to £${currentWeeklyBriefSnapshot.weekBookedValue}.`
          );
        }
        if (previous.freshEnquiries !== currentWeeklyBriefSnapshot.freshEnquiries) {
          const delta =
            currentWeeklyBriefSnapshot.freshEnquiries - Number(previous.freshEnquiries || 0);
          changes.push(
            delta > 0
              ? `${delta} new live enquir${delta === 1 ? "y has" : "ies have"} appeared.`
              : "The live-enquiry queue has reduced since the last Work check."
          );
        }
        if (previous.dueQuotes !== currentWeeklyBriefSnapshot.dueQuotes) {
          changes.push(
            `Quote follow-ups due changed from ${previous.dueQuotes || 0} to ${currentWeeklyBriefSnapshot.dueQuotes}.`
          );
        }
        if (previous.inboxAttention !== currentWeeklyBriefSnapshot.inboxAttention) {
          changes.push(
            `BUSY Inbox items needing attention changed from ${previous.inboxAttention || 0} to ${currentWeeklyBriefSnapshot.inboxAttention}.`
          );
        }
        if (previous.socialOutcomes !== currentWeeklyBriefSnapshot.socialOutcomes) {
          changes.push(
            `Published-post outcomes waiting changed from ${previous.socialOutcomes || 0} to ${currentWeeklyBriefSnapshot.socialOutcomes}.`
          );
        }
        if (
          !previous.workGoalFilled &&
          currentWeeklyBriefSnapshot.workGoalFilled
        ) {
          changes.push("The active work-filling goal is now covered.");
        } else if (
          Number(previous.workGoalRemaining || 0) !==
            currentWeeklyBriefSnapshot.workGoalRemaining &&
          !currentWeeklyBriefSnapshot.workGoalFilled
        ) {
          changes.push(
            `The active work-goal gap changed from ${previous.workGoalRemaining || 0} to ${currentWeeklyBriefSnapshot.workGoalRemaining} booking${currentWeeklyBriefSnapshot.workGoalRemaining === 1 ? "" : "s"}.`
          );
        }
      }
      if (active) {
        setWeeklyBrief({
          loaded: true,
          hasPrevious: !!previous,
          changes: changes.slice(0, 4),
        });
      }
      try {
        await AsyncStorage.setItem(
          key,
          JSON.stringify({
            ...currentWeeklyBriefSnapshot,
            checkedAt: new Date().toISOString(),
          })
        );
      } catch (e) {
        // The briefing is helpful context only; storage failure must not block Work.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const preparedNextAction =
    (s.automaticReviewDraftEntries || [])[0]
      ? {
          eyebrow: "Review request prepared",
          title: `Ready for ${s.automaticReviewDraftEntries[0].customer.name}`,
          body: s.automaticReviewDraftEntries[0].job.reviewRequestDraft,
          label: "Review prepared request",
          action: () =>
            s.prepareReviewRequest(
              s.automaticReviewDraftEntries[0].customer.id,
              s.automaticReviewDraftEntries[0].job.id
            ),
        }
      : (s.automaticPostDraftEntries || [])[0]
      ? {
          eyebrow: "Social post prepared",
          title: `Finished-job post • ${s.automaticPostDraftEntries[0].customer.name}`,
          body: s.automaticPostDraftEntries[0].job.postDraft,
          label: "Review prepared post",
          action: () =>
            s.openJobPostApproval(
              s.automaticPostDraftEntries[0].customer.id,
              s.automaticPostDraftEntries[0].job.id
            ),
        }
      : s.dueQuoteEntries?.[0]
      ? {
          eyebrow: "Quote follow-up wording ready",
          title: `Follow up with ${s.dueQuoteEntries[0].customer.name}`,
          body: "BUSY can open a sensible follow-up draft using the saved quote, service and customer record. Nothing is sent without approval.",
          label: "Open prepared follow-up",
          action: () => s.prepareQuoteFollowUp(s.dueQuoteEntries[0].id),
        }
      : s.staleEnquiryEntries?.[0]
      ? {
          eyebrow: "Enquiry follow-up wording ready",
          title: `Revisit ${s.staleEnquiryEntries[0].customer.name}`,
          body: "BUSY can open a polite follow-up draft from the saved enquiry. Nothing is sent without approval.",
          label: "Open prepared follow-up",
          action: () =>
            s.prepareEnquiryFollowUp(s.staleEnquiryEntries[0].customer.id),
        }
      : quotesDueSoon[0]
      ? {
          eyebrow: "Prepared ahead • quote",
          title: `${quotesDueSoon[0].customer.name}'s follow-up is due ${formatUKDate(quotesDueSoon[0].dueDate)}`,
          body: "BUSY already has the customer, service and quote value, so the follow-up wording can be reviewed ahead of time. Nothing is sent until you approve it.",
          label: "Review wording ahead",
          action: () => s.prepareQuoteFollowUp(quotesDueSoon[0].id),
        }
      : enquiriesNearingCold[0]
      ? {
          eyebrow: "Prepared ahead • enquiry",
          title: `${enquiriesNearingCold[0].customer.name}'s enquiry is nearing the quiet threshold`,
          body: "BUSY can prepare the polite check-in before the enquiry becomes stale. Nothing is sent until you approve it.",
          label: "Review wording ahead",
          action: () =>
            s.prepareEnquiryFollowUp(enquiriesNearingCold[0].customer.id),
        }
      : null;

  const capacityPlanningService =
    s.workGoalPlanningService ||
    s.selectedService ||
    s.services.find((item) => item.wanted) ||
    s.services[0] ||
    null;
  const nextOpenPlanningSlot = suggestSpareSlots(s.replyActions, 1, 14)[0] || null;
  const nextOpenSlotCapacity = nextOpenPlanningSlot
    ? Math.max(
        0,
        Math.floor(
          (slotPlanningHours(nextOpenPlanningSlot.part) || 4) /
            planningDurationHours(capacityPlanningService)
        )
      )
    : 0;
  const proportionatePlan =
    s.activeWorkGoal && !s.workGoalFilled
      ? s.workGoalCapacityMismatch || s.workGoalPlanConflict || s.workGoalPlanShortfall
        ? {
            title: "Fix the capacity plan before creating more demand",
            body: "The diary assumptions and the active goal no longer line up cleanly. BUSY should correct capacity first rather than increase outreach.",
            tone: "amber",
          }
        : s.workGoalRemainingJobs <= 1
        ? {
            title: "One booking gap = keep the response narrow",
            body: "BUSY should use the strongest live enquiry, quote or small warm-customer action first. Broad promotion or paid reach would be disproportionate for one missing booking.",
            tone: "green",
          }
        : s.workGoalRemainingJobs === 2
        ? {
            title: "Two booking gaps = a small warm-demand plan is proportionate",
            body: "Use existing enquiries and quotes first, then a deliberately small previous-customer batch if the gap remains. Paid reach still sits behind those cheaper routes.",
            tone: "blue",
          }
        : {
            title: `${s.workGoalRemainingJobs} booking gaps justify a wider free-first plan`,
            body: "A broader previous-customer batch, suitable organic content and other low-cost routes can now be proportionate, while BUSY still stops escalation as bookings arrive.",
            tone: "blue",
          }
      : nextOpenPlanningSlot
      ? {
          title: `Next open half-day fits roughly ${nextOpenSlotCapacity || 1} ${capacityPlanningService?.name || "typical"} job${nextOpenSlotCapacity === 1 ? "" : "s"}`,
          body: "BUSY can see spare capacity, but it will not assume you want it filled. Creating demand remains an explicit owner decision until a work goal is active.",
          tone: "blue",
        }
      : {
          title: "No obvious capacity gap needs a marketing response",
          body: "BUSY has no reason to manufacture promotion from the current saved diary.",
          tone: "green",
        };

  const [workMonthStartISO, setWorkMonthStartISO] = useState(() => {
    const now = new Date();
    return dateToISO(new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0));
  });
  const [selectedWorkDate, setSelectedWorkDate] = useState(todayISO);
  const workMonthStart = dateFromISO(workMonthStartISO);
  const workMonthYear = workMonthStart.getFullYear();
  const workMonthIndex = workMonthStart.getMonth();
  const workMonthTitle = workMonthStart.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
  const workMonthFirstOffset =
    (new Date(workMonthYear, workMonthIndex, 1, 12, 0, 0).getDay() + 6) % 7;
  const workMonthDays = new Date(
    workMonthYear,
    workMonthIndex + 1,
    0,
    12,
    0,
    0
  ).getDate();
  const workPlannedSlots = Array.isArray(s.activeWorkGoal?.plannedSlots)
    ? s.activeWorkGoal.plannedSlots
    : [];
  const workMonthBookings = bookings.filter((item) => {
    const date = dateFromISO(item.action.details.bookingDate);
    return date.getFullYear() === workMonthYear && date.getMonth() === workMonthIndex;
  });
  const workMonthBookedValue = workMonthBookings.reduce(
    (total, item) =>
      total +
      (Number(item.action.details?.jobValue) ||
        Number(item.action.details?.sourceQuoteAmount) ||
        0),
    0
  );
  const selectedWorkBookings = bookings.filter(
    (item) => item.action.details.bookingDate === selectedWorkDate
  );
  const selectedWorkPlanned = workPlannedSlots.filter(
    (slot) => slot.date === selectedWorkDate
  );
  const workMonthCells = [];
  for (let index = 0; index < workMonthFirstOffset; index += 1) {
    workMonthCells.push({ blank: true, key: `work-blank-${index}` });
  }
  for (let day = 1; day <= workMonthDays; day += 1) {
    const iso = dateToISO(
      new Date(workMonthYear, workMonthIndex, day, 12, 0, 0)
    );
    const bookingCount = bookings.filter(
      (item) => item.action.details.bookingDate === iso
    ).length;
    const planCount = workPlannedSlots.filter((slot) => slot.date === iso).length;
    workMonthCells.push({
      blank: false,
      key: iso,
      iso,
      day,
      bookingCount,
      planCount,
    });
  }
  const moveWorkMonth = (delta) => {
    const next = new Date(workMonthYear, workMonthIndex + delta, 1, 12, 0, 0);
    const nextISO = dateToISO(next);
    setWorkMonthStartISO(nextISO);
    setSelectedWorkDate(nextISO);
  };
  const resetWorkMonth = () => {
    const now = new Date();
    setWorkMonthStartISO(
      dateToISO(new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0))
    );
    setSelectedWorkDate(todayISO);
  };

  return (
    <Shell
      s={s}
      noBack
      title="Work"
      subtitle="BUSY keeps the week moving: protect live work, clear customer obligations, watch capacity and only then create more demand."
      brandCue="Run the work you already have before buying more attention."
    >
      <Card
        eyebrow="V3.29 • Work & Calendar 2.0"
        title={weeklyStatusTitle}
        body="The weekly view now combines saved bookings, customer obligations, connected-diary commitments and estimated capacity. It recalculates from current records and keeps open-time guidance separate from confirmed work."
        footer={`${formatUKDate(todayISO)} – ${formatUKDate(weekEndISO)}`}
        tone={weeklyStatusTone}
      >
        <MetricRow
          left="Booked jobs"
          right={String(weekBookings.length)}
          strong={weekBookings.length > 0}
          onPress={weekBookings.length ? () => s.go("workCalendar") : null}
        />
        <MetricRow
          left="Booked value"
          right={`£${weekBookedValue}`}
          strong={weekBookedValue > 0}
          onPress={weekBookedValue > 0 ? () => s.go("workCalendar") : null}
        />
        <MetricRow
          left="Days with booked work"
          right={`${weekBookedDayCount} / 7`}
        />
        <MetricRow
          left="Open or light days"
          right={String(calendarWeekOpenLight)}
          strong={calendarWeekOpenLight > 0}
          onPress={() => s.go("workCalendar")}
        />
        <MetricRow
          left="Calendar follow-ups due"
          right={String(calendarWeekAttention)}
          strong={calendarWeekAttention > 0}
          onPress={calendarWeekAttention ? () => s.go("workCalendar") : null}
        />
        <MetricRow
          left="External diary commitments"
          right={String(calendarWeekExternal)}
          onPress={calendarWeekExternal ? () => s.go("workCalendar") : null}
        />
        {calendarWeekConflicts ? (
          <MetricRow
            left="Potential schedule overlaps"
            right={String(calendarWeekConflicts)}
            strong
            onPress={() => s.go("workCalendar")}
          />
        ) : null}
        <MetricRow
          left="Customer / record items needing attention"
          right={String(weeklyOperationalCount)}
          strong={weeklyOperationalCount > 0}
        />
        {s.activeWorkGoal ? (
          <MetricRow
            left="Active work goal"
            right={
              s.workGoalFilled
                ? "Filled"
                : `${s.workGoalRemainingJobs} booking${s.workGoalRemainingJobs === 1 ? "" : "s"} still needed`
            }
            strong={s.workGoalFilled}
            onPress={() => s.go("bestMove")}
          />
        ) : null}
      </Card>

      {weeklyBrief.loaded ? (
        <Card
          eyebrow="What changed?"
          title={
            weeklyBrief.hasPrevious
              ? weeklyBrief.changes.length
                ? `${weeklyBrief.changes.length} meaningful change${weeklyBrief.changes.length === 1 ? "" : "s"} since your last Work check`
                : "Nothing material has changed since your last Work check"
              : "BUSY is now watching changes between Work checks"
          }
          body={
            weeklyBrief.hasPrevious
              ? weeklyBrief.changes.length
                ? weeklyBrief.changes.join("\n")
                : "The saved bookings, live enquiries, due quotes, Inbox attention and work-goal position are materially the same."
              : "Next time you open Work, BUSY can compare the key operating signals with this snapshot and tell you what moved."
          }
          tone={weeklyBrief.changes.length ? "blue" : "green"}
        />
      ) : null}

      {(s.proactiveNotices?.length || 0) ? (
        <Card
          eyebrow="V3.17 • BUSY noticed"
          title={s.proactiveTopNotice?.title || "BUSY has spotted a useful pattern"}
          body={
            s.proactiveTopNotice?.body ||
            "There are proactive patterns worth reviewing alongside the weekly plan."
          }
          footer={`${s.proactiveNotices.length} active pattern${s.proactiveNotices.length === 1 ? "" : "s"} • these do not replace live customer priorities`}
          tone={s.proactiveTopNotice?.tone || "blue"}
        >
          {s.proactiveNotices.slice(0, 3).map((notice) => (
            <MetricRow
              key={notice.id}
              left={notice.category || "Pattern"}
              right={notice.title.replace(/^BUSY noticed\s*/i, "")}
              strong={notice.id === s.proactiveTopNotice?.id}
            />
          ))}
          <Button label="Review BUSY watchlist" onPress={() => s.go("proactiveWatch")} />
        </Card>
      ) : null}

      <Text style={styles.sectionLabel}>BUSY's weekly plan</Text>
      {weeklyPlan.length ? (
        weeklyPlan.map((item, index) => (
          <Card
            key={item.key}
            eyebrow={`Step ${index + 1} • ${item.eyebrow}`}
            title={item.title}
            body={item.body}
            tone={item.tone}
          >
            <Button label={item.label} primary={index === 0} onPress={item.action} />
          </Card>
        ))
      ) : (
        <Card
          eyebrow="Nothing urgent"
          title="No recorded task needs forcing"
          body={
            weekBookings.length
              ? "Your saved work and customer obligations are currently under control. BUSY will keep watching the existing records rather than manufacture activity."
              : "There is no urgent customer obligation in the saved records and no booked work this week. Use Find more work only if you actually want to fill the capacity."
          }
          tone={weekBookings.length ? "green" : "blue"}
        >
          {!weekBookings.length ? (
            <Button label="Find more work" primary onPress={() => s.go("workNow")} />
          ) : null}
        </Card>
      )}

      <Text style={styles.sectionLabel}>Look ahead • next 14 days</Text>
      <Card
        eyebrow="Capacity & opportunity radar"
        title={
          followingWeekBookings.length
            ? `${followingWeekBookings.length} booked job${followingWeekBookings.length === 1 ? "" : "s"} saved for days 8–14`
            : "No booked jobs are currently saved for days 8–14"
        }
        body={lookAheadSignals.join("\n")}
        footer="This is a planning signal from BUSY's saved records, not a prediction of future demand."
        tone={
          !followingWeekBookings.length &&
          (repeatDueSoon.length || quotesDueSoon.length || enquiriesNearingCold.length)
            ? "amber"
            : "blue"
        }
      >
        <MetricRow
          left="Days 8–14 booked value"
          right={`£${followingWeekBookedValue}`}
          strong={followingWeekBookedValue > 0}
          onPress={followingWeekBookings.length ? () => s.go("workCalendar") : null}
        />
        <MetricRow
          left="Days 8–14 with booked work"
          right={`${followingWeekBookedDays} / 7`}
        />
        <MetricRow
          left="Repeat timings due within 14 days"
          right={String(repeatDueSoon.length)}
          strong={repeatDueSoon.length > 0}
          onPress={repeatDueSoon.length ? () => s.openCustomer(repeatDueSoon[0].customer.id) : null}
        />
        <MetricRow
          left="Quotes becoming due within 14 days"
          right={String(quotesDueSoon.length)}
          strong={quotesDueSoon.length > 0}
          onPress={quotesDueSoon.length ? () => s.openSavedReplyAction(quotesDueSoon[0].id) : null}
        />
        <MetricRow
          left="Enquiries nearing 7 days"
          right={String(enquiriesNearingCold.length)}
          strong={enquiriesNearingCold.length > 0}
          onPress={
            enquiriesNearingCold.length
              ? () => s.openCustomer(enquiriesNearingCold[0].customer.id)
              : null
          }
        />
        {!followingWeekBookings.length && !s.activeWorkGoal ? (
          <Button label="Plan to fill future capacity" onPress={() => s.go("workNow")} />
        ) : null}
      </Card>

      <Card
        eyebrow="Why this amount of activity?"
        title={proportionatePlan.title}
        body={proportionatePlan.body}
        footer="Capacity, customer intent and recorded outcomes come before marketing volume."
        tone={proportionatePlan.tone}
      >
        <MetricRow
          left="Typical planning job"
          right={capacityPlanningService?.name || "Current service"}
        />
        <MetricRow
          left="Typical duration"
          right={formatDurationHours(planningDurationHours(capacityPlanningService))}
        />
        {nextOpenPlanningSlot ? (
          <MetricRow
            left="Next open planning slot"
            right={nextOpenPlanningSlot.label}
          />
        ) : null}
        {s.activeWorkGoal ? (
          <MetricRow
            left="Current goal gap"
            right={
              s.workGoalFilled
                ? "Filled"
                : `${s.workGoalRemainingJobs} booking${s.workGoalRemainingJobs === 1 ? "" : "s"}`
            }
            strong={s.workGoalFilled}
          />
        ) : null}
        <MetricRow left="Paid spend" right="£0 for now" strong />
      </Card>

      {preparedNextAction ? (
        <Card
          eyebrow={preparedNextAction.eyebrow}
          title={preparedNextAction.title}
          body={preparedNextAction.body}
          footer="Prepared by BUSY • nothing customer-facing happens until you approve it"
          tone="green"
        >
          <Button
            label={preparedNextAction.label}
            primary
            onPress={preparedNextAction.action}
          />
        </Card>
      ) : null}

      <Card eyebrow="Today" title={todayBookings.length ? `${todayBookings.length} job${todayBookings.length === 1 ? "" : "s"} booked today` : "No booked jobs today"} tone={todayBookings.length ? "green" : "blue"}>
        <MetricRow left="New enquiries (<7 days)" right={String(s.freshEnquiryEntries.length)} onPress={s.freshEnquiryEntries.length ? () => s.go("workPipeline") : null} />
        <MetricRow left="Quiet enquiries (7+ days)" right={String(s.staleEnquiryEntries.length)} strong={s.staleEnquiryEntries.length > 0} onPress={s.staleEnquiryEntries.length ? () => s.go("staleEnquiries") : null} />
        <MetricRow left="Work in pipeline" right={`£${s.pipelineWorkValue}`} strong={s.pipelineWorkValue > 0} onPress={s.pipelineWorkValue > 0 ? () => s.go("workPipeline") : null} />
        <MetricRow left="Active quote value" right={`£${s.activeQuoteValue}`} onPress={s.activeQuoteValue > 0 ? () => s.go("workPipeline") : null} />
        <MetricRow left="Booked work value" right={`£${s.bookedWorkValue}`} onPress={s.bookedWorkValue > 0 ? () => s.go("bookings") : null} />
        <MetricRow left="Overdue bookings" right={String(overdueBookings.length)} strong={overdueBookings.length > 0} onPress={overdueBookings.length ? () => s.go("bookings") : null} />
        <MetricRow left="Jobs in next 7 days" right={String(nextSevenDayBookings.length)} strong={nextSevenDayBookings.length > 0} onPress={nextSevenDayBookings.length ? () => s.go("workCalendar") : null} />
        <MetricRow left="Next 7 days value" right={`£${nextSevenDayValue}`} strong={nextSevenDayValue > 0} onPress={nextSevenDayValue > 0 ? () => s.go("workCalendar") : null} />
        <MetricRow left="Follow-ups due" right={String(s.dueReminderEntries.length)} strong={s.dueReminderEntries.length > 0} onPress={s.dueReminderEntries.length ? () => s.go("replyActions") : null} />
        <MetricRow left="Quote follow-ups due" right={String(s.dueQuoteEntries.length)} strong={s.dueQuoteEntries.length > 0} onPress={s.dueQuoteEntries.length ? () => s.go("staleQuotes") : null} />
        <MetricRow left="Actions to do" right={String(s.pendingReplyActionCount)} strong={s.pendingReplyActionCount > 0} onPress={s.pendingReplyActionCount ? () => s.go("replyActions") : null} />
        <MetricRow left="Background next steps ready" right={String(s.backgroundReadyCount)} strong={s.backgroundReadyCount > 0} onPress={s.backgroundReadyCount ? () => s.go("backgroundWork") : null} />
        <MetricRow left="Inbox waiting" right={String(s.inboxPendingItems.length)} strong={s.inboxNeedsAttentionItems.length > 0} onPress={s.inboxPendingItems.length ? s.openBusyInbox : null} />
        <MetricRow left="Auto-filed safely" right={String(s.inboxAutoFiledCount)} strong={s.inboxAutoFiledCount > 0} onPress={s.inboxAutoFiledCount ? s.openBusyInbox : null} />
        <MetricRow left="Quick-captured records filed" right={String(s.intakeLog.length)} onPress={s.intakeLog.length ? () => s.go("intakeHistory") : null} />
      </Card>

      <Text style={styles.sectionLabel}>Monthly diary</Text>
      <Card
        eyebrow="Month at a glance"
        title={workMonthTitle}
        body="See confirmed work and BUSY planned openings without leaving the Work tab."
        footer="Green = booked work • Blue = BUSY planned opening"
        tone="blue"
      >
        <View style={styles.workCalendarMonthNav}>
          <Pressable
            accessibilityRole="button"
            onPress={() => moveWorkMonth(-1)}
            style={styles.workCalendarNavButton}
          >
            <Text style={styles.workCalendarNavText}>‹ Previous</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={resetWorkMonth}
            style={styles.workCalendarTodayButton}
          >
            <Text style={styles.workCalendarTodayText}>This month</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => moveWorkMonth(1)}
            style={styles.workCalendarNavButton}
          >
            <Text style={styles.workCalendarNavText}>Next ›</Text>
          </Pressable>
        </View>
        <MetricRow
          left="Booked jobs this month"
          right={String(workMonthBookings.length)}
          strong={workMonthBookings.length > 0}
          onPress={workMonthBookings.length ? () => s.go("workCalendar") : null}
        />
        <MetricRow
          left="Booked value this month"
          right={`£${workMonthBookedValue}`}
          strong={workMonthBookedValue > 0}
          onPress={workMonthBookedValue > 0 ? () => s.go("workCalendar") : null}
        />
      </Card>

      <View style={styles.workCalendarGrid}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
          <View key={label} style={styles.workCalendarWeekdayCell}>
            <Text style={styles.workCalendarWeekday}>{label}</Text>
          </View>
        ))}
        {workMonthCells.map((cell) =>
          cell.blank ? (
            <View key={cell.key} style={styles.workCalendarDayWrap}>
              <View style={styles.workCalendarBlankDay} />
            </View>
          ) : (
            <View key={cell.key} style={styles.workCalendarDayWrap}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedWorkDate(cell.iso)}
                style={({ pressed }) => [
                  styles.workCalendarDay,
                  cell.iso === selectedWorkDate && styles.workCalendarDaySelected,
                  cell.iso === todayISO && styles.workCalendarDayToday,
                  pressed && styles.workCalendarDayPressed,
                ]}
              >
                <Text
                  style={[
                    styles.workCalendarDayNumber,
                    cell.iso === selectedWorkDate && styles.workCalendarDayNumberSelected,
                  ]}
                >
                  {cell.day}
                </Text>
                <View style={styles.workCalendarMarkers}>
                  {cell.bookingCount ? <View style={styles.workCalendarBookingDot} /> : null}
                  {cell.planCount ? <View style={styles.workCalendarPlanDot} /> : null}
                </View>
                {cell.bookingCount ? (
                  <Text style={styles.workCalendarCount}>{cell.bookingCount}</Text>
                ) : null}
              </Pressable>
            </View>
          )
        )}
      </View>

      <View style={styles.workCalendarLegend}>
        <View style={styles.workCalendarLegendItem}>
          <View style={styles.workCalendarBookingDot} />
          <Text style={styles.workCalendarLegendText}>Booked work</Text>
        </View>
        <View style={styles.workCalendarLegendItem}>
          <View style={styles.workCalendarPlanDot} />
          <Text style={styles.workCalendarLegendText}>BUSY planned opening</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>{formatUKDate(selectedWorkDate)}</Text>
      {selectedWorkBookings.length ? (
        selectedWorkBookings.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() => s.openSavedReplyAction(item.id)}
            style={styles.workCalendarBookingCard}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.workCalendarBookingTitle}>{item.customer.name}</Text>
              <Text style={styles.workCalendarBookingBody}>
                {item.customer.service} • {item.action.details?.bookingTime || "time not set"}
              </Text>
              <Text style={styles.workCalendarBookingMeta}>
                {item.action.details?.bookingStatus || "Confirmed"}
                {item.action.details?.jobValue ? ` • £${item.action.details.jobValue}` : ""}
              </Text>
            </View>
            <Text style={styles.metricChevron}>›</Text>
          </Pressable>
        ))
      ) : null}
      {selectedWorkPlanned.map((slot) => (
        <View key={slot.id} style={styles.workCalendarPlanCard}>
          <Text style={styles.workCalendarBookingTitle}>BUSY planned opening</Text>
          <Text style={styles.workCalendarBookingBody}>
            {slot.label} • target {slot.targetJobs || 1} booking
            {Number(slot.targetJobs || 1) === 1 ? "" : "s"}
          </Text>
        </View>
      ))}
      {!selectedWorkBookings.length && !selectedWorkPlanned.length ? (
        <Card
          eyebrow="Open day"
          title="Nothing booked or planned here"
          body="This day is currently clear in BUSY’s saved records."
          tone="green"
        />
      ) : null}
      <Button label="Open full calendar & day details" onPress={() => s.go("workCalendar")} />

      {overdueBookings.length ? (
        <Pressable onPress={() => s.openSavedReplyAction(overdueBookings[0].id)} style={[styles.homePriorityCard, styles.homeReminderCard]}>
          <View style={styles.homePriorityTop}>
            <Text style={styles.homePriorityEyebrow}>PAST BOOKING NEEDS AN OUTCOME</Text>
            <StatusChip label="Do this first" tone="amber" />
          </View>
          <Text style={styles.homePriorityTitle}>{overdueBookings[0].customer.name}</Text>
          <Text style={styles.homePriorityBody}>
            {overdueBookings[0].customer.service} • {formatUKDate(overdueBookings[0].action.details.bookingDate)}
          </Text>
          <Text style={styles.homePriorityLink}>Complete, move or cancel →</Text>
        </Pressable>
      ) : null}

      {!overdueBookings.length && s.dueReminderEntries.length ? (
        <Pressable onPress={() => s.openSavedReplyAction(s.dueReminderEntries[0].id)} style={[styles.homePriorityCard, styles.homeReminderCard]}>
          <View style={styles.homePriorityTop}>
            <Text style={styles.homePriorityEyebrow}>FOLLOW-UP DUE</Text>
            <StatusChip label="Do this first" tone="amber" />
          </View>
          <Text style={styles.homePriorityTitle}>{s.dueReminderEntries[0].customer.name}</Text>
          <Text style={styles.homePriorityBody}>{s.dueReminderEntries[0].customer.service}</Text>
          <Text style={styles.homePriorityLink}>Open follow-up →</Text>
        </Pressable>
      ) : null}

      {!overdueBookings.length && !s.dueReminderEntries.length && s.dueQuoteEntries.length ? (
        <Pressable onPress={() => s.openSavedReplyAction(s.dueQuoteEntries[0].id)} style={[styles.homePriorityCard, styles.homeReminderCard]}>
          <View style={styles.homePriorityTop}>
            <Text style={styles.homePriorityEyebrow}>QUOTE NEEDS A FOLLOW-UP</Text>
            <StatusChip label="Do this first" tone="amber" />
          </View>
          <Text style={styles.homePriorityTitle}>{s.dueQuoteEntries[0].customer.name}</Text>
          <Text style={styles.homePriorityBody}>
            {s.dueQuoteEntries[0].customer.service} • waiting {s.dueQuoteEntries[0].age} days
          </Text>
          <Text style={styles.homePriorityLink}>Open quote →</Text>
        </Pressable>
      ) : null}

      {!overdueBookings.length && !s.dueReminderEntries.length && !s.dueQuoteEntries.length && s.staleEnquiryEntries.length ? (
        <Pressable
          onPress={() => s.prepareEnquiryFollowUp(s.staleEnquiryEntries[0].customer.id)}
          style={[styles.homePriorityCard, styles.homeReminderCard]}
        >
          <View style={styles.homePriorityTop}>
            <Text style={styles.homePriorityEyebrow}>QUIET ENQUIRY</Text>
            <StatusChip label="Worth revisiting" tone="amber" />
          </View>
          <Text style={styles.homePriorityTitle}>{s.staleEnquiryEntries[0].customer.name}</Text>
          <Text style={styles.homePriorityBody}>
            {s.staleEnquiryEntries[0].customer.service} • waiting {s.staleEnquiryEntries[0].age} days
          </Text>
          <Text style={styles.homePriorityLink}>Review prepared follow-up →</Text>
        </Pressable>
      ) : null}

      {!overdueBookings.length && !s.dueReminderEntries.length && !s.dueQuoteEntries.length && !s.staleEnquiryEntries.length && freshEnquiries.length ? (
        <Pressable onPress={() => s.openCustomer(freshEnquiries[0].id)} style={[styles.homePriorityCard, styles.homeReminderCard]}>
          <View style={styles.homePriorityTop}>
            <Text style={styles.homePriorityEyebrow}>NEW ENQUIRY</Text>
            <StatusChip label="Needs next step" tone="amber" />
          </View>
          <Text style={styles.homePriorityTitle}>{freshEnquiries[0].name}</Text>
          <Text style={styles.homePriorityBody}>
            {freshEnquiries[0].service}{freshEnquiries[0].address ? ` • ${freshEnquiries[0].address}` : ""} • {enquiryAgeLabel(freshEnquiries[0].createdAt)}
          </Text>
          <Text style={styles.homePriorityLink}>Open enquiry →</Text>
        </Pressable>
      ) : null}

      {nextBooking ? (
        <Pressable onPress={() => s.openSavedReplyAction(nextBooking.id)} style={styles.homePriorityCard}>
          <View style={styles.homePriorityTop}>
            <Text style={styles.homePriorityEyebrow}>{nextBooking.action.details.bookingDate === todayISO ? "TODAY" : "NEXT BOOKING"}</Text>
            <StatusChip label="Booked work" tone="green" />
          </View>
          <Text style={styles.homePriorityTitle}>{nextBooking.customer.name}</Text>
          <Text style={styles.homePriorityBody}>
            {nextBooking.customer.service} • {formatUKDate(nextBooking.action.details.bookingDate)} at {nextBooking.action.details.bookingTime || "time not set"}
          </Text>
          <Text style={styles.homePriorityLink}>Open booking →</Text>
        </Pressable>
      ) : null}

      {nextQuote ? (
        <Pressable onPress={() => s.openSavedReplyAction(nextQuote.id)} style={styles.customerTimelineCard}>
          <View style={styles.homePriorityTop}>
            <Text style={styles.homePriorityEyebrow}>ACTIVE QUOTE</Text>
            <StatusChip label={nextQuote.action.details?.quoteStatus || "Prepared"} tone="green" />
          </View>
          <Text style={styles.homePriorityTitle}>{nextQuote.customer.name}</Text>
          <Text style={styles.homePriorityBody}>
            {nextQuote.customer.service} • £{nextQuote.action.details?.quoteAmount || "—"}
          </Text>
          <Text style={styles.homePriorityLink}>Open quote →</Text>
        </Pressable>
      ) : null}

      <Text style={styles.sectionLabel}>Add or manage work</Text>
      <Button
        label={s.inboxPendingItems.length ? `BUSY Inbox • ${s.inboxPendingItems.length} waiting` : "BUSY Inbox"}
        primary
        onPress={s.openBusyInbox}
      />
      <Button label="Quick capture from a message / note" onPress={s.startQuickCapture} />
      <Button label="+ New enquiry manually" onPress={s.startNewEnquiry} />
      {s.intakeLog.length ? (
        <Button label={`Intake history • ${s.intakeLog.length}`} onPress={() => s.go("intakeHistory")} />
      ) : null}
      {s.staleEnquiryEntries.length ? (
        <Button label={`Quiet enquiries • ${s.staleEnquiryEntries.length}`} onPress={() => s.go("staleEnquiries")} />
      ) : null}
      {s.dueQuoteEntries.length ? (
        <Button label={`Quote follow-ups due • ${s.dueQuoteEntries.length}`} onPress={() => s.go("staleQuotes")} />
      ) : null}
      <Button label="Customer records" onPress={() => s.go("customerRecords")} />
      <Button
        label="Customer pipeline"
        onPress={() => s.go("workPipeline")}
      />
      <Button label="Full calendar & day details" onPress={() => s.go("workCalendar")} />
      <Button
        label={bookings.length ? `Work diary • ${bookings.length} active` : "Work diary"}
        onPress={() => s.go("bookings")}
      />
      {Object.keys(s.replyActions || {}).length ? (
        <Button label={`Customer activity • ${s.pendingReplyActionCount} to do`} onPress={() => s.go("customerActivity")} />
      ) : null}

      <Text style={styles.sectionLabel}>Need more work?</Text>
      <Button label="Find more work" onPress={() => s.go("workNow")} />
    </Shell>
  );
}


function WorkCalendar({ s }) {
  const todayISO = dateToISO(new Date());
  const intelligence = s.workCalendarIntelligence || {
    capacityHours: 7.5,
    byDate: {},
    counts: { overloadedDays: 0, openDays: 0, attentionDue: 0 },
  };
  const requestedOperatorDate = String(s.operatorCalendarDate || "");
  const requestedOperatorDateValue = /^\d{4}-\d{2}-\d{2}$/.test(requestedOperatorDate)
    ? dateFromISO(requestedOperatorDate)
    : null;
  const initialOperatorDate =
    requestedOperatorDateValue &&
    !Number.isNaN(requestedOperatorDateValue.getTime())
      ? requestedOperatorDate
      : todayISO;
  const [monthStartISO, setMonthStartISO] = useState(() => {
    const initial = dateFromISO(initialOperatorDate);
    return dateToISO(
      new Date(initial.getFullYear(), initial.getMonth(), 1, 12, 0, 0)
    );
  });
  const [selectedDate, setSelectedDate] = useState(initialOperatorDate);

  useEffect(() => {
    const focusDate = String(s.operatorCalendarDate || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(focusDate)) return;
    const parsed = dateFromISO(focusDate);
    if (Number.isNaN(parsed.getTime())) return;
    setMonthStartISO(
      dateToISO(new Date(parsed.getFullYear(), parsed.getMonth(), 1, 12, 0, 0))
    );
    setSelectedDate(focusDate);
  }, [s.operatorCalendarDate]);

  const monthStart = dateFromISO(monthStartISO);
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const monthTitle = monthStart.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
  const firstOffset = (new Date(year, month, 1, 12, 0, 0).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0, 12, 0, 0).getDate();

  const dayFor = (iso) => {
    const saved = intelligence.byDate?.[iso];
    if (saved) return saved;
    return {
      date: iso,
      bookings: [],
      externalEvents: [],
      attention: [],
      plannedSlots: [],
      bookingHours: 0,
      externalHours: 0,
      scheduledHours: 0,
      estimatedOpenHours: Number(intelligence.capacityHours || 7.5),
      bookedValue: 0,
      conflictCount: 0,
      conflicts: [],
      state: iso < todayISO ? "Past" : "Open",
      tone: "green",
      fillCandidate: null,
      summary: "No saved work or follow-ups",
    };
  };

  const cells = [];
  for (let i = 0; i < firstOffset; i += 1) {
    cells.push({ blank: true, key: `blank-${i}` });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = dateToISO(new Date(year, month, day, 12, 0, 0));
    const row = dayFor(iso);
    cells.push({
      blank: false,
      key: iso,
      iso,
      day,
      bookingCount: row.bookings?.length || 0,
      planCount: row.plannedSlots?.length || 0,
      attentionCount: row.attention?.length || 0,
      externalCount: row.externalEvents?.length || 0,
      state: row.state || "Open",
    });
  }

  const monthRows = cells
    .filter((cell) => !cell.blank)
    .map((cell) => dayFor(cell.iso));
  const monthBookings = monthRows.reduce(
    (total, row) => total + Number(row.bookings?.length || 0),
    0
  );
  const monthValue = monthRows.reduce(
    (total, row) => total + Number(row.bookedValue || 0),
    0
  );
  const monthAttention = monthRows.reduce(
    (total, row) => total + Number(row.attention?.length || 0),
    0
  );
  const monthOpenFuture = monthRows.filter(
    (row) =>
      row.date >= todayISO &&
      ["Open", "Light"].includes(row.state)
  ).length;
  const monthOverloaded = monthRows.filter(
    (row) => row.date >= todayISO && row.state === "Overloaded"
  ).length;

  const selectedDay = dayFor(selectedDate);
  const selectedBookings = Array.isArray(selectedDay.bookings)
    ? selectedDay.bookings
    : [];
  const selectedPlanned = Array.isArray(selectedDay.plannedSlots)
    ? selectedDay.plannedSlots
    : [];
  const selectedAttention = Array.isArray(selectedDay.attention)
    ? selectedDay.attention
    : [];
  const selectedExternal = Array.isArray(selectedDay.externalEvents)
    ? selectedDay.externalEvents
    : [];
  const selectedConflicts = Array.isArray(selectedDay.conflicts)
    ? selectedDay.conflicts
    : [];

  const moveMonth = (delta) => {
    const next = new Date(year, month + delta, 1, 12, 0, 0);
    const nextISO = dateToISO(next);
    setMonthStartISO(nextISO);
    setSelectedDate(nextISO);
  };

  const openAttention = (item) => {
    if (!item) return;
    if (item.kind === "quote" || item.kind === "reminder") {
      s.openSavedReplyAction(item.customerId);
      return;
    }
    if (item.customerId) {
      s.openCustomer(item.customerId);
      return;
    }
    s.jump("workHub", "Work");
  };

  const stateShort = (state) =>
    state === "Overloaded"
      ? "Over"
      : state === "Comfortable"
      ? "OK"
      : state === "Past"
      ? ""
      : state;

  return (
    <Shell
      s={s}
      title="Calendar"
      subtitle="Work, follow-ups and capacity in one place."
      brandCue="V3.29 • Tap a day to see jobs, value, open capacity, follow-ups, external commitments and BUSY’s suggested next move."
    >
      <Card eyebrow="Work & Calendar 2.0" title={monthTitle} tone="blue">
        <View style={styles.workCalendarMonthNav}>
          <Pressable
            accessibilityRole="button"
            onPress={() => moveMonth(-1)}
            style={styles.workCalendarNavButton}
          >
            <Text style={styles.workCalendarNavText}>‹ Previous</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              const now = new Date();
              const start = dateToISO(
                new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0)
              );
              setMonthStartISO(start);
              setSelectedDate(todayISO);
            }}
            style={styles.workCalendarTodayButton}
          >
            <Text style={styles.workCalendarTodayText}>Today</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => moveMonth(1)}
            style={styles.workCalendarNavButton}
          >
            <Text style={styles.workCalendarNavText}>Next ›</Text>
          </Pressable>
        </View>
        <MetricRow
          left="Booked jobs this month"
          right={String(monthBookings)}
          strong={monthBookings > 0}
        />
        <MetricRow
          left="Booked value this month"
          right={`£${Math.round(monthValue)}`}
          strong={monthValue > 0}
        />
        <MetricRow
          left="Follow-ups / actions on calendar"
          right={String(monthAttention)}
          strong={monthAttention > 0}
        />
        <MetricRow
          left="Open or light future days"
          right={String(monthOpenFuture)}
        />
        {monthOverloaded ? (
          <MetricRow
            left="Potentially overloaded days"
            right={String(monthOverloaded)}
            strong
          />
        ) : null}
      </Card>

      <View style={styles.workCalendarGrid}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
          <View key={label} style={styles.workCalendarWeekdayCell}>
            <Text style={styles.workCalendarWeekday}>{label}</Text>
          </View>
        ))}
        {cells.map((cell) =>
          cell.blank ? (
            <View key={cell.key} style={styles.workCalendarDayWrap}>
              <View style={styles.workCalendarBlankDay} />
            </View>
          ) : (
            <View key={cell.key} style={styles.workCalendarDayWrap}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedDate(cell.iso)}
                style={({ pressed }) => [
                  styles.workCalendarDay,
                  cell.iso === selectedDate && styles.workCalendarDaySelected,
                  cell.iso === todayISO && styles.workCalendarDayToday,
                  pressed && styles.workCalendarDayPressed,
                ]}
              >
                <Text
                  style={[
                    styles.workCalendarDayNumber,
                    cell.iso === selectedDate &&
                      styles.workCalendarDayNumberSelected,
                  ]}
                >
                  {cell.day}
                </Text>
                <View style={styles.workCalendarMarkers}>
                  {cell.bookingCount ? (
                    <View style={styles.workCalendarBookingDot} />
                  ) : null}
                  {cell.planCount ? (
                    <View style={styles.workCalendarPlanDot} />
                  ) : null}
                  {cell.attentionCount ? (
                    <View style={styles.workCalendarAttentionDot} />
                  ) : null}
                  {cell.externalCount ? (
                    <View style={styles.workCalendarExternalDot} />
                  ) : null}
                </View>
                {cell.bookingCount ? (
                  <Text style={styles.workCalendarCount}>
                    {cell.bookingCount}
                  </Text>
                ) : (
                  <Text style={styles.workCalendarStateText}>
                    {stateShort(cell.state)}
                  </Text>
                )}
              </Pressable>
            </View>
          )
        )}
      </View>

      <View style={styles.workCalendarLegend}>
        <View style={styles.workCalendarLegendItem}>
          <View style={styles.workCalendarBookingDot} />
          <Text style={styles.workCalendarLegendText}>Booked work</Text>
        </View>
        <View style={styles.workCalendarLegendItem}>
          <View style={styles.workCalendarPlanDot} />
          <Text style={styles.workCalendarLegendText}>BUSY planned opening</Text>
        </View>
        <View style={styles.workCalendarLegendItem}>
          <View style={styles.workCalendarAttentionDot} />
          <Text style={styles.workCalendarLegendText}>Follow-up due</Text>
        </View>
        <View style={styles.workCalendarLegendItem}>
          <View style={styles.workCalendarExternalDot} />
          <Text style={styles.workCalendarLegendText}>External diary</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>{formatUKDate(selectedDate)}</Text>

      <Card
        eyebrow="Day picture"
        title={
          selectedDay.state === "Past"
            ? "Past day"
            : `${selectedDay.state || "Open"} workload`
        }
        body={selectedDay.summary || "No saved work or follow-ups."}
        footer={
          selectedDate < todayISO
            ? "Historical view • capacity guidance is only used for current/future planning."
            : `Open-capacity figure uses a ~${intelligence.capacityHours || 7.5} hour planning day. It is guidance, not a promise that the whole day is bookable.`
        }
        tone={
          selectedDay.state === "Overloaded"
            ? "amber"
            : selectedDay.state === "Busy"
            ? "blue"
            : "green"
        }
      >
        <MetricRow
          left="Booked jobs"
          right={String(selectedBookings.length)}
          strong={selectedBookings.length > 0}
        />
        <MetricRow
          left="Booked value"
          right={`£${Math.round(Number(selectedDay.bookedValue || 0))}`}
          strong={Number(selectedDay.bookedValue || 0) > 0}
        />
        <MetricRow
          left="Scheduled load"
          right={`${Number(selectedDay.scheduledHours || 0)}h`}
        />
        {selectedDate >= todayISO ? (
          <MetricRow
            left="Estimated open capacity"
            right={`~${Number(selectedDay.estimatedOpenHours || 0)}h`}
          />
        ) : null}
        <MetricRow
          left="Follow-ups / actions"
          right={String(selectedAttention.length)}
          strong={selectedAttention.length > 0}
        />
        <MetricRow
          left="External commitments"
          right={String(selectedExternal.length)}
        />
      </Card>

      {selectedConflicts.length ? (
        <Card
          eyebrow="Potential overlap"
          title={`${selectedConflicts.length} schedule conflict${selectedConflicts.length === 1 ? "" : "s"} worth checking`}
          body="BUSY found timed items that overlap. It has not moved anything automatically."
          footer="Review the booking and connected diary before accepting more work on this day."
          tone="amber"
        />
      ) : null}

      {selectedBookings.map((booking) => (
        <Pressable
          key={booking.customerId}
          accessibilityRole="button"
          onPress={() => s.openSavedReplyAction(booking.customerId)}
          style={styles.workCalendarBookingCard}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.workCalendarBookingTitle}>
              {booking.customerName}
            </Text>
            <Text style={styles.workCalendarBookingBody}>
              {booking.service} • {booking.time || "time not set"} • about{" "}
              {booking.durationHours || 2}h
            </Text>
            <Text style={styles.workCalendarBookingMeta}>
              Confirmed
              {Number(booking.value) > 0 ? ` • £${booking.value}` : ""}
            </Text>
          </View>
          <Text style={styles.metricChevron}>›</Text>
        </Pressable>
      ))}

      {selectedExternal.map((event) => (
        <View
          key={event.id || `${selectedDate}-${event.title}-${event.time}`}
          style={styles.workCalendarExternalCard}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.workCalendarBookingTitle}>
              {event.title || "External diary commitment"}
            </Text>
            <Text style={styles.workCalendarBookingBody}>
              {event.time || "time not set"}
              {Number(event.durationHours) > 0
                ? ` • about ${event.durationHours}h`
                : ""}
            </Text>
          </View>
        </View>
      ))}

      {selectedAttention.length ? (
        <>
          <Text style={styles.sectionLabel}>Needs attention</Text>
          {selectedAttention.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => openAttention(item)}
              style={styles.workCalendarAttentionCard}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.workCalendarBookingTitle}>{item.title}</Text>
                <Text style={styles.workCalendarBookingBody}>{item.body}</Text>
                <Text style={styles.workCalendarBookingMeta}>
                  {item.overdue
                    ? `Overdue from ${formatUKDate(item.dueDate || item.date)}`
                    : `Due ${formatUKDate(item.dueDate || item.date)}`}
                  {Number(item.value) > 0 ? ` • £${item.value}` : ""}
                </Text>
              </View>
              <Text style={styles.metricChevron}>›</Text>
            </Pressable>
          ))}
        </>
      ) : null}

      {selectedPlanned.map((slot) => (
        <View key={slot.id} style={styles.workCalendarPlanCard}>
          <Text style={styles.workCalendarBookingTitle}>
            BUSY planned opening
          </Text>
          <Text style={styles.workCalendarBookingBody}>
            {slot.label} • target {slot.targetJobs || 1} booking
            {Number(slot.targetJobs || 1) === 1 ? "" : "s"}
          </Text>
        </View>
      ))}

      {selectedDate >= todayISO && selectedDay.fillCandidate ? (
        <Card
          eyebrow="Possible gap filler"
          title={`${selectedDay.fillCandidate.customerName} • ${selectedDay.fillCandidate.service}`}
          body={`This repeat-work candidate looks small enough for the day’s estimated open capacity: about ${selectedDay.fillCandidate.durationHours}h${Number(selectedDay.fillCandidate.value) > 0 ? ` • around £${selectedDay.fillCandidate.value} recorded/typical value` : ""}.`}
          footer="This is a planning suggestion only. BUSY has not contacted the customer or booked anything."
          tone="green"
        >
          <Button
            label="Open customer"
            onPress={() => s.openCustomer(selectedDay.fillCandidate.customerId)}
          />
          <Button label="Find more work" onPress={() => s.go("workNow")} />
        </Card>
      ) : null}

      {!selectedBookings.length &&
      !selectedExternal.length &&
      !selectedAttention.length &&
      !selectedPlanned.length ? (
        <Card
          eyebrow={selectedDate < todayISO ? "Past day" : "Open day"}
          title={
            selectedDate < todayISO
              ? "No saved activity on this day"
              : "Nothing booked or due here"
          }
          body={
            selectedDate < todayISO
              ? "BUSY has no saved booking, follow-up or connected-calendar commitment for this date."
              : "This day is currently clear in BUSY’s saved records. Use the capacity estimate and customer evidence before deciding whether to fill it."
          }
          tone="green"
        />
      ) : null}

      <Button label="Ask BUSY about this day" onPress={() => {
        s.openTalkToBusy(false);
        setTimeout(() => {
          s.submitBusyCommand({
            text: `What have I got on ${formatUKDate(selectedDate)}, how busy is that day, and is there room for another job?`,
          });
        }, 80);
      }} />
      <Button label="Work diary list" onPress={() => s.go("bookings")} />
    </Shell>
  );
}


function WorkPipeline({ s }) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const todayISO = dateToISO(new Date());
  const actionEntries = Object.entries(s.replyActions || {}).map(([id, action]) => {
    const customer =
      s.customers.find((item) => item.id === id) ||
      s.lastSimulatedRecipients.find((item) => item.id === id);
    return customer ? { id, action, customer } : null;
  }).filter(Boolean);

  const newEnquiries = s.customers
    .filter(
      (customer) =>
        !!(customer.currentEnquiryAt || (!customer.lastServiceDate && customer.createdAt)) &&
        !s.replyActions?.[customer.id] &&
        !customer.enquiryFollowUpOutcomeRecordedAt
    )
    .sort((a, b) =>
      String(b.currentEnquiryAt || b.createdAt || "").localeCompare(
        String(a.currentEnquiryAt || a.createdAt || "")
      )
    );

  const quotes = actionEntries.filter(({ action }) =>
    action?.type === "quote" &&
    isActiveCustomerAction(action)
  );
  const bookings = actionEntries
    .filter(({ action }) => action?.type === "booking" && isActiveCustomerAction(action))
    .sort((a, b) =>
      String(a.action.details?.bookingDate || "9999-12-31").localeCompare(
        String(b.action.details?.bookingDate || "9999-12-31")
      )
    );
  const followUps = actionEntries
    .filter(({ action }) => action?.type === "reminder" && isActiveCustomerAction(action))
    .sort((a, b) =>
      String(a.action.details?.reminderDate || "9999-12-31").localeCompare(
        String(b.action.details?.reminderDate || "9999-12-31")
      )
    );
  const completed = actionEntries
    .filter(({ action }) =>
      action?.type === "booking" &&
      action?.details?.bookingStatus === "Completed"
    )
    .sort((a, b) => String(b.action.details?.bookingDate || "").localeCompare(String(a.action.details?.bookingDate || "")))
    .slice(0, 8);

  const totalActive = newEnquiries.length + quotes.length + bookings.length + followUps.length;
  const quoteValue = quotes.reduce(
    (total, item) => total + (Number(item.action.details?.quoteAmount) || 0),
    0
  );
  const bookingValue = bookings.reduce(
    (total, item) =>
      total +
      (Number(item.action.details?.jobValue) ||
        Number(item.action.details?.sourceQuoteAmount) ||
        0),
    0
  );
  const query = search.trim().toLowerCase();
  const matches = (customer) =>
    !query ||
    [customer?.name, customer?.phone, customer?.service, customer?.address]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  const stageOn = (stage) => stageFilter === "All" || stageFilter === stage;
  const visibleNewEnquiries = stageOn("Enquiries") ? newEnquiries.filter(matches) : [];
  const visibleQuotes = stageOn("Quotes") ? quotes.filter((item) => matches(item.customer)) : [];
  const visibleBookings = stageOn("Bookings") ? bookings.filter((item) => matches(item.customer)) : [];
  const visibleFollowUps = stageOn("Follow-ups") ? followUps.filter((item) => matches(item.customer)) : [];
  const visibleCompleted = stageOn("Completed") ? completed.filter((item) => matches(item.customer)) : [];
  const visibleCount =
    visibleNewEnquiries.length +
    visibleQuotes.length +
    visibleBookings.length +
    visibleFollowUps.length +
    visibleCompleted.length;

  const PipelineCard = ({ item, kind }) => {
    const { id, action, customer } = item;
    let status = "";
    let detail = customer.service;
    if (kind === "quote") {
      const savedQuoteStatus = action.details?.quoteStatus || "Prepared";
      const sentAge = savedQuoteStatus === "Sent"
        ? daysSinceTimestamp(action.details?.quoteSentAt || action.completedAt)
        : null;
      status = savedQuoteStatus === "Sent" && sentAge !== null && sentAge >= 7 ? "Follow up" : savedQuoteStatus;
      detail += action.details?.quoteAmount ? ` • £${action.details.quoteAmount}` : "";
      if (status === "Follow up") detail += ` • waiting ${sentAge} days`;
    } else if (kind === "booking") {
      const savedStatus = action.details?.bookingStatus || "Confirmed";
      status =
        savedStatus === "Confirmed" &&
        action.details?.bookingDate &&
        action.details.bookingDate < todayISO
          ? "Overdue"
          : savedStatus;
      if (action.details?.bookingDate) {
        detail += ` • ${formatUKDate(action.details.bookingDate)}`;
        if (action.details?.bookingTime) detail += ` at ${action.details.bookingTime}`;
      }
    } else if (kind === "reminder") {
      const savedStatus = action.details?.reminderStatus || "Scheduled";
      status =
        savedStatus !== "Completed" &&
        action.details?.reminderDate &&
        action.details.reminderDate <= todayISO
          ? "Due now"
          : savedStatus;
      if (action.details?.reminderDate) detail += ` • ${formatUKDate(action.details.reminderDate)}`;
    } else if (kind === "completed") {
      status = "Completed";
      if (action.details?.bookingDate) detail += ` • ${formatUKDate(action.details.bookingDate)}`;
      if (Number(action.details?.jobValue) > 0) detail += ` • £${action.details.jobValue}`;
    }
    return (
      <Pressable
        key={id}
        onPress={() => s.openSavedReplyAction(id)}
        style={styles.customerTimelineCard}
      >
        <View style={styles.homePriorityTop}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.customerTimelineLabel}>{kind.toUpperCase()}</Text>
            <Text style={styles.activityName}>{customer.name}</Text>
          </View>
          <StatusChip
            label={status}
            tone={["Overdue", "Due now", "Follow up"].includes(status) ? "amber" : ["Cancelled", "Declined"].includes(status) ? "blue" : "green"}
          />
        </View>
        <Text style={styles.activitySummary}>{detail}</Text>
        <Text style={styles.activityOpen}>Open →</Text>
      </Pressable>
    );
  };

  return (
    <Shell
      s={s}
      title="Customer pipeline"
      subtitle="Every live customer sits in one clear stage, from first enquiry through to completed work."
      brandCue="One customer. One next step."
    >
      <Card
        eyebrow="Live customer work"
        title={totalActive ? `${totalActive} active item${totalActive === 1 ? "" : "s"}` : "Pipeline clear"}
        body="This view is built from the local customer records and actions already saved in BUSY DOES IT."
        footer={`£${s.pipelineWorkValue} currently in quotes + booked work`}
        tone={totalActive ? "green" : "blue"}
      >
        <MetricRow left="New enquiries" right={String(newEnquiries.length)} />
        <MetricRow left="Active quotes" right={String(quotes.length)} />
        <MetricRow left="Quote value" right={`£${quoteValue}`} strong={quoteValue > 0} />
        <MetricRow left="Bookings" right={String(bookings.length)} />
        <MetricRow left="Booked value" right={`£${bookingValue}`} strong={bookingValue > 0} />
        <MetricRow left="Follow-ups" right={String(followUps.length)} />
      </Card>

      <Field
        label="Find a customer"
        value={search}
        onChangeText={setSearch}
        placeholder="Name, phone, service or address"
      />
      <Text style={styles.fieldLabel}>Show stage</Text>
      <View style={styles.timeChoiceWrap}>
        {["All", "Enquiries", "Quotes", "Bookings", "Follow-ups", "Completed"].map((stage) => (
          <Pressable
            key={stage}
            onPress={() => setStageFilter(stage)}
            style={[styles.timeChoice, stageFilter === stage && styles.timeChoiceSelected]}
          >
            <Text style={[styles.timeChoiceText, stageFilter === stage && styles.timeChoiceTextSelected]}>
              {stage}
            </Text>
          </Pressable>
        ))}
      </View>
      {query || stageFilter !== "All" ? (
        <Text style={styles.helper}>
          {visibleCount ? `Showing ${visibleCount} matching pipeline item${visibleCount === 1 ? "" : "s"}.` : "No pipeline items match those filters."}
        </Text>
      ) : null}

      {visibleNewEnquiries.length ? <Text style={styles.sectionLabel}>Enquiries</Text> : null}
      {visibleNewEnquiries.map((customer) => {
        const age = daysSinceTimestamp(customer.createdAt);
        const quiet = age !== null && age >= 7 && !customer.enquiryFollowUpSentAt;
        const followUpPending = !!customer.enquiryFollowUpSentAt && !customer.enquiryFollowUpOutcomeRecordedAt;
        return (
          <View key={customer.id} style={styles.customerTimelineCard}>
            <View style={styles.homePriorityTop}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.customerTimelineLabel}>
                  {followUpPending ? "ENQUIRY FOLLOW-UP SENT" : quiet ? "QUIET ENQUIRY" : "NEW ENQUIRY"}
                </Text>
                <Text style={styles.activityName}>{customer.name}</Text>
              </View>
              <StatusChip
                label={followUpPending ? "Awaiting outcome" : quiet ? `${age}d quiet` : "Needs next step"}
                tone={quiet || followUpPending ? "amber" : "green"}
              />
            </View>
            <Text style={styles.activitySummary}>
              {customer.service}{customer.address ? ` • ${customer.address}` : ""} • {enquiryAgeLabel(customer.createdAt)}
            </Text>
            <View style={styles.customerActionsRow}>
              {followUpPending ? (
                <Pressable onPress={() => s.openEnquiryFollowUpOutcome(customer.id)} style={styles.customerOpenWrap}>
                  <Text style={styles.customerOpenText}>Record outcome</Text>
                </Pressable>
              ) : quiet ? (
                <Pressable onPress={() => s.prepareEnquiryFollowUp(customer.id)} style={styles.customerOpenWrap}>
                  <Text style={styles.customerOpenText}>Prepare follow-up</Text>
                </Pressable>
              ) : (
                <>
                  <Pressable onPress={() => s.startDirectCustomerAction(customer.id, "quote")} style={styles.customerOpenWrap}>
                    <Text style={styles.customerOpenText}>Create quote</Text>
                  </Pressable>
                  <Pressable onPress={() => s.startDirectCustomerAction(customer.id, "booking")} style={styles.customerEditWrap}>
                    <Text style={styles.customerEditText}>Book job</Text>
                  </Pressable>
                  <Pressable onPress={() => s.startDirectCustomerAction(customer.id, "reminder")} style={styles.customerEditWrap}>
                    <Text style={styles.customerEditText}>Follow up</Text>
                  </Pressable>
                </>
              )}
              <Pressable onPress={() => s.openCustomer(customer.id)} style={styles.customerEditWrap}>
                <Text style={styles.customerEditText}>Open customer</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      {visibleQuotes.length ? <Text style={styles.sectionLabel}>Quotes</Text> : null}
      {visibleQuotes.map((item) => <PipelineCard key={item.id} item={item} kind="quote" />)}

      {visibleBookings.length ? <Text style={styles.sectionLabel}>Bookings</Text> : null}
      {visibleBookings.map((item) => <PipelineCard key={item.id} item={item} kind="booking" />)}

      {visibleFollowUps.length ? <Text style={styles.sectionLabel}>Follow-ups</Text> : null}
      {visibleFollowUps.map((item) => <PipelineCard key={item.id} item={item} kind="reminder" />)}

      {visibleCompleted.length ? <Text style={styles.sectionLabel}>Recently completed</Text> : null}
      {visibleCompleted.map((item) => <PipelineCard key={item.id} item={item} kind="completed" />)}

      {!totalActive && !completed.length ? (
        <Card
          eyebrow="Nothing waiting"
          title="No customer work in the pipeline yet"
          body="Add a new enquiry or start an action from a customer record."
          tone="blue"
        />
      ) : null}

      <Button label="+ New enquiry" primary onPress={s.startNewEnquiry} />
      <Button label="Work diary" onPress={() => s.go("bookings")} />
      <Button label="Customer records" onPress={() => s.go("customerRecords")} />
    </Shell>
  );
}

function WorkNow({ s }) {
  return (
    <Shell s={s} title="Find more work" subtitle="Tell BUSY DOES IT the business result you want. We’ll work out the marketing underneath.">
      <Card eyebrow="Goal first" title="You choose the problem — not the channel" body="No need to decide between ads, social, messages or audiences. Start with what the business needs." tone="green" />
      <Button label="Fill a spare day" primary onPress={() => s.go("chooseGap")} />
      <Button label="Get more work" onPress={() => s.go("moreWorkGoal")} />
      <Button label="Bring customers back" onPress={() => s.go("customerGroups")} />
      <Button label="Create an offer" onPress={() => s.go("offerGoal")} />
      <Button label="Check free improvements" onPress={() => s.go("profileAudit")} />
    </Shell>
  );
}

function ChooseGap({ s }) {
  const gaps = Array.isArray(s.spareSlotSuggestions) ? s.spareSlotSuggestions : [];
  const targetOptions = [
    { value: 1, label: "One booking", sub: "Use the narrowest sensible action first" },
    { value: 2, label: "Two bookings", sub: "Use a small targeted action before broad promotion" },
    { value: 3, label: "Three bookings", sub: "A wider customer action or limited offer may become proportionate" },
  ];
  const planningServices = s.services.filter((item) => item.wanted);
  const serviceChoices = planningServices.length ? planningServices : s.services;
  const planningService = s.selectedService || serviceChoices[0];

  return (
    <Shell s={s} title="When do you want work?" subtitle="BUSY checks the saved diary first, then checks whether the amount of work you want can realistically fit." brandCue="Need → capacity → smallest sensible intervention.">
      {gaps.length ? (
        <>
          <Card eyebrow="Likely spare capacity" title="Open time found in the saved diary" body="A morning or afternoon is treated as occupied when a confirmed booking is saved in that period. This is a prototype diary check, not a live external calendar connection." tone="green" />
          {gaps.map((gap) => (
            <Choice key={gap.id} label={gap.label} sub="No confirmed booking saved in this period" selected={s.selectedGap === gap.label} onPress={() => s.setSelectedGap(gap.label)} />
          ))}
        </>
      ) : (
        <Card eyebrow="Diary looks busy" title="No obvious gap found" body="BUSY could not find a clear morning or afternoon gap in the next saved diary window. You can still ask for any suitable work." tone="blue" />
      )}
      <Choice label="Any suitable work" sub="Find the strongest low-risk opportunity without tying it to one slot" selected={s.selectedGap === "Any suitable work"} onPress={() => s.setSelectedGap("Any suitable work")} />

      {serviceChoices.length > 1 ? (
        <>
          <Text style={styles.sectionLabel}>What kind of work should fill it?</Text>
          {serviceChoices.map((service) => (
            <Choice
              key={service.id}
              label={service.name}
              sub={`About ${formatDurationHours(service.durationHours)} per job • roughly £${service.value || 0}`}
              selected={s.selectedServiceId === service.id}
              onPress={() => s.setSelectedServiceId(service.id)}
            />
          ))}
        </>
      ) : planningService ? (
        <Card eyebrow="Capacity assumption" title={planningService.name} body={`BUSY will plan around about ${formatDurationHours(planningService.durationHours)} per job. This is an editable planning estimate, not a promise about every job.`} tone="blue" />
      ) : null}

      <Text style={styles.sectionLabel}>How much work do you need?</Text>
      {targetOptions.map((option) => (
        <Choice key={option.value} label={option.label} sub={option.sub} selected={s.workGoalTargetDraft === option.value} onPress={() => s.setWorkGoalTargetDraft(option.value)} />
      ))}
      <Button label={`Find the best way to get ${s.workGoalTargetDraft} booking${s.workGoalTargetDraft === 1 ? "" : "s"}`} primary disabled={!s.selectedGap} onPress={() => s.confirmSpareSlot(s.selectedGap)} />
      <Button label="Change typical job lengths" onPress={() => s.go("capacitySettings")} />
      <Button label="Enter a different quiet slot" onPress={() => s.go("businessData")} />
    </Shell>
  );
}

function BestMove({ s }) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const gap = s.selectedGap || s.quietSlot || "Any suitable work";
  const firstFreshEnquiry = s.freshEnquiryEntries?.[0] || null;
  const firstQuietEnquiry =
    s.staleEnquiryEntries?.find(
      (entry) => !s.workGoalAttemptKeys?.has(`enquiry:${entry.customer.id}`)
    ) || null;
  const firstQuote =
    s.dueQuoteEntries?.find(
      (entry) => !s.workGoalAttemptKeys?.has(`quote:${entry.id}`)
    ) || null;
  const remainingJobs = Math.max(1, s.workGoalRemainingJobs || 1);
  const targetedCustomerCount = Math.min(
    s.reactivationEligibleCustomers?.length || 0,
    Math.max(1, s.recommendedReactivationBatchSize || 1)
  );
  const reactivationUsesAllEligible =
    (s.reactivationEligibleCustomers?.length || 0) > 0 &&
    targetedCustomerCount >= s.reactivationEligibleCustomers.length;
  const suggestedPaidBudget = Math.min(Number(s.testLimit) || 25, Math.max(5, remainingJobs * 10));

  if (s.activeWorkGoal && s.workGoalFilled) {
    return (
      <Shell
        s={s}
        title="Work goal reached"
        subtitle={`${s.activeWorkGoal.label} is now covered by the bookings saved in BUSY DOES IT.`}
        brandCue="Target reached. Stop promoting."
      >
        <Card
          eyebrow="Stop condition reached"
          title="No more marketing needed for this gap"
          body={`BUSY found ${s.workGoalBookedCount} confirmed booking${s.workGoalBookedCount === 1 ? "" : "s"} matching a target of ${s.workGoalTargetJobs}. It should not keep contacting people or suggest paid advertising for the same capacity.`}
          footer={s.workGoalBookedValue ? `Recorded booked value: £${s.workGoalBookedValue}` : "Recommended additional spend: £0"}
          tone="green"
        />
        <Button label="Close this work goal" primary onPress={s.clearWorkGoal} />
        <Button label="View work diary" onPress={() => s.jump("workHub", "Work")} />
      </Shell>
    );
  }

  if (s.activeWorkGoal && s.workGoalCapacityMismatch) {
    const capacity = Number(s.workGoalCapacityMax) || 0;
    const serviceName = s.workGoalPlanningService?.name || "This service";
    return (
      <Shell
        s={s}
        title="That target does not fit this slot"
        subtitle={`BUSY checked the requested work against the planning time saved for ${serviceName}.`}
        brandCue="Capacity first. Then marketing."
      >
        <Card
          eyebrow="Capacity check"
          title={
            capacity > 0
              ? `${s.workGoalTargetJobs} bookings will not fit into this ${s.activeWorkGoal.part}`
              : `${serviceName} is longer than this ${s.activeWorkGoal.part} slot`
          }
          body={
            capacity > 0
              ? `${serviceName} is currently set to about ${formatDurationHours(s.workGoalDurationHours)} per job. A ${s.workGoalSlotHours}-hour ${s.activeWorkGoal.part} therefore looks realistic for about ${capacity} job${capacity === 1 ? "" : "s"}, not ${s.workGoalTargetJobs}.`
              : `${serviceName} is currently set to about ${formatDurationHours(s.workGoalDurationHours)} per job, which is longer than the ${s.workGoalSlotHours}-hour planning window. BUSY should not pretend a full job fits there.`
          }
          footer="Planning estimate only • you can correct the job length"
          tone="amber"
        />
        {capacity > 0 ? (
          <Button
            label={`Fill this ${s.activeWorkGoal.part} with ${capacity} booking${capacity === 1 ? "" : "s"}`}
            primary
            onPress={s.fitWorkGoalToSlot}
          />
        ) : null}
        <Button
          label={`Find all ${s.workGoalTargetJobs} across next suitable slots`}
          primary={capacity < 1}
          onPress={s.spreadWorkGoalAcrossSlots}
        />
        <Button label="Change typical job length" onPress={() => s.go("capacitySettings")} />
        <Button label="Choose a different slot" onPress={() => s.go("chooseGap")} />
      </Shell>
    );
  }

  if (s.activeWorkGoal?.spreadAcrossSlots && s.workGoalPlanConflict) {
    return (
      <Shell
        s={s}
        title="The diary changed"
        subtitle="One of the openings in this work plan has since been taken by other booked work."
        brandCue="Refresh the plan before promoting more work."
      >
        <Card
          eyebrow="Capacity plan needs refreshing"
          title="A planned opening is no longer cleanly available"
          body="BUSY keeps the plan conservative. Rather than counting on a slot that now contains other work, rebuild the plan from the current diary."
          footer="No extra marketing until the capacity plan is credible again"
          tone="amber"
        />
        <Button label="Refresh capacity plan" primary onPress={s.refreshSpreadWorkGoalPlan} />
        <Button label="View work diary" onPress={() => s.jump("workHub", "Work")} />
      </Shell>
    );
  }

  if (s.activeWorkGoal?.spreadAcrossSlots && s.workGoalPlanShortfall > 0) {
    const planned = s.workGoalTargetJobs - s.workGoalPlanShortfall;
    return (
      <Shell
        s={s}
        title="Not enough open diary capacity yet"
        subtitle={`BUSY checked the next ${s.activeWorkGoal.planHorizonDays || 21} days before recommending more promotion.`}
        brandCue="Do not invent capacity."
      >
        <Card
          eyebrow="Capacity shortfall"
          title={`${planned} of ${s.workGoalTargetJobs} requested bookings can be planned`}
          body={`The current diary does not show enough clean openings for the remaining ${s.workGoalPlanShortfall} booking${s.workGoalPlanShortfall === 1 ? "" : "s"}. BUSY should not market work it cannot confidently place.`}
          footer="Choose a smaller target or free more diary capacity"
          tone="amber"
        />
        {planned > 0 ? (
          <Button
            label={`Use the ${planned} planned booking${planned === 1 ? "" : "s"} for now`}
            primary
            onPress={s.fitWorkGoalToPlannedCapacity}
          />
        ) : null}
        <Button label="Choose a different work goal" onPress={() => s.go("chooseGap")} />
        <Button label="View work diary" onPress={() => s.jump("workHub", "Work")} />
      </Shell>
    );
  }

  const candidates = [
    ...(firstFreshEnquiry
      ? [{
          id: "gap-fresh-enquiry",
          score: 100,
          eyebrow: "Existing demand",
          title: `Reply to ${firstFreshEnquiry.customer.name}`,
          body: `${firstFreshEnquiry.customer.service} is already a live enquiry. Converting existing demand is lower-risk than creating new demand for ${gap.toLowerCase()}.`,
          footer: "Cost: £0",
          status: "Best existing intent",
          tone: "green",
          why: "A real customer is already asking about work. BUSY checks existing demand before starting any new marketing.",
          evidence: [
            ["Goal", gap],
            ["Customer intent", "Direct enquiry"],
            ["Service", firstFreshEnquiry.customer.service],
            ["Advertising required", "£0"],
          ],
          actionLabel: "Open enquiry",
          onAction: () => s.openCustomer(firstFreshEnquiry.customer.id),
        }]
      : []),
    ...(firstQuote
      ? [{
          id: "gap-quote",
          score: 95 + Math.min(8, Number(firstQuote.action?.details?.quoteAmount || 0) / 250) + (s.quoteFollowUpEvidence?.scoreAdjustment || 0),
          eyebrow: "Existing intent",
          title: "Follow up a sent quote",
          body: `${firstQuote.customer.name} already reached the quote stage for ${firstQuote.customer.service.toLowerCase()}. That is stronger intent than buying a new audience.`,
          footer: "Cost: £0",
          status: "Worth revisiting",
          tone: "green",
          why: "BUSY prioritises people already close to booking before asking you to spend money.",
          evidence: [
            ["Goal", gap],
            ["Quote age", `${firstQuote.age} days`],
            ["Quote value", firstQuote.action?.details?.quoteAmount ? `£${firstQuote.action.details.quoteAmount}` : "Not recorded"],
            ["Evidence basis", s.quoteFollowUpEvidence?.basis || "Cautious fallback"],
            ["Recorded outcomes", String(s.quoteFollowUpEvidence?.sample || 0)],
            ["Accepted", String(s.quoteFollowUpEvidence?.successes || 0)],
            ["Planning acceptance rate", formatPercent(s.quoteFollowUpEvidence?.rate)],
            ["Confidence", s.quoteFollowUpEvidence?.confidence || "No evidence yet"],
            ["Advertising required", "£0"],
          ],
          actionLabel: "Review quote follow-up",
          onAction: () => s.prepareQuoteFollowUp(firstQuote.id),
        }]
      : []),
    ...(firstQuietEnquiry
      ? [{
          id: "gap-quiet-enquiry",
          score: 91 + Math.min(6, firstQuietEnquiry.age / 4) + (s.enquiryFollowUpEvidence?.scoreAdjustment || 0),
          eyebrow: "Existing intent",
          title: "Revisit a quiet enquiry",
          body: `${firstQuietEnquiry.customer.name} asked about ${firstQuietEnquiry.customer.service.toLowerCase()} ${firstQuietEnquiry.age} days ago and still has no recorded next action.`,
          footer: "Cost: £0",
          status: "Low-risk follow-up",
          tone: "green",
          why: "This person already showed interest, so a polite check-in is cheaper and usually lower-risk than paid promotion.",
          evidence: [
            ["Goal", gap],
            ["Days since enquiry", String(firstQuietEnquiry.age)],
            ["Service", firstQuietEnquiry.customer.service],
            ["Evidence basis", s.enquiryFollowUpEvidence?.basis || "Cautious fallback"],
            ["Recorded outcomes", String(s.enquiryFollowUpEvidence?.sample || 0)],
            ["Still interested", String(s.enquiryFollowUpEvidence?.successes || 0)],
            ["Planning interest rate", formatPercent(s.enquiryFollowUpEvidence?.rate)],
            ["Confidence", s.enquiryFollowUpEvidence?.confidence || "No evidence yet"],
            ["Advertising required", "£0"],
          ],
          actionLabel: "Review enquiry follow-up",
          onAction: () => s.prepareEnquiryFollowUp(firstQuietEnquiry.customer.id),
        }]
      : []),
    ...((s.reactivationEligibleCustomers?.length || 0)
      ? [{
          id: "gap-reactivation",
          score: (remainingJobs >= 3 ? 98 + Math.min(6, targetedCustomerCount) : remainingJobs === 2 ? 91 + Math.min(5, targetedCustomerCount) : 82 + Math.min(4, targetedCustomerCount)) + (s.reactivationEvidence?.scoreAdjustment || 0),
          eyebrow: "Previous customers",
          title: reactivationUsesAllEligible
            ? `Use all ${targetedCustomerCount} eligible previous customer${targetedCustomerCount === 1 ? "" : "s"}`
            : `Start with ${targetedCustomerCount} due previous customer${targetedCustomerCount === 1 ? "" : "s"}`,
          body: reactivationUsesAllEligible
            ? `BUSY found only ${s.reactivationEligibleCustomers.length} service-matched eligible previous customer${s.reactivationEligibleCustomers.length === 1 ? "" : "s"}. The evidence-sized first batch is at least that large, so all available records are included.`
            : s.reactivationEvidence?.evidenceReady
            ? `BUSY needs ${remainingJobs} more booking${remainingJobs === 1 ? "" : "s"}. Based on ${s.reactivationEvidence.sample} recorded outcome${s.reactivationEvidence.sample === 1 ? "" : "s"} (${s.reactivationEvidence.basis.toLowerCase()}), it would start with ${targetedCustomerCount} service-matched previous customers.`
            : `BUSY needs ${remainingJobs} more booking${remainingJobs === 1 ? "" : "s"}, but there is not enough recorded reactivation evidence yet. It is using the cautious fallback and would start with ${targetedCustomerCount} service-matched previous customers.`,
          footer: "Advertising spend: £0",
          status: "Ready to prepare",
          tone: "green",
          why: "Previous customers already know the business, so BUSY checks them before buying new attention.",
          evidence: [
            ["Goal", gap],
            ["Service-matched eligible customers", String(s.reactivationEligibleCustomers.length)],
            ["Recommended first batch", String(targetedCustomerCount)],
            ["Bookings still needed", String(remainingJobs)],
            ["Evidence basis", s.reactivationEvidence?.basis || "Cautious fallback"],
            ["Recorded sample", String(s.reactivationEvidence?.sample || 0)],
            ["Bookings observed", String(s.reactivationEvidence?.successes || 0)],
            ["Planning conversion rate", formatPercent(s.reactivationEvidence?.rate)],
            ["Confidence", s.reactivationEvidence?.confidence || "No evidence yet"],
            ["Rule", s.eligibilityRule],
            ["Advertising required", "£0"],
          ],
          actionLabel: reactivationUsesAllEligible
            ? `Review all ${targetedCustomerCount} eligible message${targetedCustomerCount === 1 ? "" : "s"}`
            : `Review ${targetedCustomerCount} targeted message${targetedCustomerCount === 1 ? "" : "s"}`,
          onAction: () => s.startCampaign(0, targetedCustomerCount),
        }]
      : []),
    ...(s.preparedPostOpportunity && !s.workGoalAttemptKeys?.has(`post:${s.preparedPostOpportunity.customerId}:${s.preparedPostOpportunity.jobId}`)
      ? [{
          id: "gap-prepared-post",
          score: 68 + (s.postEvidence?.scoreAdjustment || 0),
          eyebrow: "Free organic reach",
          title: "Use the finished-job post already prepared",
          body: `${s.preparedPostOpportunity.customerName}’s ${s.preparedPostOpportunity.service.toLowerCase()} job already has approved photos and editable wording ready.`,
          footer: "Cost: £0 • nothing publishes without approval",
          status: "Prepared",
          tone: "green",
          why: "This reuses real work and approved assets at no ad cost. It sits behind stronger existing customer intent but ahead of paid reach.",
          evidence: [
            ["Goal", gap],
            ["Approved photos", String(s.preparedPostOpportunity.photoCount)],
            ["Draft wording", "Ready"],
            ["Evidence basis", s.postEvidence?.basis || "Cautious fallback"],
            ["Recorded post outcomes", String(s.postEvidence?.sample || 0)],
            ["Bookings attributed", String(s.postEvidence?.successes || 0)],
            ["Planning booking rate", formatPercent(s.postEvidence?.rate)],
            ["Confidence", s.postEvidence?.confidence || "No evidence yet"],
            ["Advertising required", "£0"],
          ],
          actionLabel: "Review post",
          onAction: () => s.openJobPostApproval(s.preparedPostOpportunity.customerId, s.preparedPostOpportunity.jobId),
        }]
      : []),
    ...(s.photoOpportunity && !s.preparedPostOpportunity
      ? [{
          id: "gap-photo-post",
          score: 64 + (s.postEvidence?.scoreAdjustment || 0),
          eyebrow: "Free organic reach",
          title: "Turn approved job photos into a post",
          body: `${s.photoOpportunity.photoCount} approved job photo${s.photoOpportunity.photoCount === 1 ? "" : "s"} can be turned into a finished-job post before paying for reach.`,
          footer: "Cost: £0 • owner approval required",
          status: "Free option",
          tone: "green",
          why: "BUSY uses assets the owner deliberately supplied before suggesting extra spend.",
          evidence: [
            ["Goal", gap],
            ["Approved photos", String(s.photoOpportunity.photoCount)],
            ["Public use", "Still needs approval"],
            ["Advertising required", "£0"],
          ],
          actionLabel: "Prepare post",
          onAction: () => s.openJobPhotoOpportunity(s.photoOpportunity.customerId, s.photoOpportunity.jobId),
        }]
      : []),
    ...(!s.workGoalAttemptKeys?.has("offer") ? [{
      id: "gap-special-offer",
      score: remainingJobs >= 3 ? 88 : remainingJobs === 2 ? 72 : 46,
      eyebrow: "Controlled offer",
      title: "Build a limited offer without assuming a discount",
      body: `If the direct £0 routes are not enough, BUSY can prepare a ${remainingJobs}-booking offer for the remaining capacity in ${gap.toLowerCase()}. It starts at the normal saved service price rather than automatically cutting margin.`,
      footer: "No discount assumed • paid reach still optional",
      status: "Escalation without spend",
      tone: "blue",
      why: "A limited offer can sharpen the reason to book without immediately paying for reach or giving away margin. The owner still reviews the price, audience and booking cap.",
      evidence: [
        ["Goal", gap],
        ["Booking cap", String(remainingJobs)],
        ["Starting price logic", "Normal saved service price"],
        ["Automatic discount", "No"],
        ["Recorded offer outcomes", String(s.offerEvidence?.sample || 0)],
        ["Evidence confidence", s.offerEvidence?.confidence || "No evidence yet"],
        ["Paid advertising required", "No"],
      ],
      actionLabel: "Build limited offer",
      onAction: s.prepareOfferForWorkGoal,
    }] : []),
    ...(!s.workGoalAttemptKeys?.has("free-audit") ? [{
      id: "gap-free-audit",
      score: 50,
      eyebrow: "Free check",
      title: "Check the easy improvements before paying",
      body: "If the record-based opportunities are thin, review the supplied profile and social information for obvious free fixes before buying attention.",
      footer: "Cost: £0",
      status: "Free fallback",
      tone: "blue",
      why: "BUSY DOES IT should improve what the business already has before escalating to paid advertising when time allows.",
      evidence: [
        ["Goal", gap],
        ["Advertising required", "£0"],
        ["Live profile connection", s.connectedAccounts.googleBusiness || s.connectedAccounts.meta ? "Partly selected in prototype" : "Not connected"],
        ["Prototype limitation", "Some profile checks still use manual test inputs"],
      ],
      actionLabel: "Check free improvements",
      onAction: () => {
        s.recordWorkGoalAttempt({
          key: "free-audit",
          type: "free-audit",
          label: "Free profile improvements checked",
          cost: 0,
        });
        s.go("profileAudit");
      },
    }] : []),
    ...(!s.workGoalAttemptKeys?.has("paid") &&
    (!s.autopilotPaidBlockedByRule || s.workGoalAttemptKeys?.has("free-audit")) ? [{
      id: "gap-paid-test",
      score: remainingJobs >= 3 ? 34 : remainingJobs === 2 ? 20 : 8,
      eyebrow: "Escalation only",
      title: "Consider a capped local paid test",
      body: "Only use paid reach if the cheaper routes above are unsuitable or still leave the capacity unfilled.",
      footer: `Suggested cap for this gap: £${suggestedPaidBudget} • absolute prototype limit £${s.testLimit}`,
      status: "Later",
      tone: "amber",
      why: "Paid reach adds cost and uncertainty, so it stays behind useful £0 options. The owner still approves the maximum amount at risk.",
      evidence: [
        ["Goal", gap],
        ["Suggested cap", `£${suggestedPaidBudget}`],
        ["Absolute prototype limit", `£${s.testLimit}`],
        ["Results guaranteed", "No"],
        ["Owner approval", "Required"],
      ],
      actionLabel: "Review paid-test controls",
      onAction: () => {
        s.setAdBudget(String(suggestedPaidBudget));
        s.go("paidTest");
      },
    }] : []),
    {
      id: "gap-hold",
      score: 1,
      eyebrow: "Hold",
      title: "No new action worth forcing",
      body: "BUSY has already tried the useful routes currently available for this goal. Record outcomes, add new business information or wait for a genuinely new opportunity instead of repeating the same activity.",
      footer: "Recommended additional spend: £0",
      status: "Wait for new evidence",
      tone: "blue",
      why: "Repeating the same outreach or spending more without new evidence can create noise rather than useful work. BUSY keeps the goal open and waits for something materially different.",
      evidence: [
        ["Goal actions already tried", String(s.workGoalAttempts.length)],
        ["Bookings still needed", String(s.workGoalRemainingJobs)],
        ["Recommended extra spend", "£0"],
      ],
      actionLabel: "Back to Home",
      onAction: () => s.jump("home", "Home"),
    },
  ].sort((a, b) => (b.score || 0) - (a.score || 0));

  const best = candidates[0];
  const alternatives = candidates.slice(1);

  return (
    <Shell
      s={s}
      title={s.workGoalAttempts.length ? "Best next move" : "Best first move"}
      subtitle={`Goal: fill ${gap.toLowerCase()}. BUSY has ${s.workGoalAttempts.length ? "recalculated from what has already been tried and what still remains" : "ranked the cheapest credible routes using the records and approved assets already saved"}.`}
      brandCue="Existing demand first. Free reach next. Paid only if needed."
    >
      <OpportunityCard
        {...best}
        eyebrow={`Recommended • ${best.eyebrow}`}
        actionLabel={best.actionLabel}
      />

      {s.activeWorkGoal ? (
        <Card
          eyebrow="BUSY’S PLAN"
          title={`${s.workGoalBookedCount} of ${s.workGoalTargetJobs} booked • ${s.workGoalRemainingJobs} still needed`}
          body={
            s.workGoalAttempts.length
              ? `BUSY remembers ${s.workGoalAttempts.length} approved action${s.workGoalAttempts.length === 1 ? "" : "s"} for this goal and has removed them from the recommendation queue.`
              : "No goal action has been approved yet. BUSY will remember each approved step and recalculate what should happen next."
          }
          footer="Capacity and stop rules still outrank marketing"
          tone="blue"
        >
          {s.workGoalAttemptRows.slice(-4).map((attempt) => (
            <MetricRow
              key={attempt.id}
              left={attempt.label}
              right={attempt.outcome}
              strong={attempt.tone === "green"}
            />
          ))}
        </Card>
      ) : null}

      {s.activeWorkGoal?.spreadAcrossSlots && s.workGoalPlannedSlots.length ? (
        <Card
          eyebrow="Capacity plan"
          title={`${s.workGoalTargetJobs} booking${s.workGoalTargetJobs === 1 ? "" : "s"} across ${s.workGoalPlannedSlots.length} opening${s.workGoalPlannedSlots.length === 1 ? "" : "s"}`}
          body="BUSY has turned the larger work target into specific diary openings instead of treating it as vague future capacity."
          footer={`${s.workGoalRemainingJobs} still needed`}
          tone="green"
        >
          {s.workGoalPlannedSlots.map((slot) => (
            <MetricRow
              key={slot.id}
              left={slot.label}
              right={`${slot.bookedCount}/${slot.targetJobs} booked`}
              strong={slot.bookedCount >= slot.targetJobs}
            />
          ))}
        </Card>
      ) : null}
      {s.activeWorkGoal && s.workGoalSlotHours ? (
        <Card
          eyebrow="Capacity checked"
          title={`${s.workGoalPlanningService?.name || "Planning service"} • about ${formatDurationHours(s.workGoalDurationHours)} per job`}
          body={`This ${s.activeWorkGoal.part} is treated as about ${s.workGoalSlotHours} working hours, giving an estimated capacity of ${s.workGoalCapacityMax} job${s.workGoalCapacityMax === 1 ? "" : "s"}. Travel and unusual jobs can change that, so the estimate remains editable.`}
          footer="Planning guidance, not false precision"
          tone="blue"
        />
      ) : null}

      <Card
        eyebrow="Sized to the gap"
        title={`${remainingJobs} booking${remainingJobs === 1 ? "" : "s"} still needed`}
        body={remainingJobs === 1 ? "BUSY keeps this narrow: strongest individual intent first, then only a small previous-customer action if needed." : remainingJobs === 2 ? "BUSY can justify a small targeted batch, but broad promotion is still unnecessary unless the cheaper routes fail." : "The gap is larger, so a broader previous-customer action or limited offer can become proportionate before paid reach."}
        footer="Smallest sensible intervention first"
        tone="green"
      />

      <Card
        eyebrow="What BUSY checked"
        title="The opportunity engine compared the routes underneath"
        body="Live enquiries, quiet enquiries, sent quotes, due previous customers, approved job content, a limited offer, free profile improvements and finally a capped paid test were ranked without making you choose a marketing channel."
        tone="blue"
      >
        <MetricRow left="Chosen work goal" right={gap} />
        <MetricRow left="Target bookings" right={String(s.workGoalTargetJobs)} />
        <MetricRow left="Still needed" right={String(s.workGoalRemainingJobs)} strong />
        <MetricRow left="Eligible previous customers" right={String(s.eligibleCustomers.length)} />
        <MetricRow left="Quiet enquiries" right={String(s.staleEnquiryEntries.length)} />
        <MetricRow left="Quote follow-ups due" right={String(s.dueQuoteEntries.length)} />
        <MetricRow left="Paid spend in best move" right={best.id === "gap-paid-test" ? `Up to £${s.testLimit}` : "£0"} strong />
      </Card>

      {alternatives.length ? (
        <Button
          label={showAlternatives ? "Hide other routes" : `See other routes • ${alternatives.length}`}
          onPress={() => setShowAlternatives((value) => !value)}
        />
      ) : null}

      {showAlternatives
        ? alternatives.map((item) => (
            <OpportunityCard key={item.id} {...item} actionLabel={item.actionLabel} />
          ))
        : null}

      <Button label="Change the spare slot" onPress={() => s.go("chooseGap")} />
      <Button label="Not now" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}


function WhyBestMove({ s }) {
  return (
    <Shell s={s} title="Why this?" subtitle="The short version, in plain English.">
      <Card
        eyebrow="Why we picked it"
        title="Previous customers are the lowest-risk first move"
        body={s.eligibleCustomers.length
          ? `${s.eligibleCustomers.length} previous customer${s.eligibleCustomers.length === 1 ? "" : "s"} currently match the service-specific reactivation timing and contact rules. They already know the business, so this can be a lower-cost first move than paid advertising.`
          : `Nobody currently matches the reactivation rule: ${s.eligibilityRule}`}
        footer="Simple answer first"
        tone="green"
      />
      <Card
        eyebrow="What we checked"
        title="We compared the cheaper options"
        body="Previous customers, old enquiries, old quotes and cross-sell opportunities were considered before a paid advert."
      />
      <Button label="Show expert details" onPress={() => s.go("expertBestMove")} />
      <Button label="Got it" primary onPress={s.back} />
    </Shell>
  );
}

function ExpertBestMove({ s }) {
  const evidence = s.reactivationEvidence || {};
  return (
    <Shell s={s} title="Expert details" subtitle="The evidence behind this recommendation. You never need this screen to use BUSY DOES IT.">
      <Card eyebrow="Recommendation proof" title={`Review ${s.recommendedReactivationBatchSize} service-matched previous customer${s.recommendedReactivationBatchSize === 1 ? "" : "s"} first`} tone="green">
        <MetricRow left="Eligible service-matched customers" right={String(s.reactivationEligibleCustomers?.length || 0)} />
        <MetricRow left="Bookings still needed" right={String(s.workGoalRemainingJobs || 0)} />
        <MetricRow left="Evidence basis" right={evidence.basis || "Cautious fallback"} />
        <MetricRow left="Recorded sample" right={String(evidence.sample || 0)} />
        <MetricRow left="Observed bookings" right={String(evidence.successes || 0)} />
        <MetricRow left="Planning conversion rate" right={formatPercent(evidence.rate)} />
        <MetricRow left="Evidence confidence" right={evidence.confidence || "No evidence yet"} strong />
        <MetricRow left="Advertising spend required" right="£0" />
      </Card>
      <Card
        eyebrow="Decision logic"
        title={evidence.evidenceReady ? "Recorded outcomes now influence the audience size" : "The fallback stays deliberately cautious"}
        body={evidence.evidenceReady ? "BUSY uses a smoothed planning rate rather than the raw percentage, so a small run cannot swing the recommendation too aggressively. Service-specific evidence is preferred once there are at least three recorded outcomes; otherwise broader evidence is used." : "There are fewer than three usable recorded outcomes, so BUSY has not treated the apparent rate as reliable. It keeps the cautious baseline until more evidence accumulates."}
      />
      <Card
        eyebrow="Important limit"
        title="This is planning evidence, not a promise"
        body="The rate helps size the next low-risk action. It does not claim that a particular customer will book, and it does not override capacity, customer intent or the stop condition."
        tone="amber"
      />
      <Button label="Back to simple explanation" primary onPress={s.back} />
    </Shell>
  );
}

function ProfileAudit({ s }) {
  const serviceName = s.selectedService?.name || s.services.find((x) => x.wanted)?.name || s.trade || "your priority service";
  return (
    <Shell s={s} title="Free profile check" subtitle="These prompts use the profile numbers you entered. No live account is being read yet.">
      <OpportunityCard
        eyebrow="Service coverage"
        title={`Check that ${serviceName} is clearly listed`}
        body="Make sure customers can immediately see the work you most want more of."
        footer="Cost: £0"
        status="Free"
        actionLabel="Include"
        onAction={() => s.go("profileAuditPlan")}
        why="Clear service wording helps people who already find the business understand what you actually do."
        evidence={[["Priority service", serviceName], ["Cost", "£0"], ["Source", "Your saved business data"]]}
      />
      <OpportunityCard
        eyebrow="Photos"
        title={`Add ${s.recentPhotoCountNeeded || 0} recent photo${String(s.recentPhotoCountNeeded) === "1" ? "" : "s"}`}
        body="Recent before-and-after proof can make the profile more useful to customers who are already looking."
        footer="Cost: £0"
        status="Free"
        actionLabel="Include"
        onAction={() => s.go("profileAuditPlan")}
        why="Recent visual proof helps customers understand the quality and type of work without paying for more reach."
        evidence={[["Recent photos wanted", String(s.recentPhotoCountNeeded || 0)], ["Cost", "£0"], ["Source", "Your saved business data"]]}
      />
      <OpportunityCard
        eyebrow="Reviews"
        title={`Reply to ${s.unansweredReviewCount || 0} unanswered review${String(s.unansweredReviewCount) === "1" ? "" : "s"}`}
        body="A short genuine reply shows that the business is active and paying attention."
        footer="Cost: £0"
        status="Free"
        actionLabel="Include"
        onAction={() => s.go("profileAuditPlan")}
        why="The reviews already exist, so replying is a free way to improve the experience for people checking the business."
        evidence={[["Unanswered reviews entered", String(s.unansweredReviewCount || 0)], ["New ad spend", "£0"], ["Source", "Your saved business data"]]}
      />
      <Button label="Prepare all 3" primary onPress={() => s.go("profileAuditPlan")} />
      <Button label="Edit these numbers" onPress={() => s.go("businessData")} />
      <Button label="Not now" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function ProfileAuditPlan({ s }) {
  const serviceName = s.selectedService?.name || s.services.find((x) => x.wanted)?.name || s.trade || "your priority service";
  return (
    <Shell s={s} title="Free improvements first" subtitle="Nothing changes publicly in this prototype. These are preparation steps only.">
      <Card eyebrow="Step 1" title={`Check ${serviceName}`} body="Prepare clearer service wording and review it before anything is published." footer="Simulated preparation" />
      <Card eyebrow="Step 2" title={`Choose ${s.recentPhotoCountNeeded || 0} recent photo${String(s.recentPhotoCountNeeded) === "1" ? "" : "s"}`} body="Use recent before-and-after proof that represents the work accurately." footer="Simulated preparation" />
      <Card eyebrow="Step 3" title={`Prepare ${s.unansweredReviewCount || 0} review repl${String(s.unansweredReviewCount) === "1" ? "y" : "ies"}`} body="Draft short genuine replies in the business’s normal tone." footer="Simulated preparation" />
      <Button label="Done" primary onPress={() => s.jump("home", "Home")} />
      <Button label="Back" onPress={s.back} />
    </Shell>
  );
}

function ProfileAuditWhy({ s }) {
  return (
    <Shell s={s} title="Why these improvements?" subtitle="Simple explanation first. Expert evidence is available if you want it.">
      <Card
        eyebrow="BUSY DOES IT logic"
        title="Improve what you already have before buying more attention"
        body="If someone is already finding your business online, a clearer and more complete profile may help without adding advertising cost. That is why we check free improvements before recommending paid promotion."
        footer="Cost-first, evidence-led"
        tone="green"
      />
      <Button label="Show expert details" onPress={() => s.go("expertProfileAudit")} />
      <Button label="Got it" primary onPress={s.back} />
    </Shell>
  );
}

function ExpertProfileAudit({ s }) {
  const serviceName = s.selectedService?.name || s.services.find((item) => item.wanted)?.name || s.trade || "your priority service";
  return (
    <Shell s={s} title="Expert audit details" subtitle="What was checked, what triggered the recommendation, and how certain we are.">
      <Card eyebrow="Sources checked" title="Current business presence">
        <MetricRow left="Website" right="Checked" />
        <MetricRow left="Google Business Profile" right="Checked" />
        <MetricRow left="Facebook / Instagram" right="Checked" />
        <MetricRow left="Calendar / CRM" right="Not needed here" />
      </Card>
      <Card eyebrow="Finding 1" title="Service coverage gap" body={`${serviceName} is a priority service in the app but is not clearly represented in the simulated public profile.`} footer="Confidence: High" />
      <Card eyebrow="Finding 2" title="Recent proof is limited" body="The simulated profile does not show enough recent proof of the priority work. The exact evidence should adapt to the business type rather than assume before-and-after cleaning photos." footer="Confidence: Medium" />
      <Card eyebrow="Finding 3" title="Unanswered reviews" body={`${s.unansweredReviewCount || 0} simulated reviews have no owner response.`} footer="Confidence: High" />
      <Card eyebrow="Important" title="A recommendation must be justifiable" body="In the live product, BUSY DOES IT should show the real source, date, evidence and uncertainty. If the evidence is weak, it should lower confidence or say it does not know." tone="amber" />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function OtherOptions({ s }) {
  const reviewReadyCount = s.customers.reduce(
    (total, customer) =>
      total +
      (customer.contactOk === false
        ? 0
        : (Array.isArray(customer.history) ? customer.history : []).filter(
            (job) => job.kind === "job" && !job.reviewRequestSentAt
          ).length),
    0
  );

  return (
    <Shell
      s={s}
      title="Other opportunities"
      subtitle="These counts now come from the customer, quote and job records actually saved in BUSY DOES IT."
      brandCue="No typed-in old-enquiry or old-quote totals."
    >
      {s.staleEnquiryEntries.length ? (
        <Pressable style={styles.optionCard} onPress={() => s.go("staleEnquiries")}>
          <Text style={styles.optionTitle}>
            {s.staleEnquiryEntries.length} quiet enquir{s.staleEnquiryEntries.length === 1 ? "y" : "ies"}
          </Text>
          <Text style={styles.optionBody}>No recorded next action for at least 7 days. Review the actual customers and dates.</Text>
          <Text style={styles.optionCost}>£0 advertising spend</Text>
        </Pressable>
      ) : null}

      {s.dueQuoteEntries.length ? (
        <Pressable style={styles.optionCard} onPress={() => s.go("staleQuotes")}>
          <Text style={styles.optionTitle}>
            {s.dueQuoteEntries.length} quote follow-up{s.dueQuoteEntries.length === 1 ? "" : "s"} due
          </Text>
          <Text style={styles.optionBody}>Sent quote records that have been quiet for at least 7 days.</Text>
          <Text style={styles.optionCost}>£0 advertising spend</Text>
        </Pressable>
      ) : null}

      {s.eligibleCustomers.length ? (
        <Pressable style={styles.optionCard} onPress={() => s.startCampaign(0)}>
          <Text style={styles.optionTitle}>
            {s.eligibleCustomers.length} previous customer{s.eligibleCustomers.length === 1 ? "" : "s"} due again
          </Text>
          <Text style={styles.optionBody}>Calculated from service-specific repeat timing and contact permission.</Text>
          <Text style={styles.optionCost}>£0 advertising spend</Text>
        </Pressable>
      ) : null}

      {reviewReadyCount ? (
        <Pressable
          style={styles.optionCard}
          onPress={() =>
            s.reviewRequestOpportunity
              ? s.prepareReviewRequest(s.reviewRequestOpportunity.customerId, s.reviewRequestOpportunity.jobId)
              : s.go("customerRecords")
          }
        >
          <Text style={styles.optionTitle}>
            {reviewReadyCount} completed job{reviewReadyCount === 1 ? "" : "s"} could support a review request
          </Text>
          <Text style={styles.optionBody}>Calculated from completed job history and customer contact permission.</Text>
          <Text style={styles.optionCost}>£0 advertising spend</Text>
        </Pressable>
      ) : null}

      <Pressable style={styles.optionCard} onPress={() => s.startCampaign(3)}>
        <Text style={styles.optionTitle}>Consider a relevant add-on</Text>
        <Text style={styles.optionBody}>Service-aware cross-sell remains optional and should only be used when it genuinely fits a saved customer.</Text>
        <Text style={styles.optionCost}>£0 advertising spend</Text>
      </Pressable>

      {!s.staleEnquiryEntries.length && !s.dueQuoteEntries.length && !s.eligibleCustomers.length && !reviewReadyCount ? (
        <Card
          eyebrow="No record-based follow-up due"
          title="The cheap opportunities are genuinely quiet"
          body="BUSY DOES IT is not inventing old enquiries or old quotes just to populate this screen."
          footer="Recommended spend can still be £0"
          tone="green"
        />
      ) : null}

      <Pressable style={styles.optionCard} onPress={() => s.go("paidTest")}>
        <Text style={styles.optionTitle}>Try a small local advert</Text>
        <Text style={styles.optionBody}>Only after the cheaper relevant opportunities above have been checked or deliberately skipped.</Text>
        <Text style={styles.optionCost}>Up to £{s.adBudget}</Text>
      </Pressable>
    </Shell>
  );
}


function CheckSend({ s }) {
  const baseStep = campaignSteps[s.campaignStage] || campaignSteps[0];
  const selectedAudience = s.campaignStage === 0 && s.reactivationAudience?.length ? s.reactivationAudience : s.eligibleCustomers;
  const eligibleCount = selectedAudience.length;
  const serviceGroups = groupCustomersByService(selectedAudience);
  const serviceEntries = Object.entries(serviceGroups);
  const serviceGroupCount = serviceEntries.length;

  const step =
    s.campaignStage === 0
      ? {
          ...baseStep,
          title: `${eligibleCount} customers in ${serviceGroupCount} service group${serviceGroupCount === 1 ? "" : "s"}`,
          audience: `${eligibleCount} selected customer records`,
          why: "BUSY DOES IT splits eligible customers by their previous service so each person gets a relevant draft instead of a generic message about work they may never have booked.",
          evidence: [
            ["Selected customer records", String(eligibleCount)],
            ["Service-specific drafts", String(serviceGroupCount)],
            ["Evidence basis", s.reactivationEvidence?.basis || "Cautious fallback"],
            ["Recorded sample", String(s.reactivationEvidence?.sample || 0)],
            ["Observed bookings", String(s.reactivationEvidence?.successes || 0)],
            ["Planning conversion rate", formatPercent(s.reactivationEvidence?.rate)],
            ["Confidence", s.reactivationEvidence?.confidence || "No evidence yet"],
            ["Eligibility rule", s.eligibilityRule],
            ["Advertising required", "£0"],
          ],
        }
      : s.campaignStage === 1
      ? {
          ...baseStep,
          title: `Follow up ${s.staleEnquiryEntries.length} quiet enquir${s.staleEnquiryEntries.length === 1 ? "y" : "ies"}`,
          audience: `${s.staleEnquiryEntries.length} saved enquiry records`,
          evidence: [["Quiet enquiries detected", String(s.staleEnquiryEntries.length)], ["Rule", "7+ days with no next action"], ["Advertising required", "£0"], ["Data source", "Individual customer records"]],
        }
      : s.campaignStage === 2
      ? {
          ...baseStep,
          title: `Revisit ${s.dueQuoteEntries.length} sent quote${s.dueQuoteEntries.length === 1 ? "" : "s"}`,
          audience: `${s.dueQuoteEntries.length} saved quote records`,
          evidence: [["Quote follow-ups detected", String(s.dueQuoteEntries.length)], ["Highest current quote", `£${s.dueQuoteEntries.reduce((max, item) => Math.max(max, Number(item.action.details?.quoteAmount) || 0), 0)}`], ["Rule", "Sent 7+ days ago"], ["Advertising required", "£0"]],
        }
      : baseStep;

  return (
    <Shell
      s={s}
      title="Check before sending"
      subtitle={
        s.campaignStage === 0
          ? "Each eligible customer gets a draft matched to their previous service. Sending is still simulated in this prototype."
          : "The recipient list is local prototype data. Sending is still simulated in this prototype."
      }
    >
      {s.campaignStage === 0 ? (
        <>
          <Card
            eyebrow={step.audience}
            title={step.title}
            body={s.campaignRecipientLimit ? (s.reactivationEvidence?.evidenceReady ? `BUSY sized this first batch to ${eligibleCount} using ${s.reactivationEvidence.basis.toLowerCase()} with ${s.reactivationEvidence.confidence.toLowerCase()} confidence. Review each service group below; you can edit every draft separately.` : `BUSY sized this first batch to ${eligibleCount} using the cautious fallback because there is not enough recorded conversion evidence yet. Review each service group below; you can edit every draft separately.`) : "Review each service group below. You can edit every draft separately."}
            footer="Advertising spend: £0"
            tone="green"
          />
          {serviceEntries.map(([service, customers]) => {
            const currentDraft =
              s.serviceMessages[service] ||
              `Hi, we’ve got a slot free ${(s.quietSlot || "a quiet slot").toLowerCase()} for ${service.toLowerCase()}. If you’d like a quote or want to book it, just reply here.`;
            return (
              <View key={service} style={styles.serviceMessageCard}>
                <View style={styles.serviceMessageHeader}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.serviceMessageTitle}>{service}</Text>
                    <Text style={styles.serviceMessageMeta}>
                      {customers.length} customer{customers.length === 1 ? "" : "s"} • {customers.map((customer) => customer.name).join(", ")}
                    </Text>
                  </View>
                  <StatusChip label={`${customers.length}`} tone="green" />
                </View>
                <TextInput
                  multiline
                  value={currentDraft}
                  onChangeText={(text) =>
                    s.setServiceMessages((current) => ({ ...current, [service]: text }))
                  }
                  style={styles.messageInput}
                />
              </View>
            );
          })}
        </>
      ) : (
        <Card eyebrow={step.audience} title={step.title} footer={`Estimated cost: ${step.cost}`}>
          <Text style={styles.helper}>Tap the draft below if you want to change it.</Text>
          <TextInput multiline value={s.message} onChangeText={s.setMessage} style={styles.messageInput} />
        </Card>
      )}

      <InlineExplanation why={step.why} evidence={step.evidence} />
      {s.campaignStage === 0 ? <SmallLink label="Review selected customers" onPress={() => s.go("eligibleCustomers")} /> : null}
      <Button
        label={s.campaignStage === 0 ? `Simulate send to ${eligibleCount}` : "Simulate send"}
        primary
        disabled={s.campaignStage === 0 && !eligibleCount}
        onPress={s.simulateCurrentSend}
      />
      <Button
        label={s.campaignStage === 0 ? "Reset all drafts" : "Reset draft"}
        onPress={() => (s.campaignStage === 0 ? s.resetReactivationMessages() : s.startCampaign(s.campaignStage))}
      />
      <Button label="Skip" onPress={() => s.go("otherOptions")} />
    </Shell>
  );
}


function Progress({ s }) {
  const step = campaignSteps[s.campaignStage] || campaignSteps[0];
  const sentRecipients =
    s.campaignStage === 0 && s.lastSimulatedRecipients?.length
      ? s.lastSimulatedRecipients
      : s.reactivationAudience?.length
      ? s.reactivationAudience
      : s.eligibleCustomers;
  const serviceGroupCount = Object.keys(groupCustomersByService(sentRecipients)).length;

  const result =
    s.campaignStage === 0
      ? {
          title: "Service-matched send simulated",
          body: `${sentRecipients.length} eligible customers across ${serviceGroupCount} service group${serviceGroupCount === 1 ? "" : "s"} would receive the relevant draft. No real messages were sent.`,
          footer: "Prototype simulation only",
        }
      : {
          title: step.resultTitle,
          body: step.resultBody,
          footer: step.resultFooter,
        };

  return (
    <Shell
      s={s}
      title="Progress"
      subtitle="After each action, BUSY DOES IT goes back to the live records instead of advancing through a prewritten marketing sequence."
      brandCue="Reassess the business. Then choose the next cheapest sensible move."
    >
      <StatusChip label="£0 action reviewed" tone="green" />
      <Card eyebrow="Latest result" title={result.title} body={result.body} footer={result.footer} tone="green" />

      <OpportunityCard
        eyebrow="Reassess now"
        title="Check the next real opportunity"
        body="Quiet enquiries, sent quotes, due previous customers and completed jobs are recalculated from the records currently saved."
        footer="No invented opportunity counts"
        status="Live records"
        tone="blue"
        actionLabel="See current opportunities"
        onAction={() => s.go("otherOptions")}
        why="The next move should depend on what is actually still unresolved after the previous action, not on a fixed demo funnel."
        evidence={[
          ["Quiet enquiries", String(s.staleEnquiryEntries.length)],
          ["Quote follow-ups due", String(s.dueQuoteEntries.length)],
          ["Previous customers due", String(s.eligibleCustomers.length)],
          ["Advertising required to review them", "£0"],
        ]}
      />

      {s.campaignStage === 0 ? <Button label="View simulated replies" onPress={() => s.go("replies")} /> : null}
      <Button label="Stop for now" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}



function Replies({ s }) {
  const recipients = s.lastSimulatedRecipients?.length ? s.lastSimulatedRecipients : s.eligibleCustomers;
  const replies = recipients.map((customer, index) =>
    buildSimulatedReply(customer, index, s.quietSlot)
  );
  const replyCount = replies.filter((reply) => reply.status !== "No reply").length;
  const noReplyCount = replies.length - replyCount;
  const actionableCount = replies.filter((reply) => replyActionForStatus(reply.status)).length;

  return (
    <Shell
      s={s}
      title="Replies"
      subtitle="BUSY DOES IT turns useful replies into clear next actions."
    >
      <Card
        eyebrow="Simulated outcome"
        title={`${replyCount} repl${replyCount === 1 ? "y" : "ies"} from ${recipients.length} recipients`}
        body={`${actionableCount} replies have a sensible next step. ${noReplyCount} customer${noReplyCount === 1 ? "" : "s"} have no reply yet.`}
        footer="No real messages or replies"
        tone="green"
      />

      {replies.map((reply) => {
        const muted = reply.status === "Not now" || reply.status === "No reply";
        const suggested = replyActionForStatus(reply.status);
        const saved = s.replyActions[reply.id];

        return (
          <View style={styles.replyCard} key={reply.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.replyName}>{reply.name}</Text>
                <Text style={styles.replyService}>{reply.service}</Text>
              </View>
              <Text style={[styles.replyStatus, muted && styles.replyStatusMuted]}>{reply.status}</Text>
            </View>
            <Text style={styles.replyBody}>{reply.body}</Text>

            {suggested ? (
              saved?.done ? (
                <View style={styles.replyActionSaved}>
                  <Text style={styles.replyActionSavedTitle}>Completed</Text>
                  <Text style={styles.replyActionSavedBody}>{saved.task}</Text>
                  {saved.details?.summary ? (
                    <Text style={styles.replyActionSavedDetail}>{saved.details.summary}</Text>
                  ) : null}
                  <Pressable
                    onPress={() => s.openSavedReplyAction(reply.id)}
                    style={styles.replyActionViewWrap}
                  >
                    <Text style={styles.replyActionViewText}>View details</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => s.beginReplyAction(reply.id, suggested)}
                  style={styles.replyActionButton}
                >
                  <Text style={styles.replyActionButtonText}>
                    {saved ? `Continue: ${suggested.label}` : suggested.label}
                  </Text>
                </Pressable>
              )
            ) : null}
          </View>
        );
      })}

      {Object.keys(s.replyActions).length ? (
        <Button
          label={s.pendingReplyActionCount ? `Review next actions (${s.pendingReplyActionCount})` : "Review completed actions"}
          primary
          onPress={() => s.go("replyActions")}
        />
      ) : null}
      <Button label="Back to progress" onPress={s.back} />
    </Shell>
  );
}


function CustomerActivity({ s }) {
  const [filter, setFilter] = useState("All");
  const entries = Object.entries(s.replyActions || {})
    .map(([id, action]) => {
      const customer =
        s.customers.find((item) => item.id === id) ||
        s.lastSimulatedRecipients.find((item) => item.id === id);
      return customer ? { id, action, customer } : null;
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (!!a.action.done !== !!b.action.done) return a.action.done ? 1 : -1;
      return String(b.action.completedAt || "").localeCompare(String(a.action.completedAt || ""));
    });

  const pending = entries.filter((item) => !item.action.done);
  const completed = entries.filter((item) => item.action.done);
  const filters = ["All", "To do", "Quotes", "Bookings", "Reminders", "Completed"];
  const visible = entries.filter((item) => {
    if (filter === "To do") return !item.action.done;
    if (filter === "Completed") return !!item.action.done;
    if (filter === "Quotes") return item.action.type === "quote";
    if (filter === "Bookings") return item.action.type === "booking";
    if (filter === "Reminders") return item.action.type === "reminder";
    return true;
  });

  const typeLabel = (type) => {
    if (type === "quote") return "Quote";
    if (type === "booking") return "Booking";
    if (type === "reminder") return "Reminder";
    return "Follow-up";
  };

  return (
    <Shell
      s={s}
      title="Customer activity"
      subtitle="Quotes, bookings, reminders and outstanding customer work — all in one permanent place."
    >
      <Card
        eyebrow="Customer work"
        title={`${pending.length} to do • ${completed.length} completed`}
        body="Completed items stay here so you can reopen and edit them later."
        footer="Stored locally in this prototype"
        tone="green"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterRow}>
          {filters.map((item) => (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={[styles.filterChip, filter === item && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, filter === item && styles.filterChipTextActive]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Text style={styles.sectionLabel}>{filter}</Text>
      {visible.map(({ id, action, customer }) => (
        <Pressable
          key={id}
          onPress={() => s.openSavedReplyAction(id)}
          style={[styles.activityCard, action.done && styles.activityCardDone]}
        >
          <View style={styles.activityTopRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.activityName}>{customer.name}</Text>
              <Text style={styles.activityService}>{customer.service}</Text>
            </View>
            <StatusChip label={typeLabel(action.type)} tone={action.done ? "green" : "blue"} />
          </View>
          <Text style={styles.activitySummary}>
            {action.done
              ? action.details?.summary || action.task || "Completed"
              : action.task || "Customer follow-up"}
          </Text>
          <Text style={styles.activityOpen}>{action.done ? "View / edit →" : "Open action →"}</Text>
        </Pressable>
      ))}

      {!visible.length ? (
        <Card
          eyebrow="Nothing here"
          title={`No ${filter.toLowerCase()} items`}
          body="Try another filter or create more customer activity from the Home flow."
        />
      ) : null}

      {s.completedBookingCount ? <Button label="Open bookings" onPress={() => s.go("bookings")} /> : null}
      <Button label="Customer records" onPress={() => s.go("customerRecords")} />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function Bookings({ s }) {
  const todayISO = dateToISO(new Date());
  const entries = Object.entries(s.replyActions || {})
    .map(([id, action]) => {
      if (!action?.done || action.type !== "booking" || !action.details?.bookingDate) return null;
      const customer =
        s.customers.find((item) => item.id === id) ||
        s.lastSimulatedRecipients.find((item) => item.id === id);
      return customer ? { id, action, customer } : null;
    })
    .filter(Boolean)
    .sort((a, b) =>
      `${a.action.details.bookingDate}T${a.action.details.bookingTime || "00:00"}`.localeCompare(
        `${b.action.details.bookingDate}T${b.action.details.bookingTime || "00:00"}`
      )
    );

  const activeEntries = entries.filter(
    (item) => !["Cancelled", "Completed"].includes(item.action.details?.bookingStatus || "Confirmed")
  );
  const clashes = activeEntries.filter((entry, index) =>
    activeEntries.some((other, otherIndex) =>
      otherIndex !== index &&
      other.action.details.bookingDate === entry.action.details.bookingDate &&
      other.action.details.bookingTime === entry.action.details.bookingTime
    )
  );
  const overdue = activeEntries.filter((item) => item.action.details.bookingDate < todayISO);
  const today = activeEntries.filter((item) => item.action.details.bookingDate === todayISO);
  const upcoming = activeEntries.filter((item) => item.action.details.bookingDate > todayISO);
  const completed = entries.filter((item) => item.action.details?.bookingStatus === "Completed");
  const cancelled = entries.filter((item) => item.action.details?.bookingStatus === "Cancelled");

  const renderBooking = ({ id, action, customer }) => {
    const status = action.details?.bookingStatus || "Confirmed";
    const hasClash = clashes.some((item) => item.id === id);
    const isOverdue = status === "Confirmed" && action.details.bookingDate < todayISO;
    const displayStatus = hasClash ? "Clash" : isOverdue ? "Needs update" : status;
    return (
      <Pressable key={id} onPress={() => s.openSavedReplyAction(id)} style={styles.bookingCard}>
        <View style={styles.activityTopRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.activityName}>{customer.name}</Text>
            <Text style={styles.activityService}>{customer.service}</Text>
          </View>
          <StatusChip
            label={displayStatus}
            tone={hasClash || isOverdue ? "amber" : ["Cancelled"].includes(status) ? "blue" : "green"}
          />
        </View>
        <Text style={styles.bookingWhen}>
          {formatUKDate(action.details.bookingDate)} at {action.details.bookingTime || "time not set"}
        </Text>
        {Number(action.details?.jobValue || action.details?.sourceQuoteAmount) > 0 ? (
          <Text style={styles.bookingValue}>
            {status === "Completed" ? "Completed value" : "Booked value"}: £{action.details?.jobValue || action.details?.sourceQuoteAmount}
          </Text>
        ) : null}
        <Text style={styles.activityOpen}>View / edit booking →</Text>
      </Pressable>
    );
  };

  return (
    <Shell
      s={s}
      title="Bookings"
      subtitle="Your local work diary — today, upcoming, completed and cancelled."
      brandCue="Work first. Marketing second."
    >
      <Card
        eyebrow="Work diary"
        title={`${today.length} today • ${upcoming.length} upcoming`}
        body={
          overdue.length
            ? `${overdue.length} past booking${overdue.length === 1 ? "" : "s"} still need an outcome. Mark them completed, move them or cancel them.`
            : clashes.length
            ? "One or more active booking times overlap. Open the marked booking to fix it."
            : "No overdue jobs or exact active booking-time clashes detected."
        }
        footer={`£${s.bookedWorkValue} currently booked`}
        tone={overdue.length || clashes.length ? "amber" : "green"}
      />

      {overdue.length ? <Text style={styles.sectionLabel}>Needs an outcome</Text> : null}
      {overdue.map(renderBooking)}

      {today.length ? <Text style={styles.sectionLabel}>Today</Text> : null}
      {today.map(renderBooking)}

      {upcoming.length ? <Text style={styles.sectionLabel}>Upcoming</Text> : null}
      {upcoming.map(renderBooking)}

      {completed.length ? <Text style={styles.sectionLabel}>Completed</Text> : null}
      {completed.map(renderBooking)}

      {cancelled.length ? <Text style={styles.sectionLabel}>Cancelled</Text> : null}
      {cancelled.map(renderBooking)}

      {!entries.length ? (
        <Card eyebrow="No bookings yet" title="Nothing in the diary" body="Confirmed prototype bookings will appear here." />
      ) : null}

      <Button label="Customer activity" onPress={() => s.go("customerActivity")} />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function ReplyActions({ s }) {
  const recipients = s.lastSimulatedRecipients?.length ? s.lastSimulatedRecipients : s.eligibleCustomers;
  const repliesById = Object.fromEntries(
    recipients.map((customer, index) => {
      const reply = buildSimulatedReply(customer, index, s.quietSlot);
      return [reply.id, reply];
    })
  );
  const entries = Object.entries(s.replyActions)
    .map(([id, action]) => ({ id, action, reply: repliesById[id] }))
    .filter((item) => item.reply);

  const pending = entries.filter((item) => !item.action.done);
  const done = entries.filter((item) => item.action.done);

  return (
    <Shell
      s={s}
      title="Next actions"
      subtitle="Work through customer replies here instead of keeping a separate to-do list."
    >
      <Card
        eyebrow="Reply follow-up"
        title={`${pending.length} action${pending.length === 1 ? "" : "s"} still to do`}
        body={done.length ? `${done.length} action${done.length === 1 ? "" : "s"} already completed.` : "Handle the useful replies first."}
        footer="Customer work before more advertising"
        tone="green"
      />

      {pending.map(({ id, action, reply }) => {
        const suggested = replyActionForStatus(reply.status);
        const effective = suggested || { type: action.type, label: action.task, task: action.task };
        return (
          <View key={id} style={styles.replyTaskCard}>
            <Text style={styles.replyTaskEyebrow}>{reply.status} • {reply.service}</Text>
            <Text style={styles.replyTaskName}>{reply.name}</Text>
            <Text style={styles.replyTaskBody}>{action.task}</Text>
            <Pressable
              onPress={() => s.beginReplyAction(id, effective)}
              style={styles.replyTaskOpenButton}
            >
              <Text style={styles.replyTaskOpenText}>{suggested?.label || "Open action"}</Text>
            </Pressable>
          </View>
        );
      })}

      {done.length ? (
        <>
          <Text style={styles.sectionLabel}>Completed</Text>
          {done.map(({ id, action, reply }) => (
            <View key={id} style={[styles.replyTaskCard, styles.replyTaskCardDone]}>
              <Text style={styles.replyTaskEyebrow}>{reply.service}</Text>
              <Text style={styles.replyTaskName}>{reply.name}</Text>
              <Text style={styles.replyTaskBody}>✓ {action.task}</Text>
              {action.details?.summary ? <Text style={styles.replyTaskDetail}>{action.details.summary}</Text> : null}
              <Pressable
                onPress={() => s.openSavedReplyAction(id)}
                style={styles.replyTaskViewButton}
              >
                <Text style={styles.replyTaskViewText}>View / edit details</Text>
              </Pressable>
            </View>
          ))}
        </>
      ) : null}

      {!entries.length ? (
        <Card
          eyebrow="Nothing queued"
          title="No reply actions saved yet"
          body="Go back to Replies and choose what you want to do with an interested or booked customer."
        />
      ) : null}

      <Button label="Back to replies" primary onPress={s.back} />
      <Button label="Home" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function ReplyActionDetail({ s }) {
  const customer = s.selectedReplyCustomer;
  if (!customer) {
    return (
      <Shell s={s} title="Action unavailable" subtitle="That customer record is no longer available.">
        <Button label="Back" primary onPress={s.back} />
      </Shell>
    );
  }

  const saved = s.replyActions[customer.id] || {};
  const manualAction = saved.origin === "manual";
  const recipients = s.lastSimulatedRecipients?.length ? s.lastSimulatedRecipients : s.eligibleCustomers;
  const index = Math.max(0, recipients.findIndex((item) => item.id === customer.id));
  const reply = manualAction
    ? { status: "Direct action", body: "Started directly from the customer record." }
    : buildSimulatedReply(customer, index, s.quietSlot);
  const suggested = manualAction ? null : replyActionForStatus(reply.status);
  const type = saved.type || suggested?.type;
  const quoteStatus = saved.details?.quoteStatus || "Prepared";
  const bookingStatus = saved.details?.bookingStatus || (saved.done ? "Confirmed" : "Draft");
  const reminderStatus = saved.details?.reminderStatus || "Scheduled";
  const todayISO = dateToISO(new Date());

  const suggestedBookingDate = nextDateForSlot(s.quietSlot);
  const suggestedBookingTime = defaultTimeForSlot(s.quietSlot);
  const savedBookingNeedsReview =
    type === "booking" &&
    saved?.details?.bookingDate &&
    (
      !dateMatchesSlotWeekday(saved.details.bookingDate, s.quietSlot) ||
      !timeMatchesSlotPart(saved.details.bookingTime, s.quietSlot)
    );
  const currentBookingMatchesSlot =
    dateMatchesSlotWeekday(s.actionBookingDate, s.quietSlot) &&
    timeMatchesSlotPart(s.actionBookingTime, s.quietSlot);
  const bookingCorrectionReady =
    savedBookingNeedsReview &&
    currentBookingMatchesSlot &&
    (
      s.actionBookingDate !== saved.details.bookingDate ||
      s.actionBookingTime !== saved.details.bookingTime
    );
  const bookingClashes = Object.entries(s.replyActions || {})
    .map(([id, action]) => {
      const otherStatus = action?.details?.bookingStatus || "Confirmed";
      if (
        id === customer.id ||
        !action?.done ||
        action.type !== "booking" ||
        ["Cancelled", "Completed"].includes(otherStatus) ||
        action.details?.bookingDate !== s.actionBookingDate ||
        action.details?.bookingTime !== s.actionBookingTime
      ) return null;
      const clashCustomer =
        s.customers.find((item) => item.id === id) ||
        s.lastSimulatedRecipients.find((item) => item.id === id);
      return clashCustomer ? { id, action, customer: clashCustomer } : null;
    })
    .filter(Boolean);
  const freeBookingTime = timeOptionsForSlot(s.quietSlot).find((time) =>
    !Object.entries(s.replyActions || {}).some(([id, action]) =>
      id !== customer.id &&
      action?.done &&
      action.type === "booking" &&
      !["Cancelled", "Completed"].includes(action.details?.bookingStatus || "Confirmed") &&
      action.details?.bookingDate === s.actionBookingDate &&
      action.details?.bookingTime === time
    )
  );

  const finish = (details) => {
    s.completeReplyAction(customer.id, details);
    s.back();
  };

  if (type === "quote") {
    return (
      <Shell
        s={s}
        title="Quote"
        subtitle={`For ${customer.name} • ${customer.service}. Sending is simulated in this prototype.`}
        brandCue="Prepare it. Track it. Turn wins into work."
      >
        <Card
          eyebrow={manualAction ? "Quote started from customer record" : "Customer asked for a quote"}
          title={customer.name}
          body={manualAction ? `Prepare or record a quote for ${customer.service}. Nothing is sent automatically.` : reply.body}
          tone="green"
        />
        {saved.done ? (
          <Card
            eyebrow="Quote status"
            title={quoteStatus}
            body={
              quoteStatus === "Prepared"
                ? "The quote is ready but has not been marked as sent."
                : quoteStatus === "Sent"
                ? `The quote was marked sent on ${saved.details?.quoteSentAt ? formatUKDate(String(saved.details.quoteSentAt).slice(0, 10)) : "an unknown date"} and is waiting for an outcome. Nothing was sent automatically by the prototype.`
                : quoteStatus === "Accepted"
                ? "The customer has accepted this prototype quote. The next sensible step is to book the work."
                : "This quote has been marked as declined."
            }
            footer={saved.details?.quoteAmount ? `£${saved.details.quoteAmount}` : undefined}
            tone={quoteStatus === "Declined" ? "blue" : "green"}
          />
        ) : null}

        <View style={styles.suggestionBox}>
          <Text style={styles.suggestionTitle}>Why this amount?</Text>
          <Text style={styles.suggestionBody}>
            {Number(customer.lastJobValue) > 0
              ? `Suggested from this customer’s previous recorded job: £${customer.lastJobValue}. Check it before using it — this is not a fresh calculated quote.`
              : `Suggested from your saved ${customer.service.toLowerCase()} service price. Check it before using it.`}
          </Text>
        </View>
        <Field label="Quote amount" value={s.actionQuoteAmount} onChangeText={s.setActionQuoteAmount} keyboardType="number-pad" prefix="£" />
        <Text style={styles.fieldLabel}>Draft reply</Text>
        <TextInput multiline value={s.actionQuoteMessage} onChangeText={s.setActionQuoteMessage} style={styles.messageInput} />
        {(quoteStatus === "Prepared" || quoteStatus === "Sent" || !saved.done) ? (
          <>
            <DatePickerField
              label="Quote sent date"
              value={s.actionQuoteSentDate}
              onChange={s.setActionQuoteSentDate}
            />
            <Card
              eyebrow="Automatic admin"
              title={`Follow-up check: ${formatUKDate(addDaysFromISO(s.actionQuoteSentDate || dateToISO(new Date()), 7))}`}
              body="Once the quote is marked sent, BUSY watches this date. If the quote is still unresolved, it can prepare the follow-up automatically."
              tone="blue"
            />
          </>
        ) : null}
        <Button
          label={saved.done ? "Save quote changes" : "Save quote as prepared"}
          primary
          disabled={!String(s.actionQuoteAmount).trim()}
          onPress={() =>
            finish({
              ...(saved.details || {}),
              quoteAmount: s.actionQuoteAmount,
              message: s.actionQuoteMessage,
              quoteStatus: saved.details?.quoteStatus || "Prepared",
              summary: `Quote ${String(saved.details?.quoteStatus || "Prepared").toLowerCase()} for £${s.actionQuoteAmount}`,
            })
          }
        />
        {!saved.done ? (
          <Button
            label="Save & mark quote as sent"
            disabled={!String(s.actionQuoteAmount).trim()}
            onPress={() =>
              finish({
                ...(saved.details || {}),
                quoteAmount: s.actionQuoteAmount,
                message: s.actionQuoteMessage,
                quoteStatus: "Sent",
                quoteSentAt: new Date(`${s.actionQuoteSentDate || dateToISO(new Date())}T12:00:00`).toISOString(),
                followUpDueDate: addDaysFromISO(s.actionQuoteSentDate || dateToISO(new Date()), 7),
                summary: `Quote marked sent for £${s.actionQuoteAmount}`,
              })
            }
          />
        ) : null}

        {saved.done && quoteStatus === "Prepared" ? (
          <Button label="Mark quote as sent" onPress={() => s.setQuoteStatus(customer.id, "Sent")} />
        ) : null}
        {saved.done && quoteStatus === "Sent" ? (
          <>
            <Button label="Mark quote accepted" onPress={() => s.setQuoteStatus(customer.id, "Accepted")} />
            <Button label="Mark quote declined" onPress={() => s.setQuoteStatus(customer.id, "Declined")} />
          </>
        ) : null}
        {saved.done && quoteStatus === "Accepted" ? (
          <Button label="Turn accepted quote into booking" onPress={() => s.convertQuoteToBooking(customer.id)} />
        ) : null}
        {saved.done && quoteStatus === "Declined" ? (
          <Button label="Reopen quote" onPress={() => s.setQuoteStatus(customer.id, "Sent")} />
        ) : null}

        <Button label="Open customer" onPress={() => s.openCustomer(customer.id)} />
        <Button label="Cancel" onPress={s.back} />
      </Shell>
    );
  }

  if (type === "booking") {
    return (
      <Shell
        s={s}
        title="Booking"
        subtitle={`For ${customer.name} • ${customer.service}. This is a local prototype booking only.`}
        brandCue="Booked work should turn into completed work."
      >
        <Card
          eyebrow={manualAction ? "Booking started from customer record" : "Customer wants the slot"}
          title={customer.name}
          body={
            customer.address
              ? `${manualAction ? `Choose the date and time agreed with ${customer.name}. This saves a local booking only.` : reply.body}\nJob location: ${customer.address}`
              : manualAction
              ? `Choose the date and time agreed with ${customer.name}. This saves a local booking only.`
              : reply.body
          }
          tone="green"
        />
        {saved.done ? (
          <Card
            eyebrow="Booking status"
            title={bookingStatus}
            body={
              bookingStatus === "Confirmed"
                ? "This job is in the work diary."
                : bookingStatus === "Completed"
                ? "The job has been added to this customer’s local job history."
                : bookingStatus === "Cancelled"
                ? "This booking is cancelled and no longer counts as upcoming work."
                : "Finish confirming the booking details below."
            }
            footer={saved.details?.summary}
            tone={bookingStatus === "Cancelled" ? "blue" : "green"}
          />
        ) : null}

        <View
          style={[
            styles.suggestionBox,
            savedBookingNeedsReview && !bookingCorrectionReady && styles.suggestionBoxWarning,
            bookingCorrectionReady && styles.suggestionBoxSuccess,
          ]}
        >
          <Text style={styles.suggestionTitle}>
            {bookingCorrectionReady
              ? "Correction ready to save"
              : savedBookingNeedsReview
              ? "Saved booking needs a quick check"
              : manualAction
              ? "Choose the agreed slot"
              : "Matched to the customer reply"}
          </Text>
          <Text style={styles.suggestionBody}>
            {bookingCorrectionReady
              ? `The new choice is ${formatUKDate(s.actionBookingDate)} at ${s.actionBookingTime}, which now matches “${s.quietSlot}”.`
              : savedBookingNeedsReview
              ? `The saved booking is ${formatUKDate(saved.details.bookingDate)} at ${saved.details.bookingTime || "no time"}, which does not match “${s.quietSlot}”.`
              : manualAction
              ? "Use the date and time you have actually agreed with the customer. The suggested values are only a starting point."
              : `BUSY DOES IT has suggested the next ${s.quietSlot || "matching"} slot.`}
          </Text>
          {savedBookingNeedsReview && !bookingCorrectionReady ? (
            <Pressable
              onPress={() => {
                s.setActionBookingDate(suggestedBookingDate);
                s.setActionBookingTime(suggestedBookingTime);
              }}
              style={styles.slotFixButton}
            >
              <Text style={styles.slotFixButtonText}>
                Use next {s.quietSlot || "matching slot"} instead
              </Text>
            </Pressable>
          ) : null}
        </View>

        <DatePickerField
          label="Booking date"
          value={s.actionBookingDate}
          onChange={s.setActionBookingDate}
          allowFuture
          minimumDate={bookingStatus === "Completed" ? null : dateToISO(new Date())}
        />
        <Text style={styles.fieldLabel}>Time</Text>
        <View style={styles.timeChoiceWrap}>
          {timeOptionsForSlot(s.quietSlot).map((time) => (
            <Pressable
              key={time}
              onPress={() => s.setActionBookingTime(time)}
              style={[
                styles.timeChoice,
                s.actionBookingTime === time && styles.timeChoiceSelected,
              ]}
            >
              <Text
                style={[
                  styles.timeChoiceText,
                  s.actionBookingTime === time && styles.timeChoiceTextSelected,
                ]}
              >
                {time}
              </Text>
            </Pressable>
          ))}
        </View>
        <Field label="Or enter a time" value={s.actionBookingTime} onChangeText={s.setActionBookingTime} placeholder="e.g. 14:30" />
        <Field
          label={saved.done && bookingStatus === "Confirmed" ? "Actual / expected job value" : "Expected job value"}
          value={s.actionJobValue}
          onChangeText={s.setActionJobValue}
          keyboardType="number-pad"
          prefix="£"
          placeholder="Optional"
        />

        {bookingClashes.length ? (
          <View style={styles.clashBox}>
            <Text style={styles.clashTitle}>Booking clash</Text>
            <Text style={styles.clashBody}>
              {bookingClashes[0].customer.name} is already booked for {formatUKDate(s.actionBookingDate)} at {s.actionBookingTime}.
            </Text>
            {freeBookingTime ? (
              <Pressable onPress={() => s.setActionBookingTime(freeBookingTime)} style={styles.slotFixButton}>
                <Text style={styles.slotFixButtonText}>Use {freeBookingTime} instead</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Button
          label={saved.done ? "Save booking changes" : "Save booking confirmation"}
          primary
          disabled={!s.actionBookingTime.trim() || bookingClashes.length > 0}
          onPress={() =>
            finish({
              ...(saved.details || {}),
              bookingDate: s.actionBookingDate,
              bookingTime: s.actionBookingTime,
              bookingStatus: bookingStatus === "Draft" ? "Confirmed" : bookingStatus,
              jobValue: s.actionJobValue,
              summary: `Booking set for ${formatUKDate(s.actionBookingDate)} at ${s.actionBookingTime}`,
            })
          }
        />

        {saved.done && bookingStatus === "Confirmed" ? (
          <>
            <Text style={styles.fieldLabel}>Completion note (optional)</Text>
            <TextInput
              multiline
              value={s.actionJobNote}
              onChangeText={s.setActionJobNote}
              placeholder="Anything useful to remember about the finished job?"
              placeholderTextColor="#9AA3B2"
              style={styles.messageInput}
            />
            <Button
              label="Mark job completed"
              onPress={() => {
                const jobId = s.markBookingCompleted(customer.id, s.actionJobValue, s.actionJobNote);
                if (jobId) s.startJobPhotoPrompt(customer.id, jobId);
              }}
            />
            <Button label="Cancel booking" onPress={() => s.setBookingStatus(customer.id, "Cancelled")} />
          </>
        ) : null}
        {saved.done && bookingStatus === "Cancelled" ? (
          <Button label="Reopen booking" onPress={() => s.setBookingStatus(customer.id, "Confirmed")} />
        ) : null}
        {saved.done && bookingStatus === "Completed" ? (
          <>
            <Button
              label="Manage job photos"
              onPress={() => s.openJobAssets(customer.id, `job-${customer.id}-${saved.details?.bookingDate}`)}
            />
            <Button label="View customer job history" onPress={() => s.openCustomer(customer.id)} />
          </>
        ) : null}

        <Button label="Open customer" onPress={() => s.openCustomer(customer.id)} />
        <Button label="Cancel" onPress={s.back} />
      </Shell>
    );
  }

  if (type === "reminder") {
    const reminderDue =
      saved.done &&
      reminderStatus !== "Completed" &&
      saved.details?.reminderDate &&
      saved.details.reminderDate <= todayISO;
    return (
      <Shell
        s={s}
        title="Follow-up reminder"
        subtitle={`For ${customer.name} • ${customer.service}. Stored locally in this prototype.`}
        brandCue="A reminder should come back when it matters."
      >
        <Card
          eyebrow={manualAction ? "Follow-up started from customer record" : "Customer said not now"}
          title={customer.name}
          body={manualAction ? "Choose when you want this customer to come back onto the work list." : reply.body}
          tone="amber"
        />
        {saved.done ? (
          <Card
            eyebrow="Reminder status"
            title={reminderStatus === "Completed" ? "Completed" : reminderDue ? "Due now" : "Scheduled"}
            body={
              reminderStatus === "Completed"
                ? "This follow-up has been marked as completed."
                : reminderDue
                ? `This follow-up was due on ${formatUKDate(saved.details.reminderDate)}.`
                : `BUSY DOES IT will surface this on Home when ${formatUKDate(saved.details.reminderDate)} arrives.`
            }
            tone={reminderDue ? "amber" : "green"}
          />
        ) : null}

        <Text style={styles.fieldLabel}>Quick follow-up</Text>
        <View style={styles.timeChoiceWrap}>
          {[
            [7, "1 week"],
            [14, "2 weeks"],
            [30, "1 month"],
            [60, "2 months"],
          ].map(([days, label]) => {
            const presetDate = addDaysISO(days);
            const selected = s.actionReminderDate === presetDate;
            return (
              <Pressable
                key={days}
                onPress={() => s.setActionReminderDate(presetDate)}
                style={[styles.timeChoice, selected && styles.timeChoiceSelected]}
              >
                <Text style={[styles.timeChoiceText, selected && styles.timeChoiceTextSelected]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <DatePickerField
          label="Follow-up date"
          value={s.actionReminderDate}
          onChange={s.setActionReminderDate}
          allowFuture
          minimumDate={dateToISO(new Date())}
        />
        <Button
          label={saved.done ? "Save / reschedule reminder" : "Save follow-up reminder"}
          primary
          onPress={() =>
            finish({
              ...(saved.details || {}),
              reminderDate: s.actionReminderDate,
              reminderStatus: "Scheduled",
              summary: `Follow up on ${formatUKDate(s.actionReminderDate)}`,
            })
          }
        />
        {saved.done && reminderStatus !== "Completed" ? (
          <>
            {reminderDue ? (
              <Button
                label="Snooze 7 days"
                onPress={() => s.rescheduleReminder(customer.id, addDaysISO(7))}
              />
            ) : null}
            <Button label={reminderDue ? "Mark follow-up done" : "Mark done now"} onPress={() => s.markReminderDone(customer.id)} />
          </>
        ) : null}
        <Button label="Open customer" onPress={() => s.openCustomer(customer.id)} />
        <Button label="Cancel" onPress={s.back} />
      </Shell>
    );
  }

  return (
    <Shell s={s} title="Next action" subtitle="This action does not need a dedicated workflow yet.">
      <Card eyebrow={manualAction ? "Direct customer action" : reply.status} title={customer.name} body={saved.task || suggested?.task || "Follow up"} />
      <Button
        label="Mark complete"
        primary
        onPress={() => finish({ summary: "Marked complete" })}
      />
      <Button label="Cancel" onPress={s.back} />
    </Shell>
  );
}

function PaidTest({ s }) {
  const overSingleLimit = Number(s.adBudget || 0) > Number(s.testLimit || 0);
  return (
    <Shell s={s} title="Review a paid test" subtitle="Paid advertising is optional, capped and never presented as guaranteed work.">
      {s.autopilotPaidBlockedByRule && !s.workGoalAttemptKeys?.has("free-audit") ? (
        <Card
          eyebrow="Owner rule"
          title="Paid advertising is blocked for now"
          body="Your Autopilot rule says the free options must be tried first. BUSY will not recommend or approve this paid route until the free-check step has been recorded."
          tone="amber"
        />
      ) : null}
      <Card
        eyebrow="Small paid test"
        title="Try a local advert"
        body={`Suggested test: £${s.adBudget}. Your single-test limit is £${s.testLimit}. Work is not guaranteed.`}
        footer={`Maximum at risk: £${s.adBudget}`}
        tone="amber"
      />
      <Field label="Maximum spend" value={s.adBudget} onChangeText={s.setAdBudget} keyboardType="number-pad" prefix="£" />
      {overSingleLimit ? <Text style={styles.warningText}>This is above your £{s.testLimit} single-test limit. Lower it or change your limit in Settings.</Text> : null}
      <InlineExplanation
        why="The free and low-cost options have been checked first in this flow. A capped local test is now one reasonable option, but it can still produce no work."
        evidence={[["Suggested test", `£${s.adBudget}`], ["Single-test limit", `£${s.testLimit}`], ["Weekly limit", `£${s.weeklyLimit}`], ["Guaranteed result", "No"]]}
      />
      <Button
        label={s.alwaysAsk ? `Approve £${s.adBudget}` : `Run within £${s.adBudget} cap`}
        primary
        disabled={overSingleLimit || (s.autopilotPaidBlockedByRule && !s.workGoalAttemptKeys?.has("free-audit"))}
        onPress={() => {
          s.recordWorkGoalAttempt({
            key: "paid",
            type: "paid",
            label: `Paid test • up to £${s.adBudget}`,
            cost: Number(s.adBudget) || 0,
          });
          s.go("paidRunning");
        }}
      />
      <Button label="Skip" onPress={() => s.jump("home", "Home")} />
      <SmallLink label="How this works" onPress={() => s.go("howAdsWork")} />
    </Shell>
  );
}

function HowAdsWork({ s }) {
  return (
    <Shell s={s} title="How this works" subtitle="You don’t need to learn advertising to use it.">
      <Card
        eyebrow="Under the hood"
        title="We handle the marketing setup"
        body="The app chooses the most sensible local channel, prepares the advert and works inside the limit you approved. You see spend, genuine enquiries and jobs — not marketing jargon."
        footer="You can reveal advanced details later if you want"
      />
      <Button label="Got it" primary onPress={s.back} />
    </Shell>
  );
}

function PaidRunning({ s }) {
  return (
    <Shell s={s} title="Paid test approved" subtitle="Prototype only — no advert has actually been launched and no spend or enquiries are being invented.">
      <Card
        eyebrow="Approved limit"
        title={`Up to £${s.adBudget} authorised`}
        body="BUSY has recorded that this route was approved for the active work goal. A live version would now read real platform spend and genuine enquiries before deciding what to do next."
        footer="Recorded live spend: £0 in this prototype"
        tone="blue"
      />
      <Button label="Back to the work goal" primary onPress={() => s.go("bestMove")} />
      <Button label="Home" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function MoreWorkGoal({ s }) {
  const options = ["More work next week", "More work this month", "Promote a specific service", "Just find me the best opportunity"];
  return (
    <Shell s={s} title="What do you want?" subtitle="Choose the business goal. The plan underneath changes with it.">
      {options.map((x) => (
        <Choice key={x} label={x} selected={s.moreWorkGoal === x} onPress={() => s.setMoreWorkGoal(x)} />
      ))}
      {s.moreWorkGoal === "Promote a specific service" ? (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.fieldLabel}>Which service?</Text>
          {s.services.map((service) => (
            <Choice
              key={service.id}
              label={service.name}
              sub={`Usually about £${service.value}`}
              selected={s.selectedServiceId === service.id}
              onPress={() => s.setSelectedServiceId(service.id)}
            />
          ))}
        </View>
      ) : null}
      <Button label="Build my plan" primary onPress={() => s.go("workPlan")} />
    </Shell>
  );
}

function WorkPlan({ s }) {
  const service = s.selectedService?.name || "your chosen service";
  let plan;
  if (s.moreWorkGoal === "More work this month") {
    plan = {
      title: "Build a steadier month",
      subtitle: "Start with free improvements, then people who already know the business.",
      steps: [
        ["Step 1", "Fix the free profile gaps", "Improve what customers already see.", "Cost: £0"],
        ["Step 2", "Contact previous customers", "Only if more work is still needed.", "Advertising spend: £0"],
        ["Step 3", "Use a capped local test", "Only after cheaper options are used.", `Maximum test: £${s.testLimit}`],
      ],
      action: () => s.go("profileAudit"),
      label: "Start with the free fixes",
    };
  } else if (s.moreWorkGoal === "Promote a specific service") {
    plan = {
      title: `Find more ${service.toLowerCase()} work`,
      subtitle: "Use existing customer relationships and free profile coverage before paid reach.",
      steps: [
        ["Step 1", `Make ${service} clear everywhere`, "Check the profile and service wording.", "Cost: £0"],
        ["Step 2", "Try relevant previous customers", "Start with people who already know you.", "Advertising spend: £0"],
        ["Step 3", "Test paid local reach", "Only if more demand is still needed.", `Maximum test: £${s.testLimit}`],
      ],
      action: () => s.go("profileAudit"),
      label: "Start with the free check",
    };
  } else if (s.moreWorkGoal === "Just find me the best opportunity") {
    plan = {
      title: "Best opportunity right now",
      subtitle: "BUSY DOES IT chooses the strongest low-cost move from the demo data.",
      steps: [
        ["Best now", `Review ${s.eligibleCustomers.length} eligible previous customer${s.eligibleCustomers.length === 1 ? "" : "s"}`, "Use the current service-specific timing rules rather than a blanket repeat interval.", "Advertising spend: £0"],
        ["Next", "Follow up old enquiries", "Only if more work is still needed.", "Advertising spend: £0"],
        ["Later", "Consider a paid test", "Only after the cheaper steps.", `Maximum test: £${s.testLimit}`],
      ],
      action: () => s.go("bestMove"),
      label: "Show me the best move",
    };
  } else {
    plan = {
      title: "Get more work next week",
      subtitle: "Use warm leads first, one approved step at a time.",
      steps: [
        ["Step 1", "Contact previous customers", "Fastest low-cost audience to try first.", "Advertising spend: £0"],
        ["Step 2", "Follow up old enquiries", "Only if next week still has gaps.", "Advertising spend: £0"],
        ["Step 3", "Try a small local advert", "Only if cheaper options still haven’t done the job.", `Maximum paid test: £${s.testLimit}`],
      ],
      action: () => s.go("bestMove"),
      label: "Start step 1",
    };
  }

  return (
    <Shell s={s} title={plan.title} subtitle={plan.subtitle}>
      {plan.steps.map(([eyebrow, title, body, footer]) => (
        <Card key={eyebrow + title} eyebrow={eyebrow} title={title} body={body} footer={footer} tone={eyebrow === "Step 3" || eyebrow === "Later" ? "amber" : "blue"} />
      ))}
      <Button label={plan.label} primary onPress={plan.action} />
      <Button label="Change goal" onPress={s.back} />
    </Shell>
  );
}




export {
  WorkHub,
  WorkCalendar,
  WorkPipeline,
  WorkNow,
  ChooseGap,
  BestMove,
  WhyBestMove,
  ExpertBestMove,
  ProfileAudit,
  ProfileAuditPlan,
  ProfileAuditWhy,
  ExpertProfileAudit,
  OtherOptions,
  CheckSend,
  Progress,
  Replies,
  CustomerActivity,
  Bookings,
  ReplyActions,
  ReplyActionDetail,
  PaidTest,
  HowAdsWork,
  PaidRunning,
  MoreWorkGoal,
  WorkPlan
};
