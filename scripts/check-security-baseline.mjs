// Deterministic checks complement an actual registry audit, never replace it.
import {readFileSync,readdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {sourceSecretFindings} from './lib/source-secret-findings.mjs';
export {sourceSecretFindings};

const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):e.isFile()&&/\.(?:[cm]?js|tsx?|ya?ml)$/.test(e.name)?[dir+'/'+e.name]:[]);
const files=['src','supabase/functions','.github'].flatMap(walk);
const found=files.flatMap(path=>sourceSecretFindings(readFileSync(path,'utf8')).map(f=>({path,...f})));assert.deepEqual(found,[],'Potential secrets: paths/lines only; never print matched bytes');
const lock=JSON.parse(readFileSync('package-lock.json','utf8'));let packages=0;for(const [path,pkg]of Object.entries(lock.packages||{})){if(!path||pkg.link)continue;packages++;assert.match(pkg.version,/^\d+\.\d+\.\d+/,'Exact locked package version '+path);if(pkg.resolved){const url=new URL(pkg.resolved);assert.equal(url.protocol,'https:','Insecure package URL '+path);assert.equal(url.hostname,'registry.npmjs.org','Unreviewed package host '+path);assert.match(pkg.integrity||'',/^sha(?:512|1)-/,'Missing locked integrity '+path);}}
assert.equal(sourceSecretFindings('key='+['sk-','x'.repeat(40)].join('')).length,1);assert.equal(sourceSecretFindings('process.env.'+'EXPO_PUBLIC_SERVICE_ROLE_KEY').length,1);
console.log(JSON.stringify({passed:true,sourceFiles:files.length,lockedPackages:packages,secretsLogged:false,registryVulnerabilityAudit:'Separate npm audit required; not established by this check'}));
