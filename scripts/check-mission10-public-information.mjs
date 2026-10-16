import assert from 'node:assert/strict';
import fs from 'node:fs';
import {proposeCoordinatedAppChanges as plan} from '../src/core/appCoordinatedStudio.mjs';
import {validPublicCollection,publicCollection} from '../src/core/appPublicCollections.mjs';
import {retainAppDraftDesign,appConfigLockReason} from '../src/core/appDraftComposition.mjs';
import {publicNativeMiniAppProjection as project} from '../supabase/functions/busy-mini-app-guest/publicNativeProjection.mjs';
const base={modules:[{key:'business_profile',enabled:true}],navigation:['business_profile'],publicProfile:{about:'Keep'}};
for(const [field,value] of [['faqs',[{id:'one',question:'Can I change my request?',answer:'Contact us before work starts.'}]],['testimonials',[{attribution:'A customer',text:'Genuine owner-approved wording.'}]]]){
 for(const profile of [undefined,null,{},base.publicProfile]){
  const config={...base};if(profile===undefined)delete config.publicProfile;else config.publicProfile=profile;
  const p=plan(config,[{kind:'public_collection',field,value}]);assert.equal(p.ok,true,p.reason);
  const undo=plan(p.nextConfig,p.undoOperations);assert.equal(undo.ok,true,undo.reason);assert.deepEqual(undo.nextConfig,config);
  const refreshed=retainAppDraftDesign(p.nextConfig,base);assert.deepEqual(refreshed.nextConfig.publicProfile[field],value);
  for(const lock of ['all','copy','business_profile',field,...field==='faqs'?['faq']:[]])assert.equal(plan({...config,presentation:{ownerLockedElements:[lock]}},[{kind:'public_collection',field,value}]).ok,false);
  assert.ok(appConfigLockReason({...p.nextConfig,presentation:{ownerLockedElements:[field]}},{...base,presentation:{ownerLockedElements:[field]}}));
 }
 assert.equal(validPublicCollection(field,[...value,...Array(21).fill(value[0])]),false);
 assert.deepEqual(publicCollection(field,[{...value[0],privateNotes:'secret'}]),[]);
 assert.equal(validPublicCollection(field,[{...value[0],[field==='faqs'?'answer':'text']:'<script>x</script>'}]),false);
}
assert.equal(validPublicCollection('faqs',[{question:'Same',answer:'A'},{question:' same ',answer:'B'}]),false);
const app={id:'a',status:'live',public_slug:'test-app',current_live_version_id:'v'};
const version={id:'v',config:{...base,publicProfile:{...base.publicProfile,faqs:[{question:'Q?',answer:'A.'}],testimonials:[{attribution:'Owner-approved',text:'Real quote'}],privateNotes:'never public'}}};
const pub=project(app,version,{expectedAppId:'a',expectedVersionId:'v'});assert.equal(pub.faqs[0].answer,'A.');assert.equal(pub.testimonials[0].text,'Real quote');assert.equal(JSON.stringify(pub).includes('never public'),false);
assert.equal(project({...app,status:'draft'},version,{expectedAppId:'a',expectedVersionId:'v'}).ok,false);
for(const file of ['appPublicCollections.mjs','appProfileFieldUndo.mjs','appCoordinatedStudio.mjs','appOwnerLocks.mjs','appDraftComposition.mjs'])assert.equal(fs.readFileSync('src/core/'+file,'utf8'),fs.readFileSync('supabase/functions/busy-mini-apps/'+file,'utf8'));
console.log('PASS: FAQs/testimonials exact sparse Undo, locks, rebuild retention, bounded public allowlist, immutable live-only projection and trusted parity.');

