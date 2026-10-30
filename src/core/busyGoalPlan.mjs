import {classifyOwnerCorrection} from './ownerGoalCorrection.mjs';
import {classifyOwnerGoal} from './ownerGoalIntent.mjs';
import {applyWebsiteLayoutOperation} from '../../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs';
import {getUniversalCapability} from './universalCapabilityCatalogV3210.mjs';
import {websiteDraftHasScope} from './websiteDraftScope.mjs';
import {prepareWebsiteRequest} from './websiteRequestPlan.mjs';
// A bounded local interpreter, not unrestricted semantic understanding or a tool executor.
// Inputs are owner goals; imported customer/web content never grants this authority.
export function planBusyGoal({request,website,businessId,pageId='home',profile=null,source='owner',surface=null}={},deps={}){
 const unknown=question=>({recognised:false,question,nextAction:'Tell me a little more about the result you want.',providerCalls:0,mayExecute:false});
 if(source!=='owner'||typeof request!=='string'||!request.trim()||request.length>400||/[<>\u0000-\u001f\u007f]/.test(request))return unknown('What would you like to achieve?');
 const correction=source==='owner'?classifyOwnerCorrection(request):null;
 if(correction)return {recognised:true,ownerWording:request,goal:'owner-correction',contextKind:'correction',ready:false,mayExecute:false,requiresReview:true,providerCalls:0,verifiedOutcome:false,nextAction:correction.explanation,question:null,limitations:['Nothing is remembered permanently without the supported account review.']};
 const interpretation=classifyOwnerGoal({request,surface,source});
 if(!interpretation.recognised)return unknown(interpretation.reason);
 const base={recognised:true,ownerWording:request,providerCalls:0,mayExecute:false,assumptions:[],verifiedOutcome:false,requiresReview:true,interpretation};
 const oneService=Array.isArray(profile?.services)&&profile.services.length===1&&typeof profile.services[0]?.name==='string'?profile.services[0].name:null;
 const businessContext={...(oneService?{service:oneService}:{}),...(typeof profile?.serviceArea==='string'&&profile.serviceArea?{ownerReportedServiceArea:profile.serviceArea}:{})};
 const goal=interpretation.intents[0];
 if(goal==='customer-acquisition')return {...base,goal,businessContext,capabilities:['services','enquiry'].map(getUniversalCapability),route:'growthCommandCentre',steps:['Review your current services and a suitable opportunity.','Prepare wording in Content Creator for you to approve.','Keep any customer response linked to its original enquiry.'],question:oneService?null:'Which service would you like more enquiries for?',nextAction:'Review opportunities',limitations:['Nothing is advertised or sent. Opportunities and results need evidence.']};
 if(goal==='fill-spare-time')return {...base,goal,businessContext,route:'growthCommandCentre',capabilities:[getUniversalCapability('availability')],question:oneService?'Which days would suit you?':'Which days and which kind of work would suit you?',nextAction:'Choose the work you want',steps:['Review your available days.','Prepare a suitable opportunity or private post.'],limitations:['Your reported need for work is not confirmed bookable availability. No bookings or outreach are created.']};
 if(goal==='reuse-reviewed-content')return {...base,goal,route:'socialCreator',contextKind:'saved-content',capabilities:[getUniversalCapability('offers')],question:'Which saved wording contains the offer you want to use?',nextAction:'Choose saved wording',steps:['Inspect exact account wording.','Review its details, then prepare the private website update.'],limitations:['A saved draft does not establish offer validity, prices or dates. Nothing is published.']};
 if(goal==='enquiry-to-work')return {...base,goal,route:'busyInbox',contextKind:'enquiries',capabilities:[getUniversalCapability('enquiry')],question:'Which enquiry would you like to work on?',nextAction:'Choose the enquiry',steps:['Open its original enquiry and customer details.','Review customer association before preparing Work or a private quote.'],limitations:['Nothing is sent, accepted, booked or paid.']};
 if(!websiteDraftHasScope(website,businessId))return {...base,goal,question:'Open your current website first.',nextAction:'Open your website',ready:false};
 const page=website.pages?.find(p=>p.id===pageId&&p.enabled!==false);if(!page)return {...base,goal,question:'Which page would you like to improve?',ready:false};
 const instructions=[],findings=[];
 if(interpretation.intents.includes('professional-presentation')){instructions.push('make the page more modern without changing the wording');findings.push('Compare consistent typography, calmer navigation, outlined cards and comfortable spacing.','Keep your words, colours, pictures and section order. Shared settings can affect other pages.');}
 if(interpretation.intents.includes('mobile-readability')){
  const needsReading=applyWebsiteLayoutOperation(website,{action:'page-reading',pageId,device:'mobile'}).applied===true;
  const needsSpace=applyWebsiteLayoutOperation(website,{action:'page-spacing',pageId,device:'mobile',value:'generous'}).applied===true;
  if(needsReading)instructions.push('make the page easier to read on phones');if(needsSpace)instructions.push('give the page more space on phones');
  findings.push('Compare larger body text and more breathing room on phones.','Phone-only changes preserve desktop settings. Words, colours and pictures stay unchanged.');
 }
 const instruction=instructions.join('; ');
 if(!instruction)return {...base,goal,ready:false,question:null,nextAction:'Keep the current design or describe what still feels difficult.',findings,limitations:['These supported settings are already present. Source inspection cannot prove visual quality.']};
 const prepared=prepareWebsiteRequest(website,{draftId:website.id,pageId,generation:website.generation,instruction},deps);
 return {...base,goal,capabilities:[getUniversalCapability('identity')],ready:prepared.ok===true,question:null,nextAction:prepared.ok?'Preview this idea':prepared.reason,findings,instruction,prepared:prepared.ok?prepared:null,context:{businessId,websiteId:website.id,generation:website.generation,pageId},limitations:['This is a supported design suggestion, not a measured usability diagnosis. Review the actual preview before saving. Nothing is published.']};
}
