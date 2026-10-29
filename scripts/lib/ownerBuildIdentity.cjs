// Diagnostic packaging provenance only; never an authentication/permission source.
const {execFileSync}=require('node:child_process');
const valid=v=>typeof v==='string'&&/^[a-f0-9]{40}$/i.test(v);
function ownerBuildIdentity({root,environment=process.env,git=args=>execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim()}){
 let local=null,dirty=null;try{const v=git(['rev-parse','HEAD']);if(valid(v))local=v.toLowerCase();dirty=!!git(['status','--porcelain','--untracked-files=normal']);}catch{/* Exported archives may not contain .git. */}
 const supplied=valid(environment.EAS_BUILD_GIT_COMMIT_HASH)?environment.EAS_BUILD_GIT_COMMIT_HASH.toLowerCase():null;
 const mismatch=!!(supplied&&local&&supplied!==local);
 return {schema:1,sourceCommit:mismatch?null:supplied||local,sourceStatus:mismatch?'mismatch':dirty?'local-changes':supplied||local?'recorded':'unavailable',environment:'owner-preview',profile:'owner-preview'};
}
module.exports={ownerBuildIdentity};
