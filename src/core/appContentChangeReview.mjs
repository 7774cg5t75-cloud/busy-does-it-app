// Read-only owner review of finite PUBLIC draft fields, never customer records.
import {validatePrivateAppServices} from './appServiceCollection.mjs';
import {validPublicCollection} from './appPublicCollections.mjs';
import {validGalleryDescriptionText} from './appGalleryDescription.mjs';
const fail=reason=>({ok:false,reason,rows:[],savesNothing:true});
const norm=value=>typeof value==='string'?value.trim().normalize('NFKC').toLocaleLowerCase('en'):'';
function reviewAppContentChanges(original,proposed){
 if(!original||!proposed)return fail('Two current app configurations are required.');
 const rows=[];
 const add=(subject,field,before,after,kind='changed')=>{if(before!==after)rows.push({id:'public-change-'+rows.length,subject,field,before,after,kind});};
 const scalar=(a,b,fields,subject)=>{
  for(const field of fields){const before=a?.[field]??'',after=b?.[field]??'';
   if(typeof before!=='string'||typeof after!=='string'||before.length>2500||after.length>2500)return false;
   add(subject,field,before,after);
  }return true;
 };
 const profile=original.publicProfile||{},next=proposed.publicProfile||{};
 if(!scalar(profile,next,['businessName','tagline','about','description','phone','email','openingHours'],'Business information'))return fail('Review the current public business wording first.');
 const collection=(before,after,{name,subject,fields,validator})=>{
  if(!validator(before)||!validator(after))return false;
  const keys=items=>items.map(row=>row.id?'id:'+row.id:'name:'+norm(row[name]));
  const first=keys(before),last=keys(after);
  if(new Set(first).size!==first.length||new Set(last).size!==last.length)return false;
  for(let i=0;i<before.length;i++){
   const at=last.indexOf(first[i]),row=before[i],label=subject+': '+row[name];
   if(at<0){add(label,'entry',fields.map(field=>row[field]||'').join(' • '),'','removed');continue;}
   if(!scalar(row,after[at],fields,label))return false;
   if(i!==at)add(label,'position',String(i+1),String(at+1),'moved');
  }
  for(let i=0;i<after.length;i++)if(!first.includes(last[i]))add(subject+': '+after[i][name],'entry','',fields.map(field=>after[i][field]||'').join(' • '),'added');
  return true;
 };
 if(!collection(profile.services||[],next.services||[],{name:'name',subject:'Service',fields:['name','description','category','priceLabel','durationLabel'],validator:rows=>validatePrivateAppServices(rows).ok}))return fail('The service lists need review before a detailed comparison.');
 for(const [field,name,body,subject]of [['faqs','question','answer','Question'],['testimonials','attribution','text','Testimonial']]){
  if(!collection(profile[field]||[],next[field]||[],{name,subject,fields:[name,body],validator:rows=>validPublicCollection(field,rows)}))return fail('Review the current public '+field+' list before comparison.');
 }
 const gallery=profile.assets?.gallery||[],nextGallery=next.assets?.gallery||[];
 if(![gallery,nextGallery].every(items=>Array.isArray(items)&&items.length<=40))return fail('Review the gallery before comparing descriptions.');
 const approved=image=>image&&(image.approved===true||image.marketingOk===true)&&typeof image.uri==='string';
 // Match media identity internally, never return URLs or unapproved descriptions.
 for(let index=0;index<gallery.length;index++){
  const image=gallery[index];if(!approved(image))continue;
  const matches=nextGallery.filter(item=>approved(item)&&item.uri===image.uri);
  if(matches.length!==1||gallery.filter(item=>item?.uri===image.uri).length!==1)continue;
  for(const field of ['alt','caption']){
   const before=image[field]??null,after=matches[0][field]??null;
   if(!validGalleryDescriptionText(before,field==='alt'?160:240)||!validGalleryDescriptionText(after,field==='alt'?160:240))return fail('Review the existing gallery descriptions first.');
   add('Gallery photo '+(index+1),field,before??'',after??'');
  }
 }
 return {ok:true,rows,changeCount:rows.length,scope:'listed_public_text_and_collections_only',includesCustomerRecords:false,
  savesNothing:true,neverPublishes:true,notVisualAssessment:true};
}
export {reviewAppContentChanges};
