import {mkdirSync,writeFileSync} from 'node:fs';
import {aiLabRunnerFoundationPackage} from './lib/ai-lab-runner-foundation-package.mjs';
const {sql,rollback,...manifest}=aiLabRunnerFoundationPackage(process.cwd());
const dir='docs/sql-proposals/ai-lab-runner-foundation';mkdirSync(dir,{recursive:true});
for(const [name,value] of [['install.sql',sql],['rollback-retain.sql',rollback],['manifest.json',JSON.stringify(manifest,null,2)+'\n']])writeFileSync(dir+'/'+name,value);
console.log('Prepared separately fused runner-owned source proposal only: '+manifest.sha256+'; no connection or execution.');
