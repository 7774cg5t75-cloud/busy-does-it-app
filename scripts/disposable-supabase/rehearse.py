"""Manual-only GitHub-hosted disposable rehearsal. Never accepts a database URL."""
import hashlib,json,os,pathlib,re,shutil,subprocess,time
from startup_diagnostics import StartupObserver,cli_evidence
from local_proxy import LocalProxyPair
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

def command_label(args):
    # Never publish argv: SQL, paths, tokens and row data may occur in arguments.
    if args == ['supabase','--version']: return 'supabase-version'
    for command in (['migration','new'],['migration','up'],['start'],['stop'],['status']):
        if args == ['supabase',*command,'--help']:
            return 'supabase-'+'-'.join(command)+'-help'
    if args == ['supabase','--network-id',NETWORK,'start']: return 'supabase-local-start'
    if args == ['supabase','migration','up','--local']: return 'supabase-local-migration-up'
    if args == ['supabase','migration','new','shared_business_content_records']: return 'supabase-migration-new'
    if args == ['supabase','status','--output','json']: return 'supabase-local-status'
    if len(args)==3 and args[0]=='node' and args[1]==str(ROOT/'scripts/disposable-supabase/integration.mjs'):
        return 'local-node-integration'
    return 'other-local-command'

def failure_details(args,stage,exit_code=None,stdout='',stderr='',kind='exit'):
    # Only fixed indicators leave private scratch, never arbitrary output.
    # An indicator is evidence, not a root-cause verdict.
    output='\n'.join(x.decode(errors='replace') if isinstance(x,bytes) else (x or '') for x in (stdout,stderr)).lower()
    signatures={
        'unknown-flag': r'unknown flag:',
        'config-parse-error': r'failed to parse config|error parsing config',
        'image-pull-error': r'failed to pull|pull access denied|manifest unknown',
        'container-unhealthy': r'container[^\n]*unhealthy|unhealthy[^\n]*container',
        'connection-refused': r'connection refused',
        'network-unreachable': r'network is unreachable',
        'deadline-exceeded': r'context deadline exceeded',
        'docker-unavailable': r'cannot connect to the docker daemon',
    }
    return {'command':command_label(args),'stage':stage,'failureKind':kind,
            'exitCode':exit_code,'indicators':[key for key,pattern in signatures.items() if re.search(pattern,output)]}

SCHEDULER_SQL={
    'scheduler-check-admin':"select rolsuper from pg_roles where rolname=current_user;\n",
    'scheduler-create-extension':"create extension if not exists pg_cron;\n",
    'scheduler-disable-jobs':"alter system set cron.launch_active_jobs='off';\n",
    'scheduler-reload-config':"select pg_reload_conf();\n",
    'scheduler-verify-disabled':"show cron.launch_active_jobs;\n",
}
def scheduler_command(operation):
    # Use the pinned image's existing TCP-loopback HBA path, not its SCRAM-only
    # admin Unix socket rule. No password, HBA edit or fallback authentication.
    # Administrative role is confined to these exact reviewed local statements.
    return (['docker','exec','-i',DB,'psql','-X','-qAt','-w','-h','127.0.0.1','-p','5432','-U','supabase_admin',
             '-d','postgres','-v','ON_ERROR_STOP=1','-v','VERBOSITY=sqlstate'],SCHEDULER_SQL[operation])

def safe_sqlstate(stderr):
    text=stderr.decode(errors='replace') if isinstance(stderr,bytes) else (stderr or '')
    for line in text.splitlines():
        match=re.fullmatch(r'(?:psql:[^\r\n]*:\d+:\s*)?(?:ERROR|FATAL|PANIC):\s+([0-9A-Z]{5})\s*',line)
        if match:return match[1]
    return None

def scheduler_failure_category(exit_code,stderr,kind='exit'):
    # Classify fixed error signatures only; never publish the matching text.
    if kind=='timeout':return 'timeout'
    if kind=='launch-error':return 'process-launch'
    text=(stderr.decode(errors='replace') if isinstance(stderr,bytes) else (stderr or '')).lower()
    if any(marker in text for marker in ('no password supplied','password authentication failed',
            'peer authentication failed','no pg_hba.conf entry','authentication failed')):
        return 'authentication'
    if any(marker in text for marker in ('connection refused','connection timed out',
            'could not connect','could not translate host name','server closed the connection',
            'no such file or directory')):
        return 'connection'
    if exit_code==3:return 'sql-execution'
    if exit_code==2:return 'connection-or-authentication'
    return 'unclassified'

