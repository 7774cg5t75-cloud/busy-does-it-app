/**
 * V3.63: prepare three editable, review-only drafts from V3.62's approved-only plan.
 * Pure derivation: no API calls, persistence, publisher permissions or side effects.
 * Signed-in owner scope is part of the source key, so drafts cannot survive a
 * business/account switch merely because two profiles have identical content.
 */
import { buildCoordinatedGrowthPlan } from "./coordinatedGrowthPlan.mjs";

const clean = (value, max = 600) => typeof value === "string" ? value.trim().slice(0, max) : "";
const boundedCopy = value => clean(value, 800);

function prepareCoordinatedGrowthDrafts({
  approved = {},
  focusService = "",
  ownerId = "",
  businessId = "",
  requestedTargets,
} = {}) {
  const plan = buildCoordinatedGrowthPlan({approved, focusService, requestedTargets});
  const owner = clean(ownerId, 100);
  if (!owner || !plan.valid) {
    return {
      valid: false,
      sourceKey: "",
      items: [],
      requiresOwnerApproval: true,
      publicationAllowed: false,
      notice: !owner ? "Sign in as a business owner before preparing private drafts." : plan.notice,
    };
  }
  const name = clean(plan.businessName, 120);
  const service = clean(plan.service.name, 120);
  const detail = clean(plan.service.description, 300);
  const area = clean(plan.serviceArea, 200);
  const email = clean(approved.email, 150);
  const phone = clean(approved.phone, 100);
  const contact = [email, phone].filter(Boolean).join(" / ");

  // No references to speculative offers, prices, availability or a "new" launch.
  const bodies = {
    website: detail || ("Contact " + name + " to ask about " + service + "."),
    business_app: "Offer a customer enquiry option for " + service + ". " +
      "Show the confirmed service details" + (detail ? ": " + detail : " only when available") +
      ". Do not create a confirmed booking, payment, loyalty benefit or live app change.",
    social: name + " offers " + service + (area ? " in " + area : "") + ". " +
      (detail ? detail + " " : "") +
      (contact ? "Enquiries: " + contact + "." : "Contact the business for more information."),
  };
  const sourceKey = JSON.stringify([
    owner,
    clean(businessId, 100),
    name,
    service,
    detail,
    area,
    email,
    phone,
    plan.actions.map(a => [a.target, a.status, a.blockedBy]),
  ]);
  return {
    valid: true,
    sourceKey,
    serviceName: service,
    items: plan.actions.map(action => ({
      id: action.id,
      target: action.target,
      label: action.label,
      status: action.status === "blocked" ? "blocked" : "editable_draft",
      blockedBy: [...action.blockedBy],
      text: action.status === "blocked" ? "" : boundedCopy(bodies[action.target]),
      ownerEdited: false,
      handedOff: false,
      published: false,
      requiresOwnerApproval: true,
    })),
    requiresOwnerApproval: true,
    publicationAllowed: false,
    notice: "Private editable drafts only. The existing website, Business App and social publishing approvals are still required.",
  };
}

function isCurrentGrowthDraftPack(saved, current) {
  return !!(saved?.valid && current?.valid && saved.sourceKey &&
    saved.sourceKey === current.sourceKey);
}

function editGrowthDraft(pack, target, text) {
  if (!pack?.valid || typeof text !== "string" || !Array.isArray(pack.items)) return pack;
  return {
    ...pack,
    items: pack.items.map(item => item.target === target && item.status === "editable_draft"
      ? {...item, text: boundedCopy(text), ownerEdited: true, handedOff: false}
      : item),
  };
}

export { prepareCoordinatedGrowthDrafts, isCurrentGrowthDraftPack, editGrowthDraft };
