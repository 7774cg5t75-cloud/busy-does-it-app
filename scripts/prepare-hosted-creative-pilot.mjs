// One-purpose private preparation CLI. No execute option, credential reader,
// provider transport, Auth session, hosted mutation or configurable save target.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,realpathSync,lstatSync,existsSync} from 'node:fs';
import {resolve,dirname,isAbsolute,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {prepareHostedCreativePilot} from './lib/hosted-creative-pilot.mjs';
import {baselineHash,HOSTED_BASELINE_VERSION} from './lib/hosted-website-baseline.mjs';

export function parseHostedCreativePreparationArgs(args){
 const values={};for(const arg of args){const m=arg.match(/^--(input|new-private-output)=(.+)$/);assert.ok(m&&!values[m[1]],'Use exactly --input=/private/source.json --new-private-output=/private/new-directory');values[m[1]]=m[2];}
 assert.deepEqual(Object.keys(values).sort(),['input','new-private-output']);return values;
}
export function privateHostedCreativePreparationPaths(inputValue,outputValue,rootValue){
 assert.ok(isAbsolute(inputValue)&&isAbsolute(outputValue),'Private evidence paths must be absolute');
 const root=realpathSync(rootValue),input=resolve(inputValue),output=resolve(outputValue);
 const outside=path=>{const rel=relative(root,path);return rel==='..'||rel.startsWith('..'+sep);};
 const privatePath=path=>{assert.equal(realpathSync(path),path,'Symlinked private path refused');assert.equal(lstatSync(path).mode&0o077,0,'Owner-only private permissions required');};
 assert.ok(outside(input)&&outside(output),'Hosted source and pilot evidence must remain outside the public repository');
 privatePath(input);assert.ok(lstatSync(input).isFile()&&lstatSync(input).size<=2000000,'Bounded regular private source required');
 privatePath(dirname(output));assert.ok(lstatSync(dirname(output)).isDirectory());assert.ok(!existsSync(output),'Private output must be new; no overwrite');
 return {root,input,output};
}
export async function prepareHostedCreativePilotFiles({input:inputValue,newPrivateOutput:outputValue}={}){
 const rootValue=resolve(dirname(fileURLToPath(import.meta.url)),'..'),{root,input,output}=privateHostedCreativePreparationPaths(inputValue,outputValue,rootValue);
 const raw=readFileSync(input),inputHash=baselineHash(raw),envelope=JSON.parse(raw),clock=performance.now(),cpu=process.cpuUsage();
 const result=await prepareHostedCreativePilot(envelope);
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
 const code={commit:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),workingTreeDirty:!!git('status','--porcelain'),preparationFileSha256:baselineHash(readFileSync(fileURLToPath(import.meta.url))),bridgeFileSha256:baselineHash(readFileSync(resolve(root,'scripts/lib/hosted-creative-pilot.mjs'))),rendererFileSha256:baselineHash(readFileSync(resolve(root,'src/domain/websiteBuilder.js')))};
 assert.equal(baselineHash(readFileSync(input)),inputHash,'Hosted export changed during preparation');
 mkdirSync(output,{mode:0o700});
 const write=(name,bytes)=>{const target=resolve(output,name),rel=relative(output,target);assert.ok(rel&&!rel.startsWith('..'+sep)&&rel!=='..'&&!isAbsolute(rel),'Private output path escape');mkdirSync(dirname(target),{recursive:true,mode:0o700});writeFileSync(target,bytes,{flag:'wx',mode:0o600});};
 const json=(name,value)=>write(name,JSON.stringify(value,null,2)+'\n');
 json('source-context.private.json',result.context);
 // Exact canonical byte strings are retained for compatible future counting.
 const {stableJson}=await import('../src/core/stableJson.mjs');
 write('provider-input.json',stableJson(result.prepared.input));write('provider-schema.json',stableJson(result.projection.wire.text.format.schema));write('provider-wire.json',stableJson(result.projection.wire));
 json('proposed-owner-intent.json',{status:'proposal-only-not-authorized',intent:result.proposedIntent,requiresSeparateOwnerApproval:true});
 const deterministic=result.deterministic;
 for(const page of deterministic.pages)write('deterministic-candidate/'+page.outputPath,page.html);
 json('deterministic-candidate/manifest.json',{version:HOSTED_BASELINE_VERSION,origin:deterministic.origin,reviewedPreviewProposal:true,requiresOwnerReview:true,accountSaved:false,hostedSaved:false,proposalOrigin:'deterministic',accountSavedByThisTool:false,hostedSourceVerified:true,source:result.source,code,renderer:{module:'src/domain/websiteBuilder.js',function:'renderWebsiteHtml',standalone:true},pages:deterministic.pages.map(({html,...page})=>page),providerCalls:0,newNativeSignIns:0,sourceWrites:0,publication:false,genuineModelResult:false,professionalAcceptance:false,goldStandardsApproved:0,comparisonGoal:deterministic.goal});
 json('deterministic-proposal.private.json',{...deterministic,pages:deterministic.pages.map(({html,...page})=>page)});
 const manifest={...result,context:undefined,prepared:{version:result.prepared.version,inputDigest:result.prepared.inputDigest,sourceStamp:result.prepared.sourceStamp,requiresOwnerReview:true,providerEnabled:false,mayExecute:false},projection:{...result.projection,wire:undefined},deterministic:{origin:deterministic.origin,goal:deterministic.goal,requiresOwnerReview:true,accountSaved:false,liveModelExecuted:false,pages:deterministic.pages.map(({html,...page})=>page),sourceStamp:deterministic.sourceStamp},inputEnvelopeSha256:inputHash,code,resources:{wallMs:Math.round(performance.now()-clock),nodeCpuMicroseconds:process.cpuUsage(cpu),maxRssKiB:process.resourceUsage().maxRSS,providerTokens:null,providerCostGBP:0}};
 json('preparation-manifest.private.json',manifest);
 assert.equal(baselineHash(readFileSync(input)),inputHash,'Original hosted source changed');
 return {ok:true,output,origin:result.origin,sourceObservation:result.source.observedAt,pages:result.deterministic.pages.length,inputDigest:result.projection.inputDigest,schemaDigest:result.projection.schemaDigest,requestDigest:result.projection.requestDigest,measuredBytes:result.measuredBytes,dispatchAllowed:false,providerCalls:0,nativeSignIns:0,sourceWrites:0,accountSaved:false,publication:false,liveCandidate:null};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const args=parseHostedCreativePreparationArgs(process.argv.slice(2));console.log(JSON.stringify(await prepareHostedCreativePilotFiles({input:args.input,newPrivateOutput:args['new-private-output']})));}
 catch{console.error('Hosted creative preparation refused. Inspect private paths and the original source evidence; no provider or hosted action occurred.');process.exitCode=1;}
}
