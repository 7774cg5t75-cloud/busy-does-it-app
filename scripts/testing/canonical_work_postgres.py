#!/usr/bin/env python3
"""Canonical Work extension of the verified Phase59–66 fixture. Unix socket only."""
import argparse,json,pathlib,subprocess,sys,time,select,os,hashlib
p=argparse.ArgumentParser()
for n in ['bin-dir','socket','baseline-report','output']:p.add_argument('--'+n,required=True)
a=p.parse_args();root=pathlib.Path(__file__).resolve().parents[2];out=pathlib.Path(a.output);prior=json.loads(pathlib.Path(a.baseline_report).read_text());assert prior['summary']=={'passed':262,'failed':0,'blocked':0,'unexecuted':0}
assert pathlib.Path(a.socket).is_absolute() and a.socket.startswith(('/workspace/','/tmp/'))
base=[str(pathlib.Path(a.bin_dir)/'psql'),'-X','-h',a.socket,'-U','postgres','-d','busy_phase58_disposable','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','-At']
cases=[];results=[];state={};logs=[]
def call(sql):
 r=subprocess.run(base,input="\\set VERBOSITY verbose\n"+sql,text=True,capture_output=True,timeout=15);logs.append({'exitCode':r.returncode,'output':r.stdout+r.stderr});return r
assert str((pathlib.Path(a.socket).parent/'data').resolve()) in call('SHOW data_directory;').stdout
assert call('SHOW listen_addresses;').stdout.strip()==''
def q(v):return "'"+str(v).replace("'","''")+"'"
def lit(v):return q(json.dumps(v))+'::jsonb'
B='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';O='cccccccc-cccc-4ccc-8ccc-cccccccccccc';M='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';D='dddddddd-dddd-4ddd-8ddd-dddddddddddd';S='11111111-1111-4111-8111-111111111111';C='repeat'
def auth(sql,uid=O,commit=False,role='authenticated'):return f"BEGIN;SET LOCAL ROLE {role};SET LOCAL request.jwt.claim.sub={q(uid)};"+sql+('COMMIT;' if commit else 'ROLLBACK;')
def run(sql):
 r=call(sql);assert r.returncode==0,r.stderr;return r.stdout

def rpc(name,args,uid=O,commit=False,role='authenticated'):
 text=run(auth('SELECT public.busy_work_'+name+'_v1('+','.join('NULL' if v is None else q(v) for v in args)+');',uid,commit,role));return json.loads(next(x for x in text.splitlines() if x.startswith('{')))
def denied(sql,code='42501',uid=O,role='authenticated'):
 r=call(auth(sql,uid,role=role));assert r.returncode!=0 and code in r.stderr,r.stdout+r.stderr

def stage(name,fn):cases.append((name,fn))
def review(e):return rpc('source_review',[B,C,e,100])
def create(e,op):
 x=review(e);return rpc('create_quote',[B,C,e,100,x['customerHash'],x['sourceHash'],'230.50','  Exact second owner words\nNew line  ','2026-11-02',op],commit=True)
def row(id):return json.loads(run('SELECT row_to_json(e) FROM public.business_work_engagements e WHERE id='+q(id)+';').splitlines()[0])
def eq(actual,expected):assert actual==expected,(actual,expected)
def migrate():
 x=review('first');x['legacyHash']=run("SELECT busy_work_private.hash(payload->'replyActions'->"+q(C)+") FROM public.busy_business_snapshots WHERE business_id="+q(B)+";").strip();state['originalReview']=x;v=rpc('migrate_legacy',[B,C,'first',100,x['legacyHash'],x['sourceHash'],'migration-first'],commit=True,role='postgres');state['first']=v['engagementId'];eq(v['revision'],1);eq(row(state['first'])['work_data'],state['legacy']);eq(run('SELECT payload::text FROM public.busy_business_snapshots WHERE business_id='+q(B)+';').strip(),state['originalPayload'])
def second():
 v=create('second','create-second');state['second']=v['engagementId'];assert state['first']!=state['second'];eq(v['previousRevision'],0);state['secondReceipt']=v

def read(id,uid=O):return rpc('read',[B,C,id],uid)
def edit(id,rev,op,words='Exact edited words',amount='0'):
 x=read(id);return rpc('edit_quote',[B,C,id,rev,x['sourceHash'],amount,words,'2026-11-03',op],commit=True)
def setup():
 old={'type':'quote','task':'Prepare a private quote','origin':'manual','done':True,'createdAt':'2026-10-20T10:00:00.000Z','details':{'quoteStatus':'Prepared','quoteAmount':'0','message':'  Exact old owner wording\nOld line  ','plannedSentDate':'2026-11-01','followUpMessage':'Legacy PRIVATE words','futureDetail':{'secret':True},'enquiryReference':{'version':1,'businessId':B,'customerId':C,'inboxId':'first','reviewedAt':'2026-10-24T10:00:00.000Z','queuedAt':None,'snapshotRevision':100}},'futureWork':{'keep':[False,0,None]}}
 items=[{'id':e,'status':'Filed','filedCustomerId':C,'filedStage':'Enquiry','registeredBy':O,'reviewedAt':'2026-10-24T10:00:00.000Z','rawText':'Customer-supplied requirements (not confirmed):\nWhat would you like to know?: Cleaning\nQuantity or group size (optional): 2 rooms','privateUnknown':{'secretSynthetic':True}} for e in ['first','second']+['page-'+str(i) for i in range(25)]+['operation-new']]
 payload={'customers':[{'id':C,'name':'Fictional Alex','service':'Cleaning','contactOk':True,'privateEnquiryReply':{'ownerId':O,'text':'Legacy private reply kept'},'history':[{'kind':'job','note':'Summary only'}],'unknownCustomer':'secretSynthetic'}],'inboxItems':items,'replyActions':{C:old},'unknownRoot':{'keep':True},'quoteOther':{'amount':'99','date':'2026-12-03'}}
 run(f"UPDATE public.busy_business_snapshots SET payload={lit(payload)},revision=100 WHERE business_id={q(B)};INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES({q(B)},{q(S)},'owner') ON CONFLICT DO NOTHING;")
 state['legacy']=old;state['originalPayload']=run('SELECT payload::text FROM public.busy_business_snapshots WHERE business_id='+q(B)+';').strip()

def original_request_dependencies():
 run("CREATE TABLE IF NOT EXISTS auth.users(id uuid PRIMARY KEY);INSERT INTO auth.users(id) VALUES('"+O+"'),('"+D+"'),('"+M+"'),('"+S+"'),('99999999-9999-4999-8999-999999999999') ON CONFLICT DO NOTHING;"+'\n'.join((root/f).read_text() for f in ['supabase/migrations/20261007082234_v3_39_busy_apps_marketplace_foundation.sql','supabase/migrations/20261007101513_v3_40_mini_app_customer_journey_bridge.sql','supabase/migrations/20261007133000_v3_42_mini_app_notifications.sql','supabase/migrations/20261012183000_v3_180_atomic_business_app_handoff.sql','supabase/migrations/20261012193000_v3_181_durable_work_booking_ledger.sql']))
stage('original-request-schema-and-atomic-link-dependencies',original_request_dependencies)

def load():
 text=(root/'docs/sql-proposals/canonical-work/engagements.sql').read_text();fuse="DO $$ BEGIN RAISE EXCEPTION 'CANONICAL WORK REVIEW FUSE: separate hosted approval required'; END $$;";assert text.count(fuse)==1
 r=call(text);assert r.returncode!=0 and 'CANONICAL WORK REVIEW FUSE' in r.stderr
 eq(run("SELECT to_regclass('public.business_work_engagements') IS NULL;").strip(),'t');run("CREATE FUNCTION public.busy_work_unreviewed_fixture() RETURNS integer LANGUAGE sql AS 'SELECT 1'; REVOKE ALL ON FUNCTION public.busy_work_unreviewed_fixture() FROM PUBLIC;");collision=call(text.replace(fuse,''));assert collision.returncode!=0 and 'Canonical RPC namespace already in use' in collision.stderr;run('DROP FUNCTION public.busy_work_unreviewed_fixture();')
 run('CREATE ROLE busy_canonical_test_exec NOLOGIN;GRANT busy_canonical_test_exec TO authenticated;ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO busy_canonical_test_exec;')
 try:
  inherited=call(text.replace(fuse,''));assert inherited.returncode!=0 and 'Unexpected inherited RPC execution' in inherited.stderr
 finally:run('ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM busy_canonical_test_exec;REVOKE busy_canonical_test_exec FROM authenticated;DROP ROLE busy_canonical_test_exec;')
 run(text.replace(fuse,''))

stage('fused-candidate-and-disposable-load',load);stage('synthetic-original-customer-work-sources',setup)
stage('narrow-source-review-no-unknown-disclosure',lambda: (eq(set(review('second')['enquiry']),{'id','rawText','reviewedAt'}),eq('secretSynthetic' in json.dumps(review('second')),False)))
stage('migrate-complete-first-work-original-snapshot-unchanged',migrate);stage('commit-second-independent-engagement',second)
stage('independent-readback-private-extensions-excluded',lambda:(eq(read(state['first'])['record']['details']['message'],state['legacy']['details']['message']),eq('secret' in json.dumps(read(state['first'])),False),eq(read(state['second'])['record']['details']['quoteAmount'],'230.50')))
for uid,label in [(M,'member'),(D,'foreign'),(S,'other-owner')]:
 stage(label+'-one-record-denied',lambda uid=uid:denied('SELECT public.busy_work_read_v1('+','.join(map(q,[B,C,state['first']]))+');',uid=uid))
stage('anonymous-rpc-denied',lambda:denied(f"SELECT public.busy_work_list_v1('{B}','{C}');",role='anon',uid=''))
stage('empty-auth-denied',lambda:denied(f"SELECT public.busy_work_list_v1('{B}','{C}');",uid=''))
stage('coowner-list-empty-not-authority',lambda:eq(rpc('list',[B,C],S)['items'],[]))
stage('admin-denied-live-role',lambda:run(f"BEGIN;UPDATE public.busy_business_memberships SET role='admin' WHERE business_id='{B}' AND user_id='{O}';SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{O}';DO $t$ BEGIN BEGIN PERFORM public.busy_work_list_v1('{B}','{C}');RAISE EXCEPTION 'Expected owner denial';EXCEPTION WHEN insufficient_privilege THEN NULL;END;END $t$;ROLLBACK;"))
for table in ['business_work_engagements','business_work_private_drafts','busy_business_snapshots']:
 for role in ['authenticated','service_role']:
  stage(role+'-raw-'+table+'-denied',lambda table=table,role=role:denied('SELECT * FROM public.'+table+';',role=role))
