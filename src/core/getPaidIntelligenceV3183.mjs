/**
 * V3.183 — reconciled private Get Paid intelligence (adapted from stray V3.182).
 * Prepares an editable quote from owner-provided facts and reviews existing
 * quote/booking milestones. NO sends, charges, payment processing or invoices.
 * A stored quote/job is NEVER proof of revenue or payment.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clean=(value,max=120)=>String(value||"").replace(/[\x00-\x1f\x7f]/g," ")
  .replace(/\s+/g," ").trim().slice(0,max);
function readPence(value){
 const display=String(value??"").trim().replace(/^£\s*/,"");
 // A comma is accepted only as a thousands separator, never as stray digits.
 if(!/^(?:\d{1,7}|\d{1,3}(?:,\d{3}){1,2})(?:\.\d{1,2})?$/.test(display))return null;
 const raw=display.replace(/,/g,"");
 const [whole,fraction=""]=raw.split(".");
 const minor=Number(whole)*100+Number(fraction.padEnd(2,"0")||0);
 return Number.isSafeInteger(minor)&&minor>=100&&minor<=100000000?minor:null;
}
const displayPounds=pence=>(pence/100).toFixed(2);
function prepareGetPaidQuoteDraft({
 businessId="",customer=null,brief="",currentAmount="",ownerCustomerVerified=false
}={}){
 if(ownerCustomerVerified!==true||!UUID.test(businessId)||!customer||
   (customer.business_id&&customer.business_id!==businessId)||!clean(customer.id,100)||
   !clean(customer.name,100)||!clean(customer.service,140))
  return {ok:false,reason:"Open a current customer within your signed-in business."};
 if(typeof brief!=="string"||brief.trim().length<3||brief.length>500)
  return {ok:false,reason:"Describe the agreed quote and amount in a short, private brief."};
 // Reject malformed explicit currency values instead of treating their prefix
 // as a valid smaller quote (e.g. £125.000 or £1,2).
 if(/(?:£\s*|\bGBP\s+)[\d,]+(?:\.\d{3,}|,[\d]{1,2}(?!\d))/.test(brief))
  return {ok:false,reason:"A price has too many decimal places or invalid separators."};
 const amounts=[];
 const patterns=[
  /(?:£\s*|\bGBP\s+)(\d{1,7}(?:,\d{3})*(?:\.\d{1,2})?)(?![\d]|[.,]\d)/gi,
  /\b(\d{1,7}(?:,\d{3})*(?:\.\d{1,2})?)\s+pounds?\b/gi
 ];
 for(const pattern of patterns){
  for(const match of brief.matchAll(pattern)){
   const pence=readPence(match[1]);
   if(pence===null)return {ok:false,reason:"The stated price needs checking."};
   amounts.push(pence);
  }
 }
 const unique=[...new Set(amounts)];
 if(unique.length>1)return {ok:false,reason:"More than one price was mentioned. Confirm a single quote amount."};
 const fallback=currentAmount===""?null:readPence(currentAmount);
 if(currentAmount!==""&&fallback===null)return {ok:false,reason:"Check the existing quote price first."};
 const pence=unique[0]??fallback;
 if(pence===undefined||pence===null)
  return {ok:false,reason:"Add one clear amount, such as £125, or enter a quote price first."};
 const includesVat=/\b(?:incl(?:uding)?\.?|inc\.?)\s*VAT\b/i.test(brief);
 const excludesVat=/\b(?:excl(?:uding)?\.?|ex\.?)\s*VAT\b/i.test(brief);
 if(includesVat&&excludesVat)
  return {ok:false,reason:"The VAT wording conflicts. Review it before preparing a quote."};
 const name=clean(customer.name,100).split(" ")[0];
 const service=clean(customer.service,140);
 const total=displayPounds(pence);
 const changedExisting=fallback!==null&&fallback!==pence;
 const vatNote=includesVat?"VAT included, as stated in the owner's brief":
   excludesVat?"VAT excluded, as stated in the owner's brief":"VAT treatment not specified";
 return {ok:true,kind:"get_paid_private_quote_v3183",
  customerId:clean(customer.id,100),
  amountPence:pence,amountDisplay:total,currency:"GBP",
  serviceSource:"current_business_customer_record",
  amountSource:unique.length?"explicit_owner_brief":"existing_owner_quote_field",
  changedExistingAmount:changedExisting,
  message:`Hi ${name}, thanks for asking about ${service}. My quote is £${total}. Please let me know if you'd like to go ahead.`,
  vatNote,
  reviewChecks:[
   "Confirm the work, materials and any exclusions.",
   "Confirm VAT treatment, payment terms and the final total.",
   changedExisting?"The brief changes the amount shown in the editor. Check both figures.":
    "Confirm the amount against the actual job before sending."
  ],
  ownerApprovalRequired:true,editableBeforeSaving:true,
  createdInvoice:false,paymentLinkCreated:false,
  quoteSent:false,customerContacted:false,paymentTaken:false,
  providerFeesKnown:false,providerTermsMustBeShownBeforeConnecting:true,
  localOwnerScopeChecked:true,externalOwnershipNotIndependentlyVerified:true,
  noNetworkRequests:true,noCustomerDataShared:true,
  noCrossBusinessLearning:true,noModelRetraining:true};
}
function reviewGetPaidNextStep({
 businessId="",customer=null,action=null,nowISO="",todayISO="",ownerCustomerVerified=false
}={}){
 if(ownerCustomerVerified!==true||!UUID.test(businessId)||
   (customer?.business_id&&customer.business_id!==businessId)||!clean(customer?.id,100)||
   !action||!["quote","booking"].includes(action.type))
  return {ok:false,reason:"Review a current quote or booking for this business."};
 const now=Date.parse(nowISO);
 const today=/^\d{4}-\d{2}-\d{2}$/.test(todayISO)?todayISO:
  Number.isFinite(now)?new Date(now).toISOString().slice(0,10):"";
 const d=action.details||{};
 let next="Review the customer's current details",why="No verified payment data is connected.",priority="review";
 if(action.type==="quote"){
  const state=action.done?d.quoteStatus||"Prepared":"Draft";
  if(state==="Draft"||state==="Prepared"){
   next="Review and send the quote yourself";
   why="A prepared quote is not evidence that the customer received it.";
  }else if(state==="Sent"){
   const due=typeof d.followUpDueDate==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d.followUpDueDate)?
    d.followUpDueDate:"";
   if(due&&today&&due<=today&&!d.followUpSentAt){
    next="Prepare a polite quote follow-up";
    why="The owner-marked quote has reached its follow-up date; delivery and response are unverified.";
    priority="attention";
   }else{
    next="Wait for a reply or review the follow-up date";
    why="The quote was marked sent, but delivery and acceptance are not independently verified.";
   }
  }else if(state==="Accepted"){
   next="Arrange the work before preparing payment paperwork";
   why="Owner-marked acceptance is not a completed job or verified payment.";
  }else if(state==="Declined"){
   next="Respect the customer's decision";
   why="Do not automatically chase a declined quote.";
  }else return {ok:false,reason:"This quote state needs owner review."};
 }else{
  const state=action.done?d.bookingStatus||"Draft":"Draft";
  if(state==="Completed"){
   next="Check whether an invoice needs preparing";
   why="Completed work may need invoicing, but BUSY cannot tell whether this job has already been billed or paid.";
   priority="review";
  }else if(state==="Confirmed"){
   next="Complete the work before checking invoicing";
   why="A booking is not completed work, a sent invoice, or money received.";
  }else if(state==="Cancelled"){
   next="No automatic payment follow-up";
   why="The booking was marked cancelled. Review any legitimate charges separately.";
  }else{
   next="Confirm the booking details first";
   why="A draft booking does not establish that work or payment is owed.";
  }
 }
 return {ok:true,kind:"get_paid_owner_next_step_v3183",
  next,why,priority,ownerOnly:true,
  quoteAndBookingStatesOwnerRecordedNotVerifiedExternalFacts:true,
  invoiceCreated:false,invoiceSent:false,paymentLinkCreated:false,
  paymentReceivedVerified:false,revenueRecognised:false,
  reminderSent:false,ownerApprovalRequired:true,
  localOwnerScopeChecked:true,externalOwnershipNotIndependentlyVerified:true,
  noAutomatedSpending:true,noNetworkRequests:true,noCrossBusinessLearning:true};
}
export {prepareGetPaidQuoteDraft,reviewGetPaidNextStep};

