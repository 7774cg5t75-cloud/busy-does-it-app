/**
 * V3.163 — explainable responsive Business App layout decisions.
 *
 * Pure, public-configuration-only; used by both BUSY's actual rendered
 * customer preview and the independently packaged standalone prototype.
 * Widths are React Native logical layout points (NOT hardware pixels).
 *
 * The engine predicts fit from finite rules. It does not claim to have seen
 * any screenshots, measured text wrapping, tested interaction or certified
 * accessibility. No AI spend and no customer's private records are accessed.
 */
const SAMPLE_WIDTHS=Object.freeze([
 {id:"small_phone",label:"Small phone",width:320},
 {id:"phone",label:"Typical phone",width:390},
 {id:"tablet",label:"Tablet",width:820}
]);
const VALID_STYLES={
 navigationStyle:["tabs","list"],
 galleryLayout:["grid","stack"],
 imageScale:["regular","large"],
 layoutDensity:["comfortable","compact","airy"]
};
function validPublicConfig(config){
 return !!config&&typeof config==="object"&&Array.isArray(config.modules)&&
  config.modules.length<=24&&
  config.modules.every(m=>m&&typeof m.key==="string"&&m.key.length<60);
}
function enabledKeys(config){
 if(!validPublicConfig(config))return [];
 const enabled=new Set(config.modules.filter(m=>m.enabled===true).map(m=>m.key));
 const ordered=Array.isArray(config.navigation)?config.navigation.filter(k=>enabled.has(k)):[];
 return [...new Set([...ordered,...enabled])];
}
function safeChoice(field,requested,fallback){
 return VALID_STYLES[field].includes(requested)?requested:fallback;
}
function responsiveAppLayout(config,width){
 if(!validPublicConfig(config)||!Number.isFinite(width)||width<250||width>3000)
  return {ok:false,reason:"A real content width in layout points is required."};
 const available=Math.floor(width),
  tier=available<380?"compact_phone":available<700?"phone":"tablet",
  presentation=config.presentation||{},
  navChoice=safeChoice("navigationStyle",presentation.navigationStyle,"tabs"),
  galleryChoice=safeChoice("galleryLayout",presentation.galleryLayout,"grid"),
  scale=safeChoice("imageScale",presentation.imageScale,"regular"),
  density=safeChoice("layoutDensity",presentation.layoutDensity,"comfortable"),
  keys=enabledKeys(config),
  galleryCount=Array.isArray(config.publicProfile?.assets?.gallery)?
   config.publicProfile.assets.gallery.filter(x=>typeof x?.uri==="string"&&x.uri.startsWith("https://")).length:0,
  serviceCount=Array.isArray(config.publicProfile?.services)?config.publicProfile.services.length:0;
 // At a narrow width the runtime can adapt navigation presentation without
 // rewriting the owner's stored preference for tablets / other widths.
 const crowdedTabs=keys.length>=5&&(tier!=="tablet")||
   keys.length>=8&&tier==="tablet"||tier==="compact_phone"&&keys.length>=4;
 const navigation=navChoice==="list"||crowdedTabs?"list":"tabs";
 // Explicit stack preferences are always respected. "Grid" is responsive:
 // very narrow or oversized images fall back to a single readable column.
 const gridEnabled=galleryChoice==="grid"&&
  !(tier==="compact_phone")&&
  !(tier==="phone"&&scale==="large"&&available<430);
 const galleryColumns=gridEnabled?(tier==="tablet"?3:2):1;
 const serviceColumns=tier==="tablet"&&serviceCount>=2?2:1;
 const gap=density==="compact"?8:density==="airy"?18:12;
 const heroHeight=tier==="tablet"?(scale==="large"?330:270):
   tier==="compact_phone"?(scale==="large"?230:175):
   scale==="large"?280:220;
 const galleryHeight=tier==="tablet"?(scale==="large"?245:205):
   galleryColumns===1?(scale==="large"?240:205):150;
 const contentGutter=tier==="tablet"?24:tier==="compact_phone"?12:16;
 const reasons=[];
 if(crowdedTabs&&navChoice==="tabs")
  reasons.push("Switches crowded tabs to a stacked navigation list at this width, keeping the owner's stored tab preference for roomier layouts.");
 if(!gridEnabled&&galleryChoice==="grid")
  reasons.push("Shows the gallery as one column where a multi-column grid may make photographs too narrow to inspect.");
 if(serviceColumns===2)
  reasons.push("Displays separate services in two columns when tablet content width leaves sufficient room for readable cards.");
 if(galleryColumns===3)
  reasons.push("Uses three photo columns at tablet width to show more approved images without long scrolling.");
 const approximateGalleryWidth=Math.floor((available-gap*(galleryColumns-1))/galleryColumns);
 return {ok:true,kind:"responsive_public_app_layout_v3163",
  tier,width:available,navigation,galleryColumns,serviceColumns,gap,
  heroHeight,galleryHeight,contentGutter,
  approximateGalleryWidth,enabledSectionCount:keys.length,
  galleryCount,serviceCount,
  ownerNavigationPreference:navChoice,ownerGalleryPreference:galleryChoice,
  automaticRuntimeAdaptations:{navigation:crowdedTabs&&navChoice==="tabs",
   galleryColumns:galleryChoice==="grid"&&!gridEnabled},
  reasons,realLayoutWidthUsed:true,actualTextMeasured:false,
  screenshotReviewed:false,breakpointRulesNotADeviceGuarantee:true,
  touchesBookings:false,changesCustomerData:false,autoPublishes:false};
}
function evaluateResponsiveApp(config){
 if(!validPublicConfig(config))return {ok:false,reason:"An approved module configuration is required."};
 const profiles=SAMPLE_WIDTHS.map(sample=>{
  const layout=responsiveAppLayout(config,sample.width);
  const warnings=[];
  if(layout.automaticRuntimeAdaptations.navigation)
   warnings.push({key:"crowded_tabs_adapted",text:"Long tab navigation switches to a list for this width."});
  if(layout.automaticRuntimeAdaptations.galleryColumns)
   warnings.push({key:"grid_adapted",text:"Grid switches to a single photo column."});
  if(layout.galleryColumns>1&&layout.approximateGalleryWidth<160)
   warnings.push({key:"small_grid_images",text:"Individual photographs may be small to inspect."});
  if(layout.tier==="tablet"&&layout.enabledSectionCount>8)
   warnings.push({key:"long_navigation",text:"Many top-level sections require real navigation testing."});
  return {id:sample.id,label:sample.label,assumedContentWidth:sample.width,
   layout,warnings};
 });
 return {ok:true,kind:"three_width_design_rules_v3163",profiles,
  testedWidths:SAMPLE_WIDTHS.map(x=>x.width),
  totalFitWarnings:profiles.reduce((n,p)=>n+p.warnings.length,0),
  staticPreviewOnly:true,actualScreenshotsCaptured:false,
  realDeviceDimensionsValidated:false,accessibilityCertified:false,
  customerDataRead:false,automaticPublicChanges:false};
}
function recommendResponsiveDesign(config){
 const baseline=evaluateResponsiveApp(config);
 if(!baseline.ok)return baseline;
 const nav=enabledKeys(config),p=config.presentation||{},suggestions=[];
 const manySections=nav.length>=5,
  largeGallery=(config.publicProfile?.assets?.gallery||[]).length>=3,
  scale=p.imageScale||"regular";
 const candidates=[
  {field:"navigationStyle",value:"list",needed:manySections&&p.navigationStyle!=="list",
   reason:"With five or more top-level sections, a list can be easier to scan on smaller phones.",
   tradeoff:"The list occupies more vertical space. Tablet tab navigation may feel quicker."},
  {field:"galleryLayout",value:"stack",needed:largeGallery&&scale==="large"&&p.galleryLayout!=="stack",
   reason:"Large photos in one column keep more detail visible to phone users.",
   tradeoff:"A stacked gallery requires more scrolling, especially on tablets."},
  {field:"layoutDensity",value:"comfortable",needed:p.layoutDensity==="compact"&&manySections,
   reason:"More comfortable spacing can help separate many customer-facing sections.",
   tradeoff:"Roomier spacing shows less information without scrolling."}
 ];
 for(const c of candidates){
  if(!c.needed)continue;
  const proposal={...config,presentation:{...p,[c.field]:c.value}};
  const quality=evaluateResponsiveApp(proposal);
  if(quality.ok)suggestions.push({field:c.field,value:c.value,
    reason:c.reason,tradeoff:c.tradeoff,
    analysisKind:"deterministic_multiscreen_rules",
    baseline:baseline.profiles.map(x=>({width:x.assumedContentWidth,
     navigation:x.layout.navigation,galleryColumns:x.layout.galleryColumns})),
    proposed:quality.profiles.map(x=>({width:x.assumedContentWidth,
     navigation:x.layout.navigation,galleryColumns:x.layout.galleryColumns})),
    ownerApprovalRequired:true,notVisualProof:true,estimatedOnly:true});
  if(suggestions.length===3)break;
 }
 return {ok:true,kind:"responsive_design_guidance_v3163",
  screens:baseline.profiles,suggestions,
  recommendationCount:suggestions.length,
  leadingTradeoff:suggestions.length?suggestions[0].tradeoff:null,
  costFree:true,ownerKeepsFinalChoice:true,autoApply:false,
  screenshotAnalysisPerformed:false,realDeviceTestsRequired:true,
  noPrivateCustomerInfoUsed:true};
}
export {SAMPLE_WIDTHS,responsiveAppLayout,evaluateResponsiveApp,
 recommendResponsiveDesign};
