
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
      { id: "driveway", name: "Driveway cleaning", value: 250, wanted: true, repeatMonths: 9 },
      { id: "gutters", name: "Gutter clearing", value: 90, wanted: false, repeatMonths: 9 },
      { id: "patio", name: "Patio cleaning", value: 220, wanted: true, repeatMonths: 9 },
    ],
  },
  "window-cleaning": {
    id: "window-cleaning",
    label: "Window cleaning",
    description: "Regular window, conservatory and exterior glass work.",
    defaultRepeatMonths: 2,
    services: [
      { id: "windows", name: "Window cleaning", value: 35, wanted: true, repeatMonths: 2 },
      { id: "conservatory", name: "Conservatory cleaning", value: 120, wanted: true, repeatMonths: 6 },
      { id: "window-gutters", name: "Gutter clearing", value: 90, wanted: false, repeatMonths: 12 },
    ],
  },
  "gardening-landscaping": {
    id: "gardening-landscaping",
    label: "Gardening & landscaping",
    description: "Garden maintenance, lawns, hedges and landscaping jobs.",
    defaultRepeatMonths: 2,
    services: [
      { id: "garden-maintenance", name: "Garden maintenance", value: 80, wanted: true, repeatMonths: 1 },
      { id: "hedges", name: "Hedge trimming", value: 120, wanted: true, repeatMonths: 4 },
      { id: "landscaping", name: "Landscaping", value: 900, wanted: false, repeatMonths: null },
    ],
  },
  "plumbing-heating": {
    id: "plumbing-heating",
    label: "Plumbing & heating",
    description: "Repairs, boiler work and planned servicing.",
    defaultRepeatMonths: null,
    services: [
      { id: "boiler-service", name: "Boiler service", value: 110, wanted: true, repeatMonths: 12 },
      { id: "plumbing-repair", name: "Plumbing repair", value: 140, wanted: true, repeatMonths: null },
      { id: "radiators", name: "Radiator work", value: 180, wanted: false, repeatMonths: null },
      { id: "landlord-check", name: "Landlord safety check", value: 90, wanted: false, repeatMonths: 12 },
    ],
  },
  "electrical": {
    id: "electrical",
    label: "Electrical",
    description: "Repairs, inspections, upgrades and installation work.",
    defaultRepeatMonths: null,
    services: [
      { id: "electrical-repair", name: "Electrical repair", value: 150, wanted: true, repeatMonths: null },
      { id: "eicr", name: "EICR inspection", value: 180, wanted: true, repeatMonths: 60 },
      { id: "consumer-unit", name: "Consumer unit work", value: 650, wanted: false, repeatMonths: null },
      { id: "ev-charger", name: "EV charger installation", value: 850, wanted: false, repeatMonths: null },
    ],
  },
  "mobile-hair-beauty": {
    id: "mobile-hair-beauty",
    label: "Mobile hair & beauty",
    description: "Appointment-led hair and beauty services.",
    defaultRepeatMonths: 2,
    services: [
      { id: "haircut", name: "Haircut", value: 35, wanted: true, repeatMonths: 2 },
      { id: "colour", name: "Hair colour", value: 85, wanted: true, repeatMonths: 2 },
      { id: "blow-dry", name: "Blow dry", value: 30, wanted: false, repeatMonths: 1 },
      { id: "beauty-treatment", name: "Beauty treatment", value: 45, wanted: false, repeatMonths: 1 },
    ],
  },
  "other-service": {
    id: "other-service",
    label: "Other service business",
    description: "Use the generic core and add the services that fit your business.",
    defaultRepeatMonths: null,
    services: [
      { id: "main-service", name: "Main service", value: 0, wanted: true, repeatMonths: null },
    ],
  },
};

function getVerticalPack(verticalId) {
  return VERTICAL_PACKS[verticalId] || VERTICAL_PACKS["other-service"];
}

const servicesSeed = VERTICAL_PACKS["exterior-cleaning"].services.map((item) => ({ ...item }));

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

