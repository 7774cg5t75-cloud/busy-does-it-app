import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {isVerifiedDomainTxtAnswer,txtValue} from "../supabase/functions/busy-website-publish/domainOwnership.mjs";
import {domainDnsGuide} from "../src/core/websiteDomainGuide.mjs";
import {designCss,designForWebsite} from "../supabase/functions/busy-website-worker/designSystem.mjs";
let n=0;
const same=(a,b,msg)=>{assert.deepEqual(a,b,msg);n++};
const yes=(a,msg)=>{assert.ok(a,msg);n++};
const hostname="www.example.co.uk",token="8d5ac8bf-2d8e-4f25-b4b6-6e9188d97f5a";
const reply={Status:0,Answer:[{name:"_busy-verify.www.example.co.uk.",type:16,data:'"'+token+'"'}]};
yes(isVerifiedDomainTxtAnswer(reply,{hostname,token}),"Correct exact proof authorises domain ownership");
same(isVerifiedDomainTxtAnswer({...reply,Status:3},{hostname,token}),false,"DNS error is not verification");
same(isVerifiedDomainTxtAnswer({...reply,Answer:[{...reply.Answer[0],type:5}]},{hostname,token}),false,"CNAME records cannot verify ownership");
same(isVerifiedDomainTxtAnswer({...reply,Answer:[{...reply.Answer[0],name:"_busy-verify.another.example.co.uk."}]},{hostname,token}),false,"Wrong hostname denied");
same(isVerifiedDomainTxtAnswer({...reply,Answer:[{...reply.Answer[0],data:'"prefix-'+token+'-suffix"'}]},{hostname,token}),false,"Partial token match denied");
same(isVerifiedDomainTxtAnswer({...reply,Answer:[{...reply.Answer[0],data:'"'+token+'" "extra"'}]},{hostname,token}),false,"Extra TXT chunks rejected");
same(isVerifiedDomainTxtAnswer({...reply,Answer:[]},{hostname,token}),false,"Missing TXT denied");
same(isVerifiedDomainTxtAnswer({...reply,Answer:[{...reply.Answer[0],data:'"different"'}]},{hostname,token}),false,"Unrelated TXT denied");
same(txtValue('"ab" "cd"'),"abcd","Multichunk TXT value is reassembled safely");
same(isVerifiedDomainTxtAnswer({Answer:reply.Answer},{hostname,token}),false,"Missing DNS response status denies verification");
same(isVerifiedDomainTxtAnswer(reply,{hostname:"example.co.uk",token}),false,"Apex and www ownership are independent");
const started=domainDnsGuide();
same(started.status,"not-connected","Start with ownership, not an imaginary live domain");
yes(started.explanation.includes("do not need to transfer"),"Customers can keep their registrar");
const state=domainDnsGuide({domain:{hostname,status:"pending_verification",verification_token:token},stage:"ownership_required",records:[]});
same(state.records[0],{type:"TXT",name:"_busy-verify."+hostname,value:token,label:"Prove domain ownership"},"Verify with exact DNS details, never guessed CNAME");
const valid=domainDnsGuide({domain:{hostname,status:"verified"},stage:"dns_required",
 records:[{type:"CNAME",name:hostname,value:"sites.busydoesit.co.uk",purpose:"traffic_routing"},
 {type:"CNAME",name:hostname,value:"sites.busydoesit.co.uk",purpose:"traffic_routing"},
 {type:"TXT",name:"_acme-challenge."+hostname,value:"test-validation",purpose:"ssl_certificate_validation"},
 {type:"INVALID",name:"fail",value:"no"},{type:"TXT",name:"",value:"no"}]});
same(valid.records.length,2,"Duplicate or invalid DNS records omitted");
same(valid.records[0].value,"sites.busydoesit.co.uk","Only provider-returned routing value is shown");
yes(valid.explanation.includes("email MX"),"Warn about email DNS safety");
yes(valid.nextAction.includes("Add the DNS records"),"Owner DNS action is explicit");
same(domainDnsGuide({domain:{hostname,status:"active"},stage:"live"}).records.length,0,"No fabricated DNS requirements after verification");
const css=designCss(designForWebsite({businessType:"Festival catering"}));
for(const marker of [
 "nav .nav-links a{display:inline-flex",
 "min-height:44px",
 "main a:not(.cta),main button",
 ".kicker,.eyebrow{font-size:.875rem",
 "p{max-width:68ch",
 ".visual-nav-pill .nav-links a{background:var(--soft);padding:10px 13px",
 ".family-boutique", ".family-editorial", ".family-conversion"
])yes(css.includes(marker),"Readable design system retains diverse layouts: "+marker);
const publish=readFileSync(new URL("../supabase/functions/busy-website-publish/index.ts",import.meta.url),"utf8");
yes(publish.includes('import {isVerifiedDomainTxtAnswer} from "./domainOwnership.mjs"'),"Live domain service imports strict verification");
yes(publish.includes("signal:AbortSignal.timeout(10000)"),"DNS verification is bounded");
yes(!publish.includes("value.includes(domain.data.verification_token)"),"Loose ownership comparison removed");
const ui=readFileSync(new URL("../src/screens/websitePublishing.js",import.meta.url),"utf8");
yes(ui.includes("domainDnsGuide({domain"),"Customer domain screen uses identical guided records");
yes(ui.includes('left="Record name"'),"DNS name is separately readable");
yes(ui.includes('left="Record value"'),"DNS value is separately readable");
console.log("V3.108 PASS: "+n+" domain TXT security, clear self-service guidance and readable website-design controls.");
