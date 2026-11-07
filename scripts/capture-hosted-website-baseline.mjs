// Genuine local Chromium pixels from the exact read-only hosted-source export.
// No source mutation, account session, provider request or deployed preview.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,realpathSync,lstatSync,chmodSync} from 'node:fs';
import {resolve,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {measureWebsiteQuality} from './lib/websiteQualityAudit-v3107.mjs';
import {launchFixtureBrowser} from './testing/browser-policy.mjs';
import {HOSTED_BASELINE_VERSION,HOSTED_BASELINE_SOURCE_HASHES,baselineHash} from './lib/hosted-website-baseline.mjs';
import {assertPrivateWebsiteEvidenceOutsideRepository} from './lib/private-website-evidence-paths.mjs';
const args=process.argv.slice(2),arg=args.filter(x=>x.startsWith('--folder='));assert.ok(arg.length===1&&args.length===(args.includes('--system-chromium')?2:1),'Use --folder=/private/built-baseline and optional --system-chromium');
const folder=resolve(arg[0].slice(9));
assertPrivateWebsiteEvidenceOutsideRepository(realpathSync(resolve(dirname(fileURLToPath(import.meta.url)),'..')),folder);
assert.equal(realpathSync(folder),folder);assert.equal(lstatSync(folder).mode&0o077,0,'Owner-private evidence directory required');
const systemChromium=args.includes('--system-chromium');
if(systemChromium){for(const file of ['/usr/bin/chromium',realpathSync('/usr/bin/chromium')])assert.equal(lstatSync(file).mode&0o022,0,'System Chromium cannot be writable by this task');}
const local=file=>{assert.ok(typeof file==='string'&&!file.startsWith('/')&&!file.includes('\0'));const path=resolve(folder,file);assert.ok(relative(folder,path)&&!relative(folder,path).startsWith('..'));assert.equal(realpathSync(path),path);return path;};
const manifest=JSON.parse(readFileSync(local('manifest.json'),'utf8'));
assert.equal(manifest.version,HOSTED_BASELINE_VERSION);
const deterministicProposal=manifest.origin==='deterministic-recommendation-from-verified-hosted-source';
assert.ok(deterministicProposal||manifest.origin==='verified-hosted-source-local-original-renderer','Only actual-source baseline or clearly declared deterministic proposal accepted; no fixture or model origin');
if(deterministicProposal){assert.equal(manifest.hostedSaved,false);assert.equal(manifest.proposalOrigin,'deterministic');assert.equal(manifest.accountSavedByThisTool,false);}
assert.equal(manifest.hostedSourceVerified,true);assert.deepEqual(manifest.source.sourceHashes,HOSTED_BASELINE_SOURCE_HASHES);assert.equal(manifest.sourceWrites,0);assert.equal(manifest.newNativeSignIns,0);assert.equal(manifest.providerCalls,0);assert.equal(manifest.publication,false);assert.equal(manifest.genuineModelResult,false);assert.equal(manifest.pages.length,3);
const origin='https://busy-ai-lab-preview.invalid',canonicalPath=path=>path==='/'?'/':path.replace(/\/$/,'');
const routes=new Map();
for(const spec of manifest.pages){const html=readFileSync(local(spec.outputPath),'utf8');assert.equal(baselineHash(html),spec.htmlSha256);assert.equal(Buffer.byteLength(html),spec.bytes);for(const alias of ['/'+spec.outputPath,('/'+spec.outputPath).replace(/index\.html$/,''),spec.path]){const path=canonicalPath(alias);assert.ok(!routes.has(path)||routes.get(path).spec.id===spec.id);routes.set(path,{spec,html});}}
const captureFolder=resolve(folder,'screenshots');mkdirSync(captureFolder,{mode:0o700});
const write=(file,value)=>writeFileSync(resolve(folder,file),typeof value==='string'||value instanceof Uint8Array?value:JSON.stringify(value,null,2)+'\n',{mode:0o600,flag:'wx'});
const results=[],failures=[],navigation=[],startedAt=new Date().toISOString(),clock=performance.now(),cpu=process.cpuUsage();let checks=0,browser,fatal=null;
const check=(condition,message)=>{checks++;if(!condition)failures.push(message);};
function measure(){
 const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&parseFloat(s.opacity||'1')>0;};
 const rect=e=>{const r=e.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom};};
 const text=[...document.querySelectorAll('h1,h2,h3,p,li,a,summary')].filter(e=>visible(e)&&e.textContent.trim());
 const clipped=text.filter(e=>{const s=getComputedStyle(e);return /hidden|clip/.test(s.overflowX)&&e.scrollWidth>e.clientWidth+3||/hidden|clip/.test(s.overflowY)&&e.scrollHeight>e.clientHeight+3;}).map(e=>({tag:e.tagName,text:e.textContent.trim().slice(0,80),...rect(e)}));
 const headings=[...document.querySelectorAll('main h1')].filter(visible);
 return {title:document.title,description:document.querySelector('meta[name="description"]')?.content||'',canonical:document.querySelector('link[rel="canonical"]')?.getAttribute('href')||null,robots:document.querySelector('meta[name="robots"]')?.content||null,lang:document.documentElement.lang,mainText:document.querySelector('main')?.innerText||'',headings:headings.map(e=>({text:e.textContent.trim(),...rect(e)})),collapsedHeadings:[...document.querySelectorAll('main h1,main h2')].filter(e=>getComputedStyle(e).display!=='none'&&(e.getBoundingClientRect().width<24||e.getBoundingClientRect().height<14)).map(e=>({text:e.textContent.trim(),...rect(e)})),clipped,documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,height:document.documentElement.scrollHeight,navCount:document.querySelectorAll('nav[aria-label]').length,navigationTargets:[...document.querySelectorAll('nav a[href]')].filter(visible).map(e=>({text:e.textContent.trim(),href:e.getAttribute('href'),...rect(e)})),primaryTargets:[...document.querySelectorAll('a.cta,main a[href^="mailto:"],main a[href^="tel:"],button,summary')].filter(visible).map(e=>({text:e.textContent.trim(),...rect(e)})),links:[...document.querySelectorAll('a[href]')].map(e=>({href:e.getAttribute('href'),text:e.textContent.trim()})),ids:[...document.querySelectorAll('[id]')].map(e=>e.id),images:[...document.images].map(e=>({src:e.getAttribute('src'),complete:e.complete,naturalWidth:e.naturalWidth})),executableScripts:[...document.scripts].filter(e=>e.type!=='application/ld+json').length,structuredData:[...document.querySelectorAll('script[type="application/ld+json"]')].map(e=>{try{return JSON.parse(e.textContent);}catch{return {invalid:true};}})};
}
function brokenLinks(metrics,url){
 const bad=[];for(const link of metrics.links){
  if(/^mailto:hello@quiet-light\.example\.invalid$/.test(link.href))continue;
  let target;try{target=new URL(link.href,url);}catch{bad.push(link.href);continue;}
  const row=target.origin===origin&&routes.get(canonicalPath(target.pathname));
  if(!row||target.hash&&!row.html.includes('id="'+decodeURIComponent(target.hash.slice(1))+'"'))bad.push(link.href);
 }return bad;
}
async function verifyNavigation(page,url,width){
 const visits=[];
 for(const destination of manifest.pages){
  await page.goto(url,{waitUntil:'load'});
  const menu=page.locator('nav details');if(await menu.count()&&await menu.isVisible()){await menu.locator('summary').focus();await page.keyboard.press('Enter');}
  let target=null;for(const anchor of await page.locator('nav a[href]').all()){if(!await anchor.isVisible())continue;const href=await anchor.getAttribute('href');const u=new URL(href,url);if(u.origin===origin&&routes.get(canonicalPath(u.pathname))?.spec.id===destination.id){target=anchor;break;}}
  check(!!target,'navigation target missing '+destination.id+' at '+width);if(!target)continue;
  await target.focus();const focus=await target.evaluate(e=>{const s=getComputedStyle(e);return {outline:s.outlineStyle,width:parseFloat(s.outlineWidth)};});check(focus.outline!=='none'&&focus.width>=2,'navigation focus at '+width);
  await target.press('Enter');check(routes.get(canonicalPath(new URL(page.url()).pathname))?.spec.id===destination.id,'actual keyboard route '+destination.id+' at '+width);visits.push(destination.id);
 }
 navigation.push({width,actualKeyboardRoutes:visits});
}
try{
 browser=systemChromium?await chromium.launch({headless:true,chromiumSandbox:true,executablePath:'/usr/bin/chromium',args:['--disable-background-networking','--disable-component-update','--no-first-run']}):await launchFixtureBrowser(chromium);
 for(const spec of manifest.pages)for(const [label,width,height,dpr]of [['narrow',320,844,1],['mobile',390,844,1],['tablet',768,1024,1],['desktop',1440,1000,1],['retina',390,844,2]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,javaScriptEnabled:false,serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),blocked=[];
  try{
   await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===origin){const row=routes.get(canonicalPath(u.pathname));if(row)return route.fulfill({status:200,contentType:'text/html; charset=utf-8',headers:{'x-robots-tag':'noindex, nofollow','cache-control':'no-store'},body:row.html});if(u.pathname==='/favicon.ico')return route.fulfill({status:204,body:''});}blocked.push({origin:u.origin,pathname:u.pathname});return route.abort('blockedbyclient');});
   const url=origin+'/'+spec.outputPath;await page.goto(url,{waitUntil:'load'});
   for(let y=0,n=0;n<40;n++,y+=700){const size=await page.evaluate(()=>document.documentElement.scrollHeight);check(size<25000,'bounded page height '+spec.id);if(y>size)break;await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(20);}await page.evaluate(()=>scrollTo(0,0));
   const metrics=await page.evaluate(measure),quality=await measureWebsiteQuality(page),broken=brokenLinks(metrics,url),key=spec.id+'/'+label;
   for(const [pass,message]of [[metrics.headings.length===1,'one visible H1'],[metrics.title.length>0&&metrics.title.length<=70,'SEO title'],[metrics.description.length>0&&metrics.description.length<=160,'SEO description'],[metrics.lang==='en','document language'],[metrics.navCount>0,'labelled navigation'],[metrics.documentWidth<=width+1,'horizontal overflow'],[metrics.collapsedHeadings.length===0,'collapsed headings'],[metrics.clipped.length===0,'clipped text'],[metrics.navigationTargets.every(e=>e.width>=44&&e.height>=44),'44px navigation targets'],[metrics.primaryTargets.every(e=>e.width>=44&&e.height>=44),'44px primary targets'],[metrics.images.length===0,'image-free source'],[metrics.executableScripts===0,'no executable scripts'],[new Set(metrics.ids).size===metrics.ids.length,'unique element IDs'],[metrics.structuredData.every(x=>!x.invalid),'no invalid structured data (absence recorded)'],[broken.length===0,'supported links'],[blocked.length===0,'no external requests'],[quality.lowContrastCount===0,'measured contrast'],[quality.smallBodyTextCount===0,'body typography'],[quality.smallTouchTargetCount===0,'minimum controls'],[quality.unnamedControlsCount===0,'named controls'],[quality.missingInputLabelCount===0,'labelled inputs'],[quality.missingImageAltCount===0,'image alternatives'],[quality.headingLevelSkips===0,'heading order']])check(pass,key+' '+message);
   for(const copy of spec.requiredVisibleText)check(metrics.mainText.replace(/\s+/g,' ').includes(copy.replace(/\s+/g,' ')),key+' complete approved copy visible');
   await page.keyboard.press('Tab');const focus=await page.evaluate(()=>{const e=document.activeElement,s=getComputedStyle(e);return {href:e.getAttribute('href'),outline:s.outlineStyle,width:parseFloat(s.outlineWidth)};});check(focus.href==='#main'&&focus.outline!=='none'&&focus.width>=2,key+' keyboard skip link');
   await page.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0);});const file='screenshots/quiet-light-'+spec.id+'-'+label+'.png';await page.screenshot({path:resolve(folder,file),fullPage:true,animations:'disabled'});chmodSync(resolve(folder,file),0o600);
   const screenshot=readFileSync(resolve(folder,file));results.push({pageId:spec.id,label,width,height,dpr,file,sha256:baselineHash(screenshot),bytes:screenshot.length,htmlSha256:spec.htmlSha256,metrics,quality,brokenLinks:broken,blockedRequests:blocked,focus});
   if(spec.id==='home'&&['mobile','desktop'].includes(label))await verifyNavigation(page,url,width);
  }finally{await context.close();}
 }
 assert.equal(results.length,15);
 const pack=resolve(folder,'iphone-review-pack');mkdirSync(pack,{mode:0o700});
 const gallery=[];
 for(const result of results.filter(x=>['mobile','desktop'].includes(x.label))){
  const context=await browser.newContext({viewport:{width:390,height:1},javaScriptEnabled:false,serviceWorkers:'block'}),page=await context.newPage();
  try{await page.route('**/*',r=>r.abort('blockedbyclient'));const data=readFileSync(local(result.file)).toString('base64');await page.setContent('<style>html,body{margin:0;background:white}img{display:block;width:390px;height:auto}</style><img alt="Actual source screenshot" src="data:image/png;base64,'+data+'">');await page.locator('img').evaluate(e=>e.decode());const file=result.pageId+'-'+result.label+'.jpg';const bytes=await page.screenshot({type:'jpeg',quality:84,fullPage:true});writeFileSync(resolve(pack,file),bytes,{mode:0o600,flag:'wx'});gallery.push({pageId:result.pageId,label:result.label,file,sha256:baselineHash(bytes),originalPng:result.file,originalPngSHA256:result.sha256});}finally{await context.close();}
 }
 const escape=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const title=deterministicProposal?'Quiet Light Studio · unsaved deterministic recommendation':'Quiet Light Studio · saved-source baseline';
 const description=deterministicProposal?'Genuine Chromium screenshots of an unsaved deterministic recommendation from the verified AI Lab source, rendered locally by the original Website Builder. This is not the stored draft or a model-generated result. No hosted source change, publication or professional design approval.':'Genuine Chromium screenshots of the actual read-only AI Lab draft, rendered locally by the original Website Builder. No fixture substitution, model output, deployed preview or professional design approval.';
 const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(title)+'</title><style>body{margin:0;padding:16px;font:16px/1.5 system-ui;background:#eef0f2;color:#172b33}main{max-width:1120px;margin:auto}h1{font-size:26px}h2{font-size:23px;margin-top:32px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0}img{display:block;width:100%;height:auto}a{color:#172b33;display:inline-block;min-height:44px}figcaption{font-weight:650;margin:10px 0}@media(max-width:700px){.pair{display:block}}</style><main><h1>'+escape(title)+'</h1><p>'+escape(description)+'</p><p>Source observed '+escape(manifest.source.observedAt)+'. Mobile390×844 and desktop1440×1000 below. Full original320px, tablet768px and DPR2 PNGs remain separately retained.</p>'+manifest.pages.map(p=>'<section><h2>'+escape(p.title)+'</h2><div class="pair">'+gallery.filter(x=>x.pageId===p.id).map(x=>'<figure><figcaption>'+escape(x.label)+'</figcaption><a href="'+escape(x.file)+'"><img alt="'+escape(p.title+' actual '+x.label+' screenshot')+'" src="'+escape(x.file)+'"></a></figure>').join('')+'</div></section>').join('')+'</main>';
 writeFileSync(resolve(pack,'index.html'),html,{mode:0o600,flag:'wx'});writeFileSync(resolve(pack,'pixel-provenance.json'),JSON.stringify({viewerIsBusinessWebsite:false,images:gallery,browser:browser.version(),source:manifest.source,genuineModelResult:false,professionalAcceptance:false},null,2)+'\n',{mode:0o600,flag:'wx'});
}catch(error){fatal={name:error.name,message:error.message};throw error;}
finally{
 const report={version:1,status:!browser?'environment-blocked':fatal?'failed':failures.length?'quality-failed':'passed',origin:manifest.origin,source:manifest.source,code:manifest.code,browser:browser?.version()||null,browserBinary:systemChromium?'/usr/bin/chromium':'Playwright pinned browser cache',sandboxRequired:true,sourceInputEnvelopeSha256:manifest.inputEnvelopeSha256,results,navigation,checks,passed:checks-failures.length,failed:failures.length,failures,fatalError:fatal,complete:results.length===15&&!fatal,qualityPassed:results.length===15&&!fatal&&failures.length===0,providerCalls:0,newNativeSignIns:0,sourceWrites:0,publication:false,genuineModelResult:false,professionalAcceptance:false,approvedGoldStandards:0,resources:{startedAt,finishedAt:new Date().toISOString(),wallMs:Math.round(performance.now()-clock),nodeCpuMicroseconds:process.cpuUsage(cpu),nodeMaxRssKiB:process.resourceUsage().maxRSS}};write('browser-results.json',report);await browser?.close();console.log(JSON.stringify({status:report.status,origin:report.origin,complete:report.complete,browser:report.browser,screenshots:results.length,checks,passed:report.passed,failed:report.failed,failures,output:folder,providerCalls:0,publication:false}));
}
assert.deepEqual(failures,[],'Actual baseline failures must remain visible; do not weaken checks');
