"""Manual-only GitHub-hosted disposable rehearsal. Never accepts a database URL."""
import hashlib,json,os,pathlib,re,shutil,subprocess,time
ROOT=pathlib.Path(__file__).resolve().parents[2]
PROJECT='busy-disposable-review'; NETWORK='busy-db-review-internal'
DB='supabase_db_'+PROJECT

def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def inventory(root):
    files=sorted((root/'supabase/migrations').glob('*.sql'))
    versions=[p.name.split('_')[0] for p in files]
    if not files or len(set(versions))!=len(versions) or any(not re.fullmatch(r'\d{14}',v) for v in versions):
        raise RuntimeError('Migration history is empty, ambiguous or malformed')
    return files,{p.name:digest(p) for p in files}

def main():
    # Refuse arbitrary workstations, private/billable runners and remote credentials.
    if not (os.environ.get('GITHUB_ACTIONS')=='true' and os.environ.get('RUNNER_ENVIRONMENT')=='github-hosted'
            and os.environ.get('GITHUB_REPOSITORY')=='7774cg5t75-cloud/busy-does-it-app'
            and os.environ.get('BUSY_DISPOSABLE_APPROVAL')=='APPROVE_DISPOSABLE_TEST_ONLY'
            and re.fullmatch(r'[0-9a-f]{40}',os.environ.get('BUSY_APPROVED_SHA',''))
            and os.environ.get('GITHUB_SHA')==os.environ.get('BUSY_APPROVED_SHA')):
        raise RuntimeError('Approved GitHub-hosted source required')
    for key in ('SUPABASE_ACCESS_TOKEN','SUPABASE_DB_PASSWORD','DATABASE_URL','PGHOST','PGSERVICE','SUPABASE_URL'):
        if os.environ.get(key): raise RuntimeError('Remote/runtime credential variable refused: '+key)
    work=pathlib.Path(os.environ['BUSY_DB_WORKDIR']).resolve()
    if work.parent!=pathlib.Path(os.environ['RUNNER_TEMP']).resolve() or work.exists():
        raise RuntimeError('Fresh runner temporary directory required')
    work.mkdir(mode=0o700);(work/'supabase/migrations').mkdir(parents=True)
    report={'source':os.environ['GITHUB_SHA'],'scope':'disposable local Supabase; fictional accounts only','stages':[],
            'limitations':['Not hosted Supabase or production verification','Business-core baseline is an explicit CI compatibility fixture','Full Edge HTTP routes and native/browser journeys require separate acceptance']}
    stage='initialise'
    def save(): (work/'report.json').write_text(json.dumps(report,indent=2)+'\n')
    def run(args,stdin=None,timeout=240):
        result=subprocess.run(args,input=stdin,text=True,cwd=work,capture_output=True,timeout=timeout)
        if result.returncode:
            # Raw local tooling output is private scratch, not a public artifact.
            (work/'failure-private.log').write_text(result.stdout+result.stderr)
            report['failedCommand']={'program':pathlib.Path(args[0]).name,'exitCode':result.returncode,'stage':stage}
            raise RuntimeError('Command failed; inspect private runner diagnostics if authorised')
        return result.stdout
    def sql(text): return run(['docker','exec','-i',DB,'psql','-X','-qAt','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],text)
    def passed(label): report['stages'].append({'stage':label,'result':'passed'});save()
    def fingerprint():
        dump=run(['docker','exec',DB,'pg_dump','-U','postgres','-d','postgres','--schema=public','--schema-only','--no-owner'])
        stable='\n'.join(l for l in dump.splitlines() if not l.startswith(('\\restrict','\\unrestrict','-- Dumped','-- Started','-- Completed')))
        return hashlib.sha256(stable.encode()).hexdigest()
    try:
        assert run(['git','-C',str(ROOT),'rev-parse','HEAD']).strip()==os.environ['GITHUB_SHA']
        files,history=inventory(ROOT);report['migrationHistory']=history
        report['candidateSourceHash']=digest(ROOT/'supabase/schema/business_content_records.sql')
        report['cliVersion']=run(['supabase','--version']).strip()
        if report['cliVersion']!='2.54.11': raise RuntimeError('Reviewed CLI version required')
        # Discover all command/flag surfaces before invoking them. No guessed remote defaults.
        for command in (['migration','new'],['migration','up'],['start'],['stop'],['status']):run(['supabase',*command,'--help'])
        shutil.copyfile(ROOT/'staging/disposable-supabase/config.toml',work/'supabase/config.toml')
        run(['docker','network','create','--internal',NETWORK])
        network=json.loads(run(['docker','network','inspect',NETWORK]))[0]
        assert network['Internal'] is True
        # Empty migration directory: historical cron never starts before egress isolation.
        run(['supabase','--network-id',NETWORK,'start'],timeout=900)
        containers=json.loads(run(['docker','network','inspect',NETWORK]))[0]['Containers']
        if not containers: raise RuntimeError('Isolated containers missing')
        report['images']=[]
        for cid in containers:
            meta=json.loads(run(['docker','inspect',cid]))[0]
            assert set(meta['NetworkSettings']['Networks'])=={NETWORK}
            image=json.loads(run(['docker','image','inspect',meta['Image']]))[0]
            report['images'].append({'name':meta['Name'],'id':meta['Image'],'digests':image.get('RepoDigests',[])})
        # Supabase Postgres supplies real Auth/Storage schemas, not mocked roles.
        sql("create extension if not exists pg_cron;\n")
        sql("alter system set cron.launch_active_jobs='off';\n")
        sql('select pg_reload_conf();');time.sleep(1)
        assert sql("show cron.launch_active_jobs;").strip()=='off'
        passed('isolated-stack-and-scheduler-containment')
        stage='fixture-prerequisites'
        sql((ROOT/'staging/ISOLATED_ONLY_business_core_v3180.sql').read_text())
        sql((ROOT/'staging/disposable-supabase/fixture-prerequisites.sql').read_text())
        sql((ROOT/'supabase/schema/v3_25_production_bridge.sql').read_text())
        passed(stage)
        stage='unchanged-full-history-replay'
        for p in files:shutil.copyfile(p,work/'supabase/migrations'/p.name)
        run(['supabase','migration','up','--local'],timeout=480)
        assert inventory(ROOT)[1]==history
        actual=sql('select version from supabase_migrations.schema_migrations order by version;').strip().splitlines()
        assert actual==[p.name.split('_')[0] for p in files]
        passed(stage);baseline=fingerprint()
        stage='cli-candidate-and-transactional-ddl-rollback'
        run(['supabase','migration','new','shared_business_content_records'])
        candidates=[p for p in (work/'supabase/migrations').glob('*.sql') if p.name not in history]
        assert len(candidates)==1
        candidate=candidates[0];version=candidate.name.split('_')[0]
        assert re.fullmatch(r'\d{14}',version) and version>actual[-1]
        candidate.write_bytes((ROOT/'supabase/schema/business_content_records.sql').read_bytes())
        assert digest(candidate)==report['candidateSourceHash']
        report['candidate']={'name':candidate.name,'sha256':digest(candidate)}
        sql('begin;\n'+candidate.read_text()+'\nrollback;')
        assert sql("select to_regclass('public.busy_business_content') is null;").strip()=='t'
        assert fingerprint()==baseline
        passed(stage)
        stage='ordered-candidate-migration-application'
        run(['supabase','migration','up','--local'],timeout=240)
        assert sql('select version from supabase_migrations.schema_migrations order by version desc limit 1;').strip()==version
        sql("notify pgrst,'reload schema';")
        # CLI status contains LOCAL test credentials. Mode 0600; never log/upload it.
        local=json.loads(run(['supabase','status','--output','json']))
        required=('API_URL','ANON_KEY','SERVICE_ROLE_KEY')
        assert all(local.get(k) for k in required)
        from urllib.parse import urlparse
        url=urlparse(local['API_URL']);assert url.scheme=='http' and url.hostname in ('127.0.0.1','localhost') and url.port==54321
        secrets=work/'local-status.json';secrets.write_text(json.dumps({k:local[k] for k in required}));secrets.chmod(0o600)
        passed(stage)
        stage='real-local-auth-postgrest-store-and-concurrency'
        result=run(['node',str(ROOT/'scripts/disposable-supabase/integration.mjs'),str(secrets)],timeout=180)
        report['integration']=json.loads(result);passed(stage)
        stage='independent-real-RLS-and-permissions'
        sql((ROOT/'staging/disposable-supabase/assert-rls.sql').read_text());passed(stage)
        stage='client-and-trusted-contract-regressions'
        for check in ['check-mission11-records.mjs','check-mission11-intelligence.mjs']:
            run(['node',str(ROOT/'scripts'/check)])
        core=(ROOT/'src/core/businessContentRecords.mjs').read_bytes()
        for path in ['supabase/functions/_shared/businessContentRecords.mjs','supabase/functions/busy-mini-apps/businessContentRecords.mjs','supabase/functions/busy-website-worker/businessContentRecords.mjs','standalone/template/businessContentRecords.mjs']:
            assert (ROOT/path).read_bytes()==core
        passed(stage)
        stage='disposable-data-preserving-rollback-and-reapply'
        before=sql("select jsonb_agg(to_jsonb(t) order by business_id,id)::text from public.busy_business_content t;")
        dump=run(['docker','exec',DB,'pg_dump','-U','postgres','-d','postgres','--data-only','--column-inserts','--table=public.busy_business_content'])
        sql("set busy.disposable_rehearsal='approved-local-only';\n"+(ROOT/'staging/disposable-supabase/rollback.sql').read_text())
        # Existing schema is preserved; candidate metadata is kept for rehearsal only.
        assert fingerprint()==baseline
        sql(candidate.read_text());sql(dump)
        assert sql("select jsonb_agg(to_jsonb(t) order by business_id,id)::text from public.busy_business_content t;")==before
        assert sql("select count(*) from public.busy_businesses;").strip()=='3'
        passed(stage)
        report['result']='passed';report['releaseApproved']=False;save()
    except Exception as exc:
        progress=work/'integration-progress-public.json'
        if progress.exists(): report['integrationProgress']=json.loads(progress.read_text())
        report['result']='failed';report['stages'].append({'stage':stage,'result':'failed','reason':type(exc).__name__});save()
        raise SystemExit('Disposable rehearsal failed at '+stage+'; see report summary') from None

if __name__=='__main__': main()
