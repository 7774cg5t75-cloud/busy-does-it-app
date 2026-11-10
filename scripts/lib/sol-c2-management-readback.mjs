// Validation of supplied management evidence. Only existing offline parser
// toolchain metadata is read; no candidate, credential or recovery file IO.
// No transport, environment reader, candidate import or intent capability.
// Tool provenance and separate owner approvals remain the caller's authority.
import {createHash} from 'node:crypto';
import {posix} from 'node:path';
import {readFileSync} from 'node:fs';
import {inspectTools,requireTools} from '../testing/tooling.mjs';
import {stableJson} from '../../src/core/stableJson.mjs';
import {SOL_TIMING_POLICY_CANDIDATE,SOL_TIMING_POLICY_DIGEST,reviewSolTimingPolicyApproval} from './sol-development-policy.mjs';

export const solC2ReadbackDigest=value=>createHash('sha256').update(typeof value==='string'||value instanceof Uint8Array?value:stableJson(value)).digest('hex');
const plain=value=>value!==null&&Object.getPrototypeOf(value)===Object.prototype;
const same=(a,b)=>stableJson(a)===stableJson(b);
const sha=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);
const fail=reason=>{throw Error(reason);};
const need=(value,reason)=>{if(!value)fail(reason);};
const sortedKeys=value=>Object.keys(value).sort();
const sameKeys=(a,b)=>plain(a)&&plain(b)&&same(sortedKeys(a),sortedKeys(b));
const effects=()=>({networkRequests:0,httpRequests:0,credentialReads:0,candidateImports:0,compilerCalls:0,intentClaims:0,providerRequests:0,reservations:0,hostedWrites:0,rollbacks:0});

function dataOnly(value){
 let count=0;const active=new Set();
 const visit=(v,depth=0)=>{
  need(++count<=100000&&depth<=40,'INVALID_DATA');
  if(v===null||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v))return;
  if(typeof v==='string'){need(v.length<=2000000,'INVALID_DATA');return;}
  need((plain(v)||Array.isArray(v))&&!active.has(v)&&Object.getOwnPropertySymbols(v).length===0,'INVALID_DATA');
  active.add(v);
  for(const [key,d]of Object.entries(Object.getOwnPropertyDescriptors(v))){
   need(!['__proto__','prototype','constructor'].includes(key)&&Object.hasOwn(d,'value'),'INVALID_DATA');
   visit(d.value,depth+1);
  }
  active.delete(v);
 };visit(value);
}

// Reuse the existing reviewed offline toolchain; no package installation or
// dependency change is permitted here. Call readiness before any future D or
// submission intent so a missing parser cannot first appear after deployment.
const parserVersion='7.29.9';
const manifestSha256='dce21ddb5c640380a7704d7f6be695312779f5b4c1313b1973b3f6bbdda7bfd7';
const lockSha256='27d64370fa5d0efba6d5d7426b09e5cf92093ce14593848bb4bc92615e0f503d';
let parser=null;
export function verifySolC2ReadbackToolchain(){
 try{
  const manifest=readFileSync(new URL('../offline-tools/package.json',import.meta.url));
  const tools=inspectTools();
  need(solC2ReadbackDigest(manifest)===manifestSha256&&tools.ok&&tools.lockSha256===lockSha256,'PARSER_TOOLCHAIN_NOT_READY');
  need(requireTools('@babel/parser/package.json').version===parserVersion,'PARSER_VERSION_MISMATCH');
  const loaded=requireTools('@babel/parser');need(typeof loaded.parse==='function','PARSER_TOOLCHAIN_NOT_READY');parser=loaded;
  return {ok:true,status:'offline-parser-ready',parser:'@babel/parser',parserVersion,manifestSha256,lockSha256,networkRequests:0,candidateImports:0};
 }catch{parser=null;return {ok:false,status:'blocked-before-intent',reason:'PARSER_TOOLCHAIN_NOT_READY',parser:'@babel/parser',expectedParserVersion:parserVersion,networkRequests:0,candidateImports:0};}
}

