import {mkdtempSync,mkdirSync,copyFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync,spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
const dir=mkdtempSync(join(tmpdir(),'busy-frozen-source-'));
try{
 mkdirSync(join(dir,'scripts/testing'),{recursive:true});copyFileSync('scripts/testing/regressions.py',join(dir,'scripts/testing/regressions.py'));
 const git=(...args)=>execFileSync('git',args,{cwd:dir,stdio:'pipe'});git('init');git('config','user.name','Synthetic source integrity test');git('config','user.email','synthetic@example.invalid');
 writeFileSync(join(dir,'scripts/testing/regressions.json'),JSON.stringify({checks:[{id:'source-change',args:['scripts/source-change.mjs']}]}));
 writeFileSync(join(dir,'scripts/source-change.mjs'),"import{execFileSync}from'node:child_process';import{writeFileSync}from'node:fs';writeFileSync('changed.txt','Synthetic changed source');execFileSync('git',['add','changed.txt']);execFileSync('git',['commit','-m','Synthetic source changed during successful check']);");git('add','.');git('commit','-m','Synthetic initial source');
 const result=spawnSync('python3',['scripts/testing/regressions.py','--output','evidence.json'],{cwd:dir,encoding:'utf8'});assert.equal(result.status,1,'Successful checks cannot hide a changed HEAD/tree');
 const {readFileSync}=await import('node:fs'),e=JSON.parse(readFileSync(join(dir,'evidence.json')));assert.equal(e.summary.passed,1);assert.equal(e.sourceStable,false);assert.notEqual(e.sourceSha,e.finalSourceSha);assert.notEqual(e.sourceTree,e.finalSourceTree);
 console.log('PASS actual original runner refuses success when HEAD/tree change during a passing check. Disposable Git fixture only.');
}finally{rmSync(dir,{recursive:true,force:true});}
