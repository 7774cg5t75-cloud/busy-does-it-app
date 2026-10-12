/**
 * V3.190: public, owner-approved information for a native customer app.
 * Projection runs ONLY after immutable live-version and app-scope validation.
 * Nothing here creates a redemption, confirms a benefit or reveals progress.
 */
const plain=(v,max)=>typeof v==="string"&&v.length<=max&&
 !/[<>\u0000-\u001f\u007f]/.test(v)?v.trim():"";
const date=v=>v===""||typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&
 !Number.isNaN(Date.parse(v+"T00:00:00Z"))&&
 new Date(v+"T00:00:00Z").toISOString().slice(0,10)===v;
function publicNativeOffers(config,{today=new Date().toISOString().slice(0,10)}={}){
 if(!Array.isArray(config?.modules)||!config.modules.some(m=>m.key==="offers"&&m.enabled===true)||
  !date(today)||!today)return [];
 const result=[];
 for(const offer of Array.isArray(config.offers)?config.offers.slice(0,60):[]){
  if(offer?.approved!==true)continue;
  const start=offer.startDate??"",end=offer.endDate??"";
  if(!date(start)||!date(end)||start&&end&&start>end||
    start&&start>today||end&&today>end)continue;
  const title=plain(offer.title,140),body=plain(offer.body??"",700);
  const terms=plain(offer.terms??"",800);
  if(!title||!terms)continue;
  result.push({title,body,terms,startDate:start,endDate:end});
  if(result.length===12)break;
 }
 return result;
}
function publicNativeLoyalty(config){
 if(!Array.isArray(config?.modules)||
  !config.modules.some(m=>m.key==="loyalty"&&m.enabled===true))return null;
 const programName=plain(config.loyalty?.programName,120);
 const reward=plain(config.loyalty?.reward,300);
 const terms=plain(config.loyalty?.terms,700);
 const targetStamps=config.loyalty?.targetStamps;
 if(!programName||!reward||!terms||!Number.isSafeInteger(targetStamps)||
  targetStamps<1||targetStamps>1000)return null;
 return {programName,reward,terms,targetStamps,
  personalBalanceAvailable:false,redemptionEnabled:false,
  ownerMustVerifyEarning:true};
}
export {publicNativeOffers,publicNativeLoyalty};