stage('private-helper-denied',lambda:denied(f"SELECT busy_work_private.authorize('{B}');"))
stage('duplicate-create-source-denied',lambda:denied("SELECT public.busy_work_create_quote_v1("+','.join(map(q,[B,C,'second',100,review('second')['customerHash'],review('second')['sourceHash'],'1','Duplicate','2026-11-02','duplicate-second']))+');','23505'))
stage('duplicate-migration-denied',lambda:denied("SELECT public.busy_work_migrate_legacy_v1("+','.join(map(q,[B,C,'first',100,state['originalReview']['legacyHash'],state['originalReview']['sourceHash'],'migration-repeat']))+');','23505',role='postgres'))
stage('source-less-migration-denied-with-original-retained',lambda:run(f"BEGIN;UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{replyActions,source-less}}','{{\"type\":\"quote\",\"origin\":\"manual\"}}') WHERE business_id='{B}';SET LOCAL ROLE postgres;SET LOCAL request.jwt.claim.sub='{O}';DO $t$ BEGIN BEGIN PERFORM public.busy_work_migrate_legacy_v1('{B}','missing','first',100,'no','no','no-source-operation');RAISE EXCEPTION 'Expected source denial';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;END $t$;ROLLBACK;"))
stage('immutable-engagement-id-even-privileged-update-denied',lambda: (lambda r: (_ for _ in ()).throw(AssertionError(r.stderr)) if r.returncode==0 or '42501' not in r.stderr else None)(call('BEGIN;UPDATE public.business_work_engagements SET id=gen_random_uuid() WHERE id='+q(state['first'])+';ROLLBACK;')))
def independent_edits():
 before=row(state['first']);v=edit(state['second'],1,'edit-second');eq(v['revision'],2);eq(row(state['first']),before)
 before=row(state['second']);v=edit(state['first'],1,'edit-first','  Exact revised first words\nkept  ');eq(v['revision'],2);eq(row(state['second']),before);eq(row(state['first'])['work_data']['futureWork'],state['legacy']['futureWork']);eq(row(state['first'])['work_data']['details']['futureDetail'],{'secret':True});eq(run('SELECT payload::text FROM public.busy_business_snapshots WHERE business_id='+q(B)+';').strip(),state['originalPayload'])
stage('independent-edits-preserve-other-row-unknowns-and-legacy',independent_edits)
stage('stale-repeated-edit-denied',lambda:denied('SELECT public.busy_work_edit_quote_v1('+','.join(map(q,[B,C,state['second'],1,read(state['second'])['sourceHash'],'2','Stale','2026-11-02','stale-edit-second']))+');','40001'))
stage('wrong-customer-engagement-denied',lambda:denied(f"SELECT public.busy_work_read_v1('{B}','other','{state['first']}');"))
stage('foreign-business-same-id-denied',lambda:denied(f"SELECT public.busy_work_read_v1('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','{C}','{state['first']}');"))
stage('legacy-work-cannot-change-after-migration-even-privileged',lambda:(lambda r:eq(r.returncode!=0 and '42501' in r.stderr,True))(call(f"BEGIN;UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{replyActions,{C},details,message}}','\"Old client changed\"') WHERE business_id='{B}';ROLLBACK;")))
for verb in [f"UPDATE public.busy_business_snapshots SET payload='{{}}' WHERE business_id='{B}'",f"INSERT INTO public.busy_business_snapshots(business_id,payload) VALUES('{B}','{{}}')",f"INSERT INTO public.busy_business_snapshots(business_id,payload) VALUES('{B}','{{}}') ON CONFLICT(business_id) DO UPDATE SET payload=EXCLUDED.payload"]:stage('legacy-destructive-'+('upsert' if 'ON CONFLICT' in verb else verb.split()[0].lower())+'-denied',lambda verb=verb:denied(verb+';'))
def draft():
 id=state['second'];x=read(id);v=rpc('private_write',[B,C,id,x['revision'],0,x['sourceHash'],'reply','  Exact private words\nprivate line  ','private-create-one'],commit=True);eq(v['revision'],1);eq(rpc('private_read',[B,C,id,'reply'])['text'],'  Exact private words\nprivate line  ');eq('private words' in json.dumps(read(id)),False)
stage('engagement-private-wording-create-and-exact-read',draft)
stage('coowner-private-denied',lambda:denied(f"SELECT public.busy_work_private_read_v1('{B}','{C}','{state['second']}','reply');",uid=S))
stage('member-private-denied',lambda:denied(f"SELECT public.busy_work_private_read_v1('{B}','{C}','{state['second']}','reply');",uid=M))
stage('private-stale-create-denied',lambda:denied('SELECT public.busy_work_private_write_v1('+','.join(map(q,[B,C,state['second'],2,0,read(state['second'])['sourceHash'],'reply','Wrong duplicate','private-duplicate']))+');','40001'))
def draft_stale():
 edit(state['second'],2,'edit-after-private');v=rpc('private_read',[B,C,state['second'],'reply']);eq(v['needsReview'],True);eq(v['text'],'  Exact private words\nprivate line  ')
stage('changed-engagement-retains-private-words-requires-review',draft_stale)
def page():
 for i in range(25):create('page-'+str(i),'page-create-'+str(i))
 seen=[];cursor=None
 while True:
  v=rpc('list',[B,C,cursor,7]);assert len(v['items'])<=7;seen.extend(x['engagementId'] for x in v['items']);cursor=v['nextCursor']
  if not cursor:break
 eq(len(seen),27);eq(len(set(seen)),27);state['pageCount']=len(seen)
stage('keyset-pagination-27-records-no-lifetime-20-limit',page)
def hold(sql):
 h=subprocess.Popen(base+['-q'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,bufsize=1);h.stdin.write('BEGIN;'+sql+';\n\\echo READY\n');h.stdin.flush();deadline=time.monotonic()+5;seen=b''
 while time.monotonic()<deadline:
  if select.select([h.stdout],[],[],.2)[0]:
   chunk=os.read(h.stdout.fileno(),8192);seen+=chunk
   if b'READY' in seen.splitlines():return h
   if not chunk:break
 h.terminate();h.wait(timeout=5);logs.append({'holderExitCode':h.returncode,'output':seen.decode()+h.stderr.read()});raise RuntimeError('Holder failed before lock checkpoint')
def release(h):h.stdin.write('COMMIT;\n\\q\n');h.stdin.flush();h.stdin.close();h.wait(timeout=8);assert h.returncode==0,h.stderr.read()
def revocation():
 h=hold(f"DELETE FROM public.busy_business_memberships WHERE business_id='{B}' AND user_id='{O}'")
 contender=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True);contender.stdin.write("SET statement_timeout='5s';"+auth(f"SELECT public.busy_work_read_v1('{B}','{C}','{state['second']}');"));contender.stdin.close();time.sleep(.2);assert contender.poll() is None;release(h);contender.wait(timeout=8);output=contender.stdout.read()+contender.stderr.read();logs.append({'holderExitCode':h.returncode,'exitCode':contender.returncode,'output':output});assert contender.returncode!=0 and '42501' in output;run(f"INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES('{B}','{O}','owner');")
stage('real-concurrent-revocation-wins',revocation)
def separate_writers():
 x=read(state['second']);sql='SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='+q(O)+';SELECT public.busy_work_edit_quote_v1('+','.join(map(q,[B,C,state['second'],3,x['sourceHash'],'17','Writer A','2026-11-04','parallel-second']))+')'
 h=hold(sql);before=time.monotonic();v=edit(state['first'],2,'parallel-first','Writer B');elapsed=time.monotonic()-before;release(h);eq(v['revision'],3);assert elapsed<4;eq(read(state['second'])['revision'],4)
stage('two-engagement-writers-independent-locks',separate_writers)
def competing_revision():
 id=state['second'];x=read(id);args=[B,C,id,4,x['sourceHash'],'17','First contender','2026-11-04','same-row-first'];h=hold('SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='+q(O)+';SELECT public.busy_work_edit_quote_v1('+','.join(map(q,args))+')');args[-1]='same-row-second';contender=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True);contender.stdin.write("SET statement_timeout='5s';"+auth('SELECT public.busy_work_edit_quote_v1('+','.join(map(q,args))+');',commit=True));contender.stdin.close();time.sleep(.2);assert contender.poll() is None;release(h);contender.wait(timeout=8);output=contender.stdout.read()+contender.stderr.read();logs.append({'exitCode':contender.returncode,'holderExitCode':h.returncode,'output':output});assert contender.returncode!=0 and '40001' in output
stage('same-engagement-competing-cas-one-wins',competing_revision)
def source_conflict():
 id=state['second'];x=read(id);sql=f"BEGIN;UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{inboxItems,1,rawText}}','\"Corrected source\"') WHERE business_id='{B}';SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{O}';SELECT public.busy_work_edit_quote_v1("+','.join(map(q,[B,C,id,5,x['sourceHash'],'1','Stale source','2026-11-04','source-conflict']))+');ROLLBACK;';r=call(sql);assert r.returncode!=0 and '40001' in r.stderr
stage('changed-source-denies-current-record-write',source_conflict)
def lost_ack():
 # Discard exact write response, then use a fresh read as observation only.
 x=read(state['first']);rpc('edit_quote',[B,C,state['first'],3,x['sourceHash'],'0','Committed without retained ack','2026-11-04','lost-ack-first'],commit=True);v=read(state['first']);eq(v['notOwnReceipt'],True);eq(v['revision'],4);assert 'operationId' not in v
stage('lost-ack-read-is-observation-not-own-receipt',lost_ack)
def rollback():
 before=run('SELECT count(*) FROM public.business_work_engagements;').strip();run((root/'docs/sql-proposals/canonical-work/rollback-readonly.sql').read_text());eq(run('SELECT count(*) FROM public.business_work_engagements;').strip(),before);read(state['first']);denied('SELECT public.busy_work_edit_quote_v1('+','.join(map(q,[B,C,state['first'],4,read(state['first'])['sourceHash'],'0','Forbidden','2026-11-04','after-rollback']))+');');denied('UPDATE public.busy_business_snapshots SET payload=\'{}\';')
for table in ['business_work_engagements','business_work_private_drafts']:
 for role in ['authenticated','service_role']:
  stage(role+'-direct-update-'+table+'-denied',lambda table=table,role=role:denied('UPDATE public.'+table+' SET customer_id=customer_id;',role=role))
stage('service-role-rpc-not-granted',lambda:denied(f"SELECT public.busy_work_list_v1('{B}','{C}');",role='service_role'))
stage('legacy-snapshot-delete-retains-canonical-records',lambda:(lambda r:eq(r.returncode!=0 and '42501' in r.stderr,True))(call(f"BEGIN;DELETE FROM public.busy_business_snapshots WHERE business_id='{B}';ROLLBACK;")))
def wrong_hash():
 x=review('operation-new');denied('SELECT public.busy_work_create_quote_v1('+','.join(map(q,[B,C,'operation-new',100,x['customerHash'],'a'*64,'1','Wrong source','2026-11-03','wrong-source-hash']))+');','40001')
stage('caller-source-hash-not-authority',wrong_hash)
for label,patch in [('duplicate-customer',"jsonb_set(payload,'{customers}',(payload->'customers')||(payload->'customers'))"),('duplicate-enquiry',"jsonb_set(payload,'{inboxItems}',(payload->'inboxItems')||jsonb_build_array(payload->'inboxItems'->1))")]:
 def duplicate(patch=patch):
  r=call(f"BEGIN;UPDATE public.busy_business_snapshots SET payload={patch} WHERE business_id='{B}';SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{O}';SELECT public.busy_work_source_review_v1('{B}','{C}','second',100);ROLLBACK;");assert r.returncode!=0 and '22023' in r.stderr
 stage(label+'-canonical-source-denied',duplicate)
def private_extensions():
 id=state['second'];run(f"UPDATE public.business_work_private_drafts SET extensions='{{\"unknownPrivate\":{{\"keep\":true}}}}' WHERE engagement_id='{id}';")
 x=read(id);v=rpc('private_write',[B,C,id,x['revision'],1,x['sourceHash'],'reply','Fresh exact private words','private-edit-reviewed'],commit=True);eq(v['revision'],2);eq(json.loads(run(f"SELECT extensions FROM public.business_work_private_drafts WHERE engagement_id='{id}';").splitlines()[0]),{'unknownPrivate':{'keep':True}});eq('unknownPrivate' in json.dumps(rpc('private_read',[B,C,id,'reply'])),False)
stage('private-edit-preserves-unknown-extensions-without-disclosure',private_extensions)
def duplicate_operation():
 x=review('operation-new');denied('SELECT public.busy_work_create_quote_v1('+','.join(map(q,[B,C,'operation-new',100,x['customerHash'],x['sourceHash'],'1','Duplicate nonce','2026-11-03','create-second']))+');','23505')
