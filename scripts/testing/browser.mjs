// Optional real-browser acceptance. Only generated fictional first-party HTML.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve,join} from 'node:path';
import {websiteBuilderTestHarnessV3222} from '../lib/website-builder-test-harness-v3222.mjs';
import {makeTapToEditHtml,resolveTapToolbarAction} from '../../src/core/websiteTapToEdit.mjs';
import {websiteMovementOptions,resolveWebsiteMovement} from '../../src/core/websiteVisualMovement.mjs';
import {measureWebsiteQuality} from '../lib/websiteQualityAudit-v3107.mjs';
import {launchFixtureBrowser} from './browser-policy.mjs';
const args=process.argv.slice(2);assert.ok(args.length===1&&['--prepare-only','--capture'].includes(args[0]),'Use browser.py --prepare-only or --capture');
const out=resolve(process.env.BUSY_BROWSER_OUTPUT||'.test-artifacts/browser');mkdirSync(out,{recursive:true});
const sha=value=>createHash('sha256').update(value).digest('hex');
const sourceSha=process.env.BUSY_BROWSER_SOURCE_SHA;assert.match(sourceSha||'',/^[a-f0-9]{40}$/);
const {buildWebsiteDraft,applyWebsiteLayoutChange,renderWebsiteHtml}=websiteBuilderTestHarnessV3222(['buildWebsiteDraft','applyWebsiteLayoutChange','renderWebsiteHtml']);
const draft=buildWebsiteDraft({businessId:'fictional-local-business',brandBrain:{websiteReady:true,websiteBrief:{businessName:'Fictional Workshop',description:'Fictional local design fixture.',about:'Fictional owner wording for the workshop.',email:'owner@example.test',services:[{name:'Design',description:'Discuss a fictional project.'}],faqs:[{question:'What happens next?',answer:'Send an enquiry for owner review.'}]}}});
const rendered=renderWebsiteHtml(draft,'home',{editablePreview:true}),sourceKey='fixture:'+draft.id+':'+draft.generation;
const movement=websiteMovementOptions(draft,'home',sourceKey,rendered);assert.ok(movement?.moves.length);
const html=makeTapToEditHtml(rendered,movement);
assert.doesNotMatch(rendered,/<iframe\b|<script\b/i);assert.doesNotMatch(rendered,/(?:src|href)=["'](?:https?:|\/\/)/i);
writeFileSync(join(out,'fictional-editable.html'),html);
const report={status:'unexecuted',sourceSha,sourceDirty:process.env.BUSY_BROWSER_SOURCE_DIRTY==='true',sourceDiffSha256:process.env.BUSY_BROWSER_SOURCE_DIFF_SHA256,draftId:draft.id,generation:draft.generation,fixtureSha256:sha(html),sourceKey,fictionalOnly:true,chromiumSandbox:true,paidVisionReviewOccurred:false,websitePublished:false,captures:[],note:'DOM/geometry and screenshots only, no AI aesthetic assessment or native-device certification.'};
const save=()=>writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
save();
if(args[0]==='--prepare-only'){console.log('PASS fictional first-party fixture and source/revision hashes prepared; browser capture UNEXECUTED.');process.exit(0);}
const requireBrowser=createRequire(new URL('../browser-tools/package.json',import.meta.url));let chromium;
try{({chromium}=requireBrowser('playwright'));assert.equal(requireBrowser('playwright/package.json').version,'1.58.2');}
catch{report.status='blocked';report.reason='Install the separately locked optional browser tools in a compatible approved environment.';save();console.log(JSON.stringify(report));process.exit(2);}
let browser;
try{
 // Explicit opt-in: Playwright otherwise defaults chromiumSandbox to false.
 browser=await launchFixtureBrowser(chromium);
 for(const [device,width,height]of [['phone',390,844],['tablet',768,1024],['desktop',1440,900]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:device!=='desktop',isMobile:device==='phone'});
  await context.route('**/*',route=>route.abort());
  const page=await context.newPage(),events=[];
  await page.exposeFunction('__busyFixtureMessage',raw=>events.push(JSON.parse(raw)));
  await page.setContent(html,{waitUntil:'load'});
  await page.evaluate(()=>{window.ReactNativeWebView={postMessage:window.__busyFixtureMessage};});
  const heading=page.locator('[data-busy-edit-section="hero"][data-busy-edit-field="title"]');
  if(device==='desktop')await heading.click();else await heading.tap();
  await page.locator('.busy-selection-toolbar [data-action="edit"]').click();
  await page.waitForFunction(()=>document.querySelector('.busy-selected-for-edit'));
  await page.waitForTimeout(40);
  assert.ok(events.some(event=>resolveTapToolbarAction(draft,'home',event)),'Actual selected-edit bridge resolves against original source');
  const beforeMoves=events.filter(event=>event.channel===movement.channel).length;
  const first=movement.moves[0],handle=page.locator('section[data-busy-edit-section="'+first.sectionId+'"] > .busy-section-move').first();
  await handle.scrollIntoViewIfNeeded();const bounds=await handle.boundingBox();assert.ok(bounds);
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();
  await page.evaluate(()=>document.dispatchEvent(new PointerEvent('pointercancel',{pointerId:1,bubbles:true})));
  await page.mouse.up();
  assert.equal(events.filter(event=>event.channel===movement.channel).length,beforeMoves,'Synthetic touch/pointer cancellation emits no move');
  // Deliberate keyboard/no-drag alternative in the actual DOM. Physical-device
  // finger drag/scroll remains a separate acceptance requirement.
  await handle.focus();await handle.press('ArrowDown');await page.waitForTimeout(40);
  let message=events.find(event=>event.channel===movement.channel);
  if(!message){await handle.press('ArrowUp');await page.waitForTimeout(40);message=events.find(event=>event.channel===movement.channel);}
  assert.ok(message&&resolveWebsiteMovement(draft,'home',sourceKey,message,rendered));
  const moved=applyWebsiteLayoutChange(draft,{action:'move-relative',pageId:'home',sectionId:message.sectionId,targetSectionId:message.targetSectionId,position:message.position});assert.ok(moved.applied);
  const quality=await measureWebsiteQuality(page);
  const geometry=await page.evaluate(()=>({viewportWidth:innerWidth,documentWidth:document.documentElement.scrollWidth,selected:document.querySelectorAll('.busy-selected-for-edit').length}));
  assert.ok(geometry.documentWidth<=width+2,'No horizontal overflow');assert.equal(geometry.selected,1);
  const screenshot=join(out,device+'-editor.png');await page.screenshot({path:screenshot,fullPage:true});
  await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));const scrolled=await page.evaluate(()=>scrollY);
  await page.setContent(renderWebsiteHtml(moved.draft,'home'),{waitUntil:'load'});
  const movedGeometry=await page.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth}));assert.ok(movedGeometry.documentWidth<=width+2);
  const after=join(out,device+'-moved.png');await page.screenshot({path:after,fullPage:true});
  report.captures.push({device,width,height,quality,geometry,movedGeometry,scrollOffset:scrolled,selectionBridge:true,keyboardMovement:true,syntheticPointerCancellation:true,physicalTouchDraggingVerified:false,screenshots:[screenshot,after].map(path=>({path,sha256:sha(readFileSync(path))}))});save();await context.close();
 }
 report.status='passed';save();console.log('PASS sandboxed Chromium fixture captures and bounded DOM/interaction evidence. No aesthetic assessment.');
}catch(error){report.status=browser?'failed':'blocked';report.reason=String(error.message||error).slice(0,4000);save();process.exitCode=browser?1:2;}
finally{await browser?.close();}
