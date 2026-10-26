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
  if(Number(draft?.sourceSummary?.omittedServiceCount)>0)add('ambiguous-services','Review incomplete or repeated service details','Some source services have no name or share a name/identifier. Busy did not choose between conflicting entries; correct the original service information.','important');
  if(Number(draft?.sourceSummary?.omittedEvidenceCount)>0)add('ambiguous-evidence','Review your questions and customer comments','Incomplete or repeated questions, answers or customer comments were omitted from new generation. Review their original wording and identities; existing owner-edited collections are preserved.','important');
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
  // Structural diagnostics describe the private draft only, never live SEO or rendering.
  const visible=sections.filter(s=>s?.enabled!==false),ids=visible.map(s=>s?.id);
  if(new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'||!id.trim()))add('section-identities','Review repeated section identities','Some visible sections have missing or repeated identities. Keep the original draft and review the sections before preparing publication.','important');
  if(rows(draft?.pages).some(p=>{const refs=rows(p?.sectionIds);return new Set(refs).size!==refs.length||refs.some(id=>sections.filter(s=>s?.id===id).length!==1);}))add('page-structure','Review your page sections','A private page references a repeated, missing or ambiguous section. Review it in the original page editor; Busy has not removed your content.','important');
  if(visible.some(s=>['services','faq','testimonials'].includes(s.type)&&(!rows(s.items).length||rows(s.items).some(i=>!clean(i?.title)&&!clean(i?.body)))))add('empty-collection','Review empty content entries','A visible collection includes an empty entry. Edit or remove it deliberately in the original section editor; no wording has been invented.','content');
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
