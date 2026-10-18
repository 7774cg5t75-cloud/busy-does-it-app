/**
 * V3.100 intelligent website design planning.
 * Deterministic, fact-grounded; never generates user claims, imagery, reviews
 * or credentials. Runs in native draft and hosted website renderer.
 */
const clean=v=>String(v||"").trim();
const list=v=>Array.isArray(v)?v:[];
const section=(parts,id)=>list(parts).find(p=>p?.id===id&&p?.enabled!==false)||null;
const words=v=>clean(v).split(/\s+/).filter(Boolean).length;
const supportedPhoto=p=>!!(p && typeof p==="object" && p.approved!==false &&
  (clean(p.storagePath) || /^https:\/\/[^\s"'<>]+$/i.test(clean(p.uri))));
const photographicCount=(parts)=>{
  const hero=section(parts,"hero")?.asset;
  const gallery=section(parts,"gallery");
  return list([hero,...list(gallery?.items)])
    .filter(supportedPhoto).map(p=>clean(p.storagePath||p.uri))
    .filter((value,i,all)=>all.indexOf(value)===i).length;
};
const SECTOR_PATTERNS=[
 ["nature",/garden|landscap|lawn|tree|floris|horticultur|farm|outdoor/],
 ["hospitality",/cater|food|restaurant|bakery|baker|festival|coffee|cafe|hog roast|chef|hotel/],
 ["wellness",/beauty|salon|barber|spa|wellness|massage|hair|nail|therap|fitness|yoga/],
 ["creative",/photograph|videograph|film studio|illustrat|artist|potter|ceramic|music studio|recording studio|craft studio|graphic design/],
 ["retail",/retail|bookshop|gift shop|jewel|clothing|fashion|boutique shop|independent shop|shopkeeper/],
 ["learning",/school|tutor|lesson|training|education|academy|instructor|workshop leader|driving instruct/],
 ["events",/event plan|wedding plan|event venue|conference|theatre|event production|entertainment|performer/],
 ["professional",/account|consult|bookkeep|law|legal|finance|architect|agency|design|coach/],
 ["trades",/clean|wash|window|electric|plumb|repair|roof|build|handyman|construction|paint|decorat|maintenan/]
];
function deriveSector(type){
 const text=clean(type).toLowerCase();
 return SECTOR_PATTERNS.find(([_,pattern])=>pattern.test(text))?.[0]||"neutral";
}
// A stable, non-secret design seed prevents random redesigns on every render.
// It adds variation *within* a sector, not just across sectors. No tenant data
// is fetched and no website names are published to a comparison service.
function stableDesignSeed(value=""){
 let hash=2166136261;
 for(const character of clean(value).normalize("NFKC").toLowerCase()){
   hash ^= character.charCodeAt(0);
   hash=Math.imul(hash,16777619);
 }
 return hash>>>0;
}
const pick=(options,number)=>options[number % options.length];
function selectVisualIdentity({businessName="",businessType="",theme={},family="",photos=0}={}){
 const seed=stableDesignSeed([businessName,businessType].map(clean).join("::"));
 const choose=(options,shift)=>pick(options,seed>>>shift);
 const imageLayout = photos > 0
   ? choose(["image-right","image-left","image-frame","image-feature"],4)
   : choose(["type-left","type-center","type-right","type-poster"],4);
 const choices = {
   heroLayout:imageLayout,
   cardLayout:choose(["cards","outlines","rows"],8),
   ornament:choose(["ripple","arch","glow","stripes"],12),
   navStyle:choose(["quiet","underline","pill"],16),
   typography:choose(["confident","refined","compact"],20),
   paletteVariant:choose(["a","b","c"],24),
 };
 const allowed={
   heroLayout:photos > 0
     ? ["image-right","image-left","image-frame","image-feature"]
     : ["type-left","type-center","type-right","type-poster"],
   cardLayout:["cards","outlines","rows"],
   ornament:["ripple","arch","glow","stripes"],
   navStyle:["quiet","underline","pill"],
   typography:["confident","refined","compact","editorial","friendly"],
   paletteVariant:["a","b","c"]
 };
 for(const [field,options] of Object.entries(allowed)){
   if(options.includes(theme?.[field])) choices[field]=theme[field];
 }
 return {
   ...choices,
   fingerprint:[
     family,choices.heroLayout,choices.cardLayout,choices.ornament,
     choices.navStyle,choices.typography,choices.paletteVariant
   ].join("|")
 };
}
function planWebsiteDesign({businessType="",businessName="",sections=[],theme={}}={}){
  const active=list(sections).filter(s=>s?.enabled!==false);
  const services=list(section(active,"services")?.items).filter(s=>clean(s?.title));
  const serviceDescriptions=services.filter(s=>words(s?.body)>=5).length;
  const about=section(active,"about");
  const aboutWords=words(about?.body);
  const gallery=section(active,"gallery");
  const photos=photographicCount(active);
  const faqCount=list(section(active,"faq")?.items).filter(x=>clean(x?.title)&&clean(x?.body)).length;
  const reviewCount=list(section(active,"testimonials")?.items).filter(x=>clean(x?.body)).length;
  const contact=section(active,"contact");
  const hasContact=!!(clean(contact?.phone)||clean(contact?.email));
  const hero=section(active,"hero");
  const descriptionWords=words(hero?.body);
  const sector=deriveSector(businessType);
  const richSignals=[
    services.length>=3&&serviceDescriptions>=2,
    services.length>=2&&aboutWords>=35,
    services.length>=2&&photos>=2,
    photos>=3&&aboutWords>=20,
    services.length>=3&&faqCount>=2,
    services.length>=2&&reviewCount>=2,
  ].filter(Boolean).length;
  // Distinct landing-page vs multi-page results. Sparse input always produces
  // one intentional well-composed page, never empty filler pages.
  const architecture=richSignals>=1?"multi-page":"focused-landing";
  const contentTier=(richSignals>=2&&photos>=2&&services.length>=3)?"rich":
    architecture==="multi-page"?"established":"essential";
  // Curated sector *families*, not one fixed template per trade.
  // A stable name-based choice gives meaningful distinction between firms
  // even if their recorded services and photographs are otherwise identical.
  const familyOptions={
    trades:["conversion","editorial","minimal"],
    nature:photos>0?["portfolio","showcase"]:["organic","minimal","editorial"],
    hospitality:photos>0?["showcase","artisan"]:["artisan","editorial","minimal"],
    wellness:["boutique","editorial","minimal"],
    professional:["editorial","minimal","boutique"],
    creative:photos>=2?["portfolio","showcase","editorial"]:["editorial","boutique","minimal"],
    retail:photos>=2?["showcase","portfolio","artisan"]:["artisan","minimal","editorial"],
    learning:["editorial","minimal","conversion"],
    events:photos>=2?["showcase","conversion","editorial"]:["conversion","editorial","boutique"],
    neutral:photos>=2?["portfolio","editorial","minimal"]:["minimal","editorial","boutique"]
  };
  const allowedFamilies=familyOptions[sector]||familyOptions.neutral;
  const familySeed=stableDesignSeed([businessName,businessType].map(clean).join("::"));
  const allSupportedFamilies=["conversion","editorial","minimal","organic","artisan","showcase","boutique","portfolio"];
  const photoCompatible=photos>0 || !["showcase","portfolio"].includes(theme?.designFamily);
  const family=allSupportedFamilies.includes(theme?.designFamily) && photoCompatible
    ? theme.designFamily
    : allowedFamilies[(familySeed>>>4)%allowedFamilies.length];
  const heroPhotos=photographicCount(active.filter(part=>part.id==='hero'));
 const visualIdentity=selectVisualIdentity({businessName,businessType,theme,family,photos:heroPhotos});
  // A short brief benefits from a confident typographic hero, not a blank
  // image placeholder, empty gallery or falsely completed features.
  const heroTreatment=heroPhotos?"photographic":"typographic";
  // Event caterers with enough *approved* food photographs need a menu/image-led
  // introduction. A cafe with the same amount of text can remain story-led.
  // Without confirmed photographs or services, never invent visual content.
  const eventCateringWithPhotos=sector==="hospitality"&&
    /cater|festival|hog roast|food truck|street food|food stall|mobile food/i.test(clean(businessType))&&
    services.length>=2&&photos>=2;
  const sectionOrder=eventCateringWithPhotos
    ? ["hero","services","gallery","about","testimonials","faq","contact"]
    : sector==="hospitality"&&aboutWords>=15
    ? ["hero","about","services","gallery","testimonials","faq","contact"]
    : (sector==="nature"||sector==="wellness")&&photos>=2
      ? ["hero","gallery","services","about","testimonials","faq","contact"]
      : sector==="professional"&&aboutWords>=20
        ? ["hero","about","services","testimonials","faq","gallery","contact"]
      : sector==="creative"&&photos>=2
        ? ["hero","gallery","services","about","testimonials","faq","contact"]
      : sector==="retail"&&photos>=2
        ? ["hero","services","gallery","about","faq","testimonials","contact"]
      : sector==="learning"&&faqCount>=2
        ? ["hero","services","faq","about","testimonials","gallery","contact"]
      : sector==="events"&&photos>=2
        ? ["hero","gallery","services","about","faq","testimonials","contact"]
        : ["hero","services","about","gallery","testimonials","faq","contact"];
  const present=new Set(active.map(s=>clean(s.id)));
  const requestedOrder=list(theme?.sectionOrder).filter(id=>typeof id==="string"&&present.has(id));
  const chosenOrder=requestedOrder.length ? [
    ...new Set(["hero",...requestedOrder.filter(id=>id!=="hero"),...sectionOrder])
  ] : sectionOrder;
  const visibleOrder=chosenOrder.filter(id=>present.has(id));
  for(const item of active)if(item?.id&&!visibleOrder.includes(item.id))visibleOrder.splice(
    Math.max(0,visibleOrder.length-1),0,item.id
  );
  // Homepage is a tightly edited overview. Dedicated pages hold the rest.
  const homeSectionIds=architecture==="focused-landing" ? visibleOrder :
    visibleOrder.filter(id=>active.some(x=>x.id===id&&["text","photo-feature"].includes(x.type)&&id.startsWith("custom-"))||
      ["hero","services","contact","products","events"].includes(id)||
      (id==="gallery"&&(family==="portfolio"||eventCateringWithPhotos))||
      (id==="about"&&["artisan","editorial","boutique"].includes(family))||
      (id==="testimonials"&&reviewCount>0));
  const gaps=[];
  if(!clean(businessName))gaps.push("business-name");
  if(!services.length)gaps.push("services");
  if(!hasContact)gaps.push("contact");
  if(!photos)gaps.push("approved-photos");
  if(!descriptionWords&&aboutWords===0)gaps.push("business-description");
  // All statements below describe design decisions, NOT marketing claims.
  return {
    version:2,architecture,contentTier,sector,family,heroTreatment,
    visualIdentity,
    sectionOrder:visibleOrder,homeSectionIds,
    signals:{services:services.length,describedServices:serviceDescriptions,
      approvedPhotos:photos,aboutWords,faqCount,reviewCount,hasContact,
      eventCateringWithPhotos},
    missing:gaps,
    explanation:architecture==="focused-landing"
      ?"BUSY chose one polished, focused page so limited information doesn't create empty pages."
      :"BUSY chose a detailed homepage and separate pages because enough verified content is available."+
       (eventCateringWithPhotos?" Approved event-food photos and real services appear early because this is event catering.":"")+
       (["creative","retail","learning","events"].includes(sector)?
        " BUSY chose a "+sector+"-appropriate layout using only recorded sections and approved assets.":""),
  };
}
export {deriveSector,planWebsiteDesign,photographicCount,stableDesignSeed,selectVisualIdentity};
