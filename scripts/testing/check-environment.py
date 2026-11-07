"""Inert runner policy checks; actual bootstrap/health are verified separately."""
import importlib.util,json,pathlib,unittest,subprocess,sys,tempfile
path=pathlib.Path(__file__).with_name('regressions.py')
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
  self.assertEqual(sum(bool(r.get('phase8Blocked')) for r in rows),27)
  self.assertEqual(len({r['id'] for r in rows}),len(rows))
  for row in rows:self.assertEqual(module.validate(row)[0],'node')
 def test_no_shell_or_external_command(self):
  for args in [['../package.json'],['/bin/sh'],['scripts/check-mission15-phase8-quality.mjs',';','curl'],['scripts/does-not-exist.mjs']]:
   with self.assertRaises(ValueError):module.validate({'args':args})
if __name__=='__main__':unittest.main()
