import {mkdirSync,writeFileSync} from 'node:fs';
import {aiLabFoundationPackage} from './lib/ai-lab-foundation-package.mjs';
const {sql,rollback,preconditions,...manifest}=aiLabFoundationPackage(process.cwd()),dir='docs/sql-proposals/ai-lab-foundation';
mkdirSync(dir,{recursive:true});writeFileSync(dir+'/install.sql',sql);writeFileSync(dir+'/rollback-retain.sql',rollback);writeFileSync(dir+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Prepared fused AI Lab proposal only, no connection/execution: '+manifest.sha256);
