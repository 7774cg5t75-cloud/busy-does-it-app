import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {selectedWebsiteComparisons as choices} from '../src/core/websiteSelectedComparisons.mjs';
import {previewSelectedWebsiteInstruction as preview} from '../src/core/websiteSelectedChangePreview.mjs';
import {websiteBuilderTestHarnessV3222} from './lib/website-builder-test-harness-v3222.mjs';
const {buildWebsiteDraft,applyWebsiteLayoutChange:layoutEdit,applyStructuredWebsiteEdit:fieldEdit,renderWebsiteHtml:renderPage}=websiteBuilderTestHarnessV3222(['buildWebsiteDraft','applyWebsiteLayoutChange','applyStructuredWebsiteEdit','renderWebsiteHtml']);
const draft=buildWebsiteDraft({brandBrain:{websiteBrief:{businessName:'Fictional studio'}}}),section=draft.sections[0],selection={draftId:draft.id,generation:draft.generation,pageId:'home',sectionId:section.id,field:'title',photoIndex:-1},before=JSON.stringify(draft);
const options=choices(draft,selection);assert.equal(options.length,2);
for(const choice of options){const out=preview(draft,{selection,instruction:choice.instruction},{fieldEdit,layoutEdit,renderPage});assert.ok(out.ok,out.reason);assert.notEqual(out.originalHtml,out.candidateHtml);assert.equal(out.generation,draft.generation);}
assert.equal(JSON.stringify(draft),before);
assert.deepEqual(choices({...draft,generation:draft.generation+1},selection),[]);
assert.deepEqual(choices({...draft,theme:{...draft.theme,lockedSections:[section.id]}},selection),[]);
assert.equal(choices({...draft,ownerDesignFeedback:[{draftId:draft.id,pageId:'home',changeId:options[0].id,choice:'disliked'}]},selection).some(x=>x.id===options[0].id),false);
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs'),rt=createRuntime(),{WebsiteTapEditor:Editor}=rt.load('src/screens/websiteTapEditor.js');
const walk=x=>Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?[x,...walk(x.props?.children)]:[],calls=[],props={draft,selection,onPreviewInstruction:args=>{calls.push(args);return preview(draft,args,{fieldEdit,layoutEdit,renderPage});}};
let tree=rt.render(Editor,props);const button=walk(tree).find(x=>x.props?.label==='Compare: Stronger heading');assert.ok(button);button.props.onPress();assert.equal(calls.length,1);assert.equal(calls[0].selection,selection);
tree=rt.render(Editor,props);assert.ok(walk(tree).some(x=>x.props?.label==='Apply 2 changes together'));
rt.render(Editor,{...props,selection:{...selection,field:'section'}});button.props.onPress();assert.equal(calls.length,1,'Old section callbacks cannot prepare a different selection');
console.log('PASS actual selected editor -> original private canonical comparison; exact scope, changed HTML, locked/rejected/stale selection denial, source unchanged. No screenshot/device acceptance.');
