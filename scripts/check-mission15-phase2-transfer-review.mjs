import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs');
const runtime=createRuntime();const walk=n=>Array.isArray(n)?n.flatMap(walk):n&&typeof n==='object'?[n,...walk(n.props?.children)]:[];
const website={id:'site-a',businessId:'business-a',generation:1,businessName:'Example',theme:{primary:'#112233',typography:'friendly',cardLayout:'cards'},sections:[{id:'hero',type:'hero',title:'Example',body:'Owner introduction'},{id:'services',type:'services',title:'Services',items:[]},{id:'contact',type:'contact',email:'hello@example.test'}]};
const app={id:'app-a',business_id:'business-a',draft_revision:1,draft_config:{display:{name:'Example'},modules:[{key:'business_profile',enabled:true},{key:'services',enabled:true}],navigation:['business_profile','services'],presentation:{brandPalette:'forest',typeStyle:'editorial',serviceStyle:'rows'},publicProfile:{businessName:'Example',services:[{id:'survey',name:'Survey',description:'Old draft wording'}]}}};
for(const [file,name,open,prepare,apply]of [
 ['websiteAppServiceCopy.js','WebsiteAppServiceCopy',null,'Review missing services','Copy these services into my PRIVATE website'],
 ['websiteAppBrandMatch.js','WebsiteAppBrandMatch',null,'Review matching website colour','Apply this colour to my PRIVATE website'],
 ['websiteAppTypographyMatch.js','WebsiteAppTypographyMatch',null,'Review matching typography','Apply typography to my PRIVATE website'],
 ['appToWebsiteDesignTransfer.js','AppToWebsiteDesignTransfer','Explore app-to-website transfer','Review exact website changes','Approve this PRIVATE website change'],
 ['websiteToAppDesignTransfer.js','WebsiteToAppDesignTransfer','See how Busy could reuse my website','Review my website-to-app design',null]
]){
 const Component=runtime.load('src/screens/'+file)[name];let calls=0,props={website,app,businessId:'business-a',onApply:()=>{calls++;return true;},onPreview:()=>{calls++;return true;}};
 let tree;const render=()=>tree=runtime.render(Component,props);const button=label=>walk(tree).find(n=>n.props?.label===label);
 render();if(open){assert.ok(button(open),file);button(open).props.onPress();render();}
 assert.ok(button(prepare),file);button(prepare).props.onPress();render();
 const approved=apply?button(apply):walk(tree).find(n=>n.props?.label?.startsWith('Preview ')&&n.props?.label?.endsWith('changes in App Studio'));
 assert.ok(approved,file);const oldPress=approved.props.onPress;
 props={...props,website:{...website,generation:2}};render();assert.match(JSON.stringify(tree),/Review updated builder drafts/);assert.doesNotMatch(JSON.stringify(tree),/Old draft wording/);oldPress();assert.equal(calls,0,file+' stale callback must not reach apply/preview');
 props={...props,businessId:'business-b',app:{...app,id:'app-b',business_id:'business-b'},website:{...website,id:'site-b',businessId:'business-b'}};render();assert.doesNotMatch(JSON.stringify(tree),/Old draft wording/);
}
console.log('PASS actual bidirectional transfer and service-copy reviews hide stale proposals synchronously and reject old callbacks before original apply/preview; inert component hooks, no hosted claim.');
