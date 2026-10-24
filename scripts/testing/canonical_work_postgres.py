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
stage('rollback-retains-records-readonly-fences-and-data',rollback)
assert len({name for name,_ in cases})==len(cases),'Stage identities must be unique'
for i,(name,fn) in enumerate(cases):
 start=len(logs)
 try:fn();results.append({'id':name,'status':'passed','calls':logs[start:]})
 except Exception as e:
  results.append({'id':name,'status':'failed','error':str(e),'calls':logs[start:]});results.extend({'id':n,'status':'unexecuted'} for n,_ in cases[i+1:]);break
v={'candidateSha256':hashlib.sha256((root/'docs/sql-proposals/canonical-work/engagements.sql').read_bytes()).hexdigest(),'scope':'Actual disposable PostgreSQL17; fictional data and mock auth.uid, NOT hosted JWT/PostgREST','baselineReport':a.baseline_report,'baselineSummary':prior['summary'],'results':results,'summary':{k:sum(x['status']==s for x in results) for k,s in [('passed','passed'),('failed','failed'),('unexecuted','unexecuted')]},'receiptsAndIds':state,'hostedDatabaseQueries':0};v['summary']['blocked']=0;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(v,indent=2)+'\n');print(json.dumps(v['summary']));sys.exit(1 if v['summary']['failed'] else 0)
