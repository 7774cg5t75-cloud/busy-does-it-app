/**
 * V3.138 private tap-to-edit bridge and selection guard.
 * Only a locally generated concept HTML view may install the script.
 * Selection messages NEVER mutate the draft; the native controller applies
 * approved field/layout actions with its existing undo and publish gates.
 */
import {fieldChoices} from "./websiteStructuredEditing.mjs";
import {resolveContextualToolbarAction} from "./contextualEditingCore.mjs";
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
  [data-busy-edit-section]:focus-visible{outline:2px solid #4489ed;outline-offset:3px}
  .busy-selected-for-edit{outline:2px solid #4489ed!important;outline-offset:3px!important;border-radius:5px}
  .busy-selection-toolbar{display:flex;gap:5px;align-items:center;position:absolute;z-index:2147483000;
    box-sizing:border-box;max-width:calc(100vw - 16px);border:1px solid #54637a;border-radius:14px;
    box-shadow:0 8px 28px rgba(0,0,0,.28);background:#151c2b;padding:5px;
    font-family:system-ui,-apple-system,sans-serif;white-space:nowrap}
  .busy-selection-toolbar[hidden]{display:none!important}
  .busy-selection-toolbar button{min-width:44px;min-height:44px;padding:10px 12px;
    border:0;border-radius:10px;background:transparent;color:white;font-size:17px;cursor:pointer}
  .busy-selection-toolbar button:focus-visible{outline:2px solid #8db4ff;outline-offset:-2px}
  .busy-selection-toolbar button[data-action="voice"]{background:#27476e;font-size:19px}
  .busy-selection-toolbar button[data-action="edit"]{font-size:14px;font-weight:700}
  @media (prefers-reduced-motion:reduce){.busy-selection-toolbar{transition:none}}
  </style>`;
 const script=`<script>(function(){
  "use strict";
  var previous=null,toolbar=null,anchor=null;
  var labels={photo:"Replace",title:"Edit",body:"Edit",cta:"Edit",ctaHref:"Edit",
   phone:"Edit",email:"Edit",openingHours:"Edit"};
  function bridge(action){
   if(!previous)return;
   var out={channel:"busy.website.tap-to-edit.v1",
    actionChannel:"busy.contextual-action.v1",action:action,
    sectionId:previous.getAttribute("data-busy-edit-section")||"",
    field:previous.getAttribute("data-busy-edit-field")||"",
    itemId:previous.getAttribute("data-busy-edit-item")||"",
    photoIndex:previous.getAttribute("data-busy-edit-photo-index")||""};
   if(window.ReactNativeWebView&&typeof window.ReactNativeWebView.postMessage==="function")
     window.ReactNativeWebView.postMessage(JSON.stringify(out));
  }
  function close(){
   if(previous)previous.classList.remove("busy-selected-for-edit");
   previous=null;
   if(toolbar)toolbar.hidden=true;
  }
  function position(){
   if(!previous||!toolbar||toolbar.hidden)return;
   var rect=previous.getBoundingClientRect();
   var width=Math.max(toolbar.offsetWidth||185,185);
   var x=Math.min(Math.max(8,rect.left+(rect.width-width)/2),Math.max(8,window.innerWidth-width-8));
   var y=rect.bottom+8;
   // Keep the toolbar immediately below when possible; if the selected
   // element is at the screen bottom, place it above instead.
   if(y+58>window.innerHeight&&rect.top>58)y=rect.top-58;
   toolbar.style.left=(x+window.scrollX)+"px";
   toolbar.style.top=(Math.max(4,y)+window.scrollY)+"px";
  }
  function setup(){
   toolbar=document.createElement("div");
   toolbar.className="busy-selection-toolbar";
   toolbar.setAttribute("role","toolbar");
   toolbar.setAttribute("aria-label","Selected website element actions");
   toolbar.hidden=true;
   var actions=[["edit","Edit"],["voice","🎙"],["more","⋯"]];
   actions.forEach(function(pair){
    var button=document.createElement("button");
    button.type="button";button.textContent=pair[1];
    button.setAttribute("data-action",pair[0]);
    button.setAttribute("aria-label",pair[0]==="voice"?"Talk to Busy about selected element":
      pair[0]==="more"?"More options for selected element":"Edit selected element");
    button.addEventListener("click",function(event){
     event.preventDefault();event.stopPropagation();bridge(pair[0]);
    });
    toolbar.appendChild(button);
   });
   document.body.appendChild(toolbar);
   Array.prototype.forEach.call(document.querySelectorAll("[data-busy-edit-section]"),
    function(element){
     if(!element.hasAttribute("tabindex"))element.setAttribute("tabindex","0");
     if(!element.hasAttribute("role")&&!/^(?:A|BUTTON)$/.test(element.tagName))
      element.setAttribute("role","button");
     element.setAttribute("aria-label","Select website "+
      (element.getAttribute("data-busy-edit-field")==="photo"?"photograph":
       element.getAttribute("data-busy-edit-field")||"content")+" to edit");
    });
  }
  function select(element){
   if(previous)previous.classList.remove("busy-selected-for-edit");
   previous=element;
   element.classList.add("busy-selected-for-edit");
   toolbar.firstChild.textContent=labels[element.getAttribute("data-busy-edit-field")]||"Edit";
   toolbar.hidden=false;
   position();
  }
  document.addEventListener("keydown",function(event){
   if(event.key==="Escape"){close();return;}
   if(event.key!=="Enter"&&event.key!==" ")return;
   var active=document.activeElement;
   if(!active||!active.matches||!active.matches("[data-busy-edit-section]"))return;
   event.preventDefault();
   active.click();
  },true);
  document.addEventListener("click",function(event){
   if(toolbar&&toolbar.contains(event.target))return;
   var element=event.target&&event.target.closest&&
     event.target.closest("[data-busy-edit-section]");
   if(!element){close();return;}
   event.preventDefault();event.stopPropagation();select(element);
  },true);
  window.addEventListener("resize",position);
  window.addEventListener("scroll",position,true);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});
  else setup();
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
 if(field==="section"&&!itemId)return {sectionId,field:"section",itemId:null};
 if(itemId){
  if(!["services","faq","testimonials"].includes(section.type)||
     !["title","body"].includes(field)||
     list(section.items).filter(x=>x?.id===itemId).length!==1)return null;
  return {sectionId,field,itemId};
 }
 if(!list(fieldChoices[section.type]).includes(field))return null;
 return {sectionId,field,itemId:null};
}
function resolveTapToolbarAction(draft,pageId,message){
 return resolveContextualToolbarAction(message,payload=>resolveTapSelection(draft,pageId,payload));
}
export {makeTapToEditHtml,resolveTapSelection,resolveTapToolbarAction,CHANNEL};