stage('creation-operation-collision-denied',duplicate_operation)
def missing_snapshot():
 x=review('operation-new')
 denied('SELECT public.busy_work_create_quote_v1('+','.join('NULL' if v is None else q(v) for v in [B,C,'operation-new',None,x['customerHash'],x['sourceHash'],'1','Missing revision','2026-11-04','missing-snapshot'])+');','22023')
 denied(f"SELECT public.busy_work_source_review_v1('{B}','{C}','second',NULL);",'22023')
 x=state['originalReview'];denied('SELECT public.busy_work_migrate_legacy_v1('+','.join('NULL' if v is None else q(v) for v in [B,C,'first',None,x['legacyHash'],x['sourceHash'],'missing-migration'])+');','22023',role='postgres')
stage('null-snapshot-revision-cannot-bypass-review',missing_snapshot)
stage('malformed-work-json-check-is-not-null-permissive',lambda:(lambda r:eq(r.returncode!=0 and '23514' in r.stderr,True))(call(f"BEGIN;UPDATE public.business_work_engagements SET work_data='{{}}' WHERE id='{state['first']}';ROLLBACK;")))
def numeric_identity():
 r=call(f"BEGIN;UPDATE public.busy_business_snapshots SET payload=jsonb_set(jsonb_set(payload,'{{customers}}',(payload->'customers')||'{{\"id\":123,\"name\":\"Fictional numeric\",\"service\":\"Cleaning\"}}'::jsonb),'{{inboxItems}}',(payload->'inboxItems')||'{{\"id\":\"numeric-source\",\"filedCustomerId\":\"123\",\"status\":\"Filed\",\"reviewedAt\":\"2026-10-24T10:00:00.000Z\",\"rawText\":\"Unsupported numeric identity\"}}'::jsonb) WHERE business_id='{B}';SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{O}';SELECT public.busy_work_source_review_v1('{B}','123','numeric-source',100);ROLLBACK;");assert r.returncode!=0 and '22023' in r.stderr
stage('numeric-identity-cannot-impersonate-original-text-id',numeric_identity)
def same_ids_other_business():
 other='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';payload={'customers':[{'id':C,'name':'Fictional foreign customer','service':'Cleaning','contactOk':True,'businessId':other}],'inboxItems':[{'id':'first','status':'Filed','filedCustomerId':C,'registeredBy':D,'reviewedAt':'2026-10-24T10:00:00.000Z','rawText':'Foreign fictional source'}],'replyActions':{}}
 run(f"BEGIN;SET LOCAL request.jwt.claim.sub='{D}';INSERT INTO public.busy_business_snapshots(business_id) VALUES('{other}') ON CONFLICT DO NOTHING;UPDATE public.busy_business_snapshots SET payload={lit(payload)},revision=100 WHERE business_id='{other}';COMMIT;")
 x=rpc('source_review',[other,C,'first',100],D);v=rpc('create_quote',[other,C,'first',100,x['customerHash'],x['sourceHash'],'999','Foreign fictional words','2026-11-04','foreign-same-source'],D,True);state['foreign']=v['engagementId'];assert v['engagementId']!=state['first'];eq(rpc('read',[other,C,v['engagementId']],D)['record']['details']['message'],'Foreign fictional words');denied(f"SELECT public.busy_work_read_v1('{other}','{C}','{state['first']}');",uid=D);denied(f"SELECT public.busy_work_read_v1('{B}','{C}','{v['engagementId']}');")
stage('two-real-businesses-identical-customer-source-ids-isolated',same_ids_other_business)
def unattributed_wording():
 r=call(f"BEGIN;UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{inboxItems,0}}',(payload->'inboxItems'->0)-'registeredBy') WHERE business_id='{B}';SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{S}';DO $t$ DECLARE v jsonb;BEGIN v:=public.busy_work_source_review_v1('{B}','{C}','first',100);IF v ? 'legacyQuote' OR v ? 'legacyHash' OR v::text LIKE '%Exact old owner wording%' OR v::text LIKE '%Legacy PRIVATE%' THEN RAISE EXCEPTION 'Unattributed private wording disclosed';END IF;END $t$;ROLLBACK;");assert r.returncode==0,r.stderr
 denied('SELECT public.busy_work_migrate_legacy_v1('+','.join(map(q,[B,C,'first',100,state['originalReview']['legacyHash'],state['originalReview']['sourceHash'],'no-owner-adoption']))+');')
stage('unattributed-legacy-private-words-not-granted-by-membership',unattributed_wording)
def historical_sources():
 id=state['second'];original=row(id)
 variants=[('corrected',"jsonb_set(payload,'{inboxItems,1,rawText}','\"Corrected current facts\"')",'changed'),('removed',"jsonb_set(payload,'{inboxItems}',(payload->'inboxItems')-1)",'unsupported'),('duplicate',"jsonb_set(payload,'{inboxItems}',(payload->'inboxItems')||jsonb_build_array(payload->'inboxItems'->1))",'unsupported'),('malformed',"jsonb_set(payload,'{customers}','{}')",'unsupported'),('foreign',"jsonb_set(payload,'{inboxItems,1,businessId}','\"foreign\"')",'restricted')]
 for label,patch,status in variants:
  sql=f"BEGIN;UPDATE public.busy_business_snapshots SET payload={patch} WHERE business_id='{B}';"+auth(f"DO $t$ DECLARE v jsonb;BEGIN v:=public.busy_work_history_v1('{B}','{C}','{id}');IF v->>'sourceState'<>'{status}' OR v->>'historicalOnly'<>'true' OR v->>'mutationAuthorised'<>'false' OR v->>'notOwnReceipt'<>'true' OR v->'record'->'details'->>'message' IS DISTINCT FROM {q(original['work_data']['details']['message'])} OR v::text LIKE '%secretSynthetic%' OR v::text LIKE '%unknownPrivate%' THEN RAISE EXCEPTION 'Bad retained historical projection';END IF;END $t$;")
  # auth adds a nested BEGIN warning only; outer transaction remains read-only fixture rollback.
  r=call(sql);assert r.returncode==0,(label,r.stderr)
  assert row(id)==original
stage('history-retains-corrected-removed-ambiguous-malformed-foreign-sources-readonly',historical_sources)
for uid,label in [(S,'coowner'),(M,'member'),(D,'foreign')]:
 stage(label+'-historical-private-quote-denied',lambda uid=uid:denied(f"SELECT public.busy_work_history_v1('{B}','{C}','{state['second']}');",uid=uid))
def historical_revoked():
 r=call(f"BEGIN;DELETE FROM public.busy_business_memberships WHERE business_id='{B}' AND user_id='{O}';"+auth(f"SELECT public.busy_work_history_v1('{B}','{C}','{state['second']}');"));assert r.returncode!=0 and '42501' in r.stderr
stage('revoked-owner-cannot-use-retained-history',historical_revoked)
def historical_missing_snapshot():
 other='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';id=state['foreign'];r=call(f"BEGIN;DELETE FROM public.busy_business_snapshots WHERE business_id='{other}';"+auth(f"DO $t$ DECLARE v jsonb;BEGIN v:=public.busy_work_history_v1('{other}','{C}','{id}');IF v->>'sourceState'<>'unavailable' OR v->'record'->'details'->>'message'<>'Foreign fictional words' THEN RAISE EXCEPTION 'Missing snapshot history';END IF;END $t$;",uid=D));assert r.returncode==0,r.stderr
stage('missing-snapshot-retains-owned-history-without-repair',historical_missing_snapshot)
stage('historical-observation-does-not-expose-private-draft',lambda:eq('private words' in json.dumps(rpc('history',[B,C,state['second']])),False))
def account_discovery():
 seen=[];cursor=None
 while True:
  v=rpc('discover',[B,cursor,7]);assert v['notOwnReceipt'] and len(v['items'])<=7
  for item in v['items']:eq(set(item),{'engagementId','customerId','enquiryId','type','status','revision'});eq(item['customerId'],C);seen.append(item['engagementId'])
  cursor=v['nextCursor']
  if cursor is None:break
 eq(len(seen),27);eq(len(set(seen)),27)
stage('fresh-owner-wide-account-discovery-paginated-without-local-customer',account_discovery)
for uid,label in [(M,'member'),(D,'foreign')]:
 stage(label+'-account-discovery-denied',lambda uid=uid:denied(f"SELECT public.busy_work_discover_v1('{B}');",uid=uid))
stage('anonymous-account-discovery-denied',lambda:denied(f"SELECT public.busy_work_discover_v1('{B}');",role='anon',uid=''))
stage('coowner-account-discovery-excludes-another-creators-records',lambda:eq(rpc('discover',[B],S)['items'],[]))
def discovery_role(role):
 r=call(f"BEGIN;UPDATE public.busy_business_memberships SET role='{role}' WHERE business_id='{B}' AND user_id='{O}';"+auth(f"SELECT public.busy_work_discover_v1('{B}');"));assert r.returncode!=0 and '42501' in r.stderr
stage('admin-account-discovery-denied',lambda:discovery_role('admin'))
stage('revoked-account-discovery-denied',lambda:discovery_role('member'))
def compare_current():
 v=rpc('compare',[B,C,state['second']]);eq(v['sourceState'],'current');eq(v['originalContext'],v['currentContext']);eq(v['mutationAuthorised'],False);assert 'secretSynthetic' not in json.dumps(v) and 'unknownPrivate' not in json.dumps(v);eq(set(v['originalContext']),{'customerName','service','enquiryText','reviewedAt'})
stage('finite-original-current-context-comparison-no-contact-or-unknowns',compare_current)
def comparison_variant(patch,state_name,expected_code):
 id=state['second'];before=row(id);sql=f"BEGIN;UPDATE public.busy_business_snapshots SET payload={patch} WHERE business_id='{B}';"+auth(f"DO $t$ DECLARE v jsonb;BEGIN v:=public.busy_work_compare_v1('{B}','{C}','{id}');IF v->>'sourceState'<>'{state_name}' OR v->>'mutationAuthorised'<>'false' OR v->'originalContext'->>'enquiryText' LIKE '%NEW CURRENT%' OR v::text LIKE '%FOREIGN PRIVATE%' THEN RAISE EXCEPTION 'Wrong comparison';END IF;IF '{state_name}'='changed' THEN IF v->'currentContext'->>'enquiryText'<>'NEW CURRENT source facts' OR v->>'enquiryEvidenceChanged'<>'true' THEN RAISE EXCEPTION 'Missing correction';END IF;ELSIF v->'currentContext'<>'null' THEN RAISE EXCEPTION 'Unsafe current disclosure';END IF;BEGIN PERFORM public.busy_work_edit_quote_v1('{B}','{C}','{id}',{before['revision']},'{before['source_hash']}','1','No historical authority','2026-11-03','denied-history-rebase');RAISE EXCEPTION 'Mutation should deny';EXCEPTION WHEN SQLSTATE '{expected_code}' THEN NULL;END;END $t$;")
 r=call(sql);assert r.returncode==0,r.stderr;eq(row(id),before)
