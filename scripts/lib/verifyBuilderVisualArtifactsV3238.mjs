/**
 * V3.238: verify bytes in an OFFLINE fictional Chromium screenshot packet.
 * Checks integrity, provenance labels and source matching only. SHA-256 is
 * not a signature/attestation; a self-reported packet can still be forged.
 * Never consume user/customer screenshots from a shared build artifact.
 */
import {readFileSync} from "node:fs";
import {resolve,join,relative,isAbsolute} from "node:path";
import {createHash} from "node:crypto";
import {reviewSharedBuilderMultiwidthEvidenceV3237}
 from "../../src/core/sharedBuilderMultiwidthEvidenceV3237.mjs";
const devices={phone:[390,844],tablet:[768,1024],desktop:[1440,900]};
const sha=x=>createHash("sha256").update(x).digest("hex");
const fail=reason=>({ok:false,reason,canApply:false,canPublish:false,
 liveCustomerEvidence:false,ownerApprovalRequired:true});
const pngSignature=Buffer.from([137,80,78,71,13,10,26,10]);
function pngDimensions(png){
 if(!Buffer.isBuffer(png)||png.length<65||png.length>6_000_000||
    !png.subarray(0,8).equals(pngSignature)||
    png.readUInt32BE(8)!==13||
    png.toString("ascii",12,16)!=="IHDR")return null;
 const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
 return width>=320&&width<=2200&&height>=400&&height<=15000?
  {width,height}:null;
}
function safeFixtureRoot(root){
 if(typeof root!=="string"||!root.startsWith("/"))return null;
 const resolved=resolve(root);
 return resolved==="/"||resolved.includes("\0")?null:resolved;
}
function readFixedArtifact(root,name){
 if(!/^(?:original|candidate)-(?:phone|tablet|desktop)\.png$/.test(name))
  throw Error("Non-fictional or unexpected capture filename.");
 const filepath=join(root,name);
 // Name whitelist keeps all reads inside a single known CI artifact root.
 if(isAbsolute(relative(root,filepath))||relative(root,filepath).startsWith(".."))
  throw Error("Invalid artifact location.");
 return readFileSync(filepath);
}
function verifyOfflineBuilderCapturePacketV3238({
 packet=null,artifactDir="",originalHtml="",candidateHtml="",
 businessId="",website=null,plan=null,pageId=""
}={}){
 const root=safeFixtureRoot(artifactDir);
 if(!root||packet?.kind!=="offline_builder_visual_capture_v3238"||
    packet?.fictionalOnly!==true||packet?.networkRequestsAllowed!==false||
    packet?.actualHostedCustomerSite!==false||
    packet?.screenshotsFromRealChromium!==true||
    packet?.source?.businessId!==businessId||
    packet?.source?.websiteId!==website?.id||
    packet?.source?.generation!==website?.generation||
    packet?.source?.pageId!==pageId||
    typeof originalHtml!=="string"||typeof candidateHtml!=="string"||
    originalHtml===candidateHtml||
    !originalHtml.startsWith("<!doctype html>")||
    !candidateHtml.startsWith("<!doctype html>")||
    packet?.source?.originalHtmlSha256!==sha(originalHtml)||
    packet?.source?.candidateHtmlSha256!==sha(candidateHtml))
  return fail("Only same-source, fictional, local Chromium evidence can be reviewed.");
 if(!Array.isArray(packet.captures)||packet.captures.length!==6)
  return fail("Six original/candidate screenshot captures are required.");
 const entries=[],seen=new Set();
 try{
  for(const capture of packet.captures){
   const name=capture?.device,variant=capture?.variant;
   if(!Object.hasOwn(devices,name)||
      !["original","candidate"].includes(variant)||
      seen.has(variant+"-"+name)||capture.file!==variant+"-"+name+".png"||
      capture.width!==devices[name][0]||
      capture.viewportHeight!==devices[name][1]||
      capture.report?.counts?.viewport!==capture.width||
      !Array.isArray(capture.report?.issues)||
      capture.htmlSha256!==packet.source[variant+"HtmlSha256"]||
      !/^[0-9a-f]{64}$/.test(capture.pngSha256)||
      !/^[0-9a-f]{64}$/.test(capture.reportSha256))
    return fail("Malformed, duplicated or mismatched screenshot record.");
   const buffer=readFixedArtifact(root,capture.file);
   const dimensions=pngDimensions(buffer);
   if(!dimensions||dimensions.width!==capture.width||
      dimensions.height<devices[name][1]|| // full-page PNG may be taller
      sha(buffer)!==capture.pngSha256||
      buffer.length!==capture.pngBytes||
      sha(JSON.stringify(capture.report))!==capture.reportSha256)
    return fail("Screenshot bytes or measurements do not match the manifest.");
   seen.add(variant+"-"+name);
   entries.push(capture);
  }
 }catch{return fail("A required local screenshot artifact was missing or unreadable.");}
 if(seen.size!==6)return fail("Original and candidate must each cover all three devices.");
 const paired=Object.keys(devices).map(device=>{
  const before=entries.find(e=>e.device===device&&e.variant==="original");
  const after=entries.find(e=>e.device===device&&e.variant==="candidate");
  return {device,width:devices[device][0],businessId,
   websiteId:website.id,generation:website.generation,pageId,
   original:before.report,candidate:after.report};
 });
 const compared=reviewSharedBuilderMultiwidthEvidenceV3237({
  businessId,website,plan,pageId,deviceReports:paired
 });
 if(!compared.ok)return fail(compared.reason);
 return {ok:true,kind:"verified_offline_visual_artifact_v3238",
  source:{...packet.source},screenshotCount:6,comparison:compared,
  manifestScreenshotHashesVerified:true,
  manifestReportHashesVerified:true,
  originalHtmlDigestMatched:true,candidateHtmlDigestMatched:true,
  offlineFixtureOnly:true,notCryptographicallyAttested:true,
  actualHostedCustomerSite:false,realBrowserScreenshotsOfFictionalWebsite:true,
  noRealAppNativeScreenshots:true,noVisualAestheticWinner:true,
  noCustomerJourneyProof:true,liveCustomerEvidence:false,
  eligibleForHumanVisualInspection:compared.eligibleForOwnerReview,
  ownerApprovalRequired:true,canApply:false,canPublish:false,
  canCharge:false,canContactCustomer:false};
}
export {verifyOfflineBuilderCapturePacketV3238,pngDimensions};
