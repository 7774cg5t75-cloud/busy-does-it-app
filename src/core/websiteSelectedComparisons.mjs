import {planSelectedWebsiteChanges} from './websiteContextPlan.mjs';
import {selectedWebsiteVoiceContextIsCurrent} from './websiteSelectedVoiceContext.mjs';
import {ownerDesignPreference} from './websiteMeasuredDesignCoach.mjs';
import {applyWebsiteLayoutOperation} from '../../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs';

// Suggestions only. The original selected preview replans and renders each
// instruction; Apply independently checks the current source and owner approval.
export function selectedWebsiteComparisons(draft,selection){
 if(!selectedWebsiteVoiceContextIsCurrent(draft,selection)||selection.itemId)return [];
 const section=draft.sections.find(s=>s.id===selection.sectionId);
 const choices=[
  ...(section.type==='services'?[{id:'selected-service-directory',label:'Services with clear detail rows',instruction:'show this services as a directory',explanation:'Pairs service names with their descriptions on larger screens, with a single reading column on phones. Other sections stay unchanged.'},{id:'selected-service-cards',label:'Two-column service cards',instruction:'show this services as cards',explanation:'Separates services into two cards per row on larger screens and one per row on phones. Wording and order stay unchanged.'}]:[]),
  {id:'selected-section-space',label:'More breathing room',instruction:'give this section more space',explanation:'Adds space around this section without changing its wording, colours or position.'},
  ...(['section','body'].includes(selection.field)&&section.body?[{id:'selected-phone-reading',label:'Easier phone reading',instruction:'make this section easier to read on phones; give this section more space on phones',explanation:'Uses larger paragraph text and more section space on phones. Desktop settings stay unchanged.'}]:[]),
  ...(selection.field==='title'?[{id:'selected-heading-hierarchy',label:'Stronger heading',instruction:'make this heading bigger; give this section more space',explanation:'Gives this heading more emphasis and the section more breathing room. The original words and colours stay intact.'}]:[])
 ];
 return choices.filter(choice=>ownerDesignPreference(draft,choice.id,selection.pageId)!=='disliked').flatMap(choice=>{
  const plan=planSelectedWebsiteChanges(draft,selection.pageId,selection,choice.instruction);
  if(!plan.ok)return [];
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
