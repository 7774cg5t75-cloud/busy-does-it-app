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
 const raw=String(value??"").trim().replace(/^£\s*/,"").replace(/,/g,"");
 if(!/^\d{1,7}(?:\.\d{1,2})?$/.test(raw))return null;
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
