import {websiteCreativeSourcesCurrent} from './websiteCreativeSpecification.mjs';
import {websiteOwnerLocks} from './websiteOwnerLocks.mjs';
import {validPublicBusinessContent,contentPrice} from './businessContentRecords.mjs';

// A transient projection of ORIGINAL approved sources and protected wording.
// This is not a business-information store or an automatic truth/entailment check.
export const WEBSITE_CREATIVE_COPY_VERSION='busy.website-creative-copy.v1';
const list=value=>Array.isArray(value)?value:[];
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const exact=(value,keys)=>object(value)&&Object.keys(value).sort().join(',')===[...keys].sort().join(',');
const clone=value=>JSON.parse(JSON.stringify(value));
const plain=(value,max=6000)=>typeof value==='string'&&value.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
const text=value=>typeof value==='string'?value:'';
const id=value=>typeof value==='string'&&/^[-a-zA-Z0-9_:]{1,400}$/.test(value);
const revision=value=>Number.isSafeInteger(value)&&value>0;
const normalize=value=>value.normalize('NFKC').toLocaleLowerCase('en').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
const fail=(reason,extra={})=>({ok:false,reason,...extra});
const ownScope=(draft,value)=>![value?.businessId,value?.business_id].some(value=>value&&value!==draft.businessId);