// AST parsing inspects candidate TEXT only. It never imports or executes a
// candidate, resolves its modules or allows caller parser plugins/config.
export function solC2RuntimeImports(name,source,runtimeFiles){
 need(typeof name==='string'&&typeof source==='string'&&plain(runtimeFiles),'INVALID_IMPORT_INPUT');
 need(parser||verifySolC2ReadbackToolchain().ok,'PARSER_TOOLCHAIN_NOT_READY');
 let ast;try{ast=parser.parse(source,{sourceType:'module',errorRecovery:false,plugins:name.endsWith('.ts')?['typescript']:[],createImportExpressions:true});}catch{fail('UNSUPPORTED_MODULE_SYNTAX');}
 const specs=[];
 const moduleString=node=>{need(node?.type==='StringLiteral'&&typeof node.value==='string','COMPUTED_IMPORT');specs.push(node.value);};
 const importNodes=new Set(['ImportDeclaration','ImportSpecifier','ImportDefaultSpecifier','ImportNamespaceSpecifier','ImportExpression','Import','TSImportType']);
 let visited=0;
 function walk(node){
  if(!node||typeof node!=='object')return;
  need(++visited<=500000,'IMPORT_INPUT_TOO_LARGE');
  if(Array.isArray(node)){for(const child of node)walk(child);return;}
  if(node.type==='Identifier'&&node.name==='require')fail('REQUIRE_IMPORT');
  if(['MemberExpression','OptionalMemberExpression'].includes(node.type)&&(node.property?.type==='Identifier'&&node.property.name==='require'||node.property?.type==='StringLiteral'&&node.property.value==='require'))fail('REQUIRE_IMPORT');
  if(node.type==='ImportDeclaration'){
   need(!(node.attributes?.length||node.assertions?.length),'UNSUPPORTED_MODULE_AST');moduleString(node.source);
  }else if(['ExportNamedDeclaration','ExportAllDeclaration'].includes(node.type)&&node.source){
   need(!(node.attributes?.length||node.assertions?.length),'UNSUPPORTED_MODULE_AST');moduleString(node.source);
  }else if(node.type==='ImportExpression'){
   need(node.options==null,'UNSUPPORTED_MODULE_AST');moduleString(node.source);
  }else if(node.type==='CallExpression'&&node.callee?.type==='Import'){
   need(node.arguments.length===1,'COMPUTED_IMPORT');moduleString(node.arguments[0]);
  }else if(node.type==='TSImportType'){
   need(node.options==null,'UNSUPPORTED_MODULE_AST');moduleString(node.argument);
  }else if(['TSImportEqualsDeclaration','TSExternalModuleReference'].includes(node.type)||typeof node.type==='string'&&node.type.includes('Import')&&!importNodes.has(node.type))fail('UNSUPPORTED_MODULE_AST');
  for(const [key,value]of Object.entries(node))if(!['loc','start','end','extra','comments','leadingComments','trailingComments','innerComments','tokens','errors'].includes(key))walk(value);
 }
 walk(ast);
 return [...new Set(specs)].sort().map(specifier=>{
  need((specifier.startsWith('./')||specifier.startsWith('../'))&&/\.(?:ts|mjs|js)$/.test(specifier),'EXTERNAL_OR_NONCODE_IMPORT');
  const dependency=posix.normalize(posix.join(posix.dirname(name),specifier));
  need(!dependency.startsWith('../')&&!posix.isAbsolute(dependency)&&Object.hasOwn(runtimeFiles,dependency),'MISSING_IMPORT');
  return {specifier,dependency};
 });
}

