import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs');
const walk=x=>Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?[x,...walk(x.props?.children)]:[];
const find=(tree,label)=>walk(tree).find(x=>x.props?.label===label);
const text=x=>Array.isArray(x)?x.map(text).join(''):typeof x==='string'?x:'';
// Original layout specialist: regrouping must preserve exact finite commands,
// including deliberate two-step removal and the original add-section fields.
const lr=createRuntime(),{WebsiteLayoutControls:Layout}=lr.load('src/screens/websiteLayoutControls.js');
let patches=[];const draft={id:'site',generation:1,designPlan:{sectionOrder:['hero','custom-story','custom-later']},sections:[{id:'hero',title:'Home',enabled:true},{id:'custom-later',title:'Later section',type:'text',body:'Other owner words',enabled:true},{id:'custom-story',title:'Our story',type:'text',body:'Owner words',enabled:true}]};
const renderLayout=()=>lr.render(Layout,{draft,onApply:change=>{patches.push(change);return true;}});
let tree=renderLayout();find(tree,'Change layout and appearance').props.onPress();tree=renderLayout();find(tree,'Colours, fonts and overall look').props.onPress();tree=renderLayout();
assert.equal(patches.length,0,'opening inspector does not apply a design');
find(tree,'Elegant headings').props.onPress();assert.deepEqual(JSON.parse(JSON.stringify(patches.pop())),{action:'style',field:'typography',value:'refined'});
find(tree,'Comfortable spacing').props.onPress();assert.deepEqual(JSON.parse(JSON.stringify(patches.pop())),{action:'style',field:'spacing',value:'comfortable'});
assert.equal(find(tree,'Service rows').props.compact,true);
find(tree,'Arrange and add sections').props.onPress();tree=renderLayout();assert.ok(walk(tree).findIndex(x=>text(x.props?.children)==='Our story')<walk(tree).findIndex(x=>text(x.props?.children)==='Later section'));assert.deepEqual(draft.sections.map(x=>x.id),['hero','custom-later','custom-story'],'display ordering must not mutate the website');find(tree,'Delete extra section').props.onPress();assert.equal(patches.length,0);
tree=renderLayout();assert.equal(find(tree,'Confirm delete this extra section').props.danger,true);find(tree,'Confirm delete this extra section').props.onPress();assert.deepEqual(JSON.parse(JSON.stringify(patches.pop())),{action:'delete',sectionId:'custom-story'});
// Original page editor: active page first, creation retained, dirty transitions
// still denied and exact unsubmitted words survive a real appearance change.
const pr=createRuntime(),{WebsitePagesEditor:Pages}=pr.load('src/screens/websitePagesEditor.js');let writes=0;
const page={id:'page-team',title:'Team',slug:'team',path:'/pages/team',sectionIds:[]};const website={id:'site-a',generation:1,pages:[page],customPages:[page],sections:[]};
const renderPages=()=>pr.render(Pages,{draft:website,onApply:()=>{writes++;return true;}});
tree=renderPages();find(tree,'Manage website pages').props.onPress();tree=renderPages();find(tree,'Team • /pages/team').props.onPress();tree=renderPages();
assert.equal(writes,0);assert.equal(find(tree,'✓ Team • /pages/team').props.selected,true);
const nodes=walk(tree);assert.ok(nodes.findIndex(x=>text(x.props?.children)==='Edit Team')<nodes.findIndex(x=>text(x.props?.children)==='Create a new page'));
find(tree,'Page title').props.onChangeText('Unsubmitted owner page title');
await pr.load('src/theme/appearance.mjs').updateAppearance({mode:'daylight'},async()=>{});tree=renderPages();assert.equal(find(tree,'Page title').props.value,'Unsubmitted owner page title');
find(tree,'Hide website page controls').props.onPress();tree=renderPages();assert.ok(JSON.stringify(tree).includes('Finish your unsaved page wording'));assert.equal(find(tree,'Page title').props.value,'Unsubmitted owner page title');assert.equal(writes,0);
// Original format/treatment parents retain evidence and deliberate callbacks.
const cr=createRuntime(),{ContentFormatChoices:Formats}=cr.load('src/components/ContentFormatChoices.js'),{ContentWordingChoices:Wording}=cr.load('src/components/ContentWordingChoices.js');
const pending={purpose:'service',evidence:{ok:true,channel:'social',treatment:'concise'}},calls=[];
tree=cr.render(Formats,{pending,actions:{chooseFormat:(...a)=>calls.push(a)}});const selected=walk(tree).find(x=>x.props?.selected===true);assert.ok(selected);assert.equal(calls.length,0);selected.props.onPress();assert.equal(calls[0][0],pending);assert.equal(calls[0][1],'social');
tree=cr.render(Wording,{pending,actions:{chooseTreatment:(...a)=>calls.push(a)}});assert.equal(find(tree,'✓ Short and clear').props.selected,true);find(tree,'Friendly and welcoming').props.onPress();assert.deepEqual(calls.at(-1),[pending,'welcoming']);assert.equal(cr.render(Formats,{pending:{...pending,evidence:{ok:false}},actions:{chooseFormat:()=>{throw Error('no authority');}}}),null);
// Actual reply screen: words precede save choices, uncertain account outcome
// remains explicit; typing stays in the original state owner, never auto-save.
const rr=createRuntime(),{EnquiryFollowUp:Reply}=rr.load('src/screens/customers.js');let changed=[],saved=0;
const s={enquiryReplyReview:{customer:{id:'c',name:'Fictional customer',service:'Repair'},item:{id:'e',rawText:'Owner-supplied enquiry'},accountOnly:false,current:true,canSaveAccount:true,preparationBlocked:true,saveStatus:'unknown',trustedSaveStatus:'unknown'},enquiryFollowUpDraft:'Exact private owner words',setEnquiryFollowUpDraft:value=>changed.push(value),enquiryReplyActions:{save:()=>saved++,reviewAccountSave:()=>saved++},back:()=>{},openCustomer:()=>{}};
tree=rr.render(Reply,{s});const rows=walk(tree),input=rows.find(x=>x.props?.accessibilityLabel==='Your private reply wording');assert.equal(input.props.value,s.enquiryFollowUpDraft);assert.ok(rows.indexOf(input)<rows.findIndex(x=>x.props?.label==='Save reply on this device'));assert.equal(find(tree,'Save reply on this device').props.disabled,true);assert.equal(find(tree,'Review private account save').props.disabled,true);assert.ok(JSON.stringify(tree).includes('account outcome is uncertain'));input.props.onChangeText('New owner words');assert.deepEqual(changed,['New owner words']);assert.equal(saved,0);
const ui=rr.load('src/components/ui.js'),{styles}=rr.load('src/theme/styles.js');const button=rr.render(ui.Button,{label:'Current page',selected:true,compact:true,disabled:true,onPress:()=>saved++});assert.equal(button.props.accessibilityState.selected,true);assert.equal(button.props.disabled,true);assert.ok(styles.photoRemove.minHeight>=48);assert.ok(styles.replyEditor.minHeight>=220);
// Semantic text and selected-control pairs used by the new workspace panels.
const {palettes}=await import('../src/theme/appearance.mjs');
const lum=hex=>{const a=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722;};
for(const p of Object.values(palettes))for(const [fg,bg,min] of [['ink','input',4.5],['muted','input',4.5],['blueText','blueSoft',4.5],['controlBorder','input',3]]){const a=lum(p[fg]),b=lum(p[bg]);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=min,fg+' on '+bg);}
console.log('PASS original website inspector finite commands/two-step delete, page selection/order/dirty wording across appearance, original Creator format/tone evidence callbacks, private reply editor ordering/uncertain disabled saves and original typing ownership. Inert IO, not screenshots or hosted/native acceptance.');
