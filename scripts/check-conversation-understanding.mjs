import { loadCloudConversation, saveCloudConversation } from "../src/domain/conversationCloud.mjs";
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

const scope = {
  businessId:"11111111-1111-4111-8111-111111111111",
  userId:"22222222-2222-4222-8222-222222222222",
  accessToken:"test-token",publishableKey:"test-publishable",
  supabaseUrl:"https://example.supabase.co"
};
const calls=[];
const mocked = async (url, options) => {
  calls.push({url, options});
  return {ok:true,status:200,json:async()=> options.method==="PATCH" ? [] : [{brief:"private note",revision:2}]};
};
const loaded=await loadCloudConversation({...scope,fetchImpl:mocked});
assert.equal(loaded.revision,2);
const conflict=await saveCloudConversation({...scope,brief:"draft",revision:2,fetchImpl:mocked});
assert.equal(conflict.saved,false);
assert.equal(conflict.conflict,true);
assert.ok(calls[1].url.includes("revision=eq.2"));
assert.equal(JSON.parse(calls[1].options.body).revision,3);
await assert.rejects(()=>loadCloudConversation({...scope,businessId:"wrong",fetchImpl:mocked}));
assert.equal(calls.length,2);
console.log("V3.60 cloud draft transport checks passed");

const failingCreate = await saveCloudConversation({
  ...scope, brief:"Private", fetchImpl:async () => ({ok:false,status:404,json:async()=>({})})
});
assert.equal(failingCreate.saved,false);
assert.equal(failingCreate.conflict,false);
assert.equal(failingCreate.errorCode,"create_failure");
console.log("V3.60 cloud error classification checks passed");
