"""No inherited credentials/proxy/provider settings in the browser process."""
import argparse,hashlib,os,pathlib,subprocess,tempfile
root=pathlib.Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();g=p.add_mutually_exclusive_group(required=True);g.add_argument('--prepare-only',action='store_true');g.add_argument('--capture',action='store_true');p.add_argument('--output',default='.test-artifacts/browser');args=p.parse_args()
if args.capture and hasattr(os,'geteuid') and os.geteuid()==0:raise SystemExit('Browser capture requires a non-root user with a working normal Chromium sandbox.')
sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
diff=subprocess.check_output(['git','diff','HEAD','--'],cwd=root)
with tempfile.TemporaryDirectory(prefix='busy-browser-home-') as home:
 env={'PATH':os.environ['PATH'],'HOME':home,'TMPDIR':home,'LANG':'C.UTF-8','BUSY_BROWSER_OUTPUT':str(pathlib.Path(args.output).resolve()),'BUSY_BROWSER_SOURCE_SHA':sha,'BUSY_BROWSER_SOURCE_DIRTY':str(bool(subprocess.check_output(['git','status','--porcelain'],cwd=root))).lower(),'BUSY_BROWSER_SOURCE_DIFF_SHA256':hashlib.sha256(diff).hexdigest(),'PLAYWRIGHT_BROWSERS_PATH':os.environ.get('PLAYWRIGHT_BROWSERS_PATH',str(pathlib.Path.home()/'.cache/ms-playwright'))}
 subprocess.run(['node','scripts/testing/browser.mjs','--capture' if args.capture else '--prepare-only'],cwd=root,env=env,check=True,timeout=180)
