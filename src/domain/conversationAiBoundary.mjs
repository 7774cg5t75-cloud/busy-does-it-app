/** V3.60 defensive boundary for future server-side AI extraction.
 * Model output is untrusted and must never directly update Business Brain.
 */
const ALLOWED = new Set(["businessName","businessType","serviceArea","description","openingHours","phone","email"]);
const clean = v => typeof v === "string" ? v.trim() : "";
function validateAiConversationDraft({ extraction, transcript, approved = {} } = {}) {
  const source = clean(transcript).slice(0,6000);
  const fields = {};
  const rejected = [];
  if (!source || !extraction || typeof extraction !== "object" || Array.isArray(extraction)) {
    return { fields, rejected: ["invalid_extraction"], approvalRequired: true, publicationAllowed: false };
  }
  const proposed = extraction.fields;
  if (!proposed || typeof proposed !== "object" || Array.isArray(proposed)) {
    return { fields, rejected: ["invalid_fields"], approvalRequired: true, publicationAllowed: false };
  }
  for (const [key, item] of Object.entries(proposed).slice(0,30)) {
    if (!ALLOWED.has(key)) { rejected.push(key); continue; }
    const value = clean(item?.value);
    const quote = clean(item?.evidence);
    if (!value || value.length > 300 || !quote || quote.length > 300 ||
        !source.toLowerCase().includes(quote.toLowerCase()) ||
        !quote.toLowerCase().includes(value.toLowerCase()) ||
        clean(approved[key])) { rejected.push(key); continue; }
    // Evidence is required, but not sufficient to establish truth.
    fields[key] = { value, evidence: quote, source: "ai_candidate", confidence: "unverified", approved: false };
  }
  const proposedServices = extraction.services;
  const services = [];
  if (Array.isArray(proposedServices)) {
    for (const item of proposedServices.slice(0, 12)) {
      const name = clean(item?.name);
      const evidence = clean(item?.evidence);
      if (!name || name.length > 100 || !evidence || evidence.length > 300 ||
          !source.toLowerCase().includes(evidence.toLowerCase()) ||
          !evidence.toLowerCase().includes(name.toLowerCase())) {
        rejected.push("services");
        continue;
      }
      if (!services.some(service => service.name.toLowerCase() === name.toLowerCase())) {
        services.push({ name, evidence, approved: false, source: "ai_candidate" });
      }
    }
  } else if (proposedServices !== undefined) rejected.push("services");
  return { fields, services, rejected, approvalRequired: true, publicationAllowed: false };
}
export { validateAiConversationDraft };
