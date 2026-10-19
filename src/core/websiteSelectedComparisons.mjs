import {planSelectedWebsiteChanges} from './websiteContextPlan.mjs';
import {selectedWebsiteVoiceContextIsCurrent} from './websiteSelectedVoiceContext.mjs';
import {ownerDesignPreference} from './websiteMeasuredDesignCoach.mjs';
import {applyWebsiteLayoutOperation} from '../../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs';

// Suggestions only. The original selected preview replans and renders each
// instruction; Apply independently checks the current source and owner approval.
export function selectedWebsiteComparisons(draft,selection){
 if(!selectedWebsiteVoiceContextIsCurrent(draft,selection)||selection.itemId)return [];
 const section=draft.sections.find(s=>s.id===selection.sectionId);
 const picture=section.type==='photo-feature'&&section.asset?.approved===true&&section.asset.storagePath;
 const side=section.appearance?.desktopPhotoSide||section.appearance?.photoSide||'left';
 const choices=[
  ...(section.type==='faq'?[{id:'selected-faq-questions',label:'Expandable questions',instruction:'show this faq as expandable questions',explanation:'Lets visitors open an answer when needed. All original questions and answers remain; compare reading and interaction before keeping it.'}]:[]),
  ...(['about','text'].includes(section.type)&&section.body?[{id:'selected-reading-editorial',label:'Heading beside the information',instruction:'show this text as an editorial layout',explanation:'Places the heading beside the existing paragraph on larger screens. Phones keep the original reading order; words and colours stay unchanged.'},{id:'selected-reading-column',label:'A focused reading column',instruction:'show this text as a reading column',explanation:'Bounds paragraph line length without changing your wording, section order or colours.'}]:[]),
  ...(picture?['left','right'].filter(value=>value!==side).map(value=>({id:'selected-picture-'+value,label:'Picture on the '+value,instruction:'put this picture on the '+value+' on desktop',explanation:'Moves this approved picture to the '+value+' on larger screens. Phone reading order, wording, colours and other sections stay unchanged.'})):[]),
  ...(section.type==='services'?[{id:'selected-service-directory',label:'Services with clear detail rows',instruction:'show the selected services as a directory',explanation:'Pairs service names with their descriptions on larger screens, with a single reading column on phones. Other sections stay unchanged.'},{id:'selected-service-cards',label:'Two-column service cards',instruction:'show the selected services as cards',explanation:'Separates services into two cards per row on larger screens and one per row on phones. Wording and order stay unchanged.'}]:[]),
  {id:'selected-section-space',label:'More breathing room',instruction:'give this section more space',explanation:'Adds space around this section without changing its wording, colours or position.'},
  ...(['section','body'].includes(selection.field)&&section.body?[{id:'selected-phone-reading',label:'Easier phone reading',instruction:'make this section easier to read on phones; give this section more space on phones',explanation:'Uses larger paragraph text and more section space on phones. Desktop settings stay unchanged.'}]:[]),
  ...(selection.field==='title'?[{id:'selected-heading-hierarchy',label:'Stronger heading',instruction:'make this heading bigger; give this section more space',explanation:'Gives this heading more emphasis and the section more breathing room. The original words and colours stay intact.'}]:[])
 ];
 return choices.flatMap(choice=>{
  const plan=planSelectedWebsiteChanges(draft,selection.pageId,selection,choice.instruction);
  if(!plan.ok)return [];
  const operation={action:'style-group',operations:plan.steps.filter(step=>step.type==='layout').map(step=>step.change)};
  if(ownerDesignPreference(draft,choice.id,selection.pageId,operation)==='disliked')return [];
  let candidate=draft;
  for(const step of plan.steps){
   if(step.type!=='layout')return [];
   const result=applyWebsiteLayoutOperation(candidate,step.change);
   if(!result.applied)return [];
   candidate=result.draft;
  }
  if(JSON.stringify(candidate.sections)===JSON.stringify(draft.sections))return [];
  return [{...choice,draftId:draft.id,generation:draft.generation,sectionId:section.id,pageId:selection.pageId}];
 });
}
