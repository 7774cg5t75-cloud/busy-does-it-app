#!/usr/bin/env python3
"""Explicit disposable-local PostgreSQL rehearsal. No downloads or hosted URLs.
Original private functions must be supplied separately; never copied to output/Git.
"""
import argparse,json,os,pathlib,subprocess,time,hashlib
p=argparse.ArgumentParser();p.add_argument('--bin-dir',required=True);p.add_argument('--socket',required=True);p.add_argument('--original-functions',required=True);p.add_argument('--output',required=True);p.add_argument('--allow-disposable-reset',action='store_true');a=p.parse_args()
assert a.allow_disposable_reset,'Explicit disposable reset required'
assert pathlib.Path(a.socket).is_absolute() and a.socket.startswith(('/tmp/','/workspace/')) and pathlib.Path(a.socket).is_dir(),'Local Unix socket only'
root=pathlib.Path(__file__).resolve().parents[2];os.chdir(root)
base=[str(pathlib.Path(a.bin_dir)/'psql'),'-X','-h',a.socket,'-U','postgres','-v','ON_ERROR_STOP=1'];db='busy_phase58_disposable';results=[]
def call(sql,database=db):return subprocess.run(base+['-d',database],input=sql,text=True,capture_output=True,timeout=20)
def stage(name,sql,database=db,expected=0,private=False):
 r=call(sql,database);ok=(r.returncode==expected if expected==0 else r.returncode!=0);results.append({'id':name,'passed':ok,'exitCode':r.returncode,'expectedFailure':expected!=0,'output':('private definitions withheld' if private else r.stdout+r.stderr)});return ok
B='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';O='cccccccc-cccc-4ccc-8ccc-cccccccccccc';M='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
def auth(sql,uid=O,role='authenticated'):return f"BEGIN; SET LOCAL ROLE {role}; SET LOCAL request.jwt.claim.sub='{uid}';\n{sql}\nROLLBACK;"
def reject(sql,code='40001'):return f"DO $test$ BEGIN BEGIN {sql}; RAISE EXCEPTION 'Expected denial missing'; EXCEPTION WHEN SQLSTATE '{code}' THEN NULL; END; END $test$;"
reply=f"(SELECT payload->'customers'->0->'privateEnquiryReply' FROM public.busy_business_snapshots WHERE business_id='{B}')"
news=f"(SELECT payload->'socialDrafts'->0 FROM public.busy_business_snapshots WHERE business_id='{B}')"
def rpc(op='private_reply_remove',rev=1,target='alex',record=None,tail=''):
 return f"PERFORM public.busy_snapshot_private_mutation_v1('{B}',{rev},1,'{op}','{target}',{record or reply}{tail})"
