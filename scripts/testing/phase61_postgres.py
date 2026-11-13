#!/usr/bin/env python3
"""Real disposable Phase61 PostgreSQL extension; no hosted connections."""
import argparse,hashlib,json,pathlib,subprocess,sys,time
p=argparse.ArgumentParser()
for n in ['bin-dir','socket','original-functions','output']:p.add_argument('--'+n,required=True)
p.add_argument('--allow-disposable-reset',action='store_true');a=p.parse_args();assert a.allow_disposable_reset
root=pathlib.Path(__file__).resolve().parents[2];out=pathlib.Path(a.output).resolve();out.parent.mkdir(parents=True,exist_ok=True);baseline=out.with_name(out.stem+'-baseline.json')
baseline_run=subprocess.run([sys.executable,str(root/'scripts/testing/phase60_postgres.py'),'--bin-dir',a.bin_dir,'--socket',a.socket,'--original-functions',a.original_functions,'--output',str(baseline),'--allow-disposable-reset'],cwd=root)
assert baseline_run.returncode==0,'Original 54-stage baseline must pass'
base=[str(pathlib.Path(a.bin_dir)/'psql'),'-X','-h',a.socket,'-U','postgres','-v','ON_ERROR_STOP=1','-d','busy_phase58_disposable'];results=[]
B='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';O='cccccccc-cccc-4ccc-8ccc-cccccccccccc';M='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
def call(sql):return subprocess.run(base,input=sql,text=True,capture_output=True,timeout=15)
def stage(name,sql):
 r=call(sql);results.append({'id':name,'passed':r.returncode==0,'exitCode':r.returncode,'output':r.stdout+r.stderr});return r

