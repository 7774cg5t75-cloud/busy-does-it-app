// Optional additive contract for new signed-in clients. Older clients keep the
// original free-text request contract; no service ID/price/availability invented.
export function checkReviewedCustomerVersion(body,detail){
 const appId=body?.expectedAppId,versionId=body?.expectedVersionId;
 if(appId===undefined&&versionId===undefined)return {ok:true,legacy:true};
 if(typeof appId!=='string'||!appId||appId.length>80||
    typeof versionId!=='string'||!versionId||versionId.length>80||
    appId!==detail?.app?.id||versionId!==detail?.version?.id)
  return {ok:false,reason:'The published app changed after your review. Reload it and review your request again before sending.'};
 return {ok:true,legacy:false};
}