stage('corrected-source-comparison-does-not-authorise-rebase',lambda:comparison_variant("jsonb_set(payload,'{inboxItems,1,rawText}','\"NEW CURRENT source facts\"')",'changed','40001'))
stage('removed-customer-comparison-does-not-recreate-customer',lambda:comparison_variant("jsonb_set(payload,'{customers}','[]')",'unsupported','22023'))
stage('foreign-owner-source-comparison-suppresses-current-private-text',lambda:comparison_variant("jsonb_set(jsonb_set(payload,'{inboxItems,1,registeredBy}','\""+S+"\"'),'{inboxItems,1,rawText}','\"FOREIGN PRIVATE\"')",'restricted','42501'))
stage('ambiguous-comparison-remains-readonly',lambda:comparison_variant("jsonb_set(payload,'{inboxItems}',(payload->'inboxItems')||jsonb_build_array(payload->'inboxItems'->1))",'unsupported','22023'))
stage('malformed-comparison-remains-readonly',lambda:comparison_variant("jsonb_set(payload,'{inboxItems}','{}')",'unsupported','22023'))
stage('coowner-original-current-comparison-denied',lambda:denied(f"SELECT public.busy_work_compare_v1('{B}','{C}','{state['second']}');",uid=S))
stage('wrong-business-original-current-comparison-denied',lambda:denied(f"SELECT public.busy_work_compare_v1('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','{C}','{state['second']}');"))
stage('service-account-discovery-denied',lambda:denied(f"SELECT public.busy_work_discover_v1('{B}');",role='service_role'))
def edit_context_current():
 id=state['second'];r=row(id);v=rpc('edit_context',[B,C,id,r['revision']]);eq(v['currentEditContext'],True);eq(v['revision'],r['revision']);eq(v['allowedOperations'],['edit_quote','private_followup']);eq(v['contextSnapshotRevision'],100);eq(v['customerId'],C);eq(v['engagementId'],id);assert 'secretSynthetic' not in json.dumps(v) and 'unknownPrivate' not in json.dumps(v)
stage('current-finite-edit-context-derived-from-live-source',edit_context_current)
stage('edit-context-requires-exact-revision',lambda:denied(f"SELECT public.busy_work_edit_context_v1('{B}','{C}','{state['second']}',NULL);",'22023'))
stage('stale-edit-context-revision-denied',lambda:denied(f"SELECT public.busy_work_edit_context_v1('{B}','{C}','{state['second']}',1);",'40001'))
def context_source(patch,code):
 id=state['second'];rev=row(id)['revision'];r=call(f"BEGIN;UPDATE public.busy_business_snapshots SET payload={patch} WHERE business_id='{B}';"+auth(f"SELECT public.busy_work_edit_context_v1('{B}','{C}','{id}',{rev});"));assert r.returncode!=0 and code in r.stderr
stage('corrected-source-cannot-open-current-editor',lambda:context_source("jsonb_set(payload,'{inboxItems,1,rawText}','\"Changed source\"')",'40001'))
stage('missing-customer-cannot-open-current-editor',lambda:context_source("jsonb_set(payload,'{customers}','[]')",'22023'))
stage('foreign-source-cannot-open-current-editor',lambda:context_source("jsonb_set(payload,'{inboxItems,1,registeredBy}','\""+S+"\"')",'42501'))
for uid,label in [(M,'member'),(S,'coowner'),(D,'foreign')]:
 stage(label+'-edit-context-denied',lambda uid=uid:denied(f"SELECT public.busy_work_edit_context_v1('{B}','{C}','{state['second']}',{row(state['second'])['revision']});",uid=uid))
def role_context(remove=False):
 id=state['second'];rev=row(id)['revision'];change=f"DELETE FROM public.busy_business_memberships WHERE business_id='{B}' AND user_id='{O}'" if remove else f"UPDATE public.busy_business_memberships SET role='admin' WHERE business_id='{B}' AND user_id='{O}'"
 r=call('BEGIN;'+change+';'+auth(f"SELECT public.busy_work_edit_context_v1('{B}','{C}','{id}',{rev});"));assert r.returncode!=0 and '42501' in r.stderr
stage('admin-edit-context-denied',role_context)
stage('revoked-edit-context-denied',lambda:role_context(True))
stage('anonymous-edit-context-denied',lambda:denied(f"SELECT public.busy_work_edit_context_v1('{B}','{C}','{state['second']}',1);",role='anon',uid=''))
# New finite purpose: separate owner-private Work notes, never migrated from followup.
def notes_read():return rpc('private_read',[B,C,state['second'],'work_notes'])
def notes_write(expected,words,op):
 r=read(state['second']);return rpc('private_write',[B,C,state['second'],r['revision'],expected,r['sourceHash'],'work_notes',words,op],commit=True)
stage('work-notes-independent-absence',lambda:eq(notes_read()['revision'],0))
def notes_create():
 state['notesFollowupBefore']=rpc('private_read',[B,C,state['second'],'followup']);state['notesQuoteBefore']=row(state['second']);v=notes_write(0,'Exact internal Work notes\nnot a message','notes-create-first');eq(v['kind'],'work_notes');eq(v['revision'],1);eq(notes_read()['text'],'Exact internal Work notes\nnot a message');eq(rpc('private_read',[B,C,state['second'],'followup']),state['notesFollowupBefore']);eq(row(state['second']),state['notesQuoteBefore'])
stage('work-notes-create-preserves-followup-and-quote',notes_create)
stage('work-notes-repeated-create-cas-denied',lambda:denied('SELECT public.busy_work_private_write_v1('+','.join(map(q,[B,C,state['second'],row(state['second'])['revision'],0,read(state['second'])['sourceHash'],'work_notes','No stale overwrite','notes-repeat-zero']))+');','40001'))
def notes_extensions():
 run(f"UPDATE public.business_work_private_drafts SET extensions='{{\"futureNotes\":{{\"keep\":true}}}}'::jsonb WHERE business_id='{B}' AND engagement_id='{state['second']}' AND kind='work_notes';")
 r=read(state['second']);rpc('private_write',[B,C,state['second'],r['revision'],1,r['sourceHash'],'work_notes','Notes extensions preserved','notes-extension-edit']);v=run(f"SELECT extensions::text FROM public.business_work_private_drafts WHERE business_id='{B}' AND engagement_id='{state['second']}' AND kind='work_notes';");assert 'futureNotes' in v and 'futureNotes' not in json.dumps(notes_read())
stage('work-notes-compatible-extensions-retained-not-disclosed',notes_extensions)
stage('work-notes-own-revision-edit',lambda:eq(notes_write(1,'Revised internal notes','notes-edit-second')['revision'],2))
def notes_competing():
 id=state['second'];r=read(id);args=[B,C,id,r['revision'],2,r['sourceHash'],'work_notes','Writer A notes','notes-concurrent-a'];h=hold('SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='+q(O)+';SELECT public.busy_work_private_write_v1('+','.join(map(q,args))+')');args[-1]='notes-concurrent-b';other=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True);other.stdin.write("SET statement_timeout='5s';"+auth('SELECT public.busy_work_private_write_v1('+','.join(map(q,args))+');',commit=True));other.stdin.close();time.sleep(.2);assert other.poll() is None;release(h);other.wait(timeout=8);output=other.stdout.read()+other.stderr.read();logs.append({'exitCode':other.returncode,'holderExitCode':h.returncode,'output':output});assert other.returncode!=0 and '40001' in output;eq(notes_read()['revision'],3)
stage('work-notes-real-competing-cas-one-wins',notes_competing)
for uid,label in [(M,'member'),(S,'coowner'),(D,'foreign')]:stage(label+'-work-notes-denied',lambda uid=uid:denied(f"SELECT public.busy_work_private_read_v1('{B}','{C}','{state['second']}','work_notes');",uid=uid))
stage('anonymous-work-notes-denied',lambda:denied(f"SELECT public.busy_work_private_read_v1('{B}','{C}','{state['second']}','work_notes');",role='anon',uid=''))
def notes_revoked():
 r=call(f"BEGIN;DELETE FROM public.busy_business_memberships WHERE business_id='{B}' AND user_id='{O}';"+auth(f"SELECT public.busy_work_private_read_v1('{B}','{C}','{state['second']}','work_notes');"));assert r.returncode!=0 and '42501' in r.stderr
stage('revoked-work-notes-denied',notes_revoked)
def notes_changed():
 r=read(state['second']);args=[B,C,state['second'],r['revision'],3,r['sourceHash'],'work_notes','No changed-source write','notes-source-denied'];v=call(f"BEGIN;UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{inboxItems,1,rawText}}','\"Changed source for notes\"') WHERE business_id='{B}';"+auth('SELECT public.busy_work_private_write_v1('+','.join(map(q,args))+');'));assert v.returncode!=0 and '40001' in v.stderr
stage('changed-source-work-notes-write-denied',notes_changed)
def notes_admin():
 r=call(f"BEGIN;UPDATE public.busy_business_memberships SET role='admin' WHERE business_id='{B}' AND user_id='{O}';"+auth(f"SELECT public.busy_work_private_read_v1('{B}','{C}','{state['second']}','work_notes');"));assert r.returncode!=0 and '42501' in r.stderr
stage('admin-work-notes-denied',notes_admin)
stage('foreign-business-work-notes-denied',lambda:denied(f"SELECT public.busy_work_private_read_v1('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','{C}','{state['second']}','work_notes');"))
def notes_lost_ack():
 notes_write(3,'Writer A notes','notes-lost-ack');v=notes_read();eq(v['revision'],4);eq(v['notOwnReceipt'],True);assert 'operationId' not in v
stage('work-notes-lost-ack-read-not-own-receipt',notes_lost_ack)
stage('unknown-private-purpose-denied',lambda:denied(f"SELECT public.busy_work_private_read_v1('{B}','{C}','{state['second']}','arbitrary_notes');",'22023'))
stage('work-notes-do-not-leak-through-work-projection',lambda:(eq('Writer A notes' in json.dumps(read(state['second'])),False),eq(row(state['second']),state['notesQuoteBefore']),eq(json.loads(run(f"SELECT extensions::text FROM public.business_work_private_drafts WHERE business_id='{B}' AND engagement_id='{state['second']}' AND kind='work_notes';"))['futureNotes']['keep'],True)))
# Immutable owner-reported evidence of exact INTERNAL quote terms, never acceptance.
def agreement_context():return rpc('agreement_review',[B,C,state['second'],row(state['second'])['revision']])
def agreement_create(op,words='Owner reports a verbal discussion; no independently verified receipt'):
 v=agreement_context();return rpc('agreement_create',[B,C,state['second'],v['revision'],v['termsHash'],words,op],commit=True)
def agreement_read(id):return rpc('agreement_read',[B,C,state['second'],id])
def agreement_first():
 v=agreement_context();eq(v['evidenceClass'],'owner_reported_offline');eq(v['verification'],'unverified');eq(v['bookingEligible'],False);eq(v['terms']['presentation'],'internal_prepared_quote');assert 'secretSynthetic' not in json.dumps(v);state['agreementQuoteBefore']=row(state['second']);state['agreementNotesBefore']=notes_read();state['agreementFollowupBefore']=rpc('private_read',[B,C,state['second'],'followup']);state['agreement1']=agreement_create('owner-report-first')['evidenceId']
def agreement_full_hash():
 before=agreement_context();id=state['second'];sql=f"BEGIN;UPDATE public.business_work_engagements SET work_data=jsonb_set(work_data,'{{futureTerms}}','{{\"privateHashMarker\":true}}'::jsonb) WHERE id='{id}';SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{O}';SELECT public.busy_work_agreement_review_v1('{B}','{C}','{id}',{row(id)['revision']});ROLLBACK;";value=json.loads(next(x for x in run(sql).splitlines() if x.startswith('{')));assert value['termsHash']!=before['termsHash'];assert 'privateHashMarker' not in json.dumps(value);eq(value['revision'],before['revision'])
