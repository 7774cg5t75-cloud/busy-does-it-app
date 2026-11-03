import {premiumWebsiteDirections} from './premiumWebsiteDirections.mjs';
import {deriveSector} from '../../supabase/functions/busy-website-worker/designPlanner.mjs';
import {websiteDraftHasScope} from './websiteDraftScope.mjs';
import {prepareWebsiteRequest} from './websiteRequestPlan.mjs';
// Owner-goal recogniser for finite existing builder operations, not a model.
export function premiumWebsiteGoal({request,website,businessId,pageId='home',source='owner'}={},deps={}){
 if(source!=='owner'||typeof request!=='string'||request.length>400||/[<>\u0000-\u001f]/.test(request))return null;
 const words=request.trim().replace(/[.!?]+$/,'');let instruction='',explanation='';

 const whole=/^(?:make (?:the )?(?:whole |entire )?website (?:look |feel )?(?:more professional|less generic)|keep the headline but change the layout|make the services stand out|make the homepage more welcoming)$/i.test(words);
 const design=/^(?:i need|i want) a professional website(?: for (?:my |our )?(.+))?$|^give (?:the |my )?(?:homepage|website) a more premium appearance$/i.exec(words);
 if(whole){instruction='refine the complete website design';explanation='Prepare coordinated service, story and contact layouts while keeping your words and approved sources.';}
 else if(design){
  if(/\b(publish|send|pay|purchase|buy|invoice|charge|execute|javascript|sql|script)\b/i.test(words)||/\b(?:and|then|also|plus)\s+(?:book|order|email|message|notify|take payments|accept payments|sell)\b/i.test(words))return {recognised:true,ready:false,question:'That request includes an unavailable action. Choose a private website design change first; nothing is sent, booked, published or paid.',providerCalls:0,mayExecute:false};
  const vocabulary=new Set([...(String(website?.businessType||'').toLowerCase().match(/[a-z]+/g)||[]),'business','company','studio','practice','shop','independent','small','local','my','our','and','the']);
  if(design[1]&&(design[1].toLowerCase().match(/[a-z]+/g)||[]).some(word=>!vocabulary.has(word)))return {recognised:true,ready:false,question:'Please clarify the extra requirements or review your current business information first. I have not prepared a partial change.',providerCalls:0,mayExecute:false};
  const sector=deriveSector(website?.businessType||'');
  if(design[1]&&deriveSector(design[1])!==sector)return {recognised:true,ready:false,question:'Your saved business information describes a different kind of business. Review that information first; I have not changed it.',providerCalls:0,mayExecute:false};
  const next=premiumWebsiteDirections(website)[0],id=next?.id||'typography-first',kind=({'story-spread':'food story','quiet-portrait':'calm portrait'}[id]||id);
  instruction='prepare a '+kind+' homepage; refine the complete website design';explanation='Compare a '+kind+' opening using your current wording, services and approved photographs. Colours and customer destinations stay unchanged.';
 }else if(/^(?:try a completely different design|give (?:the |my )?homepage more personality|make it more premium)$/i.test(words)){
  const next=premiumWebsiteDirections(website)[0];if(!next)return {recognised:true,ready:false,mayExecute:false,question:'No suitable different direction is available with the current approved content. Your design is unchanged.',providerCalls:0};
  instruction='prepare a '+next.id+' homepage';explanation=next.reason;
 }else if(/^(?:make (?:my|our|the) services easier for customers to understand|make (?:my|our|the) services clearer)$/i.test(words)){instruction='show services as a directory';explanation='Give the existing services a clearer directory layout without rewriting their scope.';}
 else if(/^put (?:my|our|the) best photographs near the top$/i.test(words))return {recognised:true,ready:false,question:'Which approved photograph is your best? Choose its exact image in the existing photo controls; I will not guess.',providerCalls:0,mayExecute:false};
 else if(/^make it easier for customers to (?:request a quote|contact us)$/i.test(words)){instruction='make the main button stand out';explanation='Emphasise the existing verified contact destination. This does not create a quote or send an enquiry.';}
 else if(/^make the mobile version look less crowded$/i.test(words)){instruction='give the page more space on phones';explanation='Compare more breathing room on phones without changing desktop spacing or your wording.';}
 else return null;
 const base={recognised:true,goal:'premium-website-presentation',ownerWording:request,providerCalls:0,mayExecute:false,requiresReview:true,verifiedOutcome:false,findings:[explanation],limitations:['Private design proposal only. Review actual mobile and desktop rendering before customer use. Nothing is saved or published.']};
 if(!websiteDraftHasScope(website,businessId)||!website.pages?.some(p=>p.id===pageId&&p.enabled!==false))return {...base,ready:false,question:'Open the current page of your own business website first.'};
 const prepared=prepareWebsiteRequest(website,{draftId:website.id,pageId,generation:website.generation,instruction},deps);
 return {...base,instruction,ready:prepared.ok,prepared:prepared.ok?prepared:null,question:prepared.ok?null:prepared.reason,nextAction:'Compare this private design'};
}
