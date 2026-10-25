#!/usr/bin/env python3
"""Actual JS original-parent/finite adapter -> local psql RPC bridge, no HTTP/TCP."""
import argparse,json,pathlib,subprocess,sys,re,select,time,hashlib
p=argparse.ArgumentParser()
for n in ['bin-dir','socket','sql-report','output']:p.add_argument('--'+n,required=True)
p.add_argument('--run-tag',default='review2');a=p.parse_args();assert re.fullmatch(r'[A-Za-z0-9_-]{1,24}',a.run_tag);first_id='client-'+a.run_tag+'-first';second_id='client-'+a.run_tag+'-second';root=pathlib.Path(__file__).resolve().parents[2];prior=json.loads(pathlib.Path(a.sql_report).read_text());assert prior['summary']['passed']==317 and all(prior['summary'].get(k,0)==0 for k in ['failed','blocked','unexecuted'])
assert prior['candidateSha256']==hashlib.sha256((root/'docs/sql-proposals/canonical-work/engagements.sql').read_bytes()).hexdigest(),'SQL report does not match current candidate'
assert prior['upgradeSha256']==hashlib.sha256((root/'docs/sql-proposals/canonical-work/recipient-management.sql').read_bytes()).hexdigest(),'Upgrade report does not match current candidate'
assert prior['grantSqlSha256']==hashlib.sha256((root/'docs/sql-proposals/canonical-work/quote-grants.sql').read_bytes()).hexdigest(),'Grant report does not match current candidate'
B='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';O='cccccccc-cccc-4ccc-8ccc-cccccccccccc';C='repeat'
base=[str(pathlib.Path(a.bin_dir)/'psql'),'-X','-h',a.socket,'-U','postgres','-d','busy_phase58_disposable','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','-At']
assert a.socket.startswith(('/workspace/','/tmp/'))
def call(sql):return subprocess.run(base,input=sql,text=True,capture_output=True,timeout=15)
assert str((pathlib.Path(a.socket).parent/'data').resolve()) in call('SHOW data_directory;').stdout
assert call('SHOW listen_addresses;').stdout.strip()==''
def run(sql):
 r=call(sql);assert r.returncode==0,r.stderr;return r.stdout

