import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {prepareCoordinatedGrowthDrafts} from "../src/domain/coordinatedGrowthDrafts.mjs";
import {createGrowthProject,reviewGrowthProject,markGrowthHandedOff} from "../src/domain/growthProjectWorkspace.mjs";
import {buildGrowthCommandCentre,resolveGrowthCommand} from "../src/domain/growthCommandCentre.mjs";

const owner="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const business="33333333-3333-4333-8333-333333333333";
const otherBusiness="44444444-4444-4444-8444-444444444444";
const approved={
  businessName:"Acme Services", serviceArea:"Devon",email:"hello@example.com",
  services:[{name:"Carpet Cleaning",description:"Carpet maintenance and stain removal."},
            {name:"Garden Maintenance",description:"Seasonal garden care."},
            {name:"Roof work",approved:false}],
};
const pack=(name,details=approved,own=owner,biz=business)=>
  prepareCoordinatedGrowthDrafts({approved:details,focusService:name,ownerId:own,businessId:biz});
const carpet=pack("Carpet Cleaning");
const garden=pack("Garden Maintenance");
const carpetProject=createGrowthProject(carpet);
const reviewed=reviewGrowthProject(carpetProject,"website",carpet);
const handed=markGrowthHandedOff(reviewed,"website",carpet);
const gardenProject=createGrowthProject(garden);
const records=[
  {service_key:"carpet cleaning",service_name:"Carpet Cleaning",draft_data:handed,updated_at:"2026-10-08T18:00:00Z",revision:2},
  {service_key:"garden maintenance",service_name:"Garden Maintenance",draft_data:gardenProject,updated_at:"2026-10-08T19:00:00Z",revision:1},
];
const read=(rec=records,profile=approved,extra={})=>buildGrowthCommandCentre({
  records:rec,approved:profile,ownerId:owner,businessId:business,...extra
});
const centre=read();
assert.equal(centre.state,"ready");
assert.equal(centre.counts.projects,2);
assert.equal(centre.counts.awaitingOwnerReview,2);
assert.equal(centre.next.serviceName,"Garden Maintenance"); // untouched draft before handed off
assert.equal(centre.projects[0].progress.published,0);
assert.equal(centre.projects[0].publicationVerified,false);
assert.equal(centre.projects[0].tasks.length,3);
assert.ok(centre.projects.every(x=>x.tasks.every(t=>t.isPublished===false)));
assert.equal(centre.projects.find(x=>x.serviceName==="Carpet Cleaning").progress.handedOff,1);
assert.equal(centre.projects.find(x=>x.serviceName==="Carpet Cleaning").progress.reviewed,1);

const status=resolveGrowthCommand("Where are we with Carpet Cleaning?",centre);
assert.equal(status.kind,"summary");
assert.equal(status.serviceName,"Carpet Cleaning");
assert.ok(status.message.includes("Public publication has not been verified"));
const resume=resolveGrowthCommand("Continue my Garden Maintenance project",centre);
assert.equal(resume.kind,"open_project");
assert.equal(resume.serviceName,"Garden Maintenance");
const approval=resolveGrowthCommand("Which marketing tasks need my approval?",centre);
assert.equal(approval.kind,"review");
assert.ok(approval.message.includes("private draft channel"));
assert.equal(resolveGrowthCommand("Publish Carpet Cleaning now",centre).kind,"not_supported");
assert.equal(resolveGrowthCommand("Delete all projects",centre).kind,"not_supported");
assert.equal(resolveGrowthCommand("Tell me a joke",centre).kind,"help");
assert.equal(resolveGrowthCommand("",centre).kind,"help");
assert.equal(resolveGrowthCommand("What's left?",read([])).kind,"empty");

// Do not render mismatched or corrupt source keys, even if a REST stub leaks a row.
const leak={...records[0],draft_data:createGrowthProject(pack("Carpet Cleaning",approved,other,business))};
assert.equal(read([leak]).projects.length,0);
const businessLeak={...records[0],draft_data:createGrowthProject(pack("Carpet Cleaning",approved,owner,otherBusiness))};
assert.equal(read([businessLeak]).projects.length,0);
const mismatchedName={...records[0],service_key:"garden maintenance"};
assert.equal(read([mismatchedName]).projects.length,0);
const malformed={...records[0],draft_data:{schema:1,serviceName:"Carpet Cleaning",sourceKey:"",items:[]}};
assert.equal(read([malformed]).projects.length,0);
assert.equal(read([records[0],records[0]]).counts.projects,1);
assert.equal(read([],approved,{ownerId:""}).state,"signed_out");
assert.equal(read([],approved,{businessId:""}).state,"signed_out");
assert.equal(read([],approved,{readFailed:true}).state,"unavailable");
assert.equal(read([],approved,{readFailed:true}).projects.length,0);

// Changed approved facts must invalidate earlier review and handoff badges.
const modified=read(records,{...approved,serviceArea:"Cornwall"});
assert.equal(modified.counts.projects,2);
assert.ok(modified.projects.every(p=>p.stale));
assert.ok(modified.projects.every(p=>p.next.action==="review_facts"));
assert.equal(modified.projects.find(p=>p.serviceName==="Carpet Cleaning").progress.reviewed,0);
// Removed service can be named only as its own private saved project; never active/confirmed.
const absent=read([records[0]],{...approved,services:[]});
assert.equal(absent.projects[0].confirmed,false);
assert.equal(absent.projects[0].next.action,"review_service");
assert.equal(resolveGrowthCommand("Continue Carpet Cleaning",absent).kind,"open_project");

// Explicit runtime integration: Home -> command centre -> preselected Business Creation workspace.
const screen=readFileSync(new URL("../src/screens/growthCommandCentre.js",import.meta.url),"utf8");
const index=readFileSync(new URL("../src/screens/index.js",import.meta.url),"utf8");
const controller=readFileSync(new URL("../src/app/AppController.js",import.meta.url),"utf8");
const home=readFileSync(new URL("../src/screens/home.js",import.meta.url),"utf8");
const journey=readFileSync(new URL("../src/screens/businessCreationJourney.js",import.meta.url),"utf8");
const cloud=readFileSync(new URL("../src/domain/growthProjectCloud.mjs",import.meta.url),"utf8");
for(const needle of [
  "listGrowthProjects(args)","buildGrowthCommandCentre({","resolveGrowthCommand(query,centre)",
  "scopeRef.current!==scope","setGrowthProjectFocus(serviceName)","s.openBusinessCreationJourney()",
  "private","Refresh private project progress",
]) assert.ok(screen.includes(needle),needle);
assert.ok(index.includes("growthCommandCentre: GrowthCommandCentre"));
assert.ok(home.includes('s.go("growthCommandCentre")'));
assert.ok(controller.includes("growthProjectFocus,") && controller.includes("setGrowthProjectFocus,"));
assert.ok(journey.includes("setGrowthServiceFocus(requested)"));
assert.ok(cloud.includes("select=service_name,service_key,revision,updated_at,draft_data"));
assert.ok(!screen.includes("saveGrowthProject("));
assert.ok(!screen.includes("publishHostedWebsite("));
assert.ok(!screen.includes("confirmPublish"));
console.log("V3.65 Growth Command Centre pure-state, permission and navigation checks passed");
