// Closed concept vocabulary + contextual referents, not sentence templates or
// general language understanding. Model adapters may propose these labels later;
// this classifier never accepts tools, writes, credentials or action authority.
const concept=Object.freeze({website:['website','site','webpage','homepage'],mobile:['mobile','phone','phones','smartphone'],reading:['read','reading','use','usable','usability','difficult','hard','work','working'],quality:['professional','polished','amateur','amateurish','better','tidier','cluttered','smart'],demand:['more','enough','quiet','barely','spare','need','getting','get','find','win'],customers:['customer','customers','client','clients','enquiries'],time:['week','days','day','thursday','appointments'],offer:['offer','promotion','deal'],enquiry:['enquiry','inquiry','message','request'],work:['work','job','jobs']});
export function classifyOwnerGoal({request,surface=null,source='owner'}={}){
 const refuse=reason=>({version:1,recognised:false,intents:[],reason,mayExecute:false});
 if(source!=='owner'||typeof request!=='string'||!request.trim()||request.length>400||/[<>\u0000-\u001f\u007f]/.test(request))return refuse('Describe the result you want to review.');
 const text=request.normalize('NFKC').replace(/[’‘]/g,"'").toLowerCase().trim();
 if(/\b(ignore|bypass|override|publish|send|charge|pay|export|delete|password|token|steal)\b/.test(text)||/\b(don't|do not|never|stop|avoid)\b/.test(text))return refuse('Choose a private change to review. Nothing has been sent or changed.');
 if(/^(?:change|set|update|move|give|show|add (?:a )?(?:section|question))\b/.test(text))return refuse('Use the original exact editor for this instruction.');
 if(/^(?:would|should|what|which|how)\b/.test(text)||/\b(?:compare|comparison|another)\b/.test(text))return refuse('Discuss the available alternatives before preparing a change.');
 const clauses=text.replace(/[.!?]+$/,'').split(/\s+(?:and(?: then)?|then|also|plus)\s+|[;!?]/).map(x=>x.trim()).filter(Boolean);
 if(!clauses.length||clauses.length>3)return refuse('Which result should we work on first?');
 const intents=new Set(),evidence=[];let websiteContext=surface==='website';
 for(const clause of clauses){
  const words=new Set(clause.match(/[a-z]+/g)||[]),has=k=>concept[k].some(w=>words.has(w));
  const explicitWebsite=has('website');if(explicitWebsite)websiteContext=true;
  const otherTarget=['app','application','invoice','quote','poster','advert','document'].some(w=>words.has(w));
  const reference=websiteContext&&!otherTarget&&(words.has('it')||words.has('its')||words.has('this')||!Array.from(words).some(w=>['hero','heading','gallery','button','section'].includes(w)));
  const websiteTarget=explicitWebsite||reference;let intent;
  if(has('offer')&&websiteTarget&&/\b(put|add|use|show|update)\b/.test(clause))intent='reuse-reviewed-content';
  else if((has('enquiry')&&(has('work')||/\b(help|sort|turn|about)\b/.test(clause)))||/\b(someone|somebody|customer)\b/.test(clause)&&words.has('asked')&&/\b(services|service)\b/.test(clause))intent='enquiry-to-work';
  else if(has('mobile')&&has('reading')&&websiteTarget)intent='mobile-readability';
  else if(has('quality')&&websiteTarget)intent='professional-presentation';
  else if(!explicitWebsite&&!otherTarget&&has('demand')&&(has('work')||words.has('spare')&&has('time'))&&(has('time')||words.has('next')))intent='fill-spare-time';
  else if(has('customers')&&has('demand'))intent='customer-acquisition';
  else return refuse('I can help, but which result should I prepare first?');
  intents.add(intent);evidence.push({intent,websiteReferent:websiteTarget?'current-website':null});
 }
 const labels=[...intents];if(labels.length>1&&!labels.every(x=>['mobile-readability','professional-presentation'].includes(x)))return refuse('Would you like to improve the website or prepare new work first?');
 return {version:1,recognised:true,intents:labels,evidence,method:'bounded-contextual-concepts',mayExecute:false,providerCalls:0};
}
