import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {wholeAppStagingPackage} from './lib/whole-app-staging-package.mjs';
import {connectedAccountRoutes} from '../src/staging/connectedAccountRoutes.mjs';
import {runConnectedAcceptance} from './lib/connected-hosted-acceptance.mjs';
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs');
const B='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',O='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const walk=x=>Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?[x,...walk(x.props?.children)]:[],tick=()=>new Promise(r=>setImmediate(r));
let cases=0;
for(const width of [320,393,430])for(const fontScale of [1,2.8])for(const mode of ['midnight','daylight']){
 const rt=createRuntime({width,fontScale}),appearance=rt.load('src/theme/appearance.mjs');await appearance.updateAppearance({mode},async()=>{});
 const {ConnectedBusinessFacts}=rt.load('src/components/ConnectedBusinessFacts.js');
 const original={actorId:O,businessId:B,revision:1,profileRevision:1,profile:{businessName:'Fictional account',services:[],description:'Original facts'}},scope={};let saves=0,dirty=false,release,observations=0;
 const s={ownerSession:{userId:O},cloudWorkspace:{businessId:B},ownerWorkspaceScope:scope,setOwnerEditDirty:r=>{dirty=r.dirty;},connectedReadProfile:async()=>{observations++;return original;},connectedSaveProfile:async({profile})=>{saves++;assert.equal(profile.businessName,'Deliberate owner words');return {ok:false,unknown:true};}};
 const render=()=>rt.render(ConnectedBusinessFacts,{s}),button=(tree,label)=>walk(tree).find(x=>x.props?.label===label),field=(tree,label)=>walk(tree).find(x=>x.props?.label===label);
 let tree=render();await button(tree,'Open approved business details').props.onPress();tree=render();assert.equal(field(tree,'Approved business name').props.value,'Fictional account');
 field(tree,'Approved business name').props.onChangeText('Deliberate owner words');tree=render();rt.effects.at(-1)();assert.equal(dirty,true);
 const toolbar=walk(tree).find(x=>x.props?.actions);assert.equal(toolbar.props.actions[0].disabled,false);await toolbar.props.actions[0].onPress();tree=render();assert.equal(saves,1);assert.equal(walk(tree).find(x=>x.props?.actions).props.actions[0].disabled,true);
 await button(tree,'Inspect account without replacing my words').props.onPress();tree=render();assert.equal(field(tree,'Approved business name').props.value,'Deliberate owner words');assert.ok(button(tree,'Review my words against this account revision'));button(tree,'Review my words against this account revision').props.onPress();tree=render();assert.equal(field(tree,'Approved business name').props.value,'Deliberate owner words');assert.equal(walk(tree).find(x=>x.props?.actions).props.actions[0].disabled,false);assert.equal(observations,2);
 // A prior owner's pending read cannot populate the replacement account.
 s.connectedReadProfile=()=>new Promise(r=>release=r);field(tree,'Approved business name').props.onChangeText('Fictional account');tree=render();const inFlight=button(tree,'Open approved business details').props.onPress();await tick();s.ownerSession={userId:'dddddddd-dddd-4ddd-8ddd-dddddddddddd'};render();release({...original,profile:{businessName:'Must not enter replacement scope'}});await inFlight;assert.notEqual(field(render(),'Approved business name').props.value,'Must not enter replacement scope');cases++;
}
{
 const rt=createRuntime(),{createConnectedApplicationRuntime}=rt.load('src/staging/connectedApplicationRuntime.mjs');let release;const calls=[];
 const inspector={configured:true,signedIn:true,sessionVersion:1,requestConnected:async(a,p)=>{calls.push([a,p]);if(a==='creator_list'&&release===undefined)return {ownerId:O,businessId:B,notOwnReceipt:true,items:[],nextAfter:null};if(a==='growth_list')return {ownerId:O,businessId:B,notOwnReceipt:true,items:[],nextAfter:null};return new Promise(r=>release=r);}};
 const runtime=createConnectedApplicationRuntime({environment:'isolated-staging',inspector,basis:{actorId:O,businessId:B,revision:1,profile:{businessName:'Fictional account'}}}),s={};const first=runtime.project(s),again=runtime.project(s);assert.equal(first.creatorDraftAccount,again.creatorDraftAccount);assert.equal(first.growthOpportunityAccount,again.growthOpportunityAccount);
 assert.equal((await first.creatorDraftAccount.list()).items.length,0);await first.growthOpportunityAccount.list();assert.equal(calls[0][0],'creator_list');assert.equal(calls[0][1].businessId,B);assert.equal(calls[1][0],'growth_list');
 // Ordinary rerenders retain original clients; session transitions reject them.
 inspector.sessionVersion++;await assert.rejects(()=>first.creatorDraftAccount.list(),/scope|disabled/i);assert.equal(calls.length,2);runtime.dispose();assert.equal(runtime.active,false);
}
const proposal=wholeAppStagingPackage(process.cwd());assert.equal(proposal.targetProject,'pnjdlogwegnqbsfpcofw');assert.equal(proposal.activationReady,false);assert.equal(proposal.serverSwitchEnabled,false);assert.equal(proposal.productionSchemaCapture,false);assert.equal(proposal.sourceCandidates.length,21);assert.ok(proposal.supplements.length>20);assert.match(proposal.sql,/WHOLE APP STAGING REVIEW FUSE/);assert.match(proposal.rollback,/WHOLE APP ROLLBACK REVIEW FUSE/);assert.ok(!proposal.rollback.includes('DROP TABLE'));assert.ok(!proposal.retainedReaders.some(n=>/profile_write|creator_draft_write|growth_opportunity_write/.test(n)));
assert.equal(readFileSync('docs/sql-proposals/connected-builders/whole-app-review/install.sql','utf8'),proposal.sql);assert.equal(readFileSync('docs/sql-proposals/connected-builders/whole-app-review/rollback-readonly.sql','utf8'),proposal.rollback);
assert.equal(connectedAccountRoutes.creator_write[0],'busy_creator_draft_write_v1');assert.equal(connectedAccountRoutes.growth_write[0],'busy_growth_opportunity_write_v1');assert.equal(connectedAccountRoutes.media_review,undefined);assert.equal(connectedAccountRoutes.any_rpc,undefined);
let requests=0;const blocked=await runConnectedAcceptance({}, {sourceSha:'a'.repeat(40),fetchImpl:()=>{requests++;throw Error('Forbidden');}});assert.equal(blocked.status,'blocked');assert.equal(requests,0);
for(const file of ['src/components/ConnectedBusinessFacts.js','src/screens/brandIdentity.js','src/staging/ConnectedBuilderWorkspace.js'])assert.ok(readFileSync(file,'utf8').includes('ConnectedBusinessFacts'));
console.log('PASS '+cases+' actual business-facts component width/font/palette cases, dirty wording and unknown-outcome review, replaced-owner stale callback, stable original Creator/Growth bindings and revoked-session denial; fused exact source package, blocked hosted harness. Inert components, no native render or hosted Auth.');
