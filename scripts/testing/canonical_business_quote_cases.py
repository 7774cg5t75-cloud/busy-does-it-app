"""Original canonical/Business App quotation validation stages, local-only transport."""
import json

def register(ctx):
 stage,rpc,run,call,denied,auth,mql,state,root,eq=map(ctx.__getitem__,['stage','rpc','run','call','denied','auth','mql','state','root','eq'])
 B,C,O,M,D,S,APP,REQ,U=map(ctx.__getitem__,['B','C','O','M','D','S','APP','REQ','U'])
 def scope():return [B,C,state['first'],state['bindingFirstRef']]
 def scope_grant():return scope()+[state['appGrant']['grantId']]
 def vals():return [state['appPresentation']['presentationId'],APP,REQ,state.get('appView',{}).get('sessionId')]
 def fixture(op,args,uid=U,commit=False):
  r=call(auth('SELECT public.busy_fixture_app_quote_'+op+'('+','.join(map(mql,args))+');',uid=uid,commit=commit));assert r.returncode==0,r.stderr;return json.loads(next(x for x in r.stdout.splitlines() if x.startswith('{')))
 def no(op,args,uid=U,code='42501'):
  r=call(auth('SELECT public.busy_fixture_app_quote_'+op+'('+','.join(map(mql,args))+');',uid=uid));assert r.returncode!=0 and code in r.stderr,r.stdout+r.stderr
 def upgrade():
  text=(root/'docs/sql-proposals/canonical-work/quote-business-app.sql').read_text();fuse="DO $$ BEGIN RAISE EXCEPTION 'BUSINESS APP QUOTE REVIEW FUSE: separate hosted approval required';END $$;";assert text.count(fuse)==1
  r=call(text);assert r.returncode!=0 and 'BUSINESS APP QUOTE REVIEW FUSE' in r.stderr
  r=call(text.replace(fuse,'').replace('COMMIT;','SELECT 1/0;COMMIT;'));assert r.returncode!=0 and 'division by zero' in r.stderr
  run(text.replace(fuse,''))
  run("CREATE FUNCTION public.busy_fixture_app_quote_read(uuid,uuid,uuid,uuid) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS 'SELECT busy_work_private.quote_request_validation($1,$2,$3,$4)';REVOKE ALL ON FUNCTION public.busy_fixture_app_quote_read(uuid,uuid,uuid,uuid) FROM PUBLIC,anon,service_role;GRANT EXECUTE ON FUNCTION public.busy_fixture_app_quote_read(uuid,uuid,uuid,uuid) TO authenticated;")
  run("CREATE FUNCTION public.busy_fixture_app_quote_decision(uuid,uuid,uuid,uuid,text,text,bigint,text) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS 'SELECT busy_work_private.quote_request_decision_validation($1,$2,$3,$4,$5,$6,$7,$8)';REVOKE ALL ON FUNCTION public.busy_fixture_app_quote_decision(uuid,uuid,uuid,uuid,text,text,bigint,text) FROM PUBLIC,anon,service_role;GRANT EXECUTE ON FUNCTION public.busy_fixture_app_quote_decision(uuid,uuid,uuid,uuid,text,text,bigint,text) TO authenticated;")
  run("DO $r$ DECLARE f record;BEGIN FOR f IN SELECT oid::regprocedure sig FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN ('busy_work_quote_grant_create_v1','busy_work_quote_grant_revoke_v1','busy_work_quote_access_prepare_v1','busy_work_quote_access_revoke_v1') LOOP EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.sig);END LOOP;END $r$;")
  old=state['grantSecondReceipt']['grantId'];v=rpc('quote_grant_revoke_review',scope()+[old,1]);rpc('quote_grant_revoke',scope()+[old,1,v['reviewHash'],'app-fixture-grant-revoke'],commit=True)
  v=rpc('quote_grant_review',scope()+[state['grantPrep']['preparationId'],5,None]);state['appGrant']=rpc('quote_grant_create',scope()+[v['preparationId'],5,v['generation'],v['reviewHash'],'app-fixture-grant-create'],commit=True)
  args=scope_grant()+[14,'Europe/London',state['policyDeadline'],json.dumps({'quoteIdentifier':'App-local-quotation'})];v=rpc('quote_access_review',args);state['appPresentation']=rpc('quote_access_prepare',args+[v['reviewHash'],'app-fixture-presentation'],commit=True)
  run(auth('SELECT busy_work_private.quote_activation_validation('+mql(state['appPresentation']['presentationId'])+');',role='postgres',commit=True))
  state['appOriginalBefore']=run('SELECT row_to_json(x) FROM public.business_work_engagements x ORDER BY id;SELECT row_to_json(x) FROM public.business_work_private_drafts x ORDER BY engagement_id,owner_id,kind;SELECT payload FROM public.busy_business_snapshots;SELECT row_to_json(x) FROM public.busy_mini_app_requests x ORDER BY id;SELECT row_to_json(x) FROM public.busy_mini_app_request_links x ORDER BY id;')
 stage('business-quote-fused-additive-upgrade-original-finite-fixture',upgrade)
 def read():
  v=fixture('read',vals(),commit=True);state['appView']=v;eq(v['actorId'],U);eq(v['appId'],APP);eq(v['requestId'],REQ);eq(v['quoteVersion'],state['appGrant']['quoteRevision']);eq(v['requiresHostedSessionProof'],True);eq(v['consumerAccessAuthorised'],False);assert 'termsHash' not in v['projection'];eq(v['responseRevision'],0)
 stage('business-app-exact-authenticated-account-request-presentation-inspection',read)
 for uid,label in [(O,'owner'),(M,'member'),(S,'coowner'),(D,'foreign'),('','anonymous')]:stage('business-quote-'+label+'-cannot-consume-recipient-quote',lambda uid=uid:no('read',vals(),uid=uid))
 stage('business-quote-wrong-app-request-and-presentation-denied',lambda:(no('read',[vals()[0],D,REQ,vals()[3]]),no('read',[vals()[0],APP,'77777777-7777-4777-8777-777777777777',vals()[3]]),no('read',[D,APP,REQ,None])))
 stage('business-quote-decision-without-view-session-denied',lambda:no('decision',[vals()[0],APP,REQ,None,'request_to_proceed','',0,'app-no-session'],code='40001'))
 for index,action in enumerate(['request_to_proceed','question','decline']):
  def respond(index=index,action=action):
   words='  Exact app customer question\nkept  ' if action=='question' else '';v=fixture('decision',vals()+[action,words,index,'app-action-'+action],commit=True);eq(v['action'],action);eq(v['question'],words);eq(v['actorId'],U);eq(v['requestId'],REQ);eq(v['appId'],APP);eq(v['quoteVersion'],state['appView']['quoteVersion']);eq(v['ownOperationReceipt'],True);eq(v['bindingAgreementRecorded'],False);eq(v['bookingConfirmed'],False);eq(fixture('read',vals())['responseRevision'],index+1)
  stage('business-quote-exact-'+action+'-provenance-and-target-receipt',respond)
 stage('business-quote-duplicate-and-stale-decision-denied',lambda:no('decision',vals()+['decline','',0,'app-stale-decline'],code='40001'))
 stage('business-quote-binding-accept-remains-denied',lambda:no('decision',vals()+['accept_and_agree_to_pay','',3,'app-binding-denied']))
 def current():
  v=rpc('quote_access_decisions',scope_grant()+[0,20]);eq(v['sourceCurrent'],True);eq(v['evidenceStatus'],'local_validation_current');eq(v['consumerId'],U);eq(v['requestId'],REQ);eq(v['quoteVersion'],state['appView']['quoteVersion']);eq([x['action'] for x in v['items']],['request_to_proceed','question','decline'])
 stage('owner-work-inspects-exact-original-response-context-and-current-source',current)
 def invalid(sql,code='40001'):
  r=call('BEGIN;'+sql+'SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='+mql(U)+';SELECT public.busy_fixture_app_quote_read('+','.join(map(mql,vals()))+');ROLLBACK;');assert r.returncode!=0 and code in r.stderr,r.stdout+r.stderr
 stage('business-quote-idle-expiry-denied-no-client-clock',lambda:invalid('UPDATE busy_work_private.quote_viewing_validation_sessions SET last_activity_at=clock_timestamp()-interval \'15 minutes\' WHERE id='+mql(vals()[3])+';'))
 stage('business-quote-revised-terms-and-app-version-denied',lambda:(invalid('UPDATE public.business_work_engagements SET revision=revision+1 WHERE id='+mql(state['first'])+';'),invalid('UPDATE public.busy_mini_apps SET current_live_version_id=NULL WHERE id='+mql(APP)+';')))
 stage('business-quote-revoked-owner-and-privacy-denied',lambda:(invalid('DELETE FROM public.busy_business_memberships WHERE user_id='+mql(O)+' AND business_id='+mql(B)+';','42501'),invalid("UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{customers,0,contactOk}','false') WHERE business_id="+mql(B)+';','22023')))
 def revoke():
  p=state['appPresentation'];rpc('quote_access_revoke',scope_grant()+[p['presentationId'],1,p['projectionHash'],'app-presentation-revoke'],commit=True);no('read',vals(),code='40001');no('decision',vals()+['question','Late question',3,'app-late-question'],code='40001');v=rpc('quote_access_decisions',scope_grant()+[0,20]);eq(v['evidenceStatus'],'local_validation_stale');eq(len(v['items']),3)
 stage('business-quote-revocation-denies-later-read-response-owner-keeps-labelled-history',revoke)
 def rollback():
  run((root/'docs/sql-proposals/canonical-work/quote-access-policy-rollback.sql').read_text());no('read',vals(),code='40001');denied('SELECT busy_work_private.quote_request_validation('+','.join(map(mql,vals()))+');',uid=U);denied('SELECT public.busy_work_consumer_quote_access_v1('+mql(vals()[0])+');',uid=U)
  eq(run('SELECT row_to_json(x) FROM public.business_work_engagements x ORDER BY id;SELECT row_to_json(x) FROM public.business_work_private_drafts x ORDER BY engagement_id,owner_id,kind;SELECT payload FROM public.busy_business_snapshots;SELECT row_to_json(x) FROM public.busy_mini_app_requests x ORDER BY id;SELECT row_to_json(x) FROM public.busy_mini_app_request_links x ORDER BY id;'),state['appOriginalBefore']);eq(run('SELECT count(*) FROM public.busy_mini_app_work_bookings;').strip(),'0');run('DROP FUNCTION public.busy_fixture_app_quote_read(uuid,uuid,uuid,uuid);DROP FUNCTION public.busy_fixture_app_quote_decision(uuid,uuid,uuid,uuid,text,text,bigint,text);')
 stage('business-quote-retaining-rollback-no-original-work-request-booking-mutation',rollback)
