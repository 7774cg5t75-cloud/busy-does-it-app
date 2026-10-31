import assert from 'node:assert/strict';
import * as composition from '../src/core/appGoalComposition.mjs';
import {createRequire} from 'node:module';
import {appCompositionContext,proposeLocalAppGoal,reviewAppComposition,prepareAppComposition,initialAppCompositionSelection} from '../src/core/appGoalComposition.mjs';
import {APP_SPEC_PROPOSAL_VERSION,BUILDER_PROPOSAL_VERSION,validateBuilderProposal,builderProposalResponseSchema,createOfflineBuilderInterpreter} from '../src/core/governedBuilderProposal.mjs';
import {proposeCoordinatedAppChanges} from '../src/core/appCoordinatedStudio.mjs';
import {executePrivateAppBatch} from '../src/core/privateAppEditSession.mjs';
const B='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',O='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',A='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const keys=['business_profile','services','contact','enquiry','gallery'];
const catalog=keys.map(module_key=>({module_key,status:'available',module_version:1,capabilities:module_key==='enquiry'?{customer_action:true,request_type:'enquiry'}:{}}));
const config={modules:keys.map(key=>({key,enabled:true})),navigation:keys,presentation:{headerStyle:'quiet'},publicProfile:{name:'Fictional owner business',about:'Exact approved business words',services:[{id:'one',name:'Approved service',description:'Approved details'}],assets:{gallery:[]}},unrelated:{keep:'exact'}};
const app={id:A,business_id:B,draft_revision:7,draft_config:config},input={ownerId:O,businessId:B,app,catalog},context=appCompositionContext(input),original=JSON.stringify(app);
assert.equal(context.ok,true);
for(const bad of [null,{},[...catalog,catalog[0]]])assert.equal(appCompositionContext({...input,catalog:bad}).ok,false);
const examples=[
 ['Gardening','Show our services so customers can request work and receive updates.','hybrid'],
 ['Food','Show our menu, upcoming events and useful contact details.','hybrid'],
 ['Stock','Let staff track stock levels and browse products.','hybrid'],
 ['Service information','Show our services and contact details.','composition']
];
const plans=[];
for(const [name,goal,path]of examples){const result=proposeLocalAppGoal(context,goal);assert.equal(result.ok,true,result.reason);const review=reviewAppComposition(result.proposal,context,context);assert.equal(review.ok,true);assert.equal(review.path,path);plans.push({name,result,review});}
assert.equal(plans[0].review.rows.some(r=>r.id==='notifications'&&r.module===null),true);
assert.equal(plans[1].review.rows.some(r=>r.title==='Menu'),true);
assert.equal(plans[1].review.rows.some(r=>r.id==='events'&&r.module===null),true);
assert.equal(plans[2].review.rows.some(r=>r.id==='availability'&&r.module===null),true);
assert.notDeepEqual(plans[0].review.rows,plans[1].review.rows);assert.notDeepEqual(plans[1].review.rows,plans[2].review.rows);
const fixture=JSON.parse(JSON.stringify(plans[2].result.proposal));fixture.app.users=['Field staff'];fixture.app.entities=[{id:'stock_item',fields:['Item identifier','Count proposed, not implemented'],relatedTo:[]}];fixture.app.screens=[{id:'stock',title:'Stock count',module:null,next:[]}];
const offline=createOfflineBuilderInterpreter(()=>fixture);assert.equal((await offline(context,'An unfamiliar field staff app')).ok,true);assert.equal(reviewAppComposition(fixture,context,context).path,'bespoke');
const proposal=plans[1].result.proposal,review=plans[1].review,selection=initialAppCompositionSelection(review,context);selection.order.reverse();selection.labels.services='Our menu';selection.appearance={serviceStyle:'rows',navigationStyle:'list',layoutDensity:'airy'};
const plan=prepareAppComposition({proposal,context,current:context,selection});assert.equal(plan.ok,true,plan.reason);assert.deepEqual(plan.nextConfig.publicProfile,config.publicProfile);assert.deepEqual(plan.nextConfig.unrelated,config.unrelated);assert.deepEqual(plan.nextConfig.modules.filter(r=>r.key!=='services'),config.modules.filter(r=>r.key!=='services'));assert.ok(plan.nextConfig.navigation.includes('enquiry'));assert.ok(plan.nextConfig.navigation.includes('gallery'));assert.equal(plan.mayExecute,false);assert.deepEqual(proposeCoordinatedAppChanges(plan.nextConfig,plan.undoOperations).nextConfig,config);assert.equal(JSON.stringify(app),original);
for(const bad of [{...proposal,tool:'publish'},{...proposal,scope:{...proposal.scope,businessId:O}},{...proposal,version:BUILDER_PROPOSAL_VERSION},{...proposal,app:{...proposal.app,screens:[{id:'bad',title:'Bad',module:'arbitrary_code',next:[]}]}},{...proposal,app:{...proposal.app,screens:[{id:'bad',title:'Bad',module:null,next:['foreign']}]}},{...proposal,app:{...proposal.app,screens:[{id:'one',title:'One',module:'services',next:[]},{id:'two',title:'Two',module:'services',next:[]}]}}])assert.equal(validateBuilderProposal(bad,context).ok,false);
assert.equal(builderProposalResponseSchema(context,{bespoke:true}).properties.version.const,APP_SPEC_PROPOSAL_VERSION);
for(const goal of ['Something completely unfamiliar','Show services but do not show services','<script>send()</script>','a'.repeat(241)])assert.equal(proposeLocalAppGoal(context,goal).ok,false);
const newer=appCompositionContext({...input,app:{...app,draft_revision:8}});assert.equal(prepareAppComposition({proposal,context,current:newer,selection}).ok,false);
assert.equal(appCompositionContext({...input,businessId:O}).ok,false);assert.equal(appCompositionContext({...input,ownerId:null}).ok,false);
for(const bad of [{...selection,order:['business_profile','arbitrary_code']},{...selection,labels:{services:'Pay now'}},{...selection,appearance:{eval:'code'}},{...selection,labels:{services:'<script>'}},{...selection,url:'https://evil.invalid'}])assert.equal(prepareAppComposition({proposal,context,current:context,selection:bad}).ok,false);
const locked=appCompositionContext({...input,app:{...app,draft_config:{...config,presentation:{ownerLockedElements:['navigation']}}}});const lp=proposeLocalAppGoal(locked,'Show services and contact details.');assert.equal(prepareAppComposition({proposal:lp.proposal,context:locked,current:locked,selection:{...selection,order:['contact','services','business_profile']}}).ok,false);
let writes=0,saved;const write=async p=>{writes++;assert.equal(p.expectedRevision,7);saved={...app,draft_revision:8,draft_config:plan.nextConfig};return {ok:true,privateOnly:true,neverPublishes:true,chargesCreated:false,app:saved,status:{app:structuredClone(saved)},appliedChangeCount:plan.operations.length,undoOperations:plan.undoOperations};};
const result=await executePrivateAppBatch({businessId:B,app,operations:plan.operations,source:plan.source,isCurrent:()=>true,write,readStatus:async()=>({app:structuredClone(saved)})});assert.equal(result.ok,true);assert.equal(writes,1);
const lost=await executePrivateAppBatch({businessId:B,app,operations:plan.operations,source:plan.source,isCurrent:()=>true,write:async()=>{writes++;throw Error('Acknowledgement lost');},readStatus:async()=>({app:structuredClone(saved)})});assert.equal(lost.ok,false);assert.equal(lost.outcome,'matching_draft_observed');assert.equal(lost.undoOperations,null);assert.equal(lost.mayRetry,false);assert.equal(writes,2);
const denied=await executePrivateAppBatch({businessId:B,app,operations:plan.operations,source:plan.source,isCurrent:()=>false,write,readStatus:async()=>({app})});assert.equal(denied.ok,false);assert.equal(writes,2);