stage('agreement-fingerprint-binds-whole-work-without-disclosing-extensions',agreement_full_hash)
stage('owner-report-review-server-derived-internal-terms',agreement_first)
def agreement_snapshot():
 v=agreement_read(state['agreement1']);eq(v['quoteRevision'],state['agreementQuoteBefore']['revision']);eq(v['termsChanged'],False);eq(v['notOwnReceipt'],True);eq(v['verification'],'unverified');eq(v['recordedTimeMeaning'],'server_recorded_owner_report_not_external_event');eq(v['requestAssociationState'],'not_established_by_protocol');assert 'operationId' not in v;state['agreementOriginal']=v;eq(row(state['second']),state['agreementQuoteBefore']);eq(notes_read(),state['agreementNotesBefore']);eq(rpc('private_read',[B,C,state['second'],'followup']),state['agreementFollowupBefore'])
stage('owner-report-exact-read-preserves-work-private-and-legacy',agreement_snapshot)
def agreement_deny_patch(revision=None,terms=None):
 v=agreement_context();denied('SELECT public.busy_work_agreement_create_v1('+','.join(map(q,[B,C,state['second'],v['revision'] if revision is None else revision,v['termsHash'] if terms is None else terms,'No unsupported assertion','rejected-owner-report']))+');','40001')
stage('owner-report-duplicate-quote-version-denied',agreement_deny_patch)
stage('owner-report-forged-terms-fingerprint-denied',lambda:agreement_deny_patch(terms='0'*64))
stage('owner-report-stale-quote-version-denied',lambda:agreement_deny_patch(revision=1))
for uid,label in [(M,'member'),(S,'coowner'),(D,'foreign')]:stage(label+'-owner-report-denied',lambda uid=uid:denied(f"SELECT public.busy_work_agreement_read_v1('{B}','{C}','{state['second']}','{state['agreement1']}');",uid=uid))
stage('anonymous-owner-report-denied',lambda:denied(f"SELECT public.busy_work_agreement_read_v1('{B}','{C}','{state['second']}','{state['agreement1']}');",uid='',role='anon'))
def agreement_role(remove=False):
 change=f"DELETE FROM public.busy_business_memberships WHERE business_id='{B}' AND user_id='{O}'" if remove else f"UPDATE public.busy_business_memberships SET role='admin' WHERE business_id='{B}' AND user_id='{O}'";v=call('BEGIN;'+change+';'+auth(f"SELECT public.busy_work_agreement_read_v1('{B}','{C}','{state['second']}','{state['agreement1']}');"));assert v.returncode!=0 and '42501' in v.stderr
stage('admin-owner-report-denied',agreement_role);stage('revoked-owner-report-denied',lambda:agreement_role(True))
stage('foreign-business-owner-report-denied',lambda:denied(f"SELECT public.busy_work_agreement_read_v1('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','{C}','{state['second']}','{state['agreement1']}');"))
stage('wrong-engagement-evidence-adoption-denied',lambda:denied(f"SELECT public.busy_work_agreement_read_v1('{B}','{C}','{state['first']}','{state['agreement1']}');"))
for role in ['authenticated','service_role']:stage(role+'-raw-agreement-table-denied',lambda role=role:denied('SELECT * FROM public.business_work_agreement_evidence;',role=role))
stage('owner-report-immutable-terms-update-denied',lambda:denied(f"UPDATE public.business_work_agreement_evidence SET owner_account='Rewrite' WHERE id='{state['agreement1']}';",role='postgres'))
def verified_rejected():
 denied(f"INSERT INTO public.business_work_agreement_evidence(business_id,customer_id,engagement_id,created_by,quote_revision,evidence_class,verification,quote_terms,terms_hash,source_hash,owner_account,creation_operation_id) SELECT business_id,customer_id,engagement_id,created_by,quote_revision+100,'owner_reported_offline','verified',quote_terms,terms_hash,source_hash,owner_account,'unsupported-verified-proof' FROM public.business_work_agreement_evidence WHERE id='{state['agreement1']}';",'23514',role='postgres')
stage('verified-class-is-not-owner-report-upgrade',verified_rejected)
def agreement_changed_quote():
 id=state['second'];r=row(id);edit(id,r['revision'],'change-quote-after-report','  Changed quoted terms\nnot inherited  ','0');v=agreement_read(state['agreement1']);eq(v['termsHash'],state['agreementOriginal']['termsHash']);eq(v['terms'],state['agreementOriginal']['terms']);eq(v['termsChanged'],True);eq(v['currentQuoteRevision'],r['revision']+1);eq(v['currentTerms']['amount'],'0');eq(v['bookingEligible'],False);eq(row(id)['status'],'Prepared');state['agreement2']=agreement_create('owner-report-new-quote-version')['evidenceId'];assert state['agreement1']!=state['agreement2']
stage('changed-quote-keeps-old-report-without-inheriting-agreement',agreement_changed_quote)
def agreement_pages():
 a=rpc('agreement_list',[B,C,state['second'],None,1]);eq(len(a['items']),1);assert a['nextCursor'];b=rpc('agreement_list',[B,C,state['second'],a['nextCursor'],1]);eq(len(b['items']),1);assert a['items'][0]['evidenceId']!=b['items'][0]['evidenceId'];assert all(set(x)=={'evidenceId','quoteRevision','evidenceClass','verification'} for x in a['items']+b['items'])
stage('agreement-keyset-summaries-no-owner-text',agreement_pages)
stage('agreement-page-size-bounded',lambda:denied(f"SELECT public.busy_work_agreement_list_v1('{B}','{C}','{state['second']}',NULL,51);",'22023'))
def agreement_source_change():
 v=call(f"BEGIN;UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{inboxItems,1,rawText}}','\"Source changed after report\"') WHERE business_id='{B}';"+auth(f"SELECT public.busy_work_agreement_read_v1('{B}','{C}','{state['second']}','{state['agreement1']}');"));assert v.returncode!=0 and '40001' in v.stderr
stage('changed-source-owner-report-read-fails-closed',agreement_source_change)
def agreement_competing():
 r=row(state['second']);edit(state['second'],r['revision'],'next-report-quote-version','Terms for concurrent owner reports','0');v=agreement_context();args=[B,C,state['second'],v['revision'],v['termsHash'],'Owner report A','owner-report-concurrent-a'];h=hold('SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='+q(O)+';SELECT public.busy_work_agreement_create_v1('+','.join(map(q,args))+')');args[-1]='owner-report-concurrent-b';other=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True);other.stdin.write("SET statement_timeout='5s';"+auth('SELECT public.busy_work_agreement_create_v1('+','.join(map(q,args))+');',commit=True));other.stdin.close();time.sleep(.2);assert other.poll() is None;release(h);other.wait(timeout=8);output=other.stdout.read()+other.stderr.read();logs.append({'exitCode':other.returncode,'holderExitCode':h.returncode,'output':output});assert other.returncode!=0 and '40001' in output;items=rpc('agreement_list',[B,C,state['second'],None,20]);eq(len(items['items']),3);e=next(x for x in items['items'] if x['quoteRevision']==v['revision']);seen=agreement_read(e['evidenceId']);eq(seen['notOwnReceipt'],True);assert 'operationId' not in seen
stage('real-competing-owner-reports-one-immutable-winner',agreement_competing)
# Append-only correction/withdrawal proposal: exact original report, current eligibility.
def decision_context():return rpc('agreement_decision_review',[B,C,state['second'],state['agreement1'],row(state['second'])['revision']])
def decision_args(expected=0,action='correct',words='  Corrected owner account\nnot independently verified  ',op='report-correction-first'):
 v=decision_context();return [B,C,state['second'],state['agreement1'],v['revision'],expected,v['termsHash'],action,words,op]
def decision_first():
 v=decision_context();eq(v['decisionRevision'],0);eq(v['reportState'],'original');eq(v['quoteRevision'],state['agreementOriginal']['quoteRevision']);assert v['revision']>v['quoteRevision'];state['decisionWorkBefore']=row(state['second']);state['decisionOtherBefore']=row(state['first']);state['decisionPrivateBefore']=run('SELECT row_to_json(x) FROM public.business_work_private_drafts x ORDER BY kind;');state['decisionPayloadBefore']=run('SELECT payload::text FROM public.busy_business_snapshots WHERE business_id='+q(B)+';');state['decisionReceipt']=rpc('agreement_decide',decision_args(),commit=True);eq(state['decisionReceipt']['revision'],1);eq(state['decisionReceipt']['verification'],'unverified');eq(state['decisionReceipt']['bookingEligible'],False)
stage('append-only-correction-old-quote-version-current-source-review',decision_first)
def decision_readback():
 v=agreement_read(state['agreement1']);eq(v['ownerAccount'],state['agreementOriginal']['ownerAccount']);eq(v['terms'],state['agreementOriginal']['terms']);eq(v['termsHash'],state['agreementOriginal']['termsHash']);eq(v['decisionRevision'],1);eq(v['reportState'],'corrected');eq(v['currentOwnerAccount'],'  Corrected owner account\nnot independently verified  ');eq(v['termsChanged'],True);eq(v['notOwnReceipt'],True);assert 'operationId' not in v;eq(v['decisionId'],state['decisionReceipt']['decisionId'])
stage('correction-independent-read-keeps-original-terms-and-words',decision_readback)
def decision_deny(args=None,code='40001',uid=O,role='authenticated'):
 denied('SELECT public.busy_work_agreement_decide_v1('+','.join(map(q,args or decision_args()))+');',code,uid,role)
stage('duplicate-correction-cas-denied',decision_deny)
def decision_wrong_terms():
 args=decision_args(1);args[6]='0'*64;decision_deny(args)
stage('correction-forged-original-terms-denied',decision_wrong_terms)
def decision_wrong_engagement():
 args=decision_args(1);args[2]=state['first'];args[4]=row(state['first'])['revision'];decision_deny(args,'42501')
stage('same-customer-wrong-engagement-report-denied',decision_wrong_engagement)
def decision_stale_quote():
 args=decision_args(1);args[4]=1;decision_deny(args)
stage('correction-stale-current-work-revision-denied',decision_stale_quote)
for uid,label in [(M,'member'),(S,'coowner'),(D,'foreign')]:stage(label+'-correction-mutation-denied',lambda uid=uid:decision_deny(decision_args(1),'42501',uid))
stage('anonymous-correction-denied',lambda:decision_deny(decision_args(1),'42501','',role='anon'))
def decision_role(remove=False):
 args=decision_args(1);change=f"DELETE FROM public.busy_business_memberships WHERE business_id='{B}' AND user_id='{O}'" if remove else f"UPDATE public.busy_business_memberships SET role='admin' WHERE business_id='{B}' AND user_id='{O}'";v=call('BEGIN;'+change+';'+auth('SELECT public.busy_work_agreement_decide_v1('+','.join(map(q,args))+');'));assert v.returncode!=0 and '42501' in v.stderr
stage('admin-correction-denied',decision_role)
stage('revoked-correction-denied',lambda:decision_role(True))
def decision_source_changed():
 args=decision_args(1);v=call(f"BEGIN;UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{inboxItems,1,rawText}}','\"Changed evidence source\"') WHERE business_id='{B}';"+auth('SELECT public.busy_work_agreement_decide_v1('+','.join(map(q,args))+');'));assert v.returncode!=0 and '40001' in v.stderr
