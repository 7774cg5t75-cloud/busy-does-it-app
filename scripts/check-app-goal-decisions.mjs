import assert from 'node:assert/strict';
import {reviewAppGoalDesignV3240 as review} from '../src/core/appGoalDesignReviewV3240.mjs';
import {selectAppGoalDesignChoices as select} from '../src/core/appGoalDesignDecisions.mjs';
import {validPrivateBuilderPair} from '../src/core/ownerBuilderDraftGuardV3195.mjs';
const businessId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const keys=['business_profile','services','gallery','enquiry','contact'];
const config={modules:keys.map(key=>({key,enabled:true})),navigation:keys,presentation:{navigationStyle:'tabs',layoutDensity:'compact',galleryLayout:'grid',imageScale:'large'},publicProfile:{services:[{name:'Owner service',description:'Owner wording'}],assets:{gallery:[1,2,3].map(i=>({uri:'https://example.test/'+i,approved:true}))}}};
const app={id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',business_id:businessId,draft_revision:4,draft_config:config};
const forGoal=goal=>review({businessId,app,goal});
const service=forGoal('services');assert.equal(service.operations.some(op=>op.field==='galleryLayout'),false);assert.equal(service.operations[0].field,'layoutDensity');assert.equal(service.contentReadiness.ready,true);
const photos=forGoal('photos');assert.equal(photos.operations.some(op=>op.field==='galleryLayout'),true);assert.equal(photos.visualTradeoffs[0].field,'galleryLayout');
const noContent={...app,draft_config:{...config,publicProfile:{services:[],assets:{gallery:[]}}}};
for(const goal of ['services','photos']){const r=review({businessId,app:noContent,goal});assert.equal(r.ok,true);assert.equal(r.operations.length,0);assert.equal(r.task.needsSetup,true);assert.equal(r.contentReadiness.ready,false);assert.match(r.recommendation,/Add/);}
const noApproval={...app,draft_config:{...config,publicProfile:{...config.publicProfile,assets:{gallery:[{uri:'https://example.test/unapproved',approved:false}]}}}};assert.equal(review({businessId,app:noApproval,goal:'photos'}).operations.length,0);
const current={...config,presentation:{navigationStyle:'list',galleryLayout:'stack'}};
const result=select(current,'photos',[{field:'navigationStyle',value:'tabs'},{field:'galleryLayout',value:'grid'}]);assert.equal(result.choices.length,0);assert.equal(result.excludedCount,2);
const website={id:'web',generation:1,sections:[],businessId};assert.equal(validPrivateBuilderPair(website,app,businessId),true);assert.equal(validPrivateBuilderPair({...website,business_id:'foreign'},app,businessId),false);
assert.equal(service.actualCustomerOutcome,false);assert.equal(photos.realDeviceVerified,false);
console.log('PASS: task-ranked choices, unrelated gallery suppression, absent/unapproved content blockers, new static advisory rejection and both website tenant aliases. No real-world outcome claims.');
