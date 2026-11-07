import {mkdirSync,writeFileSync} from 'node:fs';
import {preservationFoundationPackage} from './lib/preservation-foundation-package.mjs';
const p=preservationFoundationPackage(process.cwd()),dir='docs/sql-proposals/preservation-foundation';mkdirSync(dir,{recursive:true});
writeFileSync(dir+'/install.sql',p.sql);writeFileSync(dir+'/rollback-retain.sql',p.rollback);
const {sql,rollback,...manifest}=p;writeFileSync(dir+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Prepared review-fused original preservation foundation; no connection or execution. '+p.sha256);
