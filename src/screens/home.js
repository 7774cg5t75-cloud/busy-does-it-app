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


function HomeScreen({ s }) {
  const [showOtherMoves, setShowOtherMoves] = useState(false);
  const serviceName = s.selectedService?.name || s.services.find((x) => x.wanted)?.name || s.trade || "your priority service";
  const customerCount = s.customers.length;
  const eligibleCount = s.eligibleCustomers.length;
  const reactivationEligibleCount = s.reactivationEligibleCustomers?.length || 0;
  const todayISO = dateToISO(new Date());
  const hasPublishingConnection = !!s.connectedAccounts.meta || !!s.connectedAccounts.googleBusiness;
  const postLearningAdjustment =
    s.businessBrainAdjustments?.social ?? s.postEvidence?.scoreAdjustment ?? 0;
  const reactivationLearningBoost =
    s.businessBrainAdjustments?.reactivation ?? s.reactivationEvidence?.scoreAdjustment ?? 0;
  const quoteFollowUpLearningBoost =
    s.businessBrainAdjustments?.quoteFollowUp ?? s.quoteFollowUpEvidence?.scoreAdjustment ?? 0;
  const reviewLearningBoost =
    s.businessBrainAdjustments?.reviews ?? 0;
  const enquiryLearningBoost =
    s.businessBrainAdjustments?.enquiryFollowUp ?? s.enquiryFollowUpEvidence?.scoreAdjustment ?? 0;

  const nextEnquiryEntry = s.freshEnquiryEntries?.[0] || null;
  const nextEnquiry = nextEnquiryEntry?.customer || null;
  const staleEnquiryEntry = s.staleEnquiryEntries?.[0] || null;

  const overdueBookings = Object.entries(s.replyActions || {})
    .map(([id, action]) => {
      if (
        !action?.done ||
        action.type !== "booking" ||
        !action.details?.bookingDate ||
        ["Cancelled", "Completed"].includes(action.details?.bookingStatus || "Confirmed") ||
        action.details.bookingDate >= todayISO
      ) return null;
      const customer =
        s.customers.find((item) => item.id === id) ||
        s.lastSimulatedRecipients.find((item) => item.id === id);
      return customer ? { id, action, customer } : null;
    })
    .filter(Boolean)
    .sort((a, b) => String(a.action.details.bookingDate).localeCompare(String(b.action.details.bookingDate)));

  const operationalMoves = [];

  if (s.activeWorkGoal && s.workGoalFilled) {
    operationalMoves.push({
      id: "work-goal-reached",
      score: 140,
      eyebrow: "Goal reached",
      title: `${s.activeWorkGoal.label} is covered`,
      body: `${s.workGoalBookedCount} confirmed booking${s.workGoalBookedCount === 1 ? "" : "s"} now match this work goal. BUSY DOES IT should stop promoting the gap instead of manufacturing more activity.`,
      footer: s.workGoalBookedValue ? `Recorded booked value: £${s.workGoalBookedValue}` : "No more promotion needed for this goal",
      status: "Stop",
      tone: "green",
      why: "The capacity target has been reached from the bookings saved in the prototype. Continuing to contact people or spend money for the same gap would work against the owner’s stated goal.",
      evidence: [
        ["Work goal", s.activeWorkGoal.label],
        ["Target bookings", String(s.workGoalTargetJobs)],
        ["Matching confirmed bookings", String(s.workGoalBookedCount)],
        ["Recorded booked value", s.workGoalBookedValue ? `£${s.workGoalBookedValue}` : "Not recorded"],
        ["Recommended extra spend", "£0"],
      ],
      actionLabel: "Close this goal",
      onAction: s.clearWorkGoal,
      canIgnore: false,
    });
  }

  if (overdueBookings.length) {
    const item = overdueBookings[0];
    const value = Number(item.action.details?.jobValue) || Number(item.action.details?.sourceQuoteAmount) || 0;
    operationalMoves.push({
      id: `overdue-booking-${item.id}`,
      score: 110 + Math.min(8, value / 250),
      eyebrow: "Past booking needs an outcome",
      title: `${item.customer.name} needs closing out`,
      body: `${item.customer.service} was booked for ${formatUKDate(item.action.details.bookingDate)}. Complete, move or cancel it before creating more work.`,
      footer: "Cost: £0",
      status: "Do this first",
      tone: "amber",
      why: "BUSY DOES IT protects live customer work before suggesting marketing. This is already booked work, so leaving it unresolved can make the diary and pipeline misleading.",
      evidence: [
        ["Urgency", "Past booked date"],
        ["Customer intent", "Already booked"],
        ["Recorded value", value ? `£${value}` : "Not recorded"],
        ["Advertising required", "£0"],
      ],
      actionLabel: "Open booking",
      onAction: () => s.openSavedReplyAction(item.id),
      canIgnore: false,
    });
  }

  if (s.miniAppsView?.unreadRequests?.length) {
    const request = s.miniAppsView.unreadRequests[0];
    const unread = Number(request.business_unread_count || 0);
    operationalMoves.push({
      id: `mini-app-unread-${request.id}`,
      score: 112 + Math.min(8, unread),
      eyebrow: "BUSY Apps conversation",
      title: `${request.contact_name || "A customer"} replied through BUSY Apps`,
      body: request.request_type === "booking_request"
        ? [
            request.service_name || request.payload?.service || "Booking request",
            `${unread} unread update${unread === 1 ? "" : "s"}`,
          ].join(" • ")
        : `${unread} unread customer update${unread === 1 ? "" : "s"} on this enquiry.`,
      footer: "Live customer conversation",
      status: "Reply needed",
      tone: "amber",
      why: "This is new activity from a real customer inside BUSY Apps, so BUSY ranks it ahead of optional marketing work.",
      evidence: [
        ["Source", "BUSY Apps"],
        ["Unread updates", String(unread)],
        ["Request status", String(request.status || "received").replaceAll("_", " ")],
      ],
      actionLabel: "Open conversation",
      onAction: () => s.openOwnerMiniAppRequest(request.id),
      canIgnore: false,
    });
  }

  if (s.miniAppsView?.unlinkedPendingRequests?.length) {
    const request = s.miniAppsView.unlinkedPendingRequests[0];
    const booking = request.request_type === "booking_request";
    operationalMoves.push({
      id: `mini-app-request-${request.id}`,
      score: booking ? 108 : 102,
      eyebrow: "BUSY Mini App",
      title: booking
        ? `${request.contact_name || "A customer"} sent a booking request`
        : `${request.contact_name || "A customer"} sent an enquiry`,
      body: booking
        ? [
            request.service_name || request.payload?.service || "Service not stated",
            request.preferred_date_text || request.payload?.preferredDate || "Date/time still to agree",
          ].join(" • ")
        : request.payload?.message || "New Mini App enquiry waiting for review.",
      footer: "Not linked to a BUSY customer yet",
      status: "Review",
      tone: "amber",
      why: "This came through a live BUSY Mini App but has not yet been linked into the business customer journey. BUSY keeps it separate until the owner reviews it so an incoming request cannot silently create or confirm work.",
      evidence: [
        ["Source", "BUSY Mini App"],
        ["Request type", booking ? "Booking request" : "Enquiry"],
        ["Customer", request.contact_name || "Not recorded"],
        ["Contact", request.contact_phone || request.contact_email || "Not recorded"],
        ["BUSY customer link", "Not linked yet"],
      ],
      actionLabel: "Review request",
      onAction: s.openMiniAppBuilder,
      canIgnore: false,
    });
  }

  if (s.inboxTopItem) {
    const item = s.inboxTopItem;
    const parsed = item.parsed || {};
    const triage = item.triage || {};
    const score =
      parsed.stage === "Booking"
        ? 109
        : parsed.stage === "Quote sent"
        ? 105
        : parsed.stage === "Enquiry"
        ? 103
        : triage.lane === "Needs attention"
        ? 96
        : 84;
    operationalMoves.push({
      id: `inbox-${item.id}`,
      score,
      eyebrow: "BUSY Inbox",
      title:
        triage.lane === "Needs attention"
          ? `Incoming ${String(parsed.stage || "item").toLowerCase()} needs a quick check`
          : `Incoming ${String(parsed.stage || "item").toLowerCase()} is ready to review`,
      body: `${parsed.name || "Customer not identified"} • ${parsed.service || "service not detected"} • ${triage.reason || "Ready for review"}.`,
      footer: "Nothing filed yet",
      status: triage.lane === "Needs attention" ? "Check" : "Incoming",
      tone: triage.lane === "Needs attention" ? "amber" : "green",
      why: "This information has arrived but is not yet part of the business records. BUSY triaged it first so uncertain or potentially conflicting information can be checked before it changes the pipeline.",
      evidence: [
        ["Source", item.source || "Incoming"],
        ["Detected stage", parsed.stage || "Unknown"],
        ["Extraction confidence", parsed.confidence || "Low"],
        ["Triage", triage.lane || "Needs review"],
        ["Possible existing customer", triage.matchCustomerId ? "Yes" : "No"],
      ],
      actionLabel: "Review Inbox item",
      onAction: () => s.openInboxItem(item.id),
      canIgnore: false,
    });
  }

  if (nextEnquiry) {
    const waitDays = nextEnquiryEntry?.age || 0;
    operationalMoves.push({
      id: `new-enquiry-${nextEnquiry.id}`,
      score: 104 + Math.min(10, waitDays),
      eyebrow: "Unanswered enquiry",
      title: `Reply to ${nextEnquiry.name}`,
      body: `${nextEnquiry.service}${nextEnquiry.address ? ` • ${nextEnquiry.address}` : ""} • ${enquiryAgeLabel(nextEnquiry.createdAt)}.`,
      footer: "Cost: £0",
      status: "Customer waiting",
      tone: "green",
      why: "A real customer is already asking about work. Existing demand normally deserves attention before activity designed to create new demand.",
      evidence: [
        ["Customer intent", "Direct enquiry"],
        ["Waiting", enquiryAgeLabel(nextEnquiry.createdAt)],
        ["Service", nextEnquiry.service],
        ["Advertising required", "£0"],
      ],
      actionLabel: "Open enquiry",
      onAction: () => s.openCustomer(nextEnquiry.id),
      canIgnore: false,
    });
  }

  if (staleEnquiryEntry) {
    const item = staleEnquiryEntry;
    operationalMoves.push({
      id: `quiet-enquiry-${item.customer.id}`,
      score: 98 + Math.min(8, item.age / 3) + enquiryLearningBoost,
      eyebrow: "Quiet enquiry",
      title: `${item.customer.name} asked ${item.age} days ago`,
      body: `There is still no quote, booking or follow-up saved for ${item.customer.service.toLowerCase()}. BUSY DOES IT can prepare a polite check-in from the real enquiry record.`,
      footer: "Cost: £0",
      status: "Worth revisiting",
      tone: "green",
      why: "This person already contacted the business but the enquiry has had no recorded next action for at least 7 days. That existing intent is usually worth checking before buying new attention.",
      evidence: [
        ["Customer", item.customer.name],
        ["Service", item.customer.service],
        ["Days since enquiry", String(item.age)],
        ["Previous quiet-enquiry outcomes", String(s.enquiryFollowUpOutcomeCount)],
        ["Still interested after follow-up", String(s.enquiryFollowUpInterestedCount)],
        ["Advertising required", "£0"],
      ],
      actionLabel: "Review prepared follow-up",
      onAction: () => s.prepareEnquiryFollowUp(item.customer.id),
      canIgnore: false,
    });
  }

  if (s.dueReminderEntries.length) {
    const item = s.dueReminderEntries[0];
    operationalMoves.push({
      id: `due-reminder-${item.id}`,
      score: 100,
      eyebrow: "Follow-up due",
      title: `Follow up ${item.customer.name}`,
      body: `${item.customer.service} follow-up is due ${formatUKDate(item.action.details.reminderDate)}.`,
      footer: "Cost: £0",
      status: "Action needed",
      tone: "amber",
      why: "This customer already has a promised follow-up. Keeping that commitment is lower risk than starting a fresh campaign.",
      evidence: [
        ["Customer intent", "Existing conversation"],
        ["Follow-up date", formatUKDate(item.action.details.reminderDate)],
        ["Service", item.customer.service],
        ["Advertising required", "£0"],
      ],
      actionLabel: "Open follow-up",
      onAction: () => s.openSavedReplyAction(item.id),
      canIgnore: false,
    });
  }

  if (s.dueQuoteEntries.length) {
    const item = s.dueQuoteEntries[0];
    const quoteValue = Number(item.action.details?.quoteAmount) || 0;
    operationalMoves.push({
      id: `stale-quote-${item.id}`,
      score: 95 + Math.min(8, item.age / 2) + Math.min(6, quoteValue / 250) + quoteFollowUpLearningBoost,
      eyebrow: "Quote follow-up",
      title: `A quote has been quiet for ${item.age} days`,
      body: `${item.customer.name} already asked about ${item.customer.service.toLowerCase()}. BUSY DOES IT has enough information to prepare a polite follow-up for review.`,
      footer: "Cost: £0",
      status: "Worth following up",
      tone: "green",
      why: "This customer reached the quote stage, which is stronger intent than a cold audience. Age, recorded value and zero ad cost all push it up the queue.",
      evidence: [
        ["Customer intent", "Quote already sent"],
        ["Waiting", `${item.age} days`],
        ["Quote value", quoteValue ? `£${quoteValue}` : "Not recorded"],
        ["Previous follow-up outcomes", String(s.quoteFollowUpOutcomeCount)],
        ["Previous accepted after follow-up", String(s.quoteFollowUpAcceptedCount)],
        ["Advertising required", "£0"],
      ],
      actionLabel: "Review prepared follow-up",
      onAction: () => s.prepareQuoteFollowUp(item.id),
      canIgnore: false,
    });
  }

  if (
    s.pendingReplyActionCount &&
    !overdueBookings.length &&
    !nextEnquiry &&
    !s.dueReminderEntries.length &&
    !s.dueQuoteEntries.length
  ) {
    operationalMoves.push({
      id: "pending-customer-actions",
      score: 88,
      eyebrow: "Customer work",
      title: `${s.pendingReplyActionCount} customer action${s.pendingReplyActionCount === 1 ? " needs" : "s need"} finishing`,
      body: "There is unfinished quote, booking or follow-up work already saved in the prototype.",
      footer: "Cost: £0",
      status: "Finish what is open",
      tone: "green",
      why: "Existing customer work is already closer to becoming booked or completed work than a new marketing action.",
      evidence: [
        ["Pending customer actions", String(s.pendingReplyActionCount)],
        ["Customer intent", "Existing"],
        ["Advertising required", "£0"],
      ],
      actionLabel: "Review actions",
      onAction: () => s.go("customerActivity"),
      canIgnore: false,
    });
  }

  const marketingMoves = [
    ...(s.postJobBundleOpportunity
      ? [{
          id: `job-photo-review-bundle-${s.postJobBundleOpportunity.jobId}`,
          brainService: s.postJobBundleOpportunity.service,
          score:
            82 +
            Math.round((postLearningAdjustment + reviewLearningBoost) / 2),
          eyebrow: "Use a completed job",
          title: "Turn one finished job into three useful next steps",
          body: `${s.postJobBundleOpportunity.customerName}’s ${s.postJobBundleOpportunity.service.toLowerCase()} job can feed a review request, a finished-job post and the next repeat-service timing without re-entering the same information.`,
          footer: "BUSY prepares underneath • customer/public actions still need approval",
          status: "3-way follow-on",
          tone: "green",
          why: "One completed job already contains useful evidence. Reusing the same job record for a review request, social proof and repeat timing reduces admin while keeping each external action under owner approval.",
          evidence: [
            ["Completed job", s.postJobBundleOpportunity.service],
            ["Recorded job value", s.postJobBundleOpportunity.value ? `£${s.postJobBundleOpportunity.value}` : "Not recorded"],
            ["Review request", s.postJobBundleOpportunity.reviewPending ? "Ready to prepare/review" : "Already handled"],
            ["Approved job photos", String(s.postJobBundleOpportunity.approvedPhotoCount || 0)],
            ["Finished-job post", s.postJobBundleOpportunity.socialPending ? "Ready to prepare/review" : "Already handled"],
            ["Repeat timing", s.postJobBundleOpportunity.repeatDueDate ? formatUKDate(s.postJobBundleOpportunity.repeatDueDate) : "Not available"],
          ],
          actionLabel: "Review the 3-step bundle",
          onAction: () => s.openPostJobBundle(
            s.postJobBundleOpportunity.customerId,
            s.postJobBundleOpportunity.jobId
          ),
          canIgnore: true,
        }]
      : []),
    ...(s.preparedPostOpportunity &&
        s.preparedPostOpportunity.jobId !== s.postJobBundleOpportunity?.jobId
      ? [{
          id: `prepared-post-${s.preparedPostOpportunity.jobId}`,
          brainService: s.preparedPostOpportunity.service,
          score: (hasPublishingConnection ? 78 : 58) + postLearningAdjustment,
          eyebrow: "Prepared action ready",
          title: "A finished-job post is ready for approval",
          body: `${s.preparedPostOpportunity.customerName}’s ${s.preparedPostOpportunity.service.toLowerCase()} job already has approved photos and editable wording prepared.`,
          footer: "Cost: £0 • owner approval required",
          status: hasPublishingConnection ? "Ready to approve" : "Needs connection",
          tone: hasPublishingConnection ? "green" : "blue",
          why: hasPublishingConnection
            ? "The work is already prepared and costs nothing to review, so there is very little friction left before the owner can approve it."
            : "The content is prepared, but BUSY DOES IT should not pretend it can publish anywhere until the owner has deliberately connected a destination.",
          evidence: [
            ["Prepared photos", String(s.preparedPostOpportunity.photoCount)],
            ["Draft wording", "Ready"],
            ["Previous post outcomes recorded", String(s.postOutcomeRecordedCount)],
            ["Previous post bookings recorded", String(s.postBookingOutcomeCount)],
            ["Connected destination", hasPublishingConnection ? "Available" : "Not yet"],
            ["Advertising required", "£0"],
          ],
          actionLabel: "Review approval",
          onAction: () => s.openJobPostApproval(s.preparedPostOpportunity.customerId, s.preparedPostOpportunity.jobId),
          canIgnore: true,
        }]
      : []),
    ...(s.photoOpportunity &&
        s.photoOpportunity.jobId !== s.postJobBundleOpportunity?.jobId
      ? [{
          id: `job-photo-${s.photoOpportunity.jobId}`,
          brainService: s.photoOpportunity.service,
          score: 68 + postLearningAdjustment,
          eyebrow: "Free content opportunity",
          title: `Use ${s.photoOpportunity.photoCount} approved job photo${s.photoOpportunity.photoCount === 1 ? "" : "s"}`,
          body: `${s.photoOpportunity.customerName}’s ${s.photoOpportunity.service.toLowerCase()} job is already saved. BUSY DOES IT can prepare the words and approval step for you.`,
          footer: "Cost: £0 • nothing posts without approval",
          status: "Free",
          tone: "green",
          why: "This reuses real proof the owner deliberately supplied. It costs nothing and BUSY DOES IT can prepare most of the action underneath.",
          evidence: [
            ["Approved job photos", String(s.photoOpportunity.photoCount)],
            ["Source", "Completed customer job"],
            ["Previous post outcomes recorded", String(s.postOutcomeRecordedCount)],
            ["Previous post bookings recorded", String(s.postBookingOutcomeCount)],
            ["Owner approval", "Still required"],
            ["Advertising required", "£0"],
          ],
          actionLabel: "Prepare post",
          onAction: () => s.openJobPhotoOpportunity(s.photoOpportunity.customerId, s.photoOpportunity.jobId),
          canIgnore: true,
        }]
      : []),
    ...(s.quietSlotConfirmed && !s.workGoalFilled && s.quietSlot && reactivationEligibleCount > 0
      ? [{
          id: "quiet-slot",
          brainService: s.workGoalPlanningService?.name || "",
          score: 60 + Math.min(10, reactivationEligibleCount) + reactivationLearningBoost,
          eyebrow: "Spare capacity",
          title: `${s.quietSlot} is free`,
          body:
            s.recommendedReactivationBatchSize >= reactivationEligibleCount
              ? `${reactivationEligibleCount} ${s.workGoalPlanningService?.name || "service-matched"} previous customer${reactivationEligibleCount === 1 ? "" : "s"} are eligible. That is the whole relevant pool, so BUSY would use all of them rather than pretending a larger audience exists.`
              : `${reactivationEligibleCount} service-matched previous customers are eligible. Based on the recorded evidence and the ${s.workGoalRemainingJobs} booking${s.workGoalRemainingJobs === 1 ? "" : "s"} still needed, BUSY would start with ${s.recommendedReactivationBatchSize}.`,
          footer: "Recommended first move: £0 advertising spend",
          status: "Worth trying",
          tone: "green",
          why: `This can target existing customers at zero ad spend. The engine also considers how many suitable records exist and whether the timing rule fits the service. Current rule: ${s.eligibilityRule}`,
          evidence: [
            ["Service-matched eligible customers", String(reactivationEligibleCount)],
            ["Recommended first batch", String(s.recommendedReactivationBatchSize)],
            ["Evidence basis", s.reactivationEvidence?.basis || "Cautious fallback"],
            ["Recorded sample", String(s.reactivationEvidence?.sample || 0)],
            ["Observed bookings", String(s.reactivationEvidence?.successes || 0)],
            ["Planning conversion rate", formatPercent(s.reactivationEvidence?.rate)],
            ["Confidence", s.reactivationEvidence?.confidence || "No evidence yet"],
            ["Advertising required", "£0"],
          ],
          actionLabel: "Review targeted messages",
          onAction: () => s.startCampaign(0, s.recommendedReactivationBatchSize),
          canIgnore: true,
        }]
      : []),
    ...(s.reviewRequestOpportunity &&
        s.reviewRequestOpportunity.jobId !== s.postJobBundleOpportunity?.jobId
      ? [{
          id: `review-request-${s.reviewRequestOpportunity.jobId}`,
          brainService: s.reviewRequestOpportunity.service,
          score: 62 + reviewLearningBoost,
          eyebrow: "Post-job opportunity",
          title: `Ask ${s.reviewRequestOpportunity.customerName} for a review`,
          body: `${s.reviewRequestOpportunity.service} is completed. BUSY DOES IT can prepare a short, low-pressure review request using the saved customer and job details.`,
          footer: "Cost: £0 • owner approval required",
          status: "Prepared on open",
          tone: "green",
          why: "The job is already complete and the customer can be contacted. A genuine review request costs nothing, so it can be worth doing before paid promotion.",
          evidence: [
            ["Completed job", s.reviewRequestOpportunity.service],
            ["Recorded job value", s.reviewRequestOpportunity.value ? `£${s.reviewRequestOpportunity.value}` : "Not recorded"],
            ["Previous review-request outcomes", String(s.reviewRequestOutcomeCount)],
            ["Reviews recorded as left", String(s.reviewReceivedCount)],
            ["Advertising required", "£0"],
          ],
          actionLabel: "Review prepared request",
          onAction: () => s.prepareReviewRequest(s.reviewRequestOpportunity.customerId, s.reviewRequestOpportunity.jobId),
          canIgnore: true,
        }]
      : []),
    ...(s.quoteFollowUpOutcomeOpportunity
      ? [{
          id: `quote-followup-outcome-${s.quoteFollowUpOutcomeOpportunity.customerId}`,
          score: 43,
          eyebrow: "Learning",
          title: `What happened with ${s.quoteFollowUpOutcomeOpportunity.customerName}?`,
          body: `A prepared quote follow-up was approved. Recording the outcome helps BUSY DOES IT judge future quote follow-ups more accurately.`,
          footer: "Takes one quick update",
          status: "Learn",
          tone: "blue",
          why: "This improves the evidence behind future recommendations, but it should not outrank a waiting customer or a live booking.",
          evidence: [
            ["Quote value", s.quoteFollowUpOutcomeOpportunity.quoteAmount ? `£${s.quoteFollowUpOutcomeOpportunity.quoteAmount}` : "Not recorded"],
            ["Current outcome", "Not recorded"],
            ["What we learn from", "Accepted, declined or still considering"],
          ],
          actionLabel: "Record outcome",
          onAction: () => s.openQuoteFollowUpOutcome(s.quoteFollowUpOutcomeOpportunity.customerId),
          canIgnore: true,
        }]
      : []),
    ...(s.reviewOutcomeOpportunity
      ? [{
          id: `review-outcome-${s.reviewOutcomeOpportunity.jobId}`,
          score: 38,
          eyebrow: "Learning",
          title: `Did ${s.reviewOutcomeOpportunity.customerName} leave a review?`,
          body: "The review request was approved earlier. One quick outcome update helps the engine learn whether this free action is worthwhile.",
          footer: "No vanity metrics needed",
          status: "Learn",
          tone: "blue",
          why: "This is useful evidence but less urgent than work already in the pipeline.",
          evidence: [
            ["Service", s.reviewOutcomeOpportunity.service],
            ["Current outcome", "Not recorded"],
            ["What we learn from", "Review left or no response"],
          ],
          actionLabel: "Record outcome",
          onAction: () => s.openReviewRequestOutcome(s.reviewOutcomeOpportunity.customerId, s.reviewOutcomeOpportunity.jobId),
          canIgnore: true,
        }]
      : []),
    ...(s.enquiryFollowUpOutcomeOpportunity
      ? [{
          id: `enquiry-followup-outcome-${s.enquiryFollowUpOutcomeOpportunity.customerId}`,
          brainService: s.enquiryFollowUpOutcomeOpportunity.service,
          score: 42,
          eyebrow: "Learning",
          title: `What happened with ${s.enquiryFollowUpOutcomeOpportunity.customerName}?`,
          body: `A quiet-enquiry follow-up was approved for ${s.enquiryFollowUpOutcomeOpportunity.service.toLowerCase()}. Recording the outcome improves future ranking.`,
          footer: "Takes one quick update",
          status: "Learn",
          tone: "blue",
          why: "This evidence matters, but it should not outrank a waiting customer or an opportunity that can create work now.",
          evidence: [
            ["Current outcome", "Not recorded"],
            ["What we learn from", "Still interested or not interested"],
            ["Source", "Actual saved enquiry record"],
          ],
          actionLabel: "Record outcome",
          onAction: () => s.openEnquiryFollowUpOutcome(s.enquiryFollowUpOutcomeOpportunity.customerId),
          canIgnore: true,
        }]
      : []),
    ...(s.postOutcomeOpportunity
      ? [{
          id: `post-outcome-${s.postOutcomeOpportunity.jobId}`,
          brainService: s.postOutcomeOpportunity.service,
          score: 40,
          eyebrow: "Learning",
          title: "Record what happened after the finished-job post",
          body: `${s.postOutcomeOpportunity.service} was approved for ${s.postOutcomeOpportunity.channels.join(", ") || "a selected profile"}. Recording the business outcome improves future recommendations.`,
          footer: "Takes one quick update",
          status: "Learn",
          tone: "blue",
          why: "This is useful evidence, but it should not outrank a waiting customer or an action that could create work now.",
          evidence: [
            ["Outcome currently", "Not recorded"],
            ["Channels", s.postOutcomeOpportunity.channels.join(", ") || "Not recorded"],
            ["What we learn from", "Enquiries, quotes and bookings"],
            ["Vanity metrics required", "No"],
          ],
          actionLabel: "Record outcome",
          onAction: () => s.openJobPostOutcome(s.postOutcomeOpportunity.customerId, s.postOutcomeOpportunity.jobId),
          canIgnore: true,
        }]
      : []),
  ]
    .map((item) => s.brainTuneOpportunity(item))
    .filter(
      (item) =>
        !item.brainBlocked &&
        !s.dismissedOpportunities.includes(item.id)
    );

  const rankedMoves = [...operationalMoves, ...marketingMoves]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .map((item, index) => {
      const evidenceRows = Object.fromEntries(
        (Array.isArray(item.evidence) ? item.evidence : []).filter(
          (row) => Array.isArray(row) && row.length >= 2
        )
      );
      const directValue =
        evidenceRows["Quote value"] ||
        evidenceRows["Recorded value"] ||
        evidenceRows["Recorded job value"] ||
        "";
      const serviceLabel =
        evidenceRows.Service ||
        item.brainService ||
        "";
      const service =
        s.services.find((candidate) => candidate.name === serviceLabel) ||
        null;
      let estimatedValue = directValue && directValue !== "Not recorded"
        ? `Known ${directValue}`
        : service?.value
        ? `Potential job ~£${Number(service.value)}`
        : "Indirect / not yet quantified";

      const opportunityFamily = item.brainFamily || businessBrainOpportunityFamily(item.id);
      if (item.id === "quiet-slot" && s.workGoalRemainingJobs && s.workGoalPlanningService?.value) {
        estimatedValue = `Capacity goal up to £${Math.round(
          Number(s.workGoalRemainingJobs) * Number(s.workGoalPlanningService.value)
        )}`;
      } else if (/learning|outcome/.test(String(item.eyebrow || "").toLowerCase())) {
        estimatedValue = "Learning value";
      } else if (item.id === "work-goal-reached") {
        estimatedValue = "Protects capacity / spend";
      } else if (String(item.id || "").startsWith("job-photo-review-bundle-")) {
        estimatedValue = "Reuses completed work";
      } else if (opportunityFamily === "reviews") {
        estimatedValue = "Trust / reputation value";
      } else if (opportunityFamily === "social") {
        estimatedValue = "Organic reach / proof";
      }

      const pattern = item.brainFamily
        ? s.businessBrainPatterns?.find(
            (candidate) => candidate.family === item.brainFamily
          )
        : null;
      const decisionConfidence =
        item.canIgnore === false
          ? "High — live business record"
          : pattern?.evidence?.evidenceReady
          ? `${pattern.evidence.confidence || "Evidence-backed"}`
          : pattern?.evidence?.sample
          ? "Early business evidence"
          : "Cautious";

      return {
        ...item,
        rank: index + 1,
        estimatedValue,
        decisionConfidence,
      };
    });
  const topMoves = rankedMoves.slice(0, 3);
  const bestMove = topMoves[0] || null;
  const nextBestMoves = topMoves.slice(1);
  const otherMoves = rankedMoves.slice(3);

  const homeWeekEndISO = addDaysFromISO(todayISO, 6);
  const homeWeekBookings = Object.entries(s.replyActions || {})
    .map(([id, action]) => {
      if (
        action?.type !== "booking" ||
        !action?.done ||
        !action.details?.bookingDate ||
        (action.details?.bookingStatus || "Confirmed") !== "Confirmed" ||
        action.details.bookingDate < todayISO ||
        action.details.bookingDate > homeWeekEndISO
      ) return null;
      return { id, action };
    })
    .filter(Boolean);
  const homeWeekBookedValue = homeWeekBookings.reduce(
    (total, item) =>
      total +
      (Number(item.action.details?.jobValue) ||
        Number(item.action.details?.sourceQuoteAmount) ||
        0),
    0
  );
  const nextHomeBooking = homeWeekBookings
    .filter((item) => item.action.details.bookingDate >= todayISO)
    .sort((a, b) =>
      `${a.action.details.bookingDate}T${a.action.details.bookingTime || "00:00"}`.localeCompare(
        `${b.action.details.bookingDate}T${b.action.details.bookingTime || "00:00"}`
      )
    )[0] || null;
  const currentHomeBriefSnapshot = {
    weekBookings: homeWeekBookings.length,
    weekBookedValue: homeWeekBookedValue,
    freshEnquiries: s.freshEnquiryEntries?.length || 0,
    dueQuotes: s.dueQuoteEntries?.length || 0,
    inboxAttention: s.inboxNeedsAttentionItems?.length || 0,
    workGoalRemaining:
      s.activeWorkGoal && !s.workGoalFilled ? Number(s.workGoalRemainingJobs || 0) : 0,
    workGoalFilled: !!s.workGoalFilled,
  };
  const [homeBrief, setHomeBrief] = useState({
    loaded: false,
    hasPrevious: false,
    change: "",
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const key = "@busy-does-it-home-brief-v39";
      let previous = null;
      try {
        const raw = await AsyncStorage.getItem(key);
        previous = raw ? JSON.parse(raw) : null;
      } catch (e) {
        previous = null;
      }
      let change = "";
      if (previous) {
        if (previous.inboxAttention !== currentHomeBriefSnapshot.inboxAttention) {
          change = `BUSY Inbox attention changed from ${previous.inboxAttention || 0} to ${currentHomeBriefSnapshot.inboxAttention}.`;
        } else if (previous.freshEnquiries !== currentHomeBriefSnapshot.freshEnquiries) {
          const delta =
            currentHomeBriefSnapshot.freshEnquiries - Number(previous.freshEnquiries || 0);
          change =
            delta > 0
              ? `${delta} new live enquir${delta === 1 ? "y has" : "ies have"} appeared.`
              : "The live-enquiry queue has reduced.";
        } else if (previous.dueQuotes !== currentHomeBriefSnapshot.dueQuotes) {
          change = `Quote follow-ups due changed from ${previous.dueQuotes || 0} to ${currentHomeBriefSnapshot.dueQuotes}.`;
        } else if (previous.weekBookings !== currentHomeBriefSnapshot.weekBookings) {
          change = `Booked jobs this week changed from ${previous.weekBookings || 0} to ${currentHomeBriefSnapshot.weekBookings}.`;
        } else if (previous.weekBookedValue !== currentHomeBriefSnapshot.weekBookedValue) {
          change = `Booked value this week changed from £${previous.weekBookedValue || 0} to £${currentHomeBriefSnapshot.weekBookedValue}.`;
        } else if (!previous.workGoalFilled && currentHomeBriefSnapshot.workGoalFilled) {
          change = "The active work-filling goal is now covered.";
        } else if (
          Number(previous.workGoalRemaining || 0) !==
          currentHomeBriefSnapshot.workGoalRemaining
        ) {
          change = `The active work-goal gap is now ${currentHomeBriefSnapshot.workGoalRemaining} booking${currentHomeBriefSnapshot.workGoalRemaining === 1 ? "" : "s"}.`;
        }
      }
      if (active) {
        setHomeBrief({
          loaded: true,
          hasPrevious: !!previous,
          change,
        });
      }
      try {
        await AsyncStorage.setItem(
          key,
          JSON.stringify({
            ...currentHomeBriefSnapshot,
            checkedAt: new Date().toISOString(),
          })
        );
      } catch (e) {
        // Home briefing is context only; storage failure must not block the app.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const homeProactiveNotice =
    (s.proactiveNotices || []).find((notice) => {
      if (!String(notice.id || "").startsWith("completed-job-leverage-")) return true;
      const jobId = String(notice.id).replace("completed-job-leverage-", "");
      return !topMoves.some(
        (item) =>
          String(item.id || "") === `job-photo-review-bundle-${jobId}`
      );
    }) || null;

  return (
    <Shell
      s={s}
      noBack
      title={`${s.homeCommandCentre?.greeting || "Hello"}`}
      subtitle="Here’s what matters now. Everything else stays underneath until you need it."
      brandCue="One assistant. One priority. Full reasoning when you want it."
    >




      <Card
        eyebrow="V3.30 • Daily Command Centre"
        title={s.dailyCommandCentre?.headline || (bestMove ? bestMove.title : "Nothing urgent needs forcing")}
        body={
          s.dailyCommandCentre?.status === "Action needed"
            ? "BUSY has ranked the live business state into what needs doing now, what can wait until later today, and what is worth watching."
            : "BUSY has checked customer work, the diary, approvals, record health and current risks without manufacturing a task."
        }
        footer={
          s.dailyCommandCentre?.previousCheckpoint
            ? (s.dailyCommandCentre?.changes?.length || 0)
              ? `${s.dailyCommandCentre.changes.length} meaningful change${s.dailyCommandCentre.changes.length === 1 ? "" : "s"} since your last reviewed briefing`
              : "Nothing material has changed since your last reviewed briefing."
            : "Open the Daily Command Centre once to create a comparison baseline."
        }
        tone={s.dailyCommandCentre?.status === "Action needed" ? "amber" : "green"}
      >
        <MetricRow
          left="Confirmed next 7 days"
          right={`£${s.executiveBriefing?.confirmed7?.value || 0} • ${s.executiveBriefing?.confirmed7?.count || 0} booking${s.executiveBriefing?.confirmed7?.count === 1 ? "" : "s"}`}
          strong={(s.executiveBriefing?.confirmed7?.value || 0) > 0}
        />
        <MetricRow
          left="Do now"
          right={String(s.dailyCommandCentre?.doNow?.length || 0)}
          strong={(s.dailyCommandCentre?.doNow?.length || 0) > 0}
        />
        <MetricRow
          left="Later today"
          right={String(s.dailyCommandCentre?.laterToday?.length || 0)}
        />
        <MetricRow
          left="Watch"
          right={String(s.dailyCommandCentre?.watch?.length || 0)}
        />
        {(s.dailyCommandCentre?.doNow?.length || 0) ? (
          <Button
            label={s.dailyCommandCentre.doNow[0].actionLabel || "Handle top priority"}
            primary
            onPress={() => s.openDailyCommandItem(s.dailyCommandCentre.doNow[0])}
          />
        ) : (
          <Button
            label="Open Daily Command Centre"
            primary
            onPress={() => s.go("dailyCommandCentre")}
          />
        )}
        <Button
          label="See full daily picture"
          onPress={() => s.go("dailyCommandCentre")}
        />
        <Button label="Executive forward view" onPress={() => s.go("executiveBriefing")} />
      </Card>

      <Card
        eyebrow="Talk to BUSY"
        title="Tell BUSY what you want to do"
        body="Speak naturally. BUSY keeps the conversation in context and uses the same customer records, Business Memory, Executive Briefing and approval rules underneath."
        footer={
          s.busyCommandHistory?.length
            ? `Last request: ${s.busyCommandHistory[0].transcript}`
            : "Nothing is sent or published just because you spoke to BUSY"
        }
        tone="blue"
      >
        <View style={styles.talkHomeActions}>
          <Pressable
            onPress={() => s.openTalkToBusy(true)}
            style={({ pressed }) => [styles.talkMicButton, pressed && styles.pressed]}
          >
            <Text style={styles.talkMicIcon}>🎙</Text>
          </Pressable>
          <View style={styles.talkHomeCopy}>
            <Text style={styles.talkHomeTitle}>Tap and talk</Text>
            <Text style={styles.talkHomeBody}>
              “What should I do now?” • “Book John Friday at 2” • “Show me Tuesday”
            </Text>
          </View>
        </View>
        <Button label="Type to BUSY instead" onPress={() => s.openTalkToBusy(false)} />
      </Card>

      {(s.autopilotApprovalItems?.length ||
        s.autopilotNeedsInputItems?.length ||
        s.diaryConflicts?.length ||
        s.releaseCoreHealth?.issueCount) ? (
        <Card
          eyebrow="BUSY prepared / needs you"
          title={
            s.autopilotNeedsInputItems?.length || s.diaryConflicts?.length || s.releaseCoreHealth?.highCount
              ? "A few things need owner judgement"
              : "Prepared work is ready when you are"
          }
          body="The intelligence layers are still working underneath Home; they now surface here only when there is something useful to decide."
          tone={
            s.autopilotNeedsInputItems?.length || s.diaryConflicts?.length || s.releaseCoreHealth?.highCount
              ? "amber"
              : "green"
          }
        >
          <MetricRow left="Prepared approvals" right={String(s.autopilotApprovalItems?.length || 0)} />
          <MetricRow left="Owner-input items" right={String(s.autopilotNeedsInputItems?.length || 0)} strong={(s.autopilotNeedsInputItems?.length || 0) > 0} />
          <MetricRow left="Diary conflicts" right={String(s.diaryConflicts?.length || 0)} strong={(s.diaryConflicts?.length || 0) > 0} />
          <MetricRow left="Release-core issues" right={String(s.releaseCoreHealth?.issueCount || 0)} strong={(s.releaseCoreHealth?.highCount || 0) > 0} />
          {(s.autopilotApprovalItems?.length || s.autopilotNeedsInputItems?.length) ? (
            <Button label="Open Approval Inbox" primary onPress={() => s.go("autopilotCentre")} />
          ) : null}
          {(s.diaryConflicts?.length || !s.diaryConnection || s.diaryConnection.status !== "connected") ? (
            <Button label="Open Proactive BUSY + diary" onPress={() => s.go("proactiveBusyCentre")} />
          ) : null}
          {(s.releaseCoreHealth?.issueCount || 0) ? (
            <Button label="Review core health" onPress={() => s.go("releaseCore")} />
          ) : null}
        </Card>
      ) : null}

      {s.operationalContinuity?.status !== "All clear" ? (
        <Card
          eyebrow="V3.27 • Continuity"
          title={s.operationalContinuity?.headline || "BUSY can keep working while a connection recovers"}
          body="A provider or connection issue is being isolated from the rest of the business. Customer records, planning and safe draft preparation can continue while the affected connection is recovered separately."
          footer={`${(s.operationalContinuity?.highCount || 0) + (s.operationalContinuity?.reviewCount || 0)} important recovery item${((s.operationalContinuity?.highCount || 0) + (s.operationalContinuity?.reviewCount || 0)) === 1 ? "" : "s"} • no automatic duplicate sends or silent booking overwrites`}
          tone={(s.operationalContinuity?.highCount || 0) > 0 ? "amber" : "blue"}
        >
          <MetricRow left="Continuity state" right={s.operationalContinuity?.status || "All clear"} strong />
          <MetricRow left="What still works" right={String(s.operationalContinuity?.continueNow?.length || 0)} />
          <Button label="Open Continuity Centre" primary onPress={() => s.go("operationalContinuity")} />
        </Card>
      ) : null}

      <Card
        eyebrow="BUSY underneath"
        title="One assistant • several systems underneath"
        body="Autopilot prepares. Business Memory learns. Executive Briefing forecasts. Proactive BUSY watches the clock. Home now keeps those systems out of the way unless they change what you should do."
        tone="blue"
      >
        <MetricRow left="Autopilot" right={s.autopilotModeLabel || "Prepare for me"} />
        <MetricRow left="Memory confidence" right={s.strongestBusinessMemoryPattern?.stage?.label || "Too early to tell"} />
        <MetricRow left="Proactive reminders" right={s.proactiveNotificationsEnabled ? String(Object.keys(s.proactiveScheduledMap || {}).length) : "Off"} />
        <MetricRow left="Diary" right={s.diaryConnection?.status === "connected" ? "Connected" : "Not connected"} />
        <MetricRow left="Continuity" right={s.operationalContinuity?.status || "All clear"} />
        <MetricRow left="Daily briefing" right={s.dailyCommandCentre?.status || "Clear"} />
        <MetricRow
          left="Communications"
          right={
            (s.communicationsHub?.counts?.needsAttention || 0) > 0
              ? `${s.communicationsHub.counts.needsAttention} need attention`
              : (s.communicationsHub?.counts?.awaitingCustomer || 0) > 0
              ? `${s.communicationsHub.counts.awaitingCustomer} awaiting customer`
              : "Clear"
          }
        />
        <MetricRow
          left="Follow-up Engine"
          right={
            Number(s.followUpEngine?.counts?.replyNow || 0) +
              Number(s.followUpEngine?.counts?.followUpToday || 0) >
            0
              ? `${Number(s.followUpEngine?.counts?.replyNow || 0) + Number(s.followUpEngine?.counts?.followUpToday || 0)} ready now`
              : (s.followUpEngine?.counts?.waiting || 0) > 0
              ? `${s.followUpEngine.counts.waiting} waiting`
              : "Clear"
          }
        />
        <MetricRow
          left="Brand Brain"
          right={
            s.brandBrain?.websiteReady
              ? "Website foundation ready"
              : `${Number(s.brandBrain?.completeness?.score || 0)}% complete`
          }
          strong={!!s.brandBrain?.websiteReady}
        />
        <MetricRow
          left="Website Builder"
          right={
            s.websiteDraft
              ? `Draft generation ${s.websiteDraft.generation || 1}`
              : "Ready to build"
          }
          strong={!!s.websiteDraft}
        />
        <MetricRow
          left="Website hosting"
          right={
            s.websitePublishingView?.liveDeployment
              ? `${s.websitePublishingView.publicStatus} • ${s.websitePublishingView.healthLabel || "health pending"}`
              : s.websitePublishingView?.publicStatus || "Not checked"
          }
          strong={!!s.websitePublishingView?.liveDeployment}
        />
        <MetricRow
          left="Website delivery"
          right={s.websitePublishingView?.providerState?.label || "Not checked"}
          strong={!!s.websitePublishingView?.providerState?.configured}
        />
        <MetricRow
          left="Website signals"
          right={
            s.websitePublishingView?.analyticsView?.collecting
              ? `${Number(s.websitePublishingView.analyticsView.visits || 0)} visits • ${Number(s.websitePublishingView.analyticsView.requests || 0)} requests`
              : "Awaiting real provider signals"
          }
          strong={!!s.websitePublishingView?.analyticsView?.collecting}
        />
        <MetricRow
          left="BUSY Apps"
          right={
            s.miniAppsView?.businessUnreadTotal
              ? `${s.miniAppsView.businessUnreadTotal} unread message${s.miniAppsView.businessUnreadTotal === 1 ? "" : "s"}`
              : s.miniAppsView?.unlinkedPendingRequests?.length
              ? `${s.miniAppsView.unlinkedPendingRequests.length} request${s.miniAppsView.unlinkedPendingRequests.length === 1 ? "" : "s"} need review`
              : s.miniAppsView?.statusLabel || "Not built"
          }
          strong={
            !!s.miniAppsView?.hasLive ||
            !!s.miniAppsView?.businessUnreadTotal ||
            !!s.miniAppsView?.unlinkedPendingRequests?.length
          }
        />
        {s.miniAppsView?.hasLive ? (
          <MetricRow
            left="Mini App journey • 30d"
            right={`${Number(s.miniAppsView?.entryCounts?.byStage?.web_view || s.miniAppsView?.entryCounts?.byStage?.landing || 0)} web views • ${Number(s.miniAppsView?.entryCounts?.byStage?.action_intent || 0)} attempts • ${Number(s.miniAppsView?.guestRequestCount30 || 0)} guest requests`}
          />
        ) : null}
        <Button label="Daily Command Centre" onPress={() => s.go("dailyCommandCentre")} />
        <Button label="Follow-up Engine" onPress={() => s.openFollowUpEngine()} />
        <Button label="Communications Hub" onPress={() => s.openCommunicationsHub()} />
        <Button label="Executive Briefing" onPress={() => s.go("executiveBriefing")} />
        <Button label="Business Memory" onPress={() => s.go("businessMemory")} />
        <Button label="Brand & Business Identity" onPress={s.openBrandIdentity} />
        <Button label={s.websiteDraft ? "Website Builder & preview" : "Build my website"} onPress={s.openWebsiteBuilder} />
        {s.websiteDraft ? (
          <Button
            label={s.websitePublishingView?.liveDeployment ? "Website publishing & live site" : "Prepare website hosting"}
            onPress={s.openWebsitePublishing}
          />
        ) : null}
        <Button label="BUSY Apps marketplace" onPress={s.openBusyAppsMarketplace} />
        <Button
          label={s.miniAppsView?.app ? "Manage my Mini App" : "Build my Mini App"}
          onPress={s.openMiniAppBuilder}
        />
        {s.miniAppsView?.hasLive ? (
          <Button label="Share my Mini App" onPress={s.openMiniAppShareCentre} />
        ) : null}
        <Button label="Continuity Centre" onPress={() => s.go("operationalContinuity")} />
        <Button label="Release Core" onPress={() => s.go("releaseCore")} />
      </Card>

      {homeProactiveNotice ? (
        <Button
          label={`BUSY noticed something • ${homeProactiveNotice.title}`}
          onPress={() => s.go("proactiveWatch")}
        />
      ) : null}

      {nextBestMoves.length || otherMoves.length ? (
        <Button
          label={
            showOtherMoves
              ? "Hide other recommendations"
              : `See other recommendations • ${nextBestMoves.length + otherMoves.length}`
          }
          onPress={() => setShowOtherMoves((value) => !value)}
        />
      ) : null}

      {showOtherMoves
        ? [...nextBestMoves, ...otherMoves].map((item) => (
            <OpportunityCard
              key={item.id}
              {...item}
              eyebrow={`#${item.rank} • ${item.eyebrow}`}
              actionLabel={item.actionLabel || "Do it"}
              onAction={() => {
                if (item.canIgnore) s.recordOpportunityAccepted(item);
                item.onAction?.();
              }}
              onIgnore={item.canIgnore ? () => s.openOpportunityFeedback(item) : undefined}
            />
          ))
        : null}

      {s.dismissedOpportunities.length ? (
        <Button label="Restore ignored opportunities" onPress={s.restoreOpportunities} />
      ) : null}

      {s.activeWorkGoal && !s.workGoalFilled ? (
        <Card
          eyebrow="Active work goal"
          title={s.activeWorkGoal.label}
          body={
            s.workGoalCapacityMismatch
              ? `Capacity check needed: ${s.workGoalTargetJobs} bookings were requested, but ${s.workGoalPlanningService?.name || "the planning service"} at about ${formatDurationHours(s.workGoalDurationHours)} per job appears to fit only ${s.workGoalCapacityMax} in this ${s.activeWorkGoal.part || "slot"}.`
              : s.activeWorkGoal.spreadAcrossSlots
              ? s.workGoalPlanConflict
                ? "One of the planned openings has since been taken by other work. Refresh the capacity plan before promoting further."
                : s.workGoalPlanShortfall
                ? `BUSY found room for ${s.workGoalTargetJobs - s.workGoalPlanShortfall} of ${s.workGoalTargetJobs} requested bookings in the next ${s.activeWorkGoal.planHorizonDays || 21} days. The remaining ${s.workGoalPlanShortfall} still need diary capacity.`
                : `BUSY has spread ${s.workGoalTargetJobs} bookings across ${s.workGoalPlannedSlots.length} specific openings. ${s.workGoalRemainingJobs} still needed.`
              : `Target: ${s.workGoalTargetJobs} suitable booking${s.workGoalTargetJobs === 1 ? "" : "s"}. ${s.workGoalRemainingJobs} still needed. BUSY will size the next action to the remaining gap and stop escalating when the target is covered.`
          }
          footer={
            s.workGoalCapacityMismatch
              ? "Review capacity before promoting"
              : s.workGoalPlanConflict
              ? "Diary changed • refresh plan"
              : s.workGoalPlanShortfall
              ? `${s.workGoalPlanShortfall} booking${s.workGoalPlanShortfall === 1 ? "" : "s"} still need capacity`
              : s.workGoalBookedCount
              ? `${s.workGoalBookedCount} of ${s.workGoalTargetJobs} booked`
              : `${s.workGoalRemainingJobs} still needed`
          }
          tone={s.workGoalCapacityMismatch || s.workGoalPlanConflict || s.workGoalPlanShortfall ? "amber" : "blue"}
        >
          <MetricRow left="Matching confirmed bookings" right={String(s.workGoalBookedCount)} />
          <MetricRow left="Recorded value" right={s.workGoalBookedValue ? `£${s.workGoalBookedValue}` : "£0"} />
          <MetricRow left="Approved goal actions tried" right={String(s.workGoalAttempts.length)} />
          {s.activeWorkGoal.spreadAcrossSlots
            ? s.workGoalPlannedSlots.slice(0, 4).map((slot) => (
                <MetricRow
                  key={slot.id}
                  left={slot.label}
                  right={`${slot.bookedCount}/${slot.targetJobs}${slot.overbooked ? " • over" : slot.conflict ? " • changed" : ""}`}
                  strong={slot.bookedCount >= slot.targetJobs && !slot.conflict}
                />
              ))
            : null}
          {s.workGoalAttemptRows.slice(-2).map((attempt) => (
            <MetricRow key={attempt.id} left={attempt.label} right={attempt.outcome} strong={attempt.tone === "green"} />
          ))}
          <Button label={s.workGoalAttempts.length ? "Review next move" : "Review this work goal"} onPress={() => s.go("bestMove")} />
          <Button label="Cancel work goal" onPress={s.clearWorkGoal} />
        </Card>
      ) : null}

      {s.connectedIntakeKeys?.length ? (
        <Button
          label={`Connected intake • ${s.connectedIntakeKeys.length} source${s.connectedIntakeKeys.length === 1 ? "" : "s"} • ${s.connectedIntakePendingCount || 0} waiting`}
          onPress={() => s.go("connectedAccounts")}
        />
      ) : null}

      {(s.backgroundReadyCount || s.lifecycleWatchCount) ? (
        <Button
          label={`BUSY in the background • ${s.backgroundReadyCount || 0} ready • ${s.lifecycleWatchCount || 0} watched`}
          onPress={() => s.go("backgroundWork")}
        />
      ) : null}

      {s.inboxPendingItems.length ? (
        <Button
          label={`BUSY Inbox • ${s.inboxPendingItems.length} waiting`}
          primary
          onPress={s.openBusyInbox}
        />
      ) : null}
      <Button label="I NEED MORE WORK" primary={!bestMove && !s.inboxPendingItems.length} onPress={() => s.go("workNow")} />
      <Button label="Open work hub" primary={!s.inboxPendingItems.length && !!bestMove} onPress={() => s.jump("workHub", "Work")} />
      <Button label="Customer records" onPress={() => s.go("customerRecords")} />
      <Button label="Social Control Centre" onPress={s.openSocialCentre} />
      <Button label="Update my business data" onPress={() => s.go("businessData")} />
    </Shell>
  );
}

function ProactiveWatch({ s }) {
  const notices = s.proactiveNotices || [];

  return (
    <Shell
      s={s}
      title="BUSY noticed"
      subtitle="Patterns BUSY has spotted across the diary, customer pipeline, repeat timing, completed jobs and Business Brain outcomes."
      brandCue="Surface useful patterns early. Never turn a pattern into an external action without your approval."
    >
      <Card
        eyebrow="V3.17 • Proactive watch"
        title={
          notices.length
            ? `${notices.length} active pattern${notices.length === 1 ? "" : "s"} worth seeing`
            : "Nothing new needs surfacing"
        }
        body={
          notices.length
            ? "These are combinations or changes in the saved business records, not generic tips. BUSY keeps them separate from the ranked Next Best Actions so a pattern can be useful without pretending it is the most urgent task."
            : "BUSY is still watching the business, but no current pattern passes the threshold for a proactive nudge."
        }
        footer={
          s.proactiveHiddenNoticeCount
            ? `${s.proactiveHiddenNoticeCount} current pattern${s.proactiveHiddenNoticeCount === 1 ? " is" : "s are"} temporarily hidden`
            : "No current patterns hidden"
        }
        tone={notices.length ? "green" : "blue"}
      >
        <MetricRow left="Active notices" right={String(notices.length)} strong={notices.length > 0} />
        <MetricRow left="Temporarily hidden" right={String(s.proactiveHiddenNoticeCount || 0)} />
        {s.proactiveHiddenNoticeCount ? (
          <Button label="Show hidden patterns again" onPress={s.restoreProactiveNotices} />
        ) : null}
      </Card>

      {notices.map((notice, index) => (
        <Card
          key={notice.id}
          eyebrow={`#${index + 1} • ${notice.category || "BUSY noticed"}`}
          title={notice.title}
          body={notice.body}
          footer={notice.footer}
          tone={notice.tone || "blue"}
        >
          <InlineExplanation why={notice.why} evidence={notice.evidence} />
          <Button
            label={notice.actionLabel || "Review this"}
            primary={index === 0}
            onPress={() => s.runProactiveNotice(notice)}
          />
          <Button
            label="Not now • hide for 24 hours"
            onPress={() => s.snoozeProactiveNotice(notice.id)}
          />
          <Button
            label="Seen • hide this occurrence"
            onPress={() => s.acknowledgeProactiveNotice(notice.id)}
          />
        </Card>
      ))}

      {!notices.length ? (
        <Card
          eyebrow="All clear"
          title="BUSY is watching without creating noise"
          body="The proactive layer only surfaces clusters or combinations that cross a useful threshold. A single normal booking, one ordinary repeat date or one isolated action is not enough to manufacture an alert."
          tone="green"
        />
      ) : null}

      <Button label="Back to Home" primary onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function BackgroundWork({ s }) {
  const nextReview = s.automaticReviewDraftEntries?.[0] || null;
  const nextPost = s.automaticPostDraftEntries?.[0] || null;

  return (
    <Shell
      s={s}
      title="BUSY in the background"
      subtitle="Dates, drafts and follow-on admin BUSY is already maintaining underneath the Opportunity Engine."
      brandCue="Prepared automatically. Customer-facing actions still need approval."
    >
      <Card
        eyebrow="Ready now"
        title={`${s.backgroundReadyCount} next step${s.backgroundReadyCount === 1 ? "" : "s"} ready for review`}
        body="BUSY can prepare the admin, but it does not send a customer message, publish a post or spend money by itself in this prototype."
        tone="green"
      >
        <MetricRow left="Quiet enquiries" right={String(s.staleEnquiryEntries.length)} />
        <MetricRow left="Quote follow-ups" right={String(s.dueQuoteEntries.length)} />
        <MetricRow left="Review drafts" right={String(s.automaticReviewDraftCount)} />
        <MetricRow left="Post drafts" right={String(s.automaticPostDraftCount)} />
      </Card>

      {s.staleEnquiryEntries.length ? (
        <Button label={`Review quiet enquiries • ${s.staleEnquiryEntries.length}`} primary onPress={() => s.go("staleEnquiries")} />
      ) : null}

      {s.dueQuoteEntries.length ? (
        <Button label={`Review quote follow-ups • ${s.dueQuoteEntries.length}`} onPress={() => s.go("staleQuotes")} />
      ) : null}

      {nextReview ? (
        <Card
          eyebrow="Pre-drafted after completed work"
          title={`Review request for ${nextReview.customer.name}`}
          body={nextReview.job.reviewRequestDraft}
          footer="Nothing sent"
          tone="blue"
        >
          <Button
            label="Review request"
            onPress={() => s.prepareReviewRequest(nextReview.customer.id, nextReview.job.id)}
          />
        </Card>
      ) : null}

      {nextPost ? (
        <Card
          eyebrow="Pre-drafted from approved job photos"
          title={`Finished-job post • ${nextPost.customer.name}`}
          body={nextPost.job.postDraft}
          footer="Nothing published"
          tone="blue"
        >
          <Button
            label="Review post approval"
            onPress={() => s.openJobPostApproval(nextPost.customer.id, nextPost.job.id)}
          />
        </Card>
      ) : null}

      <Card
        eyebrow="Being watched"
        title={`${s.lifecycleWatchCount} timeline${s.lifecycleWatchCount === 1 ? "" : "s"} tracked automatically`}
        body="Fresh enquiries, sent quotes and repeat-service dates can become opportunities when their real due dates arrive."
        tone="blue"
      >
        <MetricRow left="Fresh enquiries being watched" right={String(s.freshEnquiryEntries.length)} />
        <MetricRow
          left="Sent quotes being watched"
          right={String(
            Object.values(s.replyActions || {}).filter(
              (action) =>
                action?.type === "quote" &&
                action?.done &&
                action.details?.quoteStatus === "Sent" &&
                !action.details?.followUpSentAt
            ).length
          )}
        />
        <MetricRow left="Repeat-service dates tracked" right={String(s.repeatTimingTrackedCount)} />
      </Card>

      {s.repeatTimingTrackedEntries?.slice(0, 5).map(({ customer, dueDate }) => (
        <Pressable
          key={customer.id}
          onPress={() => s.openCustomer(customer.id)}
          style={styles.customerTimelineCard}
        >
          <View style={styles.activityTopRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.customerTimelineLabel}>REPEAT TIMING</Text>
              <Text style={styles.activityName}>{customer.name}</Text>
              <Text style={styles.activityService}>{customer.service}</Text>
            </View>
            <StatusChip
              label={dueDate <= dateToISO(new Date()) ? "Due now" : formatUKDate(dueDate)}
              tone={dueDate <= dateToISO(new Date()) ? "green" : "blue"}
            />
          </View>
          <Text style={styles.activityOpen}>Open customer →</Text>
        </Pressable>
      ))}

      {!s.backgroundReadyCount && !s.lifecycleWatchCount ? (
        <Card
          eyebrow="All clear"
          title="Nothing waiting in the background"
          body="BUSY is not manufacturing admin just to make the screen look busy."
          footer="Recommended action: none"
          tone="green"
        />
      ) : null}

      <Button label="Back to Home" primary onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}



export {
  HomeScreen,
  ProactiveWatch,
  BackgroundWork
};
