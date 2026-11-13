#!/usr/bin/env python3
"""Fictional PG17, original isolated baseline and finite Growth authority. No TCP."""
import argparse,subprocess,pathlib,json,sys,time,hashlib
p=argparse.ArgumentParser()
for n in ['bin-dir','socket','original-functions','output']:p.add_argument('--'+n,required=True)
a=p.parse_args();root=pathlib.Path(__file__).resolve().parents[2];out=pathlib.Path(a.output).resolve();out.parent.mkdir(parents=True,exist_ok=True)
assert pathlib.Path(a.socket).is_absolute() and a.socket.startswith(('/workspace/','/tmp/'))
base=[str(pathlib.Path(a.bin_dir)/'psql'),'-X','-h',a.socket,'-U','postgres','-d','busy_phase58_disposable','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','-At']
def call(sql):return subprocess.run(base,input=sql,text=True,capture_output=True,timeout=20)
assert call('SHOW listen_addresses').stdout.strip()==''
assert pathlib.Path(call('SHOW data_directory').stdout.strip()).resolve()==(pathlib.Path(a.socket).parent/'data').resolve()
baseline=out.with_name(out.stem+'-baseline.json')
r=subprocess.run([sys.executable,str(root/'scripts/testing/phase66_postgres.py'),'--bin-dir',a.bin_dir,'--socket',a.socket,'--original-functions',a.original_functions,'--output',str(baseline),'--allow-disposable-reset'],capture_output=True,text=True)
assert r.returncode==0,r.stdout[-2000:]+r.stderr[-2000:]
assert json.loads(baseline.read_text())['summary']=={'passed':262,'failed':0,'blocked':0,'unexecuted':0}
B='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';O='cccccccc-cccc-4ccc-8ccc-cccccccccccc';M='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';D='dddddddd-dddd-4ddd-8ddd-dddddddddddd'
results=[];logs=[]
def q(v):return 'NULL' if v is None else "'"+str(v).replace("'","''")+"'"
def auth(sql,actor=O):return 'BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='+q(actor)+';'+sql+'COMMIT;'
def run(sql):
 r=call(sql);logs.append({'exitCode':r.returncode,'output':r.stdout+r.stderr});assert r.returncode==0,r.stderr;return r.stdout
def rpc(name,args,actor=O):return json.loads(next(s for s in run(auth('SELECT public.busy_growth_opportunity_'+name+'_v1('+','.join(q(x)for x in args)+');',actor)).splitlines()if s.startswith('{')))
def deny(name,args,actor=M,code='42501'):
 r=call(auth('SELECT public.busy_growth_opportunity_'+name+'_v1('+','.join(q(x)for x in args)+');',actor));logs.append({'exitCode':r.returncode,'output':r.stdout+r.stderr});assert r.returncode!=0 and code in r.stderr,r.stdout+r.stderr
record={'title':'Owner-reported garden opportunity','description':'Heard about possible work; not independently verified.','source':'Owner reports a conversation','serviceId':'garden','permission':'permitted'}
state={}
def write(action,body=None,op=None,feedback=None,reason=None,expected=None):
 v=state.get('v');return rpc('write',[B,None if action=='create' else v['opportunityId'],0 if action=='create' else expected if expected is not None else v['revision'],None if action=='create' else v['sourceHash'],action,None if body is None else json.dumps(body),feedback,reason,op or 'operation_'+str(time.time_ns())])
def stage(name,fn):
 try:fn();results.append({'id':name,'passed':True,'exitCode':0})
 except Exception as e:results.append({'id':name,'passed':False,'error':str(e)});raise
