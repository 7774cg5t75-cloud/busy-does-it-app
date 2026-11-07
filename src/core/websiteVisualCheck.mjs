/**
 * V3.143 private website visual inspection. This JS is injected ONLY into
 * the local concept WebView after the owner taps "Check this layout".
 * Production/ZIP HTML never receives it. Findings are warnings, NOT a
 * simulated AI vision reviewer or automatic approval to publish.
 */
const CHANNEL="busy.website.visual-review.v1";
function makeWebsiteVisualCheckHtml(html,inspectionKey="preview"){
 if(typeof html!=="string"||html.length>500000||
    !html.startsWith("<!doctype html>")||!html.includes("</body>")||
    /<script\b/i.test(html))
   throw Error("Only an app-owned static preview may be visually inspected.");
 if(typeof inspectionKey!=="string"||!/^[a-zA-Z0-9._:-]{1,160}$/.test(inspectionKey))
   throw Error("Invalid inspection identifier.");
 const script=`<script>(function(){
  "use strict";
  function count(selector){return document.querySelectorAll(selector).length;}
  function check(){
   var all=[].slice.call(document.querySelectorAll("main *"));
   var overflowNodes=all.filter(function(node){
    if(!node.getBoundingClientRect)return false;
    var rect=node.getBoundingClientRect();
    var style=window.getComputedStyle(node);
    return style.position!=="fixed"&&style.visibility!=="hidden"&&
      rect.width>0&&(rect.left< -2||rect.right>window.innerWidth+2);
   });
   var overflow=overflowNodes.length;
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
   var clippedNodes=headings.filter(function(h){
    return h.scrollWidth>h.clientWidth+2||h.scrollHeight>h.clientHeight+2;
   });
   var clipped=clippedNodes.length;
   function sectionIds(nodes){
    var ids=[];nodes.forEach(function(node){
     var section=node.closest&&node.closest("section"),id=section&&section.id;
     if(typeof id==="string"&&/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(id)&&ids.indexOf(id)<0&&ids.length<6)ids.push(id);
    });return ids;
   }
   // V3.145 additional rendered evidence, never guess from brand palettes.
   // Sample readable solid colour backgrounds only. Image/gradient/alpha
   // backgrounds are explicitly "unassessed", not declared accessible.
   function rgb(value){
    var match=String(value||"").match(/^rgba?\\(\\s*(\\d+(?:\\.\\d+)?)\\s*,\\s*(\\d+(?:\\.\\d+)?)\\s*,\\s*(\\d+(?:\\.\\d+)?)\\s*(?:,\\s*([\\d.]+))?\\s*\\)$/i);
    return match?[Number(match[1]),Number(match[2]),Number(match[3]),
      match[4]===undefined?1:Number(match[4])]:null;
   }
   function luminance(c){
    var t=c.slice(0,3).map(function(x){var v=x/255;
      return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);});
    return t[0]*.2126+t[1]*.7152+t[2]*.0722;
   }
   function backgroundFor(element){
    var node=element;
    while(node&&node.nodeType===1){
     var st=getComputedStyle(node);
     if(st.backgroundImage&&st.backgroundImage!=="none")return null;
     var value=rgb(st.backgroundColor);
     if(value&&value[3]>=.99)return value;
     if(value&&value[3]>.01)return null;
     node=node.parentElement;
    }
    return [255,255,255,1];
   }
   var textBlocks=[].slice.call(document.querySelectorAll('main p,main li')).filter(function(node){
    var rect=node.getBoundingClientRect(),style=getComputedStyle(node);
    return node.textContent.trim()&&rect.width>0&&rect.height>0&&style.visibility!=='hidden'&&style.display!=='none';
   }).length;
   var samples=[].slice.call(document.querySelectorAll("main h1,main h2,main h3,main p,main li,main a,main button")).slice(0,120);
   var lowContrast=0,contrastUnknown=0,contrastChecked=0,smallBodyText=0,smallTextNodes=[];
   samples.forEach(function(node){
    if(!node.textContent||!node.textContent.trim())return;
    var bounds=node.getBoundingClientRect(),style=getComputedStyle(node);
    if(bounds.width<=0||bounds.height<=0||style.visibility==="hidden"||style.display==="none")return;
    var size=parseFloat(style.fontSize)||0;
    if(/^(P|LI)$/.test(node.tagName)&&size>0&&size<14){smallBodyText++;smallTextNodes.push(node);}
    var front=rgb(style.color),back=backgroundFor(node);
    if(!front||!back||front[3]<.99){contrastUnknown++;return;}
    contrastChecked++;
    var a=luminance(front),b=luminance(back);
    var contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    var strong=style.fontWeight==="bold"||Number(style.fontWeight)>=700;
    var threshold=size>=24||size>=18.66&&strong?3:4.5;
    if(contrast<threshold)lowContrast++;
   });
   var value={channel:"busy.website.visual-review.v1",key:${JSON.stringify(inspectionKey)},
    viewport:Math.max(0,Math.round(window.innerWidth)),
    width:Math.max(0,Math.round(document.documentElement.scrollWidth)),
    textBlocks:Math.min(10000,textBlocks),
    overflow:Math.min(99,overflow),images:Math.min(99,imgs.length),
    missingAlt:Math.min(99,missing),unloadedImages:Math.min(99,unloaded),
    smallTargets:Math.min(99,small),badAnchors:Math.min(99,anchors),
    clippedHeadings:Math.min(99,clipped),
    clippedSectionIds:sectionIds(clippedNodes),overflowSectionIds:sectionIds(overflowNodes),smallTextSectionIds:sectionIds(smallTextNodes),
    lowContrast:Math.min(99,lowContrast),contrastUnknown:Math.min(99,contrastUnknown),
    contrastChecked:Math.min(99,contrastChecked),smallBodyText:Math.min(99,smallBodyText),
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
function reviewWebsiteVisualCheck(message,inspectionKey="preview"){
 if(!message||typeof message!=="object"||Array.isArray(message)||
   message.channel!==CHANNEL||message.key!==inspectionKey||
   JSON.stringify(message).length>1800)return null;
 const fields=["viewport","width","overflow","images","missingAlt",
  "unloadedImages","smallTargets","badAnchors","clippedHeadings","headings","sections",
  "lowContrast","contrastUnknown","contrastChecked","smallBodyText"];
 const counts={};
 for(const field of fields){
  const n=message[field];
  if(!Number.isSafeInteger(n)||n<0||n>100000)return null;
  counts[field]=n;
 }
 if(counts.viewport<250||counts.viewport>3000||
    counts.width<0||counts.width>100000)return null;
 // Optional for compatibility with earlier retained report packets. If a
 // report supplies coverage, the comparator requires it on both sides.
 if(message.textBlocks!==undefined){
  if(!Number.isSafeInteger(message.textBlocks)||message.textBlocks<0||message.textBlocks>10000)return null;
  counts.textBlocks=message.textBlocks;
 }
 const targets={};
 for(const [key,counter] of [["clippedSectionIds","clippedHeadings"],["overflowSectionIds","overflow"],["smallTextSectionIds","smallBodyText"]]){
  if(message[key]===undefined)continue;
  const ids=message[key];
  if(!Array.isArray(ids)||ids.length>6||ids.length>counts[counter]||new Set(ids).size!==ids.length||
   ids.some(id=>typeof id!=="string"||!/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(id)))return null;
  targets[key]=[...ids];
 }
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
 if(counts.lowContrast)
  add("contrast","Some text may be difficult to read",
    "Check the colours of text against its background, especially on a phone.");
 if(counts.smallBodyText)
  add("readability","Some paragraph text may be too small",
    "Consider larger body text or a roomier layout.");
 if(counts.contrastUnknown)
  add("contrast-unchecked","Some text is over a complex background",
    "Manually verify text over photographs or gradients; this check cannot confirm its contrast.");
 if(counts.clippedHeadings)
  add("headings","A heading may be clipped",
    "Try a shorter heading or more generous layout.");
 if(!counts.headings||!counts.sections)
  add("empty","This page may be missing key content",
    "Review the selected page and its visibility settings.");
 return {issues,counts,...Object.keys(targets).length?{targets}:{},
  passed:issues.length===0,
  message:issues.length
   ?issues.length+" layout item"+(issues.length===1?"":"s")+" to check before publishing."
   :"No common layout problems detected at this preview width. Still inspect the real hosted website and test a phone."};
}
export {CHANNEL,makeWebsiteVisualCheckHtml,reviewWebsiteVisualCheck};
