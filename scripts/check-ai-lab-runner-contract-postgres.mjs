import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
// Synthetic PostgreSQL semantics only: never executes the approved foundation or a hosted request.
const bin=process.env.BUSY_LOCAL_PG_BIN||'/workspace/pg17-disposable/root/usr/lib/postgresql/17/bin/psql';
const socket=process.env.BUSY_LOCAL_PG_SOCKET||'/workspace/pg17-disposable/socket';
const data=process.env.BUSY_LOCAL_PG_DATA||'/workspace/pg17-disposable/data';
const db='busy_ai_lab_runner_disposable',results=[];
const sql=(s,d=db)=>execFileSync(bin,['-X','-h',socket,'-U','postgres','-v','ON_ERROR_STOP=1','-qAt','-d',d],{input:s,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
const stage=(id,f)=>{try{f();results.push({id,passed:true});}catch(e){results.push({id,passed:false,error:String(e.stderr||e.stack)});throw e;}};
const denied=s=>assert.throws(()=>sql(s),e=>/division by zero/.test(String(e.stderr||e)));
try{
 stage('guarded-unix-only-pg17-and-approved-sql-bytes-unchanged',()=>{
  assert.ok(socket.startsWith('/')&&data.startsWith('/'),'Only an absolute local Unix-socket/data path is allowed');
  assert.equal(sql('SHOW listen_addresses','postgres'),'');assert.equal(sql('SHOW data_directory','postgres'),data);
  const version=Number(sql('SHOW server_version_num','postgres'));assert.ok(version>=170000&&version<180000);
  assert.equal(createHash('sha256').update(readFileSync('docs/sql-proposals/ai-lab-foundation/install.sql')).digest('hex'),'3ebf79cdcc5614d7be3573e0ecad68ae93ec8e5c3bf751fa2c0c6cbac5a9030b');
  sql('DROP DATABASE IF EXISTS '+db,'postgres');sql('CREATE DATABASE '+db,'postgres');sql('CREATE TABLE public.synthetic_runner_history(id text PRIMARY KEY);');
 });
 stage('single-runner-transaction-rolls-back-schema-when-history-fails',()=>{
  denied("BEGIN;CREATE TABLE public.atomic_probe(id int);INSERT INTO public.atomic_probe VALUES(1);INSERT INTO public.synthetic_runner_history VALUES((1/0)::text);COMMIT;");
  assert.equal(sql("SELECT to_regclass('public.atomic_probe') IS NULL"),'t');assert.equal(sql('SELECT count(*) FROM public.synthetic_runner_history'),'0');
 });
 stage('embedded-commit-counterexample-persists-schema-before-history-failure',()=>{
  denied("BEGIN;BEGIN;CREATE TABLE public.synthetic_early_commit(id int);INSERT INTO public.synthetic_early_commit VALUES(1);COMMIT;INSERT INTO public.synthetic_runner_history VALUES((1/0)::text);COMMIT;");
  assert.equal(sql('SELECT count(*) FROM public.synthetic_early_commit'),'1');assert.equal(sql('SELECT count(*) FROM public.synthetic_runner_history'),'0');
 });
}finally{
 mkdirSync('.test-artifacts/ai-lab-runner-contract',{recursive:true});
 const report={hosted:false,approvedFoundationExecuted:false,fuseRemoved:false,providerCalls:0,evidence:'Synthetic transaction-wrapper counterexample; not proof of the actual hosted implementation',results,summary:{passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length}};
 writeFileSync('.test-artifacts/ai-lab-runner-contract/postgres.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}
