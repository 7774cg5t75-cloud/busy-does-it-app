// Owner-private evidence viewer only. Every image is an existing genuine
// browser capture, never a
// handcrafted business page, generated design mock-up or model result.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,realpathSync,lstatSync,existsSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeWebsiteZip} from '../src/core/websiteZipArchive.mjs';
import {stableJson} from '../src/core/stableJson.mjs';
import {baselineHash} from './lib/hosted-website-baseline.mjs';
const values={};for(const arg of process.argv.slice(2)){const m=arg.match(/^--(before|after|output)=(.+)$/);assert.ok(m&&!values[m[1]],'Use --before=/private/capture --after=/private/capture --output=/private/new-pack');values[m[1]]=resolve(m[2]);}
assert.deepEqual(Object.keys(values).sort(),['after','before','output']);
const repo=realpathSync(resolve(dirname(fileURLToPath(import.meta.url)),'..'));
for(const path of Object.values(values))assert.ok(relative(repo,path).startsWith('..'),'Private source evidence must remain outside the public repository');
const privatePath=path=>{assert.equal(realpathSync(path),path);assert.equal(lstatSync(path).mode&0o077,0,'Private evidence permissions required');};
for(const path of [values.before,values.after,dirname(values.output)])privatePath(path);
assert.ok(!existsSync(values.output),'Do not overwrite prior evidence');
const read=(root,file)=>{const p=resolve(root,file);assert.ok(relative(root,p)&&!relative(root,p).startsWith('..'));assert.equal(realpathSync(p),p);return readFileSync(p);};
const json=(root,file)=>JSON.parse(read(root,file));
const before=json(values.before,'manifest.json'),after=json(values.after,'manifest.json'),beforeCapture=json(values.before,'browser-results.json'),afterCapture=json(values.after,'browser-results.json');
for(const m of [before,after]){assert.equal(m.origin,'verified-hosted-source-local-original-renderer');assert.equal(m.hostedSourceVerified,true);assert.equal(m.providerCalls,0);assert.equal(m.sourceWrites,0);assert.equal(m.publication,false);}
assert.equal(before.inputEnvelopeSha256,after.inputEnvelopeSha256,'Controlled comparison must use the exact same hosted source export');
assert.equal(stableJson(before.source),stableJson(after.source),'Source identity, revisions and PostgreSQL hashes cannot change');
assert.ok(before.pages.some(page=>after.pages.find(next=>next.id===page.id)?.htmlSha256!==page.htmlSha256),'Before/after requires an actual original-renderer HTML change');
for(const r of [beforeCapture,afterCapture]){assert.equal(r.complete,true);assert.equal(r.failed,0);assert.equal(r.results.length,15);}
mkdirSync(values.output,{mode:0o700});mkdirSync(resolve(values.output,'originals'),{mode:0o700});
const files=[],images=[];const write=(file,bytes)=>{writeFileSync(resolve(values.output,file),bytes,{flag:'wx',mode:0o600});files.push({path:file,content:bytes});};
for(const [label,root,m,capture] of [['Before',values.before,before,beforeCapture],['After',values.after,after,afterCapture]]){
 for(const page of m.pages)for(const device of ['mobile','desktop']){
  const shot=capture.results.find(x=>x.pageId===page.id&&x.label===device);assert.ok(shot);
  const png=read(root,shot.file);assert.equal(baselineHash(png),shot.sha256);
  const name=label.toLowerCase()+'-'+page.id+'-'+device,original='originals/'+name+'.png';write(original,png);
  images.push({label,pageId:page.id,pageTitle:page.title,device,file:original,sha256:baselineHash(png),original,originalSha256:baselineHash(png),width:shot.width,height:shot.height,dpr:shot.dpr,htmlSha256:shot.htmlSha256});
 }
}
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const explanation='The same genuine Quiet Light Studio Lab source is rendered by the original Website Builder before and after a narrow renderer correction. Approved content, page scope, source hashes and stored draft remain unchanged. This is not a real-model comparison, a website redesign or professional design approval.';
let html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Quiet Light · actual browser comparison</title><style>body{margin:0;padding:16px;font:16px/1.5 system-ui;color:#172b33;background:#eef0f2}main{max-width:1120px;margin:auto}h1{font-size:26px}h2{font-size:23px;margin-top:40px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0}img{display:block;width:100%;height:auto;background:white}a{color:#172b33;min-height:44px;display:inline-flex;align-items:center}figcaption{font-weight:650;margin:12px 0}code{overflow-wrap:anywhere}@media(max-width:700px){.pair{display:block}}</style><main><h1>Quiet Light Studio · genuine saved-source previews</h1><p>'+escape(explanation)+'</p><p>Source observed '+escape(after.source.observedAt)+'. Each page below includes mobile390×844 and desktop1440×1000 evidence. Tap a full-resolution link for the unmodified original PNG. Narrow320px, tablet768px and DPR2 evidence remains in the separate full capture folders.</p>';
for(const page of after.pages){html+='<section><h2>'+escape(page.title)+'</h2>';for(const device of ['mobile','desktop']){html+='<h3>'+escape(device)+'</h3><div class="pair">';for(const image of images.filter(x=>x.pageId===page.id&&x.device===device))html+='<figure><figcaption>'+escape(image.label+' · '+image.width+'×'+image.height+' @'+image.dpr)+'</figcaption><a href="'+image.original+'">Open full-resolution original PNG</a><a href="'+image.file+'"><img loading="lazy" alt="'+escape(image.label+' '+page.title+' '+device+' actual browser capture')+'" src="'+image.file+'"></a></figure>';html+='</div>';}html+='</section>';}
html+='<footer><p>Original-renderer browser evidence. No AI output, spending, hosted source write, publication or Gold Standard approval.</p></footer></main>';
write('index.html',html);
const report={version:1,viewerIsBusinessWebsite:false,comparisonKind:'same-hosted-source-controlled-renderer-change',description:explanation,source:after.source,inputEnvelopeSha256:after.inputEnvelopeSha256,before:{code:before.code,browser:beforeCapture.browser,checks:beforeCapture.checks},after:{code:after.code,browser:afterCapture.browser,checks:afterCapture.checks},images,fullOriginalPngCount:images.length,genuineModelResult:false,sourceWrites:0,providerCalls:0,publication:false,professionalAcceptance:false};
write('pixel-provenance.json',JSON.stringify(report,null,2)+'\n');
write('README.txt','Quiet Light Studio — actual saved-source browser evidence\n\n'+explanation+'\n\nOpen index.html. originals/ holds byte-identical full-resolution browser PNGs, displayed responsively without pixel edits. Full15-PNG before and after capture sets, including320px/tablet/DPR2, remain separately retained. No AI result or automatic design acceptance.\n');
const zip=makeWebsiteZip(files),zipFile=values.output+'.zip';assert.ok(!existsSync(zipFile));writeFileSync(zipFile,zip,{flag:'wx',mode:0o600});
console.log(JSON.stringify({ok:true,folder:values.output,zip:zipFile,zipSha256:baselineHash(zip),zipBytes:zip.length,fullOriginalPngs:images.length,pixelEdits:0,sameHostedSource:true,sourceWrites:0,providerCalls:0,publication:false,professionalAcceptance:false}));