try:
 location=subprocess.check_output(base+['-At','-d','postgres','-c','SHOW data_directory'],text=True).strip()
 assert pathlib.Path(location).resolve()==(pathlib.Path(a.socket).parent/'data').resolve(),'Refusing a server outside this dedicated disposable cluster'
 stage('reset-disposable',f'DROP DATABASE IF EXISTS {db}; CREATE DATABASE {db};','postgres')
 fixture=(root/'staging/phase58-snapshot/fixture.sql').read_text()
 # Roles survive a database reset in this deliberately dedicated cluster.
 existing=call("SELECT rolname FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role')",'postgres').stdout
 for role in ['anon','authenticated','service_role']:
  if role in existing: fixture='\n'.join(l for l in fixture.splitlines() if not l.startswith('CREATE ROLE '+role+' '))
 if not stage('original-schema-fixture-and-loss-demonstration',fixture):raise RuntimeError('Fixture failed')
 if not stage('candidate-writer-load',(root/'docs/sql-proposals/phase58-snapshot/writer.sql').read_text()):raise RuntimeError('Writer failed')
 fence=(root/'docs/sql-proposals/phase58-snapshot/fence.sql').read_text()
 stage('production-fuse-aborts',fence,expected=1)
 rehearsal='\n'.join(l for l in fence.splitlines() if not l.startswith("DO $$ BEGIN RAISE EXCEPTION 'PHASE58 REVIEW FUSE"))
 if not stage('reviewed-disposable-fence-load',rehearsal):raise RuntimeError('Fence failed')
 stage('original-prepared-assertions',"BEGIN;\n"+(root/'staging/phase58-snapshot/assertions.sql').read_text()+"\nROLLBACK;")
 stage('provisioning-role-rls-harness',(root/'staging/phase59-snapshot/provisioning-harness.sql').read_text())
 stage('private-exact-observed-function-load',pathlib.Path(a.original_functions).read_text(),private=True)
 stage('original-invoker-bootstrap',auth("DO $test$ DECLARE v record; BEGIN SELECT * INTO v FROM public.busy_ensure_business('Synthetic new business'); IF v.member_role<>'owner' OR NOT EXISTS(SELECT 1 FROM public.busy_business_snapshots WHERE business_id=v.business_id AND payload='{}' AND revision=1) THEN RAISE EXCEPTION 'Bootstrap failed'; END IF; END $test$;",uid='ffffffff-ffff-4fff-8fff-ffffffffffff'))
 stage('existing-business-missing-row-not-recreated',auth("DO $test$ DECLARE v record; BEGIN SELECT * INTO v FROM public.busy_ensure_business(NULL); IF EXISTS(SELECT 1 FROM public.busy_business_snapshots WHERE business_id=v.business_id) THEN RAISE EXCEPTION 'Unexpected repair'; END IF; END $test$;",uid='dddddddd-dddd-4ddd-8ddd-dddddddddddd'))
 stage('privacy-gap-member-can-read-owner-text',auth(f"DO $test$ BEGIN IF (SELECT payload->'customers'->0->'privateEnquiryReply'->>'text' FROM public.busy_business_snapshots WHERE business_id='{B}') IS DISTINCT FROM 'Owner words' THEN RAISE EXCEPTION 'Expected existing read exposure'; END IF; END $test$;",uid=M))
 stage('member-write-denied',auth(reject(rpc(), '42501'),uid=M))
 stage('cross-business-write-denied',auth(reject(rpc(),'42501'),uid='dddddddd-dddd-4ddd-8ddd-dddddddddddd'))
 stage('missing-identity-denied',auth(reject(rpc(),'42501'),uid=''))
 stage('stale-revision-denied',auth(reject(rpc(rev=2))))
 stage('unsupported-operation-denied',auth(reject(rpc(op='replace_payload'),'22023')))
 stage('missing-target-denied',auth(reject(rpc(target='missing'),'22023')))
 stage('wrong-expected-record-denied',auth(reject(rpc(record="'{}'::jsonb"))))
 for role in ['authenticated','service_role']:
  stage(role+'-direct-update-denied',auth(reject(f"UPDATE public.busy_business_snapshots SET payload='{{}}'",'42501'),role=role))
  stage(role+'-full-insert-denied',auth(reject(f"INSERT INTO public.busy_business_snapshots(business_id,payload) VALUES('{B}','{{}}')",'42501'),role=role))
 stage('private-helper-not-callable',auth(reject(f"PERFORM busy_snapshot_private.lock_writer('{B}')",'42501')))
 stage('private-text-and-unknown-fields-preserved',auth(f"DO $test$ DECLARE before jsonb; after jsonb; r jsonb; BEGIN SELECT payload INTO before FROM public.busy_business_snapshots WHERE business_id='{B}'; r:=public.busy_snapshot_private_mutation_v1('{B}',1,1,'private_reply_edit_text','alex',before->'customers'->0->'privateEnquiryReply','Reviewed new words',(before->'customers'->0->'privateEnquiryReply'->>'sourceStamp')::jsonb); SELECT payload INTO after FROM public.busy_business_snapshots WHERE business_id='{B}'; IF after IS DISTINCT FROM jsonb_set(before,'{{customers,0,privateEnquiryReply,text}}','\"Reviewed new words\"') OR r->>'revision'<>'2' THEN RAISE EXCEPTION 'Unrelated data lost'; END IF; END $test$;"))
 stage('newsletter-explicit-remove-preserves-rest',auth(f"DO $test$ DECLARE before jsonb; after jsonb; BEGIN SELECT payload INTO before FROM public.busy_business_snapshots WHERE business_id='{B}'; {rpc('newsletter_remove',target='newsletter',record=news)}; SELECT payload INTO after FROM public.busy_business_snapshots WHERE business_id='{B}'; IF after IS DISTINCT FROM jsonb_set(before,'{{socialDrafts}}','[]') THEN RAISE EXCEPTION 'Unrelated loss'; END IF; END $test$;"))
 stage('deletion-no-stale-resurrection',auth(f"DO $test$ DECLARE saved jsonb:={reply}; BEGIN {rpc(record='saved')}; BEGIN {rpc(record='saved')}; RAISE EXCEPTION 'Replay escaped'; EXCEPTION WHEN serialization_failure THEN NULL; END; END $test$;"))
 # Catalogue/source invalidation, malformed/unknown versions and duplicate targets.
 for name,mutation,code in [('unsupported-private-version',"jsonb_set(payload,'{customers,0,privateEnquiryReply,version}','3')",'40001'),('duplicate-customer',"jsonb_set(payload,'{customers}',(payload->'customers')||(payload->'customers'))",'22023')]:
  stage(name,f"BEGIN; UPDATE public.busy_business_snapshots SET payload={mutation} WHERE business_id='{B}'; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='{O}'; {reject(rpc(),code)} ROLLBACK;")
 # Two real connections: hold one transaction open and observe blocked contender.
 def race(name,holder_sql,contender_sql,expect_contender_ok):
  holder=subprocess.Popen(base+['-d',db,'-q'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,bufsize=1)
  holder.stdin.write(holder_sql+"\n\\echo PHASE59_LOCKED\n");holder.stdin.flush()
  ready=False
  for line in holder.stdout:
   if 'PHASE59_LOCKED' in line:ready=True;break
  if not ready:raise RuntimeError('Holder did not reach lock checkpoint')
  contender=subprocess.Popen(base+['-d',db],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
  contender.stdin.write("SET statement_timeout='5s';\n"+contender_sql);contender.stdin.close()
  time.sleep(0.2);blocked=contender.poll() is None
  holder.stdin.write('COMMIT;\n\\q\n');holder.stdin.flush();holder.stdin.close();holder.wait(timeout=8);contender.wait(timeout=8)
  out=contender.stdout.read()+contender.stderr.read();ok=blocked and holder.returncode==0 and ((contender.returncode==0) if expect_contender_ok else (contender.returncode!=0 and 'Not authorised' in out))
  results.append({'id':name,'passed':ok,'exitCode':contender.returncode,'holderExitCode':holder.returncode,'blockedUntilRelease':blocked,'expectedDenial':not expect_contender_ok,'output':out})
 saved_before_removal=subprocess.check_output(base+['-At','-d',db,'-c',f"SELECT {reply}"],text=True).strip()
 saved_literal="'"+saved_before_removal.replace("'","''")+"'::jsonb"
 race('revocation-wins-before-writer',f"BEGIN; DELETE FROM public.busy_business_memberships WHERE business_id='{B}' AND user_id='{O}';",auth("DO $test$ BEGIN "+rpc()+"; END $test$;"),False)
 call(f"INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES('{B}','{O}','owner');")
 # A committed writer holds authority until its transaction releases; revoker then wins.
 race('writer-serializes-before-revocation',f"BEGIN; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='{O}'; DO $test$ BEGIN {rpc()}; END $test$;",f"DELETE FROM public.busy_business_memberships WHERE business_id='{B}' AND user_id='{O}';",True)
 call(f"INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES('{B}','{O}','owner');")
 stage('committed-removal-no-resurrection',auth(reject(rpc(record=saved_literal))))
 # Fail-closed rollback must not restore direct writer powers.
 stage('readonly-rollback-load',(root/'docs/sql-proposals/phase58-snapshot/rollback-readonly.sql').read_text())
 stage('rollback-rpc-denied',auth(reject(rpc(),'42501')))
 stage('rollback-legacy-still-denied',auth(reject("UPDATE public.busy_business_snapshots SET payload='{}'",'42501')))
except Exception as e:results.append({'id':'runner','passed':False,'error':str(e)})
finally:
 data={'database':'local synthetic Unix-socket PostgreSQL; mock UID, not real Supabase Auth','results':results,'summary':{'passed':sum(x['passed'] for x in results),'failed':sum(not x['passed'] for x in results),'blocked':0,'unexecuted':0},'originalFunctionsSha256':hashlib.sha256(pathlib.Path(a.original_functions).read_bytes()).hexdigest(),'hostedQueries':0};pathlib.Path(a.output).write_text(json.dumps(data,indent=2)+'\n');print(json.dumps(data['summary']));raise SystemExit(0 if not data['summary']['failed'] else 1)
