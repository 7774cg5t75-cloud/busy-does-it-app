/**
 * V3.110 choice-driven website address journey.
 *
 * This is pure *display state*, not domain registration/availability,
 * entitlement, routing, or publication. No names, prices or readiness may
 * be inferred without verified provider/business evidence.
 */
const modes=new Set(["busy","existing","new"]);
function websiteAddressChoices({mode="busy",publishing=null}={}){
 const selected=modes.has(mode)?mode:"busy";
 const view=publishing||{};
 const address=view.defaultAddressState?.address||null;
 const hostname=typeof address?.hostname==="string" ? address.hostname.trim():"";
 const busyLive=!!hostname&&address?.live===true;
 const domain=view.domainState?.latest||null;
 const journey=view.domainState?.journey||{};
 const chosenHostname=typeof domain?.hostname==="string"?domain.hostname.trim():"";
 const provenCustom=!!chosenHostname&&journey.complete===true&&
   !!view.canOpenCustomDomain;
 const options=[
   {id:"busy",title:"Use a BUSY address",
     description:"Start without purchasing a separate domain. BUSY assigns the address during approved publishing.",
     state:busyLive?"verified":hostname?"assigned-not-live":"not-yet-assigned",
     hostname:hostname||null,
     note:busyLive?"BUSY has verified this address is live.":
       hostname?"BUSY has recorded this address; public delivery is not verified.":
       "No address has been assigned yet. Nothing is published automatically."},
   {id:"existing",title:"I already have a domain",
     description:"Connect a domain you own; keep it with your current registrar.",
     state:provenCustom?"verified":domain?"setup-in-progress":"not-connected",
     hostname:chosenHostname||null,
     note:provenCustom?"This domain is recorded as connected and healthy.":
       domain?"The domain is not verified live yet. Follow the required ownership/DNS steps.":
       "You will need to prove ownership. BUSY can check public DNS without changing it."},
   {id:"new",title:"Find and buy a new domain",
     description:"In-app searching and purchasing is planned, but needs a registrar integration.",
     state:"not-available-yet",hostname:null,
     note:"BUSY cannot currently quote availability, prices, checkout or renewal terms. No purchase is possible here."}
 ];
 return {selected,options,active:options.find(x=>x.id===selected),
   busyAddressVerified:busyLive,customAddressVerified:provenCustom,
   registrarConnected:false,
   hasAnyVerifiedAddress:busyLive||provenCustom,
   domainChoiceDoesNotPublish:true};
}
export {websiteAddressChoices};
