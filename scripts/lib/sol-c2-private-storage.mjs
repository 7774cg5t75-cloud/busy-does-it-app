// Local, explicit capability adapter for the EXISTING exclusive intent and
// append-only diagnostics. No default filesystem, paths, clock or transport.
// Intent tests bind a synthetic filesystem; diagnostic IO also has a POSIX test.
// Creating a real
// submission intent still requires separate exact owner execution authority.
import {createHash} from 'node:crypto';
import {basename,dirname,resolve} from 'node:path';
import {sanitiseSolC2Diagnostic} from './sol-c2-submission-review.mjs';
const sha=value=>createHash('sha256').update(value).digest('hex');
function fixedError(){return Error('C2_PRIVATE_STORAGE_UNCONFIRMED_INSPECT_ONLY');}
export function createSolC2PrivateStorage({fs,privateDirectory,intentPath,paidMarkerPath}={}){
 if(!fs||typeof fs.open!=='function'||typeof fs.lstat!=='function'||typeof fs.realpath!=='function'||typeof privateDirectory!=='string'||resolve(privateDirectory)!==privateDirectory||typeof intentPath!=='string'||resolve(intentPath)!==intentPath||dirname(intentPath)!==privateDirectory||basename(intentPath)!=='DEPLOYMENT-SUBMISSION-INTENT.private.json'||typeof paidMarkerPath!=='string'||resolve(paidMarkerPath)!==paidMarkerPath||basename(paidMarkerPath)!=='ai-lab-sol-design-request.json'||basename(dirname(paidMarkerPath))!=='.github')throw fixedError();
 fs={open:fs.open.bind(fs),lstat:fs.lstat.bind(fs),realpath:fs.realpath.bind(fs)};
 let diagnosticSequence=0,claimAttempted=false;const evidenceAttempts=new Set();
 async function checkDirectory(){
  const stat=await fs.lstat(privateDirectory);
  if(!stat.isDirectory()||stat.isSymbolicLink()||(stat.mode&0o777)!==0o700||await fs.realpath(privateDirectory)!==privateDirectory)throw fixedError();
 }
 async function verifyPaidMarkerAbsent(){
  let present=true;
  try{await fs.lstat(paidMarkerPath);}catch(error){if(error?.code==='ENOENT')present=false;else{const failure=fixedError();failure.code='C2_LOCAL_MARKER_READ_UNCERTAIN';throw failure;}}
  if(present){const failure=fixedError();failure.code='C2_LOCAL_MARKER_PRESENT';throw failure;}
  return {absent:true};
 }
 async function exclusiveDurable(path,bytes){
  let file,directory;
  try{
   await checkDirectory();
   file=await fs.open(path,'wx',0o600);
   await file.writeFile(bytes,'utf8');await file.sync();await file.close();file=null;
   directory=await fs.open(privateDirectory,'r');await directory.sync();await directory.close();directory=null;
   return {fileSynced:true,directorySynced:true};
  }catch{try{await file?.close();}catch{}try{await directory?.close();}catch{}throw fixedError();}
 }
 return Object.freeze({
  verifyPaidMarkerAbsent,
  async writeReadbackEvidence(request){
   if(!request||Object.getPrototypeOf(request)!==Object.prototype||Object.getOwnPropertySymbols(request).length||Object.keys(request).sort().join(',')!=='bytes,kind,stage'||Object.values(Object.getOwnPropertyDescriptors(request)).some(d=>!Object.hasOwn(d,'value')))throw fixedError();
   const {kind,stage,bytes}=request;
   const stages={catalogue:['tool-result','normalized'],function:['tool-result','normalized'],database:['tool-result','normalized'],result:['result']};
   if(typeof kind!=='string'||typeof stage!=='string'||typeof bytes!=='string'||bytes.length===0||Buffer.byteLength(bytes)>4194304||!Object.hasOwn(stages,kind)||!stages[kind].includes(stage))throw fixedError();
   const name='C2-readback-'+kind+'-'+stage+'.private.json';
   if(evidenceAttempts.has(name))throw fixedError();evidenceAttempts.add(name);
   const durable=await exclusiveDurable(privateDirectory+'/'+name,bytes);
   return {retained:true,...durable,sha256:sha(bytes)};
  },
  async writeDiagnostic(report){
   const safe=sanitiseSolC2Diagnostic(report);
   const bytes=JSON.stringify(safe)+'\n';
   const name='C2-diagnostic-'+String(diagnosticSequence++).padStart(4,'0')+'.private.json';
   return exclusiveDurable(privateDirectory+'/'+name,bytes);
  },
  async claimDurableIntent(intentBytes){
   if(claimAttempted)throw fixedError();claimAttempted=true;
   if(typeof intentBytes!=='string'||!intentBytes.length)throw fixedError();
   // Preserve the original LIVE fence. Only ENOENT establishes absence;
   // a file, dangling symlink or uncertain filesystem read must stop.
   await verifyPaidMarkerAbsent();
   const durable=await exclusiveDurable(intentPath,intentBytes);
   return {claimed:true,...durable,intentSha256:sha(intentBytes)};
  }
 });
}
