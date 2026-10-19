// Create an unsigned offline Expo preview from a fictional, reviewed mini-app.
import {mkdir,writeFile,copyFile,stat} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {nativeShellDescriptor} from "../src/core/standaloneNativePackage.mjs";
import {buildAppDistributionPlan,buildStandalonePrivateHandoff} from "../src/core/appDistributionChoices.mjs";
const root=path.resolve(fileURLToPath(new URL("..",import.meta.url)));
const output=path.join(root,".tmp","standalone-prototype-v3154");
const template=path.join(root,"standalone","template");
const id=seed=>"00000000-0000-4000-8000-"+seed;
const app={id:id("000000000321"),display_name:"Example Salon",draft_revision:2};
const catalog=["business_profile","services","booking_request","enquiry"].map(key=>({
 module_key:key,title:key,status:"available",
 capabilities:key==="booking_request"?{confirmation_required_by_business:true}:
  key==="enquiry"?{customer_action:true}:{} }));
const preview={id:id("000000000322"),version_no:1,source_draft_revision:2,
 config:{display:{name:"Example Salon"},
 modules:catalog.map(x=>({key:x.module_key,enabled:true}))}};
const plan=buildAppDistributionPlan({mode:"standalone",app,preview,
 acknowledgements:{externalFees:true,externalAccounts:true,storeApproval:true,ongoingCosts:true},
 requestedPlatforms:["ios","android"]});
const handoff=buildStandalonePrivateHandoff({app,preview,plan,catalog,ownerConfirmed:true});
const descriptor=nativeShellDescriptor(handoff);
if(!descriptor.ok)throw Error("Unsafe prototype: "+descriptor.reason);
await mkdir(output,{recursive:true});
for(const file of ["useServiceBrowseReturn.js","requestDraftStatus.js","selectedListingSummary.js","nativeRequestScreen.js","enquiryTopicShortcuts.js","catalogueState.mjs","serviceActionButton.js","appFaqCard.js","App.js","app.config.js","index.js","package.json","nativeBusinessClient.js","nativeGuestProof.js","nativeGuestRequests.js","appResponsiveDesign.mjs","nativeCustomerActions.mjs","nativePreferredDates.mjs","appPublicCollections.mjs","publicServiceDetails.mjs","serviceDetails.js","businessContentView.js","businessContentRecords.mjs","serviceCategoryFilter.js","customerEnquiryRequirements.mjs"])
 await copyFile(path.join(template,file),path.join(output,file));
await copyFile(path.join(root,"src","core","nativePalette.mjs"),path.join(output,"nativePalette.mjs"));
await copyFile(path.join(root,'src','core','appComponentAppearance.mjs'),path.join(output,'appComponentAppearance.mjs'));
await copyFile(path.join(root,'src','core','appImageAppearance.mjs'),path.join(output,'appImageAppearance.mjs'));
await copyFile(path.join(root,'src','core','appServicePresentation.mjs'),path.join(output,'appServicePresentation.mjs'));
await copyFile(path.join(root,'src','core','appNavigationLabels.mjs'),path.join(output,'appNavigationLabels.mjs'));
await copyFile(path.join(root,"src","core","appVisualPresentationV3194.mjs"),path.join(output,"appVisualPresentationV3194.mjs"));
await writeFile(path.join(output,"prototype.json"),JSON.stringify(descriptor,null,2)+"\n",{mode:0o600});
if((await stat(path.join(output,"App.js"))).size<500)throw Error("Native shell missing");
console.log("V3.154 OFFLINE EXPO PROTOTYPE READY: "+output);
console.log("No signing, customer data, EAS project, store submission or provider charges.");
