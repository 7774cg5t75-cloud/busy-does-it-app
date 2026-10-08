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
  const nextMissing = checks.find(c=>!c.ready);
  const guidance = {
    identity: "Tell BUSY the exact business name customers should see.",
    industry: "Describe what your business does in your own words.",
    area: "Tell BUSY the towns or regions where you work.",
    services: "Review your services and add the ones you want customers to see.",
    contact: "Confirm a public phone number or business email.",
    hours: "Confirm when customers can contact or book you.",
  };
  const nextAction = nextMissing ? {
    field:nextMissing.id,
    title:nextMissing.label,
    guidance:guidance[nextMissing.id],
    action:nextMissing.id === "services" ? "review_services" : "describe_business",
    requiresOwnerConfirmation:true,
  } : {
    field:null,title:"Review launch pack",
    guidance:"All six core facts are confirmed. Review each customer-facing surface before publishing.",
    action:"review_launch_pack",requiresOwnerConfirmation:true,
  };
  return {
    checks,
    ready,
    total:checks.length,
    percent:Math.round(100*ready/checks.length),
    missing:checks.filter(c=>!c.ready).map(c=>c.id),
    next:nextMissing?.label||null,
    nextAction,
    synced:cloud?.saved===true,
    aiApprovalPending:(Object.keys(ai?.fields||{}).length+(Array.isArray(ai?.services)?ai.services.length:0))>0,
    isPublishAuthorized:false,
  };
}
export { assessBusinessCreationReadiness };
