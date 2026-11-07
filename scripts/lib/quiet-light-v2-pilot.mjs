import {createHash} from 'node:crypto';
import {mission16Fixture} from './mission16-site-fixtures.mjs';
import {buildWebsiteDraft,applyWebsiteInstruction,applyWebsitePageChange,renderWebsiteHtml,rebuildPrivateWebsiteDraft} from '../../src/domain/websiteBuilder.js';
import {prepareWholeWebsiteCreativeReview,keepWholeWebsite} from '../../src/core/wholeWebsitePlan.mjs';
import {prepareWebsiteCreativeDocument,reviewWebsiteCreativeDocumentProposal} from '../../src/core/websiteCreativeDocumentReview.mjs';
import {deterministicWebsiteCreativeSpecification} from '../../supabase/functions/busy-website-worker/websiteCreativeSpecification.mjs';
import {websiteCreativeCopyCatalog} from '../../supabase/functions/busy-website-worker/websiteCreativeCopy.mjs';
import {validateWebsiteCreativeDocument} from '../../supabase/functions/busy-website-worker/websiteCreativeDocument.mjs';
import {projectWebsiteCreativeDocumentProviderRequest} from '../../supabase/functions/busy-builder-proposals/websiteIntelligenceProviderProjection.mjs';
import {websiteRequestContent} from '../../src/core/websiteRequestPlan.mjs';
import {makeWebsiteRecoveryPoint,restoreWebsiteRecoveryPoint} from '../../src/core/websiteRecoveryPoint.mjs';
import {stableJson} from '../../src/core/stableJson.mjs';

// Engineering fixtures only: no provider transport, credentials or hosted data.
// A real pilot must rebuild this original source under actual Lab membership,
// profile/snapshot revisions and a new independent one-use owner approval.
export const QUIET_LIGHT_V2_PILOT_VERSION='busy.quiet-light-creative-pilot.v2';
export const QUIET_LIGHT_V2_PILOT_MODEL='gpt-6.1-sol';
export const QUIET_LIGHT_V2_PILOT_PAGE_IDS=Object.freeze(['home','services','contact']);
export const quietLightV2Digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const clone=value=>JSON.parse(JSON.stringify(value));
const bytes=value=>Buffer.byteLength(typeof value==='string'?value:stableJson(value),'utf8');
const deps={pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml};
const must=result=>{if(!result?.ok)throw Error(result?.reason||'The original authority did not verify this fixture.');return result;};

export function quietLightV2PilotContext(){
 const context=mission16Fixture(2);
 // Re-enter the ORIGINAL draft generator with a fixed, explicitly synthetic
 // identity. Date.now() IDs would change otherwise identical request digests
 // between rehearsals. This is not a hosted Website identity or approval.
 context.website=buildWebsiteDraft({businessId:context.businessId,brandBrain:{websiteBrief:context.profile},previousDraft:{...context.website,id:'website-quiet-light-v2-offline-source'}});
 // Use the ORIGINAL finite owner instruction. The approved story remains in
 // its original source section/copy catalogue; it does not require a fourth
 // page. This instruction is common to both future comparison candidates.
 const hidden=applyWebsiteInstruction(context.website,'Hide the about section');
 if(!hidden.applied)throw Error(hidden.reason);
 context.website=hidden.draft;
 context.profile={...context.profile,toneOfVoice:'Considered, clear and independent; purposeful creative decisions.',targetAudience:'Independent businesses working through brand direction and website content.'};
 context.goal='Prepare one image-free three-page website: Home, Services and Contact. Make it individual and considered. Keep my approved action wording and destination. Use only supplied facts; review new wording, typography, colours and responsive composition.';
 if(stableJson(context.website.pages.map(page=>page.id))!==stableJson(QUIET_LIGHT_V2_PILOT_PAGE_IDS))throw Error('The original three-page source changed; review a new pilot.');
 return context;
}

