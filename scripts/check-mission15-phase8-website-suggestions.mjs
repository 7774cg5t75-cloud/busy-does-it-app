import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {websiteBuilderTestHarnessV3222} from './lib/website-builder-test-harness-v3222.mjs';
import {previewSelectedWebsiteInstruction,amendSelectedWebsiteQualityInstruction} from '../src/core/websiteSelectedChangePreview.mjs';
const {buildWebsiteDraft,applyWebsiteLayoutChange,applyStructuredWebsiteEdit,renderWebsiteHtml}=websiteBuilderTestHarnessV3222(['buildWebsiteDraft','applyWebsiteLayoutChange','applyStructuredWebsiteEdit','renderWebsiteHtml']);
const draft=buildWebsiteDraft({brandBrain:{websiteReady:true,websiteBrief:{businessName:'Fictional workshop',description:'Owner wording.',email:'owner@example.test'}}}),before=JSON.stringify(draft);
const selection={draftId:draft.id,pageId:'home',generation:draft.generation,sectionId:'hero',field:'title'},instruction='make this heading bigger; set this heading to "Owner wording; preserved exactly"';
const deps={fieldEdit:applyStructuredWebsiteEdit,layoutEdit:applyWebsiteLayoutChange,renderPage:renderWebsiteHtml};
const preview=previewSelectedWebsiteInstruction(draft,{selection,instruction},deps);assert.ok(preview.ok,preview.reason);assert.equal(preview.quality.level,'advisory');
const repair=preview.quality.findings.find(f=>f.id==='large-heading:hero').repair;
const amended=amendSelectedWebsiteQualityInstruction(draft,{selection,instruction,repair});assert.ok(amended.ok,amended.reason);assert.equal(amended.plan.steps.length,2);assert.ok(amended.instruction.includes('Owner wording; preserved exactly'));
const revised=previewSelectedWebsiteInstruction(draft,{selection,instruction:amended.instruction},deps);assert.ok(revised.ok,revised.reason);assert.equal(revised.quality.level,'safe');assert.ok(revised.candidateHtml.includes('Owner wording; preserved exactly'));assert.equal(JSON.stringify(draft),before);
for(const bad of [{...repair,sectionId:'contact'},{...repair,field:'arbitrary'},{...repair,value:'9999px'}])assert.equal(amendSelectedWebsiteQualityInstruction(draft,{selection,instruction,repair:bad}).ok,false);
assert.equal(amendSelectedWebsiteQualityInstruction({...draft,generation:draft.generation+1},{selection,instruction,repair}).ok,false);
const locked={...draft,theme:{...draft.theme,lockedSections:['hero']}};
assert.equal(previewSelectedWebsiteInstruction(locked,{selection,instruction:amended.instruction},deps).ok,false);
// Execute the actual selected editor. Native views and IO are inert; the
// original preview, quality notice props and callback state remain real.
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs'),rt=createRuntime(),{WebsiteTapEditor:Editor}=rt.load('src/screens/websiteTapEditor.js'),{BuilderQualityNotice}=rt.load('src/components/builderQualityNotice.js');
const walk=x=>Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?[x,...walk(x.props?.children)]:[],find=(t,label)=>walk(t).find(n=>n.props?.label===label);
const calls=[],props={draft,selection,onPreviewInstruction:args=>{calls.push(args);return previewSelectedWebsiteInstruction(draft,args,deps);},onApplyInstruction:()=>{throw Error('Quality advice must not save');}};
let tree=rt.render(Editor,props);find(tree,'Tell BUSY what to do with this part').props.onPress();tree=rt.render(Editor,props);find(tree,'What would you like to change?').props.onChangeText(instruction);tree=rt.render(Editor,props);find(tree,'See these changes before saving').props.onPress();tree=rt.render(Editor,props);let notice=walk(tree).find(n=>n.type===BuilderQualityNotice);assert.ok(notice);assert.equal(notice.props.quality.level,'advisory');notice.props.onRepair(repair);tree=rt.render(Editor,props);assert.equal(find(tree,'What would you like to change?').props.value,amended.instruction);notice=walk(tree).find(n=>n.type===BuilderQualityNotice);assert.equal(notice.props.quality.level,'safe');assert.equal(calls.length,2);
const stale=notice.props.onRepair;find(tree,'What would you like to change?').props.onChangeText('New owner instruction');stale(repair);assert.equal(calls.length,2,'New typing immediately invalidates an old quality callback');tree=rt.render(Editor,props);assert.equal(find(tree,'What would you like to change?').props.value,'New owner instruction');assert.equal(JSON.stringify(draft),before);
console.log('PASS original website candidate and actual editor quality adjustment, finite advisory amendment, quoted wording, canonical rendering, locks, immediate stale callback denial and preview-only state. Inert native/IO; no acceptance claim.');
