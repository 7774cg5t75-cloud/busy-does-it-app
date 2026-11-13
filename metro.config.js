const path=require('path');
const {getDefaultConfig}=require('expo/metro-config');
const config=getDefaultConfig(__dirname);
if(process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT==='owner-preview'){
 const aliases={'react-native':'native.js','expo/fetch':'expoFetch.js','expo-notifications':'notifications.js','expo-calendar/legacy':'calendar.js','expo-calendar':'calendar.js','expo-sharing':'sharing.js','react-native-webview':'webview.js'};
 config.resolver.resolveRequest=(context,name,platform)=>{
  const own=context.originModulePath.includes(path.join('src','ownerPreview'));
  const firstParty=context.originModulePath.startsWith(path.join(__dirname,"src"))||context.originModulePath.startsWith(path.join(__dirname,"standalone"));
  if(firstParty&&!own&&aliases[name])return {type:'sourceFile',filePath:path.join(__dirname,'src/ownerPreview',aliases[name])};
  return context.resolveRequest(context,name,platform);
 };
}
module.exports=config;
