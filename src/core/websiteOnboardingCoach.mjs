/**
 * V3.121 plain-language first steps without guessing missing facts or
 * collecting data. The Brand Brain and website journey are authoritative.
 */
const labels={
 businessName:"business name",businessType:"type of business",
 phone:"contact number",email:"contact email",services:"services",
 serviceArea:"areas you serve",address:"business address",
 description:"what your business does",logo:"branding"
};
function websiteOnboardingCoach({brand=null,journey=null,draft=null}={}){
 const facts=Array.isArray(journey?.missingCoreFacts)?
   journey.missingCoreFacts.filter(x=>typeof x==="string").slice(0,8):[];
 const unique=[...new Set(facts.map(x=>labels[x]||null).filter(Boolean))];
 if(brand?.websiteReady!==true){
  const hint=unique.length?unique.slice(0,3).join(", "):
   "your business name, main services and how customers contact you";
  return {stage:"confirm-details",next:"Confirm your business information",
   message:"Check "+hint+" before BUSY builds your website. You can change details later.",
   factCount:facts.length,automaticBuild:false,websitePublished:false};
 }
 if(!draft){
  return {stage:"private-draft",next:"Create a private first design",
   message:"BUSY has your approved business information. The first design stays private until you review it.",
   factCount:0,automaticBuild:false,websitePublished:false};
 }
 return {stage:"ready-to-edit",next:"Improve your private website",
  message:"Your existing business details stay in place while you edit the design. Publishing requires separate approval.",
  factCount:0,automaticBuild:false,websitePublished:false};
}
export {websiteOnboardingCoach};
