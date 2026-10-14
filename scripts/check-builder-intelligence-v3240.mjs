import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {reviewAppGoalDesignV3240 as appReview}
 from "../src/core/appGoalDesignReviewV3240.mjs";
import {recordPrivateWebsiteCandidateWidthV3239 as record}
 from "../src/core/privateWebsiteCandidateWidthV3239.mjs";
import {inspectCurrentWebsiteCandidateV3240 as current}
 from "../src/core/websiteCurrentCandidateV3240.mjs";

const B="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
let count=0;
const eq=(x,y)=>{assert.deepEqual(x,y);count++};
const yes=x=>{assert.ok(x);count++};
const config={modules:[
 {key:"business_profile",enabled:true},{key:"services",enabled:true},
 {key:"gallery",enabled:true},{key:"enquiry",enabled:true},
 {key:"contact",enabled:true},{key:"booking_request",enabled:true}
 ],navigation:["business_profile","services","gallery","enquiry","contact","booking_request"],
 presentation:{navigationStyle:"tabs",layoutDensity:"compact",
  brandPalette:"midnight",typeStyle:"balanced",imageScale:"large",
  galleryLayout:"grid"},
 publicProfile:{businessName:"Fictional Gardeners",tagline:"Clear advice",
  services:[{name:"Gardening"}],assets:{gallery:[
   {uri:"https://example.test/approved-a.jpg",approved:true},
   {uri:"https://example.test/approved-b.jpg",approved:true},
   {uri:"https://example.test/approved-c.jpg",approved:true}
  ]}}};
const app={id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",business_id:B,
 draft_revision:11,draft_config:config};
const website={id:"private-website",generation:8,businessId:B,
 businessType:"Gardening",businessName:"Fictional Gardeners",
 sections:[{id:"hero",type:"hero",enabled:true,body:"Clear advice"},
  {id:"services",type:"services",enabled:true,items:[{title:"Gardening"}]}],
 pages:[{id:"home",enabled:true,sectionIds:["hero","services"]}],
 theme:{primary:"#AABBCC",typography:"editorial"}};
const before=JSON.stringify({app,website});
const report=appReview({businessId:B,app,website,goal:"book"});
yes(report.ok);eq(report.goal,"book");
eq(report.source.appId,app.id);eq(report.source.revision,11);
eq(report.source.websiteId,website.id);eq(report.source.websiteRevision,8);
eq(report.task.status,"available_not_end_to_end_verified");
eq(report.task.actionVerified,false);
eq(report.brand.status,"owner_review_needed");
yes(report.brand.conflictCount>=1);
eq(report.comparison.length,3);
eq(report.proposedChangeCount,report.operations.length);
yes(report.proposedChangeCount>=1&&report.proposedChangeCount<=3);
yes(report.operations.some(x=>x.field==="navigationStyle"));
yes(report.comparison.every(x=>x.realScreenshotMeasured===false));
eq(report.noNativeScreenshots,true);eq(report.realDeviceVerified,false);
eq(report.customerBookingConfirmed,false);eq(report.maySave,false);
eq(report.mayPublish,false);eq(report.mayCharge,false);
eq(report.brandChoicesNotApplied,true);
eq(report.noCrossBusinessLearning,true);
eq(JSON.stringify({app,website}),before);
for(const sensitive of ["Fictional Gardeners","https://example.test/approved-a.jpg",
 "#AABBCC","Clear advice"])yes(!JSON.stringify(report).includes(sensitive));
const foreignColumn=appReview({businessId:B,app,
 website:{...website,business_id:OTHER},goal:"services"});
yes(foreignColumn.ok);eq(foreignColumn.brand.status,"pair_not_verified");
const noWeb=appReview({businessId:B,app,goal:"services"});
yes(noWeb.ok);
eq(noWeb.brand.status,"website_draft_not_supplied");
const mismatch=appReview({businessId:B,app,
 website:{...website,businessId:OTHER},goal:"services"});
