import {websiteCreativePage} from './websiteCreativeSpecification.mjs';

// Only trusted, reviewed primitives reach the ORIGINAL renderer. A proposal
// cannot supply CSS, markup, fonts, links, images, colour values or new facts.
const list=value=>Array.isArray(value)?value:[];
const typography=section=>Object.keys(section?.appearance||{}).some(key=>/(?:font|weight|tracking|lineheight|heading|bodyScale|textAlign|colou?r)/i.test(key));
const spacing=section=>['sectionSpacing','mobileSectionSpacing','desktopSectionSpacing'].some(key=>Object.hasOwn(section?.appearance||{},key));
export function creativeWebsiteClasses(draft,pageId){
 const spec=websiteCreativePage(draft,pageId);if(!spec)return '';
 const page=list(draft?.pages).find(p=>p.id===pageId),sections=list(draft?.sections).filter(s=>list(page?.sectionIds).includes(s.id));
 const classes=['creative-site',...['opening','measure','alignment','rhythm','emphasis'].map(key=>'creative-'+key+'-'+spec[key])];
 // A later owner typography correction remains authoritative. Geometry may
 // persist while its optional automatic display sizing yields to that choice.
 if(!sections.some(typography))classes.push('creative-auto-type');
 // Spacing is an independent owner decision, including viewport overrides.
 // Yield all optional opening padding when any current page section carries
 // one, so a subsequent owner correction is never beaten by art direction.
 if(!sections.some(spacing))classes.push('creative-auto-opening-space');
 return classes.join(' ');
}
export function creativeWebsiteOrder(draft,pageId,fallback){
 return websiteCreativePage(draft,pageId)?.sectionOrder||fallback;
}

