import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createConnectedBuilderSession} from '../src/staging/connectedBuilderSession.mjs';
import {privateWebsiteDraftAction} from '../supabase/functions/busy-website-publish/privateDraftService.mjs';
import {createStagingAuthInspector} from '../src/staging/stagingAuthInspectorV3131.mjs';
import {readFileSync} from 'node:fs';
const B='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',O='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
let basis={actorId:O,businessId:B,revision:1,websiteDraft:null,profileRevision:4,profile:{businessName:'Fictional Garden',businessType:'Gardening',services:[{id:'lawns',name:'Lawn care',description:'Cut and tidy lawns.'}],contact:{email:'garden@example.invalid'}}};
let writes=0,lost=false;
const request=async(action,payload)=>{
 if(action==='builder_read')return structuredClone(basis);
 return privateWebsiteDraftAction({action,body:payload,userId:O,read:async()=>structuredClone(basis),commit:async p=>{writes++;assert.equal(p.p_expected_revision,basis.revision);basis={...basis,websiteDraft:p.p_candidate,websiteDraftHash:createHash('sha256').update(JSON.stringify(p.p_candidate)).digest('hex'),revision:basis.revision+1};if(lost)throw Error('Acknowledgement lost');return {ok:true,actorId:O,businessId:B,previousRevision:p.p_expected_revision,revision:basis.revision,draftId:basis.websiteDraft.id,generation:basis.websiteDraft.generation,recordHash:basis.websiteDraftHash,privateOnly:true};}});
};
const session=createConnectedBuilderSession({request});let opened=await session.open(B);
const created=await session.website({basis:opened,action:'create',sourceRevision:4,ownerApproved:true});assert.equal(created.ok,true);assert.equal(created.observed.websiteDraft.businessName,'Fictional Garden');assert.ok(created.observed.websiteDraft.sections.some(s=>s.id==='services'));assert.equal(created.observed.websiteDraft.html,undefined);
opened=created.observed;lost=true;const uncertain=await session.website({basis:opened,action:'edit_text',patch:{sectionId:'hero',field:'title',value:'Exact owner wording'},ownerApproved:true});assert.equal(uncertain.unknown,true);assert.equal(uncertain.observed.websiteDraft.sections[0].title,'Exact owner wording');await assert.rejects(()=>session.website({basis:opened,action:'edit_text',ownerApproved:true}));assert.equal(writes,2);assert.equal((await session.reconcile()).notOwnReceipt,true);
await assert.rejects(()=>privateWebsiteDraftAction({action:'website_edit_text',body:{businessId:B,ownerApproved:true,expectedRevision:1,expectedDraft:null},userId:O,read:async()=>basis,commit:()=>{throw Error('Must not write');}}),/changed/);
// An old business response cannot populate a newly selected workspace.
let finish;const delayed=createConnectedBuilderSession({request:()=>new Promise(r=>finish=r)});const pending=delayed.open(B);delayed.clear();finish(basis);await assert.rejects(()=>pending,/changed/);
// Actual original Auth inspector is still fail-closed and never returns a token.
let calls=[];const inspector=createStagingAuthInspector({config:{environment:'owner-preview',baseUrl:'https://pnjdlogwegnqbsfpcofw.supabase.co',publishableKey:'sb_publishable_0123456789abcdef'},fetchImpl:async(...a)=>{calls.push(a);throw Error('No network');}});await assert.rejects(()=>inspector.requestConnected('workspaces'),/configured/);assert.equal(calls.length,0);
const ui=readFileSync(new URL('../src/staging/ConnectedBuilderWorkspace.js',import.meta.url),'utf8');for(const name of ['WebsiteContentEditor','MiniAppSurface','AppEnquiryJourneyEditor','executeGoalToPrivateApp','executePrivateAppBatch','Undo last confirmed'])assert.ok(ui.includes(name));assert.ok(ui.includes('default-src &#39;none&#39;'));
const sql=readFileSync(new URL('../docs/sql-proposals/connected-builders/contracts.sql',import.meta.url),'utf8');assert.ok(sql.includes('CONNECTED BUILDERS REVIEW FUSE'));assert.ok(sql.includes("jsonb_set(payload,'{websiteDraft}'"));assert.ok(sql.includes('TO service_role'));assert.ok(!sql.includes('CREATE TABLE'));
console.log('PASS connected original website generation/edit/save/readback, lost acknowledgement/no replay, scoped invalidation, staged original builder/Studio/Undo composition and offline denial. Fictional deterministic boundaries; not hosted acceptance.');
// Real inspector code, fictional Auth/REST transport: membership is mandatory,
// email merely selects the existing fictional account and never authorises it.
const fixture=(await import('../src/staging/stagingAuthInspectorV3131.mjs')).FIXTURES.a;
let revoked=false,identityReads=0,urls=[];
const connected=createStagingAuthInspector({config:{environment:'isolated-staging',baseUrl:'https://pnjdlogwegnqbsfpcofw.supabase.co',publishableKey:'sb_publishable_0123456789abcdef'},fetchImpl:async(url,options)=>{
 urls.push(url);let json=null,status=200;
 if(url.includes('/auth/v1/token'))json={access_token:'fictional-token-'.repeat(5)};
 else if(url.endsWith('/auth/v1/user')){identityReads++;json={id:O,email:fixture.email};}
 else if(url.includes('/busy_staging_rls_canary'))json=options.headers.Authorization&&url.includes(fixture.row)?[{id:fixture.row,owner_id:O,marker:'fictional'}]:[];
 else if(url.endsWith('/busy_connected_workspaces_v1'))json={actorId:O,items:[{businessId:B,businessName:'Fictional Garden',role:'owner'}]};
 else if(url.endsWith('/busy_connected_builder_read_v1')){status=revoked?403:200;json=revoked?{}:basis;}
 else throw Error('Unapproved transport path');
 return {status,json:async()=>json};
}});
await connected.signIn(fixture.email,'fictional-test-password');const initialIdentity=identityReads;
const workspaces=await connected.requestConnected('workspaces');assert.equal(workspaces.actorId,O);assert.equal(identityReads,initialIdentity+1);assert.equal('accessToken' in workspaces,false);
await connected.requestConnected('builder_read',{businessId:B});assert.equal(identityReads,initialIdentity+2);
await assert.rejects(()=>connected.requestConnected('publish',{businessId:B}));
revoked=true;await assert.rejects(()=>connected.requestConnected('builder_read',{businessId:B}),/unavailable/);assert.equal(connected.signedIn,false);
assert.ok(urls.every(u=>u.startsWith('https://pnjdlogwegnqbsfpcofw.supabase.co/')));
console.log('PASS original inspector connected-request allowlist, repeated server identity, membership revocation clearing and no production transport.');
// Mount the actual integration entry and inspect its original child contracts.
const {createRuntime}=await import('./lib/offline-component-runtime.cjs');
const rt=createRuntime(),{ConnectedBuilderWorkspace}=rt.load('src/staging/ConnectedBuilderWorkspace.js');
const requests=[];const uiInspector={signedIn:true,requestConnected:async(a,p)=>{requests.push([a,p]);if(a==='workspaces')return {actorId:O,items:[{businessId:B,businessName:'Fictional Garden',role:'owner'}]};if(a==='initialize'){assert.equal(p.businessId,B);return basis;}if(a==='builder_read')return basis;if(a==='owner_status')return {app:null,catalog:[]};throw Error('Unexpected route');}};
const walk=x=>Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?[x,...walk(x.props?.children)]:[];
let tree=rt.render(ConnectedBuilderWorkspace,{inspector:uiInspector,onClose:()=>{}});const cleanup=rt.effects[0]();await new Promise(r=>setImmediate(r));
tree=rt.render(ConnectedBuilderWorkspace,{inspector:uiInspector,onClose:()=>{}});walk(tree).find(n=>n.props?.label==='Open Fictional Garden').props.onPress();await new Promise(r=>setImmediate(r));tree=rt.render(ConnectedBuilderWorkspace,{inspector:uiInspector,onClose:()=>{}});
const originalEditor=rt.load('src/screens/websiteContentEditor.js').WebsiteContentEditor;const editor=walk(tree).find(n=>n.type===originalEditor);assert.ok(editor);assert.equal(editor.props.draft.id,basis.websiteDraft.id);assert.equal(editor.props.ownerState.ownerSession.userId,O);assert.ok(requests.some(([a])=>a==='owner_status'));assert.deepEqual(requests.map(([a])=>a),['workspaces','initialize','builder_read','owner_status']);cleanup();
console.log('PASS actual staging workbench mounts original website editor with verified scope, current account draft and original app-status read. No hosted transport.');
let delayedIdentity,logins=0;
const raced=createStagingAuthInspector({config:{environment:'isolated-staging',baseUrl:'https://pnjdlogwegnqbsfpcofw.supabase.co',publishableKey:'sb_publishable_0123456789abcdef'},fetchImpl:async(url,options)=>{
 if(url.includes('/auth/v1/token'))return {status:200,json:async()=>({access_token:'fictional-access-token-'+(++logins)+'-'.repeat(40)})};
 if(url.endsWith('/auth/v1/user')){if(options.headers.Authorization.includes('token-1-'))await new Promise(r=>delayedIdentity=r);return {status:200,json:async()=>({id:O,email:fixture.email})};}
 if(url.includes('/busy_staging_rls_canary'))return {status:200,json:async()=>options.headers.Authorization&&url.includes(fixture.row)?[{id:fixture.row,owner_id:O,marker:'fictional'}]:[]};
 throw Error('Unexpected transport');
}});
const obsolete=raced.signIn(fixture.email,'fictional-password');await new Promise(r=>setImmediate(r));await raced.signIn(fixture.email,'fictional-password');delayedIdentity();await assert.rejects(()=>obsolete,/cancelled/);assert.equal(raced.signedIn,true,'Late old login must not clear the newer verified session');raced.clearLocal();
console.log('PASS obsolete authentication callback cannot invalidate a newer verified owner session.');
