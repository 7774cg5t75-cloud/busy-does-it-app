import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {prepareAppVisualBatch,validatePairedAppVisualRequest}
 from "../src/core/appVisualComparison.mjs";
import {measuredContrast,relativeLuminance,auditStandaloneContrast,
 NATIVE_SHELL_PALETTE} from "../src/core/appContrastAudit.mjs";
import {proposeCoordinatedAppChanges} from "../src/core/appCoordinatedStudio.mjs";
import {normalizeAppVisualAIResult} from "../src/core/appVisualReviewContract.mjs";
import {compareBusinessAppDesign} from "../src/core/appUsabilityAudit.mjs";
import {nativePalette,DEFAULT_PALETTE} from "../src/core/nativePalette.mjs";
import {nativePalette as templateNativePalette} from "../standalone/template/nativePalette.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const appId="00000000-0000-4000-8000-000000000161";
const draft={modules:["business_profile","gallery","services","booking_request"].map(
 key=>({key,enabled:true})),
 navigation:["business_profile","gallery","services","booking_request"],
 presentation:{headerStyle:"refined",layoutDensity:"comfortable",navigationStyle:"tabs"},
 publicProfile:{businessName:"Public Hair Studio",services:[{name:"Cut",description:"from £25"}],
   assets:{gallery:[{uri:"https://example.test/image.png",approved:true}]}},
 internalCustomerRecords:[{email:"jane@example.test"}],payments:{enabled:false}};
const original=JSON.stringify(draft);
const input=normalizeAppVisualAIResult({summary:"Screen could use roomier spacing",
 observations:["Gallery takes much of the visual space"],suggestions:[
 {field:"layoutDensity",value:"airy",reason:"More space"},
 {field:"galleryLayout",value:"stack",reason:"Clear photos"},
 {field:"imageCorners",value:"square",reason:"Reduce decoration"},
 {field:"paymentDetails",value:"enabled",reason:"Not allowed"}
]},draft);
assert.equal(input.ok,true);
assert.equal(input.suggestions.length,3);
const batch=prepareAppVisualBatch(draft,input.suggestions);
assert.equal(batch.ok,true,batch.reason);
assert.equal(batch.operations.length,3);
assert.equal(batch.changes.length,3);
assert.equal(batch.nextConfig.presentation.layoutDensity,"airy");
assert.equal(batch.nextConfig.presentation.galleryLayout,"stack");
assert.equal(batch.nextConfig.presentation.imageCorners,"square");
assert.equal(batch.safeDesignOnly,true);
assert.equal(batch.aiReviewNotAutoApproved,true);
assert.equal(batch.mayPublish,false);
assert.equal(batch.chargesCreated,false);
assert.equal(JSON.stringify(draft),original,"Never modify the private source");
assert.deepEqual(batch.nextConfig.internalCustomerRecords,draft.internalCustomerRecords);
assert.deepEqual(batch.nextConfig.payments,draft.payments);
const undo=proposeCoordinatedAppChanges(batch.nextConfig,batch.undoOperations);
assert.equal(undo.ok,true,undo.reason);
assert.equal(compareBusinessAppDesign(draft,undo.nextConfig).changeCount,0);
for(const bad of [
 [],Array(4).fill(input.suggestions[0]),
 [{kind:"payment",field:"payments",value:"true"}],
 [{kind:"appearance",field:"layoutDensity",value:"airy"},
  {kind:"appearance",field:"layoutDensity",value:"compact"}],
 [{kind:"appearance",field:"notAllowed",value:"enabled"}],
 [{kind:"appearance",field:"galleryLayout",value:"javascript"}],
 [{kind:"appearance",field:"headerStyle",value:"refined"}]
])assert.equal(prepareAppVisualBatch(draft,bad).ok,false,JSON.stringify(bad));
const validImage="a".repeat(120);
const paired={appId,expectedRevision:9,ownerConsent:true,
 imageBase64:validImage,compareImageBase64:validImage,
 captureScope:"public_app_only",candidateOperations:batch.operations};
