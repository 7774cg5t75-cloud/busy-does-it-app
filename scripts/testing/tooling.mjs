import {readFileSync,existsSync,realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire,stripTypeScriptTypes} from 'node:module';
import {fileURLToPath} from 'node:url';
import {resolve,join,dirname} from 'node:path';

export const root=fileURLToPath(new URL('../../',import.meta.url));
export const prefix=join(root,'scripts/offline-tools');
export const requireTools=createRequire(new URL('../offline-tools/package.json',import.meta.url));
export const pins=JSON.parse(readFileSync(join(prefix,'package.json'),'utf8')).dependencies;
export const toolchain=JSON.parse(readFileSync(new URL('./toolchain.json',import.meta.url),'utf8'));
export const lockHash=()=>createHash('sha256').update(readFileSync(join(prefix,'package-lock.json'))).digest('hex');
export function inspectTools(){
 const lock=JSON.parse(readFileSync(join(prefix,'package-lock.json'),'utf8')),problems=[];
 if(lock.lockfileVersion!==3)problems.push('Expected the reviewed npm v3 lockfile.');
 for(const [name,version] of Object.entries(pins))if(lock.packages?.['']?.dependencies?.[name]!==version)problems.push('Manifest/lock mismatch: '+name);
 for(const [path,item] of Object.entries(lock.packages||{})){
  if(!path)continue;
  if(!item.integrity||!item.resolved?.startsWith('https://registry.npmjs.org/'))problems.push('Unverified registry/integrity: '+path);
  try{if(JSON.parse(readFileSync(join(prefix,path,'package.json'),'utf8')).version!==item.version)problems.push('Installed version differs: '+path);}catch{problems.push('Missing installed tool: '+path);}
 }
 return {ok:problems.length===0,problems,lockSha256:lockHash(),packages:Object.keys(lock.packages||{}).length-1};
}
export function health(){
 const tools=inspectTools(),runtime=process.versions.node===toolchain.node&&typeof stripTypeScriptTypes==='function';
 const npmPath=(process.env.PATH||'').split(':').map(p=>join(p,'npm')).find(p=>existsSync(p));
 let npm;try{npm=JSON.parse(readFileSync(join(dirname(realpathSync(npmPath)),'../package.json'),'utf8')).version;}catch{}
 let resolution=false;try{const req=createRequire(new URL('../testing-entry.cjs',import.meta.url));resolution=realpathSync(req.resolve('@babel/core'))===realpathSync(requireTools.resolve('@babel/core'));}catch{}
 let transforms=false;try{const b=requireTools('@babel/core');transforms=!!b.transformSync('export const view=<div/>;',{configFile:false,babelrc:false,plugins:[requireTools('@babel/plugin-transform-react-jsx'),requireTools('@babel/plugin-transform-modules-commonjs')]}).code&&!!b.transformSync('const count: number=1;',{filename:'health.ts',configFile:false,babelrc:false,plugins:[requireTools('@babel/plugin-transform-typescript')]}).code;}catch{}
 const app=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
 return {ok:tools.ok&&runtime&&npm===toolchain.npm&&resolution&&transforms,node:process.version,expectedNode:toolchain.node,npm,expectedNpm:toolchain.npm,tools,scriptResolution:resolution,jsxAndTypeScriptTransform:transforms,
  optional:{applicationInstall:existsSync(join(root,'node_modules/expo/package.json')),expoRequested:app.dependencies.expo,reactNativeRequested:app.dependencies['react-native'],playwrightRequested:app.devDependencies.playwright,rootLockfile:existsSync(join(root,'package-lock.json'))},
  note:'Offline component fixtures are not Expo bundles, native/device acceptance or Deno type checking.'};
}
