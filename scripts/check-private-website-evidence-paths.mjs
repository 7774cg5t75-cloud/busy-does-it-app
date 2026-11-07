// Harmless local placeholders only. Never copy a hosted export into this test.
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {assertPrivateWebsiteEvidenceOutsideRepository as outside} from './lib/private-website-evidence-paths.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),temp=mkdtempSync(resolve(tmpdir(),'busy-private-evidence-guard-'));
let passed=0;
const test=(name,run)=>{run();passed++;console.log('PASS '+name);};
const rejectCli=(script,args)=>{const r=spawnSync(process.execPath,[script,...args],{cwd:root,encoding:'utf8',timeout:20000});assert.equal(r.error,undefined);assert.notEqual(r.status,0);assert.match(r.stderr,/Private hosted source and evidence must remain outside the public repository/);};
try{
 const input=resolve(temp,'input.json');writeFileSync(input,'{}',{mode:0o600});
 const inside=resolve(root,'..private-output');
 test('actual sibling and parent paths are outside the repository',()=>{outside(root,temp,resolve(root,'..','owner-private'));});
 test('repository root and ordinary descendants are denied',()=>{for(const p of [root,resolve(root,'private-output')])assert.throws(()=>outside(root,p));});
 test('two-dot filename and directory prefixes remain inside the repository',()=>{for(const p of [inside,resolve(inside,'input.json'),resolve(root,'...','input.json')])assert.throws(()=>outside(root,p));});
 test('relative arguments cannot bypass the private path predicate',()=>{assert.throws(()=>outside(root,'../private'));assert.throws(()=>outside('.',temp));});
 test('baseline builder denies a two-dot-prefixed in-repository output before reading data',()=>{rejectCli('scripts/build-hosted-website-baseline.mjs',['--input='+input,'--output='+inside]);});
 test('baseline builder denies an in-repository input before reading data',()=>{rejectCli('scripts/build-hosted-website-baseline.mjs',['--input='+resolve(inside,'input.json'),'--output='+resolve(temp,'new')]);});
 test('browser capture denies a two-dot-prefixed in-repository source before launching Chromium',()=>{rejectCli('scripts/capture-hosted-website-baseline.mjs',['--folder='+inside]);});
 for(const key of ['before','after','output'])test('review viewer denies an in-repository '+key+' boundary before reading data',()=>{const args={before:temp,after:temp,output:resolve(temp,'new')};args[key]=inside;rejectCli('scripts/build-hosted-website-review-index.mjs',Object.entries(args).map(([k,v])=>'--'+k+'='+v));});
}finally{rmSync(temp,{recursive:true,force:true});}
console.log(JSON.stringify({passed,failed:0,hostedRecordsRead:0,hostedWrites:0,providerCalls:0,privateSourceCopiedIntoRepository:false}));
