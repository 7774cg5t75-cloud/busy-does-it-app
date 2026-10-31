import {APP_SPEC_PROPOSAL_VERSION,createBuilderProposalContext,validateBuilderProposal,prepareGovernedBuilderReview} from './governedBuilderProposal.mjs';
import {inspectCapabilityIntent} from './universalBuilderPlanV3210.mjs';
import {getUniversalCapability} from './universalCapabilityCatalogV3210.mjs';
import {enabledAppKeys} from './appSectionOrder.mjs';
import {publicNavigationLabels} from './appNavigationLabels.mjs';
import {OPTIONS} from './appAppearanceEditing.mjs';
import {proposeCoordinatedAppChanges} from './appCoordinatedStudio.mjs';
import {bindPrivateAppProposal,privateAppEditSource} from './privateAppEditSession.mjs';
import {stableJson} from './stableJson.mjs';

const no=reason=>({ok:false,reason,mayExecute:false});
const same=(a,b)=>stableJson(a)===stableJson(b);
// The saved app profile belongs to this exact draft revision, not an inferred
// Business Brain revision. No external facts or credentials enter this anchor.
export function appCompositionContext({ownerId,businessId,app,catalog}={}){
 if(!Array.isArray(catalog)||catalog.length>50||new Set(catalog.map(r=>r?.module_key)).size!==catalog.length)return no('Recheck the current feature catalogue before preparing an app.');
 if(!privateAppEditSource({businessId,app})||!enabledAppKeys(app.draft_config).ok)return no('Open your current private app first.');
 return createBuilderProposalContext({ownerId,businessId,projectId:app.id,sourceRevision:app.draft_revision,profileRevision:app.draft_revision,surface:'app',project:app,profile:app.draft_config.publicProfile||{},catalog});
}

// Bounded existing capability recognition, NOT a live model or general semantic
// understanding. Unknown requests ask for clarification rather than inventing UI.
export function proposeLocalAppGoal(context,goal){
 if(!context?.ok||typeof goal!=='string'||!goal.trim()||goal.length>240||/[<>\u0000-\u001f\u007f]/.test(goal))return no('Briefly describe what people should be able to do in your app.');
 const intent=inspectCapabilityIntent(goal);
 if(!intent.valid||intent.conflicts.length)return no('You mentioned both including and avoiding a feature. Which should I keep?');
 if(!intent.requested.length)return no('What should people see or do first? For example, browse your services or ask about work.');
 const screens=[{id:'about',title:'About',module:'business_profile',next:[]}],unsupported=[];
 for(const key of intent.requested){
  const c=getUniversalCapability(key),module=c?.app?.kind==='module'?c.app.id:null;
  const available=module&&context.anchor.catalog.filter(r=>r.module_key===module&&r.status==='available').length===1;
  // Structured event/product records remain in their original editor; never
  // masquerade a business-profile destination as a new dynamic workflow.
  const descriptive=!available||c?.contentBlockKind||c?.publicContentField;
  if(descriptive){screens.push({id:key,title:c?.title||'Additional feature',module:null,next:[]});unsupported.push(c?.app?.reason||'Review '+(c?.title||key)+' through its original content or feature authority.');}
  else if(!screens.some(s=>s.module===module))screens.push({id:key,title:module==='services'&&/\bmenus?\b/i.test(goal)?'Menu':module==='services'?'Services':module==='contact'?'Contact':module==='gallery'?'Photos':c.title,module,next:[]});
 }
 if(screens.length>12||unsupported.length>10)return no('Let us focus this review on the main experience first.');
 screens.forEach((s,i)=>{s.next=screens[i+1]?[screens[i+1].id]:[];});
 const proposal={version:APP_SPEC_PROPOSAL_VERSION,scope:{...context.scope},kind:'app-requirements',explanation:'Review the supported private screens and the features that still need work.',objectives:[],app:{purpose:goal.trim(),users:['People described in your request; confirm their access before adding private data'],screens,entities:[{id:'saved_app_information',fields:['Existing approved public app information'],relatedTo:[]}],workflows:[goal.trim()],deviceCapabilities:[],privacy:['Only already approved public app information enters the preview; no customer records are supplied.'],visual:['Keep the current business branding unless you choose a supported design change.'],acceptance:['Explore supported destinations in the private preview; no live submission or publication is tested.'],unsupported}};
 return validateBuilderProposal(proposal,context);
}

