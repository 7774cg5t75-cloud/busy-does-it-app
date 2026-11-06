import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {aiLabFictionalSetupTemplate,bindAiLabFictionalSetup,readOnlyFictionalSetupVerification} from './lib/ai-lab-fictional-setup-package.mjs';

// Writes FUSED proposals only. There is intentionally no connect/execute/fuse-
// removal option and no credential, password or native Auth-creation argument.
export function prepareAiLabFictionalSetup(root,args){
 let p,out,exclusive=false;
 if(args.length===0){p=aiLabFictionalSetupTemplate(root);out=resolve(root,'docs/sql-proposals/ai-lab-fictional-setup');mkdirSync(out,{recursive:true});}
 else if(args.length===4&&args[0]==='--native-readback'&&args[2]==='--new-output'){
  let observation;
  try{observation=JSON.parse(readFileSync(args[1],'utf8'));}catch{throw Error('Native technical readback could not be loaded or parsed; contents are not logged');}
  p=bindAiLabFictionalSetup(root,observation);out=resolve(args[3]);
  // A native UUID changes the proposal's hash. Never replace an older reviewed
  // binding or silently overwrite a previous acknowledgement/artifact.
  mkdirSync(out,{recursive:false,mode:0o700});exclusive=true;
 }else throw Error('Use no arguments for unbound review template, or --native-readback <technical-json> --new-output <new-private-directory>. No execution option exists.');
 const {sql,...manifest}=p,options=exclusive?{flag:'wx',mode:0o600}:undefined;
 writeFileSync(out+'/setup-review.sql',sql,options);
 writeFileSync(out+'/manifest.json',JSON.stringify(manifest,null,2)+'\n',options);
 writeFileSync(out+'/read-only-verify.sql',readOnlyFictionalSetupVerification(),options);
 return {prepared:p.ownerId?'native-owner-bound FUSED proposal; new exact B2 approval required':'unbound FUSED template; native B1 UUID required',templateSha256:p.templateSha256,sha256:p.sha256||null,executionDerivativeSha256:p.executionDerivativeSha256,hostedExecutionReady:false,providerCalls:0};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(prepareAiLabFictionalSetup(process.cwd(),process.argv.slice(2))));}
 catch(error){console.error('Fictional setup proposal refused: '+error.message);process.exitCode=1;}
}
