// Actual first-party HTML -> existing DOM checker -> same-width comparator.
// Fictional local files only. Network requests use a deliberately closed proxy.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {websiteBuilderTestHarnessV3222} from './lib/website-builder-test-harness-v3222.mjs';
import {coordinatedWebsiteAlternatives} from '../src/core/websiteCoordinatedAlternatives.mjs';
import {makeWebsiteVisualCheckHtml,reviewWebsiteVisualCheck} from '../src/core/websiteVisualCheck.mjs';
import {compareWebsiteVisualReports} from '../src/core/websiteMeasuredDesignCoach.mjs';
const {buildWebsiteDraft,applyWebsiteLayoutChange,renderWebsiteHtml,rebuildPrivateWebsiteDraft}=websiteBuilderTestHarnessV3222(['buildWebsiteDraft','applyWebsiteLayoutChange','renderWebsiteHtml','rebuildPrivateWebsiteDraft']);
const businessId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
let draft=buildWebsiteDraft({businessId,brandBrain:{websiteReady:true,websiteBrief:{businessName:'Example Repair Studio',businessType:'Equipment maintenance',description:'Equipment care and project enquiries.',services:[{id:'survey',name:'Site survey',description:'Discuss the property and requirements first.'}],email:'hello@example.test'}}});
// Owner-authored custom ordering is an explicit input, never silently replaced.
draft=rebuildPrivateWebsiteDraft({...draft,theme:{...draft.theme,sectionOrder:['hero','contact','services']}});
const fakeReport={counts:{viewport:390},issues:[]};
const choices=coordinatedWebsiteAlternatives(draft,'home',fakeReport);
assert.ok(choices.length);assert.ok(choices[0].operation.operations.some(x=>x.action==='apply-reviewed-composition'),'Existing reviewed composition must provide structural distinction');
const before=JSON.stringify(draft),candidate=applyWebsiteLayoutChange(draft,choices[0].operation);assert.equal(candidate.applied,true,candidate.reason);assert.equal(JSON.stringify(draft),before);
assert.ok(candidate.draft.designPlan.sectionOrder.indexOf('services')<candidate.draft.designPlan.sectionOrder.indexOf('contact'));
assert.equal(applyWebsiteLayoutChange({...draft,theme:{...draft.theme,lockedSections:['contact']}},choices[0].operation).applied,false);
const dir='/tmp/busy-mission15-visual';mkdirSync(dir,{recursive:true});
const sha=v=>createHash('sha256').update(v).digest('hex');const captures=[];
for(const width of [390,768,1280]){
 const reports={};
 for(const [variant,model] of [['original',draft],['candidate',candidate.draft]]){
  const html=renderWebsiteHtml(model,'home');assert.ok(html.startsWith('<!doctype html>'));assert.doesNotMatch(html,/<script\b|<iframe\b/i);
  assert.doesNotMatch(html,/(?:src|href)\s*=\s*["']\s*(?:https?:|\/\/)/i,'Fictional capture cannot load remote resources');
  const key=`m15-${variant}-${width}`;
  let measured=makeWebsiteVisualCheckHtml(html,key);
  measured=measured.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="default-src &apos;none&apos;; script-src &apos;unsafe-inline&apos;; style-src &apos;unsafe-inline&apos;; img-src data:; base-uri &apos;none&apos;; form-action &apos;none&apos;"><script>window.ReactNativeWebView={postMessage:function(value){document.documentElement.setAttribute("data-m15-report",btoa(value));}};</script>');
  const file=`${dir}/${variant}-${width}.html`,png=`${dir}/${variant}-${width}.png`;writeFileSync(file,measured);
  const args=['--headless','--disable-dev-shm-usage','--disable-background-networking','--disable-component-update','--no-first-run','--proxy-server=http://127.0.0.1:9','--proxy-bypass-list=<-loopback>',`--user-data-dir=${dir}/profile-${variant}-${width}`,`--window-size=${width},1000`,'--hide-scrollbars','--virtual-time-budget=2000',`--screenshot=${png}`,'--dump-dom',`file://${file}`];
  const launch=spawnSync('python',['scripts/lib/run-offline-chromium.py',JSON.stringify(args)],{encoding:'utf8',timeout:20000,killSignal:'SIGKILL',maxBuffer:2500000});
  assert.equal(launch.status,0,launch.stderr);const result=JSON.parse(launch.stdout);
  assert.equal(result.status,0,result.stderr?.slice(-1200));
  const encoded=result.stdout.match(/data-m15-report="([A-Za-z0-9+/=]+)"/)?.[1];assert.ok(encoded,'Browser measurement callback required');
  const message=JSON.parse(Buffer.from(encoded,'base64').toString());const report=reviewWebsiteVisualCheck(message,key);assert.ok(report,'Existing report validator must accept capture');assert.equal(report.counts.viewport,width);
  reports[variant]=report;captures.push({width,variant,htmlSha256:sha(html),screenshotSha256:sha(readFileSync(png)),counts:report.counts});
 }
 const compared=compareWebsiteVisualReports(reports.original,reports.candidate);assert.equal(compared.valid,true);captures.push({width,comparison:compared});
 // Same real metrics with a deliberate worsening must be rejected.
 assert.equal(compareWebsiteVisualReports(reports.original,{...reports.candidate,counts:{...reports.candidate.counts,overflow:reports.original.counts.overflow+1}}).noNewMeasuredProblems,false);
}
writeFileSync(dir+'/evidence.json',JSON.stringify({browser:'Chromium local CLI',evidence:'actual rendered DOM metrics and screenshots; no AI aesthetic scoring',captures},null,2));
console.log('PASS actual Chromium first-party original/candidate captures at three widths, exact validated DOM reports, source/screenshot hashes and regression rejection. Artifacts: '+dir);
