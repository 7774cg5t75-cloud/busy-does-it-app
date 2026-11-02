import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const folder='.test-artifacts/website-expansion',manifest=JSON.parse(readFileSync(folder+'/scenarios.json')),assets=JSON.parse(readFileSync('scripts/fixtures/website-design/assets.json'));
const hash=b=>createHash('sha256').update(b).digest('hex'),git=args=>execFileSync('git',args,{encoding:'utf8'}).trim(),source={commit:git(['rev-parse','HEAD']),tree:git(['rev-parse','HEAD^{tree}'])};
const images=new Map(assets.images.map(a=>{const b=readFileSync(folder+'/assets/'+a.name+'.png');assert.equal(hash(b),a.sha256);return ['https://assets.example.invalid/'+a.name+'.png',b];}));
// Sandbox must remain enabled. Missing OS support fails capture; never falls
// back to --no-sandbox or a privileged browser/service.
const browser=await chromium.launch({headless:true,chromiumSandbox:true});
const results=[];try{
 for(const scenario of manifest.scenarios){for(const [label,viewport]of [['mobile',{width:390,height:844}],['desktop',{width:1440,height:1000}]]){
  for(const stage of ['before','after']){
   const context=await browser.newContext({viewport,deviceScaleFactor:1,javaScriptEnabled:false,serviceWorkers:'block',reducedMotion:'reduce'});const page=await context.newPage();let blocked=0;
   await page.route('**/*',route=>images.has(route.request().url())?route.fulfill({status:200,contentType:'image/png',body:images.get(route.request().url())}):(blocked++,route.abort('blockedbyclient')));
   const html=readFileSync(folder+'/'+scenario[stage],'utf8');await page.setContent(html,{waitUntil:'load'});
   // Decode all real lazy images by bounded scrolling; no external network.
   const height=await page.locator('body').evaluate(el=>el.scrollHeight);assert.ok(height<18000);
   for(let y=0;y<height;y+=700){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(40);}await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(120);
   const metrics=await page.evaluate(()=>{
    const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';};
    const text=[...document.querySelectorAll('h1,h2,h3,p,a,li')].filter(visible);
    const broken=[...document.images].filter(img=>!img.complete||img.naturalWidth===0).map(img=>img.src);
    const overflow=[...document.querySelectorAll('main *,nav *')].filter(visible).filter(el=>{const r=el.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1;}).map(el=>el.tagName+'.'+el.className).slice(0,20);
    const unreadable=text.filter(el=>parseFloat(getComputedStyle(el).fontSize)<14).map(el=>el.tagName);
    const targets=[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.getAttribute('href').slice(1))).map(a=>a.getAttribute('href'));
    const headings=[...document.querySelectorAll('h1')].filter(visible).map(el=>({width:el.getBoundingClientRect().width,fontSize:parseFloat(getComputedStyle(el).fontSize),text:el.textContent}));
    return {documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,overflow,broken,unreadable,targets,headings,imageCount:document.images.length,height:document.documentElement.scrollHeight};
   });
   const filename=scenario.id+'-'+stage+'-'+label+'.png';await page.screenshot({path:folder+'/'+filename,fullPage:true,animations:'disabled'});
   results.push({business:scenario.business,family:scenario.family,stage,viewport,label,filename,sha256:hash(readFileSync(folder+'/'+filename)),metrics,blockedRequests:blocked});
   assert.equal(blocked,0,'Unexpected browser network request');assert.equal(metrics.broken.length,0,filename+' broken image');assert.equal(metrics.targets.length,0,filename+' bad anchor');assert.equal(metrics.unreadable.length,0,filename+' small text');assert.equal(metrics.documentWidth<=viewport.width+1,true,filename+' horizontal page overflow');assert.equal(metrics.overflow.length,0,filename+' overflowing content: '+metrics.overflow.join(','));assert.equal(metrics.headings.length,1);
   await context.close();
  }
 }}
}finally{writeFileSync(folder+'/browser-results.json',JSON.stringify({source,browser:browser.version(),sandboxRequired:true,renderer:'Original src/domain/websiteBuilder.js renderWebsiteHtml',assetManifest:assets,results,hostedAcceptance:false},null,2));await browser.close();}
assert.equal(source.commit,git(['rev-parse','HEAD']));assert.equal(source.tree,git(['rev-parse','HEAD^{tree}']));console.log('PASS genuine sandboxed browser before/after mobile/desktop screenshots; decoded licensed assets, no external browser requests, overflow/text/anchor/image checks. Professional judgement and hosted/native acceptance remain separate.');
