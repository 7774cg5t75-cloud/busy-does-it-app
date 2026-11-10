// Shared engineering data only. No validator or candidate imports, automatic
// execution, network, clock reads, credentials or hosted capability.
import assert from 'node:assert/strict';
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname,posix} from 'node:path';
import {fileURLToPath} from 'node:url';

const defaultRoot=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const entry='supabase/functions/busy-creative-document-pilot/index.ts';
const config='supabase/functions/busy-creative-document-pilot/deno.json';
const lock='supabase/connected-staging.deno.lock';
const rendererEntry='src/domain/websiteBuilder.js';
const nativeId='11111111-1111-4111-8111-111111111111';
const otherId='22222222-2222-4222-8222-222222222222';
const target={projectId:'sbvkrvksnruiclcvclbd',organisationId:'wrjfgasxtlznzfzmfrif',region:'eu-west-1',functionName:'busy-creative-document-pilot',entrypoint:entry,verifyJwt:true};
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const stable=value=>JSON.stringify(canonical(JSON.parse(JSON.stringify(value))));
const digest=value=>createHash('sha256').update(typeof value==='string'||value instanceof Uint8Array?value:stable(value)).digest('hex');
const copy=value=>structuredClone(value);
const nativeRoot=(id=nativeId,version=2)=>'/tmp/user_fn_'+target.projectId+'_'+id+'_'+version+'/source/';
const readText=path=>{assert.equal(realpathSync(path),path);assert.ok(lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink());return readFileSync(path,'utf8');};

