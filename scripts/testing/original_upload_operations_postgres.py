#!/usr/bin/env python3
"""Original gateway subordinate upload operations; local PG17/private socket only."""
import pathlib,subprocess,json,time,concurrent.futures as futures
root=pathlib.Path(__file__).resolve().parents[2];out=root/'.test-artifacts/upload-operations/sql.json';out.parent.mkdir(parents=True,exist_ok=True);base=['/workspace/pg17-disposable/root/usr/lib/postgresql/17/bin/psql','-X','-h','/workspace/pg17-disposable/socket','-U','postgres','-d','busy_phase58_disposable','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','-At'];children=[];results=[]
def call(sql):
 r=subprocess.run(base,input=sql,text=True,capture_output=True,timeout=30);children.append({'exitCode':r.returncode,'output':r.stdout+r.stderr});return r
def run(sql):
 r=call(sql);assert r.returncode==0,r.stderr;return r.stdout
q=lambda s:'NULL'if s is None else "'"+str(s).replace("'","''")+"'"
B='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';O='cccccccc-cccc-4ccc-8ccc-cccccccccccc';M='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';suffix=str(time.time_ns());key='operation_'+suffix
sql=(root/'docs/sql-proposals/media/upload-operations.sql').read_text();fuse="DO $$ BEGIN RAISE EXCEPTION 'ORIGINAL UPLOAD OPERATION REVIEW FUSE: hosted approval required'; END $$;"
def invoke(action,k=key,actor=O,role='service_role',digest='a'*64):return "BEGIN;SET LOCAL ROLE "+role+";SELECT public.busy_original_upload_operation_v1("+','.join(q(v)for v in [action,B,actor,k,'selected-one',digest,25,'image/png',None,None])+');COMMIT;'
def rpc(*a,**k):return json.loads(next(s for s in run(invoke(*a,**k)).splitlines()if s.startswith('{')))
def stage(id,fn):
 try:fn();results.append({'id':id,'passed':True});print('PASS',id,flush=True)
 except Exception as e:results.append({'id':id,'passed':False,'error':str(e)});raise
def assertion(value):assert value
assert run('SHOW listen_addresses').strip()=='';assert run('SHOW data_directory').strip()=='/workspace/pg17-disposable/data'
try:
 stage('production-fuse',lambda:assertion(call(sql).returncode!=0))
 stage('install-original-subordinate-candidate',lambda:run(sql.replace(fuse,'')))
 op=rpc('begin');stage('server-minted-operation-and-path',lambda:assertion(op['state']=='pending'and op['mayUpload']and op['revision']==1 and op['plannedPath'].startswith(B+'/'+O+'/')))
 stage('duplicate-does-not-authorise-upload',lambda:assertion(rpc('begin')['operationId']==op['operationId']and not rpc('begin')['mayUpload']))
 stage('byte-key-collision',lambda:assertion('40001'in call(invoke('begin',digest='b'*64)).stderr))
 stage('foreign-owner-denied',lambda:assertion('42501'in call(invoke('inspect',actor=M)).stderr))
 for role in ['anon','authenticated']:stage(role+'-raw-rpc-denied',lambda role=role:assertion('42501'in call(invoke('inspect',role=role)).stderr))
 def concurrent():
  with futures.ThreadPoolExecutor(max_workers=2)as ex:rows=list(ex.map(lambda _:rpc('begin',k='concurrent_'+suffix),range(2)))
  assert len({r['operationId']for r in rows})==1 and sum(r['mayUpload']for r in rows)==1
 stage('actual-concurrent-operation-identity',concurrent)
 stage('pending-read-is-not-own-receipt',lambda:assertion(rpc('inspect')['notOwnReceipt']and not rpc('inspect')['ownOperationReceipt']))
 def paging():
  for i in range(33):rpc('begin',k='page_'+suffix+'_'+str(i))
  after=None;seen=[]
  while True:
   text=run("BEGIN;SET LOCAL ROLE service_role;SELECT public.busy_original_upload_operation_v1('list',"+q(B)+','+q(O)+",p_after=>"+q(after)+');COMMIT;');v=json.loads(next(s for s in text.splitlines()if s.startswith('{')));assert len(v['items'])<=20;seen.extend(r['operationId']for r in v['items']);after=v['nextAfter']
   if after is None:break
  assert len(set(seen))==len(seen)and len(seen)>=35
 stage('bounded-cursor-over-thirty-records',paging)
 def revoked():
  run("UPDATE public.busy_business_memberships SET role='member' WHERE business_id="+q(B)+' AND user_id='+q(O))
  try:assert '42501'in call(invoke('inspect')).stderr
  finally:run("UPDATE public.busy_business_memberships SET role='owner' WHERE business_id="+q(B)+' AND user_id='+q(O))
 stage('live-owner-revocation',revoked)
 stage('effective-private-permissions',lambda:assertion(run("SELECT has_table_privilege('authenticated','public.busy_original_upload_operations','SELECT') OR has_table_privilege('service_role','public.busy_original_upload_operations','UPDATE')").strip()=='f'))
 before=run('SELECT md5(string_agg(row_to_json(t)::text,\'\' ORDER BY id))FROM public.busy_original_upload_operations t')
 stage('upgrade-retains-operation-history',lambda:run(sql.replace(fuse,'')))
 stage('upgrade-identical-records',lambda:assertion(before==run('SELECT md5(string_agg(row_to_json(t)::text,\'\' ORDER BY id))FROM public.busy_original_upload_operations t')))
 # Prior local retained helper can be removed only when the active function is
 # the normal candidate, for repeatable fictional rollback verification.
 run('DROP FUNCTION IF EXISTS public.busy_original_upload_retained_impl_v1(text,uuid,uuid,text,text,text,integer,text,text,uuid)')
 rollback=(root/'docs/sql-proposals/media/upload-operations-rollback.sql').read_text();rfuse="DO $$ BEGIN RAISE EXCEPTION 'ORIGINAL UPLOAD ROLLBACK REVIEW FUSE: hosted approval required'; END $$;"
 stage('rollback-fuse',lambda:assertion(call(rollback).returncode!=0))
 stage('retaining-read-only-rollback',lambda:run(rollback.replace(rfuse,'')))
 stage('rollback-stops-writer-keeps-inspection',lambda:assertion('42501'in call(invoke('begin',k='stopped_'+suffix)).stderr and rpc('inspect')['readOnly']))
 stage('retained-implementation-not-directly-callable',lambda:assertion('42501'in call(invoke('begin').replace('busy_original_upload_operation_v1','busy_original_upload_retained_impl_v1')).stderr))
 stage('rollback-keeps-original-records',lambda:assertion(before==run('SELECT md5(string_agg(row_to_json(t)::text,\'\' ORDER BY id))FROM public.busy_original_upload_operations t')))
 stage('restore-local-candidate',lambda:run(sql.replace(fuse,'')))
finally:
 out.write_text(json.dumps({'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'summary':{'passed':sum(r['passed']for r in results),'failed':sum(not r['passed']for r in results)},'results':results,'children':children,'listenAddresses':'','socket':'/workspace/pg17-disposable/socket','syntheticTrustedServiceOnly':True},indent=2))
