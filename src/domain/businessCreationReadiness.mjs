/**
 * V3.61 business creation readiness scorecard.
 * Pure derived state; only approved profile facts count as ready.
 * This assessment never publishes or updates the shared profile.
 */
const present = value => typeof value === "string" && value.trim().length > 0;
function assessBusinessCreationReadiness({ approved = {}, cloud = {}, ai = {} } = {}) {
  const checks = [
    {id:"identity",label:"Business trading name",ready:present(approved.businessName)},
    {id:"industry",label:"Business type",ready:present(approved.businessType)},
    {id:"area",label:"Service area",ready:present(approved.serviceArea)},
    {id:"services",label:"Public services",ready:Array.isArray(approved.services)&&approved.services.some(s=>present(s?.name))},
    {id:"contact",label:"Customer contact",ready:present(approved.email)||present(approved.phone)},
    {id:"hours",label:"Opening hours",ready:present(approved.openingHours)},
  ];
  const ready = checks.filter(c=>c.ready).length;
  return {
    checks,
    ready,
    total:checks.length,
    percent:Math.round(100*ready/checks.length),
    missing:checks.filter(c=>!c.ready).map(c=>c.id),
    next:checks.find(c=>!c.ready)?.label||null,
    synced:cloud?.saved===true,
    aiApprovalPending:(Object.keys(ai?.fields||{}).length+(Array.isArray(ai?.services)?ai.services.length:0))>0,
    isPublishAuthorized:false,
  };
}
export { assessBusinessCreationReadiness };
