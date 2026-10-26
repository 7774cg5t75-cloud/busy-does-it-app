import {stableJson} from '../core/stableJson.mjs';
import {reviewBusinessBrainObservedOutcomes} from '../core/businessBrainMeasuredOutcomes.mjs';
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
// Original persisted request/link/source-record relationships only. No inferred acquisition join.
export function growthRequestHistory({ownerId,businessId,role,remote,customers=[]}={}){
 const app=remote?.app,requests=remote?.requests,links=remote?.requestLinks;
 if(!ownerId||!['owner','admin'].includes(role)||!uuid(businessId)||app?.business_id!==businessId||!uuid(app.id)||!Array.isArray(customers)||!Array.isArray(requests)||requests.length>30||!Array.isArray(links)||links.length>100)return [];
 const reviewed=reviewBusinessBrainObservedOutcomes({businessId,appId:app.id,requests,links});if(!reviewed.ok)return [];
 const rows=[];
 for(const request of requests){
  if(request?.request_type!=='enquiry'||request.business_id!==businessId||request.mini_app_id!==app.id||!uuid(request.id)||requests.filter(r=>r?.id===request.id).length!==1||!['received','reviewing','accepted','declined','closed'].includes(request.status))continue;
  const matches=links.filter(l=>l?.request_id===request.id);if(matches.length!==1||matches[0].business_id!==businessId)continue;
  const link=matches[0];if(typeof link.customer_record_id!=='string'||!link.customer_record_id||!['linked','enquiry_linked'].includes(link.bridge_state)||link.action_record_id)continue;// A booking/action link cannot be reinterpreted as an enquiry handoff.
  const people=customers.filter(c=>c?.id===link.customer_record_id);if(people.length!==1)continue;
  const customer=people[0];if([customer.businessId,customer.business_id].some(b=>b&&b!==businessId)||!Array.isArray(customer.sourceRecords))continue;
  const all=customers.flatMap(c=>Array.isArray(c?.sourceRecords)?c.sourceRecords.map(source=>({customer:c,source})):[]).filter(x=>x.source?.miniAppRequestId===request.id);
  if(all.length!==1||all[0].customer!==customer)continue;
  const source=all[0].source;if(source.id!==`source-miniapp-${request.id}`||source.source!=='BUSY Business App'||source.stage!=='Enquiry')continue;
  const feed=remote.messageCheckpoints,raw=Array.isArray(feed?.rows)?feed.rows:null;
  const messages=raw&&raw.length<=150?raw.filter(m=>m?.request_id===request.id):null;
  const valid=messages&&messages.every(m=>uuid(m.id)&&m.business_id===businessId&&m.mini_app_id===app.id&&['business','customer'].includes(m.sender_role)&&typeof m.created_at==='string'&&Number.isFinite(Date.parse(m.created_at))&&raw.filter(x=>x?.id===m.id).length===1);
  const businessReply=!!valid&&messages.some(m=>m.sender_role==='business'),customerReply=!!valid&&request.request_origin==='signed_in'&&uuid(request.consumer_user_id)&&messages.some(m=>m.sender_role==='customer');
  rows.push({requestId:request.id,appId:app.id,customerId:customer.id,sourceId:source.id,stamp:stableJson([ownerId,businessId,role,app.id,request.id,request.status,request.updated_at,request.request_origin,request.consumer_user_id,link.customer_record_id,link.bridge_state,link.updated_at,link.linked_at,source.id,source.miniAppRequestId,source.stage,source.importedAt,messages?.map(m=>[m.id,m.sender_role,m.created_at])]),requestRecorded:true,enquiryRecorded:true,filedInboxAssociation:false,businessReplyStored:businessReply,customerReplyStored:customerReply,messageHistoryComplete:!!valid&&feed.truncated===false,providerDelivery:'not_established',marketingAttribution:'not_established',quoteAssociation:'not_established',wonWork:'not_established',payment:'not_established'});
 }
 return rows;
}

// Exact original V3.184 message -> V3.185 delivery-intent relation, never campaign attribution.
export function growthRequestActivity(input,row){
 const current=growthRequestHistory(input).find(x=>x.requestId===row?.requestId&&x.stamp===row.stamp);if(!current)return null;
 const feed=input.remote.messageCheckpoints,raw=feed?.rows;
 if(!Array.isArray(raw)||raw.length>150)return null;
 const messages=raw.filter(x=>x.request_id===row.requestId);
 if(messages.some(x=>!uuid(x.id)||x.business_id!==input.businessId||x.mini_app_id!==row.appId||!['business','customer'].includes(x.sender_role)||!Number.isFinite(Date.parse(x.created_at))||raw.filter(y=>y?.id===x.id).length!==1))return null;
 const intents=input.remote.messageDeliveryOutbox?.rows;
 const validIntents=Array.isArray(intents)&&intents.length<=100&&intents.every(x=>x.business_id===input.businessId&&x.mini_app_id===row.appId&&uuid(x.id)&&uuid(x.message_id)&&uuid(x.request_id)&&['business','customer'].includes(x.recipient_role)&&['pending','submitted_unverified','no_submission_evidence'].includes(x.state)&&intents.filter(y=>y?.id===x.id).length===1);
 const items=messages.map(m=>{const linked=validIntents?intents.filter(x=>x.message_id===m.id):[];const intent=linked.length===1&&linked[0].request_id===m.request_id&&linked[0].recipient_role===(m.sender_role==='business'?'customer':'business')?linked[0]:null;return {messageId:m.id,role:m.sender_role,recordedAt:m.created_at,meaning:m.sender_role==='business'?'Business message stored on exact request':current.customerReplyStored?'Signed-in customer-role response stored on exact request':'Customer-role message; authenticated consumer relationship not established',notificationIntentId:intent?.id||null,notificationState:intent?.state||'not_established',delivery:'not_established',acceptance:'not_established'};});
 return {requestId:row.requestId,sourceId:row.sourceId,items,complete:feed.truncated===false,stamp:stableJson([row.stamp,items]),marketingAttribution:'not_established',filedInbox:'not_established',quote:'not_established',wonWork:'not_established',payment:'not_established'};
}
