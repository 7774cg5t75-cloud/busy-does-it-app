/**
 * V3.195: one invariant for PRIVATE, same-tenant builder draft handoffs.
 * Pure predicate: UI review is not authorization to mutate or publish.
 * The caller must still recompute the proposed change at the approval tap.
 */
function validPrivateBuilderPair(website,app,businessId){
 return typeof businessId==="string"&&businessId.length>0&&businessId.length<=128&&
   website!==null&&typeof website==="object"&&!Array.isArray(website)&&
   typeof website.id==="string"&&!!website.id&&
   // Some private website drafts do not carry a tenant field. If a tenant
   // is explicitly present it must NEVER disagree with the owner workspace.
   (!website.businessId||website.businessId===businessId)&&
   (!website.business_id||website.business_id===businessId)&&
   Number.isSafeInteger(website.generation)&&website.generation>=1&&
   Array.isArray(website.sections)&&
   app!==null&&typeof app==="object"&&!Array.isArray(app)&&
   typeof app.id==="string"&&!!app.id&&app.business_id===businessId&&
   Number.isSafeInteger(app.draft_revision)&&app.draft_revision>=1&&
   app.draft_config!==null&&typeof app.draft_config==="object"&&
   !Array.isArray(app.draft_config)&&Array.isArray(app.draft_config.modules);
}
function reviewedPairIsCurrent(website,app,businessId,evidence,{
 appId="appId",appRevision="appRevision",websiteId="websiteId",
 websiteRevision="websiteGeneration"
}={}){
 return validPrivateBuilderPair(website,app,businessId)&&
   evidence!==null&&typeof evidence==="object"&&!Array.isArray(evidence)&&
   evidence.businessId===businessId&&evidence[appId]===app.id&&
   evidence[appRevision]===app.draft_revision&&
   evidence[websiteId]===website.id&&
   evidence[websiteRevision]===website.generation;
}
export {validPrivateBuilderPair,reviewedPairIsCurrent};
