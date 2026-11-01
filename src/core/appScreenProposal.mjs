import {prepareAppComposition} from './appGoalComposition.mjs';
import {prepareRecordAppComposition} from './appRecordComposition.mjs';
import {proposeCoordinatedAppChanges} from './appCoordinatedStudio.mjs';
import {bindPrivateAppProposal} from './privateAppEditSession.mjs';
import {publicCollection} from './appPublicCollections.mjs';
const MARKERS={categories:'Browse approved product categories.',details:'Review product details before enquiry.',faq:'Show approved FAQs early on information screen.',contact:'Show contact on the information screen.',gallery:'Show service examples before service questions.'};
export {MARKERS};
export function prepareScreenAppComposition(args){
 const {context,proposal,choices=[],feed}=args,config=context?.anchor?.project?.draft_config;if(!config)return {ok:false,reason:'Open the current private app.'};
 const base=choices.length?prepareRecordAppComposition(args):prepareAppComposition(args);
 if(!base.ok&&base.code!=='no_changes'&&base.reason!=='These approved collections already match your saved layout.')return base;
 const visual=proposal.app.visual,enabled=key=>config.modules.some(m=>m.key===key&&m.enabled===true),operations=base.ok?[...base.operations]:[];
 let next=base.ok?base.nextConfig:config,screenComposition=JSON.parse(JSON.stringify(config.screenComposition||{version:1,screens:[]}));
 const collections=next.contentLayout||[],requested=choices.length||Object.values(MARKERS).some(m=>visual.includes(m));
 if(requested){
  if((visual.includes(MARKERS.categories)||visual.includes(MARKERS.details))&&!choices.some(c=>c.kind==='product'))return {ok:false,reason:'Load current approved products before reviewing these screen changes.'};
  let sections=screenComposition.screens.find(s=>s.moduleKey==='business_profile')?.sections||[...collections.map(b=>b.kind==='product'?'products':'events'),'introduction','faqs','testimonials'];
  if(visual.includes(MARKERS.faq)){if(!publicCollection('faqs',config.publicProfile?.faqs||[]).length)return {ok:false,reason:'Add and approve your FAQ wording through the original information editor first.'};sections=['faqs',...sections.filter(k=>k!=='faqs')];}
  if(visual.includes(MARKERS.contact)){if(!enabled('contact'))return {ok:false,reason:'Contact needs its original enabled feature.'};sections=[...sections.filter(k=>k!=='contact'),'contact'];}
  if(choices.length||visual.includes(MARKERS.faq)||visual.includes(MARKERS.contact)){const row={moduleKey:'business_profile',sections};screenComposition.screens=[...screenComposition.screens.filter(s=>s.moduleKey!=='business_profile'),row];}
  if(visual.includes(MARKERS.gallery)){if(!enabled('services')||!enabled('gallery'))return {ok:false,reason:'Services and gallery need their original enabled features.'};screenComposition.screens=[...screenComposition.screens.filter(s=>s.moduleKey!=='services'),{moduleKey:'services',sections:['gallery','services',...enabled('contact')?['contact']:[]]}];}
  if(JSON.stringify(screenComposition)!==JSON.stringify(config.screenComposition)&&screenComposition.screens.length)operations.push({kind:'screen_composition',value:screenComposition});
 }
 if(!operations.length)return base;
 const checked=proposeCoordinatedAppChanges(config,operations);if(!checked.ok)return checked;
 const bound=bindPrivateAppProposal(checked,{businessId:context.scope.businessId,app:context.anchor.project});
 return bound?{...bound,...base.recordReview?{recordReview:base.recordReview,businessContentPreview:feed}:{},explanation:{summary:'Review the screen reading order and original approved content. Records stay in their original sources; no customer request or publication is performed.'}}:{ok:false,reason:'The original private app changed.'};
}
