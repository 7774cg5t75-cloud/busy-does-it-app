"""Select an installed Xcode compatible with the declared Expo native dependency."""
import json,os,plistlib,re,subprocess
from pathlib import Path
candidates=[]
for app in Path('/Applications').glob('Xcode*.app'):
 try:
  version=plistlib.load(open(app/'Contents/Info.plist','rb'))['CFBundleShortVersionString']
  candidates.append((tuple(int(x) for x in re.findall(r'\d+',version)),app,version))
 except (OSError,KeyError,ValueError):continue
for _,app,version in sorted(candidates,reverse=True):
 developer=str(app/'Contents/Developer')
 result=subprocess.run(['xcrun','swift','--version'],env={**os.environ,'DEVELOPER_DIR':developer},capture_output=True,text=True)
 match=re.search(r'Swift version (\d+)\.(\d+)',result.stdout)
 if result.returncode or not match or tuple(map(int,match.groups()))<(6,2):continue
 with open(os.environ['GITHUB_ENV'],'a') as f:f.write('DEVELOPER_DIR='+developer+'\n')
 path=Path('artifacts/native-screenshots/manifest.json');m=json.loads(path.read_text());m.update(xcode=version,swift=result.stdout.strip());path.write_text(json.dumps(m,indent=2))
 print('Selected installed Xcode',version,result.stdout.strip());break
else:raise SystemExit('No installed Xcode with Swift >=6.2; do not download an unreviewed toolchain')