def contain_scheduler(execute):
    if execute('scheduler-check-admin').strip()!='t':
        raise RuntimeError('Existing disposable administrator must be superuser')
    execute('scheduler-create-extension')
    execute('scheduler-disable-jobs')
    if execute('scheduler-reload-config').strip()!='t':
        raise RuntimeError('Scheduler configuration reload was not signalled')
    # Reload is asynchronous. Each call opens a fresh session; never accept on/unknown.
    for attempt in range(10):
        value=execute('scheduler-verify-disabled').strip()
        if value=='off':return
        if value!='on':raise RuntimeError('Unexpected scheduler setting')
        if attempt<9:time.sleep(0.2)
    raise RuntimeError('Scheduler remained enabled after bounded reload wait')

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
    proxy=None
    def save(): (work/'report.json').write_text(json.dumps(report,indent=2)+'\n')
    def run(args,stdin=None,timeout=240,operation=None):
        if operation is not None and (args,stdin)!=scheduler_command(operation):
            raise RuntimeError('Unreviewed scheduler command refused')
        observer=StartupObserver() if command_label(args)=='supabase-local-start' else None
        def record_failure(exit_code=None,stdout='',stderr='',kind='exit'):
            private=work/'failure-private.log'
            raw='\n'.join(x.decode(errors='replace') if isinstance(x,bytes) else (x or '') for x in (stdout,stderr))
            fd=os.open(private,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
            with os.fdopen(fd,'w') as handle: handle.write(raw)
            report['failedCommand']=failure_details(args,stage,exit_code,stdout,stderr,kind)
            if command_label(args)=='local-node-integration':
                # Entry-point parse/import failures can precede the first progress file.
                text=stderr.decode(errors='replace') if isinstance(stderr,bytes) else (stderr or '')
                report['failedCommand']['category']='node-runtime-initialisation' if any(marker in text for marker in ('SyntaxError','ERR_MODULE_NOT_FOUND','ERR_UNKNOWN_BUILTIN_MODULE','ERR_MODULE_NOT_EXPORTED')) else 'integration-process-failure'
            if operation is not None:
                report['failedCommand']['command']=operation
                report['failedCommand']['sqlstate']=safe_sqlstate(stderr)
                report['failedCommand']['connectionMode']='container-loopback-tcp'
                report['failedCommand']['category']=scheduler_failure_category(exit_code,stderr,kind)
            if observer:
                observer.stop()
                report['failedCommand']['startupObservations']=observer.summary
                report['failedCommand']['cliEvidence']=cli_evidence(stdout,stderr)
            save()
        if observer:observer.start()
        try:
            result=subprocess.run(args,input=stdin,text=True,cwd=work,capture_output=True,timeout=timeout)
        except subprocess.TimeoutExpired as exc:
            record_failure(stdout=exc.stdout,stderr=exc.stderr,kind='timeout')
            raise RuntimeError('Local command timed out; see sanitised report') from None
        except OSError:
            record_failure(kind='launch-error')
            raise RuntimeError('Local command could not start; see sanitised report') from None
        finally:
            if observer:observer.stop()
        if result.returncode:
            record_failure(result.returncode,result.stdout,result.stderr)
            raise RuntimeError('Local command failed; see sanitised report')
        return result.stdout
    def scheduler(operation):
        state=report.setdefault('schedulerContainment',{'operation':None,'completed':[],
            'connectionMode':'container-loopback-tcp'})
        state['operation']=operation;save()
        args,text=scheduler_command(operation)
        result=run(args,text,operation=operation)
        state['completed'].append(operation);save()
        return result
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
        stage='cli-discovery'
        report['cliVersion']=run(['supabase','--version']).strip()
        if report['cliVersion']!='2.54.11': raise RuntimeError('Reviewed CLI version required')
        # Discover all command/flag surfaces before invoking them. No guessed remote defaults.
        for command in (['migration','new'],['migration','up'],['start'],['stop'],['status']):run(['supabase',*command,'--help'])
        stage='isolated-network-creation'
        shutil.copyfile(ROOT/'staging/disposable-supabase/config.toml',work/'supabase/config.toml')
        run(['docker','network','create','--internal',NETWORK])
        network=json.loads(run(['docker','network','inspect',NETWORK]))[0]
        assert network['Internal'] is True
        stage='isolated-loopback-proxy'
        proxy=LocalProxyPair(network['Id'])
        proxy.start()
        # Empty migration directory: historical cron never starts before egress isolation.
        stage='isolated-stack-start'
        run(['supabase','--network-id',NETWORK,'start'],timeout=900)
        stage='isolated-stack-verification'
        containers=json.loads(run(['docker','network','inspect',NETWORK]))[0]['Containers']
        if not containers: raise RuntimeError('Isolated containers missing')
        report['images']=[]
        for cid in containers:
            meta=json.loads(run(['docker','inspect',cid]))[0]
            assert set(meta['NetworkSettings']['Networks'])=={NETWORK}
            image=json.loads(run(['docker','image','inspect',meta['Image']]))[0]
            report['images'].append({'name':meta['Name'],'id':meta['Image'],'digests':image.get('RepoDigests',[])})
        # Supabase Postgres supplies real Auth/Storage schemas, not mocked roles.
        stage='scheduler-containment'
        contain_scheduler(scheduler)
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

    finally:
        if proxy:
            try:
                proxy.stop()
            except RuntimeError:
                report['result']='failed'
                raise SystemExit('Local proxy cleanup failed') from None
            finally:
                report['localProxy']=proxy.summary()
                save()

if __name__=='__main__': main()