function originalSources(draft){
 if(!draft?.businessId||!draft.id||!revision(draft.generation)||!websiteCreativeSourcesCurrent(draft))return fail('Review the current owner business, original website and approved sources first.');
 const locks=websiteOwnerLocks(draft);if(!locks.ok)return fail(locks.reason);
 const sources=[],seen=new Set();
 const add=(sourceId,kind,field,value,{recordRevision=draft.generation,target=null,ownerProtected=false,authority='original-approved-source',recordId=null}={})=>{
  if(!plain(value)||!value.trim())return;
  if(!id(sourceId)||seen.has(sourceId)||!revision(recordRevision))throw Error('Ambiguous original copy source');
  seen.add(sourceId);sources.push({id:sourceId,revision:recordRevision,kind,field,text:value,target,ownerProtected,authority,...recordId?{recordId}:{}});
 };
 try{
  for(const [key,field] of [['name','businessName'],['type','businessType'],['description','description'],['serviceArea','serviceArea']])add('business:'+key,'business',field,draft[field]);
  for(const section of list(draft.sections)){
   if(!ownScope(draft,section))return fail('A website copy source belongs to another business.');
   const locked=locks.locks.includes('all')||locks.locks.includes(section.id);
   if(section.creativeGenerated===true||section.type==='creative-document'){
    // A later owner edit is protected wording, never a newly verified fact.
    for(const item of list(section.items))if(list(item.ownerEditedFields).includes('body')||item.creativeCopy?.classification==='owner-authored'){
     add('owner-copy:'+section.id+':'+item.id+':body','owner-copy','body',item.body,{target:{sectionId:section.id,itemId:item.id,field:'body'},ownerProtected:true,authority:'protected-owner-wording-only'});
    }
    continue;
   }
   const ownerFields=list(section.ownerEditedFields);
   for(const field of ['title','body',...(section.type==='hero'?['cta']:[]),...(section.type==='contact'?['email','phone','openingHours']:[])]){
    add('section:'+section.id+':'+field,'section',field,section[field],{target:{sectionId:section.id,field},ownerProtected:locked||ownerFields.includes(field)});
   }
   if(section.type==='services')for(const item of list(section.items)){
    if(!ownScope(draft,item))return fail('A service wording source belongs to another business.');
    for(const field of ['title','body'])add('service:'+section.id+':'+item.id+':'+field,'service',field,item[field],{target:{sectionId:section.id,itemId:item.id,field},ownerProtected:locked||section.ownerEditedItems===true||list(item.ownerEditedFields).includes(field)});
   }
   if(section.type==='faq')for(const item of list(section.items))for(const field of ['title','body'])add('faq:'+section.id+':'+item.id+':'+field,'section',field,item[field],{target:{sectionId:section.id,itemId:item.id,field},ownerProtected:locked||section.ownerEditedItems===true||list(item.ownerEditedFields).includes(field)});
   if(section.type==='testimonials'&&section.ownerEditedItems===true)for(const item of list(section.items))for(const field of ['body','name','author','quote'])add('testimonial:'+section.id+':'+item.id+':'+field,'testimonial',field,item[field],{target:{sectionId:section.id,itemId:item.id,field},ownerProtected:true,authority:'owner-supplied-evidence-not-independently-verified'});
   if(['products','events'].includes(section.type)&&section.enabled!==false){
    const feed=section.previewFeed;
    if(!validPublicBusinessContent(feed)||feed.businessId!==draft.businessId)return fail('Review the current original product or event source.');
    for(const record of feed.records){
     if(record.kind==='product'&&record.data.status!=='active'||record.kind==='event'&&(record.data.status!=='scheduled'||Date.parse(record.data.endsAt)<=Date.now()))continue;
     for(const field of ['name','description','category',...(record.kind==='event'?['startsAt','endsAt','timeZone','location']:[])])add('record:'+section.id+':'+record.id+':'+field,'record',field,record.data[field],{recordRevision:record.revision,recordId:record.id});
     if(record.kind==='product')add('record:'+section.id+':'+record.id+':price','record','price',contentPrice(record.data.amountMinor,record.data.currency,'en-GB'),{recordRevision:record.revision,recordId:record.id});
    }
   }
   const assets=section.type==='gallery'?list(section.items):['hero','photo-feature'].includes(section.type)?[section.asset].filter(Boolean):[];
   for(const asset of assets)if(asset?.sha256&&revision(asset.revision)&&ownScope(draft,asset)&&asset.approved===true){
    const key='photo:'+asset.sha256+':alt';
    const prior=sources.find(source=>source.id===key);
    if(prior&&(prior.revision!==asset.revision||prior.text!==asset.alt))return fail('The same photograph has conflicting approved source details. Review its current identity and description.');
    if(!prior)add(key,'photo','alt',asset.alt,{recordRevision:asset.revision,authority:'approved-asset-description-not-business-evidence'});
   }
  }
 }catch{return fail('Review unambiguous current source identities and revisions before writing new copy.');}
 if(sources.length>600)return fail('Review a smaller current source catalogue for this creative proposal.');
 const missing=[];
 if(!sources.some(source=>source.id==='business:description'))missing.push({id:'business-description',question:'What would you most like customers to understand about your business?'});
 return {ok:true,version:WEBSITE_CREATIVE_COPY_VERSION,scope:{businessId:draft.businessId,websiteId:draft.id,generation:draft.generation},sources,missing,limitations:['Sources are original owner-approved information, not independent legal or factual verification.','Creative wording is a proposal requiring owner factual review; references and deterministic checks cannot prove every paraphrase is entailed.','Protected owner wording and illustrative image descriptions are not new canonical business facts.']};
}

export function websiteCreativeCopyCatalog(draft){return originalSources(draft);}

function matchingTarget(a,b){
 return !!a&&!!b&&a.sectionId===b.sectionId&&a.field===b.field&&(a.itemId||null)===(b.itemId||null);
}
function validTarget(target){return target===null||object(target)&&Object.keys(target).every(key=>['sectionId','itemId','field'].includes(key))&&id(target.sectionId)&&['title','body','cta','email','phone','openingHours'].includes(target.field)&&(target.itemId===undefined||id(target.itemId));}

