/**
 * V3.215 immutable public website -> BUSY Business App request boundary.
 * The customer-facing link is a ROUTE, not authentication, booking, payment,
 * receipt, or permission to access another tenant.
 * The server MUST load app and immutable version itself before calling this.
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const SLUG=/^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const TYPES=new Set(["enquiry","booking_request"]);
const deny=reason=>({ok:false,reason,recordEntryAllowed:false,
  submitAllowed:false,customerRequestCreated:false,
  receiptVerified:false,bookingConfirmed:false});
function verifyPublishedWebsiteIntent({url="",app=/** @type {Record<string, unknown>|null} */ (null),version=/** @type {Record<string, unknown>|null} */ (null)}={}){
 let parsed;
 try{parsed=new URL(url);}catch{return deny("The website request link is malformed.");}
 const q=parsed.searchParams;
 const keys=[...q.keys()];
 if(!TYPES.has(q.get("intent"))||q.get("source")!=="web"||
    keys.length!==5||
    keys.join(",")!=="slug,source,intent,appId,versionId"||
    !SLUG.test(q.get("slug")||"")||
    !UUID.test(q.get("appId")||"")||
    !UUID.test(q.get("versionId")||""))
  return deny("Reapprove this website link to bind the exact published app and version.");
 if(!app||!version||
    app.id!==q.get("appId")||
    app.public_slug!==q.get("slug")||
    !["live","update_pending"].includes(app.status)||
    app.current_live_version_id!==q.get("versionId")||
    version.id!==app.current_live_version_id||
    version.mini_app_id!==app.id||
    version.state!=="live")
  return deny("The published Business App identity or version has changed.");
 const config=version.config;
 const kind=q.get("intent");
 if(!Array.isArray(config?.modules)||
    !config.modules.some(m=>m?.key===kind&&m.enabled===true)||
    (kind==="booking_request"&&(
      !Array.isArray(config.publicProfile?.services)||
      !config.publicProfile.services.some(s=>
        typeof s?.name==="string"&&s.name.trim()))))
  return deny("The published Business App no longer supports that customer request.");
 return {ok:true,kind,appId:app.id,versionId:version.id,
  recordEntryAllowed:true,submitAllowed:false,
  customerRequestCreated:false,receiptVerified:false,
  bookingConfirmed:false,needsBrowserChallenge:true,
  proofSource:"server_resolved_current_immutable_live_version"};
}
export {verifyPublishedWebsiteIntent};
