#!/usr/bin/env python3
"""Recovered reply continuation against original local-only SQL proposals."""
import argparse,json,pathlib,subprocess,sys
p=argparse.ArgumentParser()
for n in ['bin-dir','socket','original-functions','output']:p.add_argument('--'+n,required=True)
p.add_argument('--allow-disposable-reset',action='store_true');a=p.parse_args();assert a.allow_disposable_reset
root=pathlib.Path(__file__).resolve().parents[2];out=pathlib.Path(a.output).resolve();out.parent.mkdir(parents=True,exist_ok=True);prior=out.with_name(out.stem+'-phase63.json')
baseline=subprocess.run([sys.executable,str(root/'scripts/testing/phase63_postgres.py'),'--bin-dir',a.bin_dir,'--socket',a.socket,'--original-functions',a.original_functions,'--output',str(prior),'--allow-disposable-reset'],cwd=root)
assert baseline.returncode==0
base=[str(pathlib.Path(a.bin_dir)/'psql'),'-X','-h',a.socket,'-U','postgres','-v','ON_ERROR_STOP=1','-d','busy_phase58_disposable'];results=[]
B='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';O='cccccccc-cccc-4ccc-8ccc-cccccccccccc';D='dddddddd-dddd-4ddd-8ddd-dddddddddddd'
def call(sql):return subprocess.run(base,input=sql,text=True,capture_output=True,timeout=15)
def stage(name,sql):
 r=call(sql);results.append({'id':name,'passed':r.returncode==0,'exitCode':r.returncode,'output':r.stdout+r.stderr})
