import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {prepareConnectedBusinessWork} from '../src/core/connectedBusinessPreparation.mjs';
import {continueConnectedBusinessEditor} from '../src/core/connectedEditorContinuation.mjs';
import {processBrowserBusinessPhoto} from '../src/core/browserBusinessPhotoProcessor.mjs';
import {responsivePhotoAttributes} from '../supabase/functions/busy-website-worker/websiteResponsivePhotos.mjs';
import {introductionFixture} from './check-business-introduction.mjs';
const walk=x=>Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?[x,...walk(x.props?.children)]:[];
for(let i=0;i<3;i++){
 const c=introductionFixture(i),basis={actorId:c.ownerId,businessId:c.businessId,revision:1,profileRevision:1,profileHash:'a'.repeat(64),websiteDraft:c.website,websiteDraftHash:'b'.repeat(64),profile:c.profile},scope={};let reads=0,prepared=0;
 const s={ownerSession:{userId:c.ownerId},cloudWorkspace:{businessId:c.businessId,role:'owner'},ownerWorkspaceScope:scope,businessCreationIntelligence:{sharedProfile:{...c.profile,businessId:c.businessId,fingerprint:basis.profileHash,email:c.profile.contact?.email||'',phone:c.profile.contact?.phone||'',theme:{primary:c.website.theme?.primary}}},websiteDraft:c.website,miniAppsStatus:{catalog:[],app:null},miniAppBuildBrief:'',growthProjectFocus:'',connectedReadProfile:async()=>{reads++;return basis;},setMiniAppBuildBrief:v=>s.miniAppBuildBrief=v,setGrowthProjectFocus:v=>s.growthProjectFocus=v,go:v=>s.screen=v,socialContentActions:{prepare:(...args)=>{prepared++;assert.equal(args[2],'approved-profile');assert.equal(args[3],'business-introduction');return true;}}};
 const review=prepareConnectedBusinessWork({basis,ownerId:c.ownerId,businessId:c.businessId,website:c.website});assert.equal(review.ok,true);
 for(const destination of ['app','content','growth']){const r=await continueConnectedBusinessEditor({review,destination,serviceId:c.profile.services[0].id,getState:()=>s});assert.equal(r.ok,true,r.reason);assert.equal(r.saved,false);assert.equal(r.mediaAttached,false);}
 assert.equal(s.screen,'businessCreationJourney');assert.equal(prepared,1);assert.equal(reads,3);
 s.miniAppBuildBrief='Unfinished owner correction';assert.equal((await continueConnectedBusinessEditor({review,destination:'app',getState:()=>s})).ok,false);assert.equal(s.miniAppBuildBrief,'Unfinished owner correction');
 basis.profileRevision++;assert.equal((await continueConnectedBusinessEditor({review,destination:'content',getState:()=>s})).ok,false);assert.equal(prepared,1);basis.profileRevision--;
 s.cloudWorkspace={businessId:'foreign',role:'owner'};assert.equal((await continueConnectedBusinessEditor({review,destination:'growth',serviceId:c.profile.services[0].id,getState:()=>s})).ok,false);
 // Actual original component callbacks, including old callbacks after account change.
 s.cloudWorkspace={businessId:c.businessId,role:'owner'};s.miniAppBuildBrief='';s.growthProjectFocus='';const rt=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs').createRuntime(),Component=rt.load('src/components/ConnectedBusinessPreparation.js').ConnectedBusinessPreparation,draw=()=>walk(rt.render(Component,{s})),button=label=>draw().find(x=>x.props?.label===label);
 await button('Use my approved business information elsewhere').props.onPress();await button('Continue in App Builder').props.onPress();assert.equal(s.screen,'miniAppBuilder');const old=button('Continue in Content Creator').props.onPress;s.cloudWorkspace={businessId:'foreign',role:'owner'};draw();assert.equal(await old(),false);assert.equal(prepared,1);
}
assert.equal(responsivePhotoAttributes({storagePath:'one'},'https://example.invalid/one.jpg',{'one#640':'javascript:alert(1)'},x=>x),'');assert.ok(responsivePhotoAttributes({storagePath:'one'},'https://example.invalid/one.jpg',{'one#640':'https://example.invalid/one-640.webp'},x=>x,{hero:true}).includes('640w'));
await assert.rejects(()=>processBrowserBusinessPhoto({bytes:new Uint8Array(30),source:{assetId:'a',businessId:'b',ownerId:'o',sha256:'a'.repeat(64)}}));
console.log('PASS three source-bound original editor continuations, actual component navigation, current-source rechecks, private-only/no-media distinction, protected unsaved App goals and stale/foreign callbacks. Real persistence remains in original SQL checks.');
// Actual original inspector transport, pinned endpoint, independent identity and
// business inspection before and after a bounded streamed original read.
{
 const {createStagingAuthInspector,FIXTURES}=await import('../src/staging/stagingAuthInspectorV3131.mjs'),B='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',O='cccccccc-cccc-4ccc-8ccc-cccccccccccc',fixture=FIXTURES.a,bytes=new Uint8Array(20),sha='a'.repeat(64);let revoked=false,oversize=false,reads=0;
 const inspector=createStagingAuthInspector({config:{environment:'isolated-staging',baseUrl:'https://pnjdlogwegnqbsfpcofw.supabase.co',publishableKey:'sb_publishable_0123456789abcdef'},fetchImpl:async(url,options)=>{
  let json=null,status=200;
  if(url.includes('/auth/v1/token'))json={access_token:'synthetic-token-'.repeat(5)};
  else if(url.endsWith('/auth/v1/user'))json={id:O,email:fixture.email};
  else if(url.includes('/busy_staging_rls_canary'))json=options.headers.Authorization&&url.includes(fixture.row)?[{id:fixture.row,owner_id:O,marker:'synthetic'}]:[];
  else if(url.endsWith('/busy_connected_builder_read_v1')){reads++;status=revoked?403:200;json={actorId:O,businessId:B};}
  else if(url.endsWith('/functions/v1/busy-website-original-media')){assert.equal(JSON.parse(options.body).action,'download');assert.equal(options.redirect,'error');return new Response(oversize?new Uint8Array(21):bytes,{headers:{'Content-Type':'image/png','Content-Length':'20','X-Busy-Original-Sha256':sha}});}
  else throw Error('Unapproved transport');return {status,json:async()=>json};
 }});
 await inspector.signIn(fixture.email,'synthetic-not-a-real-password');const meta={state:'eligible',storagePath:B+'/'+O+'/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee.png',contentType:'image/png',byteLength:20,sha256:sha};assert.equal((await inspector.readOriginal({businessId:B,meta})).length,20);assert.equal(reads,2);oversize=true;await assert.rejects(()=>inspector.readOriginal({businessId:B,meta}));oversize=false;
 await assert.rejects(()=>inspector.readOriginal({businessId:'foreign',meta}));revoked=true;await assert.rejects(()=>inspector.readOriginal({businessId:B,meta}));assert.equal(inspector.signedIn,false);
 console.log('PASS actual connected original-media stream read: pinned original endpoint, exact scoped path, size bound, fresh membership before/after, revoked account and foreign reference denial. Auth and Storage transport are synthetic.');
}
