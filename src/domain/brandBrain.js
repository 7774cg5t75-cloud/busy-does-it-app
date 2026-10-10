function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function clean(value = "") {
  return String(value || "").trim();
}

function lower(value = "") {
  return clean(value).toLowerCase();
}

function uniqueBy(rows = [], keyFn = (item) => item) {
  const seen = new Set();
  return rows.filter((item) => {
    const key = keyFn(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function publicPhotoLibrary(customers = [], socialDrafts = []) {
  const jobPhotos = [];
  safeArray(customers).forEach((customer) => {
    safeArray(customer.history).forEach((job) => {
      if (job.kind && job.kind !== "job") return;
      safeArray(job.photos)
        .filter((photo) => !!photo.marketingOk)
        .forEach((photo, index) => {
          jobPhotos.push({
            key: `job:${customer.id}:${job.id || job.date || index}:${photo.id || index}`,
            source: "Completed job",
            customerId: customer.id,
            jobId: job.id || "",
            service: job.service || customer.service || "",
            uri: photo.uri || "",
            storagePath: photo.storagePath || "",
            fileName: photo.fileName || "",
            width: Number(photo.width || 0),
            height: Number(photo.height || 0),
            marketingOk: true,
            websiteSuitable: true,
          });
        });
    });
  });

  const socialPhotos = [];
  safeArray(socialDrafts).forEach((draft) => {
    safeArray(draft.cloudMedia).forEach((media, index) => {
      socialPhotos.push({
        key: `social:${draft.id || index}:${media.id || index}`,
        source: "Social media",
        customerId: draft.sourceCustomerId || "",
        jobId: draft.sourceJobId || "",
        service: draft.service || "",
        uri: "",
        storagePath: media.storagePath || "",
        fileName: media.fileName || "",
        width: Number(media.width || 0),
        height: Number(media.height || 0),
        marketingOk: true,
        websiteSuitable: true,
      });
    });
  });

  return uniqueBy([...jobPhotos, ...socialPhotos], (item) =>
    item.storagePath || item.uri || item.key
  );
}

function serviceRows(services = [], serviceDescriptions = {}) {
  return safeArray(services).map((service) => ({
    id: service.id || clean(service.name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: clean(service.name) || "Service",
    value: Number(service.value || 0),
    durationHours: Number(service.durationHours || 0),
    repeatMonths:
      service.repeatMonths === null || service.repeatMonths === undefined
        ? null
        : Number(service.repeatMonths),
    wanted: !!service.wanted,
    description: clean(serviceDescriptions?.[service.id] || ""),
  }));
}

function buildConsistencyChecks({
  businessName = "",
  trade = "",
  postcode = "",
  radius = "",
  services = [],
  profile = {},
  connectedAccounts = {},
} = {}) {
  const checks = [];
  const add = (id, severity, title, body) =>
    checks.push({ id, severity, title, body });

  if (!clean(businessName)) {
    add("business-name", "High", "Business name is missing", "Public content needs one authoritative trading name.");
  }
  if (!clean(trade)) {
    add("trade", "High", "Trade / business type is missing", "BUSY needs a clear category before it can describe the business accurately.");
  }
  if (!clean(postcode) && !clean(profile.serviceAreaText)) {
    add("service-area", "High", "Service area is unclear", "Record either a base postcode or a plain-English service area.");
  }
  if (!safeArray(services).length) {
    add("services", "High", "No services are saved", "The existing BUSY services list is the source of truth for website and public service content.");
  }
  if (safeArray(services).some((service) => !clean(service.name))) {
    add("service-names", "High", "A service has no usable name", "Every service needs a clear public-facing name.");
  }
  if (!clean(profile.phone) && !clean(profile.email)) {
    add("contact-route", "High", "No public contact route is recorded", "Add at least a phone number or email address before publishing a website.");
  }
  if (connectedAccounts?.meta && !clean(profile.facebookUrl) && !clean(profile.instagramUrl)) {
    add("meta-link", "Review", "Meta is connected but no public social link is saved", "The connection can publish, but Brand Brain does not yet know which public profile link belongs on a website.");
  }
  if (connectedAccounts?.googleBusiness && !clean(profile.publicDescription)) {
    add("google-description", "Review", "Google Business is connected but the public description is empty", "A shared authoritative business description helps avoid inconsistent public wording.");
  }
  if (clean(profile.websiteDomain) && /\s/.test(profile.websiteDomain)) {
    add("domain-format", "Review", "Website/domain contains spaces", "Check the domain before using it as a public identity field.");
  }
  if (Number(radius || 0) > 0 && clean(profile.serviceAreaText) && !clean(postcode)) {
    add("radius-base", "Review", "Radius is set without a base postcode", "A mileage radius is clearer when BUSY also knows the business base area.");
  }

  return checks;
}

function buildCompleteness({
  businessName = "",
  trade = "",
  postcode = "",
  services = [],
  profile = {},
  photoLibrary = [],
} = {}) {
  const serviceDescriptions = profile.serviceDescriptions || {};
  const rows = serviceRows(services, serviceDescriptions);
  const describedServices = rows.filter((service) => service.description).length;
  const serviceDescriptionReady =
    !rows.length || describedServices >= Math.min(rows.length, 3);

  const items = [
    ["businessName", "Business name", !!clean(businessName), true],
    ["trade", "Business type", !!clean(trade), true],
    ["serviceArea", "Service area", !!(clean(profile.serviceAreaText) || clean(postcode)), true],
    ["contact", "Phone or email", !!(clean(profile.phone) || clean(profile.email)), true],
    ["services", "Services", rows.length > 0, true],
    ["description", "Public description", !!clean(profile.publicDescription), true],
    ["tone", "Tone of voice", !!clean(profile.toneOfVoice), false],
    ["visual", "Visual style", !!clean(profile.visualStyle), false],
    ["story", "Business story", !!clean(profile.story), false],
    ["difference", "Differentiators", !!clean(profile.differentiators), false],
    ["hours", "Opening / contact hours", !!clean(profile.openingHours), false],
    ["serviceCopy", "Service descriptions", serviceDescriptionReady, false],
    ["faqs", "FAQs", safeArray(profile.faqs).length > 0, false],
    ["testimonials", "Approved testimonials", safeArray(profile.testimonials).length > 0, false],
    ["photos", "Website-suitable photos", safeArray(photoLibrary).length > 0, false],
    ["tagline", "Tagline / short promise", !!clean(profile.tagline), false],
  ].map(([id, label, complete, core]) => ({
    id,
    label,
    complete: !!complete,
    core: !!core,
  }));

  const complete = items.filter((item) => item.complete).length;
  const coreMissing = items.filter((item) => item.core && !item.complete);
  const score = Math.round((complete / items.length) * 100);

  return {
    score,
    items,
    complete,
    total: items.length,
    missing: items.filter((item) => !item.complete),
    coreMissing,
    websiteReady:
      coreMissing.length === 0 && score >= 70,
    label:
      coreMissing.length > 0
        ? "Core information missing"
        : score >= 85
        ? "Strong website foundation"
        : score >= 70
        ? "Ready for first website draft"
        : "Brand profile still thin",
  };
}

function buildBrandBrain({
  businessName = "",
  trade = "",
  verticalLabel = "",
  postcode = "",
  radius = "",
  services = [],
  brandProfile = {},
  customers = [],
  socialDrafts = [],
  connectedAccounts = {},
} = {}) {
  const profile = {
    publicDescription: clean(brandProfile.publicDescription),
    tagline: clean(brandProfile.tagline),
    serviceAreaText: clean(brandProfile.serviceAreaText),
    phone: clean(brandProfile.phone),
    email: clean(brandProfile.email),
    openingHours: clean(brandProfile.openingHours),
    websiteDomain: clean(brandProfile.websiteDomain),
    facebookUrl: clean(brandProfile.facebookUrl),
    instagramUrl: clean(brandProfile.instagramUrl),
    toneOfVoice: clean(brandProfile.toneOfVoice),
    visualStyle: clean(brandProfile.visualStyle),
    primaryColour: clean(brandProfile.primaryColour),
    secondaryColour: clean(brandProfile.secondaryColour),
    story: clean(brandProfile.story),
    differentiators: clean(brandProfile.differentiators),
    logoLabel: clean(brandProfile.logoLabel),
    heroAssetKey: clean(brandProfile.heroAssetKey),
    serviceDescriptions:
      brandProfile.serviceDescriptions && typeof brandProfile.serviceDescriptions === "object"
        ? brandProfile.serviceDescriptions
        : {},
    faqs: safeArray(brandProfile.faqs)
      .filter((item) => clean(item?.question) && clean(item?.answer))
      .slice(0, 12),
    testimonials: safeArray(brandProfile.testimonials)
      .filter((item) => clean(item?.text) && item?.approvedForPublicUse === true)
      .slice(0, 12),
  };

  const photos = publicPhotoLibrary(customers, socialDrafts);
  const hero =
    photos.find((photo) => photo.key === profile.heroAssetKey) ||
    photos[0] ||
    null;
  const serviceMaster = serviceRows(services, profile.serviceDescriptions);
  const checks = buildConsistencyChecks({
    businessName,
    trade,
    postcode,
    radius,
    services: serviceMaster,
    profile,
    connectedAccounts,
  });
  const completeness = buildCompleteness({
    businessName,
    trade,
    postcode,
    services: serviceMaster,
    profile,
    photoLibrary: photos,
  });

  const coreChecks = checks.filter((item) => item.severity === "High");
  const websiteReady =
    completeness.websiteReady && coreChecks.length === 0;

  const websiteBrief = {
    businessName: clean(businessName),
    businessType: clean(trade) || clean(verticalLabel),
    tagline: profile.tagline,
    logoLabel: profile.logoLabel,
    description: profile.publicDescription,
    about: profile.story,
    differentiators: profile.differentiators,
    serviceArea:
      profile.serviceAreaText ||
      [clean(postcode), Number(radius || 0) > 0 ? `${Number(radius)} mile radius` : ""]
        .filter(Boolean)
        .join(" • "),
    phone: profile.phone,
    email: profile.email,
    openingHours: profile.openingHours,
    services: serviceMaster.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      typicalValue: service.value,
      durationHours: service.durationHours,
    })),
    toneOfVoice: profile.toneOfVoice,
    visualStyle: profile.visualStyle,
    colours: [profile.primaryColour, profile.secondaryColour].filter(Boolean),
    heroAsset: hero
      ? {
          key: hero.key,
          source: hero.source,
          service: hero.service,
          uri: hero.uri,
          storagePath: hero.storagePath,
        }
      : null,
    photos: photos.slice(0, 20).map((photo) => ({
      key: photo.key,
      source: photo.source,
      service: photo.service,
      uri: photo.uri,
      storagePath: photo.storagePath,
    })),
    faqs: profile.faqs,
    testimonials: profile.testimonials,
    social: {
      facebook: profile.facebookUrl,
      instagram: profile.instagramUrl,
    },
    existingDomain: profile.websiteDomain,
  };

  const missingForWebsite = [
    ...completeness.coreMissing.map((item) => item.label),
    ...coreChecks.map((item) => item.title),
  ].filter((value, index, arr) => arr.indexOf(value) === index);

  return {
    profile,
    serviceMaster,
    photoLibrary: photos,
    heroAsset: hero,
    checks,
    highCheckCount: coreChecks.length,
    reviewCheckCount: checks.filter((item) => item.severity !== "High").length,
    completeness,
    websiteReady,
    websiteReadinessLabel: websiteReady
      ? "Ready for V3.35 website generation"
      : missingForWebsite.length
      ? `Needs ${missingForWebsite.length} core item${missingForWebsite.length === 1 ? "" : "s"}`
      : completeness.label,
    missingForWebsite,
    websiteBrief,
    summary: {
      serviceCount: serviceMaster.length,
      describedServiceCount: serviceMaster.filter((service) => service.description).length,
      photoCount: photos.length,
      faqCount: profile.faqs.length,
      testimonialCount: profile.testimonials.length,
      publicContactRoutes: [profile.phone, profile.email].filter(Boolean).length,
      socialLinkCount: [profile.facebookUrl, profile.instagramUrl].filter(Boolean).length,
    },
  };
}

export { buildBrandBrain };
