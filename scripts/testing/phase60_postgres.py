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
 r=call(sql,database);ok=(r.returncode==expected if expected==0 else r.returncode!=0)
 if expected:
  marker={'production-fuse-aborts':'PHASE58 REVIEW FUSE','privacy-production-fuse-aborts':'PHASE60 PRIVACY REVIEW FUSE','unreviewed-view-dependency-aborts-fence':'Unreviewed snapshot view dependency'}[name];ok=ok and marker in r.stderr
 results.append({'id':name,'passed':ok,'exitCode':r.returncode,'expectedFailure':expected!=0,'output':('private definitions withheld' if private else r.stdout+r.stderr)});return ok
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
 # Phase60 candidate read boundary. Stage59 exposure stays as a historical counterexample above.
 stage('privacy-readers-load',(root/'docs/sql-proposals/phase60-snapshot/readers.sql').read_text())
 privacy=(root/'docs/sql-proposals/phase60-snapshot/privacy-fence.sql').read_text()
 stage('privacy-production-fuse-aborts',privacy,expected=1)
 privacy_rehearsal='\n'.join(l for l in privacy.splitlines() if not l.startswith("DO $$ BEGIN RAISE EXCEPTION 'PHASE60 PRIVACY REVIEW FUSE"))
 stage('unreviewed-view-dependency-aborts-fence',"CREATE VIEW public.unreviewed_snapshot_view AS SELECT payload FROM public.busy_business_snapshots;\n"+privacy_rehearsal,expected=1)
 stage('remove-synthetic-unreviewed-view','DROP VIEW public.unreviewed_snapshot_view;')
 stage('privacy-disposable-fence-load',privacy_rehearsal)
 for role in ['authenticated','service_role']:
  stage(role+'-raw-payload-select-denied',auth(reject("PERFORM payload FROM public.busy_business_snapshots",'42501'),role=role))
 for uid,label in [(O,'owner'),(M,'member')]:
  stage(label+'-shared-business-allowlist',auth(f"DO $test$ DECLARE v jsonb; BEGIN v:=public.busy_shared_business_read_v1('{B}'); IF v-ARRAY['businessId','businessName','memberRole']<>'{{}}'::jsonb OR v->>'businessId'<>'{B}' THEN RAISE EXCEPTION 'Shared fields escaped'; END IF; END $test$;",uid=uid))
 stage('member-private-projection-denied',auth(reject(f"PERFORM public.busy_owner_reply_review_v1('{B}','alex','enquiry',1)",'42501'),uid=M))
 stage('legacy-returning-rpc-denied',auth(reject(rpc(),'42501')))
 stage('foreign-projection-denied',auth(reject(f"PERFORM public.busy_shared_business_read_v1('{B}')",'42501'),uid='dddddddd-dddd-4ddd-8ddd-dddddddddddd'))
 stage('unauthenticated-projection-denied',auth(reject(f"PERFORM public.busy_shared_business_read_v1('{B}')",'42501'),uid=''))
 stage('owner-reply-no-unknown-nested-fields',auth(f"DO $test$ DECLARE v jsonb; BEGIN v:=public.busy_owner_reply_review_v1('{B}','alex','enquiry',1); IF v->'reply' IS DISTINCT FROM '{{\"text\":\"Owner words\"}}'::jsonb OR v::text LIKE '%futureExtension%' OR v::text LIKE '%sourceStamp%' OR v->>'eligible'<>'true' OR length(v->>'recordHash')<>64 THEN RAISE EXCEPTION 'Private projection failed'; END IF; END $test$;"))
 stage('first-hashed-text-save-preserves-all-other-fields',f"BEGIN; CREATE TEMP TABLE before_snapshot AS SELECT payload FROM public.busy_business_snapshots WHERE business_id='{B}'; GRANT SELECT ON before_snapshot TO authenticated; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='{O}'; DO $test$ DECLARE v jsonb; r jsonb; BEGIN v:=public.busy_owner_reply_review_v1('{B}','alex','enquiry',1); r:=public.busy_owner_reply_text_v2('{B}','alex','enquiry',1,v->>'recordHash',v->>'sourceHash','Reviewed owner words'); IF r->'target' IS DISTINCT FROM '{{\"text\":\"Reviewed owner words\"}}'::jsonb OR r::text LIKE '%futureExtension%' THEN RAISE EXCEPTION 'Receipt exposed unknown fields'; END IF; END $test$; RESET ROLE; DO $test$ BEGIN IF (SELECT payload FROM public.busy_business_snapshots WHERE business_id='{B}') IS DISTINCT FROM (SELECT jsonb_set(payload,'{{customers,0,privateEnquiryReply,text}}','\"Reviewed owner words\"') FROM before_snapshot) THEN RAISE EXCEPTION 'Independent fields changed'; END IF; END $test$; ROLLBACK;")
 stage('hash-source-mismatch-denied',auth(reject(f"PERFORM public.busy_owner_reply_text_v2('{B}','alex','enquiry',1,repeat('0',64),repeat('0',64),'New words')")))
 stage('admin-has-no-implicit-private-access',f"BEGIN; UPDATE public.busy_business_memberships SET role='admin' WHERE business_id='{B}' AND user_id='{O}'; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='{O}'; {reject(f"PERFORM public.busy_owner_reply_review_v1('{B}','alex','enquiry',1)",'42501')} ROLLBACK;")
 stage('role-revocation-shared-denial',f"BEGIN; DELETE FROM public.busy_business_memberships WHERE business_id='{B}' AND user_id='{M}'; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='{M}'; {reject(f"PERFORM public.busy_shared_business_read_v1('{B}')",'42501')} ROLLBACK;")
 stage('private-owner-mismatch-denied',f"BEGIN; UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{customers,0,privateEnquiryReply,ownerId}}','\"{M}\"') WHERE business_id='{B}'; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='{O}'; {reject(f"PERFORM public.busy_owner_reply_review_v1('{B}','alex','enquiry',1)",'42501')} ROLLBACK;")
 stage('internal-owner-context-not-callable',auth(reject(f"PERFORM busy_snapshot_private.owner_reply_context('{B}','alex','enquiry',1)",'42501')))
 stage('admin-cannot-bypass-review-with-direct-mutation',f"BEGIN; UPDATE public.busy_business_memberships SET role='admin' WHERE business_id='{B}' AND user_id='{O}'; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='{O}'; {reject(f"PERFORM public.busy_owner_reply_text_v2('{B}','alex','enquiry',1,repeat('0',64),repeat('0',64),'Changed')",'42501')} ROLLBACK;")
 stage('admin-legitimate-shared-metadata-remains-readable',f"BEGIN; UPDATE public.busy_business_memberships SET role='admin' WHERE business_id='{B}' AND user_id='{O}'; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='{O}'; DO $test$ BEGIN IF public.busy_shared_business_read_v1('{B}')->>'memberRole'<>'admin' THEN RAISE EXCEPTION 'Admin metadata unavailable'; END IF; END $test$; ROLLBACK;")
 stage('bootstrap-still-works-after-privacy-fence',auth("DO $test$ DECLARE v record; BEGIN SELECT * INTO v FROM public.busy_ensure_business('Synthetic privacy business'); IF v.member_role<>'owner' THEN RAISE EXCEPTION 'Bootstrap failed'; END IF; END $test$;",uid='ffffffff-ffff-4fff-8fff-ffffffffffff'))
 # Real concurrent revocation must serialize with the shared read's membership lock.
 holder=subprocess.Popen(base+['-d',db,'-q'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,bufsize=1)
 holder.stdin.write(f"BEGIN; DELETE FROM public.busy_business_memberships WHERE business_id='{B}' AND user_id='{M}';\n\\echo PHASE60_LOCKED\n");holder.stdin.flush()
 assert any('PHASE60_LOCKED' in line for line in holder.stdout),'Revocation lock not acquired'
 contender=subprocess.Popen(base+['-d',db],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
 contender.stdin.write("SET statement_timeout='5s';\n"+auth(f"SELECT public.busy_shared_business_read_v1('{B}');",uid=M));contender.stdin.close();time.sleep(.2);blocked=contender.poll() is None
 holder.stdin.write('COMMIT;\n\\q\n');holder.stdin.flush();holder.stdin.close();holder.wait(timeout=8);contender.wait(timeout=8);out=contender.stdout.read()+contender.stderr.read()
 results.append({'id':'concurrent-shared-read-waits-for-revocation','passed':blocked and holder.returncode==0 and contender.returncode!=0 and 'Not authorised' in out,'exitCode':contender.returncode,'expectedDenial':True,'holderExitCode':holder.returncode,'blockedUntilRelease':blocked,'output':out})
 stage('privacy-rollback-load',(root/'docs/sql-proposals/phase60-snapshot/rollback-readonly.sql').read_text())
 stage('privacy-rollback-remains-closed',auth(reject("PERFORM payload FROM public.busy_business_snapshots",'42501')))
except Exception as e:results.append({'id':'runner','passed':False,'error':str(e)})
finally:
 data={'database':'local synthetic Unix-socket PostgreSQL; mock UID, not real Supabase Auth','results':results,'summary':{'passed':sum(x['passed'] for x in results),'failed':sum(not x['passed'] for x in results),'blocked':0,'unexecuted':0},'originalFunctionsSha256':hashlib.sha256(pathlib.Path(a.original_functions).read_bytes()).hexdigest(),'hostedQueries':0};pathlib.Path(a.output).write_text(json.dumps(data,indent=2)+'\n');print(json.dumps(data['summary']));raise SystemExit(0 if not data['summary']['failed'] else 1)
