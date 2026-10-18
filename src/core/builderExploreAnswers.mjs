import {appDesignQualityReport} from './appDesignQuality.mjs';
// Presentation of existing planner evidence, not another planner or AI service.
const readiness={present_in_private_draft:'Already included in your draft',supported_section_not_present:'Can be prepared for your review',available_module_needs_owner_setup:'Available, with setup still needed',runtime_module_not_verified_available:'Not confirmed for this app yet',requires_new_implementation:'Not supported yet',requires_service_verification:'Needs its service or connection checked'};
function explainBuilderExplore({kind,project,catalog,plan,text}){
 const design=/\b(colou?rs?|layout|homepage|design|improve|readab|typograph|different look)\b/i.test(text);
 if(design){
  const findings=kind==='app'?appDesignQualityReport(project.draft_config,catalog).checks.filter(row=>!row.passed&&!['real_device_review','screenshot_review','shared_runtime'].includes(row.id)).slice(0,2).map(row=>row.detail):[];
  const alternatives=kind==='website'?[
   {label:'Try a more readable phone layout',instruction:'make the whole page easier to read on phones'},
   {label:'Try more breathing room',instruction:'give the whole page more spacing on phones'}
  ]:[{label:'Try more breathing room',instruction:'make the app airy'}];
  return {answer:[kind==='website'?'We could give your phone layout more breathing room or make the text easier to read. These solve different problems; neither needs a new design.':'Start with clear information and easy-to-follow screens. More space can help customers scan the app; compact layouts can fit more information.',...findings,'Your colours and wording stay as they are unless you choose a supported change. These are suggestions from your draft, not a visual inspection.'].join('\n'),alternatives};
 }
 if(plan.ok){
  const requested=plan.capabilities.filter(row=>row.explicitlyRequested).slice(0,3);
  const answer=requested.map(row=>{const state=row[kind];return row.title+': '+(readiness[state.status]||'Needs checking')+'. '+row.description+(row.requiresExternalProvider?' A provider connection may be needed; its price and permissions must be checked separately.':'')+(row.customerRequestType==='booking_request'?' Customers can request a booking; this does not confirm an appointment.':'');});
  return {answer:[...answer,'Nothing has been changed. A feature shown in a draft is not proof that a customer has successfully used it.'].join('\n'),alternatives:[]};
 }
 return {answer:plan.reason,alternatives:[]};
}
export {explainBuilderExplore};
