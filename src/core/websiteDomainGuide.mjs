/**
 * Customer-facing instructions from provider-authored records. Never guess
 * registrar-specific DNS settings or claim SSL is live without health proof.
 */
const clean=x=>String(x||"").trim();
const purposeLabel={
 ownership:"Prove domain ownership",
 traffic_routing:"Send website traffic to BUSY",
 ssl_certificate_validation:"Confirm secure HTTPS",
 cloudflare_hostname_ownership:"Confirm the domain at Cloudflare",
};
function domainDnsGuide({domain=null,stage="",records=[]}={}){
 const source=Array.isArray(records)?records:[];
 const result=[],seen=new Set();
 for(const r of source){
   const type=clean(r?.type).toUpperCase();
   const name=clean(r?.name);
   const value=clean(r?.value);
   if(!["TXT","CNAME","A","AAAA"].includes(type)||!name||!value)continue;
   const key=type+"|"+name.toLowerCase()+"|"+value;
   if(seen.has(key))continue;
   seen.add(key);
   result.push({type,name,value,label:purposeLabel[clean(r?.purpose)]||"Required DNS record"});
   if(result.length>=8)break;
 }
 if(!domain)return{
   status:"not-connected",records:[],nextAction:"Choose a domain you own.",
   explanation:"You can keep your current registrar. You do not need to transfer the domain to BUSY."
 };
 const pending=domain.status==="pending_verification"||stage==="ownership_required";
 if(pending&&result.length===0&&clean(domain.verification_token))
   result.push({type:"TXT",name:"_busy-verify."+clean(domain.hostname),
     value:clean(domain.verification_token),label:"Prove domain ownership"});
 const waiting=stage==="provider_queued"||stage==="route_verifying"||stage==="health_verifying";
 return {
   status:stage||"checking",records:result,
   nextAction:stage==="live"?"Your secure domain has been verified as live."
     :pending?"Add the TXT record at the company hosting your DNS, then check ownership."
     :stage==="dns_required"||stage==="needs_attention"
     ?"Add the DNS records shown, then ask BUSY to check again."
     :waiting?"BUSY is working on routing, HTTPS or a live connection check."
     :"Review the instructions from your DNS provider.",
   explanation:"DNS names below are full names. Some DNS dashboards append your domain automatically; check their format before saving to avoid repeating the name. Keep existing email MX records unchanged. DNS updates may take time to become visible.",
 };
}
export {domainDnsGuide};
