import {mkdir,readFile,writeFile,rename,realpath,rm} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createDesignCandidate} from '../../src/core/websiteDesignAcceptance.mjs';
import {stableJson} from '../../src/core/stableJson.mjs';
const hash=v=>createHash('sha256').update(v).digest('hex');
// Offline owner-private working process. This cannot approve, publish or serve assets.
export async function retainPrivateDesignCandidate({directory,evidence,now,repositoryRoot=process.cwd()}){
 const candidate=createDesignCandidate(evidence,now);if(!candidate.ok)return candidate;
 await mkdir(directory,{recursive:true,mode:0o700});const dir=await realpath(directory),repo=await realpath(repositoryRoot),relative=path.relative(repo,dir);
 if(!relative.startsWith('..'+path.sep)&&relative!=='..')throw Error('Private reference storage must be outside the public repository.');
 const name=hash(evidence.id),lock=path.join(dir,name+'.lock');await mkdir(lock,{mode:0o700});
 try{
  const file=path.join(dir,name+'.json'),bytes=stableJson(candidate.record);let previous;try{previous=await readFile(file,'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}
  if(previous!==undefined)return {ok:false,reason:'This reference already exists. Retain history; never overwrite it.',publicationAuthorised:false};
  const staging=path.join(lock,'candidate.json');await writeFile(staging,bytes,{flag:'wx',mode:0o600});await rename(staging,file);
  const fresh=await readFile(file,'utf8');if(fresh!==bytes)throw Error('Independent private readback did not match. Do not replay.');
  return {ok:true,file,sha256:hash(fresh),record:JSON.parse(fresh),approvedCount:0,publicationAuthorised:false};
 }finally{await rm(lock,{recursive:true,force:true});}
}
