import {readFileSync,mkdirSync,writeFileSync,realpathSync,lstatSync} from 'node:fs';
import {resolve,dirname,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareB3Manifest,pendingB3Approval,b3Digest,B3_MARKER_VERSION} from './lib/ai-lab-b3-package.mjs';

// Preparation only. No credential, network, Auth, RPC, execution or deployment.
export function prepareB3Packet({root,args}){
 if(args.length!==8||args[0]!=='--verified-source'||args[2]!=='--source-commit'||args[4]!=='--source-tree'||args[6]!=='--new-private-output')throw Error('Use --verified-source <private-B2-and-installed-contract-json> --source-commit <sha> --source-tree <sha> --new-private-output <new-private-directory>; no execution option.');
 let metadata;try{const f=lstatSync(args[1]);if(f.isSymbolicLink()||f.size>47000)throw Error();metadata=JSON.parse(readFileSync(args[1],'utf8'));if(!metadata||Object.keys(metadata).sort().join(',')!=='verifiedB2,verifiedSourceContract')throw Error();}catch{throw Error('Private verified source metadata unavailable; contents are not logged');}
 const manifest=prepareB3Manifest({root,...metadata,sourceCommit:args[3],sourceTree:args[5]});
 const out=resolve(args[7]),base=realpathSync(root),parent=realpathSync(dirname(out));
 const relation=relative(base,out);
 if(parent!==dirname(out)||!(relation==='..'||relation.startsWith('..'+sep)))throw Error('Private output must be outside the repository and have no symlink parent');
 mkdirSync(out,{recursive:false,mode:0o700});
 const approval=pendingB3Approval(manifest),marker={version:B3_MARKER_VERSION,manifestDigest:b3Digest(manifest),executionId:manifest.binding.executionId};
 for(const [name,value] of Object.entries({'manifest.json':manifest,'PENDING-approval.json':approval,'NOT-AUTHORIZED-request-marker.json':marker}))writeFileSync(out+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
 return {status:'prepared-not-authorized',manifestDigest:b3Digest(manifest),sourcePlanDigest:manifest.binding.sourcePlanDigest,codeFileCount:Object.keys(manifest.code.files).length,hostedExecution:false,credentialReads:0,providerCalls:0};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(prepareB3Packet({root:process.cwd(),args:process.argv.slice(2)})));}
 catch{console.error('B3 preparation refused; verify exact private metadata, source and unused output directory. No record contents logged.');process.exitCode=1;}
}
