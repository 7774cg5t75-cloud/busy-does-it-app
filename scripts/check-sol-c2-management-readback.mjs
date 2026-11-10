// Engineering-only, offline data tests. Native metadata and identities below
// are synthetic. Candidate source is read as text and never imported. This
// file has no credential, HTTP, provider, submission or durable-intent port.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reviewSolC2ManagementReadback,reviewSolC2ReadbackPreparation,solC2ReadbackDigest,solC2RuntimeImports,verifySolC2ReadbackToolchain} from './lib/sol-c2-management-readback.mjs';
import {createSolC2SyntheticReadbackFixture} from './fixtures/sol-c2-readback-synthetic.mjs';

const entry='supabase/functions/busy-creative-document-pilot/index.ts';
const config='supabase/functions/busy-creative-document-pilot/deno.json';
const nativeId='11111111-1111-4111-8111-111111111111';
const otherId='22222222-2222-4222-8222-222222222222';
const fixedNow=2000000;
const target={projectId:'sbvkrvksnruiclcvclbd',organisationId:'wrjfgasxtlznzfzmfrif',region:'eu-west-1',functionName:'busy-creative-document-pilot',entrypoint:entry,verifyJwt:true};
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const stable=value=>JSON.stringify(canonical(JSON.parse(JSON.stringify(value))));
const digest=value=>createHash('sha256').update(typeof value==='string'||value instanceof Uint8Array?value:stable(value)).digest('hex');
const copy=value=>structuredClone(value);
const safeReason=value=>typeof value==='string'&&/^[A-Z][A-Z0-9_]{1,120}$/.test(value);
const receiptKeys=['version','status','projectId','functionId','functionVersion','verifyJwt','nativeEszipSha256','runtimeFilesDigest','manifestDigest','requestDigest','completeRuntimeSourceReadback','externalRuntimeImports','provenanceOwnerAccepted','checkedAt'].sort();
const nativeRoot=(id=nativeId,version=2)=>'/tmp/user_fn_'+target.projectId+'_'+id+'_'+version+'/source/';

