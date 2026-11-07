import {readFileSync,mkdirSync,writeFileSync,realpathSync,lstatSync} from 'node:fs';
import {resolve,dirname,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareB3Manifest,pendingB3Approval,b3Digest} from './lib/ai-lab-b3-package.mjs';

// Preparation only. No credential, network, Auth, RPC, execution or deployment.
export function prepareB3Packet({root,args}){
 if(args.length!==8||args[0]!=='--verified-b2'||args[2]!=='--source-commit'||args[4]!=='--source-tree'||args[6]!=='--new-private-output')throw Error('Use --verified-b2 <private-technical-json> --source-commit <sha> --source-tree <sha> --new-private-output <new-private-directory>; no execution option.');
 let verifiedB2;try{const f=lstatSync(args[1]);if(f.isSymbolicLink()||f.size>47000)throw Error();verifiedB2=JSON.parse(readFileSync(args[1],'utf8'));}catch{throw Error('Private B2 metadata unavailable; contents are not logged');}
 const manifest=prepareB3Manifest({root,verifiedB2,sourceCommit:args[3],sourceTree:args[5]});
 const out=resolve(args[7]),base=realpathSync(root),parent=realpathSync(dirname(out));
 const relation=relative(base,out);
 if(parent!==dirname(out)||!(relation==='..'||relation.startsWith('..'+sep)))throw Error('Private output must be outside the repository and have no symlink parent');
 mkdirSync(out,{recursive:false,mode:0o700});
 const approval=pendingB3Approval(manifest),marker={version:'busy.ai-lab-b3-execution-request.v1',manifestDigest:b3Digest(manifest),executionId:manifest.binding.executionId};
 for(const [name,value] of Object.entries({'manifest.json':manifest,'PENDING-approval.json':approval,'NOT-AUTHORIZED-request-marker.json':marker}))writeFileSync(out+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
 return {status:'prepared-not-authorized',manifestDigest:b3Digest(manifest),sourcePlanDigest:manifest.binding.sourcePlanDigest,codeFileCount:Object.keys(manifest.code.files).length,hostedExecution:false,credentialReads:0,providerCalls:0};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(prepareB3Packet({root:process.cwd(),args:process.argv.slice(2)})));}
 catch{console.error('B3 preparation refused; verify exact private metadata, source and unused output directory. No record contents logged.');process.exitCode=1;}
}
