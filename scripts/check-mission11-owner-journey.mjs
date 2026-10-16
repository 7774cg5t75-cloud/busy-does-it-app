import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {businessContentFixture} from './lib/business-content-fixture.mjs';
import {manageBusinessContent,readBusinessContent} from '../supabase/functions/_shared/businessContentStore.mjs';
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs');
const rt=createRuntime({width:390}),Editor=rt.load('src/screens/businessContentEditor.js').BusinessContentEditor;
const db=businessContentFixture(),scope={businessId:'business-a',actorId:'owner-a',role:'owner'};
const props={businessId:scope.businessId,request:(action,body)=>manageBusinessContent(db,scope,{...body,action})};
const walk=n=>Array.isArray(n)?n.flatMap(walk):n&&typeof n==='object'?[n,...walk(n.props?.children)]:[];
let tree=rt.render(Editor,props);const click=async label=>{const node=walk(tree).find(n=>n.props?.label===label);assert.ok(node,label);await node.props.onPress();tree=rt.render(Editor,props);};
await click('Manage products and events');await click('Create a product');
for(const [label,value] of [['name','Handmade bowl'],['description','Owner-authored product'],['category','Ceramics'],['Price','24.50']]){walk(tree).find(n=>n.props?.label===label).props.onChangeText(value);tree=rt.render(Editor,props);}
await click('Add product option');
for(const [label,value] of [['Option 1 label','Large'],['Option 1 sku','BOWL-L'],['Option 1 price','30.00']]){walk(tree).find(n=>n.props?.label===label).props.onChangeText(value);tree=rt.render(Editor,props);}
await click('Review private record change');await click('Approve and save private record');assert.equal(db.rows.length,1);assert.equal(db.rows[0].draft.amountMinor,2450);assert.equal(db.rows[0].draft.variants[0].amountMinor,3000);const id=db.rows[0].id;
await click('Approve current saved record for shared public display');const feed=await readBusinessContent(db,scope.businessId,{publicOnly:true});assert.equal(feed.records[0].id,id);
const View=rt.load('src/components/businessContentView.js').BusinessContentView;const rendered=rt.render(View,{feed,kind:'product'});assert.ok(rendered);
assert.equal((await readBusinessContent(db,'business-b',{publicOnly:true})).records.length,0);
// A partially typed currency must not crash option rendering.
walk(tree).find(n=>n.props?.label==='Currency code').props.onChangeText('G');tree=rt.render(Editor,props);assert.ok(tree);
await click('Create an event');
for(const [label,value] of [['name','Autumn workshop'],['description','A real owner-managed event'],['Date (YYYY-MM-DD)','2026-11-01'],['Start time (HH:MM in event time zone)','10:00'],['End date (YYYY-MM-DD)','2026-11-01'],['End time (HH:MM)','12:00'],['Event time zone','Europe/London'],['Venue or location','Main studio']]){walk(tree).find(n=>n.props?.label===label).props.onChangeText(value);tree=rt.render(Editor,props);}
await click('Review private record change');await click('Approve and save private record');await click('Approve current saved record for shared public display');
const event=db.rows.find(r=>r.kind==='event'),eventId=event.id;assert.equal(event.published.startsAt,'2026-11-01T10:00:00.000Z');
await click('Mark event cancelled in private draft');await click('Review private record change');await click('Approve and save private record');assert.equal(db.rows.find(r=>r.id===eventId).published.status,'scheduled');
await click('Approve current saved record for shared public display');assert.equal((await readBusinessContent(db,scope.businessId,{publicOnly:true})).records.find(r=>r.id===eventId).data.status,'cancelled');
console.log('PASS actual owner UI -> trusted adapter -> approved public projection -> shared renderer, stable product ID and foreign-business exclusion. Native/database fixtures only.');
