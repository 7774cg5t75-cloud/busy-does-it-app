function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function clean(value = "") {
  return String(value || "").trim();
}

function slugify(value = "") {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "page";
}

function sectionMap(draft = {}) {
  return new Map(
    safeArray(draft.sections).map((section) => [section.id, section])
  );
}

function enabledSectionIds(draft = {}) {
  return safeArray(draft.sections)
    .filter((section) => section?.enabled !== false)
    .map((section) => clean(section?.id))
    .filter(Boolean);
}

function pageDescription(draft = {}, sectionIds = []) {
  const map = sectionMap(draft);
  const preferred = ["hero", ...sectionIds]
    .map((id) => map.get(id))
    .find((section) => clean(section?.body));
  const raw =
    clean(preferred?.body) ||
    clean(draft?.description) ||
    clean(draft?.businessType) ||
    clean(draft?.businessName);
  return raw.replace(/\s+/g, " ").slice(0, 160);
}

function buildWebsitePageModel(draft = {}) {
  const businessName = clean(draft.businessName) || "Business";
  const businessType = clean(draft.businessType) || "Local business";
  const serviceArea = clean(draft.serviceArea);
  const ids = enabledSectionIds(draft);
  const has = (id) => ids.includes(id);

  const homeIds = ids.slice();
  const pages = [
    {
      id: "home",
      path: "/",
      outputPath: "index.html",
      title: "Home",
      enabled: true,
      sectionIds: homeIds,
    },
  ];

  const dedicated = [
    ["services", "Services", "/services", "services/index.html"],
    ["about", "About", "/about", "about/index.html"],
    ["gallery", "Gallery", "/gallery", "gallery/index.html"],
    ["faq", "FAQs", "/faq", "faq/index.html"],
    ["contact", "Contact", "/contact", "contact/index.html"],
  ];

  dedicated.forEach(([id, title, path, outputPath]) => {
    if (!has(id)) return;
    pages.push({
      id,
      path,
      outputPath,
      title,
      enabled: true,
      sectionIds: [id],
    });
  });

  const navigation = pages
    .filter((page) => page.id !== "faq")
    .map((page) => ({
      id: page.id,
      label: page.title,
      href: page.path,
    }));

  const pageSeo = {};
  pages.forEach((page) => {
    const suffix =
      page.id === "home"
        ? businessType
        : page.title;
    const areaSuffix = serviceArea ? ` • ${serviceArea}` : "";
    pageSeo[page.id] = {
      path: page.path,
      title:
        page.id === "home"
          ? `${businessName} | ${businessType}`.slice(0, 70)
          : `${page.title} | ${businessName}`.slice(0, 70),
      description: (
        pageDescription(draft, page.sectionIds) +
        (page.id === "home" && serviceArea ? ` Serving ${serviceArea}.` : "")
      )
        .replace(/\s+/g, " ")
        .slice(0, 160),
      heading:
        page.id === "home"
          ? businessName
          : `${page.title}${areaSuffix}`.slice(0, 100),
    };
  });

  const homeSeo = pageSeo.home || {
    path: "/",
    title: businessName,
    description: pageDescription(draft, ids),
    heading: businessName,
  };

  return {
    pages,
    navigation,
    seo: {
      ...(draft.seo || {}),
      title: homeSeo.title,
      description: homeSeo.description,
      pages: pageSeo,
      schemaType: "LocalBusiness",
    },
  };
}

function syncWebsitePageModel(draft = {}) {
  return {
    ...draft,
    ...buildWebsitePageModel(draft),
  };
}

function buildSeoAudit(draft = {}) {
  const model = buildWebsitePageModel(draft);
  const pageSeo = model.seo.pages || {};
  const titles = Object.values(pageSeo)
    .map((item) => clean(item?.title))
    .filter(Boolean);
  const descriptions = Object.values(pageSeo)
    .map((item) => clean(item?.description))
    .filter(Boolean);
  const contact = safeArray(draft.sections).find(
    (section) => section?.id === "contact" && section?.enabled !== false
  );
  const serviceArea =
    clean(draft.serviceArea) ||
    clean(contact?.body);
  const checks = [
    {
      id: "page-titles",
      label: "Page titles",
      pass:
        titles.length === model.pages.length &&
        new Set(titles).size === titles.length,
      detail: "Every enabled page should have its own truthful title.",
    },
    {
      id: "descriptions",
      label: "Page descriptions",
      pass: descriptions.length === model.pages.length,
      detail: "Every enabled page should have a useful description.",
    },
    {
      id: "service-area",
      label: "Service area",
      pass: !!serviceArea,
      detail: "Local businesses should clearly state the area they serve.",
    },
    {
      id: "contact",
      label: "Contact route",
      pass: !!(
        clean(contact?.phone) ||
        clean(contact?.email)
      ),
      detail: "Visitors should have a recorded way to contact the business.",
    },
    {
      id: "structured-profile",
      label: "Structured business identity",
      pass: !!clean(draft.businessName),
      detail: "BUSY can emit basic LocalBusiness structured data from approved facts.",
    },
  ];
  const passed = checks.filter((item) => item.pass).length;
  return {
    checks,
    passed,
    total: checks.length,
    label:
      passed === checks.length
        ? "SEO basics ready"
        : `${passed}/${checks.length} SEO basics ready`,
  };
}

