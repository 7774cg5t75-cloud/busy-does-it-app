import {stableJson} from './stableJson.mjs';
import {contentDraftChanges} from './contentDraftChanges.mjs';
// A source-backed candidate for the original Home ranking, not another task queue.
export function homeContentReview(s,getCurrent){
 const ownerId=s.ownerSession?.userId,businessId=s.cloudWorkspace?.businessId;
 if(!ownerId||!businessId||!['owner','admin'].includes(s.cloudWorkspace?.role))return null;
 const record=(s.socialDrafts||[]).filter(item=>item?.status==='Draft'&&typeof item.text==='string'&&item.text.trim()&&typeof item.id==='string'&&(!item.businessId||item.businessId===businessId)&&(!item.contentEvidence?.businessId||item.contentEvidence.businessId===businessId)&&s.socialDrafts.filter(row=>row.id===item.id).length===1&&!item.publishedAt).sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))[0];
 if(!record)return null;
 const scope=s.ownerWorkspaceScope,revision=s.cloudRevision,stamp=stableJson(record),newsletter=record.contentEvidence?.channel==='newsletter';
 return {id:'content-review-'+record.id,score:55,eyebrow:'Content Creator',title:newsletter?'Continue your private newsletter wording':'Continue your private content draft',
  body:newsletter?'Review your saved plain-text newsletter wording. No recipients, sending permission or email delivery is established.':'A private draft is available to review. Check its wording and selected photos before any public action.',
  why:'This comes from an existing Draft record, not a generated marketing recommendation.',
  evidence:[['Source','Existing private content draft'],['Publication','Not verified by this suggestion']],
  actionLabel:'Review private content draft',canIgnore:false,tone:'blue',onAction:()=>{
   const current=getCurrent();
   if(current.ownerWorkspaceScope!==scope||current.cloudRevision!==revision||stableJson(record)!==stamp||current.socialDrafts?.filter(row=>row.id===record.id).length!==1||current.ownerSession?.userId!==ownerId||current.cloudWorkspace?.businessId!==businessId||!['owner','admin'].includes(current.cloudWorkspace?.role)||!current.socialDrafts?.includes(record)||record.status!=='Draft')return false;
   return current.openSocialDraft(record.id)!==false;
  }};
}

// Resume the original live editor without reopening a saved record over newer work.
export function homeUnsavedContentReview(s,getCurrent){
 const owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId,scope=s.ownerWorkspaceScope;
 if(!owner||!business||!scope||!['owner','admin'].includes(s.cloudWorkspace?.role)||typeof s.socialContentActions?.capture!=='function'||typeof s.socialContentActions?.fresh!=='function')return null;
 const record=(s.socialDrafts||[]).find(row=>row.id===s.selectedSocialDraftId);
 if(s.selectedSocialDraftId&&(!record||record.status!=='Draft'||record.publishedAt||record.businessId&&record.businessId!==business))return null;
 const fields={text:s.socialDraftText,photos:s.socialCreatePhotos,brief:s.socialBrief,channels:s.socialDraftChannels};
 if(record?!contentDraftChanges(fields,record).dirty:!String(fields.text||'').trim()&&!fields.photos?.length&&!String(fields.brief||'').trim())return null;
 const ticket=s.socialContentActions.capture(),context=s.socialSourceContext;
 return {id:'current-private-content-review',score:57,eyebrow:'Content Creator',title:'Continue your unsaved content',body:'Your current wording, selected photos and destination choices are still in this workspace. Continue editing before saving privately.',why:'This comes from your actual current editor changes. It is not evidence of a saved draft or publication.',evidence:[['Source','Current private editor'],['Status','Changes not confirmed saved']],actionLabel:'Continue current content',canIgnore:false,tone:'blue',onAction:()=>{
  const now=getCurrent();
  if(now.ownerWorkspaceScope!==scope||now.ownerSession?.userId!==owner||now.cloudWorkspace?.businessId!==business||!['owner','admin'].includes(now.cloudWorkspace?.role)||now.socialSourceContext!==context||!now.socialContentActions?.fresh(ticket))return false;
  return now.go('socialCreator')!==false;
 }};
}
