import assert from "node:assert/strict";
import { extractConversationTurn, reviewConversation, buildApprovedCreationHandoff } from "../src/domain/conversationUnderstanding.mjs";
const first = extractConversationTurn("My business is called Acme Services. We're based in Exeter. I do plumbing.");
assert.equal(first.fields.businessName.value, "Acme Services");
assert.equal(first.fields.businessName.approved, false);
assert.equal(first.fields.serviceArea.value, "Exeter");
assert.equal(first.suggestions[0].confidence, "inferred");
const review = reviewConversation({turns:["My business is called Acme Services.", "My business is called Other Services."]});
assert.equal(review.conflicts[0].field, "businessName");
assert.equal(review.nextQuestion.field, "businessName");
assert.equal(review.publicationAllowed, false);
const approved = reviewConversation({turns:["My business is called Wrong Name."],approved:{businessName:"Approved Ltd"}});
assert.equal(approved.draft.businessName, undefined);
assert.ok(!approved.missing.includes("businessName"));
const untrusted = extractConversationTurn("Email me at hello@example.com and call 01234567890");
assert.ok(!untrusted.excerpt.includes("hello@example.com"));
assert.ok(!untrusted.excerpt.includes("01234567890"));
assert.equal(reviewConversation({}).nextQuestion.field, "businessName");
const inline = extractConversationTurn("My business is called Acme Services and we cover Exeter.");
assert.equal(inline.fields.businessName.value, "Acme Services");
assert.equal(inline.fields.serviceArea.value, "Exeter");
const confirmedDraft = reviewConversation({
  turns: ["My business is called Acme Services and we cover Exeter."],
  approved: { businessName: "Acme Services", serviceArea: "Exeter", services: [{name:"Emergency plumbing"}] }
});
assert.equal(confirmedDraft.draft.businessName, undefined);
assert.equal(confirmedDraft.draft.serviceArea, undefined);
assert.equal(confirmedDraft.publicationAllowed, false);
const handoff = buildApprovedCreationHandoff({
  approved: { businessName: "Approved Ltd", services: [{ name: "Boiler service", description: "Annual" }] },
  requestedSurfaces: ["website", "business_app", "social", "publish", "website"]
});
assert.deepEqual(handoff.targets, ["website", "business_app", "social"]);
assert.equal(handoff.facts.businessName, "Approved Ltd");
assert.equal(handoff.facts.services.length, 1);
assert.equal(handoff.unconfirmedConversationIncluded, false);
assert.equal(handoff.requiresSeparatePublicationApproval, true);
assert.ok(!("publish" in handoff.facts));
console.log("V3.60 conversation understanding tests passed");
