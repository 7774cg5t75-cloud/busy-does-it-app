/**
 * V3.151 guarded visual-designer pass engine.
 *
 * Only finite changes to the classes of an immutable, independently hosted
 * preview may be staged. Source facts, photos, links, metadata and CSS are
 * copied byte-for-byte. A real trusted screenshot capture and model comparison
 * must succeed for each accepted pass; no scores are fabricated.
 *
 * Browser, cloud persistence and metered model calls live in caller-provided
 * TRUSTED server adapters; this module itself performs no I/O or publication.
 */
import {normalizeVisualCritique} from "./visualCriticContract.mjs";
const MAX_PASSES=3;
const MAX_HTML_CHARS=500000;
const FIELDS=Object.freeze({
 "theme.heroLayout":{prefix:"visual-hero",values:["image-right","image-left","image-feature","image-frame","type-left","type-right","type-center","type-poster"]},
 "theme.cardLayout":{prefix:"visual-cards",values:["cards","outlines","rows"]},
 "theme.navStyle":{prefix:"visual-nav",values:["quiet","underline","pill"]},
 "theme.ornament":{prefix:"visual-ornament",values:["ripple","arch","glow","stripes"]},
 "theme.typography":{prefix:"visual-type",values:["confident","refined","compact"]},
 "theme.spacing":{prefix:"rhythm",values:["comfortable","generous"]}
});
const failed=reason=>({ok:false,reason,passes:[],bestChanges:[],published:false,changesApplied:false});
function validSource(html,deploymentId){
 if(typeof html!=="string"||html.length<300||html.length>MAX_HTML_CHARS||
  !/^<!doctype html>/i.test(html)||!/^[-a-f0-9]{36}$/i.test(deploymentId))return false;
 const deployment='<meta name="busy-deployment" content="'+deploymentId+'">';
 return html.includes(deployment)&&
  (html.match(/<body\b/gi)||[]).length===1&&
  (html.match(/<body\b[^>]*class="/gi)||[]).length===1&&
  (html.match(/<\/body>/gi)||[]).length===1&&
  (html.match(/<style>/gi)||[]).length===1&&
  !html.includes("data-busy-edit-section")&&
  !html.includes("busy.contextual-action.v1");
}
function stageHostedDesignToken(html,change,{deploymentId}={}){
 if(!validSource(html,deploymentId))return {ok:false,reason:"Trusted hosted HTML is missing or unsuitable."};
 const entry=FIELDS[change?.path];
 if(!entry||!entry.values.includes(change?.value))
  return {ok:false,reason:"Only explicitly approved visual design tokens may be changed."};
 // Modify EXACTLY one body class attribute. Never accept CSS, arbitrary URLs,
 // HTML/JS, content or data supplied by an untrusted model or owner input.
 const body=/<body\b[^>]*class="([^"]*)"[^>]*>/i.exec(html);
 if(!body)return {ok:false,reason:"Website design identity is missing."};
 const tokens=body[1].split(/\s+/);
 const matched=tokens.map((token,i)=>token.startsWith(entry.prefix+"-")?i:-1)
  .filter(i=>i>=0);
 if(matched.length!==1)return {ok:false,reason:"Website has ambiguous design classes."};
 const existing=tokens[matched[0]];
 const candidate=entry.prefix+"-"+change.value;
 if(existing===candidate)return {ok:false,reason:"That design setting is already active."};
 tokens[matched[0]]=candidate;
 const patchedBody=body[0].replace('class="'+body[1]+'"','class="'+tokens.join(" ")+'"');
 const revised=html.slice(0,body.index)+patchedBody+html.slice(body.index+body[0].length);
 if(revised.length>MAX_HTML_CHARS||!validSource(revised,deploymentId))
  return {ok:false,reason:"The private candidate is too large or invalid."};
 return {ok:true,html:revised,change:{path:change.path,value:change.value,
  reason:String(change.reason||"").slice(0,180)}};
}
function verifyScreenshotPair(pair){
 return !!(pair&&pair.verified===true&&
  typeof pair.mobile==="string"&&pair.mobile.length>80&&
  typeof pair.desktop==="string"&&pair.desktop.length>80);
}
async function runPrivateWebsiteDesignLoop({html,deploymentId,firstReport,
 maxPasses=2,approvedPhotos=0,baseline},adapters={}){
 if(!Number.isSafeInteger(maxPasses)||maxPasses<1||maxPasses>MAX_PASSES)
  return failed("Design passes must be between one and three.");
 if(!validSource(html,deploymentId))return failed("Only an exact private hosted preview can be checked.");
 if(!verifyScreenshotPair(baseline))
  return failed("The original mobile and desktop screenshots are not verified.");
 if(!firstReport?.valid||firstReport.providerConfirmed!==true||
    firstReport.source!=="actual-screenshot-review"||
    firstReport.requiresOwnerReview!==true)
  return failed("A verified visual AI review must start the process.");
 if(typeof adapters.captureCandidate!=="function"||
    typeof adapters.compareScreenshots!=="function")
  return failed("Trusted screenshot capture and critique are not configured.");
 const passes=[],changes=[],taken=new Set();
 let currentHtml=html,report=firstReport,reference=baseline;
 for(let i=0;i<maxPasses;i++){
  const proposals=Array.isArray(report.proposals)?report.proposals:[];
  let staged=null;
  for(const proposal of proposals){
   if(!proposal||taken.has(proposal.path))continue;
   const candidate=stageHostedDesignToken(currentHtml,proposal,{deploymentId});
   if(candidate.ok){staged=candidate;break;}
  }
  if(!staged)break;
  let images,verdict;
  try{
   images=await adapters.captureCandidate({html:staged.html,deploymentId,pass:i+1});
   if(!verifyScreenshotPair(images))throw Error("Renderer did not verify both screen widths.");
   verdict=await adapters.compareScreenshots({
    baseline:reference,candidate:images,pass:i+1,
    approvedPhotos,maxPasses
   });
  }catch{
   passes.push({pass:i+1,status:"rejected",reason:"The trusted screenshot or visual comparison did not complete."});
   break;
  }
  // Reject claims that do not come from actual mobile AND desktop screenshots.
  if(!verdict?.reviewedScreenshots||!["better","worse","unclear"].includes(verdict.verdict)){
   passes.push({pass:i+1,status:"rejected",reason:"No verified AI comparison was returned."});
   break;
  }
  if(verdict.verdict!=="better"){
   passes.push({pass:i+1,status:"rejected",reason:"The AI did not establish a safer visual improvement on both screens."});
   break;
  }
  const normalized=normalizeVisualCritique({...verdict,reviewedScreenshots:true},
    {approvedPhotos});
  if(!normalized.valid){
   passes.push({pass:i+1,status:"rejected",reason:"The next AI suggestions were not safe."});
   break;
  }
  currentHtml=staged.html;
  changes.push(staged.change);
  taken.add(staged.change.path);
  reference=images;
  report=normalized;
  passes.push({pass:i+1,status:"accepted",
   path:staged.change.path,value:staged.change.value,
   reason:String(verdict.reason||"Compared both rendered views.").slice(0,180)});
 }
 return {ok:true,deploymentId,passes,bestChanges:changes,
  completedPasses:passes.filter(x=>x.status==="accepted").length,
  automaticEvaluation:true,requiresOwnerApproval:true,
  published:false,changesApplied:false,
  caveat:"An AI comparison found an improvement in verified screenshots; this does not certify design quality or accessibility."};
}
export {MAX_PASSES,FIELDS,validSource,stageHostedDesignToken,
 verifyScreenshotPair,runPrivateWebsiteDesignLoop};
