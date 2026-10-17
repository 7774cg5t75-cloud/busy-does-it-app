import React from 'react';
import * as SecureStore from 'expo-secure-store';
import {createCustomerEnquiryCheckpoint} from '../core/customerEnquiryCheckpoint.mjs';
import {prepareBusinessContentEnquiry} from '../core/businessContentRecords.mjs';
// Keeps async device IO outside the giant controller and stops stale callbacks
// replacing newer typing, account changes or another selected listing.
function useCustomerEnquiryRecovery({userId,detail,draft,onRestore}){
 const [notice,setNotice]=React.useState(''),[busy,setBusy]=React.useState(false);
 const scope=JSON.stringify([userId,detail?.app?.id,detail?.version?.id,detail?.entryContentInterest?.selection||null]);
 const stamp=JSON.stringify(draft),live=React.useRef(null),inFlight=React.useRef(false);
 live.current={scope,stamp};
 React.useEffect(()=>{live.current={scope,stamp};return()=>{live.current=null;};},[]);
 const store=React.useMemo(()=>createCustomerEnquiryCheckpoint(SecureStore,{userId,appId:detail?.app?.id,versionId:detail?.version?.id}),[userId,detail?.app?.id,detail?.version?.id]);
 const run=async(action)=>{
  const current=()=>live.current?.scope===scope&&live.current?.stamp===stamp;
  if(inFlight.current||!current())return false;
  inFlight.current=true;
  setBusy(true);
  try{
   if(action==='save'){await store.save(draft);if(current())setNotice('Private enquiry saved in encrypted device storage for this account. Restorable for 24 hours; expired drafts are deleted on next access. Nothing was sent.');}
   if(action==='restore'){
    const saved=await store.load();if(!current())return false;
    if(!saved){setNotice('No current saved device draft was found.');return false;}
    if(saved.contentInterest){const checked=prepareBusinessContentEnquiry(detail.businessContent,detail.app?.business_id,saved.contentInterest);if(!checked.ok)throw Error(checked.reason);}
    onRestore(saved);setNotice('Private draft restored. Check any earlier request reference before retrying. Nothing was sent.');
   }
   if(action==='delete'){await store.remove();if(current())setNotice('Saved device draft deleted. Your open form is unchanged.');}
   return true;
  }catch(error){if(current())setNotice(error.message);return false;}
  finally{inFlight.current=false;if(live.current?.scope===scope)setBusy(false);}
 };
 return {notice,busy,save:()=>run('save'),restore:()=>run('restore'),remove:()=>run('delete'),clearIfSame:store.clearIfSame};
}
export {useCustomerEnquiryRecovery};
