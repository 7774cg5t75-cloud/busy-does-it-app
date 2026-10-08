import React, { useEffect, useRef, useState } from "react";
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
import * as Notifications from "expo-notifications";
import * as Calendar from "expo-calendar/legacy";
import Constants from "expo-constants";

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  // Notification presentation is optional in unsupported preview environments.
}

import * as Core from "../core/runtime";
const {
  APP_VERSION,
  PROTOTYPE_BADGE,
  BUSY_AI_URL,
  BUSY_AI_TOKEN,
  BUSY_COMMAND_URL,
  BUSY_SOCIAL_URL,
  BUSY_SOCIAL_PUBLISH_URL,
  BUSY_WEBSITE_PUBLISH_URL,
  BUSY_MINI_APPS_URL,
  BUSY_MINI_APP_LINK_URL,
  BUSY_SUPABASE_URL,
  BUSY_PUSH_DISPATCH_URL,
  BUSY_CALENDAR_OAUTH_URL,
  BUSY_CALENDAR_SYNC_URL,
  BUSY_PRODUCTION_WATCH_URL,
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
  buildReleaseCoreHealth,
  buildHomeCommandCentre,
} from "../domain/releaseCore";
import {
  buildProductionReadiness,
  maskPushToken,
} from "../domain/productionBridge";
import { buildOperationalContinuity } from "../domain/operationalContinuity";
import {
  normaliseOperatorName,
  matchOperatorCustomer,
  operatorRequiresConfirmation,
  operatorIsAnswerOnly,
  buildOperatorClientPreview,
  validateOperatorCommand,
} from "../domain/operator2";
import { buildWorkCalendarIntelligence } from "../domain/workCalendar2";
import { buildDailyCommandCentre } from "../domain/dailyCommandCentre";
import { buildCustomerJourney2 } from "../domain/customerJourney2";
import { buildCommunicationsHub } from "../domain/communicationsHub";
import { buildFollowUpEngine } from "../domain/followUpEngine";
import { buildBrandBrain } from "../domain/brandBrain";
import { buildBusinessCreationIntelligence } from "../domain/businessCreationIntelligence";
import { buildBusinessCreationJourney, nextBestBusinessCreationQuestion } from "../domain/businessCreationJourney";
import { reviewConversation, buildApprovedCreationHandoff } from "../domain/conversationUnderstanding.mjs";
import { loadCloudConversation, saveCloudConversation, deleteCloudConversation } from "../domain/conversationCloud.mjs";
import {listGrowthProjects} from "../domain/growthProjectCloud.mjs";
import {buildGrowthCommandCentre} from "../domain/growthCommandCentre.mjs";
import {classifyGrowthUtterance,resolveGrowthOperator} from "../domain/growthOperatorBridge.mjs";
import { validateAiConversationDraft } from "../domain/conversationAiBoundary.mjs";
import { buildWebsiteDraft, applyWebsiteInstruction } from "../domain/websiteBuilder";
import { buildWebsitePublishingView } from "../domain/websitePublishing";
import {
  buildMiniAppProfileDraft,
  buildMiniAppsView,
} from "../domain/miniApps";
import { BusyBrandLockup } from "../components/ui";
import { screens, HomeScreen, AccountAccess } from "../screens";

const BRAND_PROFILE_SEED = {
  publicDescription: "",
  tagline: "",
  serviceAreaText: "",
  phone: "",
  email: "",
  openingHours: "",
  websiteDomain: "",
  facebookUrl: "",
  instagramUrl: "",
  toneOfVoice: "",
  visualStyle: "",
  primaryColour: "",
  secondaryColour: "",
  story: "",
  differentiators: "",
  logoLabel: "",
  heroAssetKey: "",
  serviceDescriptions: {},
  faqs: [],
  testimonials: [],
};

