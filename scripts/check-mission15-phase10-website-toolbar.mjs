import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {websiteBuilderTestHarnessV3222} from './lib/website-builder-test-harness-v3222.mjs';
import {planSelectedWebsiteChanges,prepareSelectedWebsiteTransaction} from '../src/core/websiteContextPlan.mjs';
import {previewSelectedWebsiteInstruction} from '../src/core/websiteSelectedChangePreview.mjs';
import {checkPrivateWebsiteDraftCommit} from '../src/core/privateWebsiteDraftCommit.mjs';
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs');
const rt=createRuntime(),{WebsiteTypographyControls}=rt.load('src/screens/websiteTypographyControls.js'),{WebsiteTapEditor}=rt.load('src/screens/websiteTapEditor.js');
const {buildWebsiteDraft,applyWebsiteLayoutChange,applyStructuredWebsiteEdit,renderWebsiteHtml}=websiteBuilderTestHarnessV3222(['buildWebsiteDraft','applyWebsiteLayoutChange','applyStructuredWebsiteEdit','renderWebsiteHtml']);
const draft=buildWebsiteDraft({businessId:'fictional-business',brandBrain:{websiteReady:true,websiteBrief:{businessName:'Fictional Workshop',description:'Owner wording.',email:'owner@example.test'}}});
const section=draft.sections.find(s=>s.id==='hero'),selection={draftId:draft.id,generation:draft.generation,pageId:'home',sectionId:'hero',field:'body'},chosen=[];
const walk=n=>Array.isArray(n)?n.flatMap(walk):n&&typeof n==='object'?[n,...walk(n.props?.children)]:[];
const find=(t,label)=>walk(t).find(n=>n.props?.label===label||n.props?.accessibilityLabel===label);
let props={section,selection,onChoose:text=>chosen.push(text)},tree=rt.render(WebsiteTypographyControls,props);
find(tree,'size on phones').props.onPress();tree=rt.render(WebsiteTypographyControls,props);const oldChoice=find(tree,'Larger paragraph');
props={...props,selection:{...selection,field:'title'}};assert.doesNotThrow(()=>tree=rt.render(WebsiteTypographyControls,props),'Changing paragraph size menu to a heading cannot crash');assert.equal(find(tree,'Larger paragraph'),undefined);oldChoice.props.onPress();assert.equal(chosen.length,0,'Old choices cannot stage changes for a newer selection');
find(tree,'size on phones').props.onPress();tree=rt.render(WebsiteTypographyControls,props);find(tree,'Smaller heading').props.onPress();assert.equal(chosen.at(-1),'make this heading smaller on phones');
const plan=planSelectedWebsiteChanges(draft,'home',props.selection,chosen.at(-1));assert.ok(plan.ok);const transaction=prepareSelectedWebsiteTransaction(draft,plan,{fieldEdit:applyStructuredWebsiteEdit,layoutEdit:applyWebsiteLayoutChange});assert.ok(transaction.applied);assert.equal(transaction.draft.sections.find(s=>s.id==='hero').appearance.mobileHeadingScale,'compact');assert.deepEqual(transaction.draft.theme,draft.theme);assert.match(renderWebsiteHtml(JSON.parse(JSON.stringify(transaction.draft)),'home'),/owner-mobile-heading-compact/);
// Original contextual UI -> stage -> actual private preview -> explicit Apply.
let writes=0,closed=0;const editProps={draft,selection:props.selection,onClose:()=>closed++,onPreviewInstruction:request=>previewSelectedWebsiteInstruction(draft,request,{fieldEdit:applyStructuredWebsiteEdit,layoutEdit:applyWebsiteLayoutChange,renderPage:renderWebsiteHtml}),onApplyInstruction:request=>{
 const p=planSelectedWebsiteChanges(draft,'home',request.selection,request.instruction),out=prepareSelectedWebsiteTransaction(draft,p,{fieldEdit:applyStructuredWebsiteEdit,layoutEdit:applyWebsiteLayoutChange});
 const result=checkPrivateWebsiteDraftCommit({current:draft,candidate:out.draft,live:draft,scopeCurrent:true,businessId:'fictional-business'});if(result.applied)writes++;return result;
}};
tree=rt.render(WebsiteTapEditor,editProps);find(tree,'Tell BUSY what to do with this part').props.onPress();tree=rt.render(WebsiteTapEditor,editProps);const example=walk(tree).find(n=>typeof n.props?.label==='string'&&n.props.label.startsWith('Prepare: ')&&n.props.label.includes('heading'));
assert.ok(example);example.props.onPress();tree=rt.render(WebsiteTapEditor,editProps);assert.equal(writes,0,'Example only prepares, never saves');find(tree,'See these changes before saving').props.onPress();tree=rt.render(WebsiteTapEditor,editProps);assert.equal(writes,0,'Comparison is still private and unsaved');find(tree,'Apply reviewed instruction to this part').props.onPress();assert.equal(writes,1);assert.equal(closed,1);
console.log('PASS actual compact typography controls, paragraph-to-heading recovery, stale choice exclusion, phone heading operation/render/reload and original contextual stage/preview/explicit private commit. Inert native/IO; no device geometry or screenshot claim.');
