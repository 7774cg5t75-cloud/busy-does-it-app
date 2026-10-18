import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {selectedAppServiceOperation} from '../src/core/appSelectedService.mjs';
import {proposeSelectedAppInstruction} from '../src/core/appContextInstruction.mjs';
import {proposeCoordinatedAppChanges} from '../src/core/appCoordinatedStudio.mjs';
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs');
const rt=createRuntime(),{MiniAppSurface}=rt.load('src/screens/miniApps.js'),{AppVisualSelection}=rt.load('src/screens/appVisualSelection.js'),{AppSelectedServiceControls}=rt.load('src/screens/appSelectedServiceControls.js');
const walk=n=>Array.isArray(n)?n.flatMap(walk):n&&typeof n==='object'?[n,...walk(n.props?.children)]:[];
const find=(t,label)=>walk(t).find(n=>n.props?.label===label||n.props?.accessibilityLabel===label);
const config={modules:['business_profile','services','enquiry','booking_request'].map(key=>({key,enabled:true})),navigation:['business_profile','services','enquiry','booking_request'],publicProfile:{businessName:'Fictional workshop',services:[{id:'survey',name:'Survey',description:'Owner description.',category:'Planning',priceLabel:'Ask for a quote'},{id:'repair',name:'Repair',description:'Discuss the project.'}]}};
const original=JSON.stringify(config),proposals=[],props={Surface:MiniAppSurface,config,onPrepare:p=>proposals.push(p)};let panel,surface,controls;
function render(){panel=rt.render(AppVisualSelection,props);surface=rt.render(MiniAppSurface,walk(panel).find(n=>n.type===MiniAppSurface).props);const child=walk(panel).find(n=>n.type===AppSelectedServiceControls);controls=child?rt.render(AppSelectedServiceControls,child.props):null;}
render();find(surface,'Edit service Survey').props.onPress();render();find(controls,'Selected service description').props.onChangeText('New owner description.');render();const old=find(controls,'Preview selected service wording');find(controls,'Selected service description').props.onChangeText('More precise owner description.');render();old.props.onPress();assert.equal(proposals.length,0);find(controls,'Preview selected service wording').props.onPress();let p=proposals.at(-1);assert.ok(p);assert.equal(p.nextConfig.publicProfile.services[0].description,'More precise owner description.');assert.equal(p.nextConfig.publicProfile.services[0].id,'survey');assert.equal(p.nextConfig.publicProfile.services[0].priceLabel,'Ask for a quote');assert.deepEqual(JSON.parse(JSON.stringify(p.nextConfig.publicProfile.services[1])),config.publicProfile.services[1]);
find(controls,'Preview service later').props.onPress();assert.equal(proposals.at(-1).nextConfig.publicProfile.services[1].id,'survey');
const selection={part:'service',index:0,expectedService:JSON.stringify(config.publicProfile.services[0])};
assert.ok(proposeSelectedAppInstruction(config,{selection,text:'move this service later'}).ok);
assert.ok(proposeSelectedAppInstruction(config,{selection,text:'set this service description to "Discuss your needs first."'}).ok);
assert.equal(proposeSelectedAppInstruction(config,{selection,text:'confirm this booking'}).ok,false);
assert.equal(selectedAppServiceOperation({...config,presentation:{ownerLockedElements:['services']}},selection,{kind:'move',direction:'later'}).ok,false);
assert.equal(selectedAppServiceOperation(config,selection,{kind:'wording',value:{name:'Survey',description:'<script>'}}).ok,false);
assert.equal(selectedAppServiceOperation(config,{...selection,expectedService:'old'},{kind:'move',direction:'later'}).ok,false);
assert.equal(selectedAppServiceOperation(config,selection,{kind:'wording',value:{name:'Repair',description:'Duplicate'}}).ok,false);
const oldPrepare=find(controls,'Preview selected service wording'),count=proposals.length;props.config={...config,publicProfile:{...config.publicProfile,services:[...config.publicProfile.services].reverse()}};render();oldPrepare.props.onPress();assert.equal(proposals.length,count);assert.equal(find(controls,'Preview selected service wording').props.disabled,true);
for(const proposal of proposals){const restored=proposeCoordinatedAppChanges(proposal.nextConfig,proposal.undoOperations);assert.ok(restored.ok,restored.reason);assert.deepEqual(JSON.parse(JSON.stringify(restored.nextConfig)),config);}
const selectedDraft=JSON.parse(JSON.stringify(proposals[0].nextConfig)),actions=[];const publicTree=rt.render(MiniAppSurface,{config:selectedDraft,interactive:true,onSelectService:(...args)=>actions.push(args)});assert.equal(find(publicTree,'Edit service Survey'),undefined);find(publicTree,'Ask about Survey').props.onPress();find(publicTree,'Request Survey').props.onPress();assert.deepEqual(actions,[['Survey','enquiry'],['Survey','booking_request']]);
assert.equal(JSON.stringify(config),original);
console.log('PASS original service selection -> scoped wording/order -> Studio proposals, locks, stale callback/source rejection, JSON reload, exact Undo and public enquiry/request actions. Inert native/IO boundaries; no device/hosted claim.');
