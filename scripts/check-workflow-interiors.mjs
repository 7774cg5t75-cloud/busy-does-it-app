import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs');
const walk=x=>Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?[x,...walk(x.props?.children)]:[];
for(const width of [320,375,393,430])for(const fontScale of [1,1.4,2,2.8]){
 const rt=createRuntime({width,fontScale}),theme=rt.load('src/theme/appearance.mjs'),{WorkflowStatus,EditorToolbar,ReviewPanel}=rt.load('src/components/WorkflowChrome.js');
 for(const mode of ['midnight','daylight']){
  await theme.updateAppearance({mode},async()=>{});
  for(const tone of ['info','review','warning','error']){
   const text='An uncertain private save. Keep your words; check the account before another review.';
   const tree=rt.render(WorkflowStatus,{title:'Save needs checking',body:text,tone});assert.ok(walk(tree).some(n=>n.type==='Text'&&n.props.children.includes(text)));assert.equal(tree.props.accessibilityLiveRegion,'polite');assert.equal(tree.props.accessibilityRole,tone==='error'?'alert':undefined);assert.ok(!walk(tree).some(n=>n.props?.allowFontScaling===false));assert.equal(tree.props.style.height,undefined);
  }
  let moved=0;const toolbar=rt.render(EditorToolbar,{actions:[{key:'up',label:'Move selected section up',onPress:()=>moved++},{key:'down',label:'Move selected section down',disabled:true,onPress:()=>{throw Error('Disabled action');}}]});const actions=walk(toolbar).filter(n=>n.props?.label);assert.equal(actions.length,2);assert.equal(actions[1].props.disabled,true);actions[0].props.onPress();assert.equal(moved,1);assert.equal(toolbar.props.style.flexWrap,'wrap');
  const review=rt.render(ReviewPanel,{title:'Check this private draft',body:'No sending or payment is authorised.'});assert.equal(review.props.eyebrow,'Your review');
 }
}
const rt=createRuntime({width:393,fontScale:1}),{WebsiteLayoutControls}=rt.load('src/screens/websiteLayoutControls.js');let applied=[];
const props={draft:{theme:{spacing:'compact'},sections:[{id:'hero',title:'Welcome'},{id:'about',title:'About'}]},onApply:v=>{applied.push(v);return true;}};
let tree=rt.render(WebsiteLayoutControls,props);walk(tree).find(n=>n.props?.label==='Change layout and appearance').props.onPress();tree=rt.render(WebsiteLayoutControls,props);walk(tree).find(n=>n.props?.label==='Colours, fonts and overall look').props.onPress();tree=rt.render(WebsiteLayoutControls,props);const spacing=walk(tree).find(n=>n.props?.label==='Spacing');assert.ok(spacing);const compact=walk(spacing).find(n=>n.props?.label==='Compact spacing');assert.equal(compact.props.selected,true);compact.props.onPress();assert.deepEqual(JSON.parse(JSON.stringify(applied)),[{action:'style',field:'spacing',value:'compact'}]);
const {CommunicationsHub}=rt.load('src/screens/communications.js');let incoming=0;
const hub=rt.render(CommunicationsHub,{s:{screen:'communicationsHub',communicationsHub:{counts:{},lanes:{},unmatched:[]},openBusyInbox:()=>incoming++,askBusyAboutCommunications:()=>{},jump:()=>{}}});assert.ok(walk(hub).some(n=>n.props?.label==='Conversation status'&&n.props.items.includes('Needs attention')));walk(hub).find(n=>n.props?.label==='Incoming items').props.onPress();assert.equal(incoming,1);
const {PrivateQuoteFields}=rt.load('src/components/PrivateQuoteFields.js');let edits=[];const quote=rt.render(PrivateQuoteFields,{s:{actionQuoteAmount:'0',actionQuoteMessage:'Private words'},customerId:'fictional',status:'Prepared',review:{conflict:true,edit:(...a)=>edits.push(a)}});assert.ok(walk(quote).some(n=>n.props?.body?.includes('Saving does not issue a quote')));const wording=walk(quote).find(n=>n.props?.accessibilityLabel==='Private quote wording');assert.equal(wording.props.editable,false);assert.equal(wording.props.value,'Private words');assert.equal(edits.length,0);
const {requireTools}=await import('./testing/tooling.mjs');for(const file of ['src/components/WorkflowChrome.js','src/components/CanonicalWorkPanel.js','src/components/PrivateQuoteFields.js','src/screens/miniApps.js','src/screens/websiteBuilder.js','src/screens/websiteLayoutControls.js','src/screens/communications.js'])requireTools('@babel/core').transformSync(readFileSync(file,'utf8'),{configFile:false,babelrc:false,parserOpts:{plugins:['jsx']},plugins:[()=>({visitor:{JSXOpeningElement(path){const n=path.node.name;if(n.type==='JSXIdentifier'&&/^[A-Z]/.test(n.name))assert.ok(path.scope.hasBinding(n.name),'Unbound '+file+':'+n.name);}}})]});
console.log('PASS shared workflow/status/review/toolbars across 32 viewport/font/palette combinations; actual Website layout callbacks, Inbox navigation/filter registration and conflict-disabled original private quote fields. Source-bound component execution, no native visual acceptance.');