// Preparation only; callers must obtain these finite observations through trusted IO.
// This does not validate acceptance or establish a request/diary/ledger association.
export function prepareCanonicalQuoteWorkNotes({record,comparison}={}){
 const r=record,d=r?.record?.details,c=comparison;
 if(!r||!c||!UUID.test(r.businessId||'')||!UUID.test(r.engagementId||'')||!UUID.test(r.ownerId||'')||typeof r.customerId!=='string'||!r.customerId||r.customerId.length>240||typeof r.enquiryId!=='string'||!r.enquiryId||r.enquiryId.length>240||r.type!=='quote'||r.status!=='Prepared'||r.schemaVersion!==1||!Number.isSafeInteger(r.revision)||r.revision<1||!(/^[0-9a-f]{64}$/).test(r.recordHash||'')||!(/^[0-9a-f]{64}$/).test(r.sourceHash||'')||r.notOwnReceipt!==true||c.notOwnReceipt!==true||c.comparisonOnly!==true||c.mutationAuthorised!==false||c.sourceState!=='current'||['businessId','ownerId','customerId','engagementId','enquiryId','revision','recordHash','sourceHash'].some(key=>r[key]!==c[key])||!d||d.quoteStatus!=='Prepared'||typeof d.message!=='string'||!d.message.trim()||d.message.length>8000||!/^\d+(?:\.\d{1,2})?$/.test(String(d.quoteAmount))||typeof d.plannedSentDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d.plannedSentDate))return {ok:false,reason:'A matching current Prepared quote and original source are required. Keep your wording and inspect again.'};
 const day=new Date(d.plannedSentDate+'T12:00:00Z');if(!Number.isFinite(day.getTime())||day.toISOString().slice(0,10)!==d.plannedSentDate)return {ok:false,reason:'The planned quote date needs review.'};
 const text='PRIVATE WORK PREPARATION — NOT A BOOKING\nEngagement: '+r.engagementId+'\nCustomer reference: '+r.customerId+'\nOriginal enquiry: '+r.enquiryId+'\nQuote revision reviewed: '+r.revision+'\nPrepared amount: £'+d.quoteAmount+'\nPlanned quote date (not an appointment): '+d.plannedSentDate+'\n\nRecorded quote wording (unchanged):\n'+d.message+'\n\nBefore progressing this engagement:\n• Review scope, exclusions and current requirements.\n• Obtain and verify customer agreement for this exact quote.\n• Review availability, date, time and diary conflicts.\n• Establish the original request/link/Work booking relationship.\n\nAcceptance, booking association, diary confirmation, delivery and payment have not been established by this preparation. Keep the same engagement ID; do not replace earlier Work.';
 let bytes;try{bytes=encodeURIComponent(text).replace(/%[A-F0-9]{2}/g,'x').length;}catch{return {ok:false,reason:'The complete wording contains unsupported text. Nothing was truncated.'};}
 if(text.length>10000||bytes>10000)return {ok:false,reason:'The complete preparation exceeds the private wording limit. Keep your existing words; no text was truncated.'};
 return {ok:true,text,engagementId:r.engagementId,revision:r.revision,status:'Prepared',acceptanceVerified:false,bookingAssociationVerified:false,diaryChanged:false,customerContacted:false,paymentExecuted:false,preparationOnly:true};
}

