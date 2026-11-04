import {validPublicBusinessContent} from './businessContentRecords.mjs';
import {websiteDraftHasScope} from './websiteDraftScope.mjs';
import {prepareWebsiteRequest,websiteRequestContent} from './websiteRequestPlan.mjs';
const fail=reason=>({ok:false,reason});
export function websiteStoryboardInstructions(website,{goal,pairs=[]}={}){
 if(typeof goal!=='string'||!Array.isArray(pairs)||pairs.length>4||pairs.some(p=>!p||Object.keys(p).sort().join(',')!=='serviceId,storagePath'||!/^[-a-zA-Z0-9_]{1,128}$/.test(p.serviceId)||!/^[-a-zA-Z0-9_./]{1,300}$/.test(p.storagePath))||new Set(pairs.map(p=>p.serviceId)).size!==pairs.length||new Set(pairs.map(p=>p.storagePath)).size!==pairs.length)return fail('Choose up to four exact, distinct service and photograph relationships.');
 const expressive=/^(?:make my catering website more impressive|make it look more like a premium creative business|try another full-page design|keep all my wording but change the presentation|make it look amazing without photos|make the menu stand out more)$/i.test(goal.trim());
 const recognised=expressive||/^(?:make my website look exceptional|keep my words but improve the design|make the whole page more elegant|try a more distinctive design|tell our story better|make our menu the main attraction|show these photographs alongside the right services)$/i.test(goal.trim());if(!recognised)return fail('That full-page request needs clarification. No partial change was prepared.');
 const home=website?.pages?.find(p=>p.id==='home'&&p.enabled!==false),sections=(website?.sections||[]).filter(s=>s.enabled!==false&&home?.sectionIds.includes(s.id));
 if(/without photos/i.test(goal)&&sections.some(s=>s.type==='hero'&&s.asset||s.type==='gallery'&&s.items?.length))return fail('Review removing the current website pictures in the original photo controls first, or keep this photographic direction.');
 if(!home||!sections.some(s=>s.type==='hero'))return fail('Open the current homepage first.');
 if(/show these photographs/i.test(goal)&&!pairs.length)return fail('Which photograph belongs with which service? Choose the exact relationship; I will not guess from filenames or image content.');
 const variation=expressive?(website.theme?.heroVariation==='atelier'&&/^try another/i.test(goal)?'narrative':'atelier'):'narrative';
 const commands=[];if(website.theme?.heroVariation!==variation)commands.push(variation==='atelier'?'compose an expressive complete website':'compose a connected visual story');
 for(const s of sections){if(s.type==='services'&&s.appearance?.serviceLayout&&s.appearance.serviceLayout!=='brand')commands.push('show services as the original layout');if(s.id==='about'&&s.appearance?.readingLayout&&s.appearance.readingLayout!=='brand')commands.push('show about text as the original layout');}
 for(const p of pairs)commands.push('pair approved photo "'+p.storagePath+'" with service "'+p.serviceId+'"');
 if(/menu (?:the main attraction|stand out more)/i.test(goal)){const menu=sections.find(s=>s.type==='products'),hero=sections.find(s=>s.type==='hero');if(!menu||!validPublicBusinessContent(menu.previewFeed)||menu.previewFeed.businessId!==website.businessId||!menu.previewFeed.records.some(r=>r.kind==='product'&&r.data.status==='active'))return fail('Add eligible approved menu records on this page first.');if(hero.ctaHref!=='#products')commands.push('point the main button to products');if(hero.cta!=='Explore the menu')commands.push('change the hero button text to "Explore the menu"');const story=sections.find(s=>s.id==='about');if(story&&home.sectionIds.indexOf(menu.id)>home.sectionIds.indexOf(story.id))commands.push('move products before about');}
 if(!commands.length)return fail('This direction is already prepared. Your current website is unchanged.');
 return {ok:true,instruction:commands.join('; '),outline:sections.map(s=>({title:s.title,purpose:s.type==='hero'?'Introduce your offer':s.type==='services'?'Explain the work and reviewed photo relationships':s.type==='products'?'Explore approved menu or products':s.id==='about'?'Understand your approach':s.type==='contact'?'Reach the existing contact destination':'Review supplied information'})),missingInformation:sections.some(s=>s.id==='about')?[]:['What would you most like customers to know about your approach? Optional: add your own story.'],noInferredPhotoMeaning:true};
}
export function prepareWebsiteStoryboard({website,businessId,ownerId,profileRevision,goal,pairs=[]},deps){
 if(!ownerId||!websiteDraftHasScope(website,businessId))return fail('Open your own current business website.');const proposal=websiteStoryboardInstructions(website,{goal,pairs});if(!proposal.ok)return proposal;
 const plan=prepareWebsiteRequest(website,{draftId:website.id,pageId:'home',generation:website.generation,instruction:proposal.instruction},deps);return plan.ok?{...proposal,plan,ownerId,businessId,profileRevision,source:websiteRequestContent(website),requiresReview:true,mayExecute:false,publicActivation:false}:plan;
}

// Exact owner-selected relationships; never image classification or write authority.
export function websitePhotographyInstructions(website,choice){
 if(!choice||Object.keys(choice).sort().join(',')!=='storagePath,target'||typeof choice.storagePath!=='string'||!/^[-a-zA-Z0-9_./]{1,300}$/.test(choice.storagePath)||choice.storagePath.split('/').includes('..'))return fail('Choose one exact current picture.');
 const t=choice.target;if(!t||!['product','section','gallery','omit'].includes(t.kind)||Object.keys(t).sort().join(',')!==(t.kind==='product'?'id,kind,revision':t.kind==='section'?'id,kind':'kind'))return fail('Choose a supported destination for this picture.');
 const sections=website?.sections||[],assets=sections.filter(s=>s.type==='gallery'&&s.enabled!==false).flatMap(s=>s.items||[]).filter(a=>a.storagePath===choice.storagePath);if(assets.length!==1)return fail('Review the exact approved picture in this business’s gallery.');
 const q='"'+choice.storagePath+'"',used=sections.some(s=>s.storyPhoto?.storagePath===choice.storagePath||(s.contentPhotos||[]).some(p=>p.asset?.storagePath===choice.storagePath)||(s.items||[]).some(i=>i.photoBinding?.storagePath===choice.storagePath));const commands=[];
 if(t.kind==='omit')return {ok:true,instruction:'omit approved photo '+q+' from the website'};
 if(used)commands.push('release approved photo '+q+' to the gallery');
 if(t.kind==='product'){
  if(typeof t.id!=='string'||!/^[-a-zA-Z0-9_]{1,128}$/.test(t.id)||!Number.isSafeInteger(t.revision)||t.revision<1)return fail('Choose the current approved product revision.');commands.push('pair approved photo '+q+' with product "'+t.id+'" revision '+t.revision);
 }else if(t.kind==='section'){
  const section=sections.find(s=>s.id===t.id&&s.enabled!==false&&['about','text'].includes(s.type));if(!section||!/^[-a-zA-Z0-9_]{1,100}$/.test(t.id))return fail('Choose one supplied story or process.');commands.push('pair approved photo '+q+' with section "'+t.id+'"');
 }else if(!used)return fail('This picture is already only in the gallery.');
 return {ok:true,instruction:commands.join('; '),requiresReview:true,mayExecute:false};
}
