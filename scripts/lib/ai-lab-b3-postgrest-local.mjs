import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
import {existsSync,mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {createHash,createHmac,randomBytes} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {createServer} from 'node:net';

export const POSTGREST_PIN=Object.freeze({version:'14.18',sha256:'e62299f98f67938f754291340b2fc07b69685546e6017b455ef3e776daef45ee'});
export const quote=value=>value==null?'NULL':"'"+(typeof value==='object'?JSON.stringify(value):String(value)).replaceAll("'","''")+"'";
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const port=value=>{const n=Number(value);assert.ok(Number.isSafeInteger(n)&&n>1024&&n<65536,'A nonprivileged local port is required');return n;};
async function freePort(n){await new Promise((resolve,reject)=>{const server=createServer();server.once('error',reject);server.listen(n,'127.0.0.1',()=>server.close(resolve));});}
const digest=buffer=>createHash('sha256').update(buffer).digest('hex');

// Only a newly created private cluster is ever controlled or removed. No target
// URI, existing data directory, hosted key or arbitrary outbound URL is accepted.
export async function startB3LocalPostgrest(){
 const pgDir=process.env.BUSY_LOCAL_PG_BIN_DIR||(process.env.BUSY_LOCAL_PG_BIN?dirname(process.env.BUSY_LOCAL_PG_BIN):existsSync('/usr/lib/postgresql/17/bin/initdb')?'/usr/lib/postgresql/17/bin':'/workspace/pg17-disposable/root/usr/lib/postgresql/17/bin');
 const executable=process.env.POSTGREST_BIN||'/workspace/b3-postgrest-tools/postgrest';
 assert.equal(digest(readFileSync(executable)),POSTGREST_PIN.sha256,'Only the pinned official PostgREST binary may run');
 assert.match(execFileSync(executable,['--version'],{encoding:'utf8',timeout:3000}),/PostgREST 14\.18\b/);
 assert.match(execFileSync(join(pgDir,'postgres'),['--version'],{encoding:'utf8',timeout:3000}),/PostgreSQL\) 17\./);
 const pgPort=port(process.env.BUSY_B3_POSTGREST_PG_PORT||55485),httpPort=port(process.env.BUSY_B3_POSTGREST_HTTP_PORT||3045);
 await freePort(pgPort);await freePort(httpPort);
 const root=mkdtempSync(join(tmpdir(),'busy-b3-pgrst-')),data=join(root,'data'),socket=join(root,'socket');mkdirSync(socket);
 const database='busy_b3_http_fixture',secret=randomBytes(48).toString('hex');let pgStarted=false,child=null;
 const command=(name,args,options={})=>execFileSync(join(pgDir,name),args,{encoding:'utf8',timeout:15000,stdio:['pipe','pipe','pipe'],...options});
 const psqlArgs=['-X','-h',socket,'-p',String(pgPort),'-U','postgres','-v','ON_ERROR_STOP=1','-qAt','-d',database];
 const sql=(statement,{atomic=true,db=database}={})=>command('psql',[...psqlArgs.slice(0,-1),db],{input:atomic?'BEGIN;\n'+statement+';\nCOMMIT;\n':statement,maxBuffer:32*1024*1024}).trim();
 const stopHttp=async()=>{
  if(!child)return;const owned=child;child=null;
  // The child handle belongs to this invocation. Bound shutdown even if a
  // pre-fix PostgREST transaction is stuck retrying.
  owned.kill('SIGTERM');await Promise.race([new Promise(resolve=>owned.once('exit',resolve)),delay(300)]);
  if(owned.exitCode===null&&owned.signalCode===null){owned.kill('SIGKILL');await Promise.race([new Promise(resolve=>owned.once('exit',resolve)),delay(500)]);}
  // Every backend in this newly created cluster is a local synthetic fixture.
  sql("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE usename='b3_authenticator' AND pid<>pg_backend_pid()",{db:'postgres'});
 };
 const cleanup=async()=>{try{await stopHttp();}finally{if(pgStarted&&existsSync(join(data,'postmaster.pid')))command('pg_ctl',['-D',data,'-m','immediate','-w','-t','8','stop']);rmSync(root,{recursive:true,force:true});}};
 try{
  // initdb refuses root by design; CI and managed Codex run as ordinary users.
  assert.notEqual(process.getuid?.(),0,'Run this self-owned local fixture as an ordinary user');
  command('initdb',['-D',data,'--username=postgres','--auth=trust','--encoding=UTF8','--no-locale']);
  // Mark ownership before startup so even a partial startup failure attempts
  // shutdown. Never remove a live cluster if its own pg_ctl cannot stop it.
  pgStarted=true;command('pg_ctl',['-D',data,'-l',join(root,'postgres.log'),'-w','-t','10','-o',`-h 127.0.0.1 -p ${pgPort} -k ${socket} -c max_connections=25 -c deadlock_timeout=100ms -c log_min_messages=warning -c log_error_verbosity=terse`,'start']);
  sql('CREATE DATABASE '+database,{atomic:false,db:'postgres'});
  sql('CREATE ROLE anon NOLOGIN;CREATE ROLE authenticated NOLOGIN;CREATE ROLE service_role NOLOGIN BYPASSRLS;CREATE ROLE b3_authenticator LOGIN NOINHERIT;GRANT anon,authenticated,service_role TO b3_authenticator;');
  const jwt=(role,sub,extra={})=>{const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');const body=encode({alg:'HS256',typ:'JWT'})+'.'+encode({role,...(sub?{sub}:{}),aud:'authenticated',iat:Math.floor(Date.now()/1000)-1,exp:Math.floor(Date.now()/1000)+3600,...extra});return body+'.'+createHmac('sha256',secret).update(body).digest('base64url');};
  const url='http://127.0.0.1:'+httpPort;
  const http=async(path,{token,body={},method='POST',deadlineMs=6000,headers={}}={})=>{
   assert.ok(path.startsWith('/')&&!path.startsWith('//'));
   const began=performance.now(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),deadlineMs);
   try{const response=await fetch(url+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...headers},body:method==='GET'?undefined:JSON.stringify(body),signal:controller.signal,redirect:'error'});const text=await response.text();let json;try{json=JSON.parse(text);}catch{json=null;}return {status:response.status,json,elapsedMs:Math.round(performance.now()-began),headers:response.headers};}finally{clearTimeout(timer);}
  };
  const startHttp=async()=>{
   assert.equal(child,null);const config=join(root,'postgrest.conf');
   writeFileSync(config,`db-uri = "postgresql://b3_authenticator@127.0.0.1:${pgPort}/${database}?application_name=b3_owned_postgrest"\ndb-schemas = "public"\ndb-anon-role = "anon"\ndb-pool = 6\njwt-secret = "${secret}"\nserver-host = "127.0.0.1"\nserver-port = ${httpPort}\nlog-level = "crit"\n`);
   // Configuration can target only this invocation's cluster. Inherited
   // PostgREST overrides must never redirect the fixture or expose its port.
   const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('PGRST_')));
   child=spawn(executable,[config],{stdio:['ignore','ignore','ignore'],env});
   const began=Date.now();let ready=false;
   while(Date.now()-began<8000){if(child.exitCode!==null)throw Error('Owned local PostgREST exited during startup');try{const r=await http('/',{method:'GET',deadlineMs:300});if(r.status===200){ready=true;break;}}catch{}await delay(75);}
   assert.equal(ready,true,'Owned local PostgREST did not become ready');
  };
  const session=(name)=>{
   assert.match(name,/^[a-z0-9_]+$/);const proc=spawn(join(pgDir,'psql'),psqlArgs,{stdio:['pipe','ignore','pipe'],env:{...process.env,PGAPPNAME:name}});let stderr='';proc.stderr.on('data',b=>{stderr=(stderr+b).slice(-4000);});proc.stdin.on('error',()=>{});
   return {write:statement=>proc.stdin.write(statement+';\n'),finish:async()=>{proc.stdin.end('ROLLBACK;\n');await Promise.race([new Promise(resolve=>proc.once('exit',resolve)),delay(700)]);if(proc.exitCode===null&&proc.signalCode===null)proc.kill('SIGKILL');},get stderr(){return stderr;}};
  };
  const waitSql=async(statement,expected='t',ms=3500)=>{const began=Date.now();while(Date.now()-began<ms){if(sql(statement)===expected)return;await delay(30);}throw Error('Local synchronization deadline exceeded');};
  return {sql,jwt,http,startHttp,stopHttp,cleanup,session,waitSql,database,pgPort,httpPort,log:()=>readFileSync(join(root,'postgres.log'),'utf8'),binary:{...POSTGREST_PIN,postgres:command('postgres',['--version']).trim()}};
 }catch(error){await cleanup();throw error;}
}
