/**
 * V3.217 estimated accessibility/layout guidance for owner-reviewed
 * future website forms. Not a screenshot, rendered-browser or WCAG audit.
 */
const ALLOWED=new Set(["name","email","phone","message","service","preferredDate"]);
const VIEWPORTS=Object.freeze([
 {id:"phone",width:375,columns:1},
 {id:"tablet",width:768,columns:2},
 {id:"desktop",width:1280,columns:2}
]);
const LABEL={
 name:"Name",email:"Email",phone:"Phone",message:"Enquiry message",
 service:"Service requested",preferredDate:"Preferred date (not confirmed)"
};
function reviewCustomerFormResponsiveV3217({form=null}={}){
 const fields=Array.isArray(form?.fieldKeys)?form.fieldKeys:[];
 if(!form?.ok||fields.length===0||fields.length>6||
   new Set(fields).size!==fields.length||fields.some(x=>!ALLOWED.has(x)))
   return {ok:false,reason:"Review an approved-shape private form specification first.",
    screenshotsCaptured:false,publicFormEnabled:false};
 const layouts=VIEWPORTS.map(({id,width,columns})=>({
  id,assumedWidth:width,columns,
  // Keep the action and long text full-width even on desktop.
  rows:fields.map(key=>({key,label:LABEL[key],
   fullWidth:columns===1||["message","service"].includes(key),
   minTapHeight:48,visibleLabel:true,keyboardAccessibleTarget:true})),
  submitLabel:form.proposedRequestType==="booking_request"?
   "Send booking request":"Send enquiry",
  submitOutcomeNotice:form.proposedRequestType==="booking_request"?
   "A request is not a confirmed appointment.":
   "A request is saved only after a verified server receipt.",
  estimatedOnly:true,realBrowserTested:false
 }));
 return {ok:true,kind:"private_responsive_form_guidance_v3217",
  layouts,minimumTouchTarget:48,minBodyFontPixels:16,
  avoidHorizontalScrolling:true,distinctFocusIndicatorRequired:true,
  visitorConsentMustNotBePrechecked:true,
  explicitSuccessReceiptRequired:true,
  screenshotsCaptured:false,colourContrastMeasured:false,
  screenReaderTested:false,realBrowserTested:false,
  publicFormEnabled:false,readOnly:true};
}
export {reviewCustomerFormResponsiveV3217};