let fixtureBasis='FIXTURE_NOT_READY',passed=0;const failures=[];
function test(name,run){try{run();passed++;}catch(error){failures.push({name,reason:safeReason(error?.message)?error.message:'ENGINEERING_ASSERTION_FAILED'});}}
function noEffects(result){assert.equal(result.mayRetry,false);assert.equal(result.mayRollback,false);assert.ok(result.effects&&Object.keys(result.effects).length>0);assert.ok(Object.values(result.effects).every(value=>value===0));}
function accepted(input){const result=reviewSolC2ManagementReadback(input);if(result.ok!==true)throw Error(safeReason(result.reason)?result.reason:'ENGINEERING_ACCEPTANCE_FAILED');assert.equal(result.receipt?.status,'independently-verified');assert.deepEqual(Object.keys(result.receipt).sort(),receiptKeys);noEffects(result);return result;}
function denied(input){const result=reviewSolC2ManagementReadback(input);assert.equal(result.ok,false);assert.ok(safeReason(result.reason));assert.equal(result.receipt,null);noEffects(result);return result;}
function main(){
 const args=process.argv.slice(2);assert.ok(args.length===0||args.length===2&&args[0]==='--retained-artifact');
 const fixture=createSolC2SyntheticReadbackFixture({now:fixedNow,...(args.length?{retainedArtifactDirectory:args[1]}:{})});
 fixtureBasis=fixture.fixtureBasis;const {input:template,files,manifest,runtimeFiles,rendererFiles,importEdges,metadataNames}=fixture;
 const fresh=()=>copy(template),change=(name,edit)=>test(name,()=>{const input=fresh();edit(input);denied(input);});
 const eachNative=(input,edit)=>{edit(input.acknowledgement.function);edit(input.catalogue.after[0]);edit(input.getter);};
 const updateSource=(input,name,source)=>{input.expected.files[name]=source;input.expected.runtimeFiles[name]=digest(source);input.expected.filesDigest=digest(Object.fromEntries(Object.keys(input.expected.files).sort().map(path=>[path,digest(input.expected.files[path])])));const row=input.getter.files.find(file=>file.name===name);row.content=source;};
 const replaceManifest=(input,edit)=>{const changed=copy(manifest);edit(changed);const anchor='const approvedExecutionManifest=Object.freeze('+stable(manifest)+');';assert.equal(files[entry].split(anchor).length,2);const source=files[entry].replace(anchor,'const approvedExecutionManifest=Object.freeze('+stable(changed)+');');updateSource(input,entry,source);input.expected.entrypointSha256=digest(source);input.expected.manifestDigest=digest(changed);};
 test('existing pinned parser toolchain is verified before review',()=>{const result=verifySolC2ReadbackToolchain();assert.equal(result.ok,true);});
 test('artifact preparation is ready without fabricated acknowledgement or getter',()=>{const input=fresh(),result=reviewSolC2ReadbackPreparation(input.expected,input.beforeDatabase);assert.equal(result.ok,true);assert.equal(result.status,'readback-preparation-ready');assert.equal(result.receipt,null);assert.equal(result.toolchain.ok,true);assert.equal(result.audit.submittedFiles,117);assert.equal(result.audit.filesDigest,input.expected.filesDigest);assert.equal(result.audit.runtimeFiles,115);assert.equal(result.audit.runtimeFilesDigest,digest(runtimeFiles));assert.equal(result.audit.importEdges,291);assert.equal(result.audit.rendererFiles,43);assert.equal(result.audit.manifestDigest,digest(manifest));assert.equal(result.audit.entrypointSha256,digest(files[entry]));noEffects(result);});
 const denyPreparation=(name,edit)=>test(name,()=>{const input=fresh();edit(input);const result=reviewSolC2ReadbackPreparation(input.expected,input.beforeDatabase);assert.equal(result.ok,false);assert.ok(safeReason(result.reason));assert.equal(result.receipt,null);noEffects(result);});
 denyPreparation('preparation rejects mismatched runtime hash',input=>{input.expected.runtimeFiles[entry]='f'.repeat(64);});
 denyPreparation('preparation rejects changed import graph',input=>{const module=Object.keys(input.expected.importEdges).find(module=>input.expected.importEdges[module].length);input.expected.importEdges[module].pop();});
 denyPreparation('preparation rejects changed renderer',input=>{input.expected.rendererDigest='f'.repeat(64);});
 denyPreparation('preparation rejects changed manifest identity',input=>{input.expected.manifestDigest='f'.repeat(64);});
 denyPreparation('preparation rejects missing semantic database evidence',input=>{delete input.beforeDatabase.financial;});
 denyPreparation('preparation rejects null semantic database evidence',input=>{input.beforeDatabase.source=null;});
 denyPreparation('pinned117 file digest covers unused configuration metadata',input=>{input.expected.files[config]+='\n';});
 denyPreparation('pinned117 file digest covers nested lockfile metadata',input=>{input.expected.files['supabase/connected-staging.deno.lock']+='\n';});
 denyPreparation('preparation rejects incorrect complete117 digest',input=>{input.expected.filesDigest='f'.repeat(64);});
 test('independent byte and canonical digests agree',()=>{assert.equal(solC2ReadbackDigest('synthetic'),digest('synthetic'));assert.equal(solC2ReadbackDigest(Buffer.from('synthetic')),digest('synthetic'));assert.equal(solC2ReadbackDigest({z:1,a:[2,3]}),digest({a:[2,3],z:1}));});
 test('all115 actual source-text import sets agree independently',()=>{for(const [name,edges]of Object.entries(importEdges))assert.deepEqual(solC2RuntimeImports(name,files[name],runtimeFiles),edges);});
 test('complete115 runtime readback yields exact original receipt schema',()=>{const result=accepted(fresh());assert.equal(result.receipt.version,'busy.sol-c2-independent-readback.v1');assert.equal(result.receipt.checkedAt,fixedNow-1000);assert.equal(result.receipt.runtimeFilesDigest,digest(runtimeFiles));assert.equal(result.receipt.manifestDigest,digest(manifest));assert.equal(result.receipt.requestDigest,manifest.execution.wireDigest);assert.equal(result.receipt.functionVersion,2);assert.equal(result.receipt.verifyJwt,true);assert.equal(result.receipt.completeRuntimeSourceReadback,true);assert.equal(result.receipt.externalRuntimeImports,0);assert.equal(result.audit.runtimeFiles,115);assert.equal(result.audit.importEdges,291);assert.equal(result.audit.rendererFiles,43);assert.deepEqual(result.audit.returnedBuildInputFiles,[]);assert.deepEqual(result.audit.missingBuildInputFiles,metadataNames);assert.equal(result.audit.fullSubmittedBuildInputReadback,false);assert.equal(result.audit.full117SubmittedFileReadback,false);assert.equal(result.audit.buildInputReadbackIsMetadataOnly,true);assert.equal(result.audit.lockConsumptionVerified,false);assert.equal(result.audit.rawNativeBundleReproduced,false);});
 for(const count of [1,2])test('optional'+count+' exact build metadata rows retain truthful labels',()=>{const input=fresh();for(const name of metadataNames.slice(0,count))input.getter.files.push({name,content:files[name]});const result=accepted(input);assert.deepEqual(result.audit.returnedBuildInputFiles,metadataNames.slice(0,count));assert.deepEqual(result.audit.missingBuildInputFiles,metadataNames.slice(count));assert.equal(result.audit.fullSubmittedBuildInputReadback,count===2);assert.equal(result.audit.full117SubmittedFileReadback,count===2);assert.equal(result.audit.buildInputReadbackIsMetadataOnly,true);assert.equal(result.audit.lockConsumptionVerified,false);assert.equal(result.audit.rawNativeBundleReproduced,false);});
 test('array and wrapped Edge lists accept order changes only',()=>{const input=fresh();input.catalogue.before={functions:input.catalogue.before.reverse()};input.catalogue.after={functions:input.catalogue.after.reverse()};input.getter.files.reverse();accepted(input);});
 test('absolute native getter names normalize only exact version root',()=>{const input=fresh();input.getter.files.forEach(row=>{row.name=nativeRoot()+row.name;});accepted(input);});
 test('exact file URI getter names and relative native entry metadata agree',()=>{const input=fresh();input.getter.files.forEach(row=>{row.name='file://'+nativeRoot()+row.name;});eachNative(input,row=>{row.entrypoint_path=entry;});accepted(input);});
 test('only known root and one-level observation timestamps normalize',()=>{const input=fresh();input.afterDatabase.checkedAt=999;input.afterDatabase.observedAt='synthetic-after';for(const name of ['sql','catalogue','source','security','identity','auth','history','financial','preservation']){input.afterDatabase[name].checkedAt=999;input.afterDatabase[name].observedAt='synthetic-after';}accepted(input);});
 test('supplied genuine observation time never becomes validation wall time',()=>{const input=fresh(),original=Date.now;try{Date.now=()=>{throw Error('UNEXPECTED_WALL_CLOCK_READ');};const result=accepted(input);assert.equal(result.receipt.checkedAt,fixedNow-1000);}finally{Date.now=original;}});
 test('root-port catalogue and getter collection wrappers are compatible',()=>{const input=fresh();assert.equal(input.catalogue.checkedAt,input.observation.catalogueAt);assert.equal(input.getter.checkedAt,input.observation.getterAt);assert.equal(accepted(input).receipt.checkedAt,input.observation.catalogueAt);});
 test('optional collection wrappers can be omitted without fabricating times',()=>{const input=fresh();delete input.catalogue.checkedAt;delete input.getter.checkedAt;assert.equal(accepted(input).receipt.checkedAt,input.observation.catalogueAt);});
 test('getter wrapper cannot disagree with supplied source observation',()=>{const input=fresh();input.getter.checkedAt++;assert.equal(denied(input).reason,'COLLECTION_TIME_MISMATCH');});
 test('catalogue wrapper cannot disagree with supplied catalogue observation',()=>{const input=fresh();input.catalogue.checkedAt++;assert.equal(denied(input).reason,'COLLECTION_TIME_MISMATCH');});
 change('collection fields on acknowledgement are not silently stripped',input=>{input.acknowledgement.function.checkedAt=input.observation.getterAt;});
 change('collection fields on native catalogue rows are not silently stripped',input=>{input.catalogue.after[0].checkedAt=input.observation.catalogueAt;});
 for(const [name,edit]of [
  ['ack id mismatch',row=>{row.id=otherId;}],['ack name mismatch',row=>{row.name='synthetic-other';}],['ack slug mismatch',row=>{row.slug='synthetic-other';}],['ack inactive status',row=>{row.status='INACTIVE';}],['ack version1',row=>{row.version=1;}],['ack numeric version string',row=>{row.version='2';}],['ack JWT false',row=>{row.verify_jwt=false;}],['ack JWT string',row=>{row.verify_jwt='true';}],['ack import map enabled',row=>{row.import_map=true;}],['ack native bundle mismatch',row=>{row.ezbr_sha256='d'.repeat(64);}],['ack bundle missing',row=>{delete row.ezbr_sha256;}],['ack creation timestamp mismatch',row=>{row.created_at+=1;}],['ack update timestamp mismatch',row=>{row.updated_at+=1;}],['ack wrong entry',row=>{row.entrypoint_path='file://'+nativeRoot()+'src/foreign.ts';}],
 ])change(name,input=>edit(input.acknowledgement.function));
 change('unknown acknowledgement cannot become acceptance',input=>{input.acknowledgement.outcome='unknown';});
 change('missing acknowledgement function is inspect-only',input=>{input.acknowledgement.function=null;});
 change('all native metadata cannot silently change the approved function id',input=>eachNative(input,row=>{row.id=otherId;}));
 change('all native metadata cannot agree on JWT disabled',input=>eachNative(input,row=>{row.verify_jwt=false;}));
 change('all native metadata cannot agree on unreviewed import map',input=>eachNative(input,row=>{row.import_map=true;}));
 change('all native metadata cannot reuse disabled native bundle hash',input=>eachNative(input,row=>{row.ezbr_sha256=input.expected.existingNativeBundleSha256;}));
 change('existing native version must remain pinned to1',input=>{input.catalogue.before[0].version=2;});
 change('existing native bundle must match approved historical identity',input=>{input.catalogue.before[0].ezbr_sha256='e'.repeat(64);});
 change('target creation identity must remain unchanged',input=>{input.catalogue.before[0].created_at=999;});
 change('unrelated Edge function version cannot change',input=>{input.catalogue.after[1].version++;});
 change('unrelated Edge function JWT cannot change',input=>{input.catalogue.after[1].verify_jwt=false;});
 change('unrelated Edge function cannot disappear',input=>{input.catalogue.after.pop();});
 change('unapproved Edge function cannot be added',input=>{const row=copy(input.catalogue.after[1]);row.id='33333333-3333-4333-8333-333333333333';row.name=row.slug='synthetic-extra';input.catalogue.after.push(row);});
 change('duplicate Edge native identities are rejected',input=>{input.catalogue.after.push(copy(input.catalogue.after[0]));});
 change('SQL function catalogue is not an Edge management list',input=>{input.catalogue.after={functions:[{signature:'synthetic_read_v1()',bodySha256:'a'.repeat(64)}]};});
 change('missing runtime module is rejected',input=>{input.getter.files.pop();});
 change('unknown extra runtime module is rejected',input=>{input.getter.files.push({name:'src/core/synthetic-extra.mjs',content:'export const extra=true;'});});
 change('unknown nonruntime metadata is not silently ignored',input=>{input.getter.files.push({name:'synthetic-build.json',content:'{}'});});
 change('duplicate runtime source rows are rejected',input=>{input.getter.files.push(copy(input.getter.files[0]));});
 change('duplicate normalized relative and absolute aliases are rejected',input=>{input.getter.files.push({...copy(input.getter.files[0]),name:nativeRoot()+input.getter.files[0].name});});
 change('runtime bytes cannot change even by a newline',input=>{input.getter.files[0].content+='\n';});
 change('source content is never string-coerced',input=>{input.getter.files[0].content={text:input.getter.files[0].content};});
 change('wrong optional build metadata is rejected',input=>{input.getter.files.push({name:config,content:files[config]+'\n'});});
 change('duplicate optional metadata is rejected',input=>{input.getter.files.push({name:config,content:files[config]},{name:config,content:files[config]});});
 for(const [name,path]of [
  ['foreign function root',nativeRoot(otherId)+entry],['old native version root',nativeRoot(nativeId,1)+entry],['foreign project root',nativeRoot().replace(target.projectId,'syntheticforeignproject')+entry],['traversal',nativeRoot()+'src/../'+entry],['dot segment',nativeRoot()+'./'+entry],['percent encoding',nativeRoot()+'%73upabase/functions/busy-creative-document-pilot/index.ts'],['backslash',entry.replaceAll('/','\\')],['URI authority','file://synthetic.invalid'+nativeRoot()+entry],['URI query','file://'+nativeRoot()+entry+'?synthetic=1'],['URI fragment','file://'+nativeRoot()+entry+'#synthetic'],
 ])change('source path '+name,input=>{input.getter.files.find(row=>row.name===entry).name=path;});
 change('native entry root cannot be from prior version',input=>{input.getter.entrypoint_path=nativeRoot(nativeId,1)+entry;});
 change('manifest digest drift is rejected',input=>{input.expected.manifestDigest='f'.repeat(64);});
 for(const [name,edit]of [
  ['version',value=>{value.version=1;}],['enabled',value=>{value.enabled=false;}],['execution enabled',value=>{value.executionEnabled=false;}],['project',value=>{value.projectUrl='https://synthetic.invalid';}],['organisation',value=>{value.organisationId='synthetic-other-organisation';}],['region',value=>{value.region='synthetic-region';}],['request digest',value=>{value.execution.wireDigest='invalid';}],['comparison renderer',value=>{value.execution.comparison.rendererDigest='f'.repeat(64);}],
 ])change('self-consistent changed manifest '+name+' is rejected',input=>replaceManifest(input,edit));
 change('missing embedded active manifest is rejected even with updated source hash',input=>{const source=files[entry].replace('const approvedExecutionManifest=Object.freeze('+stable(manifest)+');','const approvedExecutionManifest=null;');updateSource(input,entry,source);input.expected.entrypointSha256=digest(source);});
 change('entry hash drift is rejected',input=>{input.expected.entrypointSha256='f'.repeat(64);});
 change('renderer file map drift is rejected',input=>{const name=Object.keys(input.expected.rendererFiles)[0];input.expected.rendererFiles[name]='f'.repeat(64);});
 change('renderer digest drift is rejected',input=>{input.expected.rendererDigest='f'.repeat(64);});
 change('accepted provenance cannot be inferred',input=>{input.expected.provenanceOwnerAccepted=false;});
 change('expected runtime hash cannot differ from expected source bytes',input=>{input.expected.runtimeFiles[entry]='f'.repeat(64);});
 change('expected import edge removal is rejected',input=>{const name=Object.keys(input.expected.importEdges).find(name=>input.expected.importEdges[name].length);input.expected.importEdges[name].pop();});
 change('runtime import change is rejected even with an updated source hash',input=>{const name=Object.keys(runtimeFiles).find(name=>name!==entry&&!Object.hasOwn(rendererFiles,name));updateSource(input,name,files[name]+"\nimport 'https://synthetic.invalid/remote.mjs';\n");});
 change('computed runtime import is rejected even with updated source hash',input=>{const name=Object.keys(runtimeFiles).find(name=>name!==entry&&!Object.hasOwn(rendererFiles,name));updateSource(input,name,files[name]+"\nconst deferred = name => import(name);\n");});
 for(const section of ['sql','source','security','identity','auth','history','financial','preservation'])change('semantic database '+section+' drift is rejected',input=>{input.afterDatabase[section].syntheticUnexpectedChange=true;});
 change('SQL catalogue permissions cannot change',input=>{input.afterDatabase.catalogue.functions[0].bodySha256='0'.repeat(64);});
 change('nested tariff evidence timestamp is substantive',input=>{input.afterDatabase.financial.tariff.checkedAt++;});
 change('nested count evidence timestamp is substantive',input=>{input.beforeDatabase.financial.count={checkedAt:100,tokens:2649};input.afterDatabase.financial.count={checkedAt:101,tokens:2649};});
 change('nested native history timestamp is substantive',input=>{input.beforeDatabase.history.rows=[{checkedAt:100,revision:5}];input.afterDatabase.history.rows=[{checkedAt:101,revision:5}];});
 change('unknown section timestamps are not dropped',input=>{input.beforeDatabase.synthetic={checkedAt:1};input.afterDatabase.synthetic={checkedAt:2};});
 for(const category of ['catalogue','source','security','financial'])for(const [name,value]of [['null',null],['empty',{}],['primitive','synthetic-placeholder'],['array',[]]])change('required database '+category+' rejects matching '+name+' placeholders',input=>{input.beforeDatabase[category]=copy(value);input.afterDatabase[category]=copy(value);});
 change('older than15min observation is rejected',input=>{input.catalogue.checkedAt=input.getter.checkedAt=input.observation.catalogueAt=input.observation.getterAt=input.now-900001;});
 change('future observation is rejected',input=>{input.getter.checkedAt=input.observation.getterAt=input.now+1;});
 change('observation collection span over5min is rejected',input=>{input.catalogue.checkedAt=input.observation.catalogueAt=input.now-300001;input.getter.checkedAt=input.observation.getterAt=input.now;});
 change('missing source observation is not retimestamped',input=>{delete input.observation.getterAt;});
 change('noninteger observation is rejected',input=>{input.observation.getterAt+=0.5;});
 change('now is required as an explicit safe integer',input=>{input.now='2000000';});
 const tiny={'src/a.mjs':digest('a'),'src/b.mjs':digest('b')};
 test('literal dynamic and multiline static import forms enumerate',()=>{assert.deepEqual(solC2RuntimeImports('src/entry.mjs',"import {\n value\n} from './a.mjs';\nexport {other} from './b.mjs';\nconst later = () => import( './a.mjs');",tiny),[{specifier:'./a.mjs',dependency:'src/a.mjs'},{specifier:'./b.mjs',dependency:'src/b.mjs'}]);});
 test('commented relative import tokens remain enumerable',()=>{assert.deepEqual(solC2RuntimeImports('src/entry.mjs',"import /* engineering comment */ {value} from /* another comment */ './a.mjs';\nconst later=()=>import(/* engineering */ './b.mjs');",tiny),[{specifier:'./a.mjs',dependency:'src/a.mjs'},{specifier:'./b.mjs',dependency:'src/b.mjs'}]);});
 test('comment and string and regex keyword text creates no imports',()=>{assert.deepEqual(solC2RuntimeImports('src/entry.mjs',"// There is NO import or require activation.\n/* import('node:crypto'); export * from 'https://synthetic.invalid/x.mjs'; */\nconst note=\"import('node:crypto'); require('node:fs')\";\nconst pattern=/import\\('node:crypto'\\)/;\nimport './a.mjs';",tiny),[{specifier:'./a.mjs',dependency:'src/a.mjs'}]);});
 test('literal template expression imports remain enumerable',()=>{assert.deepEqual(solC2RuntimeImports('src/entry.mjs',"const note=`synthetic ${import('./a.mjs')}`;",tiny),[{specifier:'./a.mjs',dependency:'src/a.mjs'}]);});
 test('TypeScript type-only imports remain explicit graph edges',()=>{assert.deepEqual(solC2RuntimeImports('src/entry.ts',"import type {Value} from './a.mjs';\ntype Other = import('./b.mjs').Other;",tiny),[{specifier:'./a.mjs',dependency:'src/a.mjs'},{specifier:'./b.mjs',dependency:'src/b.mjs'}]);});
 test('ordinary object import method is not an ESM dependency',()=>{assert.deepEqual(solC2RuntimeImports('src/entry.mjs',"const local={import(value){return value;}}; local.import('node:crypto');",tiny),[]);});
 for(const [name,source]of [
  ['remote',"import 'https://synthetic.invalid/module.mjs';"],['Node',"import 'node:crypto';"],['bare',"import 'synthetic';"],['dotted alias',"import '.synthetic.mjs';"],['computed',"const later = name => import(name);"],['require',"const later = require('./a.mjs');"],['noncode',"import './a.json';"],['missing',"import './missing.mjs';"],['traversal',"import '../../outside.mjs';"],['same-line external',"const ready=true; import 'https://synthetic.invalid/module.mjs';"],['commented Node reexport',"export /* engineering */ {value} from /* engineering */ 'node:crypto';"],['commented remote reexport',"export /* engineering */ * from /* engineering */ 'https://synthetic.invalid/module.mjs';"],['commented require',"const value=require /* engineering */ ('node:fs');"],['external template expression',"const value=`synthetic ${import('https://synthetic.invalid/module.mjs')}`;"],
 ])test('import scanner rejects '+name,()=>{let error;try{solC2RuntimeImports('src/entry.mjs',source,tiny);}catch(value){error=value;}assert.ok(error&&safeReason(error.message));});
 for(const [name,filename,source]of [
  ['invalid syntax','src/entry.mjs',"import './a.mjs'; ???"],
  ['concatenated module expression','src/entry.mjs',"const later=()=>import('./'+'a.mjs');"],
  ['module template literal','src/entry.mjs',"const later=()=>import(`./a.mjs`);"],
  ['dynamic import options','src/entry.mjs',"const later=()=>import('./a.mjs',{with:{type:'json'}});"],
  ['TypeScript import equals','src/entry.ts',"import local = require('node:fs');"],
  ['TypeScript external import type','src/entry.ts',"type Native = import('node:fs').Stats;"],
  ['require alias','src/entry.mjs',"const load=require; load('node:fs');"],
 ])test('AST graph rejects '+name,()=>{let error;try{solC2RuntimeImports(filename,source,tiny);}catch(value){error=value;}assert.ok(error&&safeReason(error.message));});
 const divisionHiding=[
  ['postfix increment division',"let syntheticX=1; syntheticX++ / syntheticDivisor; import('node:crypto'); const syntheticY=syntheticA / syntheticB;"],
  ['postfix decrement division',"let syntheticX=1; syntheticX-- / syntheticDivisor; import('node:crypto'); const syntheticY=syntheticA / syntheticB;"],
  ['TypeScript postfix assertion division',"const syntheticY=syntheticValue! / syntheticDivisor; import('node:crypto'); const syntheticZ=syntheticA / syntheticB;"],
  ['TypeScript generic close division',"const syntheticY=syntheticFactory<number> / syntheticDivisor; import('node:crypto'); const syntheticZ=syntheticA / syntheticB;"],
  ['template control-flow regex braces',"const syntheticValue=`text ${(()=>{if(syntheticFlag) /}}/.test(syntheticText);return import('node:crypto');})()}`;"],
 ];
 for(const [name,source]of divisionHiding){
  test('ambiguous slash cannot hide external import after '+name,()=>{let error;try{solC2RuntimeImports(name.startsWith('TypeScript')?'src/entry.ts':'src/entry.mjs',source,tiny);}catch(value){error=value;}assert.ok(error&&safeReason(error.message));});
  change('full runtime review rejects hidden import after '+name,input=>{const module=Object.keys(runtimeFiles).find(module=>module!==entry&&!Object.hasOwn(rendererFiles,module));updateSource(input,module,files[module]+'\n'+source+'\n');});
 }
}
try{main();}catch(error){failures.push({name:'fixture construction',reason:safeReason(error?.message)?error.message:'ENGINEERING_FIXTURE_FAILED'});}
console.log(JSON.stringify({status:failures.length?'ENGINEERING_TEST_FAILURE':'ENGINEERING_TESTS_PASSED',fixtureBasis,passed,failed:failures.length,failures,hostedAcceptanceProven:false,deploymentSubmissions:0,realIntents:0,credentialReads:0,providerRequests:0}));
if(failures.length)process.exitCode=1;