stage('source-changed-correction-denied-keeps-original',decision_source_changed)
for role in ['authenticated','service_role']:stage(role+'-raw-correction-read-denied',lambda role=role:denied('SELECT * FROM public.business_work_agreement_decisions;',role=role))
stage('decision-immutable-even-privileged-update-denied',lambda:denied("UPDATE public.business_work_agreement_decisions SET statement='rewrite' WHERE evidence_id="+q(state['agreement1'])+';','42501',role='postgres'))
def decision_competing():
 args=decision_args(1,words='Writer A correction',op='report-decision-compete-a');h=hold('SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='+q(O)+';SELECT public.busy_work_agreement_decide_v1('+','.join(map(q,args))+')');args[-1]='report-decision-compete-b';other=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True);other.stdin.write("SET statement_timeout='5s';"+auth('SELECT public.busy_work_agreement_decide_v1('+','.join(map(q,args))+');',commit=True));other.stdin.close();time.sleep(.2);assert other.poll() is None;release(h);other.wait(timeout=8);output=other.stdout.read()+other.stderr.read();logs.append({'exitCode':other.returncode,'output':output});assert other.returncode!=0 and '40001' in output;eq(agreement_read(state['agreement1'])['decisionRevision'],2)
stage('real-competing-corrections-one-cas-winner',decision_competing)
def decision_withdraw():
 receipt=rpc('agreement_decide',decision_args(2,'withdraw','No longer able to support my account','report-withdrawal-first'),commit=True);v=agreement_read(state['agreement1']);eq(v['reportState'],'withdrawn');eq(v['decisionRevision'],3);eq(v['currentOwnerAccount'],None);eq(v['ownerAccount'],state['agreementOriginal']['ownerAccount']);eq(v['quoteRevision'],state['agreementOriginal']['quoteRevision']);eq(receipt['bookingEligible'],False);state['withdrawalReceipt']=receipt
stage('withdrawal-is-append-only-not-deletion-or-acceptance',decision_withdraw)
stage('withdrawn-report-cannot-be-reactivated',lambda:decision_deny(decision_args(3,op='withdrawn-report-replay')))
def decision_preserve():
 eq(row(state['second']),state['decisionWorkBefore']);eq(row(state['first']),state['decisionOtherBefore']);eq(run('SELECT row_to_json(x) FROM public.business_work_private_drafts x ORDER BY kind;'),state['decisionPrivateBefore']);eq(run('SELECT payload::text FROM public.busy_business_snapshots WHERE business_id='+q(B)+';'),state['decisionPayloadBefore']);eq(run("SELECT count(*) FROM public.business_work_agreement_decisions WHERE evidence_id="+q(state['agreement1'])+';').strip(),'3');eq(row(state['second'])['status'],'Prepared');eq(agreement_read(state['agreement2'])['decisionRevision'],0)
stage('decisions-cannot-change-quotes-private-work-snapshot-or-other-reports',decision_preserve)
def readiness():
 v=rpc('booking_readiness',[B,C,state['second'],state['agreement1']]);eq(v['reportState'],'withdrawn');eq(v['executionAuthorised'],False);eq(v['bookingEligible'],False);eq(v['customerResponseEvidence'],'not_established_by_protocol');eq(v['requestAssociationState'],'unsupported_missing_canonical_request_contract');eq(v['terms'],state['agreementOriginal']['terms']);eq(len(v['requirements']),4);assert 'ownerAccount' not in v;decision_preserve()
stage('booking-readiness-does-not-invent-request-or-acceptance',readiness)
def decision_fk():
 denied("INSERT INTO public.business_work_agreement_decisions(evidence_id,business_id,customer_id,engagement_id,created_by,decision_revision,action,statement,quote_revision,terms_hash,reviewed_engagement_revision,reviewed_source_hash,operation_id) SELECT evidence_id,business_id,customer_id,engagement_id,'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',99,'correct','Forged attribution',quote_revision,terms_hash,reviewed_engagement_revision,reviewed_source_hash,'forged-correction-parent' FROM public.business_work_agreement_decisions LIMIT 1;",'23503',role='postgres')
stage('correction-parent-fk-binds-author-business-customer-and-terms',decision_fk)
def finite_no_booking_mutation():
 v=run("SELECT pg_get_functiondef(oid) FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN ('busy_work_agreement_decide_v1','busy_work_booking_readiness_v1');")
 assert 'INSERT INTO public.business_work_agreement_decisions' in v
 for forbidden in ['UPDATE public.business_work_engagements','UPDATE public.busy_business_snapshots','busy_mark_mini_app_request_link','INSERT INTO public.busy_mini_app','UPDATE public.busy_mini_app','DELETE FROM public.']:assert forbidden not in v,forbidden
 decision_preserve()
stage('finite-evidence-definitions-cannot-accept-book-message-or-pay',finite_no_booking_mutation)
# Private immutable quote version reference: intentionally no presentation or request mutation.
def ref_context(id=None):
 id=id or state['second'];return rpc('quote_reference_review',[B,C,id,row(id)['revision']])
def ref_create(op,id=None):
 id=id or state['second'];v=ref_context(id);return rpc('quote_reference_create',[B,C,id,v['revision'],v['termsHash'],op],commit=True)
def ref_read(id=None,eng=None):return rpc('quote_reference_read',[B,C,eng or state['second'],id or state['ref1']])
def ref_first():
 v=ref_context();eq(v['presentationState'],'prepared_not_presented');eq(v['executionAuthorised'],False);state['refWorkBefore']=row(state['second']);state['refOtherBefore']=row(state['first']);state['refPrivateBefore']=run('SELECT row_to_json(x) FROM public.business_work_private_drafts x ORDER BY kind;');state['refAgreementBefore']=agreement_read(state['agreement1']);state['refPayloadBefore']=run('SELECT payload::text FROM public.busy_business_snapshots WHERE business_id='+q(B)+';');r=ref_create('private-quote-reference-first');state['ref1']=r['referenceId'];eq(r['quoteRevision'],v['revision']);eq(r['termsHash'],v['termsHash']);eq(r['presentationState'],'prepared_not_presented');eq(r['executionAuthorised'],False)
stage('quote-reference-server-minted-exact-internal-version',ref_first)
def ref_exact():
 v=ref_read();state['refOriginal']=v;eq(v['termsHash'],ref_context()['termsHash']);eq(v['termsChanged'],False);eq(v['notOwnReceipt'],True);eq(v['providerEvidence'],'not_established_by_protocol');eq(v['customerResponseEvidence'],'no_exact_quote_reference_in_original_protocol');eq(v['requestAssociationState'],'not_established_by_protocol');assert 'operationId' not in v and 'secretSynthetic' not in str(v)
stage('quote-reference-independent-read-is-not-presentation-or-own-receipt',ref_exact)
def ref_deny(args=None,code='23505',uid=O,role='authenticated'):
 v=ref_context();args=args or [B,C,state['second'],v['revision'],v['termsHash'],'duplicate-quote-ref'];denied('SELECT public.busy_work_quote_reference_create_v1('+','.join(map(q,args))+');',code,uid,role)
stage('duplicate-private-reference-for-same-quote-version-denied',ref_deny)
stage('forged-reference-terms-denied',lambda:ref_deny([B,C,state['second'],row(state['second'])['revision'],'0'*64,'forged-ref-terms'],'40001'))
stage('stale-reference-revision-denied',lambda:ref_deny([B,C,state['second'],1,state['refOriginal']['termsHash'],'stale-ref-version'],'40001'))
for uid,label in [(M,'member'),(S,'coowner'),(D,'foreign')]:stage(label+'-quote-reference-denied',lambda uid=uid:ref_deny(code='42501',uid=uid))
stage('anonymous-quote-reference-denied',lambda:ref_deny(code='42501',uid='',role='anon'))
def ref_role(remove=False):
 v=ref_context();change=f"DELETE FROM public.busy_business_memberships WHERE business_id='{B}' AND user_id='{O}'" if remove else f"UPDATE public.busy_business_memberships SET role='admin' WHERE business_id='{B}' AND user_id='{O}'";r=call('BEGIN;'+change+';'+auth(f"SELECT public.busy_work_quote_reference_read_v1('{B}','{C}','{state['second']}','{state['ref1']}');"));assert r.returncode!=0 and '42501' in r.stderr
stage('admin-quote-reference-read-denied',ref_role)
stage('revoked-quote-reference-read-denied',lambda:ref_role(True))
for role in ['authenticated','service_role']:stage(role+'-raw-quote-reference-denied',lambda role=role:denied('SELECT * FROM public.business_work_quote_references;',role=role))
stage('immutable-reference-update-denied',lambda:denied(f"UPDATE public.business_work_quote_references SET state='sent' WHERE id='{state['ref1']}';",role='postgres'))
stage('same-customer-different-engagement-reference-denied',lambda:denied(f"SELECT public.busy_work_quote_reference_read_v1('{B}','{C}','{state['first']}','{state['ref1']}');"))
stage('foreign-business-reference-denied',lambda:denied(f"SELECT public.busy_work_quote_reference_read_v1('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','{C}','{state['second']}','{state['ref1']}');"))
def ref_preserved():
 eq(row(state['second']),state['refWorkBefore']);eq(row(state['first']),state['refOtherBefore']);eq(run('SELECT row_to_json(x) FROM public.business_work_private_drafts x ORDER BY kind;'),state['refPrivateBefore']);eq(agreement_read(state['agreement1']),state['refAgreementBefore']);eq(run('SELECT payload::text FROM public.busy_business_snapshots WHERE business_id='+q(B)+';'),state['refPayloadBefore'])
stage('reference-preparation-preserves-work-private-evidence-and-snapshot',ref_preserved)
def ref_changed():
 r=row(state['second']);edit(state['second'],r['revision'],'quote-edited-after-private-reference','  New quote wording\nnot inherited  ','0');v=ref_read();eq(v['terms'],state['refOriginal']['terms']);eq(v['termsHash'],state['refOriginal']['termsHash']);eq(v['termsChanged'],True);eq(v['presentationState'],'prepared_not_presented');state['ref2']=ref_create('private-quote-reference-second-version')['referenceId'];assert state['ref1']!=state['ref2']
stage('new-quote-version-does-not-inherit-old-preparation',ref_changed)
def ref_page():
 a=rpc('quote_reference_list',[B,C,state['second'],None,1]);b=rpc('quote_reference_list',[B,C,state['second'],a['nextCursor'],1]);eq(len(a['items']),1);eq(len(b['items']),1);assert a['items'][0]['referenceId']!=b['items'][0]['referenceId'];eq(set(a['items'][0]),{'referenceId','quoteRevision','presentationState'})
stage('quote-reference-keyset-page-has-no-terms-or-private-wording',ref_page)
def ref_source():
 v=call(f"BEGIN;UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{inboxItems,1,rawText}}','\"Corrected original source\"') WHERE business_id='{B}';"+auth(f"SELECT public.busy_work_quote_reference_read_v1('{B}','{C}','{state['second']}','{state['ref1']}');"));assert v.returncode!=0 and '40001' in v.stderr
stage('source-corrected-reference-read-denied',ref_source)
def ref_compete():
 id=state['second'];r=row(id);edit(id,r['revision'],'quote-for-competing-preparations','Terms for preparation competition','0');v=ref_context();args=[B,C,id,v['revision'],v['termsHash'],'quote-reference-compete-a'];h=hold('SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='+q(O)+';SELECT public.busy_work_quote_reference_create_v1('+','.join(map(q,args))+')');args[-1]='quote-reference-compete-b';other=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True);other.stdin.write("SET statement_timeout='5s';"+auth('SELECT public.busy_work_quote_reference_create_v1('+','.join(map(q,args))+');',commit=True));other.stdin.close();time.sleep(.2);assert other.poll() is None;release(h);other.wait(timeout=8);output=other.stdout.read()+other.stderr.read();logs.append({'exitCode':other.returncode,'output':output});assert other.returncode!=0 and '23505' in output;eq(len(rpc('quote_reference_list',[B,C,id,None,20])['items']),3)
