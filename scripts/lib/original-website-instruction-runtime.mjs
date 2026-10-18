import {planReviewedWebsiteComposition,prepareReviewedWebsiteComposition} from '../../src/core/websiteReviewedComposition.mjs';
import {recordWebsiteOwnerDesignFeedback} from '../../src/core/websiteMeasuredDesignCoach.mjs';
// Execute only reviewed, checked-in controller initializer ASTs. No visitor code.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {websiteBuilderTestHarnessV3222} from './website-builder-test-harness-v3222.mjs';
import {checkPrivateWebsiteDraftCommit} from '../../src/core/privateWebsiteDraftCommit.mjs';
import {planSelectedWebsiteChanges,prepareSelectedWebsiteTransaction} from '../../src/core/websiteContextPlan.mjs';
import {planWebsitePageInstructions} from '../../src/core/websitePageInstructions.mjs';
const babel=createRequire(import.meta.url)('@babel/core');
function verifyOriginalWebsiteInstructionRuntime(){
 const source=readFileSync(new URL('../../src/app/AppController.js',import.meta.url),'utf8');
 const ast=babel.parseSync(source,{sourceType:'module',configFile:false,babelrc:false,parserOpts:{plugins:['jsx']}});
 const names=['commitReviewedBuilderDraft','applySelectedWebsiteInstruction','applyWebsitePageInstruction','applyReviewedWebsiteComposition'];
 const found=new Map();
 function walk(node){if(!node||typeof node!=='object')return;
  if(node.type==='VariableDeclarator'&&names.includes(node.id?.name)){
   assert.ok(!found.has(node.id.name),'Controller handler must be unique');found.set(node.id.name,source.slice(node.init.start,node.init.end));
  }
  for(const [key,value] of Object.entries(node))if(!['loc','start','end'].includes(key)){
   if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value);
  }
 }walk(ast);assert.equal(found.size,names.length);
 const {buildWebsiteDraft,applyWebsiteLayoutChange,applyStructuredWebsiteEdit}=websiteBuilderTestHarnessV3222(['buildWebsiteDraft','applyWebsiteLayoutChange','applyStructuredWebsiteEdit']);
 const businessId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 const draft=buildWebsiteDraft({businessId,brandBrain:{websiteReady:true,websiteBrief:{businessName:'Fictional workshop',businessType:'Repairs',services:[{name:'Survey',description:'Owner wording.'}],email:'hello@example.test'}}});
 const state={current:draft,undo:[],redo:[draft],notice:'',scope:true};
 const websiteDraftRef={current:draft};
 const deps={websiteDraftRef,checkPrivateWebsiteDraftCommit,websiteHistoryIsCurrent:()=>state.scope,
 websiteHistoryScope:{businessId},setWebsiteUndo:fn=>{state.undo=fn(state.undo);},setWebsiteRedo:value=>{state.redo=value;},
 setWebsiteDraft:value=>{state.current=value;},setWebsiteBuilderNotice:value=>{state.notice=value;},
 planSelectedWebsiteChanges,prepareSelectedWebsiteTransaction,applyWebsiteLayoutChange,applyStructuredWebsiteEdit,planWebsitePageInstructions};
 const app={id:'app-a',business_id:businessId,draft_revision:1,draft_config:{display:{name:'Fictional workshop'},modules:[{key:'business_profile',enabled:true},{key:'services',enabled:true}],navigation:['business_profile','services'],presentation:{brandPalette:'forest',typeStyle:'editorial',serviceStyle:'rows'},publicProfile:{businessName:'Fictional workshop'}}};
 Object.assign(deps,{prepareReviewedWebsiteComposition,recordWebsiteOwnerDesignFeedback,miniAppsStatus:{app},cloudWorkspace:{businessId}});
 const make=name=>Function(...Object.keys(deps),'return ('+found.get(name)+');')(...Object.values(deps));
 deps.commitReviewedBuilderDraft=make('commitReviewedBuilderDraft');
 const selected=make('applySelectedWebsiteInstruction'),page=make('applyWebsitePageInstruction');
 const selection={draftId:draft.id,pageId:'home',generation:draft.generation,sectionId:'hero',field:'title',photoIndex:-1};
 assert.equal(selected({selection,instruction:'make this heading bigger; centre this section'}).applied,true);
 assert.equal(state.undo.length,1);assert.equal(state.undo[0],draft);assert.deepEqual(state.redo,[]);assert.equal(websiteDraftRef.current,state.current);
 assert.equal(state.current.sections.find(s=>s.id==='hero').appearance.headingScale,'large');assert.equal(state.current.publicStatus,draft.publicStatus);
 const current=state.current;assert.equal(selected({selection,instruction:'make this heading smaller'}).applied,false);assert.equal(state.current,current);assert.equal(state.undo.length,1);
 const fresh={...selection,generation:current.generation};state.scope=false;
 assert.equal(selected({selection:fresh,instruction:'make this heading smaller'}).applied,false);assert.equal(state.current,current);assert.equal(state.undo.length,1);state.scope=true;
 websiteDraftRef.current={...current,businessId:'foreign'};state.current=websiteDraftRef.current;
 assert.equal(selected({selection:fresh,instruction:'make this heading smaller'}).applied,false);assert.equal(state.undo.length,1);
 websiteDraftRef.current=current;state.current=current;
 assert.equal(page({pageId:'home',generation:current.generation,instruction:'make the hero heading smaller; publish website'}).applied,false);assert.equal(state.current,current);
 assert.equal(page({pageId:'home',generation:current.generation,instruction:'make the hero heading smaller on phones; give the whole page less space on phones'}).applied,true);assert.equal(state.undo.length,2);assert.equal(state.undo[1],current);assert.equal(state.current.sections.find(s=>s.id==='services').appearance.mobileSectionSpacing,'compact');
 const locked={...state.current,theme:{...state.current.theme,lockedSections:['hero']}};websiteDraftRef.current=locked;state.current=locked;
 assert.equal(selected({selection:{...selection,generation:locked.generation},instruction:'make this heading smaller'}).applied,false);assert.equal(state.current,locked);assert.equal(state.undo.length,2);
 // The original saved snapshot is the exact restoration input, not an inverse guess.
 assert.equal(state.undo[0],draft);assert.equal(draft.sections.find(s=>s.id==='hero').appearance,undefined);
 websiteDraftRef.current=draft;state.current=draft;state.undo=[];state.redo=[draft];
 const composition=planReviewedWebsiteComposition({website:draft,app,businessId,pageId:'home',request:'Make contact details easy to find',brandSource:'app'});
 assert.equal(composition.ok,true,composition.reason);
 const applyComposition=make('applyReviewedWebsiteComposition');
 assert.equal(applyComposition(composition.evidence,{ownerFeedback:{draftId:draft.id,pageId:'home',changeId:'reviewed-whole-page',choice:'liked'}}),true);
 assert.equal(state.undo.length,1);assert.equal(state.undo[0],draft);assert.equal(websiteDraftRef.current,state.current);assert.deepEqual(state.redo,[]);
 assert.equal(state.current.ownerDesignFeedback.at(-1).changeId,'reviewed-whole-page');
 const saved=state.current;assert.equal(applyComposition(composition.evidence),false);assert.equal(state.current,saved);assert.equal(state.undo.length,1);
 websiteDraftRef.current=draft;state.current=draft;state.undo=[];state.redo=[draft];
 assert.equal(selected({selection,instruction:'set this heading font to serif; set this heading weight to bold; set this heading line spacing to relaxed'}).applied,true);
 assert.equal(state.undo.length,1);assert.equal(state.undo[0],draft);assert.deepEqual(state.redo,[]);
 assert.equal(state.current.sections.find(s=>s.id==='hero').appearance.titleFont,'serif');
 const styled=state.current;
 assert.equal(selected({selection,instruction:'set this heading font to mono'}).applied,false);
 assert.equal(state.current,styled);assert.equal(state.undo.length,1);
 // Restoring the exact prior snapshot preserves missing typography and Brand DNA.
 assert.equal(state.undo[0].theme,draft.theme);assert.equal(state.undo[0].sections,draft.sections);
 return {handlers:names.length,offline:true};
}
export {verifyOriginalWebsiteInstructionRuntime};
