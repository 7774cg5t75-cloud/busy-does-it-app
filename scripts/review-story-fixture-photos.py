"""Bounded public CC0 candidate review, never a product upload/asset authority.
Nothing downloaded here is eligible in a website until separately inspected and
pinned in the existing licensed test-fixture manifest.
"""
import hashlib, json, pathlib, urllib.parse, urllib.request

class PublicOnly(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        assert urllib.parse.urlparse(newurl).hostname in ['commons.wikimedia.org','upload.wikimedia.org','thumb.wikimedia.org']
        return super().redirect_request(req, fp, code, msg, headers, newurl)
opener=urllib.request.build_opener(PublicOnly())
def read(url, limit):
    assert urllib.parse.urlparse(url).scheme=='https' and urllib.parse.urlparse(url).hostname in ['commons.wikimedia.org','upload.wikimedia.org','thumb.wikimedia.org']
    with opener.open(urllib.request.Request(url,headers={'User-Agent':'BusyDoesIt-CC0-fixture-review/1.0 (isolated development evidence)'}),timeout=35) as r:
        data=r.read(limit+1)
    assert len(data)<=limit
    return data
out=pathlib.Path('.test-artifacts/story-photo-review');out.mkdir(parents=True,exist_ok=True);rows=[]
for category,query in [('food','food buffet filetype:bitmap'),('garden','garden filetype:bitmap -Yale -painting -drawing')]:
    params={'action':'query','format':'json','generator':'search','gsrnamespace':'6','gsrsearch':query,'gsrlimit':'50','prop':'imageinfo','iiprop':'url|size|extmetadata','iiurlwidth':'1280'}
    data=json.loads(read('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params),3*1024*1024));count=0
    for page in sorted(data.get('query',{}).get('pages',{}).values(),key=lambda p:p.get('index',999)):
        info=page.get('imageinfo',[{}])[0];meta=info.get('extmetadata',{});license=meta.get('LicenseShortName',{}).get('value','')
        if license not in ['CC0','CC0 1.0']:continue
        url=info.get('thumburl',info.get('url',''))
        if url.startswith('//upload.wikimedia.org/'):url='https:'+url
        if url.startswith('http://upload.wikimedia.org/'):url='https://'+url[len('http://'):]
        parsed=urllib.parse.urlparse(url)
        if parsed.scheme!='https' or parsed.hostname not in ['commons.wikimedia.org','upload.wikimedia.org','thumb.wikimedia.org']:
            (out/('denied-'+category+'-'+str(page['pageid'])+'.json')).write_text(json.dumps({'title':page['title'],'url':url,'state':'unsupported-url-not-fetched'}));continue
        suffix=urllib.parse.urlparse(url).path.lower()
        if not suffix.endswith(('.jpg','.jpeg','.png')):continue
        image=read(url,10*1024*1024);assert image.startswith((b'\xff\xd8',b'\x89PNG\r\n\x1a\n'))
        filename=category+'-'+str(page['pageid'])+('.png' if suffix.endswith('.png') else '.jpg');(out/filename).write_bytes(image)
        rows.append({'category':category,'title':page['title'],'url':url,'descriptionUrl':info.get('descriptionurl'),'license':license,'metadata':meta,'file':filename,'bytes':len(image),'sha256':hashlib.sha256(image).hexdigest(),'width':info.get('thumbwidth',info.get('width')),'height':info.get('thumbheight',info.get('height')),'state':'unreviewed-not-eligible-for-rendering'});count+=1
        if count==3:break
(out/'candidates.json').write_text(json.dumps({'rows':rows,'publicCC0MetadataOnly':True,'ownerRightsVerified':False,'productAuthority':False},indent=2))
print(json.dumps([{k:r[k] for k in ['category','title','file','bytes','sha256']} for r in rows]))
assert rows,'No permitted candidates; do not substitute unlicensed photography.'