stage('real-competing-reference-creation-one-wins',ref_compete)
def ref_no_execution():
 text=run("SELECT pg_get_functiondef(oid) FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname LIKE 'busy_work_quote_reference_%';")
 for forbidden in ['busy_send_mini_app_message','busy_mark_mini_app_request_link','UPDATE public.business_work_engagements','INSERT INTO public.busy_mini_app','UPDATE public.busy_mini_app','DELETE FROM public.']:assert forbidden not in text,forbidden
 eq(row(state['second'])['status'],'Prepared');eq(row(state['first']),state['refOtherBefore']);eq(run('SELECT row_to_json(x) FROM public.business_work_private_drafts x ORDER BY kind;'),state['refPrivateBefore'])
stage('private-reference-cannot-send-accept-bind-request-book-or-pay',ref_no_execution)
# Recipient identity observation from ORIGINAL request/link schemas, never quote acceptance.
APP='33333333-3333-4333-8333-333333333333';VER='44444444-4444-4444-8444-444444444444';REQ='55555555-5555-4555-8555-555555555555';U='99999999-9999-4999-8999-999999999999'
def recipient_fixture():
 run(f"INSERT INTO public.busy_mini_apps(id,business_id,public_slug,created_by) VALUES('{APP}','{B}','fictional-recipient','{O}');INSERT INTO public.busy_mini_app_versions(id,business_id,mini_app_id,version_no,state,created_by) VALUES('{VER}','{B}','{APP}',1,'live','{O}');UPDATE public.busy_mini_apps SET status='live',current_live_version_id='{VER}' WHERE id='{APP}';INSERT INTO public.busy_mini_app_requests(id,business_id,mini_app_id,version_id,consumer_user_id,module_key,request_type) VALUES('{REQ}','{B}','{APP}','{VER}','{U}','enquiry','enquiry');SELECT public.busy_mark_mini_app_request_link_v3181('{B}','{REQ}','{O}','{C}',NULL,'enquiry_linked',false,'{{}}');")
 page=rpc('quote_reference_list',[B,C,state['second'],None,20]);state['recipientRef']=next(x['referenceId'] for x in page['items'] if x['quoteRevision']==row(state['second'])['revision']);state['recipientRowsBefore']=run('SELECT row_to_json(x) FROM public.busy_mini_app_requests x;SELECT row_to_json(x) FROM public.busy_mini_app_request_links x;');state['recipientWorkBefore']=row(state['second']);state['recipientOtherBefore']=row(state['first'])
stage('original-signed-in-request-and-owner-atomic-enquiry-link',recipient_fixture)
def recipient_review(request=REQ,ref=None,eng=None):return rpc('quote_recipient_review',[B,C,eng or state['second'],ref or state['recipientRef'],request])
def recipient_valid():
 v=recipient_review();eq(v['recipientIdentified'],True);eq(v['provenance'],'owner_linked_signed_in_request');eq(v['recipient']['consumerId'],U);assert v['customerId']!=U;eq(v['recipient']['requestId'],REQ);eq(v['recipient']['appVersionId'],VER);eq(v['referenceId'],state['recipientRef']);eq(v['quoteRequestAssociated'],False);eq(v['consumerAccessAuthorised'],False);eq(v['customerResponseLinked'],False);eq(v['executionAuthorised'],False);eq(v['notOwnReceipt'],True);assert not any(x in str(v) for x in ['secretSynthetic','ownerAccount','phone','email'])
stage('owner-recipient-provenance-is-exact-owner-link-not-personhood-or-quote-response',recipient_valid)
def recipient_candidates():
 v=rpc('quote_recipient_candidates',[B,C,state['second'],state['recipientRef'],None,20]);eq(len(v['items']),1);eq(v['items'][0]['requestId'],REQ);eq(set(v['items'][0]),{'requestId','appId','requestRevision'});eq(v['candidateOnly'],True)
stage('bounded-original-link-candidates-no-consumer-or-message-disclosure',recipient_candidates)
for uid,label in [(M,'member'),(S,'coowner'),(D,'foreign'),(U,'consumer')]:stage(label+'-private-recipient-inspection-denied',lambda uid=uid:denied('SELECT public.busy_work_quote_recipient_review_v1('+','.join(map(q,[B,C,state['second'],state['recipientRef'],REQ]))+');',uid=uid))
def recipient_role(remove=False):
 change=f"DELETE FROM public.busy_business_memberships WHERE business_id='{B}' AND user_id='{O}'" if remove else f"UPDATE public.busy_business_memberships SET role='admin' WHERE business_id='{B}' AND user_id='{O}'";v=call('BEGIN;'+change+';'+auth('SELECT public.busy_work_quote_recipient_review_v1('+','.join(map(q,[B,C,state['second'],state['recipientRef'],REQ]))+');'));assert v.returncode!=0 and '42501' in v.stderr
stage('admin-private-recipient-denied',recipient_role)
stage('revoked-private-recipient-denied',lambda:recipient_role(True))
def recipient_patch(patch,reason):
 v=run('BEGIN;'+patch+';'+auth('SELECT public.busy_work_quote_recipient_review_v1('+','.join(map(q,[B,C,state['second'],state['recipientRef'],REQ]))+');'));values=[json.loads(x) for x in v.splitlines() if x.startswith('{')];matches=[x for x in values if 'recipientIdentified' in x];eq(len(matches),1);r=matches[0];eq(r['recipientIdentified'],False);eq(r['recipient'],None);eq(r['provenance'],reason)
stage('wrong-CRM-customer-link-is-unsupported-not-guessed',lambda:recipient_patch(f"UPDATE public.busy_mini_app_request_links SET customer_record_id='foreign-customer' WHERE request_id='{REQ}'",'missing_or_incompatible_owner_link'))
stage('link-by-another-owner-does-not-grant-private-recipient',lambda:recipient_patch(f"UPDATE public.busy_mini_app_request_links SET linked_by='{S}' WHERE request_id='{REQ}'",'missing_or_incompatible_owner_link'))
stage('mismatched-original-request-module-and-link-state-is-unsupported',lambda:recipient_patch(f"UPDATE public.busy_mini_app_requests SET request_type='booking_request' WHERE id='{REQ}'",'missing_or_incompatible_owner_link'))
stage('stale-reviewed-app-version-is-unsupported',lambda:recipient_patch(f"UPDATE public.busy_mini_apps SET current_live_version_id=NULL WHERE id='{APP}'",'app_or_reviewed_version_unavailable'))
stage('foreign-request-business-is-unsupported',lambda:recipient_patch(f"UPDATE public.busy_mini_app_requests SET business_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' WHERE id='{REQ}'",'missing_or_unsupported_request'))
stage('missing-request-is-explicitly-unsupported',lambda:(eq(recipient_review('77777777-7777-4777-8777-777777777777')['recipientIdentified'],False),eq(recipient_review('77777777-7777-4777-8777-777777777777')['recipient'],None)))
def recipient_ambiguous():
 patch=f"INSERT INTO public.busy_mini_app_requests(id,business_id,mini_app_id,version_id,consumer_user_id,module_key,request_type) VALUES('77777777-7777-4777-8777-777777777777','{B}','{APP}','{VER}','{D}','enquiry','enquiry');SELECT public.busy_mark_mini_app_request_link_v3181('{B}','77777777-7777-4777-8777-777777777777','{O}','{C}',NULL,'enquiry_linked',false,'{{}}')";recipient_patch(patch,'ambiguous_consumer_associations')
stage('two-consumers-for-one-CRM-customer-is-ambiguous',recipient_ambiguous)
def recipient_two_quotes():
 receipt=ref_create('recipient-other-quote-version',state['first']);v=recipient_review(ref=receipt['referenceId'],eng=state['first']);eq(v['recipientIdentified'],True);eq(v['engagementId'],state['first']);eq(v['referenceId'],receipt['referenceId']);eq(v['quoteRequestAssociated'],False);denied('SELECT public.busy_work_quote_recipient_review_v1('+','.join(map(q,[B,C,state['second'],receipt['referenceId'],REQ]))+');')
stage('same-consumer-two-quotes-no-cross-reference-adoption',recipient_two_quotes)
stage('old-quote-reference-not-current-recipient-authority',lambda:denied('SELECT public.busy_work_quote_recipient_review_v1('+','.join(map(q,[B,C,state['second'],state['ref1'],REQ]))+');','40001'))
def recipient_source():
 v=call(f"BEGIN;UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{{inboxItems,1,rawText}}','\"Changed recipient quote source\"') WHERE business_id='{B}';"+auth('SELECT public.busy_work_quote_recipient_review_v1('+','.join(map(q,[B,C,state['second'],state['recipientRef'],REQ]))+');'));assert v.returncode!=0 and '40001' in v.stderr
stage('changed-canonical-source-denies-recipient-inspection',recipient_source)
def recipient_unchanged():
 eq(row(state['second']),state['recipientWorkBefore']);eq(row(state['first']),state['recipientOtherBefore']);eq(run('SELECT row_to_json(x) FROM public.busy_mini_app_requests x;SELECT row_to_json(x) FROM public.busy_mini_app_request_links x;'),state['recipientRowsBefore']);eq(run('SELECT count(*) FROM public.busy_mini_app_work_bookings;').strip(),'0');assert 'owner_linked_signed_in_request' in str(recipient_review())
stage('recipient-inspection-does-not-change-request-link-work-or-bookings',recipient_unchanged)
# V22.52 private binding writes; consumer boundary is an independent hard denial.
def binding_context(eng=None,ref=None,request=REQ):
 eng=eng or state['second'];ref=ref or state['recipientRef'];return rpc('quote_binding_context',[B,C,eng,ref,request,row(eng)['revision']])
def binding_args(context=None,op='private-binding-first'):
 v=context or binding_context();return [B,C,v['engagementId'],v['referenceId'],REQ,v['quoteRevision'],0,v['reviewHash'],op]
def binding_read(eng=None,ref=None):return rpc('quote_binding_read',[B,C,eng or state['second'],ref or state['recipientRef']])
def binding_initial():
 v=binding_context();state['bindingContext']=v;eq(v['bindingExists'],False);eq(v['consumerAccessAuthorised'],False);eq(v['recipientReview']['recipient']['consumerId'],U);eq(binding_read()['eligibility'],'absent');state['bindingWorkBefore']=row(state['second']);state['bindingOtherBefore']=row(state['first']);state['bindingPrivateBefore']=run('SELECT row_to_json(x) FROM public.business_work_private_drafts x ORDER BY kind;');state['bindingOriginalRowsBefore']=run('SELECT row_to_json(x) FROM public.busy_mini_app_requests x;SELECT row_to_json(x) FROM public.busy_mini_app_request_links x;');state['bindingSnapshotBefore']=run('SELECT payload::text FROM public.busy_business_snapshots WHERE business_id='+q(B)+';')
stage('fresh-server-private-binding-context-and-explicit-absence',binding_initial)
def binding_denied(args=None,code='40001',uid=O,role='authenticated'):
 denied('SELECT public.busy_work_quote_binding_write_v1('+','.join(map(q,args or binding_args(state['bindingContext'])))+');',code,uid,role)
stage('forged-private-binding-review-hash-denied',lambda:binding_denied(binding_args(state['bindingContext'])[:-2]+['0'*64,'forged-binding-context']))
def binding_request_changed():
 v=call(f"BEGIN;UPDATE public.busy_mini_app_requests SET updated_at=updated_at+interval '1 second' WHERE id='{REQ}';"+auth('SELECT public.busy_work_quote_binding_write_v1('+','.join(map(q,binding_args(state['bindingContext'])))+');'));assert v.returncode!=0 and '40001' in v.stderr;eq(binding_read()['eligibility'],'absent')
