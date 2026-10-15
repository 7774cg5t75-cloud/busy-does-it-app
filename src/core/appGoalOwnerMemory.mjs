import {buildOwnerDesignPatterns,prepareOwnerAwareDesignExperiments} from './appDesignPatterns.mjs';

// Reuse authenticated, bounded design feedback; stale/foreign snapshots have no
// influence. This does not fetch data or turn owner opinions into quality proof.
function applyGoalOwnerMemory(config,suggestions,snapshot,{businessId,ownerId,appId,revision}={}){
 const fallback={choices:suggestions,used:false,recordsUsed:0,suppressedCount:0};
 if(snapshot?.ok!==true||snapshot.businessId!==businessId||snapshot.ownerId!==ownerId||
    !ownerId||snapshot.appId!==appId||snapshot.revision!==revision||
    !Array.isArray(snapshot.records)||snapshot.records.length>80||
    snapshot.records.some(r=>!Number.isSafeInteger(r?.draftRevision)||r.draftRevision>revision))return fallback;
 const profile=buildOwnerDesignPatterns(snapshot.records);
 if(!profile.ok||profile.recordCount!==snapshot.records.length)return fallback;
 const evaluated=prepareOwnerAwareDesignExperiments(config,{history:snapshot.records,responsive:suggestions});
 if(!evaluated.ok)return fallback;
 const suppressed=new Set(evaluated.suppressed.map(x=>x.field+':'+x.value));
 const choices=suggestions.filter(x=>!suppressed.has(x.field+':'+x.value));
 // Stable order for equally supported rules; no synthesized fallback enters a
 // goal proposal simply because the owner rejected another appearance.
 const scores=new Map(evaluated.ranked.filter(x=>!x.fallback).map(x=>[x.field+':'+x.value,x.score]));
 choices.sort((a,b)=>(scores.get(b.field+':'+b.value)||0)-(scores.get(a.field+':'+a.value)||0));
 return {choices,used:true,recordsUsed:profile.recordCount,
  suppressedCount:suggestions.length-choices.length};
}
export {applyGoalOwnerMemory};
