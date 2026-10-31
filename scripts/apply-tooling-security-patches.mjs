// Reviewed compatible backport for the locked Node-only Expo dependency.
// No downloads, commands, keys, runtime app imports or arbitrary patch paths.
import {readFileSync,writeFileSync,renameSync,realpathSync,lstatSync} from 'node:fs';import {dirname,resolve,join} from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const sha=text=>createHash('sha256').update(text).digest('hex');
export function patchDeepmergeSource(source){
 const target='\t\tgetKeys(target).forEach(function(key) {\n\t\t\tdestination[key]';
 const guarded='\t\tgetKeys(target).forEach(function(key) {\n\t\t\tif (key === \'__proto__\') return\n\t\t\tdestination[key]';
 const incoming='\t\tif (propertyIsUnsafe(target, key)) {';
 if(source.split(target).length!==2||source.split(incoming).length!==2)throw Error('Unrecognised deepmerge source; review the upstream change');
 return source.replace(target,guarded).replace(incoming,"\t\tif (key === '__proto__' || propertyIsUnsafe(target, key)) {");
}
export function applyToolingSecurityPatches({checkOnly=false}={}){
 const root=realpathSync(resolve(dirname(fileURLToPath(import.meta.url)),'..')),pkg=JSON.parse(readFileSync(join(root,'package.json'))),lock=JSON.parse(readFileSync(join(root,'package-lock.json'))),policy=JSON.parse(readFileSync(join(root,'security/dependency-patches.json')));
 if(pkg.name!=='busy-does-it-app')throw Error('Wrong project for tooling patch');
 const paths=Object.entries(lock.packages).filter(([path])=>path.endsWith('/deepmerge'));
 if(paths.length!==1||paths[0][0]!=='node_modules/deepmerge'||paths[0][1].version!==policy.deepmerge.version)throw Error('Changed dependency topology/version requires review');
 const installed=JSON.parse(readFileSync(join(root,'node_modules/deepmerge/package.json')));if(installed.version!==policy.deepmerge.version||installed.main!==policy.deepmerge.entry)throw Error('Changed dependency entry requires review');
 const file=join(root,'node_modules/deepmerge/dist/cjs.js');if(lstatSync(file).isSymbolicLink()||realpathSync(file)!==file)throw Error('Symlinked patch target refused');
 const source=readFileSync(file,'utf8'),current=sha(source);if(current===policy.deepmerge.patchedSha256)return {package:'deepmerge',version:policy.deepmerge.version,patched:true,changed:false};
 if(current!==policy.deepmerge.originalSha256)throw Error('Unrecognised installed dependency bytes; reinstall the reviewed lock');
 if(checkOnly)throw Error('Apply the reviewed tooling patch before using Expo');
 const patched=patchDeepmergeSource(source);if(sha(patched)!==policy.deepmerge.patchedSha256)throw Error('Patch fingerprint mismatch');
 const tmp=file+'.busy-security.tmp';writeFileSync(tmp,patched,{flag:'wx',mode:0o644});renameSync(tmp,file);
 return {package:'deepmerge',version:policy.deepmerge.version,patched:true,changed:true};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){if(process.argv.slice(2).some(x=>x!=='--check'))throw Error('Unsupported patch option');console.log(JSON.stringify(applyToolingSecurityPatches({checkOnly:process.argv.includes('--check')})));}
