import { syncWebsitePageModel } from "./websiteManagement";

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

  sections.push({
    id: "hero",
    type: "hero",
    enabled: true,
    title: clean(brief.businessName) || "Your business",
    body:
      clean(brief.tagline) ||
      clean(brief.description) ||
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

  sections.push({
    id: "contact",
    type: "contact",
    enabled: true,
    title: "Get in touch",
    body: clean(brief.serviceArea)
      ? `Serving ${clean(brief.serviceArea)}`
      : "",
    phone: clean(brief.phone),
    email: clean(brief.email),
    openingHours: clean(brief.openingHours),
    social: brief.social || {},
  });

  return sections;
}

function buildWebsiteDraft({ brandBrain = {}, previousDraft = null } = {}) {
  const brief = brandBrain.websiteBrief || {};
  const now = new Date().toISOString();
  const sections = buildSections(brief);
  const draft = {
    id: previousDraft?.id || `website-${Date.now()}`,
    status: "Draft",
    publicStatus: "Not published",
    businessName: clean(brief.businessName),
    businessType: clean(brief.businessType),
    serviceArea: clean(brief.serviceArea),
    description: clean(brief.description),
    slug: slugify(brief.businessName),
    generatedAt: previousDraft?.generatedAt || now,
    updatedAt: now,
    generation: Number(previousDraft?.generation || 0) + 1,
    sourceVersion: "Brand Brain V3.34+",
    theme: themeFromBrief(brief),
    sections,
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
    html: renderWebsiteHtml(modelled),
  };
}

function sectionIndex(draft = {}, id = "") {
  return safeArray(draft.sections).findIndex((section) => section.id === id);
}

function withHtml(draft = {}) {
  const modelled = syncWebsitePageModel(draft);
  return {
    ...modelled,
    updatedAt: new Date().toISOString(),
    html: renderWebsiteHtml(modelled),
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

  if (/make (it |the site |website )?(more )?(premium|polished|luxury)/i.test(text)) {
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
    return {
      applied: false,
      reason:
        "BUSY understood this as a website request, but this safe editor only applies supported layout/style/section changes automatically. The wording request can stay in the conversation for a richer editing pass.",
      draft,
    };
  }

  next = withHtml(next);
  return { applied: true, reason: summary, draft: next };
}

function renderWebsiteHtml(draft = {}) {
  const sections = safeArray(draft.sections).filter((section) => section.enabled !== false);
  const theme = draft.theme || {};
  const moodClass = escapeHtml(theme.mood || "clean");
  const primary = clean(theme.primary);
  const secondary = clean(theme.secondary);
  const cssVars = [
    primary ? `--brand-primary:${escapeHtml(primary)};` : "",
    secondary ? `--brand-secondary:${escapeHtml(secondary)};` : "",
  ].filter(Boolean).join("");

  const sectionHtml = sections.map((section) => {
    if (section.type === "hero") {
      return `<section class="hero hero-${escapeHtml(theme.heroSize || "large")}"><div class="wrap"><p class="kicker">${escapeHtml(draft.businessName)}</p><h1>${escapeHtml(section.title)}</h1><p>${escapeHtml(section.body)}</p>${section.cta && section.ctaHref ? `<a class="cta" href="${escapeHtml(section.ctaHref)}">${escapeHtml(section.cta)}</a>` : ""}</div></section>`;
    }
    if (section.type === "services") {
      return `<section id="services"><div class="wrap"><h2>${escapeHtml(section.title)}</h2><div class="grid">${safeArray(section.items).map((item) => `<article><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p></article>`).join("")}</div></div></section>`;
    }
    if (section.type === "gallery") {
      return `<section id="gallery"><div class="wrap"><h2>${escapeHtml(section.title)}</h2><p>${safeArray(section.items).length} approved business image${safeArray(section.items).length === 1 ? "" : "s"} selected for this draft.</p></div></section>`;
    }
    if (section.type === "testimonials" || section.type === "faq") {
      return `<section id="${escapeHtml(section.id)}"><div class="wrap"><h2>${escapeHtml(section.title)}</h2>${safeArray(section.items).map((item) => `<article><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p></article>`).join("")}</div></section>`;
    }
    if (section.type === "contact") {
      return `<section id="contact"><div class="wrap"><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.body)}</p>${section.phone ? `<p>Phone: ${escapeHtml(section.phone)}</p>` : ""}${section.email ? `<p>Email: ${escapeHtml(section.email)}</p>` : ""}${section.openingHours ? `<p>${escapeHtml(section.openingHours)}</p>` : ""}</div></section>`;
    }
    return `<section id="${escapeHtml(section.id)}"><div class="wrap"><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.body).replace(/\n/g, "<br>")}</p></div></section>`;
  }).join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(draft.seo?.title || draft.businessName || "Website")}</title><meta name="description" content="${escapeHtml(draft.seo?.description || "")}"><style>:root{${cssVars}}body{margin:0;font-family:system-ui,-apple-system,sans-serif;line-height:1.55;color:#1f2933;background:#fff}.wrap{max-width:1080px;margin:0 auto;padding:64px 24px}section:nth-child(even){background:#f7f7f5}h1{font-size:clamp(2.5rem,8vw,5rem);line-height:1.02;margin:.2em 0}h2{font-size:2rem}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px}article{padding:22px;border:1px solid #e5e7eb;border-radius:18px;background:#fff}.cta{display:inline-block;margin-top:18px;padding:12px 18px;border-radius:999px;background:var(--brand-primary,#1f5eff);color:#fff;text-decoration:none}.mood-warm{background:#fffaf2}.mood-bold h1{font-weight:900}.mood-premium{letter-spacing:.01em}.hero-extra-large .wrap{padding-top:110px;padding-bottom:110px}.hero-medium .wrap{padding-top:44px;padding-bottom:44px}</style></head><body class="mood-${moodClass}">${sectionHtml}</body></html>`;
}

export {
  buildWebsiteDraft,
  applyWebsiteInstruction,
  renderWebsiteHtml,
};
