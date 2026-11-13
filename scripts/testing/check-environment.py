"""Inert runner policy checks; actual bootstrap/health are verified separately."""
import importlib.util,json,pathlib,unittest,subprocess,sys,tempfile
path=pathlib.Path(__file__).with_name('regressions.py')

# Original85-command Phase8 selection retained27 blocked IDs. A later reviewed
# registry commit d6d8fef8 added workflow-interiors as another historical flag.
# Pin identities, not a stale aggregate count that rejects valid new checks.
ORIGINAL_PHASE8_BLOCKED=frozenset(['check-app-goal-editing', 'check-app-studio-checkpoint', 'check-app-studio-session', 'check-major-builders-v3195', 'check-mission10-public-information', 'check-mission11-composition', 'check-mission13-customer-surfaces', 'check-mission14-content-intelligence', 'check-mission14-experience-recovery', 'check-mission15-phase2-copy', 'check-mission15-phase2-request-intent', 'check-mission15-phase2-services', 'check-mission15-phase2-transfer-review', 'check-mission15-phase3-composition', 'check-mission15-phase3-content-review', 'check-mission15-phase3-studio-recovery', 'check-mission15-phase4-app-capabilities', 'check-mission15-phase4-requirements', 'check-mission15-phase5-approved-records', 'check-mission15-phase5-enquiry-review', 'check-mission15-phase6-booking-review', 'check-mission15-phase7-app-selection', 'check-mission15-phase7-reviewed-request', 'check-mission15-phase7-typography', 'check-mission8-shared-request-entry', 'check-mission9-reply-continuity', 'check-website-context-plan-v3147'])
LATER_HISTORICAL_BLOCKED=frozenset(['check-workflow-interiors'])
spec=importlib.util.spec_from_file_location('regressions',path);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class RunnerPolicy(unittest.TestCase):
 def test_outcomes(self):
  self.assertEqual(module.classify(0,''),'passed')
  self.assertEqual(module.classify(1,'assertion failed'),'failed')
  self.assertEqual(module.classify(1,"Cannot find module '@babel/core'"),'blocked')
  self.assertEqual(module.classify(1,"Cannot find module './original-app-file'"),'failed')
  self.assertEqual(module.classify(1,'spawn EPERM'),'blocked')
  self.assertEqual(module.classify(0,'',True),'blocked')
 def test_no_matching_checks_are_not_green(self):
  with tempfile.TemporaryDirectory() as folder:
   report=pathlib.Path(folder)/'report.json'
   result=subprocess.run([sys.executable,str(path),'--filter','NO_MATCHING_CHECK_ALLOWED','--output',str(report)],capture_output=True,text=True)
   self.assertEqual(result.returncode,2)
   data=json.loads(report.read_text());self.assertEqual(data['selectedCount'],0);self.assertEqual(data['summary']['passed'],0)
   self.assertEqual(data['summary']['unexecuted'],len(data['results']))
 def test_reviewed_selection(self):
  rows=json.loads(path.with_name('regressions.json').read_text())['checks']
  self.assertEqual(len(ORIGINAL_PHASE8_BLOCKED),27)
  self.assertEqual({r['id'] for r in rows if r.get('phase8Blocked')},ORIGINAL_PHASE8_BLOCKED|LATER_HISTORICAL_BLOCKED)
  self.assertEqual(len({r['id'] for r in rows}),len(rows))
  for row in rows:self.assertEqual(module.validate(row)[0],'node')
 def test_no_shell_or_external_command(self):
  for args in [['../package.json'],['/bin/sh'],['scripts/check-mission15-phase8-quality.mjs',';','curl'],['scripts/does-not-exist.mjs']]:
   with self.assertRaises(ValueError):module.validate({'args':args})
if __name__=='__main__':unittest.main()
