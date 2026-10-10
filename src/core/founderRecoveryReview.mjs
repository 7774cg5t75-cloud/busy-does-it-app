/**
 * Founder triage stays read-only. Only aggregate failure evidence is used.
 * A dashboard snapshot can never authorize provider retries or escalation.
 */
function founderRecoveryReview({priorities=null,rehearsal=null}={}){
 if(priorities?.status!=="available"||!Array.isArray(priorities.items))
   return {status:"unavailable",headline:"Verify operational evidence",
    next:"Refresh the restricted founder report.",items:[],
    canFixAutomatically:false,sentAlerts:false};
 const stale=priorities.freshness!=="recent";
 if(stale)return {status:"refresh-first",headline:"Monitoring evidence needs updating",
   next:"Refresh the report before acting on older failure counts.",items:[],
   canFixAutomatically:false,sentAlerts:false};
 const failures=priorities.items.filter(x=>x.severity==="attention"&&x.count>0)
  .slice(0,4).map(x=>({key:x.key,summary:x.title,count:x.count,
    next:x.next,reviewRequired:true}));
 return {status:failures.length?"review-incidents":"prepare-test",
  headline:failures.length?"Review recorded problems before the next pilot":
   "No failures recorded in the measured counters",
  next:failures.length?failures[0].next:
   rehearsal?.next||"Verify the isolated sandbox rehearsal plan.",
  items:failures,canFixAutomatically:false,sentAlerts:false,
  providerBillingVerified:false,monitoringScope:"founder_aggregate_only"};
}
export {founderRecoveryReview};
