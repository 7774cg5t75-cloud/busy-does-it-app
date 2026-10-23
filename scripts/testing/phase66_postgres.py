#!/usr/bin/env python3
"""Real local PG17 interrupted enquiry observations; no hosted or customer data."""
import argparse,json,pathlib,subprocess,sys,time
p=argparse.ArgumentParser()
for n in ['bin-dir','socket','original-functions','output']:p.add_argument('--'+n,required=True)
p.add_argument('--allow-disposable-reset',action='store_true');a=p.parse_args();assert a.allow_disposable_reset
root=pathlib.Path(__file__).resolve().parents[2];out=pathlib.Path(a.output).resolve();out.parent.mkdir(parents=True,exist_ok=True);prior=out.with_name(out.stem+'-phase65.json')
baseline=subprocess.run([sys.executable,str(root/'scripts/testing/phase65_postgres.py'),'--bin-dir',a.bin_dir,'--socket',a.socket,'--original-functions',a.original_functions,'--output',str(prior),'--allow-disposable-reset'],cwd=root)
assert baseline.returncode==0
base=[str(pathlib.Path(a.bin_dir)/'psql'),'-X','-h',a.socket,'-U','postgres','-v','ON_ERROR_STOP=1','-d','busy_phase58_disposable'];results=[]
B='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';O='cccccccc-cccc-4ccc-8ccc-cccccccccccc';D='dddddddd-dddd-4ddd-8ddd-dddddddddddd';M='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
def call(sql):return subprocess.run(base,input=sql,text=True,capture_output=True,timeout=15)
def stage(name,sql):
 r=call(sql);results.append({'id':name,'passed':r.returncode==0,'exitCode':r.returncode,'output':r.stdout+r.stderr})