// Owner-supplied private preparation, never independent customer acceptance.
export function prepareCanonicalOwnerAgreementNote({record,comparison,ownerAccount}={}){
 const base=prepareCanonicalQuoteWorkNotes({record,comparison});
 if(!base.ok||typeof ownerAccount!=='string'||!ownerAccount.trim()||ownerAccount.length>5000)return {ok:false,reason:'Review a current quote and supply your own bounded account; no customer evidence is inferred.'};
 const text='OWNER-RECORDED AGREEMENT ACCOUNT — NOT INDEPENDENTLY VERIFIED\nProvenance: owner-supplied verbal/offline account; no externally verified confidence.\nEngagement: '+record.engagementId+'\nCustomer reference: '+record.customerId+'\nOriginal enquiry: '+record.enquiryId+'\nQuote version reviewed: '+record.revision+'\nPrepared amount: £'+record.record.details.quoteAmount+'\nQuote wording reviewed (not proof of agreement to these terms):\n'+record.record.details.message+'\n\nExact owner account:\n'+ownerAccount+'\n\nNo external response, delivery receipt, signature or acceptance date has been verified by this note. The quote remains Prepared. Booking/request/ledger linkage and diary conflicts require separate authority.';
 let bytes;try{bytes=encodeURIComponent(text).replace(/%[A-F0-9]{2}/g,'x').length;}catch{return {ok:false,reason:'Unsupported text; keep your words.'};}
 if(bytes>10000)return {ok:false,reason:'The complete note exceeds the private limit; no text was truncated.'};
 return {...base,text,agreementProvenance:'owner_attested_verbal_offline',independentlyVerified:false};
}
