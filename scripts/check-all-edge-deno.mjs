// Genuine compiler invocation, not syntax parsing or substitute provider types.
// Uses the reviewed pinned lockfile and the installed Deno check interface.
import {readdirSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const entries=readdirSync('supabase/functions',{withFileTypes:true}).filter(x=>x.isDirectory()&&existsSync('supabase/functions/'+x.name+'/index.ts')).map(x=>'supabase/functions/'+x.name+'/index.ts').sort();
if(entries.length!==25)throw Error('Edge entry inventory changed; update the explicit audit coverage before acceptance.');
const executable=process.env.BUSY_DENO_BINARY||'deno';
const args=['check','--frozen','--config','supabase/connected-staging.deno.json',...entries];
const result=spawnSync(executable,args,{encoding:'utf8',env:process.env,timeout:120000,maxBuffer:4000000});
mkdirSync('.test-artifacts/historical-audit-phase2',{recursive:true});
const exitCode=result.error?2:result.status??2;
writeFileSync('.test-artifacts/historical-audit-phase2/deno-runner.json',JSON.stringify({entries,args,exitCode,blocked:!!result.error,errorCode:result.error?.code??null,evidence:'Actual Deno with pinned real dependencies; no provider execution or hosted acceptance.'},null,2));
writeFileSync('.test-artifacts/historical-audit-phase2/deno-runner.log',(result.stdout||'')+(result.stderr||''));
console.log(JSON.stringify({entries:entries.length,exitCode,blocked:!!result.error}));process.exitCode=exitCode;
