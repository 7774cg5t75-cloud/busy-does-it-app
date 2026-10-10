import { syncWebsitePageModel } from "./websiteManagement";
import { designForWebsite, designCss } from "../../supabase/functions/busy-website-worker/designSystem.mjs";
import { planWebsiteDesign } from "../../supabase/functions/busy-website-worker/designPlanner.mjs";
import { reviewWebsiteDesign } from "../../supabase/functions/busy-website-worker/designReview.mjs";

function clean(value = "") {
  return String(value || "").trim();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function slugify(value = "") {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "business";
}

function escapeHtml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function themeFromBrief(brief = {}) {
  const visual = clean(brief.visualStyle).toLowerCase();
  const colours = safeArray(brief.colours).filter(Boolean);
  let mood = "clean";
  if (visual.includes("warm") || visual.includes("traditional")) mood = "warm";
  if (visual.includes("bold") || visual.includes("energetic")) mood = "bold";
  if (visual.includes("premium") || visual.includes("polished")) mood = "premium";

  return {
    mood,
    primary: colours[0] || "",
    secondary: colours[1] || "",
    layout: "multi-page-ready",
    heroSize: "large",
    spacing: "comfortable",
  };
}

function buildSections(brief = {}) {
  const sections = [];
  const serviceNames = safeArray(brief.services).map(s=>clean(s?.name)).filter(Boolean);
  const contactAvailable = !!(clean(brief.phone) || clean(brief.email));
  const area = clean(brief.serviceArea);
  const factualServiceSummary = [serviceNames.slice(0, 2).join(" • "), area ? "Serving " + area : ""].filter(Boolean).join(" — ");

  sections.push({
    id: "hero",
    type: "hero",
    enabled: true,
    title: clean(brief.businessName) || "Your business",
    body:
      clean(brief.tagline) ||
      clean(brief.description) ||
      factualServiceSummary ||
      clean(brief.businessType) ||
      "",
    cta: clean(brief.phone)
      ? "Call us"
      : clean(brief.email)
      ? "Get in touch"
      : safeArray(brief.services).length
      ? "See our services"
      : "",
    ctaHref:
      clean(brief.phone) || clean(brief.email)
        ? "#contact"
        : safeArray(brief.services).length
        ? "#services"
        : "",
    asset: brief.heroAsset || null,
  });

  if (safeArray(brief.services).length) {
    sections.push({
      id: "services",
      type: "services",
      enabled: true,
      title: "What we do",
      body: "",
      items: safeArray(brief.services).map((service) => ({
        id: service.id || slugify(service.name),
        title: clean(service.name),
        body: clean(service.description),
      })),
    });
  }

  if (clean(brief.about) || clean(brief.differentiators)) {
    sections.push({
      id: "about",
      type: "text",
      enabled: true,
      title: "About us",
      body: [clean(brief.about), clean(brief.differentiators)].filter(Boolean).join("\n\n"),
    });
  }

  if (safeArray(brief.photos).length) {
    sections.push({
      id: "gallery",
      type: "gallery",
      enabled: true,
      title: "Our work",
      body: "",
      items: safeArray(brief.photos).slice(0, 12),
    });
  }

  if (safeArray(brief.testimonials).length) {
    sections.push({
      id: "testimonials",
      type: "testimonials",
      enabled: true,
      title: "What customers say",
      body: "",
      items: safeArray(brief.testimonials).map((item) => ({
        id: item.id || slugify(item.attribution || item.text),
        title: clean(item.attribution),
        body: clean(item.text),
      })),
    });
  }

  if (safeArray(brief.faqs).length) {
    sections.push({
      id: "faq",
      type: "faq",
      enabled: true,
      title: "Frequently asked questions",
      body: "",
      items: safeArray(brief.faqs).map((item) => ({
        id: item.id || slugify(item.question),
        title: clean(item.question),
        body: clean(item.answer),
      })),
    });
  }

  if (contactAvailable || area) {
    sections.push({
      id: "contact",
      type: "contact",
      enabled: true,
      title: contactAvailable ? "Get in touch" : "Where we work",
      body: area ? "Serving " + area : "",
      phone: clean(brief.phone),
      email: clean(brief.email),
      openingHours: clean(brief.openingHours),
      social: brief.social || {},
    });
  }

  return sections;
}

function buildWebsiteDraft({ brandBrain = {}, previousDraft = null, businessCreationIntelligence = null } = {}) {
  const brief = brandBrain.websiteBrief || {};
  const now = new Date().toISOString();
  const sections = buildSections(brief);
  const draft = {
    id: previousDraft?.id || `website-${Date.now()}`,
    status: "Draft",
    publicStatus: "Not published",
    businessName: clean(brief.businessName),
    brandLabel: clean(brief.logoLabel).slice(0, 100) || clean(brief.businessName),
    businessType: clean(brief.businessType),
    serviceArea: clean(brief.serviceArea),
    description: clean(brief.description),
    slug: slugify(brief.businessName),
    generatedAt: previousDraft?.generatedAt || now,
    updatedAt: now,
    generation: Number(previousDraft?.generation || 0) + 1,
    sourceVersion: "Business Creation Intelligence V3.56",
    sharedBusinessProfile: businessCreationIntelligence
      ? {
          source: businessCreationIntelligence.source || "brand_brain_shared_business_profile",
          fingerprint: businessCreationIntelligence.sharedProfile?.fingerprint || "",
          recommendedSections: safeArray(
            businessCreationIntelligence.recommendedWebsiteSections
          ),
          ownerApprovalRequired:
            businessCreationIntelligence.ownerApprovalRequired !== false,
        }
      : null,
    theme: themeFromBrief(brief),
    sections,
    designPlan: planWebsiteDesign({businessType:brief.businessType,businessName:brief.businessName,sections,theme:themeFromBrief(brief)}),
    seo: {
      title: clean(brief.businessName)
        ? `${clean(brief.businessName)} | ${clean(brief.businessType) || "Local business"}`
        : "",
      description: clean(brief.description).slice(0, 160),
      pages: {},
      schemaType: "LocalBusiness",
    },
    readiness: {
      websiteReady: !!brandBrain.websiteReady,
      label: brandBrain.websiteReadinessLabel || "",
      missing: safeArray(brandBrain.missingForWebsite),
      identityScore: Number(brandBrain.completeness?.score || 0),
    },
    sourceSummary: {
      serviceCount: safeArray(brief.services).length,
      photoCount: safeArray(brief.photos).length,
      faqCount: safeArray(brief.faqs).length,
      testimonialCount: safeArray(brief.testimonials).length,
      hasPhone: !!clean(brief.phone),
      hasEmail: !!clean(brief.email),
      hasHero: !!brief.heroAsset,
    },
    publish: {
      enabled: false,
      provider: "",
      domain: clean(brief.existingDomain),
      lastPublishedAt: "",
    },
  };

  const modelled = syncWebsitePageModel(draft);
  return {
    ...modelled,
    designReview: reviewWebsiteDesign({draft:modelled}),
    html: renderWebsiteHtml(modelled),
  };
}

function sectionIndex(draft = {}, id = "") {
  return safeArray(draft.sections).findIndex((section) => section.id === id);
}

function withHtml(draft = {}) {
  const refreshed={...draft,designPlan:planWebsiteDesign({businessType:draft.businessType,businessName:draft.businessName,sections:draft.sections,theme:draft.theme})};
  const modelled = syncWebsitePageModel(refreshed);
  return {
    ...modelled,
    designReview: reviewWebsiteDesign({draft:modelled}),
    updatedAt: new Date().toISOString(),
    html: renderWebsiteHtml(modelled),
  };
}

/**
 * An explicit owner handoff from the V3.63 coordinated draft editor.
 * Updates ONLY the private website service copy. Publication still uses the
 * existing immutable hosted release and independent owner approval process.
 */
function applyCoordinatedWebsiteCopy({ draft = null, approved = {}, serviceName = "", text = "" } = {}) {
  const name = clean(serviceName).slice(0, 120);
  const body = clean(text).slice(0, 800);
  const allowed = safeArray(approved?.services).some((service) =>
    service?.approved !== false &&
    !["draft", "pending"].includes(String(service?.status || "").toLowerCase()) &&
    clean(service?.name).toLowerCase() === name.toLowerCase()
  );
  if (!draft?.id || !name || !body || !allowed) {
    return {applied: false, draft, reason: "An existing website draft, approved service and non-empty reviewed text are required."};
  }
  const index = sectionIndex(draft, "services");
  if (index < 0) {
    return {applied: false, draft, reason: "This website draft has no services section. Open the Website Builder to review its structure."};
  }
  const sections = safeArray(draft.sections).map((section, sectionIndexValue) => {
    if (sectionIndexValue !== index) return section;
    const items = safeArray(section.items).map((item) => ({...item}));
    const found = items.findIndex(item => clean(item.title).toLowerCase() === name.toLowerCase());
    const updated = {id: found >= 0 ? items[found].id : slugify(name), title: name, body};
    if (found >= 0) items[found] = {...items[found], ...updated};
    else items.push(updated);
    return {...section, items};
  });
  return {
    applied: true,
    draft: withHtml({...draft, sections}),
    reason: "Updated only the private website draft. Review the preview; nothing has gone live.",
  };
}

function applyWebsiteInstruction(draft = {}, instruction = "") {
  const text = clean(instruction);
  const lower = text.toLowerCase();
  if (!draft?.id || !text) {
    return { applied: false, reason: "No saved website draft or instruction.", draft };
  }

  let next = {
    ...draft,
    theme: { ...(draft.theme || {}) },
    sections: safeArray(draft.sections).map((section) => ({
      ...section,
      items: safeArray(section.items).map((item) => ({ ...item })),
    })),
  };
  let summary = "";

  const exactValue = (patterns) => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) return clean(match[1]).replace(/^["']|["']$/g, "");
    }
    return "";
  };

  const headline = exactValue([
    /(?:change|set) (?:the )?(?:homepage )?(?:headline|main heading) (?:to|as)\s+(.+)/i,
    /(?:make) (?:the )?(?:homepage )?(?:headline|main heading) (?:say|read)\s+(.+)/i,
  ]);
  const tagline = exactValue([
    /(?:change|set) (?:the )?(?:tagline|hero text) (?:to|as)\s+(.+)/i,
    /(?:make) (?:the )?(?:tagline|hero text) (?:say|read)\s+(.+)/i,
  ]);
  const phone = exactValue([
    /(?:change|set|update) (?:the )?(?:phone|phone number|telephone) (?:to|as)\s+(.+)/i,
  ]);
  const email = exactValue([
    /(?:change|set|update) (?:the )?(?:email|email address) (?:to|as)\s+([^\s]+@[^\s]+)/i,
  ]);
  const openingHours = exactValue([
    /(?:change|set|update) (?:the )?(?:opening hours|hours) (?:to|as)\s+(.+)/i,
  ]);
  const addService = exactValue([
    /(?:add|include) (?:a |the )?(?:service called |service )(.+)/i,
  ]);
  const removeService = exactValue([
    /(?:remove|delete|hide) (?:the )?(.+?) (?:service|from services)$/i,
  ]);
  const emphasiseService = exactValue([
    /(?:put|move) (?:the )?(.+?) (?:service )?(?:first|at the top)(?: of services)?$/i,
    /(?:emphasise|highlight|feature) (?:the )?(.+?) (?:service )?first$/i,
  ]);

  const heroIndex = sectionIndex(next, "hero");
  const contactIndex = sectionIndex(next, "contact");
  const servicesIndex = sectionIndex(next, "services");

  if (headline && heroIndex >= 0) {
    next.sections[heroIndex] = { ...next.sections[heroIndex], title: headline };
    summary = "Updated the homepage headline exactly as requested.";
  } else if (tagline && heroIndex >= 0) {
    next.sections[heroIndex] = { ...next.sections[heroIndex], body: tagline };
    summary = "Updated the hero wording exactly as requested.";
  } else if (phone && contactIndex >= 0) {
    next.sections[contactIndex] = { ...next.sections[contactIndex], phone };
    summary = "Updated the public phone number.";
  } else if (email && contactIndex >= 0) {
    next.sections[contactIndex] = { ...next.sections[contactIndex], email };
    summary = "Updated the public email address.";
  } else if (openingHours && contactIndex >= 0) {
    next.sections[contactIndex] = { ...next.sections[contactIndex], openingHours };
    summary = "Updated the public opening hours.";
  } else if (removeService && servicesIndex >= 0) {
    const needle = removeService.toLowerCase().replace(/\s+/g, " ");
    const before = safeArray(next.sections[servicesIndex].items);
    const kept = before.filter((item) => {
      const title = clean(item.title).toLowerCase().replace(/\s+/g, " ");
      return !(title === needle || title.includes(needle) || needle.includes(title));
    });
    if (kept.length < before.length) {
      next.sections[servicesIndex] = { ...next.sections[servicesIndex], items: kept };
      summary = `Removed ${removeService} from the website services.`;
    }
  } else if (addService && servicesIndex >= 0) {
    const items = safeArray(next.sections[servicesIndex].items);
    const exists = items.some(
      (item) => clean(item.title).toLowerCase() === addService.toLowerCase()
    );
    if (!exists) {
      next.sections[servicesIndex] = {
        ...next.sections[servicesIndex],
        items: [
          ...items,
          { id: slugify(addService), title: addService, body: "" },
        ],
      };
      summary = `Added ${addService} as a website service. BUSY did not invent a description.`;
    }
  } else if (emphasiseService && servicesIndex >= 0) {
    const items = safeArray(next.sections[servicesIndex].items);
    const needle = emphasiseService.toLowerCase();
    const index = items.findIndex((item) =>
      clean(item.title).toLowerCase().includes(needle)
    );
    if (index >= 0) {
      const chosen = items[index];
      next.sections[servicesIndex] = {
        ...next.sections[servicesIndex],
        items: [chosen, ...items.filter((_, itemIndex) => itemIndex !== index)],
      };
      summary = `Moved ${chosen.title} to the top of the services list.`;
    }
  } else if (/make (it |the site |website )?(more )?(premium|polished|luxury)/i.test(text)) {
    next.theme.mood = "premium";
    next.theme.spacing = "generous";
    summary = "Made the website feel more premium and spacious.";
  } else if (/make (it |the site |website )?(more )?(warm|friendly|welcoming)/i.test(text)) {
    next.theme.mood = "warm";
    summary = "Made the website feel warmer and more welcoming.";
  } else if (/make (it |the site |website )?(more )?(bold|energetic|punchy)/i.test(text)) {
    next.theme.mood = "bold";
    summary = "Made the website feel bolder and more energetic.";
  } else if (/make (it |the site |website )?(more )?(clean|simple|minimal)/i.test(text)) {
    next.theme.mood = "clean";
    summary = "Simplified the visual direction.";
  } else if (/hero|main photo|first photo/i.test(lower) && /(bigger|larger|more prominent|prominent)/i.test(lower)) {
    next.theme.heroSize = "extra-large";
    summary = "Made the main hero image more prominent.";
  } else if (/hero|main photo|first photo/i.test(lower) && /(smaller|less prominent)/i.test(lower)) {
    next.theme.heroSize = "medium";
    summary = "Reduced the prominence of the main hero image.";
  } else if (/hide|remove|take out/i.test(lower)) {
    const ids = [
      ["services", /service/],
      ["about", /about|story/],
      ["gallery", /gallery|photo/],
      ["testimonials", /testimonial|review/],
      ["faq", /faq|question/],
      ["contact", /contact/],
    ];
    const match = ids.find(([, regex]) => regex.test(lower));
    if (match) {
      next.sections = next.sections.map((section) =>
        section.id === match[0] ? { ...section, enabled: false } : section
      );
      summary = `Hid the ${match[0]} section from the website draft.`;
    }
  } else if (/show|add back|bring back|restore/i.test(lower)) {
    const ids = [
      ["services", /service/],
      ["about", /about|story/],
      ["gallery", /gallery|photo/],
      ["testimonials", /testimonial|review/],
      ["faq", /faq|question/],
      ["contact", /contact/],
    ];
    const match = ids.find(([, regex]) => regex.test(lower));
    if (match && sectionIndex(next, match[0]) >= 0) {
      next.sections = next.sections.map((section) =>
        section.id === match[0] ? { ...section, enabled: true } : section
      );
      summary = `Restored the ${match[0]} section.`;
    }
  }

  if (!summary) {
    const vagueSeasonal = /winter|summer|spring|autumn|seasonal|christmas|easter/i.test(lower);
    return {
      applied: false,
      reason: vagueSeasonal
        ? "BUSY can prepare seasonal website changes, but it needs a specific approved fact or existing service to emphasise. It will not invent seasonal services, prices or claims."
        : "BUSY understood this as a website request, but the safe editor only applies supported exact wording, contact, service, layout and visibility changes automatically. Unsupported public copy is not guessed.",
      draft,
    };
  }

  next = withHtml(next);
  return { applied: true, reason: summary, draft: next };
}

