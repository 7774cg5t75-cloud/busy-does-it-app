/**
 * V3.66 - conservative, pure growth-project conversation router.
 * The voice service supplies transcription; this module only interprets text.
 * No publisher permissions, remote calls or business changes live here.
 */
import { keyOf } from "./growthProjectWorkspace.mjs";
import { resolveGrowthCommand } from "./growthCommandCentre.mjs";

const norm = value => String(value || "").trim().toLocaleLowerCase("en-GB").replace(/\s+/g," ");
const bounded = value => String(value || "").trim().slice(0,320);
const PROJECT = /\b(growth|project|launch|business builder|business creation|new service|service rollout)\b/i;
const FOLLOWUP = /\b(that project|this project|it again|the (website|app|social) (draft|wording|copy)|show me (the |its )?(website|app|social) (draft|wording|copy))\b/i;
const INTENT = /\b(where are we|what(?:'s| is) left|what(?:'s| is) next|what needs|status|progress|update|continue|resume|carry on|pick up|open|show|review|approv|finish|ready|done|completed|prepared)\b/i;
const FORBIDDEN = /\b(publish|post now|go live|launch now|launch (my|the) .* now|send out|delete|remove|release live|schedule now|make live)\b/i;
const CHANNELS = [
  {id:"website",regex:/\b(website|web page|webpage|site copy|site wording)\b/i},
  {id:"business_app",regex:/\b(customer app|business app|mini app|mobile app)\b/i},
  {id:"social",regex:/\b(social|facebook|instagram|marketing post)\b/i},
];
function classifyGrowthUtterance(text,{activeContext=false,projectNames=[]}={}){
  const request=bounded(text);
  if(!request)return {growth:false,reason:"empty"};
  const explicit=PROJECT.test(request);
  const names=projectNames.some(name=>keyOf(name).length>2 && norm(request).includes(keyOf(name)));
  const followup=activeContext && (FOLLOWUP.test(request)||/^(show (me )?(the )?wording|open it|continue|what(?:'s| is) left|what(?:'s| is) next|where are we|is it ready|what about the (website|app|social))\??$/i.test(request) ||
    /\b(publish|post|go live|launch|delete|remove|schedule)\b.{0,30}\b(that|it|this|project|website|app|post)\b/i.test(request) ||
    /\b(which drafts|which tasks|what needs|what requires)\b.{0,25}\b(review|approval|approved)\b/i.test(request));
  const growth=!!(explicit||names||followup);
  if(!growth)return {growth:false,reason:"not_project_related"};
  // Deliberately never interpret broad requests like "run my business"
  // as growth-project navigation without project context.
  const forbidden=FORBIDDEN.test(request);
  if(!forbidden&&!INTENT.test(request) && !followup)return {growth:false,reason:"unrelated_project_mention"};
  const channel=CHANNELS.find(x=>x.regex.test(request))?.id||"";
  return {growth:true,forbidden,channel,explicit,named:names,followup,request};
}
function resolveGrowthOperator(text,centre,{focus=null,scope=""}={}){
  const projects=Array.isArray(centre?.projects)?centre.projects:[];
  const validFocus=focus && focus.scope===scope &&
    projects.some(p=>keyOf(p.serviceName)===keyOf(focus.serviceName))
      ? projects.find(p=>keyOf(p.serviceName)===keyOf(focus.serviceName)):null;
  const classification=classifyGrowthUtterance(text,{
    activeContext:!!validFocus,projectNames:projects.map(p=>p.serviceName),
  });
  if(!classification.growth)return {handled:false};
  if(centre?.state!=="ready")
    return {handled:true,kind:"unavailable",message:centre?.notice||"Could not load private growth projects.",serviceName:"",action:false};
  if(classification.forbidden)
    return {handled:true,kind:"blocked",message:"I can prepare or show private drafts, but I cannot publish, schedule, delete or launch them from this conversation. Final public actions need a separate owner approval.",serviceName:"",action:false};
  const normalized=norm(classification.request);
  const mentioned=projects.filter(p=>normalized.includes(keyOf(p.serviceName)));
  if(mentioned.length>1)return {handled:true,kind:"ambiguous",message:"You mentioned multiple saved services. Tell me which single project to open.",serviceName:"",action:false};
  const chosen=mentioned[0]||validFocus;
  const general= /\b(all|my|our|the) (growth )?projects\b/i.test(classification.request) ||
    /\b(which|how many) (projects|drafts)\b/i.test(classification.request);
  if(!chosen && !general && projects.length>1)
    return {handled:true,kind:"clarify",message:"Which saved growth project do you mean? Say the confirmed service name.",serviceName:"",action:false};
  const project=chosen||projects[0];
  if(!project)return {handled:true,kind:"empty",message:"I cannot find any saved growth projects for this business. You can create one in Build my business with BUSY.",serviceName:"",action:false};
  const channel=classification.channel;
  const item=project.tasks.find(t=>t.target===channel);
  const channelText=item ? item.label + ": " + item.description : "";
  if(classification.followup && !mentioned.length && !validFocus)
    return {handled:true,kind:"clarify",message:"Which growth project do you want to continue?",serviceName:"",action:false};
  const resume=/\b(continue|resume|carry on|pick up|open|finish)\b/i.test(classification.request);
  const showWording=/\b(show|read|see|look at|check)\b/i.test(classification.request) &&
    /\b(wording|copy|draft)\b/i.test(classification.request);
  if(resume || showWording){
    return {handled:true,kind:"open_project",serviceName:project.serviceName,channel,
      action:true,actionLabel:channel?"Open private "+item.label+" draft":"Open "+project.serviceName+" project",
      message:"I can take you to the private "+project.serviceName+" workspace. "+
        (channelText?channelText+" ":"")+"You'll review and explicitly load any saved cloud wording there. Nothing is published."};
  }
  const read=resolveGrowthCommand("Where are we with "+project.serviceName+"?",centre);
  let message=(read?.kind==="summary"?read.message:
    project.serviceName+": "+project.progress.reviewed+" of 3 private drafts reviewed. Public publishing has not been verified.");
  if(channelText)message=project.serviceName+" — "+channelText+" "+message;
  if(project.stale)message=project.serviceName+" needs re-review because approved business facts changed. "+message;
  return {handled:true,kind:"summary",serviceName:project.serviceName,channel,action:false,message};
}
export {classifyGrowthUtterance,resolveGrowthOperator};

