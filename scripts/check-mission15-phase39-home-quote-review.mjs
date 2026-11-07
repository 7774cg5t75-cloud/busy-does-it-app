import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homeFollowUpQuoteReview} from '../src/core/homeQuoteReview.mjs';
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs');
const scope={},customer={id:'a',name:'Alex Example',service:'Catering'},action={type:'quote',done:true,details:{quoteStatus:'Sent',message:'Owner recorded quote'}};
let opened=[];
const base={ownerWorkspaceScope:scope,ownerSession:{userId:'owner'},cloudWorkspace:{businessId:'business',role:'owner'},cloudRevision:4,customers:[customer],replyActions:{a:action},selectedReplyActionId:'a',openSavedReplyAction:id=>{opened.push(id);return true;}};
let current=base;const candidate=homeFollowUpQuoteReview(base,()=>current);assert.ok(candidate);assert.match(candidate.body,/not proof/);assert.equal(candidate.onAction(),true);assert.deepEqual(opened,['a']);
for(const change of [{ownerWorkspaceScope:{}},{cloudRevision:5},{cloudWorkspace:{...base.cloudWorkspace,role:'viewer'}},{selectedReplyActionId:'b'},{customers:[{...customer}]},{replyActions:{a:{...action}}}]){current={...base,...change};assert.equal(candidate.onAction(),false);}
for(const status of ['Prepared','Accepted','Declined','Cancelled'])assert.equal(homeFollowUpQuoteReview({...base,replyActions:{a:{...action,details:{...action.details,quoteStatus:status}}}},()=>base),null);
assert.equal(homeFollowUpQuoteReview({...base,replyActions:{a:{...action,details:{...action.details,followUpSentAt:'2099-01-01'}}}},()=>base),null);
current=base;action.details.message='Changed in-place source';assert.equal(candidate.onAction(),false);action.details.message='Owner recorded quote';
const rt=createRuntime(),{default:App}=rt.load('src/app/AppController.js');rt.render(App,{});const {HomeScreen}=rt.load('src/screens/home.js'),{HomeCoreAreas}=rt.load('src/components/HomeCoreAreas.js');const walk=x=>Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?[x,...walk(x.props?.children)]:[];
const s={...rt.appState,...base,inboxItems:[],services:[],socialDrafts:[],eligibleCustomers:[],reactivationEligibleCustomers:[],dismissedOpportunities:[],brainTuneOpportunity:x=>x};
let tree=rt.render(HomeScreen,{s});const button=walk(tree).find(n=>n.type==='Pressable'&&JSON.stringify(n.props.children).includes('Review before following up'));assert.ok(button,'Actual Home ranking renders the selected recorded quote review');button.props.onPress();assert.equal(opened.at(-1),'a');
const count=opened.length;rt.render(HomeScreen,{s:{...s,ownerWorkspaceScope:{}}});button.props.onPress();assert.equal(opened.length,count,'Old Home callback cannot reopen across workspace changes');assert.equal(walk(rt.render(HomeCoreAreas,{s})).filter(n=>n.type==='Pressable'&&n.props?.accessibilityHint).length,6);
await import('./check-mission15-phase38-quote-recovery.mjs');
console.log('PASS actual six-area Home offers exact selected recorded quote review without invented urgency/delivery; role, revision, selection, record and scope freshness deny stale actions; original saved filing-reference recovery and guarded parent execute.');

console.log('Bounded original controller VM statistics:',JSON.stringify(rt.statistics));
