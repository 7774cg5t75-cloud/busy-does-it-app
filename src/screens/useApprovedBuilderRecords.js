import React from 'react';
import {reviewApprovedBuilderRecords} from '../core/approvedBuilderRecords.mjs';
// Receives only the existing editor's verified response. No independent fetch,
// persistent store, polling, automatic composition or publication authority.
function useApprovedBuilderRecords(ownerId,businessId){
 const scope=JSON.stringify([ownerId,businessId]),live=React.useRef(null),[saved,setSaved]=React.useState(null);
 if(live.current?.scope!==scope)live.current={scope};const epoch=live.current;
 const feed=saved?.epoch===epoch&&reviewApprovedBuilderRecords(saved.feed,businessId).ok?saved.feed:null;
 epoch.feed=feed;
 const onApprovedRecords=next=>{if(live.current!==epoch)return;const accepted=next&&reviewApprovedBuilderRecords(next,businessId).ok?next:null;epoch.feed=accepted;setSaved(accepted?{epoch,feed:accepted}:null);};
 return {feed,onApprovedRecords,isCurrent:()=>!!feed&&live.current===epoch&&epoch.feed===feed&&reviewApprovedBuilderRecords(feed,businessId).ok};
}
export {useApprovedBuilderRecords};
