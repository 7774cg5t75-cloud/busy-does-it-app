/**
 * One manual intervention prompt from founder-only aggregate evidence.
 * Never schedules repairs, sends messages or assumes healthy providers.
 */
function founderNextSafeAction(priorities){
 if(priorities?.status!=="available"||!Array.isArray(priorities.items))
  return {status:"unavailable",title:"Verify founder reporting",
   message:"No trusted aggregate snapshot is available.",
   automaticRepair:false,notificationSent:false};
 const item=priorities.items.find(x=>x.severity==="attention"&&x.count>0)||
  priorities.items.find(x=>x.severity==="unverified")||null;
 if(!item)return {status:"measured-no-issues",title:"Continue routine checks",
  message:"No failures in the measured counts does not prove every provider is healthy.",
  automaticRepair:false,notificationSent:false};
 return {status:item.severity==="attention"?"review-failure":"verify-evidence",
  title:item.title,key:item.key,count:item.count,message:item.next,
  automaticRepair:false,notificationSent:false};
}
export {founderNextSafeAction};