import {createRequire} from 'node:module';
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs');
const runtime=createRuntime({width:390});const build=runtime.load('src/domain/websiteBuilder.js').buildWebsiteDraft;
const previous={id:'site',generation:2,sections:[{id:'testimonials',type:'testimonials',enabled:true,title:'Customers',items:[{id:'mine',title:'Permissioned owner attribution',body:'Owner wording'}],ownerEditedItems:true}],theme:{},status:'draft'};
const regenerated=build({brandBrain:{websiteBrief:{businessName:'Fixture',testimonials:[{attribution:'New business fact',text:'Different text'}]}},previousDraft:previous});assert.equal(regenerated.sections.find(x=>x.id==='testimonials').items[0].body,'Owner wording');
const Editor=runtime.load('src/screens/appPublicCollectionEditor.js').AppPublicCollectionEditor;
const config={modules:[{key:'business_profile',enabled:true}],navigation:['business_profile'],publicProfile:{faqs:[]}};
const walk=n=>Array.isArray(n)?n.flatMap(walk):n&&typeof n==='object'?[n,...walk(n.props?.children)]:[];
let prepared=null,notice='';const props={config,onPreview:p=>{prepared=p;return true;},onNotice:v=>notice=v,busy:false};
let tree=runtime.render(Editor,props);walk(tree).find(n=>n.props?.label==='Edit customer questions and answers').props.onPress();
tree=runtime.render(Editor,props);walk(tree).find(n=>n.props?.label==='Question').props.onChangeText('Can I request a quote?');walk(tree).find(n=>n.props?.label==='Answer').props.onChangeText('Send an enquiry and we will review it.');
tree=runtime.render(Editor,props);walk(tree).find(n=>n.props?.label==='Preview public information entry').props.onPress();assert.equal(prepared.nextConfig.publicProfile.faqs[0].question,'Can I request a quote?');assert.match(notice,/Studio/);
console.log('PASS actual owner collection editor prepares Studio operation and actual Website rebuild retains owner testimonial collection. Inert React/native boundary.');
// Execute the actual trusted CAS handler with a bounded database fixture.
import vm from 'node:vm';
const {transformSync}=createRequire(import.meta.url)('@babel/core');
const edge=fs.readFileSync('supabase/functions/busy-mini-apps/index.ts','utf8');
const start=edge.indexOf('async function applyCoordinatedPrivateAppEdits('),end=edge.indexOf('\nasync function ',start+20);
const handlerCode=transformSync(edge.slice(start,end),{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-typescript']}).code;
const predicates=[];let savedConfig=null,concurrent=false;
const trustedApp={id:'app',draft_revision:4,draft_config:base};
const handler=vm.runInNewContext('(function(){'+handlerCode+';return applyCoordinatedPrivateAppEdits})()',{
 appForBusiness:async()=>trustedApp,proposeCoordinatedAppChanges:plan,Error,Date,Number,
 supabase:{from:table=>{assert.equal(table,'busy_mini_apps');const chain={update:data=>{savedConfig=data;return chain;},eq:(field,value)=>{predicates.push([field,value]);return chain;},select:()=>chain,maybeSingle:async()=>({data:concurrent?null:{...trustedApp,...savedConfig},error:null})};return chain;}}
});
const input={appId:'app',expectedRevision:4,ownerApproved:true,operations:[{kind:'public_collection',field:'faqs',value:[{question:'Safe?',answer:'Yes, privately reviewed.'}]}]};
const receipt=await handler('business',input);assert.equal(receipt.privateOnly,true);assert.equal(receipt.neverPublishes,true);assert.equal(receipt.app.draft_config.publicProfile.faqs[0].question,'Safe?');assert.deepEqual(predicates,[['id','app'],['business_id','business'],['draft_revision',4]]);
await assert.rejects(()=>handler('business',{...input,ownerApproved:false}));await assert.rejects(()=>handler('business',{...input,expectedRevision:3}));concurrent=true;await assert.rejects(()=>handler('business',input));
console.log('PASS actual trusted App batch handler: owner approval, exact App/business/revision predicates, finite collection edit, private receipt and raced-write rejection. Database fixture, not hosted RLS proof.');
