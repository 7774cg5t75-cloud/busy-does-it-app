import {websiteRecordPhoto,websiteSectionPhoto,presentationPhotoHtml} from '../../supabase/functions/busy-website-worker/websiteContentPhotos.mjs';
import {servicePhotoHtml} from '../../supabase/functions/busy-website-worker/websiteServicePhotos.mjs';
import {purposeServiceProjection} from '../../supabase/functions/busy-website-worker/websiteServiceOverview.mjs';
import {pageDirectionClass,craftedPage,craftedServices,craftedStory,craftedContact} from '../../supabase/functions/busy-website-worker/websiteCraftedPage.mjs';
import {responsivePhotoAttributes} from '../../supabase/functions/busy-website-worker/websiteResponsivePhotos.mjs';
import {websiteHeroPhotos,websiteGalleryPresentation,distinctWebsitePhotos,websiteAssetAvailable} from '../../supabase/functions/busy-website-worker/websitePhotoPresentation.mjs';
import {premiumHeroInner} from '../../supabase/functions/busy-website-worker/websitePremiumHero.mjs';
import {testimonialSpotlightItems} from '../../supabase/functions/busy-website-worker/websiteTestimonials.mjs';
import {websitePageGuide,websitePageHeadingHierarchy} from '../../supabase/functions/busy-website-worker/websitePageGuide.mjs';
import {renderWebsiteSiteNavigation} from '../../supabase/functions/busy-website-worker/websiteSiteNavigation.mjs';
import {serviceIndexHtml,serviceContactAction,heroServiceOverview} from '../../supabase/functions/busy-website-worker/websiteServiceIndex.mjs';
import {faqDisclosureItems} from '../../supabase/functions/busy-website-worker/websiteFaqPresentation.mjs';
import {itemTypographyClasses} from "../../supabase/functions/busy-website-worker/websiteTextTypography.mjs";
import {sectionAppearanceClasses} from '../../supabase/functions/busy-website-worker/websiteAppearanceClasses.mjs';
import {businessContentSectionHtml} from '../core/businessContentHtml.mjs';
import {protectWebsiteOwnerLocks} from "../../supabase/functions/busy-website-worker/websiteOwnerLocks.mjs";
import { syncWebsitePageModel } from "./websiteManagement.js";
import {canonicalWebsiteHandoffUrl} from "../core/websiteAppHandoffV3214.mjs";
import { designForWebsite, designCss } from "../../supabase/functions/busy-website-worker/designSystem.mjs";
import { planWebsiteDesign } from "../../supabase/functions/busy-website-worker/designPlanner.mjs";
import { reviewWebsiteDesign } from "../../supabase/functions/busy-website-worker/designReview.mjs";
import { applyWebsiteVisualEdit } from "../../supabase/functions/busy-website-worker/designEdits.mjs";
import {wholeSiteMenuMove} from '../../supabase/functions/busy-website-worker/websiteWholeSite.mjs';

import {splitBuilderInstructionClauses} from '../core/builderInstructionClauses.mjs';
import {WEBSITE_ATOMIC_CHANGES,WEBSITE_ATOMIC_CHARACTERS} from '../core/websiteEditingLimits.mjs';

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

// Exclude unsupported/ambiguous source rows rather than choose a false identity.
function websiteSourceServices(brief={}){
 const rows=safeArray(brief.services).map(s=>typeof s==='string'?{name:s}:s).filter(s=>typeof s?.name==='string'&&clean(s.name));
 const names=new Map(),ids=new Map();
 for(const row of rows){const name=clean(row.name).toLocaleLowerCase('en'),id=clean(row.id)||slugify(row.name);names.set(name,(names.get(name)||0)+1);ids.set(id,(ids.get(id)||0)+1);}
 return rows.filter(row=>names.get(clean(row.name).toLocaleLowerCase('en'))===1&&ids.get(clean(row.id)||slugify(row.name))===1);
}

// Evidence sections must have usable original wording and one unambiguous identity.
// All conflicting rows are omitted; no arbitrary winner or invented answer/review.
function websiteEvidenceItems(brief,key){
 const faq=key==='faqs',rows=safeArray(brief[key]).filter(row=>row&&typeof row==='object'&&!Array.isArray(row)&&(row.id===undefined||typeof row.id==='string')&&typeof (faq?row.question:row.text)==='string'&&clean(faq?row.question:row.text)&&(faq?typeof row.answer==='string'&&clean(row.answer):row.attribution===undefined||typeof row.attribution==='string'));
 const names=new Map(),ids=new Map();
 for(const row of rows){const text=clean(faq?row.question:row.text).toLocaleLowerCase('en'),id=clean(row.id)||slugify(faq?row.question:row.attribution||row.text);names.set(text,(names.get(text)||0)+1);ids.set(id,(ids.get(id)||0)+1);}
 return rows.filter(row=>names.get(clean(faq?row.question:row.text).toLocaleLowerCase('en'))===1&&ids.get(clean(row.id)||slugify(faq?row.question:row.attribution||row.text))===1);
}

