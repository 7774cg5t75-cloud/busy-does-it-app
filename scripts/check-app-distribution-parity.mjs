import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {proposeCoordinatedAppChanges as propose} from '../src/core/appCoordinatedStudio.mjs';
import {publicAppAppearance} from '../src/core/appAppearanceEditing.mjs';
import {buildAppDistributionPlan,buildStandalonePrivateHandoff} from '../src/core/appDistributionChoices.mjs';
import {nativeShellDescriptor} from '../src/core/standaloneNativePackage.mjs';
const app={id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',display_name:'Fixture',draft_revision:3};
const modules=['business_profile','services','enquiry'];
const config={modules:modules.map(key=>({key,enabled:true})),navigation:['business_profile','enquiry','services'],publicProfile:{businessName:'Fixture'},presentation:{brandPalette:'custom',brandAccent:'#123456',navigationStyle:'list',ownerLockedElements:['navigation']}};
const preview={id:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',version_no:2,source_draft_revision:3,config};
const catalog=modules.map(module_key=>({module_key,status:'available',capabilities:module_key==='enquiry'?{customer_action:true}:{}}));
const plan=buildAppDistributionPlan({mode:'standalone',app,preview,requestedPlatforms:['ios','android'],acknowledgements:{externalFees:true,externalAccounts:true,storeApproval:true,ongoingCosts:true}});assert.ok(plan.ok);
const manifest=buildStandalonePrivateHandoff({app,preview,plan,catalog,ownerConfirmed:true});assert.ok(manifest.ok,manifest.reason);assert.equal(manifest.appearance.brandAccent,'#123456');assert.equal(manifest.appearance.ownerLockedElements,undefined);assert.deepEqual(manifest.modules,config.navigation);
const descriptor=nativeShellDescriptor(manifest);assert.ok(descriptor.ok,descriptor.reason);assert.deepEqual(descriptor.appearance,manifest.appearance);assert.equal(descriptor.signingConfigured,false);assert.equal(descriptor.runtimeConnection.enabled,false);
assert.equal(nativeShellDescriptor({...manifest,appearance:{...manifest.appearance,ownerLockedElements:['navigation']}}).ok,false);
for(const look of [{brandPalette:'custom'},{brandPalette:'custom',brandAccent:'red'},{brandPalette:'forest',brandAccent:'#123456'},{brandPalette:'forest',javascript:'bad'},{ownerLockedElements:['x','x']}])assert.equal(publicAppAppearance(look).ok,false);
for(const [look,change] of [
 [{brandPalette:'custom',brandAccent:'#123456'},{kind:'appearance',field:'brandPalette',value:'forest'}],
 [{brandPalette:'custom',brandAccent:'#123456'},{kind:'appearance',field:'brandAccent',value:'#ABCDEF'}],
 [{brandPalette:'forest'},{kind:'appearance',field:'brandAccent',value:'#ABCDEF'}]
]){
 const original={...config,presentation:look};
 const forward=propose(original,[change]);assert.ok(forward.ok);
 const undo=propose(forward.nextConfig,forward.undoOperations);assert.ok(undo.ok,undo.reason);assert.deepEqual(undo.nextConfig,original);
}
const source=readFileSync('standalone/template/App.js','utf8');parse(source,{sourceType:'module',plugins:['jsx']});assert.ok(source.includes('measuredFrameWidth||viewport.width'));assert.ok(source.includes('setMeasuredFrameWidth(width)'));assert.ok(source.includes('minHeight:multiline?92:48'));
console.log('PASS: custom branding and locked-draft standalone handoff, immutable navigation, private metadata exclusion, exact brand undo and measured native frame wiring. No signed/native device build.');
