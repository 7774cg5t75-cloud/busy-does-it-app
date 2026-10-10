/**
 * Tenant domain TXT ownership verification. The DNS resolver is untrusted input.
 * Never treat a token substring, wrong owner hostname, or an A/CNAME answer
 * as proof of control. This module has no side effects or network calls.
 */
const canonicalDnsName=value=>String(value||"").trim().toLowerCase().replace(/\.$/,"");
function txtValue(raw){
 const value=String(raw||"").trim();
 if(/^"[^"]*"(?:\s+"[^"]*")*$/.test(value))
   return [...value.matchAll(/"([^"]*)"/g)].map(part=>part[1]).join("");
 if(/^[a-zA-Z0-9-]+$/.test(value))return value;
 return "";
}
function isVerifiedDomainTxtAnswer(payload,{hostname="",token=""}={}){
 const expected="_busy-verify."+canonicalDnsName(hostname);
 if(!token||!/^[a-z0-9][a-z0-9-]{15,159}$/i.test(token)||
    !/^_busy-verify\.[a-z0-9.-]+$/.test(expected))return false;
 if(Number(payload?.Status)!==0||!Array.isArray(payload?.Answer))return false;
 return payload.Answer.some(answer=>
   Number(answer?.type)===16 &&
   canonicalDnsName(answer?.name)===expected &&
   txtValue(answer?.data)===token
 );
}
export {isVerifiedDomainTxtAnswer,canonicalDnsName,txtValue};
