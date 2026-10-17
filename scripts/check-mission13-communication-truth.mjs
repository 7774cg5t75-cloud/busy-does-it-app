import assert from 'node:assert/strict';
import {buildCommunicationsHub as hub} from '../src/domain/communicationsHub.js';
const customer={id:'customer-a',name:'Fictional customer',contactOk:true};
const incoming={id:'source-a',source:'Email',stage:'incoming',rawText:'Could you tell me more?',importedAt:'2026-10-17T08:00:00Z'};
function thread(status,title='Reply',more={}){
 return hub({customers:[{...customer,sourceRecords:[incoming],...more}],customerJourneys:[{customerId:customer.id,nextAction:{kind:'new-enquiry'},communicationHistory:[{id:'reply-a',status,title,body:'Owner response',createdAt:'2026-10-17T09:00:00Z'}]}]}).threads[0];
}
for(const status of ['Approved','Draft','Sending','Unsent','Not sent','Failed','Unknown','Delivered','Awaiting approval']){
 const t=thread(status);const outbound=t.messages.find(m=>m.id.includes('reply-a'));
 assert.equal(outbound.actualContact,false,status+' cannot be treated as sent');assert.equal(outbound.deliveryVerified,false);
 assert.notEqual(t.lane,'Awaiting customer');
 if(['Sending','Unsent','Not sent','Failed','Unknown','Delivered'].includes(status))assert.equal(t.duplicateGuard.blocked,true,'uncertain/failed attempts require receipt review');
}
assert.equal(thread('Approved').messages.find(m=>m.id.includes('reply-a')).state,'approved');
assert.equal(thread('Sent').lane,'Awaiting customer');assert.equal(thread('Sent').messages.find(m=>m.id.includes('reply-a')).deliveryVerified,false);
assert.equal(thread('','Quote follow-up recorded as sent').lane,'Awaiting customer');
assert.equal(thread('Approved','Reply',{contactOk:false}).duplicateGuard.blocked,true);
assert.equal(thread('Approved','Reply',{contactOk:false}).contactAllowed,false);
// A genuinely newer incoming message removes the old uncertain-contact block.
const fresh=hub({customers:[{...customer,sourceRecords:[{...incoming,importedAt:'2026-10-17T10:00:00Z'}]}],customerJourneys:[{customerId:customer.id,nextAction:{kind:'new-enquiry'},communicationHistory:[{id:'old',title:'Reply',status:'Unknown',createdAt:'2026-10-17T09:00:00Z'}]}]}).threads[0];assert.equal(fresh.duplicateGuard.blocked,false);
console.log('PASS existing Communications Hub distinguishes approval/draft/unsent/sending/failed/unknown from recorded sends, refuses delivery claims, suppresses uncertain duplicate contact and respects contact revocation. Pure projections, no provider calls.');
