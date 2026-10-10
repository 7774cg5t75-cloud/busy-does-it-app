/**
 * V3.128 independent iOS/Android installation identity for isolated staging.
 * The production app.json stays unchanged unless the explicit staging build
 * variable is present. This file does NOT build, deploy or activate anything.
 */
module.exports=({config})=>{
 const original=config||require("./app.json").expo;
 const isolated=process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT==="isolated-staging";
 if(!isolated)return original;
 return {
  ...original,
  name:"Busy Does It Staging",
  scheme:"busydoesit-staging",
  ios:{...original.ios,bundleIdentifier:"com.busydoesit.app.staging"},
  android:{...original.android,package:"com.busydoesit.app.staging"},
  extra:{...original.extra,busyEnvironment:"isolated-staging"}
 };
};