def auth(sql,uid=O,role='authenticated',commit=False):return f"BEGIN; SET LOCAL ROLE {role}; SET LOCAL request.jwt.claim.sub='{uid}';\n{sql}\n"+('COMMIT;' if commit else 'ROLLBACK;')
def reject(sql,code='42501'):return f"DO $test$ BEGIN BEGIN {sql}; RAISE EXCEPTION 'Expected denial missing'; EXCEPTION WHEN SQLSTATE '{code}' THEN NULL; END; END $test$;"
def metadata():return f"public.busy_owner_account_revision_v1('{B}')"
def review(rev):return f"public.busy_owner_reply_review_v1('{B}','alex','enquiry',{rev})"
def edit(rev,text):return f"DO $test$ DECLARE v jsonb; r jsonb; BEGIN v:={review(rev)}; r:=public.busy_owner_reply_text_v2('{B}','alex','enquiry',{rev},v->>'recordHash',v->>'sourceHash','{text}'); IF r->>'revision'<>'{rev+1}' OR r->'target' IS DISTINCT FROM jsonb_build_object('text','{text}') THEN RAISE EXCEPTION 'Bad exact receipt'; END IF; END $test$;"
try:
 assert str((pathlib.Path(a.socket).parent/'data').resolve()) in call('SHOW data_directory;').stdout,'Dedicated local cluster only'
 stage('revision-projection-load',(root/'docs/sql-proposals/phase61-snapshot/revision.sql').read_text())
 stage('synthetic-forward-repair-after-baseline-rollback',f"GRANT EXECUTE ON FUNCTION public.busy_owner_reply_review_v1(uuid,text,text,bigint),public.busy_owner_reply_text_v2(uuid,text,text,bigint,text,text,text) TO authenticated; INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES('{B}','{M}','member');")
 stage('owner-metadata-exact-allowlist',auth(f"DO $test$ DECLARE v jsonb; BEGIN v:={metadata()}; IF v IS DISTINCT FROM '{{\"businessId\":\"{B}\",\"ownerId\":\"{O}\",\"revision\":1,\"schemaVersion\":1}}'::jsonb THEN RAISE EXCEPTION 'Unexpected projection: %',v; END IF; END $test$;"))
 for uid,label in [(M,'member'),('dddddddd-dddd-4ddd-8ddd-dddddddddddd','foreign-owner'),('','missing-identity')]:stage(label+'-revision-denied',auth(reject('PERFORM '+metadata()),uid=uid))
 stage('admin-revision-denied',f"BEGIN; UPDATE public.busy_business_memberships SET role='admin' WHERE business_id='{B}' AND user_id='{O}'; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='{O}'; {reject('PERFORM '+metadata())} ROLLBACK;")
 stage('service-role-not-a-private-reader',auth(reject('PERFORM '+metadata()),role='service_role'))
 stage('raw-payload-still-denied',auth(reject('PERFORM payload FROM public.busy_business_snapshots')))
 stage('unknown-fields-never-in-metadata',f"BEGIN; UPDATE public.busy_business_snapshots SET payload=payload||'{{\"anotherSecret\":{{\"nested\":\"private\"}}}}'::jsonb WHERE business_id='{B}'; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='{O}'; DO $test$ BEGIN IF {metadata()}-ARRAY['businessId','ownerId','revision','schemaVersion']<>'{{}}'::jsonb THEN RAISE EXCEPTION 'Unknown disclosure'; END IF; END $test$; ROLLBACK;")
 def payload():return json.loads(subprocess.check_output(base+['-At','-c',f"SELECT payload FROM public.busy_business_snapshots WHERE business_id='{B}'"],text=True))
 before=payload()
 for rev,text in [(1,'First committed wording'),(2,'Second committed wording')]:
  stage('committed-reviewed-operation-'+str(rev),auth(edit(rev,text),commit=True))
  stage('separate-connection-revision-and-target-'+str(rev),auth(f"DO $test$ BEGIN IF {metadata()}->>'revision'<>'{rev+1}' OR {review(rev+1)}->'reply'->>'text'<>'{text}' THEN RAISE EXCEPTION 'Readback mismatch'; END IF; END $test$;"))
 stage('stale-review-cannot-replay',auth(reject('PERFORM '+review(1),'40001')))
 before['customers'][0]['privateEnquiryReply']['text']='Second committed wording';same=before==payload();results.append({'id':'all-independent-fields-preserved','passed':same,'exitCode':0 if same else 1})
 stage('changed-enquiry-ineligible',f"BEGIN; UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{inboxItems,0,rawText}}','\"Changed request\"') WHERE business_id='{B}'; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='{O}'; DO $test$ DECLARE v jsonb; BEGIN v:={review(3)}; IF v->>'eligible'<>'false' THEN RAISE EXCEPTION 'Changed source accepted'; END IF; END $test$; ROLLBACK;")
 # Receipt intentionally not retained; readback cannot recreate own-operation proof.
 stage('committed-with-receipt-not-retained',auth(edit(3,'Unobserved committed wording'),commit=True))
 stage('observation-is-not-a-receipt',auth(f"DO $test$ BEGIN IF {metadata()}->>'revision'<>'4' OR {review(4)}->'reply'->>'text'<>'Unobserved committed wording' THEN RAISE EXCEPTION 'Observation missing'; END IF; END $test$;"))
 for mode in ['mutation','revocation']:
  holder=subprocess.Popen(base+['-q'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,bufsize=1)
  sql=auth(edit(4,'Concurrent committed wording'),commit=True).rsplit('COMMIT;',1)[0] if mode=='mutation' else f"BEGIN; DELETE FROM public.busy_business_memberships WHERE business_id='{B}' AND user_id='{O}';"
  holder.stdin.write(sql+'\n\\echo PHASE61_LOCKED\n');holder.stdin.flush();assert any('PHASE61_LOCKED' in line for line in holder.stdout)
  contender=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
  contender.stdin.write("SET statement_timeout='5s';\n"+auth('SELECT '+metadata()+';'));contender.stdin.close();time.sleep(.2);blocked=contender.poll() is None
  holder.stdin.write('COMMIT;\n\\q\n');holder.stdin.flush();holder.stdin.close();holder.wait(timeout=8);contender.wait(timeout=8);output=contender.stdout.read()+contender.stderr.read()
  ok=blocked and holder.returncode==0 and (contender.returncode==0 and '"revision": 5' in output if mode=='mutation' else contender.returncode!=0 and 'Not authorised' in output)
  results.append({'id':'concurrent-'+mode+'-metadata-lock','passed':ok,'exitCode':contender.returncode,'holderExitCode':holder.returncode,'expectedDenial':mode=='revocation','blockedUntilRelease':blocked,'output':output})
 stage('metadata-rollback',(root/'docs/sql-proposals/phase61-snapshot/rollback-readonly.sql').read_text())
 stage('rollback-metadata-closed',auth(reject('PERFORM '+metadata())))
 stage('rollback-raw-payload-closed',auth(reject('PERFORM payload FROM public.busy_business_snapshots')))
except Exception as e:results.append({'id':'runner','passed':False,'error':str(e)})
finally:
 previous=json.loads(baseline.read_text());rows=previous['results']+results
 data={'scope':'Local synthetic PostgreSQL17; mock UID, no real JWT/PostgREST','baselineRunnerExitCode':baseline_run.returncode,'baselineReportSha256':hashlib.sha256(baseline.read_bytes()).hexdigest(),'results':rows,'summary':{'passed':sum(x['passed'] for x in rows),'failed':sum(not x['passed'] for x in rows),'blocked':0,'unexecuted':0},'hostedQueries':0}
 out.write_text(json.dumps(data,indent=2)+'\n');print(json.dumps(data['summary']));sys.exit(0 if not data['summary']['failed'] else 1)