def auth(sql,uid=O,commit=False):return f"BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{uid}';{sql}"+('COMMIT;' if commit else 'ROLLBACK;')
def reject(sql,code='42501'):return f"DO $t$ BEGIN BEGIN {sql};RAISE EXCEPTION 'Expected denial missing';EXCEPTION WHEN SQLSTATE '{code}' THEN NULL;END;END $t$;"
def discover(b=B,after=None):return f"public.busy_owner_enquiry_discover_v1('{b}',"+("NULL" if after is None else "'"+after+"'")+")"
def expect_state(state,revision):return auth(f"DO $t$ DECLARE v jsonb;BEGIN v:={discover()};IF v->>'revision'<>'{revision}' OR jsonb_array_length(v->'items')<>1 OR v->'items'->0->>'state'<>'{state}' OR (v->'items'->0)-ARRAY['customerId','enquiryId','customerName','state']<>'{{}}' OR v::text LIKE '%sourceStamp%' OR v::text LIKE '%wording%' OR v::text LIKE '%secretSynthetic%' THEN RAISE EXCEPTION 'Wrong discovery/projection';END IF;END $t$;")
try:
 assert str((pathlib.Path(a.socket).parent/'data').resolve()) in call('SHOW data_directory;').stdout
 candidate=(root/'docs/sql-proposals/phase66-snapshot/discovery.sql').read_text();fuse="DO $$ BEGIN RAISE EXCEPTION 'PHASE66 REVIEW FUSE: interrupted discovery requires separate staging approval'; END $$;";assert candidate.count(fuse)==1
 stage('phase66-load-fused-local-candidate',candidate.replace(fuse,''))
 stage('restore-original-narrow-review-capabilities','GRANT EXECUTE ON FUNCTION public.busy_owner_pending_review_v1(uuid,bigint,text),public.busy_owner_first_reply_review_v1(uuid,bigint,text,text),public.busy_owner_manual_source_v1(uuid,bigint,text,text),public.busy_owner_reply_create_v1(uuid,bigint,text,text,text,text,text) TO authenticated;')
 stage('supported-saved-reply-discovery',expect_state('FiledWithReply',13))
 for uid,label in [(M,'member'),(D,'foreign'),('','unauthenticated')]:stage(label+'-interrupted-discovery-denied',auth(reject('PERFORM '+discover()),uid))
 stage('admin-discovery-denied',f"BEGIN;UPDATE public.busy_business_memberships SET role='admin' WHERE business_id='{B}' AND user_id='{O}';SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{O}';{reject('PERFORM '+discover())}ROLLBACK;")
 stage('coowner-private-saved-reply-not-visible',f"BEGIN;INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES('{B}','{D}','owner');SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{D}';DO $t$ BEGIN IF {discover()}->'items'<>'[]' THEN RAISE EXCEPTION 'Other owner disclosure';END IF;END $t$;ROLLBACK;")
 stage('same-ids-foreign-business-denied',auth(reject('PERFORM '+discover('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'))))
 for label,patch in [('duplicate-source',"jsonb_set(payload,'{inboxItems}',(payload->'inboxItems')||(payload->'inboxItems'))"),('duplicate-customer',"jsonb_set(payload,'{customers}',(payload->'customers')||(payload->'customers'))"),('foreign-source',"jsonb_set(payload,'{inboxItems,0,businessId}','\"foreign\"')"),('changed-source',"jsonb_set(payload,'{inboxItems,0,rawText}','\"Changed customer requirements\"')"),('changed-contact',"jsonb_set(payload,'{customers,0,phone}','\"Changed phone\"')")]:
  stage(label+'-excluded',f"BEGIN;UPDATE public.busy_business_snapshots SET payload={patch} WHERE business_id='{B}';SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{O}';DO $t$ BEGIN IF {discover()}->'items'<>'[]' THEN RAISE EXCEPTION 'Unsupported record exposed';END IF;END $t$;ROLLBACK;")
 stage('malformed-collection-denied',f"BEGIN;UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{inboxItems}}','{{}}') WHERE business_id='{B}';SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{O}';{reject('PERFORM '+discover(),'22023')}ROLLBACK;")
 stage('unsupported-schema-denied',f"BEGIN;UPDATE public.busy_business_snapshots SET schema_version=99 WHERE business_id='{B}';SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{O}';{reject('PERFORM '+discover(),'40001')}ROLLBACK;")
 stage('cursor-malformed-denied',auth(reject('PERFORM '+discover(after='../invalid'),'22023')))
 stage('empty-synthetic-account-for-interruption',f"UPDATE public.busy_business_snapshots SET payload='{{\"unknownNested\":{{\"secretSynthetic\":true}},\"quotes\":[{{\"amount\":95,\"date\":\"2099-01-01\"}}],\"websiteDraft\":{{\"text\":\"Independent\"}}}}' WHERE business_id='{B}';")
 stage('empty-eligible-list-not-absence-proof',auth(f"DO $t$ BEGIN IF {discover()}->'items'<>'[]' THEN RAISE EXCEPTION 'Expected empty eligible list';END IF;END $t$;"))
 # The DB commits normally; discard the returned receipt to model a caller that
 # has no acknowledgement. A new connection observes facts, never the own receipt.
 stage('registration-committed-receipt-not-retained',auth(f"SELECT public.busy_owner_manual_source_v1('{B}',13,'interrupted-first','Owner-supplied catering requirement');",commit=True))
 stage('new-connection-observes-pending-not-own-receipt',expect_state('Pending',14))
 stage('pending-coowner-hidden',f"BEGIN;INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES('{B}','{D}','owner');SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{D}';DO $t$ BEGIN IF {discover()}->'items'<>'[]' THEN RAISE EXCEPTION 'Other owner source disclosed';END IF;END $t$;{reject(f"PERFORM public.busy_owner_pending_review_v1('{B}',14,'interrupted-first')")}ROLLBACK;")
 stage('pending-unknown-extensions-not-disclosed',f"BEGIN;UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{inboxItems,0,unknownPrivate}}','{{\"secretSynthetic\":true}}') WHERE business_id='{B}';SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{O}';DO $t$ DECLARE v jsonb;BEGIN v:={discover()};IF jsonb_array_length(v->'items')<>1 OR v::text LIKE '%secretSynthetic%' THEN RAISE EXCEPTION 'Unknown leak';END IF;END $t$;ROLLBACK;")
 stage('deleted-source-no-discovery-or-replay',f"BEGIN;UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{inboxItems}}','[]'),revision=revision+1 WHERE business_id='{B}';SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{O}';DO $t$ BEGIN IF {discover()}->'items'<>'[]' THEN RAISE EXCEPTION 'Source resurrected';END IF;END $t$;{reject(f"PERFORM public.busy_owner_pending_review_v1('{B}',14,'interrupted-first')",'40001')}ROLLBACK;")
 cap="jsonb_build_object('customerId','interrupted-customer','enquiryId','interrupted-first','sourceRecordId','interrupted-source','intakeId','interrupted-intake','activityId','interrupted-activity','sourceHash',v->>'sourceHash','name','Alex','phone','07700 900123','email','','address','','service','Catering','eventDate','2026-10-23','eventTime','09:00','note','Owner corrected','confidence','High')"
 stage('filing-committed-receipt-not-retained',auth(f"DO $t$ DECLARE v jsonb;BEGIN v:=public.busy_owner_pending_review_v1('{B}',14,'interrupted-first');PERFORM public.busy_owner_first_enquiry_v1('{B}',14,{cap});END $t$;",commit=True))
 stage('new-connection-observes-filed-without-reply',expect_state('FiledWithoutReply',15))
 stage('stale-pending-review-cannot-refile',auth(reject(f"PERFORM public.busy_owner_pending_review_v1('{B}',14,'interrupted-first')",'40001')))
 stage('filed-coowner-hidden',f"BEGIN;INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES('{B}','{D}','owner');SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{D}';DO $t$ BEGIN IF {discover()}->'items'<>'[]' THEN RAISE EXCEPTION 'Other owner filing disclosed';END IF;END $t$;{reject(f"PERFORM public.busy_owner_first_reply_review_v1('{B}',15,'interrupted-customer','interrupted-first')",'22023')}ROLLBACK;")
 stage('private-creation-committed-receipt-not-retained',auth(f"DO $t$ DECLARE v jsonb;BEGIN v:=public.busy_owner_first_reply_review_v1('{B}',15,'interrupted-customer','interrupted-first');PERFORM public.busy_owner_reply_create_v1('{B}',15,'interrupted-customer','interrupted-first',v->>'customerHash',v->>'sourceHash','Exact saved private wording');END $t$;",commit=True))
 stage('new-connection-observes-supported-private-reply',expect_state('FiledWithReply',16))
 stage('fresh-narrow-readback-not-reconstructed-receipt',auth(f"DO $t$ DECLARE v jsonb;BEGIN v:=public.busy_owner_reply_review_v1('{B}','interrupted-customer','interrupted-first',16);IF v->'reply'->>'text'<>'Exact saved private wording' OR v ? 'operation' OR v ? 'previousRevision' THEN RAISE EXCEPTION 'Wrong observation';END IF;END $t$;"))
 stage('independent-unknown-work-preserved',f"DO $t$ DECLARE p jsonb;BEGIN SELECT payload INTO p FROM public.busy_business_snapshots WHERE business_id='{B}';IF p->'unknownNested'->>'secretSynthetic'<>'true' OR p->'quotes'->0->>'amount'<>'95' OR p->'websiteDraft'->>'text'<>'Independent' THEN RAISE EXCEPTION 'Independent work lost';END IF;END $t$;")
 # Stable pagination over synthetic owner-attributed Pending metadata, not write eligibility.
 stage('bounded-stable-pagination',f"BEGIN;UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{inboxItems}}',(SELECT jsonb_agg(jsonb_build_object('id','page-'||lpad(n::text,3,'0'),'status','Pending','rawText','Owner supplied','source','Owner-supplied manual capture','sourceOrigin','owner-manual','registeredBy','{O}')) FROM generate_series(1,26) n)) WHERE business_id='{B}';SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{O}';DO $t$ DECLARE v jsonb;w jsonb;BEGIN v:={discover()};w:=public.busy_owner_enquiry_discover_v1('{B}',v->>'nextAfter');IF jsonb_array_length(v->'items')<>25 OR v->>'hasMore'<>'true' OR v->>'nextAfter'<>'page-025' OR jsonb_array_length(w->'items')<>1 OR w->'items'->0->>'enquiryId'<>'page-026' OR w->>'hasMore'<>'false' THEN RAISE EXCEPTION 'Pagination failed';END IF;END $t$;ROLLBACK;")
 # Revocation transaction wins first. The read blocks on the SAME membership row
 # and rechecks after deletion commits; it must not use stale owner permission.
 holder=subprocess.Popen(base+['-q'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,bufsize=1)
 holder.stdin.write(f"BEGIN;DELETE FROM public.busy_business_memberships WHERE business_id='{B}' AND user_id='{O}';\n\\echo PHASE66_REVOKING\n");holder.stdin.flush();assert any('PHASE66_REVOKING' in l for l in holder.stdout)
 reader=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True);reader.stdin.write("\\set VERBOSITY verbose\nSET statement_timeout='5s';"+auth('SELECT '+discover()+';'));reader.stdin.close();time.sleep(.2);blocked=reader.poll() is None;holder.stdin.write('COMMIT;\n\\q\n');holder.stdin.flush();holder.stdin.close();holder.wait(timeout=8);reader.wait(timeout=8);output=reader.stdout.read()+reader.stderr.read()
 results.append({'id':'actual-revocation-committed-during-read','passed':holder.returncode==0 and blocked and reader.returncode!=0 and '42501' in output,'exitCode':reader.returncode,'holderExitCode':holder.returncode,'expectedDenial':True,'output':output})
 stage('restore-synthetic-owner-only',f"INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES('{B}','{O}','owner');")
 stage('raw-private-select-still-denied',auth(reject('PERFORM payload FROM public.busy_business_snapshots')))
 stage('legacy-full-write-still-denied',auth(reject(f"UPDATE public.busy_business_snapshots SET payload='{{}}' WHERE business_id='{B}'")))
 stage('private-helper-not-exposed',auth(reject(f"PERFORM busy_snapshot_private.initial_reply_context('{B}',16,'interrupted-customer','interrupted-first')")))
 stage('phase66-rollback-keeps-data',(root/'docs/sql-proposals/phase66-snapshot/rollback-readonly.sql').read_text())
 stage('phase66-rollback-denies-discovery',auth(reject('PERFORM '+discover())))
 stage('phase66-rollback-keeps-raw-fence',auth(reject('PERFORM payload FROM public.busy_business_snapshots')))
except Exception as e:results.append({'id':'runner','passed':False,'error':str(e)})
finally:
 rows=json.loads(prior.read_text())['results']+results;data={'scope':'Local synthetic PostgreSQL17; mock UID, not JWT/PostgREST','baselineExitCode':baseline.returncode,'results':rows,'summary':{'passed':sum(x['passed'] for x in rows),'failed':sum(not x['passed'] for x in rows),'blocked':0,'unexecuted':0},'hostedQueries':0};out.write_text(json.dumps(data,indent=2)+'\n');print(json.dumps(data['summary']));sys.exit(0 if not data['summary']['failed'] else 1)
