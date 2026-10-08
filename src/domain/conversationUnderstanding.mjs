/**
 * V3.60 conversational business understanding.
 * Pure, tenant-agnostic draft analysis. Never writes approved business facts,
 * stores transcripts or triggers publication.
 */
const trim = value => typeof value === "string" ? value.trim() : "";
const cleanCapture = value => trim(value).replace(/\s+(?:and|but|because)\s+(?:(?:we|i)(?:\s|\u0027|’)|our\s).*$/i, "").replace(/\s+(?:we|i)\s+(?:do|offer|run|want|need|serve|cover)\b.*$/i, "").trim();
const unique = items => [...new Set(items.filter(Boolean))];
const FIELD_ORDER = ["businessName", "businessType", "services", "serviceArea", "contact", "openingHours"];
const QUESTIONS = {
  businessName: "What is the exact trading name you want customers to see?",
  businessType: "How would you describe what your business does?",
  services: "Which services should your customers be able to see?",
  serviceArea: "Which towns or areas do you cover?",
  contact: "Which public phone number or email should customers use?",
  openingHours: "What hours should customers expect you to be available?"
};
const redact = text => trim(text).replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, "[email]").replace(/\b(?:\+?\d[\d ()-]{8,}\d)\b/g, "[phone]");
const evidence = (value, source, confidence = "explicit") => ({
  value, source, confidence, approved: false
});
function extractConversationTurn(input) {
  const original = trim(input).slice(0, 6000);
  if (!original) return { fields: {}, suggestions: [], conflicts: [] };
  // Examples are not business facts. Exclude only their sentence, rather than
  // discarding genuine owner facts given before or after an example.
  const text = original.split(/(?<=[.!?])\\s+|\\n+/)
    .filter(part => !/\\b(?:for example|imagine|hypothetically|suppose|what if)\\b/i.test(part))
    .join(". ");
  const fields = {};
  const name = text.match(/\b(?:my (?:business|company) is called|we(?:'re| are) called|trading as|business name is)\s+([^.!?,;\n]{2,65})/i);
  if (name && cleanCapture(name[1])) fields.businessName = evidence(cleanCapture(name[1]), "owner_statement");
  const area = text.match(/\b(?:based (?:in|around)|cover(?:ing)?|serv(?:e|ing) (?:the )?(?:area of )?|work(?:ing)? (?:in|around))\s+([^.!?,;\n]{2,75})/i);
  if (area && cleanCapture(area[1])) fields.serviceArea = evidence(cleanCapture(area[1]), "owner_statement");
  const email = text.match(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i);
  if (email) fields.email = evidence(email[0], "owner_statement");
  const phone = text.match(/\b(?:\+44\s?\d[\d -]{8,}|0\d[\d -]{9,})\b/);
  if (phone) fields.phone = evidence(phone[0].trim(), "owner_statement");
  // Labels are classification suggestions, not verified trading descriptions.
  const categories = [
    ["plumbing", /\bplumb(?:er|ing|ers)?\b/i],
    ["cleaning", /\bclean(?:er|ing|ers)?\b/i],
    ["catering", /\bcater(?:er|ing|ers)?\b|\bhog roast\b/i],
    ["landscaping", /\blandscap(?:er|ing|ers)?\b/i],
    ["hairdressing", /\bhairdress(?:er|ing|ers)?\b|\bbarber\b/i],
    ["electrical", /\belectrician(?:s)?\b|\belectrical\b/i],
    ["carpentry", /\bcarpent(?:er|ry|ers)\b|\bjoiner(?:y|s)?\b/i],
    ["pet care", /\bdog walk(?:er|ing|ers)?\b|\bpet sitt(?:er|ing|ers)?\b|\bpet grooming\b/i],
    ["beauty", /\bbeauty salon\b|\bnail salon\b|\bbeautician(?:s)?\b/i],
    ["photography", /\bphotograph(?:er|y|ers)\b/i],
    ["accounting", /\baccountan(?:t|ts|cy)\b|\bbookkeep(?:er|ing|ers)\b/i]
  ];
  const suggestions = categories.filter(([, pattern]) => {
    const match = pattern.exec(text);
    if (!match) return false;
    const leading = text.slice(Math.max(0, match.index - 32), match.index);
    return !/(?:\b(?:not|never|don't|do not|isn't|aren't|no longer)\s+(?:an?\s+|in\s+|doing\s+|offering\s+)?|\b(?:used to|previously)\s+(?:do\s+|offer\s+)?)[^.!?]{0,15}$/i.test(leading);
  }).map(([value]) => ({
    field: "businessType", value, confidence: "inferred", approved: false,
    explanation: "Suggested from the owner's words; confirmation required."
  }));
  return { fields, suggestions, conflicts: [], excerpt: redact(original).slice(0, 160) };
}
/**
 * Builds a safe handoff for builders. Only already-approved business profile
 * fields are included. A conversation is never permission to publish.
 */
function buildApprovedCreationHandoff({ approved = {}, requestedSurfaces = [] } = {}) {
  const allowed = ["businessName", "businessType", "tagline", "description", "serviceArea", "phone", "email", "openingHours"];
  const facts = {};
  for (const field of allowed) {
    const value = trim(approved[field]).slice(0, 600);
    if (value) facts[field] = value;
  }
  const services = Array.isArray(approved.services) ? approved.services : [];
  facts.services = services.slice(0, 30).filter(item => trim(item?.name)).map(item => ({
    name: trim(item.name).slice(0, 120),
    description: trim(item.description).slice(0, 300)
  }));
  const targets = [...new Set(requestedSurfaces.filter(item => ["website", "business_app", "social"].includes(item)))];
  return {
    source: "approved_shared_business_profile",
    facts,
    targets,
    requiresSeparatePublicationApproval: true,
    unconfirmedConversationIncluded: false,
  };
}
function reviewConversation({ turns = [], approved = {}, previousDraft = {} } = {}) {
  const draft = { ...previousDraft };
  const conflicts = [];
  const suggestions = [];
  for (const turn of turns.slice(-30)) {
    const parsed = extractConversationTurn(turn);
    suggestions.push(...parsed.suggestions);
    for (const [key, candidate] of Object.entries(parsed.fields)) {
      if (trim(approved[key])) continue;
      if (draft[key] && draft[key].value !== candidate.value) {
        conflicts.push({ field: key, earlier: draft[key].value, latest: candidate.value, needsOwnerReview: true });
        delete draft[key];
      } else if (!conflicts.some(conflict => conflict.field === key)) draft[key] = candidate;
    }
  }
  const known = key => key === "contact"
    ? !!(trim(approved.phone) || trim(approved.email) || draft.phone || draft.email)
    : key === "services" ? (Array.isArray(approved.services) && approved.services.length > 0)
    : !!(trim(approved[key]) || draft[key]);
  const missing = FIELD_ORDER.filter(key => !known(key) && !conflicts.some(c => c.field === key));
  const nextQuestion = conflicts.length
    ? { field: conflicts[0].field, question: "You've given two different answers. Which one is correct?", conflict: conflicts[0] }
    : missing.length ? { field: missing[0], question: QUESTIONS[missing[0]] } : null;
  return {
    draft, conflicts, missing, nextQuestion,
    suggestions: unique(suggestions.map(s => s.value)).map(value => suggestions.find(s => s.value === value)),
    publicationAllowed: false,
    note: "Draft and inferred facts must be confirmed before being added to the shared profile."
  };
}
export { extractConversationTurn, reviewConversation, buildApprovedCreationHandoff };