function addDaysISO(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
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


const STORAGE_KEY = "@busy-does-it-v05";

const connectionSeed = {
  calendar: false,
  googleBusiness: false,
  meta: false,
  googleAds: false,
  crm: false,
  invoicing: false,
};

const connectionRows = [
  ["calendar", "Calendar", "Helps spot quiet days automatically"],
  ["googleBusiness", "Google Business", "Helps understand local presence and reviews"],
  ["meta", "Facebook / Instagram", "Lets approved posts and adverts run"],
  ["googleAds", "Google Ads", "Lets approved local advert tests run"],
  ["crm", "CRM / job system", "Helps follow enquiries through to jobs"],
  ["invoicing", "Invoicing", "Helps measure paid work instead of clicks"],
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
    title: "Follow up 4 old enquiries",
    audience: "4 old enquiries",
    cost: "£0 ad spend",
    adSpend: "£0",
    message:
      "Hi, you asked us about some work a little while ago. We’ve got some availability coming up and I wanted to check whether you still wanted a quote. No problem if not.",
    why:
      "These people already showed interest, so following them up is cheaper and lower-risk than buying new attention.",
    evidence: [
      ["Old enquiries worth retrying", "4"],
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
    title: "Revisit 3 old quotes",
    audience: "3 old quotes",
    cost: "£0 ad spend",
    adSpend: "£0",
    message:
      "Hi, we quoted for some work previously. We’ve had a space open up and can still help if the job is still on your list. Reply if you’d like us to revisit the quote.",
    why:
      "A quote means the customer got further than a normal enquiry. It is worth checking before spending money on new leads.",
    evidence: [
      ["Old quotes still relevant", "3"],
      ["Average quoted value", "£310"],
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
  const [previousCustomerCount, setPreviousCustomerCount] = useState("14");
  const [eligibleCustomerCount, setEligibleCustomerCount] = useState("12");
  const [oldEnquiryCount, setOldEnquiryCount] = useState("4");
  const [oldQuoteCount, setOldQuoteCount] = useState("3");
  const [oldQuoteTopValue, setOldQuoteTopValue] = useState("340");
  const [unansweredReviewCount, setUnansweredReviewCount] = useState("4");
  const [recentPhotoCountNeeded, setRecentPhotoCountNeeded] = useState("2");
  const [customers, setCustomers] = useState(customerSeed);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerService, setNewCustomerService] = useState("Driveway cleaning");
  const [newCustomerDate, setNewCustomerDate] = useState("2025-01-01");
  const [newCustomerValue, setNewCustomerValue] = useState("");
  const [newCustomerContactOk, setNewCustomerContactOk] = useState(true);
  const [newCustomerHasPreviousJob, setNewCustomerHasPreviousJob] = useState(true);
  const [newEnquiryName, setNewEnquiryName] = useState("");
  const [newEnquiryPhone, setNewEnquiryPhone] = useState("");
  const [newEnquiryService, setNewEnquiryService] = useState("Driveway cleaning");
  const [newEnquiryCustomService, setNewEnquiryCustomService] = useState("");
  const [newEnquiryNote, setNewEnquiryNote] = useState("");
  const [customerNoteText, setCustomerNoteText] = useState("");
  const [services, setServices] = useState(servicesSeed);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceValue, setNewServiceValue] = useState("");
  const [alwaysAsk, setAlwaysAsk] = useState(true);
  const [customerContact, setCustomerContact] = useState(true);
  const [testLimit, setTestLimit] = useState("25");
  const [weeklyLimit, setWeeklyLimit] = useState("100");
  const [connectedAccounts, setConnectedAccounts] = useState(connectionSeed);
  const [dismissedOpportunities, setDismissedOpportunities] = useState([]);
  const [selectedGap, setSelectedGap] = useState("Thursday afternoon");
  const [selectedCustomerGroup, setSelectedCustomerGroup] = useState(previousCustomerGroups[0]);
  const [selectedServiceId, setSelectedServiceId] = useState("driveway");
  const [moreWorkGoal, setMoreWorkGoal] = useState("More work next week");
  const [campaignStage, setCampaignStage] = useState(0);
  const [adBudget, setAdBudget] = useState("20");
  const [message, setMessage] = useState(campaignSteps[0].message);
  const [serviceMessages, setServiceMessages] = useState({});
  const [lastSimulatedRecipients, setLastSimulatedRecipients] = useState([]);
  const [replyActions, setReplyActions] = useState({});
  const [selectedReplyActionId, setSelectedReplyActionId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [actionQuoteAmount, setActionQuoteAmount] = useState("");
  const [actionQuoteMessage, setActionQuoteMessage] = useState("");
  const [actionBookingDate, setActionBookingDate] = useState(nextDateForSlot("Thursday afternoon"));
  const [actionBookingTime, setActionBookingTime] = useState(defaultTimeForSlot("Thursday afternoon"));
  const [actionJobValue, setActionJobValue] = useState("");
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

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
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
        if (saved.previousCustomerCount !== undefined) setPreviousCustomerCount(String(saved.previousCustomerCount));
        if (saved.eligibleCustomerCount !== undefined) setEligibleCustomerCount(String(saved.eligibleCustomerCount));
        if (saved.oldEnquiryCount !== undefined) setOldEnquiryCount(String(saved.oldEnquiryCount));
        if (saved.oldQuoteCount !== undefined) setOldQuoteCount(String(saved.oldQuoteCount));
        if (saved.oldQuoteTopValue !== undefined) setOldQuoteTopValue(String(saved.oldQuoteTopValue));
        if (saved.unansweredReviewCount !== undefined) setUnansweredReviewCount(String(saved.unansweredReviewCount));
        if (saved.recentPhotoCountNeeded !== undefined) setRecentPhotoCountNeeded(String(saved.recentPhotoCountNeeded));
        if (Array.isArray(saved.customers)) setCustomers(saved.customers);
        if (Array.isArray(saved.lastSimulatedRecipients)) setLastSimulatedRecipients(saved.lastSimulatedRecipients);
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
    if (!hydrated) return;
    const data = {
      onboardingComplete,
      businessName,
      trade,
      verticalId,
      postcode,
      radius,
      quietSlot,
      previousCustomerCount,
      eligibleCustomerCount,
      oldEnquiryCount,
      oldQuoteCount,
      oldQuoteTopValue,
      unansweredReviewCount,
      recentPhotoCountNeeded,
      customers,
      lastSimulatedRecipients,
      replyActions,
      services,
      alwaysAsk,
      customerContact,
      testLimit,
      weeklyLimit,
      connectedAccounts,
      dismissedOpportunities,
      selectedServiceId,
      advanced,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [
    hydrated,
    onboardingComplete,
    businessName,
    trade,
    verticalId,
    postcode,
    radius,
    quietSlot,
    previousCustomerCount,
    eligibleCustomerCount,
    oldEnquiryCount,
    oldQuoteCount,
    oldQuoteTopValue,
    unansweredReviewCount,
    recentPhotoCountNeeded,
    customers,
    lastSimulatedRecipients,
    replyActions,
    services,
    alwaysAsk,
    customerContact,
    testLimit,
    weeklyLimit,
    connectedAccounts,
    dismissedOpportunities,
    selectedServiceId,
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

  const hasActiveCustomerWork = (customerId) =>
    isActiveCustomerAction(replyActions[customerId]);

  const buildReactivationMessages = () => {
    const eligible = customerContact
      ? customers.filter(
          (customer) =>
            isEligibleCustomer(customer, services, verticalId) &&
            !hasActiveCustomerWork(customer.id)
        )
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
    setServiceMessages(buildReactivationMessages());
  };

  const startCampaign = (stage = 0) => {
    const safeStage = Math.max(0, Math.min(stage, campaignSteps.length - 1));
    setCampaignStage(safeStage);

    if (safeStage === 0) {
      const drafts = buildReactivationMessages();
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
      const recipients = customerContact
        ? customers.filter(
            (customer) =>
              isEligibleCustomer(customer, services, verticalId) &&
              !hasActiveCustomerWork(customer.id)
          )
        : [];
      const recipientIds = new Set(recipients.map((customer) => customer.id));
      setLastSimulatedRecipients(recipients.map((customer) => ({ ...customer })));
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
        summary:
          quoteStatus === "Prepared"
            ? `Quote prepared for £${action.details?.quoteAmount || "—"}`
            : quoteStatus === "Sent"
            ? `Quote sent (simulated) for £${action.details?.quoteAmount || "—"}`
            : quoteStatus === "Accepted"
            ? `Quote accepted for £${action.details?.quoteAmount || "—"}`
            : `Quote declined for £${action.details?.quoteAmount || "—"}`,
      },
      completedAt: new Date().toISOString(),
    }));
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
    appendCustomerActivity(customerId, {
      kind: "booking",
      title: `Booking ${bookingStatus.toLowerCase()}`,
      note: actionBefore?.details?.bookingDate
        ? `${formatUKDate(actionBefore.details.bookingDate)} at ${actionBefore.details.bookingTime || "time not set"}`
        : "",
      value: actionBefore?.details?.sourceQuoteAmount || actionBefore?.details?.jobValue || "",
    });
  };

  const markBookingCompleted = (customerId, jobValue) => {
    const action = replyActions[customerId];
    if (!action?.details?.bookingDate) return;
    const amount = Number(jobValue) || Number(action.details?.sourceQuoteAmount) || 0;
    setReplyActions((current) => ({
      ...current,
      [customerId]: {
        ...current[customerId],
        done: true,
        details: {
          ...(current[customerId]?.details || {}),
          bookingStatus: "Completed",
          jobValue: amount || "",
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
        const nextHistory = duplicate
          ? history
          : [
              ...history,
              {
                id: `job-${customerId}-${action.details.bookingDate}`,
                kind: "job",
                date: action.details.bookingDate,
                service: customer.service,
                value: amount || "",
                note: "Completed through Busy Does It prototype",
              },
            ];
        const activity = Array.isArray(customer.activity) ? customer.activity : [];
        return {
          ...customer,
          lastServiceDate: action.details.bookingDate,
          lastJobValue: amount || customer.lastJobValue,
          history: nextHistory,
          activity: [
            ...activity,
            {
              id: `completed-${customerId}-${action.details.bookingDate}`,
              kind: "job",
              date: action.details.bookingDate,
              createdAt: new Date().toISOString(),
              title: "Job completed",
              note: `${customer.service} completed through Busy Does It.`,
              value: amount || "",
            },
          ],
        };
      })
    );
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
    setNewEnquiryService(preferred?.name || trade || "Service");
    setNewEnquiryCustomService("");
    setNewEnquiryNote("");
    go("newEnquiry");
  };

  const saveNewEnquiry = () => {
    const name = newEnquiryName.trim();
    const phone = newEnquiryPhone.trim();
    const service = newEnquiryCustomService.trim() || newEnquiryService.trim() || services[0]?.name || trade || "Service";
    if (!name || !phone) return false;
    const id = `enquiry-${Date.now()}`;
    const now = new Date().toISOString();
    const customer = {
      id,
      name,
      phone,
      service,
      lastServiceDate: "",
      lastJobValue: 0,
      contactOk: true,
      source: "New enquiry",
      createdAt: now,
      activity: [
        {
          id: `activity-${id}-created`,
          kind: "enquiry",
          date: dateToISO(new Date()),
          createdAt: now,
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
    setNewEnquiryCustomService("");
    setNewEnquiryNote("");
    go("customerDetail");
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

  const resetPrototype = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    setOnboardingComplete(false);
    setBusinessName("Dave's Exterior Cleaning");
    setTrade("Exterior cleaning");
    setVerticalId("exterior-cleaning");
    setPostcode("EX17");
    setRadius("15");
    setQuietSlot("Thursday afternoon");
    setPreviousCustomerCount("14");
    setEligibleCustomerCount("12");
    setOldEnquiryCount("4");
    setOldQuoteCount("3");
    setOldQuoteTopValue("340");
    setUnansweredReviewCount("4");
    setRecentPhotoCountNeeded("2");
    setCustomers(customerSeed);
    setNewCustomerName("");
    setNewCustomerPhone("");
    setNewCustomerService("Driveway cleaning");
    setNewCustomerDate("2025-01-01");
    setNewCustomerValue("");
    setNewCustomerContactOk(true);
    setNewEnquiryCustomService("");
    setServiceMessages({});
    setLastSimulatedRecipients([]);
    setReplyActions({});
    setSelectedReplyActionId(null);
    setSelectedCustomerId(null);
    setActionJobValue("");
    setEditingCustomerId(null);
    setPendingRemoveCustomerId(null);
    setServices(servicesSeed);
    setAlwaysAsk(true);
    setCustomerContact(true);
    setTestLimit("25");
    setWeeklyLimit("100");
    setConnectedAccounts(connectionSeed);
    setDismissedOpportunities([]);
    setSelectedServiceId("driveway");
    setAdvanced(false);
    setHistory([]);
    setTab("Home");
    setScreen("welcome");
  };

  const selectedService = services.find((x) => x.id === selectedServiceId) || services[0];
  const eligibleCustomers = customerContact
    ? customers.filter(
        (customer) =>
          isEligibleCustomer(customer, services, verticalId) &&
          !hasActiveCustomerWork(customer.id)
      )
    : [];
  const openEnquiryCount = customers.filter(
    (customer) => !customer.lastServiceDate && !replyActions[customer.id]
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
    previousCustomerCount,
    setPreviousCustomerCount,
    eligibleCustomerCount,
    setEligibleCustomerCount,
    oldEnquiryCount,
    setOldEnquiryCount,
    oldQuoteCount,
    setOldQuoteCount,
    oldQuoteTopValue,
    setOldQuoteTopValue,
    unansweredReviewCount,
    setUnansweredReviewCount,
    recentPhotoCountNeeded,
    setRecentPhotoCountNeeded,
    customers,
    setCustomers,
    eligibleCustomers,
    openEnquiryCount,
    selectedCustomerId,
    setSelectedCustomerId,
    selectedCustomer,
    openCustomer,
    newCustomerName,
    setNewCustomerName,
    newCustomerPhone,
    setNewCustomerPhone,
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
    newEnquiryService,
    setNewEnquiryService,
    newEnquiryCustomService,
    setNewEnquiryCustomService,
    newEnquiryNote,
    setNewEnquiryNote,
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
    completeReplyAction,
    selectedReplyActionId,
    setSelectedReplyActionId,
    selectedReplyCustomer,
    actionQuoteAmount,
    setActionQuoteAmount,
    actionQuoteMessage,
    setActionQuoteMessage,
    actionBookingDate,
    setActionBookingDate,
    actionBookingTime,
    setActionBookingTime,
    actionJobValue,
    setActionJobValue,
    actionReminderDate,
    setActionReminderDate,
    pendingReplyActionCount,
    completedQuoteCount,
    completedBookingCount,
    completedReminderCount,
    dueReminderEntries,
    activeQuoteValue,
    bookedWorkValue,
    pipelineWorkValue,
    completedJobValue,
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

  if (!hydrated) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <Text style={styles.brand}>BUSY DOES IT</Text>
          <Text style={styles.loadingText}>Loading your prototype…</Text>
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

function Shell({ s, children, title, subtitle, brandCue, noNav = false, noBack = false }) {
  return (
    <View style={styles.shell}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.brand}>BUSY DOES IT</Text>
            <Text style={styles.tagline}>More work. Less fuss.</Text>
            <Text style={styles.prototypeBadge}>Prototype v0.8 • flexible service-business core</Text>
          </View>
          {!noBack && s.history?.length > 0 ? (
            <Pressable onPress={s.back} style={styles.backPill}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          ) : null}
        </View>

        {brandCue ? <Text style={styles.brandCue}>{brandCue}</Text> : null}
        {title ? <Text style={styles.h1}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        {children}
      </ScrollView>
      {!noNav ? <BottomNav s={s} /> : null}
    </View>
  );
}

function BottomNav({ s }) {
  const items = [
    ["Home", "home"],
    ["Work", "workHub"],
    ["Results", "results"],
    ["Settings", "settings"],
  ];
  return (
    <View style={styles.nav}>
      {items.map(([label, target]) => {
        const active = s.tab === label;
        return (
          <Pressable
            key={label}
            style={styles.navItem}
            onPress={() => {
              s.setTab(label);
              s.jump(target, label);
            }}
          >
            <View style={[styles.navDot, active && styles.navDotActive]} />
            <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Card({ eyebrow, title, body, footer, tone = "blue", children }) {
  const toneStyle =
    tone === "green"
      ? styles.cardGreen
      : tone === "amber"
      ? styles.cardAmber
      : styles.cardBlue;
  return (
    <View style={[styles.card, toneStyle]}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {body ? <Text style={styles.cardBody}>{body}</Text> : null}
      {children}
      {footer ? <Text style={styles.cardFooter}>{footer}</Text> : null}
    </View>
  );
}

function Button({ label, onPress, primary = false, danger = false, disabled = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        primary && styles.buttonPrimary,
        danger && styles.buttonDanger,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          primary && styles.buttonTextPrimary,
          danger && styles.buttonTextPrimary,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SmallLink({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.smallLinkWrap}>
      <Text style={styles.smallLink}>{label}</Text>
    </Pressable>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = "default", prefix }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldBox}>
        {prefix ? <Text style={styles.fieldPrefix}>{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          style={styles.fieldInput}
          placeholderTextColor="#9AA3B2"
        />
      </View>
    </View>
  );
}


function DatePickerField({ label, value, onChange, allowFuture = false, minimumDate = null, maximumDate = null }) {
  const [open, setOpen] = useState(false);
  const selected = dateFromISO(value);
  const [viewMonth, setViewMonth] = useState(
    new Date(selected.getFullYear(), selected.getMonth(), 1, 12, 0, 0)
  );

  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
  const minLimit = minimumDate ? dateFromISO(minimumDate) : null;
  const maxLimit = maximumDate ? dateFromISO(maximumDate) : allowFuture ? null : todayOnly;

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekdayMondayFirst = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = viewMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const previousMonth = new Date(year, month - 1, 1, 12, 0, 0);
  const nextMonth = new Date(year, month + 1, 1, 12, 0, 0);
  const minMonth = minLimit ? new Date(minLimit.getFullYear(), minLimit.getMonth(), 1, 12, 0, 0) : null;
  const maxMonth = maxLimit ? new Date(maxLimit.getFullYear(), maxLimit.getMonth(), 1, 12, 0, 0) : null;
  const canGoBack = !minMonth || previousMonth >= minMonth;
  const canGoForward = !maxMonth || nextMonth <= maxMonth;

  const chooseDate = (day) => {
    const candidate = new Date(year, month, day, 12, 0, 0);
    if (minLimit && candidate < minLimit) return;
    if (maxLimit && candidate > maxLimit) return;
    onChange(dateToISO(candidate));
    setOpen(false);
  };

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        onPress={() => {
          const current = dateFromISO(value);
          setViewMonth(new Date(current.getFullYear(), current.getMonth(), 1, 12, 0, 0));
          setOpen((currentOpen) => !currentOpen);
        }}
        style={[styles.fieldBox, styles.dateFieldBox]}
      >
        <Text style={styles.dateFieldText}>{formatUKDate(value)}</Text>
        <Text style={styles.dateFieldHint}>{open ? "Close" : "Choose date"}</Text>
      </Pressable>

      {open ? (
        <View style={styles.datePickerPanel}>
          <View style={styles.calendarHeader}>
            <Pressable
              disabled={!canGoBack}
              style={[styles.calendarNav, !canGoBack && styles.calendarNavDisabled]}
              onPress={() => setViewMonth(previousMonth)}
            >
              <Text style={[styles.calendarNavText, !canGoBack && styles.calendarNavTextDisabled]}>‹</Text>
            </Pressable>
            <Text style={styles.calendarMonth}>{monthLabel}</Text>
            <Pressable
              disabled={!canGoForward}
              style={[styles.calendarNav, !canGoForward && styles.calendarNavDisabled]}
              onPress={() => setViewMonth(nextMonth)}
            >
              <Text style={[styles.calendarNavText, !canGoForward && styles.calendarNavTextDisabled]}>›</Text>
            </Pressable>
          </View>

          <View style={styles.calendarGrid}>
            {["M", "T", "W", "T", "F", "S", "S"].map((dayName, index) => (
              <View key={`head-${index}`} style={styles.calendarCell}>
                <Text style={styles.calendarWeekday}>{dayName}</Text>
              </View>
            ))}
            {Array.from({ length: firstWeekdayMondayFirst }).map((_, index) => (
              <View key={`blank-${index}`} style={styles.calendarCell} />
            ))}
            {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
              const candidate = new Date(year, month, day, 12, 0, 0);
              const disabled =
                (!!minLimit && candidate < minLimit) ||
                (!!maxLimit && candidate > maxLimit);
              const isSelected =
                selected.getFullYear() === year &&
                selected.getMonth() === month &&
                selected.getDate() === day;
              return (
                <View key={day} style={styles.calendarCell}>
                  <Pressable
                    disabled={disabled}
                    onPress={() => chooseDate(day)}
                    style={[
                      styles.calendarDay,
                      isSelected && styles.calendarDaySelected,
                      disabled && styles.calendarDayDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        isSelected && styles.calendarDayTextSelected,
                        disabled && styles.calendarDayTextDisabled,
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
          <Text style={styles.calendarHelp}>Dates use UK day–month–year formatting.</Text>
        </View>
      ) : null}
    </View>
  );
}

function Choice({ label, selected, onPress, sub }) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioCore} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
        {sub ? <Text style={styles.choiceSub}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

function ToggleRow({ title, body, value, onValueChange }) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {body ? <Text style={styles.toggleBody}>{body}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#C8CFD9", true: "#9FC0FF" }}
        thumbColor={value ? C.blue : "#FFFFFF"}
      />
    </View>
  );
}

function MetricRow({ left, right, strong = false }) {
  return (
    <View style={styles.metricRow}>
      <Text style={[styles.metricLeft, strong && styles.metricStrong]}>{left}</Text>
      <Text style={[styles.metricRight, strong && styles.metricStrong]}>{right}</Text>
    </View>
  );
}


function StatusChip({ label, tone = "blue" }) {
  const style = tone === "green" ? styles.chipGreen : tone === "amber" ? styles.chipAmber : styles.chipBlue;
  return (
    <View style={[styles.chip, style]}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

function InlineExplanation({ why, evidence = [] }) {
  const [showWhy, setShowWhy] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  return (
    <View style={styles.explainWrap}>
      <Pressable onPress={() => setShowWhy((v) => !v)} style={styles.inlineLinkWrap}>
        <Text style={styles.inlineLink}>{showWhy ? "Hide why" : "Why this?"}</Text>
      </Pressable>
      {showWhy ? (
        <View style={styles.inlinePanel}>
          <Text style={styles.inlineWhy}>{why}</Text>
          {evidence.length ? (
            <>
              <Pressable onPress={() => setShowEvidence((v) => !v)} style={styles.inlineLinkWrapLeft}>
                <Text style={styles.inlineLink}>{showEvidence ? "Hide evidence" : "Show evidence"}</Text>
              </Pressable>
              {showEvidence ? (
                <View style={styles.evidenceBox}>
                  {evidence.map(([left, right]) => (
                    <MetricRow key={left} left={left} right={right} />
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function OpportunityCard({
  eyebrow,
  title,
  body,
  footer,
  status,
  tone = "blue",
  actionLabel = "Do it",
  onAction,
  onIgnore,
  why,
  evidence,
}) {
  const toneStyle = tone === "green" ? styles.opportunityGreen : tone === "amber" ? styles.opportunityAmber : styles.opportunityBlue;
  return (
    <View style={[styles.opportunityCard, toneStyle]}>
      <View style={styles.opportunityTop}>
        <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
        {status ? <StatusChip label={status} tone={tone} /> : null}
      </View>
      <Text style={styles.opportunityTitle}>{title}</Text>
      <Text style={styles.opportunityBody}>{body}</Text>
      {footer ? <Text style={styles.opportunityFooter}>{footer}</Text> : null}
      {why ? <InlineExplanation why={why} evidence={evidence} /> : null}
      <View style={styles.actionRow}>
        <Pressable onPress={onAction} style={styles.miniPrimary}>
          <Text style={styles.miniPrimaryText}>{actionLabel}</Text>
        </Pressable>
        {onIgnore ? (
          <Pressable onPress={onIgnore} style={styles.miniSecondary}>
            <Text style={styles.miniSecondaryText}>Ignore</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function ProgressStrip({ current, total }) {
  const pct = Math.max(0, Math.min(1, current / total));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
    </View>
  );
}

function WelcomeScreen({ s }) {
  return (
    <Shell
      s={s}
      noNav
      noBack
      title="Need more work?"
      subtitle="Tell Busy Does It what the business needs. We’ll try the cheapest sensible moves first — and you stay in control."
    >
      <Card eyebrow="The idea" title="More work. Less fuss." tone="green">
        <Text style={styles.tick}>• Start with the business problem, not marketing jargon</Text>
        <Text style={styles.tick}>• Free and low-cost options before paid ads</Text>
        <Text style={styles.tick}>• Clear limits before money is spent</Text>
      </Card>
      <Button label="Get started" primary onPress={() => s.go("setupVertical")} />
      <Text style={styles.helperCenter}>Quick setup first. Spending rules and account connections can be added later.</Text>
    </Shell>
  );
}

function SetupVertical({ s }) {
  const packs = Object.values(VERTICAL_PACKS);
  return (
    <Shell
      s={s}
      noNav
      title="What kind of business is it?"
      subtitle="This only changes the starting suggestions and timing rules. The core app stays the same."
      brandCue="One core app. Different service-business rules underneath."
    >
      {packs.map((pack) => (
        <Choice
          key={pack.id}
          label={pack.label}
          sub={pack.description}
          selected={s.verticalId === pack.id}
          onPress={() => s.applyVerticalPack(pack.id)}
        />
      ))}
      <Card
        eyebrow="Not boxed in"
        title="You can still add any service"
        body="The business type gives Busy Does It a sensible starting point. Services can still be added, renamed or changed later."
        tone="green"
      />
      <Button label="Continue" primary onPress={() => s.go("setupBusiness")} />
    </Shell>
  );
}

function SetupBusiness({ s }) {
  return (
    <Shell s={s} noNav title="About your business" subtitle="Just the basics. We can learn more later.">
      <Field label="Business name" value={s.businessName} onChangeText={s.setBusinessName} />
      <Field label="Trade or service" value={s.trade} onChangeText={s.setTrade} />
      <Field label="Postcode / base area" value={s.postcode} onChangeText={s.setPostcode} />
      <Field label="Service radius" value={s.radius} onChangeText={s.setRadius} keyboardType="number-pad" prefix="Miles" />
      <Button label="Continue" primary onPress={() => s.go("setupServices")} />
    </Shell>
  );
}

function SetupServices({ s }) {
  const toggleWanted = (id) => {
    s.setServices((list) => list.map((x) => (x.id === id ? { ...x, wanted: !x.wanted } : x)));
  };
  return (
    <Shell s={s} noNav title="What work do you want?" subtitle="Pick the work you most want more of. You can change this later.">
      {s.services.map((item) => (
        <Pressable key={item.id} onPress={() => toggleWanted(item.id)} style={[styles.serviceCard, item.wanted && styles.serviceCardWanted]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceName}>{item.name}</Text>
            <Text style={styles.serviceValue}>Usually about £{item.value}</Text>
          </View>
          <Text style={[styles.star, item.wanted && styles.starOn]}>{item.wanted ? "★" : "☆"}</Text>
        </Pressable>
      ))}
      <Text style={styles.helper}>Tap the star on the work you most want more of.</Text>
      <Button label="+ Add a service" onPress={() => s.go("addService")} />
      <Button label="Open Busy Does It" primary onPress={s.completeOnboarding} />
      <Text style={styles.helperCenter}>That’s enough to start. Set spending limits and connect accounts later from Settings.</Text>
    </Shell>
  );
}

function AddService({ s }) {
  const save = () => {
    const name = s.newServiceName.trim();
    if (!name) return;
    const parsed = Number(String(s.newServiceValue).replace(/[^0-9.]/g, ""));
    s.setServices((list) => [
      ...list,
      {
        id: `custom-${Date.now()}`,
        name,
        value: Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0,
        wanted: true,
        repeatMonths: s.verticalPack?.defaultRepeatMonths ?? null,
      },
    ]);
    s.setNewServiceName("");
    s.setNewServiceValue("");
    s.back();
  };

  return (
    <Shell s={s} noNav title="Add a service" subtitle="If you do it, you can add it. We won’t box you into a preset list.">
      <Field label="Service" value={s.newServiceName} onChangeText={s.setNewServiceName} placeholder="e.g. Conservatory roof cleaning" />
      <Field label="Rough job value" value={s.newServiceValue} onChangeText={s.setNewServiceValue} keyboardType="number-pad" prefix="£" placeholder="Optional" />
      <Card
        eyebrow="Why we ask"
        title="This helps Busy Does It find the right work"
        body="A rough value is enough. You can change it later, and the app can learn better values from real jobs over time."
      />
      <Button label="Add service" primary onPress={save} disabled={!s.newServiceName.trim()} />
      <Button label="Cancel" onPress={s.back} />
    </Shell>
  );
}

function SetupLimits({ s }) {
  return (
    <Shell s={s} noNav title="Your limits" subtitle="Set the rules before any marketing runs.">
      <ToggleRow
        title="Always ask before spending"
        body="On by default. You approve every paid test."
        value={s.alwaysAsk}
        onValueChange={s.setAlwaysAsk}
      />
      <ToggleRow
        title="Contact previous customers"
        body="Allow the app to suggest eligible previous customers first."
        value={s.customerContact}
        onValueChange={s.setCustomerContact}
      />
      <Field label="Maximum single test" value={s.testLimit} onChangeText={s.setTestLimit} keyboardType="number-pad" prefix="£" />
      <Field label="Weekly limit" value={s.weeklyLimit} onChangeText={s.setWeeklyLimit} keyboardType="number-pad" prefix="£" />
      <Button label="Save my limits" primary onPress={() => s.go("setupConnect")} />
    </Shell>
  );
}

function SetupConnect({ s }) {
  return (
    <Shell s={s} noNav title="Choose what you use" subtitle="Prototype selection only — this does not connect a real external account.">
      {connectionRows.map(([key, label, body]) => {
        const connected = !!s.connectedAccounts[key];
        return (
          <View key={key} style={styles.connectRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.connectTitle}>{label}</Text>
              <Text style={styles.connectBody}>{body}</Text>
            </View>
            <Pressable style={[styles.connectButton, connected && styles.connectButtonOn]} onPress={() => s.toggleConnection(key)}>
              <Text style={[styles.connectButtonText, connected && { color: C.green }]}>{connected ? "Selected" : "Select"}</Text>
            </Pressable>
          </View>
        );
      })}
      <Button label="Done" primary onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}


function HomeScreen({ s }) {
  const serviceName = s.selectedService?.name || s.services.find((x) => x.wanted)?.name || s.trade || "your priority service";
  const customerCount = s.customers.length;
  const eligibleCount = s.eligibleCustomers.length;
  const todayISO = dateToISO(new Date());
  const openEnquiries = s.customers
    .filter((customer) => !customer.lastServiceDate && !s.replyActions?.[customer.id])
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const nextEnquiry = openEnquiries[0] || null;
  const upcomingBookings = Object.entries(s.replyActions || {})
    .map(([id, action]) => {
      if (!action?.done || action.type !== "booking" || !action.details?.bookingDate) return null;
      const customer =
        s.customers.find((item) => item.id === id) ||
        s.lastSimulatedRecipients.find((item) => item.id === id);
      return customer ? { id, action, customer } : null;
    })
    .filter((item) =>
      item &&
      item.action.details.bookingDate >= todayISO &&
      !["Cancelled", "Completed"].includes(item.action.details?.bookingStatus || "Confirmed")
    )
    .sort((a, b) =>
      `${a.action.details.bookingDate}T${a.action.details.bookingTime || "00:00"}`.localeCompare(
        `${b.action.details.bookingDate}T${b.action.details.bookingTime || "00:00"}`
      )
    );
  const nextBooking = upcomingBookings[0] || null;
  const activeQuoteEntries = Object.entries(s.replyActions || {})
    .map(([id, action]) => {
      if (
        action?.type !== "quote" ||
        !action?.done ||
        !["Prepared", "Sent", "Accepted"].includes(action.details?.quoteStatus || "Prepared")
      ) return null;
      const customer =
        s.customers.find((item) => item.id === id) ||
        s.lastSimulatedRecipients.find((item) => item.id === id);
      return customer ? { id, action, customer } : null;
    })
    .filter(Boolean)
    .sort((a, b) => String(b.action.completedAt || "").localeCompare(String(a.action.completedAt || "")));
  const priorityQuote = activeQuoteEntries[0] || null;
  const opportunities = [
    ...(s.pendingReplyActionCount
      ? [{
          id: "reply-actions",
          eyebrow: "Customer work",
          title: `${s.pendingReplyActionCount} customer action${s.pendingReplyActionCount === 1 ? " needs" : "s need"} your attention`,
          body: "Quotes, bookings and follow-ups stay visible until you deal with them — whether they came from a simulated marketing reply or were started directly from a customer record.",
          footer: "Next step: handle the customer work",
          status: "Action needed",
          tone: "green",
          why: "A lead or customer conversation is only valuable if it turns into a clear next step. Busy Does It keeps unfinished customer work visible.",
          evidence: [
            ["Pending customer actions", String(s.pendingReplyActionCount)],
            ["Source", "Customer records and prototype activity"],
            ["Advertising required", "£0"],
          ],
          onAction: () => s.go("customerActivity"),
        }]
      : []),
    {
      id: "quiet-slot",
      eyebrow: "Capacity",
      title: `${s.quietSlot || "A quiet slot"} is free`,
      body: `You have ${customerCount} saved customer records. ${eligibleCount} are due and allowed to contact now.`,
      footer: "Recommended first move: £0 advertising spend",
      status: eligibleCount ? "Worth trying" : "No one due",
      tone: eligibleCount ? "green" : "blue",
      why: `Busy Does It checks actual saved customer records first. The timing rule comes from the service rather than assuming every business repeats on the same schedule. Current rule: ${s.eligibilityRule}`,
      evidence: [
        ["Saved customer records", String(customerCount)],
        ["Eligible now", String(eligibleCount)],
        ["Eligibility rule", s.eligibilityRule],
        ["Advertising required", "£0"],
      ],
      onAction: () => s.go("bestMove"),
    },
    {
      id: "profile-fixes",
      eyebrow: "Free improvement",
      title: "Check the free profile gaps",
      body: `Make sure ${serviceName.toLowerCase()} is clear, add ${s.recentPhotoCountNeeded || 0} recent photo${String(s.recentPhotoCountNeeded) === "1" ? "" : "s"}, and deal with ${s.unansweredReviewCount || 0} unanswered review${String(s.unansweredReviewCount) === "1" ? "" : "s"}.`,
      footer: "Cost: £0",
      status: "Free",
      tone: "blue",
      why: "Improve the places customers already find you before paying to send more people there.",
      evidence: [
        ["Priority service", serviceName],
        ["Recent photos wanted", String(s.recentPhotoCountNeeded || 0)],
        ["Unanswered reviews entered", String(s.unansweredReviewCount || 0)],
        ["Cost", "£0"],
      ],
      onAction: () => s.go("profileAudit"),
    },
    {
      id: "old-quotes",
      eyebrow: "Follow-up",
      title: `${s.oldQuoteCount || 0} old quote${String(s.oldQuoteCount) === "1" ? "" : "s"} worth a look`,
      body: `Highest value entered: about £${s.oldQuoteTopValue || 0}. Retrying them needs no advertising spend.`,
      footer: "Advertising spend: £0",
      status: "Low cost",
      tone: "blue",
      why: "These people already asked for a price, so checking whether the job is still live is cheaper than finding new leads.",
      evidence: [
        ["Old quotes entered", String(s.oldQuoteCount || 0)],
        ["Highest value", `£${s.oldQuoteTopValue || 0}`],
        ["Advertising required", "£0"],
      ],
      onAction: () => s.startCampaign(2),
    },
  ].filter((item) => !s.dismissedOpportunities.includes(item.id));

  return (
    <Shell
      s={s}
      noBack
      title="Here’s what I noticed"
      subtitle="Customer recommendations now come from individual records saved on this phone."
      brandCue="Real local records. Simulated sends."
    >
      {openEnquiries.length ? (
        <Pressable onPress={() => s.openCustomer(openEnquiries[0].id)} style={[styles.homePriorityCard, styles.homeReminderCard]}>
          <View style={styles.homePriorityTop}>
            <Text style={styles.homePriorityEyebrow}>NEW ENQUIRY</Text>
            <StatusChip label="Start here" tone="amber" />
          </View>
          <Text style={styles.homePriorityTitle}>{openEnquiries[0].name}</Text>
          <Text style={styles.homePriorityBody}>{openEnquiries[0].service}</Text>
          <Text style={styles.homePriorityLink}>Open customer →</Text>
        </Pressable>
      ) : null}

      {s.dueReminderEntries.length ? (
        <Pressable
          onPress={() => s.openSavedReplyAction(s.dueReminderEntries[0].id)}
          style={[styles.homePriorityCard, styles.homeReminderCard]}
        >
          <View style={styles.homePriorityTop}>
            <Text style={styles.homePriorityEyebrow}>FOLLOW-UP DUE</Text>
            <StatusChip label="Action needed" tone="amber" />
          </View>
          <Text style={styles.homePriorityTitle}>{s.dueReminderEntries[0].customer.name}</Text>
          <Text style={styles.homePriorityBody}>
            {s.dueReminderEntries[0].customer.service} • due {formatUKDate(s.dueReminderEntries[0].action.details.reminderDate)}
          </Text>
          <Text style={styles.homePriorityLink}>Open follow-up →</Text>
        </Pressable>
      ) : null}

      {nextEnquiry ? (
        <Pressable onPress={() => s.openCustomer(nextEnquiry.id)} style={styles.homePriorityCard}>
          <View style={styles.homePriorityTop}>
            <Text style={styles.homePriorityEyebrow}>NEW ENQUIRY</Text>
            <StatusChip label="Needs next step" tone="amber" />
          </View>
          <Text style={styles.homePriorityTitle}>{nextEnquiry.name}</Text>
          <Text style={styles.homePriorityBody}>{nextEnquiry.service}</Text>
          <Text style={styles.homePriorityLink}>Open enquiry →</Text>
        </Pressable>
      ) : null}

      {nextBooking ? (
        <Pressable
          onPress={() => s.openSavedReplyAction(nextBooking.id)}
          style={styles.homePriorityCard}
        >
          <View style={styles.homePriorityTop}>
            <Text style={styles.homePriorityEyebrow}>NEXT BOOKING</Text>
            <StatusChip label="Customer work" tone="green" />
          </View>
          <Text style={styles.homePriorityTitle}>{nextBooking.customer.name}</Text>
          <Text style={styles.homePriorityBody}>
            {nextBooking.customer.service} • {formatUKDate(nextBooking.action.details.bookingDate)} at {nextBooking.action.details.bookingTime || "time not set"}
          </Text>
          <Text style={styles.homePriorityLink}>Open booking →</Text>
        </Pressable>
      ) : null}

      {!s.dueReminderEntries.length && !nextBooking && priorityQuote ? (
        <Pressable onPress={() => s.openSavedReplyAction(priorityQuote.id)} style={styles.customerTimelineCard}>
          <View style={styles.homePriorityTop}>
            <Text style={styles.homePriorityEyebrow}>ACTIVE QUOTE</Text>
            <StatusChip label={priorityQuote.action.details?.quoteStatus || "Prepared"} tone="green" />
          </View>
          <Text style={styles.homePriorityTitle}>{priorityQuote.customer.name}</Text>
          <Text style={styles.homePriorityBody}>
            {priorityQuote.customer.service} • £{priorityQuote.action.details?.quoteAmount || "—"}
          </Text>
          <Text style={styles.homePriorityLink}>Open quote →</Text>
        </Pressable>
      ) : null}

      <View style={styles.dashboardHeader}>
        <StatusChip label={`${opportunities.length} opportunities`} tone={opportunities.length ? "green" : "blue"} />
        <Text style={styles.dashboardHint}>Customer work is shown before general marketing suggestions.</Text>
      </View>

      {opportunities.length ? (
        opportunities.map((item) => (
          <OpportunityCard
            key={item.id}
            {...item}
            actionLabel={item.id === "reply-actions" ? "Review actions" : "Do it"}
            onIgnore={() => s.dismissOpportunity(item.id)}
          />
        ))
      ) : (
        <Card eyebrow="All clear" title="Nothing urgent right now" body="You’ve ignored the current opportunities. Restore them any time to keep testing." tone="green" />
      )}

      {s.dismissedOpportunities.length ? <Button label="Restore ignored opportunities" onPress={s.restoreOpportunities} /> : null}
      {s.completedBookingCount ? (
        <Button label={`Bookings • ${s.completedBookingCount}`} onPress={() => s.go("bookings")} />
      ) : null}
      {Object.keys(s.replyActions || {}).length ? (
        <Button
          label={`Customer activity • ${s.pendingReplyActionCount} to do`}
          onPress={() => s.go("customerActivity")}
        />
      ) : null}
      <Button label="Customer records" onPress={() => s.go("customerRecords")} />
      <Button label="Update my business data" onPress={() => s.go("businessData")} />
      <Button label="Open work hub" primary onPress={() => s.jump("workHub", "Work")} />
    </Shell>
  );
}

function WorkHub({ s }) {
  const todayISO = dateToISO(new Date());
  const openEnquiries = s.customers
    .filter((customer) => !customer.lastServiceDate && !s.replyActions?.[customer.id])
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
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
  const todayBookings = bookings.filter((item) => item.action.details.bookingDate === todayISO);
  const upcomingBookings = bookings.filter((item) => item.action.details.bookingDate > todayISO);
  const nextQuote = activeQuotes[0] || null;
  const nextBooking = todayBookings[0] || upcomingBookings[0] || null;

  return (
    <Shell
      s={s}
      noBack
      title="Work"
      subtitle="Customers, quotes, bookings and follow-ups first. Marketing sits underneath when you need more work."
      brandCue="Run the work you already have before buying more attention."
    >
      <Card eyebrow="Today" title={todayBookings.length ? `${todayBookings.length} job${todayBookings.length === 1 ? "" : "s"} booked today` : "No booked jobs today"} tone={todayBookings.length ? "green" : "blue"}>
        <MetricRow left="New enquiries" right={String(s.openEnquiryCount)} />
        <MetricRow left="Work in pipeline" right={`£${s.pipelineWorkValue}`} strong={s.pipelineWorkValue > 0} />
        <MetricRow left="Active quote value" right={`£${s.activeQuoteValue}`} />
        <MetricRow left="Booked work value" right={`£${s.bookedWorkValue}`} />
        <MetricRow left="Follow-ups due" right={String(s.dueReminderEntries.length)} strong={s.dueReminderEntries.length > 0} />
        <MetricRow left="Actions to do" right={String(s.pendingReplyActionCount)} strong={s.pendingReplyActionCount > 0} />
      </Card>

      {s.dueReminderEntries.length ? (
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
      <Button label="+ New enquiry" primary onPress={s.startNewEnquiry} />
      <Button label="Customer records" onPress={() => s.go("customerRecords")} />
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

function WorkNow({ s }) {
  return (
    <Shell s={s} title="Find more work" subtitle="Tell Busy Does It the business result you want. We’ll work out the marketing underneath.">
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
  const gaps = ["Thursday afternoon", "Friday", "Next Tuesday", "Any suitable work"];
  return (
    <Shell s={s} title="When do you want work?" subtitle="Pick the spare time you want us to help fill.">
      {gaps.map((g) => (
        <Choice key={g} label={g} selected={s.selectedGap === g} onPress={() => s.setSelectedGap(g)} />
      ))}
      <Button label="Find the best first move" primary onPress={() => s.go("bestMove")} />
    </Shell>
  );
}


function BestMove({ s }) {
  const count = s.eligibleCustomers.length;
  return (
    <Shell s={s} title="Best first move" subtitle="This recommendation is calculated from your saved customer records.">
      <OpportunityCard
        eyebrow="Recommended"
        title={count ? `Review ${count} previous customer${count === 1 ? "" : "s"}` : "No previous customers are due yet"}
        body={
          count
            ? `You have ${s.quietSlot || "a quiet slot"} to fill and ${count} customer records meet the current service-specific reactivation rule.`
            : `No saved customer currently meets the reactivation rule. ${s.eligibilityRule}`
        }
        footer="Advertising spend: £0"
        status={count ? "Best first move" : "Nothing to send"}
        tone={count ? "green" : "blue"}
        actionLabel={count ? "Review customers" : "Manage customers"}
        onAction={() => s.go("eligibleCustomers")}
        why="Previous customers already know the business, so eligible records are checked before buying new attention."
        evidence={[
          ["Customer records", String(s.customers.length)],
          ["Eligible now", String(count)],
          ["Rule", s.eligibilityRule],
          ["Advertising required", "£0"],
        ]}
      />
      <Button label="See other options" onPress={() => s.go("otherOptions")} />
      <Button label="Manage customer records" onPress={() => s.go("customerRecords")} />
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
  return (
    <Shell s={s} title="Expert details" subtitle="The evidence behind this recommendation. You never need this screen to use Busy Does It.">
      <Card eyebrow="Recommendation proof" title={`Review ${s.eligibleCustomers.length} eligible previous customer${s.eligibleCustomers.length === 1 ? "" : "s"} first`} tone="green">
        <MetricRow left="Eligible previous customers" right={String(s.eligibleCustomers.length)} />
        <MetricRow left="Timing rule" right={s.eligibilityRule} />
        <MetricRow left="Advertising spend required" right="£0" />
        <MetricRow left="Recommendation confidence" right={s.eligibleCustomers.length ? "Medium" : "Low"} strong />
      </Card>
      <Card
        eyebrow="Decision logic"
        title="Why it outranked the alternatives"
        body="The audience has an existing relationship with the business, the action has very low financial exposure, and it can be stopped immediately if the spare slot fills. Paid advertising stays behind it because it introduces more cost and uncertainty."
      />
      <Card
        eyebrow="Data limits"
        title="What we do not know yet"
        body="This prototype does not have enough real campaign history to estimate conversion probability reliably. A live version would show the historical evidence used, sample size, confidence and any assumptions."
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
    <Shell s={s} title="Free improvements first" subtitle="Nothing changes publicly in v0.8. These are preparation steps only.">
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
        eyebrow="Busy Does It logic"
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
      <Card eyebrow="Important" title="A recommendation must be justifiable" body="In the live product, Busy Does It should show the real source, date, evidence and uncertainty. If the evidence is weak, it should lower confidence or say it does not know." tone="amber" />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function OtherOptions({ s }) {
  const options = [
    [1, "Follow up 4 old enquiries", "£0 ad spend", "People who asked before but never booked."],
    [2, "Revisit 3 old quotes", "£0 ad spend", "Quotes that are still worth trying."],
    [3, "Offer a relevant add-on", "£0 ad spend", "A service-aware cross-sell only when it genuinely fits the customer."],
  ];
  return (
    <Shell s={s} title="Other options" subtitle="Still cheap-first. Paid advertising stays at the bottom of the list.">
      {options.map(([stage, a, b, c]) => (
        <Pressable key={a} style={styles.optionCard} onPress={() => s.startCampaign(stage)}>
          <Text style={styles.optionTitle}>{a}</Text>
          <Text style={styles.optionBody}>{c}</Text>
          <Text style={styles.optionCost}>{b}</Text>
        </Pressable>
      ))}
      <Pressable style={styles.optionCard} onPress={() => s.go("paidTest")}>
        <Text style={styles.optionTitle}>Try a small local advert</Text>
        <Text style={styles.optionBody}>Only after the cheaper options are exhausted or you deliberately choose to skip ahead.</Text>
        <Text style={styles.optionCost}>Up to £{s.adBudget}</Text>
      </Pressable>
    </Shell>
  );
}



function CheckSend({ s }) {
  const baseStep = campaignSteps[s.campaignStage] || campaignSteps[0];
  const eligibleCount = s.eligibleCustomers.length;
  const serviceGroups = groupCustomersByService(s.eligibleCustomers);
  const serviceEntries = Object.entries(serviceGroups);
  const serviceGroupCount = serviceEntries.length;

  const step =
    s.campaignStage === 0
      ? {
          ...baseStep,
          title: `${eligibleCount} customers in ${serviceGroupCount} service group${serviceGroupCount === 1 ? "" : "s"}`,
          audience: `${eligibleCount} selected customer records`,
          why: "Busy Does It splits eligible customers by their previous service so each person gets a relevant draft instead of a generic message about work they may never have booked.",
          evidence: [
            ["Selected customer records", String(eligibleCount)],
            ["Service-specific drafts", String(serviceGroupCount)],
            ["Eligibility rule", s.eligibilityRule],
            ["Advertising required", "£0"],
          ],
        }
      : s.campaignStage === 1
      ? {
          ...baseStep,
          title: `Follow up ${s.oldEnquiryCount || 0} old enquir${String(s.oldEnquiryCount) === "1" ? "y" : "ies"}`,
          audience: `${s.oldEnquiryCount || 0} old enquiries`,
          evidence: [["Old enquiries entered", String(s.oldEnquiryCount || 0)], ["Advertising required", "£0"], ["Data source", "Your saved business data"]],
        }
      : s.campaignStage === 2
      ? {
          ...baseStep,
          title: `Revisit ${s.oldQuoteCount || 0} old quote${String(s.oldQuoteCount) === "1" ? "" : "s"}`,
          audience: `${s.oldQuoteCount || 0} old quotes`,
          evidence: [["Old quotes entered", String(s.oldQuoteCount || 0)], ["Highest value", `£${s.oldQuoteTopValue || 0}`], ["Advertising required", "£0"], ["Data source", "Your saved business data"]],
        }
      : baseStep;

  return (
    <Shell
      s={s}
      title="Check before sending"
      subtitle={
        s.campaignStage === 0
          ? "Each eligible customer gets a draft matched to their previous service. Sending is still simulated in v0.8."
          : "The recipient list is local prototype data. Sending is still simulated in v0.8."
      }
    >
      {s.campaignStage === 0 ? (
        <>
          <Card
            eyebrow={step.audience}
            title={step.title}
            body="Review each service group below. You can edit every draft separately."
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
  const nextStage = s.campaignStage + 1;
  const hasAnotherFreeMove = nextStage < campaignSteps.length;
  const next = hasAnotherFreeMove ? campaignSteps[nextStage] : null;
  const progressCount = Math.min(s.campaignStage + 1, campaignSteps.length);
  const sentRecipients =
    s.campaignStage === 0 && s.lastSimulatedRecipients?.length
      ? s.lastSimulatedRecipients
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
    <Shell s={s} title="Progress" subtitle="Busy Does It reassesses after every step instead of jumping straight to paid ads." brandCue="Cheapest sensible move first.">
      <StatusChip label={`Free-step ${progressCount} of ${campaignSteps.length}`} tone="green" />
      <ProgressStrip current={progressCount} total={campaignSteps.length} />
      <Card eyebrow="Latest result" title={result.title} body={result.body} footer={result.footer} tone="green" />

      {hasAnotherFreeMove ? (
        <OpportunityCard
          eyebrow="Next cheapest move"
          title={next.title}
          body="There is still capacity to fill, so we recommend another low-cost step before advertising."
          footer={`Advertising spend: ${next.adSpend}`}
          status="Try before ads"
          tone="blue"
          actionLabel="Try this next"
          onAction={() => s.startCampaign(nextStage)}
          why={next.why}
          evidence={next.evidence}
        />
      ) : (
        <OpportunityCard
          eyebrow="Free options checked"
          title="A small paid test is now reasonable to consider"
          body="We’ve tried the sensible low-cost steps in this demo and the remaining space is still open."
          footer={`Suggested cap: £${s.adBudget}`}
          status="Optional paid test"
          tone="amber"
          actionLabel="Review paid test"
          onAction={() => s.go("paidTest")}
          why="Paid advertising is only being suggested now because the cheaper relevant options have already been tried."
          evidence={[["Free / low-cost steps tried", String(campaignSteps.length)], ["Current suggested cap", `£${s.adBudget}`], ["Your single-test limit", `£${s.testLimit}`], ["Work guaranteed", "No"]]}
        />
      )}

      <Button label="View simulated replies" onPress={() => s.go("replies")} />
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
      subtitle="Busy Does It turns useful replies into clear next actions."
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
                ? "The quote has been marked as sent and is waiting for an outcome. Nothing was sent automatically by the prototype."
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
          body={manualAction ? `Choose the date and time agreed with ${customer.name}. This saves a local booking only.` : reply.body}
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
              : `Busy Does It has suggested the next ${s.quietSlot || "matching"} slot.`}
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
          label="Expected job value"
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
            <Button
              label="Mark job completed"
              onPress={() => s.markBookingCompleted(customer.id, s.actionJobValue)}
            />
            <Button label="Cancel booking" onPress={() => s.setBookingStatus(customer.id, "Cancelled")} />
          </>
        ) : null}
        {saved.done && bookingStatus === "Cancelled" ? (
          <Button label="Reopen booking" onPress={() => s.setBookingStatus(customer.id, "Confirmed")} />
        ) : null}
        {saved.done && bookingStatus === "Completed" ? (
          <Button label="View customer job history" onPress={() => s.openCustomer(customer.id)} />
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
                : `Busy Does It will surface this on Home when ${formatUKDate(saved.details.reminderDate)} arrives.`
            }
            tone={reminderDue ? "amber" : "green"}
          />
        ) : null}

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
          <Button label={reminderDue ? "Mark follow-up done" : "Mark done now"} onPress={() => s.markReminderDone(customer.id)} />
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
      <Button label={s.alwaysAsk ? `Approve £${s.adBudget}` : `Run within £${s.adBudget} cap`} primary disabled={overSingleLimit} onPress={() => s.go("paidRunning")} />
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
    <Shell s={s} title="Paid test running" subtitle="We’ll stop at your limit unless you approve more.">
      <Card
        eyebrow="Current test"
        title={`£8.40 of £${s.adBudget} spent`}
        body="2 people got in touch. 1 looks like a genuine job. No extra spend will happen beyond your limit."
        footer="Maximum at risk stays fixed"
        tone="green"
      />
      <Button label="See result" primary onPress={() => s.jump("results", "Results")} />
      <Button label="Stop test" danger onPress={() => s.jump("home", "Home")} />
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
      subtitle: "Busy Does It chooses the strongest low-cost move from the demo data.",
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



function NewEnquiry({ s }) {
  const effectiveService = s.newEnquiryCustomService.trim() || s.newEnquiryService.trim();
  const canSave = !!s.newEnquiryName.trim() && !!s.newEnquiryPhone.trim() && !!effectiveService;
  return (
    <Shell
      s={s}
      title="New enquiry"
      subtitle="Add somebody who has just phoned, messaged or asked for work. No previous job is required."
      brandCue="Capture the customer once. Turn the enquiry into the next sensible action."
    >
      <Field label="Customer name" value={s.newEnquiryName} onChangeText={s.setNewEnquiryName} placeholder="e.g. Jane Smith" />
      <Field label="Phone" value={s.newEnquiryPhone} onChangeText={s.setNewEnquiryPhone} placeholder="e.g. 07700 900000" keyboardType="phone-pad" />

      <Text style={styles.fieldLabel}>What do they need?</Text>
      {s.services.map((service) => (
        <Choice
          key={service.id}
          label={service.name}
          selected={!s.newEnquiryCustomService.trim() && s.newEnquiryService === service.name}
          onPress={() => {
            s.setNewEnquiryService(service.name);
            s.setNewEnquiryCustomService("");
          }}
        />
      ))}
      <Field
        label="Or type another service"
        value={s.newEnquiryCustomService}
        onChangeText={s.setNewEnquiryCustomService}
        placeholder="e.g. Conservatory cleaning"
      />
      <Text style={styles.helper}>
        {s.newEnquiryCustomService.trim()
          ? `Using custom service: ${s.newEnquiryCustomService.trim()}`
          : `Selected service: ${s.newEnquiryService}`}
      </Text>

      <Text style={styles.fieldLabel}>Note (optional)</Text>
      <TextInput
        multiline
        value={s.newEnquiryNote}
        onChangeText={s.setNewEnquiryNote}
        placeholder="What did they ask for?"
        placeholderTextColor="#9AA3B2"
        style={styles.messageInput}
      />

      <Button label="Save enquiry" primary disabled={!canSave} onPress={s.saveNewEnquiry} />
      <Button label="Cancel" onPress={s.back} />
    </Shell>
  );
}

function CustomerRecords({ s }) {
  return (
    <Shell
      s={s}
      title="Customer records"
      subtitle="One customer list for enquiries, previous customers and completed work."
      brandCue={`${s.verticalPack.label} rules are loaded underneath — the customer system itself stays generic.`}
    >
      <Card
        eyebrow="Current records"
        title={`${s.customers.length} customer${s.customers.length === 1 ? "" : "s"} • ${s.eligibleCustomers.length} due for reactivation`}
        body={
          s.customerContact
            ? s.eligibilityRule
            : "Previous-customer contact is switched off in Settings, so nobody is currently selected for reactivation."
        }
        footer="No real messages are sent in this prototype"
        tone="green"
      />
      {s.customers.map((customer) => {
        const eligible = s.customerContact && isEligibleCustomer(customer, s.services, s.verticalId);
        const action = s.replyActions?.[customer.id] || null;
        const pipelineLabel = customerPipelineLabel(customer, action);
        const activeAction = isActiveCustomerAction(action);
        const isNewEnquiry = !customer.lastServiceDate;
        const statusLabel =
          pipelineLabel ||
          (eligible
            ? "Eligible now"
            : customer.contactOk
            ? (s.customerContact ? "Not due" : "Contact off")
            : "Do not contact");
        return (
          <View key={customer.id} style={styles.customerRecord}>
            <View style={styles.customerRecordTop}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerMeta}>{customer.phone}</Text>
              </View>
              <StatusChip
                label={statusLabel}
                tone={activeAction || eligible || isNewEnquiry ? "green" : "blue"}
              />
            </View>
            <Text style={styles.customerService}>{customer.service}</Text>
            <Text style={styles.customerMeta}>
              {customer.lastServiceDate
                ? `Last job: ${formatUKDate(customer.lastServiceDate)} • ${formatMonthsAgo(customer.lastServiceDate)}`
                : "No completed job recorded yet"}
              {Number(customer.lastJobValue) > 0 ? ` • £${customer.lastJobValue}` : ""}
            </Text>
            <View style={styles.customerActionsRow}>
              <Pressable onPress={() => s.openCustomer(customer.id)} style={styles.customerOpenWrap}>
                <Text style={styles.customerOpenText}>Open customer</Text>
              </Pressable>
              <Pressable onPress={() => s.startEditCustomer(customer)} style={styles.customerEditWrap}>
                <Text style={styles.customerEditText}>Edit</Text>
              </Pressable>
              <Pressable onPress={() => s.requestRemoveCustomer(customer.id)} style={styles.removeCustomerWrap}>
                <Text style={styles.removeCustomerText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
      <Button label="+ New enquiry" primary onPress={s.startNewEnquiry} />
      <Button label="+ Add previous customer" onPress={s.startNewCustomer} />
      {s.eligibleCustomers.length ? <Button label="Review customers worth contacting" onPress={() => s.go("eligibleCustomers")} /> : null}
      <Button label="Done" onPress={s.back} />
    </Shell>
  );
}

function CustomerDetail({ s }) {
  const customer = s.selectedCustomer;
  if (!customer) {
    return (
      <Shell s={s} title="Customer unavailable" subtitle="That customer record could not be found.">
        <Button label="Back" primary onPress={s.back} />
      </Shell>
    );
  }

  const action = s.replyActions?.[customer.id] || null;
  const history = Array.isArray(customer.history) ? [...customer.history] : [];
  const activity = Array.isArray(customer.activity)
    ? [...customer.activity].sort((a, b) => String(b.createdAt || b.date || "").localeCompare(String(a.createdAt || a.date || "")))
    : [];
  const baselineExists = history.some(
    (item) => item.date === customer.lastServiceDate && item.service === customer.service
  );
  const timeline = [
    ...history,
    ...(!baselineExists && customer.lastServiceDate
      ? [{
          id: `baseline-${customer.id}`,
          kind: "job",
          date: customer.lastServiceDate,
          service: customer.service,
          value: customer.lastJobValue,
          note: "Previously recorded job",
        }]
      : []),
  ].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  const actionStatus = action
    ? !action.done
      ? "In progress"
      : action.type === "quote"
      ? action.details?.quoteStatus || "Prepared"
      : action.type === "booking"
      ? action.details?.bookingStatus || "Confirmed"
      : action.details?.reminderStatus || "Scheduled"
    : null;
  const actionIsFinished =
    !action ||
    (action.type === "quote" && ["Declined"].includes(actionStatus)) ||
    (action.type === "booking" && ["Completed", "Cancelled"].includes(actionStatus)) ||
    (action.type === "reminder" && actionStatus === "Completed");

  return (
    <Shell
      s={s}
      title={customer.name}
      subtitle="Contact details, live work and history in one place."
      brandCue="One customer. One clear history."
    >
      <Card
        eyebrow={customer.lastServiceDate ? "Customer" : "New enquiry"}
        title={customer.service}
        body={customer.phone || "No phone number saved"}
        footer={customer.contactOk ? "Contact allowed" : "Do not contact"}
        tone="green"
      >
        <MetricRow
          left="Stage"
          right={
            customerPipelineLabel(customer, action) ||
            (customer.lastServiceDate ? "Previous customer" : "New enquiry")
          }
        />
        <MetricRow left="Last job" right={customer.lastServiceDate ? formatUKDate(customer.lastServiceDate) : "No completed job yet"} />
        <MetricRow left="Last value" right={Number(customer.lastJobValue) > 0 ? `£${customer.lastJobValue}` : "Not recorded"} />
      </Card>

      {action ? (
        <Pressable onPress={() => s.openSavedReplyAction(customer.id)} style={styles.customerTimelineCard}>
          <View style={styles.activityTopRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.customerTimelineLabel}>CURRENT CUSTOMER ACTION</Text>
              <Text style={styles.activityName}>
                {action.type === "quote" ? "Quote" : action.type === "booking" ? "Booking" : "Follow-up"}
              </Text>
            </View>
            <StatusChip label={actionStatus} tone={["Cancelled", "Declined"].includes(actionStatus) ? "blue" : "green"} />
          </View>
          <Text style={styles.activitySummary}>{action.details?.summary || action.task || "Open action"}</Text>
          <Text style={styles.activityOpen}>Open / edit →</Text>
        </Pressable>
      ) : null}

      {actionIsFinished ? (
        <>
          <Card
            eyebrow={action ? "Next customer action" : "What next?"}
            title={action ? "Start something new for this customer" : "Turn this customer into work"}
            body="Start the action that matches what is happening in the real conversation. You do not need a simulated reply first."
            tone="blue"
          />
          <Button label="Create quote" primary onPress={() => s.startDirectCustomerAction(customer.id, "quote")} />
          <Button label="Book a job" onPress={() => s.startDirectCustomerAction(customer.id, "booking")} />
          <Button label="Set a follow-up" onPress={() => s.startDirectCustomerAction(customer.id, "reminder")} />
        </>
      ) : null}

      <Text style={styles.sectionLabel}>Notes & activity</Text>
      <TextInput
        multiline
        value={s.customerNoteText}
        onChangeText={s.setCustomerNoteText}
        placeholder="Add a quick note about this customer"
        placeholderTextColor="#9AA3B2"
        style={styles.messageInput}
      />
      <Button label="Add note" disabled={!s.customerNoteText.trim()} onPress={() => s.addCustomerNote(customer.id)} />

      {activity.length ? activity.slice(0, 12).map((item) => (
        <View key={item.id} style={styles.customerHistoryRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerHistoryTitle}>{item.title || "Customer update"}</Text>
            <Text style={styles.customerMeta}>{item.date ? formatUKDate(item.date) : "Date not recorded"}</Text>
            {item.note ? <Text style={styles.customerHistoryNote}>{item.note}</Text> : null}
          </View>
          {Number(item.value) > 0 ? <Text style={styles.customerHistoryValue}>£{item.value}</Text> : null}
        </View>
      )) : (
        <Text style={styles.helper}>No notes or activity saved yet.</Text>
      )}

      <Text style={styles.sectionLabel}>Completed job history</Text>
      {timeline.length ? timeline.map((item) => (
        <View key={item.id || `${item.date}-${item.service}`} style={styles.customerHistoryRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.customerHistoryTitle}>{item.service || customer.service}</Text>
            <Text style={styles.customerMeta}>{item.date ? formatUKDate(item.date) : "Date not recorded"}</Text>
            {item.note ? <Text style={styles.customerHistoryNote}>{item.note}</Text> : null}
          </View>
          <Text style={styles.customerHistoryValue}>{Number(item.value) > 0 ? `£${item.value}` : "—"}</Text>
        </View>
      )) : (
        <Card eyebrow="History" title="No completed jobs saved yet" body="Completed bookings will build this customer’s job history automatically." />
      )}

      <Button label="Edit customer record" onPress={() => s.startEditCustomer(customer)} />
      <Button label="Back to customers" primary onPress={s.back} />
    </Shell>
  );
}

function AddCustomerRecord({ s }) {
  const validDate = !s.newCustomerHasPreviousJob || !Number.isNaN(new Date(s.newCustomerDate).getTime());
  const canSave = !!s.newCustomerName.trim() && !!s.newCustomerPhone.trim() && validDate;
  const editing = !!s.editingCustomerId;

  return (
    <Shell
      s={s}
      title={editing ? "Edit customer" : "Add previous customer"}
      subtitle={editing ? "Update the customer without inventing a job that did not happen." : "Use this when the business has worked for this customer before."}
    >
      <Field label="Customer name" value={s.newCustomerName} onChangeText={s.setNewCustomerName} placeholder="e.g. Jane Smith" />
      <Field label="Phone" value={s.newCustomerPhone} onChangeText={s.setNewCustomerPhone} placeholder="e.g. 07700 900000" keyboardType="phone-pad" />
      <Field label="Service" value={s.newCustomerService} onChangeText={s.setNewCustomerService} placeholder="What work do they need or had before?" />
      <ToggleRow
        title="Has a previous completed job"
        body="Turn this off for an enquiry or contact with no completed job yet."
        value={s.newCustomerHasPreviousJob}
        onValueChange={s.setNewCustomerHasPreviousJob}
      />
      {s.newCustomerHasPreviousJob ? (
        <>
          <DatePickerField label="Last job date" value={s.newCustomerDate} onChange={s.setNewCustomerDate} />
          <Field label="Last job value" value={s.newCustomerValue} onChangeText={s.setNewCustomerValue} keyboardType="number-pad" prefix="£" placeholder="Optional" />
        </>
      ) : null}
      <ToggleRow
        title="Okay to contact"
        body="Only customers with this switched on can be considered for future reactivation."
        value={s.newCustomerContactOk}
        onValueChange={s.setNewCustomerContactOk}
      />
      <Button
        label={editing ? "Save changes" : "Save customer"}
        primary
        disabled={!canSave}
        onPress={() => {
          if (s.saveCustomerRecord()) s.back();
        }}
      />
      <Button
        label="Cancel"
        onPress={() => {
          s.clearCustomerForm();
          s.back();
        }}
      />
    </Shell>
  );
}

function ConfirmRemoveCustomer({ s }) {
  const customer = s.customers.find((item) => item.id === s.pendingRemoveCustomerId);
  return (
    <Shell
      s={s}
      title="Remove customer?"
      subtitle="This is deliberately a two-step action so a customer record cannot disappear by accident."
    >
      {customer ? (
        <Card
          eyebrow="Customer record"
          title={customer.name}
          body={customer.lastServiceDate ? `${customer.service} • Last job ${formatUKDate(customer.lastServiceDate)}` : `${customer.service} • No completed job recorded`}
          footer="This also removes any saved follow-up action for this customer."
          tone="amber"
        />
      ) : null}
      <Button label="Yes, remove record" danger onPress={s.confirmRemoveCustomer} />
      <Button
        label="Keep customer"
        primary
        onPress={() => {
          s.setPendingRemoveCustomerId(null);
          s.back();
        }}
      />
    </Shell>
  );
}

function EligibleCustomers({ s }) {
  const eligible = s.eligibleCustomers;
  const groups = groupCustomersByService(eligible);
  const groupCount = Object.keys(groups).length;

  return (
    <Shell
      s={s}
      title="Customers to try first"
      subtitle="These are the actual saved records that meet the current rule."
    >
      <Card
        eyebrow="Selection rule"
        title={`${eligible.length} customer${eligible.length === 1 ? "" : "s"} selected`}
        body={
          eligible.length
            ? `They will be split into ${groupCount} service-specific message group${groupCount === 1 ? "" : "s"} before sending. ${s.eligibilityRule}`
            : `No saved customer currently meets the rule: ${s.eligibilityRule}`
        }
        footer="Advertising spend: £0"
        tone="green"
      />
      {eligible.length ? (
        eligible.map((customer) => (
          <View key={customer.id} style={styles.customerRecord}>
            <View style={styles.customerRecordTop}>
              <Text style={styles.customerName}>{customer.name}</Text>
              <StatusChip label="Eligible now" tone="green" />
            </View>
            <Text style={styles.customerService}>{customer.service}</Text>
            <Text style={styles.customerMeta}>
              {customer.phone} • Last job {formatMonthsAgo(customer.lastServiceDate)}
              {Number(customer.lastJobValue) > 0 ? ` • £${customer.lastJobValue}` : ""}
            </Text>
          </View>
        ))
      ) : (
        <Card eyebrow="No matches" title="Nobody is due under the current rule" body="Add customer records or update their dates and contact permission." />
      )}
      <Button
        label={
          eligible.length
            ? `Prepare ${groupCount} message${groupCount === 1 ? "" : "s"} for ${eligible.length}`
            : "Manage customer records"
        }
        primary
        onPress={() => (eligible.length ? s.startCampaign(0) : s.go("customerRecords"))}
      />
      {eligible.length ? <Button label="Manage records" onPress={() => s.go("customerRecords")} /> : null}
    </Shell>
  );
}

function CustomerGroups({ s }) {
  const eligible = s.eligibleCustomers;
  const highValue = s.customers.filter((customer) => customer.contactOk && Number(customer.lastJobValue) >= 250);
  return (
    <Shell s={s} title="Customers worth trying" subtitle="Groups now come from the customer records stored on this phone.">
      <Card
        eyebrow="Due now"
        title={`${eligible.length} eligible customer${eligible.length === 1 ? "" : "s"}`}
        body={s.eligibilityRule}
        footer="Recommended first"
        tone="green"
      />
      <Card
        eyebrow="Higher-value history"
        title={`${highValue.length} customer${highValue.length === 1 ? "" : "s"} with £250+ previous jobs`}
        body="Useful context, but recency and contact permission still matter before sending anything."
      />
      <Button label="Review eligible customers" primary onPress={() => s.go("eligibleCustomers")} />
      <Button label="Manage customer records" onPress={() => s.go("customerRecords")} />
    </Shell>
  );
}

function BringBack({ s }) {
  return (
    <Shell s={s} title="Bring them back" subtitle="Approve the actual message — not an abstract campaign.">
      <Card eyebrow={s.selectedCustomerGroup.title} title="Message preview" footer="No predicted revenue — just a clear goal">
        <TextInput multiline value={s.bringBackMessage} onChangeText={s.setBringBackMessage} style={styles.messageInput} />
      </Card>
      <Button label="Simulate send" primary onPress={() => s.go("progress")} />
      <Button
        label="Reset draft"
        onPress={() =>
          s.setBringBackMessage(
            "Hi, it’s been a while since we last helped. We’ve got a couple of spaces next week if you need anything from us. Reply here if you’d like us to take a look."
          )
        }
      />
      <Button label="Skip" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function OfferGoal({ s }) {
  const goals = ["Fill a quiet day", "Get more bookings", "Promote a service", "Bring customers back", "Seasonal offer"];
  return (
    <Shell s={s} title="What is the offer for?" subtitle="The reason changes the offer we build." brandCue="Goal first, channel second.">
      {goals.map((g) => (
        <Choice key={g} label={g} selected={s.offerGoal === g} onPress={() => s.setOfferGoal(g)} />
      ))}
      {s.offerGoal === "Promote a service" ? (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.fieldLabel}>Service to promote</Text>
          {s.services.map((service) => (
            <Choice key={service.id} label={service.name} selected={s.selectedServiceId === service.id} onPress={() => s.setSelectedServiceId(service.id)} />
          ))}
        </View>
      ) : null}
      <Button label="Build the offer" primary onPress={s.prepareOfferFromGoal} />
    </Shell>
  );
}

function OfferBuild({ s }) {
  const guidance = {
    "Fill a quiet day": "Keep it limited to quieter days and a small booking cap so you protect margin.",
    "Get more bookings": "A modest incentive and a clear booking window is usually better than an unlimited discount.",
    "Promote a service": "You may not need a discount at all. Clear positioning and the right audience can be enough.",
    "Bring customers back": "Existing customers already know you, so avoid giving away more margin than necessary.",
    "Seasonal offer": "Make the reason and time window clear so it feels genuine rather than permanently discounted.",
  }[s.offerGoal];

  return (
    <Shell s={s} title="Build the offer" subtitle={`Goal: ${s.offerGoal}. Change anything before we recommend a plan.`}>
      <Field label="Service" value={s.offerService} onChangeText={s.setOfferService} />
      <Field label="Normal price" value={s.normalPrice} onChangeText={s.setNormalPrice} keyboardType="number-pad" prefix="£" />
      <Field label="Offer price" value={s.offerPrice} onChangeText={s.setOfferPrice} keyboardType="number-pad" prefix="£" />
      <Field label="Dates" value={s.offerDates} onChangeText={s.setOfferDates} />
      <Field label="Maximum bookings" value={s.offerMax} onChangeText={s.setOfferMax} keyboardType="number-pad" />
      <Card eyebrow="Margin check" title="Don’t discount more than the goal requires" body={guidance} tone="green" />
      <Button label="Improve it for me" primary onPress={() => s.go("offerPlan")} />
      <Button label="Use my offer" onPress={() => s.go("offerPlan")} />
    </Shell>
  );
}

function OfferPlan({ s }) {
  const audience =
    s.offerGoal === "Bring customers back"
      ? "Start with previous customers who have not booked recently."
      : s.offerGoal === "Promote a service"
      ? `Start with previous customers most likely to need ${s.offerService.toLowerCase()}.`
      : "Start with previous customers before buying new attention.";
  const priceChanged = String(s.offerPrice) !== String(s.normalPrice);
  const title = priceChanged ? `${s.offerService} — £${s.offerPrice}` : `${s.offerService} — no price cut`;

  return (
    <Shell s={s} title="This is what we recommend" subtitle="Use it as-is or change anything.">
      <OpportunityCard
        eyebrow="Recommended offer"
        title={title}
        body={`Normal price about £${s.normalPrice}. ${s.offerDates}. Maximum ${s.offerMax} bookings. ${audience}`}
        footer="Paid ads only if spaces remain"
        status={s.offerGoal}
        tone="green"
        actionLabel="Use this plan"
        onAction={() => s.go("offerRunning")}
        why="The plan is limited by date and booking capacity, starts with people who already know the business, and only adds paid reach if the target still has spaces."
        evidence={[["Offer goal", s.offerGoal], ["Booking cap", s.offerMax], ["Normal price", `£${s.normalPrice}`], ["Offer price", `£${s.offerPrice}`], ["Paid reach first?", "No"]]}
      />
      <Button label="Edit offer" onPress={s.back} />
      <Button label="Cancel" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function WhyOfferPlan({ s }) {
  return (
    <Shell s={s} title="Why this plan?" subtitle="The simple reason first.">
      <Card
        eyebrow="Offer logic"
        title="Fill quiet capacity without over-discounting"
        body="The offer is limited to quieter days and a maximum number of bookings. We start with previous customers because that is cheaper than buying new attention, then only use paid advertising if spaces remain."
        footer="Protect margin before chasing volume"
        tone="green"
      />
      <Button label="Show expert details" onPress={() => s.go("expertOfferPlan")} />
      <Button label="Got it" primary onPress={s.back} />
    </Shell>
  );
}

function ExpertOfferPlan({ s }) {
  return (
    <Shell s={s} title="Expert offer details" subtitle="The underlying reasoning and assumptions.">
      <Card eyebrow="Capacity" title={`${s.offerMax} booking cap`} body={`The offer is restricted to ${s.offerDates}, which is the capacity we are trying to fill.`} />
      <Card eyebrow="Pricing" title={`£${s.offerPrice} vs about £${s.normalPrice}`} body="The live product should compare the offer against known margin and past booking behaviour before recommending a discount." />
      <Card eyebrow="Audience sequence" title="Past customers before paid reach" body="Existing relationships normally have lower acquisition cost than cold advertising, so they are tested first when appropriate." footer="Paid promotion remains optional" />
      <Card eyebrow="Data quality" title="Prototype assumption" body="The current figures are dummy data. A live recommendation must expose the real evidence and lower confidence when margin, demand or attribution data is incomplete." tone="amber" />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function OfferRunning({ s }) {
  return (
    <Shell s={s} title={s.offerPaused ? "Simulated offer paused" : "Simulated offer"} subtitle={s.offerPaused ? "Nothing new is simulated while paused." : "Prototype example only — no real offer is running."}>
      <Card
        eyebrow={s.offerPaused ? "Paused demo" : "Simulated offer"}
        title={`2 of ${s.offerMax} spaces booked`}
        body="24 past customers contacted. 5 replied. 2 booked. No paid advertising has been needed yet."
        footer="Won work so far: about £450"
        tone={s.offerPaused ? "amber" : "green"}
      />
      <Button label="View bookings" primary onPress={() => s.jump("results", "Results")} />
      <Button label={s.offerPaused ? "Resume offer" : "Pause offer"} onPress={() => s.setOfferPaused((v) => !v)} />
      <Button label="Stop offer" danger onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function Results({ s }) {
  const actions = Object.entries(s.replyActions || {});
  const quoteActions = actions.filter(([, action]) => action?.type === "quote" && action?.done);
  const bookingActions = actions.filter(([, action]) => action?.type === "booking" && action?.done);
  const quotePrepared = quoteActions.filter(([, action]) => (action.details?.quoteStatus || "Prepared") === "Prepared").length;
  const quoteSent = quoteActions.filter(([, action]) => action.details?.quoteStatus === "Sent").length;
  const quoteAccepted = quoteActions.filter(([, action]) => action.details?.quoteStatus === "Accepted").length;
  const confirmedBookings = bookingActions.filter(([, action]) => (action.details?.bookingStatus || "Confirmed") === "Confirmed").length;
  const completedJobs = bookingActions.filter(([, action]) => action.details?.bookingStatus === "Completed").length;

  return (
    <Shell
      s={s}
      noBack
      title="What happened?"
      subtitle="A local customer-work picture first. Illustrative marketing examples stay separate."
      brandCue="Real local activity. Clear next steps."
    >
      <Card
        eyebrow="Customer pipeline"
        title={`£${s.pipelineWorkValue} of customer work in the pipeline`}
        body="This combines active quote value and confirmed booked-work value saved locally in the prototype."
        tone="green"
      >
        <MetricRow left="Open enquiries" right={String(s.openEnquiryCount)} />
        <MetricRow left="Quotes prepared" right={String(quotePrepared)} />
        <MetricRow left="Quotes marked sent" right={String(quoteSent)} />
        <MetricRow left="Quotes accepted" right={String(quoteAccepted)} />
        <MetricRow left="Confirmed bookings" right={String(confirmedBookings)} />
        <MetricRow left="Booked work value" right={`£${s.bookedWorkValue}`} strong={s.bookedWorkValue > 0} />
        <MetricRow left="Completed jobs" right={String(completedJobs)} />
        <MetricRow left="Completed job value" right={`£${s.completedJobValue}`} strong={s.completedJobValue > 0} />
        <MetricRow left="Follow-ups due" right={String(s.dueReminderEntries.length)} />
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

      {s.completedBookingCount ? <Button label="Open work diary" primary onPress={() => s.go("bookings")} /> : null}
      {Object.keys(s.replyActions || {}).length ? (
        <Button label="View all customer activity" onPress={() => s.go("customerActivity")} />
      ) : null}

      <Card
        eyebrow="Illustrative only"
        title="Marketing demo results"
        body="Older spend, enquiry and job figures remain example data for testing the future marketing Results experience. They are not included in the customer pipeline above."
        footer="Kept separate on purpose"
        tone="blue"
      />
      <Button label="Open illustrative demo results" onPress={() => s.go("resultDetails")} />
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


function BusinessData({ s }) {
  return (
    <Shell
      s={s}
      title="Business data"
      subtitle="General business facts stay here. Previous-customer counts now come from individual customer records."
    >
      <Card
        eyebrow="Local data model"
        title="Customer counts are calculated, not typed in"
        body={`You currently have ${s.customers.length} saved customer records and ${s.eligibleCustomers.length} meet the current service-specific reactivation rule. ${s.eligibilityRule}`}
        tone="green"
      />
      <Field label="Business name" value={s.businessName} onChangeText={s.setBusinessName} />
      <Field label="Trade or service" value={s.trade} onChangeText={s.setTrade} />
      <Field label="Postcode / base area" value={s.postcode} onChangeText={s.setPostcode} />
      <Field label="Service radius" value={s.radius} onChangeText={s.setRadius} keyboardType="number-pad" prefix="Miles" />
      <Field label="Next quiet slot" value={s.quietSlot} onChangeText={s.setQuietSlot} placeholder="e.g. Thursday afternoon" />
      <Button label="Manage customer records" onPress={() => s.go("customerRecords")} />

      <Text style={styles.sectionLabel}>Other opportunity numbers</Text>
      <Field label="Old enquiries worth following up" value={s.oldEnquiryCount} onChangeText={s.setOldEnquiryCount} keyboardType="number-pad" />
      <Field label="Old quotes worth revisiting" value={s.oldQuoteCount} onChangeText={s.setOldQuoteCount} keyboardType="number-pad" />
      <Field label="Highest old quote value" value={s.oldQuoteTopValue} onChangeText={s.setOldQuoteTopValue} keyboardType="number-pad" prefix="£" />
      <Field label="Unanswered reviews" value={s.unansweredReviewCount} onChangeText={s.setUnansweredReviewCount} keyboardType="number-pad" />
      <Field label="Recent photos you want to add" value={s.recentPhotoCountNeeded} onChangeText={s.setRecentPhotoCountNeeded} keyboardType="number-pad" />
      <Button label="Save & refresh Home" primary onPress={() => s.jump("home", "Home")} />
      <Button label="Cancel" onPress={s.back} />
    </Shell>
  );
}

function Settings({ s }) {
  const connectedCount = Object.values(s.connectedAccounts).filter(Boolean).length;
  return (
    <Shell s={s} noBack title="Your controls" subtitle="Set the rules once. Busy Does It works inside them.">
      <Card
        eyebrow="Spending"
        title={s.alwaysAsk ? "Always ask before spending" : `Automatic paid tests up to £${s.testLimit}`}
        body={
          s.alwaysAsk
            ? "Every paid test still needs your approval."
            : `Busy Does It may run a paid test up to £${s.testLimit} without asking again, but total paid spend must stay within £${s.weeklyLimit} per week.`
        }
        footer="You can change this any time"
        tone={s.alwaysAsk ? "green" : "amber"}
      >
        <MetricRow left="Single test limit" right={`£${s.testLimit}`} />
        <MetricRow left="Weekly limit" right={`£${s.weeklyLimit}`} />
        <MetricRow left="Previous customers" right={s.customerContact ? "Allowed" : "Off"} />
        <MetricRow left="Connected accounts" right={`${connectedCount}/${connectionRows.length}`} />
      </Card>
      <Button label="Customer records" primary onPress={() => s.go("customerRecords")} />
      <Button label="Business type & services" onPress={() => s.go("businessType")} />
      {s.completedBookingCount ? <Button label="Bookings" onPress={() => s.go("bookings")} /> : null}
      {Object.keys(s.replyActions || {}).length ? (
        <Button label="Customer activity" onPress={() => s.go("customerActivity")} />
      ) : null}
      <Button label="Business profile & opportunity data" onPress={() => s.go("businessData")} />
      <Button label="Change limits" onPress={() => s.go("settingsLimits")} />
      <Button label="Connected accounts" onPress={() => s.go("connectedAccounts")} />
      <Button label="How Busy Does It works" onPress={() => s.go("howBusyWorks")} />
      <Button label="What makes it different" onPress={() => s.go("whatMakesDifferent")} />
      <Button label="Advanced details" onPress={() => s.go("advanced")} />
      <Button label="Reset prototype data" danger onPress={s.resetPrototype} />
    </Shell>
  );
}

function HowBusyWorks({ s }) {
  return (
    <Shell s={s} title="How Busy Does It works" subtitle="Simple on the surface. Serious marketing logic underneath.">
      <Card eyebrow="1" title="Start with the business problem" body="Tell us you need work, have a quiet day, want old customers back or want to run an offer. You do not build a marketing campaign." />
      <Card eyebrow="2" title="Check the cheapest sensible moves first" body="We can check free profile improvements, previous customers, old enquiries, quotes, cross-sells and other low-cost opportunities before paid advertising." />
      <Card eyebrow="3" title="Explain the recommendation" body="The normal screen gives you the simple answer. Tap “Why this?” for the reasoning, or Expert details for the evidence and assumptions." />
      <Card eyebrow="4" title="You control what gets sent and spent" body="Important sends and paid actions require approval unless you deliberately choose a different rule." />
      <Card eyebrow="5" title="Measure work, not vanity" body="Results lead with genuine enquiries, bookings, jobs won and revenue. Technical metrics remain available for people who want them." />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function WhatMakesDifferent({ s }) {
  return (
    <Shell s={s} title="What makes Busy Does It different" subtitle="Concrete design choices — not hype.">
      <Card eyebrow="Goal first" title="You tell us the problem, not the channel" body="The app chooses or recommends the marketing method underneath instead of forcing you to decide between ads, email, social or audiences." />
      <Card eyebrow="Cost first" title="Free and low-cost opportunities come before paid reach" body="The app can recommend spending nothing when that is the more sensible first move." />
      <Card eyebrow="Control" title="The maximum at risk is obvious" body="Paid advertising is treated as a test. You see the cap before approval and the app stops at the agreed limit." />
      <Card eyebrow="Proof layer" title="Every important recommendation should be justifiable" body="Average users see a simple answer. Experts can inspect the data, assumptions, alternatives, confidence and technical performance behind it." />
      <Card eyebrow="Outcome" title="Jobs and pounds before marketing jargon" body="The default result is what happened to the business, not a dashboard full of clicks and acronyms." />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function BusinessTypeSettings({ s }) {
  const packs = Object.values(VERTICAL_PACKS);
  return (
    <Shell
      s={s}
      title="Business type & services"
      subtitle="The business type changes the suggested services and repeat-timing rules underneath. It does not change the core app."
      brandCue="One Busy Does It. Different service-business rules where they genuinely matter."
    >
      <Card
        eyebrow="Current setup"
        title={s.verticalPack.label}
        body={s.verticalPack.description}
        footer={s.eligibilityRule}
        tone="green"
      />

      <Text style={styles.sectionLabel}>Business type</Text>
      {packs.map((pack) => (
        <Choice
          key={pack.id}
          label={pack.label}
          sub={pack.description}
          selected={s.verticalId === pack.id}
          onPress={() => s.applyVerticalPack(pack.id)}
        />
      ))}

      <Card
        eyebrow="Important"
        title="Existing customer records stay yours"
        body="Changing business type replaces the suggested service list and timing rules, but it does not delete customer records or job history. You can still add any service manually."
        tone="blue"
      />
      <Button label="+ Add a service" onPress={() => s.go("addService")} />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function SettingsLimits({ s }) {
  return (
    <Shell s={s} title="Change limits" subtitle="These rules apply to future paid actions.">
      <ToggleRow
        title="Always ask before spending"
        body={s.alwaysAsk ? "Every paid test needs approval." : `Off: tests up to £${s.testLimit} may run automatically, within the weekly limit.`}
        value={s.alwaysAsk}
        onValueChange={s.setAlwaysAsk}
      />
      <ToggleRow title="Contact previous customers" body="Allow eligible previous customers to be suggested before paid advertising." value={s.customerContact} onValueChange={s.setCustomerContact} />
      <Field label="Maximum single test" value={s.testLimit} onChangeText={s.setTestLimit} keyboardType="number-pad" prefix="£" />
      <Field label="Weekly paid-spend limit" value={s.weeklyLimit} onChangeText={s.setWeeklyLimit} keyboardType="number-pad" prefix="£" />
      {!s.alwaysAsk ? <Text style={styles.warningText}>Automatic mode is explicit: no single test may exceed £{s.testLimit}, and total paid spend may not exceed £{s.weeklyLimit} per week.</Text> : null}
      <Button label="Save" primary onPress={s.back} />
    </Shell>
  );
}

function ConnectedAccounts({ s }) {
  return (
    <Shell s={s} title="Connected accounts" subtitle="Prototype toggles only — no real external account is connected yet.">
      {connectionRows.map(([key, label, body]) => {
        const connected = !!s.connectedAccounts[key];
        return (
          <View key={key} style={styles.connectRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.connectTitle}>{label}</Text>
              <Text style={styles.connectBody}>{body}</Text>
            </View>
            <Pressable onPress={() => s.toggleConnection(key)} style={[styles.connectButton, connected && styles.connectButtonOn]}>
              <Text style={[styles.connectButtonText, connected && { color: C.green }]}>{connected ? "Disconnect" : "Connect"}</Text>
            </Pressable>
          </View>
        );
      })}
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function Advanced({ s }) {
  return (
    <Shell s={s} title="Advanced details" subtitle="Optional. You never need this to use the normal app.">
      <ToggleRow
        title="Show advanced marketing details"
        body="Reveal channel, targeting and technical performance metrics."
        value={s.advanced}
        onValueChange={s.setAdvanced}
      />
      {s.advanced ? (
        <>
          <Card eyebrow="Advanced example" title="Local paid test">
            <MetricRow left="Channel" right="Meta" />
            <MetricRow left="CTR" right="2.8%" />
            <MetricRow left="CPC" right="£1.72" />
            <MetricRow left="Recommendation confidence" right="Medium" />
          </Card>
          <Card
            eyebrow="Proof layer"
            title="Recommendations can be inspected"
            body="Expert screens can show the source data, selection criteria, alternatives considered, assumptions, confidence and performance history behind a recommendation."
            footer="Easy enough for anybody. Deep enough for an expert."
            tone="green"
          />
        </>
      ) : (
        <Card
          eyebrow="Hidden by default"
          title="No marketing lesson required"
          body="The normal app stays focused on jobs, money, spare time and simple decisions."
        />
      )}
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

const screens = {
  welcome: WelcomeScreen,
  setupVertical: SetupVertical,
  setupBusiness: SetupBusiness,
  setupServices: SetupServices,
  addService: AddService,
  setupLimits: SetupLimits,
  setupConnect: SetupConnect,
  home: HomeScreen,
  workHub: WorkHub,
  workNow: WorkNow,
  chooseGap: ChooseGap,
  bestMove: BestMove,
  customerRecords: CustomerRecords,
  customerDetail: CustomerDetail,
  newEnquiry: NewEnquiry,
  addCustomerRecord: AddCustomerRecord,
  confirmRemoveCustomer: ConfirmRemoveCustomer,
  eligibleCustomers: EligibleCustomers,
  profileAudit: ProfileAudit,
  profileAuditPlan: ProfileAuditPlan,
  otherOptions: OtherOptions,
  checkSend: CheckSend,
  progress: Progress,
  replies: Replies,
  customerActivity: CustomerActivity,
  bookings: Bookings,
  replyActions: ReplyActions,
  replyActionDetail: ReplyActionDetail,
  paidTest: PaidTest,
  howAdsWork: HowAdsWork,
  paidRunning: PaidRunning,
  moreWorkGoal: MoreWorkGoal,
  workPlan: WorkPlan,
  customerGroups: CustomerGroups,
  bringBack: BringBack,
  offerGoal: OfferGoal,
  offerBuild: OfferBuild,
  offerPlan: OfferPlan,
  offerRunning: OfferRunning,
  results: Results,
  resultDetails: ResultDetails,
  updateOutcome: UpdateOutcome,
  settings: Settings,
  businessType: BusinessTypeSettings,
  businessData: BusinessData,
  howBusyWorks: HowBusyWorks,
  whatMakesDifferent: WhatMakesDifferent,
  settingsLimits: SettingsLimits,
  connectedAccounts: ConnectedAccounts,
  advanced: Advanced,
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  shell: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 30 },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  brand: { fontSize: 19, fontWeight: "900", color: C.blue, letterSpacing: 0.4 },
  tagline: { fontSize: 12, color: C.muted, marginTop: 2, fontWeight: "600" },
  backPill: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: C.card,
  },
  backText: { color: C.ink, fontWeight: "700" },
  brandCue: { color: C.green, fontWeight: "800", fontSize: 15, marginBottom: 8 },
  h1: { fontSize: 32, lineHeight: 36, fontWeight: "900", color: C.ink, letterSpacing: -0.7 },
  subtitle: { fontSize: 16, lineHeight: 22, color: C.muted, marginTop: 7, marginBottom: 18 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
    backgroundColor: C.card,
  },
  cardBlue: { borderColor: "#CEDBF5", backgroundColor: C.blueSoft },
  cardGreen: { borderColor: "#CDE7D9", backgroundColor: C.greenSoft },
  cardAmber: { borderColor: "#F0D8B9", backgroundColor: C.amberSoft },
  eyebrow: { fontSize: 12, fontWeight: "900", color: C.blue, letterSpacing: 0.8, marginBottom: 7 },
  cardTitle: { fontSize: 21, lineHeight: 26, fontWeight: "900", color: C.ink, marginBottom: 7 },
  cardBody: { fontSize: 15, lineHeight: 21, color: C.muted },
  cardFooter: { fontSize: 16, fontWeight: "900", color: C.green, marginTop: 12 },
  tick: { fontSize: 15, lineHeight: 25, color: C.ink, fontWeight: "700" },
  button: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  buttonPrimary: { backgroundColor: C.blue, borderColor: C.blue },
  buttonDanger: { backgroundColor: C.red, borderColor: C.red },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { fontSize: 17, fontWeight: "800", color: C.ink },
  buttonTextPrimary: { color: "#FFFFFF" },
  pressed: { transform: [{ scale: 0.99 }], opacity: 0.92 },
  smallLinkWrap: { alignItems: "center", padding: 12 },
  smallLink: { color: C.blue, fontSize: 15, fontWeight: "700" },
  fieldWrap: { marginBottom: 15 },
  fieldLabel: { color: C.ink, fontWeight: "800", fontSize: 14, marginBottom: 7 },
  fieldBox: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    paddingHorizontal: 14,
  },
  fieldPrefix: { marginRight: 9, fontWeight: "800", color: C.muted },
  fieldInput: { flex: 1, fontSize: 16, color: C.ink, paddingVertical: 12 },
  dateFieldBox: { justifyContent: "space-between" },
  dateFieldText: { flex: 1, fontSize: 16, color: C.ink, fontWeight: "700" },
  dateFieldHint: { color: C.blue, fontSize: 13, fontWeight: "800", marginLeft: 12 },
  datePickerPanel: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 16, padding: 12, marginTop: 8, marginBottom: 14 },
  calendarHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  calendarMonth: { color: C.ink, fontSize: 16, fontWeight: "900" },
  calendarNav: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: C.blueSoft },
  calendarNavDisabled: { backgroundColor: "#F1F3F6" },
  calendarNavText: { color: C.blue, fontSize: 30, lineHeight: 32, fontWeight: "700" },
  calendarNavTextDisabled: { color: "#B8BFCA" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calendarCell: { width: "14.2857%", alignItems: "center", justifyContent: "center", minHeight: 40 },
  calendarWeekday: { color: C.muted, fontSize: 12, fontWeight: "800" },
  calendarDay: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  calendarDaySelected: { backgroundColor: C.blue },
  calendarDayDisabled: { opacity: 0.28 },
  calendarDayText: { color: C.ink, fontSize: 14, fontWeight: "700" },
  calendarDayTextSelected: { color: "#FFFFFF", fontWeight: "900" },
  calendarDayTextDisabled: { color: C.muted },
  calendarHelp: { color: C.muted, fontSize: 12, textAlign: "center", marginTop: 8 },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
  },
  choiceSelected: { borderColor: C.blue, backgroundColor: C.blueSoft },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#AAB2BF",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  radioSelected: { borderColor: C.blue },
  radioCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.blue },
  choiceText: { fontSize: 16, color: C.ink, fontWeight: "800" },
  choiceTextSelected: { color: C.blue },
  choiceSub: { marginTop: 3, color: C.muted, lineHeight: 18 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    borderRadius: 16,
    marginBottom: 12,
  },
  toggleTitle: { fontWeight: "800", color: C.ink, fontSize: 16 },
  toggleBody: { color: C.muted, lineHeight: 19, marginTop: 4 },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#C9D7E7",
    paddingTop: 10,
    marginTop: 10,
    gap: 14,
  },
  metricLeft: { flex: 1, color: C.muted, fontSize: 14 },
  metricRight: { color: C.ink, fontSize: 15, fontWeight: "800" },
  metricStrong: { fontSize: 17, fontWeight: "900", color: C.green },
  helper: { color: C.muted, fontSize: 13, marginTop: -2, marginBottom: 14 },
  helperCenter: { color: C.muted, fontSize: 12, textAlign: "center", marginTop: 7 },
  serviceCard: {
    flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: C.border,
    backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 10,
  },
  serviceCardWanted: { borderColor: "#B7D0FF", backgroundColor: C.blueSoft },
  serviceName: { fontSize: 16, fontWeight: "800", color: C.ink },
  serviceValue: { fontSize: 14, color: C.muted, marginTop: 4 },
  star: { fontSize: 28, color: "#AAB2BF" },
  starOn: { color: "#E0A419" },
  connectRow: {
    flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: C.border,
    backgroundColor: C.card, borderRadius: 16, padding: 15, marginBottom: 10, gap: 12,
  },
  connectTitle: { fontSize: 15, fontWeight: "800", color: C.ink },
  connectBody: { fontSize: 13, color: C.muted, marginTop: 3, lineHeight: 18 },
  connectButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: C.blueSoft },
  connectButtonText: { fontSize: 13, fontWeight: "800", color: C.blue },
  optionCard: {
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 16,
    padding: 16, marginBottom: 10,
  },
  optionTitle: { fontSize: 17, fontWeight: "900", color: C.ink },
  optionBody: { color: C.muted, lineHeight: 20, marginTop: 5 },
  optionCost: { color: C.green, fontWeight: "900", marginTop: 9 },
  messageInput: {
    marginTop: 8, minHeight: 120, textAlignVertical: "top", color: C.ink, fontSize: 15,
    lineHeight: 21, backgroundColor: "#FFFFFFAA", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#D5DFEC",
  },
  replyCard: {
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 16,
    padding: 15, marginBottom: 10,
  },
  replyName: { fontWeight: "900", color: C.ink, fontSize: 16 },
  replyStatus: { color: C.green, fontWeight: "800", fontSize: 13 },
  replyStatusMuted: { color: C.muted },
  replyService: { color: C.muted, fontSize: 12, fontWeight: "700", marginTop: 2 },
  replyBody: { color: C.muted, lineHeight: 20, marginTop: 7 },
  replyActionButton: { alignSelf: "flex-start", backgroundColor: C.blue, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginTop: 12 },
  replyActionButtonText: { color: "#FFFFFF", fontWeight: "900", fontSize: 13 },
  replyActionSaved: { backgroundColor: C.greenSoft, borderRadius: 10, padding: 11, marginTop: 12 },
  replyActionSavedTitle: { color: C.green, fontWeight: "900", fontSize: 12 },
  replyActionSavedBody: { color: C.ink, fontWeight: "700", fontSize: 13, marginTop: 3 },
  replyActionSavedDetail: { color: C.muted, fontSize: 12, lineHeight: 17, marginTop: 5 },
  replyActionViewWrap: { alignSelf: "flex-start", paddingVertical: 6, marginTop: 4 },
  replyActionViewText: { color: C.blue, fontSize: 12, fontWeight: "900" },
  replyTaskCard: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 16, padding: 15, marginBottom: 10 },
  replyTaskCardDone: { opacity: 0.72 },
  replyTaskEyebrow: { color: C.blue, fontWeight: "900", fontSize: 12, textTransform: "uppercase" },
  replyTaskName: { color: C.ink, fontWeight: "900", fontSize: 18, marginTop: 5 },
  replyTaskBody: { color: C.muted, fontSize: 14, lineHeight: 20, marginTop: 5 },
  replyTaskDoneButton: { alignSelf: "flex-start", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, marginTop: 12, backgroundColor: C.greenSoft },
  replyTaskDoneText: { color: C.green, fontSize: 13, fontWeight: "900" },
  replyTaskOpenButton: { alignSelf: "flex-start", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginTop: 12, backgroundColor: C.blue },
  replyTaskOpenText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  replyTaskDetail: { color: C.green, fontSize: 13, lineHeight: 18, fontWeight: "800", marginTop: 7 },
  replyTaskViewButton: { alignSelf: "flex-start", paddingVertical: 8, marginTop: 4 },
  replyTaskViewText: { color: C.blue, fontSize: 13, fontWeight: "900" },
  suggestionBox: { backgroundColor: C.blueSoft, borderRadius: 14, padding: 13, marginBottom: 14 },
  suggestionTitle: { color: C.blue, fontSize: 13, fontWeight: "900", marginBottom: 4 },
  suggestionBody: { color: C.muted, fontSize: 13, lineHeight: 19 },
  timeChoiceWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  timeChoice: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 10 },
  timeChoiceSelected: { backgroundColor: C.blue, borderColor: C.blue },
  timeChoiceText: { color: C.ink, fontSize: 13, fontWeight: "800" },
  timeChoiceTextSelected: { color: "#FFFFFF" },
  resultActionRow: { flexDirection: "row", alignItems: "flex-start", borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 14, padding: 13, marginBottom: 9 },
  resultActionName: { color: C.ink, fontSize: 14, fontWeight: "900" },
  resultActionService: { color: C.muted, fontSize: 12, marginTop: 2 },
  resultActionSummary: { color: C.green, fontSize: 12, fontWeight: "800", textAlign: "right", maxWidth: "48%" },
  resultActionOpen: { color: C.blue, fontSize: 11, fontWeight: "800", marginTop: 5 },
  activityCard: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 16, padding: 15, marginBottom: 10 },
  activityCardDone: { backgroundColor: C.greenSoft, borderColor: "#CDE7D9" },
  activityTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  activityName: { color: C.ink, fontSize: 17, fontWeight: "900" },
  activityService: { color: C.muted, fontSize: 13, marginTop: 2 },
  activitySummary: { color: C.ink, fontSize: 14, lineHeight: 20, fontWeight: "700", marginTop: 10 },
  activityOpen: { color: C.blue, fontSize: 12, fontWeight: "900", marginTop: 9 },
  filterScroll: { marginBottom: 8 },
  filterRow: { flexDirection: "row", gap: 8, paddingRight: 10 },
  filterChip: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9 },
  filterChipActive: { backgroundColor: C.blue, borderColor: C.blue },
  filterChipText: { color: C.muted, fontSize: 12, fontWeight: "800" },
  filterChipTextActive: { color: "#FFFFFF" },
  homePriorityCard: { backgroundColor: C.greenSoft, borderWidth: 1, borderColor: "#CDE7D9", borderRadius: 18, padding: 16, marginBottom: 16 },
  homeReminderCard: { backgroundColor: C.amberSoft, borderColor: "#F0D8B9" },
  homePriorityTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  homePriorityEyebrow: { color: C.blue, fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
  homePriorityTitle: { color: C.ink, fontSize: 22, fontWeight: "900" },
  homePriorityBody: { color: C.muted, fontSize: 14, lineHeight: 20, marginTop: 5 },
  homePriorityLink: { color: C.blue, fontSize: 13, fontWeight: "900", marginTop: 10 },
  bookingCard: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 16, padding: 15, marginBottom: 10 },
  bookingWhen: { color: C.ink, fontSize: 16, fontWeight: "800", marginTop: 10 },
  bookingValue: { color: C.green, fontSize: 13, fontWeight: "900", marginTop: 6 },
  suggestionBoxWarning: { backgroundColor: C.amberSoft, borderWidth: 1, borderColor: "#F0D8B9" },
  suggestionBoxSuccess: { backgroundColor: C.greenSoft, borderWidth: 1, borderColor: "#CDE7D9" },
  clashBox: { backgroundColor: C.amberSoft, borderWidth: 1, borderColor: "#F0D8B9", borderRadius: 14, padding: 13, marginBottom: 14 },
  clashTitle: { color: C.red, fontSize: 14, fontWeight: "900", marginBottom: 4 },
  clashBody: { color: C.ink, fontSize: 13, lineHeight: 19 },
  slotFixButton: { alignSelf: "flex-start", backgroundColor: C.blue, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginTop: 10 },
  slotFixButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  groupCard: {
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 16,
    padding: 16, marginBottom: 10,
  },
  groupCardSelected: { borderColor: C.blue, backgroundColor: C.blueSoft },
  groupTitle: { fontWeight: "900", color: C.ink, fontSize: 16, lineHeight: 21 },
  groupBody: { color: C.muted, marginTop: 6, lineHeight: 19 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  loadingText: { marginTop: 10, color: C.muted, fontSize: 15 },
  prototypeBadge: { marginTop: 5, alignSelf: "flex-start", fontSize: 10, fontWeight: "800", color: C.muted, backgroundColor: "#E8ECF3", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  dashboardHeader: { marginBottom: 14 },
  dashboardHint: { color: C.muted, fontSize: 13, marginTop: 8 },
  chip: { alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  chipBlue: { backgroundColor: C.blueSoft },
  chipGreen: { backgroundColor: C.greenSoft },
  chipAmber: { backgroundColor: C.amberSoft },
  chipText: { color: C.ink, fontSize: 11, fontWeight: "900" },
  opportunityCard: { borderWidth: 1, borderRadius: 18, padding: 17, marginBottom: 14, backgroundColor: C.card },
  opportunityBlue: { borderColor: "#CEDBF5" },
  opportunityGreen: { borderColor: "#CDE7D9" },
  opportunityAmber: { borderColor: "#F0D8B9" },
  opportunityTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  opportunityTitle: { fontSize: 20, lineHeight: 25, fontWeight: "900", color: C.ink, marginTop: 4 },
  opportunityBody: { color: C.muted, fontSize: 15, lineHeight: 21, marginTop: 7 },
  opportunityFooter: { color: C.green, fontSize: 14, fontWeight: "900", marginTop: 10 },
  explainWrap: { marginTop: 8 },
  inlineLinkWrap: { alignSelf: "center", paddingVertical: 9, paddingHorizontal: 6 },
  inlineLinkWrapLeft: { alignSelf: "flex-start", paddingVertical: 9, paddingHorizontal: 0 },
  inlineLink: { color: C.blue, fontSize: 14, fontWeight: "800" },
  inlinePanel: { backgroundColor: "#FFFFFFAA", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.border },
  inlineWhy: { color: C.ink, fontSize: 14, lineHeight: 20 },
  evidenceBox: { marginTop: 2 },
  actionRow: { flexDirection: "row", gap: 9, marginTop: 12 },
  miniPrimary: { flex: 1, minHeight: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: C.blue, paddingHorizontal: 12 },
  miniPrimaryText: { color: "#FFFFFF", fontWeight: "900", fontSize: 14 },
  miniSecondary: { minHeight: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border, paddingHorizontal: 15, backgroundColor: C.card },
  miniSecondaryText: { color: C.muted, fontWeight: "800", fontSize: 14 },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: "#DFE5EE", overflow: "hidden", marginTop: 10, marginBottom: 16 },
  progressFill: { height: "100%", backgroundColor: C.green, borderRadius: 999 },
  warningText: { color: C.amber, fontSize: 13, lineHeight: 19, fontWeight: "700", marginTop: -2, marginBottom: 14 },
  sectionLabel: { color: C.ink, fontSize: 18, fontWeight: "900", marginTop: 8, marginBottom: 14 },
  customerRecord: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 16, padding: 15, marginBottom: 10 },
  customerRecordTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  customerName: { color: C.ink, fontSize: 17, fontWeight: "900" },
  customerService: { color: C.ink, fontSize: 14, fontWeight: "800", marginTop: 8 },
  customerMeta: { color: C.muted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  removeCustomerWrap: { alignSelf: "flex-start", paddingTop: 10, paddingBottom: 2 },
  removeCustomerText: { color: C.red, fontSize: 13, fontWeight: "800" },
  customerActionsRow: { flexDirection: "row", alignItems: "center", gap: 18, marginTop: 10, flexWrap: "wrap" },
  customerOpenWrap: { paddingVertical: 4, paddingRight: 4 },
  customerOpenText: { color: C.green, fontSize: 13, fontWeight: "900" },
  customerEditWrap: { paddingVertical: 4, paddingRight: 4 },
  customerEditText: { color: C.blue, fontSize: 13, fontWeight: "900" },
  customerTimelineCard: { borderWidth: 1, borderColor: "#CDE7D9", backgroundColor: C.greenSoft, borderRadius: 16, padding: 15, marginBottom: 14 },
  customerTimelineLabel: { color: C.blue, fontSize: 11, fontWeight: "900", letterSpacing: 0.7, marginBottom: 5 },
  customerHistoryRow: { flexDirection: "row", alignItems: "flex-start", borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 14, padding: 13, marginBottom: 9 },
  customerHistoryTitle: { color: C.ink, fontSize: 15, fontWeight: "900" },
  customerHistoryNote: { color: C.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  customerHistoryValue: { color: C.green, fontSize: 15, fontWeight: "900" },
  serviceMessageCard: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 12 },
  serviceMessageHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 },
  serviceMessageTitle: { color: C.ink, fontSize: 17, fontWeight: "900" },
  serviceMessageMeta: { color: C.muted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  connectButtonOn: { backgroundColor: C.greenSoft },
  nav: {
    height: 72,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: C.border,
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 5,
  },
  navItem: { alignItems: "center", justifyContent: "center", minWidth: 68 },
  navDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "transparent", marginBottom: 5 },
  navDotActive: { backgroundColor: C.blue },
  navText: { color: C.muted, fontSize: 12, fontWeight: "700" },
  navTextActive: { color: C.blue, fontWeight: "900" },
});

export default App;