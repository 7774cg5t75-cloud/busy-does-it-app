import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyMessageReceipt} from '../supabase/functions/busy-mini-apps/messageReceiptV3205.mjs';
import {verifyOwnerRequestFreshnessV3231} from '../supabase/functions/busy-mini-apps/ownerRequestFreshnessV3231.mjs';
import {proposeCoordinatedAppChanges} from '../src/core/appCoordinatedStudio.mjs';
import {executeAppDraftMutation} from '../src/core/appDraftMutation.mjs';
import {connectedStagingAction} from '../supabase/functions/_shared/connectedStagingActions.mjs';
import {canonicalPrivateActivation} from './lib/connected-activation-package.mjs';
import {runConnectedAcceptance,connectedAcceptancePlan} from './lib/connected-hosted-acceptance.mjs';
const B='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',O='cccccccc-cccc-4ccc-8ccc-cccccccccccc',R='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
assert.equal(classifyMessageReceipt({}).ok,false);assert.equal(verifyOwnerRequestFreshnessV3231({}).ok,false);
const config={surface:'busy_mini_app',display:{name:'Fictional test'},publicProfile:{tagline:'Before'},modules:[{key:'business_profile',enabled:true}],navigation:['business_profile']};
const failed=proposeCoordinatedAppChanges(config,[{kind:'not-an-edit'}]);assert.equal(failed.ok,false);assert.ok(failed.reason);assert.equal(failed.nextConfig,undefined);
const proposed=proposeCoordinatedAppChanges(config,[{kind:'text',field:'tagline',value:'After'}]);assert.equal(proposed.ok,true);assert.ok(proposed.changes.length);assert.ok(proposed.undoOperations.length);assert.equal(proposed.nextConfig.publicProfile.tagline,'After');
const app={id:R,business_id:B,draft_revision:2,draft_config:config};
assert.equal((await executeAppDraftMutation({action:'build_draft',payload:{expectedNoExistingApp:true},scope:{userId:O,businessId:B,app:null},isCurrent:()=>true,send:async()=>({ok:true,app,status:{app}})})).app.draft_revision,2);
await assert.rejects(()=>executeAppDraftMutation({action:'build_draft',payload:{expectedNoExistingApp:true},scope:{userId:O,businessId:B,app:null},isCurrent:()=>true,send:async()=>({ok:true,app:{...app,draft_revision:1},status:{app:{...app,draft_revision:1}}})}),/receipt/);
for(const action of ['publish','submit_request','send_request_message','confirm_booking','prepare_preview','plan_app','staging_synthetic_round_trip','unknown'])for(const enabled of ['true','false',undefined])assert.equal(connectedStagingAction({projectUrl:'https://pnjdlogwegnqbsfpcofw.supabase.co',enabled,domain:'app',action}).allowed,false);
const packageValue=canonicalPrivateActivation(process.cwd());assert.equal(packageValue.targetProject,'pnjdlogwegnqbsfpcofw');assert.equal(packageValue.autoExecute,false);assert.equal((packageValue.sql.match(/^BEGIN;/gm)||[]).length,1);assert.equal((packageValue.sql.match(/^COMMIT;/gm)||[]).length,1);assert.ok(packageValue.sql.indexOf('CREATE TABLE')<packageValue.sql.indexOf('PRIVATE WORK')||packageValue.sql.includes('CREATE TABLE'));assert.match(packageValue.sql,/Later lifecycle unexpectedly exposed/);assert.match(packageValue.sql,/RAISE EXCEPTION 'ATOMIC PRIVATE WORK REVIEW FUSE/);
let network=0;for(const bad of [{},{approval:'yes'},{approval:'MUTATE_FICTIONAL_STAGING:'+'a'.repeat(40),fictionalOnly:false}]){
 const r=await runConnectedAcceptance(bad,{sourceSha:'a'.repeat(40),fetchImpl:()=>{network++;throw Error('No request allowed');}});assert.equal(r.status,'blocked');assert.equal(r.networkAttempted,false);
}
await assert.rejects(()=>runConnectedAcceptance({approval:'MUTATE_FICTIONAL_STAGING:'+'a'.repeat(40),fictionalOnly:true,url:'https://qgkmuiipicazmcxxmoxv.supabase.co'},{sourceSha:'a'.repeat(40),fetchImpl:()=>{network++;}}));assert.equal(network,0);assert.equal(connectedAcceptancePlan().usesServiceKey,false);
const source=readFileSync('supabase/functions/busy-mini-apps/index.ts','utf8');assert.ok(!source.includes('@ts-ignore')&&!source.includes('@ts-nocheck'));assert.ok(!source.includes('select(associated?'));assert.ok(!source.includes('fresh:{ok:true,...fresh}'));assert.ok(source.includes('scopedOwnerStatus'));
console.log('PASS original helper discriminants, exact reviewed revision-2 receipt, unchanged legacy receipt fences, closed staging action catalogue, one-transaction private Work ACL closure and default-denied real Auth acceptance runner. No hosted mutation or compiler claim from this test.');
