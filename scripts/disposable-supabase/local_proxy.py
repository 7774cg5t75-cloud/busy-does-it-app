"""Fixed loopback-only forwards into the verified egress-isolated Supabase network."""
import ipaddress,select,socket,threading,time
from startup_diagnostics import docker_read
PROJECT='busy-disposable-review'
NETWORK='busy-db-review-internal'
TARGETS={'postgres':('supabase_db_'+PROJECT,54322,5432),'api':('supabase_kong_'+PROJECT,54321,8000)}
META='{"id":{{json .Id}},"project":{{json (index .Config.Labels "com.supabase.cli.project")}},"running":{{json .State.Running}},"networks":{{json .NetworkSettings.Networks}}}'
NET='{"id":{{json .Id}},"internal":{{json .Internal}},"ipam":{{json .IPAM.Config}}}'

def verified_address(meta,network,network_id):
    if not isinstance(network,dict) or network.get('id')!=network_id or network.get('internal') is not True:
        raise ValueError('Internal network identity mismatch')
    if not isinstance(meta,dict) or meta.get('project')!=PROJECT or meta.get('running') is not True:
        raise ValueError('Disposable service unavailable')
    networks=meta.get('networks') or {}
    if set(networks)!={NETWORK} or networks[NETWORK].get('NetworkID')!=network_id:
        raise ValueError('Service network isolation mismatch')
    address=ipaddress.ip_address(networks[NETWORK].get('IPAddress',''))
    if address.version!=4 or not address.is_private or address.is_loopback or address.is_link_local or address.is_unspecified:
        raise ValueError('Invalid internal address')
    subnets=[ipaddress.ip_network(entry['Subnet']) for entry in network.get('ipam',[]) if entry.get('Subnet')]
    if not any(n.version==4 and address in n and address not in (n.network_address,n.broadcast_address) for n in subnets):
        raise ValueError('Address outside verified internal subnet')
    return str(address)

def relay(client,upstream,stop):
    # Bounded buffering, partial writes and half-close; no payload inspection/logging.
    sockets=(client,upstream);peer={client:upstream,upstream:client}
    buffers={s:bytearray() for s in sockets};eof=set();shutdown=set()
    for s in sockets:s.setblocking(False)
    while not stop.is_set():
        for source in eof:
            destination=peer[source]
            if not buffers[destination] and destination not in shutdown:
                destination.shutdown(socket.SHUT_WR);shutdown.add(destination)
        if len(eof)==2 and not any(buffers.values()):return
        readable=[s for s in sockets if s not in eof and len(buffers[peer[s]])<65536]
        writable=[s for s in sockets if buffers[s]]
        reads,writes,_=select.select(readable,writable,[],0.2)
        for s in reads:
            try:data=s.recv(min(16384,65536-len(buffers[peer[s]])))
            except BlockingIOError:continue
            if data:buffers[peer[s]].extend(data)
            else:eof.add(s)
        for s in writes:
            try:count=s.send(buffers[s])
            except BlockingIOError:continue
            if count==0:raise OSError('Closed TCP forward')
            del buffers[s][:count]

class LocalProxyPair:
    def __init__(self,network_id):
        self.network_id=network_id
        self.stop_event=threading.Event();self.lock=threading.Lock()
        self.limit=threading.BoundedSemaphore(16)
        self.listeners=[];self.threads=[];self.workers=set();self.connections=set();self.ids={}
        self.counts={s:{'accepted':0,'forwarded':0,'rejected':0} for s in TARGETS}
    def resolve(self,service):
        name,_,port=TARGETS[service] # Never supplied by a request or payload.
        network=docker_read(['network','inspect','--format',NET,NETWORK])
        meta=docker_read(['inspect','--type','container','--format',META,name])
        address=verified_address(meta,network,self.network_id)
        identity=meta.get('id')
        if not isinstance(identity,str) or len(identity)!=64 or any(c not in '0123456789abcdef' for c in identity):
            raise ValueError('Invalid container identity')
        with self.lock:
            if self.ids.setdefault(service,identity)!=identity:raise ValueError('Service replaced during rehearsal')
        return address,port
    def bump(self,service,key):
        with self.lock:self.counts[service][key]+=1
    def summary(self):
        with self.lock:
            return {'listeners':'ipv4-loopback-only','targets':'verified-project-internal-only',
                    'services':{s:dict(v) for s,v in self.counts.items()}}
    def start(self):
        try:
            # Reserve both before CLI startup; fail on conflict, with no fallback.
            for service,(_,port,_) in TARGETS.items():
                listener=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
                self.listeners.append(listener)
                listener.bind(('127.0.0.1',port));listener.listen(16);listener.settimeout(0.2)
                self.threads.append(threading.Thread(target=self.accept,args=(service,listener),daemon=True))
            for thread in self.threads:thread.start()
        except Exception:
            self.stop()
            raise RuntimeError('Required loopback proxy ports unavailable') from None
    def accept(self,service,listener):
        while not self.stop_event.is_set():
            try:client,address=listener.accept()
            except socket.timeout:continue
            except OSError:return
            if not ipaddress.ip_address(address[0]).is_loopback or not self.limit.acquire(blocking=False):
                client.close();self.bump(service,'rejected');continue
            self.bump(service,'accepted')
            with self.lock:
                if self.stop_event.is_set():
                    client.close();self.limit.release();return
                self.connections.add(client)
                thread=threading.Thread(target=self.handle,args=(service,client),daemon=True)
                self.workers.add(thread);thread.start()
    def handle(self,service,client):
        upstream=None
        try:
            destination=self.resolve(service)
            if self.stop_event.is_set():return
            upstream=socket.create_connection(destination,timeout=2)
            with self.lock:self.connections.add(upstream)
            self.bump(service,'forwarded')
            relay(client,upstream,self.stop_event)
        except (OSError,ValueError,TypeError,KeyError):
            self.bump(service,'rejected') # No address, payload or raw exception output.
        finally:
            client.close()
            if upstream:upstream.close()
            self.limit.release()
            with self.lock:
                self.connections.discard(client);self.connections.discard(upstream)
                self.workers.discard(threading.current_thread())
    def stop(self):
        self.stop_event.set()
        for listener in self.listeners:listener.close()
        with self.lock:
            connections=list(self.connections);threads=[*self.threads,*self.workers]
        for connection in connections:
            try:connection.shutdown(socket.SHUT_RDWR)
            except OSError:pass
            connection.close()
        deadline=time.monotonic()+6
        for thread in threads:
            if thread.ident is not None:thread.join(max(0,deadline-time.monotonic()))
        if any(thread.is_alive() for thread in threads):
            raise RuntimeError('Local proxy threads did not stop')
