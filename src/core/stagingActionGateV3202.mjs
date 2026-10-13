/**
 * V3.202: client-side second safety gate for an owner-triggered SYNTHETIC
 * staging database probe. A read-only installed-schema audit and separate
 * authenticated staging connection must be current for the SAME draft.
 *
 * Client gate is NOT security authority; Edge still independently enforces
 * staging environment, owner role, draft identity and approved action.
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
function assessSyntheticStagingAction({
 businessId="",app=null,probe=null,install=null
}={}){
 const deny=why=>({ok:false,why,mayRunSyntheticWrite:false,
  customerRequestAllowed:false,installationPermitted:false});
 if(!UUID.test(businessId)||!UUID.test(app?.id||"")||
  app?.business_id!==businessId||
  !Number.isSafeInteger(app?.draft_revision)||app.draft_revision<1)
  return deny("Open a current business-owned private app before checking staging.");
 const match=x=>x?.ok===true&&x.businessId===businessId&&
   x.appId===app.id&&x.draftRevision===app.draft_revision;
 if(!match(probe)||probe.stagingConnectionVerified!==true||
  probe.noRequestsSubmitted!==true)
  return deny("First verify the isolated staging connection for this exact private app.");
 if(!match(install)||install.readOnly!==true||
  install.source!=="authenticated_staging_server_schema_read_only"||
  install.kind!=="isolated_staging_install_audit_v3178"||
  install.installationReadyForSyntheticTesting!==true||
  !Array.isArray(install.checks)||install.checks.length!==5||
  new Set(install.checks.map(x=>x.id)).size!==5||
  install.checks.some(x=>x.status!=="reachable")||
  !["apps","website_deployments","app_owner_history",
   "website_owner_history","synthetic_qa"].every(id=>
     install.checks.some(x=>x.id===id)))
  return deny("The isolated staging schema is not verified as installed for this exact app.");
 return {ok:true,why:"Current owner-scoped isolated staging checks are ready.",
  mayRunSyntheticWrite:true,customerRequestAllowed:false,
  installationPermitted:false,needsNewOwnerConfirmation:true,
  onlySyntheticQATable:true,realCustomerOutcomeVerified:false};
}
export {assessSyntheticStagingAction};
