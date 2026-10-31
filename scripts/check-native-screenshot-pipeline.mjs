import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{createFixture,install,BUSINESS}=require('./native-capture/transport.cjs');
const host='https://qgkmuiipicazmcxxmoxv.supabase.co',f=createFixture();
await assert.rejects(f('https://unrelated.example/'));await assert.rejects(f('http://qgkmuiipicazmcxxmoxv.supabase.co/'));
assert.equal((await f(host+'/auth/v1/token',{method:'POST',body:'{}'})).status,403);
let auth=await f(host+'/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:'capture@example.invalid',password:'FictionalOnly123!'})});assert.equal((await auth.json()).access_token,'synthetic-capture-not-a-jwt');
const path='/rest/v1/busy_business_snapshots?business_id=eq.'+BUSINESS;
let row=(await (await f(host+path)).json())[0];assert.deepEqual(row.payload.customers,[]);assert.match(row.payload.businessName,/Fictional.*fixture/);
assert.equal((await f(host+path+'&revision=eq.99',{method:'PATCH',body:JSON.stringify({revision:100,schema_version:1})})).status,409);
assert.equal((await f(host+'/rest/v1/busy_business_snapshots?business_id=eq.foreign')).status,403);
assert.equal((await f(host+'/functions/v1/busy-social-publish',{method:'POST'})).status,403);
const old={fetch:global.fetch,XMLHttpRequest:global.XMLHttpRequest,WebSocket:global.WebSocket};let calls=0;global.fetch=()=>{calls++;throw Error('Must not reach native fetch');};install();await global.fetch(host+path);assert.throws(()=>new global.XMLHttpRequest());assert.throws(()=>new global.WebSocket());assert.equal(calls,0);Object.assign(global,old);
const lock=JSON.parse(fs.readFileSync('scripts/native-capture/package-lock.json'));assert.deepEqual(lock.packages[''].dependencies,JSON.parse(fs.readFileSync('package.json')).dependencies);for(const [name,p] of Object.entries(lock.packages)){if(!name)continue;assert.ok(p.resolved.startsWith('https://registry.npmjs.org/'));assert.ok(p.integrity.startsWith('sha512-'));}
const workflow=fs.readFileSync('.github/workflows/native-screenshots.yml','utf8');assert.ok(workflow.includes('runs-on: macos-15-intel'));assert.ok(workflow.includes('github.event.repository.private == false'));assert.ok(workflow.includes('persist-credentials: false'));assert.ok(workflow.includes('retention-days: 1'));assert.ok(workflow.includes("steps.artifacts.outputs.safe == 'true'"));assert.ok(!workflow.includes('secrets.'));assert.ok(!workflow.includes('eas build'));assert.ok(!workflow.includes('--no-sandbox'));assert.ok(!workflow.includes('pull_request_target'));assert.ok(fs.readFileSync('scripts/native-capture/native_stage.py','utf8').includes('CODE_SIGNING_ALLOWED=NO'));assert.ok(workflow.includes('npm ci --ignore-scripts'));
const prep=fs.readFileSync('scripts/native-capture/prepare.py','utf8');assert.ok(prep.includes("'merge-base','--is-ancestor'"));assert.ok(!prep.includes('AppController.js'));assert.ok(prep.includes('entryOriginalSha256'));assert.ok(prep.includes('productionUIAndControllerUnmodified'));
console.log('PASS isolated screenshot transport never forwards native fetch, denies foreign hosts/actions, uses only fictional records; official integrity-locked packages, public standard runner, bounded PNG-only artifacts, untouched AppController and source provenance. This is not a native build or hosted security test.');

const stage=fs.readFileSync('scripts/native-capture/native_stage.py','utf8');
assert.ok(workflow.includes('native_stage.py build'));assert.ok(workflow.includes('native_stage.py test'));
assert.ok(workflow.indexOf('native_stage.py build') < workflow.indexOf('simulator.py'));
assert.ok(!workflow.includes(' test -quiet'));assert.ok(workflow.includes('timeout-minutes: 25'));assert.ok(workflow.includes('timeout-minutes: 5'));
for(const required of ['build-for-testing','test-without-building','ONLY_ACTIVE_ARCH=YES','ARCHS=x86_64','GCC_OPTIMIZATION_LEVEL=0','SWIFT_OPTIMIZATION_LEVEL=-Onone','testMidnightHome','signal.SIGKILL','nativeStages'])assert.ok(stage.includes(required));
assert.ok(!stage.includes('shell=True'));
console.log('PASS separated bounded native stages, single-architecture unoptimised embedded-JS build, no-build one-test execution, timeout process-group termination and exact stage receipts.');

const swift=fs.readFileSync('scripts/native-capture/CaptureTests.swift','utf8');
const exporter=fs.readFileSync('scripts/native-capture/export_attachments.py','utf8');
for(const text of [workflow,stage,swift,exporter,fs.readFileSync('scripts/native-capture/project.rb','utf8')]){
 for(const forbidden of ['127.0.0.1','HTTPServer','URLSession','ProxyHandler','receiver-check','NSAllowsLocalNetworking'])assert.ok(!text.includes(forbidden),forbidden);
}
assert.ok(!fs.existsSync('scripts/native-capture/receiver.py'));assert.ok(!fs.existsSync('scripts/native-capture/check_receiver_local.py'));
for(const required of ['app.launch()','capture@example.invalid','FictionalOnly123!','tap("Sign in")','waitForExistence(timeout:60)','isHittable','XCTAttachment(screenshot: app.screenshot())','.keepAlways','add(attachment)','__BUSY_CAPTURE_SOURCE_SHA__'])assert.ok(swift.includes(required),required);
assert.ok(prep.includes("ui_source.replace('__BUSY_CAPTURE_SOURCE_SHA__',source)"));
assert.ok(workflow.includes('export_attachments.py --check-tool'));assert.ok(workflow.includes('run: python3 scripts/native-capture/export_attachments.py\n'));
assert.ok(workflow.includes("if: success() && steps.artifacts.outputs.safe == 'true'"));assert.ok(!workflow.includes('if: always()'));
assert.ok(workflow.includes('- scripts/native-capture/request.json'));assert.ok(!workflow.includes('- .github/workflows/native-screenshots.yml'));assert.ok(!workflow.includes('schedule:'));
for(const required of ["'xcresulttool', 'export', 'attachments'","'--test-id', TEST_ID",'timeout=60','fixtureTransportSha256','uiTestCompiledSha256','png_dimensions','isAssociatedWithFailure','safe=true'])assert.ok(exporter.includes(required),required);
assert.ok(fs.existsSync('scripts/native-capture/check_attachments.py'));assert.ok(workflow.includes('run: python3 scripts/native-capture/check_attachments.py'));
console.log('PASS source-bound retained XCTest PNG, scoped Apple export, exact original UI/fictional guards, fail-closed upload allowlist and request-only trigger. No native run executed.');

assert.ok(workflow.includes('EXPO_PUBLIC_BUSY_ENVIRONMENT: owner-preview'));
assert.ok(workflow.includes('BUSY_BUILD_PROFILE: owner-preview'));
const selected=swift.slice(swift.indexOf('func testMidnightHome()'),swift.indexOf('func testHomeAppearances()'));
assert.ok(selected.includes('offline-owner-preview-launch'));assert.ok(!selected.includes('signInToOriginalHome()'));
for(const name of ['home-midnight','results-before-drag','results-after-drag','about-build'])assert.ok(exporter.includes(name));
for(const name of ['busy-floating-assistant','busy-dock-assistant','About Busy Does It'])assert.ok(selected.includes(name));
assert.ok(selected.includes('thenDragTo:target'));assert.ok(selected.includes('Returning to Results must retain'));
console.log('PASS actual offline Owner Preview capture route, explicit floating/dock separation and finite source-bound four-image allowlist. Native execution still required.');
