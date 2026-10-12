/**
 * V3.183 — source-level intelligence inventory. This measures implementations
 * and wiring, NOT model IQ, real customer results, production availability or
 * proof that external providers completed a requested action.
 */
import {readFileSync,existsSync,readdirSync,statSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
const root=fileURLToPath(new URL("../",import.meta.url));
const EXT=/\.(?:js|jsx|mjs|cjs|ts|tsx|sql|py|sh|html|css)$/;
function filesAt(dir){
 const result=[];
 function visit(folder){
  for(const entry of readdirSync(folder,{withFileTypes:true})){
   if([".git","node_modules",".expo",".tmp","dist","build"].includes(entry.name))continue;
   const path=join(folder,entry.name);
   if(entry.isDirectory())visit(path);
   else if(entry.isFile()&&EXT.test(entry.name))
    result.push({path:path.slice(root.length),text:readFileSync(path,"utf8")});
  }
 }
 visit(dir);
 return result;
}
const files=filesAt(root);
const source=new Map(files.map(x=>[x.path,x.text]));
const domains=[
 {id:"business_brain_owner_choices",source:"src/core/businessBrainWorkQueue.mjs",
  wired:"src/screens/miniApps.js",signal:"businessBrainQueue",test:"scripts/check-business-brain-staging-v3175.mjs"},
 {id:"business_brain_stored_outcomes",source:"src/core/businessBrainMeasuredOutcomes.mjs",
  wired:"src/domain/miniApps.js",signal:"reviewBusinessBrainObservedOutcomes",test:"scripts/check-atomic-staging-v3180.mjs"},
 {id:"work_booking_evidence",source:"src/core/durableWorkOutcomeEvidenceV3181.mjs",
  wired:"src/domain/miniApps.js",signal:"assessDurableWorkOutcomes",test:"scripts/check-durable-work-v3181.mjs"},
 {id:"booking_reconciliation",source:"src/core/workBookingReconciliationV3181.mjs",
  wired:"src/app/AppController.js",signal:"reconcileWorkBookingLedger",test:"scripts/check-durable-work-v3181.mjs"},
 {id:"website_measured_design",source:"src/core/websiteMeasuredDesignCoach.mjs",
  wired:"src/screens/websiteBuilder.js",signal:"compareWebsiteVisualReports",test:"scripts/check-website-outcome-browser-v3118.mjs"},
 {id:"app_design_feedback",source:"src/core/appDesignLearning.mjs",
  wired:"src/screens/miniApps.js",signal:"rankDesignSuggestions",test:"scripts/check-intelligent-app-studio-v3157.mjs"},
 {id:"website_app_fact_coordination",source:"src/core/coordinatedBuilderReviewV3180.mjs",
  wired:"src/screens/miniApps.js",signal:"prepareCoordinatedBuilderReview",test:"scripts/check-atomic-staging-v3180.mjs"},
 {id:"atomic_owner_customer_conversation",source:"supabase/functions/busy-mini-apps/atomicConversationService.mjs",
  wired:"supabase/functions/busy-mini-apps/index.ts",signal:"sendAtomicConversation(supabase",
  test:"scripts/check-customer-journeys-v3184.mjs"},
 {id:"stored_customer_journey_checkpoints",source:"src/core/storedJourneyCheckpointsV3184.mjs",
  wired:"src/domain/miniApps.js",signal:"summarizeJourneyCheckpoints({",
  test:"scripts/check-customer-journeys-v3184.mjs"},
 {id:"safe_staging_migration_review",source:"src/core/stagingMigrationRiskV3184.mjs",
  wired:"scripts/prepare-staging-install-v3180.mjs",signal:"reviewMigrationSideEffects(migrations)",
  test:"scripts/check-customer-journeys-v3184.mjs"},
 {id:"durable_message_retry",source:"src/core/durableMessageRetryV3185.mjs",
  wired:"src/app/AppController.js",signal:"prepareDurableMessageAttempt(SecureStore",
  test:"scripts/check-message-integrity-v3185.mjs"},
 {id:"notification_submission_evidence",source:"src/core/messageDeliveryEvidenceV3185.mjs",
  wired:"src/domain/miniApps.js",signal:"reviewMessageDeliveryIntents({",
  test:"scripts/check-message-integrity-v3185.mjs"},
 {id:"gateway_ticket_reconciliation",source:"supabase/functions/busy-mini-apps/pushGatewayReceiptEvidence.mjs",
  wired:"supabase/functions/busy-mini-apps/index.ts",signal:"pushGatewayEvidence=reviewPushGatewayReceipts({",
  test:"scripts/check-gateway-outcomes-v3186.mjs"},
 {id:"measured_owner_action_priority",source:"src/core/measuredCustomerActionPriorityV3186.mjs",
  wired:"src/domain/miniApps.js",signal:"recommendMeasuredOwnerActions({",
  test:"scripts/check-gateway-outcomes-v3186.mjs"},
 {id:"offline_staging_manifest_integrity",source:"scripts/verify-staging-install-v3186.mjs",
  wired:".github/workflows/gateway-staging-v3186.yml",signal:"node scripts/verify-staging-install-v3186.mjs",
  test:"scripts/check-gateway-outcomes-v3186.mjs"},
 {id:"customer_outcome_proof_ladder",source:"src/core/customerOutcomeProofV3187.mjs",
  wired:"src/domain/miniApps.js",signal:"reviewCustomerOutcomeProof({",
  test:"scripts/check-outcome-proof-v3187.mjs"},
 {id:"site_app_customer_action_coordination",source:"src/core/connectedCustomerJourneyV3187.mjs",
  wired:"src/screens/miniApps.js",signal:"coordinateCustomerJourneyReview({",
  test:"scripts/check-outcome-proof-v3187.mjs"},
 {id:"isolated_staging_review_gate",source:"src/core/isolatedStagingRunbookV3187.mjs",
  wired:"scripts/plan-isolated-staging-v3187.mjs",signal:"createStagingExecutionGate({",
  test:"scripts/check-outcome-proof-v3187.mjs"},
 {id:"get_paid_owner_drafts",source:"src/core/getPaidIntelligenceV3183.mjs",
  wired:"src/components/GetPaidOwnerReview.js",signal:"prepareGetPaidQuoteDraft",test:"scripts/check-get-paid-v3183.mjs"}
];
const capabilities=domains.map(d=>{
 const implementation=source.has(d.source);
 // Workflow YAML is deliberately excluded from code-line counting, but
 // a concrete CI integration is still valid wiring evidence.
 const wiring=source.get(d.wired)??(existsSync(join(root,d.wired))?
  readFileSync(join(root,d.wired),"utf8"):"");
 const ownerSurface=wiring.includes(d.signal);
 const testPresent=source.has(d.test);
 return {id:d.id,implementation,ownerSurface,testPresent,
  sourceAndOwnerWired:implementation&&ownerSurface,
  evidenceLevel:"static_source_inventory_only",
  hostedEndToEndVerified:false,realCustomerOutcomesVerified:false,
  underlyingModelRetrained:false};
});
const paths=files.map(x=>x.path);
const byDir=prefix=>files.filter(x=>x.path.startsWith(prefix)).length;
const sourceLines=files.reduce((sum,f)=>sum+
 (f.text===""?0:f.text.endsWith("\n")?
  f.text.split("\n").length-1:f.text.split("\n").length),0);
const report={kind:"busy_intelligence_source_inventory_v3183",
 branchExpected:"v3.187",countingRule:"physical lines in selected code extensions, including comments and blanks",
 codeFiles:files.length,codePhysicalLines:sourceLines,
 coreFiles:byDir("src/core/"),serviceFiles:byDir("supabase/functions/"),
 scriptFiles:byDir("scripts/"),migrationFiles:byDir("supabase/migrations/"),
 surveyedCapabilities:capabilities,
 wiredSourceCapabilities:capabilities.filter(x=>x.sourceAndOwnerWired).length,
 areasNeedingWiring:capabilities.filter(x=>!x.sourceAndOwnerWired).map(x=>x.id),
 testsPresentForSample:capabilities.filter(x=>x.testPresent).length,
 realStagingAppInstalled:false,realCustomerJourneysProven:false,
 calibratedIQScore:null,selfTrainingVerified:false,
 trackedCodeIsNotProofOfIntelligence:true};
console.log(JSON.stringify(report,null,2));
export {report};
