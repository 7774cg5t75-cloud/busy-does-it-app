"""Reviewed offline selection; no shell, downloads, browser or workflow dispatch."""
import argparse, datetime, hashlib, json, os, pathlib, signal, subprocess, sys, time
ROOT=pathlib.Path(__file__).resolve().parents[2]
# Babel may resolve named plugins from the test cwd rather than its own prefix.
# Give child checks the reviewed isolated tools, without changing app installs
# or requiring a shell-exported NODE_PATH from a previous session.
TEST_ENV={**os.environ,'NODE_PATH':str(ROOT/'scripts/offline-tools/node_modules')}
def classify(code,output,timed_out=False):
 if timed_out:return 'blocked'
 if code==0:return 'passed'
 missing=('Cannot find module' in output or 'ERR_MODULE_NOT_FOUND' in output) and '@babel/' in output
 return 'blocked' if missing or ('EPERM' in output and ('spawn' in output or 'connect' in output)) else 'failed'
def validate(row):
 args=row.get('args',[])
 if not args or not isinstance(args,list) or not all(isinstance(a,str) for a in args):raise ValueError('Invalid command arguments')
 path=(ROOT/args[0]).resolve()
 if not path.is_relative_to(ROOT/'scripts') or not path.is_file() or path.suffix!='.mjs':raise ValueError('Only checked-in local verification scripts are allowed')
 if len(args)>1 and args!=['scripts/build-website-design-gallery-v3100.mjs','/tmp/busy-mission15-phase2-gallery']:raise ValueError('Unexpected additional arguments')
 return ['node',*args]
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--only-phase8-blocked',action='store_true');parser.add_argument('--filter',default='');parser.add_argument('--fail-fast',action='store_true');parser.add_argument('--timeout',type=int,default=90);parser.add_argument('--output',default='.test-artifacts/regressions.json');args=parser.parse_args()
 if not 1<=args.timeout<=300:parser.error('Timeout must be 1–300 seconds per check')
 manifest=ROOT/'scripts/testing/regressions.json';selection=json.loads(manifest.read_text())['checks'];rows=[]
 for row in selection:validate(row)
 def git(*argv):return subprocess.check_output(['git',*argv],cwd=ROOT,text=True).strip()
 report={'sourceSha':git('rev-parse','HEAD'),'workingTreeChanged':bool(git('status','--porcelain','--untracked-files=normal')),'testToolModulePath':TEST_ENV['NODE_PATH'],'selectionSha256':hashlib.sha256(manifest.read_bytes()).hexdigest(),'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'evidence':'Offline original code with inert boundaries; not hosted/native/browser acceptance.','results':rows}
 output=pathlib.Path(args.output).resolve();output.parent.mkdir(parents=True,exist_ok=True)
 def save():
  report['summary']={key:sum(r['status']==key for r in rows) for key in ['passed','failed','blocked','unexecuted']}
  temporary=output.with_suffix(output.suffix+'.tmp');temporary.write_text(json.dumps(report,indent=2)+'\n');temporary.replace(output)
 stopped=False
 for row in selection:
  selected=(not args.only_phase8_blocked or row.get('phase8Blocked')) and args.filter in row['id']
  rows.append({**row,'status':'unexecuted','reason':'Not selected' if not selected else 'Waiting'})
 report['selectedCount']=sum(row['reason']!='Not selected' for row in rows)
 save()
 for row in rows:
  if row['reason']=='Not selected' or stopped:continue
  start=time.monotonic();process=None;timed_out=False
  try:
   process=subprocess.Popen(validate(row),cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,start_new_session=True,env=TEST_ENV)
   try:out,_=process.communicate(timeout=args.timeout)
   except subprocess.TimeoutExpired:
    timed_out=True;os.killpg(process.pid,signal.SIGKILL);out,_=process.communicate()
   row.update(status=classify(process.returncode,out,timed_out),exitCode=process.returncode,seconds=round(time.monotonic()-start,2),output=out[-12000:],reason='Timed out' if timed_out else '')
  except KeyboardInterrupt:
   if process and process.poll() is None:os.killpg(process.pid,signal.SIGKILL);process.communicate()
   row['reason']='Interrupted; no passing claim';stopped=True
  except OSError as error:row.update(status='blocked',reason=type(error).__name__,output=str(error))
  print(row['status'].upper(),row['id'],flush=True);save()
  if args.fail_fast and row['status'] in ['failed','blocked']:stopped=True
 report['finishedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();save();print(json.dumps(report['summary']))
 return 1 if report['summary']['failed'] else 2 if report['summary']['blocked'] or stopped or report['selectedCount']==0 else 0
if __name__=='__main__':sys.exit(main())
