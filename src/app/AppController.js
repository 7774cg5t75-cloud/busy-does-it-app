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
  BUSY_COMMAND_URL,
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
import { BusyBrandLockup } from "../components/ui";
import { screens, HomeScreen, AccountAccess } from "../screens";

function App() {
  const [hydrated, setHydrated] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [screen, setScreen] = useState("welcome");
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("Home");
  const [businessName, setBusinessName] = useState("Dave's Exterior Cleaning");
  const [trade, setTrade] = useState("Exterior cleaning");
  const [verticalId, setVerticalId] = useState("exterior-cleaning");
  const [postcode, setPostcode] = useState("EX17");
  const [radius, setRadius] = useState("15");
  const [quietSlot, setQuietSlot] = useState("Thursday afternoon");
  const [quietSlotConfirmed, setQuietSlotConfirmed] = useState(false);
  const [unansweredReviewCount, setUnansweredReviewCount] = useState("4");
  const [recentPhotoCountNeeded, setRecentPhotoCountNeeded] = useState("2");
  const [customers, setCustomers] = useState(customerSeed);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [newCustomerService, setNewCustomerService] = useState("Driveway cleaning");
  const [newCustomerDate, setNewCustomerDate] = useState("2025-01-01");
  const [newCustomerValue, setNewCustomerValue] = useState("");
  const [newCustomerContactOk, setNewCustomerContactOk] = useState(true);
  const [newCustomerHasPreviousJob, setNewCustomerHasPreviousJob] = useState(true);
  const [newEnquiryName, setNewEnquiryName] = useState("");
  const [newEnquiryPhone, setNewEnquiryPhone] = useState("");
  const [newEnquiryAddress, setNewEnquiryAddress] = useState("");
  const [newEnquiryService, setNewEnquiryService] = useState("Driveway cleaning");
  const [newEnquiryCustomService, setNewEnquiryCustomService] = useState("");
  const [newEnquiryNote, setNewEnquiryNote] = useState("");
  const [newEnquiryDate, setNewEnquiryDate] = useState(dateToISO(new Date()));
  const [customerNoteText, setCustomerNoteText] = useState("");
  const [services, setServices] = useState(servicesSeed);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceValue, setNewServiceValue] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("2");
  const [alwaysAsk, setAlwaysAsk] = useState(true);
  const [customerContact, setCustomerContact] = useState(true);
  const [testLimit, setTestLimit] = useState("25");
  const [weeklyLimit, setWeeklyLimit] = useState("100");
  const [connectedAccounts, setConnectedAccounts] = useState(connectionSeed);
  const [dismissedOpportunities, setDismissedOpportunities] = useState([]);
  const [selectedGap, setSelectedGap] = useState("");
  const [workGoalTargetDraft, setWorkGoalTargetDraft] = useState(1);
  const [activeWorkGoal, setActiveWorkGoal] = useState(null);
  const [campaignRecipientLimit, setCampaignRecipientLimit] = useState(null);
  const [selectedCustomerGroup, setSelectedCustomerGroup] = useState(previousCustomerGroups[0]);
  const [selectedServiceId, setSelectedServiceId] = useState("driveway");
  const [moreWorkGoal, setMoreWorkGoal] = useState("More work next week");
  const [campaignStage, setCampaignStage] = useState(0);
  const [adBudget, setAdBudget] = useState("20");
  const [message, setMessage] = useState(campaignSteps[0].message);
  const [serviceMessages, setServiceMessages] = useState({});
  const [lastSimulatedRecipients, setLastSimulatedRecipients] = useState([]);
  const [reactivationRuns, setReactivationRuns] = useState([]);
  const [replyActions, setReplyActions] = useState({});
  const [selectedReplyActionId, setSelectedReplyActionId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [actionQuoteAmount, setActionQuoteAmount] = useState("");
  const [actionQuoteMessage, setActionQuoteMessage] = useState("");
  const [actionQuoteSentDate, setActionQuoteSentDate] = useState(dateToISO(new Date()));
  const [actionBookingDate, setActionBookingDate] = useState(nextDateForSlot("Thursday afternoon"));
  const [actionBookingTime, setActionBookingTime] = useState(defaultTimeForSlot("Thursday afternoon"));
  const [actionJobValue, setActionJobValue] = useState("");
  const [actionJobNote, setActionJobNote] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [pendingJobPhotos, setPendingJobPhotos] = useState([]);
  const [jobPhotosMarketingOk, setJobPhotosMarketingOk] = useState(false);
  const [jobPostDraft, setJobPostDraft] = useState("");
  const [jobPostChannels, setJobPostChannels] = useState({ facebook: false, instagram: false, googleBusiness: false });
  const [jobPostOutcome, setJobPostOutcome] = useState("No enquiry yet");
  const [jobPostOutcomeValue, setJobPostOutcomeValue] = useState("");
  const [socialDrafts, setSocialDrafts] = useState([]);
  const [socialPreferredChannels, setSocialPreferredChannels] = useState({
    facebook: true,
    instagram: true,
    googleBusiness: false,
  });
  const [socialCreatePhotos, setSocialCreatePhotos] = useState([]);
  const [socialBrief, setSocialBrief] = useState("");
  const [socialAiStatus, setSocialAiStatus] = useState("idle");
  const [socialAiResult, setSocialAiResult] = useState(null);
  const [socialAiError, setSocialAiError] = useState("");
  const [socialCaptionId, setSocialCaptionId] = useState("");
  const [socialDraftText, setSocialDraftText] = useState("");
  const [socialDraftChannels, setSocialDraftChannels] = useState({
    facebook: false,
    instagram: false,
    googleBusiness: false,
  });
  const [socialScheduleDate, setSocialScheduleDate] = useState(dateToISO(new Date()));
  const [socialScheduleTime, setSocialScheduleTime] = useState("19:00");
  const [socialSourceContext, setSocialSourceContext] = useState({
    type: "phone",
    label: "Phone photos",
    customerId: "",
    jobId: "",
    service: "",
  });
  const [selectedSocialDraftId, setSelectedSocialDraftId] = useState(null);
  const [socialPublishingStatus, setSocialPublishingStatus] = useState({
    loaded: false,
    owner: {
      authenticated: false,
      email: "",
      businessId: "",
      role: "",
    },
    credentials: {
      meta: { configured: false },
      google_business: { configured: false },
      livePublishingEnabled: false,
    },
    connections: {
      meta: { status: "not_connected", assets: [] },
      google_business: { status: "not_connected", assets: [] },
    },
    queue: [],
  });
  const [socialPublishingLoading, setSocialPublishingLoading] = useState(false);
  const [socialPublishingError, setSocialPublishingError] = useState("");
  const [socialPublishingAction, setSocialPublishingAction] = useState("");
  const [ownerSession, setOwnerSession] = useState(null);
  const [ownerEmail, setOwnerEmail] = useState(DEFAULT_OWNER_EMAIL);
  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerAuthLoading, setOwnerAuthLoading] = useState(false);
  const [ownerAuthError, setOwnerAuthError] = useState("");
  const [ownerAuthNotice, setOwnerAuthNotice] = useState("");
  const [ownerAuthReady, setOwnerAuthReady] = useState(false);
  const [cloudWorkspace, setCloudWorkspace] = useState(null);
  const [cloudInitialised, setCloudInitialised] = useState(false);
  const [cloudInitialising, setCloudInitialising] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState("Local only");
  const [cloudLastSyncedAt, setCloudLastSyncedAt] = useState("");
  const [cloudSyncError, setCloudSyncError] = useState("");
  const [cloudRevision, setCloudRevision] = useState(0);
  const [cloudAttempted, setCloudAttempted] = useState(false);
  const [cloudConflict, setCloudConflict] = useState(null);
  const [accountClosurePhrase, setAccountClosurePhrase] = useState("");
  const [accountClosureEmail, setAccountClosureEmail] = useState("");
  const [accountClosureBusy, setAccountClosureBusy] = useState(false);
  const [accountClosureError, setAccountClosureError] = useState("");
  const [businessBrainRules, setBusinessBrainRules] = useState([]);
  const [businessBrainRuleDraft, setBusinessBrainRuleDraft] = useState("");
  const [businessBrainFeedback, setBusinessBrainFeedback] = useState([]);
  const [proactiveNoticeState, setProactiveNoticeState] = useState({});
  const [busyCommandHistory, setBusyCommandHistory] = useState([]);
  const [busyCommandStatus, setBusyCommandStatus] = useState("idle");
  const [busyCommandResult, setBusyCommandResult] = useState(null);
  const [busyCommandError, setBusyCommandError] = useState("");
  const [busyVoiceStartNonce, setBusyVoiceStartNonce] = useState(0);
  const [busyConversationTurns, setBusyConversationTurns] = useState([]);
  const [busyOperatorSnapshot, setBusyOperatorSnapshot] = useState(null);
  const [busyActionAudit, setBusyActionAudit] = useState([]);
  const [busyUndoAction, setBusyUndoAction] = useState(null);
  const [pendingBrainFeedback, setPendingBrainFeedback] = useState(null);
  const [brainFeedbackReason, setBrainFeedbackReason] = useState("");
  const [quoteFollowUpDraft, setQuoteFollowUpDraft] = useState("");
  const [quoteFollowUpOutcome, setQuoteFollowUpOutcome] = useState("No reply yet");
  const [enquiryFollowUpDraft, setEnquiryFollowUpDraft] = useState("");
  const [enquiryFollowUpOutcome, setEnquiryFollowUpOutcome] = useState("No reply yet");
  const [reviewRequestDraft, setReviewRequestDraft] = useState("");
  const [reviewRequestOutcome, setReviewRequestOutcome] = useState("No response yet");
  const [actionReminderDate, setActionReminderDate] = useState(addDaysISO(30));
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [pendingRemoveCustomerId, setPendingRemoveCustomerId] = useState(null);
  const [bringBackMessage, setBringBackMessage] = useState(
    "Hi, it’s been a while since we last helped. We’ve got a couple of spaces next week if you need anything from us. Reply here if you’d like us to take a look."
  );
  const [offerGoal, setOfferGoal] = useState("Fill a quiet day");
  const [offerService, setOfferService] = useState("Driveway cleaning");
  const [normalPrice, setNormalPrice] = useState("250");
  const [offerPrice, setOfferPrice] = useState("225");
  const [offerDates, setOfferDates] = useState("Tuesday & Wednesday");
  const [offerMax, setOfferMax] = useState("4");
  const [offerPaused, setOfferPaused] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [outcome, setOutcome] = useState("Won");
  const [wonValue, setWonValue] = useState("620");
  const [captureRawText, setCaptureRawText] = useState("");
  const [captureScreenshots, setCaptureScreenshots] = useState([]);
  const [captureScreenshotOrderConfidence, setCaptureScreenshotOrderConfidence] = useState("Not checked");
  const [captureScreenshotOrderReason, setCaptureScreenshotOrderReason] = useState("");
  const [captureBrainStatus, setCaptureBrainStatus] = useState("idle");
  const [captureBrainAnalysis, setCaptureBrainAnalysis] = useState(null);
  const [captureBrainError, setCaptureBrainError] = useState("");
  const [captureSource, setCaptureSource] = useState("Customer message");
  const [captureStage, setCaptureStage] = useState("Enquiry");
  const [captureName, setCaptureName] = useState("");
  const [capturePhone, setCapturePhone] = useState("");
  const [captureEmail, setCaptureEmail] = useState("");
  const [captureAddress, setCaptureAddress] = useState("");
  const [captureService, setCaptureService] = useState("");
  const [captureDate, setCaptureDate] = useState(dateToISO(new Date()));
  const [captureTime, setCaptureTime] = useState("09:00");
  const [captureValue, setCaptureValue] = useState("");
  const [captureNote, setCaptureNote] = useState("");
  const [captureConfidence, setCaptureConfidence] = useState("Low");
  const [captureExtractedFields, setCaptureExtractedFields] = useState([]);
  const [captureForceNew, setCaptureForceNew] = useState(false);
  const [intakeLog, setIntakeLog] = useState([]);
  const [inboxItems, setInboxItems] = useState([]);
  const [connectionSyncLog, setConnectionSyncLog] = useState([]);
  const [selectedInboxItemId, setSelectedInboxItemId] = useState(null);
  const [recordFilingMode, setRecordFilingMode] = useState("safe");
  const [lastAutoFiledInboxItemId, setLastAutoFiledInboxItemId] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rawSession = await SecureStore.getItemAsync(OWNER_SESSION_KEY);
        if (active && rawSession) {
          const parsed = JSON.parse(rawSession);
          if (parsed?.accessToken) {
            setOwnerSession(parsed);
            if (parsed?.email) setOwnerEmail(parsed.email);
          }
        }
      } catch (e) {
        // A missing or unreadable secure session simply means the owner signs in again.
      } finally {
        if (active) setOwnerAuthReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
        if (!active || !raw) return;
        const saved = JSON.parse(raw);
        if (typeof saved.onboardingComplete === "boolean") setOnboardingComplete(saved.onboardingComplete);
        if (saved.businessName) setBusinessName(saved.businessName);
        if (saved.trade) setTrade(saved.trade);
        const savedVerticalId = saved.verticalId || "exterior-cleaning";
        setVerticalId(savedVerticalId);
        if (saved.postcode) setPostcode(saved.postcode);
        if (saved.radius) setRadius(saved.radius);
        if (saved.quietSlot) setQuietSlot(saved.quietSlot);
        if (typeof saved.quietSlotConfirmed === "boolean") setQuietSlotConfirmed(saved.quietSlotConfirmed);
        if (saved.activeWorkGoal && typeof saved.activeWorkGoal === "object") {
          setActiveWorkGoal(saved.activeWorkGoal);
          if (saved.activeWorkGoal.label) setSelectedGap(saved.activeWorkGoal.label);
          if (saved.activeWorkGoal.targetJobs) setWorkGoalTargetDraft(Number(saved.activeWorkGoal.targetJobs) || 1);
        }
        if (saved.unansweredReviewCount !== undefined) setUnansweredReviewCount(String(saved.unansweredReviewCount));
        if (saved.recentPhotoCountNeeded !== undefined) setRecentPhotoCountNeeded(String(saved.recentPhotoCountNeeded));
        if (Array.isArray(saved.customers)) setCustomers(saved.customers);
        if (Array.isArray(saved.lastSimulatedRecipients)) setLastSimulatedRecipients(saved.lastSimulatedRecipients);
        if (Array.isArray(saved.reactivationRuns)) setReactivationRuns(saved.reactivationRuns);
        if (saved.replyActions && typeof saved.replyActions === "object") {
          const migratedReplyActions = Object.fromEntries(
            Object.entries(saved.replyActions).map(([id, action]) => [
              id,
              action?.type ? action : { ...action, done: false },
            ])
          );
          setReplyActions(migratedReplyActions);
        }
        if (Array.isArray(saved.services)) {
          const pack = getVerticalPack(saved.verticalId || "exterior-cleaning");
          setServices(
            saved.services.map((item) => {
              const packService = pack.services.find((candidate) => candidate.name === item.name);
              return {
                ...item,
                repeatMonths:
                  item.repeatMonths !== undefined
                    ? item.repeatMonths
                    : packService?.repeatMonths ?? pack.defaultRepeatMonths,
                durationHours:
                  Number(item.durationHours) > 0
                    ? Number(item.durationHours)
                    : Number(packService?.durationHours) > 0
                    ? Number(packService.durationHours)
                    : 2,
              };
            })
          );
        }
        if (typeof saved.alwaysAsk === "boolean") setAlwaysAsk(saved.alwaysAsk);
        if (typeof saved.customerContact === "boolean") setCustomerContact(saved.customerContact);
        if (saved.testLimit) setTestLimit(saved.testLimit);
        if (saved.weeklyLimit) setWeeklyLimit(saved.weeklyLimit);
        if (saved.connectedAccounts) setConnectedAccounts({ ...connectionSeed, ...saved.connectedAccounts });
        if (Array.isArray(saved.dismissedOpportunities)) setDismissedOpportunities(saved.dismissedOpportunities);
        if (saved.selectedServiceId) setSelectedServiceId(saved.selectedServiceId);
        if (Array.isArray(saved.intakeLog)) setIntakeLog(saved.intakeLog);
        if (Array.isArray(saved.inboxItems)) setInboxItems(saved.inboxItems);
        if (Array.isArray(saved.connectionSyncLog)) setConnectionSyncLog(saved.connectionSyncLog);
        if (Array.isArray(saved.socialDrafts)) setSocialDrafts(saved.socialDrafts);
        if (saved.socialPreferredChannels && typeof saved.socialPreferredChannels === "object") {
          setSocialPreferredChannels({
            facebook: !!saved.socialPreferredChannels.facebook,
            instagram: !!saved.socialPreferredChannels.instagram,
            googleBusiness: !!saved.socialPreferredChannels.googleBusiness,
          });
        }
        if (Array.isArray(saved.businessBrainRules)) setBusinessBrainRules(saved.businessBrainRules);
        if (Array.isArray(saved.businessBrainFeedback)) setBusinessBrainFeedback(saved.businessBrainFeedback);
        if (saved.proactiveNoticeState && typeof saved.proactiveNoticeState === "object") {
          setProactiveNoticeState(saved.proactiveNoticeState);
        }
        if (Array.isArray(saved.busyCommandHistory)) {
          setBusyCommandHistory(saved.busyCommandHistory.slice(0, 20));
        }
        if (Array.isArray(saved.busyConversationTurns)) {
          setBusyConversationTurns(saved.busyConversationTurns.slice(-18));
        }
        if (saved.busyOperatorSnapshot && typeof saved.busyOperatorSnapshot === "object") {
          setBusyOperatorSnapshot(saved.busyOperatorSnapshot);
        }
        if (Array.isArray(saved.busyActionAudit)) {
          setBusyActionAudit(saved.busyActionAudit.slice(0, 30));
        }
        if (saved.recordFilingMode === "review" || saved.recordFilingMode === "safe") {
          setRecordFilingMode(saved.recordFilingMode);
        }
        if (typeof saved.advanced === "boolean") setAdvanced(saved.advanced);
        if (saved.onboardingComplete) {
          setScreen("home");
          setTab("Home");
        }
      } catch (e) {
        // Prototype persistence should never block the app from opening.
      } finally {
        if (active) setHydrated(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !ownerAuthReady || !ownerSession?.userId) return;
    const data = {
      onboardingComplete,
      businessName,
      trade,
      verticalId,
      postcode,
      radius,
      quietSlot,
      quietSlotConfirmed,
      activeWorkGoal,
      unansweredReviewCount,
      recentPhotoCountNeeded,
      customers,
      lastSimulatedRecipients,
      reactivationRuns,
      replyActions,
      services,
      alwaysAsk,
      customerContact,
      testLimit,
      weeklyLimit,
      connectedAccounts,
      dismissedOpportunities,
      selectedServiceId,
      intakeLog,
      inboxItems,
      connectionSyncLog,
      socialDrafts,
      socialPreferredChannels,
      businessBrainRules,
      businessBrainFeedback,
      proactiveNoticeState,
      busyCommandHistory,
      recordFilingMode,
      advanced,
    };
    const userCacheKey = storageKeyForUser(ownerSession.userId);
    if (userCacheKey) {
      AsyncStorage.setItem(userCacheKey, JSON.stringify(data)).catch(() => {});
    }
  }, [
    hydrated,
    ownerAuthReady,
    ownerSession?.userId,
    onboardingComplete,
    businessName,
    trade,
    verticalId,
    postcode,
    radius,
    quietSlot,
    quietSlotConfirmed,
    activeWorkGoal,
    unansweredReviewCount,
    recentPhotoCountNeeded,
    customers,
    lastSimulatedRecipients,
    reactivationRuns,
    replyActions,
    services,
    alwaysAsk,
    customerContact,
    testLimit,
    weeklyLimit,
    connectedAccounts,
    dismissedOpportunities,
    selectedServiceId,
    intakeLog,
    inboxItems,
    connectionSyncLog,
    socialDrafts,
    socialPreferredChannels,
    businessBrainRules,
    businessBrainFeedback,
    proactiveNoticeState,
    busyCommandHistory,
    busyConversationTurns,
    busyOperatorSnapshot,
    busyActionAudit,
    recordFilingMode,
    advanced,
  ]);

  const go = (next) => {
    setHistory((h) => [...h, screen]);
    setScreen(next);
  };

  const back = () => {
    if (!history.length) return;
    const copy = [...history];
    const prev = copy.pop();
    setHistory(copy);
    setScreen(prev);
  };

  const jump = (next, nextTab = tab) => {
    setHistory([]);
    setScreen(next);
    setTab(nextTab);
  };

  const confirmSpareSlot = (slot) => {
    const nextSlot = slot || "Any suitable work";
    const suggestion = suggestSpareSlots(replyActions).find((item) => item.label === nextSlot) || null;
    const targetJobs = Math.max(1, Math.min(3, Number(workGoalTargetDraft) || 1));
    const planningService =
      services.find((item) => item.id === selectedServiceId) ||
      services.find((item) => item.wanted) ||
      services[0] ||
      null;
    const goal = {
      label: nextSlot,
      date: suggestion?.date || null,
      part: suggestion?.part || null,
      targetJobs,
      serviceId: planningService?.id || null,
      serviceName: planningService?.name || null,
      attempts: [],
      createdAt: new Date().toISOString(),
    };
    setSelectedGap(nextSlot);
    setQuietSlot(nextSlot);
    setQuietSlotConfirmed(true);
    setActiveWorkGoal(goal);
    go("bestMove");
  };

  const fitWorkGoalToSlot = () => {
    if (!activeWorkGoal) return;
    const service =
      services.find((item) => item.id === activeWorkGoal.serviceId) ||
      services.find((item) => item.id === selectedServiceId) ||
      services.find((item) => item.wanted) ||
      services[0];
    const slotHours = slotPlanningHours(activeWorkGoal.part);
    const duration = planningDurationHours(service);
    const capacity = slotHours ? Math.floor(slotHours / duration) : null;
    if (!capacity || capacity < 1) return;
    setActiveWorkGoal((goal) => ({ ...goal, targetJobs: capacity }));
    setWorkGoalTargetDraft(capacity);
  };

  const spreadWorkGoalAcrossSlots = () => {
    if (!activeWorkGoal) return;
    const service =
      services.find((item) => item.id === activeWorkGoal.serviceId) ||
      services.find((item) => item.id === selectedServiceId) ||
      services.find((item) => item.wanted) ||
      services[0] ||
      null;
    const plan = buildMultiSlotCapacityPlan(replyActions, activeWorkGoal, service);
    const target = Number(activeWorkGoal.targetJobs) || 1;
    const label = `${target} booking${target === 1 ? "" : "s"} across planned openings`;
    setActiveWorkGoal((goal) => ({
      ...goal,
      label,
      date: null,
      part: null,
      spreadAcrossSlots: true,
      plannedSlots: plan.plannedSlots,
      plannedJobs: plan.plannedJobs,
      unplannedJobs: plan.unplannedJobs,
      planHorizonDays: plan.horizonDays,
      planUpdatedAt: new Date().toISOString(),
    }));
    setSelectedGap(label);
    setQuietSlot(label);
  };

  const refreshSpreadWorkGoalPlan = () => {
    if (!activeWorkGoal?.spreadAcrossSlots) return;
    const service =
      services.find((item) => item.id === activeWorkGoal.serviceId) ||
      services.find((item) => item.id === selectedServiceId) ||
      services.find((item) => item.wanted) ||
      services[0] ||
      null;
    const matchedBookings = Object.entries(replyActions || {})
      .map(([id, action]) => {
        const customer =
          customers.find((item) => item.id === id) ||
          lastSimulatedRecipients.find((item) => item.id === id);
        if (!customer || customer.service !== service?.name) return null;
        if (!bookingMatchesWorkGoal(action, activeWorkGoal)) return null;
        return { id, action, customer };
      })
      .filter(Boolean);
    const fulfilledSlots = (activeWorkGoal.plannedSlots || [])
      .map((slot) => {
        const count = matchedBookings.filter((entry) => {
          const date = entry.action.details?.bookingDate;
          const hour = Number(String(entry.action.details?.bookingTime || "").split(":")[0]);
          if (!date || !Number.isFinite(hour)) return false;
          const part = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
          return date === slot.date && part === slot.part;
        }).length;
        return count > 0 ? { ...slot, targetJobs: count } : null;
      })
      .filter(Boolean);
    const fulfilledCount = fulfilledSlots.reduce((total, slot) => total + Number(slot.targetJobs || 0), 0);
    const remainingTarget = Math.max(0, (Number(activeWorkGoal.targetJobs) || 1) - fulfilledCount);
    const plan = remainingTarget
      ? buildMultiSlotCapacityPlan(replyActions, { ...activeWorkGoal, targetJobs: remainingTarget }, service)
      : { plannedSlots: [], plannedJobs: 0, unplannedJobs: 0, horizonDays: 21 };
    setActiveWorkGoal((goal) => ({
      ...goal,
      plannedSlots: [...fulfilledSlots, ...plan.plannedSlots],
      plannedJobs: fulfilledCount + plan.plannedJobs,
      unplannedJobs: plan.unplannedJobs,
      planHorizonDays: plan.horizonDays,
      planUpdatedAt: new Date().toISOString(),
    }));
  };

  const fitWorkGoalToPlannedCapacity = () => {
    if (!activeWorkGoal?.spreadAcrossSlots) return;
    const planned = Math.max(0, Number(activeWorkGoal.plannedJobs) || 0);
    if (!planned) return;
    setActiveWorkGoal((goal) => ({ ...goal, targetJobs: planned, unplannedJobs: 0 }));
    setWorkGoalTargetDraft(planned);
  };
  const adjustServiceDuration = (serviceId, delta) => {
    setServices((list) =>
      list.map((item) =>
        item.id === serviceId
          ? {
              ...item,
              durationHours: Math.max(
                0.5,
                Math.min(8, Math.round((planningDurationHours(item) + delta) * 2) / 2)
              ),
            }
          : item
      )
    );
  };

  const recordWorkGoalAttempt = (attempt = {}) => {
    if (!activeWorkGoal || !attempt?.key) return;
    const startedAt = new Date().toISOString();
    setActiveWorkGoal((goal) => {
      if (!goal) return goal;
      const attempts = Array.isArray(goal.attempts) ? goal.attempts : [];
      if (attempts.some((item) => item.key === attempt.key)) return goal;
      return {
        ...goal,
        attempts: [
          ...attempts,
          {
            id: `goal-attempt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            startedAt,
            ...attempt,
          },
        ],
      };
    });
  };

  const clearWorkGoal = () => {
    setActiveWorkGoal(null);
    setQuietSlotConfirmed(false);
    setSelectedGap("");
    setWorkGoalTargetDraft(1);
    setCampaignRecipientLimit(null);
    setDismissedOpportunities((items) => items.filter((id) => id !== "quiet-slot"));
    jump("home", "Home");
  };

  const prepareOfferForWorkGoal = () => {
    const preferred =
      services.find((item) => item.id === selectedServiceId) ||
      services.find((item) => item.wanted) ||
      services[0];
    const serviceName = preferred?.name || trade || "Main service";
    const baseValue = Number(preferred?.value) > 0 ? Number(preferred.value) : 100;

    const alreadyBooked = Object.entries(replyActions || {}).filter(([id, action]) => {
      const customer =
        customers.find((item) => item.id === id) ||
        lastSimulatedRecipients.find((item) => item.id === id);
      if (!customer || customer.service !== serviceName) return false;
      return bookingMatchesWorkGoal(action, activeWorkGoal);
    }).length;
    const remainingJobs = Math.max(1, (Number(activeWorkGoal?.targetJobs) || 1) - alreadyBooked);

    setOfferGoal("Fill a quiet day");
    setOfferService(serviceName);
    setNormalPrice(String(baseValue));
    setOfferPrice(String(baseValue));
    setOfferDates(activeWorkGoal?.label || quietSlot || "Next quiet slot");
    setOfferMax(String(remainingJobs));
    setOfferPaused(false);
    go("offerBuild");
  };

  const completeOnboarding = () => {
    setOnboardingComplete(true);
    jump("home", "Home");
  };

  const applyVerticalPack = (nextVerticalId) => {
    const pack = getVerticalPack(nextVerticalId);
    const nextServices = pack.services.map((item) => ({ ...item }));
    setVerticalId(pack.id);
    setTrade(pack.label);
    setServices(nextServices);
    setSelectedServiceId(nextServices[0]?.id || "");
    setNewCustomerService(nextServices[0]?.name || pack.label);
    setNewEnquiryService(nextServices[0]?.name || pack.label);
    setNewEnquiryCustomService("");
    setOfferService(nextServices[0]?.name || pack.label);
    setDismissedOpportunities([]);
  };

  const toggleConnection = (key) => {
    setConnectedAccounts((current) => ({ ...current, [key]: !current[key] }));
  };

  const dismissOpportunity = (id) => {
    setDismissedOpportunities((items) => (items.includes(id) ? items : [...items, id]));
  };

  const restoreOpportunities = () => setDismissedOpportunities([]);

  const openOpportunityFeedback = (opportunity) => {
    if (!opportunity?.id) return;
    setPendingBrainFeedback({
      id: opportunity.id,
      family: businessBrainOpportunityFamily(opportunity.id),
      title: opportunity.title || "Opportunity",
      eyebrow: opportunity.eyebrow || "",
      service: opportunity.brainService || "",
    });
    setBrainFeedbackReason("");
    go("opportunityFeedback");
  };

  const recordOpportunityAccepted = (opportunity) => {
    if (!opportunity?.id || opportunity.canIgnore === false) return;
    const family = opportunity.brainFamily || businessBrainOpportunityFamily(opportunity.id);
    const service = opportunity.brainService || "";
    const recentDuplicate = businessBrainFeedback.some(
      (item) =>
        item.signal === "accepted" &&
        item.opportunityId === opportunity.id &&
        daysSinceTimestamp(item.recordedAt) !== null &&
        daysSinceTimestamp(item.recordedAt) <= 1
    );
    if (recentDuplicate) return;
    setBusinessBrainFeedback((items) => [
      ...items,
      {
        id: `brain-feedback-accepted-${Date.now()}`,
        opportunityId: opportunity.id,
        family,
        title: opportunity.title || "",
        service,
        reason: "Owner chose this recommendation",
        signal: "accepted",
        boost: 2,
        penalty: 0,
        recordedAt: new Date().toISOString(),
      },
    ]);
  };

  const saveOpportunityFeedback = () => {
    if (!pendingBrainFeedback?.id || !brainFeedbackReason) return;
    const recordedAt = new Date().toISOString();
    const family = pendingBrainFeedback.family || businessBrainOpportunityFamily(pendingBrainFeedback.id);
    const feedback = {
      id: `brain-feedback-${Date.now()}`,
      opportunityId: pendingBrainFeedback.id,
      family,
      title: pendingBrainFeedback.title || "",
      service: pendingBrainFeedback.service || "",
      reason: brainFeedbackReason,
      signal: "dismissed",
      penalty: businessBrainFeedbackPenalty(brainFeedbackReason),
      recordedAt,
    };
    setBusinessBrainFeedback((items) => [...items, feedback]);

    if (brainFeedbackReason === "Don't suggest this again") {
      setBusinessBrainRules((rules) => [
        ...rules,
        {
          id: `brain-rule-${Date.now()}`,
          text: `Don't suggest ${businessBrainFamilyLabel(family)} again unless I remove this rule.`,
          source: "Owner feedback",
          scope: "Recommendations",
          confidence: "Owner-set",
          kind: "block-opportunity",
          targetFamilies: [family],
          targetService: pendingBrainFeedback.service || "",
          createdAt: recordedAt,
        },
      ]);
    }

    setDismissedOpportunities((items) =>
      items.includes(pendingBrainFeedback.id)
        ? items
        : [...items, pendingBrainFeedback.id]
    );
    setPendingBrainFeedback(null);
    setBrainFeedbackReason("");
    jump("home", "Home");
  };

  const hasActiveCustomerWork = (customerId) =>
    isActiveCustomerAction(replyActions[customerId]);

  const buildReactivationMessages = (limit = campaignRecipientLimit) => {
    const goalServiceName =
      activeWorkGoal?.serviceName ||
      services.find((item) => item.id === activeWorkGoal?.serviceId)?.name ||
      "";
    const eligible = customerContact
      ? customers
          .filter(
            (customer) =>
              isEligibleCustomer(customer, services, verticalId) &&
              !hasActiveCustomerWork(customer.id) &&
              (!activeWorkGoal || !goalServiceName || customer.service === goalServiceName)
          )
          .sort((a, b) => {
            const aOverdue = monthsSince(a.lastServiceDate) - Number(repeatMonthsForCustomer(a, services, verticalId) || 0);
            const bOverdue = monthsSince(b.lastServiceDate) - Number(repeatMonthsForCustomer(b, services, verticalId) || 0);
            if (bOverdue !== aOverdue) return bOverdue - aOverdue;
            return (Number(b.lastJobValue) || 0) - (Number(a.lastJobValue) || 0);
          })
          .slice(0, Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : undefined)
      : [];
    const groups = groupCustomersByService(eligible);
    const slotText = (quietSlot || "a quiet slot").toLowerCase();
    const drafts = {};

    Object.keys(groups).forEach((service) => {
      drafts[service] =
        `Hi, we’ve got a slot free ${slotText} for ${service.toLowerCase()}. If you’d like a quote or want to book it, just reply here.`;
    });

    return drafts;
  };

  const resetReactivationMessages = () => {
    setServiceMessages(buildReactivationMessages(campaignRecipientLimit));
  };

  const startCampaign = (stage = 0, recipientLimit = null) => {
    const safeStage = Math.max(0, Math.min(stage, campaignSteps.length - 1));
    setCampaignStage(safeStage);

    if (safeStage === 0) {
      const nextLimit = Number.isFinite(Number(recipientLimit)) && Number(recipientLimit) > 0 ? Number(recipientLimit) : null;
      setCampaignRecipientLimit(nextLimit);
      const drafts = buildReactivationMessages(nextLimit);
      setServiceMessages(drafts);
      setMessage(Object.values(drafts)[0] || campaignSteps[0].message);
    } else if (safeStage === 1) {
      setMessage(`Hi, you asked us about ${trade.toLowerCase()} a little while ago. We’ve got some availability coming up and I wanted to check whether you still wanted a quote. No problem if not.`);
    } else {
      setMessage(campaignSteps[safeStage].message);
    }
    go("checkSend");
  };

  const simulateCurrentSend = () => {
    if (campaignStage === 0) {
      const goalServiceName =
        activeWorkGoal?.serviceName ||
        services.find((item) => item.id === activeWorkGoal?.serviceId)?.name ||
        "";
      const recipients = customerContact
        ? customers
            .filter(
              (customer) =>
                isEligibleCustomer(customer, services, verticalId) &&
                !hasActiveCustomerWork(customer.id) &&
                (!activeWorkGoal || !goalServiceName || customer.service === goalServiceName)
            )
            .sort((a, b) => {
              const aOverdue = monthsSince(a.lastServiceDate) - Number(repeatMonthsForCustomer(a, services, verticalId) || 0);
              const bOverdue = monthsSince(b.lastServiceDate) - Number(repeatMonthsForCustomer(b, services, verticalId) || 0);
              if (bOverdue !== aOverdue) return bOverdue - aOverdue;
              return (Number(b.lastJobValue) || 0) - (Number(a.lastJobValue) || 0);
            })
            .slice(0, Number.isFinite(Number(campaignRecipientLimit)) && Number(campaignRecipientLimit) > 0 ? Number(campaignRecipientLimit) : undefined)
        : [];
      const recipientIds = new Set(recipients.map((customer) => customer.id));
      setLastSimulatedRecipients(recipients.map((customer) => ({ ...customer })));
      recordWorkGoalAttempt({
        key: `reactivation:${recipients.map((customer) => customer.id).sort().join(",")}`,
        type: "reactivation",
        label: `Previous customers • ${recipients.length} contacted`,
        recipientIds: recipients.map((customer) => customer.id),
        service: goalServiceName || "",
        cost: 0,
      });
      setReactivationRuns((runs) => [
        ...runs,
        {
          id: `reactivation-${Date.now()}`,
          sentAt: new Date().toISOString(),
          recipientIds: recipients.map((customer) => customer.id),
          recipients: recipients.map((customer) => ({
            id: customer.id,
            service: customer.service || "",
          })),
        },
      ]);
      setReplyActions((current) =>
        Object.fromEntries(
          Object.entries(current).filter(
            ([id, action]) =>
              !(recipientIds.has(id) && action?.origin === "simulated" && !action?.done)
          )
        )
      );
    }
    go("progress");
  };


  const appendCustomerActivity = (customerId, event = {}) => {
    setCustomers((current) =>
      current.map((customer) => {
        if (customer.id !== customerId) return customer;
        const activity = Array.isArray(customer.activity) ? customer.activity : [];
        return {
          ...customer,
          lastActivityAt: event.createdAt || new Date().toISOString(),
          lastActivityKind: event.kind || "note",
          activity: [
            ...activity,
            {
              id: event.id || `activity-${customerId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              kind: event.kind || "note",
              date: event.date || dateToISO(new Date()),
              createdAt: event.createdAt || new Date().toISOString(),
              title: event.title || "Customer update",
              note: event.note || "",
              value: event.value ?? "",
            },
          ],
        };
      })
    );
  };

  const saveReplyAction = (customerId, task, type, origin = "simulated") => {
    setReplyActions((current) => ({
      ...current,
      [customerId]: {
        ...(current[customerId] || {}),
        task,
        type: type || current[customerId]?.type || null,
        origin: current[customerId]?.origin || origin,
        createdAt: current[customerId]?.createdAt || new Date().toISOString(),
        done: current[customerId]?.done || false,
      },
    }));
  };

  const loadReplyActionForm = (customerId, type) => {
    const customer =
      customers.find((item) => item.id === customerId) ||
      lastSimulatedRecipients.find((item) => item.id === customerId);
    const saved = replyActions[customerId];
    if (!customer) return false;

    if (type === "quote") {
      const service = services.find((item) => item.name === customer.service);
      const fallbackAmount =
        Number(customer.lastJobValue) > 0 ? customer.lastJobValue : service?.value || "";
      const amount = saved?.details?.quoteAmount ?? fallbackAmount;
      setActionQuoteAmount(String(amount || ""));
      setActionQuoteMessage(
        saved?.details?.message ||
          `Hi ${customer.name.split(" ")[0]}, thanks for getting back to us. The quote for ${customer.service.toLowerCase()} is £${amount || "—"}. Let me know if you’d like to go ahead.`
      );
      setActionQuoteSentDate(
        saved?.details?.quoteSentAt
          ? String(saved.details.quoteSentAt).slice(0, 10)
          : dateToISO(new Date())
      );
    } else if (type === "booking") {
      setActionBookingDate(saved?.details?.bookingDate || nextDateForSlot(quietSlot));
      setActionBookingTime(saved?.details?.bookingTime || defaultTimeForSlot(quietSlot));
      const service = services.find((item) => item.name === customer.service);
      const fallbackJobValue =
        saved?.details?.jobValue ??
        saved?.details?.sourceQuoteAmount ??
        customer.lastJobValue ??
        service?.value ??
        "";
      setActionJobValue(String(fallbackJobValue || ""));
      setActionJobNote(saved?.details?.completionNote || "");
    } else if (type === "reminder") {
      setActionReminderDate(saved?.details?.reminderDate || addDaysISO(30));
    }
    return true;
  };

  const beginReplyAction = (customerId, suggested) => {
    const customer =
      customers.find((item) => item.id === customerId) ||
      lastSimulatedRecipients.find((item) => item.id === customerId);
    if (!customer || !suggested) return;

    saveReplyAction(customerId, suggested.task, suggested.type, "simulated");
    setSelectedReplyActionId(customerId);
    loadReplyActionForm(customerId, suggested.type);
    go("replyActionDetail");
  };

  const openSavedReplyAction = (customerId) => {
    const saved = replyActions[customerId];
    if (!saved) return;
    setSelectedReplyActionId(customerId);
    loadReplyActionForm(customerId, saved.type);
    go("replyActionDetail");
  };

  const startDirectCustomerAction = (customerId, type) => {
    const customer = customers.find((item) => item.id === customerId);
    if (!customer || !["quote", "booking", "reminder"].includes(type)) return;
    const task =
      type === "quote"
        ? "Prepare and send a quote"
        : type === "booking"
        ? "Confirm the booking"
        : "Save a follow-up reminder";

    loadReplyActionForm(customerId, type);
    setReplyActions((current) => ({
      ...current,
      [customerId]: {
        task,
        type,
        origin: "manual",
        createdAt: new Date().toISOString(),
        done: false,
        details: {},
      },
    }));
    setSelectedReplyActionId(customerId);
    appendCustomerActivity(customerId, {
      kind: type,
      title:
        type === "quote"
          ? "Quote started"
          : type === "booking"
          ? "Booking started"
          : "Follow-up started",
      note: "Started directly from the customer record.",
    });
    go("replyActionDetail");
  };

  const openCustomer = (customerId) => {
    const customer = customers.find((item) => item.id === customerId);
    if (!customer) return;
    setSelectedCustomerId(customerId);
    go("customerDetail");
  };

  const updateReplyAction = (customerId, updater) => {
    setReplyActions((current) => {
      const existing = current[customerId];
      if (!existing) return current;
      const next = typeof updater === "function" ? updater(existing) : { ...existing, ...updater };
      return { ...current, [customerId]: next };
    });
  };

  const setQuoteStatus = (customerId, quoteStatus) => {
    const actionBefore = replyActions[customerId];
    updateReplyAction(customerId, (action) => ({
      ...action,
      done: true,
      details: {
        ...(action.details || {}),
        quoteStatus,
        quoteSentAt:
          quoteStatus === "Sent"
            ? new Date(`${actionQuoteSentDate || dateToISO(new Date())}T12:00:00`).toISOString()
            : action.details?.quoteSentAt,
        followUpDueDate:
          quoteStatus === "Sent"
            ? addDaysFromISO(actionQuoteSentDate || dateToISO(new Date()), 7)
            : action.details?.followUpDueDate,
        summary:
          quoteStatus === "Prepared"
            ? `Quote prepared for £${action.details?.quoteAmount || "—"}`
            : quoteStatus === "Sent"
            ? `Quote marked sent for £${action.details?.quoteAmount || "—"}`
            : quoteStatus === "Accepted"
            ? `Quote accepted for £${action.details?.quoteAmount || "—"}`
            : `Quote declined for £${action.details?.quoteAmount || "—"}`,
      },
      completedAt: new Date().toISOString(),
    }));
    setCustomers((list) =>
      list.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              lifecycleStatus:
                quoteStatus === "Sent"
                  ? "Quote sent"
                  : quoteStatus === "Accepted"
                  ? "Quote accepted"
                  : quoteStatus === "Declined"
                  ? "Quote declined"
                  : "Quote prepared",
              lastActivityAt: new Date().toISOString(),
              lastActivityKind: "quote",
            }
          : customer
      )
    );
    appendCustomerActivity(customerId, {
      kind: "quote",
      title: `Quote ${quoteStatus.toLowerCase()}`,
      note:
        quoteStatus === "Sent"
          ? "Marked as sent. The prototype records the status but does not send the quote itself."
          : quoteStatus === "Accepted"
          ? "Customer accepted the quote."
          : quoteStatus === "Declined"
          ? "Customer declined the quote."
          : "Quote saved as prepared.",
      value: actionBefore?.details?.quoteAmount || "",
    });
  };

  const convertQuoteToBooking = (customerId) => {
    const action = replyActions[customerId];
    const customer = customers.find((item) => item.id === customerId) ||
      lastSimulatedRecipients.find((item) => item.id === customerId);
    if (!action || !customer) return;
    const quoteAmount = action.details?.quoteAmount || customer.lastJobValue || "";
    const bookingDate = nextDateForSlot(quietSlot);
    const bookingTime = defaultTimeForSlot(quietSlot);
    setReplyActions((current) => ({
      ...current,
      [customerId]: {
        ...action,
        type: "booking",
        task: "Confirm the booking time",
        done: false,
        details: {
          sourceQuoteAmount: quoteAmount,
          sourceQuoteStatus: "Accepted",
          bookingDate,
          bookingTime,
          bookingStatus: "Draft",
          summary: `Accepted quote £${quoteAmount || "—"} ready to book`,
        },
      },
    }));
    setCustomers((list) =>
      list.map((item) =>
        item.id === customerId
          ? {
              ...item,
              lifecycleStatus: "Booking being arranged",
              lastActivityAt: new Date().toISOString(),
              lastActivityKind: "booking",
            }
          : item
      )
    );
    setSelectedReplyActionId(customerId);
    setActionBookingDate(bookingDate);
    setActionBookingTime(bookingTime);
    setActionJobValue(String(quoteAmount || ""));
    appendCustomerActivity(customerId, {
      kind: "booking",
      title: "Accepted quote moved to booking",
      note: `Quote value £${quoteAmount || "—"} is ready to schedule.`,
      value: quoteAmount || "",
    });
  };

  const setBookingStatus = (customerId, bookingStatus) => {
    const actionBefore = replyActions[customerId];
    updateReplyAction(customerId, (action) => ({
      ...action,
      done: true,
      details: {
        ...(action.details || {}),
        bookingStatus,
        summary:
          bookingStatus === "Cancelled"
            ? `Booking cancelled for ${formatUKDate(action.details?.bookingDate)} at ${action.details?.bookingTime || "—"}`
            : `Booking set for ${formatUKDate(action.details?.bookingDate)} at ${action.details?.bookingTime || "—"}`,
      },
      completedAt: new Date().toISOString(),
    }));
    setCustomers((list) =>
      list.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              lifecycleStatus:
                bookingStatus === "Confirmed"
                  ? "Booked"
                  : bookingStatus === "Cancelled"
                  ? "Booking cancelled"
                  : customer.lifecycleStatus,
              lastActivityAt: new Date().toISOString(),
              lastActivityKind: "booking",
            }
          : customer
      )
    );
    appendCustomerActivity(customerId, {
      kind: "booking",
      title: `Booking ${bookingStatus.toLowerCase()}`,
      note: actionBefore?.details?.bookingDate
        ? `${formatUKDate(actionBefore.details.bookingDate)} at ${actionBefore.details.bookingTime || "time not set"}`
        : "",
      value: actionBefore?.details?.sourceQuoteAmount || actionBefore?.details?.jobValue || "",
    });
  };

  const markBookingCompleted = (customerId, jobValue, completionNote = "") => {
    const action = replyActions[customerId];
    if (!action?.details?.bookingDate) return null;
    const amount = Number(jobValue) || Number(action.details?.sourceQuoteAmount) || 0;
    const cleanNote = String(completionNote || "").trim();
    const jobId = `job-${customerId}-${action.details.bookingDate}`;
    setReplyActions((current) => ({
      ...current,
      [customerId]: {
        ...current[customerId],
        done: true,
        details: {
          ...(current[customerId]?.details || {}),
          bookingStatus: "Completed",
          jobValue: amount || "",
          completionNote: cleanNote,
          jobCompletedAt: new Date().toISOString(),
          summary: `Job completed${amount ? ` for £${amount}` : ""} on ${formatUKDate(action.details.bookingDate)}`,
        },
        completedAt: new Date().toISOString(),
      },
    }));
    setCustomers((current) =>
      current.map((customer) => {
        if (customer.id !== customerId) return customer;
        const history = Array.isArray(customer.history) ? customer.history : [];
        const duplicate = history.some(
          (item) => item.kind === "job" && item.date === action.details.bookingDate && item.service === customer.service
        );
        const firstName = String(customer.name || "").split(" ")[0] || "there";
        const serviceName = customer.service || "job";
        const repeatDueDate = nextRepeatDueDate(
          { ...customer, lastServiceDate: action.details.bookingDate },
          services,
          verticalId
        );
        const preparedReviewDraft =
          customer.contactOk === false
            ? ""
            : `Hi ${firstName}, thanks again for choosing us for your ${serviceName.toLowerCase()}. If you were happy with the work, would you mind leaving us a quick review? No problem at all if not — we really appreciate the business.`;
        const preparedAt = new Date().toISOString();
        const preparedJob = {
          id: jobId,
          kind: "job",
          date: action.details.bookingDate,
          service: serviceName,
          value: amount || "",
          note: cleanNote || "Completed through BUSY DOES IT prototype",
          photos: [],
          sourceOrigin: action.origin || "manual",
          sourceAction: action.details?.sourceQuoteStatus ? "quote-to-booking" : "booking",
          repeatDueDate: repeatDueDate || "",
          reviewRequestDraft: preparedReviewDraft,
          reviewRequestPreparedAt: preparedReviewDraft ? preparedAt : null,
          adminPreparedAt: preparedAt,
        };
        const nextHistory = duplicate
          ? history.map((item) =>
              item.kind === "job" &&
              item.date === action.details.bookingDate &&
              item.service === customer.service
                ? {
                    ...item,
                    repeatDueDate: item.repeatDueDate || repeatDueDate || "",
                    reviewRequestDraft: item.reviewRequestDraft || preparedReviewDraft,
                    reviewRequestPreparedAt:
                      item.reviewRequestPreparedAt ||
                      (preparedReviewDraft ? preparedAt : null),
                    adminPreparedAt: item.adminPreparedAt || preparedAt,
                  }
                : item
            )
          : [...history, preparedJob];
        const activity = Array.isArray(customer.activity) ? customer.activity : [];
        return {
          ...customer,
          lastServiceDate: action.details.bookingDate,
          lastJobValue: amount || customer.lastJobValue,
          nextRepeatDueDate: repeatDueDate || "",
          lifecycleStatus: "Completed customer",
          lastActivityAt: preparedAt,
          lastActivityKind: "job",
          history: nextHistory,
          activity: [
            ...activity,
            {
              id: `completed-${customerId}-${action.details.bookingDate}`,
              kind: "job",
              date: action.details.bookingDate,
              createdAt: preparedAt,
              title: "Job completed",
              note:
                cleanNote ||
                `${serviceName} completed. BUSY DOES IT also prepared the sensible follow-on admin in the background.`,
              value: amount || "",
            },
          ],
        };
      })
    );
    return jobId;
  };

  const startJobPhotoPrompt = (customerId, jobId) => {
    setSelectedCustomerId(customerId);
    setSelectedJobId(jobId);
    setPendingJobPhotos([]);
    setJobPhotosMarketingOk(false);
    setJobPostDraft("");
    setTab("Work");
    go("jobCompletePhotos");
  };

  const openJobAssets = (customerId, jobId) => {
    const customer = customers.find((item) => item.id === customerId);
    const job = (customer?.history || []).find((item) => item.id === jobId);
    const photos = Array.isArray(job?.photos) ? job.photos : [];
    setSelectedCustomerId(customerId);
    setSelectedJobId(jobId);
    setPendingJobPhotos(photos.map((photo) => ({ ...photo })));
    setJobPhotosMarketingOk(photos.length > 0 && photos.every((photo) => !!photo.marketingOk));
    setJobPostDraft(job?.postDraft || "");
    go("jobPhotos");
  };

  const openJobPhotoOpportunity = (customerId, jobId) => {
    const customer = customers.find((item) => item.id === customerId);
    const job = (customer?.history || []).find((item) => item.id === jobId);
    const photos = Array.isArray(job?.photos) ? job.photos : [];
    setSelectedCustomerId(customerId);
    setSelectedJobId(jobId);
    setPendingJobPhotos(photos.map((photo) => ({ ...photo })));
    setJobPhotosMarketingOk(photos.some((photo) => !!photo.marketingOk));
    setJobPostDraft(job?.postDraft || "");
    go("jobPhotoOpportunity");
  };

  const openPostJobBundle = (customerId, jobId) => {
    setSelectedCustomerId(customerId);
    setSelectedJobId(jobId);
    go("postJobBundle");
  };

  const preparePostJobBundle = () => {
    if (!selectedCustomerId || !selectedJobId) return;
    const preparedAt = new Date().toISOString();
    setCustomers((list) =>
      list.map((customer) => {
        if (customer.id !== selectedCustomerId) return customer;
        const history = Array.isArray(customer.history) ? customer.history : [];
        const job = history.find((item) => item.id === selectedJobId);
        if (!job) return customer;

        const firstName = String(customer.name || "").split(" ")[0] || "there";
        const serviceName = job.service || customer.service || "job";
        const repeatDue =
          customer.nextRepeatDueDate ||
          job.repeatDueDate ||
          nextRepeatDueDate(
            { ...customer, lastServiceDate: job.date || customer.lastServiceDate },
            services,
            verticalId
          ) ||
          "";
        const approvedPhotos = (Array.isArray(job.photos) ? job.photos : []).filter(
          (photo) => photo.marketingOk
        );
        const reviewDraft =
          customer.contactOk === false || job.reviewRequestSentAt
            ? job.reviewRequestDraft || ""
            : job.reviewRequestDraft ||
              `Hi ${firstName}, thanks again for choosing us for your ${serviceName.toLowerCase()}. If you were happy with the work, would you mind leaving us a quick review? No problem at all if not — we really appreciate the business.`;
        const postDraft =
          approvedPhotos.length &&
          !["Published", "Simulated published"].includes(job.postDraftStatus)
            ? job.postDraft ||
              `Just finished another ${serviceName.toLowerCase()} job. If you need something similar, send us a message and we’ll take a look.`
            : job.postDraft || "";

        return {
          ...customer,
          nextRepeatDueDate: repeatDue || customer.nextRepeatDueDate || "",
          lastActivityAt: preparedAt,
          lastActivityKind: "business-brain-bundle",
          history: history.map((item) =>
            item.id === selectedJobId
              ? {
                  ...item,
                  repeatDueDate: repeatDue || item.repeatDueDate || "",
                  reviewRequestDraft: reviewDraft,
                  reviewRequestPreparedAt:
                    reviewDraft && !item.reviewRequestPreparedAt
                      ? preparedAt
                      : item.reviewRequestPreparedAt,
                  postDraft,
                  postDraftPreparedAt:
                    postDraft && !item.postDraftPreparedAt
                      ? preparedAt
                      : item.postDraftPreparedAt,
                  postDraftStatus:
                    postDraft && !item.postDraftStatus
                      ? "Prepared"
                      : item.postDraftStatus,
                  adminBundlePreparedAt: preparedAt,
                }
              : item
          ),
        };
      })
    );
  };

  const chooseJobPhotos = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.8,
      });
      if (result.canceled) return;
      const picked = (result.assets || []).map((asset, index) => ({
        id: asset.assetId || `photo-${Date.now()}-${index}`,
        uri: asset.uri,
        fileName: asset.fileName || "",
        width: asset.width || 0,
        height: asset.height || 0,
        marketingOk: jobPhotosMarketingOk,
      }));
      setPendingJobPhotos((current) => {
        const merged = [...current];
        picked.forEach((photo) => {
          if (!merged.some((item) => item.uri === photo.uri)) merged.push(photo);
        });
        return merged.slice(0, 5);
      });
    } catch (error) {
      Alert.alert("Could not open photos", "Please try again. No photo access has been changed.");
    }
  };

  const removePendingJobPhoto = (photoId) => {
    setPendingJobPhotos((current) => current.filter((photo) => photo.id !== photoId));
  };

  const saveJobPhotos = () => {
    if (!selectedJobId || !selectedCustomerId) return;
    const savedAt = new Date().toISOString();
    const currentCustomer = customers.find((item) => item.id === selectedCustomerId);
    const currentJob = (currentCustomer?.history || []).find((item) => item.id === selectedJobId);
    const photos = pendingJobPhotos.map((photo) => ({
      ...photo,
      marketingOk: !!jobPhotosMarketingOk,
      attachedAt: photo.attachedAt || savedAt,
    }));
    const serviceName = currentJob?.service || currentCustomer?.service || "job";
    const automaticPostDraft =
      photos.length && jobPhotosMarketingOk
        ? currentJob?.postDraft ||
          `Just finished another ${serviceName.toLowerCase()} job. If you need something similar, send us a message and we’ll take a look.`
        : currentJob?.postDraft || "";

    if (automaticPostDraft) setJobPostDraft(automaticPostDraft);

    setCustomers((list) =>
      list.map((customer) => {
        if (customer.id !== selectedCustomerId) return customer;
        const history = (customer.history || []).map((item) =>
          item.id === selectedJobId
            ? {
                ...item,
                photos,
                postDraft: automaticPostDraft || item.postDraft || "",
                postDraftPreparedAt:
                  automaticPostDraft
                    ? item.postDraftPreparedAt || savedAt
                    : item.postDraftPreparedAt,
                postDraftStatus:
                  automaticPostDraft
                    ? item.postDraftStatus || "Prepared"
                    : item.postDraftStatus,
                adminPreparedAt:
                  automaticPostDraft ? item.adminPreparedAt || savedAt : item.adminPreparedAt,
              }
            : item
        );
        return {
          ...customer,
          lastActivityAt: savedAt,
          lastActivityKind: "photos",
          history,
        };
      })
    );
    appendCustomerActivity(selectedCustomerId, {
      kind: "photos",
      title: "Job photos updated",
      note: photos.length
        ? `${photos.length} photo${photos.length === 1 ? "" : "s"} attached to the completed job. ${
            jobPhotosMarketingOk
              ? "BUSY DOES IT also prepared a finished-job post draft for review. Nothing is posted automatically."
              : "They are kept private to the job unless you change the setting later."
          }`
        : "Job photos removed.",
    });
    if (photos.length && jobPhotosMarketingOk) {
      go("postJobBundle");
    } else {
      openCustomer(selectedCustomerId);
    }
  };

  const defaultJobPostChannels = () => ({
    facebook:
      !!socialPreferredChannels.facebook &&
      socialPublishingStatus?.connections?.meta?.status === "connected",
    instagram:
      !!socialPreferredChannels.instagram &&
      socialPublishingStatus?.connections?.meta?.status === "connected" &&
      !!socialPublishingStatus?.connections?.meta?.instagramUserId,
    googleBusiness:
      !!socialPreferredChannels.googleBusiness &&
      socialPublishingStatus?.connections?.google_business?.status === "connected",
  });

  const rememberSocialChannels = (channels = []) => {
    const selected = new Set(Array.isArray(channels) ? channels : []);
    setSocialPreferredChannels({
      facebook: selected.has("Facebook"),
      instagram: selected.has("Instagram"),
      googleBusiness: selected.has("Google Business"),
    });
  };

  const buildPersistentSnapshot = () => ({
    onboardingComplete,
    businessName,
    trade,
    verticalId,
    postcode,
    radius,
    quietSlot,
    quietSlotConfirmed,
    activeWorkGoal,
    unansweredReviewCount,
    recentPhotoCountNeeded,
    customers,
    lastSimulatedRecipients,
    reactivationRuns,
    replyActions,
    services,
    alwaysAsk,
    customerContact,
    testLimit,
    weeklyLimit,
    connectedAccounts,
    dismissedOpportunities,
    selectedServiceId,
    intakeLog,
    inboxItems,
    connectionSyncLog,
    socialDrafts,
    socialPreferredChannels,
    businessBrainRules,
    businessBrainFeedback,
    proactiveNoticeState,
    recordFilingMode,
    advanced,
  });

  const applyCloudSnapshot = (saved) => {
    if (!saved || typeof saved !== "object") return;
    if (typeof saved.onboardingComplete === "boolean") setOnboardingComplete(saved.onboardingComplete);
    if (saved.businessName) setBusinessName(saved.businessName);
    if (saved.trade) setTrade(saved.trade);
    const savedVerticalId = saved.verticalId || "exterior-cleaning";
    setVerticalId(savedVerticalId);
    if (saved.postcode) setPostcode(saved.postcode);
    if (saved.radius) setRadius(saved.radius);
    if (saved.quietSlot) setQuietSlot(saved.quietSlot);
    if (typeof saved.quietSlotConfirmed === "boolean") setQuietSlotConfirmed(saved.quietSlotConfirmed);
    if (saved.activeWorkGoal && typeof saved.activeWorkGoal === "object") {
      setActiveWorkGoal(saved.activeWorkGoal);
      if (saved.activeWorkGoal.label) setSelectedGap(saved.activeWorkGoal.label);
      if (saved.activeWorkGoal.targetJobs) {
        setWorkGoalTargetDraft(Number(saved.activeWorkGoal.targetJobs) || 1);
      }
    } else if (saved.activeWorkGoal === null) {
      setActiveWorkGoal(null);
    }
    if (saved.unansweredReviewCount !== undefined) setUnansweredReviewCount(String(saved.unansweredReviewCount));
    if (saved.recentPhotoCountNeeded !== undefined) setRecentPhotoCountNeeded(String(saved.recentPhotoCountNeeded));
    if (Array.isArray(saved.customers)) setCustomers(saved.customers);
    if (Array.isArray(saved.lastSimulatedRecipients)) setLastSimulatedRecipients(saved.lastSimulatedRecipients);
    if (Array.isArray(saved.reactivationRuns)) setReactivationRuns(saved.reactivationRuns);
    if (saved.replyActions && typeof saved.replyActions === "object") setReplyActions(saved.replyActions);
    if (Array.isArray(saved.services)) {
      const pack = getVerticalPack(savedVerticalId);
      setServices(
        saved.services.map((item) => {
          const packService = pack.services.find((candidate) => candidate.name === item.name);
          return {
            ...item,
            repeatMonths:
              item.repeatMonths !== undefined
                ? item.repeatMonths
                : packService?.repeatMonths ?? pack.defaultRepeatMonths,
            durationHours:
              Number(item.durationHours) > 0
                ? Number(item.durationHours)
                : Number(packService?.durationHours) > 0
                ? Number(packService.durationHours)
                : 2,
          };
        })
      );
    }
    if (typeof saved.alwaysAsk === "boolean") setAlwaysAsk(saved.alwaysAsk);
    if (typeof saved.customerContact === "boolean") setCustomerContact(saved.customerContact);
    if (saved.testLimit) setTestLimit(saved.testLimit);
    if (saved.weeklyLimit) setWeeklyLimit(saved.weeklyLimit);
    if (saved.connectedAccounts) setConnectedAccounts({ ...connectionSeed, ...saved.connectedAccounts });
    if (Array.isArray(saved.dismissedOpportunities)) setDismissedOpportunities(saved.dismissedOpportunities);
    if (saved.selectedServiceId) setSelectedServiceId(saved.selectedServiceId);
    if (Array.isArray(saved.intakeLog)) setIntakeLog(saved.intakeLog);
    if (Array.isArray(saved.inboxItems)) setInboxItems(saved.inboxItems);
    if (Array.isArray(saved.connectionSyncLog)) setConnectionSyncLog(saved.connectionSyncLog);
    if (Array.isArray(saved.socialDrafts)) setSocialDrafts(saved.socialDrafts);
    if (saved.socialPreferredChannels && typeof saved.socialPreferredChannels === "object") {
      setSocialPreferredChannels({
        facebook: !!saved.socialPreferredChannels.facebook,
        instagram: !!saved.socialPreferredChannels.instagram,
        googleBusiness: !!saved.socialPreferredChannels.googleBusiness,
      });
    }
    if (Array.isArray(saved.businessBrainRules)) setBusinessBrainRules(saved.businessBrainRules);
    if (Array.isArray(saved.businessBrainFeedback)) setBusinessBrainFeedback(saved.businessBrainFeedback);
    if (saved.proactiveNoticeState && typeof saved.proactiveNoticeState === "object") {
      setProactiveNoticeState(saved.proactiveNoticeState);
    }
    if (Array.isArray(saved.busyCommandHistory)) {
      setBusyCommandHistory(saved.busyCommandHistory.slice(0, 20));
    }
    if (Array.isArray(saved.busyConversationTurns)) {
      setBusyConversationTurns(saved.busyConversationTurns.slice(-18));
    }
    if (saved.busyOperatorSnapshot && typeof saved.busyOperatorSnapshot === "object") {
      setBusyOperatorSnapshot(saved.busyOperatorSnapshot);
    }
    if (Array.isArray(saved.busyActionAudit)) {
      setBusyActionAudit(saved.busyActionAudit.slice(0, 30));
    }
    if (saved.recordFilingMode === "review" || saved.recordFilingMode === "safe") {
      setRecordFilingMode(saved.recordFilingMode);
    }
    if (typeof saved.advanced === "boolean") setAdvanced(saved.advanced);
    if (saved.onboardingComplete) {
      setScreen("home");
      setTab("Home");
    }
  };

  const persistOwnerSession = async (session) => {
    setOwnerSession(session);
    if (session?.accessToken) {
      await SecureStore.setItemAsync(OWNER_SESSION_KEY, JSON.stringify(session));
    } else {
      await SecureStore.deleteItemAsync(OWNER_SESSION_KEY);
    }
  };

  const ownerAccessToken = async () => {
    if (!ownerSession?.accessToken) return "";
    if (Number(ownerSession.expiresAt || 0) > Date.now() + 60_000) {
      return ownerSession.accessToken;
    }
    if (!ownerSession.refreshToken) {
      await persistOwnerSession(null);
      return "";
    }
    try {
      const data = await busyAuthRequest("token?grant_type=refresh_token", {
        body: { refresh_token: ownerSession.refreshToken },
      });
      const refreshed = ownerSessionFromPayload(data);
      if (!refreshed) throw new Error("Owner session could not be refreshed.");
      await persistOwnerSession(refreshed);
      return refreshed.accessToken;
    } catch (error) {
      const status = Number(error?.status || 0);
      const message = String(error?.message || "").toLowerCase();
      const definitelyInvalid =
        status === 400 ||
        status === 401 ||
        status === 403 ||
        message.includes("invalid_grant") ||
        message.includes("refresh token");
      if (definitelyInvalid) {
        await persistOwnerSession(null);
        setOwnerAuthError("Your BUSY sign-in expired. Sign in again.");
      } else {
        setOwnerAuthError(
          "BUSY could not refresh your session because the server is unreachable. Your account remains on this device; reconnect and try again."
        );
      }
      return "";
    }
  };

  const signInOwner = async () => {
    const email = normalizeEmail(ownerEmail);
    if (!email || !email.includes("@")) {
      setOwnerAuthError("Enter the email address for this BUSY account.");
      return false;
    }
    if (!ownerPassword || ownerPassword.length < 6) {
      setOwnerAuthError("Enter the password for this BUSY account.");
      return false;
    }
    setOwnerAuthLoading(true);
    setOwnerAuthError("");
    setOwnerAuthNotice("");
    try {
      const data = await busyAuthRequest("token?grant_type=password", {
        body: { email, password: ownerPassword },
      });
      const session = ownerSessionFromPayload(data);
      if (!session) throw new Error("Supabase did not return an account session.");
      await persistOwnerSession(session);
      setOwnerEmail(session.email || email);
      setOwnerPassword("");
      setCloudInitialised(false);
      setCloudAttempted(false);
      setCloudConflict(null);
      setOwnerAuthNotice("Signed in. BUSY will restore this business from its secure cloud workspace.");
      return true;
    } catch (error) {
      setOwnerAuthError(error?.message || "Account sign-in failed.");
      return false;
    } finally {
      setOwnerAuthLoading(false);
    }
  };

  const createOwnerAccount = async () => {
    const email = normalizeEmail(ownerEmail);
    if (!email || !email.includes("@")) {
      setOwnerAuthError("Enter the email address you want to use for this BUSY account.");
      return false;
    }
    if (
      !ownerPassword ||
      ownerPassword.length < 10 ||
      !/[A-Za-z]/.test(ownerPassword) ||
      !/[0-9]/.test(ownerPassword)
    ) {
      setOwnerAuthError("Choose at least 10 characters with both a letter and a number.");
      return false;
    }
    setOwnerAuthLoading(true);
    setOwnerAuthError("");
    setOwnerAuthNotice("");
    try {
      const data = await busyAuthRequest("signup", {
        body: { email, password: ownerPassword },
      });
      const session = ownerSessionFromPayload(data);
      if (session) {
        await persistOwnerSession(session);
        setOwnerEmail(session.email || email);
        setOwnerPassword("");
        setCloudInitialised(false);
        setCloudAttempted(false);
        setCloudConflict(null);
        setOwnerAuthNotice("Account created and signed in. BUSY is creating a secure business workspace.");
      } else {
        setOwnerAuthNotice(
          `Account created for ${email}. Check that inbox for the Supabase confirmation email, then return here and sign in.`
        );
      }
      return true;
    } catch (error) {
      const message = error?.message || "Account could not be created.";
      setOwnerAuthError(
        /already|registered/i.test(message)
          ? "That account already exists. Use Sign in instead."
          : message
      );
      return false;
    } finally {
      setOwnerAuthLoading(false);
    }
  };

  const sendPasswordReset = async () => {
    const email = normalizeEmail(ownerEmail);
    if (!email || !email.includes("@")) {
      setOwnerAuthError("Enter your BUSY account email first.");
      return false;
    }
    setOwnerAuthLoading(true);
    setOwnerAuthError("");
    setOwnerAuthNotice("");
    try {
      await busyAuthRequest("recover", {
        body: { email },
      });
      setOwnerAuthNotice(
        `Password recovery email requested for ${email}. Check the inbox and junk folder.`
      );
      return true;
    } catch (error) {
      setOwnerAuthError(error?.message || "Password recovery email could not be sent.");
      return false;
    } finally {
      setOwnerAuthLoading(false);
    }
  };

  const initialiseBusinessCloud = async (sessionOverride = null) => {
    if (cloudInitialising) return false;
    setCloudInitialising(true);
    setCloudAttempted(false);
    setCloudConflict(null);
    setCloudSyncError("");
    setCloudSyncStatus("Connecting…");
    try {
      const session = sessionOverride || ownerSession;
      const token =
        session?.accessToken ||
        (await ownerAccessToken());
      if (!token) throw new Error("Sign in before connecting cloud data.");

      const userId = session?.userId || ownerSession?.userId || "";
      const userCacheKey = storageKeyForUser(userId);
      if (userCacheKey) {
        try {
          const cached = await AsyncStorage.getItem(userCacheKey);
          if (cached) applyCloudSnapshot(JSON.parse(cached));
        } catch (error) {
          // A bad cache must never block the cloud copy from restoring.
        }
      }

      const ensured = await busyDataRequest("rpc/busy_ensure_business", {
        method: "POST",
        token,
        body: { p_name: businessName || null },
      });
      const row = Array.isArray(ensured) ? ensured[0] : ensured;
      const businessId = row?.business_id;
      if (!businessId) throw new Error("BUSY could not create or find this business workspace.");

      const workspace = {
        businessId,
        name: row?.business_name || businessName || "My Business",
        role: row?.member_role || "owner",
      };
      setCloudWorkspace(workspace);

      const snapshots = await busyDataRequest(
        `busy_business_snapshots?business_id=eq.${encodeURIComponent(businessId)}&select=payload,schema_version,revision,updated_at`,
        { token }
      );
      const snapshot = Array.isArray(snapshots) ? snapshots[0] : snapshots;
      const payload =
        snapshot?.payload && typeof snapshot.payload === "object"
          ? snapshot.payload
          : null;
      const hasCloudData = payload && Object.keys(payload).length > 0;

      if (hasCloudData) {
        applyCloudSnapshot(payload);
        setCloudRevision(Number(snapshot?.revision) || 1);
        setCloudLastSyncedAt(snapshot?.updated_at || new Date().toISOString());
        setCloudConflict(null);
        setCloudSyncStatus("Cloud restored");
      } else {
        const localPayload = buildPersistentSnapshot();
        const saved = await busyDataRequest(
          "busy_business_snapshots?on_conflict=business_id",
          {
            method: "POST",
            token,
            prefer: "resolution=merge-duplicates,return=representation",
            body: {
              business_id: businessId,
              payload: localPayload,
              schema_version: CLOUD_SCHEMA_VERSION,
              revision: 1,
              updated_at: new Date().toISOString(),
            },
          }
        );
        const savedRow = Array.isArray(saved) ? saved[0] : saved;
        setCloudRevision(Number(savedRow?.revision) || 1);
        setCloudLastSyncedAt(savedRow?.updated_at || new Date().toISOString());
        setCloudConflict(null);
        setCloudSyncStatus("Local data backed up");
      }

      setCloudInitialised(true);
      return true;
    } catch (error) {
      setCloudSyncError(error?.message || "Cloud workspace could not be loaded.");
      setCloudSyncStatus("Cloud unavailable");
      return false;
    } finally {
      setCloudAttempted(true);
      setCloudInitialising(false);
    }
  };

  const fetchCloudSnapshot = async (tokenOverride = "") => {
    if (!cloudWorkspace?.businessId) return null;
    const token = tokenOverride || (await ownerAccessToken());
    if (!token) throw new Error("Sign in again before reading cloud data.");
    const rows = await busyDataRequest(
      `busy_business_snapshots?business_id=eq.${encodeURIComponent(
        cloudWorkspace.businessId
      )}&select=payload,schema_version,revision,updated_at`,
      { token }
    );
    return Array.isArray(rows) ? rows[0] || null : rows;
  };

  const saveBusinessCloud = async ({ quiet = false } = {}) => {
    if (!cloudWorkspace?.businessId || !ownerSession?.accessToken || !cloudInitialised) return false;
    if (!quiet) setCloudSyncStatus("Syncing…");
    setCloudSyncError("");
    try {
      const token = await ownerAccessToken();
      if (!token) throw new Error("Sign in again before syncing cloud data.");
      const expectedRevision = Math.max(1, Number(cloudRevision) || 1);
      const nextRevision = expectedRevision + 1;
      const now = new Date().toISOString();
      const saved = await busyDataRequest(
        `busy_business_snapshots?business_id=eq.${encodeURIComponent(
          cloudWorkspace.businessId
        )}&revision=eq.${expectedRevision}`,
        {
          method: "PATCH",
          token,
          prefer: "return=representation",
          body: {
            payload: buildPersistentSnapshot(),
            schema_version: CLOUD_SCHEMA_VERSION,
            revision: nextRevision,
            updated_at: now,
          },
        }
      );
      const savedRow = Array.isArray(saved) ? saved[0] : saved;
      if (!savedRow) {
        const remote = await fetchCloudSnapshot(token);
        setCloudConflict({
          remoteRevision: Number(remote?.revision) || 0,
          remoteUpdatedAt: remote?.updated_at || "",
        });
        setCloudSyncStatus("Newer cloud copy found");
        setCloudSyncError(
          "BUSY stopped this save because another device or session changed the cloud copy. Restore the latest cloud copy before continuing."
        );
        return false;
      }
      setCloudRevision(Number(savedRow?.revision) || nextRevision);
      setCloudLastSyncedAt(savedRow?.updated_at || now);
      setCloudConflict(null);
      setCloudSyncStatus("Up to date");
      return true;
    } catch (error) {
      setCloudSyncError(error?.message || "Cloud sync failed.");
      setCloudSyncStatus("Sync needs attention");
      return false;
    }
  };

  const syncCloudNow = async () => {
    if (!ownerSession?.accessToken) {
      setCloudSyncError("Sign in first.");
      setCloudSyncStatus("Local only");
      return false;
    }
    if (!cloudInitialised) return initialiseBusinessCloud();
    return saveBusinessCloud();
  };

  const restoreLatestCloudCopy = async () => {
    if (!ownerSession?.accessToken || !cloudWorkspace?.businessId) return false;
    setCloudInitialising(true);
    setCloudSyncError("");
    setCloudSyncStatus("Restoring…");
    try {
      const remote = await fetchCloudSnapshot();
      if (!remote?.payload || typeof remote.payload !== "object") {
        throw new Error("No cloud backup is available for this business yet.");
      }
      applyCloudSnapshot(remote.payload);
      setCloudRevision(Number(remote.revision) || 1);
      setCloudLastSyncedAt(remote.updated_at || new Date().toISOString());
      setCloudConflict(null);
      setCloudSyncStatus("Cloud restored");
      const key = storageKeyForUser(ownerSession.userId || "");
      if (key) {
        await AsyncStorage.setItem(key, JSON.stringify(remote.payload)).catch(() => {});
      }
      return true;
    } catch (error) {
      setCloudSyncError(error?.message || "Cloud restore failed.");
      setCloudSyncStatus("Restore needs attention");
      return false;
    } finally {
      setCloudInitialising(false);
    }
  };

  const confirmRestoreLatestCloudCopy = () => {
    Alert.alert(
      "Restore the latest cloud copy?",
      "This replaces the business data currently shown on this device with the latest saved cloud copy. Export first if you want to keep a copy of the current device data.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Restore cloud copy", onPress: restoreLatestCloudCopy },
      ]
    );
  };

  const exportBusinessData = async () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      appVersion: APP_VERSION,
      accountEmail: ownerSession?.email || ownerEmail || "",
      business: cloudWorkspace || null,
      cloudRevision: cloudRevision || null,
      data: buildPersistentSnapshot(),
    };
    try {
      await Share.share({
        title: `BUSY DOES IT data export • ${businessName || "Business"}`,
        message: JSON.stringify(exportPayload, null, 2),
      });
      setCloudSyncError("");
    } catch (error) {
      setCloudSyncError(error?.message || "Could not open the data export share sheet.");
    }
  };

  useEffect(() => {
    if (
      !hydrated ||
      !ownerAuthReady ||
      !ownerSession?.accessToken ||
      cloudInitialised ||
      cloudInitialising ||
      cloudAttempted
    ) return;
    initialiseBusinessCloud();
  }, [
    hydrated,
    ownerAuthReady,
    ownerSession?.accessToken,
    cloudInitialised,
    cloudInitialising,
    cloudAttempted,
  ]);

  useEffect(() => {
    if (
      !hydrated ||
      !cloudInitialised ||
      !cloudWorkspace?.businessId ||
      !ownerSession?.accessToken ||
      cloudConflict
    ) return;
    const timer = setTimeout(() => {
      saveBusinessCloud({ quiet: true });
    }, 1400);
    return () => clearTimeout(timer);
  }, [
    hydrated,
    cloudInitialised,
    cloudWorkspace?.businessId,
    ownerSession?.accessToken,
    cloudConflict,
    onboardingComplete,
    businessName,
    trade,
    verticalId,
    postcode,
    radius,
    quietSlot,
    quietSlotConfirmed,
    activeWorkGoal,
    unansweredReviewCount,
    recentPhotoCountNeeded,
    customers,
    lastSimulatedRecipients,
    reactivationRuns,
    replyActions,
    services,
    alwaysAsk,
    customerContact,
    testLimit,
    weeklyLimit,
    connectedAccounts,
    dismissedOpportunities,
    selectedServiceId,
    intakeLog,
    inboxItems,
    connectionSyncLog,
    socialDrafts,
    socialPreferredChannels,
    businessBrainRules,
    businessBrainFeedback,
    proactiveNoticeState,
    busyCommandHistory,
    busyConversationTurns,
    busyOperatorSnapshot,
    busyActionAudit,
    recordFilingMode,
    advanced,
  ]);

  const signOutOwner = async () => {
    if (cloudInitialised) {
      await saveBusinessCloud({ quiet: true });
    }
    await persistOwnerSession(null);
    setOwnerPassword("");
    setOwnerAuthError("");
    setOwnerAuthNotice("Signed out. Cloud data and live publishing controls are locked on this device.");
    setCloudWorkspace(null);
    setCloudInitialised(false);
    setCloudAttempted(false);
    setCloudConflict(null);
    setCloudSyncStatus("Local only");
    setCloudLastSyncedAt("");
    setCloudSyncError("");
    setCloudRevision(0);
    setSocialPublishingStatus((current) => ({
      ...current,
      loaded: false,
    }));
    await resetPrototype({ preserveUserCache: true });
  };

  const socialPublishRequest = async (action, payload = {}) => {
    const token = await ownerAccessToken();
    if (!token) {
      throw new Error("BUSY account sign-in is required for publishing controls.");
    }
    const requestId = busyRequestId(action || "social");
    const response = await fetchWithTimeout(
      BUSY_SOCIAL_PUBLISH_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: BUSY_AI_TOKEN,
          Authorization: `Bearer ${token}`,
          "X-BUSY-Request-ID": requestId,
        },
        body: JSON.stringify({ action, requestId, ...payload }),
      },
      action === "publish_now" || action === "retry_post" ? 45000 : 25000
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        await persistOwnerSession(null);
        setOwnerAuthError("Your BUSY sign-in expired. Sign in again before using live controls.");
      }
      const message =
        response.status === 429
          ? "That sensitive action was attempted too many times. BUSY has paused it briefly for safety."
          : data?.error || `BUSY publishing returned ${response.status}.`;
      const error = new Error(message);
      error.status = response.status;
      error.payload = data;
      error.requestId = requestId;
      throw error;
    }
    return { ...data, requestId };
  };

  const completeAccountClosure = async () => {
    const signedInEmail = normalizeEmail(ownerSession?.email || ownerEmail);
    if (accountClosurePhrase.trim() !== "DELETE") {
      setAccountClosureError('Type DELETE exactly to continue.');
      return false;
    }
    if (normalizeEmail(accountClosureEmail) !== signedInEmail) {
      setAccountClosureError("Enter the signed-in account email exactly.");
      return false;
    }

    setAccountClosureBusy(true);
    setAccountClosureError("");
    try {
      const currentUserCacheKey = storageKeyForUser(ownerSession?.userId || "");
      await socialPublishRequest("delete_account", {
        confirmation: "DELETE",
        confirmationEmail: signedInEmail,
      });

      await persistOwnerSession(null);
      if (currentUserCacheKey) {
        await AsyncStorage.removeItem(currentUserCacheKey).catch(() => {});
      }
      await resetPrototype({ preserveUserCache: true });
      setCloudWorkspace(null);
      setCloudInitialised(false);
      setCloudAttempted(false);
      setCloudConflict(null);
      setCloudSyncStatus("Local only");
      setCloudLastSyncedAt("");
      setCloudSyncError("");
      setCloudRevision(0);
      setConnectedAccounts(connectionSeed);
      setSocialPublishingStatus((current) => ({
        ...current,
        loaded: false,
        owner: { authenticated: false, email: "", businessId: "", role: "" },
        queue: [],
      }));
      setAccountClosurePhrase("");
      setAccountClosureEmail("");
      setOwnerPassword("");
      setOwnerAuthError("");
      setOwnerEmail(signedInEmail || DEFAULT_OWNER_EMAIL);
      setOwnerAuthNotice(
        "Your BUSY account and business workspace have been removed. You can create a new account at any time."
      );
      return true;
    } catch (error) {
      setAccountClosureError(error?.message || "BUSY could not complete account removal.");
      return false;
    } finally {
      setAccountClosureBusy(false);
    }
  };

  const confirmAccountClosure = () => {
    const signedInEmail = normalizeEmail(ownerSession?.email || ownerEmail);
    if (accountClosurePhrase.trim() !== "DELETE") {
      setAccountClosureError('Type DELETE exactly to continue.');
      return;
    }
    if (normalizeEmail(accountClosureEmail) !== signedInEmail) {
      setAccountClosureError("Enter the signed-in account email exactly.");
      return;
    }
    setAccountClosureError("");
    Alert.alert(
      "Remove this BUSY account permanently?",
      "This removes the account and its BUSY business data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove permanently",
          style: "destructive",
          onPress: completeAccountClosure,
        },
      ]
    );
  };

  const refreshSocialPublishingStatus = async ({ quiet = false } = {}) => {
    if (!quiet) setSocialPublishingLoading(true);
    setSocialPublishingError("");
    try {
      const data = await socialPublishRequest("status");
      const queue = Array.isArray(data.queue) ? data.queue : [];
      const publishingBusinessId = String(data?.owner?.businessId || "");
      const appBusinessId = String(cloudWorkspace?.businessId || "");
      if (
        publishingBusinessId &&
        appBusinessId &&
        publishingBusinessId !== appBusinessId
      ) {
        throw new Error(
          "BUSY blocked this publishing response because it belongs to a different business workspace."
        );
      }
      setSocialPublishingStatus({
        loaded: true,
        owner: data.owner || {
          authenticated: true,
          email: ownerSession?.email || "",
          businessId: appBusinessId,
          role: cloudWorkspace?.role || "",
        },
        credentials: data.credentials || {},
        connections: data.connections || {},
        queue,
      });
      if (queue.length) {
        const byDraft = new Map(queue.map((post) => [post.client_draft_id, post]));
        setSocialDrafts((items) =>
          items.map((draft) => {
            const post = byDraft.get(draft.id);
            if (!post) return draft;
            return {
              ...draft,
              status: post.status || draft.status,
              cloudMedia: Array.isArray(post.media) ? post.media : draft.cloudMedia || [],
              providerResults: post.provider_results || draft.providerResults || {},
              lastPublishError: post.last_error || "",
              scheduledAt: post.scheduled_for || draft.scheduledAt || null,
              publishedAt: post.published_at || draft.publishedAt || null,
              updatedAt: post.updated_at || draft.updatedAt,
            };
          })
        );
        setCustomers((list) =>
          list.map((customer) => {
            const relevant = queue.filter(
              (post) => post.source_customer_id === customer.id && post.source_job_id
            );
            if (!relevant.length) return customer;
            return {
              ...customer,
              history: (customer.history || []).map((job) => {
                const post = relevant.find((item) => item.source_job_id === job.id);
                if (!post) return job;
                const providerResults = post.provider_results || {};
                const selectedChannels = Array.isArray(post.channels) ? post.channels : [];
                const successfulChannels = selectedChannels.filter(
                  (channel) => providerResults[channel] && !providerResults[channel]?.error
                );
                return {
                  ...job,
                  postDraftStatus: post.status || job.postDraftStatus,
                  postChannels:
                    post.published_at && successfulChannels.length
                      ? successfulChannels
                      : selectedChannels.length
                      ? selectedChannels
                      : job.postChannels,
                  postScheduledAt: post.scheduled_for || job.postScheduledAt,
                  postPublishedAt: post.published_at || job.postPublishedAt,
                  postProviderResults: providerResults,
                  postPublishError: post.last_error || "",
                };
              }),
            };
          })
        );
      }
      const metaConnected = data.connections?.meta?.status === "connected";
      const googleConnected = data.connections?.google_business?.status === "connected";
      setConnectedAccounts((current) => ({
        ...current,
        meta: metaConnected,
        googleBusiness: googleConnected,
      }));
      return data;
    } catch (error) {
      setSocialPublishingError(error?.message || "BUSY could not refresh social connections.");
      return null;
    } finally {
      if (!quiet) setSocialPublishingLoading(false);
    }
  };

  const setLivePublishingEnabled = async (enabled) => {
    setSocialPublishingLoading(true);
    setSocialPublishingAction("live-switch");
    setSocialPublishingError("");
    try {
      await socialPublishRequest("set_live_publishing", { enabled: !!enabled });
      await refreshSocialPublishingStatus({ quiet: true });
      return true;
    } catch (error) {
      const message = error?.message || "BUSY could not change the live publishing switch.";
      setSocialPublishingError(message);
      Alert.alert("Live publishing not changed", message);
      return false;
    } finally {
      setSocialPublishingLoading(false);
      setSocialPublishingAction("");
    }
  };

  const confirmLivePublishingChange = (enabled) => {
    Alert.alert(
      enabled ? "Enable controlled live publishing?" : "Turn live publishing off?",
      enabled
        ? "Only owner-approved posts can publish. The Meta connection is locked to Busy Does It and @busydoesitapp. Start with one controlled test post."
        : "Drafts remain available, but no public posts or scheduled posts will be sent while the switch is off.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: enabled ? "Enable test" : "Turn off",
          style: enabled ? "default" : "destructive",
          onPress: () => setLivePublishingEnabled(enabled),
        },
      ]
    );
  };

  const beginSocialProviderConnect = async (provider) => {
    setSocialPublishingLoading(true);
    setSocialPublishingAction(provider);
    setSocialPublishingError("");
    try {
      const data = await socialPublishRequest("begin_oauth", { provider });
      if (!data?.authUrl) throw new Error("The provider did not return a connection link.");
      await Linking.openURL(data.authUrl);
      return true;
    } catch (error) {
      setSocialPublishingError(error?.message || "BUSY could not start the provider connection.");
      Alert.alert("Connection not ready", error?.message || "BUSY could not start this connection.");
      return false;
    } finally {
      setSocialPublishingLoading(false);
      setSocialPublishingAction("");
    }
  };

  const selectSocialProviderAsset = async (provider, assetId) => {
    setSocialPublishingLoading(true);
    setSocialPublishingAction(provider);
    setSocialPublishingError("");
    try {
      await socialPublishRequest("select_asset", { provider, assetId });
      await refreshSocialPublishingStatus({ quiet: true });
      return true;
    } catch (error) {
      setSocialPublishingError(error?.message || "BUSY could not select that account.");
      return false;
    } finally {
      setSocialPublishingLoading(false);
      setSocialPublishingAction("");
    }
  };

  const verifySocialProvider = async (provider) => {
    setSocialPublishingLoading(true);
    setSocialPublishingAction(provider);
    setSocialPublishingError("");
    try {
      await socialPublishRequest("verify_provider", { provider });
      await refreshSocialPublishingStatus({ quiet: true });
      return true;
    } catch (error) {
      const message = error?.message || "BUSY could not verify that provider.";
      setSocialPublishingError(message);
      Alert.alert("Provider check did not complete", message);
      return false;
    } finally {
      setSocialPublishingLoading(false);
      setSocialPublishingAction("");
    }
  };

  const disconnectSocialProvider = async (provider) => {
    setSocialPublishingLoading(true);
    setSocialPublishingAction(provider);
    setSocialPublishingError("");
    try {
      await socialPublishRequest("disconnect", { provider });
      await refreshSocialPublishingStatus({ quiet: true });
      return true;
    } catch (error) {
      setSocialPublishingError(error?.message || "BUSY could not disconnect that provider.");
      return false;
    } finally {
      setSocialPublishingLoading(false);
      setSocialPublishingAction("");
    }
  };

  const socialProviderConnected = (provider) =>
    socialPublishingStatus?.connections?.[provider]?.status === "connected";

  const socialScheduledForISO = () => {
    const value = new Date(`${socialScheduleDate}T${socialScheduleTime || "19:00"}:00`);
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  };

  const resetSocialCreator = () => {
    setSocialCreatePhotos([]);
    setSocialBrief("");
    setSocialAiStatus("idle");
    setSocialAiResult(null);
    setSocialAiError("");
    setSocialCaptionId("");
    setSocialDraftText("");
    setSocialDraftChannels(defaultJobPostChannels());
    setSocialScheduleDate(dateToISO(new Date()));
    setSocialScheduleTime("19:00");
    setSocialSourceContext({
      type: "phone",
      label: "Phone photos",
      customerId: "",
      jobId: "",
      service: "",
    });
    setSelectedSocialDraftId(null);
  };

  const openSocialCentre = () => {
    go("socialMedia");
  };

  const startSocialFromPhone = () => {
    resetSocialCreator();
    go("socialCreator");
  };

  const startSocialFromJob = (customerId = selectedCustomerId, jobId = selectedJobId) => {
    const customer = customers.find((item) => item.id === customerId);
    const job = (customer?.history || []).find((item) => item.id === jobId);
    if (!customer || !job) return false;
    const photos = (job.photos || []).filter((photo) => photo.marketingOk);
    if (!photos.length) {
      Alert.alert("No approved job photos", "Choose job photos and allow BUSY to suggest them for marketing first.");
      return false;
    }
    const service = job.service || customer.service || "";
    setSelectedCustomerId(customerId);
    setSelectedJobId(jobId);
    setSocialCreatePhotos(
      photos.slice(0, 6).map((photo) => ({
        ...photo,
        mimeType: photo.mimeType || "image/jpeg",
      }))
    );
    setSocialBrief(`Create a useful organic post from this completed ${service.toLowerCase()} job.`);
    setSocialAiStatus("idle");
    setSocialAiResult(null);
    setSocialAiError("");
    setSocialCaptionId("");
    setSocialDraftText(job.postDraft || "");
    setSocialDraftChannels(defaultJobPostChannels());
    setSocialScheduleDate(dateToISO(new Date()));
    setSocialScheduleTime("19:00");
    setSocialSourceContext({
      type: "job",
      label: `Completed job • ${service}`,
      customerId,
      jobId,
      service,
    });
    setSelectedSocialDraftId(null);
    go("socialCreator");
    return true;
  };

  const chooseSocialPhotos = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: 6,
        quality: 0.65,
        base64: true,
      });
      if (result.canceled) return;
      const picked = (result.assets || []).map((asset, index) => ({
        id: asset.assetId || `social-photo-${Date.now()}-${index}`,
        uri: asset.uri,
        fileName: asset.fileName || "",
        width: asset.width || 0,
        height: asset.height || 0,
        mimeType: asset.mimeType || "image/jpeg",
        base64: asset.base64 || "",
      }));
      setSocialCreatePhotos((current) => {
        const merged = [...current];
        picked.forEach((photo) => {
          if (!merged.some((item) => item.uri === photo.uri)) merged.push(photo);
        });
        return merged.slice(0, 6);
      });
      setSocialAiStatus("idle");
      setSocialAiResult(null);
      setSocialAiError("");
    } catch (error) {
      Alert.alert("Could not open photos", "Please try again. Nothing was uploaded.");
    }
  };

  const removeSocialPhoto = (id) => {
    setSocialCreatePhotos((current) => current.filter((photo) => photo.id !== id));
    setSocialAiStatus("idle");
    setSocialAiResult(null);
    setSocialAiError("");
  };

  const commitSocialCaption = (caption) => {
    if (!caption) return;
    setSocialCaptionId(caption.id);
    setSocialDraftText(caption.text || "");
    const recommended = new Set(caption.recommendedChannels || []);
    const metaConnection = socialPublishingStatus?.connections?.meta || {};
    const googleConnection = socialPublishingStatus?.connections?.google_business || {};
    setSocialDraftChannels((current) => {
      const alreadyChosen =
        !!current.facebook || !!current.instagram || !!current.googleBusiness;
      if (alreadyChosen) return current;
      return {
        facebook:
          metaConnection.status === "connected" &&
          !!socialPreferredChannels.facebook &&
          (recommended.size === 0 || recommended.has("Facebook")),
        instagram:
          metaConnection.status === "connected" &&
          !!metaConnection.instagramUserId &&
          !!socialPreferredChannels.instagram &&
          (recommended.size === 0 || recommended.has("Instagram")),
        googleBusiness:
          googleConnection.status === "connected" &&
          !!socialPreferredChannels.googleBusiness &&
          (recommended.size === 0 || recommended.has("Google Business")),
      };
    });
  };

  const applySocialCaption = (caption) => {
    if (!caption) return;
    const currentText = String(socialDraftText || "").trim();
    const nextText = String(caption.text || "").trim();
    const selectedCaption = (socialAiResult?.captions || []).find(
      (item) => item.id === socialCaptionId
    );
    const selectedText = String(selectedCaption?.text || "").trim();
    const wordingWasEdited =
      !!currentText &&
      currentText !== selectedText &&
      currentText !== nextText;

    if (wordingWasEdited) {
      Alert.alert(
        "Replace your edited wording?",
        "You have changed the final wording. Choosing another BUSY option will replace those edits.",
        [
          { text: "Keep my wording", style: "cancel" },
          {
            text: "Replace wording",
            onPress: () => commitSocialCaption(caption),
          },
        ]
      );
      return;
    }

    commitSocialCaption(caption);
  };

  const runSocialContentAI = async () => {
    if (!socialCreatePhotos.length) return false;
    setSocialAiStatus("analysing");
    setSocialAiError("");

    try {
      const photos = [];
      for (let index = 0; index < socialCreatePhotos.length; index += 1) {
        const photo = socialCreatePhotos[index];
        photos.push({
          id: photo.id || `photo-${index + 1}`,
          fileName: photo.fileName || "",
          dataUrl: await busyPhotoToDataUrl(photo),
        });
      }

      const response = await fetch(BUSY_SOCIAL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: BUSY_AI_TOKEN,
        },
        body: JSON.stringify({
          appVersion: APP_VERSION,
          businessName,
          trade,
          source: socialSourceContext.label || "Selected photos",
          serviceHint: socialSourceContext.service || "",
          brief: socialBrief.trim(),
          services: services.map((service) => ({ name: service.name })),
          ownerRules: businessBrainRules.map((rule) => rule.text),
          photos,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || `BUSY social AI returned ${response.status}.`);
      }
      setSocialAiResult(payload);
      setSocialAiStatus("ready");
      if (payload.detectedService && !socialSourceContext.service) {
        setSocialSourceContext((current) => ({
          ...current,
          service: payload.detectedService,
        }));
      }
      if (!String(socialDraftText || "").trim()) {
        commitSocialCaption(payload.captions?.[0]);
      }
      return true;
    } catch (error) {
      setSocialAiStatus("error");
      setSocialAiError(error?.message || "BUSY could not analyse these photos.");
      return false;
    }
  };

  const toggleSocialDraftChannel = (key) => {
    setSocialDraftChannels((current) => ({ ...current, [key]: !current[key] }));
  };

  const socialChannelNames = () => {
    const metaConnected =
      socialPublishingStatus?.connections?.meta?.status === "connected";
    const instagramConnected =
      metaConnected && !!socialPublishingStatus?.connections?.meta?.instagramUserId;
    const googleConnected =
      socialPublishingStatus?.connections?.google_business?.status === "connected";
    return [
      socialDraftChannels.facebook && metaConnected ? "Facebook" : null,
      socialDraftChannels.instagram && instagramConnected ? "Instagram" : null,
      socialDraftChannels.googleBusiness && googleConnected ? "Google Business" : null,
    ].filter(Boolean);
  };

  const upsertSocialDraft = (status = "Draft") => {
    const text = socialDraftText.trim();
    if (!text || !socialCreatePhotos.length) return null;
    const channels = socialChannelNames();
    if (status !== "Draft" && !channels.length) {
      Alert.alert("Choose a destination", "Select at least one social profile before scheduling or approving this post.");
      return null;
    }

    const now = new Date().toISOString();
    const existing = socialDrafts.find((draft) => draft.id === selectedSocialDraftId);
    const id = existing?.id || `social-draft-${Date.now()}`;
    const photos = socialCreatePhotos.map((photo) => ({
      id: photo.id,
      uri: photo.uri,
      fileName: photo.fileName || "",
      width: photo.width || 0,
      height: photo.height || 0,
      mimeType: photo.mimeType || "image/jpeg",
      storagePath: photo.storagePath || "",
      contentType: photo.contentType || photo.mimeType || "image/jpeg",
    }));
    const record = {
      ...(existing || {}),
      id,
      source: socialSourceContext.type,
      sourceLabel: socialSourceContext.label,
      sourceCustomerId: socialSourceContext.customerId || "",
      sourceJobId: socialSourceContext.jobId || "",
      service:
        socialAiResult?.detectedService ||
        socialSourceContext.service ||
        existing?.service ||
        "",
      photos,
      brief: socialBrief.trim(),
      text,
      selectedCaptionId: socialCaptionId,
      captions: socialAiResult?.captions || existing?.captions || [],
      story: socialAiResult?.story || existing?.story || null,
      privacyWarnings:
        socialAiResult?.privacyWarnings || existing?.privacyWarnings || [],
      channels,
      status,
      scheduleDate: socialScheduleDate,
      scheduleTime: socialScheduleTime,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      cloudMedia: existing?.cloudMedia || [],
      providerResults: existing?.providerResults || {},
      lastPublishError: existing?.lastPublishError || "",
      scheduledAt: status === "Scheduled" ? now : existing?.scheduledAt || null,
      approvedAt:
        status === "Published" ? now : existing?.approvedAt || null,
      publishedAt:
        status === "Published" ? now : existing?.publishedAt || null,
    };

    setSocialDrafts((items) => {
      const found = items.some((draft) => draft.id === id);
      return found
        ? items.map((draft) => (draft.id === id ? record : draft))
        : [...items, record];
    });
    setSelectedSocialDraftId(id);

    if (socialSourceContext.type === "job" && socialSourceContext.customerId && socialSourceContext.jobId) {
      setCustomers((list) =>
        list.map((customer) => {
          if (customer.id !== socialSourceContext.customerId) return customer;
          const history = (customer.history || []).map((job) =>
            job.id === socialSourceContext.jobId
              ? {
                  ...job,
                  postDraft: text,
                  postDraftPreparedAt: job.postDraftPreparedAt || now,
                  postDraftStatus: status === "Draft" ? "Prepared" : status,
                  postChannels: channels,
                  postContentType: record.story?.type || "",
                  postAIConfidence: record.story?.confidence || "",
                  postPrivacyWarnings: record.privacyWarnings,
                  postScheduledAt:
                    status === "Scheduled" ? now : job.postScheduledAt,
                  postPublishedAt:
                    status === "Published" ? now : job.postPublishedAt,
                }
              : job
          );
          return { ...customer, history };
        })
      );

    }

    return record;
  };

  const saveGeneratedSocialDraft = () => {
    const record = upsertSocialDraft("Draft");
    if (record) go("socialDraftReview");
  };

  const buildSocialPublishPayload = async (record, ownerApproved = false) => {
    const photos = [];
    for (let index = 0; index < socialCreatePhotos.length; index += 1) {
      const photo = socialCreatePhotos[index];
      if (photo.storagePath) {
        photos.push({
          id: photo.id || `photo-${index + 1}`,
          storagePath: photo.storagePath,
          contentType: photo.contentType || photo.mimeType || "image/jpeg",
        });
      } else {
        photos.push({
          id: photo.id || `photo-${index + 1}`,
          dataUrl: await busyPhotoToDataUrl(photo),
        });
      }
    }

    return {
      clientDraftId: record.id,
      sourceCustomerId: record.sourceCustomerId || "",
      sourceJobId: record.sourceJobId || "",
      sourceLabel: record.sourceLabel || "",
      service: record.service || "",
      caption: record.text || "",
      channels: record.channels || [],
      photos,
      media: record.cloudMedia || [],
      ownerApproved,
      scheduledFor: ownerApproved ? socialScheduledForISO() : null,
    };
  };

  const applyCloudSocialPost = (post, fallbackRecord = null) => {
    if (!post?.client_draft_id) return null;
    const now = new Date().toISOString();
    const media = Array.isArray(post.media) ? post.media : [];
    const previous =
      socialDrafts.find((draft) => draft.id === post.client_draft_id) ||
      fallbackRecord ||
      {};
    const next = {
      ...previous,
      id: post.client_draft_id,
      cloudMedia: media,
      status: post.status || previous.status || "Draft",
      channels: Array.isArray(post.channels) ? post.channels : previous.channels || [],
      lastPublishError: post.last_error || "",
      providerResults: post.provider_results || {},
      publishedAt: Object.prototype.hasOwnProperty.call(post, "published_at")
        ? post.published_at
        : previous.publishedAt || null,
      scheduledAt: Object.prototype.hasOwnProperty.call(post, "scheduled_for")
        ? post.scheduled_for
        : previous.scheduledAt || null,
      updatedAt: post.updated_at || now,
    };

    setSocialDrafts((items) => {
      const found = items.some((draft) => draft.id === next.id);
      return found
        ? items.map((draft) => (draft.id === next.id ? next : draft))
        : [...items, next];
    });
    setSelectedSocialDraftId(next.id);

    if (media.length) {
      setSocialCreatePhotos((items) =>
        items.map((photo) => {
          const cloud = media.find((item) => item.id === photo.id);
          return cloud
            ? {
                ...photo,
                storagePath: cloud.storagePath,
                contentType: cloud.contentType || photo.mimeType || "image/jpeg",
              }
            : photo;
        })
      );
    }

    if (next.source === "job" && next.sourceCustomerId && next.sourceJobId) {
      const successfulChannels = (next.channels || []).filter(
        (channel) =>
          next.providerResults?.[channel] &&
          !next.providerResults?.[channel]?.error
      );
      setCustomers((list) =>
        list.map((customer) => {
          if (customer.id !== next.sourceCustomerId) return customer;
          return {
            ...customer,
            history: (customer.history || []).map((job) =>
              job.id === next.sourceJobId
                ? {
                    ...job,
                    postDraft: next.text || job.postDraft || "",
                    postDraftStatus: next.status,
                    postChannels:
                      next.publishedAt && successfulChannels.length
                        ? successfulChannels
                        : next.channels,
                    postScheduledAt:
                      next.status === "Scheduled"
                        ? next.scheduledAt || now
                        : job.postScheduledAt,
                    postPublishedAt:
                      next.publishedAt
                        ? next.publishedAt
                        : job.postPublishedAt,
                    postProviderResults: next.providerResults,
                    postPublishError: next.lastPublishError,
                  }
                : job
            ),
          };
        })
      );

      if (next.publishedAt && !previous.publishedAt) {
        const publishedTo = successfulChannels.length
          ? successfulChannels
          : next.channels || [];
        const failedChannels = (next.channels || []).filter(
          (channel) => next.providerResults?.[channel]?.error
        );
        appendCustomerActivity(next.sourceCustomerId, {
          kind: "marketing",
          title: failedChannels.length
            ? "Social post partly published"
            : "Social post published",
          note: failedChannels.length
            ? `Published through BUSY to ${publishedTo.join(", ")}. ${failedChannels.join(", ")} still needs attention.`
            : `Published through BUSY to ${publishedTo.join(", ")}.`,
        });
        recordWorkGoalAttempt({
          key: `post:${next.sourceCustomerId}:${next.sourceJobId}`,
          type: "post",
          label: "Finished-job social post",
          customerId: next.sourceCustomerId,
          jobId: next.sourceJobId,
          channels: publishedTo,
          cost: 0,
        });
      }
    }

    return next;
  };

  const saveSocialDraftOnly = async () => {
    const record = upsertSocialDraft("Draft");
    if (!record) return false;
    setSocialPublishingLoading(true);
    setSocialPublishingAction("save");
    setSocialPublishingError("");
    try {
      const payload = await buildSocialPublishPayload(record, false);
      const data = await socialPublishRequest("save_draft", payload);
      applyCloudSocialPost(data.post, record);
      await refreshSocialPublishingStatus({ quiet: true });
      go("socialMedia");
      return true;
    } catch (error) {
      setSocialPublishingError(error?.message || "BUSY could not save this draft to the publishing queue.");
      Alert.alert("Draft saved on this phone", error?.message || "BUSY could not sync the cloud draft.");
      return false;
    } finally {
      setSocialPublishingLoading(false);
      setSocialPublishingAction("");
    }
  };

  const scheduleSocialDraft = async () => {
    const record = upsertSocialDraft("Draft");
    if (!record) return false;
    const scheduledFor = socialScheduledForISO();
    if (!scheduledFor || new Date(scheduledFor).getTime() <= Date.now()) {
      Alert.alert("Choose a future time", "Scheduled posts need a date and time in the future.");
      return false;
    }
    setSocialPublishingLoading(true);
    setSocialPublishingAction("schedule");
    setSocialPublishingError("");
    try {
      const payload = await buildSocialPublishPayload(record, true);
      payload.scheduledFor = scheduledFor;
      const data = await socialPublishRequest("schedule", payload);
      const saved = applyCloudSocialPost(data.post, record);
      rememberSocialChannels(record.channels || []);
      await refreshSocialPublishingStatus({ quiet: true });
      const when = new Date(scheduledFor);
      const whenLabel = Number.isNaN(when.getTime())
        ? "the selected time"
        : when.toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });
      Alert.alert(
        "Post scheduled",
        `BUSY will publish to ${(record.channels || []).join(" + ")} at ${whenLabel}. You can cancel it from the Social Control Centre before it starts publishing.`
      );
      go("socialMedia");
      return !!saved;
    } catch (error) {
      setSocialPublishingError(error?.message || "BUSY could not schedule this post.");
      Alert.alert("Could not schedule", error?.message || "BUSY could not schedule this post.");
      return false;
    } finally {
      setSocialPublishingLoading(false);
      setSocialPublishingAction("");
    }
  };

  const approveSocialDraft = async () => {
    const record = upsertSocialDraft("Draft");
    if (!record) return false;
    setSocialPublishingLoading(true);
    setSocialPublishingAction("publish");
    setSocialPublishingError("");
    try {
      const payload = await buildSocialPublishPayload(record, true);
      payload.scheduledFor = null;
      const data = await socialPublishRequest("publish_now", payload);
      const saved = applyCloudSocialPost(data.post, record);
      rememberSocialChannels(record.channels || []);
      await refreshSocialPublishingStatus({ quiet: true });
      const publishStatus = saved?.status || data.post?.status || "Failed";
      const providerResults = saved?.providerResults || data.post?.provider_results || {};
      const successfulChannels = (record.channels || []).filter(
        (channel) => providerResults[channel] && !providerResults[channel]?.error
      );
      const failedChannels = (record.channels || []).filter(
        (channel) => !providerResults[channel] || !!providerResults[channel]?.error
      );
      if (publishStatus === "Published") {
        Alert.alert(
          "Post published",
          `BUSY published this post to ${successfulChannels.join(" + ") || (record.channels || []).join(" + ")}. Provider receipts are saved against this post.`
        );
        go("socialMedia");
      } else if (publishStatus === "Partial failure") {
        Alert.alert(
          "Published with a problem",
          `Published to ${successfulChannels.join(" + ") || "at least one destination"}. ${failedChannels.join(" + ") || "Another destination"} failed, and BUSY will retry only the failed destination(s).`
        );
      } else {
        Alert.alert(
          "Post not published",
          `No selected destination completed successfully. BUSY kept the failure details so you can retry safely without creating a second post record.`
        );
      }
      return !!saved;
    } catch (error) {
      const serverPost = error?.payload?.post;
      if (serverPost) applyCloudSocialPost(serverPost, record);
      setSocialPublishingError(error?.message || "BUSY could not publish this post.");
      await refreshSocialPublishingStatus({ quiet: true });
      Alert.alert(
        "Publishing not live yet",
        error?.message || "BUSY could not publish this post."
      );
      return false;
    } finally {
      setSocialPublishingLoading(false);
      setSocialPublishingAction("");
    }
  };

  const retrySocialDraft = async () => {
    const draft = socialDrafts.find((item) => item.id === selectedSocialDraftId);
    if (!draft) return false;
    setSocialPublishingLoading(true);
    setSocialPublishingAction("retry");
    setSocialPublishingError("");
    try {
      const data = await socialPublishRequest("retry_post", {
        clientDraftId: draft.id,
      });
      const next = applyCloudSocialPost(data.post, draft);
      rememberSocialChannels(next?.channels || draft.channels || []);
      await refreshSocialPublishingStatus({ quiet: true });
      const retried = Array.isArray(data.retriedChannels)
        ? data.retriedChannels.join(" + ")
        : "the failed destination";
      Alert.alert(
        "Retry complete",
        next?.status === "Published"
          ? `BUSY retried only ${retried}. All selected destinations now have successful provider receipts.`
          : `BUSY retried only ${retried}. Current status: ${next?.status || "updated"}.`
      );
      return true;
    } catch (error) {
      const message = error?.message || "BUSY could not retry this post.";
      setSocialPublishingError(message);
      await refreshSocialPublishingStatus({ quiet: true });
      Alert.alert("Retry failed", message);
      return false;
    } finally {
      setSocialPublishingLoading(false);
      setSocialPublishingAction("");
    }
  };

  const confirmRetrySocialDraft = () => {
    Alert.alert(
      "Retry failed destination?",
      "BUSY will retry only destinations without a successful provider receipt. Channels that already published will not be posted again.",
      [
        { text: "Not now", style: "cancel" },
        { text: "Retry failed only", onPress: retrySocialDraft },
      ]
    );
  };

  const removeLocalSocialDraft = (draft) => {
    if (!draft?.id) return;
    setSocialDrafts((items) => items.filter((item) => item.id !== draft.id));

    if (draft.source === "job" && draft.sourceCustomerId && draft.sourceJobId) {
      setCustomers((list) =>
        list.map((customer) => {
          if (customer.id !== draft.sourceCustomerId) return customer;
          return {
            ...customer,
            history: (customer.history || []).map((job) =>
              job.id === draft.sourceJobId
                ? {
                    ...job,
                    postDraft: "",
                    postDraftStatus: "",
                    postChannels: [],
                    postScheduledAt: null,
                    postProviderResults: {},
                    postPublishError: "",
                  }
                : job
            ),
          };
        })
      );
    }

    setSelectedSocialDraftId(null);
    setSocialCreatePhotos([]);
    setSocialBrief("");
    setSocialAiStatus("idle");
    setSocialAiResult(null);
    setSocialAiError("");
    setSocialCaptionId("");
    setSocialDraftText("");
  };

  const deleteSocialDraft = async () => {
    const draft = socialDrafts.find((item) => item.id === selectedSocialDraftId);
    if (!draft) return false;
    setSocialPublishingLoading(true);
    setSocialPublishingAction("delete");
    setSocialPublishingError("");
    try {
      await socialPublishRequest("delete_draft", { clientDraftId: draft.id });
      removeLocalSocialDraft(draft);
      await refreshSocialPublishingStatus({ quiet: true });
      go("socialMedia");
      return true;
    } catch (error) {
      const message = error?.message || "BUSY could not delete this draft.";
      setSocialPublishingError(message);
      Alert.alert("Draft not deleted", message);
      return false;
    } finally {
      setSocialPublishingLoading(false);
      setSocialPublishingAction("");
    }
  };

  const confirmDeleteSocialDraft = () => {
    const draft = socialDrafts.find((item) => item.id === selectedSocialDraftId);
    if (!draft) return;
    Alert.alert(
      "Delete this draft?",
      "This removes the draft from BUSY and deletes its private cloud media. It will not affect any separate post already published on Facebook, Instagram or Google Business.",
      [
        { text: "Keep draft", style: "cancel" },
        { text: "Delete draft", style: "destructive", onPress: deleteSocialDraft },
      ]
    );
  };

  const cancelScheduledSocialDraft = async () => {
    const draft = socialDrafts.find((item) => item.id === selectedSocialDraftId);
    if (!draft) return false;
    setSocialPublishingLoading(true);
    setSocialPublishingAction("cancel-schedule");
    setSocialPublishingError("");
    try {
      const data = await socialPublishRequest("cancel_schedule", {
        clientDraftId: draft.id,
      });
      applyCloudSocialPost(data.post, draft);
      await refreshSocialPublishingStatus({ quiet: true });
      Alert.alert(
        "Schedule cancelled",
        "The post is back as a draft. Nothing will be published at the old scheduled time."
      );
      return true;
    } catch (error) {
      const message = error?.message || "BUSY could not cancel this scheduled post.";
      setSocialPublishingError(message);
      Alert.alert("Schedule not cancelled", message);
      return false;
    } finally {
      setSocialPublishingLoading(false);
      setSocialPublishingAction("");
    }
  };

  const confirmCancelScheduledSocialDraft = () => {
    Alert.alert(
      "Cancel this scheduled post?",
      "BUSY will stop the scheduled publish and return the post to Draft so you can edit, reschedule or delete it.",
      [
        { text: "Keep scheduled", style: "cancel" },
        {
          text: "Cancel schedule",
          style: "destructive",
          onPress: cancelScheduledSocialDraft,
        },
      ]
    );
  };

  const openSocialDraft = (id) => {
    const draft = socialDrafts.find((item) => item.id === id);
    if (!draft) return;
    setSelectedSocialDraftId(id);
    setSocialCreatePhotos(
      (draft.photos || []).map((photo) => {
        const cloud = (draft.cloudMedia || []).find((item) => item.id === photo.id);
        return cloud
          ? {
              ...photo,
              storagePath: cloud.storagePath,
              contentType: cloud.contentType || photo.mimeType || "image/jpeg",
            }
          : { ...photo };
      })
    );
    setSocialBrief(draft.brief || "");
    setSocialAiResult({
      summary: draft.story
        ? `${socialStoryLabel(draft.story.type)} content`
        : "Saved social draft",
      detectedService: draft.service || "",
      story: draft.story || null,
      privacyWarnings: draft.privacyWarnings || [],
      captions: draft.captions || [],
    });
    setSocialAiStatus("ready");
    setSocialAiError("");
    setSocialCaptionId(draft.selectedCaptionId || "");
    setSocialDraftText(draft.text || "");
    setSocialDraftChannels({
      facebook: (draft.channels || []).includes("Facebook"),
      instagram: (draft.channels || []).includes("Instagram"),
      googleBusiness: (draft.channels || []).includes("Google Business"),
    });
    setSocialScheduleDate(draft.scheduleDate || dateToISO(new Date()));
    setSocialScheduleTime(draft.scheduleTime || "19:00");
    setSocialSourceContext({
      type: draft.source || "phone",
      label: draft.sourceLabel || "Saved draft",
      customerId: draft.sourceCustomerId || "",
      jobId: draft.sourceJobId || "",
      service: draft.service || "",
    });
    go("socialDraftReview");
  };

  const saveBusinessBrainRule = () => {
    const text = businessBrainRuleDraft.trim();
    if (!text) return;
    setBusinessBrainRules((rules) => [
      ...rules,
      {
        id: `brain-rule-${Date.now()}`,
        text,
        source: "Owner rule",
        scope: businessBrainRuleScope(text),
        confidence: "Owner-set",
        kind: "manual",
        targetFamilies: manualRuleTargetFamilies({ text }),
        createdAt: new Date().toISOString(),
      },
    ]);
    setBusinessBrainRuleDraft("");
  };

  const removeBusinessBrainRule = (id) => {
    setBusinessBrainRules((rules) => rules.filter((rule) => rule.id !== id));
  };

  const prepareJobPost = () => {
    startSocialFromJob(selectedCustomerId, selectedJobId);
  };

  const openJobPostDraft = () => {
    const customer = customers.find((item) => item.id === selectedCustomerId);
    const job = (customer?.history || []).find((item) => item.id === selectedJobId);
    if (!job) return;
    setJobPostDraft(job.postDraft || "");
    setJobPostChannels(
      Array.isArray(job.postChannels) && job.postChannels.length
        ? {
            facebook: job.postChannels.includes("Facebook"),
            instagram: job.postChannels.includes("Instagram"),
            googleBusiness: job.postChannels.includes("Google Business"),
          }
        : defaultJobPostChannels()
    );
    go("jobPostDraft");
  };

  const openJobPostApproval = (customerId = selectedCustomerId, jobId = selectedJobId) => {
    const customer = customers.find((item) => item.id === customerId);
    const job = (customer?.history || []).find((item) => item.id === jobId);
    if (!customer || !job?.postDraft) return;
    setSelectedCustomerId(customerId);
    setSelectedJobId(jobId);
    setJobPostDraft(job.postDraft);
    setJobPostChannels(
      Array.isArray(job.postChannels) && job.postChannels.length
        ? {
            facebook: job.postChannels.includes("Facebook"),
            instagram: job.postChannels.includes("Instagram"),
            googleBusiness: job.postChannels.includes("Google Business"),
          }
        : defaultJobPostChannels()
    );
    go("jobPostApproval");
  };

  const toggleJobPostChannel = (key) => {
    setJobPostChannels((current) => ({ ...current, [key]: !current[key] }));
  };

  const saveJobPostDraft = () => {
    const draft = jobPostDraft.trim();
    if (!draft || !selectedJobId || !selectedCustomerId) return;
    const preparedAt = new Date().toISOString();
    setCustomers((list) =>
      list.map((customer) => {
        if (customer.id !== selectedCustomerId) return customer;
        const history = (customer.history || []).map((item) =>
          item.id === selectedJobId
            ? {
                ...item,
                postDraft: draft,
                postDraftPreparedAt: preparedAt,
                postDraftStatus: "Prepared",
              }
            : item
        );
        return { ...customer, history };
      })
    );
    appendCustomerActivity(selectedCustomerId, {
      kind: "marketing",
      title: "Finished-job post prepared",
      note: "Draft saved locally and moved to approval. Nothing has been posted.",
    });
    go("jobPostApproval");
  };

  const simulateJobPostPublish = () => {
    const draft = jobPostDraft.trim();
    if (!draft || !selectedJobId || !selectedCustomerId) return;
    const channels = [
      connectedAccounts.meta && jobPostChannels.facebook ? "Facebook" : null,
      connectedAccounts.meta && jobPostChannels.instagram ? "Instagram" : null,
      connectedAccounts.googleBusiness && jobPostChannels.googleBusiness ? "Google Business" : null,
    ].filter(Boolean);
    if (!channels.length) {
      Alert.alert("Choose where it would go", "Select at least one connected profile before approving this prototype post.");
      return;
    }
    const publishedAt = new Date().toISOString();
    setCustomers((list) =>
      list.map((customer) => {
        if (customer.id !== selectedCustomerId) return customer;
        const history = (customer.history || []).map((item) =>
          item.id === selectedJobId
            ? {
                ...item,
                postDraft: draft,
                postDraftStatus: "Simulated published",
                postChannels: channels,
                postPublishedAt: publishedAt,
              }
            : item
        );
        return { ...customer, history };
      })
    );
    appendCustomerActivity(selectedCustomerId, {
      kind: "marketing",
      title: "Finished-job post approved",
      note: `Prototype publish approved for ${channels.join(", ")}. No real post was published.`,
    });
    recordWorkGoalAttempt({
      key: `post:${selectedCustomerId}:${selectedJobId}`,
      type: "post",
      label: "Finished-job post",
      customerId: selectedCustomerId,
      jobId: selectedJobId,
      channels,
      cost: 0,
    });
    setJobPostOutcome("No enquiry yet");
    setJobPostOutcomeValue("");
    go("jobPostPublished");
  };

  const openJobPostOutcome = (customerId = selectedCustomerId, jobId = selectedJobId) => {
    const customer = customers.find((item) => item.id === customerId);
    const job = (customer?.history || []).find((item) => item.id === jobId);
    if (!customer || !job) return;
    setSelectedCustomerId(customerId);
    setSelectedJobId(jobId);
    setJobPostOutcome(job.postOutcome || "No enquiry yet");
    setJobPostOutcomeValue(job.postOutcomeValue ? String(job.postOutcomeValue) : "");
    go("jobPostOutcome");
  };

  const saveJobPostOutcome = () => {
    if (!selectedJobId || !selectedCustomerId) return;
    const parsedValue = Number(String(jobPostOutcomeValue).replace(/[^0-9.]/g, ""));
    const recordedAt = new Date().toISOString();
    setCustomers((list) =>
      list.map((customer) => {
        if (customer.id !== selectedCustomerId) return customer;
        const history = (customer.history || []).map((item) =>
          item.id === selectedJobId
            ? {
                ...item,
                postOutcome: jobPostOutcome,
                postOutcomeValue:
                  jobPostOutcome === "Booking" && Number.isFinite(parsedValue) && parsedValue > 0
                    ? parsedValue
                    : "",
                postOutcomeRecordedAt: recordedAt,
              }
            : item
        );
        return { ...customer, history };
      })
    );
    appendCustomerActivity(selectedCustomerId, {
      kind: "marketing",
      title: "Post outcome recorded",
      note:
        jobPostOutcome === "Booking" && Number.isFinite(parsedValue) && parsedValue > 0
          ? `Recorded outcome: Booking • £${parsedValue}. This is user-entered attribution, not a guaranteed causal claim.`
          : `Recorded outcome: ${jobPostOutcome}.`,
      value:
        jobPostOutcome === "Booking" && Number.isFinite(parsedValue) && parsedValue > 0
          ? parsedValue
          : "",
    });
    openCustomer(selectedCustomerId);
  };

  const prepareEnquiryFollowUp = (customerId) => {
    const customer = customers.find((item) => item.id === customerId);
    if (!customer || customer.lastServiceDate || replyActions[customerId]) return;
    const firstName = String(customer.name || "").split(" ")[0] || "there";
    const draft =
      customer.enquiryFollowUpDraft ||
      `Hi ${firstName}, you got in touch with us about ${String(customer.service || "some work").toLowerCase()} a little while ago. I just wanted to check whether you still needed any help with it. No problem at all if you’ve already sorted it.`;
    setSelectedCustomerId(customerId);
    setEnquiryFollowUpDraft(draft);
    setEnquiryFollowUpOutcome(customer.enquiryFollowUpOutcome || "No reply yet");
    go("enquiryFollowUp");
  };

  const simulateEnquiryFollowUpSend = () => {
    const customerId = selectedCustomerId;
    const draft = enquiryFollowUpDraft.trim();
    const customer = customers.find((item) => item.id === customerId);
    if (!customer || !draft || customer.lastServiceDate || replyActions[customerId]) return;
    const sentAt = new Date().toISOString();
    setCustomers((list) =>
      list.map((item) =>
        item.id === customerId
          ? {
              ...item,
              enquiryFollowUpDraft: draft,
              enquiryFollowUpSentAt: sentAt,
              enquiryFollowUpStatus: "Simulated sent",
              enquiryFollowUpOutcome: "",
              enquiryFollowUpOutcomeRecordedAt: null,
            }
          : item
      )
    );
    appendCustomerActivity(customerId, {
      kind: "enquiry-follow-up",
      title: "Quiet enquiry follow-up approved",
      note: "Prototype send approved. No real message was sent.",
    });
    recordWorkGoalAttempt({
      key: `enquiry:${customerId}`,
      type: "enquiry",
      label: `Quiet enquiry • ${customer.name}`,
      customerId,
      service: customer.service || "",
      cost: 0,
    });
    setEnquiryFollowUpOutcome("No reply yet");
    go("enquiryFollowUpSent");
  };

  const openEnquiryFollowUpOutcome = (customerId) => {
    const customer = customers.find((item) => item.id === customerId);
    if (!customer?.enquiryFollowUpSentAt) return;
    setSelectedCustomerId(customerId);
    setEnquiryFollowUpDraft(customer.enquiryFollowUpDraft || "");
    setEnquiryFollowUpOutcome(customer.enquiryFollowUpOutcome || "No reply yet");
    go("enquiryFollowUpOutcome");
  };

  const saveEnquiryFollowUpOutcome = () => {
    const customerId = selectedCustomerId;
    const customer = customers.find((item) => item.id === customerId);
    if (!customer?.enquiryFollowUpSentAt) return;
    const recordedAt = new Date().toISOString();
    setCustomers((list) =>
      list.map((item) =>
        item.id === customerId
          ? {
              ...item,
              enquiryFollowUpOutcome,
              enquiryFollowUpOutcomeRecordedAt: recordedAt,
            }
          : item
      )
    );
    setCustomers((list) =>
      list.map((item) =>
        item.id === customerId
          ? {
              ...item,
              lifecycleStatus:
                enquiryFollowUpOutcome === "Still interested"
                  ? "Enquiry re-engaged"
                  : enquiryFollowUpOutcome === "Not interested"
                  ? "Enquiry closed"
                  : "Enquiry follow-up sent",
              lastActivityAt: recordedAt,
              lastActivityKind: "enquiry-follow-up",
            }
          : item
      )
    );
    appendCustomerActivity(customerId, {
      kind: "enquiry-follow-up",
      title: "Quiet enquiry outcome recorded",
      note: `Recorded outcome: ${enquiryFollowUpOutcome}.`,
    });
    openCustomer(customerId);
  };

  const prepareQuoteFollowUp = (customerId) => {
    const action = replyActions[customerId];
    const customer =
      customers.find((item) => item.id === customerId) ||
      lastSimulatedRecipients.find((item) => item.id === customerId);
    if (!customer || action?.type !== "quote" || action.details?.quoteStatus !== "Sent") return;
    const amount = action.details?.quoteAmount;
    const service = customer.service || "the work";
    const draft =
      action.details?.followUpMessage ||
      `Hi ${customer.name.split(" ")[0]}, just checking in about the ${service.toLowerCase()} quote${amount ? ` for £${amount}` : ""}. No pressure at all — let me know if you’d like to go ahead, have any questions, or want me to leave it with you for now.`;
    setSelectedReplyActionId(customerId);
    setQuoteFollowUpDraft(draft);
    setQuoteFollowUpOutcome(action.details?.followUpOutcome || "No reply yet");
    go("quoteFollowUp");
  };

  const simulateQuoteFollowUpSend = () => {
    const customerId = selectedReplyActionId;
    const action = replyActions[customerId];
    const customer =
      customers.find((item) => item.id === customerId) ||
      lastSimulatedRecipients.find((item) => item.id === customerId);
    const draft = quoteFollowUpDraft.trim();
    if (!customer || action?.type !== "quote" || !draft) return;
    const sentAt = new Date().toISOString();
    updateReplyAction(customerId, (current) => ({
      ...current,
      done: true,
      details: {
        ...(current.details || {}),
        followUpMessage: draft,
        followUpSentAt: sentAt,
        followUpStatus: "Simulated sent",
        followUpOutcome: "",
        followUpOutcomeRecordedAt: null,
        summary: `Quote follow-up prepared and marked sent for £${current.details?.quoteAmount || "—"}`,
      },
      completedAt: sentAt,
    }));
    appendCustomerActivity(customerId, {
      kind: "quote-follow-up",
      title: "Quote follow-up approved",
      note: "Prototype send approved. No real message was sent.",
      value: action.details?.quoteAmount || "",
    });
    recordWorkGoalAttempt({
      key: `quote:${customerId}`,
      type: "quote",
      label: `Quote follow-up • ${customer.name}`,
      customerId,
      service: customer.service || "",
      value: Number(action.details?.quoteAmount) || 0,
      cost: 0,
    });
    setQuoteFollowUpOutcome("No reply yet");
    go("quoteFollowUpSent");
  };

  const openQuoteFollowUpOutcome = (customerId) => {
    const action = replyActions[customerId];
    if (!action?.details?.followUpSentAt) return;
    setSelectedReplyActionId(customerId);
    setQuoteFollowUpDraft(action.details?.followUpMessage || "");
    setQuoteFollowUpOutcome(action.details?.followUpOutcome || "No reply yet");
    go("quoteFollowUpOutcome");
  };

  const saveQuoteFollowUpOutcome = () => {
    const customerId = selectedReplyActionId;
    const action = replyActions[customerId];
    if (!action?.details?.followUpSentAt) return;
    const recordedAt = new Date().toISOString();
    const nextQuoteStatus =
      quoteFollowUpOutcome === "Accepted"
        ? "Accepted"
        : quoteFollowUpOutcome === "Declined"
        ? "Declined"
        : action.details?.quoteStatus || "Sent";
    updateReplyAction(customerId, (current) => ({
      ...current,
      done: true,
      details: {
        ...(current.details || {}),
        quoteStatus: nextQuoteStatus,
        followUpOutcome: quoteFollowUpOutcome,
        followUpOutcomeRecordedAt: recordedAt,
        summary:
          quoteFollowUpOutcome === "Accepted"
            ? `Quote accepted after follow-up for £${current.details?.quoteAmount || "—"}`
            : quoteFollowUpOutcome === "Declined"
            ? `Quote declined after follow-up for £${current.details?.quoteAmount || "—"}`
            : `Quote follow-up outcome: ${quoteFollowUpOutcome}`,
      },
      completedAt: recordedAt,
    }));
    setCustomers((list) =>
      list.map((item) =>
        item.id === customerId
          ? {
              ...item,
              lifecycleStatus:
                quoteFollowUpOutcome === "Accepted"
                  ? "Quote accepted"
                  : quoteFollowUpOutcome === "Declined"
                  ? "Quote declined"
                  : quoteFollowUpOutcome === "Still considering"
                  ? "Quote still considering"
                  : "Quote follow-up sent",
              lastActivityAt: recordedAt,
              lastActivityKind: "quote-follow-up",
            }
          : item
      )
    );
    appendCustomerActivity(customerId, {
      kind: "quote-follow-up",
      title: "Quote follow-up outcome recorded",
      note: `Recorded outcome: ${quoteFollowUpOutcome}.`,
      value: action.details?.quoteAmount || "",
    });
    openCustomer(customerId);
  };

  const prepareReviewRequest = (customerId, jobId) => {
    const customer = customers.find((item) => item.id === customerId);
    const job = (customer?.history || []).find((item) => item.id === jobId);
    if (!customer || !job || customer.contactOk === false) return;
    const service = job.service || customer.service || "job";
    const firstName = String(customer.name || "").split(" ")[0] || "there";
    const draft =
      job.reviewRequestDraft ||
      `Hi ${firstName}, thanks again for choosing us for your ${service.toLowerCase()}. If you were happy with the work, would you mind leaving us a quick review? No problem at all if not — we really appreciate the business.`;
    setSelectedCustomerId(customerId);
    setSelectedJobId(jobId);
    setReviewRequestDraft(draft);
    setReviewRequestOutcome(job.reviewRequestOutcome || "No response yet");
    go("reviewRequest");
  };

  const simulateReviewRequestSend = () => {
    const draft = reviewRequestDraft.trim();
    if (!draft || !selectedCustomerId || !selectedJobId) return;
    const sentAt = new Date().toISOString();
    setCustomers((list) =>
      list.map((customer) => {
        if (customer.id !== selectedCustomerId) return customer;
        const history = (customer.history || []).map((item) =>
          item.id === selectedJobId
            ? {
                ...item,
                reviewRequestDraft: draft,
                reviewRequestSentAt: sentAt,
                reviewRequestStatus: "Simulated sent",
                reviewRequestOutcome: "",
                reviewRequestOutcomeRecordedAt: null,
              }
            : item
        );
        return { ...customer, history };
      })
    );
    appendCustomerActivity(selectedCustomerId, {
      kind: "review-request",
      title: "Review request approved",
      note: "Prototype send approved. No real message was sent.",
    });
    setReviewRequestOutcome("No response yet");
    go("reviewRequestSent");
  };

  const openReviewRequestOutcome = (customerId, jobId) => {
    const customer = customers.find((item) => item.id === customerId);
    const job = (customer?.history || []).find((item) => item.id === jobId);
    if (!customer || !job?.reviewRequestSentAt) return;
    setSelectedCustomerId(customerId);
    setSelectedJobId(jobId);
    setReviewRequestDraft(job.reviewRequestDraft || "");
    setReviewRequestOutcome(job.reviewRequestOutcome || "No response yet");
    go("reviewRequestOutcome");
  };

  const saveReviewRequestOutcome = () => {
    if (!selectedCustomerId || !selectedJobId) return;
    const recordedAt = new Date().toISOString();
    setCustomers((list) =>
      list.map((customer) => {
        if (customer.id !== selectedCustomerId) return customer;
        const history = (customer.history || []).map((item) =>
          item.id === selectedJobId
            ? {
                ...item,
                reviewRequestOutcome,
                reviewRequestOutcomeRecordedAt: recordedAt,
              }
            : item
        );
        return { ...customer, history };
      })
    );
    appendCustomerActivity(selectedCustomerId, {
      kind: "review-request",
      title: "Review request outcome recorded",
      note: `Recorded outcome: ${reviewRequestOutcome}.`,
    });
    openCustomer(selectedCustomerId);
  };

  const markReminderDone = (customerId) => {
    updateReplyAction(customerId, (action) => ({
      ...action,
      done: true,
      details: {
        ...(action.details || {}),
        reminderStatus: "Completed",
        reminderCompletedAt: new Date().toISOString(),
        summary: `Follow-up completed on ${formatUKDate(dateToISO(new Date()))}`,
      },
      completedAt: new Date().toISOString(),
    }));
    appendCustomerActivity(customerId, {
      kind: "reminder",
      title: "Follow-up completed",
      note: `Completed on ${formatUKDate(dateToISO(new Date()))}.`,
    });
  };

  const rescheduleReminder = (customerId, reminderDate) => {
    updateReplyAction(customerId, (action) => ({
      ...action,
      done: true,
      details: {
        ...(action.details || {}),
        reminderDate,
        reminderStatus: "Scheduled",
        reminderCompletedAt: null,
        summary: `Follow up on ${formatUKDate(reminderDate)}`,
      },
      completedAt: new Date().toISOString(),
    }));
    setActionReminderDate(reminderDate);
    appendCustomerActivity(customerId, {
      kind: "reminder",
      title: "Follow-up rescheduled",
      note: `New follow-up date: ${formatUKDate(reminderDate)}.`,
    });
  };

  const completeReplyAction = (customerId, details = {}) => {
    const action = replyActions[customerId];
    setReplyActions((current) => ({
      ...current,
      [customerId]: current[customerId]
        ? {
            ...current[customerId],
            done: true,
            details,
            completedAt: new Date().toISOString(),
          }
        : current[customerId],
    }));
    if (action?.type) {
      const lifecycleStatus =
        action.type === "quote"
          ? details.quoteStatus === "Sent"
            ? "Quote sent"
            : details.quoteStatus === "Accepted"
            ? "Quote accepted"
            : "Quote prepared"
          : action.type === "booking"
          ? details.bookingStatus === "Confirmed"
            ? "Booked"
            : "Booking being arranged"
          : action.type === "reminder"
          ? "Follow-up scheduled"
          : "Customer action saved";
      setCustomers((list) =>
        list.map((customer) =>
          customer.id === customerId
            ? {
                ...customer,
                lifecycleStatus,
                lastActivityAt: new Date().toISOString(),
                lastActivityKind: action.type,
              }
            : customer
        )
      );
      appendCustomerActivity(customerId, {
        kind: action.type,
        title:
          action.type === "quote"
            ? "Quote prepared"
            : action.type === "booking"
            ? "Booking confirmed"
            : action.type === "reminder"
            ? "Follow-up scheduled"
            : "Customer action saved",
        note: details.summary || action.task || "",
        value: details.quoteAmount || details.jobValue || details.sourceQuoteAmount || "",
      });
    }
  };

  const prepareOfferFromGoal = () => {
    const preferred = services.find((x) => x.id === selectedServiceId) || services.find((x) => x.wanted) || services[0];
    const serviceName = preferred?.name || trade || "Main service";
    const baseValue = Number(preferred?.value) > 0 ? Number(preferred.value) : 100;
    setOfferService(serviceName);
    setNormalPrice(String(baseValue));

    if (offerGoal === "Fill a quiet day") {
      setOfferPrice(String(Math.max(1, Math.round(baseValue * 0.9))));
      setOfferDates("Tuesday & Wednesday");
      setOfferMax("4");
    } else if (offerGoal === "Get more bookings") {
      setOfferPrice(String(Math.max(1, Math.round(baseValue * 0.95))));
      setOfferDates("Next 14 days");
      setOfferMax("6");
    } else if (offerGoal === "Promote a service") {
      setOfferPrice(String(baseValue));
      setOfferDates("Next 2 weeks");
      setOfferMax("5");
    } else if (offerGoal === "Bring customers back") {
      setOfferPrice(String(baseValue));
      setOfferDates("Next 10 days");
      setOfferMax("5");
    } else {
      setOfferPrice(String(Math.max(1, Math.round(baseValue * 0.9))));
      setOfferDates("Limited seasonal window");
      setOfferMax("6");
    }
    go("offerBuild");
  };

  const clearCustomerForm = () => {
    setEditingCustomerId(null);
    setNewCustomerName("");
    setNewCustomerPhone("");
    setNewCustomerAddress("");
    setNewCustomerService(services.find((item) => item.wanted)?.name || trade || "Service");
    setNewCustomerDate(dateToISO(new Date()));
    setNewCustomerValue("");
    setNewCustomerContactOk(true);
    setNewCustomerHasPreviousJob(true);
  };

  const startNewCustomer = () => {
    clearCustomerForm();
    go("addCustomerRecord");
  };

  const startEditCustomer = (customer) => {
    setEditingCustomerId(customer.id);
    setNewCustomerName(customer.name || "");
    setNewCustomerPhone(customer.phone || "");
    setNewCustomerAddress(customer.address || "");
    setNewCustomerService(customer.service || "");
    setNewCustomerDate(customer.lastServiceDate || dateToISO(new Date()));
    setNewCustomerValue(customer.lastJobValue ? String(customer.lastJobValue) : "");
    setNewCustomerContactOk(customer.contactOk !== false);
    setNewCustomerHasPreviousJob(!!customer.lastServiceDate);
    go("addCustomerRecord");
  };

  const saveCustomerRecord = () => {
    const name = newCustomerName.trim();
    const phone = newCustomerPhone.trim();
    const address = newCustomerAddress.trim();
    const service = newCustomerService.trim() || trade || "Service";
    const parsedValue = Number(String(newCustomerValue).replace(/[^0-9.]/g, ""));
    const dateIsValid = !newCustomerHasPreviousJob || !Number.isNaN(new Date(newCustomerDate).getTime());
    if (!name || !phone || !dateIsValid) return false;

    const existing = editingCustomerId
      ? customers.find((customer) => customer.id === editingCustomerId)
      : null;
    const nextRecord = {
      ...(existing || {}),
      id: editingCustomerId || `customer-${Date.now()}`,
      name,
      phone,
      address,
      service,
      lastServiceDate: newCustomerHasPreviousJob ? newCustomerDate : "",
      lastJobValue:
        newCustomerHasPreviousJob && Number.isFinite(parsedValue) ? parsedValue : 0,
      contactOk: newCustomerContactOk,
      createdAt: existing?.createdAt || new Date().toISOString(),
      source: existing?.source || "Customer record",
    };

    setCustomers((list) =>
      editingCustomerId
        ? list.map((customer) => (customer.id === editingCustomerId ? nextRecord : customer))
        : [...list, nextRecord]
    );
    clearCustomerForm();
    return true;
  };

  const startNewEnquiry = () => {
    const preferred = services.find((item) => item.wanted) || services[0];
    setNewEnquiryName("");
    setNewEnquiryPhone("");
    setNewEnquiryAddress("");
    setNewEnquiryService(preferred?.name || trade || "Service");
    setNewEnquiryCustomService("");
    setNewEnquiryNote("");
    setNewEnquiryDate(dateToISO(new Date()));
    go("newEnquiry");
  };

  const saveNewEnquiry = () => {
    const name = newEnquiryName.trim();
    const phone = newEnquiryPhone.trim();
    const address = newEnquiryAddress.trim();
    const service = newEnquiryCustomService.trim() || newEnquiryService.trim() || services[0]?.name || trade || "Service";
    if (!name || !phone) return false;
    const id = `enquiry-${Date.now()}`;
    const receivedAt = new Date(`${newEnquiryDate || dateToISO(new Date())}T12:00:00`).toISOString();
    const now = new Date().toISOString();
    const customer = {
      id,
      name,
      phone,
      address,
      service,
      lastServiceDate: "",
      lastJobValue: 0,
      contactOk: true,
      source: "New enquiry",
      createdAt: receivedAt,
      currentEnquiryAt: receivedAt,
      nextEnquiryCheckDate: addDaysFromISO(newEnquiryDate || dateToISO(new Date()), 7),
      lifecycleStatus: "Enquiry",
      activity: [
        {
          id: `activity-${id}-created`,
          kind: "enquiry",
          date: newEnquiryDate || dateToISO(new Date()),
          createdAt: receivedAt,
          title: "New enquiry added",
          note: newEnquiryNote.trim() || `Enquiry for ${service}.`,
          value: "",
        },
      ],
    };
    setCustomers((list) => [...list, customer]);
    setSelectedCustomerId(id);
    setNewEnquiryName("");
    setNewEnquiryPhone("");
    setNewEnquiryAddress("");
    setNewEnquiryCustomService("");
    setNewEnquiryNote("");
    setNewEnquiryDate(dateToISO(new Date()));
    go("customerDetail");
    return true;
  };

  const resetCaptureBrain = () => {
    setCaptureBrainStatus("idle");
    setCaptureBrainAnalysis(null);
    setCaptureBrainError("");
  };

  const updateCaptureRawText = (value) => {
    setCaptureRawText(value);
    resetCaptureBrain();
  };

  const updateCaptureSource = (value) => {
    setCaptureSource(value);
    resetCaptureBrain();
  };

  const applyBrainThreadToCapture = (thread) => {
    const parsed = thread?.parsed || {};
    setCaptureStage(parsed.stage || "Enquiry");
    setCaptureName(parsed.name || "");
    setCapturePhone(parsed.phone || "");
    setCaptureEmail(parsed.email || "");
    setCaptureAddress(parsed.address || "");
    setCaptureService(parsed.service || "");
    setCaptureDate(parsed.date || dateToISO(new Date()));
    setCaptureTime(parsed.time || "09:00");
    setCaptureValue(parsed.value || "");
    setCaptureNote(parsed.note || thread?.sourceText || captureRawText || "");
    setCaptureConfidence(parsed.confidence || "Low");
    setCaptureExtractedFields(parsed.extractedFields || []);
  };

  const runIntakeBrain = async () => {
    const rawText = captureRawText.trim();
    if (!rawText && !captureScreenshots.length) return null;

    setCaptureBrainStatus("analysing");
    setCaptureBrainError("");

    const fallbackParsed = parseQuickCapture(
      rawText,
      services,
      services.find((item) => item.wanted)?.name || trade || "Service"
    );

    try {
      let analysis;
      if (captureScreenshots.length && BUSY_AI_URL && BUSY_AI_TOKEN) {
        const preparedImages = captureScreenshots.map((shot, index) => {
          if (!shot.base64) throw new Error("One selected screenshot could not be prepared. Remove it and select it again.");
          const mimeType = shot.mimeType || "image/jpeg";
          return {
            id: shot.id,
            order: index + 1,
            fileName: shot.fileName || "",
            dataUrl: `data:${mimeType};base64,${shot.base64}`,
          };
        });

        const response = await fetch(BUSY_AI_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(BUSY_AI_TOKEN ? { apikey: BUSY_AI_TOKEN } : {}),
          },
          body: JSON.stringify({
            appVersion: APP_VERSION,
            source: captureSource,
            ownerText: rawText,
            screenshots: preparedImages,
            currentOrder: captureScreenshots.map((shot) => shot.id),
            services: services.map((item) => ({
              id: item.id,
              name: item.name,
              value: item.value,
            })),
            today: dateToISO(new Date()),
          }),
        });

        if (!response.ok) throw new Error(`BUSY AI returned ${response.status}.`);
        const payload = await response.json();
        analysis = normaliseLiveIntakeAnalysis(payload, {
          parsed: fallbackParsed,
          rawText,
          screenshots: captureScreenshots,
          orderConfidence: captureScreenshotOrderConfidence,
          orderReason: captureScreenshotOrderReason,
        });
      } else {
        analysis = localIntakeBrainAnalysis({
          parsed: fallbackParsed,
          rawText,
          screenshots: captureScreenshots,
          orderConfidence: captureScreenshotOrderConfidence,
          orderReason: captureScreenshotOrderReason,
        });
      }

      setCaptureBrainAnalysis(analysis);
      setCaptureBrainStatus(analysis.status || "ready");

      if (
        analysis.mode === "live-vision" &&
        Array.isArray(analysis.order?.imageIds) &&
        analysis.order.imageIds.length
      ) {
        const orderMap = new Map(analysis.order.imageIds.map((id, index) => [id, index]));
        setCaptureScreenshots((current) =>
          [...current].sort(
            (a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999)
          )
        );
        setCaptureScreenshotOrderConfidence(analysis.order.confidence || "Medium");
        setCaptureScreenshotOrderReason(analysis.order.reason || "");
      }

      if (analysis.threads?.length === 1) applyBrainThreadToCapture(analysis.threads[0]);
      return analysis;
    } catch (error) {
      const message = error?.message || "BUSY could not analyse this intake batch.";
      setCaptureBrainStatus("error");
      setCaptureBrainError(message);
      setCaptureBrainAnalysis(null);
      return null;
    }
  };

  const chooseCaptureScreenshots = async () => {
    try {
      resetCaptureBrain();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: MAX_CAPTURE_SCREENSHOTS,
        quality: 0.65,
        exif: true,
        base64: true,
      });
      if (result.canceled) return;

      const picked = (result.assets || []).map((asset, index) => ({
        id: asset.assetId || `capture-shot-${Date.now()}-${index}`,
        uri: asset.uri,
        fileName: asset.fileName || "",
        width: asset.width || 0,
        height: asset.height || 0,
        mimeType: asset.mimeType || "image/jpeg",
        base64: asset.base64 || "",
        pickerIndex: index,
      }));

      setCaptureScreenshots((current) => {
        const merged = [...current];
        picked.forEach((shot) => {
          if (!merged.some((item) => item.uri === shot.uri)) {
            merged.push({ ...shot, pickerIndex: merged.length });
          }
        });
        const inferred = inferCaptureScreenshotOrder(merged.slice(0, MAX_CAPTURE_SCREENSHOTS));
        setCaptureScreenshotOrderConfidence(inferred.confidence);
        setCaptureScreenshotOrderReason(inferred.reason);
        return inferred.items;
      });
    } catch (error) {
      Alert.alert(
        "Could not open screenshots",
        "Please try again. BUSY only sees the images you deliberately select."
      );
    }
  };

  const removeCaptureScreenshot = (id) => {
    resetCaptureBrain();
    setCaptureScreenshots((current) => {
      const inferred = inferCaptureScreenshotOrder(current.filter((item) => item.id !== id));
      setCaptureScreenshotOrderConfidence(inferred.confidence);
      setCaptureScreenshotOrderReason(inferred.reason);
      return inferred.items;
    });
  };

  const moveCaptureScreenshot = (id, direction) => {
    resetCaptureBrain();
    setCaptureScreenshots((current) => {
      const index = current.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      setCaptureScreenshotOrderConfidence("Confirmed");
      setCaptureScreenshotOrderReason("You manually confirmed this screenshot order.");
      return next;
    });
  };

  const clearQuickCapture = () => {
    const preferred = services.find((item) => item.wanted) || services[0];
    setCaptureRawText("");
    setCaptureScreenshots([]);
    setCaptureScreenshotOrderConfidence("Not checked");
    setCaptureScreenshotOrderReason("");
    setCaptureBrainStatus("idle");
    setCaptureBrainAnalysis(null);
    setCaptureBrainError("");
    setCaptureSource("Customer message");
    setCaptureStage("Enquiry");
    setCaptureName("");
    setCapturePhone("");
    setCaptureEmail("");
    setCaptureAddress("");
    setCaptureService("");
    setCaptureDate(dateToISO(new Date()));
    setCaptureTime("09:00");
    setCaptureValue("");
    setCaptureNote("");
    setCaptureConfidence("Low");
    setCaptureExtractedFields([]);
    setCaptureForceNew(false);
  };

  const startQuickCapture = () => {
    clearQuickCapture();
    setSelectedInboxItemId(null);
    setTab("Work");
    go("quickCapture");
  };

  const loadQuickCaptureExample = (kind = "enquiry") => {
    resetCaptureBrain();
    const service = services.find((item) => item.wanted)?.name || services[0]?.name || "Driveway cleaning";
    if (kind === "quote") {
      setCaptureSource("Email / quote note");
      setCaptureRawText(
        `Name: Alex Morgan\nPhone: 07700 900222\nEmail: alex@example.com\n${service}\nQuote sent 18/09/2026 for £325\nAddress: 12 Market Road EX17 3AB`
      );
    } else if (kind === "booking") {
      setCaptureSource("Calendar / booking note");
      setCaptureRawText(
        `Customer: Priya Shah\n07700 900333\nBooked ${service} for 30/09/2026 at 14:00\nJob value £280\nSite: 4 Station Close EX17 2AA`
      );
    } else if (kind === "completed") {
      setCaptureSource("Invoice / job note");
      setCaptureRawText(
        `Customer: Ben Carter\n07700 900444\nFinished ${service} 25/09/2026\nPaid £260\nAddress: 8 Church Lane EX17 1BB`
      );
    } else {
      setCaptureSource("Customer message");
      setCaptureRawText(
        `Sophie Green\nHi, could I get a quote for ${service.toLowerCase()} please?\n07700 900111\nsophie@example.com\nAddress: 7 High Street EX17 4CD`
      );
    }
  };

  const fileSafeInboxItem = (item, suppliedEvaluation = null) => {
    const parsed =
      item.parsed ||
      parseQuickCapture(
        item.rawText || "",
        services,
        services.find((candidate) => candidate.wanted)?.name || trade || "Service"
      );
    const evaluation =
      suppliedEvaluation ||
      evaluateSafeAutoFile(
        parsed,
        customers,
        replyActions,
        item.source || "Incoming",
        item.rawText || ""
      );

    if (recordFilingMode !== "safe" || !evaluation.safe || !evaluation.customer) return false;

    const existing = evaluation.customer;
    const customerId = existing.id;
    const eventDate = parsed.date || dateToISO(new Date());
    const eventTime = parsed.time || "09:00";
    const eventAt = new Date(`${eventDate}T${eventTime}:00`).toISOString();
    const importedAt = new Date().toISOString();
    const parsedValue = Number(String(parsed.value || "").replace(/[^0-9.]/g, ""));
    const value = Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
    const reconciliation =
      evaluation.reconciliation || assessJourneyReconciliation(parsed, existing, replyActions[customerId]);
    const priorSourceRecords = Array.isArray(existing.sourceRecords) ? existing.sourceRecords : [];
    const priorThreadRecord = [...priorSourceRecords]
      .reverse()
      .find((record) => record.workThreadId && record.stage !== "Completed job");
    const workThreadId =
      existing.activeWorkThreadId ||
      priorThreadRecord?.workThreadId ||
      `journey-${customerId}-${Date.now()}`;
    const sourceRecord = {
      id: `source-${customerId}-${Date.now()}`,
      source: item.source || "Incoming",
      sourceConnection: item.sourceConnection || "",
      stage: parsed.stage,
      eventDate,
      importedAt,
      rawText: item.rawText || "",
      fingerprint: evaluation.fingerprint,
      autoFiled: true,
      workThreadId,
      reconciled: !!reconciliation.progression,
      previousStage: reconciliation.currentStage || "",
      reconciliationReason: reconciliation.progression ? reconciliation.reason : "",
    };
    const repeatDueDate =
      parsed.stage === "Completed job"
        ? nextRepeatDueDate(
            { ...existing, service: parsed.service, lastServiceDate: eventDate },
            services,
            verticalId
          )
        : existing.nextRepeatDueDate || "";
    const firstName = String(parsed.name || existing.name || "").split(" ")[0] || "there";
    const reviewDraft =
      parsed.stage === "Completed job" && existing.contactOk !== false
        ? `Hi ${firstName}, thanks again for choosing us for your ${parsed.service.toLowerCase()}. If you were happy with the work, would you mind leaving us a quick review? No problem at all if not — we really appreciate the business.`
        : "";

    setCustomers((list) =>
      list.map((customer) => {
        if (customer.id !== customerId) return customer;
        const activity = Array.isArray(customer.activity) ? customer.activity : [];
        const sourceRecords = Array.isArray(customer.sourceRecords) ? customer.sourceRecords : [];
        const history = Array.isArray(customer.history) ? customer.history : [];
        let nextHistory = history;
        let lifecycleStatus = customer.lifecycleStatus || (customer.lastServiceDate ? "Previous customer" : "Enquiry");
        let currentEnquiryAt = customer.currentEnquiryAt || null;
        let nextEnquiryCheckDate = customer.nextEnquiryCheckDate || null;
        let lastServiceDate = customer.lastServiceDate || "";
        let lastJobValue = customer.lastJobValue || 0;
        let nextRepeatDate = repeatDueDate || customer.nextRepeatDueDate || "";

        if (parsed.stage === "Enquiry") {
          lifecycleStatus = "Enquiry";
          currentEnquiryAt = eventAt;
          nextEnquiryCheckDate = addDaysFromISO(eventDate, 7);
        } else if (parsed.stage === "Quote sent") {
          lifecycleStatus = "Quote sent";
          currentEnquiryAt = null;
          nextEnquiryCheckDate = null;
        } else if (parsed.stage === "Booking") {
          lifecycleStatus = "Booked";
          currentEnquiryAt = null;
          nextEnquiryCheckDate = null;
        } else if (parsed.stage === "Completed job") {
          lifecycleStatus = "Completed customer";
          currentEnquiryAt = null;
          nextEnquiryCheckDate = null;
          lastServiceDate = eventDate;
          lastJobValue = value || customer.lastJobValue || 0;
          const jobId = `autopilot-job-${customerId}-${eventDate}`;
          nextHistory = [
            ...history,
            {
              id: jobId,
              kind: "job",
              date: eventDate,
              service: parsed.service,
              value: value || "",
              note: parsed.note || "Completed job filed by Safe Autopilot",
              photos: [],
              sourceOrigin: "autopilot",
              sourceAction: "busy-inbox",
              repeatDueDate: repeatDueDate || "",
              reviewRequestDraft: reviewDraft,
              reviewRequestPreparedAt: reviewDraft ? importedAt : null,
              adminPreparedAt: importedAt,
              workThreadId,
            },
          ];
        }

        return {
          ...customer,
          name: parsed.name || customer.name,
          phone: parsed.phone || customer.phone || "",
          email: parsed.email || customer.email || "",
          address: parsed.address || customer.address || "",
          service: parsed.service || customer.service,
          lifecycleStatus,
          currentEnquiryAt,
          nextEnquiryCheckDate,
          enquiryFollowUpSentAt: parsed.stage === "Enquiry" ? null : customer.enquiryFollowUpSentAt,
          enquiryFollowUpStatus: parsed.stage === "Enquiry" ? null : customer.enquiryFollowUpStatus,
          enquiryFollowUpOutcome: parsed.stage === "Enquiry" ? "" : customer.enquiryFollowUpOutcome,
          enquiryFollowUpOutcomeRecordedAt:
            parsed.stage === "Enquiry" ? null : customer.enquiryFollowUpOutcomeRecordedAt,
          lastServiceDate,
          lastJobValue,
          nextRepeatDueDate: nextRepeatDate,
          lastActivityAt: importedAt,
          lastActivityKind: reconciliation.progression ? "reconciled-intake" : "autopilot-intake",
          activeWorkThreadId: parsed.stage === "Completed job" ? null : workThreadId,
          lastCompletedWorkThreadId:
            parsed.stage === "Completed job" ? workThreadId : customer.lastCompletedWorkThreadId || null,
          history: nextHistory,
          sourceRecords: [...sourceRecords, sourceRecord],
          activity: [
            ...activity,
            {
              id: `activity-${customerId}-autopilot-${Date.now()}`,
              kind: "intake",
              date: eventDate,
              createdAt: importedAt,
              title: reconciliation.progression
                ? `${reconciliation.currentStage} → ${parsed.stage} reconciled automatically`
                : `${parsed.stage} filed automatically`,
              note: reconciliation.progression
                ? `BUSY recognised ${item.source || "this source"} as the next stage of the same customer journey instead of creating parallel work.`
                : `Safe Autopilot filed this from ${item.source || "incoming information"} because the existing customer match and extracted record passed every trust rule.`,
              value: value || "",
            },
          ],
        };
      })
    );

    if (parsed.stage === "Quote sent") {
      setReplyActions((current) => ({
        ...current,
        [customerId]: {
          ...(current[customerId] || {}),
          task: "Follow up the quote if needed",
          type: "quote",
          origin: "autopilot",
          createdAt: current[customerId]?.createdAt || importedAt,
          done: true,
          details: {
            ...(current[customerId]?.details || {}),
            quoteAmount: value || "",
            quoteStatus: "Sent",
            quoteSentAt: eventAt,
            followUpDueDate: addDaysFromISO(eventDate, 7),
            workThreadId,
            message: parsed.note || item.rawText || "",
            summary: `Safe Autopilot filed sent quote${value ? ` for £${value}` : ""}`,
          },
          completedAt: importedAt,
        },
      }));
    }

    if (parsed.stage === "Booking") {
      setReplyActions((current) => ({
        ...current,
        [customerId]: {
          ...(current[customerId] || {}),
          task: "Booked work",
          type: "booking",
          origin: "autopilot",
          createdAt: current[customerId]?.createdAt || importedAt,
          done: true,
          details: {
            ...(current[customerId]?.details || {}),
            bookingDate: eventDate,
            bookingTime: eventTime,
            bookingStatus: "Confirmed",
            jobValue: value || "",
            workThreadId,
            summary: `Safe Autopilot filed booking for ${formatUKDate(eventDate)} at ${eventTime}`,
          },
          completedAt: importedAt,
        },
      }));
    }

    if (parsed.stage === "Completed job") {
      setReplyActions((current) => {
        const currentAction = current[customerId] || {};
        return {
          ...current,
          [customerId]: {
            ...currentAction,
            task: "Completed work",
            type: "booking",
            origin: "autopilot",
            createdAt: currentAction.createdAt || importedAt,
            done: true,
            details: {
              ...(currentAction.details || {}),
              bookingDate: currentAction.details?.bookingDate || eventDate,
              bookingTime: currentAction.details?.bookingTime || eventTime,
              bookingStatus: "Completed",
              jobValue: value || currentAction.details?.jobValue || "",
              completionNote: parsed.note || item.rawText || "",
              jobCompletedAt: eventAt,
              workThreadId,
              summary: `Safe Autopilot reconciled completed job${value ? ` for £${value}` : ""}`,
            },
            completedAt: importedAt,
          },
        };
      });
    }

    setIntakeLog((items) => [
      ...items,
      {
        id: `intake-log-${Date.now()}`,
        customerId,
        customerName: parsed.name || existing.name,
        source: item.source || "Incoming",
        stage: parsed.stage,
        eventDate,
        importedAt,
        matchedExisting: true,
        matchReason: evaluation.match?.reason || "",
        confidence: parsed.confidence,
        autoFiled: true,
        sourceConnection: item.sourceConnection || "",
        workThreadId,
        reconciled: !!reconciliation.progression,
        previousStage: reconciliation.currentStage || "",
      },
    ]);

    const { triage: _triage, autoEvaluation: _autoEvaluation, ...persistableItem } = item;
    const filedItem = {
      ...persistableItem,
      parsed,
      status: "Filed",
      reviewedAt: importedAt,
      filedCustomerId: customerId,
      filedStage: parsed.stage,
      matchedExisting: true,
      autoFiled: true,
      autoFileReason: evaluation.reason,
      reconciled: !!reconciliation.progression,
      workThreadId,
      previousStage: reconciliation.currentStage || "",
    };
    setInboxItems((items) => {
      const exists = items.some((candidate) => candidate.id === item.id);
      return exists
        ? items.map((candidate) => (candidate.id === item.id ? filedItem : candidate))
        : [...items, filedItem];
    });
    setLastAutoFiledInboxItemId(item.id);
    return true;
  };

  const queueCaptureToInbox = async () => {
    const rawText = captureRawText.trim();
    const screenshots = captureScreenshots.map((shot, index) => ({
      id: shot.id,
      uri: shot.uri,
      fileName: shot.fileName || "",
      width: shot.width || 0,
      height: shot.height || 0,
      order: index + 1,
    }));
    if (!rawText && !screenshots.length) return false;

    let analysis = captureBrainStatus === "ready" ? captureBrainAnalysis : null;
    if (captureScreenshots.length && !analysis) {
      analysis = await runIntakeBrain();
    }
    if (!analysis && captureBrainStatus === "error") return false;

    if (!analysis && rawText) {
      const parsed = parseQuickCapture(
        rawText,
        services,
        services.find((item) => item.wanted)?.name || trade || "Service"
      );
      analysis = localIntakeBrainAnalysis({
        parsed,
        rawText,
        screenshots: [],
        orderConfidence: "Not needed",
        orderReason: "",
      });
    }

    const visionPending =
      !!captureScreenshots.length &&
      (!analysis || analysis.status === "needs_connection");

    const candidates =
      analysis?.threads?.length
        ? analysis.threads
        : [{
            id: "thread-1",
            label: "Screenshot batch",
            sourceText: rawText,
            imageIds: screenshots.map((shot) => shot.id),
            parsed: {
              stage: "Enquiry",
              name: "",
              phone: "",
              email: "",
              address: "",
              service: "",
              date: dateToISO(new Date()),
              time: "09:00",
              value: "",
              note: rawText,
              confidence: "Low",
              extractedFields: [],
              dateDetected: false,
              timeDetected: false,
              valueDetected: false,
              serviceDetected: false,
            },
            fieldConfidence: {},
            warnings: ["AI image reading is still required."],
            safeToAutoFile: false,
          }];

    const queuedAt = new Date().toISOString();
    const base = Date.now();
    const batchId = `ai-intake-${base}`;
    const pendingItems = [];
    let autoFiledCount = 0;

    candidates.forEach((candidate, index) => {
      const parsed = candidate.parsed || {};
      const candidateScreenshots = screenshots.filter(
        (shot) => !candidate.imageIds?.length || candidate.imageIds.includes(shot.id)
      );
      const aiTrustBlocked =
        visionPending ||
        candidate.safeToAutoFile === false ||
        (analysis?.mode === "live-vision" &&
          !criticalIntakeFieldsSafe(parsed, candidate.fieldConfidence || {}));

      const triage = triageInboxCandidate(parsed, customers, replyActions);
      const item = {
        id: `inbox-${base}-${index}`,
        status: "Pending",
        source: captureSource,
        rawText: candidate.sourceText || rawText,
        screenshots: candidateScreenshots.length ? candidateScreenshots : screenshots,
        screenshotOrderConfidence: analysis?.order?.confidence || captureScreenshotOrderConfidence,
        screenshotOrderReason: analysis?.order?.reason || captureScreenshotOrderReason,
        visionPending,
        aiTrustBlocked,
        aiBatchId: batchId,
        aiThreadIndex: index + 1,
        aiThreadCount: candidates.length,
        aiFieldConfidence: candidate.fieldConfidence || {},
        aiWarnings: candidate.warnings || [],
        aiAnalysis: analysis
          ? {
              mode: analysis.mode,
              summary: analysis.summary,
              threadCount: analysis.threadCount,
              order: analysis.order,
              overlapCount: analysis.overlapCount,
              warnings: analysis.warnings,
              thread: candidate,
            }
          : null,
        parsed,
        queuedAt,
        originalLane: aiTrustBlocked ? "Needs attention" : triage.lane,
        originalReason: visionPending
          ? "Screenshot batch attached — secure AI vision analysis still needs to run."
          : aiTrustBlocked
          ? "AI extraction needs owner review before any automatic record change."
          : triage.reason,
        originalPriorityScore: aiTrustBlocked
          ? Math.max(120, triage.priorityScore || 0)
          : triage.priorityScore,
      };

      const autoEvaluation = aiTrustBlocked
        ? {
            safe: false,
            reason: visionPending
              ? "Screenshot content has not been read yet."
              : "AI confidence is not strong enough for automatic filing.",
          }
        : evaluateSafeAutoFile(
            parsed,
            customers,
            replyActions,
            captureSource,
            candidate.sourceText || rawText
          );

      const autoFiled =
        !aiTrustBlocked &&
        recordFilingMode === "safe" &&
        autoEvaluation.safe &&
        fileSafeInboxItem(item, autoEvaluation);

      if (autoFiled) autoFiledCount += 1;
      else pendingItems.push(item);
    });

    if (pendingItems.length) setInboxItems((items) => [...items, ...pendingItems]);

    clearQuickCapture();
    setSelectedInboxItemId(null);
    setTab("Work");
    go(
      autoFiledCount === 1 && !pendingItems.length && candidates.length === 1
        ? "autopilotFiled"
        : "busyInbox"
    );
    return true;
  };
  const queueInboxTestBatch = () => {
    const service = services.find((item) => item.wanted)?.name || services[0]?.name || "Driveway cleaning";
    const today = dateToISO(new Date());
    const examples = [
      {
        source: "Customer message",
        rawText: `Name: Jamie Wilson\nPhone: 07700 901001\nHi, could I get a quote for ${service.toLowerCase()} please?\nAddress: 2 Mill Lane EX17 4AA`,
      },
      {
        source: "Email / quote note",
        rawText: `Name: Lucy Brown\nPhone: 07700 901002\nEmail: lucy.brown@example.com\n${service}\nQuote sent ${addDaysFromISO(today, -10)} for £390\nAddress: 14 Fore Street EX17 3BB`,
      },
      {
        source: "Calendar / booking note",
        rawText: `Customer: Noah Patel\n07700 901003\nBooked ${service} for ${addDaysFromISO(today, 3)} at 10:30\nJob value £310\nSite: 6 Station Road EX17 2CC`,
      },
      {
        source: "Phone note",
        rawText: "Morgan\nCalled about some work at EX17 5DD. Please call back.",
      },
    ];
    const base = Date.now();
    const queuedAt = new Date().toISOString();
    const items = examples.map((example, index) => {
      const parsed = parseQuickCapture(
        example.rawText,
        services,
        services.find((item) => item.wanted)?.name || trade || "Service"
      );
      const triage = triageInboxCandidate(parsed, customers, replyActions);
      return {
        id: `inbox-test-${base}-${index}`,
        status: "Pending",
        source: example.source,
        rawText: example.rawText,
        parsed,
        queuedAt,
        originalLane: triage.lane,
        originalReason: triage.reason,
        originalPriorityScore: triage.priorityScore,
        testItem: true,
      };
    });
    setInboxItems((current) => [...current, ...items]);
  };

  const runConnectedSourceDemoSync = () => {
    const sourceKeys = intakeConnectionKeys.filter((key) => !!connectedAccounts[key]);
    if (!sourceKeys.length) {
      Alert.alert(
        "No intake source selected",
        "Connect Email, Calendar, CRM / job system or Invoicing first. This remains a prototype connection — no real account will be read."
      );
      return false;
    }

    const availableCustomers = customers.filter(
      (customer) =>
        !!customer.phone &&
        !!customer.service &&
        !isActiveCustomerAction(replyActions[customer.id])
    );
    const usedCustomerIds = new Set();
    const takeCustomer = () => {
      const unused = availableCustomers.find((customer) => !usedCustomerIds.has(customer.id));
      const customer = unused || availableCustomers[usedCustomerIds.size % Math.max(1, availableCustomers.length)] || null;
      if (customer) usedCustomerIds.add(customer.id);
      return customer;
    };

    const today = dateToISO(new Date());
    const base = Date.now();
    const queuedAt = new Date().toISOString();
    const examples = [];

    sourceKeys.forEach((key, index) => {
      const customer = key === "email" ? null : takeCustomer();
      if (key === "email") {
        examples.push({
          key,
          source: "Connected Email • demo",
          rawText: `Name: Alex Morgan\nPhone: 07700 90300${index}\nEmail: alex.morgan${index}@example.com\nHi, could I get a quote for ${(services.find((item) => item.wanted)?.name || services[0]?.name || "your service").toLowerCase()} please?\nAddress: 18 Market Road EX17 4XY`,
        });
      } else if (key === "calendar" && customer) {
        examples.push({
          key,
          source: "Connected Calendar • demo",
          rawText: `Customer: ${customer.name}\n${customer.phone}\nBooked ${customer.service} for ${addDaysFromISO(today, 4)} at 10:30\nJob value £${Number(customer.lastJobValue) || 250}\nSite: ${customer.address || "12 Demo Lane EX17 2AA"}`,
        });
      } else if (key === "crm" && customer) {
        examples.push({
          key,
          source: "Connected CRM • demo",
          rawText: `Name: ${customer.name}\nPhone: ${customer.phone}\n${customer.service}\nQuote sent ${today} for £${Math.max(100, Number(customer.lastJobValue) || 250)}\nAddress: ${customer.address || "6 Customer Close EX17 3BB"}`,
        });
      } else if (key === "invoicing" && customer) {
        examples.push({
          key,
          source: "Connected Invoicing • demo",
          rawText: `Customer: ${customer.name}\n${customer.phone}\nFinished ${customer.service} ${addDaysFromISO(today, -1)}\nPaid £${Math.max(80, Number(customer.lastJobValue) || 220)}\nAddress: ${customer.address || "9 Invoice Way EX17 5CC"}`,
        });
      } else {
        const service = services.find((item) => item.wanted)?.name || services[0]?.name || "Service";
        examples.push({
          key,
          source: `Connected ${key} • demo`,
          rawText: `Name: Demo ${key}\nPhone: 07700 9040${index}\nNew enquiry received today asking about ${service.toLowerCase()}.`,
        });
      }
    });

    let autoFiledCount = 0;
    const pendingItems = [];

    examples.forEach((example, index) => {
      const parsed = parseQuickCapture(
        example.rawText,
        services,
        services.find((item) => item.wanted)?.name || trade || "Service"
      );
      const triage = triageInboxCandidate(parsed, customers, replyActions);
      const item = {
        id: `connected-sync-${base}-${index}`,
        status: "Pending",
        source: example.source,
        sourceConnection: example.key,
        connectedDemo: true,
        rawText: example.rawText,
        parsed,
        queuedAt,
        originalLane: triage.lane,
        originalReason: triage.reason,
        originalPriorityScore: triage.priorityScore,
        testItem: true,
      };
      const evaluation = evaluateSafeAutoFile(
        parsed,
        customers,
        replyActions,
        item.source,
        item.rawText
      );
      const autoFiled =
        recordFilingMode === "safe" &&
        evaluation.safe &&
        fileSafeInboxItem(item, evaluation);
      if (autoFiled) {
        autoFiledCount += 1;
      } else {
        pendingItems.push(item);
      }
    });

    if (pendingItems.length) {
      setInboxItems((current) => [...current, ...pendingItems]);
    }
    setConnectionSyncLog((log) => [
      ...log,
      {
        id: `connection-sync-${base}`,
        syncedAt: queuedAt,
        sourceKeys,
        itemCount: examples.length,
        autoFiledCount,
        queuedForReviewCount: pendingItems.length,
        prototype: true,
      },
    ]);
    setTab("Work");
    go("busyInbox");
    return true;
  };

  const queueCrossSourceJourneyDemo = () => {
    const customer = customers.find(
      (candidate) =>
        !!candidate.phone &&
        !!candidate.service &&
        !isActiveCustomerAction(replyActions[candidate.id]) &&
        !candidate.currentEnquiryAt
    );
    if (!customer) {
      Alert.alert(
        "No clean demo customer available",
        "Clear or complete one existing prototype customer's active work, then try the reconciliation demo again."
      );
      return false;
    }

    const today = dateToISO(new Date());
    const yesterday = addDaysFromISO(today, -1);
    const address = customer.address || "24 Journey Lane EX17 7AA";
    const value = Math.max(120, Number(customer.lastJobValue) || 260);
    const base = Date.now();
    const demoId = `journey-demo-${base}`;
    const examples = [
      {
        source: "Connected Email • journey demo",
        sourceConnection: "email",
        rawText: `Name: ${customer.name}\nPhone: ${customer.phone}\n${customer.service}\nAddress: ${address}\nHi, could I get a quote for ${customer.service.toLowerCase()} please?`,
      },
      {
        source: "Connected CRM • journey demo",
        sourceConnection: "crm",
        rawText: `Name: ${customer.name}\nPhone: ${customer.phone}\n${customer.service}\nQuote sent ${yesterday} for £${value}\nAddress: ${address}`,
      },
      {
        source: "Connected Calendar • journey demo",
        sourceConnection: "calendar",
        rawText: `Customer: ${customer.name}\n${customer.phone}\nBooked ${customer.service} for ${today} at 10:30\nJob value £${value}\nSite: ${address}`,
      },
      {
        source: "Connected Invoicing • journey demo",
        sourceConnection: "invoicing",
        rawText: `Customer: ${customer.name}\n${customer.phone}\nFinished ${customer.service} ${today}\nPaid £${value}\nAddress: ${address}`,
      },
    ];
    const queuedAt = new Date().toISOString();
    const items = examples.map((example, index) => {
      const parsed = parseQuickCapture(example.rawText, services, customer.service);
      const triage = triageInboxCandidate(parsed, customers, replyActions);
      return {
        id: `reconcile-demo-${base}-${index}`,
        status: "Pending",
        source: example.source,
        sourceConnection: example.sourceConnection,
        connectedDemo: true,
        reconciliationDemoId: demoId,
        reconciliationSequence: index + 1,
        rawText: example.rawText,
        parsed,
        queuedAt,
        originalLane: triage.lane,
        originalReason: triage.reason,
        originalPriorityScore: triage.priorityScore,
        testItem: true,
      };
    });
    setInboxItems((current) => [...current, ...items]);
    setTab("Work");
    go("busyInbox");
    return true;
  };

  const queueSafeAutopilotExample = () => {
    const customer = customers.find(
      (candidate) =>
        !!candidate.phone &&
        !!candidate.service &&
        !isActiveCustomerAction(replyActions[candidate.id]) &&
        !candidate.currentEnquiryAt
    );
    if (!customer) return false;

    const testAddress = customer.address || "22 Test Lane EX17 9ZZ";
    const rawText =
      `Name: ${customer.name}\nPhone: ${customer.phone}\n${customer.service}\nAddress: ${testAddress}\nNew enquiry received today asking about ${customer.service.toLowerCase()}.`;
    const parsed = parseQuickCapture(rawText, services, customer.service);
    const triage = triageInboxCandidate(parsed, customers, replyActions);
    const item = {
      id: `inbox-autopilot-test-${Date.now()}`,
      status: "Pending",
      source: "Safe Autopilot test",
      rawText,
      parsed,
      queuedAt: new Date().toISOString(),
      originalLane: triage.lane,
      originalReason: triage.reason,
      originalPriorityScore: triage.priorityScore,
      testItem: true,
    };
    const evaluation = evaluateSafeAutoFile(
      parsed,
      customers,
      replyActions,
      item.source,
      rawText
    );
    const autoFiled =
      recordFilingMode === "safe" &&
      evaluation.safe &&
      fileSafeInboxItem(item, evaluation);

    if (!autoFiled) setInboxItems((items) => [...items, item]);
    setTab("Work");
    go(autoFiled ? "autopilotFiled" : "busyInbox");
    return true;
  };

  const openInboxItem = (id) => {
    const item = inboxItems.find((candidate) => candidate.id === id);
    if (!item || item.status !== "Pending") return;
    const parsed = item.parsed || parseQuickCapture(item.rawText, services, trade);
    setSelectedInboxItemId(id);
    setCaptureForceNew(false);
    setCaptureRawText(item.rawText || "");
    setCaptureScreenshots(Array.isArray(item.screenshots) ? item.screenshots : []);
    setCaptureScreenshotOrderConfidence(
      item.screenshotOrderConfidence || (item.screenshots?.length ? "Check order" : "Not checked")
    );
    setCaptureScreenshotOrderReason(item.screenshotOrderReason || "");
    setCaptureBrainAnalysis(item.aiAnalysis || null);
    setCaptureBrainStatus(item.aiAnalysis ? "ready" : item.visionPending ? "needs_connection" : "idle");
    setCaptureBrainError("");
    setCaptureSource(item.source || "Customer message");
    setCaptureStage(parsed.stage || "Enquiry");
    setCaptureName(parsed.name || "");
    setCapturePhone(parsed.phone || "");
    setCaptureEmail(parsed.email || "");
    setCaptureAddress(parsed.address || "");
    setCaptureService(parsed.service || "");
    setCaptureDate(parsed.date || dateToISO(new Date()));
    setCaptureTime(parsed.time || "09:00");
    setCaptureValue(parsed.value || "");
    setCaptureNote(parsed.note || item.rawText || "");
    setCaptureConfidence(parsed.confidence || "Low");
    setCaptureExtractedFields(parsed.extractedFields || []);
    setTab("Work");
    go("quickCaptureReview");
  };

  const dismissInboxItem = (id) => {
    const reviewedAt = new Date().toISOString();
    setInboxItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, status: "Dismissed", reviewedAt }
          : item
      )
    );
  };

  const reopenInboxItem = (id) => {
    setInboxItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, status: "Pending", reviewedAt: null }
          : item
      )
    );
  };

  const openBusyInbox = () => {
    setTab("Work");
    go("busyInbox");
  };

  const analyseQuickCapture = async () => {
    setSelectedInboxItemId(null);

    if (captureScreenshots.length) {
      const analysis =
        captureBrainStatus === "ready" && captureBrainAnalysis
          ? captureBrainAnalysis
          : await runIntakeBrain();

      if (!analysis) return false;
      if (analysis.threads?.length === 1) applyBrainThreadToCapture(analysis.threads[0]);
      go("quickCaptureReview");
      return true;
    }

    const parsed = parseQuickCapture(
      captureRawText,
      services,
      services.find((item) => item.wanted)?.name || trade || "Service"
    );
    setCaptureStage(parsed.stage);
    setCaptureName(parsed.name);
    setCapturePhone(parsed.phone);
    setCaptureEmail(parsed.email);
    setCaptureAddress(parsed.address);
    setCaptureService(parsed.service);
    setCaptureDate(parsed.date);
    setCaptureTime(parsed.time);
    setCaptureValue(parsed.value);
    setCaptureNote(parsed.note);
    setCaptureConfidence(parsed.confidence);
    setCaptureExtractedFields(parsed.extractedFields);
    setCaptureBrainAnalysis(localIntakeBrainAnalysis({
      parsed,
      rawText: captureRawText,
      screenshots: [],
      orderConfidence: "Not needed",
      orderReason: "",
    }));
    setCaptureBrainStatus("ready");
    go("quickCaptureReview");
    return true;
  };
  const saveQuickCapture = () => {
    const name = captureName.trim();
    const phone = capturePhone.trim();
    const email = captureEmail.trim();
    const address = captureAddress.trim();
    const service = captureService.trim();
    const note =
      captureNote.trim() ||
      captureRawText.trim() ||
      (captureScreenshots.length
        ? `Captured from ${captureScreenshots.length} screenshot${captureScreenshots.length === 1 ? "" : "s"}.`
        : "");
    const parsedValue = Number(String(captureValue).replace(/[^0-9.]/g, ""));
    const value = Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
    if (!name || !service || (!phone && !email)) return false;

    const match = captureForceNew ? null : findCustomerMatch(customers, { phone, email, name });
    const existing = match?.customer || null;
    const customerId = existing?.id || `intake-${Date.now()}`;
    const eventDate = captureDate || dateToISO(new Date());
    const eventTime = captureTime || "09:00";
    const eventAt = new Date(`${eventDate}T${eventTime}:00`).toISOString();
    const importedAt = new Date().toISOString();
    const sourceRecord = {
      id: `source-${customerId}-${Date.now()}`,
      source: captureSource,
      stage: captureStage,
      eventDate,
      importedAt,
      rawText: captureRawText.trim(),
      screenshots: captureScreenshots.map((shot, index) => ({
        id: shot.id,
        uri: shot.uri,
        fileName: shot.fileName || "",
        width: shot.width || 0,
        height: shot.height || 0,
        order: index + 1,
      })),
      screenshotOrderConfidence: captureScreenshotOrderConfidence,
      screenshotOrderReason: captureScreenshotOrderReason,
      aiAnalysisMode: captureBrainAnalysis?.mode || "",
      aiAnalysisSummary: captureBrainAnalysis?.summary || "",
      aiFieldConfidence:
        captureBrainAnalysis?.thread?.fieldConfidence ||
        captureBrainAnalysis?.threads?.[0]?.fieldConfidence ||
        {},
    };
    const existingAction = replyActions[customerId];
    const preserveStrongerActiveWork =
      !!existing &&
      customerActionStrength(existingAction) > captureStageStrength(captureStage);

    const repeatDueDate =
      captureStage === "Completed job"
        ? nextRepeatDueDate(
            { ...(existing || {}), service, lastServiceDate: eventDate },
            services,
            verticalId
          )
        : existing?.nextRepeatDueDate || "";

    const firstName = name.split(" ")[0] || "there";
    const reviewDraft =
      captureStage === "Completed job" && existing?.contactOk !== false
        ? `Hi ${firstName}, thanks again for choosing us for your ${service.toLowerCase()}. If you were happy with the work, would you mind leaving us a quick review? No problem at all if not — we really appreciate the business.`
        : "";

    setCustomers((list) => {
      const base =
        existing ||
        {
          id: customerId,
          name,
          phone,
          email,
          address,
          service,
          lastServiceDate: "",
          lastJobValue: 0,
          contactOk: true,
          createdAt: eventAt,
          source: captureSource,
          history: [],
          activity: [],
          sourceRecords: [],
        };

      const activity = Array.isArray(base.activity) ? base.activity : [];
      const sourceRecords = Array.isArray(base.sourceRecords) ? base.sourceRecords : [];
      const history = Array.isArray(base.history) ? base.history : [];
      let nextHistory = history;
      let lifecycleStatus = base.lifecycleStatus || (base.lastServiceDate ? "Previous customer" : "Enquiry");
      let currentEnquiryAt = base.currentEnquiryAt || null;
      let nextEnquiryCheckDate = base.nextEnquiryCheckDate || null;
      let lastServiceDate = base.lastServiceDate || "";
      let lastJobValue = base.lastJobValue || 0;
      let nextRepeatDate = repeatDueDate || base.nextRepeatDueDate || "";

      if (captureStage === "Enquiry" && !preserveStrongerActiveWork) {
        lifecycleStatus = "Enquiry";
        currentEnquiryAt = eventAt;
        nextEnquiryCheckDate = addDaysFromISO(eventDate, 7);
      } else if (captureStage === "Quote sent") {
        lifecycleStatus = "Quote sent";
        currentEnquiryAt = null;
        nextEnquiryCheckDate = null;
      } else if (captureStage === "Booking") {
        lifecycleStatus = "Booked";
        currentEnquiryAt = null;
        nextEnquiryCheckDate = null;
      } else if (captureStage === "Completed job") {
        lifecycleStatus = "Completed customer";
        currentEnquiryAt = null;
        nextEnquiryCheckDate = null;
        lastServiceDate = eventDate;
        lastJobValue = value || base.lastJobValue || 0;
        const jobId = `import-job-${customerId}-${eventDate}`;
        const existingJob = history.find(
          (item) => item.kind === "job" && item.date === eventDate && item.service === service
        );
        if (!existingJob) {
          nextHistory = [
            ...history,
            {
              id: jobId,
              kind: "job",
              date: eventDate,
              service,
              value: value || "",
              note: note || "Imported completed job",
              photos: [],
              sourceOrigin: "intake",
              sourceAction: "quick-capture",
              repeatDueDate: repeatDueDate || "",
              reviewRequestDraft: reviewDraft,
              reviewRequestPreparedAt: reviewDraft ? importedAt : null,
              adminPreparedAt: importedAt,
            },
          ];
        }
      }

      const nextCustomer = {
        ...base,
        name: name || base.name,
        phone: phone || base.phone || "",
        email: email || base.email || "",
        address: address || base.address || "",
        service: service || base.service,
        lifecycleStatus: preserveStrongerActiveWork ? base.lifecycleStatus : lifecycleStatus,
        currentEnquiryAt: preserveStrongerActiveWork ? base.currentEnquiryAt : currentEnquiryAt,
        nextEnquiryCheckDate: preserveStrongerActiveWork ? base.nextEnquiryCheckDate : nextEnquiryCheckDate,
        enquiryFollowUpSentAt:
          captureStage === "Enquiry" && !preserveStrongerActiveWork ? null : base.enquiryFollowUpSentAt,
        enquiryFollowUpStatus:
          captureStage === "Enquiry" && !preserveStrongerActiveWork ? null : base.enquiryFollowUpStatus,
        enquiryFollowUpOutcome:
          captureStage === "Enquiry" && !preserveStrongerActiveWork ? "" : base.enquiryFollowUpOutcome,
        enquiryFollowUpOutcomeRecordedAt:
          captureStage === "Enquiry" && !preserveStrongerActiveWork ? null : base.enquiryFollowUpOutcomeRecordedAt,
        lastServiceDate,
        lastJobValue,
        nextRepeatDueDate: nextRepeatDate,
        lastActivityAt: importedAt,
        lastActivityKind: "intake",
        history: nextHistory,
        sourceRecords: [...sourceRecords, sourceRecord],
        activity: [
          ...activity,
          {
            id: `activity-${customerId}-intake-${Date.now()}`,
            kind: "intake",
            date: eventDate,
            createdAt: importedAt,
            title: preserveStrongerActiveWork
              ? `${captureSource} attached to existing active work`
              : `${captureStage} captured from ${captureSource}`,
            note:
              preserveStrongerActiveWork
                ? "BUSY matched this incoming information to an existing customer and kept the stronger active workflow instead of creating a contradictory new enquiry."
                : note,
            value: value || "",
          },
        ],
      };

      return existing
        ? list.map((customer) => (customer.id === customerId ? nextCustomer : customer))
        : [...list, nextCustomer];
    });

    if (!preserveStrongerActiveWork && captureStage === "Quote sent") {
      setReplyActions((current) => ({
        ...current,
        [customerId]: {
          ...(current[customerId] || {}),
          task: "Follow up the quote if needed",
          type: "quote",
          origin: "intake",
          createdAt: current[customerId]?.createdAt || importedAt,
          done: true,
          details: {
            ...(current[customerId]?.details || {}),
            quoteAmount: value || "",
            quoteStatus: "Sent",
            quoteSentAt: eventAt,
            followUpDueDate: addDaysFromISO(eventDate, 7),
            message: note,
            summary: `Imported sent quote${value ? ` for £${value}` : ""}`,
          },
          completedAt: importedAt,
        },
      }));
    }

    if (!preserveStrongerActiveWork && captureStage === "Booking") {
      setReplyActions((current) => ({
        ...current,
        [customerId]: {
          ...(current[customerId] || {}),
          task: "Booked work",
          type: "booking",
          origin: "intake",
          createdAt: current[customerId]?.createdAt || importedAt,
          done: true,
          details: {
            ...(current[customerId]?.details || {}),
            bookingDate: eventDate,
            bookingTime: eventTime,
            bookingStatus: "Confirmed",
            jobValue: value || "",
            summary: `Imported booking for ${formatUKDate(eventDate)} at ${eventTime}`,
          },
          completedAt: importedAt,
        },
      }));
    }

    if (captureStage === "Completed job" && existingAction) {
      setReplyActions((current) => {
        const currentAction = current[customerId];
        if (!currentAction) return current;
        return {
          ...current,
          [customerId]: {
            ...currentAction,
            type: "booking",
            done: true,
            details: {
              ...(currentAction.details || {}),
              bookingDate: eventDate,
              bookingTime: eventTime,
              bookingStatus: "Completed",
              jobValue: value || currentAction.details?.jobValue || "",
              completionNote: note,
              jobCompletedAt: eventAt,
              summary: `Imported completed job${value ? ` for £${value}` : ""}`,
            },
            completedAt: importedAt,
          },
        };
      });
    }

    setIntakeLog((items) => [
      ...items,
      {
        id: `intake-log-${Date.now()}`,
        customerId,
        customerName: name,
        source: captureSource,
        stage: captureStage,
        eventDate,
        importedAt,
        matchedExisting: !!existing,
        matchReason: match?.reason || "",
        confidence: captureConfidence,
        screenshotCount: captureScreenshots.length,
        screenshotOrderConfidence: captureScreenshotOrderConfidence,
      },
    ]);

    if (selectedInboxItemId) {
      setInboxItems((items) =>
        items.map((item) =>
          item.id === selectedInboxItemId
            ? {
                ...item,
                status: "Filed",
                reviewedAt: importedAt,
                filedCustomerId: customerId,
                filedStage: captureStage,
                matchedExisting: !!existing,
              }
            : item
        )
      );
    }

    setSelectedCustomerId(customerId);
    setSelectedInboxItemId(null);
    go("quickCaptureSaved");
    return true;
  };

  const addCustomerNote = (customerId) => {
    const note = customerNoteText.trim();
    if (!note) return;
    appendCustomerActivity(customerId, {
      kind: "note",
      title: "Note",
      note,
    });
    setCustomerNoteText("");
  };

  const requestRemoveCustomer = (id) => {
    setPendingRemoveCustomerId(id);
    go("confirmRemoveCustomer");
  };

  const confirmRemoveCustomer = () => {
    const id = pendingRemoveCustomerId;
    if (!id) return;
    setCustomers((list) => list.filter((customer) => customer.id !== id));
    setLastSimulatedRecipients((list) => list.filter((customer) => customer.id !== id));
    setReplyActions((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setPendingRemoveCustomerId(null);
    back();
  };

  const resetPrototype = async ({ preserveUserCache = false } = {}) => {
    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY).catch(() => {});
    const currentUserCache = storageKeyForUser(ownerSession?.userId || "");
    if (currentUserCache && !preserveUserCache) {
      await AsyncStorage.removeItem(currentUserCache).catch(() => {});
    }
    await AsyncStorage.removeItem("@busy-does-it-weekly-brief-v39").catch(() => {});
    await AsyncStorage.removeItem("@busy-does-it-home-brief-v39").catch(() => {});
    setOnboardingComplete(false);
    setBusinessName("Dave's Exterior Cleaning");
    setTrade("Exterior cleaning");
    setVerticalId("exterior-cleaning");
    setPostcode("EX17");
    setRadius("15");
    setQuietSlot("Thursday afternoon");
    setQuietSlotConfirmed(false);
    setSelectedGap("");
    setWorkGoalTargetDraft(1);
    setActiveWorkGoal(null);
    setCampaignRecipientLimit(null);
    setUnansweredReviewCount("4");
    setRecentPhotoCountNeeded("2");
    setCustomers(customerSeed);
    setNewCustomerName("");
    setNewCustomerPhone("");
    setNewCustomerAddress("");
    setNewCustomerService("Driveway cleaning");
    setNewCustomerDate("2025-01-01");
    setNewCustomerValue("");
    setNewCustomerContactOk(true);
    setNewEnquiryAddress("");
    setNewEnquiryCustomService("");
    setServiceMessages({});
    setLastSimulatedRecipients([]);
    setReactivationRuns([]);
    setReplyActions({});
    setSelectedReplyActionId(null);
    setSelectedCustomerId(null);
    setActionJobValue("");
    setActionJobNote("");
    setActionQuoteSentDate(dateToISO(new Date()));
    setSelectedJobId(null);
    setPendingJobPhotos([]);
    setJobPhotosMarketingOk(false);
    setJobPostDraft("");
    setEditingCustomerId(null);
    setPendingRemoveCustomerId(null);
    setServices(servicesSeed);
    setNewServiceDuration("2");
    setAlwaysAsk(true);
    setCustomerContact(true);
    setTestLimit("25");
    setWeeklyLimit("100");
    setConnectedAccounts(connectionSeed);
    setDismissedOpportunities([]);
    setSelectedServiceId("driveway");
    setJobPostChannels({ facebook: false, instagram: false, googleBusiness: false });
    setJobPostOutcome("No enquiry yet");
    setJobPostOutcomeValue("");
    setSocialDrafts([]);
    setSocialCreatePhotos([]);
    setSocialBrief("");
    setSocialAiStatus("idle");
    setSocialAiResult(null);
    setSocialAiError("");
    setSocialCaptionId("");
    setSocialDraftText("");
    setSocialDraftChannels({ facebook: false, instagram: false, googleBusiness: false });
    setSelectedSocialDraftId(null);
    setBusinessBrainRules([]);
    setBusinessBrainRuleDraft("");
    setBusinessBrainFeedback([]);
    setProactiveNoticeState({});
    setBusyCommandHistory([]);
    setBusyCommandStatus("idle");
    setBusyCommandResult(null);
    setBusyCommandError("");
    setBusyVoiceStartNonce(0);
    setBusyConversationTurns([]);
    setBusyOperatorSnapshot(null);
    setBusyActionAudit([]);
    setBusyUndoAction(null);
    setPendingBrainFeedback(null);
    setBrainFeedbackReason("");
    setQuoteFollowUpDraft("");
    setQuoteFollowUpOutcome("No reply yet");
    setEnquiryFollowUpDraft("");
    setEnquiryFollowUpOutcome("No reply yet");
    setReviewRequestDraft("");
    setReviewRequestOutcome("No response yet");
    setCaptureRawText("");
    setCaptureSource("Customer message");
    setCaptureStage("Enquiry");
    setCaptureName("");
    setCapturePhone("");
    setCaptureEmail("");
    setCaptureAddress("");
    setCaptureService("");
    setCaptureDate(dateToISO(new Date()));
    setCaptureTime("09:00");
    setCaptureValue("");
    setCaptureNote("");
    setCaptureConfidence("Low");
    setCaptureExtractedFields([]);
    setCaptureForceNew(false);
    setIntakeLog([]);
    setInboxItems([]);
    setConnectionSyncLog([]);
    setSelectedInboxItemId(null);
    setRecordFilingMode("safe");
    setLastAutoFiledInboxItemId(null);
    setAdvanced(false);
    setHistory([]);
    setTab("Home");
    setScreen("welcome");
  };

  const selectedService = services.find((x) => x.id === selectedServiceId) || services[0];
  const eligibleCustomers = customerContact
    ? customers
        .filter(
          (customer) =>
            isEligibleCustomer(customer, services, verticalId) &&
            !hasActiveCustomerWork(customer.id)
        )
        .sort((a, b) => {
          const aOverdue = monthsSince(a.lastServiceDate) - Number(repeatMonthsForCustomer(a, services, verticalId) || 0);
          const bOverdue = monthsSince(b.lastServiceDate) - Number(repeatMonthsForCustomer(b, services, verticalId) || 0);
          if (bOverdue !== aOverdue) return bOverdue - aOverdue;
          return (Number(b.lastJobValue) || 0) - (Number(a.lastJobValue) || 0);
        })
    : [];
  const unresolvedEnquiryEntries = customers
    .filter(
      (customer) =>
        !!(customer.currentEnquiryAt || (!customer.lastServiceDate && customer.createdAt)) &&
        !replyActions[customer.id] &&
        !customer.enquiryFollowUpOutcomeRecordedAt
    )
    .map((customer) => {
      const enquiryAt = customer.currentEnquiryAt || customer.createdAt;
      return {
        customer,
        enquiryAt,
        age: daysSinceTimestamp(enquiryAt),
      };
    })
    .filter((entry) => entry.age !== null)
    .sort((a, b) => b.age - a.age);
  const staleEnquiryEntries = unresolvedEnquiryEntries.filter(
    (entry) => {
      const dueDate =
        entry.customer.nextEnquiryCheckDate ||
        (entry.enquiryAt
          ? addDaysFromISO(String(entry.enquiryAt).slice(0, 10), 7)
          : null);
      return (
        !!dueDate &&
        dueDate <= todayISO &&
        entry.customer.contactOk !== false &&
        !entry.customer.enquiryFollowUpSentAt
      );
    }
  );
  const freshEnquiryEntries = unresolvedEnquiryEntries.filter(
    (entry) => {
      const dueDate =
        entry.customer.nextEnquiryCheckDate ||
        (entry.enquiryAt
          ? addDaysFromISO(String(entry.enquiryAt).slice(0, 10), 7)
          : null);
      return !!dueDate && dueDate > todayISO && !entry.customer.enquiryFollowUpSentAt;
    }
  );
  const enquiryFollowUpEntries = customers
    .filter(
      (customer) =>
        !!customer.enquiryFollowUpSentAt
    )
    .map((customer) => ({
      customer,
      age: daysSinceTimestamp(customer.enquiryFollowUpSentAt),
    }));
  const enquiryFollowUpSentCount = enquiryFollowUpEntries.length;
  const enquiryFollowUpOutcomeCount = enquiryFollowUpEntries.filter(
    (entry) => !!entry.customer.enquiryFollowUpOutcomeRecordedAt
  ).length;
  const enquiryFollowUpInterestedCount = enquiryFollowUpEntries.filter(
    (entry) => entry.customer.enquiryFollowUpOutcome === "Still interested"
  ).length;
  const enquiryFollowUpOutcomeEntry =
    enquiryFollowUpEntries.find(
      (entry) => !entry.customer.enquiryFollowUpOutcomeRecordedAt
    ) || null;
  const enquiryFollowUpOutcomeOpportunity = enquiryFollowUpOutcomeEntry
    ? {
        customerId: enquiryFollowUpOutcomeEntry.customer.id,
        customerName: enquiryFollowUpOutcomeEntry.customer.name,
        service: enquiryFollowUpOutcomeEntry.customer.service,
      }
    : null;
  const openEnquiryCount = unresolvedEnquiryEntries.length + enquiryFollowUpEntries.filter(
    (entry) => !entry.customer.enquiryFollowUpOutcomeRecordedAt
  ).length;
  const pendingReplyActionCount = Object.values(replyActions).filter((action) => action && !action.done).length;
  const completedReplyActions = Object.values(replyActions).filter((action) => action && action.done);
  const completedQuoteCount = completedReplyActions.filter((action) => action.type === "quote").length;
  const completedBookingCount = completedReplyActions.filter((action) => action.type === "booking").length;
  const completedReminderCount = completedReplyActions.filter((action) => action.type === "reminder").length;
  const selectedReplyCustomer =
    customers.find((customer) => customer.id === selectedReplyActionId) ||
    lastSimulatedRecipients.find((customer) => customer.id === selectedReplyActionId) ||
    null;
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) || null;
  const selectedJobCustomer = selectedJobId
    ? customers.find((customer) =>
        (Array.isArray(customer.history) ? customer.history : []).some((item) => item.id === selectedJobId)
      ) || selectedCustomer
    : selectedCustomer;
  const selectedJob = selectedJobCustomer
    ? (Array.isArray(selectedJobCustomer.history) ? selectedJobCustomer.history : []).find((item) => item.id === selectedJobId) || null
    : null;
  const todayISO = dateToISO(new Date());
  const dueReminderEntries = Object.entries(replyActions)
    .map(([id, action]) => {
      if (
        action?.type !== "reminder" ||
        !action?.done ||
        !action.details?.reminderDate ||
        action.details?.reminderStatus === "Completed" ||
        action.details.reminderDate > todayISO
      ) return null;
      const customer = customers.find((item) => item.id === id) ||
        lastSimulatedRecipients.find((item) => item.id === id);
      return customer ? { id, action, customer } : null;
    })
    .filter(Boolean);
  const dueQuoteEntries = Object.entries(replyActions)
    .map(([id, action]) => {
      if (
        action?.type !== "quote" ||
        !action?.done ||
        action.details?.quoteStatus !== "Sent" ||
        !!action.details?.followUpSentAt
      ) return null;
      const sentAt = action.details?.quoteSentAt || action.completedAt;
      const age = daysSinceTimestamp(sentAt);
      const followUpDueDate =
        action.details?.followUpDueDate ||
        (sentAt ? addDaysFromISO(String(sentAt).slice(0, 10), 7) : null);
      if (!followUpDueDate || followUpDueDate > todayISO || age === null) return null;
      const customer =
        customers.find((item) => item.id === id) ||
        lastSimulatedRecipients.find((item) => item.id === id);
      return customer ? { id, action, customer, age } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.age - a.age);

  const quoteFollowUpEntries = Object.entries(replyActions)
    .map(([id, action]) => {
      if (action?.type !== "quote" || !action.details?.followUpSentAt) return null;
      const customer =
        customers.find((item) => item.id === id) ||
        lastSimulatedRecipients.find((item) => item.id === id);
      return customer ? { id, action, customer } : null;
    })
    .filter(Boolean);
  const quoteFollowUpSentCount = quoteFollowUpEntries.length;
  const quoteFollowUpOutcomeCount = quoteFollowUpEntries.filter(
    (entry) => !!entry.action.details?.followUpOutcomeRecordedAt
  ).length;
  const quoteFollowUpAcceptedCount = quoteFollowUpEntries.filter(
    (entry) => entry.action.details?.followUpOutcome === "Accepted"
  ).length;
  const quoteFollowUpAcceptedValue = quoteFollowUpEntries.reduce(
    (total, entry) =>
      total +
      (entry.action.details?.followUpOutcome === "Accepted"
        ? Number(entry.action.details?.quoteAmount) || 0
        : 0),
    0
  );
  const quoteFollowUpOutcomeEntry =
    quoteFollowUpEntries
      .filter((entry) => !entry.action.details?.followUpOutcomeRecordedAt)
      .sort((a, b) =>
        String(b.action.details?.followUpSentAt || "").localeCompare(
          String(a.action.details?.followUpSentAt || "")
        )
      )[0] || null;
  const quoteFollowUpOutcomeOpportunity = quoteFollowUpOutcomeEntry
    ? {
        customerId: quoteFollowUpOutcomeEntry.id,
        customerName: quoteFollowUpOutcomeEntry.customer.name,
        service: quoteFollowUpOutcomeEntry.customer.service,
        quoteAmount: Number(quoteFollowUpOutcomeEntry.action.details?.quoteAmount) || 0,
      }
    : null;

  const activeQuoteValue = Object.values(replyActions)
    .filter((action) =>
      action?.type === "quote" &&
      action?.done &&
      ["Prepared", "Sent", "Accepted"].includes(action.details?.quoteStatus || "Prepared")
    )
    .reduce((total, action) => total + (Number(action.details?.quoteAmount) || 0), 0);
  const bookedWorkValue = Object.values(replyActions)
    .filter(
      (action) =>
        action?.type === "booking" &&
        action?.done &&
        (action.details?.bookingStatus || "Confirmed") === "Confirmed"
    )
    .reduce(
      (total, action) =>
        total +
        (Number(action.details?.jobValue) ||
          Number(action.details?.sourceQuoteAmount) ||
          0),
      0
    );

  const pipelineWorkValue = activeQuoteValue + bookedWorkValue;

  const completedJobValue = customers.reduce(
    (total, customer) =>
      total +
      (Array.isArray(customer.history)
        ? customer.history
            .filter((item) => item.kind === "job")
            .reduce((sum, item) => sum + (Number(item.value) || 0), 0)
        : 0),
    0
  );

  const completedJobEntries = customers.flatMap((customer) =>
    (Array.isArray(customer.history) ? customer.history : [])
      .filter((item) => item.kind === "job")
      .map((job) => ({ customer, job }))
  );
  const latestCompletedJobEntries = customers
    .map((customer) => {
      const jobs = (Array.isArray(customer.history) ? customer.history : [])
        .filter((item) => item.kind === "job")
        .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
      return jobs[0] ? { customer, job: jobs[0] } : null;
    })
    .filter(Boolean);
  const automaticReviewDraftEntries = latestCompletedJobEntries.filter(
    (entry) =>
      !!entry.job.reviewRequestDraft &&
      !entry.job.reviewRequestSentAt &&
      entry.customer.contactOk !== false &&
      !hasActiveCustomerWork(entry.customer.id)
  );
  const automaticReviewDraftCount = automaticReviewDraftEntries.length;
  const repeatTimingTrackedEntries = customers
    .filter((customer) => !!customer.nextRepeatDueDate)
    .map((customer) => ({
      customer,
      dueDate: customer.nextRepeatDueDate,
    }))
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
  const repeatTimingTrackedCount = repeatTimingTrackedEntries.length;
  const reviewRequestSentCount = completedJobEntries.filter(
    (entry) => !!entry.job.reviewRequestSentAt
  ).length;
  const reviewRequestOutcomeCount = completedJobEntries.filter(
    (entry) => !!entry.job.reviewRequestOutcomeRecordedAt
  ).length;
  const reviewReceivedCount = completedJobEntries.filter(
    (entry) => entry.job.reviewRequestOutcome === "Review left"
  ).length;
  const reviewRequestOpportunityEntry =
    latestCompletedJobEntries
      .filter(
        (entry) =>
          entry.customer.contactOk !== false &&
          !entry.job.reviewRequestSentAt &&
          !hasActiveCustomerWork(entry.customer.id)
      )
      .sort((a, b) => String(b.job.date || "").localeCompare(String(a.job.date || "")))[0] || null;
  const reviewRequestOpportunity = reviewRequestOpportunityEntry
    ? {
        customerId: reviewRequestOpportunityEntry.customer.id,
        customerName: reviewRequestOpportunityEntry.customer.name,
        jobId: reviewRequestOpportunityEntry.job.id,
        service: reviewRequestOpportunityEntry.job.service || reviewRequestOpportunityEntry.customer.service,
        value: Number(reviewRequestOpportunityEntry.job.value) || 0,
      }
    : null;
  const reviewOutcomeEntry =
    completedJobEntries
      .filter(
        (entry) =>
          !!entry.job.reviewRequestSentAt &&
          !entry.job.reviewRequestOutcomeRecordedAt
      )
      .sort((a, b) =>
        String(b.job.reviewRequestSentAt || "").localeCompare(
          String(a.job.reviewRequestSentAt || "")
        )
      )[0] || null;
  const reviewOutcomeOpportunity = reviewOutcomeEntry
    ? {
        customerId: reviewOutcomeEntry.customer.id,
        customerName: reviewOutcomeEntry.customer.name,
        jobId: reviewOutcomeEntry.job.id,
        service: reviewOutcomeEntry.job.service || reviewOutcomeEntry.customer.service,
      }
    : null;
  const attachedJobPhotoCount = completedJobEntries.reduce(
    (total, entry) => total + (Array.isArray(entry.job.photos) ? entry.job.photos.length : 0),
    0
  );
  const reusableJobPhotoCount = completedJobEntries.reduce(
    (total, entry) =>
      total +
      (Array.isArray(entry.job.photos)
        ? entry.job.photos.filter((photo) => photo.marketingOk).length
        : 0),
    0
  );
  const preparedPhotoPostCount = completedJobEntries.filter((entry) => !!entry.job.postDraft).length;
  const publishedPhotoPostCount = completedJobEntries.filter(
    (entry) =>
      ["Published", "Simulated published"].includes(entry.job.postDraftStatus)
  ).length;
  const postOutcomeRecordedCount = completedJobEntries.filter(
    (entry) => !!entry.job.postOutcomeRecordedAt
  ).length;
  const postBookingOutcomeCount = completedJobEntries.filter(
    (entry) => entry.job.postOutcome === "Booking"
  ).length;
  const postAttributedValue = completedJobEntries.reduce(
    (total, entry) =>
      total +
      (entry.job.postOutcome === "Booking"
        ? Number(entry.job.postOutcomeValue) || 0
        : 0),
    0
  );
  const reactivationCompletedValue = completedJobEntries.reduce(
    (total, entry) =>
      total +
      (entry.job.sourceOrigin === "simulated" ? Number(entry.job.value) || 0 : 0),
    0
  );

  const evidenceServiceName =
    activeWorkGoal?.serviceName ||
    services.find((item) => item.id === activeWorkGoal?.serviceId)?.name ||
    selectedService?.name ||
    services.find((item) => item.wanted)?.name ||
    "";

  const recordedReactivationContacts = (() => {
    const source =
      reactivationRuns.length
        ? reactivationRuns.flatMap((run) =>
            (Array.isArray(run.recipients) ? run.recipients : []).map((item) => ({
              id: item.id,
              service: item.service || "",
            }))
          )
        : (lastSimulatedRecipients || []).map((customer) => ({
            id: customer.id,
            service: customer.service || "",
          }));
    const unique = new Map();
    source.forEach((item) => {
      if (item?.id) unique.set(item.id, item);
    });
    return [...unique.values()];
  })();

  const reactivationBookedCustomerIds = new Set(
    recordedReactivationContacts
      .filter((contact) => {
        const action = replyActions[contact.id];
        const customer = customers.find((item) => item.id === contact.id);
        const bookedFromAction =
          action?.origin === "simulated" &&
          action?.type === "booking" &&
          action?.done &&
          ["Confirmed", "Completed"].includes(action.details?.bookingStatus || "Confirmed");
        const completedFromHistory = (Array.isArray(customer?.history) ? customer.history : []).some(
          (job) => job.kind === "job" && job.sourceOrigin === "simulated"
        );
        return bookedFromAction || completedFromHistory;
      })
      .map((item) => item.id)
  );

  const reactivationServiceContacts = recordedReactivationContacts.filter(
    (item) => evidenceServiceName && item.service === evidenceServiceName
  );
  const reactivationOverallSuccesses = recordedReactivationContacts.filter((item) =>
    reactivationBookedCustomerIds.has(item.id)
  ).length;
  const reactivationServiceSuccesses = reactivationServiceContacts.filter((item) =>
    reactivationBookedCustomerIds.has(item.id)
  ).length;
  const reactivationEvidence = chooseRateEvidence({
    serviceSuccesses: reactivationServiceSuccesses,
    serviceSample: reactivationServiceContacts.length,
    overallSuccesses: reactivationOverallSuccesses,
    overallSample: recordedReactivationContacts.length,
    baselineRate: 1 / 3,
    serviceName: evidenceServiceName,
  });

  const quoteOutcomeRecordedEntries = quoteFollowUpEntries.filter(
    (entry) => !!entry.action.details?.followUpOutcomeRecordedAt
  );
  const quoteServiceEntries = quoteOutcomeRecordedEntries.filter(
    (entry) => evidenceServiceName && entry.customer.service === evidenceServiceName
  );
  const quoteFollowUpEvidence = chooseRateEvidence({
    serviceSuccesses: quoteServiceEntries.filter(
      (entry) => entry.action.details?.followUpOutcome === "Accepted"
    ).length,
    serviceSample: quoteServiceEntries.length,
    overallSuccesses: quoteFollowUpAcceptedCount,
    overallSample: quoteFollowUpOutcomeCount,
    baselineRate: 0.25,
    serviceName: evidenceServiceName,
  });

  const enquiryOutcomeRecordedEntries = enquiryFollowUpEntries.filter(
    (entry) => !!entry.customer.enquiryFollowUpOutcomeRecordedAt
  );
  const enquiryServiceEntries = enquiryOutcomeRecordedEntries.filter(
    (entry) => evidenceServiceName && entry.customer.service === evidenceServiceName
  );
  const enquiryFollowUpEvidence = chooseRateEvidence({
    serviceSuccesses: enquiryServiceEntries.filter(
      (entry) => entry.customer.enquiryFollowUpOutcome === "Still interested"
    ).length,
    serviceSample: enquiryServiceEntries.length,
    overallSuccesses: enquiryFollowUpInterestedCount,
    overallSample: enquiryFollowUpOutcomeCount,
    baselineRate: 0.25,
    serviceName: evidenceServiceName,
  });

  const postOutcomeEntries = completedJobEntries.filter(
    (entry) => !!entry.job.postOutcomeRecordedAt
  );
  const postServiceEntries = postOutcomeEntries.filter(
    (entry) =>
      evidenceServiceName &&
      (entry.job.service || entry.customer.service) === evidenceServiceName
  );
  const postEvidence = chooseRateEvidence({
    serviceSuccesses: postServiceEntries.filter(
      (entry) => entry.job.postOutcome === "Booking"
    ).length,
    serviceSample: postServiceEntries.length,
    overallSuccesses: postBookingOutcomeCount,
    overallSample: postOutcomeRecordedCount,
    baselineRate: 0.2,
    serviceName: evidenceServiceName,
  });

  const socialChannelEvidence = ["Facebook", "Instagram", "Google Business"].map((channel) => {
    const entries = postOutcomeEntries.filter((entry) =>
      (entry.job.postChannels || []).includes(channel)
    );
    const bookings = entries.filter((entry) => entry.job.postOutcome === "Booking").length;
    return {
      channel,
      ...rateEvidence(bookings, entries.length, 0.2),
    };
  });
  const socialJobOpportunities = completedJobEntries
    .filter((entry) =>
      Array.isArray(entry.job.photos) &&
      entry.job.photos.some((photo) => photo.marketingOk)
    )
    .sort((a, b) => String(b.job.date || "").localeCompare(String(a.job.date || "")));
  const socialOutcomeReminders = completedJobEntries
    .filter(
      (entry) =>
        ["Published", "Partial failure"].includes(entry.job.postDraftStatus) &&
        !!entry.job.postPublishedAt &&
        !entry.job.postOutcomeRecordedAt
    )
    .sort((a, b) =>
      String(b.job.postPublishedAt || "").localeCompare(
        String(a.job.postPublishedAt || "")
      )
    );
  const socialDraftCount = socialDrafts.filter((draft) => draft.status === "Draft").length;
  const socialScheduledCount = socialDrafts.filter((draft) => draft.status === "Scheduled").length;
  const socialApprovedCount = socialDrafts.filter(
    (draft) =>
      draft.status === "Simulated published" ||
      draft.status === "Published" ||
      !!draft.publishedAt
  ).length;
  const selectedSocialDraft =
    socialDrafts.find((draft) => draft.id === selectedSocialDraftId) || null;
  const latestPostEvidenceAt =
    postOutcomeEntries
      .map((entry) => entry.job.postOutcomeRecordedAt || "")
      .sort()
      .reverse()[0] || "";
  const latestReactivationEvidenceAt =
    reactivationRuns
      .map((run) => run.sentAt || "")
      .filter(Boolean)
      .sort()
      .reverse()[0] || "";
  const latestQuoteEvidenceAt =
    quoteOutcomeRecordedEntries
      .map((entry) => entry.action.details?.followUpOutcomeRecordedAt || "")
      .filter(Boolean)
      .sort()
      .reverse()[0] || "";
  const latestEnquiryEvidenceAt =
    enquiryOutcomeRecordedEntries
      .map((entry) => entry.customer.enquiryFollowUpOutcomeRecordedAt || "")
      .filter(Boolean)
      .sort()
      .reverse()[0] || "";
  const reviewOutcomeRecordedEntries = completedJobEntries.filter(
    (entry) => !!entry.job.reviewRequestOutcomeRecordedAt
  );
  const latestReviewEvidenceAt =
    reviewOutcomeRecordedEntries
      .map((entry) => entry.job.reviewRequestOutcomeRecordedAt || "")
      .filter(Boolean)
      .sort()
      .reverse()[0] || "";
  const reviewEvidence = {
    ...rateEvidence(reviewReceivedCount, reviewRequestOutcomeCount, 0.35),
    basis: "Recorded review-request outcomes",
    serviceSpecific: false,
  };

  const businessBrainPatterns = [
    {
      key: "reactivation",
      family: "reactivation",
      title: "Previous-customer reactivation",
      evidence: reactivationEvidence,
      lastUpdated: latestReactivationEvidenceAt,
      outcomeLabel: "Bookings",
    },
    {
      key: "quoteFollowUp",
      family: "quote-follow-up",
      title: "Quote follow-ups",
      evidence: quoteFollowUpEvidence,
      lastUpdated: latestQuoteEvidenceAt,
      outcomeLabel: "Accepted quotes",
    },
    {
      key: "enquiryFollowUp",
      family: "enquiry-follow-up",
      title: "Quiet-enquiry follow-ups",
      evidence: enquiryFollowUpEvidence,
      lastUpdated: latestEnquiryEvidenceAt,
      outcomeLabel: "Still interested",
    },
    {
      key: "social",
      family: "social",
      title: "Finished-job social content",
      evidence: postEvidence,
      lastUpdated: latestPostEvidenceAt,
      outcomeLabel: "Bookings",
    },
    {
      key: "reviews",
      family: "reviews",
      title: "Review requests",
      evidence: reviewEvidence,
      lastUpdated: latestReviewEvidenceAt,
      outcomeLabel: "Reviews left",
    },
  ].map((pattern) => {
    const freshness = businessBrainFreshness(pattern.lastUpdated);
    return {
      ...pattern,
      freshness,
      effectiveAdjustment: Math.round(
        Number(pattern.evidence?.scoreAdjustment || 0) * freshness.weight
      ),
    };
  });

  const businessBrainAdjustments = Object.fromEntries(
    businessBrainPatterns.map((pattern) => [pattern.key, pattern.effectiveAdjustment])
  );

  const businessBrainFeedbackSummary = businessBrainFeedback.reduce((summary, item) => {
    const family = item.family || "general";
    if (!summary[family]) {
      summary[family] = {
        count: 0,
        accepted: 0,
        dismissed: 0,
        rankingEffect: 0,
        reasons: {},
      };
    }
    summary[family].count += 1;
    if (item.signal === "accepted") summary[family].accepted += 1;
    else summary[family].dismissed += 1;
    summary[family].rankingEffect = Math.max(
      -18,
      Math.min(12, summary[family].rankingEffect + businessBrainFeedbackEffect(item))
    );
    summary[family].reasons[item.reason] = (summary[family].reasons[item.reason] || 0) + 1;
    return summary;
  }, {});

  const blockedBusinessBrainFamilies = new Set(
    businessBrainRules.flatMap((rule) => manualRuleTargetFamilies(rule))
  );

  const brainTuneOpportunity = (opportunity) => {
    if (!opportunity?.id || opportunity.canIgnore === false) return opportunity;
    const family = businessBrainOpportunityFamily(opportunity.id);
    const relevantFeedback = businessBrainFeedback.filter(
      (item) =>
        (item.family || "general") === family &&
        (!item.service ||
          (!!opportunity.brainService &&
            item.service === opportunity.brainService))
    );
    const feedback = relevantFeedback.reduce(
      (summary, item) => {
        summary.count += 1;
        if (item.signal === "accepted") summary.accepted += 1;
        else summary.dismissed += 1;
        summary.rankingEffect = Math.max(
          -18,
          Math.min(12, summary.rankingEffect + businessBrainFeedbackEffect(item))
        );
        summary.reasons[item.reason] =
          (summary.reasons[item.reason] || 0) + 1;
        return summary;
      },
      { count: 0, accepted: 0, dismissed: 0, rankingEffect: 0, reasons: {} }
    );
    const blocked = businessBrainRules.some((rule) => {
      const families = manualRuleTargetFamilies(rule);
      if (!families.includes(family)) return false;
      if (!rule.targetService) return true;
      if (!opportunity.brainService) return false;
      return rule.targetService === opportunity.brainService;
    });
    const pattern =
      businessBrainPatterns.find((item) => item.family === family) || null;
    const feedbackEvidence = feedback.count
      ? [
          [
            "Owner choices",
            `${feedback.accepted} accepted • ${feedback.dismissed} dismissed`,
          ],
          [
            "Choice ranking effect",
            `${feedback.rankingEffect > 0 ? "+" : ""}${feedback.rankingEffect} points`,
          ],
        ]
      : [];
    const brainEvidence = pattern
      ? [
          ["Business Brain evidence", pattern.evidence?.basis || pattern.title],
          ["Evidence freshness", pattern.freshness.label],
        ]
      : [];

    return {
      ...opportunity,
      score: Number(opportunity.score || 0) + Number(feedback.rankingEffect || 0),
      brainFamily: family,
      brainBlocked: blocked,
      brainFeedbackCount: feedback.count,
      brainFeedbackAccepted: feedback.accepted,
      brainFeedbackDismissed: feedback.dismissed,
      brainFeedbackEffect: feedback.rankingEffect,
      evidence: [
        ...(Array.isArray(opportunity.evidence) ? opportunity.evidence : []),
        ...brainEvidence,
        ...feedbackEvidence,
        ...(blocked ? [["Owner rule", "Blocked from recommendations"]] : []),
      ],
      why:
        opportunity.why +
        (feedback.count
          ? ` BUSY has also adjusted this ranking from your previous choices: ${feedback.accepted} accepted and ${feedback.dismissed} dismissed in this recommendation family.`
          : "") +
        (blocked
          ? " An owner-set hard rule currently blocks this recommendation family."
          : ""),
    };
  };

  const offerEvidence = {
    ...rateEvidence(0, 0, 0.2),
    basis: "No recorded offer outcomes yet",
    serviceSpecific: false,
  };
  const preparedPostEntry =
    completedJobEntries
      .filter(
        (entry) =>
          !!entry.job.postDraft &&
          !["Published", "Simulated published"].includes(entry.job.postDraftStatus)
      )
      .sort((a, b) =>
        String(b.job.postDraftPreparedAt || b.job.date || "").localeCompare(
          String(a.job.postDraftPreparedAt || a.job.date || "")
        )
      )[0] || null;
  const preparedPostOpportunity = preparedPostEntry
    ? {
        customerId: preparedPostEntry.customer.id,
        customerName: preparedPostEntry.customer.name,
        jobId: preparedPostEntry.job.id,
        service: preparedPostEntry.job.service || preparedPostEntry.customer.service,
        photoCount: Array.isArray(preparedPostEntry.job.photos)
          ? preparedPostEntry.job.photos.filter((photo) => photo.marketingOk).length
          : 0,
      }
    : null;
  const postOutcomeEntry =
    completedJobEntries
      .filter(
        (entry) =>
          ["Published", "Simulated published"].includes(entry.job.postDraftStatus) &&
          !entry.job.postOutcomeRecordedAt
      )
      .sort((a, b) =>
        String(b.job.postPublishedAt || b.job.date || "").localeCompare(
          String(a.job.postPublishedAt || a.job.date || "")
        )
      )[0] || null;
  const postOutcomeOpportunity = postOutcomeEntry
    ? {
        customerId: postOutcomeEntry.customer.id,
        customerName: postOutcomeEntry.customer.name,
        jobId: postOutcomeEntry.job.id,
        service: postOutcomeEntry.job.service || postOutcomeEntry.customer.service,
        channels: postOutcomeEntry.job.postChannels || [],
      }
    : null;
  const photoOpportunityEntry =
    completedJobEntries
      .filter(
        (entry) =>
          Array.isArray(entry.job.photos) &&
          entry.job.photos.some((photo) => photo.marketingOk) &&
          !entry.job.postDraft
      )
      .sort((a, b) => String(b.job.date || "").localeCompare(String(a.job.date || "")))[0] || null;
  const photoOpportunity = photoOpportunityEntry
    ? {
        customerId: photoOpportunityEntry.customer.id,
        customerName: photoOpportunityEntry.customer.name,
        jobId: photoOpportunityEntry.job.id,
        service: photoOpportunityEntry.job.service || photoOpportunityEntry.customer.service,
        photoCount: photoOpportunityEntry.job.photos.filter((photo) => photo.marketingOk).length,
      }
    : null;

  const postJobBundleEntry =
    [...latestCompletedJobEntries]
      .sort((a, b) =>
        String(b.job.date || "").localeCompare(String(a.job.date || ""))
      )
      .find((entry) => {
      const photos = Array.isArray(entry.job.photos) ? entry.job.photos : [];
      const approvedPhotoCount = photos.filter((photo) => photo.marketingOk).length;
      const reviewPending =
        entry.customer.contactOk !== false && !entry.job.reviewRequestSentAt;
      const socialPending =
        approvedPhotoCount > 0 &&
        !["Published", "Simulated published"].includes(entry.job.postDraftStatus);
      const repeatTracked = !!(
        entry.customer.nextRepeatDueDate ||
        entry.job.repeatDueDate
      );
        return reviewPending && approvedPhotoCount > 0 && repeatTracked;
      }) || null;
  const postJobBundleOpportunity = postJobBundleEntry
    ? {
        customerId: postJobBundleEntry.customer.id,
        customerName: postJobBundleEntry.customer.name,
        jobId: postJobBundleEntry.job.id,
        service:
          postJobBundleEntry.job.service ||
          postJobBundleEntry.customer.service,
        value: Number(postJobBundleEntry.job.value) || 0,
        reviewPending:
          postJobBundleEntry.customer.contactOk !== false &&
          !postJobBundleEntry.job.reviewRequestSentAt,
        socialPending:
          (postJobBundleEntry.job.photos || []).some(
            (photo) => photo.marketingOk
          ) &&
          !["Published", "Simulated published"].includes(
            postJobBundleEntry.job.postDraftStatus
          ),
        approvedPhotoCount: (postJobBundleEntry.job.photos || []).filter(
          (photo) => photo.marketingOk
        ).length,
        repeatDueDate:
          postJobBundleEntry.customer.nextRepeatDueDate ||
          postJobBundleEntry.job.repeatDueDate ||
          "",
      }
    : null;

  const automaticPostDraftEntries = completedJobEntries.filter(
    (entry) =>
      !!entry.job.postDraft &&
      entry.job.postDraftStatus !== "Simulated published"
  );
  const automaticPostDraftCount = automaticPostDraftEntries.length;
  const lifecycleWatchCount =
    freshEnquiryEntries.length +
    Object.values(replyActions).filter(
      (action) =>
        action?.type === "quote" &&
        action?.done &&
        action.details?.quoteStatus === "Sent" &&
        !action.details?.followUpSentAt
    ).length +
    repeatTimingTrackedCount;
  const backgroundReadyCount =
    staleEnquiryEntries.length +
    dueQuoteEntries.length +
    automaticReviewDraftCount +
    automaticPostDraftCount;
  const captureMatch = captureForceNew
    ? null
    : findCustomerMatch(customers, {
        phone: capturePhone,
        email: captureEmail,
        name: captureName,
      });
  const intakeMergedCount = intakeLog.filter((item) => item.matchedExisting).length;
  const intakeCreatedCount = intakeLog.length - intakeMergedCount;
  const inboxPendingItems = inboxItems
    .filter((item) => item.status === "Pending")
    .map((item) => {
      const parsed =
        item.parsed ||
        parseQuickCapture(
          item.rawText || "",
          services,
          services.find((service) => service.wanted)?.name || trade || "Service"
        );
      const baseTriage = triageInboxCandidate(parsed, customers, replyActions);
      const aiBlocked = item.visionPending || item.aiTrustBlocked;
      const triage = aiBlocked
        ? {
            ...baseTriage,
            lane: "Needs attention",
            priorityScore: Math.max(120, baseTriage.priorityScore || 0),
            reason: item.visionPending
              ? "Screenshot batch attached — waiting for secure AI vision analysis."
              : "AI extraction needs owner review before filing.",
          }
        : baseTriage;
      const autoEvaluation = aiBlocked
        ? {
            safe: false,
            reason: item.visionPending
              ? "Screenshot content must be analysed before BUSY can safely change a customer record."
              : "AI confidence is not strong enough for automatic filing.",
          }
        : evaluateSafeAutoFile(
            parsed,
            customers,
            replyActions,
            item.source || "Incoming",
            item.rawText || ""
          );
      return { ...item, parsed, triage, autoEvaluation };
    })
    .sort((a, b) => {
      if (
        a.reconciliationDemoId &&
        b.reconciliationDemoId &&
        a.reconciliationDemoId === b.reconciliationDemoId
      ) {
        return Number(a.reconciliationSequence || 0) - Number(b.reconciliationSequence || 0);
      }
      if ((b.triage?.priorityScore || 0) !== (a.triage?.priorityScore || 0)) {
        return (b.triage?.priorityScore || 0) - (a.triage?.priorityScore || 0);
      }
      return String(a.queuedAt || "").localeCompare(String(b.queuedAt || ""));
    });
  const inboxNeedsAttentionItems = inboxPendingItems.filter(
    (item) => item.triage?.lane === "Needs attention"
  );
  const inboxReadyItems = inboxPendingItems.filter(
    (item) => item.triage?.lane === "Ready to review"
  );
  const inboxSafeReadyItems = inboxPendingItems.filter(
    (item) => item.autoEvaluation?.safe
  );
  const inboxFiledCount = inboxItems.filter((item) => item.status === "Filed").length;
  const inboxAutoFiledCount = inboxItems.filter(
    (item) => item.status === "Filed" && item.autoFiled
  ).length;
  const inboxOwnerFiledCount = inboxItems.filter(
    (item) => item.status === "Filed" && !item.autoFiled
  ).length;
  const inboxDismissedCount = inboxItems.filter((item) => item.status === "Dismissed").length;
  const connectedIntakeKeys = intakeConnectionKeys.filter((key) => !!connectedAccounts[key]);
  const connectedIntakeItems = inboxItems.filter((item) => item.connectedDemo);
  const connectedIntakePendingCount = connectedIntakeItems.filter((item) => item.status === "Pending").length;
  const connectedIntakeAutoFiledCount = connectedIntakeItems.filter(
    (item) => item.status === "Filed" && item.autoFiled
  ).length;
  const allSourceRecords = customers.flatMap((customer) =>
    (Array.isArray(customer.sourceRecords) ? customer.sourceRecords : []).map((record) => ({
      ...record,
      customerId: customer.id,
      customerName: customer.name,
    }))
  );
  const reconciledSourceRecords = allSourceRecords.filter((record) => record.reconciled);
  const reconciledJourneyIds = new Set(
    reconciledSourceRecords.map((record) => record.workThreadId).filter(Boolean)
  );
  const reconciledJourneyCount = reconciledJourneyIds.size;
  const crossSourceCustomerCount = customers.filter((customer) => {
    const sources = new Set(
      (Array.isArray(customer.sourceRecords) ? customer.sourceRecords : [])
        .map((record) => record.sourceConnection || record.source || "")
        .filter(Boolean)
    );
    return sources.size >= 2;
  }).length;
  const reconciliationPendingCount = inboxPendingItems.filter(
    (item) => item.triage?.reconciliation?.progression
  ).length;
  const reconciliationBlockedCount = inboxPendingItems.filter(
    (item) =>
      item.triage?.reconciliation?.regression ||
      item.triage?.reconciliation?.sameStage
  ).length;
  const lastReconciledSourceRecord =
    [...reconciledSourceRecords].sort((a, b) =>
      String(b.importedAt || "").localeCompare(String(a.importedAt || ""))
    )[0] || null;
  const lastConnectionSync = [...connectionSyncLog].sort((a, b) =>
    String(b.syncedAt || "").localeCompare(String(a.syncedAt || ""))
  )[0] || null;
  const inboxTopItem = inboxPendingItems[0] || null;
  const lastAutoFiledInboxItem =
    inboxItems.find((item) => item.id === lastAutoFiledInboxItemId) ||
    [...inboxItems]
      .filter((item) => item.status === "Filed" && item.autoFiled)
      .sort((a, b) =>
        String(b.reviewedAt || b.queuedAt || "").localeCompare(
          String(a.reviewedAt || a.queuedAt || "")
        )
      )[0] ||
    null;
  const intakeStageCounts = intakeLog.reduce((counts, item) => {
    const key = item.stage || "Other";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});

  const workGoalPlanningService =
    services.find((item) => item.id === activeWorkGoal?.serviceId) ||
    services.find((item) => item.id === selectedServiceId) ||
    services.find((item) => item.wanted) ||
    services[0] ||
    null;
  const workGoalBookingEntries = activeWorkGoal
    ? Object.entries(replyActions || {})
        .map(([id, action]) => {
          const customer =
            customers.find((item) => item.id === id) ||
            lastSimulatedRecipients.find((item) => item.id === id);
          if (!customer) return null;
          if (workGoalPlanningService?.name && customer.service !== workGoalPlanningService.name) return null;
          if (!bookingMatchesWorkGoal(action, activeWorkGoal)) return null;
          return { id, action, customer };
        })
        .filter(Boolean)
    : [];
  const workGoalBookedCount = workGoalBookingEntries.length;
  const workGoalBookedValue = workGoalBookingEntries.reduce(
    (total, entry) =>
      total +
      (Number(entry.action.details?.jobValue) ||
        Number(entry.action.details?.sourceQuoteAmount) ||
        0),
    0
  );
  const workGoalTargetJobs = Number(activeWorkGoal?.targetJobs) || 1;
  const workGoalDurationHours = planningDurationHours(workGoalPlanningService);
  const workGoalSlotHours =
    activeWorkGoal?.date && activeWorkGoal?.part
      ? slotPlanningHours(activeWorkGoal.part)
      : null;
  const workGoalCapacityMax =
    workGoalSlotHours && workGoalDurationHours
      ? Math.floor(workGoalSlotHours / workGoalDurationHours)
      : null;
  const workGoalCapacityMismatch =
    workGoalCapacityMax !== null &&
    Math.max(workGoalTargetJobs, workGoalBookedCount) > workGoalCapacityMax;
  const workGoalPlannedSlots = Array.isArray(activeWorkGoal?.plannedSlots)
    ? activeWorkGoal.plannedSlots.map((slot) => {
        const matchingBookings = workGoalBookingEntries.filter((entry) => {
          const date = entry.action.details?.bookingDate;
          const hour = Number(String(entry.action.details?.bookingTime || "").split(":")[0]);
          if (!date || !Number.isFinite(hour)) return false;
          const part = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
          return date === slot.date && part === slot.part;
        });
        const allBookingsInSlot = Object.values(replyActions || {}).filter((action) => {
          if (!action?.done || action.type !== "booking") return false;
          if (!["Confirmed", "Completed"].includes(action.details?.bookingStatus || "Confirmed")) return false;
          if (action.details?.bookingDate !== slot.date) return false;
          const hour = Number(String(action.details?.bookingTime || "").split(":")[0]);
          if (!Number.isFinite(hour)) return false;
          const part = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
          return part === slot.part;
        });
        const bookedCount = matchingBookings.length;
        const otherBookingCount = Math.max(0, allBookingsInSlot.length - bookedCount);
        return {
          ...slot,
          bookedCount,
          remainingJobs: Math.max(0, Number(slot.targetJobs || 0) - bookedCount),
          otherBookingCount,
          overbooked: bookedCount > Number(slot.targetJobs || 0),
          conflict:
            (otherBookingCount > 0 && bookedCount < Number(slot.targetJobs || 0)) ||
            bookedCount > Number(slot.targetJobs || 0),
        };
      })
    : [];
  const workGoalPlanConflict = workGoalPlannedSlots.some((slot) => slot.conflict);
  const workGoalPlanShortfall =
    activeWorkGoal?.spreadAcrossSlots
      ? Math.max(0, Number(activeWorkGoal?.unplannedJobs) || 0)
      : 0;
  const workGoalRemainingJobs = Math.max(0, workGoalTargetJobs - workGoalBookedCount);
  const workGoalAttempts = Array.isArray(activeWorkGoal?.attempts) ? activeWorkGoal.attempts : [];
  const workGoalAttemptKeys = new Set(workGoalAttempts.map((item) => item.key).filter(Boolean));
  const workGoalAttemptedCustomerIds = new Set(
    workGoalAttempts.flatMap((item) =>
      item.type === "reactivation" && Array.isArray(item.recipientIds) ? item.recipientIds : []
    )
  );
  const reactivationEligibleCustomers = (
    activeWorkGoal && evidenceServiceName
      ? eligibleCustomers.filter((customer) => customer.service === evidenceServiceName)
      : eligibleCustomers
  ).filter((customer) => !workGoalAttemptedCustomerIds.has(customer.id));

  const workGoalAttemptRows = workGoalAttempts.map((attempt) => {
    let outcome = "Action approved • outcome not recorded yet";
    let tone = "blue";
    if (attempt.type === "quote" && attempt.customerId) {
      const action = replyActions[attempt.customerId];
      const recorded = action?.details?.followUpOutcome;
      if (recorded) {
        outcome = recorded;
        tone = recorded === "Accepted" ? "green" : recorded === "Declined" ? "amber" : "blue";
      }
    } else if (attempt.type === "enquiry" && attempt.customerId) {
      const customer = customers.find((item) => item.id === attempt.customerId);
      if (customer?.enquiryFollowUpOutcome) {
        outcome = customer.enquiryFollowUpOutcome;
        tone = customer.enquiryFollowUpOutcome === "Still interested" ? "green" : customer.enquiryFollowUpOutcome === "Not interested" ? "amber" : "blue";
      }
    } else if (attempt.type === "reactivation") {
      const ids = new Set(attempt.recipientIds || []);
      const booked = Object.entries(replyActions || {}).filter(([id, action]) =>
        ids.has(id) &&
        action?.type === "booking" &&
        action?.done &&
        ["Confirmed", "Completed"].includes(action.details?.bookingStatus || "Confirmed")
      ).length;
      outcome = booked
        ? `${booked} booking${booked === 1 ? "" : "s"} recorded`
        : "Sent • awaiting recorded bookings";
      tone = booked ? "green" : "blue";
    } else if (attempt.type === "post" && attempt.customerId && attempt.jobId) {
      const customer = customers.find((item) => item.id === attempt.customerId);
      const job = (customer?.history || []).find((item) => item.id === attempt.jobId);
      if (job?.postOutcome) {
        outcome = job.postOutcome;
        tone = job.postOutcome === "Booking" ? "green" : "blue";
      }
    } else if (attempt.type === "offer") {
      outcome = workGoalBookedCount
        ? `${workGoalBookedCount} matching booking${workGoalBookedCount === 1 ? "" : "s"} now recorded`
        : "Plan prepared • no separate offer outcome recorded";
      tone = workGoalBookedCount ? "green" : "blue";
    } else if (attempt.type === "paid") {
      outcome = "Prototype paid test approved • live result not recorded";
      tone = "amber";
    }
    return { ...attempt, outcome, tone };
  });
  const reactivationRateForSizing = reactivationEvidence.evidenceReady
    ? Math.max(0.1, Math.min(0.75, reactivationEvidence.rate))
    : 1 / 3;
  const evidenceSizedBatch = Math.max(
    1,
    Math.ceil(Math.max(1, workGoalRemainingJobs) / reactivationRateForSizing)
  );
  const recommendedReactivationBatchSize = Math.min(
    reactivationEligibleCustomers.length,
    evidenceSizedBatch
  );
  const reactivationAudience = campaignRecipientLimit && campaignRecipientLimit > 0
    ? reactivationEligibleCustomers.slice(0, campaignRecipientLimit)
    : reactivationEligibleCustomers;
  const workGoalFilled =
    !!activeWorkGoal &&
    !workGoalCapacityMismatch &&
    !workGoalPlanConflict &&
    workGoalPlanShortfall === 0 &&
    workGoalBookedCount >= workGoalTargetJobs;

  const proactiveTodayISO = dateToISO(new Date());
  const proactiveWeekEndISO = addDaysFromISO(proactiveTodayISO, 6);
  const proactiveLookAheadISO = addDaysFromISO(proactiveTodayISO, 13);
  const proactiveBookingsNext7 = Object.entries(replyActions || {})
    .map(([id, action]) => {
      if (
        action?.type !== "booking" ||
        !action?.done ||
        !action.details?.bookingDate ||
        ["Cancelled", "Completed"].includes(action.details?.bookingStatus || "Confirmed") ||
        action.details.bookingDate < proactiveTodayISO ||
        action.details.bookingDate > proactiveWeekEndISO
      ) return null;
      const customer =
        customers.find((item) => item.id === id) ||
        lastSimulatedRecipients.find((item) => item.id === id);
      return customer ? { id, action, customer } : null;
    })
    .filter(Boolean);
  const proactiveBookedValueNext7 = proactiveBookingsNext7.reduce(
    (total, item) =>
      total +
      (Number(item.action.details?.jobValue) ||
        Number(item.action.details?.sourceQuoteAmount) ||
        0),
    0
  );
  const proactiveRepeatDueSoon = (repeatTimingTrackedEntries || []).filter(
    ({ customer, dueDate }) =>
      customer?.contactOk !== false &&
      dueDate >= proactiveTodayISO &&
      dueDate <= proactiveLookAheadISO
  );
  const proactiveDueQuoteValue = (dueQuoteEntries || []).reduce(
    (total, item) =>
      total + (Number(item.action?.details?.quoteAmount) || 0),
    0
  );
  const proactiveLearningGapCount =
    (socialOutcomeReminders?.length || 0) +
    (quoteFollowUpOutcomeOpportunity ? 1 : 0) +
    (enquiryFollowUpOutcomeOpportunity ? 1 : 0) +
    (reviewOutcomeOpportunity ? 1 : 0);

  const proactiveSignalRows = [];

  if ((inboxNeedsAttentionItems?.length || 0) >= 2) {
    const ids = inboxNeedsAttentionItems.slice(0, 4).map((item) => item.id).join("-");
    proactiveSignalRows.push({
      id: `inbox-stack-${ids}`,
      score: 118,
      tone: "amber",
      category: "Incoming work",
      title: `BUSY noticed ${inboxNeedsAttentionItems.length} incoming items need checking`,
      body: "Several new pieces of information are waiting for review. Clearing uncertain incoming records now protects the customer pipeline from getting out of step.",
      footer: "Nothing has been filed from these uncertain items yet",
      actionLabel: "Review BUSY Inbox",
      onAction: openBusyInbox,
      why: "This is a cluster rather than one isolated message. BUSY raises it because multiple unresolved incoming records can affect quotes, bookings and customer timelines.",
      evidence: [
        ["Items needing attention", String(inboxNeedsAttentionItems.length)],
        ["Automatic filing", "Blocked until reviewed"],
        ["Customer-facing action", "None"],
      ],
    });
  }

  if ((dueQuoteEntries?.length || 0) >= 2) {
    const ids = dueQuoteEntries.slice(0, 4).map((item) => item.id).join("-");
    proactiveSignalRows.push({
      id: `quote-cluster-${ids}`,
      score: 108 + Math.min(10, dueQuoteEntries.length),
      tone: "green",
      category: "Warm demand",
      title: `BUSY noticed ${dueQuoteEntries.length} quotes have gone quiet`,
      body: proactiveDueQuoteValue
        ? `There is £${proactiveDueQuoteValue} of recorded quote value sitting in follow-up territory. BUSY would revisit this warm demand before creating colder marketing.`
        : "Several real quotes are due for a follow-up. BUSY would revisit this warm demand before creating colder marketing.",
      footer: "Existing intent • £0 advertising required",
      actionLabel: "Review quote follow-ups",
      onAction: () => go("staleQuotes"),
      why: "A cluster of existing quotes is stronger evidence of potential work than a generic marketing idea, especially when the follow-up costs nothing.",
      evidence: [
        ["Quotes due", String(dueQuoteEntries.length)],
        ["Recorded quote value", proactiveDueQuoteValue ? `£${proactiveDueQuoteValue}` : "Not fully recorded"],
        ["Advertising required", "£0"],
      ],
    });
  }

  if (
    proactiveBookingsNext7.length <= 1 &&
    reactivationEligibleCustomers.length >= 3 &&
    !activeWorkGoal
  ) {
    proactiveSignalRows.push({
      id: `quiet-week-${proactiveTodayISO}-${proactiveBookingsNext7.length}-${reactivationEligibleCustomers.length}`,
      score: 88,
      tone: "blue",
      category: "Capacity",
      title: "BUSY noticed the next 7 days look light",
      body: `${proactiveBookingsNext7.length} confirmed booking${proactiveBookingsNext7.length === 1 ? "" : "s"} are saved for the next week, while ${reactivationEligibleCustomers.length} previous customer${reactivationEligibleCustomers.length === 1 ? "" : "s"} currently fit the repeat-work rules.`,
      footer: proactiveBookedValueNext7
        ? `Booked value currently recorded: £${proactiveBookedValueNext7}`
        : "BUSY is not assuming demand — it is flagging saved capacity only",
      actionLabel: "Review work-filling options",
      onAction: () => go("workNow"),
      why: "BUSY combines the diary with the previous-customer pool. It does not send anything automatically; it simply surfaces a credible low-cost route when saved capacity looks light.",
      evidence: [
        ["Confirmed bookings next 7 days", String(proactiveBookingsNext7.length)],
        ["Booked value next 7 days", proactiveBookedValueNext7 ? `£${proactiveBookedValueNext7}` : "Not recorded"],
        ["Eligible previous customers", String(reactivationEligibleCustomers.length)],
        ["Active work-filling goal", "None"],
      ],
    });
  }

  if (proactiveRepeatDueSoon.length >= 2) {
    const ids = proactiveRepeatDueSoon.slice(0, 5).map((item) => item.customer.id).join("-");
    const serviceCounts = proactiveRepeatDueSoon.reduce((acc, item) => {
      const key = item.customer?.service || "Service";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const strongestService = Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])[0] || null;
    proactiveSignalRows.push({
      id: `repeat-window-${ids}`,
      score: 76 + Math.min(8, proactiveRepeatDueSoon.length),
      tone: "green",
      category: "Repeat work",
      title: `BUSY noticed ${proactiveRepeatDueSoon.length} repeat-customer windows are approaching`,
      body: strongestService && strongestService[1] > 1
        ? `${strongestService[1]} of them are for ${String(strongestService[0]).toLowerCase()}. BUSY can keep these on the radar without contacting anyone early.`
        : "Several previous customers are approaching their saved repeat-service timing. BUSY can keep them on the radar without contacting anyone early.",
      footer: "Timing signal only • nothing sent",
      actionLabel: "Review the 14-day radar",
      onAction: () => jump("workHub", "Work"),
      why: "The signal comes from saved repeat-service dates rather than a generic seasonal guess. BUSY waits for the real timing window instead of creating unnecessary messages.",
      evidence: [
        ["Repeat windows next 14 days", String(proactiveRepeatDueSoon.length)],
        ["Largest service cluster", strongestService ? `${strongestService[0]} • ${strongestService[1]}` : "Mixed"],
        ["Customer contact", "Not automatic"],
      ],
    });
  }

  if (postJobBundleOpportunity) {
    proactiveSignalRows.push({
      id: `completed-job-leverage-${postJobBundleOpportunity.jobId}`,
      score: 72,
      tone: "green",
      category: "Completed job",
      title: "BUSY noticed one finished job can do more work for you",
      body: `${postJobBundleOpportunity.customerName}’s ${postJobBundleOpportunity.service.toLowerCase()} job can support a review request, finished-job social proof and future repeat timing from the same record.`,
      footer: "Prepare internally first • approval stays with you",
      actionLabel: "Review the 3-step bundle",
      onAction: () =>
        openPostJobBundle(
          postJobBundleOpportunity.customerId,
          postJobBundleOpportunity.jobId
        ),
      why: "This reduces duplicate admin by reusing a real completed-job record. It does not send a customer message or publish publicly by itself.",
      evidence: [
        ["Approved photos", String(postJobBundleOpportunity.approvedPhotoCount || 0)],
        ["Review request", postJobBundleOpportunity.reviewPending ? "Available" : "Already handled"],
        ["Finished-job post", postJobBundleOpportunity.socialPending ? "Available" : "Already handled"],
        ["Repeat timing", postJobBundleOpportunity.repeatDueDate ? formatUKDate(postJobBundleOpportunity.repeatDueDate) : "Not available"],
      ],
    });
  }

  if (proactiveLearningGapCount >= 2) {
    proactiveSignalRows.push({
      id: `learning-gap-${proactiveLearningGapCount}-${socialOutcomeReminders?.length || 0}-${quoteFollowUpOutcomeOpportunity ? 1 : 0}-${enquiryFollowUpOutcomeOpportunity ? 1 : 0}-${reviewOutcomeOpportunity ? 1 : 0}`,
      score: 48,
      tone: "blue",
      category: "Business Brain",
      title: `BUSY noticed ${proactiveLearningGapCount} outcomes are still unknown`,
      body: "A few actions have been taken, but their real business result has not been recorded yet. Closing those loops helps BUSY distinguish useful activity from busywork.",
      footer: "Learning task • lower priority than live customer work",
      actionLabel: "Open Business Brain",
      onAction: () => go("businessBrain"),
      why: "BUSY should learn from enquiries, accepted quotes, bookings and value — not just from the fact an action was performed.",
      evidence: [
        ["Unrecorded outcomes", String(proactiveLearningGapCount)],
        ["Published-post outcomes", String(socialOutcomeReminders?.length || 0)],
        ["Customer follow-up outcomes", String(
          (quoteFollowUpOutcomeOpportunity ? 1 : 0) +
          (enquiryFollowUpOutcomeOpportunity ? 1 : 0) +
          (reviewOutcomeOpportunity ? 1 : 0)
        )],
      ],
    });
  }

  const proactiveSignals = proactiveSignalRows
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const isProactiveNoticeHidden = (notice) => {
    const state = proactiveNoticeState?.[notice.id];
    if (!state?.hiddenUntil) return false;
    const until = Date.parse(state.hiddenUntil);
    return Number.isFinite(until) && until > Date.now();
  };

  const proactiveNotices = proactiveSignals.filter(
    (notice) => !isProactiveNoticeHidden(notice)
  );
  const proactiveHiddenNoticeCount =
    proactiveSignals.length - proactiveNotices.length;
  const proactiveTopNotice = proactiveNotices[0] || null;

  const hideProactiveNoticeUntil = (noticeId, hours, reason) => {
    if (!noticeId) return;
    const hiddenUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    setProactiveNoticeState((current) => ({
      ...current,
      [noticeId]: {
        hiddenUntil,
        reason,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const snoozeProactiveNotice = (noticeId) =>
    hideProactiveNoticeUntil(noticeId, 24, "Not now");

  const acknowledgeProactiveNotice = (noticeId) =>
    hideProactiveNoticeUntil(noticeId, 24 * 7, "Seen");

  const runProactiveNotice = (notice) => {
    if (!notice) return;
    acknowledgeProactiveNotice(notice.id);
    notice.onAction?.();
  };

  const restoreProactiveNotices = () => setProactiveNoticeState({});


  const normaliseBusyCommandName = (value = "") =>
    String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  const findBusyCommandCustomer = (name = "") => {
    const needle = normaliseBusyCommandName(name);
    if (!needle) return null;
    const exact = customers.find(
      (customer) => normaliseBusyCommandName(customer.name) === needle
    );
    if (exact) return exact;
    const starts = customers.filter((customer) =>
      normaliseBusyCommandName(customer.name).startsWith(needle)
    );
    if (starts.length === 1) return starts[0];
    const contains = customers.filter((customer) =>
      normaliseBusyCommandName(customer.name).includes(needle)
    );
    return contains.length === 1 ? contains[0] : null;
  };

  const latestBusyCompletedJob = (customer) =>
    [...(Array.isArray(customer?.history) ? customer.history : [])]
      .filter((item) => item?.kind === "job")
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))[0] || null;

  const buildBusyOperatorSnapshot = () => ({
    capturedAt: new Date().toISOString(),
    inboxWaiting: inboxPendingItems.length,
    dueQuoteFollowUps: dueQuoteEntries.length,
    quietEnquiries: staleEnquiryEntries.length,
    pendingCustomerActions: pendingReplyActionCount,
    bookedWorkValue: Number(bookedWorkValue) || 0,
    completedJobValue: Number(completedJobValue) || 0,
    repeatCustomersDue: eligibleCustomers.length,
    backgroundReady: backgroundReadyCount,
    bookedJobs: Object.values(replyActions || {}).filter(
      (action) =>
        action?.type === "booking" &&
        action?.done &&
        ["Confirmed"].includes(action.details?.bookingStatus || "Confirmed")
    ).length,
    completedBookings: completedBookingCount,
  });

  const buildBusyChangeRows = (previous, current) => {
    if (!previous || !current) return [];
    const labels = {
      inboxWaiting: "BUSY Inbox waiting",
      dueQuoteFollowUps: "Quote follow-ups due",
      quietEnquiries: "Quiet enquiries",
      pendingCustomerActions: "Open customer actions",
      bookedWorkValue: "Booked work value",
      completedJobValue: "Completed job value",
      repeatCustomersDue: "Repeat customers due",
      backgroundReady: "Background steps ready",
      bookedJobs: "Confirmed bookings",
      completedBookings: "Completed bookings",
    };
    return Object.keys(labels)
      .map((key) => {
        const before = Number(previous?.[key] || 0);
        const after = Number(current?.[key] || 0);
        const delta = after - before;
        if (!delta) return null;
        const money = key.toLowerCase().includes("value");
        return {
          key,
          label: labels[key],
          before: money ? `£${before}` : String(before),
          after: money ? `£${after}` : String(after),
          delta: money
            ? `${delta > 0 ? "+" : "-"}£${Math.abs(delta)}`
            : `${delta > 0 ? "+" : ""}${delta}`,
        };
      })
      .filter(Boolean);
  };

  const buildBusyCommandContext = () => {
    const today = dateToISO(new Date());
    const currentSnapshot = buildBusyOperatorSnapshot();
    const bookingRows = Object.entries(replyActions || {})
      .map(([customerId, action]) => {
        if (
          action?.type !== "booking" ||
          !action?.done ||
          !action.details?.bookingDate ||
          ["Cancelled", "Completed"].includes(action.details?.bookingStatus || "Confirmed")
        ) return null;
        const customer = customers.find((item) => item.id === customerId);
        return customer
          ? {
              customer: customer.name,
              service: customer.service || "",
              date: action.details.bookingDate,
              time: action.details.bookingTime || "",
              value:
                Number(action.details?.jobValue) ||
                Number(action.details?.sourceQuoteAmount) ||
                0,
            }
          : null;
      })
      .filter(Boolean)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));

    return {
      today,
      timezone: "Europe/London",
      businessName,
      trade,
      selectedService: selectedService?.name || "",
      services: services.slice(0, 30).map((service) => ({
        name: service.name,
        typicalValue: Number(service.value) || 0,
        wanted: !!service.wanted,
      })),
      counts: {
        customers: customers.length,
        inboxWaiting: inboxPendingItems.length,
        dueQuoteFollowUps: dueQuoteEntries.length,
        quietEnquiries: staleEnquiryEntries.length,
        pendingCustomerActions: pendingReplyActionCount,
        bookedWorkValue: Number(bookedWorkValue) || 0,
        completedJobValue: Number(completedJobValue) || 0,
        repeatCustomersDue: eligibleCustomers.length,
        backgroundReady: backgroundReadyCount,
      },
      currentSnapshot,
      previousSnapshot: busyOperatorSnapshot,
      changesSinceLastConversation: buildBusyChangeRows(
        busyOperatorSnapshot,
        currentSnapshot
      ),
      activeWorkGoal: activeWorkGoal
        ? {
            label: activeWorkGoal.label || "",
            targetJobs: Number(workGoalTargetJobs) || 0,
            bookedJobs: Number(workGoalBookedCount) || 0,
            remainingJobs: Number(workGoalRemainingJobs) || 0,
          }
        : null,
      nextBookings: bookingRows.slice(0, 12),
      dueQuoteCustomers: dueQuoteEntries.slice(0, 10).map((item) => ({
        name: item.customer?.name || "",
        service: item.customer?.service || "",
        ageDays: Number(item.age) || 0,
        value: Number(item.action?.details?.quoteAmount) || 0,
      })),
      quietEnquiryCustomers: staleEnquiryEntries.slice(0, 10).map((item) => ({
        name: item.customer?.name || "",
        service: item.customer?.service || "",
        ageDays: Number(item.age) || 0,
      })),
      customers: customers.slice(0, 60).map((customer) => {
        const action = replyActions?.[customer.id] || null;
        const job = latestBusyCompletedJob(customer);
        return {
          name: customer.name || "",
          service: customer.service || "",
          lifecycleStatus: customer.lifecycleStatus || "",
          lastServiceDate: customer.lastServiceDate || "",
          lastJobValue: Number(customer.lastJobValue) || 0,
          bookingDate:
            action?.type === "booking" &&
            action?.done &&
            !["Cancelled", "Completed"].includes(action.details?.bookingStatus || "Confirmed")
              ? action.details?.bookingDate || ""
              : "",
          bookingTime: action?.details?.bookingTime || "",
          quoteStatus: action?.type === "quote" ? action.details?.quoteStatus || "" : "",
          latestCompletedJobDate: job?.date || "",
          latestCompletedJobValue: Number(job?.value) || 0,
        };
      }),
    };
  };

  const addBusyCommandHistory = (entry) => {
    setBusyCommandHistory((current) => [
      {
        id: entry.id || `busy-command-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        transcript: String(entry.transcript || "").trim().slice(0, 500),
        response: String(entry.response || "").trim().slice(0, 900),
        intent: String(entry.intent || "unknown"),
        confidence: String(entry.confidence || "Low"),
      },
      ...current,
    ].slice(0, 20));
  };

  const addBusyConversationTurn = (role, content, structured = null) => {
    const next = {
      id: `busy-turn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role,
      content: String(content || "").trim().slice(0, 1800),
      structured: structured && typeof structured === "object"
        ? {
            intent: structured.intent || "",
            mode: structured.mode || "",
            customerName: structured.customerName || "",
            service: structured.service || "",
            date: structured.date || "",
            time: structured.time || "",
            value: Number(structured.value) || 0,
            draftText: String(structured.draftText || "").slice(0, 2200),
            draftTarget: structured.draftTarget || "",
            needsClarification: !!structured.needsClarification,
            clarificationQuestion: structured.clarificationQuestion || "",
          }
        : null,
      createdAt: new Date().toISOString(),
    };
    setBusyConversationTurns((current) => [...current, next].slice(-18));
    return next;
  };

  const submitBusyCommand = async ({ text = "", audioUri = "" } = {}) => {
    const cleanText = String(text || "").trim();
    if (!cleanText && !audioUri) {
      setBusyCommandError("Tell BUSY what you want to do.");
      return null;
    }
    setBusyCommandStatus("thinking");
    setBusyCommandError("");
    setBusyCommandResult(null);
    try {
      const token = await ownerAccessToken();
      if (!token) throw new Error("Sign in again before using BUSY Operator.");

      const context = buildBusyCommandContext();
      const conversation = busyConversationTurns.slice(-12).map((turn) => ({
        role: turn.role,
        content: turn.content,
        structured: turn.structured || null,
      }));

      let response;
      if (audioUri) {
        const form = new FormData();
        form.append("appVersion", APP_VERSION);
        form.append("context", JSON.stringify(context));
        form.append("conversation", JSON.stringify(conversation));
        form.append("audio", {
          uri: audioUri,
          name: `busy-command-${Date.now()}.m4a`,
          type: "audio/m4a",
        });
        response = await fetchWithTimeout(
          BUSY_COMMAND_URL,
          {
            method: "POST",
            headers: {
              apikey: BUSY_AI_TOKEN,
              Authorization: `Bearer ${token}`,
              "x-busy-request-id": busyRequestId("operator"),
            },
            body: form,
          },
          45000
        );
      } else {
        response = await fetchWithTimeout(
          BUSY_COMMAND_URL,
          {
            method: "POST",
            headers: {
              apikey: BUSY_AI_TOKEN,
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "x-busy-request-id": busyRequestId("operator"),
            },
            body: JSON.stringify({
              appVersion: APP_VERSION,
              text: cleanText,
              context,
              conversation,
            }),
          },
          30000
        );
      }

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || `BUSY Operator returned ${response.status}.`);
      }

      const command = payload?.command || {};
      const result = {
        ...command,
        transcript: String(payload?.transcript || cleanText || "").trim(),
      };

      addBusyConversationTurn("user", result.transcript);
      addBusyConversationTurn(
        "assistant",
        result.needsClarification
          ? result.clarificationQuestion || result.response
          : result.response,
        result
      );

      setBusyCommandResult(result);
      addBusyCommandHistory({
        transcript: result.transcript,
        response: result.needsClarification
          ? result.clarificationQuestion || result.response
          : result.response,
        intent: result.intent,
        confidence: result.confidence,
      });
      setBusyOperatorSnapshot(context.currentSnapshot);
      setBusyCommandStatus("ready");
      return result;
    } catch (error) {
      const message = error?.message || "BUSY could not understand that request.";
      setBusyCommandError(message);
      setBusyCommandStatus("error");
      return null;
    }
  };

  const busyCommandHasAction = (command = busyCommandResult) =>
    !!command &&
    !command.needsClarification &&
    !["business_summary", "business_changes", "unknown"].includes(command.intent || "unknown");

  const rememberBusyAudit = ({ type, label, customerId = "", rollback = null }) => {
    const row = {
      id: `busy-audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      label,
      customerId,
      createdAt: new Date().toISOString(),
    };
    setBusyActionAudit((current) => [row, ...current].slice(0, 30));
    setBusyUndoAction(rollback ? { ...row, rollback } : null);
  };

  const executeBusyCommand = (command = busyCommandResult) => {
    if (!command || command.needsClarification) return false;
    const customer = findBusyCommandCustomer(command.customerName || "");
    const commandValue = Number(command.value) || 0;

    switch (command.intent) {
      case "open_today":
        jump("workHub", "Work");
        return true;
      case "open_calendar":
        jump("workCalendar", "Work");
        return true;
      case "open_quote_followups":
        dueQuoteEntries.length ? go("staleQuotes") : jump("workHub", "Work");
        return true;
      case "open_repeat_customers":
        go("eligibleCustomers");
        return true;
      case "find_more_work":
        if (command.service) {
          const service = services.find(
            (item) => normaliseBusyCommandName(item.name) === normaliseBusyCommandName(command.service)
          );
          if (service) setSelectedServiceId(service.id);
        }
        go("workNow");
        return true;
      case "customer_lookup":
        if (!customer) {
          setBusyCommandError("BUSY could not match that name to one saved customer.");
          return false;
        }
        openCustomer(customer.id);
        return true;
      case "create_booking": {
        if (!customer) {
          setBusyCommandError("BUSY needs one unambiguous saved customer before it can prepare that booking.");
          return false;
        }
        const previousCustomer = customers.find((item) => item.id === customer.id) || null;
        const previousAction = replyActions?.[customer.id] || null;
        startDirectCustomerAction(customer.id, "booking");
        if (command.date) setActionBookingDate(command.date);
        if (command.time) setActionBookingTime(command.time);
        if (commandValue > 0) setActionJobValue(String(commandValue));
        rememberBusyAudit({
          type: "booking-prepared",
          label: `Prepared booking for ${customer.name}`,
          customerId: customer.id,
          rollback: {
            customer: previousCustomer,
            action: previousAction,
          },
        });
        return true;
      }
      case "complete_job": {
        if (!customer) {
          setBusyCommandError("BUSY needs one unambiguous saved customer before it can complete that job.");
          return false;
        }
        const action = replyActions?.[customer.id];
        if (
          action?.type !== "booking" ||
          !action?.done ||
          ["Cancelled", "Completed"].includes(action.details?.bookingStatus || "Confirmed")
        ) {
          setBusyCommandError("BUSY could not find an open confirmed booking for that customer.");
          return false;
        }
        const previousCustomer = customers.find((item) => item.id === customer.id) || null;
        const previousAction = action ? JSON.parse(JSON.stringify(action)) : null;
        markBookingCompleted(
          customer.id,
          commandValue || action.details?.jobValue || "",
          command.note || ""
        );
        rememberBusyAudit({
          type: "job-completed",
          label: `Marked ${customer.name}'s job complete`,
          customerId: customer.id,
          rollback: {
            customer: previousCustomer,
            action: previousAction,
          },
        });
        setSelectedCustomerId(customer.id);
        go("customerDetail");
        return true;
      }
      case "social_post": {
        if (customer) {
          const job = latestBusyCompletedJob(customer);
          if (job) {
            startSocialFromJob(customer.id, job.id);
            setSocialBrief(command.draftText || command.note || "");
            return true;
          }
        }
        startSocialFromPhone();
        setSocialBrief(command.draftText || command.note || command.transcript || "");
        return true;
      }
      case "reactivation_draft":
      case "draft_refinement":
        if (command.draftTarget === "social") {
          if (customer) {
            const job = latestBusyCompletedJob(customer);
            if (job) startSocialFromJob(customer.id, job.id);
            else startSocialFromPhone();
          } else {
            startSocialFromPhone();
          }
          setSocialBrief(command.draftText || command.note || "");
          return true;
        }
        if (command.draftText) {
          setBringBackMessage(command.draftText);
          setMessage(command.draftText);
        }
        go("bringBack");
        return true;
      case "quick_capture":
        updateCaptureRawText(command.transcript || command.note || "");
        setCaptureSource("BUSY Operator");
        go("quickCapture");
        return true;
      case "open_inbox":
        openBusyInbox();
        return true;
      case "open_results":
        jump("results", "Results");
        return true;
      case "open_settings":
        jump("settings", "Settings");
        return true;
      default:
        return false;
    }
  };

  const executeBusyPlanStep = (step) => {
    if (!step) return false;
    return executeBusyCommand({
      ...step,
      transcript: busyCommandResult?.transcript || "",
      confidence: busyCommandResult?.confidence || "Medium",
    });
  };

  const undoLastBusyAction = () => {
    const undo = busyUndoAction;
    if (!undo?.rollback || !undo.customerId) return false;
    const { customer, action } = undo.rollback;
    if (customer) {
      setCustomers((current) =>
        current.map((item) => item.id === undo.customerId ? customer : item)
      );
    }
    setReplyActions((current) => {
      const next = { ...current };
      if (action) next[undo.customerId] = action;
      else delete next[undo.customerId];
      return next;
    });
    setBusyActionAudit((current) => [
      {
        id: `busy-audit-${Date.now()}-undo`,
        type: "undo",
        label: `Undid: ${undo.label}`,
        customerId: undo.customerId,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 30));
    setBusyUndoAction(null);
    setBusyCommandResult(null);
    return true;
  };

  const clearBusyCommandResult = () => {
    setBusyCommandResult(null);
    setBusyCommandError("");
    setBusyCommandStatus("idle");
  };

  const startNewBusyConversation = () => {
    setBusyConversationTurns([]);
    clearBusyCommandResult();
  };

  const openTalkToBusy = (startVoice = false) => {
    clearBusyCommandResult();
    if (startVoice) setBusyVoiceStartNonce(Date.now());
    go("talkToBusy");
  };

  const appState = {
    screen,
    history,
    go,
    back,
    jump,
    tab,
    setTab,
    onboardingComplete,
    completeOnboarding,
    businessName,
    setBusinessName,
    trade,
    setTrade,
    verticalId,
    setVerticalId,
    applyVerticalPack,
    verticalPack: getVerticalPack(verticalId),
    postcode,
    setPostcode,
    radius,
    setRadius,
    quietSlot,
    setQuietSlot,
    quietSlotConfirmed,
    setQuietSlotConfirmed,
    workGoalTargetDraft,
    setWorkGoalTargetDraft,
    activeWorkGoal,
    setActiveWorkGoal,
    confirmSpareSlot,
    fitWorkGoalToSlot,
    spreadWorkGoalAcrossSlots,
    refreshSpreadWorkGoalPlan,
    fitWorkGoalToPlannedCapacity,
    adjustServiceDuration,
    clearWorkGoal,
    recordWorkGoalAttempt,
    prepareOfferForWorkGoal,
    workGoalBookingEntries,
    workGoalBookedCount,
    workGoalBookedValue,
    workGoalTargetJobs,
    workGoalPlanningService,
    workGoalDurationHours,
    workGoalSlotHours,
    workGoalCapacityMax,
    workGoalCapacityMismatch,
    workGoalPlannedSlots,
    workGoalPlanConflict,
    workGoalPlanShortfall,
    workGoalRemainingJobs,
    workGoalAttempts,
    workGoalAttemptRows,
    workGoalAttemptKeys,
    reactivationEligibleCustomers,
    reactivationEvidence,
    quoteFollowUpEvidence,
    enquiryFollowUpEvidence,
    postEvidence,
    reviewEvidence,
    businessBrainPatterns,
    businessBrainAdjustments,
    businessBrainFeedbackSummary,
    blockedBusinessBrainFamilies,
    brainTuneOpportunity,
    socialChannelEvidence,
    socialJobOpportunities,
    socialOutcomeReminders,
    socialDraftCount,
    socialScheduledCount,
    socialApprovedCount,
    selectedSocialDraft,
    latestPostEvidenceAt,
    offerEvidence,
    recommendedReactivationBatchSize,
    workGoalFilled,
    spareSlotSuggestions: suggestSpareSlots(replyActions),
    unansweredReviewCount,
    setUnansweredReviewCount,
    recentPhotoCountNeeded,
    setRecentPhotoCountNeeded,
    customers,
    setCustomers,
    eligibleCustomers,
    openEnquiryCount,
    freshEnquiryEntries,
    staleEnquiryEntries,
    enquiryFollowUpSentCount,
    enquiryFollowUpOutcomeCount,
    enquiryFollowUpInterestedCount,
    enquiryFollowUpOutcomeOpportunity,
    selectedCustomerId,
    setSelectedCustomerId,
    selectedCustomer,
    openCustomer,
    selectedJobId,
    selectedJobCustomer,
    selectedJob,
    pendingJobPhotos,
    setPendingJobPhotos,
    jobPhotosMarketingOk,
    setJobPhotosMarketingOk,
    jobPostDraft,
    setJobPostDraft,
    jobPostChannels,
    setJobPostChannels,
    toggleJobPostChannel,
    jobPostOutcome,
    setJobPostOutcome,
    jobPostOutcomeValue,
    setJobPostOutcomeValue,
    socialDrafts,
    socialPreferredChannels,
    socialCreatePhotos,
    socialBrief,
    setSocialBrief,
    socialAiStatus,
    socialAiResult,
    socialAiError,
    socialCaptionId,
    socialDraftText,
    setSocialDraftText,
    socialDraftChannels,
    socialScheduleDate,
    setSocialScheduleDate,
    socialScheduleTime,
    setSocialScheduleTime,
    socialSourceContext,
    selectedSocialDraftId,
    socialPublishingStatus,
    socialPublishingLoading,
    socialPublishingError,
    socialPublishingAction,
    ownerSession,
    ownerEmail,
    setOwnerEmail,
    ownerPassword,
    setOwnerPassword,
    ownerAuthLoading,
    ownerAuthError,
    ownerAuthNotice,
    ownerAuthReady,
    cloudWorkspace,
    cloudInitialised,
    cloudInitialising,
    cloudSyncStatus,
    cloudLastSyncedAt,
    cloudSyncError,
    cloudRevision,
    cloudAttempted,
    cloudConflict,
    accountClosurePhrase,
    setAccountClosurePhrase,
    accountClosureEmail,
    setAccountClosureEmail,
    accountClosureBusy,
    accountClosureError,
    confirmAccountClosure,
    syncCloudNow,
    restoreLatestCloudCopy,
    confirmRestoreLatestCloudCopy,
    exportBusinessData,
    sendPasswordReset,
    signInOwner,
    createOwnerAccount,
    signOutOwner,
    setLivePublishingEnabled,
    confirmLivePublishingChange,
    refreshSocialPublishingStatus,
    beginSocialProviderConnect,
    selectSocialProviderAsset,
    verifySocialProvider,
    disconnectSocialProvider,
    socialProviderConnected,
    businessBrainRules,
    businessBrainRuleDraft,
    setBusinessBrainRuleDraft,
    businessBrainFeedback,
    proactiveNoticeState,
    proactiveSignals,
    proactiveNotices,
    proactiveTopNotice,
    proactiveHiddenNoticeCount,
    busyCommandHistory,
    busyConversationTurns,
    busyOperatorSnapshot,
    busyActionAudit,
    busyUndoAction,
    busyCommandStatus,
    busyCommandResult,
    busyCommandError,
    busyVoiceStartNonce,
    submitBusyCommand,
    busyCommandHasAction,
    executeBusyCommand,
    executeBusyPlanStep,
    undoLastBusyAction,
    clearBusyCommandResult,
    startNewBusyConversation,
    openTalkToBusy,
    snoozeProactiveNotice,
    acknowledgeProactiveNotice,
    runProactiveNotice,
    restoreProactiveNotices,
    pendingBrainFeedback,
    brainFeedbackReason,
    setBrainFeedbackReason,
    openOpportunityFeedback,
    recordOpportunityAccepted,
    saveOpportunityFeedback,
    openSocialCentre,
    startSocialFromPhone,
    startSocialFromJob,
    chooseSocialPhotos,
    removeSocialPhoto,
    runSocialContentAI,
    applySocialCaption,
    toggleSocialDraftChannel,
    saveGeneratedSocialDraft,
    saveSocialDraftOnly,
    scheduleSocialDraft,
    approveSocialDraft,
    retrySocialDraft,
    confirmRetrySocialDraft,
    deleteSocialDraft,
    confirmDeleteSocialDraft,
    cancelScheduledSocialDraft,
    confirmCancelScheduledSocialDraft,
    openSocialDraft,
    saveBusinessBrainRule,
    removeBusinessBrainRule,
    quoteFollowUpDraft,
    setQuoteFollowUpDraft,
    quoteFollowUpOutcome,
    setQuoteFollowUpOutcome,
    enquiryFollowUpDraft,
    setEnquiryFollowUpDraft,
    enquiryFollowUpOutcome,
    setEnquiryFollowUpOutcome,
    reviewRequestDraft,
    setReviewRequestDraft,
    reviewRequestOutcome,
    setReviewRequestOutcome,
    startJobPhotoPrompt,
    openJobAssets,
    openJobPhotoOpportunity,
    openPostJobBundle,
    preparePostJobBundle,
    chooseJobPhotos,
    removePendingJobPhoto,
    saveJobPhotos,
    prepareJobPost,
    openJobPostDraft,
    openJobPostApproval,
    saveJobPostDraft,
    simulateJobPostPublish,
    openJobPostOutcome,
    saveJobPostOutcome,
    prepareEnquiryFollowUp,
    simulateEnquiryFollowUpSend,
    openEnquiryFollowUpOutcome,
    saveEnquiryFollowUpOutcome,
    prepareQuoteFollowUp,
    simulateQuoteFollowUpSend,
    openQuoteFollowUpOutcome,
    saveQuoteFollowUpOutcome,
    prepareReviewRequest,
    simulateReviewRequestSend,
    openReviewRequestOutcome,
    saveReviewRequestOutcome,
    attachedJobPhotoCount,
    reusableJobPhotoCount,
    preparedPhotoPostCount,
    publishedPhotoPostCount,
    postOutcomeRecordedCount,
    postBookingOutcomeCount,
    postAttributedValue,
    reactivationCompletedValue,
    preparedPostOpportunity,
    postOutcomeOpportunity,
    photoOpportunity,
    postJobBundleOpportunity,
    newCustomerName,
    setNewCustomerName,
    newCustomerPhone,
    setNewCustomerPhone,
    newCustomerAddress,
    setNewCustomerAddress,
    newCustomerService,
    setNewCustomerService,
    newCustomerDate,
    setNewCustomerDate,
    newCustomerValue,
    setNewCustomerValue,
    newCustomerContactOk,
    setNewCustomerContactOk,
    newCustomerHasPreviousJob,
    setNewCustomerHasPreviousJob,
    newEnquiryName,
    setNewEnquiryName,
    newEnquiryPhone,
    setNewEnquiryPhone,
    newEnquiryAddress,
    setNewEnquiryAddress,
    newEnquiryService,
    setNewEnquiryService,
    newEnquiryCustomService,
    setNewEnquiryCustomService,
    newEnquiryNote,
    setNewEnquiryNote,
    newEnquiryDate,
    setNewEnquiryDate,
    captureRawText,
    setCaptureRawText: updateCaptureRawText,
    captureScreenshots,
    captureScreenshotOrderConfidence,
    captureScreenshotOrderReason,
    captureBrainStatus,
    captureBrainAnalysis,
    captureBrainError,
    runIntakeBrain,
    chooseCaptureScreenshots,
    removeCaptureScreenshot,
    moveCaptureScreenshot,
    captureSource,
    setCaptureSource: updateCaptureSource,
    captureStage,
    setCaptureStage,
    captureName,
    setCaptureName,
    capturePhone,
    setCapturePhone,
    captureEmail,
    setCaptureEmail,
    captureAddress,
    setCaptureAddress,
    captureService,
    setCaptureService,
    captureDate,
    setCaptureDate,
    captureTime,
    setCaptureTime,
    captureValue,
    setCaptureValue,
    captureNote,
    setCaptureNote,
    captureConfidence,
    captureExtractedFields,
    captureForceNew,
    setCaptureForceNew,
    captureMatch,
    intakeLog,
    intakeMergedCount,
    intakeCreatedCount,
    intakeStageCounts,
    inboxItems,
    inboxPendingItems,
    inboxNeedsAttentionItems,
    inboxReadyItems,
    inboxSafeReadyItems,
    inboxFiledCount,
    inboxAutoFiledCount,
    inboxOwnerFiledCount,
    inboxDismissedCount,
    inboxTopItem,
    lastAutoFiledInboxItem,
    recordFilingMode,
    setRecordFilingMode,
    selectedInboxItemId,
    setSelectedInboxItemId,
    startQuickCapture,
    loadQuickCaptureExample,
    queueCaptureToInbox,
    queueInboxTestBatch,
    queueSafeAutopilotExample,
    queueCrossSourceJourneyDemo,
    runConnectedSourceDemoSync,
    connectionSyncLog,
    connectedIntakeKeys,
    connectedIntakeItems,
    connectedIntakePendingCount,
    connectedIntakeAutoFiledCount,
    reconciledSourceRecords,
    reconciledJourneyCount,
    crossSourceCustomerCount,
    reconciliationPendingCount,
    reconciliationBlockedCount,
    lastReconciledSourceRecord,
    lastConnectionSync,
    fileSafeInboxItem,
    openInboxItem,
    dismissInboxItem,
    reopenInboxItem,
    openBusyInbox,
    analyseQuickCapture,
    saveQuickCapture,
    customerNoteText,
    setCustomerNoteText,
    editingCustomerId,
    startNewCustomer,
    startEditCustomer,
    saveCustomerRecord,
    clearCustomerForm,
    startNewEnquiry,
    saveNewEnquiry,
    addCustomerNote,
    startDirectCustomerAction,
    appendCustomerActivity,
    pendingRemoveCustomerId,
    setPendingRemoveCustomerId,
    requestRemoveCustomer,
    confirmRemoveCustomer,
    services,
    setServices,
    newServiceName,
    setNewServiceName,
    newServiceValue,
    setNewServiceValue,
    newServiceDuration,
    setNewServiceDuration,
    alwaysAsk,
    setAlwaysAsk,
    customerContact,
    setCustomerContact,
    testLimit,
    setTestLimit,
    weeklyLimit,
    setWeeklyLimit,
    connectedAccounts,
    toggleConnection,
    dismissedOpportunities,
    dismissOpportunity,
    restoreOpportunities,
    selectedGap,
    setSelectedGap,
    selectedCustomerGroup,
    setSelectedCustomerGroup,
    selectedServiceId,
    setSelectedServiceId,
    selectedService,
    moreWorkGoal,
    setMoreWorkGoal,
    campaignStage,
    setCampaignStage,
    campaignRecipientLimit,
    reactivationAudience,
    startCampaign,
    adBudget,
    setAdBudget,
    message,
    setMessage,
    serviceMessages,
    setServiceMessages,
    resetReactivationMessages,
    simulateCurrentSend,
    lastSimulatedRecipients,
    reactivationRuns,
    replyActions,
    setReplyActions,
    saveReplyAction,
    beginReplyAction,
    openSavedReplyAction,
    updateReplyAction,
    setQuoteStatus,
    convertQuoteToBooking,
    setBookingStatus,
    markBookingCompleted,
    markReminderDone,
    rescheduleReminder,
    completeReplyAction,
    selectedReplyActionId,
    setSelectedReplyActionId,
    selectedReplyCustomer,
    actionQuoteAmount,
    setActionQuoteAmount,
    actionQuoteMessage,
    setActionQuoteMessage,
    actionQuoteSentDate,
    setActionQuoteSentDate,
    actionBookingDate,
    setActionBookingDate,
    actionBookingTime,
    setActionBookingTime,
    actionJobValue,
    setActionJobValue,
    actionJobNote,
    setActionJobNote,
    actionReminderDate,
    setActionReminderDate,
    pendingReplyActionCount,
    completedQuoteCount,
    completedBookingCount,
    completedReminderCount,
    dueReminderEntries,
    dueQuoteEntries,
    quoteFollowUpSentCount,
    quoteFollowUpOutcomeCount,
    quoteFollowUpAcceptedCount,
    quoteFollowUpAcceptedValue,
    quoteFollowUpOutcomeOpportunity,
    activeQuoteValue,
    bookedWorkValue,
    pipelineWorkValue,
    completedJobValue,
    automaticReviewDraftEntries,
    automaticReviewDraftCount,
    automaticPostDraftEntries,
    automaticPostDraftCount,
    repeatTimingTrackedEntries,
    repeatTimingTrackedCount,
    lifecycleWatchCount,
    backgroundReadyCount,
    reviewRequestSentCount,
    reviewRequestOutcomeCount,
    reviewReceivedCount,
    reviewRequestOpportunity,
    reviewOutcomeOpportunity,
    eligibilityRule: `${eligibilityRuleText(services, verticalId)} • customers with active quotes, bookings or reminders are skipped`,
    bringBackMessage,
    setBringBackMessage,
    offerGoal,
    setOfferGoal,
    prepareOfferFromGoal,
    offerService,
    setOfferService,
    normalPrice,
    setNormalPrice,
    offerPrice,
    setOfferPrice,
    offerDates,
    setOfferDates,
    offerMax,
    setOfferMax,
    offerPaused,
    setOfferPaused,
    advanced,
    setAdvanced,
    outcome,
    setOutcome,
    wonValue,
    setWonValue,
    resetPrototype,
  };

  if (!hydrated || !ownerAuthReady) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <BusyBrandLockup size={58} centered />
          <Text style={styles.loadingTagline}>More work. Less fuss.</Text>
          <Text style={styles.loadingText}>Loading BUSY securely…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ownerSession?.accessToken) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <AccountAccess s={appState} />
      </SafeAreaView>
    );
  }

  if (!cloudAttempted || cloudInitialising) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <BusyBrandLockup size={58} centered />
          <Text style={styles.loadingTagline}>More work. Less fuss.</Text>
          <Text style={styles.loadingText}>Restoring your business…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const component = screens[screen] || HomeScreen;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      {React.createElement(component, { s: appState })}
    </SafeAreaView>
  );
}


export default App;
