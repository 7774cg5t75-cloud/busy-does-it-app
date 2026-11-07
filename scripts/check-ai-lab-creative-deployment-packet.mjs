import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync,symlinkSync,unlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {creativeDocumentDeploymentFiles,creativeDeploymentDigest,CREATIVE_DOCUMENT_DEPLOYMENT_TARGET} from './lib/creative-document-deployment-packet.mjs';

const root=process.cwd(),inventory=creativeDocumentDeploymentFiles(root);
let passed=0;
function test(name,run){run();passed++;console.log('PASS '+name);}
const entry=CREATIVE_DOCUMENT_DEPLOYMENT_TARGET.entrypoint;
const bootstrap='supabase/functions/busy-builder-proposals/creativeDocumentExecutionBootstrap.mjs';
const config='supabase/functions/busy-creative-document-pilot/deno.json';
function fixture(run){
 const dir=mkdtempSync(join(tmpdir(),'busy-disabled-creative-packet-'));
 try{
  for(const name of [...Object.keys(inventory.files),'supabase/config.toml','supabase/functions/busy-builder-proposals/index.ts']){
   mkdirSync(dirname(join(dir,name)),{recursive:true});writeFileSync(join(dir,name),readFileSync(join(root,name)));
  }
  run(dir);
 }finally{rmSync(dir,{recursive:true,force:true});}
}
const change=(dir,path,edit)=>writeFileSync(join(dir,path),edit(readFileSync(join(dir,path),'utf8')));

