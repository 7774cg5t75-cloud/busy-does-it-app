// Owner-authored public information, never private customer records or ratings.
const COLLECTION_FIELDS=Object.freeze({faqs:['question','answer'],testimonials:['attribution','text']});
function validPublicCollection(field,value){
 const fields=Object.hasOwn(COLLECTION_FIELDS,field)?COLLECTION_FIELDS[field]:null;
 if(!fields||!Array.isArray(value)||value.length>20)return false;
 const ids=new Set(),titles=new Set();
 return value.every(row=>{
  if(!row||typeof row!=='object'||Array.isArray(row)||Object.keys(row).some(k=>!['id',...fields].includes(k)))return false;
  if(row.id!==undefined&&(typeof row.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(row.id)||ids.has(row.id)))return false;
  if(row.id)ids.add(row.id);
  if(fields.some((k,i)=>typeof row[k]!=='string'||!row[k].trim()||row[k].length>(i?1200:160)||/[<>\u0000-\u001f\u007f]/.test(row[k])))return false;
  const title=row[fields[0]].trim().toLocaleLowerCase('en');
  if(field==='faqs'&&titles.has(title))return false;
  titles.add(title);return true;
 });
}
function publicCollection(field,value){
 return validPublicCollection(field,value)?value.map(row=>Object.fromEntries(['id',...COLLECTION_FIELDS[field]].filter(k=>Object.hasOwn(row,k)).map(k=>[k,row[k]]))):[];
}
export {COLLECTION_FIELDS,validPublicCollection,publicCollection};

// Add missing owner-reviewed answers; never replace destination-specific wording.
function mergeMissingPublicCollection(field,existing,incoming){
 if(!validPublicCollection(field,existing)||!validPublicCollection(field,incoming))return {ok:false,reason:'Review the existing and incoming public information before copying.'};
 const title=COLLECTION_FIELDS[field][0],normal=value=>value.trim().replace(/\s+/g,' ').toLocaleLowerCase('en');
 const byTitle=new Map(existing.map(row=>[normal(row[title]),row]));
 const ids=new Set(existing.map(row=>row.id).filter(Boolean)),added=[],conflicts=[];
 for(const row of incoming){
  const old=byTitle.get(normal(row[title]));
  if(old){if(COLLECTION_FIELDS[field].some(k=>normal(old[k])!==normal(row[k])))conflicts.push(row[title]);continue;}
  if(row.id&&ids.has(row.id)){conflicts.push(row[title]);continue;}
  added.push({...row});byTitle.set(normal(row[title]),row);if(row.id)ids.add(row.id);
 }
 const value=[...existing.map(row=>({...row})),...added];
 if(!validPublicCollection(field,value))return {ok:false,reason:'The combined public information exceeds the supported limit. Choose entries separately.'};
 return {ok:true,value,added,conflicts,preservesExisting:true,requiresOwnerReview:true};
}
export {mergeMissingPublicCollection};
