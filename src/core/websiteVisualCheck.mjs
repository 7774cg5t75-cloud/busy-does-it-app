/**
 * V3.143 private website visual inspection. This JS is injected ONLY into
 * the local concept WebView after the owner taps "Check this layout".
 * Production/ZIP HTML never receives it. Findings are warnings, NOT a
 * simulated AI vision reviewer or automatic approval to publish.
 */
const CHANNEL="busy.website.visual-review.v1";
function makeWebsiteVisualCheckHtml(html){
 if(typeof html!=="string"||html.length>500000||
    !html.startsWith("<!doctype html>")||!html.includes("</body>")||
    /<script\b/i.test(html))
   throw Error("Only an app-owned static preview may be visually inspected.");
 const script=`<script>(function(){
  "use strict";
  function count(selector){return document.querySelectorAll(selector).length;}
  function check(){
   var all=[].slice.call(document.querySelectorAll("main *"));
   var overflow=all.filter(function(node){
    if(!node.getBoundingClientRect)return false;
    var rect=node.getBoundingClientRect();
    var style=window.getComputedStyle(node);
    return style.position!=="fixed"&&style.visibility!=="hidden"&&
      rect.width>0&&(rect.left< -2||rect.right>window.innerWidth+2);
   }).length;
   var imgs=[].slice.call(document.querySelectorAll("main img"));
   var missing=imgs.filter(function(img){return !img.getAttribute("alt")}).length;
   var unloaded=imgs.filter(function(img){return img.complete&&img.naturalWidth===0}).length;
   var targets=[].slice.call(document.querySelectorAll("main a,main button"));
   var small=targets.filter(function(link){
    var rect=link.getBoundingClientRect(),style=getComputedStyle(link);
    return style.display!=="none"&&style.visibility!=="hidden"&&
      rect.width>0&&rect.height>0&&Math.min(rect.height,rect.width)<36;
   }).length;
   var anchors=targets.filter(function(link){
    var href=link.getAttribute("href")||"";
    return href.slice(0,1)==="#"&&href.length>1&&
      !document.getElementById(href.slice(1));
   }).length;
   var headings=[].slice.call(document.querySelectorAll("main h1,main h2,main h3"));
   var clipped=headings.filter(function(h){
    return h.scrollWidth>h.clientWidth+2||h.scrollHeight>h.clientHeight+2;
   }).length;
   var value={channel:"busy.website.visual-review.v1",
    viewport:Math.max(0,Math.round(window.innerWidth)),
    width:Math.max(0,Math.round(document.documentElement.scrollWidth)),
    overflow:Math.min(99,overflow),images:Math.min(99,imgs.length),
    missingAlt:Math.min(99,missing),unloadedImages:Math.min(99,unloaded),
    smallTargets:Math.min(99,small),badAnchors:Math.min(99,anchors),
    clippedHeadings:Math.min(99,clipped),
    headings:Math.min(99,headings.length),
    sections:Math.min(99,count("main section"))};
   if(window.ReactNativeWebView&&typeof window.ReactNativeWebView.postMessage==="function")
    window.ReactNativeWebView.postMessage(JSON.stringify(value));
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",
   function(){window.setTimeout(check,1100)},{once:true});
  else window.setTimeout(check,1100);
 })();</script>`;
 return html.replace("</body>",script+"</body>");
}
/** Clamp every untrusted bridge metric before turning it into a customer note. */
function reviewWebsiteVisualCheck(message){
 if(!message||typeof message!=="object"||Array.isArray(message)||
   message.channel!==CHANNEL||JSON.stringify(message).length>700)return null;
 const fields=["viewport","width","overflow","images","missingAlt",
  "unloadedImages","smallTargets","badAnchors","clippedHeadings","headings","sections"];
 const counts={};
 for(const field of fields){
  const n=message[field];
  if(!Number.isSafeInteger(n)||n<0||n>100000)return null;
  counts[field]=n;
 }
 if(counts.viewport<250||counts.viewport>3000||
    counts.width<0||counts.width>100000)return null;
 const issues=[];
 const add=(id,label,detail)=>issues.push({id,label,detail});
 if(counts.width>counts.viewport+2||counts.overflow)
  add("overflow","Content extends beyond the screen",
    "Check horizontal scrolling, overly wide photos and long wording on this page.");
 if(counts.unloadedImages)
  add("photos","Some photographs did not appear in this private preview",
    "Check the originals and test the hosted preview too. Network access can differ in the editor.");
 if(counts.missingAlt)
  add("descriptions","Some photographs need accessible descriptions",
    "Add meaningful alternative text where appropriate before launching.");
 if(counts.smallTargets)
  add("targets","Some website links may be hard to tap",
    "Check button and link sizes on a real phone before publishing.");
 if(counts.badAnchors)
  add("links","Some on-page links have no matching destination",
    "Review the page's sections and link destinations.");
 if(counts.clippedHeadings)
  add("headings","A heading may be clipped",
    "Try a shorter heading or more generous layout.");
 if(!counts.headings||!counts.sections)
  add("empty","This page may be missing key content",
    "Review the selected page and its visibility settings.");
 return {issues,counts,
  passed:issues.length===0,
  message:issues.length
   ?issues.length+" layout item"+(issues.length===1?"":"s")+" to check before publishing."
   :"No common layout problems detected at this preview width. Still inspect the real hosted website and test a phone."};
}
export {CHANNEL,makeWebsiteVisualCheckHtml,reviewWebsiteVisualCheck};
