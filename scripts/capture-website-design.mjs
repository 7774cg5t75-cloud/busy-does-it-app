import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const intro=process.env.BUSY_INTRO_BROWSER==='1',guided=process.env.BUSY_GUIDED_BROWSER==='1',folder=intro?'.test-artifacts/business-introduction':guided?'.test-artifacts/guided-websites':'.test-artifacts/website-expansion',manifest=JSON.parse(readFileSync(folder+'/scenarios.json')),assets=JSON.parse(readFileSync(guided||intro?'scripts/fixtures/guided-websites/assets.json':'scripts/fixtures/website-design/assets.json'));
const hash=b=>createHash('sha256').update(b).digest('hex'),git=args=>execFileSync('git',args,{encoding:'utf8'}).trim(),source={commit:git(['rev-parse','HEAD']),tree:git(['rev-parse','HEAD^{tree}'])};
const images=new Map(assets.images.map(a=>{const b=readFileSync((intro?'.test-artifacts/guided-websites':folder)+'/assets/'+a.name+'.'+(a.extension||'png'));const expected=a.sha256||(guided?JSON.parse(readFileSync(folder+'/asset-receipts.json')).find(r=>r.name===a.name)?.sha256:null);assert.equal(hash(b),expected);return ['https://assets.example.invalid/'+a.name+'.'+(a.extension||'png'),b];}));
let processedPhotos=false;
if(intro){try{const processed=JSON.parse(readFileSync(folder+'/processed-photos.json'));processedPhotos=true;for(const output of processed.outputs)for(const d of output.derivatives){const bytes=readFileSync(folder+'/'+d.file);assert.equal(hash(bytes),d.sha256);images.set(d.url,bytes);}}catch(error){if(error.code!=='ENOENT')throw error;}}
// Sandbox must remain enabled. Missing OS support fails capture; never falls
// back to --no-sandbox or a privileged browser/service.
const browser=await chromium.launch({headless:true,chromiumSandbox:true});
const results=[],failures=[];const check=(condition,message)=>{if(!condition)failures.push(message);};try{
 for(const scenario of manifest.scenarios){for(const [label,viewport]of [['mobile',{width:390,height:844}],['desktop',{width:1440,height:1000}]]){
  for(const stage of ['before','after']){
   const context=await browser.newContext({viewport,deviceScaleFactor:1,javaScriptEnabled:false,serviceWorkers:'block',reducedMotion:'reduce'});const page=await context.newPage();let blocked=0;const servedImages=[];
   await page.route('**/*',route=>{const url=route.request().url(),bytes=images.get(url);if(!bytes){blocked++;return route.abort('blockedbyclient');}servedImages.push({url,bytes:bytes.length,sha256:hash(bytes)});return route.fulfill({status:200,contentType:url.endsWith('.jpg')?'image/jpeg':url.endsWith('.webp')?'image/webp':'image/png',body:bytes});});
   const html=readFileSync(folder+'/'+scenario[stage],'utf8');await page.setContent(html,{waitUntil:'load'});
   // Decode all real lazy images by bounded scrolling; no external network.
   const height=await page.locator('body').evaluate(el=>el.scrollHeight);assert.ok(height<18000);
   for(let y=0;y<height;y+=700){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(40);}await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(120);
   const metrics=await page.evaluate(()=>{
    const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';};
    const text=[...document.querySelectorAll('h1,h2,h3,p,a,li')].filter(visible);
    const broken=[...document.images].filter(img=>!img.complete||img.naturalWidth===0).map(img=>img.src);
    const overflow=[...document.querySelectorAll('main *,nav *')].filter(visible).filter(el=>{const r=el.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1;}).map(el=>el.tagName+'.'+el.className).slice(0,20);
    const unreadable=text.filter(el=>parseFloat(getComputedStyle(el).fontSize)<14).map(el=>({tag:el.tagName,text:el.textContent.slice(0,60),fontSize:getComputedStyle(el).fontSize}));
    const targets=[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.getAttribute('href').slice(1))).map(a=>a.getAttribute('href'));
    const rgb=s=>{const m=s.match(/^rgba?\(([^)]+)\)$/);if(!m)return null;const a=m[1].split(/[, /]+/).map(Number);return a.length===3||a[3]===1?a.slice(0,3):null;};
    const luminance=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
    const contrastFailures=[],contrastUnmeasured=[];
    for(const el of text){const style=getComputedStyle(el),fg=rgb(style.color);let parent=el,bg=null;while(parent&&!bg){bg=rgb(getComputedStyle(parent).backgroundColor);parent=parent.parentElement;}if(!fg||!bg){contrastUnmeasured.push(el.tagName);continue;}const a=luminance(fg),b=luminance(bg),value=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),large=parseFloat(style.fontSize)>=24||parseFloat(style.fontSize)>=18.66&&Number(style.fontWeight)>=700;if(value<(large?3:4.5))contrastFailures.push({tag:el.tagName,text:el.textContent.slice(0,60),ratio:value});}
    const ctaTargets=[...document.querySelectorAll('.hero .cta')].filter(visible).map(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}));
    const headings=[...document.querySelectorAll('h1')].filter(visible).map(el=>({width:el.getBoundingClientRect().width,fontSize:parseFloat(getComputedStyle(el).fontSize),text:el.textContent}));
    const imageSizes=[...document.images].map(img=>({src:img.src,currentSrc:img.currentSrc,srcset:img.srcset,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,displayWidth:img.getBoundingClientRect().width,displayHeight:img.getBoundingClientRect().height,objectPosition:getComputedStyle(img).objectPosition,objectFit:getComputedStyle(img).objectFit}));
    return {imageSizes,contrastFailures,contrastUnmeasured,ctaTargets,documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,overflow,broken,unreadable,targets,headings,imageCount:document.images.length,height:document.documentElement.scrollHeight};
   });
   const filename=scenario.id+'-'+stage+'-'+label+'.png';await page.screenshot({path:folder+'/'+filename,fullPage:true,animations:'disabled'});
   results.push({business:scenario.business,family:scenario.family,stage,viewport,label,filename,sha256:hash(readFileSync(folder+'/'+filename)),metrics,servedImages,imageTransferBytes:servedImages.reduce((n,r)=>n+r.bytes,0),blockedRequests:blocked});
   if((guided||intro&&scenario.photoExpected)&&stage==='after'){check(metrics.imageSizes[0]?.objectPosition===(label==='mobile'?'50% 0%':'50% 50%'),filename+' reviewed width-specific focal point');}
   if(intro&&processedPhotos&&stage==='after'&&scenario.photoExpected)check(metrics.imageSizes.every(i=>i.srcset&&i.currentSrc.endsWith('.webp')),filename+' browser must select a reviewed responsive derivative');
   if(intro&&stage==='after'){check(metrics.imageCount===(scenario.photoExpected?1:0),filename+' exact sparse-image presentation');check(new Set(metrics.imageSizes.map(i=>i.src)).size===metrics.imageSizes.length,filename+' repeated image filler');}
   check(blocked===0,filename+' unexpected browser request');check(metrics.broken.length===0,filename+' broken images');check(metrics.targets.length===0,filename+' bad anchors');check(metrics.unreadable.length===0,filename+' small text '+JSON.stringify(metrics.unreadable));check(metrics.documentWidth<=viewport.width+1,filename+' horizontal page overflow');check(metrics.overflow.length===0,filename+' overflowing content '+metrics.overflow.join(','));check(metrics.headings.length===1,filename+' heading count');check(metrics.contrastFailures.length===0,filename+' computed contrast '+JSON.stringify(metrics.contrastFailures));check(metrics.ctaTargets.every(t=>t.height>=44&&t.width>=44),filename+' small primary action');

   await context.close();
  }
 }}
}finally{writeFileSync(folder+'/browser-results.json',JSON.stringify({source,browser:browser.version(),sandboxRequired:true,renderer:'Original src/domain/websiteBuilder.js renderWebsiteHtml',assetManifest:assets,results,failures,hostedAcceptance:false},null,2));await browser.close();}
assert.deepEqual(failures,[], 'All browser counterexamples retained: '+failures.join('; '));
assert.equal(source.commit,git(['rev-parse','HEAD']));assert.equal(source.tree,git(['rev-parse','HEAD^{tree}']));console.log('PASS genuine sandboxed browser before/after mobile/desktop screenshots; decoded licensed assets, no external browser requests, overflow/text/anchor/image checks. Professional judgement and hosted/native acceptance remain separate.');