// Navigation-only local intents within the original Operator bridge.
function localCoreAreaRequest(text){
 const request=String(text||'').trim();if(!request||request.length>400)return null;
 if(/\b(publish|send|spend|buy|charge|pay now|schedule)\b/i.test(request))return null;
 if(/^(?:busy[, ]+)?(?:please )?(?:(?:show|open|continue|resume)(?: me)? (?:the |my )?(?:enquiry (?:I was|we were) working on|original enquiry)|take me back to (?:the |my )?original enquiry)[.!?]?$/i.test(request))return {route:'busyInbox',resumeEnquiry:true,response:'Review the current enquiry or choose its exact record. Nothing is filed or sent by navigation.'};
 const followUp=/^(?:busy[, ]+)?(?:please )?(?:(?:help me |prepare (?:a )?(?:polite )?)?follow up (?:on|with)|review (?:the |my |this )?quote follow-up(?: for)?)(?: (?:that|this|the|my))?(?: quote)?(?: for)?(?: (.+?))?[.!?]?$/i.exec(request);
 if(followUp)return {route:'workHub',reviewQuoteFollowUp:true,quoteCustomerName:followUp[1]||'',response:'Choose the exact recorded quote in Work to review before preparing a private follow-up. No message has been sent; recorded quote status is not delivery evidence.'};
 const quote=/^(?:busy[, ]+)?(?:please )?(?:continue|resume|open|review)(?: (?:my|the|our|this|private|prepared|saved))* quote(?: for (.+?))?[.!?]?$/i.exec(request);
 if(quote)return {route:'workHub',continueQuote:true,quoteCustomerName:quote[1]||'',response:'Choose the exact existing customer and prepared quote in Work. No quote has been created, sent or approved.'};
 if(/^(?:how|why|should|what (?:can|should))\b/i.test(request)&&/\b(advertise|promote|marketing|attract customers)\b/i.test(request))return {route:'growthCommandCentre',response:'Review source-backed marketing ideas. Advice has not created a post, launched a campaign or spent money.'};
 if(/\b(show|review|open)\b/i.test(request)&&/\b(saved|private|content) drafts?\b/i.test(request))return {route:'socialMedia',response:'Open Content Creator to review existing private drafts. Opening the list does not save, publish or replace your current wording.'};
 if(/\b(help|how|want|get|attract|find)\b/i.test(request)&&/\b(more customers|local enquiries|customers find us|website discoverability)\b/i.test(request))return {route:'growthCommandCentre',response:'Review source-backed, £0-first ideas in Get More Customers. No campaign, publication, partner contact or spend has started.'};
 if(/\b(show|review|open)\b/i.test(request)&&/\b(enquiries|inbox|customer messages)\b/i.test(request))return {route:'busyInbox',response:'Open the existing Busy Inbox to review current enquiries. Nothing has been replied to or marked complete.'};
 if(/\b(help|create|prepare|make)\b/i.test(request)&&/\bquote\b/i.test(request))return {route:'workHub',response:'Open Work and choose an existing customer for private quote preparation. Opening Work does not prepare, send or approve a quote.'};
 if(/\b(help|create|prepare|make)\b/i.test(request)&&/\b(invoice|payment request)\b/i.test(request))return {route:'workHub',response:'Get Paid currently supports private quote assistance in Work. This request has not created an invoice or collected payment; review a saved customer and the supported next steps.'};
 return null;
}
export {localCoreAreaRequest};
