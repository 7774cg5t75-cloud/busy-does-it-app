import assert from 'node:assert/strict';
import {setup} from './lib/private-account-reply-fixture.mjs';
const write=f=>f.requestLog.filter(r=>r.path==='rpc/busy_owner_reply_text_v2');
const edit=(f,text)=>{f.actions.edit(text);f.render();};
const accept=async f=>{assert.equal(await f.actions.reviewAccountSave(),true);return f.prompt.buttons[1].onPress();};
let f=setup();
f.payload.quote.amount='Owner amount before save';f.payload.socialDrafts=[{id:'newsletter',text:'Unsaved newsletter'}];f.payload.websiteDraft={text:'Unsaved website'};
let before=structuredClone(f.payload);assert.equal(await accept(f),true);f.render();assert.equal(f.actions.review.trustedSaveStatus,'confirmed');assert.equal(f.accountRevision,4);assert.deepEqual(f.payload,before);assert.equal(f.snapshotContextRef.current.revision,3);
f.payload.quote.date='Owner date after first save';f.payload.future.keep='Independent preference edit';before=structuredClone(f.payload);edit(f,'Second reviewed wording');
assert.equal(await accept(f),true);f.render();assert.equal(f.accountRevision,5);assert.deepEqual(write(f).map(r=>r.body.p_expected_revision),[3,4]);assert.deepEqual(f.payload,before);assert.equal(f.snapshotContextRef.current.revision,3);assert.equal(f.text,'Second reviewed wording');assert.equal(f.session.readOwnSave({getCurrent:()=>f.snapshotContextRef.current,customerId:'customer',inboxId:'filed'}).ok,false,'A finite receipt must not mint a whole snapshot save');
// Unknown remote changes are not rebased, even if only an unrelated field changed.
for(const change of [f=>{f.accountRevision=6;},f=>{f.sourceHash='d'.repeat(64);},f=>{f.recordHash='e'.repeat(64);},f=>{f.accountText='Another owner version';}]){
 f=setup();assert.equal(await accept(f),true);change(f);edit(f,'Keep these new words');before=structuredClone(f.payload);assert.equal(await f.actions.reviewAccountSave(),false);f.render();assert.equal(f.actions.review.trustedSaveStatus,'reviewRequired');assert.equal(write(f).length,1);assert.deepEqual(f.payload,before);assert.equal(f.text,'Keep these new words');
}
for(const change of [f=>{f.metadataBusiness='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';},f=>{f.metadataOwner='dddddddd-dddd-4ddd-8ddd-dddddddddddd';},f=>{f.metadataSchema=2;},f=>{f.metadataExtra={payload:{private:'Must not be exposed'}};}]){
 f=setup();assert.equal(await accept(f),true);change(f);edit(f,'Preserved local reply');assert.equal(await f.actions.reviewAccountSave(),false);assert.equal(write(f).length,1);assert.equal(f.text,'Preserved local reply');
}
// Independent work while a target mutation is in flight remains local; no
// whole-payload confirmation is inferred from the otherwise valid receipt.
f=setup();f.mutationDelay=true;assert.equal(await f.actions.reviewAccountSave(),true);const saving=f.prompt.buttons[1].onPress();await new Promise(r=>setImmediate(r));f.payload.quote.amount='Typed during target save';f.releaseMutation();assert.equal(await saving,false);f.render();assert.equal(f.actions.review.trustedSaveStatus,'unknown');assert.equal(f.payload.quote.amount,'Typed during target save');assert.equal(write(f).length,1);
// Read-only metadata never replaces an editor, even if typing/role changes.
f=setup();assert.equal(await accept(f),true);f.metadataDelay=true;edit(f,'Before metadata');const checking=f.actions.reviewAccountSave();await new Promise(r=>setImmediate(r));edit(f,'Newer typing during metadata');f.releaseMetadata();assert.equal(await checking,false);assert.equal(f.text,'Newer typing during metadata');assert.equal(write(f).length,1);
f=setup();assert.equal(await accept(f),true);f.metadataDelay=true;edit(f,'Keep on revocation');const revoked=f.actions.reviewAccountSave();await new Promise(r=>setImmediate(r));f.role='member';f.render();f.releaseMetadata();assert.equal(await revoked,false);assert.equal(write(f).length,1);
// A matching revision observation after a lost acknowledgement is not a receipt.
f=setup();f.lost=true;assert.equal(await accept(f),false);const observed=await f.session.reconcilePrivateReply({getCurrent:()=>({...f.snapshotContextRef.current,inputEpoch:0}),ownerAccessToken:async()=> 'inert',request:async()=>({businessId:f.snapshotContextRef.current.businessId,ownerId:f.snapshotContextRef.current.ownerId,revision:4,schemaVersion:1})});assert.equal(observed.ok,false);assert.equal(observed.status,'unresolved');assert.equal(observed.observedRevision,4);assert.equal(write(f).length,1);
f.render();const beforeRecheck=write(f).length;const recheckButton=f.walk(f.ui()).find(n=>n.props?.label==='Recheck account revision');assert.ok(recheckButton);assert.equal(await recheckButton.props.onPress(),false);f.render();assert.equal(f.actions.review.trustedSaveStatus,'unknown');assert.ok(JSON.stringify(f.ui()).includes('No save was repeated'));assert.equal(write(f).length,beforeRecheck);
// Explicit conflict rechecks stay read-only and preserve the current editor.
f=setup();assert.equal(await accept(f),true);f.accountRevision=8;edit(f,'Words retained after conflict');assert.equal(await f.actions.reviewAccountSave(),false);f.render();assert.equal(await f.actions.recheckAccountRevision(),false);f.render();assert.ok(f.actions.review.trustedRecheck.includes('compatible workspace review'));assert.equal(f.text,'Words retained after conflict');assert.equal(write(f).length,1);
assert.ok(f.requestLog.every(r=>r.path.startsWith('rpc/')),'No raw snapshot fallback');
console.log('PASS actual reply parent sequential saves use server-observed revisions 3 -> 4 -> 5 without changing local revision/payload; remote conflicts, source/hash changes, foreign metadata, unknown fields, typing, revocation, dirty fields and lost acknowledgements remain fail-closed. Inert IO, not hosted evidence.');
