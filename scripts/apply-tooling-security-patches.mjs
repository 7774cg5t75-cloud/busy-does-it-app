// Reviewed compatible backport for the locked Node-only Expo dependency.
// No downloads, commands, keys, runtime app imports or arbitrary patch paths.
import {readFileSync,writeFileSync,renameSync,realpathSync,lstatSync} from 'node:fs';import {dirname,resolve,join} from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const sha=text=>createHash('sha256').update(text).digest('hex');
export function patchDeepmergeSource(source){
 for(const indent of ['','\t']){
  const target='\n'+indent+'\t\tgetKeys(target).forEach(function(key) {\n'+indent+'\t\t\tdestination[key]';
  const guarded='\n'+indent+'\t\tgetKeys(target).forEach(function(key) {\n'+indent+"\t\t\tif (key === '__proto__') return\n"+indent+'\t\t\tdestination[key]';
  const incoming='\n'+indent+'\t\tif (propertyIsUnsafe(target, key)) {';
  if(source.split(target).length===2&&source.split(incoming).length===2)return source.replace(target,guarded).replace(incoming,'\n'+indent+"\t\tif (key === '__proto__' || propertyIsUnsafe(target, key)) {");
 }
 throw Error('Unrecognised deepmerge source; review the upstream change');
}
export function applyToolingSecurityPatches({checkOnly=false}={}){
 const root=realpathSync(resolve(dirname(fileURLToPath(import.meta.url)),'..')),pkg=JSON.parse(readFileSync(join(root,'package.json'))),lock=JSON.parse(readFileSync(join(root,'package-lock.json'))),policy=JSON.parse(readFileSync(join(root,'security/dependency-patches.json')));
 if(pkg.name!=='busy-does-it-app')throw Error('Wrong project for tooling patch');
 const paths=Object.entries(lock.packages).filter(([path])=>path.endsWith('/deepmerge'));
 if(paths.length!==1||paths[0][0]!=='node_modules/deepmerge'||paths[0][1].version!==policy.deepmerge.version)throw Error('Changed dependency topology/version requires review');
 const installed=JSON.parse(readFileSync(join(root,'node_modules/deepmerge/package.json')));if(installed.version!==policy.deepmerge.version||installed.main!==policy.deepmerge.entry)throw Error('Changed dependency entry requires review');
 const plan=policy.deepmerge.files.map(entry=>{
  if(!['index.js','dist/cjs.js','dist/umd.js'].includes(entry.path))throw Error('Unrecognised patch path');
  const file=join(root,'node_modules/deepmerge',entry.path);if(lstatSync(file).isSymbolicLink()||realpathSync(file)!==file)throw Error('Symlinked patch target refused');
  const source=readFileSync(file,'utf8'),current=sha(source);if(current===entry.patchedSha256)return {file,changed:false};
  if(current!==entry.originalSha256)throw Error('Unrecognised installed dependency bytes; reinstall the reviewed lock');
  if(checkOnly)throw Error('Apply the reviewed tooling patch before using Expo');
  const patched=patchDeepmergeSource(source);if(sha(patched)!==entry.patchedSha256)throw Error('Patch fingerprint mismatch');return {file,patched,changed:true};
 });
 if(plan.length!==3)throw Error('Incomplete dependency patch policy');
 for(const item of plan.filter(x=>x.changed)){const tmp=item.file+'.busy-security.tmp';writeFileSync(tmp,item.patched,{flag:'wx',mode:0o644});renameSync(tmp,item.file);}
 return {package:'deepmerge',version:policy.deepmerge.version,patched:true,changed:plan.some(x=>x.changed),entries:plan.length};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){if(process.argv.slice(2).some(x=>x!=='--check'))throw Error('Unsupported patch option');console.log(JSON.stringify(applyToolingSecurityPatches({checkOnly:process.argv.includes('--check')})));}
