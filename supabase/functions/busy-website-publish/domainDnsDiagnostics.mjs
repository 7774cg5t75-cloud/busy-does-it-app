/**
 * V3.109 read-only DNS evidence. Public resolver responses are untrusted.
 * This never establishes ownership, creates Cloudflare resources or
 * publishes anything. Exact record comparisons are deliberately conservative.
 */
import {canonicalDnsName,txtValue} from "./domainOwnership.mjs";
const allowedTypes=new Set(["TXT","CNAME","A","AAAA"]);
const typeNumber={TXT:16,CNAME:5,A:1,AAAA:28};
const validDnsName=name=>name.length<=253 &&
  name.split(".").every(label=>/^(?:_[a-z0-9-]{1,62}|[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)$/i.test(label));
function requestedDnsRecords(domain,max=8){
 const host=canonicalDnsName(domain?.hostname),seen=new Set();
 if(!validDnsName(host))return [];
 const source=Array.isArray(domain?.required_records)?domain.required_records:[];
 const records=source.filter(r=>r?.purpose==="ownership"||domain?.status!=="pending_verification");
 if(domain?.status==="pending_verification"&&!records.some(r=>r?.purpose==="ownership"))
   records.push({purpose:"ownership",type:"TXT",name:"_busy-verify."+host,value:domain.verification_token});
 return records.flatMap(record=>{
   const type=String(record?.type||"").toUpperCase(),name=canonicalDnsName(record?.name);
   const value=String(record?.value||"").trim();
   if(!allowedTypes.has(type)||!validDnsName(name)||
     !(name===host||name.endsWith("."+host))||!value||value.length>500)return [];
   const key=type+":"+name;
   if(seen.has(key))return [];
   seen.add(key);
   return [{type,name,value,purpose:String(record?.purpose||"").slice(0,50)}];
 }).slice(0,max);
}
const canonicalValue=(type,s)=>type==="TXT"?txtValue(s):
  ["A","AAAA"].includes(type)?String(s||"").trim().toLowerCase():
  canonicalDnsName(s);
function evaluateDnsAnswer(record,response){
 const type=String(record?.type||"").toUpperCase(),name=canonicalDnsName(record?.name);
 const expected=canonicalValue(type,record?.value);
 if(!allowedTypes.has(type)||!validDnsName(name)||!expected)
   return {status:"unavailable",message:"No safe DNS record to check."};
 if(!response||!Number.isInteger(response.Status))
   return {status:"unavailable",message:"Public DNS could not be checked. Try again later."};
 if(response.Status===3)return {status:"not-visible",message:"This DNS name is not visible yet. It may still be updating."};
 if(response.Status!==0)return {status:"unavailable",message:"The DNS lookup is temporarily unavailable."};
 const matches=(Array.isArray(response.Answer)?response.Answer:[]).filter(a=>
   Number(a?.type)===typeNumber[type]&&canonicalDnsName(a?.name)===name);
 if(matches.some(a=>canonicalValue(type,a.data)===expected))
   return {status:"matching",message:"Matching public DNS record found."};
 if(type==="TXT")
   return {status:"not-visible",message:"The exact verification TXT value is not visible yet."};
 if(matches.length)return {status:"different",message:"DNS has a different value for this record. Check your DNS settings."};
 return {status:"not-visible",message:"No matching record is currently visible. Some DNS providers flatten CNAME records; this check alone cannot determine website health."};
}
function summarizeDnsChecks(checks=[]){
 if(!checks.length)return {status:"no-records",message:"BUSY has not received the DNS records for this step yet."};
 const failures=checks.filter(x=>x.status==="different").length;
 const matched=checks.filter(x=>x.status==="matching").length;
 const waiting=checks.filter(x=>x.status==="not-visible").length;
 const errors=checks.filter(x=>x.status==="unavailable").length;
 const status=failures?"needs-attention":errors?"check-unavailable":waiting?"waiting":"records-visible";
 return {status,matched,total:checks.length,
   message:failures?"At least one DNS record has a different value. Review the details below.":
     errors?"Some DNS lookups could not be completed. No settings were changed.":
     waiting?"Some required DNS records are not visible yet. Allow time for DNS updates.":
     "All checked records match public DNS. HTTPS and the live website still need separate verification."};
}
export {requestedDnsRecords,evaluateDnsAnswer,summarizeDnsChecks};
