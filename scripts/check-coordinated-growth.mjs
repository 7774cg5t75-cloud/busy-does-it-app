import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { confirmedServices, buildCoordinatedGrowthPlan } from "../src/domain/coordinatedGrowthPlan.mjs";

const empty=buildCoordinatedGrowthPlan({approved:{businessName:"Acme"},focusService:"Unverified"});
assert.equal(empty.valid,false);
assert.equal(empty.publicationAllowed,false);
assert.deepEqual(empty.actions,[]);

const approved={
 businessName:"Acme Services",serviceArea:"Devon",email:"hello@example.com",
 services:[{name:"Stump Removal",description:"Grind and remove unwanted tree stumps."},
           {name:"Stump Removal",description:"Duplicate"},
           {name:"Roof Repair",approved:false},
           {name:"Unconfirmed Cleaning",status:"draft"}]
};
assert.deepEqual(confirmedServices(approved).map(s=>s.name),["Stump Removal"]);
const plan=buildCoordinatedGrowthPlan({approved,focusService:"  stump removal "});
assert.equal(plan.valid,true);
assert.equal(plan.service.name,"Stump Removal");
assert.equal(plan.actions.length,3);
assert.deepEqual(plan.actions.map(a=>a.target),["website","business_app","social"]);
assert.equal(plan.reviewable,3);
assert.equal(plan.publicationAllowed,false);
assert.equal(plan.requiresOwnerConfirmation,true);
assert.ok(plan.actions.every(a=>a.requiresOwnerApproval && !a.published && !a.automaticallyApplied));
assert.ok(plan.actions.every(a=>a.status==="ready_for_review"));
assert.ok(plan.actions[0].task.includes("Stump Removal"));
assert.ok(plan.actions[1].note.includes("enquiry"));
assert.ok(!JSON.stringify(plan).includes("Roof Repair"));

const missingContact=buildCoordinatedGrowthPlan({approved:{...approved,email:"",phone:"",serviceArea:""},focusService:"Stump Removal"});
assert.deepEqual(missingContact.actions.map(a=>a.status),["blocked","blocked","ready_for_review"]);
assert.deepEqual(missingContact.actions[0].blockedBy,["service_area","public_contact"]);
assert.equal(missingContact.reviewable,1);
const reduced=buildCoordinatedGrowthPlan({approved,focusService:"Stump Removal",requestedTargets:["social","website","social","publish"]});
assert.deepEqual(reduced.targets,["website","social"]);
assert.equal(reduced.actions.length,2);
assert.deepEqual(reduced.actions.map(a=>a.priority),[1,2]);

const otherTenant=buildCoordinatedGrowthPlan({approved:{businessName:"Other",services:[{name:"Yoga"}]},focusService:"Stump Removal"});
assert.equal(otherTenant.valid,false);
assert.equal(buildCoordinatedGrowthPlan({approved,focusService:"Stump Removal"}).reviewable,3);
assert.deepEqual(buildCoordinatedGrowthPlan({approved,focusService:"Stump Removal"}),plan);
assert.equal(buildCoordinatedGrowthPlan({approved,focusService:"Roof Repair"}).valid,false);

const screen=readFileSync(new URL("../src/screens/businessCreationJourney.js",import.meta.url),"utf8");
assert.ok(screen.includes("buildCoordinatedGrowthPlan({approved:approvedProfile,focusService:growthServiceFocus})"));
assert.ok(screen.includes("setGrowthServiceFocus(service.name)"));
assert.ok(screen.includes("action.blockedBy"));
assert.ok(screen.includes("Nothing is automatically published") || screen.includes("Nothing is published from this journey") || screen.includes("nothing or posting online"));
console.log("V3.62 coordinated growth planning tests passed");
