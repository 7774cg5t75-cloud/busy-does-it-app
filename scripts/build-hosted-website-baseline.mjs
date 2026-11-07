// Explicit private export only. No Auth, credentials, database or provider IO.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,realpathSync,lstatSync,existsSync} from 'node:fs';
import {resolve,dirname,isAbsolute,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {buildPortableWebsiteSource} from '../src/core/websiteSourceExport.mjs';
import {buildStandaloneWebsiteArchive} from '../src/core/websiteStandaloneArchive.mjs';
import {renderWebsiteHtml} from '../src/domain/websiteBuilder.js';
import {renderHostedBaseline,baselineHash} from './lib/hosted-website-baseline.mjs';
import {assertPrivateWebsiteEvidenceOutsideRepository} from './lib/private-website-evidence-paths.mjs';
const args=process.argv.slice(2),values={};
for(const arg of args){const m=arg.match(/^--(input|output)=(.+)$/);assert.ok(m&&!values[m[1]],'Use exactly --input=/private/source.json --output=/private/new-directory');values[m[1]]=m[2];}
assert.deepEqual(Object.keys(values).sort(),['input','output']);
const root=realpathSync(resolve(dirname(fileURLToPath(import.meta.url)),'..')),input=resolve(values.input),output=resolve(values.output);
assertPrivateWebsiteEvidenceOutsideRepository(root,input,output);
const privatePath=path=>{assert.ok(isAbsolute(path));assert.equal(realpathSync(path),path,'Symlinked private evidence path refused');const mode=lstatSync(path).mode;assert.equal(mode&0o077,0,'Private owner-only permissions required');};
privatePath(input);assert.ok(lstatSync(input).isFile());assert.ok(lstatSync(input).size<=2000000);
privatePath(dirname(output));assert.ok(lstatSync(dirname(output)).isDirectory());assert.ok(!existsSync(output),'Evidence output must be new; no overwrite');
const inputBytes=readFileSync(input);let envelope;try{envelope=JSON.parse(inputBytes);}catch{throw Error('Invalid private source export JSON; no contents logged');}
const before=baselineHash(inputBytes),clock=performance.now(),cpu=process.cpuUsage();
const result=renderHostedBaseline(envelope);
const git=async(...args)=>(await promisify(execFile)('git',args,{cwd:root,encoding:'utf8'})).stdout.trim();
const code={commit:await git('rev-parse','HEAD'),tree:await git('rev-parse','HEAD^{tree}'),workingTreeDirty:!!await git('status','--porcelain'),rendererFileSha256:baselineHash(readFileSync(resolve(root,'src/domain/websiteBuilder.js')))};
mkdirSync(output,{mode:0o700});
const write=(name,bytes)=>{const target=resolve(output,name);assert.ok(relative(output,target)&&!relative(output,target).startsWith('..'));mkdirSync(dirname(target),{recursive:true,mode:0o700});writeFileSync(target,bytes,{flag:'wx',mode:0o600});};
for(const page of result.pages)write(page.outputPath,page.html);
const portable=buildPortableWebsiteSource(result.draft);assert.ok(portable.ok,portable.reason);assert.equal(portable.pages,3);
for(const value of Object.values(envelope.approvedBinding))assert.ok(!portable.json.includes(value),'Private original binding must not enter portable public source');
write('portable-content.json',portable.json+'\n');
const archive=await buildStandaloneWebsiteArchive(result.draft,{renderPage:renderWebsiteHtml,digestBytes:async bytes=>baselineHash(bytes),readPhoto:async()=>{throw Error('Image-free source may not read media');},isCurrent:()=>baselineHash(readFileSync(input))===before});
assert.ok(archive.ok,archive.reason);assert.equal(archive.pages,3);assert.equal(archive.photos,0);write('portable-website.zip',archive.bytes);
const manifest={...result,draft:undefined,pages:result.pages.map(({html,...page})=>page),inputEnvelopeSha256:before,code,exportEvidence:{portableSourceSha256:baselineHash(portable.json),portableSourceBytes:portable.bytes,archiveSha256:baselineHash(archive.bytes),archiveBytes:archive.bytes.length,pages:archive.pages,photos:archive.photos},resources:{wallMs:Math.round(performance.now()-clock),nodeCpuMicroseconds:process.cpuUsage(cpu),maxRssKiB:process.resourceUsage().maxRSS,providerTokens:null,providerCostGBP:0}};
write('manifest.json',JSON.stringify(manifest,null,2)+'\n');assert.equal(baselineHash(readFileSync(input)),before,'Original hosted export changed');
console.log(JSON.stringify({ok:true,output,origin:manifest.origin,observedAt:manifest.source.observedAt,pages:result.pages.length,code,providerCalls:0,newNativeSignIns:0,sourceWrites:0,publication:false}));
