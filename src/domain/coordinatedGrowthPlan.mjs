/**
 * V3.62 coordinated business-growth preview.
 *
 * Reads ONLY owner-confirmed Shared Business Profile facts.
 * No network, generated content, cross-tenant state, side effects or publishing.
 * Any proposed change must pass the existing per-surface review/approval flow.
 */
const asText = value => typeof value === "string" ? value.trim().slice(0, 500) : "";
const hasText = value => asText(value).length > 0;
const normalized = value => asText(value).toLocaleLowerCase("en-GB").replace(/\s+/g," ");
const TARGETS = Object.freeze(["website", "business_app", "social"]);
const TARGET_LABELS = Object.freeze({
  website: "Website",
  business_app: "Customer Business App",
  social: "Social media",
});

function confirmedServices(approved = {}) {
  if (!Array.isArray(approved?.services)) return [];
  const seen = new Set();
  const results = [];
  for (const candidate of approved.services.slice(0, 100)) {
    // Even inside a shared profile, explicitly pending/draft services stay excluded.
    if (candidate?.approved === false || candidate?.status === "draft" || candidate?.status === "pending") continue;
    const name = asText(candidate?.name).slice(0, 120);
    if (!name || seen.has(normalized(name))) continue;
    seen.add(normalized(name));
    results.push({ name, description: asText(candidate.description).slice(0, 300) });
    if (results.length === 30) break;
  }
  return results;
}

const BLOCKER_LABELS = Object.freeze({
  business_name:"Confirmed trading name",
  service_area:"Confirmed service area",
  public_contact:"Public customer contact",
});

function rankGrowthBlockers(actions = []) {
  const priorities = new Map();
  for (const action of Array.isArray(actions) ? actions : []) {
    for (const blocker of Array.isArray(action?.blockedBy) ? action.blockedBy : []) {
      if (!Object.prototype.hasOwnProperty.call(BLOCKER_LABELS, blocker)) continue;
      const existing = priorities.get(blocker) || {key:blocker,label:BLOCKER_LABELS[blocker],targets:[]};
      if (!existing.targets.includes(action.target)) existing.targets.push(action.target);
      priorities.set(blocker, existing);
    }
  }
  return [...priorities.values()]
    .map(item => ({...item, impactedCount:item.targets.length}))
    .sort((a,b) => b.impactedCount - a.impactedCount || a.label.localeCompare(b.label));
}

function buildCoordinatedGrowthPlan({ approved = {}, focusService = "", requestedTargets = TARGETS } = {}) {
  const services = confirmedServices(approved);
  const selected = services.find(service => normalized(service.name) === normalized(focusService));
  if (!selected) return {
    valid:false, service:null, targets:[], blocked:[], actions:[],
    requiresOwnerConfirmation:true, publicationAllowed:false,
    notice:"Select a service already confirmed in your shared business profile.",
  };
  const targets = Array.isArray(requestedTargets) ?
    TARGETS.filter(target => requestedTargets.includes(target)) : [...TARGETS];
  const businessName = asText(approved.businessName);
  const area = asText(approved.serviceArea);
  const contact = hasText(approved.email) || hasText(approved.phone);
  const checks = {
    website: [
      ["business_name", !businessName],
      ["service_area", !area],
      ["public_contact", !contact],
    ],
    business_app: [
      ["business_name", !businessName],
      ["public_contact", !contact],
    ],
    social: [
      ["business_name", !businessName],
    ],
  };
  const definitions = {
    website: {
      title:"Review website service section",
      task:"Prepare or review a website section for " + selected.name + ".",
      note: selected.description ?
        "Use only the confirmed service description: " + selected.description :
        "Confirm a service description before writing detailed marketing claims.",
    },
    business_app: {
      title:"Review customer enquiry flow",
      task:"Prepare or review a customer enquiry option for " + selected.name + ".",
      note: approved.bookingsEnabled === true ?
        "Booking can be considered only through the existing approved Business App modules." :
        "Use an enquiry workflow unless the owner separately enables and reviews booking.",
    },
    social: {
      title:"Prepare a social announcement",
      task:"Draft an announcement about " + selected.name + " for the owner's review.",
      note:"Do not assume a price, offer, availability, new launch date or automatic publication.",
    },
  };
  const actions = targets.map((target, index) => {
    const blockers = checks[target].filter(([, missing]) => missing).map(([field]) => field);
    return {
      id:"growth:" + target,
      target,
      label:TARGET_LABELS[target],
      title:definitions[target].title,
      task:definitions[target].task,
      note:definitions[target].note,
      status:blockers.length ? "blocked" : "ready_for_review",
      blockedBy:blockers,
      priority:index+1,
      requiresOwnerApproval:true,
      automaticallyApplied:false,
      published:false,
    };
  });
  return {
    valid:true,
    service:selected,
    businessName,
    serviceArea:area,
    targets,
    actions,
    blocked:actions.filter(action=>action.status==="blocked").map(action=>action.target),
    reviewable:actions.filter(action=>action.status==="ready_for_review").length,
    nextBlockers:rankGrowthBlockers(actions),
    requiresOwnerConfirmation:true,
    publicationAllowed:false,
    notice:"This preview does not check published websites, app releases or social posts. Each change requires separate approval.",
  };
}
export { confirmedServices, buildCoordinatedGrowthPlan, rankGrowthBlockers, TARGET_LABELS };
