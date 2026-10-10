/**
 * V3.107 — actual Chromium DOM/CSS website quality inspection.
 * Checks rendered text and controls; no remote resources, model calls or
 * user records. Contrast is measured only against known solid backgrounds.
 * Unknown gradients/images are EXPLICITLY unassessed, never reported as a pass.
 */
export async function measureWebsiteQuality(page){
 return page.evaluate(()=>{
   const all=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
   const visible=element=>{
     if(!(element instanceof Element))return false;
     const style=getComputedStyle(element),rect=element.getBoundingClientRect();
     return style.display!=="none"&&style.visibility!=="hidden"&&
       parseFloat(style.opacity||"1")>0&&rect.width>0&&rect.height>0;
   };
   const rgb=color=>{
     const match=String(color||"").match(/^rgba?\(([^)]*)\)$/i);
     if(!match)return null;
     const parts=match[1].trim().split(/[,\/\s]+/).filter(Boolean);
     if(parts.length<3)return null;
     const values=parts.slice(0,3).map(v=>v.endsWith("%")?
       Number.parseFloat(v)*2.55:Number.parseFloat(v));
     if(values.some(n=>!Number.isFinite(n)||n<0||n>255))return null;
     const alpha=parts[3]===undefined?1:Number.parseFloat(parts[3]);
     if(!Number.isFinite(alpha)||alpha<0||alpha>1)return null;
     return {channels:values,alpha};
   };
   const mix=(front,back,alpha)=>front.map((n,i)=>n*alpha+back[i]*(1-alpha));
   const luminance=channels=>channels.map(v=>{
     const n=v/255;return n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4;
   }).reduce((a,n,i)=>a+n*[0.2126,0.7152,0.0722][i],0);
   const contrast=(a,b)=>{
     const first=luminance(a),second=luminance(b);
     return (Math.max(first,second)+0.05)/(Math.min(first,second)+0.05);
   };
   const background=element=>{
     let cur=element;
     while(cur instanceof Element){
       const style=getComputedStyle(cur);
       // Gradients, background images, semi-transparent ancestors and blends
       // cannot be reliably measured as one flat colour at this text pixel.
       if(style.backgroundImage!=="none"||style.mixBlendMode!=="normal"||
          Number.parseFloat(style.opacity||"1")<1)return null;
       const bg=rgb(style.backgroundColor);
       if(!bg)return null;
       if(bg.alpha>=0.999)return bg.channels;
       if(bg.alpha>0.001)return null;
       cur=cur.parentElement;
     }
     return [255,255,255];
   };
   const textCandidates=all("main h1, main h2, main h3, main p, main li, main a, main button, main label, nav a, footer p").filter(
     element=>visible(element)&&!!element.textContent?.trim()
   ).slice(0,400);
   let assessedTextCount=0,unassessedContrastCount=0,lowContrastCount=0;
   const lowContrastExamples=[];
   for(const element of textCandidates){
     const style=getComputedStyle(element);
     const bg=background(element),fg=rgb(style.color);
     if(!bg||!fg){unassessedContrastCount++;continue;}
     const foreground=mix(fg.channels,bg,fg.alpha);
     const ratio=contrast(foreground,bg);
     const px=Number.parseFloat(style.fontSize)||0;
     const weight=Number.parseFloat(style.fontWeight)||400;
     const threshold=(px>=24||(px>=18.66&&weight>=700))?3:4.5;
     assessedTextCount++;
     if(ratio+0.001<threshold){
       lowContrastCount++;
       if(lowContrastExamples.length<5)lowContrastExamples.push({
         tag:element.tagName.toLowerCase(),
         contrastRatio:Number(ratio.toFixed(2)),
         requiredRatio:threshold
       });
     }
   }
   const mainText=all("main p, main li").filter(x=>visible(x)&&!!x.textContent?.trim()).slice(0,300);
   const smallBodyTextCount=mainText.filter(x=>(Number.parseFloat(getComputedStyle(x).fontSize)||0)<14).length;
   const touch=all("main button, main a, main [role=button], main input[type=submit], nav a").filter(visible).slice(0,300);
   const smallTouchTargetCount=touch.filter(x=>{
     const r=x.getBoundingClientRect();
     return r.width<24||r.height<24; // WCAG 2.2 AA target-size minimum, simplified
   }).length;
   const named=element=>{
     const label=element.getAttribute("aria-label")||"";
     const ids=(element.getAttribute("aria-labelledby")||"").split(/\s+/).filter(Boolean);
     const referenced=ids.map(id=>document.getElementById(id)?.textContent||"").join(" ");
     const text=element.textContent||"";
     const imageNames=all("img[alt]",element).map(img=>img.getAttribute("alt")||"").join(" ");
     const title=element.getAttribute("title")||"";
     const value=element instanceof HTMLInputElement&&["button","submit","reset"].includes(element.type)?element.value:"";
     return !![label,referenced,text,imageNames,title,value].some(x=>String(x).trim());
   };
   const controls=all("main a, main button, main input, main select, main textarea, nav a")
     .filter(visible).slice(0,300);
   const unnamedControlsCount=controls.filter(x=>!named(x)&&
     !((x instanceof HTMLInputElement || x instanceof HTMLSelectElement || x instanceof HTMLTextAreaElement)
       &&x.labels?.length>0)).length;
   const fields=all("main input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]), main select, main textarea")
     .filter(visible).slice(0,200);
   const missingInputLabelCount=fields.filter(x=>{
     const aria=x.getAttribute("aria-label")||x.getAttribute("aria-labelledby");
     return !aria&&!x.closest("label")&&!(x.labels?.length>0);
   }).length;
   const missingImageAltCount=all("main img").filter(x=>visible(x)&&!x.hasAttribute("alt")).length;
   const headings=all("main h1, main h2, main h3, main h4, main h5, main h6").filter(visible);
   let lastHeadingLevel=0,headingLevelSkips=0;
   for(const h of headings){
     const level=Number(h.tagName.slice(1));
     if(lastHeadingLevel>0&&level>lastHeadingLevel+1)headingLevelSkips++;
     lastHeadingLevel=level;
   }
   return {
     version:1,
     assessedTextCount,unassessedContrastCount,lowContrastCount,lowContrastExamples,
     smallBodyTextCount,smallTouchTargetCount,unnamedControlsCount,
     missingInputLabelCount,missingImageAltCount,headingLevelSkips,
     hasDocumentLanguage:!!document.documentElement.lang.trim(),
     hasMainLandmark:!!document.querySelector("main")
   };
 });
}
