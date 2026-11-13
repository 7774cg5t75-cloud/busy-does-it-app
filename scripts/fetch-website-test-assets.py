"""Approved CI setup only: fixed CC0 image names, pinned bytes, no user URLs."""
import hashlib,json,pathlib,urllib.request
p=pathlib.Path('.test-artifacts/website-expansion/assets');p.mkdir(parents=True,exist_ok=True)
m=json.loads(pathlib.Path('scripts/fixtures/website-design/assets.json').read_text())
assert m['sourceCommit']=='e8a42ba85aaf5fd9322ef9ca51bc21063b22fcae'
for row in m['images']:
    assert row['name'] in ['coffee','grass','gravel','brick']
    url=f"https://raw.githubusercontent.com/scikit-image/scikit-image/{m['sourceCommit']}/skimage/data/{row['name']}.png"
    with urllib.request.urlopen(url,timeout=30) as r: data=r.read(1024*1024+1)
    assert len(data)<=1024*1024 and hashlib.sha256(data).hexdigest()==row['sha256'], 'Image integrity mismatch'
    (p/(row['name']+'.png')).write_bytes(data)
print('Verified four pinned CC0 demonstration photographs; no arbitrary URL retrieval.')