function buildSections(brief = {}) {
  const sections = [];
  const sourceServices=websiteSourceServices(brief);
  const serviceNames = sourceServices.map(s=>clean(s?.name)).filter(Boolean);
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
      : sourceServices.length
      ? "See our services"
      : "",
    ctaHref:
      clean(brief.phone) || clean(brief.email)
        ? "#contact"
        : sourceServices.length
        ? "#services"
        : "",
    asset: brief.heroAsset || null,
  });

  if (sourceServices.length) {
    sections.push({
      id: "services",
      type: "services",
      enabled: true,
      title: "What we do",
      body: "",
      items: sourceServices.map((service) => ({
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
      title: "Gallery",
      body: "",
      items: safeArray(brief.photos).slice(0, 12),
    });
  }

  if (websiteEvidenceItems(brief,'testimonials').length) {
    sections.push({
      id: "testimonials",
      type: "testimonials",
      enabled: true,
      title: "What customers say",
      body: "",
      items: websiteEvidenceItems(brief,'testimonials').map((item) => ({
        id: item.id || slugify(item.attribution || item.text),
        title: clean(item.attribution),
        body: clean(item.text),
      })),
    });
  }

  if (websiteEvidenceItems(brief,'faqs').length) {
    sections.push({
      id: "faq",
      type: "faq",
      enabled: true,
      title: "Frequently asked questions",
      body: "",
      items: websiteEvidenceItems(brief,'faqs').map((item) => ({
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
      body: area ? (/^remote\b/i.test(area)?area:"Serving " + area) : "",
      phone: clean(brief.phone),
      email: clean(brief.email),
      openingHours: clean(brief.openingHours),
      social: brief.social || {},
    });
  }

  return sections;
}

function buildWebsiteDraft({ brandBrain = {}, previousDraft = null, businessCreationIntelligence = null, businessId = "" } = {}) {
  const brief = brandBrain.websiteBrief || {};
  const now = new Date().toISOString();
  // Rebuilding factual Brand Brain content must never discard owner-created
  // pages or their authored text. It is a content refresh, not a page deletion.
  const preserved=safeArray(previousDraft?.sections).filter(section=>
    (["text","photo-feature"].includes(section?.type)&&clean(section.id).startsWith("custom-"))||(['products','events'].includes(section?.type)&&section.contentSource==='business_records_v1'));
  // A deliberate owner add/remove is authoritative for that private collection.
  // A later Brand Brain refresh must not silently restore a removed service/FAQ
  // or delete a newly added one. Unedited collections still update from the brief.
  const ownedCollections=safeArray(previousDraft?.sections).filter(section=>
    section?.ownerEditedItems===true&&
    ["services","faq","testimonials"].includes(section.type)&&section.id===section.type&&
    Array.isArray(section.items)&&section.items.length<=30);
  const generated=buildSections(brief);
  // Initial generation uses the SAME finite styles available in the owner editor.
  // Existing sections and explicit empty overrides are retained on regeneration.
  const composition=planWebsiteDesign({businessType:brief.businessType,businessName:brief.businessName,sections:generated,theme:previousDraft?.theme||{}}).composition;
  for(const section of generated){const old=safeArray(previousDraft?.sections).find(s=>s.id===section.id&&s.type===section.type);if(!old&&composition?.sectionDefaults?.[section.id])section.appearance={...composition.sectionDefaults[section.id]};}

  const keepOwnerItems=section=>{
    const prior=ownedCollections.find(old=>old.id===section.id&&old.type===section.type);
    return prior?{...section,items:prior.items.map(item=>({...item})),
      ownerEditedItems:true}:section;
  };
  // Preserve only deliberately edited destination wording in this exact
  // original business. It is owner copy, not verified canonical business facts.
  const sameOwnerSource=businessId?previousDraft?.businessId===businessId&&!([previousDraft?.business_id].some(id=>id&&id!==businessId)):!previousDraft?.businessId&&!previousDraft?.business_id&&previousDraft?.businessName===clean(brief.businessName)&&previousDraft?.businessType===clean(brief.businessType);
  const keepOwnerCopy=section=>{
    const matches=sameOwnerSource?safeArray(previousDraft?.sections).filter(s=>s.id===section.id&&s.type===section.type):[];
    const prior=matches.length===1?matches[0]:null;
    const fields=[...new Set(safeArray(prior?.ownerEditedFields))].filter(f=>['title','body',...(section.type==='hero'?['cta','ctaHref']:[]),...(section.type==='contact'?['email','phone','openingHours']:[])].includes(f)&&typeof prior[f]==='string'&&prior[f].length<=(f==='title'?140:['cta','ctaHref'].includes(f)?120:2500)&&(f!=='title'||!!prior[f].trim())&&!/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(prior[f]));
    const validated=fields.filter(f=>f!=='email'||!prior[f]||/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(prior[f])).filter(f=>f!=='phone'||!prior[f]||/^[+()\d .-]{5,40}$/.test(prior[f]));
    const retained=validated.length?{...section,...Object.fromEntries(validated.map(f=>[f,prior[f]])),ownerEditedFields:validated}:section;
    if(section.type==='hero'&&validated.some(f=>['cta','ctaHref'].includes(f))){
      const href=typeof prior.ctaHref==='string'?prior.ctaHref:'';
      const matches=[...generated,...preserved,...ownedCollections].filter(s=>s.id===href.slice(1)&&s.enabled!==false);
      const target=matches.length===1?matches[0]:null;
      const contact=target?.type==='contact'?keepOwnerCopy(target):target;
      const current=href==='#main'||/^#[a-z][a-z0-9-]*$/i.test(href)&&!!target&&(target.type!=='contact'||!!(clean(contact.email)||clean(contact.phone)));
      // Preserve the reviewed label/destination together. A removed target is
      // disabled; a factual refresh must never guess another customer action.
      return {...retained,ctaHref:current?href:'',ownerEditedFields:[...new Set([...validated,'ctaHref'])]};
    }
    return retained;
  };
  const rawSections=[...generated.map(keepOwnerItems).map(keepOwnerCopy),
    ...ownedCollections.filter(old=>!generated.some(s=>
      s.id===old.id&&s.type===old.type)).map(s=>({...s,
       items:s.items.map(item=>({...item}))})),
    ...preserved.map(section=>({...section}))];
  // Keep each section's individually approved visual choices when factual
  // business information is refreshed. Never transfer styles to other IDs/types.
  const previousLooks=new Map(safeArray(previousDraft?.sections).map(section=>
    [String(section?.id||"")+":"+String(section?.type||""),section?.appearance]));
  const previousItemLooks=new Map();
  const previousGalleryLooks=new Map();
  for(const asset of safeArray(safeArray(previousDraft?.sections)
    .find(section=>section?.id==="gallery")?.items)){
    const key=String(asset?.id||"")+":"+String(asset?.storagePath||asset?.uri||"");
    const appearance={};
    if(["top","bottom"].includes(asset?.appearance?.photoCrop))
      appearance.photoCrop=asset.appearance.photoCrop;
    if(asset?.appearance?.photoFit==="contain")appearance.photoFit="contain";
    if(key!==":"&&Object.keys(appearance).length)previousGalleryLooks.set(key,appearance);
  }
  const restoreGalleryLook=asset=>{
    const key=String(asset?.id||"")+":"+String(asset?.storagePath||asset?.uri||"");
    const appearance=previousGalleryLooks.get(key);
    return appearance?{...asset,appearance:{...appearance}}:asset;
  };
  for(const section of safeArray(previousDraft?.sections)){
    for(const item of safeArray(section?.items)){
      if(item?.id&&["compact","large"].includes(item?.appearance?.headingScale))
        previousItemLooks.set(String(section.id)+":"+String(item.id),
          item.appearance.headingScale);
    }
  }
  const restoreItemLook=(sectionId,item)=>{
    const size=previousItemLooks.get(String(sectionId)+":"+String(item?.id));
    return size?{...item,appearance:{headingScale:size}}:item;
  };

  // Keep already-backed-up source bytes attached to the SAME original image,
  // even when factual Brand Brain wording gets regenerated. This helper lives
  // in the domain module to support existing isolated browser test harnesses.
  const previousOriginalPaths=new Map();
  const assetKey=asset=>clean(asset?.storagePath)||clean(asset?.uri);
  for(const section of safeArray(previousDraft?.sections)){
    const photos=["hero","photo-feature"].includes(section?.type)?[section?.asset]:
      section?.type==="gallery"?safeArray(section.items):[];
    for(const asset of photos){
      const key=assetKey(asset);
      if(key&&clean(asset?.exportOriginalPath))previousOriginalPaths.set(key,asset.exportOriginalPath);
    }
  }
  const restorePhoto=asset=>asset&&previousOriginalPaths.has(assetKey(asset))
    ?{...asset,exportOriginalPath:previousOriginalPaths.get(assetKey(asset))}:asset;
  const sections=rawSections.map(section=>{
    const previous=previousLooks.get(String(section?.id||"")+":"+String(section?.type||""));
    const retained=previous&&typeof previous==="object"&&!Array.isArray(previous)
      ?{appearance:{...previous}}:{};
    if(["hero","photo-feature"].includes(section?.type))
      return {...section,...retained,asset:restorePhoto(section.asset)};
    if(section?.type==="gallery")
      return {...section,...retained,items:safeArray(section.items)
        .map(asset=>restoreGalleryLook(restoreItemLook(section.id,restorePhoto(asset))))};
    return {...section,...retained,
      ...(safeArray(section.items).length?{items:section.items
        .map(item=>restoreItemLook(section.id,item))}:{})};
  });
  const theme=previousDraft?.theme&&typeof previousDraft.theme==="object"
    ? {...themeFromBrief(brief),...previousDraft.theme}
    : themeFromBrief(brief);
  const draft = {
    id: previousDraft?.id || `website-${Date.now()}`,
    ...((previousDraft?.businessId||businessId)?{businessId:previousDraft?.businessId||businessId}:{}),
    ...(previousDraft?.business_id?{business_id:previousDraft.business_id}:{}),
    status: "Draft",
    publicStatus: previousDraft?.publicStatus || "Not published",
    businessName: clean(brief.businessName),
    brandLabel: clean(brief.logoLabel).slice(0, 100) || clean(brief.businessName),
    businessType: clean(brief.businessType),
    serviceArea: clean(brief.serviceArea),
    description: clean(brief.description),
    slug: slugify(brief.businessName),
    generatedAt: previousDraft?.generatedAt || now,
    updatedAt: now,
    generation: Number(previousDraft?.generation || 0) + 1,
    // Explicit owner feedback is scoped to this exact draft and never
    // exported as public webpage content or sent across customers.
    ownerDesignFeedback:safeArray(previousDraft?.ownerDesignFeedback)
      .filter(e=>e?.draftId===previousDraft?.id&&
        ["liked","disliked"].includes(e?.choice)&&
        e?.scope==="this-website-draft-only").slice(-20),
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
    theme,
    ...(sameOwnerSource&&previousDraft?.siteComposition==='connected-pages-v1'?{siteComposition:'connected-pages-v1'}:{}),
    ...(sameOwnerSource&&Object.hasOwn(previousDraft||{},'sitePresentation')?{sitePresentation:previousDraft.sitePresentation}:{}),
    customPages:safeArray(previousDraft?.customPages).map(page=>({
      ...page,sectionIds:safeArray(page?.sectionIds).slice()
    })),
    sections,
    designPlan: planWebsiteDesign({businessType:brief.businessType,businessName:brief.businessName,sections,theme}),
    seo: {
      title: clean(brief.businessName)
        ? `${clean(brief.businessName)} | ${clean(brief.businessType) || "Local business"}`
        : "",
      description: clean(brief.description).slice(0, 160),
      pages: {},
      ...(previousDraft?.seo?.ownerPages?{ownerPages:JSON.parse(JSON.stringify(previousDraft.seo.ownerPages))}:{}),
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
      omittedServiceCount:safeArray(brief.services).length-websiteSourceServices(brief).length,
      omittedEvidenceCount:['faqs','testimonials'].reduce((n,key)=>n+safeArray(brief[key]).length-websiteEvidenceItems(brief,key).length,0),
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
  const refreshed={...draft,generation:Number(draft.generation||0)+1,designPlan:planWebsiteDesign({businessType:draft.businessType,businessName:draft.businessName,sections:draft.sections,theme:draft.theme})};
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
function applyCoordinatedWebsiteCopyUnchecked({ draft = null, approved = {}, serviceName = "", text = "" } = {}) {
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

function applySingleWebsiteInstruction(draft = {}, instruction = "") {
  const content=/^(add|show|include|remove) (?:an? |my |our )?(products|events)(?: (?:section|page))?(?: as (cards|rows))?$/i.exec(clean(instruction));
  if(content)return applyStructuredWebsiteEdit(draft,{action:content[1].toLowerCase()==='remove'?'remove-content-section':'content-section',sectionId:content[2].toLowerCase(),...content[1].toLowerCase()==='remove'?{}:{title:content[2].toLowerCase()==='products'?'Products':'Upcoming events',layout:(content[3]||'cards').toLowerCase()}});

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
    const visualEdit = applyWebsiteVisualEdit(next, text);
    if (visualEdit.applied) {
      return {applied:true,reason:visualEdit.reason,draft:withHtml(visualEdit.draft)};
    }
    const vagueSeasonal = /winter|summer|spring|autumn|seasonal|christmas|easter/i.test(lower);
    return {
      applied: false,
      reason: vagueSeasonal
        ? "BUSY can prepare seasonal website changes, but it needs a specific approved fact or existing service to emphasise. It will not invent seasonal services, prices or claims."
        : visualEdit.reason,
      draft,
    };
  }

  next = withHtml(next);
  return { applied: true, reason: summary, draft: next };
}

/**
 * Bounded atomic multi-step instructions. A failed intermediate change must
 * leave the owner's original private draft untouched. Use explicit "and then"
 * or semicolon separators so copy such as "bread, cheese and wine" survives.
 */
function applyWebsiteInstructionUnchecked(draft = {}, instruction = "") {
  const raw=clean(instruction);
  const parts=splitBuilderInstructionClauses(raw,{website:true,max:WEBSITE_ATOMIC_CHANGES,maxCharacters:WEBSITE_ATOMIC_CHARACTERS});
  if(!parts)return {applied:false,draft,reason:"Describe complete changes separated by ';' or 'and then'. Review larger requests in groups."};
  if(parts.length===1)return applySingleWebsiteInstruction(draft,instruction);
  let candidate=draft;
  const summaries=[];
  for(let i=0;i<parts.length;i++){
    const step=applySingleWebsiteInstruction(candidate,parts[i]);
    if(!step.applied)return {applied:false,draft,
      reason:"Nothing was changed: step "+(i+1)+" needs clarification. "+step.reason};
    candidate=step.draft;
    summaries.push(step.reason);
  }
  return {applied:true,draft:candidate,reason:
    "Applied "+parts.length+" changes to your private website draft. Review before publishing."};
}

/**
 * Structural and visual controls share the same private-only rebuild,
 * section-order and undo boundary used for exact wording edits.
 */
function applyWebsiteLayoutChange(draft = {}, change = {}) {
  const result=applyWebsiteVisualEdit(draft,{...change,kind:"layout"});
  return result.applied?{...result,draft:withHtml(result.draft)}:result;
}

/**
 * Direct edits use stable IDs and literal owner-supplied copy rather than
 * interpreting voice commands. Rebuild every derived representation privately.
 */
function applyStructuredWebsiteEdit(draft = {}, patch = {}) {
  const result = applyWebsiteVisualEdit(draft, {...patch, kind:"structured"});
  return result.applied ? {...result, draft: withHtml(result.draft)} : result;
}

function applyWebsitePageChange(draft = {}, change = {}) {
  let result=applyWebsiteVisualEdit(draft,{...change,kind:"page"});
  // Reuse the original bounded layout operation inside this one reviewed
  // generation. Explicit owner ordering is preserved unless menu-first was asked.
  if(result.applied&&result.draft.sitePresentation==='purposeful-v1'&&(change.action==='compose-service-pages'||change.action==='refine-site-pages'&&['purposeful','menu-first'].includes(change.direction))){
    const move=wholeSiteMenuMove(result.draft,{explicit:change.direction==='menu-first'});
    if(move){const moved=applyWebsiteVisualEdit(result.draft,move);if(!moved.applied)return {applied:false,draft,reason:moved.reason};result={...result,draft:moved.draft};}
  }
  // Page modelling may add a route or change placement after the pure edit.
  // Recheck the original lock invariant over that complete derived result.
  return result.applied?protectWebsiteOwnerLocks(draft,{...result,draft:withHtml(result.draft)}):result;
}

/** Finite tokens only. Page HTML must not expose user-supplied raw style strings. */
function renderWebsiteHtml(draft = {}, pageId = "home", options = {}) {
  const page=safeArray(draft.pages).find(p=>p?.id===pageId)||
    safeArray(draft.pages).find(p=>p?.id==="home")||null;
  const allowed=new Set(safeArray(page?.sectionIds));
  const sections = safeArray(draft.sections).filter(section =>
    section?.enabled !== false && (!page || allowed.has(section.id)));
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
    "rhythm-" + (["comfortable","compact","generous"].includes(draft?.theme?.spacing) ? draft.theme.spacing : "comfortable"),
    "cta-" + (draft?.theme?.ctaEmphasis==="strong"?"strong":"normal"),
    "photo-focus-" + (["top","bottom","center"].includes(draft?.theme?.photoFocus)?draft.theme.photoFocus:"center"),
  ].join(" ");
  // This is the editable concept HTML, not the signed hosted deployment.
  // Both use the same tested professional responsive styles and layout rules.
  const hero=sections.find(section=>section.type==="hero");
  const phone=sections.find(section=>section.type==="contact")?.phone||"";
  const email=sections.find(section=>section.type==="contact")?.email||"";
  const standalone=options?.standalone===true;
  const editablePreview=options?.editablePreview===true&&!standalone;
  const editAttrs=(section,field,itemId="",photoIndex="")=>editablePreview
    ? ` data-busy-edit-section="${escapeHtml(section.id)}" data-busy-edit-field="${escapeHtml(field)}" data-busy-edit-item="${escapeHtml(itemId)}" data-busy-edit-photo-index="${escapeHtml(photoIndex)}"`
    : "";
  const prefix="../".repeat(clean(page?.outputPath||"index.html").split("/").length-1);
  const approvedImage = asset => {
    if(!websiteAssetAvailable(asset,draft.businessId||draft.business_id))return "";
    if(standalone&&options?.privatePagePreview!==true){
      const key=clean(asset?.storagePath)||clean(asset?.uri);
      const filename=options?.assetFiles?.[key]||"";
      return /^assets\/[a-zA-Z0-9_.-]+\.(?:png|jpe?g|webp)$/.test(filename)
        ?prefix+filename:"";
    }
    const uri=String(asset?.uri||"").trim();
    return /^https:\/\/[^\s"'<>]+$/i.test(uri) ? uri : "";
  };
  const homePath=prefix+"index.html";
  const linkToPage=id=>{
    const target=safeArray(draft.pages).find(p=>p.id===id);
    if(!target||!/^(?:index\.html|(?:[a-z0-9-]+\/)*index\.html)$/.test(target.outputPath||""))
      return "";
    return prefix+target.outputPath;
  };
  const renderedOrder=page?.id==="home"||!page?plan.sectionOrder:safeArray(page.sectionIds);
  const orderedSections=renderedOrder.map(id=>sections.find(s=>s.id===id)).filter(Boolean);
  // Only visible sections may be targets for customer navigation or the hero
  // action. Optional empty contact/gallery blocks are intentionally omitted
  // from the HTML, so linking to them would create a broken customer journey.
  const renderedAnchors=new Set(["main"]);
  for(const section of orderedSections){
    const visible=['products','events'].includes(section.type)?true:section.type==="hero"?false:
      ["services","faq","testimonials"].includes(section.type)?
        safeArray(section.items).some(item=>clean(item?.title||item?.body)):
      section.type==="photo-feature"?!!clean(section.body)&&safeArray(draft.customPages).some(p=>p.sourceServiceId&&safeArray(p.sectionIds).includes(section.id))||websiteAssetAvailable(section.asset,draft.businessId||draft.business_id,draft,section)&&!!approvedImage(section.asset):
      section.type==="gallery"?websiteGalleryPresentation(section,draft,{omitHero:page?.id==="home"}).some(row=>approvedImage(row.asset)):
      section.type==="contact"?!!(clean(section.body)||clean(section.phone)||clean(section.email)):
      !!clean(section.body);
    if(visible)renderedAnchors.add(
      section.type==="contact"?"contact":section.type==="gallery"?"gallery":String(section.id||""));
  }
  const galleryPhotoClass=item=>
    (["top","bottom"].includes(item?.appearance?.photoCrop)
      ?" owner-image-crop-"+item.appearance.photoCrop:"")+
    (item?.appearance?.photoFit==="contain"?" owner-image-fit-contain":"");
  const itemHeadingClass=item=>item?.appearance?.headingScale==="large"
    ?' class="owner-item-heading-large"':
    item?.appearance?.headingScale==="compact"?' class="owner-item-heading-compact"':"";
  const rawSectionHtml = orderedSections.map(section=>{
    const sectionClasses=sectionAppearanceClasses(section);
    const sectionAttrs=(sectionClasses?` class="${sectionClasses}"`:"")+editAttrs(section,"section");
    if(['products','events'].includes(section.type))return businessContentSectionHtml(section,{recordPhoto:record=>presentationPhotoHtml(websiteRecordPhoto(draft,section,record),approvedImage,escapeHtml,(a,url)=>responsivePhotoAttributes(a,url,options.assetVariants,escapeHtml),'menu'),sectionClasses,narrative:['narrative','atelier'].includes(draft.theme?.heroVariation),artDirection:craftedPage(draft)&&(draft.theme.heroVariation.startsWith('authored')||['narrative','atelier'].includes(draft.theme.heroVariation))});
    if(section.type==="hero"){
      const url=approvedImage(section.asset);
      const art=url
        ? `<img class="hero-image${galleryPhotoClass(section.asset)}" loading="eager" decoding="async" fetchpriority="high"${responsivePhotoAttributes(section.asset,url,options.assetVariants,escapeHtml,{hero:true})}${editAttrs(section,"photo")} src="${escapeHtml(url)}" alt="${escapeHtml(clean(section.asset?.alt)||draft.businessName||"Business photograph")}">`
        : '<div class="hero-art" aria-hidden="true"></div>';
      const kicker=clean(draft.businessType||draft.businessName);
      const lead=clean(section.body) ? `<p class="lead"${editAttrs(section,"body")}>${escapeHtml(section.body)}</p>` : "";
      const wanted=clean(section.ctaHref);
      const missingTarget=wanted.startsWith("#")&&!renderedAnchors.has(wanted.slice(1));
      const safeFallback=renderedAnchors.has("services")?"#services":
        [...renderedAnchors].find(id=>id!=="main")||"";
      const fallbackHref=safeFallback.startsWith("#")?safeFallback:
        safeFallback?"#"+safeFallback:"";
      const standaloneTarget=standalone&&wanted.startsWith("#")&&!renderedAnchors.has(wanted.slice(1))
        ?(linkToPage(wanted.slice(1))?linkToPage(wanted.slice(1))+"#"+wanted.slice(1):""):"";
      const actualHref=standaloneTarget||(missingTarget?fallbackHref:wanted);
      const actionText=missingTarget?"Explore our services":clean(section.cta);
      const action=actionText&&actualHref
        ? `<a class="cta"${editAttrs(section,"cta")} href="${escapeHtml(actualHref)}">${escapeHtml(actionText)}</a>` : "";
      return `<section class="hero hero-${escapeHtml(draft.theme?.heroSize||"large")} ${url?"hero-with-image":"hero-no-image"}${sectionClasses?" "+sectionClasses:""}"${editAttrs(section,"section")}>${draft.theme?.heroComposition?premiumHeroInner(draft.theme.heroComposition,{variation:draft.theme?.heroVariation,images:websiteHeroPhotos(draft).filter(({asset:a})=>approvedImage(a)).slice(0,2).map(({asset:a})=>`<img class="hero-image${galleryPhotoClass(a)}" loading="lazy" decoding="async" src="${escapeHtml(approvedImage(a))}" alt="${escapeHtml(clean(a.alt)||draft.businessName||"Business photograph")}">`),copy:`<div class="hero-content">${kicker?`<p class="kicker">${escapeHtml(kicker)}</p>`:""}<h1${editAttrs(section,"title")}>${escapeHtml(section.title)}</h1>${lead}${action}</div>`,image:art,hasImage:!!url,services:draft.theme?.heroComposition==='product-showcase'&&orderedSections.some(s=>s.type==='products')?`<div class="premium-product-link" role="navigation" aria-label="Product collection"><a href="#products">${escapeHtml(orderedSections.find(s=>s.type==='products').title||'Explore the collection')}</a></div>`:heroServiceOverview(sections.find(s=>s.type==='services'),escapeHtml)})||`<div class="wrap"><div class="hero-content">${kicker?`<p class="kicker">${escapeHtml(kicker)}</p>`:""}<h1${editAttrs(section,"title")}>${escapeHtml(section.title||draft.businessName||"Your business")}</h1>${lead}${action}${heroServiceOverview(orderedSections.find(s=>s.type==='services'),escapeHtml)}</div>${art}</div>`:`<div class="wrap"><div class="hero-content">${kicker?`<p class="kicker">${escapeHtml(kicker)}</p>`:""}<h1${editAttrs(section,"title")}>${escapeHtml(section.title||draft.businessName||"Your business")}</h1>${lead}${action}${heroServiceOverview(orderedSections.find(s=>s.type==='services'),escapeHtml)}</div>${art}</div>`}</section>`;
    }
    if(craftedPage(draft)&&section.type==='services'&&section.appearance?.serviceLayout!=='index'){
      const heading=page?.id!=='home'&&orderedSections[0]===section?'h1':'h2';
      const projection=purposeServiceProjection(draft,section,{pageId:page?.id,editablePreview,pageHref:standalone?linkToPage:undefined});
      const content=craftedServices(projection?.section||section,draft.theme.heroComposition,{direction:draft.theme.heroVariation,overview:!!projection,reviewedHeadingHrefs:projection?.reviewedHeadingHrefs||[],itemHeadingHref:item=>projection?.detailHrefs[item.id]||'',photoFor:item=>projection?.hiddenPhotoIds.includes(item.id)?'':['narrative','atelier'].includes(draft.theme.heroVariation)?servicePhotoHtml(draft,item,approvedImage,escapeHtml,(a,url)=>responsivePhotoAttributes(a,url,options.assetVariants,escapeHtml)):'',escapeHtml,editAttrs,itemHeadingClass,itemClasses:itemTypographyClasses,contactAction:item=>serviceContactAction(item,renderedAnchors.has('contact')?'#contact':'',escapeHtml)});
      if(content)return `<section id="${escapeHtml(section.id)}"${sectionAttrs}><div class="wrap"><${heading}${editAttrs(section,'title')}>${escapeHtml(section.title)}</${heading}>${content}</div></section>`;
    }
    if(section.type==='services'&&section.appearance?.serviceLayout==='index'){
      const indexed=serviceIndexHtml(section,{escapeHtml,editAttrs,itemHeadingClass,contactHref:renderedAnchors.has('contact')?'#contact':''});
      const headingTag=page?.id!=='home'&&orderedSections[0]===section?'h1':'h2';
      if(indexed)return `<section id="${escapeHtml(section.id)}"${sectionAttrs}><div class="wrap"><${headingTag}${editAttrs(section,'title')}>${escapeHtml(section.title)}</${headingTag}>${indexed}</div></section>`;
    }
    if(section.type==='testimonials'&&section.appearance?.testimonialsLayout==='spotlight'){
      const items=testimonialSpotlightItems(section,{escapeHtml,editAttrs,itemHeadingClass,itemTypographyClasses});
      const headingTag=page?.id!=='home'&&orderedSections[0]===section?'h1':'h2';
      if(items)return `<section id="${escapeHtml(section.id)}"${sectionAttrs}><div class="wrap"><${headingTag}${editAttrs(section,'title')}>${escapeHtml(section.title)}</${headingTag}>${items}</div></section>`;
    }
    if(section.type==='faq'&&section.appearance?.faqLayout==='questions'){
      const headingTag=page?.id!=='home'&&orderedSections[0]===section?'h1':'h2';
      return `<section id="${escapeHtml(section.id)}"${sectionAttrs}><div class="wrap"><${headingTag}${editAttrs(section,'title')}>${escapeHtml(section.title)}</${headingTag}><div class="faq-questions">${faqDisclosureItems(section,{escapeHtml,editAttrs,itemHeadingClass})}</div></div></section>`;
    }
    if(section.type==="services"||section.type==="faq"||section.type==="testimonials"){
      const items=safeArray(section.items).filter(item=>clean(item?.title||item?.body));
      if(!items.length)return "";
      return `<section id="${escapeHtml(section.id)}"${sectionAttrs}><div class="wrap"><${page?.id!=="home"&&orderedSections[0]===section?"h1":"h2"}${editAttrs(section,"title")}>${escapeHtml(section.title)}</${page?.id!=="home"&&orderedSections[0]===section?"h1":"h2"}><div class="grid">${items.map(item=>`<article${itemTypographyClasses(item)?` class="${itemTypographyClasses(item)}"`:""}><h3${itemHeadingClass(item)}${editAttrs(section,"title",String(item.id||""))}>${escapeHtml(item.title)}</h3>${clean(item.body)?`<p${editAttrs(section,"body",String(item.id||""))}>${escapeHtml(item.body)}</p>`:""}${serviceContactAction(item,section.type==="services"&&renderedAnchors.has("contact")?"#contact":"",escapeHtml)}</article>`).join("")}</div></div></section>`;
    }
    if(section.type==="photo-feature"){
      const image=websiteAssetAvailable(section.asset,draft.businessId||draft.business_id,draft,section)?approvedImage(section.asset):'';
      const imageAppearance=section.asset?.appearance||{},imageCrop=galleryPhotoClass(section.asset)+['mobile','desktop'].map(view=>['top','center','bottom'].includes(imageAppearance[view+'PhotoCrop'])?' owner-image-'+view+'-crop-'+imageAppearance[view+'PhotoCrop']:'').join('');
      const dimensions=Number.isSafeInteger(section.asset?.width)&&section.asset.width>0&&section.asset.width<=20000&&Number.isSafeInteger(section.asset?.height)&&section.asset.height>0&&section.asset.height<=20000?` width="${section.asset.width}" height="${section.asset.height}"`:'';
      const eager=orderedSections[0]===section;
      const picture=`<img class="photo-feature-image${imageCrop}" loading="${eager?'eager':'lazy'}" decoding="async"${eager?' fetchpriority="high"':''}${dimensions}${responsivePhotoAttributes(section.asset,image,options.assetVariants,escapeHtml)}${editAttrs(section,"photo")} src="${escapeHtml(image)}" alt="${escapeHtml(clean(section.asset?.alt)||'Website photograph')}">`;
      const copy=`<div><h2${editAttrs(section,"title")}>${escapeHtml(section.title)}</h2><p${editAttrs(section,"body")}>${escapeHtml(section.body).replace(/\n/g,"<br>")}</p></div>`;
      const generatedServicePage=safeArray(draft.customPages).some(p=>p.sourceServiceId&&safeArray(p.sectionIds).includes(section.id));
      return image? `<section class="photo-feature${sectionClasses?" "+sectionClasses:""}" id="${escapeHtml(section.id)}"${editAttrs(section,"section")}><div class="wrap photo-feature-grid">${section.appearance?.photoSide==='right'?copy+picture:picture+copy}</div></section>`:generatedServicePage&&clean(section.body)?`<section id="${escapeHtml(section.id)}"${sectionAttrs}><div class="wrap">${copy}</div></section>`:"";
    }
    if(section.type==="gallery"){
      const selected=websiteGalleryPresentation(section,draft,{omitHero:page?.id==="home"}),images=selected.map(row=>approvedImage(row.asset)).filter(Boolean);
      return images.length ? `<section id="gallery"${sectionAttrs}><div class="wrap"><h2${editAttrs(section,"title")}>${escapeHtml(section.title)}</h2><div class="gallery${images.length>=3?" gallery-rich":""}">${selected.map(({asset,index:i})=>{const image=approvedImage(asset);return image?`<img class="gallery-image${galleryPhotoClass(asset)}"${responsivePhotoAttributes(asset,image,options.assetVariants,escapeHtml)}${editAttrs(section,"photo","",String(i))} loading="lazy" src="${escapeHtml(image)}" alt="${escapeHtml(clean(asset.alt)||draft.businessName||"Approved photograph")}">`:"";}).join("")}</div></div></section>` : "";
    }
    if(section.type==="contact"){
      if(!clean(section.body)&&!clean(phone)&&!clean(email))return "";
      // V3.214: no website-hosted form; connect only a canonical, approved
     // live Business App handoff. The server rechecks the live action on visit.
     const handoffs=["enquiry","booking_request"].map(kind=>{
       const link=draft.theme?.appRequestLinks?.[kind];
       if(link?.ownerApproved!==true||link.intent!==kind||
         !link.appId||!link.liveVersionId||!link.slug||
         typeof link.url!=="string")return "";
       let verified="";
       try{
         const u=new URL(link.url);
         verified=canonicalWebsiteHandoffUrl({
           endpoint:u.origin+u.pathname,slug:link.slug,kind,
            appId:link.appId,liveVersionId:link.liveVersionId
         });
       }catch{return "";}
       if(verified!==link.url)return "";
       const label=kind==="enquiry"?"Send an enquiry through BUSY":
         "Request a booking through BUSY";
       return `<p><a class="busy-app-request-link" href="${escapeHtml(verified)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a></p>`;
     }).filter(Boolean).join("");
     if(craftedPage(draft))return `<section id="contact"${sectionAttrs}>${craftedContact({family:draft.theme.heroComposition,heading:`<h2${editAttrs(section,'title')}>${escapeHtml(section.title||'Get in touch')}</h2>`,body:section.body?`<p${editAttrs(section,'body')}>${escapeHtml(section.body)}</p>`:'',channels:(phone?`<p><a${editAttrs(section,'phone')} href="tel:${escapeHtml(phone.replace(/\s+/g,''))}">${escapeHtml(phone)}</a></p>`:'')+(email?`<p><a${editAttrs(section,'email')} href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>`:''),extra:handoffs+(section.openingHours?`<p${editAttrs(section,'openingHours')}>${escapeHtml(section.openingHours)}</p>`:'')})}</section>`;
     return `<section id="contact"${sectionAttrs}><div class="wrap"><h2${editAttrs(section,"title")}>${escapeHtml(section.title||"Get in touch")}</h2>${clean(section.body)?`<p${editAttrs(section,"body")}>${escapeHtml(section.body)}</p>`:""}${clean(phone)?`<p><a${editAttrs(section,"phone")} href="tel:${escapeHtml(phone.replace(/\s+/g,""))}">${escapeHtml(phone)}</a></p>`:""}${clean(email)?`<p><a${editAttrs(section,"email")} href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>`:""}${handoffs}${clean(section.openingHours)?`<p${editAttrs(section,"openingHours")}>${escapeHtml(section.openingHours)}</p>`:""}</div></section>`;
    }
    if(craftedPage(draft)&&(section.id==='about'||(draft.theme?.heroVariation?.startsWith('authored')||['narrative','atelier'].includes(draft.theme?.heroVariation))&&section.type==='text')&&clean(section.body))return `<section id="${escapeHtml(section.id)}"${sectionAttrs}>${craftedStory(section,{photo:presentationPhotoHtml(websiteSectionPhoto(draft,section),approvedImage,escapeHtml,(a,url)=>responsivePhotoAttributes(a,url,options.assetVariants,escapeHtml),'story'),direction:draft.theme.heroVariation,family:draft.theme.heroComposition,escapeHtml,editAttrs,headingTag:page?.id!=='home'&&orderedSections[0]===section?'h1':'h2'})}</section>`;
    if(draft.theme?.heroComposition&&(section.id==='about'||(draft.theme?.heroVariation?.startsWith('authored')||['narrative','atelier'].includes(draft.theme?.heroVariation))&&section.type==='text')&&clean(section.body)){
      const paragraphs=escapeHtml(section.body).split(/\n\s*\n/).map(text=>`<p>${text.replace(/\n/g,'<br>')}</p>`).join('');
      return `<section id="${escapeHtml(section.id)}"${sectionAttrs}><div class="wrap story-layout"><h2${editAttrs(section,'title')}>${escapeHtml(section.title)}</h2><div class="story-copy"${editAttrs(section,'body')}>${paragraphs}</div></div></section>`;
    }
    return clean(section.body)
      ? `<section id="${escapeHtml(section.id)}"${sectionAttrs}><div class="wrap"><${page?.id!=="home"&&orderedSections[0]===section?"h1":"h2"}${editAttrs(section,"title")}>${escapeHtml(section.title)}</${page?.id!=="home"&&orderedSections[0]===section?"h1":"h2"}><p${editAttrs(section,"body")}>${escapeHtml(section.body).replace(/\n/g,"<br>")}</p></div></section>`
      : "";
  }).join("");
  const sectionHtml=websitePageHeadingHierarchy(rawSectionHtml,{draft,page,sections:orderedSections,escapeHtml,editAttrs,homeHref:standalone?homePath:'',pageHref:id=>standalone?linkToPage(id):''});
  const business=escapeHtml(draft.businessName||"Business website");
  const area=clean(draft.serviceArea);
  const navigationItems=safeArray(draft.navigation)
    .filter(item=>item?.id&&item?.label&&(standalone||renderedAnchors.has(String(item.id))))
    .map(item=>{
      if(!standalone)
        return {id:item.id,label:item.label,href:'#'+item.id};
      const pageLink=linkToPage(item.id);
      const fragment=clean(item?.href);
      const href=pageLink||(fragment.startsWith("#")?
        (page?.id==="home"&&renderedAnchors.has(fragment.slice(1))
          ?fragment:homePath+fragment):"");
      return href?{id:item.id,label:item.label,href}:null;
    }).filter(Boolean);
  const nav=navigationItems.map(item=>`<a${standalone&&item.id===page?.id?' aria-current="page"':''} href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`).join("");
  const purposefulNavigation=standalone?renderWebsiteSiteNavigation({draft,page,items:navigationItems,escapeHtml,pageHref:linkToPage}):null;
  const navigationHtml=purposefulNavigation||(safeArray(draft.navigation).length>6
    ?`<div class="nav-links nav-long-desktop">${nav}</div><details class="nav-mobile-details"><summary>Menu <span aria-hidden="true">+</span></summary><div class="nav-links">${nav}</div></details>`
    :`<div class="nav-links">${nav}</div>`);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(draft.seo?.pages?.[page?.id]?.title||draft.seo?.title||draft.businessName||"Website")}</title><meta name="description" content="${escapeHtml(draft.seo?.pages?.[page?.id]?.description||draft.seo?.description||"")}"><style>${layoutCss}</style></head><body class="${page&&page.id!=='home'?'website-inner-page ':''}${pageDirectionClass(draft)?pageDirectionClass(draft)+' ':''}${craftedPage(draft)?'premium-crafted '+((draft.theme.heroVariation.startsWith('authored')||['narrative','atelier'].includes(draft.theme.heroVariation))?'premium-authored '+(['narrative','atelier'].includes(draft.theme.heroVariation)?'premium-narrative '+(draft.theme.heroVariation==='atelier'?'premium-atelier ':''):''):''):''}mood-${design.mood} sector-${design.sector} family-${plan.family} tier-${plan.contentTier} architecture-${plan.architecture} ${classes} ${/^[-a-z]+$/.test(draft.theme?.heroComposition||"")?"premium-site-"+draft.theme.heroComposition:""}"><a class="skip-link" href="#main">Skip to content</a><nav aria-label="Main navigation"><div class="wrap nav-wrap"><a class="brand" href="${standalone?escapeHtml(homePath):"#main"}">${escapeHtml(draft.brandLabel||draft.businessName||"Business website")}</a>${navigationHtml}</div></nav><main id="main">${page?.id==='home'||!page?websitePageGuide(draft,orderedSections,sectionHtml,escapeHtml):''}${sectionHtml}</main><footer class="site-footer"><div class="wrap"><strong>${business}</strong>${area?`<span>${escapeHtml(area)}</span>`:""}</div></footer></body></html>`;
}


function applyWebsiteInstruction(draft,instruction){return protectWebsiteOwnerLocks(draft,applyWebsiteInstructionUnchecked(draft,instruction));}
function applyCoordinatedWebsiteCopy(args={}){return protectWebsiteOwnerLocks(args.draft,applyCoordinatedWebsiteCopyUnchecked(args));}

export {
  buildWebsiteDraft,
  applyWebsiteInstruction,
  applyStructuredWebsiteEdit,
  applyWebsiteLayoutChange,
  applyWebsitePageChange,
  applyCoordinatedWebsiteCopy,
  renderWebsiteHtml,
  withHtml as rebuildPrivateWebsiteDraft,
};
