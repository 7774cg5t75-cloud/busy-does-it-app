import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {interpretSelectedAppAppearance as interpret} from '../src/core/appContextInstruction.mjs';
import {bindAppControlReview as bind,appControlReviewCurrent as current} from '../src/core/appControlReview.mjs';
import {planAppVoiceInstructions as voice} from '../src/core/appCoordinatedStudio.mjs';
import {planAppVoiceInstructions as edge} from '../supabase/functions/busy-mini-apps/appCoordinatedStudio.mjs';
const businessId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',config={modules:[{key:'business_profile',enabled:true},{key:'services',enabled:true}],navigation:['business_profile','services'],presentation:{headerStyle:'quiet',layoutDensity:'compact'},publicProfile:{about:'Owner copy'}};
assert.equal(interpret(config,{selected:'header',text:'Not bold, make it refined'}).value,'refined');
for(const text of ['Not bold','Make it bold and refined','Bold rather than quiet','Make the header bold and navigation a list'])assert.equal(interpret(config,{selected:'header',text}).ok,false,text);
assert.equal(interpret(config,{selected:'spacing',text:'Give it more space'}).value,'airy');
for(const text of ['Do not make photos bigger','Delete photos and make photos bigger','Make it airy and compact']){assert.equal(voice(config,text).ok,false,text);assert.deepEqual(edge(config,text),voice(config,text));}
const app={id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',business_id:businessId,draft_revision:4,draft_config:config},context={ownerId:'owner-a',businessId,app},review=bind({field:'headerStyle',value:'bold'},context);
assert.equal(current(review,context),true);
for(const changed of [{...context,ownerId:'owner-b'},{...context,app:{...app,draft_revision:5}},{...context,app:{...app,draft_config:{...config,publicProfile:{about:'Changed'}}}}])assert.equal(current(review,changed),false);
const ui=readFileSync(new URL('../src/screens/miniApps.js',import.meta.url),'utf8');assert.match(ui,/selectedPart:selectedAppPart/);assert.doesNotMatch(ui,/businessId:s.cloudWorkspace.businessId,selectedPart\}\}/);assert.match(ui,/appControlReviewCurrent\(pendingAppearance,liveControlContext.current\)/);assert.match(ui,/appControlReviewCurrent\(pendingMove,liveControlContext.current\)/);
console.log('PASS: negation/ambiguity and external-intent rejection, shared voice parity, exact-source appearance/reorder approvals and valid selected App voice binding.');