const BRAND_PROFILE_TEXT_FIELDS = new Set([
  "publicDescription",
  "tagline",
  "serviceAreaText",
  "phone",
  "email",
  "openingHours",
  "websiteDomain",
  "facebookUrl",
  "instagramUrl",
  "toneOfVoice",
  "visualStyle",
  "primaryColour",
  "secondaryColour",
  "story",
  "differentiators",
  "logoLabel",
]);

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
  const [brandProfile, setBrandProfile] = useState(() => ({
    ...BRAND_PROFILE_SEED,
    serviceDescriptions: {},
    faqs: [],
    testimonials: [],
  }));
  const [newBrandFaqQuestion, setNewBrandFaqQuestion] = useState("");
  const [newBrandFaqAnswer, setNewBrandFaqAnswer] = useState("");
  const [newBrandTestimonialText, setNewBrandTestimonialText] = useState("");
  const [newBrandTestimonialAttribution, setNewBrandTestimonialAttribution] = useState("");
  const [websiteDraft, setWebsiteDraft] = useState(null);
  const [websiteBuilderNotice, setWebsiteBuilderNotice] = useState("");
  const [websitePublishingStatus, setWebsitePublishingStatus] = useState({
    loaded: false,
    role: "",
    website: null,
    deployments: [],
    domains: [],
    jobs: [],
    queue: null,
    healthChecks: [],
    analytics: null,
    usage: null,
    signalRuns: [],
    enquiryAttributions: [],
    providerConfig: null,
    providerPreflight: null,
    providerPlatform: null,
    providerActivation: null,
    publicProfile: null,
  });
  const [websitePublishingLoading, setWebsitePublishingLoading] = useState(false);
  const [websitePublishingAction, setWebsitePublishingAction] = useState("");
  const [websitePublishingError, setWebsitePublishingError] = useState("");
  const [websitePublishingNotice, setWebsitePublishingNotice] = useState("");
  const [websiteDomainDraft, setWebsiteDomainDraft] = useState("");
  const [miniAppsStatus, setMiniAppsStatus] = useState({
    loaded: false,
    role: "",
    app: null,
    versions: [],
    requests: [],
    requestLinks: [],
    requestCount30: 0,
    guestRequestCount30: 0,
    entrySummary: [],
    catalog: [],
    publicProfile: null,
  });
  const [miniAppsLoading, setMiniAppsLoading] = useState(false);
  const [miniAppsAction, setMiniAppsAction] = useState("");
  const [miniAppsError, setMiniAppsError] = useState("");
  const [miniAppsNotice, setMiniAppsNotice] = useState("");
  const [miniAppBuildBrief, setMiniAppBuildBrief] = useState("");
  const [businessCreationBrief, setBusinessCreationBrief] = useState("");
  const [growthProjectFocus, setGrowthProjectFocus] = useState("");
  const [conversationResumeReady, setConversationResumeReady] = useState("");
  const [conversationResumeNotice, setConversationResumeNotice] = useState("");
  const [conversationCloudRevision, setConversationCloudRevision] = useState(null);
  const [conversationCloudScope, setConversationCloudScope] = useState("");
  const [conversationCloudBusy, setConversationCloudBusy] = useState(false);
  const [conversationAiBusy, setConversationAiBusy] = useState(false);
  const [conversationAiDraft, setConversationAiDraft] = useState(null);
  const [conversationAiNotice, setConversationAiNotice] = useState("");
  const conversationActiveScopeRef = useRef("");
  const conversationActiveBriefRef = useRef("");

  const [businessCreationAction, setBusinessCreationAction] = useState("");
  const [businessCreationNotice, setBusinessCreationNotice] = useState("");
  const [businessCreationError, setBusinessCreationError] = useState("");
  const [businessCreationAnswer, setBusinessCreationAnswer] = useState("");
  const [businessCreationConversationActive, setBusinessCreationConversationActive] = useState(false);
  const [miniAppBuilderPlan, setMiniAppBuilderPlan] = useState(null);
  const [miniAppFactAnswers, setMiniAppFactAnswers] = useState({});
  const [busyAppsSearch, setBusyAppsSearch] = useState("");
  const [busyAppsResults, setBusyAppsResults] = useState([]);
  const [busyAppsSearching, setBusyAppsSearching] = useState(false);
  const [selectedBusyAppDetail, setSelectedBusyAppDetail] = useState(null);
  const [myBusyApps, setMyBusyApps] = useState([]);
  const [myBusyAppRequests, setMyBusyAppRequests] = useState([]);
  const [myBusyAppsLoading, setMyBusyAppsLoading] = useState(false);
  const [selectedMiniAppRequestRole, setSelectedMiniAppRequestRole] = useState("");
  const [selectedMiniAppRequestDetail, setSelectedMiniAppRequestDetail] = useState(null);
  const [miniAppRequestHistoryLoading, setMiniAppRequestHistoryLoading] = useState(false);
  const [miniAppsNotificationStatus, setMiniAppsNotificationStatus] = useState({
    state: "unknown",
    activeDeviceCount: 0,
    token: "",
    message: "",
  });
  const [miniAppsNotificationAction, setMiniAppsNotificationAction] = useState("");
  const [pendingMiniAppDeepLink, setPendingMiniAppDeepLink] = useState(null);

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
  const growthOperatorFocusRef=useRef(null);
  const growthOperatorRequestRef=useRef(0);
  const growthOperatorScopeRef=useRef("");
  growthOperatorScopeRef.current=(ownerSession?.userId||"")+":"+(cloudWorkspace?.businessId||"");
  useEffect(()=>{
    growthOperatorFocusRef.current=null;
    growthOperatorRequestRef.current+=1;
  },[ownerSession?.userId,cloudWorkspace?.businessId]);
  const [busyCommandStatus, setBusyCommandStatus] = useState("idle");
  const [busyCommandResult, setBusyCommandResult] = useState(null);
  const [busyCommandError, setBusyCommandError] = useState("");
  const [busyVoiceStartNonce, setBusyVoiceStartNonce] = useState(0);
  const [busyConversationTurns, setBusyConversationTurns] = useState([]);
  const [busyOperatorSnapshot, setBusyOperatorSnapshot] = useState(null);
  const [busyActionAudit, setBusyActionAudit] = useState([]);
  const [busyUndoAction, setBusyUndoAction] = useState(null);
  const [operatorCalendarDate, setOperatorCalendarDate] = useState("");
  const [dailyCommandCheckpoint, setDailyCommandCheckpoint] = useState(null);
  const [autopilotMode, setAutopilotMode] = useState("prepare");
  const [autopilotRuleDraft, setAutopilotRuleDraft] = useState("");
  const [autopilotLastCheckAt, setAutopilotLastCheckAt] = useState("");
  const [autopilotLastSignature, setAutopilotLastSignature] = useState("");
  const [autopilotSnoozed, setAutopilotSnoozed] = useState({});
  const [autopilotPreparedLog, setAutopilotPreparedLog] = useState([]);
  const [businessMemoryHistory, setBusinessMemoryHistory] = useState([]);
  const [businessMemoryLastReviewAt, setBusinessMemoryLastReviewAt] = useState("");
  const [proactiveNotificationsEnabled, setProactiveNotificationsEnabled] = useState(false);
  const [proactiveNotificationPermission, setProactiveNotificationPermission] = useState("unknown");
  const [proactiveMorningTime, setProactiveMorningTime] = useState("08:00");
  const [proactiveQuietHoursEnabled, setProactiveQuietHoursEnabled] = useState(true);
  const [proactiveQuietStart, setProactiveQuietStart] = useState("20:00");
  const [proactiveQuietEnd, setProactiveQuietEnd] = useState("07:00");
  const [proactiveJobReminderMinutes, setProactiveJobReminderMinutes] = useState(60);
  const [proactiveScheduledMap, setProactiveScheduledMap] = useState({});
  const [proactiveNotificationLog, setProactiveNotificationLog] = useState([]);
  const [diaryConnection, setDiaryConnection] = useState({
    status: "disconnected",
    calendarId: "",
    title: "",
    source: "",
    lastSyncAt: "",
  });
  const [diaryCalendars, setDiaryCalendars] = useState([]);
  const [diaryEventMap, setDiaryEventMap] = useState({});
  const [diaryExternalEvents, setDiaryExternalEvents] = useState([]);
  const [diaryConflicts, setDiaryConflicts] = useState([]);
  const [diarySyncStatus, setDiarySyncStatus] = useState("idle");
  const notificationHandledRef = useRef("");
  const [remotePushStatus, setRemotePushStatus] = useState({
    state: "not_checked",
    token: "",
    deviceCount: 0,
    lastRegisteredAt: "",
    message: "",
  });
  const [remotePushAction, setRemotePushAction] = useState("");
  const [calendarOAuthStatus, setCalendarOAuthStatus] = useState({
    loaded: false,
    configured: false,
    connection: null,
    callbackUrl: "",
    error: "",
  });
  const [productionBridgeAction, setProductionBridgeAction] = useState("");
  const [googleCalendarSyncStatus, setGoogleCalendarSyncStatus] = useState({
    state: "not_synced",
    lastSyncedAt: "",
    created: 0,
    updated: 0,
    conflictCount: 0,
    message: "",
  });
  const [googleCalendarExternalEvents, setGoogleCalendarExternalEvents] = useState([]);
  const [googleCalendarConflicts, setGoogleCalendarConflicts] = useState([]);
  const [productionWatchStatus, setProductionWatchStatus] = useState({
    configured: false,
    schedule: "",
    lastDeliveryAt: "",
    deliveryCount: 0,
    message: "",
  });
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
        if (saved.dailyCommandCheckpoint && typeof saved.dailyCommandCheckpoint === "object") {
          setDailyCommandCheckpoint(saved.dailyCommandCheckpoint);
        }
        if (Array.isArray(saved.busyActionAudit)) {
          setBusyActionAudit(saved.busyActionAudit.slice(0, 30));
        }
        if (["off", "prepare", "trusted"].includes(saved.autopilotMode)) {
          setAutopilotMode(saved.autopilotMode);
        }
        if (saved.autopilotLastCheckAt) setAutopilotLastCheckAt(saved.autopilotLastCheckAt);
        if (saved.autopilotLastSignature) setAutopilotLastSignature(saved.autopilotLastSignature);
        if (saved.autopilotSnoozed && typeof saved.autopilotSnoozed === "object") {
          setAutopilotSnoozed(saved.autopilotSnoozed);
        }
        if (Array.isArray(saved.autopilotPreparedLog)) {
          setAutopilotPreparedLog(saved.autopilotPreparedLog.slice(0, 30));
        }
        if (Array.isArray(saved.businessMemoryHistory)) {
          setBusinessMemoryHistory(saved.businessMemoryHistory.slice(0, 24));
        }
        if (saved.businessMemoryLastReviewAt) {
          setBusinessMemoryLastReviewAt(saved.businessMemoryLastReviewAt);
        }
        if (typeof saved.proactiveNotificationsEnabled === "boolean") {
          setProactiveNotificationsEnabled(saved.proactiveNotificationsEnabled);
        }
        if (saved.proactiveNotificationPermission) {
          setProactiveNotificationPermission(saved.proactiveNotificationPermission);
        }
        if (saved.proactiveMorningTime) setProactiveMorningTime(saved.proactiveMorningTime);
        if (typeof saved.proactiveQuietHoursEnabled === "boolean") {
          setProactiveQuietHoursEnabled(saved.proactiveQuietHoursEnabled);
        }
        if (saved.proactiveQuietStart) setProactiveQuietStart(saved.proactiveQuietStart);
        if (saved.proactiveQuietEnd) setProactiveQuietEnd(saved.proactiveQuietEnd);
        if (saved.proactiveJobReminderMinutes !== undefined) {
          setProactiveJobReminderMinutes(Number(saved.proactiveJobReminderMinutes) || 60);
        }
        if (saved.proactiveScheduledMap && typeof saved.proactiveScheduledMap === "object") {
          setProactiveScheduledMap(saved.proactiveScheduledMap);
        }
        if (Array.isArray(saved.proactiveNotificationLog)) {
          setProactiveNotificationLog(saved.proactiveNotificationLog.slice(0, 40));
        }
        if (saved.diaryConnection && typeof saved.diaryConnection === "object") {
          setDiaryConnection({
            status: saved.diaryConnection.status || "disconnected",
            calendarId: saved.diaryConnection.calendarId || "",
            title: saved.diaryConnection.title || "",
            source: saved.diaryConnection.source || "",
            lastSyncAt: saved.diaryConnection.lastSyncAt || "",
          });
        }
        if (saved.diaryEventMap && typeof saved.diaryEventMap === "object") {
          setDiaryEventMap(saved.diaryEventMap);
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
      brandProfile,
      websiteDraft,
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
      dailyCommandCheckpoint,
      busyActionAudit,
      autopilotMode,
      autopilotLastCheckAt,
      autopilotLastSignature,
      autopilotSnoozed,
      autopilotPreparedLog,
      businessMemoryHistory,
      businessMemoryLastReviewAt,
      proactiveNotificationsEnabled,
      proactiveNotificationPermission,
      proactiveMorningTime,
      proactiveQuietHoursEnabled,
      proactiveQuietStart,
      proactiveQuietEnd,
      proactiveJobReminderMinutes,
      proactiveScheduledMap,
      proactiveNotificationLog,
      diaryConnection,
      diaryEventMap,
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
    brandProfile,
    websiteDraft,
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
    dailyCommandCheckpoint,
    busyActionAudit,
    autopilotMode,
    autopilotLastCheckAt,
    autopilotLastSignature,
    autopilotSnoozed,
    autopilotPreparedLog,
    businessMemoryHistory,
    businessMemoryLastReviewAt,
    proactiveNotificationsEnabled,
    proactiveNotificationPermission,
    proactiveMorningTime,
    proactiveQuietHoursEnabled,
    proactiveQuietStart,
    proactiveQuietEnd,
    proactiveJobReminderMinutes,
    proactiveScheduledMap,
    proactiveNotificationLog,
    diaryConnection,
    diaryEventMap,
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

  const setBookingStatus = async (customerId, bookingStatus) => {
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

    const sourceMiniAppRequestId =
      actionBefore?.details?.sourceMiniAppRequestId || "";
    if (sourceMiniAppRequestId && bookingStatus === "Confirmed") {
      try {
        const linked = await miniAppsRequest("mark_request_linked", {
          requestId: sourceMiniAppRequestId,
          customerRecordId: customerId,
          actionRecordId: `miniapp-booking-${sourceMiniAppRequestId}`,
          bridgeState: "booking_confirmed",
          metadata: {
            bookingDate: actionBefore?.details?.bookingDate || "",
            bookingTime: actionBefore?.details?.bookingTime || "",
          },
        });
        applyMiniAppsStatus(linked);
        setMiniAppsNotice(
          "BUSY confirmed the diary booking and updated the customer's Business App request status."
        );
      } catch (error) {
        setMiniAppsError(
          error?.message ||
            "The booking was confirmed in BUSY, but the Business App request status could not be updated."
        );
      }
    }
    setTimeout(() => saveBusinessCloud({ quiet: true }), 250);
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
    brandProfile,
    websiteDraft,
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
    dailyCommandCheckpoint,
    busyActionAudit,
    autopilotMode,
    autopilotLastCheckAt,
    autopilotLastSignature,
    autopilotSnoozed,
    autopilotPreparedLog,
    businessMemoryHistory,
    businessMemoryLastReviewAt,
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
    if (saved.brandProfile && typeof saved.brandProfile === "object") {
      setBrandProfile({
        ...BRAND_PROFILE_SEED,
        ...saved.brandProfile,
        serviceDescriptions:
          saved.brandProfile.serviceDescriptions &&
          typeof saved.brandProfile.serviceDescriptions === "object"
            ? saved.brandProfile.serviceDescriptions
            : {},
        faqs: Array.isArray(saved.brandProfile.faqs)
          ? saved.brandProfile.faqs.slice(0, 12)
          : [],
        testimonials: Array.isArray(saved.brandProfile.testimonials)
          ? saved.brandProfile.testimonials.slice(0, 12)
          : [],
      });
    }
    if (saved.websiteDraft && typeof saved.websiteDraft === "object") {
      setWebsiteDraft(saved.websiteDraft);
    } else if (saved.websiteDraft === null) {
      setWebsiteDraft(null);
    }
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
    if (saved.dailyCommandCheckpoint && typeof saved.dailyCommandCheckpoint === "object") {
      setDailyCommandCheckpoint(saved.dailyCommandCheckpoint);
    }
    if (Array.isArray(saved.busyActionAudit)) {
      setBusyActionAudit(saved.busyActionAudit.slice(0, 30));
    }
    if (["off", "prepare", "trusted"].includes(saved.autopilotMode)) {
      setAutopilotMode(saved.autopilotMode);
    }
    if (saved.autopilotLastCheckAt) setAutopilotLastCheckAt(saved.autopilotLastCheckAt);
    if (saved.autopilotLastSignature) setAutopilotLastSignature(saved.autopilotLastSignature);
    if (saved.autopilotSnoozed && typeof saved.autopilotSnoozed === "object") {
      setAutopilotSnoozed(saved.autopilotSnoozed);
    }
    if (Array.isArray(saved.autopilotPreparedLog)) {
      setAutopilotPreparedLog(saved.autopilotPreparedLog.slice(0, 30));
    }
    if (Array.isArray(saved.businessMemoryHistory)) {
      setBusinessMemoryHistory(saved.businessMemoryHistory.slice(0, 24));
    }
    if (saved.businessMemoryLastReviewAt) {
      setBusinessMemoryLastReviewAt(saved.businessMemoryLastReviewAt);
    }
    if (typeof saved.proactiveNotificationsEnabled === "boolean") {
      setProactiveNotificationsEnabled(saved.proactiveNotificationsEnabled);
    }
    if (saved.proactiveNotificationPermission) {
      setProactiveNotificationPermission(saved.proactiveNotificationPermission);
    }
    if (saved.proactiveMorningTime) setProactiveMorningTime(saved.proactiveMorningTime);
    if (typeof saved.proactiveQuietHoursEnabled === "boolean") {
      setProactiveQuietHoursEnabled(saved.proactiveQuietHoursEnabled);
    }
    if (saved.proactiveQuietStart) setProactiveQuietStart(saved.proactiveQuietStart);
    if (saved.proactiveQuietEnd) setProactiveQuietEnd(saved.proactiveQuietEnd);
    if (saved.proactiveJobReminderMinutes !== undefined) {
      setProactiveJobReminderMinutes(Number(saved.proactiveJobReminderMinutes) || 60);
    }
    if (saved.proactiveScheduledMap && typeof saved.proactiveScheduledMap === "object") {
      setProactiveScheduledMap(saved.proactiveScheduledMap);
    }
    if (Array.isArray(saved.proactiveNotificationLog)) {
      setProactiveNotificationLog(saved.proactiveNotificationLog.slice(0, 40));
    }
    if (saved.diaryConnection && typeof saved.diaryConnection === "object") {
      setDiaryConnection({
        status: saved.diaryConnection.status || "disconnected",
        calendarId: saved.diaryConnection.calendarId || "",
        title: saved.diaryConnection.title || "",
        source: saved.diaryConnection.source || "",
        lastSyncAt: saved.diaryConnection.lastSyncAt || "",
      });
    }
    if (saved.diaryEventMap && typeof saved.diaryEventMap === "object") {
      setDiaryEventMap(saved.diaryEventMap);
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
      miniAppsStatus.loaded
    ) return;
    const timer = setTimeout(() => {
      refreshMiniAppsStatus({ quiet: true });
    }, 250);
    return () => clearTimeout(timer);
  }, [
    hydrated,
    cloudInitialised,
    cloudWorkspace?.businessId,
    ownerSession?.accessToken,
    miniAppsStatus.loaded,
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
    dailyCommandCheckpoint,
    busyActionAudit,
    autopilotMode,
    autopilotLastCheckAt,
    autopilotLastSignature,
    autopilotSnoozed,
    autopilotPreparedLog,
    businessMemoryHistory,
    businessMemoryLastReviewAt,
    proactiveNotificationsEnabled,
    proactiveNotificationPermission,
    proactiveMorningTime,
    proactiveQuietHoursEnabled,
    proactiveQuietStart,
    proactiveQuietEnd,
    proactiveJobReminderMinutes,
    proactiveScheduledMap,
    proactiveNotificationLog,
    diaryConnection,
    diaryEventMap,
    recordFilingMode,
    advanced,
  ]);

  const signOutOwner = async () => {
    growthOperatorRequestRef.current+=1;
    growthOperatorFocusRef.current=null;
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
          services: services.map((service) => ({
            name: service.name,
            description: brandProfile.serviceDescriptions?.[service.id] || "",
          })),
          brandIdentity: {
            tagline: brandProfile.tagline || "",
            publicDescription: brandProfile.publicDescription || "",
            serviceAreaText: brandProfile.serviceAreaText || "",
            toneOfVoice: brandProfile.toneOfVoice || "",
            visualStyle: brandProfile.visualStyle || "",
            differentiators: brandProfile.differentiators || "",
          },
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

    if (!editingCustomerId) {
      const duplicate = findCustomerMatch(customers, { phone, name });
      const sameName =
        duplicate?.customer &&
        String(duplicate.customer.name || "").trim().toLowerCase() ===
          name.toLowerCase();
      if (
        duplicate?.customer &&
        duplicate.confidence === "High" &&
        sameName
      ) {
        Alert.alert(
          "This customer may already exist",
          `${duplicate.customer.name} already uses this phone number. BUSY keeps one customer history wherever possible.`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open existing",
              onPress: () => {
                clearCustomerForm();
                openCustomer(duplicate.customer.id);
              },
            },
          ]
        );
        return false;
      }
    }

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
    const receivedDate = newEnquiryDate || dateToISO(new Date());
    const receivedAt = new Date(`${receivedDate}T12:00:00`).toISOString();
    const note = newEnquiryNote.trim() || `Enquiry for ${service}.`;
    const match = findCustomerMatch(customers, { phone, name });
    const sameMatchedName =
      match?.customer &&
      String(match.customer.name || "").trim().toLowerCase() ===
        name.toLowerCase();
    const existing =
      match?.confidence === "High" && sameMatchedName
        ? match.customer
        : null;

    if (existing) {
      const existingAction = replyActions?.[existing.id] || null;
      const preserveStrongerWork = isActiveCustomerAction(existingAction);
      setCustomers((list) =>
        list.map((customer) => {
          if (customer.id !== existing.id) return customer;
          const activity = Array.isArray(customer.activity) ? customer.activity : [];
          return {
            ...customer,
            name: customer.name || name,
            phone: customer.phone || phone,
            address: address || customer.address || "",
            service:
              preserveStrongerWork && customer.service
                ? customer.service
                : service || customer.service,
            currentEnquiryAt: receivedAt,
            nextEnquiryCheckDate: addDaysFromISO(receivedDate, 7),
            enquiryFollowUpSentAt: null,
            enquiryFollowUpStatus: null,
            enquiryFollowUpOutcome: "",
            enquiryFollowUpOutcomeRecordedAt: null,
            lifecycleStatus: preserveStrongerWork
              ? customer.lifecycleStatus
              : "Enquiry",
            lastActivityAt: receivedAt,
            lastActivityKind: "enquiry",
            activity: [
              ...activity,
              {
                id: `activity-${existing.id}-enquiry-${Date.now()}`,
                kind: "enquiry",
                date: receivedDate,
                createdAt: receivedAt,
                title: preserveStrongerWork
                  ? "New enquiry added alongside active customer work"
                  : "New enquiry added to existing customer",
                note:
                  preserveStrongerWork && service !== customer.service
                    ? `${note} New enquiry service: ${service}. Existing ${existingAction?.type || "customer"} work remains authoritative until it is resolved.`
                    : note,
                value: "",
              },
            ],
          };
        })
      );
      setSelectedCustomerId(existing.id);
    } else {
      const id = `enquiry-${Date.now()}`;
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
        nextEnquiryCheckDate: addDaysFromISO(receivedDate, 7),
        lifecycleStatus: "Enquiry",
        activity: [
          {
            id: `activity-${id}-created`,
            kind: "enquiry",
            date: receivedDate,
            createdAt: receivedAt,
            title: "New enquiry added",
            note,
            value: "",
          },
        ],
      };
      setCustomers((list) => [...list, customer]);
      setSelectedCustomerId(id);
    }

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
    setBrandProfile({
      ...BRAND_PROFILE_SEED,
      serviceDescriptions: {},
      faqs: [],
      testimonials: [],
    });
    setNewBrandFaqQuestion("");
    setNewBrandFaqAnswer("");
    setNewBrandTestimonialText("");
    setNewBrandTestimonialAttribution("");
    setWebsiteDraft(null);
    setWebsiteBuilderNotice("");
    setWebsitePublishingStatus({
      loaded: false,
      role: "",
      website: null,
      deployments: [],
      domains: [],
      jobs: [],
      queue: null,
      healthChecks: [],
      analytics: null,
      usage: null,
      signalRuns: [],
      enquiryAttributions: [],
      providerConfig: null,
      providerPreflight: null,
      providerPlatform: null,
      providerActivation: null,
      publicProfile: null,
    });
    setWebsitePublishingLoading(false);
    setWebsitePublishingAction("");
    setWebsitePublishingError("");
    setWebsitePublishingNotice("");
    setWebsiteDomainDraft("");
    setMiniAppsStatus({
      loaded: false,
      role: "",
      app: null,
      versions: [],
      requests: [],
      requestLinks: [],
      requestCount30: 0,
      guestRequestCount30: 0,
      entrySummary: [],
      catalog: [],
      publicProfile: null,
    });
    setMiniAppsLoading(false);
    setMiniAppsAction("");
    setMiniAppsError("");
    setMiniAppsNotice("");
    setBusyAppsSearch("");
    setBusyAppsResults([]);
    setBusyAppsSearching(false);
    setSelectedBusyAppDetail(null);
    setMyBusyApps([]);
    setMyBusyAppRequests([]);
    setMyBusyAppsLoading(false);
    setSelectedMiniAppRequestRole("");
    setSelectedMiniAppRequestDetail(null);
    setMiniAppRequestHistoryLoading(false);
    setMiniAppsNotificationStatus({
      state: "unknown",
      activeDeviceCount: 0,
      token: "",
      message: "",
    });
    setMiniAppsNotificationAction("");
    setPendingMiniAppDeepLink(null);
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
    setDailyCommandCheckpoint(null);
    setOperatorCalendarDate("");
    setBusyActionAudit([]);
    setBusyUndoAction(null);
    setAutopilotMode("prepare");
    setAutopilotRuleDraft("");
    setAutopilotLastCheckAt("");
    setAutopilotLastSignature("");
    setAutopilotSnoozed({});
    setAutopilotPreparedLog([]);
    setBusinessMemoryHistory([]);
    setBusinessMemoryLastReviewAt("");
    setProactiveNotificationsEnabled(false);
    setProactiveNotificationPermission("unknown");
    setProactiveMorningTime("08:00");
    setProactiveQuietHoursEnabled(true);
    setProactiveQuietStart("20:00");
    setProactiveQuietEnd("07:00");
    setProactiveJobReminderMinutes(60);
    setProactiveScheduledMap({});
    setProactiveNotificationLog([]);
    setDiaryConnection({
      status: "disconnected",
      calendarId: "",
      title: "",
      source: "",
      lastSyncAt: "",
    });
    setDiaryCalendars([]);
    setDiaryEventMap({});
    setDiaryExternalEvents([]);
    setDiaryConflicts([]);
    setDiarySyncStatus("idle");
    setRemotePushStatus({
      state: "not_checked",
      token: "",
      deviceCount: 0,
      lastRegisteredAt: "",
      message: "",
    });
    setRemotePushAction("");
    setCalendarOAuthStatus({
      loaded: false,
      configured: false,
      connection: null,
      callbackUrl: "",
      error: "",
    });
    setProductionBridgeAction("");
    setGoogleCalendarSyncStatus({
      state: "not_synced",
      lastSyncedAt: "",
      created: 0,
      updated: 0,
      conflictCount: 0,
      message: "",
    });
    setGoogleCalendarExternalEvents([]);
    setGoogleCalendarConflicts([]);
    setProductionWatchStatus({
      configured: false,
      schedule: "",
      lastDeliveryAt: "",
      deliveryCount: 0,
      message: "",
    });
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
  const customerJourneys = customers
    .map((customer) =>
      buildCustomerJourney2({
        customer,
        action: replyActions?.[customer.id] || null,
        services,
        verticalId,
        todayISO,
      })
    )
    .filter(Boolean);
  const selectedCustomerJourney =
    customerJourneys.find((journey) => journey.customerId === selectedCustomerId) || null;
  const customerJourneyWarningCount = customerJourneys.filter(
    (journey) => (journey.stalledSignals?.length || 0) > 0
  ).length;
  const customerJourneyNextActionCount = customerJourneys.filter(
    (journey) => !!journey.nextAction?.actionLabel
  ).length;
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

  const businessMemoryStage = (sample = 0) => {
    const count = Math.max(0, Number(sample) || 0);
    if (count < 3) return { label: "Too early to tell", weight: 0, tone: "blue" };
    if (count < 6) return { label: "Early signal", weight: 0.5, tone: "blue" };
    if (count < 12) return { label: "Useful evidence", weight: 0.8, tone: "green" };
    return { label: "Strong evidence", weight: 1, tone: "green" };
  };

  const businessMemoryCorePatterns = businessBrainPatterns.map((pattern) => {
    const sample = Number(pattern.evidence?.sample || 0);
    const successes = Number(pattern.evidence?.successes || 0);
    const observedRate =
      pattern.evidence?.observedRate === null ||
      pattern.evidence?.observedRate === undefined
        ? null
        : Number(pattern.evidence.observedRate);
    const stage = businessMemoryStage(sample);
    const boundedBase = Number(pattern.effectiveAdjustment || 0);
    const stagedAdjustment =
      stage.weight === 0 ? 0 : Math.round(boundedBase * stage.weight);
    return {
      key: pattern.key,
      family: pattern.family,
      title: pattern.title,
      outcomeLabel: pattern.outcomeLabel,
      sample,
      successes,
      observedRate,
      stage,
      basis: pattern.evidence?.basis || pattern.title,
      lastUpdated: pattern.lastUpdated || "",
      freshness: pattern.freshness,
      stagedAdjustment,
    };
  });

  const completedServiceMemory = Object.values(
    completedJobEntries.reduce((groups, entry) => {
      const service = entry.job.service || entry.customer.service || "Other work";
      if (!groups[service]) {
        groups[service] = {
          service,
          sample: 0,
          totalValue: 0,
          values: [],
        };
      }
      const value = Number(entry.job.value) || 0;
      groups[service].sample += 1;
      groups[service].totalValue += value;
      if (value > 0) groups[service].values.push(value);
      return groups;
    }, {})
  )
    .map((item) => ({
      ...item,
      averageValue: item.values.length
        ? Math.round(item.values.reduce((sum, value) => sum + value, 0) / item.values.length)
        : 0,
      stage: businessMemoryStage(item.sample),
    }))
    .sort((a, b) => b.sample - a.sample || b.averageValue - a.averageValue);

  const quoteValueBandMemory = [
    { id: "under-300", label: "Quotes under £300", min: 0, max: 299.999 },
    { id: "300-500", label: "Quotes £300–£500", min: 300, max: 500 },
    { id: "over-500", label: "Quotes over £500", min: 500.001, max: Infinity },
  ].map((band) => {
    const entries = quoteOutcomeRecordedEntries.filter((entry) => {
      const value = Number(entry.action.details?.quoteAmount) || 0;
      return value >= band.min && value <= band.max;
    });
    const successes = entries.filter(
      (entry) => entry.action.details?.followUpOutcome === "Accepted"
    ).length;
    return {
      ...band,
      sample: entries.length,
      successes,
      observedRate: entries.length ? successes / entries.length : null,
      stage: businessMemoryStage(entries.length),
    };
  });

  const socialChannelMemory = socialChannelEvidence.map((item) => ({
    channel: item.channel,
    sample: Number(item.sample || 0),
    successes: Number(item.successes || 0),
    observedRate:
      item.observedRate === null || item.observedRate === undefined
        ? null
        : Number(item.observedRate),
    stage: businessMemoryStage(item.sample),
  }));

  const repeatIntervalSamples = customers.flatMap((customer) => {
    const jobs = (Array.isArray(customer.history) ? customer.history : [])
      .filter((item) => item.kind === "job" && item.date)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    if (jobs.length < 2) return [];
    const samples = [];
    for (let index = 1; index < jobs.length; index += 1) {
      const earlier = new Date(jobs[index - 1].date);
      const later = new Date(jobs[index].date);
      const months =
        Number.isNaN(earlier.getTime()) || Number.isNaN(later.getTime())
          ? 0
          : (later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      if (months > 0) {
        samples.push({
          service: jobs[index].service || customer.service || "Other work",
          months,
        });
      }
    }
    return samples;
  });

  const repeatIntervalMemory = Object.values(
    repeatIntervalSamples.reduce((groups, item) => {
      if (!groups[item.service]) {
        groups[item.service] = { service: item.service, sample: 0, totalMonths: 0 };
      }
      groups[item.service].sample += 1;
      groups[item.service].totalMonths += item.months;
      return groups;
    }, {})
  )
    .map((item) => ({
      ...item,
      averageMonths: Math.round((item.totalMonths / Math.max(1, item.sample)) * 10) / 10,
      stage: businessMemoryStage(item.sample),
    }))
    .sort((a, b) => b.sample - a.sample);

  const businessMemoryRawSignature = JSON.stringify({
    outcomes: businessMemoryCorePatterns.map((item) => [
      item.key,
      item.sample,
      item.successes,
      item.observedRate === null ? null : Math.round(item.observedRate * 1000),
      item.lastUpdated,
    ]),
    services: completedServiceMemory.map((item) => [
      item.service,
      item.sample,
      item.averageValue,
    ]),
    quoteBands: quoteValueBandMemory.map((item) => [
      item.id,
      item.sample,
      item.successes,
    ]),
    channels: socialChannelMemory.map((item) => [
      item.channel,
      item.sample,
      item.successes,
    ]),
    repeats: repeatIntervalMemory.map((item) => [
      item.service,
      item.sample,
      item.averageMonths,
    ]),
  });

  const previousBusinessMemorySnapshot =
    businessMemoryHistory.find(
      (snapshot) => snapshot?.signature && snapshot.signature !== businessMemoryRawSignature
    ) || null;
  const previousBusinessMemoryByKey = Object.fromEntries(
    (previousBusinessMemorySnapshot?.patterns || []).map((item) => [item.key, item])
  );

  const businessMemoryPatterns = businessMemoryCorePatterns.map((item) => {
    const previous = previousBusinessMemoryByKey[item.key] || null;
    const previousRate =
      previous?.observedRate === null || previous?.observedRate === undefined
        ? null
        : Number(previous.observedRate);
    const rateDelta =
      item.observedRate === null || previousRate === null
        ? 0
        : item.observedRate - previousRate;
    const hasUsefulTrend =
      item.sample >= 6 &&
      Number(previous?.sample || 0) >= 3 &&
      Math.abs(rateDelta) >= 0.08;
    const trendAdjustment = hasUsefulTrend ? (rateDelta > 0 ? 1 : -1) : 0;
    const memoryAdjustment = Math.max(
      -6,
      Math.min(8, Number(item.stagedAdjustment || 0) + trendAdjustment)
    );
    const direction =
      !previous || item.sample === Number(previous.sample || 0)
        ? "Stable"
        : rateDelta >= 0.08
        ? "Strengthening"
        : rateDelta <= -0.08
        ? "Weakening"
        : "More evidence";

    return {
      ...item,
      previousSample: Number(previous?.sample || 0),
      previousSuccesses: Number(previous?.successes || 0),
      previousObservedRate: previousRate,
      rateDelta,
      direction,
      trendAdjustment,
      memoryAdjustment,
      learnedBecause:
        item.sample < 3
          ? `Only ${item.sample} recorded outcome${item.sample === 1 ? "" : "s"} — BUSY will not let this change rankings yet.`
          : `${item.successes} ${item.outcomeLabel.toLowerCase()} from ${item.sample} recorded outcomes • ${item.stage.label.toLowerCase()} • ${item.freshness?.label || "unknown freshness"}.`,
    };
  });

  const businessBrainAdjustments = Object.fromEntries(
    businessMemoryPatterns.map((pattern) => [pattern.key, pattern.memoryAdjustment])
  );

  const businessMemoryChanges = businessMemoryPatterns
    .map((item) => {
      const previous = previousBusinessMemoryByKey[item.key] || null;
      if (!previous) return null;
      const sampleDelta = item.sample - Number(previous.sample || 0);
      const successDelta = item.successes - Number(previous.successes || 0);
      const adjustmentDelta =
        item.memoryAdjustment - Number(previous.memoryAdjustment || 0);
      if (!sampleDelta && !successDelta && !adjustmentDelta) return null;
      return {
        key: item.key,
        title: item.title,
        sampleDelta,
        successDelta,
        adjustmentDelta,
        direction: item.direction,
        currentStage: item.stage.label,
        currentRate: item.observedRate,
        previousRate: item.previousObservedRate,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        Math.abs(Number(b.adjustmentDelta || 0)) -
          Math.abs(Number(a.adjustmentDelta || 0)) ||
        Number(b.sampleDelta || 0) - Number(a.sampleDelta || 0)
    );

  const strongestBusinessMemoryPattern =
    [...businessMemoryPatterns]
      .filter((item) => item.stage.weight > 0)
      .sort(
        (a, b) =>
          Math.abs(Number(b.memoryAdjustment || 0)) -
            Math.abs(Number(a.memoryAdjustment || 0)) ||
          b.sample - a.sample
      )[0] || null;

  const businessMemoryInsights = [];
  if (strongestBusinessMemoryPattern) {
    const item = strongestBusinessMemoryPattern;
    businessMemoryInsights.push({
      id: `outcome-${item.key}`,
      title: item.title,
      kind: "Outcome performance",
      body:
        item.observedRate === null
          ? item.learnedBecause
          : `${Math.round(item.observedRate * 100)}% observed success from ${item.sample} recorded outcome${item.sample === 1 ? "" : "s"}. ${item.stage.label}.`,
      confidence: item.stage.label,
      rankingEffect: item.memoryAdjustment,
    });
  }
  const strongestServiceValue = completedServiceMemory.find(
    (item) => item.sample >= 3 && item.averageValue > 0
  );
  if (strongestServiceValue) {
    businessMemoryInsights.push({
      id: `service-value-${strongestServiceValue.service}`,
      title: `${strongestServiceValue.service} job value`,
      kind: "Service value",
      body: `Average recorded completed-job value is £${strongestServiceValue.averageValue} across ${strongestServiceValue.sample} job${strongestServiceValue.sample === 1 ? "" : "s"}.`,
      confidence: strongestServiceValue.stage.label,
      rankingEffect: 0,
    });
  }
  const strongestQuoteBand =
    [...quoteValueBandMemory]
      .filter((item) => item.sample >= 3)
      .sort(
        (a, b) =>
          Number(b.observedRate || 0) - Number(a.observedRate || 0) ||
          b.sample - a.sample
      )[0] || null;
  if (strongestQuoteBand) {
    businessMemoryInsights.push({
      id: `quote-band-${strongestQuoteBand.id}`,
      title: strongestQuoteBand.label,
      kind: "Quote value",
      body: `${strongestQuoteBand.successes} accepted from ${strongestQuoteBand.sample} recorded follow-up outcomes (${Math.round(
        Number(strongestQuoteBand.observedRate || 0) * 100
      )}%).`,
      confidence: strongestQuoteBand.stage.label,
      rankingEffect: 0,
    });
  }
  const strongestChannel =
    [...socialChannelMemory]
      .filter((item) => item.sample >= 3)
      .sort(
        (a, b) =>
          Number(b.observedRate || 0) - Number(a.observedRate || 0) ||
          b.sample - a.sample
      )[0] || null;
  if (strongestChannel) {
    businessMemoryInsights.push({
      id: `channel-${strongestChannel.channel}`,
      title: strongestChannel.channel,
      kind: "Social destination",
      body: `${strongestChannel.successes} recorded booking outcome${strongestChannel.successes === 1 ? "" : "s"} from ${strongestChannel.sample} attributed result${strongestChannel.sample === 1 ? "" : "s"}.`,
      confidence: strongestChannel.stage.label,
      rankingEffect: 0,
    });
  }
  const strongestRepeat =
    repeatIntervalMemory.find((item) => item.sample >= 3) || null;
  if (strongestRepeat) {
    businessMemoryInsights.push({
      id: `repeat-${strongestRepeat.service}`,
      title: `${strongestRepeat.service} repeat rhythm`,
      kind: "Repeat timing",
      body: `Recorded repeat jobs for this service have averaged about ${strongestRepeat.averageMonths} months across ${strongestRepeat.sample} intervals.`,
      confidence: strongestRepeat.stage.label,
      rankingEffect: 0,
    });
  }

  const recentMemoryWithin30Days = (timestamp) => {
    const days = daysSinceTimestamp(timestamp);
    return days !== null && days <= 30;
  };
  const businessMemoryRecentRows = [
    {
      key: "quotes",
      label: "Quote follow-ups",
      sample: quoteOutcomeRecordedEntries.filter((entry) =>
        recentMemoryWithin30Days(entry.action.details?.followUpOutcomeRecordedAt)
      ).length,
      successes: quoteOutcomeRecordedEntries.filter(
        (entry) =>
          recentMemoryWithin30Days(entry.action.details?.followUpOutcomeRecordedAt) &&
          entry.action.details?.followUpOutcome === "Accepted"
      ).length,
      successLabel: "accepted",
    },
    {
      key: "reviews",
      label: "Review requests",
      sample: reviewOutcomeRecordedEntries.filter((entry) =>
        recentMemoryWithin30Days(entry.job.reviewRequestOutcomeRecordedAt)
      ).length,
      successes: reviewOutcomeRecordedEntries.filter(
        (entry) =>
          recentMemoryWithin30Days(entry.job.reviewRequestOutcomeRecordedAt) &&
          entry.job.reviewRequestOutcome === "Review left"
      ).length,
      successLabel: "reviews",
    },
    {
      key: "social",
      label: "Finished-job posts",
      sample: postOutcomeEntries.filter((entry) =>
        recentMemoryWithin30Days(entry.job.postOutcomeRecordedAt)
      ).length,
      successes: postOutcomeEntries.filter(
        (entry) =>
          recentMemoryWithin30Days(entry.job.postOutcomeRecordedAt) &&
          entry.job.postOutcome === "Booking"
      ).length,
      successLabel: "bookings",
    },
    {
      key: "enquiries",
      label: "Quiet-enquiry follow-ups",
      sample: enquiryOutcomeRecordedEntries.filter((entry) =>
        recentMemoryWithin30Days(entry.customer.enquiryFollowUpOutcomeRecordedAt)
      ).length,
      successes: enquiryOutcomeRecordedEntries.filter(
        (entry) =>
          recentMemoryWithin30Days(entry.customer.enquiryFollowUpOutcomeRecordedAt) &&
          entry.customer.enquiryFollowUpOutcome === "Still interested"
      ).length,
      successLabel: "still interested",
    },
  ];

  const businessMemorySnapshot = {
    id: `memory-${Date.now()}`,
    capturedAt: new Date().toISOString(),
    signature: businessMemoryRawSignature,
    patterns: businessMemoryPatterns.map((item) => ({
      key: item.key,
      title: item.title,
      sample: item.sample,
      successes: item.successes,
      observedRate: item.observedRate,
      memoryAdjustment: item.memoryAdjustment,
      stage: item.stage.label,
      lastUpdated: item.lastUpdated,
    })),
    services: completedServiceMemory.map((item) => ({
      service: item.service,
      sample: item.sample,
      averageValue: item.averageValue,
      stage: item.stage.label,
    })),
    quoteBands: quoteValueBandMemory.map((item) => ({
      id: item.id,
      label: item.label,
      sample: item.sample,
      successes: item.successes,
      observedRate: item.observedRate,
      stage: item.stage.label,
    })),
    channels: socialChannelMemory.map((item) => ({
      channel: item.channel,
      sample: item.sample,
      successes: item.successes,
      observedRate: item.observedRate,
      stage: item.stage.label,
    })),
  };

  useEffect(() => {
    if (!hydrated) return;
    if (businessMemoryHistory[0]?.signature === businessMemoryRawSignature) return;
    const reviewedAt = new Date().toISOString();
    setBusinessMemoryHistory((current) => [
      { ...businessMemorySnapshot, capturedAt: reviewedAt },
      ...current.filter((item) => item?.signature !== businessMemoryRawSignature),
    ].slice(0, 24));
    setBusinessMemoryLastReviewAt(reviewedAt);
  }, [hydrated, businessMemoryRawSignature]);

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
      businessMemoryPatterns.find((item) => item.family === family) || null;
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
          ["Business Memory evidence", pattern.basis || pattern.title],
          ["Memory confidence", pattern.stage?.label || "Too early to tell"],
          ["Evidence freshness", pattern.freshness?.label || "Unknown"],
          ["Outcome ranking effect", `${Number(pattern.memoryAdjustment || 0) > 0 ? "+" : ""}${Number(pattern.memoryAdjustment || 0)} points`],
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

  const autopilotRules = businessBrainRules.filter(
    (rule) => rule?.source === "Autopilot rule"
  );
  const autopilotRuleText = autopilotRules
    .map((rule) => String(rule.text || "").toLowerCase())
    .join(" \n");

  const autopilotModeLabel =
    autopilotMode === "trusted"
      ? "Trusted internal actions"
      : autopilotMode === "off"
      ? "Off"
      : "Prepare for me";

  const contactNumberWords = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
  };
  const autopilotContactLimit = (() => {
    for (const rule of [...autopilotRules].reverse()) {
      const text = String(rule.text || "").toLowerCase();
      if (!/(contact|message|follow.?up|chase)/i.test(text)) continue;
      const match = text.match(
        /(?:no more than|more than|maximum|max|limit(?:ed)?(?:\s+to)?)\s+(one|two|three|four|five|\d+)/i
      );
      if (!match) continue;
      const raw = String(match[1] || "").toLowerCase();
      const parsed = contactNumberWords[raw] || Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return null;
  })();

  const autopilotPaidBlockedByRule =
    /(paid|advertis|ad spend)/i.test(autopilotRuleText) &&
    /(never|do not|don't|free.*first|before.*paid|only after)/i.test(autopilotRuleText);

  const customerContactCount = (customer) =>
    (Array.isArray(customer?.activity) ? customer.activity : []).filter((item) =>
      /(follow-up|review-request|reactivation|message|contact)/i.test(
        String(item?.kind || "")
      )
    ).length;

  const isAutopilotSnoozed = (id) => {
    const until = Date.parse(autopilotSnoozed?.[id]?.until || "");
    return Number.isFinite(until) && until > Date.now();
  };

  const autopilotRawApprovalItems = [
    ...dueQuoteEntries.slice(0, 8).map((entry) => {
      const amount = Number(entry.action?.details?.quoteAmount) || 0;
      const customer = entry.customer;
      const firstName = String(customer?.name || "").split(" ")[0] || "there";
      const draft =
        entry.action?.details?.followUpMessage ||
        `Hi ${firstName}, just checking in about the ${String(
          customer?.service || "work"
        ).toLowerCase()} quote${amount ? ` for £${amount}` : ""}. No pressure at all — let me know if you’d like to go ahead, have any questions, or want me to leave it with you for now.`;
      return {
        id: `autopilot-quote-${entry.id}`,
        kind: "quote-follow-up",
        customerId: entry.id,
        customerName: customer?.name || "Customer",
        title: `Quote follow-up • ${customer?.name || "Customer"}`,
        body: draft,
        reason: `Quote has been quiet for ${entry.age || 0} days. Existing demand outranks creating new demand.`,
        confidence: "High",
        externalAction: "Customer message",
        actionLabel: "Review message",
        value: amount,
        contactCount: customerContactCount(customer),
      };
    }),
    ...staleEnquiryEntries.slice(0, 8).map((entry) => {
      const customer = entry.customer;
      const firstName = String(customer?.name || "").split(" ")[0] || "there";
      const draft =
        customer?.enquiryFollowUpDraft ||
        `Hi ${firstName}, you got in touch with us about ${String(
          customer?.service || "some work"
        ).toLowerCase()} a little while ago. I just wanted to check whether you still needed any help with it. No problem at all if you’ve already sorted it.`;
      return {
        id: `autopilot-enquiry-${customer?.id}`,
        kind: "enquiry-follow-up",
        customerId: customer?.id || "",
        customerName: customer?.name || "Customer",
        title: `Quiet enquiry • ${customer?.name || "Customer"}`,
        body: draft,
        reason: `The enquiry is ${entry.age || 0} days old with no recorded next action.`,
        confidence: "High",
        externalAction: "Customer message",
        actionLabel: "Review message",
        value: 0,
        contactCount: customerContactCount(customer),
      };
    }),
    ...automaticReviewDraftEntries.slice(0, 8).map((entry) => ({
      id: `autopilot-review-${entry.customer.id}-${entry.job.id}`,
      kind: "review-request",
      customerId: entry.customer.id,
      jobId: entry.job.id,
      customerName: entry.customer.name,
      title: `Review request • ${entry.customer.name}`,
      body: entry.job.reviewRequestDraft,
      reason: "The completed job already contains enough information to prepare this safely.",
      confidence: "High",
      externalAction: "Customer message",
      actionLabel: "Review request",
      value: Number(entry.job.value) || 0,
      contactCount: customerContactCount(entry.customer),
    })),
    ...automaticPostDraftEntries
      .filter((entry) =>
        !["Published", "Partial failure", "Scheduled", "Simulated published"].includes(
          entry.job.postDraftStatus || "Prepared"
        )
      )
      .slice(0, 6)
      .map((entry) => ({
        id: `autopilot-social-${entry.customer.id}-${entry.job.id}`,
        kind: "social-post",
        customerId: entry.customer.id,
        jobId: entry.job.id,
        customerName: entry.customer.name,
        title: `Finished-job post • ${entry.customer.name}`,
        body: entry.job.postDraft,
        reason: "Real completed-job evidence and approved job photos are already saved.",
        confidence: "High",
        externalAction: "Public post",
        actionLabel: "Review post",
        value: Number(entry.job.value) || 0,
        contactCount: 0,
      })),
    ...(activeWorkGoal &&
    !workGoalFilled &&
    reactivationEligibleCustomers.length
      ? [{
          id: `autopilot-reactivation-${activeWorkGoal.createdAt || "goal"}`,
          kind: "reactivation",
          title: `Fill ${activeWorkGoal.label || "the work gap"}`,
          body: `BUSY has identified ${Math.min(
            reactivationEligibleCustomers.length,
            Math.max(1, recommendedReactivationBatchSize || 1)
          )} suitable previous customer${Math.min(
            reactivationEligibleCustomers.length,
            Math.max(1, recommendedReactivationBatchSize || 1)
          ) === 1 ? "" : "s"} to review before considering paid advertising.`,
          reason: "Previous customers and warm demand are a lower-cost first move for an open capacity goal.",
          confidence: reactivationEvidence?.evidenceReady ? "High" : "Medium",
          externalAction: "Customer messages",
          actionLabel: "Review customer batch",
          value: 0,
          contactCount: 0,
        }]
      : []),
  ];

  const autopilotContactBlockedItems =
    autopilotContactLimit === null
      ? []
      : autopilotRawApprovalItems.filter(
          (item) =>
            item.customerId &&
            item.kind !== "social-post" &&
            Number(item.contactCount || 0) >= autopilotContactLimit
        );

  const autopilotApprovalItems =
    autopilotMode === "off"
      ? []
      : autopilotRawApprovalItems
          .filter(
            (item) =>
              !autopilotContactBlockedItems.some((blocked) => blocked.id === item.id) &&
              !isAutopilotSnoozed(item.id)
          )
          .slice(0, 18);

  const autopilotOverdueBookingItems = Object.entries(replyActions || {})
    .map(([customerId, action]) => {
      if (
        action?.type !== "booking" ||
        !action?.done ||
        !action.details?.bookingDate ||
        ["Cancelled", "Completed"].includes(action.details?.bookingStatus || "Confirmed") ||
        action.details.bookingDate >= dateToISO(new Date())
      ) return null;
      const customer = customers.find((item) => item.id === customerId);
      return customer
        ? {
            id: `autopilot-booking-input-${customerId}`,
            kind: "booking-outcome",
            customerId,
            title: `Booking outcome needed • ${customer.name}`,
            body: `${customer.service} was booked for ${formatUKDate(
              action.details.bookingDate
            )}. BUSY will not guess whether it was completed, moved or cancelled.`,
            reason: "A real booking needs owner input before the diary and pipeline can be trusted.",
            actionLabel: "Open booking",
          }
        : null;
    })
    .filter(Boolean);

  const autopilotNeedsInputItems = [
    ...inboxNeedsAttentionItems.slice(0, 8).map((item) => ({
      id: `autopilot-inbox-${item.id}`,
      kind: "inbox",
      sourceId: item.id,
      title: item.parsed?.name
        ? `Check incoming record • ${item.parsed.name}`
        : "Check incoming business record",
      body: item.triage?.reason || "BUSY does not have enough confidence to file this automatically.",
      reason: "Confidence threshold not met.",
      actionLabel: "Review item",
    })),
    ...autopilotContactBlockedItems.map((item) => ({
      ...item,
      id: `autopilot-contact-limit-${item.id}`,
      sourceApprovalId: item.id,
      kind: "contact-limit",
      body: `This would be contact #${Number(item.contactCount || 0) + 1}. Your owner rule limits BUSY to ${autopilotContactLimit} recorded contact${autopilotContactLimit === 1 ? "" : "s"} before asking you.`,
      reason: "Owner contact-limit rule reached.",
      actionLabel: "Review customer",
    })),
    ...autopilotOverdueBookingItems.slice(0, 6),
    ...socialOutcomeReminders.slice(0, 5).map((entry) => ({
      id: `autopilot-social-outcome-${entry.customer.id}-${entry.job.id}`,
      kind: "social-outcome",
      customerId: entry.customer.id,
      jobId: entry.job.id,
      title: `Post result needed • ${entry.customer.name}`,
      body: "The post is recorded as published, but BUSY does not yet know whether it produced an enquiry or booking.",
      reason: "Real outcomes improve the Business Brain; BUSY will not invent attribution.",
      actionLabel: "Record outcome",
    })),
  ].filter((item) => !isAutopilotSnoozed(item.id));

  const autopilotPreparationSignature = [
    autopilotMode,
    ...autopilotRawApprovalItems.map((item) => item.id),
    ...autopilotNeedsInputItems.map((item) => item.id),
    businessBrainRules.map((rule) => `${rule.id}:${rule.text}`).join("|"),
  ].join("::");

  const runAutopilotPreparation = ({ force = false } = {}) => {
    if (autopilotMode === "off") {
      setAutopilotLastCheckAt(new Date().toISOString());
      setAutopilotLastSignature(autopilotPreparationSignature);
      return { prepared: 0, needsInput: autopilotNeedsInputItems.length };
    }
    if (!force && autopilotLastSignature === autopilotPreparationSignature) {
      return {
        prepared: autopilotApprovalItems.length,
        needsInput: autopilotNeedsInputItems.length,
      };
    }

    // Safe internal prep only: create/edit no external messages and publish nothing.
    setCustomers((current) =>
      current.map((customer) => {
        const entry = staleEnquiryEntries.find(
          (candidate) => candidate.customer?.id === customer.id
        );
        if (!entry || customer.enquiryFollowUpDraft) return customer;
        const firstName = String(customer.name || "").split(" ")[0] || "there";
        return {
          ...customer,
          enquiryFollowUpDraft:
            `Hi ${firstName}, you got in touch with us about ${String(
              customer.service || "some work"
            ).toLowerCase()} a little while ago. I just wanted to check whether you still needed any help with it. No problem at all if you’ve already sorted it.`,
          enquiryFollowUpPreparedAt: new Date().toISOString(),
        };
      })
    );

    setReplyActions((current) => {
      let changed = false;
      const next = { ...current };
      dueQuoteEntries.forEach((entry) => {
        const action = next[entry.id];
        if (
          !action ||
          action?.type !== "quote" ||
          action.details?.followUpMessage
        ) return;
        const customer = entry.customer;
        const amount = action.details?.quoteAmount;
        const service = customer?.service || "the work";
        next[entry.id] = {
          ...action,
          details: {
            ...(action.details || {}),
            followUpMessage:
              `Hi ${String(customer?.name || "there").split(" ")[0]}, just checking in about the ${service.toLowerCase()} quote${amount ? ` for £${amount}` : ""}. No pressure at all — let me know if you’d like to go ahead, have any questions, or want me to leave it with you for now.`,
            followUpPreparedAt: new Date().toISOString(),
          },
        };
        changed = true;
      });
      return changed ? next : current;
    });

    const checkedAt = new Date().toISOString();
    setAutopilotLastCheckAt(checkedAt);
    setAutopilotLastSignature(autopilotPreparationSignature);
    setAutopilotPreparedLog((current) => [
      {
        id: `autopilot-check-${Date.now()}`,
        checkedAt,
        mode: autopilotMode,
        prepared: autopilotApprovalItems.length,
        needsInput: autopilotNeedsInputItems.length,
      },
      ...current,
    ].slice(0, 30));
    return {
      prepared: autopilotApprovalItems.length,
      needsInput: autopilotNeedsInputItems.length,
    };
  };

  useEffect(() => {
    if (!hydrated || !cloudAttempted || autopilotMode === "off") return;
    if (autopilotLastSignature === autopilotPreparationSignature) return;
    const timer = setTimeout(() => {
      runAutopilotPreparation();
    }, 350);
    return () => clearTimeout(timer);
  }, [
    hydrated,
    cloudAttempted,
    autopilotMode,
    autopilotPreparationSignature,
    autopilotLastSignature,
  ]);

  const changeAutopilotMode = (mode) => {
    if (!["off", "prepare", "trusted"].includes(mode)) return;
    setAutopilotMode(mode);
    setAutopilotLastSignature("");
    // Autopilot authority is explicit: only Trusted mode may auto-file high-confidence records.
    setRecordFilingMode(mode === "trusted" ? "safe" : "review");
  };

  const saveAutopilotRule = () => {
    const text = autopilotRuleDraft.trim();
    if (!text) return;
    setBusinessBrainRules((rules) => [
      ...rules,
      {
        id: `autopilot-rule-${Date.now()}`,
        text,
        source: "Autopilot rule",
        scope: businessBrainRuleScope(text),
        confidence: "Owner-set",
        kind: "manual",
        targetFamilies: manualRuleTargetFamilies({ text }),
        createdAt: new Date().toISOString(),
      },
    ]);
    setAutopilotRuleDraft("");
    setAutopilotLastSignature("");
  };

  const removeAutopilotRule = (id) => {
    setBusinessBrainRules((rules) => rules.filter((rule) => rule.id !== id));
    setAutopilotLastSignature("");
  };

  const snoozeAutopilotItem = (id, hours = 24) => {
    setAutopilotSnoozed((current) => ({
      ...current,
      [id]: {
        until: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const restoreAutopilotItems = () => setAutopilotSnoozed({});

  const openAutopilotApproval = (item) => {
    if (!item) return false;
    if (item.kind === "quote-follow-up") {
      prepareQuoteFollowUp(item.customerId);
      return true;
    }
    if (item.kind === "enquiry-follow-up") {
      prepareEnquiryFollowUp(item.customerId);
      return true;
    }
    if (item.kind === "review-request") {
      prepareReviewRequest(item.customerId, item.jobId);
      return true;
    }
    if (item.kind === "social-post") {
      openJobPostApproval(item.customerId, item.jobId);
      return true;
    }
    if (item.kind === "reactivation") {
      startCampaign(
        0,
        Math.max(
          1,
          Math.min(
            reactivationEligibleCustomers.length,
            recommendedReactivationBatchSize || 1
          )
        )
      );
      return true;
    }
    return false;
  };

  const openAutopilotNeedsInput = (item) => {
    if (!item) return false;
    if (item.kind === "inbox") {
      openInboxItem(item.sourceId);
      return true;
    }
    if (item.kind === "contact-limit") {
      const original = autopilotRawApprovalItems.find(
        (candidate) => candidate.id === item.sourceApprovalId
      );
      if (original?.customerId) {
        openCustomer(original.customerId);
        return true;
      }
    }
    if (item.kind === "booking-outcome") {
      openSavedReplyAction(item.customerId);
      return true;
    }
    if (item.kind === "social-outcome") {
      openJobPostOutcome(item.customerId, item.jobId);
      return true;
    }
    return false;
  };
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
  const communicationsHub = buildCommunicationsHub({
    customers,
    customerJourneys,
    inboxItems: inboxPendingItems,
  });
  const followUpEngine = buildFollowUpEngine({
    communicationsHub,
    todayISO: dateToISO(new Date()),
  });
  const brandBrain = buildBrandBrain({
    businessName,
    trade,
    verticalLabel: getVerticalPack(verticalId)?.label || "",
    postcode,
    radius,
    services,
    brandProfile,
    customers,
    socialDrafts,
    connectedAccounts,
  });
  const websitePublishingView = buildWebsitePublishingView({
    remote: websitePublishingStatus,
    websiteDraft,
  });
  const miniAppsView = buildMiniAppsView(miniAppsStatus);
  const businessCreationIntelligence = buildBusinessCreationIntelligence({
    brandBrain,
    websiteDraft,
    miniAppsView,
  });
  const businessCreationJourney = buildBusinessCreationJourney({
    businessCreationIntelligence,
    brandBrain,
    websiteDraft,
    websitePublishingView,
    miniAppsView,
    connectedAccounts,
    socialBrief,
    ownerBrief: businessCreationBrief,
  });
  const miniAppProfileDraft = buildMiniAppProfileDraft(
    brandBrain,
    businessCreationIntelligence
  );
  const miniAppShareLinks = (() => {
    const slug = String(miniAppsView?.publicSlug || "").trim();
    if (!slug) return { native: "", qr: "", share: "" };
    const encoded = encodeURIComponent(slug);
    const landing = (source) =>
      `${BUSY_MINI_APP_LINK_URL}?slug=${encoded}&source=${encodeURIComponent(source)}`;
    return {
      native: `busydoesit://apps/${encoded}?source=deep_link`,
      qr: landing("qr"),
      share: landing("share"),
    };
  })();
  const selectedCommunicationThread =
    communicationsHub.threads.find(
      (thread) => thread.customerId === selectedCustomerId
    ) || null;
  const selectedFollowUpCandidate =
    followUpEngine.candidates.find(
      (candidate) => candidate.customerId === selectedCustomerId
    ) || null;
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


  const executiveTodayISO = dateToISO(new Date());
  const executiveEnd7ISO = addDaysFromISO(executiveTodayISO, 6);
  const executiveEnd30ISO = addDaysFromISO(executiveTodayISO, 29);
  const executiveStart7ISO = addDaysFromISO(executiveTodayISO, -6);

  const executiveConfirmedBookings = Object.entries(replyActions || {})
    .map(([customerId, action]) => {
      if (
        action?.type !== "booking" ||
        !action?.done ||
        !action.details?.bookingDate ||
        (action.details?.bookingStatus || "Confirmed") !== "Confirmed"
      ) return null;
      const customer =
        customers.find((item) => item.id === customerId) ||
        lastSimulatedRecipients.find((item) => item.id === customerId);
      if (!customer) return null;
      const service =
        services.find((item) => item.name === customer.service) || null;
      return {
        customerId,
        customerName: customer.name || "Customer",
        service: customer.service || "Service",
        date: action.details.bookingDate,
        time: action.details.bookingTime || "",
        value:
          Number(action.details?.jobValue) ||
          Number(action.details?.sourceQuoteAmount) ||
          0,
        durationHours: Math.max(
          0.5,
          Number(planningDurationHours(service)) || 2
        ),
      };
    })
    .filter(Boolean)
    .sort((a, b) =>
      String(a.date).localeCompare(String(b.date)) ||
      String(a.time).localeCompare(String(b.time))
    );

  const executiveBookings7 = executiveConfirmedBookings.filter(
    (item) => item.date >= executiveTodayISO && item.date <= executiveEnd7ISO
  );
  const executiveBookings30 = executiveConfirmedBookings.filter(
    (item) => item.date >= executiveTodayISO && item.date <= executiveEnd30ISO
  );
  const executiveConfirmed7Value = executiveBookings7.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );
  const executiveConfirmed30Value = executiveBookings30.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );

  const executiveOpenQuoteRows = Object.entries(replyActions || {})
    .map(([customerId, action]) => {
      if (
        action?.type !== "quote" ||
        !action?.done ||
        !["Sent", "Accepted"].includes(action.details?.quoteStatus || "Prepared") ||
        ["Declined", "No response"].includes(action.details?.followUpOutcome || "")
      ) return null;
      const customer =
        customers.find((item) => item.id === customerId) ||
        lastSimulatedRecipients.find((item) => item.id === customerId);
      if (!customer) return null;
      return {
        customerId,
        customerName: customer.name || "Customer",
        service: customer.service || "Service",
        value: Number(action.details?.quoteAmount) || 0,
        status: action.details?.quoteStatus || "Sent",
        sentAt: action.details?.quoteSentAt || action.updatedAt || "",
      };
    })
    .filter(Boolean);
  const executiveOpenQuoteValue = executiveOpenQuoteRows.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );

  const executiveRepeatPool = eligibleCustomers
    .filter((customer) => !hasActiveCustomerWork(customer.id))
    .map((customer) => {
    const service = services.find((item) => item.name === customer.service);
    const serviceMemory = completedServiceMemory.find(
      (item) => item.service === customer.service && item.averageValue > 0
    );
    return {
      customerId: customer.id,
      customerName: customer.name,
      service: customer.service,
      value:
        Number(customer.lastJobValue) ||
        Number(serviceMemory?.averageValue) ||
        Number(service?.value) ||
        0,
    };
  });
  const executiveRepeatPoolValue = executiveRepeatPool.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );

  const executiveForecastBand = (pattern, fallbackRate = 0.25) => {
    const sample = Number(pattern?.sample || 0);
    const stage = pattern?.stage?.label || "Too early to tell";
    const observed =
      pattern?.observedRate === null || pattern?.observedRate === undefined
        ? null
        : Number(pattern.observedRate);
    const base =
      observed !== null && ["Useful evidence", "Strong evidence"].includes(stage)
        ? observed
        : Number(fallbackRate || 0);
    const spread =
      stage === "Strong evidence"
        ? 0.07
        : stage === "Useful evidence"
        ? 0.1
        : stage === "Early signal"
        ? 0.14
        : 0.18;
    return {
      sample,
      stage,
      base,
      low: Math.max(0, Math.min(0.9, base - spread)),
      high: Math.max(0, Math.min(0.9, base + spread)),
    };
  };

  const executiveQuotePattern =
    businessMemoryPatterns.find((item) => item.key === "quoteFollowUp") || null;
  const executiveRepeatPattern =
    businessMemoryPatterns.find((item) => item.key === "reactivation") || null;
  const executiveQuoteBand = executiveForecastBand(
    executiveQuotePattern,
    quoteFollowUpEvidence?.rate ?? 0.25
  );
  const executiveRepeatBand = executiveForecastBand(
    executiveRepeatPattern,
    reactivationEvidence?.rate ?? 1 / 3
  );

  const executiveWarmQuoteLow = Math.round(
    executiveOpenQuoteValue * executiveQuoteBand.low
  );
  const executiveWarmQuoteHigh = Math.round(
    executiveOpenQuoteValue * executiveQuoteBand.high
  );
  const executiveRepeatLow = Math.round(
    executiveRepeatPoolValue * executiveRepeatBand.low
  );
  const executiveRepeatHigh = Math.round(
    executiveRepeatPoolValue * executiveRepeatBand.high
  );
  const executiveOutlookLow =
    executiveConfirmed30Value + executiveWarmQuoteLow + executiveRepeatLow;
  const executiveOutlookHigh =
    executiveConfirmed30Value + executiveWarmQuoteHigh + executiveRepeatHigh;
  const executiveForecastEvidenceSample =
    Number(executiveQuoteBand.sample || 0) + Number(executiveRepeatBand.sample || 0);
  const executiveForecastConfidence =
    executiveForecastEvidenceSample >= 18 &&
    ["Useful evidence", "Strong evidence"].includes(executiveQuoteBand.stage) &&
    ["Useful evidence", "Strong evidence"].includes(executiveRepeatBand.stage)
      ? "High"
      : executiveForecastEvidenceSample >= 6
      ? "Medium"
      : "Low";

  const executiveExternalScheduleEvents = (() => {
    const rows = [...diaryExternalEvents, ...googleCalendarExternalEvents];
    const seen = new Set();
    return rows.filter((item) => {
      const signature = [
        item.date || "",
        item.time || "",
        String(item.title || "").trim().toLowerCase(),
        Math.round(Number(item.durationHours || 0) * 10),
      ].join("|");
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  })();

  const workCalendarIntelligence = buildWorkCalendarIntelligence({
    todayISO: executiveTodayISO,
    bookings: executiveConfirmedBookings,
    externalEvents: executiveExternalScheduleEvents,
    replyActions,
    customers,
    services,
    eligibleCustomers,
    plannedSlots: Array.isArray(activeWorkGoal?.plannedSlots)
      ? activeWorkGoal.plannedSlots
      : [],
  });

  const executiveLoadRows = Array.from({ length: 7 }, (_, offset) => {
    const date = addDaysFromISO(executiveTodayISO, offset);
    const entries = executiveBookings7.filter((item) => item.date === date);
    const externalEntries = executiveExternalScheduleEvents.filter((item) => item.date === date);
    const busyHours = entries.reduce(
      (sum, item) => sum + Number(item.durationHours || 0),
      0
    );
    const externalHours = externalEntries.reduce(
      (sum, item) => sum + Number(item.durationHours || 0),
      0
    );
    const hours = Math.round((busyHours + externalHours) * 10) / 10;
    const value = entries.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const label = new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    return {
      date,
      label,
      count: entries.length,
      externalCount: externalEntries.length,
      hours,
      externalHours: Math.round(externalHours * 10) / 10,
      value,
      state:
        hours === 0
          ? "Quiet"
          : hours < 2.5
          ? "Light"
          : hours < 5.5
          ? "Healthy"
          : "Busy",
    };
  });

  const executiveQuietDays = executiveLoadRows.filter(
    (item) => item.state === "Quiet"
  );
  const executiveLightDays = executiveLoadRows.filter(
    (item) => item.state === "Light"
  );

  const executiveServiceConcentration = (() => {
    if (!executiveBookings30.length) return null;
    const totals = executiveBookings30.reduce((map, item) => {
      map[item.service] = (map[item.service] || 0) + (Number(item.value) || 1);
      return map;
    }, {});
    const total = Object.values(totals).reduce(
      (sum, value) => sum + Number(value || 0),
      0
    );
    if (!total) return null;
    const [service, value] =
      Object.entries(totals).sort((a, b) => Number(b[1]) - Number(a[1]))[0] || [];
    if (!service) return null;
    return {
      service,
      share: Number(value) / total,
      bookingCount: executiveBookings30.filter((item) => item.service === service).length,
    };
  })();

  const executiveRiskRows = [
    ...(autopilotOverdueBookingItems.length
      ? [{
          id: "past-bookings",
          label: "Past booking outcomes",
          level: "High",
          detail: `${autopilotOverdueBookingItems.length} past booking${autopilotOverdueBookingItems.length === 1 ? "" : "s"} still need a real outcome.`,
        }]
      : []),
    ...(dueQuoteEntries.length
      ? [{
          id: "ageing-quotes",
          label: "Ageing quotes",
          level: dueQuoteEntries.length >= 3 ? "High" : "Medium",
          detail: `${dueQuoteEntries.length} quote${dueQuoteEntries.length === 1 ? "" : "s"} are due for follow-up.`,
        }]
      : []),
    ...(executiveQuietDays.length >= 3
      ? [{
          id: "light-capacity",
          label: "Forward diary",
          level: "Medium",
          detail: `${executiveQuietDays.length} of the next 7 calendar days currently have no confirmed booking saved.`,
        }]
      : []),
    ...(executiveServiceConcentration &&
    executiveBookings30.length >= 3 &&
    executiveServiceConcentration.share >= 0.7
      ? [{
          id: "service-concentration",
          label: "Service concentration",
          level: "Medium",
          detail: `${Math.round(executiveServiceConcentration.share * 100)}% of confirmed 30-day booked value is currently tied to ${executiveServiceConcentration.service}.`,
        }]
      : []),
    ...(autopilotNeedsInputItems.length
      ? [{
          id: "missing-judgement",
          label: "Owner input",
          level: "Medium",
          detail: `${autopilotNeedsInputItems.length} item${autopilotNeedsInputItems.length === 1 ? "" : "s"} cannot safely move forward without owner judgement or a real-world outcome.`,
        }]
      : []),
    ...(activeWorkGoal && !workGoalFilled
      ? [{
          id: "open-work-goal",
          label: "Open work goal",
          level: "Medium",
          detail: `${workGoalRemainingJobs} booking${workGoalRemainingJobs === 1 ? "" : "s"} still needed for ${activeWorkGoal.label || "the current work goal"}.`,
        }]
      : []),
  ];

  const executiveCompletedLast7 = completedJobEntries.filter(
    (entry) =>
      String(entry.job.date || "") >= executiveStart7ISO &&
      String(entry.job.date || "") <= executiveTodayISO
  );
  const executiveCompletedLast7Value = executiveCompletedLast7.reduce(
    (sum, entry) => sum + (Number(entry.job.value) || 0),
    0
  );
  const executiveQuoteOutcomesLast7 = quoteOutcomeRecordedEntries.filter(
    (entry) =>
      String(entry.action.details?.followUpOutcomeRecordedAt || "").slice(0, 10) >=
        executiveStart7ISO &&
      String(entry.action.details?.followUpOutcomeRecordedAt || "").slice(0, 10) <=
        executiveTodayISO
  );
  const executiveQuoteWinsLast7 = executiveQuoteOutcomesLast7.filter(
    (entry) => entry.action.details?.followUpOutcome === "Accepted"
  ).length;
  const executiveReviewsLast7 = reviewOutcomeRecordedEntries.filter(
    (entry) =>
      String(entry.job.reviewRequestOutcomeRecordedAt || "").slice(0, 10) >=
        executiveStart7ISO &&
      String(entry.job.reviewRequestOutcomeRecordedAt || "").slice(0, 10) <=
        executiveTodayISO &&
      entry.job.reviewRequestOutcome === "Review left"
  ).length;
  const executiveSocialBookingsLast7 = postOutcomeEntries.filter(
    (entry) =>
      String(entry.job.postOutcomeRecordedAt || "").slice(0, 10) >=
        executiveStart7ISO &&
      String(entry.job.postOutcomeRecordedAt || "").slice(0, 10) <=
        executiveTodayISO &&
      entry.job.postOutcome === "Booking"
  ).length;

  const executivePriority = (() => {
    if (autopilotOverdueBookingItems.length) {
      const item = autopilotOverdueBookingItems[0];
      return {
        kind: "booking-outcome",
        title: item.title,
        body: item.body,
        actionLabel: "Resolve booking",
        source: item,
      };
    }
    if (inboxNeedsAttentionItems.length) {
      const item = inboxNeedsAttentionItems[0];
      return {
        kind: "inbox",
        title: item.parsed?.name
          ? `Review incoming record for ${item.parsed.name}`
          : "Review an uncertain incoming record",
        body: item.triage?.reason || "BUSY needs owner judgement before filing.",
        actionLabel: "Review Inbox item",
        source: item,
      };
    }
    if (dueQuoteEntries.length) {
      const item = dueQuoteEntries[0];
      return {
        kind: "quote",
        title: `Follow up ${item.customer.name}'s quote`,
        body: `${item.customer.service} has been quiet for ${item.age || 0} days.`,
        actionLabel: "Review follow-up",
        source: item,
      };
    }
    if (staleEnquiryEntries.length) {
      const item = staleEnquiryEntries[0];
      return {
        kind: "enquiry",
        title: `Revisit ${item.customer.name}'s enquiry`,
        body: `${item.customer.service} has no recorded next step after ${item.age || 0} days.`,
        actionLabel: "Review enquiry",
        source: item,
      };
    }
    if (activeWorkGoal && !workGoalFilled) {
      return {
        kind: "work-goal",
        title: `Fill ${activeWorkGoal.label || "the current work gap"}`,
        body: `${workGoalRemainingJobs} booking${workGoalRemainingJobs === 1 ? "" : "s"} still needed.`,
        actionLabel: "Open best next move",
        source: null,
      };
    }
    if (autopilotApprovalItems.length) {
      return {
        kind: "approval",
        title: `${autopilotApprovalItems.length} prepared item${autopilotApprovalItems.length === 1 ? "" : "s"} are ready`,
        body: "BUSY has prepared safe work that now needs the owner's existing approval flow.",
        actionLabel: "Open Approval Inbox",
        source: null,
      };
    }
    return {
      kind: "clear",
      title: "No urgent recorded issue is forcing itself to the top",
      body: executiveBookings7.length
        ? `${executiveBookings7.length} confirmed booking${executiveBookings7.length === 1 ? "" : "s"} are saved across the next 7 days.`
        : "There is no confirmed booking in the next 7 days, so the forward view is worth checking.",
      actionLabel: "Open forward view",
      source: null,
    };
  })();

  const openExecutivePriority = () => {
    const item = executivePriority?.source;
    if (executivePriority.kind === "booking-outcome" && item?.customerId) {
      return openSavedReplyAction(item.customerId);
    }
    if (executivePriority.kind === "inbox" && item?.id) {
      return openInboxItem(item.id);
    }
    if (executivePriority.kind === "quote" && item?.id) {
      return prepareQuoteFollowUp(item.id);
    }
    if (executivePriority.kind === "enquiry" && item?.customer?.id) {
      return prepareEnquiryFollowUp(item.customer.id);
    }
    if (executivePriority.kind === "work-goal") {
      go("bestMove");
      return true;
    }
    if (executivePriority.kind === "approval") {
      go("autopilotCentre");
      return true;
    }
    go("executiveBriefing");
    return true;
  };

  const executiveBriefing = {
    today: executiveTodayISO,
    priority: executivePriority,
    confirmed7: {
      count: executiveBookings7.length,
      value: executiveConfirmed7Value,
    },
    confirmed30: {
      count: executiveBookings30.length,
      value: executiveConfirmed30Value,
    },
    warmQuotes: {
      count: executiveOpenQuoteRows.length,
      totalValue: executiveOpenQuoteValue,
      low: executiveWarmQuoteLow,
      high: executiveWarmQuoteHigh,
      confidence: executiveQuoteBand.stage,
      sample: executiveQuoteBand.sample,
    },
    repeatPotential: {
      count: executiveRepeatPool.length,
      poolValue: executiveRepeatPoolValue,
      low: executiveRepeatLow,
      high: executiveRepeatHigh,
      confidence: executiveRepeatBand.stage,
      sample: executiveRepeatBand.sample,
    },
    outlook: {
      low: executiveOutlookLow,
      high: executiveOutlookHigh,
      confidence: executiveForecastConfidence,
      evidenceSample: executiveForecastEvidenceSample,
    },
    loadRows: executiveLoadRows,
    risks: executiveRiskRows,
    scenarios: {
      noMoreWork: executiveConfirmed30Value,
      warmMid:
        executiveConfirmed30Value +
        Math.round((executiveWarmQuoteLow + executiveWarmQuoteHigh) / 2),
      fullMid:
        executiveConfirmed30Value +
        Math.round(
          (executiveWarmQuoteLow +
            executiveWarmQuoteHigh +
            executiveRepeatLow +
            executiveRepeatHigh) /
            2
        ),
    },
    weeklyReview: {
      completedJobs: executiveCompletedLast7.length,
      completedValue: executiveCompletedLast7Value,
      quoteOutcomes: executiveQuoteOutcomesLast7.length,
      quoteWins: executiveQuoteWinsLast7,
      reviews: executiveReviewsLast7,
      socialBookings: executiveSocialBookingsLast7,
      memoryChanges:
        businessMemoryLastReviewAt &&
        String(businessMemoryLastReviewAt).slice(0, 10) >= executiveStart7ISO
          ? businessMemoryChanges.length
          : 0,
    },
  };

  const askBusyAboutOutlook = async () => {
    go("talkToBusy");
    return submitBusyCommand({
      text: "How does the business look over the next 7 and 30 days, what is the biggest risk, and what should I focus on today?",
    });
  };

  const releaseCoreHealth = buildReleaseCoreHealth({
    customers,
    replyActions,
    inboxItems,
    diaryConflicts,
    proactiveScheduledMap,
    cloudConflict,
    todayISO: executiveTodayISO,
  });

  const homeCommandCentre = buildHomeCommandCentre({
    executiveBriefing,
    autopilotApprovalItems,
    autopilotNeedsInputItems,
    proactiveNotificationsEnabled,
    proactiveScheduledMap,
    diaryConnection,
    diaryConflicts,
    strongestBusinessMemoryPattern,
    releaseCoreHealth,
  });

  const openReleaseCoreIssue = (issue) => {
    if (!issue) return false;
    if (
      ["booking-date", "overdue-booking", "completed-job-history"].includes(
        issue.kind
      ) &&
      issue.customerId
    ) {
      openSavedReplyAction(issue.customerId);
      return true;
    }
    if (issue.kind === "duplicate-customer" && issue.customerId) {
      openCustomer(issue.customerId);
      return true;
    }
    if (issue.kind === "diary-conflict") {
      go("proactiveBusyCentre");
      return true;
    }
    if (issue.kind === "orphan-inbox") {
      openBusyInbox();
      return true;
    }
    if (issue.kind === "cloud-conflict") {
      go("businessData");
      return true;
    }
    if (issue.kind === "stale-notifications") {
      go("proactiveBusyCentre");
      return true;
    }
    go("releaseCore");
    return true;
  };

  const productionBridgeRuntime = {
    easProjectId:
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId ||
      "",
    expoGoPreview: !!Constants?.expoGoConfig,
    scheme:
      typeof Constants?.expoConfig?.scheme === "string"
        ? Constants.expoConfig.scheme
        : Array.isArray(Constants?.expoConfig?.scheme)
        ? Constants.expoConfig.scheme[0] || ""
        : "",
    iosBundleIdentifier:
      Constants?.expoConfig?.ios?.bundleIdentifier || "",
    androidPackage:
      Constants?.expoConfig?.android?.package || "",
    easProfilesConfigured:
      Constants?.expoConfig?.extra?.productionBridge?.easProfilesConfigured ===
      true,
    googleCalendarSyncFunction:
      Constants?.expoConfig?.extra?.productionBridge?.googleCalendarSyncFunction ===
      true,
    productionWatchFunction:
      Constants?.expoConfig?.extra?.productionBridge?.productionWatchFunction ===
      true,
  };

  const productionReadiness = buildProductionReadiness({
    releaseCoreHealth,
    cloudInitialised,
    ownerSignedIn: !!ownerSession?.accessToken,
    easProjectId: productionBridgeRuntime.easProjectId,
    expoGoPreview: productionBridgeRuntime.expoGoPreview,
    scheme: productionBridgeRuntime.scheme,
    iosBundleIdentifier: productionBridgeRuntime.iosBundleIdentifier,
    androidPackage: productionBridgeRuntime.androidPackage,
    remotePushStatus,
    calendarOAuthStatus,
    googleCalendarSyncStatus,
    productionWatchStatus,
    easProfilesConfigured: productionBridgeRuntime.easProfilesConfigured,
  });

  const operationalContinuity = buildOperationalContinuity({
    releaseCoreHealth,
    cloudSyncStatus,
    cloudSyncError,
    cloudConflict,
    socialPublishingError,
    connectedAccounts,
    diaryConnection,
    diarySyncStatus,
    diaryConflicts,
    calendarOAuthStatus,
    googleCalendarSyncStatus,
    googleCalendarConflicts,
    remotePushStatus,
    productionReadiness,
  });

  const dailyCommandCentre = buildDailyCommandCentre({
    todayISO: executiveTodayISO,
    executiveBriefing,
    workCalendarIntelligence,
    operationalContinuity,
    releaseCoreHealth,
    autopilotApprovalItems,
    autopilotNeedsInputItems,
    inboxNeedsAttentionItems,
    dueReminderEntries,
    dueQuoteEntries,
    staleEnquiryEntries,
    activeWorkGoal,
    workGoalRemainingJobs,
    workGoalFilled,
    businessMemoryChanges,
    proactiveNotices,
    miniAppUnreadRequests: miniAppsView?.unreadRequests || [],
    previousCheckpoint: dailyCommandCheckpoint,
  });

  const markDailyCommandReviewed = () => {
    setDailyCommandCheckpoint({
      ...(dailyCommandCentre.currentSnapshot || {}),
      reviewedAt: new Date().toISOString(),
    });
    return true;
  };

  const openDailyCommandItem = (item) => {
    const action = item?.action || {};
    if (action.kind === "route" && action.route) {
      go(action.route);
      return true;
    }
    if (action.kind === "calendar-day" && action.date) {
      setOperatorCalendarDate(action.date);
      jump("workCalendar", "Work");
      return true;
    }
    if (action.kind === "customer-action" && action.customerId) {
      openSavedReplyAction(action.customerId);
      return true;
    }
    if (action.kind === "open-inbox") {
      openBusyInbox();
      return true;
    }
    if (action.kind === "mini-app-request" && action.requestId) {
      openOwnerMiniAppRequest(action.requestId);
      return true;
    }
    if (action.kind === "executive-priority") {
      return openExecutivePriority();
    }
    go("dailyCommandCentre");
    return false;
  };

  const productionFunctionRequest = async (url, action, payload = {}) => {
    const token = await ownerAccessToken();
    if (!token) throw new Error("Sign in to BUSY before using production integrations.");
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: BUSY_AI_TOKEN,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          businessId: cloudWorkspace?.businessId || "",
          ...payload,
        }),
      },
      25000
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(
        data?.error || data?.message || `Production service returned ${response.status}.`
      );
      error.status = response.status;
      error.payload = data;
      throw error;
    }
    return data;
  };

  const refreshRemotePushStatus = async () => {
    if (!ownerSession?.accessToken || !ownerSession?.userId) {
      setRemotePushStatus((current) => ({
        ...current,
        state: "signed_out",
        deviceCount: 0,
        message: "Sign in before registering a production push device.",
      }));
      return null;
    }
    try {
      const token = await ownerAccessToken();
      const rows = await busyDataRequest(
        `busy_push_devices?user_id=eq.${encodeURIComponent(
          ownerSession.userId
        )}&active=eq.true&select=expo_push_token,platform,app_version,last_seen_at,business_id`,
        { token }
      );
      const devices = Array.isArray(rows) ? rows : [];
      setRemotePushStatus((current) => ({
        ...current,
        deviceCount: devices.length,
        state:
          current.token &&
          devices.some((item) => item.expo_push_token === current.token)
            ? "registered"
            : current.state === "registered"
            ? "registered"
            : "not_registered",
        message: devices.length
          ? `${devices.length} active push device${devices.length === 1 ? "" : "s"} registered for this owner.`
          : "No active production push device is registered yet.",
      }));
      return devices;
    } catch (error) {
      setRemotePushStatus((current) => ({
        ...current,
        state: "error",
        message: error?.message || "Push-device registry could not be checked.",
      }));
      return null;
    }
  };

  const registerRemotePushDevice = async () => {
    if (productionBridgeRuntime.expoGoPreview) {
      setRemotePushStatus((current) => ({
        ...current,
        state: "needs_development_build",
        message:
          "Remote push registration is intentionally tested in the native development build, not Expo Go.",
      }));
      return false;
    }
    if (!productionBridgeRuntime.easProjectId) {
      setRemotePushStatus((current) => ({
        ...current,
        state: "needs_eas_project",
        message: "Link the app to an EAS project before requesting an Expo push token.",
      }));
      return false;
    }
    if (!ownerSession?.accessToken || !ownerSession?.userId) {
      setRemotePushStatus((current) => ({
        ...current,
        state: "signed_out",
        message: "Sign in before registering this device.",
      }));
      return false;
    }

    setRemotePushAction("register");
    try {
      const existingPermission = await Notifications.getPermissionsAsync();
      let permission = existingPermission?.status || "undetermined";
      if (permission !== "granted") {
        const requested = await Notifications.requestPermissionsAsync();
        permission = requested?.status || "denied";
      }
      if (permission !== "granted") {
        throw new Error("Notification permission was not granted.");
      }

      const expoToken = (
        await Notifications.getExpoPushTokenAsync({
          projectId: productionBridgeRuntime.easProjectId,
        })
      )?.data;
      if (!expoToken) throw new Error("Expo did not return a push token.");

      const token = await ownerAccessToken();
      const saved = await busyDataRequest(
        "busy_push_devices?on_conflict=user_id,expo_push_token",
        {
          method: "POST",
          token,
          prefer: "resolution=merge-duplicates,return=representation",
          body: {
            user_id: ownerSession.userId,
            business_id: cloudWorkspace?.businessId || null,
            expo_push_token: expoToken,
            platform:
              Platform.OS === "ios"
                ? "ios"
                : Platform.OS === "android"
                ? "android"
                : "unknown",
            app_version: APP_VERSION,
            device_label: `${Platform.OS} BUSY device`,
            active: true,
            last_seen_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }
      );
      const savedRow = Array.isArray(saved) ? saved[0] : saved;
      setRemotePushStatus({
        state: "registered",
        token: expoToken,
        deviceCount: Math.max(1, Number(remotePushStatus.deviceCount || 0)),
        lastRegisteredAt: savedRow?.last_seen_at || new Date().toISOString(),
        message: "This device is registered for production push notifications.",
      });
      return true;
    } catch (error) {
      setRemotePushStatus((current) => ({
        ...current,
        state: "error",
        message: error?.message || "This device could not be registered for remote push.",
      }));
      return false;
    } finally {
      setRemotePushAction("");
    }
  };

  const deactivateRemotePushDevice = async () => {
    if (!remotePushStatus.token || !ownerSession?.userId) return false;
    setRemotePushAction("deactivate");
    try {
      const token = await ownerAccessToken();
      await busyDataRequest(
        `busy_push_devices?user_id=eq.${encodeURIComponent(
          ownerSession.userId
        )}&expo_push_token=eq.${encodeURIComponent(remotePushStatus.token)}`,
        {
          method: "PATCH",
          token,
          prefer: "return=representation",
          body: {
            active: false,
            updated_at: new Date().toISOString(),
          },
        }
      );
      setRemotePushStatus((current) => ({
        ...current,
        state: "not_registered",
        token: "",
        message: "Remote push is inactive on this device.",
      }));
      return true;
    } catch (error) {
      setRemotePushStatus((current) => ({
        ...current,
        message: error?.message || "BUSY could not deactivate this push device.",
      }));
      return false;
    } finally {
      setRemotePushAction("");
    }
  };

  const sendRemotePushTest = async () => {
    setRemotePushAction("test");
    try {
      const data = await productionFunctionRequest(
        BUSY_PUSH_DISPATCH_URL,
        "test",
        { route: "executive" }
      );
      setRemotePushStatus((current) => ({
        ...current,
        message:
          data?.sent > 0
            ? `Remote test sent to ${data.sent} device${data.sent === 1 ? "" : "s"}.`
            : data?.message || "No active push device was available.",
      }));
      return data;
    } catch (error) {
      setRemotePushStatus((current) => ({
        ...current,
        message: error?.message || "Remote push test failed.",
      }));
      return null;
    } finally {
      setRemotePushAction("");
    }
  };

  const refreshCalendarOAuthStatus = async () => {
    if (!ownerSession?.accessToken || !cloudWorkspace?.businessId) {
      setCalendarOAuthStatus({
        loaded: true,
        configured: false,
        connection: null,
        callbackUrl: "",
        error: "Sign in and initialise the cloud business first.",
      });
      return null;
    }
    try {
      const data = await productionFunctionRequest(
        BUSY_CALENDAR_OAUTH_URL,
        "status"
      );
      setCalendarOAuthStatus({
        loaded: true,
        configured: !!data?.configured,
        connection: data?.connection || null,
        callbackUrl: data?.callbackUrl || "",
        error: data?.error || "",
      });
      return data;
    } catch (error) {
      setCalendarOAuthStatus({
        loaded: true,
        configured: false,
        connection: null,
        callbackUrl: "",
        error: error?.message || "Calendar OAuth status could not be checked.",
      });
      return null;
    }
  };

  const startGoogleCalendarOAuth = async () => {
    if (productionBridgeRuntime.expoGoPreview) {
      Alert.alert(
        "Development build required",
        "The production Google Calendar callback uses the busydoesit:// app scheme, so connect it from the native development build rather than Expo Go."
      );
      return false;
    }
    setProductionBridgeAction("google-calendar");
    try {
      const data = await productionFunctionRequest(
        BUSY_CALENDAR_OAUTH_URL,
        "start"
      );
      if (!data?.url) {
        throw new Error(
          data?.error ||
            "Google Calendar OAuth is not ready on the production backend."
        );
      }
      await Linking.openURL(data.url);
      return true;
    } catch (error) {
      setCalendarOAuthStatus((current) => ({
        ...current,
        loaded: true,
        error: error?.message || "Google Calendar connection could not start.",
      }));
      Alert.alert(
        "Google Calendar not opened",
        error?.message || "BUSY could not start Google Calendar sign-in."
      );
      return false;
    } finally {
      setProductionBridgeAction("");
    }
  };

  const disconnectGoogleCalendarOAuth = async () => {
    setProductionBridgeAction("google-calendar-disconnect");
    try {
      await productionFunctionRequest(
        BUSY_CALENDAR_OAUTH_URL,
        "disconnect"
      );
      await refreshCalendarOAuthStatus();
      return true;
    } catch (error) {
      setCalendarOAuthStatus((current) => ({
        ...current,
        error: error?.message || "Google Calendar could not be disconnected.",
      }));
      return false;
    } finally {
      setProductionBridgeAction("");
    }
  };

  const productionCalendarBookingRows = executiveConfirmedBookings
    .filter(
      (booking) =>
        booking.date >= executiveTodayISO &&
        booking.date <= addDaysFromISO(executiveTodayISO, 90)
    )
    .map((booking) => {
      const time = /^\d{2}:\d{2}$/.test(String(booking.time || ""))
        ? booking.time
        : "09:00";
      const start = new Date(`${booking.date}T${time}:00`);
      const end = new Date(
        start.getTime() +
          Math.max(0.5, Number(booking.durationHours) || 2) * 3600000
      );
      const customer =
        customers.find((item) => item.id === booking.customerId) || {};
      const fingerprint = JSON.stringify([
        booking.date,
        time,
        booking.customerName,
        booking.service,
        Number(booking.value || 0),
        Math.max(0.5, Number(booking.durationHours) || 2),
        customer.address || "",
      ]);
      return {
        ...booking,
        time,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        address: customer.address || "",
        fingerprint,
      };
    });

  const productionCancelledBookingIds = Object.entries(replyActions || {})
    .filter(
      ([, action]) =>
        action?.type === "booking" &&
        action?.done &&
        action?.details?.bookingStatus === "Cancelled"
    )
    .map(([customerId]) => customerId);

  const refreshProductionWatchStatus = async () => {
    if (!ownerSession?.accessToken || !cloudWorkspace?.businessId) return null;
    try {
      const data = await productionFunctionRequest(
        BUSY_PRODUCTION_WATCH_URL,
        "status"
      );
      setProductionWatchStatus({
        configured: !!data?.configured,
        schedule: data?.schedule || "",
        lastDeliveryAt: data?.lastDeliveryAt || "",
        deliveryCount: Number(data?.deliveryCount || 0),
        message: data?.message || "",
      });
      return data;
    } catch (error) {
      setProductionWatchStatus((current) => ({
        ...current,
        configured: false,
        message:
          error?.message ||
          "Production watcher status could not be checked.",
      }));
      return null;
    }
  };

  const syncGoogleCalendarNow = async () => {
    if (calendarOAuthStatus?.connection?.status !== "connected") {
      setGoogleCalendarSyncStatus((current) => ({
        ...current,
        state: "not_connected",
        message:
          "Connect Google Calendar before running server-side booking sync.",
      }));
      return false;
    }

    setProductionBridgeAction("google-sync");
    setGoogleCalendarSyncStatus((current) => ({
      ...current,
      state: "syncing",
      message: "Syncing BUSY bookings with Google Calendar…",
    }));

    try {
      const data = await productionFunctionRequest(
        BUSY_CALENDAR_SYNC_URL,
        "sync",
        {
          bookings: productionCalendarBookingRows,
          cancelledCustomerIds: productionCancelledBookingIds,
          rangeStart: new Date(
            `${executiveTodayISO}T00:00:00`
          ).toISOString(),
          rangeEnd: new Date(
            `${executiveEnd7ISO}T23:59:59`
          ).toISOString(),
        }
      );

      const conflicts = Array.isArray(data?.conflicts)
        ? data.conflicts
        : [];
      const external = Array.isArray(data?.externalEvents)
        ? data.externalEvents
        : [];

      setGoogleCalendarConflicts(conflicts);
      setGoogleCalendarExternalEvents(external);
      setGoogleCalendarSyncStatus({
        state: conflicts.length ? "needs_review" : "synced",
        lastSyncedAt: data?.syncedAt || new Date().toISOString(),
        created: Number(data?.created || 0),
        updated: Number(data?.updated || 0),
        conflictCount: conflicts.length,
        message: conflicts.length
          ? `${conflicts.length} Google Calendar change${conflicts.length === 1 ? "" : "s"} need owner reconciliation.`
          : "BUSY and Google Calendar agree on the mapped bookings.",
      });

      return true;
    } catch (error) {
      setGoogleCalendarSyncStatus((current) => ({
        ...current,
        state: "error",
        message:
          error?.message || "Google Calendar sync failed.",
      }));
      return false;
    } finally {
      setProductionBridgeAction("");
    }
  };

  const googleCalendarConflictBooking = (conflict) =>
    productionCalendarBookingRows.find(
      (item) => item.customerId === conflict?.customerId
    ) || null;

  const keepBusyGoogleCalendarTime = async (conflict) => {
    const booking = googleCalendarConflictBooking(conflict);
    if (!booking) return false;

    setProductionBridgeAction(
      `google-keep-${conflict.customerId}`
    );

    try {
      await productionFunctionRequest(
        BUSY_CALENDAR_SYNC_URL,
        "resolve",
        {
          direction: "keep_busy",
          customerId: conflict.customerId,
          booking,
        }
      );

      setGoogleCalendarConflicts((current) =>
        current.filter(
          (item) => item.customerId !== conflict.customerId
        )
      );

      setGoogleCalendarSyncStatus((current) => {
        const remaining = Math.max(
          0,
          Number(current.conflictCount || 0) - 1
        );
        return {
          ...current,
          state: remaining ? "needs_review" : "synced",
          conflictCount: remaining,
          lastSyncedAt: new Date().toISOString(),
          message:
            "BUSY booking time was kept and written back to Google Calendar.",
        };
      });

      return true;
    } catch (error) {
      setGoogleCalendarSyncStatus((current) => ({
        ...current,
        message:
          error?.message ||
          "BUSY could not write its booking time back to Google.",
      }));
      return false;
    } finally {
      setProductionBridgeAction("");
    }
  };

  const useGoogleCalendarTime = async (conflict) => {
    if (!conflict?.customerId || !conflict?.googleStartAt) {
      return false;
    }

    const start = new Date(conflict.googleStartAt);
    const end = new Date(
      conflict.googleEndAt || conflict.googleStartAt
    );

    if (Number.isNaN(start.getTime())) return false;

    const nextDate = dateToISO(start);
    const nextTime = `${String(start.getHours()).padStart(
      2,
      "0"
    )}:${String(start.getMinutes()).padStart(2, "0")}`;

    const currentBooking =
      googleCalendarConflictBooking(conflict);

    if (!currentBooking) return false;

    const durationHours = Math.max(
      0.5,
      Number.isNaN(end.getTime())
        ? Number(currentBooking.durationHours) || 2
        : Math.round(
            ((end.getTime() - start.getTime()) / 3600000) * 10
          ) / 10
    );

    const resolvedBooking = {
      ...currentBooking,
      date: nextDate,
      time: nextTime,
      startAt: start.toISOString(),
      endAt: new Date(
        start.getTime() + durationHours * 3600000
      ).toISOString(),
      durationHours,
      fingerprint: JSON.stringify([
        nextDate,
        nextTime,
        currentBooking.customerName,
        currentBooking.service,
        Number(currentBooking.value || 0),
        durationHours,
        currentBooking.address || "",
      ]),
    };

    setProductionBridgeAction(
      `google-use-${conflict.customerId}`
    );

    try {
      await productionFunctionRequest(
        BUSY_CALENDAR_SYNC_URL,
        "resolve",
        {
          direction: "use_google",
          customerId: conflict.customerId,
          booking: resolvedBooking,
        }
      );

      setReplyActions((current) => {
        const action = current[conflict.customerId];
        if (!action || action.type !== "booking") return current;

        return {
          ...current,
          [conflict.customerId]: {
            ...action,
            details: {
              ...(action.details || {}),
              bookingDate: nextDate,
              bookingTime: nextTime,
              diaryReconciledAt: new Date().toISOString(),
              diaryReconciledFrom: "google_calendar",
            },
          },
        };
      });

      appendCustomerActivity(conflict.customerId, {
        kind: "booking",
        title:
          "Booking time reconciled from Google Calendar",
        note: `Owner explicitly accepted the Google Calendar time: ${formatUKDate(
          nextDate
        )} at ${nextTime}.`,
      });

      setGoogleCalendarConflicts((current) =>
        current.filter(
          (item) => item.customerId !== conflict.customerId
        )
      );

      setGoogleCalendarSyncStatus((current) => {
        const remaining = Math.max(
          0,
          Number(current.conflictCount || 0) - 1
        );
        return {
          ...current,
          state: remaining ? "needs_review" : "synced",
          conflictCount: remaining,
          lastSyncedAt: new Date().toISOString(),
          message:
            "Google Calendar time was explicitly accepted into BUSY.",
        };
      });

      return true;
    } catch (error) {
      setGoogleCalendarSyncStatus((current) => ({
        ...current,
        message:
          error?.message ||
          "BUSY could not accept the Google Calendar time.",
      }));
      return false;
    } finally {
      setProductionBridgeAction("");
    }
  };

  const refreshProductionBridge = async () => {
    setProductionBridgeAction("refresh");
    try {
      await Promise.all([
        refreshRemotePushStatus(),
        refreshCalendarOAuthStatus(),
        refreshProductionWatchStatus(),
      ]);
      return true;
    } finally {
      setProductionBridgeAction("");
    }
  };

  useEffect(() => {
    if (!hydrated || !ownerSession?.accessToken || !cloudInitialised) return;
    const timer = setTimeout(() => {
      refreshProductionBridge();
    }, 650);
    return () => clearTimeout(timer);
  }, [
    hydrated,
    ownerSession?.accessToken,
    cloudInitialised,
    cloudWorkspace?.businessId,
  ]);

  useEffect(() => {
    const handleProductionLink = ({ url }) => {
      if (!String(url || "").startsWith("busydoesit://oauth/google-calendar")) {
        return;
      }
      refreshCalendarOAuthStatus();
      setGoogleCalendarSyncStatus((current) => ({
        ...current,
        state: "not_synced",
        message:
          "Google Calendar connected. Run the first booking sync when ready.",
      }));
      go("productionBridge");
    };
    const subscription = Linking.addEventListener("url", handleProductionLink);
    Linking.getInitialURL()
      .then((url) => {
        if (
          url &&
          String(url).startsWith("busydoesit://oauth/google-calendar")
        ) {
          handleProductionLink({ url });
        }
      })
      .catch(() => {});
    return () => subscription?.remove?.();
  }, [ownerSession?.accessToken, cloudWorkspace?.businessId]);

  const proactiveParseClock = (value, fallbackHour = 8, fallbackMinute = 0) => {
    const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return { hour: fallbackHour, minute: fallbackMinute };
    const hour = Math.max(0, Math.min(23, Number(match[1]) || 0));
    const minute = Math.max(0, Math.min(59, Number(match[2]) || 0));
    return { hour, minute };
  };

  const proactiveMoveOutsideQuietHours = (inputDate) => {
    const date = new Date(inputDate);
    if (!proactiveQuietHoursEnabled) return date;
    const start = proactiveParseClock(proactiveQuietStart, 20, 0);
    const end = proactiveParseClock(proactiveQuietEnd, 7, 0);
    const minuteOfDay = date.getHours() * 60 + date.getMinutes();
    const startMinute = start.hour * 60 + start.minute;
    const endMinute = end.hour * 60 + end.minute;
    const overnight = startMinute >= endMinute;
    const isQuiet = overnight
      ? minuteOfDay >= startMinute || minuteOfDay < endMinute
      : minuteOfDay >= startMinute && minuteOfDay < endMinute;
    if (!isQuiet) return date;
    const moved = new Date(date);
    if (overnight && minuteOfDay >= startMinute) moved.setDate(moved.getDate() + 1);
    moved.setHours(end.hour, end.minute, 0, 0);
    return moved;
  };

  const proactiveBookingDate = (booking) => {
    const time = /^\d{2}:\d{2}$/.test(String(booking?.time || ""))
      ? booking.time
      : "09:00";
    const date = new Date(`${booking.date}T${time}:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const proactiveNextMorning = () => {
    const clock = proactiveParseClock(proactiveMorningTime, 8, 0);
    const date = new Date();
    date.setHours(clock.hour, clock.minute, 0, 0);
    if (date.getTime() <= Date.now() + 60 * 1000) date.setDate(date.getDate() + 1);
    return proactiveMoveOutsideQuietHours(date);
  };

  const proactiveNotificationCandidates = (() => {
    if (!proactiveNotificationsEnabled) return [];
    const candidates = [];
    const morning = proactiveNextMorning();
    candidates.push({
      key: `morning-${dateToISO(morning)}`,
      title: "BUSY morning briefing",
      body: `${executiveBriefing.confirmed7.count} job${executiveBriefing.confirmed7.count === 1 ? "" : "s"} confirmed in the next 7 days • £${executiveBriefing.confirmed7.value} booked • ${executiveBriefing.risks.length} risk signal${executiveBriefing.risks.length === 1 ? "" : "s"}.`,
      triggerAt: morning.toISOString(),
      priority: 100,
      data: { route: "executive", kind: "morning" },
    });

    executiveBookings7.slice(0, 4).forEach((booking) => {
      const start = proactiveBookingDate(booking);
      if (!start) return;
      const reminder = new Date(
        start.getTime() - Math.max(15, Number(proactiveJobReminderMinutes) || 60) * 60 * 1000
      );
      if (reminder.getTime() > Date.now() + 30 * 1000) {
        candidates.push({
          key: `booking-${booking.customerId}-${booking.date}-${booking.time}`,
          title: `${booking.customerName} • job coming up`,
          body: `${booking.service} starts at ${booking.time || "time not set"}${booking.value ? ` • £${booking.value} recorded value` : ""}.`,
          triggerAt: proactiveMoveOutsideQuietHours(reminder).toISOString(),
          priority: 95,
          data: {
            route: "booking",
            kind: "booking-reminder",
            customerId: booking.customerId,
          },
        });
      }
      const postJob = new Date(
        start.getTime() + (Number(booking.durationHours) || 2) * 60 * 60 * 1000 + 15 * 60 * 1000
      );
      if (postJob.getTime() > Date.now() + 30 * 1000) {
        candidates.push({
          key: `post-job-${booking.customerId}-${booking.date}`,
          title: `${booking.customerName}'s job should be finished`,
          body: "Tell BUSY what happened: complete it, move it or cancel it so the diary and Business Memory stay trustworthy.",
          triggerAt: proactiveMoveOutsideQuietHours(postJob).toISOString(),
          priority: 90,
          data: {
            route: "booking",
            kind: "post-job",
            customerId: booking.customerId,
          },
        });
      }
    });

    if (executivePriority.kind !== "clear" && executivePriority.kind !== "booking-outcome") {
      const source = executivePriority.source || {};
      const key = `priority-${executivePriority.kind}-${source.id || source.customerId || executiveTodayISO}`;
      const existingTrigger = proactiveScheduledMap?.[key]?.triggerAt;
      const soon =
        existingTrigger && new Date(existingTrigger).getTime() > Date.now() + 20 * 1000
          ? new Date(existingTrigger)
          : proactiveMoveOutsideQuietHours(new Date(Date.now() + 3 * 60 * 1000));
      candidates.push({
        key,
        title: executivePriority.title,
        body: executivePriority.body,
        triggerAt: soon.toISOString(),
        priority: 85,
        data: {
          route:
            executivePriority.kind === "inbox"
              ? "inbox"
              : executivePriority.kind === "quote"
              ? "quote"
              : executivePriority.kind === "enquiry"
              ? "customer"
              : executivePriority.kind === "approval"
              ? "approval"
              : "executive",
          kind: executivePriority.kind,
          customerId:
            source.customerId ||
            source.customer?.id ||
            source.id ||
            "",
          sourceId: executivePriority.kind === "inbox" ? source.id || "" : "",
        },
      });
    }

    if (
      autopilotApprovalItems.length &&
      executivePriority.kind !== "approval"
    ) {
      const approvalKey = `approval-summary-${autopilotApprovalItems
        .slice(0, 4)
        .map((item) => item.id)
        .join("-")}`;
      const existingApprovalTrigger =
        proactiveScheduledMap?.[approvalKey]?.triggerAt;
      const approvalTime =
        existingApprovalTrigger &&
        new Date(existingApprovalTrigger).getTime() > Date.now() + 20 * 1000
          ? new Date(existingApprovalTrigger)
          : proactiveMoveOutsideQuietHours(
              new Date(Date.now() + 6 * 60 * 1000)
            );
      candidates.push({
        key: approvalKey,
        title: "BUSY has work ready for approval",
        body: `${autopilotApprovalItems.length} prepared item${autopilotApprovalItems.length === 1 ? "" : "s"} are waiting. Nothing has been sent or published.`,
        triggerAt: approvalTime.toISOString(),
        priority: 70,
        data: { route: "approval", kind: "approval-summary" },
      });
    }

    return candidates
      .filter((item) => new Date(item.triggerAt).getTime() > Date.now() + 20 * 1000)
      .sort((a, b) => b.priority - a.priority || String(a.triggerAt).localeCompare(String(b.triggerAt)))
      .slice(0, 10);
  })();

  const proactiveScheduleSignature = JSON.stringify({
    enabled: proactiveNotificationsEnabled,
    permission: proactiveNotificationPermission,
    morning: proactiveMorningTime,
    quiet: [proactiveQuietHoursEnabled, proactiveQuietStart, proactiveQuietEnd],
    lead: proactiveJobReminderMinutes,
    candidates: proactiveNotificationCandidates.map((item) => [
      item.key,
      item.triggerAt,
      item.title,
      item.body,
    ]),
  });

  const appendProactiveNotificationLog = (entry) => {
    setProactiveNotificationLog((current) => [
      {
        id: `notification-log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        at: new Date().toISOString(),
        ...entry,
      },
      ...current,
    ].slice(0, 40));
  };

  const enableProactiveNotifications = async () => {
    try {
      if (Platform.OS === "android" && Notifications.setNotificationChannelAsync) {
        await Notifications.setNotificationChannelAsync("busy-priority", {
          name: "BUSY priorities",
          importance: Notifications.AndroidImportance?.DEFAULT ?? 3,
        });
      }
      const existing = await Notifications.getPermissionsAsync();
      let status = existing?.status || "undetermined";
      if (status !== "granted") {
        const requested = await Notifications.requestPermissionsAsync();
        status = requested?.status || "denied";
      }
      setProactiveNotificationPermission(status);
      const enabled = status === "granted";
      setProactiveNotificationsEnabled(enabled);
      appendProactiveNotificationLog({
        kind: enabled ? "permission-granted" : "permission-denied",
        title: enabled ? "Proactive notifications enabled" : "Notification permission not granted",
      });
      return enabled;
    } catch (error) {
      setProactiveNotificationPermission("unavailable");
      setProactiveNotificationsEnabled(false);
      Alert.alert(
        "Notifications unavailable",
        error?.message || "This preview could not enable local notifications."
      );
      return false;
    }
  };

  const disableProactiveNotifications = async () => {
    for (const item of Object.values(proactiveScheduledMap || {})) {
      if (item?.nativeId) {
        await Notifications.cancelScheduledNotificationAsync(item.nativeId).catch(() => {});
      }
    }
    setProactiveScheduledMap({});
    setProactiveNotificationsEnabled(false);
    appendProactiveNotificationLog({
      kind: "disabled",
      title: "Proactive notification scheduling turned off",
    });
  };

  const refreshProactiveNotifications = async ({ force = false } = {}) => {
    if (
      !proactiveNotificationsEnabled ||
      proactiveNotificationPermission !== "granted"
    ) return false;
    try {
      const currentMap = proactiveScheduledMap || {};
      const desiredByKey = Object.fromEntries(
        proactiveNotificationCandidates.map((item) => [item.key, item])
      );
      const nextMap = {};

      for (const [key, existing] of Object.entries(currentMap)) {
        const desired = desiredByKey[key];
        const same =
          desired &&
          existing?.fingerprint ===
            JSON.stringify([desired.triggerAt, desired.title, desired.body]);
        if (same && !force) {
          nextMap[key] = existing;
        } else if (existing?.nativeId) {
          await Notifications.cancelScheduledNotificationAsync(existing.nativeId).catch(() => {});
        }
      }

      for (const candidate of proactiveNotificationCandidates) {
        if (nextMap[candidate.key]) continue;
        const triggerDate = new Date(candidate.triggerAt);
        if (triggerDate.getTime() <= Date.now() + 20 * 1000) continue;
        const nativeId = await Notifications.scheduleNotificationAsync({
          content: {
            title: candidate.title,
            body: candidate.body,
            data: {
              ...candidate.data,
              busyNotificationKey: candidate.key,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
            channelId: Platform.OS === "android" ? "busy-priority" : undefined,
          },
        });
        nextMap[candidate.key] = {
          nativeId,
          triggerAt: candidate.triggerAt,
          title: candidate.title,
          body: candidate.body,
          data: candidate.data,
          fingerprint: JSON.stringify([
            candidate.triggerAt,
            candidate.title,
            candidate.body,
          ]),
        };
      }

      const changed =
        force ||
        JSON.stringify(Object.keys(nextMap).sort()) !==
          JSON.stringify(Object.keys(currentMap).sort()) ||
        Object.keys(nextMap).some(
          (key) => nextMap[key]?.fingerprint !== currentMap[key]?.fingerprint
        );
      setProactiveScheduledMap(nextMap);
      if (changed) {
        appendProactiveNotificationLog({
          kind: "refresh",
          title: `${Object.keys(nextMap).length} proactive reminder${Object.keys(nextMap).length === 1 ? "" : "s"} scheduled`,
        });
      }
      return true;
    } catch (error) {
      appendProactiveNotificationLog({
        kind: "error",
        title: "Notification refresh failed",
        detail: error?.message || "Unknown notification error",
      });
      return false;
    }
  };

  const testProactiveNotification = async () => {
    if (!proactiveNotificationsEnabled) {
      const enabled = await enableProactiveNotifications();
      if (!enabled) return false;
    }
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "BUSY test reminder",
          body: "Notifications are working. Tap this to open the Executive Briefing.",
          data: { route: "executive", kind: "test" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 10,
          channelId: Platform.OS === "android" ? "busy-priority" : undefined,
        },
      });
      appendProactiveNotificationLog({
        kind: "test",
        title: "Test notification scheduled for 10 seconds",
      });
      return true;
    } catch (error) {
      Alert.alert(
        "Could not schedule test",
        error?.message || "Local notification scheduling failed."
      );
      return false;
    }
  };

  const remindProactiveItemLater = async (item, minutes = 60) => {
    if (!item) return false;
    if (!proactiveNotificationsEnabled) {
      const enabled = await enableProactiveNotifications();
      if (!enabled) return false;
    }
    const triggerDate = proactiveMoveOutsideQuietHours(
      new Date(Date.now() + Math.max(1, Number(minutes) || 60) * 60 * 1000)
    );
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: item.title || "BUSY reminder",
          body: item.body || "This needs another look.",
          data: {
            ...(item.data || {}),
            route: item.data?.route || "executive",
            kind: "manual-snooze",
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: Platform.OS === "android" ? "busy-priority" : undefined,
        },
      });
      appendProactiveNotificationLog({
        kind: "manual-snooze",
        title: `Reminder moved to ${triggerDate.toLocaleString("en-GB")}`,
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    if (!hydrated || !proactiveNotificationsEnabled) return;
    const timer = setTimeout(() => {
      refreshProactiveNotifications();
    }, 500);
    return () => clearTimeout(timer);
  }, [
    hydrated,
    proactiveNotificationsEnabled,
    proactiveNotificationPermission,
    proactiveScheduleSignature,
  ]);

  const handleProactiveNotificationRoute = async (data = {}) => {
    const route = String(data?.route || "");
    if (route === "mini_app_request" && data.requestId) {
      if (String(data?.role || "") === "customer") {
        await openCustomerMiniAppRequest(String(data.requestId));
      } else {
        await openOwnerMiniAppRequest(String(data.requestId));
      }
      return true;
    }
    if (route === "booking" && data.customerId) {
      openSavedReplyAction(data.customerId);
      return true;
    }
    if (route === "quote" && data.customerId) {
      prepareQuoteFollowUp(data.customerId);
      return true;
    }
    if (route === "customer" && data.customerId) {
      openCustomer(data.customerId);
      return true;
    }
    if (route === "inbox" && data.sourceId) {
      openInboxItem(data.sourceId);
      return true;
    }
    if (route === "approval") {
      go("autopilotCentre");
      return true;
    }
    go("executiveBriefing");
    return true;
  };

  useEffect(() => {
    if (!hydrated) return;
    const handleResponse = async (response) => {
      const notification = response?.notification;
      const identifier = notification?.request?.identifier || "";
      if (identifier && notificationHandledRef.current === identifier) return;
      if (identifier) notificationHandledRef.current = identifier;
      const data = notification?.request?.content?.data || {};
      await handleProactiveNotificationRoute(data);
      appendProactiveNotificationLog({
        kind: "opened",
        title: notification?.request?.content?.title || "Notification opened",
      });
      await Notifications.clearLastNotificationResponseAsync?.().catch(() => {});
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleResponse
    );
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) handleResponse(response);
      })
      .catch(() => {});

    return () => subscription?.remove?.();
  }, [hydrated]);

  const diaryBookingFingerprint = (booking) =>
    JSON.stringify([
      booking.date,
      booking.time || "",
      booking.customerName,
      booking.service,
      Number(booking.value || 0),
    ]);

  const diaryDateParts = (date) => ({
    date: dateToISO(date),
    time: `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`,
  });

  const diaryEventDetails = (booking) => {
    const startDate = proactiveBookingDate(booking);
    if (!startDate) return null;
    const endDate = new Date(
      startDate.getTime() + (Number(booking.durationHours) || 2) * 60 * 60 * 1000
    );
    const customer =
      customers.find((item) => item.id === booking.customerId) || null;
    return {
      title: `${booking.customerName} • ${booking.service}`,
      startDate,
      endDate,
      location: customer?.address || "",
      notes: `[BUSY DOES IT]\nCustomer: ${booking.customerName}\nService: ${booking.service}${booking.value ? `\nRecorded value: £${booking.value}` : ""}`,
      timeZone: "Europe/London",
    };
  };

  const loadDeviceCalendars = async () => {
    try {
      setDiarySyncStatus("connecting");
      const available = await Calendar.isAvailableAsync();
      if (!available) throw new Error("Calendar access is unavailable on this device.");
      const permission = await Calendar.requestCalendarPermissionsAsync();
      if (permission?.status !== "granted") {
        setDiarySyncStatus("permission-denied");
        return false;
      }
      const rows = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const writable = (Array.isArray(rows) ? rows : [])
        .filter((calendar) => calendar?.allowsModifications !== false)
        .map((calendar) => ({
          id: calendar.id,
          title: calendar.title || calendar.name || "Calendar",
          source:
            calendar.source?.name ||
            calendar.source?.type ||
            calendar.ownerAccount ||
            "Device calendar",
          color: calendar.color || "",
          isPrimary: !!calendar.isPrimary,
        }))
        .sort((a, b) =>
          Number(b.isPrimary) - Number(a.isPrimary) ||
          String(a.title).localeCompare(String(b.title))
        );
      setDiaryCalendars(writable);
      setDiarySyncStatus(writable.length ? "choose-calendar" : "no-calendar");
      return writable;
    } catch (error) {
      setDiarySyncStatus("unavailable");
      Alert.alert(
        "Calendar connection unavailable",
        error?.message ||
          "This preview could not access the device calendar."
      );
      return false;
    }
  };

  const selectDiaryCalendar = (calendar) => {
    if (!calendar?.id) return;
    setDiaryConnection({
      status: "connected",
      calendarId: calendar.id,
      title: calendar.title || "Calendar",
      source: calendar.source || "Device calendar",
      lastSyncAt: diaryConnection.lastSyncAt || "",
    });
    setDiaryConflicts([]);
    setDiarySyncStatus("connected");
  };

  const disconnectDiary = () => {
    setDiaryConnection({
      status: "disconnected",
      calendarId: "",
      title: "",
      source: "",
      lastSyncAt: "",
    });
    setDiaryCalendars([]);
    setDiaryExternalEvents([]);
    setDiaryConflicts([]);
    setDiarySyncStatus("idle");
  };

  const syncDiaryNow = async () => {
    if (!diaryConnection.calendarId) return false;
    setDiarySyncStatus("syncing");
    try {
      const calendarId = diaryConnection.calendarId;
      const conflicts = [];
      const nextMap = { ...(diaryEventMap || {}) };
      const activeBookings = executiveConfirmedBookings.filter(
        (booking) =>
          booking.date >= executiveTodayISO &&
          booking.date <= addDaysFromISO(executiveTodayISO, 90)
      );

      for (const booking of activeBookings) {
        const details = diaryEventDetails(booking);
        if (!details) continue;
        const key = booking.customerId;
        const fingerprint = diaryBookingFingerprint(booking);
        const mapped = nextMap[key];

        if (mapped?.eventId) {
          let existingEvent = null;
          try {
            existingEvent = await Calendar.getEventAsync(mapped.eventId);
          } catch (e) {
            existingEvent = null;
          }
          if (existingEvent) {
            const actualStart = new Date(existingEvent.startDate);
            const mappedStart = mapped.lastStartDate
              ? new Date(mapped.lastStartDate)
              : null;
            const calendarMoved =
              mappedStart &&
              !Number.isNaN(actualStart.getTime()) &&
              !Number.isNaN(mappedStart.getTime()) &&
              Math.abs(actualStart.getTime() - mappedStart.getTime()) > 60 * 1000;
            const busyChanged = mapped.fingerprint !== fingerprint;

            if (calendarMoved) {
              const parts = diaryDateParts(actualStart);
              conflicts.push({
                id: `diary-conflict-${key}`,
                customerId: key,
                customerName: booking.customerName,
                service: booking.service,
                eventId: mapped.eventId,
                calendarDate: parts.date,
                calendarTime: parts.time,
                busyDate: booking.date,
                busyTime: booking.time || "",
                booking,
              });
              continue;
            }

            if (busyChanged) {
              await Calendar.updateEventAsync(mapped.eventId, details);
              nextMap[key] = {
                ...mapped,
                fingerprint,
                lastStartDate: details.startDate.toISOString(),
                updatedAt: new Date().toISOString(),
              };
            }
            continue;
          }
        }

        const eventId = await Calendar.createEventAsync(calendarId, details);
        nextMap[key] = {
          eventId,
          fingerprint,
          lastStartDate: details.startDate.toISOString(),
          createdAt: new Date().toISOString(),
        };
      }

      for (const [customerId, mapped] of Object.entries(nextMap)) {
        const action = replyActions?.[customerId];
        if (
          mapped?.eventId &&
          action?.type === "booking" &&
          action?.details?.bookingStatus === "Cancelled"
        ) {
          await Calendar.deleteEventAsync(mapped.eventId).catch(() => {});
          delete nextMap[customerId];
        }
      }

      const rangeStart = new Date(`${executiveTodayISO}T00:00:00`);
      const rangeEnd = new Date(`${executiveEnd7ISO}T23:59:59`);
      const calendarEvents = await Calendar.getEventsAsync(
        [calendarId],
        rangeStart,
        rangeEnd
      );
      const busyEventIds = new Set(
        Object.values(nextMap).map((item) => item?.eventId).filter(Boolean)
      );
      const externalRows = (Array.isArray(calendarEvents) ? calendarEvents : [])
        .filter(
          (event) =>
            !busyEventIds.has(event.id) &&
            !String(event.notes || "").includes("[BUSY DOES IT]")
        )
        .map((event) => {
          const start = new Date(event.startDate);
          const end = new Date(event.endDate);
          return {
            id: event.id,
            title: event.title || "Calendar commitment",
            date: Number.isNaN(start.getTime()) ? "" : dateToISO(start),
            time: Number.isNaN(start.getTime())
              ? ""
              : `${String(start.getHours()).padStart(2, "0")}:${String(
                  start.getMinutes()
                ).padStart(2, "0")}`,
            durationHours:
              Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
                ? 0
                : Math.max(
                    0,
                    Math.round(((end.getTime() - start.getTime()) / 3600000) * 10) /
                      10
                  ),
          };
        });

      const syncedAt = new Date().toISOString();
      setDiaryEventMap(nextMap);
      setDiaryExternalEvents(externalRows);
      setDiaryConflicts(conflicts);
      setDiaryConnection((current) => ({
        ...current,
        status: "connected",
        lastSyncAt: syncedAt,
      }));
      setDiarySyncStatus(conflicts.length ? "needs-review" : "synced");
      appendProactiveNotificationLog({
        kind: "calendar-sync",
        title: `Diary synced • ${activeBookings.length} BUSY booking${activeBookings.length === 1 ? "" : "s"} • ${externalRows.length} external commitment${externalRows.length === 1 ? "" : "s"}`,
      });
      return true;
    } catch (error) {
      setDiarySyncStatus("error");
      Alert.alert(
        "Diary sync failed",
        error?.message || "BUSY could not sync the selected device calendar."
      );
      return false;
    }
  };

  const keepBusyDiaryTime = async (conflict) => {
    if (!conflict?.eventId || !conflict?.booking) return false;
    const details = diaryEventDetails(conflict.booking);
    if (!details) return false;
    await Calendar.updateEventAsync(conflict.eventId, details);
    setDiaryEventMap((current) => ({
      ...current,
      [conflict.customerId]: {
        ...(current[conflict.customerId] || {}),
        eventId: conflict.eventId,
        fingerprint: diaryBookingFingerprint(conflict.booking),
        lastStartDate: details.startDate.toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }));
    setDiaryConflicts((current) =>
      current.filter((item) => item.id !== conflict.id)
    );
    return true;
  };

  const useCalendarDiaryTime = (conflict) => {
    if (!conflict?.customerId || !conflict.calendarDate) return false;
    setReplyActions((current) => {
      const action = current[conflict.customerId];
      if (!action || action.type !== "booking") return current;
      return {
        ...current,
        [conflict.customerId]: {
          ...action,
          details: {
            ...(action.details || {}),
            bookingDate: conflict.calendarDate,
            bookingTime: conflict.calendarTime || action.details?.bookingTime || "",
            diaryReconciledAt: new Date().toISOString(),
          },
        },
      };
    });
    setDiaryEventMap((current) => ({
      ...current,
      [conflict.customerId]: {
        ...(current[conflict.customerId] || {}),
        eventId: conflict.eventId,
        fingerprint: JSON.stringify([
          conflict.calendarDate,
          conflict.calendarTime || "",
          conflict.customerName,
          conflict.service,
          Number(conflict.booking?.value || 0),
        ]),
        lastStartDate: new Date(
          `${conflict.calendarDate}T${conflict.calendarTime || "09:00"}:00`
        ).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }));
    setDiaryConflicts((current) =>
      current.filter((item) => item.id !== conflict.id)
    );
    appendCustomerActivity(conflict.customerId, {
      kind: "booking",
      title: "Booking time reconciled from connected diary",
      note: `Owner explicitly accepted the device-calendar time: ${formatUKDate(
        conflict.calendarDate
      )} at ${conflict.calendarTime || "time not set"}.`,
    });
    return true;
  };

  const normaliseBusyCommandName = normaliseOperatorName;

  const findBusyCommandCustomer = (name = "") =>
    matchOperatorCustomer(customers, name).customer;

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
        durationHours: Math.max(0.5, Number(planningDurationHours(service)) || 2),
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
      executiveBriefing: {
        confirmed7: executiveBriefing.confirmed7,
        confirmed30: executiveBriefing.confirmed30,
        warmQuotes: executiveBriefing.warmQuotes,
        repeatPotential: executiveBriefing.repeatPotential,
        outlook: executiveBriefing.outlook,
        loadRows: executiveBriefing.loadRows,
        risks: executiveBriefing.risks,
        scenarios: executiveBriefing.scenarios,
        weeklyReview: executiveBriefing.weeklyReview,
        priority: {
          kind: executiveBriefing.priority.kind,
          title: executiveBriefing.priority.title,
          body: executiveBriefing.priority.body,
        },
      },
      operationalContinuity: {
        status: operationalContinuity?.status || "All clear",
        headline: operationalContinuity?.headline || "",
        highCount: Number(operationalContinuity?.highCount || 0),
        reviewCount: Number(operationalContinuity?.reviewCount || 0),
        recoveryQueue: (operationalContinuity?.recoveryQueue || []).slice(0, 6).map((item) => ({
          area: item.area || "",
          severity: item.severity || "",
          title: item.title || "",
          body: item.body || "",
        })),
      },
      dailyCommandCentre: {
        headline: dailyCommandCentre?.headline || "",
        status: dailyCommandCentre?.status || "Clear",
        changes: (dailyCommandCentre?.changes || []).slice(0, 8).map((item) => ({
          label: item.label || "",
          before: Number(item.before || 0),
          after: Number(item.after || 0),
          tone: item.tone || "blue",
        })),
        doNow: (dailyCommandCentre?.doNow || []).slice(0, 4).map((item) => ({
          title: item.title || "",
          body: item.body || "",
          why: item.why || "",
        })),
        laterToday: (dailyCommandCentre?.laterToday || []).slice(0, 6).map((item) => ({
          title: item.title || "",
          body: item.body || "",
          why: item.why || "",
        })),
        watch: (dailyCommandCentre?.watch || []).slice(0, 6).map((item) => ({
          title: item.title || "",
          body: item.body || "",
          why: item.why || "",
        })),
      },
      communicationsHub: {
        counts: {
          needsAttention: Number(communicationsHub?.counts?.needsAttention || 0),
          awaitingCustomer: Number(communicationsHub?.counts?.awaitingCustomer || 0),
          draftReady: Number(communicationsHub?.counts?.draftReady || 0),
          done: Number(communicationsHub?.counts?.done || 0),
          unmatched: Number(communicationsHub?.counts?.unmatched || 0),
        },
        threads: (communicationsHub?.threads || []).slice(0, 30).map((thread) => ({
          customerName: thread.customerName || "",
          service: thread.service || "",
          lane: thread.lane || "",
          contactAllowed: thread.contactAllowed !== false,
          latestSummary: String(thread.latestSummary || "").slice(0, 900),
          duplicateContactBlocked: !!thread.duplicateGuard?.blocked,
          duplicateContactReason: String(thread.duplicateGuard?.body || "").slice(0, 700),
          latestIncoming: thread.latestIncoming
            ? {
                title: thread.latestIncoming.title || "",
                body: String(thread.latestIncoming.body || "").slice(0, 1200),
                source: thread.latestIncoming.source || "",
                createdAt: thread.latestIncoming.createdAt || "",
              }
            : null,
          latestIncomingInterpretation: thread.latestIncomingInterpretation
            ? {
                kind: thread.latestIncomingInterpretation.kind || "",
                label: thread.latestIncomingInterpretation.label || "",
                confidence: thread.latestIncomingInterpretation.confidence || "",
                summary: thread.latestIncomingInterpretation.summary || "",
                suggestedHandling: thread.latestIncomingInterpretation.suggestedHandling || "",
              }
            : null,
          latestOutbound: thread.latestOutbound
            ? {
                title: thread.latestOutbound.title || "",
                body: String(thread.latestOutbound.body || "").slice(0, 1200),
                status: thread.latestOutbound.status || "",
                createdAt: thread.latestOutbound.createdAt || "",
              }
            : null,
          nextAction: thread.nextAction
            ? {
                kind: thread.nextAction.kind || "",
                title: thread.nextAction.title || "",
                body: thread.nextAction.body || "",
                why: thread.nextAction.why || "",
              }
            : null,
        })),
        unmatched: (communicationsHub?.unmatched || []).slice(0, 10).map((item) => ({
          title: item.title || "",
          source: item.source || "",
          reason: item.reason || "",
          interpretation: item.interpretation
            ? {
                label: item.interpretation.label || "",
                confidence: item.interpretation.confidence || "",
                summary: item.interpretation.summary || "",
              }
            : null,
        })),
      },
      followUpEngine: {
        counts: {
          replyNow: Number(followUpEngine?.counts?.replyNow || 0),
          followUpToday: Number(followUpEngine?.counts?.followUpToday || 0),
          waiting: Number(followUpEngine?.counts?.waiting || 0),
          readyToPrepare: Number(followUpEngine?.counts?.readyToPrepare || 0),
          recovery: Number(followUpEngine?.counts?.recovery || 0),
        },
        candidates: (followUpEngine?.candidates || []).slice(0, 30).map((item) => ({
          customerName: item.customerName || "",
          service: item.service || "",
          lane: item.lane || "",
          title: item.title || "",
          reason: item.reason || "",
          actionKind: item.actionKind || "",
          preferredChannel: item.preferredChannel || "",
          transportState: item.transportState || "",
          lastContactDate: item.lastContactDate || "",
          nextReviewDate: item.nextReviewDate || "",
          draftable: !!item.draftable,
          recovery: !!item.recovery,
          duplicateContactBlocked: !!item.duplicateContactBlocked,
          contactAllowed: item.contactAllowed !== false,
        })),
        providerBridge: {
          status: followUpEngine?.providerBridge?.status || "",
          realSendingEnabled: !!followUpEngine?.providerBridge?.realSendingEnabled,
        },
      },
      brandIdentity: {
        completeness: {
          score: Number(brandBrain?.completeness?.score || 0),
          label: brandBrain?.completeness?.label || "",
          coreMissing: (brandBrain?.completeness?.coreMissing || []).map((item) => item.label),
        },
        websiteReady: !!brandBrain?.websiteReady,
        websiteReadinessLabel: brandBrain?.websiteReadinessLabel || "",
        missingForWebsite: (brandBrain?.missingForWebsite || []).slice(0, 12),
        consistencyChecks: (brandBrain?.checks || []).slice(0, 12).map((item) => ({
          severity: item.severity || "",
          title: item.title || "",
          body: item.body || "",
        })),
        profile: {
          tagline: brandBrain?.profile?.tagline || "",
          publicDescription: brandBrain?.profile?.publicDescription || "",
          serviceAreaText: brandBrain?.profile?.serviceAreaText || "",
          phone: brandBrain?.profile?.phone || "",
          email: brandBrain?.profile?.email || "",
          openingHours: brandBrain?.profile?.openingHours || "",
          websiteDomain: brandBrain?.profile?.websiteDomain || "",
          toneOfVoice: brandBrain?.profile?.toneOfVoice || "",
          visualStyle: brandBrain?.profile?.visualStyle || "",
          story: brandBrain?.profile?.story || "",
          differentiators: brandBrain?.profile?.differentiators || "",
          facebookUrl: brandBrain?.profile?.facebookUrl || "",
          instagramUrl: brandBrain?.profile?.instagramUrl || "",
        },
        services: (brandBrain?.serviceMaster || []).slice(0, 20).map((service) => ({
          name: service.name || "",
          description: service.description || "",
          typicalValue: Number(service.value || 0),
          durationHours: Number(service.durationHours || 0),
        })),
        assets: {
          websitePhotoCount: Number(brandBrain?.summary?.photoCount || 0),
          heroSelected: !!brandBrain?.heroAsset,
          heroService: brandBrain?.heroAsset?.service || "",
          approvedTestimonialCount: Number(brandBrain?.summary?.testimonialCount || 0),
          faqCount: Number(brandBrain?.summary?.faqCount || 0),
        },
      },
      websiteBuilder: {
        hasDraft: !!websiteDraft,
        status: websiteDraft?.status || "",
        publicStatus: websiteDraft?.publicStatus || "Not published",
        generation: Number(websiteDraft?.generation || 0),
        theme: websiteDraft?.theme || null,
        visibleSections: (websiteDraft?.sections || [])
          .filter((section) => section.enabled !== false)
          .map((section) => ({
            id: section.id || "",
            type: section.type || "",
            title: section.title || "",
          })),
        readiness: websiteDraft?.readiness || {
          websiteReady: !!brandBrain?.websiteReady,
          label: brandBrain?.websiteReadinessLabel || "",
          missing: brandBrain?.missingForWebsite || [],
          identityScore: Number(brandBrain?.completeness?.score || 0),
        },
        publishingEnabled: false,
      },
      websitePublishing: {
        publicStatus: websitePublishingView?.publicStatus || "Not checked",
        hasHostedPreview: !!websitePublishingView?.previewDeployment,
        liveVersion: Number(websitePublishingView?.liveDeployment?.version_no || 0),
        previewVersion: Number(websitePublishingView?.previewDeployment?.version_no || 0),
        draftChangedSinceHosted: !!websitePublishingView?.draftChangedSinceHosted,
        queueStatus: websitePublishingView?.queueHealth?.status || "Not checked",
        customDomainStatus: websitePublishingView?.domainState?.latest?.status || "",
        customDomainRoutingActive: !!websitePublishingView?.domainState?.routingActive,
        domainOwnership: websitePublishingView?.domainState?.ownership || "Not connected",
        domainRouting: websitePublishingView?.domainState?.routing || "Not configured",
        domainSsl: websitePublishingView?.domainState?.ssl || "Not configured",
        healthStatus: websitePublishingView?.healthLabel || "Not checked",
        pageCount: Number(websitePublishingView?.pageCount || 0),
        seoBasics: websitePublishingView?.seoAudit?.label || "Not checked",
        analyticsStatus: websitePublishingView?.analyticsView?.status || "foundation",
        trafficRequests30: Number(websitePublishingView?.analyticsView?.requests || 0),
        trafficVisits30: Number(websitePublishingView?.analyticsView?.visits || 0),
        trafficEdgeBytes30: Number(websitePublishingView?.analyticsView?.edgeBytes || 0),
        attributedEnquiries30: Number(websitePublishingView?.enquiryView?.count || 0),
        deliveryProvider: websitePublishingView?.providerState?.provider || "",
        deliveryProviderConfigured: !!websitePublishingView?.providerState?.configured,
        defaultWebsiteAddress: websitePublishingView?.defaultAddressState?.address?.hostname || "",
        defaultWebsiteAddressStatus: websitePublishingView?.defaultAddressState?.status || "Not configured",
        usageDeployments30: Number(websitePublishingView?.usageView?.deployments || 0),
        usageArtifactBytes30: Number(websitePublishingView?.usageView?.artifactBytes || 0),
        publicProfileRevision: Number(websitePublishingView?.publicProfile?.revision || 0),
        publicChangeRequiresOwnerApproval: true,
      },
      miniApps: {
        status: miniAppsView?.statusLabel || "Not built",
        hasDraft: !!miniAppsView?.hasDraft,
        hasPreview: !!miniAppsView?.hasPreview,
        hasLive: !!miniAppsView?.hasLive,
        discoverable: !!miniAppsView?.isDiscoverable,
        liveVersion: Number(miniAppsView?.liveVersion?.version_no || 0),
        previewVersion: Number(miniAppsView?.previewVersion?.version_no || 0),
        enabledModules: (miniAppsView?.enabledModules || []).map((item) => item.key),
        plannedModules: (miniAppsView?.plannedModules || []).map((item) => item.module_key),
        pendingCustomerRequests: Number(miniAppsView?.pendingRequests?.length || 0),
        unlinkedCustomerRequests: Number(miniAppsView?.unlinkedPendingRequests?.length || 0),
        linkedCustomerRequests: Number(miniAppsView?.linkedRequests?.length || 0),
        businessUnreadMessages: Number(miniAppsView?.businessUnreadTotal || 0),
        bookingDraftRequests: Number(
          (miniAppsView?.requestLinks || []).filter(
            (item) => item.bridge_state === "booking_draft"
          ).length
        ),
        publicSlug: miniAppsView?.publicSlug || "",
        publicWebReady: !!miniAppsView?.webReady,
        webViews30: Number(
          miniAppsView?.entryCounts?.byStage?.web_view ||
          miniAppsView?.entryCounts?.byStage?.landing ||
          0
        ),
        actionIntents30: Number(miniAppsView?.entryCounts?.byStage?.action_intent || 0),
        entryAppOpens30: Number(miniAppsView?.entryCounts?.byStage?.app_open || 0),
        customerRequests30: Number(miniAppsView?.requestCount30 || 0),
        guestRequests30: Number(miniAppsView?.guestRequestCount30 || 0),
        qrEntries30: Number(miniAppsView?.entryCounts?.bySource?.qr || 0),
        shareEntries30: Number(miniAppsView?.entryCounts?.bySource?.share || 0),
        arbitraryBespokeCodeSupported: false,
        publicChangeRequiresOwnerApproval: true,
      },
      businessMemory: {
        lastReviewedAt: businessMemoryLastReviewAt,
        strongestPattern: strongestBusinessMemoryPattern
          ? {
              title: strongestBusinessMemoryPattern.title,
              sample: strongestBusinessMemoryPattern.sample,
              successes: strongestBusinessMemoryPattern.successes,
              observedRate: strongestBusinessMemoryPattern.observedRate,
              confidence: strongestBusinessMemoryPattern.stage.label,
              direction: strongestBusinessMemoryPattern.direction,
              rankingEffect: strongestBusinessMemoryPattern.memoryAdjustment,
              learnedBecause: strongestBusinessMemoryPattern.learnedBecause,
            }
          : null,
        patterns: businessMemoryPatterns.map((item) => ({
          title: item.title,
          sample: item.sample,
          successes: item.successes,
          observedRate: item.observedRate,
          confidence: item.stage.label,
          direction: item.direction,
          rankingEffect: item.memoryAdjustment,
          learnedBecause: item.learnedBecause,
        })),
        changes: businessMemoryChanges.slice(0, 8),
        insights: businessMemoryInsights.slice(0, 8),
        recent30Days: businessMemoryRecentRows,
      },
      activeWorkGoal: activeWorkGoal
        ? {
            label: activeWorkGoal.label || "",
            targetJobs: Number(workGoalTargetJobs) || 0,
            bookedJobs: Number(workGoalBookedCount) || 0,
            remainingJobs: Number(workGoalRemainingJobs) || 0,
          }
        : null,
      calendarIntelligence: {
        capacityHours: Number(workCalendarIntelligence?.capacityHours || 7.5),
        days: Object.values(workCalendarIntelligence?.byDate || {})
          .filter((day) => !day?.date || day.date >= today)
          .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")))
          .slice(0, 45)
          .map((day) => ({
            date: day.date || "",
            state: day.state || "Open",
            bookedJobs: Number(day.bookings?.length || 0),
            bookedValue: Number(day.bookedValue || 0),
            scheduledHours: Number(day.scheduledHours || 0),
            estimatedOpenHours: Number(day.estimatedOpenHours || 0),
            followUps: Number(day.attention?.length || 0),
            externalCommitments: Number(day.externalEvents?.length || 0),
            conflictCount: Number(day.conflictCount || 0),
            bookings: (day.bookings || []).slice(0, 6).map((booking) => ({
              customerName: booking.customerName || "",
              service: booking.service || "",
              time: booking.time || "",
              value: Number(booking.value || 0),
              durationHours: Number(booking.durationHours || 0),
            })),
            attention: (day.attention || []).slice(0, 6).map((item) => ({
              kind: item.kind || "",
              customerName: item.customerName || "",
              service: item.service || "",
              title: item.title || "",
              overdue: !!item.overdue,
              dueDate: item.dueDate || item.date || "",
            })),
            external: (day.externalEvents || []).slice(0, 6).map((item) => ({
              title: item.title || "External commitment",
              time: item.time || "",
              durationHours: Number(item.durationHours || 0),
            })),
            fillCandidate: day.fillCandidate
              ? {
                  customerName: day.fillCandidate.customerName || "",
                  service: day.fillCandidate.service || "",
                  durationHours: Number(day.fillCandidate.durationHours || 0),
                  value: Number(day.fillCandidate.value || 0),
                }
              : null,
          })),
      },
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
        const journey = buildCustomerJourney2({
          customer,
          action,
          services,
          verticalId,
          todayISO: today,
        });
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
          actionType: action?.type || "",
          actionDone: !!action?.done,
          bookingStatus: action?.type === "booking" ? action.details?.bookingStatus || "" : "",
          quoteStatus: action?.type === "quote" ? action.details?.quoteStatus || "" : "",
          reminderDate: action?.type === "reminder" ? action.details?.reminderDate || "" : "",
          reminderStatus: action?.type === "reminder" ? action.details?.reminderStatus || "" : "",
          latestCompletedJobDate: job?.date || "",
          latestCompletedJobValue: Number(job?.value) || 0,
          journey: journey
            ? {
                lifecycleStatus: journey.lifecycleStatus || "",
                completedJobs: Number(journey.relationship?.completedJobs || 0),
                completedValue: Number(journey.relationship?.completedValue || 0),
                communicationCount: Number(journey.relationship?.communicationCount || 0),
                repeatDueDate: journey.relationship?.repeatDueDate || "",
                currentAction: journey.currentAction
                  ? {
                      label: journey.currentAction.label || "",
                      status: journey.currentAction.status || "",
                      summary: journey.currentAction.summary || "",
                      date: journey.currentAction.date || "",
                      time: journey.currentAction.time || "",
                      value: Number(journey.currentAction.value || 0),
                    }
                  : null,
                stalledSignals: (journey.stalledSignals || []).slice(0, 6).map((item) => ({
                  level: item.level || "",
                  title: item.title || "",
                  body: item.body || "",
                })),
                nextAction: journey.nextAction
                  ? {
                      kind: journey.nextAction.kind || "",
                      title: journey.nextAction.title || "",
                      body: journey.nextAction.body || "",
                      why: journey.nextAction.why || "",
                    }
                  : null,
                timeline: (journey.timeline || []).slice(0, 12).map((item) => ({
                  kind: item.kind || "",
                  date: item.date || "",
                  title: item.title || "",
                  body: item.body || "",
                  status: item.status || "",
                  value: Number(item.value || 0),
                })),
                communications: (journey.communicationHistory || []).slice(0, 10).map((item) => ({
                  date: item.date || "",
                  title: item.title || "",
                  body: item.body || "",
                  status: item.status || "",
                })),
              }
            : null,
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
            note: String(structured.note || "").slice(0, 900),
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


  // V3.66: read-only, creator-scoped growth answers; never a publishing command.
  const growthOperatorCandidate = transcript => {
    const focus=growthOperatorFocusRef.current;
    return classifyGrowthUtterance(transcript,{
      activeContext:!!(focus && focus.scope===growthOperatorScopeRef.current),
    }).growth || /\b(where are we with|progress on|status of|continue my|resume my|how is my)\b/i.test(String(transcript||""));
  };
  const tryGrowthOperator=async (transcript,nonce)=>{
    const request=String(transcript||"").trim().slice(0,400);
    if(!request||!growthOperatorCandidate(request))return null;
    const scope=growthOperatorScopeRef.current;
    const ownerId=String(ownerSession?.userId||"");
    const businessId=String(cloudWorkspace?.businessId||"");
    const valid=()=>growthOperatorRequestRef.current===nonce && growthOperatorScopeRef.current===scope;
    const focus=growthOperatorFocusRef.current;
    let centre;
    if(!ownerId||!businessId)centre=buildGrowthCommandCentre({ownerId,businessId});
    else try{
      const args=await conversationCloudArgs();
      if(!valid()||args.userId!==ownerId||args.businessId!==businessId)return {cancelled:true};
      const records=await listGrowthProjects(args);
      if(!valid())return {cancelled:true};
      centre=buildGrowthCommandCentre({records,approved:businessCreationIntelligence?.sharedProfile||{},ownerId,businessId});
    }catch(_){
      if(!valid())return {cancelled:true};
      centre=buildGrowthCommandCentre({ownerId,businessId,readFailed:true});
    }
    const resolved=resolveGrowthOperator(request,centre,{focus,scope});
    if(!resolved.handled && centre.state==="unavailable"){
      return {handled:true,result:{
        intent:"growth_project_summary",title:"Private growth project unavailable",
        response:"BUSY could not verify your saved growth projects. Your wording was not changed; reconnect and ask again.",
        transcript:request,applied:true,confidence:"Low",mode:"answer",
        needsClarification:false,requiresConfirmation:false,actionLabel:"",
        growthOwnerId:ownerId,growthBusinessId:businessId,
      }};
    }
    if(!resolved.handled)return null;
    if(!valid())return {cancelled:true};
    if(resolved.serviceName && centre.projects?.some(p=>p.serviceName===resolved.serviceName))
      growthOperatorFocusRef.current={scope,serviceName:resolved.serviceName};
    const action=resolved.kind==="open_project"&&!!resolved.serviceName;
    return {handled:true,autoOpen:action && /\b(open|continue|resume|pick up|carry on)\b/i.test(request),
      result:{
        intent:action?"growth_project_open":"growth_project_summary",
        title:"BUSY growth projects",response:resolved.message,transcript:request,
        mode:action?"action":"answer",applied:!action,
        confidence:"High",needsClarification:false,requiresConfirmation:false,
        actionLabel:action?(resolved.actionLabel||"Open private project"):"",
        growthProjectName:action?resolved.serviceName:"",
        growthProjectTarget:action?(resolved.channel||""):"",
        growthOwnerId:ownerId,growthBusinessId:businessId,
      }};
  };
  const acceptGrowthOperator=processed=>{
    if(!processed?.handled)return null;
    const result=processed.result;
    addBusyConversationTurn("user",result.transcript);
    addBusyConversationTurn("assistant",result.response,result);
    addBusyCommandHistory({
      transcript:result.transcript,response:result.response,
      intent:result.intent,confidence:"High",
    });
    setBusyCommandResult(result);
    setBusyCommandStatus("ready");
    if(processed.autoOpen && result.intent==="growth_project_open" &&
       result.growthOwnerId===ownerSession?.userId &&
       result.growthBusinessId===cloudWorkspace?.businessId){
      // Navigation only; saved drafts are loaded explicitly in their workspace.
      setGrowthProjectFocus(result.growthProjectName);
      setTab("Home");
      go("businessCreationJourney");
      setBusyCommandResult({...result,applied:true,actionLabel:""});
    }
    return result;
  };

  const submitBusyCommand = async ({ text = "", audioUri = "" } = {}) => {
    const cleanText = String(text || "").trim();
    if (!cleanText && !audioUri) {
      setBusyCommandError("Tell BUSY what you want to do.");
      return null;
    }
    const growthNonce=++growthOperatorRequestRef.current;
    setBusyCommandStatus("thinking");
    setBusyCommandError("");
    setBusyCommandResult(null);
    try {
      // Local typed routing uses the authenticated project rows, avoiding an AI
      // request for grounded project-only questions.
      if(cleanText && !audioUri && !businessCreationConversationActive){
        const handled=await tryGrowthOperator(cleanText,growthNonce);
        if(handled?.cancelled)return null;
        if(handled?.handled)return acceptGrowthOperator(handled);
      }
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
      let result = {
        ...command,
        transcript: String(payload?.transcript || cleanText || "").trim(),
      };

      // Audio was transcribed by the existing BUSY Operator service; resolve
      // project-only commands before its standard actions can run.
      if(result.transcript && !businessCreationConversationActive){
        const handled=await tryGrowthOperator(result.transcript,growthNonce);
        if(handled?.cancelled)return null;
        if(handled?.handled)return acceptGrowthOperator(handled);
      }
      if (businessCreationConversationActive && result.transcript) {
        const spoken = String(result.transcript || "").trim();
        let responseText = "";
        let clarificationQuestion = "";
        let needsClarification = false;

        if (!String(businessCreationBrief || "").trim()) {
          setBusinessCreationBrief(spoken);
          await prepareBusinessCreationJourney(spoken);
          const question = businessCreationJourney?.nextQuestion;
          clarificationQuestion =
            question?.question ||
            "I have prepared the private launch pack. Would you like to review the website, Business App or social setup first?";
          needsClarification = !!question;
          responseText = question
            ? "I have started the business launch pack from what you told me. I just need one useful detail next."
            : "I have prepared the private launch pack from what you told me. Nothing has been published.";
        } else if (businessCreationJourney?.nextQuestion) {
          const currentQuestion = businessCreationJourney.nextQuestion;
          const saved = answerBusinessCreationQuestion(spoken);
          if (!saved) {
            responseText = "I could not safely save that answer.";
            clarificationQuestion = currentQuestion.question || "";
            needsClarification = true;
          } else {
            const shared = {
              ...(businessCreationIntelligence?.sharedProfile || {}),
            };
            if (currentQuestion.key === "businessName") shared.businessName = spoken;
            if (currentQuestion.key === "businessType") shared.businessType = spoken;
            if (currentQuestion.key === "serviceArea") shared.serviceArea = spoken;
            if (currentQuestion.key === "description") shared.description = spoken;
            if (currentQuestion.key === "openingHours") shared.openingHours = spoken;
            if (currentQuestion.key === "contact") {
              if (spoken.includes("@")) shared.email = spoken;
              else shared.phone = spoken;
            }
            const nextQuestion = nextBestBusinessCreationQuestion({
              shared,
              brandBrain: { ...brandBrain, missingForWebsite: [] },
              miniAppsView,
            });
            clarificationQuestion = nextQuestion?.question || "";
            needsClarification = !!nextQuestion;
            responseText = nextQuestion
              ? "Got it. I have saved that to the shared business profile and carried it into the creation journey. Here is the next thing I need."
              : "Got it. I now have the important business-profile details I need. The launch pack can keep moving forward.";
          }
        } else {
          responseText =
            "The business creation profile has the important core facts. I can keep preparing the launch pack or you can review one of the private previews.";
        }

        const creationResult = {
          intent: "business_creation_conversation",
          mode: needsClarification ? "clarify" : "answer",
          title: "Business creation",
          response: responseText,
          confidence: "High",
          needsClarification,
          clarificationQuestion,
          requiresConfirmation: false,
          actionLabel: "",
          customerName: "",
          service: "",
          date: "",
          time: "",
          value: 0,
          note: "",
          draftText: "",
          draftTarget: "",
          previewRows: [],
          planSteps: [],
          transcript: spoken,
          applied: true,
        };
        addBusyConversationTurn("user", spoken);
        addBusyConversationTurn(
          "assistant",
          needsClarification ? clarificationQuestion : responseText,
          creationResult
        );
        setBusyCommandResult(creationResult);
        setBusyCommandStatus("ready");
        return creationResult;
      }

      const validation = validateOperatorCommand({
        command: result,
        customers,
        replyActions,
      });
      result = {
        ...result,
        requiresConfirmation:
          operatorRequiresConfirmation(result.intent) ||
          !!result.requiresConfirmation,
        previewRows: buildOperatorClientPreview({
          command: result,
          customer: validation.customer,
          replyActions,
        }),
      };

      if (!validation.ok) {
        const clarificationReasons = [
          "ambiguous-customer",
          "missing-customer",
          "missing-date",
          "missing-time",
          "no-booking-change",
          "missing-note",
          "missing-reminder-date",
        ];
        const needsClarification = clarificationReasons.includes(validation.reason);
        result = {
          ...result,
          intent: needsClarification ? result.intent : "unknown",
          mode: needsClarification ? "clarify" : "answer",
          needsClarification,
          clarificationQuestion: needsClarification ? validation.message : "",
          requiresConfirmation: false,
          actionLabel: "",
          response: validation.message || result.response,
        };
      }

      addBusyConversationTurn("user", result.transcript);
      addBusyConversationTurn(
        "assistant",
        result.needsClarification
          ? result.clarificationQuestion || result.response
          : result.response,
        result
      );

      const autoWebsiteIntent = [
        "website_build",
        "website_edit",
        "open_website",
        "website_health_check",
        "website_publish_request",
        "website_rollback_request",
        "mini_app_build",
        "mini_app_edit",
        "open_busy_apps",
        "mini_app_status",
      ].includes(result.intent);
      if (
        autoWebsiteIntent &&
        !result.needsClarification &&
        !result.requiresConfirmation
      ) {
        addBusyConversationTurn("user", result.transcript);
        addBusyConversationTurn("assistant", result.response || result.title || "Website request understood.", result);
        addBusyCommandHistory({
          transcript: result.transcript,
          response: result.response || result.title || "Website request understood.",
          intent: result.intent,
          confidence: result.confidence,
        });
        setBusyOperatorSnapshot(context.currentSnapshot);
        setBusyCommandStatus("ready");
        executeBusyCommand(result);
        return result;
      }

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
    !command.applied &&
    command.intent !== "operator_plan" &&
    !operatorIsAnswerOnly(command.intent || "unknown");

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

  const cloneOperatorValue = (value) =>
    value === null || value === undefined
      ? null
      : JSON.parse(JSON.stringify(value));

  const operatorRollbackFor = (customerId) => ({
    customer: cloneOperatorValue(
      customers.find((item) => item.id === customerId) || null
    ),
    action: cloneOperatorValue(replyActions?.[customerId] || null),
  });

  const markBusyCommandApplied = (command, title, response) => {
    const applied = {
      ...command,
      title,
      response,
      mode: "answer",
      requiresConfirmation: false,
      actionLabel: "",
      applied: true,
    };
    setBusyCommandResult(applied);
    addBusyConversationTurn("assistant", response, applied);
    setBusyCommandStatus("ready");
    return applied;
  };

  const executeBusyCommand = (command = busyCommandResult) => {
    if (!command || command.needsClarification || command.applied) return false;
    const customer = findBusyCommandCustomer(command.customerName || "");
    const commandValue = Number(command.value) || 0;

    switch (command.intent) {
      case "growth_project_open":
        if(!command.growthProjectName || command.growthOwnerId!==ownerSession?.userId ||
           command.growthBusinessId!==cloudWorkspace?.businessId){
          setBusyCommandError("Your account or business changed. Please reload the private project.");
          return false;
        }
        setGrowthProjectFocus(command.growthProjectName);
        setTab("Home");
        go("businessCreationJourney");
        markBusyCommandApplied(command,"Private growth workspace opened",
          "Opened the project workspace for "+command.growthProjectName+
          ". Explicitly load your saved cloud draft before editing. Nothing was published.");
        return true;
      case "open_today":
        jump("workHub", "Work");
        return true;
      case "open_calendar":
        if (command.date) setOperatorCalendarDate(command.date);
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
        const validation = validateOperatorCommand({
          command,
          customers,
          replyActions,
        });
        if (!validation.ok || !validation.customer) {
          setBusyCommandError(validation.message || "BUSY could not safely create that booking.");
          return false;
        }
        const target = validation.customer;
        const rollback = operatorRollbackFor(target.id);
        const previousAction = replyActions?.[target.id] || null;
        const now = new Date().toISOString();
        const sourceQuoteAmount =
          previousAction?.type === "quote"
            ? Number(previousAction.details?.quoteAmount) || 0
            : Number(previousAction?.details?.sourceQuoteAmount) || 0;
        const value = commandValue || sourceQuoteAmount || 0;

        setReplyActions((current) => ({
          ...current,
          [target.id]: {
            ...(current[target.id] || {}),
            task: "Booking confirmed",
            type: "booking",
            origin: "BUSY Operator",
            createdAt: current[target.id]?.createdAt || now,
            done: true,
            details: {
              ...(current[target.id]?.type === "booking"
                ? current[target.id]?.details || {}
                : {}),
              sourceQuoteAmount: sourceQuoteAmount || "",
              bookingDate: command.date,
              bookingTime: command.time,
              bookingStatus: "Confirmed",
              jobValue: value || "",
              operatorChangedAt: now,
              summary: `Booking set for ${formatUKDate(command.date)} at ${command.time}`,
            },
            completedAt: now,
          },
        }));
        setCustomers((current) =>
          current.map((item) =>
            item.id === target.id
              ? {
                  ...item,
                  lifecycleStatus: "Booked",
                  lastActivityAt: now,
                  lastActivityKind: "booking",
                }
              : item
          )
        );
        appendCustomerActivity(target.id, {
          kind: "booking",
          title: "Booking confirmed through BUSY Operator",
          note: `${formatUKDate(command.date)} at ${command.time}${value ? ` • £${value}` : ""}.`,
          value: value || "",
        });
        setSelectedReplyActionId(target.id);
        setActionBookingDate(command.date);
        setActionBookingTime(command.time);
        if (value) setActionJobValue(String(value));
        rememberBusyAudit({
          type: "booking-created",
          label: `Confirmed booking for ${target.name}`,
          customerId: target.id,
          rollback,
        });
        markBusyCommandApplied(
          command,
          "Booking confirmed",
          `${target.name} is now booked for ${formatUKDate(command.date)} at ${command.time}. You can undo this BUSY change below.`
        );
        return true;
      }
      case "edit_booking": {
        const validation = validateOperatorCommand({
          command,
          customers,
          replyActions,
        });
        if (!validation.ok || !validation.customer || !validation.booking) {
          setBusyCommandError(validation.message || "BUSY could not safely change that booking.");
          return false;
        }
        const target = validation.customer;
        const action = validation.booking;
        const rollback = operatorRollbackFor(target.id);
        const beforeDate = action.details?.bookingDate || "";
        const beforeTime = action.details?.bookingTime || "";
        const beforeValue =
          Number(action.details?.jobValue) ||
          Number(action.details?.sourceQuoteAmount) ||
          0;
        const nextDate = command.date || beforeDate;
        const nextTime = command.time || beforeTime;
        const nextValue = commandValue || beforeValue;
        const now = new Date().toISOString();

        setReplyActions((current) => ({
          ...current,
          [target.id]: {
            ...current[target.id],
            details: {
              ...(current[target.id]?.details || {}),
              bookingDate: nextDate,
              bookingTime: nextTime,
              jobValue: nextValue || "",
              operatorChangedAt: now,
              summary: `Booking set for ${formatUKDate(nextDate)} at ${nextTime || "time not set"}`,
            },
          },
        }));
        setCustomers((current) =>
          current.map((item) =>
            item.id === target.id
              ? {
                  ...item,
                  lifecycleStatus: "Booked",
                  lastActivityAt: now,
                  lastActivityKind: "booking",
                }
              : item
          )
        );
        appendCustomerActivity(target.id, {
          kind: "booking",
          title: "Booking changed through BUSY Operator",
          note: `${formatUKDate(beforeDate)} ${beforeTime || ""} → ${formatUKDate(nextDate)} ${nextTime || ""}${beforeValue !== nextValue ? ` • £${beforeValue || 0} → £${nextValue || 0}` : ""}`,
          value: nextValue || "",
        });
        setActionBookingDate(nextDate);
        setActionBookingTime(nextTime);
        if (nextValue) setActionJobValue(String(nextValue));
        rememberBusyAudit({
          type: "booking-edited",
          label: `Changed ${target.name}'s booking`,
          customerId: target.id,
          rollback,
        });
        markBusyCommandApplied(
          command,
          "Booking updated",
          `${target.name}'s booking is now ${formatUKDate(nextDate)} at ${nextTime || "time not set"}${nextValue ? ` for £${nextValue}` : ""}. You can undo this BUSY change below.`
        );
        return true;
      }
      case "cancel_booking": {
        const validation = validateOperatorCommand({
          command,
          customers,
          replyActions,
        });
        if (!validation.ok || !validation.customer || !validation.booking) {
          setBusyCommandError(validation.message || "BUSY could not safely cancel that booking.");
          return false;
        }
        const target = validation.customer;
        const action = validation.booking;
        const rollback = operatorRollbackFor(target.id);
        const bookedDate = action.details?.bookingDate || "";
        const bookedTime = action.details?.bookingTime || "";
        setBookingStatus(target.id, "Cancelled");
        rememberBusyAudit({
          type: "booking-cancelled",
          label: `Cancelled ${target.name}'s booking`,
          customerId: target.id,
          rollback,
        });
        markBusyCommandApplied(
          command,
          "Booking cancelled",
          `${target.name}'s booking for ${formatUKDate(bookedDate)} at ${bookedTime || "time not set"} is marked cancelled. You can undo this BUSY change below.`
        );
        return true;
      }
      case "complete_job": {
        const validation = validateOperatorCommand({
          command,
          customers,
          replyActions,
        });
        if (!validation.ok || !validation.customer || !validation.booking) {
          setBusyCommandError(validation.message || "BUSY could not safely complete that job.");
          return false;
        }
        const target = validation.customer;
        const action = validation.booking;
        const rollback = operatorRollbackFor(target.id);
        markBookingCompleted(
          target.id,
          commandValue || action.details?.jobValue || "",
          command.note || ""
        );
        rememberBusyAudit({
          type: "job-completed",
          label: `Marked ${target.name}'s job complete`,
          customerId: target.id,
          rollback,
        });
        markBusyCommandApplied(
          command,
          "Job marked complete",
          `${target.name}'s booked job is now marked complete${commandValue ? ` at £${commandValue}` : ""}. You can undo this BUSY change below.`
        );
        return true;
      }
      case "add_customer_note": {
        const validation = validateOperatorCommand({
          command,
          customers,
          replyActions,
        });
        if (!validation.ok || !validation.customer) {
          setBusyCommandError(validation.message || "BUSY could not safely add that note.");
          return false;
        }
        const target = validation.customer;
        const rollback = operatorRollbackFor(target.id);
        appendCustomerActivity(target.id, {
          kind: "note",
          title: "Note added through BUSY Operator",
          note: String(command.note || "").trim(),
        });
        rememberBusyAudit({
          type: "customer-note-added",
          label: `Added a note to ${target.name}`,
          customerId: target.id,
          rollback,
        });
        markBusyCommandApplied(
          command,
          "Customer note added",
          `The note has been added to ${target.name}'s BUSY customer history. You can undo this BUSY change below.`
        );
        return true;
      }
      case "set_reminder": {
        const validation = validateOperatorCommand({
          command,
          customers,
          replyActions,
        });
        if (!validation.ok || !validation.customer) {
          setBusyCommandError(validation.message || "BUSY could not safely set that reminder.");
          return false;
        }
        const target = validation.customer;
        const rollback = operatorRollbackFor(target.id);
        const now = new Date().toISOString();
        setReplyActions((current) => ({
          ...current,
          [target.id]: {
            ...(current[target.id] || {}),
            task: "Follow up with customer",
            type: "reminder",
            origin: "BUSY Operator",
            createdAt: current[target.id]?.createdAt || now,
            done: true,
            details: {
              ...(current[target.id]?.type === "reminder"
                ? current[target.id]?.details || {}
                : {}),
              reminderDate: command.date,
              reminderStatus: "Scheduled",
              reminderNote: String(command.note || "").trim(),
              reminderCompletedAt: null,
              summary: `Follow up on ${formatUKDate(command.date)}`,
            },
            completedAt: now,
          },
        }));
        setCustomers((current) =>
          current.map((item) =>
            item.id === target.id
              ? {
                  ...item,
                  lifecycleStatus: "Follow-up scheduled",
                  lastActivityAt: now,
                  lastActivityKind: "reminder",
                }
              : item
          )
        );
        appendCustomerActivity(target.id, {
          kind: "reminder",
          title: "Follow-up scheduled through BUSY Operator",
          note: `${formatUKDate(command.date)}${command.note ? ` • ${command.note}` : ""}`,
        });
        setActionReminderDate(command.date);
        rememberBusyAudit({
          type: "reminder-set",
          label: `Set a follow-up for ${target.name}`,
          customerId: target.id,
          rollback,
        });
        markBusyCommandApplied(
          command,
          "Follow-up scheduled",
          `BUSY will now show ${target.name}'s follow-up for ${formatUKDate(command.date)} in the normal customer-work flow. You can undo this BUSY change below.`
        );
        return true;
      }
      case "website_build": {
        const nextDraft = buildWebsiteDraft({
          brandBrain,
          previousDraft: websiteDraft,
        });
        setWebsiteDraft(nextDraft);
        setWebsiteBuilderNotice(
          brandBrain.websiteReady
            ? "BUSY built the website draft from the recorded Brand Brain."
            : "BUSY built a partial website draft and left missing business facts unfilled."
        );
        markBusyCommandApplied(
          command,
          "Website draft built",
          "Your internal website draft is ready to preview. Nothing has been published or connected to a domain."
        );
        jump("websitePreview", "Home");
        return true;
      }
      case "website_edit": {
        if (!websiteDraft) {
          setWebsiteBuilderNotice("Build the first website draft before applying website changes.");
          jump("websiteBuilder", "Home");
          return false;
        }
        const result = applyWebsiteInstruction(
          websiteDraft,
          command.note || command.transcript || ""
        );
        setWebsiteBuilderNotice(result.reason || "");
        if (!result.applied) {
          setBusyCommandError(
            result.reason ||
              "BUSY understood the website request but could not safely apply that change automatically."
          );
          jump("websiteBuilder", "Home");
          return false;
        }
        setWebsiteDraft(result.draft);
        markBusyCommandApplied(
          command,
          "Website draft updated",
          `${result.reason} The change is saved to the internal draft only; nothing was published.`
        );
        jump("websitePreview", "Home");
        return true;
      }
      case "open_website":
        jump(websiteDraft ? "websitePreview" : "websiteBuilder", "Home");
        return true;
      case "website_health_check":
        openWebsitePublishing();
        setTimeout(() => runWebsiteHealthCheck(), 120);
        return true;
      case "website_publish_request":
      case "website_rollback_request":
        openWebsitePublishing();
        return true;
      case "mini_app_build": {
        const brief =
          String(command.note || command.transcript || "").trim() ||
          "Build a customer-facing app for my business using the information BUSY already knows.";
        setMiniAppBuildBrief(brief);
        openMiniAppBuilder();
        setTimeout(() => planMiniAppFromBrief(brief), 120);
        return true;
      }
      case "mini_app_edit": {
        const editBrief = String(
          command.note || command.transcript || ""
        ).trim();
        if (editBrief) setMiniAppBuildBrief(editBrief);
        openMiniAppBuilder();
        if (editBrief) setTimeout(() => planMiniAppFromBrief(editBrief), 120);
        return true;
      }
      case "open_busy_apps":
        openBusyAppsMarketplace();
        return true;
      case "mini_app_status":
        openMiniAppBuilder();
        return true;
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
    const command = {
      ...step,
      title: step.label || "BUSY plan step",
      response: step.reason || "Review this step before continuing.",
      transcript: busyCommandResult?.transcript || "",
      confidence: busyCommandResult?.confidence || "Medium",
      mode: "action",
      previewRows: [
        ...(step.customerName ? [{ label: "Customer", value: step.customerName }] : []),
        ...(step.service ? [{ label: "Service", value: step.service }] : []),
        ...(step.date ? [{ label: "Date", value: step.date }] : []),
        ...(step.time ? [{ label: "Time", value: step.time }] : []),
        ...(Number(step.value) > 0 ? [{ label: "Value", value: `£${step.value}` }] : []),
      ],
      planSteps: [],
    };
    if (operatorRequiresConfirmation(step.intent) || step.requiresConfirmation) {
      const validation = validateOperatorCommand({
        command,
        customers,
        replyActions,
      });
      setBusyCommandResult({
        ...command,
        requiresConfirmation: true,
        previewRows: buildOperatorClientPreview({
          command,
          customer: validation.customer,
          replyActions,
        }),
      });
      return true;
    }
    return executeBusyCommand(command);
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
    growthOperatorRequestRef.current+=1;
    growthOperatorFocusRef.current=null;
    setBusyConversationTurns([]);
    clearBusyCommandResult();
  };

  const openTalkToBusy = (startVoice = false) => {
    clearBusyCommandResult();
    if (startVoice) setBusyVoiceStartNonce(Date.now());
    go("talkToBusy");
  };

  const askBusyWhyLearningChanged = async () => {
    go("talkToBusy");
    return submitBusyCommand({
      text: "Why have your recommendations changed based on what you have learned about my business?",
    });
  };

  const openCustomerJourneyNext = (next = selectedCustomerJourney?.nextAction) => {
    const action = next?.action || null;
    if (!action) return false;
    if (action.kind === "customer-action" && action.customerId) {
      openSavedReplyAction(action.customerId);
      return true;
    }
    if (action.kind === "quote-follow-up" && action.customerId) {
      prepareQuoteFollowUp(action.customerId);
      return true;
    }
    if (action.kind === "quote-outcome" && action.customerId) {
      openQuoteFollowUpOutcome(action.customerId);
      return true;
    }
    if (action.kind === "enquiry-follow-up" && action.customerId) {
      prepareEnquiryFollowUp(action.customerId);
      return true;
    }
    if (action.kind === "enquiry-outcome" && action.customerId) {
      openEnquiryFollowUpOutcome(action.customerId);
      return true;
    }
    if (action.kind === "review-request" && action.customerId && action.jobId) {
      prepareReviewRequest(action.customerId, action.jobId);
      return true;
    }
    if (action.kind === "review-outcome" && action.customerId && action.jobId) {
      openReviewRequestOutcome(action.customerId, action.jobId);
      return true;
    }
    if (action.kind === "repeat") {
      go("eligibleCustomers");
      return true;
    }
    return false;
  };

  const askBusyAboutCustomer = (customerId = selectedCustomerId) => {
    const customer = customers.find((item) => item.id === customerId);
    if (!customer) return false;
    setSelectedCustomerId(customer.id);
    openTalkToBusy(false);
    setTimeout(() => {
      submitBusyCommand({
        text: `Give me the full customer journey for ${customer.name}. Tell me what has happened, what is open, what communication is already recorded, whether anything is stalled, and the single best next step.`,
      });
    }, 80);
    return true;
  };

  const updateBrandProfile = (field, value) => {
    if (!BRAND_PROFILE_TEXT_FIELDS.has(String(field || ""))) return false;
    setBrandProfile((current) => ({
      ...current,
      [field]: String(value ?? ""),
    }));
    return true;
  };

  const updateBrandServiceDescription = (serviceId, value) => {
    const id = String(serviceId || "");
    if (!id || !services.some((service) => service.id === id)) return false;
    setBrandProfile((current) => ({
      ...current,
      serviceDescriptions: {
        ...(current.serviceDescriptions || {}),
        [id]: String(value ?? ""),
      },
    }));
    return true;
  };

  const selectBrandHeroAsset = (assetKey) => {
    const key = String(assetKey || "");
    if (!brandBrain.photoLibrary.some((asset) => asset.key === key)) return false;
    setBrandProfile((current) => ({
      ...current,
      heroAssetKey: current.heroAssetKey === key ? "" : key,
    }));
    return true;
  };

  const addBrandFaq = () => {
    const question = newBrandFaqQuestion.trim();
    const answer = newBrandFaqAnswer.trim();
    if (!question || !answer) return false;
    setBrandProfile((current) => ({
      ...current,
      faqs: [
        ...(Array.isArray(current.faqs) ? current.faqs : []),
        {
          id: `brand-faq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          question,
          answer,
          createdAt: new Date().toISOString(),
        },
      ].slice(-12),
    }));
    setNewBrandFaqQuestion("");
    setNewBrandFaqAnswer("");
    return true;
  };

  const removeBrandFaq = (faqId) => {
    setBrandProfile((current) => ({
      ...current,
      faqs: (Array.isArray(current.faqs) ? current.faqs : []).filter(
        (item) => item.id !== faqId
      ),
    }));
    return true;
  };

  const addBrandTestimonial = () => {
    const text = newBrandTestimonialText.trim();
    const attribution = newBrandTestimonialAttribution.trim();
    if (!text) return false;
    setBrandProfile((current) => ({
      ...current,
      testimonials: [
        ...(Array.isArray(current.testimonials) ? current.testimonials : []),
        {
          id: `brand-testimonial-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          text,
          attribution,
          approvedForPublicUse: true,
          approvedAt: new Date().toISOString(),
        },
      ].slice(-12),
    }));
    setNewBrandTestimonialText("");
    setNewBrandTestimonialAttribution("");
    return true;
  };

  const removeBrandTestimonial = (testimonialId) => {
    setBrandProfile((current) => ({
      ...current,
      testimonials: (Array.isArray(current.testimonials)
        ? current.testimonials
        : []
      ).filter((item) => item.id !== testimonialId),
    }));
    return true;
  };

  const openBrandIdentity = () => {
    setTab("Settings");
    go("brandIdentity");
    return true;
  };

  const askBusyAboutBrandIdentity = () => {
    openTalkToBusy(false);
    setTimeout(() => {
      submitBusyCommand({
        text: "Review my Brand & Business Identity. Tell me what BUSY already knows, what is inconsistent or missing, and what I should fill in before asking BUSY to build my website. Do not invent missing business facts.",
      });
    }, 80);
    return true;
  };

  const buildWebsiteFromBrandBrain = () => {
    const next = buildWebsiteDraft({
      brandBrain,
      previousDraft: websiteDraft,
      businessCreationIntelligence,
    });
    setWebsiteDraft(next);
    setWebsiteBuilderNotice(
      brandBrain.websiteReady
        ? "Website draft rebuilt from the latest Brand Brain."
        : "Website draft created with missing business facts left visibly incomplete."
    );
    setTab("Home");
    go("websitePreview");
    return true;
  };

  const applyWebsiteChange = (instruction) => {
    if (!websiteDraft) {
      setWebsiteBuilderNotice("Build the first website draft before changing it.");
      return false;
    }
    const result = applyWebsiteInstruction(websiteDraft, instruction);
    setWebsiteBuilderNotice(result.reason || "");
    if (!result.applied) return false;
    setWebsiteDraft(result.draft);
    return true;
  };

  const openWebsiteBuilder = () => {
    setTab("Home");
    go("websiteBuilder");
    return true;
  };

  const askBusyToBuildWebsite = () => {
    openTalkToBusy(true);
    setTimeout(() => {
      if (!busyCommandStatus || busyCommandStatus === "idle") {
        setWebsiteBuilderNotice('Say “BUSY, build me a website” and BUSY will use the Brand Brain.');
      }
    }, 80);
    return true;
  };

  const askBusyToEditWebsite = () => {
    if (!websiteDraft) return askBusyToBuildWebsite();
    openTalkToBusy(true);
    setTimeout(() => {
      setWebsiteBuilderNotice(
        'Tell BUSY the change, for example “make the main photo bigger” or “make the website feel more premium”.'
      );
    }, 80);
    return true;
  };

  const websitePublishingRequest = async (action, payload = {}) => {
    const token = await ownerAccessToken();
    if (!token) throw new Error("Sign in again before managing website hosting.");
    const businessId = cloudWorkspace?.businessId || "";
    if (!businessId) throw new Error("BUSY needs the business cloud workspace before publishing.");

    const response = await fetchWithTimeout(
      BUSY_WEBSITE_PUBLISH_URL,
      {
        method: "POST",
        headers: {
          apikey: BUSY_AI_TOKEN,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-busy-request-id": busyRequestId(`website-${action}`),
        },
        body: JSON.stringify({
          action,
          businessId,
          ...payload,
        }),
      },
      30000
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        data?.error || `BUSY website publishing returned ${response.status}.`
      );
    }
    return data;
  };

  const refreshWebsitePublishingStatus = async ({ quiet = false } = {}) => {
    if (!ownerSession?.accessToken || !cloudWorkspace?.businessId) {
      if (!quiet) setWebsitePublishingError("Sign in and connect the BUSY cloud workspace first.");
      return false;
    }
    if (!quiet) setWebsitePublishingLoading(true);
    setWebsitePublishingError("");
    try {
      const data = await websitePublishingRequest("status");
      setWebsitePublishingStatus({
        loaded: true,
        role: data?.role || "",
        website: data?.website || null,
        deployments: Array.isArray(data?.deployments) ? data.deployments : [],
        domains: Array.isArray(data?.domains) ? data.domains : [],
        jobs: Array.isArray(data?.jobs) ? data.jobs : [],
        queue: data?.queue || null,
        healthChecks: Array.isArray(data?.healthChecks) ? data.healthChecks : [],
        analytics: data?.analytics || null,
        usage: data?.usage || null,
        signalRuns: Array.isArray(data?.signalRuns) ? data.signalRuns : [],
        enquiryAttributions: Array.isArray(data?.enquiryAttributions)
          ? data.enquiryAttributions
          : [],
        providerConfig: data?.providerConfig || null,
        providerPreflight: data?.providerPreflight || null,
        providerPlatform: data?.providerPlatform || null,
        providerActivation: data?.providerActivation || null,
        publicProfile: data?.publicProfile || null,
      });
      return true;
    } catch (error) {
      setWebsitePublishingError(
        error?.message || "BUSY could not load website publishing status."
      );
      return false;
    } finally {
      if (!quiet) setWebsitePublishingLoading(false);
    }
  };

  const prepareHostedWebsite = async () => {
    if (!websiteDraft) {
      setWebsitePublishingError("Build the website draft before preparing a hosted preview.");
      return false;
    }
    setWebsitePublishingAction("prepare");
    setWebsitePublishingError("");
    setWebsitePublishingNotice("");
    try {
      const result = await websitePublishingRequest("prepare", {
        websiteDraft,
      });
      setWebsitePublishingNotice(
        result?.reused
          ? "This exact website version was already prepared, so BUSY reused the immutable deployment."
          : "BUSY queued this website version for a private hosted preview."
      );
      await refreshWebsitePublishingStatus({ quiet: true });
      setTimeout(() => refreshWebsitePublishingStatus({ quiet: true }), 1200);
      return true;
    } catch (error) {
      setWebsitePublishingError(
        error?.message || "BUSY could not prepare the hosted website preview."
      );
      return false;
    } finally {
      setWebsitePublishingAction("");
    }
  };

  const openHostedWebsitePreview = async (deploymentId) => {
    if (!deploymentId) return false;
    setWebsitePublishingAction(`preview:${deploymentId}`);
    setWebsitePublishingError("");
    try {
      const result = await websitePublishingRequest("preview_url", {
        deploymentId,
      });
      if (!result?.previewUrl) throw new Error("Hosted preview URL is not ready yet.");
      await Linking.openURL(result.previewUrl);
      return true;
    } catch (error) {
      setWebsitePublishingError(
        error?.message || "BUSY could not open the hosted website preview."
      );
      return false;
    } finally {
      setWebsitePublishingAction("");
    }
  };

  const followWebsiteGoLive = () => {
    [1200, 3000, 7000, 15000].forEach((delay) => {
      setTimeout(() => refreshWebsitePublishingStatus({ quiet: true }), delay);
    });
  };

  const publishHostedWebsite = async (deploymentId) => {
    if (!deploymentId) return false;
    setWebsitePublishingAction("publish");
    setWebsitePublishingError("");
    setWebsitePublishingNotice("");
    try {
      await websitePublishingRequest("publish", {
        deploymentId,
        ownerApproved: true,
      });
      setWebsitePublishingNotice(
        "Go Live approved. BUSY is publishing the exact previewed version and will automatically verify its BUSY address, Cloudflare route and live deployment health."
      );
      await refreshWebsitePublishingStatus({ quiet: true });
      followWebsiteGoLive();
      return true;
    } catch (error) {
      setWebsitePublishingError(
        error?.message || "BUSY could not publish that website version."
      );
      return false;
    } finally {
      setWebsitePublishingAction("");
    }
  };

  const confirmPublishHostedWebsite = (deploymentId) => {
    const deployment = websitePublishingView.deployments.find(
      (item) => item.id === deploymentId
    );
    if (!deployment) return false;
    Alert.alert(
      "Put this website version live?",
      `You are approving website v${deployment.version_no} to become public. BUSY will publish exactly this hosted preview. The current live version, if any, will remain available for rollback.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve & go live",
          onPress: () => publishHostedWebsite(deploymentId),
        },
      ]
    );
    return true;
  };

  const rollbackWebsite = async (deploymentId) => {
    if (!deploymentId) return false;
    setWebsitePublishingAction(`rollback:${deploymentId}`);
    setWebsitePublishingError("");
    setWebsitePublishingNotice("");
    try {
      await websitePublishingRequest("rollback", {
        deploymentId,
        ownerApproved: true,
      });
      setWebsitePublishingNotice(
        "Rollback approved. BUSY is restoring that immutable version and re-checking the real public delivery path automatically."
      );
      await refreshWebsitePublishingStatus({ quiet: true });
      followWebsiteGoLive();
      return true;
    } catch (error) {
      setWebsitePublishingError(
        error?.message || "BUSY could not restore that website version."
      );
      return false;
    } finally {
      setWebsitePublishingAction("");
    }
  };

  const confirmRollbackWebsite = (deploymentId, versionNo) => {
    Alert.alert(
      "Restore this previous website?",
      `This will make website v${versionNo || "?"} the public live version again. The current version will stay in deployment history.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve rollback",
          onPress: () => rollbackWebsite(deploymentId),
        },
      ]
    );
    return true;
  };

  const openLiveWebsite = async () => {
    const url =
      websitePublishingView?.primaryPublicAddress?.url ||
      websitePublishingView?.website?.live_url ||
      websitePublishingView?.liveDeployment?.public_url ||
      "";
    if (!url) {
      setWebsitePublishingError("BUSY does not have a live website URL yet.");
      return false;
    }
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      setWebsitePublishingError("This live website URL could not be opened.");
      return false;
    }
  };

  const runWebsiteHealthCheck = async () => {
    if (!websitePublishingView?.liveDeployment) {
      setWebsitePublishingError("Publish a website version before checking the live site.");
      return false;
    }
    setWebsitePublishingAction("health");
    setWebsitePublishingError("");
    setWebsitePublishingNotice("");
    try {
      await websitePublishingRequest("health_check");
      setWebsitePublishingNotice(
        "BUSY checked the live website response and verified which immutable deployment is actually being served."
      );
      await refreshWebsitePublishingStatus({ quiet: true });
      return true;
    } catch (error) {
      setWebsitePublishingError(
        error?.message || "BUSY could not complete the live website health check."
      );
      return false;
    } finally {
      setWebsitePublishingAction("");
    }
  };

  const retryWebsiteRecovery = async () => {
    if (!websitePublishingView?.liveDeployment) {
      setWebsitePublishingError("Publish a website version before running hosting recovery.");
      return false;
    }
    setWebsitePublishingAction("recover");
    setWebsitePublishingError("");
    setWebsitePublishingNotice("");
    try {
      const result = await websitePublishingRequest("recover");
      const actions = Array.isArray(result?.recovery?.actions)
        ? result.recovery.actions
        : [];
      const failed = actions.filter((item) => item?.ok === false);
      setWebsitePublishingNotice(
        failed.length
          ? "BUSY ran the safe recovery checks. Some external delivery checks still need time, so background retries will continue without changing the approved website content."
          : "BUSY rechecked the hosting platform, custom-domain provider state and live website delivery. Background monitoring will continue automatically."
      );
      await refreshWebsitePublishingStatus({ quiet: true });
      followWebsiteGoLive();
      return true;
    } catch (error) {
      setWebsitePublishingError(
        error?.message || "BUSY could not run the safe hosting recovery checks."
      );
      return false;
    } finally {
      setWebsitePublishingAction("");
    }
  };

  const requestWebsiteDomain = async () => {
    const hostname = websiteDomainDraft.trim();
    if (!hostname) return false;
    setWebsitePublishingAction("domain");
    setWebsitePublishingError("");
    try {
      const result = await websitePublishingRequest("request_domain", {
        hostname,
        websiteDraft,
      });
      setWebsitePublishingNotice(
        `Domain verification created. Add TXT record ${result?.verificationName || ""} with the value shown, then check ownership once. After ownership is proved, BUSY will prepare Cloudflare routing and SSL automatically.`
      );
      await refreshWebsitePublishingStatus({ quiet: true });
      return true;
    } catch (error) {
      setWebsitePublishingError(
        error?.message || "BUSY could not start domain verification."
      );
      return false;
    } finally {
      setWebsitePublishingAction("");
    }
  };

  const followCustomDomain = () => {
    [1500, 5000, 12000, 25000].forEach((delay) => {
      setTimeout(() => refreshWebsitePublishingStatus({ quiet: true }), delay);
    });
  };

  const verifyWebsiteDomain = async (domainId) => {
    if (!domainId) return false;
    setWebsitePublishingAction(`verify-domain:${domainId}`);
    setWebsitePublishingError("");
    try {
      const result = await websitePublishingRequest("verify_domain", {
        domainId,
      });
      setWebsitePublishingNotice(
        result?.verified
          ? result?.activation?.error
            ? "Domain ownership is verified. BUSY could not continue the provider step immediately, so the background reconciler will retry safely."
            : "Domain ownership is verified. BUSY has started the Cloudflare hostname, DNS-routing and SSL setup automatically."
          : "The verification TXT record is not visible in public DNS yet. Nothing was changed."
      );
      await refreshWebsitePublishingStatus({ quiet: true });
      if (result?.verified) followCustomDomain();
      return !!result?.verified;
    } catch (error) {
      setWebsitePublishingError(
        error?.message || "BUSY could not verify that domain."
      );
      return false;
    } finally {
      setWebsitePublishingAction("");
    }
  };

  const provisionWebsiteDomain = async (domainId) => {
    if (!domainId) return false;
    setWebsitePublishingAction(`provision-domain:${domainId}`);
    setWebsitePublishingError("");
    setWebsitePublishingNotice("");
    try {
      const result = await websitePublishingRequest("provision_domain", {
        domainId,
      });
      const configured = !!result?.provider?.configured;
      setWebsitePublishingNotice(
        configured
          ? "BUSY refreshed this domain with Cloudflare. Add any DNS records still shown below; BUSY will continue checking routing, SSL and the exact live deployment automatically."
          : "The BUSY-side Cloudflare adapter is ready, but the server connection is not complete yet. No unsafe routing change was made."
      );
      await refreshWebsitePublishingStatus({ quiet: true });
      if (configured) followCustomDomain();
      return configured;
    } catch (error) {
      setWebsitePublishingError(
        error?.message || "BUSY could not prepare external website routing."
      );
      return false;
    } finally {
      setWebsitePublishingAction("");
    }
  };

  const refreshWebsiteSignals = async () => {
    setWebsitePublishingAction("signals");
    setWebsitePublishingError("");
    setWebsitePublishingNotice("");
    try {
      const result = await websitePublishingRequest("refresh_signals");
      const configured = !!result?.signals?.configured;
      setWebsitePublishingNotice(
        configured
          ? "BUSY refreshed the current external website traffic signals and updated the tenant usage rollup."
          : "Real traffic collection is ready on the BUSY side, but Cloudflare analytics credentials are not connected yet. No traffic numbers were invented."
      );
      await refreshWebsitePublishingStatus({ quiet: true });
      return configured;
    } catch (error) {
      setWebsitePublishingError(
        error?.message || "BUSY could not refresh website traffic signals."
      );
      return false;
    } finally {
      setWebsitePublishingAction("");
    }
  };

  const openDefaultWebsiteAddress = async () => {
    const url = websitePublishingView?.defaultAddressState?.address?.url || "";
    if (!url || !websitePublishingView?.canOpenDefaultAddress) return false;
    try {
      await Linking.openURL(url);
      return true;
    } catch (error) {
      setWebsitePublishingError(
        error?.message || "BUSY could not open the default website address."
      );
      return false;
    }
  };

  const openCustomWebsiteDomain = async () => {
    const url = websitePublishingView?.domainState?.publicAddress?.url || "";
    if (!url || !websitePublishingView?.canOpenCustomDomain) return false;
    try {
      await Linking.openURL(url);
      return true;
    } catch (error) {
      setWebsitePublishingError(
        error?.message || "BUSY could not open the custom website domain."
      );
      return false;
    }
  };

  const applyMiniAppsStatus = (payload = {}) => {
    const data = payload?.status || payload;
    const savedPlan = data?.app?.draft_config?.builderPlan || null;
    if (savedPlan) {
      setMiniAppBuilderPlan(savedPlan);
      if (!miniAppBuildBrief && savedPlan?.ownerRequest) {
        setMiniAppBuildBrief(String(savedPlan.ownerRequest));
      }
      if (
        savedPlan?.factAnswers &&
        typeof savedPlan.factAnswers === "object"
      ) {
        setMiniAppFactAnswers((current) => ({
          ...current,
          ...savedPlan.factAnswers,
        }));
      }
    }
    setMiniAppsStatus({
      loaded: true,
      role: data?.role || miniAppsStatus.role || "",
      app: data?.app || null,
      versions: Array.isArray(data?.versions) ? data.versions : [],
      requests: Array.isArray(data?.requests) ? data.requests : [],
      requestLinks: Array.isArray(data?.requestLinks) ? data.requestLinks : [],
      requestCount30: Math.max(0, Number(data?.requestCount30 || 0)),
      guestRequestCount30: Math.max(0, Number(data?.guestRequestCount30 || 0)),
      entrySummary: Array.isArray(data?.entrySummary) ? data.entrySummary : [],
      catalog: Array.isArray(data?.catalog) ? data.catalog : [],
      publicProfile: data?.publicProfile || null,
    });
  };

  const miniAppsRequest = async (
    action,
    payload = {},
    { includeBusiness = true } = {}
  ) => {
    const token = await ownerAccessToken();
    if (!token) throw new Error("Sign in again before using BUSY Apps.");
    const businessId = cloudWorkspace?.businessId || "";
    if (includeBusiness && !businessId) {
      throw new Error("BUSY needs the business cloud workspace before managing your Business App.");
    }

    const response = await fetchWithTimeout(
      BUSY_MINI_APPS_URL,
      {
        method: "POST",
        headers: {
          apikey: BUSY_AI_TOKEN,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-busy-request-id": busyRequestId(`mini-app-${action}`),
        },
        body: JSON.stringify({
          action,
          ...(includeBusiness ? { businessId } : {}),
          ...payload,
        }),
      },
      30000
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        data?.error || `BUSY Apps returned ${response.status}.`
      );
    }
    return data;
  };

  const refreshMiniAppsStatus = async ({ quiet = false } = {}) => {
    if (!ownerSession?.accessToken || !cloudWorkspace?.businessId) {
      if (!quiet) setMiniAppsError("Sign in and connect the BUSY cloud workspace first.");
      return false;
    }
    if (!quiet) setMiniAppsLoading(true);
    setMiniAppsError("");
    try {
      const data = await miniAppsRequest("owner_status");
      applyMiniAppsStatus(data);
      return true;
    } catch (error) {
      setMiniAppsError(error?.message || "BUSY could not load your Business App.");
      return false;
    } finally {
      if (!quiet) setMiniAppsLoading(false);
    }
  };

  const buildMiniAppFromBrandBrain = async () => {
    setMiniAppsAction("build");
    setMiniAppsError("");
    setMiniAppsNotice("");
    try {
      const data = await miniAppsRequest("build_draft", {
        profileDraft: miniAppProfileDraft,
      });
      applyMiniAppsStatus(data);
      setMiniAppsNotice(
        data?.source === "shared_public_profile_plus_owner_draft"
          ? "BUSY rebuilt the Business App draft from the shared public business profile plus your current approved Brand Brain facts."
          : "BUSY created the first Business App draft from your approved public Brand Brain facts."
      );
      return true;
    } catch (error) {
      setMiniAppsError(error?.message || "BUSY could not build the Business App draft.");
      return false;
    } finally {
      setMiniAppsAction("");
    }
  };

  const updateMiniAppFactAnswer = (key, value) => {
    const safeKey = String(key || "").trim();
    if (!safeKey) return false;
    setMiniAppFactAnswers((current) => ({
      ...current,
      [safeKey]: String(value || ""),
    }));
    return true;
  };

  const planMiniAppFromBrief = async (
    brief = miniAppBuildBrief,
    factAnswers = miniAppFactAnswers
  ) => {
    const ownerRequest = String(brief || "").trim();
    if (!ownerRequest) {
      setMiniAppsError(
        "Tell BUSY what you want customers to be able to do in your app."
      );
      return false;
    }
    setMiniAppBuildBrief(ownerRequest);
    setMiniAppsAction("plan-app");
    setMiniAppsError("");
    setMiniAppsNotice("");
    try {
      const data = await miniAppsRequest("plan_app", {
        ownerRequest,
        factAnswers,
        profileDraft: miniAppProfileDraft,
      });
      applyMiniAppsStatus(data);
      setMiniAppBuilderPlan(data?.plan || null);
      if (data?.plan?.factAnswers) {
        setMiniAppFactAnswers((current) => ({
          ...current,
          ...data.plan.factAnswers,
        }));
      }
      setMiniAppsNotice(
        data?.plan?.planner === "ai"
          ? "BUSY turned your request and recorded business facts into a controlled app plan. Review the modules and any missing facts before building."
          : "BUSY created a safe app plan from your request and recorded business facts. Review it before building."
      );
      return !!data?.plan;
    } catch (error) {
      setMiniAppsError(
        error?.message || "BUSY could not create the business app plan."
      );
      return false;
    } finally {
      setMiniAppsAction("");
    }
  };

  const answerMiniAppMissingFacts = async () => {
    const missing = Array.isArray(miniAppBuilderPlan?.missingFacts)
      ? miniAppBuilderPlan.missingFacts
      : [];
    const answered = missing.filter((item) =>
      String(miniAppFactAnswers?.[item.key] || "").trim()
    );
    const approvedGalleryAdded =
      missing.some((item) => item.key === "gallery") &&
      Array.isArray(miniAppProfileDraft?.assets?.gallery) &&
      miniAppProfileDraft.assets.gallery.length > 0;
    if (!answered.length && !approvedGalleryAdded) {
      setMiniAppsError(
        "Answer at least one of BUSY's missing-detail questions first."
      );
      return false;
    }
    const planned = await planMiniAppFromBrief(
      miniAppBuildBrief,
      miniAppFactAnswers
    );
    if (planned) {
      setMiniAppsNotice(
        "BUSY used those answers to update the app plan. Only details still genuinely needed remain below."
      );
    }
    return planned;
  };

  const applyMiniAppPlan = async () => {
    if (!miniAppBuilderPlan) {
      setMiniAppsError("Create an app plan before building the draft.");
      return false;
    }
    if ((miniAppBuilderPlan?.missingFacts || []).length) {
      setMiniAppsError(
        "Answer the remaining BUSY questions before building the private app."
      );
      return false;
    }
    setMiniAppsAction("apply-app-plan");
    setMiniAppsError("");
    setMiniAppsNotice("");
    try {
      const data = await miniAppsRequest("apply_app_plan", {
        ownerRequest: miniAppBuildBrief,
        factAnswers: miniAppFactAnswers,
        plan: miniAppBuilderPlan,
        profileDraft: miniAppProfileDraft,
      });
      applyMiniAppsStatus(data);
      setMiniAppBuilderPlan(data?.plan || miniAppBuilderPlan);

      try {
        const preview = await miniAppsRequest("prepare_preview");
        applyMiniAppsStatus(preview);
        setMiniAppsNotice(
          preview?.reused
            ? "BUSY built the private app and reused the matching immutable customer preview. Nothing is public until you approve Go Live."
            : "BUSY built the private app and prepared an immutable customer preview. Nothing is public until you approve Go Live."
        );
        setTab("Home");
        go("miniAppPreview");
      } catch (previewError) {
        setMiniAppsNotice(
          "BUSY built the private app safely, but the customer preview still needs preparing. The draft remains private and nothing was published."
        );
        setMiniAppsError(
          previewError?.message ||
            "BUSY could not prepare the customer preview yet."
        );
      }
      return true;
    } catch (error) {
      setMiniAppsError(
        error?.message || "BUSY could not build the app from that plan."
      );
      return false;
    } finally {
      setMiniAppsAction("");
    }
  };

  const describeMiniAppByVoice = () => {
    setMiniAppsNotice(
      "Tell BUSY what customers should be able to do. Your voice request will return here as an app plan before anything is published."
    );
    openTalkToBusy(true);
    return true;
  };

  // V3.60: encrypted on-device checkpoint, scoped by authenticated owner and business.
  // No cross-account draft fallbacks and no public/server writes.
  conversationActiveScopeRef.current = String(ownerSession?.userId || "") + ":" + String(cloudWorkspace?.businessId || "");
  conversationActiveBriefRef.current = String(businessCreationBrief || "").trim();
  const conversationResumeKey = ownerSession?.userId && cloudWorkspace?.businessId
    ? `busy-conversation-v360-${ownerSession.userId}-${cloudWorkspace.businessId}`
    : "";
  useEffect(() => {
    let active = true;
    setConversationResumeReady("");
    setBusinessCreationBrief("");
    setConversationResumeNotice("");
    if (!conversationResumeKey) return () => { active = false; };
    SecureStore.getItemAsync(conversationResumeKey).then((raw) => {
      if (!active) return;
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.version === 1 && typeof saved.brief === "string") {
          setBusinessCreationBrief(saved.brief.slice(0, 1000));
          setConversationResumeNotice("Your last private conversation draft has been restored on this device.");
        }
      }
    }).catch(() => {
      if (active) setConversationResumeNotice("Private draft restore is unavailable on this device.");
    }).finally(() => { if (active) setConversationResumeReady(conversationResumeKey); });
    return () => { active = false; };
  }, [conversationResumeKey]);

  useEffect(() => {
    if (!conversationResumeKey || conversationResumeReady !== conversationResumeKey) return;
    const timer = setTimeout(() => {
      const brief = String(businessCreationBrief || "").slice(0, 1000);
      const operation = brief
        ? SecureStore.setItemAsync(conversationResumeKey, JSON.stringify({ version: 1, brief }))
        : SecureStore.deleteItemAsync(conversationResumeKey);
      operation.catch(() => setConversationResumeNotice("Private draft could not be saved on this device."));
    }, 650);
    return () => clearTimeout(timer);
  }, [conversationResumeKey, conversationResumeReady, businessCreationBrief]);

  const conversationCloudArgs = async () => {
    const accessToken = await ownerAccessToken();
    const businessId = String(cloudWorkspace?.businessId || "");
    const userId = String(ownerSession?.userId || "");
    if (!businessId || !userId || !accessToken) throw new Error("Sign in and select your business to sync.");
    return { businessId, userId, accessToken, publishableKey: BUSY_AI_TOKEN, supabaseUrl: BUSY_SUPABASE_URL, fetchImpl: fetchWithTimeout };
  };
  const loadConversationFromCloud = async () => {
    if (conversationCloudBusy) return false;
    setConversationCloudBusy(true);
    try {
      const args = await conversationCloudArgs();
      const scoped = args.userId + ":" + args.businessId;
      const record = await loadCloudConversation(args);
      if (scoped !== conversationActiveScopeRef.current) return false;
      if (!record) {
        setConversationCloudRevision(null);
        setConversationCloudScope(scoped);
        setConversationResumeNotice("No cloud conversation found for this business. Your device draft was left unchanged.");
        return true;
      }
      if (String(businessCreationBrief || "").trim() && businessCreationBrief !== record.brief) {
        Alert.alert("Different private draft found", "The cloud and this device contain different conversations. Replace only this device's text with the cloud version?", [
          {text:"Keep device draft",style:"cancel"},
          {text:"Load cloud version",onPress:()=>{
            if (scoped !== conversationActiveScopeRef.current) return;
            setBusinessCreationBrief(String(record.brief || "").slice(0, 6000));
            setConversationCloudRevision(record.revision);
            setConversationCloudScope(scoped);
            setConversationResumeNotice("Cloud draft loaded. Previous device text was replaced after your confirmation.");
          }},
        ]);
        return false;
      }
      setBusinessCreationBrief(String(record.brief || "").slice(0, 6000));
      setConversationCloudRevision(record.revision);
      setConversationCloudScope(scoped);
      setConversationResumeNotice("Private cloud draft loaded for this business.");
      return true;
    } catch (error) {
      setConversationResumeNotice("Cloud sync unavailable. Your private device draft is still saved locally.");
      return false;
    } finally { setConversationCloudBusy(false); }
  };
  const saveConversationToCloud = async () => {
    if (conversationCloudBusy) return false;
    if (String(businessCreationBrief || "").length > 6000) {
      setConversationResumeNotice("Cloud drafts can contain up to 6000 characters. Shorten this description before saving.");
      return false;
    }
    setConversationCloudBusy(true);
    try {
      const args = await conversationCloudArgs();
      const scoped = args.userId + ":" + args.businessId;
      if (scoped !== conversationActiveScopeRef.current) return false;
      // An unknown server revision must first be checked, not overwritten.
      if (conversationCloudScope !== scoped) {
        const existing = await loadCloudConversation(args);
        if (scoped !== conversationActiveScopeRef.current) return false;
        if (existing) {
          // Do not arm an existing revision merely by detecting it. An owner must
          // explicitly load that cloud draft before future saves may update it.
          setConversationCloudRevision(null);
          setConversationCloudScope("");
          setConversationResumeNotice("A different cloud draft exists. Load and review it before saving. Repeated Save taps cannot overwrite it.");
          return false;
        }
      }
      const result = await saveCloudConversation({
        ...args, brief: businessCreationBrief,
        revision: conversationCloudScope === scoped ? conversationCloudRevision : null,
      });
      if (scoped !== conversationActiveScopeRef.current) return false;
      if (!result.saved) {
        setConversationResumeNotice(result.reason || "Cloud draft conflict. Nothing was overwritten.");
        return false;
      }
      setConversationCloudScope(scoped);
      setConversationCloudRevision(result.record?.revision || 1);
      setConversationResumeNotice("Private draft saved to your business cloud.");
      return true;
    } catch (error) {
      setConversationResumeNotice("Cloud sync unavailable. Your private device draft is still saved locally.");
      return false;
    } finally { setConversationCloudBusy(false); }
  };


  const deleteConversationFromCloud = () => {
    if (conversationCloudBusy) return false;
    Alert.alert("Delete private cloud draft?", "This deletes the saved cloud checkpoint for this business. Your on-device draft will remain unless you clear it separately.", [
      {text:"Cancel",style:"cancel"},
      {text:"Delete cloud draft",style:"destructive",onPress:async()=>{
        setConversationCloudBusy(true);
        try {
          const args = await conversationCloudArgs();
          const scoped = args.userId + ":" + args.businessId;
          if (scoped !== conversationActiveScopeRef.current || conversationCloudScope !== scoped || !conversationCloudRevision) {
            setConversationResumeNotice("Load your current cloud draft before deleting it.");
            return;
          }
          const result=await deleteCloudConversation({...args,revision:conversationCloudRevision});
          if(scoped !== conversationActiveScopeRef.current) return;
          if(!result.deleted) {setConversationResumeNotice(result.reason);return;}
          setConversationCloudRevision(null);
          setConversationCloudScope("");
          setConversationResumeNotice("Cloud draft deleted. Your local draft is unchanged.");
        }catch{setConversationResumeNotice("Cloud draft could not be deleted. Nothing was changed locally.");}
        finally{setConversationCloudBusy(false);}
      }},
    ]);
    return true;
  };

  const suggestBusinessFactsWithAi = async () => {
    if (conversationAiBusy) return false;
    const transcript = String(businessCreationBrief || "").trim().slice(0, 3000);
    if (!transcript) return false;
    setConversationAiBusy(true);
    setConversationAiDraft(null);
    setConversationAiNotice("");
    const scope = String(ownerSession?.userId || "") + ":" + String(cloudWorkspace?.businessId || "");
    try {
      const args = await conversationCloudArgs();
      const response = await fetchWithTimeout(
        BUSY_SUPABASE_URL + "/functions/v1/busy-conversation-extract",
        { method: "POST", headers: { Authorization: "Bearer " + args.accessToken, apikey: BUSY_AI_TOKEN, "Content-Type":"application/json" },
          body: JSON.stringify({ businessId:args.businessId, transcript }) }, 20000
      );
      if (response.status === 429) { setConversationAiNotice("Daily AI review limit reached (20 per business owner). Try again tomorrow or review manually."); return false; }
      if (!response.ok) throw new Error("AI extraction unavailable");
      const raw = await response.json();
      if (scope !== conversationActiveScopeRef.current ||
          transcript !== conversationActiveBriefRef.current.slice(0, 3000)) return false;
      const validation = validateAiConversationDraft({
        extraction:raw, transcript, approved:businessCreationIntelligence?.sharedProfile || {},
      });
      setConversationAiDraft({ ...validation, transcript });
      setConversationAiNotice(Object.keys(validation.fields).length
        ? "AI suggestions are unverified. Review before confirming."
        : "No reliably supported new details detected. Continue manually.");
      return true;
    } catch {
      setConversationAiNotice("AI review unavailable. Manual confirmation still works.");
      return false;
    } finally { setConversationAiBusy(false); }
  };

  const openBusinessCreationJourney = () => {
    setTab("Home");
    go("businessCreationJourney");
    return true;
  };

  const describeBusinessCreationByVoice = () => {
    setBusinessCreationConversationActive(true);
    setBusinessCreationNotice(
      "Tell BUSY what the business does, who it serves and what you want the website, Business App and social presence to achieve. BUSY will keep the existing approval gates."
    );
    openTalkToBusy(true);
    return true;
  };

  const answerBusinessCreationQuestion = (answerOverride = "") => {
    const question = businessCreationJourney?.nextQuestion;
    if (!question) {
      setBusinessCreationNotice("BUSY does not need another important business-profile answer right now.");
      return true;
    }
    if (question.answerType === "navigate_services") {
      setBusinessCreationNotice("Update the public service list, then return here. BUSY will automatically recalculate the launch plan.");
      go("setupServices");
      return true;
    }

    const answer = String(answerOverride || businessCreationAnswer || "").trim();
    if (!answer) {
      setBusinessCreationError("Add the answer before continuing.");
      return false;
    }

    setBusinessCreationError("");
    if (question.key === "businessName") {
      setBusinessName(answer);
    } else if (question.key === "businessType") {
      setTrade(answer);
    } else {
      setBrandProfile((current) => {
        const next = { ...(current || {}) };
        if (question.key === "serviceArea") next.serviceAreaText = answer;
        if (question.key === "description") next.publicDescription = answer;
        if (question.key === "openingHours") next.openingHours = answer;
        if (question.key === "contact") {
          if (answer.includes("@")) next.email = answer;
          else next.phone = answer;
        }
        return next;
      });
    }
    setBusinessCreationAnswer("");
    setBusinessCreationNotice(
      "Saved to the shared business profile. BUSY will use the answer across the website, Business App and future marketing preparation."
    );
    return true;
  };

  const confirmConversationFact = (field, proposedValue) => {
    const allowed = ["businessName", "serviceArea", "email", "phone"];
    if (!allowed.includes(field)) return false;
    const review = reviewConversation({
      turns: [businessCreationBrief],
      approved: businessCreationIntelligence?.sharedProfile || {},
    });
    const candidate = review.draft?.[field];
    const value = String(proposedValue || "").trim();
    if (!candidate || candidate.approved || candidate.value !== value || !value || review.conflicts.some((entry) => entry.field === field)) {
      setBusinessCreationError("That suggestion has changed or is already recorded. Review the description again.");
      return false;
    }
    const existing = businessCreationIntelligence?.sharedProfile || {};
    if (String(existing[field] || "").trim()) {
      setBusinessCreationError("An approved value already exists. Edit it in Business Identity instead.");
      return false;
    }
    if (field === "businessName") setBusinessName(value);
    else setBrandProfile((current) => {
      const next = { ...(current || {}) };
      if (field === "serviceArea") next.serviceAreaText = value;
      if (field === "email") next.email = value;
      if (field === "phone") next.phone = value;
      return next;
    });
    setBusinessCreationError("");
    setBusinessCreationNotice("Confirmed and saved to the shared business profile. Website and Business App publication still require separate approval.");
    return true;
  };

  const propagateBusinessCreationChanges = () => {
    if (!businessCreationJourney?.propagation?.needsPropagation) {
      setBusinessCreationNotice("Website and Business App are already aligned with the current shared business profile.");
      return true;
    }

    const nextWebsite = buildWebsiteDraft({
      brandBrain,
      previousDraft: websiteDraft,
      businessCreationIntelligence,
    });
    setWebsiteDraft(nextWebsite);
    setMiniAppBuildBrief(
      businessCreationBrief ||
        "Refresh the Business App using the latest approved shared business profile."
    );
    setBusinessCreationNotice(
      "BUSY refreshed the private website draft from the latest shared profile and prepared the Business App for replanning. Nothing public changed."
    );
    return true;
  };

  const prepareBusinessCreationJourney = async (briefOverride = "") => {
    // Build a bounded, approved-only fact handoff. The free-form owner request
    // remains a planning instruction, never a replacement for verified facts.
    const approvedCreationHandoff = buildApprovedCreationHandoff({
      approved: businessCreationIntelligence?.sharedProfile || {},
      requestedSurfaces: ["website", "business_app", "social"],
    });
    if (!approvedCreationHandoff.requiresSeparatePublicationApproval ||
        approvedCreationHandoff.unconfirmedConversationIncluded) {
      setBusinessCreationError("BUSY could not validate the approval boundary.");
      return false;
    }
    const brief = String(briefOverride || businessCreationBrief || "").trim();
    if (!brief) {
      setBusinessCreationError("Tell BUSY about the business and what you want it to prepare.");
      return false;
    }
    setBusinessCreationAction("prepare");
    setBusinessCreationError("");
    setBusinessCreationNotice("");
    let websiteOk = false;
    let appOk = false;
    try {
      const nextWebsite = buildWebsiteDraft({
        brandBrain,
        previousDraft: websiteDraft,
        businessCreationIntelligence,
      });
      setWebsiteDraft(nextWebsite);
      websiteOk = true;

      setSocialBrief(brief);
      setSocialSourceContext({
        type: "business_creation",
        label: "Business Creation Journey",
        customerId: "",
        jobId: "",
        service: "",
      });

      setMiniAppBuildBrief(brief);
      appOk = await planMiniAppFromBrief(brief, miniAppFactAnswers);

      setBusinessCreationNotice(
        [
          websiteOk ? "private website draft prepared" : "",
          appOk ? "Business App plan prepared" : "Business App plan needs review",
          "social creation brief prepared",
        ]
          .filter(Boolean)
          .join(" • ") +
          ". Nothing has been published; review each customer-facing surface before approval."
      );
      return websiteOk || appOk;
    } catch (error) {
      setBusinessCreationError(
        error?.message ||
          "BUSY could not finish the coordinated preparation. Any completed private drafts remain safe to review."
      );
      return false;
    } finally {
      setBusinessCreationAction("");
    }
  };

  const toggleMiniAppModule = async (moduleKey, enabled) => {
    setMiniAppsAction(`module:${moduleKey}`);
    setMiniAppsError("");
    try {
      const data = await miniAppsRequest("set_module", {
        moduleKey,
        enabled,
      });
      applyMiniAppsStatus(data);
      setMiniAppsNotice(
        `${enabled ? "Enabled" : "Disabled"} ${moduleKey.replaceAll("_", " ")} in the private Business App draft. Nothing public changed.`
      );
      return true;
    } catch (error) {
      setMiniAppsError(error?.message || "BUSY could not update that Business App module.");
      return false;
    } finally {
      setMiniAppsAction("");
    }
  };

  const prepareMiniAppPreview = async () => {
    setMiniAppsAction("prepare");
    setMiniAppsError("");
    setMiniAppsNotice("");
    try {
      const data = await miniAppsRequest("prepare_preview");
      applyMiniAppsStatus(data);
      setMiniAppsNotice(
        data?.reused
          ? "That exact Business App configuration was already prepared, so BUSY reused the immutable customer preview."
          : "BUSY prepared an immutable Business App customer preview."
      );
      return true;
    } catch (error) {
      setMiniAppsError(error?.message || "BUSY could not prepare the Business App preview.");
      return false;
    } finally {
      setMiniAppsAction("");
    }
  };

  const publishMiniApp = async (versionId, discoverable = false) => {
    setMiniAppsAction("publish");
    setMiniAppsError("");
    setMiniAppsNotice("");
    try {
      const data = await miniAppsRequest("publish", {
        versionId,
        discoverable,
        ownerApproved: true,
      });
      applyMiniAppsStatus(data);
      setMiniAppsNotice(
        discoverable
          ? "The exact previewed Business App version is live and listed in BUSY Apps."
          : "The exact previewed Business App version is live but is not listed in BUSY Apps search."
      );
      return true;
    } catch (error) {
      setMiniAppsError(error?.message || "BUSY could not publish that Business App version.");
      return false;
    } finally {
      setMiniAppsAction("");
    }
  };

  const confirmPublishMiniApp = (versionId) => {
    const version = miniAppsView.versions.find((item) => item.id === versionId);
    if (!version) return false;
    Alert.alert(
      "Put this Business App live?",
      `BUSY will publish exactly the immutable customer preview v${version.version_no}. Choose whether customers should also be able to find it in BUSY Apps search.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Go Live, not listed",
          onPress: () => publishMiniApp(versionId, false),
        },
        {
          text: "Go Live & list",
          onPress: () => publishMiniApp(versionId, true),
        },
      ]
    );
    return true;
  };

  const setMiniAppDiscoverable = async (discoverable) => {
    setMiniAppsAction("discoverability");
    setMiniAppsError("");
    try {
      const data = await miniAppsRequest("set_discoverable", {
        discoverable,
        ownerApproved: true,
      });
      applyMiniAppsStatus(data);
      setMiniAppsNotice(
        discoverable
          ? "Your live Business App is now discoverable in BUSY Apps search."
          : "Your Business App remains live, but BUSY removed it from marketplace search."
      );
      return true;
    } catch (error) {
      setMiniAppsError(error?.message || "BUSY could not change marketplace visibility.");
      return false;
    } finally {
      setMiniAppsAction("");
    }
  };

  const confirmMiniAppDiscoverable = (discoverable) => {
    Alert.alert(
      discoverable ? "List this Business App in BUSY Apps?" : "Remove from BUSY Apps search?",
      discoverable
        ? "Customers using BUSY will be able to find this live app by business name/category."
        : "The app stays live, but it will no longer appear in marketplace search.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: discoverable ? "Approve listing" : "Remove listing",
          onPress: () => setMiniAppDiscoverable(discoverable),
        },
      ]
    );
    return true;
  };

  const rollbackMiniApp = async (versionId) => {
    setMiniAppsAction(`rollback:${versionId}`);
    setMiniAppsError("");
    try {
      const data = await miniAppsRequest("rollback", {
        versionId,
        ownerApproved: true,
      });
      applyMiniAppsStatus(data);
      setMiniAppsNotice("BUSY restored the selected previously published Business App version.");
      return true;
    } catch (error) {
      setMiniAppsError(error?.message || "BUSY could not restore that Business App version.");
      return false;
    } finally {
      setMiniAppsAction("");
    }
  };

  const confirmRollbackMiniApp = (versionId, versionNo) => {
    Alert.alert(
      "Restore this Business App version?",
      `This will make previously published Business App v${versionNo} the live version again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve rollback",
          onPress: () => rollbackMiniApp(versionId),
        },
      ]
    );
    return true;
  };

  const searchBusyApps = async (query = busyAppsSearch) => {
    setBusyAppsSearching(true);
    setMiniAppsError("");
    try {
      const data = await miniAppsRequest(
        "directory_search",
        { query: String(query || "").trim() },
        { includeBusiness: false }
      );
      setBusyAppsResults(Array.isArray(data?.apps) ? data.apps : []);
      return true;
    } catch (error) {
      setMiniAppsError(error?.message || "BUSY could not search the app marketplace.");
      return false;
    } finally {
      setBusyAppsSearching(false);
    }
  };

  const openBusyAppDetail = async (slug, source = "marketplace", intent = "") => {
    if (!slug) return false;
    setMiniAppsAction(`open:${slug}`);
    setMiniAppsError("");
    try {
      const data = await miniAppsRequest(
        "app_detail",
        { slug, source },
        { includeBusiness: false }
      );
      setSelectedBusyAppDetail({
        ...data,
        entryIntent: ["enquiry", "booking_request"].includes(String(intent || ""))
          ? String(intent)
          : "",
      });
      go("busyAppDetail");
      setTimeout(() => loadMyBusyApps({ quiet: true }), 80);
      return true;
    } catch (error) {
      setMiniAppsError(error?.message || "BUSY could not open that Business App.");
      return false;
    } finally {
      setMiniAppsAction("");
    }
  };

  const submitBusyAppRequest = async (requestType, payload = {}) => {
    const slug = selectedBusyAppDetail?.app?.slug || "";
    if (!slug) return false;
    setMiniAppsAction(`request:${requestType}`);
    setMiniAppsError("");
    setMiniAppsNotice("");
    try {
      const data = await miniAppsRequest(
        "submit_request",
        {
          slug,
          requestType,
          payload,
        },
        { includeBusiness: false }
      );
      setMiniAppsNotice(
        requestType === "booking_request"
          ? "Booking request sent through BUSY. It is a request, not a confirmed appointment yet."
          : "Enquiry sent through BUSY."
      );
      await loadMyBusyApps({ quiet: true });
      return !!data?.request;
    } catch (error) {
      setMiniAppsError(error?.message || "BUSY could not send that request.");
      return false;
    } finally {
      setMiniAppsAction("");
    }
  };

  const updateMiniAppRequestStatus = async (requestId, status) => {
    setMiniAppsAction(`request-status:${requestId}`);
    setMiniAppsError("");
    try {
      const data = await miniAppsRequest("update_request_status", {
        requestId,
        status,
      });
      applyMiniAppsStatus(data);
      if (
        selectedMiniAppRequestDetail?.request?.id === requestId &&
        selectedMiniAppRequestRole === "business"
      ) {
        await loadMiniAppRequestDetail(requestId, "business", { navigate: false });
      }
      return true;
    } catch (error) {
      setMiniAppsError(error?.message || "BUSY could not update that request.");
      return false;
    } finally {
      setMiniAppsAction("");
    }
  };

  const loadMyBusyApps = async ({ quiet = false } = {}) => {
    if (!ownerSession?.accessToken) return false;
    if (!quiet) setMyBusyAppsLoading(true);
    try {
      const data = await miniAppsRequest(
        "my_apps",
        {},
        { includeBusiness: false }
      );
      setMyBusyApps(Array.isArray(data?.apps) ? data.apps : []);
      setMyBusyAppRequests(
        Array.isArray(data?.requests) ? data.requests : []
      );
      const activeDeviceCount = Number(data?.notification?.activeDeviceCount || 0);
      setMiniAppsNotificationStatus((current) => ({
        ...current,
        state: activeDeviceCount > 0 ? "enabled" : "disabled",
        activeDeviceCount,
        message:
          activeDeviceCount > 0
            ? `Request notifications are active on ${activeDeviceCount} device${activeDeviceCount === 1 ? "" : "s"}.`
            : current.message || "Request notifications are not enabled on a device yet.",
      }));
      return true;
    } catch (error) {
      setMiniAppsError(
        error?.message || "BUSY could not load My BUSY Apps."
      );
      return false;
    } finally {
      if (!quiet) setMyBusyAppsLoading(false);
    }
  };

  const enableMiniAppNotifications = async () => {
    if (productionBridgeRuntime.expoGoPreview) {
      setMiniAppsNotificationStatus((current) => ({
        ...current,
        state: "needs_development_build",
        message: "Remote request notifications are tested in the native development build. Unread badges still work in Expo Go.",
      }));
      return false;
    }
    if (!productionBridgeRuntime.easProjectId) {
      setMiniAppsNotificationStatus((current) => ({
        ...current,
        state: "needs_eas_project",
        message: "BUSY needs its EAS project link before this device can receive remote push.",
      }));
      return false;
    }
    setMiniAppsNotificationAction("enable");
    try {
      const existing = await Notifications.getPermissionsAsync();
      let permission = existing?.status || "undetermined";
      if (permission !== "granted") {
        const requested = await Notifications.requestPermissionsAsync();
        permission = requested?.status || "denied";
      }
      if (permission !== "granted") throw new Error("Notification permission was not granted.");
      const expoToken = (
        await Notifications.getExpoPushTokenAsync({
          projectId: productionBridgeRuntime.easProjectId,
        })
      )?.data;
      if (!expoToken) throw new Error("Expo did not return a push token.");
      const data = await miniAppsRequest(
        "register_notification_device",
        {
          expoPushToken: expoToken,
          platform: Platform.OS,
          appVersion: APP_VERSION,
          deviceLabel: `${Platform.OS} BUSY Apps device`,
        },
        { includeBusiness: false }
      );
      const activeDeviceCount = Number(data?.notification?.activeDeviceCount || 0);
      setMiniAppsNotificationStatus({
        state: activeDeviceCount > 0 ? "enabled" : "disabled",
        activeDeviceCount,
        token: expoToken,
        message: activeDeviceCount > 0
          ? "This device will receive BUSY Apps request updates."
          : "BUSY could not confirm this notification device.",
      });
      return activeDeviceCount > 0;
    } catch (error) {
      setMiniAppsNotificationStatus((current) => ({
        ...current,
        state: "error",
        message: error?.message || "BUSY could not enable request notifications.",
      }));
      return false;
    } finally {
      setMiniAppsNotificationAction("");
    }
  };

  const disableMiniAppNotifications = async () => {
    if (productionBridgeRuntime.expoGoPreview || !productionBridgeRuntime.easProjectId) return false;
    setMiniAppsNotificationAction("disable");
    try {
      let expoToken = miniAppsNotificationStatus.token || "";
      if (!expoToken) {
        const permission = await Notifications.getPermissionsAsync();
        if (permission?.status !== "granted") throw new Error("This device has no active notification permission.");
        expoToken = (
          await Notifications.getExpoPushTokenAsync({
            projectId: productionBridgeRuntime.easProjectId,
          })
        )?.data || "";
      }
      if (!expoToken) throw new Error("BUSY could not identify this device's push token.");
      const data = await miniAppsRequest(
        "disable_notification_device",
        { expoPushToken: expoToken },
        { includeBusiness: false }
      );
      const activeDeviceCount = Number(data?.notification?.activeDeviceCount || 0);
      setMiniAppsNotificationStatus({
        state: activeDeviceCount > 0 ? "enabled" : "disabled",
        activeDeviceCount,
        token: "",
        message: activeDeviceCount > 0
          ? `Notifications remain active on ${activeDeviceCount} other device${activeDeviceCount === 1 ? "" : "s"}.`
          : "Request notifications are off on this device.",
      });
      return true;
    } catch (error) {
      setMiniAppsNotificationStatus((current) => ({
        ...current,
        message: error?.message || "BUSY could not disable request notifications on this device.",
      }));
      return false;
    } finally {
      setMiniAppsNotificationAction("");
    }
  };

  const loadMiniAppRequestDetail = async (
    requestId,
    role,
    { before = "", append = false, navigate = true } = {}
  ) => {
    if (!requestId) return false;
    const ownerView = role === "business";
    setMiniAppRequestHistoryLoading(true);
    setMiniAppsError("");
    try {
      const data = await miniAppsRequest(
        ownerView ? "owner_request_detail" : "customer_request_detail",
        { requestId, before, limit: 30 },
        { includeBusiness: ownerView }
      );
      if (data?.status) applyMiniAppsStatus(data);
      const detail = data?.detail || null;
      if (!detail?.request?.id) throw new Error("BUSY could not load that request conversation.");
      setSelectedMiniAppRequestRole(ownerView ? "business" : "customer");
      setSelectedMiniAppRequestDetail((current) => {
        if (!append || current?.request?.id !== detail.request.id) return detail;
        const messageMap = new Map(
          [...(current.messages || []), ...(detail.messages || [])].map((item) => [item.id, item])
        );
        return {
          ...detail,
          messages: [...messageMap.values()],
          events: Array.isArray(detail.events) ? detail.events : current.events || [],
        };
      });
      if (ownerView) {
        await refreshMiniAppsStatus({ quiet: true });
      } else {
        await loadMyBusyApps({ quiet: true });
      }
      if (navigate) {
        setTab("Home");
        go("miniAppRequestDetail");
      }
      return true;
    } catch (error) {
      setMiniAppsError(error?.message || "BUSY could not load that request conversation.");
      return false;
    } finally {
      setMiniAppRequestHistoryLoading(false);
    }
  };

  const openOwnerMiniAppRequest = (requestId) =>
    loadMiniAppRequestDetail(requestId, "business");

  const openCustomerMiniAppRequest = (requestId) =>
    loadMiniAppRequestDetail(requestId, "customer");

  const loadEarlierMiniAppRequestMessages = async () => {
    const requestId = selectedMiniAppRequestDetail?.request?.id || "";
    const before = selectedMiniAppRequestDetail?.nextBefore || "";
    if (!requestId || !before) return false;
    return await loadMiniAppRequestDetail(
      requestId,
      selectedMiniAppRequestRole || "customer",
      { before, append: true, navigate: false }
    );
  };

  const toggleBusyAppFavorite = async (slug, favorite) => {
    if (!slug) return false;
    setMiniAppsAction(`favorite:${slug}`);
    setMiniAppsError("");
    try {
      const data = await miniAppsRequest(
        "set_favorite",
        { slug, favorite },
        { includeBusiness: false }
      );
      setMyBusyApps(Array.isArray(data?.apps) ? data.apps : []);
      setSelectedBusyAppDetail((current) =>
        current?.app?.slug === slug
          ? {
              ...current,
              app: { ...current.app, favorite },
            }
          : current
      );
      return true;
    } catch (error) {
      setMiniAppsError(
        error?.message || "BUSY could not update that favourite."
      );
      return false;
    } finally {
      setMiniAppsAction("");
    }
  };

  const sendMiniAppRequestMessage = async (requestId, message) => {
    const body = String(message || "").trim();
    if (!requestId || !body) return false;
    setMiniAppsAction(`owner-message:${requestId}`);
    setMiniAppsError("");
    try {
      const data = await miniAppsRequest("send_request_message", { requestId, message: body });
      applyMiniAppsStatus(data);
      if (
        selectedMiniAppRequestDetail?.request?.id === requestId &&
        selectedMiniAppRequestRole === "business"
      ) {
        await loadMiniAppRequestDetail(requestId, "business", { navigate: false });
      }
      setMiniAppsNotice("Message sent to the customer inside BUSY Apps.");
      return true;
    } catch (error) {
      setMiniAppsError(error?.message || "BUSY could not send that customer message.");
      return false;
    } finally {
      setMiniAppsAction("");
    }
  };

  const replyBusyAppRequestMessage = async (requestId, message) => {
    const body = String(message || "").trim();
    if (!requestId || !body) return false;
    setMiniAppsAction(`customer-message:${requestId}`);
    setMiniAppsError("");
    try {
      await miniAppsRequest("reply_request_message", { requestId, message: body }, { includeBusiness: false });
      await loadMyBusyApps({ quiet: true });
      if (
        selectedMiniAppRequestDetail?.request?.id === requestId &&
        selectedMiniAppRequestRole === "customer"
      ) {
        await loadMiniAppRequestDetail(requestId, "customer", { navigate: false });
      }
      setMiniAppsNotice("Reply sent to the business through BUSY.");
      return true;
    } catch (error) {
      setMiniAppsError(error?.message || "BUSY could not send that reply.");
      return false;
    } finally {
      setMiniAppsAction("");
    }
  };

  const explicitPreferredDate = (value = "") => {
    const text = String(value || "").trim();
    const iso = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
    if (iso) {
      return `${iso[1]}-${String(iso[2]).padStart(2, "0")}-${String(
        iso[3]
      ).padStart(2, "0")}`;
    }
    const uk = text.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](20\d{2})\b/);
    if (uk) {
      return `${uk[3]}-${String(uk[2]).padStart(2, "0")}-${String(
        uk[1]
      ).padStart(2, "0")}`;
    }
    return "";
  };

  const bridgeMiniAppRequestIntoBusy = async (requestId) => {
    if (!requestId) return false;
    setMiniAppsAction(`bridge:${requestId}`);
    setMiniAppsError("");
    setMiniAppsNotice("");
    try {
      const data = await miniAppsRequest("request_bridge_plan", {
        requestId,
      });
      const plan = data?.plan;
      if (!plan?.request || !plan?.customerCandidate) {
        throw new Error("BUSY could not prepare that customer journey.");
      }

      if (plan.existingLink?.customer_record_id) {
        setMiniAppsNotice(
          "That Business App request is already linked to a BUSY customer record, so BUSY did not import it twice."
        );
        await refreshMiniAppsStatus({ quiet: true });
        return true;
      }

      const candidate = plan.customerCandidate;
      const requestRow = plan.request;
      const matched = findCustomerMatch(customers, {
        phone: candidate.phone,
        email: candidate.email,
        name: candidate.name,
      });
      const existing = matched?.customer || null;
      const customerId =
        existing?.id || candidate.idHint || `miniapp-${requestId}`;
      const now = new Date().toISOString();
      const today = dateToISO(new Date());
      const activityKind =
        requestRow.request_type === "booking_request"
          ? "booking"
          : "enquiry";
      const activityTitle =
        requestRow.request_type === "booking_request"
          ? "Booking request received through BUSY Business App"
          : "Enquiry received through BUSY Business App";
      const note =
        candidate.note ||
        (requestRow.request_type === "booking_request"
          ? "Customer requested a booking through BUSY."
          : "Customer sent an enquiry through BUSY.");

      setCustomers((list) => {
        const base =
          existing || {
            id: customerId,
            name: candidate.name || "BUSY customer",
            phone: candidate.phone || "",
            email: candidate.email || "",
            address: "",
            service: candidate.service || "General enquiry",
            lastServiceDate: "",
            lastJobValue: 0,
            contactOk: true,
            source: "BUSY Business App",
            createdAt: now,
            history: [],
            activity: [],
            sourceRecords: [],
          };
        const activity = Array.isArray(base.activity)
          ? base.activity
          : [];
        const sourceRecords = Array.isArray(base.sourceRecords)
          ? base.sourceRecords
          : [];
        return [
          ...list.filter((item) => item.id !== customerId),
          {
            ...base,
            name: candidate.name || base.name,
            phone: candidate.phone || base.phone || "",
            email: candidate.email || base.email || "",
            service: candidate.service || base.service,
            source: base.source || "BUSY Business App",
            lifecycleStatus:
              requestRow.request_type === "booking_request"
                ? "Booking being arranged"
                : "Enquiry",
            currentEnquiryAt:
              requestRow.request_type === "booking_request"
                ? null
                : now,
            nextEnquiryCheckDate:
              requestRow.request_type === "booking_request"
                ? null
                : addDaysFromISO(today, 7),
            lastActivityAt: now,
            lastActivityKind: activityKind,
            sourceRecords: [
              ...sourceRecords.filter(
                (item) =>
                  item.miniAppRequestId !== requestId
              ),
              {
                id: `source-miniapp-${requestId}`,
                source: "BUSY Business App",
                stage:
                  requestRow.request_type === "booking_request"
                    ? "Booking request"
                    : "Enquiry",
                eventDate: String(requestRow.created_at || "").slice(0, 10) || today,
                importedAt: now,
                rawText: note,
                miniAppRequestId: requestId,
              },
            ],
            activity: [
              ...activity.filter(
                (item) =>
                  item.miniAppRequestId !== requestId
              ),
              {
                id: `activity-miniapp-${requestId}`,
                kind: activityKind,
                date: today,
                createdAt: now,
                title: activityTitle,
                note,
                value: "",
                miniAppRequestId: requestId,
              },
            ],
          },
        ];
      });

      let bridgeState = "enquiry_linked";
      let actionRecordId = "";
      if (requestRow.request_type === "booking_request") {
        const preferredDateText =
          requestRow.preferred_date_text ||
          requestRow.payload?.preferredDate ||
          "";
        const bookingDate = explicitPreferredDate(
          preferredDateText
        );
        actionRecordId = `miniapp-booking-${requestId}`;
        bridgeState = "booking_draft";
        setReplyActions((current) => ({
          ...current,
          [customerId]: {
            ...(current[customerId] || {}),
            task: "Review Business App booking request",
            type: "booking",
            origin: "mini-app",
            createdAt: current[customerId]?.createdAt || now,
            done: false,
            details: {
              ...(current[customerId]?.details || {}),
              bookingDate,
              bookingTime: "",
              bookingStatus: "Draft",
              requestedDateText: preferredDateText,
              requestedService:
                requestRow.service_name ||
                requestRow.payload?.service ||
                candidate.service ||
                "",
              sourceMiniAppRequestId: requestId,
              note,
              summary: preferredDateText
                ? `Business App booking request • preferred: ${preferredDateText}`
                : "Business App booking request • date/time still to agree",
            },
          },
        }));
      }

      const linked = await miniAppsRequest("mark_request_linked", {
        requestId,
        customerRecordId: customerId,
        actionRecordId,
        bridgeState,
        metadata: {
          matchedExisting: !!existing,
          matchReason: matched?.reason || "",
        },
      });
      applyMiniAppsStatus(linked);

      setSelectedCustomerId(customerId);
      if (requestRow.request_type === "booking_request") {
        setSelectedReplyActionId(customerId);
        setMiniAppsNotice(
          "BUSY linked this customer and created a Draft booking action. The customer's requested date is preserved, but nothing has been confirmed in the diary yet."
        );
      } else {
        setMiniAppsNotice(
          "BUSY linked this Business App enquiry into the existing customer journey. Follow-up now uses the same BUSY customer record as other enquiries."
        );
      }
      if (
        selectedMiniAppRequestDetail?.request?.id === requestId &&
        selectedMiniAppRequestRole === "business"
      ) {
        await loadMiniAppRequestDetail(requestId, "business", { navigate: false });
      }
      setTimeout(() => saveBusinessCloud({ quiet: true }), 250);
      return true;
    } catch (error) {
      setMiniAppsError(
        error?.message ||
          "BUSY could not link that Business App request into the customer journey."
      );
      return false;
    } finally {
      setMiniAppsAction("");
    }
  };

  const openMiniAppLinkedBooking = (requestId) => {
    const link = miniAppsView?.linkByRequest?.get?.(requestId) || null;
    const customerId = link?.customer_record_id || "";
    if (!customerId || !replyActions?.[customerId]) {
      setMiniAppsError(
        "BUSY could not find the linked booking action for this request."
      );
      return false;
    }
    setSelectedCustomerId(customerId);
    openSavedReplyAction(customerId);
    return true;
  };

  const awardMiniAppLoyaltyStamp = async (requestId) => {
    if (!requestId) return false;
    setMiniAppsAction(`loyalty:${requestId}`);
    setMiniAppsError("");
    setMiniAppsNotice("");
    try {
      const data = await miniAppsRequest("award_loyalty_stamp", {
        requestId,
        reason: "Owner recorded an eligible Business App visit or job",
      });
      applyMiniAppsStatus(data);
      if (
        selectedMiniAppRequestDetail?.request?.id === requestId &&
        selectedMiniAppRequestRole === "business"
      ) {
        setSelectedMiniAppRequestDetail((current) => ({
          ...(current || {}),
          loyaltyProgress:
            data?.loyaltyProgress || current?.loyaltyProgress || null,
        }));
      }
      const progress = data?.loyaltyProgress || {};
      setMiniAppsNotice(
        progress.rewardReached
          ? `Loyalty progress is now ${progress.stamps || 0}/${progress.targetStamps || 0}. The customer has reached the recorded reward: ${progress.reward || "reward"}.`
          : `Recorded one loyalty stamp. Progress is now ${progress.stamps || 0}/${progress.targetStamps || 0}.`
      );
      return true;
    } catch (error) {
      setMiniAppsError(
        error?.message || "BUSY could not record that loyalty stamp."
      );
      return false;
    } finally {
      setMiniAppsAction("");
    }
  };

  const openMiniAppShareCentre = () => {
    if (!miniAppsView?.hasLive || !miniAppsView?.publicSlug) {
      setMiniAppsError("Publish a live Business App before creating customer entry links.");
      return false;
    }
    setTab("Home");
    go("miniAppShareCentre");
    setTimeout(() => refreshMiniAppsStatus({ quiet: true }), 80);
    return true;
  };

  const shareMiniAppCustomerLink = async () => {
    const url = miniAppShareLinks.share;
    if (!url || !miniAppsView?.hasLive) return false;
    try {
      await Share.share({
        title: `${miniAppsView.displayName || "Business"} • Business App`,
        message: `Open ${miniAppsView.displayName || "this business"} Business App from BUSY DOES IT:\n${url}`,
        url,
      });
      setMiniAppsNotice("Customer link opened in the share sheet.");
      return true;
    } catch (error) {
      setMiniAppsError(error?.message || "BUSY could not open the share sheet.");
      return false;
    }
  };

  const openMiniAppCustomerLink = async (source = "share") => {
    const url = source === "qr" ? miniAppShareLinks.qr : miniAppShareLinks.share;
    if (!url) return false;
    try {
      await Linking.openURL(url);
      return true;
    } catch (error) {
      setMiniAppsError(error?.message || "BUSY could not open that customer link.");
      return false;
    }
  };

  const parseMiniAppDeepLink = (value = "") => {
    const raw = String(value || "");
    const prefix = "busydoesit://apps/";
    if (!raw.startsWith(prefix)) return null;
    const rest = raw.slice(prefix.length);
    const [pathPart, queryPart = ""] = rest.split("?");
    let slug = "";
    try {
      slug = decodeURIComponent(String(pathPart || "").split("/")[0] || "");
    } catch {
      slug = String(pathPart || "").split("/")[0] || "";
    }
    if (!slug) return null;
    const query = {};
    queryPart.split("&").filter(Boolean).forEach((pair) => {
      const [rawKey, rawValue = ""] = pair.split("=");
      try {
        query[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue);
      } catch {
        query[rawKey] = rawValue;
      }
    });
    const allowed = new Set(["qr", "share", "web", "deep_link", "marketplace", "my_apps", "notification", "owner_test"]);
    const source = allowed.has(String(query.source || "")) ? String(query.source) : "deep_link";
    const intent = ["enquiry", "booking_request"].includes(String(query.intent || ""))
      ? String(query.intent)
      : "";
    return { slug, source, intent };
  };

  const handleMiniAppDeepLink = async (url) => {
    const target = parseMiniAppDeepLink(url);
    if (!target) return false;
    if (!ownerSession?.accessToken) {
      setPendingMiniAppDeepLink(target);
      setMiniAppsNotice("Sign in to BUSY to open the shared business app.");
      return true;
    }
    setPendingMiniAppDeepLink(null);
    return await openBusyAppDetail(target.slug, target.source, target.intent || "");
  };

  useEffect(() => {
    if (!hydrated) return;
    const onUrl = ({ url }) => {
      if (String(url || "").startsWith("busydoesit://apps/")) {
        handleMiniAppDeepLink(url);
      }
    };
    const subscription = Linking.addEventListener("url", onUrl);
    Linking.getInitialURL()
      .then((url) => {
        if (url && String(url).startsWith("busydoesit://apps/")) {
          handleMiniAppDeepLink(url);
        }
      })
      .catch(() => {});
    return () => subscription?.remove?.();
  }, [hydrated, ownerSession?.accessToken]);

  useEffect(() => {
    if (!hydrated || !ownerSession?.accessToken || !pendingMiniAppDeepLink?.slug) return;
    const target = pendingMiniAppDeepLink;
    const timer = setTimeout(() => {
      setPendingMiniAppDeepLink(null);
      openBusyAppDetail(target.slug, target.source || "deep_link", target.intent || "");
    }, 120);
    return () => clearTimeout(timer);
  }, [hydrated, ownerSession?.accessToken, pendingMiniAppDeepLink?.slug]);

  const openBusyAppsMarketplace = () => {
    setTab("Home");
    go("busyAppsMarketplace");
    setTimeout(() => {
      searchBusyApps("");
      loadMyBusyApps({ quiet: true });
    }, 80);
    return true;
  };

  const openMiniAppBuilder = () => {
    setTab("Home");
    go("miniAppBuilder");
    setTimeout(() => refreshMiniAppsStatus({ quiet: true }), 80);
    return true;
  };

  const openMiniAppPreview = () => {
    if (!miniAppsView.activeConfig) return false;
    setTab("Home");
    go("miniAppPreview");
    return true;
  };

  const openWebsitePublishing = () => {
    if (!websiteDomainDraft && brandProfile.websiteDomain) {
      setWebsiteDomainDraft(brandProfile.websiteDomain);
    }
    setTab("Home");
    go("websitePublishing");
    setTimeout(() => refreshWebsitePublishingStatus({ quiet: true }), 80);
    return true;
  };

  const openCommunicationsHub = () => {
    setTab("Work");
    go("communicationsHub");
    return true;
  };

  const openFollowUpEngine = () => {
    setTab("Work");
    go("followUpEngine");
    return true;
  };

  const openCommunicationThread = (customerId) => {
    const customer = customers.find((item) => item.id === customerId);
    if (!customer) return false;
    setSelectedCustomerId(customerId);
    setTab("Work");
    go("communicationThread");
    return true;
  };

  const openCommunicationInboxItem = (itemId) => {
    const item = inboxPendingItems.find((candidate) => candidate.id === itemId);
    if (!item) return false;
    openInboxItem(itemId);
    return true;
  };

  const askBusyAboutCommunications = () => {
    openTalkToBusy(false);
    setTimeout(() => {
      submitBusyCommand({
        text: "Give me my communications briefing. Who needs attention, who am I waiting to hear back from, which replies are ready to draft, and where should I avoid duplicate chasing?",
      });
    }, 80);
    return true;
  };

  const askBusyAboutFollowUps = () => {
    openTalkToBusy(false);
    setTimeout(() => {
      submitBusyCommand({
        text: "Who should I chase today? Use the Follow-up Engine priorities: separate customers who need a reply, customers worth following up today, and customers I should deliberately leave alone. Explain why and do not send anything.",
      });
    }, 80);
    return true;
  };

  const askBusyAboutCommunication = (customerId = selectedCustomerId) => {
    const customer = customers.find((item) => item.id === customerId);
    if (!customer) return false;
    setSelectedCustomerId(customer.id);
    openTalkToBusy(false);
    setTimeout(() => {
      submitBusyCommand({
        text: `Tell me the communication history with ${customer.name}: what they last said, what I last recorded as sent, whether I am waiting on them, and what the safest next communication step is.`,
      });
    }, 80);
    return true;
  };

  const draftCustomerReply = (customerId = selectedCustomerId) => {
    const customer = customers.find((item) => item.id === customerId);
    const thread = communicationsHub.threads.find(
      (item) => item.customerId === customerId
    );
    if (!customer || !thread || customer.contactOk === false || thread.duplicateGuard?.blocked) {
      return false;
    }
    setSelectedCustomerId(customer.id);
    openTalkToBusy(false);
    setTimeout(() => {
      submitBusyCommand({
        text: `Draft the best reply to ${customer.name} using their latest recorded incoming message, customer journey and previous communication. Keep it natural and concise. Do not send it.`,
      });
    }, 80);
    return true;
  };

  const draftFollowUpCandidate = (customerId) => {
    const candidate = followUpEngine.candidates.find(
      (item) => item.customerId === customerId
    );
    if (!candidate?.draftable) return false;
    return draftCustomerReply(customerId);
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
    brandProfile,
    setBrandProfile,
    newBrandFaqQuestion,
    setNewBrandFaqQuestion,
    newBrandFaqAnswer,
    setNewBrandFaqAnswer,
    newBrandTestimonialText,
    setNewBrandTestimonialText,
    newBrandTestimonialAttribution,
    setNewBrandTestimonialAttribution,
    updateBrandProfile,
    updateBrandServiceDescription,
    selectBrandHeroAsset,
    addBrandFaq,
    removeBrandFaq,
    addBrandTestimonial,
    removeBrandTestimonial,
    openBrandIdentity,
    askBusyAboutBrandIdentity,
    websiteDraft,
    setWebsiteDraft,
    websiteBuilderNotice,
    buildWebsiteFromBrandBrain,
    applyWebsiteChange,
    openWebsiteBuilder,
    askBusyToBuildWebsite,
    askBusyToEditWebsite,
    websitePublishingStatus,
    websitePublishingView,
    websitePublishingLoading,
    websitePublishingAction,
    websitePublishingError,
    websitePublishingNotice,
    websiteDomainDraft,
    setWebsiteDomainDraft,
    refreshWebsitePublishingStatus,
    prepareHostedWebsite,
    openHostedWebsitePreview,
    confirmPublishHostedWebsite,
    confirmRollbackWebsite,
    openLiveWebsite,
    requestWebsiteDomain,
    verifyWebsiteDomain,
    provisionWebsiteDomain,
    refreshWebsiteSignals,
    runWebsiteHealthCheck,
    retryWebsiteRecovery,
    openDefaultWebsiteAddress,
    openCustomWebsiteDomain,
    openWebsitePublishing,
    miniAppsStatus,
    miniAppsView,
    businessCreationIntelligence,
    businessCreationJourney,
    businessCreationBrief,
    setBusinessCreationBrief,
    conversationResumeReady,
    conversationResumeNotice,
    conversationCloudBusy,
    conversationAiBusy,
    conversationAiDraft,
    conversationAiNotice,
    suggestBusinessFactsWithAi,
    loadConversationFromCloud,
    saveConversationToCloud,
    deleteConversationFromCloud,
    businessCreationAnswer,
    setBusinessCreationAnswer,
    businessCreationConversationActive,
    setBusinessCreationConversationActive,
    businessCreationAction,
    businessCreationNotice,
    businessCreationError,
    openBusinessCreationJourney,
    describeBusinessCreationByVoice,
    answerBusinessCreationQuestion,
    confirmConversationFact,
    propagateBusinessCreationChanges,
    prepareBusinessCreationJourney,
    miniAppProfileDraft,
    miniAppsLoading,
    miniAppsAction,
    miniAppsError,
    miniAppsNotice,
    miniAppBuildBrief,
    setMiniAppBuildBrief,
    miniAppBuilderPlan,
    setMiniAppBuilderPlan,
    miniAppFactAnswers,
    setMiniAppFactAnswers,
    updateMiniAppFactAnswer,
    busyAppsSearch,
    setBusyAppsSearch,
    busyAppsResults,
    busyAppsSearching,
    selectedBusyAppDetail,
    myBusyApps,
    myBusyAppRequests,
    myBusyAppsLoading,
    selectedMiniAppRequestRole,
    selectedMiniAppRequestDetail,
    miniAppRequestHistoryLoading,
    miniAppsNotificationStatus,
    miniAppsNotificationAction,
    miniAppShareLinks,
    refreshMiniAppsStatus,
    loadMyBusyApps,
    enableMiniAppNotifications,
    disableMiniAppNotifications,
    openOwnerMiniAppRequest,
    openCustomerMiniAppRequest,
    loadEarlierMiniAppRequestMessages,
    toggleBusyAppFavorite,
    sendMiniAppRequestMessage,
    replyBusyAppRequestMessage,
    bridgeMiniAppRequestIntoBusy,
    openMiniAppLinkedBooking,
    awardMiniAppLoyaltyStamp,
    buildMiniAppFromBrandBrain,
    planMiniAppFromBrief,
    answerMiniAppMissingFacts,
    applyMiniAppPlan,
    describeMiniAppByVoice,
    toggleMiniAppModule,
    prepareMiniAppPreview,
    confirmPublishMiniApp,
    confirmMiniAppDiscoverable,
    confirmRollbackMiniApp,
    searchBusyApps,
    openBusyAppDetail,
    openMiniAppShareCentre,
    shareMiniAppCustomerLink,
    openMiniAppCustomerLink,
    submitBusyAppRequest,
    updateMiniAppRequestStatus,
    openBusyAppsMarketplace,
    openMiniAppBuilder,
    openMiniAppPreview,
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
    businessMemoryPatterns,
    businessMemoryInsights,
    businessMemoryChanges,
    businessMemoryRecentRows,
    businessMemoryHistory,
    businessMemoryLastReviewAt,
    executiveBriefing,
    workCalendarIntelligence,
    dailyCommandCentre,
    communicationsHub,
    followUpEngine,
    brandBrain,
    selectedCommunicationThread,
    selectedFollowUpCandidate,
    dailyCommandCheckpoint,
    markDailyCommandReviewed,
    openDailyCommandItem,
    executiveBookings7,
    executiveBookings30,
    executiveOpenQuoteRows,
    executiveRepeatPool,
    releaseCoreHealth,
    homeCommandCentre,
    productionBridgeRuntime,
    productionReadiness,
    operationalContinuity,
    remotePushStatus,
    remotePushAction,
    calendarOAuthStatus,
    productionBridgeAction,
    googleCalendarSyncStatus,
    googleCalendarExternalEvents,
    googleCalendarConflicts,
    productionWatchStatus,
    refreshProductionBridge,
    registerRemotePushDevice,
    deactivateRemotePushDevice,
    sendRemotePushTest,
    refreshCalendarOAuthStatus,
    startGoogleCalendarOAuth,
    disconnectGoogleCalendarOAuth,
    syncGoogleCalendarNow,
    keepBusyGoogleCalendarTime,
    useGoogleCalendarTime,
    refreshProductionWatchStatus,
    maskPushToken,
    openReleaseCoreIssue,
    openExecutivePriority,
    askBusyAboutOutlook,
    proactiveNotificationsEnabled,
    proactiveNotificationPermission,
    proactiveMorningTime,
    setProactiveMorningTime,
    proactiveQuietHoursEnabled,
    setProactiveQuietHoursEnabled,
    proactiveQuietStart,
    setProactiveQuietStart,
    proactiveQuietEnd,
    setProactiveQuietEnd,
    proactiveJobReminderMinutes,
    setProactiveJobReminderMinutes,
    proactiveScheduledMap,
    proactiveNotificationLog,
    proactiveNotificationCandidates,
    enableProactiveNotifications,
    disableProactiveNotifications,
    refreshProactiveNotifications,
    testProactiveNotification,
    remindProactiveItemLater,
    diaryConnection,
    diaryCalendars,
    diaryEventMap,
    diaryExternalEvents,
    diaryConflicts,
    diarySyncStatus,
    loadDeviceCalendars,
    selectDiaryCalendar,
    disconnectDiary,
    syncDiaryNow,
    keepBusyDiaryTime,
    useCalendarDiaryTime,
    completedServiceMemory,
    quoteValueBandMemory,
    socialChannelMemory,
    repeatIntervalMemory,
    strongestBusinessMemoryPattern,
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
    customerJourneys,
    customerJourneyWarningCount,
    customerJourneyNextActionCount,
    selectedCustomerJourney,
    openCustomer,
    openCustomerJourneyNext,
    askBusyAboutCustomer,
    openCommunicationsHub,
    openFollowUpEngine,
    openCommunicationThread,
    openCommunicationInboxItem,
    askBusyAboutCommunications,
    askBusyAboutFollowUps,
    askBusyAboutCommunication,
    draftCustomerReply,
    draftFollowUpCandidate,
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
    growthProjectCloudArgs: conversationCloudArgs,
    growthProjectFocus,
    setGrowthProjectFocus,
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
    operatorCalendarDate,
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
    askBusyWhyLearningChanged,
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
