function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function clean(value = "") {
  return String(value || "").trim();
}

function stableFingerprint(parts = []) {
  const input = parts.map((value) => clean(value)).join("|");
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `bci-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function businessSignals(brandBrain = {}) {
  const brief = brandBrain?.websiteBrief || {};
  const businessType = clean(brief.businessType).toLowerCase();
  const serviceNames = safeArray(brief.services)
    .map((item) => clean(item?.name).toLowerCase())
    .filter(Boolean);
  const corpus = [businessType, ...serviceNames].join(" ");

  return {
    appointmentLed: /hair|barber|beauty|salon|therap|clinic|coach|tutor|lesson|appointment|consult/.test(corpus),
    tradeLed: /clean|window|roof|driveway|garden|landscap|plumb|electric|build|decorat|repair|install|maintenance|trade/.test(corpus),
    foodLed: /food|cafe|coffee|restaurant|cater|bakery|roast|takeaway|street food/.test(corpus),
    retailLed: /shop|retail|store|boutique|product|gift|florist/.test(corpus),
    eventLed: /event|festival|wedding|party|entertain|hire/.test(corpus),
  };
}

function buildSharedBusinessProfile(brandBrain = {}) {
  const brief = brandBrain?.websiteBrief || {};
  const services = safeArray(brief.services).map((service) => ({
    id: clean(service?.id),
    name: clean(service?.name),
    description: clean(service?.description),
    typicalValue: Number(service?.typicalValue || 0),
    durationHours: Number(service?.durationHours || 0),
  }));

  const profile = {
    businessName: clean(brief.businessName),
    businessType: clean(brief.businessType),
    tagline: clean(brief.tagline),
    description: clean(brief.description),
    about: clean(brief.about),
    differentiators: clean(brief.differentiators),
    serviceArea: clean(brief.serviceArea),
    phone: clean(brief.phone),
    email: clean(brief.email),
    openingHours: clean(brief.openingHours),
    services,
    photos: safeArray(brief.photos).slice(0, 24),
    faqs: safeArray(brief.faqs).slice(0, 12),
    testimonials: safeArray(brief.testimonials).slice(0, 12),
    social: {
      facebook: clean(brief.social?.facebook),
      instagram: clean(brief.social?.instagram),
    },
    theme: {
      mood: clean(brief.visualStyle),
      primary: clean(brief.colours?.[0]),
      secondary: clean(brief.colours?.[1]),
    },
  };

  return {
    ...profile,
    fingerprint: stableFingerprint([
      profile.businessName,
      profile.businessType,
      profile.tagline,
      profile.description,
      profile.serviceArea,
      profile.phone,
      profile.email,
      profile.openingHours,
      services.map((item) => `${item.id}:${item.name}:${item.description}`).join(","),
      profile.photos.map((item) => clean(item?.key || item?.storagePath)).join(","),
    ]),
  };
}

function recommendBusinessModules(brandBrain = {}) {
  const profile = buildSharedBusinessProfile(brandBrain);
  const signals = businessSignals(brandBrain);
  const hasServices = profile.services.length > 0;
  const hasPhotos = profile.photos.length > 0;
  const hasContact = !!(profile.phone || profile.email);

  const app = [
    {
      key: "business_profile",
      recommended: true,
      reason: "The approved business identity is the shared source of truth.",
    },
    {
      key: "services",
      recommended: hasServices,
      reason: hasServices
        ? "BUSY already has approved services to show customers."
        : "Add approved services before exposing a service list.",
    },
    {
      key: "gallery",
      recommended: hasPhotos,
      reason: hasPhotos
        ? "Approved business photos are already available."
        : "Keep gallery off until approved imagery exists.",
    },
    {
      key: "contact",
      recommended: hasContact,
      reason: hasContact
        ? "A verified contact route is already recorded."
        : "Keep contact private until a phone number or email is approved.",
    },
    {
      key: "enquiry",
      recommended: true,
      reason: "A controlled enquiry route suits almost every small business and feeds BUSY workflows.",
    },
    {
      key: "booking_request",
      recommended: hasServices && (signals.appointmentLed || signals.tradeLed || signals.eventLed),
      reason:
        hasServices && (signals.appointmentLed || signals.tradeLed || signals.eventLed)
          ? "This business is service-led, so customer date/service requests are useful while the owner keeps final approval."
          : "BUSY should only add booking requests when they fit the operating model.",
    },
    {
      key: "offers",
      recommended: false,
      reason: "Offers should only be enabled from an explicit owner-approved offer.",
    },
    {
      key: "loyalty",
      recommended: signals.foodLed || signals.retailLed || signals.appointmentLed,
      reason:
        signals.foodLed || signals.retailLed || signals.appointmentLed
          ? "Repeat visits are plausible for this business type, so BUSY can suggest loyalty without inventing a reward."
          : "Loyalty stays optional unless repeat-visit behaviour or an owner request supports it.",
    },
    {
      key: "payments",
      recommended: false,
      reason: "Payments remain a controlled future module and are never auto-enabled.",
    },
  ];

  const website = [
    { key: "hero", recommended: true, reason: "Lead with the approved business identity." },
    { key: "services", recommended: hasServices, reason: "Use the same approved service list as the Business App." },
    { key: "gallery", recommended: hasPhotos, reason: "Use only approved business imagery." },
    {
      key: "testimonials",
      recommended: profile.testimonials.length > 0,
      reason: "Only approved testimonials should be published.",
    },
    {
      key: "faq",
      recommended: profile.faqs.length > 0,
      reason: "Reuse approved FAQs rather than generating unsupported claims.",
    },
    { key: "contact", recommended: hasContact, reason: "Reuse the same approved contact routes everywhere." },
  ];

  return { app, website, signals };
}

function buildBusinessCreationIntelligence({
  brandBrain = {},
  websiteDraft = null,
  miniAppsView = null,
} = {}) {
  const sharedProfile = buildSharedBusinessProfile(brandBrain);
  const recommendations = recommendBusinessModules(brandBrain);
  const alignment = [];

  const websiteName = clean(websiteDraft?.businessName);
  const appName = clean(miniAppsView?.displayName);
  if (websiteName && sharedProfile.businessName && websiteName !== sharedProfile.businessName) {
    alignment.push({
      id: "website-name-drift",
      severity: "review",
      message: "The website draft name differs from the current shared business profile.",
    });
  }
  if (
    miniAppsView?.hasDraft &&
    appName &&
    sharedProfile.businessName &&
    appName !== sharedProfile.businessName &&
    appName !== "BUSY Business App"
  ) {
    alignment.push({
      id: "app-name-drift",
      severity: "review",
      message: "The Business App display name differs from the current shared business profile.",
    });
  }

  const recommendedAppModules = recommendations.app
    .filter((item) => item.recommended)
    .map((item) => item.key);
  const recommendedWebsiteSections = recommendations.website
    .filter((item) => item.recommended)
    .map((item) => item.key);

  return {
    schemaVersion: 1,
    source: "brand_brain_shared_business_profile",
    sharedProfile,
    recommendations,
    recommendedAppModules,
    recommendedWebsiteSections,
    alignment,
    aligned: alignment.length === 0,
    approvalPolicy: "owner_preview_required_before_public_change",
    ownerApprovalRequired: true,
  };
}

export {
  buildSharedBusinessProfile,
  recommendBusinessModules,
  buildBusinessCreationIntelligence,
};
