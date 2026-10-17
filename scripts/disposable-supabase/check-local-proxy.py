"""Offline security/regression tests: no Docker or network destinations are contacted."""
import copy,json,threading,unittest
from unittest.mock import MagicMock,patch
import local_proxy as proxy
NETWORK_ID='b'*64
def fixtures():
 return ({'id':'c'*64,'project':proxy.PROJECT,'running':True,
          'networks':{proxy.NETWORK:{'NetworkID':NETWORK_ID,'IPAddress':'172.19.0.2'}}},
         {'id':NETWORK_ID,'internal':True,'ipam':[{'Subnet':'172.19.0.0/16'}]})
class ProxyTests(unittest.TestCase):
 def test_rejects_unrelated_noninternal_multinetwork_and_nonlocal_targets(self):
  meta,net=fixtures();self.assertEqual(proxy.verified_address(meta,net,NETWORK_ID),'172.19.0.2')
  cases=[]
  for key,value in [('project','unrelated'),('running',False)]:
   changed=copy.deepcopy(meta);changed[key]=value;cases.append((changed,net))
  for address in ('8.8.8.8','127.0.0.1','169.254.1.2','0.0.0.0','172.20.0.2','172.19.0.0','172.19.255.255','localhost','::1'):
   changed=copy.deepcopy(meta);changed['networks'][proxy.NETWORK]['IPAddress']=address;cases.append((changed,net))
  changed=copy.deepcopy(meta);changed['networks']['external']={};cases.append((changed,net))
  changed=copy.deepcopy(meta);changed['networks'][proxy.NETWORK]['NetworkID']='other';cases.append((changed,net))
  for key,value in [('id','replaced'),('internal',False)]:
   changed=copy.deepcopy(net);changed[key]=value;cases.append((meta,changed))
  for m,n in cases:
   with self.subTest(meta=m,network=n),self.assertRaises(ValueError):
    proxy.verified_address(m,n,NETWORK_ID)
 def test_fixed_service_ports_and_container_replacement_rejection(self):
  meta,net=fixtures();pair=proxy.LocalProxyPair(NETWORK_ID)
  with patch.object(proxy,'docker_read',side_effect=[net,meta,net,meta]) as read:
   self.assertEqual(pair.resolve('postgres'),('172.19.0.2',5432))
   self.assertEqual(pair.resolve('api'),('172.19.0.2',8000))
   self.assertEqual([c.args[0][-1] for c in read.call_args_list],
    [proxy.NETWORK,'supabase_db_'+proxy.PROJECT,proxy.NETWORK,'supabase_kong_'+proxy.PROJECT])
  changed=copy.deepcopy(meta);changed['id']='d'*64
  with patch.object(proxy,'docker_read',side_effect=[net,changed]),self.assertRaises(ValueError):pair.resolve('postgres')
  with self.assertRaises(KeyError):pair.resolve('http://external.example')
 def test_loopback_only_binding_and_partial_start_cleanup(self):
  a,b=MagicMock(),MagicMock();thread=MagicMock();thread.ident=None;thread.is_alive.return_value=False
  with patch.object(proxy.socket,'socket',side_effect=[a,b]),patch.object(proxy.threading,'Thread',return_value=thread):
   pair=proxy.LocalProxyPair(NETWORK_ID);pair.start();pair.stop()
  a.bind.assert_called_once_with(('127.0.0.1',54322));b.bind.assert_called_once_with(('127.0.0.1',54321))
  a.close.assert_called_once();b.close.assert_called_once()
  a,b=MagicMock(),MagicMock();b.bind.side_effect=OSError('PRIVATE conflict')
  with patch.object(proxy.socket,'socket',side_effect=[a,b]),patch.object(proxy.threading,'Thread',return_value=thread):
   pair=proxy.LocalProxyPair(NETWORK_ID)
   with self.assertRaisesRegex(RuntimeError,'Required loopback proxy ports unavailable'):pair.start()
  a.close.assert_called_once();b.close.assert_called_once()
 def test_invalid_target_never_connects_or_discloses_error(self):
  pair=proxy.LocalProxyPair(NETWORK_ID);client=MagicMock();pair.limit.acquire()
  with patch.object(pair,'resolve',side_effect=ValueError('PRIVATE token')),patch.object(proxy.socket,'create_connection') as connect:
   pair.handle('postgres',client);connect.assert_not_called()
  client.close.assert_called_once();self.assertNotIn('PRIVATE',json.dumps(pair.summary()))
  self.assertEqual(pair.summary()['services']['postgres']['rejected'],1)
 def test_capacity_and_nonloopback_clients_are_rejected(self):
  pair=proxy.LocalProxyPair(NETWORK_ID);listener=MagicMock();client=MagicMock()
  for _ in range(16):self.assertTrue(pair.limit.acquire(blocking=False))
  listener.accept.side_effect=[(client,('127.0.0.1',1)),OSError('closed')]
  with patch.object(pair,'resolve') as resolve:pair.accept('postgres',listener);resolve.assert_not_called()
  client.close.assert_called_once()
  pair=proxy.LocalProxyPair(NETWORK_ID);client=MagicMock()
  listener.accept.side_effect=[(client,('10.0.0.1',1)),OSError('closed')]
  with patch.object(pair,'resolve') as resolve:pair.accept('api',listener);resolve.assert_not_called()
  client.close.assert_called_once()
 def test_binary_relay_partial_writes_backpressure_and_half_close(self):
  # Deterministic socket model exercises actual relay with no network permission.
  class Stream:
   def __init__(self,data):
    self.input=bytearray(data);self.output=bytearray();self.closed_write=False;self.max_buffer=0
   def setblocking(self,value):pass
   def recv(self,size):
    count=min(size,2111);data=bytes(self.input[:count]);del self.input[:count];return data
   def send(self,data):
    self.max_buffer=max(self.max_buffer,len(data));count=min(len(data),31)
    self.output.extend(data[:count]);return count
   def shutdown(self,how):self.closed_write=True
  request=b'PRIVATE\x00'+bytes(range(256))*700
  response=b'RESPONSE\x00'+bytes(reversed(range(256)))*700
  a,b=Stream(request),Stream(response)
  def select(reads,writes,errors,timeout):
   return reads,writes,[]
  with patch.object(proxy.select,'select',side_effect=select):proxy.relay(a,b,threading.Event())
  self.assertEqual(bytes(b.output),request);self.assertEqual(bytes(a.output),response)
  self.assertTrue(a.closed_write);self.assertTrue(b.closed_write)
  self.assertLessEqual(max(a.max_buffer,b.max_buffer),65536)
 def test_stop_closes_registered_connections_and_listeners(self):
  pair=proxy.LocalProxyPair(NETWORK_ID);listener=MagicMock();connection=MagicMock()
  pair.listeners=[listener];pair.connections.add(connection)
  pair.stop();self.assertTrue(pair.stop_event.is_set())
  listener.close.assert_called_once();connection.shutdown.assert_called_once_with(proxy.socket.SHUT_RDWR)
  connection.close.assert_called_once()
if __name__=='__main__':unittest.main(verbosity=2)