yes(mismatch.ok);eq(mismatch.brand.status,"pair_not_verified");
eq(mismatch.source.websiteId,null);
for(const altered of [
 {businessId:OTHER,app,goal:"book"},
 {businessId:B,app:{...app,business_id:OTHER},goal:"book"},
 {businessId:B,app:{...app,draft_revision:0},goal:"book"},
 {businessId:B,app:{...app,id:"not-a-uuid"},goal:"book"},
 {businessId:B,app:{...app,draft_config:{...config,navigation:["services"]}},goal:"book"},
 {businessId:B,app,goal:"fake"},
 {businessId:B,app:null,goal:"book"}
 ]){
 const failed=appReview(altered);eq(failed.ok,false);
 eq(failed.maySave,false);eq(failed.mayPublish,false);
}
const lean={...config,modules:config.modules.slice(0,2),
 navigation:["business_profile","services"],
 presentation:{navigationStyle:"list",layoutDensity:"comfortable"}};
const noOptions=appReview({businessId:B,app:{...app,draft_config:lean},goal:"enquire"});
yes(noOptions.ok);eq(noOptions.proposedChangeCount,0);
eq(noOptions.task.needsSetup,true);eq(noOptions.task.actionVerified,false);
eq(noOptions.mayPublish,false);
const widths={phone:390,tablet:768,desktop:1280};
const makeReport=(mode,bad)=>({counts:{
 viewport:widths[mode],width:widths[mode]+(bad?30:0),
 overflow:bad?1:0,images:0,missingAlt:0,unloadedImages:0,
 smallTargets:0,badAnchors:0,clippedHeadings:0,headings:1,
 sections:2,lowContrast:0,contrastUnknown:0,contrastChecked:4,
 smallBodyText:0},issues:bad?[{id:"overflow"}]:[]});
const source={businessId:B,website,pageId:"home",candidateId:"hero-layout",
 baseGeneration:8};
let state=null;
for(const mode of ["phone","tablet","desktop"]){
 for(const variant of ["original","candidate"]){
  const r=record(state,{...source,mode,variant,
   report:makeReport(mode,variant==="original")});
  yes(r.ok);state=r.state;
 }
}
for(const mode of ["phone","tablet","desktop"]){
 const inspected=current(state,{...source,mode});
 yes(inspected.ok);eq(inspected.mode,mode);
 eq(inspected.safeForPrivateApproval,true);
 eq(inspected.portfolio.complete,true);
 eq(inspected.mayPublish,false);
 eq(inspected.screenshotEvidence,false);
}
const unsafe=record(state,{...source,mode:"tablet",variant:"candidate",
 report:makeReport("tablet",true)});
yes(unsafe.ok);
const safeNoMore=current(unsafe.state,{...source,mode:"phone"});
yes(safeNoMore.ok);eq(safeNoMore.safeForPrivateApproval,true);
// Tablet became neutral: no regression; retain improvements elsewhere.
const oldCleared=record(unsafe.state,{...source,mode:"tablet",variant:"original",
 report:makeReport("tablet",false)});
yes(oldCleared.ok);
const regress=current(oldCleared.state,{...source,mode:"phone"});
yes(regress.ok);eq(regress.safeForPrivateApproval,false);
eq(regress.portfolio.hasRegressions,true);
for(const altered of [
 {...source,mode:"phone",website:{...website,business_id:OTHER}},
 {...source,mode:"full"},{...source,mode:"phone",businessId:OTHER},
 {...source,mode:"phone",pageId:"unknown"},
 {...source,mode:"phone",candidateId:"different"},
 {...source,mode:"phone",website:{...website,generation:9}},
 {...source,mode:"phone",baseGeneration:5}
 ]){
 const invalid=current(state,altered);
 eq(invalid.ok,false);eq(invalid.safeForPrivateApproval,false);
}
const missing=current({...state,records:{phone:{original:state.records.phone.original}}},
 {...source,mode:"phone"});
eq(missing.ok,false);eq(missing.mayPublish,false);
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const appUI=read("src/screens/miniApps.js");
const websiteUI=read("src/screens/websiteBuilder.js");
for(const term of ["reviewAppGoalDesignV3240","BUSY’s design decision",
 "appGoalDesign.recommendation","appGoalDesign.brand.note",
 "real booking or enquiry"]){
 yes(appUI.includes(term));
}
for(const term of ["inspectCurrentWebsiteCandidateV3240",
 "currentCandidateEvidence","privateWidthReview?.hasRegressions===true",
 "Keep this design in my private draft","Return to my original design"]){
 yes(websiteUI.includes(term));
}
console.log("V3.240: "+count+" app goal/design, Brand DNA, responsive evidence, private approvals, tenant and revision assertions passed.");
