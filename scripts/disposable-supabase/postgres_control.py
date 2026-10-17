"""Approved PostgreSQL-only control. No Supabase services or application SQL."""
import ipaddress,json,os,pathlib,secrets,socket,subprocess,sys,time
from startup_diagnostics import tcp_result
ROOT=pathlib.Path(__file__).resolve().parents[2]
IMAGE='ghcr.io/supabase/postgres:17.6.1.029' # CLI v2.54.11 pkg/config/templates/Dockerfile
NAME='busy-pg-connectivity-control'
NETWORK=NAME+'-internal'
LABEL='com.busy.disposable.control'
INIT="""set -eu
umask 077
printf '%s\\n' "$POSTGRES_PASSWORD" > /tmp/control-password
initdb -D /tmp/control-data --username=postgres --auth-local=trust --auth-host=scram-sha-256 --pwfile=/tmp/control-password >/dev/null
rm /tmp/control-password
exec postgres -D /tmp/control-data -p 5432 -c listen_addresses='*' -c unix_socket_directories=/tmp -c shared_preload_libraries='' -c cron.launch_active_jobs=off
"""
FORMAT='{"owner":{{json (index .Config.Labels "com.busy.disposable.control")}},"status":{{json .State.Status}},"exitCode":{{json .State.ExitCode}},"oom":{{json .State.OOMKilled}},"health":{{if .State.Health}}{{json .State.Health.Status}}{{else}}"none"{{end}},"networks":{{json .NetworkSettings.Networks}},"configured":{{json .HostConfig.PortBindings}},"effective":{{json .NetworkSettings.Ports}}}'

def preflight():
    sha=os.environ.get('BUSY_APPROVED_SHA','')
    import re
    if not (os.environ.get('GITHUB_ACTIONS')=='true' and os.environ.get('RUNNER_ENVIRONMENT')=='github-hosted'
        and os.environ.get('GITHUB_EVENT_NAME')=='workflow_dispatch'
        and os.environ.get('GITHUB_REPOSITORY')=='7774cg5t75-cloud/busy-does-it-app'
        and os.environ.get('GITHUB_REF')=='refs/heads/codex/disposable-supabase-review'
        and os.environ.get('BUSY_DISPOSABLE_APPROVAL')=='APPROVE_DISPOSABLE_TEST_ONLY'
        and os.environ.get('BUSY_DB_CONTROL_MODE')=='postgres-control'
        and re.fullmatch('[0-9a-f]{40}',sha) and sha==os.environ.get('GITHUB_SHA')
        and re.fullmatch('[0-9]+',os.environ.get('GITHUB_RUN_ID',''))
        and re.fullmatch('[0-9]+',os.environ.get('GITHUB_RUN_ATTEMPT',''))):
        raise RuntimeError('Approved GitHub-hosted control required')
    for key in ('SUPABASE_ACCESS_TOKEN','SUPABASE_DB_PASSWORD','DATABASE_URL','PGHOST','PGSERVICE','SUPABASE_URL'):
        if os.environ.get(key):raise RuntimeError('Remote credential variable refused')
    work=pathlib.Path(os.environ['BUSY_DB_WORKDIR']).resolve()
    if work!=pathlib.Path(os.environ['RUNNER_TEMP']).resolve()/NAME:
        raise RuntimeError('Dedicated runner temporary directory required')
    return work,sha+':'+os.environ['GITHUB_RUN_ID']+':'+os.environ['GITHUB_RUN_ATTEMPT']

def command(args,timeout=10):
    return subprocess.run(args,text=True,capture_output=True,timeout=timeout)

def read(args):
    result=command(['docker',*args],timeout=2)
    return json.loads(result.stdout) if result.returncode==0 else None

def bindings(value):
    ports=(value or {}).get('5432/tcp') or []
    return {'observedBindingCount':len(ports),'expectedPort':any(p.get('HostPort')=='54322' for p in ports),
            'loopbackOnly':bool(ports) and all(p.get('HostIp')=='127.0.0.1' for p in ports)}

def observe(owner):
    meta=read(['inspect','--format',FORMAT,NAME])
    if not meta or meta.get('owner')!=owner:raise RuntimeError('Owned control container missing')
    internal=read(['network','inspect','--format','{{json .Internal}}',NETWORK])
    if internal is not True or set(meta.get('networks') or {})!={NETWORK}:
        raise RuntimeError('Control isolation invariant failed')
    ready=False;direct='not-probed'
    if meta['status']=='running':
        address=ipaddress.ip_address(meta['networks'][NETWORK].get('IPAddress',''))
        if address.version!=4 or not address.is_private or address.is_loopback or address.is_unspecified:
            raise RuntimeError('Control internal address unavailable')
        ready=command(['docker','exec',NAME,'pg_isready','-U','postgres','-h','127.0.0.1','-p','5432','-t','1'],timeout=2).returncode==0
        direct=tcp_result(str(address),5432)
    return {'status':meta['status'] if meta['status'] in ('created','running','restarting','exited','dead') else 'unknown',
            'health':meta['health'] if meta['health'] in ('none','starting','healthy','unhealthy') else 'unknown',
            'exitCode':meta['exitCode'] if type(meta['exitCode']) is int else None,
            'oomKilled':meta['oom'] is True,'internalOnly':True,
            'configuredBindings':bindings(meta.get('configured')),
            'effectiveBindings':bindings(meta.get('effective')),
            'inContainerReady':ready,
            'runnerDirect':direct,
            'runnerPublished':tcp_result('127.0.0.1',54322)}

