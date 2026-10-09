import fs from "node:fs";
import {Snack} from "snack-sdk";
import * as babelParser from "@babel/parser";
import {snackSourceFiles,validateSnackImports,validateSnackPackages} from "./snack-source.mjs";

// Build the COMPLETE source graph. *.mjs files are mapped to *.js for Expo
// Snack and references inside import statements use the matching path.
const files=snackSourceFiles();
for(const [file,record] of Object.entries(files)){
  try{
    babelParser.parse(record.contents,{sourceType:"module",plugins:["jsx"]});
  }catch(error){
    throw Error("Invalid Snack source "+file+": "+error.message);
  }
}
const unresolved=validateSnackImports(files);
if(unresolved.length)throw Error("Cannot publish an incomplete Snack module graph:\n"+unresolved.join("\n"));
console.log("Validated "+Object.keys(files).length+" Snack modules with resolved relative imports.");

const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
const version=pkg.version||"preview";
const branch=process.env.GITHUB_REF_NAME||("v"+version);
const snackDependencies={
    // react-native-qrcode-svg / react-native-svg intentionally excluded from
    // Snack. Business App QR is native-build only; Snack uses a share link.
    "@react-native-async-storage/async-storage":{version:"2.2.0"},
    "expo-image-picker":{version:"17.0.11"},
    "expo-audio":{version:"1.1.1"},
    "expo-file-system":{version:"19.0.24"},
    "expo-secure-store":{version:"15.0.8"},
    "expo-notifications":{version:"0.32.17"},
    "expo-calendar":{version:"15.0.8"},
    "expo-constants":{version:"18.0.14"},
};
const missingPackages=validateSnackPackages(files,snackDependencies);
if(missingPackages.length)throw Error("Cannot publish an incomplete Snack package graph:\n"+missingPackages.join("\n"));
console.log("Validated Expo Snack package imports.");
const snack=new Snack({
  name:"Busy Does It v"+version,
  description:"Auto-generated preview from the "+branch+" GitHub branch",
  files,
  dependencies:snackDependencies,
});
const result=await snack.saveAsync({ignoreUser:true});
const payload={
  generatedAt:new Date().toISOString(),
  id:result.id,
  webUrl:"https://snack.expo.dev/"+result.id,
  expoUrl:result.url,
  sourceBranch:branch,
  sourceCommit:process.env.GITHUB_SHA||null,
  appVersion:version,
  exportedModules:Object.keys(files).length,
  importClosureVerified:true,
};
fs.writeFileSync("SNACK_PREVIEW.json",JSON.stringify(payload,null,2)+"\n");
console.log(JSON.stringify(payload));
