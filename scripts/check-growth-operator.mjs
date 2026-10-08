import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {prepareCoordinatedGrowthDrafts} from "../src/domain/coordinatedGrowthDrafts.mjs";
import {createGrowthProject,reviewGrowthProject} from "../src/domain/growthProjectWorkspace.mjs";
import {buildGrowthCommandCentre} from "../src/domain/growthCommandCentre.mjs";
import {classifyGrowthUtterance,resolveGrowthOperator} from "../src/domain/growthOperatorBridge.mjs";

const owner="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const business="33333333-3333-4333-8333-333333333333";
const elsewhere="44444444-4444-4444-8444-444444444444";
const scope=owner+":"+business;
const approved={
 businessName:"Acme Services",serviceArea:"Devon",email:"hello@example.com",
 services:[{name:"Carpet cleaning",description:"Steam cleaning"},
 {name:"Pressure washing",description:"Domestic patios"},
 {name:"Unconfirmed repairs",approved:false}],
};
const make=(service,details=approved,ownerId=owner,businessId=business)=>{
 const pack=prepareCoordinatedGrowthDrafts({
   approved:details,ownerId,businessId,focusService:service,
 });
 const draft=createGrowthProject(pack);
 return {pack,draft};
};
const carpet=make("Carpet cleaning");
const washing=make("Pressure washing");
const carpetReviewed=reviewGrowthProject(carpet.draft,"website",carpet.pack);
const rows=[
 {service_name:"Carpet cleaning",service_key:"carpet cleaning",draft_data:carpetReviewed,revision:2,updated_at:"2026-10-08T12:00:00Z"},
 {service_name:"Pressure washing",service_key:"pressure washing",draft_data:washing.draft,revision:1,updated_at:"2026-10-08T10:00:00Z"},
];
const centre=buildGrowthCommandCentre({records:rows,approved,ownerId:owner,businessId:business});
assert.equal(centre.projects.length,2);
const context={scope,serviceName:"Carpet cleaning"};
const classify=(t,x={})=>classifyGrowthUtterance(t,{activeContext:false,projectNames:centre.projects.map(p=>p.serviceName),...x});
assert.equal(classify("Morning, where are we with carpet cleaning?").growth,true);
assert.equal(classify("Where are we with my business growth project?").growth,true);
assert.equal(classify("Continue my carpet cleaning project").growth,true);
assert.equal(classify("Continue my calendar booking").growth,false);
assert.equal(classify("What's my schedule today?").growth,false);
assert.equal(classify("Publish my carpet cleaning project now").forbidden,true);
assert.equal(classify("Show me the website wording",{activeContext:true}).growth,true);
assert.equal(classify("Show me the website wording").growth,false);
assert.equal(classify("Open that project",{activeContext:true}).growth,true);
assert.equal(classify("Open that project").growth,true);
assert.equal(classify("Publish that now",{activeContext:true}).growth,true);
assert.equal(classify("Publish that now",{activeContext:false}).growth,false); // explicit "project", but not enough to infer which.
assert.equal(classify("What about the website?",{activeContext:true}).growth,true);
const state=(t,opts={})=>resolveGrowthOperator(t,centre,{scope,focus:null,...opts});
const check=state("Where are we with carpet cleaning?");
assert.equal(check.kind,"summary");
assert.equal(check.serviceName,"Carpet cleaning");
assert.ok(check.message.includes("1 of 3 private drafts reviewed"));
assert.ok(check.message.includes("Public publication has not been verified"));
assert.equal(state("Continue my carpet cleaning project").kind,"open_project");
assert.equal(state("Continue my carpet cleaning project").action,true);
const withFocus=t=>state(t,{focus:context});
const next=withFocus("Open that project");
assert.equal(next.kind,"open_project");
assert.equal(next.serviceName,"Carpet cleaning");
const website=withFocus("Show me the website wording");
assert.equal(website.kind,"open_project");
assert.equal(website.channel,"website");
assert.ok(website.message.includes("private"));
assert.equal(withFocus("What about the website?").kind,"summary");
assert.equal(state("Open that project").kind,"clarify");
assert.equal(state("Where are we with all my growth projects?").handled,true);
assert.equal(state("What is left to do?").handled,false); // generic daily task not stolen
assert.equal(state("Continue my calendar booking").handled,false);
assert.equal(state("Launch my carpet cleaning project now").kind,"blocked");
assert.equal(state("Publish my carpet cleaning project now").kind,"blocked");
assert.equal(state("Delete my project").kind,"blocked");
assert.equal(withFocus("Publish that now").kind,"blocked");
assert.equal(withFocus("Delete this now").kind,"blocked");
assert.equal(state("Open that project",{focus:{scope:owner+":"+elsewhere,serviceName:"Carpet cleaning"}}).kind,"clarify");
assert.equal(state("Open that project",{focus:{scope,serviceName:"Nonexistent"}}).kind,"clarify");
const changed=buildGrowthCommandCentre({
 records:rows,approved:{...approved,serviceArea:"Cornwall"},ownerId:owner,businessId:business,
});
assert.equal(resolveGrowthOperator("Where are we with carpet cleaning?",changed,{scope}).kind,"summary");
assert.ok(resolveGrowthOperator("Where are we with carpet cleaning?",changed,{scope}).message.includes("needs re-review"));
const noProjects=buildGrowthCommandCentre({ownerId:owner,businessId:business});
assert.equal(resolveGrowthOperator("Show my growth projects",noProjects,{scope}).kind,"empty");
const unavailable=buildGrowthCommandCentre({ownerId:owner,businessId:business,readFailed:true});
assert.equal(resolveGrowthOperator("Show my growth projects",unavailable,{scope}).kind,"unavailable");
const crossOwner=buildGrowthCommandCentre({records:rows,approved,ownerId:other,businessId:business});
assert.equal(crossOwner.projects.length,0);
const crossBusiness=buildGrowthCommandCentre({records:rows,approved,ownerId:owner,businessId:elsewhere});
assert.equal(crossBusiness.projects.length,0);
assert.equal(resolveGrowthOperator("Open that project",crossBusiness,{scope,focus:context}).kind,"empty");

