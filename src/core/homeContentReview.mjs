// A source-backed candidate for the original Home ranking, not another task queue.
export function homeContentReview(s,getCurrent){
 const ownerId=s.ownerSession?.userId,businessId=s.cloudWorkspace?.businessId;
 if(!ownerId||!businessId||!['owner','admin'].includes(s.cloudWorkspace?.role))return null;
 const record=(s.socialDrafts||[]).filter(item=>item?.status==='Draft'&&typeof item.text==='string'&&item.text.trim()&&typeof item.id==='string'&&(!item.businessId||item.businessId===businessId)&&!item.publishedAt).sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))[0];
 if(!record)return null;
 return {id:'content-review-'+record.id,score:55,eyebrow:'Content Creator',title:'Continue your private content draft',
  body:'A private draft is available to review. Check its wording and selected photos before any public action.',
  why:'This comes from an existing Draft record, not a generated marketing recommendation.',
  evidence:[['Source','Existing private content draft'],['Publication','Not verified by this suggestion']],
  actionLabel:'Review private content draft',canIgnore:false,tone:'blue',onAction:()=>{
   const current=getCurrent();
   if(current.ownerSession?.userId!==ownerId||current.cloudWorkspace?.businessId!==businessId||!['owner','admin'].includes(current.cloudWorkspace?.role)||!current.socialDrafts?.includes(record)||record.status!=='Draft')return false;
   current.openSocialDraft(record.id);return true;
  }};
}
