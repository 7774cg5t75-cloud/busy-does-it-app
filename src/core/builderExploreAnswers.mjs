import {planUniversalBuilderRequest} from './universalBuilderPlanV3210.mjs';
import {LABELS} from './nativePalette.mjs';
import {appDesignQualityReport} from './appDesignQuality.mjs';
// Presentation of existing planner evidence, not another planner or AI service.
const readiness={present_in_private_draft:'Already included in your draft',supported_section_not_present:'Can be prepared for your review',available_module_needs_owner_setup:'Available, with setup still needed',runtime_module_not_verified_available:'Not confirmed for this app yet',requires_new_implementation:'Not supported yet',requires_service_verification:'Needs its service or connection checked'};
function explainBuilderExplore({kind,project,catalog,plan,text}){
 if(/\b(?:just for (?:me|myself)|personal (?:app|project|website|portfolio)|club (?:app|website|project)|(?:my|our|a) club|community project)\b/i.test(text)){
  const purpose=/club|community/i.test(text)?'club':'personal';
  const neutral=planUniversalBuilderRequest({request:text,projectPurpose:purpose});
  return {answer:[neutral.summary,'A simple information site can start with your own title, pages, pictures and chosen style. A personal project should not need invented services, customers or a trading name.',
   'Private trackers, member accounts, shared records and community tools need real ownership, permissions and storage support; they are not working just because a preview looks convincing.',
   'Your current business project stays unchanged. Personal and club creation is a future expansion, not an available workspace or permission to convert this project.'].join('\n'),alternatives:[],discussionOnly:true};
 }
 const profile=kind==='app'?project.draft_config?.publicProfile||{}:project;
 const services=kind==='app'?(profile.services||[]):project.sections?.find(s=>s.type==='services'&&s.enabled!==false)?.items||[];
 if(/\b(colou?rs?|palette|dark background|light background)\b/i.test(text)){
  const palette=kind==='app'?LABELS[project.draft_config?.presentation?.brandPalette||'midnight']:null;
  const primary=kind==='website'&&/^#[a-f0-9]{6}$/i.test(project.theme?.primary||'')?project.theme.primary:null;
  return {answer:[palette?'Your app currently uses '+palette+'.':primary?'Your website’s current primary colour is '+primary+'.':'Your current branding is kept in this draft.',
   'A darker palette can emphasise photography; a lighter palette may suit longer descriptions. Neither is automatically better for your business.',
   'Readable text and buttons need sufficient contrast on their actual backgrounds. Photos and overlays need a real preview check.',
   'Use the existing colour preview in the editor to compare a change when you are ready. Your branding stays unchanged here.'].join('\n'),alternatives:[]};
 }
 if(kind==='website'&&/\b(?:add|own|benefit|worth|need|build|create)\b.*\bapp\b|\bapp\b.*\b(?:customers|benefit|worth)\b/i.test(text)){
  const sections=(project.sections||[]).filter(s=>s.enabled!==false);
  return {answer:['Your website draft has '+sections.length+' visible sections'+(services.length?' and '+services.length+' service descriptions':'')+'.',
   'A matching app could help returning customers find services and send enquiries. A website may be enough if customers mainly need information once.',
   'Start with one useful customer task, using your approved branding and information. Booking requests need business confirmation; payments and live availability need separately verified support.',
   'This is a recommendation, not an app build or a subscription entitlement check. Nothing has been changed.'].join('\n'),alternatives:[]};
 }
 if(kind==='website'&&/\b(?:picture|photo|image)\b.*\b(?:other side|beside|left|right)\b/i.test(text)){
  const hero=project.sections?.find(s=>s.type==='hero'&&s.enabled!==false),asset=hero?.asset;
  if(!asset||asset.approved!==true)return {answer:'Your current introduction has no approved main picture to rearrange. Choose and approve the right image in the original editor first. Nothing will be changed.',alternatives:[]};
  return {answer:'We can compare the approved main picture to the left or right of your introduction. These are different desktop arrangements; phones keep one reading column with the text before the picture. Your words, colours and picture stay the same. This is a source-based proposal, not a screenshot assessment. Nothing will be changed.',alternatives:[{label:'Compare picture on the left',instruction:'move the hero photo left'},{label:'Compare picture on the right',instruction:'move the hero photo right'}]};
 }
 const design=/\b(colou?rs?|layout|homepage|design|improve|readab|typograph|different look)\b/i.test(text);
 if(design){
  const findings=kind==='app'?appDesignQualityReport(project.draft_config,catalog).checks.filter(row=>!row.passed&&!['real_device_review','screenshot_review','shared_runtime'].includes(row.id)).slice(0,2).map(row=>row.detail):[];
  const alternatives=kind==='website'?[
   {label:'Try a more readable phone layout',instruction:'make the whole page easier to read on phones'},
   {label:'Try more breathing room',instruction:'give the whole page more spacing on phones'}
  ]:[{label:'Try more breathing room',instruction:'make the app airy'}];
  return {answer:[kind==='website'?'We could give your phone layout more breathing room or make the text easier to read. These solve different problems; neither needs a new design.':'Start with clear information and easy-to-follow screens. More space can help customers scan the app; compact layouts can fit more information.',...(services.length?['Your draft includes '+services.length+' service descriptions. Keep a clear route from those details to a supported enquiry.']:[]),...findings,'Your colours and wording stay as they are unless you choose a supported change. These are suggestions from your draft, not a visual inspection.'].join('\n'),alternatives};
 }
 if(plan.ok){
  const requested=plan.capabilities.filter(row=>row.explicitlyRequested).slice(0,3);
  const answer=requested.map(row=>{const state=row[kind];return row.title+': '+(readiness[state.status]||'Needs checking')+'. '+row.description+(row.requiresExternalProvider?' A provider connection may be needed; its price and permissions must be checked separately.':'')+(row.customerRequestType==='booking_request'?' Customers can request a booking; this does not confirm an appointment.':'');});
  return {answer:[...answer,'Nothing has been changed. A feature shown in a draft is not proof that a customer has successfully used it.'].join('\n'),alternatives:[]};
 }
 return {answer:plan.reason,alternatives:[]};
}
export {explainBuilderExplore};
