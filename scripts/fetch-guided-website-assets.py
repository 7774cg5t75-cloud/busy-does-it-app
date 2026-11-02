"""Fixed licensed CI fixtures only. First-review hashes are recorded, then pinned."""
import hashlib,json,pathlib,urllib.request
m=json.loads(pathlib.Path('scripts/fixtures/guided-websites/assets.json').read_text());p=pathlib.Path('.test-artifacts/guided-websites/assets');p.mkdir(parents=True,exist_ok=True);rows=[]
for a in m['images']:
    assert a['name'] in ['catering','garden','studio'] and a['url'].startswith('https://upload.wikimedia.org/wikipedia/commons/') and a['url'].endswith('.jpg')
    r=urllib.request.Request(a['url'],headers={'User-Agent':'Busy-original-renderer-fixture-verification/1.0'})
    with urllib.request.urlopen(r,timeout=45) as f: data=f.read(12*1024*1024+1)
    assert len(data)<=12*1024*1024 and data.startswith(b'\xff\xd8'), 'Bounded genuine JPEG required'
    digest=hashlib.sha256(data).hexdigest()
    if a['sha256']:assert digest==a['sha256'],'Pinned photo bytes changed'
    (p/(a['name']+'.jpg')).write_bytes(data);rows.append({**a,'sha256':digest,'bytes':len(data),'sourcePinned':a['sha256'] is not None})
(p.parent/'asset-receipts.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows))
