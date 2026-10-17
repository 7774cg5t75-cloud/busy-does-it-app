import assert from 'node:assert/strict';
import {inspectCapabilityIntent as inspect,planUniversalBuilderRequest as plan} from '../src/core/universalBuilderPlanV3210.mjs';
import {planFunctionalBusinessApp as appPlan} from '../src/core/appExperiencePlanner.mjs';
import {adviseCustomerCapabilityV3216 as advise} from '../src/core/customerCapabilityAdviceV3216.mjs';
const catalog=['business_profile','services','contact','enquiry','booking_request','gallery','offers'].map(module_key=>({module_key,title:module_key,status:'available',capabilities:{customer_action:true,confirmation_required_by_business:true}}));
for(const [phrase,wanted,excluded]of [
 ['No online bookings or payments; just enquiries.',['enquiry'],['booking_request','payments']],
 ['No bookings, payments or deposits; show products.',['catalogue'],['booking_request','payments','deposits']],
 ['Avoid bookings and add enquiries.',['enquiry'],['booking_request']],
 ['Show photos and allow customers to enquire.',['gallery','enquiry'],[]],
 ['Not only bookings but also enquiries.',['booking_request','enquiry'],[]],
 ['Customers can upload their photos.',['uploads'],[]]
]){const result=inspect(phrase);for(const key of wanted)assert.ok(result.requested.includes(key),phrase+': '+key);for(const key of excluded){assert.ok(result.declined.includes(key),phrase+': '+key);assert.ok(!result.requested.includes(key));}}
assert.deepEqual(inspect('No bookings, but please add bookings.').conflicts,['booking_request']);
assert.equal(plan({request:'No bookings, but please add bookings.'}).needsClarification,true);
assert.equal(plan({request:'No payments.'}).needsClarification,true);
assert.equal(plan({request:'Checkout without payments.'}).needsClarification,true);
const salon=appPlan({businessType:'Hair salon',businessGoals:'No bookings; just enquiries.',catalog});assert.equal(salon.suggestedModules.find(x=>x.key==='booking_request').suggested,false);assert.equal(salon.suggestedModules.find(x=>x.key==='enquiry').suggested,true);assert.equal(salon.recommendedNotEnabled,true);
assert.equal(advise({businessType:'Hair salon',description:'No bookings; just enquiries.',catalog}).capability,'enquiry');
assert.equal(advise({businessType:'Hair salon',description:'No bookings, but add bookings.',catalog}).needsClarification,true);
const unfamiliar=appPlan({businessType:'Mobile instrument restoration',businessGoals:'Let customers enquire and show photos.',catalog,profile:{assets:{gallery:[{uri:'https://example.invalid/owner.jpg',approved:true}]}}});assert.equal(unfamiliar.suggestedModules.find(x=>x.key==='enquiry').suggested,true);assert.equal(unfamiliar.usesOnlyAvailableModules,true);assert.equal(unfamiliar.canChangeLiveApp,false);
assert.equal(inspect('x'.repeat(1401)).valid,false);
console.log('PASS one shared capability-intent interpretation across universal plans, App Builder and customer advice: exclusions, lists, contradictory requests, dependency conflicts and unfamiliar businesses. No provider/model calls.');
