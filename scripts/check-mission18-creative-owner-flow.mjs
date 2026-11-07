import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{createRuntime}=require('./lib/offline-component-runtime.cjs');
const owner='cccccccc-cccc-4ccc-8ccc-cccccccccccc',business='aaaaaaaa-aaaa-4aaa-8aaa-000000000018';
let passed=0;
async function test(name,run){await run();passed++;console.log('PASS '+name);}
function fixture(){
 const rt=createRuntime(),api=rt.load('src/domain/websiteBuilder.js'),Component=rt.load('src/components/WholeWebsiteReview.js').WholeWebsiteReview;
 const website=api.buildWebsiteDraft({businessId:business,brandBrain:{websiteBrief:{businessName:'Fictional Quiet Studio',businessType:'Creative studio',description:'Clear design from your approved ideas and existing material.',email:'hello@example.invalid',services:[{name:'Creative direction',description:'We begin with the message you want people to understand.\n\nWe review your existing material and discuss a clear direction.'},{name:'Page design',description:'A considered presentation of supplied content.\n\nYour review remains part of the work.'}]}}});
 let writes=0;
 const props={s:{websiteDraft:website,ownerSession:{userId:owner},cloudWorkspace:{businessId:business},connectedRuntime:{profileRevision:1}},goal:'Create a complete professional website for my creative studio'};
 props.s.applyReviewedWebsitePageAction=async operation=>{writes++;const edited=api.applyWebsitePageChange(props.s.websiteDraft,operation);assert.equal(edited.applied,true,edited.reason);props.s.websiteDraft=edited.draft;return {applied:true,localPrivateReadback:{websiteDraft:edited.draft}};};
 const walk=x=>Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?[x,...walk(x.props?.children)]:[];
 const draw=()=>rt.render(Component,props),find=label=>walk(draw()).find(x=>x.props?.label===label),text=()=>JSON.stringify(draw());
 const open=()=>find('Explore my current pages').props.onPress();
 return {rt,api,props,draw,find,text,open,get writes(){return writes;}};
}
await test('ordinary request creates an original review and exact one-use keep',async()=>{
 const f=fixture();f.open();const original=JSON.stringify(f.props.s.websiteDraft),sections=JSON.stringify(f.props.s.websiteDraft.sections),theme=JSON.stringify(f.props.s.websiteDraft.theme);
 assert.equal(f.find('Review a fresh whole-site direction').props.onPress(),true);assert.equal(JSON.stringify(f.props.s.websiteDraft),original);assert.equal(f.writes,0);
 assert.ok(f.text().includes('No live AI model was used'));assert.ok(f.text().includes('Your words, colours, photographs and contact details are kept'));
 const keep=f.find('Keep this complete website').props.onPress;assert.equal(await keep(),true);assert.equal(f.writes,1);assert.ok(f.props.s.websiteDraft.creativeSpecification);assert.equal(JSON.stringify(f.props.s.websiteDraft.sections),sections);assert.equal(JSON.stringify(f.props.s.websiteDraft.theme),theme);assert.equal(await keep(),false);assert.equal(f.writes,1);
});
await test('typed creative goal uses the same review path and does not save automatically',()=>{
 const f=fixture();f.open();f.find('What would you change across the website?').props.onChangeText('Keep my words but redesign the whole website');assert.equal(f.find('Review a fresh whole-site direction').props.disabled,true,'A shortcut must not replace another unsaved request');assert.equal(f.find('Review a fresh whole-site direction').props.onPress(),false);assert.equal(f.find('Review my website change').props.onPress(),true);assert.equal(f.writes,0);assert.ok(f.find('Keep this complete website'));assert.ok(f.text().includes('No live AI model was used'));
});
await test('a completed multi-page planning journey can review and keep one coordinated redesign',async()=>{
 const f=fixture();assert.equal(f.find('See my complete website').props.onPress(),true);assert.equal(await f.find('Keep this complete website').props.onPress(),true);assert.equal(f.props.s.websiteDraft.pages.length,5);const originalPages=JSON.stringify(f.props.s.websiteDraft.pages.map(page=>page.id)),words=JSON.stringify(f.props.s.websiteDraft.sections);assert.equal(f.find('Review a fresh whole-site direction').props.onPress(),true);assert.equal(await f.find('Keep this complete website').props.onPress(),true);assert.equal(JSON.stringify(f.props.s.websiteDraft.creativeSpecification.pages.map(page=>page.pageId)),originalPages);assert.equal(JSON.stringify(f.props.s.websiteDraft.sections),words);assert.equal(f.writes,2);
});
await test('discard leaves exact current wording and presentation untouched',()=>{
 const f=fixture();f.open();const original=JSON.stringify(f.props.s.websiteDraft);f.find('Review a fresh whole-site direction').props.onPress();assert.equal(f.find('Discard complete-site preview').props.onPress(),true);assert.equal(JSON.stringify(f.props.s.websiteDraft),original);assert.equal(f.writes,0);assert.equal(f.find('Keep this complete website'),undefined);
});
await test('stale source revision disables and rejects a captured keep callback',async()=>{
 const f=fixture();f.open();f.find('Review a fresh whole-site direction').props.onPress();const keep=f.find('Keep this complete website').props.onPress;f.props.s.connectedRuntime.profileRevision=2;assert.equal(f.find('Keep this complete website').props.disabled,true);assert.equal(await keep(),false);assert.equal(f.writes,0);
});
await test('new owner wording is preserved when an old creative review becomes stale',async()=>{
 const f=fixture();f.open();f.find('Review a fresh whole-site direction').props.onPress();const keep=f.find('Keep this complete website').props.onPress;f.props.s.websiteDraft={...f.props.s.websiteDraft,sections:f.props.s.websiteDraft.sections.map(s=>s.type==='hero'?{...s,subtitle:'My newer owner wording.'}:s)};assert.equal(f.find('Keep this complete website').props.disabled,true);assert.equal(await keep(),false);assert.ok(JSON.stringify(f.props.s.websiteDraft).includes('My newer owner wording.'));assert.equal(f.writes,0);
});
await test('foreign tenant cannot revive an old creative review',async()=>{
 const f=fixture();f.open();f.find('Review a fresh whole-site direction').props.onPress();const keep=f.find('Keep this complete website').props.onPress;f.props.s.cloudWorkspace={businessId:'foreign'};f.draw();assert.equal(f.find('Keep this complete website'),undefined);assert.equal(await keep(),false);f.props.s.cloudWorkspace={businessId:business};f.draw();assert.equal(f.find('Keep this complete website'),undefined);assert.equal(f.writes,0);
});
await test('parent dirty-state and busy fences prevent creative preparation',()=>{
 const f=fixture();f.open();f.props.disabled=true;assert.equal(f.find('Review a fresh whole-site direction').props.disabled,true);assert.equal(f.find('Review a fresh whole-site direction').props.onPress(),false);f.props.disabled=false;f.props.isParentCurrent=()=>false;assert.equal(f.find('Review a fresh whole-site direction').props.onPress(),false);assert.equal(f.writes,0);
});
await test('owner appearance locks reject a whole-page redesign',()=>{
 const f=fixture();f.props.s.websiteDraft.theme.lockedSections=['all'];f.open();assert.equal(f.find('Review a fresh whole-site direction').props.onPress(),false);assert.equal(f.find('Keep this complete website'),undefined);assert.equal(f.writes,0);
});
await test('unknown save outcome fences the review and never replays the provider-free write',async()=>{
 const f=fixture();let writes=0;f.props.s.applyReviewedWebsitePageAction=async()=>{writes++;throw Error('Synthetic missing acknowledgement');};f.open();f.find('Review a fresh whole-site direction').props.onPress();const keep=f.find('Keep this complete website').props.onPress;assert.equal(await keep(),false);assert.equal(await keep(),false);assert.equal(writes,1);assert.ok(f.text().includes('not be replayed'));assert.equal(f.find('See my complete website').props.disabled,true);
});
await test('unsupported publication and ungrounded facts remain requests, not writes',()=>{
 const f=fixture();f.open();const original=JSON.stringify(f.props.s.websiteDraft);for(const request of ['Publish my website now','Add five award-winning customer projects']){f.find('What would you change across the website?').props.onChangeText(request);assert.equal(f.find('Review my website change').props.onPress(),false);assert.equal(f.find('Keep this complete website'),undefined);}assert.equal(JSON.stringify(f.props.s.websiteDraft),original);assert.equal(f.writes,0);
});
console.log(JSON.stringify({suite:'mission18-creative-owner-flow',passed,failed:0,providerCalls:0,hostedActions:0,evidence:'Actual original React component and finite editor; native primitives and write transport are inert. No live model, hosted persistence or visual-quality acceptance.'}));