assert.equal(validatePairedAppVisualRequest(paired).ok,true);
for(const invalid of [
 {...paired,ownerConsent:false},
 {...paired,captureScope:"whole_screen"},
 {...paired,compareImageBase64:"https://example.test/private"},
 {...paired,compareImageBase64:validImage+"!"},
 {...paired,compareImageBase64:"a".repeat(800004)},
 {...paired,candidateOperations:[]},
 {...paired,candidateOperations:Array(4).fill(batch.operations[0])},
])assert.equal(validatePairedAppVisualRequest(invalid).ok,false);
assert.equal(relativeLuminance("#000000"),0);
assert.equal(relativeLuminance("#FFFFFF"),1);
assert.equal(measuredContrast("#FFFFFF","#000000"),21);
assert.equal(measuredContrast("#777777","#FFFFFF")<4.5,true);
assert.throws(()=>measuredContrast("#zzzzzz","#FFFFFF"));
const colour=auditStandaloneContrast();
assert.equal(colour.measuredPaletteOnly,true);
assert.equal(colour.accessibilityCertified,false);
assert.equal(colour.textScalingChecked,false);
assert.equal(colour.readings.length,6);
assert.equal(colour.readings.some(x=>x.id==="inactive_button_label"&&x.passes===null),true);
// V3.192+ uses one imported palette engine rather than inline tokens.
assert.ok(read("standalone/template/App.js").includes('import {nativePalette} from "./nativePalette.mjs"'));
assert.ok(read("standalone/template/App.js").includes('const COLORS=nativePalette(LOOK.brandPalette,LOOK.brandAccent)'));
assert.ok(read("scripts/prepare-standalone-prototype-v3154.mjs").includes('"src","core","nativePalette.mjs"'));
assert.deepEqual(templateNativePalette(DEFAULT_PALETTE),nativePalette(DEFAULT_PALETTE));
for(const key of ["bg","surface","text","muted","accent","line"])
 assert.equal(nativePalette(DEFAULT_PALETTE)[key],NATIVE_SHELL_PALETTE[key],
  "Colour audit must match actually rendered standalone token: "+key);
const native=read("standalone/template/App.js");
assert.ok(native.includes("minHeight:48"));
assert.ok(native.includes("accessibilityState={{selected:item.key===chosen.key}}"));
const src=read("src/core/appVisualComparison.mjs");
assert.equal(src,read("supabase/functions/busy-mini-apps/appVisualComparison.mjs"));
const edge=read("supabase/functions/busy-mini-apps/index.ts");
for(const key of ['"compare_app_screenshots"', 'validatePairedAppVisualRequest(body)',
 'prepareAppVisualBatch(app.draft_config,pair?.operations)',
 'Uint8Array.from(atob(pair.afterImageBase64)',
 'type:"input_image",image_url:"data:image/jpeg;base64,"+pair.afterImageBase64',
 'screenshotStored:false,imagesSubmitted:mode==="comparison"?2:1',
 'action==="compare_app_screenshots"?"comparison":"single"',
 '"busy_reserve_app_visual_ai_call"',
 'p_request_key:requestKey','store:false','ownerMustApproveChanges:true'])
 assert.ok(edge.includes(key),"Missing server comparison invariant: "+key);
const ctrl=read("src/app/AppController.js"),ui=read("src/screens/miniApps.js");
for(const key of ['comparePrivateAppScreenshots=async',
 'miniAppsRequest("compare_app_screenshots"',
 'ownerConsent:true','Number(file.size)>590000',
 'response.imagesSubmitted!==2','response.screenshotStored!==false'])
 assert.ok(ctrl.includes(key),"Missing client handoff safeguard: "+key);
for(const key of ["originalComparisonRef","proposedComparisonRef",
 "captureRef(originalComparisonRef.current","captureRef(proposedComparisonRef.current",
 "Ask AI to compare both screenshots","Approve comparison",
 "prepareAppVisualBatch(config,chosen)",
 "Capture both rendered app views","Approve ",
 "auditStandaloneContrast(nativePalette("])
 assert.ok(ui.includes(key),"Missing comparison UI: "+key);
console.log("V3.161 PASS: 3-change private batch, reversible approvals, two local captures, opt-in single-metered AI comparison, real native palette contrast and accessibility checks.");