export function reviewAppComposition(proposal,context,current){
 if(!context?.ok||context.scope?.surface!=='app')return no('Open a current private app before reviewing its screens.');
 const review=prepareGovernedBuilderReview(proposal,context,current);if(!review.ok)return review;
 const order=enabledAppKeys(context.anchor.project.draft_config);if(!order.ok)return order;
 const rows=review.requirements.screens.map(s=>({...s,status:s.module===null?'needs-development':order.keys.includes(s.module)?'private-configured':'needs-setup'}));
 const supported=rows.filter(r=>r.status==='private-configured'),future=rows.filter(r=>r.status!=='private-configured');
 const extra=review.requirements.deviceCapabilities.length||review.requirements.unsupported.length;
 return {...review,rows,path:future.length||extra?supported.length?'hybrid':'bespoke':'composition',supportedCount:supported.length,futureCount:future.length,sourceRevision:context.scope.sourceRevision,maySave:false,mayPublish:false};
}

// Closed translation to ORIGINAL Studio operations. No enabling, new entities,
// text/facts, generated code, destinations, provider actions or generic writer.
export function prepareAppComposition({proposal,context,current,selection}={}){
 const review=reviewAppComposition(proposal,context,current);if(!review.ok)return review;
 if(!selection||Object.keys(selection).some(k=>!['order','labels','appearance'].includes(k)))return no('Choose supported screen and design changes.');
 const config=context.anchor.project.draft_config,old=enabledAppKeys(config).keys;
 const allowed=[...new Set(review.rows.filter(r=>r.status==='private-configured').map(r=>r.module))];
 const order=selection.order,labels=selection.labels||{},appearance=selection.appearance||{};
 if(!Array.isArray(order)||!order.length||order.length!==allowed.length||new Set(order).size!==order.length||order.some(k=>!allowed.includes(k)))return no('Keep each supported screen once. Other saved sections are retained.');
 if(!labels||typeof labels!=='object'||Array.isArray(labels)||!appearance||typeof appearance!=='object'||Array.isArray(appearance)||Object.keys(labels).some(k=>!allowed.includes(k))||Object.keys(appearance).some(k=>!['serviceStyle','navigationStyle','layoutDensity'].includes(k)||!OPTIONS[k].includes(appearance[k])))return no('Use the supported screen labels and layout choices.');
 const operations=[],nextOrder=[...order,...old.filter(k=>!order.includes(k))];
 if(!same(nextOrder,old))operations.push({kind:'navigation',value:nextOrder});
 const existing=publicNavigationLabels(config,{withDefaults:true});
 for(const [moduleKey,value]of Object.entries(labels))if(value!==existing[moduleKey])operations.push({kind:'navigation_label',moduleKey,value});
 const defaults={serviceStyle:'cards',navigationStyle:'tabs',layoutDensity:'comfortable'};
 for(const [field,value]of Object.entries(appearance))if(value!==(config.presentation?.[field]||defaults[field]))operations.push({kind:'appearance',field,value});
 if(!operations.length)return no('These choices already match your saved app. Your existing information is kept.');
 const result=proposeCoordinatedAppChanges(config,operations);if(!result.ok)return result;
 const bound=bindPrivateAppProposal(result,{businessId:context.scope.businessId,app:context.anchor.project});
 return bound?{...bound,compositionReview:review,explanation:{status:'Ready for private review',summary:'Only the listed screen labels, order and layout change. Your saved wording and other sections are kept.',source:'Saved private app',revision:context.scope.sourceRevision,verified:'Validated against the current private configuration; not saved or tested live.',limitations:review.limitations},mayExecute:false}:no('Reopen the current private app before review.');
}

export function initialAppCompositionSelection(review,context){
 const labels=publicNavigationLabels(context.anchor.project.draft_config,{withDefaults:true});
 return {order:[...new Set(review.rows.filter(r=>r.status==='private-configured').map(r=>r.module))],labels:Object.fromEntries(review.rows.filter(r=>['business_profile','services','gallery','contact'].includes(r.module)&&r.status==='private-configured').map(r=>[r.module,labels[r.module]])),appearance:{}};
}
