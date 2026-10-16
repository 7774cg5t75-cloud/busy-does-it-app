"""Offline tests ONLY: parses/prepares fixtures; never invokes Supabase/Docker."""
import ast,hashlib,importlib.util,json,pathlib,re,tempfile,unittest
ROOT=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('rehearse',ROOT/'scripts/disposable-supabase/rehearse.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class DraftTests(unittest.TestCase):
 def test_failure_diagnostics_are_allowlisted(self):
  secret='PRIVATE_TOKEN_AND_ROW_DATA'
  args=['supabase','status','--output','json']
  detail=module.failure_details(args,'ordered-candidate-migration-application',1,
      '{"SERVICE_ROLE_KEY":"'+secret+'"}','connection refused '+secret)
  self.assertEqual(detail['command'],'supabase-local-status')
  self.assertEqual(detail['indicators'],['connection-refused'])
  self.assertNotIn(secret,json.dumps(detail));self.assertNotIn('SERVICE_ROLE_KEY',json.dumps(detail))
  self.assertEqual(module.command_label(['supabase','--token',secret]),'other-local-command')
  for command in (['migration','new'],['migration','up'],['start'],['stop'],['status']):
   self.assertEqual(module.command_label(['supabase',*command,'--help']),'supabase-'+'-'.join(command)+'-help')
 def test_start_failure_reporting_without_executing_tools(self):
  import os,subprocess,contextlib,io,runpy
  from unittest.mock import patch
  for kind in ('exit','timeout','launch-error'):
   with self.subTest(kind=kind),tempfile.TemporaryDirectory() as directory:
    work=pathlib.Path(directory)/'fresh';sha='a'*40;secret='PRIVATE_DIAGNOSTIC_CANARY'
    env={'GITHUB_ACTIONS':'true','RUNNER_ENVIRONMENT':'github-hosted',
      'GITHUB_REPOSITORY':'7774cg5t75-cloud/busy-does-it-app',
      'BUSY_DISPOSABLE_APPROVAL':'APPROVE_DISPOSABLE_TEST_ONLY',
      'BUSY_APPROVED_SHA':sha,'GITHUB_SHA':sha,'RUNNER_TEMP':directory,'BUSY_DB_WORKDIR':str(work)}
    calls=[]
    def fake(args,**kwargs):
     calls.append(args)
     if args==['supabase','--network-id',module.NETWORK,'start']:
      if kind=='timeout':raise subprocess.TimeoutExpired(args,900,output=secret.encode(),stderr=b'context deadline exceeded')
      if kind=='launch-error':raise FileNotFoundError(secret)
      return subprocess.CompletedProcess(args,1,secret,'connection refused '+secret)
     output=''
     if args[0]=='git':output=sha
     elif args==['supabase','--version']:output='2.54.11'
     elif args==['docker','network','inspect',module.NETWORK]:output='[{"Internal":true}]'
     return subprocess.CompletedProcess(args,0,output,'')
    with patch.dict(os.environ,env,clear=True),patch.object(module.subprocess,'run',side_effect=fake):
     with self.assertRaisesRegex(SystemExit,'isolated-stack-start'):module.main()
     report=json.loads((work/'report.json').read_text())
     self.assertEqual(report['failedCommand']['command'],'supabase-local-start')
     self.assertEqual(report['failedCommand']['failureKind'],kind)
     self.assertNotIn(secret,json.dumps(report))
     self.assertEqual(calls[-1],['supabase','--network-id',module.NETWORK,'start'])
     self.assertEqual((work/'failure-private.log').stat().st_mode & 0o777,0o600)
     captured=io.StringIO()
     with contextlib.redirect_stdout(captured):runpy.run_path(str(ROOT/'scripts/disposable-supabase/report.py'))
     self.assertNotIn(secret,captured.getvalue())
     self.assertEqual(json.loads(captured.getvalue())['failedCommand'],report['failedCommand'])
 def test_history_is_unique_and_ordered(self):
  files,hashes=module.inventory(ROOT)
  self.assertEqual(files[-1].name,'20261014225500_v3_232_scoped_booking_close_revision.sql')
  self.assertEqual(len(files),len(hashes));self.assertGreater(len(files),60)
 def test_ambiguous_history_fails(self):
  with tempfile.TemporaryDirectory() as directory:
   root=pathlib.Path(directory);m=root/'supabase/migrations';m.mkdir(parents=True)
   (m/'20261016000000_a.sql').write_text('select 1;');(m/'20261016000000_b.sql').write_text('select 2;')
   with self.assertRaises(RuntimeError):module.inventory(root)
 def test_python_syntax(self):
  for p in (ROOT/'scripts/disposable-supabase').glob('*.py'):ast.parse(p.read_text())
 def test_manual_gate_and_no_external_targets(self):
  workflow=(ROOT/'.github/workflows/disposable-supabase-review.yml').read_text()
  self.assertIn('workflow_dispatch:',workflow)
  for forbidden in ['  push:', '  pull_request:', '  schedule:', 'secrets.', 'supabase db push','--linked','self-hosted','ubuntu-latest']:
   self.assertNotIn(forbidden,workflow)
  for required in ['BUSY_DB_REHEARSAL_APPROVED_SHA == github.sha','inputs.approved_sha == github.sha','persist-credentials: false','environment: busy-disposable-db-review','contents: read','timeout-minutes: 35']:
   self.assertIn(required,workflow)
  for action in re.findall(r'uses: ([^\n]+)',workflow):self.assertRegex(action,r'@[a-f0-9]{40} ')
 def test_isolated_config_and_rollback(self):
  import tomllib
  c=tomllib.loads((ROOT/'staging/disposable-supabase/config.toml').read_text())
  self.assertEqual(c['project_id'],'busy-disposable-review');self.assertFalse(c['db']['seed']['enabled']);self.assertFalse(c['edge_runtime']['enabled'])
  rollback=(ROOT/'staging/disposable-supabase/rollback.sql').read_text().lower()
  self.assertNotRegex(rollback,r'drop\s+.*cascade');self.assertIn("current_setting('busy.disposable_rehearsal',true)",rollback)
 def test_no_application_or_historical_schema_mutation(self):
  runner=(ROOT/'scripts/disposable-supabase/rehearse.py').read_text()
  for required in ["'--internal'","network['Internal'] is True","cron.launch_active_jobs='off'","'migration','new'","version>actual[-1]","assert inventory(ROOT)[1]==history","assert fingerprint()==baseline"]:self.assertIn(required,runner)
  self.assertNotIn('--db-url',runner);self.assertNotIn('--linked',runner)
 def test_actual_source_boundary_still_exists(self):
  s=(ROOT/'supabase/functions/busy-mini-apps/index.ts').read_text();start=s.index('async function requireUser(request: Request)');end=s.index('const EXPO_PUSH_URL',start)
  self.assertEqual(s[start:end].count('async function '),2)
  for marker in ['supabase.auth.getUser(token)','async function membership(','busy_business_memberships','user_id']:
   self.assertIn(marker,s[start:end])
 def test_no_execution_without_approved_runner(self):
  with self.assertRaisesRegex(RuntimeError,'Approved GitHub-hosted source required'):module.main()
if __name__=='__main__':unittest.main(verbosity=2)
