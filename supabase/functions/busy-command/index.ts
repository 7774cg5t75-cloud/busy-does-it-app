import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_TRANSCRIPTIONS_URL = "https://api.openai.com/v1/audio/transcriptions";
const DEFAULT_COMMAND_MODEL = "gpt-6-luna";
const DEFAULT_TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";
const MAX_AUDIO_BYTES = 10_000_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-busy-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const intents = [
  "business_summary",
  "business_changes",
  "business_memory",
  "business_identity_summary",
  "website_build",
  "website_edit",
  "open_website",
  "website_hosting_status",
  "website_traffic_status",
  "website_health_check",
  "website_publish_request",
  "website_rollback_request",
  "mini_app_build",
  "mini_app_edit",
  "open_busy_apps",
  "mini_app_status",
  "business_outlook",
  "next_best_action",
  "daily_briefing",
  "customer_journey_summary",
  "communications_summary",
  "customer_communication_summary",
  "customer_reply_draft",
  "calendar_day_summary",
  "calendar_gap",
  "calendar_fit_job",
  "operator_plan",
  "open_today",
  "open_calendar",
  "open_quote_followups",
  "open_repeat_customers",
  "find_more_work",
  "customer_lookup",
  "create_booking",
  "edit_booking",
  "cancel_booking",
  "complete_job",
  "add_customer_note",
  "set_reminder",
  "social_post",
  "reactivation_draft",
  "draft_refinement",
  "quick_capture",
  "open_inbox",
  "open_results",
  "open_settings",
  "unknown",
];

const stepIntentEnum = intents.filter((intent) =>
  !["business_summary", "business_changes", "business_memory", "business_identity_summary", "website_hosting_status", "website_traffic_status", "mini_app_status", "business_outlook", "next_best_action", "daily_briefing", "customer_journey_summary", "communications_summary", "customer_communication_summary", "customer_reply_draft", "calendar_day_summary", "calendar_gap", "calendar_fit_job", "operator_plan", "draft_refinement", "unknown"].includes(intent)
);

const previewRowSchema = {
  type: "object",
  additionalProperties: false,
  required: ["label", "value"],
  properties: {
    label: { type: "string" },
    value: { type: "string" },
  },
};

const planStepSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "intent",
    "label",
    "reason",
    "actionLabel",
    "requiresConfirmation",
    "customerName",
    "service",
    "date",
    "time",
    "value",
    "note",
    "draftText",
    "draftTarget",
  ],
  properties: {
    id: { type: "string" },
    intent: { type: "string", enum: stepIntentEnum },
    label: { type: "string" },
    reason: { type: "string" },
    actionLabel: { type: "string" },
    requiresConfirmation: { type: "boolean" },
    customerName: { type: "string" },
    service: { type: "string" },
    date: { type: "string" },
    time: { type: "string" },
    value: { type: "number", minimum: 0 },
    note: { type: "string" },
    draftText: { type: "string" },
    draftTarget: { type: "string", enum: ["", "social", "reactivation", "follow_up"] },
  },
};

const commandSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "intent",
    "mode",
    "title",
    "response",
    "confidence",
    "needsClarification",
    "clarificationQuestion",
    "requiresConfirmation",
    "actionLabel",
    "customerName",
    "service",
    "date",
    "time",
    "value",
    "note",
    "draftText",
    "draftTarget",
    "previewRows",
    "planSteps",
  ],
  properties: {
    intent: { type: "string", enum: intents },
    mode: { type: "string", enum: ["answer", "action", "plan", "draft", "clarify"] },
    title: { type: "string" },
    response: { type: "string" },
    confidence: { type: "string", enum: ["High", "Medium", "Low"] },
    needsClarification: { type: "boolean" },
    clarificationQuestion: { type: "string" },
    requiresConfirmation: { type: "boolean" },
    actionLabel: { type: "string" },
    customerName: { type: "string" },
    service: { type: "string" },
    date: { type: "string" },
    time: { type: "string" },
    value: { type: "number", minimum: 0 },
    note: { type: "string" },
    draftText: { type: "string" },
    draftTarget: { type: "string", enum: ["", "social", "reactivation", "follow_up"] },
    previewRows: { type: "array", maxItems: 8, items: previewRowSchema },
    planSteps: { type: "array", maxItems: 5, items: planStepSchema },
  },
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function cleanText(value: unknown, max = 8000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanConversation(value: any) {
  return (Array.isArray(value) ? value : [])
    .slice(-12)
    .map((turn: any) => ({
      role: turn?.role === "assistant" ? "assistant" : "user",
      content: cleanText(turn?.content, 1800),
      structured:
        turn?.structured && typeof turn.structured === "object"
          ? {
              intent: cleanText(turn.structured.intent, 80),
              mode: cleanText(turn.structured.mode, 40),
              customerName: cleanText(turn.structured.customerName, 240),
              service: cleanText(turn.structured.service, 240),
              date: cleanText(turn.structured.date, 20),
              time: cleanText(turn.structured.time, 20),
              value: Math.max(0, Number(turn.structured.value) || 0),
              note: cleanText(turn.structured.note, 900),
              draftText: cleanText(turn.structured.draftText, 2200),
              draftTarget: cleanText(turn.structured.draftTarget, 40),
              needsClarification: !!turn.structured.needsClarification,
              clarificationQuestion: cleanText(turn.structured.clarificationQuestion, 500),
            }
          : null,
    }))
    .filter((turn: any) => turn.content);
}

function safeContext(value: any) {
  const context = value && typeof value === "object" ? value : {};
  return {
    today: cleanText(context.today, 20),
    timezone: cleanText(context.timezone, 80) || "Europe/London",
    businessName: cleanText(context.businessName, 200),
    trade: cleanText(context.trade, 200),
    selectedService: cleanText(context.selectedService, 200),
    services: Array.isArray(context.services) ? context.services.slice(0, 30) : [],
    counts: context.counts && typeof context.counts === "object" ? context.counts : {},
    currentSnapshot:
      context.currentSnapshot && typeof context.currentSnapshot === "object"
        ? context.currentSnapshot
        : null,
    previousSnapshot:
      context.previousSnapshot && typeof context.previousSnapshot === "object"
        ? context.previousSnapshot
        : null,
    changesSinceLastConversation: Array.isArray(context.changesSinceLastConversation)
      ? context.changesSinceLastConversation.slice(0, 12)
      : [],
    executiveBriefing:
      context.executiveBriefing && typeof context.executiveBriefing === "object"
        ? {
            confirmed7: context.executiveBriefing.confirmed7 || {},
            confirmed30: context.executiveBriefing.confirmed30 || {},
            warmQuotes: context.executiveBriefing.warmQuotes || {},
            repeatPotential: context.executiveBriefing.repeatPotential || {},
            outlook: context.executiveBriefing.outlook || {},
            loadRows: Array.isArray(context.executiveBriefing.loadRows)
              ? context.executiveBriefing.loadRows.slice(0, 7)
              : [],
            risks: Array.isArray(context.executiveBriefing.risks)
              ? context.executiveBriefing.risks.slice(0, 10)
              : [],
            scenarios: context.executiveBriefing.scenarios || {},
            weeklyReview: context.executiveBriefing.weeklyReview || {},
            priority: context.executiveBriefing.priority || {},
          }
        : null,
    operationalContinuity:
      context.operationalContinuity && typeof context.operationalContinuity === "object"
        ? {
            status: cleanText(context.operationalContinuity.status, 80),
            headline: cleanText(context.operationalContinuity.headline, 400),
            highCount: Math.max(0, Number(context.operationalContinuity.highCount) || 0),
            reviewCount: Math.max(0, Number(context.operationalContinuity.reviewCount) || 0),
            recoveryQueue: Array.isArray(context.operationalContinuity.recoveryQueue)
              ? context.operationalContinuity.recoveryQueue.slice(0, 6)
              : [],
          }
        : null,
    dailyCommandCentre:
      context.dailyCommandCentre && typeof context.dailyCommandCentre === "object"
        ? {
            headline: cleanText(context.dailyCommandCentre.headline, 400),
            status: cleanText(context.dailyCommandCentre.status, 80),
            changes: Array.isArray(context.dailyCommandCentre.changes)
              ? context.dailyCommandCentre.changes.slice(0, 8)
              : [],
            doNow: Array.isArray(context.dailyCommandCentre.doNow)
              ? context.dailyCommandCentre.doNow.slice(0, 4)
              : [],
            laterToday: Array.isArray(context.dailyCommandCentre.laterToday)
              ? context.dailyCommandCentre.laterToday.slice(0, 6)
              : [],
            watch: Array.isArray(context.dailyCommandCentre.watch)
              ? context.dailyCommandCentre.watch.slice(0, 6)
              : [],
          }
        : null,
    communicationsHub:
      context.communicationsHub && typeof context.communicationsHub === "object"
        ? {
            counts:
              context.communicationsHub.counts &&
              typeof context.communicationsHub.counts === "object"
                ? context.communicationsHub.counts
                : {},
            threads: Array.isArray(context.communicationsHub.threads)
              ? context.communicationsHub.threads.slice(0, 30).map((thread: any) => ({
                  customerName: cleanText(thread?.customerName, 240),
                  service: cleanText(thread?.service, 240),
                  lane: cleanText(thread?.lane, 80),
                  contactAllowed: thread?.contactAllowed !== false,
                  latestSummary: cleanText(thread?.latestSummary, 900),
                  duplicateContactBlocked: !!thread?.duplicateContactBlocked,
                  duplicateContactReason: cleanText(thread?.duplicateContactReason, 700),
                  latestIncoming:
                    thread?.latestIncoming && typeof thread.latestIncoming === "object"
                      ? {
                          title: cleanText(thread.latestIncoming.title, 300),
                          body: cleanText(thread.latestIncoming.body, 1200),
                          source: cleanText(thread.latestIncoming.source, 120),
                          createdAt: cleanText(thread.latestIncoming.createdAt, 40),
                        }
                      : null,
                  latestIncomingInterpretation:
                    thread?.latestIncomingInterpretation &&
                    typeof thread.latestIncomingInterpretation === "object"
                      ? {
                          kind: cleanText(thread.latestIncomingInterpretation.kind, 80),
                          label: cleanText(thread.latestIncomingInterpretation.label, 160),
                          confidence: cleanText(thread.latestIncomingInterpretation.confidence, 40),
                          summary: cleanText(thread.latestIncomingInterpretation.summary, 500),
                          suggestedHandling: cleanText(thread.latestIncomingInterpretation.suggestedHandling, 700),
                        }
                      : null,
                  latestOutbound:
                    thread?.latestOutbound && typeof thread.latestOutbound === "object"
                      ? {
                          title: cleanText(thread.latestOutbound.title, 300),
                          body: cleanText(thread.latestOutbound.body, 1200),
                          status: cleanText(thread.latestOutbound.status, 120),
                          createdAt: cleanText(thread.latestOutbound.createdAt, 40),
                        }
                      : null,
                  nextAction:
                    thread?.nextAction && typeof thread.nextAction === "object"
                      ? {
                          kind: cleanText(thread.nextAction.kind, 80),
                          title: cleanText(thread.nextAction.title, 300),
                          body: cleanText(thread.nextAction.body, 700),
                          why: cleanText(thread.nextAction.why, 700),
                        }
                      : null,
                }))
              : [],
            unmatched: Array.isArray(context.communicationsHub.unmatched)
              ? context.communicationsHub.unmatched.slice(0, 10)
              : [],
          }
        : null,
    followUpEngine:
      context.followUpEngine && typeof context.followUpEngine === "object"
        ? {
            counts:
              context.followUpEngine.counts &&
              typeof context.followUpEngine.counts === "object"
                ? context.followUpEngine.counts
                : {},
            candidates: Array.isArray(context.followUpEngine.candidates)
              ? context.followUpEngine.candidates.slice(0, 30).map((item: any) => ({
                  customerName: cleanText(item?.customerName, 240),
                  service: cleanText(item?.service, 240),
                  lane: cleanText(item?.lane, 80),
                  title: cleanText(item?.title, 300),
                  reason: cleanText(item?.reason, 900),
                  actionKind: cleanText(item?.actionKind, 80),
                  preferredChannel: cleanText(item?.preferredChannel, 120),
                  transportState: cleanText(item?.transportState, 160),
                  lastContactDate: cleanText(item?.lastContactDate, 20),
                  nextReviewDate: cleanText(item?.nextReviewDate, 20),
                  draftable: !!item?.draftable,
                  recovery: !!item?.recovery,
                  duplicateContactBlocked: !!item?.duplicateContactBlocked,
                  contactAllowed: item?.contactAllowed !== false,
                }))
              : [],
            providerBridge:
              context.followUpEngine.providerBridge &&
              typeof context.followUpEngine.providerBridge === "object"
                ? {
                    status: cleanText(context.followUpEngine.providerBridge.status, 160),
                    realSendingEnabled:
                      !!context.followUpEngine.providerBridge.realSendingEnabled,
                  }
                : null,
          }
        : null,
    brandIdentity:
      context.brandIdentity && typeof context.brandIdentity === "object"
        ? {
            completeness:
              context.brandIdentity.completeness &&
              typeof context.brandIdentity.completeness === "object"
                ? {
                    score: Math.max(0, Math.min(100, Number(context.brandIdentity.completeness.score) || 0)),
                    label: cleanText(context.brandIdentity.completeness.label, 200),
                    coreMissing: Array.isArray(context.brandIdentity.completeness.coreMissing)
                      ? context.brandIdentity.completeness.coreMissing.slice(0, 12).map((item: any) => cleanText(item, 200))
                      : [],
                  }
                : null,
            websiteReady: !!context.brandIdentity.websiteReady,
            websiteReadinessLabel: cleanText(context.brandIdentity.websiteReadinessLabel, 240),
            missingForWebsite: Array.isArray(context.brandIdentity.missingForWebsite)
              ? context.brandIdentity.missingForWebsite.slice(0, 12).map((item: any) => cleanText(item, 240))
              : [],
            consistencyChecks: Array.isArray(context.brandIdentity.consistencyChecks)
              ? context.brandIdentity.consistencyChecks.slice(0, 12).map((item: any) => ({
                  severity: cleanText(item?.severity, 80),
                  title: cleanText(item?.title, 240),
                  body: cleanText(item?.body, 600),
                }))
              : [],
            profile:
              context.brandIdentity.profile && typeof context.brandIdentity.profile === "object"
                ? {
                    tagline: cleanText(context.brandIdentity.profile.tagline, 300),
                    publicDescription: cleanText(context.brandIdentity.profile.publicDescription, 1200),
                    serviceAreaText: cleanText(context.brandIdentity.profile.serviceAreaText, 500),
                    phone: cleanText(context.brandIdentity.profile.phone, 120),
                    email: cleanText(context.brandIdentity.profile.email, 240),
                    openingHours: cleanText(context.brandIdentity.profile.openingHours, 300),
                    websiteDomain: cleanText(context.brandIdentity.profile.websiteDomain, 300),
                    toneOfVoice: cleanText(context.brandIdentity.profile.toneOfVoice, 200),
                    visualStyle: cleanText(context.brandIdentity.profile.visualStyle, 200),
                    story: cleanText(context.brandIdentity.profile.story, 1500),
                    differentiators: cleanText(context.brandIdentity.profile.differentiators, 1200),
                    facebookUrl: cleanText(context.brandIdentity.profile.facebookUrl, 400),
                    instagramUrl: cleanText(context.brandIdentity.profile.instagramUrl, 400),
                  }
                : null,
            services: Array.isArray(context.brandIdentity.services)
              ? context.brandIdentity.services.slice(0, 20).map((service: any) => ({
                  name: cleanText(service?.name, 240),
                  description: cleanText(service?.description, 700),
                  typicalValue: Math.max(0, Number(service?.typicalValue) || 0),
                  durationHours: Math.max(0, Number(service?.durationHours) || 0),
                }))
              : [],
            assets:
              context.brandIdentity.assets && typeof context.brandIdentity.assets === "object"
                ? {
                    websitePhotoCount: Math.max(0, Number(context.brandIdentity.assets.websitePhotoCount) || 0),
                    heroSelected: !!context.brandIdentity.assets.heroSelected,
                    heroService: cleanText(context.brandIdentity.assets.heroService, 240),
                    approvedTestimonialCount: Math.max(0, Number(context.brandIdentity.assets.approvedTestimonialCount) || 0),
                    faqCount: Math.max(0, Number(context.brandIdentity.assets.faqCount) || 0),
                  }
                : null,
          }
        : null,
    websiteBuilder:
      context.websiteBuilder && typeof context.websiteBuilder === "object"
        ? {
            hasDraft: !!context.websiteBuilder.hasDraft,
            status: cleanText(context.websiteBuilder.status, 80),
            publicStatus: cleanText(context.websiteBuilder.publicStatus, 120),
            generation: Math.max(0, Number(context.websiteBuilder.generation) || 0),
            theme:
              context.websiteBuilder.theme && typeof context.websiteBuilder.theme === "object"
                ? {
                    mood: cleanText(context.websiteBuilder.theme.mood, 80),
                    heroSize: cleanText(context.websiteBuilder.theme.heroSize, 80),
                    layout: cleanText(context.websiteBuilder.theme.layout, 80),
                  }
                : null,
            visibleSections: Array.isArray(context.websiteBuilder.visibleSections)
              ? context.websiteBuilder.visibleSections.slice(0, 12).map((section: any) => ({
                  id: cleanText(section?.id, 80),
                  type: cleanText(section?.type, 80),
                  title: cleanText(section?.title, 240),
                }))
              : [],
            readiness:
              context.websiteBuilder.readiness &&
              typeof context.websiteBuilder.readiness === "object"
                ? {
                    websiteReady: !!context.websiteBuilder.readiness.websiteReady,
                    label: cleanText(context.websiteBuilder.readiness.label, 240),
                    missing: Array.isArray(context.websiteBuilder.readiness.missing)
                      ? context.websiteBuilder.readiness.missing.slice(0, 12).map((item: any) => cleanText(item, 240))
                      : [],
                    identityScore: Math.max(0, Math.min(100, Number(context.websiteBuilder.readiness.identityScore) || 0)),
                  }
                : null,
            publishingEnabled: false,
          }
        : null,
    websitePublishing:
      context.websitePublishing && typeof context.websitePublishing === "object"
        ? {
            publicStatus: cleanText(context.websitePublishing.publicStatus, 160),
            hasHostedPreview: !!context.websitePublishing.hasHostedPreview,
            liveVersion: Math.max(0, Number(context.websitePublishing.liveVersion) || 0),
            previewVersion: Math.max(0, Number(context.websitePublishing.previewVersion) || 0),
            draftChangedSinceHosted: !!context.websitePublishing.draftChangedSinceHosted,
            queueStatus: cleanText(context.websitePublishing.queueStatus, 120),
            customDomainStatus: cleanText(context.websitePublishing.customDomainStatus, 120),
            customDomainRoutingActive: !!context.websitePublishing.customDomainRoutingActive,
            domainOwnership: cleanText(context.websitePublishing.domainOwnership, 120),
            domainRouting: cleanText(context.websitePublishing.domainRouting, 120),
            domainSsl: cleanText(context.websitePublishing.domainSsl, 120),
            healthStatus: cleanText(context.websitePublishing.healthStatus, 120),
            pageCount: Math.max(0, Number(context.websitePublishing.pageCount) || 0),
            seoBasics: cleanText(context.websitePublishing.seoBasics, 160),
            analyticsStatus: cleanText(context.websitePublishing.analyticsStatus, 120),
            trafficRequests30: Math.max(0, Number(context.websitePublishing.trafficRequests30) || 0),
            trafficVisits30: Math.max(0, Number(context.websitePublishing.trafficVisits30) || 0),
            trafficEdgeBytes30: Math.max(0, Number(context.websitePublishing.trafficEdgeBytes30) || 0),
            attributedEnquiries30: Math.max(0, Number(context.websitePublishing.attributedEnquiries30) || 0),
            deliveryProvider: cleanText(context.websitePublishing.deliveryProvider, 120),
            deliveryProviderConfigured: !!context.websitePublishing.deliveryProviderConfigured,
            defaultWebsiteAddress: cleanText(context.websitePublishing.defaultWebsiteAddress, 300),
            defaultWebsiteAddressStatus: cleanText(context.websitePublishing.defaultWebsiteAddressStatus, 120),
            usageDeployments30: Math.max(0, Number(context.websitePublishing.usageDeployments30) || 0),
            usageArtifactBytes30: Math.max(0, Number(context.websitePublishing.usageArtifactBytes30) || 0),
            publicProfileRevision: Math.max(0, Number(context.websitePublishing.publicProfileRevision) || 0),
            publicChangeRequiresOwnerApproval: true,
          }
        : null,
    miniApps:
      context.miniApps && typeof context.miniApps === "object"
        ? {
            status: cleanText(context.miniApps.status, 160),
            hasDraft: !!context.miniApps.hasDraft,
            hasPreview: !!context.miniApps.hasPreview,
            hasLive: !!context.miniApps.hasLive,
            discoverable: !!context.miniApps.discoverable,
            liveVersion: Math.max(0, Number(context.miniApps.liveVersion) || 0),
            previewVersion: Math.max(0, Number(context.miniApps.previewVersion) || 0),
            enabledModules: Array.isArray(context.miniApps.enabledModules)
              ? context.miniApps.enabledModules.slice(0, 20).map((item: any) => cleanText(item, 80))
              : [],
            plannedModules: Array.isArray(context.miniApps.plannedModules)
              ? context.miniApps.plannedModules.slice(0, 20).map((item: any) => cleanText(item, 80))
              : [],
            pendingCustomerRequests: Math.max(0, Number(context.miniApps.pendingCustomerRequests) || 0),
            unlinkedCustomerRequests: Math.max(0, Number(context.miniApps.unlinkedCustomerRequests) || 0),
            linkedCustomerRequests: Math.max(0, Number(context.miniApps.linkedCustomerRequests) || 0),
            businessUnreadMessages: Math.max(0, Number(context.miniApps.businessUnreadMessages) || 0),
            bookingDraftRequests: Math.max(0, Number(context.miniApps.bookingDraftRequests) || 0),
            publicWebReady: !!context.miniApps.publicWebReady,
            webViews30: Math.max(0, Number(context.miniApps.webViews30) || 0),
            actionIntents30: Math.max(0, Number(context.miniApps.actionIntents30) || 0),
            entryAppOpens30: Math.max(0, Number(context.miniApps.entryAppOpens30) || 0),
            customerRequests30: Math.max(0, Number(context.miniApps.customerRequests30) || 0),
            guestRequests30: Math.max(0, Number(context.miniApps.guestRequests30) || 0),
            qrEntries30: Math.max(0, Number(context.miniApps.qrEntries30) || 0),
            shareEntries30: Math.max(0, Number(context.miniApps.shareEntries30) || 0),
            publicSlug: cleanText(context.miniApps.publicSlug, 160),
            arbitraryBespokeCodeSupported: false,
            publicChangeRequiresOwnerApproval: true,
          }
        : null,
    businessMemory:
      context.businessMemory && typeof context.businessMemory === "object"
        ? {
            lastReviewedAt: cleanText(context.businessMemory.lastReviewedAt, 40),
            strongestPattern:
              context.businessMemory.strongestPattern &&
              typeof context.businessMemory.strongestPattern === "object"
                ? context.businessMemory.strongestPattern
                : null,
            patterns: Array.isArray(context.businessMemory.patterns)
              ? context.businessMemory.patterns.slice(0, 12)
              : [],
            changes: Array.isArray(context.businessMemory.changes)
              ? context.businessMemory.changes.slice(0, 8)
              : [],
            insights: Array.isArray(context.businessMemory.insights)
              ? context.businessMemory.insights.slice(0, 8)
              : [],
            recent30Days: Array.isArray(context.businessMemory.recent30Days)
              ? context.businessMemory.recent30Days.slice(0, 8)
              : [],
          }
        : null,
    activeWorkGoal:
      context.activeWorkGoal && typeof context.activeWorkGoal === "object"
        ? context.activeWorkGoal
        : null,
    calendarIntelligence:
      context.calendarIntelligence && typeof context.calendarIntelligence === "object"
        ? {
            capacityHours: Math.max(0, Number(context.calendarIntelligence.capacityHours) || 0),
            days: Array.isArray(context.calendarIntelligence.days)
              ? context.calendarIntelligence.days.slice(0, 45)
              : [],
          }
        : null,
    nextBookings: Array.isArray(context.nextBookings) ? context.nextBookings.slice(0, 12) : [],
    dueQuoteCustomers: Array.isArray(context.dueQuoteCustomers)
      ? context.dueQuoteCustomers.slice(0, 10)
      : [],
    quietEnquiryCustomers: Array.isArray(context.quietEnquiryCustomers)
      ? context.quietEnquiryCustomers.slice(0, 10)
      : [],
    customers: Array.isArray(context.customers) ? context.customers.slice(0, 60) : [],
  };
}

async function transcribeAudio(file: File) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
  if (!file.size || file.size > MAX_AUDIO_BYTES) {
    throw new Error("Voice command is empty or too large.");
  }
  const form = new FormData();
  form.append("file", file, file.name || "busy-command.m4a");
  form.append("model", Deno.env.get("OPENAI_TRANSCRIBE_MODEL") || DEFAULT_TRANSCRIBE_MODEL);
  form.append("response_format", "json");

  const response = await fetch(OPENAI_TRANSCRIPTIONS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  const payload: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Transcription failed with ${response.status}.`);
  }
  const text = cleanText(payload?.text, 4000);
  if (!text) throw new Error("BUSY could not hear a usable voice command.");
  return text;
}

function operatorPrompt(text: string, context: any, conversation: any[]) {
  return `You are BUSY Operator, the conversational operating layer for BUSY DOES IT, a UK small-business assistant.

Current owner message:
"${text}"

Today is ${context.today || "not supplied"} in ${context.timezone || "Europe/London"}.

Conversation so far:
${JSON.stringify(conversation)}

Use ONLY the supplied conversation and business context. Never invent a customer, booking, quote, result, date, value or business change.

Your job is conversational:
- Resolve short follow-ups such as "John", "Friday afternoon", "yes, that one", "make it friendlier", "shorter", "what next?" from the recent conversation when the reference is clear.
- If a materially required detail is missing or there are multiple plausible customers, do NOT fail generically. Set needsClarification=true, mode="clarify", and ask ONE concise question.
- When the owner asks for a goal that needs several sensible moves (for example "I need two jobs next Thursday"), use intent="operator_plan", mode="plan", and return 2-5 ordered planSteps.
- When refining or creating wording, use mode="draft", put the actual editable wording in draftText, and set draftTarget.
- Short corrections such as "actually make it 3pm", "move it to Friday", "make the value £350", "yes, John Smith" or "add that as a note" should reuse the most recent clear customer/booking/draft reference from conversation instead of forcing the owner to repeat it.
- When the owner changes one field of the booking currently under discussion, preserve the other known customer/date/time/value fields unless the owner explicitly changes them.
- When asked "what changed?", use changesSinceLastConversation unless the owner explicitly asks what BUSY has learned or why recommendations changed; then use businessMemory and intent="business_memory".
- For business_memory, clearly separate recorded facts from inferred patterns. Mention sample size/confidence and ranking effect where relevant. If businessMemory.changes is empty, explain the current strongest pattern without claiming a new change.
- For business_identity_summary, use brandIdentity only for public-brand facts and website readiness. Clearly distinguish recorded fields from missing fields. Never invent a phone number, email, service area, business story, testimonial, service description, opening hours, brand colour or public profile URL.
- For "build me a website", "make me a website", "create my website" or equivalent, use intent="website_build", mode="action", requiresConfirmation=false, actionLabel="Build website draft". This creates an internal draft only. Never imply it is published, hosted or attached to a domain.
- For changes to an existing website draft such as "make it more premium", "make the main photo bigger", "hide the testimonials", or "bring the gallery back", use intent="website_edit", mode="action", requiresConfirmation=false, actionLabel="Apply website change", and copy the owner's requested change concisely into note. Do not invent a different change. If no website draft exists, prefer website_build when the request can be satisfied by creating the first draft.
- For "show/open/preview my website", use intent="open_website", mode="action", requiresConfirmation=false, actionLabel="Open website preview". The editor preview is internal; hosted preview and live deployment are separate states.
- Website build/edit actions may use brandIdentity and websiteBuilder context. V3.38 delivery, hosting and real-signal state is in websitePublishing.
- For "put my website live", "publish my website", "go live" or equivalent, use intent="website_publish_request", mode="action", requiresConfirmation=false, actionLabel="Review Go Live". This intent ONLY opens the Website Publishing approval flow. Never claim publication happened from the voice command itself.
- For "roll back my website", "restore the old website/version" or equivalent, use intent="website_rollback_request", mode="action", requiresConfirmation=false, actionLabel="Review rollback". This ONLY opens version history and approval.
- For questions such as "is my website live?", "what version is live?", "what changed?", "is hosting ready?", "is my domain really live?", "is SSL active?", "are the SEO basics ready?", or "what is happening with my website publish?", use intent="website_hosting_status", mode="answer" and use websitePublishing. Keep editor draft, hosted preview and live version distinct; keep domain ownership, routing and SSL distinct.
- For questions such as "how many visits has my website had?", "has anyone visited my site?", "how much website traffic have I had?", "did the website generate any enquiries?", "what traffic did Cloudflare record?", or "how much bandwidth is the website using?", use intent="website_traffic_status", mode="answer". Use only websitePublishing traffic/usage fields. A Cloudflare visit is not a unique person; do not rename it "unique visitors". If deliveryProviderConfigured=false or analyticsStatus is foundation with zero provider evidence, say real traffic collection is awaiting provider setup rather than interpreting zero as proven zero visitors.
- For "check my live website", "is my website healthy?", "check whether the website is serving the right version" or equivalent, use intent="website_health_check", mode="action", requiresConfirmation=false, actionLabel="Check live website". This is a read/verification action only; it must not publish or change public content.
- For "build me an app", "make my business app" or equivalent, use intent="mini_app_build", mode="action", requiresConfirmation=false, actionLabel="Create app plan". Copy the owner's requested app outcome/features concisely into note so the Business App Builder can plan from the exact voice/text request. BUSY assembles only the controlled reusable module set; never imply arbitrary bespoke code generation. This command creates a reviewable plan/private draft path only and never publishes.
- For "change/edit my app", "add/remove a module" or equivalent, use intent="mini_app_edit", mode="action", requiresConfirmation=false, actionLabel="Review app change". Copy the requested app change concisely into note. The builder only supports the tested module catalogue and must surface planned/unsupported capabilities rather than pretending they work.
- For "open apps", "search apps", "find Jenny's app" or equivalent marketplace navigation, use intent="open_busy_apps", mode="action", requiresConfirmation=false, actionLabel="Open BUSY Apps".
- For "is my app live?", "is my app listed?", "what is in my app?", "how many customer requests are waiting?" or equivalent, use intent="mini_app_status", mode="answer" and use miniApps only.
- Publishing a Mini App or changing marketplace discoverability remains an explicit owner approval action in the Mini App Builder.
- A public website change always requires the explicit owner approval gate in Website Publishing. Never claim DNS changed, a custom domain is routed, SSL is active, or a domain was purchased unless websitePublishing explicitly says so.
- Never claim causation from attributed social outcomes or small samples.
- For business_outlook, never collapse confirmed work and predicted pipeline into one factual number. State confirmed value separately, label forecast ranges as planning estimates, mention forecast confidence, and explain that quiet/light days are scheduled-load observations rather than guaranteed spare capacity.
- For next_best_action, give ONE practical next move using the live customer-work priority first. If operationalContinuity has a high-severity recovery item that can make the records unreliable, mention that constraint. Do not manufacture work just to sound useful.
- For daily_briefing, use dailyCommandCentre as the primary source. Summarise in three short parts: Do now, Later today, Watch. If a lane is empty, say so rather than inventing work. Mention changes only when dailyCommandCentre.changes contains real saved-signal changes.
- For customer_journey_summary, find exactly one saved customer and use that customer's journey object as the primary source. Summarise what has happened, the current stage/action, communication already recorded, stalled signals, and ONE next step. Do not imply that a prepared/simulated message was actually delivered unless the saved status says it was recorded as sent.
- For communications questions, use communicationsHub as the primary source. Treat lanes literally: Needs attention means owner review/reply is needed; Awaiting customer means the latest recorded real contact is outbound and BUSY should avoid another chase; Draft ready means a safe next communication can be prepared; Done means no communication action needs forcing.
- For chase/follow-up prioritisation such as "who should I chase today?", use followUpEngine as the primary source and preserve its lanes literally: Reply now → Follow up today → Waiting → No chase / Do not contact. Do not promote a Waiting customer into a chase merely to create activity. Warm recovery opportunities are existing enquiries/quotes only; do not describe them as guaranteed wins.
- Message interpretation is deterministic guidance, not certainty. If latestIncomingInterpretation confidence is Low or Medium, phrase it as "looks like" or "appears to" rather than asserting intent as fact.
- Never recommend another chase when duplicateContactBlocked=true unless the owner explicitly says new information has arrived outside BUSY.
- For customer_reply_draft, use exactly one matched communicationsHub thread plus the matching customers[].journey. If contactAllowed=false or duplicateContactBlocked=true, do not create draftText; explain why in mode="answer". Otherwise use mode="draft", draftTarget="follow_up", put ready-to-edit wording in draftText, and never claim it was sent. If brandIdentity.profile.toneOfVoice is recorded, use it as the default writing style without inventing any missing brand or customer fact.
- For calendar questions, use calendarIntelligence.days as the source of truth for scheduled load, open-capacity estimates, follow-ups, external commitments and potential overlaps. Open-capacity hours are planning guidance, never a guaranteed bookable slot.

Supported direct intents:
- business_summary: factual answer from current context.
- business_changes: factual comparison using changesSinceLastConversation.
- business_memory: explain what BUSY has learned over time, why an optional recommendation has moved up/down, or what evidence currently has the strongest influence. Use businessMemory only.
- business_identity_summary: answer questions such as "what does BUSY know about my business?", "what is missing from my brand?", "am I ready to build my website?", or "review my business identity". Use brandIdentity only for public identity/readiness, name the missing/core consistency items explicitly, and never fill gaps with guesses.
- website_build: create/rebuild an internal website draft from the recorded Brand Brain; action only, not publishing.
- website_edit: apply a safe conversational change to the saved internal website draft; put the exact requested change in note.
- open_website: open the saved internal Website Builder/preview; do not claim it is public.
- website_hosting_status: explain the current draft/hosted-preview/live state using websitePublishing; distinguish draft, preview and live, and report health/domain/SEO/provider/default-address state only from recorded fields.
- website_traffic_status: report only recorded websitePublishing traffic, usage and attributed-enquiry evidence. Keep HTTP requests, Cloudflare visits, transfer bytes and genuine attributed enquiries distinct. Never infer people/customers from request counts.
- website_health_check: trigger a live reachability/deployment-marker verification; it is safe and non-public-changing.
- website_publish_request: open the Go Live review flow for the exact prepared version; do not publish directly.
- website_rollback_request: open version history/rollback review; do not change the live site directly.
- mini_app_build: build/rebuild the private BUSY Mini App draft from approved public business facts and the controlled module catalogue; do not publish it.
- mini_app_edit: open the controlled Mini App Builder; do not invent unsupported modules.
- open_busy_apps: open the BUSY Apps marketplace/directory.
- mini_app_status: answer from miniApps state only; distinguish draft, prepared preview, live and marketplace discoverability. Also answer owner questions such as "any new app requests?", "has anyone requested a booking through my app?", "what Mini App requests still need reviewing?" or "are customers messaging through my app?" from pendingCustomerRequests/unlinkedCustomerRequests/linkedCustomerRequests/businessUnreadMessages/bookingDraftRequests. Treat businessUnreadMessages as customer-originated conversation activity that still needs the business to open/read it. For questions such as "is anyone using my QR code?", "how are people opening my app?" or "did the shared link get used?", use publicWebReady/webViews30/actionIntents30/entryAppOpens30/customerRequests30/guestRequests30/qrEntries30/shareEntries30. guestRequests30 is the number of genuine requests submitted through the public web guest flow. Keep public web views, customer action attempts, authenticated in-app opens and genuine requests distinct; never rename a view or action attempt as an enquiry or booking. A guest browser challenge reduces automated spam but does not prove ownership of the email address or phone number typed by the customer. A booking draft is not a confirmed booking.
- business_outlook: answer questions about today, next week, the next 30 days, pipeline, capacity load, forecast range, risk radar, scenarios or whether the business is on track. Use executiveBriefing and clearly separate confirmed values from forecast ranges.
- next_best_action: answer "what should I do now/next?" with one record-backed priority. This is an answer, not blanket action authority.
- daily_briefing: answer requests like "brief me", "what matters today?", "what do I need to do now/later/watch?" from dailyCommandCentre. Keep the lane order exactly Do now → Later today → Watch and never manufacture a lane item.
- customer_journey_summary: answer questions like "what has happened with John?", "where are we with Sarah?", "when did I last contact them?", or a full customer briefing. customerName must exactly match one saved customer; use customers[].journey, separate recorded communication from prepared wording, and finish with the journey.nextAction recommendation.
- communications_summary: answer "who needs a reply?", "who am I waiting to hear back from?", "what communication needs attention?" from communicationsHub lanes and counts. For "who should I chase today?" or equivalent prioritisation, use followUpEngine and keep Reply now / Follow up today separate from Waiting. Mention unmatched incoming separately when present.
- customer_communication_summary: answer "what did Sarah last say?", "when did I last contact John?", or "where are we in the conversation?" using exactly one communicationsHub thread. customerName must exactly match that saved thread.
- customer_reply_draft: draft a contextual reply to exactly one saved customer using their latest incoming message, communication history and journey. Set mode="draft", draftTarget="follow_up" and customerName. Never send it and never draft around a duplicate-contact/contact-preference block.
- calendar_day_summary: answer "what have I got [day]?" or "how busy is [day]?" from one resolved calendarIntelligence day. Include booked jobs/value, scheduled hours, estimated open hours, follow-ups, external commitments and conflicts when relevant.
- calendar_gap: answer "where have I got a gap?" with the earliest sensible future Open/Light day from calendarIntelligence.days, excluding days with conflicts. Mention a supplied fillCandidate only as a suggestion, never as a booked job.
- calendar_fit_job: answer whether a requested day appears to have planning capacity for another job. Compare estimatedOpenHours with the requested/inferred service durationHours when available. If no service/duration is known, state the open-hours estimate and ask what kind of job rather than claiming it fits.
- operator_plan: 2-5 sequenced safe steps.
- open_today, open_calendar, open_quote_followups, open_repeat_customers, find_more_work, customer_lookup.
- create_booking: confirm a new BUSY booking for one saved customer. MUST require confirmation and needs an exact customer, date and time. Value is optional.
- edit_booking: change the date, time and/or value of one currently open booking. MUST require confirmation and preview old → new values.
- cancel_booking: cancel one currently open booking. MUST require confirmation and preview the existing booking.
- complete_job: mark one currently open booked job complete. MUST require confirmation and preview the customer/value/note.
- add_customer_note: append a note to one saved customer history. MUST require confirmation and put the note in note.
- set_reminder: create/update a follow-up reminder only when that customer does not have another saved quote/booking action that would be overwritten. MUST require confirmation and needs a date.
- social_post: prepare/open a social draft only; never publish.
- reactivation_draft: prepare previous-customer wording only; never send.
- draft_refinement: refine the most recent relevant draft in conversation; preserve draftTarget.
- quick_capture, open_inbox, open_results, open_settings.
- unknown only when you truly cannot safely infer the request even after considering conversation.

Planning rules:
1. Real customer obligations and warm existing demand outrank optional marketing.
2. Prefer £0/low-cost moves before paid advertising.
3. Do not create a plan step that claims a customer was contacted, a post was published or money was spent.
4. Each planStep must be independently safe and executable through one supported direct intent. Do not use operator_plan inside planSteps.
5. Any record-changing plan step (create/edit/cancel booking, complete job, add note or set reminder) requiresConfirmation=true. Navigation/draft steps do not.
6. If a plan mentions advertising, the plan may recommend opening find_more_work, but it must not imply spend authority.

Draft rules:
1. draftText must be ready-to-edit wording, not a description of a draft.
2. If the owner says "make that friendlier/shorter/less salesy", locate the most recent assistant structured draftText and revise it.
3. A social draft can be prepared but not published. A reactivation/follow-up draft can be prepared but not sent.
4. If there is no previous draft to refine, ask which wording they mean.

Customer/date rules:
1. When a customer is required, customerName must exactly match ONE saved customer in context.
2. If first-name matching is ambiguous, ask which person.
3. Resolve relative dates against today's supplied date when confidently possible.
4. create_booking requires a customer, date and time. Ask one focused question for whichever is missing.
5. edit_booking, cancel_booking and complete_job require an open saved booking for that customer. If none exists, explain and do not invent one.
6. edit_booking must include at least one changed date, time or value. Preserve unchanged known booking fields.
7. add_customer_note requires non-empty note text.
8. set_reminder requires a date. If the customer context shows another saved actionType such as a quote or booking, do not claim the reminder can overwrite it; explain that the existing customer work must be reviewed first.
9. open_calendar can carry a resolved date so BUSY opens that exact day. Resolve "today", "tomorrow", weekdays and clear relative dates against context.today.
10. calendar_day_summary and calendar_fit_job should carry the resolved date in date. calendar_gap should carry the recommended gap date when one is clear.
11. For calendar_fit_job, put the relevant service name in service when the owner named one or when the current conversation unambiguously supplies it.
12. customer_journey_summary requires one unambiguous saved customer. If the name is missing or ambiguous, ask one short clarification question rather than summarising the wrong customer.
13. When using customers[].journey, treat stalledSignals as deterministic saved-state warnings and nextAction as the recommended next step; do not invent a second conflicting next step.
14. customer_communication_summary and customer_reply_draft require one unambiguous saved customer whose name exactly matches both the customer context and Communications Hub thread. Ask one concise clarification if needed.
15. For "what did they last say?", use latestIncoming.body only. Do not substitute an internal note, prepared draft or outbound message.
16. For "when did I last contact them?", use latestOutbound only when its status/title shows contact was recorded as sent; prepared wording is not contact.

Preview rules:
- For any record-changing action, previewRows should clearly show the fields that would change.
- For plans, previewRows may summarise goal/constraints.
- Keep previewRows empty for ordinary answers when not useful.

Safety:
- Conversation never grants blanket authority.
- Customer messages, public publishing and advertising spend remain outside this router's authority.
- Do not treat phrases like "go ahead with everything" as permission to publish/send/spend.
- Be concise, practical and specific.

Business context:
${JSON.stringify(context)}`;
}

async function routeOperator(text: string, context: any, conversation: any[]) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
  const model = Deno.env.get("OPENAI_COMMAND_MODEL") || DEFAULT_COMMAND_MODEL;

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      reasoning: { effort: "low" },
      input: operatorPrompt(text, context, conversation),
      text: {
        format: {
          type: "json_schema",
          name: "busy_operator",
          strict: true,
          schema: commandSchema,
        },
      },
      max_output_tokens: 2600,
      store: false,
    }),
  });

  const payload: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || `OpenAI operator routing failed with ${response.status}.`);
  }

  const outputText =
    typeof payload?.output_text === "string"
      ? payload.output_text
      : Array.isArray(payload?.output)
      ? payload.output
          .flatMap((item: any) => (Array.isArray(item?.content) ? item.content : []))
          .filter((item: any) => item?.type === "output_text")
          .map((item: any) => item.text || "")
          .join("")
      : "";

  if (!outputText) throw new Error("BUSY received no operator interpretation.");

  let parsed: any;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new Error("BUSY could not parse the operator interpretation.");
  }

  if (!intents.includes(parsed?.intent)) parsed.intent = "unknown";
  parsed.title = cleanText(parsed?.title, 180) || "BUSY Operator";
  parsed.response = cleanText(parsed?.response, 1400) || "BUSY understood the request.";
  parsed.actionLabel = cleanText(parsed?.actionLabel, 120) || "Continue";
  parsed.customerName = cleanText(parsed?.customerName, 240);
  parsed.service = cleanText(parsed?.service, 240);
  parsed.date = cleanText(parsed?.date, 20);
  parsed.time = cleanText(parsed?.time, 20);
  parsed.note = cleanText(parsed?.note, 900);
  parsed.draftText = cleanText(parsed?.draftText, 2200);
  parsed.value = Math.max(0, Number(parsed?.value) || 0);
  parsed.confidence = ["High", "Medium", "Low"].includes(parsed?.confidence)
    ? parsed.confidence
    : "Low";
  parsed.mode = ["answer", "action", "plan", "draft", "clarify"].includes(parsed?.mode)
    ? parsed.mode
    : "answer";
  parsed.needsClarification = !!parsed?.needsClarification;
  parsed.clarificationQuestion = cleanText(parsed?.clarificationQuestion, 500);
  parsed.requiresConfirmation = [
    "create_booking",
    "edit_booking",
    "cancel_booking",
    "complete_job",
    "add_customer_note",
    "set_reminder",
  ].includes(parsed.intent);
  if (parsed.needsClarification) {
    parsed.requiresConfirmation = false;
    parsed.mode = "clarify";
  }
  parsed.previewRows = (Array.isArray(parsed?.previewRows) ? parsed.previewRows : [])
    .slice(0, 8)
    .map((row: any) => ({
      label: cleanText(row?.label, 120),
      value: cleanText(row?.value, 300),
    }))
    .filter((row: any) => row.label);

  parsed.planSteps = (Array.isArray(parsed?.planSteps) ? parsed.planSteps : [])
    .slice(0, 5)
    .map((step: any, index: number) => ({
      id: cleanText(step?.id, 100) || `step-${index + 1}`,
      intent: stepIntentEnum.includes(step?.intent) ? step.intent : "open_today",
      label: cleanText(step?.label, 180) || `Step ${index + 1}`,
      reason: cleanText(step?.reason, 500),
      actionLabel: cleanText(step?.actionLabel, 100) || "Open step",
      requiresConfirmation: [
        "create_booking",
        "edit_booking",
        "cancel_booking",
        "complete_job",
        "add_customer_note",
        "set_reminder",
      ].includes(step?.intent),
      customerName: cleanText(step?.customerName, 240),
      service: cleanText(step?.service, 240),
      date: cleanText(step?.date, 20),
      time: cleanText(step?.time, 20),
      value: Math.max(0, Number(step?.value) || 0),
      note: cleanText(step?.note, 900),
      draftText: cleanText(step?.draftText, 2200),
      draftTarget: ["social", "reactivation", "follow_up"].includes(step?.draftTarget)
        ? step.draftTarget
        : "",
    }));

  if (parsed.intent !== "operator_plan") parsed.planSteps = [];
  if (parsed.intent === "operator_plan") parsed.mode = "plan";
  if (parsed.intent === "draft_refinement") parsed.mode = "draft";

  return parsed;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") return json(405, { error: "POST required" });

  try {
    const contentType = request.headers.get("content-type") || "";
    let transcript = "";
    let context: any = {};
    let conversation: any[] = [];

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const audio = form.get("audio");
      if (!(audio instanceof File)) {
        return json(400, { error: "Audio file is required." });
      }
      const rawContext = cleanText(form.get("context"), 100_000);
      const rawConversation = cleanText(form.get("conversation"), 45_000);
      context = rawContext ? JSON.parse(rawContext) : {};
      conversation = rawConversation ? JSON.parse(rawConversation) : [];
      transcript = await transcribeAudio(audio);
    } else {
      const body: any = await request.json();
      transcript = cleanText(body?.text, 4000);
      context = body?.context || {};
      conversation = body?.conversation || [];
    }

    if (!transcript) return json(400, { error: "Tell BUSY what you want to do." });

    const cleanedContext = safeContext(context);
    const cleanedConversation = cleanConversation(conversation);
    const command = await routeOperator(transcript, cleanedContext, cleanedConversation);

    return json(200, {
      transcript,
      command,
      backend: {
        commandModel: Deno.env.get("OPENAI_COMMAND_MODEL") || DEFAULT_COMMAND_MODEL,
        transcriptionModel: Deno.env.get("OPENAI_TRANSCRIBE_MODEL") || DEFAULT_TRANSCRIBE_MODEL,
        operatorVersion: "3.54",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "BUSY Operator failed.";
    console.error("BUSY operator error:", message);
    return json(400, { error: message });
  }
});
