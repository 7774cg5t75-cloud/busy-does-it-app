import assert from "node:assert/strict";
import {chromium} from "playwright";
import {designCss,designForWebsite} from "../supabase/functions/busy-website-worker/designSystem.mjs";

const css=designCss(designForWebsite({businessType:"Garden design"}));
const html=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${css}</style></head><body>
<main>
<section id="description" class="owner-heading-large owner-align-center owner-space-generous">
<div class="wrap"><h2>Garden design created for each customer</h2><p>A careful approach to local gardens.</p></div></section>
<section id="feature" class="photo-feature owner-photo-right owner-crop-bottom"><div class="wrap photo-feature-grid">
<img alt="Decorative garden" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23446488'/%3E%3C/svg%3E">
<div><h2>A featured garden</h2><p>Customer-supplied approved photo.</p></div></div></section>
<section id="gallery" class="owner-gallery-compact"><div class="wrap">
<h2>Our photo gallery</h2><div class="gallery">
<img class="gallery-image" alt="Garden one" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E">
<img class="gallery-image" alt="Garden two" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E">
</div></div></section>
</main></body></html>`;
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:820}});
  await page.setContent(html);
  const result=await page.evaluate(()=>{
   const computed=s=>getComputedStyle(document.querySelector(s));
   const image=document.querySelector("#feature img");
   const text=document.querySelector("#feature .photo-feature-grid > div");
   const imageX=image.getBoundingClientRect().left;
   const textX=text.getBoundingClientRect().left;
   return {overflow:document.documentElement.scrollWidth>innerWidth,
    largeHeading:parseFloat(computed("#description h2").fontSize),
    center:computed("#description .wrap").textAlign,
    longPadding:parseFloat(computed("#description").paddingTop),
    imageObject:computed("#feature img").objectPosition,
    imageX,textX,
    featureColumns:computed("#feature .photo-feature-grid").gridTemplateColumns,
    galleryHeight:parseFloat(computed("#gallery .gallery-image").height),
    galleryGap:parseFloat(computed("#gallery .gallery").gap)};
  });
  assert.equal(result.overflow,false,"No horizontal overflow at "+width);
  assert.equal(result.center,"center","Per-section centre alignment at "+width);
  assert.ok(result.largeHeading>25,"Readable large heading at "+width);
  assert.ok(result.longPadding>75,"Roomy section styling at "+width);
  assert.equal(result.imageObject,"50% 100%","Per-section bottom crop at "+width);
  assert.ok(result.galleryHeight<260,"Compact gallery image height at "+width);
  assert.ok(result.galleryGap<=12,"Compact gallery gap at "+width);
  if(width>800)assert.ok(result.imageX>result.textX,"Feature picture follows text on desktop");
  await page.close();
 }
 console.log("V3.139 BROWSER PASS: real shared CSS at phone, tablet, desktop widths, safe section styles, responsive photo side and no horizontal overflow");
}finally{await browser.close();}