// Execute original React component bodies with the established inert native
// boundary. These are component behaviours, not screenshots/native acceptance.
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs'),rt=createRuntime();
// Use the actual Node-loaded contract across the inert VM boundary. Each fixture
// VM has a different Object prototype; that must not change production validation.
Object.assign(rt.load('src/core/appGoalComposition.mjs'),composition);
const Editor=rt.load('src/screens/appGoalCompositionEditor.js').AppGoalCompositionEditor;
let handed,dirty=false;const props={...input,Surface:'OriginalSurface',onPreview:p=>{handed=p;return true;},onDraftChange:v=>dirty=v};
const walk=x=>Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?[x,...walk(x.props?.children)]:[],draw=()=>rt.render(Editor,props),find=label=>walk(draw()).find(n=>n.props?.label===label);
find('What would you like people to see or do?').props.onChangeText(examples[1][1]);find('Prepare my app idea').props.onPress();find('Screen name: services').props.onChangeText('Owner menu');find('Compact rows').props.onPress();const staleHandler=find('Review these supported changes in Studio').props.onPress;find('Spacious').props.onPress();assert.equal(staleHandler(),false);find('Review these supported changes in Studio').props.onPress();assert.equal(handed.ok,true);assert.equal(handed.nextConfig.modules.find(r=>r.key==='services').label,'Owner menu');assert.equal(dirty,true);
find('Compare with my saved app').props.onPress();assert.equal(find('Screen name: services').props.value,'Owner menu');find('Show proposed app').props.onPress();assert.equal(find('Screen name: services').props.value,'Owner menu');
const late=find('Review these supported changes in Studio').props.onPress;props.app={...app,draft_revision:8};draw();assert.equal(late(),false);assert.ok(walk(draw()).some(n=>String(n.props?.children).includes('Your saved app changed')));assert.equal(find('Review these supported changes in Studio'),undefined);
find('Discard this unsaved idea').props.onPress();assert.equal(dirty,false);props.ownerId=B;assert.equal(draw(),null);
console.log('PASS four distinct app goals, governed bespoke fixture, original private configuration/Undo, stale/foreign/locked/malicious denial, lost acknowledgement/no replay, original component refinement and retained preview edits. Offline fixtures; no hosted/native/provider acceptance.');