def conclusion(row):
    if not row or not row.get('inContainerReady'):return 'postgres-not-ready'
    if row['runnerDirect']!='open':return 'direct-path-failed'
    if row['runnerPublished']!='open':return 'published-path-failed'
    return 'all-paths-open'

def cleanup(owner):
    # Refuse to touch another run's resources, even at these fixed names.
    ok=True
    for kind,name,args in [('container',NAME,['rm','--force','--volumes',NAME]),
                           ('network',NETWORK,['network','rm',NETWORK])]:
        try:
            template='{{json (index .Config.Labels "'+LABEL+'")}}' if kind=='container' else '{{json (index .Labels "'+LABEL+'")}}'
            existing=read(['inspect','--type',kind,'--format',template,name])
            if existing is None:continue
            if existing!=owner:ok=False;continue
            if command(['docker',*args]).returncode:ok=False
        except (OSError,subprocess.TimeoutExpired,ValueError):ok=False
    return ok

def main(cleanup_only=False):
    work,owner=preflight()
    # Verify the checked-out source even for the fallback cleanup path.
    if command(['git','-C',str(ROOT),'rev-parse','HEAD']).stdout.strip()!=os.environ['GITHUB_SHA']:
        raise RuntimeError('Checked-out source differs from approved SHA')
    if cleanup_only:
        ok=cleanup(owner)
        (work/'password.env').unlink(missing_ok=True)
        return 0 if ok else 1
    if work.exists():raise RuntimeError('Fresh control workspace required')
    work.mkdir(mode=0o700)
    report={'source':os.environ['GITHUB_SHA'],'scope':'PostgreSQL-only isolated connectivity control',
            'result':'failed','stages':[],'releaseApproved':False,
            'control':{'imageVersion':IMAGE,'transitions':[],'conclusion':'not-established'}}
    def save():(work/'report.json').write_text(json.dumps(report,indent=2)+'\n')
    operation='preflight'
    def run(label,args,timeout=10):
        nonlocal operation
        operation=label
        result=command(args,timeout)
        if result.returncode:raise RuntimeError('Control operation failed')
        return result.stdout
    save()
    try:
        # No fallback to another image or noninternal network.
        for kind,name in [('container',NAME),('network',NETWORK)]:
            if read(['inspect','--type',kind,name]) is not None:raise RuntimeError('Control resource already exists')
        operation='loopback-port-availability'
        with socket.socket() as probe:probe.bind(('127.0.0.1',54322))
        run('image-pull',['docker','pull',IMAGE],180)
        image=json.loads(run('image-inspect',['docker','image','inspect',IMAGE]))[0]
        image_id=image['Id']
        import re
        if not re.fullmatch('sha256:[0-9a-f]{64}',image_id):raise RuntimeError('Invalid image identity')
        report['control']['imageId']=image_id
        report['control']['imageDigests']=[v for v in image.get('RepoDigests',[]) if re.fullmatch(r'ghcr\.io/supabase/postgres@sha256:[0-9a-f]{64}',v)]
        run('network-create',['docker','network','create','--internal','--label',LABEL+'='+owner,NETWORK])
        if read(['network','inspect','--format','{{json .Internal}}',NETWORK]) is not True:
            raise RuntimeError('Internal network required')
        password=work/'password.env'
        fd=os.open(password,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(fd,'w') as handle:handle.write('POSTGRES_PASSWORD='+secrets.token_hex(32)+'\n')
        run('container-create',['docker','create','--name',NAME,'--label',LABEL+'='+owner,
            '--network',NETWORK,'--publish','127.0.0.1:54322:5432','--env-file',str(password),
            '--user','postgres','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges',
            '--memory','1g','--cpus','1','--tmpfs','/tmp:rw,nosuid,nodev,size=512m,mode=1777',
            '--shm-size','128m','--health-cmd','pg_isready -U postgres -h 127.0.0.1 -p 5432 -t 1',
            '--health-interval','2s','--health-timeout','1s','--health-start-period','5s','--health-retries','3',
            '--entrypoint','/bin/sh',image_id,'-ec',INIT])
        run('container-start',['docker','start',NAME])
        operation='connectivity-sampling'
        # Always sample the full bounded window, preserving transitions before our cleanup.
        deadline=time.monotonic()+60
        for tick in range(30):
            row=observe(owner)
            report['control']['latest']=row
            previous=report['control']['transitions']
            if not previous or previous[-1]['observation']!=row:
                previous.append({'sample':tick,'observation':row})
            if row['inContainerReady'] and 'firstReady' not in report['control']:
                report['control']['firstReady']={'sample':tick,'observation':row}
            save()
            if row['status'] in ('exited','dead') or time.monotonic()>=deadline:break
            if tick<29:time.sleep(2)
        report['control']['conclusion']=conclusion(report['control'].get('latest'))
        report['result']='passed' if report['control']['conclusion']=='all-paths-open' else 'failed'
    except Exception as exc:
        # Fixed operation/type only. Never publish exceptions, argv or raw subprocess output.
        report['control']['failure']={'operation':operation,'kind':type(exc).__name__ if type(exc) in (RuntimeError,ValueError,OSError,subprocess.TimeoutExpired) else 'control-error'}
    finally:
        save() # Preserve evidence BEFORE removal.
        report['control']['cleanupSucceeded']=cleanup(owner)
        (work/'password.env').unlink(missing_ok=True)
        if not report['control']['cleanupSucceeded']:report['result']='failed'
        save()
    return 0 if report['result']=='passed' else 1

if __name__=='__main__':sys.exit(main(sys.argv[1:]==['--cleanup']))
