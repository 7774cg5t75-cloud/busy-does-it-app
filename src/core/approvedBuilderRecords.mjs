import {validPublicBusinessContent,selectBusinessContent,validContentLayout} from './businessContentRecords.mjs';
import {proposeCoordinatedAppChanges} from './appCoordinatedStudio.mjs';
// A recent scoped read snapshot, never entitlement/stock/transaction evidence.
function reviewApprovedBuilderRecords(feed,businessId,{now=Date.now()}={}){
 const at=Date.parse(feed?.checkedAt||'');
 if(!businessId||!validPublicBusinessContent(feed)||feed.businessId!==businessId||!Number.isFinite(at)||at>now||now-at>600000)return {ok:false,reason:'Load current Products & Events for this business. Drafts are not approved records.',records:[]};
 return {ok:true,records:['product','event'].map(kind=>({kind,count:selectBusinessContent(feed,{kind,now}).filter(row=>!['cancelled','archived'].includes(row.data.status)).length})),snapshotAt:feed.checkedAt,notAvailabilityProof:true};
}
function planApprovedAppRecordSection(config,feed,businessId,kind){
 const current=reviewApprovedBuilderRecords(feed,businessId);
 if(!current.ok||!['product','event'].includes(kind)||!current.records.some(row=>row.kind===kind&&row.count>0))return {ok:false,reason:current.reason||'No current approved records are ready for this section.'};
 const layout=config.contentLayout===undefined?[]:config.contentLayout;
 if(!validContentLayout(layout)||layout.some(block=>block.kind===kind))return {ok:false,reason:'Keep the existing section and its owner customisations. Edit it in Studio instead.'};
 const proposal=proposeCoordinatedAppChanges(config,[{kind:'content_layout',value:[...layout,{kind,title:kind==='product'?'Products':'Upcoming events',layout:'cards'}]}]);
 return proposal.ok?{...proposal,businessContentPreview:feed}:proposal;
}
export {reviewApprovedBuilderRecords,planApprovedAppRecordSection};
