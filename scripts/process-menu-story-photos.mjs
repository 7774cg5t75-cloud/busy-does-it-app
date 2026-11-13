// Real original browser codec + original renderer delivery rehearsal. No upload,
// CDN, native acceptance, publication or independent copyright assertion.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {websiteBuilderTestHarnessV3222} from './lib/website-builder-test-harness-v3222.mjs';
const root=process.env.BUSY_CREATIVE_BROWSER==='1'?'.test-artifacts/website-creative':'.test-artifacts/website-menu-story',manifest=JSON.parse(readFileSync(root+'/scenarios.json')),hash=b=>createHash('sha256').update(b).digest('hex'),api=websiteBuilderTestHarnessV3222(['renderWebsiteHtml']),outputs=[];
mkdirSync(root+'/derivatives',{recursive:true});
const modules=['src/core/browserBusinessPhotoProcessor.mjs','supabase/functions/busy-website-original-media/imageByteReview.mjs'];
function original(a){const name=a.uri.split('/').at(-1);if(['food-plate.jpg','food-detail.jpg','garden-path.jpg'].includes(name))return readFileSync('scripts/fixtures/website-art-direction/'+name);if(name==='garden-reference.jpg')return readFileSync('scripts/fixtures/website-storyboard/garden-reference.jpg');if(name==='shared-table.jpg')return readFileSync('scripts/fixtures/website-story/shared-table.jpg');return readFileSync('.test-artifacts/guided-websites/assets/'+name);}
const browser=await chromium.launch({headless:true,chromiumSandbox:true});
try{
 const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();let bytes;
 await page.route('**/*',route=>{const u=new URL(route.request().url()),path=u.pathname.slice(1);if(u.origin!=='http://localhost')return route.abort();if(modules.includes(path))return route.fulfill({status:200,contentType:'text/javascript',body:readFileSync(path)});if(path==='original'&&bytes)return route.fulfill({status:200,contentType:'image/jpeg',body:bytes});if(!path)return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated original codec</title>'});return route.abort();});await page.goto('http://localhost');
 for(const scenario of manifest.scenarios.filter(s=>Number(s.id)<6)){
  const before=JSON.parse(readFileSync(root+'/'+scenario.id+'-before.json')),after=JSON.parse(readFileSync(root+'/'+scenario.id+'-approved.json')),map={};assert.equal(before.businessId,after.businessId);const photos=new Map();
  for(const s of after.sections){for(const a of s.type==='hero'?[s.asset]:s.type==='gallery'?s.items||[]:[])if(a)photos.set(a.storagePath,a);}
  let n=0;for(const a of photos.values()){
   assert.equal(a.businessId,after.businessId);assert.equal(a.approved,true);bytes=original(a);assert.equal(hash(bytes),a.sha256);const source={assetId:'edededed-eded-4ded-8ded-'+String(Number(scenario.id)*10+n).padStart(12,'0'),ownerId:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',businessId:after.businessId,sha256:a.sha256};
   const processed=await page.evaluate(async source=>{const {processBrowserBusinessPhoto}=await import('/src/core/browserBusinessPhotoProcessor.mjs'),bytes=new Uint8Array(await(await fetch('/original')).arrayBuffer()),r=await processBrowserBusinessPhoto({bytes,source});return {...r,derivatives:r.derivatives.map(d=>{let s='';for(let i=0;i<d.bytes.length;i+=8192)s+=String.fromCharCode(...d.bytes.subarray(i,i+8192));return {...d,bytes:undefined,base64:btoa(s)};})};},source);
   assert.equal(processed.decodedPixelsVerified,true);assert.deepEqual(processed.source,source);assert.equal(processed.publicUseAuthorised,false);
   for(const d of processed.derivatives){const data=Buffer.from(d.base64,'base64');assert.equal(hash(data),d.sha256);const name='menu-'+scenario.id+'-'+n+'-'+d.width+'.webp';d.file='derivatives/'+name;d.url='https://assets.example.invalid/'+name;d.byteLength=data.length;delete d.base64;writeFileSync(root+'/'+d.file,data);if([640,1280,1920].includes(d.width))map[a.storagePath+'#'+d.width]=d.url;}
   outputs.push({scenario:scenario.id,storagePath:a.storagePath,source,originalBytes:bytes.length,sourceWidth:processed.sourceWidth,sourceHeight:processed.sourceHeight,derivatives:processed.derivatives,decodedPixelsVerified:true,privateOnly:true,publicUseAuthorised:false,hostedRegistration:false});n++;
  }
  if(scenario.id==='1')writeFileSync(root+'/delivery-original.html',api.renderWebsiteHtml(after));
  const canonical=api.renderWebsiteHtml(after);assert.equal(canonical,readFileSync(root+'/'+scenario.after,'utf8'));const delivered=api.renderWebsiteHtml(after,'home',{assetVariants:map});if(photos.size)assert.ok(delivered.includes('srcset='));
  writeFileSync(root+'/'+scenario.before,api.renderWebsiteHtml(before,'home',{assetVariants:map}));writeFileSync(root+'/'+scenario.after,delivered);scenario.delivery={map,canonicalDefaultHtmlSha256:hash(Buffer.from(canonical)),deliveredHtmlSha256:hash(Buffer.from(delivered)),sourceModelsUnchanged:true};
 }
 writeFileSync(root+'/processed-photos.json',JSON.stringify({browser:browser.version(),sandboxRequired:true,sourceModule:modules[0],outputs,hostedRegistration:false,nativeAcceptance:false},null,2));writeFileSync(root+'/scenarios.json',JSON.stringify(manifest,null,2));
 await context.close();console.log('PASS original browser codec decoded current scoped originals, independently decoded/hash-checked WebP derivatives and original trusted delivery maps. Canonical saved models unchanged; no hosted registration or new rights.');
}finally{await browser.close();}
