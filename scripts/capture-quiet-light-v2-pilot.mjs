// Genuine original-renderer comparison evidence. Candidate 02 is an explicitly
// authored OFFLINE fixture, not a real-model output or a temporal before/after.
// No hosted access, provider request, private media or executable business code.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,realpathSync,mkdirSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {stableJson} from '../src/core/stableJson.mjs';
import {writeQuietPilotReviewPack} from './lib/quiet-pilot-review-pack.mjs';
const folder=resolve(process.argv.find(arg=>arg.startsWith('--folder='))?.slice(9)||'.test-artifacts/quiet-light-v2-pilot');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=name=>JSON.parse(readFileSync(resolve(folder,name),'utf8'));
const manifest=json('manifest.json'),scenarios=json('scenarios.json'),origins=json('origin-key.json');
const git=async(...args)=>(await promisify(execFile)('git',args,{encoding:'utf8'})).stdout.trim();
const source={commit:await git('rev-parse','HEAD'),tree:await git('rev-parse','HEAD^{tree}'),workingTreeChanged:!!(await git('status','--porcelain'))};
if(process.env.CI)assert.equal(source.workingTreeChanged,false,'Frozen CI capture requires clean source');
assert.equal(scenarios.mission,'quiet-light-v2-pilot');
assert.equal(manifest.sourceSha,source.commit);assert.equal(manifest.sourceTree,source.tree);
assert.deepEqual(scenarios.source,{commit:source.commit,tree:source.tree});
assert.equal(manifest.providerCalls,0);assert.equal(manifest.genuineModelResult,false);assert.equal(manifest.paidInference,false);
assert.equal(manifest.accountSaved,false);assert.equal(manifest.publication,false);assert.equal(manifest.goldStandards.approved,0);
assert.equal(scenarios.providerCalls,0);assert.equal(scenarios.genuineModelResult,false);assert.equal(origins.liveModelCandidate,null);
assert.deepEqual(scenarios.assets,[]);assert.equal(scenarios.sites.length,2);assert.equal(manifest.pages.length,6);
assert.equal(sha(stableJson(json('synthetic-provider-input.json'))),manifest.inputDigest);
assert.equal(sha(stableJson(json('strict-response-schema.json'))),manifest.schemaDigest);
assert.equal(sha(stableJson(json('complete-disabled-request.json'))),manifest.wireDigest);
assert.equal(scenarios.inputDigest,manifest.inputDigest);
const expectedOrigins=['deterministic-recommendation','deterministic-offline-fixture'];
function local(file){assert.ok(typeof file==='string'&&!file.startsWith('/')&&!file.includes('\0'));const path=realpathSync(resolve(folder,file));assert.ok(path.startsWith(realpathSync(folder)+sep),'Evidence path escape');return path;}
for(const [index,site] of scenarios.sites.entries()){
 assert.equal(site.id,'candidate-0'+(index+1));assert.equal(site.origin,expectedOrigins[index]);assert.equal(site.businessName,'Quiet Light Studio');assert.equal(site.approvedInputDigest,manifest.inputDigest);
 assert.equal(origins.candidates[index].id,site.id);assert.equal(origins.candidates[index].origin,site.origin);assert.equal(origins.candidates[index].genuineModelResult,false);
 assert.deepEqual(site.pages.map(page=>page.id),['home','services','contact']);
 for(const spec of site.pages){
  assert.equal(spec.before,null,'Do not invent a temporal baseline');assert.ok(/^(?:index\.html|(?:[a-z0-9-]+\/)+index\.html)$/.test(spec.outputPath));assert.equal(spec.after,site.id+'/'+spec.outputPath);
  const row=manifest.pages.find(row=>row.candidateId===site.id&&row.pageId===spec.id);assert.ok(row);assert.equal(row.outputPath,spec.after);
  const bytes=readFileSync(local(spec.after));assert.equal(sha(bytes),row.sha256);assert.equal(bytes.length,row.bytes);assert.ok(bytes.length<500000);
 }
}
if(process.argv.includes('--validate-only')){console.log(JSON.stringify({ok:true,scope:'Evidence input/source/hash preflight only; no browser capture',pages:6,candidates:2,source,inputDigest:manifest.inputDigest,wireDigest:manifest.wireDigest,providerCalls:0,genuineModelResult:false}));process.exit(0);}
const origin='https://quiet-pilot.invalid',canonicalPath=path=>path==='/'?'/':path.replace(/\/$/,'');
function siteRoutes(site){const routes=new Map();for(const spec of site.pages){const item={spec,html:readFileSync(local(spec.after),'utf8')},file='/'+site.id+'/'+spec.outputPath;for(const alias of [file,file.replace(/index\.html$/,'')])routes.set(canonicalPath(alias),item);}return routes;}
function brokenLinks(metrics,routes){const broken=[];for(const link of metrics.links){if(/^(mailto:|tel:)/.test(link.href))continue;let url;try{url=new URL(link.href,metrics.url);}catch{broken.push(link.href);continue;}const destination=url.origin===origin&&routes.get(canonicalPath(url.pathname));if(!destination){broken.push(link.href);continue;}if(url.hash){const id=decodeURIComponent(url.hash.slice(1));if(!destination.html.includes('id="'+id+'"')&&!destination.html.includes("id='"+id+"'"))broken.push(link.href);}}return broken;}
const results=[],failures=[],interactions=[],pixelReceipts=[];let checks=0,reviewPack=null,counterexamplesDone=false,fatalError=null;
const check=(condition,message)=>{checks++;if(!condition)failures.push(message);};
const startedAt=new Date().toISOString(),clock=performance.now(),cpu=process.cpuUsage();
function measure(){
 const visible=el=>{for(let parent=el.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS'&&!parent.open){const summary=[...parent.children].find(child=>child.tagName==='SUMMARY');if(!summary?.contains(el))return false;}const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';};
 const measuredTextSelector='h1,h2,h3,p,a,li,summary';
 const text=[...document.querySelectorAll(measuredTextSelector)].filter(visible);
 const rect=el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height};};
 const rgb=s=>{const m=s.match(/^rgba?\(([^)]+)\)$/);if(!m)return null;const a=m[1].split(/[, /]+/).map(Number);return a.length===3||a[3]===1?a.slice(0,3):null;};
 const lum=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
 const contrastFailures=[],contrastUnmeasured=[];
 for(const el of text){const style=getComputedStyle(el),fg=rgb(style.color);let parent=el,bg=null,complex=false;while(parent&&!bg){const s=getComputedStyle(parent);if(s.backgroundImage!=='none')complex=true;bg=rgb(s.backgroundColor);parent=parent.parentElement;}if(!fg||!bg||complex){contrastUnmeasured.push({tag:el.tagName,text:el.textContent.slice(0,60),reason:'Image/gradient/transparency needs pixel review'});continue;}const a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),large=parseFloat(style.fontSize)>=24||parseFloat(style.fontSize)>=18.66&&Number(style.fontWeight)>=700;if(ratio<(large?3:4.5))contrastFailures.push({tag:el.tagName,text:el.textContent.slice(0,60),ratio});}
 const links=[...document.querySelectorAll('a[href]')].map(el=>({href:el.getAttribute('href'),text:el.textContent.trim(),visible:visible(el)}));
 const headings=[...document.querySelectorAll('h1')].filter(visible).map(el=>({text:el.textContent.trim(),...rect(el)}));
 const collapsedHeadings=[...document.querySelectorAll('main h1,main h2,main h3')].filter(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return el.textContent.trim().length>12&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&r.width<Math.min(180,innerWidth*.55,parseFloat(s.fontSize)*8);}).map(el=>({text:el.textContent.slice(0,80),...rect(el)}));
 const overflow=[...document.querySelectorAll('main *,nav *')].filter(visible).filter(el=>{const r=el.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1;}).map(el=>el.tagName+'.'+String(el.className)).slice(0,25);
 const clipped=text.flatMap(el=>{
  const s=getComputedStyle(el),bounds=el.getBoundingClientRect();
  const geometry=r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height});
  const element=e=>{const style=getComputedStyle(e);return {tag:e.tagName,className:String(e.className),bounds:geometry(e.getBoundingClientRect()),clientWidth:e.clientWidth,clientHeight:e.clientHeight,scrollWidth:e.scrollWidth,scrollHeight:e.scrollHeight,style:{overflowX:style.overflowX,overflowY:style.overflowY,whiteSpace:style.whiteSpace,display:style.display,transform:style.transform}};};
  const failure=(reason,run=null,ancestor=null)=>{
   if(!run){const descendants=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let child;while(!run&&(child=descendants.nextNode())){if(!child.textContent.trim()||!visible(child.parentElement))continue;const range=document.createRange();range.selectNodeContents(child);for(const r of range.getClientRects())if(r.width&&r.height&&(r.left<bounds.left-3||r.right>bounds.right+3||r.top<bounds.top-3||r.bottom>bounds.bottom+3)){run={text:child.textContent.slice(0,90),bounds:geometry(r),parent:element(child.parentElement)};break;}}}
   return [{tag:el.tagName,text:el.textContent.slice(0,90),reason,element:element(el),firstOffendingRun:run,clippingAncestor:ancestor?element(ancestor):null}];
  };
  if(/hidden|clip/.test(s.overflowY)&&el.scrollHeight>el.clientHeight+2)return failure('concealed vertical scroll extent',null,el);
  if(/hidden|clip|auto|scroll/.test(s.overflowX)&&el.clientWidth>0&&el.scrollWidth>el.clientWidth+3)return failure('constrained horizontal scroll extent',null,el);
  // A visible absolute submenu extends its LI's scroll area without clipping
  // that LI's own text. Measure each text run at its closest measured element;
  // nested links/list items are still checked independently, including every
  // real clipping ancestor. Never exempt a menu class or a whole subtree.
  const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){
   if(!node.textContent.trim()||node.parentElement?.closest(measuredTextSelector)!==el)continue;
   const range=document.createRange();range.selectNodeContents(node);
   for(const r of range.getClientRects()){
    if(!r.width||!r.height)continue;
    const run={text:node.textContent.slice(0,90),bounds:geometry(r),parent:element(node.parentElement)};
    if(r.left<bounds.left-3||r.right>bounds.right+3)return failure('own text run exceeds element bounds',run);
    for(let ancestor=el;ancestor;ancestor=ancestor.parentElement){
     const style=getComputedStyle(ancestor),box=ancestor.getBoundingClientRect();
     const left=box.left+parseFloat(style.borderLeftWidth||0),top=box.top+parseFloat(style.borderTopWidth||0);
     if(/hidden|clip|auto|scroll/.test(style.overflowX)&&(r.left<left-3||r.right>left+ancestor.clientWidth+3))return failure('text run concealed by horizontal ancestor',run,ancestor);
     if(/hidden|clip|auto|scroll/.test(style.overflowY)&&(r.top<top-3||r.bottom>top+ancestor.clientHeight+3))return failure('text run concealed by vertical ancestor',run,ancestor);
    }
   }
  }
  return [];
 });
 const imageSizes=[...document.images].map(i=>({src:i.src,currentSrc:i.currentSrc,alt:i.getAttribute('alt'),complete:i.complete,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,displayWidth:i.getBoundingClientRect().width,displayHeight:i.getBoundingClientRect().height,objectFit:getComputedStyle(i).objectFit,objectPosition:getComputedStyle(i).objectPosition}));
 const primaryTargets=[...document.querySelectorAll('a.cta,button,summary,a.purpose-primary,a.purpose-secondary,a[href^="mailto:"],a[href^="tel:"],a.creative-doc-link')].filter(visible).map(el=>({text:el.textContent.trim().slice(0,60),...rect(el)}));
 const bodyColumns=[...document.querySelectorAll('.purpose-service-copy section.owner-reading-editorial.purpose-text-intro.purpose-auto-type>.wrap.crafted-story>.story-copy>p')].filter(visible).map(el=>{const r=el.getBoundingClientRect(),parent=el.parentElement.getBoundingClientRect(),copy=el.closest('.purpose-service-copy').getBoundingClientRect();return {text:el.textContent.slice(0,80),width:r.width,left:r.left,parentWidth:parent.width,parentLeft:parent.left,availableCopyWidth:copy.width,minimumWidth:Math.min(480,copy.width*.9)};});
 const bodyColumnFailures=innerWidth<1024?[]:bodyColumns.filter(c=>c.width<c.minimumWidth-1||c.width>c.parentWidth+1||Math.abs(c.left-c.parentLeft)>1);
 const methodRails=[...document.querySelectorAll('.purpose-service-layout.purpose-has-context')].map(el=>{const copy=el.querySelector('.purpose-service-copy')?.getBoundingClientRect(),rail=el.querySelector('.purpose-business-context')?.getBoundingClientRect();if(!copy||!rail)return null;return {sameRow:Math.abs(copy.top-rail.top)<4,gap:rail.left-copy.right,copyWidth:copy.width,railWidth:rail.width};}).filter(Boolean);
 const structuredData=[];for(const e of document.querySelectorAll('script[type="application/ld+json"]')){try{structuredData.push(JSON.parse(e.textContent));}catch{structuredData.push({invalid:true});}}
 return {bodyColumns,bodyColumnFailures,methodRails,serviceGroupsInDom:document.querySelectorAll('nav .site-nav-group').length,mobileMenuOpen:[...document.querySelectorAll('nav .nav-mobile-details')].some(el=>visible(el)&&el.open),visibleServiceGroups:[...document.querySelectorAll('nav .site-nav-group')].filter(visible).length,mainText:document.querySelector('main')?.innerText||'',desktopNavigationVisible:[...document.querySelectorAll('nav .nav-long-desktop')].some(visible),mobileMenuVisible:[...document.querySelectorAll('nav .nav-mobile-details')].some(visible),brandLabel:document.querySelector('nav .brand')?.textContent.trim()||'',navigationTargets:[...document.querySelectorAll('nav a[href]')].filter(visible).map(el=>({href:el.getAttribute('href'),text:el.textContent.trim().slice(0,60),...rect(el)})),title:document.title,description:document.querySelector('meta[name="description"]')?.content||'',lang:document.documentElement.lang,robots:document.querySelector('meta[name="robots"]')?.content||null,canonical:document.querySelector('link[rel="canonical"]')?.href||null,structuredData,headings,collapsedHeadings,overflow,clipped,imageSizes,primaryTargets,links,ids:[...document.querySelectorAll('[id]')].map(x=>x.id),contrastFailures,contrastUnmeasured,smallText:text.filter(e=>parseFloat(getComputedStyle(e).fontSize)<14).map(e=>({tag:e.tagName,text:e.textContent.slice(0,60),fontSize:getComputedStyle(e).fontSize})),documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,height:document.documentElement.scrollHeight,navCount:document.querySelectorAll('nav[aria-label]').length,executableScripts:[...document.scripts].filter(e=>e.type!=='application/ld+json').length};
}
// These controls are appended only to the measured browser DOM, removed before
// any website capture, and prove genuine failures remain visible to the gate.
async function counterexamples(page){
 const original=await page.locator('h1').getAttribute('style');
 try{await page.locator('h1').evaluate(el=>{el.style.setProperty('width','0px','important');el.style.setProperty('min-width','0px','important');});assert.ok((await page.evaluate(measure)).collapsedHeadings.some(item=>item.width===0));}
 finally{await page.locator('h1').evaluate((el,value)=>value===null?el.removeAttribute('style'):el.setAttribute('style',value),original);}
 await page.evaluate(()=>{const fixture=document.createElement('div');fixture.id='clipping-measure-controls';fixture.style.cssText='position:absolute;left:10px;top:10px;width:300px;z-index:9999;background:white;color:black;font:16px/20px system-ui';fixture.innerHTML='<ul style="margin:0;padding:0;list-style:none"><li style="position:relative;width:60px;min-height:44px">Menu<ul style="position:absolute;left:0;top:44px;width:280px;margin:0;padding:0;list-style:none"><li><a style="display:block;font:16px/20px system-ui" href="#main">VISIBLE MENU CONTROL</a></li></ul></li></ul><h2 style="font:16px/20px system-ui;width:48px;white-space:nowrap;overflow:hidden">CONCEALED HEADING CONTROL</h2><a style="display:block;width:48px;white-space:nowrap;font:16px/20px system-ui" href="#main">WIDE OWN TEXT CONTROL</a><div style="width:48px;overflow:hidden"><p style="width:250px;margin:0;font:16px/20px system-ui">CLIPPED ANCESTOR CONTROL</p></div><p style="width:100px;height:12px;overflow:hidden;font:16px/20px system-ui">VERTICAL CLIP CONTROL</p><details open><summary style="display:block;width:48px;white-space:nowrap;overflow:hidden;font:16px/20px system-ui">CONCEALED SUMMARY CONTROL</summary></details>';document.body.append(fixture);});
 try{const negative=await page.evaluate(measure);assert.ok(!negative.clipped.some(row=>row.text.includes('VISIBLE MENU CONTROL')));for(const marker of ['CONCEALED HEADING CONTROL','WIDE OWN TEXT CONTROL','CLIPPED ANCESTOR CONTROL','VERTICAL CLIP CONTROL','CONCEALED SUMMARY CONTROL'])assert.ok(negative.clipped.some(row=>row.text.includes(marker)),'Retain clipping counterexample '+marker);}
 finally{await page.locator('#clipping-measure-controls').evaluate(el=>el.remove());}
 interactions.push({type:'original-text-geometry-counterexamples',zeroWidthHeadingDetected:true,visibleAbsoluteMenuRetained:true,concealedTextCasesDetected:5,originalDomRestored:true});
}
async function exerciseNavigation(page,site,routes,url,width){
 const native=page.locator('nav .nav-mobile-details'),visibleNative=await native.count()&&await native.isVisible(),visited=[];
 if(visibleNative){
  const summary=native.locator(':scope > summary');assert.equal(await native.evaluate(el=>el.open),false);await summary.focus();await page.keyboard.press('Enter');assert.ok(await native.evaluate(el=>el.open));
  const opened=await page.evaluate(measure);assert.deepEqual(opened.overflow,[]);assert.deepEqual(opened.clipped,[]);assert.deepEqual(opened.contrastFailures,[]);assert.ok(opened.navigationTargets.every(target=>target.width>=44&&target.height>=44));
  const filename=site.id+'-mobile-menu-open.png';await page.screenshot({path:resolve(folder,filename),fullPage:false});interactions.push({site:site.id,type:'native-keyboard-menu',width,filename,sha256:sha(readFileSync(resolve(folder,filename))),opened:true});
  await summary.focus();await page.keyboard.press('Enter');assert.equal(await native.evaluate(el=>el.open),false);await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement.closest('nav .nav-mobile-details')),false,'Closed native Menu descendants cannot take focus');
 }else interactions.push({site:site.id,type:'compact-visible-three-route-navigation',width,nativeMenuRequired:false,reason:'Original three-page route set exposes genuine navigation directly; no hidden Menu is invented.'});
 for(const destination of site.pages){
  await page.goto(url,{waitUntil:'load'});
  const currentNative=page.locator('nav .nav-mobile-details');if(await currentNative.count()&&await currentNative.isVisible())await currentNative.locator(':scope > summary').press('Enter');
  const anchor=page.locator('nav a[href]').filter({visible:true});let target=null;
  for(const link of await anchor.all()){const href=await link.getAttribute('href');const parsed=new URL(href,url);if(parsed.origin===origin&&routes.get(canonicalPath(parsed.pathname))?.spec.id===destination.id){target=link;break;}}
  assert.ok(target,'Actual navigation reaches '+destination.id);await target.focus();
  const focus=await target.evaluate(el=>{const style=getComputedStyle(el),rect=el.getBoundingClientRect();return {visible:rect.width>=44&&rect.height>=44,outline:style.outlineStyle,outlineWidth:parseFloat(style.outlineWidth)};});assert.ok(focus.visible);assert.ok(focus.outline!=='none'&&focus.outlineWidth>=2,'Visible keyboard navigation focus');
  await target.press('Enter');assert.equal(routes.get(canonicalPath(new URL(page.url()).pathname))?.spec.id,destination.id);assert.equal(await page.locator('h1').count(),1);visited.push({page:destination.id,url:page.url(),keyboardFocus:focus});
 }
 interactions.push({site:site.id,type:'all-pages-genuine-keyboard-navigation',actualBrowserNavigation:true,width,visited});
}
const browser=await chromium.launch({headless:true,chromiumSandbox:true});
try{
 for(const site of scenarios.sites){
  const routes=siteRoutes(site),titles=new Set();
  for(const spec of site.pages)for(const [label,width,height,dpr] of [['narrow',320,844,1],['mobile',390,844,1],['desktop',1440,1000,1],['retina',390,844,2]]){
   const pageClock=performance.now(),context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,javaScriptEnabled:false,serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),blocked=[];
   try{
    await page.route('**/*',route=>{const parsed=new URL(route.request().url());if(parsed.origin===origin){const matching=routes.get(canonicalPath(parsed.pathname));if(matching)return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:matching.html});if(parsed.pathname==='/favicon.ico')return route.fulfill({status:204,body:''});}blocked.push(route.request().url());return route.abort('blockedbyclient');});
    const url=origin+'/'+site.id+'/'+spec.outputPath;await page.goto(url,{waitUntil:'load'});
    for(let y=0,step=0;step<40;step++,y+=700){const size=await page.evaluate(()=>document.documentElement.scrollHeight);assert.ok(size<25000,'Bounded complete website page');if(y>size)break;await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(20);}await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(60);
    const metrics={...await page.evaluate(measure),url};metrics.brokenLinks=brokenLinks(metrics,routes);
    metrics.typography=await page.locator('main h1,main h2,main p').evaluateAll(nodes=>nodes.map(el=>{const s=getComputedStyle(el);return {tag:el.tagName,text:el.textContent.slice(0,80),fontFamily:s.fontFamily,fontSize:s.fontSize,lineHeight:s.lineHeight,fontWeight:s.fontWeight};}));
    const key=site.id+'/'+spec.id+'/'+label,verify=(condition,message)=>check(condition,key+' '+message);
    verify(metrics.headings.length===1,'one visible H1');verify(metrics.title.length>0&&metrics.title.length<=70,'page title');verify(metrics.description.length>0&&metrics.description.length<=160,'page description');verify(metrics.lang==='en','document language');verify(metrics.navCount>0,'labelled navigation');verify(metrics.brandLabel===site.businessName,'approved business identity');verify(metrics.navigationTargets.every(row=>row.width>=44&&row.height>=44),'44px navigation targets');verify(metrics.executableScripts===0,'no executable scripts');verify(metrics.documentWidth<=width+1,'horizontal overflow');verify(metrics.overflow.length===0,'overflow '+JSON.stringify(metrics.overflow));verify(metrics.collapsedHeadings.length===0,'collapsed heading '+JSON.stringify(metrics.collapsedHeadings));verify(metrics.clipped.length===0,'clipped text '+JSON.stringify(metrics.clipped));verify(metrics.bodyColumnFailures.length===0,'collapsed service body column');verify(metrics.methodRails.every(row=>!row.sameRow||row.gap>=0&&row.gap<=96),'service/context geometry');verify(metrics.smallText.length===0,'text smaller than14px '+JSON.stringify(metrics.smallText));verify(metrics.contrastFailures.length===0,'solid colour contrast '+JSON.stringify(metrics.contrastFailures));verify(metrics.brokenLinks.length===0,'unsupported link '+JSON.stringify(metrics.brokenLinks));verify(blocked.length===0,'unexpected network request '+JSON.stringify(blocked));verify(metrics.imageSizes.length===0,'image-free contract');verify(metrics.primaryTargets.every(row=>row.width>=44&&row.height>=44),'44px primary targets');verify(metrics.structuredData.every(row=>!row.invalid),'valid structured data');verify(new Set(metrics.ids).size===metrics.ids.length,'unique element IDs');
    for(const required of spec.requiredTextAfter)verify(metrics.mainText.replace(/\s+/g,' ').includes(required.replace(/\s+/g,' ')),'full approved visible copy missing '+required);
    if(label==='mobile'){verify(!titles.has(metrics.title),'unique page title');titles.add(metrics.title);}
    await page.keyboard.press('Tab');const focus=await page.evaluate(()=>{const element=document.activeElement,style=getComputedStyle(element);return {href:element.getAttribute('href'),outline:style.outlineStyle,outlineWidth:parseFloat(style.outlineWidth)};});verify(focus.href==='#main','keyboard skip link first');verify(focus.outline!=='none'&&focus.outlineWidth>0,'visible keyboard focus');
    if(!counterexamplesDone&&label==='mobile'){await counterexamples(page);counterexamplesDone=true;}
    if(site.id==='candidate-02'&&spec.id==='home'&&label==='desktop'){
     const expected=spec.requiredTextAfter.find(text=>/\n\s*\n/.test(text));assert.ok(expected);const index=await page.locator('.creative-doc-text').evaluateAll((nodes,text)=>nodes.findIndex(node=>node.innerText.replace(/\s+/g,' ')===text.replace(/\s+/g,' ')),expected);assert.ok(index>=0);const node=page.locator('.creative-doc-text').nth(index),html=await node.innerHTML();
     try{await node.evaluate(el=>el.replaceChildren());assert.ok(!(await page.evaluate(measure)).mainText.replace(/\s+/g,' ').includes(expected.replace(/\s+/g,' ')));}finally{await node.evaluate((el,html)=>{el.innerHTML=html;},html);}assert.equal(await node.innerHTML(),html);interactions.push({type:'complete-visible-copy-removal-control',site:site.id,sourceCopySha256:sha(expected),missingCopyDetected:true,exactOriginalHtmlRestored:true});
    }
    await page.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0);});const filename=site.id+'-'+spec.id+'-'+label+'.png';await page.screenshot({path:resolve(folder,filename),fullPage:true,animations:'disabled'});
    const row={site:site.id,page:spec.id,path:spec.path,label,viewport:{width,height},dpr,filename,sha256:sha(readFileSync(resolve(folder,filename))),htmlSha256:sha(routes.get(canonicalPath(new URL(url).pathname)).html),metrics,focus,blockedRequests:blocked,imageTransferBytes:0,captureWallMs:Math.round(performance.now()-pageClock)};results.push(row);
    if(spec.id==='home'&&['mobile','desktop'].includes(label))await exerciseNavigation(page,site,routes,url,width);
   }finally{await context.close();}
  }
 }
 assert.equal(results.length,24);assert.ok(counterexamplesDone);assert.equal(interactions.filter(row=>row.type==='complete-visible-copy-removal-control').length,1);
 reviewPack=await writeQuietPilotReviewPack({browser,folder,results,source,manifest,sha,pixelReceipts});
 console.log('BUSY_QUIET_V2_SUMMARY '+JSON.stringify({source,browser:browser.version(),inputDigest:manifest.inputDigest,wireDigest:manifest.wireDigest,pages:6,fullPageScreenshots:results.length,checks,passed:checks-failures.length,failed:failures.length,failures,actualNavigationChecks:interactions.filter(row=>row.actualBrowserNavigation).reduce((n,row)=>n+row.visited.length,0),viewports:['320x844@1','390x844@1','1440x1000@1','390x844@2'],imageRequests:0,reviewPack,pixelReceipts:pixelReceipts.length,providerCalls:0,genuineModelResult:false,professionalAcceptance:false}));
}catch(error){
 fatalError={name:error.name,message:error.message};throw error;
}finally{
 const report={source,browser:browser.version(),sandboxRequired:true,inputDigest:manifest.inputDigest,wireDigest:manifest.wireDigest,comparison:'Identical approved fictional source; deterministic original recommendation versus authored OFFLINE fixture. No genuine model result, temporal before/after claim, automatic winner or professional acceptance.',manifestSha256:sha(readFileSync(resolve(folder,'manifest.json'))),results,interactions,checks,passed:checks-failures.length,failed:failures.length,failures,fatalError,complete:results.length===24&&!fatalError,reviewPack,pixelReceipts,resourceMeasurements:{startedAt,finishedAt:new Date().toISOString(),wallMs:Math.round(performance.now()-clock),nodeCpuMicroseconds:process.cpuUsage(cpu),nodeMaxRssKiB:process.resourceUsage().maxRSS,scope:'Node orchestrator and capture wall time; not provider tokens, monetary cost or total browser CPU.'},providerCalls:0,genuineModelResult:false,hostedAcceptance:false,professionalAcceptance:false,approvedGoldStandards:0};writeFileSync(resolve(folder,'browser-results.json'),JSON.stringify(report,null,2)+'\n');await browser.close();
}
assert.equal(source.commit,await git('rev-parse','HEAD'));assert.equal(source.tree,await git('rev-parse','HEAD^{tree}'));assert.deepEqual(failures,[],'Objective failures retained without weakening checks');
console.log('PASS Quiet v2 offline original-renderer comparison:24 full-page PNGs; no model output or automatic aesthetic acceptance.');