export function quietLightV2OfflineResponse(context){
 const catalog=must(websiteCreativeCopyCatalog(context.website));
 const source=id=>{const row=catalog.sources.find(row=>row.id===id);if(!row)throw Error('Missing original approved source '+id);return row;};
 const copy=(text,id,classification='derived')=>({text,classification,sourceRefs:[{id,revision:source(id).revision}]});
 const exact=id=>copy(source(id).text,id,'verbatim');
 const derived=(text,id='business:description')=>copy(text,id);
 let n=0,s=0;
 const node=(type,extra)=>({id:'q'+(++n),type,...extra});
 const heading=(value,level=2,size=44)=>node('heading',{copy:value,level,size,mobileSize:Math.min(size,44),align:'start'});
 const text=value=>node('text',{copy:value,size:20,measure:52});
 const stack=children=>node('stack',{gap:24,children});
 const grid=children=>node('grid',{columns:[6,5],gap:48,mobileColumns:1,mobileGap:24,align:'start',children});
 const action=()=>node('link',{copy:exact('section:hero:cta'),target:{pageId:'contact',sectionId:null,contactField:null},presentation:'button'});
 const email=()=>node('link',{copy:derived('Email the studio','business:name'),target:{pageId:null,sectionId:null,contactField:'email'},presentation:'button'});
 const section=(nodes,background='paper')=>({id:'custom-creative-quiet-pilot-'+(++s),layout:{maxWidth:1200,paddingX:40,paddingY:64,mobilePaddingX:20,mobilePaddingY:40,gap:32,background},nodes});
 const page=(pageId,title,purpose,description,sections)=>({pageId,title:derived(title,'business:name'),purpose,description:derived(description),sections});
 const document={version:'busy.website-creative-document.v2',brand:{headingFont:'system-sans',bodyFont:'georgia',palette:{ink:'#172B33',paper:'#F6F3E8',accent:'#203C48',muted:'#586268'},gradient:{from:'#E9E1CE',to:'#F6F3E8',angle:125}},pages:[
  page('home','Home','home','Brand direction and website content for independent businesses.',[
   section([heading(exact('section:hero:body'),1,104),grid([text(exact('business:description')),stack([text(derived('Conversation. A considered direction. Purposeful refinement.','section:about:body')),action()])])],'ink'),
   section([heading(derived('Clarity comes before decoration.','section:about:body'),2,60),text(exact('section:about:body'))],'gradient')
  ]),
  page('services','Services','services','Explore a considered starting point for your business identity and website content.',[
   section([heading(derived('A considered direction. A clearer story.','section:about:body'),1,80),text(exact('business:description'))]),
   section([grid([stack([heading(exact('service:services:service-0:title')),text(exact('service:services:service-0:body'))]),stack([heading(exact('service:services:service-1:title')),text(exact('service:services:service-1:body')),heading(exact('service:services:service-2:title')),text(exact('service:services:service-2:body'))])]),action()],'gradient')
  ]),
  page('contact','Contact','contact','Start a conversation about your brand direction, website content and next decisions.',[
   section([heading(derived('Bring the questions.','section:about:body'),1,96),grid([text(derived('Bring the material you already have and the questions you are trying to answer.','section:about:body')),stack([text(derived('Your approval remains part of every important decision.','section:about:body')),email()])])],'ink')
  ])
 ],navigation:{placement:'rail',primaryPageId:'contact',items:[...QUIET_LIGHT_V2_PILOT_PAGE_IDS]},removePageIds:[],imageBriefs:[]};
 const approvedIntent={version:'busy.website-creative-intent.v1',allowCopySuggestions:true,allowBrandChange:true,allowNewPages:false,allowRetireAiPages:false,ownerRewriteSourceIds:[]};
 must(validateWebsiteCreativeDocument(context.website,document,{approvedIntent,profile:context.profile,forEdit:true}));
 return {approvedIntent,response:{version:'busy.website-design-intelligence.v2',scope:{ownerId:context.ownerId,businessId:context.businessId,websiteId:context.website.id,generation:context.website.generation,profileRevision:context.profileRevision},explanation:'Manually authored OFFLINE engineering fixture exercising expressive typography, original source-grounded writing and three purposeful responsive pages. No real model response or superiority is claimed.',document}};
}

