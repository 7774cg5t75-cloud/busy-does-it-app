import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {expectedSiteOrigin,formReadiness,cleanPublicSubmission,verifiedChallenge}
 from "../supabase/functions/busy-website-form/formPolicy.mjs";
import {renderOptInContactForm}
 from "../supabase/functions/busy-website-worker/formHtml.mjs";
import {validatedLeadInput,buildLeadDigest}
 from "../supabase/functions/busy-website-publish/leadWorkflow.mjs";

const checkedAt=new Date().toISOString();
const site={
 health_status:"healthy",delivery_status:"active",
 last_health_check_at:checkedAt,last_healthy_at:checkedAt,
 last_observed_deployment_id:"33333333-3333-4333-8333-333333333333",
 id:"11111111-1111-4111-8111-111111111111",
 business_id:"22222222-2222-4222-8222-222222222222",
 current_live_deployment_id:"33333333-3333-4333-8333-333333333333",
 public_form_enabled:true,default_hostname:"plumber.busydoesit.co.uk"
};
const yes=formReadiness(site,{globalEnabled:true,hasSecret:true});
assert.equal(yes.ready,true);
assert.equal(yes.expectedOrigin,"https://plumber.busydoesit.co.uk");
for(const name of ["localhost","127.0.0.1","sub.plumber.busydoesit.co.uk",
 "plumber.busydoesit.co.uk.evil.com","https://plumber.busydoesit.co.uk",
 "plumber.busydoesit.co.uk/path","PLUMBER.busydoesit.co.uk"]){
 assert.equal(expectedSiteOrigin({...site,default_hostname:name}),null,name);
}
assert.equal(formReadiness(site,{globalEnabled:false,hasSecret:true}).ready,false);
assert.equal(formReadiness(site,{globalEnabled:true,hasSecret:false}).ready,false);
assert.equal(formReadiness({...site,public_form_enabled:false},{globalEnabled:true,hasSecret:true}).ready,false);
assert.equal(formReadiness({...site,current_live_deployment_id:null},{globalEnabled:true,hasSecret:true}).ready,false);
assert.equal(formReadiness({...site,health_status:"degraded"},{globalEnabled:true,hasSecret:true}).ready,false);
assert.equal(formReadiness({...site,delivery_status:"provisioning"},{globalEnabled:true,hasSecret:true}).ready,false);
assert.equal(formReadiness({...site,last_observed_deployment_id:"00000000-0000-4000-8000-000000000000"},{globalEnabled:true,hasSecret:true}).ready,false);
assert.equal(formReadiness({...site,last_health_check_at:"2020-01-01T00:00:00Z"},{globalEnabled:true,hasSecret:true}).ready,false);
assert.equal(formReadiness({...site,business_id:"not-uuid"},{globalEnabled:true,hasSecret:true}).ready,false);
const input={
 siteId:site.id,idempotencyKey:"web-123456789",
 name:"Sample Visitor",contactMethod:"email",contactValue:"test@example.com",
 contactPermissionConfirmed:true,service:"Plumbing",
 notes:"Can you quote for a repair?",turnstileToken:"token_with_length_1234",trap:""
};
assert.ok(cleanPublicSubmission(input));
assert.equal(validatedLeadInput(input).ok,true);
for(const mutated of [
 {...input,trap:"bot",siteId:site.id},
 {...input,turnstileToken:"abc"},
 {...input,siteId:"evil"},
 {...input,admin:true}
])assert.equal(cleanPublicSubmission(mutated),null);
assert.equal(validatedLeadInput({...input,contactPermissionConfirmed:false}).ok,false);
assert.equal(verifiedChallenge({success:true,hostname:site.default_hostname,action:"busy_website_enquiry"},site.default_hostname),true);
for(const bad of [
 {success:false,hostname:site.default_hostname,action:"busy_website_enquiry"},
 {success:true,hostname:"attacker.com",action:"busy_website_enquiry"},
 {success:true,hostname:site.default_hostname,action:"other_action"}
])assert.equal(verifiedChallenge(bad,site.default_hostname),false);

