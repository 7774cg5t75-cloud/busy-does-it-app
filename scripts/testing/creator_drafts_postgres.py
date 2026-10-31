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
 def actual_upgrade():
  prior=subprocess.check_output(['git','show','7b9a64a365e4bc9b9fbc66bf5af413cff8dc340e:docs/sql-proposals/creator/private-drafts.sql'],cwd=root,text=True).replace(fuse,'')
  run(prior);before=write('upgrade-v1-'+str(time.time_ns()));run(local);after=rpc('read',[B,before['draftId'],None]);assert after['content']==content and after['revision']==1 and after['content']['schemaVersion']==1
  operation=rpc('operation',[B,before['requestKey']]);assert operation['operationId']==before['operationId'] and operation['notOwnReceipt'] is True
 stage('actual-v1-package-upgrade-retains-draft-and-operation',actual_upgrade)
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
  original=(root/'supabase/migrations/20261001173000_v3_5_social_publishing.sql').read_text();table=original[original.index('create table if not exists public.busy_social_posts ('):original.index('create index if not exists busy_social_posts_due_idx')];run(table) # Original table DDL only; no cron/extensions/provider services.
  run("ALTER TABLE public.busy_social_posts ENABLE ROW LEVEL SECURITY;REVOKE ALL ON public.busy_social_posts FROM PUBLIC,anon,authenticated;INSERT INTO public.busy_social_posts(client_draft_id,caption,status)VALUES('historical-published','Original wording','Published'),('historical-scheduled','Original scheduled words','Scheduled')ON CONFLICT(workspace_key,client_draft_id)DO NOTHING")
  before=run('SELECT md5(row_to_json(p)::text) FROM public.busy_social_posts p ORDER BY id')
  for id in ['historical-published','historical-scheduled']:deny('write',[B,id,0,json.dumps(content),None,None,None,'queue_'+id],'42501')
  assert before==run('SELECT md5(row_to_json(p)::text) FROM public.busy_social_posts p ORDER BY id')
 stage('published-scheduled-identity-denial',queue)
 def revocation():
  run(f"DELETE FROM public.busy_business_memberships WHERE business_id='{B}' AND user_id='{O}'");deny('list',[B,None,None,10],'42501');run(f"INSERT INTO public.busy_business_memberships(business_id,user_id,role)VALUES('{B}','{O}','owner')")
 stage('live-owner-revocation',revocation)

 def media():
  import hashlib,base64,struct,zlib
  # Minimal local Storage/auth fixtures, not a running Supabase Storage service.
  run("CREATE SCHEMA IF NOT EXISTS storage;CREATE TABLE IF NOT EXISTS auth.users(id uuid PRIMARY KEY);CREATE TABLE IF NOT EXISTS storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);CREATE TABLE IF NOT EXISTS storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text,name text,UNIQUE(bucket_id,name));INSERT INTO auth.users(id)VALUES('"+O+"'),('"+M+"')ON CONFLICT DO NOTHING")
  run((root/'supabase/migrations/20261011000000_busy_website_original_media.sql').read_text())
  image=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=')
  def chunk(tag,data):return struct.pack('>I',len(data))+tag+data+struct.pack('>I',zlib.crc32(tag+data)&0xffffffff)
  image2=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',1,1,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(b'\0\xff\0\0'))+chunk(b'IEND',b'')
  digest=hashlib.sha256(image).hexdigest();digest2=hashlib.sha256(image2).hexdigest();ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333'];paths=[]
  for i,asset in enumerate(ids):
   owner=M if i==2 else O;path=B+'/'+owner+'/'+asset+'.png';paths.append(path)
   run('INSERT INTO public.busy_website_original_media(id,business_id,uploaded_by,storage_path,content_type,byte_length,sha256)VALUES('+','.join(q(x)for x in [asset,B,owner,path,'image/png',len(image2) if i==1 else len(image),digest if i==0 else digest2 if i==1 else 'c'*64])+')ON CONFLICT(id)DO UPDATE SET storage_path=excluded.storage_path,sha256=excluded.sha256,byte_length=excluded.byte_length,uploaded_by=excluded.uploaded_by;INSERT INTO storage.objects(bucket_id,name)VALUES('+q('busy-website-originals')+','+q(path)+')ON CONFLICT DO NOTHING')
  refs=[{'kind':'website_original','assetId':asset,'sha256':digest if i==0 else digest2,'id':'selected-'+str(i),'width':1,'height':1,'fileName':'approved-'+str(i)+'.png','privateUseReviewed':True} for i,asset in enumerate(ids[:2])]
  fixture=out.with_name('media-assets.json');fixture.write_text(json.dumps({ids[0]:{'base64':base64.b64encode(image).decode(),'sha256':digest},ids[1]:{'base64':base64.b64encode(image2).decode(),'sha256':digest2}},indent=2))
  body={**content,'schemaVersion':2,'media':refs,'editor':{'captions':[{'id':'alternative','text':'  Exact caption\n'}],'selectedCaptionId':'alternative','privacyWarnings':['Owner review remains required'],'story':None}}
  own=write('media-private',body=body);opened=rpc('read',[B,'media-private',None]);assert opened['content']==body and [x['assetId']for x in opened['mediaProjection']]==ids[:2];assert all(x['state']=='eligible'for x in opened['mediaProjection'])
  deny('write',[B,'foreign-media',0,json.dumps({**body,'media':[{**refs[0],'assetId':ids[2],'sha256':'c'*64}]}),None,None,None,'foreign_media_request'],'42501')
  deny('write',[B,'unreviewed-media',0,json.dumps({**body,'media':[{**refs[0],'privateUseReviewed':False}]}),None,None,None,'unreviewed_media'],'22023')
  deny('write',[B,'url-media',0,json.dumps({**body,'media':[{'uri':'https://unowned.invalid/a.png'}]}),None,None,None,'url_media_request'],'22023')
  run("DELETE FROM storage.objects WHERE name="+q(paths[0]));missing=rpc('read',[B,'media-private',None]);assert missing['content']==body and missing['mediaProjection'][0]['state']=='unavailable' and 'storagePath'not in missing['mediaProjection'][0]
  deny('write',[B,'media-private',1,json.dumps(body),None,None,None,'missing_media_edit'],'42501');assert rpc('read',[B,'media-private',None])['revision']==1
  run("INSERT INTO storage.objects(bucket_id,name)VALUES('busy-website-originals',"+q(paths[0])+")")
  reversed_body={**body,'media':list(reversed(refs)),'text':'Owner revision with reordered images'};updated=write('media-private',1,reversed_body);assert rpc('read',[B,'media-private',None])['content']==reversed_body and rpc('read',[B,'media-private',1])['content']==body
  deny('write',[B,'media-private',2,json.dumps(content),None,None,None,'old_serializer_media_loss'],'22023')
  run('UPDATE public.busy_website_original_media SET uploaded_by='+q(M)+' WHERE id='+q(ids[0]));assert rpc('read',[B,'media-private',None])['mediaProjection'][1]['state']=='unavailable';run('UPDATE public.busy_website_original_media SET uploaded_by='+q(O)+' WHERE id='+q(ids[0]))
  # Upgrade the genuine preceding schema-v2 package without rewriting its rows.
  prior_v2=subprocess.check_output(['git','show','f408c2a2a766da1fb3cb19f203e2193fd670c1d0:docs/sql-proposals/creator/private-drafts.sql'],cwd=root,text=True).replace(fuse,'')
  run(prior_v2);v2copy=write('v2-upgrade-original',body=body);run(local)
  assert rpc('read',[B,'v2-upgrade-original',1])['content']==body and rpc('operation',[B,v2copy['requestKey']])['operationId']==v2copy['operationId']
  results.append({'id':'actual-v2-package-upgrade-retains-media-and-operation','passed':True})
  rich={**body,'schemaVersion':3,'editor':{**body['editor'],'summary':'Original analysis, not verified','detectedService':'Garden care','proposedScheduleDate':'2026-11-05','proposedScheduleTime':'09:30','story':{'type':'before_after','confidence':'Medium','beforeImageId':refs[0]['id'],'afterImageId':refs[1]['id'],'reason':'Owner must review proposed pairing'},'captions':[{'id':'rich-'+str(n),'label':'Option '+str(n),'tone':'Informative','text':'  Exact wording '+str(n)+'\n','recommendedChannels':['Instagram'],'reason':'Original reason '+str(n)} for n in range(3)],'selectedCaptionId':'rich-1'}}
  bad_date={**rich,'editor':{**rich['editor'],'proposedScheduleDate':'2026-02-30'}};deny('write',[B,'rich-v3-bad-date',0,json.dumps(bad_date),None,None,None,'v3_bad_date'],'22023')
  saved=write('rich-v3-original',body=rich);assert rpc('read',[B,'rich-v3-original',None])['content']==rich
  for version,older in [(1,content),(2,body)]:deny('write',[B,'rich-v3-original',1,json.dumps(older),None,None,None,'v3_downgrade_'+str(version)],'22023')
  bad={**rich,'editor':{**rich['editor'],'story':{**rich['editor']['story'],'beforeImageId':'foreign-id'}}};deny('write',[B,'rich-v3-original',1,json.dumps(bad),None,None,None,'v3_wrong_story'],'22023')
  bad={**rich,'editor':{**rich['editor'],'captions':[{**rich['editor']['captions'][0],'unknown':True}]}};deny('write',[B,'rich-v3-original',1,json.dumps(bad),None,None,None,'v3_unknown_caption'],'22023')
  assert rpc('read',[B,'rich-v3-original',None])['revision']==1 and rpc('read',[B,'media-private',1])['content']==body
  results.append({'id':'rich-caption-story-fidelity-and-older-client-denial','passed':True})
  assert rpc('read',[B,first['draftId'],1])['content']['schemaVersion']==1
 stage('owned-media-order-caption-history-and-revocation',media)
 stage('upgrade-retains-original-revision-history',lambda:run(local))
 stage('legacy-snapshot-unchanged',lambda: (_ for _ in ()).throw(AssertionError()) if run('SELECT md5(payload::text) FROM public.busy_business_snapshots ORDER BY business_id')!=old else None)
 rollback=(root/'docs/sql-proposals/creator/rollback-readonly.sql').read_text().replace("DO $$ BEGIN RAISE EXCEPTION 'CREATOR ROLLBACK FUSE: separate hosted approval required'; END $$;",'')
 stage('retaining-rollback',lambda:run(rollback));stage('rollback-denies-write',lambda:deny('write',[B,'after-rollback',0,json.dumps(content),None,None,None,'after_rollback'],'42501'));stage('rollback-retains-exact-read',lambda:rpc('read',[B,second['draftId'],1]));run(local)
finally:
 out.write_text(json.dumps({'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'unixSocket':socket,'listenAddresses':'','summary':{'passed':sum(x['passed']for x in results),'failed':sum(not x['passed']for x in results)},'results':results,'children':logs,'syntheticUidOnly':True},indent=2)+'\n')
print(json.dumps({'passed':len(results),'failed':0}))
