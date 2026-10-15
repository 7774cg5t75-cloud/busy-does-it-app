import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {OPTIONS,DEFAULTS,previewPrivateAppAppearance} from "../src/core/appAppearanceEditing.mjs";
import {proposeCoordinatedAppChanges,planAppVoiceInstructions} from "../src/core/appCoordinatedStudio.mjs";
import {auditBusinessAppUsability,compareBusinessAppDesign} from "../src/core/appUsabilityAudit.mjs";
import {normalizeAppVisualAIResult,previewAppVisualSuggestion} from "../src/core/appVisualReviewContract.mjs";
const read=x=>readFileSync(new URL("../"+x,import.meta.url),"utf8");
const config={modules:["business_profile","services","gallery","contact"].map(key=>({key,enabled:true})),
 navigation:["business_profile","services","gallery","contact"],
 presentation:{headerStyle:"refined",layoutDensity:"comfortable",navigationStyle:"tabs"},
 display:{name:"Salon"},publicProfile:{businessName:"Salon",
 services:[{name:"Haircut",description:"Owner approved"}],
 assets:{gallery:[{approved:true,uri:"https://example.test/1.jpg"}]},
 contact:{email:"owner@example.test"}},
 customerRecords:[{name:"Private Customer"}],payments:{enabled:false}};
const original=JSON.stringify(config);
assert.deepEqual(OPTIONS.galleryLayout,["grid","stack"]);
assert.deepEqual(OPTIONS.imageCorners,["rounded","square"]);
assert.equal(DEFAULTS.galleryLayout,"grid");
const ops=[{kind:"appearance",field:"galleryLayout",value:"stack"},
 {kind:"appearance",field:"imageCorners",value:"square"}];
const changed=proposeCoordinatedAppChanges(config,ops);
assert.equal(changed.ok,true,changed.reason);
assert.equal(changed.changes.length,2);
assert.equal(changed.nextConfig.presentation.galleryLayout,"stack");
assert.equal(changed.nextConfig.presentation.imageCorners,"square");
assert.equal(changed.nextConfig.customerRecords,config.customerRecords);
assert.equal(changed.nextConfig.payments,config.payments);
const undo=proposeCoordinatedAppChanges(changed.nextConfig,changed.undoOperations);
assert.equal(undo.ok,true,undo.reason);
assert.deepEqual(undo.nextConfig,config,"Undo restores the exact original sparse appearance and content");
assert.equal(JSON.stringify(config),original);
const voice=planAppVoiceInstructions(config,"Make the gallery a stack and use square photo corners");
assert.equal(voice.ok,true,voice.reason);
assert.deepEqual(voice.operations,ops);
assert.equal(planAppVoiceInstructions(config,
 "Make gallery a grid and delete customer records").ok,false);
assert.equal(previewPrivateAppAppearance(config,{field:"imageCorners",value:"unsafe"}).ok,false);
const comparison=compareBusinessAppDesign(config,changed.nextConfig);
assert.equal(comparison.ok,true);
assert.equal(comparison.changeCount,2);
assert.equal(comparison.designOnly,true);
assert.equal(comparison.screenshotsCompared,false);
assert.equal(comparison.layoutPixelsMeasured,false);
assert.equal(compareBusinessAppDesign(config,{...changed.nextConfig,
 publicProfile:{businessName:"Changed"}}).designOnly,false);
assert.equal(compareBusinessAppDesign(config,{...config,
 presentation:{galleryLayout:"bad"}}).ok,false);
const audit=auditBusinessAppUsability({...config,display:{},publicProfile:{
 services:[],assets:{gallery:[{approved:true}]}}});
for(const key of ["business_identity","service_information","photo_descriptions",
 "screen_reader_untested","tap_targets_untested","text_scaling_untested","contrast_untested"])
 assert.ok(audit.issues.some(i=>i.id===key),"missing audit "+key);
assert.equal(audit.neverCertifiesAccessibility,true);
assert.equal(audit.pixelMeasurementPerformed,false);
assert.deepEqual(audit.safeAutomaticEdits,[]);
assert.equal(JSON.stringify(audit).includes("Private Customer"),false);
const result=normalizeAppVisualAIResult({summary:"Inspect this",
 suggestions:[{field:"galleryLayout",value:"stack",reason:"Easier to scan"},
 {field:"imageCorners",value:"square",reason:"Simple layout"},
 {field:"payment",value:"on",reason:"Unapproved"}]},config);
assert.equal(result.ok,true);
assert.deepEqual(result.suggestions.map(s=>s.field),["galleryLayout","imageCorners"]);
assert.equal(previewAppVisualSuggestion(config,result.suggestions[0]).ok,true);
assert.equal(read("src/core/appAppearanceEditing.mjs"),
 read("supabase/functions/busy-mini-apps/appAppearanceEditing.mjs"));
assert.equal(read("src/core/appCoordinatedStudio.mjs"),
 read("supabase/functions/busy-mini-apps/appCoordinatedStudio.mjs"));
assert.equal(read("src/core/appVisualReviewContract.mjs"),
 read("supabase/functions/busy-mini-apps/appVisualReviewContract.mjs"));
const builder=read("src/screens/miniApps.js");
assert.ok(builder.includes('import {AppStudioComparison} from "./appStudioComparison"'));
assert.ok(builder.includes("<AppStudioComparison"));
const ui=builder+read("src/screens/appStudioComparison.js");
for(const str of ["auditBusinessAppUsability","compareBusinessAppDesign",
 "Before and after comparison","Show original design","Show proposed design",
 "Show suggested design","Accessible app checklist","galleryLayout",
 "imageCorners","accessibilityLabel={String(asset.alt"])
 assert.ok(ui.includes(str),"UI missing "+str);
const native=read("standalone/template/App.js");
for(const str of ["layout?.galleryColumns===3","LOOK.imageCorners",'accessibilityRole="image"'])
 assert.ok(native.includes(str),"standalone missing "+str);
assert.ok(read("supabase/functions/busy-mini-apps/index.ts")
 .includes("galleryLayout (grid,stack), imageCorners (rounded,square)"));
console.log("V3.160 PASS: reversible design editing, voice planning, static usability and accessibility guardrails, private before/after comparison, AI design bounds and native parity.");
