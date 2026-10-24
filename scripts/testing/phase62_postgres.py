#!/usr/bin/env python3
"""Synthetic local-only workspace/service extension of the complete Phase61 suite."""
import argparse,json,pathlib,subprocess,sys,time,hashlib
p=argparse.ArgumentParser()
for n in ['bin-dir','socket','original-functions','output']:p.add_argument('--'+n,required=True)
p.add_argument('--allow-disposable-reset',action='store_true');a=p.parse_args();assert a.allow_disposable_reset
root=pathlib.Path(__file__).resolve().parents[2];out=pathlib.Path(a.output).resolve();out.parent.mkdir(parents=True,exist_ok=True);previous=out.with_name(out.stem+'-phase61.json')
baseline=subprocess.run([sys.executable,str(root/'scripts/testing/phase61_postgres.py'),'--bin-dir',a.bin_dir,'--socket',a.socket,'--original-functions',a.original_functions,'--output',str(previous),'--allow-disposable-reset'],cwd=root);assert baseline.returncode==0
base=[str(pathlib.Path(a.bin_dir)/'psql'),'-X','-h',a.socket,'-U','postgres','-v','ON_ERROR_STOP=1','-d','busy_phase58_disposable'];results=[]
B='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';O='cccccccc-cccc-4ccc-8ccc-cccccccccccc';M='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';D='dddddddd-dddd-4ddd-8ddd-dddddddddddd'
def call(sql):return subprocess.run(base,input=sql,text=True,capture_output=True,timeout=15)
def stage(name,sql):
 r=call(sql);results.append({'id':name,'passed':r.returncode==0,'exitCode':r.returncode,'output':r.stdout+r.stderr});return r.returncode==0

