import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createOwnerEditNavigation} from '../src/core/ownerEditNavigation.mjs';
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs');
const rt=createRuntime(),{WebsitePagesEditor:Editor}=rt.load('src/screens/websitePagesEditor.js');
const walk=x=>Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?[x,...walk(x.props?.children)]:[];
const find=(tree,label)=>{const node=walk(tree).find(n=>n.props?.label===label);assert.ok(node,label);return node;};
let scope='owner:business:websiteBuilder',prompt,applied=[];
const guard=createOwnerEditNavigation({getScope:()=>scope,confirm:p=>prompt=p});
const draft={id:'site',generation:1,pages:[{id:'home',title:'Home',path:'/'}],sections:[]};
const ownerState={ownerSession:{userId:'owner'},cloudWorkspace:{businessId:'business'},setOwnerEditDirty:v=>guard.report({...v,scope}),releaseOwnerEdit:guard.release,requestOwnerEditTransition:guard.request,withOwnerEditCommit:guard.withCommit};
let props={draft,ownerState,onApply:patch=>{applied.push(patch);return true;}};
const render=()=>rt.render(Editor,props);let tree=render();find(tree,'Manage website pages').props.onPress();tree=render();find(tree,'Home • /').props.onPress();tree=render();
find(tree,'Search title (up to 70 characters)').props.onChangeText('Exact search title');find(tree,'Search description (up to 160 characters)').props.onChangeText('Queued independent description');tree=render();assert.equal(find(tree,'Search description (up to 160 characters)').props.value,'Queued independent description');
const oldSave=find(tree,'Save private page search details').props.onPress;
find(tree,'Page title').props.onChangeText('Independent new page');tree=render();oldSave();assert.equal(applied.length,0,'Old save cannot clear newer independent typing');
find(tree,'Save private page search details').props.onPress();assert.equal(applied.length,0,'Current own save cannot bypass independent dirty group');
guard.request(()=>applied.push('navigate'));assert.ok(prompt);const discard=prompt.discard;
find(tree,'Page title').props.onChangeText('Newer wording');tree=render();assert.equal(discard(),false);assert.equal(find(tree,'Page title').props.value,'Newer wording');
guard.request(()=>{});prompt.keep();tree=render();assert.equal(find(tree,'Page title').props.value,'Newer wording');
const other={};guard.report({token:other,identity:{source:draft,projectId:draft.id,revision:1,ownerId:'owner',businessId:'business'},scope,dirty:true,onDiscard:()=>{}});find(tree,'Discard unsaved page wording').props.onPress();assert.equal(guard.hasDirtySource(draft),true,'Discarding page copy preserves another dirty editor');guard.release(other);tree=render();assert.equal(find(tree,'Page title').props.value,'');
find(tree,'Home • /').props.onPress();tree=render();find(tree,'Search description (up to 160 characters)').props.onChangeText('Literal approved description');tree=render();find(tree,'Save private page search details').props.onPress();assert.equal(applied.at(-1).description,'Literal approved description');
const before=applied.length;guard.request(()=>applied.push('clean-navigation'));assert.equal(applied.length,before+1,'Exact confirmed save clears own dirtiness');
tree=render();find(tree,'Page title').props.onChangeText('Keep across revision');tree=render();const stale=find(tree,'Create private page').props.onPress;props={...props,draft:{...draft,generation:2}};tree=render();stale();assert.equal(applied.length,before+1);assert.equal(find(tree,'Page title').props.value,'Keep across revision');find(tree,'Create private page').props.onPress();assert.equal(applied.length,before+1,'New revision requires deliberate review');
// Original parent renders this component with actual owner state and handler.
const {WebsiteBuilder}=rt.load('src/screens/websiteBuilder.js');
const parent=rt.render(WebsiteBuilder,{s:{...ownerState,websiteDraft:draft}});
const wired=walk(parent).find(n=>n.type===Editor);assert.ok(wired);assert.equal(wired.props.ownerState.ownerSession.userId,'owner');
console.log('PASS actual page/SEO editor dirty registration, independent fields, stale callbacks, explicit discard/keep, revision review and original parent wiring. Native controls/IO inert; no physical navigation acceptance.');

// Native page controls use the same source-bound finite operation as the worker.
const r2=createRuntime(),PageEditor=r2.load('src/screens/websitePagesEditor.js').WebsitePagesEditor;
const pageDraft={id:'site-two',generation:7,pages:[{id:'page-work',title:'Work',path:'/pages/work'}],customPages:[{id:'page-work',title:'Work',slug:'work',sectionIds:['custom-a','custom-b','custom-c']}],sections:['a','b','c'].map(id=>({id:'custom-'+id,type:'text',title:id,body:'Exact '+id}))};
const patches=[],render2=()=>r2.render(PageEditor,{draft:pageDraft,onApply:p=>{patches.push(p);return true;}});
find(render2(),'Manage website pages').props.onPress();find(render2(),'Work • /pages/work').props.onPress();let tree2=render2();
const firstMoves=walk(tree2).filter(n=>n.props?.label==='Move section to first');assert.equal(firstMoves[0].props.disabled,true);firstMoves[2].props.onPress();assert.equal(patches[0].sectionId,'custom-c');assert.equal(patches[0].expectedGeneration,7);assert.equal(patches[0].direction,'first');
find(render2(),'Section heading').props.onChangeText('Unsaved section heading');tree2=render2();walk(tree2).filter(n=>n.props?.label==='Move section to first')[1].props.onPress();assert.equal(patches.length,1,'Reordering cannot discard independent unsaved section wording');assert.equal(find(render2(),'Section heading').props.value,'Unsaved section heading');
