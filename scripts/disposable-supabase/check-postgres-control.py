"""Offline control tests: every Docker command, socket and sleep is mocked."""
import contextlib,io,json,os,pathlib,runpy,subprocess,tempfile,unittest
from unittest.mock import patch
import postgres_control as control
ROOT=pathlib.Path(__file__).resolve().parents[2]
SHA='a'*40
def environment(directory):
 return {'GITHUB_ACTIONS':'true','RUNNER_ENVIRONMENT':'github-hosted','GITHUB_EVENT_NAME':'workflow_dispatch',
  'GITHUB_REPOSITORY':'7774cg5t75-cloud/busy-does-it-app','GITHUB_REF':'refs/heads/codex/disposable-supabase-review',
  'BUSY_DISPOSABLE_APPROVAL':'APPROVE_DISPOSABLE_TEST_ONLY','BUSY_DB_CONTROL_MODE':'postgres-control',
  'BUSY_APPROVED_SHA':SHA,'GITHUB_SHA':SHA,'GITHUB_RUN_ID':'123','GITHUB_RUN_ATTEMPT':'1',
  'RUNNER_TEMP':directory,'BUSY_DB_WORKDIR':str(pathlib.Path(directory)/control.NAME)}
def observation(published='open',direct='open',ready=True,status='running'):
 return {'status':status,'health':'healthy' if ready else 'unhealthy','exitCode':0,'oomKilled':False,
  'internalOnly':True,'configuredBindings':{'expectedPort':True,'loopbackOnly':True},
  'effectiveBindings':{'expectedPort':published=='open','loopbackOnly':published=='open'},
  'inContainerReady':ready,'runnerDirect':direct,'runnerPublished':published}
