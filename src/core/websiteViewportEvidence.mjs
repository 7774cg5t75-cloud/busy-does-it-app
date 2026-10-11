/**
 * V3.147 layout evidence is attached to one private website revision/page.
 * A phone-sized WebView does NOT prove desktop quality. Reports from other
 * pages, older generations or different customers must never count.
 */
function classifyWidth(width){
 if(!Number.isSafeInteger(width)||width<250||width>3000)return null;
 return width<=480?"phone":width>=960?"wide":"tablet";
}
function recordWebsiteViewportEvidence(previous,{draftId,generation,pageId,report}={}){
 if(typeof draftId!=="string"||!draftId||typeof pageId!=="string"||!pageId||
   !Number.isSafeInteger(generation)||generation<0||
   !report?.counts||typeof report.passed!=="boolean"||!Array.isArray(report.issues))
  return previous||null;
 const width=report.counts.viewport,bucket=classifyWidth(width);
 if(!bucket)return previous||null;
 const key=[draftId,generation,pageId].join(":");
 const current=previous?.key===key?previous:{key,checks:{}};
 const counts=report.counts;
 const entry={width,checked:true,commonIssues:report.issues.map(x=>x.id).slice(0,15),
  noCommonWarnings:report.passed===true};
 return {key,checks:{...current.checks,[bucket]:entry}};
}
function summarizeWebsiteViewportEvidence(state,{draftId,generation,pageId}={}){
 const key=[draftId,generation,pageId].join(":");
 const checks=state?.key===key?state.checks:{};
 const checked=["phone","tablet","wide"].filter(x=>checks?.[x]?.checked);
 const outstanding=["phone","wide"].filter(x=>!checks?.[x]?.checked);
 const warnings=checked.filter(x=>checks[x].noCommonWarnings!==true);
 const message=outstanding.length
  ?"Checked "+(checked.length?checked.join(", ")+" layout":"no layouts")+
   ". "+outstanding.map(x=>x==="phone"?"Phone layout":"Wide layout").join(" and ")+
   " still needs checking."
  :warnings.length
   ?"Both phone and wide layouts were checked, but some warnings still need review."
   :"Phone and wide previews had no common measured warnings. You still need a real device and hosted-preview review.";
 return {checked,outstanding,warnings,completePreviewWidths:outstanding.length===0,
  message,notAReleaseApproval:true};
}
/**
 * V3.149 — Compare actual screen-width measurements. This is DOM evidence,
 * not a generative AI screenshot critique or permission to publish.
 */
function reviewWebsiteViewportPortfolio(state,{draftId,generation,pageId}={}){
 const summary=summarizeWebsiteViewportEvidence(state,{draftId,generation,pageId});
 const key=[draftId,generation,pageId].join(":");
 const checks=state?.key===key?state.checks:{};
 const missing=["phone","tablet","wide"].filter(x=>!summary.checked.includes(x));
 const flagged=summary.checked.filter(x=>Array.isArray(checks[x]?.commonIssues)&&
  checks[x].commonIssues.length>0);
 const name={phone:"Phone",tablet:"Tablet",wide:"Desktop"};
 const details=flagged.map(x=>name[x]+": "+checks[x].commonIssues.slice(0,3).join(", "));
 const message=details.length
  ?"These layouts have different measured problems: "+details.join("; ")+
   ". Compare them and check the real hosted site."
  :missing.length
   ?"Checks still needed at: "+missing.map(x=>name[x]).join(", ")+
    ". This is not proof of design quality."
   :"No common measured warnings across phone, tablet and desktop. Inspect appearance and real devices before publishing.";
 return {checked:summary.checked,missing,flagged,message,
  measuredOnly:true,notAiAestheticReview:true,notReleaseApproval:true};
}
export {classifyWidth,recordWebsiteViewportEvidence,summarizeWebsiteViewportEvidence,reviewWebsiteViewportPortfolio};
