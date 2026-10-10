/**
 * V3.118: nonexecuting closed-sandbox pilot plan. All gates fail closed,
 * even if every checkbox is supplied, because this helper cannot create a
 * test account, deploy, publish, send messages, spend money or mutate DNS.
 */
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
function websitePilotReadiness(input={}){
 const sameTenant=uuid.test(input.businessId||"")&&
   input.businessId===input.ownerBusinessId;
 const sandbox=["sandbox","local"].includes(input.environment);
 const checks=[
  {id:"environment",label:"Confirmed isolated sandbox or local test environment",
   passed:sandbox&&input.productionCredentialsPresent===false},
  {id:"ownership",label:"Owner/admin is authorised for this exact test business",
   passed:sameTenant&&["owner","admin"].includes(input.role)},
  {id:"test-data",label:"Fictional business content and approved test media only",
   passed:input.fictionalDataOnly===true},
  {id:"isolation",label:"Tenant isolation and noncustomer access verified",
   passed:input.tenantIsolationVerified===true},
  {id:"dry-run",label:"Dry run, zero real payments, publishing or supplier messages",
   passed:input.dryRun===true&&input.allowExternalWrites===false&&
      input.allowPaidCalls===false},
  {id:"rollback",label:"Rollback and test-data removal independently checked",
   passed:input.rollbackTested===true&&input.testDataDeletionReviewed===true},
  {id:"owner-consent",label:"Founder explicitly approved this one test scenario",
   passed:input.founderApproved===true}
 ];
 const missing=checks.filter(x=>!x.passed);
 return {status:missing.length?"blocked":"ready-for-manual-sandbox-rehearsal",
  checks,missing:missing.map(x=>x.label),passed:checks.length-missing.length,
  total:checks.length,testBusinessId:sameTenant?input.businessId:null,
  canRunAutomatically:false,canUseProduction:false,
  canSpendMoney:false,canPublishWebsite:false,canContactCustomers:false,
  requiresFreshManualApproval:true,
  next:missing.length?missing[0].label:
   "Run a separately authorised local or sandbox rehearsal; review evidence before any customer pilot."};
}
export {websitePilotReadiness};
