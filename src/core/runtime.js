const APP_VERSION = "3.65";
const PROTOTYPE_BADGE = `Development v${APP_VERSION} • Business Growth Command Centre`;
const BUSY_AI_URL = String(
  process.env.EXPO_PUBLIC_BUSY_AI_URL ||
    "https://qgkmuiipicazmcxxmoxv.supabase.co/functions/v1/busy-ai-intake"
).trim();
const BUSY_AI_TOKEN = String(
  process.env.EXPO_PUBLIC_BUSY_AI_TOKEN ||
    "sb_publishable_-u4GplmvwptxNjdrh2UqEg_672Lhe74"
).trim();
const BUSY_COMMAND_URL = "https://qgkmuiipicazmcxxmoxv.supabase.co/functions/v1/busy-command";
const BUSY_SOCIAL_URL =
  "https://qgkmuiipicazmcxxmoxv.supabase.co/functions/v1/busy-social-content";
const BUSY_SOCIAL_PUBLISH_URL =
  "https://qgkmuiipicazmcxxmoxv.supabase.co/functions/v1/busy-social-publish";
const BUSY_WEBSITE_PUBLISH_URL =
  "https://qgkmuiipicazmcxxmoxv.supabase.co/functions/v1/busy-website-publish";
const BUSY_MINI_APPS_URL =
  "https://qgkmuiipicazmcxxmoxv.supabase.co/functions/v1/busy-mini-apps";
const BUSY_MINI_APP_LINK_URL =
  "https://qgkmuiipicazmcxxmoxv.supabase.co/functions/v1/busy-mini-app-link";
const BUSY_SUPABASE_URL = "https://qgkmuiipicazmcxxmoxv.supabase.co";
const BUSY_PUSH_DISPATCH_URL =
  "https://qgkmuiipicazmcxxmoxv.supabase.co/functions/v1/busy-push-dispatch";
const BUSY_CALENDAR_OAUTH_URL =
  "https://qgkmuiipicazmcxxmoxv.supabase.co/functions/v1/busy-calendar-oauth";
const BUSY_CALENDAR_SYNC_URL =
  "https://qgkmuiipicazmcxxmoxv.supabase.co/functions/v1/busy-calendar-sync";
const BUSY_PRODUCTION_WATCH_URL =
  "https://qgkmuiipicazmcxxmoxv.supabase.co/functions/v1/busy-production-watch";
const OWNER_SESSION_KEY = "busy-owner-session-v3.6";
const DEFAULT_OWNER_EMAIL = "busydoesitapp@gmail.com";
const CLOUD_SCHEMA_VERSION = 1;

function busyRequestId(prefix = "req") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    const wrapped = new Error(
      error?.name === "AbortError"
        ? "BUSY could not reach the server in time. Check your connection and try again."
        : "BUSY could not reach the server. Check your internet connection and try again."
    );
    wrapped.network = true;
    wrapped.cause = error;
    throw wrapped;
  } finally {
    clearTimeout(timer);
  }
}

