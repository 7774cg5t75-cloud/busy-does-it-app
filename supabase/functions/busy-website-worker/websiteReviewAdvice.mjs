/**
 * Explain actual before/after browser-review findings in plain language.
 * This does not inspect photos, call paid vision, autonomously modify a site,
 * or claim higher conversion rates. Owner must decide whether to try an edit.
 */
import {websiteDesignDecision} from "./websiteDesignDecision.mjs";
const patterns=[
 ["primary action","Make the main contact or booking button visible and usable.","buttons"],
 ["text contrast","Improve the contrast between text and its background.","readability"],
 ["inspected text coverage","Restore readable, inspectable website wording.","readability"],
 ["navigation","Keep the menu visible and usable on mobile and desktop.","navigation"],
 ["horizontal","Keep all content within the phone screen width.","layout"],
 ["touch target","Make interactive buttons large enough to tap.","buttons"],
 ["heading","Check the main heading size and visibility on small screens.","typography"],
 ["input label","Give each form field a clear label.","forms"]
];
function websiteReviewAdvice({before=null,after=null,originalDraft=null,candidateDraft=null}={}){
 const verdict=websiteDesignDecision({before,after,originalDraft,candidateDraft});
 const raw=[...(verdict.comparison?.newProblems||[]),
  ...(verdict.comparison?.worsenedMetrics||[])];
 const findings=[];
 for(const item of raw){
  const entry=patterns.find(([term])=>String(item).toLowerCase().includes(term));
  if(entry&&!findings.some(x=>x.category===entry[2]))
   findings.push({category:entry[2],message:entry[1],
    evidence:String(item).slice(0,150)});
 }
 if(verdict.status==="regression"&&!findings.length)
  findings.push({category:"review",message:"Restore the customer's original website content and recheck the layout.",
   evidence:verdict.reason});
 if(verdict.status==="needs-review"&&!findings.length)
  findings.push({category:"review",message:"Capture genuine phone and desktop measurements before selecting an improvement.",
   evidence:verdict.reason});
 const status=verdict.status;
 return {status,headline:status==="measured-improvement"?
    "Fewer measured issues, still needs a human review":
    status==="safe-alternative"?"Different design, no measured regression":
    status==="regression"?"This candidate introduced a problem":
    "More evidence is needed",
  findings:findings.slice(0,4),needsCustomerReview:true,
  autoApply:false,publishAllowed:false,needsPaidAi:false,
  measuredConversionLift:null,measuredSalesLift:null,
  actualScreenshotsCompared:!!before?.mobileAudit&&!!before?.desktopAudit&&
    !!after?.mobileAudit&&!!after?.desktopAudit,
  note:"An objective layout check cannot decide whether a design is beautiful or commercially successful."};
}
export {websiteReviewAdvice};
