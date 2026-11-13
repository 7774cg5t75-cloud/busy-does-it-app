"""Retrieve only reviewed licensed fixture URLs; changed bytes NEVER auto-pass."""
import hashlib,json,pathlib,urllib.request
m=json.loads(pathlib.Path('scripts/fixtures/guided-websites/assets.json').read_text());p=pathlib.Path('.test-artifacts/guided-websites/assets');p.mkdir(parents=True,exist_ok=True);rows=[];reviewed={};changed=[]
for a in m['images']:
    assert a['name'] in ['catering','garden','studio'] and a['url'].startswith('https://upload.wikimedia.org/wikipedia/commons/') and a['url'].endswith('.jpg')
    if a.get('reviewedLocalPath'):
        assert a['reviewedLocalPath']=='scripts/fixtures/guided-websites/patio-garden-reviewed.jpg' and a['name'] in ['garden','studio']
        reviewed[a['url']]=pathlib.Path(a['reviewedLocalPath']).read_bytes()
    if a['url'] not in reviewed:
        request=urllib.request.Request(a['url'],headers={'User-Agent':'Busy-original-renderer-fixture-verification/1.0'})
        with urllib.request.urlopen(request,timeout=45) as f: data=f.read(12*1024*1024+1)
        assert len(data)<=12*1024*1024 and data.startswith(b'\xff\xd8'), 'Bounded genuine JPEG required'
        reviewed[a['url']]=data
    data=reviewed[a['url']];digest=hashlib.sha256(data).hexdigest()
    if digest!=a['sha256']:
        # Diagnostic public CC0 fixture bytes only, never customer/private assets.
        # Keep the pipeline failing until exact pixels/provenance are reviewed.
        candidate=pathlib.Path('.test-artifacts/photo-byte-review');candidate.mkdir(parents=True,exist_ok=True)
        (candidate/(a['name']+'.jpg')).write_bytes(data);changed.append({**a,'expectedSha256':a['sha256'],'actualSha256':digest,'bytes':len(data),'state':'unreviewed-do-not-render'})
        continue
    (p/(a['name']+'.jpg')).write_bytes(data);rows.append({**a,'sha256':digest,'bytes':len(data),'sourcePinned':True})
if changed:
    (candidate/'changed-bytes.json').write_text(json.dumps(changed,indent=2));print(json.dumps([{'name':r['name'],'actualSha256':r['actualSha256'],'bytes':r['bytes']} for r in changed]))
assert not changed,'Pinned photo bytes changed: inspect diagnostic originals and licence provenance; do not relax verification'
(p.parent/'asset-receipts.json').write_text(json.dumps(rows,indent=2));print('Verified three explicit selections from two pinned licensed illustrative photographs; not business premises or past work.')
