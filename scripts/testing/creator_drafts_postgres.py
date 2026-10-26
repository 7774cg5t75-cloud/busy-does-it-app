#!/usr/bin/env python3
"""Private Creator continuation candidate: PG17, private socket, no TCP."""
import argparse,pathlib,subprocess,json,time
import concurrent.futures as futures
p=argparse.ArgumentParser();p.add_argument('--output',required=True);a=p.parse_args();root=pathlib.Path(__file__).resolve().parents[2];out=pathlib.Path(a.output);out.parent.mkdir(parents=True,exist_ok=True)
bin='/workspace/pg17-disposable/root/usr/lib/postgresql/17/bin';socket='/workspace/pg17-disposable/socket';base=[bin+'/psql','-X','-h',socket,'-U','postgres','-d','busy_phase58_disposable','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','-At'];logs=[];results=[]
def call(sql):
 r=subprocess.run(base,input=sql,text=True,capture_output=True,timeout=30);logs.append({'exitCode':r.returncode,'output':r.stdout+r.stderr});return r
def run(sql):
 r=call(sql);assert r.returncode==0,r.stderr;return r.stdout
assert run('SHOW listen_addresses').strip()==''
assert run('SHOW data_directory').strip()=='/workspace/pg17-disposable/data'
def q(v):return 'NULL' if v is None else "'"+str(v).replace("'","''")+"'"
B='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';O='cccccccc-cccc-4ccc-8ccc-cccccccccccc';M='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
def auth(sql,actor=O):return 'BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='+q(actor)+';'+sql+'COMMIT;'
def rpc(name,args,actor=O):return json.loads(next(s for s in run(auth('SELECT public.busy_creator_draft_'+name+'_v1('+','.join(q(v) for v in args)+');',actor)).splitlines()if s.startswith('{')))
def deny(name,args,code,actor=O):
 r=call(auth('SELECT public.busy_creator_draft_'+name+'_v1('+','.join(q(v) for v in args)+');',actor));assert r.returncode!=0 and code in r.stderr,r.stdout+r.stderr
content={'schemaVersion':1,'brief':'Exact owner brief','text':'Exact owner wording\nNot sent','format':'newsletter','treatment':'standard','channels':['Facebook'],'media':[],'brandFingerprint':'owner-reviewed-fixture','ownerFacts':'Original owner-reported words','preparedCopy':'Original prepared copy'}
def write(id='original-draft-one',rev=0,body=None,key=None,source=(None,None,None)):return rpc('write',[B,id,rev,json.dumps(body or content),*source,key or 'creator_'+str(time.time_ns())])
def stage(name,fn):
 try:fn();results.append({'id':name,'passed':True})
 except Exception as e:results.append({'id':name,'passed':False,'error':str(e)});raise
