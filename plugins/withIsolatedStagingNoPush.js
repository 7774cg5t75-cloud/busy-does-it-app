/**
 * Stage-only Expo CNG config plugin, never applied to the normal app.
 *
 * expo-notifications (including implicitly installed autoplugins) requests
 * ios aps-environment, but our existing staging Ad Hoc profile deliberately
 * has no Push Notifications capability. Stage does not register for pushes.
 *
 * This is applied after normal iOS entitlement modifiers and leaves every
 * other Apple entitlement untouched.
 */
const {withEntitlementsPlist}=require("expo/config-plugins");
module.exports=function withIsolatedStagingNoPush(config){
 return withEntitlementsPlist(config,mod=>{
  if(["isolated-staging","owner-preview"].includes(process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT)){
   delete mod.modResults["aps-environment"];
  }
  return mod;
 });
};
