import {editWebsiteDraftField} from './websiteStructuredEditing.mjs';
import {finiteCreatorContent} from './creatorDraftAccount.mjs';
import {planWebsitePageInstructions} from './websitePageInstructions.mjs';
import {stableJson} from './stableJson.mjs';
const fail=reason=>({ok:false,reason});
// Copy one exact reviewed saved text into the ORIGINAL finite website editor.
// Account observations never establish publication rights or approve media reuse.
function prepareCreatorWebsiteCopy({record,website,ownerId,businessId,sectionId,pageId='home'}={}){
 if(!record||record.ownerId!==ownerId||record.businessId!==businessId||record.notOwnReceipt!==true||record.historical!==false||record.currentRevision!==record.revision||!Number.isSafeInteger(record.revision)||record.revision<1||record.status!=='Draft'||!['not_linked','current'].includes(record.sourceState)||!finiteCreatorContent(record.content))return fail('Inspect the current saved private content in this business first.');
 if(!website?.id||website.businessId!==businessId||record.content.editor?.privacyWarnings?.length)return fail('Review the website and resolve content privacy warnings first.');
 const text=record.content.text;
 if(!text.trim()||text.length>1800||/["<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text))return fail('Use the website wording editor for this longer or quoted text. Nothing has been shortened or changed.');
 const section=website.sections?.filter(x=>x.id===sectionId&&x.enabled!==false),page=website.pages?.find(x=>x.id===pageId&&x.enabled!==false);
 if(section?.length!==1||!page?.sectionIds?.includes(sectionId))return fail('Choose one current visible website section.');
 const instruction='change the '+sectionId+' body to "'+text+'"';
 const planned=planWebsitePageInstructions(website,{draftId:website.id,pageId,generation:website.generation,instruction});
 if(!planned.ok)return fail(planned.reason);
 const checked=editWebsiteDraftField(website,planned.steps[0].change);
 if(!checked.applied)return fail(checked.reason);
 if(checked.draft.sections.find(s=>s.id===sectionId)?.body!==text)return fail('Use the website wording editor to review this text formatting. The saved words were not altered.');
 return {ok:true,instruction,pageId,generation:website.generation,draftId:website.id,sectionId,text,source:{draftId:record.draftId,revision:record.revision,brandFingerprint:record.content.brandFingerprint},recordStamp:stableJson(record),websiteStamp:stableJson(website),requiresOwnerApproval:true,privateOnly:true,mediaAttached:false,neverPublishes:true};
}
export {prepareCreatorWebsiteCopy};