sql=(root/'docs/sql-proposals/creator/private-drafts.sql').read_text();fuse="DO $$ BEGIN RAISE EXCEPTION 'CREATOR PRIVATE DRAFT REVIEW FUSE: separate hosted approval required'; END $$;";local=sql.replace(fuse,'')
try:
 stage('production-fuse',lambda: (_ for _ in ()).throw(AssertionError('Fuse did not abort')) if call(sql).returncode==0 else None)
 g=(root/'docs/sql-proposals/growth/opportunities.sql').read_text().replace("DO $$ BEGIN RAISE EXCEPTION 'GROWTH OPPORTUNITY REVIEW FUSE: separate hosted approval required'; END $$;",'');run(g)
 stage('install-private-creator-candidate',lambda:run(local))
 run('TRUNCATE public.busy_creator_draft_versions,public.busy_creator_draft_heads') # disposable new-purpose fixtures only
 old=run('SELECT md5(payload::text) FROM public.busy_business_snapshots ORDER BY business_id')
 first=write();stage('server-operation-and-exact-read',lambda: (_ for _ in ()).throw(AssertionError()) if not first['ownOperationReceipt'] or rpc('read',[B,first['draftId'],None])['content']!=content else None)
 second=write('original-draft-two');v=write(rev=1,body={**content,'text':'Corrected private words'})
 stage('immutable-history-and-independent-draft',lambda: (_ for _ in ()).throw(AssertionError()) if rpc('read',[B,first['draftId'],1])['content']!=content or rpc('read',[B,second['draftId'],None])['revision']!=1 else None)
 stage('stale-revision-denial',lambda:deny('write',[B,first['draftId'],1,json.dumps(content),None,None,None,'stale_request'],'40001'))
 stage('duplicate-request-denial',lambda:deny('write',[B,'another-original-id',0,json.dumps(content),None,None,None,v['requestKey']],'40001'))
 stage('member-denial',lambda:deny('read',[B,first['draftId'],None],'42501',M))
 def roles():
  for role in ['admin','owner']:
   r=call('BEGIN;UPDATE public.busy_business_memberships SET role='+q(role)+' WHERE business_id='+q(B)+' AND user_id='+q(M)+';SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='+q(M)+';SELECT public.busy_creator_draft_read_v1('+q(B)+','+q(first['draftId'])+',NULL);COMMIT;');assert r.returncode!=0 and '42501' in r.stderr and 'UPDATE 1' in r.stdout
 stage('admin-and-coowner-denied',roles)
 def anonymous():
  r=call('BEGIN;SET LOCAL ROLE anon;SELECT public.busy_creator_draft_list_v1('+q(B)+',NULL,NULL,10);COMMIT;');assert r.returncode!=0 and '42501' in r.stderr
 stage('anonymous-denied',anonymous)
 stage('foreign-tenant-denial',lambda:deny('read',['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',first['draftId'],None],'42501'))
 stage('empty-content-denial',lambda:deny('write',[B,'bad-empty',0,'{}',None,None,None,'bad_empty_content'],'22023'))
 stage('null-format-denial',lambda:deny('write',[B,'bad-null',0,json.dumps({**content,'format':None}),None,None,None,'bad_null_content'],'22023'))
 stage('arbitrary-json-denial',lambda:deny('write',[B,'bad-json',0,json.dumps({**content,'customerSnapshot':{}}),None,None,None,'bad_content'],'22023'))
 stage('unsupported-media-denial',lambda:deny('write',[B,'bad-media',0,json.dumps({**content,'media':[{'uri':'https://foreign.invalid/private.jpg'}]}),None,None,None,'bad_media_request'],'22023'))
 for i in range(45):write('page-'+str(i).zfill(3))
 def pages():
  seen=[];after=None
  while True:
   page=rpc('list',[B,None,after,7]);seen.extend(x['draftId'] for x in page['items']);after=page['nextAfter']
   if not after:break
  assert len(seen)==len(set(seen))==47
 stage('cursor-discovery-over-thirty',pages)
 stage('independent-operation-observation',lambda: (_ for _ in ()).throw(AssertionError()) if rpc('operation',[B,v['requestKey']])['notOwnReceipt'] is not True else None)
 def concurrent():
  def attempt(n):return call(auth('SELECT public.busy_creator_draft_write_v1('+','.join(q(x)for x in [B,first['draftId'],2,json.dumps({**content,'text':'Writer '+str(n)}),None,None,None,'concurrent_'+str(n)])+');'))
  with futures.ThreadPoolExecutor() as pool:r=list(pool.map(attempt,[1,2]))
  assert sorted(x.returncode==0 for x in r)==[False,True];assert any('40001'in x.stderr for x in r)
 stage('actual-competing-cas',concurrent)
 def raw():
  for table in ['busy_creator_draft_heads','busy_creator_draft_versions']:assert call(auth('SELECT * FROM public.'+table)).returncode!=0
 stage('raw-tables-denied',raw)
 def hostile():
  r=call('BEGIN;ALTER SCHEMA busy_creator_private RENAME TO busy_creator_saved;CREATE SCHEMA busy_creator_private AUTHORIZATION authenticated;'+local);assert r.returncode!=0 and '42501' in r.stderr
 stage('hostile-schema-adoption-denied',hostile)
 def inherited():
  r=call('BEGIN;CREATE ROLE creator_privilege_fixture;GRANT SELECT ON public.busy_creator_draft_versions TO creator_privilege_fixture;GRANT creator_privilege_fixture TO authenticated;'+local);assert r.returncode!=0 and '42501' in r.stderr
 stage('inherited-raw-privilege-upgrade-denial',inherited)
 def queue():
  exists=run("SELECT to_regclass('public.busy_social_posts') IS NOT NULL").strip()=='t'
  if exists:return # Real original table may exist; never replace its schema.
  run('CREATE TABLE public.busy_social_posts(client_draft_id text,status text);INSERT INTO public.busy_social_posts VALUES(\'historical-published\',\'Published\'),(\'historical-scheduled\',\'Scheduled\')')
  for id in ['historical-published','historical-scheduled']:deny('write',[B,id,0,json.dumps(content),None,None,None,'queue_'+id],'42501')
  assert run('SELECT count(*) FROM public.busy_social_posts').strip()=='2';run('DROP TABLE public.busy_social_posts') # fictional identity-only fixture, not original deployment schema
 stage('published-scheduled-identity-denial',queue)
 def revocation():
  run(f"DELETE FROM public.busy_business_memberships WHERE business_id='{B}' AND user_id='{O}'");deny('list',[B,None,None,10],'42501');run(f"INSERT INTO public.busy_business_memberships(business_id,user_id,role)VALUES('{B}','{O}','owner')")
 stage('live-owner-revocation',revocation)
 stage('upgrade-retains-original-revision-history',lambda:run(local))
 stage('legacy-snapshot-unchanged',lambda: (_ for _ in ()).throw(AssertionError()) if run('SELECT md5(payload::text) FROM public.busy_business_snapshots ORDER BY business_id')!=old else None)
 rollback=(root/'docs/sql-proposals/creator/rollback-readonly.sql').read_text().replace("DO $$ BEGIN RAISE EXCEPTION 'CREATOR ROLLBACK FUSE: separate hosted approval required'; END $$;",'')
 stage('retaining-rollback',lambda:run(rollback));stage('rollback-denies-write',lambda:deny('write',[B,'after-rollback',0,json.dumps(content),None,None,None,'after_rollback'],'42501'));stage('rollback-retains-exact-read',lambda:rpc('read',[B,second['draftId'],1]));run(local)
finally:
 out.write_text(json.dumps({'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'unixSocket':socket,'listenAddresses':'','summary':{'passed':sum(x['passed']for x in results),'failed':sum(not x['passed']for x in results)},'results':results,'children':logs,'syntheticUidOnly':True},indent=2)+'\n')
print(json.dumps({'passed':len(results),'failed':0}))
