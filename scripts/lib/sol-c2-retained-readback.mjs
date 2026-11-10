// Local adapters for the EXISTING management collectors and private writer.
// No native/tool/provider/credential/filesystem implementation is supplied.
// "tool-result" means exact returned DATA, not HTTP or native bundle bytes.
import {createHash} from 'node:crypto';
import {stableJson} from '../../src/core/stableJson.mjs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const refused=()=>Error('C2_READBACK_RETENTION_UNCONFIRMED_INSPECT_ONLY');
const plain=value=>value&&Object.getPrototypeOf(value)===Object.prototype;
function dataOnly(value,seen=new Set(),depth=0,budget={nodes:0}){
 if(depth>40||++budget.nodes>50000)throw refused();
 if(typeof value==='string'){if(Buffer.byteLength(value)>4194304)throw refused();return;}
 if(value===null||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value))return;
 if((!Array.isArray(value)&&!plain(value))||seen.has(value)||Object.getOwnPropertySymbols(value).length)throw refused();
 if(Array.isArray(value)&&value.length>50000)throw refused();
 const descriptors=Object.values(Object.getOwnPropertyDescriptors(value));
 if(descriptors.some(d=>!Object.hasOwn(d,'value')))throw refused();
 seen.add(value);for(const d of descriptors)dataOnly(d.value,seen,depth+1,budget);seen.delete(value);
}
function snapshot(value){dataOnly(value);return structuredClone(value);}
function capabilities(options,names){
 if(!plain(options)||Object.getOwnPropertySymbols(options).length)throw refused();
 const descriptors=Object.getOwnPropertyDescriptors(options);
 if(Object.keys(descriptors).sort().join(',')!==[...names].sort().join(',')||Object.values(descriptors).some(d=>!Object.hasOwn(d,'value')))throw refused();
 return Object.fromEntries(names.map(name=>[name,descriptors[name].value]));
}
async function retainExact(retain,kind,stage,data){
 const bytes=stableJson(snapshot(data))+'\n';if(Buffer.byteLength(bytes)>4194304)throw refused();
 const expected=sha(bytes),ack=await retain(Object.freeze({kind,stage,bytes}));
 if(ack?.retained!==true||ack.fileSynced!==true||ack.directorySynced!==true||ack.sha256!==expected)throw refused();
 return {retained:true,fileSynced:true,directorySynced:true,sha256:expected};
}
/** Collect once. Save returned tool DATA before normalization; save normalized
 * DATA before returning. Collection time is a separate actual clock sample.
 * Existing ROOT checkedAt/observedAt fields are never refreshed here. Nested
 * projection/time semantics require the exact trusted normalizer and existing
 * validator; these adapters do not establish native provenance themselves. */
export function createSolC2RetainedReadbackPort(options){
 const {kind,collect,normalize,retain,clock}=capabilities(options,['kind','collect','normalize','retain','clock']);
 if(!['catalogue','function','database'].includes(kind)||[collect,normalize,retain,clock].some(f=>typeof f!=='function'))throw refused();
 let used=false;
 return async()=>{
  if(used)throw refused();used=true;
  try{
   const collected=await collect(),collectedAt=clock();
   if(!Number.isSafeInteger(collectedAt)||collectedAt<=0)throw refused();
   const original=snapshot(collected);
   await retainExact(retain,kind,'tool-result',{version:'busy.sol-C2-retained-management-data.v1',kind,collectedAt,toolResult:original});
   const normalized=snapshot(normalize(structuredClone(original),Object.freeze({collectedAt})));
   if(!plain(normalized))throw refused();
   if(Object.hasOwn(normalized,'checkedAt')&&(!Number.isSafeInteger(normalized.checkedAt)||normalized.checkedAt<=0||normalized.checkedAt>collectedAt))throw refused();
   if(plain(original))for(const field of ['checkedAt','observedAt'])if(Object.hasOwn(original,field)&&normalized[field]!==original[field])throw refused();
   await retainExact(retain,kind,'normalized',{version:'busy.sol-C2-retained-normalized-data.v1',kind,collectedAt,normalized});
   return structuredClone(normalized);
  }catch{throw refused();}
 };
}
/** Both successful and failed validator results are retained without copying
 * their contents to public diagnostics. One attempt, exact bytes and fsync. */
export function createSolC2ReadbackResultRetainer(options){
 const {retain}=capabilities(options,['retain']);if(typeof retain!=='function')throw refused();let used=false;
 return async reviewed=>{if(used)throw refused();used=true;try{return await retainExact(retain,'result','result',reviewed);}catch{throw refused();}};
}
