// Verify the public PGDG key already supplied by Ubuntu's postgresql-common.
// No download, fallback, key import, repository change or arbitrary path option.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstatSync,realpathSync,readFileSync,mkdtempSync,chmodSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

export const CI_PGDG_KEY='/etc/apt/keyrings/busy-pgdg.asc';
export const CI_PGDG_PACKAGED_SOURCE='/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc';
export const CI_PGDG_FINGERPRINT='B97B0AFCAA1A47F044F244A07FCC7D46ACCC4CF8';
let verificationStage='arguments';
let publicSourceStat=null;

// Engineering listing fixtures test this parser; only the fixed-path CLI below
// obtains real cryptographic fingerprints from the installed public key bytes.
export function verifyCiPgdgKeyListing(listing,nowSeconds=Math.floor(Date.now()/1000)){
 assert.ok(typeof listing==='string'&&listing.length>0&&listing.length<=32768,'Bounded public-key listing required');
 assert.ok(Number.isSafeInteger(nowSeconds)&&nowSeconds>0,'Current verification clock required');
 const rows=listing.trim().split(/\r?\n/).map(line=>line.split(':'));
 assert.equal(rows.filter(row=>row[0]==='pub').length,1,'Exactly one public primary key required');
 assert.ok(rows.every(row=>['pub','fpr','uid'].includes(row[0])),'Secret, subkey or unexpected key records refused');
 assert.ok(rows.every(row=>!['r','e','d','i'].includes(row[1])),'Revoked, expired, disabled or invalid key refused');
 const pub=rows[0];assert.equal(pub[0],'pub','Primary key must precede its fingerprint');
 assert.ok(pub.length>=12&&pub[4]===CI_PGDG_FINGERPRINT.slice(-16)&&/s/i.test(pub[11])&&!pub[11].includes('D'),'Reviewed signing key required');
 const epoch=value=>{assert.match(value,/^\d+$/,'Numeric key timestamp required');const n=Number(value);assert.ok(Number.isSafeInteger(n));return n;};
 assert.ok(epoch(pub[5])>0&&epoch(pub[5])<=nowSeconds,'Future or missing key creation refused');
 if(pub[6]&&pub[6]!=='0')assert.ok(epoch(pub[6])>nowSeconds,'Expired signing key refused');
 const fingerprints=rows.filter(row=>row[0]==='fpr');
 assert.equal(fingerprints.length,1,'Exactly one full primary fingerprint required');
 assert.equal(rows[1]?.[0],'fpr','Primary fingerprint must follow the public key');
 assert.equal(fingerprints[0][9],CI_PGDG_FINGERPRINT,'Unreviewed PGDG signing fingerprint refused');
 return {fingerprint:CI_PGDG_FINGERPRINT,primaryKeys:1};
}