export async function prepareQuietLightV2Pilot({model=QUIET_LIGHT_V2_PILOT_MODEL}={}){
 const context=quietLightV2PilotContext(),fixture=quietLightV2OfflineResponse(context);
 const prepared=must(await prepareWebsiteCreativeDocument(context,{goal:context.goal,approvedIntent:fixture.approvedIntent,digestBytes:async value=>quietLightV2Digest(value)}));
 const projection=must(await projectWebsiteCreativeDocumentProviderRequest(prepared,context,{model,digestBytes:async value=>quietLightV2Digest(value)}));
 const input=stableJson(prepared.input),schema=stableJson(projection.wire.text.format.schema),wire=stableJson(projection.wire),output=stableJson(fixture.response);
 const sizeEvidence={kind:'UTF-8 byte measurements, never token counts',input:{bytes:bytes(input),sha256:quietLightV2Digest(input)},strictSchema:{bytes:bytes(schema),sha256:quietLightV2Digest(schema)},completeWire:{bytes:bytes(wire),sha256:quietLightV2Digest(wire)},validOfflineResponse:{bytes:bytes(output),sha256:quietLightV2Digest(output)},compatibleCompleteRequestTokens:null,providerOutputTokens:null,completeInputFit:'not-established',threePageOutputFit:'not-established',reason:'No compatible complete Responses request counter was executed. UTF-8 sizes exclude model-specific token boundaries/formatting and cannot establish input fit. A visible offline document also cannot establish a live response fits total output tokens, which include reasoning.'};
 return {version:QUIET_LIGHT_V2_PILOT_VERSION,context,fixture,prepared,projection,sizeEvidence,dispatchAllowed:false,providerCalls:0,paidInference:false,accountSaved:false,publication:false,labInstallationRequired:true,limits:{requests:1,inputTokens:4000,totalOutputTokens:4000,maximumGBP:.10,tools:0,retries:0,fallbacks:0},expectedPageIds:[...QUIET_LIGHT_V2_PILOT_PAGE_IDS]};
}

export function quietLightV2DeterministicReview(context){
 const direction=must(deterministicWebsiteCreativeSpecification(context.website,'Give my website a more premium creative direction'));
 return must(prepareWholeWebsiteCreativeReview(context,direction.specification,deps,{origin:'deterministic-recommendation',explanation:direction.explanation}));
}

export async function reviewQuietLightV2Offline(pilot){
 return must(await reviewWebsiteCreativeDocumentProposal(pilot.prepared,stableJson(pilot.fixture.response),pilot.context,deps,{origin:'deterministic-offline-fixture'}));
}

export async function keepQuietLightV2Locally(review,context){
 let current=context,dispatches=0;
 const receipt=await keepWholeWebsite(review,{getContext:()=>current,apply:operation=>{
  dispatches++;const edited=applyWebsitePageChange(current.website,operation);if(!edited.applied)throw Error(edited.reason);
  current={...current,website:edited.draft};return {applied:true,localPrivateReadback:{websiteDraft:clone(edited.draft)}};
 }});
 must(receipt);
 if(dispatches!==1||websiteRequestContent(current.website)!==websiteRequestContent(review.candidate))throw Error('Original private Keep/readback did not match.');
 return {context:current,receipt:{...receipt,dispatches,hosted:false,providerCalls:0}};
}

// Exercise the ORIGINAL scoped restoration primitive used by Studio history.
// This is local domain evidence, never a hosted account/SQL Undo receipt.
export function quietLightV2LocalHistoryEvidence(beforeContext,afterContext){
 const scope={ownerId:beforeContext.ownerId,businessId:beforeContext.businessId},before=beforeContext.website,after=afterContext.website;
 const previous=makeWebsiteRecoveryPoint(before,'2026-11-06T00:00:00.000Z',scope),next=makeWebsiteRecoveryPoint(after,'2026-11-06T00:00:00.000Z',scope);
 const undone=restoreWebsiteRecoveryPoint(after,previous,rebuildPrivateWebsiteDraft,scope);
 if(!undone.applied)throw Error(undone.reason);
 const redone=restoreWebsiteRecoveryPoint(undone.draft,next,rebuildPrivateWebsiteDraft,scope);
 if(!redone.applied)throw Error(redone.reason);
 for(const [original,restored] of [[before,undone.draft],[after,redone.draft]])for(const page of original.pages){if(renderWebsiteHtml(original,page.id,{standalone:true})!==renderWebsiteHtml(restored,page.id,{standalone:true}))throw Error('Original local history changed the exact reviewed rendering.');}
 if(undone.draft.generation<=after.generation||redone.draft.generation<=undone.draft.generation||undone.draft.publicStatus!==after.publicStatus||redone.draft.publicStatus!==after.publicStatus)throw Error('Original private history did not preserve monotonic revision/public status.');
 const foreign=restoreWebsiteRecoveryPoint(after,previous,rebuildPrivateWebsiteDraft,{...scope,ownerId:'foreign-offline-owner'});
 if(foreign.applied)throw Error('Original private history accepted a foreign owner.');
 return {undo:true,redo:true,exactPageRendering:true,monotonicRevisions:true,publicStatusPreserved:true,foreignOwnerDenied:true,scope:'Original local scoped restoration primitive, not hosted account persistence, SQL receipt or manual device evidence.',hosted:false};
}
