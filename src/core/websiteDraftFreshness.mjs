/**
 * V3.123: use the exact current preview's recorded source generation,
 * not whichever deployment happened to be first in a stale/sorted list.
 * If a preview and draft are present but no matching generation can be
 * verified, we MUST NOT grant publication on guessed freshness.
 */
const integer=x=>Number.isSafeInteger(Number(x))&&Number(x)>=1?Number(x):null;
function websiteDraftFreshness({draft=null,preview=null,live=null,latest=null}={}){
 if(!draft)return {status:"no-draft",changed:false,verified:false,
   reason:"No private website draft is selected."};
 const draftGeneration=integer(draft.generation);
 const target=preview||live||null;
 if(!target){
   return {status:"no-hosted-version",changed:false,verified:false,
    reason:"A hosted website preview has not been prepared."};
 }
 const source=integer(target.source_generation);
 if(!draftGeneration||!source)
   return {status:"unknown",changed:true,verified:false,
    reason:"BUSY cannot prove that this hosted version matches your draft. Prepare a fresh preview."};
 if(draftGeneration>source)
   return {status:"changed",changed:true,verified:true,
    reason:"Your current private draft has newer changes than the hosted website."};
 if(draftGeneration<source)
   return {status:"mismatched",changed:true,verified:false,
    reason:"The hosted website comes from a different version. Prepare a new preview."};
 return {status:"same",changed:false,verified:true,
  reason:"This hosted version matches the recorded private draft generation."};
}
export {websiteDraftFreshness};
