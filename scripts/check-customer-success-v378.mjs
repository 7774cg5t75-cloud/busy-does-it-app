import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validatedLeadInput,validTransition,buildLeadDigest} from "../supabase/functions/busy-website-publish/leadWorkflow.mjs";

const base={
  idempotencyKey:"lead-test-0001",name:"Sample Customer",
  contactMethod:"email",contactValue:"hello@example.com",
  service:"Gutter cleaning",notes:"Call next week",
  contactPermissionConfirmed:true
};
const yes=validatedLeadInput(base);
assert.equal(yes.ok,true);
assert.equal(yes.record.source,"owner_entered");
assert.equal(yes.record.status,"new");
assert.equal(yes.record.contact_permission_confirmed,true);
assert.equal(yes.record.request_key,base.idempotencyKey);
for(const invalid of [
 {...base,contactPermissionConfirmed:false},
 {...base,contactPermissionConfirmed:undefined},
 {...base,idempotencyKey:"bad"},
 {...base,name:""},
 {...base,contactMethod:"text"},
 {...base,contactValue:"not an address"},
 {...base,service:"A".repeat(161)},
 {...base,notes:"X".repeat(1201)}
]) assert.equal(validatedLeadInput(invalid).ok,false);
assert.equal(validatedLeadInput({...base,contactMethod:"phone",contactValue:"+44 7700 900000"}).ok,true);
assert.equal(validTransition("new","reviewing"),true);
assert.equal(validTransition("reviewing","quoted"),true);
assert.equal(validTransition("reviewing","booked"),true);
assert.equal(validTransition("quoted","booked"),true);
assert.equal(validTransition("booked","closed"),true);
for(const [from,to] of [
 ["new","booked"],["quoted","new"],["closed","new"],
 ["new","new"],["injected","quoted"],["booked","quoted"]])
 assert.equal(validTransition(from,to),false);
const records=[
 {id:"A",name:"Sample",contact_method:"email",contact_value:"c@example.com",status:"new",
  service_requested:"Gutter cleaning",notes:"",created_at:"2026-10-09"},
 {id:"B",name:"Sample 2",contact_method:"phone",contact_value:"07700900999",status:"quoted",
  service_requested:"Catering",notes:"",created_at:"2026-10-09"},
 {id:"C",name:"Sample 3",contact_method:"phone",contact_value:"07700900123",status:"booked",
  service_requested:"Plumbing",notes:"",created_at:"2026-10-09"}
];
const digest=buildLeadDigest(records);
assert.equal(digest.sampled,3);
assert.equal(digest.counts.new,1);
assert.equal(digest.counts.quoted,1);
assert.equal(digest.counts.booked,1);
assert.equal(digest.trackedWebsiteContacts,0);
assert.equal(digest.recent[2].verifiedBooking,false);
assert.equal(digest.recent[2].messageSent,false);
assert.equal(buildLeadDigest(null).status,"unavailable");
assert.equal(buildLeadDigest(records.concat(Array(100).fill(records[0]))).recent.length,25);
const sql=readFileSync(new URL("../supabase/migrations/20261009100000_v3_78_private_lead_followup.sql",import.meta.url),"utf8");
const edge=readFileSync(new URL("../supabase/functions/busy-website-publish/index.ts",import.meta.url),"utf8");
const controller=readFileSync(new URL("../src/app/AppController.js",import.meta.url),"utf8");
const ui=readFileSync(new URL("../src/screens/websitePublishing.js",import.meta.url),"utf8");
const workflow=readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8");
assert.ok(sql.includes("unique(business_id,request_key)"));
assert.ok(sql.includes("on delete cascade"));
assert.ok(sql.includes("alter table public.busy_website_leads enable row level security"));
assert.ok(sql.includes("revoke all on public.busy_website_leads from public, anon, authenticated"));
assert.ok(sql.includes("grant select,insert,update on public.busy_website_leads to service_role"));
assert.ok(sql.includes("source='owner_entered'"));
assert.ok(sql.includes("contact_permission_confirmed boolean not null check (contact_permission_confirmed)"));
for(const action of ["lead_list","lead_add","lead_update"]){
 assert.ok(edge.includes('"'+action+'"'));
 assert.ok(edge.indexOf('"'+action+'"')<edge.indexOf("const member = await membership("));
}
assert.ok(edge.includes('writeActions.has(action)'));
assert.ok(edge.includes('.eq("business_id",businessId)'));
assert.ok(edge.includes('.eq("status",expected)'));
assert.ok(edge.includes('validatedLeadInput(body)'));
assert.ok(edge.includes('insert(values).select("id").single()'));
assert.ok(edge.includes('duplicate.error.code')===false); // duplicate code is on inserted.error
assert.ok(edge.includes('inserted.error.code!=="23505"'));
assert.ok(edge.includes('status:"new"')===false); // status is validated in helper
assert.ok(controller.includes('const createWebsiteLead=async(input)'));
assert.ok(controller.includes('const changeWebsiteLeadStatus=async('));
assert.ok(controller.includes("listWebsiteLeads,"));
assert.ok(ui.includes("Lead Capture & Follow-up"));
assert.ok(ui.includes("showEnquiries ? ("));
assert.ok(ui.includes("contactPermissionConfirmed:true"));
assert.ok(ui.toLowerCase().includes("owner-entered"));
assert.ok(ui.includes("booked label is not proof of payment"));
assert.ok(ui.includes("leadScopeRef.current!==scope"));
assert.ok(workflow.includes("node scripts/check-customer-success-v378.mjs"));
console.log("V3.78 PASS: consent and contact validation, no duplicate leads, private owner/admin access, bounded lists, manual outcomes and no automatic customer messages");
