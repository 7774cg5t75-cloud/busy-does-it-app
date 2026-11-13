// Owner-private, separately authorised future result recovery ONLY.
// No network, provider, Auth, hosted-save, publication or key-generation port.
import {readFileSync,writeFileSync,mkdirSync,lstatSync,realpathSync,existsSync,openSync,closeSync,fsyncSync,constants} from 'node:fs';
import {resolve,dirname,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {solRecoveryHash,verifySolRecoveryArchive,decryptVerifiedSolArchive,prepareRecoveredSolPreview} from './lib/sol-result-recovery.mjs';
import {assertPrivateWebsiteEvidenceOutsideRepository} from './lib/private-website-evidence-paths.mjs';

export const APPROVED_SOL_RECIPIENT_SHA256='acd824fb11f006833a28319e1bfb9320883f459346e458d41bde873ba24d177c';
const root=realpathSync(resolve(dirname(fileURLToPath(import.meta.url)),'..'));
const need=v=>{if(!v)throw Error('SOL_PRIVATE_RECOVERY_REFUSED');};
const hash=v=>solRecoveryHash(v),sha=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
function privateFile(path,max){
 need(isAbsolute(path)&&resolve(path)===path&&realpathSync(path)===path);assertPrivateWebsiteEvidenceOutsideRepository(root,path);
 const s=lstatSync(path);need(s.isFile()&&!s.isSymbolicLink()&&(s.mode&0o777)===0o600&&s.size<=max);return readFileSync(path);
}
function write(directory,name,value){
 need(/^[a-zA-Z0-9./-]+$/.test(name)&&!name.startsWith('/')&&!name.split('/').includes('..'));
 const p=resolve(directory,name);need(relative(directory,p)&&!relative(directory,p).startsWith('..'));mkdirSync(dirname(p),{recursive:true,mode:0o700});
 const bytes=typeof value==='string'||value instanceof Uint8Array?value:JSON.stringify(value,null,2)+'\n';
 const fd=openSync(p,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);try{writeFileSync(fd,bytes);fsyncSync(fd);}finally{closeSync(fd);}const d=openSync(dirname(p),'r');try{fsyncSync(d);}finally{closeSync(d);}
 return hash(readFileSync(p));
}
export async function recoverApprovedSolPrivateResult(jobPath,expectedJobSha256){
 need(sha(expectedJobSha256));const raw=privateFile(jobPath,100000);need(hash(raw)===expectedJobSha256);const job=JSON.parse(raw),a=job.authority,now=Date.now();
 // Historical execution expiry forbids NEW calls, not recovery of its exact
 // already authorised ciphertext. Recovery does not renew D or any evidence.
 need(job.version==='busy.sol-result-recovery-job.v1'&&job.status==='OWNER_APPROVED_ONE_PRIVATE_RECOVERY_AND_LOCAL_PREVIEW'&&job.ownerApproved===true&&a?.purpose==='exact-run-result-recovery-and-local-render-only'&&sha(a.executionApprovalSha256)&&Number.isSafeInteger(a.issuedAt)&&a.issuedAt<=now&&Number.isSafeInteger(a.executionExpiresAt)&&a.maximumRecoveries===1&&a.mayReadExistingPrivateRecipientKey===true&&a.mayRenderLocalPreview===true&&['mayCallProvider','mayReserve','maySpend','maySaveWebsite','mayPublish','automaticRetry'].every(k=>a[k]===false));
 need(job.expectedRecipientSha256===APPROVED_SOL_RECIPIENT_SHA256&&typeof job.privateKeyFile==='string'&&job.privateKeyFile.endsWith('/recipient-private.pkcs8.pem')&&typeof job.newPrivateOutput==='string');
 const data={};for(const name of ['archive','nativeEvidence','marker','grant','sourceEnvelope','independentSettlement']){const spec=job.inputs?.[name];need(spec&&sha(spec.sha256));const b=privateFile(spec.path,name==='archive'?8388608:3000000);need(hash(b)===spec.sha256);data[name]=b;}
 const envelope=JSON.parse(data.grant),grant=envelope.grant??envelope;
 const verified=verifySolRecoveryArchive(data.archive,{grant,native:JSON.parse(data.nativeEvidence),markerRaw:data.marker,expectedRecipientSha256:job.expectedRecipientSha256});
 need(verified.binding.runId===a.runId&&verified.binding.eventSha===a.eventSha&&verified.grantDigest===a.grantDigest&&verified.binding.requestDigest===a.requestDigest&&verified.binding.manifestDigest===a.manifestDigest&&grant.expiresAt===a.executionExpiresAt);
 // All native/ZIP/hash/scope checks finish BEFORE opening the existing key.
 const keyState=lstatSync(job.privateKeyFile),keyDirectory=lstatSync(dirname(job.privateKeyFile));need(realpathSync(job.privateKeyFile)===job.privateKeyFile&&keyState.isFile()&&!keyState.isSymbolicLink()&&(keyState.mode&0o777)===0o600&&keyState.size<8192&&(keyDirectory.mode&0o777)===0o700);
 const output=resolve(job.newPrivateOutput);need(isAbsolute(job.newPrivateOutput)&&output===job.newPrivateOutput&&realpathSync(dirname(output))===dirname(output)&&lstatSync(dirname(output)).isDirectory()&&(lstatSync(dirname(output)).mode&0o777)===0o700&&!existsSync(output));assertPrivateWebsiteEvidenceOutsideRepository(root,output,job.privateKeyFile);
 mkdirSync(output,{mode:0o700});
 write(output,'RECOVERY-INTENT.private.json',{version:'busy.sol-private-result-recovery-once.v1',jobRawSha256:expectedJobSha256,archiveSha256:verified.zipSha256,createdAt:Date.now(),maximumRecoveries:1,providerCalls:0,hostedWrites:0,automaticRetry:false});
 let keyBytes,recovered;
 try{keyBytes=privateFile(job.privateKeyFile,8192);recovered=decryptVerifiedSolArchive(verified,keyBytes);}finally{keyBytes?.fill(0);}
 const outcomeSha=write(output,'private-http-outcome.json',recovered.outcomeBytes),bodySha=recovered.body?write(output,'private-function-body.bin',recovered.body):null;
 let preview=null,renderBlockedReason=null;
 const settlement=JSON.parse(data.independentSettlement);
 if(recovered.renderEligible){
  try{preview=await prepareRecoveredSolPreview(recovered,{sourceEnvelope:JSON.parse(data.sourceEnvelope),grant,independentSettlement:settlement,allowFinanciallyUnconfirmedPreview:a.mayRenderFinanciallyUnconfirmedPreview===true});}catch{renderBlockedReason='ORIGINAL_SOURCE_OR_FINANCIAL_PREVIEW_REVIEW_REJECTED_INSPECT_ONLY';}
  if(preview){for(const p of preview.pages)write(output,p.outputPath,p.html);
   write(output,'reviewed-candidate.private.json',preview.candidate);
   const manifest={...preview,candidate:undefined,pages:preview.pages.map(({html,...p})=>p),sourceEnvelopeRawSha256:hash(data.sourceEnvelope),nativeEvidenceRawSha256:hash(data.nativeEvidence),independentSettlementRawSha256:hash(data.independentSettlement),recoveryJobRawSha256:expectedJobSha256};write(output,'manifest.json',manifest);}
 }else renderBlockedReason='NO_CONFIRMED_PRIVATE_RESPONSE_INSPECT_ONLY_NO_REPLAY';
 for(const name of ['archive','nativeEvidence','marker','grant','sourceEnvelope','independentSettlement'])need(hash(privateFile(job.inputs[name].path,name==='archive'?8388608:3000000))===job.inputs[name].sha256);
 const receipt={version:'busy.sol-private-result-recovered.v1',status:preview?'private-original-renderer-preview-prepared':'decrypted-private-outcome-inspect-only',recoveredAt:new Date().toISOString(),jobRawSha256:expectedJobSha256,zipSha256:verified.zipSha256,memberSha256:verified.memberSha256,recipientSha256:verified.recipientSha256,outcomeRawSha256:outcomeSha,bodyRawSha256:bodySha,pages:preview?.pages.length??0,renderBlockedReason,genuineModelResult:!!preview,financialStatus:preview?.financialStatus??'not-verified',actualCostVerified:preview?.financialStatus==='independently-settled',providerCallsByRecovery:0,websiteWrites:0,publication:false,mayReplay:false,professionalAcceptance:false};
 write(output,'recovery-receipt.private.json',receipt);
 return {status:receipt.status,output,pages:receipt.pages,financialStatus:receipt.financialStatus,zipSha256:verified.zipSha256,receiptSha256:hash(readFileSync(output+'/recovery-receipt.private.json')),providerCalls:0,websiteWrites:0,publication:false};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 if(args.length!==2||!args[0].startsWith('--approved-job=')||!args[1].startsWith('--job-sha256='))process.stdout.write('REVIEW_ONLY_NO_KEY_ACCESS_NO_RECOVERY\n');
 else try{process.stdout.write(JSON.stringify(await recoverApprovedSolPrivateResult(args[0].slice(15),args[1].slice(13)))+'\n');}catch{process.stderr.write('STOP_PRIVATE_RESULT_RECOVERY_REFUSED_NO_RETRY_NO_PRIVATE_VALUES\n');process.exitCode=1;}
}