stage('request-revision-changed-after-review-denies-private-write',binding_request_changed)
def binding_link_changed():
 v=call(f"BEGIN;UPDATE public.busy_mini_app_request_links SET updated_at=updated_at+interval '1 second' WHERE request_id='{REQ}';"+auth('SELECT public.busy_work_quote_binding_write_v1('+','.join(map(q,binding_args(state['bindingContext'])))+');'));assert v.returncode!=0 and '40001' in v.stderr
stage('link-revision-changed-after-review-denies-private-write',binding_link_changed)
def binding_bad_version():
 v=call(f"BEGIN;UPDATE public.busy_mini_apps SET current_live_version_id=NULL WHERE id='{APP}';"+auth('SELECT public.busy_work_quote_binding_write_v1('+','.join(map(q,binding_args(state['bindingContext'])))+');'));assert v.returncode!=0 and '42501' in v.stderr
stage('changed-app-version-after-review-denies-private-write',binding_bad_version)
for uid,label in [(M,'member'),(S,'coowner'),(D,'foreign'),(U,'consumer')]:stage(label+'-private-binding-write-denied',lambda uid=uid:binding_denied(code='42501',uid=uid))
def binding_owner_role(remove=False):
 change=f"DELETE FROM public.busy_business_memberships WHERE business_id='{B}' AND user_id='{O}'" if remove else f"UPDATE public.busy_business_memberships SET role='admin' WHERE business_id='{B}' AND user_id='{O}'";v=call('BEGIN;'+change+';'+auth('SELECT public.busy_work_quote_binding_write_v1('+','.join(map(q,binding_args(state['bindingContext'])))+');'));assert v.returncode!=0 and '42501' in v.stderr
stage('revoked-owner-binding-write-denied',lambda:binding_owner_role(True))
stage('admin-owner-binding-write-denied',binding_owner_role)
def binding_wrong_ref():
 args=binding_args(state['bindingContext']);args[3]=run(f"SELECT id FROM public.business_work_quote_references WHERE engagement_id='{state['first']}' LIMIT 1;").strip();binding_denied(args,'42501')
stage('same-customer-wrong-quote-binding-denied',binding_wrong_ref)
def binding_save():
 r=rpc('quote_binding_write',binding_args(state['bindingContext']),commit=True);state['bindingReceipt']=r;eq(r['previousRevision'],0);eq(r['revision'],1);eq(r['referenceId'],state['recipientRef']);eq(r['consumerId'],U);eq(r['consumerAccessAuthorised'],False);eq(r['quoteRequestAssociated'],False);v=binding_read();eq(v['eligibility'],'current');eq(v['binding']['bindingId'],r['bindingId']);eq(v['notOwnReceipt'],True);assert 'operationId' not in str(v)
stage('record-private-binding-and-independent-exact-readback',binding_save)
stage('duplicate-private-binding-approval-denied',binding_denied)
for role in ['authenticated','service_role']:stage(role+'-raw-private-binding-table-denied',lambda role=role:denied('SELECT * FROM public.business_work_quote_recipient_bindings;',role=role))
stage('binding-recipient-cannot-be-mutated-even-privileged',lambda:denied(f"UPDATE public.business_work_quote_recipient_bindings SET consumer_id='{D}' WHERE id='{state['bindingReceipt']['bindingId']}';",role='postgres'))
def binding_changed_read():
 text=run(f"BEGIN;UPDATE public.busy_mini_app_request_links SET updated_at=updated_at+interval '1 second' WHERE request_id='{REQ}';"+auth('SELECT public.busy_work_quote_binding_read_v1('+','.join(map(q,[B,C,state['second'],state['recipientRef']]))+');'));v=json.loads(next(x for x in text.splitlines() if x.startswith('{')));eq(v['eligibility'],'changed_source_evidence');eq(v['recipient'],None)
stage('saved-binding-read-flags-current-source-drift-without-disclosure',binding_changed_read)
def binding_missing_read():
 text=run(f"BEGIN;DELETE FROM public.busy_mini_app_requests WHERE id='{REQ}';"+auth('SELECT public.busy_work_quote_binding_read_v1('+','.join(map(q,[B,C,state['second'],state['recipientRef']]))+');'));v=json.loads(next(x for x in text.splitlines() if x.startswith('{')));eq(v['eligibility'],'unavailable_recipient');eq(v['recipient'],None)
stage('request-erasure-not-blocked-by-binding-no-recipient-resurrection',binding_missing_read)
def binding_compete():
 ref=run(f"SELECT id FROM public.business_work_quote_references WHERE engagement_id='{state['first']}' LIMIT 1;").strip();state['bindingFirstRef']=ref;v=binding_context(state['first'],ref);args=binding_args(v,'binding-concurrent-a');h=hold('SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='+q(O)+';SELECT public.busy_work_quote_binding_write_v1('+','.join(map(q,args))+')');args[-1]='binding-concurrent-b';other=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True);other.stdin.write("SET statement_timeout='5s';"+auth('SELECT public.busy_work_quote_binding_write_v1('+','.join(map(q,args))+');',commit=True));other.stdin.close();time.sleep(.2);assert other.poll() is None;release(h);other.wait(timeout=8);output=other.stdout.read()+other.stderr.read();logs.append({'exitCode':other.returncode,'output':output});assert other.returncode!=0 and '40001' in output;seen=binding_read(state['first'],ref);eq(seen['eligibility'],'current');eq(seen['notOwnReceipt'],True);assert 'operationId' not in str(seen)
stage('two-quotes-independent-bindings-real-competing-approvals-one-wins',binding_compete)
def binding_preserves():
 eq(row(state['second']),state['bindingWorkBefore']);eq(row(state['first']),state['bindingOtherBefore']);eq(run('SELECT row_to_json(x) FROM public.business_work_private_drafts x ORDER BY kind;'),state['bindingPrivateBefore']);eq(run('SELECT row_to_json(x) FROM public.busy_mini_app_requests x;SELECT row_to_json(x) FROM public.busy_mini_app_request_links x;'),state['bindingOriginalRowsBefore']);eq(run('SELECT payload::text FROM public.busy_business_snapshots WHERE business_id='+q(B)+';'),state['bindingSnapshotBefore']);eq(run('SELECT count(*) FROM public.busy_mini_app_work_bookings;').strip(),'0')
stage('binding-write-preserves-all-quotes-private-purpose-source-and-request-data',binding_preserves)
for uid,label in [(O,'owner'),(U,'intended-consumer'),(D,'foreign-consumer'),(S,'coowner'),(M,'member')]:
 stage(label+'-consumer-access-hard-denial',lambda uid=uid:denied('SELECT public.busy_work_consumer_quote_access_v1('+q(state['bindingReceipt']['bindingId'])+');',uid=uid))
 stage(label+'-structured-response-hard-denial',lambda uid=uid:denied('SELECT public.busy_work_consumer_quote_response_v1('+','.join(map(q,[state['bindingReceipt']['bindingId'],'accept','response-key-fixture']))+');',uid=uid))
stage('anonymous-consumer-access-denied',lambda:denied('SELECT public.busy_work_consumer_quote_access_v1('+q(state['bindingReceipt']['bindingId'])+');',uid='',role='anon'))
def binding_access_no_reads():
 text=run("SELECT pg_get_functiondef(oid) FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN ('busy_work_consumer_quote_access_v1','busy_work_consumer_quote_response_v1');")
 for forbidden in ['SELECT *','business_work_quote_recipient_bindings','business_work_engagements','INSERT INTO','UPDATE public.','busy_send_mini_app_message','busy_mark_mini_app_request_link']:assert forbidden not in text,forbidden
 binding_preserves()
stage('consumer-boundary-denies-before-private-lookup-or-domain-mutation',binding_access_no_reads)
def binding_stale_quote():
 r=row(state['second']);edit(state['second'],r['revision'],'quote-after-private-binding','Later quote does not inherit recipient intent','0');v=binding_read();eq(v['eligibility'],'stale_quote_version');eq(v['recipient'],None);eq(v['binding']['bindingId'],state['bindingReceipt']['bindingId']);eq(v['consumerAccessAuthorised'],False);eq(row(state['first']),state['bindingOtherBefore'])
stage('new-quote-version-invalidates-binding-without-transfer',binding_stale_quote)
stage('rollback-retains-records-readonly-fences-and-data',rollback)
stage('rollback-denies-fresh-edit-context-without-reopening-writes',lambda:denied(f"SELECT public.busy_work_edit_context_v1('{B}','{C}','{state['second']}',{row(state['second'])['revision']});"))
stage('rollback-preserves-work-notes-and-denies-write',lambda:(eq(notes_read()['text'],'Writer A notes'),denied('SELECT public.busy_work_private_write_v1('+','.join(map(q,[B,C,state['second'],row(state['second'])['revision'],3,read(state['second'])['sourceHash'],'work_notes','Denied after rollback','notes-rollback-denied']))+');')))
stage('rollback-owner-report-data-readable-creation-and-review-denied',lambda:(eq(agreement_read(state['agreement1'])['verification'],'unverified'),denied(f"SELECT public.busy_work_agreement_review_v1('{B}','{C}','{state['second']}',{row(state['second'])['revision']});")))
stage('rollback-decision-read-preserved-review-and-mutation-denied',lambda:(eq(agreement_read(state['agreement1'])['reportState'],'withdrawn'),denied(f"SELECT public.busy_work_agreement_decision_review_v1('{B}','{C}','{state['second']}','{state['agreement1']}',{row(state['second'])['revision']});"),decision_deny([B,C,state['second'],state['agreement1'],row(state['second'])['revision'],3,state['agreementOriginal']['termsHash'],'correct','No rollback write','rollback-correction-denied'],'42501')))
stage('rollback-reference-inspection-preserved-new-review-write-denied',lambda:(eq(ref_read()['presentationState'],'prepared_not_presented'),denied(f"SELECT public.busy_work_quote_reference_review_v1('{B}','{C}','{state['second']}',{row(state['second'])['revision']});"),denied(f"SELECT public.busy_work_quote_reference_create_v1('{B}','{C}','{state['second']}',{row(state['second'])['revision']},'no','rollback-ref-denied');")))
stage('rollback-private-bindings-retained-write-context-denied-access-still-closed',lambda:(eq(binding_read(state['first'],state['bindingFirstRef'])['eligibility'],'current'),denied('SELECT public.busy_work_quote_binding_context_v1('+','.join(map(q,[B,C,state['first'],state['bindingFirstRef'],REQ,row(state['first'])['revision']]))+');'),binding_denied(binding_args(state['bindingContext']),'42501'),denied('SELECT public.busy_work_consumer_quote_access_v1('+q(state['bindingReceipt']['bindingId'])+');',uid=U)))
assert len({name for name,_ in cases})==len(cases),'Stage identities must be unique'
for i,(name,fn) in enumerate(cases):
 start=len(logs)
 try:fn();results.append({'id':name,'status':'passed','calls':logs[start:]})
 except Exception as e:
  results.append({'id':name,'status':'failed','error':str(e),'calls':logs[start:]});results.extend({'id':n,'status':'unexecuted'} for n,_ in cases[i+1:]);break
v={'candidateSha256':hashlib.sha256((root/'docs/sql-proposals/canonical-work/engagements.sql').read_bytes()).hexdigest(),'scope':'Actual disposable PostgreSQL17; fictional data and mock auth.uid, NOT hosted JWT/PostgREST','baselineReport':a.baseline_report,'baselineSummary':prior['summary'],'results':results,'summary':{k:sum(x['status']==s for x in results) for k,s in [('passed','passed'),('failed','failed'),('unexecuted','unexecuted')]},'receiptsAndIds':state,'hostedDatabaseQueries':0};v['summary']['blocked']=0;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(v,indent=2)+'\n');print(json.dumps(v['summary']));sys.exit(1 if v['summary']['failed'] else 0)
