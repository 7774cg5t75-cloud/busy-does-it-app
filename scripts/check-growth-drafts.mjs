import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import {
  prepareCoordinatedGrowthDrafts,
  isCurrentGrowthDraftPack,
  editGrowthDraft,
} from "../src/domain/coordinatedGrowthDrafts.mjs";

const approved = {
  businessName: "Acme Cleaning",
  businessType: "Cleaning",
  serviceArea: "Devon",
  email: "hello@acme.example",
  phone: "",
  services: [
    {name: "Carpet cleaning", description: "Domestic carpet cleaning."},
    {name: "Carpet cleaning", description: "Duplicate"},
    {name: "Unapproved roof repair", approved: false},
    {name: "Pending plumbing", status: "pending"},
  ],
};
const build = (data = approved, changes = {}) => prepareCoordinatedGrowthDrafts({
  approved: data,
  focusService: "carpet cleaning",
  ownerId: "owner-1",
  businessId: "business-1",
  ...changes,
});
const pack = build();
assert.equal(pack.valid, true);
assert.equal(pack.publicationAllowed, false);
assert.equal(pack.requiresOwnerApproval, true);
assert.deepEqual(pack.items.map(item => item.target), ["website", "business_app", "social"]);
assert.ok(pack.items.every(item => item.status === "editable_draft" && !item.published && item.requiresOwnerApproval));
assert.equal(pack.items[0].text, "Domestic carpet cleaning.");
assert.ok(pack.items[1].text.includes("enquiry option"));
assert.ok(pack.items[1].text.includes("Do not create a confirmed booking"));
assert.ok(pack.items[2].text.includes("Acme Cleaning offers Carpet cleaning in Devon."));
assert.ok(pack.items[2].text.includes("Enquiries: hello@acme.example"));
assert.ok(!JSON.stringify(pack).includes("Unapproved roof repair"));
assert.ok(!JSON.stringify(pack).includes("Pending plumbing"));
assert.ok(!JSON.stringify(pack).includes("Duplicate"));
assert.equal(build(approved, {focusService: "Unapproved roof repair"}).valid, false);
assert.equal(build(approved, {focusService: "Pending plumbing"}).valid, false);
assert.equal(build(approved, {ownerId: ""}).valid, false);
assert.deepEqual(build(approved, {ownerId: ""}).items, []);

const missing = build({...approved, email:"", serviceArea:""});
assert.deepEqual(missing.items.map(item => item.status), ["blocked","blocked","editable_draft"]);
assert.equal(missing.items[0].text, "");
assert.equal(missing.items[1].text, "");
assert.ok(!missing.items[2].text.includes("in Devon"));
assert.equal(editGrowthDraft(missing,"website","unsafe").items[0].text, "");
assert.equal(build({...approved,services:[]}).valid, false);

const updated = editGrowthDraft(pack, "social", "  Friendly owner-edited social copy.  ");
assert.equal(updated.items[2].text, "Friendly owner-edited social copy.");
assert.equal(updated.items[2].ownerEdited, true);
assert.equal(updated.items[0].text, pack.items[0].text);
assert.equal(pack.items[2].ownerEdited, false);
assert.equal(editGrowthDraft(pack, "social", "x".repeat(2000)).items[2].text.length, 800);
assert.ok(isCurrentGrowthDraftPack(pack, build()));
assert.ok(!isCurrentGrowthDraftPack(pack, build(approved,{ownerId:"owner-2"})));
assert.ok(!isCurrentGrowthDraftPack(pack, build(approved,{businessId:"business-2"})));
assert.ok(!isCurrentGrowthDraftPack(pack, build({...approved,services:[{name:"Carpet cleaning",description:"New approved description."}]})));
assert.ok(!isCurrentGrowthDraftPack(pack, build(approved,{focusService:"Unapproved roof repair"})));
assert.ok(!isCurrentGrowthDraftPack(null, build()));

const screen = readFileSync(new URL("../src/screens/businessCreationJourney.js", import.meta.url),"utf8");
const website = readFileSync(new URL("../src/domain/websiteBuilder.js", import.meta.url),"utf8");
assert.ok(screen.includes("isCurrentGrowthDraftPack(growthDraftPack, candidateDraftPack)"));
assert.ok(screen.includes("setGrowthDraftPack(current=>editGrowthDraft(current,target,text))"));
assert.ok(screen.includes("applyCoordinatedWebsiteCopy({"));
assert.ok(screen.includes("s.setWebsiteDraft(websiteResult.draft)"));
assert.ok(screen.includes("s.openMiniAppBuilder()"));
assert.ok(screen.includes("s.startSocialFromPhone()"));
assert.ok(screen.includes("s.setSocialBrief(item.text)"));
assert.ok(!screen.includes("handOffGrowthCopy(\"publish\")"));
assert.ok(website.includes("function applyCoordinatedWebsiteCopy("));
assert.ok(website.includes("draft: withHtml({...draft, sections})"));
assert.ok(website.includes('["draft", "pending"]'));
// Exercise the actual website copy-update implementation without an Expo bundle.
// The page-model import is replaced with a pure identity adapter for the test.
const executableWebsite = website
  .replace(/^import \{ syncWebsitePageModel \} from "\.\/websiteManagement";\s*/, "")
  .replace(/export \{[\s\S]*?\};\s*$/, "");
const websiteEnv = {syncWebsitePageModel: draft => draft};
runInNewContext(executableWebsite + "\n globalThis.applyCopyForTest = applyCoordinatedWebsiteCopy;", websiteEnv);
const applyCopy = websiteEnv.applyCopyForTest;
const websiteDraft = {
  id: "private-website", businessName: "Acme Cleaning",
  seo: {title:"Acme", description:"Private test"}, theme: {},
  sections: [
    {id:"services",type:"services",title:"Services",enabled:true,items:[{id:"carpet",title:"Carpet cleaning",body:"Old text"}]},
  ],
};
const webEdited = applyCopy({draft:websiteDraft, approved,serviceName:"Carpet cleaning",text:"Owner-reviewed wording."});
assert.equal(webEdited.applied,true);
assert.equal(websiteDraft.sections[0].items[0].body,"Old text");
assert.equal(webEdited.draft.sections[0].items[0].body,"Owner-reviewed wording.");
assert.ok(webEdited.draft.html.includes("Owner-reviewed wording."));
assert.equal(webEdited.draft.publicStatus, undefined);
assert.equal(applyCopy({draft:websiteDraft,approved,serviceName:"Unapproved roof repair",text:"Unsafe"}).applied,false);
assert.equal(applyCopy({draft:websiteDraft,approved,serviceName:"Carpet cleaning",text:" "}).applied,false);
assert.equal(applyCopy({draft:null,approved,serviceName:"Carpet cleaning",text:"Test"}).applied,false);
assert.equal(applyCopy({draft:websiteDraft,approved:{services:[]},serviceName:"Carpet cleaning",text:"Unsafe"}).applied,false);

console.log("V3.63 coordinated editable growth drafts: all Node assertions passed");
