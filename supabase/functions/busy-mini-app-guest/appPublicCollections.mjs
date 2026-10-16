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
