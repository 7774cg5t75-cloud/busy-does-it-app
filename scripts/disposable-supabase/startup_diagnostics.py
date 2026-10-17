"""Bounded local-only startup observations; never publishes raw Docker/CLI output."""
import errno,ipaddress,json,socket,subprocess,threading
PROJECT='busy-disposable-review'
NETWORK='busy-db-review-internal'
SERVICES={'db':(5432,54322),'kong':(8000,54321),'auth':None,'rest':None,'realtime':None,'storage':None}
FORMAT='{"project":{{json (index .Config.Labels "com.supabase.cli.project")}},"status":{{json .State.Status}},"health":{{if .State.Health}}{{json .State.Health.Status}}{{else}}"none"{{end}},"networks":{{json .NetworkSettings.Networks}},"ports":{{json .NetworkSettings.Ports}}}'

def tcp_result(host,port):
    try:
        with socket.create_connection((host,port),timeout=0.25):return 'open'
    except ConnectionRefusedError:return 'refused'
    except (TimeoutError,socket.timeout):return 'timeout'
    except OSError as exc:
        return 'unreachable' if exc.errno in (errno.ENETUNREACH,errno.EHOSTUNREACH) else 'error'

def docker_read(args):
    try:
        result=subprocess.run(['docker',*args],capture_output=True,text=True,timeout=1)
        if result.returncode:return None
        return json.loads(result.stdout)
    except (OSError,subprocess.TimeoutExpired,ValueError):return None

def sample():
    # No service discovery, arbitrary hosts, logs, environment dumps or SQL.
    net=docker_read(['network','inspect','--format','{{json .Internal}}',NETWORK])
    result={'networkInternal':net is True,'services':{}}
    for service,ports in SERVICES.items():
        name='supabase_'+service+'_'+PROJECT
        meta=docker_read(['inspect','--format',FORMAT,name])
        row={'observed':False}
        if isinstance(meta,dict) and meta.get('project')==PROJECT:
            row={'observed':True,
                 'status':meta.get('status') if meta.get('status') in ('created','running','paused','restarting','removing','exited','dead') else 'unknown',
                 'health':meta.get('health') if meta.get('health') in ('none','starting','healthy','unhealthy') else 'unknown',
                 'isolatedNetworkOnly':set(meta.get('networks') or {})=={NETWORK}}
            if ports:
                container_port,host_port=ports
                bindings=(meta.get('ports') or {}).get(str(container_port)+'/tcp') or []
                row['expectedPortPublished']=any(b.get('HostPort')==str(host_port) for b in bindings)
                row['runnerLoopback']=tcp_result('127.0.0.1',host_port)
                row['runnerDirectContainer']='not-probed'
                # Probe only this project's address on the verified internal network.
                if net is True and row['isolatedNetworkOnly']:
                    address=meta['networks'][NETWORK].get('IPAddress','')
                    try:local=ipaddress.ip_address(address)
                    except ValueError:local=None
                    if local and local.version==4 and local.is_private and not local.is_loopback and not local.is_unspecified:
                        row['runnerDirectContainer']=tcp_result(str(local),container_port)
        result['services'][service]=row
    return result

def cli_evidence(stdout,stderr):
    text='\n'.join(x.decode(errors='replace') if isinstance(x,bytes) else (x or '') for x in (stdout,stderr)).lower()
    # Only endpoint categories from refused-connection lines, not addresses or URLs.
    categories=set()
    for line in text.splitlines():
        if 'connection refused' not in line:continue
        if any(x in line for x in ('127.0.0.1:54322','localhost:54322','[::1]:54322')):
            categories.add('runner-to-published-postgres')
        elif any(x in line for x in ('127.0.0.1:54321','localhost:54321','[::1]:54321')):
            categories.add('runner-to-published-api-gateway')
        elif 'supabase_db_busy-disposable-review:5432' in line:
            categories.add('postgres-container-name')
        elif any(x in line for x in ('127.0.0.1:5432','localhost:5432','[::1]:5432')):
            categories.add('loopback-postgres-default-port')
        else:categories.add('unclassified-refused-endpoint')
    return {'refusedConnectionCategories':sorted(categories),
            'databaseStartMarker':'starting database...' in text,
            'schemaInitialisationMarker':'initialising schema...' in text,
            'serviceStartMarker':'starting containers...' in text,
            'postgrestReadinessPath':'/rest-admin/v1/ready' in text,
            'cliCleanupMarker':'stopping containers...' in text}

class StartupObserver:
    def __init__(self):
        self.event=threading.Event()
        self.thread=threading.Thread(target=self.watch,daemon=True)
        self.summary={'samples':0,'latest':{},'lastObserved':{},'observerError':False}
    def start(self):self.thread.start()
    def watch(self):
        try:
            while not self.event.is_set():
                observation=sample()
                self.summary['samples']+=1
                self.summary['latest']=observation
                for service,row in observation['services'].items():
                    if row['observed']:self.summary['lastObserved'][service]={'sample':self.summary['samples'],**row}
                if self.event.wait(2):break
        except Exception:
            # Diagnostic failure never masks the real startup failure.
            self.summary['observerError']=True
    def stop(self):
        self.event.set()
        # Every operation in sample has a bounded timeout; join before migrations.
        if self.thread.ident is not None:self.thread.join()
