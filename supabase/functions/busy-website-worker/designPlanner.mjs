/**
 * V3.100 intelligent website design planning.
 * Deterministic, fact-grounded; never generates user claims, imagery, reviews
 * or credentials. Runs in native draft and hosted website renderer.
 */
const clean=v=>String(v||"").trim();
const list=v=>Array.isArray(v)?v:[];
const section=(parts,id)=>list(parts).find(p=>p?.id===id&&p?.enabled!==false)||null;
const words=v=>clean(v).split(/\s+/).filter(Boolean).length;
const supportedPhoto=p=>!!(p && typeof p==="object" &&
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
 ["wellness",/beauty|salon|spa|wellness|massage|hair|nail|therap|fitness|yoga/],
 ["professional",/account|consult|bookkeep|law|legal|finance|architect|agency|design|coach|tutor/],
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
   typography:["confident","refined","compact"],
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
  let family="editorial";
  if(sector==="trades")family="conversion";
  else if(sector==="hospitality")family=photos?"showcase":"artisan";
  else if(sector==="wellness")family="boutique";
  else if(sector==="nature")family=photos?"portfolio":"organic";
  else if(sector==="professional")family="editorial";
  else family=photos>=2?"portfolio":"minimal";
  const visualIdentity=selectVisualIdentity({businessName,businessType,theme,family,photos});
  // A short brief benefits from a confident typographic hero, not a blank
  // image placeholder, empty gallery or falsely completed features.
  const heroTreatment=photos?"photographic":"typographic";
  const sectionOrder=sector==="hospitality"&&aboutWords>=15
    ? ["hero","about","services","gallery","testimonials","faq","contact"]
    : (sector==="nature"||sector==="wellness")&&photos>=2
      ? ["hero","gallery","services","about","testimonials","faq","contact"]
      : sector==="professional"&&aboutWords>=20
        ? ["hero","about","services","testimonials","faq","gallery","contact"]
        : ["hero","services","about","gallery","testimonials","faq","contact"];
  const present=new Set(active.map(s=>clean(s.id)));
  const visibleOrder=sectionOrder.filter(id=>present.has(id));
  for(const item of active)if(item?.id&&!visibleOrder.includes(item.id))visibleOrder.splice(
    Math.max(0,visibleOrder.length-1),0,item.id
  );
  // Homepage is a tightly edited overview. Dedicated pages hold the rest.
  const homeSectionIds=architecture==="focused-landing" ? visibleOrder :
    visibleOrder.filter(id=>["hero","services","contact"].includes(id)||
      (id==="gallery"&&family==="portfolio")||
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
      approvedPhotos:photos,aboutWords,faqCount,reviewCount,hasContact},
    missing:gaps,
    explanation:architecture==="focused-landing"
      ?"BUSY chose one polished, focused page so limited information doesn't create empty pages."
      :"BUSY chose a detailed homepage and separate pages because enough verified content is available.",
  };
}
export {deriveSector,planWebsiteDesign,photographicCount,stableDesignSeed,selectVisualIdentity};
