/**
 * V3.128 independent iOS/Android installation identity for isolated staging.
 * The production app.json stays unchanged unless the explicit staging build
 * variable is present. This file does NOT build, deploy or activate anything.
 */
module.exports=({config})=>{
 const original=config||require("./app.json").expo;
 const isolated=process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT==="isolated-staging";
 if(!isolated)return original;
 // The first isolated staging app only tests Supabase Auth + tenant RLS.
 // expo-notifications' iOS config plugin unconditionally adds aps-environment.
 // That entitlement cannot be signed by our intentionally non-push Ad Hoc
 // staging profile. Preserve the normal app's notification plugin unchanged.
 const stagingPlugins=(original.plugins||[]).filter(item=>{
  const name=Array.isArray(item)?item[0]:item;
  return name!=="expo-notifications";
 });
 const stagingEntitlements={...(original.ios?.entitlements||{})};
 delete stagingEntitlements["aps-environment"];
 return {
  ...original,
  name:"Busy Does It Staging",
  scheme:"busydoesit-staging",
  plugins:[...stagingPlugins,"./plugins/withIsolatedStagingNoPush.js"],
  ios:{...original.ios,bundleIdentifier:"com.busydoesit.app.staging",entitlements:stagingEntitlements},
  android:{...original.android,package:"com.busydoesit.app.staging"},
  extra:{...original.extra,busyEnvironment:"isolated-staging"}
 };
};
