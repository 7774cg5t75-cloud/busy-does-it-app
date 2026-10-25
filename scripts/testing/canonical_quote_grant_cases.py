"""Quote grant cases registered in the original canonical PostgreSQL scaffolding."""
import json
from concurrent.futures import ThreadPoolExecutor

def register(ctx):
 stage,rpc,run,call,denied,auth,mql,state,root,eq,row,mg_review,mg_decide,mg_read,presentation_review=map(ctx.__getitem__,['stage','rpc','run','call','denied','auth','mql','state','root','eq','row','mg_review','mg_decide','mg_read','presentation_review'])
 B,C,O,M,D,S,APP,REQ,U=map(ctx.__getitem__,['B','C','O','M','D','S','APP','REQ','U'])
 def scope():return [B,C,state['first'],state['bindingFirstRef']]
 def gr(g=None,uid=O):return rpc('quote_grant_read',scope()+[g or state['grantReceipt']['grantId']],uid=uid)
 def review(generation=0):return rpc('quote_grant_review',scope()+[state['grantPrep']['preparationId'],5,generation])
 def args(v,op):return scope()+[v['preparationId'],v['bindingRevision'],v['generation'],v['reviewHash'],op]
 def ca():return [state['grantReceipt']['grantId'],APP,REQ]
 def fixture(name,values,uid=U,commit=False):
  r=call(auth('SELECT public.busy_fixture_quote_'+name+'('+','.join(map(mql,values))+');',uid=uid,commit=commit));assert r.returncode==0,r.stderr;return json.loads(next(x for x in r.stdout.splitlines() if x.startswith('{')))
 def no(name,values,uid=U,code='40001'):
  r=call(auth('SELECT public.busy_fixture_quote_'+name+'('+','.join(map(mql,values))+');',uid=uid));assert r.returncode!=0 and code in r.stderr,r.stdout+r.stderr
 def upgrade():
  run("DO $g$ DECLARE f record;BEGIN FOR f IN SELECT oid::regprocedure AS sig FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN ('busy_work_quote_binding_decide_v1','busy_work_quote_presentation_prepare_v1','busy_work_quote_presentation_withdraw_v1') LOOP EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.sig);END LOOP;END $g$;")
  v=mg_review('replace',REQ);eq(v['revision'],4);mg_decide(v,'grant-fixture-reactivate');v=presentation_review(60);state['grantPrep']=rpc('quote_presentation_prepare',scope()+[5,60,v['reviewHash'],'grant-fixture-prep'],commit=True)
  state['grantSourceBefore']=run(f"BEGIN;SET LOCAL request.jwt.claim.sub='{O}';SELECT busy_work_private.source_context('{B}','{C}','first',NULL);ROLLBACK;")
  state['grantRecipientBefore']=rpc('quote_recipient_review',scope()+[REQ]);state['grantBindingBefore']=mg_read()
  state['grantAllWorkBefore']=run('SELECT row_to_json(x) FROM public.business_work_engagements x ORDER BY id;');state['grantAllPrivateBefore']=run('SELECT row_to_json(x) FROM public.business_work_private_drafts x ORDER BY engagement_id,owner_id,kind;');state['grantOriginalRequests']=run('SELECT row_to_json(x) FROM public.busy_mini_app_requests x ORDER BY id;SELECT row_to_json(x) FROM public.busy_mini_app_request_links x ORDER BY id;');state['grantSnapshotBefore']=run('SELECT payload FROM public.busy_business_snapshots;')
  text=(root/'docs/sql-proposals/canonical-work/quote-grants.sql').read_text();fuse="DO $$ BEGIN RAISE EXCEPTION 'QUOTE GRANT REVIEW FUSE: separate hosted approval required'; END $$;";assert text.count(fuse)==1
  r=call(text);assert r.returncode!=0 and 'QUOTE GRANT REVIEW FUSE' in r.stderr;eq(run("SELECT to_regclass('public.business_work_quote_grant_candidates') IS NULL;").strip(),'t')
  run('CREATE ROLE busy_grant_raw_reader NOLOGIN;GRANT busy_grant_raw_reader TO authenticated;ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO busy_grant_raw_reader;')
  r=call(text.replace(fuse,''));assert r.returncode!=0 and 'Effective quote grant table access detected' in r.stderr,r.stderr
  run('ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE SELECT ON TABLES FROM busy_grant_raw_reader;REVOKE busy_grant_raw_reader FROM authenticated;DROP ROLE busy_grant_raw_reader;')
  r=call(text.replace(fuse,'').replace('COMMIT;','SELECT 1/0;COMMIT;'));assert r.returncode!=0 and 'division by zero' in r.stderr;eq(run("SELECT to_regclass('public.business_work_quote_grant_candidates') IS NULL;").strip(),'t')
  run(text.replace(fuse,''))
  eq(run(f"BEGIN;SET LOCAL request.jwt.claim.sub='{O}';SELECT busy_work_private.source_context('{B}','{C}','first',NULL);ROLLBACK;"),state['grantSourceBefore']);eq(rpc('quote_recipient_review',scope()+[REQ]),state['grantRecipientBefore']);eq(mg_read(),state['grantBindingBefore'])
  # ISOLATED TEST TRANSPORT ONLY. No auth predicate is bypassed or claim rewritten.
  run("CREATE FUNCTION public.busy_fixture_quote_access(uuid,uuid,uuid) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS 'SELECT busy_work_private.grant_candidate_access($1,$2,$3)';REVOKE ALL ON FUNCTION public.busy_fixture_quote_access(uuid,uuid,uuid) FROM PUBLIC,anon,service_role;GRANT EXECUTE ON FUNCTION public.busy_fixture_quote_access(uuid,uuid,uuid) TO authenticated;")
  run("CREATE FUNCTION public.busy_fixture_quote_response(uuid,uuid,uuid,text,text,bigint,text) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS 'SELECT busy_work_private.grant_response_candidate($1,$2,$3,$4,$5,$6,$7)';REVOKE ALL ON FUNCTION public.busy_fixture_quote_response(uuid,uuid,uuid,text,text,bigint,text) FROM PUBLIC,anon,service_role;GRANT EXECUTE ON FUNCTION public.busy_fixture_quote_response(uuid,uuid,uuid,text,text,bigint,text) TO authenticated;")
 stage('grant-upgrade-fuse-inherited-privileges-atomic-failure-and-original-source-parity',upgrade)
 def create():
  v=review();state['grantReview']=v;eq(v['mode'],'candidate_disabled');eq(v['recipientEvidence']['recipient']['consumerId'],U);assert 'plannedQuoteDate' not in v['projection']
  invalid=args(v,'grant-null-generation');invalid[6]=None;denied('SELECT public.busy_work_quote_grant_create_v1('+','.join(map(mql,invalid))+');',code='22023')
  def send(n):return call(auth('SELECT public.busy_work_quote_grant_create_v1('+','.join(map(mql,args(v,'grant-create-race-'+str(n))))+');',commit=True))
  with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(send,[1,2]))
  eq(sorted(r.returncode==0 for r in results),[False,True]);assert any('40001' in r.stderr for r in results)
  g=json.loads(next(x for r in results if r.returncode==0 for x in r.stdout.splitlines() if x.startswith('{')));state['grantReceipt']=g;eq(g['ownOperationReceipt'],True);eq(g['revision'],1);eq(g['generation'],1);eq(g['consumerAccessAuthorised'],False);r=gr();eq(r['state'],'eligible_candidate_disabled');eq(r['notOwnReceipt'],True);assert 'operationId' not in r;eq(rpc('quote_grant_list',scope()+[None,20])['items'][0]['grantId'],g['grantId'])
 stage('owner-grant-review-create-independent-identity-revision-and-readback',create)
 stage('grant-duplicate-approval-and-generation-conflict-denied',lambda:denied('SELECT public.busy_work_quote_grant_create_v1('+','.join(map(mql,args(state['grantReview'],'grant-create-replay')))+');',code='40001'))
 for uid,label in [(M,'member'),(D,'foreign'),(S,'coowner'),(U,'consumer')]:stage(label+'-owner-grant-read-and-review-denied',lambda uid=uid:(denied('SELECT public.busy_work_quote_grant_read_v1('+','.join(map(mql,scope()+[state['grantReceipt']['grantId']]))+');',uid=uid),denied('SELECT public.busy_work_quote_grant_review_v1('+','.join(map(mql,scope()+[state['grantPrep']['preparationId'],5,0]))+');',uid=uid)))
 def access():
  v=fixture('access',ca());eq(v['candidateActorId'],U);eq(v['validationOnly'],True);eq(v['consumerAccessAuthorised'],False);eq(set(v['projection']),{'quoteReference','quoteRevision','termsHash','businessAppSlug','businessDisplayName','amount','wording','status','appointmentConfirmed'});assert not any(x in str(v['projection']) for x in ['secretSynthetic','ownerAccount','work_notes','followup','customerId','plannedQuoteDate'])
 stage('fictional-authenticated-consumer-exact-grant-request-and-safe-projection',access)
 for uid,label in [(O,'owner'),(M,'member'),(D,'foreign'),(S,'coowner')]:stage(label+'-cannot-consume-another-recipients-grant',lambda uid=uid:no('access',ca(),uid=uid,code='42501'))
 stage('same-consumer-wrong-original-request-and-app-denied',lambda:(no('access',[state['grantReceipt']['grantId'],APP,'77777777-7777-4777-8777-777777777777'],code='42501'),no('access',[state['grantReceipt']['grantId'],D,REQ],code='42501')))
 stage('same-customer-other-quote-cannot-read-grant',lambda:denied('SELECT public.busy_work_quote_grant_read_v1('+','.join(map(mql,[B,C,state['second'],state['recipientRef'],state['grantReceipt']['grantId']]))+');'))
 def patch(sql,code='40001'):
  r=call('BEGIN;'+sql+f"SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{U}';SELECT public.busy_fixture_quote_access("+','.join(map(mql,ca()))+');ROLLBACK;');assert r.returncode!=0 and code in r.stderr,r.stderr
 for sql,label in [(f"UPDATE public.busy_mini_app_requests SET updated_at=updated_at+interval '1 second' WHERE id='{REQ}';",'request'),(f"UPDATE public.busy_mini_app_request_links SET updated_at=updated_at+interval '1 second' WHERE request_id='{REQ}';",'link'),(f"UPDATE public.busy_mini_apps SET current_live_version_id=NULL WHERE id='{APP}';",'app-version'),(f"UPDATE public.busy_mini_apps SET display_name='Changed name' WHERE id='{APP}';",'business-name'),(f"UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{inboxItems,0,rawText}}',to_jsonb('Changed requirements'::text)) WHERE business_id='{B}';",'source')]:stage('grant-stale-'+label+'-denied',lambda sql=sql:patch(sql))
 for sql,label in [(f"DELETE FROM public.busy_business_memberships WHERE business_id='{B}' AND user_id='{O}';",'revoked-owner'),(f"UPDATE public.busy_business_memberships SET role='admin' WHERE business_id='{B}' AND user_id='{O}';",'admin-owner')]:stage('grant-'+label+'-denied',lambda sql=sql:patch(sql,'42501'))
 stage('grant-current-customer-privacy-restriction-denied',lambda:patch(f"UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{customers,0,contactOk}}','false') WHERE business_id='{B}';",'22023'))
 def binding_change(action):
  v=mg_review(action,REQ if action=='replace' else None,5);sql=f"SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{O}';SELECT public.busy_work_quote_binding_decide_v1("+','.join(map(mql,scope()+[action,v['requestId'],5,v['reviewHash'],'grant-binding-'+action]))+');';patch(sql)
 stage('grant-binding-revocation-invalidates-without-quote-change',lambda:binding_change('revoke'))
 stage('grant-binding-replacement-same-consumer-requires-new-review',lambda:binding_change('replace'))
 stage('grant-private-preparation-withdrawal-invalidates',lambda:patch(f"SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{O}';SELECT public.busy_work_quote_presentation_withdraw_v1("+','.join(map(mql,scope()+[state['grantPrep']['preparationId'],1,'grant-prep-withdraw']))+');'))
 stage('grant-expiry-boundary-denied',lambda:patch("ALTER TABLE public.business_work_quote_grant_candidates DISABLE TRIGGER immutable_quote_candidate;UPDATE public.business_work_quote_grant_candidates SET recorded_at=clock_timestamp()-interval '2 hours',expires_at=clock_timestamp()-interval '1 millisecond' WHERE id="+mql(state['grantReceipt']['grantId'])+';'))
 def question():
  words='  Exact customer question\nverbatim  ';v=fixture('response',ca()+['question',words,0,'candidate-question-first'],commit=True);state['responseReceipt']=v;eq(v['ownOperationReceipt'],True);eq(v['actorId'],U);eq(v['revision'],1);eq(v['legalAcceptanceEstablished'],False);r=rpc('quote_response_candidates',scope()+[state['grantReceipt']['grantId'],0,1]);eq(r['items'][0]['question'],words);eq(r['items'][0]['actorId'],U)
 stage('authenticated-typed-question-candidate-exact-wording-time-and-own-receipt',question)
 def concurrent_response():
  def send(n):return call(auth('SELECT public.busy_fixture_quote_response('+','.join(map(mql,ca()+['question','Concurrent question '+str(n),2,'concurrent-response-'+str(n)]))+');',uid=U,commit=True))
  with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(send,[1,2]))
  eq(sorted(r.returncode==0 for r in results),[False,True]);assert any('40001' in r.stderr for r in results);eq(len(rpc('quote_response_candidates',scope()+[state['grantReceipt']['grantId'],2,20])['items']),1)
 stage('typed-response-stale-and-unstructured-action-denial',lambda:(no('response',ca()+['decline','',0,'candidate-stale-response']),no('response',ca()+['accept','price matches',1,'candidate-text-response'],code='22023'),no('response',ca()+['book','',1,'candidate-book-response'],code='22023')))
 def accept():
  v=fixture('response',ca()+['accept','',1,'candidate-accept-response'],commit=True);eq(v['revision'],2);eq(v['legalAcceptanceEstablished'],False);eq(v['consumerAccessAuthorised'],False);eq(rpc('quote_response_candidates',scope()+[state['grantReceipt']['grantId'],1,1])['items'][0]['action'],'accept');eq(row(state['first'])['status'],'Prepared');eq(run('SELECT count(*) FROM public.busy_mini_app_work_bookings;').strip(),'0')
 stage('typed-accept-candidate-not-quote-acceptance-booking-or-payment',accept)
 stage('competing-authenticated-response-revisions-one-winner',concurrent_response)
 for table in ['business_work_quote_grant_candidates','business_work_quote_grant_revocations','business_work_quote_response_candidates']:stage(table+'-raw-and-service-denied',lambda table=table:(denied('SELECT * FROM public.'+table+';'),denied('SELECT * FROM public.'+table+';',role='service_role')))
 stage('private-consumer-workers-no-app-execution',lambda:(denied('SELECT busy_work_private.grant_candidate_access('+','.join(map(mql,ca()))+');',uid=U),denied('SELECT busy_work_private.grant_candidate_access('+','.join(map(mql,ca()))+');',role='service_role')))
 for action in ['accept','decline','question']:stage('production-consumer-'+action+'-always-denied',lambda action=action:denied('SELECT public.busy_work_consumer_quote_response_v1('+','.join(map(mql,[state['grantReceipt']['grantId'],action,'production-gate-denied']))+');',uid=U))
 def revoke():
  gid=state['grantReceipt']['grantId'];v=rpc('quote_grant_revoke_review',scope()+[gid,1]);state['grantRevokeReview']=v;r=rpc('quote_grant_revoke',scope()+[gid,1,v['reviewHash'],'grant-revoke-first'],commit=True);eq(r['ownOperationReceipt'],True);eq(r['revision'],2);eq(gr()['state'],'revoked');eq(gr()['projection'],None);no('access',ca());no('response',ca()+['question','Late question',2,'candidate-late-response'])
 stage('grant-revocation-independent-CAS-and-late-response-denied',revoke)
 stage('grant-repeated-revocation-denied',lambda:denied('SELECT public.busy_work_quote_grant_revoke_v1('+','.join(map(mql,scope()+[state['grantReceipt']['grantId'],1,state['grantRevokeReview']['reviewHash'],'grant-revoke-replay']))+');',code='40001'))
 def next_generation():
  v=review(None);eq(v['generation'],1);r=rpc('quote_grant_create',args(v,'grant-second-reviewed'),commit=True);state['grantSecondReceipt']=r;eq(r['generation'],2);assert r['grantId']!=state['grantReceipt']['grantId'];eq(gr(r['grantId'])['state'],'eligible_candidate_disabled');eq(gr()['state'],'revoked')
 stage('new-explicit-grant-generation-preserves-earlier-grant',next_generation)
 def preserve():
  eq(run('SELECT row_to_json(x) FROM public.business_work_engagements x ORDER BY id;'),state['grantAllWorkBefore']);eq(run('SELECT row_to_json(x) FROM public.business_work_private_drafts x ORDER BY engagement_id,owner_id,kind;'),state['grantAllPrivateBefore']);eq(run('SELECT row_to_json(x) FROM public.busy_mini_app_requests x ORDER BY id;SELECT row_to_json(x) FROM public.busy_mini_app_request_links x ORDER BY id;'),state['grantOriginalRequests']);eq(run('SELECT payload FROM public.busy_business_snapshots;'),state['grantSnapshotBefore']);eq(run('SELECT count(*) FROM public.busy_mini_app_work_bookings;').strip(),'0')
 stage('grant-response-preserves-all-work-private-purposes-requests-and-snapshot',preserve)
 def rollback():
  run((root/'docs/sql-proposals/canonical-work/quote-grants-rollback.sql').read_text());eq(gr()['state'],'revoked');eq(gr(state['grantSecondReceipt']['grantId'])['state'],'eligible_candidate_disabled');denied('SELECT public.busy_work_quote_grant_review_v1('+','.join(map(mql,scope()+[state['grantPrep']['preparationId'],5,2]))+');');no('response',[state['grantSecondReceipt']['grantId'],APP,REQ,'question','No rollback write',0,'rollback-response-denied'],code='42501');denied('SELECT public.busy_work_consumer_quote_access_v1('+mql(state['grantSecondReceipt']['grantId'])+');',uid=U);preserve();run('DROP FUNCTION public.busy_fixture_quote_access(uuid,uuid,uuid);DROP FUNCTION public.busy_fixture_quote_response(uuid,uuid,uuid,text,text,bigint,text);')
 stage('grant-retaining-rollback-closed-writes-and-production-consumer-boundary',rollback)
