import {readFileSync}from'node:fs';import {dirname,resolve,join}from'node:path';import {fileURLToPath}from'node:url';import {isDeepStrictEqual}from'node:util';
export function verifyToolingDependencyPolicy(){
 const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),pkg=JSON.parse(readFileSync(join(root,'package.json'))),lock=JSON.parse(readFileSync(join(root,'package-lock.json'))),policy=JSON.parse(readFileSync(join(root,'security/dependency-policy.json')));
 if(!isDeepStrictEqual(pkg.overrides,policy.scopedOverrides))throw Error('Changed scoped dependency overrides require review');
 const counts={};for(const [path,p]of Object.entries(lock.packages)){
  const name=path.split('node_modules/').at(-1);if(!Object.hasOwn(policy.minimumFixed,name))continue;
  if(!path.startsWith('node_modules/')||path.split('/').includes('..')||path.includes('\\'))throw Error('Invalid locked dependency path');
  const parts=String(p.version).match(/^(\d+)\.(\d+)\.(\d+)$/);if(!parts)throw Error('Unreviewed prerelease dependency');const current=parts.slice(1).map(Number),minimum=policy.minimumFixed[name].split('.').map(Number);let safe=true;for(let i=0;i<3;i++){if(current[i]>minimum[i])break;if(current[i]<minimum[i]){safe=false;break;}}
  if(!safe)throw Error('Vulnerable dependency remains: '+name);const installed=JSON.parse(readFileSync(join(root,path,'package.json')));if(installed.version!==p.version)throw Error('Reinstall the reviewed lock before using Expo');counts[name]=(counts[name]||0)+1;
 }
 if(Object.keys(counts).length!==3)throw Error('Incomplete fixed-dependency inventory');return {verified:true,counts};
}
