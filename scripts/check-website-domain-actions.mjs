import assert from 'node:assert/strict';
import {createWebsiteDomainActions} from '../src/core/websiteDomainActions.mjs';
import {createPrivateWebsiteAsyncGate} from '../src/core/privateWebsiteAsyncGate.mjs';
const defer=()=>{let resolve;return {promise:new Promise(r=>resolve=r),resolve};};
function setup(){
 const gate=createPrivateWebsiteAsyncGate(),draft={id:'site',businessId:'business'};
 let live={ownerId:'owner',businessId:'business',draft},pending=null;
 const changes=[],calls=[],timers=[];let refreshed=0;
 const current=t=>gate.current(t,live);
 const actions=createWebsiteDomainActions({websiteDomainDraft:'example.test',websiteDraft:draft,withoutPrivateWebsiteDesignFeedback:x=>x,
  websiteBeginTask:(lane,options)=>gate.begin(lane,live,live,options),websiteTaskCurrent:current,
  websiteTaskSourceCurrent:t=>gate.sourceCurrent(t,live),websiteAsyncGateRef:{current:gate},
  websiteTaskAwait:async(t,work)=>{if(!current(t))throw Error('stale');const result=await work();if(!current(t))throw Error('stale');return result;},
  websitePublishingRequest:async(action,payload)=>{calls.push({action,payload});return pending?await pending.promise:{verified:true,provider:{configured:true},signals:{configured:true},ok:true,diagnostics:{domainId:payload?.domainId,readOnly:true}};},
  refreshWebsitePublishingStatus:async()=>{refreshed++;return true;},
  setWebsitePublishingAction:v=>changes.push(['action',v]),setWebsitePublishingError:v=>changes.push(['error',v]),setWebsitePublishingNotice:v=>changes.push(['notice',v]),setTimeout:fn=>timers.push(fn)});
 return {actions,calls,changes,timers,get refreshed(){return refreshed;},wait(){pending=defer();return pending;},switch(){live={ownerId:'other',businessId:'other',draft:{id:'foreign',businessId:'other'}};gate.setContext(live);},edit(){live={...live,draft:{...draft,generation:2}};}};
}
for(const [name,args]of [['requestWebsiteDomain',[]],['verifyWebsiteDomain',['domain']],['provisionWebsiteDomain',['domain']],['refreshWebsiteSignals',[]]]){
 const s=setup(),wait=s.wait(),first=s.actions[name](...args);
 assert.equal(await s.actions[name](...args),false);assert.equal(s.calls.length,1);
 s.switch();const before=s.changes.length;wait.resolve({verified:true,provider:{configured:true},signals:{configured:true}});
 assert.equal(await first,false);assert.equal(s.changes.length,before);assert.equal(s.refreshed,0);assert.equal(s.timers.length,0);
 const success=setup();assert.equal(await success.actions[name](...args),true);assert.equal(success.refreshed,1);
 if(success.timers.length){success.edit();success.timers.forEach(fn=>fn());assert.equal(success.refreshed,1);}
}
const dns=setup(),wait=dns.wait(),read=dns.actions.inspectWebsiteDomainDns('domain');dns.switch();wait.resolve({ok:true,diagnostics:{domainId:'domain',readOnly:true}});await assert.rejects(read,/stale/);
console.log('PASS: original Website domain/status actions deduplicate, reject switched workspace results, suppress stale cleanup and stop obsolete polling; DNS read remains scoped. No external calls.');
