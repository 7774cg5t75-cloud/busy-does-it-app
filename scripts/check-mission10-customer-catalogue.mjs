import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs');
const walk=n=>Array.isArray(n)?n.flatMap(walk):n&&typeof n==='object'?[n,...walk(n.props?.children)]:[];
const runtime=createRuntime({width:390}),Surface=runtime.load('src/screens/miniApps.js').MiniAppSurface;
const services=Array.from({length:6},(_,i)=>({name:'Service '+i,description:i===3?'Special consultation':'Owner wording'}));
const config={modules:[{key:'business_profile',enabled:true},{key:'services',enabled:true}],navigation:['business_profile','services'],publicProfile:{businessName:'Business',services}};let selected=null;
let tree=runtime.render(Surface,{config,interactive:true,onSelectService:v=>selected=v});
let nodes=walk(tree),find=nodes.find(n=>n.props?.label==='Find a service');assert.ok(find);find.props.onChangeText('consultation');
tree=runtime.render(Surface,{config,interactive:true,onSelectService:v=>selected=v});nodes=walk(tree);
const choices=nodes.filter(n=>n.props?.label?.startsWith('Choose Service'));assert.equal(choices.length,1);assert.equal(choices[0].props.label,'Choose Service 3 for my request');choices[0].props.onPress();assert.equal(selected,'Service 3');
tree=runtime.render(Surface,{config,interactive:false,onSelectService:v=>selected=v});assert.equal(walk(tree).filter(n=>n.props?.label?.startsWith('Choose Service')).length,0);
console.log('PASS: actual marketplace service search and selection callback, description matching, one matching service and no actionable buttons in private previews. Fixture native runtime, no request sent.');

// Legacy published marketplace profiles allow 50 services, not the native projection's 40.
walk(tree).find(n=>n.props?.label==='Find a service').props.onChangeText('');
const legacy={...config,publicProfile:{...config.publicProfile,services:Array.from({length:50},(_,i)=>({name:'Legacy '+i,description:'Existing owner data'}))}};
tree=runtime.render(Surface,{config:legacy,interactive:true,onSelectService:v=>selected=v});
assert.equal(walk(tree).filter(n=>n.props?.label?.startsWith('Choose Legacy')).length,50);
walk(tree).find(n=>n.props?.label==='Find a service').props.onChangeText('Legacy 49');
tree=runtime.render(Surface,{config:legacy,interactive:true,onSelectService:v=>selected=v});
assert.equal(walk(tree).filter(n=>n.props?.label==='Choose Legacy 49 for my request').length,1);
console.log('PASS legacy 50-service marketplace rendering and final-row search without loosening the native helper bound.');