function renderWebsiteHtml(draft = {}) {
  const sections = safeArray(draft.sections).filter(section => section?.enabled !== false);
  const plan = draft.designPlan || planWebsiteDesign({businessType:draft.businessType,businessName:draft.businessName,sections,theme:draft.theme});
  const design = designForWebsite({businessType:draft.businessType,theme:draft.theme,plan});
  const layoutCss = designCss(design);
  const identity = plan?.visualIdentity || {};
  const classes = [
    "visual-hero-" + (identity.heroLayout || "type-left"),
    "visual-cards-" + (identity.cardLayout || "cards"),
    "visual-ornament-" + (identity.ornament || "ripple"),
    "visual-nav-" + (identity.navStyle || "quiet"),
    "visual-type-" + (identity.typography || "confident"),
  ].join(" ");
  // This is the editable concept HTML, not the signed hosted deployment.
  // Both use the same tested professional responsive styles and layout rules.
  const hero=sections.find(section=>section.type==="hero");
  const phone=sections.find(section=>section.type==="contact")?.phone||"";
  const email=sections.find(section=>section.type==="contact")?.email||"";
  const approvedImage = asset => {
    const uri=String(asset?.uri||"").trim();
    return /^https:\/\/[^\s"'<>]+$/i.test(uri) ? uri : "";
  };
  const orderedSections=plan.sectionOrder.map(id=>sections.find(s=>s.id===id)).filter(Boolean);
  const sectionHtml = orderedSections.map(section=>{
    if(section.type==="hero"){
      const url=approvedImage(section.asset);
      const art=url
        ? `<img class="hero-image" src="${escapeHtml(url)}" alt="${escapeHtml(draft.businessName||"Business photograph")}">`
        : '<div class="hero-art" aria-hidden="true"></div>';
      const kicker=clean(draft.businessType||draft.businessName);
      const lead=clean(section.body) ? `<p class="lead">${escapeHtml(section.body)}</p>` : "";
      const action=clean(section.cta)&&clean(section.ctaHref)
        ? `<a class="cta" href="${escapeHtml(section.ctaHref)}">${escapeHtml(section.cta)}</a>` : "";
      return `<section class="hero hero-${escapeHtml(draft.theme?.heroSize||"large")} ${url?"hero-with-image":"hero-no-image"}"><div class="wrap"><div class="hero-content">${kicker?`<p class="kicker">${escapeHtml(kicker)}</p>`:""}<h1>${escapeHtml(section.title||draft.businessName||"Your business")}</h1>${lead}${action}</div>${art}</div></section>`;
    }
    if(section.type==="services"||section.type==="faq"||section.type==="testimonials"){
      const items=safeArray(section.items).filter(item=>clean(item?.title||item?.body));
      if(!items.length)return "";
      return `<section id="${escapeHtml(section.id)}"><div class="wrap"><h2>${escapeHtml(section.title)}</h2><div class="grid">${items.map(item=>`<article><h3>${escapeHtml(item.title)}</h3>${clean(item.body)?`<p>${escapeHtml(item.body)}</p>`:""}</article>`).join("")}</div></div></section>`;
    }
    if(section.type==="gallery"){
      const images=safeArray(section.items).map(approvedImage).filter(Boolean);
      return images.length ? `<section id="gallery"><div class="wrap"><h2>${escapeHtml(section.title)}</h2><div class="gallery">${images.map(url=>`<img class="gallery-image" loading="lazy" src="${escapeHtml(url)}" alt="Customer-supplied photograph">`).join("")}</div></div></section>` : "";
    }
    if(section.type==="contact"){
      if(!clean(section.body)&&!clean(phone)&&!clean(email))return "";
      return `<section id="contact"><div class="wrap"><h2>${escapeHtml(section.title||"Get in touch")}</h2>${clean(section.body)?`<p>${escapeHtml(section.body)}</p>`:""}${clean(phone)?`<p><a href="tel:${escapeHtml(phone.replace(/\s+/g,""))}">${escapeHtml(phone)}</a></p>`:""}${clean(email)?`<p><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>`:""}${clean(section.openingHours)?`<p>${escapeHtml(section.openingHours)}</p>`:""}</div></section>`;
    }
    return clean(section.body)
      ? `<section id="${escapeHtml(section.id)}"><div class="wrap"><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.body).replace(/\n/g,"<br>")}</p></div></section>`
      : "";
  }).join("");
  const business=escapeHtml(draft.businessName||"Business website");
  const area=clean(draft.serviceArea);
  const nav=safeArray(draft.navigation)
    .filter(item=>item?.id&&item?.label)
    .map(item=>`<a href="#${escapeHtml(item.id)}">${escapeHtml(item.label)}</a>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(draft.seo?.title||draft.businessName||"Website")}</title><meta name="description" content="${escapeHtml(draft.seo?.description||"")}"><style>${layoutCss}</style></head><body class="mood-${design.mood} sector-${design.sector} family-${plan.family} tier-${plan.contentTier} architecture-${plan.architecture} ${classes}"><a class="skip-link" href="#main">Skip to content</a><nav><div class="wrap nav-wrap"><a class="brand" href="#main">${escapeHtml(draft.brandLabel||draft.businessName||"Business website")}</a><div class="nav-links">${nav}</div></div></nav><main id="main">${sectionHtml}</main><footer class="site-footer"><div class="wrap"><strong>${business}</strong>${area?`<span>${escapeHtml(area)}</span>`:""}</div></footer></body></html>`;
}

export {
  buildWebsiteDraft,
  applyWebsiteInstruction,
  applyCoordinatedWebsiteCopy,
  renderWebsiteHtml,
};
