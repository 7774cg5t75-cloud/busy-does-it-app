import json,os,subprocess
run=lambda *args:subprocess.check_output(args,text=True).strip()
runtimes=json.loads(run('xcrun','simctl','list','runtimes','-j'))['runtimes']
ios=[r for r in runtimes if r.get('isAvailable') and 'iOS' in r['name']]
if not ios:raise SystemExit('No installed iOS simulator runtime; no paid/download fallback')
runtime=sorted(ios,key=lambda r:[int(x) for x in r['version'].split('.')])[-1]
types=json.loads(run('xcrun','simctl','list','devicetypes','-j'))['devicetypes']
phones=[d for d in types if 'iPhone' in d['name']]
phones.sort(key=lambda d:(d['name']!='iPhone 14 Pro',d['name']!='iPhone 16 Pro',d['name']))
for device in phones:
 try:udid=run('xcrun','simctl','create','Busy Capture',device['identifier'],runtime['identifier']);break
 except subprocess.CalledProcessError:continue
else:raise SystemExit('No supported iPhone simulator')
print('Booting',device['name'],runtime['name'],flush=True)
subprocess.run(['open','-a','Simulator','--args','-CurrentDeviceUDID',udid],check=True)
subprocess.run(['xcrun','simctl','bootstatus',udid,'-b'],check=True,timeout=360)
subprocess.run(['xcrun','simctl','status_bar',udid,'override','--time','9:41','--dataNetwork','wifi','--wifiMode','active','--wifiBars','3','--batteryState','charged','--batteryLevel','100'],check=True)
with open(os.environ['GITHUB_ENV'],'a') as f:f.write('CAPTURE_UDID='+udid+'\n')
p='artifacts/native-screenshots/manifest.json';m=json.load(open(p));m.update(device=device['name'],runtime=runtime['name']);open(p,'w').write(json.dumps(m,indent=2))
