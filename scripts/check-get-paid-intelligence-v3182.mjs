import assert from "node:assert/strict";
import {prepareGetPaidQuoteDraft,reviewGetPaidNextStep} from "../src/core/getPaidIntelligenceV3182.mjs";
const b="11111111-1111-4111-8111-111111111111";
const customer={id:"local-customer-12",name:"Alice Brown",service:"Tap installation"};
const good=prepareGetPaidQuoteDraft({businessId:b,customer,brief:"Replace tap for £125, materials included."});
assert.equal(good.ok,true);
assert.equal(good.amountPence,12500);
assert.equal(good.amountDisplay,"125.00");
assert.match(good.message,/Alice.*Tap installation.*£125\.00/);
assert.equal(good.quoteSent,false);
assert.equal(good.createdInvoice,false);
assert.equal(good.paymentTaken,false);
assert.equal(good.noNetworkRequests,true);
assert.equal(prepareGetPaidQuoteDraft({businessId:"wrong",customer,brief:"£125"}).ok,false);
assert.equal(prepareGetPaidQuoteDraft({businessId:b,customer:{...customer,name:""},brief:"£125"}).ok,false);
assert.equal(prepareGetPaidQuoteDraft({businessId:b,customer,brief:"Quote £125 or £150"}).ok,false);
assert.equal(prepareGetPaidQuoteDraft({businessId:b,customer,brief:"Quote £0"}).ok,false);
assert.equal(prepareGetPaidQuoteDraft({businessId:b,customer,brief:"£125 including VAT and excluding VAT"}).ok,false);
const updated=prepareGetPaidQuoteDraft({businessId:b,customer,brief:"Please quote £165",currentAmount:"125"});
assert.equal(updated.ok,true);
assert.equal(updated.changedExistingAmount,true);
const existing=prepareGetPaidQuoteDraft({businessId:b,customer,brief:"Please prepare a quote",currentAmount:"125.50"});
assert.equal(existing.amountPence,12550);
assert.equal(existing.amountSource,"existing_owner_quote_field");
const due=reviewGetPaidNextStep({businessId:b,customer,action:{type:"quote",done:true,details:{
 quoteStatus:"Sent",followUpDueDate:"2026-10-10"}},nowISO:"2026-10-12T10:00:00Z"});
assert.equal(due.ok,true);
assert.equal(due.priority,"attention");
assert.equal(due.reminderSent,false);
const followed=reviewGetPaidNextStep({businessId:b,customer,action:{type:"quote",done:true,details:{
 quoteStatus:"Sent",followUpDueDate:"2026-10-10",followUpSentAt:"2026-10-11"}},nowISO:"2026-10-12T10:00:00Z"});
assert.notEqual(followed.priority,"attention");
const completed=reviewGetPaidNextStep({businessId:b,customer,action:{type:"booking",done:true,details:{
 bookingStatus:"Completed"}},nowISO:"2026-10-12T10:00:00Z"});
assert.match(completed.next,/invoice/);
assert.equal(completed.paymentReceivedVerified,false);
const cancelled=reviewGetPaidNextStep({businessId:b,customer,action:{type:"booking",done:true,details:{
 bookingStatus:"Cancelled"}}});
assert.match(cancelled.next,/No automatic/);
assert.equal(reviewGetPaidNextStep({businessId:"",customer,action:{type:"booking"}}).ok,false);
console.log("V3.182 Get Paid private intelligence checks passed.");
