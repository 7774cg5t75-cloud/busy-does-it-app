/**
 * V3.126 exact-version website deployment selection.
 * Never let an arbitrary earlier preview_ready / live row override the
 * deployment ID recorded by the server as the canonical current version.
 * If no canonical ID exists, a fallback is allowed only when unambiguous.
 * This is an extra client-side display guard; server authorization and
 * publishing preflight remain mandatory.
 */
function selectRecordedWebsiteDeployment({deployments=[],website=null,kind="preview"}={}){
 const isPreview=kind==="preview";
 if(!isPreview&&kind!=="live")return null;
 const records=Array.isArray(deployments)?deployments.filter(v=>v&&typeof v==="object"):[];
 const field=isPreview?"current_preview_deployment_id":"current_live_deployment_id";
 const expectedState=isPreview?"preview_ready":"live";
 const currentId=website?.[field];
 if(currentId!==undefined&&currentId!==null&&currentId!==""){
   // Fail closed even if that record is missing or stale. Never fall back to
   // another row marked preview_ready just because it appears first.
   if(typeof currentId!=="string")return null;
   const exact=records.filter(r=>r.id===currentId);
   return exact.length===1&&exact[0]?.state===expectedState?exact[0]:null;
 }
 const matches=records.filter(r=>r.state===expectedState&&
   typeof r.id==="string"&&r.id.length>0);
 // Duplicate and/or unordered candidates must never become current by chance.
 return matches.length===1?matches[0]:null;
}
export {selectRecordedWebsiteDeployment};
