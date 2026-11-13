"""Bounded, credential-free local Chromium process. Sandbox stays enabled."""
import json, os, pathlib, signal, subprocess, sys, tempfile
args=json.loads(sys.argv[1])
assert isinstance(args,list) and all(isinstance(x,str) for x in args)
assert not any(x in ['--no-sandbox','--disable-setuid-sandbox','--single-process'] for x in args)
assert args[-1].startswith('file:///tmp/busy-mission15-visual/')
with tempfile.TemporaryDirectory(prefix='busy-chromium-') as home:
 env={'PATH':'/usr/bin:/bin','HOME':home,'TMPDIR':home,'XDG_CONFIG_HOME':home,'XDG_CACHE_HOME':home,'LANG':'C.UTF-8'}
 with tempfile.TemporaryFile() as out, tempfile.TemporaryFile() as err:
  process=subprocess.Popen(['/usr/bin/chromium',*args],env=env,stdout=out,stderr=err,start_new_session=True)
  try: code=process.wait(timeout=15)
  except subprocess.TimeoutExpired:
   os.killpg(process.pid,signal.SIGKILL);process.wait();code=124
  finally:
   try: os.killpg(process.pid,signal.SIGKILL)
   except ProcessLookupError: pass
  out.seek(0);err.seek(0)
  print(json.dumps({'status':code,'stdout':out.read(2000000).decode('utf8','replace'),'stderr':err.read(12000).decode('utf8','replace')}))
