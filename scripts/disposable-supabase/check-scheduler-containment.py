"""Offline scheduler containment tests: never runs Docker, psql or SQL."""
import contextlib,io,json,os,pathlib,runpy,subprocess,tempfile,unittest
from unittest.mock import patch
import rehearse as harness
ROOT=pathlib.Path(__file__).resolve().parents[2]
class SchedulerTests(unittest.TestCase):
 def test_fixed_administrative_scope_and_sqlstate_only_output(self):
  for operation,text in harness.SCHEDULER_SQL.items():
   args,sql=harness.scheduler_command(operation)
   self.assertEqual(sql,text)
   self.assertEqual(args[:4],['docker','exec','-i',harness.DB])
   self.assertEqual(args[args.index('-U')+1],'supabase_admin')
   self.assertIn('ON_ERROR_STOP=1',args);self.assertIn('VERBOSITY=sqlstate',args)
   self.assertNotIn('grant ',sql.lower());self.assertNotIn('alter role',sql.lower())
  with self.assertRaises(KeyError):harness.scheduler_command('arbitrary-sql')
  self.assertEqual(harness.safe_sqlstate('ERROR:  42501\nDETAIL: PRIVATE'), '42501')
  self.assertEqual(harness.safe_sqlstate(b'psql:<stdin>:1: ERROR:  58P01\nPRIVATE'), '58P01')
  for text in ('ERROR: PRIVATE token','ERROR: 42501 extra PRIVATE','DETAIL: 42501','PRIVATE'):
   self.assertIsNone(harness.safe_sqlstate(text))
 def test_order_and_bounded_asynchronous_reload(self):
  calls=[];values=iter(['on','on','off'])
  def execute(operation):
   calls.append(operation)
   if operation=='scheduler-verify-disabled':return next(values)
   return 't'
  with patch.object(harness.time,'sleep') as sleep:harness.contain_scheduler(execute)
  self.assertEqual(calls[:4],['scheduler-check-admin','scheduler-create-extension','scheduler-disable-jobs','scheduler-reload-config'])
  self.assertEqual(calls[4:],['scheduler-verify-disabled']*3)
  self.assertEqual(sleep.call_count,2)
 def test_never_proceeds_when_admin_reload_or_disabled_verification_fails(self):
  for failure in ('scheduler-check-admin','scheduler-reload-config','scheduler-verify-disabled'):
   calls=[]
   def execute(operation):
    calls.append(operation)
    return ('on' if failure=='scheduler-verify-disabled' else 'f') if operation==failure else 't'
   with self.subTest(failure=failure),patch.object(harness.time,'sleep'),self.assertRaises(RuntimeError):
    harness.contain_scheduler(execute)
   if failure=='scheduler-check-admin':self.assertEqual(calls,['scheduler-check-admin'])
   if failure=='scheduler-reload-config':self.assertNotIn('scheduler-verify-disabled',calls)
   if failure=='scheduler-verify-disabled':self.assertEqual(calls.count('scheduler-verify-disabled'),10)
 def test_every_sql_failure_has_exact_operation_and_safe_state_and_stops(self):
  for failing in harness.SCHEDULER_SQL:
   with self.subTest(failing=failing),tempfile.TemporaryDirectory() as directory:
    work=pathlib.Path(directory)/'fresh';sha='a'*40
    env={'GITHUB_ACTIONS':'true','RUNNER_ENVIRONMENT':'github-hosted',
     'GITHUB_REPOSITORY':'7774cg5t75-cloud/busy-does-it-app',
     'BUSY_DISPOSABLE_APPROVAL':'APPROVE_DISPOSABLE_TEST_ONLY','BUSY_APPROVED_SHA':sha,
     'GITHUB_SHA':sha,'RUNNER_TEMP':directory,'BUSY_DB_WORKDIR':str(work)}
    operations=[];calls=[]
    def fake(args,**kwargs):
     calls.append(args);output=''
     if args[0]=='git':output=sha
     elif args==['supabase','--version']:output='2.54.11'
     elif args==['docker','network','inspect',harness.NETWORK]:
      output=json.dumps([{'Internal':True,'Id':'network-id','Containers':{'db-id':{}}}])
     elif args==['docker','inspect','db-id']:
      output=json.dumps([{'NetworkSettings':{'Networks':{harness.NETWORK:{}}},'Image':'image-id','Name':'db'}])
     elif args[:3]==['docker','image','inspect']:output='[{"RepoDigests":[]}]'
     elif 'psql' in args:
      operation=next(key for key,sql in harness.SCHEDULER_SQL.items() if kwargs.get('input')==sql)
      operations.append(operation)
      self.assertEqual(args,harness.scheduler_command(operation)[0])
      if operation==failing:return subprocess.CompletedProcess(args,3,'PRIVATE row','ERROR:  42501\nDETAIL: PRIVATE credential')
      output='off' if operation=='scheduler-verify-disabled' else 't'
     return subprocess.CompletedProcess(args,0,output,'')
    with patch.dict(os.environ,env,clear=True),patch.object(harness.subprocess,'run',side_effect=fake),patch.object(harness,'StartupObserver'),patch.object(harness,'LocalProxyPair') as proxies:
     proxies.return_value.summary.return_value={'listeners':'ipv4-loopback-only'}
     with self.assertRaisesRegex(SystemExit,'scheduler-containment'):harness.main()
     report=json.loads((work/'report.json').read_text())
     self.assertEqual(report['failedCommand']['command'],failing)
     self.assertEqual(report['failedCommand']['sqlstate'],'42501')
     self.assertEqual(report['failedCommand']['exitCode'],3)
     self.assertEqual(operations[-1],failing)
     self.assertEqual(report['schedulerContainment']['operation'],failing)
     self.assertEqual(report['schedulerContainment']['completed'],operations[:-1])
     proxies.return_value.stop.assert_called_once()
     captured=io.StringIO()
     with contextlib.redirect_stdout(captured):runpy.run_path(str(ROOT/'scripts/disposable-supabase/report.py'))
     self.assertNotIn('PRIVATE',captured.getvalue())
     public=json.loads(captured.getvalue())
     self.assertEqual(public['schedulerContainment'],report['schedulerContainment'])
     self.assertEqual(public['failedCommand']['sqlstate'],'42501')
     self.assertEqual((work/'failure-private.log').stat().st_mode & 0o777,0o600)
if __name__=='__main__':unittest.main(verbosity=2)