def auth(sql,uid=O,commit=False):return f"BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{uid}';{sql}"+('COMMIT;' if commit else 'ROLLBACK;')
def reject(sql,code='42501'):return f"DO $t$ BEGIN BEGIN {sql};RAISE EXCEPTION 'Expected denial missing';EXCEPTION WHEN SQLSTATE '{code}' THEN NULL;END;END $t$;"
def review(revision):return f"public.busy_owner_reply_review_v1('{B}','alex','enquiry',{revision})"
def edit(revision,text):return f"public.busy_owner_reply_text_v2('{B}','alex','enquiry',{revision},v->>'recordHash',v->>'sourceHash','{text}')"
try:
 assert str((pathlib.Path(a.socket).parent/'data').resolve()) in call('SHOW data_directory;').stdout
 stage('recovered-continuation-owner-fixture',f"INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES('{B}','{O}','owner');GRANT EXECUTE ON FUNCTION public.busy_owner_reply_discover_v1(uuid,text) TO authenticated;GRANT EXECUTE ON FUNCTION public.busy_owner_account_revision_v1(uuid) TO authenticated;")
 stage('fresh-session-discovery-before-edit',auth(f"DO $t$ DECLARE d jsonb;v jsonb; BEGIN d:=public.busy_owner_reply_discover_v1('{B}');v:={review(6)};IF d->>'revision'<>'6' OR v->'reply'->>'text'<>'New account wording' THEN RAISE EXCEPTION 'Fresh recovery mismatch';END IF;END $t$;"))
 stage('first-recovered-edit-preserves-all-independent-fields',f"BEGIN;CREATE TEMP TABLE before_reply AS SELECT payload FROM public.busy_business_snapshots WHERE business_id='{B}';GRANT SELECT ON before_reply TO authenticated;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{O}';DO $t$ DECLARE v jsonb;r jsonb;BEGIN v:={review(6)};r:={edit(6,'Recovered first saved wording')};IF r->>'previousRevision'<>'6' OR r->>'revision'<>'7' OR r->'target'<>jsonb_build_object('text','Recovered first saved wording') OR r->>'enquiryId'<>'enquiry' OR r ? 'sourceStamp' THEN RAISE EXCEPTION 'Receipt mismatch';END IF;END $t$;RESET ROLE;DO $t$ BEGIN IF (SELECT payload #- '{{customers,0,privateEnquiryReply,text}}' FROM public.busy_business_snapshots WHERE business_id='{B}') IS DISTINCT FROM (SELECT payload #- '{{customers,0,privateEnquiryReply,text}}' FROM before_reply) THEN RAISE EXCEPTION 'Independent fields lost';END IF;END $t$;COMMIT;")
 stage('separate-connection-metadata-and-target-readback',auth(f"DO $t$ DECLARE m jsonb;v jsonb;BEGIN m:=public.busy_owner_account_revision_v1('{B}');v:={review(7)};IF m->>'revision'<>'7' OR v->'reply'->>'text'<>'Recovered first saved wording' THEN RAISE EXCEPTION 'Not preserved';END IF;END $t$;"))
 stage('stale-first-review-cannot-repeat',auth(reject('PERFORM '+review(6),'40001')))
 stage('second-recovered-edit-current-server-evidence',auth(f"DO $t$ DECLARE m jsonb;v jsonb;r jsonb;BEGIN m:=public.busy_owner_account_revision_v1('{B}');v:=public.busy_owner_reply_review_v1('{B}','alex','enquiry',(m->>'revision')::bigint);r:=public.busy_owner_reply_text_v2('{B}','alex','enquiry',(m->>'revision')::bigint,v->>'recordHash',v->>'sourceHash','Recovered second saved wording');IF r->>'revision'<>'8' THEN RAISE EXCEPTION 'Second operation mismatch';END IF;END $t$;",commit=True))
 stage('new-connection-rediscovers-second-wording',auth(f"DO $t$ DECLARE d jsonb;v jsonb;BEGIN d:=public.busy_owner_reply_discover_v1('{B}');v:={review(8)};IF d->>'revision'<>'8' OR v->'reply'->>'text'<>'Recovered second saved wording' OR v::text LIKE '%futureExtension%' THEN RAISE EXCEPTION 'Fresh projection mismatch';END IF;END $t$;"))
 stage('foreign-owner-same-target-denied',auth(reject('PERFORM '+review(8)),uid=D))
 stage('changed-source-denies-old-hash-approval',f"BEGIN;SET LOCAL request.jwt.claim.sub='{O}';DO $t$ DECLARE v jsonb;BEGIN v:={review(8)};UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{inboxItems,0,rawText}}','\"New requirements\"') WHERE business_id='{B}';BEGIN PERFORM {edit(8,'Must not save')};RAISE EXCEPTION 'Changed source accepted';EXCEPTION WHEN SQLSTATE '40001' THEN NULL;END;END $t$;ROLLBACK;")
 stage('explicit-removal-denies-stale-recovery',f"BEGIN;SET LOCAL request.jwt.claim.sub='{O}';DO $t$ DECLARE r jsonb;BEGIN SELECT payload->'customers'->0->'privateEnquiryReply' INTO r FROM public.busy_business_snapshots WHERE business_id='{B}';PERFORM public.busy_snapshot_private_mutation_v1('{B}',8,1,'private_reply_remove','alex',r);END $t$;SET LOCAL ROLE authenticated;{reject('PERFORM '+review(8),'40001')}ROLLBACK;")
 stage('legacy-raw-read-still-denied',auth(reject('PERFORM payload FROM public.busy_business_snapshots')))
 stage('legacy-full-payload-write-still-denied',auth(reject(f"UPDATE public.busy_business_snapshots SET payload='{{}}' WHERE business_id='{B}'")))
 # The source candidate has an intentional deploy fuse. Only this synthetic
 # rehearsal strips that exact statement; tracked SQL remains fail-closed.
 candidate=(root/'docs/sql-proposals/phase64-snapshot/first-enquiry.sql').read_text();fuse="DO $$ BEGIN RAISE EXCEPTION 'PHASE64 REVIEW FUSE: first filing requires client/source review and separate staging approval'; END $$;"
 assert candidate.count(fuse)==1
 stage('first-filing-candidate-load-local-only',candidate.replace(fuse,''))
 stage('first-filing-synthetic-pending-source',f"BEGIN;UPDATE public.busy_business_snapshots SET payload=jsonb_build_object('inboxItems',jsonb_build_array(jsonb_build_object('id','pending-first','status','Pending','source','Customer message','rawText','Please quote for catering','queuedAt','2026-10-23T10:00:00Z','privateUnknown',jsonb_build_object('retain',true))),'unknownExtension',jsonb_build_object('retain',true),'websiteDraft',jsonb_build_object('wording','Keep website'),'replyActions',jsonb_build_object('untouched',jsonb_build_object('amount',95))) WHERE business_id='{B}';COMMIT;")
 def capture(extra=''):
  return "jsonb_build_object('customerId','intake-first','enquiryId','pending-first','sourceRecordId','source-first','intakeId','intake-log-first','activityId','activity-first','sourceHash',encode(sha256(convert_to(item::text,'UTF8')),'hex'),'name','Alex Owner Corrected','phone','07700 900123','email','','address','Owner corrected address','service','Catering','eventDate','2026-10-23','eventTime','09:00','note','Owner reviewed note','confidence','High')"+extra
 # Prepare synthetic reviewed input privately under fixture owner, then exercise
 # public function as authenticated. No raw payload privilege is granted.
 stage('prepare-synthetic-first-filing-input',f"CREATE TABLE public.phase64_synthetic_capture(value jsonb);INSERT INTO public.phase64_synthetic_capture SELECT {capture()} FROM (SELECT payload->'inboxItems'->0 item FROM public.busy_business_snapshots WHERE business_id='{B}') x;GRANT SELECT ON public.phase64_synthetic_capture TO authenticated;")
 input_sql='(SELECT value FROM public.phase64_synthetic_capture)'
 def first(data=input_sql,rev=8):return f"public.busy_owner_first_enquiry_v1('{B}',{rev},{data})"
 stage('first-filing-nonowner-denied',auth(reject('PERFORM '+first()),uid=D))
 stage('first-filing-admin-denied',f"BEGIN;UPDATE public.busy_business_memberships SET role='admin' WHERE business_id='{B}' AND user_id='{O}';SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{O}';{reject('PERFORM '+first())}ROLLBACK;")
 stage('first-filing-stale-revision-denied',auth(reject('PERFORM '+first(rev=7),'40001')))
 stage('first-filing-unsupported-stage-denied',auth(reject('PERFORM '+first(input_sql+"||jsonb_build_object('stage','Booking')"),'22023')))
 stage('first-filing-changed-source-denied',auth(reject('PERFORM '+first(input_sql+"||jsonb_build_object('sourceHash',repeat('0',64))"),'40001')))
 stage('first-filing-missing-contact-denied',auth(reject('PERFORM '+first(input_sql+"||jsonb_build_object('phone','','email','')"),'22023')))
 stage('first-filing-duplicate-source-denied',f"BEGIN;UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{inboxItems}}',(payload->'inboxItems')||(payload->'inboxItems')) WHERE business_id='{B}';SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{O}';{reject('PERFORM '+first(),'22023')}ROLLBACK;")
 stage('first-filing-existing-customer-requires-original-matching',f"BEGIN;UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{customers}}','[{{\"id\":\"other\",\"name\":\"Existing customer\"}}]') WHERE business_id='{B}';SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{O}';{reject('PERFORM '+first(),'22023')}ROLLBACK;")
 stage('first-filing-foreign-source-denied',f"BEGIN;UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{inboxItems,0,businessId}}','\"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb\"') WHERE business_id='{B}';SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{O}';{reject('PERFORM '+first())}ROLLBACK;")
 stage('first-filing-orphan-work-identity-denied',f"BEGIN;UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{replyActions,intake-first}}','{{}}') WHERE business_id='{B}';SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{O}';{reject('PERFORM '+first(),'22023')}ROLLBACK;")
 stage('first-filing-invalid-owner-date-denied',auth(reject('PERFORM '+first(input_sql+"||jsonb_build_object('eventDate','2026-02-31')"),'22023')))
 stage('first-filing-cannot-change-contact-preferences',auth(reject('PERFORM '+first(input_sql+"||jsonb_build_object('contactOk',true)"),'22023')))
 stage('first-filing-owner-reviewed-commit',auth(f"DO $t$ DECLARE r jsonb;BEGIN r:={first()};IF r->>'revision'<>'9' OR r->>'operation'<>'first_enquiry_filing' OR r->>'customerId'<>'intake-first' OR r->>'enquiryId'<>'pending-first' OR r->>'filedStage'<>'Enquiry' OR r ? 'payload' THEN RAISE EXCEPTION 'Wrong finite filing receipt';END IF;END $t$;",commit=True))
 stage('first-filing-original-owned-fields-and-unknown-preservation',f"DO $t$ DECLARE p jsonb;c jsonb;e jsonb;BEGIN SELECT payload INTO p FROM public.busy_business_snapshots WHERE business_id='{B}';c:=p->'customers'->0;e:=p->'inboxItems'->0;IF c->>'name'<>'Alex Owner Corrected' OR c->>'lifecycleStatus'<>'Enquiry' OR c->>'nextEnquiryCheckDate'<>'2026-10-30' OR c->'history'<>'[]' OR c->'activity'->0->>'kind'<>'intake' OR c->'sourceRecords'->0->>'rawText'<>'Please quote for catering' OR e->>'filedCustomerId'<>'intake-first' OR e->>'status'<>'Filed' OR p->'intakeLog'->0->>'matchedExisting'<>'false' OR p->'unknownExtension'->>'retain'<>'true' OR e->'privateUnknown'->>'retain'<>'true' OR p->'websiteDraft'->>'wording'<>'Keep website' OR p->'replyActions'->'untouched'->>'amount'<>'95' OR c ? 'privateEnquiryReply' THEN RAISE EXCEPTION 'Original domain construction or preservation failed: %',p;END IF;END $t$;")
 # Execute the actual original parent using its original date helper, then
 # compare every owned field except runtime IDs and timestamp representations.
 parent=subprocess.run(['node','scripts/check-mission15-phase64-filing-parent.mjs','--emit'],cwd=root,text=True,capture_output=True,timeout=15)
 def normalize(v):
  c=v['customer'];e=v['enquiry'];i=v['intake']
  for k in ['id','createdAt','currentEnquiryAt','lastActivityAt']:c.pop(k,None)
  for x in c['activity']:
   for k in ['id','createdAt']:x.pop(k,None)
  for x in c['sourceRecords']:
   for k in ['id','importedAt']:x.pop(k,None)
  for k in ['reviewedAt','filedCustomerId']:e.pop(k,None)
  for k in ['id','customerId','importedAt']:i.pop(k,None)
  return v
 # psql formatting is disabled for the JSON row only; ordinary stage logs stay.
 raw=subprocess.run(base+['-At'],input=f"SELECT jsonb_build_object('customer',payload->'customers'->0,'enquiry',payload->'inboxItems'->0,'intake',payload->'intakeLog'->0) FROM public.busy_business_snapshots WHERE business_id='{B}';",text=True,capture_output=True,timeout=15)
 parity=parent.returncode==0 and raw.returncode==0 and normalize(json.loads(parent.stdout))==normalize(json.loads(raw.stdout))
 results.append({'id':'actual-QuickCapture-parent-owned-field-parity','passed':parity,'exitCode':parent.returncode,'sqlExitCode':raw.returncode,'output':'All original owned Enquiry fields compared; runtime IDs/timestamp encoding excluded.' if parity else parent.stderr+raw.stderr+' Original parent and candidate differ.'})
 stage('first-filing-no-blind-replay',auth(reject('PERFORM '+first(),'40001')))
 stage('first-filing-cannot-create-second-customer',auth(reject('PERFORM '+first(rev=9),'22023')))
 stage('first-filing-private-reply-not-invented',auth(f"DO $t$ BEGIN IF public.busy_owner_reply_discover_v1('{B}')->'items'<>'[]' THEN RAISE EXCEPTION 'Private reply invented';END IF;END $t$;"))
 stage('first-filing-fail-closed-rollback',(root/'docs/sql-proposals/phase64-snapshot/rollback-readonly.sql').read_text())
 stage('first-filing-rollback-denied',auth(reject('PERFORM '+first(rev=9))))
 stage('remove-synthetic-review-input','DROP TABLE public.phase64_synthetic_capture;')
 stage('recovery-rollback-retains-fences',(root/'docs/sql-proposals/phase63-snapshot/rollback-readonly.sql').read_text())
 stage('rollback-discovery-denied',auth(reject(f"PERFORM public.busy_owner_reply_discover_v1('{B}')")))
 stage('rollback-raw-content-still-private',auth(reject('PERFORM payload FROM public.busy_business_snapshots')))
except Exception as e:results.append({'id':'runner','passed':False,'error':str(e)})
finally:
 rows=json.loads(prior.read_text())['results']+results;data={'scope':'Local synthetic PostgreSQL17; mock UID, not Supabase JWT/PostgREST','baselineExitCode':baseline.returncode,'results':rows,'summary':{'passed':sum(x['passed'] for x in rows),'failed':sum(not x['passed'] for x in rows),'blocked':0,'unexecuted':0},'hostedQueries':0};out.write_text(json.dumps(data,indent=2)+'\n');print(json.dumps(data['summary']));sys.exit(0 if not data['summary']['failed'] else 1)
