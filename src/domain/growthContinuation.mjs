import {stableJson} from '../core/stableJson.mjs';
import {buildGrowthOpportunities,growthWebsiteEvidence,growthDraftOrigin} from './growthOpportunities.mjs';
const choices=['useful','irrelevant','later','clear'];
export function inspectSavedGrowthOrigin(input,origin){
 origin=growthDraftOrigin(origin);
 const deny=state=>({state,mayPrepare:false,current:null,notOwnReceipt:true});
 if(!input?.ownerId||!input.businessId||!['owner','admin'].includes(input.role)||origin?.ownerId!==input.ownerId||origin.businessId!==input.businessId||origin.kind!=='website_service_gap'||![1,2].includes(origin.version))return deny('unavailable');
 let identity;try{identity=JSON.parse(origin.id?.slice('website-service:'.length));}catch{return deny('unsupported');}
 if(!origin.id?.startsWith('website-service:')||!Array.isArray(identity)||identity.length!==2||identity[0]!==origin.sourceId||input.website?.id!==origin.sourceId)return deny('unavailable');
 const source=growthWebsiteEvidence(input);if(source.state!=='supported')return deny(source.state);
 const raw=input.approvedProfile?.services;if(!Array.isArray(raw))return deny('unavailable');
 const key=v=>typeof v==='string'?v.trim():'';
 const matching=raw.filter(r=>(key(r?.id)||key(r?.name))===identity[1]);
 if(matching.length!==1)return deny(matching.length?'ambiguous':'unavailable');
 const service=matching[0],names=raw.filter(r=>key(r?.name).toLocaleLowerCase('en')===key(service.name).toLocaleLowerCase('en'));
 if(names.length!==1)return deny('ambiguous');
 const row=buildGrowthOpportunities(input).find(r=>r.id===origin.id&&r.kind==='website_service_gap');
 const revision={websiteGeneration:input.website.generation,profileFingerprint:input.approvedProfile.fingerprint};
 if(!row){
  if(source.rows.some(r=>key(r.title||r.name).toLocaleLowerCase('en')===key(service.name).toLocaleLowerCase('en')))return {...deny('resolved'),sourceRevision:revision};
  return deny('unavailable');
 }
 const same=origin.version===2&&stableJson(origin.sourceRevision)===stableJson(revision)&&origin.serviceName===row.serviceName;
 return {state:same?'current':origin.version===1?'historical_reference_current_source':'changed',current:{...row,sourceRevision:revision},sourceRevision:revision,mayPrepare:true,notOwnReceipt:true};
}
// Feedback is an owner-private draft preparation, not a new account ledger or communication permission.
export function prepareGrowthPreference(input,origin,choice){
 if(!choices.includes(choice))return null;
 const inspected=inspectSavedGrowthOrigin(input,origin);if(inspected.state!=='current')return null;
 const source=growthDraftOrigin(origin);
 const previous=source.feedback?.revision||0;if(previous>=Number.MAX_SAFE_INTEGER)return null;
 return {...source,feedback:{purpose:'opportunity_relevance',choice,revision:previous+1,sourceRevision:inspected.sourceRevision}};
}
export function savedGrowthPreference(input,row,records=[]){
 if(!Array.isArray(records))return null;
 const valid=[];
 for(const record of records){
  if(!record?.id||records.filter(r=>r?.id===record.id).length!==1||record.status!=='Draft'||record.publishedAt||[record.ownerId,record.owner_id].some(x=>x&&x!==input.ownerId)||[record.businessId,record.business_id].some(x=>x&&x!==input.businessId))continue;
  const origin=growthDraftOrigin(record.growthOrigin),f=origin?.feedback;
  if(origin?.id!==row.id||origin.ownerId!==input.ownerId||origin.businessId!==input.businessId||f?.purpose!=='opportunity_relevance'||!choices.includes(f.choice)||!Number.isSafeInteger(f.revision)||f.revision<1)continue;
  const observed=inspectSavedGrowthOrigin(input,origin);
  if(observed.state!=='current'||stableJson(f.sourceRevision)!==stableJson(observed.sourceRevision))continue;
  valid.push(f.choice);
 }
 // Conflicting independent private drafts never silently choose a winner.
 return valid.length&&new Set(valid).size===1?valid[0]:null;
}
