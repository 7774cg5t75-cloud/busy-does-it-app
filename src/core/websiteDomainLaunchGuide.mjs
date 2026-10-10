/**
 * V3.115 website address launch guidance from verifiable local status only.
 * Routing readiness never implies domain registration, SSL or live publishing.
 */
function websiteDomainLaunchGuide({choice="busy",publishing=null}={}){
 const view=publishing||{},domain=view.domainState?.latest||null;
 const defaultAddress=view.defaultAddressState?.address||null;
 const busyHost=typeof defaultAddress?.hostname==="string"?defaultAddress.hostname.trim():"";
 const chosenHost=typeof domain?.hostname==="string"?domain.hostname.trim():"";
 if(choice==="new")
  return {step:"continue-with-busy",needsPurchase:false,ready:false,
   next:"Domain purchases are not connected yet. You can finish your website with a BUSY address and switch later.",
   publicAddress:null,checkoutAvailable:false};
 if(choice==="existing"){
  if(!chosenHost)return {step:"connect-domain",ready:false,
   next:"Enter the address you own. BUSY will explain the ownership and DNS checks.",
   publicAddress:null,checkoutAvailable:false};
  if(view.domainState?.journey?.complete===true&&view.canOpenCustomDomain===true)
   return {step:"verified",ready:true,
    next:"The custom address passed BUSY's recorded connection and delivery checks. Changes still require publishing approval.",
    publicAddress:chosenHost,checkoutAvailable:false};
  return {step:"check-connection",ready:false,
   next:"Continue ownership, routing, certificate and live website checks. Connecting DNS does not buy or renew this domain.",
   publicAddress:chosenHost,checkoutAvailable:false};
 }
 if(defaultAddress?.live===true&&busyHost)
  return {step:"verified",ready:true,
   next:"BUSY has verified this website address. You can keep it or connect your own domain later.",
   publicAddress:busyHost,checkoutAvailable:false};
 return {step:busyHost?"not-live":"awaiting-address",ready:false,
  next:busyHost?"The BUSY address has been recorded, but public delivery is still unverified.":
   "BUSY will assign an address as part of the approved hosting journey. No address is live yet.",
  publicAddress:busyHost||null,checkoutAvailable:false};
}
export {websiteDomainLaunchGuide};
