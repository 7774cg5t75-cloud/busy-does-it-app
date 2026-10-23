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
const receiver=fs.readFileSync('scripts/native-capture/receiver.py','utf8');assert.ok(receiver.includes("HTTPServer(('127.0.0.1',8765)"));assert.ok(receiver.includes("'simctl','io'"));assert.ok(receiver.includes("'screenshot'"));assert.ok(!receiver.includes('subprocess.run(self.path'));
console.log('PASS isolated screenshot transport never forwards native fetch, denies foreign hosts/actions, uses only fictional records; official integrity-locked packages, public standard runner, bounded PNG-only artifacts, untouched AppController and source provenance. This is not a native build or hosted security test.');

const stage=fs.readFileSync('scripts/native-capture/native_stage.py','utf8');
assert.ok(workflow.includes('native_stage.py build'));assert.ok(workflow.includes('native_stage.py test'));
assert.ok(workflow.indexOf('native_stage.py build') < workflow.indexOf('simulator.py'));
assert.ok(!workflow.includes(' test -quiet'));assert.ok(workflow.includes('timeout-minutes: 25'));assert.ok(workflow.includes('timeout-minutes: 5'));
for(const required of ['build-for-testing','test-without-building','ONLY_ACTIVE_ARCH=YES','ARCHS=x86_64','GCC_OPTIMIZATION_LEVEL=0','SWIFT_OPTIMIZATION_LEVEL=-Onone','testMidnightHome','signal.SIGKILL','nativeStages'])assert.ok(stage.includes(required));
assert.ok(receiver.includes('timeout=20'));assert.ok(!stage.includes('shell=True'));
console.log('PASS separated bounded native stages, single-architecture unoptimised embedded-JS build, no-build one-test execution, timeout process-group termination and exact stage receipts.');

assert.ok(workflow.indexOf('native_stage.py receiver-check') < workflow.indexOf('native_stage.py build'));
assert.ok(stage.includes('urllib.request.ProxyHandler({})'));assert.ok(stage.includes('receiver.poll()'));
assert.ok(stage.includes('receiver.returncode'));assert.ok(stage.includes('response.read(128)'));
assert.ok(!workflow.includes('capture-receiver.log'));assert.ok(receiver.includes('busy-native-capture-receiver-v1'));
console.log('PASS early loopback preflight, no external proxy routing, owned receiver process, visible startup errors and bounded identity check.');

assert.ok(stage.includes('secrets.token_hex(16)'));assert.ok(receiver.includes('BUSY_CAPTURE_RECEIVER_NONCE'));
