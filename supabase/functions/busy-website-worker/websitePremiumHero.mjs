import {heroFamilies,heroFamilyCss} from './websiteHeroFamilies.mjs';
// Trusted checked-in presentation modules only, never a client plugin registry.
// Add reviewed families without changing operation/request limits or old IDs.
export const PREMIUM_HERO_COMPOSITIONS=Object.freeze(heroFamilies.map(f=>f.id));
export const PREMIUM_HERO_VARIATIONS=Object.freeze(['signature','airy','compact','crafted','crafted-airy','crafted-compact','authored','authored-airy','authored-compact','narrative','atelier']);
export function premiumHeroInner(kind,{copy='',image='',images=/** @type {string[]} */([]),services='',hasImage=false,variation='signature'}={}){
 const family=heroFamilies.find(f=>f.id===kind);if(!family)return '';
 const reviewed=PREMIUM_HERO_VARIATIONS.includes(variation)?variation:'signature';
 const treatment=['crafted','authored','narrative','atelier'].includes(reviewed)?'signature':reviewed.replace(/^(?:crafted|authored|narrative)-/, '');
 const media=hasImage?`<figure class="premium-visual">${image}</figure>`:'';
 const extra=Array.isArray(images)?images.slice(0,2):[];
 const body=family.render({copy,media,extra,services:['narrative','atelier'].includes(reviewed)?'':services});
 // Signature preserves exact historical markup. Variations are finite CSS.
 return treatment==='signature'?body:body.replace('class="wrap ',`class="wrap premium-variation-${treatment} `);
}
export const premiumHeroCss=`${heroFamilyCss}

.hero .hero-image.owner-image-crop-top{object-position:center top}
.hero .hero-image.owner-image-crop-bottom{object-position:center bottom}
.hero .hero-image.owner-image-fit-contain{object-fit:contain}
/* Deliberately different DOM/grid compositions; no fonts, scripts or remote assets. */
.hero [class*="premium-"]{min-width:0;box-sizing:border-box}
.hero .premium-intro{position:relative;z-index:2;max-width:72ch}
:where(.hero .premium-intro) h1{font-size:clamp(2.6rem,5.8vw,5.8rem);line-height:1.04;max-width:17ch;overflow-wrap:anywhere}
.hero .premium-intro .lead{max-width:54ch;line-height:1.7}
.hero .premium-visual{margin:0;min-width:0;width:100%}
.hero .premium-visual .hero-image{width:100%;max-width:100%;height:100%;object-fit:cover;box-shadow:none;display:block}
.hero .premium-story-spread{display:grid!important;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr)!important;gap:clamp(24px,4vw,64px)!important;align-items:end!important}
.hero .premium-story-spread .premium-intro{grid-column:1/-1;max-width:90ch}
:where(.hero .premium-story-spread) h1{font-weight:500;max-width:19ch}
.hero .premium-story-spread .premium-visual{grid-column:1;aspect-ratio:4/3}
.hero .premium-story-spread .hero-image{border-radius:4px 70px 4px 4px}
.hero .premium-story-spread .premium-orientation{grid-column:2;align-self:center}
.hero .premium-story-spread .hero-service-overview ul{display:grid;gap:16px}
.hero .premium-story-spread .hero-service-overview li{font-size:clamp(1.2rem,2vw,1.7rem)}
.hero .premium-service-led{display:grid!important;grid-template-columns:minmax(0,1.25fr) minmax(0,.75fr)!important;gap:clamp(28px,4vw,60px)!important;align-items:start!important}
:where(.hero .premium-service-led) h1{font-weight:850;letter-spacing:-.055em}
.hero .premium-service-panel{border:1px solid currentColor;padding:clamp(20px,3vw,36px);border-radius:16px}
.hero .premium-service-panel .hero-service-overview{margin:0;border:0;padding:0}
.hero .premium-service-panel ul{display:grid;gap:16px}
.hero .premium-service-led .premium-visual{grid-column:1/-1;aspect-ratio:21/8}
.hero .premium-service-led .hero-image{border-radius:12px}
.hero .premium-quiet-portrait{display:grid!important;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr)!important;gap:clamp(32px,7vw,104px)!important;align-items:center!important}
.hero .premium-quiet-portrait .premium-intro{grid-column:2;grid-row:1}
.hero .premium-quiet-portrait .premium-visual{grid-column:1;grid-row:1;aspect-ratio:3/4}
.hero .premium-quiet-portrait .hero-image{border-radius:160px 160px 8px 8px}
:where(.hero .premium-quiet-portrait) h1{font-weight:500;letter-spacing:-.035em;max-width:13ch}
.hero .premium-quiet-portrait .hero-service-overview{border:0;margin-top:24px;padding:0}
.hero.hero-no-image .premium-quiet-portrait .premium-intro{grid-column:1/-1;max-width:70ch;margin-inline:auto;text-align:center}
.hero.hero-no-image .premium-quiet-portrait .lead{margin-inline:auto}
@media(max-width:800px){
 .hero .premium-story-spread,.hero .premium-service-led,.hero .premium-quiet-portrait{grid-template-columns:minmax(0,1fr)!important;gap:28px!important;padding-block:48px!important}
 .hero .premium-intro,.hero .premium-visual,.hero .premium-orientation,.hero .premium-service-panel{grid-column:1!important;grid-row:auto!important;order:initial!important}
 .hero .premium-intro{grid-row:1!important}
 :where(.hero .premium-intro) h1{font-size:clamp(2.25rem,8.5vw,3.6rem);max-width:22ch}
 .hero .premium-visual{max-height:440px;aspect-ratio:4/3!important;overflow:hidden}
 .hero .premium-quiet-portrait .premium-visual{max-width:420px;justify-self:center}
 .hero .premium-intro .lead{font-size:1.05rem}
}
@media(prefers-reduced-motion:reduce){.hero .cta{transition:none}}

@media(max-width:800px){section.hero.owner-mobile-photo-crop-top .hero-image{object-position:center top}section.hero.owner-mobile-photo-crop-center .hero-image{object-position:center center}section.hero.owner-mobile-photo-crop-bottom .hero-image{object-position:center bottom}}
@media(min-width:801px){section.hero.owner-desktop-photo-crop-top .hero-image{object-position:center top}section.hero.owner-desktop-photo-crop-center .hero-image{object-position:center center}section.hero.owner-desktop-photo-crop-bottom .hero-image{object-position:center bottom}}

/* Whole-page editorial rhythm. Low specificity lets reviewed owner controls win. */
:where([class*="premium-site-"]) :where(.story-copy){max-width:66ch}
:where([class*="premium-site-"]) :where(.story-copy p){line-height:1.85;margin:0 0 1.3em}
:where([class*="premium-site-"]) :where(.story-copy p:first-child){font-size:clamp(1.15rem,1.7vw,1.45rem);line-height:1.65}
:where(.premium-site-story-spread,.premium-site-asymmetric-split,.premium-site-typography-first) :where(.story-layout){display:grid;grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr);gap:clamp(24px,6vw,88px);align-items:start}
:where(.premium-site-story-spread,.premium-site-editorial-collage) :where(#services .grid article){border-top:2px solid var(--line);border-radius:0;box-shadow:none;background:transparent;padding:28px 0}
:where(.premium-site-story-spread) :where(#services h3){font-family:Georgia,serif;font-size:clamp(1.3rem,2vw,1.8rem)}
:where(.premium-site-service-led) :where(#services .grid article){border-left:3px solid var(--ink);border-radius:0;padding:28px;box-shadow:none}
:where(.premium-site-quiet-portrait,.premium-site-typography-first) :where(#contact .wrap){max-width:1000px}
:where([class*="premium-site-"]) :where(#contact a){text-underline-offset:.25em;overflow-wrap:anywhere}
:where([class*="premium-site-"]) :where(.gallery-image){background:transparent}
@media(max-width:800px){:where([class*="premium-site-"]) :where(.story-layout){grid-template-columns:minmax(0,1fr);gap:24px}:where([class*="premium-site-"]) :where(.story-copy){max-width:100%}}
`;
