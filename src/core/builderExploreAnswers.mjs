import {ownerDesignPreference} from './websiteMeasuredDesignCoach.mjs';
import {websiteCompositionFacts} from './websiteCoordinatedAlternatives.mjs';
import {planUniversalBuilderRequest} from './universalBuilderPlanV3210.mjs';
import {LABELS,nativePalette,contrast} from './nativePalette.mjs';
import {appDesignQualityReport} from './appDesignQuality.mjs';
// Presentation of existing planner evidence, not another planner or AI service.
const readiness={present_in_private_draft:'Already included in your draft',supported_section_not_present:'Can be prepared for your review',available_module_needs_owner_setup:'Available, with setup still needed',runtime_module_not_verified_available:'Not confirmed for this app yet',requires_new_implementation:'Not supported yet',requires_service_verification:'Needs its service or connection checked'};
function explainBuilderExplore({kind,project,catalog,plan,text}){
 if(/\b(?:just for (?:me|myself)|personal (?:app|project|website|portfolio)|hobby (?:app|project|website)|club (?:app|website|project)|(?:my|our|a|local|community) club|community project)\b/i.test(text)){
  const purpose=/club|community/i.test(text)?'club':'personal';
  const neutral=planUniversalBuilderRequest({request:text,projectPurpose:purpose});
  return {answer:[neutral.summary,'A simple information site can start with your own title, pages, pictures and chosen style. A personal project should not need invented services, customers or a trading name.',
   'Private trackers, member accounts, shared records and community tools need real ownership, permissions and storage support; they are not working just because a preview looks convincing.',
   'Your current business project stays unchanged. Personal and club creation is a future expansion, not an available workspace or permission to convert this project.'].join('\n'),alternatives:[],discussionOnly:true};
 }
 const profile=kind==='app'?project.draft_config?.publicProfile||{}:project;
 const services=kind==='app'?(profile.services||[]):project.sections?.find(s=>s.type==='services'&&s.enabled!==false)?.items||[];
 if(kind==='website'&&(project.sections||[]).some(s=>s.type==='photo-feature'&&s.enabled!==false&&s.asset?.approved===true&&project.pages?.find(p=>p.id==='home')?.sectionIds?.includes(s.id))&&/\b(?:would|could|which side|other side)\b/i.test(text)&&/\b(?:picture|photo|image)\b/i.test(text)&&/\b(?:left|right|other side)\b/i.test(text)){
  const page=project.pages?.find(p=>p.id==='home'),sections=(project.sections||[]).filter(s=>s.enabled!==false&&s.type==='photo-feature'&&page?.sectionIds?.includes(s.id)&&s.asset?.approved===true&&s.asset?.storagePath);
  const section=sections.length===1?sections[0]:null,side=section?.appearance?.desktopPhotoSide||section?.appearance?.photoSide||'left',requested=/\bright\b/i.test(text)?'right':/\bleft\b/i.test(text)?'left':side==='left'?'right':'left';
  const declined=ownerDesignPreference(project,'selected-picture-'+requested,'home')==='disliked';
  return {answer:[section?'Your '+(section.title||section.id)+' section currently places its approved picture on the '+side+' on larger screens.':'Home has '+sections.length+' supported approved picture-and-text sections. Select the exact section in the editor rather than guessing which picture you mean.',
   'Left gives the photograph the first visual column; right gives the explanation that column. The supported desktop-only comparison keeps phone reading order, the existing picture, words and colours.',
   declined?'You previously declined that picture direction; it is not offered again here.':section?.appearance?.desktopPhotoSide?'Your explicit desktop picture choice is kept. Use the selected section controls for a deliberate replacement.':'This is a responsive layout explanation, not a screenshot inspection or proof that one side looks better.',
   'Nothing will be changed. Any prepared comparison still needs Make changes and separate editor approval.'].join('\n'),alternatives:section&&side!==requested&&!declined&&!section.appearance?.desktopPhotoSide?[{label:'Explore picture on the '+requested,instruction:'put the '+section.id+' picture on the '+requested+' on desktop'}]:[],discussionOnly:true};
 }
 if(kind==='website'&&/\b(?:would|could|compare)\b/i.test(text)&&/\b(?:reading column|long information|editorial information)\b/i.test(text)){
  const page=project.pages?.find(p=>p.id==='home'),sections=(project.sections||[]).filter(s=>s.enabled!==false&&['about','text'].includes(s.type)&&page?.sectionIds?.includes(s.id)&&String(s.body||'').length>=700),section=sections.length===1?sections[0]:null;
  const declined=ownerDesignPreference(project,'selected-reading-column','home')==='disliked';
  return {answer:['Home has '+sections.length+' longer information sections. A bounded reading column limits paragraph line length; an editorial arrangement places the heading beside the explanation on larger screens.',
   'Both preserve your words and source reading order. More space may mean more scrolling; these are implemented layout rules, not measured visual improvement.',
   declined?'You previously declined the reading-column direction.':section?.appearance?.readingLayout?'Your customised reading layout is kept.':'Use the exact section comparison before choosing whether to keep a change.',
   'Nothing will be changed.'].join('\n'),alternatives:section&&!declined&&!section.appearance?.readingLayout?[{label:'Explore a focused reading column',instruction:'show the '+section.id+' text as a reading column'}]:[],discussionOnly:true};
 }
 if(kind==='website'&&/\b(?:service directory|service cards|long(?:er)? (?:service )?descriptions|two[- ]column services|services easier to read)\b/i.test(text)){
  const page=project.pages?.find(p=>p.id==='home'),section=(project.sections||[]).find(s=>s.type==='services'&&s.id==='services'&&s.enabled!==false&&page?.sectionIds?.includes(s.id));
  const items=section?.items||[],long=items.filter(row=>String(row.body||'').length>=180).length,custom=section?.appearance?.serviceLayout;
  const declined=ownerDesignPreference(project,'coordinated-service-directory','home')==='disliked'||ownerDesignPreference(project,'selected-service-directory','home')==='disliked';
  const alternatives=[];
  if(section&&!custom){
   if(!declined)alternatives.push({label:'Explore a service directory',instruction:'show the services as a directory'});
   if(ownerDesignPreference(project,'selected-service-cards','home')!=='disliked')alternatives.push({label:'Explore two-column service cards',instruction:'show the services as cards'});
  }
  return {answer:['Your current Home page has '+items.length+' service descriptions; '+long+' contain longer information.',
   section?'A service directory pairs names with descriptions on larger screens. Cards separate services into two columns. Both use one column on phones and preserve the original service order, wording and colours.':'There is no visible services section on Home to compare. Add accurate service information through the original editor first.',
   custom?'Your chosen services layout is kept. Select the section in the editor if you want to review an explicit replacement.':declined?'You previously declined the directory direction, so it is not offered again here.':'A directory prioritises longer reading; cards give services separate visual groups. Neither is proven better for your visitors.',
   'These are implemented responsive rules, not screenshot inspection. Choosing an alternative only prepares discussion; Make changes and the separate editor approval remain necessary. Nothing will be changed.'].join('\n'),alternatives,discussionOnly:true};
 }
 if(kind==='website'&&/\b(?:editorial|picture[- ]and[- ]text|text first|text before (?:the )?picture|picture after (?:the )?text)\b/i.test(text)){
  const page=project.pages?.find(row=>row.id==='home'),features=(project.sections||[]).filter(row=>row.enabled!==false&&row.type==='photo-feature'&&page?.sectionIds?.includes(row.id)&&row.asset?.approved===true);
  const right=features.filter(row=>row.appearance?.photoSide==='right').length,declined=ownerDesignPreference(project,'coordinated-editorial-feature','home')==='disliked',facts=websiteCompositionFacts(project,'home');
  return {answer:['Your current Home page has '+features.length+' approved picture-and-text sections. '+right+' already place their photograph after the explanation in the source reading order.',
   declined?'You previously declined the editorial direction. Keep that choice; it is not being proposed again here.':facts.editorialFeatureId?'The existing design comparison can prepare a text-first alternative for a longer picture-and-text section without a custom picture side or spacing override.':'No uncustomised longer picture-and-text section is ready for that candidate. Keep current choices or review an explicit selected-section change.',
   'A right-hand photograph stays beside the explanation on desktop and follows the text in the single-column phone layout. Text-first gives the explanation priority; picture-first gives the photograph priority. Both keep the original words and approved asset.',
   'This describes implemented source order and responsive rules, not screenshot quality or customer-outcome evidence. Nothing will be changed.'].join('\n'),alternatives:[]};
 }
 if(kind==='app'&&/\b(?:connection fails?|interrupted request|unknown outcome|unconfirmed request|request recovery)\b/i.test(text)){
  const modules=project.draft_config?.modules||[],requests=modules.filter(row=>row.enabled===true&&['enquiry','booking_request'].includes(row.key)).length;
  return {answer:[requests?'Your draft includes '+requests+' customer request screens. Their presence is not proof that live submission permissions are ready.':'Your draft does not currently include an enabled enquiry or booking-request screen. Its setup must be reviewed before promising this journey.',
   'For a supported live request, customers review the exact details and explicitly confirm. An unconfirmed outcome must keep its original reference; do not blindly send a new request. Use the saved-reference check when the runtime offers it, or check with the business before retrying.',
   'Saved request receipts are evidence only for their own request. Removing a listing or changing wording cannot turn an earlier receipt into proof that a new request was saved. A request is not a confirmed appointment, purchase or payment.',
   'This discussion cannot read private customer requests, check delivery or contact the business. Nothing will be changed.'].join('\n'),alternatives:[]};
 }
 if(kind==='app'&&/\bcontrast\b|\breadable colou?rs\b/i.test(text)){
  const palette=project.draft_config?.presentation?.brandPalette||'midnight',accent=project.draft_config?.presentation?.brandAccent;
  if(Object.hasOwn(LABELS,palette)){const colors=nativePalette(palette,accent);return {answer:['Text on the standard card background: '+contrast(colors.text,colors.surface).toFixed(2)+':1. Accent text on that background: '+contrast(colors.accent,colors.surface).toFixed(2)+':1.',
   'These calculations use your supported solid palette colours. They do not assess photographs, overlays, actual rendered text size or full accessibility. Preview each affected screen before keeping a change. Nothing will be changed.'].join('\n'),alternatives:[]};}
 }
 if(/\b(colou?rs?|palette|dark background|light background)\b/i.test(text)){
  const palette=kind==='app'?LABELS[project.draft_config?.presentation?.brandPalette||'midnight']:null;
  const primary=kind==='website'&&/^#[a-f0-9]{6}$/i.test(project.theme?.primary||'')?project.theme.primary:null;
  return {answer:[palette?'Your app currently uses '+palette+'.':primary?'Your website’s current primary colour is '+primary+'.':'Your current branding is kept in this draft.',
   'A darker palette can emphasise photography; a lighter palette may suit longer descriptions. Neither is automatically better for your business.',
   'Readable text and buttons need sufficient contrast on their actual backgrounds. Photos and overlays need a real preview check.',
   'Use the existing colour preview in the editor to compare a change when you are ready. Your branding stays unchanged here.'].join('\n'),alternatives:[]};
 }
 if(kind==='website'&&/\b(?:phone|mobile|service page)\b.*\b(?:read|readability|text|spac)|\b(?:read|readability|text|spac)\w*\b.*\b(?:phone|mobile)\b/i.test(text)){
  const facts=websiteCompositionFacts(project,'home');
  return {answer:['Your current Home page contains '+facts.longReadingSectionCount+' longer information sections (at least 500 source characters each). This counts supplied text; it does not measure rendered line length or reading time.',
   facts.phoneReadingSectionId?'The existing design comparison can prepare larger phone text and more breathing room for one longer section that has no custom phone reading settings, subject to your owner locks. Desktop and tablet rules stay unchanged.':'No uncustomised longer information section is available for that targeted comparison. Keep your existing phone choices, or review a deliberately wider change in the editor.',
   'Larger type can ease reading but adds scrolling. This is source-based advice, not a screenshot, usability test or accessibility certification. Nothing will be changed.'].join('\n'),alternatives:[]};
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
 if(kind==='app'&&/\b(?:app)\b.*\b(?:more useful|help customers|improve)\b|\b(?:more useful|help customers|improve)\b.*\bapp\b/i.test(text)){
  const incomplete=services.filter(row=>!String(row.description||'').trim()).length;
  const modules=project.draft_config?.modules||[];
  const enquiry=plan.capabilities?.find(row=>row.id==='enquiry')?.app?.status;
  const suggestions=[services.length?'Your draft has '+services.length+' services. '+(incomplete?incomplete+' still need an owner-written description before customers can understand what to ask about.':'Customers can read the existing details and browse other services in the same category.'):'Start with one useful information screen and accurate owner-approved details, rather than adding empty screens.'];
  if(!profile.contact?.email&&!profile.contact?.phone)suggestions.push('Review your contact information so customers know how to reach the right business.');
  if(modules.some(row=>row.key==='enquiry'&&row.enabled===true))suggestions.push('An enquiry screen is present in the draft. Verify the complete customer review, saved request and owner inbox journey before treating it as a working result.');
  else suggestions.push(enquiry==='available_module_needs_owner_setup'||enquiry==='supported_section_not_present'?'The existing enquiry capability could be prepared for owner review; its setup and permissions still need checking.':'Enquiry availability is not confirmed for this app from the current capability evidence. Check the supported catalogue before promising it.');
  return {answer:[...suggestions,'No booking, payment or delivery is confirmed by a draft. These recommendations use current project information, not live customer outcome evidence. Nothing will be changed.'].join('\n'),alternatives:[]};
 }
 if(kind==='app'&&/\b(?:find|browse|discover)\b.*\bservices\b/i.test(text)){
  const categories=new Set(services.map(s=>typeof s.category==='string'?s.category.trim():'').filter(Boolean));
  return {answer:['Your current draft includes '+services.length+' service descriptions'+(categories.size?' across '+categories.size+' named categories':'')+'.',services.length>4?'The supported service screen includes text search. Categories can narrow the results, and Show all services clears both filters.':'Use clear service names and descriptions first. Categories can help when there are different kinds of service; text search appears when there are more than four services.',
   'Customers can open the existing service details and use an enabled enquiry or booking-request action. A button in a draft is not evidence that submission has completed; requests still need review and business confirmation. Nothing will be changed.'].join('\n'),alternatives:[]};
 }
 if(kind==='website'&&/\b(?:another (?:homepage|page) layout|compare (?:homepage|page) layouts|which (?:homepage|page) layout)\b/i.test(text)){
  const visible=(project.sections||[]).filter(s=>s.enabled!==false&&project.pages?.find(p=>p.id==='home')?.sectionIds?.includes(s.id));
  return {answer:['Your current Home page includes '+visible.length+' visible sections'+(services.length?' and '+services.length+' service descriptions':'')+'.',
   'Compare two different goals: a coordinated outlined-card presentation with confident typography, or larger phone reading text with the desktop styling kept. Both preserve your existing wording and colours.',
   'These are supported source-based proposals. No screenshot has been inspected and neither is proven to look better. The original editor will show the private preview before a separate approval. Nothing will be changed.'].join('\n'),alternatives:[{label:'Compare coordinated page styling',instruction:'make the homepage more modern without changing the wording'},{label:'Compare phone-only reading',instruction:'improve the phone layout but leave the desktop arrangement alone'}]};
 }
 if(kind==='website'&&/\b(?:information|customers?)\b.*\b(?:see first|show first|first)\b/i.test(text)){
  const page=project.pages?.find(p=>p.id==='home'),sections=(project.sections||[]).filter(s=>s.enabled!==false&&page?.sectionIds?.includes(s.id)),order=project.theme?.sectionOrder?.length?project.theme.sectionOrder:project.designPlan?.sectionOrder||[];
  const ordered=[...new Set([...order,...sections.map(s=>s.id)])].map(id=>sections.find(s=>s.id===id)).filter(Boolean);
  return {answer:['Your current Home page begins with '+(ordered.slice(0,3).map(s=>s.title||s.id).join(' → ')||'no visible sections yet')+'.',services.length?'Help visitors understand the existing services before asking them to enquire; keep a clear route to the original contact or enquiry action.':'Lead with a clear owner-written introduction and one supported next step. Add accurate information before extra decoration.',
   project.theme?.sectionOrder?.length?'Your customised section order stays authoritative. Any change needs an explicit original editor review.':'This is information-order advice from your current source, not a measured customer outcome.',
   'Nothing will be changed.'].join('\n'),alternatives:[]};
 }
 if(kind==='website'&&/\b(?:service[- ]focused|image[- ]led|gallery[- ]first|spacious homepage)\b/i.test(text)){
  const facts=websiteCompositionFacts(project,'home');
  return {answer:['Your current Home page has '+facts.serviceCount+' named services and '+facts.approvedGalleryCount+' approved gallery photographs.',
   'An information-focused composition uses readable service rows; an image-led introduction gives existing photography more emphasis. More phone spacing can improve separation but requires more scrolling.',
   facts.gallerySizeCustomized?'Your customised gallery sizing stays authoritative; the featured-gallery alternative is not offered over it.':'A featured-gallery proposal needs at least three approved photographs. No unrelated photo is assigned to a service.',
   'These are source-based trade-offs, not screenshot or customer-outcome evidence. Nothing will be changed.'].join('\n'),alternatives:[{label:'Explore readable service rows',instruction:'make the whole page easier to read'},{label:'Explore more phone space',instruction:'give the whole page more spacing on phones'}]};
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