// Independent expectations for the finite forms in the reviewed public graph.
function sourceImports(name,source){
 const names=[...source.matchAll(/^\s*(?:import|export)\b\s*(?:type\s+)?(?:\{[^}]*\}|\*(?:\s+as\s+[\w$]+)?|[\w$]+(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+[\w$]+))?)\s*from\s*['"]([^'"]+)['"]/gm),...source.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gm)].map(match=>match[1]);
 for(const start of source.matchAll(/\bimport\s*\(/g)){
  const literal=source.slice(start.index).match(/^import\s*\(\s*(['"])([^'"]+)\1\s*\)/);
  assert.ok(literal);names.push(literal[2]);
 }
 return [...new Set(names)].sort().map(specifier=>{
  assert.ok((specifier.startsWith('./')||specifier.startsWith('../'))&&/\.(?:ts|mjs|js)$/.test(specifier));
  const dependency=posix.normalize(posix.join(posix.dirname(name),specifier));
  assert.ok(!dependency.startsWith('../')&&!posix.isAbsolute(dependency));return {specifier,dependency};
 });
}
function graph(start,files,loadMissing){
 const seen=new Set();
 const visit=name=>{if(seen.has(name))return;seen.add(name);if(!Object.hasOwn(files,name)){assert.ok(loadMissing);files[name]=loadMissing(name);}for(const edge of sourceImports(name,files[name]))visit(edge.dependency);};
 visit(start);return [...seen].sort();
}
function nativeRow(id=nativeId,name=target.functionName,version=2){return {id,slug:name,name,status:'ACTIVE',version,created_at:1000,updated_at:version===1?2000:3000,verify_jwt:true,import_map:false,entrypoint_path:'file://'+nativeRoot(id,version)+'supabase/functions/'+name+'/index.ts',ezbr_sha256:version===1?'a'.repeat(64):'b'.repeat(64)};}

export function createSolC2SyntheticReadbackFixture({root=defaultRoot,retainedArtifactDirectory,now=2000000}={}){
 assert.equal(typeof root,'string');assert.equal(resolve(root),root);assert.ok(Number.isSafeInteger(now)&&now>=3000);
 let files,manifest,fixtureBasis;
 if(retainedArtifactDirectory!==undefined){
  assert.equal(typeof retainedArtifactDirectory,'string');assert.equal(resolve(retainedArtifactDirectory),retainedArtifactDirectory);
  files=JSON.parse(readText(retainedArtifactDirectory+'/artifact-files.private.json'));
  manifest=JSON.parse(readText(retainedArtifactDirectory+'/execution-manifest.private.json'));
  fixtureBasis='RETAINED_ARTIFACT_BYTES_WITH_SYNTHETIC_NATIVE_METADATA';
 }else{
  files={};graph(rendererEntry,files,name=>readText(resolve(root,name)));graph(entry,files,name=>readText(resolve(root,name)));
  files[config]=readText(resolve(root,config));files[lock]=readText(resolve(root,lock));
  const renderer=Object.fromEntries(graph(rendererEntry,files).map(name=>[name,digest(files[name])]));
  manifest={version:2,protocol:'synthetic.engineering-manifest.v1',projectUrl:'https://'+target.projectId+'.supabase.co',organisationId:target.organisationId,region:target.region,enabled:true,executionEnabled:true,execution:{wireDigest:digest('synthetic engineering request; no provider request'),comparison:{rendererDigest:digest(renderer)}}};
  const anchor='const readManifest=async()=>disabledCreativeDocumentExecution;';assert.equal(files[entry].split(anchor).length,2);
  files[entry]=files[entry].replace(anchor,'const approvedExecutionManifest=Object.freeze('+stable(manifest)+');\nconst readManifest=async()=>structuredClone(approvedExecutionManifest);');
  fixtureBasis='PUBLIC_SOURCE_TEXT_WITH_SYNTHETIC_MANIFEST_AND_NATIVE_METADATA';
 }
 const runtimeFiles=Object.fromEntries(Object.keys(files).sort().filter(name=>/\.(?:mjs|js|ts)$/.test(name)).map(name=>[name,digest(files[name])]));
 const rendererNames=graph(rendererEntry,files),rendererFiles=Object.fromEntries(rendererNames.map(name=>[name,digest(files[name])]));
 const importEdges=Object.fromEntries(Object.keys(runtimeFiles).map(name=>[name,sourceImports(name,files[name])]));
 assert.equal(Object.keys(files).length,117);assert.equal(Object.keys(runtimeFiles).length,115);assert.equal(rendererNames.length,43);assert.equal(Object.values(importEdges).reduce((total,edges)=>total+edges.length,0),291);
 const metadataNames=[config,lock].sort();assert.deepEqual(Object.keys(files).filter(name=>!Object.hasOwn(runtimeFiles,name)).sort(),metadataNames);
 const before=nativeRow(nativeId,target.functionName,1),after=nativeRow();
 const unrelated=nativeRow(otherId,'synthetic-unrelated-function',7);unrelated.ezbr_sha256='c'.repeat(64);
 const database={checkedAt:10,observedAt:'synthetic-before',readOnly:'on',sql:{checkedAt:11,observedAt:'synthetic-before',schemaDigest:'d'.repeat(64)},catalogue:{checkedAt:12,functions:[{signature:'synthetic_read_v1()',bodySha256:'e'.repeat(64)}]},source:{checkedAt:13,generation:4,profileRevision:1,snapshotRevision:5},security:{checkedAt:14,rlsEnabled:true,securityDigest:'f'.repeat(64)},identity:{checkedAt:15,identityDigest:'1'.repeat(64)},auth:{checkedAt:16,nativeEmailIdentityHash:'2'.repeat(64)},history:{checkedAt:17,undo:3,redo:0},financial:{checkedAt:18,reservedMicroGBP:0,spentMicroGBP:0,operations:0,tariff:{checkedAt:19,revision:2}},preservation:{checkedAt:20,originalReaderActive:false}};
 const filesDigest=digest(Object.fromEntries(Object.keys(files).sort().map(name=>[name,digest(files[name])])));
 const input={expected:{target:copy(target),existingVersion:1,expectedVersion:2,expectedFunctionId:nativeId,existingNativeBundleSha256:before.ezbr_sha256,files:copy(files),filesDigest,runtimeFiles:copy(runtimeFiles),importEdges:copy(importEdges),manifestDigest:digest(manifest),entrypointSha256:digest(files[entry]),rendererFiles:copy(rendererFiles),rendererDigest:digest(rendererFiles),provenanceOwnerAccepted:true},acknowledgement:{outcome:'acknowledged',function:copy(after)},catalogue:{before:[copy(before),copy(unrelated)],after:[copy(after),copy(unrelated)],checkedAt:now-1000},getter:{...copy(after),entrypoint_path:nativeRoot()+entry,files:Object.keys(runtimeFiles).map(name=>({name,content:files[name]})),checkedAt:now-500},beforeDatabase:copy(database),afterDatabase:copy(database),observation:{catalogueAt:now-1000,getterAt:now-500},now};
 return {input,fixtureBasis,files,manifest,runtimeFiles,rendererFiles,importEdges,metadataNames};
}
