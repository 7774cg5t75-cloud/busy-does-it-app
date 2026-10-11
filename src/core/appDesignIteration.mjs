/**
 * V3.162: private app design improvement checkpoint.
 * The checkpoint carries only finite public-config findings and intended style
 * choices. It never stores customer data, screenshots, AI text, or evidence of
 * real-world customer outcomes. A successful server CAS save is REQUIRED
 * before checking the next revision.
 */
import {auditBusinessAppUsability} from "./appUsabilityAudit.mjs";
import {proposeCoordinatedAppChanges} from "./appCoordinatedStudio.mjs";
import {OPTIONS} from "./appAppearanceEditing.mjs";
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const important=audit=>audit.issues.filter(x=>x.severity!=="needs_test").map(x=>x.id);
function prepareAppDesignIteration({appId,revision,config,operations}={}){
 if(!UUID.test(appId||"")||!Number.isSafeInteger(revision)||revision<1||
    !Array.isArray(operations)||operations.length<1||operations.length>3||
    operations.some(op=>!op||op.kind!=="appearance"||
      !Object.prototype.hasOwnProperty.call(OPTIONS,op.field)||
      !OPTIONS[op.field].includes(op.value))||
    new Set(operations.map(x=>x.field)).size!==operations.length)
   return {ok:false,reason:"Start with one to three supported private design changes."};
 const preview=proposeCoordinatedAppChanges(config,operations);
 if(!preview.ok)return preview;
 const audit=auditBusinessAppUsability(config);
 if(!audit.ok)return {ok:false,reason:"The original public app needs review."};
 return {ok:true,kind:"private_app_design_iteration_v3162",appId,
  beforeRevision:revision,expectedAfterRevision:revision+1,
  desiredAppearance:operations.map(x=>({field:x.field,value:x.value})),
  beforeAdvisories:important(audit),beforeImportant:audit.importantCount,
  manualTestsNeeded:audit.manualTestsNeeded,
  ownerApprovalRequired:true,privateOnly:true,
  noScreenshotStored:true,autoPublished:false,
  notRealCustomerOutcome:true};
}
function inspectApprovedAppIteration(checkpoint,{appId,revision,config,saveConfirmed}={}){
 if(checkpoint?.ok!==true||checkpoint.kind!=="private_app_design_iteration_v3162"||
    checkpoint.appId!==appId||revision!==checkpoint.expectedAfterRevision||
    saveConfirmed!==true)
  return {ok:false,reason:"Only a verified newly saved private revision can be rechecked."};
 const audit=auditBusinessAppUsability(config);
 if(!audit.ok)return {ok:false,reason:"The latest app configuration is unavailable."};
 const presentation=config?.presentation||{};
 const settings=checkpoint.desiredAppearance.map(item=>({
  field:item.field,expected:item.value,actual:presentation[item.field],
  applied:presentation[item.field]===item.value
 }));
 const after=important(audit),old=new Set(checkpoint.beforeAdvisories),
  current=new Set(after);
 return {ok:true,kind:"private_app_iteration_recheck_v3162",
  appId,revision,settings,allSettingsApplied:settings.every(x=>x.applied),
  resolvedStaticFlags:[...old].filter(id=>!current.has(id)),
  newStaticFlags:[...current].filter(id=>!old.has(id)),
  remainingStaticFlags:after,
  beforeImportant:checkpoint.beforeImportant,afterImportant:audit.importantCount,
  manualTestsNeeded:audit.manualTestsNeeded,
  nextAction:"Capture and inspect the NEW rendered app preview. Another AI review requires separate owner consent and a further monthly allowance.",
  actualPixelComparisonPerformed:false,visionAIRecheckPerformed:false,
  accessibilityCertified:false,customerOutcomeVerified:false,
  publicUntilApproved:false,safeToPublishAutomatically:false};
}
function proposeLowRiskDesignHints(config){
 const audit=auditBusinessAppUsability(config);
 if(!audit.ok)return {ok:false,reason:"A current public app draft is required."};
 const flags=new Set(audit.issues.map(x=>x.id));
 const candidates=[];
 if(flags.has("gallery_density"))
  candidates.push({kind:"appearance",field:"galleryLayout",value:"stack",
   explanation:"Compare one-column photos when large grid images feel crowded.",
   evidence:"static_configuration_rule_only"});
 if(flags.has("navigation_length")&&config.presentation?.navigationStyle!=="list")
  candidates.push({kind:"appearance",field:"navigationStyle",value:"list",
   explanation:"Compare list navigation for apps with many sections.",
   evidence:"static_configuration_rule_only"});
 const proposals=candidates.filter(c=>proposeCoordinatedAppChanges(config,
  [{kind:"appearance",field:c.field,value:c.value}]).ok);
 return {ok:true,kind:"non_ai_owner_review_hints_v3162",suggestions:proposals,
  autoApply:false,customerInformationUsed:false,needsRenderedReview:true,
  notProofOfUsabilityImprovement:true};
}
export {prepareAppDesignIteration,inspectApprovedAppIteration,proposeLowRiskDesignHints};
