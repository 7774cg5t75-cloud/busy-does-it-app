/**
 * V3.98: customer-facing preparation advice, not a blocker or AI output.
 * Derive suggestions only from recorded business facts and website draft.
 */
const clean = (value) => String(value || "").trim();
const rows = (value) => Array.isArray(value) ? value : [];

function websiteQualityGuidance({ brandBrain = {}, draft = null } = {}) {
  const brief = brandBrain?.websiteBrief || {};
  const sections = rows(draft?.sections);
  const suggestions = [];
  const add = (id, title, detail, category) =>
    suggestions.push({ id, title, detail, category });
  const name = clean(draft?.businessName || brief.businessName);
  const services = rows(brief.services);
  const missingCore = rows(brandBrain?.completeness?.coreMissing);

  if (!name || missingCore.length) {
    add("facts", "Check your business details",
      "Make sure your business name, services, service area and contact details are correct.",
      "important");
  }
  if (!clean(brief.description)) {
    add("description", "Explain what makes your business useful",
      "A short description helps visitors understand exactly what you offer.",
      "content");
  }
  if (!clean(brief.tagline) && !clean(brief.differentiators)) {
    add("personality", "Tell customers why they should choose you",
      "Add one truthful thing that makes your service distinctive, not an invented claim.",
      "content");
  }
  const approvedPhotos = rows(brief.photos).filter(p =>
    p?.storagePath || (typeof p?.uri === "string" && p.uri.startsWith("https://"))
  );
  if (!brief.heroAsset && !approvedPhotos.length) {
    add("photos", "Add your own business photos",
      "Real photos of your work can make the website feel personal. Only use photos you have permission to publish.",
      "visual");
  }
  const described = services.filter(s => clean(s?.description));
  if (services.length && described.length < Math.min(services.length, 3)) {
    add("services", "Explain your main services",
      "A short, accurate sentence for each main service is more useful than service names alone.",
      "content");
  }
  if (!clean(brief.visualStyle) && !rows(brief.colours).filter(Boolean).length) {
    add("style", "Choose your look",
      "Tell BUSY whether you want a friendly, modern, traditional or premium feel.",
      "visual");
  }
  // Testimonials are optional. Do not invent reviews or make customers
  // believe their website cannot be published without them.
  return {
    suggestions,
    priority: suggestions.slice(0, 3),
    remaining: Math.max(0, suggestions.length - 3),
    complete: suggestions.length === 0,
    counts: {
      services: services.length,
      approvedPhotos: approvedPhotos.length,
      confirmedReviews: rows(brief.testimonials).length,
      pages: rows(draft?.pages).length,
    },
  };
}

export { websiteQualityGuidance };
