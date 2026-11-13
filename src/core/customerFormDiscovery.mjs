import {stableJson} from './stableJson.mjs';
const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(x);
export function validateFormCatalog(c,{appId,versionId,screenId,interest=null}){
 try{if(!c||Object.keys(c).sort().join(',')!=='appId,appVersionId,entries,screenId'||c.appId!==appId||c.appVersionId!==versionId||c.screenId!==screenId||!uuid(appId)||!uuid(versionId)||!['business_profile','services','contact'].includes(screenId)||!Array.isArray(c.entries)||c.entries.length>1)throw Error();for(const e of c.entries){if(Object.keys(e).sort().join(',')!=='appId,appVersionId,id,interest,screenId,submissionPermitted,title'||!uuid(e.id)||e.appId!==appId||e.appVersionId!==versionId||e.screenId!==screenId||typeof e.title!=='string'||!e.title.trim()||e.title.length>80||/[<>\u0000-\u001f]/.test(e.title)||typeof e.submissionPermitted!=='boolean'||stableJson(e.interest)!==stableJson(interest))throw Error();}return {ok:true,entries:JSON.parse(stableJson(c.entries))};}catch{return {ok:false,reason:'These exact app questions are unavailable.'};}
}
export function createFormDiscovery({scope,request,isCurrent}){
 const stamp=stableJson(scope);let pending=false;
 return {async read(){if(pending||!isCurrent())return {ok:false};pending=true;try{const r=await request({action:'form_catalog',expectedAppId:scope.appId,expectedVersionId:scope.versionId,screenId:scope.screenId,interest:scope.interest??null});if(!isCurrent()||stableJson(scope)!==stamp)throw Error();return validateFormCatalog(r,scope);}catch{return {ok:false,reason:'No available form could be verified. Your existing app information is unchanged.'};}finally{pending=false;}}};
}
