/** V3.148: width simulation is private WebView HTML only, never public HTML or a saved draft. */
const PREVIEW_WIDTHS=Object.freeze({phone:390,tablet:768,desktop:1280});
const CANONICAL_META='<meta name="viewport" content="width=device-width,initial-scale=1">';
function withWebsitePreviewViewport(html,mode="full"){
 if(typeof html!=="string"||html.length>500000||!html.startsWith("<!doctype html>")||
   !html.includes(CANONICAL_META)||(html.match(/<meta\s+name="viewport"/gi)||[]).length!==1)
  throw Error("Only an app-owned website can use a simulated preview width.");
 if(mode==="full")return html;
 if(!Object.prototype.hasOwnProperty.call(PREVIEW_WIDTHS,mode))
  throw Error("Choose phone, tablet, desktop or this device.");
 return html.replace(CANONICAL_META,
  '<meta name="viewport" content="width='+PREVIEW_WIDTHS[mode]+',initial-scale=1">');
}
function websitePreviewWidthNote(mode,observedWidth){
 const target=PREVIEW_WIDTHS[mode];
 if(!Number.isSafeInteger(observedWidth)||observedWidth<250||observedWidth>3000)
  return "This layout width has not been measured yet.";
 if(!target)return "Measured "+observedWidth+"px on this device. Check other sizes before publishing.";
 if(Math.abs(observedWidth-target)>Math.max(20,target*.06))
  return "Requested "+mode+" layout ("+target+"px), but the browser measured "+
   observedWidth+"px. Do not treat this as a verified "+mode+" check.";
 return "Measured "+observedWidth+"px for "+mode+". On a smaller screen this view is scaled down. Inspect the hosted website on real devices too.";
}
export {PREVIEW_WIDTHS,withWebsitePreviewViewport,websitePreviewWidthNote};
