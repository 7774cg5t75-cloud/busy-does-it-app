import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs');
for(const width of [320,820]){
 const runtime=createRuntime({width});const App=runtime.load('src/app/AppController.js').default;
 const tree=runtime.render(App);assert.ok(tree?.type);assert.ok(runtime.modules>100);assert.ok(runtime.effects.length>0);
 const recoveryAction=runtime.appState.exportBusinessCacheRecovery;runtime.render(App);assert.equal(runtime.appState.exportBusinessCacheRecovery,recoveryAction,'preserve duplicate guard across actual App rerenders');
 const businessId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 const config={modules:['business_profile','services','gallery','contact'].map(key=>({key,enabled:true})),navigation:['business_profile','services','gallery','contact'],publicProfile:{businessName:'Fixture owner',about:'Owner facts',services:[{name:'Consultation',description:'Owner service'}],assets:{gallery:[]}},presentation:{headerStyle:'refined'}};
 const app={id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',business_id:businessId,draft_revision:4,draft_config:config};
 const s={...runtime.appState,ownerSession:{userId:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',accessToken:'fixture'},cloudWorkspace:{businessId},miniAppsView:{...runtime.appState.miniAppsView,app,draftConfig:config,catalog:[],role:'owner'}};
 const Builder=runtime.load('src/screens/miniApps.js').MiniAppBuilder;
 let builder=runtime.render(Builder,{s});assert.ok(builder);
 const walk=node=>Array.isArray(node)?node.flatMap(walk):node&&typeof node==='object'?[node,...walk(node.props?.children)]:[];
 const voice=walk(builder).find(n=>n.props?.label==='🎙 Talk to BUSY about this selected app part');assert.ok(voice);voice.props.onPress();builder=runtime.render(Builder,{s});
 const selected=walk(builder).find(n=>n.props?.editorKind==='app'&&n.props?.contextLabel==='selected app design');assert.ok(selected);assert.equal(selected.props.selection.selectedPart,'header');
 console.log('PASS: actual App initial component body at '+width+' logical points; '+runtime.modules+' actual local modules, inert native/hooks boundary, effects and all IO unexecuted.');
}
