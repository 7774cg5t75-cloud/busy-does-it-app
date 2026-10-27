import {creatorContentFromEditor,creatorAccountRecord,finiteCreatorContent} from './creatorDraftAccount.mjs';
import {stableJson} from './stableJson.mjs';
import {restoreContentDraft} from './contentDraftChanges.mjs';
export function compareCreatorDraft(s,saved){
 const local=creatorContentFromEditor(s),records=s.socialDrafts?.filter(r=>r.id===saved?.draftId);
 if(s.cloudWorkspace?.role!=='owner'||!Number.isSafeInteger(saved?.revision)||saved.revision<1||saved.currentRevision!==saved.revision||!local||local.draftId!==saved?.draftId||saved.ownerId!==s.ownerSession?.userId||saved.businessId!==s.cloudWorkspace?.businessId||saved.historical||saved.status!=='Draft'||!finiteCreatorContent(saved.content)||records?.length!==1)return null;
 const fields=['text','brief','format','treatment','channels','media','ownerFacts','preparedCopy','brandFingerprint','editor'];
 return {draftId:saved.draftId,accountRevision:saved.revision,lastDeviceAccountRevision:records[0].creatorAccountRevision||null,sourceState:saved.sourceState,differences:fields.filter(k=>stableJson(local.content[k]??null)!==stableJson(saved.content[k]??null)),sameContent:stableJson(local.content)===stableJson(saved.content),ownWriteReceipt:false};
}
// A supported independent device copy. No account revision or save receipt minted.
export function copyCreatorDeviceDraft(s,newId){
 const input=creatorContentFromEditor(s);
 if(s.cloudWorkspace?.role!=='owner'||!input||typeof newId!=='string'||!/^[A-Za-z0-9_-]{1,120}$/.test(newId)||s.socialDrafts.some(r=>r.id===newId))return false;
 const record=creatorAccountRecord({draftId:newId,ownerId:s.ownerSession.userId,businessId:s.cloudWorkspace.businessId,content:input.content,opportunityReference:input.reference,revision:0,resolvedPhotos:s.socialCreatePhotos});
 delete record.creatorAccountRevision;record.sourceLabel='Separate device Creator draft — not saved to account';
 return s.socialContentActions.replaceDraft(()=>{s.installCreatorAccountRecord(record,restoreContentDraft(record));return true;});
}