function comparable(value) {
  if (Array.isArray(value)) return value.map(comparable);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        if (key === "html" || key === "updatedAt" || key === "generatedAt") {
          return acc;
        }
        acc[key] = comparable(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function same(a, b) {
  return JSON.stringify(comparable(a)) === JSON.stringify(comparable(b));
}

function summarizeWebsiteChanges(previousDraft = null, nextDraft = null) {
  if (!nextDraft) {
    return {
      headline: "No draft",
      items: [],
      counts: { added: 0, removed: 0, changed: 0 },
    };
  }
  if (!previousDraft) {
    const pageCount = buildWebsitePageModel(nextDraft).pages.length;
    return {
      headline: "Initial website release",
      items: [
        {
          type: "added",
          label: "Initial website",
          detail: `${pageCount} page${pageCount === 1 ? "" : "s"} prepared from approved business information.`,
        },
      ],
      counts: { added: 1, removed: 0, changed: 0 },
    };
  }

  const items = [];
  const counts = { added: 0, removed: 0, changed: 0 };
  const add = (type, label, detail) => {
    items.push({ type, label, detail });
    counts[type] = Number(counts[type] || 0) + 1;
  };

  const prevSections = new Map(
    safeArray(previousDraft.sections).map((section) => [section.id, section])
  );
  const nextSections = new Map(
    safeArray(nextDraft.sections).map((section) => [section.id, section])
  );
  const ids = new Set([...prevSections.keys(), ...nextSections.keys()]);

  ids.forEach((id) => {
    const before = prevSections.get(id);
    const after = nextSections.get(id);
    if (!before && after) {
      add("added", `Added ${after.title || id}`, "New website section.");
      return;
    }
    if (before && !after) {
      add("removed", `Removed ${before.title || id}`, "Section removed from the draft.");
      return;
    }
    if (!!before?.enabled !== !!after?.enabled) {
      add(
        after?.enabled === false ? "removed" : "added",
        `${after?.enabled === false ? "Hidden" : "Restored"} ${after?.title || id}`,
        "Section visibility changed."
      );
      return;
    }
    if (!same(before, after)) {
      add("changed", `Updated ${after?.title || id}`, "Content or presentation changed.");
    }
  });

  if (!same(previousDraft.theme, nextDraft.theme)) {
    add("changed", "Updated visual style", "Theme, spacing or hero presentation changed.");
  }
  if (!same(previousDraft.seo, nextDraft.seo)) {
    add("changed", "Updated SEO basics", "Page titles, descriptions or page metadata changed.");
  }

  const prevPages = buildWebsitePageModel(previousDraft).pages;
  const nextPages = buildWebsitePageModel(nextDraft).pages;
  if (!same(prevPages, nextPages)) {
    add(
      "changed",
      "Updated page structure",
      `${nextPages.length} enabled page${nextPages.length === 1 ? "" : "s"} in the new version.`
    );
  }

  if (!items.length) {
    items.push({
      type: "changed",
      label: "Rebuilt from current business data",
      detail: "No material public-facing difference was detected.",
    });
  }

  const top = items.slice(0, 3).map((item) => item.label.replace(/^(Updated|Added|Removed|Hidden|Restored)\s+/i, ""));
  return {
    headline:
      items.length === 1
        ? items[0].label
        : `Updated ${top.join(", ")}${items.length > 3 ? ` + ${items.length - 3} more` : ""}`,
    items,
    counts,
  };
}

function buildPublicBusinessProfile(draft = {}) {
  const contact = safeArray(draft.sections).find(
    (section) => section?.id === "contact"
  ) || {};
  const services = safeArray(draft.sections).find(
    (section) => section?.id === "services"
  );
  const gallery = safeArray(draft.sections).find(
    (section) => section?.id === "gallery"
  );

  return {
    schemaVersion: 1,
    businessName: clean(draft.businessName),
    businessType: clean(draft.businessType),
    serviceArea: clean(draft.serviceArea),
    slug: clean(draft.slug) || slugify(draft.businessName),
    theme: draft.theme || {},
    contact: {
      phone: clean(contact.phone),
      email: clean(contact.email),
      openingHours: clean(contact.openingHours),
      social: contact.social || {},
    },
    services: safeArray(services?.items).map((item) => ({
      id: clean(item.id) || slugify(item.title),
      name: clean(item.title),
      description: clean(item.body),
    })),
    assets: {
      hero: safeArray(draft.sections).find((section) => section?.id === "hero")?.asset || null,
      gallery: safeArray(gallery?.items).slice(0, 24),
    },
    pages: buildWebsitePageModel(draft).pages.map((page) => ({
      id: page.id,
      path: page.path,
      title: page.title,
    })),
  };
}

export {
  buildWebsitePageModel,
  syncWebsitePageModel,
  buildSeoAudit,
  summarizeWebsiteChanges,
  buildPublicBusinessProfile,
};
