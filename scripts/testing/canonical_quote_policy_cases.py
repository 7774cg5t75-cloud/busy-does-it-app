"""V22.53 stages on the original canonical scaffolding; fictional local data only."""
import json
from concurrent.futures import ThreadPoolExecutor

def register(ctx):
 stage,rpc,run,call,denied,auth,mql,state,root,eq=map(ctx.__getitem__,['stage','rpc','run','call','denied','auth','mql','state','root','eq'])
 B,C,O,M,D,S,APP,REQ,U=map(ctx.__getitem__,['B','C','O','M','D','S','APP','REQ','U'])
 def scope():return [B,C,state['first'],state['bindingFirstRef'],state['grantSecondReceipt']['grantId']]
 def fields():return {'quoteIdentifier':'Fictional-Q-1','paymentTerms':'No payment execution','cancellationInformation':'Provisional; legal review required','proposedTiming':'Proposed only, subject to owner review'}
 def args(days=14,deadline=None,f=None):return scope()+[days,'Europe/London',deadline or state['policyDeadline'],json.dumps(f if f is not None else fields())]
 def read():return rpc('quote_access_read',scope())
 def fixture(name,values,uid=U,commit=False):
  r=call(auth('SELECT public.busy_fixture_policy_'+name+'('+','.join(map(mql,values))+');',uid=uid,commit=commit));assert r.returncode==0,r.stderr;return json.loads(next(x for x in r.stdout.splitlines() if x.startswith('{')))
 def no(name,values,uid=U,code='40001'):
  r=call(auth('SELECT public.busy_fixture_policy_'+name+'('+','.join(map(mql,values))+');',uid=uid));assert r.returncode!=0 and code in r.stderr,r.stdout+r.stderr
 def upgrade():
  state['policyDeadline']=run("SELECT clock_timestamp()+interval '5 days';").strip()
  state['policyBefore']=run('SELECT row_to_json(x) FROM public.business_work_engagements x ORDER BY id;SELECT row_to_json(x) FROM public.business_work_private_drafts x ORDER BY engagement_id,owner_id,kind;SELECT payload FROM public.busy_business_snapshots;SELECT row_to_json(x) FROM public.busy_mini_app_requests x ORDER BY id;SELECT row_to_json(x) FROM public.busy_mini_app_request_links x ORDER BY id;')
  text=(root/'docs/sql-proposals/canonical-work/quote-access-policy.sql').read_text();fuse="DO $$ BEGIN RAISE EXCEPTION 'QUOTE ACCESS POLICY REVIEW FUSE: separate hosted approval required';END $$;";assert text.count(fuse)==1
  r=call(text);assert r.returncode!=0 and 'QUOTE ACCESS POLICY REVIEW FUSE' in r.stderr
  r=call(text.replace(fuse,'').replace('COMMIT;','SELECT 1/0;COMMIT;'));assert r.returncode!=0 and 'division by zero' in r.stderr,r.stderr
  eq(run("SELECT to_regclass('public.business_work_quote_presentations') IS NULL;").strip(),'t')
  run('CREATE ROLE busy_policy_raw_reader NOLOGIN;GRANT busy_policy_raw_reader TO authenticated;ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO busy_policy_raw_reader;')
  r=call(text.replace(fuse,''));assert r.returncode!=0 and 'Effective quote policy raw access detected' in r.stderr,r.stderr
  run('ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE SELECT ON TABLES FROM busy_policy_raw_reader;REVOKE busy_policy_raw_reader FROM authenticated;DROP ROLE busy_policy_raw_reader;')
  run(text.replace(fuse,''))
  run("CREATE FUNCTION public.busy_fixture_policy_session(uuid,uuid) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS 'SELECT busy_work_private.quote_session_validation($1,$2)';REVOKE ALL ON FUNCTION public.busy_fixture_policy_session(uuid,uuid) FROM PUBLIC,anon,service_role;GRANT EXECUTE ON FUNCTION public.busy_fixture_policy_session(uuid,uuid) TO authenticated;")
  run("CREATE FUNCTION public.busy_fixture_policy_decision(uuid,uuid,text,text,bigint,text) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS 'SELECT busy_work_private.quote_decision_validation($1,$2,$3,$4,$5,$6)';REVOKE ALL ON FUNCTION public.busy_fixture_policy_decision(uuid,uuid,text,text,bigint,text) FROM PUBLIC,anon,service_role;GRANT EXECUTE ON FUNCTION public.busy_fixture_policy_decision(uuid,uuid,text,text,bigint,text) TO authenticated;")
 stage('v2253-additive-policy-fuse-atomic-upgrade',upgrade)
 for days in [7,14,30]:stage('approved-'+str(days)+'-calendar-day-review',lambda days=days:(eq(rpc('quote_access_review',args(days))['durationDays'],days),eq(rpc('quote_access_review',args(days))['activatedAt'],None),eq(rpc('quote_access_review',args(days))['expiresAt'],None)))
 for days in [0,15,60]:stage('unsupported-duration-'+str(days)+'-denied',lambda days=days:denied('SELECT public.busy_work_quote_access_review_v1('+','.join(map(mql,args(days)))+');',code='22023'))
 def calendar():
  x=json.loads(run("SELECT jsonb_build_object('capped',busy_work_private.quote_calendar_expiry('2026-10-24T12:00:00Z',14,'2026-10-26T12:00:00Z','Europe/London'),'dst',busy_work_private.quote_calendar_expiry('2026-10-24T12:00:00Z',7,'2027-01-01','Europe/London'));").strip());assert x['capped'].startswith('2026-10-26T12:00:00');assert x['dst'].startswith('2026-10-31T13:00:00')
 stage('trusted-calendar-days-DST-and-earlier-quote-validity-cap',calendar)
 stage('expired-quote-and-invalid-time-zone-denied',lambda:(denied('SELECT public.busy_work_quote_access_review_v1('+','.join(map(mql,args(deadline='2000-01-01T00:00:00Z')))+');',code='22023'),denied("SELECT busy_work_private.quote_calendar_expiry(now(),14,now(),'Invented/Zone');",role='postgres',code='22023')))
 for key in ['sourceHash','internalNotes','profitMargin','customerId','unknownExtension','scope','total','approvedLogoUrl']:stage('disclosure-injection-'+key+'-denied',lambda key=key:denied('SELECT public.busy_work_quote_access_review_v1('+','.join(map(mql,args(f=fields()|{key:'secret'})))+');',code='22023'))
 stage('nested-itemisation-missing-fields-denied',lambda:denied('SELECT public.busy_work_quote_access_review_v1('+','.join(map(mql,args(f=fields()|{'itemisedPrices':[{}]})))+');',code='22023'))
 def prepare():
  item={'description':'Fictional free item','quantity':'1','unitPrice':'0','vatAmount':'0','lineTotal':'0'}
  item_review=rpc('quote_access_review',args(f=fields()|{'itemisedPrices':[item]}));eq(item_review['projection']['itemisedPrices'],[item]);eq(item_review['projection']['vatTotal'],'0')
  denied('SELECT public.busy_work_quote_access_review_v1('+','.join(map(mql,args(f=fields()|{'itemisedPrices':[item|{'supplierCost':'secret'}]})))+');',code='22023')
  v=rpc('quote_access_review',args());state['policyReview']=v;eq(v['projection']['total'],'0');eq(v['projection']['scope'],state['grantSecondReceipt'].get('wording',v['projection']['scope']));assert not any(k in v['projection'] for k in ['sourceHash','termsHash','customerId','engagementId','work_notes','followup','plannedQuoteDate'])
  r=rpc('quote_access_prepare',args()+[v['reviewHash'],'policy-prepare-first'],commit=True);state['policyReceipt']=r;eq(r['ownOperationReceipt'],True);eq(r['activatedAt'],None);eq(read()['projection'],v['projection']);eq(read()['notOwnReceipt'],True)
 stage('owner-exact-reviewed-presentation-private-save-independent-readback',prepare)
 for uid,label in [(M,'member'),(D,'foreign'),(S,'coowner'),(U,'consumer')]:stage('policy-'+label+'-read-denied',lambda uid=uid:denied('SELECT public.busy_work_quote_access_read_v1('+','.join(map(mql,scope()))+');',uid=uid))
 stage('duplicate-owner-preparation-denied',lambda:denied('SELECT public.busy_work_quote_access_prepare_v1('+','.join(map(mql,args()+[state['policyReview']['reviewHash'],'policy-prepare-replay']))+');',code='40001'))
 def activate():
  pid=state['policyReceipt']['presentationId'];v=json.loads(next(x for x in run(auth("SELECT busy_work_private.quote_activation_validation("+mql(pid)+');',role='postgres',commit=True)).splitlines() if x.startswith('{')));eq(v['mode'],'local_validation_only');eq(v['consumerAccessAuthorised'],False);assert v['expiresAt'].startswith(state['policyDeadline'][:10]);eq(read()['activatedAt'],None)
 stage('fictional-local-activation-server-time-cap-not-public-entitlement',activate)
 def session():
  v=fixture('session',[state['policyReceipt']['presentationId'],None],commit=True);state['policySession']=v;eq(v['requiresHostedSessionProof'],True);eq(v['consumerAccessAuthorised'],False);eq(fixture('session',[v['presentationId'],v['sessionId']])['sessionRevision'],2)
 stage('authenticated-local-server-session-15-minute-idle-control',session)
 def idle():
  pid=state['policyReceipt']['presentationId'];sid=state['policySession']['sessionId'];sql="UPDATE busy_work_private.quote_viewing_validation_sessions SET last_activity_at=clock_timestamp()-interval '15 minutes' WHERE id="+mql(sid)+';SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='+mql(U)+';SELECT public.busy_fixture_policy_session('+','.join(map(mql,[pid,sid]))+');';r=call('BEGIN;'+sql+'ROLLBACK;');assert r.returncode!=0 and '40001' in r.stderr
 stage('exact-idle-boundary-denies-without-client-activity-time',idle)
 for uid,label in [(O,'owner'),(M,'member'),(D,'foreign'),(S,'coowner')]:stage('policy-session-'+label+'-wrong-recipient-denied',lambda uid=uid:no('session',[state['policyReceipt']['presentationId'],None],uid=uid,code='42501'))
 for action in ['accept','accept_and_agree_to_pay']:stage('provisional-'+action+'-legally-ineligible-denied',lambda action=action:no('decision',[state['policyReceipt']['presentationId'],state['policySession']['sessionId'],action,'',0,'policy-binding-denied'],code='42501'))
 def proceed():
  v=fixture('decision',[state['policyReceipt']['presentationId'],state['policySession']['sessionId'],'request_to_proceed','',0,'policy-proceed-first'],commit=True);eq(v['actorId'],U);eq(v['action'],'request_to_proceed');eq(v['bindingAgreementRecorded'],False);eq(v['bookingConfirmed'],False);eq(v['ownOperationReceipt'],True)
 stage('request-to-proceed-exact-actor-version-nonbinding-no-execution',proceed)
 stage('owner-reopens-exact-nonbinding-decision-foreign-reader-denied',lambda:(eq(rpc('quote_access_decisions',scope()+[0,20])['items'][0]['action'],'request_to_proceed'),denied('SELECT public.busy_work_quote_access_decisions_v1('+','.join(map(mql,scope()))+');',uid=S)))
 def invalidate(sql,code='40001'):
  r=call('BEGIN;'+sql+'SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='+mql(U)+';SELECT public.busy_fixture_policy_session('+','.join(map(mql,[state['policyReceipt']['presentationId'],state['policySession']['sessionId']]))+');ROLLBACK;');assert r.returncode!=0 and code in r.stderr,r.stdout+r.stderr
 stage('session-private-preparation-withdrawal-denied',lambda:invalidate("INSERT INTO public.business_work_quote_access_withdrawals(preparation_id,business_id,created_by,operation_id) VALUES("+','.join(map(mql,[state['grantPrep']['preparationId'],B,O,'policy-withdraw-fixture']))+');'))
 stage('session-app-version-and-source-privacy-rechecked',lambda:(invalidate("UPDATE public.busy_mini_apps SET current_live_version_id=NULL WHERE id="+mql(APP)+';'),invalidate("UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{customers,0,contactOk}','false') WHERE business_id="+mql(B)+';','22023')))
 stage('session-quote-validity-expiry-denied',lambda:invalidate("ALTER TABLE public.business_work_quote_presentations DISABLE TRIGGER immutable_presentation;UPDATE public.business_work_quote_presentations SET valid_until=clock_timestamp() WHERE id="+mql(state['policyReceipt']['presentationId'])+';'))
 def private_expiry():
  sql="BEGIN;ALTER TABLE public.business_work_quote_grant_candidates DISABLE TRIGGER immutable_quote_candidate;ALTER TABLE public.business_work_quote_access_preparations DISABLE TRIGGER immutable_preparation;UPDATE public.business_work_quote_grant_candidates SET recorded_at=clock_timestamp()-interval '3 hours',expires_at=clock_timestamp()-interval '2 hours' WHERE id="+mql(state['grantSecondReceipt']['grantId'])+";UPDATE public.business_work_quote_access_preparations SET recorded_at=clock_timestamp()-interval '3 hours',expires_at=clock_timestamp()-interval '2 hours' WHERE id="+mql(state['grantPrep']['preparationId'])+';SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='+mql(U)+';SELECT public.busy_fixture_policy_session('+','.join(map(mql,[state['policyReceipt']['presentationId'],state['policySession']['sessionId']]))+');ROLLBACK;'
  r=call(sql);assert r.returncode==0,r.stderr
 stage('old-private-minute-expiry-does-not-replace-approved-customer-duration',private_expiry)
 stage('session-grant-expiry-always-rechecked',lambda:invalidate("UPDATE busy_work_private.quote_access_validation SET expires_at=clock_timestamp() WHERE presentation_id="+mql(state['policyReceipt']['presentationId'])+';'))
 stage('session-changed-quote-revision-denied',lambda:invalidate("UPDATE public.business_work_engagements SET revision=revision+1 WHERE id="+mql(state['first'])+';'))
 stage('session-owner-revocation-denied',lambda:invalidate("DELETE FROM public.busy_business_memberships WHERE business_id="+mql(B)+' AND user_id='+mql(O)+';','42501'))
 def private_denials():
  for t in ['public.business_work_quote_presentations','public.business_work_quote_presentation_revocations','busy_work_private.quote_access_validation','busy_work_private.quote_viewing_validation_sessions','busy_work_private.quote_decision_validation']:denied('SELECT * FROM '+t+';');denied('SELECT * FROM '+t+';',role='service_role')
  denied('SELECT busy_work_private.quote_session_validation('+mql(state['policyReceipt']['presentationId'])+',NULL);',uid=U)
 stage('policy-raw-tables-and-private-helpers-denied-to-all-app-roles',private_denials)
 def race():
  pid=state['policyReceipt']['presentationId'];sid=state['policySession']['sessionId'];ra=scope()+[pid,1,state['policyReceipt']['projectionHash'],'policy-revoke-first']
  def revoke():return call(auth('SELECT public.busy_work_quote_access_revoke_v1('+','.join(map(mql,ra))+');SELECT pg_sleep(0.1);',commit=True))
  def respond():return call(auth('SELECT public.busy_fixture_policy_decision('+','.join(map(mql,[pid,sid,'question','Racing exact question',1,'policy-racing-question']))+');',uid=U,commit=True))
  with ThreadPoolExecutor(max_workers=2) as pool:a=pool.submit(revoke);b=pool.submit(respond);rs=[a.result(),b.result()]
  eq(rs[0].returncode,0);assert rs[1].returncode==0 or '40001' in rs[1].stderr
  eq(read()['state'],'revoked');eq(read()['projection'],None);no('session',[pid,sid]);no('decision',[pid,sid,'request_to_proceed','',1,'policy-after-revoke']);eq(run('SELECT count(*) FROM public.busy_mini_app_work_bookings;').strip(),'0')
 stage('real-revocation-response-race-serialises-and-all-later-operations-deny',race)
 def preserve():
  eq(run('SELECT row_to_json(x) FROM public.business_work_engagements x ORDER BY id;SELECT row_to_json(x) FROM public.business_work_private_drafts x ORDER BY engagement_id,owner_id,kind;SELECT payload FROM public.busy_business_snapshots;SELECT row_to_json(x) FROM public.busy_mini_app_requests x ORDER BY id;SELECT row_to_json(x) FROM public.busy_mini_app_request_links x ORDER BY id;'),state['policyBefore'])
 stage('policy-preserves-all-engagements-legacy-private-purpose-and-original-request-data',preserve)
 def rollback():
  run((root/'docs/sql-proposals/canonical-work/quote-access-policy-rollback.sql').read_text());eq(read()['state'],'revoked');denied('SELECT public.busy_work_quote_access_review_v1('+','.join(map(mql,args()))+');');denied('SELECT public.busy_work_consumer_quote_access_v1('+mql(state['policyReceipt']['presentationId'])+');',uid=U);preserve();run('DROP FUNCTION public.busy_fixture_policy_session(uuid,uuid);DROP FUNCTION public.busy_fixture_policy_decision(uuid,uuid,text,text,bigint,text);')
 stage('v2253-retaining-rollback-and-closed-public-consumer-boundaries',rollback)
