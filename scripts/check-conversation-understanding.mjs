import { readFileSync } from "node:fs";
import { validateAiConversationDraft } from "../src/domain/conversationAiBoundary.mjs";
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

const duplicateCreate = await saveCloudConversation({
  ...scope, brief:"private", fetchImpl:async () => ({ok:false,status:409})
});
assert.equal(duplicateCreate.saved,false);
assert.equal(duplicateCreate.conflict,true);
assert.equal(duplicateCreate.errorCode,"create_conflict");
console.log("V3.60 cloud duplicate revision protection tests passed");

const businessKinds = [
 ["I am an electrician serving Devon", "electrical"],
 ["We operate a dog walking service", "pet care"],
 ["I'm a photographer for weddings", "photography"],
 ["We provide bookkeeping for small companies", "accounting"],
 ["We run a nail salon", "beauty"],
 ["I do joinery", "carpentry"]
];
for (const [words, expected] of businessKinds) {
 const parsed = extractConversationTurn(words);
 assert.ok(parsed.suggestions.some(item=>item.value===expected && item.approved===false), words);
}
console.log("V3.60 multi-industry classification checks passed");

assert.equal(extractConversationTurn("For example, my business is called Imaginary Ltd.").fields.businessName,undefined);
assert.equal(extractConversationTurn("We do not offer plumbing, we provide catering.").suggestions.some(x=>x.value==="plumbing"),false);
assert.equal(extractConversationTurn("We do not offer plumbing, we provide catering.").suggestions.some(x=>x.value==="catering"),true);
console.log("V3.60 hypothetical and negation protection checks passed");

const mixedExample = extractConversationTurn("My business is called Real Services. For example, imagine we sold cars. We cover Exeter.");
assert.equal(mixedExample.fields.businessName.value, "Real Services");
assert.equal(mixedExample.fields.serviceArea.value, "Exeter");
assert.equal(extractConversationTurn("For example, my business is called Imaginary Ltd.").fields.businessName, undefined);
console.log("V3.60 mixed examples and real statement preservation passed");

const aiInput = {
  transcript: "We cover Devon and our company is called Acme Ltd.",
  extraction: { fields: {
    businessName: { value:"Acme Ltd", evidence:"our company is called Acme Ltd" },
    serviceArea: { value:"Devon", evidence:"We cover Devon" },
    published: { value:"true", evidence:"We cover Devon" },
    email: { value:"invented@example.com", evidence:"invented@example.com" }
  }}
};
const checked = validateAiConversationDraft(aiInput);
assert.equal(checked.fields.businessName.approved,false);
assert.equal(checked.fields.businessName.confidence,"unverified");
assert.equal(checked.fields.serviceArea.value,"Devon");
assert.equal(checked.fields.email,undefined);
assert.ok(checked.rejected.includes("published"));
assert.equal(checked.publicationAllowed,false);
const override=validateAiConversationDraft({...aiInput,approved:{businessName:"Verified Ltd"}});
assert.equal(override.fields.businessName,undefined);
console.log("V3.60 AI draft evidence boundary checks passed");

const unsupportedAiValue = validateAiConversationDraft({
 transcript: "We cover Devon, but haven't chosen a name.",
 extraction: { fields: { businessName: { value: "Invented Brand", evidence: "We cover Devon" } } }
});
assert.equal(unsupportedAiValue.fields.businessName, undefined);
assert.ok(unsupportedAiValue.rejected.includes("businessName"));
console.log("V3.60 AI evidence/value consistency checks passed");

const controllerCode = readFileSync(new URL("../src/app/AppController.js", import.meta.url), "utf8");
const journeyCode = readFileSync(new URL("../src/screens/businessCreationJourney.js", import.meta.url), "utf8");
const endpointCode = readFileSync(new URL("../supabase/functions/busy-conversation-extract/index.ts", import.meta.url), "utf8");
assert.ok(controllerCode.includes("suggestBusinessFactsWithAi"));
assert.ok(controllerCode.includes("validateAiConversationDraft({"));
assert.ok(controllerCode.includes("conversationAiDraft({ ...validation, transcript }") === false || controllerCode.includes("setConversationAiDraft({ ...validation, transcript })"));
assert.ok(journeyCode.includes("s.conversationAiDraft?.transcript === String(s.businessCreationBrief"));
assert.ok(journeyCode.includes("s.confirmConversationFact(key, item.value)"));
assert.ok(endpointCode.includes('created_by=eq.'));
assert.ok(endpointCode.includes('auth/v1/user'));
assert.ok(endpointCode.includes('store:false'));
assert.ok(endpointCode.includes('publicationAllowed:false'));
console.log("V3.60 AI extraction wiring and approval gate checks passed");

const quotaSchema = readFileSync(new URL("../supabase/migrations/20261008004000_v3_60_conversation_ai_daily_quota.sql", import.meta.url), "utf8");
assert.ok(endpointCode.includes('busy_try_conversation_ai_quota'));
assert.ok(endpointCode.includes('daily_ai_limit_reached'));
assert.ok(endpointCode.indexOf('busy_try_conversation_ai_quota') < endpointCode.indexOf('await fetch("https://api.openai.com/v1/responses"'));
assert.ok(quotaSchema.includes('security invoker'));
assert.ok(quotaSchema.includes('revoke all on function public.busy_try_conversation_ai_quota'));
assert.ok(quotaSchema.includes('grant execute on function public.busy_try_conversation_ai_quota(uuid,uuid) to service_role'));
console.log("V3.60 server enforced AI quota and cost guard checks passed");

const cloudSaveGuard = controllerCode.slice(controllerCode.indexOf('const saveConversationToCloud'), controllerCode.indexOf('const suggestBusinessFactsWithAi'));
assert.ok(cloudSaveGuard.includes('if (conversationCloudScope !== scoped)'));
assert.ok(cloudSaveGuard.includes('setConversationCloudScope("")'));
assert.ok(cloudSaveGuard.includes('setConversationCloudRevision(null)'));
assert.ok(cloudSaveGuard.indexOf('setConversationCloudScope("")') < cloudSaveGuard.indexOf('return false;'));
console.log("V3.60 cloud existing-draft overwrite guard checks passed");

const proposedServices = validateAiConversationDraft({
  transcript: "We offer gutter clearing and pressure washing.",
  extraction: {fields:{}, services:[
    {name:"gutter clearing",evidence:"We offer gutter clearing"},
    {name:"roof replacement",evidence:"pressure washing"},
    {name:"gutter clearing",evidence:"We offer gutter clearing"}
  ]}
});
assert.equal(proposedServices.services.length,1);
assert.equal(proposedServices.services[0].approved,false);
assert.equal(proposedServices.services[0].name,"gutter clearing");
assert.ok(proposedServices.rejected.includes("services"));
assert.equal(proposedServices.publicationAllowed,false);
assert.ok(endpointCode.includes('candidate.services.slice(0,12)'));
assert.ok(journeyCode.includes('Possible service (unconfirmed)'));
console.log("V3.60 AI service evidence and review boundary checks passed");