const template={
 siteId:site.id,siteHostname:site.default_hostname,
 siteKey:"0x4AAAAAA_test_public_sitekey",
 endpoint:"https://qgkmuiipicazmcxxmoxv.supabase.co/functions/v1/busy-website-form"
};
assert.equal(renderOptInContactForm({...template,enabled:false}),"");
assert.equal(renderOptInContactForm({...template,enabled:true,siteHostname:"attacker.com"}),"");
assert.equal(renderOptInContactForm({...template,enabled:true,endpoint:"https://attacker.com/ingest"}),"");
assert.equal(renderOptInContactForm({...template,enabled:true,siteKey:"bad' \" unsafe"}),"");
const html=renderOptInContactForm({...template,enabled:true});
assert.ok(html.includes("Request a quote or ask a question"));
assert.ok(html.includes("Contact this business"));
assert.ok(html.includes("data-action=\"busy_website_enquiry\""));
assert.ok(html.includes("Private hosted preview: form submissions are disabled"));
assert.ok(html.includes("location.origin!==cfg.expectedOrigin"));
assert.ok(html.includes("contactPermissionConfirmed:form.elements.namedItem(\"permission\").checked"));
assert.ok(html.includes("turnstileToken:token.value"));
assert.ok(!html.includes("SUPABASE_SERVICE_ROLE_KEY"));
assert.ok(!html.includes("BUSY_TURNSTILE_SECRET_KEY"));

const privateRows=[
 {id:"a",name:"A",contact_method:"email",contact_value:"a@example.com",
  source:"owner_entered",status:"new",service_requested:"Service A"},
 {id:"b",name:"B",contact_method:"email",contact_value:"b@example.com",
  source:"website_form",status:"new",service_requested:"Service B"}
];
const summary=buildLeadDigest(privateRows);
assert.equal(summary.trackedWebsiteContacts,1);
assert.equal(summary.recent[0].source,"owner_entered");
assert.equal(summary.recent[1].source,"website_form");
assert.equal(summary.recent[1].replyDraft.autoSent,false);
assert.equal(summary.recent[1].replyDraft.requiresOwnerApproval,true);
assert.equal(summary.recent[1].verifiedBooking,false);

const endpoint=readFileSync(new URL("../supabase/functions/busy-website-form/index.ts",import.meta.url),"utf8");
const worker=readFileSync(new URL("../supabase/functions/busy-website-worker/index.ts",import.meta.url),"utf8");
const migration=readFileSync(new URL("../supabase/migrations/20261009110000_v3_79_public_form_gates.sql",import.meta.url),"utf8");
const creator=readFileSync(new URL("../supabase/migrations/20261009111500_v3_79_form_source_creator.sql",import.meta.url),"utf8");
const app=readFileSync(new URL("../src/screens/websitePublishing.js",import.meta.url),"utf8");
const ci=readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8");
assert.ok(endpoint.includes('const ENABLED=Deno.env.get("BUSY_WEBSITE_FORM_INTAKE_ENABLED")==="true"'));
assert.ok(endpoint.indexOf('if(!ENABLED||!CHALLENGE_SECRET||!service)')<
 endpoint.indexOf('const site=await service.from("busy_websites")'));
assert.ok(endpoint.indexOf("verifiedChallenge(proof")<
 endpoint.indexOf('const site=await service.from("busy_websites")'));
assert.ok(endpoint.indexOf("verifiedChallenge(proof")<
 endpoint.indexOf('service.rpc("busy_claim_website_form_quota"'));
assert.ok(endpoint.indexOf('service.rpc("busy_claim_website_form_quota"')<
 endpoint.indexOf('.from("busy_website_leads")'));
assert.ok(endpoint.includes('source:"website_form"'));
assert.ok(endpoint.includes('created_by:null'));
assert.ok(!endpoint.includes("Authorization:\"Bearer"));
assert.ok(endpoint.includes('gate.expectedOrigin!==origin'));
assert.ok(endpoint.includes('site.data.default_hostname'));
assert.ok(migration.includes("default false"));
assert.ok(migration.includes("security invoker"));
assert.ok(migration.includes("revoke all on function public.busy_claim_website_form_quota"));
assert.ok(migration.includes("where public.busy_website_form_quota.submissions < 12"));
assert.ok(migration.includes("busy-v379-form-quota-retention"));
assert.ok(creator.includes("source='website_form' and created_by is null"));
assert.ok(worker.includes('import {renderOptInContactForm} from "./formHtml.mjs"'));
assert.ok(worker.includes('import {formReadiness} from "./formPolicy.mjs"'));
assert.equal((worker.match(/renderOptInContactForm\(/g)||[]).length,3);
assert.ok((worker.match(/page.id==="home"\|\|page.id==="contact"\?optedInFormHtml/g)||[]).length===4);
assert.ok(app.includes("Challenge-verified website contacts"));
assert.ok(app.includes("Suggested reply, NOT sent:"));
assert.ok(ci.includes("node scripts/check-customer-success-v379.mjs"));
console.log("V3.79 PASS: closed-by-default forms, strict site origin, Turnstile action/host matching, quotas, replay protection, preview parity and honest lead attribution");