sql=(root/'docs/sql-proposals/growth/opportunities.sql').read_text();fuse="DO $$ BEGIN RAISE EXCEPTION 'GROWTH OPPORTUNITY REVIEW FUSE: separate hosted approval required'; END $$;"
try:
 stage('production-fuse',lambda: (lambda r: (_ for _ in ()).throw(AssertionError(r.stdout+r.stderr)) if r.returncode==0 else None)(call(sql)))
 local=sql.replace(fuse,'')
 def hostile_schema():
  run('CREATE SCHEMA busy_growth_private AUTHORIZATION authenticated;')
  r=call(local);assert r.returncode!=0 and '42501' in r.stderr
  logs.append({'exitCode':r.returncode,'output':r.stdout+r.stderr});run('DROP SCHEMA busy_growth_private;')
 stage('hostile-schema-adoption-denied',hostile_schema)
 def hostile_table():
  run('CREATE TABLE public.busy_growth_opportunities(id uuid);ALTER TABLE public.busy_growth_opportunities OWNER TO authenticated;')
  r=call(local);assert r.returncode!=0 and '42501' in r.stderr
  logs.append({'exitCode':r.returncode,'output':r.stdout+r.stderr});run('DROP TABLE public.busy_growth_opportunities;')
 stage('hostile-table-adoption-denied',hostile_table)
 stage('load-finite-growth',lambda:run(local))
 stage('fictional-original-creator-fixture',lambda:run(f"UPDATE public.busy_businesses SET created_by='{O}' WHERE id='{B}' AND created_by IS NULL"))
 state['legacy']=run('SELECT md5(payload::text) FROM public.busy_business_snapshots ORDER BY business_id')
 def create():
  v=write('create',record,op='create_first');assert v['ownOperationReceipt'] and v['revision']==1 and v['provenance']=='owner_reported' and v['executionAuthorised']==False;state['v']=v
 stage('create-server-id-private-report',create)
 def recovery():
  v=rpc('operation',[B,'create_first']);assert v['found'] and v['notOwnReceipt'] and v['operationObserved'] and v['opportunityId']==state['v']['opportunityId'] and 'ownOperationReceipt' not in v
  assert rpc('operation',[B,'not_committed_yet'])['found']==False
 stage('exact-independent-operation-recovery',recovery)
 stage('foreign-operation-read-denied',lambda:deny('operation',[B,'create_first'],D))
 stage('independent-read-not-own-receipt',lambda: (lambda v: (v['notOwnReceipt'] is True and 'operationId' not in v)or (_ for _ in ()).throw(AssertionError(v)))(rpc('read',[B,state['v']['opportunityId'],None])))
 def second():state['second']=write('create',{**record,'title':'Independent second opportunity'},op='create_second');assert state['second']['opportunityId']!=state['v']['opportunityId']
 stage('two-independent-opportunities',second)
 stage('bounded-list',lambda: (lambda v: len(v['items'])==1 and v['nextAfter'] or (_ for _ in ()).throw(AssertionError(v)))(rpc('list',[B,None,1])))
 for actor in [M,D,'']:
  stage('private-read-denied-'+str(actor),lambda actor=actor:deny('read',[B,state['v']['opportunityId'],None],actor))
 def admin():
  run(f"UPDATE public.busy_business_memberships SET role='admin' WHERE business_id='{B}' AND user_id='{M}'");deny('read',[B,state['v']['opportunityId'],None],M)
 stage('admin-denied',admin)
 def coowner():
  run(f"UPDATE public.busy_business_memberships SET role='owner' WHERE business_id='{B}' AND user_id='{M}'");deny('read',[B,state['v']['opportunityId'],None],M)
 stage('coowner-denied',coowner)
 def revisited():state['v']=write('reinspect');assert state['v']['reviewedSourceHash']==state['v']['sourceHash']
 stage('explicit-owner-source-reattestation',revisited)
 def feedback():state['v']=write('feedback',feedback='useful',reason='Relevant work type');assert state['v']['feedback']=='useful'
 stage('durable-purpose-feedback',feedback)
 def edit():
  old=state['v'];state['v']=write('edit',{**record,'description':'Corrected owner report\nExact wording retained'});assert state['v']['feedback']=='clear' and state['v']['reviewedSourceHash'] is None
  historical=rpc('read',[B,old['opportunityId'],old['revision']]);assert historical['historical'] and historical['feedback']=='useful'
 stage('append-correction-preserve-history-invalidate-feedback',edit)
 stage('stale-cas-denied',lambda:deny('write',[B,state['v']['opportunityId'],1,state['v']['sourceHash'],'retire',None,None,None,'stale_operation'],O,'40001'))
 stage('forged-field-denied',lambda:deny('write',[B,None,0,None,'create',json.dumps({**record,'verified':True}),None,None,'forged_operation'],O,'22023'))
 stage('duplicate-operation-denied',lambda:deny('write',[B,None,0,None,'create',json.dumps(record),None,None,'create_first'],O,'40001'))
 stage('unreviewed-feedback-denied',lambda:deny('write',[B,state['v']['opportunityId'],state['v']['revision'],state['v']['sourceHash'],'feedback',None,'useful','','feedback_stale'],O,'40001'))
 def retire():state['v']=write('retire');assert state['v']['state']=='retired'
 stage('retire-without-deletion',retire)
 stage('retired-review-denied',lambda:deny('write',[B,state['v']['opportunityId'],state['v']['revision'],state['v']['sourceHash'],'reinspect',None,None,None,'retired_review'],O,'40001'))
 def reopen():state['v']=write('reopen');assert state['v']['reviewedSourceHash'] is None
 stage('deliberate-reopen-needs-new-review',reopen)
 def raw():
  for table in ['busy_growth_opportunities','busy_growth_opportunity_versions']:
   r=call(auth('SELECT * FROM public.'+table+';'));assert r.returncode!=0 and '42501'in r.stderr
 stage('raw-private-data-denied',raw)
 stage('upgrade-retains-exact-history',lambda:run(local))
 def preserved():assert rpc('read',[B,state['second']['opportunityId'],None])['record']['title']=='Independent second opportunity'
 stage('independent-second-preserved',preserved)
 def revoked():
  run(f"DELETE FROM public.busy_business_memberships WHERE business_id='{B}' AND user_id='{O}'");deny('read',[B,state['v']['opportunityId'],None],O);run(f"INSERT INTO public.busy_business_memberships(business_id,user_id,role)VALUES('{B}','{O}','owner')")
 stage('live-revocation',revoked)
 def race():
  v=state['v'];args=[B,v['opportunityId'],v['revision'],v['sourceHash'],'reinspect',None,None,None,'race_holder']
  statement='SELECT public.busy_growth_opportunity_write_v1('+','.join(q(x)for x in args)+');'
  holder=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
  holder.stdin.write(auth(statement+'SELECT pg_sleep(0.6);'));holder.stdin.close();time.sleep(.15)
  args[-1]='race_contender';other=call(auth('SELECT public.busy_growth_opportunity_write_v1('+','.join(q(x)for x in args)+');'))
  holder.wait(timeout=10);stdout=holder.stdout.read();stderr=holder.stderr.read();assert holder.returncode==0 and other.returncode!=0 and '40001'in other.stderr,(stdout,stderr,other.stdout,other.stderr)
  logs.extend([{'exitCode':holder.returncode,'output':stdout+stderr},{'exitCode':other.returncode,'output':other.stdout+other.stderr}]);state['v']=rpc('read',[B,v['opportunityId'],None]);assert state['v']['revision']==v['revision']+1
 stage('actual-concurrent-cas-one-winner',race)
 stage('legacy-snapshot-unchanged',lambda: None if run('SELECT md5(payload::text) FROM public.busy_business_snapshots ORDER BY business_id')==state['legacy'] else (_ for _ in ()).throw(AssertionError('Legacy changed')))
 def effective():
  for role in ['anon','authenticated','service_role']:
   v=run("SELECT has_table_privilege('"+role+"','public.busy_growth_opportunity_versions','SELECT') OR has_table_privilege('"+role+"','public.busy_growth_opportunities','UPDATE');");assert v.strip()=='f'
  assert run("SELECT has_function_privilege('anon','public.busy_growth_opportunity_read_v1(uuid,uuid,bigint)','EXECUTE')").strip()=='f'
 stage('effective-raw-and-anonymous-privileges',effective)
 rollback=(root/'docs/sql-proposals/growth/rollback-readonly.sql').read_text().replace("DO $$ BEGIN RAISE EXCEPTION 'GROWTH ROLLBACK FUSE: separate hosted approval required'; END $$;",'')
 stage('retaining-readonly-rollback',lambda:run(rollback))
 stage('rollback-denies-new-writes',lambda:deny('write',[B,None,0,None,'create',json.dumps(record),None,None,'after_rollback'],O))
 stage('rollback-keeps-private-owner-read',preserved)
finally:
 out.write_text(json.dumps({'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'listenAddresses':'','unixSocket':a.socket,'baselineReport':str(baseline),'summary':{'passed':sum(x['passed']for x in results),'failed':sum(not x['passed']for x in results)},'results':results,'children':logs,'syntheticAuthOnly':True},indent=2)+'\n')
print(json.dumps({'passed':len(results),'failed':0}))
