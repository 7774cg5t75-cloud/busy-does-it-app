/**
 * V3.138 private tap-to-edit bridge and selection guard.
 * Only a locally generated concept HTML view may install the script.
 * Selection messages NEVER mutate the draft; the native controller applies
 * approved field/layout actions with its existing undo and publish gates.
 */
import {fieldChoices} from "./websiteStructuredEditing.mjs";
const CHANNEL="busy.website.tap-to-edit.v1";
const list=v=>Array.isArray(v)?v:[];
const clean=v=>typeof v==="string"?v:"";
const supportedPhoto=new Set(["hero","photo-feature","gallery"]);
const MAX_MESSAGE=600;
function makeTapToEditHtml(html){
 if(typeof html!=="string"||html.length>500000||!html.startsWith("<!doctype html>")||
    !html.includes("</body>")||/<script\b/i.test(html))
  throw Error("The private website preview is invalid for editing.");
 // This is a constant, app-owned script; no draft text is interpolated into JS.
 const css=`<style id="busy-editor-selection-style">
  [data-busy-edit-section]{cursor:pointer}
  [data-busy-edit-section]:focus-visible{outline:3px solid #276cdb;outline-offset:3px}
  .busy-selected-for-edit{outline:3px solid #276cdb!important;outline-offset:3px!important;border-radius:3px}
  </style>`;
 const script=`<script>(function(){
  "use strict";
  var previous=null;
  // Keyboard and screen-reader discoverability for the private editing layer.
  Array.prototype.forEach.call(document.querySelectorAll("[data-busy-edit-section]"),
   function(element){
    if(!element.hasAttribute("tabindex"))element.setAttribute("tabindex","0");
    if(!element.hasAttribute("role")&&!/^(?:A|BUTTON)$/.test(element.tagName))
     element.setAttribute("role","button");
    element.setAttribute("aria-label","Edit website "+
     (element.getAttribute("data-busy-edit-field")==="photo"?"photograph":
      element.getAttribute("data-busy-edit-field")||"content"));
   });
  document.addEventListener("keydown",function(event){
   if(event.key!=="Enter"&&event.key!==" ")return;
   var active=document.activeElement;
   if(!active||!active.matches||!active.matches("[data-busy-edit-section]"))return;
   event.preventDefault();
   active.click();
  },true);
  document.addEventListener("click",function(event){
   var element=event.target&&event.target.closest&&
     event.target.closest("[data-busy-edit-section]");
   if(!element)return;
   event.preventDefault();
   event.stopPropagation();
   if(previous)previous.classList.remove("busy-selected-for-edit");
   previous=element;
   element.classList.add("busy-selected-for-edit");
   var out={channel:"busy.website.tap-to-edit.v1",
    sectionId:element.getAttribute("data-busy-edit-section")||"",
    field:element.getAttribute("data-busy-edit-field")||"",
    itemId:element.getAttribute("data-busy-edit-item")||"",
    photoIndex:element.getAttribute("data-busy-edit-photo-index")||""};
   if(window.ReactNativeWebView&&typeof window.ReactNativeWebView.postMessage==="function")
     window.ReactNativeWebView.postMessage(JSON.stringify(out));
  },true);
 })();</script>`;
 return html.replace("</head>",css+"</head>").replace("</body>",script+"</body>");
}
function resolveTapSelection(draft,pageId,message){
 if(!draft?.id||!Array.isArray(draft.sections)||
   !message||typeof message!=="object"||Array.isArray(message))
  return null;
 const payload=JSON.stringify(message);
 if(payload.length>MAX_MESSAGE||message.channel!==CHANNEL)return null;
 const pages=list(draft.pages),page=pages.find(p=>p?.id===pageId&&p.enabled!==false);
 if(!page)return null;
 const sectionId=clean(message.sectionId),field=clean(message.field);
 if(sectionId.length>90||!list(page.sectionIds).includes(sectionId))return null;
 const hits=draft.sections.filter(s=>s?.id===sectionId&&s.enabled!==false);
 if(hits.length!==1)return null;
 const section=hits[0],itemId=clean(message.itemId);
 if(itemId.length>90)return null;
 if(field==="photo"){
  if(!supportedPhoto.has(section.type)||itemId)return null;
  const photoIndex=message.photoIndex===""?-1:Number(message.photoIndex);
  if(section.type==="gallery"){
   if(!Number.isSafeInteger(photoIndex)||photoIndex<0||
      photoIndex>=list(section.items).length||section.items[photoIndex]?.approved===false)
    return null;
  }else if(photoIndex!==-1||!section.asset||section.asset.approved===false)return null;
  return {sectionId,field:"photo",photoIndex:section.type==="gallery"?photoIndex:-1};
 }
 if(message.photoIndex!=="")return null;
 if(itemId){
  if(!["services","faq","testimonials"].includes(section.type)||
     !["title","body"].includes(field)||
     list(section.items).filter(x=>x?.id===itemId).length!==1)return null;
  return {sectionId,field,itemId};
 }
 if(!list(fieldChoices[section.type]).includes(field))return null;
 return {sectionId,field,itemId:null};
}
export {makeTapToEditHtml,resolveTapSelection,CHANNEL};
