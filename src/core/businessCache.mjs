import {stableJson} from "./stableJson.mjs";
// Versioned provenance for the original device snapshot cache. Old unscoped
// bytes are preserved, never guessed into a signed-in business.
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const validId=x=>typeof x==='string'&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(x);
function businessCacheKey(ownerKey,businessId){return ownerKey&&validId(businessId)?ownerKey+':business:'+businessId.toLowerCase():'';}
function scopedPayload(payload,businessId){return object(payload)&&(payload.websiteDraft==null||object(payload.websiteDraft))&&![payload.websiteDraft?.businessId,payload.websiteDraft?.business_id].some(id=>id&&id!==businessId);}
function encodeBusinessCache({ownerId,businessId,revision,payload}){
 if(!validId(ownerId)||!validId(businessId)||!Number.isSafeInteger(revision)||revision<1||!scopedPayload(payload,businessId))throw Error('The local copy does not have verified business provenance.');
 return JSON.stringify({kind:'busy-business-cache',version:1,ownerId,businessId,revision,payload});
}
function decodeBusinessCache(raw,{ownerId,businessId}){
 try{const c=JSON.parse(raw);if(c?.kind!=='busy-business-cache'||c.version!==1||c.ownerId!==ownerId||c.businessId!==businessId||!validId(ownerId)||!validId(businessId)||!Number.isSafeInteger(c.revision)||c.revision<1||!scopedPayload(c.payload,businessId))return null;return c;}catch{return null;}
}
function selectBusinessCache(cache,remote){
 if(!cache)return {payload:remote.payload,revision:remote.revision,local:false,preserve:false};
 // Device-only preferences are not cloud edits, and JSONB key order is not
 // a content change. Preserve genuinely different business values only.
 const localOnly=new Set(['proactiveNotificationsEnabled','proactiveNotificationPermission','proactiveMorningTime','proactiveQuietHoursEnabled','proactiveQuietStart','proactiveQuietEnd','proactiveJobReminderMinutes','proactiveScheduledMap','proactiveNotificationLog','diaryConnection','diaryEventMap']);
 const comparable=p=>Object.fromEntries(Object.entries(p).filter(([key])=>!localOnly.has(key)));
 const changed=stableJson(comparable(cache.payload))!==stableJson(comparable(remote.payload));
 if(cache.revision===remote.revision)return {payload:cache.payload,revision:remote.revision,local:changed,preserve:false};
 const payload={...remote.payload};
 for(const key of localOnly)if(!Object.hasOwn(payload,key)&&Object.hasOwn(cache.payload,key))payload[key]=cache.payload[key];
 return {payload,revision:remote.revision,local:false,preserve:changed,cache};
}
// Ensure a sparse cloud snapshot cannot leave records from the previous
// business in selective legacy state setters. This is not a schema migration.
function completeBusinessSnapshot(payload={}){
 if(!object(payload))throw Error('The business snapshot must be an object.');
 const defaults={onboardingComplete:false,businessName:'',trade:'',verticalId:'exterior-cleaning',postcode:'',radius:'',brandProfile:{},websiteDraft:null,
  quietSlot:'',quietSlotConfirmed:false,activeWorkGoal:null,unansweredReviewCount:0,recentPhotoCountNeeded:0,
  customers:[],lastSimulatedRecipients:[],reactivationRuns:[],replyActions:{},services:[],alwaysAsk:false,customerContact:false,testLimit:'',weeklyLimit:'',connectedAccounts:{},dismissedOpportunities:[],selectedServiceId:'',intakeLog:[],inboxItems:[],connectionSyncLog:[],socialDrafts:[],socialPreferredChannels:{},businessBrainRules:[],businessBrainFeedback:[],proactiveNoticeState:{},busyCommandHistory:[],busyConversationTurns:[],busyOperatorSnapshot:null,dailyCommandCheckpoint:null,busyActionAudit:[],autopilotMode:'off',autopilotLastCheckAt:'',autopilotLastSignature:'',autopilotSnoozed:{},autopilotPreparedLog:[],businessMemoryHistory:[],businessMemoryLastReviewAt:'',proactiveNotificationsEnabled:false,proactiveNotificationPermission:'undetermined',proactiveMorningTime:'08:00',proactiveQuietHoursEnabled:true,proactiveQuietStart:'20:00',proactiveQuietEnd:'08:00',proactiveJobReminderMinutes:60,proactiveScheduledMap:{},proactiveNotificationLog:[],diaryConnection:{},diaryEventMap:{},recordFilingMode:'review',advanced:false};
 if(payload.websiteDraft!=null&&!object(payload.websiteDraft))throw Error('Review the website snapshot before restoring.');
 const result={...defaults,...payload};
 for(const [key,value]of Object.entries(defaults)){
  if(Array.isArray(value)&&!Array.isArray(result[key]))result[key]=[];
  else if(object(value)&&!object(result[key]))result[key]={};
 }
 return result;
}
export {businessCacheKey,encodeBusinessCache,decodeBusinessCache,selectBusinessCache,completeBusinessSnapshot};
