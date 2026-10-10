/**
 * V3.123: one founder priority from server-authorised aggregate observations.
 * Detailed evidence remains available on request. No customer-specific rows
 * are read or returned, and no corrective action is triggered from this view.
 */
function founderPrioritySummary({priorities=null,incidentReview=null,safeAutomation=null}={}){
 const unavailable={status:"refresh",title:"Refresh the private platform report",
  explanation:"BUSY cannot confirm what needs attention until current aggregate evidence is available.",
  count:null,showExpertDetails:true,automaticRepair:false,
  sentNotification:false,mayChangeCustomerData:false};
 if(priorities?.status!=="available"||!Array.isArray(priorities.items)||
    priorities.freshness!=="recent"||incidentReview?.status==="refresh-first"||
    safeAutomation?.status==="refresh-required")return unavailable;
 const active=priorities.items.find(x=>x.severity==="attention"&&
    Number.isSafeInteger(x.count)&&x.count>0);
 if(active)return {status:"review",title:"Review recorded "+active.title.toLowerCase(),
  explanation:active.next,
  count:priorities.highPriorityCount,
  showExpertDetails:true,automaticRepair:false,
  sentNotification:false,mayChangeCustomerData:false};
 const unknown=priorities.items.find(x=>x.severity==="unverified"||
    x.count===null);
 if(unknown)return {status:"verify",title:"Verify missing operating signals",
  explanation:unknown.next,count:priorities.highPriorityCount,
  showExpertDetails:true,automaticRepair:false,
  sentNotification:false,mayChangeCustomerData:false};
 return {status:"routine",title:"Continue planned checks",
  explanation:"No problems were recorded in the measured counters. This is not proof every customer service is healthy.",
  count:priorities.highPriorityCount,showExpertDetails:true,
  automaticRepair:false,sentNotification:false,mayChangeCustomerData:false};
}
export {founderPrioritySummary};
