"""Read-only local Git evidence; no hosted queries, SQL execution or network."""
import hashlib,json,subprocess

def git(*args):
 return subprocess.check_output(['git',*args],text=True).strip()
refs=git('for-each-ref','--format=%(refname) %(objectname)').splitlines()
sql={}
for line in git('rev-list','--objects','--all').splitlines():
 sha,_,path=line.partition(' ')
 if path.lower().endswith('.sql'):sql.setdefault(sha,path)
matches=[]
for blob,path in sql.items():
 text=git('cat-file','blob',blob)
 hits=[{'line':i+1,'text':line.strip()} for i,line in enumerate(text.splitlines()) if any(x in line.lower() for x in ('busy_business_snapshots','busy_ensure_business'))]
 if hits:matches.append({'blob':blob,'path':path,'hits':hits})
artifacts=['staging/ISOLATED_ONLY_business_core_v3180.sql','staging/disposable-supabase/fixture-prerequisites.sql','supabase/schema/v3_25_production_bridge.sql','src/core/businessSnapshotSession.mjs','src/app/AppController.js']
print(json.dumps({'evidence':'Local reachable Git SQL blobs only; absence is not proof of hosted schema absence. No SQL executed.','head':git('rev-parse','HEAD'),'tree':git('rev-parse','HEAD^{tree}'),'refCount':len(refs),'refsSha256':hashlib.sha256('\n'.join(refs).encode()).hexdigest(),'uniqueHistoricalSqlBlobs':len(sql),'matches':matches,'artifacts':[{'path':p,'blob':git('rev-parse','HEAD:'+p)} for p in artifacts],'conclusion':'References require manual authority review.' if matches else 'Original snapshot DDL, ensure-business RPC, grants and RLS not found in reachable SQL. Supply authoritative definitions before trusted mutation implementation.'},indent=2))
