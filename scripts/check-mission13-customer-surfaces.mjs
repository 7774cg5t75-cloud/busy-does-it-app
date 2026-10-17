import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {contentEventSchedule as schedule} from '../src/core/businessContentRecords.mjs';
import {businessContentSectionHtml as html} from '../src/core/businessContentHtml.mjs';
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs');
const runtime=createRuntime(),{BusinessContentView:View}=runtime.load('src/components/businessContentView.js');
const walk=n=>Array.isArray(n)?n.flatMap(walk):n&&typeof n==='object'?[n,...walk(n.props?.children)]:[];
const text=n=>Array.isArray(n)?n.map(text).join(' '):n&&typeof n==='object'?text(n.props?.children):String(n??'');
const button=(tree,label)=>walk(tree).find(n=>n.type==='Pressable'&&text(n).includes(label));
const base={ok:true,version:1,businessId:'business-a',checkedAt:'2026-10-17T12:00:00.000Z',stockTracked:false,checkoutEnabled:false,attendanceConfirmed:false,records:[{id:'cup_record_001',kind:'product',revision:3,data:{name:'Cup',description:'Complete approved description',category:'Ceramics',status:'active',image:null,currency:'GBP',amountMinor:1200,availability:'not_tracked',variants:[{id:'large_option_001',label:'Large',sku:'LG',amountMinor:1500}]}}]};
let sent=[];const props={feed:base,kind:'product',onInterest:(_label,p)=>sent.push(p)};
let tree=runtime.render(View,props);button(tree,'View Cup').props.onPress();tree=runtime.render(View,props);assert.match(text(tree),/revision\s+3/);button(tree,'Large').props.onPress();tree=runtime.render(View,props);
const revised={...base,records:[{...base.records[0],revision:4}]};tree=runtime.render(View,{...props,feed:revised});button(tree,'Ask about').props.onPress();tree=runtime.render(View,{...props,feed:revised});assert.equal(sent.length,0);assert.match(text(tree),/option has changed/);
button(tree,'Large').props.onPress();tree=runtime.render(View,{...props,feed:revised});button(tree,'Ask about').props.onPress();assert.equal(sent[0].selection.revision,4);assert.equal(sent[0].selection.variantId,'large_option_001');
const {MiniAppSurface}=runtime.load('src/screens/miniApps.js'),{AppSectionNavigation}=runtime.load('src/components/appSectionNavigation.js');
const modules=['business_profile','services','enquiry','contact'].map(key=>({key,enabled:true,label:key}));
const config={modules,navigation:modules.map(x=>x.key),publicProfile:{businessName:'Fictional studio',about:'About owner facts',services:[{name:'Tuition',description:'Approved service details'}],contact:{email:'example@example.invalid'}}};
let navigated=0;const surface=()=>runtime.render(MiniAppSurface,{config,interactive:true,onRequestNavigation:()=>navigated++});
tree=surface();let nav=walk(tree).find(n=>n.type===AppSectionNavigation);assert.ok(nav);let tabs=runtime.render(AppSectionNavigation,nav.props);button(tabs,'services').props.onPress();tree=surface();assert.doesNotMatch(JSON.stringify(tree),/About owner facts/);assert.match(JSON.stringify(tree),/Approved service details/);
nav=walk(tree).find(n=>n.type===AppSectionNavigation);tabs=runtime.render(AppSectionNavigation,nav.props);assert.equal(button(tabs,'services').props.accessibilityState.selected,true);button(tabs,'enquiry').props.onPress();assert.equal(navigated,1);tree=surface();assert.doesNotMatch(JSON.stringify(tree),/Approved service details/);
// Real generated website script with inert DOM and transport. No handoff is
// configured: options must still be visible, and no fake request link appears.
function element(tag='div'){return {tag,children:[],style:{},textContent:'',listeners:{},setAttribute(){},addEventListener(k,fn){this.listeners[k]=fn},appendChild(x){this.children.push(x)},replaceChildren(){this.children=[]}}}
const target=element(),document={getElementById:()=>target,createElement:element,addEventListener(){}};
const markup=html({id:'products',type:'products',title:'Products',contentSource:'business_records_v1'},{endpoint:'https://fixture.supabase.co/functions/v1/busy-mini-app-guest',deploymentId:'deployment-fixture'});
vm.runInNewContext(markup.match(/<script>([\s\S]*)<\/script>/)[1],{document,Date,Intl,JSON,URL,Object,fetch:async()=>({ok:true,json:async()=>base})});await new Promise(done=>setImmediate(done));
const dom=n=>[n,...n.children.flatMap(dom)];assert.ok(dom(target).some(n=>n.tag==='li'&&n.textContent.includes('Large')&&n.textContent.includes('LG')));assert.equal(dom(target).some(n=>n.tag==='a'),false);
const event={startsAt:'2027-11-06T23:00:00.000Z',endsAt:'2027-11-07T08:00:00.000Z',timeZone:'America/New_York'};
const dates=schedule(event,'en-US');assert.match(dates,/Nov 6/);assert.match(dates,/Nov 7/);assert.match(dates,/America\/New_York/);assert.equal(schedule({...event,timeZone:'invalid'}),'Event dates need review.');assert.equal(schedule({...event,endsAt:event.startsAt}),'Event dates need review.');
const core=fs.readFileSync('src/core/businessContentRecords.mjs','utf8');for(const p of ['standalone/template','supabase/functions/_shared','supabase/functions/busy-mini-apps','supabase/functions/busy-website-worker'])assert.equal(fs.readFileSync(p+'/businessContentRecords.mjs','utf8'),core);
assert.equal(fs.readFileSync('src/core/businessContentHtml.mjs','utf8'),fs.readFileSync('supabase/functions/_shared/businessContentHtml.mjs','utf8'));
console.log('PASS actual component navigation/selected states, revision-aware option reselection, real public HTML options without false handoff, multi-day non-UK/DST schedule wording and deployable contract parity. Hooks/DOM fixtures, no device/browser claim.');
