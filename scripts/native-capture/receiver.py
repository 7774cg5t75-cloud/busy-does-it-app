import hashlib,json,os,subprocess
from pathlib import Path
from http.server import BaseHTTPRequestHandler,HTTPServer
art=Path('artifacts/native-screenshots');allowed={'home-midnight','home-daylight','website-builder-midnight','app-builder-midnight','content-creator-midnight','get-more-customers-midnight','work-customers-midnight','get-paid-explanation-midnight'}
class Handler(BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def do_GET(self):
  name=self.path.removeprefix('/capture/')
  if not self.path.startswith('/capture/') or name not in allowed:self.send_error(404);return
  target=art/(name+'.png')
  p=subprocess.run(['xcrun','simctl','io',os.environ['CAPTURE_UDID'],'screenshot','--type=png',str(target)],capture_output=True,text=True)
  if p.returncode:self.send_error(500,'simctl capture failed');return
  m=json.loads((art/'manifest.json').read_text());m.setdefault('captures',{})[name]={'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size};(art/'manifest.json').write_text(json.dumps(m,indent=2))
  self.send_response(200);self.end_headers();self.wfile.write(b'captured')
HTTPServer(('127.0.0.1',8765),Handler).serve_forever()