class ControlTests(unittest.TestCase):
 def test_requires_approved_source_and_rejects_remote_credentials(self):
  with tempfile.TemporaryDirectory() as directory:
   base=environment(directory)
   for key,value in [('GITHUB_SHA','b'*40),('GITHUB_EVENT_NAME','push'),('GITHUB_REF','refs/heads/main'),
                     ('RUNNER_ENVIRONMENT','self-hosted'),('BUSY_DB_CONTROL_MODE','rehearse'),
                     ('DATABASE_URL','PRIVATE'),('BUSY_DB_WORKDIR','/tmp/other')]:
    with self.subTest(key=key),patch.dict(os.environ,{**base,key:value},clear=True):
     with self.assertRaises(RuntimeError):control.preflight()
 def test_snapshot_checks_inside_direct_and_published_without_raw_data(self):
  meta={'owner':'owner','status':'running','health':'healthy','exitCode':0,'oom':False,
   'networks':{control.NETWORK:{'IPAddress':'172.19.0.2'}},
   'configured':{'5432/tcp':[{'HostIp':'127.0.0.1','HostPort':'54322'}]},
   'effective':None,'SECRET':'PRIVATE'}
  with patch.object(control,'read',side_effect=[meta,True]),patch.object(control,'command',return_value=subprocess.CompletedProcess([],0,'PRIVATE','PRIVATE')) as command,patch.object(control,'tcp_result',side_effect=['open','refused']) as tcp:
   row=control.observe('owner')
   self.assertTrue(row['inContainerReady']);self.assertEqual(row['runnerDirect'],'open')
   self.assertEqual(row['runnerPublished'],'refused');self.assertFalse(row['effectiveBindings']['expectedPort'])
   self.assertEqual(command.call_args.args[0],['docker','exec',control.NAME,'pg_isready','-U','postgres','-h','127.0.0.1','-p','5432','-t','1'])
   self.assertEqual(tcp.call_args_list[0].args,('172.19.0.2',5432))
   self.assertNotIn('PRIVATE',json.dumps(row));self.assertNotIn('172.19',json.dumps(row))
  meta['networks']['external']={}
  with patch.object(control,'read',side_effect=[meta,True]),patch.object(control,'tcp_result') as tcp:
   with self.assertRaises(RuntimeError):control.observe('owner')
   tcp.assert_not_called()
  meta['networks']={control.NETWORK:{}};meta['status']='exited'
  with patch.object(control,'read',side_effect=[meta,True]),patch.object(control,'command') as command,patch.object(control,'tcp_result',return_value='refused'):
   row=control.observe('owner')
   self.assertEqual(row['status'],'exited');self.assertFalse(row['inContainerReady']);command.assert_not_called()
 def test_lifecycle_outcomes_preserve_evidence_before_cleanup(self):
  scenarios=[('all-paths-open',[observation()],0),
   ('published-path-failed',[observation(published='refused')],1),
   ('direct-path-failed',[observation(direct='refused')],1),
   ('postgres-not-ready',[observation(),observation(ready=False,status='exited')],1),
   ('postgres-not-ready',[observation(ready=False,status='exited')],1)]
  for expected,rows,exit_code in scenarios:
   with self.subTest(expected=expected),tempfile.TemporaryDirectory() as directory:
    env=environment(directory);work=pathlib.Path(env['BUSY_DB_WORKDIR'])
    owner=SHA+':123:1';calls=[];removed=[]
    def fake(args,timeout=10):
     calls.append(args)
     output=''
     if args[0]=='git':output=SHA
     elif args[:3]==['docker','image','inspect']:
      output=json.dumps([{'Id':'sha256:'+'b'*64,'RepoDigests':[]}])
     elif args[:2]==['docker','rm'] or args[:3]==['docker','network','rm']:
      evidence=json.loads((work/'report.json').read_text())
      self.assertIn('latest',evidence['control']);removed.append(args)
     return subprocess.CompletedProcess(args,0,output,'PRIVATE')
    def read(args):
     if args[:2]==['network','inspect']:return True
     if '--format' in args:return owner
     return None
    count=[0]
    def sample(owner):
     row=rows[min(count[0],len(rows)-1)];count[0]+=1;return row
    with patch.dict(os.environ,env,clear=True),patch.object(control,'command',side_effect=fake),patch.object(control,'read',side_effect=read),patch.object(control,'observe',side_effect=sample),patch.object(control.time,'sleep'),patch.object(control.socket,'socket'),patch.object(control.secrets,'token_hex',return_value='PRIVATE'):
     self.assertEqual(control.main(),exit_code)
     report=json.loads((work/'report.json').read_text())
     self.assertEqual(report['control']['conclusion'],expected);self.assertTrue(report['control']['cleanupSucceeded'])
     self.assertEqual('firstReady' in report['control'],any(r['inContainerReady'] for r in rows))
     self.assertFalse((work/'password.env').exists());self.assertEqual(len(removed),2)
     if len(rows)>1:self.assertEqual(len(report['control']['transitions']),2)
     creates=[a for a in calls if a[:2]==['docker','create']]
     self.assertEqual(len(creates),1);create=creates[0]
     self.assertIn('127.0.0.1:54322:5432',create);self.assertIn('--read-only',create)
     self.assertIn('--cap-drop',create);self.assertIn('sha256:'+'b'*64,create)
     network=[a for a in calls if a[:3]==['docker','network','create']][0]
     self.assertIn('--internal',network);self.assertIn(control.NETWORK,create)
     self.assertEqual(create[create.index('--entrypoint')+1],'/bin/sh')
     self.assertNotIn('supabase',control.INIT);self.assertNotIn('.sql',control.INIT)
     self.assertFalse(any(a[0]=='supabase' or 'psql' in a for a in calls))
     captured=io.StringIO()
     with contextlib.redirect_stdout(captured):runpy.run_path(str(ROOT/'scripts/disposable-supabase/report.py'))
     self.assertNotIn('PRIVATE',captured.getvalue())
     self.assertEqual(json.loads(captured.getvalue())['control']['conclusion'],expected)
 def test_command_failure_still_cleans_up_and_hides_raw_errors(self):
  with tempfile.TemporaryDirectory() as directory:
   env=environment(directory);work=pathlib.Path(env['BUSY_DB_WORKDIR'])
   def command(args,timeout=10):
    if args[0]=='git':return subprocess.CompletedProcess(args,0,SHA,'')
    raise subprocess.TimeoutExpired(args,timeout,output='PRIVATE',stderr='PRIVATE')
   with patch.dict(os.environ,env,clear=True),patch.object(control,'command',side_effect=command),patch.object(control,'read',return_value=None),patch.object(control,'cleanup',return_value=False) as cleanup,patch.object(control.socket,'socket'):
    self.assertEqual(control.main(),1);cleanup.assert_called_once()
    report=json.loads((work/'report.json').read_text())
    self.assertNotIn('PRIVATE',json.dumps(report));self.assertFalse(report['control']['cleanupSucceeded'])
 def test_cleanup_cannot_remove_another_runs_resources(self):
  with patch.object(control,'read',return_value='another-run'),patch.object(control,'command') as command:
   self.assertFalse(control.cleanup('this-run'));command.assert_not_called()
 def test_control_job_has_original_gates_and_cannot_run_rehearsal(self):
  workflow=(ROOT/'.github/workflows/disposable-supabase-review.yml').read_text()
  job=workflow.split('  postgres-control:\n')[1].split('  rehearse:\n')[0]
  for gate in ["inputs.mode == 'postgres-control'","github.event_name == 'workflow_dispatch'",
    "github.repository == '7774cg5t75-cloud/busy-does-it-app'","github.event.repository.private == false",
    "inputs.approval == 'APPROVE_DISPOSABLE_TEST_ONLY'","inputs.approved_sha == github.sha",
    "vars.BUSY_DB_REHEARSAL_ENABLED == 'approved'","vars.BUSY_DB_REHEARSAL_APPROVED_SHA == github.sha",
    'environment: busy-disposable-db-review','persist-credentials: false']:
   self.assertIn(gate,job)
  self.assertNotIn('rehearse.py',job);self.assertNotIn('setup-cli',job);self.assertNotIn('secrets.',job)
  self.assertIn('default: diagnose',workflow)
if __name__=='__main__':unittest.main(verbosity=2)
