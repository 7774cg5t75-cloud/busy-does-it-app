import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {launchFixtureBrowser} from './testing/browser-policy.mjs';
let calls=0;const instance={fictional:true};
const result=await launchFixtureBrowser({launch:async options=>{
 calls++;assert.equal(options.chromiumSandbox,true);assert.equal(options.headless,true);
 assert.ok(options.args.every(arg=>!['--no-sandbox','--disable-setuid-sandbox','--single-process'].includes(arg)));
 return instance;
}});assert.equal(result,instance);assert.equal(calls,1);
await assert.rejects(launchFixtureBrowser({launch:async()=>{calls++;throw Error('Sandbox unavailable');}}),/Sandbox unavailable/);assert.equal(calls,2,'No unsandboxed retry/fallback');
const lock=JSON.parse(readFileSync('scripts/browser-tools/package-lock.json','utf8'));
assert.equal(lock.packages[''].dependencies.playwright,'1.58.2');
for(const [path,item]of Object.entries(lock.packages)){if(!path)continue;assert.match(item.resolved,/^https:\/\/registry\.npmjs\.org\//);assert.ok(item.integrity);assert.ok(['Apache-2.0','MIT'].includes(item.license));}
console.log('PASS actual browser launch policy uses sandbox and propagates startup failure without fallback; optional existing-version registry/integrity/license lock. Injected launch only, no Chromium executed.');
