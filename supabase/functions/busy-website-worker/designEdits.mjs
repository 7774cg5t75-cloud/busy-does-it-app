/**
 * V3.102 — bounded, owner-directed visual and content edits.
 * Interpret explicit instructions only. No invented claims, photos or websites
 * are published by this module; callers rebuild a private draft for review.
 */
const clean=value=>String(value||"").trim();
const list=value=>Array.isArray(value)?value:[];
const slug=value=>clean(value).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const sectionsByPhrase=[
 ["hero",/\b(hero|homepage|home page|main headline)\b/i],
 ["services",/\b(services?|what we do)\b/i],
 ["about",/\b(about|our story)\b/i],
 ["gallery",/\b(gallery|photos?|images?)\b/i],
 ["testimonials",/\b(testimonials?|reviews?)\b/i],
 ["faq",/\b(faq|questions?)\b/i],
 ["contact",/\b(contact|where we work)\b/i],
];
const colourNames={
 navy:"#244E75",blue:"#205978",green:"#216B52",red:"#9F3F3F",
 orange:"#9B522B",purple:"#795075",pink:"#9A496D",
 teal:"#2C6868",black:"#26282C",charcoal:"#3A414A",
 gold:"#97702B",brown:"#78533D"
};
const fail=reason=>({applied:false,reason});
function applyWebsiteVisualEdit(draft,instruction){
 const text=clean(instruction);
 const lower=text.toLowerCase();
 const originalTheme=draft?.theme||{};
 const existing=list(draft?.sections);
 const theme={...originalTheme};
 const sections=existing.map(s=>({...s,items:list(s.items).map(x=>({...x}))}));
 const find=id=>sections.findIndex(s=>s.id===id&&s.enabled!==false);
 const apply=(message)=>({applied:true,reason:message,
   draft:{...draft,theme,sections}});
 let match;

 // Change the exact headline of a named section rather than arbitrarily
 // overwriting another page or the business' saved source-of-truth records.
 match=text.match(/^(?:change|set|update) (?:the )?(services?|about|gallery|testimonials?|reviews?|faq|contact)(?: section)? (?:title|heading) (?:to|as)\s+(.+)$/i);
 if(match){
   const id=sectionsByPhrase.find(([,re])=>re.test(match[1]))?.[0];
   const index=find(id);
   if(index<0)return fail("That website section isn't available. Ask BUSY to create it using confirmed information first.");
   sections[index].title=clean(match[2]).slice(0,120);
   return apply("Updated the "+id+" heading in your private website draft.");
 }

 match=text.match(/^(?:change|set|update) (?:the )?(about|contact)(?: section)? (?:text|description|wording) (?:to|as)\s+(.+)$/i);
 if(match){
   const id=match[1].toLowerCase();
   const index=find(id);
   if(index<0)return fail("The "+id+" section isn't available yet.");
   sections[index].body=clean(match[2]).slice(0,2500);
   return apply("Updated your "+id+" wording exactly as you supplied it.");
 }

 match=text.match(/^(?:change|set|update) (?:the )?(?:description|wording|text) (?:for|of) (.+?) (?:service )?(?:to|as)\s+(.+)$/i);
 if(match){
   const ix=find("services");
   if(ix<0)return fail("There is no existing services section to edit.");
   const target=clean(match[1]).toLowerCase();
   const rows=list(sections[ix].items);
   const at=rows.findIndex(x=>clean(x.title).toLowerCase()===target);
   if(at<0)return fail("BUSY could not match that service exactly. Please use the service name displayed in your website draft.");
   rows[at].body=clean(match[2]).slice(0,1200);
   return apply("Updated your "+rows[at].title+" service description with your wording.");
 }

 // New user-authored information sections are first-class website blocks.
 // Only the owner's literal wording is used; this cannot create fake reviews.
 match=text.match(/^(?:add|create) (?:a |new )?(?:text |information )?section (?:called|named) (.+?) (?:with (?:the )?(?:text|wording)|saying)\s+(.+)$/i);
 if(match){
   const title=clean(match[1]).slice(0,90),body=clean(match[2]).slice(0,2500);
   if(!title||!body)return fail("Supply a section name and the exact text to display.");
   if(sections.filter(s=>s.id.startsWith("custom-")).length>=12)
     return fail("This website has reached its current custom-section limit. You can edit existing sections.");
   const base="custom-"+slug(title).slice(0,65);
   if(base==="custom-")return fail("Use a descriptive section name.");
   let id=base, suffix=2;
   while(sections.some(s=>s.id===id)){id=base+"-"+suffix++;if(suffix>30)return fail("Please choose another section name.");}
   sections.splice(Math.max(1,sections.length-(sections.some(s=>s.id==="contact")?1:0)),0,{
     id,type:"text",title,body,enabled:true
   });
   return apply("Added a private website section with your exact approved wording.");
 }

 match=text.match(/^(?:change|set|update) (?:the )?(?:text|wording|description) (?:of|in|for) (?:the )?(.+?) section (?:to|as)\s+(.+)$/i);
 if(match){
   const target=clean(match[1]).toLowerCase();
   const index=sections.findIndex(s=>s.enabled!==false&&(clean(s.title).toLowerCase()===target||s.id===slug(target)));
   if(index<0)return fail("BUSY could not identify that section exactly. Use the displayed section heading.");
   if(["hero","testimonials","faq","gallery","services"].includes(sections[index].id))
     return fail("That section uses individual fields. Change a specific item or use the section's dedicated controls.");
   sections[index].body=clean(match[2]).slice(0,2500);
   return apply("Changed the "+sections[index].title+" section to your exact wording.");
 }

 match=text.match(/^(?:remove|delete) (?:the )?(.+?) section$/i);
 if(match){
   const target=clean(match[1]).toLowerCase();
   const index=sections.findIndex(s=>s.id.startsWith("custom-")&&(clean(s.title).toLowerCase()===target||s.id===slug(target)));
   if(index<0)return fail("To avoid deleting critical information, only extra sections can be deleted directly. Other sections can be hidden.");
   const title=sections[index].title;
   sections.splice(index,1);
   theme.sectionOrder=list(theme.sectionOrder).filter(id=>id!==existing[index]?.id);
   return apply("Removed your extra "+title+" section from the private website.");
 }

 // No image is added or replaced by URL/guess: photo changes require the
 // pre-existing approved media picker and image provenance safeguards.
 if(/^(?:replace|change|add|swap|upload) (?:the )?(?:hero |main |first |gallery )?(?:photo|image|picture)/i.test(text))
   return fail("To replace a photograph, first add or select an approved customer photo. BUSY will not invent or fetch one.");

 match=lower.match(/^(?:change|set|make|use) (?:the )?(?:main |primary |accent )?(?:website )?(?:colour|color|accent|primary colour|primary color) (?:to|as)\s+(#[0-9a-f]{3,6}|[a-z]+)$/i);
 if(match){
   const chosen=match[1].startsWith("#")?match[1]:colourNames[match[1]];
   if(!chosen||!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(chosen))
     return fail("Choose a recognised colour or a 3- or 6-digit hex colour.");
   theme.primary=chosen;
   return apply("Updated your site's main colour. BUSY will check text contrast automatically.");
 }

 match=lower.match(/^(?:change|set|use) (?:the )?(?:website )?(?:secondary colour|secondary color) (?:to|as)\s+(#[0-9a-f]{3,6}|[a-z]+)$/i);
 if(match){
   const chosen=match[1].startsWith("#")?match[1]:colourNames[match[1]];
   if(!chosen||!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(chosen))
     return fail("Choose a recognised colour or a 3- or 6-digit hex colour.");
   theme.secondary=chosen;
   return apply("Updated the supporting website colour.");
 }

 const knownFamilies=["conversion","editorial","minimal","organic","artisan","showcase","boutique","portfolio"];
 match=lower.match(/^(?:use|switch to|change to|try) (?:a |the )?(minimal|editorial|conversion|organic|artisan|showcase|boutique|portfolio)(?: design| layout| website| style)?$/i);
 if(match){
   const selected=match[1];
   if(!knownFamilies.includes(selected))return fail("That website style isn't supported.");
   const approvedCount=Number(draft?.designPlan?.signals?.approvedPhotos||0);
   if(["showcase","portfolio"].includes(selected)&&approvedCount===0)
     return fail("That photo-led design needs an approved business photograph. Try editorial, organic or minimal instead.");
   theme.designFamily=selected;
   return apply("BUSY switched the private website to the "+selected+" design. All business facts stay unchanged.");
 }

 match=lower.match(/^(?:use|make|change|set) (?:the )?(?:services?|service) (?:cards?|layout|section) (?:to |as )?(cards?|outlines?|rows?)$/i);
 if(match){
   const x=match[1];
   theme.cardLayout=x.startsWith("row")?"rows":x.startsWith("outline")?"outlines":"cards";
   return apply("Changed how your services are presented.");
 }
 if(/\b(center|centre)\b.+\b(hero|headline|intro|heading)\b|\b(hero|headline)\b.+\b(center|centre)\b/i.test(lower)){
   if(Number(draft?.designPlan?.signals?.approvedPhotos||0)>0){
     theme.heroLayout="image-feature";
     return apply("Made the main photograph more prominent while keeping the headline clear.");
   }
   theme.heroLayout="type-center";
   return apply("Centred the main headline on the photo-free hero.");
 }
 match=lower.match(/^(?:move|put|place) (?:the )?(?:main |hero )?(?:photo|image) (?:on|to) (?:the )?(left|right)$/);
 if(match){
   if(Number(draft?.designPlan?.signals?.approvedPhotos||0)===0)
     return fail("There is no approved hero image to move. BUSY can use a typography-led design instead.");
   theme.heroLayout=match[1]==="left"?"image-left":"image-right";
   return apply("Moved the approved main photograph to the "+match[1]+".");
 }

 match=lower.match(/^(?:move|put) (?:the )?(.+?)(?: section)? (before|above|after|below) (?:the )?(.+?)(?: section)?$/);
 if(match){
   const resolve=(name)=>{
     const label=clean(name).toLowerCase();
     return sections.find(s=>s.enabled!==false&&(s.id===label||clean(s.title).toLowerCase()===label))?.id || "";
   };
   const from=resolve(match[1]),to=resolve(match[3]);
   if(!from||!to)return fail("Choose the names of two existing website sections.");
   if(from===to)return fail("Choose two different sections.");
   if(find(from)<0||find(to)<0)return fail("Both sections must exist in your draft to move them.");
   const base=list(draft?.designPlan?.sectionOrder);
   const ids=[...new Set([...base,...sections.filter(s=>s.enabled!==false).map(s=>s.id)])]
     .filter(id=>sections.some(s=>s.id===id&&s.enabled!==false));
   const filtered=ids.filter(id=>id!==from);
   const position=filtered.indexOf(to);
   filtered.splice(position+(/after|below/.test(match[2])?1:0),0,from);
   theme.sectionOrder=filtered;
   return apply("Moved the "+from+" section "+match[2]+" "+to+".");
 }

 return fail("BUSY can safely adjust headings, supplied wording, services, colours, layout families and section order. More detailed visual edits and photo changes need dedicated controls.");
}
export {applyWebsiteVisualEdit};
