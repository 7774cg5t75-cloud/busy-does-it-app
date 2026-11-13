// V22.53 finite disclosure policy. Formatting is never access authority.
export const QUOTE_ACCESS_DAYS=Object.freeze([7,14,30]);
export const DEFAULT_QUOTE_ACCESS_DAYS=14;
export const QUOTE_VIEW_IDLE_MINUTES=15;
export const QUOTE_PRESENTATION_TEXT_FIELDS=Object.freeze(['quoteIdentifier','businessLegalName','businessAddress','businessEmail','businessPhone','businessRegistration','paymentTerms','depositTerms','exclusions','assumptions','limitations','guarantees','warranties','terms','cancellationInformation','statutoryRights','proposedTiming']);
const derived=['businessName','customerName','quoteVersion','scope','total','currency','validUntil','offerType','proposedTimingConfirmed','vatTotal','itemisedPrices'];
export function isApprovedQuoteProjection(v){
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>![...QUOTE_PRESENTATION_TEXT_FIELDS,...derived].includes(k)))return false;
 if(typeof v.quoteIdentifier!=='string'||!v.quoteIdentifier.trim()||typeof v.businessName!=='string'||typeof v.scope!=='string'||!Number.isSafeInteger(v.quoteVersion)||v.quoteVersion<1||typeof v.total!=='string'||!/^\d+(?:\.\d{1,2})?$/.test(v.total)||v.currency!=='GBP'||v.offerType!=='provisional'||v.proposedTimingConfirmed!==false||!Number.isFinite(Date.parse(v.validUntil)))return false;
 if(QUOTE_PRESENTATION_TEXT_FIELDS.some(k=>k in v&&(typeof v[k]!=='string'||v[k].length<1||v[k].length>6000)))return false;
 if('customerName'in v&&typeof v.customerName!=='string')return false;
 if('itemisedPrices'in v){
  if(!Array.isArray(v.itemisedPrices)||v.itemisedPrices.length<1||v.itemisedPrices.length>100)return false;
  for(const x of v.itemisedPrices){
   if(!x||Object.keys(x).sort().join('|')!==['description','lineTotal','quantity','unitPrice','vatAmount'].sort().join('|')||typeof x.description!=='string')return false;
   if(['lineTotal','quantity','unitPrice','vatAmount'].some(k=>!/^\d+(?:\.\d{1,3})?$/.test(String(x[k]))))return false;
  }
 }
 return true;
}
export function createQuoteDecisionIntent({presentationId,sessionId,action,question='',expectedRevision,operationId,obligationAcknowledged=false}={}){
 const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
 if(!uuid(presentationId)||!uuid(sessionId)||!['request_to_proceed','decline','question','accept_and_agree_to_pay'].includes(action)||!Number.isSafeInteger(expectedRevision)||expectedRevision<0||typeof question!=='string'||action==='question'&&!question.trim()||action!=='question'&&question!==''||typeof operationId!=='string'||!/^[A-Za-z0-9_-]{8,120}$/.test(operationId)||action==='accept_and_agree_to_pay'&&obligationAcknowledged!==true)return null;
 try{if(encodeURIComponent(question).replace(/%[A-F0-9]{2}/g,'x').length>10000)return null;}catch{return null;}
 return Object.freeze({kind:'untrusted_quote_decision_intent',presentationId,sessionId,action,question,expectedRevision,operationId,obligationAcknowledged:action==='accept_and_agree_to_pay',authenticated:false,notAReceipt:true,bindingAcceptanceAuthorised:false,executionAuthorised:false});
}
export const QUOTE_DECISION_LABELS=Object.freeze({request_to_proceed:'Request to proceed',accept_and_agree_to_pay:'Accept quote and agree to pay',decline:'Decline',question:'Ask a question'});
export const QUOTE_PRESENTATION_LABELS=Object.freeze({quoteIdentifier:'Customer-facing quote identifier',businessName:'Business',customerName:'Intended customer',quoteVersion:'Quote version',scope:'Goods, services and scope',total:'Total',currency:'Currency',validUntil:'Quote valid until',offerType:'Offer type',proposedTimingConfirmed:'Appointment confirmed',vatTotal:'VAT total',itemisedPrices:'Itemised prices',businessLegalName:'Legal business name',businessAddress:'Business address',businessEmail:'Business contact email',businessPhone:'Business contact phone',businessRegistration:'Business registration details',paymentTerms:'Payment terms',depositTerms:'Deposit terms',exclusions:'Exclusions',assumptions:'Assumptions',limitations:'Limitations',guarantees:'Guarantees',warranties:'Warranties',terms:'Applicable terms',cancellationInformation:'Cancellation information',statutoryRights:'Statutory rights',proposedTiming:'Proposed timing (unconfirmed)'});
export function formatApprovedQuoteProjection(v){if(!isApprovedQuoteProjection(v))return '';return Object.entries(v).map(([k,x])=>QUOTE_PRESENTATION_LABELS[k]+': '+(k==='itemisedPrices'?x.map(i=>i.description+' · quantity '+i.quantity+' · unit price '+i.unitPrice+' · VAT '+i.vatAmount+' · total '+i.lineTotal).join('\n'):x===false?'No':x)).join('\n');}