// Deliberately conservative hard failures for consequential claims. A reviewed
// original factual statement can still be displayed EXACTLY with `verbatim`.
// These rules do not make arbitrary generated prose factually verified.
const consequential=/\b(?:award(?:s|ed|winning)?|award[- ]winning|accredit(?:ed|ation)?|certif(?:ied|ication)|qualif(?:ied|ication|ications)|licen[cs](?:ed|e)|insured|insurance|registered|accomplished|expert(?:s|ise)?|specialist(?:s)?|experienced|experience|guarantee(?:d|s)?|warranty|warranties|testimonial(?:s)?|reviews?|ratings?|five[- ]star|5[- ]star|trusted(?: by)?|best[- ](?:rated|selling)|leading|number one|no\.?\s*1|top[- ]rated|since\s+(?:\d|our)|\d+\s*(?:years?|customers?|clients?|projects?|jobs?|events?)|(?:hundreds?|thousands?|millions?)\s+of|years?\s+(?:of|in)|founded|established|completed\s+(?:work|projects?|jobs?)|past\s+(?:customers?|clients?|events?|projects?)|customer\s+(?:results?|success|satisfaction)|our\s+(?:customers?|clients?)\s+(?:love|say|rate|recommend)|proven\s+results?|increase(?:d|s)?\s+(?:sales|revenue|profits?)|guaranteed\s+results?|carbon[- ]neutral|organic|vegan|allergen[- ]free|gluten[- ]free|award|availability|available\s+(?:today|now|immediately)|same[- ]day|24[- /]?7|instant\s+quote|book(?:ing)?\s+(?:now|online)|order\s+(?:now|online)|buy\s+now|pay\s+(?:now|online)|checkout|limited[- ]time|discount|\d+\s*%\s*(?:off|saving)|free\s+(?:delivery|consultation|quote)|delivery\s+included)\b/iu;
const attributedQuote=/["“][^"”]{4,}["”]\s*[-—–]\s*\p{Lu}|[-—–]\s*\p{Lu}[\p{L}'’-]+(?:\s+\p{Lu}[\p{L}'’-]+)?\s*$/u;
const dangerous=/<\s*\/?\s*(?:script|style|iframe|object|embed|svg|math|link|meta|html|body)\b|javascript\s*:|data\s*:\s*text\/html/iu;
const currency=/[£$€¥]|\b(?:GBP|USD|EUR)\s*\d|\b\d+(?:[.,]\d+)?\s*(?:pounds?|dollars?|euros?)\b/iu;
const contact=/https?:\/\/|www\.|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu;
const dated=/\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|June|July|August|September|October|November|December)\b/u;
const foreignOffer=/\b(?:plumbing|electrician|electrical\s+work|roofing|dental|dentistry|implants|massage|psychotherapy|tax\s+advice|legal\s+advice|solar\s+panels?|swimming\s+pools?|gas\s+fitting|surgery|medical\s+treatment|landscaping|catering|yoga|accountancy|bookkeeping)\b/giu;
const materialClaim=/\b(?:sustainably?\s+(?:grown|sourced|made)|locally\s+(?:grown|sourced|produced)|fair[- ]trade|ethically\s+(?:made|sourced)|our\s+(?:own\s+)?(?:premises|showroom|workshop|kitchen)|(?:pictured|shown)\s+(?:here|above|below)\s+(?:is|are)\s+our|our\s+(?:actual|completed|previous)\s+(?:dishes|products|projects|work|events))\b/iu;
const writtenQuantity=/\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred|thousand|million)(?:[ -]+(?:and|one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million))*\s+(?:years?|months?|decades?|customers?|clients?|guests?|projects?|jobs?|events?|awards?|branches|locations|employees|designers|gardeners|chefs)\b/iu;
function hardClaimReason(value,sources){
 // Compatibility glyphs must not evade numeric/claim checks while looking
 // identical in the rendered page. Original displayed wording stays intact.
 value=value.normalize('NFKC');
 const corpus=sources.filter(source=>!['photo','owner-copy'].includes(source.kind)).map(source=>normalize(source.text)).join('\n');
 if(consequential.test(value)||attributedQuote.test(value)||materialClaim.test(value)||writtenQuantity.test(value))return 'New qualifications, history, reviews, results, guarantees, availability, provenance or transactional claims need an exact approved original statement; keep them verbatim or ask the owner.';
 if(currency.test(value))return 'Prices and commercial offers must use the exact original approved listing or statement; creative copy cannot invent or recombine a price promise.';
 if(contact.test(value))return 'Contact destinations and URLs come from original supported routes, not newly written copy.';
 if(dated.test(value)&&!sources.some(source=>source.text===value))return 'Dates and availability need exact current approved source wording.';
 const numbers=value.match(/\d+(?:[.,]\d+)*/g)||[];
 for(const number of numbers)if(!sources.some(source=>(source.text.normalize('NFKC').match(/\d+(?:[.,]\d+)*/g)||[]).includes(number)))return 'A number in this wording has no exact referenced approved source. Ask for the missing fact rather than invent it.';
 for(const offered of value.match(foreignOffer)||[])if(!corpus.includes(normalize(offered)))return 'This wording introduces a service or business capability absent from its referenced approved information.';
 for(const location of value.matchAll(/\b(?:in|across|throughout|serving|based\s+in)\s+(\p{Lu}[\p{L}'’-]+(?:\s+\p{Lu}[\p{L}'’-]+){0,2})/gu))if(!corpus.includes(normalize(location[1])))return 'This wording introduces a named location absent from its referenced approved information.';
 return '';
}

