import {fieldChoices} from '../core/websiteStructuredEditing.mjs';
import React from 'react';
import {Text} from 'react-native';
import {Button,Details} from './ui';
import {WorkflowStatus} from './WorkflowChrome';
import {styles} from '../theme/styles';
import {prepareCreatorWebsiteCopy} from '../core/creatorWebsiteCopy.mjs';
import {stableJson} from '../core/stableJson.mjs';
export function CreatorWebsiteReview({s,record}){
 const [review,setReview]=React.useState(null),[notice,setNotice]=React.useState(''),[busy,setBusy]=React.useState(false),[blocked,setBlocked]=React.useState(false);
 const live=React.useRef(s),alive=React.useRef(true),flight=React.useRef(false);live.current=s;
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId,api=s.creatorDraftAccount,scope=s.ownerWorkspaceScope;
 const current=()=>alive.current&&live.current.ownerSession?.userId===owner&&live.current.cloudWorkspace?.businessId===business&&live.current.ownerWorkspaceScope===scope&&live.current.creatorDraftAccount===api;
 const run=async fn=>{if(flight.current)return;flight.current=true;setBusy(true);try{await fn();}catch{if(current())setNotice('Inspection or save unavailable. Your content is kept; nothing was retried.');}finally{flight.current=false;if(current())setBusy(false);}};
 const choose=sectionId=>run(async()=>{const website=s.websiteDraft,read=await api.read(record.draftId);if(!current()||live.current.websiteDraft!==website)return;if(read.revision!==record.revision||stableJson(read.content)!==stableJson(record.content)){setReview(null);setNotice('The saved content changed. Inspect its current version before reuse.');return;}const result=prepareCreatorWebsiteCopy({record:read,website,ownerId:owner,businessId:business,sectionId});setReview(result.ok?{...result,scope,owner,business}:null);setNotice(result.ok?'Review replacing only this section’s body with the exact saved words. No colours, pictures, headings or publication change.':result.reason);});
 const valid=review?.scope===scope&&review.owner===owner&&review.business===business&&review.websiteStamp===stableJson(s.websiteDraft)&&review.source.draftId===record?.draftId&&review.source.revision===record.revision;
 if(!record||!s.connectedEnvironment||!s.websiteDraft||!api?.enabled||typeof s.applyWebsitePageInstruction!=='function')return null;
 return <Details label="Reuse saved words on your private website">
  <Text style={styles.cardBody}>Prepare once, then review reuse. This copies saved wording only; it does not link future edits, attach private media, verify claims or publish anything. The website keeps its own approved branding.</Text>
  {(s.websiteDraft.sections||[]).filter(x=>x.enabled!==false&&s.websiteDraft.pages?.find(p=>p.id==='home')?.sectionIds?.includes(x.id)&&typeof x.body==='string'&&fieldChoices[x.type]?.includes('body')).map(x=><Button key={x.id} label={'Review wording for '+x.title} disabled={busy||blocked} onPress={()=>choose(x.id)}/>)}
  {valid?<><Text selectable style={styles.cardBody}>{review.text}</Text><Text style={styles.cardBody}>{'Saved content revision '+review.source.revision+'. Check that these words suit your website and that you have permission to use them. Any saved brand differences are kept for review; this does not update official business facts.'}</Text><Button primary label="Save these reviewed words privately" disabled={busy||blocked} onPress={()=>run(async()=>{const captured=review,read=await api.read(record.draftId);if(!current()||captured.websiteStamp!==stableJson(live.current.websiteDraft)||read.revision!==captured.source.revision||stableJson(read)!==captured.recordStamp){setReview(null);setNotice('The source or website changed. Review again; nothing was saved.');return;}setBlocked(true);const r=await live.current.applyWebsitePageInstruction({pageId:captured.pageId,generation:captured.generation,instruction:captured.instruction});if(!current())return;setReview(null);setNotice(r?.applied?'Website wording saved and independently reopened. The original Creator draft and media remain unchanged. Undo is available in Website Builder.':r?.reason||'Save not confirmed. Inspect the website account before another review.');})}/></>:null}
  {blocked?<Button label="Inspect website account before another review" disabled={busy} onPress={()=>run(async()=>{await s.connectedAccountRead();if(current()){setBlocked(false);setReview(null);setNotice('Website account independently inspected. Review again before saving; nothing was replayed.');}})}/>:null}
  {notice?<WorkflowStatus title="Private website wording" body={notice}/>:null}
 </Details>;
}
