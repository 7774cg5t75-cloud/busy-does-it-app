import {proposeCoordinatedAppChanges} from "./appCoordinatedStudio.mjs";

// Private, in-memory proposal identity. Never persisted, logged or sent to AI.
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
function canonical(value){
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==="object")return Object.fromEntries(
  Object.keys(value).sort().filter(k=>value[k]!==undefined)
   .map(k=>[k,canonical(value[k])]));
 return value;
}
const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
function privateAppEditSource({businessId,app,config=app?.draft_config}={}){
 if(!uuid.test(businessId||"")||!uuid.test(app?.id||"")||
    app?.business_id!==businessId||!Number.isSafeInteger(app.draft_revision)||
    app.draft_revision<1||!config||!same(config,app.draft_config))return null;
 return {businessId,appId:app.id,revision:app.draft_revision,
  configStamp:JSON.stringify(canonical(config))};
}
function bindPrivateAppProposal(proposal,context){
 const source=privateAppEditSource(context);
 if(!proposal?.ok||!source)return null;
 // Recompute rather than trusting a caller's nextConfig or inverse commands.
 const checked=proposeCoordinatedAppChanges(context.config||context.app.draft_config,
  proposal.operations);
 if(!checked.ok||!same(checked.nextConfig,proposal.nextConfig))return null;
 return {...proposal,...checked,source};
}
const currentPrivateAppProposal=(proposal,context)=>!!proposal?.source&&
 same(proposal.source,privateAppEditSource(context));

/** One write, then at most one read on uncertainty. No blind replay or inferred undo. */
async function executePrivateAppBatch({businessId,app,operations,source,
 isCurrent,write,readStatus}={}){
 const base=privateAppEditSource({businessId,app});
 const failed=reason=>({ok:false,reason,mayRetry:false});
 if(!base||typeof isCurrent!=="function"||!isCurrent()||
    source&&!same(source,base))return failed("The private app changed. Review its current version before approving.");
 const plan=proposeCoordinatedAppChanges(app.draft_config,operations);
 if(!plan.ok)return failed(plan.reason);
 const expected=base.revision+1;
 const matches=a=>a?.id===base.appId&&a?.business_id===businessId&&
  a.draft_revision===expected&&same(a.draft_config,plan.nextConfig);
 try{
  const data=await write({appId:base.appId,expectedRevision:base.revision,
   operations:plan.operations,ownerApproved:true});
  if(!isCurrent())return failed("The workspace changed while saving. Reopen the original app to check its draft.");
  if(data?.ok!==true||data.privateOnly!==true||data.neverPublishes!==true||
     data.chargesCreated!==false||!matches(data.app)||!matches(data.status?.app)||
     data.appliedChangeCount!==plan.operations.length||
     !same(data.undoOperations,plan.undoOperations))throw Error("Save receipt did not match the approved private changes.");
  return {ok:true,status:data.status,undoOperations:plan.undoOperations,
   newRevision:expected,source:base};
 }catch{
  if(!isCurrent())return failed("The workspace changed. Check the original private app before another save.");
  try{
   const status=await readStatus();
   if(!isCurrent())return failed("The workspace changed during recovery. Reopen the original app.");
   const observed=status?.app;
   if(observed?.id!==base.appId||observed?.business_id!==businessId||
      !Number.isSafeInteger(observed.draft_revision)||observed.draft_revision<base.revision)
    return failed("The save result could not be verified. Refresh the original private app before editing again.");
   const outcome=matches(observed)?"matching_draft_observed":
    observed.draft_revision===base.revision&&same(observed.draft_config,app.draft_config)?
     "original_draft_observed":"different_draft_observed";
   return {...failed(outcome==="matching_draft_observed"?
    "The requested design is present in the current private draft. This readback cannot prove which save produced it; review it before another edit.":
    outcome==="original_draft_observed"?
     "The original draft was observed. The earlier save may still be pending; refresh and review before approving again.":
     "A different draft was observed. Review the current version before preparing another change."),
    recovered:true,outcome,status,undoOperations:null};
  }catch{return failed("Save confirmation and recovery are unavailable. Your proposal is retained; refresh the original app before another save.");}
 }
}
export {privateAppEditSource,bindPrivateAppProposal,currentPrivateAppProposal,executePrivateAppBatch};
