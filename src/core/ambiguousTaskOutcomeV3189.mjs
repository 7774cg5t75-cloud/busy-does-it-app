/* V3.189: uncertain transport does not mean an operation failed. */
function assessAmbiguousTaskOutcome({transportUnknown=false,databaseSaved=false,
 idempotencyKeyMatches=false,readbackComplete=false,gatewayAccepted=false,
 deviceReceipt=false}={}){
 if([transportUnknown,databaseSaved,idempotencyKeyMatches,readbackComplete,
  gatewayAccepted,deviceReceipt].some(x=>typeof x!=="boolean"))
  return {ok:false,reason:"The task receipt needs checking."};
 const authoritative=readbackComplete&&idempotencyKeyMatches;
 const stage=!authoritative?"needs_same_key_readback":
  !databaseSaved?"not_stored_in_checked_record":
  deviceReceipt?"device_receipt_reported":
  gatewayAccepted?"accepted_by_gateway_not_device":"saved_inside_busy";
 return {ok:true,kind:"ambiguous_task_outcome_v3189",stage,
  next:!authoritative||transportUnknown&&!readbackComplete?
   "Check the original task using the same reference before retrying.":
   !databaseSaved?"Review the original request before another attempt.":
   "The task is stored. Check delivery independently before promising success.",
  databaseStateFromCompleteReadback:authoritative,
  customerDeliveryIndependentlyVerified:false,
  safeToRetryWithNewKey:false,
  preserveExistingKey:!authoritative,
  automaticContactAllowed:false};
}
export {assessAmbiguousTaskOutcome};
