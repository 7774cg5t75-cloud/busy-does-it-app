"""Prepare only disposable checkout instrumentation; no application UI changes."""
import hashlib,json,os,shutil,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
request=json.loads((ROOT/'scripts/native-capture/request.json').read_text())
source=os.environ.get('CAPTURE_SOURCE') or request.get('source_sha') or os.environ['GITHUB_SHA']
if len(source)!=40 or any(c not in '0123456789abcdef' for c in source):raise SystemExit('Expected exact source SHA')
subprocess.run(['git','merge-base','--is-ancestor',source,os.environ['GITHUB_SHA']],cwd=ROOT,check=True)
subprocess.run(['git','cat-file','-e',source+':src/theme/appearance.mjs'],cwd=ROOT,check=True)
work=Path(os.environ['RUNNER_TEMP'])/'busy-native-source'
subprocess.run(['git','worktree','add','--detach',str(work),source],cwd=ROOT,check=True)
shutil.copytree(ROOT/'scripts/native-capture',work/'scripts/native-capture',dirs_exist_ok=True)
shutil.copyfile(ROOT/'scripts/native-capture/package-lock.json',work/'package-lock.json')
current_package=json.loads((ROOT/'package.json').read_text());capture_package=json.loads((work/'package.json').read_text())
if any(capture_package.get(k,{})!=current_package.get(k,{})for k in ['dependencies','devDependencies']):raise SystemExit('Capture source dependency declarations require independent review')
package_original_sha=hashlib.sha256((work/'package.json').read_bytes()).hexdigest()
capture_package['overrides']=current_package['overrides'];(work/'package.json').write_text(json.dumps(capture_package,indent=2)+'\n')
for name in ['apply-tooling-security-patches.mjs','dependency-policy.mjs','run-expo-safe.mjs']:
 shutil.copyfile(ROOT/'scripts'/name,work/'scripts'/name)
(work/'scripts/lib').mkdir(exist_ok=True);shutil.copyfile(ROOT/'scripts/lib/expo-safe-arguments.mjs',work/'scripts/lib/expo-safe-arguments.mjs')
(work/'security').mkdir(exist_ok=True)
for name in ['dependency-policy.json','dependency-patches.json']:shutil.copyfile(ROOT/'security'/name,work/'security'/name)

ui_test=work/'scripts/native-capture/CaptureTests.swift'
ui_source=ui_test.read_text()
if ui_source.count('__BUSY_CAPTURE_SOURCE_SHA__')!=1:raise SystemExit('Expected exactly one capture source binding')
ui_test.write_text(ui_source.replace('__BUSY_CAPTURE_SOURCE_SHA__',source))
entry=work/'App.js';before=entry.read_bytes();entry.write_text('require("./scripts/native-capture/transport.cjs").install();\n'+before.decode())
config=work/'app.config.js'
if config.exists():config.rename(work/'app.config.capture-original.cjs')
else:(work/'app.config.capture-original.cjs').write_text('module.exports=({config})=>config;')
config.write_text('''const original=require('./app.config.capture-original.cjs');
module.exports=args=>{const c=typeof original==='function'?original(args):original;return {...c,name:'Busy Screenshot Fixture',scheme:'busy-capture',updates:{enabled:false},extra:{...c.extra,eas:undefined,busyCapture:true},ios:{...c.ios,bundleIdentifier:'com.busydoesit.capture'},android:{...c.android,package:'com.busydoesit.capture'}};};
''')
manifest={'sourceCommit':source,'originalPackageSha256':package_original_sha,'capturePackageSha256':hashlib.sha256((work/'package.json').read_bytes()).hexdigest(),'dependencyPolicySha256':hashlib.sha256((ROOT/'security/dependency-policy.json').read_bytes()).hexdigest(),'dependencyLockSha256':hashlib.sha256((work/'package-lock.json').read_bytes()).hexdigest(),'harnessCommit':os.environ['GITHUB_SHA'],'entryOriginalSha256':hashlib.sha256(before).hexdigest(),'entryInstrumentedSha256':hashlib.sha256(entry.read_bytes()).hexdigest(),'platform':'iOS Simulator','fixture':'fictional in-memory transport; no hosted authentication/security proof','tool':'Apple XCTest screenshot attachment / xcresulttool export attachments','expectedScreen':'Home','appearance':'Midnight','fixtureTransportSha256':hashlib.sha256((ROOT/'scripts/native-capture/transport.cjs').read_bytes()).hexdigest(),'uiTestCompiledSha256':hashlib.sha256(ui_test.read_bytes()).hexdigest(),'productionUIAndControllerUnmodified':True}
art=ROOT/'artifacts/native-screenshots';art.mkdir(parents=True,exist_ok=True);(art/'manifest.json').write_text(json.dumps(manifest,indent=2))
with open(os.environ['GITHUB_ENV'],'a') as f:f.write('CAPTURE_WORK='+str(work)+'\nCAPTURE_SOURCE_SHA='+source+'\n')
print('Preparing real native source',source)