function verifyInstalledKey(){
 verificationStage='frozen-ancestry';
 for(const directory of ['/','/etc','/etc/apt','/etc/apt/keyrings']){const ancestor=lstatSync(directory);assert.ok(ancestor.isDirectory()&&!ancestor.isSymbolicLink()&&ancestor.uid===0&&(ancestor.mode&0o022)===0&&realpathSync(directory)===directory,'Trusted frozen-key ancestry required');}
 verificationStage='source-file';
 const stat=lstatSync(CI_PGDG_KEY);
 verificationStage='source-type';
 assert.ok(stat.isFile()&&!stat.isSymbolicLink()&&realpathSync(CI_PGDG_KEY)===CI_PGDG_KEY,'Regular non-symlink packaged key required');
 verificationStage='source-owner-mode-size';
 publicSourceStat={uid:Number.isSafeInteger(stat.uid)&&stat.uid>=0&&stat.uid<=4294967295?stat.uid:null,permissionMode:(stat.mode&0o7777).toString(8).padStart(4,'0'),bytes:Number.isSafeInteger(stat.size)&&stat.size>=0?stat.size:null};
 assert.ok(stat.uid===0&&(stat.mode&0o7777)===0o644&&stat.size>0&&stat.size<=32768,'Root-owned bounded frozen public key required');
 verificationStage='packaged-source';
 const packaged=lstatSync(CI_PGDG_PACKAGED_SOURCE);
 assert.ok(packaged.isFile()&&!packaged.isSymbolicLink()&&packaged.uid===0&&packaged.size>0&&packaged.size<=32768&&realpathSync(CI_PGDG_PACKAGED_SOURCE)===CI_PGDG_PACKAGED_SOURCE,'Original bounded regular packaged source required');
 const run=(file,args,env)=>execFileSync(file,args,{encoding:'utf8',timeout:5000,maxBuffer:32768,env,stdio:['ignore','pipe','pipe']});
 const environment={LANG:'C',LC_ALL:'C'};
 verificationStage='package-owner';
 const owner=run('/usr/bin/dpkg-query',['--search',CI_PGDG_PACKAGED_SOURCE],environment).trim();
 assert.match(owner,new RegExp('^postgresql-common(?::[a-z0-9-]+)?: '+CI_PGDG_PACKAGED_SOURCE.replaceAll('.','\\.')+'$'),'Original package ownership required');
 verificationStage='package-status';
 const status=run('/usr/bin/dpkg-query',['--show','--showformat=${Package}\t${Version}\t${db:Status-Status}','postgresql-common'],environment).trim().split('\t');
 assert.ok(status.length===3&&status[0]==='postgresql-common'&&status[1]&&status[2]==='installed','Installed original package required');
 verificationStage='source-file';
 const before=readFileSync(CI_PGDG_KEY);
 assert.equal(before.length,stat.size,'Frozen public key size changed');
 assert.deepEqual(readFileSync(CI_PGDG_PACKAGED_SOURCE),before,'Frozen key must match original packaged bytes');
 verificationStage='key-display';
 const home=mkdtempSync(join(tmpdir(),'busy-ci-pgdg-'));
 try{
  chmodSync(home,0o700);
  const listing=run('/usr/bin/gpg',['--no-options','--batch','--no-tty','--homedir',home,'--no-auto-key-retrieve','--with-colons','--with-fingerprint','--show-keys',CI_PGDG_KEY],{...environment,GNUPGHOME:home});
  verificationStage='key-listing';
  const result=verifyCiPgdgKeyListing(listing);
  verificationStage='stability';
  assert.deepEqual(readFileSync(CI_PGDG_KEY),before,'Frozen public key changed during verification');
  assert.deepEqual(readFileSync(CI_PGDG_PACKAGED_SOURCE),before,'Packaged public key changed during verification');
  const final=lstatSync(CI_PGDG_KEY);assert.ok(final.isFile()&&!final.isSymbolicLink()&&final.dev===stat.dev&&final.ino===stat.ino&&final.uid===0&&(final.mode&0o7777)===0o644&&final.size===stat.size,'Frozen public-key identity changed during verification');
  return {ok:true,source:'installed-postgresql-common-public-key',path:CI_PGDG_KEY,packagedSource:CI_PGDG_PACKAGED_SOURCE,packageVersion:status[1],...result,sha256:createHash('sha256').update(before).digest('hex'),downloads:0,keyImports:0,repositoryChanges:0};
 }finally{rmSync(home,{recursive:true,force:true});}
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{assert.equal(process.argv.length,2,'No arguments, paths, URLs or fallback keys are accepted');console.log(JSON.stringify(verifyInstalledKey()));}
 catch(error){const code=['ENOENT','EACCES','ERR_ASSERTION','ETIMEDOUT'].includes(error?.code)?error.code:'verification-refused';console.error('CI PGDG packaged-key verification refused; no repository trust was changed. stage='+verificationStage+' code='+code+(verificationStage==='source-owner-mode-size'&&publicSourceStat?' publicSourceStat='+JSON.stringify(publicSourceStat):''));process.exitCode=1;}
}
