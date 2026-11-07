// Compose only hash-verified genuine original-renderer pixels; no mockups.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const folder='.test-artifacts/website-excellence',evidence=JSON.parse(readFileSync(folder+'/browser-results.json')),hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(evidence.failures.length,0);
const browser=await chromium.launch({headless:true,chromiumSandbox:true}),sheets=[];
try{
 for(const label of ['narrow','mobile','desktop']){
  const inputs=[];let html='<style>body{margin:0;padding:20px;font:16px system-ui;background:#eee;color:#171717}.pair{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:start}figure{margin:0;min-width:0}img{width:100%;height:auto;display:block}h2{margin-top:32px}figcaption{padding:12px 0}</style><h1>Controlled complete-page comparison — '+label+'</h1><p>Identical approved words, images, colours, order and hero family. Only the reviewed full-page treatment changes. Scaled genuine screenshots; aesthetic acceptance remains a separate judgement.</p>';
  for(let i=0;i<3;i++){
   const rows=['before','after'].map(stage=>evidence.results.find(r=>r.filename===i+'-'+stage+'-'+label+'.png'));assert.ok(rows.every(Boolean));html+='<h2>'+rows[0].business+'</h2><div class="pair">';
   for(const row of rows){const bytes=readFileSync(folder+'/'+row.filename);assert.equal(hash(bytes),row.sha256);inputs.push({filename:row.filename,sha256:row.sha256});html+='<figure><figcaption>'+row.stage+'</figcaption><img alt="Original rendered full page" src="data:image/png;base64,'+bytes.toString('base64')+'"></figure>';}
   html+='</div>';
  }
  const context=await browser.newContext({viewport:{width:label==='desktop'?1200:840,height:900},javaScriptEnabled:false,serviceWorkers:'block'}),page=await context.newPage();await page.route('**/*',route=>route.abort('blockedbyclient'));await page.setContent(html,{waitUntil:'load'});const filename='comparison-'+label+'.jpg';await page.screenshot({path:folder+'/'+filename,fullPage:true,type:'jpeg',quality:80});sheets.push({filename,sha256:hash(readFileSync(folder+'/'+filename)),inputs});await context.close();
 }
}finally{await browser.close();}
writeFileSync(folder+'/comparison.json',JSON.stringify({source:evidence.source,browser:evidence.browser,sheets,syntheticBusinessData:true,professionalAcceptance:false},null,2));
console.log('PASS controlled original-pixel comparison sheets at three viewports.');