export function validateWebsiteCreativeCopy(draft,copy,{target=null,rewriteTargets=[],forEdit=true}={}){
 const catalog=websiteCreativeCopyCatalog(draft);if(!catalog.ok)return catalog;
 if(!exact(copy,['text','classification','sourceRefs'])||!plain(copy.text)||!copy.text.trim()||!['verbatim','derived'].includes(copy.classification)||!Array.isArray(copy.sourceRefs)||!copy.sourceRefs.length||copy.sourceRefs.length>12||dangerous.test(copy.text))return fail('Use plain, source-referenced wording; executable markup and unsupported copy shapes are unavailable.');
 if(!validTarget(target)||!Array.isArray(rewriteTargets)||rewriteTargets.length>100||rewriteTargets.some(value=>!validTarget(value)||value===null))return fail('Review exact owner rewrite targets through the original approval path.');
 const sources=[],seen=new Set();
 for(const ref of copy.sourceRefs){
  if(!exact(ref,['id','revision'])||!id(ref.id)||!revision(ref.revision)||seen.has(ref.id))return fail('Use distinct exact original copy-source identities and revisions.');
  seen.add(ref.id);const source=catalog.sources.find(source=>source.id===ref.id&&source.revision===ref.revision);
  if(!source)return fail('An original copy source changed, was removed or belongs to another business. Prepare a fresh proposal.');sources.push(source);
 }
 if(copy.classification==='verbatim'&&!sources.some(source=>source.text===copy.text))return fail('Verbatim wording must match one exact current approved source, including punctuation.');
 if(copy.classification==='derived'){
  if(sources.every(source=>['owner-copy','photo'].includes(source.kind)))return fail('Protected wording and image descriptions are not authority to invent business facts. Reference original approved business information as well.');
  // Even a true critical fact is not paraphrased into an unchecked new claim.
  // A separate exact fact node can sit beside genuinely original editorial text.
  const reason=hardClaimReason(copy.text,sources);if(reason)return fail(reason,{question:'Which exact approved information supports this statement?'});
 }
 if(forEdit&&target){
  const protectedSource=catalog.sources.find(source=>source.ownerProtected&&matchingTarget(source.target,target));
  if(protectedSource&&copy.text!==protectedSource.text&&!rewriteTargets.some(grant=>matchingTarget(grant,target)))return fail('This is protected owner wording. Keep it exactly or request an explicit rewrite for this field.');
 }
 const provenance={version:WEBSITE_CREATIVE_COPY_VERSION,classification:copy.classification,scope:clone(catalog.scope),sources:sources.map(source=>({id:source.id,revision:source.revision,kind:source.kind,field:source.field,text:source.text,authority:source.authority,...source.recordId?{recordId:source.recordId}:{}})),ownerReviewRequired:true,canonicalFactWriteAllowed:false};
 return {ok:true,copy:clone(copy),provenance,warnings:copy.classification==='derived'?['Creative wording derived from cited approved information; owner factual review is still required. References do not prove every paraphrase is entailed.']:['Exact original wording retained; owner declaration is not independent factual or legal verification.']};
}

