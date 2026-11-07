import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {mission16Fixture} from '../../scripts/lib/mission16-site-fixtures.mjs';
import {prepareWholeWebsite} from '../../src/core/wholeWebsitePlan.mjs';
import {applyWebsitePageChange,renderWebsiteHtml} from '../../src/domain/websiteBuilder.js';
import {buildStandaloneWebsiteArchive} from '../../src/core/websiteStandaloneArchive.mjs';
// Refuse to mislabel later source as this frozen rehearsal. Report/evidence-only changes are allowed.
await promisify(execFile)('git',['diff','--exit-code','1f7feadb3bccbf87084da1813bea8655641ee616','--','src','supabase','scripts/lib','scripts/fixtures','package.json','package-lock.json']);
mkdirSync('.test-artifacts/mission16-complete-export',{recursive:true});
const rows=[];
for(let i=0;i<3;i++){
 const c=mission16Fixture(i),r=prepareWholeWebsite(c,{pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml});assert.equal(r.ok,true,r.reason);
 const clock=performance.now(),cpu=process.cpuUsage(),a=await buildStandaloneWebsiteArchive(r.candidate,{renderPage:renderWebsiteHtml,readPhoto:asset=>{const source=c.sourcePhotos.find(x=>asset.storagePath==='approved/mission16/'+x.name&&asset.sha256===x.sha256);assert.ok(source);return new Uint8Array(readFileSync(source.file));}});assert.equal(a.ok,true,a.reason);assert.equal(a.pages,[10,9,7][i]);
 const filename=['moor-meadow','ember','quiet-light'][i]+'.zip';writeFileSync('.test-artifacts/mission16-complete-export/'+filename,a.bytes);rows.push({business:c.website.businessName,pages:a.pages,photos:a.photos,filename,bytes:a.bytes.length,sha256:createHash('sha256').update(a.bytes).digest('hex'),prepare:r.stats,exportMs:Math.round((performance.now()-clock)*100)/100,exportNodeCpuMicroseconds:process.cpuUsage(cpu),providerCalls:0});
}
writeFileSync('.test-artifacts/mission16-complete-export/results.json',JSON.stringify({source:{commit:'1f7feadb3bccbf87084da1813bea8655641ee616',tree:'8b70639b28c34e0a1510c1c3c3ede7fab97eab41'},rows,hosted:false,providerCalls:0},null,2)+'\n');console.log('PASS actual original whole-site archives: 10,9,7 pages. All assets read from pinned licensed fixtures.');
