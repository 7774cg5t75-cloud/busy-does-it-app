/**
 * V3.183 targeted read-only architecture audit.
 * Report file concentration and key boundary wiring, not quality scores.
 * Keeps focused refactors near development work instead of wholesale rewrites.
 */
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const lines=s=>s.length===0?0:s.endsWith("\n")?s.split("\n").length-1:s.split("\n").length;
const review=[
 "src/app/AppController.js",
 "src/screens/work.js",
 "src/screens/websiteBuilder.js",
 "src/screens/miniApps.js",
 "supabase/functions/busy-mini-apps/index.ts",
 "src/components/GetPaidOwnerReview.js",
 "src/core/getPaidIntelligenceV3183.mjs",
 "src/core/durableWorkOutcomeEvidenceV3181.mjs"
];
const concentrations=review.map(path=>({path,lines:lines(read(path))}))
 .sort((a,b)=>b.lines-a.lines);
const businessAppBackend=read("supabase/functions/busy-mini-apps/index.ts");
const appController=read("src/app/AppController.js");
const work=read("src/screens/work.js");
const evidence=read("src/core/durableWorkOutcomeEvidenceV3181.mjs");
const findings=[
 {id:"booking_atomic_receipt",present:
   businessAppBackend.includes('supabase.rpc("busy_mark_mini_app_request_link_v3181"'),
   interpretation:"Server handoff uses durable PostgreSQL ledger transaction. Hosted evidence outstanding."},
 {id:"booking_work_reconciliation",present:
   appController.includes("reconcileWorkBookingLedger({"),
   interpretation:"Work calendar reads server ledger; external calendar sync is still separate."},
 {id:"owner_finance_logic_extracted",present:
   work.includes('GetPaidOwnerReview')&&
   read("src/components/GetPaidOwnerReview.js").includes("prepareGetPaidQuoteDraft"),
   interpretation:"Get Paid review lives in bounded reusable component, not the already-large Work screen."},
 {id:"brain_outcomes_truthful",present:
   evidence.includes("realSalesMeasured:false")&&evidence.includes("completedJobsMeasured:false"),
   interpretation:"Stored results are classified separately from verified customer outcomes."},
 {id:"large_controller_remains",present:lines(appController)>10000,
   interpretation:"Incremental extraction recommended in features being changed; avoid a speculative large rewrite."},
 {id:"large_work_screen_remains",present:lines(work)>3000,
   interpretation:"Continue extracting self-contained reviewed workflows as needed."}
];
const result={kind:"targeted_architecture_review_v3183",concentrations,
 findings,requiresProductionRuntimeProof:true,securityAuditComplete:false,
 performanceProfiled:false,redesignRecommended:false,
 nextIncrementalRefactors:["owner quote/booking action state",
  "Business App request service route boundaries",
  "centralised typed customer outcome receipts"],
 codeSizeDoesNotMeasureUserSuccess:true};
console.log(JSON.stringify(result,null,2));
export {result};