def quote(v):return 'NULL' if v is None else "'"+str(v).replace("'","''")+"'"
# Re-enable only the exact locally reviewed RPCs AFTER independently verified rollback.
run("DO $x$ DECLARE f record;BEGIN FOR f IN SELECT oid::regprocedure AS sig FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN ('busy_work_create_quote_v1','busy_work_edit_quote_v1','busy_work_private_write_v1','busy_work_agreement_create_v1','busy_work_agreement_decide_v1','busy_work_quote_reference_create_v1','busy_work_quote_binding_write_v1','busy_work_quote_binding_decide_v1','busy_work_quote_presentation_prepare_v1','busy_work_quote_presentation_withdraw_v1','busy_work_quote_grant_create_v1','busy_work_quote_grant_revoke_v1') LOOP EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.sig);END LOOP;END $x$;")
run(f"UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{inboxItems}}',(payload->'inboxItems')||jsonb_build_array((payload->'inboxItems'->1)||jsonb_build_object('id',{quote(first_id)}),(payload->'inboxItems'->1)||jsonb_build_object('id',{quote(second_id)}))) WHERE business_id='{B}';")
payload=json.loads(run(f"SELECT payload FROM public.busy_business_snapshots WHERE business_id='{B}';").splitlines()[0]);before=run(f"SELECT md5(payload::text) FROM public.busy_business_snapshots WHERE business_id='{B}';").strip()
args={
'quote_grant_review':['p_business_id', 'p_customer_id', 'p_engagement_id', 'p_reference_id', 'p_preparation_id', 'p_expected_binding_revision', 'p_expected_generation'],
'quote_grant_create':['p_business_id', 'p_customer_id', 'p_engagement_id', 'p_reference_id', 'p_preparation_id', 'p_expected_binding_revision', 'p_expected_generation', 'p_review_hash', 'p_operation_id'],
'quote_grant_list':['p_business_id', 'p_customer_id', 'p_engagement_id', 'p_reference_id', 'p_after', 'p_limit'],
'quote_grant_read':['p_business_id', 'p_customer_id', 'p_engagement_id', 'p_reference_id', 'p_grant_id'],
'quote_grant_revoke_review':['p_business_id', 'p_customer_id', 'p_engagement_id', 'p_reference_id', 'p_grant_id', 'p_expected_revision'],
'quote_grant_revoke':['p_business_id', 'p_customer_id', 'p_engagement_id', 'p_reference_id', 'p_grant_id', 'p_expected_revision', 'p_review_hash', 'p_operation_id'],
'quote_response_candidates':['p_business_id', 'p_customer_id', 'p_engagement_id', 'p_reference_id', 'p_grant_id', 'p_after', 'p_limit'],

'quote_binding_manage_review':['p_business_id', 'p_customer_id', 'p_engagement_id', 'p_reference_id', 'p_action', 'p_request_id', 'p_expected_revision'],
'quote_binding_decide':['p_business_id', 'p_customer_id', 'p_engagement_id', 'p_reference_id', 'p_action', 'p_request_id', 'p_expected_revision', 'p_review_hash', 'p_operation_id'],
'quote_binding_history':['p_business_id', 'p_customer_id', 'p_engagement_id', 'p_reference_id', 'p_before', 'p_limit'],
'quote_presentation_review':['p_business_id', 'p_customer_id', 'p_engagement_id', 'p_reference_id', 'p_expected_revision', 'p_duration_minutes'],
'quote_presentation_prepare':['p_business_id', 'p_customer_id', 'p_engagement_id', 'p_reference_id', 'p_expected_revision', 'p_duration_minutes', 'p_review_hash', 'p_operation_id'],
'quote_presentation_read':['p_business_id', 'p_customer_id', 'p_engagement_id', 'p_reference_id'],
'quote_presentation_withdraw':['p_business_id', 'p_customer_id', 'p_engagement_id', 'p_reference_id', 'p_preparation_id', 'p_expected_revision', 'p_operation_id'],

 'quote_binding_context':['p_business_id','p_customer_id','p_engagement_id','p_reference_id','p_request_id','p_expected_quote_revision'],
 'quote_binding_write':['p_business_id','p_customer_id','p_engagement_id','p_reference_id','p_request_id','p_expected_quote_revision','p_expected_binding_revision','p_review_hash','p_operation_id'],
 'quote_binding_read':['p_business_id','p_customer_id','p_engagement_id','p_reference_id'],
 'booking_readiness':['p_business_id','p_customer_id','p_engagement_id','p_evidence_id'],
 'agreement_decision_review':['p_business_id','p_customer_id','p_engagement_id','p_evidence_id','p_expected_revision'],
 'agreement_decide':['p_business_id','p_customer_id','p_engagement_id','p_evidence_id','p_expected_revision','p_expected_decision_revision','p_terms_hash','p_action','p_statement','p_operation_id'],
 'quote_reference_review':['p_business_id','p_customer_id','p_engagement_id','p_expected_revision'],
 'quote_reference_create':['p_business_id','p_customer_id','p_engagement_id','p_expected_revision','p_terms_hash','p_operation_id'],
 'quote_reference_list':['p_business_id','p_customer_id','p_engagement_id','p_after','p_limit'],
 'quote_reference_read':['p_business_id','p_customer_id','p_engagement_id','p_reference_id'],
 'quote_recipient_candidates':['p_business_id','p_customer_id','p_engagement_id','p_reference_id','p_after','p_limit'],
 'quote_recipient_review':['p_business_id','p_customer_id','p_engagement_id','p_reference_id','p_request_id'],
 'agreement_review':['p_business_id','p_customer_id','p_engagement_id','p_expected_revision'],
 'agreement_create':['p_business_id','p_customer_id','p_engagement_id','p_expected_revision','p_terms_hash','p_owner_account','p_operation_id'],
 'agreement_list':['p_business_id','p_customer_id','p_engagement_id','p_after','p_limit'],
 'agreement_read':['p_business_id','p_customer_id','p_engagement_id','p_evidence_id'],
 'source_review':['p_business_id','p_customer_id','p_enquiry_id','p_expected_snapshot_revision'],
 'list':['p_business_id','p_customer_id','p_after','p_limit'],
 'discover':['p_business_id','p_after','p_limit'],
 'edit_context':['p_business_id','p_customer_id','p_engagement_id','p_expected_revision'],
 'compare':['p_business_id','p_customer_id','p_engagement_id'],
 'history':['p_business_id','p_customer_id','p_engagement_id'],'read':['p_business_id','p_customer_id','p_engagement_id'],
 'create_quote':['p_business_id','p_customer_id','p_enquiry_id','p_expected_snapshot_revision','p_customer_hash','p_source_hash','p_amount','p_text','p_date','p_operation_id'],
 'edit_quote':['p_business_id','p_customer_id','p_engagement_id','p_expected_revision','p_source_hash','p_amount','p_text','p_date','p_operation_id'],
 'private_read':['p_business_id','p_customer_id','p_engagement_id','p_kind'],
 'private_write':['p_business_id','p_customer_id','p_engagement_id','p_engagement_revision','p_expected_draft_revision','p_source_hash','p_kind','p_text','p_operation_id']}
