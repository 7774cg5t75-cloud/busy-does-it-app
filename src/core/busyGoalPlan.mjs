import {applyWebsiteLayoutOperation} from '../../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs';
import {getUniversalCapability} from './universalCapabilityCatalogV3210.mjs';
import {websiteDraftHasScope} from './websiteDraftScope.mjs';
import {prepareWebsiteRequest} from './websiteRequestPlan.mjs';
// A bounded local interpreter, not unrestricted semantic understanding or a tool executor.
// Inputs are owner goals; imported customer/web content never grants this authority.
export function planBusyGoal({request,website,businessId,pageId='home',profile=null,source='owner'}={},deps={}){
 const unknown=question=>({recognised:false,question,nextAction:'Tell me a little more about the result you want.',providerCalls:0,mayExecute:false});
 if(source!=='owner'||typeof request!=='string'||!request.trim()||request.length>400||/[<>\u0000-\u001f\u007f]/.test(request))return unknown('What would you like to achieve?');
 const text=request.trim().replace(/[.!?]+$/,'').toLowerCase();
 if(/\b(ignore|bypass|override|publish|send|charge|pay|export|delete|password|token)\b/.test(text)||/\b(don't|do not|never|without approval)\b/.test(text))return unknown('Which private change would you like to review? Nothing has been sent or changed.');
 const base={recognised:true,ownerWording:request,providerCalls:0,mayExecute:false,assumptions:[],verifiedOutcome:false,requiresReview:true};
 let goal='';
 const intent=text.replace(/^(?:busy[, ]+)?(?:please )?(?:can you |could you )?/,'');
 if(/^(?:make|help me make) (?:my|the) (?:website|site) (?:easier to (?:use|read)|more usable|better) (?:on|for) (?:a |my )?(?:mobile|phone|phones)$/.test(intent)||/^my (?:website|site) is (?:difficult|hard) to (?:use|read) on (?:a |my )?(?:mobile|phone|phones)$/.test(intent))goal='mobile-readability';
 else if(/^(?:busy[, ]+)?(?:please )?(?:can you |could you )?(?:make|help me make) (?:my |the )?(website|site) (?:look |feel )?(?:more )?(professional|polished)$/.test(text))goal='professional-presentation';
 else if(/^(?:busy[, ]+)?(?:please )?(?:can you )?(?:help me )?(?:get|find|win) more customers$/.test(text))return {...base,goal:'customer-acquisition',capabilities:['services','enquiry'].map(getUniversalCapability),route:'growthCommandCentre',steps:['Review your current services and a suitable opportunity.','Prepare wording in Content Creator for you to approve.','Keep any customer response linked to its original enquiry.'],question:profile?.services?.length===1?null:'Which service would you like more enquiries for?',nextAction:'Review opportunities',limitations:['Nothing is advertised or sent. Opportunities and results need evidence.']};
 else if(/^(?:i(?:'ve| have) got|i have) (?:some )?spare days next week$/.test(text))return {...base,goal:'fill-spare-time',route:'growthCommandCentre',capabilities:[getUniversalCapability('availability')],question:'Which days and which kind of work would suit you?',nextAction:'Choose the work you want',steps:['Review your available days.','Prepare a suitable opportunity or private post.'],limitations:['Spare days are your report, not confirmed bookable availability. No bookings or outreach are created.']};
 else if(/^(?:can you |please )?(?:put|add) my latest offer (?:on|to) my website$/.test(text))return {...base,goal:'reuse-reviewed-content',route:'socialCreator',capabilities:[getUniversalCapability('offers')],question:'Which saved offer would you like to use?',nextAction:'Choose saved wording',steps:['Open the exact saved wording in Content Creator.','Review its details, then prepare the website wording update.'],limitations:['Latest is not assumed. Offer dates, prices, rights and publication need separate review.']};
 else if(/^help me turn (?:this|an) enquiry into (?:a )?job$/.test(text))return {...base,goal:'enquiry-to-work',route:'inbox',capabilities:[getUniversalCapability('enquiry')],question:'Which enquiry would you like to work on?',nextAction:'Choose the enquiry',steps:['Open its original enquiry and customer details.','Review the customer association.','Prepare Work and a private quote from that exact source.'],limitations:['A prepared quote is not sent, accepted, booked or paid.']};
 if(!goal)return unknown('What result matters most to you? I can help prepare a website change, content, an opportunity or work from an enquiry.');
 if(!websiteDraftHasScope(website,businessId))return {...base,goal,question:'Open your current website first.',nextAction:'Open your website',ready:false};
 const page=website.pages?.find(p=>p.id===pageId&&p.enabled!==false);if(!page)return {...base,goal,question:'Which page would you like to improve?',ready:false};
 let instruction,findings;
 if(goal==='mobile-readability'){
  const needsReading=applyWebsiteLayoutOperation(website,{action:'page-reading',pageId,device:'mobile'}).applied===true;
  const needsSpace=applyWebsiteLayoutOperation(website,{action:'page-spacing',pageId,device:'mobile',value:'generous'}).applied===true;
  instruction=[needsReading?'make the page easier to read on phones':'',needsSpace?'give the page more space on phones':''].filter(Boolean).join('; ');
  findings=['Compare larger body text and more breathing room on phones.','Keep desktop settings, your words, colours and pictures unchanged.'];
 }else{instruction='make the page more modern without changing the wording';findings=['Compare consistent typography, calmer navigation, outlined cards and comfortable spacing.','Keep your words, colours, pictures and section order. These shared settings can affect other pages.'];}
 if(!instruction)return {...base,goal,ready:false,question:null,nextAction:'Keep the current design or describe what still feels difficult.',findings,limitations:['These supported settings are already present. Source inspection cannot prove visual quality.']};
 const prepared=prepareWebsiteRequest(website,{draftId:website.id,pageId,generation:website.generation,instruction},deps);
 return {...base,goal,capabilities:[getUniversalCapability('identity')],ready:prepared.ok===true,question:null,nextAction:prepared.ok?'Preview this idea':prepared.reason,findings,instruction,prepared:prepared.ok?prepared:null,context:{businessId,websiteId:website.id,generation:website.generation,pageId},limitations:['This is a supported design suggestion, not a measured usability diagnosis. Review the actual preview before saving. Nothing is published.']};
}
