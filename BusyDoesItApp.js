
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

const APP_VERSION = "2.7";
const PROTOTYPE_BADGE = `Prototype v${APP_VERSION} • Evidence-aware opportunity engine`;

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
  const conflict =
    !!match?.customer &&
    customerActionStrength(action) > captureStageStrength(parsed.stage);

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
    (match?.confidence === "Medium" ? 6 : 0);

  const priorityScore = stageBase + uncertainty;
  const needsAttention =
    missing.length > 0 ||
    parsed.confidence === "Low" ||
    conflict ||
    match?.confidence === "Medium";

  let reason = "Ready for owner review";
  if (conflict) reason = "Existing customer has stronger active work";
  else if (missing.length) reason = `Missing ${missing.join(", ")}`;
  else if (match?.confidence === "Medium") reason = "Possible name-only customer match";
  else if (parsed.confidence === "Low") reason = "Low extraction confidence";
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
  if (action && isActiveCustomerAction(action)) reasons.push("Customer already has active work");
  if (parsed.stage === "Enquiry" && customer?.currentEnquiryAt) reasons.push("Customer already has an open enquiry");
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
        ? `Exact ${match.reason.toLowerCase()} + high-confidence complete record + no active conflict`
        : reasons[0],
    match,
    customer,
    fingerprint,
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
  const [selectedInboxItemId, setSelectedInboxItemId] = useState(null);
  const [recordFilingMode, setRecordFilingMode] = useState("safe");
  const [lastAutoFiledInboxItemId, setLastAutoFiledInboxItemId] = useState(null);

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
    if (!hydrated) return;
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
      recordFilingMode,
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
          note: cleanNote || "Completed through Busy Does It prototype",
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
                `${serviceName} completed. Busy Does It also prepared the sensible follow-on admin in the background.`,
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
              ? "Busy Does It also prepared a finished-job post draft for review. Nothing is posted automatically."
              : "They are kept private to the job unless you change the setting later."
          }`
        : "Job photos removed.",
    });
    if (photos.length && jobPhotosMarketingOk) {
      go("jobPostDraft");
    } else {
      openCustomer(selectedCustomerId);
    }
  };

  const defaultJobPostChannels = () => ({
    facebook: !!connectedAccounts.meta,
    instagram: !!connectedAccounts.meta,
    googleBusiness: !!connectedAccounts.googleBusiness,
  });

  const prepareJobPost = () => {
    const customer = customers.find((item) => item.id === selectedCustomerId);
    const job = (customer?.history || []).find((item) => item.id === selectedJobId);
    if (!customer || !job) return;
    const allowedPhotos = (job.photos || []).filter((photo) => photo.marketingOk);
    if (!allowedPhotos.length) {
      Alert.alert("No approved job photos", "Allow these job photos to be suggested for marketing first.");
      return;
    }
    const service = job.service || customer.service || "job";
    const draft =
      job.postDraft ||
      `Just finished another ${service.toLowerCase()} job. If you need something similar, send us a message and we’ll take a look.`;
    setJobPostDraft(draft);
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

  const clearQuickCapture = () => {
    const preferred = services.find((item) => item.wanted) || services[0];
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
  };

  const startQuickCapture = () => {
    clearQuickCapture();
    setSelectedInboxItemId(null);
    setTab("Work");
    go("quickCapture");
  };

  const loadQuickCaptureExample = (kind = "enquiry") => {
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
    const sourceRecord = {
      id: `source-${customerId}-${Date.now()}`,
      source: item.source || "Incoming",
      stage: parsed.stage,
      eventDate,
      importedAt,
      rawText: item.rawText || "",
      fingerprint: evaluation.fingerprint,
      autoFiled: true,
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
          lastActivityKind: "autopilot-intake",
          history: nextHistory,
          sourceRecords: [...sourceRecords, sourceRecord],
          activity: [
            ...activity,
            {
              id: `activity-${customerId}-autopilot-${Date.now()}`,
              kind: "intake",
              date: eventDate,
              createdAt: importedAt,
              title: `${parsed.stage} filed automatically`,
              note: `Safe Autopilot filed this from ${item.source || "incoming information"} because the existing customer match and extracted record passed every trust rule.`,
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
            summary: `Safe Autopilot filed booking for ${formatUKDate(eventDate)} at ${eventTime}`,
          },
          completedAt: importedAt,
        },
      }));
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

  const queueCaptureToInbox = () => {
    const rawText = captureRawText.trim();
    if (!rawText) return false;
    const parsed = parseQuickCapture(
      rawText,
      services,
      services.find((item) => item.wanted)?.name || trade || "Service"
    );
    const triage = triageInboxCandidate(parsed, customers, replyActions);
    const queuedAt = new Date().toISOString();
    const item = {
      id: `inbox-${Date.now()}`,
      status: "Pending",
      source: captureSource,
      rawText,
      parsed,
      queuedAt,
      originalLane: triage.lane,
      originalReason: triage.reason,
      originalPriorityScore: triage.priorityScore,
    };
    const autoEvaluation = evaluateSafeAutoFile(
      parsed,
      customers,
      replyActions,
      captureSource,
      rawText
    );
    const autoFiled =
      recordFilingMode === "safe" &&
      autoEvaluation.safe &&
      fileSafeInboxItem(item, autoEvaluation);

    if (!autoFiled) setInboxItems((items) => [...items, item]);

    clearQuickCapture();
    setSelectedInboxItemId(null);
    setTab("Work");
    go(autoFiled ? "autopilotFiled" : "busyInbox");
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

  const analyseQuickCapture = () => {
    setSelectedInboxItemId(null);
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
    go("quickCaptureReview");
  };

  const saveQuickCapture = () => {
    const name = captureName.trim();
    const phone = capturePhone.trim();
    const email = captureEmail.trim();
    const address = captureAddress.trim();
    const service = captureService.trim();
    const note = captureNote.trim() || captureRawText.trim();
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
                ? "Busy matched this incoming information to an existing customer and kept the stronger active workflow instead of creating a contradictory new enquiry."
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

  const resetPrototype = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
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
    (entry) => entry.job.postDraftStatus === "Simulated published"
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
          entry.job.postDraftStatus !== "Simulated published"
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
          entry.job.postDraftStatus === "Simulated published" &&
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
      const triage = triageInboxCandidate(parsed, customers, replyActions);
      const autoEvaluation = evaluateSafeAutoFile(
        parsed,
        customers,
        replyActions,
        item.source || "Incoming",
        item.rawText || ""
      );
      return { ...item, parsed, triage, autoEvaluation };
    })
    .sort((a, b) => {
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
  const reactivationEligibleCustomers = activeWorkGoal && evidenceServiceName
    ? eligibleCustomers.filter((customer) => customer.service === evidenceServiceName)
    : eligibleCustomers;
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
    reactivationEligibleCustomers,
    reactivationEvidence,
    quoteFollowUpEvidence,
    enquiryFollowUpEvidence,
    postEvidence,
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
    setCaptureRawText,
    captureSource,
    setCaptureSource,
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
            <Text style={styles.prototypeBadge}>{PROTOTYPE_BADGE}</Text>
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
                <Text style={styles.inlineLink}>{showEvidence ? "Hide expert details" : "Expert details"}</Text>
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
        <Text style={[styles.eyebrow, styles.opportunityEyebrow]}>{eyebrow.toUpperCase()}</Text>
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
            <Text style={styles.serviceValue}>Usually about £{item.value} • about {formatDurationHours(item.durationHours)} per job</Text>
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
    const parsedDuration = Number(String(s.newServiceDuration).replace(/[^0-9.]/g, ""));
    s.setServices((list) => [
      ...list,
      {
        id: `custom-${Date.now()}`,
        name,
        value: Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0,
        wanted: true,
        repeatMonths: s.verticalPack?.defaultRepeatMonths ?? null,
        durationHours:
          Number.isFinite(parsedDuration) && parsedDuration > 0
            ? Math.max(0.5, Math.min(8, parsedDuration))
            : 2,
      },
    ]);
    s.setNewServiceName("");
    s.setNewServiceValue("");
    s.setNewServiceDuration("2");
    s.back();
  };

  return (
    <Shell s={s} noNav title="Add a service" subtitle="If you do it, you can add it. We won’t box you into a preset list.">
      <Field label="Service" value={s.newServiceName} onChangeText={s.setNewServiceName} placeholder="e.g. Conservatory roof cleaning" />
      <Field label="Rough job value" value={s.newServiceValue} onChangeText={s.setNewServiceValue} keyboardType="number-pad" prefix="£" placeholder="Optional" />
      <Field label="Typical job length" value={s.newServiceDuration} onChangeText={s.setNewServiceDuration} keyboardType="decimal-pad" prefix="Hours" placeholder="2" />
      <Card
        eyebrow="Why we ask"
        title="This helps Busy Does It find the right work"
        body="A rough value and typical job length are enough. Busy uses the time only for capacity planning, and you can correct it at any time."
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
  const [showOtherMoves, setShowOtherMoves] = useState(false);
  const serviceName = s.selectedService?.name || s.services.find((x) => x.wanted)?.name || s.trade || "your priority service";
  const customerCount = s.customers.length;
  const eligibleCount = s.eligibleCustomers.length;
  const reactivationEligibleCount = s.reactivationEligibleCustomers?.length || 0;
  const todayISO = dateToISO(new Date());
  const hasPublishingConnection = !!s.connectedAccounts.meta || !!s.connectedAccounts.googleBusiness;
  const postLearningAdjustment = s.postEvidence?.scoreAdjustment || 0;
  const reactivationLearningBoost = s.reactivationEvidence?.scoreAdjustment || 0;
  const quoteFollowUpLearningBoost = s.quoteFollowUpEvidence?.scoreAdjustment || 0;
  const reviewSuccessRate = s.reviewRequestOutcomeCount
    ? s.reviewReceivedCount / s.reviewRequestOutcomeCount
    : null;
  const reviewLearningBoost =
    reviewSuccessRate === null ? 0 : Math.round((reviewSuccessRate - 0.35) * 8);
  const enquiryLearningBoost = s.enquiryFollowUpEvidence?.scoreAdjustment || 0;

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
      body: `${s.workGoalBookedCount} confirmed booking${s.workGoalBookedCount === 1 ? "" : "s"} now match this work goal. Busy Does It should stop promoting the gap instead of manufacturing more activity.`,
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
      why: "Busy Does It protects live customer work before suggesting marketing. This is already booked work, so leaving it unresolved can make the diary and pipeline misleading.",
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
      eyebrow: "Busy Inbox",
      title:
        triage.lane === "Needs attention"
          ? `Incoming ${String(parsed.stage || "item").toLowerCase()} needs a quick check`
          : `Incoming ${String(parsed.stage || "item").toLowerCase()} is ready to review`,
      body: `${parsed.name || "Customer not identified"} • ${parsed.service || "service not detected"} • ${triage.reason || "Ready for review"}.`,
      footer: "Nothing filed yet",
      status: triage.lane === "Needs attention" ? "Check" : "Incoming",
      tone: triage.lane === "Needs attention" ? "amber" : "green",
      why: "This information has arrived but is not yet part of the business records. Busy triaged it first so uncertain or potentially conflicting information can be checked before it changes the pipeline.",
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
      body: `There is still no quote, booking or follow-up saved for ${item.customer.service.toLowerCase()}. Busy Does It can prepare a polite check-in from the real enquiry record.`,
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
      body: `${item.customer.name} already asked about ${item.customer.service.toLowerCase()}. Busy Does It has enough information to prepare a polite follow-up for review.`,
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
    ...(s.preparedPostOpportunity
      ? [{
          id: `prepared-post-${s.preparedPostOpportunity.jobId}`,
          score: (hasPublishingConnection ? 78 : 58) + postLearningAdjustment,
          eyebrow: "Prepared action ready",
          title: "A finished-job post is ready for approval",
          body: `${s.preparedPostOpportunity.customerName}’s ${s.preparedPostOpportunity.service.toLowerCase()} job already has approved photos and editable wording prepared.`,
          footer: "Cost: £0 • owner approval required",
          status: hasPublishingConnection ? "Ready to approve" : "Needs connection",
          tone: hasPublishingConnection ? "green" : "blue",
          why: hasPublishingConnection
            ? "The work is already prepared and costs nothing to review, so there is very little friction left before the owner can approve it."
            : "The content is prepared, but Busy Does It should not pretend it can publish anywhere until the owner has deliberately connected a destination.",
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
    ...(s.photoOpportunity
      ? [{
          id: `job-photo-${s.photoOpportunity.jobId}`,
          score: 68 + postLearningAdjustment,
          eyebrow: "Free content opportunity",
          title: `Use ${s.photoOpportunity.photoCount} approved job photo${s.photoOpportunity.photoCount === 1 ? "" : "s"}`,
          body: `${s.photoOpportunity.customerName}’s ${s.photoOpportunity.service.toLowerCase()} job is already saved. Busy Does It can prepare the words and approval step for you.`,
          footer: "Cost: £0 • nothing posts without approval",
          status: "Free",
          tone: "green",
          why: "This reuses real proof the owner deliberately supplied. It costs nothing and Busy Does It can prepare most of the action underneath.",
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
          score: 60 + Math.min(10, reactivationEligibleCount) + reactivationLearningBoost,
          eyebrow: "Spare capacity",
          title: `${s.quietSlot} is free`,
          body:
            s.recommendedReactivationBatchSize >= reactivationEligibleCount
              ? `${reactivationEligibleCount} ${s.workGoalPlanningService?.name || "service-matched"} previous customer${reactivationEligibleCount === 1 ? "" : "s"} are eligible. That is the whole relevant pool, so Busy would use all of them rather than pretending a larger audience exists.`
              : `${reactivationEligibleCount} service-matched previous customers are eligible. Based on the recorded evidence and the ${s.workGoalRemainingJobs} booking${s.workGoalRemainingJobs === 1 ? "" : "s"} still needed, Busy would start with ${s.recommendedReactivationBatchSize}.`,
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
    ...(s.reviewRequestOpportunity
      ? [{
          id: `review-request-${s.reviewRequestOpportunity.jobId}`,
          score: 62 + reviewLearningBoost,
          eyebrow: "Post-job opportunity",
          title: `Ask ${s.reviewRequestOpportunity.customerName} for a review`,
          body: `${s.reviewRequestOpportunity.service} is completed. Busy Does It can prepare a short, low-pressure review request using the saved customer and job details.`,
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
          body: `A prepared quote follow-up was approved. Recording the outcome helps Busy Does It judge future quote follow-ups more accurately.`,
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
  ].filter((item) => !s.dismissedOpportunities.includes(item.id));

  const rankedMoves = [...operationalMoves, ...marketingMoves]
    .sort((a, b) => (b.score || 0) - (a.score || 0));
  const bestMove = rankedMoves[0] || null;
  const otherMoves = rankedMoves.slice(1);

  return (
    <Shell
      s={s}
      noBack
      title="Best thing to do today"
      subtitle="Busy sorts incoming information, ranks the live business records, and normally shows one next move."
      brandCue="Incoming information sorted. One clear move out."
    >
      {bestMove ? (
        <>
          <OpportunityCard
            {...bestMove}
            eyebrow={`Best next move • ${bestMove.eyebrow}`}
            actionLabel={bestMove.actionLabel || "Do it"}
            onIgnore={bestMove.canIgnore ? () => s.dismissOpportunity(bestMove.id) : undefined}
          />
          <View style={styles.dashboardHeader}>
            <StatusChip label="Ranked from saved business data" tone="green" />
            <Text style={styles.dashboardHint}>
              Live customer commitments rank highly. Prepared £0 actions can outrank ideas that still need setup.
            </Text>
          </View>
        </>
      ) : (
        <Card
          eyebrow="All clear"
          title="Nothing worth doing right now"
          body="There is no urgent customer work or worthwhile prepared opportunity in the data currently saved. Busy Does It is not creating a task just to look busy."
          footer="Recommended spend: £0"
          tone="green"
        />
      )}

      {otherMoves.length ? (
        <Button
          label={showOtherMoves ? "Hide other opportunities" : `See other opportunities • ${otherMoves.length}`}
          onPress={() => setShowOtherMoves((value) => !value)}
        />
      ) : null}

      {showOtherMoves
        ? otherMoves.map((item) => (
            <OpportunityCard
              key={item.id}
              {...item}
              actionLabel={item.actionLabel || "Do it"}
              onIgnore={item.canIgnore ? () => s.dismissOpportunity(item.id) : undefined}
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
                ? `Busy found room for ${s.workGoalTargetJobs - s.workGoalPlanShortfall} of ${s.workGoalTargetJobs} requested bookings in the next ${s.activeWorkGoal.planHorizonDays || 21} days. The remaining ${s.workGoalPlanShortfall} still need diary capacity.`
                : `Busy has spread ${s.workGoalTargetJobs} bookings across ${s.workGoalPlannedSlots.length} specific openings. ${s.workGoalRemainingJobs} still needed.`
              : `Target: ${s.workGoalTargetJobs} suitable booking${s.workGoalTargetJobs === 1 ? "" : "s"}. ${s.workGoalRemainingJobs} still needed. Busy will size the next action to the remaining gap and stop escalating when the target is covered.`
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
          <Button label="Review this work goal" onPress={() => s.go("bestMove")} />
          <Button label="Cancel work goal" onPress={s.clearWorkGoal} />
        </Card>
      ) : null}

      {(s.backgroundReadyCount || s.lifecycleWatchCount) ? (
        <Card
          eyebrow="Busy in the background"
          title={`${s.backgroundReadyCount} next step${s.backgroundReadyCount === 1 ? "" : "s"} ready • ${s.lifecycleWatchCount} timeline${s.lifecycleWatchCount === 1 ? "" : "s"} being watched`}
          body="Busy is keeping the dates and follow-on admin underneath the app. You still approve anything that would contact a customer or publish publicly."
          tone="blue"
        >
          <MetricRow left="Quiet enquiries ready" right={String(s.staleEnquiryEntries.length)} />
          <MetricRow left="Quote follow-ups ready" right={String(s.dueQuoteEntries.length)} />
          <MetricRow left="Review drafts prepared" right={String(s.automaticReviewDraftCount)} />
          <MetricRow left="Finished-job post drafts" right={String(s.automaticPostDraftCount)} />
          <MetricRow left="Inbox records auto-filed" right={String(s.inboxAutoFiledCount)} strong={s.inboxAutoFiledCount > 0} />
          <Button label="See background work" onPress={() => s.go("backgroundWork")} />
        </Card>
      ) : null}

      {s.inboxPendingItems.length ? (
        <Button
          label={`Busy Inbox • ${s.inboxPendingItems.length} waiting`}
          primary
          onPress={s.openBusyInbox}
        />
      ) : null}
      <Button label="I NEED MORE WORK" primary={!bestMove && !s.inboxPendingItems.length} onPress={() => s.go("workNow")} />
      <Button label="Open work hub" primary={!s.inboxPendingItems.length && !!bestMove} onPress={() => s.jump("workHub", "Work")} />
      <Button label="Customer records" onPress={() => s.go("customerRecords")} />
      <Button label="Update my business data" onPress={() => s.go("businessData")} />
    </Shell>
  );
}

function BackgroundWork({ s }) {
  const nextReview = s.automaticReviewDraftEntries?.[0] || null;
  const nextPost = s.automaticPostDraftEntries?.[0] || null;

  return (
    <Shell
      s={s}
      title="Busy in the background"
      subtitle="Dates, drafts and follow-on admin Busy is already maintaining underneath the Opportunity Engine."
      brandCue="Prepared automatically. Customer-facing actions still need approval."
    >
      <Card
        eyebrow="Ready now"
        title={`${s.backgroundReadyCount} next step${s.backgroundReadyCount === 1 ? "" : "s"} ready for review`}
        body="Busy can prepare the admin, but it does not send a customer message, publish a post or spend money by itself in this prototype."
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
          body="Busy is not manufacturing admin just to make the screen look busy."
          footer="Recommended action: none"
          tone="green"
        />
      ) : null}

      <Button label="Back to Home" primary onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}


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

  return (
    <Shell
      s={s}
      noBack
      title="Work"
      subtitle="Customers, quotes, bookings and follow-ups first. Marketing sits underneath when you need more work."
      brandCue="Run the work you already have before buying more attention."
    >
      <Card eyebrow="Today" title={todayBookings.length ? `${todayBookings.length} job${todayBookings.length === 1 ? "" : "s"} booked today` : "No booked jobs today"} tone={todayBookings.length ? "green" : "blue"}>
        <MetricRow left="New enquiries (<7 days)" right={String(s.freshEnquiryEntries.length)} />
        <MetricRow left="Quiet enquiries (7+ days)" right={String(s.staleEnquiryEntries.length)} strong={s.staleEnquiryEntries.length > 0} />
        <MetricRow left="Work in pipeline" right={`£${s.pipelineWorkValue}`} strong={s.pipelineWorkValue > 0} />
        <MetricRow left="Active quote value" right={`£${s.activeQuoteValue}`} />
        <MetricRow left="Booked work value" right={`£${s.bookedWorkValue}`} />
        <MetricRow left="Overdue bookings" right={String(overdueBookings.length)} strong={overdueBookings.length > 0} />
        <MetricRow left="Jobs in next 7 days" right={String(nextSevenDayBookings.length)} strong={nextSevenDayBookings.length > 0} />
        <MetricRow left="Next 7 days value" right={`£${nextSevenDayValue}`} strong={nextSevenDayValue > 0} />
        <MetricRow left="Follow-ups due" right={String(s.dueReminderEntries.length)} strong={s.dueReminderEntries.length > 0} />
        <MetricRow left="Quote follow-ups due" right={String(s.dueQuoteEntries.length)} strong={s.dueQuoteEntries.length > 0} />
        <MetricRow left="Actions to do" right={String(s.pendingReplyActionCount)} strong={s.pendingReplyActionCount > 0} />
        <MetricRow left="Background next steps ready" right={String(s.backgroundReadyCount)} strong={s.backgroundReadyCount > 0} />
        <MetricRow left="Inbox waiting" right={String(s.inboxPendingItems.length)} strong={s.inboxNeedsAttentionItems.length > 0} />
        <MetricRow left="Auto-filed safely" right={String(s.inboxAutoFiledCount)} strong={s.inboxAutoFiledCount > 0} />
        <MetricRow left="Quick-captured records filed" right={String(s.intakeLog.length)} />
      </Card>

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
        label={s.inboxPendingItems.length ? `Busy Inbox • ${s.inboxPendingItems.length} waiting` : "Busy Inbox"}
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
        body="This view is built from the local customer records and actions already saved in Busy Does It."
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
    <Shell s={s} title="When do you want work?" subtitle="Busy checks the saved diary first, then checks whether the amount of work you want can realistically fit." brandCue="Need → capacity → smallest sensible intervention.">
      {gaps.length ? (
        <>
          <Card eyebrow="Likely spare capacity" title="Open time found in the saved diary" body="A morning or afternoon is treated as occupied when a confirmed booking is saved in that period. This is a prototype diary check, not a live external calendar connection." tone="green" />
          {gaps.map((gap) => (
            <Choice key={gap.id} label={gap.label} sub="No confirmed booking saved in this period" selected={s.selectedGap === gap.label} onPress={() => s.setSelectedGap(gap.label)} />
          ))}
        </>
      ) : (
        <Card eyebrow="Diary looks busy" title="No obvious gap found" body="Busy could not find a clear morning or afternoon gap in the next saved diary window. You can still ask for any suitable work." tone="blue" />
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
        <Card eyebrow="Capacity assumption" title={planningService.name} body={`Busy will plan around about ${formatDurationHours(planningService.durationHours)} per job. This is an editable planning estimate, not a promise about every job.`} tone="blue" />
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
  const firstQuietEnquiry = s.staleEnquiryEntries?.[0] || null;
  const firstQuote = s.dueQuoteEntries?.[0] || null;
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
        subtitle={`${s.activeWorkGoal.label} is now covered by the bookings saved in Busy Does It.`}
        brandCue="Target reached. Stop promoting."
      >
        <Card
          eyebrow="Stop condition reached"
          title="No more marketing needed for this gap"
          body={`Busy found ${s.workGoalBookedCount} confirmed booking${s.workGoalBookedCount === 1 ? "" : "s"} matching a target of ${s.workGoalTargetJobs}. It should not keep contacting people or suggest paid advertising for the same capacity.`}
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
        subtitle={`Busy checked the requested work against the planning time saved for ${serviceName}.`}
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
              : `${serviceName} is currently set to about ${formatDurationHours(s.workGoalDurationHours)} per job, which is longer than the ${s.workGoalSlotHours}-hour planning window. Busy should not pretend a full job fits there.`
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
          body="Busy keeps the plan conservative. Rather than counting on a slot that now contains other work, rebuild the plan from the current diary."
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
        subtitle={`Busy checked the next ${s.activeWorkGoal.planHorizonDays || 21} days before recommending more promotion.`}
        brandCue="Do not invent capacity."
      >
        <Card
          eyebrow="Capacity shortfall"
          title={`${planned} of ${s.workGoalTargetJobs} requested bookings can be planned`}
          body={`The current diary does not show enough clean openings for the remaining ${s.workGoalPlanShortfall} booking${s.workGoalPlanShortfall === 1 ? "" : "s"}. Busy should not market work it cannot confidently place.`}
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
          why: "A real customer is already asking about work. Busy checks existing demand before starting any new marketing.",
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
          why: "Busy prioritises people already close to booking before asking you to spend money.",
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
            ? `Busy found only ${s.reactivationEligibleCustomers.length} service-matched eligible previous customer${s.reactivationEligibleCustomers.length === 1 ? "" : "s"}. The evidence-sized first batch is at least that large, so all available records are included.`
            : s.reactivationEvidence?.evidenceReady
            ? `Busy needs ${remainingJobs} more booking${remainingJobs === 1 ? "" : "s"}. Based on ${s.reactivationEvidence.sample} recorded outcome${s.reactivationEvidence.sample === 1 ? "" : "s"} (${s.reactivationEvidence.basis.toLowerCase()}), it would start with ${targetedCustomerCount} service-matched previous customers.`
            : `Busy needs ${remainingJobs} more booking${remainingJobs === 1 ? "" : "s"}, but there is not enough recorded reactivation evidence yet. It is using the cautious fallback and would start with ${targetedCustomerCount} service-matched previous customers.`,
          footer: "Advertising spend: £0",
          status: "Ready to prepare",
          tone: "green",
          why: "Previous customers already know the business, so Busy checks them before buying new attention.",
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
    ...(s.preparedPostOpportunity
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
          why: "Busy uses assets the owner deliberately supplied before suggesting extra spend.",
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
    {
      id: "gap-special-offer",
      score: remainingJobs >= 3 ? 88 : remainingJobs === 2 ? 72 : 46,
      eyebrow: "Controlled offer",
      title: "Build a limited offer without assuming a discount",
      body: `If the direct £0 routes are not enough, Busy can prepare a ${remainingJobs}-booking offer for the remaining capacity in ${gap.toLowerCase()}. It starts at the normal saved service price rather than automatically cutting margin.`,
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
    },
    {
      id: "gap-free-audit",
      score: 50,
      eyebrow: "Free check",
      title: "Check the easy improvements before paying",
      body: "If the record-based opportunities are thin, review the supplied profile and social information for obvious free fixes before buying attention.",
      footer: "Cost: £0",
      status: "Free fallback",
      tone: "blue",
      why: "Busy Does It should improve what the business already has before escalating to paid advertising when time allows.",
      evidence: [
        ["Goal", gap],
        ["Advertising required", "£0"],
        ["Live profile connection", s.connectedAccounts.googleBusiness || s.connectedAccounts.meta ? "Partly selected in prototype" : "Not connected"],
        ["Prototype limitation", "Some profile checks still use manual test inputs"],
      ],
      actionLabel: "Check free improvements",
      onAction: () => s.go("profileAudit"),
    },
    {
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
    },
  ].sort((a, b) => (b.score || 0) - (a.score || 0));

  const best = candidates[0];
  const alternatives = candidates.slice(1);

  return (
    <Shell
      s={s}
      title="Best first move"
      subtitle={`Goal: fill ${gap.toLowerCase()}. Busy ranked the cheapest credible routes using the records and approved assets already saved.`}
      brandCue="Existing demand first. Free reach next. Paid only if needed."
    >
      <OpportunityCard
        {...best}
        eyebrow={`Recommended • ${best.eyebrow}`}
        actionLabel={best.actionLabel}
      />

      {s.activeWorkGoal?.spreadAcrossSlots && s.workGoalPlannedSlots.length ? (
        <Card
          eyebrow="Capacity plan"
          title={`${s.workGoalTargetJobs} booking${s.workGoalTargetJobs === 1 ? "" : "s"} across ${s.workGoalPlannedSlots.length} opening${s.workGoalPlannedSlots.length === 1 ? "" : "s"}`}
          body="Busy has turned the larger work target into specific diary openings instead of treating it as vague future capacity."
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
        body={remainingJobs === 1 ? "Busy keeps this narrow: strongest individual intent first, then only a small previous-customer action if needed." : remainingJobs === 2 ? "Busy can justify a small targeted batch, but broad promotion is still unnecessary unless the cheaper routes fail." : "The gap is larger, so a broader previous-customer action or limited offer can become proportionate before paid reach."}
        footer="Smallest sensible intervention first"
        tone="green"
      />

      <Card
        eyebrow="What Busy checked"
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
      subtitle="These counts now come from the customer, quote and job records actually saved in Busy Does It."
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
          body="Busy Does It is not inventing old enquiries or old quotes just to populate this screen."
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
            body={s.campaignRecipientLimit ? `Busy selected a proportional first batch of ${eligibleCount} customers for the current work target. Review each service group below; you can edit every draft separately.` : "Review each service group below. You can edit every draft separately."}
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
      subtitle="After each action, Busy Does It goes back to the live records instead of advancing through a prewritten marketing sequence."
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
              body="Once the quote is marked sent, Busy watches this date. If the quote is still unresolved, it can prepare the follow-up automatically."
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
                : `Busy Does It will surface this on Home when ${formatUKDate(saved.details.reminderDate)} arrives.`
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
            label={triage.lane === "Needs attention" ? "Check" : "Ready"}
            tone={triage.lane === "Needs attention" ? "amber" : inboxStageTone(parsed.stage)}
          />
        </View>
        <Text style={styles.activitySummary}>{contact}</Text>
        <Text style={styles.activitySummary}>{triage.reason || "Ready for review"}</Text>
        {triage.matchCustomerId ? (
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
            label="Let Busy file this safely"
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
      title="Busy Inbox"
      subtitle="Incoming information is triaged first. Only strict, low-risk record updates can be filed automatically."
      brandCue="Busy handles the obvious admin. You handle exceptions and approvals."
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
            ? "Safe Autopilot is on. Busy may file only high-confidence information into an exact existing-customer phone/email match when every trust rule passes. Everything else waits here."
            : "Automatic record filing is off. Busy can triage and prepare every item, but you review every file."
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
        body="Missing service/contact details, low-confidence extraction, name-only matches and conflicts with active work are pushed into Needs attention. Even a clean item is only auto-filed when it also has an exact phone/email customer match and the required stage-specific evidence."
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
          body="Busy is not creating Inbox work just to make the screen look active."
          footer="You can still Quick Capture something new"
          tone="green"
        />
      ) : null}

      <Button label="Quick capture something new" primary onPress={s.startQuickCapture} />
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
        <Button label="Open Busy Inbox" primary onPress={s.openBusyInbox} />
      </Shell>
    );
  }

  return (
    <Shell
      s={s}
      title="Busy filed it automatically"
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
        eyebrow="Why Busy was allowed to do this"
        title="All trust rules passed"
        body={item.autoFileReason || "Exact existing-customer match, high-confidence complete data and no active-work conflict."}
        footer="Recorded in Inbox + Intake History"
        tone="blue"
      />

      <Button label="Open customer record" primary onPress={() => s.openCustomer(customer.id)} />
      <Button label="Back to Busy Inbox" onPress={s.openBusyInbox} />
      <Button label="Automatic filing settings" onPress={() => s.go("recordFilingSettings")} />
    </Shell>
  );
}

function QuickCapture({ s }) {
  const canAnalyse = !!s.captureRawText.trim();
  return (
    <Shell
      s={s}
      title="Quick capture"
      subtitle="Paste something you already received instead of typing the customer record field by field."
      brandCue="Paste once. Busy triages it. Only strict safe matches can skip repetitive filing."
    >
      <Card
        eyebrow="Prototype intake layer"
        title="Messages and notes can become structured work"
        body="This prototype parses only the text you paste here. It is not reading your email, messages, calendar or invoices in the background yet."
        footer="Future connectors can feed this same intake pipeline"
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

      <Text style={styles.fieldLabel}>Paste the message or note</Text>
      <TextInput
        multiline
        value={s.captureRawText}
        onChangeText={s.setCaptureRawText}
        placeholder={"Example:\nSophie Green\nCould I get a quote for driveway cleaning?\n07700 900111"}
        placeholderTextColor="#9AA3B2"
        style={styles.messageInput}
      />

      <Button label="Add to Busy Inbox & triage" primary disabled={!canAnalyse} onPress={s.queueCaptureToInbox} />
      <Button label="Analyse & review manually now" disabled={!canAnalyse} onPress={s.analyseQuickCapture} />
      <Text style={styles.helper}>
        {s.recordFilingMode === "safe"
          ? "Safe Autopilot is on. Inbox may file only an exact existing-customer match that passes every trust rule. Anything uncertain still waits for you."
          : "Automatic filing is off. Inbox will triage the item, but every record change waits for your review."}
      </Text>

      <Text style={styles.sectionLabel}>Try a test example</Text>
      <Button label="Example enquiry" onPress={() => s.loadQuickCaptureExample("enquiry")} />
      <Button label="Example sent quote" onPress={() => s.loadQuickCaptureExample("quote")} />
      <Button label="Example booking" onPress={() => s.loadQuickCaptureExample("booking")} />
      <Button label="Example completed job" onPress={() => s.loadQuickCaptureExample("completed")} />
    </Shell>
  );
}

function QuickCaptureReview({ s }) {
  const match = s.captureMatch;
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
      title="Review what Busy understood"
      subtitle="Nothing changes until you approve this screen."
      brandCue="Extraction is a draft, not a fact."
    >
      {s.selectedInboxItemId ? (
        <Card
          eyebrow="From Busy Inbox"
          title="Busy has already triaged this item"
          body="You are now doing the human review. Saving files the Inbox item into the correct customer/work record; going back leaves it pending."
          footer="No record change yet"
          tone="blue"
        />
      ) : null}
      <Card
        eyebrow="Extraction confidence"
        title={s.captureConfidence}
        body={
          fields.length
            ? `Busy found: ${fields.join(", ")}. Check every important field before saving.`
            : "Very little structure was detected. Fill in the fields below before saving."
        }
        footer="Owner review required"
        tone={s.captureConfidence === "High" ? "green" : s.captureConfidence === "Medium" ? "blue" : "amber"}
      />

      {match ? (
        <Card
          eyebrow="Possible existing customer"
          title={match.customer.name}
          body={`${match.reason} • match confidence: ${match.confidence}. Busy will update this customer instead of creating a duplicate.`}
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
              ? "You chose to keep this as a separate customer even though Busy had found a possible match."
              : "Busy checked the saved phone number, email address and full name before deciding."
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
          body="Busy has deliberately left this blank rather than guessing from your current business defaults."
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
      title="Busy filed it"
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
            ? "Busy will watch the enquiry lifecycle"
            : latest.stage === "Quote sent"
            ? "Busy will watch the quote follow-up date"
            : latest.stage === "Booking"
            ? "The booking is now part of Work"
            : "Post-job admin is prepared underneath"
        }
        body="The normal Opportunity Engine uses this record from here. Quick capture is only the way the information got into Busy."
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
      subtitle="A simple audit trail of information Busy turned into customer/work records."
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

function NewEnquiry({ s }) {
  const effectiveService = s.newEnquiryCustomService.trim() || s.newEnquiryService.trim();
  const canSave = !!s.newEnquiryName.trim() && !!s.newEnquiryPhone.trim() && !!effectiveService;
  return (
    <Shell
      s={s}
      title="New enquiry"
      subtitle="Add somebody who phoned, messaged or asked for work. Record when the enquiry actually arrived so Busy Does It can judge its age."
      brandCue="Capture the customer once. Turn the enquiry into the next sensible action."
    >
      <Field label="Customer name" value={s.newEnquiryName} onChangeText={s.setNewEnquiryName} placeholder="e.g. Jane Smith" />
      <Field label="Phone" value={s.newEnquiryPhone} onChangeText={s.setNewEnquiryPhone} placeholder="e.g. 07700 900000" keyboardType="phone-pad" />
      <Field
        label="Job address / postcode (optional)"
        value={s.newEnquiryAddress}
        onChangeText={s.setNewEnquiryAddress}
        placeholder="Where is the work?"
      />

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

      <DatePickerField
        label="Enquiry received"
        value={s.newEnquiryDate}
        onChange={s.setNewEnquiryDate}
      />
      <Card
        eyebrow="Automatic admin"
        title={`Busy will check this again on ${formatUKDate(addDaysFromISO(s.newEnquiryDate || dateToISO(new Date()), 7))}`}
        body="If no quote, booking or follow-up has been recorded by then, the enquiry can become a quiet-enquiry opportunity automatically."
        tone="blue"
      />

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
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const visibleCustomers = s.customers.filter((customer) =>
    !query ||
    [customer.name, customer.phone, customer.email, customer.address, customer.service]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  );

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
      <Field
        label="Find a customer"
        value={search}
        onChangeText={setSearch}
        placeholder="Name, phone, email, address or service"
      />
      {query ? (
        <Text style={styles.helper}>
          {visibleCustomers.length
            ? `Showing ${visibleCustomers.length} matching customer${visibleCustomers.length === 1 ? "" : "s"}.`
            : "No customer records match that search."}
        </Text>
      ) : null}
      {visibleCustomers.map((customer) => {
        const eligible = s.customerContact && isEligibleCustomer(customer, s.services, s.verticalId);
        const action = s.replyActions?.[customer.id] || null;
        const pipelineLabel = customerPipelineLabel(customer, action);
        const activeAction = isActiveCustomerAction(action);
        const hasOpenEnquiry = !!(customer.currentEnquiryAt || (!customer.lastServiceDate && customer.createdAt));
        const enquiryTimestamp = customer.currentEnquiryAt || customer.createdAt;
        const enquiryAge = hasOpenEnquiry ? daysSinceTimestamp(enquiryTimestamp) : null;
        const statusLabel =
          pipelineLabel ||
          (hasOpenEnquiry
            ? customer.enquiryFollowUpOutcomeRecordedAt
              ? customer.enquiryFollowUpOutcome || "Follow-up recorded"
              : customer.enquiryFollowUpSentAt
              ? "Follow-up sent"
              : enquiryAge !== null && enquiryAge >= 7
              ? `Quiet ${enquiryAge}d`
              : "New enquiry"
            : eligible
            ? "Eligible now"
            : customer.contactOk
            ? (s.customerContact ? "Not due" : "Contact off")
            : "Do not contact");
        return (
          <View key={customer.id} style={styles.customerRecord}>
            <View style={styles.customerRecordTop}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerMeta}>{customer.phone || customer.email || "No contact detail"}</Text>
                {customer.phone && customer.email ? <Text style={styles.customerMeta}>{customer.email}</Text> : null}
              </View>
              <StatusChip
                label={statusLabel}
                tone={activeAction || eligible || hasOpenEnquiry ? "green" : "blue"}
              />
            </View>
            <Text style={styles.customerService}>{customer.service}</Text>
            <Text style={styles.customerMeta}>
              {customer.lastServiceDate
                ? `Last job: ${formatUKDate(customer.lastServiceDate)} • ${formatMonthsAgo(customer.lastServiceDate)}`
                : enquiryTimestamp
                ? `Enquiry: ${formatUKDate(String(enquiryTimestamp).slice(0, 10))} • ${enquiryAgeLabel(enquiryTimestamp)}`
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
      <Button label="Quick capture" primary onPress={s.startQuickCapture} />
      <Button label="+ New enquiry manually" onPress={s.startNewEnquiry} />
      <Button label="Open customer pipeline" onPress={() => s.go("workPipeline")} />
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

  const repeatDueDate = nextRepeatDueDate(customer, s.services, s.verticalId);
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
        body={
          [
            customer.phone || null,
            customer.email || null,
            customer.address || null,
          ].filter(Boolean).join("\n") || "No contact details saved"
        }
        footer={customer.contactOk ? "Contact allowed" : "Do not contact"}
        tone="green"
      >
        <MetricRow
          left="Stage"
          right={
            customerPipelineLabel(customer, action) ||
            customer.lifecycleStatus ||
            (customer.lastServiceDate ? "Previous customer" : "New enquiry")
          }
        />
        <MetricRow left="Last job" right={customer.lastServiceDate ? formatUKDate(customer.lastServiceDate) : "No completed job yet"} />
        {(customer.currentEnquiryAt || (!customer.lastServiceDate && customer.createdAt)) ? (
          <MetricRow
            left="Current enquiry received"
            right={formatUKDate(String(customer.currentEnquiryAt || customer.createdAt).slice(0, 10))}
            strong={daysSinceTimestamp(customer.currentEnquiryAt || customer.createdAt) >= 7}
          />
        ) : null}
        <MetricRow left="Last value" right={Number(customer.lastJobValue) > 0 ? `£${customer.lastJobValue}` : "Not recorded"} />
        {repeatDueDate ? (
          <MetricRow
            left="Repeat timing"
            right={repeatDueDate <= dateToISO(new Date()) ? "Due now" : formatUKDate(repeatDueDate)}
            strong={repeatDueDate <= dateToISO(new Date())}
          />
        ) : null}
        {customer.lastActivityAt ? (
          <MetricRow
            left="Last record update"
            right={formatUKDate(String(customer.lastActivityAt).slice(0, 10))}
          />
        ) : null}
        {Array.isArray(customer.sourceRecords) && customer.sourceRecords.length ? (
          <MetricRow
            left="Captured source items"
            right={String(customer.sourceRecords.length)}
          />
        ) : null}
      </Card>

      {(customer.currentEnquiryAt || (!customer.lastServiceDate && customer.createdAt)) && !action ? (
        customer.enquiryFollowUpSentAt ? (
          <Pressable
            onPress={() =>
              customer.enquiryFollowUpOutcomeRecordedAt
                ? null
                : s.openEnquiryFollowUpOutcome(customer.id)
            }
            style={styles.customerTimelineCard}
          >
            <View style={styles.activityTopRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.customerTimelineLabel}>QUIET ENQUIRY FOLLOW-UP</Text>
                <Text style={styles.activityName}>
                  {customer.enquiryFollowUpOutcomeRecordedAt ? customer.enquiryFollowUpOutcome : "Awaiting outcome"}
                </Text>
              </View>
              <StatusChip
                label={customer.enquiryFollowUpOutcomeRecordedAt ? "Recorded" : "Learn"}
                tone={customer.enquiryFollowUpOutcomeRecordedAt ? "green" : "blue"}
              />
            </View>
            <Text style={styles.activitySummary}>{customer.enquiryFollowUpDraft || "Prepared follow-up"}</Text>
            {!customer.enquiryFollowUpOutcomeRecordedAt ? (
              <Text style={styles.activityOpen}>Record what happened →</Text>
            ) : null}
          </Pressable>
        ) : daysSinceTimestamp(customer.currentEnquiryAt || customer.createdAt) >= 7 && customer.contactOk !== false ? (
          <Pressable onPress={() => s.prepareEnquiryFollowUp(customer.id)} style={styles.customerTimelineCard}>
            <View style={styles.activityTopRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.customerTimelineLabel}>QUIET ENQUIRY</Text>
                <Text style={styles.activityName}>No next action for {daysSinceTimestamp(customer.currentEnquiryAt || customer.createdAt)} days</Text>
              </View>
              <StatusChip label="£0 opportunity" tone="green" />
            </View>
            <Text style={styles.activitySummary}>Busy Does It can prepare a low-pressure check-in from this record.</Text>
            <Text style={styles.activityOpen}>Prepare follow-up →</Text>
          </Pressable>
        ) : null
      ) : null}

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
            eyebrow={action ? "Next customer action" : customer.lastServiceDate ? "What next?" : "Enquiry captured"}
            title={
              action
                ? "Start something new for this customer"
                : customer.lastServiceDate
                ? "Turn this customer into work"
                : "Choose the real next step"
            }
            body={
              customer.lastServiceDate
                ? "Start the action that matches what is happening in the real conversation. You do not need a simulated reply first."
                : "The enquiry is saved. Prepare a quote, book agreed work or set a follow-up without re-entering the customer."
            }
            tone={customer.lastServiceDate ? "blue" : "green"}
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
            {Array.isArray(item.photos) && item.photos.length ? (
              <>
                <Text style={styles.customerHistoryPhotoMeta}>
                  {item.photos.length} job photo{item.photos.length === 1 ? "" : "s"}
                  {item.postDraft
                    ? item.postDraftStatus === "Simulated published"
                      ? " • post approved"
                      : " • post draft ready"
                    : ""}
                  {item.postOutcomeRecordedAt ? ` • ${item.postOutcome}` : ""}
                </Text>
                <Pressable onPress={() => s.openJobAssets(customer.id, item.id)} style={styles.customerHistoryPhotoLink}>
                  <Text style={styles.customerHistoryPhotoLinkText}>Open photos / draft →</Text>
                </Pressable>
              </>
            ) : null}
            {item.kind === "job" && !String(item.id || "").startsWith("baseline-") && customer.contactOk !== false ? (
              item.reviewRequestSentAt ? (
                item.reviewRequestOutcomeRecordedAt ? (
                  <Text style={styles.customerHistoryPhotoMeta}>
                    Review request • {item.reviewRequestOutcome}
                  </Text>
                ) : (
                  <Pressable
                    onPress={() => s.openReviewRequestOutcome(customer.id, item.id)}
                    style={styles.customerHistoryPhotoLink}
                  >
                    <Text style={styles.customerHistoryPhotoLinkText}>Record review outcome →</Text>
                  </Pressable>
                )
              ) : (
                <Pressable
                  onPress={() => s.prepareReviewRequest(customer.id, item.id)}
                  style={styles.customerHistoryPhotoLink}
                >
                  <Text style={styles.customerHistoryPhotoLinkText}>Prepare review request →</Text>
                </Pressable>
              )
            ) : null}
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

function JobCompletePhotos({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  if (!customer || !job) {
    return (
      <Shell s={s} title="Job saved" subtitle="The completed job is saved, but the photo step could not be opened.">
        <Button label="Back" primary onPress={s.back} />
      </Shell>
    );
  }
  return (
    <Shell s={s} title="Job complete" subtitle={`${customer.name} • ${job.service || customer.service}`} brandCue="Save the useful proof once. Reuse it only with permission.">
      <Card eyebrow="Completed work" title={job.service || customer.service} body={`${job.date ? formatUKDate(job.date) : "Date saved"}${Number(job.value) > 0 ? ` • £${job.value}` : ""}`} footer="Saved to this customer’s job history" tone="green" />
      <Card
        eyebrow="Busy already handled"
        title="The follow-on admin is prepared"
        body={
          `${job.reviewRequestDraft ? "Review request drafted. " : ""}${
            job.repeatDueDate
              ? `Repeat timing saved for ${formatUKDate(job.repeatDueDate)}. `
              : "No repeat reminder was invented for this service. "
          }Nothing has been sent.`
        }
        footer="You stay in control"
        tone="blue"
      />
      <Card eyebrow="Optional next step" title="Got any photos from this job?" body="Choose only the photos you want attached to this job. Busy Does It does not browse the rest of your camera roll, and nothing is posted automatically." tone="blue" />
      <Button label="Add job photos" primary onPress={() => s.go("jobPhotos")} />
      <Button label="Skip for now" onPress={() => s.openCustomer(customer.id)} />
    </Shell>
  );
}

function JobPhotos({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  if (!customer || !job) {
    return <Shell s={s} title="Job photos" subtitle="The selected job could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell s={s} title="Job photos" subtitle={`${customer.name} • ${job.service || customer.service}`} brandCue="You choose the exact images. Busy Does It only sees what you select.">
      <Card eyebrow="Privacy first" title={s.pendingJobPhotos.length ? `${s.pendingJobPhotos.length} photo${s.pendingJobPhotos.length === 1 ? "" : "s"} selected` : "No photos selected yet"} body="A photo can stay attached privately to the job. Allowing future marketing suggestions still does not publish it — you approve public use separately." tone="green" />
      <Button label={s.pendingJobPhotos.length ? "Choose more / different photos" : "Choose photos"} primary={!s.pendingJobPhotos.length} onPress={s.chooseJobPhotos} />
      {s.pendingJobPhotos.length ? (
        <View style={styles.photoGrid}>
          {s.pendingJobPhotos.map((photo) => (
            <View key={photo.id || photo.uri} style={styles.photoTile}>
              <Image source={{ uri: photo.uri }} style={styles.photoImage} />
              <Pressable onPress={() => s.removePendingJobPhoto(photo.id)} style={styles.photoRemove}><Text style={styles.photoRemoveText}>Remove</Text></Pressable>
            </View>
          ))}
        </View>
      ) : null}
      {s.pendingJobPhotos.length ? (
        <ToggleRow title="Let Busy Does It suggest these later" body="Makes these selected photos available for future post/profile/ad suggestions. Nothing is posted without another approval." value={s.jobPhotosMarketingOk} onValueChange={s.setJobPhotosMarketingOk} />
      ) : null}
      {job.postDraft ? (
        <Card eyebrow="Saved draft" title="A finished-job post draft is ready" body="It is stored locally and has not been posted anywhere." tone="blue">
          <Button label="Open saved post draft" onPress={s.openJobPostDraft} />
        </Card>
      ) : null}
      <Button label={s.pendingJobPhotos.length ? "Save job photos" : "Save without photos"} primary={!!s.pendingJobPhotos.length} onPress={s.saveJobPhotos} />
      <Button label="Back to customer" onPress={() => s.openCustomer(customer.id)} />
    </Shell>
  );
}

function JobPhotoOpportunity({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  const allowedPhotos = (job?.photos || []).filter((photo) => photo.marketingOk);
  if (!customer || !job) {
    return <Shell s={s} title="Free next move" subtitle="The completed job could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell s={s} title="Free next move" subtitle="Use work you already completed before buying more attention." brandCue="Existing proof first. Paid reach later.">
      <Card eyebrow="Finished-job content" title={`Turn ${allowedPhotos.length} job photo${allowedPhotos.length === 1 ? "" : "s"} into a post?`} body={`${customer.name}’s ${(job.service || customer.service).toLowerCase()} job is already saved. Busy Does It can prepare a simple post draft using only the photos you approved for suggestions.`} footer="Cost: £0 • nothing posts without approval" tone="green" />
      <Button label="Prepare a post" primary disabled={!allowedPhotos.length} onPress={s.prepareJobPost} />
      <Button label="Not now" onPress={() => s.openCustomer(customer.id)} />
    </Shell>
  );
}

function JobPostDraft({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  const allowedPhotos = (job?.photos || []).filter((photo) => photo.marketingOk);
  if (!customer || !job) {
    return <Shell s={s} title="Post draft" subtitle="The completed job could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell s={s} title="Finished-job post" subtitle="Busy Does It has prepared the action. You can change the words before approval." brandCue="Prepare underneath. Owner decides what goes public.">
      <Card eyebrow="Prepared for you" title={`${allowedPhotos.length} approved job photo${allowedPhotos.length === 1 ? "" : "s"} + editable wording`} body="The source is a completed job already saved in Busy Does It. No address or private customer detail is added automatically." tone="green" />
      <Text style={styles.fieldLabel}>Post draft</Text>
      <TextInput multiline value={s.jobPostDraft} onChangeText={s.setJobPostDraft} placeholder="Write the finished-job post" placeholderTextColor="#9AA3B2" style={styles.messageInput} />
      <Text style={styles.helper}>Saving moves this prepared action to the approval screen. It still does not publish anything.</Text>
      <Button label="Save & review approval" primary disabled={!s.jobPostDraft.trim()} onPress={s.saveJobPostDraft} />
      <Button label="Back to photos" onPress={() => s.go("jobPhotos")} />
    </Shell>
  );
}

function JobPostApproval({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  const allowedPhotos = (job?.photos || []).filter((photo) => photo.marketingOk);
  if (!customer || !job?.postDraft) {
    return <Shell s={s} title="Approve post" subtitle="There is no prepared post to approve."><Button label="Back" primary onPress={s.back} /></Shell>;
  }

  const selectedCount =
    Number(!!s.connectedAccounts.meta && !!s.jobPostChannels.facebook) +
    Number(!!s.connectedAccounts.meta && !!s.jobPostChannels.instagram) +
    Number(!!s.connectedAccounts.googleBusiness && !!s.jobPostChannels.googleBusiness);
  const hasSocialConnection = !!s.connectedAccounts.meta;
  const hasGoogleConnection = !!s.connectedAccounts.googleBusiness;

  return (
    <Shell
      s={s}
      title="Approve prepared post"
      subtitle="Exactly what would be used, where it would go and what it costs — before anything happens."
      brandCue="Prepared by Busy Does It. Approved by you."
    >
      <Card eyebrow="Prepared action" title={job.service || customer.service} body={job.postDraft} footer="Cost: £0" tone="green">
        <MetricRow left="Approved photos" right={String(allowedPhotos.length)} />
        <MetricRow left="Customer details included" right="No" />
        <MetricRow left="Real publishing in prototype" right="No" />
      </Card>

      {allowedPhotos.length ? (
        <View style={styles.photoGrid}>
          {allowedPhotos.slice(0, 5).map((photo) => (
            <View key={photo.id || photo.uri} style={styles.photoTile}>
              <Image source={{ uri: photo.uri }} style={styles.photoImage} />
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>Where should it go?</Text>
      {hasSocialConnection ? (
        <>
          <ToggleRow
            title="Facebook"
            body="Uses the Facebook / Instagram prototype connection."
            value={!!s.jobPostChannels.facebook}
            onValueChange={() => s.toggleJobPostChannel("facebook")}
          />
          <ToggleRow
            title="Instagram"
            body="Uses the Facebook / Instagram prototype connection."
            value={!!s.jobPostChannels.instagram}
            onValueChange={() => s.toggleJobPostChannel("instagram")}
          />
        </>
      ) : null}
      {hasGoogleConnection ? (
        <ToggleRow
          title="Google Business"
          body="Prototype business-profile destination."
          value={!!s.jobPostChannels.googleBusiness}
          onValueChange={() => s.toggleJobPostChannel("googleBusiness")}
        />
      ) : null}

      {!hasSocialConnection && !hasGoogleConnection ? (
        <Card
          eyebrow="No publishing connection selected"
          title="Connect a profile before approval"
          body="The prototype will still never post for real, but this lets us test the correct approval flow against a destination the owner deliberately connected."
          tone="amber"
        />
      ) : null}

      <Button label="Edit wording" onPress={() => s.go("jobPostDraft")} />
      <Button
        label={selectedCount ? `Approve simulated publish • ${selectedCount}` : "Choose a connected profile first"}
        primary
        disabled={!selectedCount}
        onPress={s.simulateJobPostPublish}
      />
      <Button label="Connected accounts" onPress={() => s.go("connectedAccounts")} />
      {s.intakeLog.length ? <Button label={`Intake history • ${s.intakeLog.length}`} onPress={() => s.go("intakeHistory")} /> : null}
      <Button label="Not now" onPress={() => s.openCustomer(customer.id)} />
    </Shell>
  );
}

function JobPostPublished({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  if (!customer || !job) {
    return <Shell s={s} title="Prepared action saved" subtitle="The job could not be found."><Button label="Home" primary onPress={() => s.jump("home", "Home")} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="Approved"
      subtitle="Prototype only — nothing was actually published."
      brandCue="Action prepared. Owner approved. Outcome can now be learned."
    >
      <Card
        eyebrow="Simulated publish"
        title={(job.postChannels || []).join(" • ") || "Selected profile"}
        body={job.postDraft}
        footer="Actual spend: £0"
        tone="green"
      />
      <Card
        eyebrow="Next learning step"
        title="What happened after the post?"
        body="You can record the outcome now or later. Busy Does It should learn from enquiries, quotes and bookings — not just likes."
        tone="blue"
      />
      <Button label="Record what happened" primary onPress={() => s.openJobPostOutcome(customer.id, job.id)} />
      <Button label="Do this later" onPress={() => s.openCustomer(customer.id)} />
    </Shell>
  );
}

function JobPostOutcome({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  const options = ["No enquiry yet", "Enquiry", "Quote", "Booking"];
  if (!customer || !job) {
    return <Shell s={s} title="Post outcome" subtitle="The selected job could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="What happened?"
      subtitle="One simple outcome helps Busy Does It learn which free actions are genuinely useful."
      brandCue="Learn from business outcomes, not vanity metrics."
    >
      <Card
        eyebrow="Post being measured"
        title={job.service || customer.service}
        body={`Simulated on ${(job.postChannels || []).join(", ") || "a selected profile"}.`}
        footer="No causal claim is assumed"
        tone="blue"
      />
      {options.map((option) => (
        <Choice
          key={option}
          label={option}
          selected={s.jobPostOutcome === option}
          onPress={() => s.setJobPostOutcome(option)}
        />
      ))}
      {s.jobPostOutcome === "Booking" ? (
        <Field
          label="Booked value (optional)"
          value={s.jobPostOutcomeValue}
          onChangeText={s.setJobPostOutcomeValue}
          keyboardType="number-pad"
          prefix="£"
          placeholder="Only if you know it"
        />
      ) : null}
      <Card
        eyebrow="Attribution rule"
        title="Record what you know — do not pretend"
        body="A saved outcome means the owner associated it with this post. Busy Does It should label that clearly rather than claiming the post definitely caused the work."
        tone="green"
      />
      <Button label="Save outcome" primary onPress={s.saveJobPostOutcome} />
      <Button label="Cancel" onPress={s.back} />
    </Shell>
  );
}

function StaleEnquiries({ s }) {
  const entries = s.staleEnquiryEntries || [];
  return (
    <Shell
      s={s}
      title="Quiet enquiries"
      subtitle="These come from actual customer records that have had no next action for at least 7 days."
      brandCue="Real records. Real dates. No typed-in opportunity count."
    >
      <Card
        eyebrow="Detected from customer records"
        title={`${entries.length} quiet enquir${entries.length === 1 ? "y" : "ies"} worth reviewing`}
        body="Busy Does It only includes enquiry records with contact allowed, no current quote/booking/reminder, and no previous follow-up already sent."
        footer="Advertising spend: £0"
        tone="green"
      />
      {entries.map(({ customer, age }) => (
        <Pressable
          key={customer.id}
          onPress={() => s.prepareEnquiryFollowUp(customer.id)}
          style={styles.activityCard}
        >
          <View style={styles.activityTopRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.activityName}>{customer.name}</Text>
              <Text style={styles.activityService}>{customer.service}</Text>
            </View>
            <StatusChip label={`${age}d quiet`} tone="amber" />
          </View>
          <Text style={styles.activitySummary}>Added {enquiryAgeLabel(customer.createdAt)} • no active customer action</Text>
          <Text style={styles.activityOpen}>Prepare follow-up →</Text>
        </Pressable>
      ))}
      {!entries.length ? (
        <Card
          eyebrow="Nothing due"
          title="No quiet enquiries detected"
          body="New enquiries stay in the normal pipeline. Once an unresolved enquiry reaches 7 days, it can appear here automatically."
          tone="blue"
        />
      ) : null}
      <Button label="+ Add an enquiry" onPress={s.startNewEnquiry} />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function StaleQuotes({ s }) {
  const entries = s.dueQuoteEntries || [];
  return (
    <Shell
      s={s}
      title="Quote follow-ups due"
      subtitle="These are real sent quotes whose saved sent date is at least 7 days old."
      brandCue="Quote data creates the opportunity automatically."
    >
      <Card
        eyebrow="Detected from live quote records"
        title={`${entries.length} quote${entries.length === 1 ? "" : "s"} worth following up`}
        body="A quote drops out of this list once its prepared follow-up is approved or its quote status changes."
        footer="Advertising spend: £0"
        tone="green"
      />
      {entries.map(({ id, action, customer, age }) => (
        <Pressable
          key={id}
          onPress={() => s.prepareQuoteFollowUp(id)}
          style={styles.activityCard}
        >
          <View style={styles.activityTopRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.activityName}>{customer.name}</Text>
              <Text style={styles.activityService}>{customer.service}</Text>
            </View>
            <StatusChip label={`${age}d`} tone="amber" />
          </View>
          <Text style={styles.activitySummary}>
            Quote {action.details?.quoteAmount ? `£${action.details.quoteAmount}` : "value not recorded"} • sent {action.details?.quoteSentAt ? formatUKDate(String(action.details.quoteSentAt).slice(0, 10)) : "date unknown"}
          </Text>
          <Text style={styles.activityOpen}>Review prepared follow-up →</Text>
        </Pressable>
      ))}
      {!entries.length ? (
        <Card
          eyebrow="Nothing due"
          title="No sent quote has reached 7 days yet"
          body="Busy Does It now calculates this from each quote’s real status and sent date instead of a manually entered old-quote count."
          tone="blue"
        />
      ) : null}
      <Button label="Open customer activity" onPress={() => s.go("customerActivity")} />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function EnquiryFollowUp({ s }) {
  const customer = s.selectedCustomer;
  const age = daysSinceTimestamp(customer?.createdAt);
  if (!customer || customer.lastServiceDate) {
    return <Shell s={s} title="Enquiry follow-up" subtitle="The enquiry could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="Prepared enquiry follow-up"
      subtitle="Busy Does It has prepared a low-pressure check-in from the actual enquiry record."
      brandCue="Existing interest first. Nothing sends without approval."
    >
      <Card
        eyebrow="Quiet enquiry"
        title={customer.name}
        body={`${customer.service}${age !== null ? ` • ${age} days since enquiry` : ""}`}
        footer="Advertising spend: £0"
        tone="green"
      />
      <Text style={styles.fieldLabel}>Prepared follow-up</Text>
      <TextInput
        multiline
        value={s.enquiryFollowUpDraft}
        onChangeText={s.setEnquiryFollowUpDraft}
        style={styles.messageInput}
        placeholder="Follow-up message"
        placeholderTextColor="#9AA3B2"
      />
      <Card
        eyebrow="Approval"
        title="You decide whether this goes"
        body="The prototype records the approval and later outcome. It does not actually message the customer."
        tone="blue"
      />
      <Button
        label="Approve simulated send"
        primary
        disabled={!s.enquiryFollowUpDraft.trim()}
        onPress={s.simulateEnquiryFollowUpSend}
      />
      <Button label="Open customer" onPress={() => s.openCustomer(customer.id)} />
      <Button label="Not now" onPress={s.back} />
    </Shell>
  );
}

function EnquiryFollowUpSent({ s }) {
  const customer = s.selectedCustomer;
  if (!customer?.enquiryFollowUpSentAt) {
    return <Shell s={s} title="Follow-up saved" subtitle="The enquiry follow-up could not be found."><Button label="Home" primary onPress={() => s.jump("home", "Home")} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="Enquiry follow-up approved"
      subtitle="Prototype only — no real message was sent."
      brandCue="Action approved. Outcome can now improve future ranking."
    >
      <Card
        eyebrow="Simulated send"
        title={customer.name}
        body={customer.enquiryFollowUpDraft}
        footer="Cost: £0"
        tone="green"
      />
      <Button label="Record what happened" primary onPress={() => s.openEnquiryFollowUpOutcome(customer.id)} />
      <Button label="Do this later" onPress={() => s.openCustomer(customer.id)} />
    </Shell>
  );
}

function EnquiryFollowUpOutcome({ s }) {
  const customer = s.selectedCustomer;
  const options = ["No reply yet", "Still interested", "Not interested"];
  if (!customer?.enquiryFollowUpSentAt) {
    return <Shell s={s} title="Enquiry outcome" subtitle="The enquiry follow-up could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="What happened?"
      subtitle="This turns an old enquiry into evidence the Opportunity Engine can use next time."
      brandCue="Learn from customer outcomes, not message counts."
    >
      <Card
        eyebrow="Enquiry being measured"
        title={customer.name}
        body={customer.service}
        footer="User-recorded outcome"
        tone="blue"
      />
      {options.map((option) => (
        <Choice
          key={option}
          label={option}
          selected={s.enquiryFollowUpOutcome === option}
          onPress={() => s.setEnquiryFollowUpOutcome(option)}
        />
      ))}
      {s.enquiryFollowUpOutcome === "Still interested" ? (
        <Card
          eyebrow="Likely next step"
          title="Open the customer and prepare the real quote or booking"
          body="Busy Does It records the interest but does not invent a price or booking agreement."
          tone="green"
        />
      ) : null}
      <Button label="Save outcome" primary onPress={s.saveEnquiryFollowUpOutcome} />
      <Button label="Cancel" onPress={s.back} />
    </Shell>
  );
}

function QuoteFollowUp({ s }) {
  const customer = s.selectedReplyCustomer;
  const action = customer ? s.replyActions?.[customer.id] : null;
  const age = daysSinceTimestamp(action?.details?.quoteSentAt || action?.completedAt);
  if (!customer || action?.type !== "quote") {
    return <Shell s={s} title="Quote follow-up" subtitle="The quote could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="Prepared quote follow-up"
      subtitle="Busy Does It has drafted the next action from the saved quote. You can change every word."
      brandCue="Prepared underneath. Nothing sends without approval."
    >
      <Card
        eyebrow="Existing customer intent"
        title={customer.name}
        body={`${customer.service} • quote ${action.details?.quoteAmount ? `£${action.details.quoteAmount}` : "value not recorded"}${age !== null ? ` • quiet for ${age} days` : ""}`}
        footer="Advertising spend: £0"
        tone="green"
      />
      <Text style={styles.fieldLabel}>Prepared follow-up</Text>
      <TextInput
        multiline
        value={s.quoteFollowUpDraft}
        onChangeText={s.setQuoteFollowUpDraft}
        style={styles.messageInput}
        placeholder="Follow-up message"
        placeholderTextColor="#9AA3B2"
      />
      <Card
        eyebrow="Approval"
        title="You decide whether this goes"
        body="The prototype records the approval and outcome, but it does not actually message the customer."
        tone="blue"
      />
      <Button label="Approve simulated send" primary disabled={!s.quoteFollowUpDraft.trim()} onPress={s.simulateQuoteFollowUpSend} />
      <Button label="Open original quote" onPress={() => s.openSavedReplyAction(customer.id)} />
      <Button label="Not now" onPress={s.back} />
    </Shell>
  );
}

function QuoteFollowUpSent({ s }) {
  const customer = s.selectedReplyCustomer;
  const action = customer ? s.replyActions?.[customer.id] : null;
  if (!customer || !action?.details?.followUpSentAt) {
    return <Shell s={s} title="Follow-up saved" subtitle="The follow-up could not be found."><Button label="Home" primary onPress={() => s.jump("home", "Home")} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="Follow-up approved"
      subtitle="Prototype only — no real message was sent."
      brandCue="Action approved. Now Busy Does It can learn the outcome."
    >
      <Card
        eyebrow="Simulated send"
        title={customer.name}
        body={action.details.followUpMessage}
        footer="Cost: £0"
        tone="green"
      />
      <Button label="Record what happened" primary onPress={() => s.openQuoteFollowUpOutcome(customer.id)} />
      <Button label="Do this later" onPress={() => s.openCustomer(customer.id)} />
    </Shell>
  );
}

function QuoteFollowUpOutcome({ s }) {
  const customer = s.selectedReplyCustomer;
  const action = customer ? s.replyActions?.[customer.id] : null;
  const options = ["No reply yet", "Still considering", "Accepted", "Declined"];
  if (!customer || !action?.details?.followUpSentAt) {
    return <Shell s={s} title="Follow-up outcome" subtitle="The follow-up could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="What happened?"
      subtitle="One quick update turns a follow-up into evidence the Opportunity Engine can use."
      brandCue="Learn from customer outcomes, not message activity."
    >
      <Card
        eyebrow="Quote being measured"
        title={customer.name}
        body={`${customer.service} • £${action.details?.quoteAmount || "—"}`}
        footer="User-recorded outcome"
        tone="blue"
      />
      {options.map((option) => (
        <Choice
          key={option}
          label={option}
          selected={s.quoteFollowUpOutcome === option}
          onPress={() => s.setQuoteFollowUpOutcome(option)}
        />
      ))}
      {s.quoteFollowUpOutcome === "Accepted" ? (
        <Card
          eyebrow="Next step"
          title="Accepted quotes become bookings"
          body="Saving this marks the quote accepted. Open the customer afterwards to turn it into a booking when the date is agreed."
          tone="green"
        />
      ) : null}
      <Button label="Save outcome" primary onPress={s.saveQuoteFollowUpOutcome} />
      <Button label="Cancel" onPress={s.back} />
    </Shell>
  );
}

function ReviewRequest({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  if (!customer || !job) {
    return <Shell s={s} title="Review request" subtitle="The completed job could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="Prepared review request"
      subtitle="A completed job can create another £0 opportunity without becoming pushy."
      brandCue="Prepared for you. Sent only with approval."
    >
      <Card
        eyebrow="Completed customer job"
        title={customer.name}
        body={`${job.service || customer.service}${Number(job.value) > 0 ? ` • £${job.value}` : ""}`}
        footer="Advertising spend: £0"
        tone="green"
      />
      <Text style={styles.fieldLabel}>Prepared request</Text>
      <TextInput
        multiline
        value={s.reviewRequestDraft}
        onChangeText={s.setReviewRequestDraft}
        style={styles.messageInput}
        placeholder="Review request"
        placeholderTextColor="#9AA3B2"
      />
      <Card
        eyebrow="Trust rule"
        title="Low pressure and truthful"
        body="Busy Does It should ask for an honest review, not a positive review, and the owner can edit or skip the request."
        tone="blue"
      />
      <Button label="Approve simulated send" primary disabled={!s.reviewRequestDraft.trim()} onPress={s.simulateReviewRequestSend} />
      <Button label="Not now" onPress={() => s.openCustomer(customer.id)} />
    </Shell>
  );
}

function ReviewRequestSent({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  if (!customer || !job?.reviewRequestSentAt) {
    return <Shell s={s} title="Review request saved" subtitle="The request could not be found."><Button label="Home" primary onPress={() => s.jump("home", "Home")} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="Review request approved"
      subtitle="Prototype only — no real message was sent."
      brandCue="Action approved. Outcome can be learned later."
    >
      <Card
        eyebrow="Simulated send"
        title={customer.name}
        body={job.reviewRequestDraft}
        footer="Cost: £0"
        tone="green"
      />
      <Button label="Record what happened" primary onPress={() => s.openReviewRequestOutcome(customer.id, job.id)} />
      <Button label="Do this later" onPress={() => s.openCustomer(customer.id)} />
    </Shell>
  );
}

function ReviewRequestOutcome({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  const options = ["No response yet", "Review left"];
  if (!customer || !job?.reviewRequestSentAt) {
    return <Shell s={s} title="Review request outcome" subtitle="The request could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="Did they leave a review?"
      subtitle="This is enough for the engine to learn whether asking after completed work is useful."
      brandCue="Simple outcome. Better future ranking."
    >
      <Card
        eyebrow="Completed job"
        title={customer.name}
        body={job.service || customer.service}
        footer="No rating or review text is invented"
        tone="blue"
      />
      {options.map((option) => (
        <Choice
          key={option}
          label={option}
          selected={s.reviewRequestOutcome === option}
          onPress={() => s.setReviewRequestOutcome(option)}
        />
      ))}
      <Button label="Save outcome" primary onPress={s.saveReviewRequestOutcome} />
      <Button label="Cancel" onPress={s.back} />
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
      <Field
        label="Job address / postcode (optional)"
        value={s.newCustomerAddress}
        onChangeText={s.setNewCustomerAddress}
        placeholder="Where is the work?"
      />
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
      {s.activeWorkGoal && s.offerGoal === "Fill a quiet day" ? (
        <Card
          eyebrow="Built from your work goal"
          title={s.activeWorkGoal.label}
          body={`Busy started this offer with a cap of ${s.workGoalTargetJobs} booking and the normal saved service price. Lower the price only if you decide an incentive is actually worth the margin.`}
          footer="Special offer does not automatically mean discount"
          tone="blue"
        />
      ) : null}
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
  const tiedToGoal = !!s.activeWorkGoal && s.offerGoal === "Fill a quiet day";
  const target = tiedToGoal ? s.workGoalTargetJobs : Math.max(1, Number(s.offerMax) || 1);
  const booked = tiedToGoal ? s.workGoalBookedCount : 0;
  const reached = tiedToGoal && s.workGoalFilled;

  return (
    <Shell
      s={s}
      title={reached ? "Offer target reached" : "Offer plan ready"}
      subtitle={
        reached
          ? "The saved bookings already cover the work goal, so Busy should stop escalating this offer."
          : "Prototype plan only — no customer message, public post or advert has actually been sent."
      }
    >
      <Card
        eyebrow={reached ? "Stop condition reached" : "Controlled offer"}
        title={tiedToGoal ? `${booked} of ${target} target booking${target === 1 ? "" : "s"} recorded` : `Maximum ${target} booking${target === 1 ? "" : "s"}`}
        body={
          reached
            ? `${s.activeWorkGoal.label} is covered. More promotion for the same gap is unnecessary.`
            : `${s.offerService} • ${s.offerDates}. Busy has prepared the plan, but the prototype is not pretending it has contacted customers or generated bookings that are not in the saved records.`
        }
        footer={
          reached
            ? "Recommended additional spend: £0"
            : String(s.offerPrice) === String(s.normalPrice)
            ? `Starts at normal price: £${s.normalPrice}`
            : `Offer price: £${s.offerPrice} • normal about £${s.normalPrice}`
        }
        tone={reached ? "green" : "blue"}
      />
      {tiedToGoal ? (
        <>
          <MetricRow left="Work goal" right={s.activeWorkGoal.label} />
          <MetricRow left="Target bookings" right={String(target)} />
          <MetricRow left="Matching confirmed bookings" right={String(booked)} />
          <MetricRow left="Recorded booked value" right={s.workGoalBookedValue ? `£${s.workGoalBookedValue}` : "£0"} strong={reached} />
        </>
      ) : null}
      {reached ? (
        <Button label="Close work goal" primary onPress={s.clearWorkGoal} />
      ) : (
        <Button label="Back to ranked routes" primary onPress={() => s.go("bestMove")} />
      )}
      <Button label="View work diary" onPress={() => s.jump("workHub", "Work")} />
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
      title="What happened?"
      subtitle="Everything on this screen now comes from customer, quote, booking, job or recorded outcome data saved in the prototype."
      brandCue="Record-based results. No illustrative totals on the main screen."
    >
      <Card
        eyebrow="Value we can trace"
        title="Business value saved in separate, traceable buckets"
        body="Busy Does It does not add these figures into one headline total because the same job could appear in more than one stage. Attribution stays labelled instead of being presented as certainty."
        tone="green"
      >
        <MetricRow left="Completed work recorded" right={`£${s.completedJobValue}`} strong={s.completedJobValue > 0} />
        <MetricRow left="Active pipeline" right={`£${s.pipelineWorkValue}`} strong={s.pipelineWorkValue > 0} />
        <MetricRow left="Completed value from prototype reactivation flow" right={`£${s.reactivationCompletedValue}`} />
        <MetricRow left="Post-attributed booking value" right={`£${s.postAttributedValue}`} strong={s.postAttributedValue > 0} />
        <MetricRow left="Finished-job posts approved" right={String(s.publishedPhotoPostCount)} />
        <MetricRow left="Post outcomes recorded" right={String(s.postOutcomeRecordedCount)} />
        <MetricRow left="Post outcomes marked booking" right={String(s.postBookingOutcomeCount)} />
      </Card>

      <Card
        eyebrow="Busy Inbox"
        title={`${s.inboxPendingItems.length} incoming item${s.inboxPendingItems.length === 1 ? "" : "s"} waiting for review`}
        body={
          s.recordFilingMode === "safe"
            ? "Safe Autopilot can remove repetitive filing only when every strict trust rule passes. Exceptions remain visible for owner review."
            : "Busy is triaging incoming information, but automatic record filing is currently off."
        }
        tone={s.inboxNeedsAttentionItems.length ? "amber" : "green"}
      >
        <MetricRow left="Automatic filing mode" right={s.recordFilingMode === "safe" ? "Safe items only" : "Review everything"} />
        <MetricRow left="Needs attention" right={String(s.inboxNeedsAttentionItems.length)} strong={s.inboxNeedsAttentionItems.length > 0} />
        <MetricRow left="Ready to review" right={String(s.inboxReadyItems.length)} />
        <MetricRow left="Auto-filed safely" right={String(s.inboxAutoFiledCount)} strong={s.inboxAutoFiledCount > 0} />
        <MetricRow left="Filed after owner review" right={String(s.inboxOwnerFiledCount)} />
        <MetricRow left="Dismissed without filing" right={String(s.inboxDismissedCount)} />
        <Button label="Open Busy Inbox" onPress={s.openBusyInbox} />
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
        eyebrow="Admin Busy handled underneath"
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
        eyebrow="Opportunity Engine learning"
        title="The app is starting to learn which £0 actions deserve priority"
        body="These are recorded prototype outcomes. Small samples should change rankings only gently until more real evidence exists."
        tone="blue"
      >
        <MetricRow left="Quiet-enquiry follow-ups approved" right={String(s.enquiryFollowUpSentCount)} />
        <MetricRow left="Quiet-enquiry outcomes recorded" right={String(s.enquiryFollowUpOutcomeCount)} />
        <MetricRow left="Still interested after enquiry follow-up" right={String(s.enquiryFollowUpInterestedCount)} strong={s.enquiryFollowUpInterestedCount > 0} />
        <MetricRow left="Quote follow-ups approved" right={String(s.quoteFollowUpSentCount)} />
        <MetricRow left="Quote follow-up outcomes recorded" right={String(s.quoteFollowUpOutcomeCount)} />
        <MetricRow left="Accepted after quote follow-up" right={String(s.quoteFollowUpAcceptedCount)} strong={s.quoteFollowUpAcceptedCount > 0} />
        <MetricRow left="Accepted quote value after follow-up" right={`£${s.quoteFollowUpAcceptedValue}`} />
        <MetricRow left="Review requests approved" right={String(s.reviewRequestSentCount)} />
        <MetricRow left="Review-request outcomes recorded" right={String(s.reviewRequestOutcomeCount)} />
        <MetricRow left="Reviews recorded as left" right={String(s.reviewReceivedCount)} strong={s.reviewReceivedCount > 0} />
        <MetricRow left="Previous-customer completed value" right={`£${s.reactivationCompletedValue}`} />
      </Card>

      <Card
        eyebrow="Customer pipeline"
        title={`£${s.pipelineWorkValue} of customer work in the pipeline`}
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

      <Button label="Open customer pipeline" primary onPress={() => s.go("workPipeline")} />
      {s.completedBookingCount ? <Button label="Open work diary" onPress={() => s.go("bookings")} /> : null}
      {Object.keys(s.replyActions || {}).length ? (
        <Button label="View all customer activity" onPress={() => s.go("customerActivity")} />
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


function BusinessData({ s }) {
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
      title="Business data"
      subtitle="General business facts stay editable. Opportunity counts now come from individual records wherever Busy Does It has the data."
    >
      <Card
        eyebrow="Calculated from records"
        title="Opportunity counts are no longer typed in"
        body="Busy Does It uses saved customer dates, quote statuses, job history, service timing and permissions to decide what is actually available."
        tone="green"
      >
        <MetricRow left="Saved customer records" right={String(s.customers.length)} />
        <MetricRow left="Quiet enquiries (7+ days)" right={String(s.staleEnquiryEntries.length)} strong={s.staleEnquiryEntries.length > 0} />
        <MetricRow left="Quote follow-ups due (7+ days)" right={String(s.dueQuoteEntries.length)} strong={s.dueQuoteEntries.length > 0} />
        <MetricRow left="Previous customers due" right={String(s.eligibleCustomers.length)} strong={s.eligibleCustomers.length > 0} />
        <MetricRow left="Completed jobs eligible for review request" right={String(reviewReadyCount)} />
      </Card>

      <Field label="Business name" value={s.businessName} onChangeText={s.setBusinessName} />
      <Field label="Trade or service" value={s.trade} onChangeText={s.setTrade} />
      <Field label="Postcode / base area" value={s.postcode} onChangeText={s.setPostcode} />
      <Field label="Service radius" value={s.radius} onChangeText={s.setRadius} keyboardType="number-pad" prefix="Miles" />
      <Field label="Next quiet slot" value={s.quietSlot} onChangeText={s.setQuietSlot} placeholder="e.g. Thursday afternoon" />
      <Button label="Manage customer records" onPress={() => s.go("customerRecords")} />

      <Card
        eyebrow="Prototype-only profile inputs"
        title="Two profile checks still need manual test data"
        body="Until a real Google Business / social connection exists, unanswered-review and recent-photo counts stay clearly labelled as manual test inputs and do not masquerade as live account data."
        tone="blue"
      />
      <Field label="Test: unanswered reviews" value={s.unansweredReviewCount} onChangeText={s.setUnansweredReviewCount} keyboardType="number-pad" />
      <Field label="Test: recent photos wanted" value={s.recentPhotoCountNeeded} onChangeText={s.setRecentPhotoCountNeeded} keyboardType="number-pad" />
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
        <MetricRow
          left="Automatic record filing"
          right={s.recordFilingMode === "safe" ? "Safe items only" : "Review everything"}
          strong={s.recordFilingMode === "safe"}
        />
        <MetricRow left="Connected accounts" right={`${connectedCount}/${connectionRows.length}`} />
      </Card>
      <Button label="Customer records" primary onPress={() => s.go("customerRecords")} />
      <Button
        label={s.inboxPendingItems.length ? `Busy Inbox • ${s.inboxPendingItems.length} waiting` : "Busy Inbox"}
        onPress={s.openBusyInbox}
      />
      <Button label="Customer pipeline" onPress={() => s.go("workPipeline")} />
      <Button label="Business type & services" onPress={() => s.go("businessType")} />
      {s.completedBookingCount ? <Button label="Bookings" onPress={() => s.go("bookings")} /> : null}
      {Object.keys(s.replyActions || {}).length ? (
        <Button label="Customer activity" onPress={() => s.go("customerActivity")} />
      ) : null}
      <Button label="Business profile & opportunity data" onPress={() => s.go("businessData")} />
      <Button label="Change limits" onPress={() => s.go("settingsLimits")} />
      <Button label="Automatic record filing" onPress={() => s.go("recordFilingSettings")} />
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
    <Shell s={s} title="How Busy Does It works" subtitle="Simple on the surface. Serious business logic underneath.">
      <Card eyebrow="1" title="Incoming information gets sorted first" body="Messages, notes and future connected-app events should land in Busy Inbox. Busy extracts what it can, checks for duplicates and flags anything uncertain before it changes the records." />
      <Card eyebrow="2" title="Obvious record admin can disappear" body="With Safe Autopilot enabled, only strict high-confidence updates to an exact existing customer can be filed without another tap. Anything uncertain stays in Busy Inbox." />
      <Card eyebrow="3" title="Busy ranks the best next move" body="Live customer commitments, £0 opportunities and prepared actions compete underneath Home so the owner normally sees one clear priority." />
      <Card eyebrow="4" title="You control important actions" body="Customer messages, public posts and paid spend still require the appropriate approval. Busy prepares underneath without pretending approval happened." />
      <Card eyebrow="5" title="Outcomes improve later recommendations" body="Results focus on enquiries, quotes, bookings, completed work and recorded value. Outcomes feed gently back into future ranking rather than rewarding vanity activity." />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function WhatMakesDifferent({ s }) {
  return (
    <Shell s={s} title="What makes Busy Does It different" subtitle="Concrete design choices — not hype.">
      <Card eyebrow="Triage first" title="Incoming information becomes organised work" body="Busy Inbox is designed to receive candidate information from messages, notes and future connections, match it to the right customer and only interrupt the owner when review is useful." />
      <Card eyebrow="Goal first" title="You tell us the problem, not the channel" body="The app chooses or recommends the marketing method underneath instead of forcing you to decide between ads, email, social or audiences." />
      <Card eyebrow="Cost first" title="Free and low-cost opportunities come before paid reach" body="The app can recommend spending nothing when that is the more sensible first move." />
      <Card eyebrow="Control" title="Automation is split by risk" body="Low-risk record filing can use a strict Safe Autopilot rule. Customer messages, public posting and paid spend keep their own stronger controls." />
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
      <Button label="Typical job lengths & capacity" onPress={() => s.go("capacitySettings")} />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function CapacitySettings({ s }) {
  return (
    <Shell
      s={s}
      title="Typical job lengths"
      subtitle="Busy uses these only to estimate capacity. Change them whenever the real business says otherwise."
      brandCue="Editable planning assumptions. No false precision."
    >
      <Card
        eyebrow="How this is used"
        title="Can the requested work actually fit?"
        body="For a selected morning or afternoon, Busy compares the saved typical job length with a simple four-hour planning window. Travel, job complexity and customer circumstances can still change the real duration."
        tone="blue"
      />
      {s.services.map((service) => (
        <Card
          key={service.id}
          eyebrow={service.wanted ? "Priority service" : "Service"}
          title={service.name}
          body={`Current planning length: about ${formatDurationHours(service.durationHours)} per job.`}
          footer="Adjust in 30-minute steps"
          tone={service.id === s.selectedServiceId ? "green" : "blue"}
        >
          <Button
            label="30 minutes shorter"
            disabled={planningDurationHours(service) <= 0.5}
            onPress={() => s.adjustServiceDuration(service.id, -0.5)}
          />
          <Button
            label="30 minutes longer"
            disabled={planningDurationHours(service) >= 8}
            onPress={() => s.adjustServiceDuration(service.id, 0.5)}
          />
        </Card>
      ))}
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

function RecordFilingSettings({ s }) {
  return (
    <Shell
      s={s}
      title="Automatic record filing"
      subtitle="Choose how much routine Inbox filing Busy may do without interrupting you."
      brandCue="Automation gets permission by rule — never by assumption."
    >
      <Choice
        label="Review everything"
        sub="Busy triages and prepares incoming information, but every customer/work record change waits for you."
        selected={s.recordFilingMode === "review"}
        onPress={() => s.setRecordFilingMode("review")}
      />
      <Choice
        label="Safe items only"
        sub="Recommended prototype setting. Busy may file only into an existing customer when every strict trust rule passes."
        selected={s.recordFilingMode === "safe"}
        onPress={() => s.setRecordFilingMode("safe")}
      />

      <Card
        eyebrow="Safe means all of these"
        title="A deliberately narrow permission"
        body="Safe Autopilot is not general AI permission. It is a checklist. If any check fails, the item stays in Busy Inbox for you."
        tone="green"
      >
        <MetricRow left="Customer match" right="Exact phone / email" />
        <MetricRow left="Extraction" right="High confidence" />
        <MetricRow left="Service" right="Explicitly detected" />
        <MetricRow left="Active-work conflict" right="None" />
        <MetricRow left="Duplicate source" right="None" />
        <MetricRow left="Quote" right="Explicit date + value" />
        <MetricRow left="Booking" right="Explicit future date + time" />
        <MetricRow left="Completed job" right="Explicit non-future date" />
      </Card>

      <Card
        eyebrow="Still never automatic here"
        title="Record filing is not customer-facing authority"
        body="Safe Autopilot does not send a customer message, publish a post, approve advertising spend or invent missing information."
        footer="Those controls remain separate"
        tone="blue"
      />

      <Card
        eyebrow="More automatic"
        title="Not enabled in v2.1"
        body="Creating brand-new customers automatically, trusting name-only matches or filing through conflicts stays outside Safe Autopilot until we have stronger evidence and recovery controls."
        tone="amber"
      />

      <Button label="Save & open Busy Inbox" primary onPress={s.openBusyInbox} />
      <Button label="Done" onPress={s.back} />
    </Shell>
  );
}

function ConnectedAccounts({ s }) {
  return (
    <Shell s={s} title="Connected accounts" subtitle="Prototype toggles only — no real external account is connected yet.">
      <Card
        eyebrow="v2.1 trusted intake architecture"
        title="Future connections should feed Inbox, then use the same trust rules"
        body="Email, calendar, CRM and invoicing connections should create candidate items in Busy Inbox. Safe Autopilot may file only the narrow class of exact, high-confidence existing-customer updates you have allowed; exceptions stay for review."
        footer="No external inbox or account is being read in this prototype"
        tone="green"
      />
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
  backgroundWork: BackgroundWork,
  workHub: WorkHub,
  workPipeline: WorkPipeline,
  workNow: WorkNow,
  chooseGap: ChooseGap,
  bestMove: BestMove,
  customerRecords: CustomerRecords,
  customerDetail: CustomerDetail,
  jobCompletePhotos: JobCompletePhotos,
  jobPhotos: JobPhotos,
  jobPhotoOpportunity: JobPhotoOpportunity,
  jobPostDraft: JobPostDraft,
  jobPostApproval: JobPostApproval,
  jobPostPublished: JobPostPublished,
  jobPostOutcome: JobPostOutcome,
  staleEnquiries: StaleEnquiries,
  staleQuotes: StaleQuotes,
  enquiryFollowUp: EnquiryFollowUp,
  enquiryFollowUpSent: EnquiryFollowUpSent,
  enquiryFollowUpOutcome: EnquiryFollowUpOutcome,
  quoteFollowUp: QuoteFollowUp,
  quoteFollowUpSent: QuoteFollowUpSent,
  quoteFollowUpOutcome: QuoteFollowUpOutcome,
  reviewRequest: ReviewRequest,
  reviewRequestSent: ReviewRequestSent,
  reviewRequestOutcome: ReviewRequestOutcome,
  busyInbox: BusyInbox,
  autopilotFiled: AutopilotFiled,
  quickCapture: QuickCapture,
  quickCaptureReview: QuickCaptureReview,
  quickCaptureSaved: QuickCaptureSaved,
  intakeHistory: IntakeHistory,
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
  capacitySettings: CapacitySettings,
  businessData: BusinessData,
  howBusyWorks: HowBusyWorks,
  whatMakesDifferent: WhatMakesDifferent,
  settingsLimits: SettingsLimits,
  recordFilingSettings: RecordFilingSettings,
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
  opportunityTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  opportunityEyebrow: { flex: 1, minWidth: 0, marginBottom: 0 },
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
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  photoTile: { width: "31%", minWidth: 96, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  photoImage: { width: "100%", aspectRatio: 1, backgroundColor: "#E8ECF3" },
  photoRemove: { paddingVertical: 8, paddingHorizontal: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  photoRemoveText: { color: C.red, fontSize: 12, fontWeight: "800" },
  customerHistoryPhotoMeta: { color: C.green, fontSize: 12, fontWeight: "800", marginTop: 7 },
  customerHistoryPhotoLink: { alignSelf: "flex-start", paddingTop: 7, paddingBottom: 2 },
  customerHistoryPhotoLinkText: { color: C.blue, fontSize: 13, fontWeight: "800" },
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