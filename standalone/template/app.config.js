// GENERATED "prototype.json" is deliberately not a permanent app ID.
// The customer's final identifier, EAS project, credentials, signing and
// submissions require a separately verified, owner-authorised process.
const p=require("./prototype.json");
if(!p||p.ok!==true||p.purpose!=="private_prototype"||
   p.buildIsProductionReady!==false)throw Error("Unsafe standalone prototype");
module.exports={expo:{
 name:p.appName,slug:p.slug,version:"0.0.1",orientation:"portrait",
 userInterfaceStyle:"dark",runtimeVersion:"0.0.1",
 ios:{bundleIdentifier:p.iosBundleIdentifier,supportsTablet:true},
 android:{package:p.androidPackage},
 extra:{busyPrototype:true,
  sourcePreviewVersionId:p.sourcePreviewVersionId,
  noAutomaticPublishing:true},
 plugins:[]
}};
