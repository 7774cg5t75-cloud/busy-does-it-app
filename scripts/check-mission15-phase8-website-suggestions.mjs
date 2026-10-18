import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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
// Execute the real UI callback with inert preview/state boundaries. No save or
// transport dependency exists in this callback, and stale callbacks do nothing.
const source=readFileSync(new URL('../src/screens/websiteTapEditor.js',import.meta.url),'utf8'),start=' const previewQualityAdjustment=repair=>{',end=' const applyContext=(instruction)=>{';
assert.equal(source.split(start).length,2);const code=source.slice(source.indexOf(start),source.indexOf(end));
const events=[],editorLive={current:{draft,selection,contextRequest:instruction}},args={draft,selection,contextRequest:instruction,editorLive,amendSelectedWebsiteQualityInstruction,onPreviewInstruction:request=>previewSelectedWebsiteInstruction(draft,request,deps)};
for(const key of ['setContextNote','setContextRequest','setSelectedInstructionPreview','setShowPreviewOriginal'])args[key]=value=>events.push([key,value]);
const callback=Function(...Object.keys(args),code+';return previewQualityAdjustment;')(...Object.values(args));callback(repair);
assert.ok(events.some(([key,value])=>key==='setContextRequest'&&value===amended.instruction));assert.ok(events.some(([key,value])=>key==='setSelectedInstructionPreview'&&value.ok));
events.length=0;editorLive.current={...editorLive.current,contextRequest:'New owner instruction'};callback(repair);assert.equal(events.length,0);
console.log('PASS original website candidate, finite advisory amendment, preserved quoted wording, original static rendering, locks/stale rejection and actual UI preview-only callback. Inert state boundary; no browser/native or hosted acceptance.');
