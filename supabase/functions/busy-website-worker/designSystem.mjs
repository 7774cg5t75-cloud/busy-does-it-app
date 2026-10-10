/**
 * BUSY DOES IT V3.99 — professional website design foundations.
 * Pure JS so CI can exercise the actual design rules without a live release.
 * All fallbacks are decorative: never invent reviews, credentials or photos.
 */
const PALETTES = {
  nature:       { ink:"#15372E", accent:"#216B52", soft:"#ECF4EF", line:"#D5E5DA", glow:"#CFE8CC", paper:"#FCFDF9" },
  hospitality:  { ink:"#402B2A", accent:"#925334", soft:"#FBF0E7", line:"#EADCD1", glow:"#F4D8B5", paper:"#FFFDF9" },
  wellness:     { ink:"#3F3441", accent:"#795075", soft:"#F6EFF5", line:"#E7DCE8", glow:"#EAD8E8", paper:"#FDFBFD" },
  professional: { ink:"#162B46", accent:"#244E75", soft:"#EFF4F9", line:"#DBE5EF", glow:"#C9DEEF", paper:"#FBFCFE" },
  trades:       { ink:"#172D3B", accent:"#205978", soft:"#EEF4F7", line:"#DBE5EB", glow:"#C7DFE8", paper:"#FAFDFE" },
  neutral:      { ink:"#283344", accent:"#3D536F", soft:"#F2F4F7", line:"#E0E6EB", glow:"#E0E8F2", paper:"#FCFDFE" },
};
const SECTORS = [
  ["nature", /garden|landscap|horticultur|lawn|tree|floris|farm|outdoor/],
  ["hospitality", /cater|food|restaurant|bakery|baker|festival|coffee|cafe|hog roast|chef|hotel/],
  ["wellness", /beauty|salon|spa|wellness|massage|hair|nail|therap|fitness|yoga/],
  ["professional", /account|consult|bookkeep|law|legal|finance|architect|agency|design|coach|tutor/],
  ["trades", /clean|pressure wash|window|electric|plumb|repair|roof|build|handyman|construction|paint|decorat|maintenan/]
];
const clean = v => String(v || "").trim();
const isHex = v => /^#(?:[0-9a-f]{6}|[0-9a-f]{3})$/i.test(clean(v));
const fullHex = value => {
  const hex=clean(value).toUpperCase();
  return hex.length === 4 ? "#"+hex.slice(1).split("").map(x=>x+x).join("") : hex;
};
const rgb = hex => [1,3,5].map(i=>parseInt(fullHex(hex).slice(i,i+2),16));
const luminance = hex => rgb(hex).map(v=>{
  const x=v/255;return x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4;
}).reduce((acc,v,i)=>acc+v*[0.2126,0.7152,0.0722][i],0);
const withWhiteContrast = candidate => {
  let hex=fullHex(candidate);
  if (!isHex(hex)) return "";
  // Buttons always use white text. Reduce over-bright chosen colours until
  // they achieve WCAG AA 4.5:1 contrast instead of presenting illegible CTAs.
  for(let k=0;k<14 && 1.05/(luminance(hex)+0.05)<4.5;k++){
    const next=rgb(hex).map(v=>Math.max(0,Math.round(v*0.86)));
    hex="#"+next.map(v=>v.toString(16).padStart(2,"0")).join("").toUpperCase();
  }
  return hex;
};
const PALETTE_ALTERNATIVES={
 nature:{
  b:{ink:"#183B34",accent:"#3E6252",soft:"#F3F5EA",glow:"#CBDDBF",paper:"#FEFDF8"},
  c:{ink:"#34402C",accent:"#4A643B",soft:"#F4F5EA",glow:"#D5E3B9",paper:"#FCFDF8"}
 },
 trades:{
  b:{ink:"#262E3E",accent:"#3D4F78",soft:"#F1F2F8",glow:"#C8D2EF",paper:"#FCFCFF"},
  c:{ink:"#2F343B",accent:"#71533D",soft:"#F9F3EE",glow:"#E8D1BC",paper:"#FFFDFB"}
 },
 hospitality:{
  b:{ink:"#38322B",accent:"#74603A",soft:"#F8F4E9",glow:"#E6D9B1",paper:"#FEFDF7"},
  c:{ink:"#402C38",accent:"#755068",soft:"#F9F0F3",glow:"#E7D0DB",paper:"#FFFCFD"}
 },
 wellness:{
  b:{ink:"#263A3C",accent:"#42666A",soft:"#EEF6F4",glow:"#C5E1D8",paper:"#FCFEFD"},
  c:{ink:"#484039",accent:"#79624A",soft:"#F7F2EB",glow:"#E9DDC5",paper:"#FFFDF8"}
 },
 professional:{
  b:{ink:"#30353E",accent:"#455A66",soft:"#F2F5F5",glow:"#CFDBE0",paper:"#FDFEFE"},
  c:{ink:"#37332D",accent:"#68523E",soft:"#F6F3ED",glow:"#DDD2BC",paper:"#FFFDF8"}
 },
 neutral:{
  b:{ink:"#293B3B",accent:"#416969",soft:"#ECF5F2",glow:"#CEE5DA",paper:"#FCFEFD"},
  c:{ink:"#3B3542",accent:"#665274",soft:"#F5F0F6",glow:"#DDD2E8",paper:"#FEFBFE"}
 }
};
function designForWebsite({businessType="",theme={},plan=null}={}){
  const sector=SECTORS.find(([,pattern])=>pattern.test(clean(businessType).toLowerCase()))?.[0]||"neutral";
  const mood=["clean","warm","bold","premium"].includes(clean(theme?.mood).toLowerCase())
    ? clean(theme.mood).toLowerCase() : "clean";
  const variant=["a","b","c"].includes(plan?.visualIdentity?.paletteVariant)?plan.visualIdentity.paletteVariant:"a";
  const base={...PALETTES[sector],...(PALETTE_ALTERNATIVES[sector]?.[variant]||{})};
  if(mood==="premium"){
    base.ink=sector==="nature"?"#102E28":"#232C39";
    base.paper="#FCFAF7";
  }
  if(mood==="warm" && sector==="neutral"){
    base.soft="#FAF2E8"; base.glow="#F6D7B6";base.paper="#FFFCF8";
  }
  const chosenAccent=isHex(theme?.primary)?withWhiteContrast(theme.primary):base.accent;
  const accent=chosenAccent||base.accent;
  return Object.freeze({
    sector,mood,
    ink:base.ink,accent,soft:base.soft,line:base.line,glow:base.glow,paper:base.paper,
    secondary:isHex(theme?.secondary)?fullHex(theme.secondary):base.glow,
    hasCustomColour:!!chosenAccent,
  });
}
function designCss(design){
  // Design colours may ONLY arrive through the validated palette factory.
  // No user-supplied raw CSS, image URLs, fonts or unescaped markup.
  const d=design;
  return `
:root{--ink:${d.ink};--accent:${d.accent};--soft:${d.soft};--line:${d.line};--glow:${d.glow};--paper:${d.paper};--accent-soft:${d.secondary};--content:1120px}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;color:var(--ink);background:var(--paper);font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:inherit}a:focus-visible,button:focus-visible{outline:3px solid var(--accent);outline-offset:4px}
.wrap{width:min(100% - 48px,var(--content));margin-inline:auto}
.skip-link{position:absolute;left:12px;top:-60px;padding:12px 16px;background:#fff;color:#101827;z-index:100}
.skip-link:focus{top:10px}
nav{position:relative;z-index:9;background:var(--paper);border-bottom:1px solid var(--line)}
.nav-wrap{min-height:84px;display:flex;align-items:center;justify-content:space-between;gap:25px}
.brand{max-width:320px;text-decoration:none;font-weight:850;line-height:1.15;font-size:1.2rem;letter-spacing:-.04em;overflow-wrap:anywhere}
.nav-links{display:flex;align-items:center;justify-content:flex-end;gap:clamp(10px,2.4vw,28px);flex-wrap:wrap}
.nav-links a{text-decoration:none;font-size:.9rem;font-weight:650;opacity:.9}
.nav-links a:hover{text-decoration:underline;text-underline-offset:6px}
section{position:relative;padding-block:clamp(60px,8vw,116px)}
section:not(.hero){scroll-margin-top:24px}
section:nth-of-type(even):not(.hero){background:var(--soft)}
h1,h2,h3{line-height:1.12;letter-spacing:-.045em;overflow-wrap:break-word}
h1{font-size:clamp(3rem,7.2vw,6.4rem);font-weight:800;max-width:900px;margin:.24em 0}
h2{font-size:clamp(2rem,4vw,3.4rem);font-weight:780;max-width:850px;margin:0 0 25px}
h3{font-size:clamp(1.15rem,2vw,1.4rem);margin:0 0 12px;letter-spacing:-.02em}
p{max-width:68ch;margin:0 0 18px}
.kicker,.eyebrow{font-size:.76rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
.hero{overflow:hidden;padding:0;background:var(--ink);color:#fff}
.hero .wrap{padding-block:clamp(76px,10vw,140px)}
.hero-content{position:relative;z-index:2;max-width:775px}
.hero .kicker{color:var(--glow)}
.hero h1{font-weight:850;letter-spacing:-.065em}
.hero .lead{font-size:clamp(1.05rem,1.9vw,1.36rem);line-height:1.65;color:#E5EEF0;max-width:610px}
.hero::before{content:"";pointer-events:none;position:absolute;width:min(74vw,760px);height:min(74vw,760px);border:1px solid rgba(255,255,255,.13);border-radius:50%;right:-16%;top:-45%}
.hero::after{content:"";pointer-events:none;position:absolute;width:290px;height:290px;border:1px solid rgba(255,255,255,.12);border-radius:50%;right:12%;bottom:-190px}
.hero-with-image .wrap{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.82fr);gap:clamp(35px,6vw,85px);align-items:center}
.hero-image{display:block;width:100%;height:clamp(300px,38vw,550px);object-fit:cover;border-radius:26px 26px 96px 26px;box-shadow:0 26px 60px rgba(0,0,0,.2)}
.hero-with-image::before{right:-38%}
.hero-art{position:absolute;right:clamp(0px,5vw,90px);top:14%;width:min(30vw,420px);aspect-ratio:1;border-radius:38% 62% 71% 29%;background:linear-gradient(145deg,var(--glow),var(--accent-soft));opacity:.19;transform:rotate(-22deg)}
.hero-no-image .hero-content{max-width:840px}
.cta{display:inline-flex;align-items:center;justify-content:center;min-height:50px;max-width:100%;padding:14px 24px;margin-top:20px;background:var(--accent);border-radius:12px;color:#fff!important;text-decoration:none;font-weight:800;line-height:1.3;overflow-wrap:anywhere}
.cta:hover{filter:brightness(1.07);box-shadow:0 12px 25px rgba(0,0,0,.15)}
.hero .cta{background:#fff;color:var(--ink)!important}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,245px),1fr));gap:18px;margin-top:38px}
.grid article,section article{background:#fff;border:1px solid var(--line);border-radius:19px;padding:clamp(23px,3vw,34px);box-shadow:0 11px 38px rgba(10,24,38,.045)}
.grid article{height:100%}
.grid article p,section article p{color:#475569;line-height:1.65}
.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:16px;margin-top:35px}
.gallery-image{display:block;width:100%;height:300px;object-fit:cover;border-radius:18px}
#contact{background:var(--ink)!important;color:#fff}
#contact a{color:#fff;text-decoration-thickness:1px;text-underline-offset:3px}
.site-footer{background:var(--ink);color:#DDE7ED;border-top:1px solid rgba(255,255,255,.16);padding:28px 0}
.site-footer .wrap{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px}
.mood-premium h1,.mood-premium h2{font-family:Georgia,"Times New Roman",serif;font-weight:650;letter-spacing:-.045em}
.mood-premium .cta{border-radius:4px}
.mood-warm .hero-image{border-radius:80px 16px 80px 16px}
.mood-bold h1{font-weight:950}
.mood-clean .hero-image{border-radius:22px}

/* Six genuinely different layout families, selected from recorded business
   type + content evidence, with no extra downloaded fonts or stock imagery. */
.family-conversion .hero{background:linear-gradient(125deg,var(--ink) 0%,#264D61 100%)}
.family-conversion .cta{text-transform:uppercase;letter-spacing:.025em;border-radius:7px}
.family-conversion .grid article{border-top:5px solid var(--accent);border-radius:10px;box-shadow:none}
.family-conversion h2{font-weight:900}
.family-organic .hero{background:linear-gradient(145deg,var(--ink),#285647)}
.family-organic .hero-art{border-radius:62% 38% 29% 71%;transform:rotate(14deg)}
.family-organic .grid article{border-radius:28px 10px 28px 10px}
.family-portfolio .hero-image{border-radius:0 90px 0 90px}
.family-portfolio #gallery{background:var(--paper)}
.family-portfolio .gallery{grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:11px}
.family-portfolio .gallery-image{border-radius:5px;height:clamp(240px,31vw,390px)}
.family-artisan .hero{background:#402B2A}
.family-artisan .hero h1,.family-artisan h2{font-family:Georgia,"Times New Roman",serif;font-weight:600;letter-spacing:-.04em}
.family-artisan .hero-art{border-radius:8%;transform:rotate(24deg);opacity:.16}
.family-artisan .cta{border-radius:3px}
.family-artisan .grid article{border:0;border-bottom:3px solid var(--accent);border-radius:0;box-shadow:none}
.family-showcase .hero-with-image .wrap{grid-template-columns:minmax(0,.85fr) minmax(280px,1fr)}
.family-showcase .hero-image{border-radius:3px;box-shadow:22px 22px 0 rgba(255,255,255,.09)}
.family-showcase h2{font-family:Georgia,"Times New Roman",serif;font-weight:600}
.family-boutique .hero{background:var(--soft);color:var(--ink)}
.family-boutique .hero .kicker{color:var(--accent)}
.family-boutique .hero .lead{color:#4D5365}
.family-boutique .hero h1,.family-boutique h2{font-family:Georgia,"Times New Roman",serif;font-weight:500;letter-spacing:-.035em}
.family-boutique .hero .cta{background:var(--ink);color:#fff!important}
.family-boutique .hero-art{opacity:.34}
.family-boutique .grid article{box-shadow:none;border-radius:5px}
.family-editorial .hero{background:var(--paper);color:var(--ink)}
.family-editorial .hero .kicker{color:var(--accent)}
.family-editorial .hero .lead{color:#475569}
.family-editorial .hero .cta{background:var(--accent);color:#fff!important}
.family-editorial .hero-art{opacity:.24}
.family-editorial .grid article{border-radius:3px;box-shadow:none;border-left:4px solid var(--accent)}
.family-editorial h2{font-family:Georgia,"Times New Roman",serif;font-weight:600}
.family-minimal .hero{background:var(--ink)}
.family-minimal .hero .wrap{max-width:940px}
.family-minimal .hero h1{font-size:clamp(3.2rem,9vw,7.1rem)}
.family-minimal .hero-art{opacity:.11}
.family-minimal .grid article{box-shadow:none;border-radius:5px}

/* Stable customer identity combinations: layout, rhythm and ornament are
   independent within each industry. Every variation has a mobile fallback. */
.visual-hero-type-center .hero-no-image .wrap{align-items:center;text-align:center}
.visual-hero-type-center .hero-no-image .hero-content{margin-inline:auto}
.visual-hero-type-center .hero-no-image .hero .lead{margin-inline:auto}
.visual-hero-type-right .hero-no-image .wrap{align-items:flex-end;text-align:right}
.visual-hero-type-right .hero-no-image .hero-content{margin-left:auto}
.visual-hero-type-right .hero-no-image .hero .lead{margin-left:auto}
.visual-hero-type-poster .hero-no-image h1{font-size:clamp(3.7rem,11vw,8.5rem);line-height:.95;max-width:1000px}
.visual-hero-type-poster .hero-no-image .hero-art{right:-8%;top:-35%;width:54vw}
.visual-hero-image-left .hero-with-image .hero-image{grid-column:1;grid-row:1}
.visual-hero-image-left .hero-with-image .hero-content{grid-column:2;grid-row:1}
.visual-hero-image-frame .hero-image{border-radius:4px!important;border:12px solid rgba(255,255,255,.11)}
.visual-hero-image-feature .hero-with-image .wrap{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr)}
.visual-hero-image-feature .hero-image{height:clamp(320px,49vw,625px);border-radius:4px}
.visual-cards-outlines .grid article{background:transparent;border:2px solid var(--line);box-shadow:none;border-radius:4px}
.visual-cards-rows .grid{display:flex;flex-direction:column;gap:0}
.visual-cards-rows .grid article{background:transparent;border:0;border-bottom:1px solid var(--line);box-shadow:none;border-radius:0;padding:24px 0}
.visual-cards-rows .grid article h3{font-size:1.5rem}
.visual-ornament-arch .hero-art{border-radius:240px 240px 4px 4px;transform:rotate(0deg)}
.visual-ornament-stripes .hero-art{border-radius:0;background:repeating-linear-gradient(115deg,var(--glow) 0,var(--glow) 10px,transparent 10px,transparent 25px);opacity:.12;transform:rotate(-8deg)}
.visual-ornament-glow .hero-art{border-radius:50%;filter:blur(38px);opacity:.22}
.visual-nav-underline .nav-links a{border-bottom:2px solid var(--line);padding-bottom:5px}
.visual-nav-pill .nav-links a{background:var(--soft);padding:7px 13px;border-radius:80px;opacity:1}
.visual-type-refined h1,.visual-type-refined h2{font-family:Georgia,"Times New Roman",serif;font-weight:550;letter-spacing:-.03em}
.visual-type-compact h1{font-size:clamp(2.8rem,6.4vw,5.2rem);letter-spacing:-.04em}
.visual-type-compact h2{font-size:clamp(1.9rem,3.1vw,2.8rem)}
@media(max-width:800px){
 .visual-hero-image-left .hero-with-image .hero-content{grid-column:1;grid-row:1}
 .visual-hero-image-left .hero-with-image .hero-image{grid-column:1;grid-row:2}
 .visual-hero-image-feature .hero-with-image .wrap{grid-template-columns:1fr}
 .visual-hero-type-poster .hero-no-image h1{font-size:clamp(3rem,11vw,5rem)}
 .visual-hero-type-right .hero-no-image .wrap{align-items:flex-start;text-align:left}
}
/* Focused landing pages have one clear visual rhythm and no empty filler. */
.architecture-focused-landing .hero .wrap{min-height:440px;display:flex;flex-direction:column;justify-content:center}
.architecture-focused-landing .hero-with-image .wrap{display:grid;min-height:0}
.tier-rich .grid{gap:24px}
.hero-extra-large .wrap{padding-block:clamp(100px,13vw,176px)}
.hero-medium .wrap{padding-block:clamp(54px,7vw,96px)}
@media(max-width:800px){
 .wrap{width:min(100% - 34px,var(--content))}
 .nav-wrap{align-items:flex-start;flex-direction:column;justify-content:center;gap:15px;padding-block:21px;min-height:0}
 .nav-links{justify-content:flex-start;gap:12px 20px}
 .hero-with-image .wrap{grid-template-columns:1fr}
 .hero-art{width:60vw;opacity:.12;right:-8%}
 .hero-image{height:clamp(240px,65vw,430px);border-radius:20px}
 .hero h1{font-size:clamp(2.7rem,10.4vw,4.4rem)}
 .hero .wrap{padding-block:clamp(68px,11vw,95px)}
 section{padding-block:clamp(54px,12vw,78px)}
}
@media(max-width:800px){
 .family-showcase .hero-with-image .wrap{grid-template-columns:1fr}
 .architecture-focused-landing .hero .wrap{min-height:0}
 .family-portfolio .hero-image{border-radius:18px}
}
@media(max-width:380px){.wrap{width:min(100% - 28px,var(--content))}.brand{font-size:1.05rem}.cta{width:100%}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
`;
}
export {PALETTES,designForWebsite,designCss,withWhiteContrast};
