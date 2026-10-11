import {CHANNEL,resolveTapSelection} from "./websiteTapToEdit.mjs";

/** Reject a stale or forged voice context before spending on transcription. */
function selectedWebsiteVoiceContextIsCurrent(draft,selection){
 if(!draft?.id||!selection||typeof selection!=="object"||
    selection.draftId!==draft.id||!selection.pageId||
    Number(selection.generation)!==Number(draft.generation))return false;
 const msg={channel:CHANNEL,sectionId:selection.sectionId,
  itemId:selection.itemId||"",field:selection.field,
  photoIndex:selection.field==="photo"&&selection.photoIndex>=0
   ?String(selection.photoIndex):""};
 return !!resolveTapSelection(draft,selection.pageId,msg);
}
export {selectedWebsiteVoiceContextIsCurrent};
