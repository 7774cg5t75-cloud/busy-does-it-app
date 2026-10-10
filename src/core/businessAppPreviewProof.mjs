/**
 * V3.125: small immutable Business App preview/version guard. UI evidence
 * does not replace the server's tenant authorization or publish preflight.
 */
const ID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
function businessAppPreviewProof({app=null,preview=null}={}){
 const draftRevision=app?.draft_revision;
 const preparedRevision=preview?.source_draft_revision;
 const validRevision=Number.isSafeInteger(draftRevision)&&draftRevision>0&&
   Number.isSafeInteger(preparedRevision)&&preparedRevision===draftRevision;
 const immutable=typeof preview?.id==="string"&&ID.test(preview.id)&&
   Number.isSafeInteger(preview.version_no)&&preview.version_no>0;
 const matches=validRevision&&immutable;
 return {status:matches?"current-immutable-preview":"preview-needs-refresh",
   matches,reason:!preview?"Prepare a private customer preview.":
    !immutable?"The customer preview is missing an exact immutable version.":
    !validRevision?"Your app changed. Prepare and review a new preview.":
    "This exact immutable preview matches the current private app draft.",
   canPublishAutomatically:false,canAuthorizeOwner:false,
   canModifyLiveApp:false,requiresServerScopeAndOwnerClick:true};
}
export {businessAppPreviewProof};
