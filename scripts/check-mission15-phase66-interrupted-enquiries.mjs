import assert from 'node:assert/strict';
import {setup} from './lib/initial-enquiry-fixture.mjs';
const approve=async f=>{const r=await f.prompt.buttons[1].onPress();f.render();return r;};
async function register(f,lost=false){await f.saveCapture();if(lost)f.lost='rpc/busy_owner_manual_source_v1';return approve(f);}
async function file(f,lost=false){await f.saveCapture();if(lost)f.lost='rpc/busy_owner_first_enquiry_v1';return approve(f);}
async function discover(f,state){const find=f.walk(f.recordsUI()).find(n=>n.props?.label==='Find interrupted account Enquiries');assert.ok(find);assert.equal(await find.props.onPress(),true);f.render();assert.equal(f.filing.recovery.list.items[0].state,state);const inspect=f.walk(f.recordsUI()).find(n=>n.props?.label?.startsWith('Inspect ')&&!n.props.label.startsWith('Inspect account reply'));assert.ok(inspect);assert.equal(await inspect.props.onPress(),true);assert.match(f.prompt.body,/not proof that this session saved it/);}
// Lost registration acknowledgement: inspect in-place, preserve uncertainty,
// independently resume current Pending source in a fresh account session.
let f=setup(),original=structuredClone(f.payload);assert.equal(await register(f,true),false);assert.equal(f.filing.state.status,'unknown');await discover(f,'Pending');assert.equal(f.prompt.buttons.length,1);assert.equal(await f.saveCapture(),false);assert.equal(f.calls.filter(c=>c.path.endsWith('manual_source_v1')).length,1);assert.deepEqual(f.payload,original);
let fresh=setup(f.server);fresh.capture.note='New independent owner correction';await discover(fresh,'Pending');assert.equal(await approve(fresh),true);assert.equal(fresh.capture.note,'New independent owner correction');assert.equal(fresh.filing.state,null);assert.equal(await fresh.saveCapture(),true);assert.match(fresh.prompt.body,/Current Pending source/);assert.equal(await approve(fresh),true);assert.equal(fresh.filing.state.status,'filed');assert.ok(!fresh.calls.some(c=>c.path.endsWith('manual_source_v1')));
// Lost filing acknowledgement: do not create a second customer. Discover the
// Filed association and use the original first reply review/editor.
f=setup();await register(f);assert.equal(await file(f,true),false);await discover(f,'FiledWithoutReply');assert.equal(f.prompt.buttons.length,1);assert.equal(f.calls.filter(c=>c.path.endsWith('first_enquiry_v1')).length,1);
fresh=setup(f.server);await discover(fresh,'FiledWithoutReply');assert.equal(await approve(fresh),true);assert.match(fresh.prompt.body,/Proposed private wording/);await approve(fresh);assert.equal(fresh.screen,'enquiryFollowUp');assert.equal(await fresh.actions.reviewAccountSave(),true);fresh.lost='rpc/busy_owner_reply_create_v1';assert.equal(await approve(fresh),false);assert.equal(fresh.actions.review.trustedSaveStatus,'unknown');
// A lost first-creation receipt remains unknown; readonly discovery/inspection
// works without replaying creation or transferring receipt identity.
await discover(fresh,'FiledWithReply');assert.equal(fresh.prompt.buttons.length,1);assert.match(fresh.prompt.body,/Private wording currently on account/);assert.equal(await fresh.actions.reviewAccountSave(),false);assert.equal(fresh.calls.filter(c=>c.path.endsWith('reply_create_v1')).length,1);assert.deepEqual(fresh.payload,original);
f=setup(fresh.server);await discover(f,'FiledWithReply');await approve(f);f.render();assert.equal(f.actions.accountRecovery.status,'ready');await f.actions.inspectAccountReply(f.actions.accountRecovery.list.items[0]);await approve(f);assert.equal(f.text,f.server.reply);assert.equal(f.actions.review.trustedSaveStatus,null);f.actions.edit('Fresh independently reviewed wording');f.render();await f.actions.reviewAccountSave();assert.equal(await approve(f),true);assert.equal(f.actions.review.trustedSaveStatus,'confirmed');assert.equal(f.snapshotContextRef.current.revision,0);assert.deepEqual(f.payload,original);
// Invalidations protect exact capture text/ABA, view and independent dirty work.
for(const change of [f=>f.type('note','New words'),f=>{f.type('name','Other');f.type('name','Alex');},f=>{f.screen='home';},f=>{f.role='admin';},f=>{f.payload.websiteDraft.text='New independent draft';},f=>{f.server.revision++;}]){
 f=setup();await register(f);await discover(f,'Pending');const button=f.prompt.buttons[1].onPress;change(f);f.render();assert.equal(await button(),false);assert.equal(f.server.revision>=2,true);assert.equal(f.capture.rawText,'Please quote for catering for twelve people');
}
// In-flight read cancellation preserves newly typed capture words and avoids
// navigation. The selected source cannot outlive its view/typing evidence.
f=setup();await register(f);await f.filing.discover();f.render();f.delay='rpc/busy_owner_pending_review_v1';const inFlight=f.filing.inspect(f.filing.recovery.list.items[0]);await new Promise(r=>setImmediate(r));f.type('rawText','Newer capture while inspecting');f.render();f.release();assert.equal(await inFlight,false);assert.equal(f.capture.rawText,'Newer capture while inspecting');assert.equal(f.screen,'quickCaptureReview');assert.equal(f.server.revision,2);
// A source correction without a revision increment still fails the final
// exact observation check; it cannot substitute altered text under an approval.
f=setup();await register(f);await discover(f,'Pending');const openBeforeChange=f.prompt.buttons[1].onPress;f.server.pending.rawText='Changed account source';assert.equal(await openBeforeChange(),false);assert.equal(f.capture.rawText,'Please quote for catering for twelve people');
// Discovery entries are minted by the session, not caller-provided authority.
f=setup();await register(f);await f.filing.discover();f.render();assert.equal(await f.filing.inspect({...f.filing.recovery.list.items[0]}),false);f.enabled=false;f.render();assert.equal(await f.filing.discover(),false);
console.log('PASS original QuickCapture/root/session/reply parent interruption recovery: Pending, Filed without reply and saved reply; no blind replay or fabricated receipt; fresh deliberate continuation; typing/view/role/source/revision/dirty work preserved. Inert IO, not device/PostgREST acceptance.');