def auth(sql,uid=O,role='authenticated'):return f"BEGIN; SET LOCAL ROLE {role}; SET LOCAL request.jwt.claim.sub='{uid}';\n{sql}\nROLLBACK;"
def reject(sql,code='42501'):return f"DO $t$ BEGIN BEGIN {sql}; RAISE EXCEPTION 'Expected denial missing'; EXCEPTION WHEN SQLSTATE '{code}' THEN NULL; END; END $t$;"
def status(b=B):return f"public.busy_workspace_status_v1('{b}')"
def facts(uid=O):return f"public.busy_service_alert_facts_v1('{B}','{uid}')"
try:
 assert str((pathlib.Path(a.socket).parent/'data').resolve()) in call('SHOW data_directory;').stdout
 stage('restore-only-synthetic-owner-after-revocation-test',f"INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES('{B}','{O}','owner');")
 for name in ['workspace','services']:
  if not stage(name+'-candidate-load',(root/f'docs/sql-proposals/phase62-snapshot/{name}.sql').read_text()):raise RuntimeError('Candidate SQL failed')
 stage('owner-existing-workspace-metadata-only',auth(f"DO $t$ DECLARE v jsonb; BEGIN v:={status()}; IF v->>'snapshotStatus'<>'present' OR v->>'revision'<>'5' OR v-ARRAY['businessId','actorId','businessName','memberRole','snapshotStatus','revision','schemaVersion']<>'{{}}'::jsonb THEN RAISE EXCEPTION 'Bad workspace projection: %',v; END IF; END $t$;"))
 stage('original-first-time-bootstrap-empty-projection',auth("DO $t$ DECLARE b record; v jsonb; BEGIN SELECT * INTO b FROM public.busy_ensure_business('Synthetic first workspace');v:=public.busy_workspace_status_v1(b.business_id); IF b.member_role<>'owner' OR v->>'snapshotStatus'<>'empty' OR v->>'revision'<>'1' THEN RAISE EXCEPTION 'Bootstrap incompatible'; END IF; END $t$;",uid='ffffffff-ffff-4fff-8fff-ffffffffffff'))
 stage('existing-missing-snapshot-not-repaired',auth(f"DO $t$ DECLARE v jsonb; b record; BEGIN SELECT * INTO b FROM public.busy_ensure_business(NULL);v:={status('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')}; IF v->>'snapshotStatus'<>'missing' OR v->'revision'<>'null'::jsonb OR EXISTS(SELECT 1 FROM public.busy_business_snapshots WHERE business_id=b.business_id) THEN RAISE EXCEPTION 'Unexpected missing-row repair'; END IF; END $t$;",uid=D))
 stage('member-only-relational-identification',auth(f"DO $t$ DECLARE v jsonb; BEGIN v:={status()}; IF v->>'snapshotStatus'<>'restricted' OR v->'revision'<>'null'::jsonb OR v->'schemaVersion'<>'null'::jsonb THEN RAISE EXCEPTION 'Private metadata disclosed'; END IF; END $t$;",uid=M))
 stage('admin-only-relational-identification',f"BEGIN; UPDATE public.busy_business_memberships SET role='admin' WHERE business_id='{B}' AND user_id='{O}'; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='{O}'; DO $t$ BEGIN IF {status()}->>'snapshotStatus'<>'restricted' THEN RAISE EXCEPTION 'Admin private access'; END IF; END $t$; ROLLBACK;")
 for uid,label in [(D,'foreign'),('','unauthenticated')]:stage(label+'-workspace-denied',auth(reject('PERFORM '+status()),uid=uid))
 stage('service-cannot-use-user-workspace-endpoint',auth(reject('PERFORM '+status()),role='service_role'))
 stage('incompatible-schema-is-explicit',f"BEGIN; UPDATE public.busy_business_snapshots SET schema_version=2 WHERE business_id='{B}'; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='{O}'; DO $t$ BEGIN IF {status()}->>'snapshotStatus'<>'incompatible' THEN RAISE EXCEPTION 'Incompatible format hidden'; END IF; END $t$; ROLLBACK;")
 stage('unknown-top-level-not-projected',auth(f"DO $t$ BEGIN IF {status()}::text LIKE '%unknownFuture%' OR {status()}::text LIKE '%privateEnquiryReply%' THEN RAISE EXCEPTION 'Private workspace fields disclosed'; END IF; END $t$;"))
 # Only synthetic alert facts are added, not private observed data.
 stage('synthetic-alert-fixture',f"UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{replyActions}}','{{\"alex\":{{\"done\":true,\"type\":\"quote\",\"secret\":\"hidden\",\"details\":{{\"quoteStatus\":\"Sent\",\"quoteSentAt\":\"2026-10-01\",\"bookingDate\":{{\"secret\":\"nested\"}},\"privateText\":\"hidden\"}}}}}}') WHERE business_id='{B}';")
 stage('service-finite-owner-alert-projection',auth(f"DO $t$ DECLARE v jsonb; BEGIN v:={facts()}; IF jsonb_array_length(v->'customers')<>1 OR v->'replyActions'->'alex'->'details' IS DISTINCT FROM '{{\"quoteStatus\":\"Sent\",\"quoteSentAt\":\"2026-10-01\"}}'::jsonb OR v::text LIKE '%secret%' OR v::text LIKE '%privateEnquiryReply%' OR v::text LIKE '%futureExtension%' THEN RAISE EXCEPTION 'Alert disclosure: %',v; END IF; END $t$;",role='service_role'))
 for uid,label in [(M,'member-recipient'),(D,'foreign-recipient')]:stage(label+'-alert-denied',auth(reject('PERFORM '+facts(uid)),role='service_role'))
 stage('ordinary-owner-not-service-capability',auth(reject('PERFORM '+facts())))
 stage('service-aggregate-allowlist',auth("DO $t$ DECLARE v jsonb; BEGIN v:=public.busy_service_snapshot_count_v1(); IF v-ARRAY['activeWorkspaces7d']<>'{}'::jsonb OR (v->>'activeWorkspaces7d')::bigint<1 THEN RAISE EXCEPTION 'Aggregate failed'; END IF; END $t$;",role='service_role'))
 stage('ordinary-member-aggregate-denied',auth(reject('PERFORM public.busy_service_snapshot_count_v1()'),uid=M))
 stage('duplicate-customer-alert-suppressed',f"BEGIN; UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{customers}}',(payload->'customers')||(payload->'customers')) WHERE business_id='{B}'; SET LOCAL ROLE service_role; DO $t$ BEGIN IF {facts()}->'customers'<>'[]'::jsonb THEN RAISE EXCEPTION 'Ambiguous customer included'; END IF; END $t$; ROLLBACK;")
 stage('foreign-action-alert-suppressed',f"BEGIN; UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{replyActions,alex,businessId}}','\"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb\"') WHERE business_id='{B}'; SET LOCAL ROLE service_role; DO $t$ BEGIN IF {facts()}->'customers'<>'[]'::jsonb THEN RAISE EXCEPTION 'Foreign action included'; END IF; END $t$; ROLLBACK;")
 stage('booking-needs-explicit-confirmed-status',f"BEGIN; UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{replyActions,alex,type}}','\"booking\"') WHERE business_id='{B}'; SET LOCAL ROLE service_role; DO $t$ BEGIN IF {facts()}->'customers'<>'[]'::jsonb THEN RAISE EXCEPTION 'Missing confirmation inferred'; END IF; END $t$; ROLLBACK;")
 stage('raw-get-remains-denied',auth(reject('PERFORM payload FROM public.busy_business_snapshots')))
 stage('legacy-full-post-upsert-remains-denied',auth(reject(f"INSERT INTO public.busy_business_snapshots(business_id,payload) VALUES('{B}','{{}}') ON CONFLICT(business_id) DO UPDATE SET payload=excluded.payload")))
 stage('legacy-patch-remains-denied',auth(reject("UPDATE public.busy_business_snapshots SET payload='{}'")))
 holder=subprocess.Popen(base+['-q'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,bufsize=1)
 holder.stdin.write(f"BEGIN; DELETE FROM public.busy_business_memberships WHERE business_id='{B}' AND user_id='{O}';\n\\echo PHASE62_LOCKED\n");holder.stdin.flush();assert any('PHASE62_LOCKED' in line for line in holder.stdout)
 contender=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True);contender.stdin.write("SET statement_timeout='5s';\n"+auth('SELECT '+facts()+';',role='service_role'));contender.stdin.close();time.sleep(.2);blocked=contender.poll() is None
 holder.stdin.write('COMMIT;\n\\q\n');holder.stdin.flush();holder.stdin.close();holder.wait(timeout=8);contender.wait(timeout=8);output=contender.stdout.read()+contender.stderr.read();results.append({'id':'service-reader-waits-for-owner-revocation','passed':blocked and holder.returncode==0 and contender.returncode!=0 and 'Owner recipient required' in output,'exitCode':contender.returncode,'holderExitCode':holder.returncode,'expectedDenial':True,'output':output})
 stage('phase62-readonly-rollback',(root/'docs/sql-proposals/phase62-snapshot/rollback-readonly.sql').read_text())
 stage('rollback-service-capability-denied',auth(reject('PERFORM '+facts()),role='service_role'))
 stage('rollback-raw-data-still-fenced',auth(reject('PERFORM payload FROM public.busy_business_snapshots')))
except Exception as e:results.append({'id':'runner','passed':False,'error':str(e)})
finally:
 rows=json.loads(previous.read_text())['results']+results;data={'scope':'Synthetic local PostgreSQL17, mock auth UID; not hosted JWT/PostgREST','baselineExitCode':baseline.returncode,'results':rows,'summary':{'passed':sum(x['passed'] for x in rows),'failed':sum(not x['passed'] for x in rows),'blocked':0,'unexecuted':0},'hostedQueries':0};out.write_text(json.dumps(data,indent=2)+'\n');print(json.dumps(data['summary']));sys.exit(0 if not data['summary']['failed'] else 1)
