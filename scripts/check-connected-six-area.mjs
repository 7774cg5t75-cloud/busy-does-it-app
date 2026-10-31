import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {readFileSync} from 'node:fs';
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs'),rt=createRuntime({environment:'isolated-staging'});
const {createConnectedApplicationRuntime}=rt.load('src/staging/connectedApplicationRuntime.mjs'),{default:App}=rt.load('src/app/AppController.js'),{screens}=rt.load('src/screens/index.js');
const B='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',O='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const inspector={configured:true,signedIn:true,sessionVersion:1,requestConnected:async()=>{throw Error('No transport in component fixture');}},basis={actorId:O,businessId:B,revision:1,profileRevision:1,websiteDraft:null,profile:{businessName:'Fictional Garden',businessType:'Gardening',services:[{id:'lawns',name:'Lawn care',description:'Cut and tidy lawns.'}],contact:{email:'garden@example.invalid'}}};
const runtime=createConnectedApplicationRuntime({environment:'isolated-staging',inspector,basis,appStatus:{app:null,catalog:[],requests:[]}}),props={connectedRuntime:runtime};
rt.render(App,props);rt.effects.find(f=>String(f).includes('setHydrated(true)'))();rt.effects.find(f=>String(f).includes('rawSession'))();await new Promise(r=>setImmediate(r));
const walk=x=>Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?[x,...walk(x.props?.children)]:[],screen=x=>walk(x).find(n=>n.props?.s);
let tree=rt.render(App,props),s=rt.appState;assert.equal(s.businessName,'Fictional Garden');assert.equal(s.ownerSession.userId,O);assert.equal(s.ownerSession.accessToken,undefined);assert.equal(s.cloudWorkspace.businessId,B);assert.equal(s.customers.length,0);assert.equal(s.screen,'home');assert.equal(screen(tree).type,screens.home);
for(const route of ['websiteBuilder','miniAppBuilder','socialMedia','growthCommandCentre','workHub','settings']){
 assert.ok(screens[route]);s.go(route);tree=rt.render(App,props);s=rt.appState;assert.equal(s.screen,route);assert.equal(screen(tree).type,screens[route]);
}
const {HomeCoreAreas}=rt.load('src/components/HomeCoreAreas.js');let tools=rt.render(HomeCoreAreas,{s});const choices=walk(tools).filter(n=>n.type==='Pressable');assert.equal(choices.length,6);choices.find(n=>n.props.accessibilityLabel==='Get Paid').props.onPress();tools=rt.render(HomeCoreAreas,{s});assert.ok(JSON.stringify(tools).includes('Get Paid · available now'),'Original honest Get Paid disclosure remains available; no fake payment route');
assert.equal(rt.load('src/staging/connectedApplicationRuntime.mjs').connectedTransportRestricted(),true);const core=rt.load('src/core/runtime.js');await assert.rejects(()=>core.fetchWithTimeout('https://production.invalid',{}),/not connected/);
inspector.sessionVersion++;assert.equal(runtime.active,false,'Changing the verified session invalidates the mounted owner scope before another render');
runtime.dispose();assert.equal(rt.load('src/staging/connectedApplicationRuntime.mjs').isConnectedApplicationRuntime(runtime),false);
assert.throws(()=>createConnectedApplicationRuntime({environment:'owner-preview',inspector,basis}),/Verify/);
const text=readFileSync('src/app/AppController.js','utf8');assert.ok(text.includes('connected?[]:customerSeed'));assert.ok(!text.includes('accessToken:connected'));console.log('PASS actual original AppController boots verified staging context, original registered area routes, no bearer token or seeded customers, denied legacy transport and disposed capability; inert component fixture, not native/hosted acceptance.');
