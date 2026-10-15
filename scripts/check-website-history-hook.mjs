import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createWebsiteHistoryCheckpoint,websiteHistoryCheckpointKey} from '../src/core/websiteHistoryCheckpoint.mjs';
import {websiteDraftHasScope} from '../src/core/websiteDraftScope.mjs';
import {createWebsiteDraftHistory} from '../src/core/websiteDraftHistory.mjs';
// Small deterministic hook runner. Executes the actual hook; does not simulate
// native rendering, process termination or SecureStore's platform capacity.
const code=readFileSync('src/screens/useWebsiteDraftHistory.js','utf8').replace(/^import .*;\n/gm,'').replace('export {useWebsiteDraftHistory};','return useWebsiteDraftHistory;');
const scope={ownerId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',businessId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',websiteId:'site'};
const draft={id:'site',businessId:scope.businessId,generation:2,sections:[],publicStatus:'unchanged'};let writes=0,release;
const data=new Map([[websiteHistoryCheckpointKey(scope),'not valid JSON']]);
const storage={getItemAsync:async key=>data.get(key)||null,setItemAsync:async(k,v)=>{writes++;data.set(k,v);}};
let slots=[],index=0,effects=[],dirty=false,output,args={...scope,draft};
const same=(a,b)=>a&&b&&a.length===b.length&&a.every((x,i)=>Object.is(x,b[i]));
const React={useRef(v){const i=index++;return slots[i]||(slots[i]={current:v});},useState(v){const i=index++;if(!(i in slots))slots[i]=v;return [slots[i],x=>{const next=typeof x==='function'?x(slots[i]):x;if(!Object.is(next,slots[i])){slots[i]=next;dirty=true;}}];},useEffect(work,deps){const i=index++,old=slots[i];if(!old||!same(old.deps,deps)){effects.push(()=>{old?.cleanup?.();slots[i]={deps,cleanup:work()};});}}};
const hook=Function('React','SecureStore','createWebsiteHistoryCheckpoint','websiteHistoryCheckpointKey','createWebsiteDraftHistory','websiteDraftHasScope',code)(React,storage,createWebsiteHistoryCheckpoint,websiteHistoryCheckpointKey,createWebsiteDraftHistory,websiteDraftHasScope);
function render(){index=0;effects=[];dirty=false;output=hook(args);for(const effect of effects)effect();}
async function flush(){for(let i=0;i<12;i++){await new Promise(r=>setImmediate(r));if(dirty)render();}}
render();await flush();assert.equal(writes,0,'a rejected saved record must not be overwritten merely by opening');assert.match(output.websiteRecoveryNotice,/JSON|Unexpected/);
args={...args,draft:{...draft,generation:3}};render();await flush();assert.equal(writes,1,'a subsequent owner edit may establish a fresh checkpoint');
// Failed recovery must not block ordinary editing; scope checks remain live.
args={...args,businessId:'cccccccc-cccc-4ccc-8ccc-cccccccccccc'};render();await flush();assert.equal(output.websiteHistoryIsCurrent(),false);assert.equal(writes,1);
console.log('PASS: actual hook preserves rejected recovery, saves a later edit and blocks cached foreign workspace history. Deterministic hook runner/fake native storage only.');
