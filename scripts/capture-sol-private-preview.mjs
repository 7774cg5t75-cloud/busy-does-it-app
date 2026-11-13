// Genuine local browser pixels of ORIGINAL rendered result HTML. No model,
// credential, hosted source, publishing or private-recipient-key capability.
import {readFileSync,writeFileSync,mkdirSync,lstatSync,realpathSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {solRecoveryHash,SOL_RESULT_PREVIEW_VERSION} from './lib/sol-result-recovery.mjs';
import {assertPrivateWebsiteEvidenceOutsideRepository} from './lib/private-website-evidence-paths.mjs';
import {measureWebsiteQuality} from './lib/websiteQualityAudit-v3107.mjs';
import {launchFixtureBrowser} from './testing/browser-policy.mjs';
const root=realpathSync(resolve(dirname(fileURLToPath(import.meta.url)),'..'));
const need=(v,id)=>{if(!v)throw Error('SOL_PRIVATE_CAPTURE_'+id);};
const safe=(directory,name)=>{need(typeof name==='string'&&!name.startsWith('/')&&!name.split('/').includes('..'),'PATH');const p=resolve(directory,name);need(relative(directory,p)&&!relative(directory,p).startsWith('..')&&realpathSync(p)===p,'PATH');const s=lstatSync(p);need(s.isFile()&&!s.isSymbolicLink()&&(s.mode&0o777)===0o600,'PRIVATE_FILE');return p;};
export async function captureSolPrivatePreview(directory,{syntheticTest=false,systemChromium=false}={}){
 need(resolve(directory)===directory&&realpathSync(directory)===directory&&(lstatSync(directory).mode&0o777)===0o700,'PRIVATE_DIRECTORY');assertPrivateWebsiteEvidenceOutsideRepository(root,directory);
 const manifest=JSON.parse(readFileSync(safe(directory,'manifest.json'),'utf8'));
 need(manifest.version===SOL_RESULT_PREVIEW_VERSION&&manifest.websiteWrites===0&&manifest.publication===false&&manifest.hostedSaved===false&&manifest.pages?.map(p=>p.id).join(',')==='home,services,contact','MANIFEST');
 need(syntheticTest?manifest.syntheticFixture===true&&manifest.genuineModelResult===false:manifest.genuineModelResult===true&&((manifest.origin==='independently-settled-real-Sol-unsaved-private-proposal'&&manifest.financialStatus==='independently-settled')||(manifest.origin==='real-Sol-local-preview-financial-status-UNKNOWN'&&manifest.financialStatus==='unknown'&&manifest.studioReviewPrepared===false&&manifest.requiresIndependentFinancialCompletion===true&&manifest.settlement?.actualUsageAccountingGBP===null&&manifest.settlement.liabilityMustRemainReserved===true)),'ORIGIN');
 if(!syntheticTest)need(typeof manifest.nativeRunSucceeded==='boolean'&&manifest.finishedWebsiteClaim===false&&(manifest.nativeRunSucceeded||manifest.postStepFailure===true&&manifest.nativeCompletionStatus==='native-poststep-failure-qualified-preview'),'NATIVE_COMPLETION_QUALIFICATION');
 const origin='https://busy-sol-private-preview.invalid',canonical=p=>p==='/'?'/':p.replace(/\/$/,'');
 const routes=new Map();for(const p of manifest.pages){const html=readFileSync(safe(directory,p.outputPath),'utf8');need(solRecoveryHash(html)===p.htmlSha256&&Buffer.byteLength(html)===p.bytes,'HTML_HASH');for(const path of ['/'+p.outputPath,('/'+p.outputPath).replace(/index\.html$/,''),p.path]){const k=canonical(path);need(!routes.has(k)||routes.get(k).spec.id===p.id,'ROUTE');routes.set(k,{spec:p,html});}}
 const output=resolve(directory,'screenshots');mkdirSync(output,{mode:0o700});
 const write=(name,value)=>{writeFileSync(resolve(directory,name),typeof value==='string'||value instanceof Uint8Array?value:JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});};
 const results=[],failures=[],navigation=[],startedAt=new Date().toISOString();let browser,fatal=null,checks=0;
 const check=(v,label)=>{checks++;if(!v)failures.push(label);};
 try{
  const requireBrowser=createRequire(new URL('./browser-tools/package.json',import.meta.url));need(requireBrowser('playwright/package.json').version==='1.58.2','PINNED_BROWSER_TOOLS');const {chromium}=requireBrowser('playwright');
  if(systemChromium){for(const path of ['/usr/bin/chromium',realpathSync('/usr/bin/chromium')])need((lstatSync(path).mode&0o022)===0,'SYSTEM_BROWSER');browser=await chromium.launch({headless:true,chromiumSandbox:true,executablePath:'/usr/bin/chromium',args:['--disable-background-networking','--disable-component-update','--no-first-run']});}
  else browser=await launchFixtureBrowser(chromium);
  for(const spec of manifest.pages)for(const[label,width,height]of[['narrow',320,844],['mobile',390,844],['desktop',1440,1000]]){
   const context=await browser.newContext({viewport:{width,height},javaScriptEnabled:false,serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),blocked=[];
   try{
    await page.route('**/*',route=>{const u=new URL(route.request().url()),row=u.origin===origin&&routes.get(canonical(u.pathname));if(row)return route.fulfill({status:200,contentType:'text/html; charset=utf-8',headers:{'x-robots-tag':'noindex, nofollow','cache-control':'no-store'},body:row.html});if(u.origin===origin&&u.pathname==='/favicon.ico')return route.fulfill({status:204,body:''});blocked.push(u.origin+u.pathname);return route.abort('blockedbyclient');});
    const url=origin+'/'+spec.outputPath;await page.goto(url,{waitUntil:'load'});
    const metrics=await page.evaluate(()=>({title:document.title,description:document.querySelector('meta[name="description"]')?.content||'',width:innerWidth,documentWidth:document.documentElement.scrollWidth,h1:[...document.querySelectorAll('main h1')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0;}).length,images:document.images.length,scripts:[...document.scripts].filter(e=>e.type!=='application/ld+json').length,body:document.querySelector('main')?.innerText||'',links:[...document.querySelectorAll('a[href]')].map(e=>({text:e.textContent.trim(),href:e.getAttribute('href')}))}));
    const quality=await measureWebsiteQuality(page),key=spec.id+'/'+label;
    check(metrics.h1===1,key+' one visible H1');check(metrics.documentWidth<=width+1,key+' no horizontal overflow');check(metrics.images===0,key+' image free');check(metrics.scripts===0,key+' no executable script');check(metrics.title.length>0&&metrics.title.length<=70,key+' bounded title');check(metrics.description.length>0&&metrics.description.length<=160,key+' bounded description');check(blocked.length===0,key+' no external request');check(quality.lowContrastCount===0,key+' measured contrast');check(quality.smallBodyTextCount===0,key+' readable body');check(quality.unnamedControlsCount===0,key+' named controls');check(quality.headingLevelSkips===0,key+' heading order');
    for(const link of metrics.links){if(/^mailto:[^<>\s]+$/.test(link.href))continue;let valid=false;try{const u=new URL(link.href,url),row=u.origin===origin&&routes.get(canonical(u.pathname));valid=!!row&&(!u.hash||row.html.includes('id="'+decodeURIComponent(u.hash.slice(1))+'"'));}catch{}check(valid,key+' supported local link');}
    if(spec.id==='home'&&label!=='narrow')for(const destination of manifest.pages){await page.goto(url,{waitUntil:'load'});const menu=page.locator('nav details');if(await menu.count()&&await menu.isVisible()){await menu.locator('summary').focus();await page.keyboard.press('Enter');}let target=null;for(const a of await page.locator('nav a[href]').all()){if(!await a.isVisible())continue;const u=new URL(await a.getAttribute('href'),url);if(u.origin===origin&&routes.get(canonical(u.pathname))?.spec.id===destination.id){target=a;break;}}check(!!target,key+' navigation '+destination.id);if(target){await target.focus();await target.press('Enter');check(routes.get(canonical(new URL(page.url()).pathname))?.spec.id===destination.id,key+' actual keyboard destination '+destination.id);navigation.push({label,destination:destination.id});}}
    await page.goto(url,{waitUntil:'load'});const bytes=await page.screenshot({fullPage:true,animations:'disabled'}),file='screenshots/'+(syntheticTest?'SYNTHETIC-':'')+spec.id+'-'+label+(manifest.financialStatus==='unknown'?'-FINANCIAL-UNKNOWN':'')+(manifest.postStepFailure===true?'-NATIVE-POSTSTEP-FAILURE':'')+'.png';write(file,bytes);results.push({pageId:spec.id,label,width,height,file,sha256:solRecoveryHash(bytes),htmlSha256:spec.htmlSha256,financialStatus:manifest.financialStatus??'synthetic',nativeRunSucceeded:manifest.nativeRunSucceeded??null,postStepFailure:manifest.postStepFailure??false,metrics,quality,blockedRequests:blocked});
   }finally{await context.close();}
  }
 }catch(error){
  // Match actual native failure text, not a launch command's ordinary sandbox
  // flag. Retain bounded non-secret predicates instead of private paths/body.
  const message=String(error?.message??''),signals={namespaceDenied:/Failed to move to new namespace|Operation not permitted|No usable sandbox|EPERM|clone[^\n]*(?:denied|not permitted)/i.test(message),missingBrowser:/Executable doesn't exist|browserType\.launch[^\n]*executable[^\n]*not found/i.test(message),missingPackage:error?.code==='MODULE_NOT_FOUND',missingLibrary:/error while loading shared libraries/i.test(message),crashpadConfiguration:/chrome_crashpad_handler:[^\n]*--database is required/i.test(message)};
  fatal={name:error?.name??'Error',code:/^[A-Z0-9_]+$/.test(message)?message:signals.namespaceDenied?'CHROMIUM_SANDBOX_OR_PROCESS_DENIED':signals.missingBrowser?'PINNED_BROWSER_BINARY_UNAVAILABLE':signals.missingPackage?'PINNED_BROWSER_TOOLS_UNAVAILABLE':signals.missingLibrary?'CHROMIUM_SHARED_LIBRARY_UNAVAILABLE':signals.crashpadConfiguration?'CHROMIUM_CRASHPAD_CONFIGURATION_UNAVAILABLE':'BROWSER_OR_PRIVATE_INPUT_FAILURE',signals};
 }
 finally{
  const report={version:'busy.sol-private-browser-capture.v1',status:fatal?(browser?'failed':'environment-blocked'):failures.length?'quality-failed':'passed',startedAt,finishedAt:new Date().toISOString(),syntheticFixture:syntheticTest,genuineModelResult:!syntheticTest&&manifest.genuineModelResult,financialStatus:manifest.financialStatus??'synthetic',browser:browser?.version()??null,sandboxRequired:true,checks,failed:failures.length,failures,fatal,results,navigation,providerCalls:0,privateKeyReads:0,websiteWrites:0,publication:false,professionalAcceptance:false};
  write('browser-results.json',report);await browser?.close();
  return {status:report.status,checks,failed:failures.length,complete:results.length===9,screenshots:results.length,output:directory,reportSha256:solRecoveryHash(readFileSync(directory+'/browser-results.json')),syntheticFixture:syntheticTest,genuineModelResult:report.genuineModelResult,providerCalls:0,websiteWrites:0};
 }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),path=args.find(a=>a.startsWith('--capture='));
 if(!path||args.some(a=>a!==path&&!['--synthetic-test','--system-chromium'].includes(a))||args.filter(a=>a.startsWith('--capture=')).length!==1)process.stdout.write('REVIEW_ONLY_NO_BROWSER_NO_KEY_ACCESS\n');
 else try{const r=await captureSolPrivatePreview(path.slice(10),{syntheticTest:args.includes('--synthetic-test'),systemChromium:args.includes('--system-chromium')});process.stdout.write(JSON.stringify(r)+'\n');if(r.status!=='passed')process.exitCode=r.status==='environment-blocked'?2:1;}catch{process.stderr.write('STOP_PRIVATE_CAPTURE_REFUSED_NO_PRIVATE_VALUES\n');process.exitCode=1;}
}