export function websiteCreativeCopyProvenanceCurrent(draft,provenance){
 const catalog=websiteCreativeCopyCatalog(draft);
 if(!catalog.ok||!exact(provenance,['version','classification','scope','sources','ownerReviewRequired','canonicalFactWriteAllowed'])||provenance.version!==WEBSITE_CREATIVE_COPY_VERSION||!['verbatim','derived'].includes(provenance.classification)||!exact(provenance.scope,['businessId','websiteId','generation'])||provenance.scope.businessId!==draft.businessId||provenance.scope.websiteId!==draft.id||!revision(provenance.scope.generation)||provenance.scope.generation>draft.generation||provenance.ownerReviewRequired!==true||provenance.canonicalFactWriteAllowed!==false||!Array.isArray(provenance.sources)||!provenance.sources.length||provenance.sources.length>12)return false;
 const seen=new Set();
 return provenance.sources.every(source=>{
  if(!object(source)||Object.keys(source).some(key=>!['id','revision','kind','field','text','authority','recordId'].includes(key))||!id(source.id)||seen.has(source.id)||!revision(source.revision)||!plain(source.text))return false;
  seen.add(source.id);const current=catalog.sources.find(value=>value.id===source.id);
  // Original listing and media revisions remain exact. For Website source
  // fields, a layout-only generation increment does not change their truth.
  return !!current&&source.kind===current.kind&&source.field===current.field&&source.text===current.text&&source.authority===current.authority&&(source.recordId||null)===(current.recordId||null)&&(['record','photo'].includes(source.kind)?source.revision===current.revision:source.revision<=current.revision);
 });
}

// The compiler passes ONLY genuinely visible text nodes here. An exact owner
// headline hidden in image alt/SEO/metadata does not preserve the owner's page.
// `preservedSourceIds` must be derived from retained visible original sections
// or independently validated original destinations, never from model output.
export function validateWebsiteCreativeCopyCoverage(draft,visibleCopies,{ownerRewriteSourceIds=[],preservedSourceIds=[]}={}){
 const catalog=websiteCreativeCopyCatalog(draft);if(!catalog.ok)return catalog;
 if(!Array.isArray(visibleCopies)||visibleCopies.length>400||!Array.isArray(ownerRewriteSourceIds)||!Array.isArray(preservedSourceIds)||ownerRewriteSourceIds.length>100||preservedSourceIds.length>600||new Set(ownerRewriteSourceIds).size!==ownerRewriteSourceIds.length||new Set(preservedSourceIds).size!==preservedSourceIds.length||[...ownerRewriteSourceIds,...preservedSourceIds].some(value=>!catalog.sources.some(source=>source.id===value)))return fail('Review exact owner wording coverage and explicit rewrite permissions.');
 const shown=visibleCopies.filter(entry=>object(entry)&&entry.role==='visible-text'&&object(entry.copy));
 const missing=catalog.sources.filter(source=>source.ownerProtected&&!ownerRewriteSourceIds.includes(source.id)&&!preservedSourceIds.includes(source.id)&&!shown.some(entry=>entry.copy.text===source.text&&list(entry.copy.sourceRefs).some(ref=>ref.id===source.id&&ref.revision===source.revision)));
 return missing.length?fail('The proposed page omits protected owner wording. Keep it visibly or explicitly request a rewrite/removal for those exact fields.',{missingSourceIds:missing.map(source=>source.id)}):{ok:true,protectedSources:catalog.sources.filter(source=>source.ownerProtected).map(source=>source.id),canonicalFactWriteAllowed:false};
}
