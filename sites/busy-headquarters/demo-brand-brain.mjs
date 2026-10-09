/**
 * V3.80 non-customer synthetic demonstration.
 * This is shaped exactly like a real Brand Brain website brief and is intended
 * to go through buildWebsiteDraft, not to bypass BUSY's builder.
 * No external customer account, testimonials, email, phone or claims.
 */
const showcaseBrandBrain={
 websiteReady:false,
 websiteReadinessLabel:"Demonstration only — missing real contact information",
 completeness:{score:0,coreMissing:["Verified business contact"]},
 missingForWebsite:["Real business contact"],
 websiteBrief:{
  businessName:"Northfield Property Care — Demo",
  businessType:"Home and garden maintenance",
  serviceArea:"Example Town (fictional demonstration)",
  description:"A fictional home-services website created to demonstrate BUSY DOES IT's website builder. This business does not accept real bookings.",
  tagline:"Looking after the little jobs, so you have more time for the big things. Fictional demonstration only.",
  visualStyle:"warm and professional",
  colours:["#204333","#dbe9bd"],
  phone:"",
  email:"",
  existingDomain:"",
  openingHours:"",
  services:[
   {id:"garden-care",name:"Garden care",description:"Example service copy: routine garden tidy-ups and seasonal maintenance."},
   {id:"exterior-cleaning",name:"Exterior cleaning",description:"Example service copy: paths, patios and outdoor surfaces."},
   {id:"small-repairs",name:"Small repairs",description:"Example service copy: common household maintenance jobs."}
  ],
  about:"This demonstration business is invented. It is not trading, taking customer payments or offering real appointments.",
  differentiators:"No testimonials or invented five-star ratings are shown.",
  photos:[],testimonials:[],
  faqs:[
   {id:"availability",question:"Can I book Northfield Property Care?",answer:"No. This is a demonstration website only. It does not accept real bookings or enquiries."},
   {id:"website-created",question:"What created this site?",answer:"The website's draft is generated from a fictional business brief using the BUSY DOES IT website builder."}
  ]
 }
};
export {showcaseBrandBrain};
