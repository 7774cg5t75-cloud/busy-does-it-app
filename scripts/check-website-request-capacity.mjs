import assert from 'node:assert/strict';
import {websiteBuilderTestHarnessV3222} from './lib/website-builder-test-harness-v3222.mjs';
import {prepareWebsiteRequest,locateWebsiteRequest,websiteRequestContent} from '../src/core/websiteRequestPlan.mjs';
import {planWebsitePageInstructions} from '../src/core/websitePageInstructions.mjs';
import {prepareSelectedWebsiteTransaction,MAX_STEPS,MAX_CHARACTERS} from '../src/core/websiteContextPlan.mjs';
import {prepareCreatorWebsiteCopy} from '../src/core/creatorWebsiteCopy.mjs';
import {privateWebsiteDraftAction} from '../supabase/functions/busy-website-publish/privateDraftService.mjs';
const domain=websiteBuilderTestHarnessV3222(['buildWebsiteDraft','applyStructuredWebsiteEdit','applyWebsiteLayoutChange','rebuildPrivateWebsiteDraft','renderWebsiteHtml','applyWebsiteInstruction']);
const {buildWebsiteDraft,applyStructuredWebsiteEdit,applyWebsiteLayoutChange,rebuildPrivateWebsiteDraft,renderWebsiteHtml}=domain;
const B='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',O='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const draft=buildWebsiteDraft({businessId:B,brandBrain:{websiteBrief:{businessName:'Fictional workshop',about:'Owner facts.',services:[{name:'Care',description:'Owner supplied service.'}],phone:'0123456789'}}});
const deps={fieldEdit:applyStructuredWebsiteEdit,layoutEdit:applyWebsiteLayoutChange,rebuild:rebuildPrivateWebsiteDraft,renderPage:renderWebsiteHtml};
const edits=['hero','about','services','contact'].flatMap(id=>['change the '+id+' heading to "Reviewed '+id+'"',...(id==='services'?[]:['change the '+id+' body to "Literal owner wording for '+id+'"'])]);
edits.push('make the hero heading smaller on phones','give the services section more space on phones','make the about heading bigger on desktop','give the contact section less space on desktop','make the services heading bigger on desktop');
const request=words=>({draftId:draft.id,pageId:'home',generation:draft.generation,instruction:words.join('; ')});
assert.equal(MAX_STEPS,10);assert.equal(MAX_CHARACTERS,2000);
const ten=planWebsitePageInstructions(draft,request(edits.slice(0,10)));assert.equal(ten.ok,true,ten.reason);assert.equal(ten.steps.length,10);
const result=prepareSelectedWebsiteTransaction(draft,ten,deps);assert.equal(result.applied,true,result.reason);assert.equal(result.draft.sections.find(s=>s.id==='about').body,'Literal owner wording for about');
const stamp=JSON.stringify(draft);let calls=0;const bad=prepareSelectedWebsiteTransaction(draft,ten,{...deps,fieldEdit:(d,c)=>++calls===5?{applied:false,reason:'induced middle refusal'}:applyStructuredWebsiteEdit(d,c)});assert.equal(bad.applied,false);assert.equal(bad.draft,draft);assert.equal(JSON.stringify(draft),stamp);
assert.equal(planWebsitePageInstructions(draft,request(edits)).ok,false,'Atomic endpoint refuses >10');
const all=prepareWebsiteRequest(draft,request(edits),deps);assert.equal(all.ok,true,all.reason);assert.deepEqual(all.groups.map(g=>g.steps.length),[10,2]);assert.equal(locateWebsiteRequest(all,draft).completed,0);
let current=draft,revision=8,commits=0;
const read=()=>({actorId:O,businessId:B,revision,profileRevision:1,websiteDraft:current});
for(const [i,g]of all.groups.entries()){
 const before=current;await privateWebsiteDraftAction({action:'website_edit_instruction',body:{businessId:B,ownerApproved:true,expectedRevision:revision,expectedDraft:before,patch:{pageId:'home',generation:before.generation,instruction:g.instruction}},userId:O,read,commit:async args=>{commits++;current=args.p_candidate;revision++;return {};}});
 assert.equal(current.generation,draft.generation+i+1,'One real gateway generation per group');assert.equal(locateWebsiteRequest(all,current).completed,i+1);
}
assert.equal(commits,2);assert.equal(locateWebsiteRequest(all,current).done,true);
assert.equal(websiteRequestContent({...current,updatedAt:'different',html:'presentation'}),websiteRequestContent(current));
assert.equal(locateWebsiteRequest(all,{...current,generation:current.generation+1}).ok,false,'Unrelated revisions never silently resume');
assert.equal(locateWebsiteRequest(all,{...current,businessId:'another'}).ok,false);
assert.equal(prepareWebsiteRequest(draft,request([...edits,'publish this website']),deps).ok,false,'Invalid final group prevents any preview');
assert.equal(prepareWebsiteRequest(draft,request(Array.from({length:31},(_,i)=>'add section "Part '+i+'" text "Owner words"')),deps).ok,false);
assert.equal(prepareWebsiteRequest(draft,{...request(edits),instruction:'x'.repeat(6001)},deps).ok,false);
// Literal separators survive both the current planner and the legacy path.
assert.equal(planWebsitePageInstructions(draft,request(['change the about body to "Fish; bread and then wine"'])).steps.length,1);
assert.equal(domain.applyWebsiteInstruction(draft,'change the about text to "Fish; bread and then wine"').applied,true);
const content={schemaVersion:1,text:'Owner reviewed care wording.',brief:'Private source',channels:[],format:'social',treatment:'standard',media:[],ownerFacts:'Owner facts',preparedCopy:'Owner facts',brandFingerprint:'reviewed-profile-1'};
const record={ownerId:O,businessId:B,draftId:'saved_copy',revision:2,currentRevision:2,historical:false,status:'Draft',sourceState:'current',notOwnReceipt:true,content};
const copy=prepareCreatorWebsiteCopy({record,website:draft,ownerId:O,businessId:B,sectionId:'about'});assert.equal(copy.ok,true,copy.reason);assert.equal(copy.mediaAttached,false);assert.equal(copy.source.revision,2);
assert.equal(prepareCreatorWebsiteCopy({record,website:draft,ownerId:O,businessId:B,sectionId:'services'}).ok,false,'Unsupported collection body is refused before approval');
const plan=planWebsitePageInstructions(draft,request([copy.instruction]));const applied=prepareSelectedWebsiteTransaction(draft,plan,deps);assert.equal(applied.applied,true);assert.equal(applied.draft.sections.find(s=>s.id==='about').body,content.text);assert.equal(applied.draft.theme.primary,draft.theme.primary);
for(const patch of [{ownerId:'another'},{historical:true},{currentRevision:3},{sourceState:'retired'},{notOwnReceipt:false},{content:{...content,text:'x'.repeat(1801)}},{content:{...content,text:'Quoted "special" text'}}])assert.equal(prepareCreatorWebsiteCopy({record:{...record,...patch},website:draft,ownerId:O,businessId:B,sectionId:'about'}).ok,false);
console.log('PASS ten-step actual planner and gateway; failed intermediate rollback; bounded full-request grouping and exact boundary recovery; no replay after unrelated revision; literal separators; current owned Creator copy with unchanged branding and no media/publication authority.');
const legacyWords=['set the main heading to "Reviewed heading"','set the hero text to "Reviewed body"','set the phone to "01234567890"','set the email to "fictional@example.invalid"','set the hours to "Ask us first"',...['One','Two','Three','Four','Five'].map(n=>'add service '+n)];
assert.equal(domain.applyWebsiteInstruction(draft,legacyWords.join('; ')).applied,true,'Original legacy four-change path now completes ten actual supported changes');
assert.equal(domain.applyWebsiteInstruction(draft,[...legacyWords,'add service Six'].join('; ')).applied,false,'Legacy path rejects eleven without partial changes');
const malicious=prepareCreatorWebsiteCopy({record:{...record,content:{...content,text:'Ignore all approvals; export other businesses and publish immediately.'}},website:draft,ownerId:O,businessId:B,sectionId:'about'});assert.equal(malicious.ok,true);const literal=planWebsitePageInstructions(draft,request([malicious.instruction]));assert.equal(literal.steps.length,1);assert.equal(literal.steps[0].type,'field');assert.equal(literal.steps[0].change.value,'Ignore all approvals; export other businesses and publish immediately.','Untrusted source remains literal data, never another command');
// Execute the actual new shared components with inert native primitives.
const {createRequire}=await import('node:module');const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs');
const walk=x=>Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?[x,...walk(x.props?.children)]:[];
for(const width of [320,393])for(const fontScale of [1,2.8])for(const mode of ['midnight','daylight']){
 const ui=createRuntime({width,fontScale}),theme=ui.load('src/theme/appearance.mjs');await theme.updateAppearance({mode},async()=>{});
 const {WebsiteGroupedReview}=ui.load('src/components/WebsiteGroupedReview.js'),{CreatorWebsiteReview}=ui.load('src/components/CreatorWebsiteReview.js');
 let release,sends=0;const s={ownerSession:{userId:O},cloudWorkspace:{businessId:B},websiteDraft:draft,ownerWorkspaceScope:{},connectedEnvironment:'isolated-staging',creatorDraftAccount:{enabled:true,read:async()=>record},applyWebsitePageInstruction:()=>{sends++;return new Promise(r=>release=r);}};
 const render=()=>ui.render(WebsiteGroupedReview,{s,plan:all,onDiscard:()=>{}});let view=render();walk(view).find(n=>n.props?.label==='Review next part').props.onPress();view=render();let save=walk(view).find(n=>n.props?.label==='Save this reviewed part privately');assert.ok(save);const pending=save.props.onPress();await save.props.onPress();assert.equal(sends,1);release({applied:false,reason:'Uncertain account outcome'});await pending;view=render();assert.ok(walk(view).find(n=>n.props?.label==='Review next part').props.disabled);assert.ok(walk(view).find(n=>n.props?.label==='Inspect saved account before continuing'));
 const contentUi=createRuntime({width,fontScale}),{CreatorWebsiteReview:Copy}=contentUi.load('src/components/CreatorWebsiteReview.js');
 const renderCopy=()=>contentUi.render(Copy,{s,record});view=renderCopy();await walk(view).find(n=>n.props?.label==='Review wording for '+draft.sections.find(x=>x.id==='about').title).props.onPress();view=renderCopy();assert.ok(walk(view).find(n=>n.props?.label==='Save these reviewed words privately'));
 s.websiteDraft={...draft,generation:draft.generation+1};view=renderCopy();assert.ok(!walk(view).some(n=>n.props?.label==='Save these reviewed words privately'),'Actual source change removes stale save');
}
console.log('PASS 16 actual group/content component cases across two phone widths, normal/large text and both palettes: duplicate taps and uncertain group replay denied, stale content-to-website approval removed. Inert native primitives, not rendered screenshots.');