function nativeRoot(target,id,version){return '/tmp/user_fn_'+target.projectId+'_'+id+'_'+version+'/source/';}
function fileName(value,target,id,version){
 need(typeof value==='string'&&!/[\\%?#\u0000]/.test(value),'INVALID_NATIVE_PATH');
 let name=value;
 if(name.startsWith('file://')){need(name.startsWith('file:///'),'INVALID_NATIVE_PATH');name=name.slice(7);}
 if(name.startsWith('/')){const root=nativeRoot(target,id,version);need(name.startsWith(root),'FOREIGN_NATIVE_ROOT');name=name.slice(root.length);}
 need(name.length>0&&!name.split('/').some(part=>!part||part==='.'||part==='..')&&!name.includes(':'),'INVALID_NATIVE_PATH');
 return name;
}
function nativeMetadata(value,expected,version,getter=false){
 need(plain(value),'INVALID_NATIVE_METADATA');
 const {files,...metadata}=value;
 if(getter&&Object.hasOwn(metadata,'checkedAt')){need(Number.isSafeInteger(metadata.checkedAt),'INVALID_COLLECTION_TIMES');delete metadata.checkedAt;}
 need(getter?Array.isArray(files):!Object.hasOwn(value,'files'),'INVALID_NATIVE_METADATA');
 const target=expected.target;
 need(metadata.id===expected.expectedFunctionId&&metadata.name===target.functionName&&metadata.slug===target.functionName,'NATIVE_IDENTITY_MISMATCH');
 need(metadata.version===version&&Number.isSafeInteger(metadata.version),'NATIVE_VERSION_MISMATCH');
 need(metadata.verify_jwt===true,'JWT_DISABLED');
 need(metadata.import_map===false&&metadata.status==='ACTIVE','NATIVE_CONFIGURATION_MISMATCH');
 need(sha(metadata.ezbr_sha256),'INVALID_NATIVE_BUNDLE');
 need(Number.isSafeInteger(metadata.created_at)&&metadata.created_at>=0&&Number.isSafeInteger(metadata.updated_at)&&metadata.updated_at>=metadata.created_at,'INVALID_NATIVE_TIMESTAMPS');
 metadata.entrypoint_path=fileName(metadata.entrypoint_path,target,expected.expectedFunctionId,version);
 need(metadata.entrypoint_path===target.entrypoint,'NATIVE_ENTRYPOINT_MISMATCH');
 return metadata;
}
function edgeList(value){
 const rows=Array.isArray(value)?value:plain(value)&&same(sortedKeys(value),['functions'])?value.functions:null;
 need(Array.isArray(rows)&&rows.length>0&&rows.length<=1000,'INVALID_EDGE_CATALOGUE');
 const ids=new Set(),names=new Set();
 for(const row of rows){need(plain(row)&&uuid(row.id)&&typeof row.name==='string'&&!ids.has(row.id)&&!names.has(row.name),'DUPLICATE_OR_INVALID_EDGE_FUNCTION');ids.add(row.id);names.add(row.name);}
 return rows;
}

// Only collection-envelope times are ignored. In particular nested tariff,
// count, auth-expiry, history and financial validity timestamps stay bound.
const observedSections=new Set(['catalogue','sql','source','security','identity','auth','history','financial','preservation']);
function withoutCollectionTimes(object){return Object.fromEntries(Object.entries(object).filter(([key])=>!['checkedAt','observedAt'].includes(key)));}
export function normaliseSolC2DatabaseObservation(value){
 need(plain(value)&&['catalogue','source','security','financial'].every(key=>plain(value[key])&&Object.keys(withoutCollectionTimes(value[key])).length>0),'INVALID_DATABASE_EVIDENCE');
 return Object.fromEntries(Object.entries(withoutCollectionTimes(value)).map(([key,item])=>[key,observedSections.has(key)&&plain(item)?withoutCollectionTimes(item):item]));
}
function closure(start,graph){
 const seen=new Set();const visit=name=>{need(Object.hasOwn(graph,name),'MISSING_GRAPH_MODULE');if(seen.has(name))return;seen.add(name);for(const edge of graph[name])visit(edge.dependency);};
 visit(start);return [...seen].sort();
}

function validateExpectedReadback(expected,beforeDatabase){
  need(plain(expected)&&plain(expected.target),'INVALID_EXPECTATION');
  const {target}=expected;
  need(typeof target.projectId==='string'&&/^[a-z]{20}$/.test(target.projectId)&&typeof target.functionName==='string'&&/^[a-z][a-z0-9-]{0,62}$/.test(target.functionName)&&target.entrypoint==='supabase/functions/'+target.functionName+'/index.ts'&&target.verifyJwt===true,'INVALID_TARGET');
  need(uuid(expected.expectedFunctionId)&&expected.existingVersion===1&&expected.expectedVersion===2&&sha(expected.existingNativeBundleSha256)&&expected.provenanceOwnerAccepted===true,'INVALID_NATIVE_EXPECTATION');
  need(plain(expected.files)&&Object.keys(expected.files).length===117&&Object.values(expected.files).every(value=>typeof value==='string'),'INVALID_EXPECTED_FILES');
  need(plain(expected.runtimeFiles)&&Object.keys(expected.runtimeFiles).length===115&&Object.values(expected.runtimeFiles).every(sha),'INVALID_EXPECTED_RUNTIME');
  const runtimeNames=sortedKeys(expected.runtimeFiles),computedRuntime=Object.fromEntries(Object.entries(expected.files).filter(([name])=>/\.(?:ts|mjs|js)$/.test(name)).sort(([a],[b])=>a.localeCompare(b)).map(([name,source])=>[name,solC2ReadbackDigest(source)]));
  need(same(computedRuntime,expected.runtimeFiles),'EXPECTED_RUNTIME_HASH_MISMATCH');
  need(plain(expected.importEdges)&&sameKeys(expected.importEdges,expected.runtimeFiles)&&plain(expected.rendererFiles)&&Object.keys(expected.rendererFiles).length===43&&sha(expected.rendererDigest)&&sha(expected.manifestDigest)&&sha(expected.entrypointSha256),'INVALID_EXPECTED_GRAPH');
  need(expected.runtimeFiles[target.entrypoint]===expected.entrypointSha256,'EXPECTED_ENTRY_HASH_MISMATCH');
  const buildNames=sortedKeys(expected.files).filter(name=>!Object.hasOwn(expected.runtimeFiles,name));
  need(same(buildNames,['supabase/connected-staging.deno.lock','supabase/functions/'+target.functionName+'/deno.json'].sort()),'INVALID_EXPECTED_BUILD_INPUTS');
  const graph=Object.fromEntries(runtimeNames.map(name=>[name,solC2RuntimeImports(name,expected.files[name],expected.runtimeFiles)]));
  need(same(graph,expected.importEdges),'IMPORT_GRAPH_CHANGED');
  need(new Set([...closure(target.entrypoint,graph),...closure('src/domain/websiteBuilder.js',graph)]).size===115,'RUNTIME_GRAPH_INCOMPLETE');
  const rendererNames=closure('src/domain/websiteBuilder.js',graph),renderer=Object.fromEntries(rendererNames.map(name=>[name,expected.runtimeFiles[name]]));
  need(rendererNames.length===43&&same(renderer,expected.rendererFiles)&&solC2ReadbackDigest(renderer)===expected.rendererDigest,'RENDERER_GRAPH_CHANGED');
  const entry=expected.files[target.entrypoint];
  need(solC2ReadbackDigest(entry)===expected.entrypointSha256&&entry.includes("const rendererDigest='"+expected.rendererDigest+"';"),'ENTRY_OR_RENDERER_BINDING_CHANGED');
  const manifests=[...entry.matchAll(/^const approvedExecutionManifest=Object\.freeze\((\{[^\n]*\})\);\nconst readManifest=async\(\)=>structuredClone\(approvedExecutionManifest\);/gm)];
  need(manifests.length===1,'MISSING_OR_AMBIGUOUS_ACTIVE_MANIFEST');
  const manifest=JSON.parse(manifests[0][1]);
  need(solC2ReadbackDigest(manifest)===expected.manifestDigest&&manifest.version===2&&manifest.enabled===true&&manifest.executionEnabled===true&&manifest.projectUrl==='https://'+target.projectId+'.supabase.co','ACTIVE_MANIFEST_CHANGED');
  need((target.organisationId===undefined||manifest.organisationId===target.organisationId)&&(target.region===undefined||manifest.region===target.region)&&plain(manifest.execution)&&sha(manifest.execution.wireDigest)&&manifest.execution.comparison?.rendererDigest===expected.rendererDigest,'ACTIVE_EXECUTION_BINDING_CHANGED');
  let conditionalD=null;
  const approval=manifest.execution.approval,hasApproval=approval!==undefined&&approval!==null&&plain(approval),hasNewPolicy=hasApproval&&Object.hasOwn(approval,'timingPolicy');
  if(Object.hasOwn(expected,'conditionalD')){
   const d=expected.conditionalD;
   need(plain(d)&&same(sortedKeys(d),['expiresAt','issuedAt','supportingEvidenceUntil','timingPolicyDigest'])&&['issuedAt','expiresAt','supportingEvidenceUntil'].every(k=>Number.isSafeInteger(d[k]))&&sha(d.timingPolicyDigest),'INVALID_CONDITIONAL_D_EXPECTATION');
   need(hasApproval&&approval.issuedAt===d.issuedAt&&approval.expiresAt===d.expiresAt&&d.expiresAt>d.issuedAt&&d.expiresAt-d.issuedAt<=SOL_TIMING_POLICY_CANDIDATE.conditionalDMaxAgeMs&&d.expiresAt<=d.supportingEvidenceUntil&&d.timingPolicyDigest===SOL_TIMING_POLICY_DIGEST,'CONDITIONAL_D_MANIFEST_MISMATCH');
   const accepted=reviewSolTimingPolicyApproval(approval.timingPolicy,{now:d.issuedAt,bindings:{targetProject:target.projectId,model:manifest.execution.model,wireDigest:manifest.execution.wireDigest,rendererDigest:expected.rendererDigest}});
   need(accepted.ok&&accepted.policyDigest===d.timingPolicyDigest&&accepted.supportingEvidenceUntil===d.supportingEvidenceUntil,'CONDITIONAL_D_POLICY_NOT_ACCEPTED');
   conditionalD={...d};
  }else{
   // A new policy or longer lease can never downgrade into a legacy v1
   // readback by omitting its conditional authority proof.
   need(!hasNewPolicy&&(!hasApproval||!Number.isSafeInteger(approval.issuedAt)||!Number.isSafeInteger(approval.expiresAt)||approval.expiresAt-approval.issuedAt<=3600000),'CONDITIONAL_D_EXPECTATION_REQUIRED');
  }
  normaliseSolC2DatabaseObservation(beforeDatabase);
  const fileHashes=Object.fromEntries(sortedKeys(expected.files).map(name=>[name,solC2ReadbackDigest(expected.files[name])]));
  const filesDigest=solC2ReadbackDigest(fileHashes);
  need(expected.filesDigest===undefined||expected.filesDigest===filesDigest,'EXPECTED_SUBMITTED_HASH_MISMATCH');
  return {target,runtimeNames,buildNames,graph,renderer,manifest,filesDigest,conditionalD};
}
function blocked(error){return {ok:false,status:'blocked-inspect-only',reason:/^[A-Z][A-Z0-9_]*$/.test(error?.message||'')?error.message:'INVALID_INPUT',receipt:null,effects:effects(),mayRetry:false,mayRollback:false};}

// Run this on the approved expectation and preflight database evidence BEFORE
// any D or intent. It requires no acknowledgement or synthetic hosted reply.
export function reviewSolC2ReadbackPreparation(expected,beforeDatabase){
 try{
  dataOnly({expected,beforeDatabase});const toolchain=verifySolC2ReadbackToolchain();need(toolchain.ok,'PARSER_TOOLCHAIN_NOT_READY');
  const checked=validateExpectedReadback(expected,beforeDatabase);
  return {ok:true,status:'readback-preparation-ready',receipt:null,toolchain,audit:{evidenceBoundary:'Expected artifact/tooling validation only; no native evidence or submission authority.',submittedFiles:117,filesDigest:checked.filesDigest,runtimeFiles:115,runtimeFilesDigest:solC2ReadbackDigest(expected.runtimeFiles),importEdges:Object.values(checked.graph).reduce((sum,edges)=>sum+edges.length,0),rendererFiles:43,manifestDigest:expected.manifestDigest,entrypointSha256:expected.entrypointSha256},effects:effects(),mayRetry:false,mayRollback:false};
 }catch(error){return blocked(error);}
}

/**
 * expected.files is the approved117-source-string map, runtimeFiles the115
 * SHA map, and importEdges/rendererFiles the exact reviewed graphs. Native
 * acknowledgement uses {outcome:'acknowledged',function:nativeRow}; uncertain
 * acknowledgements cannot be converted into retry or rollback authority.
 * observation times are actual catalogue/getter collection times supplied by
 * the trusted caller, never generated here. A returned receipt validates the
 * supplied data; it does not independently establish tool provenance.
 */
export function reviewSolC2ManagementReadback(input){
 try{
  dataOnly(input);need(plain(input),'INVALID_INPUT');
  need(verifySolC2ReadbackToolchain().ok,'PARSER_TOOLCHAIN_NOT_READY');
  const {expected,acknowledgement,catalogue,getter,beforeDatabase,afterDatabase,observation,now}=input;
  const {target,runtimeNames,buildNames,graph,manifest,conditionalD}=validateExpectedReadback(expected,beforeDatabase);
  need(plain(acknowledgement)&&acknowledgement.outcome==='acknowledged','UNKNOWN_ACKNOWLEDGEMENT');
  const ack=nativeMetadata(acknowledgement.function,expected,2),actual=nativeMetadata(getter,expected,2,true);
  need(plain(catalogue),'INVALID_EDGE_CATALOGUE');
  const before=edgeList(catalogue.before),after=edgeList(catalogue.after);
  need(before.length===after.length,'EDGE_CATALOGUE_SIZE_CHANGED');
  const beforeTarget=before.find(row=>row.id===expected.expectedFunctionId),afterTarget=after.find(row=>row.id===expected.expectedFunctionId);
  const previous=nativeMetadata(beforeTarget,expected,1),current=nativeMetadata(afterTarget,expected,2);
  need(previous.ezbr_sha256===expected.existingNativeBundleSha256,'PREVIOUS_NATIVE_BUNDLE_MISMATCH');
  need(ack.ezbr_sha256!==previous.ezbr_sha256,'DISABLED_NATIVE_BUNDLE_REUSED');
  need(same(ack,current)&&same(ack,actual),'ACK_CATALOGUE_GETTER_MISMATCH');
  need(current.updated_at>=previous.updated_at,'NATIVE_TIME_REGRESSION');
  const mutable=new Set(['version','updated_at','ezbr_sha256','entrypoint_path']);
  const fixed=row=>Object.fromEntries(Object.entries(row).filter(([key])=>!mutable.has(key)));
  need(same(fixed(previous),fixed(current)),'APPROVED_FUNCTION_OTHER_METADATA_CHANGED');
  for(const row of before.filter(row=>row.id!==expected.expectedFunctionId))need(same(row,after.find(candidate=>candidate.id===row.id)),'UNAPPROVED_EDGE_FUNCTION_CHANGED');
  need(same(normaliseSolC2DatabaseObservation(beforeDatabase),normaliseSolC2DatabaseObservation(afterDatabase)),'DATABASE_SOURCE_SECURITY_FINANCIAL_CHANGED');
  const returned={};
  for(const file of getter.files){
   need(plain(file)&&same(sortedKeys(file),['content','name'])&&typeof file.content==='string','INVALID_SOURCE_FILE');
   const name=fileName(file.name,target,expected.expectedFunctionId,2);
   need(!Object.hasOwn(returned,name),'DUPLICATE_SOURCE_FILE');
   need(Object.hasOwn(expected.files,name),'EXTRA_SOURCE_FILE');
   need(file.content===expected.files[name],'SOURCE_BYTES_CHANGED');returned[name]=file.content;
  }
  need(runtimeNames.every(name=>Object.hasOwn(returned,name)),'MISSING_RUNTIME_MODULE');
  const returnedRuntime=Object.fromEntries(runtimeNames.map(name=>[name,solC2ReadbackDigest(returned[name])]));
  need(same(returnedRuntime,expected.runtimeFiles),'RUNTIME_HASH_MISMATCH');
  // Actual strings have already matched every approved expected byte, so the
  // preflight-verified AST graph/manifest also binds this exact getter body.
  need(plain(observation)&&Number.isSafeInteger(now)&&['catalogueAt','getterAt'].every(key=>Number.isSafeInteger(observation[key])&&observation[key]<=now),'INVALID_COLLECTION_TIMES');
  need((!Object.hasOwn(getter,'checkedAt')||getter.checkedAt===observation.getterAt)&&(!Object.hasOwn(catalogue,'checkedAt')||catalogue.checkedAt===observation.catalogueAt),'COLLECTION_TIME_MISMATCH');
  const checkedAt=Math.min(observation.catalogueAt,observation.getterAt);
  need(now-checkedAt<=SOL_TIMING_POLICY_CANDIDATE.protectedReadbackFreshnessMs&&Math.abs(observation.catalogueAt-observation.getterAt)<=SOL_TIMING_POLICY_CANDIDATE.readbackCollectionSkewMs,'STALE_COLLECTION');
  if(conditionalD)need(conditionalD.issuedAt<=checkedAt&&now<conditionalD.expiresAt&&now<conditionalD.supportingEvidenceUntil,'CONDITIONAL_D_EXPIRED_AT_READBACK');
  const returnedBuildInputFiles=buildNames.filter(name=>Object.hasOwn(returned,name)),missingBuildInputFiles=buildNames.filter(name=>!Object.hasOwn(returned,name));
  const receipt={version:conditionalD?'busy.sol-c2-independent-readback.v2':'busy.sol-c2-independent-readback.v1',status:'independently-verified',projectId:target.projectId,functionId:expected.expectedFunctionId,functionVersion:2,verifyJwt:true,nativeEszipSha256:ack.ezbr_sha256,runtimeFilesDigest:solC2ReadbackDigest(returnedRuntime),manifestDigest:expected.manifestDigest,requestDigest:manifest.execution.wireDigest,completeRuntimeSourceReadback:true,externalRuntimeImports:0,provenanceOwnerAccepted:true,checkedAt,...(conditionalD?{conditionalDIssuedAt:conditionalD.issuedAt,conditionalDExpiresAt:conditionalD.expiresAt,supportingEvidenceUntil:conditionalD.supportingEvidenceUntil,timingPolicyDigest:conditionalD.timingPolicyDigest,readbackValidUntil:Math.min(checkedAt+SOL_TIMING_POLICY_CANDIDATE.protectedReadbackFreshnessMs,conditionalD.expiresAt,conditionalD.supportingEvidenceUntil)}:{})};
  return {ok:true,status:'validated-inputs-only',receipt,audit:{evidenceBoundary:'Supplied data validation only; native tool provenance and separate approvals remain required.',runtimeFiles:115,importEdges:Object.values(graph).reduce((sum,edges)=>sum+edges.length,0),rendererFiles:43,returnedBuildInputFiles,missingBuildInputFiles,fullSubmittedBuildInputReadback:missingBuildInputFiles.length===0,full117SubmittedFileReadback:missingBuildInputFiles.length===0,buildInputReadbackIsMetadataOnly:true,lockConsumptionVerified:false,rawNativeBundleReproduced:false},effects:effects(),mayRetry:false,mayRollback:false};
 }catch(error){
  return blocked(error);
 }
}