// Finite compositional vocabulary shared by native preview, worker and export.
// Defaults are unchanged; this stylesheet is included ONLY for a valid spec.
// Image dimensions, object-fit/focal positions, font families and colours remain
// in the original renderer and owner appearance rules.
export const creativeWebsiteCss=`
.creative-site main,.creative-site main>*{min-width:0}
.creative-site.creative-measure-focused main>.hero>.wrap,.creative-site.creative-measure-focused main>section>.wrap{max-width:1080px}
.creative-site.creative-measure-wide main>.hero>.wrap,.creative-site.creative-measure-wide main>section>.wrap{max-width:1280px}
.creative-site.creative-rhythm-compact main>section:not(.hero):not([class*="owner-space-"]):not([class*="owner-mobile-space-"]):not([class*="owner-desktop-space-"]):not(.purpose-service-opening):not(.purpose-story):not(.purpose-next){padding-block:clamp(34px,4vw,60px)}
.creative-site.creative-rhythm-generous main>section:not(.hero):not([class*="owner-space-"]):not([class*="owner-mobile-space-"]):not([class*="owner-desktop-space-"]):not(.purpose-service-opening):not(.purpose-story):not(.purpose-next){padding-block:clamp(48px,7vw,104px)}
.creative-site.creative-opening-compact.creative-auto-opening-space .hero>.wrap{padding-block:clamp(32px,4vw,64px)!important}
.creative-site.creative-opening-display.creative-auto-opening-space .hero>.wrap{padding-block:clamp(48px,7vw,100px)!important}
.creative-site.creative-opening-display.creative-auto-type .hero h1{font-size:clamp(3rem,7.6vw,7.8rem);line-height:1.02;max-width:17ch}
.creative-site.creative-opening-compact.creative-auto-type .hero h1{font-size:clamp(2.5rem,5.3vw,5.6rem);max-width:22ch}
.creative-site.creative-opening-display.creative-auto-type .purpose-service-opening h1,.creative-site.creative-opening-display.creative-auto-type .inner-page-opening h1{font-size:clamp(3rem,7.4vw,7.2rem);max-width:18ch}
.creative-site.creative-opening-compact.creative-auto-type .purpose-service-opening h1,.creative-site.creative-opening-compact.creative-auto-type .inner-page-opening h1{font-size:clamp(2.5rem,4.8vw,4.8rem);max-width:24ch}
.creative-site.creative-opening-display.creative-auto-opening-space .purpose-service-opening,.creative-site.creative-opening-display.creative-auto-opening-space .inner-page-opening{padding-bottom:clamp(36px,6vw,88px)!important}
.creative-site.creative-opening-compact.creative-auto-opening-space .purpose-service-opening,.creative-site.creative-opening-compact.creative-auto-opening-space .inner-page-opening{padding-bottom:32px!important}
.creative-site.creative-emphasis-contrast #services{border-top:2px solid var(--accent);border-bottom:1px solid var(--line)}
.creative-site.creative-emphasis-contrast .purpose-service-opening{border-bottom:2px solid var(--accent)}
.creative-site.creative-emphasis-contrast .purpose-business-context{border-top:2px solid var(--accent);border-left:0;padding:24px 0 0}
.creative-site.creative-emphasis-contrast .purpose-next{border-top:2px solid var(--accent)}
.creative-site.creative-emphasis-contrast .crafted-service-number{border-top:2px solid var(--accent);padding-top:10px;align-self:start}
.creative-site.creative-emphasis-quiet .crafted-service-number{border:0;padding-top:0}
/* Wide-image families deliberately keep their original full-row photograph.
   Splitting a 21:8/16:7 visual into a narrow column creates a tiny strip.
   Keep that reviewed crop/proportion instead of manufacturing variety. */
@media(min-width:901px){
 .creative-site.creative-opening-split .hero>.wrap:not(.premium-service-led):not(.premium-story-spread):has(.premium-visual){display:grid!important;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr)!important;gap:clamp(32px,5vw,72px)!important;align-items:center!important}
 .creative-site.creative-opening-split .hero>.wrap:not(.premium-service-led):not(.premium-story-spread)>.premium-intro{grid-column:1!important;grid-row:1!important;min-width:0}
 .creative-site.creative-opening-split .hero>.wrap:not(.premium-service-led):not(.premium-story-spread)>.premium-visual{grid-column:2!important;grid-row:1!important;min-width:0}
 .creative-site.creative-opening-split .hero>.wrap:not(.premium-service-led):not(.premium-story-spread)>.premium-orientation,.creative-site.creative-opening-split .hero>.wrap:not(.premium-service-led):not(.premium-story-spread)>.premium-service-panel{grid-column:1/-1!important;grid-row:auto!important}
 .creative-site.creative-opening-split .hero-no-image .hero-content{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,.65fr);gap:20px clamp(28px,4vw,64px);align-items:end}
 .creative-site.creative-opening-split .hero-no-image .hero-content .kicker{grid-column:1/-1}
 .creative-site.creative-opening-split .hero-no-image .hero-content h1{grid-column:1;grid-row:2/4;margin-bottom:0}
 .creative-site.creative-opening-split .hero-no-image .hero-content .lead{grid-column:2;grid-row:2;margin:0}
 .creative-site.creative-opening-split .hero-no-image .hero-content .cta{grid-column:2;grid-row:3;justify-self:start}
 .creative-site.creative-opening-split .purpose-service-opening>.wrap{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:20px 7%;align-items:end}
 .creative-site.creative-opening-split .purpose-service-opening .inner-breadcrumbs,.creative-site.creative-opening-split .purpose-service-number{grid-column:1/-1}
 .creative-site.creative-opening-split .purpose-service-opening h1{grid-column:1;margin-bottom:0}
 .creative-site.creative-opening-split .purpose-service-opening .inner-page-lead{grid-column:2}
 .creative-site.creative-alignment-offset .purpose-service-layout{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(230px,.6fr);gap:clamp(36px,6vw,84px);align-items:start}
 .creative-site.creative-alignment-offset .purpose-service-layout .purpose-business-context{margin-top:clamp(42px,7vw,100px)}
 .creative-site.creative-alignment-offset .purpose-service-layout.purpose-photo-layout{display:block}
 .creative-site.creative-alignment-offset .purpose-photo-layout .purpose-business-context{max-width:78%;margin-top:28px;margin-left:auto}
 .creative-site.creative-alignment-offset main>section.purpose-story .story-copy{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,.75fr);gap:32px 8%;align-items:end}
 .creative-site.creative-alignment-offset main>section.purpose-story .story-copy>p:first-child{grid-column:1;max-width:none;margin:0}
 .creative-site.creative-alignment-offset main>section.purpose-story .story-copy>p:not(:first-child){grid-column:2;max-width:none;margin:0}
 .creative-site.creative-alignment-offset main>section.purpose-story .story-copy>p:nth-child(n+3){grid-column:1/-1;max-width:60ch;margin-left:auto}
 .creative-site.creative-alignment-offset #about:not(.purpose-story) .story-copy>p:not(:first-child){max-width:48ch;margin-left:auto}
 .creative-site.creative-emphasis-contrast .purpose-next-grid{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end}
 .creative-site.creative-emphasis-contrast .purpose-next .purpose-primary{padding:18px 24px;min-height:66px}
}
@media(max-width:900px){
 .creative-site.creative-opening-split .hero>.wrap{grid-template-columns:minmax(0,1fr)!important}
 .creative-site.creative-opening-split .hero>.wrap>.premium-intro,.creative-site.creative-opening-split .hero>.wrap>.premium-visual{grid-column:1!important;grid-row:auto!important}
 .creative-site.creative-opening-split .hero-no-image .hero-content{display:block}
 .creative-site.creative-opening-split .hero-no-image .hero-content .lead{margin-block:20px}
 .creative-site.creative-alignment-offset .purpose-service-layout,.creative-site.creative-opening-split .purpose-service-opening>.wrap{display:block}
 .creative-site.creative-alignment-offset .purpose-service-layout .purpose-business-context{margin-top:20px}
 .creative-site.creative-opening-display.creative-auto-type .hero h1,.creative-site.creative-opening-display.creative-auto-type .purpose-service-opening h1,.creative-site.creative-opening-display.creative-auto-type .inner-page-opening h1{font-size:clamp(2.65rem,9.5vw,4.6rem);max-width:100%}
 .creative-site.creative-opening-compact.creative-auto-type .hero h1,.creative-site.creative-opening-compact.creative-auto-type .purpose-service-opening h1,.creative-site.creative-opening-compact.creative-auto-type .inner-page-opening h1{font-size:clamp(2.35rem,8.7vw,3.6rem);max-width:100%}
 .creative-site.creative-opening-split .purpose-service-opening h1{margin-bottom:24px}
 .creative-site.creative-rhythm-generous main>section:not(.hero):not([class*="owner-space-"]):not([class*="owner-mobile-space-"]):not([class*="owner-desktop-space-"]):not(.purpose-service-opening):not(.purpose-story):not(.purpose-next){padding-block:52px}
 .creative-site.creative-emphasis-contrast .purpose-next .purpose-primary{min-height:54px}
}
`;
