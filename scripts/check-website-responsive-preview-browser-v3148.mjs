import assert from "node:assert/strict";
import {chromium} from "playwright";
import {designCss,designForWebsite} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {withWebsitePreviewViewport,PREVIEW_WIDTHS} from "../src/core/websiteResponsivePreview.mjs";
const css=designCss(designForWebsite({businessType:"Independent cafe"}));
const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body class="family-showcase sector-hospitality">'+
'<nav><div class="wrap nav-wrap"><a class="brand" href="#main">Independent Cafe</a><div class="nav-links"><a href="#services">Services</a><a href="#contact">Contact</a></div></div></nav>'+
'<main id="main"><section class="hero hero-with-image"><div class="wrap"><div class="hero-content"><h1>Warm food and great coffee</h1><p class="lead">Local business with fresh food.</p></div><img class="hero-image" alt="Coffee" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E"></div></section>'+
'<section id="services"><div class="wrap"><h2>Our menu</h2><div class="grid"><article><h3>Fresh coffee</h3><p>Made for you</p></article><article><h3>Lunch</h3><p>Daily specials</p></article></div></div></section>'+
'<section id="contact"><div class="wrap"><h2>Find us</h2><a href="mailto:test@example.com">Email us</a></div></section></main></body></html>';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 for(const mode of ["phone","tablet","desktop"]){
  await page.setContent(withWebsitePreviewViewport(html,mode),{waitUntil:"load"});
  const v=await page.evaluate(()=>{
   const hero=getComputedStyle(document.querySelector(".hero-with-image .wrap"));
   const nav=getComputedStyle(document.querySelector(".nav-wrap"));
   return {width:window.innerWidth,columns:hero.gridTemplateColumns,
     nav:nav.flexDirection,overflow:document.documentElement.scrollWidth>window.innerWidth+2,
     scripts:document.scripts.length};
  });
  assert.ok(Math.abs(v.width-PREVIEW_WIDTHS[mode])<=5,
   mode+" must render the requested CSS viewport, observed "+v.width);
  assert.equal(v.overflow,false,mode+" horizontal overflow");
  assert.equal(v.scripts,0,"Preview has no executable scripts");
  assert.equal(v.nav,mode==="desktop"?"row":"column");
  assert.equal(v.columns.split(" ").length,mode==="desktop"?2:1);
  assert.ok((await page.screenshot({type:"png"})).length>1000);
 }
 await page.close();
 console.log("V3.148 BROWSER PASS: phone/tablet/desktop CSS widths and layouts rendered on a phone viewport, no sideways overflow or scripts.");
}finally{await browser.close();}