child=subprocess.Popen(['node',str(root/'scripts/check-mission15-canonical-work-postgres-client.mjs')],cwd=root,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,bufsize=1)
child.stdin.write(json.dumps({'businessId':B,'ownerId':O,'customer':payload['customers'][0],'inboxItems':[x for x in payload['inboxItems'] if x['id'] in [first_id,second_id]],'firstEnquiryId':first_id,'secondEnquiryId':second_id,'legacy':payload['replyActions'][C]})+'\n');child.stdin.flush();calls=[];fixtureCalls=[];result=None;deadline=time.monotonic()+90
try:
 while time.monotonic()<deadline:
  if not select.select([child.stdout],[],[],.5)[0]:
   if child.poll() is not None:break
   continue
  line=child.stdout.readline()
  if not line:break
  msg=json.loads(line)
  if msg.get('done'):result=msg;break
  if msg.get('fixture') in ('correct-source','restore-source'):
   assert msg.get('enquiryId')==first_id
   words='Fictional corrected current requirements' if msg['fixture']=='correct-source' else next(x['rawText'] for x in payload['inboxItems'] if x['id']==first_id)
   run(f"UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,ARRAY['inboxItems',(SELECT (ordinality-1)::text FROM jsonb_array_elements(payload->'inboxItems') WITH ORDINALITY a WHERE a.value->>'id'={quote(first_id)}),'rawText'],to_jsonb({quote(words)}::text)) WHERE business_id='{B}';")
   child.stdin.write(json.dumps({'fixtureDone':True})+'\n');child.stdin.flush();continue
  if msg.get('fixture')=='grant-question-candidate':
   gid=msg.get('grantId');assert re.fullmatch(r'[0-9a-f-]{36}',gid or '')
   g=json.loads(run("SELECT row_to_json(g) FROM public.business_work_quote_grant_candidates g WHERE id="+quote(gid)+" AND created_by="+quote(O)+" AND business_id="+quote(B)+";").splitlines()[0])
   assert run("SELECT enquiry_id FROM public.business_work_engagements WHERE id="+quote(g['engagement_id'])+";").strip()==first_id
   # Isolated test transport, absent from deployable SQL. The private worker still checks auth.uid(), exact recipient, grant and source.
   run("CREATE FUNCTION public.busy_fixture_bridge_response(uuid,uuid,uuid) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$ SELECT busy_work_private.grant_response_candidate($1,$2,$3,'question','  Fictional exact question\nkept  ',0,'bridge-question-candidate') $$;REVOKE ALL ON FUNCTION public.busy_fixture_bridge_response(uuid,uuid,uuid) FROM PUBLIC,anon,service_role;GRANT EXECUTE ON FUNCTION public.busy_fixture_bridge_response(uuid,uuid,uuid) TO authenticated;")
   r=call('BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='+quote(g['consumer_id'])+';SELECT public.busy_fixture_bridge_response('+','.join(quote(g[k]) for k in ['id','app_id','request_id'])+');COMMIT;')
   fixtureCalls.append({'kind':'isolated_authenticated_consumer_question_candidate','exitCode':r.returncode,'output':r.stdout+r.stderr});assert r.returncode==0,r.stderr
   run('DROP FUNCTION public.busy_fixture_bridge_response(uuid,uuid,uuid);')
   child.stdin.write(json.dumps({'fixtureDone':True})+'\n');child.stdin.flush();continue
  route=msg['route'];assert route.startswith('rpc/busy_work_') and route.endswith('_v1');name=route[len('rpc/busy_work_'):-3];assert name in args;body=msg['body'];assert set(body)==set(args[name]) and body['p_business_id']==B and (name=='discover' or body['p_customer_id']==C)
  sql='BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='+quote(O)+';SELECT public.busy_work_'+name+'_v1('+','.join(quote(body[k]) for k in args[name])+');COMMIT;';r=call(sql);calls.append({'route':route,'body':body,'exitCode':r.returncode,'output':r.stdout+r.stderr})
  value={'error':r.stderr} if r.returncode else {'value':json.loads(next(x for x in r.stdout.splitlines() if x.startswith('{')))}
  child.stdin.write(json.dumps(value)+'\n');child.stdin.flush()
 child.stdin.close();child.wait(timeout=10);error=child.stderr.read();after=run(f"SELECT md5(payload::text) FROM public.busy_business_snapshots WHERE business_id='{B}';").strip();ok=child.returncode==0 and result is not None and before==after and all(c['exitCode']==0 for c in calls)
except Exception as e:
 error=str(e);ok=False;child.terminate();child.wait(timeout=5)
finally:
 run('DROP FUNCTION IF EXISTS public.busy_fixture_bridge_response(uuid,uuid,uuid);')
 run((root/'docs/sql-proposals/canonical-work/rollback-readonly.sql').read_text())
 v={'scope':'Actual original JS components/adapter to actual disposable PG17 via inert transport bridge. Mock UID, not Supabase JWT/PostgREST/native UI.','passed':ok,'nodeExit':child.returncode,'result':result,'calls':calls,'fixtureCalls':fixtureCalls,'legacyAndWholeSnapshotUnchanged':before==after if 'after' in locals() else False,'error':error,'hostedDatabaseQueries':0};pathlib.Path(a.output).write_text(json.dumps(v,indent=2)+'\n');print(json.dumps({'passed':ok,'calls':len(calls),'nodeExit':child.returncode,'error':error[:500]}));sys.exit(0 if ok else 1)