async function busyDataRequest(path, { method = "GET", body = null, token = "", prefer = "" } = {}) {
  const headers = {
    apikey: BUSY_AI_TOKEN,
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (prefer) headers.Prefer = prefer;
  const response = await fetchWithTimeout(
    `${BUSY_SUPABASE_URL}/rest/v1/${path}`,
    {
      method,
      headers,
      body: body === null ? undefined : JSON.stringify(body),
    },
    15000
  );
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!response.ok) {
    const error = new Error(
      data?.message ||
      data?.hint ||
      data?.details ||
      data?.error ||
      `BUSY cloud data returned ${response.status}.`
    );
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

async function busyAuthRequest(path, { method = "POST", body = null, token = "" } = {}) {
  const headers = {
    apikey: BUSY_AI_TOKEN,
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetchWithTimeout(
    `${BUSY_SUPABASE_URL}/auth/v1/${path}`,
    {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    },
    15000
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      data?.msg ||
      data?.error_description ||
      data?.message ||
      data?.error ||
      `BUSY authentication returned ${response.status}.`
    );
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

function ownerSessionFromPayload(data) {
  if (!data?.access_token) return null;
  const expiresAt = data.expires_at
    ? Number(data.expires_at) * 1000
    : Date.now() + Number(data.expires_in || 3600) * 1000;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || "",
    expiresAt,
    email: data.user?.email || "",
    userId: data.user?.id || "",
  };
}

const C = {
  bg: "#F5F7FB",
  card: "#FFFFFF",
  ink: "#162033",
  muted: "#687386",
  blue: "#3671E3",
  blueSoft: "#EAF1FF",
  green: "#238F57",
  greenSoft: "#EAF7F0",
  amber: "#B86B10",
  amberSoft: "#FFF5E8",
  red: "#B23A3A",
  border: "#DDE3EC",
  shadow: "#111827",
};

const VERTICAL_PACKS = {
  "exterior-cleaning": {
    id: "exterior-cleaning",
    label: "Exterior cleaning",
    description: "Driveways, patios, gutters and similar exterior work.",
    defaultRepeatMonths: 9,
    services: [
      { id: "driveway", name: "Driveway cleaning", value: 250, wanted: true, repeatMonths: 9, durationHours: 3 },
      { id: "gutters", name: "Gutter clearing", value: 90, wanted: false, repeatMonths: 9, durationHours: 1.5 },
      { id: "patio", name: "Patio cleaning", value: 220, wanted: true, repeatMonths: 9, durationHours: 3 },
    ],
  },
  "window-cleaning": {
    id: "window-cleaning",
    label: "Window cleaning",
    description: "Regular window, conservatory and exterior glass work.",
    defaultRepeatMonths: 2,
    services: [
      { id: "windows", name: "Window cleaning", value: 35, wanted: true, repeatMonths: 2, durationHours: 1.5 },
      { id: "conservatory", name: "Conservatory cleaning", value: 120, wanted: true, repeatMonths: 6, durationHours: 2.5 },
      { id: "window-gutters", name: "Gutter clearing", value: 90, wanted: false, repeatMonths: 12, durationHours: 1.5 },
    ],
  },
  "gardening-landscaping": {
    id: "gardening-landscaping",
    label: "Gardening & landscaping",
    description: "Garden maintenance, lawns, hedges and landscaping jobs.",
    defaultRepeatMonths: 2,
    services: [
      { id: "garden-maintenance", name: "Garden maintenance", value: 80, wanted: true, repeatMonths: 1, durationHours: 2 },
      { id: "hedges", name: "Hedge trimming", value: 120, wanted: true, repeatMonths: 4, durationHours: 2.5 },
      { id: "landscaping", name: "Landscaping", value: 900, wanted: false, repeatMonths: null, durationHours: 6 },
    ],
  },
  "plumbing-heating": {
    id: "plumbing-heating",
    label: "Plumbing & heating",
    description: "Repairs, boiler work and planned servicing.",
    defaultRepeatMonths: null,
    services: [
      { id: "boiler-service", name: "Boiler service", value: 110, wanted: true, repeatMonths: 12, durationHours: 1.5 },
      { id: "plumbing-repair", name: "Plumbing repair", value: 140, wanted: true, repeatMonths: null, durationHours: 2 },
      { id: "radiators", name: "Radiator work", value: 180, wanted: false, repeatMonths: null, durationHours: 3 },
      { id: "landlord-check", name: "Landlord safety check", value: 90, wanted: false, repeatMonths: 12, durationHours: 1.5 },
    ],
  },
  "electrical": {
    id: "electrical",
    label: "Electrical",
    description: "Repairs, inspections, upgrades and installation work.",
    defaultRepeatMonths: null,
    services: [
      { id: "electrical-repair", name: "Electrical repair", value: 150, wanted: true, repeatMonths: null, durationHours: 2 },
      { id: "eicr", name: "EICR inspection", value: 180, wanted: true, repeatMonths: 60, durationHours: 3 },
      { id: "consumer-unit", name: "Consumer unit work", value: 650, wanted: false, repeatMonths: null, durationHours: 6 },
      { id: "ev-charger", name: "EV charger installation", value: 850, wanted: false, repeatMonths: null, durationHours: 5 },
    ],
  },
  "mobile-hair-beauty": {
    id: "mobile-hair-beauty",
    label: "Mobile hair & beauty",
    description: "Appointment-led hair and beauty services.",
    defaultRepeatMonths: 2,
    services: [
      { id: "haircut", name: "Haircut", value: 35, wanted: true, repeatMonths: 2, durationHours: 1 },
      { id: "colour", name: "Hair colour", value: 85, wanted: true, repeatMonths: 2, durationHours: 3 },
      { id: "blow-dry", name: "Blow dry", value: 30, wanted: false, repeatMonths: 1, durationHours: 1 },
      { id: "beauty-treatment", name: "Beauty treatment", value: 45, wanted: false, repeatMonths: 1, durationHours: 1.5 },
    ],
  },
  "other-service": {
    id: "other-service",
    label: "Other service business",
    description: "Use the generic core and add the services that fit your business.",
    defaultRepeatMonths: null,
    services: [
      { id: "main-service", name: "Main service", value: 0, wanted: true, repeatMonths: null, durationHours: 2 },
    ],
  },
};

function getVerticalPack(verticalId) {
  return VERTICAL_PACKS[verticalId] || VERTICAL_PACKS["other-service"];
}

const servicesSeed = VERTICAL_PACKS["exterior-cleaning"].services.map((item) => ({ ...item }));

function planningDurationHours(service) {
  const hours = Number(service?.durationHours);
  return Number.isFinite(hours) && hours > 0 ? hours : 2;
}

function formatDurationHours(value) {
  const hours = Number(value);
  if (!Number.isFinite(hours) || hours <= 0) return "Not set";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hr${hours === 1 ? "" : "s"}`;
}

function slotPlanningHours(part) {
  if (part === "morning" || part === "afternoon") return 4;
  if (part === "evening") return 3;
  return null;
}

function rateEvidence(successes, sample, baselineRate = 1 / 3) {
  const safeSample = Math.max(0, Number(sample) || 0);
  const safeSuccesses = Math.max(0, Math.min(safeSample, Number(successes) || 0));
  const confidence =
    safeSample === 0
      ? "No evidence yet"
      : safeSample < 3
      ? "Very low"
      : safeSample < 6
      ? "Low"
      : safeSample < 12
      ? "Medium"
      : "High";
  const evidenceReady = safeSample >= 3;
  const priorStrength = 4;
  const smoothedRate = evidenceReady
    ? (safeSuccesses + baselineRate * priorStrength) / (safeSample + priorStrength)
    : baselineRate;
  const weight = evidenceReady ? Math.min(1, safeSample / 12) : 0;
  const rawAdjustment = Math.round((smoothedRate - baselineRate) * 20 * weight);
  const scoreAdjustment = Math.max(-6, Math.min(8, rawAdjustment));
  return {
    sample: safeSample,
    successes: safeSuccesses,
    confidence,
    evidenceReady,
    observedRate: safeSample ? safeSuccesses / safeSample : null,
    rate: smoothedRate,
    scoreAdjustment,
  };
}

function formatPercent(value) {
  return Number.isFinite(Number(value)) ? `${Math.round(Number(value) * 100)}%` : "Not enough data";
}

function chooseRateEvidence({
  serviceSuccesses = 0,
  serviceSample = 0,
  overallSuccesses = 0,
  overallSample = 0,
  baselineRate = 1 / 3,
  serviceName = "",
}) {
  if (serviceSample >= 3) {
    return {
      ...rateEvidence(serviceSuccesses, serviceSample, baselineRate),
      basis: serviceName ? `${serviceName} outcomes` : "Service-specific outcomes",
      serviceSpecific: true,
    };
  }
  if (overallSample >= 3) {
    return {
      ...rateEvidence(overallSuccesses, overallSample, baselineRate),
      basis: "All recorded services",
      serviceSpecific: false,
    };
  }
  const smallSample = serviceSample || overallSample;
  const smallSuccesses = serviceSample ? serviceSuccesses : overallSuccesses;
  return {
    ...rateEvidence(smallSuccesses, smallSample, baselineRate),
    basis: smallSample ? "Small sample — cautious fallback" : "No recorded outcomes yet — cautious fallback",
    serviceSpecific: false,
  };
}

async function busyPhotoToDataUrl(photo) {
  if (photo?.base64) {
    return `data:${photo.mimeType || "image/jpeg"};base64,${photo.base64}`;
  }
  if (!photo?.uri) throw new Error("A selected photo could not be read.");
  const response = await fetch(photo.uri);
  if (!response.ok) throw new Error("A selected photo is no longer available on this device.");
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("A selected photo could not be prepared."));
    reader.readAsDataURL(blob);
  });
}

function socialStoryLabel(type) {
  if (type === "before_after") return "Before & after";
  if (type === "finished_result") return "Finished result";
  if (type === "process") return "Work in progress";
  if (type === "equipment") return "Equipment / behind the scenes";
  if (type === "general") return "General business content";
  return "Not clear yet";
}

const customerSeed = [
  { id: "c1", name: "Sarah Mitchell", phone: "07700 900101", service: "Driveway cleaning", lastServiceDate: "2025-01-10", lastJobValue: 260, contactOk: true },
  { id: "c2", name: "John Parker", phone: "07700 900102", service: "Patio cleaning", lastServiceDate: "2024-12-05", lastJobValue: 220, contactOk: true },
  { id: "c3", name: "Megan Turner", phone: "07700 900103", service: "Driveway cleaning", lastServiceDate: "2025-02-15", lastJobValue: 280, contactOk: true },
  { id: "c4", name: "Chris Lewis", phone: "07700 900104", service: "Gutter clearing", lastServiceDate: "2025-03-20", lastJobValue: 95, contactOk: true },
  { id: "c5", name: "Anita Green", phone: "07700 900105", service: "Patio cleaning", lastServiceDate: "2025-05-01", lastJobValue: 240, contactOk: true },
  { id: "c6", name: "Rob Davies", phone: "07700 900106", service: "Driveway cleaning", lastServiceDate: "2025-06-12", lastJobValue: 310, contactOk: true },
  { id: "c7", name: "Elaine Cooper", phone: "07700 900107", service: "Patio cleaning", lastServiceDate: "2025-07-07", lastJobValue: 230, contactOk: true },
  { id: "c8", name: "Paul Brown", phone: "07700 900108", service: "Gutter clearing", lastServiceDate: "2026-04-15", lastJobValue: 90, contactOk: true },
  { id: "c9", name: "Lucy White", phone: "07700 900109", service: "Driveway cleaning", lastServiceDate: "2024-11-30", lastJobValue: 275, contactOk: false },
];

function monthsSince(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
}

function repeatMonthsForCustomer(customer, services = [], verticalId = "exterior-cleaning") {
  const service = services.find((item) => item.name === customer?.service);
  if (service && service.repeatMonths !== undefined) return service.repeatMonths;
  return getVerticalPack(verticalId).defaultRepeatMonths;
}

function isEligibleCustomer(customer, services = [], verticalId = "exterior-cleaning") {
  if (!customer?.contactOk || !customer?.lastServiceDate) return false;
  const repeatMonths = repeatMonthsForCustomer(customer, services, verticalId);
  if (!Number.isFinite(Number(repeatMonths)) || Number(repeatMonths) <= 0) return false;
  return monthsSince(customer.lastServiceDate) >= Number(repeatMonths);
}

function nextRepeatDueDate(customer, services = [], verticalId = "exterior-cleaning") {
  if (!customer?.lastServiceDate) return null;
  const repeatMonths = Number(repeatMonthsForCustomer(customer, services, verticalId));
  if (!Number.isFinite(repeatMonths) || repeatMonths <= 0) return null;
  const date = dateFromISO(customer.lastServiceDate);
  date.setMonth(date.getMonth() + repeatMonths);
  return dateToISO(date);
}

function eligibilityRuleText(services = [], verticalId = "exterior-cleaning") {
  const repeatValues = [...new Set(
    services
      .map((item) => Number(item.repeatMonths))
      .filter((value) => Number.isFinite(value) && value > 0)
  )].sort((a, b) => a - b);
  if (!repeatValues.length) {
    return "No blanket repeat rule — only services with a sensible repeat interval are reactivated automatically.";
  }
  if (repeatValues.length === 1) {
    return `${repeatValues[0]}+ months for repeatable services + contact allowed`;
  }
  return `Service-specific timing (${repeatValues.join(", ")} months) + contact allowed`;
}

function formatMonthsAgo(dateString) {
  const months = Math.floor(monthsSince(dateString));
  if (!months) return "recent";
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

function dateFromISO(dateString) {
  const match = String(dateString || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return new Date();
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
}

function dateToISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatUKDate(dateString) {
  const date = dateFromISO(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysSinceTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86400000));
}

function businessBrainFreshness(timestamp) {
  const days = daysSinceTimestamp(timestamp);
  if (days === null) return { label: "No dated evidence", tone: "amber", weight: 0.35, stale: true };
  if (days <= 30) return { label: "Fresh", tone: "green", weight: 1, stale: false };
  if (days <= 90) return { label: "Current", tone: "green", weight: 0.9, stale: false };
  if (days <= 180) return { label: "Ageing", tone: "blue", weight: 0.7, stale: false };
  return { label: "Stale", tone: "amber", weight: 0.4, stale: true };
}

function businessBrainRuleScope(text) {
  const value = String(text || "").toLowerCase();
  if (/facebook|instagram|google business|social|post|photo|caption|face/.test(value)) return "Social content";
  if (/mile|distance|travel|postcode|area|radius/.test(value)) return "Work area";
  if (/winter|summer|spring|autumn|season|month/.test(value)) return "Season";
  if (/£|price|pricing|minimum|under £|over £|value/.test(value)) return "Pricing";
  if (/quote|enquiry|follow.?up|customer contact|message/.test(value)) return "Customer contact";
  return "Global";
}

function businessBrainOpportunityFamily(id = "") {
  const value = String(id || "");
  if (/prepared-post|job-photo|post-outcome/.test(value)) return "social";
  if (/quiet-slot|reactivation|previous-customer/.test(value)) return "reactivation";
  if (/review-request|review-outcome/.test(value)) return "reviews";
  if (/quote-followup|stale-quote/.test(value)) return "quote-follow-up";
  if (/enquiry-followup|stale-enquiry/.test(value)) return "enquiry-follow-up";
  if (/paid|advert|ad-test/.test(value)) return "paid";
  return "general";
}

function businessBrainFamilyLabel(family) {
  if (family === "social") return "Social content";
  if (family === "reactivation") return "Previous-customer reactivation";
  if (family === "reviews") return "Review requests";
  if (family === "quote-follow-up") return "Quote follow-ups";
  if (family === "enquiry-follow-up") return "Enquiry follow-ups";
  if (family === "paid") return "Paid advertising";
  return "General opportunities";
}

function businessBrainFeedbackPenalty(reason) {
  if (reason === "Not suitable for my business") return -6;
  if (reason === "Wrong time of year") return -5;
  if (reason === "Too far away") return -5;
  if (reason === "Not worthwhile financially") return -6;
  return 0;
}

function businessBrainFeedbackEffect(item) {
  if (item?.signal === "accepted") return Math.max(1, Number(item.boost || 2));
  return Number(item?.penalty || 0);
}

function manualRuleTargetFamilies(rule) {
  if (Array.isArray(rule?.targetFamilies) && rule.targetFamilies.length) return rule.targetFamilies;
  const value = String(rule?.text || "").toLowerCase();
  const isBlocking =
    /don't recommend|dont recommend|do not recommend|never recommend|don't suggest|dont suggest|do not suggest|never suggest/.test(value);
  if (!isBlocking) return [];
  const families = [];
  if (/facebook|instagram|social|post|content|photo/.test(value)) families.push("social");
  if (/previous customer|reactivat|past customer|repeat customer/.test(value)) families.push("reactivation");
  if (/review/.test(value)) families.push("reviews");
  if (/quote/.test(value)) families.push("quote-follow-up");
  if (/enquir/.test(value)) families.push("enquiry-follow-up");
  if (/paid|advert|ads?\b/.test(value)) families.push("paid");
  return families;
}

function enquiryAgeLabel(createdAt) {
  const days = daysSinceTimestamp(createdAt);
  if (days === null || days === 0) return "Added today";
  if (days === 1) return "Waiting 1 day";
  return `Waiting ${days} days`;
}

function addDaysISO(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return dateToISO(date);
}

function addDaysFromISO(dateString, days) {
  const date = dateFromISO(dateString || dateToISO(new Date()));
  date.setDate(date.getDate() + Number(days || 0));
  return dateToISO(date);
}

function nextDateForSlot(slotText) {
  const text = String(slotText || "").toLowerCase();
  const weekdays = [
    ["sunday", 0],
    ["monday", 1],
    ["tuesday", 2],
    ["wednesday", 3],
    ["thursday", 4],
    ["friday", 5],
    ["saturday", 6],
  ];
  const match = weekdays.find(([name]) => text.includes(name));
  if (!match) return addDaysISO(2);

  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const targetDay = match[1];
  let daysAhead = (targetDay - now.getDay() + 7) % 7;
  if (daysAhead === 0) daysAhead = 7;
  now.setDate(now.getDate() + daysAhead);
  return dateToISO(now);
}

function timeOptionsForSlot(slotText) {
  const text = String(slotText || "").toLowerCase();
  if (text.includes("morning")) return ["08:00", "09:00", "10:00", "11:00", "12:00"];
  if (text.includes("afternoon")) return ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
  if (text.includes("evening")) return ["17:00", "18:00", "19:00"];
  return ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
}

function defaultTimeForSlot(slotText) {
  const options = timeOptionsForSlot(slotText);
  if (String(slotText || "").toLowerCase().includes("afternoon")) return "14:00";
  if (String(slotText || "").toLowerCase().includes("evening")) return "18:00";
  return options[Math.min(2, options.length - 1)];
}

function slotWeekdayIndex(slotText) {
  const text = String(slotText || "").toLowerCase();
  const weekdays = [
    ["sunday", 0],
    ["monday", 1],
    ["tuesday", 2],
    ["wednesday", 3],
    ["thursday", 4],
    ["friday", 5],
    ["saturday", 6],
  ];
  const match = weekdays.find(([name]) => text.includes(name));
  return match ? match[1] : null;
}

function dateMatchesSlotWeekday(dateString, slotText) {
  const target = slotWeekdayIndex(slotText);
  if (target === null || !dateString) return true;
  return dateFromISO(dateString).getDay() === target;
}

function timeMatchesSlotPart(timeString, slotText) {
  const text = String(slotText || "").toLowerCase();
  const hour = Number(String(timeString || "").split(":")[0]);
  if (!Number.isFinite(hour)) return true;
  if (text.includes("morning")) return hour < 12;
  if (text.includes("afternoon")) return hour >= 12 && hour < 17;
  if (text.includes("evening")) return hour >= 17;
  return true;
}

function suggestSpareSlots(replyActions = {}, limit = 4, daysAhead = 10) {
  const occupied = new Set();

  Object.values(replyActions || {}).forEach((action) => {
    if (
      !action?.done ||
      action.type !== "booking" ||
      ["Cancelled", "Completed"].includes(action.details?.bookingStatus || "Confirmed") ||
      !action.details?.bookingDate
    ) return;

    const date = action.details.bookingDate;
    const hour = Number(String(action.details?.bookingTime || "").split(":")[0]);
    if (!Number.isFinite(hour)) {
      occupied.add(`${date}:morning`);
      occupied.add(`${date}:afternoon`);
      return;
    }
    occupied.add(`${date}:${hour < 12 ? "morning" : "afternoon"}`);
  });

  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const suggestions = [];

  for (let step = 1; step <= daysAhead && suggestions.length < limit; step += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() + step);
    if (date.getDay() === 0) continue;

    const iso = dateToISO(date);
    const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
    const shortDate = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

    ["morning", "afternoon"].forEach((part) => {
      if (suggestions.length >= limit || occupied.has(`${iso}:${part}`)) return;
      suggestions.push({
        id: `${iso}-${part}`,
        date: iso,
        part,
        label: `${weekday} ${part} • ${shortDate}`,
      });
    });
  }

  return suggestions;
}

function buildMultiSlotCapacityPlan(replyActions = {}, goal = {}, service = null) {
  const targetJobs = Math.max(1, Number(goal?.targetJobs) || 1);
  const durationHours = planningDurationHours(service);
  const candidates = suggestSpareSlots(replyActions, 30, 21);
  const plannedSlots = [];
  let remainingJobs = targetJobs;

  for (const slot of candidates) {
    const hours = slotPlanningHours(slot.part);
    const capacity = hours ? Math.max(0, Math.floor(hours / durationHours)) : 0;
    if (!capacity) continue;
    const allocatedJobs = Math.min(capacity, remainingJobs);
    plannedSlots.push({ ...slot, capacityJobs: capacity, targetJobs: allocatedJobs });
    remainingJobs -= allocatedJobs;
    if (remainingJobs <= 0) break;
  }

  return {
    plannedSlots,
    plannedJobs: targetJobs - Math.max(0, remainingJobs),
    unplannedJobs: Math.max(0, remainingJobs),
    complete: remainingJobs <= 0,
    horizonDays: 21,
  };
}

function bookingMatchesWorkGoal(action, goal) {
  if (!action?.done || action.type !== "booking") return false;
  if (!["Confirmed", "Completed"].includes(action.details?.bookingStatus || "Confirmed")) return false;

  if (Array.isArray(goal?.plannedSlots) && goal.plannedSlots.length) {
    const date = action.details?.bookingDate;
    const hour = Number(String(action.details?.bookingTime || "").split(":")[0]);
    if (!date || !Number.isFinite(hour)) return false;
    const part = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    return goal.plannedSlots.some((slot) => slot.date === date && slot.part === part);
  }

  if (!goal?.date) {
    const savedAt = new Date(action.completedAt || action.createdAt || 0).getTime();
    const goalStartedAt = new Date(goal?.createdAt || 0).getTime();
    return Number.isFinite(savedAt) && Number.isFinite(goalStartedAt) && savedAt >= goalStartedAt;
  }

  if (action.details?.bookingDate !== goal.date) return false;
  if (!goal.part) return true;

  const hour = Number(String(action.details?.bookingTime || "").split(":")[0]);
  if (!Number.isFinite(hour)) return false;
  if (goal.part === "morning") return hour < 12;
  if (goal.part === "afternoon") return hour >= 12 && hour < 17;
  if (goal.part === "evening") return hour >= 17;
  return true;
}

function normalizePhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("44") && digits.length >= 12) digits = `0${digits.slice(2)}`;
  return digits;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function findCustomerMatch(customers = [], { phone = "", email = "", name = "" } = {}) {
  const phoneKey = normalizePhone(phone);
  const emailKey = normalizeEmail(email);
  const nameKey = String(name || "").trim().toLowerCase();

  if (phoneKey) {
    const byPhone = customers.find((customer) => normalizePhone(customer.phone) === phoneKey);
    if (byPhone) return { customer: byPhone, reason: "Same phone number", confidence: "High" };
  }

  if (emailKey) {
    const byEmail = customers.find((customer) => normalizeEmail(customer.email) === emailKey);
    if (byEmail) return { customer: byEmail, reason: "Same email address", confidence: "High" };
  }

  if (nameKey && nameKey.length >= 4) {
    const byName = customers.find((customer) => String(customer.name || "").trim().toLowerCase() === nameKey);
    if (byName) return { customer: byName, reason: "Same full name", confidence: "Medium" };
  }

  return null;
}

function extractISODateFromText(text) {
  const source = String(text || "");
  const iso = source.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) {
    const [, year, month, day] = iso;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const uk = source.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](20\d{2})\b/);
  if (uk) {
    const [, day, month, year] = uk;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return dateToISO(new Date());
}

function extractTimeFromText(text) {
  const match = String(text || "").match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
  if (!match) return "09:00";
  return `${String(match[1]).padStart(2, "0")}:${match[2]}`;
}

function inferCaptureStage(text) {
  const lower = String(text || "").toLowerCase();
  if (/\b(completed|complete|finished|finish|job done|work done|paid)\b/.test(lower)) return "Completed job";
  if (/\b(booked|booking|appointment|scheduled|schedule)\b/.test(lower)) return "Booking";
  if (/\b(quote sent|sent quote|estimate sent|sent estimate|quoted|estimate provided|quote provided)\b/.test(lower)) return "Quote sent";
  return "Enquiry";
}

function inferCaptureService(text, services = [], fallback = "") {
  const lower = String(text || "").toLowerCase();
  const exact = services.find((service) => lower.includes(String(service.name || "").toLowerCase()));
  if (exact) return exact.name;

  const scored = services
    .map((service) => {
      const tokens = String(service.name || "")
        .toLowerCase()
        .split(/\s+/)
        .filter((token) => token.length >= 4);
      const score = tokens.filter((token) => lower.includes(token)).length;
      return { name: service.name, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.score ? scored[0].name : fallback || services[0]?.name || "General enquiry";
}

function inferCaptureName(text) {
  const source = String(text || "").trim();
  const labelled = source.match(/(?:^|\n)\s*(?:name|customer)\s*[:\-]\s*([^\n,]+)/i);
  if (labelled) return labelled[1].trim();

  const from = source.match(/\bfrom\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/);
  if (from) return from[1].trim();

  const firstLine = source.split(/\n/)[0]?.trim() || "";
  if (
    firstLine &&
    firstLine.length <= 45 &&
    !/@/.test(firstLine) &&
    !/£|\d{5,}/.test(firstLine) &&
    !/^(hi|hello|thanks|quote|booking|job|address)\b/i.test(firstLine)
  ) {
    return firstLine.replace(/[:\-]+$/, "").trim();
  }

  return "";
}

function inferCaptureAddress(text) {
  const source = String(text || "");
  const labelled = source.match(/(?:^|\n)\s*(?:address|job address|site)\s*[:\-]\s*([^\n]+)/i);
  if (labelled) return labelled[1].trim();

  const postcode = source.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i);
  if (!postcode) return "";
  const line = source
    .split(/\n/)
    .find((item) => item.toUpperCase().includes(postcode[1].toUpperCase()));
  return line?.trim() || postcode[1].toUpperCase();
}

function captureStageStrength(stage) {
  if (stage === "Completed job") return 4;
  if (stage === "Booking") return 3;
  if (stage === "Quote sent") return 2;
  if (stage === "Enquiry") return 1;
  return 0;
}

function customerActionStrength(action) {
  if (!action || !isActiveCustomerAction(action)) return 0;
  if (action.type === "booking") return 3;
  if (action.type === "quote") return 2;
  if (action.type === "reminder") return 1;
  return 0;
}

function currentJourneyStage(customer, action) {
  if (action && isActiveCustomerAction(action)) {
    if (action.type === "booking") return "Booking";
    if (action.type === "quote") return "Quote sent";
    if (action.type === "reminder") return "Enquiry";
  }
  if (customer?.currentEnquiryAt) return "Enquiry";
  if (action && !isActiveCustomerAction(action)) return "";
  if (customer?.lifecycleStatus === "Booked") return "Booking";
  if (customer?.lifecycleStatus === "Quote sent") return "Quote sent";
  if (customer?.lifecycleStatus === "Enquiry") return "Enquiry";
  return "";
}

function assessJourneyReconciliation(parsed, customer, action) {
  const currentStage = currentJourneyStage(customer, action);
  const currentStrength = captureStageStrength(currentStage);
  const incomingStrength = captureStageStrength(parsed?.stage);
  const progression =
    !!customer && currentStrength > 0 && incomingStrength > currentStrength;
  const sameStage =
    !!customer && currentStrength > 0 && incomingStrength === currentStrength;
  const regression =
    !!customer && currentStrength > 0 && incomingStrength > 0 && incomingStrength < currentStrength;
  return {
    currentStage,
    currentStrength,
    incomingStage: parsed?.stage || "",
    incomingStrength,
    progression,
    sameStage,
    regression,
    reason: progression
      ? `Continuing the same customer journey: ${currentStage} → ${parsed?.stage || "next stage"}`
      : regression
      ? `Incoming stage would move active work backwards from ${currentStage}`
      : sameStage
      ? `${currentStage} is already active for this customer`
      : "No active journey progression detected",
  };
}

const MAX_CAPTURE_SCREENSHOTS = 8;

function screenshotFileSequence(asset, fallbackIndex = 0) {
  const fileName = String(asset?.fileName || "");
  const baseName = fileName.replace(/\.[^.]+$/, "");
  const matches = baseName.match(/(\d{2,})/g);
  if (!matches?.length) return null;
  const value = Number(matches[matches.length - 1]);
  return Number.isFinite(value) ? value : fallbackIndex;
}

function inferCaptureScreenshotOrder(items = []) {
  const normalized = items.map((item, index) => ({
    ...item,
    pickerIndex: Number.isFinite(item?.pickerIndex) ? item.pickerIndex : index,
    sequenceHint: screenshotFileSequence(item, index),
  }));
  if (normalized.length <= 1) {
    return {
      items: normalized,
      confidence: normalized.length ? "High" : "Not checked",
      reason: normalized.length
        ? "Only one screenshot is attached, so conversation order is unambiguous."
        : "",
    };
  }

  const withSequence = normalized.filter((item) => Number.isFinite(item.sequenceHint));
  if (withSequence.length === normalized.length) {
    const sorted = [...normalized].sort((a, b) => {
      if (a.sequenceHint !== b.sequenceHint) return a.sequenceHint - b.sequenceHint;
      return a.pickerIndex - b.pickerIndex;
    });
    const originalIds = normalized.map((item) => item.id).join("|");
    const sortedIds = sorted.map((item) => item.id).join("|");
    const uniqueHints = new Set(sorted.map((item) => item.sequenceHint)).size === sorted.length;
    return {
      items: sorted,
      confidence: uniqueHints ? "High" : "Medium",
      reason:
        originalIds === sortedIds
          ? "BUSY found screenshot sequence numbers and the selected order already looks chronological."
          : "BUSY found screenshot sequence numbers and automatically rearranged the batch into chronological order.",
    };
  }

  return {
    items: normalized,
    confidence: "Check order",
    reason:
      "The prototype cannot prove the sequence from file metadata alone. The live AI vision step will also compare timestamps, repeated messages and conversation continuity; you can reorder the screenshots here now.",
  };
}

function normaliseConfidence(value, fallback = "Low") {
  const text = String(value || fallback).trim().toLowerCase();
  if (text === "high") return "High";
  if (text === "medium") return "Medium";
  if (text === "not needed") return "Not needed";
  return "Low";
}

function fieldConfidenceFromParsed(parsed = {}) {
  return {
    name: parsed.name ? "High" : "Low",
    contact: parsed.phone || parsed.email ? "High" : "Low",
    phone: parsed.phone ? "High" : "Low",
    email: parsed.email ? "High" : "Low",
    address: parsed.address ? "Medium" : "Low",
    service: parsed.serviceDetected || parsed.service ? "High" : "Low",
    date: parsed.dateDetected ? "High" : "Low",
    time: parsed.timeDetected ? "High" : "Low",
    value: parsed.valueDetected ? "High" : parsed.stage === "Enquiry" ? "Not needed" : "Low",
    stage: parsed.stage ? "Medium" : "Low",
  };
}

function criticalIntakeFieldsSafe(parsed = {}, confidence = {}) {
  return (
    !!parsed.name &&
    normaliseConfidence(confidence.name) === "High" &&
    !!(parsed.phone || parsed.email) &&
    normaliseConfidence(confidence.contact) === "High" &&
    !!parsed.service &&
    normaliseConfidence(confidence.service) === "High"
  );
}

function localIntakeBrainAnalysis({
  parsed,
  rawText = "",
  screenshots = [],
  orderConfidence = "Not checked",
  orderReason = "",
}) {
  const screenshotOnly = screenshots.length > 0 && !String(rawText || "").trim();
  if (screenshotOnly) {
    return {
      mode: "vision-not-connected",
      status: "needs_connection",
      analysedAt: new Date().toISOString(),
      summary: "Screenshots are attached, but their pixels have not been analysed yet.",
      threadCount: 0,
      threads: [],
      order: { confidence: orderConfidence, reason: orderReason },
      overlapCount: 0,
      warnings: ["Secure AI vision is not connected in this preview, so BUSY has not guessed what the screenshots say."],
      safeToAutoFile: false,
    };
  }

  const fieldConfidence = fieldConfidenceFromParsed(parsed);
  const safeToAutoFile =
    parsed.confidence === "High" &&
    criticalIntakeFieldsSafe(parsed, fieldConfidence);

  return {
    mode: screenshots.length ? "text-plus-evidence" : "local-text",
    status: "ready",
    analysedAt: new Date().toISOString(),
    summary: parsed.name
      ? `${parsed.stage || "Incoming"} • ${parsed.name}${parsed.service ? ` • ${parsed.service}` : ""}`
      : "BUSY extracted what it could from the supplied text.",
    threadCount: 1,
    threads: [{
      id: "thread-1",
      label: parsed.name || "One conversation",
      sourceText: rawText,
      imageIds: screenshots.map((shot) => shot.id),
      parsed,
      fieldConfidence,
      warnings: safeToAutoFile ? [] : ["At least one important field needs owner review."],
      safeToAutoFile,
    }],
    order: { confidence: orderConfidence, reason: orderReason },
    overlapCount: 0,
    warnings: screenshots.length
      ? ["Screenshots are attached as evidence; this local pass only extracted the supplied text."]
      : [],
    safeToAutoFile,
  };
}

function normaliseLiveIntakeAnalysis(payload = {}, fallback = {}) {
  const rawThreads = Array.isArray(payload.threads) ? payload.threads : [];
  const threads = rawThreads.map((thread, index) => {
    const parsed = {
      ...(fallback.parsed || {}),
      ...(thread.parsed || {}),
      note: thread.parsed?.note || thread.sourceText || fallback.rawText || "",
    };
    parsed.extractedFields = Array.isArray(thread.parsed?.extractedFields)
      ? thread.parsed.extractedFields
      : ["name", "phone", "email", "address", "service", "date", "time", "value"]
          .filter((key) => !!parsed[key]);
    const fieldConfidence = {
      ...fieldConfidenceFromParsed(parsed),
      ...(thread.fieldConfidence || {}),
    };
    const safeToAutoFile =
      thread.safeToAutoFile === true &&
      parsed.confidence === "High" &&
      criticalIntakeFieldsSafe(parsed, fieldConfidence);

    return {
      id: thread.id || `thread-${index + 1}`,
      label: thread.label || parsed.name || `Conversation ${index + 1}`,
      sourceText: thread.sourceText || parsed.note || fallback.rawText || "",
      imageIds: Array.isArray(thread.imageIds)
        ? thread.imageIds
        : fallback.screenshots.map((shot) => shot.id),
      parsed,
      fieldConfidence,
      warnings: Array.isArray(thread.warnings) ? thread.warnings : [],
      safeToAutoFile,
    };
  });

  return {
    mode: "live-vision",
    status: "ready",
    analysedAt: new Date().toISOString(),
    summary:
      payload.summary ||
      (threads.length === 1
        ? threads[0].label
        : `${threads.length} separate conversations detected`),
    threadCount: threads.length,
    threads,
    order: {
      confidence: normaliseConfidence(payload.order?.confidence || fallback.orderConfidence, "Medium"),
      reason: payload.order?.reason || fallback.orderReason || "BUSY reconstructed the most likely order.",
      imageIds: Array.isArray(payload.order?.imageIds)
        ? payload.order.imageIds
        : fallback.screenshots.map((shot) => shot.id),
    },
    overlapCount: Math.max(0, Number(payload.overlapCount || payload.overlapsRemoved || 0) || 0),
    warnings: Array.isArray(payload.warnings) ? payload.warnings : [],
    safeToAutoFile:
      threads.length === 1 &&
      threads[0]?.safeToAutoFile === true &&
      !(Array.isArray(payload.warnings) && payload.warnings.length),
  };
}

function parseQuickCapture(text, services = [], fallbackService = "") {
  const source = String(text || "").trim();
  const phoneMatch = source.match(/(?:\+44\s?\(?0?\)?|0)7\d{3}[\s.-]?\d{3}[\s.-]?\d{3}/);
  const emailMatch = source.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const amountMatch = source.match(/£\s*([0-9]+(?:\.[0-9]{1,2})?)/);
  const explicitISODate = source.match(/\b20\d{2}-\d{1,2}-\d{1,2}\b/);
  const explicitUKDate = source.match(/\b\d{1,2}[\/-]\d{1,2}[\/-]20\d{2}\b/);
  const explicitTime = source.match(/\b(?:[01]?\d|2[0-3])[:.]\d{2}\b/);
  const stage = inferCaptureStage(source);
  const lower = source.toLowerCase();
  const serviceDetected = services.some((candidate) => {
    const full = String(candidate.name || "").toLowerCase();
    const tokens = full.split(/\s+/).filter((token) => token.length >= 4);
    return (!!full && lower.includes(full)) || tokens.some((token) => lower.includes(token));
  });
  const service = serviceDetected ? inferCaptureService(source, services, fallbackService) : "";
  const name = inferCaptureName(source);
  const address = inferCaptureAddress(source);
  const date = extractISODateFromText(source);
  const time = extractTimeFromText(source);

  const evidence = [
    phoneMatch ? "phone" : null,
    emailMatch ? "email" : null,
    serviceDetected ? "service" : null,
    amountMatch ? "value" : null,
    address ? "address" : null,
    name ? "name" : null,
  ].filter(Boolean);

  return {
    stage,
    name,
    phone: phoneMatch?.[0]?.trim() || "",
    email: emailMatch?.[0]?.trim() || "",
    address,
    service,
    date,
    time,
    value: amountMatch?.[1] || "",
    note: source,
    confidence: evidence.length >= 4 ? "High" : evidence.length >= 2 ? "Medium" : "Low",
    extractedFields: evidence,
    dateDetected: !!(explicitISODate || explicitUKDate),
    timeDetected: !!explicitTime,
    valueDetected: !!amountMatch,
    serviceDetected,
  };
}

function triageInboxCandidate(parsed, customers = [], replyActions = {}) {
  const match = findCustomerMatch(customers, {
    phone: parsed.phone,
    email: parsed.email,
    name: parsed.name,
  });
  const action = match?.customer ? replyActions[match.customer.id] : null;
  const reconciliation = assessJourneyReconciliation(parsed, match?.customer || null, action);
  const conflict = reconciliation.regression;

  const missing = [];
  if (!parsed.name) missing.push("customer name");
  if (!parsed.phone && !parsed.email) missing.push("phone or email");
  if (!parsed.service) missing.push("service");

  const stageBase =
    parsed.stage === "Booking"
      ? 100
      : parsed.stage === "Quote sent"
      ? 90
      : parsed.stage === "Enquiry"
      ? 80
      : parsed.stage === "Completed job"
      ? 60
      : 50;

  const uncertainty =
    missing.length * 12 +
    (parsed.confidence === "Low" ? 18 : parsed.confidence === "Medium" ? 7 : 0) +
    (conflict ? 20 : 0) +
    (reconciliation.sameStage ? 10 : 0) +
    (match?.confidence === "Medium" ? 6 : 0);

  const priorityScore = stageBase + uncertainty;
  const needsAttention =
    missing.length > 0 ||
    parsed.confidence === "Low" ||
    conflict ||
    reconciliation.sameStage ||
    match?.confidence === "Medium";

  let reason = "Ready for owner review";
  if (conflict) reason = reconciliation.reason;
  else if (reconciliation.sameStage) reason = `Possible duplicate stage: ${reconciliation.currentStage} already active`;
  else if (missing.length) reason = `Missing ${missing.join(", ")}`;
  else if (match?.confidence === "Medium") reason = "Possible name-only customer match";
  else if (parsed.confidence === "Low") reason = "Low extraction confidence";
  else if (reconciliation.progression) reason = reconciliation.reason;
  else if (match?.customer) reason = `Likely match: ${match.customer.name}`;

  return {
    priorityScore,
    lane: needsAttention ? "Needs attention" : "Ready to review",
    reason,
    missing,
    matchCustomerId: match?.customer?.id || null,
    matchReason: match?.reason || "",
    matchConfidence: match?.confidence || "",
    conflict,
    reconciliation,
  };
}

function captureFingerprint(source, rawText) {
  return `${String(source || "").trim().toLowerCase()}::${String(rawText || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")}`;
}

function evaluateSafeAutoFile(parsed, customers = [], replyActions = {}, source = "", rawText = "") {
  const match = findCustomerMatch(customers, {
    phone: parsed.phone,
    email: parsed.email,
    name: parsed.name,
  });
  const customer = match?.customer || null;
  const action = customer ? replyActions[customer.id] : null;
  const reconciliation = assessJourneyReconciliation(parsed, customer, action);
  const exactMatch =
    !!customer &&
    match?.confidence === "High" &&
    (match?.reason === "Same phone number" || match?.reason === "Same email address");
  const fingerprint = captureFingerprint(source, rawText);
  const duplicateSource =
    !!customer &&
    (Array.isArray(customer.sourceRecords) ? customer.sourceRecords : []).some(
      (record) =>
        record.fingerprint === fingerprint ||
        captureFingerprint(record.source, record.rawText) === fingerprint
    );

  const reasons = [];
  if (!exactMatch) reasons.push("No exact existing-customer phone/email match");
  if (parsed.confidence !== "High") reasons.push("Extraction is not high confidence");
  if (!parsed.name) reasons.push("Customer name missing");
  if (
    customer &&
    parsed.name &&
    String(parsed.name).trim().toLowerCase() !== String(customer.name || "").trim().toLowerCase()
  ) {
    reasons.push("Customer name does not exactly match the existing record");
  }
  if (!parsed.phone && !parsed.email) reasons.push("Contact detail missing");
  if (
    customer?.phone &&
    parsed.phone &&
    normalizePhone(customer.phone) !== normalizePhone(parsed.phone)
  ) {
    reasons.push("Phone number conflicts with the existing record");
  }
  if (
    customer?.email &&
    parsed.email &&
    normalizeEmail(customer.email) !== normalizeEmail(parsed.email)
  ) {
    reasons.push("Email address conflicts with the existing record");
  }
  if (!parsed.service || !parsed.serviceDetected) reasons.push("Service not confidently detected");
  if (
    customer?.service &&
    parsed.service &&
    String(customer.service).trim().toLowerCase() !== String(parsed.service).trim().toLowerCase()
  ) {
    reasons.push("Service differs from the existing customer record");
  }
  if (
    customer?.address &&
    parsed.address &&
    String(customer.address).trim().toLowerCase() !== String(parsed.address).trim().toLowerCase()
  ) {
    reasons.push("Job address differs from the existing customer record");
  }
  if (action && isActiveCustomerAction(action) && !reconciliation.progression) {
    reasons.push(
      reconciliation.regression
        ? reconciliation.reason
        : reconciliation.sameStage
        ? `${reconciliation.currentStage} is already active for this customer`
        : "Customer already has active work"
    );
  }
  if (parsed.stage === "Enquiry" && customer?.currentEnquiryAt) {
    reasons.push("Customer already has an open enquiry");
  }
  if (duplicateSource) reasons.push("This source item appears to have been filed already");

  if (parsed.stage === "Quote sent") {
    if (!parsed.dateDetected) reasons.push("Quote sent date was not explicit");
    if (!parsed.valueDetected) reasons.push("Quote value was not explicit");
  }
  if (parsed.stage === "Booking") {
    if (!parsed.dateDetected) reasons.push("Booking date was not explicit");
    if (!parsed.timeDetected) reasons.push("Booking time was not explicit");
    if (parsed.date && parsed.date < dateToISO(new Date())) reasons.push("Booking date is already in the past");
  }
  if (parsed.stage === "Completed job") {
    if (!parsed.dateDetected) reasons.push("Completed-job date was not explicit");
    if (parsed.date && parsed.date > dateToISO(new Date())) reasons.push("Completed-job date is in the future");
    const duplicateJob =
      !!customer &&
      (Array.isArray(customer.history) ? customer.history : []).some(
        (job) => job.kind === "job" && job.date === parsed.date && job.service === parsed.service
      );
    if (duplicateJob) reasons.push("A completed job with this service and date already exists");
  }

  return {
    safe: reasons.length === 0,
    reasons,
    reason:
      reasons.length === 0
        ? reconciliation.progression
          ? `Exact ${match.reason.toLowerCase()} + high-confidence lifecycle progression ${reconciliation.currentStage} → ${parsed.stage}`
          : `Exact ${match.reason.toLowerCase()} + high-confidence complete record + no active conflict`
        : reasons[0],
    match,
    customer,
    fingerprint,
    reconciliation,
  };
}

function inboxStageTone(stage) {
  if (stage === "Booking") return "green";
  if (stage === "Quote sent") return "amber";
  if (stage === "Completed job") return "blue";
  return "blue";
}

function groupCustomersByService(customers) {
  return customers.reduce((groups, customer) => {
    const key = customer?.service?.trim() || "Usual service";
    if (!groups[key]) groups[key] = [];
    groups[key].push(customer);
    return groups;
  }, {});
}

function buildSimulatedReply(customer, index, quietSlot) {
  const service = (customer?.service || "your usual service").toLowerCase();
  const slot = quietSlot || "That slot";
  const variants = [
    { status: "Interested", body: `Yes please — could you send me a quote for the ${service}?` },
    { status: "Booked", body: `${slot} works for me. What time can you come?` },
    { status: "Not now", body: `Not this month, thanks — maybe later for the ${service}.` },
    { status: "No reply", body: "No reply yet." },
  ];
  return { ...customer, ...variants[index % variants.length] };
}

function replyActionForStatus(status) {
  if (status === "Booked") return { type: "booking", label: "Confirm booking", task: "Confirm the booking time" };
  if (status === "Interested") return { type: "quote", label: "Prepare quote", task: "Prepare and send a quote" };
  if (status === "Not now") return { type: "reminder", label: "Remind later", task: "Save a later follow-up" };
  return null;
}

function customerActionStatus(action) {
  if (!action) return null;
  if (!action.done) return action.type === "quote" ? "Quote in progress" : action.type === "booking" ? "Booking in progress" : "Follow-up in progress";
  if (action.type === "quote") return action.details?.quoteStatus || "Prepared";
  if (action.type === "booking") return action.details?.bookingStatus || "Confirmed";
  if (action.type === "reminder") return action.details?.reminderStatus || "Scheduled";
  return "Active";
}

function isActiveCustomerAction(action) {
  if (!action) return false;
  if (!action.done) return true;
  if (action.type === "quote") return ["Prepared", "Sent", "Accepted"].includes(action.details?.quoteStatus || "Prepared");
  if (action.type === "booking") return !["Cancelled", "Completed"].includes(action.details?.bookingStatus || "Confirmed");
  if (action.type === "reminder") return (action.details?.reminderStatus || "Scheduled") !== "Completed";
  return false;
}

function customerPipelineLabel(customer, action) {
  const status = customerActionStatus(action);
  if (isActiveCustomerAction(action)) {
    if (action.type === "quote") return status === "Sent" ? "Quote sent" : status === "Accepted" ? "Quote accepted" : "Quote active";
    if (action.type === "booking") return status === "Confirmed" ? "Booked" : "Booking";
    if (action.type === "reminder") return "Follow-up set";
  }
  if (!customer?.lastServiceDate && action?.type === "quote" && status === "Declined") return "Quote declined";
  if (!customer?.lastServiceDate && action?.type === "booking" && status === "Cancelled") return "Booking cancelled";
  if (!customer?.lastServiceDate) return "New enquiry";
  return null;
}


const previousCustomerGroups = [
  {
    id: "lapsed",
    title: "Previous customers who may be due again",
    reason: "They already know your business, so they’re a low-cost place to start.",
  },
  {
    id: "repeat",
    title: "8 customers due a repeat service",
    reason: "Their previous service timing suggests they may be ready again.",
  },
  {
    id: "high",
    title: "6 previous high-value customers",
    reason: "These customers previously booked your higher-value work.",
  },
];


const LEGACY_STORAGE_KEY = "@busy-does-it-v05";
const USER_CACHE_PREFIX = "@busy-does-it-user-v312:";
const storageKeyForUser = (userId = "") =>
  userId ? `${USER_CACHE_PREFIX}${userId}` : "";

const connectionSeed = {
  email: false,
  calendar: false,
  googleBusiness: false,
  meta: false,
  googleAds: false,
  crm: false,
  invoicing: false,
};

const intakeConnectionKeys = ["email", "calendar", "crm", "invoicing"];

const connectionRows = [
  ["email", "Email / enquiries", "Feeds incoming customer messages into BUSY Inbox"],
  ["calendar", "Calendar", "Feeds booking changes into BUSY Inbox and helps BUSY understand capacity"],
  ["crm", "CRM / job system", "Feeds enquiry, quote and booking updates into the same customer pipeline"],
  ["invoicing", "Invoicing", "Feeds completed-job and paid-work evidence into customer records"],
  ["googleBusiness", "Google Business", "Supports reviews, local presence and approved profile actions"],
  ["meta", "Facebook / Instagram", "Supports approved posts and adverts"],
  ["googleAds", "Google Ads", "Supports approved local advert tests"],
];

const campaignSteps = [
  {
    id: "past-customers",
    title: "Contact eligible previous customers",
    audience: "Eligible previous customers",
    cost: "low direct-message cost",
    adSpend: "£0",
    message:
      "Hi, we’ve got some availability coming up for your usual service. If you’d like a quote or want to book it, just reply here.",
    why:
      "They already know your business and the service timing says they may be due again. That is why we try this before paying for advertising.",
    evidence: [
      ["Eligibility", "Service-specific repeat timing"],
      ["Existing relationship", "Yes"],
      ["Advertising required", "£0"],
      ["Confidence", "Depends on saved history"],
    ],
    resultTitle: "Customer reactivation tested",
    resultBody: "The prototype tracks replies, useful interest and bookings in plain English.",
    resultFooter: "Advertising spend: £0",
  },
  {
    id: "old-enquiries",
    title: "Follow up quiet enquiries",
    audience: "Quiet enquiry records",
    cost: "£0 ad spend",
    adSpend: "£0",
    message:
      "Hi, you asked us about some work a little while ago. We’ve got some availability coming up and I wanted to check whether you still wanted a quote. No problem if not.",
    why:
      "These people already showed interest, so following them up is cheaper and lower-risk than buying new attention.",
    evidence: [
      ["Opportunity source", "Saved enquiry records"],
      ["Previously requested a quote", "Yes"],
      ["Advertising required", "£0"],
      ["Confidence", "Medium"],
    ],
    resultTitle: "1 useful reply",
    resultBody: "4 followed up • 1 replied • no second booking yet. The remaining space is still open.",
    resultFooter: "Advertising spend so far: £0",
  },
  {
    id: "old-quotes",
    title: "Revisit sent quotes",
    audience: "Sent quote records",
    cost: "£0 ad spend",
    adSpend: "£0",
    message:
      "Hi, we quoted for some work previously. We’ve had a space open up and can still help if the job is still on your list. Reply if you’d like us to revisit the quote.",
    why:
      "A quote means the customer got further than a normal enquiry. It is worth checking before spending money on new leads.",
    evidence: [
      ["Opportunity source", "Saved sent quotes"],
      ["Value source", "Each saved quote"],
      ["Advertising required", "£0"],
      ["Confidence", "Medium"],
    ],
    resultTitle: "No booking yet",
    resultBody: "3 quotes revisited • 1 asked for a later date • the current space is still open.",
    resultFooter: "Advertising spend so far: £0",
  },
  {
    id: "cross-sell",
    title: "Offer a relevant add-on",
    audience: "Suitable previous customers",
    cost: "message cost only",
    adSpend: "£0",
    message:
      "Hi, we’ll already be working nearby and may have room for another service while we’re in the area. Reply if you’d like us to take a look.",
    why:
      "A relevant add-on can sometimes fill small gaps without paying to reach strangers, but only when it genuinely fits the business and customer.",
    evidence: [
      ["Audience", "Existing suitable customers"],
      ["Add-on", "Chosen from the business service list"],
      ["Advertising required", "£0"],
      ["Confidence", "Depends on service fit"],
    ],
    resultTitle: "Free options exhausted",
    resultBody: "6 customers contacted • no booking for the remaining space. We have now tried the sensible low-cost options first.",
    resultFooter: "Paid advertising has not started",
  },
];


export {
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
};
