import assert from 'node:assert/strict';
import {prepareAppGoalContent as prepare,appGoalContentQuestions as questions} from '../src/core/appGoalContentPreparation.mjs';
import {proposeCoordinatedAppChanges as plan} from '../src/core/appCoordinatedStudio.mjs';
import {proposeCoordinatedAppChanges as edge} from '../supabase/functions/busy-mini-apps/appCoordinatedStudio.mjs';
const businessId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const wrap=config=>({businessId,app:{id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',business_id:businessId,draft_revision:3,draft_config:config}});
const base={navigation:['business_profile','services','gallery'],modules:[{key:'business_profile',enabled:true},{key:'services',enabled:true},{key:'gallery',enabled:true}],publicProfile:{about:'Keep owner copy'}};
for(const services of [undefined,null,[]]){
 const config={...base,publicProfile:{...base.publicProfile,...(services!==undefined?{services}:{})}};
 const result=prepare({...wrap(config),goal:'book',answers:{'first-service-name':'Consultation','first-service-description':'Discuss the next step'}});
 assert.equal(result.ok,true);assert.equal(result.nextConfig.publicProfile.services[0].name,'Consultation');
 assert.deepEqual(plan(result.nextConfig,result.undoOperations).nextConfig,config);
 assert.equal(prepare({...wrap(config),goal:'book',answers:{'first-service-description':'Missing name'}}).ok,false);
}
for(const prior of [{},{alt:null,caption:null},{alt:'',caption:'Keep caption'}]){
 const image={uri:'https://example.com/owner.jpg',approved:true,...prior};
 const config={...base,publicProfile:{...base.publicProfile,assets:{gallery:[image,{uri:'https://example.com/private.jpg'}]}}};
 assert.deepEqual(questions(config,'photos').map(q=>q.id),['photo:0']);
 const result=prepare({...wrap(config),goal:'photos',answers:{'photo:0':'Owner describes the entrance'}});
 assert.equal(result.ok,true);assert.deepEqual(result.nextConfig.publicProfile.assets.gallery[0],{...image,alt:'Owner describes the entrance'});
 const undone=plan(result.nextConfig,result.undoOperations);assert.equal(undone.ok,true);assert.deepEqual(undone.nextConfig,config);
 assert.deepEqual(plan(undone.nextConfig,undone.undoOperations).nextConfig,result.nextConfig);
 assert.deepEqual(edge(result.nextConfig,result.undoOperations),undone);
 for(const lock of ['copy','photos','gallery','all'])assert.equal(plan({...result.nextConfig,presentation:{ownerLockedElements:[lock]}},result.undoOperations).ok,false);
 assert.equal(plan(result.nextConfig,[{...result.undoOperations[0],expectedUri:'https://foreign.test/image'}]).ok,false);
 assert.equal(prepare({...wrap(config),goal:'photos',answers:{'photo:1':'Unapproved'}}).ok,false);
}
console.log('PASS: guided first service, approved photo descriptions, exact sparse/null undo-redo, shared edge parity and owner-lock/media identity protections.');
