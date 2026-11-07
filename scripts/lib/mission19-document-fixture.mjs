import {websiteCreativeCopyCatalog} from '../../supabase/functions/busy-website-worker/websiteCreativeCopy.mjs';
import {WEBSITE_CREATIVE_DOCUMENT_VERSION,WEBSITE_CREATIVE_INTENT_VERSION} from '../../supabase/functions/busy-website-worker/websiteCreativeDocument.mjs';

// Minimal synthetic response-contract fixture, never a real model result or
// a hand-built renderer. All copy resolves exact ORIGINAL approved sources.
export function mission19MinimalCreativeDocument(context){
 const catalog=websiteCreativeCopyCatalog(context.website);if(!catalog.ok)throw Error(catalog.reason);
 const copy=id=>{const source=catalog.sources.find(source=>source.id===id);if(!source)throw Error('Missing original fixture source '+id);return {text:source.text,classification:'verbatim',sourceRefs:[{id:source.id,revision:source.revision}]};};
 const available=context.website.pages.filter(page=>page.enabled!==false).map(page=>page.id),currentNavigation=context.website.navigation?.map(item=>item.id)||[];
 const pageIds=currentNavigation.length===available.length&&new Set(currentNavigation).size===available.length&&currentNavigation.every(value=>available.includes(value))?currentNavigation:available;
 const document={version:WEBSITE_CREATIVE_DOCUMENT_VERSION,brand:null,pages:[{pageId:'home',title:copy('business:name'),purpose:'home',description:copy('section:hero:body'),sections:[{id:'custom-creative-contract-home',layout:{maxWidth:1240,paddingX:32,paddingY:64,mobilePaddingX:18,mobilePaddingY:32,gap:32,background:'paper'},nodes:[{id:'creative-opening',type:'heading',copy:copy('section:hero:title'),level:1,size:88,mobileSize:38,align:'start'},{id:'creative-introduction',type:'text',copy:copy('business:description'),size:20,measure:55},{id:'creative-action',type:'link',copy:copy('section:hero:cta'),target:{pageId:'contact',sectionId:null,contactField:null},presentation:'button'}]}]}],navigation:{placement:'top',primaryPageId:'contact',items:pageIds},removePageIds:[],imageBriefs:[]};
 const approvedIntent={version:WEBSITE_CREATIVE_INTENT_VERSION,allowCopySuggestions:true,allowBrandChange:false,allowNewPages:true,allowRetireAiPages:false,ownerRewriteSourceIds:[]};
 return {document,approvedIntent,copy,catalog};
}
