import {createHash} from 'node:crypto';
import {readFileSync,lstatSync,realpathSync,existsSync} from 'node:fs';
import {resolve,relative,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {stableJson} from '../../src/core/stableJson.mjs';

export const CREATIVE_DOCUMENT_DEPLOYMENT_TARGET=Object.freeze({
 projectId:'sbvkrvksnruiclcvclbd',organisationId:'wrjfgasxtlznzfzmfrif',region:'eu-west-1',plan:'free',
 functionName:'busy-creative-document-pilot',entrypoint:'supabase/functions/busy-creative-document-pilot/index.ts',verifyJwt:true
});
const configPath='supabase/functions/busy-creative-document-pilot/deno.json';
const lockPath='supabase/connected-staging.deno.lock';
const bootstrapPath='supabase/functions/busy-builder-proposals/creativeDocumentExecutionBootstrap.mjs';
const mainGatewayPath='supabase/functions/busy-builder-proposals/index.ts';
const need=(value,message)=>{if(!value)throw Error(message);};
export const creativeDeploymentDigest=value=>createHash('sha256').update(typeof value==='string'?value:stableJson(value)).digest('hex');

// Read-only inventory. This does not import the candidate, read credentials,
// contact a project, issue a JWT or provide a deployment/execution capability.
export function creativeDocumentDeploymentFiles(root){
 const base=realpathSync(root),seen=new Set(),external=new Set();
 const read=path=>{
  const absolute=resolve(base,path),name=relative(base,absolute);
  need(name&&!name.startsWith('..')&&!lstatSync(absolute).isSymbolicLink()&&realpathSync(absolute)===absolute,'Unsafe deployment dependency');
  return {absolute,name,source:readFileSync(absolute,'utf8')};
 };
 function visit(path){
  const {name,source}=read(path);if(seen.has(name))return;seen.add(name);
  if(!/\.(?:ts|mjs|js)$/.test(name))return;
  const imports=[...source.matchAll(/^\s*(?:import|export)\b\s*(?:type\s+)?(?:\{[^}]*\}|\*(?:\s+as\s+[\w$]+)?|[\w$]+(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+[\w$]+))?)\s*from\s*['"]([^'"]+)['"]/gm),...source.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gm)].map(match=>match[1]);
  for(const start of source.matchAll(/\bimport\s*\(/g)){
   const literal=source.slice(start.index).match(/^import\s*\(\s*(['"])([^'"]+)\1\s*\)/);
   need(literal,'Unreviewed computed deployment import');imports.push(literal[2]);
  }
  for(const specifier of imports){
   if(specifier.startsWith('.'))visit(relative(base,resolve(dirname(resolve(base,name)),specifier)));
   else if(specifier.startsWith('node:'))external.add(specifier);
   else {need(/^npm:@supabase\/supabase-js@2\.118\.0$/.test(specifier),'Unreviewed external deployment dependency');external.add(specifier);}
  }
 }
 // Capture the complete original renderer dependency graph independently of
 // the Edge entry/manifest, so activation metadata cannot create a self-hash.
 visit('src/domain/websiteBuilder.js');const rendererNames=new Set(seen);
 visit(CREATIVE_DOCUMENT_DEPLOYMENT_TARGET.entrypoint);visit(configPath);visit(lockPath);
 const config=JSON.parse(read(configPath).source);
 need(config.nodeModulesDir==='none'&&config.lock?.path==='../../connected-staging.deno.lock'&&Object.keys(config).sort().join(',')==='lock,nodeModulesDir','Unreviewed function dependency configuration');
 const entry=read(CREATIVE_DOCUMENT_DEPLOYMENT_TARGET.entrypoint).source,bootstrap=read(bootstrapPath).source;
 const guard=entry.indexOf('if(!manifest.enabled||!manifest.executionEnabled)'),environment=entry.indexOf('Deno.env.get(');
 need(guard>=0&&environment>guard&&entry.includes('status:503')&&entry.includes('const readManifest=async()=>disabledCreativeDocumentExecution;'),'Disabled entry must precede all environment access');
 need(/enabled:false,executionEnabled:false,execution:null/.test(bootstrap)&&bootstrap.includes("region:'eu-west-1'")&&bootstrap.includes("organisationId:'wrjfgasxtlznzfzmfrif'"),'Deployment manifest is not the reviewed hard-disabled Lab artifact');
 const projectConfig=read('supabase/config.toml').source;
 need(/\[functions\.busy-creative-document-pilot\]\s*verify_jwt = true/.test(projectConfig),'JWT verification must remain enabled');
 need(!read(mainGatewayPath).source.includes('creativeDocumentExecution'),'General gateway must remain disconnected');
 const files=Object.fromEntries([...seen].sort().map(name=>[name,creativeDeploymentDigest(read(name).source)]));
 const rendererFiles=Object.fromEntries(Object.entries(files).filter(([name])=>rendererNames.has(name)));
 need(entry.includes(`const rendererDigest='${creativeDeploymentDigest(rendererFiles)}';`)&&entry.includes('createLabCreativeDocumentExecutionHandler({readManifest,rendererDigest,'),'Original renderer graph binding is missing or stale');
 return {files,filesDigest:creativeDeploymentDigest(files),rendererFiles,rendererFilesDigest:creativeDeploymentDigest(rendererFiles),externalImports:[...external].sort(),entrySha256:files[CREATIVE_DOCUMENT_DEPLOYMENT_TARGET.entrypoint],runtimeConfigSha256:files[configPath],lockSha256:files[lockPath],configStanza:'[functions.busy-creative-document-pilot]\nverify_jwt = true\n',fullProjectConfigSha256:creativeDeploymentDigest(projectConfig),generalGatewaySha256:creativeDeploymentDigest(read(mainGatewayPath).source)};
}

function git(root,args){
 const result=spawnSync('git',args,{cwd:root,encoding:'utf8',timeout:5000,maxBuffer:1000000});
 need(!result.error&&result.status===0,'Source Git identity unavailable; packet is not frozen');return result.stdout.trim();
}
export function buildCreativeDocumentDeploymentPacket(root){
 need(!existsSync(resolve(root,'.github/ai-lab-creative-smoke-request.json')),'A queued smoke marker cannot become a fresh preparation packet');
 const inventory=creativeDocumentDeploymentFiles(root),commit=git(root,['rev-parse','HEAD']),tree=git(root,['rev-parse','HEAD^{tree}']),dirty=git(root,['status','--porcelain=v1']);
 need(/^[0-9a-f]{40}$/.test(commit)&&/^[0-9a-f]{40}$/.test(tree),'Invalid source identity');
 const smokeRuntime='scripts/lib/disabled-creative-document-smoke.mjs';
 const smokeFiles=Object.fromEntries([smokeRuntime,'src/core/stableJson.mjs'].map(name=>[name,creativeDeploymentDigest(readFileSync(resolve(root,name),'utf8'))]));
 // Separate protected runner inventory; none of these files is an Edge upload
 // or permission to queue/release the absent execution marker.
 const handoffPaths=['.github/workflows/ai-lab-creative-smoke.yml','scripts/run-ai-lab-creative-smoke.mjs','scripts/lib/ai-lab-creative-smoke-handoff.mjs',smokeRuntime,'scripts/lib/creative-document-deployment-packet.mjs','src/core/stableJson.mjs'];
 const handoffFiles=Object.fromEntries(handoffPaths.sort().map(name=>{const path=resolve(root,name);need(realpathSync(path)===path&&!lstatSync(path).isSymbolicLink(),'Unsafe protected smoke dependency');return [name,creativeDeploymentDigest(readFileSync(path))];}));
 return {version:'busy.ai-lab-disabled-creative-deployment.v1',status:'review-only-not-authorized',target:CREATIVE_DOCUMENT_DEPLOYMENT_TARGET,source:{commit,tree,clean:dirty==='',frozen:dirty===''},inventory,
  disabled:{version:2,enabled:false,executionEnabled:false,execution:null},
  smoke:{runtime:smokeRuntime,files:smokeFiles,filesDigest:creativeDeploymentDigest(smokeFiles),protectedCallerSourcePrepared:true,protectedCallerInstalled:false,hostedCallerAcceptance:false,handoff:{workflow:'.github/workflows/ai-lab-creative-smoke.yml',marker:'.github/ai-lab-creative-smoke-request.json',files:handoffFiles,filesDigest:creativeDeploymentDigest(handoffFiles),approvalMethod:'exact-run native owner Environment review with short-lived non-secret comment',newSecretRequired:false,runnerIntent:'fsynced exclusive file on that runner, plus native first-attempt/run/history gates',deploymentAttestation:'prior independent deployed-byte verification bound into marker; not fetched by smoke runner'},ownerApprovalPrepared:false,missingCredentials:{method:'POST',expectedStatus:401},invalidBearer:{method:'POST',expectedStatus:401},labPublishableKeyOnly:{method:'POST',expectedStatus:503,ownerAuthenticationProven:false},nativeOwnerSignInIncluded:false,providerCredentialRequired:false,providerCalls:0,reservations:0,applicationWrites:0},
  authority:{deploymentApproved:false,smokeApproved:false,providerCredentialConfigurationApproved:false,providerActivationApproved:false,inferenceApproved:false,databaseMutationApproved:false,automaticRetry:false,rollbackApproved:false},
  warning:'A source inventory and local tests do not prove hosted bundle, JWT or disabled-handler acceptance. Freeze clean source and obtain separate exact Approval C before deployment or smoke requests.'};
}