test('complete candidate graph binds the original renderer, review, ledger and pinned dependency config',()=>{
 for(const name of [entry,config,'supabase/connected-staging.deno.lock','src/domain/websiteBuilder.js','src/core/websiteCreativeDocumentReview.mjs','supabase/functions/busy-builder-proposals/creativeLedger.mjs'])assert.ok(inventory.files[name]);
 assert.deepEqual(inventory.externalImports,['npm:@supabase/supabase-js@2.118.0']);
 assert.equal(inventory.filesDigest,creativeDeploymentDigest(inventory.files));
 for(const [name,hash] of Object.entries(inventory.files))assert.equal(hash,creativeDeploymentDigest(readFileSync(name,'utf8')));
});
test('target and manifest are review metadata with JWT retained and no execution or credentials',()=>{
 assert.equal(CREATIVE_DOCUMENT_DEPLOYMENT_TARGET.projectId,'sbvkrvksnruiclcvclbd');
 assert.equal(CREATIVE_DOCUMENT_DEPLOYMENT_TARGET.verifyJwt,true);
 assert.equal(inventory.configStanza,'[functions.busy-creative-document-pilot]\nverify_jwt = true\n');
 assert.ok(!Object.hasOwn(inventory,'credential'));
});
test('unchanged copied public source produces the same dependency digest',()=>fixture(dir=>assert.equal(creativeDocumentDeploymentFiles(dir).filesDigest,inventory.filesDigest)));
test('unversioned external dependencies cannot enter a reviewed bundle',()=>fixture(dir=>{
 change(dir,entry,s=>s+'\nimport "npm:@supabase/supabase-js@2";\n');assert.throws(()=>creativeDocumentDeploymentFiles(dir),/Unreviewed external/);
}));
test('remote executable imports cannot enter the bundle',()=>fixture(dir=>{
 change(dir,entry,s=>s+'\nimport "https://synthetic.invalid/code.ts";\n');assert.throws(()=>creativeDocumentDeploymentFiles(dir),/Unreviewed external/);
}));
test('symlinked code is refused without following it',()=>fixture(dir=>{
 const name='supabase/functions/_shared/supabaseClient.ts';unlinkSync(join(dir,name));symlinkSync(join(root,name),join(dir,name));assert.throws(()=>creativeDocumentDeploymentFiles(dir),/Unsafe deployment/);
}));
test('relative path escapes are refused',()=>fixture(dir=>{
 change(dir,entry,s=>s+'\nimport "../../../../../../outside.mjs";\n');assert.throws(()=>creativeDocumentDeploymentFiles(dir),/Unsafe deployment/);
}));
test('computed imports cannot escape the enumerated dependency graph',()=>fixture(dir=>{
 change(dir,entry,s=>s+'\nconst deferred = name => import( name );\n');assert.throws(()=>creativeDocumentDeploymentFiles(dir),/computed deployment import/);
}));
test('a supported literal dynamic import with whitespace remains enumerable',()=>fixture(dir=>{
 change(dir,entry,s=>s+"\nconst deferred = () => import( '../busy-builder-proposals/creativeDocumentExecutionBootstrap.mjs');\n");
 assert.ok(creativeDocumentDeploymentFiles(dir).files[bootstrap]);
}));
test('multiline imports and re-exports include newly reached dependencies',()=>fixture(dir=>{
 const extra='supabase/functions/busy-creative-document-pilot/additional-reviewed.mjs';
 writeFileSync(join(dir,extra),'export const first=1,second=2;\n');
 change(dir,entry,s=>s+"\nimport {\n first, second\n}\n from './additional-reviewed.mjs';\nexport {\n first\n} from './additional-reviewed.mjs';\n");
 assert.equal(creativeDocumentDeploymentFiles(dir).files[extra],creativeDeploymentDigest(readFileSync(join(dir,extra),'utf8')));
}));
test('literal-prefix concatenation is not mistaken for a finite dynamic import',()=>fixture(dir=>{
 change(dir,entry,s=>s+"\nconst deferred = suffix => import('../busy-builder-proposals/creativeDocumentExecutionBootstrap.mjs' + suffix);\n");
 assert.throws(()=>creativeDocumentDeploymentFiles(dir),/computed deployment import/);
}));
test('general gateway wiring is refused',()=>fixture(dir=>{
 change(dir,'supabase/functions/busy-builder-proposals/index.ts',s=>s+'\n// creativeDocumentExecution\n');assert.throws(()=>creativeDocumentDeploymentFiles(dir),/gateway must remain disconnected/);
}));
test('an enabled server manifest is not a disabled deployment candidate',()=>fixture(dir=>{
 change(dir,bootstrap,s=>s.replace('enabled:false,executionEnabled:false','enabled:true,executionEnabled:false'));assert.throws(()=>creativeDocumentDeploymentFiles(dir),/hard-disabled/);
}));
test('an environment read before the hard-disabled guard is refused',()=>fixture(dir=>{
 change(dir,entry,s=>"const unsafe = Deno.env.get('SYNTHETIC_TEST_ONLY');\n"+s);assert.throws(()=>creativeDocumentDeploymentFiles(dir),/precede all environment access/);
}));
test('JWT verification cannot be disabled for smoke convenience',()=>fixture(dir=>{
 change(dir,'supabase/config.toml',s=>s.replace('[functions.busy-creative-document-pilot]\nverify_jwt = true','[functions.busy-creative-document-pilot]\nverify_jwt = false'));assert.throws(()=>creativeDocumentDeploymentFiles(dir),/JWT verification/);
}));
test('a new lock path or hidden function configuration needs a new review',()=>fixture(dir=>{
 writeFileSync(join(dir,config),JSON.stringify({nodeModulesDir:'none',lock:{path:'other.lock'}}));assert.throws(()=>creativeDocumentDeploymentFiles(dir),/function dependency configuration/);
 writeFileSync(join(dir,config),JSON.stringify({nodeModulesDir:'none',lock:{path:'../../connected-staging.deno.lock'},imports:{extra:'npm:unreviewed'}}));assert.throws(()=>creativeDocumentDeploymentFiles(dir),/function dependency configuration/);
}));
console.log(JSON.stringify({passed,failed:0,inventoryFiles:Object.keys(inventory.files).length,hosted:false,networkRequests:0,credentialReads:0,providerCalls:0,deployment:false}));
