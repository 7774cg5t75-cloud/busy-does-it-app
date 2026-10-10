import assert from "node:assert/strict";
import {normalizeVisualCritique,applyApprovedVisualProposals} from "../supabase/functions/busy-website-worker/visualCriticContract.mjs";
const bare=normalizeVisualCritique({reviewedScreenshots:false,proposals:[{path:"theme.heroSize",value:"large"}]});
assert.equal(bare.valid,false);
const absent=normalizeVisualCritique({reviewedScreenshots:true,proposals:[
 {path:"sections[0].body",value:"Award-winning"},
 {path:"publish.enabled",value:true},
 {path:"businessName",value:"Fake Business"},
 {path:"theme.heroLayout",value:"image-right"},
 {path:"theme.cardLayout",value:"rows",reason:"Tighter cards are easier to scan"},
 {path:"theme.navStyle",value:"pill"},
 {path:"theme.typography",value:"refined"},
]},{approvedPhotos:0});
assert.equal(absent.valid,true);
assert.equal(absent.proposals.length,3);
assert.equal(absent.proposals.some(p=>p.path==="theme.heroLayout"),false,"No image layout without approved photo");
assert.equal(absent.proposals.some(p=>p.path==="businessName"),false,"Never change business facts from screenshot advice");
const draft={id:"private-only",publicStatus:"Not published",businessName:"Original",theme:{mood:"clean"},sections:[{id:"hero",body:"Original copy"}],publish:{enabled:false}};
const noConsent=applyApprovedVisualProposals(draft,absent);
assert.equal(noConsent.applied,false,"Owner must approve edits");
const yes=applyApprovedVisualProposals(draft,absent,{ownerApproved:true});
assert.equal(yes.applied,true);
assert.equal(yes.draft.theme.cardLayout,"rows");
assert.equal(yes.draft.businessName,"Original");
assert.deepEqual(yes.draft.sections,draft.sections);
assert.deepEqual(yes.draft.publish,draft.publish);
assert.deepEqual(draft.theme,{mood:"clean"},"Source draft not mutated");
const photo=normalizeVisualCritique({reviewedScreenshots:true,proposals:[{path:"theme.heroLayout",value:"image-left"}]},{approvedPhotos:1});
assert.equal(photo.proposals.length,1);
const tooMany=normalizeVisualCritique({reviewedScreenshots:true,proposals:Array.from({length:13},()=>({path:"theme.navStyle",value:"pill"}))});
assert.equal(tooMany.valid,false,"Feedback proposals bounded");
console.log("PASS visual AI proposal contract: evidence, photo provenance, safe theme-only scope, approval, preview publication isolation");