const app=readFileSync(new URL("../src/app/AppController.js",import.meta.url),"utf8");
const core=readFileSync(new URL("../src/core/runtime.js",import.meta.url),"utf8");
const talk=readFileSync(new URL("../src/screens/talk.js",import.meta.url),"utf8");
for(const requirement of [
 "classifyGrowthUtterance,resolveGrowthOperator",
 "listGrowthProjects(args)",
 "buildGrowthCommandCentre({records",
 "tryGrowthOperator(cleanText,growthNonce)",
 "tryGrowthOperator(result.transcript,growthNonce)",
 "growthOperatorRequestRef.current+=1",
 "growthOperatorScopeRef.current===scope",
 "growthProjectName",
 'case "growth_project_open":',
 "setGrowthProjectFocus(command.growthProjectName)",
 'go("businessCreationJourney")',
]) assert.ok(app.includes(requirement),requirement);
assert.ok(talk.includes("s.submitBusyCommand({ audioUri: audioRecorder.uri })"));
assert.ok(talk.includes("s.submitBusyCommand({ text })"));
assert.ok(core.includes("BUSY_COMMAND_URL"));
assert.ok(app.includes("growthProjectTarget"));
assert.ok(app.includes("setGrowthProjectTarget(result.growthProjectTarget"));
const journeyFile=readFileSync(new URL("../src/screens/businessCreationJourney.js",import.meta.url),"utf8");
assert.ok(journeyFile.includes("Load selected private cloud project"));
// The growth bridge must never send provider requests, write cloud checkpoints,
// or touch website/app/social publishing endpoints.
const bridge=readFileSync(new URL("../src/domain/growthOperatorBridge.mjs",import.meta.url),"utf8");
assert.ok(!bridge.includes("fetch("));
assert.ok(!bridge.includes("saveGrowthProject"));
assert.ok(!bridge.includes("publishHostedWebsite"));
assert.ok(!bridge.includes("publishSocial"));
console.log("V3.66 voice-transcript and typed growth Operator conversation regressions passed");
