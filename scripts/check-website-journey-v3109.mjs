import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {requestedDnsRecords,evaluateDnsAnswer,summarizeDnsChecks}
  from "../supabase/functions/busy-website-publish/domainDnsDiagnostics.mjs";
let n=0;
const eq=(a,b,label)=>{assert.deepEqual(a,b,label);n++};
const yes=(a,label)=>{assert.ok(a,label);n++};
const id="c79ac701-9138-45da-85f3-abf9d5b7a011";
const domain={id,hostname:"www.samplebusiness.co.uk",status:"pending_verification",
 verification_token:"19ac133d-75ae-48c7-97e2-c2f23e19df45",
 required_records:[]};
const ownership=requestedDnsRecords(domain);
eq(ownership.length,1,"Unprovisioned domain gets only its real ownership record");
eq(ownership[0].name,"_busy-verify.www.samplebusiness.co.uk","Ownership name contains exact customer hostname");
eq(ownership[0].value,domain.verification_token,"Ownership value is sourced from the tenant's record");
const txt=(value,name=ownership[0].name,type=16)=>({
 Status:0,Answer:[{name:name+".",type,data:'"'+value+'"'}]
});
eq(evaluateDnsAnswer(ownership[0],txt(domain.verification_token)).status,"matching","Exact TXT proof is publicly visible");
eq(evaluateDnsAnswer(ownership[0],txt("prefix-"+domain.verification_token)).status,"not-visible","TXT substring is not proof");
eq(evaluateDnsAnswer(ownership[0],txt(domain.verification_token,"_busy-verify.other.co.uk")).status,"not-visible","Different DNS host is not proof");
eq(evaluateDnsAnswer(ownership[0],txt(domain.verification_token,ownership[0].name,5)).status,"not-visible","CNAME response is not TXT proof");
eq(evaluateDnsAnswer(ownership[0],{Status:3}).status,"not-visible","Missing DNS name is waiting");
eq(evaluateDnsAnswer(ownership[0],null).status,"unavailable","Network errors are unknown, never claimed safe");
eq(evaluateDnsAnswer(ownership[0],{Status:0,Answer:[]}).status,"not-visible","Empty DNS is not a match");
const provider={...domain,status:"verified",required_records:[
 {purpose:"traffic_routing",type:"CNAME",name:domain.hostname,value:"sites.busydoesit.co.uk"},
 {purpose:"traffic_routing",type:"CNAME",name:domain.hostname,value:"untrusted-other.example"},
 {purpose:"ssl_certificate_validation",type:"TXT",name:"_acme-challenge."+domain.hostname,value:"proof-token"},
 {purpose:"traffic_routing",type:"CNAME",name:"someone-else.com",value:"wrong.example"},
 {purpose:"traffic_routing",type:"AAAA",name:domain.hostname,value:"2001:db8::1"},
 {purpose:"ownership",type:"TXT",name:ownership[0].name,value:domain.verification_token}]};
const records=requestedDnsRecords(provider);
eq(records.length,4,"Only correct domain-scoped, de-duplicated records queried");
yes(records.every(x=>x.name===domain.hostname||x.name.endsWith("."+domain.hostname)),
 "A malicious database DNS record cannot force a remote lookup outside this domain");
const cname=records.find(x=>x.type==="CNAME");
eq(evaluateDnsAnswer(cname,{Status:0,Answer:[{name:cname.name+".",type:5,data:"sites.busydoesit.co.uk."}]}).status,
 "matching","Trailing DNS dot does not break a legitimate CNAME");
eq(evaluateDnsAnswer(cname,{Status:0,Answer:[{name:cname.name,type:5,data:"other-provider.co.uk."}]}).status,
 "different","Wrong CNAME target is explained rather than silently accepted");
eq(evaluateDnsAnswer(cname,{Status:0,Answer:[{name:cname.name,type:1,data:"1.2.3.4"}]}).status,
 "not-visible","Flattened A result does not pretend a CNAME is proven");
const zero=summarizeDnsChecks([]);
eq(zero.status,"no-records","No provider records does not mean connected");
const all=summarizeDnsChecks([{status:"matching"},{status:"matching"}]);
eq(all.status,"records-visible","DNS match is only a public-record fact");
yes(all.message.includes("HTTPS")&&all.message.includes("separate"),"No fabricated SSL/publishing proof");
eq(summarizeDnsChecks([{status:"matching"},{status:"different"}]).status,"needs-attention","Conflicting DNS is surfaced clearly");
eq(summarizeDnsChecks([{status:"matching"},{status:"not-visible"}]).status,"waiting","DNS propagation is acknowledged");
eq(summarizeDnsChecks([{status:"unavailable"}]).status,"check-unavailable","DNS lookup error remains distinguishable");
const server=readFileSync(new URL("../supabase/functions/busy-website-publish/index.ts",import.meta.url),"utf8");
const controller=readFileSync(new URL("../src/app/AppController.js",import.meta.url),"utf8");
const ui=readFileSync(new URL("../src/screens/websitePublishing.js",import.meta.url),"utf8");
yes(server.includes('"inspect_domain_dns",')&&
 server.includes('if(action==="inspect_domain_dns")')&&
 server.includes('.eq("id",domainId).eq("business_id",businessId)'),
 "Live backend scopes read-only diagnostics by authenticated owner and business");
yes(server.includes('readOnly:true')&&server.includes('providerNotProvisioned:true')&&
 server.includes('websiteHealthNotVerified:true'),"Never mark a domain or public website as ready from a DNS query");
yes(server.includes("AbortSignal.timeout(8500)"),"Public DNS requests have a hard timeout");
yes(controller.includes('websitePublishingRequest("inspect_domain_dns",{domainId})'),
 "Mobile application uses the owner's authenticated gateway");
yes(ui.indexOf('label={showDomainSetup ? "Hide domain setup"') <
 ui.indexOf('<Text style={styles.sectionLabel}>Preview and publish</Text>'),
 "Domain choice now comes before technical publishing details");
yes(ui.includes("Your website address")&&
 ui.includes("A custom domain is optional"),"Clear address choice without launch pressure");
yes(ui.includes("Check my DNS records (no changes)"),"Owner has a read-only diagnostics action");
yes(ui.includes("Checking DNS does not activate hosting"),"No false claims from visibility checks");
console.log("V3.109 PASS: "+n+" DNS checks, owner permissions, conservative status and simple first-screen domain choice.");
