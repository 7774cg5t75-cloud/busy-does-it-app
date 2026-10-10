/**
 * Domain ownership and renewal guidance with no invented registrar management.
 * Never derive registration ownership/renewal status from DNS alone.
 */
function websiteDomainResponsibilities({mode="busy",connectedDomain=null,registrar=null}={}){
 if(mode==="new")
  return {title:"Buying domains through BUSY is not active",
   message:"No registrar is connected. BUSY cannot register, renew, or transfer a domain here yet. You will see full pricing and renewal terms before that becomes available.",
   verifiedRenewalDate:null,managedByBusy:false};
 if(mode==="existing"){
  const hostname=typeof connectedDomain?.hostname==="string"?connectedDomain.hostname.trim():"";
  return {title:hostname?"Your existing domain":"Connect a domain you already own",
   message:"Your domain stays with your current registrar. Continue paying renewal fees there; connecting it to BUSY does not transfer ownership or handle renewals. Your existing email DNS should remain unchanged.",
   verifiedRenewalDate:null,managedByBusy:false};
 }
 return {title:"BUSY-provided address",
   message:"You do not need to buy a separate domain to start. BUSY must still confirm your assigned address and public website delivery after you approve publication.",
   verifiedRenewalDate:null,managedByBusy:false};
}
export {websiteDomainResponsibilities};
